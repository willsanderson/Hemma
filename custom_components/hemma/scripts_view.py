"""Serve Hemma's scripts and Studio files gzipped, and cached for a year when the URL's ?v= is current."""

from __future__ import annotations

import gzip
import os

from aiohttp import web

from homeassistant.components.http import HomeAssistantView

_TYPES = {".js": "text/javascript", ".json": "application/json", ".css": "text/css"}
_YEAR = "public, max-age=31536000, immutable"


def _stamp(v: str) -> int:
    tail = (v or "").rsplit(".", 1)[-1]
    return int(tail) if tail.isdigit() else -1


class _FilesView(HomeAssistantView):
    requires_auth = False

    def __init__(self, url: str, name: str, folder: str) -> None:
        self.url = url + "/{filename}"
        self.name = name
        self._dir = folder
        self._cache: dict[str, tuple[int, int, bytes, bytes]] = {}

    def _load(self, path: str) -> tuple[int, int, bytes, bytes]:
        st = os.stat(path)
        hit = self._cache.get(path)
        if hit and hit[0] == st.st_mtime_ns and hit[1] == st.st_size:
            return hit
        with open(path, "rb") as f:
            raw = f.read()
        entry = (st.st_mtime_ns, st.st_size, raw, gzip.compress(raw, 6, mtime=0))
        self._cache[path] = entry
        return entry

    async def get(self, request: web.Request, filename: str) -> web.Response:
        ext = os.path.splitext(filename)[1]
        if "/" in filename or "\\" in filename or filename.startswith(".") or ext not in _TYPES:
            raise web.HTTPNotFound()
        path = os.path.join(self._dir, filename)
        hass = request.app["hass"]
        try:
            mtime_ns, size, raw, packed = await hass.async_add_executor_job(self._load, path)
        except (FileNotFoundError, IsADirectoryError, NotADirectoryError):
            raise web.HTTPNotFound() from None
        etag = f'"{mtime_ns:x}-{size:x}"'
        current = _stamp(request.query.get("v", "")) >= mtime_ns // 1_000_000_000
        headers = {"ETag": etag, "Vary": "Accept-Encoding", "Cache-Control": _YEAR if current else "no-cache"}
        if request.headers.get("If-None-Match") == etag:
            return web.Response(status=304, headers=headers)
        body = raw
        if "gzip" in request.headers.get("Accept-Encoding", "").lower():
            body = packed
            headers["Content-Encoding"] = "gzip"
        return web.Response(body=body, content_type=_TYPES[ext], charset="utf-8", headers=headers)


def scripts_view(url: str, folder: str) -> _FilesView:
    return _FilesView(url, "hemma:scripts", folder)


def panel_view(url: str, folder: str) -> _FilesView:
    return _FilesView(url, "hemma:panel", folder)
