# Changelog

## 2.3.1

A quick update with fixes for 2.3.0, and a refreshed Notification Center on phones and tablets.

### Notifications

- **iOS-inspired restyle on phones and tablets**, with larger cards, text and touch-sized buttons, and softer glass edges.
- **Readable anywhere.** The title and group headers carry their own soft blur, so they stay clear over tiles as well as the photo.
- **Scrolling the dashboard closes Notifications**, the way a popover does.
- **Light mode is better balanced** between the top and bottom edges.

### Fixes

- **Swiping a notification** now stops beside the Clear button instead of running off the panel, and a stack slides as one.
- **Switching between Overview and Focus** is instant after saving in Hemma.
- **Now Playing keeps its width** in Focus when the source has no playback controls.
- **Stacked notifications** no longer show the card behind through the glass.
- **In landscape on the phone**, the top right buttons stay clear of the screen's edges.

**After updating, restart Home Assistant and reload the dashboard.** The Now Playing fix also needs one Save in Hemma.

## 2.3.0

**After updating, restart Home Assistant, then clear your browser's cache if Hemma looks unchanged.** On the iOS app that means clearing the app cache; in a desktop browser a hard reload usually does it. The new options and template changes also need one Save in Hemma Studio.

This release brings an Apple Home-inspired design to tablets and desktop: a sidebar, a page for each category, and a second layout, Overview. The tablet also picks up the phone's design, with the same badges, tiles and filter pages.

### Two layouts

- **Overview, a new layout.** Home shows the greeting and badges at the top, then Now Playing, your scenes in one row, your favorites and each room's tiles. Each room opens as a page of its own tiles, with the room's sensor chips at the top.
- **Focus, Hemma's layout, stays the default.** The big room photo, the room name and a row of tiles, as before.
- **Choose per device.** The new **Layout** section in Hemma Studio sets the desktop and the tablet separately. The tablet follows the desktop unless you change it.
- **Overview on desktop** keeps the sidebar open. The title sits in the toolbar row level with the clock, with the weather beside the buttons, and tiles have smaller corners.
- **Smart Sort** moves active tiles to the front, in both layouts. On Overview, rooms are packed in rows with no gaps before a later tile.

### The sidebar

- **A sidebar.** Tap the sidebar button in the nav bar to open it. It lists Home, your rooms and your categories, and both lists fold away.
  - On desktop the button is the first item in the tab row. In Focus, ⌃⌘S opens and closes it.
  - **Scenes** sits under Home and opens a page with all your scenes. Overview shows your scenes on Home instead.
  - **Home Assistant** in the **...** menu opens Home Assistant's own sidebar. It replaces the faint menu button in the top left corner on tablets and desktop. YAML dashboards get the **...** menu too, with Refresh and Home Assistant.
  - In landscape, and on desktop, it moves the room aside and stays open while you switch rooms. Overview starts the page 20pt after it on a tablet and 15pt on desktop, and Focus leaves a little more room. On desktop the clock moves into the sidebar, and the top right buttons and Now Playing move in to match. Drag its edge to make it a little wider or narrower.
  - In portrait it opens over the page and closes as you pick a room.
  - Rooms with motion show a motion icon.
  - Turn on **Open sidebar on load** under Layout to have it open when the dashboard loads.

### Category pages

- **A page for each category.** Tap Climate, Lights, People, Media, Security or Energy in the sidebar to see that category's tiles from every room, the way the phone's filter pages work. It has the phone's badges and sub-badges at the top, and tapping a badge switches category. A category with nothing in it is left out of the sidebar.
- **Lights lists every light on its own**, with its brightness, rather than one tile per room. A light group inside a room stays one tile and shows All On or how many are on.
- **Scenes that touch a category** show at the top of its page.
- **Badges open their category page**, as they do on the phone. On Home a badge shows that category across the whole house; in a room it shows just that room. Tap the selected badge again to close the page. The rows of sub-badges that used to open under the badges are gone; the category page shows them at the top.
- **An Energy page.** Your Energy tile, plus today's usage by the hour and each device's total, from the devices in your Home Assistant Energy settings. Tap either chart for the energy popup.

### Motion

