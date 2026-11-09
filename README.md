<img width="1729" height="1383" alt="Hemma on a desktop display: a room photo, the greeting, badges and tiles" src="https://github.com/user-attachments/assets/34ea8a3f-2f33-4337-9ca9-742e1f51f664" />

<div align="center">

[Install](#install) · [Set up](#set-up) · [Using it](#using-it) · [Hemma Studio](#hemma-studio) · [Changelog](CHANGELOG.md)

</div>

## Hemma

A modern dashboard for Home Assistant that **you build without YAML**. Hemma installs as an integration, adds **Hemma Studio** to your sidebar, and sets up a dashboard for desktop, tablet and phone from your rooms and devices. You shape the rest in Studio with a live preview.

Two styles: **Glass**, frosted tiles over your own room photos, and **Minimal**, a clean, flat look in a color you choose, with a deeper shade at night and an option to follow whatever is playing.

## Install

You need **Home Assistant 2026.9** or newer and [HACS](https://hacs.xyz).

1. In HACS, add `https://github.com/willsanderson/Hemma` as a custom repository (type **Integration**) and download **Hemma**.
2. Download **[uix](https://github.com/Lint-Free-Technology/uix)** and **[button-card](https://github.com/custom-cards/button-card)** (7.0.0 or newer) as well, if you don't have them. Use uix instead of card-mod, not both.
3. Restart Home Assistant.

## Set up

1. **Add the integration.** Settings > Devices & services > **Add integration** > **Hemma**.
2. **Open Hemma Studio** in the sidebar. It checks that uix and button-card are ready and links you to anything missing.
3. **Follow the setup assistant.** Pick a layout and style, then your rooms. Your Home Assistant areas are the starting point, and their devices are placed in each room for you. A preview shows every tile before anything is created.

That's it. Hemma creates its own helpers, registers its dashboard resources and selects its theme for you (unless you already use a theme of your own). Nothing is written to `configuration.yaml`, and if something ever goes missing, Studio offers to repair it.

For the clock on your room cards, add the **Date & time** integration and enable its Time sensor. Without it, the clock simply isn't shown.

## Using it

| You do | Hemma does |
|:--|:--|
| Tap a tile | Opens its popup: a dial for lights, climate and covers, a remote for TVs, a live view for cameras |
| Tap a badge | Opens a page with that category's tiles from every room |
| Open the sidebar or navbar | Moves between rooms, categories and Home |
| Open the bell | Shows what needs attention: arrivals, doorbells, locks, low batteries and updates |
| Leave a wall tablet alone | Shows a screensaver in your dashboard's colors |

On the phone, badges filter the page and each room opens as its own sheet.

## Hemma Studio

Rooms, tiles, badges, scenes, cameras, weather and screensavers, all set up in one place with a live preview for desktop, tablet and phone in light and dark.

<img width="1582" height="833" alt="Hemma Studio with the live preview" src="https://github.com/user-attachments/assets/26743e60-1967-4d64-a395-71186ee86f16" />

- **Two layouts for big screens.** Focus, a room photo with a row of tiles, or Overview, a Home screen of scenes, favorites and every room.
- **Separate phone choices.** The phone can use its own backdrop and text color.
- **Nothing changes until you press Save,** and updates to Hemma reach your dashboards on their own.
- **Export and import.** Save your dashboard to a file and bring it back later, on the same Home Assistant or another one.

<details>
<summary>More pictures</summary>
<br/>

**Focus**
<img width="1604" height="903" alt="Focus layout on a desktop" src="https://github.com/user-attachments/assets/5fae3633-edef-431b-8201-8c7856e8af17" />

**Overview**
<img width="1605" height="907" alt="Overview layout on a desktop" src="https://github.com/user-attachments/assets/f27d8a56-d0e4-410b-87c6-1191a6653afb" />

**Light and dark**
<img width="1525" height="904" alt="Light" src="https://github.com/user-attachments/assets/d41c2a2d-8e54-4a8c-8a48-a0a73b423367" />
<img width="1525" height="904" alt="Dark" src="https://github.com/user-attachments/assets/c89b35ff-8481-4c12-9b72-aa82b78a44bd" />

**Phone**
<img width="850" height="600" alt="Phone layout" src="https://github.com/user-attachments/assets/beb8537b-89f5-4f1b-ac7b-85af30117b68" />

</details>

<details>
<summary>Everything Hemma does</summary>
<br/>

- **Badges** for climate, lights, people, media, security and energy, plus **status badges** for any device, like a washer with 12 min left.
- **Popups for every tile:** lights, climate, fans and air purifiers, humidifiers, locks, covers, vacuums, media with a TV remote, cameras, energy, network, plants, batteries, updates and Plex.
- **Now Playing** with artwork and controls, and a full-screen player. Understands media players, Plex and Tautulli, Discord, Steam and PlayStation.
- **Cameras** on Home, in rooms and on the Security page, with a timeline of today's motion and doorbell events.
- **Energy** with today's total, usage by device, and Day, Week and Month.
- **A plant assistant** that checks a plant's last week of readings against its needs and tells you what to do, using Home Assistant's AI Task when you have one set up.
- **Screensavers** for wall tablets: Today (date, clock, weather and calendar), Clock, and Recently Added from Plex.
- **Your choice of what a tap does** on each tile: Normal, Ask First, or View Only for a tablet you hand to a guest.
- **Your language.** Hemma follows your Home Assistant language and number formats.

</details>

<details>
<summary>Upgrading from 2.3</summary>
<br/>

Update Hemma in HACS and restart Home Assistant. Your dashboards pick up the new templates automatically, so there is nothing to save.

Hemma 2.4 creates its helpers itself. If you copied `packages/hemma_helpers.yaml` for 2.3, Hemma takes those helpers over and you can remove the file and the `packages:` line whenever you like. The `frontend: themes:` line is no longer needed either.

To try the new style, choose **Minimal** under Appearance > Style in Hemma Studio.

</details>

<details>
<summary>Coming from Hemma 2.0 (YAML)</summary>
<br/>

Open Hemma Studio and choose **Import from YAML**. Hemma reads your rooms, entities and badges, shows you what it found, and creates a **new** dashboard next to your original, so you can compare the two before switching.

</details>

<details>
<summary>Translating Hemma</summary>
<br/>

Hemma's text lives in one file per language in `custom_components/hemma/translations/dashboard/`. Copy `en.json` to your language code (like `de.json`) and change only the text on the right. Keep the name on the left, anything in braces like `{n}`, and any `%` signs. Lines starting with `studio.` are Hemma Studio; the rest is the dashboard. Anything you leave out shows in English.

`python3 tools/i18ncheck.py --missing de` lists what a language still needs. To share a translation, open a pull request with your file.

</details>

<details>
<summary>Writing your own YAML</summary>
<br/>

Hemma builds ordinary dashboards, so custom templates, hand-built views and per-card overrides keep working. See **[docs/ADVANCED.md](docs/ADVANCED.md)** for the folder layout, template variables and the card reference.

</details>

## Credits

- **[Homio](https://github.com/iamtherufus/Homio)** by [@iamtherufus](https://github.com/iamtherufus), the original concept and base implementation.
- **[@SH1FT-W](https://github.com/SH1FT-W)**, for finding and fixing more of Hemma's rough edges than anyone, and for [Casora](https://github.com/SH1FT-W/casora), whose ideas several 2.4 features build on.
- Built and maintained by [@willsanderson](https://github.com/willsanderson).

[MIT](LICENSE)

#### Enjoying Hemma?

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V31RK6FB)
