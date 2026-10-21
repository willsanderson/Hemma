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
    .wrap { position: relative; height: var(--hemma-panel-h, min(600px, calc(100svh - 64px))); margin: -8px -8px -20px; width: calc(100% + 16px); overflow: hidden; }
    .page { position: absolute; inset: 0; transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; }
    .main { display: grid; grid-template-rows: auto 1fr auto auto; justify-items: center; gap: 18px; padding: 28px 22px calc(20px + env(safe-area-inset-bottom, 0px)); box-sizing: border-box; }
    .list { transform: translateX(100%); opacity: 0; padding: 18px 16px calc(16px + env(safe-area-inset-bottom, 0px)); box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
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
    .foot { width: 100%; display: flex; justify-content: space-around; align-items: flex-start; }
    .act { display: flex; flex-direction: column; align-items: center; gap: 6px; border: 0; background: none; color: #fff; font: inherit; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .act .o { position: relative; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,0.12); }
    .act .o::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #fff; opacity: 0; transition: opacity .40s ease; }
    @media (hover: hover) { .act:hover .o::after { opacity: .07; transition: opacity .18s ease; } }
    .act:active .o::after { opacity: .12; transition: opacity .08s ease; }
    .act .o i { width: 22px; height: 22px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .act small { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.78); }
    .pill, .gear, .back { border: 0; color: #fff; font: inherit; cursor: pointer; background: rgba(255,255,255,0.10); position: relative; -webkit-tap-highlight-color: transparent; }
    .pill { height: 40px; padding: 0 16px; border-radius: 999px; font-size: 14.5px; font-weight: 600; }
    .gear { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; }
    .gear i { width: 22px; height: 22px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .back { flex: none; align-self: flex-start; width: 44px; height: 44px; padding: 0; border-radius: 50%; display: grid; place-items: center; position: relative;
      background-color: rgba(255,255,255,0.07); background-image: radial-gradient(140% 90% at 50% -20%, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 45%, transparent 62%);
      box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.14); }
    .back svg { width: 11px; height: 18px; display: block; transform: translateX(-1px); }
    .pill::after, .gear::after, .back::after, .sw button:not(.wheel)::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #fff; opacity: 0; transition: opacity .40s ease; pointer-events: none; }
    @media (hover: hover) { .pill:hover::after, .gear:hover::after, .back:hover::after { opacity: .07; transition: opacity .18s ease; } }
    .lst { flex: none; background: rgba(255,255,255,0.10); border-radius: 22px; overflow: hidden; }
    .lr { display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; align-items: center; padding: 10px 14px; position: relative; }
    .lr .tg { width: 34px; height: 34px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; display: grid; place-items: center; background: rgba(0,0,0,0.28); color: rgba(255,255,255,0.55); -webkit-tap-highlight-color: transparent; transition: background-color .2s ease; }
    .lr.on .tg { background: var(--lc); color: #fff; }
    .lr .tg i { width: 18px; height: 18px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .lr .nm { border: 0; background: none; color: inherit; font: inherit; padding: 0; text-align: left; cursor: pointer; min-width: 0; display: grid; }
    .lr .nm small { font-size: 13px; line-height: 1.15; color: rgba(255,255,255,0.6); font-variant-numeric: tabular-nums; }
    .lr .mini { grid-column: 1 / -1; }
    .lr + .lr::before { content: ""; position: absolute; top: 0; left: 14px; right: 14px; height: 0.5px; background: rgba(255,255,255,0.12); }
    .lr b { font-size: 16px; font-weight: 550; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mini { grid-column: 1 / -1; position: relative; height: 30px; border-radius: 10px; background: rgba(0,0,0,0.28); overflow: hidden; cursor: default; touch-action: none; border: 0; padding: 0; }
    .mini .fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--lc); }
    .picker { position: absolute; inset: 0; padding: 26px 22px 20px; box-sizing: border-box; display: grid; grid-template-rows: auto 1fr auto; gap: 16px; justify-items: center; }
    .wheelbig { width: 220px; height: 220px; border-radius: 50%; align-self: center; cursor: default; touch-action: none; border: 0; padding: 0;
      background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 68%), conic-gradient(from 90deg, #ff3b30, #ffcc00, #34c759, #00c3d0, #0088ff, #af52de, #ff3b30); }
    .kbar { width: 100%; height: 56px; border-radius: 999px; align-self: center; cursor: default; touch-action: none; border: 0; padding: 0;
      background: linear-gradient(90deg, ${kelvinRgb(2000)}, ${kelvinRgb(3500)}, #fff, ${kelvinRgb(6500)}); }
    button:focus-visible { outline: 2px solid rgba(255,255,255,0.7); outline-offset: 2px; }
    @media (max-width: 768px) { .main { gap: 26px; padding-top: 36px; } .cap { max-height: 340px; width: 124px; border-radius: 38px; } .h b { font-size: 26px; } .h span { font-size: 17px; } }
  `;
  const CHEV_SVG = '<svg class="chev" viewBox="0 0 7 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l5 5-5 5"/></svg>';
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
        + `<div class="foot">${group ? `<button type="button" class="act lights"><span class="o"><i style="--i:url('${esc(iconUrl('light'))}')"></i></span><small>${esc(T('lights.n_lights', '{n} Lights', { n: ids.length }))}</small></button>` : ''}`
        + `<button type="button" class="act info"><span class="o"><i style="--i:url('${esc(iconUrl('settings'))}')"></i></span><small>${esc(T('lights.settings', 'Settings'))}</small></button></div>`
        + `</div>${group ? `<div class="page list"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}"><svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.4 1.6 1.8 10l8.6 8.4"/></svg></button><div class="lst"></div></div>` : ''}</div>`;
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
      root.querySelector('.info').onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: c.entity }, bubbles: true, composed: true }));
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
          r.innerHTML = `<button type="button" class="tg"><i style="--i:url('${esc(iconUrl('light'))}')"></i></button>`
            + `<button type="button" class="nm"><b></b><small></small></button>`
            + `<button type="button" class="mini" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span></button>`;
          const mini = r.querySelector('.mini');
          r.querySelector('.tg').onclick = () => {
            const on = !r.classList.contains('on');
            r.classList.toggle('on', on);
            r.querySelector('small').textContent = on ? (r._v ? r._v + '%' : '') : T('lights.off', 'Off');
            r.querySelector('.mini .fill').style.width = (on ? (r._v || 100) : 0) + '%';
            r._hold = Date.now() + 2500;
            this._call(on ? 'turn_on' : 'turn_off', { entity_id: id });
          };
          r.querySelector('.nm').onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
          const at = (ev) => {
            const b = mini.getBoundingClientRect();
            const v = Math.round(Math.max(0, Math.min(100, (ev.clientX - b.left) / b.width * 100)));
            r.querySelector('.mini .fill').style.width = v + '%';
            r.querySelector('small').textContent = v ? v + '%' : T('lights.off', 'Off');
            r.classList.toggle('on', v > 0);
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
        r.querySelector('small').textContent = s.state === 'on' ? v + '%' : (this._hass.formatEntityState ? this._hass.formatEntityState(s) : s.state);
        r.classList.toggle('on', s.state === 'on');
        if (v) r._v = v;
        r.querySelector('.tg').setAttribute('aria-label', (s.attributes.friendly_name || ids[i]) + ', ' + (s.state === 'on' ? T('lights.off', 'Off') : T('lights.on', 'On')));
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

  // Panels made of widgets (Energy first): a headline, one chart, two small widgets and a second page, after Apple Home.
  const WIDGET_CSS = `
    :host { display: block; color: #fff; font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); --accent: var(--hemma-color-orange, #FF9230); }
    .wrap { position: relative; max-height: calc(100svh - 64px); min-height: var(--hemma-panel-h, 0px); margin: -8px -8px -20px; width: calc(100% + 16px); overflow: hidden; display: flex; }
    .one { position: relative; flex: 1; max-height: calc(100svh - 64px); }
    @media (max-width: 768px) { .one { padding-top: 32px; padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px)); } }
    .two { position: absolute; inset: 0; }
    .plot { min-height: 96px; }
    .page { transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; box-sizing: border-box;
      padding: 24px 18px 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
    .page::-webkit-scrollbar { display: none; }
    .two { transform: translateX(100%); opacity: 0; }
    .deep .one { transform: translateX(-30%); opacity: 0; pointer-events: none; }
    .deep .two { transform: none; opacity: 1; }
    .h { text-align: center; display: grid; gap: 3px; flex: none; }
    .h b { font-size: 21px; font-weight: 700; letter-spacing: -0.01em; }
    .h span { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.72); }
    .big { flex: none; text-align: center; font-size: 46px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; margin-top: 6px; }
    .big small { font-size: 19px; font-weight: 600; color: rgba(255,255,255,0.7); margin-left: 4px; letter-spacing: 0; }
    .cap { flex: none; text-align: center; font-size: 13.5px; color: rgba(255,255,255,0.7); margin-top: -4px; }
    .seg { flex: none; align-self: center; display: flex; gap: 3px; padding: 3px; background: rgba(255,255,255,0.10); border-radius: 999px; margin-top: 4px; }
    .seg button { border: 0; background: none; color: rgba(255,255,255,0.72); font: inherit; font-size: 13px; font-weight: 600; padding: 6px 13px; border-radius: 999px; cursor: pointer; }
    .seg button[aria-pressed="true"] { background: rgba(255,255,255,0.22); color: #fff; }
    .w { flex: none; background: rgba(255,255,255,0.09); border-radius: 20px; padding: 13px 15px; display: grid; gap: 6px; }
    button.w { border: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    @media (hover: hover) { button.w:hover { background: rgba(255,255,255,0.13); } }
    .plot { position: relative; touch-action: pan-y; }
    .scrub { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .15s ease; }
    .plot.on .scrub { opacity: 1; }
    .scrub .ln { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.5); }
    .scrub .dt { position: absolute; width: 9px; height: 9px; border-radius: 50%; margin: -4.5px 0 0 -4.5px; background: #fff; box-shadow: 0 0 0 2px var(--accent); }
    .scrub .tip { position: absolute; top: -6px; transform: translate(-50%, -100%); white-space: nowrap; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 8px; background: rgba(0,0,0,0.55); font-variant-numeric: tabular-nums; }
    .scrub .tip small { font-weight: 500; color: rgba(255,255,255,0.7); margin-left: 4px; }
    .wt { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.62); display: flex; justify-content: space-between; gap: 8px; font-variant-numeric: tabular-nums; }
    .wv { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .wv small { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.62); margin-left: 3px; }
    .g2 { flex: none; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    svg.chart { display: block; width: 100%; height: 96px; }
    .empty { height: 96px; display: grid; place-items: center; font-size: 13px; color: rgba(255,255,255,0.5); }
    .list { flex: none; background: rgba(255,255,255,0.09); border-radius: 16px; overflow: hidden; }
    .li { display: flex; align-items: center; gap: 12px; padding: 10px 16px; min-height: 56px; position: relative; font-size: 15px; width: 100%; box-sizing: border-box;
      border: 0; background: none; color: inherit; font: inherit; text-align: left; }
    button.li { cursor: pointer; }
    .li + .li::before { content: ""; position: absolute; top: 0; left: 58px; right: 16px; height: 0.5px; background: rgba(255,255,255,0.12); }
    .li.plain + .li.plain::before { left: 16px; }
    .ic { width: 30px; height: 30px; border-radius: 8px; flex: none; display: grid; place-items: center; background: var(--c, var(--accent)); }
    .ic i { width: 18px; height: 18px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .n { flex: 1; min-width: 0; display: grid; }
    .n b { font-size: 16px; font-weight: 550; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .n small { font-size: 13px; line-height: 1.15; color: rgba(255,255,255,0.6); }
    .v { color: rgba(255,255,255,0.65); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .chev { width: 7px; height: 12px; flex: none; color: rgba(255,255,255,0.35); }
    .back { flex: none; align-self: flex-start; border: 0; color: #fff; cursor: pointer; width: 44px; height: 44px; padding: 0; border-radius: 50%; display: grid; place-items: center; position: relative;
      background-color: rgba(255,255,255,0.07); background-image: radial-gradient(140% 90% at 50% -20%, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 45%, transparent 62%);
      box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.14); }
    .back svg { width: 11px; height: 18px; display: block; transform: translateX(-1px); }
    @media (hover: hover) { button.li:hover, .back:hover, .seg button:not([aria-pressed="true"]):hover { background: rgba(255,255,255,0.06); } }
    button:focus-visible { outline: 2px solid rgba(255,255,255,0.7); outline-offset: -2px; }
  `;
  const BACK_SVG = '<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.4 1.6 1.8 10l8.6 8.4"/></svg>';
  const DEVICE_HUES = ['var(--hemma-color-orange, #FF9230)', 'var(--hemma-color-blue, #0088FF)', 'var(--hemma-color-teal, #00C3D0)',
    'var(--hemma-color-purple, #9333ea)', 'var(--hemma-color-yellow, #FFCC00)', 'var(--hemma-color-green, #30D158)', 'var(--hemma-color-pink, #ff4d70)'];
  const num = (st) => { const n = st ? parseFloat(st.state) : NaN; return Number.isFinite(n) ? n : null; };
  const watts = (st) => {
    const n = num(st);
    if (n == null) return null;
    const u = String((st.attributes || {}).unit_of_measurement || 'W');
    return u === 'kW' ? n * 1000 : n;
  };
  const powerParts = (w) => (w == null ? ['—', ''] : w >= 1000 ? [(w / 1000).toFixed(w >= 10000 ? 1 : 2), 'kW'] : [String(Math.round(w)), 'W']);
  // A chart answers the pointer: a line, a dot and the reading at that time, as the old popups' charts did.
  const scrub = (plot, series, fmtV, fmtT) => {
    if (!series || series.length < 2) return;
    const vals = series.map((p) => p.v), max = Math.max(...vals) || 1, min = Math.min(0, ...vals), pad = 4, H = 96;
    const layer = document.createElement('div');
    layer.className = 'scrub';
    layer.innerHTML = '<div class="ln"></div><div class="dt"></div><div class="tip"></div>';
    plot.appendChild(layer);
    const ln = layer.querySelector('.ln'), dt = layer.querySelector('.dt'), tip = layer.querySelector('.tip');
    const move = (ev) => {
      const r = plot.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const i = Math.round(f * (series.length - 1)), p = series[i];
      const x = (i / (series.length - 1)) * r.width;
      const y = (H - pad - ((p.v - min) / (max - min || 1)) * (H - pad * 2)) / H * r.height;
      ln.style.left = x + 'px'; dt.style.left = x + 'px'; dt.style.top = y + 'px';
      tip.style.left = Math.max(44, Math.min(r.width - 44, x)) + 'px';
      tip.innerHTML = `${esc(fmtV(p.v))}<small>${esc(fmtT(p.t))}</small>`;
      plot.classList.add('on');
    };
    plot.addEventListener('pointermove', move);
    plot.addEventListener('pointerdown', move);
    plot.addEventListener('pointerleave', () => plot.classList.remove('on'));
    plot.addEventListener('pointerup', (ev) => { if (ev.pointerType !== 'mouse') setTimeout(() => plot.classList.remove('on'), 1200); });
  };
  const chartSvg = (pts, color) => {
    if (!pts || pts.length < 2) return null;
    const W = 300, H = 96, pad = 4;
    const max = Math.max(...pts) || 1, min = Math.min(0, ...pts);
    const x = (i) => (i / (pts.length - 1)) * W;
    const y = (v) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
    const line = pts.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">`
      + `<stop offset="0" style="stop-color:${color};stop-opacity:.5"/><stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs>`
      + `<path d="${line} L${W} ${H} L0 ${H} Z" fill="url(#${id})"/><path d="${line}" fill="none" style="stroke:${color}" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
      + `<circle cx="${x(pts.length - 1).toFixed(1)}" cy="${y(pts[pts.length - 1]).toFixed(1)}" r="4" style="fill:${color}"/></svg>`;
  };
  class HemmaEnergyPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._range = 'day'; this._series = {}; }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    _tier(w) {
      const c = this._config;
      if (w == null) return '';
      if (w >= (c.extreme_threshold || 3000)) return T('energy.extreme', 'Extreme');
      if (w >= (c.heavy_threshold || 1000)) return T('energy.heavy', 'Heavy');
      if (w >= (c.normal_threshold || 200)) return T('energy.normal', 'Normal');
      return T('energy.idle', 'Idle');
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const root = this.shadowRoot;
      root.innerHTML = `<style>${WIDGET_CSS}</style><div class="wrap"><div class="page one">`
        + `<div class="h"><b>${esc(this._config.name || T('filter.energy', 'Energy'))}</b><span class="tier"></span></div>`
        + `<div class="big"></div><div class="cap">${esc(T('energy.current_draw', 'Current draw'))}</div>`
        + `<div class="seg" role="group">${[['day', T('energy.today', 'Today')], ['week', T('energy.week', 'Week')], ['month', T('energy.month', 'Month')]]
          .map(([k, l]) => `<button type="button" data-r="${k}" aria-pressed="${k === this._range}">${esc(l)}</button>`).join('')}</div>`
        + `<div class="w"><div class="plot"></div><div class="wt axis"></div></div>`
        + `<div class="g2"><button type="button" class="w a"></button><button type="button" class="w b"></button></div>`
        + `<div class="list"><button type="button" class="li plain top"><span class="n"><b>${esc(T('energy.top_devices', 'Top devices'))}</b></span><span class="v cnt"></span>${CHEV_SVG}</button></div>`
        + `</div><div class="page two"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button>`
        + `<div class="h"><b>${esc(T('energy.top_devices', 'Top devices'))}</b><span>${esc(T('energy.now', 'Now'))}</span></div><div class="list devs"></div></div></div>`;
      root.querySelectorAll('.seg button').forEach((b) => { b.onclick = () => { this._range = b.dataset.r; root.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); this._load(); }; });
      const wrap = root.querySelector('.wrap');
      root.querySelector('.top').onclick = () => { this._devices(); wrap.classList.add('deep'); };
      root.querySelector('.back').onclick = () => wrap.classList.remove('deep');
      const info = (id) => id && this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
      const cc = this._config;
      root.querySelector('.w.a').onclick = () => info(cc.entity_usage_today || cc.entity_cost_today);
      root.querySelector('.w.b').onclick = () => info(cc.entity_cost_month || cc.entity_usage_month);
      root.querySelector('.big').onclick = () => info(cc.entity_power);
      root.querySelector('.big').style.cursor = 'pointer';
      if (!(this._config.power_entities || []).length) root.querySelector('.list').style.display = 'none';
      this._paint();
      this._load();
    }
    async _load() {
      const id = this._config.entity_power;
      const plot = this.shadowRoot.querySelector('.plot'), axis = this.shadowRoot.querySelector('.axis');
      if (!id || !this._hass.callWS) { plot.innerHTML = `<div class="empty">—</div>`; return; }
      const r = this._range;
      const now = new Date();
      const start = r === 'day' ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : new Date(now.getTime() - (r === 'week' ? 7 : 30) * 864e5);
      const key = r + start.toDateString();
      if (!this._series[key]) {
        this._series[key] = this._hass.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(),
          statistic_ids: [id], period: r === 'month' ? 'day' : 'hour', types: ['mean'] })
          .then((res) => ((res && res[id]) || []).filter((p) => p.mean != null).map((p) => ({ t: p.start, v: p.mean }))).catch(() => []);
      }
      const series = await this._series[key];
      if (this._range !== r) return;
      const svg = chartSvg(series.map((p) => p.v), 'var(--accent)');
      plot.innerHTML = svg || `<div class="empty">${esc(T('energy.no_history', 'No history yet'))}</div>`;
      const fmt = (d, o) => d.toLocaleString(this._hass.locale && this._hass.locale.language || undefined, o);
      if (svg) scrub(plot, series, (v) => powerParts(v).join(' '), (t) => fmt(new Date(t), r === 'month' ? { month: 'short', day: 'numeric' } : r === 'week' ? { weekday: 'short', hour: 'numeric' } : { hour: 'numeric', minute: '2-digit' }));
      axis.innerHTML = r === 'day'
        ? `<span>${fmt(start, { hour: 'numeric' })}</span><span>${esc(T('energy.now', 'Now'))}</span>`
        : `<span>${fmt(start, { month: 'short', day: 'numeric' })}</span><span>${esc(T('energy.now', 'Now'))}</span>`;
    }
    _paint() {
      const c = this._config, S = this._hass.states, root = this.shadowRoot;
      const big = root.querySelector('.big');
      if (!big) return;
      const w = watts(S[c.entity_power]);
      const [v, u] = powerParts(w);
      big.innerHTML = `${esc(v)}<small>${esc(u)}</small>`;
      root.querySelector('.tier').textContent = this._tier(w);
      const unit = (st, d) => (st && st.attributes.unit_of_measurement) || d;
      const val = (st, digits) => { const n = num(st); return n == null ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }); };
      // A currency reads $34.55 with the cents quieter, as Apple's widgets set money.
      const money = (st) => {
        const n = num(st), u = unit(st, '');
        if (n == null) return '—';
        const sym = /^[$€£¥₩₹]$/.test(u) ? u : null;
        const [w, f] = n.toFixed(2).split('.');
        const whole = Number(w).toLocaleString();
        return sym ? `${esc(sym)}${esc(whole)}<small style="margin-left:0">.${f}</small>` : `${esc(whole)}.${f}<small>${esc(u)}</small>`;
      };
      const a = root.querySelector('.w.a'), b = root.querySelector('.w.b');
      const today = S[c.entity_usage_today], costToday = S[c.entity_cost_today];
      a.innerHTML = `<div class="wt">${esc(T('energy.today', 'Today'))}</div><div class="wv">${today ? esc(val(today, 1)) + `<small>${esc(unit(today, 'kWh'))}</small>` : costToday ? money(costToday) : '—'}</div>`;
      const costMonth = S[c.entity_cost_month], month = S[c.entity_usage_month];
      b.innerHTML = `<div class="wt">${esc(T('energy.this_month', 'This month'))}</div><div class="wv">${costMonth ? money(costMonth) : month ? esc(val(month, 0)) + `<small>${esc(unit(month, 'kWh'))}</small>` : '—'}</div>`;
      const cnt = root.querySelector('.cnt');
      if (cnt) cnt.textContent = String((c.power_entities || []).filter((id) => S[id]).length);
      if (root.querySelector('.wrap.deep')) this._devices();
    }
    _devices() {
      const c = this._config, S = this._hass.states;
      const total = watts(S[c.entity_power]);
      const rows = (c.power_entities || []).filter((id) => S[id]).map((id) => ({ id, w: watts(S[id]) || 0 })).filter((r) => r.w > 0).sort((x, y) => y.w - x.w);
      const nameOf = (id) => { const nm = (this._hass.entities && this._hass.entities[id] && this._hass.entities[id].name) || S[id].attributes.friendly_name || id; return String(nm).replace(/\s*power$/i, '').trim() || nm; };
      const icons = c.power_icons || {};
      this.shadowRoot.querySelector('.devs').innerHTML = rows.map((r, i) => {
        const [v, u] = powerParts(r.w);
        const share = total ? Math.round((r.w / total) * 100) : null;
        return `<button type="button" class="li" data-id="${esc(r.id)}" style="--c:${DEVICE_HUES[i % DEVICE_HUES.length]}"><span class="ic"><i style="--i:url('${esc(iconUrl(icons[r.id] || 'plug'))}')"></i></span>`
          + `<span class="n"><b>${esc(nameOf(r.id))}</b>${share != null && r.w > 0 ? `<small>${esc(T('energy.pct_of_draw', '{n}% of current draw', { n: share }))}</small>` : ''}</span>`
          + `<span class="v">${esc(v)} ${esc(u)}</span></button>`;
      }).join('');
      this.shadowRoot.querySelectorAll('.devs .li').forEach((b) => { b.onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: b.dataset.id }, bubbles: true, composed: true })); });
    }
  }
  if (!customElements.get('hemma-energy-panel')) customElements.define('hemma-energy-panel', HemmaEnergyPanel);

  const COMFORT_F = { veryCold: 65, cool: 70, comfortable: 76, warm: 81, hot: 85 };
  const COMFORT_C = { veryCold: 18, cool: 21, comfortable: 24, warm: 27, hot: 29 };
  const comfortWord = (v, unit) => {
    if (v == null) return '';
    const t = /F/i.test(unit || '') ? COMFORT_F : COMFORT_C;
    return v <= t.veryCold ? T('temp.very_cold', 'Very Cold') : v <= t.cool ? T('temp.cool', 'Cool') : v <= t.comfortable ? T('temp.comfortable', 'Comfortable')
      : v <= t.warm ? T('temp.warm', 'Warm') : v <= t.hot ? T('temp.hot', 'Hot') : T('temp.very_hot', 'Very Hot');
  };
  // Thresholds as the old climate popup set them, so a reading is judged the same way everywhere.
  const sensorKind = (st, id) => {
    const a = (st && st.attributes) || {};
    const dc = String(a.device_class || '').toLowerCase(), i = String(id || '').toLowerCase(), u = String(a.unit_of_measurement || '');
    if (dc === 'pm25' || /pm25|pm2_5/.test(i)) return { label: 'PM2.5', good: 12, mod: 35.4 };
    if (dc === 'pm10' || /pm10/.test(i)) return { label: 'PM10', good: 54, mod: 154 };
    if (dc === 'carbon_dioxide' || /co2|carbon/.test(i)) return { label: 'CO₂', good: 1000, mod: 1500 };
    if (dc.includes('volatile') || /voc/.test(i)) return /index/i.test(u) || /_index$/.test(i) ? { label: 'VOC', good: 6, mod: 8 } : { label: 'VOC', good: 100, mod: 200 };
    if (dc === 'nitrogen_dioxide' || /no2/.test(i)) return { label: 'NO₂', good: 53, mod: 100 };
    return { label: a.friendly_name || id, good: null, mod: null };
  };
  const toneOf = (n, k) => (n == null || k.good == null ? '' : n <= k.good ? 'var(--hemma-color-green, #30D158)' : n <= k.mod ? 'var(--hemma-color-yellow, #FFCC00)' : 'var(--hemma-color-red, #FF4245)');
  const AIR_WORDS = { excellent: ['air_quality.excellent', 'Excellent', 'air_quality.is_great', 'Air quality is great', 'g'],
    good: ['air_quality.good', 'Good', 'air_quality.is_good', 'Air quality is good', 'g'],
    moderate: ['air_quality.moderate', 'Moderate', 'air_quality.is_moderate', 'Air quality is moderate', 'y'],
    fair: ['air_quality.fair', 'Fair', 'air_quality.is_moderate', 'Air quality is moderate', 'y'],
    poor: ['air_quality.poor', 'Poor', 'air_quality.consider_ventilating', 'Consider ventilating', 'r'],
    bad: ['air_quality.bad', 'Bad', 'air_quality.ventilate_now', 'Ventilate now', 'r'] };
  const AIR_TONES = { g: 'var(--hemma-color-green, #30D158)', y: 'var(--hemma-color-yellow, #FFCC00)', r: 'var(--hemma-color-red, #FF4245)' };
  class HemmaClimatePanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._series = {}; }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    _sensors() { const S = this._hass.states; return (this._config.sensors || []).filter((id) => id && S[id] && num(S[id]) != null); }
    _air() {
      const S = this._hass.states, q = S[this._config.entity_quality];
      if (!q) return null;
      const w = AIR_WORDS[String(q.state).toLowerCase()];
      if (w) return { value: T(w[0], w[1]), unit: '', advice: T(w[2], w[3]), tone: AIR_TONES[w[4]] };
      const n = num(q);
      if (n == null) return null;
      const k = n <= 50 ? 'g' : n <= 100 ? 'y' : 'r';
      return { value: String(Math.round(n)), unit: q.attributes.unit_of_measurement || 'AQI', advice: k === 'g' ? T('air_quality.is_great', 'Air quality is great') : k === 'y' ? T('air_quality.is_moderate', 'Air quality is moderate') : T('air_quality.consider_ventilating', 'Consider ventilating'), tone: AIR_TONES[k] };
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const root = this.shadowRoot, c = this._config;
      const name = c.name || T('filter.climate', 'Climate');
      root.innerHTML = `<style>${WIDGET_CSS} :host { --accent: var(--hemma-color-teal, #00C3D0); } .wv.t { color: var(--tone, #fff); }
        .charts { display: flex; flex-direction: column; gap: 10px; flex: none; }
        .hc { gap: 10px; padding-top: 10px; }
        .hh { display: flex; align-items: center; gap: 10px; border: 0; background: none; color: inherit; font: inherit; padding: 0; cursor: pointer; text-align: left; }
        .hh b { flex: 1; font-size: 15px; font-weight: 600; }
        .hi { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; background: var(--c); flex: none; }
        .hi i { width: 16px; height: 16px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
        .hv { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
        .hv small { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.6); margin-left: 3px; }</style>`
        + `<div class="wrap"><div class="page one"><div class="h"><b>${esc(name)}</b><span>${esc(T('filter.climate', 'Climate'))}</span></div>`
        + `<div class="big"></div><div class="cap sum"></div><div class="g2 tiles"></div>`
        + `<div class="list"><button type="button" class="li plain hist"><span class="n"><b>${esc(T('climate.history_24h', '24-hour history'))}</b></span>${CHEV_SVG}</button></div>`
        + `</div><div class="page two"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button>`
        + `<div class="h"><b>${esc(T('climate.history_24h', '24-hour history'))}</b></div><div class="charts"></div></div></div>`;
      const wrap = root.querySelector('.wrap');
      root.querySelector('.hist').onclick = () => { this._history(); wrap.classList.add('deep'); };
      root.querySelector('.back').onclick = () => wrap.classList.remove('deep');
      this._paint();
    }
    _paint() {
      const c = this._config, S = this._hass.states, root = this.shadowRoot;
      const big = root.querySelector('.big');
      if (!big) return;
      const t = S[c.entity_temp], tv = num(t), tu = (t && t.attributes.unit_of_measurement) || '°';
      big.innerHTML = tv == null ? '—' : `${Math.round(tv)}<small>${esc(tu)}</small>`;
      const air = this._air();
      root.querySelector('.sum').textContent = [comfortWord(tv, tu), air && air.advice].filter(Boolean).join(' · ');
      const tiles = [];
      const h = S[c.entity_humidity];
      if (h && num(h) != null) tiles.push({ id: c.entity_humidity, label: T('humidity.title', 'Humidity'), value: String(Math.round(num(h))), unit: '%' });
      if (air) tiles.push({ id: c.entity_quality, label: T('air_quality.label', 'Air quality'), value: air.value, unit: air.unit, tone: air.tone });
      const kinds = new Set();
      this._sensors().filter((id) => id !== c.entity_quality).forEach((id) => {
        const st = S[id], k = sensorKind(st, id), n = num(st);
        if (kinds.has(k.label)) return;
        kinds.add(k.label);
        tiles.push({ id, label: k.label, value: n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10), unit: st.attributes.unit_of_measurement || '', tone: toneOf(n, k) });
      });
      root.querySelector('.tiles').innerHTML = tiles.slice(0, 4).map((x) => `<button type="button" class="w" data-id="${esc(x.id)}">`
        + `<div class="wt">${esc(x.label)}</div><div class="wv t" style="--tone:${x.tone || '#fff'}">${esc(x.value)}<small>${esc(x.unit)}</small></div></button>`).join('');
      root.querySelectorAll('.tiles .w').forEach((b) => { b.onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: b.dataset.id }, bubbles: true, composed: true })); });
      root.querySelector('.list').style.display = this._ids().length ? '' : 'none';
    }
    _ids() {
      const c = this._config, S = this._hass.states, kinds = new Set();
      const once = this._sensors().filter((id) => { const k = sensorKind(S[id], id).label; if (kinds.has(k)) return false; kinds.add(k); return true; });
      return [c.entity_temp, c.entity_humidity, ...once].filter((id, i, a) => id && S[id] && num(S[id]) != null && a.indexOf(id) === i);
    }
    _look(id) {
      const c = this._config, S = this._hass.states;
      if (id === c.entity_temp) return { label: T('temp.title', 'Temperature'), icon: 'temp-medium', color: 'var(--hemma-color-orange, #FF9230)' };
      if (id === c.entity_humidity) return { label: T('humidity.title', 'Humidity'), icon: 'humidity', color: 'var(--hemma-color-ice, #3cd3fe)' };
      const k = sensorKind(S[id], id);
      const by = { 'CO₂': ['co2-fill', 'var(--hemma-color-green, #30D158)'], 'PM2.5': ['allergens-fill', 'var(--hemma-color-purple, #af52de)'],
        'PM10': ['allergens', 'var(--hemma-color-pink, #ff4d70)'], 'VOC': ['aqi-medium', 'var(--hemma-color-yellow, #FFCC00)'], 'NO₂': ['aqi-high', 'var(--hemma-color-amber, #ffb254)'] };
      const [icon, color] = by[k.label] || ['aqi-low', 'var(--hemma-color-teal, #00C3D0)'];
      return { label: k.label, icon, color };
    }
    async _history() {
      const box = this.shadowRoot.querySelector('.charts');
      const ids = this._ids(), S = this._hass.states;
      box.innerHTML = ids.map((id) => {
        const l = this._look(id), st = S[id], u = st.attributes.unit_of_measurement || '', n = num(st);
        const v = n == null ? st.state : (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10);
        return `<div class="w hc" data-id="${esc(id)}" style="--accent:${l.color}">`
          + `<button type="button" class="hh"><span class="hi" style="--c:${l.color}"><i style="--i:url('${esc(iconUrl(l.icon))}')"></i></span><b>${esc(l.label)}</b>`
          + `<span class="hv">${esc(String(v))}<small>${esc(u)}</small></span>${CHEV_SVG}</button><div class="plot"></div></div>`;
      }).join('');
      box.querySelectorAll('.hh').forEach((b) => { b.onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: b.parentElement.dataset.id }, bubbles: true, composed: true })); });
      if (!this._hass.callWS) return;
      const start = new Date(Date.now() - 864e5).toISOString();
      if (!this._series[start.slice(0, 13)]) {
        this._series[start.slice(0, 13)] = this._hass.callWS({ type: 'recorder/statistics_during_period', start_time: start, statistic_ids: ids, period: 'hour', types: ['mean'] }).catch(() => ({}));
      }
      const res = await this._series[start.slice(0, 13)];
      const lang = (this._hass.locale && this._hass.locale.language) || undefined;
      box.querySelectorAll('.hc').forEach((w) => {
        const id = w.dataset.id, u = S[id].attributes.unit_of_measurement || '';
        const series = ((res && res[id]) || []).filter((p) => p.mean != null).map((p) => ({ t: p.start, v: p.mean }));
        const plot = w.querySelector('.plot');
        const svg = chartSvg(series.map((p) => p.v), w.style.getPropertyValue('--accent'));
        plot.innerHTML = svg || `<div class="empty">${esc(T('energy.no_history', 'No history yet'))}</div>`;
        if (svg) scrub(plot, series, (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10) + (u ? ' ' + u : ''), (t) => new Date(t).toLocaleString(lang, { hour: 'numeric', minute: '2-digit' }));
      });
    }
  }
  if (!customElements.get('hemma-climate-panel')) customElements.define('hemma-climate-panel', HemmaClimatePanel);

  const mbps = (st) => {
    const n = num(st);
    if (n == null) return null;
    const u = String((st.attributes || {}).unit_of_measurement || 'Mbit/s');
    return /^kbit|^kb/i.test(u) ? n / 1000 : /^gbit|^gb/i.test(u) ? n * 1000 : /B\/s$/.test(u) && !/bit/i.test(u) ? n * 8 : n;
  };
  const mbpsText = (v) => (v == null ? '—' : v >= 100 ? String(Math.round(v)) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
  class HemmaNetworkPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._series = null; }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    _tier(v) {
      const c = this._config;
      if (v == null) return T('network.connected', 'Connected');
      if (v < (c.idle_threshold || 1)) return T('network.connection_idle', 'Connection idle');
      if (v < (c.light_threshold || 10)) return T('network.light', 'Light');
      if (v < (c.heavy_threshold || 50)) return T('network.active', 'Active');
      return T('network.heavy', 'Heavy');
    }
    _actions() {
      const c = this._config, S = this._hass.states;
      return [1, 2].map((i) => ({ id: c['action_' + i + '_entity'], label: c['action_' + i + '_label'], status: c['action_' + i + '_status'],
        confirm: c['action_' + i + '_confirm_helper'] || ('input_boolean.hemma_restart_confirm_' + i), done: c['action_' + i + '_done_helper'] || ('input_boolean.hemma_restart_done_' + i) }))
        .filter((a) => a.id && S[a.id]);
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const root = this.shadowRoot, c = this._config;
      const name = c.name || T('network.title', 'Network');
      root.innerHTML = `<style>${WIDGET_CSS} :host { --accent: var(--hemma-color-blue, #0088FF); }
        .acts { flex: none; display: flex; gap: 10px; }
        .acts button { flex: 1; height: 46px; border: 0; border-radius: 999px; color: #fff; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; background: rgba(255,255,255,0.12); transition: background-color .3s ease; }
        .acts button.arm { background: var(--hemma-color-red, #FF4245); }
        .acts button.done { background: var(--hemma-color-green, #30D158); }
        @media (hover: hover) { .acts button:not(.arm):not(.done):hover { background: rgba(255,255,255,0.18); } }</style>`
        + `<div class="wrap"><div class="page one"><div class="h"><b>${esc(name)}</b><span class="tier"></span></div>`
        + `<div class="g2"><button type="button" class="w dl"></button><button type="button" class="w ul"></button></div>`
        + `<div class="w"><div class="plot"></div><div class="wt axis"></div></div>`
        + `<div class="list stats"></div><div class="acts"></div></div></div>`;
      const info = (id) => id && this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
      root.querySelector('.w.dl').onclick = () => info(c.entity_download);
      root.querySelector('.w.ul').onclick = () => info(c.entity_upload);
      this._paint();
      this._load();
    }
    async _load() {
      const c = this._config, id = c.entity_download, plot = this.shadowRoot.querySelector('.plot');
      if (!id || !this._hass.callWS) return;
      const start = new Date(Date.now() - 36e5);
      if (!this._series) {
        this._series = this._hass.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), entity_ids: [id], minimal_response: true, no_attributes: true })
          .then((res) => ((res && res[id]) || []).map((p) => ({ t: Math.round(Number(p.lu || p.lc) * 1000), v: parseFloat(p.s) })).filter((p) => Number.isFinite(p.v))).catch(() => []);
      }
      const series = await this._series;
      const svg = chartSvg(series.map((p) => p.v), 'var(--accent)');
      plot.innerHTML = svg || `<div class="empty">${esc(T('energy.no_history', 'No history yet'))}</div>`;
      const lang = (this._hass.locale && this._hass.locale.language) || undefined;
      if (svg) scrub(plot, series, (v) => mbpsText(v) + ' Mbit/s', (t) => new Date(t).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }));
      this.shadowRoot.querySelector('.axis').innerHTML = `<span>${esc(T('network.hour_ago', '1 hour ago'))}</span><span>${esc(T('energy.now', 'Now'))}</span>`;
    }
    _paint() {
      const c = this._config, S = this._hass.states, root = this.shadowRoot;
      const dlBox = root.querySelector('.w.dl');
      if (!dlBox) return;
      const dl = mbps(S[c.entity_download]), ul = mbps(S[c.entity_upload]);
      const status = S[c.entity_status];
      root.querySelector('.tier').textContent = status && !/^(on|connected|online|up)$/i.test(status.state) ? (this._hass.formatEntityState ? this._hass.formatEntityState(status) : status.state) : this._tier(dl);
      const box = (label, v) => `<div class="wt">${esc(label)}</div><div class="wv">${esc(mbpsText(v))}<small>Mbit/s</small></div>`;
      dlBox.innerHTML = box(T('network.download', 'Download'), dl);
      root.querySelector('.w.ul').innerHTML = box(T('network.upload', 'Upload'), ul);
      // The old popup's own labels: stat 1/2 are wired, 3/4 Wi-Fi.
      const stats = [[c.entity_ping, T('network.ping', 'Ping'), 'network'], [c.entity_stat_1, T('network.wired_download', 'Wired download'), 'arrow-down'],
        [c.entity_stat_2, T('network.wired_upload', 'Wired upload'), 'arrow-up'], [c.entity_stat_3, T('network.wifi_download', 'Wi-Fi download'), 'wifi'],
        [c.entity_stat_4, T('network.wifi_upload', 'Wi-Fi upload'), 'wifi']].filter(([id]) => id && S[id] && id !== c.entity_upload && id !== c.entity_download);
      const list = root.querySelector('.stats');
      list.style.display = stats.length ? '' : 'none';
      list.innerHTML = stats.map(([id, label, icon], i) => {
        const st = S[id], v = this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state;
        return `<button type="button" class="li" data-id="${esc(id)}" style="--c:${['var(--hemma-color-green, #30D158)', 'var(--hemma-color-blue, #0088FF)', 'var(--hemma-color-teal, #00C3D0)', 'var(--hemma-color-ice, #3cd3fe)', 'var(--hemma-color-purple, #9333ea)'][i % 5]}"><span class="ic"><i style="--i:url('${esc(iconUrl(icon))}')"></i></span><span class="n"><b>${esc(label)}</b></span><span class="v">${esc(v)}</span>${CHEV_SVG}</button>`;
      }).join('');
      list.querySelectorAll('.li').forEach((b) => { b.onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: b.dataset.id }, bubbles: true, composed: true })); });
      const acts = root.querySelector('.acts');
      const A = this._actions();
      acts.style.display = A.length ? '' : 'none';
      acts.innerHTML = A.map((a, i) => {
        const armed = S[a.confirm] && S[a.confirm].state === 'on', done = S[a.done] && S[a.done].state === 'on';
        const label = done ? T('network.restarting', 'Restarting…') : armed ? T('network.confirm', 'Confirm') : (a.label || (S[a.id].attributes.friendly_name || a.id));
        return `<button type="button" data-i="${i}" class="${done ? 'done' : armed ? 'arm' : ''}">${esc(label)}</button>`;
      }).join('');
      acts.querySelectorAll('button').forEach((b) => {
        const a = A[Number(b.dataset.i)];
        b.onclick = () => {
          const hasHelpers = S[a.confirm] && S[a.done];
          const call = hasHelpers ? this._hass.callService('script', 'turn_on', { entity_id: 'script.hemma_restart_toggle', variables: { button_entity: a.id, helper_entity: a.confirm, done_entity: a.done } })
            : this._hass.callService('button', 'press', { entity_id: a.id });
          Promise.resolve(call).catch(() => {});
        };
      });
    }
  }
  if (!customElements.get('hemma-network-panel')) customElements.define('hemma-network-panel', HemmaNetworkPanel);

  class HemmaRecentPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { const first = !this._hass; this._hass = h; if (first || !this._built) this._build(); }
    _items() {
      const S = this._hass.states, c = this._config;
      const rows = (id, tv) => { const d = S[id] && S[id].attributes && S[id].attributes.data; return Array.isArray(d) ? d.slice(1).filter((i) => i && i.title).map((i) => ({ ...i, tv })) : []; };
      const days = c.days || 3, cut = Date.now() - days * 864e5;
      const all = rows(c.movies_entity || 'sensor.recently_added_movies', false).concat(rows(c.tv_entity || 'sensor.recently_added_tv', true))
        .filter((i) => i.airdate && new Date(i.airdate).getTime() >= cut).sort((a, b) => new Date(b.airdate) - new Date(a.airdate));
      return { movies: all.filter((i) => !i.tv), shows: all.filter((i) => i.tv) };
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const root = this.shadowRoot, { movies, shows } = this._items();
      const url = (raw) => (!raw ? '' : String(raw).startsWith('/') ? location.origin + raw : String(raw));
      const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
      const sub = (i) => i.tv ? [clean(i.number), clean(i.episode)].filter(Boolean).join(' · ') : ((String(i.aired || '').match(/^(\d{4})/) || [])[1] || '');
      const first = (i) => i.tv ? clean(i.number) : ((String(i.aired || '').match(/^(\d{4})/) || [])[1] || clean(i.genres).split(',')[0] || '');
      const second = (i) => i.tv ? (clean(i.episode) && clean(i.episode).toLowerCase() !== clean(i.title).toLowerCase() ? clean(i.episode) : '') : '';
      const ago = (iso) => { const h = (Date.now() - new Date(iso).getTime()) / 36e5; return h < 1 ? T('time.just_now', 'just now') : h < 24 ? T('time.short.hours', '{n}h ago', { n: Math.floor(h) }) : T('time.short.days', '{n}d ago', { n: Math.floor(h / 24) }); };
      this._list = movies.concat(shows);
      const shelf = (label, list) => !list.length ? '' : `<div class="sh"><div class="wt" style="padding:0 4px"><span>${esc(label)}</span></div><div class="row">`
        + list.map((i) => `<button type="button" class="po" data-k="${this._list.indexOf(i)}"><span class="art" style="background-image:url('${esc(url(i.poster || i.fanart))}')"></span><b>${esc(clean(i.title))}</b><small>${esc(first(i) || ago(i.airdate))}</small>${second(i) ? `<small class="ep">${esc(second(i))}</small>` : ''}</button>`).join('')
        + `</div></div>`;
      const n = this._list.length;
      root.innerHTML = `<style>${WIDGET_CSS} :host { --accent: var(--hemma-color-gold, #e5a00d); }
        .sh { flex: none; display: grid; gap: 8px; }
        .row { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; padding: 2px 2px 4px; margin: 0 -2px; }
        .row::-webkit-scrollbar { display: none; }
        .po { flex: none; width: 116px; scroll-snap-align: start; display: flex; flex-direction: column; gap: 3px; border: 0; background: none; color: #fff; font: inherit; padding: 0; text-align: left; cursor: pointer; }
        .po .art { margin-bottom: 6px; }
        .art { display: block; aspect-ratio: 2 / 3; width: 100%; border-radius: 12px; background: rgba(255,255,255,0.08) center / cover no-repeat; }
        .po b { font-size: 14px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .po small { font-size: 12.5px; line-height: 1.25; color: rgba(255,255,255,0.62); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .po small.ep { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; color: rgba(255,255,255,0.8); }
        .row { gap: 14px; }
        @media (hover: hover) { .po:hover .art { filter: brightness(1.08); } }
        .det { display: grid; gap: 10px; }
        .det .fan { aspect-ratio: 16 / 9; max-width: 100%; border-radius: 18px; background: rgba(255,255,255,0.08) center / cover no-repeat; }
        .det b { font-size: 20px; font-weight: 700; }
        .det .meta { font-size: 13.5px; color: rgba(255,255,255,0.7); }
        .det p { margin: 0; font-size: 14.5px; line-height: 1.45; color: rgba(255,255,255,0.85); }
        .none { flex: none; text-align: center; color: rgba(255,255,255,0.6); font-size: 14px; padding: 18px 0 8px; }</style>`
        + `<div class="wrap"><div class="page one"><div class="h"><b>${esc(T('plex.recently_added', 'Recently Added'))}</b><span>${esc(n ? T('plex.n_new', '{n} new', { n }) : T('plex.up_to_date', 'Up to date'))}</span></div>`
        + (n ? shelf(T('plex.movies', 'Movies'), movies) + shelf(T('plex.tv_shows', 'TV Shows'), shows) : `<div class="none">${esc(T('plex.nothing_added', 'Nothing recently added'))}</div>`)
        + `</div><div class="page two"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button><div class="det"></div></div></div>`;
      const wrap = root.querySelector('.wrap');
      root.querySelectorAll('.po').forEach((b) => { b.onclick = () => {
        const i = this._list[Number(b.dataset.k)];
        const meta = [sub(i), clean(i.genres), i.runtime ? i.runtime + ' min' : '', clean(i.rating), ago(i.airdate)].filter(Boolean).join(' · ');
        root.querySelector('.det').innerHTML = `<span class="fan" style="background-image:url('${esc(url(i.fanart || i.art || i.poster))}')"></span><b>${esc(clean(i.title))}</b><span class="meta">${esc(meta)}</span>${i.summary ? `<p>${esc(clean(i.summary))}</p>` : ''}`;
        wrap.classList.add('deep');
      }; });
      root.querySelector('.back').onclick = () => wrap.classList.remove('deep');
    }
  }
  if (!customElements.get('hemma-recent-panel')) customElements.define('hemma-recent-panel', HemmaRecentPanel);

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