- **A category page rises from the bottom** while the room sinks back, and when it closes the room comes forward again, title, badges and tiles together. Switching categories changes the page in place.
- **Home to a room slides**, and back to Home slides the other way, with the room's photo drifting in under it. Moving between rooms swaps them with a quick fade.
- **Overview moves the moment you tap.** The room's page and its photo change in the same frame, and Home Assistant catches up once the slide has landed, so the motion never waits on it.
- **The dashboard loads in one piece.** On desktop the clock and the page no longer slide into place, and Overview appears whole, already sorted, instead of the greeting first and the tiles after it.

### New on tablets

- **A new nav bar.** Neutral glass that keeps the color of the photo behind it, with light edges at the top and bottom, a fine dark line at each end, and room names in the system font. It shows the rooms that fit in landscape, and Home, the current room and Scenes in portrait. The sidebar button is a simple outline the height of the text.
- **The top buttons share one glass capsule**, with the Now Playing waveform inside it. Desktop keeps its separate buttons.
- **A status bar.** The time and date sit at the top left and the battery at the top right. Choose the battery sensor under General > Status bar.
- **The sidebar and back buttons are true circles** of glass, lit from the top left, and glow softly when pressed, as the nav bar does.
- **The Lights and Batteries popups use the whole screen.** They no longer stop short of the bottom, and what you scroll past slides under the header behind a blur instead of being cut off.
- **Tiles are a little tighter** on tablets and desktop.

### Notifications

- **Notification Center.** The bell slides your notifications in from the right edge as macOS-style floating glass cards. Tap one to open it. Hover over a card and click its ✕, or swipe it left on a touchscreen, to clear it; the ✕ beside the title becomes Clear All. On a phone the cards line up with your tiles, and the weather steps aside while it's open. With nothing new, "No recent notifications" slides out under the bell.
- **Light and dark.** In light mode the cards are a bright frost with dark text; in dark mode, a darker glass. They follow Home Assistant's dark mode setting.
- **Clearing syncs.** Clear a notification on one device and it's gone on every device and for everyone using the dashboard.
- **Repeats stack.** Several notifications from the same thing fold into one card with a count and the others peeking out beneath it. Tap it to fan them out under their own header, with Show less and a ✕ that clears the group.
- **Safety alarms are marked Time Sensitive** and stay at the top while they are still going: smoke, carbon monoxide, gas, water and a triggered alarm. Everything else is newest first.
- **Times at a glance:** "now", "12m ago", then the clock time for earlier today, then Yesterday or the day of the week.
- **A second line only when it adds something:** the room for doorbells, locks, doors, alarms and carbon dioxide, or the level for a low battery. A dot marks anything new.
- **A long list fades softly at the bottom edge** while there's more to scroll.

### New everywhere

