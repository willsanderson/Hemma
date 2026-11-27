const BUILD = (import.meta.url.match(/[?&]v=(\d+)/) || [])[1] || "";
let PVD = "";
const PV = (() => { try { const f = window.frameElement; return (f && f.dataset && f.dataset.hemmaPv) || ""; } catch (e) { return ""; } })();
const EMBED_C = `
  :host { --el-card: var(--edc, #424941) !important; --hv-panel: var(--edc, #424941) !important; --card-tint: var(--edc, #424941) !important; --pane: none !important; --g-blur: none !important; --g-rim: none !important; --ink: #fff !important; --ink-2: rgba(235,235,245,.6) !important; color-scheme: dark; }
  section.card { background: var(--edc, #424941) !important; border-radius: 14px !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
  section.card .row { min-height: 50px !important; }
  .band.detail .card.grouped > .subtitle.subtitle { text-transform: none !important; font-size: 15px !important; font-weight: 600 !important; letter-spacing: -.01em !important; color: rgba(235,235,245,.62) !important; }
  .sidehead.phonehead { text-transform: none !important; font-size: 15px !important; font-weight: 600 !important; letter-spacing: -.01em !important; color: rgba(235,235,245,.62) !important; }
  section.card .row > label { font-size: 16px !important; color: #fff !important; }
  section.card .row > input, section.card .combo input { font-size: 16px !important; color: rgba(235,235,245,.6) !important; }
  .band.detail .card .row > .combo.combo, .band.detail .card .row > div:not(.combo) > .combo.combo { background: transparent !important; box-shadow: none !important; }
  .detailbar { display: grid !important; grid-template-columns: 1fr auto 1fr !important; grid-template-rows: 44px !important; align-items: center !important; justify-items: stretch !important; height: auto !important; margin-bottom: 10px !important; column-gap: 8px; }
  .detailbar > .back { grid-column: 1 !important; grid-row: 1 !important; justify-self: start !important; height: 44px !important; }
  .detailbar > h3 { grid-column: 2 !important; grid-row: 1 !important; justify-self: center !important; }
  .detailbar > :not(.back):not(h3) { grid-column: 3 !important; grid-row: 1 !important; justify-self: end !important; }
  .detailbar .back { background: none !important; box-shadow: none !important; padding-left: 2px !important; height: 30px !important; color: rgba(235,235,245,.6) !important; font-weight: 500 !important; }
  .detailbar h3 { position: static !important; transform: none !important; width: auto !important; max-width: none !important; min-width: max-content !important; overflow: visible !important; text-overflow: clip !important; white-space: nowrap !important; flex: none !important; margin: 0 !important; text-align: center !important; font-size: 17px !important; line-height: 22px !important; font-weight: 600 !important; letter-spacing: -.01em !important; }
`;
const NP_MIN = "input_boolean.hemma_now_playing_minimized";
const PV_DEV = { desktop: [1440, 900, 22], tablet: [1180, 820, 18], phone: [393, 852, 55] };
const SECTIONS = [
  ["climate", "Climate", ["climate", "fan", "humidifier", "cover", "water_heater"]],
  ["lights", "Lights", ["light"]],
  ["media", "Media", ["media_player"]],
  ["security", "Security", ["camera", "lock", "alarm_control_panel"]],
  ["other", "Other", []],
];
const CATS = [["climate", "Climate", "fan"], ["lights", "Lights", "light"], ["people", "People", "person"], ["media", "Media", "media"], ["security", "Security", "lock-fill"], ["energy", "Energy", "energy"]];
const T = (k, en, v) => window._hemmaT ? window._hemmaT(k, en, v) : String(en).replace(/\{(\w+)\}/g, (m, p) => (v && p in v ? String(v[p]) : m));
const NPG = {
  pause: [14.6484, 19.3945, "M1.55859 19.3828L4.23047 19.3828C5.25 19.3828 5.78906 18.8438 5.78906 17.8125L5.78906 1.55859C5.78906 0.480469 5.25 0 4.23047 0L1.55859 0C0.539062 0 0 0.527344 0 1.55859L0 17.8125C0 18.8438 0.539062 19.3828 1.55859 19.3828ZM10.0781 19.3828L12.7383 19.3828C13.7695 19.3828 14.2969 18.8438 14.2969 17.8125L14.2969 1.55859C14.2969 0.480469 13.7695 0 12.7383 0L10.0781 0C9.04688 0 8.50781 0.527344 8.50781 1.55859L8.50781 17.8125C8.50781 18.8438 9.04688 19.3828 10.0781 19.3828Z"],
  play: [19.6289, 19.6992, "M2.13281 17.9766C2.13281 19.1367 2.80078 19.6875 3.59766 19.6875C3.94922 19.6875 4.3125 19.5703 4.67578 19.3828L18.3281 11.4023C19.3008 10.8398 19.6289 10.4531 19.6289 9.84375C19.6289 9.22266 19.3008 8.84766 18.3281 8.28516L4.67578 0.304688C4.3125 0.105469 3.94922 0 3.59766 0C2.80078 0 2.13281 0.550781 2.13281 1.71094Z"],
  next: [30.91, 17.43, "M3.253 2.324L3.253 15.105Q3.253 16.964 4.86 16.028L15.822 9.65Q17.429 8.714 15.822 7.779L4.86 1.4Q3.253 0.465 3.253 2.324ZM16.267 2.324L16.267 15.105Q16.267 16.964 17.874 16.028L28.835 9.65Q30.442 8.714 28.835 7.779L17.874 1.4Q16.267 0.465 16.267 2.324Z"],
  prev: [30.91, 17.43, "M27.653 2.324L27.653 15.105Q27.653 16.964 26.046 16.028L15.085 9.65Q13.478 8.714 15.085 7.779L26.046 1.4Q27.653 0.465 27.653 2.324ZM14.64 2.324L14.64 15.105Q14.64 16.964 13.033 16.028L2.072 9.65Q0.465 8.714 2.072 7.779L13.033 1.4Q14.64 0.465 14.64 2.324Z"],
};
const npg = (k) => { const [w, h, d] = NPG[k]; return `<svg viewBox="0 0 ${w} ${h}" style="height:${k === "prev" || k === "next" ? 14.4 : (20 * h / 19.3945).toFixed(2)}px;aspect-ratio:${w}/${h}" aria-hidden="true"><path d="${d}"/></svg>`; };
const ELIST = `
:host { --el-card: rgba(255,255,255,.09); --el-sep: rgba(255,255,255,.12); --el-2: rgba(235,235,245,.6); --el-1: #fff; --el-acc: #5ad8e6; }
:host(.is-light) { --el-card: rgba(255,255,255,.42); --el-sep: rgba(60,60,67,.16); --el-2: rgba(60,60,67,.6); --el-1: #000; --el-acc: #0a84b0; }
:host(.hvbg) { --el-card: var(--hv-panel, rgba(255,255,255,.1)); --el-acc: color-mix(in oklab, #5ad8e6 55%, #fff); }
.band.detail .card .row .combo.hasdot > input { padding-left: 22px !important; }
.band.detail .card .row .combo.hasdot2 > input { padding-left: 38px !important; }
.band.detail .card .row .combo.hasdot > .cdot.lead { left: 0 !important; }
.band.detail .card .row .combo.hasdot2 > .cdot.lead.dk { left: 16px !important; }
.band.detail .col { background: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; box-shadow: none !important; padding: 0 !important; clip-path: none !important; border-radius: 0 !important; }
.band.detail .col::before, .band.detail .col::after { display: none !important; }
.col.badgecol > section.card:not([data-bid]) { order: 1; }
.band.detail .card .adv { margin: 0 !important; padding: 0 !important; position: relative; }
.band.detail .card .adv::before { content: ""; position: absolute; top: 0; left: 10px; right: 10px; height: .5px; background: var(--el-sep); }
.band.detail .card .advsum { display: flex !important; align-items: center; gap: 6px; width: 100%; min-height: 44px; padding: 0 10px !important; margin: 0 !important; box-sizing: border-box; font-size: 14px !important; font-weight: 400 !important; color: var(--el-2) !important; background: none !important; }
.band.detail .card .advsum .advplus { margin-left: auto !important; width: 26px !important; height: 26px !important; flex: none !important; }
.band.detail .card.grouped > .adv { margin-top: 10px !important; background: var(--el-card); border-radius: 12px; overflow: hidden; }
.band.detail .card.grouped > .adv::before { display: none; }
.band.detail .card.sel { background: none !important; padding: 0 !important; box-shadow: none !important; border: 0 !important; }
.band.detail .card.sel:not(.grouped) { background: var(--el-card) !important; border-radius: 22px !important; overflow: hidden; }
.band.detail .card.grouped > .subcard { background: var(--el-card) !important; border: 0 !important; box-shadow: none !important; border-radius: 22px !important; margin: 0 !important; padding: 0 !important; overflow: hidden; }
.band.detail .card.grouped > .subtitle { margin: 22px 16px 7px !important; padding: 0 !important; font-size: 12px !important; font-weight: 600 !important; letter-spacing: .04em; text-transform: uppercase; color: var(--el-2) !important; }
.band.detail .card .row { position: relative; display: flex !important; align-items: center !important; gap: 12px; min-height: 48px; padding: 0 16px !important; margin: 0 !important; border: 0 !important; box-sizing: border-box; }
.band.detail .card .row::before { display: none; }
.band.detail .card .row[style*="display: none"], .band.detail .card .row[style*="display:none"] { display: none !important; }
:host(.is-light) .gmenu.mac:not(.hv) { background: rgba(255,255,255,.62); box-shadow: 0 0 0 .5px rgba(0,0,0,.18), 0 10px 30px -8px rgba(0,0,0,.25); }
:host(.is-light) .gmenu.mac:not(.hv) button { color: #1c1c1e; }
:host(.is-light) .gmenu.mac:not(.hv) button.on::before { background: currentColor; }
.gmenu.mac:not(.hv) button.hl { color: #fff; }
.band.detail .card .row + .row::before, .band.detail .card .row + .shots + .row::before { display: block; content: ""; position: absolute; top: 0; left: 16px; right: 0; height: .5px; background: var(--el-sep); }
.band.detail .card .row > label { flex: 1 1 auto; min-width: 0; margin: 0 !important; align-self: center !important; padding: 0 !important; font-size: 15px !important; font-weight: 400 !important; color: var(--el-1) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.band.detail .card .row > .drop { display: none !important; }
.band.detail .card .row > .combo, .band.detail .card .row > div:not(.combo):has(> .combo), .band.detail .card .row > input { flex: 0 1 56%; min-width: 0; width: auto !important; }
.band.detail .card .row .combo > input, .band.detail .card .row > input { height: 40px !important; min-height: 0 !important; background-color: transparent !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; text-align: right; font-size: 15px !important; color: var(--el-2) !important; padding: 0 19px 0 0 !important; }
.band.detail .card .row .combo::after { right: 0 !important; }
.band.detail .card .row > input { padding-right: 0 !important; }
.band.detail .card .row > .combo:not(.hasent), .band.detail .card .row > div:not(.combo):has(> .combo) { flex: 0 1 auto; max-width: 64%; }
.band.detail .card .row > div:not(.combo) > .combo { width: auto !important; }
.band.detail .card .row .combo:not(.hasent) > input { field-sizing: content; width: auto !important; min-width: 48px; max-width: 100%; }
.band.detail .card .row.lst > label { display: none; }
.band.detail .card .row.lst > .combo.hasent { flex: 1 1 auto; }
.band.detail .card .row:not(.lst) > .combo.hasent { flex: 0 1 60%; }
.band.detail .card .row:not(.lst) > .combo.hasent > .entglyph { display: none !important; }
.band.detail .card .row:not(.lst) > .combo.hasent > input { padding-left: 0 !important; text-align: right !important; color: var(--el-2) !important; }
.band.detail .card .row.lst > .combo.hasent > input { text-align: left; color: var(--el-1) !important; padding-left: 36px !important; }
.band.detail .card .row > .combo.hasent > .entglyph { left: 0 !important; }
.band.detail .card .row > .sw { flex: none; margin: 0 !important; }
.band.detail .card .colorfield { background: transparent !important; box-shadow: none !important; border: 0 !important; color: var(--el-2) !important; font-size: 15px !important; padding-right: 0 !important; }
.band.detail .card .addrow { all: unset; box-sizing: border-box; position: relative; display: flex !important; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 0 16px; font-size: 15px; color: var(--el-acc); cursor: pointer; }
.band.detail .card .addrow i { flex: none; width: 20px; height: 20px; background: currentColor; -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 4.5v3.5h3.5v2H11v3.5H9V11H5.5V9H9V5.5z' fill='black'/%3E%3C/svg%3E") center/contain no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 4.5v3.5h3.5v2H11v3.5H9V11H5.5V9H9V5.5z' fill='black'/%3E%3C/svg%3E") center/contain no-repeat; }
.band.detail .card .addrow:hover { background: rgba(127,127,127,.08); }
.band.detail .card .addrow::before { content: ""; position: absolute; top: 0; left: 16px; right: 0; height: .5px; background: var(--el-sep); }
.band.detail .card .shots { padding: 14px 16px 6px !important; margin: 0 !important; }
.band.detail .card .shot .cap { color: var(--el-2) !important; font-size: 12.5px !important; }
.phonepanel .chead h2, .grouprow .chead h2, .badgecol .card .chead h2 { font-size: 15px !important; font-weight: 400 !important; }
.tilegrid .tile .thead .grow, .sortstrip .bandtog { font-size: 15px !important; font-weight: 400 !important; }
.band.detail .card .row:has(> .chipwrap) { flex-wrap: wrap; row-gap: 8px; padding: 12px 16px !important; }
.band.detail .card .row:has(> .chipwrap) > label { flex: 1 1 100%; }
.band.detail .card .row > .chipwrap { flex: 1 1 100%; max-width: 100%; }
.phonelist > h2.sidehead:not(:first-of-type) { font-size: 12px !important; font-weight: 600 !important; letter-spacing: .04em; text-transform: uppercase; }
.detailbar .back { font-size: 15px !important; }
.detailbar > h3 { font-size: 16px !important; }
.col.phonepanel, .band.detail .card.sel:not(.grouped), .band.detail .card.grouped > .subcard { border-radius: 12px !important; }
.col.phonepanel { clip-path: inset(0 round 12px) !important; }
.band.detail .col.phonepanel { clip-path: none !important; }
.band.detail .card.grouped > .subcard + .subcard { margin-top: 10px !important; }
.band.detail .card.grouped > .subtitle { margin: 20px 10px 8px !important; font-size: 13px !important; font-weight: 700 !important; letter-spacing: 0; text-transform: none; color: var(--el-1) !important; }
.band.detail .card .row { min-height: 44px; padding: 0 10px !important; gap: 10px; }
.band.detail .card .row + .row::before, .band.detail .card .row + .shots + .row::before, .band.detail .card .addrow::before { left: 10px !important; right: 10px !important; }
.band.detail .card .row > label, .band.detail .card .colorfield, .band.detail .card .colorfield .clabel { font-size: 14px !important; }
.band.detail .card .row .combo > input, .band.detail .card .row > input { height: 30px !important; font-size: 14px !important; color: var(--el-1) !important; }
@media (hover: hover) and (pointer: fine) {
  :host { --el-btn: rgba(255,255,255,.13); }
  :host(.is-light) { --el-btn: rgba(0,0,0,.06); }
  .band.detail .card .row > .combo:not(.hasent), .band.detail .card .row > div:not(.combo) > .combo { height: 26px; border-radius: 7px; background: var(--el-btn) !important; }
  .band.detail .card .row > .combo:not(.hasent) > input, .band.detail .card .row > div:not(.combo) > .combo > input { height: 26px !important; padding: 0 24px 0 10px !important; text-align: left; }
  .band.detail .card .row > .combo:not(.hasent)::after, .band.detail .card .row > div:not(.combo) > .combo::after { right: 7px !important; }
  .band.detail .card .row .combo.hasdot > input { padding-left: 30px !important; }
  .band.detail .card .row .combo.hasdot2 > input { padding-left: 46px !important; }
  .band.detail .card .row .combo.hasdot > .cdot.lead { left: 8px !important; }
  .band.detail .card .row .combo.hasdot2 > .cdot.lead.dk { left: 24px !important; }
}
.band.detail .card .row.lst > .combo.hasent > input { padding-left: 30px !important; }
.band.detail .card .row > .combo.hasent > .entglyph { top: 50% !important; bottom: auto !important; margin: 0 !important; transform: translateY(-50%) scale(.85) !important; transform-origin: left center; }
.band.detail .card .addrow { min-height: 44px; padding: 0 10px; font-size: 14px; gap: 13px; }
.band.detail .card .addrow i { width: 17px; height: 17px; }
.band.detail .card .row:has(> .chipwrap) { padding: 11px 10px !important; }
.band.detail .card .shots { padding: 12px 10px 34px !important; }
.band.detail .card .sw { width: 38px !important; height: 22px !important; flex: 0 0 38px !important; }
.band.detail .card .sw::after { top: 2px !important; left: 2px !important; width: 22px !important; height: 18px !important; }
.band.detail .card .sw[aria-checked="true"]::after { transform: translateX(12px) !important; }
.phonepanel .chead h2, .grouprow .chead h2, .badgecol .card .chead h2, .tilegrid .tile .thead .grow, .sortstrip .bandtog { font-size: 14px !important; }
@media (pointer: coarse) {
  .col.phonepanel, .band.detail .card.sel:not(.grouped), .band.detail .card.grouped > .subcard { border-radius: 14px !important; }
  .col.phonepanel { clip-path: inset(0 round 14px) !important; }
  .band.detail .col.phonepanel { clip-path: none !important; }
  .band.detail .card .row, .band.detail .card .addrow { min-height: 44px; padding: 0 14px !important; }
  .band.detail .card .row + .row::before, .band.detail .card .row + .shots + .row::before, .band.detail .card .addrow::before { left: 14px !important; right: 14px !important; }
  .band.detail .card .row > label, .band.detail .card .row .combo > input, .band.detail .card .row > input, .band.detail .card .colorfield, .band.detail .card .addrow, .band.detail .card.grouped > .subtitle { font-size: 15px !important; }
  .band.detail .card.grouped > .subtitle { margin: 20px 14px 8px !important; }
  .band.detail .card .sw { width: 50px !important; height: 30px !important; flex: 0 0 50px !important; }
  .band.detail .card .sw::after { width: 32px !important; height: 26px !important; }
  .band.detail .card .sw[aria-checked="true"]::after { transform: translateX(14px) !important; }
  .phonepanel .chead h2, .grouprow .chead h2, .badgecol .card .chead h2, .tilegrid .tile .thead .grow, .sortstrip .bandtog { font-size: 15px !important; }
}
`;
const TAB_SVG = '<svg viewBox="0 0 24 19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.2" y="1.2" width="21.6" height="16.6" rx="4.5"/><path d="M8.6 1.2v16.6"/></svg>';
const EN_WIDE = `
  :host { padding: 0 !important; }
  .cat-cards.en-row { grid-template-columns: repeat(auto-fit, minmax(min(100%, 430px), 1fr)); gap: 10px; align-items: stretch; max-width: 1250px; }
  .cat-cards.en-row > .cat-en:first-child { border-radius: 26px; padding-bottom: 16px; }
  .cat-cards.en-row > .cat-en:first-child .lgs { display: grid; }
  .cat-cards.en-row > .cat-en + .cat-en { border-radius: 26px; padding-top: 18px; }
  .cat-cards.en-row > .cat-en + .cat-en > .k { display: flex; }
  .cat-cards.en-row > .cat-en + .cat-en > .sub { display: block; }
  .cat-cards.en-row > .cat-en + .cat-en > :is(.split, .foot) { display: flex; }
  .cat-cards.en-row > .cat-en + .cat-en .dvs { overflow-y: auto; }
`;
const HPIN = `url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M12.6 2.4a1 1 0 0 1 1.5 0l3.5 3.5a1 1 0 0 1 0 1.5l-2.3 1.2-2.6 2.6.3 3.2a1 1 0 0 1-1.7.8l-2.6-2.6-4.2 4.2a.7.7 0 0 1-1-1l4.2-4.2-2.6-2.6a1 1 0 0 1 .8-1.7l3.2.3 2.6-2.6z"/></svg>')}')`;
const HCLK = `url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="black" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7.2"/><path d="M10 5.8V10l2.8 1.8"/></svg>')}')`;
const CHEV = `url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 15"><path d="M1.5 1.5 7.5 7.5 1.5 13.5" fill="none" stroke="black" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>')}')`;
const PLUS = `url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path d="M9 3v12M3 9h12" fill="none" stroke="black" stroke-width="2.2" stroke-linecap="round"/></svg>')}')`;
const TOGGLE = ["light", "switch", "fan", "input_boolean", "humidifier", "cover", "lock"];
const PANELS = { light: "light", cover: "cover", fan: "fan", climate: "thermostat", humidifier: "humidifier", lock: "lock", plant: "plant", media_player: "media", vacuum: "vacuum" };
const TEAL = "var(--hemma-color-teal, #00C3D0)", YEL = "var(--hemma-color-yellow, #FFCC00)";
const FALLBACK_C = "var(--hemma-icon-fallback-color, rgba(255,255,255,0.95))";
const ON_COLOR = { light: YEL, fan: TEAL, humidifier: TEAL, climate: TEAL, vacuum: "var(--hemma-badge-vacuum-color, var(--hemma-color-orange, #FF9230))", cover: TEAL, media_player: TEAL, lock: TEAL, plant: YEL };
const domainOf = (id) => String(id).split(".")[0];
const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PH = (u) => (window.hemmaPhotoUrl ? window.hemmaPhotoUrl(u) : u);
const escU = (t) => esc(String(t == null ? "" : t).replace(/['"()\\]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()));

const DOTS = `url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><circle cx="3.5" cy="9" r="1.7"/><circle cx="9" cy="9" r="1.7"/><circle cx="14.5" cy="9" r="1.7"/></svg>')}')`;
const SPR = "linear(0, 0.03, 0.103, 0.195, 0.294, 0.391, 0.482, 0.565, 0.637, 0.7, 0.753, 0.799, 0.837, 0.868, 0.894, 0.915, 0.933, 0.947, 0.958, 0.968, 0.975, 0.981, 0.986, 0.99, 0.993, 0.995, 0.997, 0.999, 1)";
const CSS = `
  :host { position: fixed; inset: 0; z-index: 50; display: block; color: #fff; font: 15px/1.25 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  .page { position: absolute; inset: 0; display: grid; grid-template-columns: 264px 1fr; }
  .bdl { position: absolute; inset: 0; pointer-events: none; background-color: var(--hvbg); background-image: var(--bd); background-size: 100% 100%; }
  :host { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  input, textarea, [contenteditable] { -webkit-user-select: text; user-select: text; }
  :host(.glass) .bdl { overflow: hidden; background-image: none; background-color: #2c2a27; isolation: isolate; z-index: 0; }
  :host(.glass.gd) .bdl { background-color: #d8d3ca; }
  :host(.glass) .bdl::before { content: ""; position: absolute; inset: -4%; background-image: linear-gradient(rgba(55,55,55,.5), rgba(55,55,55,.5)), var(--gph, none); background-size: 100% 100%, cover; background-position: 0 0, 50% 50%; background-repeat: no-repeat; filter: saturate(1.02) brightness(.985); }
  :host(.glass) .bdl::after { display: block; content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(55,55,55,.5), rgba(55,55,55,.5)), var(--gpg, none); background-size: 100% 100%, cover; background-position: 0 0, 50% 50%; background-repeat: no-repeat; filter: blur(7px) saturate(1.02) brightness(.985); z-index: 0; }
  :host(.glass) .bdl::before { z-index: 1; clip-path: inset(0 0 0 calc(264px + 3.7037%)); }
  :host(.glass.gd) .bdl::after { background-image: linear-gradient(rgba(250,248,244,.34) 0%, rgba(250,248,244,.16) 45%, rgba(250,248,244,.26) 100%), var(--gpg, none); }
  :host(.grain) .bdl::after { content: ""; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3CfeColorMatrix values=%221 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0.03%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E"); background-size: 160px 160px; }
  .side { padding: 46px 10px 24px; background: var(--solid); overflow-y: auto; }
  .side .clock { padding: 0 12px; margin-bottom: 22px; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
  .side .hd { display: flex; align-items: center; justify-content: space-between; height: 39px; padding: 0 12px; font-size: 14px; font-weight: 600; color: rgba(235,235,245,0.74); }
  .side .hd i { width: 12px; height: 12px; opacity: .8; background: currentColor; -webkit-mask: var(--chev) center/contain no-repeat; mask: var(--chev) center/contain no-repeat; }
  .side button { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 12px; width: 100%; height: 44px; padding: 0 12px; border-radius: 22px; font-size: 16px; font-weight: 600; cursor: pointer; }
  .side button.on { background: rgba(255,255,255,0.14); }
  .side button + button { margin-top: 4px; }
  .side button > span:not(.sm) { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .side .sm { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,0.35); opacity: 0; transform: scale(.5); transition: opacity .4s cubic-bezier(.34,1.56,.64,1), transform .4s cubic-bezier(.34,1.56,.64,1); }
  .side .sm.on { opacity: 1; transform: none; }
  .side .sm img { height: 14px; }
  .side button i, .bd i, .back i, .pill i { flex: none; width: 26px; height: 26px; background: currentColor; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .col { position: relative; min-width: 0; overflow: hidden; }
  .main { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; padding: 38px 22px 60px 15px; }
  .hdr .vb { display: none; }
  .hdr { position: absolute; left: 0; right: 0; top: 0; height: 125px; pointer-events: none; z-index: 4; }
  .hdr .veil { position: absolute; inset: 0; background: var(--veil); opacity: 0; transition: opacity .22s ease-in-out; }
  :host(.glass) .hdr .veil { background: none; box-sizing: border-box; border-bottom: .5px solid rgba(255,255,255,.1); -webkit-backdrop-filter: blur(22px) saturate(1.2) brightness(.97); backdrop-filter: blur(22px) saturate(1.2) brightness(.97); }
  :host(.glass) .hdr .veil::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 11px; background: linear-gradient(rgba(18,20,26,.025), rgba(18,20,26,0)); }
  :host(.glass.gd) .hdr .veil { border-bottom-color: rgba(0,0,0,.08); }
  :host(.glass:not(.ph):not(.tab)) .hdr .veil { bottom: auto; height: 100px; }
  .bdx { pointer-events: none; }
  .main.prev { pointer-events: none; }
  .ovblur { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: var(--hv-ov-bg, rgba(0,0,0,0.22)); -webkit-backdrop-filter: var(--hv-ov-bf, blur(40px)); backdrop-filter: var(--hv-ov-bf, blur(40px)); }
  .t { transition: background-color .4s ease; }
  .t .ic { transition: background-color .3s ease; }
  .t b, .t .tx > span { transition: color .18s ease; }
  .sc { transition: background-color .45s ease, color .45s ease; }
  .sc i { transition: background-color .45s ease; }
  .chip { transition: background-color .2s ease; }
  .chip b, .chip span { transition: color .2s ease; }
  .chip i { transition: background-color .2s ease; }
  .hdr .back { position: absolute; left: 15px; top: 38px; pointer-events: auto; }
  .hdr .pill { position: absolute; right: 9px; top: 38px; pointer-events: auto; }
  .hdr .mini { position: absolute; left: 73px; top: 45px; font-size: 22px; font-weight: 600; line-height: 30px; opacity: 0; transition: opacity .2s ease; white-space: nowrap; }
  .col.scrolled .veil, .col.scrolled .mini { opacity: 1; }
  .top h1 { margin-left: 58px; min-height: 44px; display: flex; align-items: center; }
  .top { display: flex; align-items: center; gap: 14px; }
  .back { all: unset; flex: none; width: 44px; height: 44px; border-radius: 22px; display: grid; place-items: center; background: rgba(255,255,255,0.2); cursor: pointer; }
  .back svg { width: 12px; height: 20px; display: block; margin-right: 3px; }
  h1 { flex: 1; margin: 0; font-size: 40px; font-weight: 700; letter-spacing: 0.4px; }
  .pill { display: flex; align-items: center; height: 44px; border-radius: 22px; background: rgba(255,255,255,0.2); }
  .pill button { all: unset; width: 44px; height: 44px; display: grid; place-items: center; cursor: pointer; }
  .pill i { width: 20px; height: 20px; }
  .pill s { width: 1px; height: 22px; background: rgba(255,255,255,0.3); }
  .pill .nb { position: relative; }
  .pill .bc { position: absolute; left: 23px; top: 7px; display: none; place-items: center; min-width: 13px; height: 13px; padding: 0 3px; box-sizing: border-box; border-radius: 999px; background: var(--hemma-bell-badge, #ff4245); color: var(--hemma-bell-badge-ink, #fff); font: 600 9px/9px -apple-system, system-ui, sans-serif; letter-spacing: -0.09px; font-variant-numeric: tabular-nums; box-shadow: var(--hemma-bell-badge-ring, none); }
  .pill .bc.on { display: grid; }
  :host(:not(.glass)) .pill .bc { box-shadow: 0 0 0 1px color-mix(in srgb, #fff 20%, var(--hvbg)); }
  .bd[data-ent], .bd[data-mi], .bd[data-lt] { cursor: pointer; }
  .bd[data-lt] { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .bd[data-ent]:focus-visible, .bd[data-mi]:focus-visible, .bd[data-lt]:focus-visible { outline: 2px solid rgba(255,255,255,.6); outline-offset: 3px; border-radius: 12px; }
  .mwrap { position: fixed; inset: 0; z-index: 70; pointer-events: none; }
  :host(.edit) .side .hd i { display: none; }
  .side .hd .hp { all: unset; box-sizing: border-box; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,.16); cursor: pointer; }
  .side .hd { box-sizing: border-box; width: 244px !important; margin-left: 10px; margin-right: 10px; }
  .side .hd .hp::before { content: ""; width: 11px; height: 11px; background: #fff; -webkit-mask: ${PLUS} center/contain no-repeat; mask: ${PLUS} center/contain no-repeat; }
  .side .hd .hp:focus-visible, .side .rd:focus-visible { box-shadow: 0 0 0 2px rgba(255,255,255,.6); }
  :host(.edit) .side .sm { display: none; }
  .side button[data-room] .rd { flex: none; margin-left: auto; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.16); opacity: 0; transition: opacity .18s ease; }
  .side button[data-room] .rd::before { content: ""; width: 15px; height: 15px; background: #fff; -webkit-mask: ${DOTS} center/contain no-repeat; mask: ${DOTS} center/contain no-repeat; }
  .side button[data-room]:hover .rd, .side button[data-room]:focus-visible .rd, .side .rd:focus-visible, .side .rd.open { opacity: 1; }
  :host(.tab) .side button[data-room] .rd { opacity: 1; }
  @media (hover: none) { .side button[data-room] .rd { opacity: 1; } }
  .side button[data-room] .rn { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .side button.renaming .rn { visibility: hidden; }
  :host(.edit) .side button[data-room]:not(.slot):not(.renaming) { animation: sjig .3s ease-in-out infinite alternate; }
  :host(.edit) .side button[data-room]:nth-of-type(2n) { animation-delay: -.15s; animation-direction: alternate-reverse; }
  @keyframes sjig { from { rotate: -0.35deg; } to { rotate: 0.35deg; } }
  @media (prefers-reduced-motion: reduce) { :host(.edit) .side button[data-room] { animation: none !important; } }
  .side button.slot { opacity: .32; }
  .sghost { position: fixed; z-index: 60; margin: 0; border: 0; outline: 0; -webkit-appearance: none; appearance: none; font-family: inherit; text-align: left; pointer-events: none; display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 12px; border-radius: 22px; box-sizing: border-box; font-size: 16px; font-weight: 600; color: #fff; background: linear-gradient(rgba(255,255,255,.16), rgba(255,255,255,.16)), var(--hvbg); box-shadow: 0 14px 32px rgba(0,0,0,.3); animation: none !important; }
  .sghost .rd, .sghost .sm { display: none; }
  .sghost i { flex: none; width: 26px; height: 26px; background: currentColor; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .ren { position: fixed; z-index: 70; box-sizing: border-box; height: 32px; padding: 0 9px; border: 0; border-radius: 9px; outline: none; background: rgba(0,0,0,.25); box-shadow: inset 0 0 0 1.5px var(--hemma-color-orange, #FF9230); color: #fff; letter-spacing: -0.01em; }
  .mnu hr { border: 0; height: .5px; margin: 5px 8px; background: rgba(255,255,255,.16); }
  .mnu button.red { color: #FF6961; }
  .mnu.pop2 { position: fixed; z-index: 75; }
  .mnu.icp { width: 292px; padding: 12px; }
  .mnu.icp .pt { display: block; margin: 0 2px 10px; font-size: 14px; font-weight: 600; }
  .mnu .icg { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; max-height: 260px; overflow-y: auto; }
  .mnu .ic2 { all: unset; box-sizing: border-box; aspect-ratio: 1; border-radius: 10px; display: grid; place-items: center; background: rgba(255,255,255,.1); cursor: pointer; }
  .mnu .ic2 i { width: 22px; height: 22px; background: #fff; -webkit-mask: var(--g) center/contain no-repeat; mask: var(--g) center/contain no-repeat; }
  .mnu .ic2:hover, .mnu .ic2:focus-visible { background: rgba(255,255,255,.2); }
  .mnu .ic2.on { background: #fff; }
  .mnu .ic2.on i { background: #1c1c1e; }
  .mnu { position: fixed; z-index: 71; min-width: 190px; padding: 5px; border-radius: 14px; display: flex; flex-direction: column; color: #fff; background: rgba(118,118,128,.34); -webkit-backdrop-filter: blur(30px) saturate(1.8); backdrop-filter: blur(30px) saturate(1.8); box-shadow: 0 10px 30px rgba(0,0,0,.24), inset 0 0 0 .5px rgba(255,255,255,.22); }
  .mnu.flat { background: color-mix(in oklab, var(--hvbg) 80%, #fff); -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: 0 8px 24px rgba(0,0,0,.18), inset 0 0 0 .5px rgba(255,255,255,.12); }
  .mnu button { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; height: 32px; padding: 0 12px 0 10px; border-radius: 9px; font-size: 15px; font-weight: 400; letter-spacing: -.1px; white-space: nowrap; cursor: default; }
  .mnu button:hover, .mnu button:focus-visible { background: rgba(255,255,255,.14); }
  .mnu .mi { display: grid; place-items: center; width: 18px; height: 18px; }
  .mnu .mi svg { width: 16px; height: 16px; }
  .mnu.mm { min-width: 0; width: max-content; padding: 6px; border-radius: 16px; }
  .mnu.mm button { gap: 14px; height: 38px; padding: 0 18px 0 12px; }
  .mnu.mm .mi { width: 20px; height: 20px; }
  :host(:not(.lt)) .mnu.mm.flat { background: color-mix(in oklab, var(--hvbg) 90%, #fff); box-shadow: 0 10px 26px -12px rgba(0,0,0,.26), 0 3px 8px -5px rgba(0,0,0,.14), inset 0 0 0 .5px rgba(255,255,255,.12); }
  :host(.night:not(.lt)) .mnu.mm.flat { background: color-mix(in oklab, var(--hvbg) 46%, rgb(18 18 20)); }
  :host(:not(.lt):not(.night)) .mnu.mm.flat { background: color-mix(in oklab, var(--hvbg) 80%, #fff); }
  :host(:not(.lt)) .mnu.mm.flat button:hover, :host(:not(.lt)) .mnu.mm.flat button:focus-visible { background: var(--hv-nav-active, rgba(255,255,255,.16)); }
  .pill .more.busy i { animation: edbusy .9s ease-in-out infinite; }
  @keyframes edbusy { 50% { opacity: .35; } }
  .pill .more.held { background: none; }
  .nav .scn i { transition: transform .32s cubic-bezier(.32,.72,0,1); }
  .nav .scn.held i { transform: rotate(90deg); }
  @media (prefers-reduced-motion: reduce) { .nav .scn i { transition: none; } }
  .hasb { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.28); }

  :host(.edit:not(.ph)) .main { padding-right: 438px; }
  :host(.edit:not(.ph)) .main .scs { margin-right: -438px; padding-right: 438px; }
  :host(.edit:not(.ph)) .hdr { right: 416px; }
  .ed { position: fixed; z-index: 55; top: 0; right: 0; bottom: 0; width: 416px; display: flex; flex-direction: column; overflow: hidden; color: #fff; background: var(--solid); box-shadow: inset .5px 0 0 rgba(255,255,255,.08); transform: translateX(100%); transition: transform .46s cubic-bezier(.32,.72,0,1); }
  .ed.in { transform: none; }
  .ed.out { transform: translateX(100%); }
  :host(.edmv:not(.ph)) .ed { transition: transform .6s ${SPR}; }
  :host(.edmv.fd) .page { transition: grid-template-columns .6s ${SPR}; }
  :host(.edmv.edcl:not(.ph)) .ed, :host(.edmv.edcl.fd) .page { transition-duration: .48s; }
  .pvb.gone { pointer-events: none; }
  .ed .grab { display: none; }
  .edh { flex: none; padding: 42px 20px 6px; }
  :host(.tab) .edh { padding-top: 40.5px; }
  .er1 { display: flex; align-items: center; gap: 8px; height: 36px; }
  .er1 button, .eur button { all: unset; box-sizing: border-box; display: grid; place-items: center; height: 36px; color: #fff; cursor: pointer; }
  .er1 .edx { width: 36px; border-radius: 50%; background: rgba(255,255,255,.14); }
  .er0 .edroom { flex: 1; min-width: 0; display: flex !important; align-items: center; gap: 9px; padding: 0 13px; border-radius: 18px; background: rgba(255,255,255,.14); font-size: 15px; font-weight: 600; }
  .edroom i { flex: none; width: 19px; height: 19px; background: #fff; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .edroom span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
  .edroom svg { flex: none; opacity: .6; }
  .eur { display: inline-flex; border-radius: 18px; background: rgba(255,255,255,.14); }
  .eur button { width: 36px; }
  .eur button[disabled] { opacity: .38; cursor: default; }
  .er1 button:focus-visible, .eur button:focus-visible { box-shadow: 0 0 0 2px rgba(255,255,255,.55); border-radius: 18px; }
  .er1 .edsr { flex: 1; min-width: 0; margin-top: 0; }
  .er0 { display: none; }
  .edsr { display: flex; align-items: center; gap: 8px; height: 36px; margin-top: 14px; padding: 0 12px; border-radius: 18px; background: rgba(0,0,0,.18); color: rgba(255,255,255,.55); }
  .edsr:focus-within { background: rgba(0,0,0,.26); box-shadow: 0 0 0 1.5px rgba(255,255,255,.3); }
  .edsr input { all: unset; flex: 1; min-width: 0; font-size: 15px; color: #fff; }
  .edsr input::placeholder { color: rgba(255,255,255,.55); }
  .edsr kbd { flex: none; font: 500 10px/12px -apple-system, BlinkMacSystemFont, system-ui, sans-serif; letter-spacing: .04em; padding: 1px 4px; border-radius: 4px; background: rgba(255,255,255,.12); color: rgba(255,255,255,.7); }
  .edchg { all: unset; box-sizing: border-box; position: absolute; z-index: 6; left: 50%; bottom: calc(18px + var(--sab, env(safe-area-inset-bottom, 0px))); transform: translateX(-50%); display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px 0 16px; border-radius: 18px; font-size: 15px; font-weight: 600; letter-spacing: -.1px; white-space: nowrap; color: #fff; background: rgba(118,118,128,.42); -webkit-backdrop-filter: blur(24px) saturate(1.6); backdrop-filter: blur(24px) saturate(1.6); box-shadow: 0 6px 20px rgba(0,0,0,.22), inset 0 0 0 .5px rgba(255,255,255,.2); cursor: pointer; transition: opacity .2s ease, transform .28s cubic-bezier(.32,.72,0,1); }
  .edchg[hidden] { display: flex !important; opacity: 0; transform: translate(-50%, 12px); pointer-events: none; }
  .edchg svg { width: 11px; height: 11px; opacity: .7; transition: transform .25s ease; }
  .edchg[aria-expanded="true"] svg { transform: rotate(180deg); }
  .edchg:focus-visible { box-shadow: 0 0 0 2px rgba(255,255,255,.6); }
  .ed.flatm .edchg { background: color-mix(in oklab, var(--hvbg) 72%, #fff); -webkit-backdrop-filter: none; backdrop-filter: none; }
  :host(.lt) .edchg, :host(.glass.gd) .edchg { color: #000; background: rgba(255,255,255,.82); box-shadow: 0 6px 20px rgba(0,0,0,.12), inset 0 0 0 .5px rgba(0,0,0,.08); }
  .edcl.mnu { position: absolute; z-index: 7; left: 16px; right: 16px; bottom: calc(64px + var(--sab, env(safe-area-inset-bottom, 0px))); max-height: min(70%, 520px); padding: 6px; overflow-y: auto; transform-origin: 50% 100%; animation: edclin .22s cubic-bezier(.32,.72,0,1); }
  @keyframes edclin { from { opacity: 0; transform: translateY(8px) scale(.98); } }
  .edcl h4 { margin: 8px 10px 6px; font-size: 13px; font-weight: 600; opacity: .6; }
  .edcl ul { list-style: none; margin: 0; padding: 0; }
  .edcl li { display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 6px 6px 6px 10px; border-radius: 9px; position: relative; }
  .edcl li + li::before { content: ""; position: absolute; top: 0; left: 10px; right: 6px; height: .5px; background: currentColor; opacity: .14; }
  .edcl li .lt { flex: 1; min-width: 0; font-size: 14px; line-height: 18px; }
  .edcl li small { display: block; font-size: 12px; opacity: .55; margin-top: 2px; }
  .edcl li.gone .lt { opacity: .4; text-decoration: line-through; }
  .edcl .rv { all: unset; box-sizing: border-box; flex: none; height: 26px; padding: 0 11px; border-radius: 13px; font-size: 13px; font-weight: 600; background: rgba(255,255,255,.16); cursor: pointer; }
  :host(.lt) .edcl .rv, :host(.glass.gd) .edcl .rv { background: rgba(118,118,128,.14); }
  .edcl .rv:hover:not([disabled]) { filter: brightness(1.15); }
  .edcl .rv[disabled] { opacity: .4; cursor: default; }
  .edcl .rva { all: unset; box-sizing: border-box; display: flex; align-items: center; width: 100%; height: 36px; margin-top: 4px; padding: 0 10px; border-radius: 9px; font-size: 14px; font-weight: 500; color: #FF6961; cursor: pointer; }
  :host(.lt) .edcl .rva, :host(.glass.gd) .edcl .rva { color: #FF3B30; }
  .edcl .rva:hover { background: rgba(255,255,255,.1); }
  .edcl hr { margin: 4px 6px; }
  .tst { position: fixed; z-index: 80; left: 50%; bottom: calc(28px + var(--sab, env(safe-area-inset-bottom, 0px))); transform: translateX(-50%); display: flex; align-items: center; gap: 14px; max-width: min(560px, calc(100vw - 32px)); height: 44px; padding: 0 8px 0 18px; box-sizing: border-box; border-radius: 22px; color: #fff; background: rgba(28,28,30,.86); -webkit-backdrop-filter: blur(24px) saturate(1.6); backdrop-filter: blur(24px) saturate(1.6); box-shadow: 0 10px 30px rgba(0,0,0,.28), inset 0 0 0 .5px rgba(255,255,255,.14); font-size: 15px; font-weight: 500; letter-spacing: -.1px; animation: tstin .32s cubic-bezier(.32,.72,0,1); }
  :host(.edit:not(.ph)) .tst { left: var(--pvcx, calc((100vw - 416px) / 2)); }
  .tst.out { opacity: 0; transform: translate(-50%, 10px); transition: opacity .2s ease, transform .2s ease; }
  @keyframes tstin { from { opacity: 0; transform: translate(-50%, 14px); } }
  .tst span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tst button { all: unset; flex: none; height: 32px; padding: 0 12px; border-radius: 16px; font-weight: 600; color: var(--hemma-color-orange, #FF9230); cursor: pointer; }
  .tst button:hover, .tst button:focus-visible { background: rgba(255,255,255,.1); }
  @media (prefers-reduced-motion: reduce) { .tst, .edcl.mnu { animation: none; } }
  :host(.ph) .edchg { bottom: calc(14px + var(--sab, env(safe-area-inset-bottom, 0px))); }
  :host(.ph) .tst { bottom: calc(var(--edh, 62vh) + 14px); }
  @media (pointer: coarse) { .edsr kbd { display: none; } }
  .pvb { position: fixed; z-index: 58; left: var(--pvcx, calc((100vw - 416px) / 2)); top: calc(38px + var(--sat, 0px)); transform: translateX(-50%); transition: left .5s cubic-bezier(.32,.72,0,1); display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: 24px; color: #fff; background: rgba(118,118,128,.42); -webkit-backdrop-filter: blur(24px) saturate(1.6); backdrop-filter: blur(24px) saturate(1.6); box-shadow: 0 8px 24px rgba(0,0,0,.24), inset 0 0 0 .5px rgba(255,255,255,.2); animation: pvfin .22s ease-out .12s backwards; }
  .pvb.flat { background: color-mix(in oklab, var(--hvbg) 72%, #fff); -webkit-backdrop-filter: none; backdrop-filter: none; }
  :host(.lt) .pvb, :host(.glass.gd) .pvb { color: #000; background: rgba(255,255,255,.82); box-shadow: 0 8px 24px rgba(0,0,0,.12), inset 0 0 0 .5px rgba(0,0,0,.08); }
  .pvb button { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px 0 12px; border-radius: 18px; font-size: 15px; font-weight: 600; letter-spacing: -.2px; white-space: nowrap; opacity: .72; cursor: pointer; transition: background-color .2s ease, opacity .2s ease; }
  .pvb button.io { padding: 0; width: 36px; justify-content: center; }
  .pvb button svg { width: 19px; height: 19px; flex: none; }
  .pvb button:hover { opacity: 1; }
  .pvb button[aria-pressed="true"] { opacity: 1; background: rgba(255,255,255,.24); }
  :host(.lt) .pvb button[aria-pressed="true"], :host(.glass.gd) .pvb button[aria-pressed="true"] { background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.12), 0 0 0 .5px rgba(0,0,0,.06); }
  .pvb button:focus-visible { box-shadow: 0 0 0 2px rgba(255,255,255,.6); }
  .pvb .dv { width: .5px; height: 20px; margin: 0 4px; background: currentColor; opacity: .25; }
  :host(.ph) .pvb, :host(.ph) .pvf { display: none; }
  :host(.tab) .pvb { top: calc(36.5px + var(--sat, 0px)); }
  :host .pvb.pvb { color: #fff; background: color-mix(in oklab, var(--hvbg) 45%, rgb(28 29 30)); -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: 0 10px 26px -12px rgba(0,0,0,.34), inset 0 0 0 .5px rgba(255,255,255,.1); }
  :host(.glass) .pvb.pvb { background: #262628; }
  :host .pvb.pvb button[aria-pressed="true"] { background: rgba(255,255,255,.14); box-shadow: none; color: #fff; }
  :host(.edit:not(.ph)) .tst { bottom: calc(76px + var(--sab, env(safe-area-inset-bottom, 0px))); }
  :host(.pvon) .hdr { z-index: 56; }
  :host(.pvon) .hdr > :not(.ok) { visibility: hidden; }
  .pvf { position: fixed; z-index: 54; top: 0; left: var(--pvl, 0px); right: 416px; bottom: 0; background: rgba(0,0,0,.28); -webkit-backdrop-filter: blur(26px) saturate(1.15); backdrop-filter: blur(26px) saturate(1.15); animation: pvfin .3s ease; }
  @keyframes pvfin { from { opacity: 0; } }
  .pvf.out { opacity: 0; transition: opacity .22s ease; }
  .pvf .dev { position: absolute; top: 0; left: 0; overflow: hidden; background: #000; transform-origin: 0 0; box-shadow: 0 0 0 11px #0d0d0f, 0 0 0 12px rgba(255,255,255,.16), 0 40px 90px rgba(0,0,0,.5); transition: opacity .3s ease; }
  .pvf .dev.wait { opacity: 0; }
  .pvf.idle { visibility: hidden; pointer-events: none; animation: none; }
  .pvf iframe { display: block; width: 100%; height: 100%; border: 0; }
  .pvf .sb { position: absolute; z-index: 2; top: 0; left: 0; right: 0; height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 6px 34px 0 52px; box-sizing: border-box; color: #fff; font: 600 17px/1 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; letter-spacing: -.2px; pointer-events: none; }
  .pvf .sb.ink { color: #000; }
  .pvf .sb::before { content: ""; position: absolute; left: 50%; top: 11px; width: 125px; height: 37px; margin-left: -62.5px; border-radius: 19px; background: #000; }
  .pvf .sb svg { height: 13px; width: auto; }
  .pvf .hb { position: absolute; z-index: 2; left: 50%; bottom: 8px; width: 139px; height: 5px; margin-left: -69.5px; border-radius: 3px; background: currentColor; color: #fff; opacity: .9; pointer-events: none; }
  .pvf .hb.ink { color: #000; }
  .pvf .ld { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); font-size: 14px; font-weight: 500; color: rgba(255,255,255,.7); }
  @media (prefers-reduced-motion: reduce) { .pvb, .pvf { animation: none; } .pvb { transition: none; } }
  .er1 .edhi { width: 36px; border-radius: 50%; background: rgba(255,255,255,.14); }
  :host(.lt) .er1 .edhi { background: rgba(118,118,128,.14); }
  :host(.glass.gd) .er1 .edhi { color: #000; }
  .edhist { position: absolute; inset: 0; z-index: 5; overflow-y: auto; padding: 0 20px 28px; background: var(--solid); animation: edhin .32s cubic-bezier(.32,.72,0,1); }
  :host(.glass) .edhist { background: none; }
  @keyframes edhin { from { opacity: 0; transform: translateX(24px); } }
  .edhist .hh { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; height: 44px; margin: 0 -20px 10px; padding: 0 20px; }
  .edhist .hh button { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 14px 0 9px; border-radius: 18px; font-size: 15px; background: rgba(255,255,255,.12); cursor: pointer; white-space: nowrap; }
  :host(.lt) .edhist .hh button, :host(.glass.gd) .edhist .hh button { background: rgba(118,118,128,.14); }
  .edhist .hh button.bk, :host(.lt) .edhist .hh button.bk, :host(.glass.gd) .edhist .hh button.bk { background: none; box-shadow: none; padding: 0 8px 0 2px; height: 44px; font-weight: 500; color: rgba(235,235,245,.6); }
  .edhist .hh h3 { font-size: 17px; font-weight: 600; letter-spacing: -.01em; }
  .edhist { background: var(--edp, var(--solid)); }
  :host(.glass) .edhist { background: var(--edp, none); }
  .edhist .hh button svg { width: 16px; height: 16px; }
  .edhist .hh h3 { position: absolute; left: 50%; transform: translateX(-50%); margin: 0; max-width: 56%; font-size: 17px; font-weight: 600; letter-spacing: -.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .edhist .sec { margin: 20px 6px 7px; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: .02em; opacity: .55; }
  .edhist .sec:first-of-type { margin-top: 6px; }
  .edhist .rr .ri { background: rgba(118,118,128,.5); }
  .edhist .rr .ri.pin { background: #FF9F0A; }
  .edhist .rr .ri.org { background: #8E8E93; }
  .edhist .rr .tm { flex: none; font-size: 13px; opacity: .55; }
  .edhist .rr .chev { flex: none; width: 8px; height: 13px; opacity: .35; background: currentColor; -webkit-mask: ${CHEV} center/contain no-repeat; mask: ${CHEV} center/contain no-repeat; }
  .edhist .msg { padding: 28px 12px; text-align: center; font-size: 14px; line-height: 1.4; opacity: .6; }
  .edhist .hd { margin: 2px 6px 14px; }
  .edhist .hd b { display: block; font-size: 22px; font-weight: 700; letter-spacing: -.3px; }
  .edhist .hd small { display: block; margin-top: 3px; font-size: 13px; opacity: .55; }
  .edhist .ln { display: block; padding: 11px 14px; font-size: 14px; line-height: 18px; position: relative; }
  .edhist .ln + .ln::before { content: ""; position: absolute; top: 0; left: 14px; right: 0; height: .5px; background: currentColor; opacity: .13; }
  .edhist .act { all: unset; box-sizing: border-box; display: flex; align-items: center; width: 100%; min-height: 44px; padding: 0 14px; font-size: 15px; cursor: pointer; position: relative; }
  .edhist .act + .act::before { content: ""; position: absolute; top: 0; left: 14px; right: 0; height: .5px; background: currentColor; opacity: .13; }
  .edhist .act.pri { color: var(--hemma-color-orange, #FF9230); font-weight: 600; }
  .edhist .act.red { color: #FF6961; }
  :host(.lt) .edhist .act.red, :host(.glass.gd) .edhist .act.red { color: #FF3B30; }
  .edhist .act:hover { background: rgba(255,255,255,.06); }
  .edhist .act[disabled] { opacity: .4; cursor: default; }
  .edhist input.nm { all: unset; box-sizing: border-box; width: 100%; height: 44px; padding: 0 14px; font-size: 15px; }
  :host(.glass) .ed:has(.edhist) .studio { opacity: 0; pointer-events: none; }
  .edwarm { position: fixed; top: 0; bottom: 0; right: -460px; width: 416px; visibility: hidden; pointer-events: none; overflow: hidden; }
  .edb .studio.pending { opacity: 0; pointer-events: none; }
  .edsk { position: absolute; inset: 0; z-index: 1; padding: 14px 20px; pointer-events: none; }
  .edsk .skh { display: block; width: 74px; height: 11px; margin: 10px 6px 10px; border-radius: 6px; background: rgba(255,255,255,.12); }
  .edsk .skh + .skg + .skh { margin-top: 26px; }
  .edsk .skg { border-radius: 18px; background: rgba(255,255,255,.08); padding: 2px 0; }
  .edsk .skg span { display: flex; align-items: center; gap: 12px; height: 50px; padding: 0 14px; }
  .edsk .skg span + span { box-shadow: inset 52px .5px 0 -52px transparent, 0 -.5px 0 0 rgba(255,255,255,.06); }
  .edsk .skg b { flex: none; width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,.12); }
  .edsk .skg em { width: 46%; height: 12px; border-radius: 6px; background: rgba(255,255,255,.12); }
  .edsk .skg span:nth-child(3n+2) em { width: 34%; }
  .edsk .skg span:nth-child(3n) em { width: 56%; }
  .edsk :is(.skh, b, em) { animation: edsk 1.4s ease-in-out infinite; }
  @keyframes edsk { 50% { opacity: .45; } }
  @media (prefers-reduced-motion: reduce) { .edsk :is(.skh, b, em) { animation: none; } }
  .edres { position: absolute; inset: 0; z-index: 4; overflow-y: auto; padding: 6px 20px 24px; background: var(--solid); }
  .edres[hidden] { display: none; }
  .rg { border-radius: 18px; background: rgba(255,255,255,.1); overflow: hidden; }
  .rr { all: unset; box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 11px; min-height: 52px; padding: 7px 14px; position: relative; cursor: pointer; }
  .rr + .rr::before { content: ""; position: absolute; top: 0; left: 53px; right: 0; height: .5px; background: rgba(255,255,255,.13); }
  .rr.hi { background: rgba(255,255,255,.12); }
  .rr .ri { flex: none; width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: rgba(0,0,0,.22); }
  .rr .ri i { width: 17px; height: 17px; background: #fff; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .rr .tx { flex: 1; min-width: 0; }
  .rr .tx b { display: block; font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rr .tx small { display: block; font-size: 12.5px; color: rgba(255,255,255,.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rr .kt { flex: none; font-size: 11px; font-weight: 600; padding: 4px 7px; border-radius: 7px; background: rgba(255,255,255,.12); color: rgba(255,255,255,.7); }
  .edres .none { padding: 30px 10px; text-align: center; color: rgba(255,255,255,.55); }
  .okn { position: absolute; top: -5px; right: -6px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px; background: #fff; color: #1c1c1e; font: 700 11px/18px -apple-system, system-ui, sans-serif; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.25); display: none; }
  .okn.on { display: block; }
  .t.flash { animation: edflash .9s ease 2 !important; }
  @keyframes edflash { 50% { box-shadow: 0 0 0 3px #fff, 0 0 26px rgba(255,255,255,.5); } }
  .adb:focus-visible { box-shadow: 0 0 0 2px rgba(255,255,255,.55); }
  .edb { position: relative; flex: 1; min-height: 0; overflow: hidden; }
  .studio { display: block; width: 100%; height: 100%; position: relative; z-index: 2; }
  .edwait { position: absolute; inset: 0; display: grid; place-items: center; }
  .edwait:not(.msg)::after { content: ""; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.2); border-top-color: rgba(255,255,255,.85); animation: edspin .8s linear infinite; }
  .edwait.msg { padding: 24px; text-align: center; color: rgba(255,255,255,.7); font-size: 15px; }
  @keyframes edspin { to { transform: rotate(360deg); } }
  .al { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; background: rgba(28,30,28,.22); animation: alf .2s ease; }
  .al.out { opacity: 0; transition: opacity .18s ease; }
  .alc { box-sizing: border-box; width: 280px; border-radius: 26px; padding: 20px 16px 0; text-align: center; color: #fff; background: rgba(118,118,128,.42); -webkit-backdrop-filter: blur(34px) saturate(1.8); backdrop-filter: blur(34px) saturate(1.8); box-shadow: 0 20px 60px rgba(0,0,0,.3), inset 0 0 0 .5px rgba(255,255,255,.24); animation: alf .22s ease; }
  :host(.mini) .alc { background: color-mix(in oklab, var(--hvbg) 80%, #fff); -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: 0 20px 60px rgba(0,0,0,.25), inset 0 0 0 .5px rgba(255,255,255,.14); animation: alp .34s cubic-bezier(.32,.72,0,1); }
  .alc b { display: block; font-size: 17px; font-weight: 600; line-height: 1.3; }
  .alc p { margin: 5px 0 0; font-size: 14px; line-height: 1.35; color: rgba(255,255,255,.75); }
  .alb { display: flex; gap: 8px; padding: 18px 0 16px; }
  .alb button { all: unset; flex: 1; height: 44px; border-radius: 22px; text-align: center; font-size: 16px; font-weight: 500; background: rgba(255,255,255,.12); cursor: pointer; }
  .alb button:hover { background: rgba(255,255,255,.2); }
  .alb button:focus-visible { box-shadow: 0 0 0 2px rgba(255,255,255,.55); }
  .alb .yes { font-weight: 600; }
  .alb .red { color: #FF453A; }
  .alb.three { flex-direction: column; }
  .alb.three .alt { order: 0; } .alb.three .yes { order: 1; } .alb.three .no { order: 2; }
  .t.hid > :not(.rm) { opacity: .4; }
  .t.hid::after { content: attr(data-hid); position: absolute; top: 9px; right: 10px; z-index: 2; padding: 2px 8px; border-radius: 9px; font-size: 11px; font-weight: 600; line-height: 16px; letter-spacing: .1px; color: #fff; background: rgba(0,0,0,.45); pointer-events: none; }
  @keyframes alp { from { transform: scale(1.14); opacity: 0; } }
  @keyframes alf { from { opacity: 0; } }
  .edadd { position: absolute; inset: 0; z-index: 3; overflow-y: auto; padding: 4px 16px 24px; background: var(--solid); transform: translateX(104%); transition: transform .42s cubic-bezier(.32,.72,0,1); }
  .edadd.in { transform: none; }
  .edadd.out { transform: translateX(104%); }
  .adh { position: relative; display: flex; align-items: center; min-height: 44px; padding: 12px 0 0 2px; margin-bottom: 14px; }
  .adh h2 { position: absolute; left: 50%; top: 12px; height: 44px; line-height: 44px; transform: translateX(-50%); max-width: 52%; margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
  .adb { all: unset; display: flex; align-items: center; gap: 4px; height: 44px; padding: 0 17px 0 12px; border-radius: 22px; background: rgba(255,255,255,.12); font-size: 17px; cursor: pointer; }
  .srch { display: flex; align-items: center; gap: 8px; height: 38px; border-radius: 12px; background: rgba(255,255,255,.12); padding: 0 12px; color: rgba(255,255,255,.55); }
  .srch input { all: unset; flex: 1; min-width: 0; font-size: 16px; color: #fff; }
  .edadd .gt { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.62); margin: 18px 6px 7px; }
  .edadd .g { background: rgba(255,255,255,.09); border-radius: 20px; overflow: hidden; }
  .ent { all: unset; box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 8px 14px; position: relative; cursor: pointer; }
  .ent + .ent::before { content: ""; position: absolute; top: 0; left: 62px; right: 0; height: .5px; background: rgba(255,255,255,.13); }
  .ent:hover, .ent:focus-visible { background: rgba(255,255,255,.07); }
  .ei { width: 36px; height: 36px; border-radius: 50%; flex: none; background: rgba(0,0,0,.24); position: relative; }
  .ei::after { content: ""; position: absolute; inset: 8px; background: #fff; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .ent .tx { flex: 1; min-width: 0; }
  .ent .tx b { display: block; font-size: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ent .tx span { display: block; font-size: 13px; color: rgba(255,255,255,.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .kd { flex: none; font-size: 12px; font-weight: 600; padding: 4px 9px; border-radius: 9px; background: rgba(255,255,255,.12); color: rgba(255,255,255,.75); }
  .pl { flex: none; width: 28px; height: 28px; border-radius: 50%; background: #fff; position: relative; }
  .pl::before, .pl::after { content: ""; position: absolute; left: 50%; top: 50%; width: 12px; height: 2px; margin: -1px 0 0 -6px; border-radius: 1px; background: #1c1c1e; }
  .pl::after { transform: rotate(90deg); }
  .edadd .none { padding: 30px; text-align: center; color: rgba(255,255,255,.55); }
  :host(.lt) .page, :host(.lt) .hdr { color: #111; }
  :host(.lt) .side .hd, :host(.lt) .bd span, :host(.lt) .bd > div > span, :host(.lt) .t .tx > span, :host(.lt) .chip span { color: rgba(0,0,0,.55); }
  :host(.lt) .np { color: #fff; }
  :host(.lt) .np .meta > span { color: rgba(255,255,255,.72); }
  :host(.lt) .wx em { color: rgba(0,0,0,.55); }
  :host(.lt:not(.tab):not(.ph)) .bd > div > span, :host(.lt.ph) .bd > div > span { color: rgba(0,0,0,.55); }
  :host(.lt) .t b, :host(.lt) .sc { color: rgba(0,0,0,.85); }
  :host(.lt) .t.on b { color: rgba(0,0,0,.88); }
  :host(.lt) .t .ic { color: rgba(0,0,0,.45); background: rgba(0,0,0,.07); }
  :host(.lt) .t .ic.num { color: rgba(0,0,0,.5); }
  :host(.lt) .pill { background: rgba(255,255,255,.8); }
  :host(.lt) .pill s, :host(.lt.ph) .hdr .pill s, :host(.lt.tab) .hdr .pill s { background: rgba(0,0,0,.18); }
  :host(.lt) .wx img { filter: brightness(0) opacity(.88); }
  :host(.lt) .t.on .ic { color: #fff; background: var(--c, #FFCC00); }
  :host(.lt) .t.add b { color: rgba(0,0,0,.7); }
  :host(.lt) .chip b { color: #111; }
  :host(.lt) .chip i { background: rgba(0,0,0,.8); }
  :host(.lt) .chip.on i { background: var(--c, #30D0E0); }
  :host(.lt) .side .hd .hp::before, :host(.lt) .side button[data-room] .rd::before { background: #111; }
  :host(.lt) .side button.on { background: rgba(255,255,255,.88); }
  :host(.lt) .ed, :host(.lt) .er1 button, :host(.lt) .eur button, :host(.lt) .edadd, :host(.lt) .edres { color: #000; }
  :host(.lt) .er1 .edx, :host(.lt) .eur, :host(.lt) .adb { background: rgba(118,118,128,.14); }
  :host(.lt) .edsr, :host(.lt) .srch { background: rgba(118,118,128,.14); color: rgba(60,60,67,.6); }
  :host(.lt) .edsr input, :host(.lt) .srch input { color: #000; }
  :host(.lt) .edsr input::placeholder, :host(.lt) .srch input::placeholder { color: rgba(60,60,67,.6); }
  :host(.lt) .edsr kbd { background: rgba(118,118,128,.14); color: rgba(60,60,67,.6); }
  :host(.lt) .edadd .gt, :host(.lt) .ent .tx span, :host(.lt) .rr .tx small, :host(.lt) .ad-n, :host(.lt) .edadd .none, :host(.lt) .edres .none { color: rgba(60,60,67,.6); }
  :host(.lt) .edadd .g, :host(.lt) .edres .g, :host(.lt) .ad-t { background: rgba(255,255,255,.72); }
  :host(.lt) .ad-t:hover, :host(.lt) .ad-t:focus-visible { background: rgba(255,255,255,.88); }
  :host(.lt) .ent + .ent::before, :host(.lt) .rr + .rr::before { background: rgba(60,60,67,.18); }
  :host(.lt) .ent:hover, :host(.lt) .ent:focus-visible, :host(.lt) .rr:hover { background: rgba(0,0,0,.04); }
  :host(.lt) .ei, :host(.lt) .rr .ri { background: rgba(118,118,128,.14); }
  :host(.lt) .ad-c .ei { background: none; }
  :host(.lt) .ei::after, :host(.lt) .ad-t i, :host(.lt) .rr .ri i { background: #3a3a3c; }
  :host(.lt) .ad-pl { background: rgba(118,118,128,.16); }
  :host(.lt) .ad-pl::before, :host(.lt) .ad-pl::after { background: #3a3a3c; }
  :host(.lt) .ad-ch { border-color: rgba(60,60,67,.35); }
  :host(.lt) .rr .kt { background: rgba(118,118,128,.14); color: rgba(60,60,67,.7); }
  :host(.lt) .mnu { color: #000; background: color-mix(in oklab, var(--hvbg) 10%, #fff); }
  :host(.lt) .mnu .ic2 i { background: #3a3a3c; }
  :host(.lt) .mnu button:hover, :host(.lt) .mnu button:focus-visible { background: rgba(0,0,0,.06); }
  :host(.lt) .mnu hr { background: rgba(60,60,67,.18); }
  :host(.lt) .mnu button.red { color: #FF3B30; }
  :host(.lt) .mnu .ic2 { background: rgba(0,0,0,.05); }
  :host(.lt) .mnu .ic2:hover, :host(.lt) .mnu .ic2:focus-visible { background: rgba(0,0,0,.1); }
  :host(.lt) .mnu .ic2.on { background: #1c1c1e; }
  :host(.lt) .mnu .ic2.on i { background: #fff; }
  :host(.lt) .alb button { background: rgba(120,120,128,.14); }
  :host(.lt) .alb button:hover { background: rgba(120,120,128,.22); }
  :host(.lt) .alb button:focus-visible { box-shadow: 0 0 0 2px rgba(0,0,0,.25); }
  :host(.lt) .alb .red { color: #FF3B30; }
  :host(.lt) .alc { color: #000; background: color-mix(in oklab, var(--hvbg) 8%, #fff); }
  :host(.lt) .alc p { color: rgba(60,60,67,.75); }
  .edadd .adl > .gt:first-child { margin-top: 14px; }
  .ad-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ad-t { all: unset; box-sizing: border-box; height: 82px; padding: 0 6px; border-radius: 18px; background: rgba(255,255,255,.09); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; text-align: center; cursor: pointer; transition: background-color .15s ease; }
  .ad-t:hover, .ad-t:focus-visible { background: rgba(255,255,255,.15); }
  .ad-t:active { background: rgba(255,255,255,.2); }
  .ad-t i { width: 26px; height: 26px; background: #fff; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .ad-pl { flex: none; width: 26px; height: 26px; border-radius: 50%; background: rgba(255,255,255,.2); position: relative; }
  .ad-pl::before, .ad-pl::after { content: ""; position: absolute; left: 50%; top: 50%; width: 12px; height: 2px; margin: -1px 0 0 -6px; border-radius: 1px; background: #fff; }
  .ad-pl::after { transform: rotate(90deg); }
  .ent.ad-c { min-height: 48px; }
  .ad-c .ei { background: none; }
  .ad-c .ei::after { inset: 6px; }
  .ad-n { flex: none; font-size: 16px; color: rgba(255,255,255,.55); }
  .ad-ch { flex: none; width: 7px; height: 7px; margin: 0 4px 0 2px; border: solid rgba(255,255,255,.4); border-width: 2px 2px 0 0; transform: rotate(45deg); }
    :host(.ph) .ed, :host(.ph) .ed.in, :host(.ph) .ed.out { top: auto; left: 0; right: 0; width: auto; height: var(--edh, 62vh); border-radius: 30px 30px 0 0; transition: transform .46s cubic-bezier(.32,.72,0,1), height .32s cubic-bezier(.32,.72,0,1); }
    :host(.ph) .ed { bottom: 0; transform: translateY(100%); }
    :host(.ph) .ed.in { transform: none; }
    :host(.ph) .ed.out { transform: translateY(100%); }
    :host(.ph) .ed.drag { transition: none; }
    :host(.ph) .edhalo { display: none; }
    :host(.ph) .ed { box-shadow: 0 -10px 40px rgba(0,0,0,.25); }
    :host(.ph) .edh { padding-top: 10px; }
    :host(.ph) .er0 { display: flex; margin-top: 10px; }
    :host(.ph) .ed .grab { display: block; flex: none; width: 36px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.35); margin: 7px auto 0; }
    :host(.ph.edit.phs) .main { padding-bottom: calc(var(--edh, 62vh) + 24px); }
    :host(.ph) .ed .grab { display: none; }
    :host(.ph) .ed.ed.full { height: calc(100% - var(--sat, env(safe-area-inset-top, 0px)) - 10px); }
    :host(.ph) .hdr .edplus { all: unset; box-sizing: border-box; position: absolute; left: 16px; top: calc(var(--sat, env(safe-area-inset-top, 0px)) + 4px); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; pointer-events: auto; cursor: pointer; color: #fff; background: var(--hv-tab-fill, rgba(255,255,255,.2)); }
    :host(.ph) .hdr .edplus svg { width: 17px; height: 17px; }
    :host(.ph.lt) .hdr .edplus { color: #111; background: rgba(255,255,255,.8); }
    :host(.ph.edit) .main .top h1 { cursor: pointer; }
  * { scrollbar-width: none; }
  *::-webkit-scrollbar { display: none; }
  .bds { display: flex; flex-wrap: wrap; gap: 6px 34px; margin: 9px 0 -2px; }
  .bd { display: flex; align-items: center; gap: 12px; }
  .bd > div { padding-top: 5px; }
  .bd > i { width: 32px; height: 32px; -webkit-mask-size: 62%; mask-size: 62%; }
  .bd > i.mm { -webkit-mask-size: 80%; mask-size: 80%; }
  .bd > i.ml { -webkit-mask-size: 52%; mask-size: 52%; }
  .bd .g { position: relative; flex: none; width: 32px; height: 32px; display: grid; place-items: center; color: #fff; filter: grayscale(1) brightness(var(--hv-gauge-b, 1.7)); }
  .bd .g i { position: absolute; inset: 0; width: auto; height: auto; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; opacity: 1; transform: translateZ(0); }
  .bd .g i:first-child { inset: 8px; -webkit-mask-size: contain; mask-size: contain; }
  .bd b { display: block; font-size: 16px; font-weight: 600; line-height: 1.12; }
  .bd span { display: block; font-size: 15px; line-height: 1.15; color: rgba(235,235,245,0.6); }
  h3 { margin: 46px 0 16px; font-size: 26px; line-height: 31px; font-weight: 700; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); grid-auto-rows: 66px; gap: 10px; }
  .t { all: unset; box-sizing: border-box; height: 66px; border-radius: 20px; display: flex; align-items: center; gap: 10px; padding: 0 8px; background: var(--hv-off, oklab(0.387047 -0.0151885 -0.00824521 / 0.52)); -webkit-backdrop-filter: blur(22px) saturate(1.2); backdrop-filter: blur(22px) saturate(1.2); box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.05); cursor: pointer; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
  .t.on { background: #fff; }
  .t .ic { flex: none; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,0.22); color: #fff; font-size: 17px; font-weight: 800; --mdc-icon-size: 27px; }
  .t .ic.pic, .t.on .ic.pic { overflow: hidden; background: rgba(255,255,255,.14); }
  .t.on .ic.pic { background: rgba(118,118,128,.14); }
  .t .ic.pic img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%; }
  .t .ic i { width: 27px; height: 27px; background: currentColor; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .t .ic.num { color: rgba(255,255,255,0.9); }
  .t.on .ic { background: var(--c, #FFCC00); color: #fff; }
  .t .tx { min-width: 0; }
  .t b { display: block; font-size: 15px; font-weight: 550; line-height: 17.25px; color: rgba(255,255,255,0.98); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .t .tx > span { display: block; font-size: 15px; line-height: 17.25px; color: rgba(255,255,255,0.72); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .t.on b { color: rgba(0,0,0,0.88); }
  .t.on .tx > span { color: rgba(0,0,0,0.55); }
  .menu { position: fixed; z-index: 10; min-width: 220px; padding: 6px; border-radius: 16px; background: rgba(36,36,40,0.82); -webkit-backdrop-filter: blur(30px); backdrop-filter: blur(30px); box-shadow: 0 18px 50px rgba(0,0,0,0.35); }
  :host(.mini) .menu { box-shadow: 0 0 0 .5px rgba(0,0,0,.25), 0 14px 36px -10px rgba(0,0,0,.35); }
  :host(.mini.lt) .menu { box-shadow: 0 0 0 .5px rgba(0,0,0,.1), 0 14px 36px -10px rgba(0,0,0,.22); }
  .menu button { all: unset; box-sizing: border-box; display: block; width: 100%; padding: 11px 14px; border-radius: 10px; font-size: 15px; cursor: pointer; }
  .menu button:hover { background: rgba(255,255,255,0.1); }
  .menu .red { color: #FF453A; }
  .menu .sub { font-size: 12px; opacity: .55; padding: 6px 14px 2px; }
  .scrim { position: fixed; inset: 0; z-index: 9; }
  .pop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; background: rgba(0,0,0,0.22); animation: pin .22s ease-out; }
  .pop .card { position: relative; width: 340px; height: min(600px, calc(100svh - 64px)); border-radius: 34px; overflow: hidden; background: rgba(36,36,40,0.55); -webkit-backdrop-filter: blur(40px) saturate(1.6); backdrop-filter: blur(40px) saturate(1.6); box-shadow: 0 30px 80px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,255,255,0.2); --hemma-panel-h: min(600px, calc(100svh - 64px)); --popup-min-width: 340px; --popup-max-width: 340px; animation: cin .32s cubic-bezier(.32,.72,0,1); }
  .pop .card > * { display: block; height: 100%; }
  .pop.out { animation: pout .2s ease-in forwards; }
  @keyframes pin { from { background: rgba(0,0,0,0); } }
  @keyframes pout { to { background: rgba(0,0,0,0); opacity: 0; } }
  @keyframes cin { from { opacity: 0; transform: scale(.94); } }
  @media (pointer: coarse) and (min-width: 769px) { .pop .card { width: 376px; height: min(729px, calc(100svh - 90px)); --hemma-panel-h: min(729px, calc(100svh - 90px)); --popup-min-width: 376px; --popup-max-width: 376px; } }
  :host(.ph) .pop { place-items: stretch; } :host(.ph) .pop .card { width: 100%; height: 100%; border-radius: 0; --hemma-panel-h: 100svh; --popup-min-width: 100vw; --popup-max-width: 100vw; }
  .empty { opacity: .6; margin-top: 40px; }
  .page.catp { background: var(--hvbg); }
  :host(.glass) .page.catp, :host(.ph) .page.catp { background: transparent; }
  :host(.glass.tab) .bdl.bdl::before { clip-path: none; filter: blur(5px); transform: scale(1.04); background-image: var(--gph, none); }
  :host(.glass.tab:not(.gd)) .bdl.bdl::before { filter: saturate(1.02) brightness(.985); transform: scale(1.08); background-size: cover; background-position: 50% 50%; background-repeat: no-repeat; background-image: radial-gradient(70% 55% at 0% 58%, rgba(30,30,32,.42) 0%, rgba(30,30,32,.18) 50%, rgba(30,30,32,0) 80%), linear-gradient(rgba(30,30,32,.22) 0%, rgba(30,30,32,0) 15%), radial-gradient(70% 60% at 88% 6%, rgba(255,252,246,.2) 0%, rgba(255,252,246,0) 65%), linear-gradient(to top, rgba(250,247,242,.3) 0%, rgba(250,247,242,.14) 22%, rgba(250,247,242,0) 45%), var(--gpg, none); }
  :host(.glass.tab.night:not(.gd)) .bdl.bdl::before { background-image: radial-gradient(70% 55% at 0% 58%, rgba(20,19,18,.5) 0%, rgba(20,19,18,.22) 50%, rgba(20,19,18,0) 80%), linear-gradient(rgba(20,19,18,.28) 0%, rgba(20,19,18,0) 15%), radial-gradient(70% 60% at 88% 6%, rgba(255,236,214,.12) 0%, rgba(255,236,214,0) 65%), linear-gradient(to top, rgba(255,236,214,.18) 0%, rgba(255,236,214,.08) 22%, rgba(255,236,214,0) 45%), linear-gradient(rgba(20,19,18,.08), rgba(20,19,18,.08)), linear-gradient(rgba(255,255,255,.06), rgba(255,255,255,.06)), var(--gpg, none); }
  :host(.glass.tab:not(.gd)) .bdl.bdl::after { display: none; }
  :host(.glass.ph) .bdl { background-color: var(--pmf); overflow: hidden; }
  :host(.glass.ph) .bdl.bdl::before { clip-path: none; inset: -40px; transform: none; background-image: var(--gph, none); background-size: cover; background-position: 50% 50%; filter: blur(14px) saturate(1.05) brightness(var(--pmb)); z-index: 0; }
  :host(.glass.ph) .bdl.bdl::after { inset: 0; filter: none; z-index: 1; background-image: linear-gradient(to bottom, var(--pw0) 0%, var(--pw1) 28%, var(--pw2) 62%, var(--pw3) 100%); background-size: 100% 100%; }
  :host(.glass.ph.night) { --pw0: rgba(0,0,0,.34); --pw1: rgba(0,0,0,.22); --pw2: color-mix(in oklab, var(--hemma-sampled-night-mid, #42444a) 48%, transparent); --pw3: color-mix(in oklab, var(--hemma-sampled-night-base, #2b2c2e) 74%, transparent); --pmb: .9; --pmf: var(--hemma-sampled-night-base, #2b2c2e); }
  :host(.glass.ph:not(.night)) { --pw0: rgba(18,16,14,.22); --pw1: rgba(18,16,14,.10); --pw2: color-mix(in oklab, var(--hemma-sampled-day-mid, #706a64) 34%, transparent); --pw3: color-mix(in oklab, var(--hemma-sampled-day-base, #524f4d) 62%, transparent); --pmb: .96; --pmf: var(--hemma-sampled-day-base, #524f4d); }
  :host(.glass) .chip.on b { color: #1c1c1e; }
  :host(.glass) .chip.on span, :host(.glass) .chip.on > div > span { color: rgba(60,60,67,.6); opacity: 1; }
  :host(.glass:not(.tab):not(.ph)) .bds { gap: 6px 25px; }
  :host(.glass:not(.tab):not(.ph)) .bd { gap: 8px; }
  :host(.glass:not(.tab):not(.ph)) .bd .g { width: 30px; height: 30px; }
  :host(.glass) .bd .g { filter: none; }
  :host(.glass:not(.tab):not(.ph)) .bd b { font-size: 13px; line-height: 16px; }
  :host(.glass:not(.tab):not(.ph)) .bd span, :host(.glass:not(.tab):not(.ph)) .bd > div > span { font-size: 12px; font-weight: 500; line-height: 15px; margin-top: 0; }
  :host(.glass:not(.gd)) .bd span, :host(.glass:not(.gd):not(.tab):not(.ph)) .bd > div > span { color: rgba(255,255,255,.72); }
  :host(.glass.cat) .bdl::before { clip-path: none; filter: blur(30px) saturate(1.2) brightness(.985); }
  :host(.glass.cat) .page > .col { background: rgba(0,0,0,.25); }
  :host(.glass.gd.cat) .page > .col { background: rgba(250,248,244,.25); }
  .chips { display: flex; gap: 11px; margin: 12.5px 0 0 -3px; overflow-x: auto; scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
  .chip { all: unset; box-sizing: border-box; flex: none; display: flex; align-items: center; gap: 10.5px; height: 44px; padding: 0 16px 0 12px; border-radius: 999px; background: var(--hemma-badge-bg, oklab(0.368559 -0.0113673 -0.0124184 / 0.58)); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); cursor: pointer; }
  .chip i { flex: none; width: 20px; height: 20px; margin-left: 2.5px; background: #fff; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .chip > i { --ib: 20px; width: var(--ib); height: var(--ib); margin: calc((20px - var(--ib)) / 2) calc((20px - var(--ib)) / 2) calc((20px - var(--ib)) / 2) calc(2.5px + (20px - var(--ib)) / 2); }
  .chip[data-cat="lights"] > i { --ib: 23.1px; }
  .chip[data-cat="media"] > i, .chip[data-cat="security"] > i { --ib: 23.3px; }
  .chip[data-cat="energy"] > i { --ib: 21.7px; }
  .chip[data-cat="people"] > i { --ib: 20.5px; }
  .chip b { display: block; font-size: 14px; font-weight: 600; line-height: 16.1px; color: #fff; white-space: nowrap; }
  .chip span { display: block; font-size: 13px; font-weight: 500; line-height: 14.95px; color: rgba(235,235,245,0.74); white-space: nowrap; }
  .chip > span { position: relative; }
  .chip.on { background: #fff; }
  .chip.on i { background: var(--c, #30D0E0); }
  .chip.on b { color: #1c1c1e; }
  .chip.on span { color: rgba(60,60,67,0.6); }
  .main.home .top h1, .main.catm .top h1 { margin-left: 0; }
  .main.catm .top h1 { margin-left: 58px; }
  .cbds { margin-top: 27.5px; }
  .chips + h3 { margin-top: 31px; }
  .wx { position: absolute; right: 115px; top: 41.3px; display: flex; align-items: center; gap: 8.5px; pointer-events: auto; }
  .wx > span { display: flex; flex-direction: column; align-items: flex-end; }
  .wx b { font-size: 20.9px; font-weight: 600; line-height: 21.945px; }
  .wx em { font-style: normal; font-size: 13.5px; font-weight: 600; line-height: 15.525px; color: rgba(235,235,245,0.74); }
  .wx img { width: 44.6px; height: 44.2px; }
  .nps { display: flex; flex-wrap: wrap; gap: 10px; }
  .np { box-sizing: border-box; position: relative; width: 400px; max-width: 100%; height: 140px; padding: 16px; border-radius: 20px; display: flex; gap: 14px; background: linear-gradient(135deg, color-mix(in oklab, var(--np1) 92%, transparent), color-mix(in oklab, var(--np2) 92%, transparent)); --np1: color-mix(in oklab, var(--hvbg) var(--npk, 88%), #000); --np2: var(--np1); -webkit-backdrop-filter: blur(22px) saturate(1.2); backdrop-filter: blur(22px) saturate(1.2); cursor: pointer; transition: background-color 1s ease; }
  .np .art { flex: none; width: 108px; height: 108px; border-radius: 15px; background: rgba(255,255,255,0.08) center/cover no-repeat; }
  .np .meta { flex: 1; min-width: 0; padding-top: 5px; }
  .np .meta b { display: block; font-size: 16px; font-weight: 600; line-height: 18.4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .np .meta > span { display: block; margin-top: 2px; font-size: 14px; line-height: 16.5px; color: rgba(255,255,255,0.72); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .np .trk { margin-top: 13.6px; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.25); overflow: hidden; }
  .np .trk i { display: block; height: 100%; width: 0; border-radius: 999px; background: #fff; }
  .np .ctl { position: absolute; left: 190px; top: 86.2px; display: flex; gap: 20px; }
  .np:not(:has(.ctl)) .meta { align-self: center; padding-top: 0; }
  .np .meta > span:empty { display: none; }
  .np .ctl button { all: unset; width: 34px; height: 34px; display: grid; place-items: center; cursor: pointer; }
  .np .ctl svg { display: block; fill: #fff; }
  .scs { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -22px 0 -15px; padding: 0 22px 0 15px; }
  .scs::-webkit-scrollbar { display: none; }
  .sc { all: unset; box-sizing: border-box; flex: none; width: 150px; height: 62px; border-radius: 20px; display: flex; align-items: center; gap: 11px; padding: 0 12px 0 13px; background: var(--hv-off, oklab(0.387843 -0.00278338 0.0185537 / 0.52)); box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.05); -webkit-backdrop-filter: blur(22px) saturate(1.2); backdrop-filter: blur(22px) saturate(1.2); cursor: pointer; color: rgba(255,255,255,0.9); }
  .sc ha-icon, .sc i { flex: none; width: 26px; height: 26px; --mdc-icon-size: 26px; }
  .sc i { background: currentColor; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
  .sc span { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sc.on { background: rgba(255,255,255,0.94); color: rgba(0,0,0,0.88); }
  .sc.on ha-icon, .sc.on i { color: var(--c, #FFCC00); }
  .t.hide { display: none; }
  .grid > .t { min-width: 0; }
  .done { all: unset; box-sizing: border-box; display: grid; place-items: center; height: 44px; padding: 0 20px; border-radius: 22px; background: #fff; color: #1c1c1e; font-size: 16px; font-weight: 600; cursor: pointer; }
  .done:focus-visible, .t .rm:focus-visible { box-shadow: 0 0 0 3px rgba(255,255,255,.5); }
  .hdr .done { position: absolute; right: 9px; top: 38px; pointer-events: auto; }
  :host(.edit) .hdr .pill { display: none; }
  .hdr .ok { all: unset; box-sizing: border-box; position: absolute; right: 9px; top: 42px; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--hemma-color-orange, #FF9230); color: #fff; cursor: pointer; pointer-events: auto; box-shadow: 0 2px 8px rgba(0,0,0,.18); }
  .hdr .ok svg { width: 16px; height: 16px; }
  .hdr .ok:focus-visible { box-shadow: 0 0 0 3px rgba(255,255,255,.6); }
  .hdr .ok[disabled] { opacity: .6; }
  :host(.tab) .hdr .ok { top: 40.5px; right: 10px; }
  :host(.edit) .t { position: relative; -webkit-backdrop-filter: none; backdrop-filter: none; touch-action: pan-y; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  :host(.edit) .t:active { transform: none; }
  :host(.edit) .grid > .t[data-e] { animation: jig .26s ease-in-out infinite alternate; }
  :host(.edit) .grid > .t[data-e]:nth-child(2n) { animation-delay: -.13s; animation-direction: alternate-reverse; }
  :host(.edit) .grid > .t.slot, :host(.edit) .grid > .t.lift, .ghost { animation: none !important; }
  @keyframes jig { from { rotate: -0.6deg; } to { rotate: 0.6deg; } }
  @media (prefers-reduced-motion: reduce) { :host(.edit) .grid > .t[data-e] { animation: none; } }
  :host(.edit) .t.slot { opacity: 0.32; transition: opacity .18s ease; }
  :host(.edit) .t.sel { box-shadow: 0 0 0 3px #fff, 0 0 24px rgba(255,255,255,.3); }
  .t.lift { scale: 1.03; transition: scale .15s ease; }
  .ghost { position: fixed; z-index: 60; margin: 0; pointer-events: none; opacity: 1; box-shadow: 0 18px 40px rgba(0,0,0,.34), 0 2px 6px rgba(0,0,0,.18); -webkit-backdrop-filter: none !important; backdrop-filter: none !important; will-change: transform; }
  .ghost .rm { display: none; }
  .t .rm { position: absolute; left: -7px; top: -7px; z-index: 2; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: rgba(118,118,128,0.96); box-shadow: 0 1px 3px rgba(0,0,0,.3); cursor: pointer; }
  .t .rm::before { content: ""; width: 10px; height: 2.2px; border-radius: 2px; background: #fff; }
  .t.add { background: transparent; border: 1.5px dashed rgba(255,255,255,.35); cursor: pointer; }
  .t.add .ic { background: rgba(255,255,255,.14); }
  .t.add b { color: rgba(255,255,255,.85); }
  .pk { width: min(420px, calc(100vw - 32px)); max-height: min(640px, calc(100svh - 80px)); display: flex; flex-direction: column; border-radius: 26px; overflow: hidden; background: rgba(36,36,40,0.72); -webkit-backdrop-filter: blur(40px) saturate(1.6); backdrop-filter: blur(40px) saturate(1.6); box-shadow: 0 30px 80px rgba(0,0,0,0.35); animation: cin .22s ease-out; }
  .pkh { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 12px; font-size: 17px; }
  .pkh b { font-weight: 700; }
  .pkx { all: unset; cursor: pointer; font-weight: 600; opacity: .85; }
  .pks { margin: 0 16px 10px; height: 40px; border: 0; border-radius: 12px; padding: 0 14px; background: rgba(255,255,255,0.12); color: #fff; font: inherit; outline: none; }
  .pks:focus-visible, .pkx:focus-visible, .pkl button:focus-visible { box-shadow: 0 0 0 2px rgba(255,255,255,.5); }
  .pkl { overflow-y: auto; padding: 0 8px 12px; overscroll-behavior: contain; }
  .pkl button { all: unset; box-sizing: border-box; display: block; width: 100%; padding: 10px 12px; border-radius: 12px; cursor: pointer; }
  .pkl button:hover { background: rgba(255,255,255,0.1); }
  .pkl b { display: block; font-size: 15px; font-weight: 550; }
  .pkl span { display: block; font-size: 12px; opacity: .55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pke { padding: 20px; opacity: .6; text-align: center; }
  .scg { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; margin-top: 14.5px; }
  .scg .sc { width: auto; min-width: 0; }
  h3.lk { display: flex; align-items: center; gap: 7px; cursor: pointer; }
  h3.lk i { width: 13.8px; height: 22.9px; background: currentColor; opacity: .5; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }
    :host(.ph) .page { grid-template-columns: 1fr; }
    :host(.ph) .side, :host(.ph) .hdr .mini { display: none; }
    :host(.mini.ph) .hdr .veil { bottom: auto; height: calc(var(--sat, env(safe-area-inset-top, 0px)) + 120px); background: linear-gradient(to bottom, color-mix(in oklab, var(--hvbg) 38%, transparent) 0%, color-mix(in oklab, var(--hvbg) 18%, transparent) 55%, transparent 100%); transition: opacity .22s ease-in-out; }
    :host(.mini.ph.bdc) .hdr .veil { background: var(--hv-veil, linear-gradient(var(--hvbg) 58%, transparent)); }
    :host(.mini.ph:not(.bdc)) .hdr .vb { display: block; position: absolute; left: 0; right: 0; top: 0; height: calc(var(--sat, env(safe-area-inset-top, 0px)) + 120px); pointer-events: none; opacity: 0; transition: opacity .22s ease-in-out; -webkit-backdrop-filter: var(--vb); backdrop-filter: var(--vb); -webkit-mask-image: var(--vm); mask-image: var(--vm); }
    :host(.mini.ph) .col.scrolled .hdr .vb { opacity: 1; }
    :host(.mini.ph) .hdr .mini { display: block; z-index: 1; left: 16px; top: calc(var(--sat, env(safe-area-inset-top, 0px)) + 4px); height: 44px; line-height: 44px; font-size: 20px; font-weight: 700; letter-spacing: -.3px; transform: translateY(5px); transition: opacity .2s ease, transform .2s ease; }
    :host(.mini.ph) .col.scrolled .hdr .mini { transform: none; }
    :host(.ph) .hdr .back { left: 16px; top: calc(var(--sat, env(safe-area-inset-top, 0px)) + 4px); width: 40px; height: 40px; background: var(--hv-tab-fill, rgba(255,255,255,.2)); }
    :host(.ph) .hdr .back svg { width: 12px; height: 20px; }
    :host(.ph) .main.sub { padding-top: calc(var(--sat, env(safe-area-inset-top, 0px)) + 55px); }
    :host(.ph) .main.sub .chips { margin-top: 19px; }
    :host(.ph) .main.sub h3 { margin: 32px 0 10px; }
    :host(.ph) .main.sub .scs + h3 { margin-top: 36px; }
    :host(.ph) .main.sub :is(.bds, .chips) + h3 { margin-top: 28.5px; }
    :host(.ph) .main.sub .grid + h3 { margin-top: 26px; }
    :host(.ph) { font-family: var(--ha-font-family-body, -apple-system, BlinkMacSystemFont, system-ui, sans-serif); }
    :host(.ph) .top h1 { letter-spacing: -0.5px; position: relative; top: 0.5px; }
    :host(.ph) h3 { letter-spacing: -0.3px; position: relative; top: 0.5px; }
    :host(.ph) .t .tx { position: relative; top: 0.7px; }
    :host(.ph) .t .tx > span { margin-top: 0.3px; }
    :host(.ph) .sc span { position: relative; top: 0.5px; }
    :host(.ph) .t b { letter-spacing: -0.01em; }
    :host(.ph) .t .tx > span { letter-spacing: -0.006em; }
  :host(.ph) .bd > div > span { color: rgba(235,235,245,0.74); }
    :host(.ph) .main { padding: calc(var(--sat, env(safe-area-inset-top, 0px)) + 55px) 16px calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 40px); }
    :host(.ph) .hdr { height: calc(var(--sat, env(safe-area-inset-top, 0px)) + 52px); }
    :host(.ph) .hdr .pill { top: calc(var(--sat, env(safe-area-inset-top, 0px)) + 4px); right: 16px; height: 40px; padding: 0 8px; background: var(--hv-tab-fill, rgba(40,40,44,.78)); }
    :host(.ph) .hdr .pill button { width: 40px; height: 40px; }
    :host(.ph) .hdr .pill s { height: 18px; margin: 0 2px; background: rgba(255,255,255,0.22); }
    :host(.ph) .hdr .pill .bc { left: 21px; top: 8px; }
    :host(.ph) .hdr .ok { top: calc(var(--sat, env(safe-area-inset-top, 0px)) + 4px); right: 16px; width: 40px; height: 40px; }
    :host(.ph) .top { gap: 10px; }
    :host(.ph) h1 { font-size: 34px; line-height: 41px; letter-spacing: 0; }
    :host(.ph) .top h1, :host(.ph) .main.catm .top h1 { margin-left: 0; min-height: 0; }
    :host(.ph) .top .wx { position: relative; right: auto; top: 0; flex: none; margin-left: auto; gap: 7px; }
    :host(.ph) .wx b { font-size: 15px; line-height: 15px; }
    :host(.ph) .wx em { font-size: 13px; font-weight: 500; line-height: 14px; }
    :host(.ph) .wx img { width: 27px; height: 26px; }
    :host(.ph) .chips { margin: 19px -16px 0 -3px; padding-right: 16px; gap: 10px; }
    :host(.ph) .chip { height: 42px; gap: 10px; padding: 0 15.4px 0 12px; background: var(--hemma-badge-bg, oklab(0.3 0 0 / .78)); }
    :host(.mini.ph.night) .chip:not(.on) { background: var(--hv-tab-fill, oklab(0.3 0 0 / .78)); }
    :host(.ph) .chip.on { background: #fff; }
    :host(.ph) .chip i { margin-left: 0; }
    :host(.ph) .chip > span { top: 0; }
    :host(.ph) .chip b { font-size: 13px; line-height: 16px; }
    :host(.ph) .chip span { font-size: 12px; line-height: 15px; }
    :host(.ph) h3 { margin: 32px 0 18px; font-size: 20px; line-height: 24px; }
    :host(.glass.ph) .top h1 { font-size: 38px; line-height: 46px; letter-spacing: -2px; }
    :host(.glass.ph) .chips { margin-top: 21px; margin-left: 0; }
    :host(.glass.ph) .chip { height: 43px; gap: 6px; padding: 0 14.4px 0 9px; }
    :host(.glass.ph) h3 { font-size: 18px; line-height: 21px; margin-bottom: 21px; }
    :host(.ph) .chips + h3 { margin-top: 38px; }
    :host(.ph) .chips + h3.nph { margin-top: 25px; }
    :host(.ph) h3.nph { margin-bottom: 19px; }
    :host(.ph) h3.lk { gap: 5px; }
    :host(.ph) h3.lk i { width: 13.5px; height: 17px; }
    :host(.ph) .bds { flex-wrap: nowrap; gap: 29px; margin: 22px -16px 0; padding: 0 16px 0 23px; overflow-x: auto; scrollbar-width: none; }
    :host(.ph) .bds::-webkit-scrollbar { display: none; }
    :host(.ph) .bds.cbds { margin-top: 26.5px; }
    :host(.ph) .bd { flex: none; gap: 4px; }
    :host(.ph) .bd > i, :host(.ph) .bd .g { width: 34px; height: 34px; }
    :host(.ph) .bd > div { padding-top: 0; }
    :host(.ph) .bd b { font-size: 13px; line-height: 16px; }
    :host(.ph) .bd span { font-size: 12px; font-weight: 500; line-height: 15px; }
    :host(.ph) .np { width: 100%; max-width: 398px; border-radius: 26px; }
    :host(.ph) .np .meta { padding-top: 8.5px; }
    :host(.ph) .scs { margin: 0 -16px; padding: 0 16px; }
    :host(.ph) .sc { width: min(41vw, 176px); border-radius: 26px; background: var(--hv-off, rgba(255,255,255,.09)); }
    :host(.ph) .sc.on { background: rgba(255,255,255,0.94); }
    :host(.ph) .scg { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px 10.5px; margin-top: 18px; }
    :host(.ph) .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 66px; gap: 8px; }
    :host(.ph) .pill .bc { display: none !important; }
    :host(.ph) .hdr .done { top: calc(var(--sat, env(safe-area-inset-top, 0px)) + 4px); right: 16px; height: 40px; }
    :host(.ph) .pk { width: 100%; max-height: none; border-radius: 0; padding-top: var(--sat, env(safe-area-inset-top, 0px)); }
    :host(.ph) .pill .nb i { width: 17px; height: 17px; }
    :host(.ph) .pill .nb i.bdg { width: 16.2px; height: 19.9px; }
    :host(.ph) .t { height: 66px; border-radius: 26px; gap: 10px; padding: 0 12px; background: var(--hv-off, rgba(255,255,255,.09)); }
    :host(.ph) .t.on { background: #fff; }
    :host(.ph) .t b { font-size: 15px; line-height: 21.8px; }
    :host(.ph) .t .tx > span { font-size: 13px; line-height: 20.6px; }
  .tbar, .nav { display: none; }
  :host(.tab) .tbar { display: contents; }
  :host(.tab) .page { grid-template-columns: 0 1fr; transition: grid-template-columns .34s cubic-bezier(.32,.72,0,1); }
  :host(.tab) .page.sideon { grid-template-columns: 264px 1fr; }
  :host(.tab) .side { overflow: hidden; padding: 88px 0 24px; white-space: nowrap; }
  :host(.tab) .side > :not(.tg) { margin-left: 10px; margin-right: 10px; width: 244px; }
  :host(.tab) .side .clock, :host(.tab) .hdr .mini { display: none; }
  .status, .batt { position: fixed; z-index: 30; top: calc(var(--sat, env(safe-area-inset-top, 0px)) + 7px); height: 18px; line-height: 18px; font-size: 13.5px; font-weight: 600; opacity: .84; white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums; }
  .status { left: 16px; }
  .status span { margin-left: .9em; }
  .batt { right: 15px; display: flex; align-items: center; }
  :host(.tab) .nav { position: absolute; z-index: 2; top: 36.5px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 44px; max-width: calc(100% - 240px); padding: 0 6.7px; border-radius: 9999px; overflow-x: auto; scrollbar-width: none; pointer-events: auto; background: var(--hv-tab-fill, var(--hemma-pill-fill, rgba(40,40,44,.78))); -webkit-backdrop-filter: var(--hemma-pill-backdrop, none); backdrop-filter: var(--hemma-pill-backdrop, none); transition: opacity .24s ease; }
  .nav::-webkit-scrollbar { display: none; }
  .nav button { all: unset; box-sizing: border-box; flex: none; height: 36px; padding: 0 16px; border-radius: 9999px; font-size: 17px; font-weight: 500; line-height: 36px; opacity: 1; cursor: pointer; white-space: nowrap; }
  .nav button.on { opacity: 1; background: var(--hv-nav-active, rgba(255,255,255,.16)); }
  .nav button { transition: background-color .16s ease; }
  .nav.lensing button.on { background-color: transparent !important; }
  .nlens { position: absolute; z-index: 3; pointer-events: none; border-radius: 9999px; overflow: hidden; box-shadow: 0 8px 22px -8px rgba(0,0,0,.3); }
  .nlens.drag { transition: left .14s cubic-bezier(.32,.72,0,1), width .14s cubic-bezier(.32,.72,0,1); }
  .nlens.drag .lm { transition: left .14s cubic-bezier(.32,.72,0,1), transform-origin .14s cubic-bezier(.32,.72,0,1); }
  .nlens .lb { position: absolute; inset: 0; z-index: 0; border-radius: inherit; background: rgba(255,255,255,.12); -webkit-backdrop-filter: blur(5px) saturate(1.4) brightness(1.08); backdrop-filter: blur(5px) saturate(1.4) brightness(1.08); }
  .hdr .nlens .nav.lm.lm { position: absolute; z-index: 1; left: 0; top: 0; display: flex; align-items: center; box-sizing: border-box; max-width: none; overflow: visible; transform: none; background: none; box-shadow: none; -webkit-backdrop-filter: none; backdrop-filter: none; opacity: 1; pointer-events: none; isolation: auto; transition: none; }
  .hdr .nlens .nav.lm::before, .hdr .nlens .nav.lm::after { display: none; }
  .hdr .nlens .nav.lm button { background: none !important; flex: none; }
  .nlens .lr { position: absolute; inset: 0; z-index: 2; box-shadow: inset 0 0 7px rgba(0,0,0,.12); border-radius: inherit; padding: 1.2px; background: linear-gradient(rgba(255,255,255,.95), rgba(255,255,255,.22) 28%, transparent 42%, transparent 60%, rgba(255,255,255,.16) 74%, rgba(255,255,255,.6)); -webkit-mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
  :host(.lt) .nlens .lb, :host(.glass.gd) .nlens .lb { background: rgba(255,255,255,.4); }
  .nav .tg, .side .tg { display: grid; place-items: center; padding: 0 12px; opacity: .9; }
  .tg svg { display: block; width: 16.7px; height: 13.2px; }
  .side .tg { all: unset; position: fixed; z-index: 31; left: 16px; top: 40.5px; height: 36px; padding: 0 12px; display: none; place-items: center; cursor: pointer; }
  :host(.tab) .page.sideon .side .tg { display: grid; }
  :host(.tab) .page.sideon .nav { opacity: 0; pointer-events: none; }
  :host(.tab) .hdr { height: 92px; }
  :host(.tab) .hdr .pill { top: 36.5px; right: 10px; padding: 0 6px; background: var(--hv-tab-fill, rgba(255,255,255,.2)); }
  :host(.tab) .hdr .pill button { width: 32px; }
  :host(.tab) .hdr .pill s { height: 18px; margin: 0 5.5px; background: rgba(255,255,255,0.22); }
  :host(.tab) .hdr .pill .bc { left: 18px; top: 4px; }
  :host(.tab) .hdr .done { top: 36.5px; right: 10px; }
  :host(.tab) .hdr .back { left: 22px; top: 113px; background: var(--hv-tab-fill, rgba(255,255,255,.2)); }
  :host(.tab) .main { padding: 110.5px 22px 60px; }
  :host(.tab) .top h1 { min-height: 0; line-height: 47px; }
  :host(.tab) .main.catm .top h1 { margin-left: 58px; }
  :host(.tab) .top .wx { position: relative; top: 1.5px; right: auto; flex: none; margin-left: auto; }
  :host(.tab) .chips { margin: 18px 0 0 -3px; }
  :host(.tab) .bds { margin-top: 21px; column-gap: 29px; }
  :host(.tab) .bds.cbds { margin-top: 25px; }
  :host(.tab) .bd { gap: 11px; }
  :host(.tab) .bd > i, :host(.tab) .bd .g { width: 34px; height: 34px; }
  :host(.tab) .bd span { font-weight: 500; }
  :host(.tab) .bd:has(> i) { gap: 8px; margin-right: 4px; }
  :host(.tab) .bd + .bd:has(> i) { margin-left: -7px; }
  :host(.tab) .cbds + h3 { margin-top: 30.4px; }
  :host(.tab) .chip > span { top: 0; }
  :host(.tab) .chip i { margin-left: 0.5px; }
  :host(.tab) .chip { height: 48px; background: var(--hv-tab-fill, oklab(0.3 0 0 / .78)); }
  :host(.tab) .chip.on { background: #fff; }
  :host(.tab) .np { border-radius: 26px; }
  :host(.tab) .scs { margin: 0 -22px; padding: 0 22px; }
  :host(.tab) .sc { width: 176px; border-radius: 26px; background: var(--hv-off, oklab(0.33 0 0 / .7)); }
  :host(.tab) .sc.on { background: rgba(255,255,255,0.94); }
  :host(.ph) .scg .sc { width: auto; }
  :host(.tab) .scg .sc { width: auto; background: var(--hv-off, oklab(0.33 0 0 / .7)); }
  :host(.tab) .grid { grid-auto-rows: 76px; }
  :host(.tab) .t { height: 76px; border-radius: 26px; padding: 0 10px; background: var(--hv-off, oklab(0.33 0 0 / .7)); }
  :host(.tab) .t.on { background: #fff; }
  .side button, .side .hd { letter-spacing: -0.01em; }
  :host(:not(.tab):not(.ph)) .main { padding-top: 35.5px; }
  :host(:not(.tab):not(.ph)) h1 { line-height: 46px; }
  :host(:not(.tab):not(.ph)) .main.home .top h1 { position: relative; top: 1px; }
  :host(:not(.tab):not(.ph)) .main.catm > .chips { position: relative; top: -1px; }
  :host(:not(.tab):not(.ph)) .top { padding-bottom: 6.5px; }
  :host(:not(.tab):not(.ph)) .main.home .top { padding-bottom: 5.5px; }
  :host(:not(.ph)) h3 { letter-spacing: 0.01em; }
  :host(:not(.tab):not(.ph)) .bd.aq { gap: 12px; }
  :host(:not(.tab):not(.ph)) .side .clock { margin-bottom: 26px; }
  :host(:not(.tab):not(.ph)) .side button { gap: 13px; }
  :host(:not(.tab):not(.ph)) .side button i { width: 24px; height: 24px; }
  :host(:not(.tab):not(.ph)) .side .hd { box-sizing: border-box; padding: 11px 12px 0; }
  :host(:not(.tab):not(.ph)) .t.on { box-shadow: 0 0.5px 1.5px rgba(0,0,0,0.08); }
  :host(:not(.ph)) .t b { letter-spacing: -0.01em; }
  :host(:not(.ph)) .t .tx > span { letter-spacing: -0.006em; }
  :host(:not(.tab):not(.ph)) .bds { gap: 6px 16px; margin: 11.5px 0 -10px -9px; }
  :host(:not(.tab):not(.ph)) .main.catm > .bds { margin-top: 21.5px; margin-bottom: -20px; }
  :host(:not(.tab):not(.ph)) .bd { box-sizing: border-box; height: 44px; padding: 0 6px 0 9px; gap: 10px; }
  :host(:not(.tab):not(.ph)) .bd:has(> i) { padding: 0 15px 0 4px; gap: 8px; }
  :host(:not(.tab):not(.ph)) .bd:has(> .g) + .bd:has(> i) { margin-left: -4px; }
  :host(:not(.tab):not(.ph)) .bd > i, :host(:not(.tab):not(.ph)) .bd .g { width: 34px; height: 34px; }
  :host(:not(.tab):not(.ph)) .bd .g i:first-child { inset: 8.5px; }
  :host(:not(.tab):not(.ph)) .bd > i.ml { -webkit-mask-size: 47%; mask-size: 47%; }
  :host(:not(.tab):not(.ph)) .bd > i.mm { -webkit-mask-size: 93%; mask-size: 93%; }
  :host(:not(.tab):not(.ph)) .bd > i.mo { -webkit-mask-size: 50%; mask-size: 50%; }
  :host(:not(.tab):not(.ph)) .bd > div { padding-top: 0; }
  :host(:not(.tab):not(.ph)) .bd b { line-height: 18.8px; }
  :host(:not(.tab):not(.ph)) .bd > div > span { line-height: 17.7px; margin-top: -0.3px; font-weight: 500; color: rgba(235,235,245,0.74); }
  .main.fx { overflow: hidden; padding: 0; --fu: clamp(10px, 0.575vw, 11.5px); --fuw: clamp(10px, 0.575vw, 12px); --fcol: clamp(290px, calc(var(--fu) * 29), 319px); --fh: clamp(160px, calc(22svh + (var(--fu) - 10px) * 42), min(calc(var(--fcol) / 1.487), 24svh)); }
  .main.fx .fhero { position: absolute; left: 17px; right: 22px; top: clamp(300px, 36vh, 620px); }
  .main.fx .fhero h1 { display: block; flex: none; min-height: 0; margin: 0 0 0 -2px; font-size: clamp(58px, calc(3.59vw + 6.2px), calc(var(--fu) * 8.2)); font-weight: 700; line-height: 1.18; letter-spacing: calc(var(--fuw) * -0.198); white-space: nowrap; }
  .main.fx .fwx { position: absolute; left: 0.8px; bottom: calc(100% + var(--fuw) * 0.8 - 0.8px); font-size: calc(var(--fuw) * 2.16); font-weight: 600; line-height: 1.2; letter-spacing: -0.2px; white-space: nowrap; }
  .main.fx .fhero .chips { margin: calc(var(--fu) * 2.2 - 2px) 0 0 -5px; }
  .main.fx .frow { position: absolute; left: 0; right: 0; bottom: 0; overflow-x: auto; overflow-y: hidden; padding: 20px 0 40px 17px; scrollbar-width: none; }
  .main.fx .frow::-webkit-scrollbar { display: none; }
  .main.fx .frow .grid { display: flex; flex-wrap: nowrap; gap: 8px; width: max-content; padding-right: 17px; grid-template-columns: none; }
  .main.fx .frow .t { flex: none; width: var(--fcol); height: var(--fh); border-radius: 26px; padding: 13px 15px 15px; display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 0; }
  .main.fx .frow .t .ic { width: calc(var(--fh) * 0.22); height: calc(var(--fh) * 0.22); font-size: calc(var(--fh) * 0.09); }
  .main.fx .frow .t .ic i { width: 63%; height: 63%; }
  .main.fx .frow .t .tx { width: 100%; }
  .main.fx .frow .t b { font-size: 18px; font-weight: 550; letter-spacing: -0.18px; line-height: 1.15; }
  .main.fx .frow .t .tx > span { font-size: 15px; line-height: 1.15; }
  :host(.edit) .main.fx .frow { right: 416px; }
  .main.fx.sub .fhero { left: 26px; }
  .main.fx.sub .frow { padding-left: 26px; }
  .ftg { display: none; }
  .main.fx .frow .t { position: relative; }
  .main.fx .frow .ftg { display: block; position: absolute; top: 22px; right: 15px; width: 42px; height: 24px; box-sizing: border-box; border-radius: 12px; background: transparent; box-shadow: inset 0 0 0 2px var(--hemma-toggle-off-color, rgba(255,255,255,.8)); transition: background-color .2s ease, box-shadow .2s ease; cursor: pointer; }
  .main.fx .frow .ftg::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: var(--hemma-toggle-off-color, rgba(255,255,255,.8)); transition: transform .2s ease, background-color .2s ease; }
  .main.fx .frow .ftg.on { background: var(--hemma-toggle-track-fill, rgba(0,0,0,.75)); box-shadow: none; }
  .main.fx .frow .ftg.on::after { transform: translateX(18px); background: #fff; }
  :host(.edit) .main.fx .frow .ftg { pointer-events: none; }
  :host(.tab) .main.fx { --fcol: clamp(237px, calc(3.76vw + 193.6px), 260px); --fh: calc(var(--fcol) / 1.487); }
  :host(.tab) .main.fx .fhero { left: calc(2.25vw + 3px); top: calc(33.14vh + 28.8px); }
  :host(.tab) .main.fx .fhero h1 { margin-left: -1px; font-size: clamp(53px, calc(4.29vw + 6.2px), 70px); letter-spacing: -1.5px; }
  :host(.tab) .main.fx .fwx { left: 2.4px; bottom: calc(100% + 9px); font-size: 21.6px; }
  :host(.tab) .main.fx .fhero .chips { margin: 19.5px 0 0 -4px; }
  :host(.tab) .main.fx .frow { padding-left: calc(2.25vw + 0.5px); }
  :host(.tab) .main.fx .frow .t { padding: 10px 12px 12px; }
  :host(.tab) .main.fx .frow .t .ic { width: calc(var(--fh) * 0.2625); height: calc(var(--fh) * 0.2625); }
  :host(.tab) .main.fx.sub .fhero { left: calc(2.25vw + 3px); }
  :host(.tab) .main.fx .frow .t b { font-size: 15px; letter-spacing: normal; line-height: 17.25px; }
  :host(.tab) .main.fx .frow .t .tx > span { font-size: 14px; line-height: 16.1px; }
  :host(.tab) .main.fx.sub .frow { padding-left: calc(2.25vw + 0.5px); }
  @media (orientation: portrait) { :host(.tab) .main.fx .fhero { top: 36vh; } }
  :host(.tab) .main.fx .chip:not(.on) { background: var(--hemma-badge-bg, oklab(0.37 0 0 / .5)); }
  .pill .wv { all: unset; box-sizing: border-box; width: 44px; height: 44px; display: grid; place-items: center; cursor: pointer; }
  .pill .wv span { display: flex; align-items: center; gap: 2.5px; height: 16px; }
  .pill .wv i { display: block; width: 2.5px; height: 35%; border-radius: 2px; background: currentColor; animation: wvb .9s ease-in-out infinite alternate; }
  .pill .wv i:nth-child(2) { animation-delay: -.3s; } .pill .wv i:nth-child(3) { animation-delay: -.6s; animation-duration: 1.1s; } .pill .wv i:nth-child(4) { animation-delay: -.15s; } .pill .wv i:nth-child(5) { animation-delay: -.45s; animation-duration: .8s; }
  @keyframes wvb { from { height: 25%; } to { height: 100%; } }
  .pill .wv span { gap: 2.2px; }
  .pill .wv i { width: 2.35px; border-radius: 1px; height: calc(6.6px * var(--lo, .6)); animation: wvh var(--d, .7s) ease-in-out var(--dl, 0s) infinite alternate; }
  .pill .wv i:nth-child(1) { --lo: .55; --hi: 1; --d: .73s; --dl: -.28s; } .pill .wv i:nth-child(2) { --lo: .65; --hi: 1.4; --d: .64s; --dl: -.76s; } .pill .wv i:nth-child(3) { --lo: .75; --hi: 1.7; --d: .81s; --dl: 0s; } .pill .wv i:nth-child(4) { --lo: .65; --hi: 1.35; --d: .68s; --dl: -.52s; } .pill .wv i:nth-child(5) { --lo: .55; --hi: 1; --d: .77s; --dl: -.98s; }
  @keyframes wvh { to { height: calc(6.6px * var(--hi, 1)); } }
  .fnp { position: absolute; z-index: 6; top: 97px; right: calc(4.5vw - 6px); width: 400px; pointer-events: auto; transform-origin: 100% 0; transition: opacity .3s cubic-bezier(.32,.72,0,1), transform .42s cubic-bezier(.32,.72,0,1), right .52s cubic-bezier(.32,.72,0,1); }
  .page.sideon .fnp { right: 18px; }
  :host(.tab) .fnp { top: 92px; right: 10px; width: 380px; }
  .fnp .nph { display: none; }
  .fnp .nps { flex-direction: column; }
  .fnp.min { opacity: 0; transform: translateY(-10px) scale(.96); pointer-events: none; }
  .fnp:not(.min) { filter: blur(0px); transition: opacity .32s cubic-bezier(.22,1,.36,1), filter .32s cubic-bezier(.22,1,.36,1), transform .42s cubic-bezier(.32,.72,0,1), right .52s cubic-bezier(.32,.72,0,1); }
  :host(.nco) .fnp:not(.min) { opacity: .3; filter: blur(10px); pointer-events: none; transition: opacity .32s cubic-bezier(.22,1,.36,1), filter .32s cubic-bezier(.22,1,.36,1); }
  @media (prefers-reduced-motion: reduce) { .fnp { transition: opacity .2s ease; } .fnp.min { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .pill .wv i { animation: none; height: 60%; } }
  .nav .scn { display: inline-flex; align-items: center; gap: 7px; }
  .nav .scn i { width: 8px; height: 13px; background: currentColor; opacity: .55; -webkit-mask: var(--i) center/contain no-repeat; mask: var(--i) center/contain no-repeat; }

  :host(.glass) .bdl::before { filter: blur(7px) saturate(1.02) brightness(.985); }
  :host(.fd) .page { grid-template-columns: 0 1fr; transition: grid-template-columns .52s cubic-bezier(.32,.72,0,1); }
  :host(.fd) .page.sideon { grid-template-columns: 264px 1fr; }
  :host(.fd) .side { position: relative; overflow: hidden; white-space: nowrap; }
  :host(.fd) .side { padding-top: 54px; padding-left: 0; padding-right: 0; }
  :host(.fd:not(.tab):not(.ph)) .side .clock { margin-bottom: 25px; }
  :host(.glass.fd:not(.tab):not(.ph)) .side button:not(.hp):not(.tg) { height: 44px; border-radius: 22px; font-size: 17px; font-weight: 500; }
  :host(.glass.fd:not(.tab):not(.ph)) .side .hd { height: 42px; font-size: 15px; }
  :host(.fd) .side > :not(.tg) { width: 244px; box-sizing: border-box; margin-left: 10px; margin-right: 10px; }
  :host(.fd:not(.tab):not(.ph)) .page .side button.tg { display: grid; position: absolute; left: 210px; top: 42px; width: 44px; height: 44px; padding: 0; border-radius: 50%; background: rgba(255,255,255,.07) radial-gradient(140% 90% at 50% -20%, rgba(255,255,255,.14), rgba(255,255,255,.04) 45%, transparent 62%); -webkit-backdrop-filter: blur(10px) saturate(1.2); backdrop-filter: blur(10px) saturate(1.2); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
  :host(.fd) .side .tg svg { width: 25px; height: 19.5px; }
  :host .side .tg svg.nvb { width: 25px; height: 19.5px; }
  :host(.mini.fd:not(.tab):not(.ph)) .page .side button.tg { background: rgba(255,255,255,.2); box-shadow: none; -webkit-backdrop-filter: none; backdrop-filter: none; }
  :host(.mini.lt.fd:not(.tab):not(.ph)) .page .side button.tg { background: rgba(255,255,255,.8); color: #111; }
  :host(.mini.fd:not(.tab):not(.ph)) .page .side button.tg::before, :host(.mini.fd:not(.tab):not(.ph)) .page .side button.tg::after { display: none; }
  :host(.fd) .nav { position: absolute; z-index: 2; top: 42px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 44px; max-width: calc(100% - 420px); padding: 0 6px; border-radius: 9999px; overflow-x: auto; scrollbar-width: none; pointer-events: auto; background: var(--hv-tab-fill, var(--hemma-pill-fill, rgba(40,40,44,.78))); transition: opacity .3s ease; }
  :host(.mini.fd) .nav { background: rgba(255,255,255,.2); }
  :host(.fd.cat:not(.tab):not(.ph)) .main:not(.fx) { padding-top: 39.1px; }
  :host(.glass.fd.cat:not(.tab):not(.ph)) .main:not(.fx) { padding-top: 43px; }
  :host(.fd.cat:not(.tab):not(.ph)) .hdr .back { top: 42px; }
  :host(.mini.lt.fd) .nav { background: rgba(255,255,255,.8); }
  :host(.mini.tab) .nav, :host(.mini.tab) .hdr .pill, :host(.mini.tab) .hdr .back, :host(.mini.ph) .hdr .pill, :host(.mini.ph) .hdr .back { background: rgba(255,255,255,.2); }
  :host(.mini.lt.tab) .nav, :host(.mini.lt.tab) .hdr .pill, :host(.mini.lt.tab) .hdr .back, :host(.mini.lt.ph) .hdr .pill, :host(.mini.lt.ph) .hdr .back { background: rgba(255,255,255,.8); }
  :host(.mini:not(.lt).tab) .hdr .pill s, :host(.mini:not(.lt).ph) .hdr .pill s { background: rgba(255,255,255,.3); }
  :host(.mini.ph) .hdr .pill.pill, :host(.mini.ph) .hdr .back.back { background: color-mix(in oklab, var(--hvbg) 78%, #fff); -webkit-backdrop-filter: none; backdrop-filter: none; }
  :host(.mini.lt.ph) .hdr .pill.pill, :host(.mini.lt.ph) .hdr .back.back { background: color-mix(in oklab, var(--hvbg) 12%, #fff); }
  :host(.mini.ph) .hdr .pill.pill, :host(.mini.ph) .hdr .back.back { box-shadow: 0 0 0 .5px rgba(255,255,255,.14), 0 1px 2px rgba(0,0,0,.1), 0 6px 16px -6px rgba(0,0,0,.28); }
  :host(.mini.lt.ph) .hdr .pill.pill, :host(.mini.lt.ph) .hdr .back.back { box-shadow: 0 0 0 .5px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.06), 0 6px 16px -6px rgba(0,0,0,.18); }
  :host(.fd) .nav button { height: 36px; line-height: 36px; padding: 0 16px; font-size: 16px; font-weight: 500; letter-spacing: -.2px; }
  :host(.fd) .side .clock { font-size: 18px; font-weight: 500; line-height: 21px; letter-spacing: 0; }
  :host(.fd) .nav .tg { padding: 0 12px; margin-right: 13.7px; }
  :host(.fd) .nav .tg svg { width: 18px; height: 14px; }
  :host(.fd) .page.sideon .nav { opacity: 0; pointer-events: none; }
  :host(.fd) .hdr .mini { display: none; }
  .fclk { display: none; }
  :host(.fd) .fclk { display: block; position: absolute; z-index: 2; left: calc(4.5vw - 2px); top: 53px; font-size: 18px; font-weight: 500; line-height: 21px; white-space: nowrap; font-variant-numeric: tabular-nums; pointer-events: none; transition: opacity .3s ease; }
  :host(.fd) .page.sideon .fclk { opacity: 0; }
  :host(.fd.cat) .fclk { display: none; }
  :host(.fd.cat:not(.tab):not(.ph)) .hdr .wx { right: calc(4.5vw + 112px); transition: right .52s cubic-bezier(.32,.72,0,1); }
  :host(.fd.cat:not(.tab):not(.ph)) .page.sideon .hdr .wx { right: 124px; }
  :host(.fd) .hdr .pill { top: 41px; right: calc(4.5vw - 6px); height: 46px; border-radius: 23px; transition: right .52s cubic-bezier(.32,.72,0,1); }
  :host(.fd) .page.sideon .hdr .pill { right: 18px; }
  :host(.fd) .main.fx .fhero, :host(.fd) .main.fx.sub .fhero { left: calc(4.5vw - 2px); transition: left .52s cubic-bezier(.32,.72,0,1); }
  :host(.fd) .main.fx .frow, :host(.fd) .main.fx.sub .frow { padding-left: calc(4.5vw - 2px); transition: padding-left .52s cubic-bezier(.32,.72,0,1); }
  :host(.fd) .page.sideon .main.fx .fhero { left: 27px; }
  :host(.fd) .page.sideon .main.fx .frow { padding-left: 27px; }
  :host(.glass.fd) .nav, :host(.glass) .hdr .pill { background: none; box-shadow: none; isolation: isolate; }
  :host(.glass.fd) .nav::before, :host(.glass) .hdr .pill::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none; background: rgba(255,255,255,.1); -webkit-backdrop-filter: blur(12px) saturate(1.4); backdrop-filter: blur(12px) saturate(1.4); box-shadow: inset 0 .5px 0 rgba(255,255,255,.1), inset 0 -.5px 0 rgba(255,255,255,.1), inset 0 3px 4px -3px rgba(255,255,255,.14), inset 0 -3px 4px -3px rgba(255,255,255,.1), inset 1px 0 0 rgba(0,0,0,.5), inset -1px 0 0 rgba(0,0,0,.5); }
  :host(.glass.fd) .nav::after, :host(.glass) .hdr .pill::after { content: ""; position: absolute; inset: 0; z-index: -1; box-sizing: border-box; border-radius: inherit; padding: 1px; pointer-events: none; -webkit-backdrop-filter: brightness(1.38); backdrop-filter: brightness(1.38); mask: linear-gradient(#000 0, rgba(0,0,0,.45) 13%, transparent 31%, transparent 69%, rgba(0,0,0,.45) 87%, #000 100%) intersect, linear-gradient(#000 0 0) subtract, linear-gradient(#000 0 0) content-box intersect; }
  :host(.glass.fd) .nav button.on { background: rgba(0,0,0,.26); }
  :host(.glass.tab:not(.gd)) .nav { background: rgba(108,108,108,.26); -webkit-backdrop-filter: blur(12px) saturate(1.45); backdrop-filter: blur(12px) saturate(1.45); box-shadow: inset 0 2px 2px -1px rgba(255,255,255,.07), inset 0 -2px 2px -1px rgba(255,255,255,.07); isolation: isolate; }
  :host(.glass.tab:not(.gd)) .nav::before { content: ""; position: absolute; inset: .5px; z-index: 0; padding: 1px; box-sizing: border-box; border-radius: 9999px; pointer-events: none; background: rgba(255,255,255,.34);
    -webkit-mask: linear-gradient(#000 0%, rgba(0,0,0,.3) 10%, transparent 22%, transparent 78%, rgba(0,0,0,.3) 90%, #000 100%), linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: source-in, xor;
    mask: linear-gradient(#000 0%, rgba(0,0,0,.3) 10%, transparent 22%, transparent 78%, rgba(0,0,0,.3) 90%, #000 100%), linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: intersect, exclude; }
  :host(.glass.tab:not(.gd)) .nav::after { content: ""; position: absolute; inset: -.5px; border-radius: 9999px; pointer-events: none; box-shadow: inset 0 0 0 .5px rgba(0,0,0,.58); -webkit-mask: linear-gradient(transparent 8%, rgba(0,0,0,.6) 20%, #000 32%, #000 68%, rgba(0,0,0,.6) 80%, transparent 92%); mask: linear-gradient(transparent 8%, rgba(0,0,0,.6) 20%, #000 32%, #000 68%, rgba(0,0,0,.6) 80%, transparent 92%); }
  :host(.glass.tab:not(.gd)) .nav button.on { background: rgba(0,0,0,.26); }
  :host(.glass) .nav button.on:not(.tg) { color: var(--hemma-color-orange, #FF9230); }
  :host(.glass.tab:not(.gd)) .nav button { opacity: 1; }
  :host(.fd) .side button.tg { transition: opacity .25s ease; }
  :host(.fd.edit) .side button.tg { opacity: 0; pointer-events: none; }
  :host(.glass) .hdr .pill s { background: rgba(60,60,67,.36); height: 18px; }
  :host(.glass) .hdr .back { background-color: rgba(255,255,255,.07); background-image: radial-gradient(140% 90% at 50% -20%, rgba(255,255,255,.14), rgba(255,255,255,.04) 45%, transparent 62%); -webkit-backdrop-filter: blur(10px) saturate(1.2); backdrop-filter: blur(10px) saturate(1.2); border-radius: 50%; }
  :host(.glass) .hdr .back::before { content: ""; position: absolute; inset: 0; border-radius: 50%; padding: 1px; pointer-events: none; background: conic-gradient(from 0deg, rgba(255,255,255,.10) 0deg, rgba(255,255,255,.05) 60deg, rgba(255,255,255,.10) 100deg, rgba(255,255,255,.26) 135deg, rgba(255,255,255,.10) 170deg, rgba(255,255,255,.05) 240deg, rgba(255,255,255,.10) 280deg, rgba(255,255,255,.46) 315deg, rgba(255,255,255,.10) 350deg 360deg); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; }
  :host(.glass) .hdr .back::after { content: ""; position: absolute; inset: -.5px; border-radius: 50%; padding: .5px; pointer-events: none; background: rgba(0,0,0,.3); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; }
  :host(.glass.focus.fd) .bdl::before { clip-path: none; background-image: linear-gradient(rgba(90,90,90,.3), rgba(90,90,90,.3)), var(--gph, none); filter: blur(7px) saturate(1.15) brightness(.985); }

  :host(.glass.focus) .bdl::before { filter: saturate(1.02) brightness(.985); }
  :host(.glass.gd) .bdl::before { background-image: linear-gradient(rgba(250,248,244,.34) 0%, rgba(250,248,244,.16) 45%, rgba(250,248,244,.26) 100%), var(--gph, none); }
  :host(.glass) .side { background: rgba(0,0,0,.42); -webkit-backdrop-filter: blur(30px) saturate(1.2); backdrop-filter: blur(30px) saturate(1.2); }
  :host(.glass.gd) .side { background: rgba(250,248,244,.62); }
  :host(.glass) .page, :host(.glass) .hdr { color: #fff; }
  :host(.glass.gd) .page, :host(.glass.gd) .hdr { color: #111; }
  :host(.glass:not(.tab):not(.ph)) .side button:not(.hp) { height: 40px; border-radius: 20px; font-size: 14px; font-weight: 500; }
  :host(.glass) .side button.on { background: rgba(255,255,255,.12); }
  :host(.glass.gd) .side button.on { background: rgba(255,255,255,.7); }
  :host(.glass) .side .hd { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.55); }
  :host(.glass.gd) .side .hd { color: rgba(0,0,0,.55); }
  :host(.glass.gd) .side .hd .hp, :host(.glass.gd) .side button[data-room] .rd { background: rgba(0,0,0,.08); }
  :host(.glass.gd) .side .hd .hp::before, :host(.glass.gd) .side button[data-room] .rd::before { background: #111; }
  :host(.glass) .ed { background: none; }
  :host(.glass) .ed::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: rgba(0,0,0,.42); -webkit-backdrop-filter: blur(30px) saturate(1.2); backdrop-filter: blur(30px) saturate(1.2); }
  :host(.glass.gd) .ed::before { background: rgba(250,248,244,.62); }
  :host(.glass) .edadd, :host(.glass) .edres { background: transparent; }
  :host(.glass) .ed .studio { transition: opacity .25s ease; }
  :host(.glass) .ed:has(.edadd.in:not(.out)) .studio, :host(.glass) .ed:has(.edres:not([hidden])) .studio { opacity: 0; pointer-events: none; }
  :host(.glass.gd) .ed, :host(.glass.gd) .er1 button, :host(.glass.gd) .eur button { color: #000; }
  :host .ed.ed { --edp: color-mix(in oklab, var(--hvbg) 45%, rgb(28 29 30)); --edc: color-mix(in oklab, var(--hvbg) 45%, rgb(60 61 62)); background: var(--edp); color: #fff; }
  :host(.glass) .ed.ed { --edp: #262628; --edc: #38383b; }
  :host(.glass) .ed.ed::before { display: none; }
  :host(.lt) .ed.ed, :host(.glass.gd) .ed.ed, :host(.lt) .ed .er1 button, :host(.lt) .ed .eur button, :host(.glass.gd) .ed .er1 button, :host(.glass.gd) .ed .eur button { color: #fff; }
  :host(.glass.gd) .er1 .edx, :host(.glass.gd) .eur { background: rgba(118,118,128,.14); }
  :host(.glass.gd) .edsr { background: rgba(118,118,128,.14); color: rgba(60,60,67,.6); }
  :host(.glass.gd) .edsr input { color: #000; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .top h1 { font-size: 34px; line-height: 40px; min-height: 40px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) h3 { font-size: 17px; line-height: 20px; font-weight: 600; margin: 34px 0 13.5px; }
  :host(.glass:not(.tab):not(.ph)) h3.lk i { width: 9px; height: 15px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); grid-auto-rows: 62px; gap: 10px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .grid .t { height: 62px; padding: 0 8px; border-radius: 20px; gap: 10px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .grid .t b { font-size: 13px; font-weight: 550; line-height: 15px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .grid .t .tx > span { font-size: 13px; line-height: 15px; }
  :host(.glass) .t:not(.on), :host(.glass) .sc:not(.on) { background: rgba(0,0,0,.4); -webkit-backdrop-filter: blur(22px) saturate(1.2); backdrop-filter: blur(22px) saturate(1.2); box-shadow: inset 0 1px 0 -.5px rgba(255,255,255,.1), 0 2px 8px rgba(0,0,0,.1); }
  :host(.glass.gd) .t:not(.on), :host(.glass.gd) .sc:not(.on) { background: rgba(255,255,255,.42); }
  :host(.glass) .t.on { box-shadow: 0 2px 10px rgba(0,0,0,.16), 0 0 3px rgba(0,0,0,.08); }
  :host(.glass) .t:not(.on) .ic { background: rgba(0,0,0,.2); color: #fff; }
  :host(.glass.gd) .t:not(.on) .ic { background: rgba(0,0,0,.08); color: rgba(0,0,0,.55); }
  :host(.glass:not(.gd)) .t:not(.on) .ic:not(.num):not(.pic) { color: var(--c, #fff); }
  :host(.glass.night) .t[data-d="media_player"]:not(.on) .ic:not(.num):not(.pic), :host(.glass:not(.gd)) .t[data-d="media_player"]:not(.on) .ic:not(.num):not(.pic) { color: rgba(255,255,255,.95); }
  :host(.glass) .t:not(.on) b { color: rgba(255,255,255,.98); }
  :host(.glass) .t:not(.on) .tx > span { color: rgba(255,255,255,.56); }
  :host(.glass.gd) .t:not(.on) b { color: rgba(0,0,0,.85); }
  :host(.glass.gd) .t:not(.on) .tx > span { color: rgba(0,0,0,.55); }
  :host(.glass) .sc:not(.on) { color: rgba(255,255,255,.9); }
  :host(.glass.gd) .sc:not(.on) { color: rgba(0,0,0,.85); }
  :host(.glass) .chip:not(.on) { background: rgba(0,0,0,.3); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: none; }
  :host(.glass.gd) .chip:not(.on) { background: rgba(255,255,255,.72); }
  :host(.glass) .chip span { color: rgba(240,240,240,.9); }
  :host(.glass.gd) .chip span { color: rgba(0,0,0,.58); }
  :host(.glass.gd) .chip b { color: #111; }
  :host(.glass) .chip:not(.on) i { background: var(--c, #fff); }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .chip { height: 44px; padding: 3px 12px 3px 7px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .chip span { font-size: 12px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .chip b { font-size: 13px; }
  :host(.glass:not(.tab):not(.ph)) .main.fx .chip b { font-size: 15px; line-height: 17px; }
  :host(.glass:not(.tab):not(.ph)) .main.fx .chip span { font-size: 14px; line-height: 16px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) { padding-top: 42.5px; }
  :host(.glass:not(.tab):not(.ph):not(.cat)) .main:not(.fx) { padding-top: 37.5px; }
  :host(.glass:not(.tab):not(.ph):not(.cat):not(.fd)) .bdl.bdl::before { background-image: linear-gradient(rgba(55,55,55,.5), rgba(55,55,55,.5)), var(--gpg, var(--gph, none)); filter: saturate(1.02) brightness(.985); }
  :host(.glass.gd:not(.tab):not(.ph):not(.cat):not(.fd)) .bdl.bdl::before { background-image: linear-gradient(rgba(250,248,244,.34) 0%, rgba(250,248,244,.16) 45%, rgba(250,248,244,.26) 100%), var(--gpg, var(--gph, none)); }
  :host(.glass.focus.fd:not(.cat)) .bdl.bdl::before { background-image: linear-gradient(rgba(90,90,90,.3), rgba(90,90,90,.3)), var(--gpg, var(--gph, none)); filter: saturate(1.15) brightness(.985); }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .chips { margin: 14.5px 0 0 0; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .chip { gap: 5.5px; }
  :host(.glass.tab) .main.fx .chip { height: 44px; padding: 3px 14px 3px 9px; gap: 7.5px; }
  :host(.glass.tab) .main.fx .chips { margin-left: -1px; column-gap: 10px; }
  :host(.glass.tab) .main.fx .chip b { font-size: 13px; }
  :host(.glass.tab) .main.fx .chip span { font-size: 12px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .chips + h3 { margin-top: 29.6px; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .scs + h3 { margin-top: 35.6px; }
  :host(.glass) .np { background: rgba(0,0,0,.1); --np1: transparent; -webkit-backdrop-filter: blur(22px) saturate(1.2); backdrop-filter: blur(22px) saturate(1.2); }
  :host(.glass) .np { border-radius: 26px; overflow: hidden; isolation: isolate; box-shadow: inset 0 .5px 0 rgba(255,255,255,.34), inset 0 0 0 .5px rgba(255,255,255,.1), inset 0 -.5px 0 rgba(255,255,255,.1); }
  :host(.glass) .np::before { content: ""; display: block; position: absolute; inset: -56px -118px; z-index: -1; border-radius: 0; background: var(--npa, none) 50% 50% / cover no-repeat; filter: blur(52px) saturate(1.5); opacity: .3; pointer-events: none; }
  :host(.glass) .np::after { content: ""; display: block; position: absolute; inset: 0; z-index: -1; border-radius: 0; background: linear-gradient(105deg, rgba(0,0,0,.23) 0%, rgba(0,0,0,.086) 62%, rgba(0,0,0,.165) 100%); pointer-events: none; }
  :host(.glass) .np .ctl { left: 138px; right: 16px; justify-content: center; }
  :host(.glass:not(.tab):not(.ph)) .main:not(.fx) .np { width: 349px; }
`;

class HemmaNativePanel extends HTMLElement {
  constructor() {
    super();
    this._host = document.createElement("hemma-native-layer");
    this._root = this._host.attachShadow({ mode: "open" });
    const mem = this._styleMem();
    if (mem && mem.glass) {
      this._host.classList.add("glass");
      if (mem.gph) { this._gph = mem.gph; this._host.style.setProperty("--gph", mem.gph); this._host.style.setProperty("--gpg", mem.gpg); }
    }
    this._layout = null;
    this._room = 0;
    this._painted = {};
  }

  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (this._stale(h)) return;
    if (first) this._boot();
    else if (this._layout) { this._hvSet(); this._refresh(); }
    if (this._pop) this._pop.panel.hass = h;
    if (this._studioWarm && !this._edit) { clearTimeout(this._edHassT); this._edHassT = setTimeout(() => { if (this._studioWarm) this._studioWarm.hass = this._hass; }, 2000); }
    else if (this._studioWarm) this._studioWarm.hass = h;
  }

  _stale(h) {
    const p = h.panels && h.panels["hemma-native"], u = p && p.config && p.config._panel_custom && p.config._panel_custom.module_url;
    const v = u && (u.match(/[?&]v=(\d+)/) || [])[1];
    if (!BUILD || !v || v === BUILD || this._edit || this._pop || document.querySelector("dialog[open]")) return false;
    try { if (sessionStorage.getItem("hemma_native_reload") === v) return false; sessionStorage.setItem("hemma_native_reload", v); } catch (e) { return false; }
    location.reload();
    return true;
  }

  connectedCallback() {
    document.body.appendChild(this._host);
    this._lookOn();
    this._route(true);
    this._onCount = () => this._bell();
    window.addEventListener("hemma-notify-count", this._onCount);
    if (!this._onPhotos) { this._onPhotos = () => { if (this._layout && !this._edit) this._renderKeep(); }; window.addEventListener("hemma-photos-signed", this._onPhotos); }
    this._bell();
    const grain = () => {
      const c = document.documentElement.classList, lt = (c.contains("hemma-hv") && c.contains("hv-light")) || (c.contains("hg-ink-d") && !c.contains("hemma-hv"));
      this._host.classList.toggle("grain", c.contains("hv-bd-gradient") && !this._isGlass());
      this._host.classList.toggle("lt", lt);
      this._host.classList.toggle("inkw", c.contains("hemma-hv") && c.contains("hv-ink-w"));
      this._host.classList.toggle("gd", c.contains("hg-ink-d") && !c.contains("hemma-hv"));
      this._host.classList.toggle("nco", c.contains("hemma-nc-open"));
      this._host.classList.toggle("bdc", c.contains("hv-bd-color"));
      const st = this._studioWarm;
      if (st && st._embedLight !== lt) { st._embedLight = lt; st.classList.toggle("is-light", lt); }
    };
    this._htmlMo = new MutationObserver(grain);
    this._htmlMo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    grain();
    this._mq = window.matchMedia("(pointer: coarse) and (min-width: 769px)");
    this._mqp = window.matchMedia("(max-width: 768px)");
    if (PV) PVD = PV;
    const dev = () => { this._host.classList.toggle("tab", PV ? PVD === "tablet" : this._mq.matches); this._host.classList.toggle("ph", PV ? PVD === "phone" : this._mqp.matches); };
    const insets = () => {
      const ph = PVD === "phone", E = document.documentElement.style;
      [[this._host.style, "--sat", "--sab"], [E, "--hemma-sat", "--hemma-sab"], [E, "--app-safe-area-inset-top", "--app-safe-area-inset-bottom"]].forEach(([st, t, b]) => {
        if (ph) { st.setProperty(t, "59px"); st.setProperty(b, "34px"); } else { st.removeProperty(t); st.removeProperty(b); }
      });
    };
    this._pvSetDev = (d) => { if (!PV || d === PVD) return; PVD = d; dev(); insets(); if (this._layout) this._render(); };
    this._onMq = () => { dev(); if (this._layout) this._render(); };
    this._mq.addEventListener("change", this._onMq);
    this._mqp.addEventListener("change", this._onMq);
    dev();
    if (PV) { window.__hemmaNativePv = this; this._host.classList.add("pvkid"); insets(); }
    this._onKey = (e) => { if (e.key === "Escape" && this._edit && !this._root.querySelector(".al, .edadd") && !(this._root.querySelector(".edq") || {}).value) this._edCancel(); };
    this._onKeyCap = (e) => {
      if (!this._edit) return;
      const k = String(e.key).toLowerCase(), t = e.composedPath()[0], typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && k === "k") || (k === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        const q = this._root.querySelector(".edq");
        if (!q) return;
        e.preventDefault(); e.stopImmediatePropagation();
        q.focus(); q.select();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !typing && (k === "z" || (k === "y" && e.ctrlKey && !e.shiftKey)) && !this._root.querySelector(".al")) {
        e.preventDefault(); e.stopImmediatePropagation();
        this._edUndo(e.shiftKey || k === "y");
      }
    };
    window.addEventListener("keydown", this._onKeyCap, true);
    window.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    if (this._edit) this._edDraft();
    if (this._onUnload) window.removeEventListener("beforeunload", this._onUnload);
    document.documentElement.classList.remove("hemma-editing");
    if (this._htmlMo) { this._htmlMo.disconnect(); this._htmlMo = null; }
    if (this._mq) { this._mq.removeEventListener("change", this._onMq); this._mqp.removeEventListener("change", this._onMq); }
    window.removeEventListener("keydown", this._onKey);
    window.removeEventListener("keydown", this._onKeyCap, true);
    this._host.remove();
    this._lookOff();
    this._route(false);
    window.removeEventListener("hemma-notify-count", this._onCount);
  }

  _lookOn() {
    let look = null;
    try { look = JSON.parse(localStorage.getItem("hemma_ha_look") || "null"); } catch (e) {}
    let own = null;
    try { own = JSON.parse(localStorage.getItem("hemma_native_look") || "null"); } catch (e) {}
    if (!look && !own) return;
    const mem = this._styleMem();
    if (mem && mem.glass) { own = own ? { vars: own.vars, cls: (own.cls || []).filter((c) => c.startsWith("hg-")) } : { vars: {}, cls: [] }; look = null; }
    const H = document.documentElement;
    this._cls = [...new Set([].concat(own ? own.cls || [] : (look.cls || [])))].filter((c) => !H.classList.contains(c));
    this._cls.forEach((c) => H.classList.add(c));
    if (own && own.vars && own.vars["--hv-bg"] && !own.vars["--hv-backdrop"]) own.vars["--hv-backdrop"] = `linear-gradient(${own.vars["--hv-bg"]}, ${own.vars["--hv-bg"]})`;
    const vars = own ? Object.assign({}, own.vars) : Object.assign({}, look.vars || {}, (look.comp || {})["--hv-bg"] ? { "--hv-bg": look.comp["--hv-bg"] } : {});
    this._vars = Object.keys(vars).filter((k) => own || !H.style.getPropertyValue(k));
    this._vars.forEach((k) => H.style.setProperty(k, vars[k]));
    this._bootVars = {};
    this._vars.forEach((k) => { this._bootVars[k] = H.style.getPropertyValue(k); });
  }

  _lookOff() {
    const H = document.documentElement;
    (this._cls || []).forEach((c) => H.classList.remove(c));
    (this._vars || []).forEach((k) => H.style.removeProperty(k));
    this._cls = this._vars = null;
  }

  _route(on) {
    if (!on) { if (window.hemmaPopup && window.hemmaPopup._native && this._core) window.hemmaPopup = this._core; return; }
    if (!this._hass) return;
    if (window.hemmaPopup && !window.hemmaPopup._native) this._core = window.hemmaPopup;
    const core = this._core && typeof this._core.open === "function" ? this._core : null;
    window.hemmaPopup = core ? Object.assign(Object.create(core), { _native: true }) : {
      _native: true,
      open: (data) => { const c = data && data.content; if (c && c.entity) this._openPanel(c.entity, c); },
      close: () => this._closePanel(),
      moreInfo: (entityId) => this._moreInfo(entityId),
    };
  }

  async _notifyCfg() {
    const N = window._hemmaNotify;
    if (!N) return;
    try {
      const cfg = await this._hass.callWS({ type: "lovelace/config", url_path: "hemma-dashboard" });
      window.hemmaNativeLL = cfg;
      for (const v of cfg.views || []) {
        const room = (v.cards || []).find((c) => [].concat(c.template || []).includes("hemma_room"));
        if (room && room.variables) { this._dashV = room.variables; window._hemmaNotifyCfg = room.variables; N.configureFrom(room.variables); break; }
      }
      N.refresh();
      this._hvSet();
    } catch (e) {}
  }

  _darkNow() {
    if (typeof this._pvDark === "boolean") return this._pvDark;
    const H = this._hass || {};
    return typeof (H.themes || {}).darkMode === "boolean" ? H.themes.darkMode : window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  _hvSet() {
    const V = this._dashV, H = this._hass;
    if (!V || !window._hemmaHV || !H) return;
    const dark = this._darkNow();
    document.documentElement.classList.toggle("hg-ink-d", V.hemma_style !== "homeview" && !dark && V.hemma_glass_text === "dark");
    this._host.classList.toggle("night", !!dark);
    const key = JSON.stringify([V.hemma_style, dark, V.hemma_hv_color, V.hemma_hv_rest, V.hemma_hv_text, V.hemma_hv_backdrop, V.hemma_glass_text]);
    if (dark === this._hvDark && key === this._hvKey) return;
    this._hvDark = dark;
    this._hvKey = key;
    try { window._hemmaHV.set(V.hemma_style, dark, V.hemma_hv_color, V.hemma_hv_rest, V.hemma_hv_text, V.hemma_hv_backdrop, V.hemma_glass_text); } catch (e) {}
    if (V.hemma_style !== "homeview" && this._cls && this._cls.length) { this._cls.forEach((c) => { if (c === "hemma-hv" || c.startsWith("hv-")) document.documentElement.classList.remove(c); }); this._cls = []; }
    this._lookRelease();
    this._lookSave();
    this._flatSync();
  }

  _lookRelease() {
    const H = document.documentElement, boot = this._bootVars;
    if (!boot) return;
    this._bootVars = null;
    Object.keys(boot).forEach((k) => {
      if (H.style.getPropertyValue(k) !== boot[k]) return;
      H.style.removeProperty(k);
      if (!getComputedStyle(H).getPropertyValue(k).trim()) H.style.setProperty(k, boot[k]);
    });
  }

  _lookSave() {
    try {
      const E = document.documentElement, vars = {}, cs = getComputedStyle(E);
      for (const k of E.style) if (k.startsWith("--hv-")) vars[k] = E.style.getPropertyValue(k);
      for (const k of ["--hv-bg", "--hv-backdrop", "--hv-bg-solid", "--hv-veil"]) { const v = cs.getPropertyValue(k).trim(); if (v) vars[k] = v; }
      const cls = [...E.classList].filter((c) => /^(hemma-hv|hv-|hg-)/.test(c));
      if (!PV && typeof this._pvDark !== "boolean") localStorage.setItem("hemma_native_look", JSON.stringify({ vars, cls }));
    } catch (e) {}
  }

  _bell() {
    const b = this._root.querySelector(".pill .bc");
    if (!b) return;
    const n = window._hemmaNotify ? window._hemmaNotify.count : 0;
    const t = n > 99 ? "99+" : String(n);
    if (b.textContent !== t) b.textContent = t;
    b.classList.toggle("on", n > 0);
    const i = b.parentNode && b.parentNode.querySelector("i"), badged = n > 0 && this._host.classList.contains("ph");
    if (i && i.classList.contains("bdg") !== badged) { i.classList.toggle("bdg", badged); i.style.setProperty("--i", this._icon(badged ? "bell-badge" : "bell")); }
  }

  set narrow(_) {}
  set route(_) {}
  set panel(_) {}

  async _boot() {
    let bg = "rgb(80, 109, 109)", comp = {};
    try { bg = localStorage.getItem("hemma_hv_bg") || bg; comp = (JSON.parse(localStorage.getItem("hemma_ha_look") || "null") || {}).comp || {}; const own = (JSON.parse(localStorage.getItem("hemma_native_look") || "null") || {}).vars; if (own && own["--hv-bg"]) { comp = own; bg = own["--hv-bg"]; } } catch (e) {}
    const H = this._host.style;
    H.setProperty("--hvbg", `var(--hv-bg, ${comp["--hv-bg"] || bg})`);
    H.setProperty("--bd", `var(--hv-backdrop, ${comp["--hv-backdrop"] || `linear-gradient(160deg, color-mix(in oklab, ${bg} 90%, #fff), ${bg} 55%, color-mix(in oklab, ${bg} 75%, #000))`})`);
    H.setProperty("--solid", `var(--hv-bg-solid, ${comp["--hv-bg-solid"] || `linear-gradient(rgba(255,255,255,0.16), rgba(255,255,255,0.16)), ${bg}`})`);
    H.setProperty("--veil", `var(--hv-veil, ${comp["--hv-veil"] || `linear-gradient(${bg} 46%, transparent)`})`);
    H.setProperty("--chev", `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`);
    this._root.addEventListener("click", (e) => { const t = e.composedPath().find((n) => n.classList && (n.classList.contains("t") || n.classList.contains("np"))); if (t) { this._tapEl = t; this._tapAt = Date.now(); } }, true);
    this._root.innerHTML = `<style>${CSS}</style><div class="bdl"></div><div class="page"><nav class="side"></nav><div class="col"><main class="main"></main><div class="hdr"><div class="veil"></div>${[[1, 72, 100], [2, 58, 88], [4, 44, 76], [8, 30, 64], [14, 16, 52], [22, 0, 40]].map(([b, a, z]) => `<i class="vb" style="--vb:blur(${b}px)${b > 8 ? " saturate(1.2)" : ""};--vm:linear-gradient(to bottom, #000 ${a}%, transparent ${z}%)"></i>`).join("")}<div class="mini"></div><div class="nav"></div></div></div><div class="tbar"><div class="status"></div><div class="batt"></div></div></div>`;
    if (!customElements.get("hemma-icon") && !window.hemmaIconUrl) {
      try {
        const res = await this._hass.callWS({ type: "lovelace/resources" });
        const hit = (res || []).find((r) => /hemma-icons\.js/.test(r.url));
        if (hit) await import(hit.url);
      } catch (e) {}
    }
    await this._loadPanels();
    const got = await this._hass.callWS({ type: "hemma/native/get" });
    this._layout = got.layout && got.layout.version >= 2 ? got.layout : await this._import();
    try { await this._addSensors(); } catch (e) {}
    await this._chipCfg();
    const want = (location.pathname.split("/")[2] || "");
    const at = this._layout.rooms.findIndex((r) => r.id === want);
    this._room = at >= 0 ? at : 0;
    this._page = want === "home" ? "home" : want === "scenes" ? "scenes" : want.indexOf("c-") === 0 && CATS.some(([k]) => k === want.slice(2)) ? want.slice(2) : at >= 0 || want ? "room" : "home";
    this._render();
    setTimeout(() => (window.requestIdleCallback || ((f) => setTimeout(f, 0)))(() => { if (this.isConnected) this._edStudio().catch(() => {}); }), 3000);
  }

  async _loadPanels() {
    let res = [];
    try { res = await this._hass.callWS({ type: "lovelace/resources" }); } catch (e) {}
    (res || []).filter((r) => r.type === "css" && r.url).forEach((r) => {
      if (![...document.querySelectorAll("link[rel=stylesheet]")].some((l) => l.getAttribute("href") === r.url)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = r.url; document.head.appendChild(l); }
    });
    if (window.hemmaPopup && window.hemmaPopup._native && !this._core) delete window.hemmaPopup;
    for (const n of ["hemma-core.js", "hemma-i18n.js", "hemma-icons.js", "hemma-cards.js"]) {
      const hit = (res || []).find((r) => r.url.indexOf(n) >= 0);
      if (hit) { try { await import(hit.url); } catch (e) { console.warn("Hemma native could not load", n, e); } }
    }
    if (this.isConnected) this._route(true);
    this._notifyCfg();
  }

  _moreInfo(id) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  _openPanel(id, content, opts) {
    const kind = content && content.type ? String(content.type).replace(/^custom:hemma-|-panel$/g, "") : PANELS[domainOf(id)];
    const tag = kind && "hemma-" + kind + "-panel";
    if (!tag || !customElements.get(tag)) { this._moreInfo(id); return; }
    this._closePanel(true);
    const st = this._hass.states[id];
    const t = (this._layout.rooms[this._room].tiles || []).find((x) => x.entity === id) || {};
    const name = t.name || (st ? this._shortName(id, st.attributes.friendly_name || id) : id);
    const core = this._core && typeof this._core.open === "function" ? this._core : null;
    if (core) {
      const from = this._tapEl && this._tapEl.isConnected && Date.now() - this._tapAt < 1000 ? this._tapEl : null;
      this._tapEl = null;
      if (kind === "media" && from && from.classList.contains("np") && window.hemmaMediaFull) { window.hemmaMediaFull.open(Object.assign({ entity: id, name }, content || {}, { type: undefined }), from.querySelector(".art") || from); return; }
      core.open(Object.assign({}, opts || {}, { content: Object.assign({ entity: id, name }, content || {}, { type: "custom:" + tag }) }), this._origin(from));
      return;
    }
    const panel = document.createElement(tag);
    panel.hass = this._hass;
    try { panel.setConfig(Object.assign({ entity: id, name }, content || {}, { type: undefined })); } catch (e) { this._moreInfo(id); return; }
    panel.hass = this._hass;
    const pop = document.createElement("div");
    pop.className = "pop";
    const card = document.createElement("div");
    card.className = "card";
    card.appendChild(panel);
    pop.appendChild(card);
    pop.addEventListener("click", (e) => { if (e.target === pop) this._closePanel(); });
    this._root.appendChild(pop);
    this._pop = { el: pop, panel };
    this._esc = (e) => { if (e.key === "Escape") this._closePanel(); };
    document.addEventListener("keydown", this._esc);
  }

  _origin(el) {
    if (!el || !el.isConnected || !el.classList.contains("t")) return null;
    const q = { "ha-card": el, "#img-cell": el.querySelector(".ic"), "#name": el.querySelector(".tx b"), "#state": el.querySelector(".tx > span") };
    return { shadowRoot: { querySelector: (sel) => q[sel] || null }, style: el.style, get isConnected() { return el.isConnected; }, getBoundingClientRect: () => el.getBoundingClientRect() };
  }

  _closePanel(now) {
    const p = this._pop;
    if (!p) return;
    this._pop = null;
    document.removeEventListener("keydown", this._esc);
    if (now) { p.el.remove(); return; }
    p.el.classList.add("out");
    setTimeout(() => p.el.remove(), 200);
  }

  _roomsFromCfg(cfg) {
    const S = this._hass.states, rooms = [];
    for (const v of cfg.views || []) {
      const cards = v.cards || [];
      const room = cards.find((c) => [].concat(c.template || []).includes("hemma_room"));
      if (!room || v.path === "home") continue;
      const tiles = [], raw = [];
      const walk = (c) => {
        if (!c || typeof c !== "object") return;
        if (Array.isArray(c)) { c.forEach(walk); return; }
        if (c.entity && c.type === "custom:button-card") {
          if (!raw.some((x) => x.entity === c.entity)) raw.push({ tpl: [].concat(c.template || []), entity: c.entity, name: typeof c.name === "string" && c.name.indexOf("[[[") < 0 ? c.name : "", V: c.variables || {} });
          const st = S[c.entity];
          const members = st && domainOf(c.entity) === "light" && Array.isArray(st.attributes.entity_id) ? st.attributes.entity_id : null;
          (members || [c.entity]).forEach((e) => {
            if (tiles.some((t) => t.entity === e)) return;
            const nm = !members && typeof c.name === "string" && c.name.indexOf("[[[") < 0 ? c.name : undefined;
            tiles.push(nm ? { entity: e, name: nm } : { entity: e });
          });
        }
        ["cards", "card"].forEach((k) => c[k] && walk(c[k]));
      };
      walk(cards);
      const slug = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      const area = Object.values(this._hass.areas || {}).find((a) => slug(a.name) === slug(v.title || v.path) || slug(a.area_id) === slug(v.path));
      const name = (typeof room.name === "string" && room.name.indexOf("[[[") < 0 && room.name.trim()) || (area && area.name) || v.title || String(v.path).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      rooms.push({ id: v.path, name, area: area ? area.area_id : null, image: (room.variables || {}).image || "", icon: (room.variables || {}).room_icon || null, sensors: this._sensorsOf(room.variables || {}), V: room.variables || {}, tiles, cards: raw });
    }
    return rooms;
  }

  _applyRooms(cfg) {
    const rooms = this._roomsFromCfg(cfg);
    if (!rooms.length) return;
    const cur = (this._layout.rooms[this._room] || {}).id;
    this._layout.rooms = rooms;
    const i = rooms.findIndex((r) => r.id === cur);
    if (i >= 0) this._room = i;
    else { this._room = 0; if (this._page === "room") this._page = "home"; }
  }

  async _import() {
    const cfg = await this._hass.callWS({ type: "lovelace/config", url_path: "hemma-dashboard" });
    const rooms = this._roomsFromCfg(cfg);
    const layout = { version: 4, rooms };
    await this._hass.callWS({ type: "hemma/native/save", layout, note: "Imported from the dashboard" });
    return layout;
  }

  _sensorsOf(V) {
    return { temp: V.temp_sensor_1 || V.aqi_entity_temp || null, humidity: V.humidity_sensor || V.aqi_entity_humidity || null, quality: V.quality_sensor || null, aqi: [V.aqi_entity_pm25, V.aqi_entity_pm10, V.aqi_entity_voc, V.aqi_entity_co2].filter(Boolean), lights: V.light_group_entity || null, motion: V.motion_entity || null, cameras: Array.isArray(V.cameras_list) ? V.cameras_list.filter(Boolean) : [] };
  }

  async _addSensors() {
    this._applyRooms(await this._hass.callWS({ type: "lovelace/config", url_path: "hemma-dashboard" }));
  }

  _save(note) {
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => {
      this._hass.callWS({ type: "hemma/native/save", layout: this._layout, note }).catch((e) => console.warn("Hemma native save failed", e));
    }, 400);
  }

  _sectionOf(id) {
    const d = domainOf(id);
    const hit = SECTIONS.find(([, , ds]) => ds.includes(d));
    return hit ? hit[0] : "other";
  }

  _state(id) {
    const st = this._hass.states[id];
    if (!st) return { on: false, text: "Not found" };
    const d = domainOf(id), a = st.attributes || {};
    let text;
    try { text = this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state; } catch (e) { text = st.state; }
    if (d === "light" && st.state === "on" && a.brightness != null) text = Math.round(a.brightness / 2.55) + "%";
    if (d === "climate") {
      const act = a.hvac_action, t = a.temperature;
      text = act === "cooling" && t != null ? `Cooling to ${t}°` : act === "heating" && t != null ? `Heating to ${t}°` : text;
    }
    if (text === st.state) text = String(text).charAt(0).toUpperCase() + String(text).slice(1).replace(/_/g, " ");
    if (d === "plant") text = st.state === "ok" ? "Healthy" : st.state === "problem" ? "Needs care" : text;
    const on = ["on", "open", "playing", "heat", "cool", "heat_cool", "auto", "dry", "fan_only", "unlocked"].includes(st.state) || (d === "climate" && st.state !== "off") || (d === "person" && st.state === "home");
    return { on, text };
  }

  _tileHtml(t, room = this._layout.rooms[this._room]) {
    if (t.entity === "__cameras") {
      const cams = ((room.sensors || {}).cameras || []), R = this._roomSensors(room);
      const busy = R.motion.some((id) => id.indexOf("event.") === 0 ? Date.now() - this._eventAt(id) < 60000 : (this._hass.states[id] || {}).state === "on");
      return `<button type="button" class="t" data-e="__cameras" data-r="${this._layout.rooms.indexOf(room)}" data-n="${cams.length}"><span class="ic"><i style="--i:${this._icon("doorbell")}"></i></span><span class="tx"><b>${esc(T("cameras.title", "Cameras"))}</b><span>${busy ? esc(T("cameras.motion", "Motion")) : esc(T("cameras.no_alerts", "No Alerts"))}</span></span></button>`;
    }
    const st = this._hass.states[t.entity], s = this._state(t.entity), d = domainOf(t.entity);
    const name = t.name || (st && st.attributes.friendly_name) || t.entity;
    const short = t.name ? t.name : this._shortName(t.entity, name, room);
    return `<button type="button" class="t${s.on ? " on" : ""}" data-e="${esc(t.entity)}" style="--c:${ON_COLOR[d] || FALLBACK_C}"><span class="ic"></span><span class="tx"><b>${esc(short)}</b><span>${esc(s.text)}</span></span></button>`;
  }

  _icon(name) {
    return name && window.hemmaIconUrl ? `url('${window.hemmaIconUrl(name)}')` : "none";
  }

  _iconName(st) {
    const id = st.entity_id, d = domainOf(id), a = st.attributes || {}, dc = a.device_class, open = st.state === "open" || st.state === "opening";
    if (d === "light") return "light";
    if (d === "fan") return "fan";
    if (d === "humidifier") return "humidifier";
    if (d === "climate") return "thermostat";
    if (d === "plant") return "plant";
    if (d === "switch") return "plug";
    if (d === "lock") return st.state === "unlocked" ? "lock-open" : "lock";
    if (d === "cover") return dc === "curtain" ? (open ? "curtain-open" : "curtain-closed") : dc === "blind" ? (open ? "blinds-vertical-open" : "blinds-vertical-closed") : (open ? "window-shade-open" : "window-shade-closed");
    if (d === "media_player") {
      if (/ps5|playstation/i.test(id)) return "ps5";
      if (/apple_tv/i.test(id)) return "apple_tv";
      return dc === "tv" ? "tv" : dc === "speaker" ? "speaker" : "media";
    }
    return "";
  }

  _paintIcon(ic, st, ts) {
    const pic = domainOf(st.entity_id) === "person" && (st.attributes.entity_picture_local || st.attributes.entity_picture);
    if (pic) {
      const src = this._hass.hassUrl ? this._hass.hassUrl(pic) : pic;
      if (ic.dataset.n !== src) { ic.dataset.n = src; ic.classList.remove("num"); ic.classList.add("pic"); ic.innerHTML = `<img alt="" src="${esc(src)}">`; }
      return;
    }
    ic.classList.remove("pic");
    if (domainOf(st.entity_id) === "climate") {
      let cur = st.attributes.current_temperature;
      const t = ts && this._hass.states[ts];
      if (t && t.state !== "unknown" && t.state !== "unavailable") cur = t.state;
      if (cur != null && !isNaN(Math.round(Number(cur)))) { const n = String(Math.round(Number(cur))); if (ic.textContent !== n) { ic.textContent = n; ic.dataset.n = ""; } ic.classList.add("num"); return; }
    }
    const name = window.hemmaIconUrl ? this._iconName(st) : "";
    const url = name ? window.hemmaIconUrl(name) : "";
    if (url) {
      if (ic.dataset.n === name) return;
      ic.dataset.n = name;
      ic.innerHTML = `<i style="--i:url('${url}')"></i>`;
      this._glyphFit(ic.firstChild, url);
      return;
    }
    let el = ic.querySelector("ha-state-icon");
    if (!el) { ic.innerHTML = ""; el = document.createElement("ha-state-icon"); ic.appendChild(el); }
    el.hass = this._hass; el.stateObj = this._glyphState(st);
  }

  _glyphState(st) {
    return ["light", "fan", "switch", "media_player"].includes(domainOf(st.entity_id)) && st.state !== "on" ? { ...st, state: "on" } : st;
  }

  _shortName(id, name, R = this._layout.rooms[this._room]) {
    const H = this._hass, reg = (H.entities || {})[id] || {}, dev = (H.devices || {})[reg.device_id];
    const room = R.name;
    if (reg.name) return reg.name;
    for (const pre of [dev && (dev.name_by_user || dev.name), room]) {
      if (pre && name.toLowerCase().startsWith(String(pre).toLowerCase() + " ") && name.length > pre.length + 1) return name.slice(pre.length + 1);
    }
    return name;
  }

  _go(page, room) {
    const from = this._page || "room", fromRoom = this._room;
    this._page = page;
    if (room != null) this._room = room;
    history.replaceState(null, "", "/hemma-native/" + (page === "room" ? this._layout.rooms[this._room].id : page === "home" || page === "scenes" ? page : "c-" + page));
    this._render(this._how(from, page, fromRoom));
    if (this._pvFrame) this._pvPushSoon(null, true);
    if (PV) { try { const o = window.frameElement && window.frameElement._pvOwner; if (o) o._pvSideMark(); } catch (e) {} }
  }

  _how(from, to, fromRoom) {
    if (from === to && (to !== "room" || fromRoom === this._room)) return null;
    if (this._host.classList.contains("focus") && (from === "home" || from === "room") && (to === "home" || to === "room")) return null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    const cat = (p) => p !== "home" && p !== "room" && p !== "scenes";
    if (this._host.classList.contains("ph")) return from === "home" ? "sheetIn" : to === "home" ? "sheetOut" : null;
    if (from === "home") return cat(to) ? "rise" : "push";
    if (to === "home") return cat(from) ? "return" : "pop";
    if (from === "room" && to === "room") return null;
    if (cat(from) && cat(to)) return null;
    return "fade";
  }

  _transition(how, prev, next) {
    const R = this._root, col = R.querySelector(".col"), held = [];
    const E = "cubic-bezier(0.32, 0.72, 0, 1)", FX = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    const A = (el, kf, o) => { if (!el) return null; const a = el.animate(kf, Object.assign({ fill: "both" }, o)); a.pause(); held.push(a); return a; };
    const kids = (m, skip) => [...m.children].filter((c) => !c.matches(skip || ".top"));
    const end = (ms, f) => setTimeout(() => { prev.remove(); next.style.zIndex = ""; held.forEach((a) => { try { a.cancel(); } catch (e) {} }); if (f) f(); }, ms);
    prev.classList.add("prev");
    const back = R.querySelector(".hdr .back");
    if (how === "push" || how === "pop") {
      const dir = how === "pop" ? -1 : 1, V = Math.max(next.clientWidth, window.innerWidth), o = { duration: 480, easing: "cubic-bezier(0.3, 0, 0, 1)" };
      const pt = prev.querySelector(".top");
      if (pt) pt.style.visibility = "hidden";
      next.scrollTop = 0;
      kids(prev).forEach((c) => A(c, [{ transform: "translateX(0)" }, { transform: `translateX(${-dir * V}px)` }], o));
      kids(next).forEach((c) => A(c, [{ transform: `translateX(${dir * V}px)` }, { transform: "translateX(0)" }], o));
      end(520);
    } else if (how === "rise") {
      prev.style.opacity = "0";
      const head = kids(next, ".top, h3, .grid, .scg, .nps, .scs, .encard, .empty").filter((c) => c.matches(".chips, .bds"));
      const body = kids(next).filter((c) => !head.includes(c)), D = 480, TAU = 80, Nn = 24, fin = Math.exp(-D / TAU), H = window.innerHeight * 0.9;
      const D2 = 620, T2 = 170, fin2 = Math.exp(-D2 / T2), up = [];
      for (let i = 0; i <= Nn; i++) up.push({ transform: `translateY(${(34 * (Math.exp(-(i / Nn) * D2 / T2) - fin2) / (1 - fin2)).toFixed(2)}px)` });
      head.filter((c) => c.matches(".bds")).forEach((c) => { A(c, up, { duration: D2, easing: "linear" }); A(c, [{ opacity: 0.35 }, { opacity: 1 }], { duration: 320, easing: "ease-out" }); });
      const first = body.length ? body[0].getBoundingClientRect().top : 0;
      const rise = []; for (let i = 0; i <= Nn; i++) rise.push({ transform: `translateY(${(H * (Math.exp(-(i / Nn) * D / TAU) - fin) / (1 - fin)).toFixed(2)}px)` });
      body.forEach((c) => A(c, rise, { duration: D, easing: "linear", delay: 230 + Math.min(150, Math.max(0, (c.getBoundingClientRect().top - first) * 0.17)) }));
      end(900);
    } else if (how === "return") {
      prev.style.opacity = "0";
      const nr = next.getBoundingClientRect(), cx = nr.left + nr.width / 2, cy = window.innerHeight / 2;
      const sc = [...next.children].filter((c) => !c.matches(".chips"));
      sc.forEach((c) => { const r = c.getBoundingClientRect(); c.style.transformOrigin = `${(cx - r.left).toFixed(1)}px ${(cy - r.top).toFixed(1)}px`; A(c, [{ transform: "scale(0.97)" }, { transform: "none" }], { duration: 440, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }); });
      end(520, () => { sc.forEach((c) => { c.style.transformOrigin = ""; }); });
    } else if (how === "fade") {
      prev.style.opacity = "0";
      next.style.transformOrigin = "50% 30%";
      A(next, [{ transform: "translateY(20px) scale(0.93)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      end(600, () => { next.style.transformOrigin = ""; });
    } else if (how === "sheetIn") {
      next.style.zIndex = "2";
      next.scrollTop = 0;
      const ntop = next.querySelector(".top"), rise = Math.round(window.innerHeight * 0.25);
      kids(prev, ".chips").forEach((c) => A(c, [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(8px)" }], { duration: 320, easing: FX }));
      if (ntop) A(ntop, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
      next.querySelectorAll(":scope > .cbds").forEach((c) => A(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 50, easing: "ease-out" }));
      const secs = kids(next, ".top, .bds, .chips, .cbds");
      secs.forEach((c, i) => {
        A(c, [{ transform: `translateY(${rise}px)` }, { transform: "translateY(0)" }], { duration: 560, delay: i * 30, easing: E });
        A(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: i * 30, easing: "ease-out" });
      });
      end(580 + 30 * secs.length + 40);
    } else if (how === "sheetOut") {
      prev.style.zIndex = "2";
      kids(prev, ".nothing").forEach((c) => A(c, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-out" }));
      const cy = next.scrollTop + next.clientHeight / 2, staged = [];
      kids(next, ".nothing").forEach((c) => {
        if (c.matches(".chips")) { A(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" }); return; }
        if (c.matches(".top")) { A(c, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 440, easing: E }); return; }
        c.style.transformOrigin = `50% ${Math.round(cy - c.offsetTop)}px`;
        staged.push(c);
        A(c, [{ transform: "scale(0.95)" }, { transform: "none" }], { duration: 500, easing: E });
        A(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out" });
      });
      end(540, () => staged.forEach((c) => { c.style.transformOrigin = ""; }));
    }
    if (back && this._backNew) {
      if (this._host.classList.contains("ph")) A(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease" });
      else { A(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: "ease" }); A(back, [{ transform: "scale(0.8)" }, { transform: "none" }], { duration: 400, easing: "cubic-bezier(.34, 1.56, .64, 1)" }); }
    }
    requestAnimationFrame(() => requestAnimationFrame(() => held.forEach((a) => { if (a.playState === "paused") a.play(); })));
  }

  async _chipCfg() {
    try { this._ingestMobile(await this._hass.callWS({ type: "lovelace/config", url_path: "hemma-dashboard-mobile" })); } catch (e) {}
  }

  _ingestMobile(cfg) {
    this._chipV = {};
    try {
      const walk = (l) => (l || []).forEach((c) => {
        if (!c || typeof c !== "object") return;
        if ([].concat(c.template || []).includes("hemma_mobile_now_playing") && !this._npCard) this._npCard = c;
        if ([].concat(c.template || []).includes("hemma_mobile_filter_badges") && !this._chipV.found) { this._chipV = Object.assign({ found: true }, c.variables || {}); return; }
        walk(c.cards); if (c.card) walk([c.card]);
      });
      (cfg.views || []).forEach((v) => walk(v.cards));
      const tpl = cfg.button_card_templates && cfg.button_card_templates.hemma_mobile_now_playing, src = tpl && tpl.variables && tpl.variables.cfg;
      if (typeof src === "string" && this._npCard) {
        try { this._npV = new Function("variables", "states", "hass", "user", src.trim().replace(/^\[\[\[/, "").replace(/\]\]\]$/, ""))(this._npCard.variables || {}, this._hass.states, this._hass, this._hass.user); } catch (e) { this._npV = null; }
      }
      const kids = (((cfg.views || [])[0] || {}).cards || [])[1];
      const rows = [];
      let head = null;
      ((kids && kids.cards) || []).forEach((c) => {
        const t = [].concat(c.template || []);
        if (t.includes("hemma_scene_row")) this._sceneV = c.variables || {};
        if (t.includes("hemma_mobile_header")) { head = c; return; }
        if (head && c.type === "custom:hemma-smart-row") {
          const fav = !!(head.variables && head.variables.favorites) || /^favou?rites$/i.test(String(head.name || "").trim());
          rows.push({ name: head.name, fav, cards: (c.cards || []).filter((x) => x && x.entity).map((x) => ({ tpl: [].concat(x.template || []), entity: x.entity, name: typeof x.name === "string" && x.name.indexOf("[[[") < 0 ? x.name : "", V: x.variables || {} })) });
          head = null;
        }
      });
      this._rows = rows;
    } catch (e) {}
  }

  _chipIcon(k, ic) {
    if (k !== "security" || !window.hemmaSecuritySummary || !this._hass) return ic;
    const V = this._chipV || {};
    try { return window.hemmaSecuritySummary({ lock_entity: V.security_lock_entity || V.lock_entity, lock_entity_2: V.security_lock_entity_2 || V.lock_entity_2 }, this._hass).icon || ic; } catch (e) { return ic; }
  }

  _chipText(k) {
    const V = this._chipV || {}, S = this._hass.states, H = this._hass;
    if (k === "climate") {
      const v = [1, 2, 3, 4, 5].map((n) => V["temp_sensor_" + n] || (n === 1 ? V.temp_sensor : null)).filter(Boolean).map((id) => parseFloat((S[id] || {}).state)).filter((x) => !isNaN(x));
      if (!v.length) return "";
      const lo = Math.round(Math.min(...v)), hi = Math.round(Math.max(...v));
      return lo === hi ? `${lo}°` : `${lo}–${hi}°`;
    }
    if (k === "lights") {
      const mems = (id) => { const m = (S[id] || {}).attributes; return m && Array.isArray(m.entity_id) ? m.entity_id.filter((x) => typeof x === "string" && x.indexOf("light.") === 0) : []; };
      const seen = new Set(), units = (id) => { if (!id || seen.has(id)) return []; const m = mems(id); if (!m.length || !m.some((x) => mems(x).length)) return [id]; seen.add(id); return m.flatMap(units); };
      const cfg = [1, 2, 3].map((n) => V["light_entity_" + n]).filter(Boolean);
      if (!cfg.length && V.light_group_entity) cfg.push(V.light_group_entity);
      const ids = [...new Set(cfg.flatMap(units))], on = ids.filter((id) => (S[id] || {}).state === "on").length;
      return on === 0 ? T("lights.all_off", "All Off") : on === ids.length ? T("lights.all_on", "All On") : T("lights.n_on", "{n} On", { n: on });
    }
    if (k === "people") {
      const ids = [1, 2, 3, 4].map((n) => V["presence_entity_" + n]).filter(Boolean);
      if (!ids.length) return "";
      const home = (id) => ["home", "just arrived"].includes(String((S[id] || {}).state || "").toLowerCase().replace(/_/g, " "));
      const n = ids.filter(home).length;
      if (ids.length === 1) return n ? T("presence.home", "Home") : T("presence.away", "Away");
      return n === ids.length ? T("presence.all_home", "All Home") : n === 0 ? T("presence.all_away", "All Away") : T("presence.n_away", "{n} Away", { n: ids.length - n });
    }
    if (k === "media") {
      const ids = [1, 2, 3, 4, 5].map((n) => V["media_player_" + n] || V["media_entity_" + n]).concat([V.plex_stream_1, V.plex_stream_2, V.psn_1 || V.psn_entity_1, V.psn_2 || V.psn_entity_2]).filter(Boolean);
      const live = (id) => {
        const st = S[id]; if (!st) return false;
        const s = String(st.state || "").toLowerCase(), a = st.attributes || {};
        if (["unavailable", "unknown", "off", "standby"].includes(s)) return false;
        if (["playing", "buffering", "on"].includes(s)) return true;
        if (id.indexOf("sensor.") === 0) {
          const t = String(a.full_title || a.media_title || a.title || "").trim();
          return t ? !["paused", "idle", "none", ""].includes(s) : !["playing", "paused", "idle", "on", "off", "home", "away", "online", "offline", "standby", "unavailable", "unknown", "none", "null", ""].includes(s);
        }
        if (!String(a.media_title || "").trim() && !String(a.media_artist || a.artist || a.media_album_artist || "").trim()) return false;
        if (s === "paused") return (Date.now() - new Date(st.last_changed)) / 60000 <= 10;
        return s === "idle";
      };
      const P = window._hemmaPCSources ? window._hemmaPCSources(S, {}) || {} : {};
      const n = ids.filter(live).length + (P.discord ? 1 : 0) + (P.steam ? 1 : 0);
      return n === 0 ? T("media.none_playing", "None Playing") : T("media.n_playing", "{n} Playing", { n });
    }
    if (k === "security") {
      const sv = { lock_entity: V.security_lock_entity || V.lock_entity, lock_entity_2: V.security_lock_entity_2 || V.lock_entity_2 };
      if (window.hemmaSecuritySummary) return window.hemmaSecuritySummary(sv, H).text;
      return T("security.no_alerts", "No Alerts");
    }
    if (k === "energy") {
      const w = parseFloat((S[V.energy_power_entity || V.power_entity] || {}).state);
      if (isNaN(w)) return "";
      return w >= 3000 ? T("energy.extreme_usage", "Extreme Usage") : w >= 1000 ? T("energy.heavy_usage", "Heavy Usage") : w >= 200 ? T("energy.normal", "Normal") : T("energy.idle", "Idle");
    }
    return "";
  }

  _chipColor(k, sub) {
    const V = this._chipV || {}, S = this._hass.states, off = "var(--hemma-badge-icon-inactive, rgba(235,235,245,.6))";
    if (k === "climate") {
      const act = [V.climate_entity, V.climate_entity_2, V.climate_entity_3].filter(Boolean).some((id) => { const st = S[id]; if (!st) return false; if (["heating", "cooling", "fan_only", "fan", "drying"].includes((st.attributes || {}).hvac_action)) return true; return !["off", "unavailable", "unknown"].includes(st.state); });
      if (act) return "var(--hemma-badge-climate-color, #00C3D0)";
      const id = V.temp_sensor_1 || V.temp_sensor || V.temp_sensor_2, v = parseFloat((S[id] || {}).state);
      if (!id || isNaN(v)) return off;
      const c = String(((S[id] || {}).attributes || {}).unit_of_measurement || "").indexOf("C") >= 0, t = c ? [18, 21, 24, 27, 29] : [65, 70, 76, 81, 85];
      return v <= t[0] ? "var(--hemma-badge-climate-very-cold-color, #3cd3fe)" : v <= t[1] ? "var(--hemma-badge-climate-color, #00C3D0)" : v <= t[2] ? "var(--hemma-badge-temp-comfortable-color, #30D158)" : v <= t[3] ? "var(--hemma-badge-temp-warm-color, #FFCC00)" : v <= t[4] ? "var(--hemma-badge-temp-hot-color, #FF9230)" : "var(--hemma-badge-temp-very-hot-color, #FF4245)";
    }
    if (k === "people") {
      const ids = [1, 2, 3, 4].map((n) => V["presence_entity_" + n]).filter(Boolean);
      const n = ids.filter((id) => ["home", "just arrived"].includes(String((S[id] || {}).state || "").toLowerCase().replace(/_/g, " "))).length;
      return !ids.length || n === 0 ? off : n === ids.length ? "var(--hemma-badge-presence-home-color, #30D158)" : "var(--hemma-badge-presence-away-color, #FF9230)";
    }
    if (k === "media") return sub === T("media.none_playing", "None Playing") || !sub ? off : "var(--hemma-color-pink, #FF4D70)";
    if (k === "energy") {
      const w = parseFloat((S[V.energy_power_entity || V.power_entity] || {}).state);
      return isNaN(w) ? "var(--hemma-badge-energy-color, #30D158)" : w >= 3000 ? "var(--hemma-badge-energy-very-high-color, #FF4245)" : w >= 1000 ? "var(--hemma-badge-energy-high-color, #FF9230)" : w >= 200 ? "var(--hemma-badge-energy-medium-color, #FFD600)" : "var(--hemma-badge-energy-low-color, #30D158)";
    }
    return null;
  }

  _chips(active, keep) {
    const COL = { climate: "var(--hemma-badge-climate-color, #00C3D0)", lights: "var(--hemma-badge-light-color, #FFCC00)", people: "rgb(47, 150, 255)", media: "var(--hemma-color-pink, #FF4D70)", security: "var(--hemma-color-mint, #00C8B3)", energy: "var(--hemma-color-green, #30D158)" };
    return `<div class="chips">${CATS.filter(([k]) => !keep || keep(k)).map(([k, label, ic]) => { const sub = this._chipText(k); return `<button type="button" class="chip${k === active ? " on" : ""}" data-cat="${k}" style="--c:${this._chipColor(k, sub) || COL[k]}"><i style="--i:${this._icon(this._chipIcon(k, ic))}"></i><span><b>${esc(T("filter." + (k === "people" ? "people" : k), label))}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</span></button>`; }).join("")}</div>`;
  }

  _catOf(id) {
    const st = this._hass.states[id];
    if (window.hemmaHome && window.hemmaHome.categoryOf) { const c = window.hemmaHome.categoryOf(id, st); if (c) return c; }
    const sec = this._sectionOf(id);
    return sec === "other" ? null : sec;
  }

  _litFirst(list) {
    return list.filter((t) => this._state(t.entity).on).concat(list.filter((t) => !this._state(t.entity).on));
  }

  _arrange(key, list) {
    const have = new Set();
    return { list: list.filter((c) => !have.has(c.entity) && have.add(c.entity)), ordered: false };
  }

  _grid(key, list, litFirst) {
    const off = (c) => { const v = (c.V || {}).enabled; return v === false || v === "false"; };
    list = (list || []).filter((c) => this._edit || !off(c));
    const a = this._arrange(key, list);
    const l = litFirst && !a.ordered && !this._edit ? a.list.filter((c) => this._kindState(c).on).concat(a.list.filter((c) => !this._kindState(c).on)) : a.list;
    if (!l.length && !this._edit) return "";
    return `<div class="grid" data-k="${esc(key)}">${l.map((c) => { this._cards.push(c); const h = this._cardHtml(c, this._cards.length - 1); return off(c) ? h.replace('class="t', `data-hid="${esc(T("native.hidden", "Hidden"))}" class="t hid`) : h; }).join("")}${this._edit && /^(home|room)\|/.test(key) ? `<button type="button" class="t add" data-add="${esc(key)}"><span class="ic"><i style="--i:${PLUS}"></i></span><span class="tx"><b>${esc(T("native.add", "Add"))}</b></span></button>` : ""}</div>`;
  }

  _setEdit(on) {
    if (PV && on) return;
    if (!!on === !!this._edit) return;
    const snap = this._host.classList.contains("ph") ? null : this._edSnap();
    this._host.classList.add("edmv");
    this._host.classList.toggle("edcl", !on);
    clearTimeout(this._edMvT);
    this._edMvT = setTimeout(() => this._host.classList.remove("edmv", "edcl"), 700);
    this._edit = !!on;
    this._host.classList.toggle("edit", this._edit);
    if (!document.getElementById("hemma-native-edit-quick")) { const st = document.createElement("style"); st.id = "hemma-native-edit-quick"; st.textContent = "html.hemma-hv.hemma-editing { transition: --hv-bg .2s ease; }"; document.head.appendChild(st); }
    document.documentElement.classList.toggle("hemma-editing", this._edit);
    if (this._edit) this._edOpen(); else this._edClose();
    if (!this._onUnload) this._onUnload = (e) => { const st = this._studio; if (this._edit && st && st._state && st._isDirty()) { this._edDraft(); e.preventDefault(); e.returnValue = ""; } };
    if (this._edit) window.addEventListener("beforeunload", this._onUnload); else window.removeEventListener("beforeunload", this._onUnload);
    this._renderKeep();
    if (snap) this._edFlip(snap, null, this._edit ? 600 : 480, SPR);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) this._root.querySelectorAll(".hdr .ok, .hdr .pill").forEach((n) => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: this._edit ? 120 : 200, easing: "ease-out", fill: "backwards" }));
  }

  _renderKeep() {
    const m = this._root.querySelector(".main"), y = m ? m.scrollTop : 0;
    this._render();
    const n = this._root.querySelector(".main");
    if (n && y) { n.scrollTop = y; if (n.onscroll) n.onscroll(); }
  }

  async _edOpen() {
    const R = this._root, H = this._hass;
    R.querySelectorAll(".ed, .edhalo").forEach((n) => n.remove());
    const ed = document.createElement("div");
    ed.className = "ed";
    ed.innerHTML = `<div class="grab"></div><div class="edh"><div class="er1"><button type="button" class="edx" aria-label="${esc(T("native.cancel", "Cancel"))}" title="${esc(T("native.cancel", "Cancel"))}"><svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12"/></svg></button><label class="edsr"><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="6.8" cy="6.8" r="5.3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="m10.8 10.8 3.7 3.7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg><input type="search" class="edq" autocomplete="off" spellcheck="false" placeholder="${esc(T("native.search", "Search"))}" aria-label="${esc(T("native.search", "Search"))}"><kbd>${/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "") ? "⌘K" : "Ctrl K"}</kbd></label><span class="eur"><button type="button" class="edu" aria-label="${esc(T("native.undo", "Undo"))}" title="${esc(T("native.undo", "Undo"))}" disabled><svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 4.5 3.5 8.5l4 4"/><path d="M3.8 8.5H12a4.5 4.5 0 0 1 0 9H9"/></svg></button><button type="button" class="edr" aria-label="${esc(T("native.redo", "Redo"))}" title="${esc(T("native.redo", "Redo"))}" disabled><svg style="transform:scaleX(-1)" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 4.5 3.5 8.5l4 4"/><path d="M3.8 8.5H12a4.5 4.5 0 0 1 0 9H9"/></svg></button></span><button type="button" class="edhi" aria-label="${esc(T("native.history", "Version History"))}" title="${esc(T("native.history", "Version History"))}"><svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.2 10a6.8 6.8 0 1 0 2-4.8"/><path d="M2.6 3.6v3.2h3.2"/><path d="M10 6.4V10l2.4 1.6"/></svg></button></div><div class="er0"><button type="button" class="edroom" aria-haspopup="menu"><i></i><span></span><svg width="9" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d="M1 5 4 2l3 3M1 9l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div><div class="edb"><div class="edsk" aria-hidden="true"><i class="skh"></i><div class="skg">${"<span><b></b><em></em></span>".repeat(4)}</div><i class="skh"></i><div class="skg">${"<span><b></b><em></em></span>".repeat(8)}</div></div><div class="edres" hidden></div></div><button type="button" class="edchg" hidden aria-haspopup="dialog" aria-expanded="false"><span></span><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8l4-4 4 4"/></svg></button>`;
    R.appendChild(ed);
    ed.classList.toggle("flatm", document.documentElement.classList.contains("hemma-hv") && !this._isGlass());
    this._pvBar();
    ed.querySelector(".edchg").onclick = () => this._edChanges();
    ed.querySelector(".edx").onclick = () => (this._host.classList.contains("ph") ? this._phSheet(null) : this._edCancel());
    ed.querySelector(".edroom").onclick = (e) => { const st = this._studio; if (st && st._state) st._roomTitleMenu(e.currentTarget); };
    ed.querySelector(".edu").onclick = () => this._edUndo(false);
    ed.querySelector(".edhi").onclick = () => this._edHist();
    ed.querySelector(".edr").onclick = () => this._edUndo(true);
    this._edSearchWire(ed);
    if (!this._host.classList.contains("ph")) this._edSheet(ed);
    const cur = this._page === "home" ? T("nav.home", "Home") : this._page === "room" ? (this._layout.rooms[this._room] || {}).name || "" : "";
    if (cur) { ed.querySelector(".edroom span").textContent = cur; ed.querySelector(".edroom i").style.setProperty("--i", this._roomIconFor(cur)); }
    ed.querySelector(".edq").disabled = true;
    if (!this._host.classList.contains("ph")) requestAnimationFrame(() => requestAnimationFrame(() => ed.classList.add("in")));
    const fail = (msg) => { const w = ed.querySelector(".edsk"); if (w) { w.className = "edwait msg"; w.textContent = msg; } };
    let s = null;
    try { s = await this._edStudio(); } catch (e) { s = null; }
    if (!s) return fail(T("native.no_studio", "Hemma Studio isn't available."));
    await new Promise((r) => setTimeout(r, 500));
    if (!this._edit || !ed.isConnected) return;
    this._edReady = false;
    ed.querySelector(".edb").insertBefore(s, ed.querySelector(".edb").firstChild);
    s.classList.add("pending");
    this._studio = s;
    const ready = () => s._state && s._clean && !s.classList.contains("booting") && s.shadowRoot && s.shadowRoot.querySelector("#save");
    if (s._edUsed && ready() && (s._isDirty() || Date.now() - (s._edAt || 0) > 60000)) { try { await s._load(); } catch (e) {} }
    for (let i = 0; i < 200 && !ready(); i++) await new Promise((r) => setTimeout(r, 50));
    if (this._studio !== s || !this._edit) return;
    if (!s._state) return fail(T("native.no_dash", "This dashboard couldn't be opened for editing."));
    s._sel = null;
    this._edSync();
    try { s._renderForm(); } catch (e) {}
    this._edReady = true;
    this._edStyle = this._edHomeStyle(this._studio);
    this._edPrint = s._lastPrint;
    this._wireEdit();
    s._edUsed = true; s._edAt = Date.now();
    this._edHead();
    ed.querySelector(".edq").disabled = false;
    this._edDraftOffer(s);
    const sk = ed.querySelector(".edsk"), calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calm) { s.classList.remove("pending"); if (sk) sk.remove(); return; }
    s.style.willChange = "opacity";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))));
    if (this._studio !== s) return;
    s.style.setProperty("background", "var(--edp, #32392f)", "important");
    s.classList.remove("pending");
    const done = () => { s.style.willChange = ""; s.style.setProperty("background", "transparent", "important"); if (sk) sk.remove(); };
    s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "cubic-bezier(.25,.1,.25,1)", fill: "backwards" }).finished.then(done, done);
  }

  async _edStudio() {
    if (this._studioWarm) return this._studioWarm;
    if (this._edWarming) return this._edWarming;
    this._edWarming = (async () => {
      const H = this._hass, p = (H.panels || {})["hemma-studio"], url = p && p.config && p.config._panel_custom && p.config._panel_custom.module_url;
      if (!url) return null;
      await import(url);
      const s = document.createElement("hemma-panel");
      s._embedDash = "hemma-dashboard";
      s.className = "studio";
      const css = ".top, .bgwrap, #bigtitle, .curtain { display: none !important; } .shell { position: absolute !important; inset: 0 !important; } .body { padding-top: 6px !important; } .hint:not(.tilegrid > .hint), .shothint { display: none !important; } :host(.hvbg) { --studio-hv: var(--hv-bg) !important; } :host(.phone.hvbg:not(.is-light)) { --hv-panel: color-mix(in oklab, var(--hv-bg) 74%, #fff) !important; } :host(.is-light) .detailbar h3 { color: #000 !important; } :host(:not(.hvbg)) { --card-tint: rgba(255,255,255,.09); --pane: none; --g-blur: none; --g-rim: none; --hemma-pill-fill: rgba(255,255,255,.12); --hemma-pill-backdrop: none; --hemma-pill-rim: none; --hemma-pill-edge: transparent; --hemma-pill-highlight: none; } :host(:not(.hvbg).is-light) { --card-tint: rgba(255,255,255,.6); --hemma-pill-fill: rgba(255,255,255,.72); } :host(:not(.hvbg)) .detailbar .plus { background-color: rgba(255,255,255,.16) !important; background-image: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; box-shadow: none !important; } :host(:not(.hvbg)) .detailbar .plus::before, :host(:not(.hvbg)) .detailbar .plus::after { display: none !important; } :host(:not(.hvbg).is-light) .detailbar .plus { background-color: rgba(118,118,128,.14) !important; color: #000 !important; } .embadd { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px 0 12px; border-radius: 20px; background: var(--chip, rgba(255,255,255,.14)); color: var(--ink, #fff); font-size: 16px; font-weight: 500; cursor: pointer; } .embadd:hover { filter: brightness(1.08); } .embadd svg { width: 18px; height: 18px; } .psheet-panel { left: calc(50% - min(280px, 50vw - 16px)) !important; right: auto !important; bottom: auto !important; width: min(560px, calc(100vw - 32px)) !important; top: max(48px, 9vh) !important; max-height: min(640px, 78vh) !important; border-radius: 20px !important; } .phonelist > h2.sidehead:first-of-type { font-size: 28px !important; font-weight: 700 !important; color: inherit !important; letter-spacing: -.4px !important; line-height: 1.15 !important; padding: 0 4px !important; margin: -2px 0 16px !important; } .shell { overflow-x: hidden !important; touch-action: pan-y; } .navrow:has(> .detailbar) { height: auto !important; min-height: 0 !important; margin-bottom: 10px !important; } .navrow > .detailbar { position: relative !important; inset: auto !important; flex-wrap: nowrap !important; column-gap: 8px !important; min-height: 44px; margin-top: -8px !important; padding-top: 0 !important; } .detailbar .back { order: 0; flex: none !important; width: auto !important; min-width: 0 !important; height: 44px !important; padding: 0 17px 0 12px !important; gap: 4px; display: inline-flex !important; align-items: center; border-radius: 22px !important; font-size: 17px; font-weight: 400; color: inherit !important; background-color: rgba(255,255,255,.12) !important; background-image: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; box-shadow: none !important; margin-left: 0 !important; } .detailbar .back::before { display: none !important; } .detailbar .back::after { display: inline !important; content: attr(data-prev) !important; position: static !important; inset: auto !important; padding: 0 !important; background: none !important; -webkit-mask: none !important; mask: none !important; border-radius: 0 !important; } .detailbar .back { white-space: nowrap !important; max-width: none !important; } .detailbar .back::after { white-space: nowrap; flex: none; } .detailbar .back svg { width: 18px !important; height: 18px !important; flex: none; } .detailbar > :not(.back):not(h3) { order: 1; } .detailbar > h3 + * { margin-left: auto !important; } .detailbar .plus { width: 44px !important; height: 44px !important; flex-basis: 44px !important; } .detailbar > h3 { position: absolute !important; left: 50% !important; top: 50% !important; transform: translate(-50%,-50%); flex: none !important; width: auto !important; max-width: 52%; margin: 0 !important; font-size: 17px !important; font-weight: 600 !important; letter-spacing: -.2px !important; line-height: 1.2 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; } :host(.is-light) .detailbar .back { background-color: rgba(118,118,128,.14) !important; color: #000 !important; } :host(.is-light) .detailbar .plus { background-color: rgba(118,118,128,.14) !important; color: #000 !important; }" + ELIST + (window.hemmaCapsCss || "");
      try { const sh = new CSSStyleSheet(), sc = new CSSStyleSheet(); sh.replaceSync(css); sc.replaceSync(EMBED_C); s.shadowRoot.adoptedStyleSheets = [...s.shadowRoot.adoptedStyleSheets, sh, sc]; }
      catch (e) { const st = document.createElement("style"); st.textContent = css; s._edCss = st; }
      s.addEventListener("hemma-studio-change", () => { if (this._studio === s && this._edReady) { this._edPreview(); this._edHead(); this._edDraftSoon(); } });
      const host = this, rt = s._renderTabs;
      s._renderTabs = function (...a) { const r = rt.apply(this, a); if (host._studio === s && host._edReady) { s._markDirty(); host._edFollow(); host._edHead(); } return r; };
      s._embedLight = false;
      s._embedReveal = () => (this._studio === s && this._edit && this._edHomeStyle(s) !== this._edStyle ? this._edPreview(true, true) : null);
      s._embedAddTile = (room) => { const k = this._edKeyFor(room); if (k) this._edAdd(k); };
      this._edPark(s);
      s.hass = H; s.panel = p; s.route = { prefix: "/" + p.url_path, path: "" };
      s.style.setProperty("background", "transparent", "important");
      if (s._edCss) setTimeout(() => s.shadowRoot.appendChild(s._edCss), 0);
      this._studioWarm = s;
      return s;
    })();
    try { return await this._edWarming; } finally { this._edWarming = null; }
  }

  _edPark(s) {
    let h = this._root.querySelector(".edwarm");
    if (!h) { h = document.createElement("div"); h.className = "edwarm"; this._root.appendChild(h); }
    h.appendChild(s);
  }

  _roomIconFor(name) {
    const k = String(name || "").toLowerCase();
    return this._icon(/living/.test(k) ? "living-room" : /kitchen/.test(k) ? "kitchen" : /bed/.test(k) ? "bedroom" : /dining/.test(k) ? "dining" : "home");
  }

  _tileIconFor(id) {
    const D = { light: "light", switch: "power_on", fan: "fan", climate: "thermostat", cover: "curtain-open", lock: "lock-fill", media_player: "media", humidifier: "humidifier", vacuum: "vacuum", camera: "doorbell", plant: "plant", sensor: "status", binary_sensor: "status", water_heater: "hot_water", alarm_control_panel: "lock-fill", script: "play", button: "play", scene: "scenes" };
    return this._icon(D[domainOf(id)] || "default");
  }

  _edHead() {
    const s = this._studio, ed = this._root.querySelector(".ed");
    if (!ed) return;
    const st = s && s._state, r = st && st.compact.rooms[s._room];
    const rb = ed.querySelector(".edroom");
    if (rb && r) { rb.querySelector("span").textContent = r.name || ""; rb.querySelector("i").style.setProperty("--i", this._roomIconFor(r.name)); rb.setAttribute("aria-label", T("native.room_menu", "Room: {name}", { name: r.name || "" })); }
    const u = ed.querySelector(".edu"), d = ed.querySelector(".edr");
    if (u) u.disabled = !(st && (s._undoStack || []).length);
    if (d) d.disabled = !(st && (s._redoStack || []).length);
    const n = st && s._embedCount ? s._embedCount() : 0, b = this._root.querySelector(".hdr .okn");
    if (b) { b.textContent = n > 99 ? "99+" : String(n); b.classList.toggle("on", n > 0); }
    const c = ed.querySelector(".edchg");
    if (c) { c.hidden = !n; c.querySelector("span").textContent = n === 1 ? T("native.one_change", "1 Change") : T("native.n_changes", "{n} Changes", { n }); }
    if (ed.querySelector(".edcl")) this._edChanges(true);
  }

  _edDraftKey() { return "hemma_native_draft"; }

  _edHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36) + ":" + str.length;
  }

  _edDraftSoon() {
    clearTimeout(this._edDraftT);
    this._edDraftT = setTimeout(() => this._edDraft(), 700);
  }

  _edDraft() {
    clearTimeout(this._edDraftT);
    const s = this._studio;
    if (!s || !s._state || !this._edReady || !s._clean) return;
    try {
      if (!s._isDirty()) { localStorage.removeItem(this._edDraftKey()); return; }
      localStorage.setItem(this._edDraftKey(), JSON.stringify({ v: 1, dash: s._embedDash, base: this._edHash(s._clean), at: Date.now(), n: s._embedCount(), snap: s._snap() }));
    } catch (e) {}
  }

  _edDraftDrop() {
    clearTimeout(this._edDraftT);
    try { localStorage.removeItem(this._edDraftKey()); } catch (e) {}
  }

  async _edDraftOffer(s) {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this._edDraftKey()) || "null"); } catch (e) { d = null; }
    if (!d || !d.snap || d.dash !== s._embedDash) return;
    if (s._isDirty() || d.base !== this._edHash(s._clean || "")) { this._edDraftDrop(); return; }
    const when = new Date(d.at).toLocaleString((this._hass && this._hass.language) || undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
    const n = d.n || 1;
    const ok = await this._alert({ title: T("native.draft_q", "Restore Unsaved Changes?"), message: (n === 1 ? T("native.draft_one", "You left the editor with 1 unsaved change ({when}).", { when }) : T("native.draft_msg", "You left the editor with {n} unsaved changes ({when}).", { n, when })), ok: T("native.restore", "Restore"), cancel: T("native.discard", "Discard") });
    if (this._studio !== s || !this._edit) return;
    if (!ok) { this._edDraftDrop(); return; }
    try {
      if (!s._embedLoad(d.snap)) { this._edDraftDrop(); return; }
      this._toast(T("native.draft_back", "Restored your unsaved changes"), T("native.undo", "Undo"), () => this._edUndo(false, true));
    } catch (e) { this._edDraftDrop(); }
  }

  _edUndo(redo, quiet) {
    const s = this._studio;
    if (!s || !s._state || !((redo ? s._redoStack : s._undoStack) || []).length) return;
    const what = s._embedStep ? s._embedStep(!!redo) : "";
    if (redo) s._redo(); else s._undo();
    if (quiet) return;
    const head = redo ? T("native.redid", "Redo") : T("native.undid", "Undo");
    this._toast(what ? head + ": " + what : redo ? T("native.redone", "Change redone") : T("native.undone", "Change undone"), redo ? T("native.undo", "Undo") : T("native.redo", "Redo"), () => this._edUndo(!redo, true));
  }

  _toast(text, act, run) {
    if (this._edit) this._pvCenter();
    this._root.querySelectorAll(".tst").forEach((n) => n.remove());
    clearTimeout(this._tstT);
    const t = document.createElement("div");
    t.className = "tst";
    t.setAttribute("role", "status");
    t.innerHTML = `<span></span>${act ? `<button type="button"></button>` : ""}`;
    t.querySelector("span").textContent = text;
    const hide = () => { clearTimeout(this._tstT); t.classList.add("out"); setTimeout(() => t.remove(), 220); };
    if (act) { const b = t.querySelector("button"); b.textContent = act; b.onclick = () => { hide(); run(); }; }
    this._root.appendChild(t);
    const arm = () => { clearTimeout(this._tstT); this._tstT = setTimeout(hide, 5000); };
    t.addEventListener("pointerenter", () => clearTimeout(this._tstT));
    t.addEventListener("pointerleave", arm);
    arm();
  }

  _edChanges(redraw) {
    const ed = this._root.querySelector(".ed"), s = this._studio;
    if (!ed) return;
    const btn = ed.querySelector(".edchg");
    let box = ed.querySelector(".edcl");
    if (box && !redraw) { this._edChangesClose(); return; }
    if (!s || !s._state || !s._embedChanges) return;
    const items = s._embedChanges(), taken = this._edTaken || [];
    if (!items.length && !taken.length) { this._edChangesClose(); return; }
    if (!box) {
      this._edTaken = [];
      box = document.createElement("div");
      box.className = "mnu edcl" + (document.documentElement.classList.contains("hemma-hv") && !this._isGlass() ? " flat" : "");
      box.setAttribute("role", "dialog");
      ed.appendChild(box);
      btn.setAttribute("aria-expanded", "true");
      this._edClOut = (e) => { if (!e.composedPath().some((n) => n === box || n === btn)) this._edChangesClose(); };
      setTimeout(() => document.addEventListener("pointerdown", this._edClOut, true), 0);
      this._edClKey = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); this._edChangesClose(); btn.focus(); } };
      document.addEventListener("keydown", this._edClKey, true);
    }
    const rows = items.slice(0, 30).map((it, i) => ({ it, i }));
    (this._edTaken || []).slice().sort((a, b) => a.at - b.at).forEach((x) => rows.splice(Math.min(x.at, rows.length), 0, { gone: x.text }));
    const n = items.length;
    box.innerHTML = `<h4></h4><ul></ul>${n ? `<hr><button type="button" class="rva"></button>` : ""}`;
    box.querySelector("h4").textContent = n ? (n === 1 ? T("native.one_unsaved", "1 Unsaved Change") : T("native.n_unsaved", "{n} Unsaved Changes", { n })) : T("native.no_unsaved", "No Unsaved Changes");
    const ul = box.querySelector("ul");
    rows.forEach((row, pos) => {
      const li = document.createElement("li"), tx = document.createElement("span"), b = document.createElement("button");
      tx.className = "lt"; b.type = "button"; b.className = "rv";
      if (row.gone) { li.className = "gone"; tx.textContent = row.gone; b.textContent = T("native.reverted", "Reverted"); b.disabled = true; li.append(tx, b); ul.appendChild(li); return; }
      tx.textContent = row.it.text;
      b.textContent = T("native.revert", "Revert");
      b.setAttribute("aria-label", T("native.revert", "Revert") + ": " + row.it.text);
      const plan = s._embedRevertPlan(row.i);
      if (!plan.state) {
        b.disabled = true;
        const why = document.createElement("small");
        why.textContent = plan.with ? T("native.revert_with", "Only together with “{line}”. Use Undo for both.", { line: plan.with }) : T("native.revert_tied", "Tied to another change. Use Undo.");
        tx.appendChild(why);
      }
      b.onclick = () => {
        if (!s._embedRevert(row.i)) return;
        this._edTaken = (this._edTaken || []).concat([{ at: pos, text: row.it.text }]);
        this._toast(T("native.reverted_x", "Reverted: {what}", { what: row.it.text }), T("native.undo", "Undo"), () => this._edUndo(false, true));
      };
      li.append(tx, b);
      ul.appendChild(li);
    });
    const all = box.querySelector(".rva");
    if (all) {
      all.textContent = T("native.revert_all", "Revert All Changes");
      all.onclick = async () => {
        this._edChangesClose();
        const ok = await this._alert({ title: T("native.revert_all_q", "Revert All Changes?"), message: T("native.revert_all_msg", "The dashboard goes back to how it was last saved. You can undo this."), ok: T("native.revert", "Revert"), destructive: true });
        if (!ok || this._studio !== s) return;
        if (s._embedRevert("all")) this._toast(T("native.reverted_all", "Reverted all changes"), T("native.undo", "Undo"), () => this._edUndo(false, true));
      };
    }
  }

  _edHistClose() {
    const h = this._root.querySelector(".edhist");
    if (h) h.remove();
  }

  async _edHistWs(msg) {
    return this._hass.callWS(Object.assign({ type: "hemma/native/history/" + msg.op }, msg.args || {}));
  }

  _edWhen(at, withDay) {
    const d = new Date(at * 1000), L = (this._hass && this._hass.language) || undefined;
    const t = d.toLocaleTimeString(L, { hour: "numeric", minute: "2-digit" });
    if (!withDay) return t;
    return this._edDay(at) + ", " + t;
  }

  _edDay(at) {
    const d = new Date(at * 1000), now = new Date(), L = (this._hass && this._hass.language) || undefined;
    const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((day(now) - day(d)) / 86400000);
    if (diff === 0) return T("native.today", "Today");
    if (diff === 1) return T("native.yesterday", "Yesterday");
    if (diff < 7) return d.toLocaleDateString(L, { weekday: "long" });
    return d.toLocaleDateString(L, { month: "long", day: "numeric", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
  }

  _edHistShell(title, back, onBack) {
    const ed = this._root.querySelector(".ed"), body = ed && ed.querySelector(".edb");
    if (!body) return null;
    this._edChangesClose();
    let h = body.querySelector(".edhist");
    if (!h) { h = document.createElement("div"); h.className = "edhist"; body.appendChild(h); }
    else { h.style.animation = "none"; void h.offsetWidth; h.style.animation = ""; }
    h.innerHTML = `<div class="hh"><button type="button" class="bk"><svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2 2 10l8 8"/></svg><span></span></button><h3></h3></div><div class="hb"></div>`;
    h.querySelector(".bk span").textContent = back;
    h.querySelector("h3").textContent = title;
    h.querySelector(".bk").onclick = onBack;
    h.scrollTop = 0;
    return h.querySelector(".hb");
  }

  async _edHist() {
    const s = this._studio;
    if (!s || !s._state) return;
    const back = (this._page === "home" ? T("nav.home", "Home") : ((this._layout.rooms[this._room] || {}).name)) || T("native.back", "Back");
    const box = this._edHistShell(T("native.history", "Version History"), back.length > 12 ? T("native.back", "Back") : back, () => this._edHistClose());
    if (!box) return;
    box.innerHTML = `<div class="msg">${esc(T("native.loading", "Loading…"))}</div>`;
    let items = null;
    try { items = (await this._edHistWs({ op: "list", args: { dash: s._embedDash } })).items || []; }
    catch (e) { box.innerHTML = `<div class="msg">${esc(T("native.hist_restart", "Version history starts after Home Assistant restarts once."))}</div>`; return; }
    if (!box.isConnected) return;
    if (!items.length) { box.innerHTML = `<div class="msg">${esc(T("native.hist_empty", "No versions yet. Each time you save, Hemma keeps a version you can go back to."))}</div>`; return; }
    items = items.slice().sort((a, b) => b.at - a.at);
    const groups = [];
    const pinned = items.filter((i) => i.pinned);
    if (pinned.length) groups.push([T("native.pinned", "Pinned"), pinned, true]);
    items.filter((i) => !i.pinned).forEach((i) => {
      const k = this._edDay(i.at), g = groups.find((x) => x[0] === k && !x[2]);
      if (g) g[1].push(i); else groups.push([k, [i], false]);
    });
    box.innerHTML = "";
    groups.forEach(([label, list, pin]) => {
      const h = document.createElement("div"); h.className = "sec"; h.textContent = label; box.appendChild(h);
      const g = document.createElement("div"); g.className = "rg";
      list.forEach((it) => {
        const r = document.createElement("button");
        r.type = "button"; r.className = "rr";
        const first = (it.lines || [])[0] || "", more = Math.max(0, (it.n || (it.lines || []).length) - 1);
        const sub = first ? (more ? T("native.hist_more", "{line} and {n} more", { line: first, n: more }) : first) : it.name ? "" : T("native.hist_saved", "Saved");
        const title = it.name || this._edWhen(it.at, pin);
        r.innerHTML = `<span class="ri ${it.pinned ? "pin" : ""}"><i style="--i:${(it.pinned ? HPIN : HCLK)}"></i></span><span class="tx"><b></b><small></small></span>${it.name ? `<span class="tm"></span>` : ""}<span class="chev"></span>`;
        r.querySelector("b").textContent = title;
        r.querySelector("small").textContent = [it.user, sub].filter(Boolean).join(" · ");
        if (it.name) r.querySelector(".tm").textContent = this._edWhen(it.at, pin);
        r.onclick = () => this._edHistItem(it);
        g.appendChild(r);
      });
      box.appendChild(g);
    });
  }

  async _edHistItem(it) {
    const s = this._studio;
    if (!s || !s._state) return;
    const when = this._edWhen(it.at, true);
    const box = this._edHistShell("", T("native.history_short", "History"), () => this._edHist());
    if (!box) return;
    box.innerHTML = `<div class="msg">${esc(T("native.loading", "Loading…"))}</div>`;
    let full = null;
    try { full = (await this._edHistWs({ op: "get", args: { item: it.id } })).item; } catch (e) { full = null; }
    if (!box.isConnected) return;
    if (!full || !full.snap) { box.innerHTML = `<div class="msg">${esc(T("native.hist_gone", "This version is no longer available."))}</div>`; return; }
    const diff = s._embedDiff(full.snap);
    box.innerHTML = `<div class="hd"><b></b><small></small></div><div class="sec"></div><div class="rg lines"></div><div class="sec"></div><div class="rg acts"></div>`;
    box.querySelector(".hd b").textContent = it.name || when;
    box.querySelector(".hd small").textContent = [it.name ? when : "", it.user ? T("native.hist_by", "Saved by {name}", { name: it.user }) : ""].filter(Boolean).join(" · ");
    const secs = box.querySelectorAll(".sec");
    secs[0].textContent = T("native.hist_restore_does", "Restoring This Version");
    const L = box.querySelector(".lines");
    if (!diff.length) { const n = document.createElement("span"); n.className = "ln"; n.textContent = T("native.hist_same", "Matches the dashboard you're editing."); L.appendChild(n); }
    diff.slice(0, 20).forEach((t) => { const n = document.createElement("span"); n.className = "ln"; n.textContent = t; L.appendChild(n); });
    if (diff.length > 20) { const n = document.createElement("span"); n.className = "ln"; n.textContent = T("native.n_more", "{n} more", { n: diff.length - 20 }); L.appendChild(n); }
    secs[1].textContent = T("native.hist_version", "Version");
    const A = box.querySelector(".acts");
    const act = (label, cls, run, dis) => { const b = document.createElement("button"); b.type = "button"; b.className = "act " + (cls || ""); b.textContent = label; b.disabled = !!dis; b.onclick = run; A.appendChild(b); return b; };
    act(T("native.hist_restore", "Restore This Version"), "pri", () => {
      if (!s._embedLoad(full.snap)) return;
      this._edHistClose();
      this._toast(T("native.hist_restored", "Restored the version from {when}. Press Done to save.", { when }), T("native.undo", "Undo"), () => this._edUndo(false, true));
    }, !diff.length);
    act(it.pinned ? T("native.unpin", "Unpin") : T("native.pin", "Pin"), "", async () => {
      try { await this._edHistWs({ op: "update", args: { item: it.id, pinned: !it.pinned } }); it.pinned = !it.pinned; this._edHistItem(it); } catch (e) {}
    });
    act(it.name ? T("native.rename", "Rename") : T("native.hist_name", "Name This Version"), "", (e) => {
      const b = e.currentTarget, inp = document.createElement("input");
      inp.className = "nm"; inp.value = it.name || ""; inp.placeholder = when; inp.maxLength = 80; inp.spellcheck = false;
      b.replaceWith(inp); inp.focus();
      let done = false;
      const fin = async (save) => {
        if (done) return; done = true;
        if (save && inp.value.trim() !== (it.name || "")) { try { await this._edHistWs({ op: "update", args: { item: it.id, name: inp.value.trim() } }); it.name = inp.value.trim(); } catch (err) {} }
        this._edHistItem(it);
      };
      inp.onkeydown = (k) => { if (k.key === "Enter") { k.preventDefault(); fin(true); } else if (k.key === "Escape") { k.preventDefault(); k.stopPropagation(); fin(false); } };
      inp.onblur = () => fin(true);
    });
    act(T("native.hist_delete", "Delete Version"), "red", async () => {
      const ok = await this._alert({ title: T("native.hist_delete_q", "Delete This Version?"), message: T("native.hist_delete_msg", "You can't undo this."), ok: T("native.delete", "Delete"), destructive: true });
      if (!ok) return;
      try { await this._edHistWs({ op: "update", args: { item: it.id, delete: true } }); } catch (e) {}
      this._edHist();
    });
  }

  async _edHistSave(s, base, lines) {
    if (!s || !this._hass) return;
    try {
      const dash = s._embedDash, list = (await this._edHistWs({ op: "list", args: { dash } })).items || [];
      if (!list.length && base) await this._edHistWs({ op: "add", args: { dash, snap: JSON.parse(JSON.stringify(base)), name: T("native.hist_original", "Before Editing in Hemma") } });
      await this._edHistWs({ op: "add", args: { dash, snap: JSON.parse(JSON.stringify(s._snap())), lines: lines.slice(0, 8), n: lines.length } });
    } catch (e) {}
  }

  _edChangesClose() {
    const ed = this._root.querySelector(".ed"), box = ed && ed.querySelector(".edcl");
    if (this._edClOut) { document.removeEventListener("pointerdown", this._edClOut, true); this._edClOut = null; }
    if (this._edClKey) { document.removeEventListener("keydown", this._edClKey, true); this._edClKey = null; }
    this._edTaken = [];
    if (!box) return;
    box.remove();
    const b = ed.querySelector(".edchg");
    if (b) b.setAttribute("aria-expanded", "false");
  }

  _edKeyFor(room) {
    if (!room) return "";
    if (room === this._edFav()) { const row = (this._rows || []).find((r) => r.fav); return "home|" + (row ? row.name : "Favorites"); }
    return "room|" + room.name + "|";
  }

  _edPageOf(room) {
    if (!room) return null;
    if (room === this._edFav()) return ["home"];
    const i = this._layout.rooms.findIndex((x) => String(x.name).trim().toLowerCase() === String(room.name || "").trim().toLowerCase());
    return i >= 0 ? ["room", i] : null;
  }

  _edGoThen(room, fn) {
    const p = this._edPageOf(room);
    const here = p && (p[0] === "home" ? this._page === "home" : this._page === "room" && this._room === p[1]);
    if (p && !here) this._go(p[0], p[1]);
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  _edJump(room, entity) {
    this._edGoThen(room, () => {
      const els = [...this._root.querySelectorAll(`.main .grid .t[data-e="${window.CSS.escape(entity)}"]`)];
      const el = els.find((n) => this._edRoomFor(n.closest(".grid").dataset.k) === room) || els[0];
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        this._edSelect(el);
        el.classList.add("flash");
        setTimeout(() => el.classList.remove("flash"), 1900);
        return;
      }
      const s = this._studio, t = (room.tiles || []).find((x) => x && x.entity === entity);
      if (s && t) { s._sel = null; s._select({ group: "tiles", key: s._tileKey(t) }); }
    });
  }

  _edSearchItems() {
    const s = this._studio, st = s && s._state, H = this._hass, S = H.states, out = [];
    if (!st) return out;
    const norm = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const add = (o) => { o.hay = norm([o.label, o.sub, o.words].join(" ")); out.push(o); };
    const rooms = st.compact.rooms, cur = this._edPageRoom() || this._edFav();
    const A = T("native.k_action", "Action"), RM = T("native.k_room", "Room"), SE = T("native.k_setting", "Setting"), TI = T("native.k_tile", "Tile"), DV = T("native.k_device", "Device");
    add({ kind: "action", tag: A, label: T("native.add_tile", "Add a tile"), sub: cur && cur.name, icon: PLUS, words: "new tile device", run: () => this._edGoThen(cur, () => this._edAdd(this._edKeyFor(cur))) });
    add({ kind: "action", tag: A, label: T("native.add_room", "Add a room"), icon: this._icon("home"), words: "new room", run: () => s._addRoom() });
    add({ kind: "action", tag: A, label: T("native.rename_room", "Rename this room"), sub: s._state.compact.rooms[s._room] && s._state.compact.rooms[s._room].name, icon: this._icon("pencil"), words: "rename name room", run: () => s._roomMenuAction("rename", s._room) });
    add({ kind: "action", tag: A, label: T("native.room_icon", "Change room icon"), icon: this._icon("home"), words: "icon room", run: () => s._roomIconMenu(this._root.querySelector(".edroom"), s._room) });
    add({ kind: "action", tag: A, label: T("native.undo", "Undo"), icon: this._icon("backward"), words: "undo back", run: () => s._undo() });
    add({ kind: "action", tag: A, label: T("native.redo", "Redo"), icon: this._icon("forward"), words: "redo again", run: () => s._redo() });
    rooms.forEach((r) => add({ kind: "room", tag: RM, label: r.name, icon: this._roomIconFor(r.name), words: "room", run: () => this._edGoThen(r, () => {}) }));
    (s._embedSections ? s._embedSections() : []).forEach((sec) => add({ kind: "setting", tag: SE, label: sec.label, sub: s._state.compact.rooms[s._room] && s._state.compact.rooms[s._room].name, icon: sec.icon ? this._icon(sec.icon) : this._icon("settings"), words: "settings", run: () => { s._sel = null; s._select({ group: sec.group, key: sec.key, label: sec.label }); } }));
    const has = new Set();
    rooms.forEach((r) => (r.tiles || []).forEach((t) => {
      if (!t || !t.entity) return;
      has.add(t.entity);
      const a = S[t.entity] && S[t.entity].attributes;
      add({ kind: "tile", tag: TI, label: t.name || (a && a.friendly_name) || t.entity, sub: r.name, icon: this._tileIconFor(t.entity), words: [t.entity, a && a.friendly_name].join(" "), run: () => this._edJump(r, t.entity) });
    }));
    (this._rows || []).forEach((row) => {
      const r = row.fav ? this._edFav() : this._edByName(row.name);
      if (!r) return;
      let list = row.cards;
      try { list = this._expand(row.name, row.cards); } catch (e) {}
      list.forEach((c) => {
        if (!c.entity || has.has(c.entity)) return;
        has.add(c.entity);
        const a = S[c.entity] && S[c.entity].attributes;
        add({ kind: "tile", tag: TI, label: c.name || (a && a.friendly_name) || c.entity, sub: r.name, icon: this._tileIconFor(c.entity), words: [c.entity, a && a.friendly_name].join(" "), run: () => this._edJump(r, c.entity) });
      });
    });
    const DEV = ["light", "switch", "fan", "climate", "cover", "lock", "media_player", "humidifier", "vacuum", "camera", "plant", "water_heater"];
    const areaOf = (id) => { const e = (H.entities || {})[id] || {}; return e.area_id || ((H.devices || {})[e.device_id] || {}).area_id || null; };
    Object.keys(S).forEach((id) => {
      if (!DEV.includes(domainOf(id)) || has.has(id) || ["unavailable", "unknown"].includes(S[id].state)) return;
      const e = (H.entities || {})[id];
      if (e && (e.hidden || e.hidden_by || e.disabled_by || e.entity_category)) return;
      const an = ((H.areas || {})[areaOf(id)] || {}).name || "", target = rooms.find((r) => an && norm(r.name) === norm(an)) || cur;
      add({ kind: "device", tag: DV, label: String(S[id].attributes.friendly_name || id), sub: T("native.add_to", "Add to {name}", { name: target === this._edFav() ? T("nav.favorites", "Favorites") : target.name }), icon: this._tileIconFor(id), words: id + " " + an, run: () => this._edGoThen(target, () => this._edPlace(target, this._edKeyFor(target), id, "", null)) });
    });
    return out;
  }

  _edSearchWire(ed) {
    const q = ed.querySelector(".edq"), box = ed.querySelector(".edres");
    const norm = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const KR = { action: 0, room: 1, setting: 2, tile: 3, device: 4 };
    let items = null, hits = [], at = 0;
    const light = (i) => { at = i; box.querySelectorAll(".rr").forEach((b, j) => b.classList.toggle("hi", j === i)); const el = box.querySelector(`.rr[data-i="${i}"]`); if (el) el.scrollIntoView({ block: "nearest" }); };
    const close = () => { q.value = ""; box.hidden = true; hits = []; };
    const run = (i) => { const h = hits[i]; if (!h) return; close(); q.blur(); items = null; h.run(); };
    const draw = () => {
      const v = norm(q.value).trim();
      if (!v) { box.hidden = true; hits = []; return; }
      if (!items) items = this._edSearchItems();
      const words = v.split(/\s+/);
      hits = items.filter((it) => words.every((w) => it.hay.includes(w)))
        .map((it) => { const l = norm(it.label); return { it, sc: (l.startsWith(v) ? 0 : l.includes(v) ? 1 : 2) * 10 + KR[it.kind] }; })
        .sort((a, b) => a.sc - b.sc || a.it.label.localeCompare(b.it.label)).slice(0, 40).map((x) => x.it);
      at = 0;
      box.hidden = false;
      box.innerHTML = hits.length ? `<div class="rg" role="listbox">${hits.map((h, i) => `<button type="button" role="option" class="rr${i === 0 ? " hi" : ""}" data-i="${i}"><span class="ri"><i style="--i:${h.icon}"></i></span><span class="tx"><b>${esc(h.label)}</b>${h.sub ? `<small>${esc(h.sub)}</small>` : ""}</span><span class="kt">${esc(h.tag)}</span></button>`).join("")}</div>` : `<div class="none">${esc(T("native.no_matches", "No matches"))}</div>`;
      box.scrollTop = 0;
      box.querySelectorAll(".rr").forEach((b) => { b.onmouseenter = () => light(+b.dataset.i); b.onmousedown = (e) => e.preventDefault(); b.onclick = () => run(+b.dataset.i); });
    };
    q.addEventListener("input", draw);
    q.addEventListener("focus", () => { items = null; if (q.value) draw(); });
    q.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); if (hits.length) light((at + 1) % hits.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (hits.length) light((at - 1 + hits.length) % hits.length); }
      else if (e.key === "Enter") { e.preventDefault(); run(at); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (q.value) close(); else q.blur(); }
    });
  }

  _edClose() {
    this._host.classList.remove("phs");
    this._edChangesClose();
    this._edHistClose();
    this._pvEnd();
    this._root.querySelectorAll(".tst").forEach((n) => n.remove());
    const ed = this._root.querySelector(".ed"), halo = this._root.querySelector(".edhalo");
    if (halo) { halo.classList.remove("in"); setTimeout(() => halo.remove(), 480); }
    const s = this._studio;
    this._studio = null;
    this._edReady = false;
    if (s) setTimeout(() => { if (this._studio !== s) { s.classList.remove("pending"); this._edPark(s); } }, 560);
    this._edSel = null;
    if (!ed) return;
    ed.classList.remove("in");
    ed.classList.add("out");
    setTimeout(() => ed.remove(), 520);
  }

  _edSheet(ed) {
    if (!this._host.classList.contains("ph")) return;
    const g = ed.querySelector(".grab"), h = ed.querySelector(".edh");
    const stops = () => [150, Math.round(innerHeight * 0.62), Math.round(innerHeight * 0.92)];
    let y0 = 0, h0 = 0, on = false;
    const down = (e) => { if (e.target.closest("button")) return; on = true; y0 = e.clientY; h0 = ed.getBoundingClientRect().height; ed.classList.add("drag"); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} };
    const move = (e) => { if (!on) return; ed.style.height = Math.max(120, Math.min(innerHeight * 0.95, h0 - (e.clientY - y0))) + "px"; };
    const up = () => {
      if (!on) return;
      on = false; ed.classList.remove("drag");
      const cur = ed.getBoundingClientRect().height, s = stops();
      const to = s.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a));
      ed.style.height = to + "px";
      this._host.style.setProperty("--edh", to + "px");
    };
    [g, h].forEach((el) => { el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); });
  }

  _edFav() {
    const s = this._studio, rooms = (s && s._state && s._state.compact.rooms) || [];
    return rooms.find((r) => { try { return !!s._favSection(r); } catch (e) { return false; } }) || rooms[0] || null;
  }

  _edByName(name) {
    const s = this._studio, want = String(name || "").trim().toLowerCase();
    return ((s && s._state && s._state.compact.rooms) || []).find((r) => String(r.name || "").trim().toLowerCase() === want) || null;
  }

  _edPageRoom() {
    if (this._page === "home") return this._edFav();
    if (this._page === "room") return this._edByName((this._layout.rooms[this._room] || {}).name);
    return null;
  }

  _edSyncSoon(how) {
    clearTimeout(this._edSyncT);
    const run = () => { this._edSyncT = 0; this._edSync(); this._edHead(); };
    const s = this._studio, r = this._edPageRoom();
    if (!s || !s._state || !r || s._state.compact.rooms.indexOf(r) === s._room) { this._edHead(); return; }
    if (!how) { requestAnimationFrame(() => { this._edSyncT = setTimeout(run, 16); }); return; }
    this._edSyncT = setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(run, { timeout: 300 }) : run()), 500);
  }

  _edSync() {
    const s = this._studio, r = this._edPageRoom();
    if (!s || !s._state || !r) return;
    const i = s._state.compact.rooms.indexOf(r);
    if (i < 0 || i === s._room) return;
    this._edSyncing = true;
    s._sel = null; s._room = i;
    try { s._renderTabs(); s._renderForm(); } catch (e) {}
    this._edSyncing = false;
  }

  _edFollow() {
    const s = this._studio;
    if (!s || !s._state || this._edSyncing) return;
    const r = s._state.compact.rooms[s._room];
    if (!r || r === this._edPageRoom()) return;
    if (r === this._edFav()) { if (this._page !== "home") this._go("home"); return; }
    const i = this._layout.rooms.findIndex((x) => String(x.name).trim().toLowerCase() === String(r.name).trim().toLowerCase());
    if (i >= 0) this._go("room", i);
  }

  _edRoomFor(key) {
    const p = String(key || "").split("|");
    if (p[0] !== "home" && p[0] !== "room") return null;
    const row = (this._rows || []).find((r) => r.name === p[1]);
    return row && row.fav ? this._edFav() : this._edByName(p[1]);
  }

  _edTileFor(b) {
    const s = this._studio, e = b && b.dataset.e;
    if (!s || !s._state || !e) return null;
    const grid = b.closest(".grid"), room = this._edRoomFor(grid && grid.dataset.k);
    const find = (r) => (r.tiles || []).find((t) => t && t.entity === e);
    const S = this._hass.states;
    const inGroup = (r) => (r.tiles || []).find((t) => t && t.entity && S[t.entity] && Array.isArray(S[t.entity].attributes.entity_id) && S[t.entity].attributes.entity_id.includes(e));
    for (const r of room ? [room] : s._state.compact.rooms) { const t = find(r); if (t) return { room: r, tile: t, own: true }; }
    for (const r of room ? [room] : s._state.compact.rooms) { const t = inGroup(r); if (t) return { room: r, tile: t, own: false }; }
    return null;
  }

  _edHomeStyle(s) {
    const rooms = (s && s._state && s._state.compact && s._state.compact.rooms) || [], home = rooms.find((r) => r.path === "home") || rooms[0];
    return String(((home && home.variables) || {}).hemma_style || "");
  }

  _edPreview(now, force) {
    if (!now) {
      if (!this._edRaf) this._edRaf = requestAnimationFrame(() => { this._edRaf = 0; this._edPreview(true); });
      return;
    }
    if (this._edRaf) { cancelAnimationFrame(this._edRaf); this._edRaf = 0; }
    const s = this._studio;
    if (!s || !this._edit || this._edDragging) return;
    const print = s._lastPrint;
    if (!force && print !== undefined && print === this._edPrint) return;
    this._edPrint = print;
    if (force) this._edForced = performance.now();
    else if (this._edForced && performance.now() - this._edForced < 450 && this._edHomeStyle(s) === this._edStyle) { this._edForced = 0; return; }
    let b = null;
    try { b = s._embedBuild(); } catch (e) { console.warn("Hemma native preview failed", e); return; }
    if (!b) return;
    const run = () => {
      this._ingestDesktop(b.desktop);
      if (b.mobile) this._ingestMobile(b.mobile);
      this._renderKeep();
      this._pvBuilt = b;
      if (this._pvFrame) this._pvPush();
    };
    const style = this._edHomeStyle(s), was = this._edStyle;
    this._edStyle = style;
    if (was == null || was === style || !document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { run(); return null; }
    return this._styleFade(run);
  }

  _styleFade(run) {
    if (!document.getElementById("hemma-native-vt")) {
      const st = document.createElement("style");
      st.id = "hemma-native-vt";
      st.textContent = "html.hemma-vt::view-transition-new(root) { animation: none; } html.hemma-vt::view-transition-old(root) { z-index: 1; mix-blend-mode: normal; animation: hemma-vt-out .45s cubic-bezier(.4, 0, .2, 1) both; -webkit-mask: linear-gradient(#000 0 0) 0 0 / 100% 100% no-repeat, linear-gradient(#000 0 0) var(--hvt-x) var(--hvt-y) / var(--hvt-w) var(--hvt-h) no-repeat; -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) 0 0 / 100% 100% no-repeat exclude, linear-gradient(#000 0 0) var(--hvt-x) var(--hvt-y) / var(--hvt-w) var(--hvt-h) no-repeat; } @keyframes hemma-vt-out { to { opacity: 0; } }";
      document.head.appendChild(st);
    }
    const H = document.documentElement, ed = this._root.querySelector(".ed"), r = ed ? ed.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    [["--hvt-x", r.left], ["--hvt-y", r.top], ["--hvt-w", r.width], ["--hvt-h", r.height]].forEach(([k, v]) => H.style.setProperty(k, Math.round(v) + "px"));
    H.classList.add("hemma-vt");
    let vt = null;
    try {
      vt = document.startViewTransition(() => { run(); return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))); });
    } catch (e) { H.classList.remove("hemma-vt"); run(); return null; }
    vt.finished.finally(() => { H.classList.remove("hemma-vt"); ["--hvt-x", "--hvt-y", "--hvt-w", "--hvt-h"].forEach((k) => H.style.removeProperty(k)); });
    return vt.updateCallbackDone.catch(() => {});
  }

  _pvBar() {
    this._root.querySelectorAll(".pvb").forEach((n) => n.remove());
    if (PV || this._host.classList.contains("ph")) return;
    const own = this._host.classList.contains("tab") ? "tablet" : "desktop";
    this._pvOwn = own;
    this._pvDev = own;
    const ico = {
      desktop: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3.5" width="16" height="10.5" rx="1.8"/><path d="M7.5 17h5M10 14v3" stroke-linecap="round"/></svg>',
      tablet: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2"/></svg>',
      phone: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="6" y="2.5" width="8" height="15" rx="2"/></svg>',
      day: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.4"/><path d="M10 2.2v1.9M10 15.9v1.9M2.2 10h1.9M15.9 10h1.9M4.5 4.5l1.3 1.3M14.2 14.2l1.3 1.3M4.5 15.5l1.3-1.3M14.2 5.8l1.3-1.3"/></svg>',
      night: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M15.9 12.6A6.6 6.6 0 0 1 7.4 4.1a.5.5 0 0 0-.66-.6 7.2 7.2 0 1 0 9.76 9.76.5.5 0 0 0-.6-.66Z"/></svg>',
    };
    const L = { desktop: T("native.pv_desktop", "Desktop"), tablet: T("native.pv_tablet", "Tablet"), phone: T("native.pv_phone", "Phone"), day: T("native.pv_day", "Day"), night: T("native.pv_night", "Night") };
    const b = document.createElement("div");
    b.className = "pvb" + (document.documentElement.classList.contains("hemma-hv") && !this._isGlass() ? " flat" : "");
    b.setAttribute("role", "toolbar");
    b.setAttribute("aria-label", T("native.preview", "Preview"));
    b.innerHTML = ["desktop", "tablet", "phone"].map((k) => `<button type="button" data-dev="${k}" aria-pressed="${k === own}">${ico[k]}<span>${esc(L[k])}</span></button>`).join("") + `<i class="dv"></i>` + ["day", "night"].map((k) => `<button type="button" class="io" data-mode="${k}" aria-label="${esc(L[k])}" title="${esc(L[k])}">${ico[k]}</button>`).join("");
    const paint = () => {
      b.querySelectorAll("[data-dev]").forEach((n) => n.setAttribute("aria-pressed", String(n.dataset.dev === this._pvDev)));
      const dk = this._darkNow();
      b.querySelectorAll("[data-mode]").forEach((n) => n.setAttribute("aria-pressed", String((n.dataset.mode === "night") === dk)));
    };
    b.querySelectorAll("[data-dev]").forEach((n) => { n.onclick = () => { this._pvShow(n.dataset.dev); paint(); }; });
    b.querySelectorAll("[data-mode]").forEach((n) => { n.onclick = () => { this._pvMode(n.dataset.mode === "night"); paint(); }; });
    this._pvPaint = paint;
    paint();
    b.style.animation = "none";
    b.style.transition = "none";
    const H = this._host.classList, col = this._root.querySelector(".col");
    if (!H.contains("ph") && col) {
      const l = H.contains("fd") ? 264 : Math.max(0, col.getBoundingClientRect().left), r = window.innerWidth - 416;
      H.contains("fd") || this._host.style.setProperty("--pvl", Math.round(l) + "px");
      this._host.style.setProperty("--pvcx", Math.round((l + r) / 2) + "px");
    }
    this._root.appendChild(b);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) b.animate([{ opacity: 0, translate: "0 -8px" }, { opacity: 1, translate: "0 0" }], { duration: 480, delay: 120, easing: SPR, fill: "backwards" });
    setTimeout(() => {
      if (!b.isConnected) return;
      this._pvCenter();
      requestAnimationFrame(() => requestAnimationFrame(() => { b.style.transition = ""; }));
    }, 640);
    clearTimeout(this._pvPre);
    this._pvPre = setTimeout(() => { if (this._edit && !this._pvFrame) this._pvEnsure("tablet"); }, 1500);
  }

  _pvMode(night) {
    if (night === this._darkNow()) return;
    this._pvDark = night;
    this._darkSwap();
    const k = this._pvKid();
    if (k && k._darkSwap) {
      k._pvDark = night;
      k._darkSwap();
      const ink = !night && (k._host.classList.contains("lt") || k._host.classList.contains("gd"));
      this._root.querySelectorAll(".pvf .sb, .pvf .hb").forEach((n) => n.classList.toggle("ink", ink));
    }
  }

  _flatSync() {
    const flat = document.documentElement.classList.contains("hemma-hv") && !this._isGlass();
    this._root.querySelectorAll(".ed").forEach((n) => n.classList.toggle("flatm", flat));
    this._root.querySelectorAll(".pvb").forEach((n) => n.classList.toggle("flat", flat));
    const st = this._studio;
    if (st && st._state && st._setBackdrop && st.classList.contains("hvbg") !== flat) { try { st._setBackdrop(); } catch (e) {} }
  }

  _darkSwap() {
    if (!this._layout) return;
    this._hvSet();
    this._glassBg(this._page || "room", this._layout.rooms[this._room]);
    clearTimeout(this._darkT);
    this._darkT = setTimeout(() => { if (this._layout) this._renderKeep(); }, 900);
  }

  _pvEnd() {
    const f = this._root.querySelector(".pvf"), b = this._root.querySelector(".pvb:not(.gone)");
    if (b) { b.classList.add("gone"); b.animate([{ opacity: 1 }, { opacity: 0, translate: "0 -6px" }], { duration: 180, easing: "ease-in", fill: "forwards" }).finished.then(() => b.remove(), () => b.remove()); }
    if (f) { f.classList.add("out"); setTimeout(() => f.remove(), 240); }
    if (this._pvRo) { window.removeEventListener("resize", this._pvRo); this._pvRo = null; }
    if (this._pvCo) { this._pvCo.disconnect(); this._pvCo = null; }
    clearTimeout(this._pvPre);
    this._pvFrame = null;
    this._pvDev = null;
    this._pvShown = null;
    this._host.classList.remove("pvon");
    if (typeof this._pvDark === "boolean") { this._pvDark = undefined; this._hvDark = undefined; this._hvSet(); this._renderKeep(); }
  }

  _pvCenter() {
    const R = this._root, col = R.querySelector(".col"), ed = R.querySelector(".ed");
    if (!col) return;
    const l = Math.max(0, col.getBoundingClientRect().left), r = window.innerWidth - (ed && !this._host.classList.contains("ph") ? ed.offsetWidth : 0);
    this._host.style.setProperty("--pvl", Math.round(l) + "px");
    this._host.style.setProperty("--pvcx", Math.round((l + r) / 2) + "px");
    const d = R.querySelector(".pvf:not(.idle) .dev");
    if (d && d._fit) d._fit();
  }

  _pvEnsure(dev) {
    let f = this._root.querySelector(".pvf:not(.out)");
    if (f) return f;
    f = document.createElement("div");
    f.className = "pvf idle";
    f.innerHTML = `<div class="ld"></div><div class="dev wait"><iframe></iframe><div class="sb" aria-hidden="true"><span>9:41</span><svg viewBox="0 0 70 13" fill="currentColor"><rect x="0" y="8" width="3" height="5" rx="1"/><rect x="5" y="5.5" width="3" height="7.5" rx="1"/><rect x="10" y="3" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="13" rx="1"/><path d="M31 3.2a10 10 0 0 1 13 0l-1.4 1.5a8 8 0 0 0-10.2 0zm2.6 2.8a6.2 6.2 0 0 1 7.8 0L40 7.5a4.2 4.2 0 0 0-5 0zm2.6 2.8a2.4 2.4 0 0 1 2.6 0l-1.3 1.6z"/><rect x="48.5" y=".5" width="19" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="50.5" y="2.5" width="15" height="8" rx="2"/><rect x="68.6" y="4.2" width="1.4" height="4.6" rx=".7" opacity=".4"/></svg></div></div>`;
    f.querySelector(".ld").textContent = T("native.pv_loading", "Loading preview…");
    const fr = f.querySelector("iframe");
    fr.dataset.hemmaPv = dev;
    fr._pvOwner = this;
    fr.title = T("native.preview", "Preview");
    this._root.appendChild(f);
    fr.src = "/hemma-native/home";
    this._pvFrame = fr;
    this._pvKidDev = dev;
    if (!this._pvRo) { this._pvRo = () => this._pvCenter(); window.addEventListener("resize", this._pvRo); }
    if (!this._pvCo && window.ResizeObserver) { const col = this._root.querySelector(".col"); if (col) { this._pvCo = new ResizeObserver(() => this._pvCenter()); this._pvCo.observe(col); } }
    this._pvCenter();
    let n = 0;
    const wait = () => {
      if (this._pvFrame !== fr) return;
      const k = this._pvKid();
      if (k && k._layout && k._hass && k._root.querySelector(".main .grid, .main .np, .main h3")) { this._pvReady = fr; if (this._pvShown) this._pvShow(this._pvShown); return; }
      if (++n < 400) setTimeout(wait, 150);
      else { const ld = f.querySelector(".ld"); if (ld) ld.textContent = T("native.pv_fail", "The preview couldn't load."); }
    };
    setTimeout(wait, 300);
    return f;
  }

  _pvShow(dev) {
    this._pvDev = dev;
    this._host.classList.toggle("pvon", dev !== this._pvOwn);
    if (dev === this._pvOwn) {
      this._pvShown = null;
      this._pvSideMark();
      const f = this._root.querySelector(".pvf:not(.out)");
      if (f && !f.classList.contains("idle")) { f.classList.add("idle"); }
      return;
    }
    this._pvShown = dev;
    const f = this._pvEnsure(dev), d = f.querySelector(".dev"), [W, H, rad] = PV_DEV[dev];
    f.classList.remove("idle");
    f.querySelectorAll(".sb, .hb").forEach((n) => { n.style.display = dev === "phone" ? "" : "none"; });
    d.style.width = W + "px"; d.style.height = H + "px"; d.style.borderRadius = rad + "px";
    d._fit = () => {
      const r = f.getBoundingClientRect(), padB = 44, pad = 96;
      const sc = Math.min((r.width - pad * 2) / W, (r.height - padB - pad) / H, 1);
      d.style.transform = `scale(${sc})`;
      d.style.left = Math.round((r.width - W * sc) / 2) + "px";
      d.style.top = Math.round(pad + (r.height - padB - pad - H * sc) / 2) + "px";
    };
    d._fit();
    if (this._pvReady !== this._pvFrame) { d.classList.add("wait"); return; }
    const k = this._pvKid();
    if (k && k._pvSetDev && this._pvKidDev !== dev) { this._pvKidDev = dev; k._pvSetDev(dev); }
    this._pvPush(true);
    this._pvSideMark();
    if (d.classList.contains("wait")) setTimeout(() => { d.classList.remove("wait"); const ld = f.querySelector(".ld"); if (ld) ld.remove(); }, 200);
  }

  _sideMorph(open) {
    const R = this._root, page = R.querySelector(".page"), nav = R.querySelector(".hdr .nav"), side = R.querySelector(".side");
    const mob = this._host.classList.contains("tab") || this._host.classList.contains("ph");
    if (this._smg) this._smg();
    if (!nav || !side || mob || !this._isGlass() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { page.classList.toggle("sideon", open); return; }
    const pg = page.getBoundingClientRect(), nr = nav.getBoundingClientRect();
    const VW = innerWidth, VH = innerHeight, SW = 264;
    const P = { left: open ? nr.left : pg.left + pg.width / 2 - nr.width / 2, top: nr.top, width: nr.width, height: nr.height }, r0 = nr.height / 2;
    const rgba = (c) => (String(c).match(/[\d.]+/g) || [255, 255, 255, 0.12]).map(Number).concat([1]).slice(0, 4);
    const ncs = getComputedStyle(nav), scs = getComputedStyle(side);
    const c0 = rgba(ncs.backgroundColor === "rgba(0, 0, 0, 0)" ? "rgba(255,255,255,0.12)" : ncs.backgroundColor);
    const g = document.createElement("div");
    const bf = scs.backdropFilter && scs.backdropFilter !== "none" ? scs.backdropFilter : "none";
    g.style.cssText = `position:fixed;z-index:30;left:0;top:0;width:100vw;height:100vh;pointer-events:none;-webkit-backdrop-filter:${bf};backdrop-filter:${bf}`;
    const inner = document.createElement("div");
    inner.style.cssText = `position:absolute;inset:0;background-color:${scs.backgroundColor};background-image:${scs.backgroundImage}`;
    g.appendChild(inner);
    const spring = (t) => { const x = Math.max(0, Math.min(1, t)); return 1 - (1 + 8 * x) * Math.exp(-8 * x); }, norm = spring(1);
    const seg = (t, a0, b0) => spring((t - a0) / (b0 - a0)) / norm, lerp = (x0, x1, k) => x0 + (x1 - x0) * k;
    const N = 28, gf = [], inf = [], nf = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const kx = open ? seg(t, 0, 0.78) : 1 - seg(t, 0.22, 1), ky = open ? seg(t, 0.28, 1) : 1 - seg(t, 0, 0.72);
      const x = lerp(P.left, pg.left, kx), w = lerp(P.width, SW, kx), y = lerp(P.top, pg.top, ky), h = lerp(P.height, VH - pg.top, ky), r = lerp(r0, 0, Math.max(kx, ky));
      gf.push({ clipPath: `inset(${y}px ${VW - x - w}px ${VH - y - h}px ${x}px round ${r}px)`, backgroundColor: `rgba(${c0[0]},${c0[1]},${c0[2]},${c0[3]})` });
      inf.push({ opacity: ky });
      const lv = open ? Math.max(0, 1 - t / 0.5) : Math.max(0, (t - 0.5) / 0.5);
      nf.push({ transform: `translateX(${(x - P.left) + (w - P.width) / 2}px)`, opacity: lv, filter: `blur(${((1 - lv) * 10).toFixed(2)}px)` });
    }
    const T = 480, kids = [...side.children];
    let over = false;
    const quiet = (on) => ["background", "-webkit-backdrop-filter", "backdrop-filter"].forEach((k) => (on ? side.style.setProperty(k, k === "background" ? "transparent" : "none", "important") : side.style.removeProperty(k)));
    const ghost = nav.cloneNode(true);
    ghost.removeAttribute("id");
    Object.assign(ghost.style, { position: "fixed", left: P.left + "px", top: P.top + "px", width: P.width + "px", height: P.height + "px", right: "auto", margin: "0", transform: "none", transition: "none", zIndex: "31", pointerEvents: "none", maxWidth: "none" });
    const finish = () => {
      if (over) return; over = true; this._smg = null; quiet(false); g.remove(); ghost.remove();
      nav.style.transition = "none"; nav.style.removeProperty("opacity"); nav.getAnimations().forEach((a) => a.cancel()); getComputedStyle(nav).opacity;
      requestAnimationFrame(() => nav.style.removeProperty("transition"));
      kids.forEach((k) => { k.style.opacity = ""; });
    };
    this._smg = finish;
    R.appendChild(g);
    quiet(true);
    const fade = [{ opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)" }];
    if (open) {
      kids.forEach((k) => { k.style.opacity = "0"; });
      nav.style.transition = "none"; nav.style.opacity = "0";
      R.appendChild(ghost);
      page.classList.add("sideon");
      ghost.animate(nf, { duration: T, easing: "linear", fill: "forwards" });
      inner.animate(inf, { duration: T, easing: "linear", fill: "forwards" });
      g.animate(gf, { duration: T, easing: "linear", fill: "forwards" }).finished.then(() => {
        if (over) return;
        kids.forEach((k) => { k.style.opacity = ""; k.animate(fade, { duration: 200, easing: "ease-out" }); });
        finish();
      }, finish);
    } else {
      kids.forEach((k) => { k.style.opacity = "0"; });
      nav.style.transition = "none"; nav.style.opacity = "0";
      R.appendChild(ghost);
      page.classList.remove("sideon");
      ghost.animate(nf, { duration: T, easing: "linear", fill: "forwards" });
      inner.animate(inf, { duration: T, easing: "linear", fill: "forwards" });
      g.animate(gf, { duration: T, easing: "linear", fill: "forwards" }).finished.then(() => {
        if (over) return;
        finish();
      }, finish);
    }
  }

  _sideGo(page, room) {
    const k = this._edit && this._pvShown && this._pvReady === this._pvFrame ? this._pvKid() : null;
    if (!k || !k._layout) { this._go(page, room); return; }
    if (page === "room") {
      const want = String(((this._layout.rooms[room] || {}).name) || "").trim().toLowerCase();
      const i = k._layout.rooms.findIndex((r) => String(r.name || "").trim().toLowerCase() === want);
      if (i >= 0) k._go("room", i);
    } else k._go(page);
  }

  _pvSideMark() {
    const R = this._root, k = this._pvShown ? this._pvKid() : null;
    let page = this._page || "room", room = this._room;
    if (k && k._layout) {
      page = k._page || "room";
      if (page === "room") { const want = String(((k._layout.rooms[k._room] || {}).name) || "").trim().toLowerCase(); room = this._layout.rooms.findIndex((r) => String(r.name || "").trim().toLowerCase() === want); }
    }
    const sel = page === "home" ? ".side .homeb" : page === "room" ? `.side [data-room="${room}"]` : `.side [data-cat="${page}"]`;
    R.querySelectorAll(".side .on").forEach((n) => n.classList.remove("on"));
    const b = R.querySelector(sel);
    if (b) b.classList.add("on");
  }

  _pvKid() {
    try { const w = this._pvFrame && this._pvFrame.contentWindow; return (w && w.__hemmaNativePv) || null; } catch (e) { return null; }
  }

  _pvPushSoon(b, follow) {
    if (!this._pvFrame) return;
    if (b) this._pvBuilt = b;
    if (follow) this._pvFollow = true;
    clearTimeout(this._pvT);
    this._pvT = setTimeout(() => { const f = this._pvFollow; this._pvFollow = false; this._pvPush(f); }, 60);
  }

  _pvPush(follow) {
    const k = this._pvKid();
    if (!k || !k._layout) return;
    const s = this._studio;
    let b = this._pvBuilt || null;
    if (!b && s && s._state && s._embedBuild) { try { b = s._embedBuild(); } catch (e) { b = null; } }
    this._pvBuilt = b;
    try {
      if (b) { k._ingestDesktop(b.desktop); if (b.mobile) k._ingestMobile(b.mobile); }
      k._pvDark = this._darkNow();
      k._hvSet();
      const ink = !k._pvDark && (k._host.classList.contains("lt") || k._host.classList.contains("gd"));
      this._root.querySelectorAll(".pvf .sb, .pvf .hb").forEach((n) => n.classList.toggle("ink", ink));
      if (follow) {
        const want = this._page === "room" ? String(((this._layout.rooms[this._room] || {}).name) || "").trim().toLowerCase() : null;
        if (want != null) { const i = k._layout.rooms.findIndex((r) => String(r.name || "").trim().toLowerCase() === want); if (i >= 0 && (k._page !== "room" || k._room !== i)) { k._go("room", i); return; } }
        else if (this._page && k._page !== this._page) { k._go(this._page); return; }
      }
      k._renderKeep();
    } catch (e) { console.warn("Hemma preview update failed", e); }
  }

  _ingestDesktop(cfg) {
    this._applyRooms(cfg);
    for (const v of cfg.views || []) {
      const room = (v.cards || []).find((c) => [].concat(c.template || []).includes("hemma_room"));
      if (room && room.variables) { this._dashV = room.variables; break; }
    }
    this._hvDark = undefined;
    this._hvSet();
  }

  _edSnap() {
    const m = new Map();
    this._root.querySelectorAll(".main .grid .t[data-e], .main h3, .hdr .wx").forEach((n) => {
      const k = n.matches("h3") ? "h3|" + n.textContent : n.matches(".wx") ? "wx" : (n.closest(".grid").dataset.k || "") + "|" + n.dataset.e;
      if (!m.has(k)) m.set(k, n.getBoundingClientRect());
    });
    return m;
  }

  _navRect(hdr) {
    const nav = hdr && hdr.querySelector(".nav"), on = nav && nav.querySelector("button.on");
    if (!on || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    const cs = getComputedStyle(nav);
    if (cs.display === "none" || +cs.opacity < 0.5) return null;
    const h = hdr.getBoundingClientRect(), r = on.getBoundingClientRect();
    if (!r.width) return null;
    return { x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height, k: on.dataset.room || (on.hasAttribute("data-home") ? "home" : "scenes") };
  }

  _navLens(hdr, a, to) {
    const nav = hdr.querySelector(".nav"), on = to || nav.querySelector("button.on");
    if (!on) return;
    const k = on.dataset.room || (on.hasAttribute("data-home") ? "home" : "scenes");
    if (k === a.k || (this._lensTo === k && hdr.querySelector(".nlens"))) return;
    this._lensTo = k;
    const hr = hdr.getBoundingClientRect(), r = on.getBoundingClientRect();
    const b = { x: r.left - hr.left, y: r.top - hr.top, w: r.width, h: r.height };
    hdr.querySelectorAll(".nlens").forEach((n) => n.remove());
    const L = this._lensGlass(hdr, nav);
    nav.classList.add("lensing");
    clearTimeout(this._lensT);
    const nq = nav.getBoundingClientRect(), nx = nq.left - hr.left, ny = nq.top - hr.top, mk = [], ok = [];
    const D = 320, N = 40, ss = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const zeta = 0.74, w0 = 24, wd = w0 * Math.sqrt(1 - zeta * zeta);
    const sp = (t) => (t <= 0 ? 0 : 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t)));
    const T = 0.24, end = sp(T), pos = (u) => sp(Math.max(0, Math.min(1, (u - 0.04) / 0.72)) * T) / end;
    const dist = Math.abs(b.x + b.w / 2 - (a.x + a.w / 2)), kf = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, lift = Math.min(ss(u / 0.14), ss((1 - u) / 0.32)), p = pos(u), v = Math.abs(pos(Math.min(1, u + 1 / N)) - p) * N;
      const cx = a.x + a.w / 2 + (b.x + b.w / 2 - (a.x + a.w / 2)) * p, cy = a.y + a.h / 2 + (b.y + b.h / 2 - (a.y + a.h / 2)) * p;
      const st = Math.min(0.2, v * dist / 3000), w = (a.w + (b.w - a.w) * Math.min(1, p)) * (1 + st) + 10 * lift, h = (a.h + (b.h - a.h) * Math.min(1, p) + 12 * lift) * (1 - st * 0.35);
      const o = Math.min(1, lift * 1.6);
      kf.push({ offset: u, left: cx - w / 2 + "px", top: cy - h / 2 + "px", width: w + "px", height: h + "px", boxShadow: `0 8px 22px -8px rgba(0,0,0,${(0.3 * o).toFixed(3)})` });
      mk.push(Object.assign({ offset: u, opacity: o }, this._lensMag(cx - w / 2, cy - h / 2, w, h, nx, ny, 1 + 0.2 * lift)));
      ok.push({ offset: u, opacity: o });
    }
    this._lensT = setTimeout(() => { if (L.isConnected) nav.classList.remove("lensing"); }, D * 0.62);
    const done = () => { L.remove(); if (!hdr.querySelector(".nlens")) { nav.classList.remove("lensing"); this._lensTo = null; } };
    L.animate(kf, { duration: D, easing: "linear", fill: "both" }).finished.then(done, done);
    L.querySelector(".lm").animate(mk, { duration: D, easing: "linear", fill: "both" });
    L.querySelectorAll(".lb, .lr").forEach((n) => n.animate(ok, { duration: D, easing: "linear", fill: "both" }));
  }

  _lensGlass(hdr, nav) {
    const L = document.createElement("div");
    L.className = "nlens";
    L.innerHTML = '<i class="lb"></i><div class="nav lm"></div><i class="lr"></i>';
    const lm = L.querySelector(".lm"), q = nav.getBoundingClientRect(), cs = getComputedStyle(nav);
    lm.innerHTML = nav.innerHTML;
    lm.querySelectorAll(".on").forEach((n) => n.classList.remove("on"));
    Object.assign(lm.style, { width: q.width + "px", height: q.height + "px", padding: cs.padding, gap: cs.gap, marginLeft: -nav.scrollLeft + "px" });
    hdr.appendChild(L);
    return L;
  }

  _lensMag(lx, ly, w, h, nx, ny, m) {
    return { left: nx - lx + "px", top: ny - ly + "px", transformOrigin: `${lx + w / 2 - nx}px ${ly + h / 2 - ny}px`, transform: `scale(${m.toFixed(3)})` };
  }

  _navPress(hdr) {
    const nav = hdr.querySelector(".nav");
    if (nav) requestAnimationFrame(() => { nav.style.touchAction = nav.scrollWidth > nav.clientWidth + 1 ? "" : "pan-y"; });
    hdr.querySelectorAll(".nav button[data-home], .nav button[data-room]").forEach((b) => {
      b.onpointerdown = (e) => {
        if (e.button || this._edit) return;
        this._navDrag = { x: e.clientX, id: e.pointerId, from: b, live: false };
        if (b.classList.contains("on")) return;
        const a = this._navRect(hdr);
        if (a) this._navLens(hdr, a, b);
      };
    });
    if (nav._dragWired) return;
    nav._dragWired = true;
    const tabs = () => [...nav.querySelectorAll("button[data-home], button[data-room]")];
    const near = (x) => tabs().reduce((best, t) => { const r = t.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x); return !best || d < best.d ? { t, d } : best; }, null);
    nav.addEventListener("pointermove", (e) => {
      const D = this._navDrag;
      if (!D || D.id !== e.pointerId || this._edit) return;
      if (!D.live) {
        if (Math.abs(e.clientX - D.x) < 8) return;
        D.live = true;
        try { nav.setPointerCapture(e.pointerId); } catch (x) {}
        hdr.querySelectorAll(".nlens").forEach((n) => { n.getAnimations().forEach((an) => an.cancel()); n.remove(); });
        clearTimeout(this._lensT);
        const L = this._lensGlass(hdr, nav);
        L.classList.add("drag");
        nav.classList.add("lensing");
        D.lens = L;
      }
      const hr = hdr.getBoundingClientRect(), nr = nav.getBoundingClientRect(), hit = near(e.clientX);
      if (!hit) return;
      const r = hit.t.getBoundingClientRect(), w = r.width + 8, h = r.height + 10;
      const cx = Math.max(nr.left + w / 2, Math.min(nr.right - w / 2, e.clientX * 0.6 + (r.left + r.width / 2) * 0.4));
      const lx = cx - w / 2 - hr.left, ly = r.top + r.height / 2 - h / 2 - hr.top;
      Object.assign(D.lens.style, { left: lx + "px", top: ly + "px", width: w + "px", height: h + "px" });
      Object.assign(D.lens.querySelector(".lm").style, this._lensMag(lx, ly, w, h, nr.left - hr.left, nr.top - hr.top, 1.2));
      D.to = hit.t;
    });
    const end = (e) => {
      const D = this._navDrag;
      if (!D || D.id !== e.pointerId) return;
      this._navDrag = null;
      if (!D.live) return;
      this._navDragged = true;
      setTimeout(() => { this._navDragged = false; }, 400);
      const L = D.lens, t = D.to;
      if (!t || t.classList.contains("on")) {
        nav.classList.remove("lensing");
        if (L) L.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }).finished.then(() => L.remove(), () => L.remove());
        return;
      }
      const hr = hdr.getBoundingClientRect(), lr = L.getBoundingClientRect();
      this._lensFrom = { x: lr.left - hr.left + 4, y: lr.top - hr.top + 5, w: lr.width - 8, h: lr.height - 10, k: "drag" };
      L.remove();
      t.click();
    };
    nav.addEventListener("pointerup", end);
    nav.addEventListener("pointercancel", end);
    nav.addEventListener("click", (e) => { if (this._navDragged && e.isTrusted) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  _edFlip(snap, skip, ms, ease) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this._root.querySelectorAll(".main .grid .t[data-e], .main h3, .hdr .wx").forEach((n) => {
      const k = n.matches("h3") ? "h3|" + n.textContent : n.matches(".wx") ? "wx" : (n.closest(".grid").dataset.k || "") + "|" + n.dataset.e;
      if (k === skip) return;
      const a = snap.get(k), z = n.getBoundingClientRect();
      if (!a || (Math.abs(a.left - z.left) < 0.5 && Math.abs(a.top - z.top) < 0.5)) return;
      n.animate([{ translate: `${a.left - z.left}px ${a.top - z.top}px` }, { translate: "0 0" }], { duration: ms || 420, easing: ease || "cubic-bezier(.32,.72,0,1)" });
    });
  }

  _alert(o) {
    return new Promise((done) => {
      const el = document.createElement("div");
      el.className = "al";
      el.innerHTML = `<div class="alc" role="alertdialog" aria-modal="true"><b>${esc(o.title)}</b>${o.message ? `<p>${esc(o.message)}</p>` : ""}<div class="alb"><button type="button" class="no">${esc(o.cancel || T("native.cancel", "Cancel"))}</button><button type="button" class="yes${o.destructive ? " red" : ""}">${esc(o.ok)}</button></div></div>`;
      this._root.appendChild(el);
      const fin = (v) => {
        document.removeEventListener("keydown", key, true);
        el.classList.add("out");
        setTimeout(() => el.remove(), 180);
        done(v);
      };
      const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); fin(false); } else if (e.key === "Enter") { e.stopPropagation(); fin(true); } };
      if (o.alt) { const a = document.createElement("button"); a.type = "button"; a.className = "alt"; a.textContent = o.alt; a.onclick = () => fin("alt"); el.querySelector(".alb").prepend(a); el.querySelector(".alb").classList.add("three"); }
      document.addEventListener("keydown", key, true);
      el.querySelector(".no").onclick = () => fin(false);
      el.querySelector(".yes").onclick = () => fin(true);
      el.querySelector(".yes").focus();
    });
  }

  async _edRemove(b) {
    const m = this._edTileFor(b);
    if (!m || !m.own) return;
    const nm = (b.querySelector(".tx b") || {}).textContent || "";
    const grid = b.closest(".grid"), fav = m.room === this._edFav();
    const where = fav ? T("nav.favorites", "Favorites") : m.room.name;
    const hid = b.classList.contains("hid");
    const ok = await this._alert({ title: T("native.remove_q", "Remove “{name}”?", { name: nm }), message: hid ? T("native.remove_or_show", "Remove it from {where}, or show it again.", { where }) : T("native.remove_or_hide", "Hide it to keep it in {where} without showing it, or remove it completely.", { where }), ok: T("native.remove", "Remove"), alt: hid ? T("native.show", "Show") : T("native.hide", "Hide"), destructive: true });
    if (!ok || !this._studio || !b.isConnected) return;
    if (ok === "alt") {
      this._studio._embedHide(m.tile, !hid);
      this._toast(hid ? T("native.shown_x", "Showing {name}", { name: nm }) : T("native.hidden_x", "Hid {name}", { name: nm }), T("native.undo", "Undo"), () => this._edUndo(false, true));
      this._edPreview(true);
      return;
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      b.style.animation = "none";
      await b.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.86)" }], { duration: 230, easing: "cubic-bezier(.4,0,.9,.6)", fill: "forwards" }).finished.catch(() => {});
    }
    const snap = this._edSnap();
    this._studio._embedRemove(m.room, m.tile);
    this._toast(T("native.removed_x", "Removed {name}", { name: nm }), T("native.undo", "Undo"), () => this._edUndo(false, true));
    this._edPreview(true);
    this._edFlip(snap, (grid.dataset.k || "") + "|" + b.dataset.e);
  }

  _edSelect(b) {
    const s = this._studio, m = this._edTileFor(b);
    if (!s || !m) return;
    const i = s._state.compact.rooms.indexOf(m.room);
    this._edSyncing = true;
    s._sel = null;
    if (s._room !== i) { s._room = i; try { s._renderTabs(); } catch (e) {} }
    s._select({ group: "tiles", key: s._tileKey(m.tile) });
    this._edSyncing = false;
    this._edSel = (b.closest(".grid").dataset.k || "") + "|" + b.dataset.e;
    this._root.querySelectorAll(".t.sel").forEach((n) => n.classList.remove("sel"));
    b.classList.add("sel");
    const ed = this._root.querySelector(".ed");
    if (this._host.classList.contains("ph")) this._phSheet("tile");
  }

  _phSheet(mode) {
    const ed = this._root.querySelector(".ed");
    if (!ed) return;
    ed.classList.toggle("full", mode === "full");
    ed.classList.toggle("in", !!mode);
    this._host.classList.toggle("phs", !!mode);
    const t = mode === "tile" && this._root.querySelector(".main:not(.prev) .t.sel"), main = t && t.closest(".main");
    if (t && main) requestAnimationFrame(() => { const r = t.getBoundingClientRect(), top = innerHeight * 0.38 - 12; if (r.bottom > top) main.scrollBy({ top: r.bottom - top, behavior: "smooth" }); });
  }

  _phPlus(btn) {
    const s = this._studio;
    if (!s || !s._state) return;
    const grid = this._root.querySelector(".main:not(.prev) .grid[data-k]"), key = grid && grid.dataset.k;
    const items = [];
    if (key) items.push({ label: T("native.add_tile", "Add a tile"), run: () => { this._phSheet("full"); this._edAdd(key); } });
    items.push({ label: T("native.add_room", "Add a room"), run: () => { this._phSheet("full"); s._addRoom(); } });
    items.push({ label: T("native.dash_settings", "Dashboard Settings"), run: () => { s._group = "rooms"; s._sel = null; try { s._renderForm(); } catch (e) {} this._phSheet("full"); } });
    if (s._isDirty && s._isDirty()) items.push({ label: T("native.discard", "Discard"), red: true, run: () => this._edCancel() });
    this._menu(btn, items);
  }

  _edAdd(key) {
    const s = this._studio, room = this._edRoomFor(key);
    if (!s || !s._state || !room) return;
    const ed = this._root.querySelector(".ed"), body = ed && ed.querySelector(".edb");
    if (!body) return;
    body.querySelectorAll(".edadd").forEach((n) => n.remove());
    const H = this._hass, S = H.states, fav = room === this._edFav();
    const title = fav ? T("nav.favorites", "Favorites") : room.name;
    const have = new Set((room.tiles || []).map((t) => t && t.entity).filter(Boolean));
    const native = this._layout.rooms.find((r) => String(r.name).trim().toLowerCase() === String(room.name).trim().toLowerCase());
    const areaOf = (id) => { const e = (H.entities || {})[id] || {}; return e.area_id || ((H.devices || {})[e.device_id] || {}).area_id || null; };
    const areaName = (a) => ((H.areas || {})[a] || {}).name || "";
    const types = s._embedTypes(), DEV = ["light", "switch", "fan", "climate", "cover", "lock", "media_player", "humidifier", "vacuum", "camera", "plant", "water_heater", "alarm_control_panel"];
    const supported = new Set(types.flatMap((t) => t.domains));
    const hidden = (id) => { const e = (H.entities || {})[id]; return e && (e.hidden || e.hidden_by || e.disabled_by || e.entity_category); };
    const all = Object.keys(S).filter((id) => supported.has(domainOf(id)) && !have.has(id) && !hidden(id))
      .map((id) => ({ id, name: String(S[id].attributes.friendly_name || id), area: areaOf(id) })).sort((a, b) => a.name.localeCompare(b.name));
    const live = (e) => !["unavailable", "unknown"].includes(S[e.id].state);
    const sugg = all.filter((e) => live(e) && DEV.includes(domainOf(e.id)) && (fav || !native || !native.area ? e.area && domainOf(e.id) !== "switch" : e.area === native.area))
      .sort((a, b) => areaName(a.area).localeCompare(areaName(b.area)) || a.name.localeCompare(b.name)).slice(0, 5);
    const SHORT = { energy_tile: "Energy", battery: "Batteries", plex: "Recently Added", game: "Game Activity", lock_group: "Locks", cover_group: "Covers" };
    const special = ["cameras", "energy_tile", "battery", "network", "updates", "plex", "game", "lock_group", "cover_group"].map((id) => types.find((t) => t.id === id)).filter(Boolean)
      .map((t) => Object.assign({}, t, { short: T("native.tile_" + t.id, SHORT[t.id] || t.label) }));
    const buttons = types.find((t) => t.id === "entity_actions");
    const CAT = [["light", "Lights", "light"], ["climate", "Thermostats", "thermostat"], ["media_player", "Speakers & TVs", "media"], ["fan", "Fans & Purifiers", "fan"], ["cover", "Blinds & Curtains", "curtain-open"], ["lock", "Locks", "lock-fill"], ["vacuum", "Vacuums", "vacuum"], ["humidifier", "Humidifiers", "humidifier"], ["plant", "Plants", "plant"], ["switch", "Switches", "power_on"], ["water_heater", "Water Heaters", "hot_water"], ["camera", "Cameras", "doorbell"], ["alarm_control_panel", "Alarms", "lock-fill"]]
      .map(([d, l, i]) => ({ d, l: T("native.cat_" + d, l), i, n: all.filter((e) => domainOf(e.id) === d).length })).filter((c) => c.n);
    const icon = (n) => (window.hemmaIconUrl ? `url('${window.hemmaIconUrl(n)}')` : "none");
    const dIcon = { light: "light", switch: "power_on", fan: "fan", climate: "thermostat", cover: "curtain-open", lock: "lock-fill", media_player: "media", humidifier: "humidifier", vacuum: "vacuum", camera: "doorbell", plant: "plant", sensor: "status", binary_sensor: "status", water_heater: "hot_water", alarm_control_panel: "lock-fill", script: "play", button: "play", scene: "scenes" };
    const KIND = { light: "Light", switch: "Switch", fan: "Fan", climate: "Thermostat", cover: "Cover", lock: "Lock", media_player: "Media", humidifier: "Humidifier", vacuum: "Vacuum", camera: "Camera", plant: "Plant", water_heater: "Water heater", alarm_control_panel: "Alarm", sensor: "Sensor", binary_sensor: "Sensor", script: "Script", button: "Button", scene: "Scene" };
    const kind = (id) => T("native.kind_" + domainOf(id), KIND[domainOf(id)] || domainOf(id));
    const stateOf = (id) => { let t = S[id].state; try { if (H.formatEntityState) t = H.formatEntityState(S[id]); } catch (e) {} return String(t).charAt(0).toUpperCase() + String(t).slice(1); };
    const row = (e, noArea) => `<button type="button" class="ent" data-id="${esc(e.id)}"><span class="ei" style="--i:${icon(dIcon[domainOf(e.id)] || "default")}"></span><span class="tx"><b>${esc(e.name)}</b><span>${esc([noArea ? "" : areaName(e.area), stateOf(e.id)].filter(Boolean).join(" · "))}</span></span><span class="ad-pl"></span></button>`;
    const tileGrid = (l) => `<div class="ad-grid">${l.map((t) => `<button type="button" class="ad-t" data-type="${esc(t.id)}"><i style="--i:${icon(t.icon || "default")}"></i><span>${esc(t.short)}</span></button>`).join("")}</div>`;
    const psr = s.shadowRoot, vis = (l) => [...l].find((n) => n.getBoundingClientRect().width);
    const pn = (vis(psr.querySelectorAll(".detailbar h3")) || vis(psr.querySelectorAll(".phonelist > h2.sidehead")) || {}).textContent || "";
    const prev = pn.trim() && pn.trim().length <= 12 ? pn.trim() : T("native.back", "Back");
    const box = document.createElement("div");
    box.className = "edadd";
    box.innerHTML = `<div class="adh"><button type="button" class="adb"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg><span class="adbl">${esc(prev)}</span></button><h2>${esc(T("native.add_to", "Add to {name}", { name: title }))}</h2></div><label class="srch"><svg viewBox="0 0 16 16" width="15" height="15"><circle cx="6.8" cy="6.8" r="5.3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="m10.8 10.8 3.7 3.7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg><input type="search" placeholder="${esc(T("native.search", "Search"))}" aria-label="${esc(T("native.search_tiles", "Search tiles and devices"))}" spellcheck="false" autocomplete="off"></label><div class="adl"></div>`;
    body.appendChild(box);
    const list = box.querySelector(".adl"), h2 = box.querySelector("h2"), inp = box.querySelector("input");
    const lab = box.querySelector(".adbl");
    const head = h2.textContent;
    let view = null;
    const draw = (q) => {
      q = String(q || "").trim().toLowerCase();
      lab.textContent = view ? T("native.back", "Back") : prev;
      if (view) {
        const c = CAT.find((x) => x.d === view), mine = all.filter((e) => domainOf(e.id) === view && (!q || e.name.toLowerCase().includes(q) || e.id.includes(q)));
        const groups = {};
        mine.forEach((e) => { const a = areaName(e.area) || T("native.no_room", "No Room"); (groups[a] = groups[a] || []).push(e); });
        const names = Object.keys(groups).sort((a, b) => a.localeCompare(b));
        h2.textContent = c ? c.l : head;
        list.innerHTML = names.length ? names.map((a) => `<div class="gt">${esc(a)}</div><div class="g">${groups[a].map((e) => row(e, true)).join("")}</div>`).join("") : `<div class="none">${esc(T("native.no_matches", "No matches"))}</div>`;
      } else if (q) {
        h2.textContent = head;
        const tiles = special.filter((t) => t.short.toLowerCase().includes(q) || String(t.label).toLowerCase().includes(q));
        const hit = all.filter((e) => e.name.toLowerCase().includes(q) || e.id.includes(q)).slice(0, 80);
        list.innerHTML = (tiles.length ? `<div class="gt">${esc(T("native.hemma_tiles", "Hemma Tiles"))}</div>${tileGrid(tiles)}` : "")
          + (hit.length ? `<div class="gt">${esc(T("native.devices", "Devices"))}</div><div class="g">${hit.map((e) => row(e)).join("")}</div>` : "")
          + (!tiles.length && !hit.length ? `<div class="none">${esc(T("native.no_matches", "No matches"))}</div>` : "");
      } else {
        h2.textContent = head;
        list.innerHTML = (special.length ? `<div class="gt">${esc(T("native.hemma_tiles", "Hemma Tiles"))}</div>${tileGrid(special)}` : "")
          + (sugg.length ? `<div class="gt">${esc(T("native.suggested_for", "Suggested for {name}", { name: title }))}</div><div class="g">${sugg.map((e) => row(e)).join("")}</div>` : "")
          + `<div class="gt">${esc(T("native.all_devices", "All Devices"))}</div><div class="g">${CAT.map((c) => `<button type="button" class="ent ad-c" data-cat="${esc(c.d)}"><span class="ei" style="--i:${icon(c.i)}"></span><span class="tx"><b>${esc(c.l)}</b></span><span class="ad-n">${c.n}</span><span class="ad-ch"></span></button>`).join("")}${buttons ? `<button type="button" class="ent ad-c" data-type="entity_actions"><span class="ei" style="--i:${icon("plug")}"></span><span class="tx"><b>${esc(T("native.custom_buttons", "Custom Buttons"))}</b></span><span class="ad-pl"></span></button>` : ""}</div>`;
      }
      list.querySelectorAll("[data-cat]").forEach((b) => { b.onclick = () => { view = b.dataset.cat; inp.value = ""; draw(""); box.scrollTop = 0; }; });
      list.querySelectorAll(".ent:not([data-cat]), .ad-t").forEach((b) => { b.onclick = () => this._edPlace(room, key, b.dataset.id || "", b.dataset.type || "", box); });
    };
    draw("");
    inp.oninput = (e) => draw(e.target.value);
    const close = () => { box.classList.add("out"); setTimeout(() => box.remove(), 320); };
    box.querySelector(".adb").onclick = () => { if (view) { view = null; inp.value = ""; draw(""); box.scrollTop = 0; } else close(); };
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("in")));
    if (!this._host.classList.contains("ph")) box.querySelector("input").focus({ preventScroll: true });
  }

  _edPlace(room, key, id, typeId, box) {
    const s = this._studio;
    if (!s || !s._state) return;
    const st = id && this._hass.states[id];
    const nr = this._layout.rooms.find((r) => String(r.name).trim().toLowerCase() === String(room.name).trim().toLowerCase());
    const name = st ? this._shortName(id, String(st.attributes.friendly_name || id), nr || { name: room.name }) : "";
    const tile = s._embedNewTile(id, name, typeId || undefined);
    if (!tile) return;
    room.tiles.push(tile);
    const snap = this._edSnap();
    s._markDirty();
    if (box) { box.classList.add("out"); setTimeout(() => box.remove(), 320); }
    this._edPreview(true);
    this._edFlip(snap);
    const el = id ? [...this._root.querySelectorAll(`.main .grid .t[data-e="${window.CSS.escape(id)}"]`)].find((n) => n.closest(".grid").dataset.k === key)
      || this._root.querySelector(`.main .grid .t[data-e="${window.CSS.escape(id)}"]`) : null;
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.style.animation = "none";
        el.animate([
          { opacity: 0, transform: "translateY(-16px) scale(1.14)", boxShadow: "0 24px 48px rgba(0,0,0,.35)" },
          { opacity: 1, transform: "translateY(2px) scale(0.98)", boxShadow: "0 4px 10px rgba(0,0,0,.18)", offset: 0.68 },
          { opacity: 1, transform: "none", boxShadow: "0 0 0 rgba(0,0,0,0)" },
        ], { duration: 560, easing: "cubic-bezier(.2,.9,.3,1)" }).finished.then(() => { el.style.animation = ""; }, () => {});
      }
      this._edSelect(el);
    } else {
      const i = s._state.compact.rooms.indexOf(room);
      if (s._room !== i) { this._edSyncing = true; s._room = i; try { s._renderTabs(); } catch (e) {} this._edSyncing = false; }
      s._select({ group: "tiles", key: s._tileKey(tile) });
    }
  }

  async _edDone() {
    const s = this._studio, b = this._root.querySelector(".hdr .ok");
    if (!s || !s._state || !s._isDirty()) { this._edDraftDrop(); return this._setEdit(false); }
    if (b) b.disabled = true;
    const base = s._cleanSnap, lines = s._embedChanges ? s._embedChanges().map((x) => x.text) : [];
    let ok = false;
    try { ok = await s._save(); } catch (e) { ok = false; }
    if (ok) this._edHistSave(s, base, lines);
    if (b) b.disabled = false;
    if (!ok) return;
    this._edDraftDrop();
    await this._edReload();
    this._setEdit(false);
  }

  async _edCancel() {
    const s = this._studio, dirty = !!(s && s._state && s._isDirty());
    if (dirty && !(await this._alert({ title: T("native.discard_q", "Discard Changes?"), message: T("native.discard_msg", "Your changes to the dashboard won't be saved."), ok: T("native.discard", "Discard"), cancel: T("native.keep_editing", "Keep Editing"), destructive: true }))) return;
    this._edDraftDrop();
    this._setEdit(false);
    if (dirty) { await Promise.all([this._edReload(), new Promise((r) => setTimeout(r, 500))]); if (!this._edit) this._renderKeep(); }
  }

  async _edReload() {
    try { await this._addSensors(); } catch (e) {}
    await this._chipCfg();
    this._hvDark = undefined;
    await this._notifyCfg();
  }

  _wireEdit() {
    const R = this._root;
    R.querySelectorAll(".main:not(.prev) .grid[data-k] .t[data-e]").forEach((b) => {
      const m = this._edTileFor(b);
      if (m && m.own && !b.querySelector(".rm")) {
        const rmv = document.createElement("span");
        rmv.className = "rm";
        rmv.setAttribute("role", "button");
        rmv.setAttribute("aria-label", T("native.remove", "Remove"));
        rmv.addEventListener("pointerdown", (e) => e.stopPropagation());
        rmv.addEventListener("click", (e) => { e.stopPropagation(); this._edRemove(b); });
        b.appendChild(rmv);
      }
      if (this._edSel && this._edSel === (b.closest(".grid").dataset.k || "") + "|" + b.dataset.e) b.classList.add("sel");
      if (!b._edWired) { b._edWired = 1; this._edDrag(b); }
    });
    R.querySelectorAll(".t.add").forEach((b) => { b.onclick = () => { if (this._host.classList.contains("ph")) this._phSheet("full"); this._edAdd(b.dataset.add); }; });
    if (this._host.classList.contains("ph")) {
      const plus = R.querySelector(".hdr .edplus"), h1 = R.querySelector(".main:not(.prev) .top h1"), s = this._studio;
      if (plus) plus.onclick = (e) => { e.stopPropagation(); this._phPlus(plus); };
      if (h1 && s && s._roomTitleMenu) h1.onclick = () => { if (this._edit) s._roomTitleMenu(h1); };
    }
  }

  _edDrag(b) {
    let sx = 0, sy = 0, gx = 0, gy = 0, id = null, armed = false, drag = false, hold = 0, lock = 0, ghost = null, lx = 0, ly = 0, own = false;
    const grid = b.parentNode, SPRING = "cubic-bezier(.32,.72,0,1)";
    const block = (e) => { if (armed) e.preventDefault(); };
    const follow = () => { if (ghost) ghost.style.transform = `translate(${lx - gx}px, ${ly - gy}px) scale(1.05)`; };
    const start = () => {
      drag = true; this._edDragging = true;
      const r = b.getBoundingClientRect();
      ghost = b.cloneNode(true);
      ghost.classList.remove("sel", "lift", "slot");
      ghost.classList.add("ghost");
      ghost.querySelectorAll(".rm").forEach((n) => n.remove());
      const bc = getComputedStyle(b).backgroundColor;
      if (!/^rgb\(|rgba\([^)]*,\s*1\)$/.test(bc)) ghost.style.background = `linear-gradient(${bc}, ${bc}), var(--hvbg)`;
      Object.assign(ghost.style, { left: "0px", top: "0px", width: r.width + "px", height: r.height + "px", rotate: "0deg", transform: `translate(${r.left}px, ${r.top}px)` });
      this._root.appendChild(ghost);
      ghost.animate([{ transform: `translate(${r.left}px, ${r.top}px) scale(1)` }, { transform: `translate(${lx - gx}px, ${ly - gy}px) scale(1.05)` }], { duration: 180, easing: SPRING });
      follow();
      b.classList.remove("lift");
      b.classList.add("slot");
    };
    const reorder = () => {
      if (Date.now() < lock) return;
      const tiles = [...grid.querySelectorAll(".t[data-e]")];
      const over = tiles.find((t) => {
        if (t === b) return false;
        const r = t.getBoundingClientRect();
        return Math.abs(lx - (r.left + r.width / 2)) < r.width * 0.38 && Math.abs(ly - (r.top + r.height / 2)) < r.height * 0.45;
      });
      if (!over) return;
      const from = tiles.indexOf(b), to = tiles.indexOf(over);
      const before = new Map(tiles.map((t) => [t, t.getBoundingClientRect()]));
      grid.insertBefore(b, to > from ? over.nextSibling : over);
      tiles.forEach((t) => {
        const a = before.get(t), z = t.getBoundingClientRect();
        if (Math.abs(a.left - z.left) < 0.5 && Math.abs(a.top - z.top) < 0.5) return;
        t.getAnimations().forEach((x) => { if (x.effect && x.effect.getKeyframes().some((k) => k.translate)) x.cancel(); });
        t.animate([{ translate: `${a.left - z.left}px ${a.top - z.top}px` }, { translate: "0 0" }], { duration: 300, easing: SPRING });
      });
      lock = Date.now() + 160;
    };
    const move = (e) => {
      if (e.pointerId !== id) return;
      lx = e.clientX; ly = e.clientY;
      if (!armed) { if (Math.hypot(lx - sx, ly - sy) > 8) clearTimeout(hold); return; }
      if (!drag) { if (Math.hypot(lx - sx, ly - sy) < 5 || !own) return; start(); }
      e.preventDefault();
      follow();
      reorder();
    };
    const up = (e) => {
      if (e.pointerId !== id) return;
      const tap = !drag && Math.hypot(e.clientX - sx, e.clientY - sy) < 8;
      finish(e.type === "pointerup");
      if (tap && e.type === "pointerup" && this._edit) this._edSelect(b);
    };
    const unbind = () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      document.removeEventListener("touchmove", block, { capture: true });
    };
    const finish = (commit) => {
      clearTimeout(hold);
      unbind();
      b.classList.remove("lift");
      const was = drag, g = ghost;
      armed = drag = false; id = null; ghost = null;
      if (!was) return;
      this._edDragging = false;
      const r = b.getBoundingClientRect();
      const land = () => { g.remove(); b.classList.remove("slot"); };
      g.animate([{ transform: g.style.transform }, { transform: `translate(${r.left}px, ${r.top}px) scale(1)` }], { duration: 320, easing: SPRING, fill: "forwards" }).finished.then(land, land);
      if (commit) this._edCommitOrder(grid);
    };
    b.addEventListener("pointerdown", (e) => {
      if (!this._edit || e.button > 0 || e.target.closest(".rm") || id !== null) return;
      sx = lx = e.clientX; sy = ly = e.clientY; id = e.pointerId; drag = false;
      const m = this._edTileFor(b); own = !!(m && m.own);
      const r = b.getBoundingClientRect(); gx = e.clientX - r.left; gy = e.clientY - r.top;
      armed = e.pointerType === "mouse";
      if (armed) e.preventDefault();
      window.addEventListener("pointermove", move, true);
      window.addEventListener("pointerup", up, true);
      window.addEventListener("pointercancel", up, true);
      if (!armed && own) {
        document.addEventListener("touchmove", block, { capture: true, passive: false });
        hold = setTimeout(() => { armed = true; b.classList.add("lift"); }, 220);
      }
    });
  }

  _sbStudio(i) {
    const s = this._studio, r = this._layout.rooms[i];
    return s && s._state && r ? s._state.compact.rooms.find((x) => x.path === r.id) || null : null;
  }

  _wireSide() {
    if (!this._edit) return;
    const side = this._root.querySelector(".side");
    const hp = side.querySelector(".hp");
    if (hp) hp.onclick = (e) => { e.stopPropagation(); this._sbAdd(); };
    side.querySelectorAll("button[data-room]").forEach((b) => {
      const i = +b.dataset.room, rd = b.querySelector(".rd");
      if (rd) {
        rd.onclick = (e) => { e.stopPropagation(); e.preventDefault(); this._sbMenu(rd, i); };
        rd.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); this._sbMenu(rd, i); } };
        rd.onpointerdown = (e) => e.stopPropagation();
      }
      b.ondblclick = (e) => { e.preventDefault(); this._sbRename(i); };
      this._sbDrag(b, i);
    });
  }

  _sbAdd() {
    const s = this._studio;
    if (!s || !this._edReady) return;
    const names = new Set(s._state.compact.rooms.map((r) => r.name));
    const base = T("native.new_room", "New Room");
    let name = base, n = 2;
    while (names.has(name)) name = base + " " + n++;
    const room = s._embedAddRoom(name);
    this._edPreview(true);
    const i = this._layout.rooms.findIndex((r) => r.id === room.path);
    if (i < 0) return;
    this._go("room", i);
    requestAnimationFrame(() => {
      const row = this._root.querySelector(`.side button[data-room="${i}"]`);
      if (row && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) row.animate([{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.9,.3,1)" });
      this._sbRename(i);
    });
  }

  _sbRename(i) {
    const s = this._studio, sr = this._sbStudio(i), side = this._root.querySelector(".side"), b = side && side.querySelector(`button[data-room="${i}"]`);
    if (!s || !sr || !b || side.querySelector(".ren")) return;
    const sp = b.querySelector(".rn"), r = sp.getBoundingClientRect(), br = b.getBoundingClientRect();
    const inp = document.createElement("input");
    inp.className = "ren";
    inp.value = sr.name || "";
    inp.setAttribute("aria-label", T("native.room_name", "Room name"));
    inp.spellcheck = false;
    const f = getComputedStyle(sp);
    Object.assign(inp.style, { left: r.left - 9 + "px", top: br.top + (br.height - 32) / 2 + "px", width: Math.max(120, br.right - r.left - 44) + "px", fontFamily: f.fontFamily, fontSize: f.fontSize, fontWeight: f.fontWeight, letterSpacing: f.letterSpacing, lineHeight: "normal" });
    this._root.appendChild(inp);
    b.classList.add("renaming");
    inp.focus();
    inp.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      const v = inp.value.trim();
      inp.remove();
      b.classList.remove("renaming");
      if (save && v && v !== sr.name) { s._embedRenameRoom(sr, v); this._edPreview(true); }
    };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); finish(true); } else if (e.key === "Escape") { e.preventDefault(); finish(false); } };
    inp.onblur = () => finish(true);
  }

  _popAt(anchor, html, cls) {
    const R = this._root;
    R.querySelectorAll(".mnu.pop2").forEach((n) => n._close && n._close());
    const m = document.createElement("div");
    m.className = "mnu pop2 " + (cls || "") + (document.documentElement.classList.contains("hemma-hv") ? " flat" : "");
    m.innerHTML = html;
    R.appendChild(m);
    const a = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(innerWidth - w - 8, a.right - w + 8)) + "px";
    m.style.top = (a.bottom + 6 + h < innerHeight - 8 ? a.bottom + 6 : Math.max(8, a.top - h - 6)) + "px";
    anchor.classList.add("open");
    let done = false;
    const close = (after) => {
      if (done) return;
      done = true;
      document.removeEventListener("pointerdown", away, true);
      document.removeEventListener("keydown", key, true);
      anchor.classList.remove("open");
      m.style.pointerEvents = "none";
      const fin = () => { m.remove(); if (after) after(); };
      m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-out", fill: "forwards" }).finished.then(fin, fin);
    };
    const away = (e) => { if (!e.composedPath().includes(m) && !e.composedPath().includes(anchor)) close(); };
    const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    m._close = close;
    setTimeout(() => { document.addEventListener("pointerdown", away, true); document.addEventListener("keydown", key, true); }, 0);
    return m;
  }

  _sbMenu(anchor, i) {
    const P = (d) => `<span class="mi"><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span>`;
    const m = this._popAt(anchor, `<button type="button" data-a="ren">${P('<path d="M3 15l1-4 8-8 3 3-8 8z"/>')}<span>${esc(T("native.rename", "Rename"))}</span></button><button type="button" data-a="icon">${P('<rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.4"/><rect x="10" y="2.5" width="5.5" height="5.5" rx="1.4"/><rect x="2.5" y="10" width="5.5" height="5.5" rx="1.4"/><rect x="10" y="10" width="5.5" height="5.5" rx="1.4"/>')}<span>${esc(T("native.change_icon", "Change Icon"))}</span></button><hr><button type="button" data-a="del" class="red">${P('<path d="M3 5h12M7 5V3h4v2M5 5l1 10h6l1-10"/>')}<span>${esc(T("native.delete_room", "Delete Room"))}</span></button>`);
    m.querySelector('[data-a="ren"]').onclick = () => m._close(() => this._sbRename(i));
    m.querySelector('[data-a="icon"]').onclick = () => m._close(() => this._sbIcon(anchor, i));
    m.querySelector('[data-a="del"]').onclick = () => m._close(() => this._sbDelete(i));
  }

  _sbIcon(anchor, i) {
    const s = this._studio, sr = this._sbStudio(i);
    if (!s || !sr) return;
    const info = s._embedRoomIcons(sr), url = (g) => (window.hemmaIconUrl ? window.hemmaIconUrl(g) : "");
    const cell = (id, g, label) => `<button type="button" class="ic2${(info.chosen || "") === id ? " on" : ""}" data-id="${esc(id)}" title="${esc(label)}" aria-label="${esc(label)}"><i style="--g:url('${url(g)}')"></i></button>`;
    const m = this._popAt(anchor, `<b class="pt">${esc(T("native.room_icon_title", "Icon for {name}", { name: sr.name }))}</b><div class="icg">${cell("", info.auto, T("native.automatic", "Automatic"))}${info.choices.map((c) => cell(c.id, c.id, c.label)).join("")}</div>`, "icp");
    m.querySelectorAll(".ic2").forEach((b) => { b.onclick = () => m._close(() => { s._embedSetRoomIcon(sr, b.dataset.id); this._edPreview(true); }); });
  }

  async _sbDelete(i) {
    const s = this._studio, sr = this._sbStudio(i);
    if (!s || !sr) return;
    const ok = await this._alert({ title: T("native.delete_room_q", "Delete “{name}”?", { name: sr.name }), message: T("native.delete_room_msg", "Its tiles and settings go with it when you save. Undo brings it back."), ok: T("native.delete", "Delete"), destructive: true });
    if (!ok || this._studio !== s) return;
    const row = this._root.querySelector(`.side button[data-room="${i}"]`);
    if (row && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      row.style.overflow = "hidden";
      await row.animate([{ opacity: 1, height: row.offsetHeight + "px" }, { opacity: 0, height: "0px", marginTop: "0px", marginBottom: "0px" }], { duration: 260, easing: "cubic-bezier(.4,0,.9,.6)", fill: "forwards" }).finished.catch(() => {});
    }
    const wasHere = this._page === "room" && this._room === i;
    s._embedDeleteRoom(sr);
    if (wasHere) { this._page = "home"; history.replaceState(null, "", "/hemma-native/home"); }
    this._edPreview(true);
  }

  _sbDrag(b, i) {
    let sy = 0, gy = 0, id = null, armed = false, drag = false, hold = 0, lock = 0, ghost = null, ly = 0;
    const side = b.parentNode, SPRING = "cubic-bezier(.32,.72,0,1)";
    const rows = () => [...side.querySelectorAll("button[data-room]")];
    const block = (e) => { if (armed) e.preventDefault(); };
    const follow = () => { if (ghost) ghost.style.transform = `translateY(${ly - gy}px) scale(1.03)`; };
    const move = (e) => {
      if (e.pointerId !== id) return;
      ly = e.clientY;
      if (!armed) { if (Math.abs(ly - sy) > 8) clearTimeout(hold); return; }
      if (!drag) {
        if (Math.abs(ly - sy) < 5) return;
        drag = true;
        const r = b.getBoundingClientRect();
        ghost = b.cloneNode(true);
        ghost.classList.add("sghost");
        ghost.classList.remove("on");
        Object.assign(ghost.style, { left: r.left + "px", top: "0px", width: r.width + "px", transform: `translateY(${r.top}px)` });
        this._root.appendChild(ghost);
        b.classList.add("slot");
      }
      e.preventDefault();
      follow();
      if (Date.now() < lock) return;
      const list = rows(), over = list.find((t) => { if (t === b) return false; const r = t.getBoundingClientRect(); return Math.abs(ly - (r.top + r.height / 2)) < r.height * 0.4; });
      if (!over) return;
      const before = new Map(list.map((t) => [t, t.getBoundingClientRect().top]));
      side.insertBefore(b, list.indexOf(over) > list.indexOf(b) ? over.nextSibling : over);
      list.forEach((t) => { const d = before.get(t) - t.getBoundingClientRect().top; if (Math.abs(d) > 0.5) t.animate([{ translate: `0 ${d}px` }, { translate: "0 0" }], { duration: 260, easing: SPRING }); });
      lock = Date.now() + 150;
    };
    const up = (e) => {
      if (e.pointerId !== id) return;
      clearTimeout(hold);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      document.removeEventListener("touchmove", block, { capture: true });
      id = null; armed = false;
      if (!drag) return;
      drag = false;
      this._sbDragged = true;
      setTimeout(() => { this._sbDragged = false; }, 300);
      const g = ghost; ghost = null;
      const r = b.getBoundingClientRect();
      const land = () => { g.remove(); b.classList.remove("slot"); };
      g.animate([{ transform: g.style.transform }, { transform: `translateY(${r.top}px)` }], { duration: 280, easing: SPRING, fill: "forwards" }).finished.then(land, land);
      const s = this._studio, sr = this._sbStudio(i);
      if (!s || !sr) return;
      const list = rows(), next = list[list.indexOf(b) + 1];
      const beforeRoom = next ? this._sbStudio(+next.dataset.room) : null;
      setTimeout(() => { s._embedMoveRoom(sr, beforeRoom); this._edPreview(true); }, 300);
    };
    b.addEventListener("pointerdown", (e) => {
      if (!this._edit || e.button > 0 || e.target.closest(".rd") || id !== null) return;
      sy = ly = e.clientY; id = e.pointerId; drag = false;
      gy = e.clientY - b.getBoundingClientRect().top;
      armed = e.pointerType === "mouse";
      window.addEventListener("pointermove", move, true);
      window.addEventListener("pointerup", up, true);
      window.addEventListener("pointercancel", up, true);
      if (!armed) { document.addEventListener("touchmove", block, { capture: true, passive: false }); hold = setTimeout(() => { armed = true; }, 220); }
    });
  }

  _edCommitOrder(grid) {
    const s = this._studio, room = this._edRoomFor(grid.dataset.k);
    if (!s || !room) return;
    const ids = [...grid.querySelectorAll(".t[data-e]")].map((n) => n.dataset.e);
    const moved = ids.map((e) => room.tiles.find((t) => t && t.entity === e)).filter(Boolean);
    const slots = moved.map((t) => room.tiles.indexOf(t)).sort((a, b) => a - b);
    const next = room.tiles.slice();
    slots.forEach((at, i) => { next[at] = moved[i]; });
    if (next.every((t, i) => t === room.tiles[i])) return;
    room.tiles.splice(0, room.tiles.length, ...next);
    s._markDirty();
    try { s._renderForm(); } catch (e) {}
  }

  _rowCat(c) {
    const d = c.V && c.V.mobile_filter_category;
    if (d !== null && d !== undefined) return d;
    const map = window.HEMMA_FILTER_CATEGORIES || {};
    for (const n of c.tpl || []) {
      if (!Object.prototype.hasOwnProperty.call(map, n)) continue;
      return map[n] !== "by_entity" ? map[n] : window.hemmaEntityCategory ? window.hemmaEntityCategory(c.entity) : null;
    }
    return null;
  }

  _expand(rowName, list) {
    if (!window.hemmaExpandLights) return list;
    return window.hemmaExpandLights(this._hass.states, rowName, list.map((c) => ({ type: "custom:button-card", template: c.tpl, entity: c.entity, name: c.name || undefined, variables: c.V })))
      .map((x) => ({ tpl: [].concat(x.template || []), entity: x.entity, name: typeof x.name === "string" && x.name.indexOf("[[[") < 0 ? x.name : "", V: x.variables || {} }));
  }

  _roomBody(room) {
    const row = (this._rows || []).find((r) => !r.fav && String(r.name).trim().toLowerCase() === String(room.name).trim().toLowerCase());
    if (row) {
      this._cards = [];
      const ORDER = [["climate", "Climate"], ["lights", "Lights"], ["media", "Media"], ["security", "Security"], ["energy", "Energy"], ["presence", "People"], ["other", "Other"]];
      const known = new Set(ORDER.map(([k]) => k));
      const sec = (c) => { const k = this._rowCat(c); return known.has(k) && k !== "other" ? k : "other"; };
      const lights = row.cards.filter((c) => sec(c) === "lights"), rest = row.cards.filter((c) => sec(c) !== "lights");
      const cards = this._expand(row.name, lights).concat(rest);
      const secs = ORDER.map(([k, en]) => {
        const list = cards.filter((c) => sec(c) === k);
        if (!list.length) return "";
        return `<h3>${esc(T("filter." + k, en))}</h3>${this._grid("room|" + row.name + "|" + k, list, true)}`;
      }).join("");
      return this._scenesHtml(room.name) + (secs || (this._edit ? this._grid("room|" + row.name + "|", [], true) : ""));
    }
    const shown = (room.tiles || []).filter((t) => !t.hidden);
    if (this._edit) { this._cards = []; return this._grid("room|" + room.name + "|", shown.map((t) => ({ tpl: [], entity: t.entity, name: t.name || "", V: {} })), true); }
    return SECTIONS.map(([key, label]) => {
      const list = shown.filter((t) => this._sectionOf(t.entity) === key);
      if (key === "security" && ((room.sensors || {}).cameras || []).some((c) => this._hass.states[c])) list.push({ entity: "__cameras" });
      return list.length ? `<h3>${label}</h3><div class="grid">${this._litFirst(list).map((t) => this._tileHtml(t, room)).join("")}</div>` : "";
    }).join("");
  }

  _homeBody() {
    const chev = CHEV;
    if (this._rows && this._rows.length) {
      this._cards = [];
      return this._rows.map((row) => {
        const at = this._layout.rooms.findIndex((r) => String(r.name).toLowerCase() === String(row.name).toLowerCase());
        return `<h3${at >= 0 ? ` class="lk" data-room="${at}"` : ""}>${esc(row.fav ? T("nav.favorites", row.name || "Favorites") : row.name)}${at >= 0 ? `<i style="--i:${chev}"></i>` : ""}</h3>${this._grid("home|" + row.name, row.cards, true)}`;
      }).join("");
    }
    return this._layout.rooms.map((room, i) => {
      const list = this._litFirst((room.tiles || []).filter((t) => !t.hidden));
      if (!list.length) return "";
      return `<h3 class="lk" data-room="${i}">${esc(room.name)}<i style="--i:${chev}"></i></h3><div class="grid">${list.map((t) => this._tileHtml(t, room)).join("")}</div>`;
    }).join("");
  }

  _catBody(k) {
    const S = this._hass.states;
    if (k === "people") {
      const V = this._chipV || {}, ids = Object.keys(S).filter((id) => id.indexOf("person.") === 0);
      const pick = [1, 2, 3, 4].map((n) => V["presence_entity_" + n]).filter(Boolean);
      const list = (pick.length ? pick : ids).filter((id) => S[id]).map((entity) => ({ entity }));
      return list.length ? `<div class="grid" style="margin-top:28px">${list.map((t) => this._tileHtml(t, { name: "" })).join("")}</div>` : "";
    }
    if (!this._rows || !this._rows.length) return "";
    const cat = (c) => this._rowCat(c);
    this._cards = [];
    const ph = this._host.classList.contains("ph");
    const grid = (name, l) => this._grid("cat|" + k + "|" + name, l, ph);
    let out = "";
    const fav = this._rows.find((r) => r.fav);
    const favs = fav && k !== "lights" ? fav.cards.filter((c) => cat(c) === k) : [];
    if (favs.length) out += `<h3>${esc(T("mobile.favorites", "Favorites"))}</h3>${grid("Favorites", favs)}`;
    if (k === "media") out = this._npHtml(this._npList()) + out;
    if (k === "energy" && customElements.get("hemma-energy-card")) out += `<h3>${esc(T("nav.energy_devices", "Devices"))}</h3><div class="encard"></div>`;
    this._rows.forEach((row) => {
      if (row.fav) return;
      let list = row.cards.filter((c) => cat(c) === k);
      if (k === "lights") list = this._expand(row.name, list);
      if (list.length) out += `<h3>${esc(row.name)}</h3>${grid(row.name, list)}`;
    });
    return out;
  }

  _npList(room) {
    if (this._npV && window._hemmaNPView) { let v = []; try { v = (window._hemmaNPView(this._hass.states, this._npV) || []).filter(Boolean); } catch (e) {} return (room ? v.filter((r) => this._npInRoom(r, room)) : v).slice(0, 3); }
    if (!window._hemmaNPSources) return [];
    const V = Object.assign({}, this._chipV || {});
    Object.keys(V).forEach((k) => { const m = /^(media_player|plex_stream|psn)_(\d+)$/.exec(k); if (m && V[k]) V[`show_${m[1] === "plex_stream" ? "plex" : m[1]}_${m[2]}`] = true; });
    let l = [];
    try { l = window._hemmaNPSources(this._hass.states, V) || []; } catch (e) {}
    l = l.filter((r) => r && r.entity && (r.playing || r.state === "paused"));
    if (room) l = l.filter((r) => this._npInRoom(r, room));
    return l.slice(0, 3);
  }

  _npInRoom(r, room) {
    const S = this._hass.states, E = this._hass.entities || {}, D = this._hass.devices || {};
    if (!room._npIds) { const ids = new Set(); JSON.stringify(room.tiles || room.cards || [], (k, v) => { if (typeof v === "string" && /^media_player\./.test(v)) ids.add(v); return v; }); room._npIds = ids; }
    const ids = room._npIds, area = (id) => { const e = E[id]; return e && (e.area_id || (D[e.device_id] || {}).area_id); };
    if (ids.has(r.entity) || (room.area && area(r.entity) === room.area)) return true;
    if (r.kind !== "activity") return false;
    const t = String(r.title || "").trim().toLowerCase();
    return !!t && Object.keys(S).some((id) => /^media_player\./.test(id) && S[id].state === "playing" && (ids.has(id) || (room.area && area(id) === room.area)) && String((S[id].attributes || {}).media_title || "").trim().toLowerCase() === t);
  }

  _npHtml(list, one) {
    if (!list.length) return "";
    const more = one && list.length > 1;
    if (one) list = list.slice(0, 1);
    const title = esc(T("now_playing.title", "Now Playing"));
    const head = more ? `<h3 class="nph lk" data-npcat>${title}<i style="--i:${CHEV}"></i></h3>` : `<h3 class="nph">${title}</h3>`;
    const card = (r) => {
      const sub = (r.kind === "player" ? [r.subtitle] : [r.source, r.subtitle]).map((x) => String(x || "").trim()).filter(Boolean).join(" · ");
      const c = r.controls || {}, ctl = (!r.kind || r.kind === "player") && (c.toggle || c.next || c.prev);
      return `<div class="np" data-np="${esc(r.entity)}" data-kind="${esc(r.kind || "")}"${r.art ? ` style="--npa:url('${String(r.art).replace(/'/g, "%27")}')"` : ""}><span class="art"${r.art ? ` style="background-image:url('${String(r.art).replace(/'/g, "%27")}')"` : ""}></span><div class="meta"><b>${esc(r.title || "")}</b><span>${esc(sub)}</span><div class="trk"><i></i></div></div>`
        + (ctl ? `<div class="ctl">${c.prev ? `<button type="button" data-a="prev" aria-label="${esc(T("media.previous", "Previous"))}">${npg("prev")}</button>` : ""}${c.toggle ? `<button type="button" data-a="toggle" aria-label="${esc(T("media.play", "Play"))}">${npg(r.playing ? "pause" : "play")}</button>` : ""}${c.next ? `<button type="button" data-a="next" aria-label="${esc(T("media.next", "Next"))}">${npg("next")}</button>` : ""}</div>` : "") + `</div>`;
    };
    return head + `<div class="nps">${list.map(card).join("")}</div>`;
  }


  _npTick() {
    clearInterval(this._npT);
    const cards = [...this._root.querySelectorAll(".np")];
    if (!cards.length) return;
    const step = () => cards.forEach((c) => {
      const st = this._hass.states[c.dataset.np], a = (st && st.attributes) || {};
      const dur = Number(a.media_duration), pos = Number(a.media_position);
      if (!(dur > 0) || !Number.isFinite(pos)) { c.querySelector(".trk").style.display = "none"; return; }
      const at = pos + (st.state === "playing" && a.media_position_updated_at ? (Date.now() - Date.parse(a.media_position_updated_at)) / 1000 : 0);
      c.querySelector(".trk").style.display = "";
      c.querySelector(".trk i").style.width = Math.min(100, (at / dur) * 100).toFixed(2) + "%";
    });
    step();
    this._npT = setInterval(step, 1000);
    let hv = [];
    try { hv = String(localStorage.getItem("hemma_hv") || "").split("|"); } catch (e) {}
    cards.forEach((c) => {
      if (document.documentElement.classList.contains("hv-ink-w")) c.style.setProperty("--npk", "80%");
      const st = this._hass.states[c.dataset.np], art = st && st.attributes && (st.attributes.entity_picture_local || st.attributes.entity_picture);
      if (art && hv[2] !== "album" && window.hemmaAlbumColor) window.hemmaAlbumColor(art).then((v) => { if (Array.isArray(v) && c.isConnected) { c.style.setProperty("--np1", `rgb(${v.join(",")})`); c.style.setProperty("--np2", `rgb(${v.map((x) => Math.round(x * 0.6)).join(",")})`); } });
      c.querySelectorAll(".ctl button").forEach((b) => { b.onclick = (e) => { e.stopPropagation(); const svc = { prev: "media_previous_track", toggle: "media_play_pause", next: "media_next_track" }[b.dataset.a]; this._hass.callService("media_player", svc, { entity_id: c.dataset.np }); }; });
      c.onclick = () => {
        const r = this._npList().find((x) => x.entity === c.dataset.np);
        if (r && window.hemmaMediaFull && !this._edit) { window.hemmaMediaFull.open({ entity: r.entity, kind: r.kind === "player" ? null : (r.kind || null), src: r, name: r.title || "" }, c.querySelector(".art") || c); return; }
        this._openPanel(c.dataset.np);
      };
    });
  }

  _wxFit() {
    const R = this._root, wx = R.querySelector(".hdr .wx"), main = R.querySelector(".main:not(.prev)"), h1 = main && main.querySelector(".top h1");
    if (!wx || !h1 || !h1.firstChild) return;
    const moving = [main, ...main.querySelectorAll(":scope > .top, :scope > .top h1")].flatMap((n) => n.getAnimations()).filter((a) => a.playState !== "finished" && a.effect && a.effect.getComputedTiming().endTime !== Infinity);
    if (moving.length) { Promise.all(moving.map((a) => a.finished.catch(() => {}))).then(() => requestAnimationFrame(() => this._wxFit())); return; }
    const im = wx.querySelector("img"), tb = wx.querySelector("b"), ti = wx.querySelector("em") || tb;
    const met = (el, ch) => { const k = getComputedStyle(el), x = document.createElement("canvas").getContext("2d"); x.font = k.fontWeight + " " + k.fontSize + " " + k.fontFamily; return x.measureText(ch); };
    const top = (el) => { const g = document.createRange(); g.selectNodeContents(el); return g.getBoundingClientRect().top; };
    const mH = met(h1, "H"), mg = met(h1, "g");
    if (!mH.fontBoundingBoxAscent || !mH.actualBoundingBoxAscent) return;
    const nudge = this._host.classList.contains("tab") || this._host.classList.contains("ph") ? 0 : 1 - (parseFloat(getComputedStyle(h1).top) || 0);
    const mid = top(h1) + main.scrollTop + nudge + mH.fontBoundingBoxAscent - mH.actualBoundingBoxAscent / 2;
    const band = (el) => { const m = met(el, "H"), b0 = top(el) + m.fontBoundingBoxAscent; return [b0 - m.actualBoundingBoxAscent, b0]; };
    wx.style.gap = (parseFloat(getComputedStyle(tb || wx).fontSize) * 0.36).toFixed(1) + "px";
    if (im) { im.style.height = (mH.actualBoundingBoxAscent + mg.actualBoundingBoxDescent).toFixed(1) + "px"; im.style.width = "auto"; }
    [im, tb && tb.parentNode].forEach((el) => el && (el.style.translate = ""));
    const place = () => { if (!im || !im.isConnected) return; im.style.translate = ""; const r = im.getBoundingClientRect(); im.style.translate = "0 " + (mid - (r.top + r.height / 2)).toFixed(1) + "px"; };
    place();
    if (im && !im.complete) im.addEventListener("load", place, { once: true });
    if (tb) { const t0 = band(tb)[0], t1 = band(ti)[1]; tb.parentNode.style.translate = "0 " + (mid - (t0 + t1) / 2).toFixed(1) + "px"; }
    const keep = () => { this._wxLast = { gap: wx.style.gap, h: im ? im.style.height : "", it: im ? im.style.translate : "", tt: tb ? tb.parentNode.style.translate : "" }; };
    keep();
    if (im && !im.complete) im.addEventListener("load", keep, { once: true });
  }

  _wxHtml() {
    const V = this._dashV || {}, wid = V.weather_entity || Object.keys(this._hass.states).find((k) => k.indexOf("weather.") === 0);
    const w = window.hemmaWxLine ? window.hemmaWxLine(this._hass, wid, V.weather_temp_sensor) : null;
    if (!w) return "";
    return `<div class="wx"><span><b>${w.t}°</b><em>${esc(w.cond)}</em></span>${w.file ? `<img alt="" src="/hemma_assets/weather/${w.file}-fill.svg?v=2">` : ""}</div>`;
  }

  _kind(c) {
    const K = ["thermostat", "lock", "light", "cover", "battery", "network", "energy", "plex_recently_added", "updates", "cameras", "entity_actions", "vacuum", "plant", "air_purifier", "server"];
    for (const t of c.tpl) { const k = String(t).replace(/^hemma_/, ""); if (K.includes(k)) return k; }
    return "";
  }

  _kindState(c) {
    const S = this._hass.states, st = S[c.entity], V = c.V || {}, k = this._kind(c), num = (id) => parseFloat((S[id] || {}).state);
    const fmt = (e) => { if (!e) return ""; if (e.state === "ok") return T("state.healthy", "Healthy"); try { return this._hass.formatEntityState(e) || e.state; } catch (x) { return e.state; } };
    const r = { on: this._state(c.entity).on, text: this._state(c.entity).text, icon: "", color: "", hide: false };
    if (k === "lock") {
      const m = V.door_sensors || {}, ids = [...new Set([].concat(V.locks || [], [c.entity]).filter(Boolean))];
      const open = [...new Set(ids.flatMap((id) => [].concat(m[id] || [])))].filter((x) => (S[x] || {}).state === "on").length;
      r.text = open ? (open > 1 ? T("locks.n_doors_open", "{n} Doors Open", { n: open }) : T("locks.door_open", "Door Open")) : fmt(st);
      r.on = open > 0 || (st && ["unlocked", "unlocking"].includes(st.state));
      r.icon = open ? "door-open" : st && st.state === "unlocked" ? V.icon_unlocked || "lock-open-fill" : st && st.state === "unlocking" ? "lock-unlocking-fill" : V.icon_locked || "lock-fill";
      r.color = st && st.state === "unlocking" ? "#FFCC00" : "#00c3d0";
    } else if (k === "light") {
      const mems = (id) => { const a = (S[id] || {}).attributes; return a && Array.isArray(a.entity_id) ? a.entity_id.filter((x) => typeof x === "string" && x.indexOf("light.") === 0) : []; };
      if (!V.as_light && mems(c.entity).length) {
        const seen = new Set(), units = (id) => { if (!id || seen.has(id)) return []; const m = mems(id); if (!m.length || !m.some((x) => mems(x).length)) return [id]; seen.add(id); return m.flatMap(units); };
        const all = [...new Set(units(c.entity))], on = all.filter((id) => (S[id] || {}).state === "on").length;
        r.text = on === 0 ? T("lights.all_off", "All Off") : on === all.length ? T("lights.all_on", "All On") : T("lights.n_on", "{n} On", { n: on });
      }
      r.icon = "light"; r.color = "#FFCC00";
    } else if (k === "cover") {
      const kd = window.hemmaCoverKind ? window.hemmaCoverKind((st && st.attributes.device_class) || "", c.entity) : { open: "curtain-open", closed: "curtain-closed" };
      const o = st && ["open", "opening"].includes(st.state);
      r.on = !!o; r.icon = o ? V.icon_open || kd.open : V.icon_closed || kd.closed; r.color = "#00c3d0";
    } else if (k === "battery") {
      const list = (V.batteries || V.entity_filter || Object.keys(S)).map((id) => S[id]).filter((e) => e && !["unavailable", "unknown"].includes(e.state) && !isNaN(parseFloat(e.state)) && (e.attributes || {}).device_class === "battery");
      const low = list.some((e) => parseFloat(e.state) <= 20);
      r.text = !list.length ? T("battery.no_sensors", "No Sensors") : low ? T("state.needs_attention", "Needs Attention") : T("state.healthy", "Healthy");
      r.on = low; r.icon = "battery"; r.color = low ? "#FFD600" : "#30D158";
    } else if (k === "network") {
      const dl = num(V.entity_download || c.entity), ul = num(V.entity_upload || V.upload_sensor), dlOk = Number.isFinite(dl), ulOk = Number.isFinite(ul);
      const max = Math.max(dlOk ? dl : 0, ulOk ? ul : 0), idle = Number(V.idle_threshold ?? 1), light = Number(V.light_threshold ?? 10), heavy = Number(V.heavy_threshold ?? 50);
      const fit = (t) => t;
      if (max < idle) r.text = fit(T("network.idle", "Idle"));
      else {
        const tier = max < light ? T("network.light", "Light") : max < heavy ? T("network.active", "Active") : T("network.heavy", "Heavy");
        const dir = !dlOk || (ulOk && ul > dl) ? T("network.upload", "Upload") : T("network.download", "Download");
        r.text = fit(T("network.activity", "{tier} {dir}", { tier, dir }));
      }
      r.on = max >= light; r.icon = V.icon || "wifi"; r.color = max >= heavy ? "#ffd600" : "#00c3d0";
    } else if (k === "server") {
      const sv = window.hemmaServer && window.hemmaServer.summary(this._hass, c.entity, S, V);
      if (sv) { r.text = sv.text; r.on = !!sv.alert; }
      r.icon = V.icon || "server"; r.color = "var(--hemma-color-indigo, #5E5CE6)";
    } else if (k === "energy") {
      const w = num(V.entity_power || c.entity);
      r.text = !Number.isFinite(w) ? T("state.unavailable", "Unavailable") : w >= Number(V.extreme_threshold ?? 3000) ? T("energy.extreme_usage", "Extreme Usage") : w >= Number(V.heavy_threshold ?? 1000) ? T("energy.heavy_usage", "Heavy Usage") : w >= Number(V.normal_threshold ?? 200) ? T("energy.normal", "Normal") : T("energy.idle", "Idle");
      const s0 = num(c.entity), hi = Number(V.high_threshold ?? 500), lo = Number(V.release_threshold ?? hi * 0.8);
      c._on = c._on ? s0 >= lo : s0 >= hi; r.on = !!c._on; r.icon = "energy";
      r.color = !Number.isFinite(w) ? "#30D158" : w >= Number(V.extreme_threshold ?? 3000) ? "#FF4245" : w >= Number(V.heavy_threshold ?? 1000) ? "#FF9230" : w >= Number(V.normal_threshold ?? 200) ? "#FFD600" : "#30D158";
    } else if (k === "plex_recently_added") {
      const cut = Date.now() - 3 * 864e5;
      const n = ["sensor.recently_added_movies", "sensor.recently_added_tv"].reduce((a, id) => a + (((S[id] || {}).attributes || {}).data || []).slice(1).filter((x) => x && x.title && Date.parse(x.airdate) >= cut).length, 0);
      r.text = n <= 0 ? T("plex.up_to_date", "Up to date") : n === 1 ? T("plex.one_added", "1 Added") : T("plex.n_added", "{n} Added", { n });
      r.on = n > 0; r.hide = n <= 0; r.icon = "plex"; r.color = "#FFCC00";
    } else if (k === "updates") {
      const restart = Object.keys(S).filter((id) => id.indexOf("update.") === 0).some((id) => { const e = S[id], a = (e && e.attributes) || {}; return e && e.state === "off" && a.installed_version && a.installed_version === a.latest_version && String(a.release_summary || "").toLowerCase().includes("restart"); });
      const n = Number(st && st.state);
      r.text = Number.isFinite(n) && n === 1 ? T("updates.one", "1 Update") : Number.isFinite(n) && n > 1 ? T("updates.n", "{n} Updates", { n }) : restart ? T("updates.restart_required", "Restart required") : T("updates.up_to_date", "Up to date");
      r.on = (Number.isFinite(n) && n > 0) || restart; r.hide = !r.on; r.icon = document.documentElement.classList.contains("hemma-hv") ? "update-fill" : "updates"; r.color = "#00c3d0";
    } else if (k === "cameras") {
      const cams = V.cameras || [c.entity], dead = cams.filter((id) => !S[id] || ["unavailable", "unknown", ""].includes(S[id].state)).length;
      r.text = !cams.length ? T("cameras.none", "No Cameras") : dead === cams.length ? (cams.length === 1 ? T("cameras.offline", "Offline") : T("cameras.all_offline", "All Offline")) : dead ? T("cameras.n_offline", "{n} Offline", { n: dead }) : T("cameras.no_alerts", "No Alerts");
      r.on = false; r.icon = "doorbell"; r.color = "#00c3d0";
    } else if (k === "entity_actions") {
      r.text = fmt(st); r.icon = { light: "light", switch: "plug", input_boolean: "plug", fan: "fan", climate: "thermostat", humidifier: "humidifier", media_player: "speaker", lock: "lock-fill", cover: "curtain-open", vacuum: "vacuum" }[domainOf(c.entity)] || "";
      r.color = ON_COLOR[domainOf(c.entity)] || "#00C3D0";
    } else if (k === "plant") {
      const sens = (V.sensors || []).filter(Boolean), a = (st && st.attributes) || {};
      const type = (id) => { const x = id.toLowerCase(); return x.includes("moisture") ? "moisture" : x.includes("illumin") || x.includes("lux") ? "illuminance" : x.includes("temp") ? "temperature" : x.includes("conductiv") ? "conductivity" : x.includes("humid") ? "humidity" : null; };
      const val = (id) => { const v = (S[id] || {}).state; if (!v || v === "unavailable" || v === "unknown") return null; const n = parseFloat(v); return isNaN(n) ? null : n; };
      r.on = !!st && st.state === "problem"; r.icon = "plant"; r.color = r.on ? "#FFCC00" : "#30D158";
      if (!st || st.state === "unavailable") r.text = "— %";
      else if (st.state === "ok") r.text = T("state.healthy", "Healthy");
      else {
        r.text = "";
        if (sens.length && st.state === "problem") {
          const scorable = sens.filter((id) => { const t = type(id); return t && Object.prototype.hasOwnProperty.call(a, t + "_status"); }), scored = scorable.filter((id) => val(id) != null);
          if (scorable.length && !scored.length) r.text = T("state.unavailable", "Unavailable");
          else if (scored.length) {
            const bad = scored.filter((id) => { const v = a[type(id) + "_status"]; return v && v !== "ok" && v !== "null"; }).length, q = (scored.length - bad) / scored.length;
            r.text = q >= 1 ? T("state.healthy", "Healthy") : q >= 0.8 ? T("plant.needs_care", "Needs care") : q >= 0.6 ? T("plant.struggling", "Struggling") : q >= 0.4 ? T("plant.poor", "Poor") : T("plant.critical", "Critical");
          }
        }
        if (!r.text) { const n = parseFloat(st.state), m = parseFloat(a.moisture); r.text = st.state === "problem" ? T("state.needs_attention", "Needs Attention") : !isNaN(n) ? `${Math.round(n)} %` : !isNaN(m) ? `${Math.round(m)} %` : "— %"; }
      }
    } else if (k === "air_purifier") {
      r.icon = V.icon || "purifier"; r.color = "#00C3D0";
    } else if (k === "vacuum") {
      r.text = st ? (window.hemmaVacuumWord ? window.hemmaVacuumWord(this._hass, st) : fmt(st)) : ""; r.icon = "vacuum"; r.color = "#FF9230";
    }
    if (!r.color) r.color = ON_COLOR[domainOf(c.entity)] || FALLBACK_C;
    if (V.icon && !r.icon && window.hemmaIconUrl) r.icon = V.icon;
    return r;
  }

  _cardHtml(c, i) {
    const st = this._hass.states[c.entity], r = this._kindState(c), k = this._kind(c);
    const name = c.name || (st && st.attributes.friendly_name) || c.entity;
    const V = c.V || {}, tg = V.show_toggle === true || (V.show_toggle == null && k === "lock");
    const tgOn = st && (k === "lock" ? st.state === "locked" : !["off", "unavailable", "unknown", "standby", "closed"].includes(st.state));
    return `<button type="button" class="t${r.on ? " on" : ""}${r.hide ? " hide" : ""}" data-e="${esc(c.entity)}" data-d="${esc(String(c.entity || "").split(".")[0])}" data-c="${i}"${r.icon && k !== "thermostat" ? ` data-icon="${esc(r.icon)}"` : ""} style="--c:${r.color}"><span class="ic"></span>${tg ? `<span class="ftg${tgOn ? " on" : ""}" data-tg role="switch" aria-checked="${tgOn ? "true" : "false"}"></span>` : ""}<span class="tx"><b>${esc(name)}</b><span>${esc(r.text)}</span></span></button>`;
  }

  _iconTap(c, d, k) {
    const V = c.V || {}, H = this._hass, t = V.toggle_entity || c.entity, st = H.states[t], s = String((st && st.state) || "").toLowerCase();
    if (!st || s === "unavailable" || s === "unknown" || ["lock", "cover"].includes(k)) return false;
    if (V.toggle_service) { const [dm, sv] = String(V.toggle_service).split("."); H.callService(dm, sv, V.toggle_service_data || { entity_id: t }); return true; }
    const td = domainOf(t);
    if (td === "climate") { H.callService("climate", s === "off" ? "turn_on" : "turn_off", { entity_id: t }); return true; }
    if (td === "media_player") { const f = Number(st.attributes.supported_features || 0); if (s === "off" ? !(f & 128) : !(f & 256)) return false; H.callService("media_player", s === "off" ? "turn_on" : "turn_off", { entity_id: t }); return true; }
    if (!TOGGLE.includes(td) && td !== "water_heater") return false;
    H.callService("homeassistant", "toggle", { entity_id: t });
    return true;
  }

  _openCard(c) {
    const V = c.V || {}, k = this._kind(c), e = c.entity, nm = c.name || undefined;
    const map = {
      battery: { type: "custom:hemma-battery-panel", batteries: Array.isArray(V.batteries) ? V.batteries : null, entity_filter: Array.isArray(V.entity_filter) ? V.entity_filter : null, pairs: V.battery_entities || {}, icons: V.device_icons || {}, names: V.device_names || {} },
      network: Object.assign({ type: "custom:hemma-network-panel", name: "", entity_download: V.entity_download || e, entity_upload: V.entity_upload || V.upload_sensor || null }, Object.fromEntries(["entity_ping", "entity_status", "entity_stat_1", "entity_stat_2", "entity_stat_3", "entity_stat_4", "action_1_entity", "action_1_label", "action_1_status", "action_1_confirm_helper", "action_1_done_helper", "action_2_entity", "action_2_label", "action_2_status", "action_2_confirm_helper", "action_2_done_helper"].map((x) => [x, V[x] || null])), { idle_threshold: V.idle_threshold, light_threshold: V.light_threshold, heavy_threshold: V.heavy_threshold }),
      energy: { type: "custom:hemma-energy-panel", name: "", entity_power: V.entity_power || e, entity_usage_today: V.entity_usage_today, entity_usage_month: V.entity_usage_month, entity_cost_today: V.entity_cost_today, entity_cost_month: V.entity_cost_month, usage_shows: V.usage_shows || "", power_entities: Array.isArray(V.power_entities) ? V.power_entities : [], power_icons: V.power_icons || {}, normal_threshold: V.normal_threshold, heavy_threshold: V.heavy_threshold, extreme_threshold: V.extreme_threshold },
      updates: { type: "custom:hemma-updates-panel" },
      server: { type: "custom:hemma-server-panel", name: V.room_name || "", entity: e, entity_memory: V.entity_memory || null, entity_disk: V.entity_disk || null, entity_status: V.entity_status || null },
      plex_recently_added: { type: "custom:hemma-recent-panel", hide_spoilers: V.hide_spoilers === true },
      lock: { type: "custom:hemma-lock-panel", name: nm, locks: Array.isArray(V.locks) ? V.locks : [], battery: V.battery_entities || {}, show_battery: V.show_battery === true, doors: V.door_sensors || {} },
      cover: { type: "custom:hemma-cover-panel", entity: V.cover_entity || e, name: nm, covers: Array.isArray(V.covers) ? V.covers : [] },
      light: { type: "custom:hemma-light-panel", name: nm, lights: Array.isArray(V.lights) && V.lights.length ? V.lights : undefined },
      entity_actions: Object.assign({ type: "custom:hemma-actions-panel", name: nm }, V),
    };
    if (k === "cameras") { const cams = V.cameras || [e]; this._openPanel(cams[0], { type: customElements.get("hemma-cam-popup-panel") ? "custom:hemma-cam-popup-panel" : "custom:hemma-camera-panel", cameras: cams }); return; }
    this._openPanel(e, map[k] || (nm ? { name: nm } : undefined));
  }

  _scenes(room) {
    const S = this._hass.states, V = room ? {} : this._sceneV || {}, ents = this._hass.entities || {};
    let ids = Array.isArray(V.scenes) && V.scenes.length ? V.scenes.filter((id) => S[id])
      : Object.keys(S).filter((id) => id.indexOf("scene.") === 0 && id.indexOf("scene.hemma") !== 0 && !(ents[id] && (ents[id].hidden || ents[id].hidden_by || ents[id].disabled || ents[id].disabled_by)));
    ids = ids.filter((id) => !(V.scene_exclude || []).includes(id));
    if (!(Array.isArray(V.scenes) && V.scenes.length)) {
      const nm = (id) => String((S[id].attributes || {}).friendly_name || id);
      ids.sort((a, b) => nm(a).localeCompare(nm(b)));
      const ord = V.scene_order || [];
      ids = ord.filter((id) => ids.includes(id)).concat(ids.filter((id) => !ord.includes(id)));
    }
    if (room) {
      const H = this._hass, want = String(room).trim().toLowerCase(), areas = H.areas || {}, devs = H.devices || {};
      const aids = new Set(Object.keys(areas).filter((id) => String(areas[id].name || "").trim().toLowerCase() === want));
      const set = new Set();
      Object.keys(ents).forEach((eid) => { const e = ents[eid], a = e.area_id || (e.device_id && devs[e.device_id] ? devs[e.device_id].area_id : null); if (a && aids.has(a)) set.add(eid); });
      if (set.size) {
        const leaves = (id, seen = new Set()) => { if (!id || seen.has(id)) return []; seen.add(id); const m = S[id] && S[id].attributes.entity_id; return Array.isArray(m) ? m.flatMap((x) => leaves(x, seen)) : [id]; };
        ids = ids.filter((id) => { const t = S[id].attributes.entity_id; return Array.isArray(t) && t.some((x) => typeof x === "string" && (set.has(x) || leaves(x).some((l) => set.has(l)))); });
      }
    }
    return ids;
  }

  _scenesHtml(room, mode) {
    const S = this._hass.states, V = room ? {} : this._sceneV || {}, ids = this._scenes(room);
    if (!ids.length) return mode === "page" ? `<div class="empty">${esc(T("native.nothing", "Nothing here yet."))}</div>` : "";
    const head = mode === "page" ? "" : room ? `<h3>${esc(T("nav.scenes", "Scenes"))}</h3>` : `<h3 class="lk" data-scenes>${esc(T("nav.scenes", "Scenes"))}<i style="--i:${CHEV}"></i></h3>`;
    return `${head}<div class="${mode === "page" ? "scg" : "scs"}">${ids.map((id) => {
      const a = S[id].attributes || {}, nm = a.friendly_name || id.replace("scene.", "").replace(/_/g, " "), ic = (V.scene_icons || {})[id];
      const on = (this._sceneOn && this._sceneOn[id] > Date.now()) || this._sceneActive(id);
      return `<button type="button" class="sc${on ? " on" : ""}" data-sc="${esc(id)}" style="--c:${(V.scene_colors || {})[id] || "#FFCC00"}">${ic ? `<i style="--i:url('${escU(ic)}')"></i>` : `<ha-icon icon="${esc(a.icon || "mdi:palette")}"></ha-icon>`}<span>${esc(nm)}</span></button>`;
    }).join("")}</div>`;
  }

  _svg(b) {
    return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">${b}</svg>`).replace(/'/g, "%27")}')`;
  }

  _styleMem(next) {
    if (next) { this._styleC = next; try { if (!PV && typeof this._pvDark !== "boolean") localStorage.setItem("hemma_native_style", JSON.stringify(next)); } catch (e) {} return next; }
    if (this._styleC === undefined) { try { this._styleC = JSON.parse(localStorage.getItem("hemma_native_style") || "null"); } catch (e) { this._styleC = null; } }
    return this._styleC;
  }

  _isGlass() {
    if (this._dashV) return this._dashV.hemma_style !== "homeview";
    const m = this._styleMem();
    return !!(m && m.glass);
  }

  _bgFade() {
    const b = this._root.querySelector(".bdl");
    if (!b || !this._host.style.getPropertyValue("--gph") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this._root.querySelectorAll(".bdx").forEach((n) => n.remove());
    const c = b.cloneNode(false);
    c.classList.add("bdx");
    c.style.setProperty("--gph", this._host.style.getPropertyValue("--gph"));
    c.style.setProperty("--gpg", this._host.style.getPropertyValue("--gpg"));
    c.style.zIndex = getComputedStyle(b).zIndex === "auto" ? "0" : getComputedStyle(b).zIndex;
    b.after(c);
    const a = c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: "ease-in-out", fill: "forwards" });
    a.onfinish = () => c.remove();
  }

  _glassBg(page, room) {
    const V = this._dashV || {}, glass = this._isGlass();
    this._host.classList.toggle("glass", glass);
    if (glass) this._host.classList.remove("mini", "grain");
    if (!glass) { if (this._dashV) { const m = this._styleMem(); if (!m || m.glass) this._styleMem({ glass: false }); } return; }
    if (!this._dashV) {
      const m = this._styleMem();
      if (m && m.gph && this._gph !== m.gph) { this._gph = m.gph; this._host.style.setProperty("--gph", m.gph); this._host.style.setProperty("--gpg", m.gpg); }
      return;
    }
    const dark = this._darkNow();
    const src = page === "room" && room && room.V && room.V.image ? room.V : V;
    const base = String(src.image || "home");
    const img = dark ? (src.image_night || base + "-night") : base;
    const url = `url("${PH(`/hemma_assets/rooms/${img}.jpg`)}")`;
    this._glassPreload(dark);
    if (this._gph !== url) {
      this._gph = url;
      const gpg = `url("${PH(`/hemma_assets/rooms-glass/${img}.jpg?v=5`)}")`;
      const flip = this._gphDark != null && this._gphDark !== dark;
      this._gphDark = dark;
      const apply = () => { if (this._gph !== url) return; if (flip) this._bgFade(); this._host.style.setProperty("--gph", url); this._host.style.setProperty("--gpg", gpg); };
      const pics = [`/hemma_assets/rooms/${img}.jpg`, `/hemma_assets/rooms-glass/${img}.jpg?v=5`].map((u) => this._glassPic(PH(u)));
      if (!this._host.style.getPropertyValue("--gph")) apply();
      else Promise.all(pics.map((p) => p.decode().catch(() => {}))).then(() => requestAnimationFrame(apply));
    }
    const m = this._styleMem();
    if (page === "home" && (!m || !m.glass || m.gph !== url)) this._styleMem({ glass: true, gph: url, gpg: `url("${PH(`/hemma_assets/rooms-glass/${img}.jpg?v=5`)}")` });
    if (!this._lookCleared && !PV) {
      this._lookCleared = true;
      try { const L = JSON.parse(localStorage.getItem("hemma_ha_look") || "null"); if (L && (L.cls || []).includes("hemma-hv")) { localStorage.removeItem("hemma_ha_look"); localStorage.removeItem("hemma_hv_bg"); } } catch (e) {}
    }
  }

  _sceneCfg() {
    if (!this._scc) {
      const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } };
      this._scc = load("hemma_scene_cfg_v1");
      this._scIgn = load("hemma_scene_ignore_v1");
      this._scAsked = new Set();
    }
    return this._scc;
  }

  _sceneFetch(id) {
    const H = this._hass;
    if (!H || this._scDead || this._scAsked.has(id)) return;
    this._scAsked.add(id);
    const sid = ((H.states[id] || {}).attributes || {}).id;
    if (!sid || !H.callApi) return;
    H.callApi("GET", "config/scene/config/" + sid).then((c) => {
      if (!c || !c.entities) return;
      const changed = JSON.stringify(this._scc[id]) !== JSON.stringify(c);
      this._scc[id] = c;
      try { localStorage.setItem("hemma_scene_cfg_v1", JSON.stringify(this._scc)); } catch (e) {}
      if (changed) this._sceneSync();
    }).catch((e) => { const code = e && (e.status_code || e.status); if (code === 401 || code === 403) this._scDead = true; });
  }

  _sceneActive(id) {
    const S = (this._hass || {}).states || {}, cfg = this._sceneCfg()[id];
    this._sceneFetch(id);
    if (!cfg || !cfg.entities) return false;
    const OFF = new Set(["off", "none", "no effect", "effect_stop", "solid"]);
    const effOff = (v) => v == null || OFF.has(String(v).toLowerCase());
    const eq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
    const attrs = (t, live) => {
      const la = live.attributes || {};
      if (!effOff(t.effect)) return String(la.effect) === String(t.effect);
      if (t.effect != null && !effOff(la.effect)) return false;
      if (t.brightness != null && t.brightness !== la.brightness) return false;
      if (t.color_mode != null && t.color_mode !== la.color_mode) return false;
      if (t.color_mode === "color_temp") { if (t.color_temp_kelvin != null && t.color_temp_kelvin !== la.color_temp_kelvin) return false; }
      else if (t.color_mode != null && t.rgb_color != null && !eq(t.rgb_color, la.rgb_color)) return false;
      return true;
    };
    const ign = new Set(this._scIgn[id] || []);
    let n = 0;
    for (const eid of Object.keys(cfg.entities)) {
      if (ign.has(eid)) continue;
      const t = cfg.entities[eid], live = S[eid];
      if (!live || String(t.state) !== String(live.state)) return false;
      if (String(t.state) === "on" && eid.startsWith("light.") && !attrs(t, live)) return false;
      n++;
    }
    return n > 0;
  }

  _sceneSync() {
    this._root.querySelectorAll(".sc[data-sc]").forEach((b) => {
      const id = b.dataset.sc;
      b.classList.toggle("on", (this._sceneOn && this._sceneOn[id] > Date.now()) || this._sceneActive(id));
    });
  }

  _glassPic(u) {
    const keep = this._glassPics || (this._glassPics = new Map());
    if (!keep.has(u)) { const i = new Image(); i.decoding = "async"; i.src = u; keep.set(u, i); }
    return keep.get(u);
  }

  _glassPreload(dark) {
    const sig = (dark ? "n" : "d") + (this._layout ? this._layout.rooms.length : 0);
    if (this._glassPre === sig || !this._layout) return;
    this._glassPre = sig;
    const V = this._dashV || {};
    [V].concat(this._layout.rooms.map((r) => r.V || {})).forEach((src) => {
      const base = String(src.image || V.image || "home"), img = dark ? (src.image_night || base + "-night") : base;
      this._glassPic(PH(`/hemma_assets/rooms/${img}.jpg`));
      this._glassPic(PH(`/hemma_assets/rooms-glass/${img}.jpg?v=5`));
    });
  }

  _focusOn() {
    if (this._host.classList.contains("ph")) return false;
    const V = this._dashV;
    if (!V) { try { return localStorage.getItem("hemma_native_focus") === "1"; } catch (e) { return false; } }
    const t = this._host.classList.contains("tab") ? V.home_layout_tablet : "";
    const on = t === "focus" ? true : t === "overview" ? false : V.home_layout !== "overview";
    try { if (!PV) localStorage.setItem("hemma_native_focus", on ? "1" : "0"); } catch (e) {}
    return on;
  }

  _roomChips(room) {
    const V = room.V || {}, B = window.hemmaBadges, saved = this._chipV;
    this._chipV = V;
    try { return this._chips(null, (k) => (B && B.on ? !!B.on(k, V, "room") : false)); } catch (e) { return ""; } finally { this._chipV = saved; }
  }

  _fwxHtml() {
    const V = this._dashV || {}, wid = V.weather_entity || Object.keys(this._hass.states).find((k) => k.indexOf("weather.") === 0);
    const w = window.hemmaWxLine ? window.hemmaWxLine(this._hass, wid, V.weather_temp_sensor) : null;
    return w ? `<div class="fwx">${w.t}° ${esc(w.cond || "")}</div>` : "";
  }

  _focusBody(page, room, title) {
    let row = "";
    if (page === "home") {
      const fav = (this._rows || []).find((r) => r.fav);
      this._cards = [];
      row = fav ? this._grid("home|" + fav.name, fav.cards, true) : "";
    } else {
      this._cards = [];
      row = this._grid("room|" + room.name + "|", (room.cards || []).filter((c) => this._hass.states[c.entity]), true);
    }
    const chips = page === "home" ? this._chips(null) : this._roomChips(room);
    return `<div class="fhero">${this._fwxHtml()}<h1>${esc(title)}</h1>${chips}</div><div class="frow">${row}</div>`;
  }

  _render(how) {
    this._host.classList.toggle("mini", document.documentElement.classList.contains("hemma-hv") && !this._isGlass());
    this._flatSync();
    const R = this._root, rooms = this._layout.rooms, room = rooms[this._room], page = this._page || "room";
    const roomIcon = (r) => { if (r.icon) return this._icon(r.icon); if (this._studioWarm && this._studioWarm._embedRoomGlyph) { const g = this._studioWarm._embedRoomGlyph({ name: r.name }); if (g) return this._icon(g); } const k = String(r.id || "").replace(/_/g, "-"); return this._icon(/living/.test(k) ? "living-room" : /kitchen/.test(k) ? "kitchen" : /bed/.test(k) ? "bedroom" : /dining/.test(k) ? "dining" : "home"); };
    R.querySelector(".page").classList.toggle("catp", page !== "room" && page !== "home");
    this._host.classList.toggle("cat", page !== "room" && page !== "home");
    const tab = this._host.classList.contains("tab"), ph = this._host.classList.contains("ph");
    const focus = this._focusOn(), F = focus && (page === "home" || page === "room");
    this._glassBg(page, room);
    this._host.classList.toggle("focus", focus);
    const fd = focus && !tab && !ph;
    this._host.classList.toggle("fd", fd);
    if (fd && this._sideFd == null) this._sideFd = (this._dashV || {}).sidebar_open === true;
    try { if (this._side == null) this._side = localStorage.getItem("hemma_native_side") === "1"; } catch (e) {}
    R.querySelector(".page").classList.toggle("sideon", (tab && !!this._side) || (fd && (!!this._sideFd || !!this._edit)));
    R.querySelector(".side").innerHTML = `<button type="button" class="tg" aria-label="${esc(T("nav.sidebar", "Sidebar"))}"><svg class="nvb" viewBox="0 0 25 19.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="1" y="1" width="23" height="17.5" rx="4"/><path d="M7.4 5.1h10.2"/></svg></button><div class="clock"></div><button type="button" class="homeb${page === "home" ? " on" : ""}"><i style="--i:${this._icon("home")}"></i>${esc(T("nav.home", "Home"))}</button>${focus ? `<button type="button" class="homeb scb${page === "scenes" ? " on" : ""}" data-scenes><i style="--i:${this._icon("scenes")}"></i>${esc(T("nav.scenes", "Scenes"))}</button>` : ""}`
      + `<div class="hd">${esc(T("nav.rooms", "Rooms"))}<i></i>${this._edit ? `<button type="button" class="hp" aria-label="${esc(T("native.add_room", "Add a room"))}" title="${esc(T("native.add_room", "Add a room"))}"></button>` : ""}</div>` + rooms.map((r, i) => `<button type="button" data-room="${i}" class="${page === "room" && i === this._room ? "on" : ""}"><i style="--i:${roomIcon(r)}"></i><span class="rn">${esc(r.name)}</span><span class="sm"><img alt="" src="${window.hemmaIconUrl ? window.hemmaIconUrl("person-walking-motion") : ""}"></span>${this._edit ? `<span class="rd" role="button" tabindex="0" aria-label="${esc(T("native.room_options", "Options for {name}", { name: r.name }))}"></span>` : ""}</button>`).join("")
      + `<div class="hd cat">${esc(T("nav.categories", "Categories"))}<i></i></div>` + CATS.map(([k, l, ic]) => `<button type="button" class="cat${page === k ? " on" : ""}" data-cat="${k}"><i style="--i:${this._icon(ic)}"></i>${esc(T("filter." + k, l))}</button>`).join("");
    this._tick();
    requestAnimationFrame(() => this._sideMotion());
    const dots = this._svg('<circle cx="3.5" cy="9" r="1.6"/><circle cx="9" cy="9" r="1.6"/><circle cx="14.5" cy="9" r="1.6"/>');
    R.querySelectorAll(".main.prev, .ovblur").forEach((n) => n.remove());
    let prev = null;
    this._backNew = how && !R.querySelector(".hdr .back") && page !== "home";
    if (how) { prev = R.querySelector(".main"); prev.getAnimations({ subtree: true }).forEach((a) => { try { if (a.effect && a.effect.getComputedTiming().endTime !== Infinity) a.finish(); else a.cancel(); } catch (e) {} }); const nm = document.createElement("main"); nm.className = "main"; prev.classList.add("prev"); prev.inert = true; prev.parentNode.insertBefore(nm, prev); }
    const main = R.querySelector(".main"), col = R.querySelector(".col");
    let title;
    main.className = "main" + (page === "home" ? " home" : page === "room" ? " sub" : " catm sub") + (F ? " fx" : "");
    if (F) {
      title = page === "room" ? room.name : (window.hemmaGreeting ? window.hemmaGreeting(this._hass, this._hass.states, {}).replace(/&amp;/g, "&").replace(/&lt;/g, "<") : T("nav.home", "Home"));
      main.innerHTML = this._focusBody(page, room, title);
    } else if (page === "room") {
      title = room.name;
      main.innerHTML = `<div class="top"><h1>${esc(title)}</h1>${tab || ph ? this._wxHtml() : ""}</div><div class="bds">${this._badges(room)}</div>${this._roomBody(room) || (this._edit ? this._grid("room|" + room.name + "|", [], true) : '<div class="empty">No tiles in this room.</div>')}`;
    } else if (page === "home") {
      title = window.hemmaGreeting ? window.hemmaGreeting(this._hass, this._hass.states, {}).replace(/&amp;/g, "&").replace(/&lt;/g, "<") : T("nav.home", "Home");
      if (ph) title = T("nav.home", "Home");
      main.innerHTML = `<div class="top"><h1>${esc(title)}</h1>${tab || ph ? this._wxHtml() : ""}</div>${this._chips(null)}${this._npHtml(this._npList(), !ph)}${this._scenesHtml()}${this._homeBody()}`;
    } else if (page === "scenes") {
      title = T("nav.scenes", "Scenes");
      main.innerHTML = `<div class="top"><h1>${esc(title)}</h1>${tab || ph ? this._wxHtml() : ""}</div>${this._scenesHtml(null, "page")}`;
    } else {
      const c = CATS.find(([k]) => k === page);
      title = T("filter." + page, c[1]);
      const V = this._chipV || {};
      const gauges = page === "climate" ? this._badges({ sensors: { temp: V.temp_sensor_1 || V.temp_sensor, humidity: V.humidity_sensor, quality: V.quality_sensor, aqi: [V.aqi_entity_pm25, V.aqi_entity_pm10, V.aqi_entity_voc, V.aqi_entity_co2].filter(Boolean) } }, true) : "";
      main.innerHTML = `<div class="top"><h1>${esc(title)}</h1>${tab || ph ? this._wxHtml() : ""}</div>${this._chips(page)}${gauges ? `<div class="bds cbds">${gauges}</div>` : ""}${this._catBody(page) || `<div class="empty">${esc(T("native.nothing", "Nothing here yet."))}</div>`}`;
    }
    const hdr = R.querySelector(".hdr");
    hdr.querySelectorAll(".back, .pill, .wx, .ok, .fclk").forEach((n) => n.remove());
    hdr.insertAdjacentHTML("beforeend", (fd ? `<div class="fclk">${esc(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }))}</div>` : "") + (page === "home" || F ? "" : `<button type="button" class="back" aria-label="${esc(T("nav.home", "Home"))}"><svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.4 1.6 1.8 10l8.6 8.4"/></svg></button>`)
      + (!tab && !ph && !F ? this._wxHtml() : "") + (this._edit ? `<button type="button" class="ok" aria-label="${esc(T("native.done", "Done"))}" title="${esc(T("native.done", "Done"))}"><svg viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.6 7.2 13.6 18 2.4"/></svg><b class="okn"></b></button>` : "") + (this._edit && ph ? `<button type="button" class="edplus" aria-label="${esc(T("native.add", "Add"))}"><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 3v12M3 9h12"/></svg></button>` : "") + `<div class="pill">${focus && this._npHere(page, room) && this._npList().some((r) => r.playing) ? `<button type="button" class="wv" aria-label="${esc(T("now_playing.title", "Now Playing"))}"><span><i></i><i></i><i></i><i></i><i></i></span></button>` : ""}<button type="button" class="nb" aria-label="${esc(T("notify.title", "Notifications"))}"><i style="--i:${this._icon("bell")}"></i><b class="bc"></b></button><s></s><button type="button" class="more" aria-label="${esc(T("ui.more", "More"))}"><i style="--i:${dots}"></i></button></div>`);
    const lensFrom = this._lensFrom || this._navRect(hdr);
    this._lensFrom = null;
    hdr.querySelector(".nav").innerHTML = `<button type="button" class="tg" aria-label="${esc(T("nav.sidebar", "Sidebar"))}">${TAB_SVG}</button><button type="button" data-home class="${page !== "room" && !(focus && page === "scenes") ? "on" : ""}">${esc(T("nav.home", "Home"))}</button>`
      + rooms.map((r, i) => `<button type="button" data-room="${i}" class="${page === "room" && i === this._room ? "on" : ""}">${esc(r.name)}</button>`).join("")
      + (focus ? `<button type="button" data-scenes class="scn${page === "scenes" ? " on" : ""}">${esc(T("nav.scenes", "Scenes"))}<i style="--i:${CHEV}"></i></button>` : "");
    R.querySelectorAll(".tg").forEach((b) => { b.onclick = () => {
      if (this._host.classList.contains("fd")) { if (this._edit) return; this._sideFd = !this._sideFd; this._sideMorph(this._sideFd); return; }
      this._side = !this._side; try { if (!PV) localStorage.setItem("hemma_native_side", this._side ? "1" : "0"); } catch (e) {} R.querySelector(".page").classList.toggle("sideon", this._side); }; });
    if (lensFrom) this._navLens(hdr, lensFrom);
    this._navPress(hdr);
    R.querySelectorAll("[data-home]").forEach((b) => { b.onclick = () => this._go("home"); });
    R.querySelectorAll("[data-scenes]").forEach((b) => { b.onclick = () => (b.classList.contains("scn") ? this._scenesMenu(b) : this._go("scenes")); });
    R.querySelectorAll("[data-npcat]").forEach((b) => { b.onclick = () => this._go("media"); });
    this._fnpSync(focus && !ph && this._npHere(page, room), page === "room" ? room : null);
    R.querySelectorAll(".pill .wv").forEach((b) => { b.onclick = (e) => { e.stopPropagation(); if (hdr.querySelector(".fnp")) { const v = !this._npMin(); this._npMinO = { v, at: Date.now() }; hdr.querySelectorAll(".fnp").forEach((n) => n.classList.toggle("min", v)); this._hass.callService("input_boolean", v ? "turn_on" : "turn_off", { entity_id: NP_MIN }); return; } const r = this._npList().find((x) => x.playing) || this._npList()[0]; if (r && window.hemmaMediaFull) window.hemmaMediaFull.open({ entity: r.entity, name: r.title || "" }, b); }; });
    hdr.querySelector(".mini").textContent = title;
    if (hdr.querySelector(".wx")) {
      const L = this._wxLast, w = hdr.querySelector(".wx"), wi = w.querySelector("img"), wb = w.querySelector("b");
      if (L) { w.style.gap = L.gap; if (wi) { wi.style.height = L.h; wi.style.width = "auto"; wi.style.translate = L.it; } if (wb) wb.parentNode.style.translate = L.tt; }
      requestAnimationFrame(() => this._wxFit()); if (document.fonts && !this._wxFonts) { this._wxFonts = 1; document.fonts.ready.then(() => this._wxFit()); } }
    hdr.querySelector(".mini").style.left = page === "home" ? "15px" : "";
    main.scrollTop = 0; col.classList.remove("scrolled");
    const under = () => {
      if (!this._host.classList.contains("ph")) return main.scrollTop > 40;
      const ch = main.querySelector(".chips"), pl = this._root.querySelector(".hdr .pill"), pr = pl && pl.getBoundingClientRect();
      if (!ch || !pr || !pr.height) return main.scrollTop > 40;
      return ch.getBoundingClientRect().bottom <= pr.bottom + 4;
    };
    main.onscroll = () => col.classList.toggle("scrolled", under());
    main.querySelectorAll(".t").forEach((b) => this._wireTile(b));
    this._wireBadges();
    main.querySelectorAll(".t .ic").forEach((ic) => this._iconOf(ic));
    main.querySelectorAll(".sc").forEach((b) => { b.onclick = () => { if (!this._edit) this._scene(b); }; });
    R.querySelectorAll("[data-room]").forEach((b) => { b.onclick = () => { if (!this._sbDragged) this._sideGo("room", +b.dataset.room); }; });
    this._wireSide();
    R.querySelectorAll("[data-cat]").forEach((b) => { b.onclick = () => (b.closest(".side") ? this._sideGo(b.dataset.cat) : this._go(b.classList.contains("chip") && page === b.dataset.cat ? "home" : b.dataset.cat)); });
    R.querySelector(".homeb").onclick = () => this._sideGo("home");
    R.querySelectorAll(".back").forEach((b) => { b.onclick = () => this._go("home"); });
    R.querySelector(".more").onclick = (e) => this._moreMenu(e.currentTarget);
    if (this._edit) { const ok = R.querySelector(".hdr .ok"); if (ok) ok.onclick = () => this._edDone(); this._wireEdit(); this._edSyncSoon(how); }
    if (this._pvShown) this._pvSideMark();
    R.querySelector(".nb").onclick = (e) => { if (window._hemmaNotify) window._hemmaNotify.open(e.currentTarget); };
    this._bell();
    this._npTick();
    this._npKey = this._npSig();
    this._en = null;
    const enBox = main.querySelector(".encard");
    if (enBox) { try { const en = document.createElement("hemma-energy-card"); if (en.setConfig) en.setConfig({ type: "custom:hemma-energy-card" }); en.hass = this._hass; enBox.appendChild(en); this._en = en;
      if (en.shadowRoot) en.shadowRoot.appendChild(Object.assign(document.createElement("style"), { textContent: EN_WIDE })); } catch (e) {} }
    this._painted = {};
    main.querySelectorAll(".t[data-e]").forEach((b) => { const id = b.dataset.e; if (id !== "__cameras") this._painted[id] = this._hass.states[id]; });
    if (prev) this._transition(how, prev, main);
  }

  _tick() {
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    this._root.querySelectorAll(".side .clock, .hdr .fclk").forEach((c) => { c.textContent = now; });
    const st = this._root.querySelector(".status");
    if (st) st.innerHTML = `${esc(now)}<span>${esc(window.hemmaDate ? window.hemmaDate(this._hass, "short") : new Date().toDateString().slice(0, 10))}</span>`;
    const bt = this._root.querySelector(".batt"), V = this._dashV || {};
    if (bt && window.hemmaBatterySvg && this._hass) { const h = window.hemmaBatterySvg(this._hass.states, V.status_battery || ""); if (bt._h !== h) { bt._h = h; bt.innerHTML = h; } }
    clearTimeout(this._clockT);
    this._clockT = setTimeout(() => this._tick(), 60000 - (Date.now() % 60000) + 50);
  }

  _badges(room, gaugesOnly) {
    const S = this._hass.states, se = room.sensors || {}, out = [];
    const num = (id) => { const st = id && S[id]; const v = st ? parseFloat(st.state) : NaN; return Number.isFinite(v) ? v : null; };
    const pop = (id) => ` data-ent="${esc(id)}" data-n="${esc(room.name || "")}" data-t="${esc(se.temp || "")}" data-h="${esc(se.humidity || "")}" data-q="${esc(se.quality || "")}" data-s="${esc((se.aqi || []).join(","))}" role="button" tabindex="0"`;
    let ent = null, xa = "";
    const badge = (icon, title, sub, gf, cv) => { const e = ent, x = xa; ent = null; xa = ""; out.push(`<div class="bd${String(icon).indexOf("aqi") === 0 ? " aq" : ""}"${e ? pop(e) : x}>${gf == null ? `<i class="${icon === "motion" ? "mm" : icon === "light" ? "ml" : "mo"}" style="--i:${this._icon(icon)}"></i>` : `<span class="g"><i style="--i:${this._icon(icon)}"></i><i style="--i:${this._ring(gf)};background:var(${cv || "--hemma-badge-climate-color"}, #fff)"></i></span>`}<div><b>${esc(title)}</b><span>${esc(sub)}</span></div></div>`); };
    const t = num(se.temp);
    if (t != null) {
      ent = se.temp;
      const c = ((S[se.temp].attributes || {}).unit_of_measurement || "").indexOf("C") >= 0, L = c ? [18, 21, 24, 27, 29] : [65, 70, 76, 81, 85];
      const label = t <= L[0] ? "Very Cold" : t <= L[1] ? "Cool" : t <= L[2] ? "Comfortable" : t <= L[3] ? "Warm" : t <= L[4] ? "Hot" : "Very Hot";
      badge(t <= L[1] ? "temp-low" : t <= L[3] ? "temp-medium" : "temp-high", "Temperature", `${label} · ${Math.round(t)}°`, c ? (t - 7) / 28 : (t - 45) / 50, "--hemma-badge-temp-" + (t <= L[0] ? "very-cold" : t <= L[1] ? "cool" : t <= L[2] ? "comfortable" : t <= L[3] ? "warm" : t <= L[4] ? "hot" : "very-hot") + "-color");
    }
    const h = num(se.humidity);
    if (h != null) ent = se.humidity;
    if (h != null) badge("humidity", "Humidity", `${h < 30 ? "Very Dry" : h < 40 ? "Dry" : h < 61 ? "Comfortable" : h < 70 ? "Humid" : "Very Humid"} · ${Math.round(h)}%`, h / 100, h <= 29.99 ? "--hemma-badge-humidity-dry-color" : h >= 61 ? "--hemma-badge-humidity-high-color" : "--hemma-badge-climate-color");
    const q = se.quality && S[se.quality];
    if (q && q.state !== "unavailable") {
      const st0 = String(q.state).trim().toLowerCase(), base = { excellent: 0, good: 0.5, moderate: 1, fair: 1, poor: 2, bad: 3, "very bad": 3, "very poor": 3 }[st0];
      let worst = -1;
      (se.aqi || []).forEach((eid) => {
        const n = parseFloat((S[eid] || {}).state);
        if (isNaN(n)) return;
        const id = eid.toLowerCase(), a = (S[eid] || {}).attributes || {}, dc = String(a.device_class || "").toLowerCase(), idx = id.endsWith("_index") || String(a.unit_of_measurement || "").toLowerCase() === "index";
        const t = (id.includes("pm25") || id.includes("pm2_5") || dc === "pm25") ? [12, 35.4, 55.4] : (id.includes("pm10") || dc === "pm10") ? [54, 154, 254] : (id.includes("voc") || id.includes("volatile_organic") || dc.includes("volatile_organic")) ? (idx ? [6, 8, 9] : [100, 200, 300]) : (id.includes("no2") || id.includes("nitrogen_dioxide") || dc === "nitrogen_dioxide") ? (idx ? [6, 8, 9] : [53, 100, 360]) : (id.includes("co2") || id.includes("carbon") || dc === "carbon_dioxide") ? [1000, 1500, 2000] : null;
        if (!t) { worst = Math.max(worst, 0); return; }
        worst = Math.max(worst, n <= t[0] ? 0 : n <= t[1] ? 1 : n <= t[2] ? 2 : 3);
      });
      const lv = worst >= 0 ? worst : base;
      const word = lv === 0 ? T("air_quality.excellent", "Excellent") : lv === 0.5 ? T("air_quality.good", "Good") : lv === 1 ? (st0 === "fair" ? T("air_quality.fair", "Fair") : T("air_quality.moderate", "Moderate")) : lv === 2 ? T("air_quality.poor", "Poor") : lv === 3 ? T("air_quality.bad", "Bad") : null;
      ent = se.quality;
      const raw = word || (this._hass.formatEntityState ? this._hass.formatEntityState(q) : q.state) || q.state;
      badge(lv >= 2 ? "aqi-high" : "aqi-medium", T("air_quality.title", "Air Quality"), raw.charAt(0).toUpperCase() + raw.slice(1), { 0: 1, 0.5: 0.8, 1: 0.55, 2: 0.3, 3: 0.15 }[lv] ?? 0.5, { 0: "--hemma-badge-air-quality-excellent-color", 0.5: "--hemma-badge-air-quality-good-color", 1: "--hemma-badge-air-quality-moderate-color", 2: "--hemma-badge-air-quality-poor-color", 3: "--hemma-badge-air-quality-bad-color" }[lv]);
    }
    if (gaugesOnly) return out.join("");
    const lg = se.lights && S[se.lights];
    if (lg) { xa = ` data-lt="${esc(se.lights)}" role="button" tabindex="0"`; const ids = Array.isArray(lg.attributes.entity_id) ? lg.attributes.entity_id : [se.lights]; const n = ids.filter((id) => S[id] && S[id].state === "on").length; badge("light", T("filter.lights", "Lights"), !ids.length ? T("lights.off", "Off") : n === 0 ? T("lights.all_off", "All Off") : n === ids.length ? T("lights.all_on", "All On") : T("lights.n_on", "{n} On", { n })); }
    const R = this._roomSensors(room), on = (ids) => ids.some((id) => id.indexOf("event.") === 0 ? Date.now() - this._eventAt(id) < 60000 : S[id] && S[id].state === "on");
    const mi = (id) => ` data-mi="${esc(id)}" role="button" tabindex="0"`;
    if (R.motion.length) { xa = mi(R.motion[0]); const t = on(R.motion) ? null : this._lastSeen(R.motion); badge("motion", "Motion", on(R.motion) ? "Detected" : t ? this._ago(t) : "Not Detected"); }
    if (R.occupancy.length) xa = mi(R.occupancy[0]);
    if (R.occupancy.length) badge("person-walking", "Occupancy", on(R.occupancy) ? "Detected" : "Not Detected");
    return out.join("");
  }

  _wireBadges() {
    this._root.querySelectorAll(".main:not(.prev) .bd[data-ent]").forEach((b) => {
      const kind = b.dataset.ent === b.dataset.t ? "temperature" : b.dataset.ent === b.dataset.h ? "humidity" : "air", home = !!b.closest(".cbds");
      const rooms = {};
      if (home) (this._layout.rooms || []).forEach((r) => { const se = r.sensors || {}, id = kind === "temperature" ? se.temp : kind === "humidity" ? se.humidity : se.quality; if (id) rooms[id] = r.name; });
      const open = () => this._openPanel(b.dataset.ent, { type: "custom:hemma-sensor-panel", kind, name: home ? "" : b.dataset.n || "", include: null, scope: home ? "home" : null, rooms: home ? rooms : null }, { title: "", dismissable: true, close: false, sheet: true, style: "--popup-min-width: 440px; --popup-max-width: 440px; --popup-min-width-narrow: 440px; --hemma-popup-radius: 30px;" });
      b.onclick = () => { if (!this._edit) open(); };
      b.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && !this._edit) { e.preventDefault(); open(); } };
    });
    this._root.querySelectorAll(".main:not(.prev) .bd[data-mi]").forEach((b) => {
      b.onclick = () => { if (!this._edit) this._moreInfo(b.dataset.mi); };
      b.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && !this._edit) { e.preventDefault(); this._moreInfo(b.dataset.mi); } };
    });
    this._root.querySelectorAll(".main:not(.prev) .bd[data-lt]").forEach((b) => {
      const id = b.dataset.lt;
      const popup = () => { const g = this._hass.states[id]; this._openPanel(id, { type: "custom:hemma-light-panel", name: (g && g.attributes.friendly_name) || "" }); };
      const toggle = () => this._hass.callService("hemma", "light_smart_toggle", { light_entity: id });
      let t = 0, held = false;
      b.onpointerdown = (e) => { if (this._edit || e.button > 0) return; held = false; clearTimeout(t); t = setTimeout(() => { held = true; popup(); }, 500); };
      b.onpointerup = b.onpointercancel = b.onpointerleave = () => clearTimeout(t);
      b.oncontextmenu = (e) => e.preventDefault();
      b.onclick = () => { if (this._edit) return; if (held) { held = false; return; } toggle(); };
      b.onkeydown = (e) => { if (this._edit) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } };
    });
  }

  _ago(t) {
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return m === 1 ? "1 minute ago" : `${m} minutes ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return h === 1 ? "1 hour ago" : `${h} hours ago`;
    const d = Math.floor(h / 24);
    return d === 1 ? "1 day ago" : `${d} days ago`;
  }

  _roomSensors(room) {
    const H = this._hass, ents = H.entities || {}, devs = H.devices || {}, S = H.states, se = room.sensors || {};
    const cls = (id) => ((S[id] || {}).attributes || {}).device_class;
    const cams = new Set(Object.keys(ents).filter((id) => id.indexOf("camera.") === 0).map((id) => (ents[id] || {}).device_id).filter(Boolean));
    const isCam = (id) => cams.has((ents[id] || {}).device_id);
    const own = (ok) => Object.keys(ents).filter((id) => {
      if (id.indexOf("binary_sensor.") !== 0 && id.indexOf("event.") !== 0) return false;
      const e = ents[id] || {};
      if (!S[id] || e.hidden || e.hidden_by || e.disabled_by || !ok(id)) return false;
      return room.area && (e.area_id || (devs[e.device_id] || {}).area_id) === room.area;
    }).sort();
    const set = se.motion && S[se.motion] ? se.motion : null;
    const motion = set && isCam(set) ? [set] : own((id) => isCam(id) && cls(id) === "motion");
    const occupancy = set && !isCam(set) ? [set] : own((id) => !isCam(id) && ["motion", "occupancy", "presence"].includes(cls(id)));
    return { motion, occupancy };
  }

  _eventAt(id) {
    const H = this._hass, S = H.states, ents = H.entities || {}, dev = (ents[id] || {}).device_id;
    let t = Date.parse((S[id] || {}).state);
    if (dev) Object.keys(ents).forEach((x) => {
      if (x.indexOf("sensor.") !== 0 || (ents[x] || {}).device_id !== dev || !/last_(motion|activity)/.test(x)) return;
      const v = Date.parse((S[x] || {}).state);
      if (Number.isFinite(v) && !(v <= t)) t = v;
    });
    return t;
  }

  _lastSeen(ids) {
    const S = this._hass.states, seen = this._seen || (this._seen = {});
    let best = null;
    const ask = [];
    ids.forEach((id) => {
      if (id.indexOf("event.") === 0) { const t = this._eventAt(id); if (Number.isFinite(t) && (best == null || t > best)) best = t; return; }
      const s = S[id];
      if (!s || s.state !== "off") return;
      const c = seen[id];
      if (c && c.key === s.last_changed) { if (c.at && (best == null || c.at > best)) best = c.at; }
      else ask.push(id);
    });
    if (ask.length && !this._seenBusy) {
      this._seenBusy = true;
      this._hass.callWS({ type: "history/history_during_period", start_time: new Date(Date.now() - 7 * 864e5).toISOString(), entity_ids: ask, minimal_response: true, no_attributes: true, significant_changes_only: false })
        .then((res) => {
          ask.forEach((id) => {
            const list = (res && res[id]) || [];
            let at = null;
            for (let i = list.length - 1; i >= 0; i--) { if (list[i].s !== "on") continue; const n = list[i + 1]; at = n ? Math.round(Number(n.lc || n.lu) * 1000) : Date.now(); break; }
            seen[id] = { key: (S[id] || {}).last_changed, at };
          });
        })
        .catch(() => ask.forEach((id) => { seen[id] = { key: (S[id] || {}).last_changed, at: null }; }))
        .then(() => { this._seenBusy = false; const b = this._root.querySelector(".bds"); if (b) { b.innerHTML = this._badges(this._layout.rooms[this._room]); this._wireBadges(); } });
    }
    return best;
  }

  _ring(gf) {
    const arc = Math.round(Math.max(0.05, Math.min(1, gf)) * 270), rr = 13.5, C = 16, W = 3;
    const pt = (deg) => { const a = deg * Math.PI / 180; return `${(C + rr * Math.sin(a)).toFixed(3)} ${(C - rr * Math.cos(a)).toFixed(3)}`; };
    const path = (a0, a1) => `M ${pt(a0)} A ${rr} ${rr} 0 ${(a1 - a0) > 180 ? 1 : 0} 1 ${pt(a1)}`;
    let p = "";
    if (arc < 269) p += `<path d="${path(225 + arc, 495)}" stroke="white" stroke-opacity="0.30" stroke-width="${W}" stroke-linecap="round" fill="none"/>`;
    p += `<path d="${path(225, 225 + arc)}" stroke="white" stroke-width="${W}" stroke-linecap="round" fill="none"/>`;
    return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${p}</svg>`).replace(/'/g, "%27")}')`;
  }

  _sideMotion() {
    const S = this._hass.states;
    this._root.querySelectorAll(".side [data-room]").forEach((b) => {
      const r = this._layout.rooms[+b.dataset.room], m = r && (r.sensors || {}).motion, dot = b.querySelector(".sm");
      if (!dot || !r) return;
      let on = !!(m && S[m] && S[m].state === "on");
      if (!m && window.hemmaRoomSensors) {
        const R = window.hemmaRoomSensors(this._hass, "room_" + String(r.name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, ""), null);
        on = R.occupancy.some((id) => S[id] && S[id].state === "on");
      }
      const mute = S["input_boolean.hemma_motion_badges"];
      dot.classList.toggle("on", on && (!mute || mute.state === "on"));
    });
  }

  _npHere(page, room) {
    const W = page === "room" ? ((room && room.V) || {}) : page === "home" ? (this._dashV || {}) : null;
    return !!W && W.show_media !== false && !!W.show_now_playing;
  }

  _fnpSync(on, room) {
    const hdr = this._root.querySelector(".hdr");
    if (!hdr) return;
    const old = hdr.querySelector(".fnp"), l = on ? this._npList(room) : [];
    const sig = l.map((r) => [r.entity, r.title, r.subtitle, r.source, r.art].join("|")).join(";");
    if (!l.length) { if (old) old.remove(); return; }
    if (old && old.dataset.sig === sig) { old.classList.toggle("min", this._npMin()); return; }
    const box = document.createElement("div");
    box.className = "fnp" + (this._npMin() ? " min" : "");
    box.dataset.sig = sig;
    box.innerHTML = this._npHtml(l);
    const arts = l.map((r) => r.art).filter(Boolean);
    const keep = (this._npArt = this._npArt || new Map());
    const ready = arts.every((u) => keep.get(u) === true);
    if (!ready) {
      box.style.visibility = "hidden";
      Promise.all(arts.map((u) => { if (keep.get(u) === true) return null; const i = new Image(); i.src = u; return i.decode().then(() => keep.set(u, true), () => keep.set(u, true)); })).then(() => {
        if (!box.isConnected) return;
        box.style.visibility = "";
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      });
    }
    if (old) old.replaceWith(box); else hdr.appendChild(box);
    this._npTick();
  }

  _npMin() {
    const o = this._npMinO;
    if (o && Date.now() - o.at < 4000) return o.v;
    return ((this._hass.states[NP_MIN] || {}).state) === "on";
  }

  _npSig() {
    return this._page === "home" || this._page === "media" || (this._page === "room" && this._focusOn()) ? this._npList().map((r) => [r.entity, r.title, r.playing, r.art].join("|")).join(";") : "";
  }

  _refresh() {
    this._sideMotion();
    if (this._focusOn() && !this._host.classList.contains("ph")) { const rm = this._layout && this._layout.rooms[this._room]; this._fnpSync(this._npHere(this._page || "room", rm), (this._page || "room") === "room" ? rm : null); }
    this._sceneSync();
    if (this._en) this._en.hass = this._hass;
    if ((this._page === "home" || this._page === "media") && this._npSig() !== this._npKey) {
      const main = this._root.querySelector(".main"), y = main.scrollTop;
      this._render();
      main.scrollTop = y;
      return;
    }
    const R = this._root;
    Object.keys(this._painted).forEach((id) => {
      const st = this._hass.states[id];
      if (st === this._painted[id]) return;
      this._painted[id] = st;
      const s = this._state(id);
      R.querySelectorAll(`.t[data-e="${window.CSS.escape(id)}"]:not([data-c])`).forEach((b) => {
        b.classList.toggle("on", s.on);
        b.querySelector(".tx > span").textContent = s.text;
        if (st) this._paintIcon(b.querySelector(".ic"), st);
      });
    });
    R.querySelectorAll(".main:not(.prev) .t[data-c]").forEach((b) => {
      const c = this._cards && this._cards[+b.dataset.c];
      if (!c) return;
      const r = this._kindState(c);
      b.classList.toggle("on", r.on);
      b.classList.toggle("hide", r.hide);
      b.style.setProperty("--c", r.color);
      const sp = b.querySelector(".tx > span");
      if (sp.textContent !== r.text) sp.textContent = r.text;
      if (r.icon && this._kind(c) !== "thermostat") b.dataset.icon = r.icon;
      this._iconOf(b.querySelector(".ic"));
    });
    R.querySelectorAll(".chip").forEach((c) => {
      const sub = this._chipText(c.dataset.cat), el = c.querySelector("b + span");
      if (el && el.textContent !== sub) el.textContent = sub;
      const cc = this._chipColor(c.dataset.cat, sub);
      if (cc && c.style.getPropertyValue("--c") !== cc) c.style.setProperty("--c", cc);
      if (c.dataset.cat === "security") { const i = c.querySelector("i"), ic = this._chipIcon("security", "lock-fill"); if (i && i._ic !== ic) { i._ic = ic; i.style.setProperty("--i", this._icon(ic)); } }
    });
  }

  _iconOf(ic) {
    const b = ic.parentNode, name = b.dataset.icon;
    if (b.dataset.e === "__cameras") return;
    if (name && window.hemmaIconUrl) { if (ic.dataset.n !== name) { ic.dataset.n = name; ic.classList.remove("num"); ic.innerHTML = `<i style="--i:url('${window.hemmaIconUrl(name)}')"></i>`; this._glyphFit(ic.firstChild, window.hemmaIconUrl(name)); } return; }
    const st = this._hass.states[b.dataset.e], c = b.dataset.c != null && this._cards ? this._cards[+b.dataset.c] : null;
    if (st) this._paintIcon(ic, st, c && c.V && c.V.temp_sensor);
  }

  _glyphFit(i, url) {
    const G = this._glyphs || (this._glyphs = new Map());
    const apply = (s) => { if (s && i.isConnected !== false) i.style.scale = s.toFixed(3); };
    if (!G.has(url)) {
      G.set(url, new Promise((done) => {
        const img = new Image();
        img.onload = () => {
          try {
            let ar = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
            const vb = /viewBox(?:=|%3D)(?:"|%22|')([-\d.]+)(?:\s|%20)+([-\d.]+)(?:\s|%20)+([\d.]+)(?:\s|%20)+([\d.]+)/i.exec(url);
            if (vb && +vb[3] > 0 && +vb[4] > 0) ar = +vb[3] / +vb[4];
            const N = 216, c = document.createElement("canvas");
            c.width = c.height = N;
            const x = c.getContext("2d"), w = ar >= 1 ? N : N * ar, h = ar >= 1 ? N / ar : N;
            x.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
            const d = x.getImageData(0, 0, N, N).data;
            let x0 = N, y0 = N, x1 = -1, y1 = -1;
            for (let y = 0; y < N; y++) for (let k = 0; k < N; k++) if (d[(y * N + k) * 4 + 3] > 40) { if (k < x0) x0 = k; if (k > x1) x1 = k; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            if (x1 < 0) return done(0);
            const bw = (x1 - x0 + 1) / N * 27, bh = (y1 - y0 + 1) / N * 27;
            done(Math.min(25 / Math.max(bw, bh), Math.pow(19.5 / Math.sqrt(bw * bh), 0.8)));
          } catch (e) { done(0); }
        };
        img.onerror = () => done(0);
        img.src = url;
      }).then((s) => { G.set(url, s); return s; }));
    }
    const v = G.get(url);
    if (typeof v === "number") apply(v); else v.then(apply);
  }

  _scene(b) {
    const V = this._sceneV || {}, id = b.dataset.sc;
    this._hass.callService("scene", "turn_on", { entity_id: id, transition: Number(V.scene_transition ?? 4) });
    this._sceneOn = this._sceneOn || {};
    this._sceneOn[id] = Date.now() + Number(V.scene_transition ?? 4) * 1000 + 750;
    b.classList.add("on");
    setTimeout(() => { if (this._sceneOn[id] <= Date.now()) b.classList.remove("on"); }, this._sceneOn[id] - Date.now() + 20);
  }

  _wireTile(b) {
    const tg = b.querySelector("[data-tg]");
    if (tg) {
      tg.addEventListener("pointerdown", (e) => e.stopPropagation());
      tg.addEventListener("click", (e) => {
        e.stopPropagation(); e.preventDefault();
        if (this._edit) return;
        const id = b.dataset.e, d = domainOf(id), st = this._hass.states[id];
        if (d === "lock") this._hass.callService("lock", st && st.state === "locked" ? "unlock" : "lock", { entity_id: id });
        else this._hass.callService("homeassistant", "toggle", { entity_id: id });
        tg.classList.toggle("on");
      });
    }
    const id = b.dataset.e;
    if (b.classList.contains("add")) return;
    let lp = 0, lx = 0, ly = 0;
    b.addEventListener("pointerdown", (e) => {
      if (this._edit) return;
      lx = e.clientX; ly = e.clientY;
      lp = setTimeout(() => { lp = 0; this._held = true; this._setEdit(true); }, 520);
    });
    b.addEventListener("pointermove", (e) => { if (lp && Math.hypot(e.clientX - lx, e.clientY - ly) > 10) { clearTimeout(lp); lp = 0; } });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => b.addEventListener(ev, () => { clearTimeout(lp); lp = 0; }));
    b.addEventListener("contextmenu", (e) => { e.preventDefault(); if (!this._edit) this._setEdit(true); });
    b.addEventListener("click", (e) => {
      if (e.composedPath().some((n) => n.classList && n.classList.contains("rm"))) return;
      if (this._edit || this._held) { this._held = false; e.stopImmediatePropagation(); e.preventDefault(); }
    }, true);
    if (b.dataset.c != null && this._cards && this._cards[+b.dataset.c]) {
      const c = this._cards[+b.dataset.c];
      b.addEventListener("click", (e) => {
        const d = domainOf(id), k = this._kind(c);
        if (e.composedPath().some((n) => n.classList && n.classList.contains("ic")) && this._iconTap(c, d, k)) return;
        this._openCard(c);
      });
      return;
    }
    if (id === "__cameras") {
      b.addEventListener("click", () => { const cams = (this._layout.rooms[b.dataset.r != null ? +b.dataset.r : this._room].sensors || {}).cameras || []; this._openPanel(cams[0], { type: customElements.get("hemma-cam-popup-panel") ? "custom:hemma-cam-popup-panel" : "custom:hemma-camera-panel", cameras: cams, entity: cams[0] }); });
      return;
    }
    b.addEventListener("click", (e) => {
      const d = domainOf(id);
      if (e.composedPath().some((n) => n.classList && n.classList.contains("ic")) && TOGGLE.includes(d)) {
        this._hass.callService("homeassistant", "toggle", { entity_id: id });
        return;
      }
      this._openPanel(id);
    });
  }

  _menu(anchor, items) {
    const R = this._root;
    R.querySelectorAll(".menu, .scrim").forEach((n) => n.remove());
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    const m = document.createElement("div");
    m.className = "menu";
    m.innerHTML = items.map((it, i) => it.sub ? `<div class="sub">${esc(it.sub)}</div>` : `<button type="button" data-i="${i}" class="${it.red ? "red" : ""}">${esc(it.label)}</button>`).join("");
    const close = () => { m.remove(); scrim.remove(); };
    scrim.onclick = close;
    m.querySelectorAll("button").forEach((b) => { b.onclick = () => { close(); items[+b.dataset.i].run(); }; });
    R.append(scrim, m);
    const r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + "px";
    m.style.top = (r.bottom + 8 + h < innerHeight ? r.bottom + 8 : Math.max(8, r.top - h - 8)) + "px";
  }

  _macMenu(anchor, items) {
    const R = this._root, old = R.querySelector(".mnu");
    if (old) { old._close(); return; }
    const pill = anchor.closest(".pill") || anchor.closest(".nav") || anchor, pr = pill.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    const m = document.createElement("div");
    m.className = "mnu" + (document.documentElement.classList.contains("hemma-hv") ? " flat" : "") + (items.cls ? " " + items.cls : "");
    m.setAttribute("role", "menu");
    m.innerHTML = items.map((it, i) => `<button type="button" role="menuitem" data-i="${i}">${it.icon ? `<span class="mi">${it.icon}</span>` : ""}<span>${esc(it.label)}</span></button>`).join("");
    m.style.top = Math.round(pr.bottom + (items.cls === "mm" ? 7 : 3)) + "px";
    if (items.left) m.style.left = Math.round(Math.min(pr.left, innerWidth - 12 - 260)) + "px";
    else m.style.right = Math.round(innerWidth - pr.right) + "px";
    R.appendChild(m);
    if (items.center) { const w = m.getBoundingClientRect().width; m.style.right = "auto"; m.style.left = Math.round(Math.max(12, Math.min(innerWidth - 12 - w, ar.left + ar.width / 2 - w / 2))) + "px"; }
    anchor.classList.add("held");
    const morph = this._host.classList.contains("ph") && anchor.closest(".hdr .pill") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? this._pillMorph(pill, m) : null;
    let done = false;
    const close = (after) => {
      if (done) return; done = true;
      document.removeEventListener("pointerdown", away, true);
      document.removeEventListener("keydown", key, true);
      anchor.classList.remove("held");
      m.style.pointerEvents = "none";
      const fin = () => { m.remove(); if (after) after(); };
      if (morph) { morph.close(fin); return; }
      m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-out", fill: "forwards" }).finished.then(fin, fin);
    };
    const away = (e) => {
      if (e.composedPath().includes(m) || e.composedPath().includes(anchor)) return;
      e.stopPropagation(); e.preventDefault();
      const eat = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      ["pointerup", "mouseup", "touchend", "click"].forEach((t) => document.addEventListener(t, eat, { capture: true, once: t === "click" }));
      setTimeout(() => ["pointerup", "mouseup", "touchend", "click"].forEach((t) => document.removeEventListener(t, eat, true)), 450);
      close();
    };
    const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    m._close = () => close();
    m.querySelectorAll("button").forEach((b) => { b.onclick = () => close(items[+b.dataset.i].run); });
    setTimeout(() => { document.addEventListener("pointerdown", away, true); document.addEventListener("keydown", key, true); }, 0);
  }

  _pillMorph(pill, m) {
    const pr = pill.getBoundingClientRect();
    Object.assign(m.style, { top: pr.top + "px", right: Math.round(innerWidth - pr.right) + "px", left: "auto" });
    const fr = m.getBoundingClientRect(), cs = getComputedStyle(m), pcs = getComputedStyle(pill);
    const inner = document.createElement("div");
    inner.style.cssText = `display:flex;flex-direction:column;width:${fr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)}px;flex:none`;
    while (m.firstChild) inner.appendChild(m.firstChild);
    m.appendChild(inner);
    Object.assign(m.style, { left: fr.left + "px", right: "auto", top: fr.top + "px", width: fr.width + "px", height: fr.height + "px", overflow: "hidden", boxSizing: "border-box" });
    const zeta = 0.72, w0 = 15, wd = w0 * Math.sqrt(1 - zeta * zeta), sp = (t) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
    const ease = "linear(" + Array.from({ length: 31 }, (_, i) => sp((i / 30) * 0.5).toFixed(3)).join(", ") + ")";
    const from = { left: pr.left + "px", top: pr.top + "px", width: pr.width + "px", height: pr.height + "px", borderRadius: pr.height / 2 + "px", backgroundColor: pcs.backgroundColor, boxShadow: pcs.boxShadow };
    const to = { left: fr.left + "px", top: fr.top + "px", width: fr.width + "px", height: fr.height + "px", borderRadius: cs.borderRadius, backgroundColor: cs.backgroundColor, boxShadow: cs.boxShadow };
    const ghost = (on, ms, delay) => pill.animate([{ opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }], { duration: ms, delay: delay || 0, easing: "ease-out", fill: "forwards" });
    pill.style.setProperty("box-shadow", "none", "important");
    const hide = ghost(false, 90);
    m.animate([from, to], { duration: 480, easing: ease });
    inner.animate([{ opacity: 0, filter: "blur(8px)", transform: "translateY(-6px)" }, { opacity: 1, filter: "blur(0px)", transform: "none" }], { duration: 240, delay: 110, easing: "ease-out", fill: "backwards" });
    return {
      close: (fin) => {
        inner.animate([{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(8px)" }], { duration: 130, easing: "ease-in", fill: "forwards" });
        const a = m.animate([to, from], { duration: 380, delay: 40, easing: "cubic-bezier(.32,.72,0,1)", fill: "forwards" });
        setTimeout(() => { hide.cancel(); ghost(true, 120); }, 300);
        const done = () => { pill.style.removeProperty("box-shadow"); fin(); };
        a.finished.then(done, done);
      },
    };
  }

  _scenesMenu(anchor) {
    const S = this._hass.states, V = this._sceneV || {}, ids = this._scenes(null);
    if (!ids.length) { this._go("scenes"); return; }
    const icon = (id) => { const a = S[id].attributes || {}, ic = (V.scene_icons || {})[id]; return ic ? `<i style="display:block;width:20px;height:20px;background:currentColor;-webkit-mask:url('${escU(ic)}') center/contain no-repeat;mask:url('${escU(ic)}') center/contain no-repeat"></i>` : `<ha-icon icon="${esc(a.icon || "mdi:palette")}" style="--mdc-icon-size:20px;display:flex"></ha-icon>`; };
    const name = (id) => { const a = S[id].attributes || {}; return a.friendly_name || id.replace("scene.", "").replace(/_/g, " "); };
    const run = (id) => { const b = document.createElement("button"); b.dataset.sc = id; this._scene(b); };
    const P = window.hemmaCapPick, mac = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (mac || !P) { const items = ids.map((id) => ({ label: name(id), icon: icon(id), run: () => run(id) })); items.center = true; items.cls = "mm"; this._macMenu(anchor, items); return; }
    let wrap = this._root.querySelector(".mwrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "mwrap";
      wrap.innerHTML = `<style>${window.hemmaCapsCss || ""} .mwrap .gmenu { pointer-events: auto; }</style>`;
      this._root.appendChild(wrap);
    }
    anchor.classList.add("held");
    const mo = new MutationObserver(() => { if (!wrap.querySelector(".gmenu")) { anchor.classList.remove("held"); mo.disconnect(); } });
    P(anchor, ids.map((id) => [id, name(id), icon(id)]), null, (k) => run(k), wrap);
    mo.observe(wrap, { childList: true, subtree: true });
  }

  _haSidebar() {
    const ha = document.querySelector("home-assistant"), main = ha && ha.shadowRoot && ha.shadowRoot.querySelector("home-assistant-main");
    const dr = main && main.shadowRoot && main.shadowRoot.querySelector("ha-drawer"), sb = main && main.shadowRoot && main.shadowRoot.querySelector("ha-sidebar");
    if (!ha) return;
    if (this._haSb) { this._haSb(); return; }
    const S = ha.style, still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrim = document.createElement("div");
    scrim.className = "hasb";
    this._root.appendChild(scrim);
    scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: still ? 0 : 280, easing: "ease-out" });
    S.position = "fixed"; S.inset = "0"; S.display = "block"; S.zIndex = "60";
    const modal = dr && dr.type === "modal";
    let anim = null, w = sb ? Math.round(sb.getBoundingClientRect().width) : 0;
    const done = () => { ["position", "inset", "display", "z-index"].forEach((k) => S.removeProperty(k)); S.removeProperty("clip-path"); scrim.remove(); this._haSb = null; window.removeEventListener("location-changed", quick); document.removeEventListener("keydown", key, true); };
    const close = () => {
      if (this._haSb !== close) return;
      this._haSb = () => {};
      if (modal) { this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })); }
      scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: still ? 0 : 240, easing: "ease-in", fill: "forwards" });
      if (!modal && w && !still) { const a = ha.animate([{ clipPath: `inset(0 calc(100% - ${w}px) 0 0)` }, { clipPath: "inset(0 100% 0 0)" }], { duration: 300, easing: "cubic-bezier(.32,.72,0,1)", fill: "forwards" }); a.finished.then(() => { a.cancel(); done(); }, done); }
      else setTimeout(done, still ? 0 : 260);
    };
    const quick = () => { if (anim) anim.cancel(); done(); };
    const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    this._haSb = close;
    scrim.addEventListener("click", close);
    window.addEventListener("location-changed", quick);
    document.addEventListener("keydown", key, true);
    if (modal) {
      S.clipPath = "inset(0 calc(100% - 320px) 0 0)";
      this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
      setTimeout(() => { const q = sb && sb.getBoundingClientRect(); if (this._haSb === close && q && q.right > 40) S.clipPath = `inset(0 calc(100% - ${Math.ceil(q.right)}px) 0 0)`; }, 450);
      const wd = dr.shadowRoot && dr.shadowRoot.querySelector("wa-drawer");
      if (wd) wd.addEventListener("wa-after-hide", () => { if (this._haSb === close) { this._haSb = () => {}; scrim.remove(); done(); } }, { once: true });
      return;
    }
    if (!w) { done(); if (window.hemmaLiftHaSidebar) window.hemmaLiftHaSidebar(); return; }
    S.clipPath = `inset(0 calc(100% - ${w}px) 0 0)`;
    if (!still) anim = ha.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: `inset(0 calc(100% - ${w}px) 0 0)` }], { duration: 380, easing: "cubic-bezier(.32,.72,0,1)" });
  }

  async _moreMenu(anchor) {
    const ph = this._host.classList.contains("ph");
    const mask = (name, z) => `<i style="display:block;width:20px;height:20px;background:currentColor;-webkit-mask:${this._icon(name)} center/${z || "contain"} no-repeat;mask:${this._icon(name)} center/${z || "contain"} no-repeat"></i>`;
    const mdi = (name) => `<ha-icon icon="${name}" style="--mdc-icon-size:20px;display:flex"></ha-icon>`;
    const items = [
      { key: "refresh", label: T("ui.common.refresh", "Refresh"), icon: mask("refresh"), run: () => window.location.reload() },
      { key: "edit", label: T("native.edit_dashboard", "Edit Dashboard"), icon: mask("pencil", "14px 14px"), run: () => this._setEdit(true) },
    ];
    if (!ph && window._hemmaSaverSet && window._hemmaSaverSet()) items.push({ key: "saver", label: T("menu.screensaver", "Start Screensaver"), icon: mdi("mdi:clock-outline"), run: () => { if (window._hemmaSaverNow) window._hemmaSaverNow(); } });
    if (!ph) items.push({ key: "ha", label: T("nav.home_assistant", "Home Assistant"), icon: mdi("mdi:home-assistant"), run: () => this._haSidebar() });
    const P = window.hemmaCapPick;
    if (!P || ph || window.matchMedia("(hover: hover) and (pointer: fine)").matches) { items.cls = "mm"; this._macMenu(anchor, items); return; }
    let wrap = this._root.querySelector(".mwrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "mwrap";
      wrap.innerHTML = `<style>${window.hemmaCapsCss || ""} .mwrap .gmenu { pointer-events: auto; }</style>`;
      this._root.appendChild(wrap);
    }
    P(anchor.closest(".pill") || anchor, items.map((it) => [it.key, it.label, it.icon]), null, (k) => { const it = items.find((x) => x.key === k); if (it) it.run(); }, wrap);
  }


}

if (!customElements.get("hemma-native-panel")) customElements.define("hemma-native-panel", HemmaNativePanel);
