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
  const STATUS_POP = { vacuum: 'hemma-vacuum-panel', light: 'hemma-light-panel', fan: 'hemma-fan-panel', humidifier: 'hemma-humidifier-panel', cover: 'hemma-cover-panel',
    lock: 'hemma-lock-panel', media_player: 'hemma-media-panel', climate: 'hemma-thermostat-panel' };
  const STATUS_POP_STYLE = { 'hemma-vacuum-panel': '--popup-min-width: 300px; --popup-max-width: 300px; --popup-min-width-narrow: 300px; --hemma-popup-radius: 34px; --hemma-popup-tint: rgba(0, 0, 5, 0.16);' };
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
      border-radius: var(--badge-br, 9999px); background: var(--hemma-badge-bg, var(--badge-background, rgba(10,12,14,0.65)));
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
    :host([hv]) { --hv-bi-ic: 25px; --hv-bi-h: 48px; }
    :host([hv]) .b { background: var(--hv-bi-bg, #fff); -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: none;
      min-height: 0; height: var(--hv-bi-h); padding: 0 16px 0 12px; column-gap: 8px; }
    :host([hv]) .i { width: var(--hv-bi-ic); height: var(--hv-bi-ic); padding: 0; background: var(--hv-bi-ink, #1c1c1e); scale: var(--s, .8); }
    :host([hv]) .t { color: var(--hv-ink, #fff); }
    :host([hv]) .s { color: var(--hv-sub, rgba(235,235,245,0.6)); opacity: 1; }
    @media (hover: hover) {
      :host([hv]) { --hv-bi-h: 44px; }
      :host([hv]) .t { font-size: 14px; }
      :host([hv]) .s { font-size: 13px; }
    }
    @media (min-width: 768px) and (hover: none), (min-width: 768px) and (pointer: coarse) {
      :host([hv]) { --hv-bi-ic: 23px; --hv-bi-h: 48px; }
      :host([hv]) .t { font-size: 14px; }
      :host([hv]) .s { font-size: 13px; }
    }
    @media (max-width: 767px), (max-height: 500px) {
      :host([hv]) { --hv-bi-ic: 23px; --hv-bi-h: 42px; }
      :host([hv]) .b { column-gap: 7px; }
    }
  `;
  const HV_LIVE = new Set();
  const hvSync = (el) => {
    let chip = false;
    for (let e = el; e && !chip; e = e.parentElement || (e.getRootNode && e.getRootNode().host)) if (e.classList && e.classList.contains('cat-chipcard')) chip = true;
    el.toggleAttribute('hv', document.documentElement.classList.contains('hemma-hv') && !chip);
  };
  new MutationObserver(() => HV_LIVE.forEach(hvSync)).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

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
      HV_LIVE.add(this);
      hvSync(this);
      this._render();
    }
    disconnectedCallback() { store.subs.delete(this._onStore); HV_LIVE.delete(this); }
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
      if (window._hemmaHvInk) this.shadowRoot.querySelectorAll('.i').forEach((el, n) => window._hemmaHvInk(items[n].url).then((q) => {
        if (q) el.style.setProperty('--s', Math.min(0.8 / Math.sqrt(q.w * q.h), 0.86 / Math.max(q.w, q.h)).toFixed(3));
      }));
      this.shadowRoot.querySelectorAll('.b').forEach((el) => el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = el.dataset.entity, t = STATUS_POP[id.split('.')[0]], it = items.find((x) => x.entity === id);
        // The entity's own Hemma popup, sliding up (there is no tile for it to grow out of); HA's dialog for anything Hemma has no popup for.
        if (t && customElements.get(t) && window.hemmaPopup && window.hemmaPopup.enabled) {
          window.hemmaPopup.open({ title: '', dismissable: true, close: false, sheet: true, style: STATUS_POP_STYLE[t] || '', content: { type: 'custom:' + t, entity: id, name: (it && it.name) || '' } });
          return;
        }
        this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
      }));
    }
  }
  if (!customElements.get('hemma-status-badges')) customElements.define('hemma-status-badges', HemmaStatusBadges);

  // The light panel: a brightness capsule, favorite colors, and for a group a page of its lights.
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
  // Header veil: a blur band behind a pinned title, shown once content moves under it.
  const VEIL = `-webkit-backdrop-filter: var(--hv-veil-bf, blur(20px) saturate(1.3)); backdrop-filter: var(--hv-veil-bf, blur(20px) saturate(1.3)); background: var(--hv-veil-bg, rgba(36,36,40,0.32)); box-shadow: inset 0 -0.5px 0 var(--hv-veil-line, rgba(255,255,255,0.16));`;
  const HV_CSS = `
    /* Scrolling popup: the large title scrolls away with the page, and a small one fades in, centered, in a short band at the top. */
    .hvbar { position: sticky; top: 0; z-index: 7; flex: none; align-self: stretch; height: 0; overflow: visible; pointer-events: none; }
    /* iPad popup: a 58pt band, the name 17pt semibold on a baseline 23.5pt down, the state 17pt regular and gray on one 27pt below it. */
    .hvbar > div { position: absolute; top: var(--hv-y, 0px); left: var(--hv-l, 0px); right: var(--hv-r, 0px); height: 58px; box-sizing: border-box; padding-top: 6.5px;
      display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; justify-items: center;
      opacity: 0; transition: opacity .2s ease; ${VEIL} }
    .hvbar b { font-size: 17px; font-weight: 600; line-height: 22px; letter-spacing: -0.01em; white-space: nowrap; max-width: 80%; overflow: hidden; text-overflow: ellipsis; }
    .hvbar small { font-size: 17px; font-weight: 500; line-height: 22px; margin-top: 5px; color: var(--hv-sub2, rgba(235,235,245,0.6)); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .hvbar small:empty { display: none; }
    .hvbar > div { box-shadow: inset 0 -0.5px 0 var(--hv-veil-line, rgba(255,255,255,0.32)); }
    .hvbar > div:has(small:empty) { align-content: center; padding-top: 0; }
    .hvbar.on > div { opacity: 1; }
  `;
  const GLASS_FILL = `background-color: var(--hv-btn-c, rgba(255,255,255,0.135)); background-image: var(--hv-btn-img, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'%3E%3Cdefs%3E%3ClinearGradient id='t' x1='0' x2='1'%3E%3Cstop offset='0.000' stop-color='white' stop-opacity='0.000'/%3E%3Cstop offset='0.030' stop-color='white' stop-opacity='0.060'/%3E%3Cstop offset='0.067' stop-color='white' stop-opacity='0.080'/%3E%3Cstop offset='0.117' stop-color='white' stop-opacity='0.085'/%3E%3Cstop offset='0.179' stop-color='white' stop-opacity='0.210'/%3E%3Cstop offset='0.250' stop-color='white' stop-opacity='0.305'/%3E%3Cstop offset='0.329' stop-color='white' stop-opacity='0.330'/%3E%3Cstop offset='0.413' stop-color='white' stop-opacity='0.415'/%3E%3Cstop offset='0.500' stop-color='white' stop-opacity='0.500'/%3E%3Cstop offset='0.587' stop-color='white' stop-opacity='0.415'/%3E%3Cstop offset='0.671' stop-color='white' stop-opacity='0.330'/%3E%3Cstop offset='0.750' stop-color='white' stop-opacity='0.305'/%3E%3Cstop offset='0.821' stop-color='white' stop-opacity='0.210'/%3E%3Cstop offset='0.883' stop-color='white' stop-opacity='0.085'/%3E%3Cstop offset='0.933' stop-color='white' stop-opacity='0.080'/%3E%3Cstop offset='0.970' stop-color='white' stop-opacity='0.060'/%3E%3Cstop offset='1.000' stop-color='white' stop-opacity='0.000'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' x1='0' x2='1'%3E%3Cstop offset='0.000' stop-color='white' stop-opacity='0.000'/%3E%3Cstop offset='0.117' stop-color='white' stop-opacity='0.000'/%3E%3Cstop offset='0.179' stop-color='white' stop-opacity='0.030'/%3E%3Cstop offset='0.250' stop-color='white' stop-opacity='0.305'/%3E%3Cstop offset='0.329' stop-color='white' stop-opacity='0.320'/%3E%3Cstop offset='0.413' stop-color='white' stop-opacity='0.455'/%3E%3Cstop offset='0.500' stop-color='white' stop-opacity='0.450'/%3E%3Cstop offset='0.587' stop-color='white' stop-opacity='0.455'/%3E%3Cstop offset='0.671' stop-color='white' stop-opacity='0.320'/%3E%3Cstop offset='0.750' stop-color='white' stop-opacity='0.305'/%3E%3Cstop offset='0.821' stop-color='white' stop-opacity='0.030'/%3E%3Cstop offset='0.883' stop-color='white' stop-opacity='0.000'/%3E%3Cstop offset='1.000' stop-color='white' stop-opacity='0.000'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M.5 22A21.5 21.5 0 0 1 43.5 22' fill='none' stroke='url(%23t)'/%3E%3Cpath d='M43.5 22A21.5 21.5 0 0 1 .5 22' fill='none' stroke='url(%23b)'/%3E%3C/svg%3E"), linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.07) 6%, rgba(255,255,255,0.025) 12%, rgba(255,255,255,0) 18%), linear-gradient(to top, rgba(255,255,255,0.11), rgba(255,255,255,0.05) 6%, rgba(255,255,255,0.015) 12%, rgba(255,255,255,0) 18%)); background-size: 100% 100%;`;
  const PILL_CSS = `
    .lpill { position: absolute; left: 50%; bottom: calc(9px + var(--sab, 0px)); transform: translateX(-50%); height: 40px; padding: 0 17px 0 13px; border: 0; border-radius: 20px; z-index: 2;
      display: flex; align-items: center; gap: 7px; color: var(--hv-pi, #fff); font: inherit; font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent;
      background-color: rgba(var(--hv-pk, 255,255,255),0.135); background-image: var(--hv-lpill-img, linear-gradient(to bottom, rgba(var(--hv-pk, 255,255,255),0.15), rgba(var(--hv-pk, 255,255,255),0.07) 6%, rgba(var(--hv-pk, 255,255,255),0.025) 12%, rgba(var(--hv-pk, 255,255,255),0) 18%), linear-gradient(to top, rgba(var(--hv-pk, 255,255,255),0.11), rgba(var(--hv-pk, 255,255,255),0.05) 6%, rgba(var(--hv-pk, 255,255,255),0.015) 12%, rgba(var(--hv-pk, 255,255,255),0) 18%));
      box-shadow: var(--hv-btn-sh, -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28)); }
    .lpill::before { content: ""; display: var(--hv-lpill-rim, block); position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
      background: linear-gradient(90deg, rgba(var(--hv-pk, 255,255,255),0) 0%, rgba(var(--hv-pk, 255,255,255),0.08) 8%, rgba(var(--hv-pk, 255,255,255),0.3) 25%, rgba(var(--hv-pk, 255,255,255),0.48) 50%, rgba(var(--hv-pk, 255,255,255),0.3) 75%, rgba(var(--hv-pk, 255,255,255),0.08) 92%, rgba(var(--hv-pk, 255,255,255),0) 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
    .lpill i { width: 16px; height: 16px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    @media (hover: hover) { .lpill:hover { filter: brightness(1.12); } }
  `;
  const PANEL_CSS = `
    ${HV_CSS}
    :host { display: block; --lc: var(--hemma-color-yellow, #FFCC00); color: var(--hv-pi, #fff); font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    .wrap { position: relative; height: var(--hemma-panel-h, min(600px, calc(100svh - 64px))); margin: -8px -8px -20px; width: calc(100% + 16px); overflow: hidden; }
    /* On the phone's full-screen popup the list runs up under the status bar, with its veil reaching the top of the screen. */
    .wrap:has(> .list) { overflow: visible; }
    .page { position: absolute; inset: 0; transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; }
    .main { display: grid; grid-template-rows: auto 1fr auto; justify-items: center; gap: 18px; padding: 28px 22px calc(110px + var(--sab, 0px)); box-sizing: border-box; }
    .list { transform: translateX(100%); opacity: 0; box-sizing: border-box; overflow: hidden; }
    /* No clip of its own (the popup's frame clips it): a clip here cuts the title veil's blur off from the rows under it. */
    .page.list { overflow: visible; }
    .deep .main { transform: translateX(-30%); opacity: 0; pointer-events: none; }
    .deep .list { transform: none; opacity: 1; }
    .h { text-align: center; display: grid; gap: 4px; margin-top: var(--hemma-hd-nudge, 16px); }
    .h b { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.15; }
    .h span { font-size: 15px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.75); font-variant-numeric: tabular-nums; }
    @media (max-width: 768px) { .h b { font-size: 28px; } .h span { font-size: 17px; } }
    .cap { position: relative; width: 116px; height: 100%; min-height: 180px; max-height: 300px; align-self: center; border-radius: 36px; overflow: hidden;
      background: rgba(var(--hv-pd, 0,0,0),0.30); cursor: default; touch-action: none; border: 0; padding: 0; color: var(--hv-pi, #fff); -webkit-tap-highlight-color: transparent; }
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
    .pill, .gear, .back { border: 0; color: var(--hv-pi, #fff); font: inherit; cursor: pointer; background: rgba(var(--hv-pk, 255,255,255),0.10); position: relative; -webkit-tap-highlight-color: transparent; }
    .pill { height: 40px; padding: 0 16px; border-radius: 999px; font-size: 14.5px; font-weight: 600; }
    .gear { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; ${GLASS_FILL} box-shadow: var(--hv-btn-sh, -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28)); }
    .gear i { width: 22px; height: 22px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
${PILL_CSS}    @media (max-width: 768px) { .lpill { position: fixed; height: 52px; border-radius: 26px; padding: 0 21px 0 17px; font-size: 15px; bottom: max(20px, env(safe-area-inset-bottom, 0px)); } .lpill i { width: 18px; height: 18px; } .main { padding-bottom: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 140px); }
      /* Clear of the corner buttons: the colors end about 60pt above the gear, and the buttons frost what passes behind them. */
      .gear.corner { -webkit-backdrop-filter: blur(20px) saturate(1.3); backdrop-filter: blur(20px) saturate(1.3); } }
    .deep > .lpill, .deep > .gear.corner { opacity: 0; pointer-events: none; }
    .lpill, .gear.corner { transition: opacity .26s ease; }
    .gear.corner { position: absolute; right: 10.5px; bottom: calc(9px + var(--sab, 0px)); width: 40px; height: 40px; padding: 0; z-index: 2; }
    .gear.corner i { width: 20px; height: 20px; }
    .gear.corner.glist { right: auto; left: 10.5px; }
    .gear.corner.glist i { width: 19px; height: 15px; }
    .lhd .lt { display: grid; min-width: 0; line-height: 1.2; }
    .lhd .lc { font-size: 12.5px; color: rgba(var(--hv-pk2, 235,235,245),0.6); }
    .lhd .lc:empty { display: none; }
    @media (max-width: 768px) { .gear.corner.glist { right: auto; left: 20px; } .gear.corner.glist i { width: 22px; height: 17px; } }
    @media (min-width: 769px) and (pointer: coarse) { .gear.corner.glist { right: auto; left: 12.5px; } }
    @media (max-width: 768px) { .gear.corner { position: fixed; width: 52px; height: 52px; right: 20px; bottom: max(20px, env(safe-area-inset-bottom, 0px)); } .gear.corner i { width: 24px; height: 24px; } }
    .back { flex: none; align-self: flex-start; width: 44px; height: 44px; padding: 0; border-radius: 50%; display: grid; place-items: center; position: relative;
      ${GLASS_FILL}
      box-shadow: var(--hv-btn-sh, -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28)); }
    .back svg { width: 11px; height: 18px; display: block; transform: translateX(-1px); }
    .pill::after, .gear::after, .back::after, .sw button:not(.wheel)::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #fff; opacity: 0; transition: opacity .40s ease; pointer-events: none; }
    @media (hover: hover) { .pill:hover::after, .gear:hover::after, .back:hover::after { opacity: .07; transition: opacity .18s ease; } }
    .lhd { position: absolute; top: calc(-1 * var(--hemma-stage-top, 0px)); left: 0; right: 0; z-index: 2; display: flex; align-items: center; gap: 12px; padding: calc(18px + var(--hemma-stage-top, 0px)) 16px 18px; pointer-events: none; }
    .lhd > * { pointer-events: auto; }
    .lst { position: absolute; inset: calc(-1 * var(--hemma-stage-top, 0px)) 0 0; display: grid; gap: 8px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: calc(86px + var(--hemma-stage-top, 0px)) 16px calc(16px + var(--sab, 0px)); box-sizing: border-box; align-content: start;
      }
    .lhd::before { content: ""; position: absolute; inset: 0 0 -4px; z-index: -1; pointer-events: none; opacity: 0; transition: opacity .22s ease; ${VEIL} }
    .page.list.scrolled .lhd::before { opacity: 1; }
    .lst::-webkit-scrollbar { display: none; }
    .lhd b { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr { display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 8px 10px; box-sizing: border-box; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(var(--hv-pd, 0,0,0),0.2); }
    .lr .tg { flex: none; width: 36px; height: 36px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; display: grid; place-items: center; background: rgba(var(--hv-pk, 255,255,255),0.08); color: rgba(var(--hv-pk, 255,255,255),0.45); -webkit-tap-highlight-color: transparent;
      transition: background-color .4s ease, color .4s ease; }
    .lr.on .tg { background: color-mix(in srgb, var(--lc) 24%, transparent); color: var(--lc); }
    .lr .tg i { width: 18px; height: 18px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .lr .nm { flex: 1; min-width: 0; border: 0; background: none; color: inherit; font: inherit; padding: 0; text-align: left; cursor: pointer; display: grid; gap: 1px; }
    .lr b { font-size: 14.5px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr .v { font-size: 12.5px; color: rgba(var(--hv-pk2, 235,235,245),0.6); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr .pl { position: relative; flex: none; width: 46%; height: 36px; border-radius: 12px; overflow: hidden; background: rgba(var(--hv-pk, 255,255,255),0.08); cursor: pointer; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
    .lr .pl > .fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--lc); pointer-events: none; transition: width .4s cubic-bezier(0.32, 0.72, 0, 1), background-color .4s ease; }
    .lr.drag .pl > .fill { transition: background-color .4s ease; }
    .lr.on .pl > .fill::after { content: ""; position: absolute; right: 6px; top: 9px; bottom: 9px; width: 4px; border-radius: 2px; background: rgba(255,255,255,0.9); }
    .picker { position: absolute; inset: 0; padding: 26px 22px 20px; box-sizing: border-box; display: grid; grid-template-rows: auto 1fr auto; gap: 16px; justify-items: center; }
    .wheelbig { width: 220px; height: 220px; border-radius: 50%; align-self: center; cursor: default; touch-action: none; border: 0; padding: 0;
      background: radial-gradient(circle, #fff 0%, rgba(var(--hv-pk, 255,255,255),0) 68%), conic-gradient(from 90deg, #ff3b30, #ffcc00, #34c759, #00c3d0, #0088ff, #af52de, #ff3b30); }
    .kbar { width: 100%; height: 56px; border-radius: 999px; align-self: center; cursor: default; touch-action: none; border: 0; padding: 0;
      background: linear-gradient(90deg, ${kelvinRgb(2000)}, ${kelvinRgb(3500)}, #fff, ${kelvinRgb(6500)}); }
    button:focus-visible { outline: 2px solid rgba(var(--hv-pk, 255,255,255),0.7); outline-offset: 2px; }
    @media (max-width: 768px) { .main { display: flex; flex-direction: column; align-items: center; gap: 0; padding-top: 36px; padding-bottom: calc(68px + max(20px, env(safe-area-inset-bottom, 0px))); } .main > .h { gap: 7px; margin-top: calc(var(--hemma-hd-nudge, 16px) + 18px); } .main > .cap { flex: none; width: 122px; height: min(342px, max(200px, calc(100svh - env(safe-area-inset-top, 0px) - max(20px, env(safe-area-inset-bottom, 0px)) - 335px))); min-height: 0; max-height: none; border-radius: 40px; margin: auto 0; } .main > .cap:has(~ .sw) { margin-bottom: 0; } .main > .sw { align-self: stretch; margin: 45px -22px auto; } .h b { font-size: 28px; font-weight: 500; } .h span { font-size: 17px; font-weight: 500; } }
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
    @media (min-width: 769px) and (hover: hover) { .cap { width: 96px; border-radius: 32px; } }
    @media (min-width: 769px) and (pointer: coarse) {
      .wrap { height: min(729px, calc(100svh - 90px)); }
      .main { padding: 44px 22px 104px; gap: 24px; }
      .cap { width: 120px; max-height: 344px; border-radius: 40px; }
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
          // Its own veil already reaches the top of the screen; the popup's status bar band would double it there.
          const own = lst.getBoundingClientRect().top <= 1;
          lst.dispatchEvent(new CustomEvent('hemma-veil', { detail: on && !own, bubbles: true, composed: true }));
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
  // Lock sheet: the name, its state, one tall control set low, and the accessory's settings in the corner.
  const SLAB_CSS = `
    .slab { display: contents; }
    @media (max-width: 768px) {
      .wrap:has(.slab) { height: calc(100svh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); min-height: 0; max-height: none; overflow: hidden; padding-bottom: 16px; }
      .wrap:has(.slab) .page.one { max-height: none; overflow: hidden; padding-bottom: 16px; }
      .wrap:has(.corner.gear) { padding-bottom: 41px; }
      .slab { display: flex; flex-direction: column; gap: 14px; flex: 0 1 auto; min-height: 0; align-self: stretch; box-sizing: border-box; margin: 26px var(--slab-x, 11px) 0;
        padding: 20px; border-radius: 36px; background: rgba(var(--hv-pd, 0,0,0),0.3); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
      .slab::-webkit-scrollbar { display: none; }
      .plant > .slab { background: var(--hv-plant-slab, rgba(var(--hv-pd, 0,0,0),0.3)); }
      .slab .w, .slab .list, .slab .row { background: none; border-radius: 0; }
      .slab .w { padding: 0; }
      .slab .g2 > .w + .w { border-left: 0.5px solid rgba(var(--hv-pk, 255,255,255),0.14); padding-left: 16px; }
      .slab .list .li, .slab .po { padding-left: 0; padding-right: 0; }
      .slab .li + .li::before { left: 48px; right: 0; }
      .slab .list + .list { margin-top: 0; }
      .slab .cams { margin-bottom: 0; }
      .slab > .list:first-child { margin-top: -8px; }
      .slab > .list:last-child { margin-bottom: -8px; }
      .slab .lbl { padding: 0; }
      .slab .pt { background: rgba(var(--hv-pk, 255,255,255),0.08); }
      .slab .wpill { margin: 0; align-self: center; background: rgba(var(--hv-pk, 255,255,255),0.12); }
      .slab .acts { margin-top: auto; }
      .slab .w + .g2 { padding-top: 8px; }
    }`;
  const CHEV_UD = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 14' fill='none' stroke='%23000' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1.5 5 4.5 2l3 3M1.5 9l3 3 3-3'/%3E%3C/svg%3E";
  const BIG_CSS = `
    ${PILL_CSS}
    .upill.lpill { display: none; }
    .ufoot { display: contents; }
    @media (max-width: 768px) {
      :host .wrap .lbl.all { display: none; }
      :host .wrap .upill.lpill { display: flex; position: relative; left: auto; bottom: auto; transform: none; align-self: center; flex: none; margin: auto 0 4px; height: 52px; border-radius: 26px; padding: 0 26px; font-size: 16px; }
    }
    .upill.lpill.hv { background: var(--hv-upill-bg, #fff) !important; background-image: none !important; color: var(--hv-upill-ink, #1c1c1e) !important; box-shadow: none !important; font-weight: 600; }
    .upill.lpill.hv::before, .upill.lpill.hv::after { display: none !important; }
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
    .grp .mhd small { font-size: 12.5px; color: rgba(var(--hv-pk2, 235,235,245),0.6); }
    .grp .mhd small:empty { display: none; }
    .grp .mem .tiles, .grp .mem .mini { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin: 0; width: 100%; flex: none; }
    .grp .mem .t { height: 60px; }
    @media (max-width: 768px) { .grp .mem { padding: 12px 16px calc(24px + var(--sab, 0px)); } }
    .mhd .back, .cam .back { flex: none; width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; color: var(--hv-pi, var(--hv-pi, #fff)); cursor: pointer; position: relative;
      ${GLASS_FILL}
      box-shadow: var(--hv-btn-sh, -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28)); }
    .mhd .back svg, .cam .back svg { width: 11px; height: 18px; display: block; transform: translateX(-1px); }
    @media (hover: hover) { .mhd .back:hover, .cam .back:hover { filter: brightness(1.12); } }
    .cam .back { position: absolute; top: 14px; left: 14px; z-index: 2; }
    @media (min-width: 769px) {
      :host { --pt: 46px; --tb: 22px; --ts: 15px; --cw: 104px; --ch: 290px; --cr: 32px; --pb: 62px; --dw: 252px; --vp: 96px; --art: 236px; }
      :host .wrap { padding-top: var(--pt); padding-bottom: var(--pb); overflow-x: hidden; }
      :host .wrap.lst:not(:has(> .corner)) { padding-bottom: 16px; }
      :host .wrap .hd b { font-size: var(--tb); }
      :host .wrap .hd span { font-size: var(--ts); }
      :host .wrap .ctl { width: var(--cw); height: var(--ch); border-radius: calc(var(--cw) * 0.33); margin: auto 0; }
      :host .wrap .knob { border-radius: calc(var(--cw) * 0.33 - 4px); }
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
      :host .wrap .ft { min-width: 0; min-height: 52px; padding: 7px 12px; border: 0; border-radius: 16px; background: rgba(var(--hv-pd, 0,0,0),0.24); color: var(--hv-pi, var(--hv-pi, #fff)); font: inherit; text-align: left; display: grid; align-content: center; justify-items: start; gap: 1px; cursor: pointer; transition: filter .4s ease; -webkit-tap-highlight-color: transparent; }
      :host .wrap .ft small { max-width: 100%; font-size: 12px; font-weight: 500; color: rgba(var(--hv-pk2, 235,235,245),0.72); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      :host .wrap .ft b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      @media (hover: hover) { :host .wrap .ft:hover { filter: brightness(0.84); transition: filter .18s ease; } }
      :host .wrap .ftiles[style="--n:2"] { grid-template-columns: repeat(2, minmax(0, 170px)); justify-content: center; }
      :host .wrap .lbl.all { display: none; }
      :host .wrap .upill.lpill { display: flex; position: sticky; left: auto; bottom: 9px; transform: none; align-self: center; flex: none; margin: auto 0 0; }
      :host .wrap.cam.cine { padding: 0 0 var(--pb); }
      :host .cine .vid { flex: none; align-self: stretch; aspect-ratio: auto; height: calc(var(--hemma-panel-h, 600px) - var(--pb) - 152px); border-radius: 0; background: #000; }
      :host .cine .vid .shade { position: absolute; left: 0; right: 0; top: 0; height: 120px; background: linear-gradient(rgba(var(--hv-pd, 0,0,0),0.5), transparent); pointer-events: none; z-index: 1; }
      :host .cine .vid .hd { position: absolute; left: 70px; right: 18px; top: 20px; z-index: 2; text-align: left; justify-items: start; gap: 1px; margin: 0; padding: 0; pointer-events: none; text-shadow: 0 1px 8px rgba(0,0,0,0.4); }
      :host .cine .vid .hd span { color: rgba(var(--hv-pk, 255,255,255),0.82); font-size: 14px; }
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
      :host .wrap.med.wash > .slab { flex: 1 1 auto; min-height: 0; justify-content: flex-start; gap: 10px; padding: 16px; border-radius: 34px; background: var(--hv-med-slab, rgba(var(--hv-pd, 0,0,0),0.24)); box-shadow: var(--hv-med-slab-sh, inset 0 0 0 0.5px rgba(255,255,255,0.06)); }
      :host .wrap.med.wash .art:not(.ph) { flex: 1 1 0; min-height: 110px; width: 100%; align-self: stretch; display: flex; align-items: center; justify-content: center; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
      :host .wrap.med.wash .art:not(.ph) img { width: auto; height: auto; max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 14px 34px -14px rgba(0,0,0,0.75); }
      /* No artwork while playing: a square placeholder as large as the art would be, never a strip. */
      :host .wrap.med.wash .art.ph { flex: 1 1 0; min-height: 110px; height: auto; width: auto; max-width: 100%; aspect-ratio: 1; align-self: center; }
      :host .wrap.med.wash .trk { margin-top: 4px; }
      :host .wrap.med.wash .tp { padding: 0 28px; }
      :host .wrap .ptile { min-height: 52px; border-radius: 26px; padding: 6px 22px 6px 18px; }
      :host .wrap .fx .act > span { background: none; }
      :host .wrap .act.mode:not(.ft) { flex: 0 1 auto; display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 8px; width: auto; min-width: 110px; max-width: 200px; height: 52px; padding: 0 20px; border-radius: 26px; background: rgba(var(--hv-pd, 0,0,0),0.24); color: var(--hv-pi, var(--hv-pi, #fff)); }
      :host .wrap .act.mode:not(.ft) > span { display: none; }
      :host .wrap .act.mode:not(.ft) small { position: static; width: auto; height: auto; clip-path: none; min-width: 0; max-width: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; font-weight: 600; color: var(--hv-pi, var(--hv-pi, #fff)); }
      :host .wrap .act.mode:not(.ft)::after { content: ""; flex: none; width: 9px; height: 14px; background: rgba(var(--hv-pk, 255,255,255),0.6); -webkit-mask: url("${CHEV_UD}") center / contain no-repeat; mask: url("${CHEV_UD}") center / contain no-repeat; }
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
    :host { display: block; color: var(--hv-pi, #fff); font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    .wrap { position: relative; margin: -8px -8px -20px; width: calc(100% + 16px); min-height: var(--hemma-panel-h, 560px); max-height: calc(100svh - 64px);
      display: flex; flex-direction: column; align-items: center; padding: 44px 18px calc(18px + var(--sab, 0px)); box-sizing: border-box; overflow-y: auto; scrollbar-width: none; }
    .wrap::-webkit-scrollbar { display: none; }
    .hd { flex: none; text-align: center; display: grid; gap: 4px; padding: 0 12px; }
    ${HV_CSS}
    .hd b { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.15; }
    .hd span { font-size: 15px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.75); font-variant-numeric: tabular-nums; }
    .ctl { flex: none; position: relative; width: 94px; height: 264px; margin: auto 0; border: 0; padding: 0; border-radius: 28px; cursor: pointer; touch-action: none;
      background: rgba(var(--hv-pd, 0,0,0),0.2); -webkit-tap-highlight-color: transparent; }
    .wrap.multi { min-height: 0; }
    .multi .ctl { margin: 40px 0 26px; }
    .knob { position: absolute; left: 4px; right: 4px; height: 46%; border-radius: 24px; background: rgba(22,22,22,0.42); display: grid; place-items: center;
      top: calc(100% - 46% - 4px); transition: top .42s cubic-bezier(0.32, 0.72, 0, 1), background-color .3s ease; }
    .ctl.up .knob { top: 4px; }
    .ctl.open .knob { background: var(--hemma-lock-open-fill, var(--hemma-color-teal, #00C3D0)); }
    .knob i { width: 26px; height: 26px; display: block; background: var(--k, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; transition: background-color .3s ease; }
    .ctl.busy .knob i { animation: hemma-lock-pulse 1s ease-in-out infinite alternate; }
    @keyframes hemma-lock-pulse { from { opacity: 1; } to { opacity: 0.35; } }
    .corner { position: absolute; bottom: calc(9px + var(--sab, 0px)); width: 40px; height: 40px; border: 0; padding: 0; border-radius: 50%; cursor: pointer; display: grid; place-items: center; color: var(--hv-pi, #fff);
      ${GLASS_FILL}
      box-shadow: var(--hv-btn-sh, -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28)); }
    .corner.gear { right: 10.5px; }
    .corner:is(.open, .glist) { left: 10.5px; }
    .corner i { width: 20px; height: 20px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .corner.open.fexp i { width: 17px; height: 17px; }
    @media (max-width: 768px) { .corner.open.fexp i { width: 20px; height: 20px; } }
    .tiles { flex: none; width: 100%; display: grid; gap: 8px; }
    .tiles.two { grid-template-columns: 1fr 1fr; }
    .t { height: 62px; border: 0; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(var(--hv-pd, 0,0,0),0.2); color: var(--hv-pi, #fff); font: inherit; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 10px; min-width: 0; cursor: pointer; text-align: left; }
    .t .ti { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(var(--hv-pk, 255,255,255),0.10); transition: background-color .4s ease; }
    .t.on .ti { background: var(--hemma-popup-primary-color, var(--hemma-color-teal, #00C3D0)); }
    .t .ti i { width: 20px; height: 20px; display: block; background: var(--k); transition: background-color .4s ease; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .t.on .ti i { background: #fff; }
    .t:not(.on) .ti i { background: rgba(var(--hv-pk, 255,255,255),0.6); }
    .t .tx { min-width: 0; flex: 1; display: grid; }
    .t b { font-size: 14.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t small { font-size: 13px; opacity: .62; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    .t .chev { width: 7px; height: 12px; flex: none; opacity: .35; }
    .tiles.two .t .chev { display: none; }
    .t { transition: filter .4s ease; }
    @media (hover: hover) { .corner:hover { filter: brightness(1.12); } .t:hover { filter: brightness(0.84); transition: filter .18s ease; } }
    button:focus-visible { outline: 2px solid rgba(var(--hv-pk, 255,255,255),0.7); outline-offset: 2px; }
    @media (max-width: 768px) {
      .wrap, .wrap.multi { min-height: var(--hemma-panel-h, calc(100svh - 120px)); padding-top: 64px; }
      .hd b { font-size: 28px; }
      .hd span { font-size: 17px; }
      .wrap:has(> .ctl) > .hd { gap: 7px; margin-top: 6px; }
      .wrap:has(> .ctl) > .hd :is(b, span) { font-weight: 500; }
      .ctl { width: 122px; height: 342px; border-radius: 40px; }
      .knob { border-radius: 36px; }
      .wrap.cover:has(> .ctl):not(.acts-wrap) { padding-bottom: calc(76px + max(20px, env(safe-area-inset-bottom, 0px))); }
      .wrap.cover:not(.acts-wrap) > .ctl { height: min(342px, max(200px, calc(100svh - env(safe-area-inset-top, 0px) - max(20px, env(safe-area-inset-bottom, 0px)) - 223px - var(--below, 0px)))); margin: auto 0; }
      .wrap.cover:has(> :is(.caps, .ptile, .fpow, .acts)) { --below: 110px; }
      .wrap.cover:has(> .ctiles) { --below: 112px; }
      .wrap.cover:has(> .ctiles[data-n="4"]) { --below: 178px; }
      .wrap.cover:not(.acts-wrap) > .ctl:has(~ :is(.caps, .ctiles, .fpow, .acts, .ptile)) { margin-bottom: 0; }
      .wrap.cover:has(> .ctl):not(.acts-wrap) > :is(.caps, .ctiles, .fpow, .acts, .ptile) { margin: 51px 0 auto; padding-bottom: 0; }
      .wrap.cover:has(> .ctl) > .caps .capsel:only-child { flex: none; width: 240px; height: 54px; border-radius: 27px; }
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
      const allLocked = !unlocked.length, open = new Set(ids.filter((id) => this._door(id)).map((id) => (this._config.doors || {})[id])).size;
      root.querySelector('.hd b').textContent = this._config.name || (multi ? T('locks.popup.title', 'Locks') : this._name(ids[0]));
      root.querySelector('.hd span').textContent = open && !busy ? (open > 1 ? T('locks.n_doors_open', '{n} Doors Open', { n: open }) : T('locks.door_open', 'Door Open'))
        : !multi ? this._stateText(ids[0])
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
    .ctl .glyph { position: absolute; left: 50%; bottom: 18px; width: 26px; height: 26px; transform: translateX(-50%); background: var(--hv-glyph, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    @media (max-width: 768px) { .ctl .glyph { width: 30px; height: 30px; bottom: 24px; } }
    .ctl.closed .glyph, .ctl.shade.open .glyph { background: rgba(var(--hv-pk, 255,255,255),0.55); }
    .t.on .ti { background: var(--hemma-color-teal, #00C3D0); }
    .t.auto .ti { background: rgba(var(--hv-pk, 255,255,255),0.10); }
    .tiles.rows { --lc: var(--hemma-color-teal, #00C3D0); }
    .lr { display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 8px 10px; box-sizing: border-box; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(var(--hv-pd, 0,0,0),0.2); }
    .lr .tg { flex: none; width: 36px; height: 36px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; display: grid; place-items: center; background: rgba(var(--hv-pk, 255,255,255),0.08); color: rgba(var(--hv-pk, 255,255,255),0.45); -webkit-tap-highlight-color: transparent;
      transition: background-color .4s ease, color .4s ease; }
    .lr.on .tg { background: color-mix(in srgb, var(--lc) 24%, transparent); color: var(--lc); }
    .lr .tg i { width: 18px; height: 18px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .lr .nm { flex: 1; min-width: 0; border: 0; background: none; color: inherit; font: inherit; padding: 0; text-align: left; cursor: pointer; display: grid; gap: 1px; }
    .lr b { font-size: 14.5px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr .v { font-size: 12.5px; color: rgba(var(--hv-pk2, 235,235,245),0.6); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lr .pl { position: relative; flex: none; width: 46%; height: 36px; border-radius: 12px; overflow: hidden; background: rgba(var(--hv-pk, 255,255,255),0.08); cursor: pointer; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
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
      if (p <= 0) return this._hass.formatEntityState ? this._hass.formatEntityState(st) : T('security.closed', 'Closed');
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
    .act { position: relative; border: 0; background: none; color: rgba(var(--hv-pk, 255,255,255),0.85); font: inherit; font-size: 12px; padding: 0; display: grid; justify-items: center; gap: 6px; cursor: pointer; min-width: 58px; -webkit-tap-highlight-color: transparent; }
    .act > span { width: 52px; height: 52px; border-radius: 50%; background: rgba(var(--hv-pd, 0,0,0),0.2); display: grid; place-items: center; transition: background-color .2s ease; }
    .act.on > span { background: var(--hemma-color-teal, #00C3D0); }
    .act.on i { background: #fff; }
    .act i { width: 22px; height: 22px; display: block; background: var(--hv-pi, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .act small { font-size: 12px; max-width: 84px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ctl.sw { margin: auto 0 0; }
    .ptile { flex: none; margin: 22px 0 66px; display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 18px 8px 14px; box-sizing: border-box; border: 0; border-radius: 16px; background: rgba(var(--hv-pd, 0,0,0),0.22); color: var(--hv-pi, #fff); font: inherit; text-align: left; cursor: pointer; transition: filter .4s ease; -webkit-tap-highlight-color: transparent; }
    .ptile i { width: 20px; height: 20px; flex: none; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .ptile span { display: grid; gap: 1px; }
    .ptile small { font-size: 12.5px; color: rgba(var(--hv-pk2, 235,235,245),0.6); }
    .ptile b { font-size: 15px; font-weight: 600; }
    .menu { position: absolute; left: 0; top: 0; width: max-content; max-width: calc(100% - 16px); max-height: 70%; overflow-y: auto; padding: 6px; gap: 2px; box-sizing: border-box; border-radius: 18px; border: 0.5px solid rgba(var(--hv-pk, 255,255,255),0.1); background: rgba(36,36,40,0.78); -webkit-backdrop-filter: blur(20px) saturate(140%); backdrop-filter: blur(20px) saturate(140%); box-shadow: 0 16px 40px -12px rgba(0,0,0,0.6); display: grid; z-index: 3; }
    .menu[hidden] { display: none; }
    .cover .ctl:has(+ .fpow) { margin-bottom: 0; }
    .fpow { flex: none; margin: 20px 0 auto; padding-bottom: 66px; }
    .pow { flex: none; width: 52px; height: 52px; border: 0; padding: 0; border-radius: 50%; background: rgba(var(--hv-pd, 0,0,0),0.24); color: var(--hv-pi, #fff); display: grid; place-items: center; cursor: pointer; transition: filter .4s ease, background-color .2s ease; -webkit-tap-highlight-color: transparent; }
    .pow.on { background: rgba(0,195,208,0.24); color: #7fe9f0; }
    .pow svg { width: 22px; height: 22px; }
    .fx { gap: 16px; margin: 20px 0 66px; }
    .fx .act { display: grid; place-items: center; min-width: 0; width: 52px; height: 52px; padding: 0; border-radius: 50%; background: rgba(var(--hv-pd, 0,0,0),0.24); color: var(--hv-pi, #fff); transition: filter .4s ease, background-color .2s ease; }
    .fx .act > span { width: auto; height: auto; background: none; }
    .fx .act i { width: 22px; height: 22px; background: currentColor; }
    .fx .act small { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    .fx .act.on { background: rgba(0,195,208,0.24); color: #7fe9f0; }
    .fx .act.on > span { background: none; }
    @media (hover: hover) { .pow:hover { filter: brightness(0.84); transition: filter .18s ease, background-color .2s ease; } }
    .menu button { position: relative; height: 40px; border: 0; border-radius: 12px; background: none; color: var(--hv-pi, #fff); font: inherit; font-size: 14px; text-align: left; padding: 0 18px 0 12px; white-space: nowrap; display: flex; align-items: center; cursor: pointer; }
    .menu button .mi { flex: none; width: 18px; height: 18px; margin-right: 10px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .menu button.on { background: rgba(var(--hv-pk, 255,255,255),0.1); color: var(--hemma-color-teal, #00C3D0); }
    .act > span { transition: filter .4s ease, background-color .2s ease; }
    @media (hover: hover) { .menu button:hover { background: rgba(var(--hv-pk, 255,255,255),0.08); } .act:hover > span, .ptile:hover, .fx .act:hover { filter: brightness(0.84); transition: filter .18s ease, background-color .2s ease; } }
    @media (max-width: 768px) { .fpow { padding-bottom: 80px; } .acts.fx { margin-bottom: 80px; gap: 20px; } .fanb .ctl { height: 300px; } .acts { margin-bottom: 76px; } .ptile { margin-bottom: 80px; } }
  `;
  const FAN_POWER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v8"/><path d="M7 6.3a7.5 7.5 0 1 0 10 0"/></svg>';
  // Selector: a dark capsule naming the choice, which grows into a frosted menu in its own place and shrinks back once something is picked.
  const CAPS_CSS = `
    .caps { flex: none; align-self: stretch; display: flex; justify-content: center; gap: 10px; margin: 22px 0 var(--caps-mb, 14px); }
    .capsel { position: relative; flex: 0 1 260px; min-width: 0; height: 52px; border: 0; border-radius: 26px; padding: 0 42px; background: rgba(var(--hv-pd, 0,0,0),0.3); color: var(--hv-pi, #fff); font: inherit; font-size: 16px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; cursor: pointer; transition: opacity .2s ease, filter .3s ease; -webkit-tap-highlight-color: transparent; }
    .caps .capsel + .capsel, .caps:has(.capsel + .capsel) .capsel { flex: 1 1 0; padding: 0 34px 0 18px; }
    .capsel span { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .capsel .ud { position: absolute; right: 18px; top: 50%; width: 10px; height: 16px; margin-top: -8px; background: rgba(var(--hv-pk, 255,255,255),0.85); -webkit-mask: url("${CHEV_UD}") center / contain no-repeat; mask: url("${CHEV_UD}") center / contain no-repeat; }
    /* iPad and iPhone: Liquid Glass that takes the capsule's place; the pressed row lights up like a lens. */
    /* On the iPhone: near-clear glass that takes the room's color, a thin bright lens edge all round. */
    .gmenu { position: absolute; z-index: 8; min-width: 200px; padding: 7px; box-sizing: border-box; border-radius: 30px; display: grid; touch-action: none;
      /* Brightened rather than washed white, which would gray it. */
      background: rgba(var(--hv-pk, 255,255,255),0.02);
      -webkit-backdrop-filter: blur(24px) saturate(1.25) brightness(1.2); backdrop-filter: blur(24px) saturate(1.25) brightness(1.2);
      box-shadow: 0 0 0 0.5px rgba(0,0,0,0.42), inset 0 -1px 0 rgba(255,255,255,0.2), inset 0 -7px 9px -7px rgba(255,255,255,0.08), inset 0 9px 11px -9px rgba(255,255,255,0.1),
        inset 0 1px 0 rgba(255,255,255,0.1), 0 18px 44px -14px rgba(0,0,0,0.3); }
    .gmenu button { position: relative; height: 44px; border: 0; border-radius: 22px; background: none; color: var(--hv-pi, #fff); font: inherit; font-size: 17px; font-weight: 400; text-align: left; padding: 0 18px 0 38px; cursor: pointer; white-space: nowrap; -webkit-tap-highlight-color: transparent; transition: background-color .18s ease, box-shadow .18s ease; }
    .gmenu button.hl { background: radial-gradient(130% 160% at 28% 0%, rgba(var(--hv-pk, 255,255,255),0.5), rgba(var(--hv-pk, 255,255,255),0.2) 55%, rgba(var(--hv-pk, 255,255,255),0.1));
      box-shadow: inset 0 0.5px 0 rgba(255,255,255,0.75), inset 0 -0.5px 0 rgba(255,255,255,0.25), 0 6px 16px -8px rgba(0,0,0,0.35); }
    .gmenu button.on::before { content: ""; position: absolute; left: 14px; top: 50%; width: 13px; height: 13px; margin-top: -6.5px; background: #fff;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 8.6 6.3 12.2 13.5 4.2'/%3E%3C/svg%3E") center / contain no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 8.6 6.3 12.2 13.5 4.2'/%3E%3C/svg%3E") center / contain no-repeat; }
    /* The Mac: an ordinary menu opening under the capsule, its row lit in the accent color on hover. */
    .gmenu.mac { min-width: 0; padding: 5px; border-radius: 12px; touch-action: auto;
      /* Mac menu over a popup, measured pixel by pixel: what is behind it brightened about 1.45x with its color kept and no drop shadow;
         a near-black hairline, inside it a light line on top and bottom (about 0.3 white, a faint glow above the bottom one) and a fainter one down the sides (1.2x the fill). */
      background: none;
      -webkit-backdrop-filter: blur(24px) saturate(1.3) brightness(1.45); backdrop-filter: blur(24px) saturate(1.3) brightness(1.45);
      box-shadow: 0 0 0 0.5px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(255,255,255,0.27),
        inset 0 -4px 4px -3px rgba(255,255,255,0.08), inset 1px 0 0 rgba(255,255,255,0.1), inset -1px 0 0 rgba(255,255,255,0.1); }
    .gmenu.mac button { height: 24px; border-radius: 7px; font-size: 13px; font-weight: 400; color: rgba(var(--hv-pk, 255,255,255),0.9); padding: 0 14px 0 25px; transition: none; }
    .gmenu.mac button.on::before { left: 8px; width: 11px; height: 11px; margin-top: -5.5px; }
    .gmenu.mac button.hl { color: var(--hv-pi, #fff); }
    .gmenu.mac button.hl { background: #0a84ff; background: AccentColor; box-shadow: none; }
    .capsel.held, .grp.held, .ct.held, .btn.held { opacity: 0.55; transition: none; }
    .gmenu.act button { padding-left: 18px; }
    .gmenu button:has(.gi) { padding-right: 50px; }
    .gmenu.mac.act button { padding-left: 12px; }
    .gmenu.mac button:has(.gi) { padding-right: 40px; }
    .gmenu .gm { display: block; width: 100%; height: 100%; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .gmenu .gi { position: absolute; right: 16px; top: 50%; width: 19px; height: 19px; margin-top: -9.5px; display: grid; place-items: center; pointer-events: none; }
    .gmenu.mac .gi { right: 10px; width: 14px; height: 14px; margin-top: -7px; }
    .gmenu .gi svg { width: 100%; height: 100%; }
    .gmenu.hv { background: color-mix(in oklab, var(--hv-bg, #49575c) 45%, rgb(34,36,38)); -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.25), 0 14px 36px -10px rgba(0,0,0,0.35); }
    .gmenu.hv.hvday { background: color-mix(in oklab, var(--hv-bg, #97a9ae) 14%, rgb(252,252,253)); box-shadow: 0 0 0 0.5px rgba(0,0,0,0.1), 0 14px 36px -10px rgba(0,0,0,0.22); }
    .gmenu.hv button, .gmenu.hv.mac button { color: #fff; }
    .gmenu.hv.hvday button, .gmenu.hv.hvday.mac button { color: #1c1c1e; }
    .gmenu.hv button.on::before { background: currentColor; }
    .gmenu.hv:not(.mac) button.hl { background: rgba(255,255,255,0.12); box-shadow: none; }
    .gmenu.hv.hvday:not(.mac) button.hl { background: rgba(0,0,0,0.07); }
    .gmenu.hv.mac button.hl { color: #1c1c1e; background: rgba(255,255,255,0.92); }
    .gmenu.hv.hvday.mac button.hl { color: #fff; background: #1c1c1e; }
    @media (max-width: 768px) { .caps { --caps-mb: 80px; } }
  `;
  const capPick = (cap, items, current, onPick, host) => {
    const wrap = host || cap.closest('.wrap');
    const old = wrap.querySelector('.gmenu') || (wrap._gmenu && wrap._gmenu.isConnected ? wrap._gmenu : null);
    if (old) { old._close(); return; }
    const mac = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const m = document.createElement('div');
    const hvc = document.documentElement.classList;
    m.className = 'gmenu' + (mac ? ' mac' : '') + (current == null ? ' act' : '') + (hvc.contains('hemma-hv') ? (hvc.contains('hv-light') ? ' hv hvday' : ' hv') : '');
    m.innerHTML = items.map(([k, l, ic]) => `<button type="button" data-k="${esc(k)}" class="${k === current ? 'on' : ''}">${esc(l)}${ic ? `<i class="gi">${ic}</i>` : ''}</button>`).join('');
    m.style.visibility = 'hidden';
    wrap.appendChild(m);
    const wr = wrap.getBoundingClientRect(), cr = cap.getBoundingClientRect();
    // The Mac's hangs from its field's left edge a little narrower than it; touch's grows out of the field, centered on it.
    const w = mac ? Math.max(cr.width - 8, m.offsetWidth) : Math.max(cr.width, m.offsetWidth);
    let h = m.offsetHeight;
    const left = Math.max(8, Math.min(wr.width - w - 8, mac ? cr.left - wr.left : cr.left - wr.left + cr.width / 2 - w / 2));
    let top, fromClip;
    if (mac) {
      // Under the capsule wherever it fits inside the popup's own edge (not just this panel's); above it otherwise.
      let n = wrap, edge = wr.bottom;
      for (let i = 0; n && i < 14; i++) {
        if (n.classList && n.classList.contains('surface')) { edge = n.getBoundingClientRect().bottom; break; }
        n = n.parentElement || (n.parentNode && n.parentNode.host);
      }
      // Its top edge just over the field's bottom, never covering the field: a Mac menu opens under it, or over it only when there is no room below.
      top = cr.bottom - 2 + h <= edge - 4 ? cr.bottom - wr.top - 2 : cr.top - wr.top - h + 2;
      fromClip = top > cr.top - wr.top ? `inset(0 0 ${h}px 0 round 12px)` : `inset(${h}px 0 0 0 round 12px)`;
    } else {
      // Only what can be seen: the screen inside its safe areas, cut by every box around the menu that clips.
      const sp = document.createElement('div');
      sp.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)';
      document.body.appendChild(sp);
      const sc0 = getComputedStyle(sp);
      const sat = parseFloat(sc0.paddingTop) || 0, sab = parseFloat(sc0.paddingBottom) || 0;
      let vt = sat + 8, vb = window.innerHeight - sab - 8;
      sp.remove();
      for (let n = wrap, i = 0; n && i < 16; i++) {
        if (n.nodeType === 1 && n !== document.documentElement && n !== document.body && getComputedStyle(n).overflow !== 'visible') { const r = n.getBoundingClientRect(); if (r.width > 40 && r.height > 120) { vt = Math.max(vt, r.top + 8); vb = Math.min(vb, r.bottom - 8); } }
        n = n.parentElement || (n.parentNode && n.parentNode.host);
      }
      if (vb - vt < 120) { vt = sat + 8; vb = window.innerHeight - sab - 8; }
      // Too long for that, it keeps to it and scrolls.
      if (h > vb - vt) { h = Math.max(cr.height, vb - vt); Object.assign(m.style, { maxHeight: h + 'px', overflowY: 'auto', touchAction: 'pan-y', overscrollBehavior: 'contain' }); m.classList.add('scroll'); }
      // In the capsule's own place, growing up out of it when it sits low, down from it otherwise; then moved only as far as it takes to be seen whole.
      let vtop = cr.top + cr.height / 2 > (vt + vb) / 2 ? cr.bottom - h : cr.top;
      const hero = [...wrap.querySelectorAll('.ctl, .dial')].find((n) => n.offsetParent !== null && !n.contains(cap) && n.getBoundingClientRect().bottom <= cr.top + 1);
      if (hero) vtop = Math.max(vtop, hero.getBoundingClientRect().bottom + 6);
      vtop = Math.max(vt, Math.min(vtop, vb - h));
      top = vtop - wr.top;
      const cl = Math.max(0, cr.left - wr.left - left), crr = Math.max(0, left + w - (cr.right - wr.left));
      fromClip = `inset(${Math.max(0, cr.top - vtop)}px ${crr}px ${Math.max(0, vtop + h - cr.bottom)}px ${cl}px round 26px)`;
    }
    Object.assign(m.style, { left: left + 'px', top: top + wrap.scrollTop + 'px', width: w + 'px', visibility: '' });
    // A Mac menu is its own window: it hangs under its field even past the popup's edge, and only turns up over it at the bottom of the screen.
    if (mac) {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vt = cr.bottom - 2 + h <= vh - 8 ? cr.bottom - 2 : Math.max(8, cr.top - h + 2);
      const vw = window.innerWidth || document.documentElement.clientWidth;
      Object.assign(m.style, { position: 'fixed', left: Math.max(8, Math.min(cr.left, vw - w - 8)) + 'px', top: vt + 'px', zIndex: '1000' });
      // A layer of its own over the popup: inside it, the popup's glass makes a frame for fixed things and its edge cut the menu off.
      const pop = document.querySelector('home-assistant hemma-popup, hemma-popup');
      const layer = document.createElement('div');
      layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483150;';
      const lr = layer.attachShadow({ mode: 'open' });
      lr.innerHTML = '<style>' + CAPS_CSS + ' .gmenu{pointer-events:auto;}</style>';
      lr.appendChild(m);
      ((pop && pop.parentNode) || document.body).appendChild(layer);
      m._layer = layer;
      wrap._gmenu = m;
    }
    const full = mac ? 'inset(0 round 12px)' : 'inset(0 round 26px)';
    // The Mac's menu is there at once; it only fades on the way out.
    // Touch is liquid glass: the capsule pinches away, a blob of glass swells out of its middle into the menu, and the rows sharpen out of a blur.
    const mr = m.getBoundingClientRect();
    const ox = cr.left + cr.width / 2 - mr.left, oy = cr.top + cr.height / 2 - mr.top;
    // Frame-measured on a humidifier menu (60 fps): the capsule squeezes into a blob, the blob swells tall then wide, the text lands last.
    // Each frame carries its own corner radius: scaling squashes corners, and the blob has to stay round, not turn into a small rectangle.
    const kf = (sx, sy, more) => { const r = Math.min(30, Math.min(w * sx, h * sy) / 2); return { transform: `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`, borderRadius: `${(r / sx).toFixed(1)}px / ${(r / sy).toFixed(1)}px`, ...more }; };
    const sc = (x, y, more) => kf(Math.min(1, (cr.width * x) / w), Math.min(1, (cr.height * y) / h), more);
    // A tall menu keeps the blob near the selector's height until it widens, then takes its full height last.
    const tall = Math.min(1, Math.max(cr.height * 1.6, h * 0.6) / h);
    m.style.transformOrigin = `${ox}px ${oy}px`;
    const rows = () => [...m.querySelectorAll('button')];
    if (!reduce && !mac) {
      // The selector becomes the blob with no gap between them: the glass is already there, faint, as the selector squeezes in.
      // Frame-measured (120 fps): 81% wide at 33ms, 61% at 50ms, then it is the blob.
      cap.animate([{ transform: 'none', opacity: 1, filter: 'blur(0px)' }, { transform: 'scale(0.97, 0.99)', offset: 0.25 }, { transform: 'scale(0.81, 0.94)', opacity: 0.95, filter: 'blur(0.5px)', offset: 0.5 },
        { transform: 'scale(0.61, 0.86)', opacity: 0.55, filter: 'blur(2px)', offset: 0.78 }, { transform: 'scale(0.58, 0.84)', opacity: 0, filter: 'blur(3px)' }], { duration: 64, easing: 'linear', fill: 'forwards' });
      m.animate([
        sc(0.5, 0.95, { opacity: 0.35, offset: 0 }),
        sc(0.36, 1.25, { opacity: 1, offset: 0.12 }),
        sc(0.38, 1.5, { offset: 0.22 }),
        sc(0.52, 1.45, { offset: 0.32 }),
        kf(0.74, tall, { offset: 0.45 }),
        kf(0.95, 0.96, { offset: 0.62 }),
        kf(1.025, 1.02, { offset: 0.8 }),
        kf(1, 1, { opacity: 1, offset: 1 }),
      ], { duration: 320, delay: 45, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'backwards' });
      rows().forEach((b) => b.animate([{ opacity: 0, filter: 'blur(10px)' }, { opacity: 0.6, filter: 'blur(4px)', offset: 0.4 }, { opacity: 1, filter: 'blur(0px)' }], { duration: 120, delay: 95, easing: 'ease-out', fill: 'backwards' }));
    }
    if (mac) cap.classList.add('held'); else if (reduce) cap.style.opacity = '0';
    let done = false;
    const close = (after) => {
      if (done) return; done = true;
      document.removeEventListener('pointerdown', away, true);
      const fin = () => { m.remove(); if (m._layer) m._layer.remove(); if (wrap._gmenu === m) wrap._gmenu = null; cap.style.opacity = ''; cap.classList.remove('held'); if (after) after(); };
      if (reduce || mac) { if (mac && !reduce) { m.style.pointerEvents = 'none'; m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out', fill: 'forwards' }).finished.then(fin, fin); } else fin(); return; }
      // Back the way it came: the menu draws into the capsule's middle as the rows blur away, and the capsule comes back out of it.
      m.style.pointerEvents = 'none';
      rows().forEach((b) => b.animate([{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(8px)' }], { duration: 70, easing: 'ease-in', fill: 'forwards' }));
      m.animate([kf(1, 1, { opacity: 1 }), kf(0.95, 0.95, { offset: 0.15 }), kf(0.75, tall, { opacity: 0.9, offset: 0.4 }), sc(0.6, 1.3, { opacity: 0.7, offset: 0.7 }), sc(0.45, 1.05, { opacity: 0 })],
        { duration: 116, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'forwards' }).finished.then(fin, fin);
      cap.getAnimations().forEach((a) => a.cancel());
      // The field comes back small (61% wide, its words dim), waits a beat, then grows out to full size with a slight overshoot: 116ms to appear, done by 380ms.
      cap.animate([
        { transform: 'scale(0.61, 0.78)', opacity: 0, offset: 0 },
        { transform: 'scale(0.61, 0.8)', opacity: 0.55, offset: 0.08 },
        { transform: 'scale(0.62, 0.82)', opacity: 0.6, offset: 0.25 },
        { transform: 'scale(0.88, 0.97)', opacity: 0.82, offset: 0.45 },
        { transform: 'scale(0.97, 1)', opacity: 0.94, offset: 0.62 },
        { transform: 'scale(1.025, 1)', opacity: 1, offset: 0.85 },
        { transform: 'none', opacity: 1 },
      ], { duration: 270, delay: 110, easing: 'linear', fill: 'backwards' });
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
      // As on iOS: the row under the finger lights while it moves, and lifting the finger picks it. A long list scrolls instead: a drag moves it, a tap picks.
      const scroll = m.classList.contains('scroll');
      let down = false, y0 = 0, moved = false;
      m.addEventListener('pointerdown', (e) => { down = true; y0 = e.clientY; moved = false; if (!scroll) { try { m.setPointerCapture(e.pointerId); } catch (_) {} } light(rowAt(e.clientX, e.clientY)); });
      m.addEventListener('pointermove', (e) => { if (!down) return; if (scroll) { if (Math.abs(e.clientY - y0) > 8) { moved = true; light(null); } return; } light(rowAt(e.clientX, e.clientY)); });
      m.addEventListener('pointerup', (e) => { if (!down) return; down = false; const b = !moved && rowAt(e.clientX, e.clientY); if (b) pick(b); else light(null); });
      m.addEventListener('pointercancel', () => { down = false; light(null); });
      if (scroll) { const on = m.querySelector('button.on'); if (on) m.scrollTop = Math.max(0, on.offsetTop - h / 2 + on.offsetHeight / 2); }
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
      // A Mac's select fields and menus answer a click with the menu alone.
      if (e.pointerType === 'mouse' && el.classList.contains('capsel')) return;
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
      if (e.composedPath().some((n) => n.classList && (n.classList.contains('hemma-saver') || n.classList.contains('saver')))) return;
      // The page that scrolls under the pointer and holds the popup's title as one of its own rows.
      const wrap = e.composedPath().find((n) => n.nodeType === 1 && n.classList && (n.classList.contains('wrap') || n.classList.contains('page')) && n.querySelector(':scope > .hd, :scope > .h')
        && n.scrollHeight > n.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowY));
      if (!wrap || wrap._hv) return;
      wrap._hv = true;
      const hd = wrap.querySelector(':scope > .hd, :scope > .h');
      const cs = getComputedStyle(wrap);
      const bar = document.createElement('div');
      bar.className = 'hvbar';
      bar.innerHTML = '<div><b></b><small></small></div>';
      bar.style.setProperty('--hv-y', -(parseFloat(cs.paddingTop) || 0) + 'px');
      bar.style.setProperty('--hv-l', -(parseFloat(cs.paddingLeft) || 0) + 'px');
      bar.style.setProperty('--hv-r', -(parseFloat(cs.paddingRight) || 0) + 'px');
      wrap.insertBefore(bar, wrap.firstChild);
      const words = () => {
        const t = hd.querySelector('b'), sub = hd.querySelector('span, small');
        bar.querySelector('b').textContent = (t || hd).textContent.trim();
        bar.querySelector('small').textContent = sub ? sub.textContent.trim() : '';
      };
      const sync = () => {
        // In once the large title has gone under the band.
        const on = hd.getBoundingClientRect().bottom <= wrap.getBoundingClientRect().top + 58;
        if (on && !bar.classList.contains('on')) words();
        bar.classList.toggle('on', on);
        wrap.classList.toggle('scrolled', wrap.scrollTop > 2);
        wrap.dispatchEvent(new CustomEvent('hemma-veil', { detail: on, bubbles: true, composed: true }));
      };
      wrap.addEventListener('scroll', sync, { passive: true });
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
        if (k === 'mode') capPick(b, (a.preset_modes || []).map((m) => [m, this._mode(m)]), a.preset_mode, (m) => this._act('set_preset_mode', { preset_mode: m }));
        if (k === 'osc') capPick(b, onOff, a.oscillating ? 'on' : 'off', (v) => this._act('oscillate', { oscillating: v === 'on' }));
        if (k === 'dir') capPick(b, [['forward', T('fan.forward', 'Forward')], ['reverse', T('fan.reverse', 'Reverse')]], a.direction === 'reverse' ? 'reverse' : 'forward', (v) => this._act('set_direction', { direction: v }));
      }; });
      const mode = root.querySelector('.ptile');
      if (mode) mode.onclick = (e) => {
        e.stopPropagation();
        capPick(mode, (this._st().attributes.preset_modes || []).map((m) => [m, this._mode(m)]), this._st().attributes.preset_mode,
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
    .hd small { font-size: 13px; color: rgba(var(--hv-pk2, 235,235,245),0.6); min-height: 1em; transition: opacity .3s ease; }
    .lbl { flex: none; align-self: stretch; display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.6); padding: 16px 6px 8px; }
    .lbl:first-of-type { padding-top: 0; }
    .lbl button { border: 0; background: none; padding: 0; font: inherit; font-size: 14px; font-weight: 600; color: var(--hemma-color-teal, #00C3D0); cursor: pointer; }
    .list { flex: none; align-self: stretch; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(var(--hv-pd, 0,0,0),0.2); overflow: hidden; }
    .list + .list { margin-top: 12px; }
    .li { position: relative; width: 100%; display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 8px 14px 8px 10px; box-sizing: border-box; border: 0; background: none; color: var(--hv-pi, #fff); font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .li + .li::before { content: ""; position: absolute; top: 0; left: 58px; right: 14px; height: .5px; background: rgba(var(--hv-pk, 255,255,255),0.12); }
    @media (hover: hover) { .li:hover::before, .li:hover + .li::before { opacity: 0; } }
    .picker .li { padding: 8px 14px 8px 16px; }
    .picker .li + .li::before { left: 50px; right: 14px; }
    .li .ic { width: 36px; height: 36px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(var(--hv-pk, 255,255,255),0.10); overflow: hidden; }
    .li .ic.logo { border-radius: 9px; }
    .li .ic img { width: 100%; height: 100%; object-fit: cover; }
    .li .ic.nologo::after { content: ""; width: 19px; height: 19px; background: var(--hv-pi, #fff); -webkit-mask: url('${XI.box}') center / contain no-repeat; mask: url('${XI.box}') center / contain no-repeat; }
    .li .ic i { width: 19px; height: 19px; display: block; background: var(--k, var(--hv-pi, #fff)); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .li .tx { flex: 1; min-width: 0; display: grid; gap: 1px; }
    .li b { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .li small { font-size: 12.5px; color: rgba(var(--hv-pk2, 235,235,245),0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    .li .v { flex: none; max-width: 42%; font-size: 15px; color: rgba(var(--hv-pk2, 235,235,245),0.6); font-variant-numeric: tabular-nums; display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .li .v.bsv { max-width: none; gap: 7px; color: rgba(var(--hv-pk, 255,255,255),0.82); font-weight: 600; } .li .v.bsv svg { display: block; flex: none; }
    .li .v.low { color: #FF453A; } .li .v.chg svg { --hv-batt-chg: #34C759; }
    .li.upd b { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.22; }
    .pillb { flex: none; min-width: 74px; height: 30px; box-sizing: border-box; border: 0; border-radius: 15px; padding: 0 14px; font: inherit; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; cursor: pointer; background: var(--hv-pill-bg, rgba(var(--hv-pk, 255,255,255),0.14)); color: var(--hv-pill-ink, var(--hemma-color-teal, #00C3D0)); display: inline-grid; place-items: center; }
    .pillb.warn { color: #FF9F0A; }
    .pillb.busy { color: rgba(var(--hv-pk2, 235,235,245),0.6); cursor: default; }
    .hero { flex: none; width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; background: rgba(48,209,88,0.18); margin: 4px 0 24px; }
    .hero.ok { width: 96px; height: 96px; margin: 0 0 18px; background: linear-gradient(180deg, #3ddc68, #28b84f); box-shadow: 0 14px 30px -12px rgba(40,184,79,0.6), inset 0 1px 0 rgba(255,255,255,0.35); }
    .hero.ok svg { width: 52px; height: 52px; display: block; }
    .body.done { flex: 1 0 auto; justify-content: center; min-height: 260px; }
    .body.done .note { padding-top: 0; font-size: 15px; }
    .hero i { width: 34px; height: 34px; display: block; background: #30D158; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .ptiles { flex: none; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .pt { border: 0; border-radius: var(--hemma-pop-tile-r, 20px); background: var(--hv-tile, rgba(var(--hv-pd, 0,0,0),0.2)); color: var(--hv-pi, #fff); font: inherit; text-align: left; padding: 12px 12px 13px; display: grid; gap: 9px; min-width: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .pt .top { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--hv-tile-head, rgba(var(--hv-pk2, 235,235,245),0.6)); min-width: 0; }
    .pt .top span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pt .top i { flex: none; width: 16px; height: 16px; display: block; background: var(--k, rgba(var(--hv-pk2, 235,235,245),0.6)); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .pt strong { font-size: 24px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .pt strong em { font-style: normal; font-size: 14px; color: rgba(var(--hv-pk2, 235,235,245),0.6); margin-left: 2px; }
    .pt .w { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.6); margin-top: -3px; min-height: 1em; }
    .pt .w.bad { color: var(--hv-pw-ink, var(--hemma-color-orange, #FF9230)); }
    .pt .w:is(.good, .bad)::before { content: ""; display: var(--hv-pw-dot, none); flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--hemma-badge-plant-healthy-color, #34C759); }
    .pt .w.bad::before { background: var(--hemma-color-orange, #FF9500); }
    .pphoto { flex: none; align-self: center; width: 116px; height: 116px; border-radius: 50%; background: rgba(var(--hv-pk, 255,255,255),0.08) center / cover no-repeat; box-shadow: var(--hv-photo-sh, 0 0 0 4px rgba(255,255,255,0.12), 0 14px 30px -14px rgba(0,0,0,0.7)); margin: 0 0 14px; }
    .pphoto[hidden] { display: none; }
    .pt .rng { position: relative; display: block; height: 6px; border-radius: 3px; background: rgba(var(--hv-pk, 255,255,255),0.14); margin: 2px 0 0; }
    .pt .rng i { position: absolute; top: 0; bottom: 0; border-radius: 3px; background: rgba(48,209,88,0.55); }
    .pt .rng s { position: absolute; top: -4px; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.5); }
    .plant .wpill { margin: 0 0 16px; }
    @media (max-width: 768px) { .pphoto { width: 116px; height: 116px; margin-bottom: 12px; } .plant > .slab { margin-top: 0 !important; padding-top: 18px !important; } .plant .wpill { margin-bottom: 10px !important; } }
    .pt .w.good { color: var(--hv-pw-ink, var(--hemma-badge-plant-healthy-color, #44e371)); }
    .note { font-size: 13px; line-height: 1.45; color: rgba(var(--hv-pk2, 235,235,245),0.6); text-align: center; padding: 14px 0 4px; }
    .wpill { flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: rgba(var(--hv-pd, 0,0,0),0.2); font-size: 13px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.6); margin: -6px 0 18px; }
    .wpill i { width: 14px; height: 14px; display: block; background: currentColor; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .wpill:has(.wc:empty) { display: none; }
    .empty { font-size: 15px; color: rgba(var(--hv-pk2, 235,235,245),0.6); padding: 24px 0; }
    .pt { position: relative; }
    .li::after, .pt::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--hv-hov-bg, #000); opacity: 0; transition: opacity .40s ease; pointer-events: none; }
    @media (hover: hover) { .li:hover::after, .pt:hover::after { opacity: var(--hv-hov-op, .14); transition: opacity .18s ease; } .pillb:hover, .lbl button:hover { filter: brightness(1.12); } }
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
  // The color each kind of device's tile uses: teal for locks, cameras and covers, orange for vacuums, green for plants, yellow for lights.
  const BAT_HUE = [[/vacuum|mower/, '255,146,48'], [/lock|keypad|dialpad|doorbell|camera|cctv/, '0,195,208'], [/curtain|door|window|garage|gate|valve|blind|shade/, '0,195,208'],
    [/plant|leaf|flower/, '48,209,88'], [/light|lamp|bulb/, '255,204,0'], [/motion|person|occupancy|smoke|leak|sound|vibration|gas|temp|thermostat|hot_water/, '255,159,10']];
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
      return { icon, name, chg: charging, sub: charging ? T('battery.charging', 'Charging') : area };
    }
    _paint() {
      const root = this.shadowRoot, body = root.querySelector('.body');
      if (!body) return;
      const list = this._list();
      const rows = list.map((e) => ({ id: e.entity_id, pct: Math.round(parseFloat(e.state)), ...this._device(e.entity_id) }));
      const low = rows.filter((r) => r.pct <= BAT_LOW);
      root.querySelector('.hd b').textContent = this._config.name || T('battery.title', 'Batteries');
      root.querySelector('.hd span').textContent = !rows.length ? T('battery.none_found', 'No battery sensors found')
        : low.length ? T('battery.n_low', '{n} low', { n: low.length }) : T('battery.all_healthy', 'All healthy');
      const row = (r) => `<button type="button" class="li" data-id="${esc(r.id)}"><span class="ic" style="background:rgb(${batHue(r.icon)})">${ICO(r.icon, '#fff')}</span>`
        + `<span class="tx"><b>${esc(r.name)}</b>${r.sub ? `<small${r.chg ? ' class="chg"' : ''}>${esc(r.sub)}</small>` : ''}</span>`
        + (() => { const bi = window.hemmaBatteryInfo && window.hemmaBatteryInfo(this._hass.states, r.id), chg = bi && bi.charging;
          return `<span class="v bsv${r.pct <= BAT_LOW ? ' low' : chg ? ' chg' : ''}">${esc(r.pct + '%')}${window.hemmaBatteryGlyph ? window.hemmaBatteryGlyph(r.pct, chg) : ''}</span></button>`; })();
      const html = rows.length ? `<div class="list">${rows.map(row).join('')}</div>` : '';
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
      this.shadowRoot.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${SLAB_CSS}${BIG_CSS}</style><div class="wrap multi lst"><div class="hd"><b></b><span></span></div><div class="body slab"></div><div class="ufoot"></div></div>`;
      const body = this.shadowRoot.querySelector('.body');
      body.style.cssText = 'align-self:stretch;display:flex;flex-direction:column;align-items:center';
      body.onclick = this.shadowRoot.querySelector('.ufoot').onclick = async (e) => {
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
    // Rows change in place as installs move along: a finished one closes up, a moved one slides, and none flash by being rebuilt.
    _rows(body, list, lbl, rows) {
      const E = 'cubic-bezier(0.32, 0.72, 0, 1)', still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const make = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); const el = t.content.firstElementChild; el._h = h; el._ic = (el.querySelector('.ic') || {}).outerHTML || ''; return el; };
      const old = body.querySelector(':scope > .lbl');
      if (lbl) { const nl = make(lbl); if (!old) body.insertBefore(nl, list); else if (old._h !== lbl && old.outerHTML !== nl.outerHTML) old.replaceWith(nl); }
      else if (old) old.remove();
      const have = new Map([...list.children].map((li) => [li.dataset.id, li])), want = new Set(rows.map((r) => r[0]));
      const before = new Map([...have].map(([id, li]) => [id, li.getBoundingClientRect().top]));
      const order = [];
      rows.forEach(([id, h]) => {
        let li = have.get(id);
        if (li) {
          li._gone = 0; clearTimeout(li._goneT);
          if (li._h !== h) {
            const nu = make(h), ic = li.querySelector('.ic');
            if (ic && nu._ic === li._ic) nu.querySelector('.ic').replaceWith(ic);
            li.replaceChildren(...nu.childNodes); li._h = h; li._ic = nu._ic;
          }
        } else { li = make(h); li._new = true; }
        order.push(li);
      });
      [...have].forEach(([id, li]) => {
        if (want.has(id)) return;
        const at = [...list.children].indexOf(li);
        order.splice(Math.min(at, order.length), 0, li);
        if (li._gone) return;
        li._gone = Date.now();
        li._goneT = setTimeout(() => {
          if (!li._gone || !li.isConnected) return;
          const done = () => { li.remove(); if (!list.children.length) { body._html = null; this._paint(); } };
          if (still) return done();
          const cs = getComputedStyle(li), h0 = li.offsetHeight + 'px';
          li.style.overflow = 'hidden';
          li.animate([{ height: h0, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, opacity: 1 }, { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }], { duration: 380, easing: E, fill: 'forwards' }).finished.then(done, done);
        }, 1500);
      });
      order.forEach((li) => list.appendChild(li));
      if (still) { order.forEach((li) => { li._new = false; }); return; }
      order.forEach((li) => {
        if (li._new) {
          li._new = false;
          const cs = getComputedStyle(li), h1 = li.offsetHeight + 'px';
          li.style.overflow = 'hidden';
          const a = li.animate([{ height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }, { height: h1, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, opacity: 1 }], { duration: 380, easing: E });
          a.finished.then(() => { li.style.overflow = ''; }, () => {});
          return;
        }
        const t0 = before.get(li.dataset.id), dy = t0 == null ? 0 : t0 - li.getBoundingClientRect().top;
        if (Math.abs(dy) > 1) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 420, easing: E });
      });
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
      let html = '', foot = '';
      const ready = pending.filter((id) => !S[id].attributes.in_progress);
      let lbl = '', rows = [];
      if (pending.length || restart.length) {
        lbl = (ready.length > 1 ? `<div class="lbl all"><span>${esc(T('updates.available', 'Available Updates'))}</span><button type="button" data-all="${esc(ready.join(','))}">${esc(T('updates.update_all', 'Update All'))}</button></div>` : '');
        rows = pending.map((id) => { const a = S[id].attributes;
            return [id, row(id, a.latest_version || '',
              a.in_progress ? `<span class="pillb busy">${esc(T('updates.updating', 'Updating'))}…</span>` : `<button type="button" class="pillb" data-install="${esc(id)}">${esc(T('updates.update', 'Update'))}</button>`)]; })
          .concat(restart.map((id) => [id, row(id, T('updates.restart_required', 'Restart required'), `<button type="button" class="pillb warn" data-restart="1">${esc(T('updates.restart', 'Restart'))}</button>`)]));
        html += lbl + `<div class="list">` + rows.map((r) => r[1]).join('') + `</div>`;
        foot = (ready.length > 1 ? `<button type="button" class="lpill upill${document.documentElement.classList.contains('hemma-hv') ? ' hv' : ''}" data-all="${esc(ready.join(','))}">${esc(T('updates.update_all', 'Update All'))}</button>` : '');
      } else {
        const core = S['update.home_assistant_core_update'], ver = core && (core.attributes.installed_version || '');
        html += `<span class="hero ok"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 12.4l3.9 3.9 7.7-8.3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg></span><div class="note">${ver ? esc(T('updates.ha_version', 'Home Assistant {v}', { v: ver })) + '<br>' : ''}${esc(T('updates.n_checked', '{n} items checked', { n: ids.length }))}</div>`;
      }
      const uf = root.querySelector('.ufoot');
      if (uf._html !== foot) { uf._html = foot; uf.innerHTML = foot; }
      const list = body.querySelector(':scope > .list');
      if (body._html !== html && list && (rows.length || list.children.length)) { body._html = html; this._rows(body, list, lbl, rows); return; }
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
  const PLANT_KINDS = ['moisture', 'illuminance', 'temperature', 'conductivity', 'humidity', 'battery'];
  const plantAI = window.hemmaPlantAI = window.hemmaPlantAI || { data: {}, ready: false, subs: new Set(), conn: null, unsub: null };
  plantAI.watch = function (hass, fn) {
    plantAI.subs.add(fn);
    const conn = hass && hass.connection;
    if (conn && plantAI.conn !== conn) {
      if (plantAI.unsub) plantAI.unsub.then((u) => u && u()).catch(() => {});
      plantAI.conn = conn; plantAI.ready = false;
      plantAI.unsub = conn.subscribeMessage((d) => { plantAI.data = (d && d.plants) || {}; plantAI.ready = true; plantAI.subs.forEach((f) => f()); },
        { type: 'hemma/plant_ai/subscribe' }).catch(() => null);
    }
    return () => {
      plantAI.subs.delete(fn);
      if (plantAI.subs.size || !plantAI.unsub) return;
      const u = plantAI.unsub; plantAI.unsub = null; plantAI.conn = null; plantAI.ready = false;
      u.then((x) => x && x()).catch(() => {});
    };
  };
  plantAI.assess = (hass, eid) => hass.callWS({ type: 'hemma/plant_ai/assess', entity_id: eid });
  const PAI_CSS = `
    .pai { flex: none; align-self: stretch; box-sizing: border-box; margin-top: 8px; min-height: 54px; padding: 10px 12px 10px 14px; border-radius: var(--hemma-pop-tile-r, 20px); background: var(--hv-tile, rgba(var(--hv-pd, 0,0,0),0.2)); color: var(--hv-pi, #fff); text-align: left; display: flex; align-items: center; gap: 12px; position: relative; }
    .pai[hidden], .pdet[hidden] { display: none; }
    .pai.res { cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .pai .px { flex: 1; min-width: 0; display: grid; gap: 2px; }
    .pai .pk, .pdet .pk { font-size: 13px; font-weight: 600; color: var(--hv-tile-head, rgba(var(--hv-pk2, 235,235,245),0.6)); }
    .pai .ps { margin: 0; font-size: 13px; line-height: 1.3; color: rgba(var(--hv-pk2, 235,235,245),0.6); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .pai.res .ps { -webkit-line-clamp: 1; }
    .pv { display: flex; align-items: center; gap: 7px; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; min-width: 0; }
    .pv i { flex: none; width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
    .good { --c: var(--hemma-color-green, #30D158); }
    .watch { --c: var(--hemma-color-orange, #FF9230); }
    .act { --c: var(--hemma-color-red, #FF4245); }
    .pai .pillb { min-width: 0; }
    .pai .pspin { flex: none; width: 20px; height: 20px; margin-right: 6px; border-radius: 50%; border: 2px solid rgba(var(--hv-pk, 255,255,255),0.18); border-top-color: rgba(var(--hv-pk, 255,255,255),0.75); box-sizing: border-box; animation: paispin 0.9s linear infinite; }
    @keyframes paispin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .pai .pspin { animation-duration: 2.4s; } }
    .pdet { flex: 1 1 auto; min-height: 0; align-self: stretch; box-sizing: border-box; padding: 12px 16px 14px; border-radius: var(--hemma-pop-tile-r, 20px); background: var(--hv-tile, rgba(var(--hv-pd, 0,0,0),0.2)); color: var(--hv-pi, #fff); text-align: left; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
    .pdet::-webkit-scrollbar { display: none; }
    .pdet .mhd { display: flex; align-items: center; gap: 10px; flex: none; }
    .pdet .mhd .back { width: 34px; height: 34px; }
    .pdet .mhd .back svg { width: 9px; height: 15px; }
    .pdet .mt { flex: 1; display: grid; gap: 1px; min-width: 0; }
    .pdet .mt small { font-size: 12px; color: rgba(var(--hv-pk2, 235,235,245),0.5); }
    .pdet p { margin: 0; font-size: 14px; line-height: 1.35; flex: none; }
    .pdet .pcols { display: grid; gap: 10px; flex: none; }
    .pdet .pcols > div { display: grid; gap: 5px; }
    .pdet ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 5px; }
    .pdet li { position: relative; padding-left: 14px; font-size: 13px; line-height: 1.32; color: rgba(var(--hv-pk2, 235,235,245),0.75); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .pdet li::before { content: ""; position: absolute; left: 2px; top: 0.55em; width: 5px; height: 5px; border-radius: 50%; background: rgba(var(--hv-pk2, 235,235,245),0.45); }
    .pdet .tips li::before { background: var(--hemma-color-green, #30D158); }
    .pdet .pillb { flex: none; min-width: 0; padding: 0 12px; font-size: 14px; }
    .pdet .mt .pv span, .pdet .mt small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .wrap.plant, .plant .slab { position: relative; }
    .plant.det .ptiles { opacity: 0; pointer-events: none; }
    .plant.det .pai { visibility: hidden; }
    .pdet.fly { position: absolute; z-index: 2; margin: 0 !important; overflow-y: auto !important; }
    @media (max-width: 768px) {
      .slab .pai, .slab .pdet { background: rgba(var(--hv-pk, 255,255,255),0.08); }
      .slab .pdet { flex: none; overflow: visible; }
      .slab .pdet li { display: block; -webkit-line-clamp: unset; }
    }
    @media (min-width: 769px) {
      :host .wrap.plant { --rmax: 100px; }
      :host .wrap.plant > .hd { margin-bottom: 14px; }
      :host .wrap.plant .pphoto { width: 84px; height: 84px; margin: 0 0 10px; }
      :host .wrap.plant .wpill { margin: 0; padding: 3px 10px; font-size: 12px; gap: 5px; }
      :host .wrap.plant .wpill i { width: 12px; height: 12px; }
      :host .wrap.plant .ptiles { flex: 1 1 auto; min-height: 0; margin: 12px 0 0; gap: 8px; grid-auto-rows: minmax(0, 1fr); max-height: calc(3 * var(--rmax) + 16px); }
      :host .wrap.plant .pt { padding: 9px 11px 10px; gap: 6px; align-content: space-between; }
      :host .wrap.plant .pt .top { font-size: 12px; gap: 6px; }
      :host .wrap.plant .pt .top i { width: 14px; height: 14px; }
      :host .wrap.plant .pt strong { font-size: 20px; }
      :host .wrap.plant .pt strong em { font-size: 12px; }
      :host .wrap.plant .pt .w { font-size: 12px; margin-top: -2px; }
      :host .wrap.plant .pai { margin-top: 10px; }
      :host .wrap.plant .pdet { margin-top: 2px; }
    }
    @media (min-width: 769px) and (pointer: coarse) {
      :host .wrap.plant { --rmax: 128px; }
      :host .wrap.plant .pphoto { width: 110px; height: 110px; margin-bottom: 12px; }
      :host .wrap.plant .pt { padding: 12px 13px 13px; }
      :host .wrap.plant .pt .top { font-size: 13px; }
      :host .wrap.plant .pt strong { font-size: 24px; }
    }
    .pt .car, .pdet .again { display: none; }
    @media (min-width: 769px) {
      :host .wrap.plant .ptiles { flex: 0 1 auto; min-height: 0; display: flex; flex-direction: column; max-height: none; margin: 14px 0 0; padding: 2px 0; border-radius: var(--hemma-pop-tile-r, 20px); background: var(--hv-tile, rgba(var(--hv-pd, 0,0,0),0.2)); overflow: hidden; }
      :host .wrap.plant .pt { width: 100%; display: flex; align-items: center; gap: 10px; padding: 0 14px 0 16px; flex: 0 1 48px; min-height: 36px; border-radius: 0; background: none; }
      :host .wrap.plant .pt + .pt::before { content: ""; position: absolute; left: 44px; right: 0; top: 0; height: 1px; background: rgba(var(--hv-pk, 255,255,255),0.08); }
      :host .wrap.plant .pt .top { flex: 1; gap: 12px; font-size: 15px; color: var(--hv-pi, #fff); }
      :host .wrap.plant .pt .top i { width: 18px; height: 18px; }
      :host .wrap.plant .pt strong { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
      :host .wrap.plant .pt strong em { font-size: 12px; font-weight: 500; }
      :host .wrap.plant .pt.bad strong, :host .wrap.plant .pt.bad strong em { color: var(--hv-pw-ink, var(--hemma-color-orange, #FF9230)); }
      :host .wrap.plant .pt :is(.rng, .w) { display: none; }
      :host .wrap.plant .pt .car { display: block; flex: none; width: 7px; height: 12px; margin-left: 2px; background: rgba(var(--hv-pk2, 235,235,245),0.35); -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 12'%3E%3Cpath d='M1 1l5 5-5 5' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 12'%3E%3Cpath d='M1 1l5 5-5 5' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat; }
      :host .wrap.plant .ptiles > .pt:last-child:nth-child(odd) { width: 100%; justify-self: stretch; }
      :host .wrap.plant .pai.res .ps { -webkit-line-clamp: 2; }
      :host .wrap.plant .pai.res .pillb { display: none; }
      :host .wrap.plant .pai.res::after { content: ""; flex: none; width: 7px; height: 12px; margin-right: 2px; background: rgba(var(--hv-pk2, 235,235,245),0.35); -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 12'%3E%3Cpath d='M1 1l5 5-5 5' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 12'%3E%3Cpath d='M1 1l5 5-5 5' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat; }
      :host .wrap.plant .pdet .mhd .pillb { display: none; }
      :host .wrap.plant .pdet .again { display: block; flex: none; align-self: stretch; margin-top: 4px; }
    }
  `;
  class HemmaPlantPanel extends HTMLElement {
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; this._aiWatch(); if (!this._built) this._build(); else this._paint(); }
    connectedCallback() { this._aiWatch(); }
    disconnectedCallback() { if (this._aiOff) { this._aiOff(); this._aiOff = null; } }
    _aiWatch() { if (!this._aiOff && this._hass && this.isConnected) this._aiOff = plantAI.watch(this._hass, () => this._built && this._paintAI()); }
    _type(eid) {
      const reg = this._hass && this._hass.entities && this._hass.entities[eid], tk = reg && reg.translation_key;
      if (PLANT_KINDS.includes(tk)) return tk;
      if (/^(soil_temperature|vpd|co2|dli|dli_24h|ppfd|total_light_integral)$/.test(tk || '')) return null;
      const id = eid.toLowerCase();
      if (/ppfd|integral|dli|vpd|vapou?r|soil_temp|co2|carbon_dioxide/.test(id)) return null;
      const st = this._hass && this._hass.states[eid], dc = st && st.attributes.device_class;
      if (PLANT_KINDS.includes(dc)) return dc;
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
    _sensors() {
      const S = this._hass.states, own = (Array.isArray(this._config.sensors) ? this._config.sensors : []).filter((s) => typeof s === 'string' && S[s]);
      if (own.length) return own;
      const E = this._hass.entities || {}, p = E[this._config.entity], dev = p && p.device_id;
      return dev ? Object.values(E).filter((e) => e.device_id === dev && /^sensor\./.test(e.entity_id) && S[e.entity_id] && this._type(e.entity_id)).map((e) => e.entity_id) : [];
    }
    _build() {
      if (!this._config || !this._hass) return;
      this._built = true;
      this.shadowRoot.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${SLAB_CSS}${BIG_CSS}${PAI_CSS}</style><div class="wrap multi lst plant"><div class="hd"><b></b><span></span></div><div class="slab"><span class="pphoto"></span><span class="wpill">${ICX(XI.drop)}<span class="wc"></span></span><div class="ptiles"></div><div class="pai" hidden></div><div class="pdet" hidden></div></div></div>`;
      this.shadowRoot.querySelector('.ptiles').onclick = (e) => { const b = e.target.closest('.pt'); if (b) moreInfo(this, b.dataset.id); };
      const check = () => {
        this._aiRefused = '';
        plantAI.assess(this._hass, this._config.entity).catch((err) => {
          this._aiRefused = (err && err.code) || 'failed'; this._paintAI();
          clearTimeout(this._aiT); this._aiT = setTimeout(() => { this._aiRefused = ''; this._paintAI(); }, 5000);
        });
      };
      this.shadowRoot.querySelector('.pai').onclick = (e) => {
        if (e.target.closest('button[data-check]')) return check();
        if (e.currentTarget.classList.contains('res')) { this._aiOpen = true; this._paintAI(); }
      };
      this.shadowRoot.querySelector('.pdet').onclick = (e) => {
        if (e.target.closest('button[data-check]')) { this._aiOpen = false; check(); return; }
        if (e.target.closest('.back')) { this._aiOpen = false; this._paintAI(); }
      };
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
      // A fixed order keeps a card's readings in one place: water, light, temperature, fertilizer, humidity, battery.
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
        return `<button type="button" class="pt${warn ? ' bad' : ''}" data-id="${esc(eid)}"><span class="top">${ic}<span>${esc(NAME[type] || label(eid))}</span></span>`
          + `<strong>${val == null ? '—' : esc(fmt(val))}${val != null && unit ? `<em>${esc(unit)}</em>` : ''}</strong>${bar(type, val)}<span class="w${warn ? ' bad' : w2 ? ' good' : ''}">${esc(w2)}</span><span class="car"></span></button>`;
      }).join('') : `<div class="empty">${esc(T('plant.none_configured', 'No plant sensors configured'))}</div>`;
      if (grid._html !== html) { grid._html = html; grid.innerHTML = html; }
      this._paintAI();
    }
    _paintAI() {
      const root = this.shadowRoot, box = root.querySelector('.pai'), det = root.querySelector('.pdet'), wrap = root.querySelector('.wrap');
      if (!box || !det || !this._hass) return;
      const S = this._hass.states, eid = this._config.entity;
      const able = plantAI.ready && Object.keys(S).some((k) => k.startsWith('ai_task.')) && this._sensors().some((s) => { const t = this._type(s); return t && t !== 'battery'; });
      const r = (able && plantAI.data[eid]) || {}, refused = this._aiRefused;
      const res = able && !refused && r.status !== 'running' && r.status !== 'error' && !!(r.verdict && r.summary);
      if (!res) this._aiOpen = false;
      box.hidden = !able;
      if (!able) { this._aiSync(false); return; }
      const btn = (label) => `<button type="button" class="pillb" data-check="1">${esc(label)}</button>`;
      const row = (text, end) => `<div class="px"><span class="pk">${esc(T('plant.ai_title', 'Assessment'))}</span><p class="ps">${esc(text)}</p></div>${end}`;
      const spin = '<span class="pspin"></span>';
      const ERR = {
        no_ai: T('plant.ai_err_no_ai', 'No AI is set up in Home Assistant.'),
        no_sensors: T('plant.ai_err_no_sensors', 'This plant has no readings to check.'),
        timeout: T('plant.ai_err_timeout', 'The AI took too long to answer.'),
        cooldown: T('plant.ai_err_cooldown', 'Wait a minute before checking again.'),
        busy: T('plant.ai_running', 'Checking the last 7 days…'),
      };
      let cls = '', html, dhtml = '';
      if (r.status === 'running') html = row(T('plant.ai_running', 'Checking the last 7 days…'), spin);
      else if (refused || r.status === 'error') {
        const code = refused || r.error;
        html = row(ERR[code] || T('plant.ai_err_failed', "The check didn't finish."), refused === 'busy' ? spin : btn(T('plant.ai_retry', 'Try Again')));
      } else if (res) {
        cls = ['good', 'watch', 'act'].includes(r.verdict) ? r.verdict : 'watch';
        const head = { good: T('plant.ai_good', 'All good'), watch: T('plant.ai_watch', 'Keep an eye'), act: T('plant.ai_act', 'Act now') }[cls];
        const mins = Math.max(0, Math.round((Date.now() - (r.at || Date.now())) / 60000)), hrs = Math.round(mins / 60), days = Math.round(mins / 1440);
        const when = mins < 1 ? T('time.just_now', 'just now') : mins < 60 ? T('time.min_ago', '{n} min ago', { n: mins })
          : mins < 1440 ? T(hrs === 1 ? 'time.hr_ago' : 'time.hrs_ago', hrs === 1 ? '{n} hr ago' : '{n} hrs ago', { n: hrs })
          : T(days === 1 ? 'time.day_ago' : 'time.days_ago', days === 1 ? '{n} day ago' : '{n} days ago', { n: days });
        const list = (items, c, label) => (Array.isArray(items) && items.length ? `<div><span class="pk">${esc(label)}</span><ul class="${c}">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '');
        html = `<div class="px"><span class="pv"><i></i>${esc(head)}</span><p class="ps">${esc(r.summary)}</p></div>${btn(T('plant.ai_again', 'Check Again'))}`;
        dhtml = `<div class="mhd"><button type="button" class="back" aria-label="${esc(T('ui.back', 'Back'))}">${BACK_SVG}</button><span class="mt"><span class="pv"><i></i><span>${esc(head)}</span></span><small>${esc(T('plant.ai_footer', 'Assessment · {when}', { when }))}</small></span>${btn(T('plant.ai_again', 'Check Again'))}</div>`
          + `<p>${esc(r.summary)}</p><div class="pcols">${list(r.points, 'pts', T('plant.ai_points', 'Observations'))}${list(r.tips, 'tips', T('plant.ai_tips', 'Care tips'))}</div>`
          + `<button type="button" class="pillb again" data-check="1">${esc(T('plant.ai_again', 'Check Again'))}</button>`;
      } else html = row(T('plant.ai_idle', "Checks the last 7 days of readings against this plant's needs."), btn(T('plant.ai_check', 'Check Now')));
      if (box._html !== html) { box._html = html; box.innerHTML = html; }
      box.className = 'pai' + (cls ? ' res ' + cls : '');
      if (det._html !== dhtml) { det._html = dhtml; det.innerHTML = dhtml; }
      det.className = 'pdet' + (cls ? ' ' + cls : '') + (this._aiShown ? ' fly' : '');
      this._aiSync(!!this._aiOpen);
    }
    _aiSync(want) {
      if (want === !!this._aiShown) return;
      this._aiShown = want;
      const root = this.shadowRoot, det = root.querySelector('.pdet'), box = root.querySelector('.pai'), grid = root.querySelector('.ptiles'), wrap = root.querySelector('.wrap');
      if (!det || !box || !grid || !wrap) return;
      const MS = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 440, E = 'cubic-bezier(0.32, 0.72, 0, 1)';
      (this._aiAnims || []).forEach((a) => a.cancel());
      const anims = this._aiAnims = [];
      const at = (el, op) => { let top = 0, left = 0; for (let n = el; n && n !== op; n = n.offsetParent) { top += n.offsetTop; left += n.offsetLeft; } return { top, left, width: el.offsetWidth, height: el.offsetHeight }; };
      if (want) {
        const from = det.classList.contains('fly') ? { top: parseFloat(det.style.top), height: parseFloat(det.style.height) } : null;
        det.hidden = false;
        det.classList.add('fly');
        const op = det.offsetParent || wrap, A = at(box, op), G = at(grid, op);
        const to = { top: G.top, height: A.top + A.height - G.top };
        Object.assign(det.style, { left: A.left + 'px', width: A.width + 'px', top: to.top + 'px', height: to.height + 'px' });
        det.scrollTop = 0;
        wrap.classList.add('det');
        const start = from || { top: A.top, height: A.height };
        det.style.overflowY = 'hidden';
        const grow = det.animate([{ top: start.top + 'px', height: start.height + 'px' }, { top: to.top + 'px', height: to.height + 'px' }], { duration: MS, easing: E });
        anims.push(grow);
        grow.finished.then(() => det.style.removeProperty('overflow-y'), () => {});
        if (!MS) det.style.removeProperty('overflow-y');
        anims.push(grid.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MS * 0.6, easing: 'ease' }));
      } else {
        const op = det.offsetParent || wrap, A = at(box, op);
        const from = { top: parseFloat(det.style.top) || A.top, height: parseFloat(det.style.height) || A.height };
        wrap.classList.remove('det');
        det.scrollTop = 0;
        const done = () => { if (this._aiShown) return; det.hidden = true; det.classList.remove('fly'); ['left', 'width', 'top', 'height', 'overflow-y'].forEach((k) => det.style.removeProperty(k)); };
        det.style.overflowY = 'hidden';
        anims.push(det.animate([{ opacity: 1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: MS, easing: 'ease', fill: 'forwards' }));
        anims.push(grid.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], { duration: MS, easing: 'ease' }));
        const shrink = det.animate([{ top: from.top + 'px', height: from.height + 'px' }, { top: A.top + 'px', height: A.height + 'px' }], { duration: MS, easing: E, fill: 'forwards' });
        anims.push(shrink);
        shrink.finished.then(() => { done(); anims.forEach((a) => a.cancel()); }, () => {});
        if (!MS) done();
      }
    }
  }
  if (!customElements.get('hemma-plant-panel')) customElements.define('hemma-plant-panel', HemmaPlantPanel);

  const HUM_CSS = `
    .hum .ctl .fill { background: var(--hemma-color-humidity, #34C8FA); }
    .hum .ctl.off .fill { background: transparent; }
    .hum .ctl.off .glyph { background: var(--hemma-color-humidity, #34C8FA); }
    @media (min-width: 769px) {
      .wrap.hum .caps { flex-direction: column; align-items: center; gap: 8px; }
      .wrap.hum .caps:has(.capsel) .capsel { flex: none; width: 68%; padding: 0 42px; }
    }
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
        + `<div class="caps">${capButton('cstate')}</div><i class="act pw" style="display:none"></i>`
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
      // One field: the device's modes and Off. A mode picked while off turns it on in that mode.
      root.querySelector('.capsel.cstate').onclick = (e) => {
        const st = this._st(), on = st.state === 'on';
        const items = modes.length ? modes.map((m) => [m, this._mode(m)]) : [['__on', dry ? T('humidifier.dehumidify', 'Dehumidify') : T('humidifier.humidify', 'Humidify')]];
        capPick(e.currentTarget, items.concat([['__off', T('lights.off', 'Off')]]), !on ? '__off' : modes.length ? st.attributes.mode : '__on', async (k) => {
          if (k === '__off') return this._act('turn_off', {});
          if (k === '__on') return this._act('turn_on', {});
          if (this._st().state !== 'on' && (await this._act('turn_on', {})) !== true) return;
          this._act('set_mode', { mode: k });
        });
      };
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
        capPick(mode, modes.map((m) => [m, this._mode(m)]), this._st().attributes.mode, (m) => this._act('set_mode', { mode: m }));
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
      // The state line: Off, Set to 55%, or Rising to 55% while it is working toward it.
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
      if (cs) cs.textContent = !on ? T('lights.off', 'Off') : a.mode && (a.available_modes || []).length ? this._mode(a.mode) : a.device_class === 'dehumidifier' ? T('humidifier.dehumidify', 'Dehumidify') : T('humidifier.humidify', 'Humidify');
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
      await this._hass.callService('humidifier', svc, { entity_id: id, ...data }).catch(() => {});
      return true;
    }
  }
  if (!customElements.get('hemma-humidifier-panel')) customElements.define('hemma-humidifier-panel', HemmaHumidifierPanel);

  // The words for a vacuum, shared by its tile and its popup so the two never disagree.
  window.hemmaVacuumWord = (h, st, kind) => {
    const s = st && st.state;
    if (s === 'cleaning') return kind === 'vm' ? T('vacuum.vacuuming_mopping', 'Vacuuming and Mopping') : kind === 'mop' ? T('vacuum.mopping', 'Mopping') : T('vacuum.cleaning', 'Cleaning');
    if (s === 'returning') return T('vacuum.returning', 'Returning to Dock');
    if (s === 'docked' || s === 'idle') return T('vacuum.ready', 'Ready');
    try { return (h && h.formatEntityState && h.formatEntityState(st)) || s || ''; } catch (_) { return s || ''; }
  };
  const VAC_CSS = `
    .vac .play { flex: none; width: 92px; height: 92px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; background: rgba(var(--hv-pd, 0,0,0),0.2); margin: 64px 0 30px; cursor: pointer; transition: background-color .25s ease; -webkit-tap-highlight-color: transparent; }
    .vac .capb { margin-top: auto; }
    .vac .play i { width: 34px; height: 34px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; transition: background-color .25s ease; }
    .vac .play.run { background: rgba(255,255,255,0.94); }
    .vac .play.run i { background: #1c1c1e; }
    .wheel { flex: none; position: relative; width: 200px; height: 108px; margin: -6px 0 16px; }
    .wheel[hidden] { display: none; }
    .wheel .pillbg { position: absolute; left: 0; right: 0; top: 36px; height: 36px; border-radius: 18px; background: rgba(var(--hv-pk, 255,255,255),0.08); pointer-events: none; }
    .wheel .trk { position: absolute; left: 0; right: 0; top: 36px; transition: transform .42s cubic-bezier(0.32, 0.72, 0, 1); }
    .wheel button { display: block; width: 100%; height: 36px; border: 0; padding: 0; background: none; color: rgba(var(--hv-pk2, 235,235,245),0.4); font: inherit; font-size: 16px; font-weight: 600; cursor: pointer; transition: color .3s ease; -webkit-tap-highlight-color: transparent; }
    .wheel button.on { color: var(--hv-pi, #fff); }
    .capb { flex: none; border: 0; border-radius: 30px; background: rgba(var(--hv-pd, 0,0,0),0.2); color: var(--hv-pi, #fff); font: inherit; min-width: 170px; padding: 11px 28px; display: grid; justify-items: center; gap: 1px; margin-bottom: 76px; cursor: pointer; }
    .capb[hidden] { display: none; }
    .capb b { font-size: 15px; font-weight: 600; }
    .capb small { font-size: 14px; color: rgba(var(--hv-pk2, 235,235,245),0.6); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* The same bottom and height as the corner buttons on each side, so the words sit on their center line. */
    .vfoot { position: absolute; left: 62px; right: 62px; bottom: calc(9px + var(--sab, 0px)); height: 40px; padding: 0; border: 0; background: none; color: rgba(var(--hv-pk2, 235,235,245),0.6); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
    .vfoot[hidden] { display: none; }
    .picker { position: absolute; inset: 0; padding: 72px 18px 18px; display: none; flex-direction: column; overflow-y: auto; }
    .vac.pick > :not(.picker) { visibility: hidden; }
    .vac.pick .picker { display: flex; }
    .picker .ttl { position: absolute; top: 14px; left: 64px; right: 64px; height: 44px; display: grid; place-items: center; font-size: 17px; font-weight: 600; }
    .picker .rdone { position: absolute; top: 14px; right: 14px; width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; cursor: pointer; background: var(--hemma-color-teal, #00C3D0); box-shadow: 0 6px 18px -8px rgba(0,195,208,0.7); -webkit-tap-highlight-color: transparent; }
    .picker .rdone i { width: 20px; height: 20px; display: block; background: #fff; -webkit-mask: url('${XI.check}') center / contain no-repeat; mask: url('${XI.check}') center / contain no-repeat; }
    .picker .rlbl { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 6px 8px; font-size: 15px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.6); }
    .picker .rlbl button { border: 0; background: none; padding: 0; font: inherit; font-size: 15px; font-weight: 500; color: var(--hemma-color-teal, #00C3D0); cursor: pointer; }
    .picker .rnote { padding: 8px 6px 0; font-size: 13px; color: rgba(var(--hv-pk2, 235,235,245),0.6); }
    .picker .li .ck { width: 22px; height: 22px; flex: none; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.4); display: grid; place-items: center; transition: background-color .2s ease, box-shadow .2s ease; }
    .picker .li.on .ck { background: var(--hemma-color-teal, #00C3D0); box-shadow: none; }
    .picker .li.on .ck::after { content: ""; width: 12px; height: 12px; background: #fff; -webkit-mask: url('${XI.check}') center / contain no-repeat; mask: url('${XI.check}') center / contain no-repeat; }
    /* Vacuum on an iPhone: the play button centered 340pt down, the mode wheel well below it, a wide Rooms capsule and room to spare above the corners. */
    @media (max-width: 768px) { .vac .play { width: 112px; height: 112px; margin: 111px 0 84px; background: rgba(var(--hv-pk, 255,255,255),0.18); } .vac .play i { width: 40px; height: 40px; }
      .vac .wheel { margin: 0; width: 188px; } .vac .capb { min-width: 268px; padding: 13px 28px; margin-bottom: 120px; gap: 2px; } .vac .capb b { font-size: 17px; } .vac .capb small { font-size: 17px; color: rgba(var(--hv-pk2, 235,235,245),0.75); max-width: 240px; } .vfoot { position: fixed; left: 84px; right: 84px; bottom: max(20px, env(safe-area-inset-bottom, 0px)); height: 52px; } }
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

  // People: the person first, their photo badged with where they are, a map when they share a location, then a few details.
  const AWAY_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.6 11.9 11 4.35 17.2 9.9M5 10.6V19H17V17M12 13H21'/%3E%3Cpath d='M20.6 10.4 23.2 13 20.6 15.6Z' fill='%23000' stroke-width='.9'/%3E%3C/svg%3E";
  const PERSON_CSS = `
    .wrap.person { padding-top: 46px; }
    .person .av { position: relative; flex: none; width: 104px; height: 104px; margin: 26px 0 0; border-radius: 50%; display: grid; place-items: center; font-size: 38px; font-weight: 700; color: var(--hv-pi, #fff);
      background: linear-gradient(135deg, var(--hemma-color-blue, #0A84FF), #3a5bd9); box-shadow: 0 0 0 3px rgba(255,255,255,0.16); }
    .person .av img { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .person .av img:not([src]) { display: none; }
    .person .zb { position: absolute; right: 0; bottom: 2px; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 0 0 3px rgba(32,32,36,0.95); }
    .person .zb[hidden] { display: none; }
    .person .zb i { width: 17px; height: 17px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .person .pmap { flex: none; align-self: stretch; height: 176px; margin-top: 22px; border-radius: 20px; overflow: hidden; position: relative; background: rgba(var(--hv-pd, 0,0,0),0.22);
      --ha-card-border-radius: 0; --ha-card-background: transparent; --ha-card-box-shadow: none; --ha-card-border-width: 0; }
    .person .pmap[hidden] { display: none; }
    .person .pmap > * { position: absolute; inset: 0; height: 100%; }
    .person .pdet { flex: none; align-self: stretch; margin-top: 12px; border-radius: 18px; background: rgba(var(--hv-pd, 0,0,0),0.22); overflow: hidden; }
    .person .pdet:empty { display: none; }
    /* With no map, as much room under the picture as the map leaves. */
    .person .pmap[hidden] + .pdet { margin-top: 22px; }
    .person .pr { position: relative; min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 16px; font-size: 15px; }
    .person .pr + .pr::before { content: ""; position: absolute; top: 0; left: 16px; right: 16px; height: 0.5px; background: rgba(var(--hv-pk, 255,255,255),0.12); }
    .person button.pr { width: 100%; border: 0; background: none; color: inherit; font: inherit; font-size: 15px; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .person button.pr { transition: background-color .18s ease; }
    .person .pr + .pr::before { transition: opacity .18s ease; }
    /* As the other popups' rows: the row darkens and its dividers step aside. */
    @media (hover: hover) { .person button.pr:hover { background: rgba(var(--hv-pd, 0,0,0),0.14); } .person button.pr:hover::before, .person button.pr:hover + .pr::before { opacity: 0; } }
    .person .pr span { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .person .pr em { font-style: normal; font-weight: 600; color: rgba(var(--hv-pk, 255,255,255),0.82); white-space: nowrap; font-variant-numeric: tabular-nums; display: flex; align-items: center; gap: 7px; }
    .person .pr em svg { display: block; flex: none; } .person .pr em.low { color: #FF453A; } .person .pr em.chg { color: var(--hv-batt-chg-ink, #30D158); }
    @media (max-width: 768px) { .person .av { width: 120px; height: 120px; font-size: 44px; margin-top: 40px; } .person .pmap { height: 220px; } }
  `;
  class HemmaPersonPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; if (!this._built) this._build(); else this._paint(); }
    hemmaHero() { const a = this.shadowRoot.querySelector('.av'); return a ? { el: a, icon: a, clone: () => this._avClone(a) } : null; }
    _avClone(a) {
      const c = cloneShown(a).el, ar = layoutRect(a);
      c.style.boxShadow = getComputedStyle(a).boxShadow;
      const zb = a.querySelector('.zb');
      const old = [...c.children].pop();
      if (zb && !zb.hidden && zb.getBoundingClientRect().width) {
        if (old && old.style.width === zb.offsetWidth + 'px') old.remove();
        const z = cloneShown(zb).el, zr = layoutRect(zb);
        Object.assign(z.style, { position: 'absolute', left: (zr.left - ar.left) + 'px', top: (zr.top - ar.top) + 'px', boxShadow: getComputedStyle(zb).boxShadow });
        [...z.children].forEach((k) => { k.style.position = 'absolute'; });
        c.appendChild(z);
      }
      return c;
    }
    _st() { return this._hass.states[this._config.entity]; }
    _build() {
      if (!this._config || !this._hass || !this._st()) return;
      this._built = true;
      const root = this.shadowRoot;
      root.innerHTML = `<style>${SHEET_CSS}${PERSON_CSS}${BIG_CSS}</style><div class="wrap person"><div class="hd"><b></b><span></span></div>`
        + `<div class="av"><img alt=""><span class="ini"></span><span class="zb" hidden><i></i></span></div><div class="pmap" hidden></div><div class="pdet"></div>`
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button></div>`;
      root.querySelector('.gear').onclick = () => moreInfo(this, this._config.entity);
      this._paint();
    }
    // The phone that places them: their tracker's device, for its name and battery.
    _phone() {
      const h = this._hass, a = this._st().attributes, ents = h.entities || {}, devs = h.devices || {};
      const src = a.source || (a.device_trackers || [])[0], dev = src && ents[src] && ents[src].device_id;
      if (!dev) return null;
      const d = devs[dev] || {};
      const bat = Object.keys(ents).find((id) => ents[id].device_id === dev && id.startsWith('sensor.') && h.states[id] && h.states[id].attributes.device_class === 'battery');
      return { name: d.name_by_user || d.name || '', bat: bat && h.states[bat] };
    }
    _paint() {
      const root = this.shadowRoot, st = this._st(), h = this._hass;
      if (!st || !root.querySelector('.hd')) return;
      const a = st.attributes, s = st.state;
      const name = this._config.name || a.friendly_name || this._config.entity;
      const zone = Object.values(h.states).find((z) => z.entity_id.startsWith('zone.') && z.attributes.friendly_name === s);
      const fmt = h.formatEntityState ? h.formatEntityState(st) : s;
      const where = s === 'home' || s === 'not_home' || !zone ? fmt : T('presence.at', 'At {zone}', { zone: s });
      const t = new Date(st.last_changed), today = new Date().toDateString() === t.toDateString();
      const lang = (h.locale && h.locale.language) || undefined;
      const when = today ? t.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }) : t.toLocaleDateString(lang, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
      root.querySelector('.hd b').textContent = name;
      root.querySelector('.hd span').textContent = where + ' · ' + T('presence.since', 'since {t}', { t: when });
      const img = root.querySelector('.av img');
      if (a.entity_picture) { if (img.getAttribute('src') !== a.entity_picture) img.src = a.entity_picture; } else img.removeAttribute('src');
      root.querySelector('.ini').textContent = a.entity_picture ? '' : String(name).trim().charAt(0).toUpperCase();
      // The badge says where: the house at home, the zone's own icon in a zone, an arrow when out.
      const zb = root.querySelector('.zb'), zi = zb.querySelector('i');
      const zIcon = zone && zone.attributes.icon;
      zb.hidden = false;
      zb.style.background = s === 'not_home' ? 'rgba(142,142,147,0.95)' : 'var(--hemma-color-teal, #00C3D0)';
      const zSet = (u) => { zi.style.setProperty('--i', `url("${u}")`); maskImg(u); };
      zSet(s === 'home' ? iconUrl('home') : zIcon ? mdiFull(zIcon) : AWAY_ICON);
      if (zIcon && s !== 'home') needMdi([zIcon], () => zSet(mdiFull(zIcon)));
      // The map is Home Assistant's own, so it is the live map more-info shows; it only appears when they share a location.
      const map = root.querySelector('.pmap'), gps = a.latitude != null && a.longitude != null;
      map.hidden = !gps;
      if (gps && !this._map && !this._mapBusy) {
        this._mapBusy = true;
        (async () => {
          for (let i = 0; i < 100 && !window.loadCardHelpers; i++) await new Promise((r) => setTimeout(r, 50));
          let helpers = null;
          try { helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null; } catch (_) {}
          if (!helpers) { this._mapBusy = false; return; }
          const hvd = document.documentElement.classList;
          const card = helpers.createCardElement({ type: 'map', entities: [this._config.entity], hours_to_show: 0, default_zoom: 14, theme_mode: hvd.contains('hemma-hv') && hvd.contains('hv-light') ? 'light' : 'dark' });
          card.hass = this._hass;
          map.appendChild(card);
          this._map = card;
          const hide = (n = 0) => {
            const hm = card.shadowRoot && card.shadowRoot.querySelector('ha-map');
            if (hm && hm.shadowRoot && !hm.shadowRoot.querySelector('style[data-h]')) {
              const st = document.createElement('style'); st.dataset.h = '';
              st.textContent = '.leaflet-control-container{display:none!important}';
              hm.shadowRoot.appendChild(st);
              const cs = document.createElement('style');
              cs.textContent = 'ha-icon-button,#root>ha-icon-button{display:none!important}ha-card{border:0!important;border-radius:0!important}';
              card.shadowRoot.appendChild(cs);
            } else if (n < 40) setTimeout(() => hide(n + 1), 150);
          };
          hide();
        })();
      } else if (this._map) this._map.hass = h;
      const rows = [];
      const ph = this._phone();
      if (ph && ph.bat) {
        const bi = window.hemmaBatteryInfo && window.hemmaBatteryInfo(h.states, ph.bat.entity_id);
        const pct = bi ? bi.pct : Math.round(parseFloat(ph.bat.state));
        rows.push([ph.name || T('presence.battery', 'Battery'), pct + '%', (bi && window.hemmaBatteryGlyph ? window.hemmaBatteryGlyph(pct, bi.charging) : ''), bi && bi.charging ? 'chg' : pct <= 20 ? 'low' : '', ph.bat.entity_id]);
      }
      const slug = this._config.entity.split('.')[1];
      const dist = Object.values(h.states).find((x) => x.entity_id.startsWith('sensor.') && x.entity_id.includes(slug) && x.attributes.device_class === 'distance' && /home/.test(x.entity_id));
      if (dist && s !== 'home') rows.push([T('presence.from_home', 'From home'), h.formatEntityState ? h.formatEntityState(dist) : dist.state]);
      if (!gps && s !== 'home') rows.push([T('presence.location', 'Location'), T('presence.not_shared', 'Not shared')]);
      const html = rows.map(([l, v, g, c, id]) => `<${id ? `button type="button" data-id="${esc(id)}"` : 'div'} class="pr"><span>${esc(l)}</span><em${c ? ` class="${c}"` : ''}>${esc(v)}${g || ''}</em></${id ? 'button' : 'div'}>`).join('');
      const det = root.querySelector('.pdet');
      if (det._html !== html) { det._html = html; det.innerHTML = html; det.querySelectorAll('button.pr').forEach((b) => { b.onclick = () => moreInfo(this, b.dataset.id); }); }
    }
  }
  if (!customElements.get('hemma-person-panel')) customElements.define('hemma-person-panel', HemmaPersonPanel);
  // The climate popup's labeled tiles, shared with the fan's so the two read alike.
  const CT_CSS = `
    .ctiles { flex: none; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 18px 0 76px; }
    :is(.ctiles, .ptiles, .mini) > :last-child:nth-child(odd) { grid-column: 1 / -1; justify-self: center; width: calc(50% - 4px); }
    .btns > :last-child:nth-child(odd), .g2 > :last-child:nth-child(odd) { grid-column: 1 / -1; justify-self: center; width: calc(50% - 5px); }
    .ct { min-height: 58px; border: 0; border-radius: 18px; background: rgba(var(--hv-pd, 0,0,0),0.22); color: var(--hv-pi, #fff); font: inherit; display: flex; align-items: center; gap: 10px; padding: 9px 12px; text-align: left; cursor: pointer; min-width: 0; transition: filter .4s ease; -webkit-tap-highlight-color: transparent; }
    .ct i { flex: none; width: 22px; height: 22px; display: block; background: var(--hv-pi, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .ct .tx { display: grid; min-width: 0; }
    .ct small { font-size: 12px; font-weight: 500; color: rgba(var(--hv-pk2, 235,235,245),0.75); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
    .dial .mid small { font-size: 16px; font-weight: 700; letter-spacing: 0.01em; text-transform: uppercase; color: rgba(var(--hv-pk2, 235,235,245),0.36); margin-bottom: 2px; }
    .dial .mid small:empty { display: none; }
    .dial .mid strong { font-size: 60px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
    .dial.off .mid strong { font-size: 54px; }
    .pm { position: absolute; left: 0; right: 0; bottom: 14px; display: flex; justify-content: center; gap: 20px; pointer-events: none; }
    .pm button { pointer-events: auto; width: 38px; height: 38px; border: 0; padding: 0; border-radius: 50%; background: transparent; color: var(--hv-pi, #fff); box-shadow: var(--hv-pm-sh, inset 0 0 0 1.5px rgba(255,255,255,0.85)); background: var(--hv-pm-bg, transparent); display: grid; place-items: center; cursor: pointer; transition: background-color .4s ease, opacity .2s ease; -webkit-tap-highlight-color: transparent; }
    .dial .pm svg { position: static; width: 13px; height: 13px; }
    @media (max-width: 768px) { .pm { bottom: 16px; gap: 24px; } .pm button { width: 46px; height: 46px; } .dial .pm svg { width: 15px; height: 15px; } }
    .dial.off .pm button { opacity: 0.35; pointer-events: none; }
    @media (hover: hover) { .pm button:hover { background: rgba(var(--hv-pk, 255,255,255),0.08); transition: background-color .18s ease; } }
    ${CT_CSS}
    .mini { flex: none; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 0 76px; }
    .mini.rooms .t { height: 58px; border-radius: var(--hemma-pop-tile-r, 20px); gap: 8px; padding: 0 10px; }
    .mini.rooms .t .ti { width: 30px; height: 30px; font-size: 13px; cursor: pointer; transition: background-color .3s ease, color .3s ease; }
    .mini.rooms .t.on .ti { color: var(--hv-pi, #fff); }
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
          capPick(b, (at[def[1]] || []).map((m) => [m, k === 'hvac_mode' ? this._modeName(m) : this._attr(k, m)]), cur,
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
      if (!(this._hold && Date.now() < this._hold) && !(this._was && (this._st() || {}).last_updated === this._was && Date.now() - this._wasAt < 10000)) { this._pend = null; if (a.temperature != null) this._lastT = Number(a.temperature); this._draw(a.temperature != null || this._lastT == null ? Number(a.temperature) : this._lastT); } else this._draw(this._pend);
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
  // Leaflet and the first tiles load once, off screen, while the dashboard sits idle, so a person's map is there when the popup opens.
  if (!window._hemmaMapWarm) {
    window._hemmaMapWarm = true;
    setTimeout(async () => {
      try {
        const h = CAMS.hassNow();
        const who = h && Object.keys(h.states).filter((k) => k.startsWith('person.') && h.states[k].attributes.latitude != null);
        if (!who || !who.length || !window.loadCardHelpers) return;
        const helpers = await window.loadCardHelpers();
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;left:-2000px;top:0;width:400px;height:240px;pointer-events:none;visibility:hidden;';
        document.body.appendChild(box);
        who.slice(0, 3).forEach((id) => { const c = helpers.createCardElement({ type: 'map', entities: [id], hours_to_show: 0, default_zoom: 14 }); c.hass = h; box.appendChild(c); });
        setTimeout(() => box.remove(), 20000);
      } catch (_) {}
    }, 6000);
  }

  // Panels made of widgets (Energy first): a headline, one chart, two small widgets and a second page.
  const WIDGET_CSS = `
    ${HV_CSS}
    :host { display: block; color: var(--hv-pi, #fff); font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); --accent: var(--hemma-color-orange, #FF9230); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
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
    /* Beside the title, not above it, so the second page's header sits where the first page's does. */
    .page.two > .back { position: absolute; left: 14px; top: 36px; z-index: 2; }
    .h b { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.15; }
    .h span { font-size: 15px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.75); font-variant-numeric: tabular-nums; }
    @media (max-width: 768px) { .h b { font-size: 28px; } .h span { font-size: 17px; } }
    .big { flex: none; text-align: center; font-size: 46px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; margin-top: 6px; }
    .big small { font-size: 19px; font-weight: 600; color: rgba(var(--hv-pk, 255,255,255),0.7); margin-left: 4px; letter-spacing: 0; }
    .cap { flex: none; text-align: center; font-size: 14px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.6); margin-top: -12px; }
    .seg { position: relative; flex: none; align-self: center; display: flex; gap: 3px; padding: 3px; background: rgba(var(--hv-pd, 0,0,0),0.2); border-radius: 999px; margin-top: 4px; }
    .seg .sth { position: absolute; top: 3px; left: 3px; width: 0; height: calc(100% - 6px); border-radius: 999px; background: var(--hv-seg-th, rgba(var(--hv-pk, 255,255,255),0.22)); box-shadow: var(--hv-seg-sh, none); pointer-events: none; transform-origin: center; }
    .seg button { position: relative; z-index: 1; border: 0; background: none; color: rgba(var(--hv-pk, 255,255,255),0.72); font: inherit; font-size: 13px; font-weight: 600; padding: 6px 13px; border-radius: 999px; cursor: pointer; transition: color .22s ease; }
    .seg button[aria-pressed="true"] { color: var(--hv-seg-on, var(--hv-pi, #fff)); }
    .w { flex: none; background: rgba(var(--hv-pd, 0,0,0),0.2); border-radius: 20px; padding: 13px 15px; display: grid; gap: 6px; }
    button.w { border: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    button.w { transition: filter .4s ease; }
    @media (hover: hover) { button.w:hover { filter: brightness(0.84); transition: filter .18s ease; } }
    .plot { position: relative; touch-action: pan-y; }
    .enddot { position: absolute; width: 8px; height: 8px; border-radius: 50%; margin: -4px 0 0 -4px; pointer-events: none; }
    .scrub { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .15s ease; }
    .plot.on .scrub { opacity: 1; }
    .scrub .ln { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(var(--hv-pk, 255,255,255),0.5); }
    .scrub .dt { position: absolute; width: 9px; height: 9px; border-radius: 50%; margin: -4.5px 0 0 -4.5px; background: #fff; box-shadow: 0 0 0 2px var(--accent); }
    .scrub .tip { position: absolute; top: -6px; transform: translate(-50%, -100%); white-space: nowrap; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 8px; background: rgba(var(--hv-pd, 0,0,0),0.55); font-variant-numeric: tabular-nums; }
    .scrub .tip small { font-weight: 500; color: rgba(var(--hv-pk, 255,255,255),0.7); margin-left: 4px; }
    .wt { font-size: 12.5px; font-weight: 600; color: rgba(var(--hv-pk, 255,255,255),0.62); display: flex; justify-content: space-between; gap: 8px; font-variant-numeric: tabular-nums; }
    .wv { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .wv small { font-size: 13px; font-weight: 600; color: rgba(var(--hv-pk, 255,255,255),0.62); margin-left: 3px; }
    .g2 { flex: none; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    svg.chart { display: block; width: 100%; height: 96px; }
    .empty { height: 96px; display: grid; place-items: center; font-size: 13px; color: rgba(var(--hv-pk, 255,255,255),0.5); }
    .list { flex: none; background: rgba(var(--hv-pd, 0,0,0),0.2); border-radius: 16px; overflow: hidden; }
    .li { display: flex; align-items: center; gap: 12px; padding: 10px 16px; min-height: 56px; position: relative; font-size: 15px; width: 100%; box-sizing: border-box;
      border: 0; background: none; color: inherit; font: inherit; text-align: left; }
    button.li { cursor: pointer; transition: background-color .3s ease; }
    .li + .li::before { content: ""; position: absolute; top: 0; left: 58px; right: 16px; height: 0.5px; background: rgba(var(--hv-pk, 255,255,255),0.12); }
    .li.plain + .li.plain::before { left: 16px; }
    .ic { width: 30px; height: 30px; border-radius: 8px; flex: none; display: grid; place-items: center; background: var(--c, var(--accent)); }
    .ic i { width: 18px; height: 18px; display: block; background: var(--k, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .n { flex: 1; min-width: 0; display: grid; }
    .n b { font-size: 16px; font-weight: 550; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .n small { font-size: 13px; line-height: 1.15; margin-top: -1px; color: rgba(var(--hv-pk, 255,255,255),0.6); }
    .v { color: rgba(var(--hv-pk, 255,255,255),0.65); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .chev { width: 7px; height: 12px; flex: none; color: rgba(var(--hv-pk, 255,255,255),0.35); }
    .back { flex: none; align-self: flex-start; border: 0; color: var(--hv-pi, #fff); cursor: pointer; width: 44px; height: 44px; padding: 0; border-radius: 50%; display: grid; place-items: center; position: relative;
      ${GLASS_FILL}
      box-shadow: var(--hv-btn-sh, -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28)); }
    .back svg { width: 11px; height: 18px; display: block; transform: translateX(-1px); }
    @media (hover: hover) { button.li:hover, .seg button:not([aria-pressed="true"]):hover { background: rgba(var(--hv-pd, 0,0,0),0.14); } .back:hover { filter: brightness(1.12); }
      button.li:hover::before, button.li:hover + .li::before { opacity: 0; } }
    button:focus-visible { outline: 2px solid rgba(var(--hv-pk, 255,255,255),0.7); outline-offset: -2px; }
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
  // A monotone curve (Fritsch-Carlson): smooth, yet never overshooting a reading or dipping below zero.
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
  // A device's icon from its name when none is chosen in Studio, the same guess the Energy page makes.
  const energyGlyph = (nm) => /\btv\b|television/i.test(nm) ? 'tv' : /ps\d|xbox|switch|console|game/i.test(nm) ? 'console' : /laptop|macbook/i.test(nm) ? 'laptop'
    : /office|desk|computer|\bpc\b|mac|imac/i.test(nm) ? 'desktop' : /lab|server|nas|rack|router|network/i.test(nm) ? 'network'
    : /fridge|freezer/i.test(nm) ? 'fridge' : /lamp|light/i.test(nm) ? 'lamp' : /speaker|sonos|homepod/i.test(nm) ? 'speaker' : /fan/i.test(nm) ? 'fan' : 'plug';
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
      // A currency reads $34.55 at one size.
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
        return `<button type="button" class="li" data-id="${esc(r.id)}" style="--c:rgba(var(--hv-pk, 255,255,255),0.1);--k:var(--hv-pi, #fff)"><span class="ic"><i style="--i:url('${esc(iconUrl(icons[r.id] || energyGlyph(nameOf(r.id))))}')"></i></span>`
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
        .hi { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; background: var(--hv-hi-bg, var(--c)); flex: none; }
        .hi i { width: 16px; height: 16px; display: block; background: var(--hv-hi-ink, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
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
    .sum strong { font-size: 34px; font-weight: var(--hv-sum-w, 300); letter-spacing: -0.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .sum span { font-size: 14px; color: rgba(var(--hv-pk2, 235,235,245),0.6); }
    .rm { flex: none; font-size: 15px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.85); padding: 6px 4px 0; }
    .tl { flex: none; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 62px; grid-auto-flow: row dense; gap: 8px; }
    .t { height: 62px; border-radius: var(--hemma-pop-tile-r, 20px); background: rgba(var(--hv-pd, 0,0,0),0.2); display: flex; align-items: center; gap: 10px; padding: 0 12px 0 10px; min-width: 0;
      border: 0; color: var(--hv-pi, #fff); font: inherit; text-align: left; cursor: pointer; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    .t .ti { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(var(--hv-pk, 255,255,255),0.10); }
    .t .ti.num { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
    .t.tall { grid-row: span 2; height: auto; flex-direction: column; align-items: flex-start; justify-content: space-between; padding: 12px; }
    .t.tall .tx { align-self: stretch; }
    .t .g { width: 20px; height: 20px; display: block; background: var(--hv-g-ink, var(--c)); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .t .tx { min-width: 0; display: grid; }
    .t b { font-size: 14.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t small { font-size: 13px; color: rgba(var(--hv-pk2, 235,235,245),0.62); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t { transition: filter .4s ease; }
    @media (hover: hover) { .t:hover { filter: brightness(0.84); transition: filter .18s ease; } }
    /* The Mac's wide sensor popup: three 52pt tiles across with a bare glyph, a thermostat two rows tall with its temperature large. */
    @media (min-width: 769px) and (pointer: fine) {
      :host(.wide) .tl { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 52px; gap: 8px; }
      :host(.wide) .t { height: 52px; gap: 10px; padding: 0 10px 0 13px; border-radius: 16px; }
      :host(.wide) .t .ti:not(.num) { width: 20px; height: 20px; background: none; }
      :host(.wide) .t:has(.ti.num) { grid-row: span 2; height: auto; flex-direction: column; align-items: flex-start; justify-content: space-between; padding: 10px 12px 11px; }
      :host(.wide) .t .ti.num { display: block; width: auto; height: auto; background: none; border-radius: 0; font-size: 30px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; }
      :host(.wide) .t .ti.num::after { content: "°"; }
      :host(.wide) .t:has(.ti.num) .tx { align-self: stretch; }
      :host(.wide) .rm { padding-top: 4px; }
      :host(.wide) .one { padding-bottom: 24px; }
    }
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
      this.classList.toggle('wide', true);
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
      root.innerHTML = `<style>${WIDGET_CSS}${SLAB_CSS} :host { --accent: var(--hemma-color-blue, #0088FF); } @media (max-width: 768px) { .wrap:has(.slab) { padding-bottom: 64px; } .slab { max-height: calc(100svh - 280px); } }
        .acts .li.done .n b { color: var(--hemma-color-green, #30D158); }
        .acts .li.done { cursor: default; }
        .acts .li { overflow: hidden; }
        .acts .li > .ic, .acts .li > .n { transition: transform .36s cubic-bezier(.36,0,.16,1); }
        .acts .li.armed > .ic, .acts .li.armed > .n { transform: translateX(-92px); }
        .acts .ok { position: absolute; top: 0; bottom: 0; right: 0; width: 92px; padding: 0 10px; box-sizing: border-box; display: grid; place-items: center; border: 0; border-radius: 0; background: #FF453A; color: #fff;
          font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; transform: translateX(100%); transition: transform .36s cubic-bezier(.36,0,.16,1); }
        .acts .li:not(.armed) .ok { pointer-events: none; }
        .acts .li.armed .ok { transform: none; }
        @media (hover: hover) { .acts .ok:hover { background: #FF6961; } }
        @media (max-width: 768px) {
          .slab .acts { margin-left: -20px; margin-right: -20px; }
          .slab:has(> .acts:last-child) { padding-bottom: 0; }
          .slab > .acts:last-child { margin-bottom: 0; }
          .slab .acts .li { padding-left: 20px; padding-right: 20px; }
          .slab .acts .li + .li::before { left: 68px; right: 20px; }
          .slab .stats:not(:empty) + .acts { margin-top: -14px; }
          .slab .stats:not(:empty) + .acts .li:first-child::before { content: ""; position: absolute; top: 0; left: 68px; right: 20px; height: .5px; background: rgba(255,255,255,0.12); }
        }</style>`
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
    setConfig(c) { this._config = c || {}; this._built = false; this.classList.toggle('saver', !!this._config.saver); this.classList.toggle('flat', !!this._config.flat); }
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
      // On the phone the panel is a swipe-through: one big poster at a time, the panel tinted by its artwork.
      const phone = true;
      const byNew = movies.concat(shows).sort((a, b) => new Date(b.airdate) - new Date(a.airdate));
      root.innerHTML = `<style>${WIDGET_CSS}${SLAB_CSS} :host { --accent: var(--hemma-color-gold, #e5a00d); }
        .wrap:has(.slab.rc) { box-sizing: border-box; padding-bottom: 0; overflow: hidden; }
        @media (min-width: 769px) { :host { --hv-pi: #fff; --hv-pk: 255,255,255; --hv-pk2: 235,235,245; --hv-pd: 0,0,0; --hv-sub2: rgba(235,235,245,0.6); --primary-text-color: #fff; --secondary-text-color: rgba(235,235,245,0.6); color: #fff; } }
        .slab.rc { position: relative; flex: 1 1 auto; display: block; min-height: 470px; padding: 0; overflow: hidden; touch-action: pan-y; isolation: isolate; --hv-pi: #fff; --hv-pk: 255,255,255; --hv-pk2: 235,235,245; --hv-pd: 0,0,0; --primary-text-color: #fff; --secondary-text-color: rgba(235,235,245,0.6); color: #fff; }
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
        @media (max-width: 768px) { :host(:not(.saver)) .one:has(> .slab.rc) { padding-bottom: 64px; } }
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
        :host(.saver) { position: absolute; inset: 0; display: block; }
        :host(.saver) .wrap { position: absolute; inset: 0 !important; margin: 0 !important; height: auto !important; max-height: none !important; padding: 0 !important; border-radius: 0 !important; }
        :host(.saver) .page.one { position: absolute; inset: 0 !important; margin: 0 !important; height: auto !important; max-height: none !important; padding: 0 !important; }
        :host(.saver) .rc .rdet .bdrop { margin: 0 0 -126px; border-radius: 22px 22px 0 0; overflow: hidden; }
        :host(.saver) .rc > .rback { width: 52px; height: 52px; }
        :host(.saver) .rc > .rback svg { width: 14px; height: 23px; }
        :host(.saver) .one > .h { display: none !important; }
        :host(.saver) .slab.rc { position: absolute; inset: 0; min-height: 0; border-radius: 0; }
        :host(.saver) .slab.rc .rtrack { top: var(--ss-top, 120px); }
        :host(.saver) .slab.rc { --rc-mt: calc(var(--ss-top, 120px) + var(--rch, 309px) + 30px); }
        :host(.saver) .rc .po.rcard .art { border-radius: 18px; box-shadow: 0 40px 90px -30px rgba(0,0,0,0.9); }
        :host(.saver) .rc .rmeta b { font-size: 34px; font-weight: 700; letter-spacing: -0.012em; line-height: 1.15; -webkit-line-clamp: 1; } :host(.saver) .rc .rmeta span { font-size: 17px; font-weight: 600; color: rgba(255,255,255,0.78); margin-top: 6px; } :host(.saver) .rc .rmeta small { font-size: 15px; font-weight: 500; margin-top: 4px; color: rgba(255,255,255,0.5); }
        :host(.saver) .rc .rmeta small .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--hemma-color-orange, #FF9F0A); margin-right: 8px; vertical-align: 2px; }
        :host(.saver) .rc .rdk { background: radial-gradient(70% 60% at 50% 45%, rgba(0,0,0,0.4), rgba(0,0,0,0.72)); }
        :host(.saver.flat) .rc .rw { display: none; }
        :host(.saver.flat) .slab.rc { background-color: var(--flat, #2c2c2e); transition: background-color 1s ease; }
        :host(.saver.flat) .rc .rdk { background: radial-gradient(120% 90% at 50% 20%, rgba(255,255,255,0.16), rgba(255,255,255,0) 55%), radial-gradient(120% 80% at 50% 100%, rgba(0,0,0,0.3), rgba(0,0,0,0) 60%); } :host(.saver) .rc .rmeta small svg { width: 16px; height: 16px; }
        :host(.saver) .rc .rdots { top: auto; bottom: max(24px, env(safe-area-inset-bottom, 0px)); }
        /* As a screensaver the details take the whole screen: the fanart behind everything, the poster large on the left, the words at TV size. */
        :host(.saver) .rc .rdet { --dt: max(120px, calc(50vh - min(28vw, 340px) * 0.75)); left: 0; right: 0; padding: var(--dt) 72px 64px calc(72px + min(28vw, 340px) + 56px) !important; }
        :host(.saver) .rc > .bdstat { display: none !important; }
        :host(.saver) .rc .rdet .bdrop { position: fixed; inset: 0; height: auto; margin: 0; border-radius: 0; z-index: -1; }
        .rc .rdet .bdrop { transition: opacity .6s ease; }
        .rc .rdet .bdrop.wait { opacity: 0; transition: none; }
        :host(.saver) .rc .rdet .bdrop::after { background: linear-gradient(90deg, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.5) 48%, rgba(0,0,0,0.08) 85%), linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0) 50%); }
        :host(.saver) .rc .rdet .hero { display: block; margin: 0; }
        :host(.saver) .rc .rdet .pst { position: fixed; left: 72px; top: calc(var(--dt) + 4px); transform: none; width: min(28vw, 340px); height: auto; aspect-ratio: 2 / 3; border-radius: 18px; background-size: cover; box-shadow: 0 40px 90px -30px rgba(0,0,0,0.9); }
        :host(.saver) .rc .rdet .hx { gap: 12px; }
        :host(.saver) .rc .rdet .t1 { font-size: 56px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.05; -webkit-line-clamp: 3; }
        :host(.saver) .rc .rdet .meta { font-size: 22px; white-space: normal; }
        :host(.saver) .rc .rdet .chips { gap: 10px; margin-top: 8px; }
        :host(.saver) .rc .rdet .chip { font-size: 17px; padding: 5px 12px; border-radius: 9px; }
        :host(.saver) .rc .rdet .seen { font-size: 17px; white-space: normal; }
        :host(.saver) .rc .rdet .det > p { font-size: 22px; line-height: 1.5; max-width: 760px; }
        :host(.saver) .rc .rdet .det { max-width: 820px; gap: 14px; }
        :host(.saver) .rc .rdet .sl { font-size: 20px; margin-top: 10px; }
        :host(.saver) .rc .rdet .epr b { font-size: 19px; } :host(.saver) .rc .rdet .epr .em { font-size: 15px; } :host(.saver) .rc .rdet .epr .es { font-size: 17px; }
        :host(.saver) .rc > .rback { left: 36px; top: max(32px, calc(env(safe-area-inset-top, 0px) + 14px)); }
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
        .h span { font-size: 15px; font-weight: 600; color: rgba(var(--hv-pk2, 235,235,245),0.6); font-variant-numeric: tabular-nums; }
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
        // On the phone the details open inside the same panel, over the same artwork wash.
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
    // The fanart arrives after the page does; it fades in once decoded rather than popping in.
    const bu = bdrop && /url\(["']?([^"')]+)/.exec(bdrop.style.backgroundImage);
    if (bu) {
      bdrop.classList.add('wait');
      const im = new Image();
      im.src = bu[1];
      const show = () => bdrop.classList.remove('wait');
      (im.decode ? im.decode() : Promise.resolve()).then(show, show);
    }
    twin.style.display = 'none';
    twin.style.backgroundImage = bdrop ? bdrop.style.backgroundImage : '';
    if (!d._stretch) {
      d._stretch = true;
      // Pulled past the top, the twin takes over and grows by the pull, so the art stretches into the gap.
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
    // Expand: the text's own height animates, so the card grows and shrinks rather than jumping.
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
      const k = rc.offsetWidth ? r0.width / rc.offsetWidth : 1;
      const g = document.createElement('span');
      g.className = 'rfly';
      g.style.cssText = `position:absolute;z-index:5;left:${(b.left - r0.left) / k}px;top:${(b.top - r0.top) / k}px;width:${b.width / k}px;height:${b.height / k}px;border-radius:12px;background:${getComputedStyle(from).backgroundImage} center / cover no-repeat;box-shadow:0 22px 40px -16px rgba(0,0,0,0.85);pointer-events:none;transform-origin:0 0;`;
      rc.appendChild(g);
      const sx = a.width / b.width, sy = a.height / b.height;
      const an = g.animate([{ transform: `translate(${(a.left - b.left) / k}px, ${(a.top - b.top) / k}px) scale(${sx}, ${sy})`, borderRadius: `${14 / sx}px / ${14 / sy}px` }, { transform: 'none', borderRadius: '12px' }], { duration: dur, easing: EASE });
      from.style.visibility = 'hidden'; to.style.visibility = 'hidden';
      an.finished.then(() => { g.remove(); from.style.visibility = ''; to.style.visibility = ''; }, () => { g.remove(); from.style.visibility = ''; to.style.visibility = ''; });
      return an;
    };
    const cur = () => [...rc.querySelectorAll('.rcard')].reduce((best, c) => (Number(c.style.zIndex || 0) > Number((best && best.style.zIndex) || -1) ? c : best), null);
    const src = cur(), art = src && src.querySelector('.art');
    // Safari mis-draws the details' fixed fanart and poster inside a drifting layer, so the drift waits while they are open.
    this.classList.add('held');
    rc.classList.add('detail');
    requestAnimationFrame(() => fly(art, d.querySelector('.pst'), 520));
    this.dispatchEvent(new CustomEvent('hemma-deep', { detail: true, bubbles: true, composed: true }));
    bk.onclick = () => {
      twin.style.display = 'none';
      if (bdrop) bdrop.style.visibility = '';
      const pst = d.querySelector('.pst');
      const a2 = cur(), art2 = a2 && a2.querySelector('.art');
      rc.classList.remove('detail');
      this.classList.remove('held');
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
        if (this._config.flat) { try { const p1 = document.createElement('canvas'); p1.width = p1.height = 1; const g = p1.getContext('2d'); g.drawImage(to, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; const l = 0.3 * d[0] + 0.59 * d[1] + 0.11 * d[2], m = (c) => Math.max(0, Math.min(255, (l + (c - l) * 0.6) * 0.8)) | 0; slab.style.setProperty('--flat', `rgb(${m(d[0])},${m(d[1])},${m(d[2])})`); } catch (_) {} }
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
      const saver = this._config.saver, H = slab.clientHeight || 600;
      const tall = saver && H > w * 1.1;
      const cw = saver ? Math.round(Math.max(140, tall ? Math.min(480, w * 0.56, (H - 370) / 1.5) : Math.min(380, w * 0.3, (H - 370) / 1.5))) : Math.round(Math.min(206, w * 0.56, (h - 230) / 1.5));
      // The poster, the 34pt title and its meta line, centered as one group (30 + 41 + 25 below the poster).
      if (saver) slab.style.setProperty('--ss-top', Math.max(tall ? 200 : 80, Math.round((H - cw * 1.5 - 96) / 2)) + 'px');
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
      const gen = this._config.saver && !it.eps && it.genres ? String(it.genres).split(',').map((g) => g.trim()).filter(Boolean).slice(0, 2).join(' \u00b7 ') : '';
      const sub = [gen, F.first(it), F.second(it)].filter(Boolean).join(' \u00b7 ');
      if (this._config.saver) { this._raAt = it.airdate; this.dispatchEvent(new CustomEvent('hemma-ra-item', { detail: it.airdate })); }
      // The screensaver reads like Plex's own detail page: the title, what it is, then the runtime and when it was added.
      if (this._config.saver) {
        const yr = (String(it.aired || '').match(/^(\d{4})/) || [])[1] || '', g1 = F.clean(it.genres).split(',')[0].trim();
        const grp = !!(it.eps && it.eps.length > 1);
        const l2 = grp ? F.first(it) : it.tv ? [F.clean(it.number), F.second(it)].filter(Boolean).join(' \u00b7 ') : [g1, yr].filter(Boolean).join(' \u00b7 ');
        const rt = Number(it.runtime) || 0, h = Math.floor(rt / 60), m = rt % 60;
        const run = grp || !rt ? '' : !h ? T('plex.runtime_m', '{m} min', { m }) : !m ? T('plex.runtime_h', '{h} hr', { h }) : T('plex.runtime_hm', '{h} hr {m} min', { h, m });
        const at = new Date(it.airdate), d0 = new Date(); d0.setHours(0, 0, 0, 0);
        const a0 = new Date(at); a0.setHours(0, 0, 0, 0);
        const n = Math.round((d0 - a0) / 864e5), lang = (this._hass && this._hass.language) || undefined;
        const day = isNaN(at) ? '' : n <= 0 ? T('saver.today', 'Today').toLocaleLowerCase(lang) : n === 1 ? T('time.yesterday', 'Yesterday').toLocaleLowerCase(lang) : n < 7 ? at.toLocaleDateString(lang, { weekday: 'long' }) : at.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
        const l3 = [run, day ? T('plex.added', 'Added {t}', { t: day }) : ''].filter(Boolean).join(' \u00b7 ');
        meta.innerHTML = `<b>${esc(F.clean(it.title))}</b>${l2 ? `<span>${esc(l2)}</span>` : ''}${l3 ? `<small>${esc(l3)}</small>` : ''}`;
        if (anim) { meta.classList.remove('sw'); void meta.offsetWidth; meta.classList.add('sw'); }
        dots.forEach((d, k) => d.classList.toggle('on', k === i));
        washTo(F.url(it.poster || it.fanart), true);
        return;
      }
      meta.innerHTML = `<b>${esc(F.clean(it.title))}</b>${sub ? `<span>${esc(sub)}</span>` : ''}${this._config.saver ? '' : `<small>${watched ? CK + esc(T('plex.watched', 'Watched')) + ' \u00b7 ' : this._config.saver ? '<i class="dot"></i>' : ''}${esc(T('plex.added', 'Added {t}', { t: F.ago(it.airdate) }))}</small>`}`;
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
    // As a screensaver it moves on by itself, and holds still while someone is browsing or reading a poster's details.
    if (this._config.saver && items.length > 1) {
      let touched = 0;
      slab.addEventListener('pointerdown', () => { touched = Date.now(); }, true);
      clearInterval(this._ssTick);
      this._ssTick = setInterval(() => {
        if (!this.isConnected) { clearInterval(this._ssTick); return; }
        if (slab.classList.contains('detail') || Date.now() - touched < 15000) return;
        if (idx >= items.length - 1 && this._raOnWrap) { const f = this._raOnWrap; this._raOnWrap = null; f(); return; }
        go(idx >= items.length - 1 ? 0 : idx + 1);
      }, Math.max(4, Number(this._config.every) || 6) * 1000);
    }
    if (window.ResizeObserver) new ResizeObserver(() => { size(); layout(pos); if (wsrc && washSize()[3] !== cv.height) washTo(wsrc, false); }).observe(slab);
    // Each dot sits in a 44pt-tall target, and a tap goes straight to its title.
    slab.querySelector('.rdots').onclick = (e) => { const b = e.target.closest('b[data-k]'); if (b) go(Number(b.dataset.k)); };
    // A tap on the centered poster opens its page; a tap on a side one brings it to the middle.
    cards.forEach((c, i) => { const open = c.onclick; c.onclick = (e) => { if (track._dragged) return; if (i !== idx) go(i); else if (open) open.call(c, e); }; });
    this._rewash = () => { if (wsrc) washTo(wsrc, false); };
    // iPad Safari keeps a canvas drawn while covered or off screen blank until it is drawn again, so the screensaver redraws once it is surely on top.
    if (this._config.saver) setTimeout(this._rewash, 1800);
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
  // Recently Added as a screensaver: full screen, moving on by itself, the time in the corner. Tapping a poster opens its details as in the popup; any other tap goes back to the dashboard.
  const SAVER = { layer: null, last: Date.now() };
  const SAVER_GLOWS = new Map();
  // The artwork's color, shared by every screensaver, so moving between them never starts over from the default.
  const SAVER_ART = new Map();
  const saverCss = `
    :host { position: fixed; inset: 0; z-index: 2147483080; display: block; background: #000; color: #fff; font-family: var(--primary-font-family, var(--hemma-font, -apple-system, system-ui, sans-serif)); -webkit-user-select: none; user-select: none; }
    .clock { position: absolute; z-index: 5; left: max(36px, env(safe-area-inset-left, 0px)); top: max(30px, calc(env(safe-area-inset-top, 0px) + 12px)); pointer-events: none; text-shadow: 0 2px 20px rgba(0,0,0,0.35); }
    .clock b { display: block; font-size: 64px; font-weight: 700; letter-spacing: -0.025em; line-height: 1; font-variant-numeric: tabular-nums; }
    .clock small { display: block; margin-top: 8px; font-size: 22px; font-weight: 700; color: #fff; }
    .clock small span { color: rgba(235,235,245,0.55); }
    .lbl { display: none; position: absolute; z-index: 5; right: max(36px, env(safe-area-inset-right, 0px)); top: max(34px, calc(env(safe-area-inset-top, 0px) + 16px)); text-align: right; pointer-events: none; text-shadow: 0 2px 20px rgba(0,0,0,0.35); }
    .lbl b { display: block; font-size: 36px; font-weight: 700; letter-spacing: -0.01em; }
    .lbl b span { opacity: .5; }
    .lbl small { display: block; margin-top: 4px; font-size: 19px; font-weight: 500; color: rgba(235,235,245,0.75); }
    .clock, .lbl, .mini { transition: transform 2s ease, opacity .3s ease; }
    hemma-recent-panel { position: absolute; inset: 0; transition: transform 2s ease; }
    /* Something playing: a small pill like the Now Playing tile, top center as HomeView has it; a tap opens it full screen. */
    .mini { position: absolute; z-index: 6; left: 0; right: 0; margin-inline: auto; width: 90px; height: 46px; top: max(24px, calc(env(safe-area-inset-top, 0px) + 12px)); box-sizing: border-box; padding: 0 12.5px; gap: 7px; border-radius: 20px; display: none; align-items: center; cursor: pointer; isolation: isolate; -webkit-tap-highlight-color: transparent;
      --bd: .59; --gt: 1.2; --gb: 1.13; --sd: .72; --sd2: .88; }
    .mini.on { display: flex; }
    .mini::before { content: ""; position: absolute; inset: 0; border-radius: inherit; z-index: -1; -webkit-backdrop-filter: blur(24px) brightness(var(--bd)) saturate(1.4); backdrop-filter: blur(24px) brightness(var(--bd)) saturate(1.4); }
    .mini .gx { position: absolute; inset: 0; border-radius: inherit; z-index: -1; pointer-events: none; }
    .mini .gt{-webkit-backdrop-filter:brightness(var(--gt)) saturate(.92);backdrop-filter:brightness(var(--gt)) saturate(.92);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 78 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='v' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-opacity='.7'/%3E%3Cstop offset='.14' stop-opacity='.36'/%3E%3Cstop offset='.28' stop-opacity='.1'/%3E%3Cstop offset='.4' stop-opacity='.02'/%3E%3Cstop offset='.48' stop-opacity='0'/%3E%3C/linearGradient%3E%3Cfilter id='f' x='-10%25' y='-20%25' width='120%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='1.6'/%3E%3C/filter%3E%3C/defs%3E%3Crect x='1.9' y='1.9' width='74.2' height='36.2' rx='15.6' fill='none' stroke='url%28%23v%29' stroke-width='3' filter='url%28%23f%29'/%3E%3C/svg%3E") 0 0/100% 100% no-repeat,linear-gradient(to bottom,#000,rgba(0,0,0,.8) 3%,rgba(0,0,0,.55) 7%,rgba(0,0,0,.33) 11%,rgba(0,0,0,.17) 15%,rgba(0,0,0,.07) 19%,rgba(0,0,0,.02) 23%,transparent 27%);mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 78 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='v' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-opacity='.7'/%3E%3Cstop offset='.14' stop-opacity='.36'/%3E%3Cstop offset='.28' stop-opacity='.1'/%3E%3Cstop offset='.4' stop-opacity='.02'/%3E%3Cstop offset='.48' stop-opacity='0'/%3E%3C/linearGradient%3E%3Cfilter id='f' x='-10%25' y='-20%25' width='120%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='1.6'/%3E%3C/filter%3E%3C/defs%3E%3Crect x='1.9' y='1.9' width='74.2' height='36.2' rx='15.6' fill='none' stroke='url%28%23v%29' stroke-width='3' filter='url%28%23f%29'/%3E%3C/svg%3E") 0 0/100% 100% no-repeat,linear-gradient(to bottom,#000,rgba(0,0,0,.8) 3%,rgba(0,0,0,.55) 7%,rgba(0,0,0,.33) 11%,rgba(0,0,0,.17) 15%,rgba(0,0,0,.07) 19%,rgba(0,0,0,.02) 23%,transparent 27%)}
    .mini .gb{-webkit-backdrop-filter:brightness(var(--gb)) saturate(.92);backdrop-filter:brightness(var(--gb)) saturate(.92);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 78 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='v' x1='0' y1='1' x2='0' y2='0'%3E%3Cstop offset='0' stop-opacity='.7'/%3E%3Cstop offset='.14' stop-opacity='.36'/%3E%3Cstop offset='.28' stop-opacity='.1'/%3E%3Cstop offset='.4' stop-opacity='.02'/%3E%3Cstop offset='.48' stop-opacity='0'/%3E%3C/linearGradient%3E%3Cfilter id='f' x='-10%25' y='-20%25' width='120%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='1.6'/%3E%3C/filter%3E%3C/defs%3E%3Crect x='1.9' y='1.9' width='74.2' height='36.2' rx='15.6' fill='none' stroke='url%28%23v%29' stroke-width='3' filter='url%28%23f%29'/%3E%3C/svg%3E") 0 0/100% 100% no-repeat,linear-gradient(to top,#000,rgba(0,0,0,.8) 3%,rgba(0,0,0,.55) 6.5%,rgba(0,0,0,.33) 10%,rgba(0,0,0,.17) 13.5%,rgba(0,0,0,.07) 17%,rgba(0,0,0,.02) 20%,transparent 24%);mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 78 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='v' x1='0' y1='1' x2='0' y2='0'%3E%3Cstop offset='0' stop-opacity='.7'/%3E%3Cstop offset='.14' stop-opacity='.36'/%3E%3Cstop offset='.28' stop-opacity='.1'/%3E%3Cstop offset='.4' stop-opacity='.02'/%3E%3Cstop offset='.48' stop-opacity='0'/%3E%3C/linearGradient%3E%3Cfilter id='f' x='-10%25' y='-20%25' width='120%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='1.6'/%3E%3C/filter%3E%3C/defs%3E%3Crect x='1.9' y='1.9' width='74.2' height='36.2' rx='15.6' fill='none' stroke='url%28%23v%29' stroke-width='3' filter='url%28%23f%29'/%3E%3C/svg%3E") 0 0/100% 100% no-repeat,linear-gradient(to top,#000,rgba(0,0,0,.8) 3%,rgba(0,0,0,.55) 6.5%,rgba(0,0,0,.33) 10%,rgba(0,0,0,.17) 13.5%,rgba(0,0,0,.07) 17%,rgba(0,0,0,.02) 20%,transparent 24%)}
    .mini .gd{-webkit-backdrop-filter:brightness(var(--sd2)) saturate(1.3);backdrop-filter:brightness(var(--sd2)) saturate(1.3);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 78 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3Cfilter id='f' x='-20%25' y='-30%25' width='140%25' height='160%25'%3E%3CfeGaussianBlur stdDeviation='2.2'/%3E%3C/filter%3E%3ClinearGradient id='e' x1='0' x2='1'%3E%3Cstop offset='0' stop-opacity='1'/%3E%3Cstop offset='.1' stop-opacity='.75'/%3E%3Cstop offset='.2' stop-opacity='.3'/%3E%3Cstop offset='.3' stop-opacity='.06'/%3E%3Cstop offset='.36' stop-opacity='0'/%3E%3Cstop offset='.64' stop-opacity='0'/%3E%3Cstop offset='.7' stop-opacity='.06'/%3E%3Cstop offset='.8' stop-opacity='.3'/%3E%3Cstop offset='.9' stop-opacity='.75'/%3E%3Cstop offset='1' stop-opacity='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1.5' y='1.5' width='75' height='37' rx='16' fill='none' stroke='url%28%23e%29' stroke-width='5' filter='url%28%23f%29'/%3E%3C/svg%3E") 0 0/100% 100% no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 78 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3Cfilter id='f' x='-20%25' y='-30%25' width='140%25' height='160%25'%3E%3CfeGaussianBlur stdDeviation='2.2'/%3E%3C/filter%3E%3ClinearGradient id='e' x1='0' x2='1'%3E%3Cstop offset='0' stop-opacity='1'/%3E%3Cstop offset='.1' stop-opacity='.75'/%3E%3Cstop offset='.2' stop-opacity='.3'/%3E%3Cstop offset='.3' stop-opacity='.06'/%3E%3Cstop offset='.36' stop-opacity='0'/%3E%3Cstop offset='.64' stop-opacity='0'/%3E%3Cstop offset='.7' stop-opacity='.06'/%3E%3Cstop offset='.8' stop-opacity='.3'/%3E%3Cstop offset='.9' stop-opacity='.75'/%3E%3Cstop offset='1' stop-opacity='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1.5' y='1.5' width='75' height='37' rx='16' fill='none' stroke='url%28%23e%29' stroke-width='5' filter='url%28%23f%29'/%3E%3C/svg%3E") 0 0/100% 100% no-repeat}
    .mini .gs{-webkit-backdrop-filter:brightness(var(--sd)) saturate(1.45);backdrop-filter:brightness(var(--sd)) saturate(1.45);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 78 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3Cfilter id='b' x='-10%25' y='-20%25' width='120%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='.5'/%3E%3C/filter%3E%3Cfilter id='w' x='-10%25' y='-20%25' width='120%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='1.3'/%3E%3C/filter%3E%3ClinearGradient id='g' x1='0' x2='1'%3E%3Cstop offset='0' stop-opacity='1'/%3E%3Cstop offset='.11' stop-opacity='.85'/%3E%3Cstop offset='.25' stop-opacity='.45'/%3E%3Cstop offset='.5' stop-opacity='.28'/%3E%3Cstop offset='.75' stop-opacity='.45'/%3E%3Cstop offset='.89' stop-opacity='.85'/%3E%3Cstop offset='1' stop-opacity='1'/%3E%3C/linearGradient%3E%3ClinearGradient id='h' x1='0' x2='1'%3E%3Cstop offset='0' stop-opacity='1'/%3E%3Cstop offset='.18' stop-opacity='.7'/%3E%3Cstop offset='.33' stop-opacity='.15'/%3E%3Cstop offset='.42' stop-opacity='0'/%3E%3Cstop offset='.58' stop-opacity='0'/%3E%3Cstop offset='.67' stop-opacity='.15'/%3E%3Cstop offset='.82' stop-opacity='.7'/%3E%3Cstop offset='1' stop-opacity='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='.9' y='.9' width='76.2' height='38.2' rx='16.6' fill='none' stroke='url%28%23h%29' stroke-opacity='.24' stroke-width='2.6' filter='url%28%23w%29'/%3E%3Crect x='.5' y='.5' width='77' height='39' rx='17' fill='none' stroke='url%28%23g%29' stroke-width='.95' filter='url%28%23b%29'/%3E%3C/svg%3E") 0 0/100% 100% no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 78 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3Cfilter id='b' x='-10%25' y='-20%25' width='120%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='.5'/%3E%3C/filter%3E%3Cfilter id='w' x='-10%25' y='-20%25' width='120%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='1.3'/%3E%3C/filter%3E%3ClinearGradient id='g' x1='0' x2='1'%3E%3Cstop offset='0' stop-opacity='1'/%3E%3Cstop offset='.11' stop-opacity='.85'/%3E%3Cstop offset='.25' stop-opacity='.45'/%3E%3Cstop offset='.5' stop-opacity='.28'/%3E%3Cstop offset='.75' stop-opacity='.45'/%3E%3Cstop offset='.89' stop-opacity='.85'/%3E%3Cstop offset='1' stop-opacity='1'/%3E%3C/linearGradient%3E%3ClinearGradient id='h' x1='0' x2='1'%3E%3Cstop offset='0' stop-opacity='1'/%3E%3Cstop offset='.18' stop-opacity='.7'/%3E%3Cstop offset='.33' stop-opacity='.15'/%3E%3Cstop offset='.42' stop-opacity='0'/%3E%3Cstop offset='.58' stop-opacity='0'/%3E%3Cstop offset='.67' stop-opacity='.15'/%3E%3Cstop offset='.82' stop-opacity='.7'/%3E%3Cstop offset='1' stop-opacity='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='.9' y='.9' width='76.2' height='38.2' rx='16.6' fill='none' stroke='url%28%23h%29' stroke-opacity='.24' stroke-width='2.6' filter='url%28%23w%29'/%3E%3Crect x='.5' y='.5' width='77' height='39' rx='17' fill='none' stroke='url%28%23g%29' stroke-width='.95' filter='url%28%23b%29'/%3E%3C/svg%3E") 0 0/100% 100% no-repeat}
    .mini .ma { flex: none; width: 29px; height: 29px; border-radius: 6px; background: rgba(255,255,255,0.1) center / cover no-repeat; }
    .mini .dots { display: block; overflow: visible; flex: none; }
    .mini .dots circle { fill: #fff; opacity: var(--o); animation: smd 1.7s ease-in-out infinite; animation-delay: var(--dl); }
    @keyframes smd { 0%, 100% { opacity: var(--o); } 35% { opacity: var(--o2); } }
    @media (prefers-reduced-motion: reduce) { .mini .dots circle { animation: none; } }
    /* Burn-in care: one slow continuous loop of a few pixels, too slow to see, instead of a jump each minute. */
    .drift { animation: hemma-drift 900s linear infinite; }
    .drift.d1 { animation-duration: 1130s; animation-direction: reverse; }
    .drift.d2 { animation-duration: 1370s; }
    .drift.d3 { animation-duration: 1010s; animation-direction: reverse; }
    .drift.held { animation: none !important; }
    @keyframes hemma-drift { 0% { translate: 0 0; } 20% { translate: 7px -4px; } 40% { translate: 2px 5px; } 60% { translate: -7px 2px; } 80% { translate: -4px -5px; } 100% { translate: 0 0; } }
    @media (prefers-reduced-motion: reduce) { .drift, .drift.d1, .drift.d2, .drift.d3 { animation-duration: 3600s; } }
    .dark { position: absolute; inset: 0; z-index: 9; background: #000; opacity: 0; pointer-events: none; transition: opacity 3s ease; }
    .dark.on { opacity: 1; pointer-events: auto; }
  `;
  // Shared by every screensaver style: mounting, the tap that wakes the dashboard, Escape, dimming after a while, and fading in.
  const saverMount = (layer, sr, o, own) => {
    camHost().appendChild(layer);
    SAVER.layer = layer;
    layer.addEventListener('click', (e) => { if (e.composedPath().some((n) => n.classList && own(n))) return; window.hemmaSaver.stop(); });
    SAVER.key = (e) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); window.hemmaSaver.stop(); } };
    document.addEventListener('keydown', SAVER.key, true);
    if (o.dark > 0) SAVER.darkT = setTimeout(() => { const d = sr.querySelector('.dark'); if (d) d.classList.add('on'); }, o.dark * 60000);
    if (!o.instant && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
  };
  const SAVER_KEYS = ['layer', 'opts', 'npv', 'clock', 'mini', 'pill', 'shift', 'wx', 'fc', 'cal', 'adv', 'darkT', 'unfit', 'key'];
  const saverTake = () => { const st = {}; SAVER_KEYS.forEach((k) => { st[k] = SAVER[k]; SAVER[k] = null; }); return st; };
  const saverPut = (st) => { SAVER_KEYS.forEach((k) => { SAVER[k] = st[k]; }); };
  const saverEnd = (st) => {
    ['clock', 'mini', 'shift', 'wx', 'fc', 'cal', 'adv'].forEach((k) => clearInterval(st[k]));
    clearTimeout(st.darkT);
    if (st.unfit) st.unfit();
    if (st.key) document.removeEventListener('keydown', st.key, true);
  };
  const saverKeep = () => { if (SAVER.opts && !SAVER.opts.preview) try { localStorage.setItem('hemma_saver_on', JSON.stringify(Object.assign({}, SAVER.opts, { instant: true, at: location.pathname.split('/')[1] || '' }))); } catch (_) {} };
  const SAVER_ORDER = ['clock', 'face', 'recent'];
  const saverKind = (s) => (!s || s === 'clock_photo' ? 'clock' : s === 'cards' ? 'recent' : s);
  const SAVER_FACES = ['', 'classic', 'stacked'];
  const saverSwipe = (layer) => {
    let g = null, swiped = 0;
    const faces = saverKind(SAVER.opts && SAVER.opts.style) === 'face';
    const size = (ax) => ax === 'y' ? innerHeight : innerWidth;
    const tr = (ax, v) => ax === 'y' ? '0 ' + v + 'px' : v + 'px 0';
    const mine = (e) => e.composedPath().some((n) => n.classList && (n.classList.contains('rdet') || n.classList.contains('mini') || (n.classList.contains('slab') && n.classList.contains('detail'))));
    // Sideways moves through the screensavers; up and down through Clock's faces.
    const build = (dir, ax) => {
      const list = ax === 'y' ? SAVER_FACES : SAVER_ORDER;
      const at = ax === 'y' ? SAVER_FACES.indexOf((SAVER.opts && SAVER.opts.face) || '') : SAVER_ORDER.indexOf(saverKind(SAVER.opts && SAVER.opts.style));
      for (let k = 1; k < list.length; k++) {
        const v = list[(Math.max(0, at) + dir * k + list.length * 2) % list.length];
        const cur = saverTake();
        try { window.hemmaSaver._open(Object.assign({}, cur.opts, ax === 'y' ? { face: v } : { style: v }, { instant: true })); } catch (_) {}
        const nb = SAVER.layer ? { layer: SAVER.layer, st: saverTake() } : null;
        saverPut(cur);
        saverKeep();
        if (nb) { nb.layer.style.pointerEvents = 'none'; nb.layer.style.translate = tr(ax, dir * size(ax)); return nb; }
      }
      return null;
    };
    const drop = (nb) => { if (!nb) return; saverEnd(nb.st); nb.layer.remove(); };
    const place = (d) => { layer.style.translate = tr(g.ax, d); if (g.nb) g.nb.layer.style.translate = tr(g.ax, g.dir * size(g.ax) + d); };
    layer.style.touchAction = faces ? 'none' : 'pan-y';
    layer.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || SAVER.layer !== layer || g || mine(e)) return;
      g = { x: e.clientX, y: e.clientY, id: e.pointerId, live: false, ax: 'x', dir: 0, nb: null, lp: 0, lt: e.timeStamp, v: 0 };
      const rt = e.composedPath().find((n) => n.classList && n.classList.contains('rtrack'));
      if (rt) { const ds = [...((rt.closest('.slab') || rt.parentNode).querySelectorAll('.rdots i'))]; g.track = rt; g.at = ds.findIndex((i) => i.classList.contains('on')); g.last = ds.length - 1; }
    }, true);
    layer.addEventListener('pointermove', (e) => {
      if (!g || e.pointerId !== g.id || g.done) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.live) {
        const ax = Math.abs(dx) >= 14 && Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : faces && Math.abs(dy) >= 14 && Math.abs(dy) > Math.abs(dx) * 1.4 ? 'y' : '';
        if (!ax) { if (!faces && Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) g = null; return; }
        if (g.track && ax === 'x') {
          // Recently Added's posters swipe first; past the first or last one the swipe carries on to the next screensaver.
          if (dx < 0 ? g.at < g.last : g.at > 0) { g = null; return; }
          g.track.dispatchEvent(new PointerEvent('pointercancel', { pointerId: e.pointerId, clientX: g.x, clientY: g.y }));
        }
        g.ax = ax;
        g.live = true;
        try { layer.setPointerCapture(e.pointerId); } catch (_) {}
      }
      const d = g.ax === 'y' ? dy : dx;
      const dir = d < 0 ? 1 : -1;
      if (dir !== g.dir) { drop(g.nb); g.dir = dir; g.nb = build(dir, g.ax); }
      const dt = e.timeStamp - g.lt;
      if (dt > 0) { g.v = 0.7 * ((d - g.lp) / dt) + 0.3 * g.v; g.lp = d; g.lt = e.timeStamp; }
      place(g.nb ? d : d * 0.25);
    }, true);
    const end = (e) => {
      if (!g || e.pointerId !== g.id) return;
      const s = g;
      if (!s.live) { g = null; return; }
      s.done = true;
      swiped = Date.now();
      const d = s.ax === 'y' ? e.clientY - s.y : e.clientX - s.x, w = size(s.ax);
      const go = !!s.nb && e.type === 'pointerup' && (Math.abs(d) > w * 0.3 || (-s.v * s.dir > 0.35 && Math.abs(d) > 30));
      const E = 'cubic-bezier(0.22, 0.8, 0.26, 1)', ms = 420;
      const fly = (el, a, b) => el.animate([{ translate: tr(s.ax, a) }, { translate: tr(s.ax, b) }], { duration: ms, easing: E, fill: 'forwards' });
      if (go) {
        const old = saverTake();
        saverEnd(old);
        saverPut(s.nb.st);
        saverKeep();
        saverSwipe(s.nb.layer);
        saverRotate();
        const nl = s.nb.layer;
        nl.style.pointerEvents = '';
        old.layer.style.pointerEvents = 'none';
        const a = fly(old.layer, d, -s.dir * w), b = fly(nl, s.dir * w + d, 0);
        const fin = () => {
          old.layer.remove(); b.cancel(); nl.style.translate = '';
          const rp = nl.shadowRoot && nl.shadowRoot.querySelector('hemma-recent-panel');
          if (rp && rp._rewash) rp._rewash();
        };
        Promise.all([a.finished, b.finished]).then(fin, fin);
      } else {
        const a = fly(layer, s.nb ? d : d * 0.25, 0), nb = s.nb;
        if (nb) fly(nb.layer, s.dir * w + d, s.dir * w);
        const fin = () => { a.cancel(); layer.style.translate = ''; drop(nb); };
        a.finished.then(fin, fin);
      }
      g = null;
    };
    layer.addEventListener('pointerup', end, true);
    layer.addEventListener('pointercancel', end, true);
    layer.addEventListener('click', (e) => { if (Date.now() - swiped < 500) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  };
  // Rotation puts Clock between every other screensaver, with the next face each time.
  const saverRotPlan = () => {
    const o = SAVER.opts || {}, cur = saverKind(o.style), R = SAVER.rot || (SAVER.rot = {});
    if (R.f == null) R.f = Math.max(0, SAVER_FACES.indexOf(o.face || '')) + (cur === 'face' ? 1 : 0);
    if (cur !== 'face') {
      R.prev = cur;
      const face = SAVER_FACES[R.f % SAVER_FACES.length];
      R.f++;
      return [{ style: 'face', face }];
    }
    const rest = SAVER_ORDER.filter((k) => k !== 'face'), at = rest.indexOf(R.prev);
    return rest.map((_, k) => ({ style: rest[(at + 1 + k) % rest.length] }));
  };
  const saverRotate = (ms) => {
    clearTimeout(SAVER.rotT);
    const o = SAVER.opts;
    if (!o || !(o.rotate > 0)) return;
    SAVER.rotT = setTimeout(() => {
      const cur = SAVER.layer, sr = cur && cur.shadowRoot;
      if (!cur) return;
      const rp = sr && sr.querySelector('hemma-recent-panel'), open = rp && rp.shadowRoot && rp.shadowRoot.querySelector('.slab.detail');
      if (document.hidden || cur.style.translate || open) return saverRotate(30000);
      if (sr && sr.querySelector('.dark.on')) return saverRotate();
      // Recently Added finishes its round of posters first, moving on where it would start over.
      if (rp && rp._ssTick && !rp._raOnWrap && !rp._raDone && rp.shadowRoot.querySelectorAll('.rdots i').length > 1) { rp._raOnWrap = () => { rp._raDone = true; if (SAVER.layer === cur) saverRotate(1); }; return; }
      const plan = saverRotPlan(), old = saverTake();
      for (const step of plan) {
        try { window.hemmaSaver._open(Object.assign({}, old.opts, step, { instant: true })); } catch (_) {}
        if (SAVER.layer) break;
      }
      if (!SAVER.layer) { saverPut(old); return saverRotate(); }
      saverEnd(old);
      saverKeep();
      const nl = SAVER.layer;
      if (nl.parentNode === old.layer.parentNode) nl.parentNode.insertBefore(nl, old.layer);
      if (SAVER.opts.swipe) saverSwipe(nl);
      old.layer.style.pointerEvents = 'none';
      const gone = () => { old.layer.remove(); const rp2 = nl.shadowRoot && nl.shadowRoot.querySelector('hemma-recent-panel'); if (rp2 && rp2._rewash) rp2._rewash(); };
      if (SAVER.opts.slide && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const E = 'cubic-bezier(0.32, 0.72, 0, 1)';
        nl.parentNode.appendChild(nl);
        nl.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 900, easing: E });
        old.layer.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-30%)', opacity: 0.4 }], { duration: 900, easing: E, fill: 'forwards' }).finished.then(gone, gone);
      } else old.layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1500, easing: 'ease-in-out', fill: 'forwards' }).finished.then(gone, gone);
      saverRotate();
    }, ms || o.rotate * 60000);
  };
  const saverLL = () => {
    try {
      const st = [document];
      for (let i = 0; i < st.length && i < 3000; i++) {
        const hit = st[i].querySelector && st[i].querySelector('hui-root');
        if (hit && hit.lovelace) return hit.lovelace.config || null;
        st[i].querySelectorAll && st[i].querySelectorAll('*').forEach((n) => { if (n.shadowRoot) st.push(n.shadowRoot); });
      }
    } catch (_) {}
    return null;
  };
  const saverViewVar = (k) => { const c = saverLL(); for (const v of (c && c.views) || []) { const V = (((v.cards || [])[0]) || {}).variables || {}; if (V[k]) return V[k]; } return null; };
  // Artwork changes as a crossfade: the new picture loads first, then the old one fades off over it.
  // Each widget wanders on its own clock, so the gaps between them breathe instead of the whole screen sliding as one.
function saverDrift(groups) {
  groups.forEach((g, i) => g.forEach((el) => {
    if (!el) return;
    el.classList.add('drift');
    if (i % 4) el.classList.add('d' + (i % 4));
    el.style.animationDelay = -((i * 337) % 900) + 's';
  }));
}
const saverXfade = (el, bg) => {
    if (!el) return;
    if (el._xfTo === bg) return;
    const was = el.style.backgroundImage;
    el._xfTo = bg;
    if (!was || !bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.style.backgroundImage = bg; return; }
    const m = /url\(["']?([^"')]+)/.exec(bg), go = () => {
      if (el._xfTo !== bg) return;
      const o = document.createElement('i');
      o.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:center / cover no-repeat;background-image:' + was;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(o);
      el.style.backgroundImage = bg;
      const a = o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-in-out' });
      a.finished.then(() => o.remove(), () => o.remove());
    };
    if (!m) { go(); return; }
    const im = new Image(); im.onload = im.onerror = go; im.src = m[1];
  };
  const saverNPVars = () => {
    const ids = [], V = {}, seen = new Set(), st = [saverLL()];
    for (let i = 0; i < st.length && i < 20000; i++) {
      const o = st[i];
      if (!o || typeof o !== 'object') continue;
      if (o.variables && typeof o.variables === 'object') for (let n = 1; n <= 10; n++) { const e = o.variables['media_player_' + n]; if (typeof e === 'string' && e.indexOf('media_player.') === 0 && !ids.includes(e)) ids.push(e); }
      for (const k in o) { const v = o[k]; if (v && typeof v === 'object' && !seen.has(v)) { seen.add(v); st.push(v); } }
    }
    if (!ids.length) ids.push(...Object.keys(CAMS.hassNow().states).filter((k) => k.indexOf('media_player.') === 0));
    ids.slice(0, 10).forEach((e, i) => { V['show_media_player_' + (i + 1)] = true; V['media_player_' + (i + 1)] = e; });
    return V;
  };
  const saverNP = () => { const hs = CAMS.hassNow(); try { SAVER.npv = SAVER.npv || saverNPVars(); const l = window._hemmaNPSources ? window._hemmaNPSources(hs.states, SAVER.npv) : []; return l.find((r) => r && r.entity && r.kind !== 'activity' && r.playing) || l.find((r) => r && r.entity && r.kind !== 'activity') || null; } catch (_) { return null; } };
  // Spotify's pick: the cover's colors ranked as Android's Palette ranks a Vibrant swatch (a vivid mid-tone, weighted by how much of the cover it fills), then Dark Vibrant, Muted, Dark Muted.
  const hslOf = (r, g, b) => { r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2; let h = 0, s = 0; if (M !== m) { const d = M - m; s = l > 0.5 ? d / (2 - M - m) : d / (M + m); h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; };
  const palVibrant = (d) => {
    let boxes = [[]];
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) boxes[0].push([d[i], d[i + 1], d[i + 2]]);
    // Median cut into 16 boxes, as Palette does, so the many shades of one sky count as one color.
    while (boxes.length < 16) {
      let bi = -1, br = 0, bc = 0;
      boxes.forEach((bx, j) => { if (bx.length < 2) return; for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; bx.forEach((p) => { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; }); if (hi - lo > br) { br = hi - lo; bi = j; bc = c; } } });
      if (bi < 0) break;
      const bx = boxes[bi].sort((x, y) => x[bc] - y[bc]), m = bx.length >> 1;
      boxes.splice(bi, 1, bx.slice(0, m), bx.slice(m));
    }
    const sw = boxes.filter((bx) => bx.length).map((bx) => { const c = [0, 1, 2].map((k) => bx.reduce((t, p) => t + p[k], 0) / bx.length); return { c, q: hslOf(...c), n: bx.length }; });
    const maxN = Math.max(...sw.map((x) => x.n));
    const T = [[0.3, 0.5, 0.7, 0.35, 1, 1], [0, 0.26, 0.45, 0.35, 1, 1], [0.3, 0.5, 0.7, 0, 0.3, 0.4], [0, 0.26, 0.45, 0, 0.3, 0.4]];
    for (const [lMin, lT, lMax, sMin, sT, sMax] of T) {
      let best = null, bs = -1;
      sw.forEach((x) => { const [, sa, l] = x.q; if (l < lMin || l > lMax || sa < sMin || sa > sMax) return; const sc = 0.24 * (1 - Math.abs(sa - sT)) + 0.52 * (1 - Math.abs(l - lT)) + 0.24 * (x.n / maxN); if (sc > bs) { bs = sc; best = x; } });
      if (best) return best.c;
    }
    return null;
  };
  // Dark enough for white text, as Spotify keeps it: hue and saturation stay, brightness about three quarters (within 36 to 70%).
  const albumTop = (c) => { const M = Math.max(...c) / 255, k = M ? Math.max(0.36, Math.min(0.7, M * 0.74)) / M : 1; return c.map((v) => Math.round(v * k)); };
  window.hemmaAlbumColor = (art) => new Promise((done) => {
    if (!art) { done(null); return; }
    const im = new Image(), same = String(art).startsWith('/') || String(art).startsWith(location.origin);
    if (!same) im.crossOrigin = 'anonymous';
    im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 40; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 40, 40); const v = palVibrant(x.getImageData(0, 0, 40, 40).data); done(v ? albumTop(v) : null); } catch (_) { done(null); } };
    im.onerror = () => done(null);
    im.src = art;
  });
  window.hemmaNowArt = () => { const s = saverNP(); return s && s.playing ? (s.art || '') : ''; };
  const saverOpenNP = (src, from) => { if (!src) return; window.hemmaMediaFull.open({ entity: src.entity, kind: src.kind === 'player' ? null : (src.kind || null), src, resume: SAVER.opts }, from); const lay = SAVER.layer; clearTimeout(SAVER.handT); SAVER.handT = setTimeout(() => { SAVER.handT = 0; if (SAVER.layer === lay) window.hemmaSaver.stop(true); }, 560); };
  const saverPhoto = () => {
    const st = [document];
    for (let i = 0; i < st.length && i < 4000; i++) {
      const r = st[i];
      for (const el of r.querySelectorAll ? r.querySelectorAll('ha-card') : []) { const v = getComputedStyle(el).getPropertyValue('--hero-img'); const m = /url\(["']?([^"')]+)/.exec(v); if (m) return m[1]; }
      r.querySelectorAll && r.querySelectorAll('*').forEach((n) => { if (n.shadowRoot) st.push(n.shadowRoot); });
    }
    return '';
  };
  // The stage is drawn at the iPad's 1180 by 820 and scaled to fit the screen, so the layout holds on any size.
  const stageFit = (sr) => { const f = () => { const pt = innerHeight > innerWidth * 1.1, k = pt ? Math.min(innerWidth / 820, innerHeight / 1180) : Math.min(innerWidth / 1180, innerHeight / 820); sr.host.classList.toggle('pt', pt); sr.host.style.setProperty('--k', k); }; f(); addEventListener('resize', f); SAVER.unfit = () => removeEventListener('resize', f); };
  const CLOCK_BG = { '': '#97a9ae', sand: '#c8b9a2', sage: '#a3b29a', blue: '#93a7c2', rose: '#c6a9ad', lavender: '#afa9c9', sea: '#90b7b6', clay: '#cea796', plum: '#c0a0b4', honey: '#cab992', black: '#000' };
  const CLOCK_CSS = `
    .bg { position: absolute; inset: 0; background: #97a9ae; }
    .glows { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .glay { position: absolute; inset: 0; }
    .gfill { position: absolute; inset: 0; }
    .gb { position: absolute; left: 50%; top: 50%; width: 130vmax; height: 130vmax; margin: -65vmax 0 0 -65vmax; border-radius: 50%; animation: var(--gn) var(--gd) ease-in-out infinite alternate; }
    .g1 { --gn: hg1; --gd: 140s; } .g2 { --gn: hg2; --gd: 170s; } .g3 { --gn: hg3; --gd: 155s; } .g4 { --gn: hg4; --gd: 190s; }
    @keyframes hg1 { 0% { transform: translate(-38vw, -34vh) scale(1); } 50% { transform: translate(-8vw, -14vh) scale(1.15); } 100% { transform: translate(-26vw, 12vh) scale(.95); } }
    @keyframes hg2 { 0% { transform: translate(34vw, 30vh) scale(1.1); } 50% { transform: translate(18vw, -12vh) scale(.9); } 100% { transform: translate(40vw, 8vh) scale(1.2); } }
    @keyframes hg3 { 0% { transform: translate(-20vw, 40vh) scale(.9); } 50% { transform: translate(-36vw, 18vh) scale(1.1); } 100% { transform: translate(-6vw, 30vh) scale(1); } }
    @keyframes hg4 { 0% { transform: translate(36vw, -38vh) scale(1); } 50% { transform: translate(14vw, -24vh) scale(1.2); } 100% { transform: translate(42vw, -8vh) scale(.9); } }
    @media (prefers-reduced-motion: reduce) { .gb { animation: none; } }
    .bg.photo { inset: -120px; background: var(--ph) center / cover no-repeat; filter: blur(60px) saturate(1.3) brightness(.62); }
    .stg { position: absolute; left: 50%; top: 50%; width: 1180px; height: 820px; transform: translate(-50%, -50%) scale(var(--k, 1)); color: var(--ink); }
    :host { --ink: #111; --sub: #3d4a50; --hi: #fff; --sec: #fff; --pill: rgba(0,0,0,0.12); }
    :host(.dk) { --ink: #fff; --sub: rgba(235,235,245,0.62); --sec: #FF9F0A; --pill: rgba(255,255,255,0.16); }
    .dt { position: absolute; left: 130px; top: 70px; width: 380px; text-align: center; }
    .dt .wd { font-size: 72px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; } .dt .wd b { color: var(--hi); } .dt .wd span { color: var(--sub); }
    .dt .n { font-size: 260px; font-weight: 700; line-height: .86; letter-spacing: -0.05em; margin-top: 6px; }
    .ck { position: absolute; left: 720px; top: 60px; width: 340px; height: 340px; }
    .md { position: absolute; left: 170px; top: 436px; width: 300px; cursor: pointer; }
    .md .ar { width: 180px; height: 180px; border-radius: 16px; background: rgba(255,255,255,0.15) center / cover no-repeat; }
    .md .t { margin-top: 14px; font-size: 22px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .md .a { font-size: 21px; color: var(--sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .md .pl { margin-top: 12px; display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 26px 0 22px; border-radius: 26px; border: 0; background: var(--pill); color: var(--ink); font: inherit; font-size: 24px; font-weight: 500; cursor: pointer; }
    .md .pl svg { height: 18px; width: auto; display: block; }
    .fc { position: absolute; left: 170px; top: 446px; display: grid; gap: 14px; }
    [hidden] { display: none !important; }
    .fc div { display: grid; grid-template-columns: 90px 44px auto; align-items: center; gap: 16px; font-size: 26px; font-weight: 500; }
    .fc i, .wx i { display: block; width: 40px; height: 34px; background: var(--ink); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .wx { position: absolute; left: 700px; top: 436px; }
    .dt, .ck, .wx { transition: left .6s cubic-bezier(0.32, 0.72, 0, 1); }
    .stg.still :is(.dt, .ck, .wx) { transition: none; }
    .stg.wide .dt { left: 70px; } .stg.wide .ck { left: 780px; } .stg.wide .wx { left: 760px; }
    .stg.wide .cal { left: 110px; width: 530px; }
    :host(.pt) .stg { width: 820px; height: 1180px; }
    :host(.pt) .stg .dt, :host(.pt) .stg.wide .dt { left: 30px; top: 175px; } :host(.pt) .dt .wd { font-size: 65px; } :host(.pt) .dt .n { font-size: 234px; }
    :host(.pt) .stg .ck, :host(.pt) .stg.wide .ck { left: 440px; top: 155px; width: 320px; height: 320px; }
    /* Upright, the media (or forecast, or Home at a glance) sits beside the weather as in landscape; the calendar takes the full width under it. */
    :host(.pt) .stg .wx { left: 470px; top: 690px; } :host(.pt) .wx .tp { font-size: 150px; }
    :host(.pt) .stg .md, :host(.pt) .stg .fc, :host(.pt) .stg .gl { left: 60px; top: 700px; width: 360px; }
    :host(.pt) .stg.wide .wx { left: 60px; top: 575px; display: grid; grid-template-columns: auto auto; grid-template-areas: "c ." "tp i" "tp cd" "tp hl"; column-gap: 36px; align-items: end; }
    :host(.pt) .stg.wide .wx .c { grid-area: c; } :host(.pt) .stg.wide .wx .tp { grid-area: tp; align-self: end; } :host(.pt) .stg.wide .wx i { grid-area: i; margin: 0 0 6px; width: 48px; height: 40px; } :host(.pt) .stg.wide .wx .cd { grid-area: cd; } :host(.pt) .stg.wide .wx .hl { grid-area: hl; padding-bottom: 18px; }
    :host(.pt) .stg .cal, :host(.pt) .stg.wide .cal { left: 60px; top: 845px; width: 700px; }
    .cal, .gl { position: absolute; left: 170px; top: 446px; width: 460px; display: grid; gap: 20px; }
    .cal .hd, .gl > div { display: flex; align-items: center; gap: 14px; font-size: 38px; font-weight: 600; line-height: 1.1; min-width: 0; }
    .cal .hd i, .gl i { flex: none; width: 52px; height: 52px; border-radius: 50%; background: var(--hi); display: grid; place-items: center; }
    :host(.dk) .cal .hd i, :host(.dk) .gl i { background: rgba(255,255,255,0.16); }
    .cal .hd i b, .gl i b { width: 28px; height: 28px; background: var(--ink); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .gl > div span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; padding-block: 2px; margin-block: -6px; }
    .cal .ev { position: relative; display: grid; padding-left: 18px; min-width: 0; }
    .cal .ev::before { content: ""; position: absolute; left: 0; top: 5px; bottom: 5px; width: 5px; border-radius: 3px; background: var(--hi); }
    .cal .tm { font-size: 36px; font-weight: 700; color: var(--hi); line-height: 1.12; letter-spacing: -0.01em; white-space: nowrap; }
    .cal .tm small { font-size: 26px; font-weight: 700; margin-left: 1px; }
    .cal .nm { font-size: 40px; font-weight: 500; line-height: 1.28; margin-block: -3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cal .more { font-size: 34px; font-weight: 500; color: var(--sub); }
    .wx .c { font-size: 28px; font-weight: 600; color: var(--hi); display: flex; align-items: center; gap: 6px; }
    .wx .tp { font-size: 168px; font-weight: 600; line-height: 1; letter-spacing: -0.04em; margin-top: 2px; }
    .wx .cd, .wx .hl { font-size: 26px; font-weight: 500; } .wx i { margin: 10px 0 6px; width: 52px; height: 44px; }
  `;
  const WXF = { sunny: 'clear-day', 'clear-night': 'clear-night', partlycloudy: 'partly-cloudy-day', cloudy: 'cloudy', overcast: 'cloudy', rainy: 'rain', pouring: 'rain', snowy: 'snow', 'snowy-rainy': 'sleet', hail: 'hail', lightning: 'thunderstorms', 'lightning-rainy': 'thunderstorms-rain', fog: 'fog', windy: 'wind', 'windy-variant': 'wind', exceptional: 'weather-mixed' };
  const wxIcon = (c) => `/hemma_assets/weather/${WXF[c] || 'cloudy'}-fill.svg?v=2`;
  const saverClock = (o) => {
    const h = CAMS.hassNow(), lang = h.language || undefined;
    const layer = document.createElement('div');
    layer.className = 'hemma-saver';
    const sr = layer.attachShadow({ mode: 'open' });
    const photo = o.style === 'clock_photo' ? saverPhoto() : '';
    const hvDark = o.style === 'clock' && o.bg !== 'black' && document.documentElement.classList.contains('hemma-hv') && !document.documentElement.classList.contains('hv-light') && !document.documentElement.classList.contains('hv-ink-w');
    if (o.style === 'clock_photo' || (o.style === 'clock' && o.bg === 'black') || hvDark) layer.classList.add('dk');
    const ck0 = (o.bg === 'artwork' || o.bg === 'album' ? o.rest : o.bg) || '';
    const dashKey = window._hemmaHV && window._hemmaHV.key ? window._hemmaHV.key() : null;
    const ck = ck0 === '' ? (dashKey && dashKey !== 'gray' ? dashKey : '') : ck0 === 'gray' ? '' : ck0;
    const pal = window._hemmaHV && window._hemmaHV.palette ? window._hemmaHV.palette() : null;
    const NIGHTS = { '': '#49575c', sand: '#5b564e', sage: '#4c5944', blue: '#44556d', rose: '#654d51', lavender: '#56506a', sea: '#395c5b', clay: '#684e42', plum: '#664b5c', honey: '#5c543f' };
    const bgc0 = ck === 'black' ? CLOCK_BG.black : pal ? '#' + (pal.light[ck || 'gray'] || pal.light.gray) : (CLOCK_BG[ck] || CLOCK_BG['']);
    const bgc = hvDark ? (pal ? '#' + (pal.dark[ck || 'gray'] || pal.dark.gray) : (NIGHTS[ck] || NIGHTS[''])) : bgc0;
    let ticks = '', nums = '';
    for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 148 : 140; ticks += `<line x1="${170 + Math.sin(a) * r1}" y1="${170 - Math.cos(a) * r1}" x2="${170 + Math.sin(a) * 158}" y2="${170 - Math.cos(a) * 158}" style="stroke:${i % 5 ? 'var(--sub)' : 'var(--ink)'}" stroke-width="${i % 5 ? 1.3 : 2.6}" stroke-linecap="round"${i % 5 ? ' opacity=".7"' : ''}/>`; }
    for (let n = 1; n <= 12; n++) { const a = n * 30 * Math.PI / 180; nums += `<text x="${170 + Math.sin(a) * 114}" y="${180 - Math.cos(a) * 114}" text-anchor="middle" font-size="30" font-weight="600" style="fill:var(--ink)">${n}</text>`; }
    const hand = (cls, len, col) => `<g class="${cls}"><line x1="170" y1="${170 - 4}" x2="170" y2="${170 - 30}" style="stroke:${col}" stroke-width="3.2" stroke-linecap="round"/><line x1="170" y1="${170 - 30}" x2="170" y2="${170 - len}" style="stroke:${col}" stroke-width="8" stroke-linecap="round"/></g>`;
    sr.innerHTML = `<style>${saverCss}${CLOCK_CSS}</style><div class="bg${photo ? ' photo' : ''}"${photo ? ` style="--ph:url('${esc(photo)}')"` : ` style="background:${bgc}"`}></div><div class="glows"></div><div class="stg still">
      <div class="dt"><div class="wd"><b></b> <span></span></div><div class="n"></div></div>
      <svg class="ck" viewBox="0 0 340 340">${ticks}${nums}${hand('hh', 92, 'var(--ink)')}${hand('mh', 140, 'var(--ink)')}<circle cx="170" cy="170" r="5.6" fill="none" style="stroke:var(--ink)" stroke-width="6"/><g class="sh"><line x1="170" y1="${170 + 4}" x2="170" y2="${170 + 28}" style="stroke:var(--sec)" stroke-width="2" stroke-linecap="round"/><line x1="170" y1="${170 - 4}" x2="170" y2="${170 - 160}" style="stroke:var(--sec)" stroke-width="2" stroke-linecap="round"/><circle cx="170" cy="170" r="4.3" fill="none" style="stroke:var(--sec)" stroke-width="3.4"/></g></svg>
      <div class="md" hidden><div class="ar"></div><div class="t"></div><div class="a"></div><button type="button" class="pl"></button></div>
      <div class="fc" hidden></div><div class="cal" hidden></div><div class="gl" hidden></div>
      <div class="wx" hidden><div class="c"><span></span><svg width="18" height="18" viewBox="0 0 16 16"><path d="M15 1 1 7l6 2 2 6z" style="fill:var(--hi)"/></svg></div><div class="tp"></div><i></i><div class="cd"></div><div class="hl"></div></div>
    </div>${o.np === 'keep' ? MINI_HTML : ''}<div class="dark"></div>`;
    stageFit(sr);
    const $ = (q) => sr.querySelector(q);
    const rot = (q, deg) => $(q).setAttribute('transform', `rotate(${deg} 170 170)`);
    const tick = () => {
      const d = new Date();
      $('.wd b').textContent = d.toLocaleDateString(lang, { weekday: 'short' });
      $('.wd span').textContent = d.toLocaleDateString(lang, { month: 'short' });
      $('.n').textContent = d.getDate();
      const sec = d.getSeconds(), min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60;
      rot('.hh', hr * 30); rot('.mh', min * 6); rot('.sh', sec * 6);
    };
    tick();
    SAVER.clock = setInterval(tick, 1000);
    // What's playing, with Play or Pause; with nothing playing, the spot shows what Studio picked: the calendar (Home at a glance without one), the forecast or nothing.
    let fc = null, cal = null;
    // Background "Artwork": the playing cover's colors as large soft clouds drifting behind everything, held light enough for the dark ink.
    const glowOn = o.style === 'clock' && (o.bg === 'artwork' || o.bg === 'album');
    const albumOn = o.style === 'clock' && o.bg === 'album';
    const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2; let h = 0, s = 0; if (M !== m) { const d = M - m; s = l > 0.5 ? d / (2 - M - m) : d / (M + m); h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; };
    // Spotify's pick: the cover's colors ranked as Android's Palette ranks a Vibrant swatch (a vivid mid-tone, weighted by how much of the cover it fills), then Dark Vibrant, Muted, Dark Muted.
    const vibrant = palVibrant;
    // As HomeView's own colors: a light pastel of the cover's hue under dark ink, never the cover darkened under white.
    const albumBg = (c) => { const v = `rgb(${albumTop(c).join(',')})`; return hvDark ? `linear-gradient(180deg, oklch(from ${v} 0.4 min(c, 0.05) h) 0%, oklch(from ${v} 0.34 min(c, 0.045) h) 100%)` : `linear-gradient(180deg, oklch(from ${v} 0.8 min(c, 0.1) h) 0%, oklch(from ${v} 0.72 min(c, 0.09) h) 100%)`; };
    let glowFor = null;
    const born = performance.now();
    const saverGlow = (art) => {
      if (!glowOn || art === glowFor) return;
      const first = glowFor === null || (!glowFor && performance.now() - born < 2500), key = [art, albumOn, hvDark].join('|');
      glowFor = art;
      const host = $('.glows');
      const swap = (cols) => {
        if (glowFor !== art) return;
        if (art) SAVER_GLOWS.set(key, cols);
        if (first) { host.innerHTML = ''; }
        const old = [...host.children], lay = document.createElement('div');
        lay.className = 'glay';
        if (cols && albumOn) lay.innerHTML = `<i class="gfill" style="background:${cols[0]}"></i>`;
        else if (cols) lay.innerHTML = cols.map((c, i) => `<i class="gb g${i + 1}" style="background:radial-gradient(circle, ${c} 0%, ${c.replace('hsl(', 'hsla(').replace(')', ' / 0.55)')} 38%, ${c.replace('hsl(', 'hsla(').replace(')', ' / 0)')} 72%)"></i>`).join('');
        host.appendChild(lay);
        if (first) return;
        lay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 9000, easing: 'ease-in-out' });
        old.forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 9000, easing: 'ease-in-out', fill: 'forwards' }).finished.then(() => n.remove(), () => n.remove()));
      };
      if (!art) { swap(null); return; }
      if (SAVER_GLOWS.has(key)) { swap(SAVER_GLOWS.get(key)); return; }
      const im = new Image(), same = String(art).startsWith('/') || String(art).startsWith(location.origin);
      if (!same) im.crossOrigin = 'anonymous';
      im.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = c.height = 40;
          const x = c.getContext('2d'); x.drawImage(im, 0, 0, 40, 40);
          const d = x.getImageData(0, 0, 40, 40).data, px = [];
          for (let i = 0; i < d.length; i += 4) { const q = hsl(d[i], d[i + 1], d[i + 2]); if (q[2] > 0.1 && q[2] < 0.92) px.push(q); }
          if (!px.length) { swap(null); return; }
          { const c0 = vibrant(d); if (c0) SAVER_ART.set(art, `rgb(${albumTop(c0).join(',')})`); }
          if (albumOn) { const c = vibrant(d); swap(c ? [albumBg(c)] : null); return; }
          // Four hue groups, the busiest first; a gray cover stays gray.
          const bins = new Map();
          // Hues average on the circle: a plain mean of red's 0 and 1 is cyan.
          px.forEach((q) => { const k = q[1] < 0.12 ? 'n' : String(Math.round(q[0] * 12) % 12); const b = bins.get(k) || { n: 0, x: 0, y: 0, s: 0 }; b.n++; b.x += Math.cos(q[0] * 2 * Math.PI); b.y += Math.sin(q[0] * 2 * Math.PI); b.s += k === 'n' ? 0 : q[1]; bins.set(k, b); });
          const top = [...bins.values()].sort((a, b) => b.n - a.n).slice(0, 4).map((b) => [((Math.atan2(b.y, b.x) / (2 * Math.PI)) + 1) % 1, b.s / b.n]);
          while (top.length < 4) top.push(top[top.length % Math.max(1, top.length)]);
          swap(top.map(([h, s]) => `hsl(${Math.round(h * 360)} ${Math.round(Math.min(0.6, s * 1.2) * 100)}% 66%)`));
        } catch (_) { swap(null); }
      };
      im.onerror = () => swap(null);
      im.src = art;
    };
    const cals = (Array.isArray(o.cals) && o.cals.length ? o.cals : Object.keys(h.states)).filter((k) => k.indexOf('calendar.') === 0 && h.states[k]);
    const idle = (o.idle === 'forecast' ? '' : o.idle) || (cals.length ? 'calendar' : 'glance'), keep = o.np === 'keep';
    // Built in rather than fetched: Safari drops masked images while the screen sits idle, which left an empty circle.
    const SVI = { 'calendar': "data:image/svg+xml,%3Csvg version=%221.1%22 xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%220 0 19.4607 17.999%22%3E%3Cg%3E%3Crect height=%2217.999%22 opacity=%220%22 width=%2219.4607%22 x=%220%22 y=%220%22/%3E%3Cpath d=%22M3.06359 17.999L16.3971 17.999C18.4456 17.999 19.4607 16.9776 19.4607 14.9665L19.4607 3.04922C19.4607 1.03808 18.4456 0.0166814 16.3971 0.0166814L3.06359 0.0166814C1.02753 0.0166814 0 1.03386 0 3.04922L0 14.9665C0 16.9819 1.02753 17.999 3.06359 17.999ZM2.9229 16.418C2.05114 16.418 1.57069 15.9582 1.57069 15.0554L1.57069 5.85362C1.57069 4.95081 2.05114 4.48896 2.9229 4.48896L16.5274 4.48896C17.3907 4.48896 17.8921 4.95081 17.8921 5.85362L17.8921 15.0554C17.8921 15.9582 17.3907 16.418 16.5274 16.418ZM7.81623 7.99219L8.38943 7.99219C8.74005 7.99219 8.84777 7.88446 8.84777 7.54631L8.84777 6.9731C8.84777 6.63706 8.74005 6.52933 8.38943 6.52933L7.81623 6.52933C7.47807 6.52933 7.37034 6.63706 7.37034 6.9731L7.37034 7.54631C7.37034 7.88446 7.47807 7.99219 7.81623 7.99219ZM11.0712 7.99219L11.6444 7.99219C11.9847 7.99219 12.0903 7.88446 12.0903 7.54631L12.0903 6.9731C12.0903 6.63706 11.9847 6.52933 11.6444 6.52933L11.0712 6.52933C10.7206 6.52933 10.6129 6.63706 10.6129 6.9731L10.6129 7.54631C10.6129 7.88446 10.7206 7.99219 11.0712 7.99219ZM14.3138 7.99219L14.887 7.99219C15.2273 7.99219 15.3453 7.88446 15.3453 7.54631L15.3453 6.9731C15.3453 6.63706 15.2273 6.52933 14.887 6.52933L14.3138 6.52933C13.9632 6.52933 13.8576 6.63706 13.8576 6.9731L13.8576 7.54631C13.8576 7.88446 13.9632 7.99219 14.3138 7.99219ZM4.57367 11.1849L5.14687 11.1849C5.49749 11.1849 5.60522 11.0793 5.60522 10.7411L5.60522 10.1679C5.60522 9.82977 5.49749 9.72204 5.14687 9.72204L4.57367 9.72204C4.23341 9.72204 4.11533 9.82977 4.11533 10.1679L4.11533 10.7411C4.11533 11.0793 4.23341 11.1849 4.57367 11.1849ZM7.81623 11.1849L8.38943 11.1849C8.74005 11.1849 8.84777 11.0793 8.84777 10.7411L8.84777 10.1679C8.84777 9.82977 8.74005 9.72204 8.38943 9.72204L7.81623 9.72204C7.47807 9.72204 7.37034 9.82977 7.37034 10.1679L7.37034 10.7411C7.37034 11.0793 7.47807 11.1849 7.81623 11.1849ZM11.0712 11.1849L11.6444 11.1849C11.9847 11.1849 12.0903 11.0793 12.0903 10.7411L12.0903 10.1679C12.0903 9.82977 11.9847 9.72204 11.6444 9.72204L11.0712 9.72204C10.7206 9.72204 10.6129 9.82977 10.6129 10.1679L10.6129 10.7411C10.6129 11.0793 10.7206 11.1849 11.0712 11.1849ZM14.3138 11.1849L14.887 11.1849C15.2273 11.1849 15.3453 11.0793 15.3453 10.7411L15.3453 10.1679C15.3453 9.82977 15.2273 9.72204 14.887 9.72204L14.3138 9.72204C13.9632 9.72204 13.8576 9.82977 13.8576 10.1679L13.8576 10.7411C13.8576 11.0793 13.9632 11.1849 14.3138 11.1849ZM4.57367 14.3797L5.14687 14.3797C5.49749 14.3797 5.60522 14.272 5.60522 13.9338L5.60522 13.3606C5.60522 13.0225 5.49749 12.9169 5.14687 12.9169L4.57367 12.9169C4.23341 12.9169 4.11533 13.0225 4.11533 13.3606L4.11533 13.9338C4.11533 14.272 4.23341 14.3797 4.57367 14.3797ZM7.81623 14.3797L8.38943 14.3797C8.74005 14.3797 8.84777 14.272 8.84777 13.9338L8.84777 13.3606C8.84777 13.0225 8.74005 12.9169 8.38943 12.9169L7.81623 12.9169C7.47807 12.9169 7.37034 13.0225 7.37034 13.3606L7.37034 13.9338C7.37034 14.272 7.47807 14.3797 7.81623 14.3797ZM11.0712 14.3797L11.6444 14.3797C11.9847 14.3797 12.0903 14.272 12.0903 13.9338L12.0903 13.3606C12.0903 13.0225 11.9847 12.9169 11.6444 12.9169L11.0712 12.9169C10.7206 12.9169 10.6129 13.0225 10.6129 13.3606L10.6129 13.9338C10.6129 14.272 10.7206 14.3797 11.0712 14.3797Z%22 fill=%22white%22 fill-opacity=%220.85%22/%3E%3C/g%3E%3C/svg%3E", 'lock-fill': "data:image/svg+xml,%3Csvg version=%221.1%22 xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%22-0.4904 -0.7084 17.3286 25.0301%22%3E%3Cg%3E%3Crect height=%2225.0301%22 opacity=%220%22 width=%2217.3286%22 x=%22-0.4904%22 y=%22-0.7084%22/%3E%3Cpath d=%22M2.63672 22.9922L13.3594 22.9922C15.082 22.9922 15.9961 22.0547 15.9961 20.2031L15.9961 12.1289C15.9961 10.2773 15.082 9.35156 13.3594 9.35156L2.63672 9.35156C0.914062 9.35156 0 10.2773 0 12.1289L0 20.2031C0 22.0547 0.914062 22.9922 2.63672 22.9922ZM2.05078 10.2539L3.91406 10.2539L3.91406 6.29297C3.91406 3.33984 5.80078 1.76953 7.99219 1.76953C10.1836 1.76953 12.0938 3.33984 12.0938 6.29297L12.0938 10.2539L13.9453 10.2539L13.9453 6.55078C13.9453 2.14453 11.0625 0 7.99219 0C4.93359 0 2.05078 2.14453 2.05078 6.55078Z%22 fill=%22white%22 fill-opacity=%220.85%22/%3E%3C/g%3E%3C/svg%3E", 'light': "data:image/svg+xml,%3Csvg version=%221.1%22 xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%22-0.4809 -0.8399 16.9931 29.6759%22%3E%3Cg%3E%3Crect height=%2229.6759%22 opacity=%220%22 width=%2216.9931%22 x=%22-0.4809%22 y=%22-0.8399%22/%3E%3Cpath d=%22M4.13672 23.8711L11.5547 23.8711C11.9414 23.8711 12.2344 23.5664 12.2344 23.1797C12.2344 22.8047 11.9414 22.5 11.5547 22.5L4.13672 22.5C3.75 22.5 3.44531 22.8047 3.44531 23.1797C3.44531 23.5664 3.75 23.8711 4.13672 23.8711ZM7.83984 27.2695C9.65625 27.2695 11.168 26.3789 11.2852 25.0312L4.40625 25.0312C4.48828 26.3789 6.01172 27.2695 7.83984 27.2695Z%22 fill=%22white%22 fill-opacity=%220.5%22/%3E%3Cpath d=%22M0 7.21875C0 11.7188 2.96484 12.832 3.44531 20.6484C3.46875 21.0703 3.72656 21.3398 4.17188 21.3398L11.5078 21.3398C11.9648 21.3398 12.2109 21.0703 12.2461 20.6484C12.7266 12.832 15.6797 11.7188 15.6797 7.21875C15.6797 3.17578 12.2227 0 7.83984 0C3.45703 0 0 3.17578 0 7.21875Z%22 fill=%22white%22/%3E%3C/g%3E%3C/svg%3E", 'temp-medium': "data:image/svg+xml,%3Csvg version=%221.1%22 xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%223.4 -0.9 9.6 21.3%22%3E%3Cpath d=%22M8.1976 19.5321C10.7921 19.5321 12.9029 17.4171 12.9029 14.8165C12.9029 13.4466 12.3341 12.2406 11.2669 11.2838C11.1358 11.159 11.1212 11.1214 11.1212 10.9195L11.1212 3.17242C11.1212 1.30509 9.92596-3.55271e-15 8.1976-3.55271e-15C6.45678-3.55271e-15 5.25118 1.30509 5.25118 3.17242L5.25118 10.9195C5.25118 11.1214 5.23661 11.159 5.10547 11.2838C4.03825 12.2406 3.46947 13.4466 3.46947 14.8165C3.46947 17.4171 5.57206 19.5321 8.1976 19.5321ZM8.1976 18.0588C6.41338 18.0588 4.95525 16.6007 4.95525 14.8165C4.95525 13.7471 5.48032 12.7836 6.38996 12.1667C6.64762 11.9963 6.74942 11.836 6.74942 11.4829L6.74942 3.22418C6.74942 2.18992 7.32916 1.49824 8.1976 1.49824C9.03288 1.49824 9.62297 2.18992 9.62297 3.22418L9.62297 11.4829C9.62297 11.836 9.72477 11.9963 9.99278 12.1667C10.8921 12.7836 11.4171 13.7471 11.4171 14.8165C11.4171 16.6007 9.95901 18.0588 8.1976 18.0588ZM8.18725 16.8858C9.33406 16.8858 10.2523 15.9675 10.2523 14.8061C10.2523 14.0145 9.80566 13.3518 9.14292 12.9945C8.86456 12.8428 8.77523 12.7389 8.77523 12.3317L8.77523 7.71856C8.77523 7.30544 8.51144 7.03743 8.18725 7.03743C7.86096 7.03743 7.59717 7.30544 7.59717 7.71856L7.59717 12.3317C7.59717 12.7389 7.49748 12.8428 7.21912 12.9945C6.56673 13.3518 6.12004 14.0145 6.12004 14.8061C6.12004 15.9675 7.03833 16.8858 8.18725 16.8858Z%22 fill=%22white%22/%3E%3C/svg%3E", 'bell': "data:image/svg+xml,%3Csvg version=%221.1%22 xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%22-3.3 -2.23 25 25%22%3E%3Cg%3E%3Crect height=%2220.5437%22 opacity=%220%22 width=%2218.4229%22 x=%220%22 y=%220%22/%3E%3Cpath d=%22M1.47543 16.6424L16.9475 16.6424C17.8737 16.6424 18.4229 16.1635 18.4229 15.4526C18.4229 14.4764 17.4285 13.594 16.5856 12.7342C15.9341 12.0595 15.7647 10.6748 15.687 9.54722C15.6176 5.80108 14.6249 3.21563 12.03 2.27402C11.6589 1.00683 10.6561 0 9.21145 0C7.76889 0 6.76398 1.00683 6.39286 2.27402C3.79797 3.21563 2.80531 5.80108 2.72553 9.54722C2.6582 10.6748 2.48053 12.0595 1.8394 12.7342C0.986124 13.594 2.22045e-15 14.4764 2.22045e-15 15.4526C2.22045e-15 16.1635 0.54919 16.6424 1.47543 16.6424ZM9.21145 20.5416C10.8722 20.5416 12.0697 19.3398 12.2051 17.9655L6.21781 17.9655C6.34282 19.3398 7.55284 20.5416 9.21145 20.5416Z%22 fill=%22white%22 fill-opacity=%221%22/%3E%3C/g%3E%3C/svg%3E" };
    const ico = (n) => `<i><b style="--i:url(&quot;${SVI[n] || (window.hemmaIconUrl ? window.hemmaIconUrl(n) : '')}&quot;)"></b></i>`;
    const glance = () => {
      const S = CAMS.hassNow().states, ids = Object.keys(S), on = (d, f) => ids.filter((k) => k.indexOf(d + '.') === 0 && f(S[k]));
      const lights = on('light', (x) => x.state === 'on' && !(x.attributes || {}).entity_id).length;
      const open = on('lock', (x) => x.state !== 'locked' && x.state !== 'unavailable').length, locks = on('lock', () => true).length;
      const temps = on('climate', (x) => Number.isFinite(Number((x.attributes || {}).current_temperature))).map((k) => Number(S[k].attributes.current_temperature));
      const alerts = on('binary_sensor', (x) => x.state === 'on' && ['smoke', 'gas', 'moisture', 'carbon_monoxide', 'safety', 'problem', 'tamper'].includes((x.attributes || {}).device_class)).length;
      const rows = [];
      if (locks) rows.push(['lock-fill', open ? T('saver.unlocked', '{n} unlocked', { n: open }) : T('saver.all_locked', 'All doors locked')]);
      rows.push(['light', lights === 1 ? T('saver.light_on_one', '1 light on') : lights ? T('saver.lights_on', '{n} lights on', { n: lights }) : T('saver.lights_off', 'All lights off')]);
      if (temps.length) rows.push(['temp-medium', T('saver.inside', 'Inside {t}°', { t: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) })]);
      let notes = 0;
      try { notes = window._hemmaNotify ? window._hemmaNotify.rows.length : 0; } catch (_) {}
      rows.push(['bell', alerts ? T('saver.alerts', '{n} alerts', { n: alerts }) : notes === 1 ? T('saver.notification_one', '1 notification') : notes ? T('saver.notifications', '{n} notifications', { n: notes }) : T('security.no_alerts', 'No Alerts')]);
      $('.gl').innerHTML = rows.map(([i, t]) => `<div>${ico(i)}<span>${esc(t)}</span></div>`).join('');
    };
    const h12 = new Intl.DateTimeFormat(lang, { hour: 'numeric' }).resolvedOptions().hour12;
    const clk = (d) => h12 ? String(d.getHours() % 12 || 12) + (d.getMinutes() ? ':' + String(d.getMinutes()).padStart(2, '0') : '') : d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
    const span = (a, b) => {
      if (+a === +b) return h12 ? `${esc(clk(a))}<small>${a.getHours() < 12 ? 'AM' : 'PM'}</small>` : esc(clk(a));
      if (!h12) return esc(clk(a) + '–' + clk(b));
      const pa = a.getHours() < 12 ? 'AM' : 'PM', pb = b.getHours() < 12 ? 'AM' : 'PM';
      return pa === pb ? `${esc(clk(a))}–${esc(clk(b))}<small>${pb}</small>` : `${esc(clk(a))}<small>${pa}</small>–${esc(clk(b))}<small>${pb}</small>`;
    };
    const calendar = () => {
      const hs = CAMS.hassNow();
      if (!cals.length || !hs.callApi) return;
      const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
      const tom = new Date(end); tom.setDate(tom.getDate() + 6);
      Promise.all(cals.map((id) => hs.callApi('GET', `calendars/${id}?start=${encodeURIComponent(now.toISOString())}&end=${encodeURIComponent(tom.toISOString())}`).catch(() => []))).then((all) => {
        const evs = [].concat(...all).map((e) => ({ name: e.summary || '', day: !!(e.start && e.start.date && !e.start.dateTime), a: new Date((e.start && (e.start.dateTime || e.start.date + 'T00:00')) || 0), b: new Date((e.end && (e.end.dateTime || e.end.date + 'T00:00')) || 0) }))
          .filter((e) => e.b > now).sort((x, y) => x.a - y.a);
        const today = evs.filter((e) => e.a < end), days = today.filter((e) => e.day), timed = today.filter((e) => !e.day);
        // With nothing left today, the widget becomes Up Next: the coming week's events, each with its day.
        const later = !today.length ? evs : [];
        cal = { head: days.length ? T('saver.all_day', '{n} all-day', { n: days.length }) : later.length ? T('saver.up_next', 'Up Next') : !timed.length ? T('saver.no_events', 'No more events today') : '', list: timed.length ? timed : later };
        const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
        const dayOf = (d) => { const z = new Date(d); z.setHours(0, 0, 0, 0); const n = Math.round((z - d0) / 864e5); return n === 1 ? T('saver.tomorrow', 'Tomorrow') : d.toLocaleDateString(lang, { weekday: 'short' }); };
        const when = (e) => later.length ? (e.day ? esc(dayOf(e.a)) : `${esc(dayOf(e.a))} ${span(e.a, e.b)}`) : span(e.a, e.b);
        const max = cal.head ? 2 : 3, shown = cal.list.slice(0, max), rest = cal.list.length - shown.length;
        $('.cal').innerHTML = (cal.head ? `<div class="hd">${ico('calendar')}<span>${esc(cal.head)}</span></div>` : '')
          + shown.map((e) => `<div class="ev"><span class="tm">${when(e)}</span><span class="nm">${esc(e.name)}</span></div>`).join('')
          + (rest > 0 ? `<div class="more">${esc(rest === 1 ? T('saver.one_more', '1 more event') : T('saver.more_events', '{n} more events', { n: rest }))}</div>` : '');
        media();
      });
    };
    const media = () => {
      const hs = CAMS.hassNow(), src = saverNP(), md = $('.md');
      const show = src && !keep ? '' : idle === 'calendar' && !cals.length ? 'glance' : idle;
      if (!src) saverGlow('');
      md.hidden = !src || keep;
      $('.fc').hidden = show !== 'forecast' || !fc;
      $('.cal').hidden = show !== 'calendar' || !cal;
      $('.gl').hidden = show !== 'glance';
      $('.stg').classList.toggle('wide', show === 'calendar');
      if (show === 'glance') glance();
      if (!src) return;
      saverGlow(src.art || '');
      if (keep) return;
      md._src = src;
      saverXfade($('.md .ar'), src.art ? `url("${String(src.art).replace(/"/g, '%22')}")` : '');
      $('.md .t').textContent = src.title || ''; $('.md .a').textContent = src.subtitle || '';
      const st = hs.states[src.entity], on = st && st.state === 'playing';
      $('.md .pl').innerHTML = (on ? MD_I.pause : MD_I.play) + `<span>${esc(on ? T('media.pause', 'Pause') : T('media.play', 'Play'))}</span>`;
    };
    $('.md .pl').onclick = (e) => { e.stopPropagation(); const src = $('.md')._src; if (src) CAMS.hassNow().callService('media_player', 'media_play_pause', { entity_id: src.entity }).catch(() => {}); };
    $('.md .ar').onclick = (e) => { e.stopPropagation(); saverOpenNP($('.md')._src, $('.md .ar')); };
    $('.gl').onclick = (e) => {
      const row = e.target.closest && e.target.closest('.gl > div');
      if (!row || row !== $('.gl').lastElementChild || !window._hemmaNotify || !window._hemmaNotify.rows.length) return;
      e.stopPropagation();
      saverNotes(sr, row);
    };
    media();
    SAVER.mini = setInterval(media, 2000);
    const wid = saverViewVar('weather_entity') || Object.keys(h.states).find((k) => k.indexOf('weather.') === 0);
    const wx = () => {
      const hs = CAMS.hassNow(), w = wid && hs.states[wid];
      $('.wx').hidden = !w;
      if (!w) return;
      const a = w.attributes || {}, u = a.temperature_unit ? '' : '';
      $('.wx .c span').textContent = (hs.config && hs.config.location_name) || a.friendly_name || '';
      $('.wx .tp').textContent = a.temperature != null ? Math.round(a.temperature) + '°' + u : '';
      $('.wx i').style.setProperty('--i', `url('${wxIcon(w.state)}')`);
      try { $('.wx .cd').textContent = hs.formatEntityState ? hs.formatEntityState(w) : w.state; } catch (_) { $('.wx .cd').textContent = w.state; }
      const f0 = fc && fc[0];
      $('.wx .hl').textContent = f0 && f0.temperature != null ? `H:${Math.round(f0.temperature)}° L:${Math.round(f0.templow != null ? f0.templow : f0.temperature)}°` : '';
    };
    const forecast = () => {
      const hs = CAMS.hassNow();
      if (!wid || !hs.connection) return;
      hs.connection.sendMessagePromise({ type: 'call_service', domain: 'weather', service: 'get_forecasts', service_data: { type: 'daily' }, target: { entity_id: wid }, return_response: true }).then((r) => {
        fc = (((r && r.response) || {})[wid] || {}).forecast || null;
        if (fc) $('.fc').innerHTML = fc.slice(1, 6).map((d) => `<div><span>${esc(new Date(d.datetime).toLocaleDateString(lang, { weekday: 'short' }))}</span><i style="--i:url('${wxIcon(d.condition)}')"></i><span>${Math.round(d.temperature)}° / ${Math.round(d.templow != null ? d.templow : d.temperature)}°</span></div>`).join('');
        wx(); media();
      }).catch(() => {});
    };
    setTimeout(() => { const g = $('.stg'); if (g) g.classList.remove('still'); }, 2500);
    wx(); forecast(); calendar();
    SAVER.wx = setInterval(() => { wx(); }, 60000);
    SAVER.cal = setInterval(calendar, 5 * 60000);
    SAVER.fc = setInterval(forecast, 30 * 60000);
    saverDrift([['.dt', '.ck'], ['.md'], ['.wx', '.fc'], ['.cal', '.gl']].map((g) => g.map((q) => $(q))));
    if (keep) saverMini(sr, 'pill');
    saverMount(layer, sr, o, (n) => n.classList.contains('md') || n.classList.contains('wx'));
    $('.wx').style.cursor = 'pointer';
    $('.wx').onclick = (e) => { e.stopPropagation(); saverWeather(sr, $('.wx'), fc, lang, wid); };
  };
  // The mini player: whatever Now Playing would show first, while it plays.
  const saverMini = (sr, key = 'mini') => {
    const mini = sr.querySelector('.mini');
    // Pops in with a little overshoot and collapses when it leaves.
    let shown = false, out = null;
    const born = performance.now();
    const show = (on) => {
      if (on === shown) return;
      shown = on;
      if (out) { out.cancel(); out = null; }
      if (on) {
        mini.classList.add('on');
        // Already playing when the screensaver (re)opens, as after the full-screen player: it is simply there.
        if (performance.now() - born > 1500) mini.animate([{ scale: '0.6', opacity: 0 }, { scale: '1.03', opacity: 1, offset: 0.6 }, { scale: '1', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      } else {
        out = mini.animate([{ scale: '1', opacity: 1 }, { scale: '0.6', opacity: 0 }], { duration: 300, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
        out.finished.then(() => { mini.classList.remove('on'); out && out.cancel(); out = null; }, () => {});
      }
    };
    const minip = () => {
      const hs = CAMS.hassNow();
      let src = null;
      src = saverNP(); if (src && !src.playing) src = null;
      show(!!src);
      if (!src) return;
      mini._src = src;
      saverXfade(mini.querySelector('.ma'), src.art ? `url("${String(src.art).replace(/"/g, '%22')}")` : '');
    };
    mini.onclick = (e) => {
      e.stopPropagation();
      const src = mini._src;
      if (!src) return;
      saverOpenNP(src, mini.querySelector('.ma'));
    };
    minip();
    SAVER[key] = setInterval(minip, 2000);
    return mini;
  };
  // HomeView's two clock faces, drawn to the screen: Numerals in the Background color, and Classic with its ticks out to the rounded corners.
  const MINI_HTML = `<div class="mini" role="button" aria-label="${esc(T('now_playing.title', 'Now Playing'))}"><i class="gx gd"></i><i class="gx gs"></i><i class="gx gt"></i><i class="gx gb"></i><span class="ma"></span><svg class="dots" width="29" height="4.6" viewBox="0 0 25 4"><circle cx="1.60" cy="2" r="1.6" style="--o:1;--o2:1.00;--dl:0.00s"/><circle cx="5.96" cy="2" r="1.6" style="--o:0.8;--o2:1.00;--dl:0.17s"/><circle cx="10.32" cy="2" r="1.6" style="--o:0.62;--o2:1.00;--dl:0.34s"/><circle cx="14.68" cy="2" r="1.6" style="--o:0.47;--o2:0.97;--dl:0.51s"/><circle cx="19.04" cy="2" r="1.6" style="--o:0.35;--o2:0.85;--dl:0.68s"/><circle cx="23.40" cy="2" r="1.6" style="--o:0.26;--o2:0.76;--dl:0.85s"/></svg></div>`;
  const saverFace = (o) => {
    const lang = (CAMS.hassNow() || {}).language || undefined;
    const layer = document.createElement('div');
    layer.className = 'hemma-saver';
    const sr = layer.attachShadow({ mode: 'open' });
    const cl = document.documentElement.classList, night = o.bg === 'black' || (cl.contains('hemma-hv') && !cl.contains('hv-light') && !cl.contains('hv-ink-w'));
    const npOn = o.bg === 'artwork' || o.bg === 'album';
    const ck0 = (npOn ? o.rest : o.bg) || '';
    const dashKey = window._hemmaHV && window._hemmaHV.key ? window._hemmaHV.key() : null;
    const ck = ck0 === '' || ck0 === 'black' ? (dashKey && dashKey !== 'gray' ? dashKey : '') : ck0 === 'gray' ? '' : ck0;
    const pal = window._hemmaHV && window._hemmaHV.palette ? window._hemmaHV.palette() : null;
    const NIGHTS = { '': '#49575c', sand: '#5b564e', sage: '#4c5944', blue: '#44556d', rose: '#654d51', lavender: '#56506a', sea: '#395c5b', clay: '#684e42', plum: '#664b5c', honey: '#5c543f' };
    const tone = pal ? '#' + (pal.light[ck || 'gray'] || pal.light.gray) : (CLOCK_BG[ck] || CLOCK_BG['']);
    const toneN = pal ? '#' + (pal.dark[ck || 'gray'] || pal.dark.gray) : (NIGHTS[ck] || NIGHTS['']);
    const classic = o.face === 'classic';
    sr.innerHTML = `<style>${saverCss}
      .fc { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
      .fc .fbg { fill: var(--fbg); } .fc .fink { fill: var(--fink); } .fc .ftk { stroke: var(--fink); } .fc .fsub { stroke: var(--fsub); }
      .fc .fbg, .fc .fink, .shw .fsc, .shw .fdot { transition: fill 2.5s ease; } .fc .ftk, .fc .fsub { transition: stroke 2.5s ease; }
      :host(.nofade) :is(.fc *, .shw *) { transition: none !important; }
      .shw { position: absolute; will-change: transform; pointer-events: none; }
      .hl { position: absolute; pointer-events: none; will-change: transform; } .hl svg { display: block; overflow: visible; }
      .shw svg { display: block; overflow: visible; } .shw .fsc { fill: var(--fsc); } .shw .fdot { fill: var(--fdot); }
      .mini { top: max(24px, calc(env(safe-area-inset-top, 0px) + 12px)); }
    </style><svg class="fc"></svg><div class="shw"></div><div class="mini" role="button" aria-label="${esc(T('now_playing.title', 'Now Playing'))}"><i class="gx gd"></i><i class="gx gs"></i><i class="gx gt"></i><i class="gx gb"></i><span class="ma"></span><svg class="dots" width="29" height="4.6" viewBox="0 0 25 4"><circle cx="1.60" cy="2" r="1.6" style="--o:1;--o2:1.00;--dl:0.00s"/><circle cx="5.96" cy="2" r="1.6" style="--o:0.8;--o2:1.00;--dl:0.17s"/><circle cx="10.32" cy="2" r="1.6" style="--o:0.62;--o2:1.00;--dl:0.34s"/><circle cx="14.68" cy="2" r="1.6" style="--o:0.47;--o2:0.97;--dl:0.51s"/><circle cx="19.04" cy="2" r="1.6" style="--o:0.35;--o2:0.85;--dl:0.68s"/><circle cx="23.40" cy="2" r="1.6" style="--o:0.26;--o2:0.76;--dl:0.85s"/></svg></div><div class="dark"></div>`;
    const svg = sr.querySelector('.fc'), shw = sr.querySelector('.shw');
    // Day and night shades of the Background color, or of the artwork while something plays.
    const paint = (day, dark) => {
      const L = layer.style;
      L.setProperty('--fbg', classic ? (night ? dark : day) : (night ? '#121212' : day));
      L.setProperty('--fink', classic ? (night ? '#fff' : '#1c1c1e') : (night ? day : '#0b0b0b'));
      L.setProperty('--fsub', night ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.45)');
      L.setProperty('--fsc', classic ? (night ? '#ff9f0a' : '#1c1c1e') : `color-mix(in oklab, ${day} 35%, #fff)`);
      L.setProperty('--fdot', classic ? '#fff' : day);
    };
    paint(tone, toneN);
    let CX = 0, CY = 0, secR = 0, sweep = null, cornerA = 0;
    const warp = (deg) => {
      if (!cornerA) return deg;
      const d = ((deg % 360) + 360) % 360, q = Math.floor(d / 90), t = d - q * 90, C = cornerA;
      const v = q % 2 === 0 ? (t <= 60 ? t * C / 60 : C + (t - 60) * (90 - C) / 30) : (t <= 30 ? t * (90 - C) / 30 : 90 - C + (t - 30) * C / 60);
      return deg - d + q * 90 + v;
    };
    // The second hand is its own layer, swept by the compositor, so a busy page never makes it stutter.
    const placeSec = () => {
      const R = secR, w = R * 0.05, top = R * 0.92;
      Object.assign(shw.style, { left: CX - w / 2 + 'px', top: CY - top + 'px', width: w + 'px', height: R * 1.08 + 'px', transformOrigin: `${w / 2}px ${top}px` });
      shw.innerHTML = `<svg viewBox="${CX - w / 2} ${CY - top} ${w} ${R * 1.08}" width="100%" height="100%"><rect class="fsc" x="${CX - R * 0.005}" y="${CY - top}" width="${R * 0.01}" height="${R * 1.08}" rx="${R * 0.005}"/><circle class="fsc" cx="${CX}" cy="${CY}" r="${R * 0.022}"/><circle class="fdot" cx="${CX}" cy="${CY}" r="${R * 0.011}"/></svg>`;
      const frames = cornerA ? Array.from({ length: 61 }, (_, i) => ({ transform: `rotate(${warp(i * 6)}deg)`, offset: i / 60 })) : [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }];
      if (!sweep) sweep = shw.animate(frames, { duration: 60000, iterations: Infinity });
      else sweep.effect.setKeyframes(frames);
      syncSec();
    };
    const syncSec = () => { if (!sweep) return; const want = Date.now() % 60000, have = (sweep.currentTime || 0) % 60000; if (Math.abs(want - have) > 80 && Math.abs(want - have) < 59920) sweep.currentTime = want; };
    const hand = (cls, len, w, neck, nw, edge) => { const st = edge ? ` stroke="${edge}" stroke-width="1.2"` : ''; return `<g class="${cls}"><rect x="${CX - nw / 2}" y="${CY - neck - w * 0.3}" width="${nw}" height="${neck + w * 0.3}" rx="${nw / 2}" fill="#fff"${st}/><rect x="${CX - w / 2}" y="${CY - len}" width="${w}" height="${len - neck}" rx="${w / 2}" fill="#fff"${st}/></g>`; };
    // Each hand is its own layer, turned whole with its shadow: a filtered SVG group repaints only the hand's old outline in Safari and leaves its shadow behind.
    let handsCfg = null;
    const hands = (R, edge, ringEdge) => { secR = R; handsCfg = [R, edge, ringEdge]; return ''; };
    const layerOf = (cls) => { let el = sr.querySelector('.hl.' + cls); if (!el) { el = document.createElement('div'); el.className = 'hl ' + cls; shw.before(el); } return el; };
    const placeHands = () => {
      if (!handsCfg) return;
      const [R, edge, ringEdge] = handsCfg;
      [['hh', R * 0.5], ['mh', R * 0.8]].forEach(([cls, len]) => {
        const w = R * 0.058, el = layerOf(cls), m = 3, bw = w + m * 2, bh = len + m * 2;
        // Transparent margin keeps the hand's edges inside the layer: Safari smooths a turned layer's content but not its own edges.
        Object.assign(el.style, { left: CX - bw / 2 + 'px', top: CY - len - m + 'px', width: bw + 'px', height: bh + 'px', transformOrigin: `${bw / 2}px ${len + m}px` });
        el.innerHTML = `<svg viewBox="${CX - bw / 2} ${CY - len - m} ${bw} ${bh}" width="100%" height="100%">${hand(cls, len, w, R * 0.16, R * 0.02, edge)}</svg>`;
        el._sh = [R * 0.012, R * 0.028];
      });
      const r = R * 0.042, hub = layerOf('hub'), pad = r + 2;
      Object.assign(hub.style, { left: CX - pad + 'px', top: CY - pad + 'px', width: pad * 2 + 'px', height: pad * 2 + 'px', filter: `drop-shadow(0 ${(R * 0.012).toFixed(2)}px ${(R * 0.028).toFixed(2)}px rgba(0,0,0,.28))` });
      hub.innerHTML = `<svg viewBox="${CX - pad} ${CY - pad} ${pad * 2} ${pad * 2}" width="100%" height="100%"><circle cx="${CX}" cy="${CY}" r="${r}" fill="#fff"${ringEdge ? ` stroke="${ringEdge}" stroke-width="1.2"` : ''}/></svg>`;
      sr.querySelectorAll('.hl').forEach((el) => shw.before(el));
    };
    const edgeAt = (a, hw, hh, r) => {
      const dx = Math.sin(a), dy = -Math.cos(a);
      let t = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9));
      const x = dx * t, y = dy * t, cx = hw - r, cy = hh - r;
      if (Math.abs(x) > cx && Math.abs(y) > cy) { const ox = Math.sign(x) * cx, oy = Math.sign(y) * cy, b = dx * ox + dy * oy, c = ox * ox + oy * oy - r * r; t = b + Math.sqrt(b * b - c); }
      return t;
    };
    const draw = () => {
      const W = layer.clientWidth || innerWidth, H = layer.clientHeight || innerHeight;
      CX = W / 2; CY = H / 2;
      let out = `<rect class="fbg" width="${W}" height="${H}"/>`;
      if (classic) {
        const m = Math.min(W, H) * 0.04, hw = W / 2 - m, hh = H / 2 - m;
        cornerA = 0;
        const k = Math.min(hw, hh), R = matchMedia('(hover: hover) and (pointer: fine)').matches ? 10 : Math.min(W, H) < 600 ? 55 : 18, rr = Math.max(R - m, k * 0.04);
        for (let i = 0; i < 60; i++) {
          const a = warp(i * 6) * Math.PI / 180, big = i % 5 === 0, e = edgeAt(a, hw, hh, rr), L = big ? k * 0.16 : k * 0.05, dx = Math.sin(a), dy = -Math.cos(a);
          out += `<line class="${big ? 'ftk' : 'fsub'}" x1="${CX + dx * (e - L)}" y1="${CY + dy * (e - L)}" x2="${CX + dx * e}" y2="${CY + dy * e}" stroke-width="${big ? k * 0.016 : k * 0.0065}" stroke-linecap="round"/>`;
        }
        const fs = Math.min(W, H) * 0.13;
        out += `<g class="fink" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-weight="600" font-size="${fs}" text-anchor="middle">`
          + [[0, '12'], [90, '3'], [180, '6'], [270, '9']].map(([d, v]) => { const a = d * Math.PI / 180, e = edgeAt(a, hw, hh, rr) - k * 0.31; return `<text x="${CX + Math.sin(a) * e}" y="${CY - Math.cos(a) * e + fs * 0.35}">${v}</text>`; }).join('') + '</g>';
        out += hands(k * 1.05, night ? null : 'rgba(0,0,0,0.18)', night ? null : 'rgba(0,0,0,0.25)');
      } else {
        const S = Math.min(H * 0.88, W * 0.71), fs = S * 0.62, pm = sr.querySelector('.mini');
        CY = H / 2 - S * 0.017;
        CY += Math.max(0, (parseFloat(pm && getComputedStyle(pm).top) || 24) + 72 - (CY - S * 0.007 - fs * 0.72));
        const ds = Math.min(W, H) * 0.045, fm = Math.round(Math.max(28, Math.min(W, H) * 0.05));
        layer.style.setProperty('--fm', fm + 'px');
        out += `<g class="fink" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-weight="400" font-size="${fs}" text-anchor="middle" style="letter-spacing:-0.04em">`
          + `<text x="${CX}" y="${CY - S * 0.007}">12</text><text x="${CX}" y="${CY + S * 0.488}">6</text><text x="${CX - S * 0.47}" y="${CY + S * 0.215}">9</text><text x="${CX + S * 0.47}" y="${CY + S * 0.215}">3</text></g>`
          + `<text class="fd fink" x="${fm}" y="${H - fm - 30 + ds * 0.36}" font-family="-apple-system, BlinkMacSystemFont, system-ui, sans-serif" font-weight="700" font-size="${ds}" style="letter-spacing:-0.02em"></text>`
          + hands(S * 0.5, null, null);
      }
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = out;
      placeHands();
      placeSec();
      tick();
    };
    const rot = (q, deg) => {
      const el = sr.querySelector('.hl' + q);
      if (!el || !el._sh) return;
      const t = deg * Math.PI / 180, [d, b] = el._sh;
      el.style.transform = `rotate(${deg}deg)`;
      el.style.filter = `drop-shadow(${(d * Math.sin(t)).toFixed(2)}px ${(d * Math.cos(t)).toFixed(2)}px ${b.toFixed(2)}px rgba(0,0,0,.28))`;
    };
    const tick = () => {
      const d = new Date(), sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60;
      rot('.hh', warp(hr * 30)); rot('.mh', warp(min * 6));
      if (d.getSeconds() % 10 === 0) syncSec();
      const fd = svg.querySelector('.fd');
      if (fd) fd.textContent = d.toLocaleDateString(lang, { weekday: 'short' }).toUpperCase().replace(/\.$/, '') + ' ' + d.getDate();
    };
    // Now Playing: the face takes the artwork's color while it plays, as Today's Artwork Color does, and goes back to the Background color after.
    let artFor = null;
    const artwork = () => {
      if (!npOn) return;
      const src = saverNP(), art = src && src.playing ? src.art || '' : '';
      if (art === artFor) return;
      artFor = art;
      if (!art) { paint(tone, toneN); return; }
      const use = (rgb) => rgb ? paint(`oklch(from ${rgb} 0.8 min(c, 0.1) h)`, `oklch(from ${rgb} 0.4 min(c, 0.05) h)`) : paint(tone, toneN);
      if (SAVER_ART.has(art)) { use(SAVER_ART.get(art)); return; }
      const im = new Image();
      if (!(String(art).startsWith('/') || String(art).startsWith(location.origin))) im.crossOrigin = 'anonymous';
      im.onload = () => {
        if (artFor !== art) return;
        try {
          const c = document.createElement('canvas'); c.width = c.height = 40;
          const x = c.getContext('2d'); x.drawImage(im, 0, 0, 40, 40);
          const v = palVibrant(x.getImageData(0, 0, 40, 40).data);
          if (!v) { SAVER_ART.set(art, null); paint(tone, toneN); return; }
          const rgb = `rgb(${albumTop(v).join(',')})`;
          SAVER_ART.set(art, rgb);
          paint(`oklch(from ${rgb} 0.8 min(c, 0.1) h)`, `oklch(from ${rgb} 0.4 min(c, 0.05) h)`);
        } catch (_) { paint(tone, toneN); }
      };
      im.onerror = () => paint(tone, toneN);
      im.src = art;
    };
    SAVER.clock = setInterval(() => { tick(); if (new Date().getSeconds() % 2 === 0) artwork(); }, 1000);
    layer.classList.add('nofade'); artwork(); requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove('nofade')));
    if (window.ResizeObserver) new ResizeObserver(() => draw()).observe(layer);
    saverMini(sr);
    saverMount(layer, sr, o, (n) => n.classList.contains('mini'));
    draw();
    artwork();
  };
  // Stacked, as HomeView's: the hour over the minutes, tall and narrow on the right; the date with the next sunrise or sunset at the top left, the weather at the bottom left.
  // SF Pro Condensed with its corners rounded by a round-joined outline; Fredoka where the system has no SF Pro widths.
  let stackFace = null;
  const stackFont = () => {
    if (stackFace) return stackFace;
    if (!document.getElementById('hemma-fredoka')) {
      const st = document.createElement('style');
      st.id = 'hemma-fredoka';
      st.textContent = '@font-face{font-family:"Hemma Fredoka";src:url(/hemma_assets/fonts/fredoka-latin-variable.woff2) format("woff2");font-weight:300 700;font-stretch:75% 125%;font-display:block;}';
      document.head.appendChild(st);
    }
    const s = document.createElement('span');
    s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:600 100px -apple-system,monospace;';
    s.textContent = '0000';
    document.body.appendChild(s);
    const w = s.offsetWidth;
    s.style.fontStretch = '50%';
    const n = s.offsetWidth;
    s.style.fontFamily = 'monospace';
    s.style.fontStretch = '';
    const m = s.offsetWidth;
    s.remove();
    stackFace = n < w * 0.85 && w !== m
      ? { family: '-apple-system', weight: 500, stretch: '50%', sw: 5.7 }
      : { family: '"Hemma Fredoka"', weight: 600, stretch: '75%', sw: 0 };
    return stackFace;
  };
  const stackLine = (b, txt) => {
    const f = stackFont(), sp = f.sw + 3;
    b.innerHTML = `<svg><text y="0" font-family='${f.family}' font-weight="${f.weight}" font-size="100" letter-spacing="${sp}" style="font-stretch:${f.stretch}" fill="#fff" stroke="#fff" stroke-width="${f.sw}" stroke-linejoin="round" paint-order="stroke">${esc(txt)}</text></svg>`;
    const svg = b.firstChild, t = svg.firstChild, bb = t.getBBox();
    if (!bb.width) return false;
    const x = document.createElement('canvas').getContext('2d');
    x.font = `${f.weight} 100px ${f.family}`;
    const asc = x.measureText('0').actualBoundingBoxAscent, h = f.sw / 2;
    svg.setAttribute('viewBox', `${bb.x - h} ${-asc - h} ${bb.width - sp + f.sw} ${asc + f.sw}`);
    return true;
  };
  const stackWx = (hs, wid, tid) => {
    const S = (hs && hs.states) || {}, w = wid && S[wid];
    if (!w) return null;
    let t = tid && S[tid] ? Number(S[tid].state) : NaN;
    if (!isFinite(t)) t = Number((w.attributes || {}).temperature);
    return isFinite(t) ? { t: Math.round(t), file: WXF[w.state] || '' } : null;
  };
  const STACK_INK = new Map();
  const stackInk = (im) => {
    if (STACK_INK.has(im.src)) return STACK_INK.get(im.src);
    let q = null;
    try {
      const S = 200, c = document.createElement('canvas'), x = c.getContext('2d');
      c.width = c.height = S;
      x.drawImage(im, 0, 0, S, S);
      const d = x.getImageData(0, 0, S, S).data;
      let t = -1, b = -1;
      for (let y = 0; y < S; y++) for (let k = 0; k < S; k++) if (d[(y * S + k) * 4 + 3] > 60) { if (t < 0) t = y; b = y; break; }
      if (t >= 0) q = { t: t / S, b: (b + 1) / S };
    } catch (_) {}
    STACK_INK.set(im.src, q);
    return q;
  };
  const saverStack = (o) => {
    const h = CAMS.hassNow();
    const lang = (h || {}).language || undefined;
    const layer = document.createElement('div');
    layer.className = 'hemma-saver';
    const sr = layer.attachShadow({ mode: 'open' });
    const cl = document.documentElement.classList, night = o.bg === 'black' || (cl.contains('hemma-hv') && !cl.contains('hv-light') && !cl.contains('hv-ink-w'));
    const npOn = o.bg === 'artwork' || o.bg === 'album';
    const ck0 = (npOn ? o.rest : o.bg) || '';
    const dashKey = window._hemmaHV && window._hemmaHV.key ? window._hemmaHV.key() : null;
    const ck = ck0 === '' || ck0 === 'black' ? (dashKey && dashKey !== 'gray' ? dashKey : '') : ck0 === 'gray' ? '' : ck0;
    const pal = window._hemmaHV && window._hemmaHV.palette ? window._hemmaHV.palette() : null;
    const day = pal ? '#' + (pal.light[ck || 'gray'] || pal.light.gray) : (CLOCK_BG[ck] || CLOCK_BG['']);
    const dark = pal ? '#' + (pal.dark[ck || 'gray'] || pal.dark.gray) : '#49575c';
    const SUN = (up) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 17a7 7 0 0 1 14 0"/><path d="M2 20h20M12 4v3M4.9 9.6l1.8 1.4M19.1 9.6l-1.8 1.4"/><path d="${up ? 'M9 6.5 12 3.5 15 6.5' : 'M9 4.5 12 7.5 15 4.5'}"/></svg>`;
    sr.innerHTML = `<style>${saverCss}
      :host { background: var(--sbg); color: #fff; transition: background-color 2.5s ease; }
      :host(.nofade) { transition: none; }
      .st-t { position: absolute; right: var(--sm); top: 50%; transform: translateY(-50%); display: grid; justify-items: end; gap: var(--sg); }
      .st-t b { display: flex; height: var(--sh); }
      .st-t svg { height: 100%; width: auto; overflow: visible; }
      .st-i { position: absolute; left: var(--sm); font-family: -apple-system, system-ui, sans-serif; font-weight: 700; line-height: 1.15; font-size: var(--si); }
      .st-i.top { top: var(--sm); } .st-i.bot { bottom: var(--sm); }
      .st-i div { display: flex; align-items: center; gap: .3em; white-space: nowrap; }
      .st-i svg, .st-i img { height: 1em; width: auto; flex: none; }
      .st-i img { filter: brightness(0) invert(1); }
      .st-i img.sn { height: 1.05em; }
      .st-i small { font-size: .62em; font-weight: 700; margin-left: .05em; }
    </style><div class="st-i top"><div class="dt"></div><div class="sun"></div></div><div class="st-t"><b class="hh"></b><b class="mm"></b></div><div class="st-i bot"><div class="wx"></div></div>${MINI_HTML}<div class="dark"></div>`;
    const $ = (q) => sr.querySelector(q);
    const paint = (d, n) => layer.style.setProperty('--sbg', night ? n : `color-mix(in oklab, ${d} 76%, #000)`);
    paint(day, dark);
    const fit = () => {
      const W = layer.clientWidth || innerWidth, H = layer.clientHeight || innerHeight, m = Math.round(Math.min(W, H) * 0.06);
      layer.style.setProperty('--sm', m + 'px');
      layer.style.setProperty('--si', Math.round(Math.max(20, Math.min(W, H) * 0.052)) + 'px');
      wxFit();
      const lh = H * 0.39;
      layer.style.setProperty('--sh', lh + 'px');
      layer.style.setProperty('--sg', (H * 0.07) + 'px');
    };
    const wxFit = () => {
      const im = $('.wx img'), sp = $('.wx span');
      if (!sp) return;
      sp.style.fontSize = '';
      if (!im || !im.complete || !im.naturalWidth) return;
      const q = stackInk(im), r = im.getBoundingClientRect();
      if (!q || !r.height) return;
      const cs = getComputedStyle(sp), x = document.createElement('canvas').getContext('2d');
      x.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
      sp.style.fontSize = (q.b - q.t) * r.height / (x.measureText('0').actualBoundingBoxAscent / 100) + 'px';
    };
    const h12 = new Intl.DateTimeFormat(lang, { hour: 'numeric' }).resolvedOptions().hour12;
    const at = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }); };
    let last = '';
    const tick = () => {
      const d = new Date(), hs = CAMS.hassNow() || h;
      const hh = h12 ? String(d.getHours() % 12 || 12) : String(d.getHours()).padStart(2, '0'), mm = ':' + String(d.getMinutes()).padStart(2, '0');
      const key = hh + mm;
      if (key !== last && stackLine($('.hh'), hh) & stackLine($('.mm'), mm)) last = key;
      $('.dt').textContent = d.toLocaleDateString(lang, { weekday: 'short' }).toUpperCase().replace(/\.$/, '') + ' ' + d.getDate();
      const sun = hs.states['sun.sun'], a = (sun && sun.attributes) || {};
      const rise = a.next_rising && new Date(a.next_rising), set = a.next_setting && new Date(a.next_setting);
      const up = rise && (!set || rise < set), when = up ? a.next_rising : a.next_setting;
      const sunEl = $('.sun'), sunTxt = when ? at(when) : '';
      sunEl.hidden = !sunTxt;
      if (sunTxt) { const m2 = /^(.*?)\s?([AaPp]\.?[Mm]\.?)$/.exec(sunTxt); const html = (up ? SUN(true) : `<img class="sn" alt="" src="${window.hemmaIconUrl ? window.hemmaIconUrl('sunset') : '/hemma_assets/icons/sunset.svg'}">`) + '<span>' + esc(m2 ? m2[1] : sunTxt) + (m2 ? '<small>' + esc(m2[2].replace(/\./g, '').toUpperCase()) + '</small>' : '') + '</span>'; if (sunEl._h !== html) { sunEl._h = html; sunEl.innerHTML = html; } }
      const wid = saverViewVar('weather_entity') || Object.keys(hs.states).find((k) => k.indexOf('weather.') === 0);
      const x = window.hemmaWxLine ? window.hemmaWxLine(hs, wid, saverViewVar('weather_temp_sensor')) : stackWx(hs, wid, saverViewVar('weather_temp_sensor')), wxEl = $('.wx');
      wxEl.hidden = !x;
      if (x) { const html = (x.file ? `<img alt="" src="/hemma_assets/weather/${x.file}-fill.svg?v=2">` : '') + '<span>' + esc(x.t) + '°</span>'; if (wxEl._h !== html) { wxEl._h = html; wxEl.innerHTML = html; const im = wxEl.querySelector('img'); if (im) im.onload = wxFit; } }
    };
    let artFor = null;
    const artwork = () => {
      if (!npOn) return;
      const src = saverNP(), art = src && src.playing ? src.art || '' : '';
      if (art === artFor) return;
      artFor = art;
      if (!art) { paint(day, dark); return; }
      if (SAVER_ART.has(art)) { const r0 = SAVER_ART.get(art); if (r0) paint(`oklch(from ${r0} 0.62 min(c, 0.1) h)`, `oklch(from ${r0} 0.4 min(c, 0.05) h)`); else paint(day, dark); return; }
      const im = new Image();
      if (!(String(art).startsWith('/') || String(art).startsWith(location.origin))) im.crossOrigin = 'anonymous';
      im.onload = () => {
        if (artFor !== art) return;
        try {
          const c = document.createElement('canvas'); c.width = c.height = 40;
          const x = c.getContext('2d'); x.drawImage(im, 0, 0, 40, 40);
          const v = palVibrant(x.getImageData(0, 0, 40, 40).data);
          if (!v) { SAVER_ART.set(art, null); paint(day, dark); return; }
          const rgb = `rgb(${albumTop(v).join(',')})`;
          SAVER_ART.set(art, rgb);
          paint(`oklch(from ${rgb} 0.62 min(c, 0.1) h)`, `oklch(from ${rgb} 0.4 min(c, 0.05) h)`);
        } catch (_) { paint(day, dark); }
      };
      im.onerror = () => paint(day, dark);
      im.src = art;
    };
    tick();
    SAVER.clock = setInterval(() => { tick(); if (new Date().getSeconds() % 2 === 0) artwork(); }, 1000);
    layer.classList.add('nofade'); artwork(); requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove('nofade')));
    if (window.ResizeObserver) new ResizeObserver(() => fit()).observe(layer);
    if (stackFont().sw === 0 && document.fonts) document.fonts.load('600 100px "Hemma Fredoka"').then(() => { last = ''; tick(); });
    saverDrift([[$('.st-i.top'), $('.st-i.bot')], [$('.st-t')]]);
    saverMini(sr);
    saverMount(layer, sr, o, (n) => n.classList.contains('mini'));
    fit();
    tick();
    artwork();
  };
  // Recently Added as HomeView's media page: the screen takes the poster's color, the poster centered with its title, the other new titles in a row below.
  const CARDS_CSS = `
    :host { --fg: #fff; --btn: rgba(255,255,255,0.2); }
    :host(.lt) { --fg: #1c1a10; --btn: rgba(255,255,255,0.4); }
    .bg { position: absolute; inset: 0; background: var(--c, #2c2c2e); transition: background-color 1s ease; }
    .stg { position: absolute; left: 50%; top: 50%; width: 1180px; height: 820px; transform: translate(-50%, -50%) scale(var(--k, 1)); color: var(--fg); }
    .rb { position: absolute; border: 0; padding: 0; border-radius: 30px; background: var(--btn); color: var(--fg); display: grid; place-items: center; cursor: pointer; font: inherit; -webkit-tap-highlight-color: transparent; transition: background-color 1s ease; }
    .x { left: 40px; top: 36px; width: 60px; height: 60px; }
    .x svg { width: 20px; height: 20px; }
    .lb { right: 40px; top: 36px; height: 60px; padding: 0 24px; font-size: 20px; font-weight: 600; }
    .po { position: absolute; left: 50%; top: 66px; height: 368px; width: auto; aspect-ratio: 2 / 3; transform: translateX(-50%); border-radius: 20px; background: center / cover no-repeat; box-shadow: 0 30px 60px -28px rgba(0,0,0,0.5); cursor: pointer; transition: opacity .4s ease; }
    .tt { position: absolute; left: 160px; right: 160px; top: 458px; text-align: center; }
    .tt b { display: block; font-size: 38px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tt span { display: block; font-size: 24px; opacity: .62; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row { position: absolute; left: 120px; right: 120px; top: 596px; display: flex; gap: 16px; overflow-x: auto; scrollbar-width: none; scroll-snap-type: x mandatory; }
    .row::-webkit-scrollbar { display: none; }
    .cd { flex: 0 0 calc((100% - 32px) / 3); scroll-snap-align: start; height: 172px; border: 0; border-radius: 22px; background: var(--btn); color: var(--fg); display: flex; gap: 16px; align-items: center; padding: 16px; text-align: left; font: inherit; cursor: pointer; transition: background-color 1s ease; }
    .cd i { flex: none; width: 94px; height: 140px; border-radius: 12px; background: center / cover no-repeat; }
    .cd b { display: block; font-size: 20px; font-weight: 700; } .cd small { display: block; font-size: 16px; opacity: .62; margin-top: 4px; }
    :host(.pt) .stg { width: 820px; height: 1180px; }
    :host(.pt) .po { top: 140px; height: 480px; }
    :host(.pt) .tt { left: 40px; right: 40px; top: 650px; } :host(.pt) .tt b { font-size: 54px; } :host(.pt) .tt span { font-size: 26px; }
    :host(.pt) .row { left: 110px; right: 110px; top: 790px; gap: 30px; }
    :host(.pt) .cd { flex: 0 0 180px; height: auto; display: grid; gap: 0; padding: 0; background: none; align-items: start; }
    :host(.pt) .cd i { width: 180px; height: 270px; border-radius: 14px; box-shadow: 0 20px 34px -16px rgba(0,0,0,0.6); }
    :host(.pt) .cd span { display: block; min-width: 0; margin-top: 12px; } :host(.pt) .cd b { font-size: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } :host(.pt) .cd small { font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `;
  const saverCards = (o) => {
    const h = CAMS.hassNow();
    let pv = {};
    const walk = (x) => { if (!x || typeof x !== 'object' || pv.found) return; if ([].concat(x.template || []).some((t) => /plex_recently_added|popup_recent/.test(String(t)))) { pv = Object.assign({ found: true }, x.variables || {}); return; } Object.values(x).forEach(walk); };
    walk(saverLL());
    const src = document.createElement('hemma-recent-panel');
    src.setConfig({ hide_spoilers: pv.hide_spoilers === true, days: pv.days, movies_entity: pv.movies_entity, tv_entity: pv.tv_entity });
    src.hass = h;
    const items = (src._list || []).slice().sort((a, b) => new Date(b.airdate) - new Date(a.airdate));
    if (!items.length) return;
    const url = (raw) => (!raw ? '' : String(raw).startsWith('/') ? location.origin + raw : String(raw));
    const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
    const layer = document.createElement('div');
    layer.className = 'hemma-saver';
    const sr = layer.attachShadow({ mode: 'open' });
    sr.innerHTML = `<style>${saverCss}${CARDS_CSS}</style><div class="bg"></div><div class="stg">
      <button type="button" class="rb x" aria-label="${esc(T('ui.close', 'Close'))}"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l14 14M17 3 3 17"/></svg></button>
      <div class="rb lb">${esc(T('plex.recently_added', 'Recently Added'))}</div>
      <div class="po"></div><div class="tt"><b></b><span></span></div>
      <div class="row"></div></div><div class="dark"></div>`;
    stageFit(sr);
    const $ = (q) => sr.querySelector(q);
    let idx = 0, touched = 0;
    const line2 = (i) => {
      const year = (String(i.aired || '').match(/^(\d{4})/) || [])[1] || '';
      const genres = clean(i.genres).split(',').map((g) => g.trim()).filter(Boolean).slice(0, 2);
      if (i.eps && i.eps.length > 1) return [T('plex.n_new_episodes', '{n} new episodes', { n: i.eps.length }), ...genres].join(' · ');
      if (i.tv) { const se = /S(\d+)E(\d+)/i.exec(clean(i.number)); return [se ? `S${Number(se[1])}, E${Number(se[2])}` : clean(i.number), clean(i.episode)].filter(Boolean).join(' · '); }
      return [T('plex.movie', 'Movie'), ...genres, year].filter(Boolean).join(' · ');
    };
    // The screen's color: the poster's average, kept deep enough for white text unless it is a light poster.
    const tint = (u, done) => {
      const im = new Image();
      if (!u.startsWith(location.origin)) im.crossOrigin = 'anonymous';
      im.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = 12; c.height = 18;
          const x = c.getContext('2d'); x.drawImage(im, 0, 0, 12, 18);
          const d = x.getImageData(0, 0, 12, 18).data; let r = 0, g = 0, b = 0, n = 0;
          for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; }
          r /= n; g /= n; b /= n;
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b), boost = mx > mn ? 1.25 : 1, avg = (r + g + b) / 3;
          [r, g, b] = [r, g, b].map((v) => Math.max(0, Math.min(255, avg + (v - avg) * boost)));
          done(`rgb(${r | 0},${g | 0},${b | 0})`, (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62);
        } catch (_) { done('#2c2c2e', false); }
      };
      im.onerror = () => done('#2c2c2e', false);
      im.src = u;
    };
    const show = (i) => {
      idx = (i + items.length) % items.length;
      const it = items[idx], po = $('.po');
      saverXfade(po, `url("${url(it.poster || it.fanart)}")`);
      $('.tt b').textContent = clean(it.title);
      $('.tt span').textContent = line2(it);
      tint(url(it.poster || it.fanart), (c, light) => { $('.bg').style.setProperty('--c', c); layer.style.setProperty('--c', c); layer.classList.toggle('lt', light); });
      $('.row').innerHTML = items.map((x, k) => k === idx ? '' : `<button type="button" class="cd" data-k="${k}"><i style="background-image:url('${url(x.poster || x.fanart)}')"></i><span><b>${esc(clean(x.title))}</b><small>${esc(line2(x))}</small></span></button>`).join('');
      $('.row').querySelectorAll('.cd').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); touched = Date.now(); show(Number(b.dataset.k)); }; });
      $('.row').scrollLeft = 0;
    };
    $('.x').onclick = (e) => { e.stopPropagation(); window.hemmaSaver.stop(); };
    show(0);
    SAVER.adv = setInterval(() => { if (Date.now() - touched < 15000) return; show(idx + 1); }, Math.max(4, Number(o.every) || 6) * 1000);
    const stg = $('.stg');
    stg.classList.add('drift');
    saverMount(layer, sr, o, (n) => ['row', 'cd', 'x'].some((c) => n.classList.contains(c)));
  };
  const SNOTE_CSS = `
    .gl > div:last-child.nt { cursor: pointer; }
    .stg > *, .bg ~ * { transition: opacity .35s ease; }
    :host(.sn-on) .stg > :not(.sn, .sn-dim) { opacity: 0.07; }
    :host(.sn-on) .stg .gl { opacity: 0; }
    .sn-dim { position: absolute; inset: -200vmax; z-index: 40; }
    .sn { position: absolute; z-index: 41; color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif; }
    .sn-hd { display: flex; align-items: center; gap: 14px; font-size: 36px; font-weight: 700; line-height: 1.1; margin-bottom: 22px; }
    .sn-hd i { flex: none; width: 52px; height: 52px; border-radius: 50%; background: var(--ink); display: grid; place-items: center; }
    .sn-hd i b { width: 28px; height: 28px; background: var(--sn-on, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    :host(.dk) .sn { --sn-on: #111; }
    .sn-l { max-height: var(--lh); overflow-y: auto; scrollbar-width: none; }
    .sn-l::-webkit-scrollbar { display: none; }
    .sn-r { cursor: pointer; display: flex; align-items: center; gap: 18px; padding: 16px 0; border-top: 2px solid color-mix(in srgb, var(--ink) 12%, transparent); transition: opacity .25s ease, transform .3s ease; }
    .sn-r.go { opacity: 0; transform: translateX(-24px); }
    .sn-r .tx { flex: 1; min-width: 0; line-height: 1.15; }
    .sn-r .tx strong, .sn-r .tx span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sn-r .tx strong { font-size: 30px; font-weight: 700; }
    .sn-r .tx span { font-size: 22px; font-weight: 600; color: color-mix(in srgb, var(--ink) 55%, transparent); margin-top: 4px; }
    .sn-r button { flex: none; width: 44px; height: 44px; border-radius: 50%; border: 0; background: var(--ink); color: var(--sn-on, #fff); cursor: pointer; display: grid; place-items: center; padding: 0; }
    .sn-r button:active { opacity: .7; }
    .sn-r button svg { width: 18px; height: 18px; display: block; }
    .sw .sn-r { padding: 12px 0; }
    :host(.sn-on) .stg .wx { opacity: 0; }
    .sw .sw-d { color: color-mix(in srgb, var(--ink) 55%, transparent); }
    .sw .sw-i b, .sw .sn-hd i b { display: block; }
    .sw .sw-i b { width: 30px; height: 30px; background: color-mix(in srgb, var(--ink) 75%, transparent); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .sw .sw-t { font-size: 30px; font-weight: 700; min-width: 132px; text-align: right; display: flex; justify-content: flex-end; gap: 14px; }
    .sn-clr { display: block; width: 100%; text-align: left; border: 0; border-top: 2px solid color-mix(in srgb, var(--ink) 12%, transparent); background: none; color: var(--ink); font: inherit; font-size: 24px; font-weight: 700; padding: 22px 0 0; cursor: pointer; }
  `;
  // The forecast opens as the notifications do, over the weather's own area: the rest fades back and the days rise in its place.
  const saverWeather = (sr, from, fc, lang, wid) => {
    if (!fc || !fc.length || sr.querySelector('.sn')) return;
    if (!sr.querySelector('style.sn-css')) sr.appendChild(Object.assign(document.createElement('style'), { className: 'sn-css', textContent: SNOTE_CSS }));
    const host = sr.host, E = 'cubic-bezier(0.32, 0.72, 0, 1)', hs = CAMS.hassNow();
    const stg = sr.querySelector('.stg'), sb = stg.getBoundingClientRect(), k = sb.width / stg.offsetWidth || 1, fr = from.getBoundingClientRect();
    const x0 = (fr.left - sb.left) / k, y0 = (fr.top - sb.top) / k, y1 = (fr.bottom - sb.top) / k;
    const H = y1 - y0, n = Math.max(2, Math.min(5, Math.floor((H - 74) / 61)));
    const now = (from.querySelector('.cd') || {}).textContent || '', tp = (from.querySelector('.tp') || {}).textContent || '';
    const day = (d, i) => i ? new Date(d.datetime).toLocaleDateString(lang, { weekday: 'short' }) : T('saver.today', 'Today');
    const dim = Object.assign(document.createElement('div'), { className: 'sn-dim' }), box = Object.assign(document.createElement('div'), { className: 'sn sw' });
    Object.assign(box.style, { left: x0 + 'px', top: y0 + 'px', width: Math.max(300, stg.offsetWidth - x0 - 24) + 'px', bottom: 'auto' });
    const ico = (c) => `<b style="--i:url(&quot;${wxIcon(c)}&quot;)"></b>`;
    box.innerHTML = `<div class="sn-hd"><i>${ico((hs.states[wid || ''] || {}).state || fc[0].condition)}</i><span>${esc(now)}${tp ? ` <span class="sw-d">· ${esc(tp)}</span>` : ''}</span></div>`
      + fc.slice(0, n).map((d, i) => `<div class="sn-r"><div class="tx"><strong>${esc(day(d, i))}</strong></div><span class="sw-i">${ico(d.condition)}</span><span class="sw-t"><span class="sw-d">${d.templow != null ? Math.round(d.templow) + '°' : ''}</span>${d.temperature != null ? Math.round(d.temperature) + '°' : ''}</span></div>`).join('');
    stg.append(dim, box);
    host.classList.add('sn-on');
    [box.querySelector('.sn-hd'), ...box.querySelectorAll('.sn-r')].forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i ? 60 + i * 40 : 0, easing: E, fill: 'backwards' }));
    let gone = false, idle = 0;
    const close = () => {
      if (gone) return;
      gone = true; clearTimeout(idle);
      host.classList.remove('sn-on');
      const out = box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease', fill: 'forwards' });
      const done = () => { box.remove(); dim.remove(); };
      out.finished.then(done, done);
    };
    idle = setTimeout(close, 20000);
    dim.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    box.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  };
  const saverNotes = (sr, from) => {
    const N = window._hemmaNotify;
    if (!N || sr.querySelector('.sn') || !N.rows.length) return;
    if (!sr.querySelector('style.sn-css')) sr.appendChild(Object.assign(document.createElement('style'), { className: 'sn-css', textContent: SNOTE_CSS }));
    const host = sr.host, lang = (CAMS.hassNow().locale || {}).language || 'en';
    const url = (n) => (window.hemmaIconUrl ? window.hemmaIconUrl(n) : '');
    const at = (w) => { try { return new Date(w).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }); } catch (_) { return ''; } };
    const rows = N.rows, E = 'cubic-bezier(0.32, 0.72, 0, 1)';
    const count = () => T(rows.length === 1 ? 'saver.notification_one' : 'saver.notifications', rows.length === 1 ? '1 notification' : '{n} notifications', { n: rows.length });
    const stg = sr.querySelector('.stg'), sb = stg.getBoundingClientRect(), k = sb.width / stg.offsetWidth || 1;
    const fr = from.getBoundingClientRect(), x0 = (fr.left - sb.left) / k, y1 = (fr.bottom - sb.top) / k;
    const gl = sr.querySelector('.gl'), W = Math.min(Math.max(gl ? gl.offsetWidth : 460, 420), stg.offsetWidth - x0 - 24);
    const dim = Object.assign(document.createElement('div'), { className: 'sn-dim' }), box = Object.assign(document.createElement('div'), { className: 'sn' });
    box.style.left = x0 + 'px';
    box.style.width = W + 'px';
    box.style.bottom = Math.max(24, stg.offsetHeight - y1) + 'px';
    box.style.setProperty('--lh', Math.max(160, y1 - 220) + 'px');
    box.innerHTML = `<div class="sn-hd"><i><b style="--i:url(&quot;${url('bell')}&quot;)"></b></i><span class="sn-n">${esc(count())}</span></div><div class="sn-l">`
      + rows.map((x, k) => `<div class="sn-r" data-k="${k}"><div class="tx"><strong>${esc(x.label || '')}</strong><span>${esc([x.sub, x.when ? at(x.when) : ''].filter(Boolean).join(' · '))}</span></div><button type="button" aria-label="${esc(T('notify.clear', 'Clear'))}"><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 4l10 10M14 4 4 14"/></svg></button></div>`).join('')
      + `</div><button type="button" class="sn-clr">${esc(T('notify.clear_all', 'Clear All'))}</button>`;
    stg.append(dim, box);
    host.classList.add('sn-on');
    const parts = [box.querySelector('.sn-hd'), ...box.querySelectorAll('.sn-r'), box.querySelector('.sn-clr')];
    parts.forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i ? 60 + i * 40 : 0, easing: E, fill: 'backwards' }));
    let idle = 0, gone = false;
    const close = () => {
      if (gone) return;
      gone = true;
      clearTimeout(idle);
      host.classList.remove('sn-on');
      const out = box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease', fill: 'forwards' });
      const done = () => { box.remove(); dim.remove(); };
      out.finished.then(done, done);
    };
    const wait = () => { clearTimeout(idle); idle = setTimeout(close, 20000); };
    wait();
    dim.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      wait();
      if (e.target.closest('.sn-clr')) { N.clearAll(); close(); return; }
      const b = e.target.closest('.sn-r button');
      if (!b) {
        // A tap on the notification itself wakes the dashboard with that item open, as it would from the bell.
        const r = e.target.closest('.sn-r'), x = r && rows[Number(r.dataset.k)];
        if (!x || !N.activate || (!x.opens && !x.entity)) return;
        close();
        window.hemmaSaver.stop();
        setTimeout(() => N.activate(x), 120);
        return;
      }
      const el = b.closest('.sn-r'), x = rows[Number(el.dataset.k)];
      N.clear([x]);
      rows.splice(rows.indexOf(x), 1);
      const n = box.querySelector('.sn-n');
      if (n) n.textContent = count();
      if (!rows.length) { close(); return; }
      const h = el.offsetHeight;
      el.style.overflow = 'hidden';
      el.style.boxSizing = 'border-box';
      const a = el.animate([{ opacity: 1, transform: 'none', height: h + 'px', paddingTop: '16px', paddingBottom: '16px' }, { opacity: 0, transform: 'translateX(-24px)', height: h + 'px', offset: 0.45 }, { opacity: 0, transform: 'translateX(-24px)', height: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px' }], { duration: 520, easing: E, fill: 'forwards' });
      const gone2 = () => el.remove();
      a.finished.then(gone2, gone2);
    });
  };

  window.hemmaSaver = {
    get on() { return !!SAVER.layer; },
    start(opts) {
      if (SAVER.layer) return;
      if (!(opts && opts.instant)) SAVER.rot = null;
      this._open(opts);
      if (SAVER.layer && SAVER.opts && SAVER.opts.swipe) saverSwipe(SAVER.layer);
      if (SAVER.layer) saverRotate();
    },
    _open(opts) {
      const h = CAMS.hassNow();
      if (!h) return;
      SAVER.opts = opts || {};
      if (!SAVER.opts.preview) try { localStorage.setItem('hemma_saver_on', JSON.stringify(Object.assign({}, SAVER.opts, { instant: true, at: location.pathname.split('/')[1] || '' }))); } catch (_) {}
      const o = Object.assign({}, opts || {});
      if (!o.style || o.style === 'clock' || o.style === 'clock_photo') o.style = 'clock';
      if (o.style === 'cards') o.style = 'recent';
      if (o.style === 'clock' || o.style === 'clock_photo') return saverClock(o);
      if (o.style === 'face' && o.face === 'stacked') return saverStack(o);
      if (o.style === 'face') return saverFace(o);
      if (o.style === 'cards') return saverCards(o);
      const layer = document.createElement('div');
      layer.className = 'hemma-saver';
      const sr = layer.attachShadow({ mode: 'open' });
      sr.innerHTML = `<style>${saverCss}</style><div class="clock"><b></b><small></small></div><div class="lbl"><b>${(() => { const l = T('saver.new_media', 'New Media'), k = l.indexOf(' '); return k > 0 ? esc(l.slice(0, k)) + ' <span>' + esc(l.slice(k + 1)) + '</span>' : esc(l); })()}</b><small></small></div><div class="mini" role="button" aria-label="${esc(T('now_playing.title', 'Now Playing'))}"><i class="gx gd"></i><i class="gx gs"></i><i class="gx gt"></i><i class="gx gb"></i><span class="ma"></span><svg class="dots" width="29" height="4.6" viewBox="0 0 25 4"><circle cx="1.60" cy="2" r="1.6" style="--o:1;--o2:1.00;--dl:0.00s"/><circle cx="5.96" cy="2" r="1.6" style="--o:0.8;--o2:1.00;--dl:0.17s"/><circle cx="10.32" cy="2" r="1.6" style="--o:0.62;--o2:1.00;--dl:0.34s"/><circle cx="14.68" cy="2" r="1.6" style="--o:0.47;--o2:0.97;--dl:0.51s"/><circle cx="19.04" cy="2" r="1.6" style="--o:0.35;--o2:0.85;--dl:0.68s"/><circle cx="23.40" cy="2" r="1.6" style="--o:0.26;--o2:0.76;--dl:0.85s"/></svg></div><div class="dark"></div>`;
      const panel = document.createElement('hemma-recent-panel');
      // The Plex tile's own settings carry over, spoiler blur included.
      let pv = {};
      try {
        const st = [document];
        for (let i = 0; i < st.length && i < 3000 && !pv.found; i++) {
          const hit = st[i].querySelector && st[i].querySelector('hui-root');
          if (hit && hit.lovelace && hit.lovelace.config) {
            const walk = (o) => { if (!o || typeof o !== 'object' || pv.found) return; if ([].concat(o.template || []).some((t) => /plex_recently_added|popup_recent/.test(String(t)))) { pv = Object.assign({ found: true }, o.variables || {}); return; } Object.values(o).forEach(walk); };
            walk(hit.lovelace.config.views);
            break;
          }
          st[i].querySelectorAll && st[i].querySelectorAll('*').forEach((n) => { if (n.shadowRoot) st.push(n.shadowRoot); });
        }
      } catch (_) {}
      panel.setConfig({ saver: true, flat: o.rabg === 'color', every: o.every || 6, hide_spoilers: pv.hide_spoilers === true, days: pv.days, movies_entity: pv.movies_entity, tv_entity: pv.tv_entity });
      sr.appendChild(panel);
      panel.hass = h;
      if (!panel._list || !panel._list.length) return;
      camHost().appendChild(layer);
      SAVER.layer = layer;
      const lang = h.language || undefined;
      const tick = () => {
        const d = new Date();
        sr.querySelector('.clock b').textContent = d.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
        const ds = window.hemmaDate ? window.hemmaDate(h, 'short') : d.toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' }), dk = ds.search(/[\s,]/);
        const cs = sr.querySelector('.clock small');
        if (cs._v !== ds) { cs._v = ds; cs.innerHTML = dk > 0 ? esc(ds.slice(0, dk)) + ' <span>' + esc(ds.slice(dk).replace(/^[\s,]+/, '')) + '</span>' : esc(ds); }
      };
      // Under New Media, the day the poster in front arrived: Today, Yesterday, a weekday this week, then the date.
      const dayOf = (t) => {
        const at = new Date(typeof t === 'number' && t < 1e12 ? t * 1000 : t);
        if (isNaN(at)) return '';
        const d0 = new Date(); d0.setHours(0, 0, 0, 0);
        const a0 = new Date(at); a0.setHours(0, 0, 0, 0);
        const n = Math.round((d0 - a0) / 86400000);
        if (n <= 0) return T('saver.today', 'Today');
        if (n === 1) return T('time.yesterday', 'Yesterday');
        if (n < 7) return at.toLocaleDateString(lang, { weekday: 'long' });
        return at.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
      };
      panel.addEventListener('hemma-ra-item', (e) => { sr.querySelector('.lbl small').textContent = dayOf(e.detail); });
      if (panel._raAt) sr.querySelector('.lbl small').textContent = dayOf(panel._raAt);
      // The clock and heading step aside while a poster's details are open.
      const slab0 = panel.shadowRoot && panel.shadowRoot.querySelector('.slab.rc');
      if (slab0) new MutationObserver(() => { const d = slab0.classList.contains('detail'); [sr.querySelector('.clock'), sr.querySelector('.lbl')].forEach((el) => { el.style.opacity = d ? '0' : ''; }); }).observe(slab0, { attributes: true, attributeFilter: ['class'] });
      const mini = saverMini(sr);
      // Against burn-in on wall tablets: what stays put drifts a few points every minute, and after a while the screen goes dark until touched.
      saverDrift([[sr.querySelector('.clock'), sr.querySelector('.lbl')], [panel]]);
      if (o.dark > 0) SAVER.darkT = setTimeout(() => sr.querySelector('.dark').classList.add('on'), o.dark * 60000);
      tick();
      SAVER.clock = setInterval(tick, 10000);
      // Only the posters, their dots and an open poster's page are the screensaver's own; a tap anywhere else wakes the dashboard.
      layer.addEventListener('click', (e) => {
        const path = e.composedPath();
        const own = path.some((n) => n.classList && (n.classList.contains('rcard') || n.classList.contains('rdots') || n.classList.contains('rdet') || n.classList.contains('rback') || n.classList.contains('mini')));
        const slab = panel.shadowRoot && panel.shadowRoot.querySelector('.slab.rc');
        if (own || (slab && slab.classList.contains('detail'))) return;
        window.hemmaSaver.stop();
      });
      SAVER.key = (e) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); window.hemmaSaver.stop(); } };
      document.addEventListener('keydown', SAVER.key, true);
      if (!o.instant && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
    },
    stop(quick) {
      SAVER.npv = null;
      clearTimeout(SAVER.rotT); SAVER.rot = null;
      const layer = SAVER.layer;
      if (!layer) return;
      SAVER.layer = null;
      SAVER.last = Date.now();
      try { localStorage.removeItem('hemma_saver_on'); } catch (_) {}
      clearInterval(SAVER.clock); clearInterval(SAVER.mini); clearInterval(SAVER.pill); clearInterval(SAVER.shift); clearInterval(SAVER.wx); clearInterval(SAVER.fc); clearInterval(SAVER.cal); clearInterval(SAVER.adv); clearTimeout(SAVER.darkT);
      if (SAVER.unfit) { SAVER.unfit(); SAVER.unfit = null; }
      if (quick) { layer.remove(); document.removeEventListener('keydown', SAVER.key, true); return; }
      document.removeEventListener('keydown', SAVER.key, true);
      const done = () => layer.remove();
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' }).finished.then(done, done);
    },
    // The dashboard turned light or dark: the screensaver is rebuilt in the new mode beneath, and the old one fades away over it as the artwork colors blend.
    remode() {
      const old = SAVER.layer;
      if (!old) return;
      const dimmed = !!(old.shadowRoot && old.shadowRoot.querySelector('.dark.on'));
      SAVER.layer = null; SAVER.npv = null;
      clearInterval(SAVER.clock); clearInterval(SAVER.mini); clearInterval(SAVER.pill); clearInterval(SAVER.shift); clearInterval(SAVER.wx); clearInterval(SAVER.fc); clearInterval(SAVER.cal); clearInterval(SAVER.adv); clearTimeout(SAVER.darkT);
      if (SAVER.unfit) { SAVER.unfit(); SAVER.unfit = null; }
      document.removeEventListener('keydown', SAVER.key, true);
      this.start(Object.assign({}, SAVER.opts || {}, { instant: true }));
      const nu = SAVER.layer;
      if (nu && nu.parentNode === old.parentNode) nu.parentNode.insertBefore(nu, old);
      if (nu && dimmed) { const d = nu.shadowRoot && nu.shadowRoot.querySelector('.dark'); if (d) { d.style.transition = 'none'; d.classList.add('on'); } }
      old.style.pointerEvents = 'none';
      const gone = () => { old.remove(); const rp = nu && nu.shadowRoot && nu.shadowRoot.querySelector('hemma-recent-panel'); if (rp && rp._rewash) rp._rewash(); };
      old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 2500, easing: 'ease-in-out', fill: 'forwards' }).finished.then(gone, gone);
    },
  };
  if (!window._hemmaSaverMode) {
    window._hemmaSaverMode = true;
    const darkNow = () => { const c = document.documentElement.classList; return c.contains('hemma-hv') && !c.contains('hv-light') && !c.contains('hv-ink-w'); };
    let was = darkNow(), t = 0;
    new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => { const d = darkNow(); if (d === was) return; was = d; if (SAVER.layer) window.hemmaSaver.remode(); }, 300);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  // The setting rides on each view's first card, like Return to Home: minutes idle, where it may run, how long each poster stays.
  if (!window._hemmaSaverIdle) {
    window._hemmaSaverIdle = true;
    const bump = () => { SAVER.last = Date.now(); };
    ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach((t) => window.addEventListener(t, bump, { capture: true, passive: true }));
    let cfgHui = null;
    const cfgOf = () => {
      try {
        const root = CAMS.root ? CAMS.root() : null;
        const ll = (root && root.lovelace) || (cfgHui && cfgHui.isConnected ? cfgHui.lovelace : (() => { const st = [document]; for (let i = 0; i < st.length && i < 3000; i++) { const r = st[i], hit = r.querySelector && r.querySelector('hui-root'); if (hit) { cfgHui = hit; return hit.lovelace; } r.querySelectorAll && r.querySelectorAll('*').forEach((n) => { if (n.shadowRoot) st.push(n.shadowRoot); }); } return null; })());
        if (!ll || ll.editMode || !ll.config) return null;
        for (const v of ll.config.views || []) {
          const V = (((v.cards || [])[0]) || {}).variables || {};
          if (V.hemma_screensaver !== undefined && V.hemma_screensaver !== '' && V.hemma_screensaver !== null) return { swipe: V.hemma_screensaver_swipe === true, slide: V.hemma_screensaver_transition === 'slide', rotate: parseFloat(V.hemma_screensaver_rotate) || 0, style: V.hemma_screensaver_style || '', face: V.hemma_screensaver_face || '', bg: V.hemma_screensaver_bg || '', idle: V.hemma_screensaver_idle || '', np: V.hemma_screensaver_np || '', rest: V.hemma_screensaver_bg_rest || '', rabg: V.hemma_screensaver_ra_bg || '', cals: V.hemma_screensaver_calendars || [], mins: parseFloat(V.hemma_screensaver) || 0, where: V.hemma_screensaver_on || '', every: parseFloat(V.hemma_screensaver_every) || 6, dark: V.hemma_screensaver_dark === undefined || V.hemma_screensaver_dark === '' ? 60 : parseFloat(V.hemma_screensaver_dark) || 0 };
        }
      } catch (_) {}
      return null;
    };
    // A tablet that slept with the screensaver up is often reloaded on waking; it comes back to the screensaver, never the dashboard.
    let resume = null;
    try { resume = JSON.parse(localStorage.getItem('hemma_saver_on') || 'null'); } catch (_) {}
    if (resume && resume.at === (location.pathname.split('/')[1] || '') && !new URLSearchParams(location.search).has('hemma_saver')) {
      const cover = document.createElement('div');
      cover.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:#000;pointer-events:none;';
      document.documentElement.appendChild(cover);
      const t0 = Date.now();
      const go = () => {
        try { if (!SAVER.layer && CAMS.hassNow()) window.hemmaSaver.start(resume); } catch (_) {}
        if (SAVER.layer || Date.now() - t0 > 8000) requestAnimationFrame(() => requestAnimationFrame(() => { cover.remove(); const sc = document.getElementById('hemma-saver-cover'); if (sc) sc.remove(); }));
        else setTimeout(go, 100);
      };
      go();
    }
    const armed = (c) => !!(c && c.mins) && (c.where === 'all' ? !window.matchMedia('(max-width: 768px)').matches : window.matchMedia('(pointer: coarse) and (min-width: 769px)').matches);
    window._hemmaSaverArmed = () => armed(cfgOf());
    setInterval(() => {
      if (SAVER.layer || document.hidden) return;
      const c = cfgOf();
      if (!armed(c)) return;
      if ((window.hemmaPopup && window.hemmaPopup.surface) || window.hemmaMediaFull && window.hemmaMediaFull.open_ || camHost().querySelector('hemma-camera-view, hemma-camera-page, .hemma-remote-layer')) { SAVER.last = Date.now(); return; }
      if (Date.now() - SAVER.last >= c.mins * 60000) window.hemmaSaver.start({ swipe: c.swipe, slide: c.slide, rotate: c.rotate, style: c.style, face: c.face, every: c.every, dark: c.dark, bg: c.bg, rest: c.rest, idle: c.idle, np: c.np, cals: c.cals, rabg: c.rabg });
    }, 5000);
    // Hemma Studio's Preview opens the dashboard with ?hemma_saver=<style> to start one at once.
    const want = new URLSearchParams(location.search).get('hemma_saver'), bgWant = new URLSearchParams(location.search).get('hemma_saver_bg'), idleWant = new URLSearchParams(location.search).get('hemma_saver_idle'), calsWant = new URLSearchParams(location.search).get('hemma_saver_cals');
    if (want !== null) {
      try { const u = new URL(location.href); u.searchParams.delete('hemma_saver'); u.searchParams.delete('hemma_saver_bg'); u.searchParams.delete('hemma_saver_idle'); u.searchParams.delete('hemma_saver_cals'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch (_) {}
      setTimeout(() => { const c = cfgOf(); window.hemmaSaver.start({ preview: true, swipe: c ? c.swipe : false, slide: c ? c.slide : false, rotate: c ? c.rotate : 0, style: want, face: new URLSearchParams(location.search).get('hemma_saver_face') || (c ? c.face : ''), every: c ? c.every : 6, dark: c ? c.dark : 60, bg: bgWant !== null ? bgWant : c ? c.bg : '', idle: idleWant !== null ? idleWant : c ? c.idle : '', np: c ? c.np : '', cals: calsWant !== null ? calsWant.split(',').filter(Boolean) : c ? c.cals : [] }); }, 2000);
    }
  }

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

  // The Cameras section, the Cameras page and the full-screen camera.
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
    // A camera can take its picture from another camera entity (Studio's Preview picture from), such as a snapshot feed from Scrypted.
    const previewOf = (hass, id) => {
      const src = (((settings() || {}).preview) || {})[id];
      return src && hass && hass.states[src] ? src : null;
    };
    const still = (hass, id, bust) => {
      const s = hass && hass.states[previewOf(hass, id) || id], p = s && s.attributes.entity_picture;
      if (!p) return '';
      const u = p.startsWith('/') && hass.hassUrl ? hass.hassUrl(p) : p;
      return u + (u.indexOf('?') < 0 ? '?' : '&') + 't=' + bust;
    };
    // Ring serves its last clip's frame as the camera's picture, so a picture is as old as the latest motion or ring, not the moment it was fetched.
    const shotAt = (hass, id) => {
      const st = (hass && hass.states) || {};
      let t = 0;
      // The newest of its activity sensors and events: Ring can leave an event entity months behind while its last-activity sensor stays current.
      sibs(hass, id).forEach((k) => {
        const e = st[k];
        if (!e || !(k.startsWith('event.') || (k.startsWith('sensor.') && e.attributes.device_class === 'timestamp'))) return;
        const v = Date.parse(e.state);
        if (isFinite(v) && v > t && v <= Date.now() + 60000) t = v;
      });
      return t || null;
    };
    const age = (ms) => {
      const s = Math.max(0, Math.round(ms / 1000));
      return s < 5 ? T('cameras.age_now', 'now') : s < 60 ? T('cameras.age_s', '{n}s', { n: s }) : s < 3600 ? T('cameras.age_m', '{n}m', { n: Math.floor(s / 60) })
        : s < 86400 ? T('cameras.age_h', '{n}h', { n: Math.floor(s / 3600) }) : T('cameras.age_d', '{n}d', { n: Math.floor(s / 86400) });
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
            // Only what the camera saw: Ring also logs every live view (on_demand), which is no event at all.
            const kind = /ding|doorbell|button/.test(cat) ? 'ding' : /motion|person|vehicle|package|animal/.test(cat) ? 'motion' : null;
            if (kind && !isNaN(at) && at >= start) out.push({ kind, at });
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
    const live = async (hass, id, quiet) => {
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
        // A stream with sound only plays after a click; a background snapshot has none, so it opens muted.
        card.muted = !!quiet;
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
    return { settings, on, list, nameOf, clipOf, dead, motion, still, previewOf, age, shotAt, events, time, live, videoIn, areaOf, hassNow };
  })();
  window.hemmaCams = CAMS;

  const CAM_X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>';
  const CAM_SB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="M9.5 5v14M5.6 8.8h1.6M5.6 11.6h1.6"/></svg>';
  const CAM_GRID = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3.5" y="3.5" width="7.6" height="7.6" rx="2"/><rect x="12.9" y="3.5" width="7.6" height="7.6" rx="2"/><rect x="3.5" y="12.9" width="7.6" height="7.6" rx="2"/><rect x="12.9" y="12.9" width="7.6" height="7.6" rx="2"/></svg>';
  const CAM_MORE = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
  const CAM_BACK = '<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.4 1.6 1.8 10l8.6 8.4"/></svg>';
  const CAM_CHEV = '<svg viewBox="0 0 9 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5 7.5 7.5 1.5 13.5"/></svg>';
  const CAM_WALK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='13.5' cy='4.5' r='2'/%3E%3Cpath d='M10 8.5 7 10v4h2v-2.7l1.4-.7-1.6 8.4h2.1l1.2-5.2 2 2V21h2v-6l-2.1-2.1.6-3c1 1.2 2.5 2 4.3 2.1v-2c-1.4-.1-2.6-.9-3.2-2l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5 0-.8.1z'/%3E%3C/svg%3E";
  const CAM_BELL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z'/%3E%3C/svg%3E";
  // The round buttons take Hemma's glass; the wide capsule takes the N Lights pill's, whose rim is drawn to stretch.
  const CAM_GLASS = `${GLASS_FILL} box-shadow: -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3);`;
  const CAM_PILL = `position: absolute; background-color: rgba(255,255,255,0.135); background-image: var(--hv-lpill-img, linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.07) 6%, rgba(255,255,255,0.025) 12%, rgba(255,255,255,0) 18%), linear-gradient(to top, rgba(255,255,255,0.11), rgba(255,255,255,0.05) 6%, rgba(255,255,255,0.015) 12%, rgba(255,255,255,0) 18%));
      box-shadow: var(--hv-btn-sh, -1px 0 0 -0.4px rgba(0,0,0,0.28), 1px 0 0 -0.4px rgba(0,0,0,0.28)); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3);`;
  const CAM_PILL_RIM = `content: ""; display: var(--hv-lpill-rim, block); position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
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
    // A picture that fails (most often an expired access token after the tab slept) never shows Safari's broken-image box; a fresh one is fetched instead.
    const pic = b.querySelector('img');
    pic.onerror = () => {
      pic.removeAttribute('src');
      b.classList.remove('in');
      const h = CAMS.hassNow() || hass;
      if (!b._retry) { b._retry = true; setTimeout(() => { b._retry = false; if (b.isConnected) b._load(h); }, 1500); }
    };
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
    const wake = () => {
      if (!b.isConnected) { document.removeEventListener('visibilitychange', wake); window.removeEventListener('pageshow', wake); return; }
      if (document.hidden) return;
      b._fails = 0; b._busy = false;
      setTimeout(() => { if (b.isConnected) b._load(CAMS.hassNow() || hass); }, 400);
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('pageshow', wake);
    b._load = (h) => {
      if (CAMS.dead(h, id) || b._busy) return;
      const url = CAMS.still(h, id, Date.now());
      if (!url) return;
      b._busy = true;
      const im = new Image();
      im.onload = () => {
        b._busy = false;
        b._fails = 0;
        b.classList.remove('noimg');
        const s = sig(im), fresh = s && b._sig != null && s !== b._sig, first = b._sig == null;
        if (s) b._sig = s;
        const live = (window._hemmaCamFrames || {})[id];
        // A snapshot feed takes a new picture on every fetch, so its picture is as old as the fetch.
        const at = CAMS.previewOf(h, id) ? Date.now() : CAMS.shotAt(h, id) || (fresh ? Date.now() : first ? null : b._at);
        if (live && (at == null || live.at > at)) { if (b.querySelector('img').src !== live.src) show(live.src, live.at, h); else b._paint(h); return; }
        if (fresh || first || !b.classList.contains('in')) show(url, at, h); else b._paint(h);
      };
      im.onerror = () => {
        b._busy = false;
        const n = b._fails = (b._fails || 0) + 1;
        if (n <= 4) { clearTimeout(b._rt); b._rt = setTimeout(() => { if (b.isConnected) b._load(CAMS.hassNow() || h); }, [1000, 2500, 6000, 15000][n - 1]); }
        if (!b._at && n > 2) { b.classList.add('noimg'); b.querySelector('small').textContent = T('cameras.no_image', 'No image'); }
      };
      im.src = url;
    };
    return b;
  };
  const PV_CSS = `
    .pv { position: relative; flex: none; border: 0; padding: 0; overflow: hidden; cursor: pointer; color: #fff; font: inherit; text-align: left;
      border-radius: var(--hemma-cam-r, 22px); background: rgba(0,0,0,0.35); -webkit-tap-highlight-color: transparent; }
    .pv img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .35s ease; }
    .pv img:not([src]) { display: none; }
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
      start() { io.observe(host); clearInterval(this.t); this.t = setInterval(tick, Math.max(1, Number(every) || 10) * 1000); this.a = setInterval(() => { const h = host._hass; if (h) host.shadowRoot.querySelectorAll('.pv').forEach((b) => b._paint(h)); }, 1000); },
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
        .hd { display: flex; align-items: center; border: 0; background: none; color: var(--hv-ink, #fff); font: inherit; cursor: pointer; padding: 22px var(--hemma-cam-pad, var(--hemma-rail-left, 16px)) 10px; font-size: 18px; gap: 8px; font-weight: 700; letter-spacing: -0.3px; -webkit-tap-highlight-color: transparent; }
        .hd svg { width: 0.53em; height: 0.88em; flex: none; opacity: .5; margin-top: 0.06em; }
        .row { display: flex; gap: var(--hemma-cam-gap, 12px); overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none;
          padding: 0 var(--hemma-cam-pad-r, var(--hemma-cam-pad, var(--hemma-rail-left, 16px))) 0 var(--hemma-cam-pad, var(--hemma-rail-left, 16px)); scroll-padding-left: var(--hemma-cam-pad, var(--hemma-rail-left, 16px)); }
        .row::-webkit-scrollbar { display: none; }
        .pv { width: var(--hemma-cam-w, min(360px, calc(100vw - 48px))); height: var(--hemma-cam-h, auto); aspect-ratio: var(--hemma-cam-ratio, 2 / 1); scroll-snap-align: start; opacity: var(--cat-edge, 1); }
        @media (max-width: 767px) {
          .hd { padding-top: var(--hemma-cam-head-top, 22px); padding-bottom: 18px; line-height: 1.3; font-size: 20px; }
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

  // Cameras page: every camera large, on black.
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
      const gone = () => { this.remove(); if (!camHost().querySelector('hemma-camera-view')) lockScroll(false); };
      a.finished.then(gone, gone);
    }
  }
  if (!customElements.get('hemma-camera-page')) customElements.define('hemma-camera-page', HemmaCameraPage);

  // As an iOS sheet: the page follows the finger down and, let go far or fast enough, closes from where it is; otherwise it springs back.
  const swipeAway = (el, skip, close) => {
    let y0 = null, x0 = 0, dy = 0, live = false, py = 0, pt = 0, v = 0;
    const set = (d) => { el.style.transform = d ? `translateY(${d}px)` : ''; el.style.borderRadius = d ? Math.min(38, d / 3) + 'px' : ''; el.style.overflow = d ? 'hidden' : ''; };
    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      y0 = t && e.touches.length === 1 && !e.composedPath().some((n) => n.classList && skip.some((c) => n.classList.contains(c))) ? t.clientY : null;
      if (y0 == null) return;
      x0 = t.clientX; dy = 0; live = false; py = t.clientY; pt = performance.now(); v = 0;
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (y0 == null || !t) return;
      const d = t.clientY - y0;
      if (!live) {
        if (Math.abs(t.clientX - x0) > 10 && Math.abs(t.clientX - x0) > d) { y0 = null; return; }
        if (d < 10) return;
        live = true;
        el.getAnimations().forEach((a) => { try { a.finish(); } catch (_) {} });
      }
      const now = performance.now();
      if (now > pt) v = (t.clientY - py) / (now - pt);
      py = t.clientY; pt = now;
      dy = Math.max(0, d - 10);
      set(dy);
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    const end = () => {
      if (y0 == null) return;
      y0 = null;
      if (!live) return;
      live = false;
      if (dy > 130 || (v > 0.45 && dy > 30)) { close(); return; }
      const from = el.style.transform, r = el.style.borderRadius;
      set(0);
      el.animate([{ transform: from, borderRadius: r, overflow: 'hidden' }, { transform: 'none', borderRadius: '0px', overflow: 'hidden' }], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
    };
    el.addEventListener('touchend', end, { passive: true });
    el.addEventListener('touchcancel', end, { passive: true });
  };

  // Its own class, never the popup's inline overflow: saving and restoring that value outlived the popup and left the page locked.
  const lockScroll = (on) => {
    if (!document.getElementById('hemma-cam-lock')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'hemma-cam-lock', textContent: 'html.hemma-cam-lock{overflow:hidden !important;}' }));
    document.documentElement.classList.toggle('hemma-cam-lock', !!on);
  };

  // Camera view: a timeline sidebar that folds away, the live picture centered, and a tap that takes it full screen.
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
      const a = this._morphOut() || this.animate([{ transform: this.style.transform || 'none' }, { transform: 'translateY(100%)' }], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' });
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
        .grp button[hidden] { display: none; }
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
        .root.imm :is(.sbf, .gmenu), .root.imm:not(.wside) .grp { opacity: 0; pointer-events: none; }
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
      // With a single camera there is nothing to switch to, so the grid button only shows when there are more.
      const all = q('.grp .all');
      all.hidden = Math.max(this._ids.length, CAMS.list(this._hass, CAMS.settings()).length) < 2;
      all.onclick = () => { window.hemmaCameraView.openAll(this._ids.length > 1 ? this._ids : CAMS.list(this._hass, CAMS.settings())); };
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
      if (!this._swipe) { this._swipe = true; swipeAway(this, ['ptl', 'tl', 'gmenu'], () => { if (!this._imm) this.close(); }); }
      this._feedFor();
      this._paint();
    }
    // On the iPhone the whole view folds into its picture, and the picture lands on the tile it came from.
    _morphOut() {
      if (this._imm) return null;
      const box = this.shadowRoot.querySelector('.vbox'), phone = window.matchMedia('(max-width: 767px)').matches;
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
      const off = this.getBoundingClientRect().top;
      if (!V.width || !V.height) return null;
      const rad = parseFloat(getComputedStyle(tile).borderTopLeftRadius) || 20;
      const sc = Math.max(T.width / V.width, T.height / V.height);
      const dx = T.left + T.width / 2 - (V.left + V.width / 2), dy = T.top + T.height / 2 - (V.top + V.height / 2);
      const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)', DUR = phone ? 300 : 380;
      this.shadowRoot.querySelectorAll('.root > :not(.stage), .gmenu').forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-out', fill: 'forwards' }));
      box.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${sc})` }], { duration: DUR, easing: EASE, fill: 'forwards' });
      // The last stretch fades the video off the tile, so the tile's own name and age come up under it rather than popping in at the end.
      this.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: DUR, easing: 'ease-in', fill: 'forwards' });
      return this.animate([{ clipPath: `inset(0px 0px 0px 0px round ${phone ? 55 : 0}px)` }, { clipPath: `inset(${T.top - off}px ${W - T.right}px ${H + off - T.bottom}px ${T.left}px round ${rad}px)` }], { duration: DUR, easing: EASE, fill: 'forwards' });
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

  // A camera tile's popup: the live feed at a glance, and the full camera view one tap further in.
  const CPOP_CSS = `
    .wrap.cpop { padding-top: 46px; }
    .cpop .big { position: relative; flex: none; align-self: stretch; margin-top: 22px; aspect-ratio: 4 / 3; border: 0; padding: 0; border-radius: 22px; overflow: hidden; background: rgba(0,0,0,0.3); cursor: pointer; color: #fff; font: inherit; text-align: left; -webkit-tap-highlight-color: transparent; }
    .cpop .big img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .cpop .big img:not([src]) { display: none; }
    .cpop .big .feed { position: absolute; inset: 0; opacity: 0; transition: opacity .35s ease; pointer-events: none; --ha-card-border-radius: 0; --ha-card-background: transparent; --ha-card-box-shadow: none; --ha-card-border-width: 0; }
    .cpop .big .feed.on { opacity: 1; }
    .cpop .big .feed > * { height: 100%; }
    .cpop .big .sh { position: absolute; left: 0; right: 0; bottom: 0; height: 45%; background: linear-gradient(transparent, rgba(0,0,0,0.42)); pointer-events: none; }
    .cpop .big .lb { position: absolute; left: 14px; bottom: 11px; right: 14px; display: grid; line-height: 1.25; text-shadow: 0 1px 6px rgba(0,0,0,0.45); }
    .cpop .big .lb b { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cpop .big .lb small { font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.88); font-variant-numeric: tabular-nums; }
    .cpop .big .badge { position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; background: rgba(0,0,0,0.42); padding: 4px 9px; border-radius: 999px; opacity: 0; transition: opacity .3s ease; }
    .cpop .big.live .badge { opacity: 0; }
    .cpop .big .badge i { width: 7px; height: 7px; border-radius: 50%; background: #ff453a; }
    .cpop .big .na { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; gap: 2px; color: rgba(235,235,245,0.6); font-size: 13px; }
    .cpop .big .na b { color: #fff; font-size: 15px; }
    .cpop .lbl { align-self: stretch; margin: 18px 4px 8px; font-size: 13px; font-weight: 600; color: rgba(235,235,245,0.6); }
    .cpop .evs { flex: none; align-self: stretch; border-radius: 18px; background: rgba(0,0,0,0.22); overflow: hidden; margin-bottom: 66px; }
    .cpop .er { position: relative; width: 100%; min-height: 48px; display: flex; align-items: center; gap: 12px; padding: 0 16px; border: 0; background: none; color: #fff; font: inherit; font-size: 15px; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .cpop .er + .er::before { content: ""; position: absolute; top: 0; left: 52px; right: 16px; height: 0.5px; background: rgba(255,255,255,0.12); }
    .cpop .er .mk { width: 26px; height: 26px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--c); }
    .cpop .er .mk i { width: 15px; height: 15px; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .cpop .er span { flex: 1; min-width: 0; }
    .cpop .er em { font-style: normal; color: rgba(235,235,245,0.6); font-variant-numeric: tabular-nums; }
    .cpop .er.none { cursor: default; justify-content: center; color: rgba(235,235,245,0.6); }
    @media (hover: hover) { .cpop .er:not(.none):hover { background: rgba(255,255,255,0.05); } }
    .cpop .thumbs { flex: none; align-self: stretch; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 10px 0 66px; }
    .cpop .th { position: relative; aspect-ratio: 4 / 3; border: 0; padding: 0; border-radius: 14px; overflow: hidden; background: rgba(0,0,0,0.3); cursor: pointer; color: #fff; font: inherit; -webkit-tap-highlight-color: transparent; }
    .cpop .th img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .cpop .th img:not([src]) { display: none; }
    .cpop .th .sh { position: absolute; left: 0; right: 0; bottom: 0; height: 60%; background: linear-gradient(transparent, rgba(0,0,0,0.5)); }
    .cpop .th b { position: absolute; left: 8px; right: 6px; bottom: 6px; font-size: 11.5px; font-weight: 600; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
    .cpop .th .ph { position: absolute; inset: 0 0 18% 0; display: grid; place-items: center; color: rgba(235,235,245,0.55); }
    .cpop .th .ph svg { width: 22px; height: 22px; }
    .cpop .th img[src] + .ph { display: none; }
    .cpop .th.sel { box-shadow: 0 0 0 2px #fff; }
    .cpop .th.off { opacity: 0.5; }
    .cpop .gear.corner.glist i { width: 20px; height: 20px; }
    @media (max-width: 768px) { .cpop .big { margin-top: 30px; border-radius: 26px; } .cpop .gear.corner.glist i { width: 24px; height: 24px; } }
  `;
  const CPOP_FULL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7'/%3E%3C/svg%3E";
  const CPOP_GRID = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3.5' y='3.5' width='7.6' height='7.6' rx='2'/%3E%3Crect x='12.9' y='3.5' width='7.6' height='7.6' rx='2'/%3E%3Crect x='3.5' y='12.9' width='7.6' height='7.6' rx='2'/%3E%3Crect x='12.9' y='12.9' width='7.6' height='7.6' rx='2'/%3E%3C/svg%3E";
  class HemmaCamPopupPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._built = false; }
    getCardSize() { return 8; }
    set hass(h) {
      this._hass = h;
      if (!this._built) this._build(); else this._paint();
      const f = this._feed;
      if (f && f.card) { try { f.card.hass = h; if (h.states[this._sel]) f.card.stateObj = h.states[this._sel]; } catch (_) {} }
    }
    connectedCallback() { if (this._built && !this._feed && !this._away) this._live(); }
    disconnectedCallback() { this._stop(); clearInterval(this._tick); clearInterval(this._back); this._built = false; }
    _ids() {
      const c = this._config, S = this._hass.states, ex = Array.isArray(c.exclude) ? c.exclude : [];
      const own = (Array.isArray(c.cameras) && c.cameras.length ? c.cameras : [c.entity]).filter((id) => typeof id === 'string' && id.startsWith('camera.') && S[id] && ex.indexOf(id) < 0);
      return own.length ? own : CAMS.list(this._hass, CAMS.settings()).filter((id) => ex.indexOf(id) < 0);
    }
    _name(id) { const n = (this._config.names || {})[id]; return n || CAMS.nameOf(this._hass, id, CAMS.settings()); }
    _build() {
      if (!this._config || !this._hass) return;
      const ids = this._ids();
      if (!ids.length) return;
      this._built = true;
      this._multi = ids.length > 1;
      const every = CAMS.list(this._hass, CAMS.settings()), grid = this._multi || every.length > 1;
      if (!this._sel || ids.indexOf(this._sel) < 0) this._sel = ids.find((id) => !CAMS.dead(this._hass, id) && CAMS.motion(this._hass, id)) || ids.find((id) => !CAMS.dead(this._hass, id)) || ids[0];
      const root = this.shadowRoot;
      root.innerHTML = `<style>${SHEET_CSS}${CPOP_CSS}${BIG_CSS}</style><div class="wrap cpop"><div class="hd"><b></b><span></span></div>`
        + `<button type="button" class="big" aria-label="${esc(T('cameras.full_screen', 'Full screen'))}"><img alt=""><span class="sh"></span><span class="badge"><i></i>${esc(T('cameras.live', 'Live'))}</span><span class="lb"><b></b><small></small></span></button>`
        + (this._multi ? `<div class="thumbs" style="grid-template-columns:repeat(${Math.min(3, ids.length)}, minmax(0, 1fr))">${ids.map((id) => `<button type="button" class="th" data-id="${esc(id)}"><img alt=""><span class="ph">${CAM_I.off}</span><span class="sh"></span><b>${esc(this._name(id))}</b></button>`).join('')}</div>`
          : `<div class="lbl">${esc(T('energy.today', 'Today'))}</div><div class="evs"><div class="er none">${esc(T('cameras.loading', 'Loading…'))}</div></div>`)
        + `<button type="button" class="gear corner glist" aria-label="${esc(grid ? T('cameras.title', 'Cameras') : T('cameras.full_screen', 'Full screen'))}" data-notip><i style="--i:url(&quot;${grid ? CPOP_GRID : CPOP_FULL}&quot;)"></i></button>`
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button></div>`;
      root.querySelector('.big').onclick = () => this._full(false);
      root.querySelector('.glist').onclick = () => this._full(grid, this._multi ? null : every);
      root.querySelector('.corner.gear:not(.glist)').onclick = () => moreInfo(this, this._sel);
      root.querySelectorAll('.th').forEach((b) => { b.onclick = () => this._pick(b.dataset.id); });
      this._onFrame = (e) => { if (e.detail === this._sel && !this._feed) this._still(); };
      window.addEventListener('hemma-cam-frame', this._onFrame);
      this._show();
      clearInterval(this._tick);
      this._tick = setInterval(() => { if (!this.isConnected) return clearInterval(this._tick); this._paint(); this._thumbs(); }, 1000);
      this._thumbs(true);
      this._events();
    }
    _show() { this._still(); this._paint(); this._live(); }
    // The frame Hemma already has paints at once, so the morph never shows an empty box; the live stream fades in over it.
    _still() {
      const big = this.shadowRoot.querySelector('.big'), img = big && big.querySelector('img');
      if (!img) return;
      const f = (window._hemmaCamFrames || {})[this._sel];
      if (f) { img.src = f.src; this._at = f.at; return; }
      const u = CAMS.still(this._hass, this._sel, Math.floor(Date.now() / 10000));
      if (u) img.src = u; else img.removeAttribute('src');
      this._at = CAMS.previewOf(this._hass, this._sel) ? Date.now() : CAMS.shotAt(this._hass, this._sel);
    }
    async _live() {
      const h = this._hass, id = this._sel, big = this.shadowRoot.querySelector('.big');
      if (!big || this._feed || CAMS.dead(h, id)) return;
      const tok = this._tok = {};
      const f = await CAMS.live(h, id);
      if (this._tok !== tok || !this.isConnected) { f.el.remove(); return; }
      this._feed = f;
      (window._hemmaCamLive = window._hemmaCamLive || {})[id] = true;
      big.insertBefore(f.el, big.querySelector('.sh'));
      const t0 = Date.now();
      const watch = () => {
        if (this._tok !== tok) return;
        const v = CAMS.videoIn(f.el);
        if (v && !v.muted) v.muted = true;
        if (v && v.videoWidth) {
          f.el.classList.add('on'); big.classList.add('live'); this._paint();
          const vr = v.getRootNode();
          if (vr && vr !== document && !vr.getElementById('hemma-fill')) vr.appendChild(Object.assign(document.createElement('style'), { id: 'hemma-fill', textContent: 'video { width: 100% !important; height: 100% !important; max-height: none !important; object-fit: cover; } :host { height: 100%; }' }));
        }
        if (Date.now() - t0 < 60000) setTimeout(watch, v && v.videoWidth ? 400 : 250);
      };
      watch();
    }
    // The last live frame becomes the camera's preview, as the full view does on close.
    _stop() {
      this._tok = null;
      const f = this._feed;
      this._feed = null;
      if (!f) return;
      if (window._hemmaCamLive) delete window._hemmaCamLive[this._sel];
      try {
        const v = CAMS.videoIn(f.el);
        if (v && v.videoWidth) {
          const c = document.createElement('canvas'), k = Math.min(1, 960 / v.videoWidth);
          c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          (window._hemmaCamFrames = window._hemmaCamFrames || {})[this._sel] = { src: c.toDataURL('image/jpeg', 0.82), at: Date.now() };
          const img = this.shadowRoot.querySelector('.big img');
          if (img) { img.src = window._hemmaCamFrames[this._sel].src; this._at = Date.now(); }
          window.dispatchEvent(new CustomEvent('hemma-cam-frame', { detail: this._sel }));
        }
      } catch (_) {}
      f.el.remove();
      const big = this.shadowRoot.querySelector('.big');
      if (big) big.classList.remove('live');
      if (!this.isConnected && this._onFrame) window.removeEventListener('hemma-cam-frame', this._onFrame);
    }
    _pick(id) {
      if (id === this._sel) return;
      this._stop();
      this._sel = id;
      this._show();
      this._thumbs();
    }
    // One camera streams at a time: the popup lets go of its feed while the full view has it, and picks it up again when that closes.
    _full(all, list) {
      this._stop();
      this._away = true;
      const ids = list || this._ids();
      if (all) window.hemmaCameraView.openAll(ids); else window.hemmaCameraView.open(this._sel, ids);
      // The popup goes as soon as the camera view is up, so it never sits over it.
      const t0 = Date.now();
      const gone = () => {
        const host = camHost();
        if (host.querySelector('hemma-camera-view') || host.querySelector('hemma-camera-page')) { if (window.hemmaPopup) window.hemmaPopup.close(); return; }
        if (Date.now() - t0 < 3000) requestAnimationFrame(gone);
      };
      requestAnimationFrame(gone);
      clearInterval(this._back);
      this._back = setInterval(() => {
        if (!this.isConnected) return clearInterval(this._back);
        const host = camHost();
        if (host.querySelector('hemma-camera-view') || host.querySelector('hemma-camera-page')) return;
        clearInterval(this._back);
        this._away = false;
        this._still();
        this._paint();
        this._live();
      }, 400);
    }
    _thumbs(load) {
      const h = this._hass;
      this.shadowRoot.querySelectorAll('.th').forEach((b) => {
        const id = b.dataset.id;
        b.classList.toggle('sel', id === this._sel);
        b.classList.toggle('off', CAMS.dead(h, id));
        const img = b.querySelector('img'), f = (window._hemmaCamFrames || {})[id];
        if (f) { if (img.src !== f.src) img.src = f.src; return; }
        // As often as the Cameras section's refresh setting asks: short for wired cameras, long for battery ones.
        const every = Math.max(1, Number((CAMS.settings() || {}).refresh) || 10) * 1000;
        if (!load && Date.now() - (b._t || 0) < every) return;
        b._t = Date.now();
        const u = CAMS.still(h, id, Math.floor(Date.now() / every));
        if (!u) return;
        const im = new Image();
        im.onload = () => { img.src = u; };
        im.src = u;
      });
    }
    async _events() {
      if (this._multi) return;
      const id = this._sel;
      const list = await CAMS.events(this._hass, id);
      if (id !== this._sel || !this.isConnected) return;
      this._evList = list.slice(0, 3);
      const box = this.shadowRoot.querySelector('.evs');
      if (!box) return;
      const h = this._hass;
      box.innerHTML = this._evList.length ? this._evList.map((e) => {
        const ding = e.kind === 'ding';
        return `<button type="button" class="er"><span class="mk" style="--c:${ding ? '#0A84FF' : '#FF9F0A'};--i:url(&quot;${ding ? CAM_BELL : CAM_WALK}&quot;)"><i></i></span>`
          + `<span>${esc(ding ? T('cameras.doorbell', 'Doorbell') : T('cameras.motion', 'Motion'))}</span><em>${esc(CAMS.time(h, e.at))}</em></button>`;
      }).join('') : `<div class="er none">${esc(T('cameras.no_activity', 'No activity today'))}</div>`;
      box.querySelectorAll('button.er').forEach((b) => { b.onclick = () => this._full(false); });
      this._paint();
    }
    _paint() {
      const root = this.shadowRoot, h = this._hass, id = this._sel;
      if (!root.querySelector('.hd') || !h) return;
      const ids = this._ids(), dead = ids.filter((x) => CAMS.dead(h, x)).length;
      const alert = window.hemmaCameraAlert ? window.hemmaCameraAlert(h, h.states, this._multi ? ids : [id], this._config.alert_window_minutes) : '';
      const last = !this._multi && this._evList && this._evList[0];
      root.querySelector('.hd b').textContent = this._multi ? (this._config.name || T('cameras.title', 'Cameras')) : this._name(id);
      root.querySelector('.hd span').textContent = this._multi
        ? (dead === ids.length ? T('cameras.all_offline', 'All Offline') : dead ? T('cameras.n_offline', '{n} Offline', { n: dead }) : alert || T('cameras.no_alerts', 'No Alerts'))
        : CAMS.dead(h, id) ? T('cameras.unavailable', 'Unavailable') : alert || (last ? `${CAM_EVENT_T(last.kind)[1]} ${CAMS.time(h, last.at)}` : T('cameras.no_alerts', 'No Alerts'));
      const big = root.querySelector('.big');
      big.querySelector('.lb b').textContent = this._name(id);
      big.querySelector('.lb small').textContent = CAMS.dead(h, id) ? T('cameras.unavailable', 'Unavailable') : big.classList.contains('live') ? T('cameras.live', 'Live') : this._at ? CAMS.age(Date.now() - this._at) : '';
    }
  }
  if (!customElements.get('hemma-cam-popup-panel')) customElements.define('hemma-cam-popup-panel', HemmaCamPopupPanel);
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
    vlo: '<svg viewBox="0 0 13.9014 17.2299"><path fill="currentColor" d="M10.5281 17.2299C11.171 17.2299 11.6271 16.7673 11.6271 16.1286L11.6271 1.16128C11.6271 0.532909 11.171 0.00824052 10.5074 0.00824052C10.0512 0.00824052 9.74405 0.207415 9.23838 0.679929L5.08577 4.58583C5.02749 4.64411 4.93393 4.68149 4.84017 4.68149L2.0437 4.68149C0.720424 4.68149-4.44089e-16 5.40192-4.44089e-16 6.81835L-4.44089e-16 10.4512C-4.44089e-16 11.8552 0.720424 12.586 2.0437 12.586L4.84017 12.586C4.93393 12.586 5.02749 12.6151 5.08577 12.6734L9.23838 16.6182C9.6923 17.041 10.0697 17.2299 10.5281 17.2299Z"/></svg>',
    vhi: '<svg viewBox="0 0 26.2108 18.8725"><path fill="currentColor" d="M22.3936 18.7193C22.7356 18.9701 23.2142 18.8727 23.4732 18.479C25.1861 16.0094 26.2108 12.8789 26.2108 9.43C26.2108 5.98114 25.155 2.86098 23.4732 0.381048C23.2142-0.0230309 22.7356-0.110057 22.3936 0.140671C22.0352 0.391399 21.9792 0.851452 22.2506 1.25764C23.7584 3.48684 24.7126 6.29819 24.7126 9.43C24.7126 12.5515 23.7584 15.3835 22.2506 17.6024C21.9792 18.0085 22.0352 18.4686 22.3936 18.7193Z"/><path fill="currentColor" d="M18.7319 16.1336C19.0946 16.374 19.5401 16.2994 19.8033 15.9181C21.0515 14.2072 21.7911 11.8373 21.7911 9.43C21.7911 7.02273 21.0618 4.63214 19.8033 2.94187C19.5401 2.5606 19.0946 2.48604 18.7319 2.72642C18.3713 2.9689 18.3071 3.42474 18.5931 3.83093C19.6675 5.33719 20.2721 7.35224 20.2721 9.43C20.2721 11.5078 19.6468 13.5125 18.5931 15.0291C18.3175 15.4353 18.3713 15.8911 18.7319 16.1336Z"/><path fill="currentColor" d="M15.1118 13.5935C15.4434 13.8131 15.8993 13.7468 16.1625 13.3677C16.9101 12.3771 17.3631 10.9278 17.3631 9.43C17.3631 7.93218 16.9101 6.49324 16.1625 5.49234C15.8993 5.11319 15.4434 5.04686 15.1118 5.27689C14.7223 5.55043 14.656 6.02907 14.9606 6.43526C15.5325 7.21095 15.8442 8.29294 15.8442 9.43C15.8442 10.5671 15.5221 11.6387 14.9606 12.4247C14.6663 12.8413 14.7223 13.3096 15.1118 13.5935Z"/><path fill="currentColor" d="M1.98904 13.4073L4.77918 13.4073C4.87082 13.4073 4.95192 13.4364 5.01232 13.4947L9.42258 17.4395C9.88474 17.852 10.2539 18.0512 10.7226 18.0512C11.3449 18.0512 11.8237 17.5886 11.8237 16.9499L11.8237 1.98258C11.8237 1.3542 11.3449 0.827425 10.7019 0.827425C10.2332 0.827425 9.92826 1.04117 9.42258 1.50122L5.01232 5.40712C4.95192 5.4654 4.87082 5.49033 4.77918 5.49033L1.98904 5.49033C0.651188 5.49033-4.44089e-16 6.17066-4.44089e-16 7.5892L-4.44089e-16 11.3251C-4.44089e-16 12.7333 0.663649 13.4073 1.98904 13.4073ZM2.05114 11.9836C1.69339 11.9836 1.51894 11.8174 1.51894 11.4472L1.51894 7.45464C1.51894 7.09267 1.69339 6.91611 2.05114 6.91611L5.17864 6.91611C5.42805 6.91611 5.61708 6.87873 5.84349 6.66478L10.0115 2.8852C10.0594 2.84149 10.1113 2.80813 10.1717 2.80813C10.2404 2.80813 10.2944 2.86008 10.2944 2.94329L10.2944 15.9228C10.2944 16.0185 10.2404 16.0705 10.1739 16.0705C10.1198 16.0705 10.0678 16.0455 10.0136 15.9851L5.84349 12.2349C5.61919 12.0355 5.42805 11.9836 5.17864 11.9836Z"/></svg>',
    power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0"/></svg>',
    vdn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 5V4L8 9zm11 2h6v2h-6z"/></svg>',
    b10: '<svg class="g10" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M11.2 4.3A11.5 11.5 0 1 1 4.4 12"/><path d="M12.6 1.2 9.4 4.6l3.6 2.6"/><text x="15" y="20.4" text-anchor="middle" fill="currentColor" stroke="none" font-size="12.5" font-weight="600" font-family="-apple-system, system-ui, sans-serif">10</text></svg>',
    f10: '<svg class="g10" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M18.8 4.3A11.5 11.5 0 1 0 25.6 12"/><path d="M17.4 1.2l3.2 3.4-3.6 2.6"/><text x="15" y="20.4" text-anchor="middle" fill="currentColor" stroke="none" font-size="12.5" font-weight="600" font-family="-apple-system, system-ui, sans-serif">10</text></svg>',
    b10n: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5A11 11 0 1 1 6.2 9.4"/><path d="M16.2 1.8 11.8 5l4.4 3.2z" fill="currentColor" stroke-width="1.2"/><text x="15" y="20.3" text-anchor="middle" fill="currentColor" stroke="none" font-size="12.5" font-weight="600" font-family="-apple-system, system-ui, sans-serif">10</text></svg>',
    b10m: '<svg class="g10" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M11.2 4.3A11.5 11.5 0 1 1 4.4 12"/><path d="M12.6 1.2 9.4 4.6l3.6 2.6"/><path d="M9.2 16h11.6"/></svg>',
    f10m: '<svg class="g10" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M18.8 4.3A11.5 11.5 0 1 0 25.6 12"/><path d="M17.4 1.2l3.2 3.4-3.6 2.6"/><path d="M9.2 16h11.6M15 10.2v11.6"/></svg>',
    b10nm: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5A11 11 0 1 1 6.2 9.4"/><path d="M16.2 1.8 11.8 5l4.4 3.2z" fill="currentColor" stroke-width="1.2"/><path d="M10 16h10"/></svg>',
    f10nm: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5A11 11 0 1 0 23.8 9.4"/><path d="M13.8 1.8 18.2 5l-4.4 3.2z" fill="currentColor" stroke-width="1.2"/><path d="M10 16h10M15 11v10"/></svg>',
    f10n: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5A11 11 0 1 0 23.8 9.4"/><path d="M13.8 1.8 18.2 5l-4.4 3.2z" fill="currentColor" stroke-width="1.2"/><text x="15" y="20.3" text-anchor="middle" fill="currentColor" stroke="none" font-size="12.5" font-weight="600" font-family="-apple-system, system-ui, sans-serif">10</text></svg>',
    vup: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 5V4L8 9zm13 0h2v2h2v2h-2v2h-2v-2h-2v-2h2z"/></svg>',
  };
  // Each TV integration names its remote keys differently; Hemma offers its remote only where it knows them (unlisted keys are sent as named).
  const RK = (u, d, l, r, ok, back, home) => ({ up: u, down: d, left: l, right: r, select: ok, back, home, home_hold: home });
  const REMOTE_KEYS = {
    apple_tv: { back: 'menu', home_hold: 'home_hold', skip_backward: 'skip_backward', skip_forward: 'skip_forward' },
    roku: { home_hold: 'home' },
    androidtv_remote: RK('DPAD_UP', 'DPAD_DOWN', 'DPAD_LEFT', 'DPAD_RIGHT', 'DPAD_CENTER', 'BACK', 'HOME'),
    samsungtv: RK('KEY_UP', 'KEY_DOWN', 'KEY_LEFT', 'KEY_RIGHT', 'KEY_ENTER', 'KEY_RETURN', 'KEY_HOME'),
    philips_js: RK('CursorUp', 'CursorDown', 'CursorLeft', 'CursorRight', 'Confirm', 'Back', 'Home'),
    braviatv: RK('Up', 'Down', 'Left', 'Right', 'Confirm', 'Return', 'Home'),
  };
  // The Siri Remote glyph, and the remote page's buttons drawn to match it.
  const RM_I = {
    ckoff: '<svg viewBox="0 0 19.9197 19.9218"><path fill="currentColor" d="M9.95469 19.9094C15.4553 19.9094 19.9197 15.4553 19.9197 9.95469C19.9197 4.45408 15.4553 0 9.95469 0C4.46443 0 4.44089e-16 4.45408 4.44089e-16 9.95469C4.44089e-16 15.4553 4.46443 19.9094 9.95469 19.9094ZM9.95469 18.2559C5.36575 18.2559 1.66174 14.5436 1.66174 9.95469C1.66174 5.36575 5.36575 1.6535 9.95469 1.6535C14.5436 1.6535 18.2559 5.36575 18.2559 9.95469C18.2559 14.5436 14.5436 18.2559 9.95469 18.2559Z"/></svg>',
    ckon: '<svg viewBox="0 0 19.9197 19.9218"><path fill="currentColor" d="M19.9197 9.95469C19.9197 15.4407 15.4511 19.9094 9.95469 19.9094C4.46866 19.9094 4.44089e-16 15.4407 4.44089e-16 9.95469C4.44089e-16 4.46866 4.46866 0 9.95469 0C15.4511 0 19.9197 4.46866 19.9197 9.95469ZM12.9965 6.08738L8.82516 12.7726L6.84087 10.2197C6.60471 9.8965 6.38504 9.80736 6.10939 9.80736C5.65566 9.80736 5.32404 10.1658 5.32404 10.6134C5.32404 10.8331 5.40282 11.0528 5.55618 11.2393L8.00052 14.2482C8.2616 14.5942 8.53092 14.7247 8.86868 14.7247C9.19608 14.7247 9.47575 14.5714 9.68507 14.2482L14.2668 7.02185C14.3952 6.82921 14.5133 6.59918 14.5133 6.38373C14.5133 5.91965 14.1217 5.63154 13.6865 5.63154C13.4255 5.63154 13.1726 5.78489 12.9965 6.08738Z"/></svg>',
    remote: '<svg viewBox="0 0 8.13328 21.5771" class="rmg"><path fill="currentColor" d="M2.29603 21.5585L5.8476 21.5585C7.29056 21.5585 8.13328 20.7158 8.13328 19.2707L8.13328 2.28779C8.13328 0.842723 7.29056 0 5.8476 0L2.29603 0C0.842723 0 0 0.842723 0 2.28779L0 19.2707C0 20.7158 0.842723 21.5585 2.29603 21.5585ZM4.07182 8.19026C2.38768 8.19026 1.02542 6.83623 1.02542 5.14175C1.02542 3.46585 2.38768 2.11394 4.07182 2.11394C5.74771 2.11394 7.10997 3.46585 7.10997 5.14175C7.10997 6.83623 5.74771 8.19026 4.07182 8.19026ZM2.56615 11.1747C1.9617 11.1747 1.47361 10.6824 1.47361 10.0697C1.47361 9.45494 1.95135 8.96685 2.56615 8.96685C3.18307 8.96685 3.67327 9.45494 3.67327 10.0697C3.67327 10.6824 3.17272 11.1747 2.56615 11.1747ZM5.58783 11.1747C4.96267 11.1747 4.46212 10.6824 4.46212 10.0697C4.46212 9.45494 4.96267 8.96685 5.58783 8.96685C6.19228 8.96685 6.67213 9.45494 6.67213 10.0697C6.67213 10.6721 6.18404 11.1747 5.58783 11.1747ZM2.56615 14.076C1.9617 14.076 1.47361 13.5837 1.47361 12.9689C1.47361 12.3666 1.9617 11.866 2.56615 11.866C3.18307 11.866 3.67327 12.3562 3.67327 12.9689C3.67327 13.5941 3.18307 14.076 2.56615 14.076ZM2.56615 16.9856C1.9617 16.9856 1.47361 16.4829 1.47361 15.8806C1.47361 15.2658 1.9617 14.7652 2.56615 14.7652C3.17272 14.7652 3.67327 15.2658 3.67327 15.8806C3.67327 16.4933 3.18307 16.9856 2.56615 16.9856ZM5.57537 16.9856C5.00005 16.9856 4.53478 16.5078 4.53478 15.945L4.53478 12.9066C4.53478 12.3292 5.00005 11.866 5.57537 11.866C6.14666 11.866 6.62229 12.3395 6.62229 12.9066L6.62229 15.945C6.62229 16.5224 6.14666 16.9856 5.57537 16.9856Z"/></svg>',
    chev: '<svg viewBox="0 0 11 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2 2 9l7 7"/></svg>',
    back: '<svg viewBox="0 0 14 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 12l10 10"/></svg>',
    pp: '<svg viewBox="0 0 24.8868 14.9206"><path fill="currentColor" d="M0 13.5599C0 14.4747 0.529089 14.9081 1.16169 14.9081C1.43754 14.9081 1.73409 14.8272 2.01396 14.6696L12.2672 8.69815C12.9989 8.26493 13.2872 7.94767 13.2872 7.45406C13.2872 6.96044 12.9989 6.64319 12.2672 6.20997L2.01396 0.238467C1.73409 0.0808959 1.43754 0 1.16169 0C0.529089 0 0 0.433422 0 1.3482ZM1.57069 12.7817L1.57069 2.12641C1.57069 2.00984 1.64144 1.93086 1.74746 1.93086C1.78906 1.93086 1.82242 1.94332 1.85579 1.96211L10.9751 7.30855C11.0437 7.35015 11.0707 7.4021 11.0707 7.45406C11.0707 7.50601 11.0437 7.55797 10.9751 7.59957L1.85579 12.946C1.82242 12.9648 1.78906 12.9773 1.74746 12.9773C1.64144 12.9773 1.57069 12.8983 1.57069 12.7817ZM17.6015 14.9081C18.0698 14.9081 18.4282 14.5476 18.4282 14.0917L18.4282 0.816399C18.4282 0.360566 18.0698 0 17.6015 0C17.125 0 16.7644 0.360566 16.7644 0.816399L16.7644 14.0917C16.7644 14.5476 17.125 14.9081 17.6015 14.9081ZM24.0497 14.9081C24.5159 14.9081 24.8868 14.5476 24.8868 14.0917L24.8868 0.816399C24.8868 0.360566 24.5159 0 24.0497 0C23.5835 0 23.2126 0.360566 23.2126 0.816399L23.2126 14.0917C23.2126 14.5476 23.5835 14.9081 24.0497 14.9081Z"/></svg>',
    atv: '<svg viewBox="0 0 19.4976 19.4314"><path fill="currentColor" d="M18.3579 1.16882C19.3476 2.1668 19.4976 3.55067 19.4976 5.22355L19.4976 14.2246C19.4976 15.8974 19.3476 17.2792 18.3579 18.2793C17.3557 19.2815 15.949 19.4314 14.2907 19.4314L5.20687 19.4314C3.5361 19.4314 2.14188 19.2815 1.13968 18.2793C0.147822 17.2917 0 15.8974 0 14.2246L0 5.1921C0 3.55489 0.149932 2.17102 1.14179 1.17093C2.14188 0.179074 3.55067 0.0166814 5.18577 0.0166814L14.2907 0.0166814C15.949 0.0166814 17.3536 0.176964 18.3579 1.16882ZM5.73676 7.79683C5.45227 7.79683 5.0702 7.53515 4.61125 7.53515C3.75778 7.53515 2.88974 8.22875 2.88974 9.56609C2.88974 10.3967 3.19915 11.2751 3.59579 11.8338C3.95505 12.3176 4.252 12.7246 4.68602 12.7246C5.11793 12.7246 5.29239 12.4277 5.82399 12.4277C6.3577 12.4277 6.48231 12.7246 6.94125 12.7246C7.41055 12.7246 7.71996 12.2803 8.02937 11.8587C8.33878 11.3976 8.48832 10.9159 8.48832 10.891C8.47586 10.891 7.56008 10.5192 7.56008 9.49132C7.56008 8.61293 8.26613 8.21629 8.31386 8.1789C7.85703 7.53515 7.13851 7.49988 6.94125 7.49988C6.42 7.49988 5.99844 7.79683 5.73676 7.79683ZM9.67613 6.59445L9.67613 7.74699L8.97007 7.74699L8.97007 8.60046L9.67613 8.60046L9.67613 11.3852C9.67613 12.3052 10.0728 12.6997 11.0384 12.6997C11.2606 12.6997 11.4849 12.6873 11.6074 12.6623L11.6323 12.6395L11.6323 11.8089L11.5949 11.8089C11.5326 11.8213 11.3727 11.8338 11.273 11.8338C10.8889 11.8338 10.7165 11.6593 10.7165 11.2627L10.7165 8.60046L11.6448 8.60046L11.6448 7.74699L10.7165 7.74699L10.7165 6.59445ZM12.0539 7.74699L13.8003 12.6623L14.876 12.6623L16.5975 7.74699L15.5197 7.74699L14.3444 11.5846L13.169 7.74699ZM5.67656 7.28805C5.67656 7.32543 5.67656 7.38773 5.68903 7.40019C5.70149 7.41266 5.73676 7.41266 5.77414 7.41266C6.40754 7.41266 7.07621 6.71906 7.06375 5.96317C7.07621 5.92578 7.06375 5.86559 7.05129 5.82821C6.37016 5.85313 5.67656 6.53426 5.67656 7.28805Z"/></svg>',
    tv: '<svg viewBox="0 0 22 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="1.5" y="1.5" width="19" height="12" rx="2" fill="currentColor" fill-opacity="0.22"/><path d="M7 16.5h8" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 20.9264 22.002"><path fill="currentColor" d="M15.0942 18.8493C14.9643 19.3088 14.5645 19.6159 14.0406 19.6159C13.5822 19.6159 13.2048 19.4271 12.7509 19.0043L8.59826 15.0595C8.53997 15.0012 8.44642 14.972 8.35266 14.972L5.55619 14.972C4.23291 14.972 3.51249 14.2413 3.51249 12.8373L3.51249 9.20443C3.51249 8.56167 3.66083 8.06224 3.94805 7.71001ZM15.1396 3.54736L15.1396 13.534L8.5851 6.9836C8.5899 6.97998 8.59417 6.97599 8.59826 6.9719L12.7509 3.06601C13.2565 2.59349 13.5636 2.39432 14.0199 2.39432C14.6835 2.39432 15.1396 2.91899 15.1396 3.54736Z"/><path fill="currentColor" d="M18.5106 20.6399C18.8049 20.9341 19.2878 20.9341 19.5716 20.6399C19.8598 20.3414 19.868 19.8731 19.5716 19.5767L2.84543 2.86089C2.5533 2.57911 2.07044 2.56454 1.77408 2.86089C1.48808 3.14689 1.48808 3.64834 1.77408 3.93434Z"/></svg>',
    air: '<svg viewBox="0 0 14.9696 20.2243"><path fill="currentColor" d="M0 2.77277L0 17.4412C0 19.2861 0.915378 20.214 2.7396 20.214L12.23 20.214C14.0564 20.214 14.9696 19.2861 14.9696 17.4412L14.9696 2.77277C14.9696 0.925729 14.0585 0 12.23 0L2.7396 0C0.913268 0 0 0.925729 0 2.77277ZM1.57069 2.79558C1.57069 1.98864 1.98864 1.57069 2.80382 1.57069L12.1679 1.57069C12.981 1.57069 13.401 1.98864 13.401 2.79558L13.401 17.4184C13.401 18.219 12.9768 18.6433 12.1679 18.6433L2.80382 18.6433C1.99286 18.6433 1.57069 18.219 1.57069 17.4184ZM7.49104 17.0741C9.69472 17.0741 11.4705 15.3087 11.4705 13.0822C11.4705 10.866 9.69472 9.11307 7.49104 9.10272C5.27701 9.09026 3.49912 10.866 3.49912 13.0822C3.49912 15.3087 5.27701 17.0741 7.49104 17.0741ZM7.49104 14.7719C6.55165 14.7719 5.79093 14.0154 5.79093 13.0822C5.79093 12.1158 6.52673 11.3821 7.49104 11.3821C8.44289 11.3821 9.17869 12.1158 9.17869 13.0822C9.17869 14.0154 8.44289 14.7719 7.49104 14.7719ZM7.49104 7.56671C8.70779 7.56671 9.72517 6.5825 9.70447 5.35329C9.69412 4.11795 8.7099 3.15654 7.49104 3.14408C6.26183 3.13162 5.26515 4.11584 5.26515 5.35329C5.26515 6.58461 6.25972 7.56671 7.49104 7.56671ZM7.49104 6.48251C6.85473 6.48251 6.35147 5.9689 6.35147 5.35329C6.35147 4.69628 6.85262 4.21794 7.49104 4.21794C8.10243 4.21794 8.62026 4.7212 8.62026 5.35329C8.62026 5.9689 8.11489 6.48251 7.49104 6.48251Z"/></svg>',
    apps: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="1" y="1" width="7.5" height="7.5" rx="2"/><rect x="11.5" y="1" width="7.5" height="7.5" rx="2"/><rect x="1" y="11.5" width="7.5" height="7.5" rx="2"/><rect x="11.5" y="11.5" width="7.5" height="7.5" rx="2"/></svg>',
    vdn: '<svg viewBox="0 0 24.1528 17.2299"><path fill="currentColor" d="M15.5725 9.42932L23.2226 9.42932C23.7716 9.42932 24.1528 9.1391 24.1528 8.62328C24.1528 8.09288 23.7944 7.79231 23.2226 7.79231L15.5725 7.79231C15.0007 7.79231 14.6319 8.09288 14.6319 8.62328C14.6319 9.1391 15.0235 9.42932 15.5725 9.42932Z"/><path fill="currentColor" d="M10.5281 17.2299C11.1628 17.2299 11.6271 16.7673 11.6271 16.1286L11.6271 1.16128C11.6271 0.532909 11.1628 0.00824052 10.5074 0.00824052C10.0512 0.00824052 9.7337 0.207415 9.23838 0.679929L5.07542 4.58583C5.01714 4.64411 4.93393 4.68149 4.84017 4.68149L2.0437 4.68149C0.720424 4.68149 0 5.40192 0 6.81835L0 10.4512C0 11.8552 0.720424 12.586 2.0437 12.586L4.84017 12.586C4.93393 12.586 5.01714 12.6151 5.07542 12.6734L9.23838 16.6182C9.6923 17.041 10.0719 17.2299 10.5281 17.2299Z"/></svg>',
    vup: '<svg viewBox="0 0 23.7927 17.2299"><path fill="currentColor" d="M20.0825 12.2981L20.0825 4.90469C20.0825 4.40535 19.7406 4.06759 19.2516 4.06759C18.7771 4.06759 18.4455 4.40746 18.4455 4.90469L18.4455 12.2981C18.4455 12.785 18.7771 13.1249 19.2516 13.1249C19.7406 13.1249 20.0825 12.7871 20.0825 12.2981ZM15.5828 9.41475L22.9659 9.41475C23.4528 9.41475 23.7927 9.08313 23.7927 8.60871C23.7927 8.11971 23.4549 7.77774 22.9659 7.77774L15.5828 7.77774C15.0731 7.77774 14.7436 8.11971 14.7436 8.60871C14.7436 9.08313 15.0856 9.41475 15.5828 9.41475Z"/><path fill="currentColor" d="M10.5281 17.2299C11.1628 17.2299 11.6271 16.7673 11.6271 16.1286L11.6271 1.16128C11.6271 0.532909 11.1628 0.00824052 10.5074 0.00824052C10.0512 0.00824052 9.7337 0.207415 9.23838 0.679929L5.07542 4.58583C5.01714 4.64411 4.93393 4.68149 4.84017 4.68149L2.0437 4.68149C0.720424 4.68149 0 5.40192 0 6.81835L0 10.4512C0 11.8552 0.720424 12.586 2.0437 12.586L4.84017 12.586C4.93393 12.586 5.01714 12.6151 5.07542 12.6734L9.23838 16.6182C9.6923 17.041 10.0719 17.2299 10.5281 17.2299Z"/></svg>',
    minus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10"/></svg>',
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M8 3v10"/></svg>',
  };
  const RM_CSS = `
    /* The remote and apps buttons are drawn in the controls' own dimmed color, and a press fills a circle behind them. No hover, no tooltip. */
    .tp button.rmb, .tp button.apb { position: relative; color: rgba(var(--hv-pk, 255,255,255),0.4); }
    .tp button.rmb svg.rmg { height: 22px; width: auto; position: relative; }
    .tp button.apb svg { height: 20px; width: auto; position: relative; }
    .tp button.rmb::before, .tp button.apb::before { content: ""; position: absolute; inset: 4px; border-radius: 50%; background: rgba(var(--hv-pk, 255,255,255),0.14); opacity: 0; transition: opacity .3s ease; }
    .tp button.rmb:active::before, .tp button.apb:active::before { opacity: 1; transition: none; }
    .tp button.apb:disabled, .tp button.apb:disabled:hover { opacity: .45; cursor: default; }
    .tp button.apb:disabled::before { display: none; }
    @media (hover: hover) { .tp button.rmb:hover, .tp button.apb:hover { opacity: 1; } }
    .tp .rsp { width: 52px; height: 52px; flex: none; }
    /* Speaker sheet: each speaker a capsule filled to its volume, ticked when it plays with this one. */
    .spk { position: absolute; z-index: 5; left: 14px; right: 14px; border-radius: 24px; padding: 8px; display: grid; gap: 6px; box-sizing: border-box;
      background: var(--hv-spk-bg, rgba(120,115,110,0.55)); -webkit-backdrop-filter: var(--hv-spk-bf, blur(24px) saturate(1.3)); backdrop-filter: var(--hv-spk-bf, blur(24px) saturate(1.3));
      box-shadow: var(--hv-spk-sh, 0 0 0 0.5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3), 0 18px 40px -16px rgba(0,0,0,0.5)); transform-origin: 90% 100%; }
    .spk { padding: 10px; gap: 8px; }
    .spk .sh { display: flex; align-items: center; gap: 12px; padding: 4px 4px 6px; min-width: 0; }
    .spk .sa { flex: none; width: 48px; height: 48px; border-radius: 9px; background: rgba(var(--hv-pk, 255,255,255),0.12) center / cover no-repeat; }
    .spk .st { display: grid; min-width: 0; line-height: 1.25; }
    .spk .st b { font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .spk .st small { font-size: 15px; color: rgba(var(--hv-pk2, 235,235,245),0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .spk .sr { position: relative; height: 48px; border-radius: 24px; overflow: hidden; background: var(--hv-spk-row, rgba(var(--hv-pk, 255,255,255),0.1)); display: flex; align-items: center; gap: 12px; padding: 0 14px 0 16px; touch-action: none; cursor: pointer; transition: background-color .2s ease; }
    .spk .sr.on { background: var(--hv-spk-on, rgba(var(--hv-pk, 255,255,255),0.3)); }
    .spk .sr .f { position: absolute; left: 0; top: 0; bottom: 0; background: var(--hv-spk-f, rgba(var(--hv-pk, 255,255,255),0.12)); pointer-events: none; }
    .spk .sr.on .f { background: var(--hv-spk-fon, rgba(var(--hv-pk, 255,255,255),0.22)); }
    .spk .sr .si { position: relative; flex: none; width: 22px; height: 22px; display: grid; place-items: center; }
    .spk .sr .si svg { width: auto; height: 21px; display: block; }
    .spk .sr b { position: relative; flex: 1; font-size: 17px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--hv-pi, #fff); }
    .spk .sr em { position: relative; flex: none; width: 24px; height: 24px; display: grid; place-items: center; font-style: normal; color: var(--hv-pi, #fff); }
    .spk .sr em span { grid-area: 1 / 1; display: grid; }
    .spk .sr em svg { width: 24px; height: 24px; display: block; }
    .spk .sr .c1 { display: none; color: #1c1c1e; }
    .spk .sr.on .c1 { display: grid; } .spk .sr.on .c0 { display: none; }
    .corner.rmc { left: 10.5px; right: auto; }
    .corner.rmc svg { height: 19px; width: auto; color: var(--hv-pi, #fff); }
    .wrap.med > :not(.rpage) { transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; }
    .wrap.med.rem > :not(.rpage) { transform: translateX(-30%); opacity: 0; pointer-events: none; }
    .rpage { position: absolute; inset: calc(-1 * var(--rx-t, 0px)) 0 calc(-1 * var(--rx-b, 0px)); padding-top: var(--rpt, 18px) !important; z-index: 3; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; padding: 18px 20px 26px;
      transform: translateX(100%); opacity: 0; pointer-events: none; transition: transform .38s cubic-bezier(0.2, 0.9, 0.25, 1), opacity .26s ease; }
    .wrap.med.rem { overflow: visible; }
    .wrap.med.rem > .rpage { transform: none; opacity: 1; pointer-events: auto; }
    .rpage button { border: 0; padding: 0; color: var(--hv-pi, #fff); font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .rpage { background: #000; }
    .rpage .gl { position: relative; box-shadow: none; transition: background-color .18s ease; background: #202020;
      background-image: linear-gradient(to bottom, rgba(var(--hv-pk, 255,255,255),0.094) 1px, rgba(var(--hv-pk, 255,255,255),0.054) 2px, rgba(var(--hv-pk, 255,255,255),0.027) 3.3px, rgba(var(--hv-pk, 255,255,255),0.011) 4.7px, rgba(var(--hv-pk, 255,255,255),0) 6.5px), linear-gradient(to top, rgba(var(--hv-pk, 255,255,255),0.094) 1px, rgba(var(--hv-pk, 255,255,255),0.054) 2px, rgba(var(--hv-pk, 255,255,255),0.027) 3.3px, rgba(var(--hv-pk, 255,255,255),0.011) 4.7px, rgba(var(--hv-pk, 255,255,255),0) 6.5px); }
    /* The ring fades by angle (measured: .49 at the top, .24 at 30deg, .13 at 45deg, nothing at the sides); the mask runs down the height. */
    .rpage .gl::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.19);
      -webkit-mask-image: linear-gradient(to bottom, #000, rgba(0,0,0,0.61) 1.7%, rgba(0,0,0,0.49) 6.7%, rgba(0,0,0,0.27) 14.6%, rgba(0,0,0,0.18) 25%, rgba(0,0,0,0.06) 37%, transparent 50%, rgba(0,0,0,0.06) 63%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.27) 85.4%, rgba(0,0,0,0.49) 93.3%, rgba(0,0,0,0.61) 98.3%, #000);
      mask-image: linear-gradient(to bottom, #000, rgba(0,0,0,0.61) 1.7%, rgba(0,0,0,0.49) 6.7%, rgba(0,0,0,0.27) 14.6%, rgba(0,0,0,0.18) 25%, rgba(0,0,0,0.06) 37%, transparent 50%, rgba(0,0,0,0.06) 63%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.27) 85.4%, rgba(0,0,0,0.49) 93.3%, rgba(0,0,0,0.61) 98.3%, #000); }
    .rpage .gl:active, .rpage .gl.held { background: #3a3a3c; transition: none; }
    /* Minimal: the dashboard's own hue at night, flat buttons and pad, no rims. */
    .rpage.hv { background: oklch(from var(--hv-bg, #49575c) 0.25 min(c, 0.03) h); --hv-pk: 255,255,255; --hv-pk2: 235,235,245; --hv-pi: #fff; color: #fff; }
    .rpage.hv .gl { background: rgba(255,255,255,0.11); background-image: none; }
    .rpage.hv .gl::before { display: none; }
    .rpage.hv .gl:active, .rpage.hv .gl.held { background: rgba(255,255,255,0.2); }
    .rpage.hv .rpad { background: rgba(255,255,255,0.07); }
    .rpage.hv .rring { background: rgba(255,255,255,0.08); box-shadow: none; }
    .rpage.hv .rring .rok { --ok: 0.11; background: linear-gradient(rgba(255,255,255,var(--ok)), rgba(255,255,255,var(--ok))), linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08)), oklch(from var(--hv-bg, #49575c) 0.25 min(c, 0.03) h); box-shadow: none; z-index: 1; }
    .rpage.hv .rring[data-q="ok"] .rok { --ok: 0.15; }
    .rpage.hv .rring.down[data-q="ok"] .rok { --ok: 0.2; }

    /* Remote layout: a full row on top (back, the device pill filling the space between, power), the pad, then Play/Pause, a larger Back and Home. */
    .rtop { flex: none; align-self: stretch; display: grid; grid-template-columns: var(--rc) minmax(0, 1fr) var(--rc); align-items: center; gap: 12px; }
    .rpage { --rc: 46px; --rs: 68px; --rl: 88px; }
    .rcb { width: var(--rc); height: var(--rc); border-radius: 50%; display: grid; place-items: center; }
    .rcb svg { width: 19px; height: 19px; }
    .rcb.rpow svg { width: 27px; height: 27px; }
    .rcb.rclose svg { width: 11px; height: 18px; transform: translateX(-1px); }
    .rdev { justify-self: stretch; height: var(--rc); border-radius: calc(var(--rc) / 2); padding: 0 18px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 600; min-width: 0; }
    .rdev { position: relative; }
    .rdev .rtv { flex: none; width: 19px; height: 19px; color: var(--hv-pi, #fff); }
    .rdev .rtv svg { width: 100%; height: 100%; display: block; }
    .rpage .rdev { font-size: 17px; }
    .rdev b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; min-width: 0; }
    .rdev em { flex: none; display: grid; width: 7px; height: 11px; color: rgba(var(--hv-pk2, 235,235,245),0.45); margin-left: 2px; }
    .rdev em svg { width: 100%; height: 100%; display: block; }
    .rdev:not(.many) em { display: none; }
    .rdev:not(.many) { cursor: default; }
    .rlist { display: none; }
    .rring { display: none; position: absolute; left: 50%; top: 50%; height: min(236px, calc(100% - 8px)); aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%;
      background: #1c1c1e; box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.08); cursor: pointer; }
    @media (hover: hover) and (pointer: fine) {
      .rpage:not(.full) .rpad { background: none; cursor: default; }
      .rpage:not(.full) .rpad .rglow, .rpage:not(.full) .rpad .rhint { display: none; }
      .rpage:not(.full) .rring { display: block; }
    }
    .rring .rq { position: absolute; inset: 0; border-radius: 50%; opacity: 0; transform: rotate(var(--qr, 0deg)); background: conic-gradient(from -45deg, rgba(var(--hv-pk, 255,255,255),0.05) 0 90deg, transparent 0); transition: opacity .12s ease; }
    .rring[data-q="up"] .rq, .rring[data-q="right"] .rq, .rring[data-q="down"] .rq, .rring[data-q="left"] .rq { opacity: 1; }
    .rring.down .rq { background: conic-gradient(from -45deg, rgba(var(--hv-pk, 255,255,255),0.1) 0 90deg, transparent 0); transition: none; }
    .rpage .rring .rok { background: #2a2a2c; background-image: none; box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.06); }
    .rpage .rring .rok::before { display: none; }
    .rring .ra { position: absolute; width: 16px; height: 16px; color: rgba(var(--hv-pk, 255,255,255),0.75); pointer-events: none; }
    .rring .ra svg { display: block; width: 100%; height: 100%; }
    .rring .au { left: calc(50% - 8px); top: 9%; } .rring .ad { left: calc(50% - 8px); bottom: 9%; transform: rotate(180deg); }
    .rring .al { top: calc(50% - 8px); left: 9%; transform: rotate(-90deg); } .rring .ar { top: calc(50% - 8px); right: 9%; transform: rotate(90deg); }
    .rpage .rring .rok { position: absolute; left: 28%; top: 28%; width: 44%; height: 44%; border-radius: 50%; }
    .rpage .rring[data-q="ok"] .rok { background-color: #2c2c2e; }
    .rpage .rring.down[data-q="ok"] .rok { background-color: #3a3a3c; }
    .rpage .gmenu:not(.mac) { z-index: 5; }
    .rpage .gmenu:not(.mac) button:has(.gi) { padding: 0 22px 0 76px; }
    .rpage .gmenu:not(.mac) .gi { left: 40px; right: auto; width: 22px; height: 22px; margin-top: -11px; }
    .rpad { position: relative; flex: 1 1 auto; min-height: 180px; align-self: stretch; margin-top: 26px; border-radius: 40px; overflow: hidden; outline: none;
      background: #1c1c1e; touch-action: none; cursor: pointer; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    .rpad .rglow { position: absolute; width: 96px; height: 96px; margin: -48px 0 0 -48px; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .25s ease;
      background: radial-gradient(circle, rgba(var(--hv-pk, 255,255,255),0.24), rgba(var(--hv-pk, 255,255,255),0) 70%); }
    .rpad.down .rglow { opacity: 1; transition: opacity .08s ease; }
    .rpad.hold .rglow { transform: scale(1.5); background: radial-gradient(circle, rgba(var(--hv-pk, 255,255,255),0.32), rgba(var(--hv-pk, 255,255,255),0) 70%); transition: transform .3s ease; }
    .rpad .rhint { position: absolute; left: 0; right: 0; bottom: 18px; text-align: center; font-size: 13px; color: rgba(var(--hv-pk, 255,255,255),0.22); pointer-events: none; }
    /* While something plays, the corners skip back and forward ten seconds. */
    .rpad .rsk { position: absolute; bottom: 12px; width: 44px; height: 44px; border-radius: 50%; display: none; place-items: center; background: none; color: var(--hv-pi, #fff); }
    .rpad .rsk svg { width: 31px; height: 31px; }
    .rpad .rsk:active { background: rgba(var(--hv-pk, 255,255,255),0.14); }
    .rpad .rskb { left: 20px; } .rpad .rskf { right: 20px; }
    .rpad .rsk { bottom: 17px; }
    .rpad.play .rsk { display: grid; }
    .rpad.play .rhint { display: none; }
    /* Volume as two capsules: a web page can't use a phone's side buttons. */
    .rvol { flex: none; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
    .rvol:empty { display: none; }
    .rvol.mu { grid-template-columns: 1fr auto 1fr; }
    .rvol button { height: 40px; border-radius: 20px; display: grid; place-items: center; color: var(--hv-pi, #fff); }
    .rvol button svg { width: 24px; height: 17px; }
    .rvol button.rmute svg { width: auto; height: 19px; }
    .rvol button.rmute { width: 40px; }
    .rvol button.rmute.on { background: #fff; color: #1c1c1e; }
    .rbtns { flex: none; margin-top: 30px; display: flex; align-items: center; justify-content: space-between; align-self: stretch; padding: 0 2px; }
    .rsb { width: var(--rs); height: var(--rs); border-radius: 50%; display: grid; place-items: center; }
    .rsb svg { width: 26px; height: 22px; }
    .rsb.rhome svg { width: 29px; height: 25px; }
    .rsb.rpp svg { width: 27px; height: 16px; }
    .rlb { width: var(--rl); height: var(--rl); border-radius: 50%; display: grid; place-items: center; }
    .rlb svg { width: 17px; height: 30px; transform: translateX(-1px); }
    /* Phone sizes: 56pt top row, the pad from 32pt under it, 84pt side buttons and a 110pt Back centered 50pt above the bottom edge. */
    @media (max-width: 768px) { .rpage { --rc: 56px; --rs: 84px; --rl: 110px; --rpt: var(--rx-pt, 0px); padding: 0 16px var(--rx-pb, calc(max(16px, var(--sab, 0px)) + 16px)); } .rtop { gap: 16px; } .rpage .rdev { font-size: 20px; } .rdev em { width: 8px; height: 13px; } .rdev .rtv { width: 16px; height: 16px; } .rpad { margin-top: 32px; border-radius: 44px; } .rvol button { height: 44px; border-radius: 22px; } .rbtns { margin-top: 26px; padding: 0 0; } }
  `;
  const RM_FULL_CSS = `
    :host { position: fixed; inset: 0; z-index: 2147483100; display: block; color: #fff; font-family: var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    .rpage.full { inset: 0; transform: none; opacity: 1; pointer-events: auto; transition: none; --rc: 56px; --rs: 84px; --rl: 109px; --rx: max(24px, calc(50% - 350px));
      padding: max(40px, calc(env(safe-area-inset-top, 0px) + 16px)) var(--rx) 23px !important; }
    .full .rtop { gap: 16px; touch-action: none; }
    .rpage.full .rdev { justify-self: center; width: min(300px, 100%); height: 56px; border-radius: 28px; font-size: 17px; }
    .full .rdev .rtv { width: 18px; height: 18px; }

    .full .rclose svg { transform: rotate(-90deg); }
    .full .rlist { display: block; flex: none; align-self: center; width: min(528px, 100%); height: 0; overflow: hidden; overscroll-behavior: contain; scrollbar-width: none; }
    .full.lst .rlist { overflow-y: auto; }
    .rpage .rrow { position: relative; display: flex; align-items: center; gap: 16px; width: 100%; height: 56px; padding: 0 0 0 64px; border: 0; background: none; color: #fff; font: inherit; font-size: 19px; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .rpage .rrow + .rrow::before { content: ""; position: absolute; left: 64px; right: 0; top: 0; border-top: 0.5px solid rgba(255,255,255,0.18); }
    .rpage .rrow .ric { flex: none; width: 24px; height: 22px; display: grid; place-items: center; }
    .rpage .rrow .ric svg { width: 100%; height: 100%; }
    .rpage .rrow.on::after { content: ""; position: absolute; left: 26px; top: 50%; width: 17px; height: 17px; margin-top: -8.5px; background: #fff;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 8.6 6.3 12.2 13.5 4.2'/%3E%3C/svg%3E") center / contain no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 8.6 6.3 12.2 13.5 4.2'/%3E%3C/svg%3E") center / contain no-repeat; }
    .rpage .rrow:active { background: rgba(255,255,255,0.1); border-radius: 12px; }
    .full .rpad { margin-top: 52px; border-radius: 44px; }
    .full .rpad .rhint { display: none; }
    .full .rbtns { justify-content: center; gap: 46.5px; margin-top: 45px; padding: 0; }
    .full .rsk { bottom: 16px; } .full .rskb { left: 20px; } .full .rskf { right: 20px; }
    .full .rpad .rvol { position: absolute; inset: auto 0 16px; height: 44px; margin: 0; display: block; pointer-events: none; }
    .full .rpad .rvol button { position: absolute; top: 0; width: 44px; height: 44px; border-radius: 50%; background: none; color: rgba(255,255,255,0.85); pointer-events: auto; }
    .full .rpad .rvol button::before { display: none; }
    .full .rpad .rvol button:active { background: rgba(255,255,255,0.14); }
    .full .rpad .rvol button svg { width: 26px; height: 19px; }
    .full .rpad .rvdn { left: calc(35.3% - 22px); } .full .rpad .rvup { left: calc(64.7% - 22px); } .full .rpad .rmute { left: calc(50% - 22px); }
    .full .rpad .rmute.on { background: rgba(255,255,255,0.9); color: #1c1c1e; }
  `;
  const MD_NOTE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 3v11.6A3.5 3.5 0 1 0 11 18V8h6V3z'/%3E%3C/svg%3E";
  const MD_GAME = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 6h10a5 5 0 0 1 4.9 6l-.9 4.2A2.9 2.9 0 0 1 16 17.3L14.6 16H9.4L8 17.3a2.9 2.9 0 0 1-5-1.1L2.1 12A5 5 0 0 1 7 6m0 3v1.5H5.5V12H7v1.5h1.5V12H10v-1.5H8.5V9zm9.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2'/%3E%3C/svg%3E";
  // The full-screen player: the same popup, artwork left and the controls right over its blurred colors.
  const MF_EXPAND = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18.6005 18.6398'%3E%3Cpath d='M1.78806 6.17914L1.50628 1.5103L6.18125 1.79841L6.99079 1.79841C7.50872 1.79841 7.91491 1.4296 7.91491 0.907445C7.91491 0.385288 7.51294 0.00824052 6.99079 0.00824052L1.57471 0.00824052C0.578132 0.00824052 0 0.586372 0 1.58084L0 6.99903C0 7.50872 0.374937 7.90034 0.899205 7.90034C1.42136 7.90034 1.78806 7.52118 1.78806 6.99903ZM2.07426 0.961509C1.22259 0.161592 0.167922 1.25364 0.953269 2.08863L4.16597 5.4773L7.1582 8.49445C7.33225 8.67885 7.54771 8.75553 7.78598 8.75553C8.33919 8.75553 8.74728 8.39918 8.74728 7.84386C8.74728 7.587 8.66237 7.34873 8.47797 7.17468L5.46695 4.16366ZM16.8124 12.4689L17.0942 17.1274L12.4296 16.8496L11.6097 16.8496C11.0917 16.8496 10.6856 17.2184 10.6856 17.7406C10.6856 18.2627 11.0875 18.6398 11.6097 18.6398L17.0258 18.6398C18.0223 18.6398 18.6005 18.0616 18.6005 17.0672L18.6005 11.649C18.6005 11.1393 18.2255 10.7477 17.7013 10.7477C17.1895 10.7477 16.8124 11.1268 16.8124 11.649ZM16.5262 17.6865C17.3882 18.4864 18.4325 17.3944 17.6575 16.5573L14.4448 13.1707L11.4423 10.1432C11.2786 9.96915 11.0528 9.88212 10.8145 9.88212C10.2613 9.88212 9.85107 10.2488 9.85107 10.8041C9.85107 11.061 9.94845 11.2993 10.1225 11.4712L13.1335 14.4843Z'/%3E%3C/svg%3E";
  const FULLMED_CSS = `
    :host(.fullp) { display: block; position: absolute; inset: 0; color: #fff; }
    :host(.fullp) .wrap.med { position: absolute; inset: 0; height: auto !important; max-height: none !important; overflow: hidden; display: block; padding: 0 !important; background: #111; }
    :host(.fullp) .wrap.med > .hd, :host(.fullp) .wrap.med > .corner.gear:not(.rmc), :host(.fullp) .fexp { display: none !important; }
    :host(.fullp) .glow { display: block !important; position: absolute; inset: 0; height: auto !important; overflow: hidden; pointer-events: none; -webkit-mask-image: none !important; mask-image: none !important; }
    :host(.fullp) .glow i { position: absolute; background: var(--art) center / cover no-repeat; inset: -120px; filter: blur(80px) saturate(1.5) brightness(.62); opacity: 1; transform: scale(1.3); }
    :host(.fullp) .glow::after { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.18); }
    /* HomeView's player: artwork centered at its own shape, the title over its lower edge with the more-info dots, playback full width below; volume in a capsule top right. */
    :host(.fullp) .wrap.med > .slab { position: absolute; inset: 0; margin: 0 !important; padding: max(96px, calc(env(safe-area-inset-top, 0px) + 84px)) 6vw max(40px, calc(env(safe-area-inset-bottom, 0px) + 28px)) !important;
      border-radius: 0 !important; background: none !important; box-shadow: none !important; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 0; }
    :host(.fullp) .slab > .art { flex: none !important; width: auto !important; height: auto !important; max-width: none !important; min-height: 0 !important; display: block; overflow: visible; background: none !important; box-shadow: none !important; border-radius: 0; align-self: center; }
    :host(.fullp) .slab > .art img { display: block; width: min(62vw, 560px, calc((100vh - 400px) * var(--ar, 1))) !important; height: auto !important; max-width: none !important; max-height: none !important; object-fit: cover; border-radius: 18px !important; box-shadow: 0 30px 80px -24px rgba(0,0,0,0.7) !important; }
    @media (max-width: 768px) { :host(.fullp) .slab:has(.det > div:not(.sb)) > .art img { width: min(62vw, 560px, calc((100svh - 470px) * var(--ar, 1))) !important; } }
    :host(.fullp) .slab > .art.ph { width: min(40vw, 400px) !important; aspect-ratio: 1; border-radius: 18px; background: rgba(255,255,255,0.1) !important; display: grid; place-items: center; }
    :host(.fullp) .fcol { flex: none; width: min(860px, 84vw); display: flex; flex-direction: column; gap: 18px; margin-top: -84px; position: relative; z-index: 1; }
    :host(.fullp) .frow { display: flex; align-items: flex-end; gap: 16px; min-width: 0; }
    :host(.fullp) .frow > .trk { flex: 1; min-width: 0; gap: 2px; margin: 0 !important; text-shadow: 0 2px 18px rgba(0,0,0,0.45); }
    :host(.fullp) .fmore { flex: none; width: 36px; height: 36px; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; cursor: pointer; background: rgba(255,255,255,0.22); color: #fff; margin-bottom: 4px; -webkit-tap-highlight-color: transparent; }
    :host(.fullp) .fmore svg { width: 20px; height: 20px; display: block; }
    :host(.fullp) .fcol > .sc { font-size: 13px; }
    :host(.fullp) .fcol > .tp { padding: 0 !important; display: grid !important; grid-template-columns: 1fr repeat(3, auto) 1fr; column-gap: 72px; align-items: center; }
    :host(.fullp) .fcol > .tp > :first-child { justify-self: start; } :host(.fullp) .fcol > .tp > :last-child { justify-self: end; }
    :host(.fullp) .fcol > :is(.vb, .vs) { position: fixed; z-index: 6; right: max(28px, env(safe-area-inset-right, 0px)); top: max(24px, calc(env(safe-area-inset-top, 0px) + 8px)); height: 52px; width: 240px; box-sizing: border-box; padding: 0 16px; border-radius: 26px; display: flex; align-items: center; gap: 12px;
      background: rgba(255,255,255,0.14); -webkit-backdrop-filter: blur(20px) saturate(1.3); backdrop-filter: blur(20px) saturate(1.3); box-shadow: inset 0 0.5px 0 rgba(255,255,255,0.32); }
    :host(.fullp) .fcol > .vb { width: 140px; padding: 0 6px; gap: 0; justify-content: space-between; }
    :host(.fullp) .fcol > .vb button { flex: 1; height: 44px !important; border-radius: 22px !important; background: none !important; }
    :host(.fullp) .fpills { display: none; }
    :host(.fullp) .trk > b { font-size: 34px !important; font-weight: 700; }
    :host(.fullp) .trk > span { font-size: 22px !important; }
    :host(.fullp) .slab > .art.ph + .fcol, :host(.fullp) .slab:not(:has(> .art img)) > .fcol { margin-top: 28px; }
    :host(.fullp) .trk > b { font-size: 26px; line-height: 1.2; }
    :host(.fullp) .trk > span { font-size: 19px; }
    :host(.fullp) .bar { height: 6px; }
    :host(.fullp) .wrap.med .det.sess { display: grid; gap: 8px; margin-top: 22px; background: none !important; border-radius: 0 !important; padding: 0 !important; }
    :host(.fullp) .wrap.med .det.sess .sb { position: relative; display: block; height: 6px; min-height: 0; padding: 0; border-radius: 3px; background: rgba(255,255,255,0.28); overflow: hidden; }
    :host(.fullp) .wrap.med .det.sess .sb i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: #fff; }
    :host(.fullp) .wrap.med .det.sess .st { display: flex; justify-content: space-between; min-height: 0; padding: 0; font-size: 15px;
    }
    :host(.fullp) .wrap.med .det.sess .st span { font-size: 15px; color: rgba(255,255,255,0.6); }
    :host(.fullp) .wrap.med .det.sess .sb::before, :host(.fullp) .wrap.med .det.sess .st::before { display: none; }
    :host(.fullp) .wrap.med .det.sess .st { font-variant-numeric: tabular-nums; }
    :host(.fullp) .tp button { width: 64px; height: 64px; }
    :host(.fullp) .tp button svg { height: 26px; }
    :host(.fullp) .tp button.pp svg { height: 38px; }
    :host(.fullp) .tp button svg.g10 { height: 40px; width: 40px; }
    :host(.fullp) .vb button { height: 48px; border-radius: 24px; }
    /* iPhone: the Lock Screen player. Title and dots under the artwork, volume in the flow, and capsules at the bottom for where it plays. */
    @media (max-width: 768px) {
      :host(.fullp) .wrap.med > .slab { justify-content: flex-start; padding: max(118px, calc(env(safe-area-inset-top, 0px) + 100px)) 28px max(30px, calc(env(safe-area-inset-bottom, 0px) + 14px)) !important; }
      :host(.fullp) .slab > .art img { width: min(86vw, calc(42vh * var(--ar, 1))) !important; border-radius: 14px !important; }
      :host(.fullp) .fcol { width: 100%; margin-top: 28px; gap: 16px; }
      :host(.fullp) .frow > .trk { text-shadow: none; }
      :host(.fullp) .trk > b { font-size: 21px !important; font-weight: 600; } :host(.fullp) .trk > span { font-size: 17px !important; }
      :host(.fullp) .fmore { width: 38px; height: 38px; margin-bottom: 0; }
      :host(.fullp) .fmore svg { width: 22px; height: 22px; }
      :host(.fullp) .frow { align-items: center; }
      :host(.fullp) .fcol > :is(.vb, .vs) { position: static; width: 100%; height: auto; padding: 0; background: none; box-shadow: none; -webkit-backdrop-filter: none; backdrop-filter: none; }
      :host(.fullp) .fcol > .vb { gap: 10px; }
      :host(.fullp) .fcol > .vb button { height: 44px !important; border-radius: 22px !important; background: rgba(255,255,255,0.14) !important; }
      :host(.fullp) .fcol > .tp :is(.rmb, .apb, .rsp) { display: none !important; }
      :host(.fullp) .fcol > .tp { grid-template-columns: repeat(3, auto); justify-content: center; column-gap: 48px; }
      :host(.fullp) .fpills { display: flex; justify-content: center; gap: 10px; margin-top: 6px; }
      :host(.fullp) .fpills button { height: 44px; border: 0; padding: 0 18px; border-radius: 22px; display: inline-flex; align-items: center; gap: 9px; color: #fff; font: inherit; font-size: 16px; font-weight: 600; cursor: pointer;
        background: rgba(255,255,255,0.14); -webkit-backdrop-filter: blur(20px) saturate(1.3); backdrop-filter: blur(20px) saturate(1.3); box-shadow: inset 0 0.5px 0 rgba(255,255,255,0.32); -webkit-tap-highlight-color: transparent; }
      :host(.fullp) .fpills button:disabled { opacity: .45; }
      :host(.fullp) .fpills svg { height: 19px; width: auto; display: block; }
    }
    /* Measured from HomeView, in units of the artwork's height: title at 65%, bar at 90%, times under it, controls just below the artwork. */
    @media (min-width: 769px) {
      :host(.fullp) .wrap.med > .slab { --A: min(60vh, 640px, calc(60vw / var(--ar, 1))); --rad: calc(var(--A) * 0.05); padding-top: 0 !important; padding-bottom: calc(var(--A) * 0.12) !important; justify-content: center; }
      :host(.fullp) .slab:has(> .art img) > .fcol { position: absolute; left: 0; right: 0; top: calc(50% + var(--A) * 0.15); margin: 0 auto; }
      :host(.fullp) .slab > .art:not(.ph) { isolation: isolate; }
      :host(.fullp) .slab > .art img, :host(.fullp) .slab > .art .xf > img { border-radius: var(--rad) !important; }
      :host(.fullp) .slab > .art img { width: calc(var(--A) * var(--ar, 1)) !important; box-shadow: none !important;
        -webkit-mask-image: linear-gradient(#000 64%, transparent 80%); mask-image: linear-gradient(#000 64%, transparent 80%); }
      :host(.fullp) .slab > .art:not(.ph)::before { content: ""; position: absolute; inset: 3% 5% 7% 5%; z-index: -1; border-radius: var(--rad); box-shadow: 0 40px 70px -6px rgba(0,0,0,0.6), 0 22px 28px -2px rgba(0,0,0,0.32); pointer-events: none; }
      :host(.fullp) .fcol > :is(.vb, .vs) { position: static; align-self: center; width: min(560px, 100%); height: auto; margin-top: calc(var(--A) * 0.035); padding: 0; background: none; box-shadow: none; -webkit-backdrop-filter: none; backdrop-filter: none; }
      :host(.fullp) .fcol > .vb { width: min(360px, 100%); gap: 12px; }
      :host(.fullp) .fcol > .vb button { height: 44px !important; border-radius: 22px !important; background: rgba(255,255,255,0.14) !important; }
      :host(.fullp) .slab > .art:has(> img[style*="hidden"])::before { visibility: hidden; }
      :host(.fullp) .frow > .trk > :is(b, span) { padding: 14px 18px; margin: -14px -18px; }
      :host(.fullp) .frow > .trk { text-shadow: 0 1px 14px rgba(0,0,0,0.3); }
      :host(.fullp) .slab > .art:not(.ph) { width: max-content !important; align-self: center !important; }
      :host(.fullp) .fcol { width: min(1000px, 78vw); gap: 0; margin-top: calc(var(--A) * -0.35); }
      :host(.fullp) .frow { align-items: center; }
      :host(.fullp) .trk > b { font-size: calc(var(--A) * 0.088) !important; line-height: 1.15; letter-spacing: -0.01em; }
      :host(.fullp) .trk > span { font-size: calc(var(--A) * 0.064) !important; line-height: 1.2; color: rgba(235,235,245,0.7); }
      :host(.fullp) .fmore { width: calc(var(--A) * 0.075); height: calc(var(--A) * 0.075); margin: 0; }
      :host(.fullp) .fmore svg { width: 55%; height: 55%; }
      :host(.fullp) .fcol > .sc { display: grid; grid-template-columns: 1fr 1fr; row-gap: calc(var(--A) * 0.03); margin-top: calc(var(--A) * 0.07); font-size: calc(var(--A) * 0.04); }
      :host(.fullp) .fcol > .sc > .bar { grid-column: 1 / -1; grid-row: 1; height: calc(var(--A) * 0.016); border-radius: 99px; }
      :host(.fullp) .fcol > .sc > span { grid-row: 2; min-width: 0; } :host(.fullp) .fcol > .sc > span:last-child { text-align: right; }
      :host(.fullp) .wrap.med > .slab:has(.det > div:not(.sb)) { --A: min(50vh, 540px, calc(60vw / var(--ar, 1))); }
      :host(.fullp) .wrap.med .fcol > .det:not(.sess) { margin-top: calc(var(--A) * 0.03); border-radius: calc(var(--A) * 0.032); padding: 0 calc(var(--A) * 0.03); }
      :host(.fullp) .wrap.med .fcol > .det:not(.sess) > div { min-height: max(40px, calc(var(--A) * 0.084)); font-size: max(15px, calc(var(--A) * 0.034)); }
      :host(.fullp) .fcol > .tp { margin-top: calc(var(--A) * 0.03); column-gap: calc(var(--A) * 0.2); }
      :host(.fullp) .fcol > .tp > * { grid-row: 1; }
      :host(.fullp) .fcol > .tp > :is(.prev, .back10) { grid-column: 2; } :host(.fullp) .fcol > .tp > .pp { grid-column: 3; } :host(.fullp) .fcol > .tp > :is(.next, .fwd10) { grid-column: 4; }
      :host(.fullp) .fcol > .tp > :last-child:not(.prev, .back10, .pp, .next, .fwd10) { grid-column: 5; }
      :host(.fullp) .fcol > .tp button { width: calc(var(--A) * 0.13); height: calc(var(--A) * 0.13); }
      :host(.fullp) .fcol > .tp button svg { height: calc(var(--A) * 0.06); }
      :host(.fullp) .fcol > .tp button.pp svg { height: calc(var(--A) * 0.11); }
      :host(.fullp) .fcol > .tp :is(.rmb, .apb) svg { height: calc(var(--A) * 0.065); }
      :host(.fullp) .slab > .art .fz { position: absolute; pointer-events: none; }
      :host(.fullp) .slab > .art .fz canvas { display: block; width: 100%; height: 100%; }
      :host(.fullp) .slab > .art img[style*="hidden"] ~ .fz { visibility: hidden; }
      :host(.fullp) .wrap.med > .rpage { padding: max(40px, calc(env(safe-area-inset-top, 0px) + 16px)) max(24px, calc(50% - 250px)) max(32px, calc(env(safe-area-inset-bottom, 0px) + 20px)) !important; }
      :host(.fullp) .wrap.med > .rpage .rpad { margin-top: 40px; }
      :host(.fullp) .wrap.med > .rpage .rring { height: min(320px, calc(100% - 8px)); }
      :host(.fullp) .wrap.med > .rpage .rbtns { margin-top: 36px; }
    }
    :host(.fullp) .slab > .art .xf { position: absolute; inset: 0; pointer-events: none; }
    :host(.fullp) .slab > .art .xf > img { position: absolute; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover; box-shadow: none !important; }
    @media (max-width: 768px) {
      :host(.fullp) .slab > .art .fz { display: none; }
      :host(.fullp) .fcol > .sc { display: grid; grid-template-columns: 1fr 1fr; row-gap: 7px; }
      :host(.fullp) .fcol > .sc > .bar { grid-column: 1 / -1; grid-row: 1; } :host(.fullp) .fcol > .sc > span { grid-row: 2; } :host(.fullp) .fcol > .sc > span:last-child { text-align: right; }
    }
  `;
  const MEDIA_CSS = `
    .med .slab { display: flex; flex-direction: column; gap: 14px; align-self: stretch; box-sizing: border-box; margin: 22px 0 0; padding: 20px; border-radius: 30px; background: rgba(var(--hv-pd, 0,0,0),0.3); }
    @media (max-width: 768px) { .med .slab { margin: 26px var(--slab-x, 11px) 0; border-radius: 36px; } .wrap.med:has(.slab) { padding-bottom: calc(max(20px, var(--sab, 0px)) + 72px); } }
    .med .slab.bare { background: none; padding: 0; gap: 0; }
    @media (min-width: 769px) { .wrap.med { padding-bottom: 60px; } }
    .art { align-self: center; position: relative; flex: none; max-width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px -12px rgba(0,0,0,0.7); }
    .art img { display: block; height: 220px; width: auto; max-width: 100%; object-fit: cover; }
    @media (max-width: 767px) { .med .art img { height: var(--med-art, min(296px, 36svh)); } .med .art.ph { width: var(--med-art, min(296px, 36svh)); height: var(--med-art, min(296px, 36svh)); } }
    .art.ph { width: 200px; height: 200px; display: grid; place-items: center; background: rgba(var(--hv-pk, 255,255,255),0.08); box-shadow: none; }
    .art.ph i { width: 56px; height: 56px; opacity: .4; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .trk { display: grid; gap: 1px; min-width: 0; }
    .trk > b { font-size: 17px; font-weight: 600; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .trk > span { font-size: 14.5px; color: rgba(var(--hv-pk2, 235,235,245),0.62); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .trk { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    .trk .mqt { display: inline-block; white-space: nowrap; }
    .trk .mqs { text-overflow: clip; animation: hmq-fade var(--mqd) linear var(--mqdl) infinite; }
    .trk .mqs > .mqt { animation: hmq var(--mqd) linear var(--mqdl) infinite; }
    @keyframes hmq { 0%, 12% { transform: translateX(0); } 100% { transform: translateX(calc(-1 * var(--mq, 0px))); } }
    @keyframes hmq-fade {
      0%, 12% { -webkit-mask-image: linear-gradient(90deg, #000, #000 calc(100% - 18px), transparent); mask-image: linear-gradient(90deg, #000, #000 calc(100% - 18px), transparent); }
      24%, 100% { -webkit-mask-image: linear-gradient(90deg, transparent, #000 7px, #000 calc(100% - 18px), transparent); mask-image: linear-gradient(90deg, transparent, #000 7px, #000 calc(100% - 18px), transparent); }
    }
    @media (prefers-reduced-motion: reduce) { .trk .mqs, .trk .mqs > .mqt { animation: none; } }
    .trk.quiet b { color: rgba(var(--hv-pk2, 235,235,245),0.6); }
    .sc { display: flex; align-items: center; gap: 10px; font-size: 12px; color: rgba(var(--hv-pk2, 235,235,245),0.6); font-variant-numeric: tabular-nums; }
    .sc span { flex: none; min-width: 32px; } .sc span:last-child { text-align: right; }
    .bar { position: relative; flex: 1; height: 5px; border-radius: 3px; background: rgba(var(--hv-pk, 255,255,255),0.2); overflow: hidden; }
    .bar.live { touch-action: none; cursor: pointer; }
    .bar > i { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(var(--hv-pk, 255,255,255),0.9); border-radius: inherit; }
    .tp { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; }
    .tp button { border: 0; background: none; color: var(--hv-pi, #fff); padding: 4px; cursor: pointer; display: grid; place-items: center; -webkit-tap-highlight-color: transparent; transition: opacity .2s ease; }
    .tp button { width: 52px; height: 52px; }
    .tp button svg { display: block; width: auto; height: 20px; }
    .tp button.pp svg { height: 30px; }
    .tp button svg.g10 { height: 32px; width: 32px; }
    .tp button:disabled { opacity: .3; cursor: default; }
    @media (hover: hover) { .tp button:not(:disabled):hover { opacity: .75; } }
    .vb { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .vb button { height: 40px; border: 0; border-radius: 20px; background: rgba(var(--hv-pk, 255,255,255),0.12); color: var(--hv-pi, #fff); display: grid; place-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .vb svg { width: 24px; height: 17px; }
    @media (hover: hover) { .vb button:hover { background: rgba(var(--hv-pk, 255,255,255),0.18); } }
    .vb button:active { background: rgba(var(--hv-pk, 255,255,255),0.24); }
    .vs { display: flex; align-items: center; gap: 10px; color: rgba(var(--hv-pk, 255,255,255),0.7); }
    .vs svg { width: auto; height: 15px; flex: none; }
    .vs svg:last-child { height: 16px; }
    .vs .bar { height: 8px; border-radius: 4px; touch-action: none; cursor: pointer; }
    .pw { align-self: center; width: 112px; height: 112px; border-radius: 50%; border: 0; color: var(--hv-pi, #fff); display: grid; place-items: center; cursor: pointer; flex: none; margin-top: 6px;
      background: rgba(var(--hv-pd, 0,0,0),0.3); transition: background-color .3s ease, color .3s ease; -webkit-tap-highlight-color: transparent; }
    .pw.on { background: #fff; color: #1c1c1e; }
    .pw svg { width: 40px; height: 40px; }
    @media (max-width: 767px) { .med .slab.bare .pw { margin-top: 60px; } }
    .wheel { --row: 32px; position: relative; align-self: stretch; height: calc(var(--row) * 7); margin-top: 8px; perspective: 360px; overflow-y: auto; scroll-snap-type: y mandatory; overscroll-behavior: contain; scrollbar-width: none; touch-action: pan-y;
      -webkit-mask: linear-gradient(rgba(0,0,0,0.3), #000 40%, #000 60%, rgba(0,0,0,0.3)); mask: linear-gradient(rgba(0,0,0,0.3), #000 40%, #000 60%, rgba(0,0,0,0.3)); }
    .wheel::-webkit-scrollbar { display: none; }
    .wheel .pad { height: calc(var(--row) * 3); }
    .wheel button { display: block; margin: 0 auto; width: 184px; height: var(--row); border: 0; background: none; color: rgba(var(--hv-pk2, 235,235,245),0.45); font: inherit; font-size: 16px; font-weight: 600; padding: 0 14px;
      border-radius: 16px; transform-origin: 50% 50%; scroll-snap-align: center; cursor: pointer; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; transition: color .2s ease, background-color .2s ease; -webkit-tap-highlight-color: transparent; }
    .wheel button.on { color: var(--hv-pi, #fff); background: rgba(var(--hv-pk, 255,255,255),0.12); }
    /* The Mac's TV popup: an 88pt power button that dims what is behind it a fifth, and a tighter wheel (24pt rows, a 140pt pill). */
    @media (min-width: 769px) {
      .med .slab.bare .pw { width: 88px; height: 88px; margin-top: 38px; background: rgba(var(--hv-pd, 0,0,0),0.22); }
      .med .slab.bare .pw.on { background: #fff; }
      .med .slab.bare .pw svg { width: 34px; height: 34px; }
      .med .slab.bare .wheel { --row: 24px; margin: 6px 0 52px; }
      .med .slab.bare .wheel button { width: 140px; font-size: 14px; border-radius: 12px; }
      .med .slab.bare .wheel button.on { background: rgba(var(--hv-pk, 255,255,255),0.15); }
    }
    .none { font-size: 14px; color: rgba(var(--hv-pk2, 235,235,245),0.6); text-align: center; padding: 8px 0; }
    .glow { display: none; }
    .trk .dev { display: none; }
    /* On the Mac and iPad the popup is already glass, so the artwork washes its top instead of sitting in a second panel. */
    @media (min-width: 769px) {
      .wrap.med.wash { padding-top: 40px; }
      .wrap.med.wash .slab { position: relative; z-index: 1; background: none; padding: 0 4px; margin: 0; border-radius: 0; gap: 13px; }
      .wrap.med.wash .glow { display: block; position: absolute; left: 0; right: 0; top: 0; height: var(--hv-med-gh, 320px); overflow: hidden; pointer-events: none;
        -webkit-mask-image: var(--hv-med-mask, linear-gradient(#000 40%, transparent)); mask-image: var(--hv-med-mask, linear-gradient(#000 40%, transparent)); }
      .glow i { position: absolute; inset: -40px; background: var(--art) center / cover no-repeat; filter: blur(34px) saturate(1.4); opacity: var(--hv-glow-op, .8); transform: scale(1.15); }
      .wrap.med.wash .art img { height: 200px; }
      .wrap.med.wash .trk .dev { display: inline; }
      .wrap.med.wash .det { background: rgba(var(--hv-pk, 255,255,255),0.07); border-radius: 14px; padding: 0 14px; }
    }
    .det { display: grid; }
    .wrap.med.solid { background: linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.3) 100%), rgb(var(--hv-med-c)) !important; color: #fff;
      --hv-pi: #fff; --hv-pk: 255,255,255; --hv-pk2: 235,235,245; --hv-pd: 0,0,0; --hv-btn-c: rgba(255,255,255,0.2); --primary-text-color: #fff; --secondary-text-color: rgba(255,255,255,0.72); }
    .wrap.med.solid .glow { display: none !important; }
    .wrap.med.solid > .slab { background: none !important; box-shadow: none !important; }
    .wrap.med.solid .det { background: rgba(255,255,255,0.1); }
    .gs { display: flex; gap: 16px; align-items: flex-start; }
    .gsart { flex: none; width: 42%; aspect-ratio: 2 / 3; border-radius: 12px; background: rgba(var(--hv-pk, 255,255,255),0.08) center / cover no-repeat; box-shadow: 0 18px 36px -16px rgba(0,0,0,0.8); }
    .gsx { min-width: 0; display: grid; gap: 2px; padding-top: 4px; }
    .gst { font-size: 20px; font-weight: 700; line-height: 1.15; }
    .gsnow { font-size: 14px; color: rgba(var(--hv-pk, 255,255,255),0.72); }
    .gslab { margin-top: 12px; font-size: 13px; color: rgba(var(--hv-pk, 255,255,255),0.55); }
    .gstot { font-size: 26px; font-weight: 700; letter-spacing: -0.01em; }
    .gach[hidden], .gslab[hidden] { display: none; }
    .gacht { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .gacht span:last-child { color: rgba(var(--hv-pk, 255,255,255),0.7); font-weight: 500; }
    .gbar { height: 6px; border-radius: 3px; background: rgba(var(--hv-pk, 255,255,255),0.18); overflow: hidden; }
    .gbar i { display: block; height: 100%; border-radius: 3px; background: #fff; transition: width .5s ease; }
    .gsav { width: 20px; height: 20px; border-radius: 50%; vertical-align: -5px; margin-right: 7px; }
    .det div { display: flex; justify-content: space-between; gap: 12px; min-height: 36px; align-items: center; font-size: 14px; position: relative; }
    .det div + div::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: .5px; background: rgba(var(--hv-pk, 255,255,255),0.12); }
    .det span { color: rgba(var(--hv-pk2, 235,235,245),0.6); flex: none; }
    .det b { font-weight: 500; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `;
  class HemmaMediaPanel extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    setConfig(c) { this._config = c || {}; this._sig = null; }
    getCardSize() { return 8; }
    set hass(h) { this._hass = h; this._render(); }
    hemmaAnchor() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab'); return el ? { el, card: true } : null; }
    // The tile grows into the player card on every screen, not only on a phone.
    hemmaHero() { const el = this.shadowRoot && this.shadowRoot.querySelector('.slab:not(.bare)'); return el && el.getBoundingClientRect().width ? { el, card: true } : null; }
    connectedCallback() { clearInterval(this._tick); this._tick = setInterval(() => this._progress(), 1000); }
    disconnectedCallback() { clearInterval(this._tick); if (this._rlayer) { this._rlayer.remove(); this._rlayer = null; } if (this._inked) { this._inked.style.removeProperty('background-color'); this._inked = null; } if (this._scroller) { this._scroller.style.overflowY = ''; this._scroller = null; } }
    // The player is one card that fits the screen: it never scrolls, the art gives way instead, and a drag up only stretches it.
    _fit() {
      if (!window.matchMedia('(max-width: 767px)').matches) return;
      const wrap = this.shadowRoot.querySelector('.wrap');
      if (!wrap) return;
      let n = this, sc = null;
      for (let i = 0; n && i < 12 && !sc; i++) {
        n = n.parentNode && n.parentNode.host && !n.parentElement ? n.parentNode.host : n.parentElement || (n.parentNode && n.parentNode.host);
        if (n && n.nodeType === 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) sc = n;
      }
      if (sc) { this._scroller = sc; sc.style.overflowY = 'hidden'; sc.scrollTop = 0; }
      const art = wrap.querySelector('.art img, .art.ph');
      wrap.style.removeProperty('--med-art');
      if (art) {
        const slab = wrap.querySelector('.slab');
        const over = Math.max(sc ? sc.scrollHeight - sc.clientHeight : 0, wrap.scrollHeight - wrap.clientHeight, slab ? slab.scrollHeight - slab.clientHeight : 0);
        if (over > 0) wrap.style.setProperty('--med-art', Math.max(100, art.getBoundingClientRect().height - over - 6) + 'px');
      }
      if (wrap._rub) return;
      wrap._rub = true;
      let y0 = null, pull = 0, live = false;
      const parts = () => [wrap.querySelector('.slab'), wrap.querySelector('.hd')].filter(Boolean);
      const put = (v) => { const [slab, hd] = parts(); if (slab) slab.style.transform = v ? `translateY(${v}px)` : ''; if (hd) hd.style.transform = v ? `translateY(${v * 0.55}px)` : ''; };
      wrap.addEventListener('touchstart', (e) => { if (e.composedPath().some((n) => n.classList && n.classList.contains('gmenu'))) { y0 = null; return; } y0 = e.touches[0].clientY; live = false; pull = 0; parts().forEach((el) => el.getAnimations().forEach((a) => a.cancel())); }, { passive: true });
      wrap.addEventListener('touchmove', (e) => {
        if (y0 == null) return;
        const dy = e.touches[0].clientY - y0;
        if (!live && dy > -6) return;
        live = true;
        e.preventDefault();
        e.stopPropagation();
        pull = -90 * (1 - Math.exp(Math.min(0, dy) / 220));
        put(pull);
      }, { passive: false });
      const end = () => {
        if (y0 == null) return;
        y0 = null;
        if (!live) return;
        live = false;
        const from = pull;
        put(0);
        const [slab, hd] = parts();
        if (slab) slab.animate([{ transform: `translateY(${from}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
        if (hd) hd.animate([{ transform: `translateY(${from * 0.55}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      };
      wrap.addEventListener('touchend', end, { passive: true });
      wrap.addEventListener('touchcancel', end, { passive: true });
    }
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
    // A TV switched off reports no inputs, so the last list seen is kept, or read from the TV's history.
    _sourceList() {
      const id = this._config.entity, key = 'hemma_srcs:' + id, live = ((this._st() || {}).attributes || {}).source_list;
      if (Array.isArray(live) && live.length) {
        try { localStorage.setItem(key, JSON.stringify(live)); } catch (e) {}
        return live;
      }
      try { const kept = JSON.parse(localStorage.getItem(key) || 'null'); if (Array.isArray(kept) && kept.length) return kept; } catch (e) {}
      if (!this._srcLook && this._hass && this._hass.callWS) {
        this._srcLook = true;
        this._hass.callWS({ type: 'history/history_during_period', start_time: new Date(Date.now() - 30 * 864e5).toISOString(), entity_ids: [id], minimal_response: false, no_attributes: false, significant_changes_only: false })
          .then((r) => {
            const rows = (r && r[id]) || [];
            for (let i = rows.length - 1; i >= 0; i--) {
              const l = rows[i].a && rows[i].a.source_list;
              if (Array.isArray(l) && l.length) { try { localStorage.setItem(key, JSON.stringify(l)); } catch (e) {} this._render(); return; }
            }
          }).catch(() => {});
      }
      return [];
    }
    _sources() {
      const all = [...new Set(this._sourceList())].map(String);
      const pick = Array.isArray(this._config.sources) ? this._config.sources.map(String).filter((x) => all.includes(x)) : [];
      return pick.length ? pick : all.length ? all : (Array.isArray(this._config.sources) ? this._config.sources.map(String) : []);
    }
    // A Steam session, with the game's id to fetch its art by.
    _steam() {
      const src = this._config.src || {}, st = this._hass && this._hass.states['sensor.steam'];
      if (this._config.kind !== 'activity' || !st) return null;
      if (!(src.key === 'steam' || /steam/i.test(String(src.source || '') + ' ' + String(src.entity || '')))) return null;
      return st.attributes.game_id ? st : null;
    }
    // The remote Home Assistant has for this player: on its device, or named as it is.
    // The room the player is in, which names the player popup.
    _room() {
      const h = this._hass, reg = (h.entities || {})[this._config.entity] || {}, dv = reg.device_id && (h.devices || {})[reg.device_id];
      const ar = (h.areas || {})[reg.area_id || (dv && dv.area_id)];
      return ar ? ar.name : '';
    }
    // Players this one can share its sound with: same integration, each able to group (media_player GROUPING).
    _groupable() {
      const h = this._hass, me = this._config.entity, ents = h.entities || {}, plat = (ents[me] || {}).platform, S = h.states;
      if (!S[me] || !(Number(S[me].attributes.supported_features) & 524288)) return [];
      return Object.keys(S).filter((id) => id.indexOf('media_player.') === 0 && S[id].state !== 'unavailable' && (Number(S[id].attributes.supported_features) & 524288) && (ents[id] || {}).platform === plat);
    }
        _rmDev(id) {
      const h = this._hass, reg = (h.entities || {})[id] || {}, dv = reg.device_id && (h.devices || {})[reg.device_id], x = h.states[id], a = (x && x.attributes) || {};
      const area = (h.areas || {})[reg.area_id || (dv && dv.area_id)], fn = String(a.friendly_name || id);
      const pod = /homepod/i.test((dv && dv.model) || '') || /homepod/i.test(fn);
      const atv = reg.platform === 'apple_tv' && !pod;
      return { name: (atv && area && area.name) || fn, icon: atv ? RM_I.atv : RM_I.tv, pod };
    }
    _remoteFor(mp) {
      const h = this._hass, ents = h.entities || {}, dev = (ents[mp] || {}).device_id, S = h.states;
      const same = Object.keys(S).filter((id) => id.indexOf('remote.') === 0 && S[id].state !== 'unavailable' && REMOTE_KEYS[(ents[id] || {}).platform]);
      return (dev && same.find((id) => (ents[id] || {}).device_id === dev)) || same.find((id) => id === 'remote.' + String(mp).split('.')[1]) || null;
    }
    _tv() { const s = this._st(), a = (s && s.attributes) || {}; return a.device_class === 'tv' || /(^|_)(tv|apple_tv|shield)/.test(this._config.entity) || (a.source_list || []).length >= 3; }
    _mode(s) {
      if (this._config.kind === 'plex') return s && ['playing', 'paused', 'buffering'].includes(s.state) ? 'plex' : 'gone';
      if (this._config.kind === 'activity') return 'activity';
      if (!s || s.state === 'unavailable' || s.state === 'unknown') return 'gone';
      const a = s.attributes;
      if (['playing', 'paused'].includes(s.state) && (a.media_title || a.media_artist || a.entity_picture || a.app_name)) return 'media';
      // An idle Apple TV shows as an empty player; a TV keeps its inputs.
      const atv = ((this._hass.entities || {})[this._config.entity] || {}).platform === 'apple_tv';
      return this._tv() && !atv ? 'tv' : 'quiet';
    }
    _render() {
      const s = this._st();
      if (!this._config || !this._hass) return;
      const mode = this._mode(s), a = (s && s.attributes) || {};
      const sig = [mode, a.media_content_type === 'game', Number(a.supported_features), (a.source_list || []).length > 1, mode === 'tv' || (mode === 'quiet' || mode === 'media') ? this._sources().length > 1 : '', mode === 'tv' ? this._sources().join('|') : '', (this._config.sources || []).join('|'), !!a.media_duration, Number.isFinite(Number(a.volume_level)) && a.volume_level != null].join('#');
      if (sig !== this._sig) {
        const was = this.shadowRoot.querySelector('.wrap.rem');
        this._sig = sig; this._build(mode);
        const lp = this._rlayer && this._rlayer.shadowRoot.querySelector('.rpage'), np = this.shadowRoot.querySelector('.rpage');
        if (lp && np) { np.classList.add('full'); this._fullVol(np, true); lp.replaceWith(np); }
        if (was) { const w = this.shadowRoot.querySelector('.wrap'); if (w && w.querySelector('.rpage')) w.classList.add('rem'); }
      }
      this._paint();
      this._skipGlyphs(this.shadowRoot, this._config.entity, [['.back10', 'b10', 'b10m'], ['.fwd10', 'f10', 'f10m']]);
      this._paintRemote();
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
      // An Apple TV launches only apps listed since it last connected, so a remembered list would offer apps it can't open.
      const live = ((this._st() || {}).attributes || {}).source_list, atv = ((this._hass.entities || {})[this._config.entity] || {}).platform === 'apple_tv';
      // Spotify's sources are its Connect devices, so choosing one moves the music there: a speaker, not an app.
      const conn = ((this._hass.entities || {})[this._config.entity] || {}).platform === 'spotify';
      const rm = this._remoteFor(this._config.entity), spk = this._groupable().length > 1, apps = !spk && f(MF.SOURCE) && (atv ? Array.isArray(live) && live.length > 1 : this._sources().length > 1);
      const L = rm ? `<button type="button" class="rmb" data-notip>${RM_I.remote}</button>` : '',
        R = spk ? `<button type="button" class="apb spb" data-notip>${RM_I.air}</button>` : apps ? `<button type="button" class="apb${conn ? ' dev' : ''}" data-notip>${conn ? RM_I.air : RM_I.apps}</button>`
          : rm && atv && f(MF.SOURCE) ? `<button type="button" class="apb" data-notip disabled>${RM_I.apps}</button>` : '';
      const l = L || (R ? '<span class="rsp"></span>' : ''), r = R || (L ? '<span class="rsp"></span>' : '');
      // Playback a player can't take from Home Assistant isn't offered: only the remote, apps or speakers stay.
      if (!(f(MF.PAUSE) || f(MF.PLAY) || f(MF.PREV) || f(MF.NEXT) || f(MF.SEEK))) return L || R ? `<div class="tp">${l}<span class="rsp"></span>${r}</div>` : '';
      if (this._video()) {
        return `<div class="tp">${l}<button type="button" class="back10" aria-label="${esc(T('media.back_10', 'Back 10 seconds'))}">${MD_I.b10}</button>`
          + `<button type="button" class="pp"></button><button type="button" class="fwd10" aria-label="${esc(T('media.forward_10', 'Forward 10 seconds'))}">${MD_I.f10}</button>${r}</div>`;
      }
      return `<div class="tp">${l}<button type="button" class="prev" aria-label="${esc(T('media.previous', 'Previous'))}"${f(MF.PREV) ? '' : ' disabled'}>${MD_I.prev}</button>`
        + `<button type="button" class="pp"></button><button type="button" class="next" aria-label="${esc(T('media.next', 'Next'))}"${f(MF.NEXT) ? '' : ' disabled'}>${MD_I.next}</button>${r}</div>`;
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
      } else if (a.media_content_type === 'game') {
        body = `<div class="art cover"></div><div class="trk"><b></b><span></span></div><div class="det"></div>`;
      } else {
        body = `<div class="art cover"></div><div class="trk"><b></b><span></span></div>`
          + `<div class="sc"><span class="t0"></span><div class="bar seek${f(MF.SEEK) && a.media_duration ? ' live' : ''}"><i></i></div><span class="t1"></span></div>`
          + this._transport()
          + (level ? `<div class="vs">${MD_I.vlo}<div class="bar level" role="slider" aria-label="${esc(T('media.volume', 'Volume'))}"><i></i></div>${MD_I.vhi}</div>`
            : step ? `<div class="vb"><button type="button" class="vdn" aria-label="${esc(T('media.volume_down', 'Volume down'))}">${RM_I.vdn}</button><button type="button" class="vup" aria-label="${esc(T('media.volume_up', 'Volume up'))}">${RM_I.vup}</button></div>` : '');
      }
      const hero = mode === 'media' || mode === 'plex' || mode === 'activity';
      const rm = mode === 'plex' || mode === 'activity' || mode === 'gone' ? null : this._remoteFor(this._config.entity);
      this._rid = rm;
      this.classList.toggle('fullp', !!this._config.full);
      root.innerHTML = `<style>${SHEET_CSS}${LIST_CSS}${SLAB_CSS}${MEDIA_CSS}${BIG_CSS}${RM_CSS}${CAPS_CSS}${FULLMED_CSS}</style><div class="wrap multi lst med${hero ? ' wash' : ''}">`
        + `${hero ? '<div class="glow"><i></i></div>' : ''}<div class="hd"><b></b><span></span></div><div class="slab${bare ? ' bare' : ''}">${body}</div>`
        + (rm && mode === 'tv' ? `<button type="button" class="corner gear rmc" aria-label="${esc(T('media.remote', 'Remote'))}">${RM_I.remote}</button>` : '')
        + (!this._config.full && hero && mode !== 'activity' && window.hemmaMediaFull ? `<button type="button" class="corner open fexp" data-notip aria-label="${esc(T('media.full_screen', 'Full screen'))}"><i style="--i:url(&quot;${MF_EXPAND}&quot;)"></i></button>` : '')
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button>`
        + (rm ? this._remotePage() : '') + `</div>`;
      if (this._config.full) {
        const slab = root.querySelector('.slab'), col = document.createElement('div');
        col.className = 'fcol';
        [...slab.children].forEach((n) => { if (!n.classList.contains('art')) col.appendChild(n); });
        slab.appendChild(col);
        const trk = col.querySelector('.trk');
        if (trk) {
          const row = document.createElement('div');
          row.className = 'frow';
          trk.replaceWith(row);
          row.appendChild(trk);
          row.insertAdjacentHTML('beforeend', `<button type="button" class="fmore" data-notip aria-label="${esc(T('media.more_info', 'More info'))}"><svg viewBox="0 0 20 20" fill="#fff"><circle cx="4.5" cy="10" r="1.8"/><circle cx="10" cy="10" r="1.8"/><circle cx="15.5" cy="10" r="1.8"/></svg></button>`);
          row.querySelector('.fmore').onclick = (e) => { e.stopPropagation(); if (window.hemmaPopup) window.hemmaPopup.moreInfo(this._config.entity); };
        }
        // On the phone the transport's side buttons become capsules at the bottom, each pressing the button it stands for.
        const tp = col.querySelector('.tp'), pills = [];
        if (tp) {
          const spb = tp.querySelector('.spb'), apb = tp.querySelector('.apb:not(.spb)'), rmb = tp.querySelector('.rmb');
          if (spb) pills.push([spb, RM_I.air, T('media.speakers', 'Speakers')]);
          if (rmb) pills.push([rmb, RM_I.remote, T('media.remote', 'Remote')]);
          if (apb) pills.push(apb.classList.contains('dev') ? [apb, RM_I.air, T('media.speakers', 'Speakers')] : [apb, RM_I.apps, T('media.apps', 'Apps')]);
        }
        if (pills.length) {
          const box = document.createElement('div');
          box.className = 'fpills';
          pills.forEach(([src, ic, label]) => {
            const b = document.createElement('button');
            b.type = 'button'; b.innerHTML = ic + `<span>${esc(label)}</span>`; b.disabled = !!src.disabled;
            b.onclick = (e) => { e.stopPropagation(); this._anchor = b; src.click(); this._anchor = null; };
            box.appendChild(b);
          });
          col.appendChild(box);
        }
        // The artwork's own proportions decide its size.
        root.querySelector('.wrap').addEventListener('load', (e) => { const im = e.target; if (im.tagName === 'IMG' && im.naturalHeight && im.closest('.art')) { const ar = (im.naturalWidth / im.naturalHeight).toFixed(4); im.closest('.art').style.setProperty('--ar', ar); const sl = im.closest('.slab'); if (sl) sl.style.setProperty('--ar', ar); } }, true);
      }
      this._bind(root);
      root.querySelector('.wrap').addEventListener('load', () => requestAnimationFrame(() => this._fit()), true);
      requestAnimationFrame(() => this._fit());
    }
    _remotePage() {
      return `<div class="rpage${document.documentElement.classList.contains('hemma-hv') ? ' hv' : ''}" data-hemma-nodismiss><div class="rtop"><button type="button" class="rcb rclose gl" aria-label="${esc(T('ui.back', 'Back'))}">${RM_I.chev}</button>`
        + `<button type="button" class="rdev gl" data-notip><span class="rtv">${RM_I.atv}</span><b></b><em><svg viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1.6 1.4 6.6 6.5l-5 5.1"/></svg></em></button><button type="button" class="rcb rpow gl" aria-label="${esc(T('media.power', 'Power'))}">${MD_I.power}</button></div>`
        + `<div class="rlist"></div><div class="rpad" tabindex="0" aria-label="${esc(T('media.remote', 'Remote'))}"><span class="rglow"></span><span class="rhint">${esc(T('media.remote_hint', 'Swipe to move · tap to select'))}</span>`
        + `<span class="rring"><i class="rq"></i>${['au', 'ar', 'ad', 'al'].map((c) => `<b class="ra ${c}"><svg viewBox="0 0 16 16"><path d="M3 10.5 8 5.5l5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></b>`).join('')}<span class="rok gl"></span></span>`
        + `<button type="button" class="rsk rskb" data-notip aria-label="${esc(T('media.back_10', 'Back 10 seconds'))}">${MD_I.b10n}</button><button type="button" class="rsk rskf" data-notip aria-label="${esc(T('media.forward_10', 'Forward 10 seconds'))}">${MD_I.f10n}</button></div>`
        + `<div class="rvol"></div>`
        + `<div class="rbtns"><button type="button" class="rsb rpp gl" aria-label="${esc(T('media.play', 'Play'))}">${RM_I.pp}</button>`
        + `<button type="button" class="rlb rbk gl" aria-label="${esc(T('ui.back', 'Back'))}">${RM_I.back}</button>`
        + `<button type="button" class="rsb rhome gl" aria-label="${esc(T('media.home', 'Home'))}">${RM_I.tv}</button></div></div>`;
    }
    // The remote page: a pad that moves by swipe and selects by tap, sending to the player's remote in Home Assistant.
    _bindRemote(root) {
      const page = root.querySelector('.rpage');
      if (!page) return;
      const wrap = root.querySelector('.wrap');
      this._rmp = this._rmp || this._config.entity;
      const players = () => Object.keys(this._hass.states).filter((id) => id.indexOf('media_player.') === 0 && this._remoteFor(id) && (id === this._rmp || !this._rmDev(id).pod));
      const plat = () => ((this._hass.entities || {})[this._rid] || {}).platform || '';
      const send = (cmd, hold) => this._rid && this._hass.callService('remote', 'send_command', Object.assign({ entity_id: this._rid, command: (REMOTE_KEYS[plat()] || {})[cmd] || cmd }, hold && plat() === 'apple_tv' ? { hold_secs: 1 } : {})).catch(() => {});
      // A long press does what holding the Siri Remote's button does; the tap that would follow is then dropped.
      const holdable = (el, tap, hold) => {
        let t = 0, did = false;
        el.addEventListener('pointerdown', () => { did = false; clearTimeout(t); t = setTimeout(() => { did = true; el.classList.add('held'); hold(); }, 550); });
        const end = () => { clearTimeout(t); el.classList.remove('held'); };
        ['pointerup', 'pointercancel', 'pointerleave'].forEach((x) => el.addEventListener(x, end));
        el.onclick = (e) => { e.stopPropagation(); if (did) { did = false; return; } tap(); };
      };
      const back = () => send('back');
      const st = () => this._hass.states[this._rmp];
      const feat = (b) => { const x = st(); return !!x && (Number(x.attributes.supported_features) & b) === b; };
      const fit = () => {
        let e = this, sf = null;
        while (e && !sf) { e = e.parentElement || (e.getRootNode && e.getRootNode().host); if (e && e.nodeType === 1 && getComputedStyle(e).overflow !== 'visible') sf = e; }
        const me = this.getBoundingClientRect(), r = sf ? sf.getBoundingClientRect() : me;
        page.style.setProperty('--rx-t', Math.max(0, me.top - r.top) + 'px');
        page.style.setProperty('--rx-b', Math.max(0, r.bottom - me.bottom) + 'px');
        const sp = document.createElement('div');
        sp.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)';
        document.body.appendChild(sp);
        const cs = getComputedStyle(sp), sat = parseFloat(cs.paddingTop) || 0, sab = parseFloat(cs.paddingBottom) || 0;
        sp.remove();
        page.style.setProperty('--rx-pt', Math.max(0, sat - r.top) + 'px');
        page.style.setProperty('--rx-pb', Math.max(16, Math.max(16, sab) + 16 - Math.max(0, innerHeight - r.bottom)) + 'px');
      };
      const ink = (on) => {
        let e = this;
        while (e && !(e.classList && e.classList.contains('surface'))) e = e.parentElement || (e.getRootNode && e.getRootNode().host);
        if (this._inked && this._inked !== e) { this._inked.style.removeProperty('background-color'); this._inked.style.removeProperty('--hemma-popup-tint'); }
        if (e && document.documentElement.classList.contains('hemma-hv')) on ? e.style.setProperty('--hemma-popup-tint', 'oklch(from var(--hv-bg, #49575c) 0.25 min(c, 0.03) h)') : e.style.removeProperty('--hemma-popup-tint');
        this._inked = on ? e : null;
        if (e) on ? e.style.setProperty('background-color', document.documentElement.classList.contains('hemma-hv') ? 'oklch(from var(--hv-bg, #49575c) 0.25 min(c, 0.03) h)' : '#000', 'important') : e.style.removeProperty('background-color');
      };
      const big = () => window.matchMedia('(pointer: coarse) and (min-width: 769px)').matches;
      const open = (on) => {
        if (on && big()) return this._fullOpen();
        if (!on && this._rlayer) return this._fullClose();
        if (on) fit();
        ink(on);
        wrap.classList.toggle('rem', on);
        this.dispatchEvent(new CustomEvent('hemma-deep', { detail: on, bubbles: true, composed: true }));
        if (on) { this._paintRemote(); setTimeout(() => { if (window.matchMedia('(hover: hover)').matches) page.querySelector('.rpad').focus({ preventScroll: true }); }, 400); }
      };
      root.querySelectorAll('.rmb, .rmc').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); open(true); }; });
      page.querySelector('.rclose').onclick = () => open(false);
      page.querySelector('.rpow').onclick = () => { const x = st(); if (x) this._hass.callService('media_player', ['off', 'standby'].includes(x.state) ? 'turn_on' : 'turn_off', { entity_id: this._rmp }).catch(() => {}); };
      page.querySelector('.rpp').onclick = () => this._hass.callService('media_player', 'media_play_pause', { entity_id: this._rmp }).catch(() => {});
      holdable(page.querySelector('.rbk'), back, () => send('back', true));
      holdable(page.querySelector('.rhome'), () => send('home'), () => send('home_hold'));
      // Ten seconds by the player's own seek when it reports its place, else the Apple TV's skip.
      const skip = (d) => {
        const x = st(), a = (x && x.attributes) || {};
        if (feat(MF.SEEK) && Number(a.media_duration) > 0 && a.media_position != null) {
          let pos = Number(a.media_position) || 0;
          if (x.state === 'playing' && a.media_position_updated_at) pos += (Date.now() - Date.parse(a.media_position_updated_at)) / 1000;
          this._hass.callService('media_player', 'media_seek', { entity_id: this._rmp, seek_position: Math.max(0, Math.round(pos + d)) }).catch(() => {});
        } else if ((REMOTE_KEYS[plat()] || {}).skip_backward) send(d < 0 ? 'skip_backward' : 'skip_forward');
      };
      ['rskb', 'rskf'].forEach((c, i) => { const b = page.querySelector('.' + c); b.addEventListener('pointerdown', (e) => e.stopPropagation()); b.onclick = (e) => { e.stopPropagation(); skip(i ? 10 : -10); }; });
      const dev = page.querySelector('.rdev');
      dev.onclick = (e) => {
        const list = players();
        if (list.length < 2) return;
        e.stopPropagation();
        if (page.classList.contains('full')) return this._fullList(page, list);
        capPick(dev, list.map((id) => { const d = this._rmDev(id); return [id, d.name, d.icon]; }), this._rmp, (id) => { this._rmp = id; this._rid = this._remoteFor(id); this._paintRemote(); }, page);
      };
      // Each 36px of travel is one step, so a long swipe moves several; a short touch selects.
      const pad = page.querySelector('.rpad'), glow = pad.querySelector('.rglow');
      let g = null;
      const at = (e) => { const r = pad.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      // Press and hold selects with a hold, as the Siri Remote's click does (menus, rearranging); a swipe that stops and holds keeps moving that way.
      const stop = () => { if (!g) return; clearTimeout(g.ht); clearInterval(g.rep); clearTimeout(g.rt); };
      // With a mouse there is nothing to swipe: on a Mac the pad is the Siri Remote's clickpad ring instead.
      const ringMode = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && !page.classList.contains('full');
      const ring = pad.querySelector('.rring');
      let rh = null;
      const zone = (e) => {
        const r = ring.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy);
        if (d > r.width / 2) return '';
        if (d < r.width * 0.22) return 'ok';
        return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      };
      const rstop = () => { if (!rh) return; clearTimeout(rh.t); clearInterval(rh.i); ring.classList.remove('down'); rh = null; };
      const QR = { up: 0, right: 90, down: 180, left: 270 };
      const setQ = (q) => { ring.dataset.q = q; if (q in QR) ring.style.setProperty('--qr', QR[q] + 'deg'); };
      ring.addEventListener('pointermove', (e) => setQ(zone(e)));
      ring.addEventListener('pointerleave', () => { ring.dataset.q = ''; rstop(); });
      ring.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const q = zone(e);
        if (!q) return;
        rstop();
        setQ(q);
        ring.classList.add('down');
        pad.focus({ preventScroll: true });
        rh = { q, held: false };
        if (q === 'ok') rh.t = setTimeout(() => { if (rh) { rh.held = true; send('select', true); } }, 550);
        else { send(q); rh.t = setTimeout(() => { if (rh) rh.i = setInterval(() => send(q), 220); }, 450); }
      });
      ring.addEventListener('pointerup', () => { if (rh && rh.q === 'ok' && !rh.held) send('select'); rstop(); });
      pad.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && ringMode()) return;
        try { pad.setPointerCapture(e.pointerId); } catch (_) {}
        const [x, y] = at(e);
        stop();
        g = { x0: x, y0: y, ax: x, ay: y, moved: false, held: false, t: Date.now(), dir: null };
        glow.style.left = x + 'px'; glow.style.top = y + 'px';
        pad.classList.add('down');
        g.ht = setTimeout(() => { if (g && !g.moved) { g.held = true; pad.classList.add('hold'); send('select', true); } }, 550);
      });
      pad.addEventListener('pointermove', (e) => {
        if (!g) return;
        const [x, y] = at(e);
        glow.style.left = x + 'px'; glow.style.top = y + 'px';
        const dx = x - g.ax, dy = y - g.ay;
        if (!g.moved && Math.hypot(x - g.x0, y - g.y0) > 12) clearTimeout(g.ht);
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 36) return;
        g.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        send(g.dir);
        g.ax = x; g.ay = y; g.moved = true;
        clearInterval(g.rep); clearTimeout(g.rt);
        const gg = g;
        g.rt = setTimeout(() => { gg.rep = setInterval(() => { if (g === gg) send(gg.dir); }, 220); }, 450);
      });
      const up = (e) => {
        if (!g) return;
        const [x, y] = at(e);
        stop();
        if (!g.moved && !g.held && Math.hypot(x - g.x0, y - g.y0) < 12) send('select');
        g = null;
        pad.classList.remove('down', 'hold');
      };
      pad.addEventListener('pointerup', up);
      pad.addEventListener('pointercancel', () => { stop(); g = null; pad.classList.remove('down', 'hold'); });
      const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'select', ' ': 'select' };
      pad.addEventListener('keydown', (e) => {
        if (KEYS[e.key]) { e.preventDefault(); send(KEYS[e.key]); }
        else if (e.key === 'Backspace') { e.preventDefault(); back(); }
      });
      this._rmFeat = feat;
    }
    _fullOpen() {
      const page = this.shadowRoot.querySelector('.rpage');
      if (!page || this._rlayer) return;
      const layer = document.createElement('div');
      layer.className = 'hemma-remote-layer';
      const sr = layer.attachShadow({ mode: 'open' });
      sr.innerHTML = `<style>${RM_CSS}${CAPS_CSS}${RM_FULL_CSS}</style>`;
      page.classList.add('full');
      this._fullVol(page, true);
      sr.appendChild(page);
      camHost().appendChild(layer);
      this._rlayer = layer;
      this._paintRemote();
      this._fullDrag(layer);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) layer.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 440, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
    }
    _fullClose(from) {
      const layer = this._rlayer;
      if (!layer) return;
      this._rlayer = null;
      const done = () => {
        const page = layer.shadowRoot.querySelector('.rpage'), wrap = this.shadowRoot.querySelector('.wrap');
        if (page) {
          page.classList.remove('full', 'lst');
          this._fullVol(page, false);
          page.querySelector('.rlist').style.height = '';
          if (wrap && !wrap.querySelector('.rpage')) wrap.appendChild(page);
          else page.remove();
        }
        layer.remove();
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
      layer.style.pointerEvents = 'none';
      layer.animate([{ transform: `translateY(${from || 0}px)` }, { transform: 'translateY(100%)' }], { duration: 320, easing: 'cubic-bezier(0.4, 0, 0.8, 0.6)', fill: 'forwards' }).finished.then(done, done);
    }
    // On the iPad, volume sits in the touch area's bottom row, in place of Info and Subtitles, which Home Assistant can't send.
    _fullVol(page, on) {
      const v = page.querySelector('.rvol'), pad = page.querySelector('.rpad'), btns = page.querySelector('.rbtns');
      if (!v || !pad) return;
      if (on && v.parentNode !== pad) pad.appendChild(v);
      else if (!on && v.parentNode === pad) page.insertBefore(v, btns);
    }
    // A swipe down that starts on the top strip puts the remote away; one on the pad always goes to the Apple TV.
    _fullDrag(layer) {
      let d = null;
      layer.addEventListener('pointerdown', (e) => {
        const page = layer.shadowRoot.querySelector('.rpage'), top = page && page.querySelector('.rtop');
        if (!top || e.composedPath().some((n) => n.classList && (n.classList.contains('rlist') || n.classList.contains('rpad')))) return;
        if (e.clientY > top.getBoundingClientRect().bottom + 16) return;
        d = { y: e.clientY, t: Date.now(), dy: 0, id: e.pointerId };
      });
      layer.addEventListener('pointermove', (e) => {
        if (!d || e.pointerId !== d.id) return;
        d.dy = Math.max(0, e.clientY - d.y);
        if (d.dy > 6) { d.moved = true; layer.style.transform = `translateY(${d.dy}px)`; }
      });
      const end = (e) => {
        if (!d || e.pointerId !== d.id) return;
        const g = d; d = null;
        if (!g.moved) return;
        const eat = (x) => { x.stopPropagation(); x.preventDefault(); };
        layer.addEventListener('click', eat, { capture: true, once: true });
        setTimeout(() => layer.removeEventListener('click', eat, { capture: true }), 400);
        const v = g.dy / Math.max(1, Date.now() - g.t);
        if (g.dy > 120 || (g.dy > 40 && v > 0.6)) { layer.style.transform = ''; this._fullClose(g.dy); return; }
        layer.style.transform = '';
        layer.animate([{ transform: `translateY(${g.dy}px)` }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      };
      layer.addEventListener('pointerup', end);
      layer.addEventListener('pointercancel', end);
    }
    // iPad remote: the devices slide down out of the pill, pushing the pad down with them.
    _fullList(page, list) {
      const box = page.querySelector('.rlist'), opening = !page.classList.contains('lst');
      const h0 = box.getBoundingClientRect().height;
      if (opening) {
        box.innerHTML = list.map((id) => { const d = this._rmDev(id); return `<button type="button" class="rrow${id === this._rmp ? ' on' : ''}" data-k="${esc(id)}"><span class="ric">${d.icon}</span>${esc(d.name)}</button>`; }).join('');
        box.querySelectorAll('.rrow').forEach((b) => { b.onclick = () => { const id = b.dataset.k; if (id !== this._rmp) { this._rmp = id; this._rid = this._remoteFor(id); this._paintRemote(); } this._fullList(page, list); }; });
      }
      page.classList.toggle('lst', opening);
      const h1 = opening ? Math.min(box.scrollHeight + 8, 56 * 5.5) : 0;
      box.style.height = h1 + 'px';
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) box.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
    }
    _paintRemote() {
      const page = (this._rlayer && this._rlayer.shadowRoot.querySelector('.rpage')) || this.shadowRoot.querySelector('.rpage');
      if (!page || !this._hass) return;
      const x = this._hass.states[this._rmp], a = (x && x.attributes) || {}, f = this._rmFeat || (() => false);
      this._skipGlyphs(page, this._rmp, [['.rskb', 'b10n', 'b10nm'], ['.rskf', 'f10n', 'f10nm']]);
      const d = this._rmDev(this._rmp), rtv = page.querySelector('.rdev .rtv');
      page.querySelector('.rdev b').textContent = d.name || this._name();
      if (rtv._ic !== d.icon) { rtv._ic = d.icon; rtv.innerHTML = d.icon; }
      page.querySelector('.rdev').classList.toggle('many', Object.keys(this._hass.states).filter((id) => id.indexOf('media_player.') === 0 && this._remoteFor(id) && !this._rmDev(id).pod).length > 1);
      page.querySelector('.rpow').style.visibility = f(MF.ON) || f(MF.OFF) ? '' : 'hidden';
      const xa = (x && x.attributes) || {}, seekable = (Number(xa.supported_features) & MF.SEEK) && Number(xa.media_duration) > 0;
      const rplat = ((this._hass.entities || {})[this._rid] || {}).platform;
      page.querySelector('.rpad').classList.toggle('play', !!x && ['playing', 'paused'].includes(x.state) && !!(seekable || (REMOTE_KEYS[rplat] || {}).skip_backward));
      const vol = page.querySelector('.rvol'), level = f(MF.VOL) && a.volume_level != null && Number.isFinite(Number(a.volume_level)), step = f(1024), mute = f(MF.MUTE);
      const kind = (step || level ? 'v' : '') + (mute ? 'm' : '');
      if (vol._kind !== kind) {
        vol._kind = kind;
        vol.className = 'rvol' + (mute ? ' mu' : '');
        vol.innerHTML = step || level ? `<button type="button" class="rvdn gl" data-notip aria-label="${esc(T('media.volume_down', 'Volume down'))}">${RM_I.vdn}</button>`
          + (mute ? `<button type="button" class="rmute gl" data-notip aria-label="${esc(T('media.mute', 'Mute'))}">${RM_I.mute}</button>` : '')
          + `<button type="button" class="rvup gl" data-notip aria-label="${esc(T('media.volume_up', 'Volume up'))}">${RM_I.vup}</button>` : '';
        const call = (svc, data) => this._hass.callService('media_player', svc, Object.assign({ entity_id: this._rmp }, data || {})).catch(() => {});
        const by = (d) => { const x2 = this._hass.states[this._rmp], v = Number(((x2 || {}).attributes || {}).volume_level); if (!step && Number.isFinite(v)) call('volume_set', { volume_level: Math.max(0, Math.min(1, Math.round((v + d) * 100) / 100)) }); else call(d > 0 ? 'volume_up' : 'volume_down'); };
        const m = vol.querySelector('.rmute'); if (m) m.onclick = () => call('volume_mute', { is_volume_muted: !this._hass.states[this._rmp].attributes.is_volume_muted });
        const dn = vol.querySelector('.rvdn'), upb = vol.querySelector('.rvup');
        vol.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => e.stopPropagation()));
        const rep = (el, d) => {
          if (!el) return;
          let t = 0, i = 0;
          const end = () => { clearTimeout(t); clearInterval(i); };
          el.addEventListener('pointerdown', () => { end(); t = setTimeout(() => { i = setInterval(() => by(d), 250); }, 450); });
          ['pointerup', 'pointercancel', 'pointerleave'].forEach((x) => el.addEventListener(x, end));
          el.onclick = () => by(d);
        };
        rep(dn, -0.05);
        rep(upb, 0.05);
      }
      const m = vol.querySelector('.rmute');
      if (m) m.classList.toggle('on', !!a.is_volume_muted);
    }
    _bind(root) {
      const q = (sel) => root.querySelector(sel), id = this._config.entity;
      const fexp = q('.fexp');
      if (fexp) fexp.onclick = (e) => {
        e.stopPropagation();
        const art = q('.art img') || q('.art');
        const cfg = Object.assign({}, this._config);
        delete cfg.full;
        window.hemmaMediaFull.open(cfg, art, true);
      };
      this._bindRemote(root);
      const spb = q('.spb');
      if (spb) spb.onclick = (e) => { e.stopPropagation(); this._speakers(this._anchor || spb); };
      const apb = q('.apb:not(.spb)');
      if (apb) apb.onclick = (e) => {
        e.stopPropagation();
        const a = (this._st() || {}).attributes || {};
        capPick(this._anchor || apb, this._sources().map((x) => [x, x]), a.source || null, async (src) => {
          if (this._isOff() && this._f(MF.ON)) await this._call('turn_on');
          this._call('select_source', { source: src });
        }, root.querySelector('.wrap'));
      };
      q('.gear:not(.rmc)').onclick = () => moreInfo(this, id);
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
        // Rows sit on a cylinder, as on a picker wheel: off the middle they turn away and close up on each other.
        const lean = () => {
          const mid = wheel.scrollTop + wheel.clientHeight / 2;
          wheel.querySelectorAll('button').forEach((b) => {
            const row = b.offsetHeight, d = Math.max(-4, Math.min(4, (b.offsetTop + row / 2 - mid) / row));
            const a = d * 0.36, r = row / 0.36, y = r * Math.sin(a) - d * row;
            b.style.transform = d ? `translateY(${y.toFixed(1)}px) rotateX(${(-a * 57.3).toFixed(1)}deg)` : '';
          });
        };
        wheel.addEventListener('scroll', () => requestAnimationFrame(lean), { passive: true });
        requestAnimationFrame(() => { this._center(false); lean(); });
      }
      const pp = q('.pp');
      if (pp) pp.onclick = () => this._call(this._isOff() && this._f(MF.ON) ? 'turn_on' : this._st().state === 'playing' ? (this._f(MF.PAUSE) ? 'media_pause' : 'media_stop') : 'media_play');
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
    _speakers(btn) {
      const wrap = this.shadowRoot.querySelector('.wrap'), old = wrap.querySelector('.spk');
      if (old) { old._close(); return; }
      const h = () => this._hass, me = this._config.entity;
      const ids = this._groupable().sort((a, b) => (b === me) - (a === me));
      const box = document.createElement('div');
      box.className = 'spk';
      const name = (id) => { const reg = (h().entities || {})[id] || {}, dv = reg.device_id && (h().devices || {})[reg.device_id], ar = (h().areas || {})[reg.area_id || (dv && dv.area_id)]; return (ar && ar.name) || h().states[id].attributes.friendly_name || id; };
      // Output picker: what is playing on top, then a row per speaker with its icon and a circle that ticks; a row's fill is its volume, dragged sideways.
      const a0 = (h().states[me] || {}).attributes || {}, pic = a0.entity_picture ? (a0.entity_picture.startsWith('/') && h().hassUrl ? h().hassUrl(a0.entity_picture) : a0.entity_picture) : '';
      const t1 = a0.media_title || T('media.not_playing', 'Not Playing'), t2 = [a0.media_artist, a0.media_album_name].filter(Boolean).join(' · ');
      box.innerHTML = `<div class="sh"><span class="sa"${pic ? ` style="background-image:url('${esc(pic)}')"` : ''}></span><span class="st"><b>${esc(t1)}</b>${t2 ? `<small>${esc(t2)}</small>` : ''}</span></div>`
        + ids.map((id) => `<div class="sr" data-id="${esc(id)}"><span class="f"></span><span class="si">${RM_I.air}</span><b>${esc(name(id))}</b><em><span class="c0">${RM_I.ckoff}</span><span class="c1">${RM_I.ckon}</span></em></div>`).join('');
      wrap.appendChild(box);
      const wr = wrap.getBoundingClientRect(), br = btn.getBoundingClientRect();
      box.style.bottom = Math.max(8, wr.bottom - br.top + 8) + 'px';
      const paint = () => {
        const S = h().states, members = (S[me] && S[me].attributes.group_members) || [me];
        box.querySelectorAll('.sr').forEach((r) => {
          const id = r.dataset.id, a = (S[id] || {}).attributes || {};
          r.classList.toggle('on', members.indexOf(id) >= 0);
          if (!r._drag) r.querySelector('.f').style.width = ((Number(a.volume_level) || 0) * 100) + '%';
        });
      };
      paint();
      const tick = setInterval(paint, 1000);
      box.querySelectorAll('.sr').forEach((r) => {
        const id = r.dataset.id, em = r.querySelector('em');
        em.addEventListener('pointerdown', (e) => e.stopPropagation());
        em.onclick = (e) => {
          e.stopPropagation();
          if (id === me) return;
          const on = r.classList.contains('on');
          h().callService('media_player', on ? 'unjoin' : 'join', on ? { entity_id: id } : { entity_id: me, group_members: [id] }).catch(() => {});
          r.classList.toggle('on', !on);
        };
        const set = (e, done) => { const rr = r.getBoundingClientRect(), v = Math.max(0, Math.min(1, (e.clientX - rr.left) / rr.width)); r.querySelector('.f').style.width = v * 100 + '%'; clearTimeout(r._t); r._t = setTimeout(() => h().callService('media_player', 'volume_set', { entity_id: id, volume_level: Math.round(v * 100) / 100 }).catch(() => {}), done ? 0 : 150); };
        r.addEventListener('pointerdown', (e) => { try { r.setPointerCapture(e.pointerId); } catch (_) {} r._drag = true; set(e, false); });
        r.addEventListener('pointermove', (e) => { if (r._drag) set(e, false); });
        r.addEventListener('pointerup', (e) => { if (r._drag) { set(e, true); setTimeout(() => { r._drag = false; }, 2500); } });
      });
      box.animate([{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      const away = (e) => {
        if (e.composedPath().includes(box) || e.composedPath().includes(btn)) return;
        // The tap that puts the sheet away ends there, rather than also landing on the popup's background and closing it.
        const eat = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        ['click', 'touchend', 'pointerup', 'mouseup'].forEach((t) => document.addEventListener(t, eat, true));
        setTimeout(() => ['click', 'touchend', 'pointerup', 'mouseup'].forEach((t) => document.removeEventListener(t, eat, true)), 450);
        box._close();
      };
      box._close = () => { clearInterval(tick); document.removeEventListener('pointerdown', away, true); box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished.then(() => box.remove(), () => box.remove()); };
      setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
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
      // With no duration the bar stays, empty.
      root.querySelector('.t0').textContent = d ? this._fmt(pos) : '–:––';
      root.querySelector('.t1').textContent = d ? '-' + this._fmt(d - pos) : '–:––';
    }
    _paint() {
      const s = this._st(), root = this.shadowRoot, q = (sel) => root.querySelector(sel);
      if (!q('.hd')) return;
      const a = (s && s.attributes) || {}, mode = this._mode(s);
      const state = s ? (this._hass.formatEntityState ? this._hass.formatEntityState(s) : s.state) : '';
      const src = this._config.src || {}, ta = mode === 'plex' ? ((this._tau() || {}).attributes || {}) : null;
      q('.hd b').textContent = mode === 'plex' ? 'Plex' : mode === 'activity' ? (src.source || this._name()) : this._room() || this._name();
      q('.hd span').textContent = mode === 'quiet' ? T('media.not_playing', 'Not Playing')
        : mode === 'plex' ? [ta.state === 'paused' ? T('media.paused', 'Paused') : T('media.playing', 'Playing'), ta.player].filter(Boolean).join(' · ')
        : mode === 'activity' ? T('media.playing', 'Playing') : state;
      if (mode === 'plex' || mode === 'activity') { this._paintSession(mode, src, ta); return; }
      const pw = q('.pw');
      if (pw) pw.classList.toggle('on', !this._isOff());
      const wheel = q('.wheel');
      if (wheel) {
        // A TV switched off reports no input, so the picker shows the last one it was on.
        const key = 'hemma_src:' + this._config.entity;
        if (a.source && !this._isOff()) { try { localStorage.setItem(key, a.source); } catch (e) {} }
        let last = null;
        try { last = localStorage.getItem(key); } catch (e) {}
        const held = this._srcHold && Date.now() < this._srcHold.until ? this._srcHold.src : null, cur = held || a.source || last || this._sources()[0];
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
        let sub = [a.media_artist, a.media_series_title, a.media_album_name].find((x) => x && x !== a.media_title);
        if (a.media_content_type === 'game' && !sub) {
          try {
            const V = window._hemmaCatNPV || window._hemmaLastNPV || saverNPVars(), row = (window._hemmaNP ? window._hemmaNP(this._hass.states, V) : []).find((x) => x && x.kind === 'activity' && String(x.title || '').toLowerCase() === String(a.media_title || '').toLowerCase());
            if (row) sub = row.subtitle || row.source || '';
            const det = q('.det');
            if (det) {
              const m = row && row.started ? Math.max(1, Math.round((Date.now() - row.started) / 60000)) : 0;
              const lang = (this._hass.locale && this._hass.locale.language) || undefined;
              const html = this._config.full && m ? `<div class="sb"><i style="width:${Math.min(100, m / 240 * 100).toFixed(1)}%"></i></div><div class="st"><span>${esc(new Date(row.started).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }))}</span><span>${esc(m < 60 ? T('media.n_min', '{n} min', { n: m }) : T('media.n_h_m', '{h} h {m} min', { h: Math.floor(m / 60), m: m % 60 }))}</span></div>` : '';
              det.classList.toggle('sess', !!html);
              if (det.innerHTML !== html) det.innerHTML = html;
            }
          } catch (_) {}
        }
        this._line(q('.trk > b'), a.media_title || a.app_name || this._name());
        // The artist or show under the title when there is one, otherwise the title alone.
        this._sub(sub || (a.media_title ? '' : state), sub && !this._config.full && a.media_content_type !== 'game' ? ' · ' + this._name() : '');
        q('.trk > span').hidden = !q('.trk > span').textContent;
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
        this._line(q('.trk > b'), src.title || this._name());
        const where = src.source || this._name();
        this._line(q('.trk > span'), src.subtitle ? src.subtitle : where);
        this._glow(pic === this._artFailed ? '' : pic);
        const mins = src.started ? Math.max(1, Math.round((Date.now() - src.started) / 60000)) : 0;
        const lang = (this._hass.locale && this._hass.locale.language) || undefined;
        const rows = [
          [T('media.playing_on_label', 'Playing on'), src.subtitle ? where : ''],
          [T('media.playing_for', 'Playing for'), mins ? (mins < 60 ? T('media.n_min', '{n} min', { n: mins }) : T('media.n_h_m', '{h} h {m} min', { h: Math.floor(mins / 60), m: mins % 60 })) : ''],
          [T('media.started', 'Started'), src.started ? new Date(src.started).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }) : ''],
          [T('media.trophies', 'Trophies'), src.trophies != null && src.trophies !== '' ? String(src.trophies) : ''],
        ].filter((r) => r[1]);
        const sess = this._config.full && src.started;
        const html = sess
          ? `<div class="sb"><i style="width:${Math.min(100, mins / 240 * 100).toFixed(1)}%"></i></div><div class="st"><span>${esc(new Date(src.started).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }))}</span><span>${esc(mins < 60 ? T('media.n_min', '{n} min', { n: mins }) : T('media.n_h_m', '{h} h {m} min', { h: Math.floor(mins / 60), m: mins % 60 }))}</span></div>`
          : rows.map((r) => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('');
        const det = q('.det');
        if (det) det.classList.toggle('sess', !!sess);
        if (det && det.innerHTML !== html) det.innerHTML = html;
        return;
      }
      const ep = ta.media_type === 'episode';
      this._line(q('.trk > b'), (ep ? ta.title : null) || ta.title || ta.full_title || src.title || '');
      this._sub(ep ? [ta.grandparent_title, ta.parent_media_index && ta.media_index ? 'S' + ta.parent_media_index + ' · E' + ta.media_index : ''].filter(Boolean).join(' · ') : [ta.year, ta.library_name].filter(Boolean).join(' · '),
        ta.player ? ' · ' + T('media.playing_on', 'On {name}', { name: ta.player }) : '');
      this._glow(pic === this._artFailed ? '' : pic);
      const cap = (x) => String(x || '').replace(/\b\w/g, (c) => c.toUpperCase());
      const rows = [
        [T('media.watching', 'Watching'), ta.user_friendly_name || ta.user],
        [T('media.device', 'Device'), [ta.player, ta.platform].filter(Boolean).join(' · ')],
        [T('media.stream', 'Stream'), [ta.stream_video_full_resolution || ta.video_full_resolution, cap(ta.transcode_decision), Number(ta.bandwidth) ? (Number(ta.bandwidth) / 1000).toFixed(1) + ' Mbps' : ''].filter(Boolean).join(' · ')],
        [T('media.connection', 'Connection'), ta.local === 1 || ta.local === '1' ? T('media.local', 'Local') : [T('media.remote', 'Remote'), ta.geo_city].filter(Boolean).join(' · ')],
      ].filter((r) => r[1]);
      const html = rows.map((r) => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('');
      const det = q('.det');
      if (det.innerHTML !== html) det.innerHTML = html;
      this._progress();
    }
    // A "10" shows only when the app says it skips ten seconds (YouTube); any other app gets the plain back and forward arrows. Home Assistant passes on the app's name, not its skip length.
    _skipGlyphs(root, id, sel) {
      const a = ((this._hass.states[id] || {}).attributes) || {}, ten = /youtube/i.test(String(a.app_name || a.app_id || ''));
      sel.forEach(([q, t, m]) => { const b = root.querySelector(q); if (b && b._ten !== ten) { b._ten = ten; b.innerHTML = ten ? MD_I[t] : MD_I[m]; } });
    }
    _sub(text, dev) {
      this._line(this.shadowRoot.querySelector('.trk > span'), text, dev);
    }
    // Written only when it changes, so a long title keeps scrolling through state updates instead of starting over.
    _line(el, text, dev) {
      if (!el) return;
      const k = (text || '') + '|' + (dev || '');
      if (el._k === k && el.firstElementChild) return;
      el._k = k;
      el.classList.remove('mqs');
      el.innerHTML = text || dev ? `<span class="mqt">${esc(text || '')}${dev ? `<i class="dev" style="font-style:normal">${esc(dev)}</i>` : ''}</span>` : '';
      requestAnimationFrame(() => this._mqScan(el));
      const trk = this.shadowRoot.querySelector('.trk');
      if (trk && trk !== this._mqTrk && window.ResizeObserver) {
        if (!this._mqObs) this._mqObs = new ResizeObserver(() => requestAnimationFrame(() => this.shadowRoot.querySelectorAll('.trk > b, .trk > span').forEach((x) => this._mqScan(x))));
        if (this._mqTrk) this._mqObs.unobserve(this._mqTrk);
        this._mqTrk = trk;
        this._mqObs.observe(trk);
      }
    }
    // The Now Playing tile's marquee: 26px a second, a second copy 48px behind for a seamless loop, a pause at the start; the subtitle starts 1.2s later.
    _mqScan(el) {
      const t = el && el.firstElementChild;
      if (!t || !el.isConnected) return;
      const box = el.clientWidth, w = t.offsetWidth, dup = t.nextElementSibling;
      if (!box) return;
      if (w - box > 4) {
        const loop = w + 48, dur = Math.max(4, loop / 26 / 0.88);
        el.style.setProperty('--mq', loop + 'px');
        el.style.setProperty('--mqd', dur.toFixed(2) + 's');
        el.style.setProperty('--mqdl', el.tagName === 'SPAN' ? '1.2s' : '0s');
        if (!dup) { const c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.style.marginLeft = '48px'; el.appendChild(c); }
        el.classList.add('mqs');
      } else {
        el.classList.remove('mqs');
        if (dup) dup.remove();
      }
    }
    _glow(pic) {
      const g = this.shadowRoot.querySelector('.glow > i:first-child');
      if (!g) return;
      const v = pic ? `url("${String(pic).replace(/"/g, '%22')}")` : 'none', was = g.style.getPropertyValue('--art');
      if (was === v) return;
      if (this._config.full && pic && was && was !== 'none') {
        const o = g.cloneNode();
        g.after(o);
        g.style.setProperty('--art', v);
        const go = () => { const a = o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 800, easing: 'ease-in-out', fill: 'forwards' }); a.finished.then(() => o.remove(), () => o.remove()); };
        const im = new Image(); im.onload = im.onerror = go; im.src = pic;
        this._bakeGlow(g, pic);
        return;
      }
      g.style.setProperty('--art', v);
      if (this._config.full) this._bakeGlow(g, pic);
      else this._solid(pic);
    }
    // Minimal's small player is one color from the artwork, as Spotify's is.
    _solid(pic) {
      const w = this.shadowRoot.querySelector('.wrap.med');
      if (!w) return;
      const on = !!pic && document.documentElement.classList.contains('hemma-hv') && !!window.hemmaAlbumColor;
      this._solidPic = pic;
      const pop = () => { let n = this; while (n && n.tagName !== 'HEMMA-POPUP') n = n.parentElement || (n.parentNode && n.parentNode.host); return n; };
      const frame = (c) => { const h = pop(); if (!h) return; if (c) h.style.setProperty('--hemma-popup-solid', c.join(',')); h.toggleAttribute('solid', !!c); };
      if (!on) { w.classList.remove('solid'); frame(null); return; }
      window.hemmaAlbumColor(pic).then((c) => {
        if (this._solidPic !== pic) return;
        const ww = this.shadowRoot.querySelector('.wrap.med');
        if (!ww) return;
        if (c) { const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; c = c.map((v) => Math.round((l + (v - l) * 0.5) * 0.85)); }
        if (c) ww.style.setProperty('--hv-med-c', c.join(','));
        ww.classList.toggle('solid', !!c);
        frame(c);
      });
    }
    // A live blur(80px) over the whole screen is the costliest paint in Safari and left the sliding sheet half drawn; the full player gets it baked into a small bitmap.
    _bakeGlow(g, pic) {
      const tok = this._bakeTok = (this._bakeTok || 0) + 1;
      ['backgroundImage', 'filter', 'transform', 'inset', 'backgroundSize'].forEach((k) => { g.style[k] = ''; });
      if (!pic) return;
      g.style.opacity = '0';
      const im = new Image();
      im.onerror = () => { if (tok === this._bakeTok) g.style.opacity = ''; };
      im.onload = () => {
        if (tok !== this._bakeTok) return;
        let url = '';
        try {
          const W = Math.max(1, window.innerWidth), H = Math.max(1, window.innerHeight), cw = 96, ch = Math.max(1, Math.round(cw * H / W));
          const c = document.createElement('canvas'), x = c.getContext('2d');
          c.width = cw; c.height = ch;
          const k = cw / W, s = Math.max((W + 240) * 1.3 * k / im.naturalWidth, (H + 240) * 1.3 * k / im.naturalHeight), dw = im.naturalWidth * s, dh = im.naturalHeight * s;
          x.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
          const d = x.getImageData(0, 0, cw, ch), px = d.data, r = Math.max(1, Math.round(80 * k)), a = Float32Array.from(px), b = new Float32Array(px.length);
          const pass = (src, dst, lines, len, step, lstep) => {
            for (let l = 0; l < lines; l++) for (let q = 0; q < 3; q++) {
              const o0 = l * lstep + q, at = (i) => src[o0 + Math.max(0, Math.min(len - 1, i)) * step];
              let sum = 0; for (let i = -r; i <= r; i++) sum += at(i);
              for (let i = 0; i < len; i++) { dst[o0 + i * step] = sum / (2 * r + 1); sum += at(i + r + 1) - at(i - r); }
            }
          };
          for (let n = 0; n < 3; n++) { pass(a, b, ch, cw, 4, cw * 4); pass(b, a, cw, ch, cw * 4, 4); }
          for (let i = 0; i < px.length; i += 4) {
            const lum = 0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2];
            for (let q = 0; q < 3; q++) px[i + q] = Math.max(0, Math.min(255, (lum + (a[i + q] - lum) * 1.5) * 0.62));
            px[i + 3] = 255;
          }
          x.putImageData(d, 0, 0);
          url = c.toDataURL('image/jpeg', 0.92);
        } catch (_) {}
        if (url) Object.assign(g.style, { backgroundImage: `url("${url}")`, filter: 'none', transform: 'none', inset: '0', backgroundSize: '100% 100%' });
        g.style.opacity = '';
      };
      im.src = pic;
    }
    // An image that failed stays failed until its address changes; retrying it on every update made the cover flicker.
    _setArt(art, pic) {
      if (!art) return;
      let img = art.querySelector('img');
      if (!pic || pic === this._artFailed) { if (img) img.remove(); const fz = art.querySelector('.fz'); if (fz) fz.remove(); this._placeholder(art); return; }
      const ph = art.querySelector('i'); if (ph) ph.remove(); art.classList.remove('ph');
      if (!img) { img = document.createElement('img'); img.alt = ''; art.appendChild(img); }
      img.onerror = () => { this._artFailed = img.getAttribute('src'); img.remove(); this._placeholder(art); this._glow(''); };
      const prev = img.getAttribute('src');
      if (prev !== pic) {
        if (this._config.full && prev && img.complete && img.naturalWidth) {
          const x = document.createElement('div'), fc = art.querySelector(':scope > .fz canvas');
          x.className = 'xf';
          x.appendChild(img.cloneNode());
          if (fc && fc.width) {
            const w = document.createElement('span'), c = document.createElement('canvas');
            w.className = 'fz'; w.style.cssText = fc.parentNode.style.cssText; c.width = fc.width; c.height = fc.height;
            try { c.getContext('2d').drawImage(fc, 0, 0); } catch (_) {}
            w.appendChild(c); x.appendChild(w);
          }
          art.appendChild(x);
          const go = () => { const a = x.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' }); a.finished.then(() => x.remove(), () => x.remove()); };
          img.addEventListener('load', () => requestAnimationFrame(go), { once: true });
          img.addEventListener('error', go, { once: true });
        }
        img.src = pic;
      }
      if (this._config.full) this._frost(art, img);
    }
    _frost(art, img) {
      let fz = art.querySelector(':scope > .fz');
      if (!fz) { fz = document.createElement('span'); fz.className = 'fz'; fz.innerHTML = '<canvas></canvas>'; art.appendChild(fz); }
      // HomeView's lower blur: the radius grows toward the bottom and the picture's own edges spread into the room, baked once per cover.
      const paint = () => {
        const key = img.src + '|' + img.naturalWidth + 'x' + img.naturalHeight + '|' + (img._loads || 0);
        if (!img.naturalWidth || fz._src === key) return;
        fz._src = key;
        const ar = img.naturalWidth / img.naturalHeight, aw = 320, ah = Math.round(aw / ar), p = 16, y0 = Math.round(ah * 0.55);
        const W = aw + 2 * p, H = ah + 2 * p, N = W * H, sc = document.createElement('canvas'), sx = sc.getContext('2d');
        sc.width = W; sc.height = H;
        sx.beginPath(); sx.roundRect(p, p, aw, ah, aw * (parseFloat(getComputedStyle(img).borderTopLeftRadius) || 18) / Math.max(1, img.clientWidth || 500)); sx.clip();
        sx.drawImage(img, p, p, aw, ah);
        let px;
        try { px = sx.getImageData(0, 0, W, H).data; } catch (_) { fz.hidden = true; fz.firstChild.width = 0; return; }
        fz.hidden = false;
        const base = new Float32Array(N * 4);
        for (let i = 0; i < N * 4; i += 4) { const al = px[i + 3] / 255; base[i] = px[i] * al; base[i + 1] = px[i + 1] * al; base[i + 2] = px[i + 2] * al; base[i + 3] = px[i + 3]; }
        const blur = (r) => {
          const a = Float32Array.from(base), b = new Float32Array(base.length), n = 2 * r + 1;
          const pass = (s0, t, lines, len, step, lstep) => {
            for (let l = 0; l < lines; l++) for (let k = 0; k < 4; k++) {
              const o = l * lstep + k, at = (i) => (i < 0 || i >= len ? 0 : s0[o + i * step]);
              let sum = 0; for (let i = -r; i <= r; i++) sum += at(i);
              for (let i = 0; i < len; i++) { t[o + i * step] = sum / n; sum += at(i + r + 1) - at(i - r); }
            }
          };
          for (let k = 0; k < 3; k++) { pass(a, b, H, W, 4, W * 4); pass(b, a, W, H, W * 4, 4); }
          return a;
        };
        const L = [base, ...[1, 2, 3, 4].map(blur)], top = p + y0, OH = H - top, c = fz.firstChild, cx = c.getContext('2d');
        c.width = W; c.height = OH;
        const out = cx.createImageData(W, OH), o = out.data;
        for (let j = 0; j < OH; j++) {
          const t = Math.min(1, j / (ah - y0)), f = t * (L.length - 1), k = Math.min(L.length - 2, Math.floor(f)), fr = f - k;
          const e = Math.min(1, t / 0.25), ramp = e * e * (3 - 2 * e), g = Math.max(0, Math.min(1, (t - 0.1) / 0.7)), v = 0.55 * g * g * (3 - 2 * g), A0 = L[k], A1 = L[k + 1];
          for (let x = 0; x < W; x++) {
            const i = ((top + j) * W + x) * 4, q = (j * W + x) * 4;
            const al = A0[i + 3] + (A1[i + 3] - A0[i + 3]) * fr;
            if (al < 0.5) { o[q + 3] = 0; continue; }
            for (let ch = 0; ch < 3; ch++) { const cv = A0[i + ch] + (A1[i + ch] - A0[i + ch]) * fr; o[q + ch] = (cv * (1 - v) + al * v * (ch === 2 ? 0.79 : 0.77)) * 255 / al; }
            o[q + 3] = al * ramp;
          }
        }
        cx.putImageData(out, 0, 0);
        fz.style.cssText = `left:${-p / aw * 100}%;right:${-p / aw * 100}%;top:${y0 / ah * 100}%;bottom:${-p / ah * 100}%;`;
      };
      if (!img._frostOn) { img._frostOn = true; img.addEventListener('load', () => { img._loads = (img._loads || 0) + 1; if (img._frostPaint) img._frostPaint(); }); }
      img._frostPaint = paint;
      if (img.complete) paint();
    }
    _placeholder(art) {
      if (art.querySelector('i')) return;
      art.classList.add('ph');
      art.innerHTML = this._config.kind === 'activity' ? `<i style="--i:url(&quot;${MD_GAME}&quot;)"></i>` : this._tv() ? `<i style="--i:url('${esc(iconUrl('tv'))}')"></i>` : `<i style="--i:url(&quot;${MD_NOTE}&quot;)"></i>`;
    }
  }
  if (!customElements.get('hemma-media-panel')) customElements.define('hemma-media-panel', HemmaMediaPanel);
  // The full-screen player. Its artwork grows out of the tile or popup it was opened from and shrinks back into it.
  const artOf = (el) => {
    if (!el) return null;
    if (el.tagName === 'IMG' || (el.classList && el.classList.contains('art'))) return el;
    let best = null, area = 0;
    const walk = (r) => r.querySelectorAll('*').forEach((n) => {
      if (n.shadowRoot) walk(n.shadowRoot);
      const b = n.getBoundingClientRect();
      const pic = n.tagName === 'IMG' || /url\(/.test(getComputedStyle(n).backgroundImage);
      if (pic && b.width > 30 && Math.abs(b.width - b.height) < b.width * 0.5 && b.width * b.height > area) { best = n; area = b.width * b.height; }
    });
    walk(el.shadowRoot || el);
    return best || el;
  };
  const FULL = { layer: null };
  const clearSh = (sh) => (sh && sh !== 'none' ? sh.replace(/rgba?\(([^,]+),([^,]+),([^,)]+)(,[^)]*)?\)/g, 'rgba($1,$2,$3, 0)') : 'rgba(0, 0, 0, 0) 0px 30px 80px -24px');
  const artLook = (el, rad, other) => { const cs = getComputedStyle(el), bs = cs.boxShadow, pb = el.parentNode && el.parentNode.nodeType === 1 ? getComputedStyle(el.parentNode, '::before').boxShadow : 'none', sh = bs && bs !== 'none' ? bs : pb; return { rad: parseFloat(cs.borderTopLeftRadius) || rad, sh: sh && sh !== 'none' ? sh : clearSh(other) }; };
  // The flying artwork is a box that resizes with the picture cropped inside it, so its shadow travels with it; a clip would cut the shadow off.
  const artGhost = (dest, r, look, frost) => {
    const g = document.createElement('div');
    g.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${look.rad}px;overflow:hidden;z-index:2147483091;pointer-events:none;background:rgba(255,255,255,0.1);box-shadow:${look.sh};`;
    if (dest.tagName === 'IMG') { const i = document.createElement('img'); i.src = dest.currentSrc || dest.src; i.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;'; g.appendChild(i); }
    const fz = dest.parentNode && dest.parentNode.querySelector && dest.parentNode.querySelector(':scope > .fz'), fc = fz && fz.firstChild;
    if (fc && fc.width && !fz.hidden && getComputedStyle(fz).display !== 'none') {
      const f = document.createElement('div'), c = document.createElement('canvas');
      f.className = 'gfz';
      f.style.cssText = fz.style.cssText + `position:absolute;opacity:${frost};`;
      c.width = fc.width; c.height = fc.height;
      try { c.getContext('2d').drawImage(fc, 0, 0); } catch (_) {}
      c.style.cssText = 'display:block;width:100%;height:100%;';
      f.appendChild(c);
      g.appendChild(f);
      g.style.overflow = 'visible';
      g.firstChild.style.borderRadius = 'inherit';
    }
    camHost().appendChild(g);
    return g;
  };
  const artFly = (g, ra, la, rb, lb, dur, E, fill) => {
    const k = (r, l) => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: l.rad + 'px', boxShadow: l.sh });
    const f = g.querySelector('.gfz');
    if (f) f.animate([{ opacity: fill ? 1 : 0 }, { opacity: fill ? 0 : 1 }], { duration: dur * 0.8, easing: 'ease-out', fill: 'forwards' });
    return g.animate([k(ra, la), k(rb, lb)], { duration: dur, easing: E, fill: fill ? 'forwards' : 'none' });
  };
  window.hemmaMediaFull = {
    open(cfg, origin, fromPopup) {
      if (FULL.layer) return;
      const src = artOf(origin);
      const layer = document.createElement('div');
      layer.className = 'hemma-media-full';
      layer.style.cssText = 'position:fixed;inset:0;z-index:2147483090;background:#111;';
      const panel = document.createElement('hemma-media-panel');
      panel.setConfig(Object.assign({}, cfg, { full: true }));
      layer.appendChild(panel);
      camHost().appendChild(layer);
      FULL.layer = layer; FULL.cfg = cfg; FULL.origin = origin; FULL.fromPopup = !!fromPopup; FULL.src = src; FULL.resume = cfg.resume || null;
      panel.hass = CAMS.hassNow();
      FULL.tick = setInterval(() => { const h = CAMS.hassNow(); if (h && h !== panel._hass) panel.hass = h; }, 500);
      FULL.key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); window.hemmaMediaFull.close(); } };
      document.addEventListener('keydown', FULL.key, true);
      if (fromPopup && window.hemmaPopup) window.hemmaPopup.close();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const E = 'cubic-bezier(0.32, 0.72, 0, 1)';
      // As the camera page: it slides up, a downward swipe puts it away, and closing shrinks the artwork back into the tile.
      // Safari draws only the on-screen strip of a layer that starts below the screen; painted in place first, the whole sheet slides up.
      layer.style.opacity = '0.01'; layer.style.willChange = 'transform';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (FULL.layer !== layer) return;
        layer.style.opacity = '';
        layer.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: reduce ? 1 : 480, easing: E }).finished.then(() => { layer.style.willChange = ''; }, () => {});
      }));
      swipeAway(layer, ['bar', 'level', 'spk', 'gmenu', 'rpage'], () => window.hemmaMediaFull.close());
      // A tap on the empty backdrop closes it, as anywhere outside a popup does; the artwork and controls keep their taps.
      let busy = false;
      layer.addEventListener('pointerdown', () => { const R = panel.shadowRoot; busy = !!(R && R.querySelector('.wrap.rem, .spk, .gmenu')); }, true);
      layer.addEventListener('click', (e) => {
        if (busy) return;
        const t = e.composedPath()[0];
        if (!t || !t.classList || !['hemma-media-full', 'wrap', 'slab', 'glow'].some((c) => t.classList.contains(c)) && t !== layer && t.tagName !== 'HEMMA-MEDIA-PANEL') return;
        if (t.closest && t.closest('.rpage, .spk, .gmenu')) return;
        window.hemmaMediaFull.close();
      });
    },
    close() {
      const layer = FULL.layer;
      if (!layer) return;
      FULL.layer = null;
      // Opened from the screensaver, it goes back to the screensaver, which starts underneath as the player slides away.
      if (FULL.resume && window.hemmaSaver) {
        const r = FULL.resume; FULL.resume = null; FULL.src = null;
        if (SAVER.handT) { clearTimeout(SAVER.handT); SAVER.handT = 0; }
        else if (!SAVER.layer) { window.hemmaSaver.start(Object.assign({}, r, { instant: true })); SAVER.opts = r; }
      }
      clearInterval(FULL.tick);
      document.removeEventListener('keydown', FULL.key, true);
      const panel = layer.querySelector('hemma-media-panel');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const E = 'cubic-bezier(0.32, 0.72, 0, 1)';
      let target = null;
      // Back into the popup: it opens underneath, already in place, and the artwork flies into its spot there.
      if (FULL.fromPopup && window.hemmaPopup) {
        window.hemmaPopup.open({ title: '', dismissable: true, close: false, style: '--popup-min-width: 340px; --popup-max-width: 340px; --popup-min-width-narrow: 340px; --hemma-popup-radius: 34px; --hemma-popup-tint: rgba(0, 0, 5, 0.16);', content: FULL.cfg });
        const sf = window.hemmaPopup.surface;
        const el = window.hemmaPopup.element;
        [sf, el && el.shadowRoot].forEach((r) => { if (r && r.getAnimations) r.getAnimations({ subtree: true }).forEach((x) => { try { x.finish(); } catch (_) {} }); });
        try { (el && el.shadowRoot ? el.shadowRoot : document).getAnimations && document.getAnimations().forEach((x) => { try { if (x.effect && x.effect.target && el && (el.contains(x.effect.target) || el.shadowRoot.contains(x.effect.target))) x.finish(); } catch (_) {} }); } catch (_) {}
        const find = () => { const q = [sf]; while (q.length) { const r = q.shift(); if (!r || !r.querySelectorAll) continue; const p = [...r.querySelectorAll('hemma-media-panel')][0]; if (p && p.shadowRoot) return p.shadowRoot.querySelector('.slab > .art img') || p.shadowRoot.querySelector('.slab > .art'); r.querySelectorAll('*').forEach((n) => { if (n.shadowRoot) q.push(n.shadowRoot); }); } return null; };
        // The popup's artwork may still be loading: wait a few frames for it to have a place, then fly.
        let n = 0;
        const ready = () => {
          target = find();
          const ok = target && target.getBoundingClientRect().width && (target.tagName !== 'IMG' || target.complete);
          if (!ok && n++ < 30) { requestAnimationFrame(ready); return; }
          let last = 0, calm = 0, k = 0;
          const settle = (ts) => {
            if (last) calm = ts - last < 22 ? calm + 1 : 0;
            last = ts;
            if (++k < 20 && calm < 2) { requestAnimationFrame(settle); return; }
            target = find() || target;
            this._land(layer, panel, target, reduce, E);
          };
          requestAnimationFrame(settle);
        };
        ready();
        return;
      } else if (FULL.src && FULL.src.isConnected) target = FULL.src;
      this._land(layer, panel, target, reduce, E);
    },
    _land(layer, panel, target, reduce, E) {
      const dest = panel && panel.shadowRoot && (panel.shadowRoot.querySelector('.slab > .art img') || panel.shadowRoot.querySelector('.slab > .art'));
      let done = () => { layer.remove(); if (FULL.hid) { FULL.hid.style.visibility = ''; FULL.hid = null; } if (target) target.style.visibility = ''; };
      const back = target ? target.getBoundingClientRect() : null;
      if (reduce || !dest || !back || !back.width) {
        layer.animate([{ transform: layer.style.transform || 'none' }, { transform: 'translateY(100%)' }], { duration: reduce ? 1 : 380, easing: E, fill: 'forwards' }).finished.then(done, done);
        return;
      }
      target.style.visibility = 'hidden';
      const r1 = dest.getBoundingClientRect(), start = artLook(dest, 18), end = artLook(target, 12, start.sh);
      const gh = artGhost(dest, r1, start, 1);
      dest.style.visibility = 'hidden';
      const dur = 460;
      const fl = artFly(gh, r1, start, back, end, dur, E, true);
      fl.pause();
      requestAnimationFrame(() => requestAnimationFrame(() => fl.play()));
      const done0 = done;
      done = () => { gh.remove(); done0(); };
      [...panel.shadowRoot.querySelectorAll('.fcol, .rmb')].forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
      // Straight back to the dashboard: the blurred colors fade off it, never through black.
      layer.style.background = 'transparent';
      const w = panel.shadowRoot.querySelector('.wrap.med');
      if (w) w.style.background = 'transparent';
      const g = panel.shadowRoot.querySelector('.glow');
      if (g) g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.85, easing: 'ease-out', fill: 'forwards' });
      fl.finished.then(done, done);
    },
    get open_() { return !!FULL.layer; },
  };

  const ACT_ON = ['on', 'open', 'opening', 'unlocked', 'unlocking', 'playing', 'buffering', 'home', 'connected', 'online', 'cooling', 'heating', 'cleaning', 'running', 'active'];
  const ACT_CSS = `
    .acts-wrap .ctl, .acts-wrap .run, .acts-wrap .orb { margin: 26px 0 0; }
    .acts-wrap .ctl.white .fill { background: #fff; }
    .acts-wrap .ctl.white .glyph { background: rgba(var(--hv-pd, 0,0,0),0.78); }
    .acts-wrap .ctl.white.closed .glyph { background: rgba(var(--hv-pk, 255,255,255),0.55); }
    .run, .orb { flex: none; width: 112px; height: 112px; border-radius: 50%; border: 0; padding: 0; margin: auto 0 0; display: grid; place-items: center; cursor: pointer; background: rgba(var(--hv-pd, 0,0,0),0.24); transition: background-color .3s ease, filter .4s ease; -webkit-tap-highlight-color: transparent; }
    .run i, .orb i { width: 44px; height: 44px; display: block; background: #fff; -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .orb ha-icon, .run ha-icon { --mdc-icon-size: 44px; color: var(--hv-pi, #fff); }
    .orb.on, .run.on { background: var(--hemma-color-teal, #00C3D0); }
    .run:active { filter: brightness(0.84); }
    /* A device's extra functions as small tiles in the dashboard's own style, white when on, each with its state. */
    .btns { flex: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: min(100%, 300px); margin: 26px 0 66px; }
    .btns:has(> .btn:only-child) { grid-template-columns: minmax(0, 1fr); width: min(100%, 150px); }
    .btns:empty { display: none; }
    .btn { position: relative; height: 60px; border: 0; border-radius: 18px; padding: 0 12px 0 10px; display: flex; align-items: center; gap: 10px; min-width: 0; text-align: left;
      background: rgba(var(--hv-pd, 0,0,0),0.26); color: var(--hv-pi, #fff); font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color .3s ease, color .3s ease, filter .4s ease; }
    .btn.on { background: rgba(255,255,255,0.94); color: #1c1c1e; }
    .btn .ic { position: relative; flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: rgba(var(--hv-pk, 255,255,255),0.12); transition: background-color .3s ease; }
    .btn.on .ic { background: var(--act-on, var(--hemma-color-teal, #00C3D0)); }
    .btn.dead { opacity: 0.45; }
    .btn.on i { background: #fff; }
    .btn i { width: 19px; height: 19px; display: block; background: var(--hv-pi, #fff); -webkit-mask: var(--i) center / contain no-repeat; mask: var(--i) center / contain no-repeat; }
    .btn ha-icon { --mdc-icon-size: 19px; color: var(--hv-pi, #fff); }
    .btn.on ha-icon { color: #fff; }
    .btn .tx { display: grid; min-width: 0; line-height: 1.2; }
    .btn .tx b, .btn .tx small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .btn .tx b { font-size: 14px; font-weight: 600; }
    .btn .tx small { font-size: 12.5px; font-weight: 500; color: rgba(var(--hv-pk2, 235,235,245),0.6); }
    .btn.on .tx small { color: rgba(60,60,67,0.6); }
    @media (min-width: 769px) { .btns { margin-bottom: 0; } :host .wrap.acts-wrap > :is(.ctl, .run, .orb) { margin: 30px 0 0; } }
    .acts-wrap.bare .btns { display: flex; justify-content: center; width: auto; }
    .acts-wrap.bare .btn { width: 60px; padding: 0; justify-content: center; }
    .acts-wrap.bare .btn .tx { display: none; }
    .knob ha-icon { --mdc-icon-size: 26px; color: var(--hv-pi, #fff); }
    @media (hover: hover) { .btn:hover, .orb:hover, .run:hover { filter: brightness(0.84); transition: filter .18s ease, background-color .3s ease; } }
    @media (max-width: 768px) {
      .btns { margin-bottom: 80px; }
      :host .wrap.acts-wrap > :is(.ctl, .run, .orb) { margin: auto 0 0; }
      :host .wrap.acts-wrap > .btns { margin: 40px 0 auto; padding-bottom: 80px; box-sizing: content-box; }
    }
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
      root.innerHTML = `<style>${SHEET_CSS}${COVER_CSS}${ACT_CSS}${BIG_CSS}${CAPS_CSS}</style><div class="wrap cover acts-wrap${this._config.show_names === false ? ' bare' : ''}"><div class="hd"><b></b><span></span></div>${main}`
        + `<div class="btns">${this._slots().map((n) => `<button type="button" class="btn" data-n="${n}" data-icon="${esc(this._btnIcon(n))}"><span class="ic">${this._glyph(this._btnIcon(n))}</span><span class="tx"><b></b><small></small></span></button>`).join('')}</div>`
        + `<button type="button" class="corner gear" aria-label="${esc(T('lights.settings', 'Settings'))}"><i style="--i:url(&quot;${GEAR_SOLID}&quot;)"></i></button></div>`;
      root.querySelector('.gear').onclick = () => moreInfo(this, this._config.entity);
      root.querySelectorAll('.btn').forEach((b) => {
        b.onclick = (e) => {
          e.stopPropagation();
          const n = Number(b.dataset.n), ch = this._choices(n);
          if (!ch) return this._run(n);
          // The icon toggles, as on a dashboard tile; the rest of the tile opens the menu.
          if (ch.items.length === 2 && ch.flip && e.target.closest('.ic')) return ch.pick(ch.items.find((it) => it[0] !== ch.current)[0]);
          capPick(b, ch.items, ch.current, ch.pick);
        };
      });
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
    // An action whose entity has states to choose between opens a menu, as every other popup's fields do: Off and On for a switch, the options of a select.
    _choices(n) {
      const c = this._config, id = c['action_' + n + '_entity'], act = c['action_' + n + '_action'] || 'more-info', s = this._st(id);
      if (!s || (act !== 'toggle' && act !== 'more-info')) return null;
      const d = String(id).split('.')[0], call = (dom, svc, data) => this._hass.callService(dom, svc, Object.assign({ entity_id: id }, data || {})).catch(() => {});
      if (['switch', 'input_boolean', 'light', 'fan', 'siren', 'automation', 'humidifier', 'remote'].includes(d))
        return { flip: true, items: [['off', T('lights.off', 'Off')], ['on', T('lights.on', 'On')]], current: s.state === 'on' ? 'on' : 'off', pick: (v) => call('homeassistant', v === 'on' ? 'turn_on' : 'turn_off') };
      if (d === 'cover')
        return { flip: true, items: [['open', T('cover.open', 'Open')], ['closed', T('cover.closed', 'Closed')]], current: ['open', 'opening'].includes(s.state) ? 'open' : 'closed', pick: (v) => call('cover', v === 'open' ? 'open_cover' : 'close_cover') };
      if (d === 'lock')
        return { flip: true, items: [['locked', T('lock.locked', 'Locked')], ['unlocked', T('lock.unlocked', 'Unlocked')]], current: s.state === 'unlocked' ? 'unlocked' : 'locked', pick: (v) => call('lock', v === 'locked' ? 'lock' : 'unlock') };
      if ((d === 'select' || d === 'input_select') && Array.isArray(s.attributes.options) && s.attributes.options.length)
        return { items: s.attributes.options.map((o) => [String(o), String(o)]), current: s.state, pick: (v) => call(d, 'select_option', { option: v }) };
      return null;
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
        const state = (c['action_' + n + '_action'] === 'navigate') ? T('actions.open', 'Open') : this._fmt(s);
        const tip = this._label(n) + ' · ' + state;
        b.querySelector('.tx b').textContent = this._label(n);
        b.querySelector('.tx small').textContent = state;
        const icon = this._btnIcon(n);
        if (b.dataset.icon !== icon) { b.dataset.icon = icon; b.querySelector('.ic').innerHTML = this._glyph(icon); }
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
    .scrim { position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center; padding:0 24px; background:rgba(var(--hv-pd, 0,0,0),0.22);
      animation:dim .30s ease both; font-family:var(--hemma-font, -apple-system, system-ui, sans-serif); -webkit-tap-highlight-color:transparent; }
    .box { position:relative; width:min(290px, 100%); border-radius:28px; text-align:center; color:var(--hv-pi, #fff); }
    .glass { position:absolute; inset:0; border-radius:inherit; pointer-events:none;
      background-color:rgba(30,33,38,0.30); -webkit-backdrop-filter:blur(40px) saturate(170%); backdrop-filter:blur(40px) saturate(170%);
      animation:glassIn .48s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
    .content { position:relative; box-sizing:border-box; padding:22px 16px 16px; animation:contentIn .48s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
    .t { font-size:17px; font-weight:600; line-height:1.3; letter-spacing:-0.01em; margin:0 4px 16px; overflow-wrap:anywhere; }
    .r { display:flex; gap:10px; }
    button { position:relative; flex:1; height:44px; border:0; border-radius:999px; font:inherit; font-size:16px; cursor:pointer; color:var(--hv-pi, #fff);
      background:rgba(var(--hv-pk, 255,255,255),0.12); box-shadow:inset 0 0.5px 0 rgba(255,255,255,0.22);
      -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
    button.ok { font-weight:600; background:rgba(0,195,208,0.82); }
    .danger button.ok { background:rgba(255,66,69,0.85); }
    button::after { content:""; position:absolute; inset:0; border-radius:inherit; background:#fff; opacity:0; transition:opacity .40s ease; pointer-events:none; }
    @media (hover: hover) { button:hover::after { opacity:.07; transition:opacity .18s ease; } }
    button:active::after { opacity:.12; transition:opacity .08s ease; }
    button:focus-visible { outline:2px solid rgba(var(--hv-pk, 255,255,255),0.6); outline-offset:2px; }
    .out { animation:undim .28s ease both; }
    .out .glass { animation:glassOut .24s cubic-bezier(0.4, 0, 1, 1) both; }
    .out .content { animation:contentOut .24s cubic-bezier(0.4, 0, 1, 1) both; }
    @keyframes dim { from { background-color:rgba(var(--hv-pd, 0,0,0),0); } }
    @keyframes undim { to { background-color:rgba(var(--hv-pd, 0,0,0),0); } }
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
  // A damped spring sampled into linear(), so the morph settles.
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

  // Collapse: the tile's icon appears partway and rides the shrinking shape home, then its name and state fade in.
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
  // Safari paints a new element's image or mask a few frames late, so a copy's icon is drawn on a canvas from an image already decoded.
  const masks = new Map();
  const maskImg = (url) => {
    let m = masks.get(url);
    if (!m) { m = new Image(); m.src = url; masks.set(url, m); m.decode().catch(() => {}); }
    return m.complete && m.naturalWidth ? m : null;
  };
  const fitIn = (iw, ih, w, h, fit) => {
    if (fit === 'fill' || !iw || !ih) return [0, 0, w, h];
    const k = fit === 'cover' ? Math.max(w / iw, h / ih) : fit === 'none' ? 1 : Math.min(w / iw, h / ih);
    return [(w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k];
  };
  const canvasOf = (w, h, draw) => {
    const c = document.createElement('canvas'), k = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    const ctx = c.getContext('2d'); ctx.scale(k, k); draw(ctx);
    return c;
  };
  const paintMask = (cs, box, w, h) => {
    const url = /url\(["']?([^"')]+)["']?\)/.exec(cs.webkitMaskImage || cs.maskImage || '');
    if (!url || cs.backgroundImage !== 'none' || !/contain/.test(cs.webkitMaskSize || cs.maskSize || '')) return;
    const img = maskImg(url[1]);
    if (!img) return;
    const c = canvasOf(w, h, (ctx) => {
      ctx.drawImage(img, ...fitIn(img.naturalWidth, img.naturalHeight, w, h, 'contain'));
      ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = cs.backgroundColor; ctx.fillRect(0, 0, w, h);
    });
    c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;';
    ['mask', '-webkit-mask', 'background'].forEach((k) => box.style.setProperty(k, 'none'));
    box.appendChild(c);
  };
  const cloneShown = (el) => {
    const r = layoutRect(el);
    const box = document.createElement('div');
    const bcs = copyStyle(el, box);
    paintMask(bcs, box, r.width, r.height);
    if (/hidden|clip/.test(bcs.overflow) && parseFloat(bcs.borderTopLeftRadius)) box.style.overflow = 'hidden';
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
      const lr = layoutRect(k);
      let d = null;
      if (k.tagName === 'IMG' && k.complete && k.naturalWidth) {
        try { d = canvasOf(lr.width, lr.height, (ctx) => ctx.drawImage(k, ...fitIn(k.naturalWidth, k.naturalHeight, lr.width, lr.height, getComputedStyle(k).objectFit))); } catch (_) { d = null; }
      }
      if (!d && k.tagName === 'IMG') { d = document.createElement('img'); d.src = k.src; }
      if (!d) d = document.createElement('div');
      const kcs = copyStyle(k, d);
      if (d.tagName === 'DIV') paintMask(kcs, d, lr.width, lr.height);
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
  // Expand: the tile's own icon and text ride the growing shape and fade early.
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
  // Faded on ha-card, not the host: opacity on the host makes a backdrop root and drops the tile's frost mid-fade.
  const LAND = 0.92, LAND_CARD = 0.7;
  const tileFade = (card, dur, out, late) => {
    const el = (card.shadowRoot && card.shadowRoot.querySelector('ha-card')) || card;
    const look = late && tileLook(card), swap = look && alphaOf(look.fill) < 0.95;
    const at = late === 'card' ? LAND_CARD : LAND;
    const a = el.animate(out ? [{ opacity: 0 }, { opacity: 0, offset: swap ? at : late ? 0.4 : 0.35 }, { opacity: 1, offset: swap ? at : late ? 0.6 : 0.7 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0, offset: 0.25 }, { opacity: 0 }],
      { duration: dur, easing: 'linear', fill: 'forwards' });
    if (!out) a.finished.then(() => { card.style.visibility = 'hidden'; a.cancel(); }).catch(() => {});
    return a;
  };
  // The tile's fill drains at once and the glass stays see-through until it frosts over at the end.
  const rgba = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); const p = m ? m[1].split(',').map(Number) : [0, 0, 0, 0]; return p.length > 3 ? p : p.concat(1); };
  const mix = (x, y, k, ka) => { const a = rgba(x), b = rgba(y); return `rgba(${[0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k)).join(', ')}, ${(a[3] + (b[3] - a[3]) * ka).toFixed(3)})`; };
  // The tile turns to gray glass within a few frames, then darkens steadily; filter lists must match end to end or they jump.
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
  // The tile becomes the panel's main control: same spot, size, corners and colors, its icon travelling into the control's.
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
    // The control shrinks as itself first and only widens into the tile at the end.
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
    else if (!grow && hero.land) box.animate(hero.card ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: LAND_CARD }, { opacity: 0, offset: LAND_CARD }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 1, offset: LAND }, { opacity: 0, offset: LAND }, { opacity: 0 }], { duration: dur, easing: 'linear', fill: 'forwards' });
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
        : [{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1, offset: 0.55 }, { opacity: 1, offset: LAND_CARD }, { opacity: 0, offset: LAND_CARD }, { opacity: 0 }], { duration: dur, easing: 'linear', fill: 'forwards' });
    }
    // A control lands as the tile: its name and state settle in on the card before it hands over.
    if (!grow && hero.land && !hero.card && card.shadowRoot) {
      const csr = card.shadowRoot, words = document.createElement('div');
      words.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:1;';
      ['#name', '#state', '#label'].forEach((sel) => { const n = csr.querySelector(sel); if (n && n.textContent.trim() && n.getBoundingClientRect().width) words.appendChild(cloneText(n).el); });
      layer.appendChild(words);
      words.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1, offset: 0.75 }, { opacity: 1, offset: LAND }, { opacity: 0, offset: LAND }, { opacity: 0 }], { duration: dur, easing: 'linear', fill: 'forwards' });
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
          : [{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1, offset: 0.85 }, { opacity: 1 }], { duration: dur, easing: 'linear', fill: 'forwards' }));
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
      if (!grow) mine.animate([{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1, offset: 0.45 }].concat(hero.land
        ? [{ opacity: 1, offset: hero.card ? LAND_CARD : LAND }, { opacity: 0, offset: hero.card ? LAND_CARD : LAND }, { opacity: 0 }]
        : [{ opacity: 1, offset: 0.6 }, { opacity: 0, offset: 0.8 }, { opacity: 0 }]), { duration: dur, easing: 'linear', fill: 'forwards' });
    }
  };
  // The tile overshoots by about a point once it lands, then settles.
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
