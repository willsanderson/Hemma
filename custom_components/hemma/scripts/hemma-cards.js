// Hemma's own cards, built on the home-wide settings the integration stores (hemma/home/*).
(function () {
  if (window._hemmaCards) return;
  window._hemmaCards = true;

  const T = (k, en, v) => (window._hemmaT ? window._hemmaT(k, en, v) : String(en).replace(/\{(\w+)\}/g, (m, p) => (v && p in v ? v[p] : m)));
  // Material Design Icons come from Home Assistant's own /static/mdi files, cropped to their 20px drawing area.
  const mdi = window.hemmaMdi = window.hemmaMdi || { paths: {}, files: {}, meta: null };
  mdi.load = mdi.load || function (n) {
    if (n in mdi.paths) return Promise.resolve(mdi.paths[n]);
    mdi.meta = mdi.meta || fetch('/static/mdi/iconMetadata.json').then((r) => r.json()).catch(() => ({ parts: [] }));
    return mdi.meta.then((m) => {
      let file = null;
      for (const p of m.parts || []) { if (p.start && n < p.start) break; file = p.file; }
      if (!file) return {};
      mdi.files[file] = mdi.files[file] || fetch(`/static/mdi/${file}.json`).then((r) => r.json()).catch(() => ({}));
      return mdi.files[file];
    }).then((map) => (mdi.paths[n] = (map && map[n]) || null));
  };
  mdi.url = mdi.url || function (n) {
    const d = mdi.paths[n];
    return d ? 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20"><path d="${d}"/></svg>`) : null;
  };
  const iconUrl = (name) => {
    if (/^mdi:/.test(name)) return mdi.url(name.slice(4)) || 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E';
    return window.hemmaIconUrl ? window.hemmaIconUrl(name)
      : (window.HEMMA_ICONS && window.HEMMA_ICONS[name]) || `/hemma_assets/icons/${name}.svg`;
  };
  const COLORS = {
    yellow: '#FFCC00', amber: '#ffb254', orange: '#FF9230', red: '#FF4245', pink: '#ff4d70', purple: '#9333ea',
    blue: '#0088FF', ice: '#3cd3fe', teal: '#00C3D0', mint: '#00C8B3', green: '#30D158', gold: '#e5a00d', neutral: '#CDCDCF',
  };
  const colorOf = (key) => (COLORS[key] ? `var(--hemma-color-${key}, ${COLORS[key]})` : 'var(--hemma-color-neutral, #CDCDCF)');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // One subscription per connection, shared by every card on the page.
  const store = window._hemmaHomeStore = window._hemmaHomeStore || { data: { status_badges: [], entities: {} }, subs: new Set(), conn: null };
  store.ensure = function (hass) {
    const conn = hass && hass.connection;
    if (!conn || store.conn === conn) return;
    store.conn = conn;
    conn.subscribeMessage((data) => {
      store.data = data || { status_badges: [], entities: {} };
      store.subs.forEach((fn) => fn());
    }, { type: 'hemma/home/subscribe' }).catch(() => {});
  };

  function minutesLeft(st) {
    if (!st) return null;
    const v = st.state, a = st.attributes || {};
    if (a.device_class === 'timestamp') {
      const t = Date.parse(v);
      return isFinite(t) ? Math.round((t - Date.now()) / 60000) : null;
    }
    const hms = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(String(v));
    if (hms) return Number(hms[1]) * 60 + Number(hms[2]) + (hms[3] ? Math.round(Number(hms[3]) / 60) : 0);
    const n = Number(v);
    if (!isFinite(n)) return null;
    const u = String(a.unit_of_measurement || 'min').toLowerCase();
    return Math.round(u === 'h' ? n * 60 : u === 's' ? n / 60 : n);
  }
  function leftText(m) {
    if (m == null || m <= 0) return '';
    if (m < 60) return T('status.min_left', '{n} min left', { n: m });
    const h = Math.floor(m / 60), r = m % 60;
    return r ? T('status.h_min_left', '{h} h {m} min left', { h, m: r }) : T('status.h_left', '{h} h left', { h });
  }

  const CSS = `
    :host { display: flex; gap: var(--badge-gap-current, var(--badge-gap, 10px)); align-items: center; order: var(--hemma-badge-order-status, 7); }
    :host([empty]) { display: none; }
    .b { display: inline-grid; grid-template-columns: min-content minmax(0, 1fr); align-items: center;
      column-gap: var(--badge-col-gap-current, var(--badge-col-gap, 10px)); width: fit-content; box-sizing: border-box;
      min-height: var(--badge-min-height-current, var(--badge-min-height, 44px));
      padding: var(--badge-padding-current, var(--badge-padding, 6px 14px));
      border-radius: var(--badge-br, 9999px); background: var(--badge-background, rgba(10,12,14,0.65));
      backdrop-filter: blur(var(--badge-blur, 14px)); -webkit-backdrop-filter: blur(var(--badge-blur, 14px));
      box-shadow: var(--hemma-badge-glass-rim, none); cursor: pointer; font-family: inherit; color: inherit; border: none;
      opacity: var(--hemma-row-fade, 1); transition: background-color .22s ease, opacity .2s ease; -webkit-tap-highlight-color: transparent; }
    .i { width: var(--hemma-badge-icon-override, var(--badge-icon-size-current, var(--badge-icon-size, 30px)));
      height: var(--hemma-badge-icon-override, var(--badge-icon-size-current, var(--badge-icon-size, 30px)));
      box-sizing: border-box; padding: 10%; background: var(--c);
      -webkit-mask: var(--m) no-repeat center / contain; mask: var(--m) no-repeat center / contain; -webkit-mask-origin: content-box; mask-origin: content-box; }
    .w { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; min-width: 0; text-align: left; }
    .t { font-size: var(--badge-font-size-current, 13px); font-weight: 600; line-height: 1.2;
      color: var(--hemma-badge-title-color, var(--primary-text-color)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .s { font-size: calc(var(--badge-font-size-current, 13px) - 1px); font-weight: 500; line-height: 1.2;
      opacity: var(--hemma-badge-sub-opacity, .80); color: var(--hemma-badge-sub-color, var(--secondary-text-color));
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (max-width: 767px) and (orientation: portrait) {
      .b { min-height: var(--badge-min-height-current, 43px); padding: var(--badge-padding-current, 1px 14px 1px 6px); }
      .i { width: var(--hemma-badge-icon-override, var(--badge-icon-size-current, 32px)); height: var(--hemma-badge-icon-override, var(--badge-icon-size-current, 32px)); }
    }
    @media (max-height: 600px) and (orientation: landscape) {
      .b { min-height: var(--badge-min-height-current, 36px); padding: var(--badge-padding-current, 1px 12px 1px 6px); }
      .i { width: var(--badge-icon-size-current, 26px); height: var(--badge-icon-size-current, 26px); }
      .t { font-size: var(--badge-font-size-current, 12px); }
      .s { font-size: calc(var(--badge-font-size-current, 12px) - 1px); }
    }
    @media (min-width: 768px) and (max-width: 1400px) and (min-height: 501px) and (pointer: coarse),
           (min-width: 768px) and (max-width: 1400px) and (min-height: 501px) and (hover: none) {
      :host { --badge-icon-size-current: var(--badge-icon-size-tablet, 26px); --badge-min-height-current: var(--badge-min-height-tablet, 40px);
        --badge-padding-current: var(--badge-padding-tablet, 7px 14px 8px 7px); --badge-font-size-current: var(--badge-font-size-tablet, 13px); }
    }
    @media (min-width: 768px) and (min-height: 501px) {
      .w { gap: 0; }
      .t, .s { line-height: 1.15; padding-block: 0.16em; margin-block: -0.16em; }
    }
  `;

  class HemmaStatusBadges extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._onStore = () => this._render();
    }
    setConfig(config) { this._config = config || {}; this._render(); }
    getCardSize() { return 1; }
    connectedCallback() {
      if (this._key === undefined) this.setAttribute('empty', '');
      store.subs.add(this._onStore);
      this._render();
    }
    disconnectedCallback() { store.subs.delete(this._onStore); }
    set hass(hass) {
      this._hass = hass;
      store.ensure(hass);
      this._render();
    }
    _room() {
      const r = String((this._config && this._config.room) || 'home');
      if (r !== 'filter') return r;
      const f = this._hass && this._hass.states['input_select.hemma_mobile_filter'];
      return f ? String(f.state) : 'home';
    }
    _items() {
      const h = this._hass;
      if (!h) return [];
      const room = this._room();
      return (store.data.status_badges || []).filter((b) => (b.rooms || ['home']).indexOf(room) >= 0).map((b) => {
        const st = h.states[b.entity];
        if (!st || st.state === 'unavailable' || st.state === 'unknown') return null;
        const conf = (b.states || {})[st.state];
        if (conf && conf.show === false) return null;
        const label = (conf && conf.label) || (h.formatEntityState ? h.formatEntityState(st) : st.state);
        const left = b.time_entity ? leftText(minutesLeft(h.states[b.time_entity])) : '';
        const anyIcon = Object.values(b.states || {}).map((s) => s.icon).filter(Boolean)[0];
        return {
          id: b.id, entity: b.entity,
          name: b.name || (st.attributes && st.attributes.friendly_name) || b.entity,
          sub: left ? `${label} · ${left}` : label,
          icon: (conf && conf.icon) || anyIcon || 'status',
          color: colorOf(conf && conf.color),
        };
      }).filter(Boolean).map((it) => {
        it.url = iconUrl(it.icon);
        if (/^mdi:/.test(it.icon) && !(it.icon.slice(4) in mdi.paths)) mdi.load(it.icon.slice(4)).then(() => this._render());
        return it;
      });
    }
    _render() {
      const items = this._items();
      const key = JSON.stringify(items);
      if (key === this._key) return;
      this._key = key;
      this.toggleAttribute('empty', !items.length);
      this.shadowRoot.innerHTML = `<style>${CSS}</style>` + items.map((it) =>
        `<button class="b" data-entity="${esc(it.entity)}" aria-label="${esc(it.name + ', ' + it.sub)}">`
        + `<span class="i" style="--c:${it.color};--m:url('${esc(it.url)}')"></span>`
        + `<span class="w"><span class="t">${esc(it.name)}</span><span class="s">${esc(it.sub)}</span></span></button>`).join('');
      this.shadowRoot.querySelectorAll('.b').forEach((el) => el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
      }));
    }
  }
  if (!customElements.get('hemma-status-badges')) customElements.define('hemma-status-badges', HemmaStatusBadges);

  // The light panel, after Apple Home's: a brightness capsule, favorite colors, and for a group a page of its lights.
  const COLOR_FAVS = [{ k: 2700 }, { hs: [30, 100] }, { hs: [0, 90] }, { k: 4000 }];
  const WHITE_FAVS = [{ k: 2200 }, { k: 2700 }, { k: 4000 }, { k: 6500 }];
  const kelvinRgb = (k) => {
    const t = k / 100;
    const r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
    const g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755);
    const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
    const c = (v) => Math.round(Math.max(0, Math.min(255, v)));
    return `rgb(${c(r)}, ${c(g)}, ${c(b)})`;
  };
  const favCss = (f) => (f.k ? kelvinRgb(f.k) : `hsl(${f.hs[0]}, ${f.hs[1]}%, 55%)`);
  const lightColor = (st) => {
    const a = (st && st.attributes) || {};
    if (Array.isArray(a.rgb_color)) return `rgb(${a.rgb_color.join(', ')})`;
    if (a.color_temp_kelvin) return kelvinRgb(a.color_temp_kelvin);
    return 'var(--hemma-color-yellow, #FFCC00)';
  };
  const pctOf = (st) => (st && st.state === 'on' ? Math.max(1, Math.round((Number(st.attributes.brightness) || 255) / 2.55)) : 0);
  // Studio's rule: a lamp made of several bulbs is one light; only groups of groups are opened up.
  const memsOf = (states, id) => {
    const m = ((states[id] || {}).attributes || {}).entity_id;
    return Array.isArray(m) ? m.filter((x) => typeof x === 'string' && x.startsWith('light.')) : [];
  };
  const unitOf = (states, id, seen) => {
    if (!id || seen.has(id)) return [];
    const m = memsOf(states, id);
    if (!m.length || !m.some((x) => memsOf(states, x).length)) return [id];
    seen.add(id);
    return m.flatMap((x) => unitOf(states, x, seen));
  };
  const unitsOf = (states, id) => {
    const m = memsOf(states, id);
    if (!m.length) return [id];
    const seen = new Set([id]);
    return [...new Set(m.flatMap((x) => unitOf(states, x, seen)))];
  };
  const PANEL_CSS = `
    :host { display: block; --lc: var(--hemma-color-yellow, #FFCC00); color: #fff; font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); }
    .wrap { position: relative; width: 100%; height: min(600px, calc(100svh - 64px)); margin: -8px -8px -20px; width: calc(100% + 16px); overflow: hidden; }
    .page { position: absolute; inset: 0; transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; }
    .main { display: grid; grid-template-rows: auto 1fr auto auto; justify-items: center; gap: 18px; padding: 28px 22px 20px; box-sizing: border-box; }
    .list { transform: translateX(100%); opacity: 0; padding: 18px 16px 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
    .list::-webkit-scrollbar { display: none; }
    .deep .main { transform: translateX(-30%); opacity: 0; pointer-events: none; }
    .deep .list { transform: none; opacity: 1; }
    .h { text-align: center; display: grid; gap: 4px; }
    .h b { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
    .h span { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.72); font-variant-numeric: tabular-nums; }
    .cap { position: relative; width: 116px; height: 100%; min-height: 180px; max-height: 300px; align-self: center; border-radius: 36px; overflow: hidden;
      background: rgba(0,0,0,0.30); cursor: default; touch-action: none; border: 0; padding: 0; color: #fff; -webkit-tap-highlight-color: transparent; }
    .cap .fill { position: absolute; left: 0; right: 0; bottom: 0; background: var(--lc); transition: height .12s ease, background-color .3s ease; }
    .cap.dragging .fill { transition: background-color .3s ease; }
    .cap .bulb { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); }
    .cap .bulb i { width: 30px; height: 30px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .sw { display: flex; gap: 12px; justify-content: center; }
    .sw button { width: 46px; height: 46px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; background: var(--s); position: relative; -webkit-tap-highlight-color: transparent; }
    .sw button.on::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; box-shadow: 0 0 0 2.5px #fff; }
    .sw button.wheel { background: conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #00c3d0, #0088ff, #af52de, #ff3b30); }
    .sw button.wheel.whites { background: linear-gradient(90deg, ${kelvinRgb(2000)}, #fff, ${kelvinRgb(6500)}); }
    .sw button.wheel::before { content: ""; position: absolute; inset: 5px; border-radius: 50%; background: var(--lc); }
    .foot { width: 100%; display: flex; justify-content: space-between; align-items: center; }
    .pill, .gear, .back { border: 0; color: #fff; font: inherit; cursor: pointer; background: rgba(255,255,255,0.10); position: relative; -webkit-tap-highlight-color: transparent; }
    .pill { height: 40px; padding: 0 16px; border-radius: 999px; font-size: 14.5px; font-weight: 600; }
    .gear { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; }
    .gear i { width: 22px; height: 22px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .back { flex: none; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 18px 0 14px; border-radius: 999px; font-size: 16px; font-weight: 600; }
    .back svg { width: 10px; height: 17px; display: block; }
    .pill::after, .gear::after, .back::after, .sw button:not(.wheel)::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #fff; opacity: 0; transition: opacity .40s ease; pointer-events: none; }
    @media (hover: hover) { .pill:hover::after, .gear:hover::after, .back:hover::after { opacity: .07; transition: opacity .18s ease; } }
    .lst { flex: none; background: rgba(255,255,255,0.10); border-radius: 22px; overflow: hidden; }
    .lr { display: grid; grid-template-columns: 1fr auto; gap: 8px 12px; align-items: center; padding: 12px 16px; position: relative; }
    .lr + .lr::before { content: ""; position: absolute; top: 0; left: 16px; right: 16px; height: 0.5px; background: rgba(255,255,255,0.12); }
    .lr b { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr span { font-size: 13.5px; color: rgba(255,255,255,0.65); font-variant-numeric: tabular-nums; }
    .mini { grid-column: 1 / -1; position: relative; height: 30px; border-radius: 999px; background: rgba(0,0,0,0.28); overflow: hidden; cursor: default; touch-action: none; border: 0; padding: 0; }
    .mini .fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--lc); }
    .picker { position: absolute; inset: 0; padding: 26px 22px 20px; box-sizing: border-box; display: grid; grid-template-rows: auto 1fr auto; gap: 16px; justify-items: center; }
    .wheelbig { width: 220px; height: 220px; border-radius: 50%; align-self: center; cursor: default; touch-action: none; border: 0; padding: 0;
      background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 68%), conic-gradient(from 90deg, #ff3b30, #ffcc00, #34c759, #00c3d0, #0088ff, #af52de, #ff3b30); }
    .kbar { width: 100%; height: 56px; border-radius: 999px; align-self: center; cursor: default; touch-action: none; border: 0; padding: 0;
      background: linear-gradient(90deg, ${kelvinRgb(2000)}, ${kelvinRgb(3500)}, #fff, ${kelvinRgb(6500)}); }
    button:focus-visible { outline: 2px solid rgba(255,255,255,0.7); outline-offset: 2px; }
  `;
  class HemmaLightPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._pending = {}; }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._sync(); }
    _ids() {
      const S = this._hass.states, c = this._config;
      const list = Array.isArray(c.lights) && c.lights.length ? c.lights : unitsOf(S, c.entity);
      return list.filter((id) => S[id]);
    }
    _call(svc, data) { return this._hass.callService('light', svc, data).catch(() => {}); }
    // A group acts on the lights that are on, and from off brings back the ones that were on last, never every light it holds.
    _memKey() { return 'hemma_lights_on:' + this._config.entity; }
    _target() {
      const ids = this._ids();
      if (ids.length < 2) return this._config.entity;
      if (this._scope && this._scope.length) return this._scope;
      const on = ids.filter((id) => this._hass.states[id].state === 'on');
      if (on.length) return on;
      let last = null;
      try { last = JSON.parse(localStorage.getItem(this._memKey()) || 'null'); } catch (e) { last = null; }
      const back = Array.isArray(last) ? last.filter((id) => ids.includes(id)) : [];
      return back.length ? back : ids;
    }
    _remember() {
      const ids = this._ids();
      if (ids.length < 2) return;
      const on = ids.filter((id) => this._hass.states[id].state === 'on');
      if (on.length) { try { localStorage.setItem(this._memKey(), JSON.stringify(on)); } catch (e) {} }
    }
    _setBrightness(pct) {
      const ids = this._target();
      this._scope = Array.isArray(ids) ? ids : null;
      clearTimeout(this._bt);
      this._bt = setTimeout(() => (pct > 0 ? this._call('turn_on', { entity_id: ids, brightness_pct: pct }) : this._call('turn_off', { entity_id: ids })), 120);
    }
    _setColor(f) {
      const d = { entity_id: this._target() };
      if (f.k) d.color_temp_kelvin = f.k; else d.hs_color = f.hs;
      this._call('turn_on', d);
    }
    _modes() {
      const all = new Set();
      this._ids().forEach((id) => ((this._hass.states[id].attributes || {}).supported_color_modes || []).forEach((m) => all.add(m)));
      const color = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'].some((m) => all.has(m));
      return { color, temp: color || all.has('color_temp'), dim: [...all].some((m) => m !== 'onoff') };
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const S = this._hass.states, c = this._config;
      const ids = this._ids();
      const group = ids.length > 1;
      const md = this._modes();
      const favs = md.color ? COLOR_FAVS : md.temp ? WHITE_FAVS : [];
      const name = c.name || (S[c.entity] && S[c.entity].attributes.friendly_name) || c.entity;
      const root = this.shadowRoot;
      root.innerHTML = `<style>${PANEL_CSS}</style><div class="wrap"><div class="page main">`
        + `<div class="h"><b>${esc(name)}</b><span class="st"></span></div>`
        + `<button type="button" class="cap" role="slider" aria-label="${esc(T('lights.brightness', 'Brightness'))}" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span><span class="bulb"><i style="--i:url('${esc(iconUrl('light'))}')"></i></span></button>`
        + (favs.length ? `<div class="sw">${favs.map((f, i) => `<button type="button" data-i="${i}" style="--s:${favCss(f)}" aria-label="${esc(T('lights.favorite', 'Favorite {n}', { n: i + 1 }))}"></button>`).join('')}<button type="button" class="wheel${md.color ? '' : ' whites'}" aria-label="${esc(md.color ? T('lights.color', 'Color') : T('lights.whites', 'Whites'))}"></button></div>` : '<div></div>')
        + `<div class="foot">${group ? `<button type="button" class="pill lights">${esc(T('lights.n_lights', '{n} Lights', { n: ids.length }))} ›</button>` : '<span></span>'}<button type="button" class="gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url('${esc(iconUrl('settings'))}')"></i></button></div>`
        + `</div>${group ? `<div class="page list"><button type="button" class="back"><svg viewBox="0 0 10 17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5 1.5 8.5l7 7"/></svg>${esc(name)}</button><div class="lst"></div></div>` : ''}</div>`;
      this._favs = favs;
      const cap = root.querySelector('.cap');
      let drag = null;
      cap.addEventListener('pointerdown', (ev) => { cap.setPointerCapture(ev.pointerId); drag = { y: ev.clientY, v: this._val(), moved: false }; });
      cap.addEventListener('pointermove', (ev) => {
        if (!drag) return;
        const dy = drag.y - ev.clientY;
        if (Math.abs(dy) > 4) drag.moved = true;
        if (!drag.moved || !md.dim) return;
        cap.classList.add('dragging');
        const v = Math.round(Math.max(0, Math.min(100, drag.v + dy / cap.getBoundingClientRect().height * 100)));
        this._local = v; this._paint(); this._setBrightness(v);
      });
      const up = () => {
        if (drag && !drag.moved) {
          const ids = this._target();
          const turnOff = this._on();
          this._local = turnOff ? 0 : (this._val() || 100); this._paint();
          this._call(turnOff ? 'turn_off' : 'turn_on', { entity_id: ids });
        }
        drag = null; cap.classList.remove('dragging');
        clearTimeout(this._lt); this._lt = setTimeout(() => { this._local = null; this._scope = null; this._paint(); }, 2500);
      };
      cap.addEventListener('pointerup', up);
      cap.addEventListener('pointercancel', () => { drag = null; cap.classList.remove('dragging'); });
      cap.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
        ev.preventDefault();
        const v = Math.max(0, Math.min(100, this._val() + (ev.key === 'ArrowUp' ? 10 : -10)));
        this._local = v; this._paint(); this._setBrightness(v);
      });
      root.querySelectorAll('.sw button[data-i]').forEach((b) => { b.onclick = () => { const f = favs[Number(b.dataset.i)]; this._localColor = favCss(f); this._paint(); this._setColor(f); }; });
      const wheel = root.querySelector('.sw .wheel');
      if (wheel) wheel.onclick = () => this._picker(md.color);
      root.querySelector('.gear').onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: c.entity }, bubbles: true, composed: true }));
      if (group) {
        const wrap = root.querySelector('.wrap');
        root.querySelector('.lights').onclick = () => { this._rows(); wrap.classList.add('deep'); };
        root.querySelector('.back').onclick = () => wrap.classList.remove('deep');
      }
      this._paint();
    }
    _on() { if (this._local == null) this._remember(); return this._local != null ? this._local > 0 : this._ids().some((id) => this._hass.states[id].state === 'on'); }
    _val() {
      if (this._local != null) return this._local;
      const on = this._ids().map((id) => this._hass.states[id]).filter((s) => s.state === 'on');
      return on.length ? Math.round(on.reduce((a, s) => a + pctOf(s), 0) / on.length) : 0;
    }
    _color() {
      if (this._localColor) return this._localColor;
      const s = this._ids().map((id) => this._hass.states[id]).find((x) => x.state === 'on') || this._hass.states[this._config.entity];
      return lightColor(s);
    }
    _paint() {
      const root = this.shadowRoot;
      const st = root.querySelector('.st');
      if (!st) return;
      const on = this._on(), v = this._val();
      root.host.style.setProperty('--lc', this._color());
      root.querySelector('.cap .fill').style.height = (on ? Math.max(v, 4) : 0) + '%';
      root.querySelector('.cap').setAttribute('aria-valuenow', String(on ? v : 0));
      st.textContent = on ? v + '%' : (this._hass.formatEntityState ? this._hass.formatEntityState({ ...this._hass.states[this._config.entity], state: 'off' }) : 'Off');
      if (root.querySelector('.wrap.deep')) this._rows();
    }
    _sync() { this._remember(); if (this._local == null) this._localColor = null; this._paint(); }
    _rows() {
      const lst = this.shadowRoot.querySelector('.lst');
      if (!lst) return;
      const S = this._hass.states;
      const ids = this._ids();
      if (lst.childElementCount !== ids.length) {
        lst.textContent = '';
        ids.forEach((id) => {
          const r = document.createElement('div');
          r.className = 'lr';
          r.innerHTML = `<b></b><span></span><button type="button" class="mini" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span></button>`;
          const mini = r.querySelector('.mini');
          const at = (ev) => {
            const b = mini.getBoundingClientRect();
            const v = Math.round(Math.max(0, Math.min(100, (ev.clientX - b.left) / b.width * 100)));
            r.querySelector('.mini .fill').style.width = v + '%';
            r.querySelector('span').textContent = v ? v + '%' : T('lights.off', 'Off');
            clearTimeout(r._t);
            r._t = setTimeout(() => (v ? this._call('turn_on', { entity_id: id, brightness_pct: v }) : this._call('turn_off', { entity_id: id })), 120);
            r._hold = Date.now() + 2500;
          };
          mini.addEventListener('pointerdown', (ev) => { mini.setPointerCapture(ev.pointerId); at(ev); mini.onpointermove = at; });
          mini.addEventListener('pointerup', () => { mini.onpointermove = null; });
          lst.appendChild(r);
        });
      }
      [...lst.children].forEach((r, i) => {
        const s = S[ids[i]];
        if (!s || (r._hold && Date.now() < r._hold)) return;
        const v = pctOf(s);
        r.style.setProperty('--lc', lightColor(s));
        r.querySelector('b').textContent = s.attributes.friendly_name || ids[i];
        r.querySelector('span').textContent = s.state === 'on' ? v + '%' : (this._hass.formatEntityState ? this._hass.formatEntityState(s) : s.state);
        r.querySelector('.mini').setAttribute('aria-label', s.attributes.friendly_name || ids[i]);
        r.querySelector('.mini .fill').style.width = v + '%';
      });
    }
    _picker(color) {
      const main = this.shadowRoot.querySelector('.main');
      const p = document.createElement('div');
      p.className = 'page picker';
      p.innerHTML = `<div class="h"><b>${esc(color ? T('lights.color', 'Color') : T('lights.whites', 'Whites'))}</b></div>`
        + (color ? `<button type="button" class="wheelbig" aria-label="${esc(T('lights.color', 'Color'))}"></button>` : `<button type="button" class="kbar" aria-label="${esc(T('lights.whites', 'Whites'))}"></button>`)
        + `<button type="button" class="pill">${esc(T('lights.done', 'Done'))}</button>`;
      const pad = p.querySelector(color ? '.wheelbig' : '.kbar');
      const pick = (ev) => {
        const r = pad.getBoundingClientRect();
        let f;
        if (color) {
          const x = ev.clientX - r.left - r.width / 2, y = ev.clientY - r.top - r.height / 2;
          f = { hs: [Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360), Math.round(Math.min(100, Math.hypot(x, y) / (r.width / 2) * 100))] };
        } else {
          f = { k: Math.round(2000 + Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * 4500) };
        }
        this._localColor = favCss(f); this._paint();
        clearTimeout(this._ct); this._ct = setTimeout(() => this._setColor(f), 120);
      };
      pad.addEventListener('pointerdown', (ev) => { pad.setPointerCapture(ev.pointerId); pick(ev); pad.onpointermove = pick; });
      pad.addEventListener('pointerup', () => { pad.onpointermove = null; });
      p.querySelector('.pill').onclick = () => { p.remove(); main.style.visibility = ''; };
      main.style.visibility = 'hidden';
      this.shadowRoot.querySelector('.wrap').appendChild(p);
    }
  }
  if (!customElements.get('hemma-light-panel')) customElements.define('hemma-light-panel', HemmaLightPanel);

  // Tile Tap: Ask First confirms anything that changes a device; View Only lets nothing through.
  const boot = () => {
    const ha = document.querySelector('home-assistant');
    if (ha && ha.hass && ha.hass.connection) store.ensure(ha.hass);
    else setTimeout(boot, 500);
  };
  boot();
  const tapOf = (eid) => (eid && ((store.data.entities || {})[eid] || {}).tap) || 'normal';
  const tileOf = (path) => path.find((n) => n && n.tagName === 'BUTTON-CARD' && n._stateObj);
  const nameOf = (card) => {
    const shown = card.shadowRoot && card.shadowRoot.querySelector('#name');
    const t = shown && shown.textContent.trim();
    return t || (card._stateObj.attributes || {}).friendly_name || card._stateObj.entity_id;
  };
  const isOn = (st) => /^(on|open|opening|playing|unlocked|heat|cool|heat_cool|auto|dry|fan_only|cleaning)$/.test(String(st && st.state));
  const verbFor = (svc, st, data) => {
    const [d, v] = String(svc || '').split('.');
    const flip = () => (isOn(st) ? T('tap.turn_off', 'Turn Off') : T('tap.turn_on', 'Turn On'));
    if (!v || v === 'toggle' || /smart_toggle/.test(JSON.stringify(data || {})) || /toggle/.test(v)) return flip();
    if (v === 'turn_on') return T('tap.turn_on', 'Turn On');
    if (v === 'turn_off') return T('tap.turn_off', 'Turn Off');
    if (v === 'unlock') return T('tap.unlock', 'Unlock');
    if (v === 'lock') return T('tap.lock', 'Lock');
    if (v === 'open_cover' || v === 'open') return T('tap.open', 'Open');
    if (v === 'close_cover' || v === 'close') return T('tap.close', 'Close');
    if (v === 'media_play_pause') return String(st && st.state) === 'playing' ? T('tap.pause', 'Pause') : T('tap.play', 'Play');
    if (v === 'media_play' || v === 'start') return v === 'start' ? T('tap.start', 'Start') : T('tap.play', 'Play');
    if (v === 'media_pause' || v === 'pause') return T('tap.pause', 'Pause');
    if (v === 'increment') return T('tap.raise', 'Raise');
    if (v === 'decrement') return T('tap.lower', 'Lower');
    if (v === 'set_hvac_mode') return data && data.hvac_mode === 'off' ? T('tap.turn_off', 'Turn Off') : T('tap.turn_on', 'Turn On');
    if (v === 'return_to_base') return T('tap.send_home', 'Send Home');
    return T('tap.continue', 'Continue');
  };

  // The glass never fades by opacity: below 1 it, or any ancestor, samples nothing to blur until the animation ends.
  const ASK_CSS = `
    .scrim { position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center; padding:0 24px; background:rgba(0,0,0,0.22);
      animation:dim .30s ease both; font-family:var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-tap-highlight-color:transparent; }
    .box { position:relative; width:min(290px, 100%); border-radius:28px; text-align:center; color:#fff; }
    .glass { position:absolute; inset:0; border-radius:inherit; pointer-events:none;
      background-color:rgba(30,33,38,0.30); -webkit-backdrop-filter:blur(40px) saturate(170%); backdrop-filter:blur(40px) saturate(170%);
      animation:glassIn .48s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
    .content { position:relative; box-sizing:border-box; padding:22px 16px 16px; animation:contentIn .48s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
    .t { font-size:17px; font-weight:600; line-height:1.3; letter-spacing:-0.01em; margin:0 4px 16px; overflow-wrap:anywhere; }
    .r { display:flex; gap:10px; }
    button { position:relative; flex:1; height:44px; border:0; border-radius:999px; font:inherit; font-size:16px; cursor:pointer; color:#fff;
      background:rgba(255,255,255,0.12); box-shadow:inset 0 0.5px 0 rgba(255,255,255,0.22);
      -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
    button.ok { font-weight:600; background:rgba(0,195,208,0.82); }
    button::after { content:""; position:absolute; inset:0; border-radius:inherit; background:#fff; opacity:0; transition:opacity .40s ease; pointer-events:none; }
    @media (hover: hover) { button:hover::after { opacity:.07; transition:opacity .18s ease; } }
    button:active::after { opacity:.12; transition:opacity .08s ease; }
    button:focus-visible { outline:2px solid rgba(255,255,255,0.6); outline-offset:2px; }
    .out { animation:undim .28s ease both; }
    .out .glass { animation:glassOut .24s cubic-bezier(0.4, 0, 1, 1) both; }
    .out .content { animation:contentOut .24s cubic-bezier(0.4, 0, 1, 1) both; }
    @keyframes dim { from { background-color:rgba(0,0,0,0); } }
    @keyframes undim { to { background-color:rgba(0,0,0,0); } }
    @keyframes glassIn {
      from { transform:scale(0.88); background-color:rgba(30,33,38,0);
        -webkit-backdrop-filter:blur(0px) saturate(100%); backdrop-filter:blur(0px) saturate(100%);
        } }
    @keyframes glassOut {
      to { transform:scale(0.92); background-color:rgba(30,33,38,0);
        -webkit-backdrop-filter:blur(0px) saturate(100%); backdrop-filter:blur(0px) saturate(100%);
        } }
    @keyframes contentIn { from { opacity:0; transform:scale(0.88); } 40% { opacity:1; } }
    @keyframes contentOut { to { opacity:0; transform:scale(0.92); } }
    @media (prefers-reduced-motion: reduce) {
      .glass, .content, .out .glass, .out .content { animation-duration:.2s; animation-timing-function:ease; }
      @keyframes glassIn { from { background-color:rgba(30,33,38,0); -webkit-backdrop-filter:blur(0px) saturate(100%); backdrop-filter:blur(0px) saturate(100%); } }
    }
  `;
  let asking = null;
  // A damped spring sampled into linear(), so the morph settles the way Apple's panels do.
  const spring = (response) => {
    const w0 = 2 * Math.PI / response;
    const x = (t) => 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    const dur = 8.4 / w0;
    const pts = [];
    for (let i = 0; i <= 60; i++) pts.push(i === 60 ? 1 : +x(dur * i / 60).toFixed(4));
    return { ease: 'linear(' + pts.join(', ') + ')', dur: Math.round(dur * 1000) };
  };
  const SPRING = window.CSS && CSS.supports && CSS.supports('animation-timing-function', 'linear(0, 1)');
  const GROW = SPRING ? spring(0.32) : { ease: 'cubic-bezier(0.2, 0.9, 0.25, 1)', dur: 420 };
  const SHRINK = SPRING ? spring(0.28) : { ease: 'cubic-bezier(0.2, 0.9, 0.25, 1)', dur: 370 };
  const alphaOf = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return 0; const p = m[1].split(','); return p.length > 3 ? Number(p[3]) : 1; };
  const tileLook = (card) => {
    const sr = card.shadowRoot;
    const hc = sr && sr.querySelector('ha-card');
    if (!hc) return null;
    const r = hc.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const cs = getComputedStyle(hc);
    const over = getComputedStyle(hc, '::after');
    const lit = alphaOf(over.backgroundColor) * Number(over.opacity || 0) > 0.5;
    const blur = Number((/blur\(([\d.]+)px\)/.exec(cs.backdropFilter || cs.webkitBackdropFilter || '') || [])[1] || 0);
    return { rect: r, radius: parseFloat(cs.borderTopLeftRadius) || 26, fill: lit ? over.backgroundColor : cs.backgroundColor, blur };
  };
  const frame = (x, y, w, h, radius, fill, blur, lit) => ({
    left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: radius + 'px', backgroundColor: fill,
    backdropFilter: `blur(${blur}px) saturate(${blur ? 170 : 100}%)`, webkitBackdropFilter: `blur(${blur}px) saturate(${blur ? 170 : 100}%)`,
    boxShadow: 'none',
  });

  // Apple's collapse: the tile's icon appears partway and rides the shrinking shape home, then its name and state fade in.
  const COPY_PROPS = ['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
    'border-radius', 'opacity', 'filter', 'color', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height',
    '-webkit-mask-image', 'mask-image', '-webkit-mask-size', 'mask-size', '-webkit-mask-position', 'mask-position',
    '-webkit-mask-repeat', 'mask-repeat', 'transform', 'white-space'];
  const copyStyle = (from, to, pseudo) => {
    const cs = getComputedStyle(from, pseudo);
    COPY_PROPS.forEach((k) => to.style.setProperty(k, cs.getPropertyValue(k)));
    return cs;
  };
  const cloneShown = (el) => {
    const r = el.getBoundingClientRect();
    const box = document.createElement('div');
    copyStyle(el, box);
    Object.assign(box.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
      margin: '0', boxSizing: 'border-box', pointerEvents: 'none', transform: 'none', opacity: '1' });
    ['::before', '::after'].forEach((ps) => {
      const pc = getComputedStyle(el, ps);
      if (!pc.content || pc.content === 'none') return;
      const d = document.createElement('div');
      copyStyle(el, d, ps);
      Object.assign(d.style, { position: 'absolute', left: pc.left === 'auto' ? '0' : pc.left, top: pc.top === 'auto' ? '0' : pc.top,
        width: pc.width === 'auto' ? '100%' : pc.width, height: pc.height === 'auto' ? '100%' : pc.height,
        marginTop: pc.marginTop, marginLeft: pc.marginLeft, boxSizing: pc.boxSizing,
        paddingTop: pc.paddingTop, paddingLeft: pc.paddingLeft, paddingRight: pc.paddingRight, paddingBottom: pc.paddingBottom,
        translate: pc.translate, scale: pc.scale });
      box.appendChild(d);
    });
    [...el.children].forEach((k) => {
      const kr = k.getBoundingClientRect();
      if (!kr.width) return;
      const d = k.tagName === 'IMG' ? document.createElement('img') : document.createElement('div');
      if (k.tagName === 'IMG') d.src = k.src;
      copyStyle(k, d);
      Object.assign(d.style, { position: 'absolute', left: (kr.left - r.left) + 'px', top: (kr.top - r.top) + 'px', width: kr.width + 'px', height: kr.height + 'px', margin: '0' });
      box.appendChild(d);
    });
    return { el: box, rect: r };
  };
  // Text is placed where its glyphs actually render, measured per text node, so padding, flex and alignment cannot shift it.
  const cloneText = (el) => {
    const r = el.getBoundingClientRect();
    const box = document.createElement('div');
    Object.assign(box.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
      overflow: 'hidden', pointerEvents: 'none', margin: '0' });
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const g = range.getBoundingClientRect();
      if (!g.width) continue;
      const cs = getComputedStyle(n.parentElement);
      const t = document.createElement('div');
      t.textContent = n.textContent;
      Object.assign(t.style, { position: 'absolute', left: (g.left - r.left) + 'px', top: (g.top - r.top) + 'px', height: g.height + 'px',
        lineHeight: g.height + 'px', whiteSpace: 'pre', color: cs.color, opacity: cs.opacity, fontFamily: cs.fontFamily, fontSize: cs.fontSize,
        fontWeight: cs.fontWeight, fontStyle: cs.fontStyle, letterSpacing: cs.letterSpacing, wordSpacing: cs.wordSpacing,
        fontFeatureSettings: cs.fontFeatureSettings, fontVariantNumeric: cs.fontVariantNumeric, textTransform: cs.textTransform,
        webkitFontSmoothing: cs.webkitFontSmoothing, textShadow: cs.textShadow });
      box.appendChild(t);
    }
    return { el: box, rect: r };
  };
  const settle = (card, holder, from, dur, ease) => {
    const sr = card.shadowRoot;
    const hc = sr && sr.querySelector('ha-card');
    if (!hc) return;
    const t = hc.getBoundingClientRect();
    const parts = [];
    const cell = sr.querySelector('#img-cell');
    if (cell && cell.getBoundingClientRect().width) parts.push({ ...cloneShown(cell), icon: true });
    ['#name', '#state', '#label'].forEach((sel) => {
      const n = sr.querySelector(sel);
      if (n && n.textContent.trim() && n.getBoundingClientRect().width) parts.push(cloneText(n));
    });
    const fy = from.top + from.height / 2, ty = t.top + t.height / 2;
    parts.forEach((p) => {
      holder.appendChild(p.el);
      const dx = from.left - t.left, dy = fy - ty;
      p.el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: dur, easing: ease, fill: 'both' });
      p.el.animate([{ opacity: 0 }, { opacity: 1 }], p.icon
        ? { duration: dur * 0.25, delay: dur * 0.28, easing: 'ease-out', fill: 'both' }
        : { duration: dur * 0.35, delay: dur * 0.6, easing: 'ease-out', fill: 'both' });
    });
    return () => parts.forEach((p) => p.el.remove());
  };
  // Apple's expand: the tile's own icon and text ride the growing shape and fade early.
  const lift = (card, holder, track, dur) => {
    const sr = card.shadowRoot;
    const hc = sr && sr.querySelector('ha-card');
    if (!hc) return () => {};
    const t = hc.getBoundingClientRect();
    const parts = [];
    const cell = sr.querySelector('#img-cell');
    if (cell && cell.getBoundingClientRect().width) parts.push(cloneShown(cell));
    ['#name', '#state', '#label'].forEach((sel) => {
      const n = sr.querySelector(sel);
      if (n && n.textContent.trim() && n.getBoundingClientRect().width) parts.push(cloneText(n));
    });
    parts.forEach((p) => {
      holder.appendChild(p.el);
      p.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.4, easing: 'ease-out', fill: 'forwards' });
    });
    // The copies follow the glass as it actually renders, whatever size the panel turns out to be.
    const cy = t.top + t.height / 2;
    const start = performance.now();
    const ride = () => {
      if (!holder.isConnected || performance.now() - start > dur * 0.45) return;
      const r = track.getBoundingClientRect();
      holder.style.transform = `translate(${r.left - t.left}px, ${r.top + r.height / 2 - cy}px)`;
      requestAnimationFrame(ride);
    };
    ride();
    return () => parts.forEach((p) => p.el.remove());
  };
  // A copy's icon mask decodes a frame late, so the real tile stays up until the copy has painted.
  const hideAfterPaint = (card) => requestAnimationFrame(() => requestAnimationFrame(() => { card.style.visibility = 'hidden'; }));
  // The tile's fill drains at once and the glass stays see-through until it frosts over at the end.
  const material = (el, look, endBg, endFilter, dur) => {
    const m = /rgba?\(([^)]+)\)/.exec(endBg || '');
    const c = m ? m[1].split(',').map((v) => v.trim()) : ['30', '33', '38', '0.3'];
    const a = c.length > 3 ? Number(c[3]) : 1;
    const tint = (k) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${(a * k).toFixed(3)})`;
    const f = (b) => `blur(${b}px) saturate(${b ? 150 : 100}%)`;
    const endBlur = Number((/blur\(([\d.]+)px\)/.exec(endFilter || '') || [])[1] || 40);
    el.animate([
      { backgroundColor: look.fill, backdropFilter: f(look.blur), webkitBackdropFilter: f(look.blur) },
      { backgroundColor: tint(0.25), backdropFilter: f(endBlur * 0.15), webkitBackdropFilter: f(endBlur * 0.15), offset: 0.22 },
      { backgroundColor: tint(0.5), backdropFilter: f(endBlur * 0.4), webkitBackdropFilter: f(endBlur * 0.4), offset: 0.65 },
      { backgroundColor: endBg, backdropFilter: endFilter, webkitBackdropFilter: endFilter },
    ], { duration: dur, easing: 'linear', fill: 'backwards' });
  };
  const geometry = (fr) => { const o = { ...fr }; delete o.backgroundColor; delete o.backdropFilter; delete o.webkitBackdropFilter; return o; };
  // The sidebars count as off-screen: a panel never grows over them.
  const bounds = () => {
    let left = 0;
    const seen = (el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || r.left > 1 || r.right <= 0) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.5) return;
      left = Math.max(left, r.right);
    };
    const walk = (root, depth) => {
      if (depth > 12) return;
      root.querySelectorAll('ha-sidebar, nav.side').forEach(seen);
      root.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot, depth + 1); });
    };
    walk(document, 0);
    return { left, top: 0, right: window.innerWidth, bottom: window.innerHeight };
  };
  window.hemmaMorph = { look: tileLook, grow: GROW, shrink: SHRINK, settle, lift, material, geometry, hideAfterPaint, bounds };

  const ask = (title, verb, card) => new Promise((done) => {
    if (asking) return done(false);
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${ASK_CSS}</style><div class="scrim"><div class="box" role="alertdialog" aria-modal="true" aria-label="${esc(title)}">`
      + `<div class="glass"></div><div class="content"><div class="t">${esc(title)}</div><div class="r"><button class="no" type="button">${esc(T('tap.cancel', 'Cancel'))}</button>`
      + `<button class="ok" type="button">${esc(verb)}</button></div></div></div></div>`;
    const scrim = root.querySelector('.scrim');
    const box = root.querySelector('.box');
    const glass = root.querySelector('.glass');
    const content = root.querySelector('.content');
    asking = host;
    document.body.appendChild(host);

    const wide = window.matchMedia('(min-width: 768px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const inPopup = (n) => { for (; n; n = n.parentNode || n.host) if (n.tagName === 'HEMMA-POPUP') return true; return false; };
    let tile = wide && card && !inPopup(card) ? tileLook(card) : null;
    let W = 0, H = 0, fx = 0, fy = 0;
    if (tile) {
      const b = box.getBoundingClientRect();
      W = b.width; H = b.height;
      const m = 16, B = bounds(), t = tile.rect;
      fx = Math.max(B.left + m, Math.min(B.right - m - W, t.left + t.width / 2 - W / 2));
      fy = Math.max(B.top + m, Math.min(B.bottom - m - H, t.top + t.height / 2 - H / 2));
      Object.assign(box.style, { position: 'fixed', left: fx + 'px', top: fy + 'px', width: W + 'px', margin: '0' });
      Object.assign(glass.style, { animation: 'none', inset: 'auto', left: '0', top: '0', width: W + 'px', height: H + 'px', overflow: 'hidden' });
      content.style.animation = 'none';
      hideAfterPaint(card);
      scrim.style.animation = 'none';
      scrim.style.background = 'transparent';
      const from = frame(t.left - fx, t.top - fy, t.width, t.height, tile.radius, tile.fill, tile.blur, 0);
      glass.animate([geometry(from), geometry(frame(0, 0, W, H, 28, 'rgba(30,33,38,0.30)', 40, 1))], { duration: GROW.dur, easing: GROW.ease, fill: 'backwards' });
      material(glass, tile, 'rgba(30, 33, 38, 0.3)', 'blur(40px) saturate(170%)', GROW.dur);
      const lifted = document.createElement('div');
      lifted.style.cssText = 'position:fixed;inset:0;pointer-events:none;';
      scrim.appendChild(lifted);
      lift(card, lifted, glass, GROW.dur);
      setTimeout(() => lifted.remove(), GROW.dur);
      content.animate([{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }], { duration: GROW.dur, easing: GROW.ease, fill: 'backwards' });
      content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GROW.dur * 0.45, delay: GROW.dur * 0.5, easing: 'ease-out', fill: 'backwards' });
    }

    const finish = (yes) => {
      if (asking !== host) return;
      document.removeEventListener('keydown', key, true);
      asking = null;
      scrim.classList.add('out');
      if (tile && card.isConnected) {
        const back = tileLook(card) || tile;
        card.style.visibility = 'hidden';
        const t = back.rect;
        glass.getAnimations().forEach((a) => a.cancel());
        glass.animate([frame(0, 0, W, H, 28, 'rgba(30,33,38,0.30)', 40, 1), frame(t.left - fx, t.top - fy, t.width, t.height, back.radius, back.fill, back.blur, 0)],
          { duration: SHRINK.dur, easing: SHRINK.ease, fill: 'forwards' });
        content.getAnimations().forEach((a) => a.cancel());
        content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SHRINK.dur * 0.3, easing: 'ease-in', fill: 'forwards' });
        const holder = document.createElement('div');
        holder.style.cssText = 'position:fixed;inset:0;pointer-events:none;';
        scrim.appendChild(holder);
        settle(card, holder, { left: fx, top: fy, width: W, height: H }, SHRINK.dur, SHRINK.ease);
        setTimeout(() => { card.style.visibility = ''; host.remove(); }, SHRINK.dur);
      } else {
        if (card) card.style.visibility = '';
        setTimeout(() => host.remove(), 300);
      }
      done(yes);
    };
    const key = (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
      if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
    };
    scrim.addEventListener('click', (ev) => { if (ev.target === scrim) finish(false); });
    root.querySelector('.no').onclick = () => finish(false);
    root.querySelector('.ok').onclick = () => finish(true);
    document.addEventListener('keydown', key, true);
  });
  const block = (ev) => { ev.stopImmediatePropagation(); ev.stopPropagation(); if (ev.cancelable) ev.preventDefault(); };
  window.hemmaTap = { ask, modeOf: tapOf };

  const passed = new WeakSet();
  window.addEventListener('hass-action', (ev) => {
    if (passed.has(ev.detail)) return;
    const card = tileOf(ev.composedPath());
    if (!card) return;
    const mode = tapOf(card._stateObj.entity_id);
    if (mode === 'normal') return;
    if (mode === 'view') return block(ev);
    const conf = (ev.detail.config || {})[ev.detail.action + '_action'] || {};
    if (['toggle', 'call-service', 'perform-action'].indexOf(conf.action) < 0) return;
    block(ev);
    const src = ev.composedPath()[0];
    const data = conf.service_data || conf.data;
    ask(T('tap.ask', '{verb} {name}?', { verb: verbFor(conf.service || conf.perform_action, card._stateObj, data), name: nameOf(card) }),
      verbFor(conf.service || conf.perform_action, card._stateObj, data), card).then((yes) => {
      if (!yes || !src.isConnected) return;
      passed.add(ev.detail);
      src.dispatchEvent(new CustomEvent('hass-action', { detail: ev.detail, bubbles: true, composed: true }));
    });
  }, true);

  // Controls drawn inside a tile run their own handlers, so they are gated as they are pressed.
  let pass = null;
  const inline = (ev) => {
    const path = ev.composedPath();
    const el = path.find((n) => n && n.getAttribute && (n.getAttribute('onclick') || n.getAttribute('ontouchend')));
    if (!el || el === pass) return;
    const card = tileOf(path);
    if (!card) return;
    const mode = tapOf(card._stateObj.entity_id);
    if (mode === 'normal') return;
    if (mode === 'view') return block(ev);
    const code = (el.getAttribute('onclick') || '') + (el.getAttribute('ontouchend') || '');
    const call = /callService\('([\w]+)','([\w]+)',(\{[^}]*\})?/.exec(code);
    if (!call) return;
    block(ev);
    let data = null;
    try { data = call[3] ? JSON.parse(call[3].replace(/'/g, '"').replace(/(\w+):/g, '"$1":')) : null; } catch (e) { data = null; }
    const verb = verbFor(call[1] + '.' + call[2], card._stateObj, data);
    ask(T('tap.ask', '{verb} {name}?', { verb, name: nameOf(card) }), verb, card).then((yes) => {
      if (!yes || !el.isConnected) return;
      pass = el;
      try { el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true })); } finally { pass = null; }
    });
  };
  window.addEventListener('touchend', inline, true);
  window.addEventListener('click', inline, true);
})();
