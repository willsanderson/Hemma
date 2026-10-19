"""Constants for the Hemma integration."""

import json
from pathlib import Path

DOMAIN = "hemma"

# manifest.json is the single source of truth: HACS reads it.
VERSION = json.loads(
    (Path(__file__).parent / "manifest.json").read_text(encoding="utf-8")
)["version"]

URL_BASE = "/hemma_panel"

SCRIPTS_URL_BASE = "/hemma_scripts"
SCRIPTS_DIR = f"custom_components/{DOMAIN}/scripts"

# Order matters: hemma-core defines what the others build on, and hemma-i18n
# wants to be in place before core flushes its waiter queue.
SHARED_SCRIPTS = (
    "hemma-i18n.js",
    "hemma-core.js",
    "hemma-icons.js",
    "hemma-redirect.js",
    "layout-offsets.js",
    "layout-card-modified.js",
    "smart-row.js",
    "swipe-card-patch.js",
    "filter-overlay.js",
)

ASSETS_URL_BASE = "/hemma_assets"
ASSETS_DIR = f"custom_components/{DOMAIN}/assets"
USER_ASSETS_DIR = "www/hemma"
FONT_CSS = "fonts/hanken-grotesk.css"

# The panel keeps the url it was given in 2.0.5; only its title changed.
PANEL_URL = "hemma-studio"
PANEL_TITLE = "Hemma"
PANEL_ICON = "mdi:view-dashboard-edit"

# Registered at /hemma before the rename, so setup removes the old one.
LEGACY_PANEL_URL = "hemma"
