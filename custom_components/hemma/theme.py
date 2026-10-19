"""Keep Hemma's theme installed in the themes folder and current."""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import time

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.storage import Store

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

THEME_NAME = "Hemma"
BUNDLED = f"custom_components/{DOMAIN}/theme/hemma.yaml"
SHIPPED = f"custom_components/{DOMAIN}/theme/shipped.json"
TARGET = "themes/hemma/hemma.yaml"
BACKUPS = "hemma_backups"
STORE_KEY = f"{DOMAIN}.theme"

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
        await store.async_save({"sha": result["sha"]})

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
        return
    ir.async_delete_issue(hass, DOMAIN, "theme_duplicate")

    loaded = hass.data.get("frontend_themes")
    if isinstance(loaded, dict) and THEME_NAME not in loaded:
        ir.async_create_issue(
            hass, DOMAIN, "theme_not_loaded",
            is_fixable=False, severity=ir.IssueSeverity.WARNING,
            translation_key="theme_not_loaded",
        )
    else:
        ir.async_delete_issue(hass, DOMAIN, "theme_not_loaded")
