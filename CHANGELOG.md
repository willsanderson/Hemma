# Changelog

## 2.4.0

Hemma's biggest update yet: setup without YAML, a second style, Minimal, alongside Glass, new popups for every tile, three screensavers for wall-mounted iPads, and a redrawn Energy page.

**After updating, restart Home Assistant.** Your dashboards pick up the new templates on their own, so there's nothing to save. If a dashboard looks unchanged, clear your browser's cache (in the iOS app, clear the app cache).

### Setup

- **Set up without YAML.** Add the integration, open Hemma Studio and follow the setup assistant. Hemma creates its own helpers, registers its dashboard resources and selects its theme, unless you already use a theme of your own. Nothing is written to `configuration.yaml`.
- **A setup assistant.** It checks that uix and button-card are ready, then asks for a layout, a style and your rooms. Your Home Assistant areas are the starting point, and each area's devices are placed in its room for you, likeliest first. A preview shows every tile before anything is created, and you can leave out any tile you don't want.
- **Weather is found for you**, so the greeting shows the forecast without a setting.
- **Setup picks up where you left off** after a reload, and Run setup again in Hemma Studio starts it over.
- **Repair.** If a helper Hemma needs goes missing, Studio says so and creates it again with one tap. If Save is blocked because the dashboard holds something the editor can't keep, Repair puts back Studio's version.
- **Updates reach your dashboards on their own.** After you update Hemma and restart, every Hemma dashboard picks up the new templates, with no need to open Studio or press Save.
- **Coming from 2.3.** Hemma takes over the helpers from `packages/hemma_helpers.yaml`, so you can remove that file, its `packages:` line and the `frontend: themes:` line whenever you like.
- **Export and import.** Export dashboard in Hemma Studio saves your dashboard to a file, and Import from file brings it back, on the same Home Assistant or another one. Export uses the saved version, so unsaved changes aren't included.

### Minimal

- **Minimal, a new style.** Choose Glass or Minimal under Appearance > Style in Hemma Studio. Minimal is a clean, flat look on a solid background in Gray, Sand, Sage, Blue or Rose, and each color has its own darker shade at night. Glass keeps your room photos. Popups, menus, notifications, the screensaver and Studio's preview all follow the style you pick.
- **Match Now Playing.** In Minimal, turn on Match Now Playing under Background and the dashboard takes its color from whatever is playing, going back to your Background color when nothing is.
- **Artwork Color.** With Match Now Playing on, the background blends your Background color with the artwork's, so the room keeps a hint of your color instead of jumping to the cover's.
- **Minimal's accent is a soft ink** instead of Home Assistant's blue, so switches, sliders and selections in Home Assistant's own dialogs match the dashboard.
- **The selected badge turns white** and its icon takes the category's color, teal for Climate, yellow for Lights, and so on.
- **Badges line up with the sidebar.** On a Mac they're the same height as the sidebar's Home pill, and every badge icon is the same size, with nothing clipped.
- **At night the toolbar, buttons and Now Playing sit a shade darker** than the background, recessed rather than lit, and the iPad's tab bar follows.
- **The media popup in Minimal takes one muted color from the artwork**, so each song or show tints it a little differently.
- **Badge text is a point smaller on Mac and iPad**, so the badges no longer outweigh the tiles.
- **Home Assistant's own screens follow Minimal.** Its sidebar is solid in your color, its header and Settings pages use dark text in light mode, and its notices, like a new frontend version, turn light.
- **No glass glow on taps in Minimal.** The iPad's tab bar answers by moving its selection, and the top right buttons dim for a moment; Glass keeps its glow.
- **Opening a dashboard on a new device starts in Minimal**, without a flash of Glass first.
- **Backdrop.** Minimal sits on your room photo with a soft blur, a gradient, or a flat color, and Light mode text chooses dark or white text by day.
- **Separate phone choices.** Phone backdrop and Phone light mode text let the phone use its own backdrop and text color, while Mac and iPad keep theirs.
- **At night the toolbar, tab bar, back buttons, badges and notification cards share one dark fill**, and off tiles, popups and notification cards are tuned for each text color so everything stays easy to read.
- **Minimal fixes:** the Energy tile's icon stays neutral until it's active, popup buttons are flat in light and dark, light-mode popups use dark icons, battery percentages are easier to read, and the tab bar and buttons on iPad no longer have a hairline edge.

