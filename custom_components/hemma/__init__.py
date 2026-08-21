"""The Hemma integration."""

from __future__ import annotations

import logging

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL,
    URL_BASE,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register the panel assets and the sidebar entry."""
    panel_dir = hass.config.path(f"custom_components/{DOMAIN}/panel")

    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(URL_BASE, panel_dir, False)]
        )
    except RuntimeError:
        # Static paths live for the process lifetime, so a reload re-registers
        # a path that is already there.
        pass

    # Remove first so a version bump re-registers cleanly instead of being skipped.
    async_remove_panel(hass, PANEL_URL, warn_if_unknown=False)
    async_register_built_in_panel(
        hass=hass,
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL,
        require_admin=True,
        config={
            "_panel_custom": {
                "name": "hemma-panel",
                "embed_iframe": False,
                "trust_external": False,
                "module_url": f"{URL_BASE}/hemma-panel.js?v={VERSION}",
            }
        },
    )
    _LOGGER.debug("Registered Hemma panel at /%s", PANEL_URL)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the sidebar entry."""
    async_remove_panel(hass, PANEL_URL, warn_if_unknown=False)
    return True
