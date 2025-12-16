## :house: Hemma for Home Assistant

A modern mobile-friendly fork of the original [Homio](https://github.com/iamtherufus/Homio) dashboard by iamtherufus for Home Assistant, featuring light and dark mode, redesigned cards, new custom badges, and media integration.

### Desktop View (Single Row)
![home-desktop-light](https://github.com/user-attachments/assets/b31d7a32-6abe-44f0-b0d5-c01326f89420)
![living-room-desktop-light](https://github.com/user-attachments/assets/026bd382-a8bb-4189-80d1-2bb1dadf90a4)
![bedroom-desktop-light](https://github.com/user-attachments/assets/e2b8b2fc-f049-4eb1-964d-dc0cec16fd33)

### Desktop View (Two Rows)
![living-room-desktop-light-alt](https://github.com/user-attachments/assets/b3e7769a-3679-460e-b6a7-3fcade12adfe)

---

### Based on Homio

This project is built on top of the excellent work in [iamtherufus/Homio](https://github.com/iamtherufus/Homio). If you’re new to Homio in general, you should absolutely read their README first for the full background, philosophy, and original setup guide:

> 👉 Original project & docs: https://github.com/iamtherufus/Homio

Hemma keeps the same basic structure (YAML dashboard, helpers, theme), but changes the look, layout, and many of the UI details.

---

### :question: What’s different in Hemma

Hemma adds new features and changes including:

- **New light/dark tuning**  
  - Refined card backgrounds, shadows, and typography  
  - Dark mode adjusted for better contrast and “liquid glass” style cards

- **Updated layouts and cards**  
  - Refined screen layout includes (`hemma_screen_layout.yaml`, `hemma_entity_layout.yaml`)  
  - Adjusted spacing, grid behavior, and row heights for desktop/tablet/mobile
  - New button cards including unified thermostat card for heating/cooling, curtain card, fan card, media card

- **Navigation & mobile behavior**  
  - Custom mobile navbar (`hemma_navbar_mobile.yaml`) tuned for smaller screens  
  - Improved navigation templates (`hemma_navigation.yaml`, `hemma_navigation_list.yaml`)

- **Badges**  
  - New custom badges for room sensors and presence status  
  - Media badge with dynamic background

Under the hood it’s still YAML files you can read, copy, and modify. This repo just collects my version into a reusable package.

### Light/Dark Mode
![bedroom-desktop-light](https://github.com/user-attachments/assets/b3abc58d-4507-4a97-9a34-20031b3094ef)
![bedroom-desktop-dark](https://github.com/user-attachments/assets/f37cb67b-55b0-4ccd-b392-7f5c8269fb27)

### Boxy Button Cards
![living-room-desktop-light-box](https://github.com/user-attachments/assets/2cb3c1fb-9edd-4970-b268-a8f7c4a73127)

## Mobile View
<img width="346" height="698" alt="home-mobile-light" src="https://github.com/user-attachments/assets/589472bc-23f2-4ee0-a13d-0c20993bc268" />
<img width="346" height="698" alt="living-room-mobile-light" src="https://github.com/user-attachments/assets/afc6af01-6307-48b4-ab6f-3244040d1dcc" />

---

### :heavy_exclamation_mark: Requirements

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

### :file_folder: Folder layout

Everything in this repo is meant to live under `/config` in your Home Assistant installation.

Example layout:

```text
/config
└── dashboards/
    └── hemma/
        └── hemma.yaml            # Main Hemma dashboard
└── dashboards/templates/includes/
    ├── hemma_screen_layout.yaml
    ├── hemma_entity_layout.yaml
    ├── hemma_navbar_mobile.yaml
    ├── hemma_navigation.yaml
    └── hemma_navigation_list.yaml
└── themes/
    └── hemma-next/
        └── hemma-next.yaml       # Hemma theme
└── packages/
    └── hemma_helpers.yaml        # Helpers required by the dashboard
└── www/
    └── hemma/
        ├── icons/                # UI icons
        └── images/               # Room/Background images

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
    dashboard-hom:
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

### :pencil: Customization

This repo is intended as a starting point:

- Swap out room/background images in `www/hemma/images/`.
- Tweak theme colors, shadows, and typography in `themes/hemma/hemma.yaml`.
- Adjust layouts (`hemma_entity_layout.yaml`, etc.) to match your devices and preferences.

Because it’s all YAML, you can copy/paste specific cards or layouts into your own dashboards if you don’t want the full setup.

---

### :trophy: Credits

- Original Homio concept and base implementation: [iamtherufus/Homio](https://github.com/iamtherufus/Homio)
- Hemma customization and ongoing tweaks: [@willsanderson](https://github.com/willsanderson)


