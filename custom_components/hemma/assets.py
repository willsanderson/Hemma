"""Serve Hemma's icons, fonts, weather art and demo room images."""

from __future__ import annotations

import hashlib
import logging
import os
import threading

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import ASSETS_URL_BASE, USER_ASSETS_DIR

_LOGGER = logging.getLogger(__name__)


# prefix: (blur at the top, blur at the bottom, ramp start, ramp end), at 1600px wide.
# Browsers keep the old photo under the same URL: changing a recipe means bumping its ?v= (hemma_room, hemma_mobile_bg, core preload and mobile backdrop, panel previews).
SOFT = {"rooms-soft/": (8, 18, 0.30, 0.85), "rooms-glass/": (6, 8, 0.38, 0.82), "rooms-even/": (16, 16, 0.0, 1.0)}
_soft_lock = threading.Lock()
# Older installers copied the demo photos into www/hemma/rooms; an untouched copy must not hide a newer shipped photo.
RETIRED_DEMO = frozenset({
    "185295d21f523928", "d95f2c6f59353118", "5ce63dfed6eb0c53", "a13d70f93b1b023a", "9578dcfcb77296c6",
})
_retired_seen: dict[tuple[str, float, int], bool] = {}


def _is_retired(full: str) -> bool:
    st = os.stat(full)
    key = (full, st.st_mtime, st.st_size)
    if key not in _retired_seen:
        with open(full, "rb") as fh:
            _retired_seen[key] = hashlib.sha256(fh.read()).hexdigest()[:16] in RETIRED_DEMO
    return _retired_seen[key]


def _soften(src: str, dst: str, recipe: tuple[float, float, float, float]) -> None:
    """A room photo lightly blurred at the top, easing into a heavy blur lower down."""
    from PIL import Image, ImageFilter

    top, bottom, start, end = recipe
    with Image.open(src) as raw:
        im = raw.convert("RGB")
    if im.width != 1600:
        im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
    w, h = im.size
    light = im.filter(ImageFilter.GaussianBlur(top))
    heavy = im.filter(ImageFilter.GaussianBlur(bottom))
    mask = Image.new("L", (1, h))
    for y in range(h):
        t = min(1.0, max(0.0, (y / max(1, h - 1) - start) / (end - start)))
        mask.putpixel((0, y), round(255 * t * t * (3 - 2 * t)))
    out = Image.composite(heavy, light, mask.resize((w, h)))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + ".tmp"
    out.save(tmp, "JPEG", quality=88)
    os.replace(tmp, dst)


def _soft_file(cache_root: str, prefix: str, name: str, src: str) -> str | None:
    """The softened copy of src, made once; the name carries its recipe, so changing one look never voids the other."""
    st = os.stat(src)
    stem, _ext = os.path.splitext(name)
    tag = hashlib.md5(repr(SOFT[prefix]).encode()).hexdigest()[:8]
    dst = _under(os.path.join(cache_root, prefix.rstrip("/")), f"{stem}-{int(st.st_mtime)}-{st.st_size}-{tag}.jpg")
    if dst is None:
        return None
    with _soft_lock:
        if not os.path.isfile(dst):
            _soften(src, dst, SOFT[prefix])
    return dst


def warm_soft(cache_root: str, shipped: str, user: str) -> None:
    """Soften every room photo ahead of time, so the first visit to a room never waits on it."""
    names: dict[str, str] = {}
    for base in (shipped, user):
        folder = os.path.join(base, "rooms")
        if not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            full = os.path.join(folder, name)
            if not name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")) or not os.path.isfile(full):
                continue
            if base == user and _is_retired(full):
                continue
            names[name] = full
    for prefix in SOFT:
        for name, src in names.items():
            try:
                _soft_file(cache_root, prefix, name, src)
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Could not soften %s", src)


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

        def _find(rel: str) -> str | None:
            order = (user, self._shipped) if rel.startswith("rooms/") else (self._shipped, user)
            for base in order:
                full = _under(base, rel)
                if full and os.path.isfile(full):
                    if base == user and rel.startswith("rooms/") and _is_retired(full):
                        continue
                    return full
            return None

        prefix = next((k for k in SOFT if path.startswith(k)), None)

        def _soft() -> str | None:
            name = path[len(prefix):]
            src = _find("rooms/" + name)
            if src is None:
                return None
            try:
                return _soft_file(hass.config.path("hemma_cache"), prefix, name, src)
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Could not soften %s", src)
                return None

        if prefix:
            found = await hass.async_add_executor_job(_soft)
            if found is None:
                return web.Response(status=404, text="not found")
            return web.FileResponse(found, headers={"Cache-Control": "no-cache"})

        found = await hass.async_add_executor_job(_find, path)
        if found is None:
            return web.Response(status=404, text="not found")
        # Revalidated on every load (a cheap 304), so a redrawn icon reaches phones that cached the old one.
        return web.FileResponse(found, headers={"Cache-Control": "no-cache"})
