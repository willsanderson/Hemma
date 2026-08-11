# Hemma v2.0

Hemma 2.0 is the largest release yet. It adds a **Now Playing** media experience across both dashboards, a **dedicated mobile dashboard**, two new badge rows (**Energy** and **Security**), and a reorganized script layer. It also renames a number of templates and variables (see [Breaking changes](#breaking-changes) before upgrading).

---

## New — Now Playing

A full media panel that replaces the media badge row on any view that enables it, showing **every** active source rather than just one.

- **Primary tile** — artwork, title, subtitle, progress bar, and transport controls, with an animated cross-fade when the source changes.
- **Rail chips** — every other active source as a compact pill alongside the primary tile. Tap to promote, hold to pin one source to the primary slot.
- **Two presentations** — `now_playing_panel: '0'` floats the tiles free and right-aligned (default); `'1'` wraps them in a glass panel with a collapsible "Now Playing" header.
- **Beyond media players** — the source collector understands standard `media_player` entities, Plex/Tautulli session sensors (`plex_stream_N`), and game-activity sensors such as PlayStation (`psn_N`). Plex tiles open the rich Plex popup instead of more-info.
- **Shared with mobile** — the mobile dashboard's Now Playing row is built from the same source collector and the same tile templates, so the two dashboards can't drift apart.

Enable it on any room card with `show_now_playing: true` (and `show_media: false` — a view uses one or the other, never both, or the same session appears twice). It reuses the `media_player_N` entities you've already configured.

New templates: `now_playing/hemma_now_playing.yaml` plus `_primary`, `_chip`, `_controls`, `_button`, and `_header`.

## New — Energy and Security badge rows

Two new expandable badge groups on the hero card, alongside Climate, Lights, Presence, and Media.

- **Energy** (`hemma_badge_energy`) — one badge per `energy_entity_N` (up to 6). On the Home view these are typically per-room totals, and the `energy_popup_*_N` keys point each badge at that room's energy popup. On a room they're usually its own Today / This Month figures. Values format as W (switching to kW above 1000), kWh, or cost.
- **Security** (`hemma_badge_security`) — one template covering every security entity type, switching on domain rather than duplicating a near-identical template per kind: `lock.*`, `alarm_control_panel.*`, `binary_sensor.*` (door/window/garage/opening), `camera.*`, and garage `cover.*`. Up to 8 entities per view.
- **Locks aggregate** (`hemma_badge_lock_group`) — on the Home view, `security_locks` collapses every lock into a single "Locks" badge that opens the shared lock group popup, the way the Lights badge aggregates lights. Rooms keep using single-lock badges.

## New — Hemma Mobile (`hemma_mobile.yaml`)

A dedicated mobile dashboard, built from the ground up.

- **Filter badge pills** — Climate, Lights, People, Media, Security, and Energy pills at the top of the dashboard. Tap one and a full-screen popup slides up with every matching card from all of your rooms, collected automatically with zero per-popup configuration.
- **Room popups** — tap any room's section header to open that room's own popup: all of its cards and a room-scoped sensor chip row. Chips are live gauges and deep-link into their popups.
- **Collapsing header** — an iOS-style frosted glass bar that fades in as you scroll, with a large→compact title cross-fade.
- **Now Playing row** — a horizontal, snap-scrolling row of full-width media tiles, with everything else surfacing as a column inside the Media popup.
- **Smart sections** — active cards automatically sort to the front of each room row.
- **Always opens on Home** — the dashboard resets to the home view on every fresh load, so a popup left open on one device never follows you to another.
- **Self-colouring background** — the mobile dashboard reuses the room photo the desktop dashboard already loads, anchored to the top of the screen. `hemma-core.js` samples that photo and derives the gradient and mesh colours it dissolves into, per light/dark mode, so the bottom of the screen always blends with whatever house is at the top. No separate mobile wallpapers to supply.
- **`hemma_mobile.yaml.example`** — a fully commented starter template. Like the desktop dashboard, the mobile dashboard is configured in a single entities-only file; the example documents every block and includes a step-by-step recipe for adding rooms.

## New — Popup graphs

The climate, energy, and network popups now include interactive history graphs, powered by **apexcharts-card** (new required integration — install via HACS).

## Reorganized script layer

`dashboard-redirect.js` has been split into three focused resources:

| New file | What it does |
|---|---|
| `hemma-icons.js` | The inline icon map (`window.HEMMA_ICONS`). **Register this first** — icon resolution is race-sensitive. |
| `hemma-core.js` | Shared code more than one template needs: the Now Playing source collector, the active-state and filter-category tables that `smart-row.js` and `filter-overlay.js` both read, and the Plex session popup builder. |
| `hemma-redirect.js` | Phone ↔ dashboard routing, plus the mobile background injection. |

**The redirect is on by default**, gated on `input_boolean.hemma_dashboard_redirect`. It fails closed — if Home Assistant isn't ready or the helper doesn't exist, nothing is redirected — so phones only get routed once that helper confirms it's on. Turn the helper off if you'd rather reach each dashboard by its own URL.

## Theme

- **Hemma theme (`themes/hemma/hemma.yaml`)** has been redesigned for the 2.0 dashboards.
- **Glass pills** are now a single tunable material with its own variable family (`--hemma-glass-pill-*`) covering fill, accent, sheen, corner bloom, and dispersion, rather than being hardcoded per popup.
- **Active card tinting** moved from a gradient to a flat tint, with a separate hover value.
- **Hemma Glass theme (`themes/hemma/hemma_glass.yaml`)** has been removed. If you'd like to keep the old file, grab it from a v1.4.x release before upgrading.

## Entity Actions card, redesigned

`hemma_entity_actions` (originally contributed by [@hostand](https://github.com/hostand)) puts up to two action buttons in a rail down the right side of any entity card. It's been rebuilt for this release:

- Each button is now a flat capsule that fills with its **domain accent colour** when its entity is on, matching the colour the tile's own icon circle would use and dims when the entity is unavailable.
- Disabling an action, or leaving its entity unset, removes that capsule entirely. Disable both and the rail collapses so the card reflows to normal padding.
- New `action_N_active_color` to override the accent per button, and `svg_path` to point bare icon names somewhere other than `/local/hemma/icons`.
- Icons now accept `mdi:*`, a bare Hemma SVG name, or a full path/URL, and fall back to the entity's own icon attribute.

Alongside it, `hemma_entity` gained an **`active_entities`** hook: point a card's active state at one or more entities other than its own `entity:`, with `active_entities_mode: any | all`. Useful when a tile's entity is a passive sensor that never reads as active but its action buttons do.

## Other new cards

- **`hemma_presence`** — a read-only card showing home/away status for a single person sensor, with an automatic display-name fallback.
- **`hemma_cover`** — the curtain card, renamed and extended to cover blinds, shades, and garage doors.

## Fixes and refinements

- **No more icon pop-in.** Every Hemma icon is embedded as an inline data URI in `hemma-icons.js`, so icons paint in the same frame as the rest of the card instead of arriving a beat late — most visible when navigating between rooms on desktop.
- **Popup flicker fixed.** The network and energy popups no longer rebuild their status badge and gauge every time an unrelated sensor updates, so those elements stop collapsing and re-expanding while you watch them.
- **Thermostat controls behave properly with multiple cards.** Tapping a second thermostat now moves the controls overlay to that card instead of opening it on both.
- **Mobile scrolling** stops at the bottom card instead of running on into empty space.
- **Landscape padding** on the mobile dashboard and its popups now lines up with the home view.
- **Light popup** gained room pre-selection (`initial_filter`) and a Scenes pill with snapshot/restore.

---

## Breaking changes

Everything below is relative to **v1.4.1**, the last release. The mobile dashboard, the Now Playing panel, and the Energy/Security badge rows are all new in 2.0, so nothing in those areas can break an existing setup.

### Renamed templates

| Old | New |
|---|---|
| `hemma_curtain` | `hemma_cover` |
| `hemma_navbar_mobile.yaml` | `hemma_navbar_tablet.yaml` |

The `!include` line for the navbar appears once per view in `hemma.yaml`.

### Renamed resources

| Old | New |
|---|---|
| `hemma-smart-row.js` | `smart-row.js` |
| `navbar-sidebar-offset.js` | `layout-offsets.js` |

### Badge visibility now follows your entities

**This one can visibly change an existing dashboard, so read it before upgrading.**

`show_climate`, `show_lights`, `show_media`, `show_presence`, `show_weather`, and `show_media_player_1`–`10` no longer do anything. A badge row now appears whenever you've given it entities to show, and stays hidden otherwise:

| Badge | Appears when |
|---|---|
| Climate | any of `climate_entity_1` / `temp_sensor_1` / `humidity_sensor` / `quality_sensor` is set |
| Lights | `light_entity_1` **or** `light_group_entity` |
| Presence | `presence_entity_1` (a second entity switches it to the expandable group badge) |
| Weather | `weather_entity` |
| Media | `media_player_1` — unless `show_now_playing: true`, which replaces the row with the Now Playing panel |
| Energy | `energy_power_entity` |
| Security | `security_lock_entity` **or** `security_entity_1` |

**What to check:** anywhere you had `show_…: false` *while still having that badge's entities configured*, the badge will now appear. The common case is a room view with `show_weather: false` and a `weather_entity` still set. To hide a badge now, remove its entities rather than flipping a flag.

### Removed

- **`plex_binary_N`** — Plex sources are now driven by `plex_stream_N` alone. Delete the `plex_binary_N` lines from your room cards; the session sensor supplies both the active-state gate and the stream details.
- **`navbar-scroll.js`** — the collapsing phone navbar it powered is gone, replaced by the mobile dashboard's own header. **Remove it from Settings → Dashboards → Resources**, or it will 404 on every page load.
- **`www/hemma/mobile/` and its wallpapers** — the mobile background now reuses your room photo instead of a separate morning/day/night set, so these are gone. Upgraders can delete the folder; nothing reads it. The `sensor.hemma_dynamic_mobile_backgrounds` helper that picked the phase is gone from `hemma_helpers.yaml` too.
- `hemma_entity_layout` — if you use it, keep your copy from a v1.4.x release before upgrading.
- `hemma_nav_button` — an orphaned base template, unreferenced since before v1.4.1.
- `themes/hemma/hemma_glass.yaml` — if you'd like to keep it, grab it from v1.4.1 before upgrading. Select **Hemma** under Settings → Appearance → Themes after updating.
- The unused `door.svg`, `door_open.svg`, and `humidifier-on.svg` icons, in favour of `door-open.svg`, `door-closed.svg`, and the shared humidifier art.

---

## Upgrading from v1.4.x

1. **Copy** the updated `dashboards/templates/`, `www/hemma/`, `themes/hemma/`, and `packages/hemma_helpers.yaml` into `/config`. If you were on the Hemma Glass theme, select **Hemma** under Settings → Appearance → Themes.

2. **Install apexcharts-card** via HACS (now required).

3. **Update your Lovelace resources.** One to delete:
   - `navbar-scroll.js` — **remove this entry**, the file is gone

   Two renames:
   - `hemma-smart-row.js` → `/local/hemma/scripts/smart-row.js`
   - `navbar-sidebar-offset.js` → `/local/hemma/scripts/layout-offsets.js`

   And four new entries. Add the first two **before** the others — the rest read their icons and shared tables from them:
   - `/local/hemma/scripts/hemma-icons.js` — **first**
   - `/local/hemma/scripts/hemma-core.js` — **second**
   - `/local/hemma/scripts/filter-overlay.js`
   - `/local/hemma/scripts/hemma-redirect.js` *(phone → mobile dashboard routing, on by default)*

4. **Apply the renames** in your `hemma.yaml` — see [Breaking changes](#breaking-changes) above: `hemma_curtain` → `hemma_cover`, the navbar `!include` path, and deleting any `plex_binary_N` lines.

   Then scan your room cards for `show_…: false` lines that still have that badge's entities set — those badges will now appear. See [Badge visibility now follows your entities](#badge-visibility-now-follows-your-entities).

5. **New helpers.** `packages/hemma_helpers.yaml` adds `input_boolean.hemma_dashboard_redirect`, `input_boolean.hemma_now_playing_minimized`, and `input_text.hemma_now_playing_pinned`, and adds `security` and `energy` options to `input_select.hemma_expanded_row` and `input_select.hemma_mobile_filter`. Copy the file even if you're only updating the desktop dashboard.

6. **Optional — add the mobile dashboard.** Register it in `configuration.yaml` (see the README's step 4) and create `hemma_mobile.yaml` from the new example file.

7. **Optional — turn on the new features.** Now Playing (`show_now_playing: true`), the Energy badge row (`energy_entity_N`), and the Security badge row (`security_entity_N`) are all opt-in; existing views keep working untouched. `hemma.yaml.example` has commented starter blocks for each.

8. **Restart Home Assistant.**

Full setup instructions are in the [README](README.md).