- **A greeting on Home.** Set Home > Appearance > Title to Greeting for "Good morning" in place of the room name.
- **Show the date, and choose where the weather goes.** Hemma Studio has a new Weather and date panel under General. Pick what sits above the room name, the weather or the date, and the other one moves next to the time. Nothing changes until you use it. Requested by [@DewGew](https://github.com/DewGew) in [#81](https://github.com/willsanderson/Hemma/issues/81).
  - With the weather above the room name, **Conditions** shows its icon (74° ☀), a description (74° Sunny) or just the temperature.
  - **Show date** adds the date next to the time, and **Show on** chooses desktop, tablet or both.
  - **Date style** switches between Tue Sep 29 and Tuesday, September 29. The date follows your Home Assistant language and date format.
  - The weather section can show °F or °C after the temperature.
- **The weather icon is a little smaller on tablets and desktop**, with more room between it and the temperature.
- **One tile switch.** Tiles with a switch use the same size everywhere.
- **The ... menu uses the notifications' glass**, light or dark to match Home Assistant, with the same bright edge along the top.
- **Badge names are semibold** instead of bold, in whichever font you picked in Hemma Studio.
- **The phone's room popup shows every light** as its own tile.
- **Performance mode covers the new glass.** The nav bar, sidebar buttons, category pages and Now Playing turn solid too.
- **Hemma Studio's options slide in.** Settings that only apply once you turn something else on now appear and disappear in place, instead of the whole panel redrawing.
- **Hemma Studio's preview follows the new layouts.** The tablet and desktop previews show Overview and the sidebar, and you can tap the preview's nav bar, weather, date or time to go straight to their settings.

### Translations

- **Swedish is almost complete**, about 97% of Hemma, thanks to [@DewGew](https://github.com/DewGew) in [#80](https://github.com/willsanderson/Hemma/pull/80).
- **Weather conditions are translated on the phone**, also from [@DewGew](https://github.com/DewGew) in [#82](https://github.com/willsanderson/Hemma/pull/82).

### Fixes

- **Restarting Home Assistant no longer rings the doorbell.** A Ring doorbell resets on every restart, and each restart showed up as "Front Door rang".
- **The Scenes row scrolls out to the edge** on Overview instead of being cut off short of the sidebar.
- **Phone filter pages open in the right place.** The first time you opened one it could sit too high, with the rooms under the badges.
- **Phone filter pages no longer jump after a dashboard change.** Once the dashboard had been edited or Hemma updated, every badge's page slid up too far and then snapped down until you reloaded.
- **The Climate filter page shows its tiles.** It could open with only the sub-badges and nothing below them. Favorites could go missing the same way.
- **The phone no longer opens too low.** A cold start could leave a gap the height of Home Assistant's header above the page.
- **The room photo fills the screen on a tablet.** After rotating, or coming back to the app after a while, it could stop short of the right edge until you changed rooms.
- **Ready for Home Assistant 2026.10.** Changing rooms with the sidebar open could close it and open it again each time.
- **The Now Playing title scrolls again** when it's too long to fit.
- **Hemma Studio fits an iPad screen** instead of scrolling slightly.
- **Hemma Studio's preview stays put.** It could jump when you switched sections, and after a refresh it could load too high and then drop into place.
- **The Air Quality sub-badge in the preview matches the dashboard.** It read the sensor's raw state, so the preview could say good while the dashboard said Excellent.
- **Return to Home when idle resets everything on a tablet.** A category page or the sidebar could stay open over the Home screen.
- **`input_select.hemma_expanded_row` is gone** from `packages/hemma_helpers.yaml`, with the automation that opened it when media played. Nothing has used it since badges started opening category pages; remove it from your own copy if you keep one.

## 2.2.0

**If Hemma looks unchanged after updating, clear your browser's cache.** On the
iOS app that means clearing the app cache; in a desktop browser a hard reload
usually does it. The template fixes below also need one Save in Hemma Studio.

Hemma now follows your Home Assistant language, on the dashboard and in Hemma
Studio. Only a little of it is translated so far, so this release is mostly
about making translation possible. If you'd like Hemma in your language, see
**Translating Hemma** below.

### Translations

- **Hemma uses your Home Assistant language.** Words Home Assistant already
  translates, like On, Off, Locked, Home and Away, now come from Home
  Assistant, so they match the rest of your setup. Everything else Hemma says
  is in one translation file, about 980 lines covering the badges, tiles,
  popups, notifications and all of Hemma Studio. Anything that isn't
  translated yet shows in English. Requested in
  [#68](https://github.com/willsanderson/Hemma/issues/68).
- **Swedish is the first language.** The badge and filter names, the People
  badge and Hemma's setup dialog are in Swedish, thanks to
  [@DewGew](https://github.com/DewGew) in
  [#77](https://github.com/willsanderson/Hemma/pull/77). The rest is still
  English for now.
- **Numbers and money follow your settings.** Decimals, thousands separators
  and currency now use your Home Assistant profile and currency, so a Swedish
  setup shows 0,4 kWh and 1 588 ppm. In English you'll only notice a thousands
  separator: 1588 ppm is now 1,588 ppm.

### Translating Hemma

Copy `custom_components/hemma/translations/dashboard/en.json`, name it after
your language (`de.json`, `fr.json`), and translate the text on the right of
each line. You don't have to do it all at once. Anything you leave out stays in
English. When you're happy with it, open a pull request.

To try it on your own Home Assistant first, put the file in that folder and
reload the Hemma integration. There's nothing to run. The
[README](https://github.com/willsanderson/Hemma#translating-hemma) has the
details, including the few things to leave as they are.

### Also new

- **Favorites can be renamed.** Hemma Studio has a new Name on phone field
  under Home > Appearance, just below Room name, so you can call it anything,
  in your own language too. Nothing changes until you use it.

### Fixes

- **Tiles that only show when needed no longer push the page down.** Tiles
  like Plex Recently Added and Updates used to draw at full height on load and
  then collapse, which moved everything below them. Closing a filter could
  also leave extra gaps.
- **Switching Home Assistant's language no longer breaks tiles.** For a moment
  after switching, some tiles showed a ButtonCardJSTemplateError until you
  refreshed.
- **No more error toast when Home Assistant restarts.** A dashboard open
  during a restart could show "Failed to perform the action
  input_datetime/set_datetime". Reported in
  [#78](https://github.com/willsanderson/Hemma/issues/78) by
  [@SH1FT-W](https://github.com/SH1FT-W), who also tracked down the cause.
- **The Lights badge counts rooms set up with only a light group.** It used to
  say All Off no matter how many lights were on.
- **The Air Quality badge agrees with its popup.** With high CO₂ the badge
  could say Excellent while the popup said Poor. They now use the same reading.
- **One notification per door.** A lock with a built-in door sensor plus a
  separate contact sensor listed "Front Door is open" twice.
- **The battery popup is the right width.** With no low batteries it could
  open at double width, because a low battery somewhere else in the house
  counted too.
- **Now Playing shows up right away on a phone.** On a fresh load it could
  stay hidden for a few seconds.
- **Even spacing above Scenes on a phone.** With nothing playing, Scenes sat
  about 8px lower than the other sections.
- **The skip forward button is no longer cut off** on a phone, and play and
  pause lost the faint ring it had at rest. A follow-up to
  [#74](https://github.com/willsanderson/Hemma/issues/74).

## 2.1.2

**If Hemma looks unchanged after updating, clear your browser's cache.** Hemma
stamps its scripts so a browser should fetch the new ones, but Home Assistant's
frontend caches hard enough that the stamp does not always win. On the iOS app
that means clearing the app cache; in a desktop browser a hard reload usually
does it. Template fixes also need one Save in Hemma Studio, as in 2.1.1.

- **Each phone keeps its own filter.** The overlay you get from tapping a badge
  or a room header was stored in a Home Assistant helper, and a helper is one
  value for the whole house, so two phones open at the same time drove each
  other: tapping Lights on one opened it on the other, and closing it closed
  both. Each device now remembers its own. The helper is still set, so anything
  you automate against it keeps working, and the other phones simply ignore it.
  Reported in [#76](https://github.com/willsanderson/Hemma/issues/76).

- **The skip buttons use Apple's glyphs.** Previous and next were the triangle
  and bar from Material. Apple Music, the iOS now playing sheet and Control
  Center all use two rounded triangles with no bar, and Hemma's play and pause
  already came from that set, so the two of them stood out. They sit slightly
  smaller than play and pause, as they do in Apple Music, and are nudged off
  center because a triangle looks heavy on its flat side. The faint ring that
  sat behind them at rest has gone with it: those two buttons carried a halo
  three times stronger than play's, which on a flat card read as an outline
  nobody asked for. Suggested, with the glyphs, in
  [#74](https://github.com/willsanderson/Hemma/issues/74).

- **Conditional cards in a tile row are left alone.** 2.1.1 wrapped every card
  in a row that was not one of Hemma's own into a host tile, so it could give a
  pasted card Hemma's surface and sizing. A `conditional` card is not a tile
  though: it decides for itself whether to appear, and the host stayed behind
  when the inner card hid, leaving an empty tile that also broke sorting. Worse,
  the rewrite made the phone layout fail its round trip, so Studio quietly
  skipped saving the phone half and the two dashboards drifted apart. Hemma now
  hosts only cards that behave like a tile, and a stack, a carousel or anything
  else carrying cards of its own is passed through untouched. A dashboard
  already rewritten by 2.1.1 is put back as it is read. Reported in
  [#75](https://github.com/willsanderson/Hemma/issues/75).

- **Performance mode keeps Hemma's animations.** It switched off the entrance
  along with the blur, on the assumption that animation was part of what makes a
  slow device struggle. It is not. Every entrance in Hemma animates opacity and
  transform only, which a browser hands to the compositor and draws without
  repainting anything; the cost was always the blur behind them. Switching it off
  also raced with the timing each row writes onto its own tiles as it builds, so
  the entrance often played half way and the tiles arrived in a stagger that
  looked like a fault. Performance mode now changes the blur and the surfaces
  that depend on it, and nothing else.

- **The buttons above a phone dashboard crowd the corner less.** The pill
  holding them is 40px tall rather than 44px.

## 2.1.1

**Open Hemma Studio and press Save once after updating.** Several fixes below
live in Hemma's card templates, and those reach your dashboard when Studio
saves, not when HACS updates the integration. Until you save, the update is
installed but the templates in your dashboard are still the old ones. This
applies to the Firefox toggle fix in particular.

- **The Save button no longer reads "Save changesSave".** Hemma Studio carries
  both a wide and a narrow label for that button and only ever hid the wide one
  on a phone, so every other width drew the two of them back to back.

- **Toggles are the right size in Firefox.** A tile's toggle sized itself from
  a ratio of two lengths. Chrome and Safari work that out; Firefox does not, and
  because a custom property that fails takes every property built on it down
  with it, the toggle lost its width entirely and grew to fill the tile. The
  size is a fraction of the tile height now, which every browser accepts, and
  the toggle is the same size as before everywhere else. Reported in
  [#72](https://github.com/willsanderson/Hemma/issues/72).

- **Hemma Studio on a phone is the same editor as on a desktop.** The phone had
  no equivalent of the sidebar, so Badges and Tiles were unreachable and the
  sections came in band order with no grouping. It now shows the same grouped
  list, under the room's name and Dashboard, with Badges and Tiles as rows. The
  large title also stopped being hidden behind the toolbar, which had left the
  header collapsed for good.

- **Hemma's scripts ship with the integration.** They used to be served from
  `www/hemma/scripts/`, the folder you copy in by hand, which HACS never
  updates. Updating to 2.1 therefore paired the new Studio with 2.0's
  JavaScript, and every element added in 2.1 was undefined: room navigation
  broke with "Custom element doesn't exist: hemma-nav", and the popups with it.
  The scripts now live inside `custom_components/hemma/`, so HACS updates them
  with everything else and there is nothing to copy. Anything left in
  `/config/www/hemma/scripts/` is no longer read and can be deleted. Reported in
  [#69](https://github.com/willsanderson/Hemma/issues/69).

- **A template you have edited is kept.** Every save used to copy all of
  Hemma's templates over whatever was in the dashboard, so a hand edit, a
  translation, or a template of your own with a `hemma_` name was reverted or
  deleted by an unrelated save. Hemma now records a hash of what it last wrote
  for each template and compares before touching it: its own it may update,
  yours it leaves alone and names in the log. The same check gates deletion, so
  the name no longer decides anything. The panel also re-reads the dashboard at
  save time, so `kiosk_mode` and anything else changed elsewhere is no longer
  overwritten by a stale copy. Reported in
  [#66](https://github.com/willsanderson/Hemma/issues/66).

- **A tile placed only on the phone stays there.** Syncing a linked desktop and
  phone dashboard dropped any phone tile with no desktop twin, and the log line
  for it said "left as it is". Hemma now marks the tiles it copies out of a room
  and only those follow their twin out.

- **Cards of your own, in the tile picker.** The type dropdown ends in Custom
  card, which takes the same YAML or JSON you would paste into Home Assistant's
  raw editor and places it either in the tile row or below the tiles. A card in
  the row is hosted by a Hemma tile, so it gets the same surface, radius, blur
  and size as everything beside it, and it can be named, sized, hidden per
  surface, edited, copied to another room or moved below the tiles afterwards.
  A card below the tiles can be edited, moved back up or removed, and the view
  still fits one screen: the room photo shortens by the height of whatever sits
  under the tiles instead of the dashboard scrolling. The same box also takes a
  `button_card_templates` entry, which becomes a reusable tile type offered in
  every room, with a settings field per key its `variables:` block declares.
  Templates of your own that a tile already uses appear there on upgrade.
  Reported in [#67](https://github.com/willsanderson/Hemma/issues/67).

- **Rooms you add or delete reach the phone layout.** Hemma matched each
  desktop room to a phone section by name and worked out which had no partner,
  but that only ever reached the log, so deleting a room left its section on the
  phone with nothing to remove it, and a new room never got one. Saving now
  keeps them in step both ways. A section holding a tile you placed by hand is
  never removed, only ones whose tiles all came from the room. Reported in
  [#72](https://github.com/willsanderson/Hemma/issues/72).

- **The notification center takes sources of your own.** Adding a letterbox, a
  weather warning or a bin collection meant editing `hemma-core.js`, which an
  update then overwrote, so the same patch had to be reapplied every time. There
  is now a hook: put objects on `window.HEMMA_NOTIFY_EXTENSIONS` with any of
  `watch` (extra entities to read from the logbook), `describe` (turn a logbook
  entry into a row, or return `undefined` to let Hemma's own rules handle it)
  and `standing` (add to or replace the live rows). Each gets a small `api` with
  `on`, `nameOf`, `tidyName` and `dc` so a source of yours reads like a built-in
  one. An extension that throws is logged and skipped rather than taking the
  notification center down with it. Proposed in
  [#71](https://github.com/willsanderson/Hemma/issues/71).

- **A wall tablet can return to Home on its own.** Left on a room, a tablet
  stays there, so whoever walks past next sees the bathroom rather than the
  house. Hemma Studio > General > Dashboard has "Return to Home when idle" with
  a wait of 1, 2, 5 or 10 minutes, off by default. Tablets only, on the same
  test the tablet navigation uses, so a desktop browser and a phone are never
  affected. Any touch, key or scroll resets it, an open popup pauses it so it
  never pulls you away from a camera, and a tablet waking from sleep is checked
  straight away rather than at the next tick. Requested in
  [#73](https://github.com/willsanderson/Hemma/issues/73).

- **Hemma's own text can be translated.** Dashboard strings were written into
  the templates in English with no way to change them short of editing the
  templates, which an update then overwrote. There is now a translation layer:
  English stays at the call site as the fallback, and any other language is
  read from `custom_components/hemma/translations/dashboard/`. The first
  strings through it are the phone's filter pills, the people badge, the
  thermostat and the mobile weather card. Only English ships so far, so nothing
  looks different yet; adding a language is a JSON file and a rebuild, and
  Home Assistant's own vocabulary already follows your HA language. More of
  Hemma's text moves across in later releases. Raised in
  [#68](https://github.com/willsanderson/Hemma/issues/68).

- **Performance mode.** Backdrop blur is what makes Hemma crawl on a cheap
  tablet: every blurred layer is a full screen GPU readback per frame, and they
  stack. Studio > General > Performance makes the dashboard's own surfaces
  opaque instead, set to Off, On, or Automatic, which switches on below 4GB of
  memory or 4 cores. Tiles, cards, the sidebar, badges, pills, the header,
  scene chips and the room photo all lose their blur, and the entrance
  animations go with them. Popups keep theirs: they paint only while open, so
  they are not what makes a tablet feel slow. The device that needs it is
  usually one tablet rather than the house, so opening the dashboard there once
  with `?hemma_perf=on` pins it for that device and beats the dashboard
  setting. Suggested in
  [#65](https://github.com/willsanderson/Hemma/issues/65).

- **A low battery has to stay low before it says so.** Some devices report a
  bogus reading for a moment (`100 -> 3 -> 100`), which raised a "Battery low"
  notice for a device that was fine. A battery now counts as low only once it
  has read low for 30 minutes without a break. Set the wait under Notifications
  > Advanced > "Low battery hold (minutes)"; 0 restores the old immediate
  notice. A battery that has been low since before the page loaded
  still shows straight away, and a drop from 19% to 18% no longer restarts the
  wait. Reported in [#70](https://github.com/willsanderson/Hemma/issues/70).

- **The README leads with the install steps.** Installation sat behind every
  screenshot, which in the HACS panel meant scrolling past all of them to
  reach it. The screenshots now follow it, under their own heading.
- **The wide screenshots scale to the panel.** They carried fixed pixel
  widths up to 1729. GitHub quietly caps those at the page width, but the
  HACS renderer honors them, so the hero overflowed and was cropped.
- **`configuration.yaml` no longer contradicts the install steps.** Its header
  still said to add Lovelace resources by hand under Settings > Dashboards >
  Resources. Hemma has registered those itself since 2.1.0. The `lovelace:`
  block is now marked as belonging to the hand-written YAML setup in
  [docs/ADVANCED.md](docs/ADVANCED.md), which is the only place it applies.

## 2.1.0

Hemma is now installed and configured from a UI. You add it as an integration,
open **Hemma** in the sidebar, pick your rooms and entities, and press
Save. There is no dashboard YAML to write and no card configuration to paste.

Everything below still works if you prefer writing it by hand. Hemma and YAML
produce the same dashboard, and you can move between them in either direction.
See [docs/ADVANCED.md](docs/ADVANCED.md).

### Building your dashboard

- Build the whole dashboard from the sidebar: rooms, entities, badges, tiles,
  scenes, weather, the clock and Now Playing.
- **Import from YAML** reads an existing dashboard and rebuilds it. Hemma
  writes a new dashboard and leaves the original untouched, so you can compare
  the two before switching.
- **Cards Hemma does not manage are listed, and removable.** A dashboard
  imported from YAML can carry cards Hemma knows nothing about. They are kept
  exactly as they are, below the tiles, and now appear under **Other cards** in
  that room's settings, so one you do not want can be removed.

### Installing

- Hemma installs as a HACS integration.
- **Dashboard resources register themselves.** Where 2.0 asked you to paste
  eight entries under Settings > Dashboards > Resources, setup now writes them.
  An entry still loading from `/local/hemma/scripts/` is repointed in place
  rather than duplicated, so upgrading does not load anything twice.
- Scripts are served with caching off at a stable URL, so a fix can no longer
  be hidden behind a 30 day browser cache and there is no `?v=` to remember.
- New icon, in the sidebar and in HACS.
- **The phone's filter pills follow your rooms.** Their options used to be a
  hand-written list in `packages/hemma_helpers.yaml`, so a fresh install
  inherited whichever rooms happened to ship in it. Hemma writes that list
  itself now, every time you save.

### Popups

Every popup is Hemma's own element now rather than a browser_mod dialog, which
drops a dependency and puts the whole surface under Hemma's control.

- Thirteen popups: lights, locks, covers, climate and air quality, energy,
  network, plants, batteries, cameras, scenes, system updates, Plex and
  recently added.
- One surface behind all of them, with its own scrim, header and close button,
  so every popup opens, scrolls and dismisses the same way.
- A grab handle and swipe to dismiss on a phone.
- If Hemma's scripts have not loaded yet, a tap opens Home Assistant's
  more-info dialog rather than doing nothing.

### Now Playing

Rebuilt around a single collector, which fixes a family of bugs where a media
tile could duplicate, vanish, or show the wrong artwork.

- One ranked list feeding one uniform stack, on every device.
- Per card state, so two dashboards open in one session no longer trample each
  other. This is what caused the duplicate tile clipped below the real one
  after a restart.
- **Steam and Discord are one entity each.** Point Hemma at the account sensor
  and the game, artwork and detail line all follow. 2.0 wanted three separate
  Steam sensors.
- **Tautulli works unwrapped.** A session sensor from the Tautulli Active
  Streams integration can be used directly; the title, viewer and poster all
  follow from it. No template sensor needed.
- **Exclude specific Plex viewers**, so your own streams can be hidden from the
  dashboard.
- PlayStation artwork now resolves from the image entity alongside the session
  sensor.

### Navigation and theme

- **`hemma-nav` replaces navbar-card.** Navigation is Hemma's own now, with an
  anchored desktop row.
- The Edit, Notifications and Scenes dropdowns match Hemma's own corners.
- Reworked theme.

### Layout

Tiles, their icon circles and their toggles now come from one bounded scale, so
a dashboard holds its proportions from a phone up to a desktop instead of
jumping at a width threshold. The tile row sits against the screen edge rather
than being lifted off it by the header.

### Upgrading from 2.0

Your existing YAML dashboard keeps working. Nothing is removed or rewritten.

To move it into Hemma, open it from the sidebar and choose **Import from YAML**.

Five things changed that are worth knowing:

- **browser_mod is no longer required.** Every popup is Hemma's own. Remove it
  if nothing else uses it.
- **navbar-card is no longer required**, replaced by `hemma-nav`.
- **Dashboard resources moved** and are registered for you. If the log warns
  about a resource pointing at a script Hemma no longer ships, remove that one
  entry by hand. Hemma never deletes a resource itself, because that list holds
  every card you have installed.
- **Weather appears only where you configured it.** The weather entity was
  remembered per browser rather than per dashboard, so a second dashboard could
  draw the first one's forecast and temperature. If a dashboard has been
  showing weather you never set up there, it stops after upgrading.
- **Motion dots are set per room now.** The pulsing dot beside a room in the
  navigation is configured in Appearance rather than through a helper. Pick the
  room's motion sensor once and it covers both the navigation and the phone. An
  imported dashboard starts without one, so set it on each room you want it on.
