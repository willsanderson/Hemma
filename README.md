<img width="1729" height="1383" alt="hemma" src="https://github.com/user-attachments/assets/34ea8a3f-2f33-4337-9ca9-742e1f51f664" />


## Hemma

A modern, mobile-friendly dashboard for Home Assistant, built and configured from a UI.

Hemma installs as an integration and is added to your sidebar. There is no dashboard YAML to write and no card configuration to paste. You pick your rooms and entities, press Save, and Hemma writes the dashboard. 

Creating a dashboard gives you two layouts from one setup: desktop and tablet, and a phone layout inspired by Apple Home. Phones are routed to the phone one automatically.

Inspired by the [Homio](https://github.com/iamtherufus/Homio) dashboard by @iamtherufus, rebuilt and extended.

[Requirements](#requirements) · [Installation](#installation) · [Screenshots](#screenshots) · [Upgrading](#upgrading-from-hemma-20) · [Features](#features)

---

## Requirements

- Home Assistant **2026.9.0** or newer, with Lovelace in **storage** mode (the default)
- [HACS](https://hacs.xyz)
- **Themes enabled.** Hemma ships a theme, and Home Assistant only loads themes when `configuration.yaml` says so. If you have never installed a theme, add this and restart:

  ```yaml
  frontend:
    themes: !include_dir_merge_named themes
  ```

- A time sensor, if you want the clock on your room cards. Settings > Devices & Services > **Add Integration > Date & time**, and enable the "Time" sensor. Without one the clock is simply not shown.
- **Packages enabled.** Hemma's badges and overlays are driven by helper entities that ship in `packages/hemma_helpers.yaml`. Home Assistant only loads that folder when `configuration.yaml` says so:

  ```yaml
  homeassistant:
    packages: !include_dir_named packages
  ```

Hemma checks for the cards below on first open and links you straight to each one, so you do not need to collect them up front. The requirements above are yours to set up.

| From HACS | Why | |
| --- | --- | --- |
| [uix](https://github.com/Lint-Free-Technology/uix) | card styling, used throughout. Do not install card-mod alongside it. | **required** |
| [button-card](https://github.com/custom-cards/button-card) | every Hemma tile is one | **required** |
| [apexcharts-card](https://github.com/RomRider/apexcharts-card) | network, energy and climate charts | optional |


## Installation

### 1. Install Hemma from HACS

HACS > **Integrations** > menu > **Custom repositories**, add `https://github.com/willsanderson/Hemma` as an **Integration**, then find Hemma in the list and **Download**.

While you are there, install **uix**, **button-card** and **apexcharts-card**.

### 2. Copy the assets

Hemma's icons, fonts, room images and theme live in your config folder. From this repo, copy:

- `www/hemma/` into `/config/www/hemma/`
- `themes/hemma/` into `/config/themes/hemma/`
- `packages/hemma_helpers.yaml` into `/config/packages/`

Without the last one, tapping a badge group throws a service-call error and the phone's filter pills do nothing. Hemma keeps the room list in it up to date for you once your dashboard is saved, and you never edit that file by hand.

### 3. Restart Home Assistant

### 4. Add the integration

Settings > Devices & Services > **Add Integration** > **Hemma**.

Hemma registers its own dashboard resources at this point. You do not need to add anything under Settings > Dashboards > Resources.

### 5. Select the theme

Click your user name at the bottom of the sidebar and set **Theme** to **Hemma**.

If Hemma is not in the list, the `frontend: themes:` line above is missing from
`configuration.yaml`.

### 6. Build your dashboard

Open **Hemma** in the sidebar and choose **Create dashboard**. Add a room, choose your entities, and press Save. Repeat for each room.

Everything is optional. A room with nothing but a light group is a valid room, and you can come back and add badges, scenes and Now Playing whenever you like.

---

## Screenshots

### Desktop (Focus Layout)
<img width="1604" height="903" alt="Screenshot 2026-10-08 at 4 22 16 PM" src="https://github.com/user-attachments/assets/5fae3633-edef-431b-8201-8c7856e8af17" />

### Desktop (Overview Layout)
<img width="1605" height="907" alt="Screenshot 2026-10-08 at 4 23 34 PM" src="https://github.com/user-attachments/assets/f27d8a56-d0e4-410b-87c6-1191a6653afb" />

### Light and dark
<img width="1525" height="904" alt="light" src="https://github.com/user-attachments/assets/d41c2a2d-8e54-4a8c-8a48-a0a73b423367" />
<img width="1525" height="904" alt="dark" src="https://github.com/user-attachments/assets/c89b35ff-8481-4c12-9b72-aa82b78a44bd" />

### Mobile
<img width="850" height="600" alt="mobile" src="https://github.com/user-attachments/assets/beb8537b-89f5-4f1b-ac7b-85af30117b68" />

### Editing the dashboard
<img width="1582" height="833" alt="Studio" src="https://github.com/user-attachments/assets/26743e60-1967-4d64-a395-71186ee86f16" />

### Popups

<img width="386" height="572" alt="popup-cover" hspace="15" src="https://github.com/user-attachments/assets/af162535-1ad7-477c-a6f7-add2f8f49c70" />
<img width="386" height="572" alt="popup-lock" hspace="15" src="https://github.com/user-attachments/assets/99cfd111-d0bd-41b1-b994-ecd6c8856e74" />
<br><br>
<img width="386" height="572" alt="popup-plant" hspace="15" src="https://github.com/user-attachments/assets/734cd60a-a791-4613-8771-0e108707bc75" />
<img width="386" height="572" alt="popup-aqi" hspace="15" src="https://github.com/user-attachments/assets/8e4bfb88-dbf9-4018-81c4-6fe32d4f950d" />
<br><br>
<img width="386" height="388" alt="popup-energy" hspace="15" src="https://github.com/user-attachments/assets/fcb01fb6-cbaf-467b-828e-6cb05824d9e5" />
<img width="386" height="388" alt="popup-network" hspace="15" src="https://github.com/user-attachments/assets/a73d5b33-03d6-487c-ba13-39c3ae22346f" />
<br><br>
<img width="386" height="668" alt="popup-battery" hspace="15" src="https://github.com/user-attachments/assets/a68d4924-bcc6-42cb-810e-2104bb1ec152" />

## Upgrading from Hemma 2.0

Your existing YAML dashboard keeps working. Nothing is removed or rewritten.

To move it into Hemma:

1. Install the integration as above.
2. Open Hemma and choose **Import from YAML**.
3. Pick your existing dashboard. Hemma reads your rooms, entities and badges, and shows you what it found before it writes anything.

The import creates a **new** dashboard and leaves the original untouched, so you can compare the two and switch over when you are happy.

Five things changed in 2.1 that are worth knowing:

- **browser_mod is no longer required.** Every popup is now Hemma's own. You can remove it if nothing else uses it.
- **navbar-card is no longer required**, replaced by Hemma's own `hemma-nav`.
- **Dashboard resources moved.** Hemma's scripts now ship inside the integration, so HACS keeps them up to date with everything else, and Hemma registers them for you. Existing resource entries are repointed automatically on first setup. If you see a warning in the log about a resource Hemma no longer ships, remove that one entry by hand. Anything left behind in `/config/www/hemma/scripts/` is no longer read and can be deleted.
- **Weather appears only where you configured it.** The weather entity used to be remembered per browser rather than per dashboard, so a second dashboard could draw the first one's forecast. If a dashboard has been showing weather you never set up there, it stops after upgrading.
- **Motion dots are set per room now.** The pulsing dot beside a room in the navigation is configured in Appearance rather than through a helper. Pick the room's motion sensor once and it covers both the navigation and the phone. An imported dashboard starts without one, so set it on each room you want it on.

---

## Features

- **Built from a UI.** Rooms, entities, badges, tiles, scenes, weather, the clock and Now Playing are all set up in Hemma itself, with a live preview of the desktop, tablet and phone layouts as you go.
- **Two layouts.** Focus, with a big room photo and a row of tiles, or Overview, a Home screen of your scenes, favorites and rooms. Pick one for desktop and one for tablet.
- **Rooms** with a photo hero, live clock, weather, and per-room entity tiles
- **Badges** for climate, lights, people, media, security and energy, each opening a page of that category's tiles
- **Now Playing** showing every active source at once, with artwork, progress and controls. Understands media players, Plex and Tautulli, Discord, Steam and PlayStation.
- **Scenes**, as a row, a page, and per-room sections
- **Popups** for lights, locks, covers, climate and air quality, energy, network, plants, batteries, cameras, scenes, system updates, Plex and recently added
- **Mobile dashboard** with filter pills, room popups, a collapsing header, and a wallpaper that samples your room photos for its gradient
- **Sidebar** on tablet and desktop, with your rooms and a page for each category that gathers its tiles from every room, plus an Energy page with today's usage by device
- **Notification Center** like the Mac's: arrivals, doorbells, locks, low batteries, updates and more as glass cards that stack repeats and clear on every device at once
- **Motion** shows a pulsing dot beside a room in the navigation, and a motion icon on the phone
- **Light and dark** throughout, with day and night room images
- **Your language.** The dashboard and Hemma Studio follow your Home Assistant language, and numbers and money follow your Home Assistant settings

---

## Translating Hemma

Hemma follows the language set in your Home Assistant profile. Words Home Assistant already translates, like On, Off and Locked, come from Home Assistant itself. Everything else Hemma says lives in one file per language in `custom_components/hemma/translations/dashboard/`.

`en.json` is the English original. Each line is a name on the left and the text on the right:

```json
"lights.all_off": "All Off",
"lights.n_on": "{n} On",
```

To translate Hemma, copy `en.json` to a file named after your language code, like `sv.json` or `de.json`, and change only the text on the right. A few things to keep as they are:

- **The name on the left.** It is how Hemma finds the line.
- **Anything in braces,** like `{n}` or `{name}`. Hemma writes a number or a name there, so move it wherever your language needs it, but keep it: `"{n} On"` can become `"{n} tända"`.
- **A `%` sign.** In Hemma Studio labels like `"Button % action"` it is where Hemma writes the number, so `"Åtgärd för knapp %"` works. Elsewhere it is a real percent sign. Either way, keep the same number of them.

The lines starting with `studio.` are Hemma Studio, the editor. The rest are the dashboard itself, which is the part most people see, so it is a good place to start. You don't have to translate everything at once. Anything you leave out, or delete from your copy, shows in English, so a partly translated file works fine.

To see what a language still needs, compare your file with `en.json`: any line in `en.json` that is not in yours is still English. If you can run Python, `python3 tools/i18ncheck.py --missing sv` prints exactly those lines, ready to translate, and `python3 tools/i18ncheck.py` shows how much of each language is done.

**To share it,** open a pull request adding your file. It ships in the next release for everyone who uses that language.

**To try it on your own Home Assistant first,** put the file in `custom_components/hemma/translations/dashboard/`, reload the Hemma integration (Settings > Devices & services > Hemma > Reload), and clear your browser's cache. Hemma rebuilds its translations when it loads, so there is nothing to run. If a file has a mistake in it, Hemma skips that file and says which one in the Home Assistant log. Keep a copy somewhere else: an update from HACS replaces that folder, which is another reason to send it as a pull request.

---

## Writing your own YAML

Hemma builds ordinary Lovelace dashboards, so anything it writes you can also write or extend by hand. Custom templates, hand-built views and per-card overrides all keep working.

See **[docs/ADVANCED.md](docs/ADVANCED.md)** for the folder layout, template variables, and the full card reference.

---

### :trophy: Credits

- Original Homio concept and base implementation: [iamtherufus/Homio](https://github.com/iamtherufus/Homio)
- Hemma customization and ongoing tweaks: [@willsanderson](https://github.com/willsanderson)
- Bug hunting and feature ideas: [@SH1FT-W](https://github.com/SH1FT-W), who has
  found and written up more of Hemma's rough edges than anyone, often with a
  working fix attached. Hemma is noticeably better for it.

#### Enjoying Hemma? Buy me a coffee :v::smiley:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V31RK6FB)
