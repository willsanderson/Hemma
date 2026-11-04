# Scrolling mobile surface regression

Run with Node 22+ and an existing Chromium/Chrome (no npm dependencies):

```sh
CHROME_BIN=/path/to/chrome node tests/mobile-layout.mjs
```

This starts a loopback-only fixture server and an isolated headless browser, then
removes the browser profile and stops both processes. Set `TMPDIR` when temporary
files must live in a particular directory.

The default fixture uses the real `hemma-smart-row` component and shipped
base-card CSS, with stub HA cards. To also exercise the installed button-card's
actual template evaluation and rendering, supply a local copy (not bundled here):

```sh
BUTTON_CARD_JS=/path/to/button-card.js CHROME_BIN=/path/to/chrome node tests/mobile-layout.mjs
```

Both modes check container-driven columns from 320 to 1440 CSS px and back to
390, natural content height, large/raw/disabled and delayed conditional cards,
outer chrome, desktop rails and redirect behavior. These are isolated component
tests, not a full HA integration test of filters, state changes and popups.

`scroll_mode` rows remain in document flow at all widths. Sorted rows fit as
many columns as their container permits, using `--hemma-tile-min-width` (170px
by default). Large tiles have at least the old two-track height but grow with
content instead of spanning two fixed tracks; a tall tile can therefore make
its grid row taller. Desktop/tablet non-scroll rails are unchanged.

An explicit mobile URL is retained when widening/unfolding. A wide direct
desktop/tablet URL is not reclassified by touch hardware or user-agent. Open the
mobile URL to use that layout on a wide screen.
