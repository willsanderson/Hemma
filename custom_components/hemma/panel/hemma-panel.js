// Hemma config panel.
// Generator and form schema carried over verbatim from the tested slice.

const PANEL_VERSION = "0.10.3";
const TEMPLATES_URL = "/hemma_panel/hemma-templates.json";


const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

function stable(x) {
  if (x === null || typeof x !== "object") return JSON.stringify(x);
  if (Array.isArray(x)) return "[" + x.map(stable).join(",") + "]";
  return "{" + Object.keys(x).sort().map((k) => JSON.stringify(k) + ":" + stable(x[k])).join(",") + "}";
}

const omit = (obj, keys) => {
  const out = {};
  Object.keys(obj || {}).forEach((k) => { if (!keys.includes(k)) out[k] = clone(obj[k]); });
  return out;
};

// ─── generator ────────────────────────────────────────────────────────────────

function extractConfig(lovelace) {
  const views = lovelace.views || [];
  if (!views.length) throw new Error("dashboard has no views");

  const first = views[0];
  const scaffold = {
    view_type: first.type,
    layout: clone(first.layout),
    nav: clone((first.cards || [])[1]),
  };
  const navNorm = stable(scaffold.nav);

  const warnings = [];
  const rooms = [];

  views.forEach((v) => {
    const cards = v.cards || [];
    if (cards.length < 3) {
      warnings.push(`view "${v.path}" has ${cards.length} cards, expected at least 3 - skipped`);
      return;
    }
    if (cards.length > 3) {
      warnings.push(`view "${v.path}" has ${cards.length - 3} extra card(s) after the smart row - preserved as-is`);
    }
    const [hero, nav, row] = cards;
    if (hero.template !== "hemma_room") warnings.push(`view "${v.path}" card[0] template is ${hero.template}`);
    if (stable(nav) !== navNorm) warnings.push(`view "${v.path}" nav stack differs from view[0]`);
    if (row.type !== "custom:hemma-smart-row") warnings.push(`view "${v.path}" card[2] is ${row.type}`);

    rooms.push({
      title: v.title,
      path: v.path,
      name: hero.name,
      variables: clone(hero.variables) || {},
      tiles: clone(row.cards) || [],
      _hero: omit(hero, ["name", "variables"]),
      _row: omit(row, ["cards"]),
      _view: omit(v, ["type", "layout", "title", "path", "cards"]),
      _extraCards: clone(cards.slice(3)),
    });
  });

  return {
    compact: { rooms },
    scaffold,
    extras: omit(lovelace, ["views", "button_card_templates"]),
    templates: lovelace.button_card_templates,
    warnings,
  };
}

function expandConfig(compact, scaffold, extras, templates) {
  const views = (compact.rooms || []).map((room) => ({
    type: scaffold.view_type,
    title: room.title,
    path: room.path,
    layout: clone(scaffold.layout),
    ...clone(room._view),
    cards: [
      { ...clone(room._hero), name: room.name, variables: clone(room.variables) },
      clone(scaffold.nav),
      { ...clone(room._row), cards: clone(room.tiles) },
      ...(clone(room._extraCards) || []),
    ],
  }));

  const out = clone(extras) || {};
  if (templates) out.button_card_templates = templates;
  out.views = views;
  return out;
}

// ─── form schema ──────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    label: "Appearance",
    fields: [
      { key: "__name", label: "Room name", type: "text" },
      { key: "image", label: "Background image", type: "image" },
    ],
  },
  {
    label: "Climate",
    fields: [
      { key: "climate_entity_1", label: "Thermostat 1", domains: ["climate"] },
      { key: "climate_entity_2", label: "Thermostat 2", domains: ["climate"] },
      { key: "temp_sensor_1", label: "Temperature 1", domains: ["sensor"] },
      { key: "temp_sensor_2", label: "Temperature 2", domains: ["sensor"] },
      { key: "temp_sensor_3", label: "Temperature 3", domains: ["sensor"] },
      { key: "humidity_sensor", label: "Humidity", domains: ["sensor"] },
      { key: "quality_sensor", label: "Air quality", domains: ["sensor"] },
      { key: "temp_unit", label: "Unit", type: "select", options: ["", "F", "C"] },
    ],
  },
];


SECTIONS.push(
  {
    label: "Lights",
    fields: [
      { key: "light_group_entity", label: "Room light group", domains: ["light"] },
      { key: "light_entity_1", label: "Light 1", domains: ["light"] },
      { key: "light_entity_2", label: "Light 2", domains: ["light"] },
      { key: "light_entity_3", label: "Light 3", domains: ["light"] },
    ],
  },
  {
    label: "Weather",
    fields: [
      { key: "weather_entity", label: "Weather", domains: ["weather"] },
      { key: "weather_temp_sensor", label: "Outdoor temperature", domains: ["sensor"] },
    ],
  }
);


const E = (key, label, domains) => ({ key, label, domains });
const T = (key, label) => ({ key, label, type: "text" });
const LIST = (key, label, domains) => ({ key, label, type: "list", domains });

SECTIONS.push(
  {
    label: "Media",
    fields: [
      E("media_player_1", "Media player 1", ["media_player"]),
      E("media_player_2", "Media player 2", ["media_player"]),
      E("media_player_3", "Media player 3", ["media_player"]),
      E("media_player_4", "Media player 4", ["media_player"]),
      E("media_player_5", "Media player 5", ["media_player"]),
      { key: "show_now_playing", label: "Now Playing panel", type: "bool" },
    ],
  },
  {
    label: "Presence",
    fields: [
      E("presence_entity_1", "Person 1", ["sensor", "person"]),
      E("presence_entity_2", "Person 2", ["sensor", "person"]),
      E("presence_entity_3", "Person 3", ["sensor", "person"]),
      E("presence_entity_4", "Person 4", ["sensor", "person"]),
    ],
  },
  {
    label: "Air quality",
    fields: [
      T("aqi_room_name", "Popup title"),
      E("aqi_entity_pm25", "PM2.5", ["sensor"]),
      E("aqi_entity_pm10", "PM10", ["sensor"]),
      E("aqi_entity_voc", "VOC", ["sensor"]),
      E("aqi_entity_co2", "CO2", ["sensor"]),
      E("aqi_entity_temp", "Temperature", ["sensor"]),
      E("aqi_entity_humidity", "Humidity", ["sensor"]),
    ],
  },
  {
    label: "Security",
    fields: [
      E("security_entity_1", "Badge entity 1", ["lock", "binary_sensor", "camera"]),
      T("security_label_1", "Badge label 1"),
      E("security_entity_2", "Badge entity 2", ["lock", "binary_sensor", "camera"]),
      T("security_label_2", "Badge label 2"),
      E("security_lock_entity", "Primary lock", ["lock"]),
      LIST("security_locks", "Locks", ["lock"]),
      LIST("security_door_sensors", "Door / window sensors", ["binary_sensor"]),
      LIST("security_cameras", "Cameras", ["camera"]),
      LIST("security_lock_batteries", "Lock batteries", ["sensor"]),
    ],
  },
  {
    label: "Energy",
    fields: [
      E("energy_power_entity", "Current power", ["sensor"]),
      E("energy_usage_today", "Usage today", ["sensor"]),
      E("energy_usage_month", "Usage this month", ["sensor"]),
      E("energy_cost_today", "Cost today", ["sensor"]),
      E("energy_cost_month", "Cost this month", ["sensor"]),
    ],
  },
  {
    label: "Energy badge items",
    fields: [
      E("energy_entity_1", "Item 1 entity", ["sensor"]),
      T("energy_label_1", "Item 1 label"),
      { key: "energy_unit_1", label: "Item 1 unit", type: "select", options: ["", "cost", "power", "energy"] },
      E("energy_entity_2", "Item 2 entity", ["sensor"]),
      T("energy_label_2", "Item 2 label"),
      { key: "energy_unit_2", label: "Item 2 unit", type: "select", options: ["", "cost", "power", "energy"] },
    ],
  },
  {
    label: "Energy popup devices",
    fields: [
      T("energy_popup_name_1", "Device 1 name"),
      E("energy_popup_power_1", "Device 1 power", ["sensor"]),
      E("energy_popup_today_1", "Device 1 today", ["sensor"]),
      E("energy_popup_month_1", "Device 1 month", ["sensor"]),
      E("energy_popup_cost_today_1", "Device 1 cost today", ["sensor"]),
      E("energy_popup_cost_month_1", "Device 1 cost month", ["sensor"]),
      T("energy_popup_name_2", "Device 2 name"),
      E("energy_popup_power_2", "Device 2 power", ["sensor"]),
      E("energy_popup_today_2", "Device 2 today", ["sensor"]),
      E("energy_popup_month_2", "Device 2 month", ["sensor"]),
      E("energy_popup_cost_today_2", "Device 2 cost today", ["sensor"]),
      E("energy_popup_cost_month_2", "Device 2 cost month", ["sensor"]),
    ],
  }
);

