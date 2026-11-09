"""Room image listing and upload for the Hemma panel."""

from __future__ import annotations

import logging
import os
import re
from typing import Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

ROOMS_DIR = "www/hemma/rooms"
ICONS_DIR = "www/hemma/icons"
PUBLIC_BASE = "/local/hemma/rooms"
SHIPPED_BASE = "/hemma_assets/rooms"
SHIPPED_ROOMS = os.path.join(os.path.dirname(__file__), "assets", "rooms")

EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
NIGHT_SUFFIX = "-night"
MAX_BYTES = 12 * 1024 * 1024
SAFE_NAME = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")


def _rooms_dir(hass: HomeAssistant) -> str:
    return hass.config.path(ROOMS_DIR)


def _scan(path: str, shipped: str | None = None) -> list[dict[str, Any]]:
    from .assets import _is_retired

    found: dict[str, dict[str, str]] = {}
    for folder, public in ((shipped, SHIPPED_BASE), (path, PUBLIC_BASE)):
        if not folder or not os.path.isdir(folder):
            continue
        for entry in sorted(os.listdir(folder)):
            full = os.path.join(folder, entry)
            if not os.path.isfile(full):
                continue
            stem, ext = os.path.splitext(entry)
            if ext.lower() not in EXTENSIONS:
                continue
            # An older install's copy of a demo photo Hemma has since replaced.
            if folder == path and _is_retired(full):
                continue
            night = stem.endswith(NIGHT_SUFFIX)
            base = stem[: -len(NIGHT_SUFFIX)] if night else stem
            slot = found.setdefault(base, {})
            slot["night" if night else "day"] = f"{public}/{entry}"
    return [
        {"name": name, "day": urls.get("day"), "night": urls.get("night")}
        for name, urls in sorted(found.items())
    ]


def _svg_names(directory: str) -> set[str]:
    if not os.path.isdir(directory):
        return set()
    return {
        n[:-4] for n in os.listdir(directory)
        if n.lower().endswith(".svg") and re.fullmatch(r"[a-z0-9_-]+", n[:-4])
    }


def _scan_icons(directory: str, shipped: str) -> list[str]:
    # Older installs copied Hemma's own icons into www/hemma; only the ones Hemma doesn't ship are the user's.
    return sorted(_svg_names(directory) - _svg_names(shipped))


class HemmaIconsView(HomeAssistantView):
    """The user's own icons in www/hemma/icons, served beside the shipped ones at /hemma_assets/icons."""

    url = "/api/hemma/icons"
    name = "api:hemma:icons"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        icons = await hass.async_add_executor_job(
            _scan_icons, hass.config.path(ICONS_DIR), os.path.join(os.path.dirname(__file__), "assets", "icons"))
        return self.json({"icons": icons})


class HemmaImagesView(HomeAssistantView):
    """List and upload room images."""

    url = "/api/hemma/images"
    name = "api:hemma:images"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        images = await hass.async_add_executor_job(_scan, _rooms_dir(hass), SHIPPED_ROOMS)
        return self.json({"images": images, "directory": ROOMS_DIR})

    async def post(self, request: web.Request) -> web.Response:
        if not request["hass_user"].is_admin:
            return self.json_message("admin required", web.HTTPUnauthorized.status_code)

        hass: HomeAssistant = request.app["hass"]

        try:
            reader = await request.multipart()
        except Exception:  # noqa: BLE001
            return self.json_message("expected multipart body", 400)

        name: str | None = None
        variant = "day"
        payload: bytes | None = None
        filename = ""

        while True:
            part = await reader.next()
            if part is None:
                break
            if part.name == "name":
                name = (await part.text()).strip().lower()
            elif part.name == "variant":
                variant = (await part.text()).strip().lower()
            elif part.name == "file":
                filename = part.filename or ""
                payload = await part.read(decode=False)

        if not name or not SAFE_NAME.match(name):
            return self.json_message("name must be lowercase letters, digits and hyphens", 400)
        if name.endswith(NIGHT_SUFFIX):
            return self.json_message(f"name must not end in {NIGHT_SUFFIX}", 400)
        if variant not in ("day", "night"):
            return self.json_message("variant must be day or night", 400)
        if not payload:
            return self.json_message("no file received", 400)
        if len(payload) > MAX_BYTES:
            return self.json_message(f"file larger than {MAX_BYTES // (1024 * 1024)} MB", 400)

        ext = os.path.splitext(filename)[1].lower()
        if ext == ".jpeg":
            ext = ".jpg"
        if ext not in EXTENSIONS:
            return self.json_message("file must be .jpg, .png or .webp", 400)

        stem = name + (NIGHT_SUFFIX if variant == "night" else "")
        directory = _rooms_dir(hass)

        def _write() -> str:
            os.makedirs(directory, exist_ok=True)
            # A name can already exist under a different extension.
            for old in EXTENSIONS:
                stale = os.path.join(directory, stem + old)
                if old != ext and os.path.isfile(stale):
                    os.remove(stale)
            target = os.path.join(directory, stem + ext)
            with open(target, "wb") as handle:
                handle.write(payload)
            return target

        try:
            target = await hass.async_add_executor_job(_write)
        except OSError as err:
            _LOGGER.error("Hemma image upload failed: %s", err)
            return self.json_message(f"could not write file: {err}", 500)

        _LOGGER.debug("Hemma wrote %s (%d bytes)", target, len(payload))
        images = await hass.async_add_executor_job(_scan, directory, SHIPPED_ROOMS)
        return self.json({"name": name, "variant": variant, "images": images})