### Dashboard

- **Glass in light mode can use dark text.** Set Light mode text to Dark in Hemma Studio and Glass lays a light wash over the photo with dark text, buttons and icons by day; at night it goes back to white.
- **Glass badges follow the text color.** With dark text they're a light pill with deeper icon colors that hold up on white; with white text, and at night, they're a translucent gray pill with softer colors.
- **Glass photos are sharper**, blurred just enough to keep text and tiles readable, so the rooms are easier to see. At night a soft lift keeps dark photos from turning black, and the grain over the photo is lighter.
- **Glass on phones fills the screen with the room photo.**
- **More room on Mac and iPad.** The side margins in Focus are narrower, so the greeting, badges and tiles sit closer to the left edge and the top right buttons closer to the right.
- **Category pages sit higher** when the sidebar is open, level with the toolbar.
- **The top right pill's edges match the tab bar's.**
- **The ... menu dims Now Playing** behind it, as Notifications do, so the two never stack.
- **Pages open at their final width with icons already drawn**, instead of resizing or filling in after they appear.
- **Badges no longer slide up and snap back** when a page's badge row rebuilds.
- **A selected badge's icon takes a deeper color**, so yellow and mint read clearly on the white pill.
- **On a Mac with the sidebar closed, a category page's back button sits below the clock** instead of on top of it.
- **On the iPad, content blurs as it scrolls under the top bar in Safari too.** With Minimal on a photo, it fades under blur alone, with no color tint.
- **A swipe up or down that starts on a scene tile scrolls the page.**

- **Glass badges on a Mac match Minimal's height**, 44 points like the sidebar's Home pill, with their text a point larger.
- **A new header on Mac and iPad.** The greeting sits beside a large weather reading with the condition and the day's high and low, and the badge row lines up on every page. On a Mac the date sits above the clock in the sidebar, with the greeting on the clock's line and the badges level with Home; the iPad leaves the date to its status bar.
- **A cleaner phone header.** In Minimal the date is gone, since your phone already shows it, the weather sits beside the bell, and everything below moves up. Long names shrink to fit one line.
- **Now Playing shows one tile on Home.** When more than one thing is playing, the Now Playing title gets an arrow that opens the Media page with everything. It works the same on every device, in both styles.
- **The Energy page is redrawn like Screen Time:** the day's total, stacked bars by device with an average line, Day, Week and Month, and a device list with each device's share. Tap a device to see it alone, tap a bar to read its hour, and long press a device for its details.
- **The Energy page on phones** puts the chart and its device list together in one Devices card, with a capsule Day, Week and Month control and All Devices at the right end of its row.
- **Notifications on phones blur the whole screen behind them**, like iPhone Notification Center, and the header stays in place.
- **Opening Notifications no longer hides the weather.**
- **Moving between categories on Mac and iPad is instant.** Only leaving Home slides the category page up.
- **On phones in Minimal, the badge row fades into the header** as you scroll, like everything else.
- **Tiles no longer slide in.** The dashboard appears at once, on first load and when you come back to it.
- **Now Playing's artwork crossfades** between tracks.
- **The iPad's status bar battery is dark in light mode**, like the time beside it.
- **Coming back to the Home Assistant app shows the dashboard as you left it**, with no blank screen, even when iOS has reloaded the app in the background.
- **The phone's weather condition is a little dimmer**, so the temperature leads.

### Screensavers

