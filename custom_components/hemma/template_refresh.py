"""Bring Hemma's button-card templates up to date in every Hemma dashboard after an update, without a Save in Studio.

Mirrors refreshTemplates() in panel/hemma-panel.js: a template is Hemma's to replace only when its
fingerprint says Hemma wrote it; one the user changed is kept. The fingerprints must match the
panel's byte for byte, so stable() and the FNV hash below copy its JSON.stringify and hashStr exactly.
"""

from __future__ import annotations

import copy
import json
import logging
import math
import os
import time
from typing import Any

from homeassistant.helpers.start import async_at_started
from homeassistant.core import Event, HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

FINGERPRINT_KEY = "hemma_template_fingerprint"
BUNDLE = f"custom_components/{DOMAIN}/panel/hemma-templates.json"
BACKUPS = "hemma_backups"


def _num(x: float) -> str:
    if isinstance(x, bool):
        return "true" if x else "false"
    if isinstance(x, int):
        return str(x)
    if math.isnan(x) or math.isinf(x):
        return "null"
    if x == int(x) and abs(x) < 1e21:
        return str(int(x))
    r = repr(x)
    if "e" in r:
        m, e = r.split("e")
        r = f"{m}e{'-' if e.startswith('-') else '+'}{int(e.lstrip('+-'))}"
    return r


def stable(x: Any) -> str:
    if x is None:
        return "null"
    if isinstance(x, (bool, int, float)):
        return _num(x)
    if isinstance(x, str):
        return json.dumps(x, ensure_ascii=False)
    if isinstance(x, list):
        return "[" + ",".join(stable(v) for v in x) + "]"
    if isinstance(x, dict):
        keys = sorted(x, key=lambda k: str(k).encode("utf-16-be"))
        return "{" + ",".join(json.dumps(str(k), ensure_ascii=False) + ":" + stable(x[k]) for k in keys) + "}"
    return json.dumps(str(x), ensure_ascii=False)


def _b36(n: int) -> str:
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    out = ""
    while True:
        n, r = divmod(n, 36)
        out = digits[r] + out
        if not n:
            return out


def hash_str(s: str) -> str:
    h = 0x811C9DC5
    b = s.encode("utf-16-le")
    for i in range(0, len(b), 2):
        h ^= b[i] | (b[i + 1] << 8)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return _b36(h)


SCENE_KEYS = ("scenes", "scene_exclude", "scene_order", "scene_colors")
SCENE_LIST_KEYS = SCENE_KEYS[:3]
NAV = "custom:hemma-nav"
FILTER_OVERLAY = "custom:hemma-filter-overlay"


def _first_routes(node: Any) -> list | None:
    if isinstance(node, dict):
        if isinstance(node.get("routes"), list):
            return node["routes"]
        node = list(node.values())
    if isinstance(node, list):
        for v in node:
            r = _first_routes(v)
            if r is not None:
                return r
    return None


def _set(dst: dict, src: dict | None, keys) -> None:
    for k in keys:
        if src is not None and k in src:
            dst[k] = copy.deepcopy(src[k])
        else:
            dst.pop(k, None)


def carry(target: Any, source: Any, root_source: Any = None) -> Any:
    """target with the parts Studio's Save writes per dashboard (room routes, scene choices) taken from source."""
    root_source = source if root_source is None else root_source
    if isinstance(target, list):
        return [carry(v, source[i] if isinstance(source, list) and i < len(source) else None, root_source) for i, v in enumerate(target)]
    if not isinstance(target, dict):
        return target
    src = source if isinstance(source, dict) else None
    out = {k: carry(v, src.get(k) if src else None, root_source) for k, v in target.items()}
    if isinstance(out.get("routes"), list):
        routes = src.get("routes") if src and isinstance(src.get("routes"), list) else _first_routes(root_source)
        if routes is not None:
            out["routes"] = copy.deepcopy(routes)
    if out.get("type") == NAV and src is not None:
        _set(out, src, SCENE_KEYS)
    if out.get("type") == FILTER_OVERLAY and out.get("room") and src is not None:
        _set(out, src, SCENE_LIST_KEYS)
    return out


