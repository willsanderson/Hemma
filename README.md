## :house: Hemma

A modern, minimal, mobile-friendly dashboard for Home Assistant. Based on the [Homio](https://github.com/iamtherufus/Homio) dashboard by iamtherufus, Hemma features redesigned cards, light and dark mode, badge support, and media integration.

### Desktop View
![desktop-home-light](https://github.com/user-attachments/assets/b1e2d227-6071-4cff-9f93-9eb226356a0f)
![desktop-livingroom-light](https://github.com/user-attachments/assets/072aa154-8ae8-4f9d-a32c-7467723ef8dd)

---

### Based on Homio

This project is built on top of the excellent work in [iamtherufus/Homio](https://github.com/iamtherufus/Homio). If you’re new to Homio in general, you should absolutely read their README first for the full background, philosophy, and original setup guide:

> 👉 Original project & docs: https://github.com/iamtherufus/Homio

Hemma keeps the same basic structure (YAML dashboard, helpers, theme), but changes the look, layout, and many of the UI details.

---

### New Features and Updates

Hemma adds new features and changes including:

- **New light/dark tuning**  
  - Refined card backgrounds, shadows, and typography  
  - Dark mode adjusted for better contrast and frosted glass style cards

- **Updated layouts and cards**  
  - Refined screen layout(`hemma_entity_layout.yaml`) 
  - Adjusted spacing, grid behavior, and row heights for auto-scaling on desktop/tablet/mobile views
  - New button cards including unified thermostat card for heating/cooling, curtain card, fan card, media card

- **New Navigation**  
  - Custom mobile navbar (`hemma_navbar_mobile.yaml`) tuned for smaller screens
  - Custom desktop/tablet navbar ('hemma_room.yaml') tuned for larger screens

- **Badges**  
  - New custom badges for room sensors and presence status  
  - Active media player badge

Under the hood it’s still YAML files you can read, copy, and modify. This repo just collects my version into a reusable package.

### Light/Dark Mode
![desktop-bedroom-light](https://github.com/user-attachments/assets/dced24c2-a797-4a86-9ff1-5fb885f30c68)
![desktop-bedroom-dark](https://github.com/user-attachments/assets/53ffa13d-9615-4026-8bea-ab1a029964a0)

### Boxy Button Cards
![livingroom-light-box](https://github.com/user-attachments/assets/d45fba70-b3a6-46b6-81cf-2c98d2d8389f)

## Mobile View (Light/Dark)
<img src="![mobile-home-dark](https://github.com/user-attachments/assets/888599ee-497b-4ba6-b885-e0112e26b3d5)" width="300">


![home-light-mobile](https://github.com/user-attachments/assets/5b04a7d0-d5bf-4101-ac2d-534a3bcd5113)  &nbsp; &nbsp; &nbsp;![home-dark-mobile](https://github.com/user-attachments/assets/c6791209-f7e3-4e0b-a5d6-adaf1324b9de)

---

### :heavy_exclamation_mark: Requirements

You’ll need:

- Lovelace in **storage** mode (so you can keep using the UI editor for other dashboards)
- Custom cards (install via HACS or manual, and ensure they’re added as Lovelace resources):
  - [button-card](https://github.com/custom-cards/button-card)
  - [layout-card](https://github.com/thomasloven/lovelace-layout-card) (Homio and Hemma uses a slightly modified version)
  - [lovelace-navbar-card](https://github.com/joseluis9595/lovelace-navbar-card) (required for navigation and media player badge)
  - Any additional cards you use in your setup (e.g. `browser_mod`, `auto-entities`, etc.)

For exact resource paths and the original recommended setup, refer to the **Getting Started** section in the Homio README:  
https://github.com/iamtherufus/Homio#-getting-started

---

### :file_folder: Folder layout

Everything in this repo is meant to live under `/config` in your Home Assistant installation.

Example layout:

```text
/config
└── dashboards/
    └── hemma/
        └── hemma.yaml                  # Main Hemma dashboard
└── dashboards/templates/button-cards/  # Card config files
    ├── badges
    ├── base
    └── cards
└── dashboards/templates/includes/      # Layout and navigation
    ├── hemma_screen_layout.yaml
    ├── hemma_entity_layout.yaml
    ├── hemma_navbar_mobile.yaml
    ├── hemma_navigation.yaml
    └── hemma_media_player_styles.yaml
└── themes/
    └── hemma/
        └── hemma.yaml                  # Hemma theme
└── packages/
    └── hemma_helpers.yaml              # Helpers required by the dashboard
└── www/
    └── hemma/
        ├── icons/                      # UI icons
        └── rooms/                      # Room/Background images
    └── layout-card-modified/
        └── layout-card-modified.js     # Layout Card
```

### :rocket: Installation

### 1. Do the base Homio-style setup

If you’ve never used Homio before, follow the original README’s **Getting Started** section to:

- Make a backup of your current Home Assistant setup.
- Ensure Lovelace is in **storage** mode.
- Install the required custom cards.
- Add the cards as Lovelace resources (either via `configuration.yaml` or the GUI).

Original guide:  
https://github.com/iamtherufus/Homio#-getting-started

You don’t have to install the original Homio dashboard itself, but the environment (resources, mode, etc.) should be set up the same way.

---

### 2. Copy/Overwrite Hemma files into your config

From this repo, copy the following into your Home Assistant `/config` directory:

- `dashboards/hemma/` → `/config/dashboards/hemma/`
- `dashboards/templates/includes/` → `/config/dashboards/templates/includes/`  
  (merge with your existing templates folder if you already have one)
- `themes/hemma/` → `/config/themes/hemma/`
- `packages/hemma_helpers.yaml` → `/config/packages/`
- `www/hemma/` → `/config/www/hemma/`  

Restart Home Assistant or reload themes/resources as needed.

---

### 3. Register the dashboard

In `configuration.yaml` add the following:

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

Restart Home Assistant, then refresh your browser and open **Hemma** from the sidebar.

---

### 4. Configure entities & helpers

- Update entity IDs in the YAML files to match your own setup (lights, media players, sensors, etc.).
- Make sure everything defined in `packages/hemma_helpers.yaml` exists in your config and uses the correct entity IDs.

---

### :tv: (Optional) Media badges in the home dashboard

- The primary home dashboard can show optional media badges under the room title and appear when media is active.
- To enable the media badges, locate the `name: Home` view in the `hemma.yaml` dashboard file and add the media variables under `variables:` (example below):

```yaml
- type: custom:button-card
  template: hemma_room
  name: Home
  variables:
    image: home-demo
    image_position: center center

    show_temp: true
    temp_sensor: sensor.home_temperature

    show_presence: true
    presence_entity_1: sensor.someone
    presence_entity_2: sensor.someone_else

    show_media_badge: true
    show_media_player_1: true
    media_player_1: media_player.spotify
    show_media_player_2: true
    media_player_2: media_player.living_room_apple_tv
    show_media_player_3: true
    media_player_3: media_player.bedroom_apple_tv
    show_media_player_4: true
    media_player_4: media_player.kitchen
```

---

### :pencil: Customization

This repo is intended as a starting point:

- Swap out room/background images in `www/hemma/rooms/`.
- Tweak theme colors, shadows, and typography in `themes/hemma/hemma.yaml`.
- Adjust layouts (`hemma_entity_layout.yaml`, etc.) to match your devices and preferences.

#### Button Card Icons

To add additional button card icons, you can download them from the link below and place the icons in the `www/hemma/icons/` folder:

https://fonts.google.com/icons?icon.query=light (Weight 200 is recommended)

#### Time

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


