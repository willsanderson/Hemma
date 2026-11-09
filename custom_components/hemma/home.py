"""Hemma's home-wide settings, shared by every dashboard and device: Status badges and per-entity options."""

from __future__ import annotations

import copy
import re
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORE_KEY = f"{DOMAIN}.home"
DATA_KEY = f"{DOMAIN}_home"
MAX_BADGES = 40

STATE_SCHEMA = vol.Schema(
    {
        vol.Optional("label", default=""): str,
        vol.Optional("color", default=""): str,
        vol.Optional("icon", default=""): str,
        vol.Optional("show", default=True): bool,
    }
)

BADGE_SCHEMA = vol.Schema(
    {
        vol.Required("id"): vol.All(str, vol.Match(r"^[a-z0-9_-]{1,40}$")),
        vol.Required("entity"): vol.All(str, vol.Match(r"^[a-z0-9_]+\.[a-z0-9_]+$")),
        vol.Optional("name", default=""): str,
        vol.Optional("time_entity"): vol.Any(None, vol.All(str, vol.Match(r"^[a-z0-9_]+\.[a-z0-9_]+$"))),
        vol.Optional("rooms", default=["home"]): [vol.All(str, vol.Match(r"^(home|room_[a-z0-9]+)$"))],
        vol.Optional("states", default={}): {str: STATE_SCHEMA},
    }
)


ENTITY_ID = r"^[a-z0-9_]+\.[a-z0-9_]+$"
ENTITY_OPTIONS_SCHEMA = vol.Schema({vol.Optional("tap"): vol.In(["normal", "confirm", "view"])})


class HomeStore:
    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORE_KEY)
        self.data: dict[str, Any] = {"status_badges": [], "entities": {}, "ai_entity": ""}
        self._subs: set = set()

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        badges = []
        for b in data.get("status_badges") or []:
            try:
                badges.append(BADGE_SCHEMA(b))
            except vol.Invalid:
                continue
        entities = {}
        for eid, opts in (data.get("entities") or {}).items():
            try:
                clean = ENTITY_OPTIONS_SCHEMA(opts)
            except vol.Invalid:
                continue
            if clean and re.match(ENTITY_ID, eid):
                entities[eid] = clean
        ai = data.get("ai_entity") or ""
        self.data = {"status_badges": badges, "entities": entities,
                     "ai_entity": ai if isinstance(ai, str) and re.match(ENTITY_ID, ai) else ""}

    def snapshot(self) -> dict[str, Any]:
        return copy.deepcopy(self.data)

    def _changed(self) -> None:
        self._store.async_delay_save(self.snapshot, 1)
        for send in list(self._subs):
            send()

    def set_badge(self, badge: dict[str, Any]) -> None:
        badges = [b for b in self.data["status_badges"] if b["id"] != badge["id"]]
        at = next((i for i, b in enumerate(self.data["status_badges"]) if b["id"] == badge["id"]), len(badges))
        badges.insert(at, badge)
        self.data["status_badges"] = badges[:MAX_BADGES]
        self._changed()

    def remove_badge(self, badge_id: str) -> None:
        self.data["status_badges"] = [b for b in self.data["status_badges"] if b["id"] != badge_id]
        self._changed()

    def set_entity(self, entity_id: str, options: dict[str, Any]) -> None:
        entities = dict(self.data.get("entities") or {})
        merged = {**entities.get(entity_id, {}), **options}
        merged = {k: v for k, v in merged.items() if not (k == "tap" and v == "normal")}
        if merged:
            entities[entity_id] = merged
        else:
            entities.pop(entity_id, None)
        self.data["entities"] = entities
        self._changed()

    def set_ai_entity(self, entity_id: str) -> None:
        self.data["ai_entity"] = entity_id
        self._changed()

    @callback
    def subscribe(self, send) -> callback:
        self._subs.add(send)

        @callback
        def _unsub() -> None:
            self._subs.discard(send)

        return _unsub


@websocket_api.websocket_command({vol.Required("type"): "hemma/home/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection, msg: dict) -> None:
    store: HomeStore = hass.data[DATA_KEY]
    msg_id = msg["id"]

    @callback
    def _send() -> None:
        connection.send_message(websocket_api.event_message(msg_id, store.snapshot()))

    connection.subscriptions[msg_id] = store.subscribe(_send)
    connection.send_result(msg_id)
    _send()


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "hemma/home/set_status_badge", vol.Required("badge"): BADGE_SCHEMA}
)
@callback
def ws_set_badge(hass: HomeAssistant, connection, msg: dict) -> None:
    hass.data[DATA_KEY].set_badge(msg["badge"])
    connection.send_result(msg["id"])


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "hemma/home/remove_status_badge", vol.Required("badge_id"): str}
)
@callback
def ws_remove_badge(hass: HomeAssistant, connection, msg: dict) -> None:
    hass.data[DATA_KEY].remove_badge(msg["badge_id"])
    connection.send_result(msg["id"])


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "hemma/home/set_entity",
        vol.Required("entity_id"): vol.All(str, vol.Match(ENTITY_ID)),
        vol.Required("options"): ENTITY_OPTIONS_SCHEMA,
    }
)
@callback
def ws_set_entity(hass: HomeAssistant, connection, msg: dict) -> None:
    hass.data[DATA_KEY].set_entity(msg["entity_id"], msg["options"])
    connection.send_result(msg["id"])


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "hemma/home/set_ai_entity",
        vol.Required("entity_id"): vol.Any("", vol.All(str, vol.Match(r"^ai_task\.[a-z0-9_]+$"))),
    }
)
@callback
def ws_set_ai_entity(hass: HomeAssistant, connection, msg: dict) -> None:
    hass.data[DATA_KEY].set_ai_entity(msg["entity_id"])
    connection.send_result(msg["id"])


async def async_setup_home(hass: HomeAssistant) -> None:
    if DATA_KEY in hass.data:
        return
    store = HomeStore(hass)
    await store.async_load()
    hass.data[DATA_KEY] = store
    for cmd in (ws_subscribe, ws_set_badge, ws_remove_badge, ws_set_entity, ws_set_ai_entity):
        websocket_api.async_register_command(hass, cmd)
