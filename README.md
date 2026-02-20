# :house_with_garden: Hemma

A modern, minimal, mobile-friendly dashboard for Home Assistant.  Inspired by the [Homio](https://github.com/iamtherufus/Homio) dashboard by @iamtherufus, Hemma is rebuilt and extended with new layouts, cards, and a streamlined setup process.

Hemma is fully YAML-based and designed for:
- Desktop, tablet, and mobile (portrait + landscape)
- Light/Dark mode styling
- Frosted-glass entity cards
- Badges for sensors, presence, and active media
- Clean navigation with a mobile navbar + desktop/tablet top navigation

![hemma_devices](https://github.com/user-attachments/assets/f66ee922-6e95-45bc-afee-ba12c8869886)

---
### Highlights and Features
- **Light/dark** mode with dynamic background images
- **Layouts + spacing logic** for scaling across different devices
- **Custom navigation** and Scene support
  - Mobile navbar for tablet and phone
- **Badges**
  - Presence + sensor badges
  - Active media player badge
- **Button-cards**
  - Thermostat, media, fan, curtain, lock, and more
- **Weather + Comfort**
  - Mobile hero-row **weather widget**
  - Outdoor mode + room mode, plus “comfort labels” (`temp_unit: 'F' | 'C'`)
---

### Requirements

#### Home Assistant
- Lovelace dashboards enabled, and **keep Lovelace in `storage` mode** (so you can still use the UI editor for other dashboards).

#### Custom cards (required)
Install via HACS (recommended) unless noted:

- **[button-card](https://github.com/custom-cards/button-card)** (RomRider)
- **[layout-card](https://github.com/thomasloven/lovelace-layout-card)** (Thomas Lovén) — Hemma uses a **modified** version included in this repo (don’t install via HACS).
- **[lovelace-navbar-card](https://github.com/joseluis9595/lovelace-navbar-card)** (Jose Luis Álvarez) - required for navigation + media badge
- **navbar-popup-caret** - custom js required for navbar dropdown menus (included in this repo)
#### Optional
- **[kiosk-mode](https://github.com/NemesisRE/kiosk-mode)** (NemesisRE) - Optional but recommended (Hemma looks best with no header/sidebar)
---

### Desktop View
![home-desktop-light](https://github.com/user-attachments/assets/b5af78be-a028-4bda-bdc5-94298e329d0e)
![livingroom-desktop-light](https://github.com/user-attachments/assets/21378996-2ddc-4d7a-872f-5565a00422ef)

### Light/Dark Mode
![bedroom-desktop-light](https://github.com/user-attachments/assets/370123ff-8dfb-4722-9926-522692392ef1)
![bedroom-desktop-dark](https://github.com/user-attachments/assets/63349d15-fd3d-41be-bc00-229f8f80dd69)

### Mobile View (Light/Dark)
<img src="https://github.com/user-attachments/assets/5566503b-c6b0-4ede-9acc-a7da136db883" width="404">
<img src="https://github.com/user-attachments/assets/1710ad0f-e4f2-4596-961b-3203cacd5a4a" width="404">

### Tablet View (Light/Dark)
![tablet-livingroom-light](https://github.com/user-attachments/assets/019693ef-3969-4104-ac5e-ded769ab3ccb)
![tablet-livingroom-dark](https://github.com/user-attachments/assets/ac0d1d67-0e6e-4cdb-8627-c1db13cfce13)

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
│           ├── hemma_navigation.yaml
│           └── hemma_media_player_styles.yaml
├── themes/
│   └── hemma/
│       └── hemma.yaml                  # Hemma theme
├── packages/
│   └── hemma_helpers.yaml              # Helpers required by the dashboard
└── www/
    ├── hemma/
    │   ├── icons/                      # UI icons
    │   ├── rooms/                      # Room/background images
    │   └── weather/                    # Weather icons
    ├── layout-card-modified/
    │   └── layout-card-modified.js     # Modified Layout Card build
    └── navbar-popup-caret/
        └── navbar-popup-caret.js       # Add dropdown icon to navbar
```

## :rocket: Installation

### 1) Backup first
Make a full Home Assistant backup/snapshot before you start. YAML dashboards + themes are easy to roll back, but you’ll be happier if you can restore quickly if something goes sideways.

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

You’ll configure most of Hemma by editing your dashboard file:

- `/config/dashboards/hemma/hemma.yaml`

### Key view building blocks

Each view typically contains:

- `hemma_room` (this is the main hero card)
- Mobile navbar include (desktop/tablet/mobile navigation menu)
- Entity grid include

You’ll mostly be adjusting `variables:` on the `hemma_room` hero card and changing entity IDs in the entity grid.

### Weather widget (mobile portrait hero row)

Hemma includes a compact weather widget designed for **mobile portrait mode**.

It supports:

- `weather_mode: outdoor` (Home view)
- `weather_mode: room` (Room view / indoor comfort labels)
- `temp_unit: 'F' | 'C'` (controls comfort thresholds and labels)

Template: `hemma_weather`

Key variables:

- `weather_entity` (your HA weather entity)
- `weather_temp_sensor` *(optional, if you prefer a separate temperature sensor)*
- `temp_sensor` *(used in `room` mode for indoor temp)*
- `temp_unit` (F/C)

(See `dashboards/templates/button_cards/.../hemma_weather.yaml` for full template code.)

### Lock card (split actions)

Hemma’s lock card supports:

- Tap the card → **more-info**
- Tap the icon/image → **lock/unlock toggle**

Note: `show_icon: true` is required so `icon_tap_action` has a target.

Template: `hemma_lock`

### :tv: Media badges in the home dashboard

- The home dashboard can show active media player badges in the header.
- To enable the media badges, locate the `name: Home` view in the `hemma.yaml` dashboard file and add the media variables under `variables:` (example below):

```yaml
- type: custom:button-card
  template: hemma_room
  name: Home
  variables:
    image: home
    image_position: center center

    show_temp: false
    temp_sensor: 

    show_weather: true
    weather_mode: outdoor
    weather_entity: weather.pirateweather
    weather_temp_sensor: sensor.pirateweather_temperature

    show_presence: true
    presence_entity_1: sensor.someone
    presence_entity_2: sensor.someone_else

    show_media_badge: true
    show_media_player_1: true
    media_player_1: media_player.spotify
    show_media_player_2: true
    media_player_2: media_player.living_room
    show_media_player_3: true
    media_player_3: media_player.kitchen
    show_media_player_4: true
    media_player_4: media_player.bedroom
```

Note: Media badges only appear when a player is active (playing/paused depending on your template logic).

---

### :pencil2: Additional Customization

This repo is intended as a starting point:

- Swap out room/background images in `www/hemma/rooms/`.
- Tweak theme colors, shadows, and typography in `themes/hemma/hemma.yaml`.
- Adjust layouts (`hemma_entity_layout.yaml`, etc.) to match your devices and preferences.

### Button Card Icons

To add additional button card icons, you can download them from the link below and place the icons in the `www/hemma/icons/` folder:

[Google Material Icons](https://fonts.google.com/icons?icon.query=light) (Weight 200 is recommended, file type: svg)

### Time

You can switch from 12hr to 24hr time in by switching the variables in `hemma_time.yaml`, example below:

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