const slug = (s) =>
  String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "room";

function blankRoom(name, path, image) {
  return {
    title: path,
    path: path,
    name: name,
    variables: { image: image },
    tiles: [],
    _hero: { type: "custom:button-card", template: "hemma_room" },
    _row: { type: "custom:hemma-smart-row" },
    _view: {},
    _extraCards: [],
  };
}

const ROOM_ICONS = {
  "home": "mdi:home-variant", "living room": "mdi:sofa", "lounge": "mdi:sofa",
  "kitchen": "mdi:fridge", "bedroom": "mdi:bed-king", "bathroom": "mdi:shower",
  "office": "mdi:desk", "garage": "mdi:garage", "dining room": "mdi:silverware-fork-knife",
  "basement": "mdi:stairs-down", "attic": "mdi:home-roof", "hallway": "mdi:door-open",
  "laundry": "mdi:washing-machine", "garden": "mdi:flower", "outside": "mdi:tree",
  "nursery": "mdi:teddy-bear", "study": "mdi:bookshelf", "gym": "mdi:dumbbell",
};

const roomIcon = (name) => ROOM_ICONS[String(name || "").toLowerCase().trim()] || "mdi:home-variant";

// The shipped nav has absolute links to the author's own dashboard, and it is
// embedded twice: as the view's nav card and again inside the hemma_room
// template. Rewrite every route list, keeping non-link routes (Scenes) as-is.
function retargetRoutes(root, urlPath, rooms) {
  const out = clone(root);
  let rewritten = 0;

  (function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (Array.isArray(node.routes)) {
      const extras = node.routes.filter((r) => !r.url);
      node.routes = rooms
        .map((r) => ({ url: `/${urlPath}/${r.path}`, label: r.name, icon: roomIcon(r.name) }))
        .concat(clone(extras));
      rewritten += 1;
    }
    Object.keys(node).forEach((k) => walk(node[k]));
  })(out);

  return { config: out, rewritten };
}


// ─── tile catalog ─────────────────────────────────────────────────────────────
// Types people set up by hand. Anything else in a room's row is preserved
// untouched and shown read-only, so unknown tiles can be reordered but not
// edited into something the template does not understand.

const HEMMA_ICONS = ["access_point","apple","apple_tv","aqi-high","aqi-low","aqi-medium","arrow-down","arrow-up","backward","battery","bedroom","clock","close","console","cooling","curtain-closed","curtain-open","decrease","default","door-closed","door-open","doorbell","electric","energy","fan","forward","fridge","gas","heating","home","homepod","hot_water","humidifier","humidity","increase","kitchen","lamp","light","living-room","lock-fill","lock-open-fill","lock-open","lock-unlocking-fill","lock-unlocking","lock","media","menu","motion","music","mute","pause","pendant-light","pendent","person","plant","play-next","play","plex","plug","power_off","power_on","ps5","ps5_off","purifier","scenes","skip_next","skip_previous","sony","speaker","temp-high","temp-low","temp-medium","thermostat","tv-play","tv","unmute","updates","vacuum-charge","vacuum-clean","vacuum","wifi","youtube.png"];

const ICON_FIELD = { key: "icon", label: "Icon", type: "icon" };

const TILE_TYPES = [
  { id: "light", label: "Light", template: "hemma_light",
    domains: ["light"], fields: [ICON_FIELD] },
  { id: "thermostat", label: "Thermostat", template: "hemma_thermostat",
    domains: ["climate"], fields: [{ key: "temp_sensor", label: "Temperature sensor", domains: ["sensor"] }] },
  { id: "media", label: "Media player", template: "hemma_media",
    domains: ["media_player"], fields: [
      ICON_FIELD,
      { key: "show_progress", label: "Show progress", type: "bool" },
      { key: "progress_entity", label: "Progress entity", domains: ["media_player"] },
    ] },
  { id: "fan", label: "Fan", template: "hemma_fan",
    domains: ["fan"], fields: [ICON_FIELD] },
  { id: "cover", label: "Cover", template: "hemma_cover",
    domains: ["cover"], fields: [ICON_FIELD] },
  { id: "vacuum", label: "Vacuum", template: "hemma_vacuum",
    domains: ["vacuum"], fields: [ICON_FIELD] },
  { id: "air_purifier", label: "Air purifier", template: "hemma_air_purifier",
    domains: ["fan"], fields: [ICON_FIELD] },
  { id: "humidifier", label: "Humidifier", template: "hemma_humidifier",
    domains: ["humidifier"], fields: [ICON_FIELD] },
  { id: "updates", label: "Updates", template: "hemma_updates",
    domains: ["sensor"], fields: [] },
  { id: "plant", label: "Plant", template: "hemma_plant",
    domains: ["sensor"], fields: [
      { key: "sensors", label: "Plant sensors", type: "list", domains: ["sensor"] },
    ] },
  { id: "energy_tile", label: "Energy", template: "hemma_energy",
    domains: ["sensor"], fields: [
      { key: "room_name", label: "Popup title", type: "text" },
      { key: "entity_power", label: "Current power", domains: ["sensor"] },
      { key: "entity_usage_today", label: "Usage today", domains: ["sensor"] },
      { key: "entity_usage_month", label: "Usage this month", domains: ["sensor"] },
      { key: "entity_cost_today", label: "Cost today", domains: ["sensor"] },
      { key: "entity_cost_month", label: "Cost this month", domains: ["sensor"] },
    ] },
  { id: "battery", label: "Batteries", template: "hemma_battery",
    domains: ["sensor"], fields: [
      { key: "room_name", label: "Popup title", type: "text" },
      { key: "batteries", label: "Battery sensors", type: "list", domains: ["sensor"] },
    ] },
  { id: "network", label: "Network", template: "hemma_network",
    domains: ["sensor", "binary_sensor"], fields: [
      { key: "room_name", label: "Popup title", type: "text" },
      { key: "entity_status", label: "Internet status", domains: ["binary_sensor"] },
      { key: "entity_ping", label: "Ping", domains: ["sensor"] },
      { key: "entity_upload", label: "Upload speed", domains: ["sensor"] },
      { key: "entity_stat_1", label: "Stat 1", domains: ["sensor"] },
      { key: "entity_stat_2", label: "Stat 2", domains: ["sensor"] },
      { key: "entity_stat_3", label: "Stat 3", domains: ["sensor"] },
      { key: "entity_stat_4", label: "Stat 4", domains: ["sensor"] },
      { key: "action_1_entity", label: "Action 1 button", domains: ["button", "switch", "script"] },
      { key: "action_1_status", label: "Action 1 status", domains: ["binary_sensor", "sensor"] },
      { key: "action_2_entity", label: "Action 2 button", domains: ["button", "switch", "script"] },
      { key: "action_2_status", label: "Action 2 status", domains: ["binary_sensor", "sensor"] },
    ] },
  { id: "plex", label: "Plex recently added", template: "hemma_plex_recently_added",
    domains: ["sensor"], fields: [] },
  { id: "lock_group", label: "Lock group", template: ["hemma_lock", "hemma_popup_lock"],
    domains: ["lock"], fields: [
      { key: "room_name", label: "Popup title", type: "text" },
      { key: "locks", label: "Locks", type: "list", domains: ["lock"] },
      { key: "door_sensors", label: "Door sensors", type: "list", domains: ["binary_sensor"] },
      { key: "battery_entities", label: "Lock batteries", type: "list", domains: ["sensor"] },
    ] },
  { id: "cover_group", label: "Cover group", template: ["hemma_cover", "hemma_popup_cover"],
    domains: ["cover"], fields: [
      { key: "room_name", label: "Popup title", type: "text" },
      { key: "covers", label: "Covers", type: "list", domains: ["cover"] },
    ] },
];

