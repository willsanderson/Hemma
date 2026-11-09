"""Plant assessments: a week of a plant's readings, judged by the home's AI task on request."""

from __future__ import annotations

import asyncio
import copy
import logging
import time
from datetime import datetime, timedelta
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

STORE_KEY = f"{DOMAIN}.plant_ai"
DATA_KEY = f"{DOMAIN}_plant_ai"
HOME_KEY = f"{DOMAIN}_home"
COOLDOWN = 60
TIMEOUT = 180
DAYS = 7

KINDS = ("moisture", "temperature", "illuminance", "conductivity", "humidity", "soil_temperature")
LIGHT_TOTALS = ("ppfd", "integral", "dli")
NOT_READINGS = LIGHT_TOTALS + ("vpd", "vapour", "vapor", "co2", "carbon_dioxide", "battery", "signal")
OUTDOOR = ("balcony", "terrace", "patio", "garden", "yard", "porch", "deck", "outdoor", "outside",
           "balkong", "terrass", "trädgård", "uteplats", "altan")
VERDICTS = ("good", "watch", "act")

STRUCTURE = {
    "verdict": {"required": True, "selector": {"select": {"options": list(VERDICTS)}}},
    "summary": {"required": True, "selector": {"text": {}}},
    "points": {"selector": {"text": {"multiple": True}}},
    "tips": {"selector": {"text": {"multiple": True}}},
}

INSTRUCTIONS = """You are an experienced plant keeper. Read this plant's sensor data from the past week and judge how it is doing.
Answer in the language with the code "{lang}", plainly and briefly.

{context}

How to judge:
- Judge by what this species needs, not by the integration's limits. Those limits are generic defaults and can be wrong for the species; use them only as a hint.
- Daily light integral (DLI) is never a criterion. It must not lower the verdict or lead to a tip.
- Room light from other sensors is not measured at the plant. Treat it only as a tendency for how bright the room is.
- Take the season and whether the plant is indoors or outdoors into account, and look at trends (how fast the soil dries, how light and temperature move).
- verdict: good when nothing needs doing, watch when something is drifting, act when the plant needs care now.
- summary: one short sentence, at most 20 words.
- points: 2 to 4 observations, each at most 15 words, each with the key number it is based on.
- tips: 1 to 3 concrete care tips, each at most 15 words (when and how much to water, placement, feeding, winter care). No tip about DLI.
- The answer is shown on a small screen: keep every item to one short line, no lists inside items."""


def reading_kind(translation_key: str | None, device_class: str | None, entity_id: str) -> str | None:
    """What a plant sensor measures, or None for totals, derived values and anything else."""
    tk = (translation_key or "").lower()
    if tk in KINDS:
        return tk
    if tk:
        return None
    oid = entity_id.split(".", 1)[-1].lower()
    if any(w in oid for w in NOT_READINGS):
        return None
    if "soil_temp" in oid:
        return "soil_temperature"
    dc = (device_class or "").lower()
    if dc in ("moisture", "illuminance", "conductivity", "humidity"):
        return dc
    if dc == "temperature":
        return "temperature"
    for word, kind in (("moisture", "moisture"), ("illumin", "illuminance"), ("lux", "illuminance"),
                       ("conductiv", "conductivity"), ("humid", "humidity"), ("temp", "temperature")):
        if word in oid:
            return kind
    return None


def is_outdoors(area_name: str | None) -> bool:
    name = (area_name or "").lower()
    return any(w in name for w in OUTDOOR)


def _num(v: Any) -> float | None:
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if f == f else None


def _fmt(v: float | None, kind: str | None = None) -> str:
    if v is None:
        return "-"
    if kind == "illuminance" or abs(v) >= 100:
        return str(int(round(v)))
    return f"{v:.1f}".rstrip("0").rstrip(".")


def _day(start: Any) -> str:
    if isinstance(start, (int, float)):
        start = datetime.fromtimestamp(start, dt_util.UTC)
    if isinstance(start, str):
        start = dt_util.parse_datetime(start)
    if not isinstance(start, datetime):
        return "?"
    return dt_util.as_local(start).strftime("%b %d")


