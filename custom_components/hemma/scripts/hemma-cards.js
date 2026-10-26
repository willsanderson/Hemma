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
  const kelvinArr = (k) => {
    const t = k / 100;
    const r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
    const g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755);
    const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
    const c = (v) => Math.round(Math.max(0, Math.min(255, v)));
    return [c(r), c(g), c(b)];
  };
  const kelvinRgb = (k) => `rgb(${kelvinArr(k).join(', ')})`;
  const HA_FAV_RGB = [[127, 172, 255], [215, 150, 255], [255, 158, 243], [255, 110, 84]];
  const defaultFavs = (st) => {
    const a = (st && st.attributes) || {}, m = a.supported_color_modes || [];
    const color = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'].some((x) => m.includes(x));
    const out = [];
    if (m.includes('color_temp')) {
      const lo = a.min_color_temp_kelvin || 2000, step = ((a.max_color_temp_kelvin || 6500) - lo) / 3;
      for (let i = 0; i < 4; i++) out.push({ color_temp_kelvin: Math.round(lo + step * i) });
    } else if (color) {
      for (let i = 0; i < 4; i++) out.push({ rgb_color: kelvinArr(Math.round(2000 + 1500 * i)) });
    }
    if (color) HA_FAV_RGB.forEach((rgb) => out.push({ rgb_color: rgb }));
    return out;
  };
  const hsRgb = (h, s) => {
    const f = (n) => { const k = (n + h / 60) % 6; return Math.round(255 * (1 - (s / 100) * Math.max(0, Math.min(k, 4 - k, 1)))); };
    return [f(5), f(3), f(1)];
  };
  const xyRgb = (x, y) => {
    const Y = 1, X = (Y / y) * x, Z = (Y / y) * (1 - x - y);
    const lin = [X * 1.656492 - Y * 0.354851 - Z * 0.255038, -X * 0.707196 + Y * 1.655397 + Z * 0.036152, X * 0.051713 - Y * 0.121364 + Z * 1.01153];
    const g = lin.map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055));
    const mx = Math.max(...g, 1e-6);
    return g.map((v) => Math.round(Math.max(0, v / mx) * 255));
  };
  const favCss = (f) => {
    if (f.color_temp_kelvin) return kelvinRgb(f.color_temp_kelvin);
    const rgb = f.rgb_color || f.rgbw_color || f.rgbww_color
      || (f.hs_color && hsRgb(f.hs_color[0], f.hs_color[1])) || (f.xy_color && xyRgb(f.xy_color[0], f.xy_color[1]));
    return rgb ? `rgb(${rgb.slice(0, 3).join(', ')})` : '#fff';
  };
  const lightColor = (st) => {
    const a = (st && st.attributes) || {};
    if (Array.isArray(a.rgb_color)) return `rgb(${a.rgb_color.join(', ')})`;
    if (a.color_temp_kelvin) return kelvinRgb(a.color_temp_kelvin);
    return 'var(--hemma-color-yellow, #FFCC00)';
  };
  const lastPct = (() => { try { return JSON.parse(localStorage.getItem('hemma_light_last') || '{}') || {}; } catch (e) { return {}; } })();
  const keepPct = (id, v) => { if (lastPct[id] === v) return; lastPct[id] = v; try { localStorage.setItem('hemma_light_last', JSON.stringify(lastPct)); } catch (e) {} };
  // A light can report on a beat before its brightness; that gap reads as the last level seen, not as 100%.
  const pctOf = (st) => {
    if (!st || st.state !== 'on') return 0;
    const b = Number(st.attributes.brightness);
    if (b) return Math.max(1, Math.round(b / 2.55));
    const dims = (st.attributes.supported_color_modes || []).some((m) => m !== 'onoff');
    return (dims && lastPct[st.entity_id]) || 100;
  };
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
  // Apple Home's header veil: a blur band behind a pinned title, shown once content moves under it.
  const VEIL = `-webkit-backdrop-filter: blur(20px) saturate(1.3); backdrop-filter: blur(20px) saturate(1.3); background: rgba(36,36,40,0.32); box-shadow: inset 0 -0.5px 0 rgba(255,255,255,0.16);`;
  const HV_CSS = `
    .hv > :is(.hd, .h) { position: sticky; top: var(--hv-top, 0px); z-index: 6; align-self: stretch; }
    .hv > :is(.hd, .h)::before { content: ""; position: absolute; z-index: -1; left: var(--hv-l, 0px); right: var(--hv-r, 0px); top: calc(-1 * var(--hv-pad, 44px)); bottom: -12px; pointer-events: none; opacity: 0; transition: opacity .22s ease; ${VEIL} }
    .hv.scrolled > :is(.hd, .h)::before { opacity: 1; }
  `;
  const GLASS_FILL = `background-color: rgba(255,255,255,0.135); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'%3E%3Cdefs%3E%3ClinearGradient id='t' x1='0' x2='1'%3E%3Cstop offset='0.000' stop-color='white' stop-opacity='0.000'/%3E%3Cstop offset='0.030' stop-color='white' stop-opacity='0.060'/%3E%3Cstop offset='0.067' stop-color='white' stop-opacity='0.080'/%3E%3Cstop offset='0.117' stop-color='white' stop-opacity='0.085'/%3E%3Cstop offset='0.179' stop-color='white' stop-opacity='0.210'/%3E%3Cstop offset='0.250' stop-color='white' stop-opacity='0.305'/%3E%3Cstop offset='0.329' stop-color='white' stop-opacity='0.330'/%3E%3Cstop offset='0.413' stop-color='white' stop-opacity='0.415'/%3E%3Cstop offset='0.500' stop-color='white' stop-opacity='0.500'/%3E%3Cstop offset='0.587' stop-color='white' stop-opacity='0.415'/%3E%3Cstop offset='0.671' stop-color='white' stop-opacity='0.330'/%3E%3Cstop offset='0.750' stop-color='white' stop-opacity='0.305'/%3E%3Cstop offset='0.821' stop-color='white' stop-opacity='0.210'/%3E%3Cstop offset='0.883' stop-color='white' stop-opacity='0.085'/%3E%3Cstop offset='0.933' stop-color='white' stop-opacity='0.080'/%3E%3Cstop offset='0.970' stop-color='white' stop-opacity='0.060'/%3E%3Cstop offset='1.000' stop-color='white' stop-opacity='0.000'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' x1='0' x2='1'%3E%3Cstop offset='0.000' stop-color='white' stop-opacity='0.000'/%3E%3Cstop offset='0.117' stop-color='white' stop-opacity='0.000'/%3E%3Cstop offset='0.179' stop-color='white' stop-opacity='0.030'/%3E%3Cstop offset='0.250' stop-color='white' stop-opacity='0.305'/%3E%3Cstop offset='0.329' stop-color='white' stop-opacity='0.320'/%3E%3Cstop offset='0.413' stop-color='white' stop-opacity='0.455'/%3E%3Cstop offset='0.500' stop-color='white' stop-opacity='0.450'/%3E%3Cstop offset='0.587' stop-color='white' stop-opacity='0.455'/%3E%3Cstop offset='0.671' stop-color='white' stop-opacity='0.320'/%3E%3Cstop offset='0.750' stop-color='white' stop-opacity='0.305'/%3E%3Cstop offset='0.821' stop-color='white' stop-opacity='0.030'/%3E%3Cstop offset='0.883' stop-color='white' stop-opacity='0.000'/%3E%3Cstop offset='1.000' stop-color='white' stop-opacity='0.000'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M.5 22A21.5 21.5 0 0 1 43.5 22' fill='none' stroke='url(%23t)'/%3E%3Cpath d='M43.5 22A21.5 21.5 0 0 1 .5 22' fill='none' stroke='url(%23b)'/%3E%3C/svg%3E"), linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.07) 6%, rgba(255,255,255,0.025) 12%, rgba(255,255,255,0) 18%), linear-gradient(to top, rgba(255,255,255,0.11), rgba(255,255,255,0.05) 6%, rgba(255,255,255,0.015) 12%, rgba(255,255,255,0) 18%); background-size: 100% 100%;`;
  const PILL_CSS = `
    .lpill { position: absolute; left: 50%; bottom: calc(9px + var(--sab, 0px)); transform: translateX(-50%); height: 40px; padding: 0 17px 0 13px; border: 0; border-radius: 20px; z-index: 2;
      display: flex; align-items: center; gap: 7px; color: #fff; font: inherit; font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent;
      background-color: rgba(255,255,255,0.135); background-image: linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.07) 6%, rgba(255,255,255,0.025) 12%, rgba(255,255,255,0) 18%), linear-gradient(to top, rgba(255,255,255,0.11), rgba(255,255,255,0.05) 6%, rgba(255,255,255,0.015) 12%, rgba(255,255,255,0) 18%);
      box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); }
    .lpill::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 8%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.48) 50%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.08) 92%, rgba(255,255,255,0) 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
    .lpill i { width: 16px; height: 16px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    @media (hover: hover) { .lpill:hover { filter: brightness(1.12); } }
  `;
  const PANEL_CSS = `
    ${HV_CSS}
    :host { display: block; --lc: var(--hemma-color-yellow, #FFCC00); color: #fff; font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    .wrap { position: relative; height: var(--hemma-panel-h, min(600px, calc(100svh - 64px))); margin: -8px -8px -20px; width: calc(100% + 16px); overflow: hidden; }
    .page { position: absolute; inset: 0; transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; }
    .main { display: grid; grid-template-rows: auto 1fr auto; justify-items: center; gap: 18px; padding: 28px 22px calc(110px + var(--sab, 0px)); box-sizing: border-box; }
    .list { transform: translateX(100%); opacity: 0; box-sizing: border-box; overflow: hidden; }
    .deep .main { transform: translateX(-30%); opacity: 0; pointer-events: none; }
    .deep .list { transform: none; opacity: 1; }
    .h { text-align: center; display: grid; gap: 4px; margin-top: var(--hemma-hd-nudge, 16px); }
    .h b { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.15; }
    .h span { font-size: 15px; font-weight: 600; color: rgba(235,235,245,0.75); font-variant-numeric: tabular-nums; }
    @media (max-width: 768px) { .h b { font-size: 28px; } .h span { font-size: 17px; } }
    .cap { position: relative; width: 116px; height: 100%; min-height: 180px; max-height: 300px; align-self: center; border-radius: 36px; overflow: hidden;
      background: rgba(0,0,0,0.30); cursor: default; touch-action: none; border: 0; padding: 0; color: #fff; -webkit-tap-highlight-color: transparent; }
    .cap .fill { position: absolute; left: 0; right: 0; bottom: 0; background: var(--lc); transition: height .12s ease, background-color .3s ease; }
    .cap.dragging .fill { transition: background-color .3s ease; }
    .cap .bulb { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); }
    .cap .bulb i { width: 30px; height: 30px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .sw { --d: 46px; --in: 25px; justify-self: stretch; display: flex; gap: calc(var(--d) * 0.35); margin: -6px -22px; padding: 6px var(--in); overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; touch-action: pan-x; }
    .sw::-webkit-scrollbar { display: none; }
    .sw > :first-child { margin-left: auto; }
    @media (max-width: 768px) { .sw { --d: 57px; --in: 31px; } }
    .sw button { flex: none; width: var(--d); height: var(--d); border-radius: 50%; border: 0; padding: 0; cursor: pointer; background: var(--s); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); position: relative; -webkit-tap-highlight-color: transparent; }
    .sw button.on::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; box-shadow: 0 0 0 2.5px #fff; }
    .sw button.wheel { background: none; box-shadow: none; }
    .sw button.wheel::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #00c3d0, #0088ff, #af52de, #ff3b30);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--d) * 0.075 - 0.5px), #000 calc(100% - var(--d) * 0.075)); mask: radial-gradient(farthest-side, transparent calc(100% - var(--d) * 0.075 - 0.5px), #000 calc(100% - var(--d) * 0.075)); }
    .sw button.wheel.whites::after { background: linear-gradient(90deg, ${kelvinRgb(2000)}, #fff, ${kelvinRgb(6500)}); }
    .sw button.wheel::before { content: ""; position: absolute; inset: calc(var(--d) * 0.11); border-radius: 50%; background: var(--lc); }
    .pill, .gear, .back { border: 0; color: #fff; font: inherit; cursor: pointer; background: rgba(255,255,255,0.10); position: relative; -webkit-tap-highlight-color: transparent; }
    .pill { height: 40px; padding: 0 16px; border-radius: 999px; font-size: 14.5px; font-weight: 600; }
    .gear { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; ${GLASS_FILL} box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); }
    .gear i { width: 22px; height: 22px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
${PILL_CSS}    @media (max-width: 768px) { .lpill { position: fixed; height: 52px; border-radius: 26px; padding: 0 21px 0 17px; font-size: 15px; bottom: max(20px, env(safe-area-inset-bottom, 0px)); } .lpill i { width: 18px; height: 18px; } .main { padding-bottom: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 70px); } }
    .deep > .lpill, .deep > .gear.corner { opacity: 0; pointer-events: none; }
    .lpill, .gear.corner { transition: opacity .26s ease; }
    .gear.corner { position: absolute; right: 10.5px; bottom: calc(9px + var(--sab, 0px)); width: 40px; height: 40px; padding: 0; z-index: 2; }
    .gear.corner i { width: 20px; height: 20px; }
    .gear.corner.glist { right: auto; left: 10.5px; }
    .gear.corner.glist i { width: 19px; height: 15px; }
    .lhd .lt { display: grid; min-width: 0; line-height: 1.2; }
    .lhd .lc { font-size: 12.5px; color: rgba(235,235,245,0.6); }
    .lhd .lc:empty { display: none; }
    @media (max-width: 768px) { .gear.corner.glist { right: auto; left: 20px; } .gear.corner.glist i { width: 22px; height: 17px; } }
    @media (min-width: 769px) and (pointer: coarse) { .gear.corner.glist { right: auto; left: 12.5px; } }
    @media (max-width: 768px) { .gear.corner { position: fixed; width: 52px; height: 52px; right: 20px; bottom: max(20px, env(safe-area-inset-bottom, 0px)); } .gear.corner i { width: 24px; height: 24px; } }
    .back { flex: none; align-self: flex-start; width: 44px; height: 44px; padding: 0; border-radius: 50%; display: grid; place-items: center; position: relative;
      ${GLASS_FILL}
      box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); }
    .back svg { width: 11px; height: 18px; display: block; transform: translateX(-1px); }
    .pill::after, .gear::after, .back::after, .sw button:not(.wheel)::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #fff; opacity: 0; transition: opacity .40s ease; pointer-events: none; }
    @media (hover: hover) { .pill:hover::after, .gear:hover::after, .back:hover::after { opacity: .07; transition: opacity .18s ease; } }
    .lhd { position: absolute; top: 0; left: 0; right: 0; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 18px 16px; pointer-events: none; }
    .lhd > * { pointer-events: auto; }
    .lst { position: absolute; inset: 0; display: grid; gap: 8px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: 86px 16px calc(16px + var(--sab, 0px)); box-sizing: border-box; align-content: start;
      }
    .lhd::before { content: ""; position: absolute; inset: 0 0 -4px; z-index: -1; pointer-events: none; opacity: 0; transition: opacity .22s ease; ${VEIL} }
    .page.list.scrolled .lhd::before { opacity: 1; }
    .lst::-webkit-scrollbar { display: none; }
    .lhd b { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr { display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 8px 10px; box-sizing: border-box; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(0,0,0,0.2); }
    .lr .tg { flex: none; width: 36px; height: 36px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; display: grid; place-items: center; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); -webkit-tap-highlight-color: transparent;
      transition: background-color .4s ease, color .4s ease; }
    .lr.on .tg { background: color-mix(in srgb, var(--lc) 24%, transparent); color: var(--lc); }
    .lr .tg i { width: 18px; height: 18px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .lr .nm { flex: 1; min-width: 0; border: 0; background: none; color: inherit; font: inherit; padding: 0; text-align: left; cursor: pointer; display: grid; gap: 1px; }
    .lr b { font-size: 14.5px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr .v { font-size: 12.5px; color: rgba(235,235,245,0.6); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr .pl { position: relative; flex: none; width: 46%; height: 36px; border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.08); cursor: pointer; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
    .lr .pl > .fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--lc); pointer-events: none; transition: width .4s cubic-bezier(0.32, 0.72, 0, 1), background-color .4s ease; }
    .lr.drag .pl > .fill { transition: background-color .4s ease; }
    .lr.on .pl > .fill::after { content: ""; position: absolute; right: 6px; top: 9px; bottom: 9px; width: 4px; border-radius: 2px; background: rgba(255,255,255,0.9); }
    .picker { position: absolute; inset: 0; padding: 26px 22px 20px; box-sizing: border-box; display: grid; grid-template-rows: auto 1fr auto; gap: 16px; justify-items: center; }
    .wheelbig { width: 220px; height: 220px; border-radius: 50%; align-self: center; cursor: default; touch-action: none; border: 0; padding: 0;
      background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 68%), conic-gradient(from 90deg, #ff3b30, #ffcc00, #34c759, #00c3d0, #0088ff, #af52de, #ff3b30); }
    .kbar { width: 100%; height: 56px; border-radius: 999px; align-self: center; cursor: default; touch-action: none; border: 0; padding: 0;
      background: linear-gradient(90deg, ${kelvinRgb(2000)}, ${kelvinRgb(3500)}, #fff, ${kelvinRgb(6500)}); }
    button:focus-visible { outline: 2px solid rgba(255,255,255,0.7); outline-offset: 2px; }
    @media (max-width: 768px) { .main { gap: 26px; padding-top: 36px; } .cap { max-height: 340px; width: 124px; border-radius: 38px; } .h b { font-size: 26px; } .h span { font-size: 17px; } }
    :host { --sab: 0px; --hemma-pop-tile-r: 26px; }
    @media (min-width: 769px) and (hover: hover) { :host { --hemma-pop-tile-r: 20px; } }
    @media (max-width: 768px) { :host { --sab: env(safe-area-inset-bottom, 0px); } }
    @media (min-width: 769px) { :host .wrap { max-height: var(--hemma-panel-h, calc(100svh - 64px)); } :host .wrap.multi, :host .wrap.lst, :host .wrap.cam { min-height: var(--hemma-panel-h, 0px); } }
    @media (min-width: 769px) and (pointer: coarse) {
      .corner, .gear.corner { width: 52px; height: 52px; right: 12.5px; bottom: 13.5px; }
      .corner:is(.open, .glist) { left: 12.5px; right: auto; }
      .corner i, .gear.corner i { width: 24px; height: 24px; }
      .lpill { height: 52px; border-radius: 26px; bottom: 13.5px; padding: 0 21px 0 17px; font-size: 15px; }
    }
    @media (min-width: 769px) and (hover: hover) { .cap { width: 96px; border-radius: 30px; } }
    @media (min-width: 769px) and (pointer: coarse) {
      .wrap { height: min(729px, calc(100svh - 90px)); }
      .main { padding: 44px 22px 104px; gap: 24px; }
      .cap { width: 120px; max-height: 344px; border-radius: 38px; }
      .sw { --d: 57px; --in: 31px; }
    }
  `;
  const CHEV_SVG = '<svg class="chev" viewBox="0 0 7 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l5 5-5 5"/></svg>';
  class HemmaLightPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._pending = {}; }
    hemmaHero() {
      const r = this.shadowRoot, cap = r && r.querySelector('.cap');
      return cap && !r.querySelector('.wrap.deep') ? { el: cap, icon: cap.querySelector('.bulb'), fill: cap.querySelector('.fill') } : null;
    }
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
    _swatches(favs) {
      return favs.map((f, i) => `<button type="button" data-i="${i}" style="--s:${favCss(f)}" aria-label="${esc(T('lights.favorite', 'Favorite {n}', { n: i + 1 }))}"></button>`).join('');
    }
    _bindSwatches() {
      this.shadowRoot.querySelectorAll('.sw button[data-i]').forEach((b) => { b.onclick = () => { const f = this._favs[Number(b.dataset.i)]; this._localColor = favCss(f); this._paint(); this._setColor(f); }; });
    }
    _loadFavs(id) {
      if (!id || !this._hass.callWS) return;
      this._hass.callWS({ type: 'config/entity_registry/get', entity_id: id }).then((e) => {
        const stored = e && e.options && e.options.light && e.options.light.favorite_colors;
        const row = this.shadowRoot.querySelector('.sw');
        if (!Array.isArray(stored) || !row || JSON.stringify(stored) === JSON.stringify(this._favs)) return;
        this._favs = stored;
        row.querySelectorAll('button[data-i]').forEach((b) => b.remove());
        row.insertAdjacentHTML('afterbegin', this._swatches(stored));
        this._bindSwatches();
        row.scrollLeft = row.scrollWidth;
      }).catch(() => {});
    }
    _setColor(f) {
      this._call('turn_on', Object.assign({ entity_id: this._target() }, f));
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
      const favs = defaultFavs(S[c.entity]);
      const name = (c.name && String(c.name).indexOf('<') < 0 && c.name) || (S[c.entity] && S[c.entity].attributes.friendly_name) || c.entity;
      const root = this.shadowRoot;
      root.innerHTML = `<style>${PANEL_CSS}</style><div class="wrap"><div class="page main">`
        + `<div class="h"><b>${esc(name)}</b><span class="st"></span></div>`
        + `<button type="button" class="cap" role="slider" aria-label="${esc(T('lights.brightness', 'Brightness'))}" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span><span class="bulb"><i style="--i:url('${esc(iconUrl('light'))}')"></i></span></button>`
        + (md.temp ? `<div class="sw">${this._swatches(favs)}<button type="button" class="wheel${md.color ? '' : ' whites'}" aria-label="${esc(md.color ? T('lights.color', 'Color') : T('lights.whites', 'Whites'))}"></button></div>` : '<div></div>')
        + `</div>${group ? `<div class="page list"><div class="lhd"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}"><svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.4 1.6 1.8 10l8.6 8.4"/></svg></button><span class="lt"><b>${esc(name)}</b><small class="lc"></small></span></div><div class="lst"></div></div>` : ''}`
        + (group ? `<button type="button" class="lights gear corner glist" aria-label="${esc(T('lights.n_lights', '{n} Lights', { n: ids.length }))}" data-notip><i style="--i:url(&quot;${LIST_ICON}&quot;)"></i></button>` : '')
        + `<button type="button" class="gear corner info" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button>`
        + `</div>`;
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
        const v = Math.round(Math.max(1, Math.min(100, drag.v + dy / cap.getBoundingClientRect().height * 100)));
        this._local = v; this._paint(); this._setBrightness(v);
      });
      const up = () => {
        if (drag && !drag.moved) {
          const ids = this._target();
          const turnOff = this._on();
          this._local = turnOff ? 0 : (this._val() || 100); this._paint();
          this._call(turnOff ? 'turn_off' : 'turn_on', { entity_id: ids, transition: 0.4 });
        }
        drag = null; cap.classList.remove('dragging');
        clearTimeout(this._lt); this._lt = setTimeout(() => { this._local = null; this._scope = null; this._paint(); }, 2500);
      };
      cap.addEventListener('pointerup', up);
      cap.addEventListener('pointercancel', () => { drag = null; cap.classList.remove('dragging'); });
      cap.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
        ev.preventDefault();
        const v = Math.max(1, Math.min(100, this._val() + (ev.key === 'ArrowUp' ? 10 : -10)));
        this._local = v; this._paint(); this._setBrightness(v);
      });
      this._bindSwatches();
      const sw = root.querySelector('.sw');
      if (sw) requestAnimationFrame(() => { sw.scrollLeft = sw.scrollWidth; });
      this._loadFavs(c.entity);
      const wheel = root.querySelector('.sw .wheel');
      if (wheel) wheel.onclick = () => this._picker(md.color);
      root.querySelector('.info').onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: c.entity }, bubbles: true, composed: true }));
      if (group) {
        const wrap = root.querySelector('.wrap');
        root.querySelector('.lights').onclick = () => { this._rows(); wrap.classList.add('deep'); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: true, bubbles: true, composed: true })); };
        root.querySelector('.back').onclick = () => { wrap.classList.remove('deep'); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: false, bubbles: true, composed: true })); };
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
      if (!lst._veil) {
        lst._veil = true;
        lst.addEventListener('scroll', () => {
          const on = lst.scrollTop > 2, pg = lst.parentNode;
          pg.classList.toggle('scrolled', on);
          lst.dispatchEvent(new CustomEvent('hemma-veil', { detail: on, bubbles: true, composed: true }));
        }, { passive: true });
      }
      const S = this._hass.states;
      const ids = this._ids();
      if (lst.childElementCount !== ids.length) {
        lst.textContent = '';
        ids.forEach((id) => {
          const r = document.createElement('div');
          r.className = 'lr';
          r.innerHTML = `<button type="button" class="tg"><i style="--i:url('${esc(iconUrl('light'))}')"></i></button>`
            + `<button type="button" class="nm"><b></b><small class="v"></small></button>`
            + `<div class="pl" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span></div>`;
          const pl = r.querySelector('.pl');
          const word = (v) => (v ? T('lights.on_pct', 'On · {n}%', { n: v }) : T('lights.off', 'Off'));
          const show = (v) => {
            r.querySelector('.fill').style.width = (v ? Math.max(v, 6) : 0) + '%';
            r.querySelector('.v').textContent = word(v);
            r.classList.toggle('on', v > 0);
          };
          r._show = show;
          r._v = lastPct[id];
          r.querySelector('.tg').onclick = () => {
            const on = !r.classList.contains('on');
            show(on ? (r._v || 0) : 0);
            if (on && !r._v) { r.classList.add('on'); r.querySelector('.v').textContent = T('lights.on', 'On'); }
            r._hold = on ? 0 : Date.now() + 2500;
            r._was = (this._hass.states[id] || {}).last_updated; r._wasAt = Date.now();
            this._call(on ? 'turn_on' : 'turn_off', { entity_id: id, transition: 0.4 });
          };
          r.querySelector('.nm').onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
          let g = null;
          const at = (ev) => {
            const b2 = pl.getBoundingClientRect();
            const v = Math.round(Math.max(1, Math.min(100, (ev.clientX - b2.left) / b2.width * 100)));
            show(v);
            if (v) r._v = v;
            clearTimeout(r._t);
            r._t = setTimeout(() => (r._was = (this._hass.states[id] || {}).last_updated, r._wasAt = Date.now(), v ? this._call('turn_on', { entity_id: id, brightness_pct: v }) : this._call('turn_off', { entity_id: id })), 120);
            r._hold = Date.now() + 2500;
          };
          pl.addEventListener('pointerdown', (ev) => { g = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, live: false }; });
          pl.addEventListener('pointermove', (ev) => {
            if (!g || ev.pointerId !== g.id) return;
            const dx = ev.clientX - g.x, dy = ev.clientY - g.y;
            if (!g.live) {
              if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) { if (Math.abs(dy) > 10) g = null; return; }
              g.live = true;
              r.classList.add('drag');
              try { pl.setPointerCapture(ev.pointerId); } catch (_) {}
            }
            at(ev);
          });
          pl.addEventListener('pointerup', (ev) => { if (g && !g.live) at(ev); g = null; r.classList.remove('drag'); });
          pl.addEventListener('pointercancel', () => { g = null; r.classList.remove('drag'); });
          lst.appendChild(r);
        });
      }
      const lc = this.shadowRoot.querySelector('.lhd .lc');
      if (lc) { const on = ids.filter((id) => S[id] && S[id].state === 'on').length; lc.textContent = on ? T('lights.n_on', '{n} On', { n: on }) : T('lights.all_off', 'All Off'); }
      [...lst.children].forEach((r, i) => {
        const s = S[ids[i]];
        if (!s || (r._hold && Date.now() < r._hold) || (r._was && s.last_updated === r._was && Date.now() - r._wasAt < 10000)) return;
        const v = pctOf(s);
        r.style.setProperty('--lc', lightColor(s));
        r.querySelector('b').textContent = s.attributes.friendly_name || ids[i];
        r.querySelector('.v').textContent = s.state === 'on' ? T('lights.on_pct', 'On · {n}%', { n: v }) : (this._hass.formatEntityState ? this._hass.formatEntityState(s) : s.state);
        r.classList.toggle('on', s.state === 'on');
        if (v) { r._v = v; keepPct(ids[i], v); }
        r.querySelector('.tg').setAttribute('aria-label', (s.attributes.friendly_name || ids[i]) + ', ' + (s.state === 'on' ? T('lights.off', 'Off') : T('lights.on', 'On')));
        r.querySelector('.pl').setAttribute('aria-label', s.attributes.friendly_name || ids[i]);
        r.querySelector('.pl').setAttribute('aria-valuenow', s.state === 'on' ? v : 0);
        r.querySelector('.fill').style.width = (s.state === 'on' ? Math.max(v, 6) : 0) + '%';
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
          f = { hs_color: [Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360), Math.round(Math.min(100, Math.hypot(x, y) / (r.width / 2) * 100))] };
        } else {
          f = { color_temp_kelvin: Math.round(2000 + Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * 4500) };
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
  // Apple Home's lock sheet: the name, its state, one tall control set low, and the accessory's settings in the corner.
  const SLAB_CSS = `
    .slab { display: contents; }
    @media (max-width: 768px) {
      .wrap:has(.slab) { height: calc(100svh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); min-height: 0; max-height: none; overflow: hidden; padding-bottom: 16px; }
      .wrap:has(.slab) .page.one { max-height: none; overflow: hidden; padding-bottom: 16px; }
      .wrap:has(.corner.gear) { padding-bottom: 41px; }
      .slab { display: flex; flex-direction: column; gap: 14px; flex: 0 1 auto; min-height: 0; align-self: stretch; box-sizing: border-box; margin: 26px var(--slab-x, 11px) 0;
        padding: 20px; border-radius: 36px; background: rgba(0,0,0,0.3); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
      .slab::-webkit-scrollbar { display: none; }
      .slab .w, .slab .list, .slab .row { background: none; border-radius: 0; }
      .slab .w { padding: 0; }
      .slab .g2 > .w + .w { border-left: 0.5px solid rgba(255,255,255,0.14); padding-left: 16px; }
      .slab .list .li, .slab .po { padding-left: 0; padding-right: 0; }
      .slab .li + .li::before { left: 48px; right: 0; }
      .slab .list + .list { margin-top: 0; }
      .slab .cams { margin-bottom: 0; }
      .slab > .list:first-child { margin-top: -8px; }
      .slab > .list:last-child { margin-bottom: -8px; }
      .slab .lbl { padding: 0; }
      .slab .pt { background: rgba(255,255,255,0.08); }
      .slab .wpill { margin: 0; align-self: center; background: rgba(255,255,255,0.12); }
      .slab .acts { margin-top: auto; }
      .slab .w + .g2 { padding-top: 8px; }
    }`;
  const CHEV_UD = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 14' fill='none' stroke='%23000' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1.5 5 4.5 2l3 3M1.5 9l3 3 3-3'/%3E%3C/svg%3E";
  const BIG_CSS = `
    ${PILL_CSS}
    .upill.lpill { display: none; }
    .lhero { display: none; }
    .grp .mem { display: flex; flex-direction: column; position: absolute; inset: 0; z-index: 3; padding: 18px 16px 16px; box-sizing: border-box; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none;
      opacity: 0; transform: translateX(36px); pointer-events: none; transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; }
    .grp .mem::-webkit-scrollbar { display: none; }
    .grp.deep .mem { opacity: 1; transform: none; pointer-events: auto; }
    .grp > :not(.mem):not(.menu) { transition: opacity .26s ease; }
    .grp.deep > :not(.mem):not(.menu) { opacity: 0; pointer-events: none; }
    .grp .mhd { display: flex; align-items: center; gap: 12px; margin: 0 0 16px; flex: none; }
    .grp .mhd .mt { display: grid; min-width: 0; line-height: 1.2; }
    .grp .mhd b { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .grp .mhd small { font-size: 12.5px; color: rgba(235,235,245,0.6); }
    .grp .mhd small:empty { display: none; }
    .grp .mem .tiles, .grp .mem .mini { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin: 0; width: 100%; flex: none; }
    .grp .mem .t { height: 60px; }
    @media (max-width: 768px) { .grp .mem { padding: 12px 16px calc(24px + var(--sab, 0px)); } }
    .mhd .back, .cam .back { flex: none; width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; color: #fff; cursor: pointer; position: relative;
      ${GLASS_FILL}
      box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); }
    .mhd .back svg, .cam .back svg { width: 11px; height: 18px; display: block; transform: translateX(-1px); }
    @media (hover: hover) { .mhd .back:hover, .cam .back:hover { filter: brightness(1.12); } }
    .cam .back { position: absolute; top: 14px; left: 14px; z-index: 2; }
    @media (min-width: 769px) {
      :host { --pt: 46px; --tb: 22px; --ts: 15px; --cw: 104px; --ch: 290px; --cr: 32px; --pb: 62px; --dw: 252px; --vp: 96px; --art: 236px; }
      :host .wrap { padding-top: var(--pt); padding-bottom: var(--pb); overflow-x: hidden; }
      :host .wrap.lst:not(:has(> .corner)) { padding-bottom: 16px; }
      :host .wrap .hd b { font-size: var(--tb); }
      :host .wrap .hd span { font-size: var(--ts); }
      :host .wrap .ctl { width: var(--cw); height: var(--ch); border-radius: var(--cr); margin: auto 0; }
      :host .wrap .knob { border-radius: calc(var(--cr) - 4px); }
      :host .wrap .acts, :host .wrap .fpow, :host .wrap .ptile, :host .wrap .capb, :host .wrap .ctiles, :host .wrap.multi:not(.grp) > .tiles { margin: 0 0 14px; padding-bottom: 0; }
      :host .wrap .acts.fx { gap: 10px; max-width: 100%; }
      :host .vac .play { width: var(--vp); height: var(--vp); margin: auto 0; }
      :host .vac .play i { width: calc(var(--vp) * 0.36); height: calc(var(--vp) * 0.36); }
      :host .vac .wheel { width: 204px; height: 102px; margin: 0 0 52px; }
      :host .vac .wheel .pillbg, :host .vac .wheel .trk { top: 34px; }
      :host .vac .wheel .pillbg { height: 34px; border-radius: 17px; }
      :host .vac .wheel button { height: 34px; font-size: 16px; }
      :host .vac .capb { min-width: 170px; padding: 17px 34px; border-radius: 40px; margin: 0 0 10px; }
      :host .vac .capb b { font-size: 17px; }
      :host .vac .capb small { font-size: 16px; }
      :host .wrap .ftiles { flex: none; align-self: stretch; display: grid; grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr)); gap: 8px; margin: 0 0 14px; }
      :host .wrap .ftiles[style="--n:1"] { grid-template-columns: minmax(0, 170px); justify-content: center; }
      :host .wrap .ft { min-width: 0; min-height: 52px; padding: 7px 12px; border: 0; border-radius: 16px; background: rgba(0,0,0,0.24); color: #fff; font: inherit; text-align: left; display: grid; align-content: center; justify-items: start; gap: 1px; cursor: pointer; transition: filter .4s ease; -webkit-tap-highlight-color: transparent; }
      :host .wrap .ft small { max-width: 100%; font-size: 12px; font-weight: 500; color: rgba(235,235,245,0.72); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      :host .wrap .ft b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      @media (hover: hover) { :host .wrap .ft:hover { filter: brightness(0.84); transition: filter .18s ease; } }
      :host .wrap .ftiles[style="--n:2"] { grid-template-columns: repeat(2, minmax(0, 170px)); justify-content: center; }
      :host .wrap .lbl.all { display: none; }
      :host .wrap .upill.lpill { display: flex; position: sticky; left: auto; bottom: 9px; transform: none; align-self: center; flex: none; margin: auto 0 0; }
      :host .wrap.cam.cine { padding: 0 0 var(--pb); }
      :host .cine .vid { flex: none; align-self: stretch; aspect-ratio: auto; height: calc(var(--hemma-panel-h, 600px) - var(--pb) - 152px); border-radius: 0; background: #000; }
      :host .cine .vid .shade { position: absolute; left: 0; right: 0; top: 0; height: 120px; background: linear-gradient(rgba(0,0,0,0.5), transparent); pointer-events: none; z-index: 1; }
      :host .cine .vid .hd { position: absolute; left: 70px; right: 18px; top: 20px; z-index: 2; text-align: left; justify-items: start; gap: 1px; margin: 0; padding: 0; pointer-events: none; text-shadow: 0 1px 8px rgba(0,0,0,0.4); }
      :host .cine .vid .hd span { color: rgba(255,255,255,0.82); font-size: 14px; }
      :host .cine .back { top: 18px; left: 16px; z-index: 3; }
      :host .cine .badge { top: auto; bottom: 16px; left: 16px; z-index: 2; }
      :host .cine .ov { top: auto; bottom: 16px; right: 16px; z-index: 2; }
      :host .cine .lbl { align-self: stretch; padding: 14px 18px 8px; }
      :host .cine .list.act { align-self: stretch; display: flex; gap: 10px; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; background: none; border-radius: 0; padding: 0 18px; margin: 0; flex: none; }
      :host .cine .list.act::-webkit-scrollbar { display: none; }
      :host .cine .act .li { flex: none; width: 124px; min-height: 0; padding: 0; flex-direction: column; align-items: stretch; gap: 5px; }
      :host .cine .act .li::before, :host .cine .act .li::after { display: none; }
      :host .cine .act .ic, :host .cine .act .th { width: 124px; height: 70px; border-radius: 12px; }
      :host .cine .act .ic { box-shadow: inset 0 0 0 200px rgba(28,28,30,0.62); }
      :host .cine .act .ic i { width: 26px; height: 26px; }
      :host .cine .act .th i { width: 26px; height: 26px; }
      :host .cine .act .tx b { font-size: 13px; font-weight: 600; }
      :host .cine .act .tx small { font-size: 12px; }
      :host .cine .act .tag { display: none; }
      :host .cine .act .none { padding: 18px 0; }
      :host .wrap.cam:not(.cine) .cams { grid-template-columns: 1fr 1fr; }
      :host .wrap.med.wash { padding-top: var(--pt); }
      :host .wrap.med.wash .hd { display: grid; position: relative; z-index: 1; margin-bottom: 18px; }
      :host .wrap.med.wash { padding-left: 14px; padding-right: 14px; }
      :host .wrap.med.wash > .slab { flex: 1 1 auto; min-height: 0; justify-content: flex-start; gap: 10px; padding: 16px; border-radius: 34px; background: rgba(0,0,0,0.24); box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.06); }
      :host .wrap.med.wash .art:not(.ph) { flex: 1 1 0; min-height: 110px; width: 100%; align-self: stretch; display: flex; align-items: center; justify-content: center; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
      :host .wrap.med.wash .art:not(.ph) img { width: auto; height: auto; max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 14px 34px -14px rgba(0,0,0,0.75); }
      :host .wrap.med.wash .art.ph { width: 100%; height: auto; }
      :host .wrap.med.wash .trk { margin-top: 4px; }
      :host .wrap.med.wash .tp { padding: 0 28px; }
      :host .wrap .ptile { min-height: 52px; border-radius: 26px; padding: 6px 22px 6px 18px; }
      :host .wrap .fx .act > span { background: none; }
      :host .wrap .act.mode:not(.ft) { flex: 0 1 auto; display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 8px; width: auto; min-width: 110px; max-width: 200px; height: 52px; padding: 0 20px; border-radius: 26px; background: rgba(0,0,0,0.24); color: #fff; }
      :host .wrap .act.mode:not(.ft) > span { display: none; }
      :host .wrap .act.mode:not(.ft) small { position: static; width: auto; height: auto; clip-path: none; min-width: 0; max-width: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; font-weight: 600; color: #fff; }
      :host .wrap .act.mode:not(.ft)::after { content: ""; flex: none; width: 9px; height: 14px; background: rgba(255,255,255,0.6); -webkit-mask: url("${CHEV_UD}") center / contain no-repeat; mask: url("${CHEV_UD}") center / contain no-repeat; }
      :host .wrap.med:not(.wash) > .slab { margin-top: auto; margin-bottom: auto; }
      :host .thermo .dial { width: var(--dw); height: var(--dw); margin: auto 0; }
      :host :is(.thermo, .fanb) .ctiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      :host :is(.thermo, .fanb) .ctiles[data-n="1"] { grid-template-columns: minmax(0, 1fr); }
      :host :is(.thermo, .fanb) .ctiles[data-n="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      :host :is(.thermo, .fanb) .ct { min-height: 50px; padding: 7px 12px; border-radius: 16px; }
      :host :is(.thermo, .fanb) .ct i { display: none; }
      :host .wrap .lhero { display: grid; place-items: center; flex: none; width: 72px; height: 72px; border-radius: 20px; margin: 0 0 14px; background: linear-gradient(var(--c1), var(--c2)); box-shadow: 0 8px 22px -12px rgba(0,0,0,0.6); }
      :host .wrap .lhero i { width: 38px; height: 38px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
      :host .wrap:has(> .lhero) { padding-top: calc(var(--pt) - 16px); }
      :host .wrap .body { flex: 1 0 auto; }
    }
    @media (min-width: 769px) and (pointer: coarse) {
      :host .lpill { height: 52px; border-radius: 26px; bottom: 13.5px; padding: 0 21px 0 17px; font-size: 15px; }
      :host .lpill i { width: 18px; height: 18px; }
      :host { --pt: 64px; --tb: 27px; --ts: 17px; --cw: 122px; --ch: 342px; --cr: 38px; --pb: 80px; --dw: 296px; --vp: 112px; --art: 280px; }
      :host .thermo .dial .mid strong { font-size: 70px; }
      :host .thermo .dial.off .mid strong { font-size: 62px; }
      :host .thermo .dial .mid small { font-size: 18px; }
      :host .thermo .pm { bottom: 16px; gap: 24px; }
      :host .thermo .pm button { width: 46px; height: 46px; }
    }
  `;
  const SHEET_CSS = `
    :host { display: block; color: #fff; font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    .wrap { position: relative; margin: -8px -8px -20px; width: calc(100% + 16px); min-height: var(--hemma-panel-h, 560px); max-height: calc(100svh - 64px);
      display: flex; flex-direction: column; align-items: center; padding: 44px 18px calc(18px + var(--sab, 0px)); box-sizing: border-box; overflow-y: auto; scrollbar-width: none; }
    .wrap::-webkit-scrollbar { display: none; }
    .hd { flex: none; text-align: center; display: grid; gap: 4px; padding: 0 12px; }
    ${HV_CSS}
    .hd b { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.15; }
    .hd span { font-size: 15px; font-weight: 600; color: rgba(235,235,245,0.75); font-variant-numeric: tabular-nums; }
    .ctl { flex: none; position: relative; width: 94px; height: 264px; margin: auto 0; border: 0; padding: 0; border-radius: 28px; cursor: pointer; touch-action: none;
      background: rgba(0,0,0,0.2); -webkit-tap-highlight-color: transparent; }
    .wrap.multi { min-height: 0; }
    .multi .ctl { margin: 40px 0 26px; }
    .knob { position: absolute; left: 4px; right: 4px; height: 46%; border-radius: 24px; background: rgba(22,22,22,0.42); display: grid; place-items: center;
      top: calc(100% - 46% - 4px); transition: top .42s cubic-bezier(0.32, 0.72, 0, 1), background-color .3s ease; }
    .ctl.up .knob { top: 4px; }
    .ctl.open .knob { background: var(--hemma-lock-open-fill, var(--hemma-color-teal, #00C3D0)); }
    .knob i { width: 26px; height: 26px; display: block; background: var(--k, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; transition: background-color .3s ease; }
    .ctl.busy .knob i { animation: hemma-lock-pulse 1s ease-in-out infinite alternate; }
    @keyframes hemma-lock-pulse { from { opacity: 1; } to { opacity: 0.35; } }
    .corner { position: absolute; bottom: calc(9px + var(--sab, 0px)); width: 40px; height: 40px; border: 0; padding: 0; border-radius: 50%; cursor: pointer; display: grid; place-items: center; color: #fff;
      ${GLASS_FILL}
      box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); }
    .corner.gear { right: 10.5px; }
    .corner:is(.open, .glist) { left: 10.5px; }
    .corner i { width: 20px; height: 20px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .tiles { flex: none; width: 100%; display: grid; gap: 8px; }
    .tiles.two { grid-template-columns: 1fr 1fr; }
    .t { height: 62px; border: 0; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(0,0,0,0.2); color: #fff; font: inherit; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 10px; min-width: 0; cursor: pointer; text-align: left; }
    .t .ti { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,0.10); transition: background-color .4s ease; }
    .t.on .ti { background: var(--hemma-popup-primary-color, var(--hemma-color-teal, #00C3D0)); }
    .t .ti i { width: 20px; height: 20px; display: block; background: var(--k); transition: background-color .4s ease; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .t.on .ti i { background: #fff; }
    .t:not(.on) .ti i { background: rgba(255,255,255,0.6); }
    .t .tx { min-width: 0; flex: 1; display: grid; }
    .t b { font-size: 14.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t small { font-size: 13px; opacity: .62; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    .t .chev { width: 7px; height: 12px; flex: none; opacity: .35; }
    .tiles.two .t .chev { display: none; }
    .t { transition: filter .4s ease; }
    @media (hover: hover) { .corner:hover { filter: brightness(1.12); } .t:hover { filter: brightness(0.84); transition: filter .18s ease; } }
    button:focus-visible { outline: 2px solid rgba(255,255,255,0.7); outline-offset: 2px; }
    @media (max-width: 768px) {
      .wrap, .wrap.multi { min-height: var(--hemma-panel-h, calc(100svh - 120px)); padding-top: 64px; }
      .hd b { font-size: 28px; }
      .hd span { font-size: 17px; }
      .ctl { width: 122px; height: 342px; border-radius: 36px; }
      .knob { border-radius: 32px; }
      .knob i { width: 30px; height: 30px; }
      .multi .ctl { height: 342px; margin: auto 0; }
      .multi .tiles { margin: auto 0 4px; }
      .corner { position: fixed; width: 52px; height: 52px; bottom: max(20px, env(safe-area-inset-bottom, 0px)); }
      .corner.gear { right: 20px; }
      .corner:is(.open, .glist) { left: 20px; }
      .corner i { width: 24px; height: 24px; }
    }
    :host { --sab: 0px; --hemma-pop-tile-r: 26px; }
    @media (min-width: 769px) and (hover: hover) { :host { --hemma-pop-tile-r: 20px; } }
    @media (max-width: 768px) { :host { --sab: env(safe-area-inset-bottom, 0px); } }
    @media (min-width: 769px) { :host .wrap { max-height: var(--hemma-panel-h, calc(100svh - 64px)); } :host .wrap.multi, :host .wrap.lst, :host .wrap.cam { min-height: var(--hemma-panel-h, 0px); } }
    @media (min-width: 769px) and (pointer: coarse) {
      .corner, .gear.corner { width: 52px; height: 52px; right: 12.5px; bottom: 13.5px; }
      .corner:is(.open, .glist) { left: 12.5px; right: auto; }
      .corner i, .gear.corner i { width: 24px; height: 24px; }
      .lpill { height: 52px; border-radius: 26px; bottom: 13.5px; padding: 0 21px 0 17px; font-size: 15px; }
    }
  `;
  const GEAR_SOLID = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'/%3E%3C/svg%3E";
  const LIST_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 16'%3E%3Ccircle cx='2' cy='2' r='1.7'/%3E%3Ccircle cx='2' cy='8' r='1.7'/%3E%3Ccircle cx='2' cy='14' r='1.7'/%3E%3Cpath d='M6.5 2h12M6.5 8h12M6.5 14h12' stroke='%23000' stroke-width='2.1' stroke-linecap='round'/%3E%3C/svg%3E";
  const LOCKED_TINT = 'var(--hemma-color-teal, #00C3D0)';
  const wideSheet = () => window.matchMedia('(min-width: 769px)').matches;
  // A group's members open from a glass list button in the bottom-left corner, the gear's twin, so the popup at rest carries no label.
  const groupPage = (title, inner, icon, count) => `<div class="mem"><div class="mhd"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button><span class="mt"><b>${esc(title)}</b><small></small></span></div>${inner}</div>`
    + `<button type="button" class="corner glist gpill" aria-label="${esc(count)}" data-notip><i style="--i:url(&quot;${LIST_ICON}&quot;)"></i></button>`;
  const bindGroup = (host, root) => {
    const wrap = root.querySelector('.wrap.grp'), pill = root.querySelector('.gpill'), back = root.querySelector('.mhd .back');
    if (!wrap || !pill || !back) return;
    // The members page names the group's state in the tile's own words, refreshed whenever the popup repaints.
    const dst = root.querySelector('.mhd small');
    if (dst && typeof host._paint === 'function' && !host._stateLine) {
      host._stateLine = true;
      const line = () => {
        const h = host._hass, st = h && host._config && h.states[host._config.entity];
        if (!st) { const src = root.querySelector('.wrap > .hd span'); dst.textContent = src ? src.textContent : ''; return; }
        try { dst.textContent = h.formatEntityState ? h.formatEntityState(st) : st.state; } catch (_) { dst.textContent = st.state; }
      };
      const paint = host._paint;
      host._paint = function () { const r = paint.apply(this, arguments); line(); return r; };
      line();
    }
    const deep = (on) => { wrap.classList.toggle('deep', on); host.dispatchEvent(new CustomEvent('hemma-deep', { detail: on, bubbles: true, composed: true })); };
    pill.onclick = () => deep(true);
    back.onclick = () => deep(false);
  };
  class HemmaLockPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    hemmaHero() {
      const ctl = this.shadowRoot.querySelector('.ctl');
      return ctl ? { el: ctl, icon: ctl.querySelector('.knob i'), fill: ctl.querySelector('.knob') } : null;
    }
    _ids() {
      const c = this._config, S = this._hass.states;
      const list = (Array.isArray(c.locks) ? c.locks : []).filter((id) => typeof id === 'string' && S[id]);
      return list.length ? list : (c.entity && S[c.entity] ? [c.entity] : []);
    }
    _door(id) { const d = (this._config.doors || {})[id]; const st = d && this._hass.states[d]; return !!(st && st.state === 'on'); }
    _battery(id) { if (this._config.show_battery !== true) return null; const b = (this._config.battery || {})[id]; const st = b && this._hass.states[b]; return st ? num(st) : null; }
    _stateText(id) {
      const st = this._hass.states[id], s = st.state;
      if (this._door(id)) return T('locks.popup.door_open', 'Door Open');
      if (s === 'locking') return T('locks.locking', 'Locking…');
      if (s === 'unlocking') return T('locks.unlocking', 'Unlocking…');
      return this._hass.formatEntityState ? this._hass.formatEntityState(st) : s;
    }
    _name(id) { const st = this._hass.states[id]; return String((st && st.attributes.friendly_name) || id); }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const ids = this._ids(), multi = ids.length > 1;
      const root = this.shadowRoot;
      const one = !multi && ids[0] && this._hass.states[ids[0]];
      const canOpen = one && (Number(one.attributes.supported_features) & 1);
      root.innerHTML = `<style>${SHEET_CSS}${BIG_CSS}</style><div class="wrap${multi ? ' multi grp' : ''}">`
        + `<div class="hd"><b></b><span></span></div>`
        + `<button type="button" class="ctl" role="switch"><span class="knob"><i></i></span></button>`
        + (multi ? groupPage(this._config.name || T('locks.popup.title', 'Locks'), `<div class="tiles two"></div>`, 'lock-fill', T('locks.popup.n_locks', '{n} Locks', { n: ids.length })) : `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button>`)
        + (canOpen ? `<button type="button" class="corner open" aria-label="${esc(T('tap.open', 'Open'))}"><i style="--i:url('${esc(iconUrl('door-open'))}')"></i></button>` : '')
        + `</div>`;
      const ctl = root.querySelector('.ctl');
      let y0 = null, moved = false;
      ctl.addEventListener('pointerdown', (e) => { y0 = e.clientY; moved = false; try { ctl.setPointerCapture(e.pointerId); } catch (_) {} });
      ctl.addEventListener('pointermove', (e) => {
        if (y0 == null || moved) return;
        const dy = e.clientY - y0, up = ctl.classList.contains('up');
        if (Math.abs(dy) > 24) { moved = true; if ((dy > 0 && up) || (dy < 0 && !up)) this._toggleAll(); }
      });
      ctl.addEventListener('pointerup', () => { if (y0 != null && !moved) this._toggleAll(); y0 = null; });
      ctl.addEventListener('pointercancel', () => { y0 = null; });
      const info = (id) => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
      const gear = root.querySelector('.gear');
      if (gear) gear.onclick = () => info(ids[0]);
      bindGroup(this, root);
      const open = root.querySelector('.corner.open');
      if (open) open.onclick = () => this._act([ids[0]], 'open', true);
      this._paint();
    }
    _paint() {
      const root = this.shadowRoot, S = this._hass.states, ids = this._ids();
      const ctl = root.querySelector('.ctl');
      if (!ctl || !ids.length) return;
      const multi = ids.length > 1;
      const unlocked = ids.filter((id) => ['unlocked', 'unlocking', 'open', 'opening'].includes(S[id].state));
      const busy = ids.some((id) => ['locking', 'unlocking', 'opening'].includes(S[id].state));
      const allLocked = !unlocked.length;
      root.querySelector('.hd b').textContent = multi ? (this._config.name || T('locks.popup.title', 'Locks')) : this._name(ids[0]);
      root.querySelector('.hd span').textContent = !multi ? this._stateText(ids[0])
        : busy ? (ids.some((id) => S[id].state === 'locking') ? T('locks.locking', 'Locking…') : T('locks.unlocking', 'Unlocking…'))
        : allLocked ? T('locks.popup.all_doors_locked', 'All doors locked')
        : unlocked.length === ids.length ? T('locks.popup.all_doors_unlocked', 'All doors unlocked')
        : T('locks.popup.n_doors_unlocked', '{n} doors unlocked', { n: unlocked.length });
      const goingDown = ids.some((id) => S[id].state === 'locking');
      ctl.classList.toggle('up', busy ? !goingDown : !allLocked);
      ctl.classList.toggle('busy', busy);
      ctl.setAttribute('aria-checked', String(allLocked));
      ctl.setAttribute('aria-label', allLocked ? T('tap.unlock', 'Unlock') : T('tap.lock', 'Lock'));
      const icon = busy ? 'lock-unlocking-fill' : allLocked ? 'lock-fill' : 'lock-open-fill';
      const k = ctl.querySelector('.knob i');
      k.style.setProperty('--i', `url('${iconUrl(icon)}')`);
      k.style.setProperty('--k', allLocked || busy ? LOCKED_TINT : '#fff');
      ctl.classList.toggle('open', !allLocked && !busy);
      const tiles = root.querySelector('.tiles');
      if (!tiles) return;
      const html = ids.map((id) => {
        const st = S[id], on = ['unlocked', 'unlocking', 'open', 'opening'].includes(st.state) || this._door(id);
        const b = this._battery(id);
        const sub = [this._stateText(id), b != null ? Math.round(b) + '%' : ''].filter(Boolean).join(' · ');
        const ic = this._door(id) ? 'door-open' : on ? 'lock-open-fill' : 'lock-fill';
        return `<button type="button" class="t${on ? ' on' : ''}" data-id="${esc(id)}"><span class="ti" data-toggle="1"><i style="--i:url('${esc(iconUrl(ic))}');--k:${on ? '#fff' : LOCKED_TINT}"></i></span>`
          + `<span class="tx"><b>${esc(this._name(id))}</b><small>${esc(sub)}</small></span><svg class="chev" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5 6.5 6.5 1.5 11.5"/></svg></button>`;
      }).join('');
      if (tiles._html === html) return;
      tiles._html = html;
      tiles.innerHTML = html;
      tiles.querySelectorAll('.t').forEach((t) => {
        t.onclick = (e) => {
          const id = t.dataset.id;
          if (e.composedPath().some((n) => n.dataset && n.dataset.toggle)) this._act([id], ['locked', 'locking'].includes(S[id].state) ? 'unlock' : 'lock');
          else this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
        };
      });
      // Two across only while every name and state fits; one cut-off line puts them all full width.
      if (!this._fitDone) {
        tiles.classList.add('two');
        requestAnimationFrame(() => {
          const cut = [...tiles.querySelectorAll('.t b, .t small')].some((n) => n.scrollWidth > n.clientWidth + 1);
          tiles.classList.toggle('two', !cut);
          this._fitDone = true;
        });
      }
    }
    _toggleAll() {
      const S = this._hass.states, ids = this._ids();
      const anyOpen = ids.some((id) => ['unlocked', 'open'].includes(S[id].state));
      this._act(ids, anyOpen ? 'lock' : 'unlock');
    }
    async _act(ids, verb, danger) {
      const tap = window.hemmaTap;
      const ok = ids.filter((id) => !tap || tap.modeOf(id) !== 'view');
      if (!ok.length) return;
      if (tap && ok.some((id) => tap.modeOf(id) === 'ask')) {
        const word = verb === 'lock' ? T('tap.lock', 'Lock') : verb === 'open' ? T('tap.open', 'Open') : T('tap.unlock', 'Unlock');
        const name = ok.length > 1 ? (this._config.name || T('locks.popup.title', 'Locks')) : this._name(ok[0]);
        if (!(await tap.ask(T('tap.ask', '{verb} {name}?', { verb: word, name }), word, null, danger || verb !== 'lock'))) return;
      } else if (verb === 'open' && tap && !(await tap.ask(T('locks.popup.confirm_open', 'Are you sure you want to open?'), T('tap.open', 'Open'), null, true))) return;
      this._hass.callService('lock', verb, { entity_id: [...new Set(ok)] }).catch(() => {});
    }
  }
  if (!customElements.get('hemma-lock-panel')) customElements.define('hemma-lock-panel', HemmaLockPanel);
  const COVER_CSS = `
    .cover .ctl { overflow: hidden; }
    .ctl .fill { position: absolute; left: 0; right: 0; bottom: 0; background: var(--hemma-color-teal, #00C3D0); transition: height .35s cubic-bezier(0.32, 0.72, 0, 1); }
    .ctl.closed .fill, .ctl.shade.open .fill { visibility: hidden; }
    .ctl.shade .fill { top: 0; bottom: auto; }
    .ctl.dragging .fill { transition: none; }
    .ctl .glyph { position: absolute; left: 50%; bottom: 18px; width: 26px; height: 26px; transform: translateX(-50%); background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    @media (max-width: 768px) { .ctl .glyph { width: 30px; height: 30px; bottom: 24px; } }
    .ctl.closed .glyph, .ctl.shade.open .glyph { background: rgba(255,255,255,0.55); }
    .t.on .ti { background: var(--hemma-color-teal, #00C3D0); }
    .t.auto .ti { background: rgba(255,255,255,0.10); }
    .tiles.rows { --lc: var(--hemma-color-teal, #00C3D0); }
    .lr { display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 8px 10px; box-sizing: border-box; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(0,0,0,0.2); }
    .lr .tg { flex: none; width: 36px; height: 36px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; display: grid; place-items: center; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); -webkit-tap-highlight-color: transparent;
      transition: background-color .4s ease, color .4s ease; }
    .lr.on .tg { background: color-mix(in srgb, var(--lc) 24%, transparent); color: var(--lc); }
    .lr .tg i { width: 18px; height: 18px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .lr .nm { flex: 1; min-width: 0; border: 0; background: none; color: inherit; font: inherit; padding: 0; text-align: left; cursor: pointer; display: grid; gap: 1px; }
    .lr b { font-size: 14.5px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr .v { font-size: 12.5px; color: rgba(235,235,245,0.6); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr .pl { position: relative; flex: none; width: 46%; height: 36px; border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.08); cursor: pointer; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
    .lr .pl > .fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--lc); pointer-events: none; transition: width .4s cubic-bezier(0.32, 0.72, 0, 1), background-color .4s ease; }
    .lr.drag .pl > .fill { transition: background-color .4s ease; }
    .lr.on .pl > .fill::after { content: ""; position: absolute; right: 6px; top: 9px; bottom: 9px; width: 4px; border-radius: 2px; background: rgba(255,255,255,0.9); }
  `;
  const OPEN_STATES = ['open', 'opening', 'stopping'];
  class HemmaCoverPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    hemmaHero() {
      const ctl = this.shadowRoot.querySelector('.ctl');
      return ctl ? { el: ctl, icon: ctl.querySelector('.glyph'), fill: ctl.querySelector('.fill') } : null;
    }
    _ids() {
      const c = this._config, S = this._hass.states;
      const list = (Array.isArray(c.covers) ? c.covers : []).filter((id) => typeof id === 'string' && S[id]);
      return list.length ? list : (c.entity && S[c.entity] ? [c.entity] : []);
    }
    _pos(id) {
      const st = this._hass.states[id], p = st && st.attributes.current_position;
      return p != null ? Number(p) : (OPEN_STATES.includes(st && st.state) ? 100 : 0);
    }
    _kind(id) { const st = this._hass.states[id]; return window.hemmaCoverKind ? window.hemmaCoverKind(st && st.attributes.device_class, id) : { open: 'curtain-open', closed: 'curtain-closed', label: T('covers.title', 'Covers') }; }
    _name(id) { const st = this._hass.states[id]; return String((st && st.attributes.friendly_name) || id); }
    _stateText(id) {
      const st = this._hass.states[id], p = this._pos(id);
      if (st.state === 'opening') return T('covers.opening', 'Opening…');
      if (st.state === 'closing') return T('covers.closing', 'Closing…');
      if (p <= 0) return this._hass.formatEntityState ? this._hass.formatEntityState(st) : T('covers.all_closed', 'Closed');
      return p >= 100 ? (this._hass.formatEntityState ? this._hass.formatEntityState(st) : T('covers.open', 'Open')) : T('covers.pct_open', '{n}% open', { n: Math.round(p) });
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const ids = this._ids(), multi = ids.length > 1, auto = this._config.automation && this._hass.states[this._config.automation];
      const root = this.shadowRoot;
      const kind0 = this._kind(ids[0] || '');
      root.innerHTML = `<style>${SHEET_CSS}${COVER_CSS}${BIG_CSS}</style><div class="wrap cover${multi || auto ? ' multi' : ''}${multi ? ' grp' : ''}">`
        + `<div class="hd"><b></b><span></span></div>`
        + `<button type="button" class="ctl shade" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span><i class="glyph"></i></button>`
        + (multi ? groupPage(this._config.name || kind0.label, `<div class="tiles"></div>`, kind0.closed, T('covers.n_kind', '{n} {kind}', { n: ids.length, kind: kind0.label })) : auto ? `<div class="tiles"></div>` : '')
        + (multi ? '' : `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button>`)
        + `</div>`;
      const ctl = root.querySelector('.ctl');
      let g = null;
      ctl.addEventListener('pointerdown', (e) => {
        try { ctl.setPointerCapture(e.pointerId); } catch (_) {}
        g = { y: e.clientY, h: ctl.getBoundingClientRect().height, v0: this._goal ? this._goal.v : this._avg(), live: false };
      });
      ctl.addEventListener('pointermove', (e) => {
        if (!g) return;
        const dy = e.clientY - g.y;
        if (!g.live && Math.abs(dy) < 6) return;
        g.live = true;
        ctl.classList.add('dragging');
        g.v = Math.round(Math.max(0, Math.min(100, g.v0 - dy / g.h * 100)));
        this._show(g.v);
      });
      const end = () => {
        if (!g) return;
        ctl.classList.remove('dragging');
        if (!g.live) this._toggleAll(); else this._setAll(g.v);
        g = null;
      };
      ctl.addEventListener('pointerup', end);
      ctl.addEventListener('pointercancel', () => { ctl.classList.remove('dragging'); g = null; this._paint(); });
      const gear = root.querySelector('.gear');
      if (gear) gear.onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: ids[0] }, bubbles: true, composed: true }));
      bindGroup(this, root);
      this._paint();
    }
    _avg() { const ids = this._ids(); return ids.length ? Math.round(ids.reduce((t, id) => t + this._pos(id), 0) / ids.length) : 0; }
    _show(v) {
      const ctl = this.shadowRoot.querySelector('.ctl');
      ctl.querySelector('.fill').style.height = (100 - v) + '%';
      ctl.classList.toggle('open', v >= 100);
      ctl.setAttribute('aria-valuenow', String(v));
      this._holdUntil = Date.now() + 2500;
    }
    _paint() {
      const root = this.shadowRoot, S = this._hass.states, ids = this._ids();
      const ctl = root.querySelector('.ctl');
      if (!ctl || !ids.length) return;
      const multi = ids.length > 1;
      const open = ids.filter((id) => OPEN_STATES.includes(S[id].state) || this._pos(id) > 0);
      const moving = ids.find((id) => ['opening', 'closing'].includes(S[id].state));
      const kind = this._kind(ids[0]);
      root.querySelector('.hd b').textContent = multi ? (this._config.name || kind.label) : this._name(ids[0]);
      root.querySelector('.hd span').textContent = !multi ? this._stateText(ids[0])
        : moving ? (S[moving].state === 'opening' ? T('covers.opening', 'Opening…') : T('covers.closing', 'Closing…'))
        : !open.length ? T('covers.all_closed', 'All closed')
        : open.length === ids.length ? T('covers.all_open', 'All open')
        : T('covers.n_open', '{n} open', { n: open.length });
      const goal = this._goal, now = Date.now();
      if (goal) {
        if (moving) goal.moved = true;
        if (this._avg() === goal.v || (!moving && (goal.moved || now - goal.at > 10000)) || now - goal.at > 120000) this._goal = null;
      }
      if (this._goal) { if (!ctl.classList.contains('dragging')) this._show(this._goal.v); }
      else if (!(this._holdUntil && now < this._holdUntil) && !ctl.classList.contains('dragging')) this._show(this._avg()), this._holdUntil = 0;
      ctl.querySelector('.glyph').style.setProperty('--i', `url('${iconUrl(open.length ? kind.open : kind.closed)}')`);
      const tiles = root.querySelector('.tiles');
      if (!tiles) return;
      const autoId = this._config.automation, today = this._config.automation_today;
      if (multi) this._rows(tiles, ids);
      const rows = [];
      if (autoId && S[autoId]) {
        const on = S[autoId].state === 'on', sub = today && S[today] ? (this._hass.formatEntityState ? this._hass.formatEntityState(S[today]) : S[today].state) : (this._hass.formatEntityState ? this._hass.formatEntityState(S[autoId]) : S[autoId].state);
        rows.push(`<button type="button" class="t auto${on ? ' on' : ''}" data-auto="${esc(autoId)}"><span class="ti"><i style="--i:url('${esc(iconUrl('calendar-day'))}');--k:var(--hemma-color-teal, #00C3D0)"></i></span>`
          + `<span class="tx"><b>${esc(S[autoId].attributes.friendly_name || T('covers.automation', 'Cover Automation'))}</b><small>${esc(sub)}</small></span></button>`);
      }
      const html = rows.join('');
      let at = tiles.querySelector('.autos');
      if (!at) { at = document.createElement('div'); at.className = 'autos'; at.style.display = 'contents'; tiles.appendChild(at); }
      if (at._html === html) return;
      at._html = html;
      at.innerHTML = html;
      at.querySelectorAll('.t').forEach((t) => { t.onclick = () => this._hass.callService('switch', 'toggle', { entity_id: t.dataset.auto }).catch(() => {}); });
    }
    // As the light popup's members: the icon toggles, the name opens the cover's dialog, and the bar sets its position.
    _rows(tiles, ids) {
      const S = this._hass.states;
      tiles.classList.add('rows');
      let box = tiles.querySelector('.mrows');
      if (!box || box.childElementCount !== ids.length) {
        if (!box) { box = document.createElement('div'); box.className = 'mrows'; box.style.display = 'contents'; tiles.prepend(box); }
        box.textContent = '';
        ids.forEach((id) => {
          const r = document.createElement('div');
          r.className = 'lr';
          r.dataset.id = id;
          const settable = Number(S[id].attributes.supported_features) & 4;
          r.innerHTML = `<button type="button" class="tg"><i></i></button><button type="button" class="nm"><b></b><small class="v"></small></button>`
            + (settable ? `<div class="pl" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span></div>` : '');
          const show = (v) => { const f = r.querySelector('.fill'); if (f) f.style.width = (v ? Math.max(v, 6) : 0) + '%'; r.classList.toggle('on', v > 0); };
          r._show = show;
          r.querySelector('.tg').onclick = () => {
            const open = OPEN_STATES.includes(this._hass.states[id].state) || this._pos(id) > 0;
            show(open ? 0 : 100); r._hold = Date.now() + 4000;
            this._act([id], open ? 'close_cover' : 'open_cover');
          };
          r.querySelector('.nm').onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
          const pl = r.querySelector('.pl');
          if (pl) {
            let g = null;
            const at = (ev) => { const b = pl.getBoundingClientRect(); const v = Math.round(Math.max(0, Math.min(100, (ev.clientX - b.left) / b.width * 100))); show(v); r._v = v; r._hold = Date.now() + 4000; const st = this._hass.states[id]; r.querySelector('.v').textContent = v <= 0 ? (this._hass.formatEntityState ? this._hass.formatEntityState({ ...st, state: 'closed' }) : 'Closed') : v >= 100 ? T('covers.open', 'Open') : T('covers.pct_open', '{n}% open', { n: v }); };
            const send = () => { r._hold = Date.now() + 6000; this._act([id], 'set_cover_position', { position: r._v }); };
            pl.addEventListener('pointerdown', (ev) => { g = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, live: false }; });
            pl.addEventListener('pointermove', (ev) => {
              if (!g || ev.pointerId !== g.id) return;
              const dx = ev.clientX - g.x, dy = ev.clientY - g.y;
              if (!g.live) {
                if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) { if (Math.abs(dy) > 10) g = null; return; }
                g.live = true; r.classList.add('drag');
                try { pl.setPointerCapture(ev.pointerId); } catch (_) {}
              }
              at(ev);
            });
            pl.addEventListener('pointerup', (ev) => { if (!g) return; at(ev); send(); g = null; r.classList.remove('drag'); });
            pl.addEventListener('pointercancel', () => { g = null; r.classList.remove('drag'); });
          }
          box.appendChild(r);
        });
      }
      [...box.children].forEach((r) => {
        const id = r.dataset.id, s = S[id];
        if (!s) return;
        const k = this._kind(id), v = Math.round(this._pos(id)), open = OPEN_STATES.includes(s.state) || v > 0;
        r.querySelector('b').textContent = this._name(id);
        r.querySelector('.tg i').style.setProperty('--i', `url('${iconUrl(open ? k.open : k.closed)}')`);
        r.querySelector('.tg').setAttribute('aria-label', this._name(id) + ', ' + (open ? T('covers.close', 'Close') : T('actions.open', 'Open')));
        const pl = r.querySelector('.pl');
        if (pl) pl.setAttribute('aria-label', this._name(id));
        if ((r._hold && Date.now() < r._hold) || r.classList.contains('drag')) return;
        r.querySelector('.v').textContent = this._stateText(id);
        if (pl) pl.setAttribute('aria-valuenow', String(v));
        r._show(pl ? v : (open ? 100 : 0));
      });
    }
    _toggleAll() {
      const ids = this._ids(), anyOpen = ids.some((id) => this._pos(id) > 0 || OPEN_STATES.includes(this._hass.states[id].state));
      this._show(anyOpen ? 0 : 100);
      this._goal = { v: anyOpen ? 0 : 100, at: Date.now() };
      this._act(ids, anyOpen ? 'close_cover' : 'open_cover');
    }
    _setAll(v) {
      const S = this._hass.states, ids = this._ids();
      const settable = ids.filter((id) => Number(S[id].attributes.supported_features) & 4);
      const rest = ids.filter((id) => settable.indexOf(id) < 0);
      this._goal = { v, at: Date.now() };
      if (settable.length) this._act(settable, 'set_cover_position', { position: v });
      if (rest.length) this._act(rest, v > 0 ? 'open_cover' : 'close_cover');
    }
    async _act(ids, svc, extra) {
      const tap = window.hemmaTap;
      const ok = ids.filter((id) => !tap || tap.modeOf(id) !== 'view');
      if (!ok.length) { this._goal = null; return this._paint(); }
      if (tap && ok.some((id) => tap.modeOf(id) === 'ask')) {
        const word = svc === 'close_cover' || (extra && extra.position === 0) ? T('tap.close', 'Close') : T('tap.open', 'Open');
        const name = ok.length > 1 ? (this._config.name || this._kind(ok[0]).label) : this._name(ok[0]);
        if (!(await tap.ask(T('tap.ask', '{verb} {name}?', { verb: word, name }), word, null))) { this._holdUntil = 0; this._goal = null; return this._paint(); }
      }
      this._hass.callService('cover', svc, { entity_id: [...new Set(ok)], ...(extra || {}) }).catch(() => {});
    }
  }
  if (!customElements.get('hemma-cover-panel')) customElements.define('hemma-cover-panel', HemmaCoverPanel);
  const FAN_CSS = `
    .fanb .ctl { height: 224px; margin: auto 0 24px; }
    .acts { flex: none; display: flex; gap: 10px; margin-bottom: 62px; }
    .act { position: relative; border: 0; background: none; color: rgba(255,255,255,0.85); font: inherit; font-size: 12px; padding: 0; display: grid; justify-items: center; gap: 6px; cursor: pointer; min-width: 58px; -webkit-tap-highlight-color: transparent; }
    .act > span { width: 52px; height: 52px; border-radius: 50%; background: rgba(0,0,0,0.2); display: grid; place-items: center; transition: background-color .2s ease; }
    .act.on > span { background: var(--hemma-color-teal, #00C3D0); }
    .act i { width: 22px; height: 22px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .act small { font-size: 12px; max-width: 84px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ctl.sw { margin: auto 0 0; }
    .ptile { flex: none; margin: 22px 0 66px; display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 18px 8px 14px; box-sizing: border-box; border: 0; border-radius: 16px; background: rgba(0,0,0,0.22); color: #fff; font: inherit; text-align: left; cursor: pointer; transition: filter .4s ease; -webkit-tap-highlight-color: transparent; }
    .ptile i { width: 20px; height: 20px; flex: none; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .ptile span { display: grid; gap: 1px; }
    .ptile small { font-size: 12.5px; color: rgba(235,235,245,0.6); }
    .ptile b { font-size: 15px; font-weight: 600; }
    .menu { position: absolute; left: 0; top: 0; width: max-content; max-width: calc(100% - 16px); max-height: 70%; overflow-y: auto; padding: 6px; gap: 2px; box-sizing: border-box; border-radius: 18px; border: 0.5px solid rgba(255,255,255,0.1); background: rgba(36,36,40,0.78); -webkit-backdrop-filter: blur(20px) saturate(140%); backdrop-filter: blur(20px) saturate(140%); box-shadow: 0 16px 40px -12px rgba(0,0,0,0.6); display: grid; z-index: 3; }
    .menu[hidden] { display: none; }
    .cover .ctl:has(+ .fpow) { margin-bottom: 0; }
    .fpow { flex: none; margin: 20px 0 auto; padding-bottom: 66px; }
    .pow { flex: none; width: 52px; height: 52px; border: 0; padding: 0; border-radius: 50%; background: rgba(0,0,0,0.24); color: #fff; display: grid; place-items: center; cursor: pointer; transition: filter .4s ease, background-color .2s ease; -webkit-tap-highlight-color: transparent; }
    .pow.on { background: rgba(0,195,208,0.24); color: #7fe9f0; }
    .pow svg { width: 22px; height: 22px; }
    .fx { gap: 16px; margin: 20px 0 66px; }
    .fx .act { display: grid; place-items: center; min-width: 0; width: 52px; height: 52px; padding: 0; border-radius: 50%; background: rgba(0,0,0,0.24); color: #fff; transition: filter .4s ease, background-color .2s ease; }
    .fx .act > span { width: auto; height: auto; background: none; }
    .fx .act i { width: 22px; height: 22px; background: currentColor; }
    .fx .act small { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    .fx .act.on { background: rgba(0,195,208,0.24); color: #7fe9f0; }
    .fx .act.on > span { background: none; }
    @media (hover: hover) { .pow:hover { filter: brightness(0.84); transition: filter .18s ease, background-color .2s ease; } }
    .menu button { position: relative; height: 40px; border: 0; border-radius: 12px; background: none; color: #fff; font: inherit; font-size: 14px; text-align: left; padding: 0 18px 0 12px; white-space: nowrap; display: flex; align-items: center; cursor: pointer; }
    .menu button .mi { flex: none; width: 18px; height: 18px; margin-right: 10px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .menu button.on { background: rgba(255,255,255,0.1); color: var(--hemma-color-teal, #00C3D0); }
    .act > span { transition: filter .4s ease, background-color .2s ease; }
    @media (hover: hover) { .menu button:hover { background: rgba(255,255,255,0.08); } .act:hover > span, .ptile:hover, .fx .act:hover { filter: brightness(0.84); transition: filter .18s ease, background-color .2s ease; } }
    @media (max-width: 768px) { .fpow { padding-bottom: 80px; } .acts.fx { margin-bottom: 80px; gap: 20px; } .fanb .ctl { height: 300px; } .acts { margin-bottom: 76px; } .ptile { margin-bottom: 80px; } }
  `;
  const FAN_POWER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v8"/><path d="M7 6.3a7.5 7.5 0 1 0 10 0"/></svg>';
  // Apple Home's selector: a dark capsule naming the choice, which grows into a frosted menu in its own place and shrinks back once something is picked.
  const CAPS_CSS = `
    .caps { flex: none; align-self: stretch; display: flex; justify-content: center; gap: 10px; margin: 22px 0 var(--caps-mb, 14px); }
    .capsel { position: relative; flex: 0 1 260px; min-width: 0; height: 52px; border: 0; border-radius: 26px; padding: 0 42px; background: rgba(0,0,0,0.3); color: #fff; font: inherit; font-size: 16px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; cursor: pointer; transition: opacity .2s ease, filter .3s ease; -webkit-tap-highlight-color: transparent; }
    .caps .capsel + .capsel, .caps:has(.capsel + .capsel) .capsel { flex: 1 1 0; padding: 0 34px 0 18px; }
    .capsel span { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .capsel .ud { position: absolute; right: 18px; top: 50%; width: 10px; height: 16px; margin-top: -8px; background: rgba(255,255,255,0.85); -webkit-mask: url("${CHEV_UD}") center / contain no-repeat; mask: url("${CHEV_UD}") center / contain no-repeat; }
    @media (hover: hover) { .capsel:hover { filter: brightness(1.15); } }
    /* iPad and iPhone: Liquid Glass that takes the capsule's place; the pressed row lights up like a lens. */
    /* Measured off Apple Home on the iPhone: near-clear glass that takes the room's color, a thin bright lens edge all round. */
    .gmenu { position: absolute; z-index: 8; min-width: 200px; padding: 7px; box-sizing: border-box; border-radius: 30px; display: grid; touch-action: none;
      /* No white wash, which greys it: the room itself brightened about a fifth and kept its color, a dark hairline round it, light caught along the bottom and a soft glow inside the top. */
      background: rgba(255,255,255,0.02);
      -webkit-backdrop-filter: blur(24px) saturate(1.25) brightness(1.2); backdrop-filter: blur(24px) saturate(1.25) brightness(1.2);
      box-shadow: 0 0 0 0.5px rgba(0,0,0,0.42), inset 0 -1px 0 rgba(255,255,255,0.2), inset 0 -7px 9px -7px rgba(255,255,255,0.08), inset 0 9px 11px -9px rgba(255,255,255,0.1),
        inset 0 1px 0 rgba(255,255,255,0.1), 0 18px 44px -14px rgba(0,0,0,0.3); }
    .gmenu button { position: relative; height: 44px; border: 0; border-radius: 22px; background: none; color: #fff; font: inherit; font-size: 17px; font-weight: 400; text-align: left; padding: 0 18px 0 38px; cursor: pointer; white-space: nowrap; -webkit-tap-highlight-color: transparent; transition: background-color .18s ease, box-shadow .18s ease; }
    .gmenu button.hl { background: radial-gradient(130% 160% at 28% 0%, rgba(255,255,255,0.5), rgba(255,255,255,0.2) 55%, rgba(255,255,255,0.1));
      box-shadow: inset 0 0.5px 0 rgba(255,255,255,0.75), inset 0 -0.5px 0 rgba(255,255,255,0.25), 0 6px 16px -8px rgba(0,0,0,0.35); }
    .gmenu button.on::before { content: ""; position: absolute; left: 14px; top: 50%; width: 13px; height: 13px; margin-top: -6.5px; background: #fff;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 8.6 6.3 12.2 13.5 4.2'/%3E%3C/svg%3E") center / contain no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 8.6 6.3 12.2 13.5 4.2'/%3E%3C/svg%3E") center / contain no-repeat; }
    /* The Mac: an ordinary menu opening under the capsule, its row lit in the accent color on hover. */
    .gmenu.mac { min-width: 0; padding: 5px; border-radius: 13px; touch-action: auto;
      /* Measured off Apple Home's Mac menu: a fill a shade lighter than the room, a black hairline, light only along the top and bottom edges. */
      background: rgba(255,255,255,0.09);
      -webkit-backdrop-filter: blur(24px) saturate(1.5); backdrop-filter: blur(24px) saturate(1.5);
      box-shadow: 0 0 0 0.75px rgba(0,0,0,0.78), inset 0 1px 0 rgba(255,255,255,0.42), inset 0 2px 3px -2px rgba(255,255,255,0.3), inset 0 -1px 0 rgba(255,255,255,0.36),
        inset 1px 0 0 rgba(255,255,255,0.07), inset -1px 0 0 rgba(255,255,255,0.07), 0 14px 32px -12px rgba(0,0,0,0.5); }
    .gmenu.mac button { height: 24px; border-radius: 7px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.92); padding: 0 14px 0 25px; transition: none; }
    .gmenu.mac button.on::before { left: 8px; width: 11px; height: 11px; margin-top: -5.5px; }
    .gmenu.mac button.hl { color: #fff; }
    .gmenu.mac button.hl { background: #0a84ff; background: AccentColor; box-shadow: none; }
    .capsel.held, .grp.held { opacity: 0.55; }
    .gmenu.act button { padding-left: 18px; }
    .gmenu button:has(.gi) { padding-right: 50px; }
    .gmenu.mac.act button { padding-left: 12px; }
    .gmenu.mac button:has(.gi) { padding-right: 40px; }
    .gmenu .gm { display: block; width: 100%; height: 100%; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .gmenu .gi { position: absolute; right: 16px; top: 50%; width: 19px; height: 19px; margin-top: -9.5px; display: grid; place-items: center; pointer-events: none; }
    .gmenu.mac .gi { right: 10px; width: 14px; height: 14px; margin-top: -7px; }
    .gmenu .gi svg { width: 100%; height: 100%; }
    @media (max-width: 768px) { .caps { --caps-mb: 80px; } }
  `;
  const capPick = (cap, items, current, onPick, host) => {
    const wrap = host || cap.closest('.wrap');
    const old = wrap.querySelector('.gmenu');
    if (old) { old._close(); return; }
    const mac = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const m = document.createElement('div');
    m.className = 'gmenu' + (mac ? ' mac' : '') + (current == null ? ' act' : '');
    m.innerHTML = items.map(([k, l, ic]) => `<button type="button" data-k="${esc(k)}" class="${k === current ? 'on' : ''}">${esc(l)}${ic ? `<i class="gi">${ic}</i>` : ''}</button>`).join('');
    m.style.visibility = 'hidden';
    wrap.appendChild(m);
    const wr = wrap.getBoundingClientRect(), cr = cap.getBoundingClientRect();
    const w = Math.max(cr.width, m.offsetWidth), h = m.offsetHeight;
    // Centered on its selector, as Apple's are, only nudged in to stay inside the popup.
    const left = Math.max(8, Math.min(wr.width - w - 8, cr.left - wr.left + cr.width / 2 - w / 2));
    let top, fromClip;
    if (mac) {
      // Under the capsule where it fits, above it where it would run off the popup.
      const below = cr.bottom - wr.top + 2;
      top = below + h <= wr.height - 6 ? below : cr.top - wr.top - h - 2;
      fromClip = top > cr.top - wr.top ? `inset(0 0 ${h}px 0 round 12px)` : `inset(${h}px 0 0 0 round 12px)`;
    } else {
      // In the capsule's own place, growing up out of it, or down from it when it sits at the top.
      const cl = Math.max(0, cr.left - wr.left - left), crr = Math.max(0, left + w - (cr.right - wr.left));
      if (cr.top + cr.height / 2 > wr.top + wr.height / 2 && cr.bottom - wr.top - h >= 8) { top = cr.bottom - wr.top - h; fromClip = `inset(${h - cr.height}px ${crr}px 0 ${cl}px round 26px)`; }
      else { top = cr.top - wr.top; fromClip = `inset(0 ${crr}px ${h - cr.height}px ${cl}px round 26px)`; }
    }
    // As in Apple Home, the menu comes close to the popup's main control but never covers it; short of room, it spreads down over its own selector instead.
    const hero = [...wrap.querySelectorAll('.ctl, .dial')].find((n) => n.offsetParent !== null && !n.contains(cap) && n.getBoundingClientRect().bottom <= cr.top + 1);
    if (hero) { const floor = hero.getBoundingClientRect().bottom - wr.top + 6; if (top < floor) top = Math.min(floor, Math.max(8, wr.height - h - 8)); }
    Object.assign(m.style, { left: left + 'px', top: top + wrap.scrollTop + 'px', width: w + 'px', visibility: '' });
    const full = mac ? 'inset(0 round 12px)' : 'inset(0 round 26px)';
    // The Mac's menu is there at once, as Apple Home's is; it only fades on the way out.
    // Touch is Apple's liquid glass: the capsule pinches away, a blob of glass swells out of its middle into the menu, and the rows sharpen out of a blur.
    const mr = m.getBoundingClientRect();
    const ox = cr.left + cr.width / 2 - mr.left, oy = cr.top + cr.height / 2 - mr.top;
    // Frame-measured off Apple Home's humidifier menu (60 fps): the capsule squeezes into a blob, the blob swells tall then wide, the text lands last.
    // Each frame carries its own corner radius: scaling squashes corners, and the blob has to stay round, not turn into a small rectangle.
    const kf = (sx, sy, more) => { const r = Math.min(30, Math.min(w * sx, h * sy) / 2); return { transform: `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`, borderRadius: `${(r / sx).toFixed(1)}px / ${(r / sy).toFixed(1)}px`, ...more }; };
    const sc = (x, y, more) => kf(Math.min(1, (cr.width * x) / w), Math.min(1, (cr.height * y) / h), more);
    // A tall menu keeps the blob near the selector's height until it widens, then takes its full height last.
    const tall = Math.min(1, Math.max(cr.height * 1.6, h * 0.6) / h);
    m.style.transformOrigin = `${ox}px ${oy}px`;
    const rows = () => [...m.querySelectorAll('button')];
    if (!reduce && !mac) {
      // The selector becomes the blob with no gap between them: the glass is already there, faint, as the selector squeezes in.
      cap.animate([{ transform: 'none', opacity: 1, filter: 'blur(0px)' }, { transform: 'scale(0.75, 0.88)', opacity: 0.85, filter: 'blur(1px)', offset: 0.6 }, { transform: 'scale(0.5, 0.9)', opacity: 0, filter: 'blur(3px)' }], { duration: 60, easing: 'ease-in', fill: 'forwards' });
      m.animate([
        sc(0.5, 0.95, { opacity: 0.35, offset: 0 }),
        sc(0.36, 1.25, { opacity: 1, offset: 0.12 }),
        sc(0.38, 1.5, { offset: 0.22 }),
        sc(0.52, 1.45, { offset: 0.32 }),
        kf(0.74, tall, { offset: 0.45 }),
        kf(0.95, 0.96, { offset: 0.62 }),
        kf(1, 1, { opacity: 1, offset: 1 }),
      ], { duration: 320, delay: 15, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'backwards' });
      rows().forEach((b) => b.animate([{ opacity: 0, filter: 'blur(10px)' }, { opacity: 0.6, filter: 'blur(4px)', offset: 0.4 }, { opacity: 1, filter: 'blur(0px)' }], { duration: 120, delay: 95, easing: 'ease-out', fill: 'backwards' }));
    }
    if (mac) cap.classList.add('held'); else if (reduce) cap.style.opacity = '0';
    let done = false;
    const close = (after) => {
      if (done) return; done = true;
      document.removeEventListener('pointerdown', away, true);
      const fin = () => { m.remove(); cap.style.opacity = ''; cap.classList.remove('held'); if (after) after(); };
      if (reduce || mac) { if (mac && !reduce) { m.style.pointerEvents = 'none'; m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out', fill: 'forwards' }).finished.then(fin, fin); } else fin(); return; }
      // Back the way it came: the menu draws into the capsule's middle as the rows blur away, and the capsule comes back out of it.
      m.style.pointerEvents = 'none';
      rows().forEach((b) => b.animate([{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(8px)' }], { duration: 70, easing: 'ease-in', fill: 'forwards' }));
      m.animate([kf(1, 1, { opacity: 1 }), kf(0.75, tall, { offset: 0.3 }), sc(0.42, 1.6, { opacity: 0.85, offset: 0.6 }), sc(0.36, 1.25, { opacity: 0 })],
        { duration: 170, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'forwards' }).finished.then(fin, fin);
      cap.getAnimations().forEach((a) => a.cancel());
      // The selector's shape opens out from the middle; its words stay their own size, as Apple's do, so nothing looks like it flips.
      const cR = getComputedStyle(cap).borderTopLeftRadius || '0px';
      cap.animate([{ clipPath: `inset(0 31% 0 31% round ${cR})`, opacity: 0 }, { opacity: 1, offset: 0.22 }, { clipPath: `inset(0 0% 0 0% round ${cR})`, opacity: 1 }], { duration: 200, delay: 100, easing: 'cubic-bezier(0.3, 0.8, 0.3, 1)', fill: 'backwards' });
    };
    m._close = () => close();
    // The tap that puts the menu away does only that: its click and touchend never reach the popup, which would close too.
    const away = (e) => {
      if (e.composedPath().includes(m)) return;
      e.stopPropagation();
      const eat = (x) => { x.stopPropagation(); x.preventDefault(); };
      ['click', 'touchend'].forEach((t) => document.addEventListener(t, eat, { capture: true, once: true }));
      setTimeout(() => ['click', 'touchend'].forEach((t) => document.removeEventListener(t, eat, { capture: true })), 700);
      close();
    };
    setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
    const pick = (b) => { if (!b) return; const k = b.dataset.k; if (!mac) { b.classList.add('hl'); setTimeout(() => close(() => { if (k !== current) onPick(k); }), 140); } else close(() => { if (k !== current) onPick(k); }); };
    const rowAt = (x, y) => [...m.querySelectorAll('button')].find((b) => { const r = b.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
    const light = (b) => m.querySelectorAll('button').forEach((x) => x.classList.toggle('hl', x === b));
    if (mac) {
      m.addEventListener('pointermove', (e) => light(rowAt(e.clientX, e.clientY)));
      m.addEventListener('pointerleave', () => light(null));
      m.onclick = (e) => pick(e.target.closest('button'));
    } else {
      // As on iOS: the row under the finger lights while it moves, and lifting the finger picks it.
      let down = false;
      m.addEventListener('pointerdown', (e) => { down = true; try { m.setPointerCapture(e.pointerId); } catch (_) {} light(rowAt(e.clientX, e.clientY)); });
      m.addEventListener('pointermove', (e) => { if (down) light(rowAt(e.clientX, e.clientY)); });
      m.addEventListener('pointerup', (e) => { if (!down) return; down = false; const b = rowAt(e.clientX, e.clientY); if (b) pick(b); else light(null); });
      m.addEventListener('pointercancel', () => { down = false; light(null); });
      m.onclick = (e) => e.stopPropagation();
    }
  };
  // The home capsule's press: a glow that lights where the finger lands and fades, on every glass button in the popups.
  if (!window._hemmaGlassPress) {
    window._hemmaGlassPress = true;
    // Buttons only: .grp is also every group popup's whole body, so the camera pill is named by where it sits.
    const SEL = 'button:is(.gb, .gear, .back, .corner, .lpill, .rback, .cornerx, .capsel), .root > .grp';
    document.addEventListener('pointerdown', (e) => {
      const path = e.composedPath();
      if (!path.some((n) => n.tagName && n.tagName.startsWith('HEMMA-'))) return;
      const el = path.find((n) => n.nodeType === 1 && n.matches && n.matches(SEL));
      if (!el || el.disabled) return;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      const x = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), y = r.width > r.height * 1.5 ? 50 : Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100));
      const f = document.createElement('span');
      f.style.cssText = `position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at ${x.toFixed(1)}% ${y.toFixed(1)}%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.15) 55%, rgba(255,255,255,0.05) 100%);opacity:0`;
      el.prepend(f);
      const a = f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'ease-out', fill: 'forwards' });
      setTimeout(() => { a.cancel(); f.style.opacity = '1'; const b = f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' }); b.finished.then(() => f.remove(), () => f.remove()); }, 150);
    }, true);
  }
  // Any popup that scrolls keeps its title pinned, with the light popup's header veil behind it once the content moves under.
  if (!window._hemmaHdVeil) {
    window._hemmaHdVeil = true;
    const arm = (e) => {
      const wrap = e.composedPath().find((n) => n.nodeType === 1 && n.classList && (n.classList.contains('wrap') || n.classList.contains('page')) && n.querySelector(':scope > .hd, :scope > .h'));
      if (!wrap || wrap._hv || wrap.scrollHeight <= wrap.clientHeight + 2 || !/(auto|scroll)/.test(getComputedStyle(wrap).overflowY)) return;
      wrap._hv = true;
      const hd = wrap.querySelector(':scope > .hd, :scope > .h');
      const pad = parseFloat(getComputedStyle(wrap).paddingTop) || 0, top = Math.max(0, hd.offsetTop - pad);
      wrap.classList.add('hv');
      // The title pins where it already sits; the band reaches the panel's top and both side edges, no further, so nothing can scroll sideways.
      wrap.style.setProperty('--hv-top', top + 'px');
      wrap.style.setProperty('--hv-pad', (pad + top) + 'px');
      wrap.style.setProperty('--hv-l', -hd.offsetLeft + 'px');
      wrap.style.setProperty('--hv-r', -(wrap.clientWidth - hd.offsetLeft - hd.offsetWidth) + 'px');
      wrap.addEventListener('scroll', () => {
        const on = wrap.scrollTop > 2;
        wrap.classList.toggle('scrolled', on);
        wrap.dispatchEvent(new CustomEvent('hemma-veil', { detail: on, bubbles: true, composed: true }));
      }, { passive: true });
    };
    ['wheel', 'touchstart', 'pointerdown'].forEach((t) => document.addEventListener(t, arm, { capture: true, passive: true }));
  }
  const mIco = (u) => `<span class="gm" style="--i:url('${esc(u)}')"></span>`;
  const capButton = (cls) => `<button type="button" class="capsel ${cls}"><span></span><i class="ud"></i></button>`;
  const FAN_ICONS = {
    mode: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 7h10v2H3zm14 0h4v2h-4zm-3-3h2v8h-2zM3 15h4v2H3zm8 0h10v2H11zm-3-3h2v8H8z'/%3E%3C/svg%3E",
    osc: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4 12a8 8 0 0 1 14.9-4H16v2h6V4h-2v2.3A10 10 0 0 0 2 12zm16 0a8 8 0 0 1-14.9 4H8v-2H2v6h2v-2.3A10 10 0 0 0 22 12z'/%3E%3C/svg%3E",
    dir: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4 11h12.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H4z'/%3E%3C/svg%3E",
  };
  class HemmaFanPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    hemmaHero() {
      const r = this.shadowRoot, ctl = r.querySelector('.ctl:not(.sw)'), sw = r.querySelector('.ctl.sw');
      if (ctl) return { el: ctl, icon: ctl.querySelector('.glyph'), fill: ctl.querySelector('.fill') };
      return sw ? { el: sw, icon: sw.querySelector('.knob i'), fill: sw.querySelector('.knob') } : null;
    }
    _st() { return this._hass.states[this._config.entity]; }
    _sf() { const st = this._st(); return Number((st && st.attributes.supported_features) || 0); }
    _pct() { const st = this._st(); return st && st.state === 'on' ? Number(st.attributes.percentage || 0) : 0; }
    _icon() { return this._config.icon || (/purif|air/i.test(this._config.entity + ' ' + ((this._st() || {}).attributes || {}).friendly_name) ? 'purifier' : 'fan'); }
    _mode(m) { return attrName(this._hass, this._st(), 'preset_mode', m); }
    _modeGlyph(m) { const n = m ? attrIcon(this._icons, 'preset_mode', m) : ''; return n && n.slice(4) in mdi.paths ? mdiFull(n) : FAN_ICONS.mode; }
    _build() {
      if (!this._config || !this._hass || !this._st()) return;
      this._built = true;
      const wide = wideSheet(), sf = this._sf(), st = this._st(), speed = !!(sf & 1), presets = (sf & 8) && (st.attributes.preset_modes || []).length;
      const extras = speed && (presets || (sf & 2) || (sf & 4));
      const root = this.shadowRoot;
      const pow = `<button type="button" class="pow" aria-label="${esc(T('tap.toggle', 'Toggle'))}">${FAN_POWER}</button>`;
      // Every setting is a labeled tile that opens a menu, as the climate popup's are: nothing changes on a single tap.
      const ctl4 = speed ? [['power', T('media.power', 'Power'), iconUrl('power_on')], presets ? ['mode', T('fan.mode', 'Mode'), FAN_ICONS.mode] : null,
        (sf & 2) ? ['osc', T('fan.oscillation', 'Oscillation'), FAN_ICONS.osc] : null, (sf & 4) ? ['dir', T('fan.direction', 'Direction'), FAN_ICONS.dir] : null].filter(Boolean) : [];
      root.innerHTML = `<style>${SHEET_CSS}${COVER_CSS}${FAN_CSS}${CT_CSS}${BIG_CSS}${CAPS_CSS}</style><div class="wrap cover${speed ? ' fanb' : ''}">`
        + `<div class="hd"><b></b><span></span></div>`
        + (speed ? `<button type="button" class="ctl" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span><i class="glyph"></i></button>`
          : `<button type="button" class="ctl sw" role="switch" aria-label="${esc(T('tap.toggle', 'Toggle'))}"><span class="knob"><i></i></span></button>`)
        + (ctl4.length ? `<div class="ctiles" data-n="${ctl4.length}">${ctl4.map(([k, l, ic]) => `<button type="button" class="ct" data-k="${k}"><i style="--i:url(&quot;${ic}&quot;)"></i><span class="tx"><small>${esc(l)}</small><b></b></span></button>`).join('')}</div>` : '')
        + (!speed && presets ? `<button type="button" class="ptile"><i></i><span><small>${esc(T('fan.preset_mode', 'Preset mode'))}</small><b></b></span></button>` : '')
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button></div>`;
      const id = this._config.entity;
      root.querySelector('.gear').onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
      const ctl = root.querySelector('.ctl:not(.sw)');
      if (ctl) {
        let g = null;
        ctl.addEventListener('pointerdown', (e) => { try { ctl.setPointerCapture(e.pointerId); } catch (_) {} g = { y: e.clientY, h: ctl.getBoundingClientRect().height, v0: this._pct(), live: false }; });
        ctl.addEventListener('pointermove', (e) => {
          if (!g) return;
          const dy = e.clientY - g.y;
          if (!g.live && Math.abs(dy) < 6) return;
          g.live = true;
          ctl.classList.add('dragging');
          const step = Number(this._st().attributes.percentage_step) || 1;
          g.v = Math.max(0, Math.min(100, Math.round((g.v0 - dy / g.h * 100) / step) * step));
          this._show(g.v);
        });
        ctl.addEventListener('pointerup', () => {
          if (!g) return;
          ctl.classList.remove('dragging');
          if (!g.live) this._toggle();
          else this._act(g.v ? 'set_percentage' : 'turn_off', g.v ? { percentage: g.v } : {});
          g = null;
        });
        ctl.addEventListener('pointercancel', () => { g = null; ctl.classList.remove('dragging'); this._paint(); });
      }
      const sw = root.querySelector('.ctl.sw');
      if (sw) {
        let y0 = null, moved = false;
        sw.addEventListener('pointerdown', (e) => { y0 = e.clientY; moved = false; try { sw.setPointerCapture(e.pointerId); } catch (_) {} });
        sw.addEventListener('pointermove', (e) => {
          if (y0 == null || moved) return;
          const dy = e.clientY - y0, up = sw.classList.contains('up');
          if (Math.abs(dy) > 24) { moved = true; if ((dy > 0 && up) || (dy < 0 && !up)) this._toggle(); }
        });
        sw.addEventListener('pointerup', () => { if (y0 != null && !moved) this._toggle(); y0 = null; });
        sw.addEventListener('pointercancel', () => { y0 = null; });
      }
      const onOff = [['on', T('lights.on', 'On')], ['off', T('lights.off', 'Off')]];
      root.querySelectorAll('.ct').forEach((b) => { b.onclick = (e) => {
        e.stopPropagation();
        const a = this._st().attributes, k = b.dataset.k;
        if (k === 'power') capPick(b, onOff, this._st().state === 'on' ? 'on' : 'off', (v) => this._act(v === 'on' ? 'turn_on' : 'turn_off', {}));
        if (k === 'mode') capPick(b, (a.preset_modes || []).map((m) => [m, this._mode(m), mIco(mdiFull(attrIcon(this._icons, 'preset_mode', m)))]), a.preset_mode, (m) => this._act('set_preset_mode', { preset_mode: m }));
        if (k === 'osc') capPick(b, onOff, a.oscillating ? 'on' : 'off', (v) => this._act('oscillate', { oscillating: v === 'on' }));
        if (k === 'dir') capPick(b, [['forward', T('fan.forward', 'Forward')], ['reverse', T('fan.reverse', 'Reverse')]], a.direction === 'reverse' ? 'reverse' : 'forward', (v) => this._act('set_direction', { direction: v }));
      }; });
      const mode = root.querySelector('.ptile');
      if (mode) mode.onclick = (e) => {
        e.stopPropagation();
        capPick(mode, (this._st().attributes.preset_modes || []).map((m) => [m, this._mode(m), mIco(mdiFull(attrIcon(this._icons, 'preset_mode', m)))]), this._st().attributes.preset_mode,
          (m) => this._act('set_preset_mode', { preset_mode: m }));
      };
      iconsFor(this._hass, this._config.entity, 'fan').then((I) => {
        this._icons = I;
        needMdi((this._st().attributes.preset_modes || []).map((m) => attrIcon(I, 'preset_mode', m)), () => this._paint());
        this._paint();
      });
      this._paint();
    }
    _show(v) {
      const ctl = this.shadowRoot.querySelector('.ctl:not(.sw)');
      if (!ctl) return;
      ctl.querySelector('.fill').style.height = v + '%';
      ctl.classList.toggle('closed', v <= 0);
      ctl.setAttribute('aria-valuenow', String(v));
      this._holdUntil = Date.now() + 2500;
    }
    _paint() {
      const root = this.shadowRoot, st = this._st();
      if (!st || !root.querySelector('.hd')) return;
      const on = st.state === 'on', a = st.attributes, pct = this._pct();
      root.querySelector('.hd b').textContent = this._config.name || a.friendly_name || this._config.entity;
      root.querySelector('.hd span').textContent = !on ? (this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state)
        : [a.preset_mode ? this._mode(a.preset_mode) : '', a.oscillating ? T('fan.oscillating', 'Oscillating') : '', a.direction === 'reverse' ? T('fan.reverse', 'Reverse') : '', (this._sf() & 1) && a.percentage != null ? Math.round(a.percentage) + '%' : ''].filter(Boolean).join(' · ') || (this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state);
      const ctl = root.querySelector('.ctl:not(.sw)');
      if (ctl) {
        if (!(this._holdUntil && Date.now() < this._holdUntil) && !(this._was && (this._st() || {}).last_updated === this._was && Date.now() - this._wasAt < 10000) && !ctl.classList.contains('dragging')) { this._show(pct); this._holdUntil = 0; }
        ctl.querySelector('.glyph').style.setProperty('--i', `url('${iconUrl(this._icon())}')`);
      }
      const sw = root.querySelector('.ctl.sw');
      if (sw) { sw.classList.toggle('up', on); sw.classList.toggle('open', on); sw.setAttribute('aria-checked', String(on)); sw.querySelector('.knob i').style.setProperty('--i', `url('${iconUrl(this._icon())}')`); }
      root.querySelectorAll('.pow').forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? T('tap.turn_off', 'Turn Off') : T('tap.turn_on', 'Turn On')); });
      const mode = root.querySelector('.act.mode:not(.ft) small');
      if (mode) {
        mode.textContent = a.preset_mode ? this._mode(a.preset_mode) : T('fan.mode', 'Mode');
        root.querySelector('.act.mode i').style.setProperty('--i', `url("${this._modeGlyph(a.preset_mode)}")`);
      }
      const ct = (k, v) => { const b = root.querySelector(`.ct[data-k="${k}"] b`); if (b) b.textContent = v; };
      ct('power', on ? T('lights.on', 'On') : T('lights.off', 'Off'));
      ct('mode', a.preset_mode ? this._mode(a.preset_mode) : '—');
      ct('osc', a.oscillating ? T('lights.on', 'On') : T('lights.off', 'Off'));
      ct('dir', a.direction === 'reverse' ? T('fan.reverse', 'Reverse') : T('fan.forward', 'Forward'));
      const mi = root.querySelector('.ct[data-k="mode"] i');
      if (mi) mi.style.setProperty('--i', `url("${this._modeGlyph(a.preset_mode)}")`);
      const osc = root.querySelector('.act.osc');
      if (osc) osc.classList.toggle('on', !!a.oscillating);
      const dir = root.querySelector('.act.dir');
      if (dir && !dir.classList.contains('ft')) dir.querySelector('small').textContent = a.direction === 'reverse' ? T('fan.reverse', 'Reverse') : T('fan.forward', 'Forward');
      const pt = root.querySelector('.ptile');
      if (pt) {
        pt.querySelector('b').textContent = a.preset_mode ? this._mode(a.preset_mode) : '—';
        pt.querySelector('i').style.setProperty('--i', `url("${this._modeGlyph(a.preset_mode)}")`);
      }
    }
    _toggle() {
      const on = this._st().state === 'on';
      if (this.shadowRoot.querySelector('.ctl:not(.sw)')) this._show(on ? 0 : (Number(this._st().attributes.percentage) || 100));
      this._act(on ? 'turn_off' : 'turn_on', {});
    }
    async _act(svc, data) {
      const tap = window.hemmaTap, id = this._config.entity;
      this._was = (this._st() || {}).last_updated; this._wasAt = Date.now();
      if (tap && tap.modeOf(id) === 'view') { this._holdUntil = 0; this._was = null; return this._paint(); }
      if (tap && tap.modeOf(id) === 'ask') {
        const name = this._config.name || this._st().attributes.friendly_name || id;
        const word = svc === 'turn_off' ? T('tap.turn_off', 'Turn Off') : svc === 'turn_on' ? T('tap.turn_on', 'Turn On') : T('tap.change', 'Change');
        if (!(await tap.ask(T('tap.ask', '{verb} {name}?', { verb: word, name }), word, null))) { this._holdUntil = 0; this._was = null; return this._paint(); }
      }
      this._hass.callService('fan', svc, { entity_id: id, ...data }).catch(() => {});
    }
  }
  if (!customElements.get('hemma-fan-panel')) customElements.define('hemma-fan-panel', HemmaFanPanel);
  const SVG_I = (d) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${d}</svg>`);
  const XI = {
    check: SVG_I('<path d="M9.5 16.2 5.3 12l-1.5 1.5 5.7 5.7L20.2 8.5 18.7 7Z"/>'),
    box: SVG_I('<path d="M12 2 3 7v10l9 5 9-5V7Zm0 2.3L18.5 8 12 11.6 5.5 8ZM5 9.7l6 3.3v6.6l-6-3.3Zm8 9.9V13l6-3.3v6.6Z"/>'),
    drop: SVG_I('<path d="M12 2.5S5 10.2 5 15a7 7 0 0 0 14 0c0-4.8-7-12.5-7-12.5Z"/>'),
    sun: SVG_I('<circle cx="12" cy="12" r="5"/><path d="M11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8-1.4 1.4zM15.6 17l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4-2.8 2.8z"/>'),
    beaker: SVG_I('<path d="M8 2h8v2h-1v5.3l5.4 9.3A2.3 2.3 0 0 1 18.4 22H5.6a2.3 2.3 0 0 1-2-3.4L9 9.3V4H8Zm3 2v5.8L8.4 14h7.2L13 9.8V4Z"/>'),
    hand: SVG_I('<path d="M8 21a4 4 0 0 1-4-4v-5a1.5 1.5 0 0 1 3 0V6a1.5 1.5 0 0 1 3 0V4.5a1.5 1.5 0 0 1 3 0V6a1.5 1.5 0 0 1 3 0v2a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6Z"/>'),
    auto: SVG_I('<path d="M10.6 3h2.8L20 21h-3l-1.6-4.5H8.6L7 21H4Zm-1 10.8h4.8L12 7.2Z"/>'),
    moon: SVG_I('<path d="M14.5 2.5A9.5 9.5 0 1 0 21.5 17 8 8 0 0 1 14.5 2.5Z"/>'),
    leaf: SVG_I('<path d="M20 3C10 3 4 8 4 15c0 2 .6 3.7 1.6 5l1.5-1.5C10 13 13 11 17 9c-3.5 2.6-6.3 5.6-8.6 10.6 1 .3 2.1.4 3.1.4C18 20 21 13 20 3Z"/>'),
    locate: SVG_I('<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/>'),
    stop: SVG_I('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
    play: SVG_I('<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z"/>'),
    wind: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"><path d="M2.5 9h11.5a3 3 0 1 0-3-3"/><path d="M2.5 13h16a3 3 0 1 1-3 3"/><path d="M2.5 17h7"/></svg>'),
    rocket: SVG_I('<path d="M12 2c3 2.4 4.5 5.6 4.5 9.4V16H7.5v-4.6C7.5 7.6 9 4.4 12 2Zm0 6a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 12 8ZM7.5 12.5 5 15.2V19l2.5-1.5Zm9 0V17.5L19 19v-3.8ZM10 17.5h4l-.8 3.2a1.2 1.2 0 0 1-2.4 0Z"/>'),
    pause: SVG_I('<rect x="6" y="4" width="4" height="16" rx="1.2"/><rect x="14" y="4" width="4" height="16" rx="1.2"/>'),
    restart: SVG_I('<path d="M12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35A7.96 7.96 0 0 0 12 4z"/>'),
    mesh: SVG_I('<circle cx="12" cy="5" r="2.6"/><circle cx="5" cy="18" r="2.6"/><circle cx="19" cy="18" r="2.6"/><path d="M11 7h2v5.4l4.6 3.9-1.3 1.5L12 14.2l-4.3 3.6-1.3-1.5 4.6-3.9z"/>'),
    bolt: SVG_I('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    dl: SVG_I('<path d="M11 3h2v10.2l3.6-3.6L18 11l-6 6-6-6 1.4-1.4 3.6 3.6zM5 19h14v2H5z"/>'),
  };
  const LIST_CSS = `
    .wrap.lst { min-height: 0; }
    .lst .hd { margin-bottom: 18px; }
    .hd small { font-size: 13px; color: rgba(235,235,245,0.6); min-height: 1em; transition: opacity .3s ease; }
    .lbl { flex: none; align-self: stretch; display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; font-weight: 600; color: rgba(235,235,245,0.6); padding: 16px 6px 8px; }
    .lbl:first-of-type { padding-top: 0; }
    .lbl button { border: 0; background: none; padding: 0; font: inherit; font-size: 14px; font-weight: 600; color: var(--hemma-color-teal, #00C3D0); cursor: pointer; }
    .list { flex: none; align-self: stretch; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(0,0,0,0.2); overflow: hidden; }
    .list + .list { margin-top: 12px; }
    .li { position: relative; width: 100%; display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 8px 14px 8px 10px; box-sizing: border-box; border: 0; background: none; color: #fff; font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .li + .li::before { content: ""; position: absolute; top: 0; left: 58px; right: 14px; height: .5px; background: rgba(255,255,255,0.12); }
    @media (hover: hover) { .li:hover::before, .li:hover + .li::before { opacity: 0; } }
    .picker .li { padding: 8px 14px 8px 16px; }
    .picker .li + .li::before { left: 50px; right: 14px; }
    .li .ic { width: 36px; height: 36px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,0.10); overflow: hidden; }
    .li .ic.logo { border-radius: 9px; }
    .li .ic img { width: 100%; height: 100%; object-fit: cover; }
    .li .ic.nologo::after { content: ""; width: 19px; height: 19px; background: #fff; -webkit-mask: url('${XI.box}') center / contain no-repeat; mask: url('${XI.box}') center / contain no-repeat; }
    .li .ic i { width: 19px; height: 19px; display: block; background: var(--k, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .li .tx { flex: 1; min-width: 0; display: grid; gap: 1px; }
    .li b { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .li small { font-size: 12.5px; color: rgba(235,235,245,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    .li .v { flex: none; max-width: 42%; font-size: 15px; color: rgba(235,235,245,0.6); font-variant-numeric: tabular-nums; display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .li .v.bsv { max-width: none; gap: 7px; } .li .v.bsv svg { display: block; flex: none; }
    .li .v.low { color: #FF453A; } .li .v.chg { color: #30D158; }
    .li.upd b { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.22; }
    .pillb { flex: none; min-width: 74px; height: 30px; box-sizing: border-box; border: 0; border-radius: 15px; padding: 0 14px; font: inherit; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; cursor: pointer; background: rgba(255,255,255,0.14); color: var(--hemma-color-teal, #00C3D0); display: inline-grid; place-items: center; }
    .pillb.warn { color: #FF9F0A; }
    .pillb.busy { color: rgba(235,235,245,0.6); cursor: default; }
    .hero { flex: none; width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; background: rgba(48,209,88,0.18); margin: 4px 0 24px; }
    .hero.ok { width: 96px; height: 96px; margin: 0 0 18px; background: linear-gradient(180deg, #3ddc68, #28b84f); box-shadow: 0 14px 30px -12px rgba(40,184,79,0.6), inset 0 1px 0 rgba(255,255,255,0.35); }
    .hero.ok svg { width: 52px; height: 52px; display: block; }
    .body.done { flex: 1 0 auto; justify-content: center; min-height: 260px; }
    .body.done .note { padding-top: 0; font-size: 15px; }
    .hero i { width: 34px; height: 34px; display: block; background: #30D158; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .ptiles { flex: none; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .pt { border: 0; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(0,0,0,0.2); color: #fff; font: inherit; text-align: left; padding: 12px 12px 13px; display: grid; gap: 9px; min-width: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .pt .top { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: rgba(235,235,245,0.6); min-width: 0; }
    .pt .top span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pt .top i { flex: none; width: 16px; height: 16px; display: block; background: var(--k, rgba(235,235,245,0.6)); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .pt strong { font-size: 24px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .pt strong em { font-style: normal; font-size: 14px; color: rgba(235,235,245,0.6); margin-left: 2px; }
    .pt .w { font-size: 13px; font-weight: 600; color: rgba(235,235,245,0.6); margin-top: -3px; min-height: 1em; }
    .pt .w.bad { color: var(--hemma-color-orange, #FF9230); }
    .pphoto { flex: none; align-self: center; width: 116px; height: 116px; border-radius: 50%; background: rgba(255,255,255,0.08) center / cover no-repeat; box-shadow: 0 0 0 4px rgba(255,255,255,0.12), 0 14px 30px -14px rgba(0,0,0,0.7); margin: 0 0 14px; }
    .pphoto[hidden] { display: none; }
    .pt .rng { position: relative; display: block; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.14); margin: 2px 0 0; }
    .pt .rng i { position: absolute; top: 0; bottom: 0; border-radius: 3px; background: rgba(48,209,88,0.55); }
    .pt .rng s { position: absolute; top: -4px; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.5); }
    .plant .wpill { margin: 0 0 16px; }
    @media (max-width: 768px) { .pphoto { width: 92px; height: 92px; margin-bottom: 10px; } }
    .pt .w.good { color: var(--hemma-badge-plant-healthy-color, #44e371); }
    .note { font-size: 13px; line-height: 1.45; color: rgba(235,235,245,0.6); text-align: center; padding: 14px 0 4px; }
    .wpill { flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: rgba(0,0,0,0.2); font-size: 13px; font-weight: 600; color: rgba(235,235,245,0.6); margin: -6px 0 18px; }
    .wpill i { width: 14px; height: 14px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .wpill:has(.wc:empty) { display: none; }
    .empty { font-size: 15px; color: rgba(235,235,245,0.6); padding: 24px 0; }
    .pt { position: relative; }
    .li::after, .pt::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #000; opacity: 0; transition: opacity .40s ease; pointer-events: none; }
    @media (hover: hover) { .li:hover::after, .pt:hover::after { opacity: .14; transition: opacity .18s ease; } .pillb:hover, .lbl button:hover { filter: brightness(1.12); } }
    @media (max-width: 768px) { .lst .hd { margin-bottom: 24px; } }
  `;
  const moreInfo = (el, id) => el.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
  const ICO = (name, k) => `<i style="--i:url('${esc(iconUrl(name))}')${k ? `;--k:${k}` : ''}"></i>`;
  const ICX = (uri, k) => `<i style="--i:url('${esc(uri)}')${k ? `;--k:${k}` : ''}"></i>`;
  const needMdi = (names, done) => {
    const miss = names.filter((n) => /^mdi:/.test(n) && !(n.slice(4) in mdi.paths)).map((n) => n.slice(4));
    if (miss.length) Promise.all(miss.map((n) => mdi.load(n))).then(done);
  };
  const confirmTap = async (text, word) => {
    const tap = window.hemmaTap;
    return tap && tap.ask ? tap.ask(text, word, null, true) : window.confirm(text);
  };

  const BAT_STRONG = ['lock', 'cover', 'vacuum', 'camera', 'climate', 'fan', 'light', 'media_player', 'humidifier', 'valve', 'lawn_mower', 'water_heater'];
  const BAT_DOMAIN = { lock: 'lock', vacuum: 'vacuum', camera: 'camera|mdi:cctv', light: 'light', fan: 'fan', media_player: 'speaker', climate: 'thermostat', humidifier: 'humidifier',
    water_heater: 'hot_water', person: 'person', valve: 'valve|mdi:valve', lawn_mower: 'mower|mdi:robot-mower', remote: 'remote|mdi:remote', switch: 'plug', device_tracker: 'phone|mdi:cellphone' };
  const BAT_COVER = { curtain: 'curtain-closed', blind: 'curtain-closed', shade: 'curtain-closed', shutter: 'curtain-closed', awning: 'curtain-closed', door: 'door-closed',
    garage: 'garage|mdi:garage', gate: 'gate|mdi:gate', window: 'window|mdi:window-closed-variant' };
  const BAT_BINARY = { motion: 'person-walking-motion', occupancy: 'person-walking-motion', presence: 'person', door: 'door-closed', opening: 'door-closed', window: 'window|mdi:window-closed-variant',
    garage_door: 'garage|mdi:garage', moisture: 'leak|mdi:water-alert', smoke: 'smoke|mdi:smoke-detector', gas: 'gas', vibration: 'vibration|mdi:vibrate', sound: 'sound|mdi:ear-hearing' };
  const BAT_TEXT = [['iphone', 'iphone|mdi:cellphone'], ['pixel|galaxy|oneplus|phone', 'phone|mdi:cellphone'], ['ipad|tablet', 'tablet|mdi:tablet'], ['watch', 'apple-watch|mdi:watch'],
    ['macbook|laptop|imac|mac ?(mini|studio|pro)', 'laptop|mdi:laptop'], ['airpod|headphone|earbud|buds', 'headphones|mdi:headphones'], ['keypad', 'keypad|mdi:dialpad'],
    ['doorbell|chime', 'doorbell'], ['lock|deadbolt', 'lock'], ['curtain|blind|shade|shutter', 'curtain-closed'], ['vacuum|roomba|robot', 'vacuum'], ['camera|cam\\b', 'camera|mdi:cctv'],
    ['motion|presence|occupancy|pir', 'motion'], ['thermostat|radiator|trv|climate', 'thermostat'], ['speaker|sonos|homepod|echo', 'speaker'], ['remote', 'remote|mdi:remote'],
    ['plant|soil', 'plant'], ['leak|moisture|water', 'leak|mdi:water-alert'], ['smoke|fire', 'smoke|mdi:smoke-detector'], ['door|contact', 'door-closed'],
    ['window', 'window|mdi:window-closed-variant'], ['light|lamp|bulb', 'light'], ['plug|outlet|socket', 'plug'], ['temperature|thermo', 'temp-medium'], ['motion|sensor', 'motion']];
  const BAT_LOW = 20;
  const BAT_HUE = [[/lock|keypad|dialpad|doorbell|camera|cctv/, '10,132,255'], [/curtain|door|window|garage|gate|valve/, '0,195,208'],
    [/motion|person|occupancy|smoke|leak|sound|vibration|gas|temp|thermostat|hot_water/, '255,159,10'], [/vacuum|mower|plant/, '48,209,88'], [/light|lamp|bulb/, '255,214,10']];
  const batHue = (icon) => { const h = BAT_HUE.find(([re]) => re.test(String(icon))); return h ? h[1] : '142,142,147'; };
  class HemmaBatteryPanel extends HTMLElement {
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      this.shadowRoot.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${SLAB_CSS}${BIG_CSS}</style><div class="wrap multi lst"><div class="hd"><b></b><span></span></div><div class="body slab"></div></div>`;
      const body = this.shadowRoot.querySelector('.body');
      body.style.cssText = 'align-self:stretch;display:flex;flex-direction:column';
      body.onclick = (e) => { const b = e.target.closest('.li'); if (b && b.dataset.id) moreInfo(this, b.dataset.id); };
      this._paint();
    }
    _list() {
      const c = this._config, S = this._hass.states, pairs = c.pairs || {};
      const filter = c.batteries || c.entity_filter || (Object.keys(pairs).length ? Object.keys(pairs).map((k) => pairs[k]) : null);
      const all = (Array.isArray(filter) ? filter.map((id) => S[id]) : Object.values(S))
        .filter((e) => e && e.attributes.device_class === 'battery' && e.state !== 'unavailable' && e.state !== 'unknown' && Number.isFinite(parseFloat(e.state)));
      const reg = this._hass.entities || {};
      const devOf = (e) => (reg[e.entity_id] && reg[e.entity_id].device_id) || e.attributes.device_id || null;
      const plus = (e) => 'battery_type_and_quantity' in e.attributes;
      const own = new Set(all.filter((e) => !plus(e)).map(devOf).filter(Boolean));
      return all.filter((e) => !plus(e) || !own.has(devOf(e))).sort((a, b) => parseFloat(a.state) - parseFloat(b.state));
    }
    _device(id) {
      const c = this._config, S = this._hass.states, reg = this._hass.entities || {}, devReg = this._hass.devices || {};
      const pairs = c.pairs || {}, icons = c.icons || {}, names = c.names || {};
      const primaryOf = {};
      Object.keys(pairs).forEach((p) => { if (pairs[p]) primaryOf[pairs[p]] = p; });
      const explicit = primaryOf[id] || null;
      const bs = S[id];
      const devId = (reg[id] && reg[id].device_id) || (explicit && reg[explicit] && reg[explicit].device_id) || (bs && bs.attributes.device_id) || null;
      const dev = devId ? devReg[devId] : null;
      if (!this._sibs) {
        this._sibs = {};
        Object.keys(reg).forEach((eid) => { const d = reg[eid] && reg[eid].device_id; if (d) (this._sibs[d] = this._sibs[d] || []).push(eid); });
      }
      const siblings = devId ? (this._sibs[devId] || []) : [];
      const primary = explicit || siblings.find((s) => BAT_STRONG.indexOf(s.split('.')[0]) !== -1) || null;
      const fromText = (t) => { if (!t) return null; const hay = String(t).toLowerCase(); const r = BAT_TEXT.find(([re]) => new RegExp(re).test(hay)); return r ? r[1] : null; };
      const fromEntity = (eid) => {
        const d = eid.split('.')[0], st = S[eid], cls = st && st.attributes.device_class;
        if (d === 'cover') return BAT_COVER[cls] || 'curtain-closed';
        if (d === 'binary_sensor') return BAT_BINARY[cls] || null;
        return BAT_DOMAIN[d] || null;
      };
      let icon = icons[id] || (explicit ? icons[explicit] : null) || null;
      if (!icon && primary) icon = fromEntity(primary);
      if (!icon && dev) icon = fromText(dev.model) || fromText(dev.name_by_user || dev.name);
      if (!icon) icon = siblings.map(fromEntity).find(Boolean) || null;
      if (!icon) icon = fromText(bs && bs.attributes.friendly_name) || fromText(id);
      if (!icon && primary && S[primary] && S[primary].attributes.icon) icon = S[primary].attributes.icon;
      if (!icon) icon = 'battery';
      if (icon.indexOf('camera') === 0 && dev && /doorbell/i.test((dev.model || '') + ' ' + (dev.name_by_user || dev.name || ''))) icon = 'doorbell';
      if (icon.indexOf('|') >= 0) { const [a, b] = icon.split('|'); icon = window.HEMMA_ICONS && window.HEMMA_ICONS[a] ? a : b; }
      let name = names[id] || (explicit ? names[explicit] : null) || (dev ? (dev.name_by_user || dev.name) : null);
      if (!name && primary && S[primary]) name = S[primary].attributes.friendly_name;
      if (!name) name = String((bs && bs.attributes.friendly_name) || id).replace(/\s*Battery\+?(\s+(Level|State|Percentage))?$/i, '');
      const charging = siblings.some((s) => {
        const st = S[s];
        if (!st) return false;
        if (s.indexOf('binary_sensor.') === 0) return /_charging$/.test(s) && st.state === 'on';
        if (s.indexOf('sensor.') === 0) return /_battery_state$/.test(s) && /^charging$/i.test(st.state);
        return false;
      });
      const areaId = (reg[id] && reg[id].area_id) || (dev && dev.area_id) || null;
      const area = areaId && this._hass.areas && this._hass.areas[areaId] ? this._hass.areas[areaId].name : '';
      return { icon, name, sub: charging ? T('battery.charging', 'Charging') : area };
    }
    _paint() {
      const root = this.shadowRoot, body = root.querySelector('.body');
      if (!body) return;
      const list = this._list();
      const rows = list.map((e) => ({ id: e.entity_id, pct: Math.round(parseFloat(e.state)), ...this._device(e.entity_id) }));
      const low = rows.filter((r) => r.pct <= BAT_LOW), rest = rows.filter((r) => r.pct > BAT_LOW);
      root.querySelector('.hd b').textContent = this._config.name || T('battery.title', 'Batteries');
      root.querySelector('.hd span').textContent = !rows.length ? T('battery.none_found', 'No battery sensors found')
        : low.length ? T('battery.n_low', '{n} low', { n: low.length }) : T('battery.all_healthy', 'All healthy');
      const row = (r) => `<button type="button" class="li" data-id="${esc(r.id)}"><span class="ic" style="background:rgb(${batHue(r.icon)})">${ICO(r.icon, '#fff')}</span>`
        + `<span class="tx"><b>${esc(r.name)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>`
        + (() => { const bi = window.hemmaBatteryInfo && window.hemmaBatteryInfo(this._hass.states, r.id), chg = bi && bi.charging;
          return `<span class="v bsv${r.pct <= BAT_LOW ? ' low' : chg ? ' chg' : ''}">${esc(r.pct + '%')}${window.hemmaBatteryGlyph ? window.hemmaBatteryGlyph(r.pct, chg) : ''}</span></button>`; })();
      const html = low.length && rest.length
        ? `<div class="lbl">${esc(T('common.needs_attention', 'Needs attention'))}</div><div class="list">${low.map(row).join('')}</div><div class="list">${rest.map(row).join('')}</div>`
        : rows.length ? `<div class="list">${rows.map(row).join('')}</div>` : '';
      if (body._html !== html) { body._html = html; body.innerHTML = html; }
      // Late icons are swapped in place: rebuilding the rows mid-morph replaces the row the tile is flying into.
      needMdi(rows.map((r) => r.icon), () => body.querySelectorAll('.li').forEach((li) => {
        const r = rows.find((x) => x.id === li.dataset.id), i = li.querySelector('.ic i');
        if (r && i) i.style.setProperty('--i', `url('${iconUrl(r.icon)}')`);
      }));
    }
  }
  if (!customElements.get('hemma-battery-panel')) customElements.define('hemma-battery-panel', HemmaBatteryPanel);

  const UPD_MAIN = ['update.home_assistant_core_update', 'update.home_assistant_operating_system_update', 'update.home_assistant_supervisor_update'];
  class HemmaUpdatesPanel extends HTMLElement {
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      this.shadowRoot.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${SLAB_CSS}${BIG_CSS}</style><div class="wrap multi lst"><div class="hd"><b></b><span></span></div><div class="body slab"></div></div>`;
      const body = this.shadowRoot.querySelector('.body');
      body.style.cssText = 'align-self:stretch;display:flex;flex-direction:column;align-items:center';
      body.onclick = async (e) => {
        const t = e.target.closest('button, .li');
        if (!t) return;
        if (t.dataset.install) return this._hass.callService('update', 'install', { entity_id: t.dataset.install }).catch(() => {});
        if (t.dataset.all) {
          const ids = t.dataset.all.split(',');
          if (await confirmTap(T('updates.install_all_q', 'Install all {n} updates now?', { n: ids.length }), T('updates.update_all', 'Update All'))) this._hass.callService('update', 'install', { entity_id: ids }).catch(() => {});
          return;
        }
        if (t.dataset.restart) {
          if (await confirmTap(T('updates.restart_confirm', 'Restart Home Assistant now?'), T('updates.restart_now', 'Restart Now'))) this._hass.callService('homeassistant', 'restart', {}).catch(() => {});
          return;
        }
        if (t.dataset.id) moreInfo(this, t.dataset.id);
      };
      this._paint();
    }
    _paint() {
      const root = this.shadowRoot, body = root.querySelector('.body');
      if (!body) return;
      const S = this._hass.states;
      const nameOf = (e) => { const n = String(e.attributes.title || e.attributes.friendly_name || e.entity_id).replace(/\s+(Update|Firmware)$/i, ''); return UPD_MAIN.indexOf(e.entity_id) > 0 ? n.replace(/^Home Assistant\s+/i, '') : n; };
      const rank = (id) => { const i = UPD_MAIN.indexOf(id); return i < 0 ? 9 : i; };
      const ids = Object.keys(S).filter((id) => id.startsWith('update.') && S[id].state !== 'unavailable' && S[id].state !== 'unknown')
        .sort((a, b) => rank(a) - rank(b) || nameOf(S[a]).localeCompare(nameOf(S[b])));
      const owed = (e) => e.state === 'off' && /restart/i.test(String(e.attributes.release_summary || '')) && e.attributes.installed_version === e.attributes.latest_version;
      const pending = ids.filter((id) => S[id].state === 'on'), restart = ids.filter((id) => owed(S[id]));
      root.querySelector('.hd b').textContent = this._config.name || T('updates.title', 'Software Updates');
      root.querySelector('.hd span').textContent = pending.length ? (pending.length === 1 ? T('updates.one', '1 Update') : T('updates.n', '{n} Updates', { n: pending.length }))
        : restart.length ? T('updates.restart_required', 'Restart required') : T('updates.up_to_date', 'Up to date');
      const logo = (e) => {
        let pic = e.attributes.entity_picture || null;
        if (pic && pic.startsWith('/api/brands/')) { const p = pic.split('/'); pic = 'https://brands.home-assistant.io/' + p[p.length - 2] + '/' + p[p.length - 1]; }
        return pic ? `<span class="ic logo"><img src="${esc(pic)}" alt="" loading="lazy" onerror="this.parentNode.className='ic nologo';this.remove()"></span>` : `<span class="ic">${ICX(XI.box)}</span>`;
      };
      const row = (id, sub, act, val) => { const e = S[id];
        return `<div class="li upd" role="button" tabindex="0" data-id="${esc(id)}">${logo(e)}<span class="tx"><b>${esc(nameOf(e))}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${act || ''}${val ? `<span class="v">${esc(val)}</span>` : ''}</div>`; };
      const ver = (e) => e.attributes.installed_version || e.attributes.latest_version || '';
      let html = '';
      const ready = pending.filter((id) => !S[id].attributes.in_progress);
      if (pending.length || restart.length) {
        html += (ready.length > 1 ? `<div class="lbl all"><span>${esc(T('updates.available', 'Available Updates'))}</span><button type="button" data-all="${esc(ready.join(','))}">${esc(T('updates.update_all', 'Update All'))}</button></div>` : '') + `<div class="list">`
          + pending.map((id) => { const a = S[id].attributes;
            return row(id, a.latest_version || '',
              a.in_progress ? `<span class="pillb busy">${esc(T('updates.updating', 'Updating'))}…</span>` : `<button type="button" class="pillb" data-install="${esc(id)}">${esc(T('updates.update', 'Update'))}</button>`); }).join('')
          + restart.map((id) => row(id, T('updates.restart_required', 'Restart required'), `<button type="button" class="pillb warn" data-restart="1">${esc(T('updates.restart', 'Restart'))}</button>`)).join('')
          + `</div>` + (ready.length > 1 ? `<button type="button" class="lpill upill" data-all="${esc(ready.join(','))}">${esc(T('updates.update_all', 'Update All'))}</button>` : '');
      } else {
        const core = S['update.home_assistant_core_update'], ver = core && (core.attributes.installed_version || '');
        html += `<span class="hero ok"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 12.4l3.9 3.9 7.7-8.3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg></span><div class="note">${ver ? esc(T('updates.ha_version', 'Home Assistant {v}', { v: ver })) + '<br>' : ''}${esc(T('updates.n_checked', '{n} items checked', { n: ids.length }))}</div>`;
      }
      if (body._html !== html) {
        body._html = html; body.innerHTML = html;
        body.classList.toggle('done', !pending.length && !restart.length);
        // As Studio confirms a save: the badge settles in with a slight overshoot and the tick draws itself.
        const hero = body.querySelector('.hero.ok'), tick = hero && hero.querySelector('path');
        if (hero && tick) {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) tick.style.strokeDashoffset = '0';
          else {
            hero.animate([{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: 0.55 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520, delay: 140, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'backwards' });
            tick.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 380, delay: 420, easing: 'cubic-bezier(.62,.03,.36,1)', fill: 'forwards' });
          }
        }
      }
    }
  }
  if (!customElements.get('hemma-updates-panel')) customElements.define('hemma-updates-panel', HemmaUpdatesPanel);

  const PLANT_ICON = { moisture: XI.drop, humidity: null, illuminance: XI.sun, temperature: null, conductivity: XI.beaker, battery: null };
  const PLANT_NAMED = { humidity: 'humidity', temperature: 'temp-medium', battery: 'battery' };
  class HemmaPlantPanel extends HTMLElement {
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    _type(eid) {
      const id = eid.toLowerCase();
      if (id.includes('moisture')) return 'moisture';
      if (id.includes('illumin') || id.includes('lux')) return 'illuminance';
      if (id.includes('temp')) return 'temperature';
      if (id.includes('conductiv')) return 'conductivity';
      if (id.includes('humid')) return 'humidity';
      if (id.includes('battery')) return 'battery';
      return null;
    }
    _num(id) { const st = id && this._hass.states[id]; if (!st || st.state === 'unavailable' || st.state === 'unknown') return null; const n = parseFloat(st.state); return isNaN(n) ? null : n; }
    _limit(type, dir) {
      const p = String(this._config.entity || '').replace(/^[^.]+\./, '');
      if (!type || type === 'battery' || !p) return null;
      const slug = type === 'moisture' ? 'soil_moisture' : type === 'humidity' ? 'air_humidity' : type;
      const v = this._num(`number.${p}_${dir}_${slug}`);
      return v != null ? v : this._num(`number.${p}_${dir}_${type}`);
    }
    _sensors() { return (Array.isArray(this._config.sensors) ? this._config.sensors : []).filter((s) => typeof s === 'string' && this._hass.states[s]); }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      this.shadowRoot.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${SLAB_CSS}${BIG_CSS}</style><div class="wrap multi lst plant"><div class="hd"><b></b><span></span></div><div class="slab"><span class="pphoto"></span><span class="wpill">${ICX(XI.drop)}<span class="wc"></span></span><div class="ptiles"></div></div></div>`;
      this.shadowRoot.querySelector('.ptiles').onclick = (e) => { const b = e.target.closest('.pt'); if (b) moreInfo(this, b.dataset.id); };
      const moist = this._sensors().find((s) => this._type(s) === 'moisture');
      const wc = this.shadowRoot.querySelector('.wc');
      if (moist && window._hemmaUI && window._hemmaUI.plantWater) window._hemmaUI.plantWater(wc, moist, this._limit('moisture', 'min'));
      else wc.parentNode.remove();
      this._paint();
    }
    _paint() {
      const root = this.shadowRoot, grid = root.querySelector('.ptiles');
      if (!grid) return;
      const S = this._hass.states, plant = S[this._config.entity], a = (plant && plant.attributes) || {}, sensors = this._sensors();
      const state = plant && plant.state;
      const gradable = sensors.filter((s) => { const t = this._type(s); return t && t !== 'battery'; });
      const badTypes = {};
      // Each reading's own status counts even while the plant's overall state reads ok; the integration only lifts it to problem for some.
      (Array.isArray(a.problems) ? a.problems : []).forEach((p) => { if (p && p.sensor_type) badTypes[p.sensor_type] = String(p.status || '').toLowerCase(); });
      gradable.forEach((s) => { const t = this._type(s), v = a[t + '_status']; if (!badTypes[t] && v && !/^(ok|null|none)$/i.test(String(v))) badTypes[t] = String(v).toLowerCase(); });
      const bad = state === 'problem' || Object.keys(badTypes).length > 0, ok = state === 'ok' && !bad;
      const blind = !ok && !gradable.some((s) => { const t = this._type(s); return badTypes[t] != null || Object.prototype.hasOwnProperty.call(a, t + '_status'); });
      let advice;
      if (ok) advice = T('state.healthy', 'Healthy');
      else if (bad && blind) advice = T('common.needs_attention', 'Needs attention');
      else if (bad) {
        const dir = (t) => badTypes[t];
        advice = T('common.needs_attention', 'Needs attention');
        if (dir('temperature')) advice = dir('temperature') === 'low' ? T('plant.too_cold', 'Too cold') : T('plant.too_warm', 'Too warm');
        if (dir('humidity')) advice = dir('humidity') === 'low' ? T('plant.air_too_dry', 'Air is too dry') : T('plant.air_too_humid', 'Air is too humid');
        if (dir('conductivity')) advice = dir('conductivity') === 'low' ? T('plant.needs_fertilizing', 'Needs fertilizing') : T('plant.too_much_fertilizer', 'Too much fertilizer');
        if (dir('illuminance')) advice = dir('illuminance') === 'low' ? T('plant.needs_more_light', 'Needs more light') : T('plant.too_much_light', 'Getting too much light');
        if (dir('moisture')) advice = dir('moisture') === 'low' ? T('plant.needs_watering', 'Needs watering') : T('plant.soil_too_wet', 'Soil is too wet');
      } else advice = gradable.some((s) => this._num(s) != null) ? T('plant.waiting_for_data', 'Waiting for plant data') : T('plant.sensor_unavailable', 'Sensor data unavailable');
      root.querySelector('.hd b').textContent = this._config.name || a.friendly_name || T('plant.title', 'Plant');
      root.querySelector('.hd span').textContent = advice;
      const pName = String(a.friendly_name || '').trim();
      const label = (eid) => {
        let n = S[eid].attributes.friendly_name || eid.split('.').pop() || '';
        if (pName) n = n.replace(new RegExp('^' + pName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '');
        return n.replace(/_/g, ' ').trim().replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
      };
      const fmt = (v) => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(Math.round(v));
      const word = (type, val) => {
        if (val == null) return ['', false];
        if (type === 'battery') return val <= BAT_LOW ? [T('plant.word_low', 'Low'), true] : [T('plant.word_good', 'Good'), false];
        if (blind || !type) return ['', false];
        const d = badTypes[type];
        if (!d) return [ok || bad ? T('plant.word_good', 'Good') : '', false];
        if (type === 'moisture') return [d === 'low' ? T('plant.word_dry', 'Dry') : T('plant.word_wet', 'Wet'), true];
        return [d === 'low' ? T('plant.word_low', 'Low') : T('plant.word_high', 'High'), true];
      };
      // A fixed order, as Apple keeps a card's readings in one place: water, light, temperature, fertilizer, humidity, battery.
      const RANK = { moisture: 0, illuminance: 1, temperature: 2, conductivity: 3, humidity: 4, battery: 5 };
      const order = sensors.slice().sort((x, y) => (RANK[this._type(x)] ?? 9) - (RANK[this._type(y)] ?? 9));
      const NAME = { moisture: T('plant.water', 'Water'), illuminance: T('plant.light', 'Light'), conductivity: T('plant.fertilizer', 'Fertilizer') };
      // Where the reading sits against the plant's own healthy range, the range drawn green.
      const bar = (type, val) => {
        if (val == null) return '';
        let lo = type === 'battery' ? BAT_LOW : this._limit(type, 'min'), hi = type === 'battery' ? 100 : this._limit(type, 'max');
        if (lo == null || hi == null || hi <= lo) return '';
        const pad = (hi - lo) * 0.25, a = Math.max(0, lo - pad), b = hi + pad, at = (x) => Math.max(0, Math.min(100, (x - a) / (b - a) * 100));
        return `<span class="rng"><i style="left:${at(lo).toFixed(1)}%;width:${(at(hi) - at(lo)).toFixed(1)}%"></i><s style="left:${Math.max(3, Math.min(97, at(val))).toFixed(1)}%"></s></span>`;
      };
      const photo = root.querySelector('.pphoto');
      if (photo) { const pic = a.entity_picture; photo.style.backgroundImage = pic ? `url("${String(pic).replace(/"/g, '%22')}")` : ''; photo.hidden = !pic; }
      const html = order.length ? order.map((eid) => {
        const type = this._type(eid), val = this._num(eid), unit = S[eid].attributes.unit_of_measurement || '';
        const [w, warn] = word(type, val);
        const ic = PLANT_ICON[type] ? ICX(PLANT_ICON[type]) : ICO(PLANT_NAMED[type] || 'plant');
        const w2 = type === 'illuminance' && badTypes[type] === 'low' ? T('plant.too_dark', 'Too dark') : w;
        return `<button type="button" class="pt" data-id="${esc(eid)}"><span class="top">${ic}<span>${esc(NAME[type] || label(eid))}</span></span>`
          + `<strong>${val == null ? '—' : esc(fmt(val))}${val != null && unit ? `<em>${esc(unit)}</em>` : ''}</strong>${bar(type, val)}<span class="w${warn ? ' bad' : w2 ? ' good' : ''}">${esc(w2)}</span></button>`;
      }).join('') : `<div class="empty">${esc(T('plant.none_configured', 'No plant sensors configured'))}</div>`;
      if (grid._html !== html) { grid._html = html; grid.innerHTML = html; }
    }
  }
  if (!customElements.get('hemma-plant-panel')) customElements.define('hemma-plant-panel', HemmaPlantPanel);

  const HUM_CSS = `
    .hum .ctl .fill { background: var(--hemma-color-humidity, #34C8FA); }
    .hum .ctl.off .fill { background: rgba(255,255,255,0.16); }
    .hum .ctl.off .glyph { background: rgba(255,255,255,0.55); }
    .hum .acts { gap: 8px; }
    .hum .act { min-width: 56px; }
    .act.pw.on > span { background: var(--hemma-color-teal, #00C3D0); }
    .act.on > span { background: rgba(255,255,255,0.94); }
    .act.on i { background: #1c1c1e; }
    .act.pw.on i { background: #fff; }
  `;
  const HUM_MODE = (m) => /^(auto|smart)/i.test(m) ? XI.auto : /sleep|night/i.test(m) ? XI.moon : /eco|natural/i.test(m) ? XI.leaf : /turbo|boost|max/i.test(m) ? XI.rocket : XI.wind;
  class HemmaHumidifierPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    hemmaHero() { const ctl = this.shadowRoot.querySelector('.ctl'); return ctl ? { el: ctl, icon: ctl.querySelector('.glyph'), fill: ctl.querySelector('.fill') } : null; }
    _st() { return this._hass.states[this._config.entity]; }
    _range() { const a = this._st().attributes; return [Number(a.min_humidity) || 0, Number(a.max_humidity) || 100]; }
    _mode(m) { return attrName(this._hass, this._st(), 'mode', m); }
    _build() {
      if (!this._config || !this._hass || !this._st()) return;
      this._built = true;
      const wide = wideSheet(), modes = this._st().attributes.available_modes || [], few = !wide && modes.length && modes.length <= 3;
      const root = this.shadowRoot;
      root.innerHTML = `<style>${SHEET_CSS}${COVER_CSS}${FAN_CSS}${HUM_CSS}${BIG_CSS}${CAPS_CSS}</style><div class="wrap cover fanb hum"><div class="hd"><b></b><span></span></div>`
        + `<button type="button" class="ctl" role="slider"><span class="fill"></span><i class="glyph"></i></button>`
        + `<div class="caps">${capButton('cstate')}${modes.length ? capButton('cmode') : ''}</div><i class="act pw" style="display:none"></i>`
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button></div>`;
      const id = this._config.entity;
      root.querySelector('.gear').onclick = () => moreInfo(this, id);
      const ctl = root.querySelector('.ctl');
      let g = null;
      ctl.addEventListener('pointerdown', (e) => { try { ctl.setPointerCapture(e.pointerId); } catch (_) {} g = { y: e.clientY, h: ctl.getBoundingClientRect().height, v0: this._pct(), live: false }; });
      ctl.addEventListener('pointermove', (e) => {
        if (!g) return;
        const dy = e.clientY - g.y;
        if (!g.live && Math.abs(dy) < 6) return;
        g.live = true;
        ctl.classList.add('dragging');
        g.v = Math.max(0, Math.min(100, g.v0 - dy / g.h * 100));
        this._show(g.v);
      });
      ctl.addEventListener('pointerup', () => {
        if (!g) return;
        ctl.classList.remove('dragging');
        if (!g.live) this._act(this._st().state === 'on' ? 'turn_off' : 'turn_on', {});
        else { const [lo, hi] = this._range(); this._act('set_humidity', { humidity: Math.round(lo + (hi - lo) * g.v / 100) }); }
        g = null;
      });
      ctl.addEventListener('pointercancel', () => { g = null; ctl.classList.remove('dragging'); this._paint(); });
      root.querySelector('.act.pw').onclick = () => this._act(this._st().state === 'on' ? 'turn_off' : 'turn_on', {});
      const dry = this._st().attributes.device_class === 'dehumidifier';
      root.querySelector('.capsel.cstate').onclick = (e) => {
        const on = this._st().state === 'on';
        capPick(e.currentTarget, [['on', dry ? T('humidifier.dehumidify', 'Dehumidify') : T('humidifier.humidify', 'Humidify')], ['off', T('lights.off', 'Off')]], on ? 'on' : 'off',
          (k) => this._act(k === 'on' ? 'turn_on' : 'turn_off', {}));
      };
      const cmode = root.querySelector('.capsel.cmode');
      if (cmode) cmode.onclick = (e) => capPick(e.currentTarget, modes.map((m) => [m, this._mode(m)]), this._st().attributes.mode || this._lastMode, (k) => this._act('set_mode', { mode: k }));
      const pwr = root.querySelector('.ft.pwr');
      // As Home Assistant's own dialog: a State menu with Off and On.
      if (pwr) pwr.onclick = (e) => {
        e.stopPropagation();
        capPick(pwr, [['off', T('lights.off', 'Off')], ['on', T('lights.on', 'On')]], this._st().state === 'on' ? 'on' : 'off',
          (k) => this._act(k === 'on' ? 'turn_on' : 'turn_off', {}));
      };
      root.querySelectorAll('.act.md').forEach((b) => { b.onclick = () => this._act('set_mode', { mode: b.dataset.m }); });
      const mode = root.querySelector('.act.mode');
      if (mode) mode.onclick = (e) => {
        e.stopPropagation();
        capPick(mode, modes.map((m) => [m, this._mode(m), mIco(mdiFull(attrIcon(this._icons, 'mode', m)))]), this._st().attributes.mode, (m) => this._act('set_mode', { mode: m }));
      };
      iconsFor(this._hass, this._config.entity, 'humidifier').then((I) => { this._icons = I; needMdi(modes.map((m) => attrIcon(I, 'mode', m)), () => {}); });
      this._paint();
    }
    _pct() { const a = this._st().attributes, [lo, hi] = this._range(), t = Number(a.humidity); return Number.isFinite(t) && hi > lo ? Math.max(0, Math.min(100, (t - lo) / (hi - lo) * 100)) : 0; }
    _show(v) {
      const ctl = this.shadowRoot.querySelector('.ctl');
      ctl.querySelector('.fill').style.height = v + '%';
      const [lo, hi] = this._range();
      ctl.setAttribute('aria-valuenow', String(Math.round(lo + (hi - lo) * v / 100)));
      if (ctl.classList.contains('dragging')) this.shadowRoot.querySelector('.hd span').textContent = T('humidifier.set_to', 'Set to {n}%', { n: Math.round(lo + (hi - lo) * v / 100) });
      this._holdUntil = Date.now() + 2500;
    }
    _paint() {
      const root = this.shadowRoot, st = this._st();
      if (!st || !root.querySelector('.hd')) return;
      const on = st.state === 'on', a = st.attributes;
      root.querySelector('.hd b').textContent = this._config.name || a.friendly_name || this._config.entity;
      // Apple's line: Off, Set to 55%, or Rising to 55% while it is working toward it.
      const cur = Number(a.current_humidity), tgt = Number(a.humidity), dry = a.device_class === 'dehumidifier';
      const working = on && (a.action === 'humidifying' || a.action === 'drying' || (a.action == null && Number.isFinite(cur) && Number.isFinite(tgt) && (dry ? cur > tgt : cur < tgt)));
      const line = !on ? T('lights.off', 'Off') : !Number.isFinite(tgt) ? T('lights.on', 'On')
        : working ? (dry ? T('humidifier.lowering_to', 'Lowering to {n}%', { n: Math.round(tgt) }) : T('humidifier.rising_to', 'Rising to {n}%', { n: Math.round(tgt) }))
        : T('humidifier.set_to', 'Set to {n}%', { n: Math.round(tgt) });
      const ctl = root.querySelector('.ctl');
      if (!ctl.classList.contains('dragging')) root.querySelector('.hd span').textContent = line;
      if (!(this._holdUntil && Date.now() < this._holdUntil) && !(this._was && (this._st() || {}).last_updated === this._was && Date.now() - this._wasAt < 10000) && !ctl.classList.contains('dragging')) { this._show(this._pct()); this._holdUntil = 0; }
      ctl.classList.toggle('off', !on);
      ctl.querySelector('.glyph').style.setProperty('--i', `url('${iconUrl(this._config.icon || 'humidifier')}')`);
      root.querySelector('.act.pw').classList.toggle('on', on);
      root.querySelectorAll('.act.md').forEach((b) => b.classList.toggle('on', on && b.dataset.m === a.mode));
      const mode = root.querySelector('.act.mode:not(.ft) small');
      if (mode) mode.textContent = a.mode ? this._mode(a.mode) : T('fan.mode', 'Mode');
      // Off, the humidifier reports no mode; the tile keeps the last one so it reads as what it will resume in.
      const mkey = 'hemma_hum_mode:' + this._config.entity;
      if (a.mode) { try { localStorage.setItem(mkey, a.mode); } catch (_) {} }
      let lastMode = null; try { lastMode = localStorage.getItem(mkey); } catch (_) {}
      const shownMode = a.mode || lastMode || (a.available_modes || [])[0];
      this._lastMode = shownMode;
      const cs = root.querySelector('.capsel.cstate span');
      if (cs) cs.textContent = on ? (a.device_class === 'dehumidifier' ? T('humidifier.dehumidify', 'Dehumidify') : T('humidifier.humidify', 'Humidify')) : T('lights.off', 'Off');
      const cm = root.querySelector('.capsel.cmode span');
      if (cm) cm.textContent = shownMode ? this._mode(shownMode) : T('fan.mode', 'Mode');
      const ftm = root.querySelector('.ft.mode b');
      if (ftm) ftm.textContent = shownMode ? this._mode(shownMode) : '—';
      const ftp = root.querySelector('.ft.pwr');
      if (ftp) { ftp.querySelector('b').textContent = on ? T('lights.on', 'On') : T('lights.off', 'Off'); ftp.classList.toggle('on', on); }
    }
    async _act(svc, data) {
      const tap = window.hemmaTap, id = this._config.entity;
      this._was = (this._st() || {}).last_updated; this._wasAt = Date.now();
      if (tap && tap.modeOf(id) === 'view') { this._holdUntil = 0; this._was = null; return this._paint(); }
      if (tap && tap.modeOf(id) === 'ask') {
        const name = this._config.name || this._st().attributes.friendly_name || id;
        const word = svc === 'turn_off' ? T('tap.turn_off', 'Turn Off') : svc === 'turn_on' ? T('tap.turn_on', 'Turn On') : T('tap.change', 'Change');
        if (!(await tap.ask(T('tap.ask', '{verb} {name}?', { verb: word, name }), word, null))) { this._holdUntil = 0; this._was = null; return this._paint(); }
      }
      this._hass.callService('humidifier', svc, { entity_id: id, ...data }).catch(() => {});
    }
  }
  if (!customElements.get('hemma-humidifier-panel')) customElements.define('hemma-humidifier-panel', HemmaHumidifierPanel);

  // Apple Home's words for a vacuum, shared by its tile and its popup so the two never disagree.
  window.hemmaVacuumWord = (h, st, kind) => {
    const s = st && st.state;
    if (s === 'cleaning') return kind === 'vm' ? T('vacuum.vacuuming_mopping', 'Vacuuming and Mopping') : kind === 'mop' ? T('vacuum.mopping', 'Mopping') : T('vacuum.vacuuming', 'Vacuuming');
    if (s === 'returning') return T('vacuum.returning', 'Returning to Dock');
    if (s === 'docked' || s === 'idle') return T('vacuum.ready', 'Ready');
    try { return (h && h.formatEntityState && h.formatEntityState(st)) || s || ''; } catch (_) { return s || ''; }
  };
  const VAC_CSS = `
    .vac .play { flex: none; width: 92px; height: 92px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,0.2); margin: auto 0 30px; cursor: pointer; transition: background-color .25s ease; -webkit-tap-highlight-color: transparent; }
    .vac .play i { width: 34px; height: 34px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; transition: background-color .25s ease; }
    .vac .play.run { background: rgba(255,255,255,0.94); }
    .vac .play.run i { background: #1c1c1e; }
    .wheel { flex: none; position: relative; width: 200px; height: 108px; margin: -6px 0 16px; }
    .wheel[hidden] { display: none; }
    .wheel .pillbg { position: absolute; left: 0; right: 0; top: 36px; height: 36px; border-radius: 18px; background: rgba(255,255,255,0.08); pointer-events: none; }
    .wheel .trk { position: absolute; left: 0; right: 0; top: 36px; transition: transform .42s cubic-bezier(0.32, 0.72, 0, 1); }
    .wheel button { display: block; width: 100%; height: 36px; border: 0; padding: 0; background: none; color: rgba(235,235,245,0.4); font: inherit; font-size: 16px; font-weight: 600; cursor: pointer; transition: color .3s ease; -webkit-tap-highlight-color: transparent; }
    .wheel button.on { color: #fff; }
    .capb { flex: none; border: 0; border-radius: 30px; background: rgba(0,0,0,0.2); color: #fff; font: inherit; min-width: 170px; padding: 11px 28px; display: grid; justify-items: center; gap: 1px; margin-bottom: 76px; cursor: pointer; }
    .capb[hidden] { display: none; }
    .capb b { font-size: 15px; font-weight: 600; }
    .capb small { font-size: 14px; color: rgba(235,235,245,0.6); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* The same bottom and height as the corner buttons on each side, so the words sit on their center line. */
    .vfoot { position: absolute; left: 62px; right: 62px; bottom: calc(9px + var(--sab, 0px)); height: 40px; padding: 0; border: 0; background: none; color: rgba(235,235,245,0.6); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
    .vfoot[hidden] { display: none; }
    .picker { position: absolute; inset: 0; padding: 72px 18px 18px; display: none; flex-direction: column; overflow-y: auto; }
    .vac.pick > :not(.picker) { visibility: hidden; }
    .vac.pick .picker { display: flex; }
    .picker .ttl { position: absolute; top: 14px; left: 64px; right: 64px; height: 44px; display: grid; place-items: center; font-size: 17px; font-weight: 600; }
    .picker .rdone { position: absolute; top: 14px; right: 14px; width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; cursor: pointer; background: var(--hemma-color-teal, #00C3D0); box-shadow: 0 6px 18px -8px rgba(0,195,208,0.7); -webkit-tap-highlight-color: transparent; }
    .picker .rdone i { width: 20px; height: 20px; display: block; background: #fff; -webkit-mask: url('${XI.check}') center / contain no-repeat; mask: url('${XI.check}') center / contain no-repeat; }
    .picker .rlbl { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 6px 8px; font-size: 15px; font-weight: 600; color: rgba(235,235,245,0.6); }
    .picker .rlbl button { border: 0; background: none; padding: 0; font: inherit; font-size: 15px; font-weight: 500; color: var(--hemma-color-teal, #00C3D0); cursor: pointer; }
    .picker .rnote { padding: 8px 6px 0; font-size: 13px; color: rgba(235,235,245,0.6); }
    .picker .li .ck { width: 22px; height: 22px; flex: none; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.4); display: grid; place-items: center; transition: background-color .2s ease, box-shadow .2s ease; }
    .picker .li.on .ck { background: var(--hemma-color-teal, #00C3D0); box-shadow: none; }
    .picker .li.on .ck::after { content: ""; width: 12px; height: 12px; background: #fff; -webkit-mask: url('${XI.check}') center / contain no-repeat; mask: url('${XI.check}') center / contain no-repeat; }
    @media (max-width: 768px) { .vac .play { width: 112px; height: 112px; } .vac .play i { width: 40px; height: 40px; } .vfoot { position: fixed; left: 84px; right: 84px; bottom: max(20px, env(safe-area-inset-bottom, 0px)); height: 52px; } }
    @media (min-width: 769px) and (pointer: coarse) { .vfoot { left: 76px; right: 76px; bottom: 13.5px; height: 52px; } }
  `;
  const VAC_KIND = { vac: ['vacuum.vacuum', 'Vacuum'], vm: ['vacuum.vacuum_mop', 'Vacuum & Mop'], mop: ['vacuum.mop', 'Mop'] };
  class HemmaVacuumPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._rooms = new Set(); this._areas = null; this._modes = null; }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    hemmaHero() { const pw = this.shadowRoot.querySelector('.play'); return pw ? { el: pw, icon: pw.querySelector('i') } : null; }
    _st() { return this._hass.states[this._config.entity]; }
    _sf() { return Number(this._st().attributes.supported_features) || 0; }
    _build() {
      if (!this._config || !this._hass || !this._st()) return;
      this._built = true;
      const root = this.shadowRoot, id = this._config.entity;
      root.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${VAC_CSS}${BIG_CSS}</style><div class="wrap cover vac"><div class="hd"><b></b><span></span></div>`
        + `<button type="button" class="play"><i></i></button><div class="wheel" hidden></div>`
        + `<button type="button" class="capb" hidden><b></b><small></small></button>`
        + `<button type="button" class="corner open dock" aria-label="${esc(T('vacuum.send_to_dock', 'Send to Dock'))}"><i style="--i:url('${esc(iconUrl('vacuum-charge'))}')"></i></button>`
        + `<button type="button" class="vfoot">${esc(T('vacuum.send_to_dock', 'Send to Dock'))}</button>`
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button>`
        + `<div class="picker"><div class="ttl">${esc(T('vacuum.rooms', 'Rooms'))}</div><button type="button" class="rdone" aria-label="${esc(T('ui.done', 'Done'))}"><i></i></button>`
        + `<div class="rlbl"><span>${esc(T('vacuum.rooms_to_clean', 'Rooms to Clean'))}</span><button type="button" class="rall"></button></div><div class="list"></div>`
        + `<div class="rnote">${esc(T('vacuum.rooms_note', 'Select rooms to clean. At least one room must be selected.'))}</div></div></div>`;
      const wrap = root.querySelector('.wrap');
      root.querySelector('.gear').onclick = () => moreInfo(this, id);
      root.querySelector('.play').onclick = () => this._go();
      root.querySelector('.dock').onclick = () => this._act('return_to_base', {});
      root.querySelector('.vfoot').onclick = () => this._act('return_to_base', {});
      const deep = (on) => { wrap.classList.toggle('pick', on); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: on, bubbles: true, composed: true })); this._paint(); };
      const all = () => (this._areas || []).filter((a) => (this._hass.areas || {})[a]);
      root.querySelector('.capb').onclick = () => { this._sel = new Set(this._rooms.size ? this._rooms : all()); deep(true); };
      root.querySelector('.rdone').onclick = () => {
        const sel = this._sel || new Set();
        this._rooms = sel.size && sel.size < all().length ? new Set(sel) : new Set();
        this._sel = null;
        deep(false);
      };
      root.querySelector('.rall').onclick = () => { this._sel = this._sel && this._sel.size ? new Set() : new Set(all()); this._paint(); };
      root.querySelector('.picker .list').onclick = (e) => {
        const r = e.target.closest('.li'); if (!r || !this._sel) return;
        const a = r.dataset.a;
        this._sel.has(a) ? this._sel.delete(a) : this._sel.add(a);
        this._paint();
      };
      root.querySelector('.wheel').onclick = (e) => {
        const b = e.target.closest('button');
        if (!b || !this._modes || !this._modes.sel) return;
        this._wk = b.dataset.k; this._wkUntil = Date.now() + 4000; this._paint();
        this._hass.callService('select', 'select_option', { entity_id: this._modes.sel, option: b.dataset.o }).catch(() => {});
      };
      this._loadAreas();
      this._loadModes();
      this._paint();
    }
    async _reg() {
      if (!this._regP) this._regP = this._hass.callWS({ type: 'config/entity_registry/get', entity_id: this._config.entity }).catch(() => null);
      return this._regP;
    }
    async _loadAreas() {
      if (!(this._sf() & 16384)) { this._areas = []; return; }
      const r = await this._reg(), map = r && r.options && r.options.vacuum && r.options.vacuum.area_mapping;
      this._areas = map ? Object.keys(map).filter((a) => (map[a] || []).length) : [];
      this._paint();
    }
    async _loadModes() {
      const h = this._hass, ent = h.entities || {}, dev = ent[this._config.entity] && ent[this._config.entity].device_id;
      const sel = dev && Object.keys(ent).find((e) => ent[e].device_id === dev && /^select\..*clean_mode/.test(e) && h.states[e]);
      if (!sel) return;
      const key = 'hemma_vac_modes_v1:' + this._config.entity;
      let tags = null;
      try { tags = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
      if (!tags) {
        const r = await this._reg();
        try {
          const d = r && await h.callApi('GET', `diagnostics/config_entry/${r.config_entry_id}/device/${r.device_id}`);
          let found = null;
          const walk = (o) => { if (!o || typeof o !== 'object' || found) return; for (const k of Object.keys(o)) { if (/\/85\/0$/.test(k) && Array.isArray(o[k])) { found = o[k]; return; } walk(o[k]); } };
          walk(d);
          if (found) { tags = {}; found.forEach((m) => { tags[m.label] = (m.modeTags || []).map((t) => t.value); }); try { localStorage.setItem(key, JSON.stringify(tags)); } catch (_) {} }
        } catch (_) {}
      }
      const opts = h.states[sel].attributes.options || [];
      const kindOf = (o) => {
        const t = tags && tags[o];
        if (t) { const v = t.includes(16385), m = t.includes(16386); return v && m ? 'vm' : m ? 'mop' : v ? 'vac' : null; }
        return /mop/i.test(o) ? (/vac|sweep/i.test(o) ? 'vm' : 'mop') : null;
      };
      const pick = {};
      opts.forEach((o) => { const k = kindOf(o); if (!k) return; const auto = tags && tags[o] && tags[o].includes(0); if (!pick[k] || auto) pick[k] = o; });
      if (!pick.vac && tags) opts.forEach((o) => { if (!pick.vac && kindOf(o) === null && !(tags[o] || []).includes(16386)) pick.vac = o; });
      const kinds = ['vac', 'vm', 'mop'].filter((k) => pick[k]);
      this._modes = kinds.length > 1 ? { sel, pick, kinds, kindOf } : null;
      this._paint();
    }
    _kind() { if (!this._modes) return null; return this._modes.kindOf(this._hass.states[this._modes.sel].state); }
    _go() {
      const s = this._st().state;
      if (s === 'cleaning' || s === 'returning') return this._act('pause', {});
      if (s === 'paused' || !this._rooms.size) return this._act('start', {});
      this._act('clean_area', { cleaning_area_id: [...this._rooms] });
    }
    _paint() {
      const root = this.shadowRoot, st = this._st();
      if (!st || !root.querySelector('.hd')) return;
      const s = st.state, h = this._hass, kind = this._kind();
      root.querySelector('.hd b').textContent = this._config.name || st.attributes.friendly_name || this._config.entity;
      root.querySelector('.hd span').textContent = window.hemmaVacuumWord(h, st, kind);
      const run = s === 'cleaning' || s === 'returning', play = root.querySelector('.play');
      play.classList.toggle('run', run);
      play.setAttribute('aria-label', run ? T('vacuum.pause', 'Pause') : T('vacuum.start', 'Start'));
      play.querySelector('i').style.setProperty('--i', `url('${run ? XI.pause : XI.play}')`);
      const wheel = root.querySelector('.wheel');
      const wh = this._modes ? `<span class="pillbg"></span><div class="trk">${this._modes.kinds.map((k) => `<button type="button" data-k="${k}" data-o="${esc(this._modes.pick[k])}">${esc(T(VAC_KIND[k][0], VAC_KIND[k][1]))}</button>`).join('')}</div>` : '';
      if (wheel._html !== wh) { wheel._html = wh; wheel.innerHTML = wh; }
      wheel.hidden = !wh;
      if (wh) {
        const want = this._wk && Date.now() < this._wkUntil ? this._wk : kind;
        if (want === kind) this._wk = null;
        const idx = Math.max(0, this._modes.kinds.indexOf(want));
        wheel.querySelector('.trk').style.transform = `translateY(${-idx * ((wheel.querySelector('.trk button') || {}).offsetHeight || 36)}px)`;
        wheel.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.k === want));
      }
      const areas = h.areas || {}, list = (this._areas || []).filter((a) => areas[a]);
      const cap = root.querySelector('.capb');
      cap.hidden = !list.length;
      cap.querySelector('b').textContent = T('vacuum.rooms', 'Rooms');
      cap.querySelector('small').textContent = this._rooms.size ? [...this._rooms].filter((a) => areas[a]).map((a) => areas[a].name).join(', ') : T('vacuum.all_rooms', 'All Rooms');
      const sel = this._sel || new Set(this._rooms.size ? this._rooms : list);
      const pl = list.map((a) => `<div class="li${sel.has(a) ? ' on' : ''}" role="button" data-a="${esc(a)}"><span class="ck"></span><span class="tx"><b>${esc(areas[a].name)}</b></span></div>`).join('');
      root.querySelector('.rall').textContent = sel.size ? T('vacuum.deselect_all', 'Deselect All') : T('vacuum.select_all', 'Select All');
      root.querySelector('.rdone').disabled = !sel.size;
      root.querySelector('.rdone').style.opacity = sel.size ? '' : '0.4';
      const pk = root.querySelector('.picker .list');
      if (pk._html !== pl) { pk._html = pl; pk.innerHTML = pl; }
      const canDock = !!(this._sf() & 16);
      root.querySelector('.dock').hidden = !canDock;
      root.querySelector('.vfoot').hidden = !canDock || s === 'docked' || s === 'returning';
    }
    async _act(svc, data) {
      const tap = window.hemmaTap, id = this._config.entity;
      if (tap && tap.modeOf(id) === 'view') return;
      if (tap && tap.modeOf(id) === 'ask') {
        const name = this._config.name || this._st().attributes.friendly_name || id;
        const word = svc === 'pause' ? T('vacuum.pause', 'Pause') : svc === 'return_to_base' ? T('vacuum.send_to_dock', 'Send to Dock') : T('vacuum.start', 'Start');
        if (!(await tap.ask(T('tap.ask', '{verb} {name}?', { verb: word, name }), word, null))) return;
      }
      this._hass.callService('vacuum', svc, { entity_id: id, ...data }).catch(() => {});
    }
  }
  if (!customElements.get('hemma-vacuum-panel')) customElements.define('hemma-vacuum-panel', HemmaVacuumPanel);
  // The climate popup's labeled tiles, shared with the fan's so the two read alike.
  const CT_CSS = `
    .ctiles { flex: none; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 18px 0 76px; }
    .ct { min-height: 58px; border: 0; border-radius: 18px; background: rgba(0,0,0,0.22); color: #fff; font: inherit; display: flex; align-items: center; gap: 10px; padding: 9px 12px; text-align: left; cursor: pointer; min-width: 0; transition: filter .4s ease; -webkit-tap-highlight-color: transparent; }
    .ct i { flex: none; width: 22px; height: 22px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .ct .tx { display: grid; min-width: 0; }
    .ct small { font-size: 12px; font-weight: 500; color: rgba(235,235,245,0.75); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ct b { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (hover: hover) { .ct:hover { filter: brightness(0.84); transition: filter .18s ease; } }
    @media (max-width: 768px) { .ctiles { margin-bottom: 90px; } }
  `;
  const TH_CSS = `
    .thermo .hd { margin-bottom: 0; }
    .dial { flex: none; position: relative; width: 252px; height: 252px; margin: 26px 0 0; touch-action: none; cursor: pointer; }
    .dial svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .dial .trk { fill: none; stroke: rgba(0,0,0,0.24); stroke-width: 30; stroke-linecap: round; }
    .dial .segs path { fill: none; stroke-width: 30; stroke-linecap: butt; }
    .dial .kn { fill: #fff; filter: drop-shadow(0 1px 4px rgba(0,0,0,0.3)); }
    .dial .cur { fill: #fff; }
    .dial.off .segs { visibility: hidden; }
    .dial.off .kn { visibility: hidden; }
    .dial .mid { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; gap: 0; padding-bottom: 10px; pointer-events: none; }
    .dial .mid small { font-size: 16px; font-weight: 700; letter-spacing: 0.01em; text-transform: uppercase; color: rgba(235,235,245,0.36); margin-bottom: 2px; }
    .dial .mid small:empty { display: none; }
    .dial .mid strong { font-size: 60px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
    .dial.off .mid strong { font-size: 54px; }
    .pm { position: absolute; left: 0; right: 0; bottom: 14px; display: flex; justify-content: center; gap: 20px; pointer-events: none; }
    .pm button { pointer-events: auto; width: 38px; height: 38px; border: 0; padding: 0; border-radius: 50%; background: transparent; color: #fff; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.85); display: grid; place-items: center; cursor: pointer; transition: background-color .4s ease, opacity .2s ease; -webkit-tap-highlight-color: transparent; }
    .dial .pm svg { position: static; width: 13px; height: 13px; }
    @media (max-width: 768px) { .pm { bottom: 16px; gap: 24px; } .pm button { width: 46px; height: 46px; } .dial .pm svg { width: 15px; height: 15px; } }
    .dial.off .pm button { opacity: 0.35; pointer-events: none; }
    @media (hover: hover) { .pm button:hover { background: rgba(255,255,255,0.08); transition: background-color .18s ease; } }
    ${CT_CSS}
    .mini { flex: none; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 0 76px; }
    .mini.rooms .t { height: 58px; border-radius: var(--hemma-pop-tile-r, 20px); gap: 8px; padding: 0 10px; }
    .mini.rooms .t .ti { width: 30px; height: 30px; font-size: 13px; cursor: pointer; transition: background-color .3s ease, color .3s ease; }
    .mini.rooms .t.on .ti { color: #fff; }
    .mini.rooms .t b { font-size: 13.5px; }
    .mini.rooms .t small { font-size: 12px; }
    .mini.rooms.one { grid-template-columns: 1fr; }
    .dial .pm { visibility: var(--hemma-pop-hidden, visible); }
    @media (max-width: 768px) { .dial { width: 300px; height: 300px; } .dial .mid strong { font-size: 70px; } .dial .mid small { font-size: 18px; } .ctiles, .mini { margin-bottom: 90px; } }
  `;
  const TH_BASE = [[0, '#3d8af6'], [0.45, '#569be5'], [0.65, '#88bfe6']];
  const TH_GRAD = {
    cool: TH_BASE.concat([[0.85, '#afd1dc'], [0.95, '#b1d5e0'], [1, '#9cc4ea']]),
    heat: TH_BASE.concat([[0.82, '#c2d3cd'], [0.9, '#d3cfba'], [1, '#ee9a62']]),
    dry: [[0, '#5fb7d6'], [1, '#c9eef5']], fan_only: [[0, '#8e8e93'], [1, '#e5e5ea']],
  };
  TH_GRAD.auto = TH_GRAD.heat_cool = TH_GRAD.heat;
  const thColor = (stops, t) => {
    let i = 1; while (i < stops.length - 1 && t > stops[i][0]) i++;
    const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], k = t1 > t0 ? Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) : 0;
    const h = (c, o) => parseInt(c.slice(o, o + 2), 16);
    return '#' + [1, 3, 5].map((o) => Math.round(h(c0, o) + (h(c1, o) - h(c0, o)) * k).toString(16).padStart(2, '0')).join('');
  };
  const TH_LABEL = { cool: ['climate.cool_to', 'Cool to'], heat: ['climate.heat_to', 'Heat to'], auto: ['climate.auto_to', 'Auto'], heat_cool: ['climate.auto_to', 'Auto'], dry: ['climate.dry', 'Dry'], fan_only: ['climate.fan_only', 'Fan'] };
  const TH_PM = ['<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 8h12"/></svg>', '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 2v12M2 8h12"/></svg>'];
  const TH_HVAC = { auto: 'mdi:thermostat-auto', cool: 'mdi:snowflake', dry: 'mdi:water-percent', fan_only: 'mdi:fan', heat: 'mdi:fire', heat_cool: 'mdi:sun-snowflake-variant', off: 'mdi:power' };
  const iconSets = {};
  const iconsFor = (h, entity, domain) => {
    const reg = (h.entities || {})[entity], key = domain + '|' + (reg ? reg.platform + '|' + (reg.translation_key || '') : '-');
    if (!iconSets[key]) {
      iconSets[key] = (async () => {
        const get = (category, integration) => h.callWS({ type: 'frontend/get_icons', category, integration }).then((x) => x.resources || {}).catch(() => ({}));
        const comp = ((await get('entity_component', domain))[domain] || {})._ || {};
        const own = reg && reg.translation_key ? (((await get('entity', reg.platform))[reg.platform] || {})[domain] || {})[reg.translation_key] || {} : {};
        return { comp, own };
      })();
    }
    return iconSets[key];
  };
  const MODE_GUESS = [[/^(auto|smart)/i, 'mdi:fan-auto'], [/sleep|night/i, 'mdi:power-sleep'], [/silent|quiet/i, 'mdi:volume-off'], [/eco|natural|breeze/i, 'mdi:leaf'],
    [/turbo|boost|max|full|strong/i, 'mdi:rocket-launch'], [/^low/i, 'mdi:fan-speed-1'], [/^(medium|middle|mid)/i, 'mdi:fan-speed-2'], [/^high/i, 'mdi:fan-speed-3'],
    [/^off$/i, 'mdi:fan-off'], [/custom|manual/i, 'mdi:tune-variant'], [/normal|standard|^on$/i, 'mdi:fan'], [/pet/i, 'mdi:paw'],
    [/level ?1|speed ?1/i, 'mdi:fan-speed-1'], [/level ?2|speed ?2/i, 'mdi:fan-speed-2'], [/level ?3|speed ?3/i, 'mdi:fan-speed-3']];
  // HA's own icon first, matched without case; a name it has no icon for is guessed before falling back to its dot.
  const attrIcon = (I, k, v) => {
    const raw = String(v == null ? '' : v), low = raw.toLowerCase();
    const pick = (o) => o && o.state_attributes && o.state_attributes[k];
    const own = pick((I || {}).own), comp = pick((I || {}).comp);
    const st = (o) => o && o.state && (o.state[raw] || o.state[low]);
    const guess = MODE_GUESS.find(([re]) => re.test(raw));
    return st(own) || st(comp) || (guess && guess[1]) || (own && own.default) || (comp && comp.default) || 'mdi:circle-medium';
  };
  const attrName = (h, st, k, v) => {
    const f = h.formatEntityAttributeValue ? h.formatEntityAttributeValue(st, k, v) : String(v);
    return f === String(v) ? String(v).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : f;
  };
  const mdiFull = (n) => { const d = mdi.paths[String(n).replace(/^mdi:/, '')]; return d ? 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}"/></svg>`) : iconUrl(n); };
  const TH_TILES = [['hvac_mode', 'hvac_modes', 'set_hvac_mode', 'climate.mode', 'Mode'], ['preset_mode', 'preset_modes', 'set_preset_mode', 'climate.preset', 'Preset'],
    ['fan_mode', 'fan_modes', 'set_fan_mode', 'climate.fan_mode', 'Fan mode'], ['swing_mode', 'swing_modes', 'set_swing_mode', 'climate.swing_mode', 'Swing mode']];
  const TH_SWEEP = 270, TH_R = 108;
  class HemmaThermostatPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    _st() { return this._hass.states[this._config.entity]; }
    hemmaHero() {
      const d = this.shadowRoot.querySelector('.dial');
      return d ? { el: d, icon: d, cell: '#temp_puck .hemma-icon-circle', clone: () => this._dialClone(), text: () => (d.querySelector('.mid strong') || {}).textContent || '' } : null;
    }
    _dialClone() {
      const d = this.shadowRoot.querySelector('.dial'), r = d.getBoundingClientRect(), vis = d.style.visibility;
      d.style.visibility = '';
      const box = document.createElement('div');
      Object.assign(box.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', pointerEvents: 'none', margin: '0' });
      const src = d.querySelector('svg'), svg = src.cloneNode(true);
      svg.setAttribute('width', r.width); svg.setAttribute('height', r.height);
      Object.assign(svg.style, { position: 'absolute', inset: '0', overflow: 'visible' });
      const a = [src, ...src.querySelectorAll('*')], b = [svg, ...svg.querySelectorAll('*')];
      a.forEach((n, i) => {
        if (!b[i] || !b[i].style) return;
        const cs = getComputedStyle(n);
        ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'visibility', 'filter'].forEach((k) => b[i].style.setProperty(k, cs.getPropertyValue(k)));
      });
      box.appendChild(svg);
      const mid = d.querySelector('.mid'), m = document.createElement('div');
      Object.assign(m.style, { position: 'absolute', inset: '0', display: 'grid', placeContent: 'center', textAlign: 'center', paddingBottom: getComputedStyle(mid).paddingBottom, color: '#fff' });
      mid.querySelectorAll('small, strong').forEach((t) => {
        if (!t.textContent) return;
        const cs = getComputedStyle(t), e = document.createElement('div');
        e.textContent = t.textContent;
        ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-transform', 'color', 'line-height', 'margin-bottom', 'font-variant-numeric'].forEach((k) => e.style.setProperty(k, cs.getPropertyValue(k)));
        m.appendChild(e);
      });
      box.appendChild(m);
      d.style.visibility = vis;
      return box;
    }
    _range() { const a = this._st().attributes; return [Number(a.min_temp) || 45, Number(a.max_temp) || 95, Number(a.target_temp_step) || 0.5]; }
    _attr(k, v) { return attrName(this._hass, this._st(), k, v); }
    _modeName(m) { return this._hass.formatEntityState ? this._hass.formatEntityState({ ...this._st(), state: m }) : m; }
    _build() {
      if (!this._config || !this._hass || !this._st()) return;
      this._built = true;
      const root = this.shadowRoot, a = this._st().attributes;
      const c = 2 * Math.PI * TH_R, len = (c * TH_SWEEP / 360).toFixed(1);
      const members = (Array.isArray(a.member_entities) ? a.member_entities : (Array.isArray(a.entity_id) ? a.entity_id : [])).filter((id) => /^climate\./.test(id) && this._hass.states[id]);
      const tiles = TH_TILES.filter(([k, list]) => (a[list] || []).length);
      root.innerHTML = `<style>${SHEET_CSS}${COVER_CSS}${FAN_CSS}${LIST_CSS}${TH_CSS}${BIG_CSS}${CAPS_CSS}</style><div class="wrap cover thermo${members.length > 1 ? ' grp' : ''}"><div class="hd"><b></b><span></span></div>`
        + `<div class="dial" role="slider"><svg viewBox="0 0 252 252">`
        + `<circle class="trk" cx="126" cy="126" r="${TH_R}" stroke-dasharray="${len} ${c.toFixed(1)}" transform="rotate(135 126 126)"/>`
        + `<g class="segs"></g><circle class="cur" r="4.5"/><circle class="kn" r="13"/></svg><div class="mid"><small></small><strong></strong></div>`
        + `<div class="pm"><button type="button" class="dn" aria-label="${esc(T('climate.lower', 'Lower'))}">${TH_PM[0]}</button><button type="button" class="up" aria-label="${esc(T('climate.raise', 'Raise'))}">${TH_PM[1]}</button></div></div>`
        + `<div class="ctiles" data-n="${tiles.length}">${tiles.map(([k, , , tk, te]) => `<button type="button" class="ct" data-k="${k}"><i></i><span class="tx"><small>${esc(T(tk, te))}</small><b></b></span></button>`).join('')}</div>`
        + (members.length > 1 ? groupPage(T('climate.rooms', 'Rooms'), `<div class="mini rooms">${members.map((id) => `<button type="button" class="t" data-id="${esc(id)}"><span class="ti num"></span><span class="tx"><b></b><small></small></span></button>`).join('')}</div>`, 'thermostat', T('climate.n_rooms', '{n} Rooms', { n: members.length })) : '')
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button></div>`;
      bindGroup(this, root);
      const id = this._config.entity;
      root.querySelector('.gear').onclick = () => moreInfo(this, id);
      const dial = root.querySelector('.dial');
      const fromPoint = (e) => {
        const r = dial.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        let t = (Math.atan2(y, x) * 180 / Math.PI - 135 + 720) % 360;
        if (t > TH_SWEEP) t = t > (TH_SWEEP + 360) / 2 ? 0 : TH_SWEEP;
        const [lo, hi, step] = this._range();
        return Math.round((lo + (hi - lo) * t / TH_SWEEP) / step) * step;
      };
      let drag = false;
      dial.addEventListener('pointerdown', (e) => { if (this._st().state === 'off' || e.composedPath().some((n) => n.classList && n.classList.contains('pm'))) return; drag = true; try { dial.setPointerCapture(e.pointerId); } catch (_) {} this._show(fromPoint(e)); });
      dial.addEventListener('pointermove', (e) => { if (drag) this._show(fromPoint(e)); });
      const end = () => { if (!drag) return; drag = false; if (this._pend != null) this._act('set_temperature', { temperature: this._pend }); };
      dial.addEventListener('pointerup', end);
      dial.addEventListener('pointercancel', end);
      const nudge = (d) => {
        const [lo, hi, step] = this._range(), base = this._pend != null ? this._pend : Number(this._st().attributes.temperature);
        if (!Number.isFinite(base)) return;
        this._show(Math.max(lo, Math.min(hi, Math.round((base + d * step) / step) * step)));
        clearTimeout(this._nt); this._nt = setTimeout(() => { if (this._pend != null) this._act('set_temperature', { temperature: this._pend }); }, 700);
      };
      root.querySelector('.pm .up').onclick = () => nudge(1);
      root.querySelector('.pm .dn').onclick = () => nudge(-1);
      root.querySelectorAll('.ct').forEach((b) => {
        b.onclick = (e) => {
          e.stopPropagation();
          const k = b.dataset.k, at = this._st().attributes, def = TH_TILES.find((x) => x[0] === k);
          const cur = k === 'hvac_mode' ? this._st().state : at[k];
          capPick(b, (at[def[1]] || []).map((m) => [m, k === 'hvac_mode' ? this._modeName(m) : this._attr(k, m), mIco(mdiFull(this._icon(k, m)))]), cur,
            (m) => this._act(def[2], { [k]: m }));
        };
      });
      // As the dashboard's thermostat tile: the circle switches the room between off and the house's chosen mode.
      root.querySelectorAll('.mini .t').forEach((t) => { t.onclick = (e) => {
        if (!t.dataset.id || !e.composedPath().some((n) => n.classList && n.classList.contains('ti'))) return moreInfo(this, t.dataset.id);
        const m = this._hass.states[t.dataset.id], on = !t.classList.contains('on');
        t.classList.toggle('on', on); t._hold = Date.now() + 4000;
        const want = on ? ((this._hass.states['input_select.hemma_thermostat_mode'] || {}).state || 'cool') : 'off';
        this._hass.callService('climate', 'set_hvac_mode', { entity_id: t.dataset.id, hvac_mode: (m.attributes.hvac_modes || []).includes(want) || want === 'off' ? want : (m.attributes.hvac_modes || []).find((x) => x !== 'off') || 'cool' }).catch(() => { t._hold = 0; this._paint(); });
      }; });
      this._loadIcons();
      this._paint();
    }
    async _loadIcons() {
      this._icons = await iconsFor(this._hass, this._config.entity, 'climate');
      const a = this._st().attributes, names = [];
      TH_TILES.forEach(([k, list]) => (k === 'hvac_mode' ? a.hvac_modes || [] : a[list] || []).forEach((m) => names.push(this._icon(k, m))));
      needMdi(names.concat(Object.values(TH_HVAC)), () => this._paint());
      this._paint();
    }
    _icon(k, v) {
      return k === 'hvac_mode' ? TH_HVAC[v] || 'mdi:thermostat' : attrIcon(this._icons, k, v);
    }
    _fmt(v) { const s = Number(v); return Number.isFinite(s) ? (Math.round(s) === s ? String(s) : s.toFixed(1)) : '—'; }
    _show(v) { this._pend = v; this._hold = Date.now() + 3000; this._draw(v); }
    _pt(v) {
      const [lo, hi] = this._range(), p = Number.isFinite(Number(v)) && hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0;
      const ang = (135 + TH_SWEEP * p) * Math.PI / 180;
      return [p, (126 + TH_R * Math.cos(ang)).toFixed(1), (126 + TH_R * Math.sin(ang)).toFixed(1)];
    }
    _draw(v) {
      const root = this.shadowRoot, st = this._st(), off = st.state === 'off';
      const [p, x, y] = this._pt(v), stops = TH_GRAD[st.state] || TH_GRAD.cool, sweep = TH_SWEEP * p;
      const at = (deg) => { const a = deg * Math.PI / 180; return `${(126 + TH_R * Math.cos(a)).toFixed(2)} ${(126 + TH_R * Math.sin(a)).toFixed(2)}`; };
      const n = Math.max(1, Math.ceil(sweep));
      let g = sweep > 0 ? `<circle cx="${at(135).split(' ')[0]}" cy="${at(135).split(' ')[1]}" r="15" fill="${stops[0][1]}"/>` : '';
      for (let i = 0; i < n && sweep > 0; i++) {
        const a0 = 135 + sweep * i / n, a1 = Math.min(135 + sweep, 135 + sweep * (i + 1) / n + 0.35);
        g += `<path d="M${at(a0)} A${TH_R} ${TH_R} 0 0 1 ${at(a1)}" stroke="${thColor(stops, (i + 0.5) / n)}"/>`;
      }
      if (sweep > 0) g += `<circle cx="${x}" cy="${y}" r="15" fill="${thColor(stops, 1)}"/>`;
      root.querySelector('.segs').innerHTML = g;
      const kn = root.querySelector('.kn'); kn.setAttribute('cx', x); kn.setAttribute('cy', y);
      root.querySelector('.mid strong').textContent = off ? (this._hass.formatEntityState ? this._hass.formatEntityState(st) : 'Off') : Number.isFinite(Number(v)) ? this._fmt(v) : '—';
    }
    _paint() {
      const root = this.shadowRoot, st = this._st();
      if (!st || !root.querySelector('.hd')) return;
      const a = st.attributes, mode = st.state, h = this._hass, off = mode === 'off';
      root.querySelector('.hd b').textContent = this._config.name || a.friendly_name || this._config.entity;
      const sub = [a.current_temperature != null ? T('climate.current_temp', 'Current {t}°', { t: Math.round(a.current_temperature) }) : '',
        !off && a.fan_mode ? T('climate.fan_is', 'Fan {m}', { m: this._attr('fan_mode', a.fan_mode) }) : ''].filter(Boolean).join(' · ');
      root.querySelector('.hd span').textContent = sub || (h.formatEntityState ? h.formatEntityState(st) : mode);
      const lab = TH_LABEL[mode];
      root.querySelector('.mid small').textContent = off || !lab ? '' : T(lab[0], lab[1]);
      root.querySelector('.dial').classList.toggle('off', off);
      const cur = root.querySelector('.cur'), cp = this._pt(Number(a.current_temperature));
      cur.setAttribute('cx', cp[1]); cur.setAttribute('cy', cp[2]); cur.style.visibility = a.current_temperature == null ? 'hidden' : '';
      if (!(this._hold && Date.now() < this._hold) && !(this._was && (this._st() || {}).last_updated === this._was && Date.now() - this._wasAt < 10000)) { this._pend = null; this._draw(Number(a.temperature)); } else this._draw(this._pend);
      root.querySelectorAll('.ct').forEach((b) => {
        const k = b.dataset.k, v = k === 'hvac_mode' ? mode : a[k];
        b.querySelector('b').textContent = v == null ? '—' : k === 'hvac_mode' ? this._modeName(v) : this._attr(k, v);
        const ic = mdiFull(this._icon(k, v));
        b.querySelector('i').style.setProperty('--i', `url("${ic}")`);
      });
      root.querySelectorAll('.mini .t[data-id]').forEach((t) => {
        const m = h.states[t.dataset.id], ma = m.attributes;
        t.querySelector('.ti').textContent = ma.current_temperature != null ? Math.round(ma.current_temperature) : '—';
        if (!(t._hold && Date.now() < t._hold)) t.classList.toggle('on', !['off', 'unavailable', 'unknown'].includes(m.state));
        const re = (h.entities || {})[t.dataset.id], dv = re && re.device_id && (h.devices || {})[re.device_id], ar = (re && re.area_id) || (dv && dv.area_id);
        t.querySelector('b').textContent = (ar && h.areas && h.areas[ar] && h.areas[ar].name) || ma.friendly_name || t.dataset.id;
        t.querySelector('small').textContent = m.state === 'off' || ma.temperature == null ? (h.formatEntityState ? h.formatEntityState(m) : m.state) : T('climate.set_to', 'Set {t}°', { t: this._fmt(ma.temperature) });
      });
      const rooms = root.querySelector('.mini.rooms');
      if (rooms) requestAnimationFrame(() => {
        rooms.classList.remove('one');
        rooms.classList.toggle('one', [...rooms.querySelectorAll('.t b, .t small')].some((n) => n.scrollWidth > n.clientWidth + 1));
      });
    }
    async _act(svc, data) {
      const tap = window.hemmaTap, id = this._config.entity;
      this._was = (this._st() || {}).last_updated; this._wasAt = Date.now();
      if (tap && tap.modeOf(id) === 'view') { this._hold = 0; this._was = null; return this._paint(); }
      if (tap && tap.modeOf(id) === 'ask') {
        const name = this._config.name || this._st().attributes.friendly_name || id, word = T('tap.change', 'Change');
        if (!(await tap.ask(T('tap.ask', '{verb} {name}?', { verb: word, name }), word, null))) { this._hold = 0; this._was = null; return this._paint(); }
      }
      this._hass.callService('climate', svc, { entity_id: id, ...data }).catch(() => {});
    }
  }
  if (!customElements.get('hemma-thermostat-panel')) customElements.define('hemma-thermostat-panel', HemmaThermostatPanel);

  // Panels made of widgets (Energy first): a headline, one chart, two small widgets and a second page, after Apple Home.
  const WIDGET_CSS = `
    ${HV_CSS}
    :host { display: block; color: #fff; font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); --accent: var(--hemma-color-orange, #FF9230); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    .wrap { position: relative; max-height: calc(100svh - 64px); min-height: var(--hemma-panel-h, 0px); margin: -8px -8px -20px; width: calc(100% + 16px); overflow: hidden; display: flex; }
    .one { position: relative; flex: 1; max-height: calc(100svh - 64px); }
    @media (min-width: 769px) {
      .one { max-height: var(--hemma-panel-h, calc(100svh - 64px)); }
      .one .w:has(> .plot) { flex: 1 0 auto; grid-template-rows: minmax(96px, 1fr) auto; }
      .one .plot, .one svg.chart { height: 100%; }
    }
    @media (min-width: 769px) and (pointer: coarse) {
      .one > .h:first-child { margin-top: 40px; }
      .h b { font-size: 27px; }
      .h span { font-size: 17px; }
      .big { font-size: 52px; }
    }
    @media (max-width: 768px) { .one { padding-top: 32px; padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px)); } }
    .two { position: absolute; inset: 0; }
    .plot { min-height: 96px; }
    .page { transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; box-sizing: border-box;
      padding: 24px 18px 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
    .page::-webkit-scrollbar { display: none; }
    .two { transform: translateX(100%); opacity: 0; }
    .deep .one { transform: translateX(-30%); opacity: 0; pointer-events: none; }
    .deep .two { transform: none; opacity: 1; }
    .h { text-align: center; display: grid; gap: 4px; flex: none; margin-top: 20px; }
    .h b { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.15; }
    .h span { font-size: 15px; font-weight: 600; color: rgba(235,235,245,0.75); font-variant-numeric: tabular-nums; }
    @media (max-width: 768px) { .h b { font-size: 28px; } .h span { font-size: 17px; } }
    .big { flex: none; text-align: center; font-size: 46px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; margin-top: 6px; }
    .big small { font-size: 19px; font-weight: 600; color: rgba(255,255,255,0.7); margin-left: 4px; letter-spacing: 0; }
    .cap { flex: none; text-align: center; font-size: 14px; font-weight: 600; color: rgba(235,235,245,0.6); margin-top: -12px; }
    .seg { position: relative; flex: none; align-self: center; display: flex; gap: 3px; padding: 3px; background: rgba(0,0,0,0.2); border-radius: 999px; margin-top: 4px; }
    .seg .sth { position: absolute; top: 3px; left: 3px; width: 0; height: calc(100% - 6px); border-radius: 999px; background: rgba(255,255,255,0.22); pointer-events: none; transform-origin: center; }
    .seg button { position: relative; z-index: 1; border: 0; background: none; color: rgba(255,255,255,0.72); font: inherit; font-size: 13px; font-weight: 600; padding: 6px 13px; border-radius: 999px; cursor: pointer; transition: color .22s ease; }
    .seg button[aria-pressed="true"] { color: #fff; }
    .w { flex: none; background: rgba(0,0,0,0.2); border-radius: 20px; padding: 13px 15px; display: grid; gap: 6px; }
    button.w { border: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    button.w { transition: filter .4s ease; }
    @media (hover: hover) { button.w:hover { filter: brightness(0.84); transition: filter .18s ease; } }
    .plot { position: relative; touch-action: pan-y; }
    .enddot { position: absolute; width: 8px; height: 8px; border-radius: 50%; margin: -4px 0 0 -4px; pointer-events: none; }
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
    .list { flex: none; background: rgba(0,0,0,0.2); border-radius: 16px; overflow: hidden; }
    .li { display: flex; align-items: center; gap: 12px; padding: 10px 16px; min-height: 56px; position: relative; font-size: 15px; width: 100%; box-sizing: border-box;
      border: 0; background: none; color: inherit; font: inherit; text-align: left; }
    button.li { cursor: pointer; transition: background-color .3s ease; }
    .li + .li::before { content: ""; position: absolute; top: 0; left: 58px; right: 16px; height: 0.5px; background: rgba(255,255,255,0.12); }
    .li.plain + .li.plain::before { left: 16px; }
    .ic { width: 30px; height: 30px; border-radius: 8px; flex: none; display: grid; place-items: center; background: var(--c, var(--accent)); }
    .ic i { width: 18px; height: 18px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .n { flex: 1; min-width: 0; display: grid; }
    .n b { font-size: 16px; font-weight: 550; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .n small { font-size: 13px; line-height: 1.15; margin-top: -1px; color: rgba(255,255,255,0.6); }
    .v { color: rgba(255,255,255,0.65); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .chev { width: 7px; height: 12px; flex: none; color: rgba(255,255,255,0.35); }
    .back { flex: none; align-self: flex-start; border: 0; color: #fff; cursor: pointer; width: 44px; height: 44px; padding: 0; border-radius: 50%; display: grid; place-items: center; position: relative;
      ${GLASS_FILL}
      box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); }
    .back svg { width: 11px; height: 18px; display: block; transform: translateX(-1px); }
    @media (hover: hover) { button.li:hover, .seg button:not([aria-pressed="true"]):hover { background: rgba(0,0,0,0.14); } .back:hover { filter: brightness(1.12); }
      button.li:hover::before, button.li:hover + .li::before { opacity: 0; } }
    button:focus-visible { outline: 2px solid rgba(255,255,255,0.7); outline-offset: -2px; }
    :host { --sab: 0px; --hemma-pop-tile-r: 26px; }
    @media (min-width: 769px) and (hover: hover) { :host { --hemma-pop-tile-r: 20px; } }
    @media (max-width: 768px) { :host { --sab: env(safe-area-inset-bottom, 0px); } }
    @media (min-width: 769px) { :host .wrap { max-height: var(--hemma-panel-h, calc(100svh - 64px)); } :host .wrap.multi, :host .wrap.lst, :host .wrap.cam { min-height: var(--hemma-panel-h, 0px); } }
    @media (min-width: 769px) and (pointer: coarse) {
      .corner, .gear.corner { width: 52px; height: 52px; right: 12.5px; bottom: 13.5px; }
      .corner:is(.open, .glist) { left: 12.5px; right: auto; }
      .corner i, .gear.corner i { width: 24px; height: 24px; }
      .lpill { height: 52px; border-radius: 26px; bottom: 13.5px; padding: 0 21px 0 17px; font-size: 15px; }
    }
  `;
  // Studio's segmented thumb: it travels to the picked option with a slight stretch, as iOS's does.
  const segSlide = (seg, animate) => {
    if (!seg) return;
    let th = seg.querySelector('.sth');
    if (!th) { th = document.createElement('i'); th.className = 'sth'; seg.prepend(th); }
    const on = seg.querySelector('button[aria-pressed="true"]');
    if (!on || !on.offsetWidth) return;
    const toX = on.offsetLeft - 3, toW = on.offsetWidth, fromX = th._x, fromW = th._w;
    th.style.transform = `translateX(${toX}px)`;
    th.style.width = toW + 'px';
    th._x = toX; th._w = toW;
    if (!animate || !fromW || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stretch = 1 + Math.min(0.06, Math.abs(toX - fromX) / 2200);
    th.animate([
      { transform: `translateX(${fromX}px) scaleX(1) scaleY(1)`, width: fromW + 'px' },
      { transform: `translateX(${(fromX + toX) / 2}px) scaleX(${stretch.toFixed(3)}) scaleY(.98)`, width: Math.round((fromW + toW) / 2) + 'px', offset: 0.5 },
      { transform: `translateX(${toX}px) scaleX(1) scaleY(1)`, width: toW + 'px' },
    ], { duration: 260, easing: 'cubic-bezier(.25,.8,.25,1)' });
  };
  const BACK_SVG = '<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.4 1.6 1.8 10l8.6 8.4"/></svg>';
  const num = (st) => { const n = st ? parseFloat(st.state) : NaN; return Number.isFinite(n) ? n : null; };
  const watts = (st) => {
    const n = num(st);
    if (n == null) return null;
    const u = String((st.attributes || {}).unit_of_measurement || 'W');
    return u === 'kW' ? n * 1000 : n;
  };
  const powerParts = (w) => (w == null ? ['—', ''] : w >= 1000 ? [(w / 1000).toFixed(w >= 10000 ? 1 : 2), 'kW'] : [String(Math.round(w)), 'W']);
  // A chart answers the pointer: a line, a dot and the reading at that time, as the old popups' charts did.
  const span = (vals, fit, top) => {
    const hi = Math.max(...vals), lo = Math.min(...vals);
    if (top) return [Math.min(0, lo), Math.max(hi * 1.15, top)];
    if (!fit) return [Math.min(0, lo), hi || 1];
    const m = Math.max((hi - lo) * 0.2, 0.5);
    return [lo - m, hi + m];
  };
  const scrub = (plot, series, fmtV, fmtT, fit, top) => {
    if (!series || series.length < 2) return;
    const vals = series.map((p) => p.v), [min, max] = span(vals, fit, top), pad = 6, H = 96;
    const layer = document.createElement('div');
    layer.className = 'scrub';
    layer.innerHTML = '<div class="ln"></div><div class="dt"></div><div class="tip"></div>';
    plot.appendChild(layer);
    const ln = layer.querySelector('.ln'), dt = layer.querySelector('.dt'), tip = layer.querySelector('.tip');
    const move = (ev) => {
      const r = plot.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const i = Math.round(f * (series.length - 1)), p = series[i];
      const x = (i / (series.length - 1)) * (r.width * 294 / 300);
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
  // A monotone curve (Fritsch-Carlson): smooth like Apple's charts, yet never overshooting a reading or dipping below zero.
  const smoothLine = (P) => {
    const n = P.length;
    if (n < 3) return P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / ((P[i + 1][0] - P[i][0]) || 1));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (!d[i]) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
      if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    let out = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (let i = 0; i < n - 1; i++) {
      const dx = (P[i + 1][0] - P[i][0]) / 3;
      out += ' C' + (P[i][0] + dx).toFixed(1) + ' ' + (P[i][1] + m[i] * dx).toFixed(1) + ' ' + (P[i + 1][0] - dx).toFixed(1) + ' ' + (P[i + 1][1] - m[i + 1] * dx).toFixed(1) + ' ' + P[i + 1][0].toFixed(1) + ' ' + P[i + 1][1].toFixed(1);
    }
    return out;
  };
  const chartSvg = (pts, color, fit, top) => {
    if (!pts || pts.length < 2) return null;
    const W = 300, H = 96, pad = 6, inset = 6;
    const [min, max] = span(pts, fit, top);
    const x = (i) => (i / (pts.length - 1)) * (W - inset);
    const y = (v) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
    const line = smoothLine(pts.map((v, i) => [x(i), y(v)]));
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">`
      + `<stop offset="0" style="stop-color:${color};stop-opacity:.5"/><stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs>`
      + `<path d="${line} L${x(pts.length - 1).toFixed(1)} ${H} L0 ${H} Z" fill="url(#${id})"/><path d="${line}" fill="none" style="stroke:${color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`
      + `</svg><span class="enddot" style="left:${((W - inset) / W * 100).toFixed(2)}%;top:${(y(pts[pts.length - 1]) / H * 100).toFixed(2)}%;background:${color}"></span>`;
  };
  class HemmaEnergyPanel extends HTMLElement {
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
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
      root.innerHTML = `<style>${WIDGET_CSS}${SLAB_CSS}</style><div class="wrap"><div class="page one">`
        + `<div class="h"><b>${esc(this._config.name || T('filter.energy', 'Energy'))}</b><span class="tier"></span></div>`
        + `<div class="slab"><div class="big"></div><div class="cap">${esc(T('energy.current_draw', 'In use'))}</div>`
        + `<div class="seg" role="group">${[['day', T('energy.today', 'Today')], ['week', T('energy.week', 'Week')], ['month', T('energy.month', 'Month')]]
          .map(([k, l]) => `<button type="button" data-r="${k}" aria-pressed="${k === this._range}">${esc(l)}</button>`).join('')}</div>`
        + `<div class="w"><div class="plot"></div><div class="wt axis"></div></div>`
        + `<div class="g2"><button type="button" class="w a"></button><button type="button" class="w b"></button></div>`
        + `<div class="list"><button type="button" class="li plain top"><span class="n"><b>${esc(T('energy.top_devices', 'Usage by Device'))}</b></span><span class="v cnt"></span>${CHEV_SVG}</button></div></div>`
        + `</div><div class="page two"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button>`
        + `<div class="h"><b>${esc(T('energy.top_devices', 'Usage by Device'))}</b><span class="tot"></span></div><div class="list devs"></div></div></div>`;
      const seg = root.querySelector('.seg');
      requestAnimationFrame(() => segSlide(seg, false));
      root.querySelectorAll('.seg button').forEach((b) => { b.onclick = () => {
        if (this._range === b.dataset.r) return;
        this._range = b.dataset.r;
        root.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        segSlide(seg, true);
        this._load();
      }; });
      const wrap = root.querySelector('.wrap');
      root.querySelector('.top').onclick = () => { this._devices(); wrap.classList.add('deep'); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: true, bubbles: true, composed: true })); };
      root.querySelector('.back').onclick = () => wrap.classList.remove('deep'); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: false, bubbles: true, composed: true }));
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
      const stats = (from, period) => this._hass.callWS({ type: 'recorder/statistics_during_period', start_time: from.toISOString(), statistic_ids: [id], period, types: ['mean'] })
        .then((res) => ((res && res[id]) || []).filter((p) => p.mean != null).map((p) => ({ t: p.start, v: p.mean }))).catch(() => []);
      if (!this._series[key]) this._series[key] = stats(start, r === 'month' ? 'day' : 'hour');
      // HA writes an hour's mean only once the hour ends, so the hour in progress comes from the five-minute table.
      const hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
      const [done, fresh] = await Promise.all([this._series[key], r === 'day' ? stats(hour, '5minute') : Promise.resolve([])]);
      if (this._range !== r) return;
      const live = watts(this._hass.states[id]);
      const series = done.filter((p) => r !== 'day' || new Date(p.t) < hour).concat(fresh)
        .concat(live == null ? [] : [{ t: now.getTime(), v: live }]);
      const top = Number(this._config.heavy_threshold) || 1000;
      const svg = chartSvg(series.map((p) => p.v), 'var(--accent)', false, top);
      plot.innerHTML = svg || `<div class="empty">${esc(T('energy.no_history', 'No history yet'))}</div>`;
      axis.style.display = svg ? '' : 'none';
      const fmt = (d, o) => d.toLocaleString(this._hass.locale && this._hass.locale.language || undefined, o);
      if (svg) scrub(plot, series, (v) => powerParts(v).join(' '), (t) => fmt(new Date(t), r === 'month' ? { month: 'short', day: 'numeric' } : r === 'week' ? { weekday: 'short', hour: 'numeric' } : { hour: 'numeric', minute: '2-digit' }), false, top);
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
      // A currency reads $34.55 at one size, as Apple Wallet sets money.
      const money = (st) => {
        const n = num(st), u = unit(st, '');
        if (n == null) return '—';
        const sym = /^[$€£¥₩₹]$/.test(u) ? u : null;
        const [w, f] = n.toFixed(2).split('.');
        const whole = Number(w).toLocaleString();
        return sym ? `${esc(sym)}${esc(whole)}.${f}` : `${esc(whole)}.${f}<small>${esc(u)}</small>`;
      };
      const a = root.querySelector('.w.a'), b = root.querySelector('.w.b');
      const today = S[c.entity_usage_today], costToday = S[c.entity_cost_today];
      const costMonth = S[c.entity_cost_month], month = S[c.entity_usage_month];
      const cost = c.usage_shows !== 'energy' && (c.usage_shows === 'cost' || (costToday && costMonth));
      const kwh = (st, d) => esc(val(st, d)) + `<small>${esc(unit(st, 'kWh'))}</small>`;
      a.innerHTML = `<div class="wt">${esc(T('energy.today', 'Today'))}</div><div class="wv">${cost && costToday ? money(costToday) : today ? kwh(today, 1) : costToday ? money(costToday) : '—'}</div>`;
      b.innerHTML = `<div class="wt">${esc(T('energy.this_month', 'This month'))}</div><div class="wv">${cost && costMonth ? money(costMonth) : month ? kwh(month, 0) : costMonth ? money(costMonth) : '—'}</div>`;
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
      const [tv, tu] = powerParts(total || 0);
      this.shadowRoot.querySelector('.tot').textContent = total ? T('energy.total_in_use', '{w} in use', { w: tv + ' ' + tu }) : '';
      this.shadowRoot.querySelector('.devs').innerHTML = rows.map((r) => {
        const [v, u] = powerParts(r.w);
        const share = total ? Math.round((r.w / total) * 100) : null;
        return `<button type="button" class="li" data-id="${esc(r.id)}" style="--c:rgba(255,255,255,0.14)"><span class="ic"><i style="--i:url('${esc(iconUrl(icons[r.id] || 'plug'))}')"></i></span>`
          + `<span class="n"><b>${esc(nameOf(r.id))}</b>${share != null && r.w > 0 ? `<small>${esc(T('energy.pct_of_draw', '{n}% of total', { n: share }))}</small>` : ''}</span>`
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
    if (dc.includes('volatile') || /voc|volatile/.test(i)) return /index/i.test(u) || /_index$/.test(i) ? { label: 'VOC', good: 6, mod: 8 } : { label: 'VOC', good: 100, mod: 200 };
    if (dc === 'nitrogen_dioxide' || /no2|nitrogen_dioxide/.test(i)) return { label: 'NO₂', good: 53, mod: 100 };
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
      root.querySelector('.hist').onclick = () => { this._history(); wrap.classList.add('deep'); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: true, bubbles: true, composed: true })); };
      root.querySelector('.back').onclick = () => wrap.classList.remove('deep'); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: false, bubbles: true, composed: true }));
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
  const humidWord = (v) => (v == null ? '' : v < 30 ? T('humidity.very_dry', 'Very Dry') : v < 40 ? T('humidity.dry', 'Dry') : v < 61 ? T('humidity.comfortable', 'Comfortable')
    : v < 70 ? T('humidity.humid', 'Humid') : T('humidity.very_humid', 'Very Humid'));
  const SENSOR_CSS = `
    .one { gap: 12px; padding-top: 14px; }
    .bar { flex: none; display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
    .bar b { text-align: center; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
    .sum { flex: none; display: grid; justify-items: center; gap: 2px; padding: 2px 0 6px; }
    .sum strong { font-size: 34px; font-weight: 300; letter-spacing: -0.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .sum span { font-size: 14px; color: rgba(235,235,245,0.6); }
    .rm { flex: none; font-size: 15px; font-weight: 600; color: rgba(235,235,245,0.85); padding: 6px 4px 0; }
    .tl { flex: none; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 62px; grid-auto-flow: row dense; gap: 8px; }
    .t { height: 62px; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px; padding: 0 12px 0 10px; min-width: 0;
      border: 0; color: #fff; font: inherit; text-align: left; cursor: pointer; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    .t .ti { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,0.10); }
    .t .ti.num { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
    .t.tall { grid-row: span 2; height: auto; flex-direction: column; align-items: flex-start; justify-content: space-between; padding: 12px; }
    .t.tall .tx { align-self: stretch; }
    .t .g { width: 20px; height: 20px; display: block; background: var(--c); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .t .tx { min-width: 0; display: grid; }
    .t b { font-size: 14.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t small { font-size: 13px; color: rgba(235,235,245,0.62); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t { transition: filter .4s ease; }
    @media (hover: hover) { .t:hover { filter: brightness(0.84); transition: filter .18s ease; } }
  `;
  class HemmaSensorPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._series = null; }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    _kind() { const k = String(this._config.kind || ''); return k === 'humidity' || k === 'air' ? k : 'temperature'; }
    _reg(id) {
      const h = this._hass, e = (h.entities || {})[id], d = e && e.device_id ? (h.devices || {})[e.device_id] : null;
      return { e, d, area: (e && e.area_id) || (d && d.area_id) || null };
    }
    _area() {
      const c = this._config, a = c.entity && this._reg(c.entity).area;
      if (a) return a;
      const n = String(c.name || '').trim().toLowerCase();
      const hit = Object.values(this._hass.areas || {}).find((x) => String(x.name || '').trim().toLowerCase() === n);
      return hit ? hit.area_id : null;
    }
    _is(id, st) {
      if (!st || id.indexOf('sensor.') !== 0 || num(st) == null) return false;
      const dc = String(st.attributes.device_class || '');
      const k = this._kind();
      if (k === 'temperature') return dc === 'temperature';
      if (k === 'humidity') return dc === 'humidity';
      return sensorKind(st, id).good != null;
    }
    _label(id) {
      const S = this._hass.states, { d, area } = this._reg(id);
      const zone = (this._config.include || this._config.scope === 'home') && area && (this._hass.areas || {})[area];
      const room = String((zone && zone.name) || (this._config.rooms || {})[id] || this._config.name || '').trim();
      const word = this._kind() === 'humidity' ? /\s*humidity\s*/i : /\s*temperature\s*/i;
      const clean = (s) => String(s || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(word, ' ').replace(/\s+/g, ' ').trim();
      const strip = (s) => { const t = clean(s); return room && t.toLowerCase().indexOf(room.toLowerCase() + ' ') === 0 ? t.slice(room.length + 1).trim() : t; };
      const fn = clean((S[id] && S[id].attributes.friendly_name) || id);
      return (d && strip(d.name_by_user || d.name)) || strip(fn) || fn;
    }
    _pick() {
      const h = this._hass, S = h.states, c = this._config, k = this._kind(), area = this._area();
      const inc = Array.isArray(c.include) && c.include.length ? c.include.filter((id) => S[id]) : null;
      const ctrlDom = k === 'temperature' ? 'climate.' : k === 'humidity' ? 'humidifier.' : 'fan.';
      const usable = (id) => { const { e } = this._reg(id); return !(e && (e.entity_category || e.hidden || e.disabled_by)); };
      const home = c.scope === 'home';
      const rooms = c.rooms || {};
      const pool = inc || [...new Set(Object.keys(S).filter((id) => usable(id) && (home ? !!this._reg(id).area : (this._reg(id).area === area && area))).concat(home ? Object.keys(rooms).filter((id) => S[id]) : []))];
      const devOf = (id) => { const { e } = this._reg(id); return (e && e.device_id) || id; };
      const air = k === 'air' ? new Set(pool.filter((id) => this._is(id, S[id])).map(devOf)) : null;
      const named = new Set();
      const ctrlPool = inc || home ? Object.keys(S).filter(usable) : pool;
      const ctrls = ctrlPool.filter((id) => id.indexOf(ctrlDom) === 0 && S[id].state !== 'unavailable' && (!air || air.has(devOf(id))))
        .filter((id) => { const l = (inc || home ? this._reg(id).area + '|' : '') + this._label(id).toLowerCase(); if (named.has(l)) return false; named.add(l); return true; });
      const ctrlDevs = new Set(ctrls.map(devOf));
      const bad = /outdoor|coil|pipe|discharge|soil|min |max /i;
      const gear = /cpu|gpu|disk|nvme|ssd|hdd|unraid|server|\bnas\b|processor|chipset|motherboard|battery|fridge|freezer|oven|water/i;
      const hardware = (id) => { const { d } = this._reg(id); return id.indexOf('sensor.hemma_') === 0 || gear.test(id) || gear.test(S[id].attributes.friendly_name || '') || gear.test((d && (d.name_by_user || d.name)) || ''); };
      const cands = pool.filter((id) => this._is(id, S[id]) && !hardware(id) && !((inc || home) && id === c.entity && k !== 'air') && (k === 'air' || inc || !ctrlDevs.has(devOf(id))))
        .sort((a, b) => (b === c.entity) - (a === c.entity) || (inc ? 0 : (+bad.test(S[a].attributes.friendly_name || '') - +bad.test(S[b].attributes.friendly_name || '')) || a.length - b.length));
      if (!inc && !home && c.entity && S[c.entity] && cands.indexOf(c.entity) < 0 && this._is(c.entity, S[c.entity])) cands.unshift(c.entity);
      const seen = new Set(), sensors = [];
      cands.forEach((id) => {
        const zone = home ? this._reg(id).area + '|' : '';
        const key = k === 'air' ? zone + sensorKind(S[id], id).label : inc ? id : devOf(id) + '|' + this._label(id).toLowerCase();
        const lk = k === 'air' ? key : zone + this._label(id).toLowerCase();
        if (seen.has(key) || (k !== 'air' && !inc && seen.has('l:' + lk))) return;
        seen.add(key); seen.add('l:' + lk);
        sensors.push(id);
      });
      const ORDER = ['PM2.5', 'PM10', 'VOC', 'NO₂', 'CO₂'];
      if (k !== 'air') sensors.sort((a, b) => num(S[b]) - num(S[a]));
      else sensors.sort((a, b) => ((ORDER.indexOf(sensorKind(S[a], a).label) + 9) % 9) - ((ORDER.indexOf(sensorKind(S[b], b).label) + 9) % 9));
      return { ctrls, sensors };
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const k = this._kind();
      const title = k === 'air' ? T('air_quality.title', 'Air Quality') : k === 'humidity' ? T('humidity.title', 'Humidity') : T('temp.title', 'Temperature');
      this._accent = k === 'humidity' ? 'var(--hemma-color-ice, #3cd3fe)' : 'var(--hemma-color-orange, #FF9230)';
      this.shadowRoot.innerHTML = `<style>${WIDGET_CSS}${SENSOR_CSS}</style><div class="wrap"><div class="page one">`
        + `<div class="bar"><span></span><b>${esc(title)}</b><span></span></div>`
        + `<div class="sum"><strong></strong><span></span></div><div class="secs"></div></div></div>`;
      const secs = this.shadowRoot.querySelector('.secs');
      secs.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:none';
      secs.addEventListener('click', (e) => {
        const b = e.target.closest('.t');
        if (b) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: b.dataset.id }, bubbles: true, composed: true }));
      });
      this._paint();
    }
    _hero() {
      const S = this._hass.states, c = this._config, k = this._kind(), st = S[c.entity];
      if (k === 'air') {
        if (!st) return ['—', ''];
        const w = AIR_WORDS[String(st.state).toLowerCase()];
        if (w) return [T(w[0], w[1]), ''];
        const n = num(st);
        return n == null ? [st.state, ''] : [String(Math.round(n)), n <= 50 ? T('air_quality.good', 'Good') : n <= 100 ? T('air_quality.moderate', 'Moderate') : T('air_quality.poor', 'Poor')];
      }
      const n = num(st);
      if (n == null) return ['—', ''];
      if (k === 'humidity') return [Math.round(n) + '%', humidWord(n)];
      return [Math.round(n) + '°', comfortWord(n, st.attributes.unit_of_measurement || '°F')];
    }
    _big(id) {
      if (!this._sizes) {
        this._sizes = {};
        const roots = [document];
        for (let i = 0; i < roots.length; i++) roots[i].querySelectorAll('*').forEach((n) => {
          if (n.shadowRoot) roots.push(n.shadowRoot);
          const c = n.tagName === 'BUTTON-CARD' && n._config;
          if (c && c.entity && c.variables && c.variables.size === 'large') this._sizes[c.entity] = true;
        });
      }
      return !!this._sizes[id];
    }
    _tile(id, ctrl) {
      const S = this._hass.states, st = S[id], k = this._kind(), h = this._hass;
      const fmt = (s) => (h.formatEntityState ? h.formatEntityState(s) : s.state);
      const name = this._label(id) || st.attributes.friendly_name || id;
      const small = (glyph, color, label, sub) => `<button type="button" class="t${this._big(id) ? ' tall' : ''}" data-id="${esc(id)}" style="--c:${color}"><span class="ti"><i class="g" style="--i:url('${esc(iconUrl(glyph))}')"></i></span><span class="tx"><b>${esc(label)}</b><small>${esc(sub)}</small></span></button>`;
      if (ctrl) {
        if (k === 'temperature') {
          const cur = st.attributes.current_temperature, t = st.attributes.temperature;
          const sub = st.state === 'off' || t == null ? fmt(st) : fmt(st) + ' · ' + Math.round(t) + '°';
          return `<button type="button" class="t${this._big(id) ? ' tall' : ''}" data-id="${esc(id)}"><span class="ti num">${cur != null ? Math.round(cur) : '—'}</span><span class="tx"><b>${esc(name)}</b><small>${esc(sub)}</small></span></button>`;
        }
        if (k === 'humidity') { const t = st.attributes.humidity; return small('humidifier', 'var(--hemma-color-ice, #3cd3fe)', name, fmt(st) + (t != null ? ' · ' + Math.round(t) + '%' : '')); }
        const p = st.attributes.percentage;
        return small('purifier', 'var(--hemma-color-teal, #00C3D0)', name, fmt(st) + (st.state === 'on' && p != null ? ' · ' + Math.round(p) + '%' : ''));
      }
      const n = num(st), u = st.attributes.unit_of_measurement || '';
      if (k === 'air') {
        const sk = sensorKind(st, id), tone = toneOf(n, sk) || 'var(--hemma-color-green, #30D158)';
        const v = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
        const word = n <= sk.good ? T('air_quality.good', 'Good') : n <= sk.mod ? T('air_quality.moderate', 'Moderate') : T('air_quality.poor', 'Poor');
        const glyph = { 'PM2.5': 'allergens-fill', 'PM10': 'allergens', 'CO₂': 'co2-fill', 'VOC': 'aqi-medium', 'NO₂': 'aqi-high' }[sk.label] || 'aqi-low';
        return small(glyph, tone, sk.label, !u || /index/i.test(u) ? v + ' · ' + word : v + ' ' + u);
      }
      const plant = (() => { const { e } = this._reg(id); return !!(e && e.device_id && Object.values(h.entities || {}).some((x) => x.device_id === e.device_id && x.entity_id.indexOf('plant.') === 0)); })();
      return small(plant ? 'plant' : k === 'humidity' ? 'humidity' : 'temp-medium', plant ? 'var(--hemma-color-green, #30D158)' : this._accent, name, k === 'humidity' ? Math.round(n) + '%' : Math.round(n) + '°');
    }
    _paint() {
      const root = this.shadowRoot;
      if (!root.querySelector('.sum')) return;
      const [v, cond] = this._hero();
      root.querySelector('.sum strong').textContent = v;
      root.querySelector('.sum span').textContent = cond;
      const { ctrls, sensors } = this._pick();
      const items = ctrls.map((id) => [id, true]).concat(sensors.map((id) => [id, false]));
      const groups = [];
      items.forEach(([id, ctrl]) => {
        const grouped = this._config.include || this._config.scope === 'home';
        const area = grouped ? (this._hass.areas || {})[this._reg(id).area] : null;
        const name = grouped ? ((area && area.name) || (this._config.rooms || {})[id] || '') : '';
        let g = groups.find((x) => x.name === name);
        if (!g) groups.push(g = { name, items: [] });
        g.items.push([id, ctrl]);
      });
      const html = groups.map((g) => `${g.name ? `<div class="rm">${esc(g.name)}</div>` : ''}<div class="tl">${g.items.map(([id, ctrl]) => this._tile(id, ctrl)).join('')}</div>`).join('');
      const secs = root.querySelector('.secs');
      if (secs._html !== html) { secs._html = html; secs.innerHTML = html; }
    }
  }
  if (!customElements.get('hemma-sensor-panel')) customElements.define('hemma-sensor-panel', HemmaSensorPanel);

  const mbps = (st) => {
    const n = num(st);
    if (n == null) return null;
    const u = String((st.attributes || {}).unit_of_measurement || 'Mbit/s');
    return /^kbit|^kb/i.test(u) ? n / 1000 : /^gbit|^gb/i.test(u) ? n * 1000 : /B\/s$/.test(u) && !/bit/i.test(u) ? n * 8 : n;
  };
  const mbpsText = (v) => (v == null ? '—' : v >= 100 ? String(Math.round(v)) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
  class HemmaNetworkPanel extends HTMLElement {
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
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
      root.innerHTML = `<style>${WIDGET_CSS}${SLAB_CSS} :host { --accent: var(--hemma-color-blue, #0088FF); }
        .acts .li.done .n b { color: var(--hemma-color-green, #30D158); }
        .acts .li.done { cursor: default; }
        .acts .li { overflow: hidden; }
        .acts .li > .ic, .acts .li > .n { transition: transform .36s cubic-bezier(.36,0,.16,1); }
        .acts .li.armed > .ic, .acts .li.armed > .n { transform: translateX(-92px); }
        .acts .ok { position: absolute; top: 0; bottom: 0; right: 0; width: 92px; padding: 0 10px; box-sizing: border-box; display: grid; place-items: center; border: 0; border-radius: 0; background: #FF453A; color: #fff;
          font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; transform: translateX(100%); transition: transform .36s cubic-bezier(.36,0,.16,1); }
        .acts .li:not(.armed) .ok { pointer-events: none; }
        .acts .li.armed .ok { transform: none; }
        @media (hover: hover) { .acts .ok:hover { background: #FF6961; } }</style>`
        + `<div class="wrap"><div class="page one"><div class="h"><b>${esc(name)}</b><span class="tier"></span></div>`
        + `<div class="slab"><div class="g2"><button type="button" class="w dl"></button><button type="button" class="w ul"></button></div>`
        + `<div class="w"><div class="plot"></div><div class="wt axis"></div></div>`
        + `<div class="list stats"></div><div class="list acts"></div></div></div></div>`;
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
      const DN = 'var(--hemma-color-blue, #0088FF)', UP = 'var(--hemma-color-teal, #00C3D0)';
      const stats = [[c.entity_ping, T('network.ping', 'Ping'), 'network', 'var(--hemma-color-green, #30D158)'], [c.entity_stat_1, T('network.wired_download', 'Wired download'), 'arrow-down', DN],
        [c.entity_stat_2, T('network.wired_upload', 'Wired upload'), 'arrow-up', UP], [c.entity_stat_3, T('network.wifi_download', 'Wi-Fi download'), 'wifi', DN],
        [c.entity_stat_4, T('network.wifi_upload', 'Wi-Fi upload'), 'wifi', UP]].filter(([id]) => id && S[id] && id !== c.entity_upload && id !== c.entity_download);
      const list = root.querySelector('.stats');
      list.style.display = stats.length ? '' : 'none';
      // Only the rows whose set changed are rebuilt; a value update just rewrites the number, so a hovered row keeps its highlight.
      const key = stats.map((x) => x[0]).join('|');
      if (list.dataset.key === key) {
        list.querySelectorAll('.li').forEach((b) => { const st = S[b.dataset.id]; b.querySelector('.v').textContent = this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state; });
        this._paintActs();
        return;
      }
      list.dataset.key = key;
      list.innerHTML = stats.map(([id, label, icon, color]) => {
        const st = S[id], v = this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state;
        return `<button type="button" class="li" data-id="${esc(id)}" style="--c:${color}"><span class="ic"><i style="--i:url('${esc(iconUrl(icon))}')"></i></span><span class="n"><b>${esc(label)}</b></span><span class="v">${esc(v)}</span>${CHEV_SVG}</button>`;
      }).join('');
      list.querySelectorAll('.li').forEach((b) => { b.onclick = () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: b.dataset.id }, bubbles: true, composed: true })); });
      this._paintActs();
    }
    // A restart asks once: Cancel or the red action, and a confirm nobody answers cancels itself.
    _off(id) { if (id && this._hass.states[id] && this._hass.states[id].state === 'on') Promise.resolve(this._hass.callService('input_boolean', 'turn_off', { entity_id: id })).catch(() => {}); }
    _clearActs() { this._actions().forEach((a) => { this._off(a.confirm); this._off(a.done); }); }
    connectedCallback() { if (this._hass && this._built && !this._cleared) { this._cleared = true; this._clearActs(); } }
    disconnectedCallback() { if (this._hass) this._actions().forEach((a) => this._off(a.confirm)); clearTimeout(this._armT); clearTimeout(this._doneT); this._cleared = false; this._actKey = null; }
    _paintActs() {
      const S = this._hass.states, root = this.shadowRoot;
      const acts = root.querySelector('.acts');
      if (!acts) return;
      if (!this._cleared) { this._cleared = true; this._clearActs(); }
      const A = this._actions();
      acts.style.display = A.length ? '' : 'none';
      const nameOf = (a) => a.label || (S[a.id].attributes.friendly_name || a.id);
      const key = A.map(nameOf).join('|') + '|' + (this._busy || '');
      if (key === this._actKey) return;
      this._actKey = key;
      const look = (a) => { const t = (a.id + ' ' + nameOf(a)).toLowerCase(); return /reboot|restart/.test(t) ? [XI.restart, 'var(--hemma-color-red, #FF453A)'] : /mesh/.test(t) ? [XI.mesh, 'var(--hemma-color-indigo, #5E5CE6)'] : [XI.bolt, 'rgba(142,142,147,1)']; };
      acts.innerHTML = A.map((a, i) => `<button type="button" data-i="${i}" class="li${this._busy === a.id ? ' done' : ''}" style="--c:${look(a)[1]}"><span class="ic"><i style="--i:url('${esc(look(a)[0])}')"></i></span><span class="n"><b>${esc(this._busy === a.id ? T('network.restarting', 'Restarting…') : nameOf(a))}</b></span>`
        + `<span class="ok" role="button" tabindex="-1">${esc(nameOf(a).split(' ')[0])}</span></button>`).join('');
      // As in Hemma Studio: the first tap slides the red confirm in from the right, the confirm runs it, anywhere else puts it away.
      const disarm = () => { acts.querySelectorAll('.li.armed').forEach((r) => r.classList.remove('armed')); clearTimeout(this._armT); };
      acts.querySelectorAll('.li').forEach((bt) => {
        const a = A[Number(bt.dataset.i)];
        bt.querySelector('.ok').onclick = (ev) => {
          ev.stopPropagation();
          if (!bt.classList.contains('armed')) return;
          disarm();
          Promise.resolve(this._hass.callService('button', 'press', { entity_id: a.id })).catch(() => {});
          this._busy = a.id; this._actKey = null; this._paintActs();
          clearTimeout(this._doneT);
          this._doneT = setTimeout(() => { this._busy = null; this._actKey = null; this._paintActs(); }, 15000);
        };
        bt.onclick = () => {
          if (this._busy === a.id) return;
          const was = bt.classList.contains('armed');
          disarm();
          if (was) return;
          bt.classList.add('armed');
          this._armT = setTimeout(disarm, 6000);
        };
      });
      if (!this._awayBound) {
        this._awayBound = true;
        root.addEventListener('pointerdown', (ev) => { const r = root.querySelector('.acts .li.armed'); if (r && !ev.composedPath().includes(r)) { r.classList.remove('armed'); clearTimeout(this._armT); } }, true);
      }
    }
  }
  if (!customElements.get('hemma-network-panel')) customElements.define('hemma-network-panel', HemmaNetworkPanel);

  class HemmaRecentPanel extends HTMLElement {
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    connectedCallback() { this._tellWidth(); }
    _tellWidth() {
      if (!this._width || !this.isConnected) return;
      requestAnimationFrame(() => this.dispatchEvent(new CustomEvent('hemma-width', { detail: this._width, bubbles: true, composed: true })));
    }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { const first = !this._hass; this._hass = h; if (first || !this._built) this._build(); }
    _items() {
      const S = this._hass.states, c = this._config;
      const rows = (id, tv) => { const d = S[id] && S[id].attributes && S[id].attributes.data; return Array.isArray(d) ? d.slice(1).filter((i) => i && i.title).map((i) => ({ ...i, tv })) : []; };
      const days = c.days || 3, cut = Date.now() - days * 864e5;
      const all = rows(c.movies_entity || 'sensor.recently_added_movies', false).concat(rows(c.tv_entity || 'sensor.recently_added_tv', true))
        .filter((i) => i.airdate && new Date(i.airdate).getTime() >= cut).sort((a, b) => new Date(b.airdate) - new Date(a.airdate));
      const shows = [];
      all.filter((i) => i.tv).forEach((i) => {
        const g = shows.find((x) => x.title === i.title);
        if (g) g.eps.push(i); else shows.push({ ...i, eps: [i] });
      });
      return { movies: all.filter((i) => !i.tv), shows };
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const root = this.shadowRoot, { movies, shows } = this._items();
      const url = (raw) => (!raw ? '' : String(raw).startsWith('/') ? location.origin + raw : String(raw));
      const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
      const many = (i) => i.eps && i.eps.length > 1;
      const first = (i) => many(i) ? T('plex.n_new_episodes', '{n} new episodes', { n: i.eps.length }) : i.tv ? clean(i.number) : ((String(i.aired || '').match(/^(\d{4})/) || [])[1] || clean(i.genres).split(',')[0] || '');
      const second = (i) => !many(i) && i.tv ? (clean(i.episode) && clean(i.episode).toLowerCase() !== clean(i.title).toLowerCase() ? clean(i.episode) : '') : '';
      const ago = (iso) => { const h = (Date.now() - new Date(iso).getTime()) / 36e5; return h < 1 ? T('time.just_now', 'just now') : h < 24 ? T('time.short.hours', '{n}h ago', { n: Math.floor(h) }) : T('time.short.days', '{n}d ago', { n: Math.floor(h / 24) }); };
      this._list = movies.concat(shows);
      const shelf = (label, list) => !list.length ? '' : `<div class="sh"><div class="sl"><span>${esc(label)}</span></div><div class="row">`
        + list.map((i) => `<button type="button" class="po" data-k="${this._list.indexOf(i)}"><span class="art" style="background-image:url('${esc(url(i.poster || i.fanart))}')"></span>`
          + `<span class="tx"><b>${esc(clean(i.title))}</b><small>${esc(first(i) || ago(i.airdate))}</small>${second(i) ? `<small class="ep">${esc(second(i))}</small>` : ''}</span><time>${esc(ago(i.airdate))}</time></button>`).join('')
        + `</div></div>`;
      const n = movies.length + shows.reduce((t, i) => t + i.eps.length, 0);
      // On the phone the panel is Apple Music's swipe-through: one big poster at a time, the panel tinted by its artwork.
      const phone = true;
      const byNew = movies.concat(shows).sort((a, b) => new Date(b.airdate) - new Date(a.airdate));
      root.innerHTML = `<style>${WIDGET_CSS}${SLAB_CSS} :host { --accent: var(--hemma-color-gold, #e5a00d); }
        .wrap:has(.slab.rc) { box-sizing: border-box; padding-bottom: 0; overflow: hidden; }
        .slab.rc { position: relative; flex: 1 1 auto; display: block; min-height: 470px; padding: 0; overflow: hidden; touch-action: pan-y; isolation: isolate; }
        .rc .rw { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .9; pointer-events: none; z-index: -2; }
        .rc .rdk { z-index: -1; }
        .rc .rdk { position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.42)); pointer-events: none; }
        .rc .rtrack { position: absolute; left: 0; right: 0; top: 34px; height: var(--rch, 309px); }
        .rc .po.rcard { position: absolute; left: 50%; top: 0; width: var(--rcw, 206px); height: var(--rch, 309px); margin-left: calc(var(--rcw, 206px) / -2); padding: 0; border: 0; background: none; display: block; will-change: transform; }
        .rc .po.rcard .art { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; aspect-ratio: auto; border-radius: 14px; box-shadow: 0 26px 50px -18px rgba(0,0,0,0.85); }
        .rc .po.rcard + .po.rcard::before { display: none; }
        .rc { --rc-mt: calc(34px + var(--rch, 309px) + 22px); }
        .rc .rmeta { position: absolute; left: 20px; right: 20px; top: var(--rc-mt); text-align: center; display: grid; gap: 2px; }
        .rc .rmeta b { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
        .rc .rmeta span { font-size: 15px; color: rgba(255,255,255,0.8); }
        .rc .rmeta small { display: inline-flex; justify-content: center; align-items: center; gap: 5px; font-size: 13px; color: rgba(255,255,255,0.62); margin-top: 6px; }
        .rc .rmeta small svg { width: 12px; height: 12px; }
        .rc .rmeta.sw { animation: rc-in .32s ease; }
        @keyframes rc-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .rc .rdots { position: absolute; left: 50%; transform: translateX(-50%); top: calc(var(--rc-mt) + 98px); display: flex; justify-content: center; gap: 0; z-index: 3; }
        .rc .rdots b { display: grid; place-items: center; width: 22px; height: 44px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .rc .rdots i { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.35); transition: background-color .3s ease, transform .3s ease; }
        .rc .rdots i.on { background: #fff; transform: scale(1.15); }
        .rc .rdots:has(b:only-child) { display: none; }
        @media (min-width: 769px) {
          .one:has(.slab.rc) { padding: 0; }
          .one:has(.slab.rc) > .h { position: relative; z-index: 2; margin: 0; padding-top: var(--rc-top, 30px); pointer-events: none; }
          .slab.rc { position: absolute; inset: 0; min-height: 0; border-radius: 0; }
          .slab.rc .rtrack { top: calc(var(--rc-top, 30px) + 74px); }
          .slab.rc { --rc-mt: calc(var(--rc-top, 30px) + 74px + var(--rch, 309px) + 22px); }
        }
        @media (min-width: 769px) and (pointer: coarse) { :host { --rc-top: 48px; } }
        .rc :is(.rtrack, .rmeta, .rdots) { transition: opacity .28s ease, transform .4s cubic-bezier(0.32, 0.72, 0, 1); }
        .rc.detail :is(.rtrack, .rmeta, .rdots) { opacity: 0; pointer-events: none; }
        .rc .rdet { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: 72px 20px 24px; box-sizing: border-box;
          opacity: 0; pointer-events: none; transition: opacity .3s ease; }
        .rc .rdet::-webkit-scrollbar { display: none; }
        .rc.detail .rdet { opacity: 1; pointer-events: auto; transition-delay: .08s; }
        .rc > .rback { transition: opacity .3s ease; }
        .rc:not(.detail) > .rback { opacity: 0; pointer-events: none; }
        .rc .rback { position: absolute; left: 14px; top: 14px; z-index: 4; width: 40px; height: 40px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; color: #fff; cursor: pointer; ${GLASS_FILL} box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3); }
        .rc .rback svg { width: 10px; height: 16px; transform: translateX(-1px); }
        .rc .rdet { padding-top: 0; overflow-x: hidden; }
        .rc .rdet .det { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
        /* As the Apple TV app: the title's wide art fills the top and fades into the wash, the poster overlapping its lower edge. */
        .rc .rdet .bdrop { position: relative; height: 300px; margin: 0 -20px -126px; background: center / cover no-repeat;
          -webkit-mask-image: linear-gradient(#000 52%, transparent 100%); mask-image: linear-gradient(#000 52%, transparent 100%); }
        /* A twin of the backdrop behind the scrolling page. iOS paints nothing above a scroller's top while it rubber-bands, so the stretch happens out here. */
        .rc > .bdstat { position: absolute; left: 0; right: 0; top: 0; height: 300px; display: none; pointer-events: none; background: center / cover no-repeat;
          -webkit-mask-image: linear-gradient(#000 52%, transparent 100%); mask-image: linear-gradient(#000 52%, transparent 100%); }
        .rc > .bdstat::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 75%); }
        .rc .rdet .bdrop::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 75%); }
        .rc .rdet .hero { position: relative; display: flex; gap: 14px; align-items: flex-end; margin: 0 0 4px; }
        .rc .rdet .pst { width: 92px; flex: none; border-radius: 10px; box-shadow: 0 16px 30px -12px rgba(0,0,0,0.85); }
        .rc .rdet .hx { min-width: 0; display: grid; gap: 7px; padding-bottom: 2px; }
        .rc .rdet .t1 { font-size: 20px; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
        .rc .rdet .hx .meta { margin: 0; }
        .rc .rdet .hx .t1 { display: -webkit-box; }
        .rc .rdet .meta { font-size: 13.5px; color: rgba(235,235,245,0.75); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rc .rdet .seen { font-size: 13px; color: rgba(235,235,245,0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .one:has(.slab.rc) > .h { transition: opacity .25s ease; }
        @media (min-width: 769px) { .one:has(.slab.rc.detail) > .h { opacity: 0; } }
        .rc .rdet .sl { font-size: 15px; font-weight: 600; margin-top: 4px; }
        .rc .rdet .epr { background: rgba(0,0,0,0.24); }
        .rc .rdet p { font-size: 14.5px; color: rgba(255,255,255,0.84); }
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
        .one { padding-left: 24px; padding-right: 24px; gap: 18px; }
        .h b { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.15; }
        .h span { font-size: 15px; font-weight: 600; color: rgba(235,235,245,0.75); font-variant-numeric: tabular-nums; }
        @media (max-width: 768px) { .h b { font-size: 28px; } .h span { font-size: 17px; } }
        .sh { gap: 10px; }
        .sl { display: flex; justify-content: space-between; align-items: baseline; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
        .row { display: grid; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 18px 16px; overflow: visible; margin: 0; padding: 0; }
        .po { width: auto; }
        .tx { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .art { position: relative; box-shadow: 0 6px 18px -8px rgba(0,0,0,0.6); }
        .po time { display: none; }
        @media (max-width: 768px) {
          .one { padding-left: 16px; padding-right: 16px; --slab-x: 13px; }
          .row { display: flex; flex-direction: column; gap: 0; background: rgba(0,0,0,0.2); border-radius: 20px; overflow: hidden; }
          .po { flex-direction: row; align-items: center; gap: 14px; padding: 10px 14px; position: relative; }
          .po + .po::before { content: ""; position: absolute; top: 0; left: 82px; right: 14px; height: 0.5px; background: rgba(255,255,255,0.12); }
          .po .art { width: 54px; flex: none; margin: 0; border-radius: 8px; }
          .tx { flex: 1; gap: 1px; }
          .po b { font-size: 15px; }
          .po small { font-size: 13px; }
          .po small.ep { -webkit-line-clamp: 1; color: rgba(235,235,245,0.6); }
          .po time { display: block; flex: none; font-size: 13px; color: rgba(235,235,245,0.6); white-space: nowrap; }
        }
        :host(.list) .row { display: flex; flex-direction: column; gap: 0; background: rgba(0,0,0,0.2); border-radius: 20px; overflow: hidden; }
        :host(.list) .po { flex-direction: row; align-items: center; gap: 14px; padding: 10px 14px; position: relative; }
        :host(.list) .po + .po::before { content: ""; position: absolute; top: 0; left: 82px; right: 14px; height: 0.5px; background: rgba(255,255,255,0.12); }
        :host(.list) .po .art { width: 54px; flex: none; margin: 0; border-radius: 8px; }
        :host(.list) .tx { flex: 1; gap: 1px; }
        :host(.list) .po b { font-size: 15px; }
        :host(.list) .po small { font-size: 13px; }
        :host(.list) .po small.ep { -webkit-line-clamp: 1; color: rgba(235,235,245,0.6); }
        :host(.list) .po time { display: block; flex: none; font-size: 13px; color: rgba(235,235,245,0.6); white-space: nowrap; }
        .po .art { transition: filter .4s ease; }
        @media (hover: hover) { .po:hover .art { filter: brightness(1.08); transition: filter .18s ease; } }
        .wrap.fade .one, .wrap.fade.deep .one { transform: none; }
        .wrap.fade .two, .wrap.fade.deep .two { transform: none; }
        .wrap.fade .one { opacity: 1; transition: opacity .26s ease .1s; }
        .wrap.fade.deep .one { opacity: 0; transition: opacity .14s ease; }
        .wrap.fade .two { opacity: 0; pointer-events: none; transition: opacity .14s ease; }
        .wrap.fade.deep .two { pointer-events: auto; }
        .wrap.fade.deep .two { opacity: 1; transition: opacity .26s ease .1s; }
        .det { display: grid; gap: 10px; }
        .det .fan { position: relative; overflow: hidden; display: grid; place-items: end center; aspect-ratio: 16 / 9; max-width: 100%; border-radius: 18px; background: rgba(255,255,255,0.08) center / cover no-repeat; }
        .det .shade { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.62)); }
        .det .ti { position: relative; padding: 0 20px 18px; text-align: center; font-size: 26px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.1; text-shadow: 0 2px 14px rgba(0,0,0,0.45); }
        .det .logo { position: relative; max-width: 58%; max-height: 34%; margin-bottom: 18px; object-fit: contain; filter: drop-shadow(0 2px 10px rgba(0,0,0,0.4)); }
        .det .meta { margin-top: 2px; }
        .hero { display: flex; gap: 18px; align-items: flex-start; margin-top: 4px; }
        .pst { flex: none; width: 150px; aspect-ratio: 2 / 3; border-radius: 12px; background: rgba(255,255,255,0.08) center / cover no-repeat; box-shadow: 0 10px 24px -10px rgba(0,0,0,0.7); }
        .hx { display: grid; gap: 7px; min-width: 0; align-content: start; }
        .hx .t1 { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.15; }
        .hx .t2 { font-size: 17px; font-weight: 600; color: rgba(235,235,245,0.85); margin-top: -4px; }
        .hx .kick { font-size: 13px; color: rgba(235,235,245,0.6); }
        .hx .kick:last-child { white-space: nowrap; }
        :host(.list) .pst { width: 124px; }
        :host(.list) .hero { gap: 14px; }
        .hx .dot, .rdet .seen .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--hemma-color-gold, #e5a00d); margin-right: 6px; vertical-align: 1px; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.9); font-variant-numeric: tabular-nums; }
        .chip.solid { background: rgba(255,255,255,0.9); color: #111; }
        @media (max-width: 768px) { .pst { width: 112px; } .hx .t1 { font-size: 21px; } .hx .t2 { font-size: 15px; } }
        .det > b { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin-top: 4px; }
        .det .meta { font-size: 13px; color: rgba(235,235,245,0.6); margin-top: -6px; }
        .det p { margin: 0; font-size: 14px; line-height: 1.45; color: rgba(235,235,245,0.75); }
        .spoil { filter: blur(6px); transition: filter .3s ease; cursor: pointer; }
        .spoil.shown, .epr.open .spoil { filter: none; }
        .det .sl { margin-top: 6px; }
        .eps { display: grid; gap: 8px; }
        .epr { display: grid; gap: 4px; width: 100%; padding: 12px 14px; border: 0; border-radius: 16px; background: rgba(0,0,0,0.2); color: inherit; font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .epr .hd { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
        .epr .rt { flex: none; font-size: 12.5px; color: rgba(235,235,245,0.6); font-variant-numeric: tabular-nums; }
        .epr.open .es { -webkit-line-clamp: unset; display: block; }
        .epr { transition: filter .4s ease; }
        @media (hover: hover) { .epr:hover { filter: brightness(0.84); transition: filter .18s ease; } }
        .th { position: relative; aspect-ratio: 16 / 9; border-radius: 10px; background: rgba(255,255,255,0.08) center / cover no-repeat; }
        .th span { position: absolute; right: 6px; bottom: 6px; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px; background: rgba(0,0,0,0.55); font-variant-numeric: tabular-nums; }
        .epr .tx { display: grid; gap: 3px; min-width: 0; }
        .epr b { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
        .epr .em { font-size: 13px; color: rgba(235,235,245,0.6); font-variant-numeric: tabular-nums; }
        .epr .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--hemma-color-gold, #e5a00d); margin-right: 6px; vertical-align: 1px; }
        .epr .es { font-size: 13.5px; line-height: 1.42; color: rgba(235,235,245,0.75); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .none { flex: none; text-align: center; color: rgba(255,255,255,0.6); font-size: 14px; padding: 18px 0 8px; }</style>`
        + `<div class="wrap fade"><div class="page one"><div class="h"><b>${esc(T('plex.recently_added', 'Recently Added'))}</b><span>${esc(n ? T('plex.n_new', '{n} new', { n }) : T('plex.up_to_date', 'Up to date'))}</span></div>`
        + (phone && n ? `<div class="slab rc"><canvas class="rw"></canvas><i class="rdk"></i><div class="rtrack">`
            + byNew.map((i) => `<button type="button" class="po rcard" data-k="${this._list.indexOf(i)}" aria-label="${esc(clean(i.title))}"><span class="art" style="background-image:url('${esc(url(i.poster || i.fanart))}')"></span></button>`).join('')
            + `</div><div class="rmeta"></div><div class="rdots">${byNew.map((it, k) => `<b data-k="${k}" role="button" data-notip aria-label="${esc(clean(it.title))}"><i></i></b>`).join('')}</div>`
            + `</div>`
          : `<div class="slab">` + (n ? shelf(T('plex.movies', 'Movies'), movies) + shelf(T('plex.tv_shows', 'TV Shows'), shows) : `<div class="none">${esc(T('plex.nothing_added', 'Nothing recently added'))}</div>`) + `</div>`)
        + `</div><div class="page two"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button><div class="det"></div></div></div>`;
      // The sheet is as wide as its longest row of posters, two to four across, never empty space.
      const most = Math.max(movies.length, shows.length);
      const wide = window.matchMedia('(min-width: 769px)').matches, cols = wide ? 3 : Math.max(2, Math.min(4, most));
      this.classList.toggle('list', !phone && most <= 1);
      this._width = wide ? 0 : most <= 1 ? 380 : 48 + cols * 126 + (cols - 1) * 16;
      this.style.setProperty('--cols', String(cols));
      this._tellWidth();
      const wrap = root.querySelector('.wrap');
      root.querySelectorAll('.po').forEach((b) => { b.onclick = () => {
        const i = this._list[Number(b.dataset.k)];
        const lang = (this._hass.locale && this._hass.locale.language) || undefined;
        const epNo = (e) => { const m = /E(\d+)/i.exec(clean(e.number)); return m ? T('plex.episode_n', 'Episode {n}', { n: Number(m[1]) }) : clean(e.number); };
        const aired = (e) => { const d = e.aired ? new Date(e.aired + 'T12:00:00') : null; return d && !isNaN(d) ? T('plex.aired', 'Aired {d}', { d: d.toLocaleDateString(lang, { month: 'short', day: 'numeric' }) }) : ''; };
        const order = (e) => { const m = /S(\d+)E(\d+)/i.exec(clean(e.number)); return m ? Number(m[1]) * 1000 + Number(m[2]) : 0; };
        const named = (e) => { const n = clean(e.episode); return n && !/^episode\s*\d+$/i.test(n) && n.toLowerCase() !== clean(e.number).toLowerCase() ? n : epNo(e); };
        const spoil = (e) => this._config.hide_spoilers === true && !!e.flag;
        const list = many(i) ? `<div class="sl">${esc(T('plex.new_episodes', 'New Episodes'))}</div><div class="eps">${i.eps.slice().sort((x, y) => order(x) - order(y)).map((e) => `<button type="button" class="epr">`
          + `<span class="hd"><b>${esc(named(e))}</b>${e.runtime ? `<span class="rt">${esc(e.runtime + ' min')}</span>` : ''}</span>`
          + `<span class="em">${e.flag ? '<i class="dot"></i>' : ''}${esc([aired(e), T('plex.added', 'Added {t}', { t: ago(e.airdate) })].filter(Boolean).join(' · '))}</span>`
          + `${clean(e.summary) ? `<span class="es${spoil(e) ? ' spoil' : ''}">${esc(clean(e.summary))}</span>` : ''}</button>`).join('')}</div>` : '';
        const mark = i.logo ? `<img class="logo" src="${esc(url(i.logo))}" alt="${esc(clean(i.title))}">` : `<span class="ti">${esc(clean(i.title))}</span>`;
        const se = /S(\d+)E(\d+)/i.exec(clean(i.number));
        const year = (String(i.aired || '').match(/^(\d{4})/) || [])[1] || '';
        const chips = [clean(i.rating) ? `<span class="chip solid">${esc(clean(i.rating))}</span>` : '', i.runtime ? `<span class="chip">${esc(i.runtime + ' min')}</span>` : '',
          year ? `<span class="chip">${esc(year)}</span>` : '', ...clean(i.genres).split(',').map((g) => g.trim()).filter(Boolean).slice(0, 2).map((g) => `<span class="chip">${esc(g)}</span>`)].join('');
        const kick = i.tv ? (se ? T('plex.season_episode', 'Season {s} · Episode {e}', { s: Number(se[1]), e: Number(se[2]) }) : clean(i.number)) : clean(i.studio);
        const seen = `${i.flag ? `<i class="dot"></i>${esc(T('plex.unwatched', 'Unwatched'))} · ` : ''}${esc(T('plex.added', 'Added {t}', { t: ago(i.airdate) }))}`;
        // On the phone the details open inside the same panel, over the same artwork wash, as Apple's do.
        const rc = root.querySelector('.slab.rc');
        if (rc) {
          const genres = clean(i.genres).split(',').map((g) => g.trim()).filter(Boolean).slice(0, 2).join(', ');
          const meta = many(i) ? first(i)
            : i.tv ? [se ? T('plex.se_short', 'S{s} · E{e}', { s: Number(se[1]), e: Number(se[2]) }) : clean(i.number), clean(i.episode)].filter(Boolean).join(' · ')
            : [genres, year].filter(Boolean).join(' · ');
          const chips2 = [clean(i.rating) ? `<span class="chip solid">${esc(clean(i.rating))}</span>` : '', i.runtime ? `<span class="chip">${esc(i.runtime + ' min')}</span>` : '',
            i.tv && year ? `<span class="chip">${esc(year)}</span>` : ''].join('');
          const bd = url(i.fanart || i.art || i.poster);
          const head = `<div class="bdrop" style="background-image:url('${esc(bd)}')"></div>`
            + `<div class="hero"><span class="pst" style="background-image:url('${esc(url(i.poster || i.fanart))}')"></span><div class="hx">`
            + `<span class="t1">${esc(clean(i.title))}</span>${meta ? `<span class="meta">${esc(meta)}</span>` : ''}</div></div>`
            + `${chips2 ? `<span class="chips">${chips2}</span>` : ''}<span class="seen">${seen}</span>`;
          this._rcDetail(rc, head + (many(i) ? list : clean(i.summary) ? `<p${spoil(i) ? ' class="spoil"' : ''}>${esc(clean(i.summary))}</p>` : ''));
          return;
        }
        root.querySelector('.det').innerHTML = many(i)
          ? `<span class="fan" style="background-image:url('${esc(url(i.fanart || i.art || i.poster))}')"><span class="shade"></span>${mark}</span>${list}`
          : `<div class="hero"><span class="pst" style="background-image:url('${esc(url(i.poster || i.fanart))}')"></span><div class="hx">`
            + `<span class="t1">${esc(clean(i.title))}</span>${i.tv && clean(i.episode) ? `<span class="t2">${esc(clean(i.episode))}</span>` : ''}`
            + `${kick ? `<span class="kick">${esc(kick)}</span>` : ''}${chips ? `<span class="chips">${chips}</span>` : ''}<span class="kick">${seen}</span></div></div>`
            + `${clean(i.summary) ? `<p${spoil(i) ? ' class="spoil"' : ''}>${esc(clean(i.summary))}</p>` : ''}`;
        root.querySelectorAll('.det p.spoil').forEach((q) => { q.onclick = () => q.classList.add('shown'); });
        // The details page sets the panel's height while it is open, up to what the screen allows.
        const grow = this._width && this._width < 420 ? 420 - this._width : 0;
        const two = root.querySelector('.two'), from = wrap.offsetHeight;
        // The page fills the panel, so its own height says nothing; its content's extent is the real need.
        const fit = () => {
          const kids = [...two.children].filter((k) => k.offsetParent !== null);
          if (!kids.length) return from;
          const cs = getComputedStyle(two), top = kids[0].getBoundingClientRect().top, bottom = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom));
          return Math.ceil(bottom - top + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
        };
        two.style.boxSizing = 'border-box';
        two.style.width = two.getBoundingClientRect().width + grow + 'px';
        const need = fit();
        two.style.width = ''; two.style.boxSizing = '';
        if (grow) this.dispatchEvent(new CustomEvent('hemma-width', { detail: 420, bubbles: true, composed: true }));
        wrap.style.height = from + 'px';
        void wrap.offsetHeight;
        wrap.style.transition = 'height .38s cubic-bezier(0.2, 0.9, 0.25, 1)';
        wrap.style.height = `min(${need}px, calc(100svh - 150px))`;
        wrap.classList.add('deep'); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: true, bubbles: true, composed: true }));
        root.querySelectorAll('.epr').forEach((r) => { r.onclick = () => {
          const es = r.querySelector('.es');
          if (!es) return;
          const opening = !r.classList.contains('open');
          es.getAnimations().forEach((x) => x.cancel());
          const h0 = es.getBoundingClientRect().height, base = fit();
          r.classList.toggle('open', !opening);
          r.classList.add('open');
          const full = es.getBoundingClientRect().height;
          r.classList.remove('open');
          const short = es.getBoundingClientRect().height;
          r.classList.add('open');
          const h1 = opening ? full : short;
          wrap.style.height = `min(${base + h1 - h0}px, calc(100svh - 150px))`;
          es.style.overflow = 'hidden';
          es.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' })
            .finished.then(() => { es.style.overflow = ''; r.classList.toggle('open', opening); }).catch(() => {});
        }; });
      }; });
      if (root.querySelector('.slab.rc')) this._carousel(root, byNew, { clean, first, second, ago, url });
      root.querySelector('.back').onclick = () => {
        const two = root.querySelector('.two'), h0 = wrap.offsetHeight;
        two.style.width = two.offsetWidth + 'px';
        wrap.style.transition = 'none';
        wrap.classList.remove('deep'); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: false, bubbles: true, composed: true }));
        let h1 = 0;
        const measure = () => { wrap.style.height = ''; h1 = wrap.offsetHeight; wrap.style.height = h0 + 'px'; };
        if (this._width && this._width < 420) {
          const ev = new CustomEvent('hemma-width', { detail: this._width, bubbles: true, composed: true });
          ev.measure = measure;
          this.dispatchEvent(ev);
        }
        if (!h1) measure();
        void wrap.offsetHeight;
        wrap.style.transition = 'height .38s cubic-bezier(0.2, 0.9, 0.25, 1)';
        wrap.style.height = h1 + 'px';
        clearTimeout(this._backT);
        this._backT = setTimeout(() => { wrap.style.height = ''; wrap.style.transition = ''; two.style.width = ''; }, 400);
      };
    }
  }
  HemmaRecentPanel.prototype._rcDetail = function (rc, html) {
    let d = rc.querySelector('.rdet');
    if (!d) {
      d = document.createElement('div');
      d.className = 'rdet';
      rc.appendChild(d);
    }
    d.innerHTML = `<div class="det">${html}</div>`;
    let twin = rc.querySelector(':scope > .bdstat');
    if (!twin) { twin = document.createElement('div'); twin.className = 'bdstat'; rc.insertBefore(twin, d); }
    const bdrop = d.querySelector('.bdrop');
    twin.style.display = 'none';
    twin.style.backgroundImage = bdrop ? bdrop.style.backgroundImage : '';
    if (!d._stretch) {
      d._stretch = true;
      // Pulled past the top, the twin takes over and grows by the pull, so the art stretches into the gap as Apple's headers do.
      d.addEventListener('scroll', () => {
        const b = d.querySelector('.bdrop'), t = rc.querySelector(':scope > .bdstat'), y = d.scrollTop;
        if (!b || !t) return;
        if (y < 0 && rc.classList.contains('detail')) { t.style.height = (b.offsetHeight - y) + 'px'; t.style.display = 'block'; b.style.visibility = 'hidden'; }
        else if (t.style.display !== 'none') { t.style.display = 'none'; b.style.visibility = ''; }
      }, { passive: true });
    }
    // Pinned to the panel, not the scrolling page, so it stays put while the episodes scroll under it.
    let bk = rc.querySelector(':scope > .rback');
    if (!bk) { bk = document.createElement('button'); bk.type = 'button'; bk.className = 'rback'; bk.setAttribute('aria-label', T('ui.back', 'Back')); bk.innerHTML = BACK_SVG; rc.appendChild(bk); }
    d.scrollTop = 0;
    d.querySelectorAll('p.spoil').forEach((q) => { q.onclick = () => q.classList.add('shown'); });
    // Apple's expand: the text's own height animates, so the card grows and shrinks rather than jumping.
    const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
    d.querySelectorAll('.epr').forEach((r) => { r.onclick = () => {
      const es = r.querySelector('.es');
      if (!es) return;
      es.getAnimations().forEach((x) => x.cancel());
      const h0 = es.getBoundingClientRect().height;
      const opening = !r.classList.contains('open');
      r.classList.toggle('open', opening);
      const h1 = es.getBoundingClientRect().height;
      es.style.overflow = 'hidden';
      if (!opening) r.classList.add('open');
      es.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 420, easing: EASE })
        .finished.then(() => { es.style.overflow = ''; r.classList.toggle('open', opening); }).catch(() => {});
    }; });
    // The poster flies from the carousel into its place in the details, and back.
    const fly = (from, to, dur) => {
      if (!from || !to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), r0 = rc.getBoundingClientRect();
      if (!a.width || !b.width) return null;
      const g = document.createElement('span');
      g.className = 'rfly';
      g.style.cssText = `position:absolute;z-index:5;left:${b.left - r0.left}px;top:${b.top - r0.top}px;width:${b.width}px;height:${b.height}px;border-radius:12px;background:${getComputedStyle(from).backgroundImage} center / cover no-repeat;box-shadow:0 22px 40px -16px rgba(0,0,0,0.85);pointer-events:none;transform-origin:0 0;`;
      rc.appendChild(g);
      const sx = a.width / b.width, sy = a.height / b.height;
      const an = g.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${sx}, ${sy})`, borderRadius: `${14 / sx}px / ${14 / sy}px` }, { transform: 'none', borderRadius: '12px' }], { duration: dur, easing: EASE });
      from.style.visibility = 'hidden'; to.style.visibility = 'hidden';
      an.finished.then(() => { g.remove(); from.style.visibility = ''; to.style.visibility = ''; }, () => { g.remove(); from.style.visibility = ''; to.style.visibility = ''; });
      return an;
    };
    const cur = () => [...rc.querySelectorAll('.rcard')].reduce((best, c) => (Number(c.style.zIndex || 0) > Number((best && best.style.zIndex) || -1) ? c : best), null);
    const src = cur(), art = src && src.querySelector('.art');
    rc.classList.add('detail');
    requestAnimationFrame(() => fly(art, d.querySelector('.pst'), 520));
    this.dispatchEvent(new CustomEvent('hemma-deep', { detail: true, bubbles: true, composed: true }));
    bk.onclick = () => {
      twin.style.display = 'none';
      if (bdrop) bdrop.style.visibility = '';
      const pst = d.querySelector('.pst');
      const a2 = cur(), art2 = a2 && a2.querySelector('.art');
      rc.classList.remove('detail');
      if (pst && art2) fly(pst, art2, 460);
      this.dispatchEvent(new CustomEvent('hemma-deep', { detail: false, bubbles: true, composed: true }));
    };
    // The poster took you in; tapping it again takes you back, the same as the back button.
    const pst = d.querySelector('.pst');
    if (pst) { pst.style.cursor = 'pointer'; pst.setAttribute('role', 'button'); pst.setAttribute('aria-label', T('ui.back', 'Back')); pst.setAttribute('data-notip', ''); pst.onclick = () => bk.onclick(); }
  };
  const rcWashCache = new Map();
  const rcBlur = (px, w, h, r) => {
    const a = Float32Array.from(px), b = new Float32Array(px.length), n = 2 * r + 1;
    const pass = (s, d, lines, len, step, lstep) => {
      for (let l = 0; l < lines; l++) for (let c = 0; c < 3; c++) {
        const o = l * lstep + c, at = (i) => s[o + Math.max(0, Math.min(len - 1, i)) * step];
        let sum = 0; for (let i = -r; i <= r; i++) sum += at(i);
        for (let i = 0; i < len; i++) { d[o + i * step] = sum / n; sum += at(i + r + 1) - at(i - r); }
      }
    };
    for (let k = 0; k < 3; k++) { pass(a, b, h, w, 4, w * 4); pass(b, a, w, h, w * 4, 4); }
    for (let i = 0; i < px.length; i += 4) {
      const l = 0.213 * a[i] + 0.715 * a[i + 1] + 0.072 * a[i + 2];
      px[i] = l + (a[i] - l) * 1.45; px[i + 1] = l + (a[i + 1] - l) * 1.45; px[i + 2] = l + (a[i + 2] - l) * 1.45; px[i + 3] = 255;
    }
  };
  HemmaRecentPanel.prototype._carousel = function (root, items, F) {
    const slab = root.querySelector('.slab.rc'), track = slab.querySelector('.rtrack'), meta = slab.querySelector('.rmeta');
    const cards = [...track.children], dots = [...slab.querySelectorAll('.rdots i')], cv = slab.querySelector('.rw');
    const CK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.4 6.6 11.4 12.5 4.8"/></svg>';
    let idx = 0, pos = 0, wt = 0, wsrc = '', wraf = 0, gap = 188, raf = 0;
    const washSize = () => { const w = slab.clientWidth || 340, h = slab.clientHeight || 600; return [w, h, 96, Math.max(8, Math.round(96 * h / w))]; };
    const blurred = (src, done) => {
      const [w, h, bw, bh] = washSize(), key = src + '|' + bh, C = rcWashCache;
      if (C.has(key)) return done(C.get(key));
      const make = (im, safe) => {
        const c = document.createElement('canvas'); c.width = bw; c.height = bh;
        const x = c.getContext('2d'), k = bw / w, ow = (w + 140) * k, oh = (h + 140) * k;
        const sc = Math.max(ow / im.naturalWidth, oh / im.naturalHeight), dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
        x.drawImage(im, (bw - dw) / 2, (bh - dh) / 2, dw, dh);
        if (safe) { try { const d = x.getImageData(0, 0, bw, bh); rcBlur(d.data, bw, bh, Math.round(44 * k)); x.putImageData(d, 0, 0); } catch (_) { safe = false; } }
        if (!safe) { const t = document.createElement('canvas'); t.width = 6; t.height = Math.max(2, Math.round(6 * bh / bw)); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); x.clearRect(0, 0, bw, bh); x.drawImage(t, 0, 0, bw, bh); }
        C.set(key, c); done(c);
      };
      const im = new Image(), same = src.startsWith(location.origin) || src.startsWith('/');
      if (!same) im.crossOrigin = 'anonymous';
      im.onload = () => make(im, true);
      im.onerror = () => { if (same) return; const j = new Image(); j.onload = () => make(j, false); j.src = src; };
      im.src = src;
    };
    const washTo = (src, fade) => {
      const tok = ++wt; wsrc = src;
      blurred(src, (to) => {
        if (tok !== wt) return;
        const x = cv.getContext('2d');
        let from = null;
        if (fade && cv.width === to.width && cv.height === to.height && cv._shown) { from = document.createElement('canvas'); from.width = cv.width; from.height = cv.height; from.getContext('2d').drawImage(cv, 0, 0); }
        if (cv.width !== to.width || cv.height !== to.height) { cv.width = to.width; cv.height = to.height; }
        cancelAnimationFrame(wraf);
        const t0 = performance.now(), dur = fade ? 550 : 0;
        const step = (now) => {
          const t = dur ? Math.min(1, (now - t0) / dur) : 1, e = t * t * (3 - 2 * t);
          x.globalAlpha = 1; x.clearRect(0, 0, cv.width, cv.height);
          if (from) x.drawImage(from, 0, 0);
          x.globalAlpha = e; x.drawImage(to, 0, 0); x.globalAlpha = 1;
          if (t < 1) wraf = requestAnimationFrame(step); else cv._shown = true;
        };
        if (dur) wraf = requestAnimationFrame(step); else step(t0);
      });
    };
    const size = () => {
      const w = slab.clientWidth || 371, top = slab.querySelector('.rtrack').offsetTop || 34, h = (slab.clientHeight || 600) - top + 34;
      const cw = Math.round(Math.min(206, w * 0.56, (h - 230) / 1.5));
      slab.style.setProperty('--rcw', cw + 'px');
      slab.style.setProperty('--rch', Math.round(cw * 1.5) + 'px');
      gap = Math.round(cw * 0.91);
    };
    const layout = (p) => cards.forEach((c, i) => {
      const d = i - p, ad = Math.abs(d), sc = 1 - Math.min(ad, 1.3) * 0.27;
      c.style.transform = `translateX(${d * gap}px) translateY(${Math.min(ad, 1) * 22}px) scale(${sc})`;
      c.style.opacity = String(Math.max(0, 1 - Math.max(0, ad - 0.15) * 0.55));
      c.style.zIndex = String(10 - Math.round(ad * 2));
    });
    const paint = (i, anim) => {
      const it = items[i]; if (!it) return;
      const watched = it.eps ? it.eps.every((e) => e.flag === false) : it.flag === false;
      const sub = [F.first(it), F.second(it)].filter(Boolean).join(' \u00b7 ');
      meta.innerHTML = `<b>${esc(F.clean(it.title))}</b>${sub ? `<span>${esc(sub)}</span>` : ''}<small>${watched ? CK + esc(T('plex.watched', 'Watched')) + ' \u00b7 ' : ''}${esc(T('plex.added', 'Added {t}', { t: F.ago(it.airdate) }))}</small>`;
      if (anim) { meta.classList.remove('sw'); void meta.offsetWidth; meta.classList.add('sw'); }
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      washTo(F.url(it.poster || it.fanart), true);
    };
    const go = (i) => {
      i = Math.max(0, Math.min(items.length - 1, i));
      if (i !== idx) { idx = i; paint(i, true); }
      cancelAnimationFrame(raf);
      const from = pos, t0 = performance.now();
      const step = (now) => { const t = Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - t, 3); pos = from + (i - from) * e; layout(pos); if (t < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    size(); layout(0); paint(0, false);
    if (window.ResizeObserver) new ResizeObserver(() => { size(); layout(pos); if (wsrc && washSize()[3] !== cv.height) washTo(wsrc, false); }).observe(slab);
    // Each dot sits in a 44pt-tall target, and a tap goes straight to its title.
    slab.querySelector('.rdots').onclick = (e) => { const b = e.target.closest('b[data-k]'); if (b) go(Number(b.dataset.k)); };
    // A tap on the centered poster opens its page; a tap on a side one brings it to the middle.
    cards.forEach((c, i) => { const open = c.onclick; c.onclick = (e) => { if (track._dragged) return; if (i !== idx) go(i); else if (open) open.call(c, e); }; });
    let x0 = null, p0 = 0;
    track.addEventListener('pointerdown', (e) => { x0 = e.clientX; p0 = pos; track._dragged = false; cancelAnimationFrame(raf); });
    track.addEventListener('pointermove', (e) => {
      if (x0 == null) return;
      const d = e.clientX - x0;
      if (!track._dragged && Math.abs(d) < 6) return;
      if (!track._dragged) { track._dragged = true; try { track.setPointerCapture(e.pointerId); } catch (_) {} }
      let p = p0 - d / gap;
      if (p < 0) p *= 0.35; if (p > items.length - 1) p = items.length - 1 + (p - items.length + 1) * 0.35;
      pos = p; layout(pos);
      const n = Math.round(Math.max(0, Math.min(items.length - 1, p)));
      if (n !== idx) { idx = n; paint(n, true); }
    });
    const end = (e) => {
      if (x0 == null) return;
      const d = e.clientX - x0; x0 = null;
      if (!track._dragged) return;
      let n = Math.round(pos);
      if (Math.abs(d) > 40 && n === Math.round(p0)) n = Math.round(p0) + (d < 0 ? 1 : -1);
      go(n);
      setTimeout(() => { track._dragged = false; }, 0);
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
  };
  if (!customElements.get('hemma-recent-panel')) customElements.define('hemma-recent-panel', HemmaRecentPanel);

  const camSnd = (muted, px) => {
    const u = window.hemmaIconUrl ? window.hemmaIconUrl(muted ? 'speaker-mute' : 'speaker-wave') : '';
    return `<i style="display:block;width:${px}px;height:${px}px;background:currentColor;-webkit-mask:url(&quot;${u}&quot;) center / contain no-repeat;mask:url(&quot;${u}&quot;) center / contain no-repeat"></i>`;
  };
  const CAM_I = {
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>',
    snap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10l5-3v10l-5-3z"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>',
  };
  const CAM_CSS = `
    .wrap.cam { min-height: 0; }
    .cam .hd { margin-bottom: 16px; }
    .vid { flex: none; position: relative; align-self: stretch; border-radius: 22px; overflow: hidden; background: rgba(0,0,0,0.3); aspect-ratio: var(--cam-ratio, 1 / 1); }
    .vid .feed { position: absolute; inset: 0; --ha-card-border-radius: 0; --ha-card-background: transparent; --ha-card-box-shadow: none; --ha-card-border-width: 0; }
    .vid .feed ha-card, .vid .feed > * { height: 100%; }
    .badge { position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #fff; background: rgba(0,0,0,0.45); padding: 4px 9px; border-radius: 999px; border: 0; font-family: inherit; }
    .badge i { width: 7px; height: 7px; border-radius: 50%; background: #ff453a; }
    .badge.clip i { background: var(--hemma-color-teal, #00C3D0); }
    button.badge { cursor: pointer; }
    .ov { position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; }
    .ov button { width: 38px; height: 38px; border: 0; border-radius: 50%; display: grid; place-items: center; color: #fff; background: rgba(0,0,0,0.42); cursor: pointer; padding: 0; transition: background-color .4s ease; }
    .ov svg { width: 17px; height: 17px; }
    @media (hover: hover) { .ov button:hover { background: rgba(0,0,0,0.6); transition: background-color .18s ease; } }
    .na { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 2px; color: rgba(235,235,245,0.6); text-align: center; }
    .na svg { width: 26px; height: 26px; margin-bottom: 6px; }
    .na b { color: #fff; font-size: 15px; font-weight: 600; }
    .na small { font-size: 13px; }
    .act .th { width: 36px; height: 36px; flex: none; border-radius: 9px; background: rgba(255,255,255,0.1) center / cover no-repeat; display: grid; place-items: center; }
    .act .th i { width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.55); display: grid; place-items: center; }
    .act .th svg { width: 10px; height: 10px; color: #fff; }
    .act .tag { font-size: 12.5px; font-weight: 600; color: var(--hemma-color-teal, #00C3D0); white-space: nowrap; }
    .act .none { padding: 16px; text-align: center; font-size: 14px; color: rgba(235,235,245,0.6); }
    .cams { align-self: stretch; display: grid; gap: 10px; margin-bottom: 66px; }
    .cell { position: relative; border: 0; padding: 0; border-radius: 20px; overflow: hidden; aspect-ratio: 16 / 10; background: rgba(0,0,0,0.25); cursor: pointer; font: inherit; color: #fff; transition: filter .4s ease; }
    .cell .feed { position: absolute; inset: 0; --ha-card-border-radius: 0; --ha-card-background: transparent; --ha-card-box-shadow: none; --ha-card-border-width: 0; pointer-events: none; }
    .cell .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 26px 14px 10px; text-align: left; background: linear-gradient(transparent, rgba(0,0,0,0.6)); display: grid; }
    .cell .cap b { font-size: 15px; font-weight: 600; }
    .cell .cap small { font-size: 12.5px; color: rgba(235,235,245,0.8); }
    @media (hover: hover) { .cell:hover { filter: brightness(0.84); transition: filter .18s ease; } }
    .cam .back { position: absolute; top: 14px; left: 14px; z-index: 2; }
    .cam .act { margin-bottom: 66px; }
  `;
  const CAM_EVENT_T = (kind) => kind === 'ding' ? ['bell', T('cameras.doorbell', 'Doorbell'), '10,132,255'] : ['motion', T('cameras.motion', 'Motion'), '255,159,10'];
  class HemmaCameraPanel extends HTMLElement {
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._feeds = {}; }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) {
      this._hass = h;
      Object.values(this._feeds).forEach((f) => { if (f.card) f.card.hass = h; });
      if (!this._built) this._build(); else this._paint();
    }
    disconnectedCallback() { clearInterval(this._tick); }
    _cams() {
      const c = this._config, S = this._hass.states;
      const list = (Array.isArray(c.cameras) && c.cameras.length ? c.cameras : [c.entity]).filter((id) => typeof id === 'string' && id.startsWith('camera.') && S[id]);
      const ex = Array.isArray(c.exclude) ? c.exclude : [];
      return list.filter((id) => ex.indexOf(id) < 0);
    }
    _name(id) {
      const n = (this._config.names || {})[id];
      if (n) return n;
      const st = this._hass.states[id];
      return String((st && st.attributes.friendly_name) || id).replace(/\s+(Live View|Live)$/i, '');
    }
    _device(id) { const e = (this._hass.entities || {})[id]; return e && e.device_id; }
    _siblings(id) {
      const d = this._device(id), reg = this._hass.entities || {};
      return d ? Object.keys(reg).filter((k) => reg[k].device_id === d) : [];
    }
    _clipCam(id) { return this._siblings(id).find((k) => k !== id && k.startsWith('camera.') && /record/.test(k)) || null; }
    _events(id) { return this._siblings(id).filter((k) => k.startsWith('event.')); }
    _dead(id) { const st = this._hass.states[id]; return !st || ['unavailable', 'unknown'].includes(st.state); }
    _feed(id, live) {
      const key = id + (live ? ':live' : ':still');
      if (this._feeds[key]) return this._feeds[key];
      const f = this._feeds[key] = { el: document.createElement('div') };
      f.el.className = 'feed';
      (async () => {
        let helpers = null;
        for (let i = 0; i < 100 && !window.loadCardHelpers; i++) await new Promise((r) => setTimeout(r, 50));
        try { helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null; } catch (_) {}
        if (!helpers) return;
        const card = helpers.createCardElement({ type: 'picture-entity', entity: id, camera_view: live ? 'live' : 'auto', show_name: false, show_state: false, tap_action: { action: 'none' }, hold_action: { action: 'none' } });
        card.hass = this._hass;
        f.card = card;
        f.el.appendChild(card);
      })();
      return f;
    }
    _video(root) {
      const walk = (n) => { if (!n) return null; const v = n.querySelector && n.querySelector('video'); if (v) return v; for (const k of (n.querySelectorAll ? n.querySelectorAll('*') : [])) { if (k.shadowRoot) { const x = walk(k.shadowRoot); if (x) return x; } } return null; };
      return walk(root);
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      const cams = this._cams();
      this._multi = cams.length > 1;
      this._sel = this._multi ? null : cams[0] || null;
      this._clip = false;
      this._muted = true;
      this.shadowRoot.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${CAM_CSS}${SLAB_CSS}${BIG_CSS}</style><div class="wrap multi lst cam"></div>`;
      this._render();
      clearInterval(this._tick);
      this._tick = setInterval(() => this._loadActivity(), 60000);
    }
    _render() {
      const wrap = this.shadowRoot.querySelector('.wrap');
      const id = this._sel;
      if (!id) {
        wrap.classList.remove('cine');
        const cams = this._cams();
        wrap.innerHTML = `<div class="hd"><b></b><span></span></div><div class="slab"><div class="cams">${cams.map((c) => `<button type="button" class="cell" data-id="${esc(c)}">`
          + (this._dead(c) ? `<span class="na">${CAM_I.off}<b>${esc(this._name(c))}</b><small>${esc(T('cameras.unavailable', 'Unavailable'))}</small></span>`
            : `<span class="slot"></span><span class="cap"><b>${esc(this._name(c))}</b><small></small></span>`) + `</button>`).join('')}</div>`
          + `</div>`
          + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button>`;
        wrap.querySelectorAll('.cell').forEach((b) => {
          const slot = b.querySelector('.slot');
          if (slot) slot.replaceWith(this._feed(b.dataset.id, false).el);
          b.onclick = () => { this._sel = b.dataset.id; this._clip = false; this._render(); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: true, bubbles: true, composed: true })); };
        });
        wrap.querySelector('.gear').onclick = () => moreInfo(this, cams[0]);
        this._paint();
        this._loadActivity();
        return;
      }
      const show = this._clip && this._clipCam(id) ? this._clipCam(id) : id;
      const cine = wideSheet();
      wrap.classList.toggle('cine', cine);
      if (cine) {
        wrap.innerHTML = `<div class="slab"><div class="vid">${this._dead(id) ? `<span class="na">${CAM_I.off}<b>${esc(this._name(id))}</b><small>${esc(T('cameras.unavailable', 'Unavailable'))}</small></span>`
            : `<span class="slot"></span>${this._clip ? `<button type="button" class="badge clip"><i></i>${esc(T('cameras.back_to_live', 'Back to live'))}</button>` : `<span class="badge"><i></i>${esc(T('cameras.live', 'Live'))}</span>`}`
            + `<div class="ov"><button type="button" class="mute" aria-label="${esc(T('cameras.sound', 'Sound'))}">${camSnd(this._muted, 18)}</button><button type="button" class="snap" aria-label="${esc(T('cameras.snapshot', 'Snapshot'))}">${CAM_I.snap}</button><button type="button" class="full" aria-label="${esc(T('cameras.full_screen', 'Full screen'))}">${CAM_I.full}</button></div>`}`
          + `<span class="shade"></span>${this._multi ? `<button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button>` : ''}<div class="hd"><b></b><span></span></div></div>`
          + `<div class="lbl">${esc(T('energy.today', 'Today'))}</div><div class="list act"><div class="none">${esc(T('cameras.loading', 'Loading…'))}</div></div></div>`
          + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button>`;
      } else wrap.innerHTML = (this._multi ? `<button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button>` : '')
        + `<div class="hd"><b></b><span></span></div>`
        + `<div class="slab"><div class="vid">${this._dead(id) ? `<span class="na">${CAM_I.off}<b>${esc(this._name(id))}</b><small>${esc(T('cameras.unavailable', 'Unavailable'))}</small></span>`
          : `<span class="slot"></span>${this._clip ? `<button type="button" class="badge clip"><i></i>${esc(T('cameras.back_to_live', 'Back to live'))}</button>` : `<span class="badge"><i></i>${esc(T('cameras.live', 'Live'))}</span>`}`
          + `<div class="ov"><button type="button" class="mute" aria-label="${esc(T('cameras.sound', 'Sound'))}">${camSnd(this._muted, 18)}</button><button type="button" class="snap" aria-label="${esc(T('cameras.snapshot', 'Snapshot'))}">${CAM_I.snap}</button><button type="button" class="full" aria-label="${esc(T('cameras.full_screen', 'Full screen'))}">${CAM_I.full}</button></div>`}</div>`
        + `<div class="lbl">${esc(T('cameras.activity', 'Activity'))}</div><div class="list act"><div class="none">${esc(T('cameras.loading', 'Loading…'))}</div></div></div>`
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button>`;
      const slot = wrap.querySelector('.slot');
      if (slot) slot.replaceWith(this._feed(show, true).el);
      const back = wrap.querySelector('.back');
      if (back) back.onclick = () => { this._sel = null; this._render(); this.dispatchEvent(new CustomEvent('hemma-deep', { detail: false, bubbles: true, composed: true })); };
      const vid = wrap.querySelector('.vid');
      const mute = wrap.querySelector('.ov .mute');
      if (mute) mute.onclick = () => {
        this._muted = !this._muted;
        const v = this._video(vid);
        if (v) v.muted = this._muted;
        mute.innerHTML = camSnd(this._muted, 18);
      };
      const snap = wrap.querySelector('.ov .snap');
      if (snap) snap.onclick = () => { const st = this._hass.states[show]; if (st && st.attributes.entity_picture) window.open(st.attributes.entity_picture, '_blank'); };
      const full = wrap.querySelector('.ov .full');
      if (full) full.onclick = () => { const v = this._video(vid) || vid; const go = v.requestFullscreen || v.webkitRequestFullscreen || v.webkitEnterFullscreen; if (go) go.call(v); };
      const live = wrap.querySelector('.badge.clip');
      if (live) live.onclick = () => { this._clip = false; this._render(); };
      wrap.querySelector('.gear').onclick = () => moreInfo(this, id);
      this._paint();
      this._loadActivity();
    }
    async _loadActivity() {
      const ids = this._sel ? [this._sel] : this._cams();
      const sib = [].concat(...ids.map((c) => this._siblings(c)));
      const S = this._hass.states;
      const logs = sib.filter((k) => k.startsWith('sensor.') && S[k] && S[k].attributes.device_class === 'timestamp' && 'category' in S[k].attributes);
      const evs = sib.filter((k) => k.startsWith('event.'));
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const out = [];
      try {
        if (logs.length) {
          const h = await this._hass.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), entity_ids: logs, minimal_response: false, no_attributes: false, significant_changes_only: false });
          Object.keys(h || {}).forEach((eid) => (h[eid] || []).forEach((r) => {
            const at = new Date(r.s), cat = String((r.a || {}).category || '');
            if (!isNaN(at) && at >= start) out.push({ id: eid, kind: /ding|doorbell|button/.test(cat) ? 'ding' : 'motion', at });
          }));
        } else if (evs.length) {
          const rows = await this._hass.callWS({ type: 'logbook/get_events', start_time: start.toISOString(), entity_ids: evs });
          (rows || []).filter((r) => r.state && !['unknown', 'unavailable'].includes(r.state)).forEach((r) => {
            out.push({ id: r.entity_id, kind: /ding|doorbell|button|press/.test(r.entity_id) ? 'ding' : 'motion', at: new Date(r.when * 1000) });
          });
        }
      } catch (_) {}
      const seen = new Set();
      this._acts = out.filter((a) => { const k = a.id + a.at.getTime(); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.at - a.at).slice(0, 6);
      this._paint();
    }
    _time(d) { return d.toLocaleTimeString((this._hass.locale && this._hass.locale.language) || undefined, { hour: 'numeric', minute: '2-digit' }); }
    _paint() {
      const root = this.shadowRoot, wrap = root.querySelector('.wrap');
      if (!wrap || !this._hass) return;
      const acts = this._acts || [];
      const latest = (id) => acts.find((a) => this._siblings(id).indexOf(a.id) >= 0);
      if (!this._sel) {
        const cams = this._cams(), dead = cams.filter((c) => this._dead(c)).length;
        root.querySelector('.hd b').textContent = this._config.name || T('cameras.title', 'Cameras');
        root.querySelector('.hd span').textContent = dead ? T('cameras.n_offline', '{n} Offline', { n: dead }) : acts[0] ? `${CAM_EVENT_T(acts[0].kind)[1]} ${this._time(acts[0].at)}` : T('cameras.no_alerts', 'No Alerts');
        root.querySelectorAll('.cell').forEach((b) => {
          const s = b.querySelector('.cap small'), l = latest(b.dataset.id);
          if (s) s.textContent = l ? `${CAM_EVENT_T(l.kind)[1]} ${this._time(l.at)}` : T('cameras.no_activity', 'No activity today');
        });
        return;
      }
      const id = this._sel, l = latest(id);
      root.querySelector('.hd b').textContent = this._name(id);
      root.querySelector('.hd span').textContent = this._dead(id) ? T('cameras.unavailable', 'Unavailable')
        : [this._clip ? T('cameras.last_clip', 'Last clip') : T('cameras.live', 'Live'), l ? `${CAM_EVENT_T(l.kind)[1]} ${this._time(l.at)}` : ''].filter(Boolean).join(' · ');
      const list = root.querySelector('.act');
      if (!list || !this._acts) return;
      const clipCam = this._clipCam(id), clipSt = clipCam && this._hass.states[clipCam];
      const html = acts.length ? acts.map((a, i) => {
        const [ic, label, hue] = CAM_EVENT_T(a.kind);
        const thumb = i === 0 && clipSt && clipSt.attributes.entity_picture;
        const lead = thumb ? `<span class="th" style="background-image:url('${esc(clipSt.attributes.entity_picture)}')"><i>${CAM_I.play}</i></span>`
          : `<span class="ic" style="background:rgb(${hue})">${ICO(ic === 'bell' ? 'doorbell' : 'person-walking-motion', '#fff')}</span>`;
        return `<button type="button" class="li${thumb ? ' clip' : ''}">${lead}<span class="tx"><b>${esc(label)}</b><small>${esc(this._time(a.at))}</small></span>${thumb ? `<span class="tag">${esc(T('cameras.latest_clip', 'Latest clip'))}</span>` : ''}</button>`;
      }).join('') : `<div class="none">${esc(T('cameras.no_activity', 'No activity today'))}</div>`;
      if (list._html !== html) {
        list._html = html;
        list.innerHTML = html;
        const c = list.querySelector('.li.clip');
        if (c) c.onclick = () => { this._clip = true; this._render(); };
      }
    }
  }
  if (!customElements.get('hemma-camera-panel')) customElements.define('hemma-camera-panel', HemmaCameraPanel);

  // The Cameras section, the Cameras page and the full-screen camera, after Apple Home's.
  // Mounted inside home-assistant: HA's camera stream takes its connection from that page's context and renders nothing outside it.
  const camHost = () => { const ha = document.querySelector('home-assistant'); return (ha && ha.shadowRoot) || document.body; };
  const CAMS = (() => {
    const findRoot = () => {
      const seen = [document];
      for (let i = 0; i < seen.length && i < 4000; i++) {
        const r = seen[i], hit = r.querySelector && r.querySelector('hui-root');
        if (hit) return hit;
        (r.querySelectorAll ? r.querySelectorAll('*') : []).forEach((n) => { if (n.shadowRoot) seen.push(n.shadowRoot); });
      }
      return null;
    };
    let rootEl = null;
    const settings = () => {
      if (!rootEl || !rootEl.isConnected) rootEl = findRoot();
      const c = rootEl && rootEl.lovelace && rootEl.lovelace.config;
      return (c && c.hemma_cameras) || null;
    };
    const on = (S) => !!(S && S.enabled !== false);
    const hassNow = () => (document.querySelector('home-assistant') || {}).hass;
    const areaOf = (hass, id) => {
      const reg = ((hass && hass.entities) || {})[id];
      if (!reg) return null;
      const aid = reg.area_id || (reg.device_id ? (((hass.devices || {})[reg.device_id]) || {}).area_id : null);
      return aid ? ((((hass.areas || {})[aid]) || {}).name || null) : null;
    };
    const norm = (s) => String(s || '').trim().toLowerCase();
    // Every camera unless the section names its own, minus each device's recording twin, which is a clip, not a camera.
    const list = (hass, S, opts) => {
      const st = (hass && hass.states) || {}, reg = (hass && hass.entities) || {};
      const own = Array.isArray(S && S.cameras) ? S.cameras.filter((id) => st[id]) : [];
      let ids = own.length ? own : Object.keys(st).filter((id) => id.startsWith('camera.') && !/record|snapshot/.test(id) && !(reg[id] && (reg[id].hidden || reg[id].hidden_by)));
      const area = opts && opts.area;
      if (area) ids = ids.filter((id) => norm(areaOf(hass, id)) === norm(area));
      return ids;
    };
    const nameOf = (hass, id, S) => {
      const n = S && S.names && S.names[id];
      if (n) return n;
      const s = hass && hass.states[id];
      return String((s && s.attributes.friendly_name) || id).replace(/\s+(Live View|Live)$/i, '');
    };
    const sibs = (hass, id) => {
      const reg = (hass && hass.entities) || {}, d = reg[id] && reg[id].device_id;
      return d ? Object.keys(reg).filter((k) => reg[k].device_id === d) : [];
    };
    const clipOf = (hass, id) => sibs(hass, id).find((k) => k !== id && k.startsWith('camera.') && /record/.test(k)) || null;
    const dead = (hass, id) => { const s = hass && hass.states[id]; return !s || ['unavailable', 'unknown'].includes(s.state); };
    const motion = (hass, id, minutes) => {
      const span = (Number(minutes) > 0 ? Number(minutes) : 5) * 60000, now = Date.now(), st = hass.states;
      return sibs(hass, id).some((k) => {
        const s = st[k];
        if (!s) return false;
        if (k.startsWith('event.')) { const t = Date.parse(s.state); return isFinite(t) && now - t < span; }
        if (k.startsWith('binary_sensor.') && ['motion', 'occupancy', 'presence'].includes(s.attributes.device_class)) return s.state === 'on' || now - Date.parse(s.last_changed) < span;
        return false;
      });
    };
    const still = (hass, id, bust) => {
      const s = hass && hass.states[id], p = s && s.attributes.entity_picture;
      if (!p) return '';
      const u = p.startsWith('/') && hass.hassUrl ? hass.hassUrl(p) : p;
      return u + (u.indexOf('?') < 0 ? '?' : '&') + 't=' + bust;
    };
    const age = (ms) => {
      const s = Math.max(0, Math.round(ms / 1000));
      return s < 5 ? T('cameras.age_now', 'now') : s < 60 ? T('cameras.age_s', '{n}s', { n: s }) : T('cameras.age_m', '{n}m', { n: Math.floor(s / 60) });
    };
    // Today's events, from Ring's history sensors or a device's event entities.
    const events = async (hass, id) => {
      const sib = sibs(hass, id), S = hass.states;
      const logs = sib.filter((k) => k.startsWith('sensor.') && S[k] && S[k].attributes.device_class === 'timestamp' && 'category' in S[k].attributes);
      const evs = sib.filter((k) => k.startsWith('event.'));
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const out = [];
      try {
        if (logs.length) {
          const h = await hass.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), entity_ids: logs, minimal_response: false, no_attributes: false, significant_changes_only: false });
          Object.keys(h || {}).forEach((eid) => (h[eid] || []).forEach((r) => {
            const at = new Date(r.s), cat = String((r.a || {}).category || '');
            if (!isNaN(at) && at >= start) out.push({ kind: /ding|doorbell|button/.test(cat) ? 'ding' : 'motion', at });
          }));
        } else if (evs.length) {
          const rows = await hass.callWS({ type: 'logbook/get_events', start_time: start.toISOString(), entity_ids: evs });
          (rows || []).filter((r) => r.state && !['unknown', 'unavailable'].includes(r.state)).forEach((r) => {
            out.push({ kind: /ding|doorbell|button|press/.test(r.entity_id) ? 'ding' : 'motion', at: new Date(r.when * 1000) });
          });
        }
      } catch (_) {}
      const seen = new Set();
      return out.filter((a) => { const k = a.at.getTime(); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.at - a.at).slice(0, 40);
    };
    const time = (hass, d) => d.toLocaleTimeString((hass.locale && hass.locale.language) || undefined, { hour: 'numeric', minute: '2-digit' });
    const live = async (hass, id) => {
      const el = document.createElement('div');
      el.className = 'feed';
      for (let i = 0; i < 100 && !window.loadCardHelpers; i++) await new Promise((r) => setTimeout(r, 50));
      let helpers = null;
      try { helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null; } catch (_) {}
      if (!helpers) return { el };
      const pic = helpers.createCardElement({ type: 'picture-entity', entity: id, camera_view: 'live', show_name: false, show_state: false, tap_action: { action: 'none' }, hold_action: { action: 'none' } });
      // picture-entity forces its stream muted, and muted makes HA pick WebRTC, which carries no audio on Ring; the stream itself, unmuted, picks HLS with sound.
      pic.hass = hass;
      await Promise.race([customElements.whenDefined('ha-camera-stream'), new Promise((r) => setTimeout(r, 3000))]);
      let card = pic;
      if (customElements.get('ha-camera-stream')) {
        card = document.createElement('ha-camera-stream');
        card.controls = false;
        card.allowExoPlayer = false;
        card.muted = false;
        card.stateObj = hass.states[id];
        card.hass = hass;
        card._hemmaId = id;
        card.style.cssText = 'display:block;width:100%;height:100%;';
      }
      el.appendChild(card);
      return { el, card };
    };
    const videoIn = (n) => {
      if (!n) return null;
      const v = n.querySelector && n.querySelector('video');
      if (v) return v;
      for (const k of (n.querySelectorAll ? n.querySelectorAll('*') : [])) if (k.shadowRoot) { const x = videoIn(k.shadowRoot); if (x) return x; }
      return null;
    };
    return { settings, on, list, nameOf, clipOf, dead, motion, still, age, events, time, live, videoIn, areaOf, hassNow };
  })();
  window.hemmaCams = CAMS;

  const CAM_X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>';
  const CAM_SB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="M9.5 5v14M5.6 8.8h1.6M5.6 11.6h1.6"/></svg>';
  const CAM_GRID = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3.5" y="3.5" width="7.6" height="7.6" rx="2"/><rect x="12.9" y="3.5" width="7.6" height="7.6" rx="2"/><rect x="3.5" y="12.9" width="7.6" height="7.6" rx="2"/><rect x="12.9" y="12.9" width="7.6" height="7.6" rx="2"/></svg>';
  const CAM_MORE = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
  const CAM_BACK = '<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.4 1.6 1.8 10l8.6 8.4"/></svg>';
  const CAM_CHEV = '<svg viewBox="0 0 10 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 2.5 8 8l-5.5 5.5"/></svg>';
  const CAM_WALK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='13.5' cy='4.5' r='2'/%3E%3Cpath d='M10 8.5 7 10v4h2v-2.7l1.4-.7-1.6 8.4h2.1l1.2-5.2 2 2V21h2v-6l-2.1-2.1.6-3c1 1.2 2.5 2 4.3 2.1v-2c-1.4-.1-2.6-.9-3.2-2l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5 0-.8.1z'/%3E%3C/svg%3E";
  const CAM_BELL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z'/%3E%3C/svg%3E";
  // The round buttons take Hemma's glass; the wide capsule takes the N Lights pill's, whose rim is drawn to stretch.
  const CAM_GLASS = `${GLASS_FILL} box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3);`;
  const CAM_PILL = `position: absolute; background-color: rgba(255,255,255,0.135); background-image: linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.07) 6%, rgba(255,255,255,0.025) 12%, rgba(255,255,255,0) 18%), linear-gradient(to top, rgba(255,255,255,0.11), rgba(255,255,255,0.05) 6%, rgba(255,255,255,0.015) 12%, rgba(255,255,255,0) 18%);
      box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3);`;
  const CAM_PILL_RIM = `content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 8%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.48) 50%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.08) 92%, rgba(255,255,255,0) 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);`;

  // One preview: the camera's newest still, swapped in only once it has loaded so it never flashes.
  const camPreview = (hass, id, S, onTap) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pv';
    b.dataset.id = id;
    b.innerHTML = `<img alt=""><span class="sh"></span><span class="dot"></span><span class="lb"><b></b><small></small></span>`;
    b.onclick = () => onTap(id);
    b._paint = (h) => {
      b.querySelector('b').textContent = CAMS.nameOf(h, id, S);
      const off = CAMS.dead(h, id);
      b.classList.toggle('off', off);
      b.querySelector('.dot').hidden = off || !CAMS.motion(h, id, S && S.motion);
      b.querySelector('small').textContent = off ? T('cameras.unavailable', 'Unavailable') : b._at ? CAMS.age(Date.now() - b._at) : b.classList.contains('noimg') ? T('cameras.no_image', 'No image') : '';
    };
    // A camera can serve the same old snapshot for hours (Ring does), so the age counts from when the picture last changed, never from the fetch.
    const sig = (im) => {
      try { const c = document.createElement('canvas'); c.width = 8; c.height = 8; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 8, 8); return Array.from(x.getImageData(0, 0, 8, 8).data).join(','); } catch (_) { return null; }
    };
    const show = (src, at, h) => { b.querySelector('img').src = src; b._at = at; b.classList.add('in'); b._paint(h); };
    const onFrame = (e) => {
      if (!b.isConnected) { window.removeEventListener('hemma-cam-frame', onFrame); return; }
      const f = e.detail === id && (window._hemmaCamFrames || {})[id];
      if (f) show(f.src, f.at, CAMS.hassNow() || hass);
    };
    window.addEventListener('hemma-cam-frame', onFrame);
    b._load = (h) => {
      if (CAMS.dead(h, id) || b._busy) return;
      const url = CAMS.still(h, id, Date.now());
      if (!url) return;
      b._busy = true;
      const im = new Image();
      im.onload = () => {
        b._busy = false;
        const s = sig(im), fresh = s && b._sig != null && s !== b._sig, first = b._sig == null;
        if (s) b._sig = s;
        const live = (window._hemmaCamFrames || {})[id];
        const at = fresh ? Date.now() : first ? null : b._at;
        if (live && (at == null || live.at > at)) { if (b.querySelector('img').src !== live.src) show(live.src, live.at, h); else b._paint(h); return; }
        if (fresh || first || !b.classList.contains('in')) show(url, at, h); else b._paint(h);
      };
      im.onerror = () => { b._busy = false; if (!b._at) { b.classList.add('noimg'); b.querySelector('small').textContent = T('cameras.no_image', 'No image'); } };
      im.src = url;
    };
    return b;
  };
  const PV_CSS = `
    .pv { position: relative; flex: none; border: 0; padding: 0; overflow: hidden; cursor: pointer; color: #fff; font: inherit; text-align: left;
      border-radius: var(--hemma-cam-r, 22px); background: rgba(0,0,0,0.35); -webkit-tap-highlight-color: transparent; }
    .pv img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .35s ease; }
    .pv.in img { opacity: 1; }
    .pv .sh { position: absolute; left: 0; right: 0; bottom: 0; height: 48%; background: linear-gradient(transparent, rgba(0,0,0,0.42)); pointer-events: none; }
    .pv .lb { position: absolute; left: 14px; bottom: 11px; right: 30px; display: grid; line-height: 1.25; text-shadow: 0 1px 6px rgba(0,0,0,0.45); }
    .pv .lb b { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pv .lb small { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.88); font-variant-numeric: tabular-nums; }
    .pv .dot { position: absolute; right: 14px; top: 14px; width: 11px; height: 11px; border-radius: 50%; background: #0A84FF; }
    .pv .dot[hidden] { display: none; }
    .pv { background-color: rgba(0,0,0,0.4); -webkit-backdrop-filter: blur(22px) saturate(1.2); backdrop-filter: blur(22px) saturate(1.2); }
    .pv { -webkit-tap-highlight-color: transparent; }
  `;

  // The refresh only runs while a preview is on screen and the page is in front.
  const camTicker = (host, every) => {
    let shown = false;
    const io = new IntersectionObserver((es) => { shown = es.some((e) => e.isIntersecting); });
    const tick = () => {
      const h = host._hass;
      if (!h || document.hidden) return;
      host.shadowRoot.querySelectorAll('.pv').forEach((b) => { b._paint(h); if (shown) b._load(h); });
    };
    return {
      start() { io.observe(host); clearInterval(this.t); this.t = setInterval(tick, Math.max(3, Number(every) || 10) * 1000); this.a = setInterval(() => { const h = host._hass; if (h) host.shadowRoot.querySelectorAll('.pv').forEach((b) => b._paint(h)); }, 1000); },
      stop() { io.disconnect(); clearInterval(this.t); clearInterval(this.a); },
    };
  };

  class HemmaCameraStrip extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._config = {}; }
    setConfig(c) { this._config = c || {}; this._sig = null; }
    getCardSize() { return 4; }
    connectedCallback() { if (this._tick) this._tick.start(); }
    disconnectedCallback() { if (this._tick) this._tick.stop(); }
    _S() { return Object.assign({}, CAMS.settings() || {}, this._config.settings || {}); }
    _ids() { return Array.isArray(this._config.cameras) && this._config.cameras.length ? this._config.cameras : CAMS.list(this._hass, this._S(), { area: this._config.area }); }
    set hass(h) {
      this._hass = h;
      const ids = this._ids(), sig = ids.join('|');
      if (sig !== this._sig) this._build(ids);
      this.shadowRoot.querySelectorAll('.pv').forEach((b) => b._paint(h));
    }
    _build(ids) {
      this._sig = ids.join('|');
      const S = this._S(), head = this._config.heading;
      this.style.display = ids.length ? '' : 'none';
      this.shadowRoot.innerHTML = `<style>
        :host { display: block; }
        ${PV_CSS}
        .hd { display: flex; align-items: center; gap: 6px; border: 0; background: none; color: #fff; font: inherit; cursor: pointer; padding: 22px var(--hemma-cam-pad, var(--hemma-rail-left, 16px)) 10px; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; -webkit-tap-highlight-color: transparent; }
        .hd svg { width: 9px; height: 15px; opacity: .55; margin-top: 2px; }
        .row { display: flex; gap: var(--hemma-cam-gap, 12px); overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none;
          padding: 0 var(--hemma-cam-pad-r, var(--hemma-cam-pad, var(--hemma-rail-left, 16px))) 0 var(--hemma-cam-pad, var(--hemma-rail-left, 16px)); scroll-padding-left: var(--hemma-cam-pad, var(--hemma-rail-left, 16px)); }
        .row::-webkit-scrollbar { display: none; }
        .pv { width: var(--hemma-cam-w, min(360px, calc(100vw - 48px))); height: var(--hemma-cam-h, auto); aspect-ratio: var(--hemma-cam-ratio, 2 / 1); scroll-snap-align: start; opacity: var(--cat-edge, 1); }
        @media (max-width: 767px) {
          .row { --hemma-cam-gap: 10px; }
          .pv { width: calc(100vw - 2 * var(--hemma-cam-pad, var(--hemma-rail-left, 16px))); height: 140px; aspect-ratio: auto; }
          .row.many .pv { width: calc(100vw - 2 * var(--hemma-cam-pad, var(--hemma-rail-left, 16px)) - 26px); }
        }
      </style>`
        + (head ? `<button type="button" class="hd">${esc(T('cameras.title', 'Cameras'))}${CAM_CHEV}</button>` : '')
        + `<div class="row"></div>`;
      const row = this.shadowRoot.querySelector('.row');
      // As Now Playing: one tile spans the row; with more, each gives up 26px so the next one peeks in.
      row.classList.toggle('many', ids.length > 1);
      ids.forEach((id) => row.appendChild(camPreview(this._hass, id, S, (x) => window.hemmaCameraView.open(x, ids))));
      const hd = this.shadowRoot.querySelector('.hd');
      if (hd) hd.onclick = () => window.hemmaCameraView.openAll(CAMS.list(this._hass, S));
      if (this._tick) this._tick.stop();
      this._tick = camTicker(this, S.refresh);
      if (this.isConnected) this._tick.start();
      this.shadowRoot.querySelectorAll('.pv').forEach((b) => b._load(this._hass));
    }
  }
  if (!customElements.get('hemma-camera-strip')) customElements.define('hemma-camera-strip', HemmaCameraStrip);

  // Apple's Cameras page: every camera large, on black.
  class HemmaCameraPage extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    open(ids) {
      this._ids = ids;
      const h = this._hass = CAMS.hassNow(), S = CAMS.settings() || {};
      this.shadowRoot.innerHTML = `<style>
        :host { position: fixed; inset: 0; z-index: 1000; display: block; color: #fff; font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-user-select: none; user-select: none; }
        ${PV_CSS}
        .pg { position: absolute; inset: 0; background: #000; overflow-y: auto; overscroll-behavior: contain; padding: calc(env(safe-area-inset-top, 0px) + 74px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px); box-sizing: border-box; }
        .back { position: fixed; left: 16px; top: calc(env(safe-area-inset-top, 0px) + 14px); width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; color: #fff; cursor: pointer; z-index: 2; ${CAM_GLASS} }
        .back svg { width: 11px; height: 18px; transform: translateX(-1px); }
        .tt { position: fixed; left: 70px; right: 70px; top: calc(env(safe-area-inset-top, 0px) + 25px); text-align: center; font-size: 17px; font-weight: 600; z-index: 2; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); gap: 14px; }
        .pv { width: 100%; aspect-ratio: 16 / 9; }
        .pv .lb b { font-size: 17px; } .pv .lb small { font-size: 15px; }
        @media (max-width: 767px) { .pg { padding-left: 16px; padding-right: 16px; } .grid { gap: 12px; } }
      </style><div class="pg"><div class="grid"></div></div><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${CAM_BACK}</button><div class="tt">${esc(T('cameras.title', 'Cameras'))}</div>`;
      const grid = this.shadowRoot.querySelector('.grid');
      ids.forEach((id) => grid.appendChild(camPreview(h, id, S, (x) => window.hemmaCameraView.open(x, ids))));
      this.shadowRoot.querySelector('.back').onclick = () => this.close();
      if (!this.isConnected) camHost().appendChild(this);
      if (this._tick) this._tick.stop();
      this._tick = camTicker(this, S.refresh);
      this._tick.start();
      this.shadowRoot.querySelectorAll('.pv').forEach((b) => b._load(h));
      this._watch = setInterval(() => { this._hass = CAMS.hassNow(); }, 2000);
      this.animate([{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' });
      lockScroll(true);
    }
    close() {
      if (this._tick) this._tick.stop();
      clearInterval(this._watch);
      const a = this.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(40px)' }], { duration: 240, easing: 'ease-in', fill: 'forwards' });
      a.finished.then(() => { this.remove(); if (!camHost().querySelector('hemma-camera-view')) lockScroll(false); }, () => this.remove());
    }
  }
  if (!customElements.get('hemma-camera-page')) customElements.define('hemma-camera-page', HemmaCameraPage);

  let scrollWas = null;
  const lockScroll = (on) => {
    const de = document.documentElement;
    if (on && scrollWas === null) { scrollWas = de.style.overflow; de.style.overflow = 'hidden'; }
    else if (!on && scrollWas !== null) { de.style.overflow = scrollWas; scrollWas = null; }
  };

  // Apple's camera view: a timeline sidebar that folds away, the live picture centered, and a tap that takes it full screen.
  class HemmaCameraView extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); if (this._imm) this._setImm(false); else this.close(); } }; }
    open(id, ids) {
      this._id = id; this._ids = ids && ids.length ? ids : [id]; this._clip = false; this._muted = true; this._imm = false;
      this._hass = CAMS.hassNow();
      let side = true;
      try { side = localStorage.getItem('hemma_cam_side') !== '0'; } catch (_) {}
      this._render(side);
      if (!this.isConnected) camHost().appendChild(this);
      document.addEventListener('keydown', this._onKey, true);
      lockScroll(true);
      this.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      clearInterval(this._watch);
      this._watch = setInterval(() => { const h = CAMS.hassNow(); if (h !== this._hass) { this._hass = h; this._paint(); } }, 1000);
      this._loadEvents();
      clearInterval(this._evT);
      this._evT = setInterval(() => this._loadEvents(), 60000);
    }
    close() {
      // The last live frame becomes the camera's preview, so the tile shows what was just watched rather than the camera's old snapshot.
      try {
        const v = CAMS.videoIn(this.shadowRoot.querySelector('.vbox'));
        if (v && v.videoWidth && !this._clip) {
          const c = document.createElement('canvas'), k = Math.min(1, 960 / v.videoWidth);
          c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          (window._hemmaCamFrames = window._hemmaCamFrames || {})[this._id] = { src: c.toDataURL('image/jpeg', 0.82), at: Date.now() };
          window.dispatchEvent(new CustomEvent('hemma-cam-frame', { detail: this._id }));
        }
      } catch (_) {}
      clearInterval(this._watch); clearInterval(this._evT); clearInterval(this._muteT);
      this._feedTok = null;
      document.removeEventListener('keydown', this._onKey, true);
      const done = () => { this.remove(); this.shadowRoot.innerHTML = ''; if (!camHost().querySelector('hemma-camera-page')) lockScroll(false); };
      const a = this._morphOut() || this.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' });
      a.finished.then(done, done);
    }
    _render(side) {
      const h = this._hass, id = this._id;
      this.shadowRoot.innerHTML = `<style>
        :host { position: fixed; inset: 0; z-index: 1001; display: block; color: #fff; font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; --sw: 350px; --top: calc(env(safe-area-inset-top, 0px) + 12px); }
        .root { position: absolute; inset: 0; background: radial-gradient(70% 75% at calc(50% + var(--sw) / 2) 50%, #2c2a28 0%, #1f1e1c 62%, #181716 100%); overflow: hidden; }
        .root:not(.wside) { --sw: 0px; }
        .gb { width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; color: #fff; cursor: pointer; flex: none; -webkit-tap-highlight-color: transparent; ${CAM_GLASS} }
        .gb svg { width: 20px; height: 20px; }
        .gb.x svg { width: 17px; height: 17px; }
        .side { position: absolute; left: 0; top: 0; bottom: 0; width: 350px; background: rgba(255,255,255,0.045); box-shadow: inset -0.5px 0 0 rgba(255,255,255,0.05); transition: transform .38s cubic-bezier(0.32, 0.72, 0, 1), opacity .3s ease; }
        .root:not(.wside) .side { transform: translateX(-100%); opacity: 0; pointer-events: none; }
        .hdr { position: absolute; left: 14px; top: var(--top); width: calc(350px - 28px); display: flex; align-items: center; gap: 12px; z-index: 3; transition: opacity .25s ease; }
        .hdr .nm { flex: 1; min-width: 0; display: grid; line-height: 1.2; }
        .hdr .nm b { font-size: 19px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hdr .nm small { font-size: 15px; color: rgba(235,235,245,0.6); }
        .root:not(.wside) .hdr { opacity: 0; pointer-events: none; }
        .sbf { position: absolute; left: 14px; top: var(--top); z-index: 3; opacity: 0; pointer-events: none; transition: opacity .25s ease; }
        .root:not(.wside) .sbf { opacity: 1; pointer-events: auto; }
        .tl { position: absolute; left: 0; right: 0; top: calc(var(--top) + 76px); bottom: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: 0 12px 30px; box-sizing: border-box; }
        .tl::-webkit-scrollbar { display: none; }
        .tl::before { content: ""; position: absolute; left: 39px; top: 46px; bottom: 0; border-left: 2px dashed rgba(255,255,255,0.12); }
        .ev { position: relative; width: 100%; display: flex; align-items: center; gap: 14px; min-height: 66px; padding: 8px 10px; box-sizing: border-box; border: 0; border-radius: 16px; background: none; color: #fff; font: inherit; text-align: left; cursor: default; -webkit-tap-highlight-color: transparent; }
        .ev.go { cursor: pointer; }
        .ev.on { background: rgba(255,255,255,0.08); }
        @media (hover: hover) { .ev.go:not(.on):hover { background: rgba(255,255,255,0.05); } }
        .ev .mk { position: relative; z-index: 1; width: 26px; height: 26px; flex: none; margin: 0 5px; border-radius: 50%; display: grid; place-items: center; }
        .ev .mk.lv { background: #1f1e1c; box-shadow: 0 0 0 2px rgba(255,255,255,0.32); }
        .ev .mk.lv i { width: 12px; height: 12px; border-radius: 50%; background: #FF453A; }
        .ev .mk.m { background: var(--c, #FF9F0A); }
        .ev .mk.m i { width: 16px; height: 16px; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
        .ev .tx { flex: 1; min-width: 0; display: grid; line-height: 1.25; }
        .ev .tx b { font-size: 17px; font-weight: 600; }
        .ev .tx small { font-size: 15px; color: rgba(235,235,245,0.55); }
        .ev .th { width: 92px; height: 52px; flex: none; border-radius: 10px; background: rgba(255,255,255,0.08) center / cover no-repeat; }
        .ev.none { color: rgba(235,235,245,0.5); font-size: 15px; cursor: default; padding-left: 52px; }
        .mn { position: absolute; top: 0; bottom: 0; right: 0; left: var(--sw); transition: left .38s cubic-bezier(0.32, 0.72, 0, 1); }
        .stage { position: absolute; left: 28px; right: 28px; top: calc(var(--top) + 60px); bottom: 70px; container-type: size; display: grid; place-items: center; transition: inset .38s cubic-bezier(0.32, 0.72, 0, 1); }
        .vbox { position: relative; width: min(100cqw, 100cqh * var(--r, 1.777)); height: min(100cqh, 100cqw / var(--r, 1.777)); border-radius: 26px; overflow: hidden; background: #000; cursor: pointer;
          box-shadow: 0 30px 80px -30px rgba(0,0,0,0.85); transition: border-radius .38s ease; }
        .vbox .still { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
        .vbox .still:not([src]) { display: none; }
        .vbox.live .still { opacity: 0; transition: opacity .3s ease; }
        .vbox { background: #000; }
        .grp .mute[hidden] { display: none; }
        .vbox .feed { opacity: 0; transition: opacity .35s ease; position: absolute; inset: 0; --ha-card-border-radius: 0; --ha-card-background: transparent; --ha-card-box-shadow: none; --ha-card-border-width: 0; pointer-events: none; }
        .vbox .feed.on { opacity: 1; }
        .vbox .feed ha-card, .vbox .feed > * { height: 100%; }
        .vbox .na { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; gap: 4px; color: rgba(235,235,245,0.6); font-size: 15px; }
        .vbox .na b { color: #fff; font-size: 17px; }
        .grp { ${CAM_PILL} right: 14px; top: var(--top); display: flex; gap: 2px; padding: 0 4px; height: 44px; border-radius: 22px; z-index: 3; transition: opacity .25s ease; }
        .grp::before { ${CAM_PILL_RIM} }
        .grp button { width: 48px; height: 44px; border: 0; padding: 0; background: none; color: #fff; display: grid; place-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .grp svg { width: 21px; height: 21px; }
        @media (hover: hover) { .gb:hover, .grp button:hover { filter: brightness(1.15); } }
        .root.imm .mn { background: #000; }
        .root.imm .stage { left: 0; right: 0; top: 0; bottom: 0; }
        .root.imm .vbox { border-radius: 0; box-shadow: none; }
        .root.imm :is(.grp, .sbf, .gmenu) { opacity: 0; pointer-events: none; }
        .root.imm:not(.wside) .hdr { opacity: 0; }
        @media (max-width: 767px) {
          .side { display: none; }
          :host { --top: env(safe-area-inset-top, 0px); }
          .root { background: linear-gradient(180deg, #1c1a1b 0%, #222021 16%, #171415 58%, #1a1718 100%); --sw: 0px; }
          .sbf { display: none; }
          .hdr .sbt { display: none; }
          .hdr { left: 16px; width: auto; right: 170px; }
          .root .hdr { opacity: 1; pointer-events: auto; }
          .mn { overflow-y: auto; overscroll-behavior: contain; }
          .stage { position: relative; left: auto; right: auto; top: auto; bottom: auto; margin: calc(var(--top) + 95px) 0 0; height: min(calc(100vw / var(--r, 1.777)), 62svh); }
          .vbox { border-radius: 0; box-shadow: none; }
          .ptl { display: block !important; padding: 18px 8px calc(env(safe-area-inset-bottom, 0px) + 24px); position: relative; }
          .ptl::before { content: ""; position: absolute; left: 35px; top: 64px; bottom: 0; border-left: 2px dashed rgba(255,255,255,0.12); }
          .root.imm .stage { position: absolute; margin: 0; inset: 0; height: auto; }
          .root.imm .ptl, .root.imm .hdr { display: none !important; }
        }
        .ptl { display: none; }
        ${CAPS_CSS}
      </style>
      <div class="root${side ? ' wside' : ''}">
        <div class="side"><div class="tl"></div></div>
        <div class="mn">
          <div class="stage"><div class="vbox"><img class="still" alt=""></div></div>
          <div class="ptl"></div>
        </div>
        <div class="hdr"><button type="button" class="gb x" aria-label="${esc(T('ui.close', 'Close'))}">${CAM_X}</button><span class="nm"><b></b><small></small></span><button type="button" class="gb sbt" aria-label="${esc(T('cameras.sidebar', 'Sidebar'))}">${CAM_SB}</button></div>
        <button type="button" class="gb sbf sbt" aria-label="${esc(T('cameras.sidebar', 'Sidebar'))}">${CAM_SB}</button>
        <div class="grp"><button type="button" class="all" aria-label="${esc(T('cameras.title', 'Cameras'))}">${CAM_GRID}</button><button type="button" class="mute" aria-label="${esc(T('cameras.sound', 'Sound'))}">${camSnd(true, 22)}</button><button type="button" class="more" aria-label="${esc(T('ui.more', 'More'))}">${CAM_MORE}</button></div>
      </div>`;
      const q = (s) => this.shadowRoot.querySelector(s);
      const root = q('.root');
      q('.hdr .x').onclick = () => this.close();
      this.shadowRoot.querySelectorAll('.sbt').forEach((b) => { b.onclick = () => {
        const want = !root.classList.contains('wside');
        root.classList.toggle('wside', want);
        try { localStorage.setItem('hemma_cam_side', want ? '1' : '0'); } catch (_) {}
      }; });
      q('.grp .all').onclick = () => { window.hemmaCameraView.openAll(this._ids.length > 1 ? this._ids : CAMS.list(this._hass, CAMS.settings())); };
      q('.grp .mute').onclick = () => { this._muted = !this._muted; this._applyMute(); };
      q('.grp .more').onclick = (e) => {
        e.stopPropagation();
        const mac = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        capPick(mac ? e.currentTarget : q('.grp'), [['snap', T('cameras.snapshot', 'Snapshot'), CAM_I.snap], ['set', T('lights.settings', 'Settings'), GEAR_MENU]], null, (a) => {
          if (a === 'snap') { const u = CAMS.still(this._hass, this._show(), Date.now()); if (u) window.open(u, '_blank'); }
          if (a === 'set') { this.close(); setTimeout(() => moreInfo(document.querySelector('home-assistant'), this._id), 220); }
        }, root);
      };
      q('.vbox').onclick = () => this._setImm(!this._imm);
      // On the phone a downward swipe on the picture or the header puts the camera away.
      let y0 = null;
      root.addEventListener('touchstart', (e) => { const t = e.touches[0]; y0 = t && !e.composedPath().some((n) => n.classList && (n.classList.contains('ptl') || n.classList.contains('tl'))) ? t.clientY : null; }, { passive: true });
      root.addEventListener('touchend', (e) => { const t = e.changedTouches[0]; if (y0 != null && t && t.clientY - y0 > 110 && window.matchMedia('(max-width: 767px)').matches) this.close(); y0 = null; }, { passive: true });
      this._feedFor();
      this._paint();
    }
    // As Apple Home on the iPhone: the whole view folds into its picture, and the picture lands on the tile it came from.
    _morphOut() {
      if (!window.matchMedia('(max-width: 767px)').matches || this._imm) return null;
      const box = this.shadowRoot.querySelector('.vbox');
      let tile = null;
      const walk = (root, d) => {
        if (tile || d > 14) return;
        for (const n of root.querySelectorAll('*')) {
          if (n.classList && n.classList.contains('pv') && n.dataset.id === this._id) {
            const r = n.getBoundingClientRect();
            if (r.width > 40 && r.bottom > 0 && r.top < window.innerHeight) { tile = n; return; }
          }
          if (n.shadowRoot) walk(n.shadowRoot, d + 1);
          if (tile) return;
        }
      };
      walk(document, 0);
      if (!tile || !box) return null;
      const T = tile.getBoundingClientRect(), V = box.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
      if (!V.width || !V.height) return null;
      const rad = parseFloat(getComputedStyle(tile).borderTopLeftRadius) || 20;
      const sc = Math.max(T.width / V.width, T.height / V.height);
      const dx = T.left + T.width / 2 - (V.left + V.width / 2), dy = T.top + T.height / 2 - (V.top + V.height / 2);
      const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)', DUR = 300;
      this.shadowRoot.querySelectorAll('.hdr, .grp, .ptl, .gmenu').forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-out', fill: 'forwards' }));
      box.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${sc})` }], { duration: DUR, easing: EASE, fill: 'forwards' });
      // The last stretch fades the video off the tile, so the tile's own name and age come up under it rather than popping in at the end.
      this.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: DUR, easing: 'ease-in', fill: 'forwards' });
      return this.animate([{ clipPath: `inset(0px 0px 0px 0px round 55px)` }, { clipPath: `inset(${T.top}px ${W - T.right}px ${H - T.bottom}px ${T.left}px round ${rad}px)` }], { duration: DUR, easing: EASE, fill: 'forwards' });
    }
    _show() { return this._clip ? (CAMS.clipOf(this._hass, this._id) || this._id) : this._id; }
    _setImm(on) {
      this._imm = on;
      this.shadowRoot.querySelector('.root').classList.toggle('imm', on);
    }
    _applyMute() {
      const b = this.shadowRoot.querySelector('.grp .mute');
      if (b) b.innerHTML = camSnd(this._muted, 22);
      const v = CAMS.videoIn(this.shadowRoot.querySelector('.vbox'));
      if (v) v.muted = this._muted;
    }
    async _feedFor() {
      const h = this._hass, show = this._show(), box = this.shadowRoot.querySelector('.vbox');
      if (!box) return;
      const tok = this._feedTok = {};
      box.querySelectorAll('.feed, .na').forEach((n) => n.remove());
      box.classList.remove('live');
      const img = box.querySelector('.still');
      if (CAMS.dead(h, show)) {
        img.removeAttribute('src');
        box.insertAdjacentHTML('beforeend', `<span class="na"><b>${esc(CAMS.nameOf(h, this._id))}</b>${esc(T('cameras.unavailable', 'Unavailable'))}</span>`);
        return;
      }
      // The still sets the frame's shape at once, and stays under the stream while it connects.
      img.removeAttribute('src');
      const u = CAMS.still(h, show, Date.now());
      if (u) {
        const im = new Image();
        im.onload = () => { if (this._feedTok !== tok) return; img.src = u; if (im.naturalWidth && im.naturalHeight) box.parentNode.style.setProperty('--r', (im.naturalWidth / im.naturalHeight).toFixed(4)); };
        im.src = u;
      }
      const f = await CAMS.live(h, show);
      if (this._feedTok !== tok) return;
      box.appendChild(f.el);
      this._feed = f;
      const t0 = Date.now();
      const watch = () => {
        if (this._feedTok !== tok) return;
        const v = CAMS.videoIn(f.el);
        if (v && v.videoWidth && v.videoHeight) {
          box.parentNode.style.setProperty('--r', (v.videoWidth / v.videoHeight).toFixed(4));
          f.el.classList.add('on');
          box.classList.add('live');
          // HA's player keeps its own aspect box; filling ours keeps the still from showing round the edges.
          const vr = v.getRootNode();
          if (vr && vr !== document && !vr.getElementById('hemma-fill')) vr.appendChild(Object.assign(document.createElement('style'), { id: 'hemma-fill', textContent: 'video { width: 100% !important; height: 100% !important; max-height: none !important; object-fit: contain; } :host { height: 100%; }' }));
          // A WebRTC stream says plainly whether it carries sound; without any, the sound button has nothing to do.
          const ms = v.srcObject;
          const mb = this.shadowRoot.querySelector('.grp .mute');
          if (mb && ms && ms.getAudioTracks) mb.hidden = !ms.getAudioTracks().length;
        }
        if (Date.now() - t0 < 60000 && !(v && v.videoWidth)) setTimeout(watch, 400);
      };
      watch();
      // The player re-mutes on every update, so the choice is held, not set once; the first frames are caught by rAF so no sound escapes.
      const hold = () => { const v = CAMS.videoIn(f.el); if (v && v.muted !== this._muted) v.muted = this._muted; };
      const t1 = performance.now();
      const early = () => { if (this._feedTok !== tok) return; hold(); if (performance.now() - t1 < 2500) requestAnimationFrame(early); };
      requestAnimationFrame(early);
      clearInterval(this._muteT);
      this._muteT = setInterval(() => { if (this._feedTok !== tok || !this.isConnected) { clearInterval(this._muteT); return; } hold(); }, 400);
    }
    _paint() {
      const h = this._hass, sr = this.shadowRoot, id = this._id;
      if (!h || !sr.querySelector('.hdr')) return;
      sr.querySelector('.hdr b').textContent = CAMS.nameOf(h, id, CAMS.settings());
      sr.querySelector('.hdr small').textContent = CAMS.dead(h, id) ? T('cameras.unavailable', 'Unavailable') : this._clip ? T('cameras.last_clip', 'Last clip') : T('cameras.live', 'Live');
      if (this._feed && this._feed.card) { try { this._feed.card.hass = h; if (this._feed.card._hemmaId && h.states[this._feed.card._hemmaId]) this._feed.card.stateObj = h.states[this._feed.card._hemmaId]; } catch (_) {} }
      this._drawEvents();
    }
    async _loadEvents() {
      const id = this._id;
      const list = await CAMS.events(this._hass, id);
      if (this._id !== id) return;
      this._events = list;
      this._drawEvents();
    }
    _drawEvents() {
      const h = this._hass, ev = this._events, clip = CAMS.clipOf(h, this._id), cs = clip && h.states[clip];
      const pic = cs && cs.attributes.entity_picture;
      const rows = [`<button type="button" class="ev go${this._clip ? '' : ' on'}" data-k="live"><span class="mk lv"><i></i></span><span class="tx"><b>${esc(T('cameras.live', 'Live'))}</b><small>${esc(T('cameras.streaming', 'Streaming'))}</small></span></button>`];
      (ev || []).forEach((e, i) => {
        const go = i === 0 && !!pic;
        const ding = e.kind === 'ding';
        rows.push(`<button type="button" class="ev${go ? ' go' : ''}${go && this._clip ? ' on' : ''}" data-k="${go ? 'clip' : ''}"><span class="mk m" style="--c:${ding ? '#0A84FF' : '#FF9F0A'};--i:url(&quot;${ding ? CAM_BELL : CAM_WALK}&quot;)"><i></i></span>`
          + `<span class="tx"><b>${esc(ding ? T('cameras.doorbell', 'Doorbell') : T('cameras.motion', 'Motion'))}</b><small>${esc(CAMS.time(h, e.at))}</small></span>`
          + (go ? `<span class="th" style="background-image:url('${esc(pic)}')"></span>` : '') + `</button>`);
      });
      if (ev && !ev.length) rows.push(`<div class="ev none">${esc(T('cameras.no_activity', 'No activity today'))}</div>`);
      const html = rows.join('');
      ['.tl', '.ptl'].forEach((sel) => {
        const box = this.shadowRoot.querySelector(sel);
        if (!box || box._html === html) return;
        box._html = html;
        box.innerHTML = html;
        box.querySelectorAll('.ev.go').forEach((b) => { b.onclick = () => {
          const want = b.dataset.k === 'clip';
          if (want === this._clip) return;
          this._clip = want;
          this._feedFor();
          this._paint();
        }; });
      });
    }
  }
  if (!customElements.get('hemma-camera-view')) customElements.define('hemma-camera-view', HemmaCameraView);
  const GEAR_MENU = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/></svg>';

  window.hemmaCameraView = {
    open(id, ids) {
      if (!id) return;
      let v = camHost().querySelector('hemma-camera-view');
      if (!v) v = document.createElement('hemma-camera-view');
      v.open(id, ids);
    },
    openAll(ids) {
      const list = (ids || []).filter(Boolean);
      if (list.length === 1) return this.open(list[0], list);
      if (!list.length) return;
      const cur = camHost().querySelector('hemma-camera-view');
      if (cur) cur.close();
      let p = camHost().querySelector('hemma-camera-page');
      if (!p) p = document.createElement('hemma-camera-page');
      p.open(list);
    },
  };

  // The media popup shows only the controls a player declares; everything else stays behind the gear in HA's own dialog.
  const MF = { PAUSE: 1, SEEK: 2, VOL: 4, MUTE: 8, PREV: 16, NEXT: 32, ON: 128, OFF: 256, SOURCE: 2048, PLAY: 16384 };
  const MD_I = {
    prev: '<svg class="g2" viewBox="0 0 30.91 17.43"><path fill="currentColor" d="M27.653 2.324L27.653 15.105Q27.653 16.964 26.046 16.028L15.085 9.65Q13.478 8.714 15.085 7.779L26.046 1.4Q27.653 0.465 27.653 2.324ZM14.64 2.324L14.64 15.105Q14.64 16.964 13.033 16.028L2.072 9.65Q0.465 8.714 2.072 7.779L13.033 1.4Q14.64 0.465 14.64 2.324Z"/></svg>',
    next: '<svg class="g2" viewBox="0 0 30.91 17.43"><path fill="currentColor" d="M3.253 2.324L3.253 15.105Q3.253 16.964 4.86 16.028L15.822 9.65Q17.429 8.714 15.822 7.779L4.86 1.4Q3.253 0.465 3.253 2.324ZM16.267 2.324L16.267 15.105Q16.267 16.964 17.874 16.028L28.835 9.65Q30.442 8.714 28.835 7.779L17.874 1.4Q16.267 0.465 16.267 2.324Z"/></svg>',
    play: '<svg class="g1" viewBox="0 0 19.6289 19.6992"><path fill="currentColor" d="M2.13281 17.9766C2.13281 19.1367 2.80078 19.6875 3.59766 19.6875C3.94922 19.6875 4.3125 19.5703 4.67578 19.3828L18.3281 11.4023C19.3008 10.8398 19.6289 10.4531 19.6289 9.84375C19.6289 9.22266 19.3008 8.84766 18.3281 8.28516L4.67578 0.304688C4.3125 0.105469 3.94922 0 3.59766 0C2.80078 0 2.13281 0.550781 2.13281 1.71094Z"/></svg>',
    pause: '<svg class="g1" viewBox="0 0 14.6484 19.3945"><path fill="currentColor" d="M1.55859 19.3828L4.23047 19.3828C5.25 19.3828 5.78906 18.8438 5.78906 17.8125L5.78906 1.55859C5.78906 0.480469 5.25 0 4.23047 0L1.55859 0C0.539062 0 0 0.527344 0 1.55859L0 17.8125C0 18.8438 0.539062 19.3828 1.55859 19.3828ZM10.0781 19.3828L12.7383 19.3828C13.7695 19.3828 14.2969 18.8438 14.2969 17.8125L14.2969 1.55859C14.2969 0.480469 13.7695 0 12.7383 0L10.0781 0C9.04688 0 8.50781 0.527344 8.50781 1.55859L8.50781 17.8125C8.50781 18.8438 9.04688 19.3828 10.0781 19.3828Z"/></svg>',
    vlo: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 5V4L8 9z"/></svg>',
    vhi: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4M14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6"/></svg>',
    power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0"/></svg>',
    vdn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 5V4L8 9zm11 2h6v2h-6z"/></svg>',
    b10: '<svg class="g10" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.2 4.3A11.5 11.5 0 1 1 4.4 12"/><path d="M12.6 1.2 9.4 4.6l3.6 2.6"/><text x="15" y="19.6" text-anchor="middle" fill="currentColor" stroke="none" font-size="10.5" font-weight="700" font-family="-apple-system, system-ui, sans-serif">10</text></svg>',
    f10: '<svg class="g10" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.8 4.3A11.5 11.5 0 1 0 25.6 12"/><path d="M17.4 1.2l3.2 3.4-3.6 2.6"/><text x="15" y="19.6" text-anchor="middle" fill="currentColor" stroke="none" font-size="10.5" font-weight="700" font-family="-apple-system, system-ui, sans-serif">10</text></svg>',
    vup: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 5V4L8 9zm13 0h2v2h2v2h-2v2h-2v-2h-2v-2h2z"/></svg>',
  };
  const MD_NOTE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 3v11.6A3.5 3.5 0 1 0 11 18V8h6V3z'/%3E%3C/svg%3E";
  const MD_GAME = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 6h10a5 5 0 0 1 4.9 6l-.9 4.2A2.9 2.9 0 0 1 16 17.3L14.6 16H9.4L8 17.3a2.9 2.9 0 0 1-5-1.1L2.1 12A5 5 0 0 1 7 6m0 3v1.5H5.5V12H7v1.5h1.5V12H10v-1.5H8.5V9zm9.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2'/%3E%3C/svg%3E";
  const MEDIA_CSS = `
    .med .slab { display: flex; flex-direction: column; gap: 14px; align-self: stretch; box-sizing: border-box; margin: 22px 0 0; padding: 20px; border-radius: 30px; background: rgba(0,0,0,0.3); }
    @media (max-width: 768px) { .med .slab { margin: 26px var(--slab-x, 11px) 0; border-radius: 36px; } .wrap.med:has(.slab) { padding-bottom: calc(max(20px, var(--sab, 0px)) + 72px); } }
    .med .slab.bare { background: none; padding: 0; gap: 0; }
    @media (min-width: 769px) { .wrap.med { padding-bottom: 60px; } }
    .art { align-self: center; position: relative; flex: none; max-width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px -12px rgba(0,0,0,0.7); }
    .art img { display: block; height: 220px; width: auto; max-width: 100%; object-fit: cover; }
    @media (max-width: 767px) { .med .art img { height: min(296px, 36svh); } .med .art.ph { width: min(296px, 36svh); height: min(296px, 36svh); } }
    .art.ph { width: 200px; height: 200px; display: grid; place-items: center; background: rgba(255,255,255,0.08); box-shadow: none; }
    .art.ph i { width: 56px; height: 56px; opacity: .4; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .trk { display: grid; gap: 1px; min-width: 0; }
    .trk b { font-size: 17px; font-weight: 600; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .trk span { font-size: 14.5px; color: rgba(235,235,245,0.62); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .trk.quiet b { color: rgba(235,235,245,0.6); }
    .sc { display: flex; align-items: center; gap: 10px; font-size: 12px; color: rgba(235,235,245,0.6); font-variant-numeric: tabular-nums; }
    .sc span { flex: none; min-width: 32px; } .sc span:last-child { text-align: right; }
    .bar { position: relative; flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.2); overflow: hidden; }
    .bar.live { touch-action: none; cursor: pointer; }
    .bar > i { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255,255,255,0.9); border-radius: inherit; }
    .tp { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; }
    .tp button { border: 0; background: none; color: #fff; padding: 4px; cursor: pointer; display: grid; place-items: center; -webkit-tap-highlight-color: transparent; transition: opacity .2s ease; }
    .tp button { width: 52px; height: 52px; }
    .tp button svg { display: block; width: auto; height: 20px; }
    .tp button.pp svg { height: 30px; }
    .tp button svg.g10 { height: 32px; width: 32px; }
    .tp button:disabled { opacity: .3; cursor: default; }
    @media (hover: hover) { .tp button:not(:disabled):hover { opacity: .75; } }
    .vb { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .vb button { height: 40px; border: 0; border-radius: 20px; background: rgba(255,255,255,0.12); color: #fff; display: grid; place-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .vb svg { width: 19px; height: 19px; }
    @media (hover: hover) { .vb button:hover { background: rgba(255,255,255,0.18); } }
    .vb button:active { background: rgba(255,255,255,0.24); }
    .vs { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.7); }
    .vs svg { width: 17px; height: 17px; flex: none; }
    .vs .bar { height: 8px; border-radius: 4px; touch-action: none; cursor: pointer; }
    .pw { align-self: center; width: 88px; height: 88px; border-radius: 50%; border: 0; color: #fff; display: grid; place-items: center; cursor: pointer; flex: none; margin-top: 6px;
      background: rgba(255,255,255,0.14); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); transition: background-color .3s ease, color .3s ease; -webkit-tap-highlight-color: transparent; }
    .pw.on { background: #fff; color: #1c1c1e; }
    .pw svg { width: 38px; height: 38px; }
    .wheel { --row: 32px; position: relative; align-self: stretch; height: calc(var(--row) * 5); margin-top: 20px; overflow-y: auto; scroll-snap-type: y mandatory; overscroll-behavior: contain; scrollbar-width: none; touch-action: pan-y;
      -webkit-mask: linear-gradient(transparent, #000 32%, #000 68%, transparent); mask: linear-gradient(transparent, #000 32%, #000 68%, transparent); }
    .wheel::-webkit-scrollbar { display: none; }
    .wheel .pad { height: calc(var(--row) * 2); }
    .wheel button { display: block; margin: 0 auto; height: var(--row); border: 0; background: none; color: rgba(235,235,245,0.45); font: inherit; font-size: 16px; font-weight: 600; padding: 0 18px;
      border-radius: 16px; scroll-snap-align: center; cursor: pointer; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; transition: color .2s ease, background-color .2s ease; -webkit-tap-highlight-color: transparent; }
    .wheel button.on { color: #fff; background: rgba(255,255,255,0.12); }
    .none { font-size: 14px; color: rgba(235,235,245,0.6); text-align: center; padding: 8px 0; }
    .glow { display: none; }
    .trk .dev { display: none; }
    /* On the Mac and iPad the popup is already glass, so the artwork washes its top instead of sitting in a second panel. */
    @media (min-width: 769px) {
      .wrap.med.wash { padding-top: 40px; }
      .wrap.med.wash .slab { position: relative; z-index: 1; background: none; padding: 0 4px; margin: 0; border-radius: 0; gap: 13px; }
      .wrap.med.wash .glow { display: block; position: absolute; left: 0; right: 0; top: 0; height: 320px; overflow: hidden; pointer-events: none;
        -webkit-mask-image: linear-gradient(#000 40%, transparent); mask-image: linear-gradient(#000 40%, transparent); }
      .glow i { position: absolute; inset: -40px; background: var(--art) center / cover no-repeat; filter: blur(34px) saturate(1.4); opacity: .8; transform: scale(1.15); }
      .wrap.med.wash .art img { height: 200px; }
      .wrap.med.wash .trk .dev { display: inline; }
      .wrap.med.wash .det { background: rgba(255,255,255,0.07); border-radius: 14px; padding: 0 14px; }
    }
    .det { display: grid; }
    .gs { display: flex; gap: 16px; align-items: flex-start; }
    .gsart { flex: none; width: 42%; aspect-ratio: 2 / 3; border-radius: 12px; background: rgba(255,255,255,0.08) center / cover no-repeat; box-shadow: 0 18px 36px -16px rgba(0,0,0,0.8); }
    .gsx { min-width: 0; display: grid; gap: 2px; padding-top: 4px; }
    .gst { font-size: 20px; font-weight: 700; line-height: 1.15; }
    .gsnow { font-size: 14px; color: rgba(255,255,255,0.72); }
    .gslab { margin-top: 12px; font-size: 13px; color: rgba(255,255,255,0.55); }
    .gstot { font-size: 26px; font-weight: 700; letter-spacing: -0.01em; }
    .gach[hidden], .gslab[hidden] { display: none; }
    .gacht { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .gacht span:last-child { color: rgba(255,255,255,0.7); font-weight: 500; }
    .gbar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.18); overflow: hidden; }
    .gbar i { display: block; height: 100%; border-radius: 3px; background: #fff; transition: width .5s ease; }
    .gsav { width: 20px; height: 20px; border-radius: 50%; vertical-align: -5px; margin-right: 7px; }
    .det div { display: flex; justify-content: space-between; gap: 12px; min-height: 36px; align-items: center; font-size: 14px; position: relative; }
    .det div + div::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: .5px; background: rgba(255,255,255,0.12); }
    .det span { color: rgba(235,235,245,0.6); flex: none; }
    .det b { font-weight: 500; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `;
  class HemmaMediaPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._sig = null; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; this._render(); }
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
    connectedCallback() { clearInterval(this._tick); this._tick = setInterval(() => this._progress(), 1000); }
    disconnectedCallback() { clearInterval(this._tick); }
    _st() { return this._hass && this._hass.states[this._config.entity]; }
    // A Plex stream sensor's details live on its Tautulli session twin.
    _tau() {
      const S = this._hass.states, id = this._config.entity || '';
      const twin = id.replace(/^(sensor\.)plex_stream_(\d+)$/, '$1plex_session_$2_tautulli');
      return (twin !== id && S[twin]) || S[id];
    }
    _f(bit) { const s = this._st(); return !!s && (Number(s.attributes.supported_features) & bit) === bit; }
    _call(svc, data) { return this._hass.callService('media_player', svc, Object.assign({ entity_id: this._config.entity }, data || {})).catch(() => {}); }
    _name() { const s = this._st(), n = String(this._config.name || '').trim(); return (n && n.indexOf('<') < 0 && n) || (s && s.attributes.friendly_name) || this._config.entity; }
    _sources() {
      const all = [...new Set(((this._st() || {}).attributes || {}).source_list || [])].map(String);
      const pick = Array.isArray(this._config.sources) ? this._config.sources.map(String).filter((x) => all.includes(x)) : [];
      return pick.length ? pick : all;
    }
    // A Steam session, with the game's id to fetch its art by.
    _steam() {
      const src = this._config.src || {}, st = this._hass && this._hass.states['sensor.steam'];
      if (this._config.kind !== 'activity' || !st) return null;
      if (!(src.key === 'steam' || /steam/i.test(String(src.source || '') + ' ' + String(src.entity || '')))) return null;
      return st.attributes.game_id ? st : null;
    }
    _tv() { const s = this._st(), a = (s && s.attributes) || {}; return a.device_class === 'tv' || /(^|_)(tv|apple_tv|shield)/.test(this._config.entity) || (a.source_list || []).length >= 3; }
    _mode(s) {
      if (this._config.kind === 'plex') return s && ['playing', 'paused', 'buffering'].includes(s.state) ? 'plex' : 'gone';
      if (this._config.kind === 'activity') return 'activity';
      if (!s || s.state === 'unavailable' || s.state === 'unknown') return 'gone';
      const a = s.attributes;
      if (['playing', 'paused'].includes(s.state) && (a.media_title || a.media_artist || a.entity_picture || a.app_name)) return 'media';
      if (s.state === 'off' || s.state === 'standby') return this._tv() ? 'tv' : 'quiet';
      return this._tv() ? 'tv' : 'quiet';
    }
    _render() {
      const s = this._st();
      if (!this._config || !this._hass) return;
      const mode = this._mode(s), a = (s && s.attributes) || {};
      const sig = [mode, Number(a.supported_features), (a.source_list || []).join('|'), (this._config.sources || []).join('|'), !!a.media_duration, Number.isFinite(Number(a.volume_level)) && a.volume_level != null].join('#');
      if (sig !== this._sig) { this._sig = sig; this._build(mode); }
      this._paint();
    }
    _video() {
      const a = (this._st() || {}).attributes || {};
      return this._f(MF.SEEK) && Number(a.media_duration) > 0 && (/^(video|movie|tvshow|episode|channel)$/i.test(String(a.media_content_type || '')) || !/music|spotify|podcast|radio/i.test(String(a.app_name || '') + ' ' + String(a.media_content_type || '')));
    }
    _pos() {
      const a = (this._st() || {}).attributes || {};
      let p = Number(a.media_position) || 0;
      if (this._st().state === 'playing' && a.media_position_updated_at) p += (Date.now() - Date.parse(a.media_position_updated_at)) / 1000;
      return p;
    }
    _skip(d) {
      const a = (this._st() || {}).attributes || {}, dur = Number(a.media_duration) || 0;
      const to = Math.max(0, Math.min(dur || Infinity, this._pos() + d));
      this._seekHold = { at: Date.now(), pos: to };
      this._progress();
      this._call('media_seek', { seek_position: Math.round(to) });
    }
    _transport() {
      const f = (b) => this._f(b);
      if (this._video()) {
        return `<div class="tp"><button type="button" class="back10" aria-label="${esc(T('media.back_10', 'Back 10 seconds'))}">${MD_I.b10}</button>`
          + `<button type="button" class="pp"></button><button type="button" class="fwd10" aria-label="${esc(T('media.forward_10', 'Forward 10 seconds'))}">${MD_I.f10}</button></div>`;
      }
      return `<div class="tp"><button type="button" class="prev" aria-label="${esc(T('media.previous', 'Previous'))}"${f(MF.PREV) ? '' : ' disabled'}>${MD_I.prev}</button>`
        + `<button type="button" class="pp"></button><button type="button" class="next" aria-label="${esc(T('media.next', 'Next'))}"${f(MF.NEXT) ? '' : ' disabled'}>${MD_I.next}</button></div>`;
    }
    _build(mode) {
      const root = this.shadowRoot, f = (b) => this._f(b), a = (this._st() || {}).attributes || {};
      const step = f(MF.VOL) || f(1024);
      // A player that claims volume_set but never reports a level (Apple TV) ignores the slider; it gets the step buttons.
      const level = f(MF.VOL) && a.volume_level != null && Number.isFinite(Number(a.volume_level));
      let body = '', bare = false;
      if (mode === 'gone') body = `<div class="none">${esc(T('media.nothing_playing', 'Nothing playing'))}</div>`;
      else if (mode === 'plex') {
        body = `<div class="art cover"></div><div class="trk"><b></b><span></span></div>`
          + `<div class="sc"><span class="t0"></span><div class="bar seek"><i></i></div><span class="t1"></span></div><div class="det"></div>`;
      } else if (mode === 'activity' && this._steam()) {
        // Steam's own look: box art beside the totals, achievement progress, then the session.
        body = `<div class="gs"><span class="gsart"></span><div class="gsx"><b class="gst"></b><span class="gsnow"></span><small class="gslab">${esc(T('media.total', 'Total'))}</small><strong class="gstot"></strong></div></div>`
          + `<div class="gach"><div class="gacht"><span>${esc(T('media.achievements', 'Achievements'))}</span><span class="gachn"></span></div><div class="gbar"><i></i></div></div><div class="det"></div>`;
      } else if (mode === 'activity') {
        body = `<div class="art cover"></div><div class="trk"><b></b><span></span></div><div class="det"></div>`;
      } else if (mode === 'tv') {
        bare = true;
        const list = f(MF.SOURCE) ? this._sources() : [];
        body = (f(MF.ON) || f(MF.OFF) ? `<button type="button" class="pw" aria-label="${esc(T('media.power', 'Power'))}">${MD_I.power}</button>` : '')
          + (list.length ? `<div class="wheel"><div class="pad"></div>${list.map((x) => `<button type="button" data-src="${esc(x)}">${esc(x)}</button>`).join('')}<div class="pad"></div></div>` : '');
        if (!body) { bare = false; body = `<div class="none">${esc(T('media.nothing_playing', 'Nothing playing'))}</div>`; }
      } else if (mode === 'quiet') {
        body = `<div class="art ph"><i style="--i:url(&quot;${MD_NOTE}&quot;)"></i></div><div class="trk quiet"><b>${esc(T('media.not_playing', 'Not Playing'))}</b></div>`
          + this._transport()
          + (level ? `<div class="vs">${MD_I.vlo}<div class="bar level" role="slider" aria-label="${esc(T('media.volume', 'Volume'))}"><i></i></div>${MD_I.vhi}</div>` : '');
      } else {
        body = `<div class="art cover"></div><div class="trk"><b></b><span></span></div>`
          + `<div class="sc"><span class="t0"></span><div class="bar seek${f(MF.SEEK) && a.media_duration ? ' live' : ''}"><i></i></div><span class="t1"></span></div>`
          + this._transport()
          + (level ? `<div class="vs">${MD_I.vlo}<div class="bar level" role="slider" aria-label="${esc(T('media.volume', 'Volume'))}"><i></i></div>${MD_I.vhi}</div>`
            : step ? `<div class="vb"><button type="button" class="vdn" aria-label="${esc(T('media.volume_down', 'Volume down'))}">${MD_I.vdn}</button><button type="button" class="vup" aria-label="${esc(T('media.volume_up', 'Volume up'))}">${MD_I.vup}</button></div>` : '');
      }
      const hero = mode === 'media' || mode === 'plex' || mode === 'activity';
      root.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${SLAB_CSS}${MEDIA_CSS}${BIG_CSS}</style><div class="wrap multi lst med${hero ? ' wash' : ''}">${hero ? '<div class="glow"><i></i></div>' : ''}<div class="hd"><b></b><span></span></div><div class="slab${bare ? ' bare' : ''}">${body}</div>`
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button></div>`;
      this._bind(root);
    }
    _bind(root) {
      const q = (sel) => root.querySelector(sel), id = this._config.entity;
      q('.gear').onclick = () => moreInfo(this, id);
      const pw = q('.pw');
      if (pw) pw.onclick = () => { const on = !this._isOff(); pw.classList.toggle('on', !on); this._call(on ? 'turn_off' : 'turn_on'); };
      const wheel = q('.wheel');
      if (wheel) {
        const pick = async (b) => {
          wheel.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
          this._srcHold = { src: b.dataset.src, until: Date.now() + 4000 };
          try { localStorage.setItem('hemma_src:' + this._config.entity, b.dataset.src); } catch (e) {}
          if (this._isOff() && this._f(MF.ON)) await this._call('turn_on');
          this._call('select_source', { source: b.dataset.src });
        };
        wheel.querySelectorAll('button').forEach((b) => { b.onclick = () => { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); pick(b); }; });
        requestAnimationFrame(() => this._center(false));
      }
      const pp = q('.pp');
      if (pp) pp.onclick = () => this._call(this._st().state === 'playing' ? (this._f(MF.PAUSE) ? 'media_pause' : 'media_stop') : 'media_play');
      const b10 = q('.back10'), f10 = q('.fwd10');
      if (b10) b10.onclick = () => this._skip(-10);
      if (f10) f10.onclick = () => this._skip(10);
      const prev = q('.prev'), next = q('.next');
      if (prev) prev.onclick = () => this._call('media_previous_track');
      if (next) next.onclick = () => this._call('media_next_track');
      const vdn = q('.vdn'), vup = q('.vup');
      if (vdn) vdn.onclick = () => this._call('volume_down');
      if (vup) vup.onclick = () => this._call('volume_up');
      const drag = (bar, set) => {
        if (!bar) return;
        const at = (e) => { const r = bar.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
        bar.addEventListener('pointerdown', (e) => { try { bar.setPointerCapture(e.pointerId); } catch (_) {} bar._drag = true; set(at(e), false); });
        bar.addEventListener('pointermove', (e) => { if (bar._drag) set(at(e), false); });
        bar.addEventListener('pointerup', (e) => { if (!bar._drag) return; bar._drag = false; set(at(e), true); });
        bar.addEventListener('pointercancel', () => { bar._drag = false; });
      };
      drag(q('.level'), (v, done) => {
        q('.level > i').style.width = (v * 100) + '%';
        this._volHold = Date.now() + 2500;
        clearTimeout(this._vt);
        this._vt = setTimeout(() => this._call('volume_set', { volume_level: Math.round(v * 100) / 100 }), done ? 0 : 150);
      });
      if (this._f(MF.SEEK)) drag(q('.seek'), (v, done) => {
        const d = Number(this._st().attributes.media_duration) || 0;
        this._seekHold = { at: Date.now(), pos: v * d };
        this._progress();
        if (done && d) this._call('media_seek', { seek_position: Math.round(v * d) });
      });
    }
    _isOff() { const s = this._st(); return !s || s.state === 'off' || s.state === 'standby'; }
    _center(smooth) {
      const wheel = this.shadowRoot.querySelector('.wheel'), on = wheel && wheel.querySelector('button.on');
      if (!on) return;
      wheel.scrollTo({ top: on.offsetTop - wheel.clientHeight / 2 + on.offsetHeight / 2, behavior: smooth ? 'smooth' : 'auto' });
    }
    _fmt(sec) { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); }
    _progress() {
      const s = this._st(), root = this.shadowRoot, seek = root && root.querySelector('.seek > i');
      if (!s || !seek) return;
      let a = s.attributes, d = Number(a.media_duration) || 0;
      let pos = Number(a.media_position) || 0;
      if (this._config.kind === 'plex') {
        const t = this._tau(), ta = (t && t.attributes) || {};
        const secs = (x) => String(x || '').split(':').reduce((n, v) => n * 60 + (Number(v) || 0), 0);
        d = secs(ta.stream_duration || ta.duration);
        pos = Math.max(0, d - secs(ta.stream_remaining));
        if (t && t.state === 'playing' && t.last_updated) pos += (Date.now() - Date.parse(t.last_updated)) / 1000;
      } else if (s.state === 'playing' && a.media_position_updated_at) pos += (Date.now() - Date.parse(a.media_position_updated_at)) / 1000;
      if (this._seekHold && Date.now() - this._seekHold.at < 3000) pos = this._seekHold.pos;
      pos = Math.min(pos, d || pos);
      seek.style.width = d ? (pos / d * 100) + '%' : '0';
      // With no duration the bar stays, empty, as Apple Home's does.
      root.querySelector('.t0').textContent = d ? this._fmt(pos) : '–:––';
      root.querySelector('.t1').textContent = d ? '-' + this._fmt(d - pos) : '–:––';
    }
    _paint() {
      const s = this._st(), root = this.shadowRoot, q = (sel) => root.querySelector(sel);
      if (!q('.hd')) return;
      const a = (s && s.attributes) || {}, mode = this._mode(s);
      const state = s ? (this._hass.formatEntityState ? this._hass.formatEntityState(s) : s.state) : '';
      const src = this._config.src || {}, ta = mode === 'plex' ? ((this._tau() || {}).attributes || {}) : null;
      q('.hd b').textContent = mode === 'plex' ? 'Plex' : mode === 'activity' ? (src.source || this._name()) : this._name();
      q('.hd span').textContent = mode === 'quiet' ? T('media.not_playing', 'Not Playing')
        : mode === 'plex' ? [ta.state === 'paused' ? T('media.paused', 'Paused') : T('media.playing', 'Playing'), ta.player].filter(Boolean).join(' · ')
        : mode === 'activity' ? T('media.playing', 'Playing') : state;
      if (mode === 'plex' || mode === 'activity') { this._paintSession(mode, src, ta); return; }
      const pw = q('.pw');
      if (pw) pw.classList.toggle('on', !this._isOff());
      const wheel = q('.wheel');
      if (wheel) {
        // A TV switched off reports no input, so the picker shows the last one it was on, as Apple Home does.
        const key = 'hemma_src:' + this._config.entity;
        if (a.source && !this._isOff()) { try { localStorage.setItem(key, a.source); } catch (e) {} }
        let last = null;
        try { last = localStorage.getItem(key); } catch (e) {}
        const held = this._srcHold && Date.now() < this._srcHold.until ? this._srcHold.src : null, cur = held || a.source || last || (a.source_list || [])[0];
        let moved = false;
        wheel.querySelectorAll('button').forEach((b) => { const on = b.dataset.src === cur; if (on !== b.classList.contains('on')) moved = moved || on; b.classList.toggle('on', on); });
        if (moved && !held) this._center(true);
      }
      const art = q('.art.cover');
      if (art) {
        // The Apple TV sends no picture for YouTube; the YouTube sensor the tile reads does.
        const yt = /youtube/i.test(String(a.app_name || '')) && this._hass.states['sensor.youtube_watching'];
        const ytPic = yt && (yt.attributes.thumbnail || yt.state);
        const raw = (ytPic && String(ytPic).match(/^(\/|http)/) ? ytPic : '') || a.entity_picture || '';
        const pic = raw ? (raw.startsWith('/') && this._hass.hassUrl ? this._hass.hassUrl(raw) : raw) : '';
        this._setArt(art, pic);
        const sub = [a.media_artist, a.media_series_title, a.media_album_name, a.app_name].find((x) => x && x !== a.media_title);
        q('.trk b').textContent = a.media_title || a.app_name || this._name();
        this._sub(sub || (a.media_title ? T('media.playing_on', 'On {name}', { name: this._name() }) : state), sub ? ' · ' + this._name() : '');
        this._glow(pic === this._artFailed ? '' : pic);
      }
      const pp = q('.pp');
      if (pp) {
        const playing = !!s && s.state === 'playing', live = mode === 'media';
        pp.innerHTML = playing ? MD_I.pause : MD_I.play;
        pp.setAttribute('aria-label', playing ? T('media.pause', 'Pause') : T('media.play', 'Play'));
        pp.disabled = !live || !(playing ? (this._f(MF.PAUSE) || this._f(4096)) : (this._f(MF.PLAY) || this._f(MF.PAUSE)));
        if (!live) root.querySelectorAll('.prev, .next').forEach((b) => { b.disabled = true; });
      }
      const lv = q('.level > i');
      if (lv && !(q('.level')._drag) && !(this._volHold && Date.now() < this._volHold)) lv.style.width = ((Number(a.volume_level) || 0) * 100) + '%';
      this._progress();
    }
    _paintSession(mode, src, ta) {
      const root = this.shadowRoot, q = (sel) => root.querySelector(sel), art = q('.art.cover');
      const abs = (u) => (u && u.startsWith('/') && this._hass.hassUrl ? this._hass.hassUrl(u) : u);
      const pic = abs(mode === 'plex' ? (ta.image_url || src.art) : src.art);
      this._setArt(art, pic);
      if (mode === 'activity' && this._steam()) {
        const st = this._steam(), sa = st.attributes, S = this._hass.states, id = String(sa.game_id);
        const num = (k) => { const v = S[k] && Number(S[k].state); return Number.isFinite(v) ? v : null; };
        const same = S['sensor.steam_stats_app'] && String(S['sensor.steam_stats_app'].state) === id;
        const art = q('.gsart');
        const url = `https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(id)}/library_600x900.jpg`;
        if (art._u !== url) { art._u = url; art.style.backgroundImage = `url("${url}"), url("${sa.game_image_main || ''}")`; }
        this._glow(url);
        q('.gst').textContent = src.title || sa.game || this._name();
        const mins = src.started ? Math.max(1, Math.round((Date.now() - src.started) / 60000)) : 0;
        q('.gsnow').textContent = mins ? T('media.playing_for_n', 'Playing for {t}', { t: mins < 60 ? T('media.n_min', '{n} min', { n: mins }) : T('media.n_h_m', '{h} h {m} min', { h: Math.floor(mins / 60), m: mins % 60 }) }) : T('media.playing', 'Playing');
        const total = same ? num('sensor.steam_playtime') : null;
        q('.gslab').hidden = total == null;
        q('.gstot').textContent = total == null ? '' : (total >= 60 ? T('media.n_h', '{n} h', { n: Math.round(total / 60) }) : T('media.n_min', '{n} min', { n: total }));
        const got = num('sensor.steam_achievements_unlocked'), all = num('sensor.steam_achievements_total');
        const hasAch = got != null && all;
        q('.gach').hidden = !hasAch;
        if (hasAch) {
          q('.gachn').textContent = T('media.n_of_m', '{n} of {m}', { n: got, m: all });
          q('.gbar i').style.width = (got / all * 100).toFixed(1) + '%';
        }
        const lang = (this._hass.locale && this._hass.locale.language) || undefined;
        const lastA = S['sensor.steam_achievement_last'] && S['sensor.steam_achievement_last'].state;
        const rows = [
          [T('media.last_unlocked', 'Last unlocked'), hasAch && lastA && !/^(unknown|unavailable|none)$/i.test(lastA) ? lastA : ''],
          [T('media.started', 'Started'), src.started ? new Date(src.started).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }) : ''],
          [T('media.player', 'Player'), [String(sa.real_name || '').split(' ')[0], sa.level != null ? T('media.level_n', 'Level {n}', { n: sa.level }) : ''].filter(Boolean).join(' · ')],
        ].filter((r) => r[1]);
        const av = st.attributes.entity_picture;
        const html = rows.map((r, i) => `<div><span>${esc(r[0])}</span><b>${i === rows.length - 1 && av ? `<img class="gsav" src="${esc(av)}" alt="">` : ''}${esc(r[1])}</b></div>`).join('');
        const det = q('.det');
        if (det.innerHTML !== html) det.innerHTML = html;
        return;
      }
      if (mode === 'activity') {
        // Only what the source reports: Steam and Discord carry no playtime totals or achievements, so their rows simply do not appear.
        q('.trk b').textContent = src.title || this._name();
        const where = src.source || this._name();
        q('.trk span').textContent = src.subtitle ? src.subtitle : where;
        this._glow(pic === this._artFailed ? '' : pic);
        const mins = src.started ? Math.max(1, Math.round((Date.now() - src.started) / 60000)) : 0;
        const lang = (this._hass.locale && this._hass.locale.language) || undefined;
        const rows = [
          [T('media.playing_on_label', 'Playing on'), src.subtitle ? where : ''],
          [T('media.playing_for', 'Playing for'), mins ? (mins < 60 ? T('media.n_min', '{n} min', { n: mins }) : T('media.n_h_m', '{h} h {m} min', { h: Math.floor(mins / 60), m: mins % 60 })) : ''],
          [T('media.started', 'Started'), src.started ? new Date(src.started).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }) : ''],
          [T('media.trophies', 'Trophies'), src.trophies != null && src.trophies !== '' ? String(src.trophies) : ''],
        ].filter((r) => r[1]);
        const html = rows.map((r) => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('');
        const det = q('.det');
        if (det && det.innerHTML !== html) det.innerHTML = html;
        return;
      }
      const ep = ta.media_type === 'episode';
      q('.trk b').textContent = (ep ? ta.title : null) || ta.title || ta.full_title || src.title || '';
      this._sub(ep ? [ta.grandparent_title, ta.parent_media_index && ta.media_index ? 'S' + ta.parent_media_index + ' · E' + ta.media_index : ''].filter(Boolean).join(' · ') : [ta.year, ta.library_name].filter(Boolean).join(' · '),
        ta.player ? ' · ' + T('media.playing_on', 'On {name}', { name: ta.player }) : '');
      this._glow(pic === this._artFailed ? '' : pic);
      const cap = (x) => String(x || '').replace(/\b\w/g, (c) => c.toUpperCase());
      const rows = [
        [T('media.watching', 'Watching'), ta.user_friendly_name || ta.user],
        [T('media.device', 'Device'), [ta.player, ta.platform].filter(Boolean).join(' · ')],
        [T('media.quality', 'Quality'), [ta.stream_video_full_resolution || ta.video_full_resolution, cap(ta.transcode_decision)].filter(Boolean).join(' · ')],
        [T('media.audio', 'Audio'), [String(ta.stream_audio_codec || ta.audio_codec || '').toUpperCase(), ta.stream_audio_channel_layout].filter(Boolean).join(' ')],
        [T('media.bandwidth', 'Bandwidth'), Number(ta.bandwidth) ? (Number(ta.bandwidth) / 1000).toFixed(1) + ' Mbps' : ''],
        [T('media.connection', 'Connection'), ta.local === 1 || ta.local === '1' ? T('media.local', 'Local') : [T('media.remote', 'Remote'), ta.geo_city].filter(Boolean).join(' · ')],
      ].filter((r) => r[1]);
      const html = rows.map((r) => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('');
      const det = q('.det');
      if (det.innerHTML !== html) det.innerHTML = html;
      this._progress();
    }
    _sub(text, dev) {
      const span = this.shadowRoot.querySelector('.trk span');
      span.textContent = text;
      if (dev) { const d = document.createElement('i'); d.className = 'dev'; d.style.fontStyle = 'normal'; d.textContent = dev; span.appendChild(d); }
    }
    _glow(pic) {
      const g = this.shadowRoot.querySelector('.glow i');
      if (g) g.style.setProperty('--art', pic ? `url("${String(pic).replace(/"/g, '%22')}")` : 'none');
    }
    // An image that failed stays failed until its address changes; retrying it on every update made the cover flicker.
    _setArt(art, pic) {
      if (!art) return;
      let img = art.querySelector('img');
      if (!pic || pic === this._artFailed) { if (img) img.remove(); this._placeholder(art); return; }
      const ph = art.querySelector('i'); if (ph) ph.remove(); art.classList.remove('ph');
      if (!img) { img = document.createElement('img'); img.alt = ''; art.appendChild(img); }
      img.onerror = () => { this._artFailed = img.getAttribute('src'); img.remove(); this._placeholder(art); this._glow(''); };
      if (img.getAttribute('src') !== pic) img.src = pic;
    }
    _placeholder(art) {
      if (art.querySelector('i')) return;
      art.classList.add('ph');
      art.innerHTML = this._config.kind === 'activity' ? `<i style="--i:url(&quot;${MD_GAME}&quot;)"></i>` : this._tv() ? `<i style="--i:url('${esc(iconUrl('tv'))}')"></i>` : `<i style="--i:url(&quot;${MD_NOTE}&quot;)"></i>`;
    }
  }
  if (!customElements.get('hemma-media-panel')) customElements.define('hemma-media-panel', HemmaMediaPanel);

  const ACT_ON = ['on', 'open', 'opening', 'unlocked', 'unlocking', 'playing', 'buffering', 'home', 'connected', 'online', 'cooling', 'heating', 'cleaning', 'running', 'active'];
  const ACT_CSS = `
    .acts-wrap .ctl, .acts-wrap .run, .acts-wrap .orb { margin: 26px 0 0; }
    .acts-wrap .ctl.white .fill { background: #fff; }
    .acts-wrap .ctl.white .glyph { background: rgba(0,0,0,0.78); }
    .acts-wrap .ctl.white.closed .glyph { background: rgba(255,255,255,0.55); }
    .run, .orb { flex: none; width: 112px; height: 112px; border-radius: 50%; border: 0; padding: 0; margin: auto 0 0; display: grid; place-items: center; cursor: pointer; background: rgba(0,0,0,0.24); transition: background-color .3s ease, filter .4s ease; -webkit-tap-highlight-color: transparent; }
    .run i, .orb i { width: 44px; height: 44px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .orb ha-icon, .run ha-icon { --mdc-icon-size: 44px; color: #fff; }
    .orb.on, .run.on { background: var(--hemma-color-teal, #00C3D0); }
    .run:active { filter: brightness(0.84); }
    .btns { flex: none; display: flex; gap: 24px; justify-content: center; margin: 24px 0 66px; }
    .btn { width: 84px; border: 0; background: none; padding: 0; color: #fff; font: inherit; display: grid; justify-items: center; align-content: start; gap: 7px; text-align: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .btn > span { position: relative; width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,0.24); transition: background-color .3s ease, filter .4s ease; }
    .btn.on > span { background: var(--act-on, var(--hemma-color-teal, #00C3D0)); }
    .btn.dead { opacity: 0.45; }
    .btn i { width: 22px; height: 22px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .btn ha-icon { --mdc-icon-size: 22px; color: #fff; }
    .knob ha-icon { --mdc-icon-size: 26px; color: #fff; }
    .bare .btn b { display: none; }
    .btn b { font-size: 12.5px; font-weight: 600; line-height: 1.25; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
    @media (hover: hover) { .btn:hover > span, .orb:hover, .run:hover { filter: brightness(0.84); transition: filter .18s ease, background-color .3s ease; } }
    @media (max-width: 768px) { .btns { margin-bottom: 80px; } }
  `;
  class HemmaActionsPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    requestUpdate() { if (this._built && this.isConnected) this._paint(); }
    connectedCallback() { if (window.hemmaIconCardSeen) window.hemmaIconCardSeen(this); }
    hemmaHero() {
      const r = this.shadowRoot, ctl = r.querySelector('.ctl'), one = r.querySelector('.run, .orb');
      if (ctl) return { el: ctl, icon: ctl.querySelector('.glyph, .knob i'), fill: ctl.querySelector('.fill, .knob') };
      return one ? { el: one, icon: one.querySelector('i, ha-icon') } : null;
    }
    _st(id) { return this._hass.states[id || this._config.entity]; }
    _fmt(st) { return st ? (this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state) : ''; }
    _kind() {
      const st = this._st(), eid = this._config.entity || '', d = eid.split('.')[0], a = (st && st.attributes) || {}, f = Number(a.supported_features) || 0;
      if (d === 'media_player' && (f & 4)) return { type: 'slider', white: true, get: (s) => ['off', 'standby', 'unavailable'].includes(s.state) ? 0 : Math.round((Number(s.attributes.volume_level) || 0) * 100),
        set: (v) => ['media_player', 'volume_set', { volume_level: v / 100 }], tap: () => ['media_player', (f & 1) ? 'media_play_pause' : 'toggle', {}] };
      if (d === 'light') {
        const m = a.supported_color_modes || [];
        if (m.length && !(m.length === 1 && m[0] === 'onoff')) return { type: 'slider', light: true, get: (s) => s.state === 'on' ? Math.max(1, Math.round((Number(s.attributes.brightness) || 0) / 2.55)) : 0,
          min: 1, set: (v) => ['light', 'turn_on', { brightness_pct: v }], tap: () => ['light', 'toggle', {}] };
      }
      if (d === 'fan' && (f & 1)) return { type: 'slider', get: (s) => s.state === 'on' ? Number(s.attributes.percentage) || 0 : 0,
        set: (v) => v ? ['fan', 'set_percentage', { percentage: v }] : ['fan', 'turn_off', {}], tap: () => ['fan', 'toggle', {}] };
      if (d === 'cover' && (f & 4)) return { type: 'slider', get: (s) => Number(s.attributes.current_position) || 0,
        set: (v) => ['cover', 'set_cover_position', { position: v }], tap: () => ['cover', 'toggle', {}] };
      if (d === 'lock') return { type: 'switch', on: (s) => ['unlocked', 'unlocking', 'open'].includes(s.state), tap: (s) => ['lock', ['unlocked', 'open'].includes(s.state) ? 'lock' : 'unlock', {}] };
      if (['light', 'fan', 'cover', 'switch', 'input_boolean', 'automation', 'siren', 'humidifier', 'remote', 'media_player'].includes(d))
        return { type: 'switch', on: (s) => ACT_ON.includes(String(s.state).toLowerCase()), tap: () => ['homeassistant', 'toggle', {}] };
      if (['script', 'scene', 'button', 'input_button'].includes(d))
        return { type: 'run', tap: () => [d === 'input_button' ? 'input_button' : d, d.endsWith('button') ? 'press' : 'turn_on', {}] };
      return { type: 'orb' };
    }
    _glyph(raw) {
      raw = String(raw || '').trim();
      if (raw.indexOf(':') >= 0) return `<ha-icon icon="${esc(raw)}"></ha-icon>`;
      return `<i style="--i:url('${esc(iconUrl(raw || 'default'))}')"></i>`;
    }
    _mainIcon() {
      const c = this._config;
      if (c.icon && c.icon !== 'default') return c.icon;
      return (window.hemmaDomainGlyph && window.hemmaDomainGlyph(c.entity)) || 'default';
    }
    _slots() { return [1, 2].filter((n) => this._config['action_' + n + '_enabled'] !== false && this._config['action_' + n + '_entity']); }
    _label(n) {
      const c = this._config, own = c['action_' + n + '_label'];
      if (own) return String(own);
      const st = this._st(c['action_' + n + '_entity']), main = String(this._name());
      let name = String((st && st.attributes.friendly_name) || c['action_' + n + '_entity']);
      if (main && name.toLowerCase().indexOf(main.toLowerCase() + ' ') === 0) { const rest = name.slice(main.length).trim(); if (rest) name = rest.charAt(0).toUpperCase() + rest.slice(1); }
      return name;
    }
    _btnIcon(n) {
      const c = this._config, id = c['action_' + n + '_entity'], st = this._st(id);
      return c['action_' + n + '_icon'] || (st && st.attributes.icon) || (window.hemmaEntityIcon && window.hemmaEntityIcon(this._hass, this._hass.states, id)) || 'mdi:bookmark';
    }
    _name() { const st = this._st(); return this._config.name || (st && st.attributes.friendly_name) || this._config.entity || ''; }
    _build() {
      if (!this._config || !this._hass || !this._st()) return;
      this._built = true;
      const k = this._kind(), root = this.shadowRoot;
      this._k = k;
      const main = k.type === 'slider' ? `<button type="button" class="ctl${k.white ? ' white' : ''}" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span><i class="glyph" style="--i:url('${esc(iconUrl(this._mainIcon()))}')"></i></button>`
        : k.type === 'switch' ? `<button type="button" class="ctl sw" role="switch"><span class="knob">${this._glyph(this._mainIcon())}</span></button>`
        : `<button type="button" class="${k.type}">${this._glyph(this._mainIcon())}</button>`;
      root.innerHTML = `<style>${SHEET_CSS}${COVER_CSS}${ACT_CSS}${BIG_CSS}</style><div class="wrap cover acts-wrap${this._config.show_names === false ? ' bare' : ''}"><div class="hd"><b></b><span></span></div>${main}`
        + `<div class="btns">${this._slots().map((n) => `<button type="button" class="btn" data-n="${n}" data-icon="${esc(this._btnIcon(n))}"><span>${this._glyph(this._btnIcon(n))}</span><b></b></button>`).join('')}</div>`
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button></div>`;
      root.querySelector('.gear').onclick = () => moreInfo(this, this._config.entity);
      root.querySelectorAll('.btn').forEach((b) => { b.onclick = () => this._run(Number(b.dataset.n)); });
      const ctl = root.querySelector('.ctl');
      if (k.type === 'slider') {
        let g = null;
        ctl.addEventListener('pointerdown', (e) => { try { ctl.setPointerCapture(e.pointerId); } catch (_) {} g = { y: e.clientY, h: ctl.getBoundingClientRect().height, v0: k.get(this._st()), live: false }; });
        ctl.addEventListener('pointermove', (e) => {
          if (!g) return;
          const dy = e.clientY - g.y;
          if (!g.live && Math.abs(dy) < 6) return;
          g.live = true; ctl.classList.add('dragging');
          g.v = Math.round(Math.max(k.min || 0, Math.min(100, g.v0 - dy / g.h * 100)));
          this._show(g.v);
        });
        ctl.addEventListener('pointerup', () => {
          if (!g) return;
          ctl.classList.remove('dragging');
          this._call(g.live ? k.set(g.v) : k.tap(this._st()));
          g = null;
        });
        ctl.addEventListener('pointercancel', () => { g = null; ctl.classList.remove('dragging'); this._paint(); });
      } else if (k.type === 'switch') {
        let y0 = null, moved = false;
        ctl.addEventListener('pointerdown', (e) => { y0 = e.clientY; moved = false; try { ctl.setPointerCapture(e.pointerId); } catch (_) {} });
        ctl.addEventListener('pointermove', (e) => {
          if (y0 == null || moved) return;
          const dy = e.clientY - y0, up = ctl.classList.contains('up');
          if (Math.abs(dy) > 24) { moved = true; if ((dy > 0 && up) || (dy < 0 && !up)) this._call(k.tap(this._st())); }
        });
        ctl.addEventListener('pointerup', () => { if (y0 != null && !moved) this._call(k.tap(this._st())); y0 = null; });
        ctl.addEventListener('pointercancel', () => { y0 = null; });
      } else {
        root.querySelector('.' + k.type).onclick = () => k.type === 'run' ? this._call(k.tap()) : moreInfo(this, this._config.entity);
      }
      this._paint();
    }
    _show(v) {
      const ctl = this.shadowRoot.querySelector('.ctl');
      ctl.querySelector('.fill').style.height = v + '%';
      ctl.classList.toggle('closed', v <= 0);
      ctl.setAttribute('aria-valuenow', String(v));
      this._holdUntil = Date.now() + 2500;
    }
    _call(svc) {
      if (!svc) return;
      const [d, s, data] = svc;
      this._was = (this._st() || {}).last_updated; this._wasAt = Date.now();
      this._hass.callService(d, s, { entity_id: this._config.entity, ...data }).catch(() => {});
    }
    _run(n) {
      const c = this._config, id = c['action_' + n + '_entity'], act = c['action_' + n + '_action'] || 'more-info';
      if (act === 'more-info') return moreInfo(this, id);
      if (act === 'toggle') { this._hass.callService(String(id).split('.')[0], 'toggle', { entity_id: id }).catch(() => {}); return; }
      if (act === 'call-service') {
        const full = String(c['action_' + n + '_service'] || '');
        if (full.indexOf('.') < 0) return;
        const [d, s] = full.split('.'), data = Object.assign({}, c['action_' + n + '_service_data'] || {});
        if (!data.entity_id) data.entity_id = id;
        this._hass.callService(d, s, data).catch(() => {});
        return;
      }
      if (act === 'navigate') {
        const path = c['action_' + n + '_navigation_path'];
        if (!path) return;
        history.pushState(null, '', path);
        window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
        if (window.hemmaPopup) window.hemmaPopup.close();
      }
    }
    _progress(st) {
      const c = this._config;
      if (!c.show_progress) return null;
      const s = this._st(c.progress_entity) || st, a = (s && s.attributes) || {};
      const n = parseFloat(s && s.state);
      if (Number.isFinite(n)) return Math.round(n);
      if (Number.isFinite(Number(a.percentage))) return Math.round(Number(a.percentage));
      if (Number.isFinite(Number(a.progress))) return Math.round(Number(a.progress));
      if (Number(a.media_duration) > 0 && Number.isFinite(Number(a.media_position))) return Math.round(Number(a.media_position) / Number(a.media_duration) * 100);
      return null;
    }
    _paint() {
      const root = this.shadowRoot, st = this._st(), k = this._k;
      if (!st || !root.querySelector('.hd')) return;
      const pr = this._progress(st);
      root.querySelector('.hd b').textContent = this._name();
      let sub = this._fmt(st);
      if (k.type === 'slider') sub = [sub, k.get(st) ? k.get(st) + '%' : ''].filter(Boolean).join(' · ');
      if (pr != null) sub = [sub, pr + '%'].filter(Boolean).join(' · ');
      root.querySelector('.hd span').textContent = sub;
      const ctl = root.querySelector('.ctl');
      if (k.type === 'slider') {
        const waiting = this._was && st.last_updated === this._was && Date.now() - this._wasAt < 10000;
        if (!(this._holdUntil && Date.now() < this._holdUntil) && !waiting && !ctl.classList.contains('dragging')) { this._show(k.get(st)); this._holdUntil = 0; }
        if (k.light) ctl.querySelector('.fill').style.background = lightColor(st);
      } else if (k.type === 'switch') {
        const on = k.on(st);
        ctl.classList.toggle('up', on); ctl.classList.toggle('open', on); ctl.setAttribute('aria-checked', String(on));
      } else {
        root.querySelector('.' + k.type).classList.toggle('on', k.type === 'orb' && ACT_ON.includes(String(st.state).toLowerCase()));
      }
      root.querySelectorAll('.btn').forEach((b) => {
        const n = Number(b.dataset.n), c = this._config, s = this._st(c['action_' + n + '_entity']);
        const on = !!s && ACT_ON.includes(String(s.state).toLowerCase().replace(/_/g, ' '));
        b.classList.toggle('on', on);
        b.classList.toggle('dead', !s || ['unavailable', 'unknown'].includes(s.state));
        b.style.setProperty('--act-on', c['action_' + n + '_active_color'] || '');
        const tip = this._label(n) + ' · ' + ((c['action_' + n + '_action'] === 'navigate') ? T('actions.open', 'Open') : this._fmt(s));
        b.querySelector('b').textContent = this._label(n);
        const icon = this._btnIcon(n);
        if (b.dataset.icon !== icon) { b.dataset.icon = icon; b.querySelector('span').innerHTML = this._glyph(icon); }
        b.querySelector('span').dataset.tip = tip;
        b.setAttribute('aria-label', tip);
      });
    }
  }
  if (!customElements.get('hemma-actions-panel')) customElements.define('hemma-actions-panel', HemmaActionsPanel);

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
    .danger button.ok { background:rgba(255,66,69,0.85); }
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
  const SHRINK = GROW;
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
    // A badge with no shape of its own (bare icon and text) grows from a circle on its icon.
    const cell = !lit && !blur && alphaOf(cs.backgroundColor) < 0.05 && sr.querySelector('#img-cell');
    const ir = cell && cell.getBoundingClientRect();
    if (ir && ir.width) {
      const d = Math.max(ir.width, ir.height);
      return { rect: new DOMRect(ir.left + ir.width / 2 - d / 2, ir.top + ir.height / 2 - d / 2, d, d), radius: d / 2, fill: 'rgba(255, 255, 255, 0)', blur: 0 };
    }
    return { rect: r, radius: Math.min(parseFloat(cs.borderTopLeftRadius) || 26, r.width / 2, r.height / 2), fill: lit ? over.backgroundColor : cs.backgroundColor, blur, filter: cs.backdropFilter || cs.webkitBackdropFilter || 'none' };
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
  // The untransformed box, centered where the element shows: a rotated icon's bounding box is larger than the icon.
  const layoutRect = (el) => {
    const b = el.getBoundingClientRect(), w = el.offsetWidth || b.width, h = el.offsetHeight || b.height;
    return new DOMRect(b.left + b.width / 2 - w / 2, b.top + b.height / 2 - h / 2, w, h);
  };
  const cloneShown = (el) => {
    const r = layoutRect(el);
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
      const lr = layoutRect(k);
      Object.assign(d.style, { position: 'absolute', left: (lr.left - r.left) + 'px', top: (lr.top - r.top) + 'px', width: lr.width + 'px', height: lr.height + 'px', margin: '0' });
      k.getAnimations().forEach((a) => { try { const m = d.animate(a.effect.getKeyframes(), a.effect.getTiming()); m.startTime = a.startTime; } catch (_) {} });
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
  const settle = (card, holder, from, dur, ease, noIcon) => {
    const sr = card.shadowRoot;
    const hc = sr && sr.querySelector('ha-card');
    if (!hc) return;
    const t = hc.getBoundingClientRect();
    const parts = [];
    const cell = !noIcon && sr.querySelector('#img-cell');
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
  const lift = (card, holder, track, dur, from, noIcon) => {
    const sr = card.shadowRoot;
    const hc = sr && sr.querySelector('ha-card');
    if (!hc) return () => {};
    const t = from || hc.getBoundingClientRect();
    const parts = [];
    const cell = !noIcon && sr.querySelector('#img-cell');
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
    requestAnimationFrame(ride);
    return () => parts.forEach((p) => p.el.remove());
  };
  // A copy's icon mask decodes a frame late, so the real tile stays up until the copy has painted.
  // Opened in place the glass covers its tile, so the tile hides; sent to the middle it leaves the tile where it was.
  const hideAfterPaint = (card) => { requestAnimationFrame(() => requestAnimationFrame(() => { card.style.visibility = 'hidden'; })); };
  // The ends of a morph are the real tile crossfading with clear glass; no copy of a tile's frost matches it.
  // Faded on ha-card itself: opacity on the host would make it a backdrop root and switch the tile's frost off mid-fade.
  // Landing, an opaque tile is fully in before the card leaves; a see-through one swaps with it, or the two stack darker.
  const tileFade = (card, dur, out, late) => {
    const el = (card.shadowRoot && card.shadowRoot.querySelector('ha-card')) || card;
    const look = late && tileLook(card), swap = look && alphaOf(look.fill) < 0.95;
    const a = el.animate(out ? [{ opacity: 0 }, { opacity: 0, offset: swap ? (late === 'card' ? 0.6 : 0.85) : late ? 0.4 : 0.35 }, { opacity: 1, offset: swap ? (late === 'card' ? 0.8 : 0.999) : late ? 0.6 : 0.7 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0, offset: 0.25 }, { opacity: 0 }],
      { duration: dur, easing: 'linear', fill: 'forwards' });
    if (!out) a.finished.then(() => { card.style.visibility = 'hidden'; a.cancel(); }).catch(() => {});
    return a;
  };
  // The tile's fill drains at once and the glass stays see-through until it frosts over at the end.
  const rgba = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); const p = m ? m[1].split(',').map(Number) : [0, 0, 0, 0]; return p.length > 3 ? p : p.concat(1); };
  const mix = (x, y, k, ka) => { const a = rgba(x), b = rgba(y); return `rgba(${[0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k)).join(', ')}, ${(a[3] + (b[3] - a[3]) * ka).toFixed(3)})`; };
  // Apple's tile turns to gray glass within a few frames, then darkens steadily; filter lists must match end to end or they jump.
  const filterAt = (endFilter, k, b0, from) => {
    const parts = (endFilter && endFilter !== 'none' ? endFilter : 'blur(28px)').match(/[a-z-]+\([^)]*\)/g) || [];
    return parts.map((p) => {
      const [, fn, v] = /([a-z-]+)\(([^)]*)\)/.exec(p);
      const n = parseFloat(v), unit = v.replace(/[-\d.]/g, '');
      const own = new RegExp(fn + '\\(([-\\d.]+)([a-z%]*)\\)').exec(from || '');
      const id = own ? Number(own[1]) * (own[2] === '%' && unit !== '%' ? 0.01 : own[2] !== '%' && unit === '%' ? 100 : 1) : fn === 'blur' ? b0 : /saturate|brightness|contrast|opacity/.test(fn) ? (unit === '%' ? 100 : 1) : 0;
      return `${fn}(${(id + (n - id) * k).toFixed(3)}${unit})`;
    }).join(' ');
  };
  const material = (el, look, endBg, endFilter, dur, out, handoff) => {
    if (!endFilter || endFilter === 'none') endFilter = 'blur(0px)';
    const f = (k) => filterAt(endFilter, k, 0);
    const at = (c, x, o) => ({ backgroundColor: c, backdropFilter: f(x), webkitBackdropFilter: f(x), offset: o });
    // Opening, a solid tile's glass starts as the tile and hides it. Closing, every glass clears at the end so the real tile, text and all, shows through as it lands.
    const clear = mix(look.fill, 'rgba(0, 0, 0, 0)', 0, 1), edge = alphaOf(look.fill) >= 0.95 ? look.fill : clear;
    const glass = { backgroundColor: endBg, backdropFilter: endFilter, webkitBackdropFilter: endFilter };
    el.animate(out && handoff
      ? [{ ...glass, offset: 0 }, at(mix(endBg, clear, 0.5, 0.5), 0.5, 0.2), at(clear, 0, 0.5), at(clear, 0, 1)]
      : out
      ? [{ ...glass, offset: 0 }, at(mix(endBg, look.fill, 0.5, 0.5), 0.5, 0.2), at(look.fill, 0.25, 0.35), ...(edge === clear ? [] : [at(look.fill, 0.1, 0.7)]), at(clear, 0, 0.95), at(clear, 0, 1)]
      : [at(edge, 0, 0), at(mix(look.fill, endBg, 0.75, 0.85), 0.7, 0.1), { ...glass, offset: 0.3 }, { ...glass, offset: 1 }],
      { duration: dur, easing: 'linear', fill: out ? 'forwards' : 'backwards' });
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
  const place = (t, W, H) => {
    const m = 16, B = bounds(), L = t.left >= B.left ? Math.min(B.left + m, t.left) : B.left + m, R = t.left + t.width <= B.right ? Math.max(B.right - m, t.left + t.width) : B.right - m;
    return { x: Math.max(L, Math.min(R - W, t.left + t.width / 2 - W / 2)), y: Math.max(B.top + m, Math.min(B.bottom - m - H, t.top + t.height / 2 - H / 2)) };
  };
  // A longer trip gets a little more time, so a panel from a corner tile does not rush.
  const timed = (spring, t, x, y, W, H) => {
    const d = Math.hypot(x + W / 2 - (t.left + t.width / 2), y + H / 2 - (t.top + t.height / 2));
    return { ease: spring.ease, dur: Math.round(spring.dur * (1 + Math.min(0.35, d / 1800))) };
  };
  // Apple's tile becomes the panel's main control: same spot, size, corners and colors, its icon travelling into the control's.
  const heroFly = (card, look, hero, grow, dur, ease, layer) => {
    const hr = hero.el.getBoundingClientRect(), hcs = getComputedStyle(hero.el), tr = look.rect;
    // A control drawn as a shape inside a plain box (the thermostat's ring) has no corners of its own; its outline is round.
    const ownR = parseFloat(hcs.borderTopLeftRadius) ? hcs.borderTopLeftRadius : Math.min(hr.width, hr.height) / 2 + 'px';
    const at = (r, radius, bg) => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: radius, backgroundColor: bg });
    const A = at(tr, look.radius + 'px', look.fill), B = at(hr, ownR, hcs.backgroundColor);
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;overflow:hidden;pointer-events:none;margin:0;box-sizing:border-box;';
    // Landing, the box is the tile's glass from the start, so its blur never pops in at the hand-over.
    if (!grow && hero.land && look.filter && look.filter !== 'none') { box.style.backdropFilter = look.filter; box.style.webkitBackdropFilter = look.filter; }
    layer.appendChild(box);
    const fade = (from, to, delay, d) => ({ frames: [{ opacity: from }, { opacity: to }], opts: { duration: dur * d, delay: dur * delay, easing: 'ease-out', fill: 'both' } });
    if (hero.fill) {
      const fr = hero.fill.getBoundingClientRect();
      if (fr.width && fr.height) {
        const f = document.createElement('div');
        const pct = (v, w) => (v / w * 100).toFixed(2) + '%';
        const fcs = getComputedStyle(hero.fill);
        f.style.cssText = `position:absolute;left:${pct(fr.left - hr.left, hr.width)};top:${pct(fr.top - hr.top, hr.height)};width:${pct(fr.width, hr.width)};height:${pct(fr.height, hr.height)};background:${fcs.backgroundColor};border-radius:${fcs.borderRadius};`;
        box.appendChild(f);
        const a = grow ? fade(0, 1, 0.1, 0.55) : hero.land ? fade(1, 0, 0.25, 0.25) : fade(1, 0, 0.25, 0.55);
        f.animate(a.frames, a.opts);
      }
    }
    // The glass already wears the tile's color; a second coat here doubles a translucent tile into a dark patch.
    const bg = [mix(B.backgroundColor, 'rgba(0, 0, 0, 0)', 0, 1), B.backgroundColor];
    delete A.backgroundColor; delete B.backgroundColor;
    // Apple's control shrinks as itself first and only widens into the tile at the end.
    const mid = () => {
      const w = Math.max(tr.width * 0.55, hr.width * 0.8), h = Math.max(tr.height * 1.4, hr.height * 0.42);
      const cx = hr.left + hr.width / 2 + (tr.left + tr.width / 2 - hr.left - hr.width / 2) * 0.8, cy = hr.top + hr.height / 2 + (tr.top + tr.height / 2 - hr.top - hr.height / 2) * 0.8;
      return { left: cx - w / 2 + 'px', top: cy - h / 2 + 'px', width: w + 'px', height: h + 'px', borderRadius: parseFloat(hcs.borderTopLeftRadius) ? hcs.borderTopLeftRadius : Math.min(w, h) / 2 + 'px', offset: 0.55 };
    };
    box.animate(grow ? [A, B] : hero.land && !hero.card ? [B, mid(), A] : [B, A], { duration: dur, easing: ease, fill: 'forwards' });
    box.animate(grow && hero.card ? [{ backgroundColor: look.fill }, { backgroundColor: bg[1], offset: 0.35 }, { backgroundColor: bg[1] }]
      : grow ? [{ backgroundColor: bg[0] }, { backgroundColor: bg[1], offset: 0.2 }, { backgroundColor: bg[1] }]
      : hero.land ? [{ backgroundColor: bg[1] }, { backgroundColor: bg[1], offset: 0.2 }, { backgroundColor: look.fill, offset: 0.5 }, { backgroundColor: look.fill }]
      : [{ backgroundColor: bg[1] }, { backgroundColor: bg[0], offset: 0.35 }, { backgroundColor: bg[0] }], { duration: dur, easing: 'ease-out', fill: 'forwards' });
    // On a phone there is no glass, so the control itself lands as the tile and hands over to it at the very end.
    // A card anchor has content of its own, so the box crossfades with it instead of the card waiting hidden.
    if (grow && hero.card) box.animate([{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0, offset: 0.85 }, { opacity: 0 }], { duration: dur, easing: 'linear', fill: 'forwards' });
    else if (!grow && hero.land) box.animate(hero.card ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.6 }, { opacity: 0, offset: 0.8 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0, offset: 1 }], { duration: dur, easing: 'linear', fill: 'forwards' });
    // A card has no control to carry the tile's face, so the box carries a copy of it: gone early growing, back before landing.
    if (hero.card && card.shadowRoot) {
      const csr = card.shadowRoot, face = document.createElement('div');
      face.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:1;';
      const cellEl = csr.querySelector('#img-cell');
      if (cellEl && cellEl.getBoundingClientRect().width) { const c = cloneShown(cellEl).el; c.style.visibility = 'visible'; face.appendChild(c); }
      ['#name', '#state', '#label'].forEach((sel) => { const n = csr.querySelector(sel); if (n && n.textContent.trim() && n.getBoundingClientRect().width) face.appendChild(cloneText(n).el); });
      layer.appendChild(face);
      const there = `translate(${hr.left - tr.left}px, ${hr.top - tr.top}px)`;
      face.animate(grow ? [{ transform: 'none' }, { transform: there }] : [{ transform: there }, { transform: 'none' }], { duration: dur, easing: ease, fill: 'forwards' });
      face.animate(grow ? [{ opacity: 1 }, { opacity: 0, offset: 0.25 }, { opacity: 0 }]
        : [{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1, offset: 0.55 }, { opacity: 1, offset: 0.65 }, { opacity: 0, offset: 0.8 }, { opacity: 0 }], { duration: dur, easing: 'linear', fill: 'forwards' });
    }
    // A control lands as the tile: its name and state settle in on the card before it hands over.
    if (!grow && hero.land && !hero.card && card.shadowRoot) {
      const csr = card.shadowRoot, words = document.createElement('div');
      words.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:1;';
      ['#name', '#state', '#label'].forEach((sel) => { const n = csr.querySelector(sel); if (n && n.textContent.trim() && n.getBoundingClientRect().width) words.appendChild(cloneText(n).el); });
      layer.appendChild(words);
      words.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1, offset: 0.75 }, { opacity: 1, offset: 0.85 }, { opacity: 0, offset: 1 }], { duration: dur, easing: 'linear', fill: 'forwards' });
    }
    // The card's own fill takes over from the box rather than stacking a second translucent panel under it.
    if (hero.card) {
      const own = B.backgroundColor, none = mix(own, 'rgba(0, 0, 0, 0)', 0, 1);
      hero.el.animate(grow ? [{ backgroundColor: none }, { backgroundColor: none, offset: 0.55 }, { backgroundColor: own, offset: 0.85 }, { backgroundColor: own }]
        : [{ backgroundColor: own }, { backgroundColor: none, offset: 0.15 }, { backgroundColor: none }], { duration: dur, easing: 'linear' });
    }
    const sr = card.shadowRoot, cell = sr && ((hero.cell && sr.querySelector(hero.cell)) || sr.querySelector('#img-cell'));
    const cr = cell && layoutRect(cell), ir = hero.icon && layoutRect(hero.icon);
    if (cr && cr.width && ir && ir.width) {
      const shift = (from, to) => `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px)`;
      const art = !hero.cell && cell.querySelector('img, ha-icon, ha-state-icon'), aw = art ? art.offsetWidth || art.getBoundingClientRect().width : 0;
      const k = hero.cell ? cr.width / ir.width : (aw || cr.width * 0.55) / ir.width;
      const mine = cloneShown(cell).el, theirs = hero.clone ? hero.clone() : cloneShown(hero.icon).el;
      // A puck's number is text, which the copy leaves out; it rides inside the copy so the tile's 75 is there when it lands.
      if (hero.cell) {
        const at = layoutRect(cell), tx = [];
        [cell, ...cell.querySelectorAll('*')].forEach((n) => {
          if (![...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) return;
          const t = cloneText(n).el, nr = n.getBoundingClientRect();
          Object.assign(t.style, { position: 'absolute', left: (nr.left - at.left) + 'px', top: (nr.top - at.top) + 'px' });
          mine.appendChild(t);
          tx.push([t, n.textContent.trim()]);
        });
        // An off dial reads "Off" where the tile reads 75: the number leaves at the tile's size instead of swelling over the word.
        const word = hero.text ? String(hero.text()).trim() : null;
        if (word != null) tx.filter(([, v]) => v !== word).forEach(([t]) => t.animate(grow ? [{ opacity: 1 }, { opacity: 0, offset: 0.1 }, { opacity: 0 }]
          : [{ opacity: 0 }, { opacity: 0, offset: 0.82 }, { opacity: 1 }], { duration: dur, easing: 'linear', fill: 'forwards' }));
      }
      [mine, theirs].forEach((e) => { e.style.zIndex = '1'; layer.appendChild(e); });
      // The control is hidden for the flight before it is copied; only the copy's root is forced back, so parts hidden on purpose (an off dial's arc) stay hidden.
      [mine, theirs].forEach((e) => { e.style.visibility = 'visible'; });
      // A puck that grows into the dial drops its fill as it starts, or an active tile's color swells into a solid disc.
      if (hero.cell) [mine, ...mine.querySelectorAll('*')].forEach((e) => {
        const c = getComputedStyle(e).backgroundColor;
        if (!alphaOf(c)) return;
        const clear = mix(c, 'rgba(0, 0, 0, 0)', 0, 1);
        e.animate(grow ? [{ backgroundColor: c }, { backgroundColor: clear, offset: 0.06 }, { backgroundColor: clear }]
          : [{ backgroundColor: clear }, { backgroundColor: clear, offset: 0.55 }, { backgroundColor: c, offset: 0.8 }, { backgroundColor: c }], { duration: dur, easing: 'linear', fill: 'forwards' });
      });
      // The tile's icon disc stays behind; only the glyph travels into the control.
      if (!hero.cell) [mine, ...mine.children].forEach((e) => {
        const c = e.tagName !== 'IMG' && e.style.backgroundColor;
        if (!c || !alphaOf(c)) return;
        const clear = mix(c, 'rgba(0, 0, 0, 0)', 0, 1);
        // Closing, the copy's disc hands over to the real tile's as that fades in, so two translucent discs never stack.
        e.animate(grow ? [{ backgroundColor: c }, { backgroundColor: clear, offset: 0.3 }, { backgroundColor: clear }]
          : hero.land ? [{ backgroundColor: c }, { backgroundColor: c }] : [{ backgroundColor: c }, { backgroundColor: c, offset: 0.6 }, { backgroundColor: clear, offset: 0.85 }, { backgroundColor: clear }], { duration: dur, easing: 'linear', fill: 'forwards' });
      });
      const away = shift(cr, ir) + ` scale(${(1 / k).toFixed(3)})`, home = shift(ir, cr) + ` scale(${k.toFixed(3)})`;
      mine.animate(grow ? [{ transform: 'none' }, { transform: away }] : [{ transform: away }, { transform: 'none' }], { duration: dur, easing: ease, fill: 'forwards' });
      theirs.animate(grow ? [{ transform: home }, { transform: 'none' }] : [{ transform: 'none' }, { transform: home }], { duration: dur, easing: ease, fill: 'forwards' });
      const out = grow ? fade(1, 0, 0.2, 0.4) : fade(0, 1, 0.2, 0.25), inn = grow ? fade(0, 1, 0.2, 0.4) : fade(1, 0, 0.2, 0.25);
      mine.animate(out.frames, out.opts);
      theirs.animate(inn.frames, inn.opts);
      // The copy is drawn at full strength; the tile's own icon may be dimmer, so it hands over with the card rather than vanishing at the end.
      if (!grow) mine.animate([{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1, offset: 0.45 }, { opacity: 1, offset: hero.land ? 0.85 : 0.6 }, { opacity: 0, offset: hero.land ? 1 : 0.8 }, { opacity: 0 }], { duration: dur, easing: 'linear', fill: 'forwards' });
    }
  };
  // Apple's tile overshoots by about a point once it lands, then settles.
  // Played on the flying copy just before it hands over: scaling the real tile left its text soft until the bounce ended, then it snapped sharp.
  const bounce = (layer, r, dur) => {
    layer.style.transformOrigin = (r.left + r.width / 2) + 'px ' + (r.top + r.height / 2) + 'px';
    layer.animate([{ transform: 'none' }, { transform: 'none', offset: 0.74 }, { transform: 'scale(1.008)', offset: 0.88 }, { transform: 'none' }], { duration: dur, easing: 'ease-in-out' });
  };
  window.hemmaMorph = { look: tileLook, grow: GROW, shrink: SHRINK, settle, lift, material, geometry, hideAfterPaint, tileFade, bounds, place, timed, heroFly, bounce };

  const ask = (title, verb, card, danger) => new Promise((done) => {
    if (asking) return done(false);
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${ASK_CSS}</style><div class="scrim${danger ? ' danger' : ''}"><div class="box" role="alertdialog" aria-modal="true" aria-label="${esc(title)}">`
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
      const t = tile.rect, at = place(t, W, H);
      fx = at.x; fy = at.y;
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
