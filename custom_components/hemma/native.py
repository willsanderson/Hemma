"""Hemma's native dashboard (spike): a full-screen panel that draws its own tiles and saves its layout here, with versions."""

from __future__ import annotations

import os
import time

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.frontend import async_register_built_in_panel, async_remove_panel
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN, URL_BASE

NATIVE_URL = "hemma-native"
# The preview's sidebar entry shows only where this file exists, so a tester can reach it from the iOS app.
PREVIEW_FLAG = "hemma/native_preview"
STORE_KEY = f"{DOMAIN}.native"
KEEP = 30
HISTORY_KEY = f"{DOMAIN}.native_history"
HISTORY_KEEP = 40


def _hstore(hass: HomeAssistant) -> Store[dict]:
    st = hass.data.get(f"{DOMAIN}_native_hstore")
    if st is None:
        st = hass.data[f"{DOMAIN}_native_hstore"] = Store(hass, 1, HISTORY_KEY)
    return st


async def _hload(hass: HomeAssistant) -> list:
    data = await _hstore(hass).async_load()
    items = data.get("items") if isinstance(data, dict) else None
    return items if isinstance(items, list) else []


def _hprune(items: list) -> list:
    loose = [i for i in items if not i.get("pinned")]
    drop = {id(i) for i in loose[:-HISTORY_KEEP]} if len(loose) > HISTORY_KEEP else set()
    return [i for i in items if id(i) not in drop]


def _hbrief(item: dict) -> dict:
    return {k: item.get(k) for k in ("id", "at", "dash", "name", "pinned", "user", "n", "lines")}


@websocket_api.websocket_command({vol.Required("type"): "hemma/native/history/list", vol.Optional("dash"): str})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_hlist(hass: HomeAssistant, connection, msg: dict) -> None:
    items = await _hload(hass)
    dash = msg.get("dash")
    connection.send_result(msg["id"], {"items": [_hbrief(i) for i in items if not dash or i.get("dash") == dash]})


@websocket_api.websocket_command({vol.Required("type"): "hemma/native/history/get", vol.Required("item"): str})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_hget(hass: HomeAssistant, connection, msg: dict) -> None:
    for i in await _hload(hass):
        if i.get("id") == msg["item"]:
            connection.send_result(msg["id"], {"item": i})
            return
    connection.send_error(msg["id"], "not_found", "No such version")


@websocket_api.websocket_command({
    vol.Required("type"): "hemma/native/history/add",
    vol.Required("dash"): str,
    vol.Required("snap"): dict,
    vol.Optional("name"): str,
    vol.Optional("lines"): [str],
    vol.Optional("n"): int,
})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_hadd(hass: HomeAssistant, connection, msg: dict) -> None:
    items = await _hload(hass)
    user = connection.user.name if connection.user else ""
    item = {
        "id": f"{int(time.time() * 1000)}",
        "at": int(time.time()),
        "dash": msg["dash"],
        "name": msg.get("name") or "",
        "pinned": False,
        "user": user,
        "n": msg.get("n") or 0,
        "lines": (msg.get("lines") or [])[:8],
        "snap": msg["snap"],
    }
    items = _hprune(items + [item])
    await _hstore(hass).async_save({"items": items})
    connection.send_result(msg["id"], {"item": _hbrief(item)})


@websocket_api.websocket_command({
    vol.Required("type"): "hemma/native/history/update",
    vol.Required("item"): str,
    vol.Optional("name"): str,
    vol.Optional("pinned"): bool,
    vol.Optional("delete"): bool,
})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_hupdate(hass: HomeAssistant, connection, msg: dict) -> None:
    items = await _hload(hass)
    hit = next((i for i in items if i.get("id") == msg["item"]), None)
    if hit is None:
        connection.send_error(msg["id"], "not_found", "No such version")
        return
    if msg.get("delete"):
        items = [i for i in items if i is not hit]
    else:
        if "name" in msg:
            hit["name"] = msg["name"][:80]
        if "pinned" in msg:
            hit["pinned"] = msg["pinned"]
        items = _hprune(items)
    await _hstore(hass).async_save({"items": items})
    connection.send_result(msg["id"], {"ok": True})