- **Three screensavers for wall-mounted iPads**, set up in Hemma Studio's Screensaver section, and colors that match your dashboard by day and at night.
- **Today** shows the date, a clock and the weather, plus a widget of your choice: your calendars, Home at a glance (locks, lights, inside temperature and notifications) or nothing. Whatever's playing takes the widget's place, with Play and Pause. Tap the weather for the week's forecast, or the notifications for the list; tapping a notification wakes the dashboard with it open.
- **Up Next.** With nothing left on today's calendar, the calendar on Today shows what's coming up instead, each event with its day.
- **Clock** fills the screen with one of two faces: Numerals, huge numbers in your Background color with the date in the corner, or Classic, with ticks out to the screen's rounded corners. Both take your Background colors, or the artwork's color while something plays, and have a smoothly sweeping second hand, a dark version at night, and a Now Playing pill that pops in while music plays.
- **Recently Added** shows your newest Plex posters over their backdrop, the current one centered with its title, then the episode (like S01E04 · Vibes Are Rancid) or the genre and year, then its runtime and when it was added.
- **Background** follows your dashboard's color, any of Hemma's colors, black, or the artwork of whatever's playing.
- **The screensavers follow light and dark mode.** When the dashboard switches, the screensaver eases into its day or night colors over a couple of seconds.
- **Slide or fade.** A new Transition setting slides each screensaver in from the right instead of fading when they take turns.
- **The screensaver comes back after a reload**, instead of leaving the iPad on the dashboard until it times out again.

### Popups

- **Popups for every tile.** Tapping a tile on desktop or tablet grows its popup out of the tile, and on phones it opens full screen and swipes down to close. Every kind of tile has its own popup: lights, climate, fans and air purifiers, humidifiers, locks, covers, vacuums, media, plants, energy, network, batteries, updates, cameras and Recently Added.
- **Lights.** A brightness capsule, your favorite colors and a color or white picker. A light group's list button opens every light in it, each with its own dimmer.
- **Climate.** A dial for the temperature, and Mode, Preset, Fan and Swing as labeled tiles. A climate group lists its rooms, and tapping a room's circle turns it on or off as the dashboard tile does.
- **Fans and air purifiers** have a speed control and labeled tiles for Power, Mode, Oscillation and Direction, so nothing changes on a single tap.
- **Humidifiers** have a level control and state and mode menus.
- **Covers.** A group's list button opens each cover with its own position bar.
- **Locks** list every lock in a group, and a lock reached through two integrations shows once.
- **Vacuums** read Ready on both the tile and the popup, and Send to Dock lines up with the corner buttons.
- **Media.** Artwork fills the popup, with 10-second skips for video and volume buttons for players without a volume level. Games from Steam and PlayStation show the game's own art.
- **Recently Added** swipes through your newest posters over a wash of their colors. Tapping a poster opens its details over the title's backdrop, and tapping it again goes back.
- **Cameras.** A Cameras section on Home, in each room and on the Security page, and a full-screen camera view with a timeline of today's motion and doorbell events. On phones the camera shrinks back onto its tile when you close it, and the tile keeps the last frame you watched.
- **Energy, network, battery and update popups** with clean, flat charts. Energy costs show cents at full size, and network rows color by direction.
- **New menus in popups.** On phones and tablets a menu grows out of its selector as glass and shrinks back into it; on desktop it appears at once and fades away. Menus stay centered on their selector and never cover the popup's main control.
- **Popup titles stay put when you scroll**, behind the same frosted veil on every popup.
- **Glass buttons in popups light up where you touch them**, like the dashboard's.
- **A full-screen player.** The expand button in a media popup opens the player full screen over the artwork's colors. Games show who's playing and how long the session has run, Plex shows who's watching, the device, the stream and the connection, and closing it shrinks the artwork back into its tile.
- **The Plex popup fits without scrolling** on every device.
- **The Updates popup on phones** matches the Mac and iPad, with Update All at the bottom.
- **Phone popups are sized like iPhone controls**: tall rounded sliders, the title and status in the same place on every popup, and smaller phones shrink the slider so nothing overlaps.
- **Plants.** A compact popup with the plant's readings, and an Assessment card that checks the last week of readings against the plant's needs using Home Assistant's AI Task and says what to do. Tap it and it grows over the readings to show the full advice. Choose the AI under AI for assessments in Hemma Studio; without one, the card stays hidden.
- **The Now Playing tile's shadow stays put** when its waveform turns on or off.
- **The full-screen player slides up cleanly in Safari**, without a half-drawn band at the bottom.