def _days(rows: list[dict] | None, kind: str | None) -> str:
    out = []
    for r in rows or []:
        if r.get("mean") is None:
            continue
        out.append(f"{_day(r.get('start'))} {_fmt(r.get('mean'), kind)}/{_fmt(r.get('min'), kind)}/{_fmt(r.get('max'), kind)}")
    return "; ".join(out) if out else "no history"


def build_context(plant: dict[str, Any], readings: list[dict[str, Any]], limits: list[dict[str, Any]],
                  room_light: list[dict[str, Any]], area: str | None, today: datetime,
                  latitude: float | None, stats: dict[str, list[dict]]) -> str:
    """The plain-text brief the AI judges from. Pure: everything it needs is passed in."""
    attrs = plant.get("attributes") or {}
    name = attrs.get("friendly_name") or plant.get("entity_id", "")
    lines = [f"Plant: {name}"]
    if attrs.get("species"):
        lines.append(f"Species: {attrs['species']}")
    place = "outdoors" if is_outdoors(area) else "indoors"
    lines.append(f"Location: {area or 'unknown room'} ({place})")
    hemi = ""
    if latitude is not None:
        hemi = f", {'northern' if latitude >= 0 else 'southern'} hemisphere"
    lines.append(f"Today: {today.strftime('%Y-%m-%d')} ({today.strftime('%B')}{hemi})")
    care = [f"{k[5:]}: {v}" for k, v in sorted(attrs.items()) if k.startswith("care_") and v]
    if care:
        lines.append("Care notes from the plant database: " + " | ".join(care))
    status = [f"{k[:-7]}={v}" for k, v in sorted(attrs.items())
              if k.endswith("_status") and v not in (None, "", "ok") and not k.startswith(("dli", "vpd"))]
    lines.append("Integration flags: " + (", ".join(status) if status else "none"))
    problems = attrs.get("problems")
    lines.append(f"Problems reported: {problems if problems else 'none'}")
    if limits:
        lines.append("Integration limits (generic defaults): " + ", ".join(
            f"{l['name']} {_fmt(l['value'])}{l.get('unit') or ''}" for l in limits))
    lines.append(f"Readings, last {DAYS} days (per day: mean/min/max):")
    for r in readings:
        unit = r.get("unit") or ""
        now = _fmt(_num(r.get("state")), r["kind"])
        lines.append(f"- {r['kind'].replace('_', ' ')} (now {now} {unit}): {_days(stats.get(r['entity_id']), r['kind'])}")
    lines.append("Room light from other sensors in the same room (lux, per day: mean/min/max), tendency only:")
    if room_light:
        for r in room_light:
            now = _fmt(_num(r.get("state")), "illuminance")
            lines.append(f"- {r.get('name') or r['entity_id']} (now {now} lx): {_days(stats.get(r['entity_id']), 'illuminance')}")
    else:
        lines.append("- none")
    return "\n".join(lines)


def clean_result(data: Any) -> dict[str, Any] | None:
    if not isinstance(data, dict):
        return None
    verdict = str(data.get("verdict") or "").strip().lower()
    summary = str(data.get("summary") or "").strip()
    if verdict not in VERDICTS or not summary:
        return None

    def lst(v: Any, n: int) -> list[str]:
        items = v if isinstance(v, list) else [v] if isinstance(v, str) else []
        return [str(x).strip()[:300] for x in items if str(x or "").strip()][:n]

    return {"verdict": verdict, "summary": summary[:400], "points": lst(data.get("points"), 4), "tips": lst(data.get("tips"), 3)}


def _area_of(entry: er.RegistryEntry | None, devices: dr.DeviceRegistry) -> str | None:
    if entry is None:
        return None
    if entry.area_id:
        return entry.area_id
    dev = devices.async_get(entry.device_id) if entry.device_id else None
    return dev.area_id if dev else None