def _store(hass: HomeAssistant) -> Store[dict]:
    st = hass.data.get(f"{DOMAIN}_native_store")
    if st is None:
        st = hass.data[f"{DOMAIN}_native_store"] = Store(hass, 1, STORE_KEY)
    return st


async def _load(hass: HomeAssistant) -> dict:
    data = await _store(hass).async_load()
    return data if isinstance(data, dict) else {"layout": None, "versions": []}


@websocket_api.websocket_command({vol.Required("type"): "hemma/native/get"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_get(hass: HomeAssistant, connection, msg: dict) -> None:
    data = await _load(hass)
    connection.send_result(msg["id"], {"layout": data.get("layout"), "versions": len(data.get("versions") or [])})


@websocket_api.websocket_command({vol.Required("type"): "hemma/native/save", vol.Required("layout"): dict, vol.Optional("note"): str})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_save(hass: HomeAssistant, connection, msg: dict) -> None:
    data = await _load(hass)
    versions = list(data.get("versions") or [])
    if data.get("layout") is not None:
        versions.append({"at": int(time.time()), "note": data.get("note") or "", "layout": data["layout"]})
    data = {"layout": msg["layout"], "note": msg.get("note") or "", "versions": versions[-KEEP:]}
    await _store(hass).async_save(data)
    connection.send_result(msg["id"], {"versions": len(data["versions"])})


@websocket_api.websocket_command({vol.Required("type"): "hemma/native/versions"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_versions(hass: HomeAssistant, connection, msg: dict) -> None:
    data = await _load(hass)
    out = [{"index": i, "at": v.get("at"), "note": v.get("note") or ""} for i, v in enumerate(data.get("versions") or [])]
    connection.send_result(msg["id"], {"versions": out})


@websocket_api.websocket_command({vol.Required("type"): "hemma/native/restore", vol.Required("index"): int})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_restore(hass: HomeAssistant, connection, msg: dict) -> None:
    data = await _load(hass)
    versions = list(data.get("versions") or [])
    if not 0 <= msg["index"] < len(versions):
        connection.send_error(msg["id"], "not_found", "No such version")
        return
    pick = versions[msg["index"]]
    if data.get("layout") is not None:
        versions.append({"at": int(time.time()), "note": "Before restore", "layout": data["layout"]})
    data = {"layout": pick["layout"], "note": "Restored", "versions": versions[-KEEP:]}
    await _store(hass).async_save(data)
    connection.send_result(msg["id"], {"layout": data["layout"]})


async def async_setup_native(hass: HomeAssistant, panel_dir: str) -> None:
    if not hass.data.get(f"{DOMAIN}_native_ws"):
        for cmd in (_ws_get, _ws_save, _ws_versions, _ws_restore, _ws_hlist, _ws_hget, _ws_hadd, _ws_hupdate):
            websocket_api.async_register_command(hass, cmd)
        hass.data[f"{DOMAIN}_native_ws"] = True

    def _stamp() -> int:
        try:
            return int(os.path.getmtime(os.path.join(panel_dir, "hemma-native.js")))
        except OSError:
            return 0

    stamp = await hass.async_add_executor_job(_stamp)
    listed = await hass.async_add_executor_job(os.path.isfile, hass.config.path(PREVIEW_FLAG))
    if not stamp:
        return
    async_remove_panel(hass, NATIVE_URL, warn_if_unknown=False)
    async_register_built_in_panel(
        hass=hass,
        component_name="custom",
        frontend_url_path=NATIVE_URL,
        sidebar_title="Hemma Preview" if listed else None,
        sidebar_icon="mdi:home-variant" if listed else None,
        require_admin=True,
        config={
            "_panel_custom": {
                "name": "hemma-native-panel",
                "embed_iframe": False,
                "trust_external": False,
                "module_url": f"{URL_BASE}/hemma-native.js?v={stamp}",
            }
        },
    )


@callback
def async_unload_native(hass: HomeAssistant) -> None:
    async_remove_panel(hass, NATIVE_URL, warn_if_unknown=False)
