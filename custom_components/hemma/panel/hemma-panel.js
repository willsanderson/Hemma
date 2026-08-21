// Hemma config panel.
// Generator and form schema carried over verbatim from the tested slice.

const PANEL_VERSION = "0.6.0";
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
      { key: "image", label: "Background image", type: "text", hint: "filename in www/hemma/rooms, no extension" },
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
];

const tileTypeOf = (tile) =>
  typeof tile.template === "string"
    ? TILE_TYPES.find((t) => t.template === tile.template) || null
    : null;

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
        :host { display:block; min-height:100%; background:var(--primary-background-color,#111);
                color:var(--primary-text-color,#f2f2f7);
                font-family:system-ui,-apple-system,sans-serif; font-size:14px; }
        .top { display:flex; align-items:center; gap:12px; height:56px; padding:0 16px;
               background:var(--app-header-background-color,#1c1c1e);
               color:var(--app-header-text-color,#fff); box-sizing:border-box; }
        .top h1 { font-size:19px; font-weight:500; margin:0; flex:1; }
        .ver { font-size:11px; opacity:.5; font-weight:400; margin-left:4px; }
        .burger { background:none; border:0; color:inherit; font-size:22px; cursor:pointer;
                  padding:4px 8px; line-height:1; border-radius:8px; }
        .body { padding:24px 20px 60px; max-width:860px; margin:0 auto; box-sizing:border-box; }
        select, input, button { font:inherit; border-radius:9px; border:1px solid #3a3a3c;
                background:#2c2c2e; color:#f2f2f7; padding:9px 12px; }
        button { cursor:pointer; border-color:#0a84ff; background:#0a84ff; font-weight:600; }
        button.ghost { background:#2c2c2e; border-color:#3a3a3c; font-weight:500; }
        button:disabled { opacity:.4; cursor:default; }
        .bar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:6px; }
        .bar select { min-width:220px; }
        .status { min-height:18px; font-size:12.5px; margin:8px 0 16px; color:#8e8e93; }
        .status.ok { color:#30d158; } .status.err { color:#ff453a; } .status.warn { color:#ffd60a; }
        .tabs { display:flex; gap:6px; flex-wrap:wrap; margin:6px 0 16px; }
        .tab { padding:7px 14px; border-radius:999px; background:#2c2c2e; cursor:pointer;
               border:1px solid #3a3a3c; font-size:13px; }
        .tab.on { background:#0a84ff; border-color:#0a84ff; }
        fieldset { border:1px solid #3a3a3c; border-radius:12px; padding:12px 16px; margin:0 0 14px; }
        legend { padding:0 6px; color:#8e8e93; font-size:12px; text-transform:uppercase; letter-spacing:.06em; }
        .row { display:grid; grid-template-columns:190px 1fr; gap:12px; align-items:center; margin:8px 0; }
        .row label { color:#c7c7cc; font-size:13px; }
        .row input, .row select { width:100%; box-sizing:border-box; }
        .hint { grid-column:2; color:#636366; font-size:11px; margin-top:-5px; }
        .tile { border:1px solid #3a3a3c; border-radius:10px; padding:10px 12px; margin:8px 0;
                background:#242426; }
        .tile.locked { opacity:.72; }
        .thead { display:flex; align-items:center; gap:10px; }
        .thead .grow { flex:1; font-size:13px; }
        .thead .kind { color:#8e8e93; font-size:11.5px; }
        .mini { padding:4px 9px; font-size:12px; font-weight:500; background:#2c2c2e;
                border-color:#3a3a3c; border-radius:7px; }
        .mini.danger { color:#ff453a; }
        .tbody { margin-top:8px; }
        .tbody .row { grid-template-columns:150px 1fr; margin:6px 0; }
        .addbar { display:flex; gap:8px; align-items:center; margin-top:12px; flex-wrap:wrap; }
        .empty { border:1px dashed #3a3a3c; border-radius:14px; padding:36px 28px; text-align:center; }
        .empty h2 { margin:0 0 8px; font-size:18px; font-weight:600; }
        .empty p { margin:0 0 20px; color:#8e8e93; font-size:13.5px; line-height:1.6; }
        .areas { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:8px;
                 margin:14px 0 18px; text-align:left; }
        .area { display:flex; align-items:center; gap:9px; background:#2c2c2e; border:1px solid #3a3a3c;
                border-radius:10px; padding:9px 12px; font-size:13px; }
        details { margin-top:22px; }
        summary { cursor:pointer; color:#8e8e93; font-size:12.5px; }
        #log { margin-top:10px; max-height:220px; overflow:auto; background:#000; border-radius:10px;
               padding:12px 14px; font-family:ui-monospace,Menlo,monospace; font-size:12px; line-height:1.55; }
        .line.ok { color:#30d158; } .line.err { color:#ff453a; } .line.warn { color:#ffd60a; }
        .line { color:#8e8e93; white-space:pre-wrap; }
      </style>
      <div class="top">
        <button class="burger" id="burger" title="Menu">&#9776;</button>
        <h1>Hemma <span class="ver"></span></h1>
      </div>
      <div class="body">
        <div class="bar">
          <select id="dash"></select>
          <button id="open" class="ghost">Open</button>
          <button id="create" class="ghost">Create dashboard</button>
          <button id="save" disabled>Save changes</button>
        </div>
        <div id="status" class="status"></div>
        <div id="pane"></div>
        <details>
          <summary>Details</summary>
          <div id="log"></div>
        </details>
      </div>`;

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
    this._status("");
    let areas = [];
    try {
      areas = await this._hass.callWS({ type: "config/area_registry/list" });
    } catch (e) {
      this._status("could not read areas: " + e.message, "err");
    }

    this.$("pane").innerHTML = `
      <fieldset>
        <legend>New dashboard</legend>
        <div class="row"><label>Title</label><input id="c_title" value="Hemma"></div>
        <div class="row"><label>URL path</label><input id="c_path" value="hemma-dashboard"></div>
        <div class="hint">lowercase, must contain a hyphen</div>
      </fieldset>
      <fieldset>
        <legend>Rooms</legend>
        <div class="areas" id="c_areas"></div>
        <button id="c_go">Create dashboard</button>
        <button id="c_cancel" class="ghost">Cancel</button>
        <div class="hint" style="grid-column:1">A Home overview room is always included.</div>
      </fieldset>`;

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
    const pane = this.$("pane");
    const old = pane.querySelector(".tabs");
    if (old) old.replaceWith(el); else pane.prepend(el);
  }

  _renderForm() {
    const room = this._state && this._state.compact.rooms[this._room];
    if (!room) return;
    const pane = this.$("pane");
    pane.querySelectorAll("fieldset, datalist, .empty").forEach((n) => n.remove());
    const ids = Object.keys(this._hass.states);

    SECTIONS.forEach((sec) => {
      const fs = document.createElement("fieldset");
      fs.innerHTML = `<legend>${sec.label}</legend>`;
      sec.fields.forEach((f) => {
        const row = document.createElement("div");
        row.className = "row";
        const lab = document.createElement("label");
        lab.textContent = f.label;
        row.appendChild(lab);

        const cur = f.key === "__name" ? (room.name ?? "") : (room.variables[f.key] ?? "");
        let input;

        if (f.type === "select") {
          input = document.createElement("select");
          f.options.forEach((o) => {
            const op = document.createElement("option");
            op.value = o; op.textContent = o === "" ? "(default)" : o;
            input.appendChild(op);
          });
          input.value = String(cur);
        } else {
          input = document.createElement("input");
          input.value = String(cur);
          if (f.domains) {
            const listId = "dl-" + f.key;
            let dl = this.shadowRoot.getElementById(listId);
            if (!dl) {
              dl = document.createElement("datalist");
              dl.id = listId;
              ids.filter((e) => f.domains.includes(e.split(".")[0])).sort()
                 .forEach((e) => { const o = document.createElement("option"); o.value = e; dl.appendChild(o); });
              pane.appendChild(dl);
            }
            input.setAttribute("list", listId);
            input.placeholder = f.domains.map((d) => d + ".").join(" / ");
          }
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
      pane.appendChild(fs);
    });

    this._renderTiles(room, pane);
  }

  // ── tiles ─────────────────────────────────────────────────────────────────

  _datalist(id, values, host) {
    let dl = this.shadowRoot.getElementById(id);
    if (dl) return id;
    dl = document.createElement("datalist");
    dl.id = id;
    values.forEach((v) => { const o = document.createElement("option"); o.value = v; dl.appendChild(o); });
    host.appendChild(dl);
    return id;
  }

  _renderTiles(room, pane) {
    const fs = document.createElement("fieldset");
    fs.innerHTML = "<legend>Tiles</legend>";

    if (!room.tiles.length) {
      const e = document.createElement("div");
      e.className = "hint";
      e.style.gridColumn = "1";
      e.textContent = "No tiles yet. Add one below.";
      fs.appendChild(e);
    }

    room.tiles.forEach((tile, i) => fs.appendChild(this._tileCard(room, tile, i, pane)));

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

    const entIn = document.createElement("input");
    entIn.value = tile.entity || "";
    entIn.placeholder = type.domains.map((d) => d + ".").join(" / ");
    entIn.setAttribute("list", this._datalist("dl-tile-" + type.id,
      Object.keys(this._hass.states).filter((e) => type.domains.includes(e.split(".")[0])).sort(), pane));
    entIn.onchange = () => { tile.entity = entIn.value.trim(); };
    addRow("Entity", entIn);

    type.fields.forEach((f) => {
      const cur = (tile.variables || {})[f.key];
      let input;

      if (f.type === "bool") {
        input = document.createElement("select");
        [["", "(default)"], ["true", "yes"], ["false", "no"]].forEach(([v, t]) => {
          const o = document.createElement("option"); o.value = v; o.textContent = t; input.appendChild(o);
        });
        input.value = cur === undefined ? "" : String(cur);
      } else {
        input = document.createElement("input");
        input.value = cur === undefined ? "" : String(cur);
        if (f.type === "icon") {
          input.setAttribute("list", this._datalist("dl-icons", HEMMA_ICONS, pane));
          input.placeholder = "hemma icon name";
        } else if (f.domains) {
          input.setAttribute("list", this._datalist("dl-tf-" + f.key,
            Object.keys(this._hass.states).filter((e) => f.domains.includes(e.split(".")[0])).sort(), pane));
          input.placeholder = f.domains.map((d) => d + ".").join(" / ");
        }
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
