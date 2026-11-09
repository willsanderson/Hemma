"""Hemma's helpers, the smart light toggle and the restart buttons, with nothing to add to configuration.yaml."""

from __future__ import annotations

import asyncio
import inspect
import logging
import os
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState, Event, HomeAssistant, ServiceCall, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_call_later, async_track_state_change_event
from homeassistant.util.yaml import load_yaml

from .const import DOMAIN
from .theme import async_repair_theme, theme_offered

_LOGGER = logging.getLogger(__name__)

HELPER_DOMAINS = ("input_boolean", "input_text", "input_select", "input_datetime")
RESTART_DONE = ("input_boolean.hemma_restart_done_1", "input_boolean.hemma_restart_done_2")
SPEC = os.path.join(os.path.dirname(__file__), "helpers.yaml")


def _collection(hass: HomeAssistant, domain: str):
    """The storage collection behind Settings > Helpers for one helper type, or None.

    Home Assistant has no public API for creating UI helpers, so this reaches the
    collection through the websocket command the helper dialog itself uses (the
    approach Casora takes). Any change in that layout lands in the fallback below.
    """
    try:
        handler = hass.data["websocket_api"][f"{domain}/create"][0]
        return inspect.unwrap(handler).__self__.storage_collection
    except Exception:  # noqa: BLE001
        return None


def _status(hass: HomeAssistant, domain: str, key: str, coll) -> str:
    """"ok" when the helper is there, "create" when Hemma can add it, "blocked" when its entity_id is held by something else."""
    if coll is not None and key in (getattr(coll, "data", None) or {}):
        return "ok"
    entity_id = f"{domain}.{key}"
    st = hass.states.get(entity_id)
    if st is not None and not st.attributes.get("restored"):
        return "ok"
    ent = er.async_get(hass).async_get(entity_id)
    if ent is None:
        return "create"
    if ent.disabled_by is not None:
        return "ok"
    # A 2.3 package removed from YAML leaves this entry behind; a UI helper with the same id takes it over.
    if ent.platform == domain and ent.unique_id == key and not ent.config_entry_id:
        return "create"
    return "blocked"


def _conf(domain: str, conf: dict) -> dict:
    conf = dict(conf)
    if domain == "input_text":
        conf.setdefault("max", 255)
    if domain == "input_boolean" and "initial" in conf:
        conf["initial"] = bool(conf["initial"])
    return conf


async def _add_options(coll, key: str, want: list) -> bool:
    item = (getattr(coll, "data", None) or {}).get(key)
    if not item:
        return False
    have = list(item.get("options") or [])
    add = [o for o in want if o not in have]
    if not add:
        return False
    await coll.async_update_item(key, {**{k: v for k, v in item.items() if k != "id"}, "options": have + add})
    return True


async def _ensure(hass: HomeAssistant, dry_run: bool = False) -> dict:
    lock = hass.data.setdefault(f"{DOMAIN}_helpers_lock", asyncio.Lock())
    async with lock:
        return await _ensure_locked(hass, dry_run)


async def _ensure_locked(hass: HomeAssistant, dry_run: bool) -> dict:
    spec: dict[str, Any] = await hass.async_add_executor_job(load_yaml, SPEC)
    created: list[str] = []
    failed: list[str] = []
    updated: list[str] = []
    for domain in HELPER_DOMAINS:
        coll = _collection(hass, domain)
        for key, conf in (spec.get(domain) or {}).items():
            entity_id = f"{domain}.{key}"
            status = _status(hass, domain, key, coll)
            if status == "ok":
                # A dropdown made by an older Hemma gets the options added since; a YAML one is the user's to edit.
                if domain == "input_select" and coll is not None:
                    item = (getattr(coll, "data", None) or {}).get(key) or {}
                    if item and [o for o in conf.get("options") or [] if o not in (item.get("options") or [])]:
                        if dry_run:
                            updated.append(entity_id)
                            continue
                        try:
                            if await _add_options(coll, key, list(conf.get("options") or [])):
                                updated.append(entity_id)
                        except Exception:  # noqa: BLE001
                            _LOGGER.exception("Hemma: could not add the new options of %s", entity_id)
                continue
            if status == "blocked" or coll is None:
                failed.append(entity_id)
                continue
            if dry_run:
                failed.append(entity_id)
                continue
            conf = _conf(domain, conf)
            try:
                # The entity_id comes from the name, so create under the key and then give it its readable name.
                item = await coll.async_create_item({**conf, "name": key})
                await coll.async_update_item(item["id"], {**conf, "name": conf.get("name", key)})
                created.append(entity_id)
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Hemma: could not create %s", entity_id)
                failed.append(entity_id)
    if dry_run:
        return {"missing": failed, "outdated": updated}
    if created:
        _LOGGER.info("Hemma: created %d helper(s): %s", len(created), ", ".join(created))
    if updated:
        _LOGGER.info("Hemma: added new options to %s", ", ".join(updated))
    if failed:
        ir.async_create_issue(
            hass, DOMAIN, "helpers_missing",
            is_fixable=False, severity=ir.IssueSeverity.WARNING,
            translation_key="helpers_missing",
            translation_placeholders={"helpers": ", ".join(failed)},
        )
    else:
        ir.async_delete_issue(hass, DOMAIN, "helpers_missing")
    return {"created": created, "missing": failed, "updated": updated}


