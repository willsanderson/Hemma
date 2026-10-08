"""The Hemma integration."""

from __future__ import annotations

import logging
import os

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .assets import HemmaAssetsView
from .images import HemmaImagesView
from .templates import HemmaTemplatesView, rebuild_if_stale
from .i18n import rebuild_if_stale as rebuild_translations_if_stale
from .notify import async_setup_notify
from .const import (
    ASSETS_DIR,
    DOMAIN,
    PANEL_ICON,
    PANEL_TITLE,
    LEGACY_PANEL_URL,
    PANEL_URL,
    SCRIPTS_DIR,
    SCRIPTS_URL_BASE,
    SHARED_SCRIPTS,
    URL_BASE,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)


def _lovelace_resources(hass: HomeAssistant):
    """Lovelace's resource collection, or None.

    Read only. The shape has moved between HA versions - a dict in older ones,
    a dataclass now - and resources are read-only when Lovelace runs in yaml
    mode, so every access is defensive: a wrong guess here must never stop the
    integration loading.
    """
    try:
        data = hass.data.get("lovelace")
        if data is None:
            return None
        res = getattr(data, "resources", None)
        if res is None and isinstance(data, dict):
            res = data.get("resources")
        return res if hasattr(res, "async_items") else None
    except Exception:  # noqa: BLE001 - never break setup over a log line
        return None


async def _sync_script_resources(hass: HomeAssistant, scripts_dir: str) -> None:
    """Point Lovelace at the scripts this integration serves.

    Resources are read-only in yaml mode, so there the URLs are reported and
    the user adds them. An entry still loading from /local is repointed rather
    than duplicated: two entries for one script run it twice.
    """
    def _present() -> dict[str, int]:
        found = {}
        for n in SHARED_SCRIPTS:
            path = os.path.join(scripts_dir, n)
            if os.path.isfile(path):
                found[n] = int(os.path.getmtime(path))
        return found

    stamps = await hass.async_add_executor_job(_present)
    names = list(stamps)
    if not names:
        _LOGGER.warning(
            "Hemma: no shared scripts found in %s; the dashboard needs them",
            scripts_dir,
        )
        return

    wanted = {n: f"{SCRIPTS_URL_BASE}/{n}?v={stamps[n]}" for n in names}
    res = _lovelace_resources(hass)

    if res is None or not hasattr(res, "async_create_item"):
        _LOGGER.warning(
            "Hemma: Lovelace resources are not writable (yaml mode). Add these "
            "under lovelace: resources: as type module: %s",
            ", ".join(wanted[n] for n in names),
        )
        return

    try:
        if not getattr(res, "loaded", False):
            await res.async_load()
            res.loaded = True
    except Exception:  # noqa: BLE001 - a resource list must never block setup
        _LOGGER.exception("Hemma: could not read the Lovelace resource list")
        return

    items = list(res.async_items())
    by_url = {str(i.get("url", "")): i for i in items}

    added: list[str] = []
    moved: list[str] = []
    for name, url in wanted.items():
        if url in by_url:
            continue
        existing = next(
            (
                i
                for i in items
                if str(i.get("url", "")).partition("?")[0].endswith("/" + name)
                and (
                    str(i.get("url", "")).startswith("/local/")
                    or str(i.get("url", "")).startswith(SCRIPTS_URL_BASE + "/")
                )
            ),
            None,
        )
        try:
            if existing is not None:
                await res.async_update_item(existing["id"], {"url": url})
                moved.append(name)
            else:
                await res.async_create_item({"res_type": "module", "url": url})
                added.append(name)
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Hemma: could not register %s", url)

    orphans = [
        str(i.get("url", ""))
        for i in items
        if str(i.get("url", "")).startswith("/local/hemma/scripts/")
        and not any(str(i.get("url", "")).partition("?")[0].endswith("/" + n) for n in names)
    ]
    if orphans:
        _LOGGER.warning(
            "Hemma: these resources point at scripts Hemma no longer ships. "
            "Remove them under Settings > Dashboards > Resources: %s",
            ", ".join(sorted(orphans)),
        )

    if added or moved:
        _LOGGER.info(
            "Hemma: registered %d and repointed %d dashboard resource(s); "
            "refresh the browser once to load them (the ?v= stamp is the file's "
            "mtime, so an edited script gets a URL no cache can answer)",
            len(added),
            len(moved),
        )


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register the panel assets and the sidebar entry."""
    panel_dir = hass.config.path(f"custom_components/{DOMAIN}/panel")

    # The bundle is derived from the template tree, so rebuild before the panel loads.
    await hass.async_add_executor_job(rebuild_if_stale, hass.config.config_dir)
    # Before the resources are stamped, so a rebuilt table is fetched fresh.
    await hass.async_add_executor_job(rebuild_translations_if_stale)

    scripts_dir = hass.config.path(SCRIPTS_DIR)

    for url, path in (
        (URL_BASE, panel_dir),
        (SCRIPTS_URL_BASE, scripts_dir),
    ):
        try:
            await hass.http.async_register_static_paths(
                [StaticPathConfig(url, path, False)]
            )
        except RuntimeError:
            _LOGGER.debug("Hemma: %s is already served", url)

    await _sync_script_resources(hass, scripts_dir)
    await async_setup_notify(hass)

    def _stamp() -> int:
        try:
            return int(os.path.getmtime(os.path.join(panel_dir, "hemma-panel.js")))
        except OSError:
            return 0

    stamp = await hass.async_add_executor_job(_stamp)

    if not hass.data.get(f"{DOMAIN}_views"):
        hass.http.register_view(HemmaAssetsView(hass.config.path(ASSETS_DIR)))
        hass.http.register_view(HemmaImagesView())
        hass.http.register_view(HemmaTemplatesView())
        hass.data[f"{DOMAIN}_views"] = True

    # Remove first so a version bump re-registers cleanly instead of being skipped.
    async_remove_panel(hass, PANEL_URL, warn_if_unknown=False)
    async_remove_panel(hass, LEGACY_PANEL_URL, warn_if_unknown=False)
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
                "module_url": f"{URL_BASE}/hemma-panel.js?v={VERSION}.{stamp}",
            }
        },
    )
    _LOGGER.debug("Registered Hemma panel at /%s", PANEL_URL)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the sidebar entry."""
    async_remove_panel(hass, PANEL_URL, warn_if_unknown=False)
    return True
