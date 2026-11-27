"""Serve Hemma's icons, fonts, weather art and demo room images."""

from __future__ import annotations

import hashlib
import logging
import os
import shutil
import threading
from datetime import timedelta

from aiohttp import web

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.http import HomeAssistantView
from homeassistant.components.http.auth import async_sign_path
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.http import KEY_AUTHENTICATED

from .const import ASSETS_URL_BASE, LEGACY_ROOMS_DIR, PHOTOS_DIR, USER_ASSETS_DIR

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


PHOTO_EXTS = (".jpg", ".jpeg", ".png", ".webp")
SIGN_DAYS = 7
# The links the dashboards build for a room photo; a signature covers the exact path and query.
PHOTO_LINKS = ("rooms/{}.jpg", "rooms-soft/{}.jpg", "rooms-soft/{}.jpg?v=3", "rooms-glass/{}.jpg", "rooms-glass/{}.jpg?v=5", "rooms-even/{}.jpg")


def move_legacy_photos(config_dir: str) -> int:
    """Room photos uploaded before 2.5.3 sat in www, where /local serves them to anyone; move them out."""
    old = os.path.join(config_dir, LEGACY_ROOMS_DIR)
    new = os.path.join(config_dir, PHOTOS_DIR, "rooms")
    if not os.path.isdir(old):
        return 0
    moved = 0
    for name in sorted(os.listdir(old)):
        src = os.path.join(old, name)
        if not os.path.isfile(src) or not name.lower().endswith(PHOTO_EXTS):
            continue
        if _is_retired(src):
            os.remove(src)
            continue
        os.makedirs(new, exist_ok=True)
        dst = os.path.join(new, name)
        if os.path.exists(dst):
            os.remove(src)
        else:
            shutil.move(src, dst)
        moved += 1
    return moved


def user_photo_names(config_dir: str) -> list[str]:
    folder = os.path.join(config_dir, PHOTOS_DIR, "rooms")
    if not os.path.isdir(folder):
        return []
    return sorted({os.path.splitext(n)[0] for n in os.listdir(folder) if n.lower().endswith(PHOTO_EXTS)})


@websocket_api.websocket_command({vol.Required("type"): "hemma/photos/sign", vol.Optional("paths"): [str]})
@websocket_api.async_response
async def ws_sign_photos(hass: HomeAssistant, connection, msg: dict) -> None:
    """Signed links for the user's room photos, so <img> and CSS backgrounds can load them without a token."""
    names = await hass.async_add_executor_job(user_photo_names, hass.config.config_dir)
    paths = msg.get("paths")
    if paths is None:
        paths = [f"{ASSETS_URL_BASE}/{link.format(n)}" for n in names for link in PHOTO_LINKS]
    paths = [p for p in paths[:500] if p.startswith(ASSETS_URL_BASE + "/rooms")]
    exp = timedelta(days=SIGN_DAYS)
    signed = {p: async_sign_path(hass, p, exp, refresh_token_id=connection.refresh_token_id) for p in paths}
    connection.send_result(msg["id"], {"names": names, "signed": signed, "days": SIGN_DAYS})


@callback
def register_photo_ws(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_sign_photos)


class HemmaAssetsView(HomeAssistantView):
    """Hemma's own icons, fonts, weather art and demo photos, open like any frontend file.

    The user's room photos (and their blurred copies) are the exception: they
    win over a shipped photo of the same name, and are served only to a
    request Home Assistant has authenticated, which for <img> and CSS means a
    link signed with auth/sign_path (see ws_sign_photos).
    """

    url = ASSETS_URL_BASE + "/{path:.*}"
    name = "hemma:assets"
    requires_auth = False

    def __init__(self, shipped: str) -> None:
        self._shipped = shipped

    async def get(self, request: web.Request, path: str) -> web.StreamResponse:
        hass: HomeAssistant = request.app["hass"]
        user = hass.config.path(PHOTOS_DIR)
        authed = bool(request.get(KEY_AUTHENTICATED))

        def _find(rel: str) -> str | None:
            order = (user, self._shipped) if rel.startswith("rooms/") else (self._shipped, hass.config.path(USER_ASSETS_DIR))
            for base in order:
                full = _under(base, rel)
                if full and os.path.isfile(full):
                    return full
            return None

        def _private(found: str) -> bool:
            src = os.path.normpath(found)
            return src.startswith(os.path.normpath(user) + os.sep) or src.startswith(os.path.normpath(hass.config.path("hemma_cache")) + os.sep)

        prefix = next((k for k in SOFT if path.startswith(k)), None)

        def _soft() -> str | None:
            name = path[len(prefix):]
            src = _find("rooms/" + name)
            if src is None:
                return None
            if not authed and _private(src):
                return "denied"
            try:
                return _soft_file(hass.config.path("hemma_cache"), prefix, name, src)
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Could not soften %s", src)
                return None

        if prefix:
            found = await hass.async_add_executor_job(_soft)
            if found is None:
                return web.Response(status=404, text="not found")
            if found == "denied":
                return web.Response(status=401, text="unauthorized")
            mine = await hass.async_add_executor_job(_private, found)
            return web.FileResponse(found, headers={"Cache-Control": "private, no-cache" if mine else "no-cache"})

        found = await hass.async_add_executor_job(_find, path)
        if found is None:
            return web.Response(status=404, text="not found")
        if await hass.async_add_executor_job(_private, found):
            if not authed:
                return web.Response(status=401, text="unauthorized")
            return web.FileResponse(found, headers={"Cache-Control": "private, no-cache"})
        # Revalidated on every load (a cheap 304), so a redrawn icon reaches phones that cached the old one.
        return web.FileResponse(found, headers={"Cache-Control": "no-cache"})