const tileTypeOf = (tile) => {
  const t = tile.template;
  if (typeof t === "string") return TILE_TYPES.find((x) => x.template === t) || null;
  if (Array.isArray(t)) {
    return TILE_TYPES.find(
      (x) => Array.isArray(x.template) && stable(x.template) === stable(t)
    ) || null;
  }
  return null;
};

const tileLabel = (tile) => {
  const t = tile.template;
  return Array.isArray(t) ? t.join(" + ") : String(t || tile.type || "card");
};

function newTile(type) {
  const tile = { type: "custom:button-card", template: type.template, entity: "", name: type.label };
  if (type.fields.length) tile.variables = {};
  return tile;
}

// ─── panel ────────────────────────────────────────────────────────────────────

class HemmaPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._state = null;
    this._room = 0;
    this._bundle = null;
  }

  set hass(hass) {
    this._hass = hass;
    const dark = !(hass.themes && hass.themes.darkMode === false);
    this.classList.toggle("is-light", !dark);
    if (!this._built) { this._built = true; this._build(); }
  }
  set narrow(v) { this._narrow = v; }
  set route(v) { this._route = v; }
  set panel(v) { this._panel = v; }

  $(id) { return this.shadowRoot.getElementById(id); }

  _log(msg, kind) {
    const el = this.$("log");
    if (!el) return;
    const line = document.createElement("div");
    line.className = "line " + (kind || "");
    line.textContent = msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }
  _clearLog() { if (this.$("log")) this.$("log").innerHTML = ""; }

  _status(msg, kind) {
    const el = this.$("status");
    el.textContent = msg || "";
    el.className = "status " + (kind || "");
  }

  async _bundleOnce() {
    if (this._bundle) return this._bundle;
    const res = await fetch(TEMPLATES_URL);
    if (!res.ok) throw new Error(`templates ${res.status}`);
    this._bundle = await res.json();
    return this._bundle;
  }

  async _build() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display:block; min-height:100%; position:relative; isolation:isolate;
          --g-blur: var(--hemma-glass-backdrop, blur(24px) saturate(180%));
          --g-rim: var(--hemma-glass-rim,
            inset 0 1px .5px -0.5px rgba(255,255,255,0.55),
            inset 0 -1px .5px -0.5px rgba(255,255,255,0.48),
            inset 0 3px 6px -3px rgba(255,255,255,0.20),
            inset 0 -3px 6px -3px rgba(255,255,255,0.12),
            0 2px 8px rgba(0,0,0,0.18));
          --ink:#f5f5f7; --ink-2:rgba(235,235,245,0.66); --ink-3:rgba(235,235,245,0.38);
          --hair:rgba(255,255,255,0.10);
          --accent:#0a84ff;
          --r-xl:30px; --r-lg:22px; --r-md:15px; --r-sm:11px;
          --gap:18px;
          color:var(--ink);
          font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;
          font-size:14px; -webkit-font-smoothing:antialiased;
          background:var(--primary-background-color,#0c0c0f);
        }

        /* Blurred room photo behind the glass. Sibling, never an ancestor, so it
           cannot break backdrop-filter on the cards. Overhangs to keep the blur
           from darkening at the edges. */
        .bg, .bgtint { position:fixed; inset:-160px; z-index:0; pointer-events:none; }
        .bg {
          width:calc(100% + 320px); height:calc(100% + 320px);
          object-fit:cover; filter:blur(16px) saturate(118%);
          opacity:0; transition:opacity .5s ease;
        }
        .bg.on { opacity:.55; }
        .bgtint {
          background:
            radial-gradient(1100px 620px at 15% -12%, rgba(120,150,220,0.14), transparent 62%),
            linear-gradient(to bottom, rgba(8,8,12,0.44), rgba(8,8,12,0.72));
        }
        :host(.is-light) .bg.on { opacity:.68; }
        :host(.is-light) .bgtint {
          background:
            radial-gradient(1100px 620px at 15% -12%, rgba(120,150,220,0.10), transparent 62%),
            linear-gradient(to bottom, rgba(8,8,12,0.30), rgba(8,8,12,0.58));
        }
        .top, .body { position:relative; z-index:1; }

        .top {
          position:sticky; top:0; z-index:6;
          display:flex; align-items:center; gap:14px; padding:15px 28px; box-sizing:border-box;
          background:rgba(22,22,28,0.42);
          backdrop-filter:var(--g-blur); -webkit-backdrop-filter:var(--g-blur);
          box-shadow:inset 0 -1px 0 var(--hair);
        }
        .top h1 { font-size:21px; font-weight:600; margin:0; letter-spacing:-0.022em; }
        .ver { font-size:11px; color:var(--ink-3); font-weight:450; margin-left:7px; letter-spacing:0; }
        .burger {
          background:rgba(255,255,255,0.12); border:0; color:var(--ink); cursor:pointer;
          width:38px; height:38px; border-radius:50%; padding:0;
          display:flex; align-items:center; justify-content:center;
          box-shadow:inset 0 0 0 1px rgba(255,255,255,0.10);
          transition:background .18s ease;
        }
        .burger svg { width:20px; height:20px; display:block; }
        .burger:hover { background:rgba(255,255,255,0.20); }
        .spacer { flex:1; }

        .body { padding:28px; max-width:1320px; margin:0 auto; box-sizing:border-box; }

        select, input[type=text], input:not([type]), textarea {
          font:inherit; color:var(--ink);
          background:rgba(0,0,0,0.24);
          border:1px solid rgba(255,255,255,0.10);
          border-radius:var(--r-sm); padding:9px 12px;
          transition:border-color .16s ease, background .16s ease;
        }
        select:focus, input:focus, textarea:focus {
          outline:none; border-color:rgba(10,132,255,0.9); background:rgba(0,0,0,0.30);
        }
        input::placeholder, textarea::placeholder { color:var(--ink-3); }

        button {
          font:inherit; font-weight:590; cursor:pointer; color:#fff;
          background:var(--accent); border:0; border-radius:999px; padding:10px 20px;
          transition:filter .16s ease, transform .12s ease;
        }
        button:hover:not(:disabled) { filter:brightness(1.12); }
        button:active:not(:disabled) { transform:scale(0.97); }
        button.ghost {
          background:rgba(255,255,255,0.13); color:var(--ink);
          box-shadow:inset 0 0 0 1px rgba(255,255,255,0.13);
          backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
        }
        button.ghost:hover:not(:disabled) { background:rgba(255,255,255,0.20); filter:none; }
        button:disabled { opacity:.35; cursor:default; }

        .bar { display:flex; gap:11px; align-items:center; flex-wrap:wrap; }
        .bar select { min-width:230px; border-radius:999px; padding:10px 16px; }
        .status { min-height:20px; font-size:12.5px; margin:13px 2px 22px; color:var(--ink-2); }
        .status.ok { color:#30d158; } .status.err { color:#ff453a; } .status.warn { color:#ffd60a; }

        .tabs { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 12px; }
        .tab {
          padding:9px 19px; border-radius:999px; cursor:pointer; font-size:13.5px; font-weight:520;
          background:rgba(255,255,255,0.11); box-shadow:inset 0 0 0 1px rgba(255,255,255,0.11);
          backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
          transition:background .16s ease, transform .12s ease;
        }
        .tab:hover { background:rgba(255,255,255,0.18); }
        .tab:active { transform:scale(0.97); }
        .tab.on { background:var(--accent); box-shadow:none; }
        .roombar { display:flex; gap:8px; align-items:center; margin:0 0 22px; flex-wrap:wrap; }

        /* Two columns packed in JS. Browser column balancing put tall cards in
           unpredictable places, so sections go to whichever column is shorter. */
        #pane { display:flex; gap:var(--gap); align-items:flex-start; }
        .col { flex:1 1 0; min-width:0; display:flex; flex-direction:column; gap:var(--gap); }
        @media (max-width:1080px) { #pane { flex-direction:column; } }

        .card {
          width:100%; box-sizing:border-box;
          background:
            linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(255,255,255,0.06) 44%, rgba(255,255,255,0.045));
          backdrop-filter:var(--g-blur); -webkit-backdrop-filter:var(--g-blur);
          box-shadow:var(--g-rim);
          border-radius:var(--r-xl); padding:6px 24px 20px;
        }
        .card > h2 {
          font-size:16px; font-weight:600; letter-spacing:-0.015em;
          margin:20px 0 8px; color:var(--ink);
        }

        .row {
          display:grid; grid-template-columns:minmax(120px,36%) 1fr; gap:14px; align-items:center;
          padding:12px 0; border-top:1px solid var(--hair);
        }
        .row:first-of-type { border-top:0; }
        .row label { color:var(--ink-2); font-size:13.5px; }
        .row input, .row select, .row textarea { width:100%; box-sizing:border-box; }
        .hint { color:var(--ink-3); font-size:11.5px; padding:2px 0 12px; }

        textarea {
          font-family:ui-monospace,"SF Mono",Menlo,monospace; font-size:12px;
          min-height:72px; resize:vertical; line-height:1.5;
        }

        /* Native datalist and select popups cannot be styled, so entity and icon
           fields use a real listbox instead. */
        .combo { position:relative; }
        .combo > input { width:100%; box-sizing:border-box; }

        /* Lives in #overlay, outside any card. A card's own backdrop-filter
           becomes the backdrop root for its descendants, which leaves a nested
           backdrop-filter with nothing to sample. */
        #overlay { position:fixed; inset:0; z-index:200; pointer-events:none; }
        /* macOS menu material: mostly transparent, heavy blur, and saturation
           pushed well past 100% so the backdrop's colour comes through rather
           than being flattened by a grey fill. */
        .combo-menu {
          position:fixed; pointer-events:auto;
          max-height:300px; overflow-y:auto; overscroll-behavior:contain;
          padding:6px; border-radius:14px;
          background:rgba(28,28,32,0.34);
          backdrop-filter:blur(64px) saturate(210%) brightness(1.06);
          -webkit-backdrop-filter:blur(64px) saturate(210%) brightness(1.06);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.16),
            inset 0 0 0 0.5px rgba(255,255,255,0.14),
            0 2px 6px rgba(0,0,0,0.16),
            0 18px 48px rgba(0,0,0,0.44);
        }
        :host(.is-light) .combo-menu {
          background:rgba(250,250,252,0.50);
          backdrop-filter:blur(64px) saturate(200%) brightness(1.02);
          -webkit-backdrop-filter:blur(64px) saturate(200%) brightness(1.02);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.70),
            inset 0 0 0 0.5px rgba(0,0,0,0.09),
            0 2px 6px rgba(0,0,0,0.08),
            0 18px 48px rgba(0,0,0,0.22);
        }
        .combo-opt {
          padding:6px 10px; border-radius:7px; cursor:default; font-size:13.5px;
          display:flex; align-items:center; gap:8px; color:var(--ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          line-height:1.4; letter-spacing:-0.005em;
        }
        :host(.is-light) .combo-opt { color:#1d1d1f; }
        .combo-opt.active { background:var(--accent); color:#fff; }
        :host(.is-light) .combo-opt.active { color:#fff; }
        .combo-opt .tick { width:12px; flex:0 0 12px; opacity:0; font-size:11px; }
        .combo-opt.sel .tick { opacity:.85; }
        .combo-sep { height:1px; margin:5px 8px; background:rgba(255,255,255,0.11); }
        :host(.is-light) .combo-sep { background:rgba(0,0,0,0.10); }
        .combo-empty { padding:6px 9px; color:var(--ink-3); font-size:12.5px; }

        .empty {
          text-align:center; padding:60px 34px; margin-bottom:var(--gap);
          background:linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(255,255,255,0.05));
          backdrop-filter:var(--g-blur); -webkit-backdrop-filter:var(--g-blur);
          box-shadow:var(--g-rim); border-radius:var(--r-xl);
        }
        .empty h2 { margin:0 0 10px; font-size:20px; font-weight:600; letter-spacing:-0.015em; }
        .empty p { margin:0 0 24px; color:var(--ink-2); font-size:13.5px; line-height:1.65; }

        .areas { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; margin:10px 0 18px; text-align:left; }
        .area {
          display:flex; align-items:center; gap:10px; font-size:13.5px; cursor:pointer;
          background:rgba(255,255,255,0.09); border-radius:var(--r-md); padding:12px 15px;
          box-shadow:inset 0 0 0 1px rgba(255,255,255,0.09);
          transition:background .16s ease;
        }
        .area:hover { background:rgba(255,255,255,0.15); }

        .shots { display:flex; gap:12px; padding:6px 0 14px; }
        .shot { flex:1; }
        .shot img {
          width:100%; height:124px; object-fit:cover; display:block; border-radius:var(--r-md);
          box-shadow:0 4px 16px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(255,255,255,0.10);
        }
        .shot .none {
          height:124px; border-radius:var(--r-md); display:grid; place-items:center;
          color:var(--ink-3); font-size:12px; background:rgba(0,0,0,0.30);
          box-shadow:inset 0 0 0 1px var(--hair);
        }
        .shot .cap { color:var(--ink-3); font-size:11.5px; margin-top:7px; }

        /* Glass on glass: nested surfaces sit brighter than the card. */
        .tile {
          border-radius:var(--r-lg); padding:13px 16px; margin:0;
          background:rgba(255,255,255,0.07);
          box-shadow:inset 0 0 0 1px rgba(255,255,255,0.09);
        }
        .tile.locked { opacity:.6; }
        .thead { display:flex; align-items:center; gap:9px; }
        .thead .grow { flex:1; font-size:13.5px; font-weight:560; }
        .thead .kind { color:var(--ink-3); font-size:11.5px; font-weight:400; margin-left:6px; }
        .mini {
          padding:6px 13px; font-size:12px; font-weight:530; border-radius:999px;
          background:rgba(255,255,255,0.13); color:var(--ink);
          box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12);
        }
        .mini:hover:not(:disabled) { background:rgba(255,255,255,0.20); filter:none; }
        .mini.danger { color:#ff453a; }
        .tbody { margin-top:6px; }
        .tbody .row { grid-template-columns:minmax(110px,30%) 1fr; padding:10px 0; }
        .addbar { display:flex; gap:10px; align-items:center; margin-top:15px; flex-wrap:wrap; }
        #tilespane { margin-top:var(--gap); }
        .tilegrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(330px,1fr)); gap:12px; }
        .addbar select { border-radius:999px; padding:9px 15px; }

        details { margin-top:4px; }
        summary { cursor:pointer; color:var(--ink-2); font-size:12.5px; padding:7px 2px; }
        #log {
          margin-top:10px; max-height:230px; overflow:auto;
          background:rgba(0,0,0,0.40); border-radius:var(--r-md); padding:14px 16px;
          box-shadow:inset 0 0 0 1px var(--hair);
          font-family:ui-monospace,"SF Mono",Menlo,monospace; font-size:12px; line-height:1.6;
        }
        .line { color:var(--ink-2); white-space:pre-wrap; }
        .line.ok { color:#30d158; } .line.err { color:#ff453a; } .line.warn { color:#ffd60a; }

        @media (max-width:900px) {
          .body { padding:18px; }
          .row { grid-template-columns:1fr; gap:7px; align-items:start; }
        }
      </style>
      <img class="bg" id="bg" alt="">
      <div class="bgtint"></div>
      <div class="top">
        <button class="burger" id="burger" title="Menu" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 7h16M4 12h16M4 17h16"/>
          </svg>
        </button>
        <h1>Hemma<span class="ver"></span></h1>
        <div class="spacer"></div>
      </div>
      <div class="body">
        <div class="bar">
          <select id="dash"></select>
          <button id="open" class="ghost">Open</button>
          <button id="create" class="ghost">Create dashboard</button>
          <button id="save" disabled>Save changes</button>
        </div>
        <div id="status" class="status"></div>
        <div id="rooms"></div>
        <div id="pane"></div>
        <div id="tilespane"></div>
        <details>
          <summary>Details</summary>
          <div id="log"></div>
        </details>
      </div>
      <div id="overlay"></div>`;

    this.shadowRoot.querySelector(".ver").textContent = "v" + PANEL_VERSION;
    this.$("burger").onclick = () =>
      this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
    this.$("open").onclick = () => {
      const p = this.$("dash").value;
      if (p) window.location.assign("/" + p);
    };
    this.$("create").onclick = () => this._createForm();
    this.$("save").onclick = () => this._save();
    this.$("dash").onchange = () => this._load();

    await this._refreshDashboards();
  }

  async _refreshDashboards(select) {
    const sel = this.$("dash");
    sel.innerHTML = "";
    let list = [];
    try {
      list = (await this._hass.callWS({ type: "lovelace/dashboards/list" }))
        .filter((d) => d.mode === "storage");
    } catch (e) {
      this._status("could not list dashboards: " + e.message, "err");
      return;
    }
    if (!list.length) {
      sel.innerHTML = "<option value=''>no dashboards yet</option>";
      this._firstRun();
      return;
    }
    list.forEach((d) => {
      const o = document.createElement("option");
      o.value = d.url_path; o.textContent = d.title;
      sel.appendChild(o);
    });
    if (select) sel.value = select;
    this._log(`${list.length} storage dashboard(s)`);
    await this._load();
  }

  _firstRun() {
    this.$("save").disabled = true;
    this.$("rooms").innerHTML = "";
    this.$("tilespane").innerHTML = "";
    this.$("pane").innerHTML = `
      <div class="empty">
        <h2>No dashboard yet</h2>
        <p>Create a Hemma dashboard and pick which rooms it should have.<br>
           You can add entities to each room afterwards.</p>
      </div>`;
  }

  // ── create ────────────────────────────────────────────────────────────────

  async _createForm() {
    this.$("save").disabled = true;
    this.$("rooms").innerHTML = "";
    this.$("tilespane").innerHTML = "";
    this._status("");
    let areas = [];
    try {
      areas = await this._hass.callWS({ type: "config/area_registry/list" });
    } catch (e) {
      this._status("could not read areas: " + e.message, "err");
    }

    this.$("pane").innerHTML = `
      <section class="card">
        <h2>New dashboard</h2>
        <div class="row"><label>Title</label><input id="c_title" value="Hemma"></div>
        <div class="row"><label>URL path</label><input id="c_path" value="hemma-dashboard"></div>
        <div class="hint">lowercase, must contain a hyphen</div>
      </section>
      <section class="card">
        <h2>Rooms</h2>
        <div class="hint">A Home overview room is always included.</div>
        <div class="areas" id="c_areas"></div>
        <div class="addbar">
          <button id="c_go">Create dashboard</button>
          <button id="c_cancel" class="ghost">Cancel</button>
        </div>
      </section>`;

    const box = this.$("c_areas");
    if (!areas.length) {
      box.innerHTML = "<div class='hint'>No areas found. Only the Home room will be created.</div>";
    }
    areas.forEach((a) => {
      const w = document.createElement("label");
      w.className = "area";
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = true; cb.dataset.name = a.name;
      w.appendChild(cb);
      w.appendChild(document.createTextNode(a.name));
      box.appendChild(w);
    });

    this.$("c_cancel").onclick = () => this._load();
    this.$("c_go").onclick = () => this._create();
  }

  async _create() {
    const title = this.$("c_title").value.trim() || "Hemma";
    const url_path = this.$("c_path").value.trim();
    if (!/^[a-z0-9-]+$/.test(url_path) || !url_path.includes("-")) {
      return this._status("URL path must be lowercase, and must contain a hyphen", "err");
    }

    const picked = [...this.shadowRoot.querySelectorAll("#c_areas input:checked")]
      .map((cb) => cb.dataset.name);

    this.$("c_go").disabled = true;
    this._status("creating...");

    try {
      const bundle = await this._bundleOnce();
      this._log(`templates bundle: ${Object.keys(bundle.templates).length} templates`);

      const rooms = [blankRoom("Home", "home", "home-demo")];
      picked.forEach((name) => rooms.push(blankRoom(name, slug(name), "home-demo")));

      const images = rooms.map((r) => r.variables.image);
      rooms.forEach((r) => { r.variables.preload_rooms = images.slice(); });

      const built = expandConfig({ rooms }, bundle.scaffold, {}, bundle.templates);

      // Applied to the whole config so the copy inside hemma_room is caught too.
      const fixed = retargetRoutes(built, url_path, rooms);
      const config = fixed.config;
      this._log(`rewrote ${fixed.rewritten} navigation route list(s)`);
      if (!fixed.rewritten) this._log("no routes list found - nav links may point elsewhere", "warn");

      await this._hass.callWS({
        type: "lovelace/dashboards/create",
        url_path,
        title,
        icon: "mdi:home-heart",
        show_in_sidebar: true,
        require_admin: false,
      });
      this._log(`created dashboard "${url_path}"`, "ok");

      await this._hass.callWS({ type: "lovelace/config/save", url_path, config });
      this._log(`wrote config  ${JSON.stringify(config).length.toLocaleString()} bytes`, "ok");

      this._status(`Created "${title}" with ${rooms.length} room(s). Click Open to view it.`, "ok");
      await this._refreshDashboards(url_path);
    } catch (e) {
      this._status("create failed: " + e.message, "err");
      this._log("create failed: " + e.message, "err");
      this.$("c_go").disabled = false;
    }
  }

  // ── load / save ───────────────────────────────────────────────────────────

  async _load() {
    const url_path = this.$("dash").value;
    if (!url_path) return;
    this._clearLog();
    this._status("");
    try {
      const cfg = await this._hass.callWS({ type: "lovelace/config", url_path });
      this._raw = cfg;
      this._state = extractConfig(cfg);
      this._room = 0;
      this._log(`loaded "${url_path}"  ${JSON.stringify(cfg).length.toLocaleString()} bytes`);
      this._state.warnings.forEach((w) => this._log("warn: " + w, "warn"));

      if (!this._state.compact.rooms.length) {
        this._state = null;
        this.$("save").disabled = true;
        this._status("Not a Hemma dashboard.", "warn");
        this.$("rooms").innerHTML = "";
        this.$("tilespane").innerHTML = "";
        this.$("pane").innerHTML = `
          <div class="empty">
            <h2>Not a Hemma dashboard</h2>
            <p>Pick a Hemma dashboard above, or create a new one.</p>
          </div>`;
        return;
      }

      // Regenerating must reproduce the file exactly before any edit is allowed.
      const rebuilt = expandConfig(this._state.compact, this._state.scaffold,
                                   this._state.extras, this._state.templates);
      const safe = stable(rebuilt) === stable(cfg);
      this._log(`round trip check: ${safe ? "identical" : "DIFFERS"}`, safe ? "ok" : "err");

      if (!safe) {
        this.$("save").disabled = true;
        this._status("This dashboard has content the editor would not preserve. Saving is disabled.", "err");
        (cfg.views || []).forEach((v, i) => {
          if (stable(v) !== stable((rebuilt.views || [])[i])) this._log(`  view[${i}] "${v.path}" differs`, "err");
        });
      } else {
        this.$("save").disabled = false;
        const n = this._state.compact.rooms.length;
        this._status(`${n} room${n === 1 ? "" : "s"}`, "");
      }

      this._renderTabs();
      this._renderForm();
    } catch (e) {
      this._status("load failed: " + e.message, "err");
      this._log("load failed: " + e.message, "err");
    }
  }

  async _save() {
    const s = this._state;
    if (!s) return;
    const url_path = this.$("dash").value;
    const built = expandConfig(s.compact, s.scaffold, s.extras, s.templates);

    // Nav routes are derived from the rooms, so re-deriving them on every save
    // repairs dashboards written before the whole-config retarget existed.
    const fixed = retargetRoutes(built, url_path, s.compact.rooms);
    const cfg = fixed.config;
    const stale = (JSON.stringify(built).match(/\/dashboard-hemma\//g) || []).length;
    if (stale) this._log(`repaired ${stale} navigation link(s) pointing elsewhere`, "warn");

    this.$("save").disabled = true;
    try {
      await this._hass.callWS({ type: "lovelace/config/save", url_path, config: cfg });
      this._raw = clone(cfg);
      this._status("Saved", "ok");
      this._log(`saved  ${JSON.stringify(cfg).length.toLocaleString()} bytes`, "ok");
    } catch (e) {
      this._status("save failed: " + e.message, "err");
      this._log("save failed: " + e.message, "err");
    }
    this.$("save").disabled = false;
  }

  // ── forms ─────────────────────────────────────────────────────────────────

  _renderTabs() {
    const el = document.createElement("div");
    el.className = "tabs";
    this._state.compact.rooms.forEach((r, i) => {
      const t = document.createElement("div");
      t.className = "tab" + (i === this._room ? " on" : "");
      t.textContent = r.name || r.path;
      t.onclick = () => { this._room = i; this._renderTabs(); this._renderForm(); };
      el.appendChild(t);
    });
    const pane = this.$("rooms");
    const old = pane.querySelector(".tabs");
    if (old) old.replaceWith(el); else pane.prepend(el);

    const bar = document.createElement("div");
    bar.className = "roombar";
    const mk = (label, fn, danger) => {
      const b = document.createElement("button");
      b.className = "mini" + (danger ? " danger" : "");
      b.textContent = label;
      b.onclick = fn;
      return b;
    };
    const rooms = this._state.compact.rooms;
    const move = (d) => {
      const j = this._room + d;
      if (j < 0 || j >= rooms.length) return;
      const [x] = rooms.splice(this._room, 1);
      rooms.splice(j, 0, x);
      this._room = j;
      this._renderTabs(); this._renderForm();
    };
    bar.appendChild(mk("Add room", () => {
      const name = prompt("Room name");
      if (!name || !name.trim()) return;
      const path = slug(name);
      if (rooms.some((r) => r.path === path)) return this._status(`a room with path "${path}" already exists`, "err");
      rooms.push(blankRoom(name.trim(), path, "home-demo"));
      this._room = rooms.length - 1;
      this._renderTabs(); this._renderForm();
    }));
    bar.appendChild(mk("\u2190", () => move(-1)));
    bar.appendChild(mk("\u2192", () => move(1)));
    bar.appendChild(mk("Delete room", () => {
      const r = rooms[this._room];
      if (rooms.length < 2) return this._status("a dashboard needs at least one room", "err");
      if (!confirm(`Delete "${r.name || r.path}" and everything in it?`)) return;
      rooms.splice(this._room, 1);
      this._room = Math.max(0, this._room - 1);
      this._renderTabs(); this._renderForm();
    }, true));

    const oldBar = pane.querySelector(".roombar");
    if (oldBar) oldBar.replaceWith(bar); else el.after(bar);
  }

  _renderForm() {
    const room = this._state && this._state.compact.rooms[this._room];
    if (!room) return;
    const pane = this.$("pane");
    pane.innerHTML = "";
    this._setBackdrop();
    const ids = Object.keys(this._hass.states);

    const colA = document.createElement("div"); colA.className = "col";
    const colB = document.createElement("div"); colB.className = "col";
    pane.appendChild(colA); pane.appendChild(colB);

    // Assign the tallest sections first so the columns come out even, then put
    // each column back into declaration order so it still reads top to bottom.
    const weigh = (sec) => sec.fields.length
      + (sec.fields.some((f) => f.type === "image") ? 7 : 0)
      + sec.fields.filter((f) => f.type === "list").length * 2;
    const side = new Map();
    let wA = 0, wB = 0;
    SECTIONS.map((sec, i) => ({ sec, i, w: weigh(sec) }))
      .sort((a, b) => b.w - a.w || a.i - b.i)
      .forEach(({ sec, w }) => {
        if (wA <= wB) { side.set(sec, colA); wA += w; }
        else { side.set(sec, colB); wB += w; }
      });

    SECTIONS.forEach((sec) => {
      const fs = document.createElement("section");
      fs.className = "card";
      fs.innerHTML = `<h2>${sec.label}</h2>`;
      sec.fields.forEach((f) => {
        const row = document.createElement("div");
        row.className = "row";
        const lab = document.createElement("label");
        lab.textContent = f.label;
        row.appendChild(lab);

        const cur = f.key === "__name" ? (room.name ?? "") : (room.variables[f.key] ?? "");
        let input;

        if (f.type === "image") {
          this._imageField(room, row, fs, pane);
          return;
        }

        if (f.type === "list") {
          input = document.createElement("textarea");
          input.value = Array.isArray(cur) ? cur.join("\n") : (cur ? String(cur) : "");
          input.placeholder = "one entity id per line";
          input.onchange = () => {
            const items = input.value.split("\n").map((x) => x.trim()).filter(Boolean);
            if (items.length) room.variables[f.key] = items;
            else delete room.variables[f.key];
          };
          row.appendChild(input);
          fs.appendChild(row);
          return;
        }

        if (f.type === "bool") {
          input = document.createElement("select");
          [["", "(default)"], ["true", "yes"], ["false", "no"]].forEach(([v, t]) => {
            const o = document.createElement("option"); o.value = v; o.textContent = t; input.appendChild(o);
          });
          input.value = cur === "" || cur === undefined ? "" : String(cur);
          input.onchange = () => {
            const raw = input.value;
            if (raw === "") delete room.variables[f.key];
            else room.variables[f.key] = raw === "true";
          };
          row.appendChild(input);
          fs.appendChild(row);
          return;
        }

        if (f.type === "select") {
          input = document.createElement("select");
          f.options.forEach((o) => {
            const op = document.createElement("option");
            op.value = o; op.textContent = o === "" ? "(default)" : o;
            input.appendChild(op);
          });
          input.value = String(cur);
        } else if (f.domains) {
          const c = this._combo(cur, this._entityList(f.domains),
            f.domains.map((d) => d + ".").join(" / "),
            (v) => { if (v === "") delete room.variables[f.key]; else room.variables[f.key] = v; });
          row.appendChild(c.wrap);
          fs.appendChild(row);
          return;
        } else {
          input = document.createElement("input");
          input.value = String(cur);
        }

        input.onchange = () => {
          const v = input.value.trim();
          if (f.key === "__name") { room.name = v; return; }
          if (v === "") delete room.variables[f.key];
          else room.variables[f.key] = v;
        };

        row.appendChild(input);
        fs.appendChild(row);
        if (f.hint) {
          const h = document.createElement("div");
          h.className = "hint"; h.textContent = f.hint;
          fs.appendChild(h);
        }
      });
      (side.get(sec) || colA).appendChild(fs);
    });

    this._renderTiles(room, this.$("tilespane"));
  }

  // ── combobox ──────────────────────────────────────────────────────────────

  _combo(value, list, placeholder, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "combo";
    const input = document.createElement("input");
    input.value = value == null ? "" : String(value);
    if (placeholder) input.placeholder = placeholder;
    const menu = document.createElement("div");
    menu.className = "combo-menu";
    wrap.appendChild(input);

    let shown = [];
    let active = -1;
    let current = input.value;

    const close = () => {
      if (menu.parentNode) menu.parentNode.removeChild(menu);
      active = -1;
      if (this._openCombo === close) this._openCombo = null;
    };

    const place = () => {
      const r = input.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const drop = below >= 180 || below >= above;
      menu.style.left = r.left + "px";
      menu.style.width = r.width + "px";
      menu.style.maxHeight = Math.max(120, Math.min(300, drop ? below : above)) + "px";
      if (drop) { menu.style.top = r.bottom + 5 + "px"; menu.style.bottom = "auto"; }
      else { menu.style.bottom = window.innerHeight - r.top + 5 + "px"; menu.style.top = "auto"; }
    };

    const commit = (v) => {
      current = v;
      input.value = v;
      onChange(v);
      close();
    };

    const paint = () => {
      [...menu.children].forEach((el, i) => {
        if (el.classList.contains("combo-opt")) el.classList.toggle("active", i === active);
      });
      if (active >= 0 && menu.children[active]) {
        menu.children[active].scrollIntoView({ block: "nearest" });
      }
    };

    const open = () => {
      const q = input.value.trim().toLowerCase();
      shown = list.filter((o) => !q || o.toLowerCase().includes(q));
      menu.innerHTML = "";

      if (!shown.length) {
        const e = document.createElement("div");
        e.className = "combo-empty";
        e.textContent = "No match";
        menu.appendChild(e);
        if (this._openCombo && this._openCombo !== close) this._openCombo();
        this._openCombo = close;
        if (!menu.parentNode) this.$("overlay").appendChild(menu);
        place();
        active = -1;
        return;
      }

      shown.slice(0, 300).forEach((o) => {
        const d = document.createElement("div");
        d.className = "combo-opt" + (o === current ? " sel" : "");
        const tick = document.createElement("span");
        tick.className = "tick";
        tick.textContent = "\u2713";
        const label = document.createElement("span");
        label.textContent = o;
        d.appendChild(tick);
        d.appendChild(label);
        // mousedown, because blur would close the menu before a click lands.
        d.onmousedown = (ev) => { ev.preventDefault(); commit(o); };
        d.onmouseenter = () => { active = [...menu.children].indexOf(d); paint(); };
        menu.appendChild(d);
      });

      active = shown.indexOf(current);
      if (this._openCombo && this._openCombo !== close) this._openCombo();
      this._openCombo = close;
      if (!menu.parentNode) this.$("overlay").appendChild(menu);
      place();
      paint();
    };

    input.onfocus = open;
    input.oninput = () => { open(); active = -1; paint(); };
    input.onblur = () => { setTimeout(close, 120); if (input.value.trim() !== current) commit(input.value.trim()); };

    input.onkeydown = (ev) => {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        if (!menu.classList.contains("open")) open();
        if (!shown.length) return;
        active += ev.key === "ArrowDown" ? 1 : -1;
        if (active < 0) active = Math.min(shown.length, 300) - 1;
        if (active >= Math.min(shown.length, 300)) active = 0;
        paint();
      } else if (ev.key === "Enter") {
        if (menu.classList.contains("open") && active >= 0 && shown[active]) {
          ev.preventDefault();
          commit(shown[active]);
        }
      } else if (ev.key === "Escape") {
        close();
      }
    };

    // A fixed menu would drift away from its input, so dismiss on scroll.
    const dismiss = () => { if (menu.parentNode) close(); };
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);

    return { wrap, input };
  }

  _entityList(domains) {
    return Object.keys(this._hass.states)
      .filter((e) => domains.includes(e.split(".")[0]))
      .sort();
  }

  // ── room images ───────────────────────────────────────────────────────────

  // Pinned to the dashboard's primary room so it does not shift while you work.
  _setBackdrop() {
    const bg = this.$("bg");
    if (!bg) return;
    const rooms = (this._state && this._state.compact.rooms) || [];
    const home = rooms.find((r) => r.path === "home") || rooms[0];
    const found = (this._imgs || []).find((i) => i.name === (home && home.variables.image));
    const url = found && found.day;
    if (!url) { bg.classList.remove("on"); return; }
    if (bg.dataset.src === url) { bg.classList.add("on"); return; }
    bg.dataset.src = url;
    bg.classList.remove("on");
    bg.onload = () => bg.classList.add("on");
    bg.src = url;
  }


  async _images(force) {
    if (this._imgs && !force) return this._imgs;
    const res = await this._hass.fetchWithAuth
      ? await this._hass.fetchWithAuth("/api/hemma/images")
      : await fetch("/api/hemma/images");
    if (!res.ok) throw new Error(`images ${res.status}`);
    const data = await res.json();
    this._imgs = data.images || [];
    this._imgsLoaded = true;
    return this._imgs;
  }

  _imageField(room, row, fs, pane) {
    const sel = document.createElement("select");
    row.appendChild(sel);
    fs.appendChild(row);

    const shots = document.createElement("div");
    shots.className = "shots";
    fs.appendChild(shots);

    const upRow = document.createElement("div");
    upRow.className = "addbar";
    fs.appendChild(upRow);

    const preview = () => {
      const chosen = (this._imgs || []).find((i) => i.name === room.variables.image);
      shots.innerHTML = "";
      [["Day", chosen && chosen.day], ["Night", chosen && chosen.night]].forEach(([label, url]) => {
        const w = document.createElement("div");
        w.className = "shot";
        w.innerHTML = url
          ? `<img src="${url}" alt=""><div class="cap">${label}</div>`
          : `<div class="none">no ${label.toLowerCase()} image</div><div class="cap">${label}</div>`;
        shots.appendChild(w);
      });
    };

    const fill = () => {
      sel.innerHTML = "";
      const list = this._imgs || [];
      if (!list.some((i) => i.name === room.variables.image) && room.variables.image) {
        const o = document.createElement("option");
        o.value = room.variables.image;
        // Only call it missing once we know what is actually on disk.
        o.textContent = room.variables.image + (this._imgsLoaded ? "  (not on disk)" : "");
        sel.appendChild(o);
      }
      list.forEach((i) => {
        const o = document.createElement("option");
        o.value = i.name;
        o.textContent = i.name + (i.night ? "" : "  (no night image)");
        sel.appendChild(o);
      });
      sel.value = room.variables.image || "";
      preview();
    };

    sel.onchange = () => { room.variables.image = sel.value; preview(); this._setBackdrop(); };

    const file = document.createElement("input");
    file.type = "file";
    file.accept = ".jpg,.jpeg,.png,.webp";
    file.style.maxWidth = "230px";
    const variant = document.createElement("select");
    [["day", "Day"], ["night", "Night"]].forEach(([v, t]) => {
      const o = document.createElement("option"); o.value = v; o.textContent = t; variant.appendChild(o);
    });
    const up = document.createElement("button");
    up.className = "mini";
    up.textContent = "Upload";
    up.onclick = async () => {
      if (!file.files || !file.files[0]) return this._status("choose a file first", "err");
      const name = (prompt("Image name (lowercase, no extension)", room.variables.image || slug(room.name)) || "").trim();
      if (!name) return;
      const body = new FormData();
      body.append("name", name);
      body.append("variant", variant.value);
      body.append("file", file.files[0]);
      up.disabled = true;
      this._status("uploading...");
      try {
        const res = this._hass.fetchWithAuth
          ? await this._hass.fetchWithAuth("/api/hemma/images", { method: "POST", body })
          : await fetch("/api/hemma/images", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || res.status);
        this._imgs = data.images || [];
        room.variables.image = name;
        this._status(`uploaded ${name} (${variant.value})`, "ok");
        this._log(`uploaded ${name} ${variant.value}`, "ok");
        fill();
      } catch (e) {
        this._status("upload failed: " + e.message, "err");
        this._log("upload failed: " + e.message, "err");
      }
      up.disabled = false;
    };
    upRow.appendChild(file);
    upRow.appendChild(variant);
    upRow.appendChild(up);

    fill();
    this._images()
      .then(() => { fill(); this._setBackdrop(); })
      .catch((e) => {
        this._log("could not list images: " + e.message, "warn");
        this._status("Image list unavailable. Restart Home Assistant to load the Hemma image endpoint.", "warn");
      });
  }

  // ── tiles ─────────────────────────────────────────────────────────────────

  _renderTiles(room, pane) {
    pane.innerHTML = "";
    const fs = document.createElement("section");
    fs.className = "card";
    fs.innerHTML = "<h2>Tiles</h2>";

    if (!room.tiles.length) {
      const e = document.createElement("div");
      e.className = "hint";
      e.textContent = "No tiles yet. Add one below.";
      fs.appendChild(e);
    }

    const grid = document.createElement("div");
    grid.className = "tilegrid";
    room.tiles.forEach((tile, i) => grid.appendChild(this._tileCard(room, tile, i, pane)));
    fs.appendChild(grid);

    const bar = document.createElement("div");
    bar.className = "addbar";
    const sel = document.createElement("select");
    TILE_TYPES.forEach((t) => {
      const o = document.createElement("option");
      o.value = t.id; o.textContent = t.label;
      sel.appendChild(o);
    });
    const add = document.createElement("button");
    add.className = "mini";
    add.textContent = "Add tile";
    add.onclick = () => {
      const type = TILE_TYPES.find((t) => t.id === sel.value);
      if (!type) return;
      room.tiles.push(newTile(type));
      this._renderForm();
    };
    bar.appendChild(sel);
    bar.appendChild(add);
    fs.appendChild(bar);

    pane.appendChild(fs);
  }

  _tileCard(room, tile, i, pane) {
    const type = tileTypeOf(tile);
    const box = document.createElement("div");
    box.className = "tile" + (type ? "" : " locked");

    const head = document.createElement("div");
    head.className = "thead";
    const title = document.createElement("div");
    title.className = "grow";
    title.innerHTML = `${tile.name || "(unnamed)"} <span class="kind">${type ? type.label : tileLabel(tile) + " - not editable here"}</span>`;
    head.appendChild(title);

    const mk = (label, fn, danger) => {
      const b = document.createElement("button");
      b.className = "mini" + (danger ? " danger" : "");
      b.textContent = label;
      b.onclick = fn;
      return b;
    };
    const move = (d) => {
      const j = i + d;
      if (j < 0 || j >= room.tiles.length) return;
      const [x] = room.tiles.splice(i, 1);
      room.tiles.splice(j, 0, x);
      this._renderForm();
    };
    head.appendChild(mk("\u2191", () => move(-1)));
    head.appendChild(mk("\u2193", () => move(1)));
    head.appendChild(mk("Remove", () => { room.tiles.splice(i, 1); this._renderForm(); }, true));
    box.appendChild(head);

    if (!type) return box;

    const body = document.createElement("div");
    body.className = "tbody";

    const addRow = (label, input) => {
      const r = document.createElement("div");
      r.className = "row";
      const l = document.createElement("label");
      l.textContent = label;
      r.appendChild(l); r.appendChild(input);
      body.appendChild(r);
    };

    const nameIn = document.createElement("input");
    nameIn.value = tile.name || "";
    nameIn.onchange = () => { tile.name = nameIn.value.trim(); title.firstChild.textContent = (tile.name || "(unnamed)") + " "; };
    addRow("Name", nameIn);

    const entCombo = this._combo(tile.entity || "", this._entityList(type.domains),
      type.domains.map((d) => d + ".").join(" / "),
      (v) => { tile.entity = v; });
    addRow("Entity", entCombo.wrap);

    type.fields.forEach((f) => {
      const cur = (tile.variables || {})[f.key];
      let input;

      if (f.type === "list") {
        input = document.createElement("textarea");
        input.value = Array.isArray(cur) ? cur.join("\n") : (cur ? String(cur) : "");
        input.placeholder = "one entity id per line";
        input.onchange = () => {
          const items = input.value.split("\n").map((x) => x.trim()).filter(Boolean);
          if (items.length) { if (!tile.variables) tile.variables = {}; tile.variables[f.key] = items; }
          else if (tile.variables) delete tile.variables[f.key];
        };
        addRow(f.label, input);
        return;
      }

      if (f.type === "bool") {
        input = document.createElement("select");
        [["", "(default)"], ["true", "yes"], ["false", "no"]].forEach(([v, t]) => {
          const o = document.createElement("option"); o.value = v; o.textContent = t; input.appendChild(o);
        });
        input.value = cur === undefined ? "" : String(cur);
      } else {
        const set = (v) => {
          if (v === "") {
            if (tile.variables) delete tile.variables[f.key];
            if (tile.variables && !Object.keys(tile.variables).length) delete tile.variables;
            return;
          }
          if (!tile.variables) tile.variables = {};
          tile.variables[f.key] = v;
        };
        if (f.type === "icon") {
          addRow(f.label, this._combo(cur, HEMMA_ICONS, "hemma icon name", set).wrap);
          return;
        }
        if (f.domains) {
          addRow(f.label, this._combo(cur, this._entityList(f.domains),
            f.domains.map((d) => d + ".").join(" / "), set).wrap);
          return;
        }
        input = document.createElement("input");
        input.value = cur === undefined ? "" : String(cur);
      }

      input.onchange = () => {
        const raw = input.value.trim();
        if (raw === "") {
          if (tile.variables) delete tile.variables[f.key];
          if (tile.variables && !Object.keys(tile.variables).length) delete tile.variables;
          return;
        }
        if (!tile.variables) tile.variables = {};
        tile.variables[f.key] = f.type === "bool" ? raw === "true" : raw;
      };

      addRow(f.label, input);
    });

    box.appendChild(body);
    return box;
  }
}

customElements.define("hemma-panel", HemmaPanel);

console.info(`%c HEMMA-PANEL %c v${PANEL_VERSION} `, "background:#222;color:#8ecdf7;font-weight:700", "background:#8ecdf7;color:#222;font-weight:700");