def _with_row(name: str, target: Any, source: Any) -> Any:
    if name == "hemma_scene_row" and isinstance(target, dict) and isinstance(source, dict) and isinstance(target.get("variables"), dict):
        target = {**target, "variables": dict(target["variables"])}
        _set(target["variables"], source.get("variables"), SCENE_LIST_KEYS + ("scene_colors",))
    return target


def refresh(current: dict, ship_all: dict, seen: dict) -> tuple[dict, dict, list[str]]:
    """The panel's rule, minus one case: a template with no record either way is left for a Save in Studio to settle.

    A template counts as Hemma's when its fingerprint matches what Hemma last wrote, either as stored
    or with the per-dashboard parts set back to Hemma's own (earlier phone saves recorded it that way).
    """
    nxt = dict(current or {})
    prints: dict[str, str] = {}
    changed: list[str] = []
    for k, ship in ship_all.items():
        have = nxt.get(k)
        if have is None:
            nxt[k] = ship
            prints[k] = hash_str(stable(ship))
            changed.append(k)
            continue
        merged = _with_row(k, carry(ship, have), have)
        merged_print = hash_str(stable(merged))
        have_print = hash_str(stable(have))
        last = seen.get(k)
        if have_print == merged_print:
            prints[k] = merged_print
        elif last is not None and last in (have_print, hash_str(stable(_with_row(k, carry(have, ship), ship)))):
            nxt[k] = merged
            prints[k] = merged_print
            changed.append(k)
        elif last is None:
            continue
        else:
            theirs, ship_vars = (have or {}).get("variables"), (ship or {}).get("variables")
            if ship_vars and theirs and stable(theirs) != stable({**ship_vars, **theirs}):
                nxt[k] = {**have, "variables": {**ship_vars, **theirs}}
                changed.append(k)
            prints[k] = last
    for k in list(nxt):
        if k in ship_all or not k.startswith("hemma_"):
            continue
        if seen.get(k) is not None and seen[k] == hash_str(stable(nxt[k])):
            del nxt[k]
            changed.append(k)
    return nxt, prints, changed


def _backup(config_dir: str, url_path: str, config: dict) -> str:
    rel = os.path.join(BACKUPS, time.strftime(f"dashboard-{url_path}-%Y%m%d-%H%M%S.json"))
    os.makedirs(os.path.join(config_dir, BACKUPS), exist_ok=True)
    with open(os.path.join(config_dir, rel), "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False)
    return rel


async def _run(hass: HomeAssistant) -> None:
    data = hass.data.get("lovelace")
    boards = getattr(data, "dashboards", None) or {}
    try:
        bundle = await hass.async_add_executor_job(lambda: json.load(open(hass.config.path(BUNDLE), encoding="utf-8")))
    except (OSError, ValueError):
        _LOGGER.exception("Hemma: could not read the template bundle")
        return
    ship_all = bundle.get("templates") or {}
    if not ship_all:
        return
    for url_path, board in list(boards.items()):
        if getattr(board, "mode", None) != "storage":
            continue
        try:
            cfg = await board.async_load(False)
        except Exception:  # noqa: BLE001 - an empty or unreadable dashboard is not ours
            continue
        if not isinstance(cfg, dict) or not isinstance(cfg.get(FINGERPRINT_KEY), dict):
            continue
        seen = cfg[FINGERPRINT_KEY]
        templates, prints, changed = refresh(cfg.get("button_card_templates") or {}, ship_all, seen)
        if not changed and prints == seen:
            continue
        name = url_path or "lovelace"
        try:
            rel = await hass.async_add_executor_job(_backup, hass.config.config_dir, name, cfg)
            await board.async_save({**cfg, "button_card_templates": templates, FINGERPRINT_KEY: prints})
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Hemma: could not update the templates of %s", name)
            continue
        _LOGGER.info("Hemma: updated %d template(s) in %s (previous copy in %s)", len(changed), name, rel)


async def async_setup_template_refresh(hass: HomeAssistant, entry) -> None:
    async def _go(_event: Event | None = None) -> None:
        try:
            await _run(hass)
        except Exception:  # noqa: BLE001 - never block setup over a refresh
            _LOGGER.exception("Hemma: template refresh failed")

    async def _started(_hass: HomeAssistant) -> None:
        await _go()

    entry.async_on_unload(async_at_started(hass, _started))
