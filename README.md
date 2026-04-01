## Important Update (3/31/26)

The latest update (version 1.2.1) includes many changes and new features, requiring updated code for most all files in the repo. When updating, please ensure you replace/overwrite all files to ensure compatibility. 
![hemma_devices](https://github.com/user-attachments/assets/74b780bc-fc58-4323-9c58-59961014d551)
# :house_with_garden: Hemma

A modern, minimal, mobile-friendly dashboard for Home Assistant.  Inspired by the [Homio](https://github.com/iamtherufus/Homio) dashboard by @iamtherufus, Hemma is rebuilt and extended with new layouts, cards, and a streamlined setup process.

Hemma is fully YAML-based and designed for:
- Desktop, tablet, and mobile (portrait + landscape)
- Light/Dark mode styling
- Frosted-glass entity cards
- Badges for climate, sensors, presence, and active media
- Clean navigation with a mobile navbar + desktop/tablet top navigation

---
### Highlights and Features
- **Light/dark** mode with dynamic background images
- **Layouts + spacing logic** for scaling across different devices
- **Custom navigation** and Scene support
  - Mobile navbar for tablet and phone
  - Motion detection built into navigation menu
- **Badges** (shown in the hero section of each room card)
  - Climate group badge — temperature range, HVAC state, humidity, air quality
  - Light group badge
  - Presence + sensor badges
  - Active media player badge
- **Button-cards**
  - Thermostat, media, fan, curtain, lock, and more
---

### Requirements

#### Home Assistant
- Lovelace dashboards enabled, and **keep Lovelace in `storage` mode** (so you can still use the UI editor for other dashboards).

#### Custom cards (required)
Install via HACS (recommended) unless noted:

- **[button-card](https://github.com/custom-cards/button-card)** (RomRider)
- **[layout-card](https://github.com/thomasloven/lovelace-layout-card)** (Thomas Lovén) — Hemma uses a **modified** version included in this repo (don't install via HACS).
- **[lovelace-navbar-card](https://github.com/joseluis9595/lovelace-navbar-card)** (Jose Luis Álvarez) - required for navigation + media badge
- **[browser_mod](https://github.com/joseluis9595/lovelace-navbar-card)** (Thomas Lovén) - required for custom popups
- **[uix](https://github.com/Lint-Free-Technology/uix)** (Lint Free Technology) - required for custom popup windows
- **navbar-popup-caret** - custom js required for navbar dropdown menus (included in this repo)
- **navbar-sidebar-offset** - custom js required for adjusting navigation menu when sidebar is present (included in this repo)
#### Optional
- **[kiosk-mode](https://github.com/NemesisRE/kiosk-mode)** (NemesisRE) - Optional but recommended (Hemma looks best with no header/sidebar)

---

### Desktop View
![desktop-home-light](https://github.com/user-attachments/assets/b7597e0b-5559-4790-aec1-cf7e0a6ef472)
![desktop-livingroom-light](https://github.com/user-attachments/assets/7e90d921-abc3-49a7-8a92-c2717c7baa45)

### Light/Dark Mode
![desktop-bedroom-light](https://github.com/user-attachments/assets/a40d65d0-b723-492a-97dc-bb936c17affa)
![desktop-bedroom-dark](https://github.com/user-attachments/assets/aa904c06-7d6e-47b4-ab26-24e676bf6095)

### Mobile View (Light/Dark)
<img src="https://github.com/user-attachments/assets/c6f66f68-ad54-492b-860e-0b0ba0c765e6" width="404">
<img src="https://github.com/user-attachments/assets/4eb7b0cf-c75c-451b-9f26-b35130d17f93" width="404">

### Tablet View (Light/Dark)
![tablet-livingroom-light 2](https://github.com/user-attachments/assets/41ef6a99-2634-4026-a188-ec20979cc088)
![tablet-livingroom-dark](https://github.com/user-attachments/assets/12bac700-a2a2-4f6c-aba7-f6e86123d7e2)


---

### :file_folder: Folder layout

Everything in this repo is meant to live under `/config` in your Home Assistant installation.

Example layout:

```text
/config
├── dashboards/
│   ├── hemma/
│   │   ├── hemma.yaml                  # Main Hemma dashboard (created from example)
│   │   └── hemma.yaml.example          # Example dashboard with placeholders
│   └── templates/
│       ├── button_cards/               # Button-card templates
│       │   ├── badges/
│       │   ├── base/
│       │   └── cards/
│       └── includes/                   # Layout + navigation includes
│           ├── hemma_screen_layout.yaml
│           ├── hemma_entity_layout.yaml
│           ├── hemma_navbar_mobile.yaml
│           └── hemma_navigation.yaml
├── themes/
│   └── hemma/
│       └── hemma.yaml                  # Hemma theme
├── packages/
│   └── hemma_helpers.yaml              # Helpers required by the dashboard
└── www/
    ├── hemma/
    │   ├── fonts/                      # UI fonts
    │   ├── icons/                      # UI icons
    │   ├── rooms/                      # Room/background images
    │   └── weather/                    # Weather icons
    ├── layout-card-modified/
    │   └── layout-card-modified.js     # Modified Layout Card build
    ├── navbar-sidebar-offset/
    │   └── navbar-sidebar-offset.js    # Navbar adjusts with sidebar visibility
    └── navbar-popup-caret/
        └── navbar-popup-caret.js       # Add dropdown icon to navbar
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
- `www/layout-card-modified/` → `/config/www/layout-card-modified/`

### 3) Add Lovelace resources
In Settings → Dashboards → Resources (or YAML), add:

- `/local/layout-card-modified/layout-card-modified.js` (from this repo)
- `/local/navbar-popup-caret/navbar-popup-caret.js`(from this repo)
- `/local/navbar-sidebar-offset/navbar-sidebar-offset.js`(from this repo)
- `/hacsfiles/button-card/button-card.js` (should already be present if installed via HACS)
- `/hacsfiles/lovelace-navbar-card/navbar-card.js` (should already be present if installed via HACS)

(Exact resource paths can vary depending on how you installed the cards.)

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
| `show_media_player_1` – `show_media_player_4` | `true` to show each individual player badge |
| `media_player_1` – `media_player_4` | Media player entity IDs |
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

### :pencil2: Additional Customization

This repo is intended as a starting point:

- Swap out room/background images in `www/hemma/rooms/`.
- Tweak theme colors, shadows, and typography in `themes/hemma/hemma.yaml`.
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
- Hemma customization and ongoing tweaks: [@willsanderson](https://github.com/willsanderson)

#### Enjoying Hemma? Buy me a coffee :v::smiley:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V31RK6FB)