async def _smart_toggle(call: ServiceCall) -> None:
    """Off remembers which lights were on; on brings back exactly those, or turns the light on."""
    hass = call.hass
    eid = call.data["light_entity"]
    scene_id = "hemma_restore_" + eid.replace(".", "_")
    st = hass.states.get(eid)
    if st is not None and st.state == "on":
        members = st.attributes.get("entity_id") or [eid]
        await hass.services.async_call("scene", "create", {"scene_id": scene_id, "snapshot_entities": list(members)}, blocking=True)
        try:
            await hass.services.async_call("light", "turn_off", {"entity_id": eid}, blocking=True)
        except Exception:  # noqa: BLE001 - as the script's continue_on_error
            _LOGGER.exception("Hemma: could not turn off %s", eid)
    elif hass.states.get("scene." + scene_id) is not None:
        await hass.services.async_call("scene", "turn_on", {"entity_id": "scene." + scene_id}, blocking=True)
    else:
        await hass.services.async_call("light", "turn_on", {"entity_id": eid}, blocking=True)


@websocket_api.websocket_command({
    vol.Required("type"): "hemma/helpers/select_options",
    vol.Required("entity_id"): str,
    vol.Required("options"): [str],
})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_select_options(hass: HomeAssistant, connection, msg: dict) -> None:
    """Keep a Hemma dropdown's options through a restart: stored for a UI helper, set for the session otherwise."""
    eid, options = msg["entity_id"], msg["options"]
    key = eid.partition(".")[2]
    coll = _collection(hass, "input_select") if eid.startswith("input_select.hemma_") else None
    item = (getattr(coll, "data", None) or {}).get(key) if coll else None
    stored = False
    if item:
        try:
            await coll.async_update_item(key, {**{k: v for k, v in item.items() if k != "id"}, "options": options})
            stored = True
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Hemma: could not store the options of %s", eid)
    if not stored:
        await hass.services.async_call("input_select", "set_options", {"entity_id": eid, "options": options}, blocking=True)
    connection.send_result(msg["id"], {"stored": stored})


@websocket_api.websocket_command({vol.Required("type"): "hemma/setup/check"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_setup_check(hass: HomeAssistant, connection, msg: dict) -> None:
    """The helpers Hemma needs that are not there, without changing anything."""
    res = await _ensure(hass, dry_run=True)
    connection.send_result(msg["id"], {**res, "theme": theme_offered(hass)})


@websocket_api.websocket_command({vol.Required("type"): "hemma/setup/repair"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_setup_repair(hass: HomeAssistant, connection, msg: dict) -> None:
    """Run the setup steps again: the theme back in the list, then any missing helper."""
    theme = await async_repair_theme(hass)
    try:
        res = await _ensure(hass)
    except Exception as err:  # noqa: BLE001
        _LOGGER.exception("Hemma: setup repair failed")
        connection.send_error(msg["id"], "repair_failed", str(err))
        return
    connection.send_result(msg["id"], {**res, "theme": theme})


async def async_setup_helpers(hass: HomeAssistant, entry: ConfigEntry) -> None:
    if not hass.services.has_service(DOMAIN, "light_smart_toggle"):
        hass.services.async_register(DOMAIN, "light_smart_toggle", _smart_toggle, vol.Schema({vol.Required("light_entity"): str}))
    if not hass.data.get(f"{DOMAIN}_helpers_ws"):
        websocket_api.async_register_command(hass, _ws_select_options)
        websocket_api.async_register_command(hass, _ws_setup_check)
        websocket_api.async_register_command(hass, _ws_setup_repair)
        hass.data[f"{DOMAIN}_helpers_ws"] = True

    @callback
    def _restart_done(event: Event) -> None:
        new = event.data.get("new_state")
        if new is None or new.state != "on":
            return
        eid = event.data["entity_id"]

        async def _clear(_now) -> None:
            await hass.services.async_call("input_boolean", "turn_off", {"entity_id": eid})

        async_call_later(hass, 3, _clear)

    entry.async_on_unload(async_track_state_change_event(hass, list(RESTART_DONE), _restart_done))

    async def _run(_event: Event | None = None) -> None:
        try:
            await _ensure(hass)
        except Exception:  # noqa: BLE001 - never block setup over helpers
            _LOGGER.exception("Hemma: could not set up its helpers")

    if hass.state is CoreState.running:
        hass.async_create_task(_run())
    else:
        entry.async_on_unload(hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _run))