def gather(hass: HomeAssistant, plant_id: str) -> dict[str, Any] | None:
    """The plant's own readings, its limits and the room's light sensors, from the registries."""
    ents = er.async_get(hass)
    devices = dr.async_get(hass)
    entry = ents.async_get(plant_id)
    state = hass.states.get(plant_id)
    if state is None:
        return None
    dev_id = entry.device_id if entry else None
    own = [e for e in ents.entities.values() if dev_id and e.device_id == dev_id and not e.disabled_by]
    readings, limits, sources = [], [], set()
    pname = str(state.attributes.get("friendly_name") or "").strip()
    for e in own:
        st = hass.states.get(e.entity_id)
        if st is None:
            continue
        if e.domain == "sensor":
            kind = reading_kind(e.translation_key, st.attributes.get("device_class") or e.original_device_class, e.entity_id)
            if kind:
                readings.append({"entity_id": e.entity_id, "kind": kind, "state": st.state,
                                 "unit": st.attributes.get("unit_of_measurement")})
            if st.attributes.get("external_sensor"):
                sources.add(st.attributes["external_sensor"])
        elif e.domain == "number":
            oid = e.entity_id.split(".", 1)[1]
            if ("_min_" not in f"_{oid}_" and "_max_" not in f"_{oid}_") or any(w in oid for w in LIGHT_TOTALS):
                continue
            value = _num(st.state)
            if value is None:
                continue
            label = str(st.attributes.get("friendly_name") or oid)
            if pname and label.lower().startswith(pname.lower()):
                label = label[len(pname):].strip()
            limits.append({"name": label.lower(), "value": value, "unit": st.attributes.get("unit_of_measurement")})
    order = {k: i for i, k in enumerate(KINDS)}
    readings.sort(key=lambda r: order.get(r["kind"], 99))

    area_id = _area_of(entry, devices)
    if area_id is None and own:
        area_id = next((a for a in (_area_of(e, devices) for e in own) if a), None)
    area = ar.async_get(hass).async_get_area(area_id) if area_id else None

    probes: set[str] = set()
    for e in ents.entities.values():
        if not e.device_id:
            continue
        if e.domain == "plant" or e.entity_id in sources:
            probes.add(e.device_id)
        elif e.domain == "sensor":
            st = hass.states.get(e.entity_id)
            dc = (st.attributes.get("device_class") if st else None) or e.original_device_class
            if reading_kind(None, dc, e.entity_id) in ("moisture", "conductivity"):
                probes.add(e.device_id)
    room = []
    if area_id:
        for e in ents.entities.values():
            if e.domain != "sensor" or e.disabled_by or e.entity_id in sources or (e.device_id and e.device_id in probes):
                continue
            if _area_of(e, devices) != area_id:
                continue
            st = hass.states.get(e.entity_id)
            if st is None or (st.attributes.get("device_class") or e.original_device_class) != "illuminance":
                continue
            room.append({"entity_id": e.entity_id, "name": st.attributes.get("friendly_name"), "state": st.state})
    return {"plant": {"entity_id": plant_id, "attributes": dict(state.attributes)}, "readings": readings,
            "limits": limits, "room_light": room[:4], "area": area.name if area else None}


async def _statistics(hass: HomeAssistant, ids: list[str]) -> dict[str, list[dict]]:
    if not ids:
        return {}
    try:
        from homeassistant.components.recorder import get_instance
        from homeassistant.components.recorder.statistics import statistics_during_period

        start = dt_util.start_of_local_day() - timedelta(days=DAYS - 1)
        return await get_instance(hass).async_add_executor_job(
            statistics_during_period, hass, start, None, set(ids), "day", None, {"mean", "min", "max"}
        ) or {}
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Hemma: plant statistics unavailable: %s", err)
        return {}


def ai_entities(hass: HomeAssistant) -> list[str]:
    ids = sorted(hass.states.async_entity_ids("ai_task"))
    return [e for e in ids if int(hass.states.get(e).attributes.get("supported_features") or 0) & 1] or ids


async def _generate(hass: HomeAssistant, payload: dict[str, Any]) -> dict[str, Any]:
    home = hass.data.get(HOME_KEY)
    chosen = home.data.get("ai_entity") if home else None
    if chosen and hass.states.get(chosen) is None:
        chosen = None

    async def call(data: dict[str, Any]) -> Any:
        return await hass.services.async_call("ai_task", "generate_data", data, blocking=True, return_response=True)

    if chosen:
        return dict(await call({**payload, "entity_id": chosen}) or {})
    try:
        return dict(await call(payload) or {})
    except ServiceValidationError:
        first = (ai_entities(hass) or [None])[0]
        if not first:
            raise
        return dict(await call({**payload, "entity_id": first}) or {})