### Hemma Studio

- **Hemma Studio's Appearance settings are simpler.** Background picks the color and shows its light and dark shades side by side, Match Now Playing sits right under it, and Wallpaper (your room photos) only appears when the style uses photos. Studio's preview matches the dashboard in Minimal, including the one-tile Now Playing.
- **The screensaver's Preview button uses your settings**, so you can try each Background color from Studio.
- **Hemma Studio:** the line above the greeting can show the date and weather together, and on phones each Background color in the dropdown shows its day and night shades.
- **Studio's preview matches the dashboard more closely**: the Glass photo and its wash, the narrower margins, the Media count, the top right pill lined up with the tab bar, the weather line on the iPad, and Minimal Overview's columns.
- **Studio's preview matches the dashboard** in both styles: the back button beside a category's title, Climate's temperature, humidity and air quality row, the selected badge's color, and badges that keep their fill on hover.

### Everything else

- **Hide your own arrivals and departures.** Turn off My arrivals and departures under Notifications > Advanced in Hemma Studio and each person stops seeing notifications about themselves, including from a second account under the same name; everyone else's still show.
- **The phone follows your notification settings.** Studio's Notifications switches used to apply only on Mac and iPad; after a Save, the phone uses them too.
- **Battery icons match iOS 27's**, and a charging device shows the green battery with its bolt instead of a dimmed row.
- **The Media page on phones keeps Now Playing** when you switch to it from another category.
- **The notification count stays inside the iPad's button pill**, instead of being cut off at its top edge.
- **The Network popup's Reboot confirmation** reaches the bottom of the card on phones.
- **The Security badge counts the devices in its "One badge each" slots**, reading "1 Unlocked", "2 Open" or "3 Alerts". Hemma Studio adds Door or Window and Garage or Gate to the slot menu, and its preview words each device by its kind. On phones, the home-wide Security badge also counts door and window sensors that belong to a room. Reported by [@Eunanibus](https://github.com/Eunanibus) in [#92](https://github.com/willsanderson/Hemma/issues/92).
- **Hemma Studio checks button-card's version.** An older button-card loads but lays tiles out wrongly, so Studio now asks you to update it in HACS when it's older than 7.0.0. Reported by [@awildeone](https://github.com/awildeone) in [#93](https://github.com/willsanderson/Hemma/issues/93).
- **Status badges.** Show any device's state as a badge, like a robot vacuum that's Cleaning or a washer with 12 min left, on Home and on the rooms you choose. Each state gets its own color, icon and optional text, or hides the badge, and the wording comes from Home Assistant so it's already in your language. Set them up under Badges > Status in Hemma Studio. They're stored by the integration, so once your dashboard has been saved in Hemma after updating, a badge you add shows on every dashboard and device right away. Suggested by [@krazylenni](https://github.com/krazylenni) in [#88](https://github.com/willsanderson/Hemma/discussions/88).
- **Material Design Icons for Status badges.** When Hemma's icons don't have what you need, search the full Material Design set that Home Assistant already includes. They take the badge's color and size like Hemma's own icons.
- **Choose what a tap does on each tile.** A new Tap setting in each tile's settings in Hemma Studio: Normal, Ask First, which asks before a tap turns something on or off, locks or unlocks, or changes the temperature, or View Only, which shows the tile's state and ignores taps and holds. On desktop and tablet, Ask First's question grows out of the tile you tapped. Once you press Save it applies on every dashboard and device, so a phone or tablet you hand to someone else can't change things by accident. Suggested by [@aussielabber](https://github.com/aussielabber) in [#84](https://github.com/willsanderson/Hemma/issues/84).
- **Your own icons work as room icons.** Icons you add to `/config/www/hemma/icons/` now show in the dashboard's sidebar and in Hemma Studio, and Studio's room icon menu lists them under Your Icons. You can remove any workaround script you added for this. Reported by [@Eunanibus](https://github.com/Eunanibus) in [#91](https://github.com/willsanderson/Hemma/issues/91).
- **New icons:** washer, dryer, dishwasher, garage open and closed, status, and dining, which a room named Dining Room picks automatically.
- **The Security badge watches your locks** when you haven't chosen any, and a lock added through two integrations counts once.
- **An empty room page lists the room's devices.** A category page with nothing set, like a room's Climate page, now shows the devices Home Assistant has in that area, starting with the ones its badge sums up.
- **Status badges in a room's badge row match the other badges** in size and weight.
- **Studio's preview shows Motion and Occupancy as the dashboard does**, like "16 minutes ago", instead of Not Detected or a months-old time.
- **Hemma Studio on phones follows iOS sizing:** 17 pt text, taller rows, larger back and + buttons that match the dashboard's, and slightly tighter corners on the section cards.
- **The day and night photos in Appearance span the card**, lined up with the fields above them.
- **Swedish covers Status badges and the Tap setting.**
- **Adding a night photo no longer hides a room's photos.** Studio used to ask for a name and point the room at it, so typing anything other than the day photo's name left the room on a set with no day image: both slots went empty and the field said "not on disk". The night photo now always joins the room's current day photo without asking, and a room still on a demo photo is asked for a day photo first. The name prompt suggests the room's name instead of the demo photo's, so accepting it can't replace the demo photo for every other room, and names ending in -demo or -night are refused. A set with only a night photo now shows in the list as "no day image". Reported by [@Eunanibus](https://github.com/Eunanibus) in [#89](https://github.com/willsanderson/Hemma/issues/89).
- **Hemma Studio opens your Hemma dashboard in a new browser.** With nothing remembered, it picked the first dashboard in the list, such as Map, and said "This dashboard has no pages", and Save there would have written over it. Studio now reads each dashboard to find the one Hemma made, whatever it's called, and shows the welcome screen when there isn't one. Reported by [@Eunanibus](https://github.com/Eunanibus) in [#90](https://github.com/willsanderson/Hemma/issues/90).
- **Saving no longer silently overwrites changes made elsewhere.** If the dashboard was saved from another tab, another browser or Home Assistant's own editor after you opened it in Studio, Save now asks first: Replace those changes with yours, Reload to pick them up, or Cancel. Suggested by [@Eunanibus](https://github.com/Eunanibus) in [#89](https://github.com/willsanderson/Hemma/issues/89).
- **Studio remembers your dashboard across browsers.** The last dashboard you edited is kept with your Home Assistant user, so a new browser or device opens it too, not just the one you last used.
- **A remote for your TV in the media popup.** Players with a remote in Home Assistant get a remote button left of the controls: a touch area to swipe and tap like the Siri Remote (press and hold included), Play/Pause, Back, Home, power and volume. On an iPad it opens full screen, and on a Mac the touch area becomes a clickpad ring you click. The room pill switches between your TVs, each with its icon. It works with Apple TV, Roku, Android TV and Google TV, Samsung, Philips and Sony Bravia.
- **Apps and Speakers next to the media controls.** An Apple TV or TV lists its apps to open; Sonos speakers that can group show a speaker picker with a volume bar for each.
- **Long titles scroll** in the media popup, as they do on the Now Playing tile, and the 10-second buttons show "10" when the app skips ten seconds (YouTube) and plain arrows otherwise.
- **Menus fit the screen.** A long menu, like an Apple TV's apps, stays on screen and scrolls, and menus near the bottom of a popup open upward.
- **A lock tile reads "Door Open"** while a door sensor set for it is open, and its popup says so too.
- **Tapping a Status badge opens that device's popup**, sliding up, for lights, fans, purifiers, covers, locks, media, thermostats and vacuums.
- **Vacuums use orange**.
- **The room photo no longer loses its right side** when you come back to the Home Assistant app on an iPad.
- **Template names from 2.3 still work.** `hemma_popup_light`, `hemma_popup_energy`, `hemma_popup_network`, `hemma_popup_recently_added` and `hemma_climate_popup` were replaced by new popups; a dashboard that lists one directly now opens the new popup.

## 2.3.4

- **Hemma installs and updates its own theme.** The theme is still a normal Home Assistant theme in `/config/themes/hemma/`, but Hemma now writes it there on setup and replaces it on every update, so it can never fall behind the dashboard again. Don't edit that file: to make your own version, copy it and give the theme a new name. If your copy had changes, Hemma saves it once to `/config/hemma_backups/` and says so under Settings > Repairs. Repairs also tells you when the theme isn't loading, with the line to add to `configuration.yaml`.
- **Adding the integration links straight to setup.** The success message now has an Open Hemma link to create your dashboard, instead of leaving you to find Hemma in the sidebar.
- **Icons, fonts and demo room photos come with the integration.** New installs no longer copy `www/hemma/`, and HACS keeps these up to date with everything else. Hemma also registers its font stylesheet for you, and moves an existing one over. Your own room photos stay in `/config/www/hemma/rooms/` and still win over a demo photo with the same name. Keep that folder for now: dashboards you haven't saved since updating still read from it.
- **The phone dashboard no longer jumps up and down.** A row whose tiles were all hidden, such as a Favorites row with nothing to show, kept reappearing for half a second whenever any entity updated, pushing everything below it down and back. Reported by [@furiaceka87](https://github.com/furiaceka87) in [#87](https://github.com/willsanderson/Hemma/issues/87).
- **Now Playing opens and closes smoothly on Overview and on phones.** The page below eases into motion and settles gently instead of being shoved, and each tile fades in with a slight settle, its glass, tint and blur included, instead of being wiped in by the opening section. Press Save once in Hemma for the full fade; until then the tiles fade their contents and blur.

## 2.3.3

- **Hemma Studio no longer says UI eXtension is missing when it is only waiting to be added.** Downloading it in HACS is half the setup; Studio now tells you it still needs adding under Settings > Devices & services and links straight there, or says when it was added but failed to start. Reported by [@mauromortier](https://github.com/mauromortier) in [#85](https://github.com/willsanderson/Hemma/issues/85).
- **Choose the sidebar's icon color.** Pick any of Hemma's colors under Layout > Sidebar icons in Hemma Studio. The default is a slightly brighter Hemma teal, so the icons stand out against the sidebar's glass and still match the tiles and badges.
- **No more blurred band behind Notifications on phones.** The title uses the same soft text shadow as on tablets and desktops, and "No recent notifications" adds only a barely visible patch behind it.
- **Desktop notifications in dark mode diffuse what is behind them like macOS's**, so a bright tile under a card reads as a soft glow instead of a shape.
- **Notification cards and buttons have even edges on iPhones.** Their dark outline was a pixel heavier along the bottom and right; it is now the same all the way around.
- **Crisper notification edges on iPhones in light mode**, measured off iOS 27: a clear dark hairline down the sides that fades smoothly into the rounded corners, a bright line along the top and a brighter one along the bottom, on the cards and their buttons alike.
- **Stacked notifications show their count in a light gray pill in light mode**, as macOS does, instead of a dark circle.
- **Notification buttons match the cards on phones and tablets.** Show less, Clear and the top Clear button have the cards' soft glow and shadow instead of looking flat, and a group's name no longer shows a clipped box around its shadow.
- **Show less has a down arrow** matched to iOS 27's, resting on the text's baseline with the same spacing and text size, both Clear buttons are the same size, and the expanded top button reads Clear instead of Clear All.
- **The Notifications title on phones is bold**, matching tablets and desktops, at a size just above the group names.
- **A group's Show less and Clear buttons no longer shift as it opens.** They kept their glass during the animation instead of gaining it a moment after.
- **Notifications keep clear of the header on phones.** Opened after scrolling down, the panel's Clear button no longer touches the bottom of the header's frosted band.
- **The phone's top right pill has matching edges.** Its dark edge line was thicker on the left than the right on iPhones; both sides now match.
- **Clear All clears everything at once.** The notifications, the Notifications title and the Clear All button leave together, instead of the title waiting for the cards and the button briefly coming back. On phones, the page title and weather fade back in as they go, as one cross-fade.

## 2.3.2

- **New on Plex shows up in Notifications.** Movies and episodes added in the last three days appear with their poster, and tapping one opens Recently Added. Several stack into one Plex group. Turn it off with Recently Added in Hemma's notification settings.
- **Notification settings are in alphabetical order** in every language, and the Recently Added and Plants switches take Plex's orange and the plant tiles' green.
- **Notifications close once you clear the last one**, instead of leaving "No recent notifications" over the dashboard. That line now only appears when you open Notifications with nothing new.
- **Opening a notification clears it**.
- **With nothing new, the phone's title stays put.** Only the weather steps aside for the "No recent notifications" line; the title waits until there are notifications to show.
- **Swiping a notification reveals a glass Clear button**, styled like the notifications themselves. It grows out of the card's edge as you swipe, so the two never pass through each other, and it replaces the red button, whose color bled into the card beside it.
- **Custom cards work in the tile row.** A card added with Custom card showed [object Object] and ignored taps; it now draws and responds like it does on any dashboard. Reported by [@aussielabber](https://github.com/aussielabber) in [#84](https://github.com/willsanderson/Hemma/issues/84).
- **Motion and Occupancy show when they last saw someone**, like "11 hours ago", instead of Not Detected. The time comes from Home Assistant's history, so a restart doesn't reset it. On cameras it also reads the device's last-activity sensor, since Ring's motion event can stop updating.
- **Now Playing tiles on Overview share one height.** A source without playback controls matches the tiles that have them, even when the row wraps.
- **Now Playing slides in and out on Overview.** When something starts playing, the section opens and eases the rest of the page down, and it closes the same way when playback stops, instead of popping in and out.
- **Now Playing's title and artist sit closer together**, spaced like a lock screen player instead of drifting apart.
- **Discord games keep their artwork.** When the Discord integration briefly drops a game's image, the tile keeps showing the last one it had instead of going blank.
- **Now Playing is the same tile on every device.** Tablets use the desktop and phone tile instead of a smaller copy, and the space above and below the artwork now matches the space beside it.
- **Opening Notifications no longer dims the pill above it** on tablets.
- **No more white haze above the first notification** on phones and tablets. The blur behind the Notifications title reached into the top card and smeared it upward.
- **The tablet's nav bar keeps its dark edge on both ends.** Depending on the room names, Safari could drop the line on the right side.
- **The tablet's nav bar and top right pill catch a little more light** along their top and bottom edges, closer to the notifications' glass.
- **Swedish picks up the newest strings**, including the greetings, thanks to [@DewGew](https://github.com/DewGew) in [#83](https://github.com/willsanderson/Hemma/pull/83).

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

This release brings a new design to tablets and desktop: a sidebar, a page for each category, and a second layout, Overview. The tablet also picks up the phone's design, with the same badges, tiles and filter pages.

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

- **The skip buttons use rounded glyphs.** Previous and next were the triangle
  and bar from Material. Music players, the iOS now playing sheet and Control
  Center all use two rounded triangles with no bar, and Hemma's play and pause
  already came from that set, so the two of them stood out. They sit slightly
  smaller than play and pause and are nudged off
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
