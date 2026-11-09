"""Keep Hemma's theme installed in the themes folder and current."""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import time

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.storage import Store
from homeassistant.util.yaml import load_yaml

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

THEME_NAME = "Hemma"
BUNDLED = f"custom_components/{DOMAIN}/theme/hemma.yaml"
SHIPPED = f"custom_components/{DOMAIN}/theme/shipped.json"
TARGET = "themes/hemma/hemma.yaml"
BACKUPS = "hemma_backups"
STORE_KEY = f"{DOMAIN}.theme"
# Home Assistant's own record of the default theme, and the hass.data keys it keeps it under.
FRONTEND_STORE = "frontend_theme"
DEFAULT_KEYS = ("frontend_default_theme", "frontend_default_dark_theme")

_DECLARES = re.compile(rf"^{THEME_NAME}:\s*(#.*)?$", re.M)


def _sync(config_dir: str, written: str | None) -> dict:
    src = open(os.path.join(config_dir, BUNDLED), "rb").read()
    sha = hashlib.sha256(src).hexdigest()
    target = os.path.join(config_dir, TARGET)

    others = []
    themes = os.path.join(config_dir, "themes")
    for root, _, files in os.walk(themes):
        for name in files:
            path = os.path.join(root, name)
            if not name.endswith((".yaml", ".yml")) or os.path.normpath(path) == os.path.normpath(target):
                continue
            try:
                text = open(path, encoding="utf-8", errors="ignore").read()
            except OSError:
                continue
            if _DECLARES.search(text):
                others.append(os.path.relpath(path, config_dir))
    if others:
        return {"sha": sha, "others": sorted(others)}

    try:
        cur = open(target, "rb").read()
    except OSError:
        cur = None
    if cur == src:
        return {"sha": sha, "current": True}
    # This version was already written once; an edit since then waits for the next update.
    if written == sha:
        return {"sha": sha}

    backup = None
    try:
        shipped = set(json.load(open(os.path.join(config_dir, SHIPPED), encoding="utf-8")))
    except (OSError, ValueError):
        shipped = set()
    if cur is not None and written is None and hashlib.sha256(cur).hexdigest() not in shipped:
        backup = os.path.join(BACKUPS, time.strftime("hemma-theme-%Y%m%d-%H%M%S.yaml"))
        os.makedirs(os.path.join(config_dir, BACKUPS), exist_ok=True)
        with open(os.path.join(config_dir, backup), "wb") as f:
            f.write(cur)

    os.makedirs(os.path.dirname(target), exist_ok=True)
    tmp = target + ".tmp"
    with open(tmp, "wb") as f:
        f.write(src)
    os.replace(tmp, target)
    return {"sha": sha, "current": True, "wrote": True, "backup": backup}


async def async_setup_theme(hass: HomeAssistant) -> None:
    """Write the bundled theme to themes/hemma/ when it changes, then reload themes."""
    store: Store[dict] = Store(hass, 1, STORE_KEY)
    data = await store.async_load() or {}
    try:
        result = await hass.async_add_executor_job(_sync, hass.config.config_dir, data.get("sha"))
    except OSError:
        _LOGGER.exception("Hemma: could not install the Hemma theme")
        return

    if result.get("current") and data.get("sha") != result["sha"]:
        data = {**data, "sha": result["sha"]}
        await store.async_save(data)

    if result.get("backup"):
        _LOGGER.warning(
            "Hemma: replaced themes/hemma/hemma.yaml with the current Hemma theme; "
            "the previous copy had changes and was saved to %s",
            result["backup"],
        )
        ir.async_create_issue(
            hass, DOMAIN, "theme_replaced",
            is_fixable=False, severity=ir.IssueSeverity.WARNING,
            translation_key="theme_replaced",
            translation_placeholders={"path": result["backup"]},
        )

    if result.get("wrote") and hass.services.has_service("frontend", "reload_themes"):
        try:
            await hass.services.async_call("frontend", "reload_themes", blocking=True)
        except Exception:  # noqa: BLE001 - a theme reload must never block setup
            _LOGGER.exception("Hemma: could not reload themes")

    others = result.get("others")
    if others:
        _LOGGER.warning(
            "Hemma: another file also defines the %s theme, so Hemma left its own "
            "theme alone: %s", THEME_NAME, ", ".join(others),
        )
        ir.async_create_issue(
            hass, DOMAIN, "theme_duplicate",
            is_fixable=False, severity=ir.IssueSeverity.WARNING,
            translation_key="theme_duplicate",
            translation_placeholders={"paths": ", ".join(others)},
        )
    else:
        ir.async_delete_issue(hass, DOMAIN, "theme_duplicate")

    ir.async_delete_issue(hass, DOMAIN, "theme_not_loaded")
    theme = await hass.async_add_executor_job(load_yaml, hass.config.path(BUNDLED))
    hass.data[f"{DOMAIN}_theme"] = (theme or {}).get(THEME_NAME)
    _inject(hass)
    if not hass.data.get(f"{DOMAIN}_theme_listen"):
        # Reloading themes rebuilds the list from configuration.yaml alone, so Hemma's goes straight back in.
        @callback
        def _again(_event) -> None:
            _inject(hass)
            hass.async_create_task(_restore_default(hass))

        hass.bus.async_listen("themes_updated", _again)
        hass.data[f"{DOMAIN}_theme_listen"] = True
    await _restore_default(hass)
    if not data.get("default_checked"):
        try:
            if await _pick_default(hass):
                await store.async_save({**data, "default_checked": True})
        except Exception:  # noqa: BLE001 - choosing a theme must never block setup
            _LOGGER.exception("Hemma: could not make Hemma the default theme")


