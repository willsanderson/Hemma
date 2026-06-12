<img width="1481" height="932" alt="home-light" src="https://github.com/user-attachments/assets/fc4759ee-616d-4691-bc88-cf06faca397d" />

# :house_with_garden: Hemma

A modern, minimal, mobile-friendly dashboard for Home Assistant.  Inspired by the [Homio](https://github.com/iamtherufus/Homio) dashboard by @iamtherufus, Hemma is rebuilt and extended with new layouts, cards, and a streamlined setup process.

Hemma is fully YAML-based and designed for:
- Desktop, tablet, and mobile (portrait + landscape)
- Light/Dark mode styling
- Flat card design with an optional Liquid Glass theme
- Badges for climate, sensors, presence, and active media
- Clean navigation with a mobile navbar + desktop/tablet top navigation

---
### Highlights and Features
- **Light/dark** mode with dynamic background images
- **Layouts + spacing logic** for scaling across different devices
- **Two themes** — flat card (`hemma.yaml`) and Liquid Glass (`hemma_glass.yaml`)
- **Demo room images** included — eight pre-made day/night backgrounds to get started without your own photos
- **Custom Popups** for button cards
- **Custom navigation** and Scene support
  - Mobile navbar for tablet and phone — collapses to a circular button on scroll
  - Motion detection built into navigation menu
- **Badges** (shown in the hero section of each room card)
  - Climate group badge — temperature range, HVAC state, humidity, air quality
  - Light group badge
  - Presence + sensor badges
  - Active media player badge
- **Button-cards**
  - Thermostat, media, lock, doorbell, network, motion, curtain, energy, vacuum, Plex Recently Added, and more.
---

### Requirements

#### Home Assistant
- Lovelace dashboards enabled, and **keep Lovelace in `storage` mode** (so you can still use the UI editor for other dashboards).

#### Custom cards (required)
Install via HACS (recommended) unless noted:

- **[button-card](https://github.com/custom-cards/button-card)** (RomRider)
- **[layout-card](https://github.com/thomasloven/lovelace-layout-card)** (Thomas Lovén) — Hemma uses a **modified** version included in this repo (don't install via HACS).
- **[lovelace-navbar-card](https://github.com/joseluis9595/lovelace-navbar-card)** (Jose Luis Álvarez) - required for navigation + media badge
- **[browser_mod](https://github.com/thomasloven/hass-browser_mod)** (Thomas Lovén) - required for custom popups
- **[more-info-card](https://github.com/thomasloven/lovelace-more-info-card)** (Thomas Lovén) - required for custom popups
- **[lovelace-mushroom](https://github.com/piitaya/lovelace-mushroom)** (Paul Bottein) - required for custom popups
- **[uix](https://github.com/Lint-Free-Technology/uix)** (Lint Free Technology) - required for custom popup windows

#### Optional
- **[kiosk-mode](https://github.com/NemesisRE/kiosk-mode)** (NemesisRE) - Optional but recommended (Hemma looks best with no header/sidebar)
- **[lovelace-swipe-card](https://github.com/bramkragten/swipe-card)** (Bram Kragten) - Required for the Plex Recently Added popup carousel
- **[plex_recently_added](https://github.com/NemesisRE/sensor.plex_recently_added)** (NemesisRE) - Required for the Plex Recently Added card and `sensor.plex_recently_added_count`

---

### Popup Cards

#### Air Quality
<img width="615" height="630" alt="popup-aqi" src="https://github.com/user-attachments/assets/2f3e3b1d-5f37-47b3-a474-2b5b24da3a58" />

#### Network
<img width="615" height="708" alt="popup-network" src="https://github.com/user-attachments/assets/65d088fc-7834-4734-8fca-5ef20f843260" />

#### Energy Usage
<img width="615" height="520" alt="popup-energy" src="https://github.com/user-attachments/assets/8e989b83-cfa0-4e14-923b-b82ea7549ebc" />

#### Battery Monitor
<img width="615" height="605" alt="popup-battery" src="https://github.com/user-attachments/assets/6c01d11a-c5a9-480c-95dd-d51027f0cbd0" />

#### Plant Monitor
<img width="615" height="629" alt="popup-plant" src="https://github.com/user-attachments/assets/528e90a4-c25f-49c5-9a7d-43d52ed5efeb" />

#### System Updates
<img width="615" height="305" alt="popup-updates" src="https://github.com/user-attachments/assets/f8178e5c-c239-477e-b8c9-8cfc865f969a" />

#### Plex Recently Added
<img width="615" height="452" alt="popup-recently-added" src="https://github.com/user-attachments/assets/f06bd93f-6e8e-46b0-a79c-21a9537dea1c" />

---

### Desktop View
<img width="1481" height="932" alt="living-room-light" src="https://github.com/user-attachments/assets/eee87339-1e23-4e9b-bf9d-4d04731f07dc" />

### Light/Dark Mode
<img width="1481" height="932" alt="living-room-light" src="https://github.com/user-attachments/assets/125fab62-14b1-4b19-bdcc-c9f715ac46b4" />
<img width="1481" height="932" alt="living-room-light" src="https://github.com/user-attachments/assets/8414710f-0a15-4551-95ae-324312f1c35f" />

### Mobile View (Light/Dark)
<img src="https://github.com/user-attachments/assets/7e173334-9898-4102-9c37-700f324e6fef" width="404">
<img src="https://github.com/user-attachments/assets/921ea303-1e80-496f-b111-626f3b4d560c" width="404">

### Tablet View (Light/Dark)
<img width="1200" height="900" alt="living-room-light-tablet" src="https://github.com/user-attachments/assets/1fd685b0-6a9e-4087-a182-13c1f5567477" />
<img width="1200" height="900" alt="living-room-dark-tablet" src="https://github.com/user-attachments/assets/c9a8dafb-4749-444a-93a7-0783502b98de" />

---

### :file_folder: Folder layout

Everything in this repo is meant to live under `/config` in your Home Assistant installation.

Example layout:

```text
/config
├── configuration.yaml                  # Register the Hemma dashboard here
├── dashboards/
│   ├── hemma/
│   │   ├── hemma.yaml                  # Main Hemma dashboard (created from example)
│   │   └── hemma.yaml.example          # Example dashboard with placeholders
│   └── templates/
│       ├── button_cards/               # Button-card templates
│       │   ├── badges/
│       │   ├── base/
│       │   ├── cards/
│       │   └── popups/
│       └── includes/                   # Layout + navigation includes
│           ├── hemma_screen_layout.yaml
│           ├── hemma_entity_layout.yaml
│           ├── hemma_navbar_mobile.yaml
│           └── hemma_navigation.yaml
├── themes/
│   └── hemma/
│       ├── hemma.yaml                  # Hemma theme (flat card style)
│       └── hemma_glass.yaml            # Hemma Glass theme (Liquid Glass style)
├── packages/
│   └── hemma_helpers.yaml              # Helpers required by the dashboard
└── www/
    └── hemma/
        ├── fonts/                      # UI fonts
        ├── icons/                      # UI icons
        ├── mobile/                     # Mobile dynamic background images
        ├── rooms/                      # Room/background images (*-demo.jpg variants included)
        ├── weather/                    # Weather icons
        └── scripts/                    # JavaScript resources
            ├── layout-card-modified.js # Modified Layout Card build
            ├── navbar-popup-caret.js   # Add dropdown icon to navbar
            ├── navbar-scroll.js        # Collapsible phone navbar behavior
            ├── navbar-sidebar-offset.js# Navbar adjusts with sidebar visibility
            ├── swipe-card-patch.js     # Plex Recently Added carousel bullet color sync
            └── hemma-smart-row.js      # Smart entity row with active-card sorting
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

- `/local/hemma/scripts/layout-card-modified.js` (from this repo)
- `/local/hemma/scripts/navbar-popup-caret.js` (from this repo)
- `/local/hemma/scripts/navbar-sidebar-offset.js` (from this repo)
- `/local/hemma/scripts/navbar-scroll.js` (from this repo)
- `/local/hemma/scripts/swipe-card-patch.js` (from this repo, required for Plex Recently Added popup)
- `/local/hemma/scripts/hemma-smart-row.js` (from this repo, required for Smart Row)
- `/local/hemma/fonts/hanken-grotesk.css` (from this repo)
- `/hacsfiles/button-card/button-card.js` (should already be present if installed via HACS)
- `/hacsfiles/lovelace-navbar-card/navbar-card.js` (should already be present if installed via HACS)

### 4) Register the Hemma dashboard
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
```

Restart Home Assistant.

### 5) Create your dashboard from the example file

In `/config/dashboards/hemma/`:

- Copy or rename `hemma.yaml.example` → `hemma.yaml`
- Open `hemma.yaml` and replace all placeholders (search for `YOUR_`)

This is the main file you edit to map Hemma to your devices/entities.

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
- Mobile navbar include (desktop/tablet/mobile navigation menu)
- Entity grid include

---

### :thermometer: Climate badge

The climate group badge aggregates temperature, HVAC activity, humidity, and air quality into a single tappable badge on the hero card. Tap to expand sub-badges for temperature range, humidity, and air quality.

> **Dependency:** The expand/collapse behaviour for all badge groups (climate, lights, presence, media) is driven by `input_select.hemma_expanded_row`. This entity is defined in `packages/hemma_helpers.yaml` — make sure you have copied that file and reloaded HA (or restarted) so the entity exists before using any badge. Without it, tapping a badge group will throw a service-call error and the sub-badge row will not expand.

Set `show_climate: true` on the `hemma.yaml` dashboard file and provide at least one sensor:

| Variable | Description |
|---|---|
| `show_climate` | `true` to enable the climate badge |
| `climate_entity_1` – `climate_entity_3` | Climate/thermostat entities — used to detect active HVAC and animate the fan icon |
| `temp_sensor_1` – `temp_sensor_5` | Temperature sensors — if multiple are provided, the badge shows a min–max range |
| `humidity_sensor` | Humidity sensor (shown in expanded sub-badges) |
| `quality_sensor` | Air quality sensor (shown in expanded sub-badges) |
| `temp_unit` | `'F'` or `'C'` — controls comfort label thresholds |

---

### :bulb: Light badge

The light group badge shows the combined state of your room lights and lets you tap to toggle them.

| Variable | Description |
|---|---|
| `show_lights` | `true` to enable the light badge |
| `light_entity_1` – `light_entity_4` | Light group or individual light entities |

---

### :bust_in_silhouette: Presence badge

Shows a grouped presence badge on the hero card. Tap to expand individual person badges.

| Variable | Description |
|---|---|
| `show_presence` | `true` to enable the presence badge |
| `presence_entity_1` – `presence_entity_4` | Person status sensors |

---

### :cloud: Weather widget

Hemma includes a compact weather widget for both desktop and mobile/tablet views.

| Variable | Description |
|---|---|
| `show_weather` | `true` to enable the weather widget |
| `weather_entity` | Your HA weather entity |
| `weather_temp_sensor` | *(optional)* A separate sensor for outdoor temperature |
| `temp_unit` | `'F'` or `'C'` — controls comfort thresholds and labels |

Template: `hemma_weather`

(See `dashboards/templates/button_cards/.../hemma_weather.yaml` for full template code.)

---

### :tv: Media badges

Media badges appear on the hero card and show what's currently playing. They auto-hide when nothing is active, and auto-show when a player becomes active (including recently paused).

| Variable | Description |
|---|---|
| `show_media` | `true` to enable media badges |
| `show_media_player_1` – `show_media_player_10` | `true` to show each individual player badge |
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

    # Climate badge
    show_climate: true
    climate_entity_1: climate.living_room
    climate_entity_2: climate.bedroom
    temp_sensor_1: sensor.home_temperature
    temp_sensor_2: sensor.living_room_temperature
    humidity_sensor: sensor.average_humidity
    quality_sensor: sensor.air_quality
    temp_unit: 'F'

    # Light badge
    show_lights: true
    light_entity_1: light.living_room
    light_entity_2: light.bedroom

    # Weather widget
    show_weather: true
    weather_entity: weather.your_weather
    weather_temp_sensor: sensor.your_outdoor_temp

    # Presence badge
    show_presence: true
    presence_entity_1: sensor.person_one_status
    presence_entity_2: sensor.person_two_status

    # Media badges
    show_media: true
    show_media_player_1: true
    media_player_1: media_player.spotify
    show_media_player_2: true
    media_player_2: media_player.living_room_apple_tv
    show_media_player_3: true
    media_player_3: media_player.kitchen
    show_media_player_4: true
    media_player_4: media_player.bedroom_apple_tv
```

Note: Media badges only appear when a player is active (playing, buffering, or recently paused within `pause_timeout_minutes`).

---

### :twisted_rightwards_arrows: Smart Row (`hemma-smart-row`)

`hemma-smart-row` is a custom Lovelace card that replaces a static list of entity cards with a self-sorting row. On desktop, any card that becomes active automatically slides to the front of the row using a FLIP animation. On mobile portrait and landscape the cards render in a fixed grid — no reordering.

**Requires:** `hemma-smart-row.js` registered as a Lovelace resource (included in this repo).

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

`hemma_entity_actions` extends `hemma_entity` with two configurable action buttons rendered in a vertical rail on the right side of the card. Each button can trigger a `more-info` panel, `toggle`, a `navigate` action, or a custom `call-service`.

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

| Variable | Default | Description |
|---|---|---|
| `action_N_entity` | — | Entity to act on and read state from for icon colouring |
| `action_N_icon` | `mdi:help-circle` | `mdi:*` icon, Hemma SVG name, or full path/URL |
| `action_N_action` | `more-info` | `more-info` · `toggle` · `navigate` · `call-service` |
| `action_N_navigation_path` | — | Path for `navigate` action |
| `action_N_service` | — | `domain.service` for `call-service` action |
| `action_N_service_data` | `{}` | Service data map for `call-service` action |
| `action_N_enabled` | `true` | Set to `false` to hide this button |

Replace `N` with `1` or `2`.

---

### :film_strip: Plex Recently Added card

`hemma_plex_recently_added` is a standard entity card that shows how many items Plex added in the last 7 days. It goes active (gold icon) when the count is above zero. Tapping opens the `hemma_popup_recently_added` swipe-card carousel with poster art, title, year, and release date for each recently added movie or episode.

**Requires:**
- [`plex_recently_added`](https://github.com/NemesisRE/sensor.plex_recently_added) HACS integration — provides `sensor.recently_added_movies` and `sensor.recently_added_tv`
- [`lovelace-swipe-card`](https://github.com/bramkragten/swipe-card) HACS card — powers the popup carousel
- `swipe-card-patch.js` registered as a resource (included in this repo) — syncs pagination bullet color to content type

The `sensor.plex_recently_added_count` template sensor is defined in `packages/hemma_helpers.yaml`.

---

### :pencil2: Additional Customization

This repo is intended as a starting point:

- Swap out room/background images in `www/hemma/rooms/`.
- Tweak theme colors, shadows, and typography in `themes/hemma/hemma.yaml`.
- Prefer the original Liquid Glass look? Switch to **Hemma Glass** (`themes/hemma/hemma_glass.yaml`) — it preserves inset specular card shadows, higher backdrop blur, and the semi-transparent active card style from earlier versions.
- Adjust layouts (`hemma_entity_layout.yaml`, etc.) to match your devices and preferences.

### HA Companion App iOS Settings

Hemma is designed for edge-to-edge screens. If you are using the HA iOS Companion app, please ensure to enable **Edge to edge display** found in Settings → Companion app → General → Edge to edge display

### Button Card Icons

To add additional button card icons, you can download them from the links below and place the icons in the `www/hemma/icons/` folder:

[Apple Icons](https://developer.apple.com/sf-symbols/) - Set Background to **Dark** and Color to **Primary**

[Google Material Icons](https://fonts.google.com/icons?icon.query=light) - Weight 300 is recommended, file type: svg

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
