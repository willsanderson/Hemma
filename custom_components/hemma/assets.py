"""Serve Hemma's icons, fonts, weather art and demo room images."""

from __future__ import annotations

import logging
import os

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import ASSETS_URL_BASE, USER_ASSETS_DIR

_LOGGER = logging.getLogger(__name__)


def _under(base: str, rel: str) -> str | None:
    """Join and confirm the result is still inside base."""
    full = os.path.normpath(os.path.join(base, rel))
    root = os.path.normpath(base)
    if full != root and not full.startswith(root + os.sep):
        return None
    return full


class HemmaAssetsView(HomeAssistantView):
    """Shipped assets win; the user's www/hemma fills the gaps.

    Room photos are the exception: the user's own copy wins, so a replaced
    demo photo keeps showing.

    Unauthenticated because these are loaded by bare <img> and @font-face,
    which send no token. Same reach as /local, which serves the same files.
    """

    url = ASSETS_URL_BASE + "/{path:.*}"
    name = "hemma:assets"
    requires_auth = False

    def __init__(self, shipped: str) -> None:
        self._shipped = shipped

    async def get(self, request: web.Request, path: str) -> web.StreamResponse:
        hass: HomeAssistant = request.app["hass"]
        user = hass.config.path(USER_ASSETS_DIR)

        def _find() -> str | None:
            order = (user, self._shipped) if path.startswith("rooms/") else (self._shipped, user)
            for base in order:
                full = _under(base, path)
                if full and os.path.isfile(full):
                    return full
            return None

        found = await hass.async_add_executor_job(_find)
        if found is None:
            return web.Response(status=404, text="not found")
        return web.FileResponse(found)