class PlantAIStore:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORE_KEY)
        self.plants: dict[str, dict[str, Any]] = {}
        self._subs: set = set()
        self._started: dict[str, float] = {}

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        plants = {}
        for eid, rec in (data.get("plants") or {}).items():
            if not isinstance(rec, dict):
                continue
            if rec.get("status") == "running":
                rec = {**rec, "status": "done" if rec.get("verdict") else "error", "error": "" if rec.get("verdict") else "failed"}
            plants[eid] = rec
        self.plants = plants

    def snapshot(self) -> dict[str, Any]:
        return {"plants": copy.deepcopy(self.plants)}

    def _set(self, eid: str, **fields: Any) -> None:
        self.plants[eid] = {**self.plants.get(eid, {}), **fields}
        self._store.async_delay_save(self.snapshot, 1)
        for send in list(self._subs):
            send()

    def start(self, eid: str) -> str | None:
        if self.plants.get(eid, {}).get("status") == "running":
            return "busy"
        now = time.monotonic()
        if now - self._started.get(eid, -COOLDOWN) < COOLDOWN:
            return "cooldown"
        if not self.hass.services.has_service("ai_task", "generate_data") or not self.hass.states.async_entity_ids("ai_task"):
            self._set(eid, status="error", error="no_ai")
            return None
        self._started[eid] = now
        self._set(eid, status="running", error="")
        self.hass.async_create_background_task(self._run(eid), f"hemma_plant_ai_{eid}")
        return None

    async def _run(self, eid: str) -> None:
        hass = self.hass
        try:
            info = gather(hass, eid)
            if not info or not info["readings"]:
                self._set(eid, status="error", error="no_sensors")
                return
            ids = [r["entity_id"] for r in info["readings"] + info["room_light"]]
            stats = await _statistics(hass, ids)
            context = build_context(info["plant"], info["readings"], info["limits"], info["room_light"],
                                    info["area"], dt_util.now(), hass.config.latitude, stats)
            name = info["plant"]["attributes"].get("friendly_name") or eid
            payload = {"task_name": f"Hemma plant assessment: {name}",
                       "instructions": INSTRUCTIONS.format(lang=hass.config.language or "en", context=context),
                       "structure": STRUCTURE}
            async with asyncio.timeout(TIMEOUT):
                resp = await _generate(hass, payload)
            result = clean_result(resp.get("data"))
            if not result:
                self._set(eid, status="error", error="failed")
                return
            self._set(eid, status="done", error="", at=time.time() * 1000, **result)
        except TimeoutError:
            self._set(eid, status="error", error="timeout")
        except HomeAssistantError as err:
            _LOGGER.warning("Hemma: plant assessment for %s failed: %s", eid, err)
            self._set(eid, status="error", error="failed")
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Hemma: plant assessment for %s failed", eid)
            self._set(eid, status="error", error="failed")

    @callback
    def subscribe(self, send) -> callback:
        self._subs.add(send)

        @callback
        def _unsub() -> None:
            self._subs.discard(send)

        return _unsub


@websocket_api.websocket_command({vol.Required("type"): "hemma/plant_ai/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection, msg: dict) -> None:
    store: PlantAIStore = hass.data[DATA_KEY]
    msg_id = msg["id"]

    @callback
    def _send() -> None:
        connection.send_message(websocket_api.event_message(msg_id, store.snapshot()))

    connection.subscriptions[msg_id] = store.subscribe(_send)
    connection.send_result(msg_id)
    _send()


@websocket_api.websocket_command(
    {vol.Required("type"): "hemma/plant_ai/assess", vol.Required("entity_id"): vol.All(str, vol.Match(r"^plant\.[a-z0-9_]+$"))}
)
@callback
def ws_assess(hass: HomeAssistant, connection, msg: dict) -> None:
    if hass.states.get(msg["entity_id"]) is None:
        connection.send_error(msg["id"], "not_found", "Unknown plant")
        return
    refused = hass.data[DATA_KEY].start(msg["entity_id"])
    if refused:
        connection.send_error(msg["id"], refused, refused)
        return
    connection.send_result(msg["id"])


async def async_setup_plant_ai(hass: HomeAssistant) -> None:
    if DATA_KEY in hass.data:
        return
    store = PlantAIStore(hass)
    await store.async_load()
    hass.data[DATA_KEY] = store
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_assess)
