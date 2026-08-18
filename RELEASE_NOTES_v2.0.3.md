# Hemma v2.0.3

A maintenance release on top of v2.0.2. No configuration changes are needed, but see [Upgrading](#upgrading) if you have customized the theme.

---

## Fixes

- **Mobile Scenes row was clipped to half the screen.** Set up from the commented example in `hemma_mobile.yaml.example`, the scenes strip rendered one chip and then cut off mid-screen, with empty space beside it. The row needed `full_width: true` on the card, which the example omitted, so it was placed in one of the two mobile grid columns and clipped at that column's edge rather than at the screen edge. `hemma_scene_row` is now registered in the row layout table alongside the weather, badge, header, sensor chip and Now Playing rows, so it spans both columns on its own. Reported by @SH1FT-W.
- **Scenes setup is much simpler.** Four separate requirements are gone. The row no longer needs `full_width: true`, the Scenes overlay builds its own contents so `room: Scenes` is all it takes, the section header derives its filter behaviour from `name: Scenes` instead of needing `mobile_filter_category: unfiltered`, and the instruction to add `room_scenes` to `input_select.hemma_mobile_filter` was wrong because that option already ships in `packages/hemma_helpers.yaml`. Scenes now looks like every other section: a template, a name, and your scene entities. Existing configurations keep working, since an explicit `full_width` or `sections:` still wins.
- **Energy group badge now highlights when expanded (desktop and tablet).** Tapping Energy opened its sub-badge row but left the group badge itself dark, unlike Climate, Lights, People and Security. Room cards point the Energy badge's `entity` at the room's power sensor so hold still opens that room's energy popup, and the badge's active-state check was reading that sensor rather than the expanded-row helper. It now reads the helper through a new `row_entity` variable on `hemma_badge_energy_group`, defaulting to `input_select.hemma_expanded_row`; the mobile filter row overrides it with `input_select.hemma_mobile_filter`. Mobile was unaffected and behaves as before.
- **Badge text sat too close to the right edge on tablet.** Right padding goes from 11px to 14px. This is the only change in the release you will see without looking for it.
- **Tablet badge sizing is tunable again.** The tablet breakpoint in `hemma_badge_base` hard-coded its icon size, height, padding and font size as `:host { ... !important }` inside each badge's shadow root, which beat the matching block in the theme, so the `badge-*-tablet` variables had no effect. Those four values now read the theme variables, keeping the previous numbers as fallbacks. `badge-gap-tablet`, `badge-col-gap-tablet` and `badge-btn-size-tablet` were never overridden and already worked.

## Theme

Because the four tablet variables were inert, their values in `themes/hemma/hemma.yaml` had drifted from what tablets actually rendered. They have been resynced:

| Variable | Was | Now |
|---|---|---|
| `badge-padding-tablet` | `4px 15px 4px 7px` | `7px 14px 8px 7px` |
| `badge-min-height-tablet` | `50px` | `40px` |
| `badge-icon-size-tablet` | `30px` | `26px` |
| `badge-font-size-tablet` | `15px` | `13px` |

On a stock install this changes nothing beyond the padding fix above.

New variable: `badge-media-pad-v-tablet` (default `7px`). The media badge's vertical padding is deliberately matched to the group badges' and was previously hard-coded, so changing the vertical values in `badge-padding-tablet` would silently desync it.

## Upgrading

`smart-row.js` and `filter-overlay.js` both changed. Bump the `?v=` cache buster on both entries in Settings > Dashboards > Resources, then hard refresh. The Companion app caches `/local/` for weeks, so without this the Scenes fix will not reach your phone.

Reload themes and hard refresh. A plain dashboard refresh is not enough for the theme change.

If you have customized any of the four tablet variables in a theme fork, check your tablet after upgrading. Those customizations were being ignored and will take effect for the first time.
