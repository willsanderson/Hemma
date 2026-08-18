<img width="1729" height="1383" alt="hemma" src="https://github.com/user-attachments/assets/66b364c9-1af1-4a7b-951a-9ba2b0d839e3" />

## Hemma

A modern mobile-friendly dashboard for Home Assistant.  Inspired by the [Homio](https://github.com/iamtherufus/Homio) dashboard by @iamtherufus, Hemma is rebuilt and extended with new layouts, cards, and a streamlined setup process.

The dashboard is fully YAML-based and designed for:
- Desktop, tablet, and mobile (portrait + landscape)
- Light/Dark mode styling
- Flat card design with Liquid Glass accents
- Badges for climate, sensors, presence, and active media
- Clean navigation with desktop/tablet top navbar

Hemma now ships as **two dashboards**: the desktop/tablet dashboard (`hemma.yaml`) and a brand-new, dedicated **mobile dashboard** (`hemma_mobile.yaml`) inspired by Apple Home. Phones are automatically routed to the mobile dashboard (and everything else back to desktop) by the included redirect script.

---
### Highlights and Features
- **Light/dark** mode with dynamic background images
- **Layouts + spacing logic** for scaling across different devices
- **Hemma theme** (`hemma.yaml`) — flat card design with glass accents
- **Demo room images** included — eight pre-made day/night backgrounds to get started without your own photos
- **Custom Popups** for button cards
- **Custom navigation** and Scene support
  - Motion detection built into navigation menu
- **Badges** (shown in the hero section of each room card)
  - Climate group badge — temperature range, HVAC state, humidity, air quality
  - Light group badge
  - Presence + sensor badges
  - Active media player badge
  - Energy group badge — per-room or per-device power, usage, and cost
  - Security group badge — locks, alarm panel, door/window sensors, cameras
- **Now Playing** — a full media panel showing every active source at once, with controls, progress, and pinnable media chips
- **Button-cards**
  - Thermostat, media, lock, doorbell, network, motion, cover, energy, presence, vacuum, Plex Recently Added, and more.
- **Popups**
  - Climate/air quality, energy usage, network, light control (multi-room + scenes), lock/security group, cover/shades group, plant monitor, battery monitor, system updates, Plex stream, and Plex Recently Added.

### :iphone: Mobile Dashboard
A dedicated phone experience inspired on the Apple Home app:
- **Filter badge pills** (Climate / Lights / People / Media / Security / Energy) — tap a pill and a full-screen popup slides up with every matching card from your rooms, auto-collected (no per-popup configuration)
- **Room popups** — tap a room's section header for a popup with all of that room's cards, plus a room-scoped sensor chip row (temperature / humidity / air quality / lights / motion) that deep-links into the matching popups
- **Collapsing header** with a frosted glass bar that fades in as you scroll
- **Now Playing** row of full-width media tiles
- **Smart sections** — active cards sort first, sections and popups stay in sync automatically
- **Always opens on Home** — the dashboard resets to the home view on every fresh load
---

### Requirements

#### Home Assistant
- Lovelace dashboards enabled, and **keep Lovelace in `storage` mode** (so you can still use the UI editor for other dashboards).
- **A time sensor** — the clock on each room's hero card reads `sensor.time`, which is *not* part of `default_config`. Either add it under Settings → Devices & Services → **Add Integration → Date & time** (enable the "Time" sensor), **or** use the `sensor.current_time` template sensor included in this repo's `sensors.yaml` and point `hemma_time` at it with `time_entity: sensor.current_time`. Without one of the two, the clock renders blank.
- **Packages enabled** — `packages/hemma_helpers.yaml` is loaded via `homeassistant: packages: !include_dir_named packages` in `configuration.yaml`.

#### Custom cards (required)
Install via HACS (recommended) unless noted:

- **[button-card](https://github.com/custom-cards/button-card)** (RomRider)
- **[layout-card](https://github.com/thomasloven/lovelace-layout-card)** (Thomas Lovén) — Hemma uses a **modified** version included in this repo (don't install via HACS).
- **[lovelace-navbar-card](https://github.com/joseluis9595/lovelace-navbar-card)** (Jose Luis Álvarez) - required for navigation + media badge
- **[browser_mod](https://github.com/thomasloven/hass-browser_mod)** (Thomas Lovén) - required for custom popups
- **[uix](https://github.com/Lint-Free-Technology/uix)** (Lint Free Technology) - required for popup card styling (replaces card-mod; don't install card-mod alongside it)
- **[apexcharts-card](https://github.com/RomRider/apexcharts-card)** (RomRider) - required for the graphs in the climate, energy, and network popups

#### Optional
- **[kiosk-mode](https://github.com/NemesisRE/kiosk-mode)** (NemesisRE) - Optional but highly recommended (the dashboard looks best with no header/sidebar)
- **[lovelace-swipe-card](https://github.com/bramkragten/swipe-card)** (Bram Kragten) - Required for the Plex Recently Added popup carousel
- **[plex_recently_added](https://github.com/NemesisRE/sensor.plex_recently_added)** (NemesisRE) - Required for the Plex Recently Added card and `sensor.plex_recently_added_count`

---

### Desktop View
<img width="1400" height="840" alt="home-day" src="https://github.com/user-attachments/assets/5f80dffb-455d-4773-bfc6-c0f43cf93f18" />

### Light/Dark Mode
<img width="1400" height="843" alt="bedroom-day" src="https://github.com/user-attachments/assets/e111998e-03e6-416d-9e43-d09049767046" />

<img width="1400" height="842" alt="bedroom-night" src="https://github.com/user-attachments/assets/01d75265-ecca-4378-aaad-e4788010fa6e" />

### Mobile View (Light/Dark)
<img width="850" height="600" alt="mobile" src="https://github.com/user-attachments/assets/96b0a526-62aa-450b-b0a4-dd1cbf6ba4af" />

---

### Popup Cards

##### Light Control
<img width="615" height="361" alt="lights" src="https://github.com/user-attachments/assets/eda0853b-8e49-459a-a4d2-010ef335ec4d" />

##### Air Quality
<img width="615" height="668" alt="aqi" src="https://github.com/user-attachments/assets/2356570c-18be-4234-88f6-85d8d18dfb9e" />

##### Network
<img width="615" height="702" alt="network" src="https://github.com/user-attachments/assets/923716b7-91a2-4df4-a5c9-c01763c34915" />

##### Energy Usage
<img width="615" height="513" alt="energy" src="https://github.com/user-attachments/assets/1e24e4ae-e8ed-4dfa-a6dc-10d05b27c2bc" />

##### Battery Monitor
<img width="615" height="567" alt="battery" src="https://github.com/user-attachments/assets/ad086dde-2b20-4d41-8d5c-017318c7b800" />

##### Plant Monitor
<img width="615" height="437" alt="plant" src="https://github.com/user-attachments/assets/0136bb91-851b-446b-bec3-114f045d68dc" />

##### System Updates
<img width="615" height="388" alt="updates" src="https://github.com/user-attachments/assets/2eb63736-c9de-4770-813a-c36f643153be" />

##### Recently Added
<img width="615" height="475" alt="recently-added" src="https://github.com/user-attachments/assets/19b689f4-19e5-4538-b2e1-3bfd342fa3a2" />

---

### :file_folder: Folder layout

Everything in this repo is meant to live under `/config` in your Home Assistant installation.

Example layout:

```text
/config
├── configuration.yaml                  # Register the Hemma dashboards here
├── dashboards/
│   ├── hemma/
│   │   ├── hemma.yaml                  # Desktop/tablet dashboard (created from example)
│   │   ├── hemma.yaml.example          # Example desktop dashboard with placeholders
│   │   ├── hemma_mobile.yaml           # Mobile dashboard (created from example)
│   │   └── hemma_mobile.yaml.example   # Example mobile dashboard with placeholders
│   └── templates/
│       ├── button_cards/               # Button-card templates
│       │   ├── badges/                 # Hero-card badges (climate, lights, presence, media, energy, security)
│       │   ├── base/                   # Shared base templates (hemma_entity, hemma_default, hemma_time, etc.)
│       │   ├── cards/                  # Individual device cards (thermostat, media, lock, cover, energy, Plex, etc.)
│       │   ├── mobile/                 # Mobile dashboard scaffolding (header, badge row, chips, Now Playing row)
│       │   ├── now_playing/            # Now Playing panel (primary tile, rail chips, artwork, transport, header)
│       │   └── popups/                 # browser_mod popup content (climate, energy, network, light, lock,
│       │                               #   cover, plant, battery, updates, Plex, recently-added)
│       └── includes/                   # Layout + navigation includes
│           ├── hemma_screen_layout.yaml
│           ├── hemma_mobile_layout.yaml
│           ├── hemma_navbar_tablet.yaml
│           └── hemma_navigation.yaml
├── themes/
│   └── hemma/
│       └── hemma.yaml                  # Hemma theme
├── packages/
│   └── hemma_helpers.yaml              # Helpers required by the dashboards
└── www/
    └── hemma/
        ├── fonts/                      # UI fonts
        ├── icons/                      # UI icons
        ├── rooms/                      # Room/background images (*-demo.jpg variants included)
        ├── weather/                    # Weather icons
        └── scripts/                    # JavaScript resources
            ├── layout-card-modified.js # Modified Layout Card build
            ├── navbar-popup-caret.js   # Add dropdown icon to navbar
            ├── layout-offsets.js       # Navbar/hero offsets track sidebar visibility
            ├── swipe-card-patch.js     # Plex Recently Added carousel
            ├── smart-row.js            # Smart entity row with active-card sorting
            ├── filter-overlay.js       # Mobile filter/room popups + collapsing header
            ├── hemma-icons.js          # Inline icon map (load first)
            ├── hemma-core.js           # Shared card helpers + Now Playing collector + mobile wallpaper
            └── hemma-redirect.js       # Phone ↔ mobile dashboard routing (on by default)
```

## :rocket: Installation

### 1) Backup first
Make a full Home Assistant backup/snapshot before you start. YAML dashboards + themes are easy to roll back, but you'll be happier if you can restore quickly if something goes sideways.

### 2) Copy Hemma into your Home Assistant config
Copy these folders/files from this repo into your HA `/config`:

- `dashboards/hemma/` → `/config/dashboards/hemma/`
- `dashboards/templates/` → `/config/dashboards/templates/` (merge if you already have templates)
- `themes/hemma/` → `/config/themes/hemma/`
- `packages/hemma_helpers.yaml` → `/config/packages/`
- `www/hemma/` → `/config/www/hemma/`

### 3) Add Lovelace resources
In Settings → Dashboards → Resources, add:

Add these two first — the others read their icons and shared entity tables from them:

- `/local/hemma/scripts/hemma-icons.js` (from this repo)
- `/local/hemma/scripts/hemma-core.js` (from this repo, **required** — shared card helpers, the Now Playing collector, and the mobile wallpaper: it samples your home photos to derive the colours the mobile background fades into)

Then the rest, in any order:

- `/local/hemma/scripts/layout-card-modified.js` (from this repo)
- `/local/hemma/scripts/navbar-popup-caret.js` (from this repo)
- `/local/hemma/scripts/layout-offsets.js` (from this repo)
- `/local/hemma/scripts/swipe-card-patch.js` (from this repo, required for Plex Recently Added popup)
- `/local/hemma/scripts/smart-row.js` (from this repo, required for Smart Row)
- `/local/hemma/scripts/filter-overlay.js` (from this repo, required for the mobile dashboard)
- `/local/hemma/scripts/hemma-redirect.js` (from this repo, recommended — routes phones to the mobile dashboard and back)
- `/local/hemma/fonts/hanken-grotesk.css` (from this repo)
- `/hacsfiles/button-card/button-card.js` (should already be present if installed via HACS)
- `/hacsfiles/lovelace-navbar-card/navbar-card.js` (should already be present if installed via HACS)

### 4) Register the Hemma dashboards
Add (or verify) in your `configuration.yaml`:

```yaml
lovelace:
  mode: storage
  dashboards:
    dashboard-hemma:
      mode: yaml
      title: "Hemma"
      icon: mdi:home
      show_in_sidebar: true
      filename: dashboards/hemma/hemma.yaml
    dashboard-hemma-mobile:
      mode: yaml
      title: "Hemma Mobile"
      icon: mdi:cellphone
      show_in_sidebar: false
      filename: dashboards/hemma/hemma_mobile.yaml
```

The mobile dashboard is hidden from the sidebar on purpose. With `hemma-redirect.js` installed, phones are sent to it automatically and everything else goes back to the desktop dashboard, so nobody has to pick. Without the script, reach the mobile dashboard by its URL.

The redirect is **on by default** (`input_boolean.hemma_dashboard_redirect`). Left off, a phone opening the *desktop* Hemma dashboard gets desktop content rendered with the mobile CSS, which looks like a broken mobile dashboard rather than a desktop one. The redirect is only active when using the Hemma dashboard, and it can be disabled entirely by turning the helper off.

#### Your own wallpaper

Point the theme at your own pair of photos and everything below them follows automatically:

```yaml
  hemma-mobile-hero-img-day: url("/local/hemma/rooms/my-home.jpg")
  hemma-mobile-hero-img-night: url("/local/hemma/rooms/my-home-night.jpg")
```

`hemma-core.js` reads both images and derives the gradient and mesh colours the
photo dissolves into, per mode, so the bottom of the screen blends with whatever
house is at the top. The hex values in the theme are only fallbacks for the demo
photos, and if that script is missing they paint instead, silently, and your
wallpaper ends up carrying the demo house's colours. Serve the photos from
`/local/` so the sampling stays same-origin.

Restart Home Assistant.

### 5) Create your dashboards from the example files

In `/config/dashboards/hemma/`:

- Copy or rename `hemma.yaml.example` → `hemma.yaml`
- Copy or rename `hemma_mobile.yaml.example` → `hemma_mobile.yaml`
- Open each and replace all placeholders (search for `YOUR_`)

These are the only files you edit to map Hemma to your devices/entities — all behavior lives in the shared templates.

### 6) Enable the Hemma theme

- Settings → Appearance → Themes → choose **Hemma**
  *(You may need to reload themes or restart after copying.)*

### 7) Add your room images + icons

- Room images live in: `/config/www/hemma/rooms/`
  - Example: `home.jpg` (light) and `home-night.jpg` (dark)
  - Eight **demo room images** are included (`*-demo.jpg` / `*-demo-night.jpg`) so you can get started without your own photos
- Icons live in: `/config/www/hemma/icons/`

---

## :pencil: Configuring your rooms

You'll configure most of Hemma by editing your dashboard file:

- `/config/dashboards/hemma/hemma.yaml`

### Key view building blocks

Each view typically contains:

- `hemma_room` (this is the main hero card)
- Mobile navbar include (desktop/tablet navigation menu)
- Entity grid include

---

### :thermometer: Climate badge

The climate group badge aggregates temperature, HVAC activity, humidity, and air quality into a single tappable badge on the hero card. Tap to expand sub-badges for temperature range, humidity, and air quality.

> **Dependency:** The expand/collapse behaviour for all badge groups (climate, lights, presence, media, energy, security) is driven by `input_select.hemma_expanded_row`. This entity is defined in `packages/hemma_helpers.yaml` — make sure you have copied that file and reloaded HA (or restarted) so the entity exists before using any badge. Without it, tapping a badge group will throw a service-call error and the sub-badge row will not expand.

> **Badges are enabled by their entities.** As of 2.0 there are no `show_*` switches for the badge rows — a badge appears as soon as you give it something to show and stays hidden otherwise. The climate badge appears when **any** of `climate_entity_1`, `temp_sensor_1`, `humidity_sensor`, or `quality_sensor` is set.

| Variable | Description |
|---|---|
| `climate_entity_1` – `climate_entity_3` | Climate/thermostat entities — used to detect active HVAC and animate the fan icon |
| `temp_sensor_1` – `temp_sensor_5` | Temperature sensors — if multiple are provided, the badge shows a min–max range |
| `humidity_sensor` | Humidity sensor (shown in expanded sub-badges) |
| `quality_sensor` | Air quality sensor (shown in expanded sub-badges) |
| `temp_unit` | `'F'` or `'C'` — controls comfort label thresholds |
| `show_climate_inline` | `true` to show temp/humidity/air-quality as individual badges on the top row instead of one expandable group badge |

---

### :bulb: Light badge

The light group badge shows the combined state of your room lights and lets you tap to toggle them. It appears when either `light_entity_1` or `light_group_entity` is set.

| Variable | Description |
|---|---|
| `light_group_entity` | A light group covering the whole room/home |
| `light_entity_1` – `light_entity_10` | Light group or individual light entities |

If the group you point at sits inside a larger one, the popup opens on that larger group with a pill per room and this room selected. `light_group_entity` picks what the badge shows; `popup_group` on a `hemma_light` card overrides what its popup opens, and `popup_group: none` keeps the popup to that card's own lights.

---

### :bust_in_silhouette: Presence badge

Shows a grouped presence badge on the hero card. Tap to expand individual person badges.

Set one `presence_entity_1` for a single person badge; set two or more and you get the expandable group badge instead.

| Variable | Description |
|---|---|
| `presence_entity_1` – `presence_entity_4` | Person status sensors |

---

### :cloud: Weather widget

Hemma includes a compact weather widget for both desktop and mobile/tablet views.

The widget appears when `weather_entity` is set.

| Variable | Description |
|---|---|
| `weather_entity` | Your HA weather entity |
| `weather_temp_sensor` | *(optional)* A separate sensor for outdoor temperature |
| `temp_unit` | `'F'` or `'C'` — controls comfort thresholds and labels |

Template: `hemma_weather`

(See `dashboards/templates/button_cards/.../hemma_weather.yaml` for full template code.)

---

### :tv: Media badges

Media badges appear on the hero card and show what's currently playing. They auto-hide when nothing is active, and auto-show when a player becomes active (including recently paused).

They appear when `media_player_1` is set — *unless* `show_now_playing: true`, in which case the **Now Playing** panel (documented in the next section) takes over and the badge row is suppressed so the same session can't show twice.

| Variable | Description |
|---|---|
| `media_player_1` – `media_player_10` | Media player entity IDs |
| `pause_timeout_minutes` | Minutes before a paused player is considered inactive (default: `5`) |

Example home view with all badge types enabled:

```yaml
- type: custom:button-card
  template: hemma_room
  name: Home
  variables:
    image: home
    image_position: center center

    # Climate badge — appears because climate/temp/humidity/quality entities are set
    climate_entity_1: climate.living_room
    climate_entity_2: climate.bedroom
    temp_sensor_1: sensor.home_temperature
    temp_sensor_2: sensor.living_room_temperature
    humidity_sensor: sensor.average_humidity
    quality_sensor: sensor.air_quality
    temp_unit: 'F'

    # Light badge — appears because a light entity is set
    light_entity_1: light.living_room
    light_entity_2: light.bedroom

    # Weather widget — appears because weather_entity is set
    weather_entity: weather.your_weather
    weather_temp_sensor: sensor.your_outdoor_temp

    # Presence badge — two entities, so the expandable group badge is used
    presence_entity_1: sensor.person_one_status
    presence_entity_2: sensor.person_two_status

    # Media badges — appear because media_player_1 is set.
    # Add `show_now_playing: true` instead to use the Now Playing panel,
    # which replaces this badge row and reuses the same entities.
    media_player_1: media_player.spotify
    media_player_2: media_player.living_room_apple_tv
    media_player_3: media_player.kitchen
    media_player_4: media_player.bedroom_apple_tv

    # Energy badge — appears because energy_power_entity is set
    energy_power_entity: sensor.home_current_consumption

    # Security badge — appears because a lock or security entity is set
    security_entity_1: lock.front_door
    security_label_1: Front Door
```

Notes: badge rows are enabled by their entities, not by `show_*` flags — a badge with no entities stays hidden, so there is nothing to switch off. Media badges additionally only appear when a player is actually active (playing, buffering, or recently paused within `pause_timeout_minutes`).

---

### :musical_note: Now Playing

The Now Playing panel is an alternative to the media badge row. Where the badges surface one player at a time, the panel shows **every** active source at once: a primary tile with artwork, title, subtitle, progress bar, and transport controls, plus a rail of compact chips for everything else.

Set `show_now_playing: true` on a room card. `hemma_room` suppresses the media badge row automatically when the panel is on, so the same session never appears twice — there's nothing to switch off. The panel reuses the `media_player_N` entities you've already configured.

| Variable | Default | Description |
|---|---|---|
| `show_now_playing` | `false` | `true` to use the panel instead of the media badge row |
| `now_playing_panel` | `'0'` | `'0'` = tiles float free, right-aligned, no container. `'1'` = tiles wrapped in a glass panel with a collapsible "Now Playing" header |
| `media_player_1` – `media_player_10` | — | Standard media player entities |
| `plex_stream_1` – `plex_stream_2` | — | Plex/Tautulli session sensors — these tiles open the Plex popup rather than more-info |
| `psn_1` – `psn_2` | — | Game-activity sensors (e.g. PlayStation), shown as activity sources |
| `pause_timeout_minutes` | `5` | Minutes before a paused source drops out of the panel |

**Interaction:** tap a rail chip to promote it to the primary slot; hold to pin it there (stored in `input_text.hemma_now_playing_pinned`). With `now_playing_panel: '1'`, the header collapses the panel, tracked by `input_boolean.hemma_now_playing_minimized`.

**Requires:** `hemma-core.js` registered as a Lovelace resource, which holds the source collector both dashboards read. The mobile dashboard's Now Playing row uses the same collector and the same tile templates.

---

### :zap: Energy badges

The energy group badge adds an expandable row of value badges to the hero card. Each `energy_entity_N` gets one badge (up to 6). On the Home view these are typically per-room totals; on a room they're usually its own Today / This Month figures.

| Variable | Description |
|---|---|
| `energy_power_entity` | Current consumption, shown in this view's energy popup |
| `energy_usage_today` / `energy_usage_month` | Daily / monthly consumption for the popup |
| `energy_cost_today` / `energy_cost_month` | *(optional)* Cost sensors for the popup |
| `energy_entity_1` – `energy_entity_6` | The sensor behind each sub-badge |
| `energy_label_N` | Badge title — falls back to the entity's friendly name |
| `energy_unit_N` | `auto` (W, switching to kW above 1000), `kwh`, or `cost` |
| `energy_cost_N` | *(optional)* Cost sensor appended to the value as `· $1.23` |

By default a sub-badge opens this view's own energy popup. To point a badge at a different room's popup — as the Home view does for its per-room badges — set the matching `energy_popup_*_N` keys:

```yaml
    energy_entity_1: sensor.bedroom_current_consumption
    energy_label_1: Bedroom
    energy_popup_name_1: Bedroom
    energy_popup_power_1: sensor.bedroom_current_consumption
    energy_popup_today_1: sensor.bedroom_daily_consumption
    energy_popup_month_1: sensor.bedroom_monthly_consumption
    energy_popup_cost_today_1: sensor.bedroom_daily_consumption_cost
    energy_popup_cost_month_1: sensor.bedroom_monthly_consumption_cost
```

---

### :lock: Security badges

The security group badge expands into one badge per security entity. A single template handles every type, picking its icon and wording from the entity's domain:

| Domain | States shown |
|---|---|
| `lock.*` | Locked / Unlocked |
| `alarm_control_panel.*` | Armed Home / Armed Away / Disarmed / Triggered |
| `binary_sensor.*` (door, window, garage, opening) | Open / Closed |
| `camera.*` | Live / Idle |
| `cover.*` (garage) | Open / Closed |

| Variable | Description |
|---|---|
| `security_entity_1` – `security_entity_8` | Any mix of the domains above |
| `security_label_N` | Badge title — falls back to the entity's friendly name |

**Aggregated Locks badge (Home view).** Rather than one badge per lock, `security_locks` collapses them all into a single "Locks" badge that opens the shared lock group popup — the way the Lights badge aggregates lights. Rooms below keep using individual `security_entity_N` badges.

```yaml
    security_lock_entity: lock.front_door
    security_locks:
      - lock.front_door
      - lock.back_door
    security_lock_batteries:
      lock.front_door: sensor.front_door_lock_battery      # optional
    security_door_sensors:
      lock.front_door: binary_sensor.front_door            # optional
```

---

### :twisted_rightwards_arrows: Smart Row (`hemma-smart-row`)

`hemma-smart-row` is a custom Lovelace card that replaces a static list of entity cards with a self-sorting row. On desktop, any card that becomes active automatically slides to the front of the row using a FLIP animation. On mobile portrait and landscape the cards render in a fixed grid — no reordering.

**Requires:** `smart-row.js` registered as a Lovelace resource (included in this repo).

#### Usage

Replace a plain list of `button-card` entries with a single `hemma-smart-row` card and nest your cards inside:

```yaml
- type: custom:hemma-smart-row
  cards:
    - type: custom:button-card
      template: hemma_light
      entity: light.living_room
      name: Living Room
    - type: custom:button-card
      template: hemma_thermostat
      entity: climate.living_room
      name: Thermostat
    - type: custom:button-card
      template: hemma_media
      entity: media_player.apple_tv
      name: Apple TV
```

#### Options

| Variable | Default | Description |
|---|---|---|
| `cards` | required | Array of card configs (same format as any Lovelace card list) |
| `sort` | `true` | Set to `false` to disable active-card sorting and render in config order |

#### How sorting works

- Active state is detected via `--hemma-active-overlay-opacity: 1` on each card's shadow DOM (works with all Hemma templates including plant thresholds and numeric conditions).
- When a card becomes active it moves to the front of the row after a short 2.5 s delay — long enough to avoid flickering on transient states.
- On page load, active cards are pre-sorted before the entry animation plays so the sweep order always matches the sorted order.
- Respects `prefers-reduced-motion` — reorders instantly without animation when enabled.

---

### :zap: Entity Actions card (`hemma_entity_actions`)

`hemma_entity_actions` extends `hemma_entity` with up to two action buttons in a rail down the right side of the card. Each button is a flat capsule that fills with its domain's accent colour when its entity is on, dims when the entity is unavailable, and disappears entirely when disabled or left without an entity. Turn both off and the rail collapses so the card reflows to normal padding.

Originally contributed by [@hostand](https://github.com/hostand).

```yaml
- type: custom:button-card
  template: hemma_entity_actions
  entity: sensor.fridge_status
  name: Fridge
  variables:
    icon: fridge

    action_1_entity: switch.fridge_mode
    action_1_icon: mdi:fridge-outline
    action_1_action: toggle

    action_2_entity: switch.fridge_super_cool
    action_2_icon: mdi:snowflake
    action_2_action: toggle
```

#### Action variables

Replace `N` with `1` or `2`.

| Variable | Default | Description |
|---|---|---|
| `action_N_entity` | — | Entity the button acts on and reads state from. Required — no entity, no button |
| `action_N_enabled` | `true` | Set to `false` to hide this button |
| `action_N_icon` | entity's own icon, then `mdi:help-circle` | `mdi:*`, a bare Hemma SVG name, or a full `/local/…`, `http(s)://…`, or `.svg`/`.png`/`.webp` path |
| `action_N_active_color` | domain accent | CSS colour for the active fill, overriding the domain default |
| `action_N_action` | `more-info` | `more-info` · `toggle` · `navigate` · `call-service` |
| `action_N_navigation_path` | — | Path for the `navigate` action |
| `action_N_service` | — | `domain.service` for the `call-service` action |
| `action_N_service_data` | `{}` | Service data map. `entity_id` defaults to `action_N_entity` |
| `svg_path` | `/local/hemma/icons` | Base path used to resolve bare SVG icon names |

#### Driving the tile's active state from the buttons

The tile's own active state follows its `entity:` as usual, and the buttons light up independently. If the tile points at a passive sensor that never reads as active, hand the job to the action entities instead:

```yaml
  variables:
    active_entities:
      - switch.fridge_mode
      - switch.fridge_super_cool
    active_entities_mode: all   # all = every entity on; any (default) = at least one
```

These are listed explicitly rather than inferred from `action_N_entity`, so a card can key off entities that aren't buttons — and a tile with a meaningful status sensor can keep using it.

---

### :film_strip: Plex Recently Added card

`hemma_plex_recently_added` is a standard entity card that shows how many items Plex added in the last 7 days. It goes active (gold icon) when the count is above zero. Tapping opens the `hemma_popup_recently_added` swipe-card carousel with poster art, title, year, and release date for each recently added movie or episode.

**Requires:**
- [`plex_recently_added`](https://github.com/NemesisRE/sensor.plex_recently_added) HACS integration — provides `sensor.recently_added_movies` and `sensor.recently_added_tv`
- [`lovelace-swipe-card`](https://github.com/bramkragten/swipe-card) HACS card — powers the popup carousel
- `swipe-card-patch.js` registered as a resource (included in this repo) — syncs pagination bullet color to content type

The `sensor.plex_recently_added_count` template sensor is defined in `packages/hemma_helpers.yaml`.

---

### :iphone: Configuring the mobile dashboard

Everything is configured in one file: `/config/dashboards/hemma/hemma_mobile.yaml` (created from `hemma_mobile.yaml.example`, which documents every block inline). The file is entities-only — filters, popups, the collapsing header, and room chips are all driven by the shared templates.

Top-to-bottom structure:

| Block | What you edit |
|---|---|
| `BACKGROUND` | Nothing — the time-of-day wallpaper is automatic |
| `HEADER` | Weather entity + outdoor temp sensor |
| `BADGE ROW` | The entities behind each filter pill — pills with no entities hide — template `hemma_mobile_filter_badges` |
| `FILTERS` | Nothing — category popups auto-collect matching cards from your rooms |
| `ROOM POPUPS` | One entry per room; `room:` must match the section header name |
| `SUB BADGE ROW` | Home climate chips + per-room chips (`room_chips:`) — template `hemma_mobile_sensor_chips` |
| `NOW PLAYING` | Media players, Plex streams, and activity sensors for the media tile row — template `hemma_mobile_now_playing` |
| `FAVORITES` / rooms | Your cards — same button-card templates as the desktop dashboard |

Section headers use the `hemma_mobile_header` template, and the large dashboard title + weather widget at the top uses `hemma_mobile_weather`.

**Adding a room** — everything keys off the section header's `name:`, so there's only one identifier to get right:

1. Copy a section header + smart-row pair and give the header a unique `name:` (e.g. `Guest Room`).
2. Add a matching `hemma-filter-overlay` with `room:` set to that exact name — nothing else:
   ```yaml
   - type: custom:hemma-filter-overlay
     room: Guest Room
   ```
3. Make sure the room's **slug** is an option on `input_select.hemma_mobile_filter` in `packages/hemma_helpers.yaml`. The slug is the name lowercased with all non-alphanumerics stripped, `room_` prefixed — `Guest Room` → `room_guestroom`, `Kid's Room` → `room_kidsroom`.

   `room_livingroom`, `room_kitchen`, `room_bedroom`, and `room_office` ship **pre-seeded**, so those four need no edit at all. Any other room name does — without its slug in the list the section header still renders, but tapping it won't open anything. Unused pre-seeded options are harmless; leave them in place.

Optionally add a `room_chips:` entry for its sensor chips, and set `mobile_filter_categories:` on the header to control which filter pills the room's cards appear under.

**Step 3 is the only place you type the slug**, and the only step that can't be automated: Home Assistant helpers can't be created from a dashboard file, and the filter needs a real `input_select` state to hold the active room. The section header and the overlay both derive the key from the room's name themselves.

`room_key:` on the header remains available as an override for the rare case where a display name shouldn't drive the key — two rooms whose names slug identically, or a name containing an emoji. Setting it also overrides the overlay if you pass `filter_category:` explicitly there.

**Wallpaper:** nothing to configure here. The mobile background reuses the same room photo the desktop dashboard loads from `www/hemma/rooms/`, with the gradient beneath it coloured by sampling that photo — there is no separate set of mobile wallpapers. To point it at your own pair of images, see [Your own wallpaper](#your-own-wallpaper) above.

---

### :pencil2: Additional Customization

This repo is intended as a starting point:

- Swap out room/background images in `www/hemma/rooms/`.
- Tweak theme colors, shadows, and typography in `themes/hemma/hemma.yaml`.
- Adjust layouts (`hemma_screen_layout.yaml`, etc.) to match your devices and preferences.

### HA Companion App iOS Settings

Hemma is designed for edge-to-edge screens. If you are using the HA iOS Companion app, please ensure to enable **Edge to edge display** found in Settings → Companion app → General → Edge to edge display

### Button Card Icons

To add additional button card icons, you can download them from the links below and place the icons in the `www/hemma/icons/` folder:

[Apple Icons](https://developer.apple.com/sf-symbols/) - Set Background to **Dark** and Color to **Primary**

[Google Material Icons](https://fonts.google.com/icons?icon.query=light) - Weight 300 is recommended, file type: svg

Hemma also keeps an inline copy of every icon inside `hemma-icons.js` (`window.HEMMA_ICONS`) so icons paint in the same frame as the card rather than arriving over the network a beat later. A new SVG dropped into `www/hemma/icons/` still works without any further steps — it just falls back to loading from that path. To give it the same instant paint as the built-in icons, regenerate the map with the snippet in the comment above `window.HEMMA_ICONS` and paste the result back in.

### Time

You can switch from 12hr to 24hr time by switching the variables in `hemma_time.yaml`, example below:

```yaml
hemma_time:
  template:
    - hemma_default

  variables:
    time_entity: sensor.time

    # Whether to convert to 12h with AM/PM
    use_12h: false

    # Optional label after the time, e.g. "UHR", "HRS"
    time_suffix: "UHR"
```
---

### :trophy: Credits

- Original Homio concept and base implementation: [iamtherufus/Homio](https://github.com/iamtherufus/Homio)
- Original climate/air quality card design: [jerahmeel-sudo](https://github.com/jerahmeel-sudo/Custom-Air-Quality-Card-with-score-trends-and-pollutant-tiles)
- Big thanks to [SH1FT-W](https://github.com/SH1FT-W) for helping build out the custom pop up cards
- Hemma customization and ongoing tweaks: [@willsanderson](https://github.com/willsanderson)

#### Enjoying Hemma? Buy me a coffee :v::smiley:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V31RK6FB)
