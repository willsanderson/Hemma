# :house: Homio Next

A modern mobile-friendly fork of the original [Homio](https://github.com/iamtherufus/Homio) dashboard by iamtherufus for Home Assistant, featuring light and dark mode, redesigned cards, new custom badges, and media integration.

## Desktop View (Single Row)
<img width="1000" height="625" alt="home-desktop-light-alt" src="https://github.com/user-attachments/assets/13df5921-2671-4ded-9304-05b672ebca64" />
<img width="1000" height="625" alt="bedroom-desktop-light-alt" src="https://github.com/user-attachments/assets/ec673e43-fe7a-4e38-99c0-1c7f5fafe836" />

## Desktop View (Two Rows)
<img width="1728" height="1085" alt="home-desktop-light" src="https://github.com/user-attachments/assets/d1857ecf-5658-4e8c-a134-de1b090e3b13" />
<img width="1728" height="1084" alt="bedroom-desktop-light" src="https://github.com/user-attachments/assets/f5bcb186-e58b-410d-84aa-6b1aacd2c689" />

---

## Based on Homio

This project is built on top of the excellent work in [iamtherufus/Homio](https://github.com/iamtherufus/Homio).  
If you’re new to Homio in general, you should absolutely read their README first for the full background, philosophy, and original setup guide:

> 👉 Original project & docs: https://github.com/iamtherufus/Homio

Homio-Next keeps the same basic structure (YAML dashboard, helpers, theme), but changes the look, layout, and many of the UI details.

---

## :question: What’s different in Homio-Next

Homio-Next adds new features and changes including:

- **New light/dark tuning**  
  - Refined card backgrounds, shadows, and typography  
  - Dark mode adjusted for better contrast and “liquid glass” style cards

- **Updated layouts and cards**  
  - Refined screen layout includes (`homio_screen_layout.yaml`, `homio_entity_layout.yaml`)  
  - Adjusted spacing, grid behavior, and row heights for desktop/tablet/mobile
  - New button cards including unified thermostat card for heating/cooling, curtain card, fan card, media card

- **Navigation & mobile behavior**  
  - Custom mobile navbar (`homio_navbar_mobile.yaml`) tuned for smaller screens  
  - Improved navigation templates (`homio_navigation.yaml`, `homio_navigation_list.yaml`)

- **Badges**  
  - New custom badges for room sensors and presence status  
  - Media badge with dynamic background

Under the hood it’s still YAML files you can read, copy, and modify. This repo just collects my version into a reusable package.

## Light/Dark Mode
<img width="1000" height="625" alt="bedroom-desktop-light-alt" src="https://github.com/user-attachments/assets/cbabe4d4-dde7-4b06-b51c-33791b8be6d9" />
<img width="1000" height="625" alt="bedroom-desktop-dark-alt" src="https://github.com/user-attachments/assets/3a349a66-7233-4daa-88b8-e20f26531112" />

## Rounded/Boxy Button Cards
<img width="1000" height="625" alt="kitchen-desktop-light-alt" src="https://github.com/user-attachments/assets/95518bb0-451d-4e07-b0b3-8aea536c6ccc" />
<img width="1000" height="625" alt="kitchen-desktop-light-box" src="https://github.com/user-attachments/assets/e66877c8-3e54-4708-8bb2-9e21add2b260" />

---

## :heavy_exclamation_mark: Requirements

You’ll need:

- Lovelace in **storage** mode (so you can keep using the UI editor for other dashboards)
- Custom cards (install via HACS or manual, and ensure they’re added as Lovelace resources):
  - [button-card](https://github.com/custom-cards/button-card)
  - [layout-card](https://github.com/thomasloven/lovelace-layout-card) (Homio originally uses a slightly modified version; check the original repo if you want to stick to that approach.)
  - [lovelace-navbar-card](https://github.com/joseluis9595/lovelace-navbar-card) (for mobile view navigation)
  - [my-slider-v2](https://github.com/AnthonMS/my-cards/blob/main/docs/cards/slider-v2.md) (for light sliders)
  - Any additional cards you use in your setup (e.g. `browser_mod`, `auto-entities`, etc.)

For exact resource paths and the original recommended setup, refer to the **Getting Started** section in the Homio README:  
https://github.com/iamtherufus/Homio#-getting-started

---

## :file_folder: Folder layout

Everything in this repo is meant to live under `/config` in your Home Assistant installation.

Example layout:

```text
/config
└── dashboards/
    └── homio-next/
        └── homio.yaml            # Main Homio-Next dashboard
└── dashboards/templates/includes/
    ├── homio_screen_layout.yaml
    ├── homio_entity_layout.yaml
    ├── homio_navbar_mobile.yaml
    ├── homio_navigation.yaml
    └── homio_navigation_list.yaml
└── themes/
    └── homio-next/
        └── homio-next.yaml       # Homio-Next theme
└── packages/
    └── homio_helpers.yaml        # Helpers required by the dashboard
└── www/
    └── homio-next/
        ├── icons/                # Optional: UI icons
        └── images/               # Optional: room/background images

```

## :rocket: Installation

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

### 2. Copy Homio-Next files into your config

From this repo, copy the following into your Home Assistant `/config` directory:

- `dashboards/homio-next/` → `/config/dashboards/homio-next/`
- `dashboards/templates/includes/` → `/config/dashboards/templates/includes/`  
  (merge with your existing templates folder if you already have one)
- `themes/homio-next/` → `/config/themes/homio-next/`
- `packages/homio_helpers.yaml` → `/config/packages/`
- `www/homio-next/` → `/config/www/homio-next/`  

Restart Home Assistant or reload themes/resources as needed.

---

### 3. Register the dashboard

In `configuration.yaml` add the following:

```yaml
lovelace:
  mode: storage
  dashboards:
    dashboard-homio-next:
      mode: yaml
      title: "Homio"
      icon: mdi:home
      show_in_sidebar: true
      filename: dashboards/homio-next/homio.yaml
```

Restart Home Assistant, then refresh your browser and open **Homio Next** from the sidebar.

---

### 4. Configure entities & helpers

- Update entity IDs in the YAML files to match your own setup (lights, media players, sensors, etc.).
- Make sure everything defined in `packages/homio_helpers.yaml` exists in your config and uses the correct entity IDs.

---

## :pencil: Customization

This repo is intended as a starting point:

- Swap out room/background images in `www/homio-next/images/`.
- Tweak theme colors, shadows, and typography in `themes/homio-next/homio-next.yaml`.
- Adjust layouts (`homio_entity_layout.yaml`, etc.) to match your devices and preferences.

Because it’s all YAML, you can copy/paste specific cards or layouts into your own dashboards if you don’t want the full setup.

---

## :trophy: Credits

- Original Homio concept and base implementation: [iamtherufus/Homio](https://github.com/iamtherufus/Homio)
- Homio-Next customization and ongoing tweaks: [@willsanderson](https://github.com/willsanderson)

**License:** MIT (same as the original Homio project).


