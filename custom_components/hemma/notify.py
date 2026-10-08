"""Cleared notifications, shared by every device and user of the dashboard."""

from __future__ import annotations

import time
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORE_KEY = f"{DOMAIN}.notifications"
DATA_KEY = f"{DOMAIN}_notify"
MAX_IDS = 200
KEEP_DAYS = 30


class NotifyStore:
    """Clear All as one timestamp, single clears as row id -> the row's time."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORE_KEY)
        self.cleared_at = 0
        self.ids: dict[str, float] = {}
        self._subs: set = set()

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.cleared_at = data.get("cleared_at", 0) or 0
        self.ids = dict(data.get("ids") or {})

    def snapshot(self) -> dict[str, Any]:
        return {"cleared_at": self.cleared_at, "ids": self.ids}

    def clear(self, ids: dict[str, float], clear_all: bool) -> None:
        now = time.time() * 1000
        if clear_all:
            self.cleared_at = now
        self.ids.update({str(k): float(v) for k, v in ids.items()})
        horizon = now - KEEP_DAYS * 864e5
        kept = sorted(
            ((k, v) for k, v in self.ids.items() if v >= horizon),
            key=lambda kv: kv[1],
        )[-MAX_IDS:]
        self.ids = dict(kept)
        self._store.async_delay_save(self.snapshot, 1)
        for send in list(self._subs):
            send()

    @callback
    def subscribe(self, send) -> callback:
        self._subs.add(send)

        @callback
        def _unsub() -> None:
            self._subs.discard(send)

        return _unsub


@websocket_api.websocket_command({vol.Required("type"): "hemma/notify/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection, msg: dict) -> None:
    store: NotifyStore = hass.data[DATA_KEY]
    msg_id = msg["id"]

    @callback
    def _send() -> None:
        connection.send_message(websocket_api.event_message(msg_id, store.snapshot()))

    connection.subscriptions[msg_id] = store.subscribe(_send)
    connection.send_result(msg_id)
    _send()


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hemma/notify/clear",
        vol.Optional("ids", default={}): {str: vol.Coerce(float)},
        vol.Optional("all", default=False): bool,
    }
)
@callback
def ws_clear(hass: HomeAssistant, connection, msg: dict) -> None:
    hass.data[DATA_KEY].clear(msg["ids"], msg["all"])
    connection.send_result(msg["id"])


async def async_setup_notify(hass: HomeAssistant) -> None:
    if DATA_KEY in hass.data:
        return
    store = NotifyStore(hass)
    await store.async_load()
    hass.data[DATA_KEY] = store
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_clear)