async def _frontend_saved(hass: HomeAssistant) -> dict:
    # The frontend's own Store also returns a save it is still holding back.
    store = hass.data.get("frontend_themes_store")
    if not isinstance(store, Store):
        store = Store(hass, 1, FRONTEND_STORE)
    try:
        saved = await store.async_load()
    except Exception:  # noqa: BLE001
        return {}
    return saved if isinstance(saved, dict) else {}


async def _pick_default(hass: HomeAssistant) -> bool:
    """Once: make Hemma the default theme unless another theme is already chosen. True when settled."""
    themes = hass.data.get("frontend_themes")
    if not isinstance(themes, dict) or THEME_NAME not in themes:
        return False
    saved = await _frontend_saved(hass)
    chosen = [saved.get(k) for k in DEFAULT_KEYS if saved.get(k) not in (None, "", "default")]
    if chosen:
        return True
    if not hass.services.has_service("frontend", "set_theme"):
        return False
    await hass.services.async_call("frontend", "set_theme", {"name": THEME_NAME}, blocking=True)
    _LOGGER.info("Hemma: made Hemma the default theme")
    return True


async def _restore_default(hass: HomeAssistant) -> None:
    """At startup HA drops a saved default theme it can't find yet, and Hemma's is only added later."""
    themes = hass.data.get("frontend_themes")
    if not isinstance(themes, dict) or THEME_NAME not in themes:
        return
    saved = await _frontend_saved(hass)
    changed = False
    for key in DEFAULT_KEYS:
        if saved.get(key) == THEME_NAME and hass.data.get(key) != THEME_NAME:
            hass.data[key] = THEME_NAME
            changed = True
    if changed:
        hass.bus.async_fire("themes_updated")


@callback
def theme_offered(hass: HomeAssistant) -> bool:
    themes = hass.data.get("frontend_themes")
    return isinstance(themes, dict) and THEME_NAME in themes


async def async_repair_theme(hass: HomeAssistant) -> bool:
    """Put the Hemma theme back in the list and its saved default back in place."""
    _inject(hass)
    await _restore_default(hass)
    return theme_offered(hass)


@callback
def _inject(hass: HomeAssistant) -> None:
    """Offer the Hemma theme without a `frontend: themes:` line; a theme loaded from YAML is left as it is."""
    themes = hass.data.get("frontend_themes")
    theme = hass.data.get(f"{DOMAIN}_theme")
    if not isinstance(themes, dict) or not theme:
        return
    cur = themes.get(THEME_NAME)
    if cur is theme or (cur is not None and cur is not hass.data.get(f"{DOMAIN}_theme_put")):
        return
    themes[THEME_NAME] = hass.data[f"{DOMAIN}_theme_put"] = theme
    hass.bus.async_fire("themes_updated")
