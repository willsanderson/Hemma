// Hemma's own cards, built on the home-wide settings the integration stores (hemma/home/*).
(function () {
  if (window._hemmaCards) return;
  window._hemmaCards = true;

  const T = (k, en, v) => (window._hemmaT ? window._hemmaT(k, en, v) : String(en).replace(/\{(\w+)\}/g, (m, p) => (v && p in v ? v[p] : m)));
  const iconUrl = (name) => (window.hemmaIconUrl ? window.hemmaIconUrl(name)
    : (window.HEMMA_ICONS && window.HEMMA_ICONS[name]) || `/hemma_assets/icons/${name}.svg`);
  const COLORS = {
    yellow: '#FFCC00', amber: '#ffb254', orange: '#FF9230', red: '#FF4245', pink: '#ff4d70', purple: '#9333ea',
    blue: '#0088FF', ice: '#3cd3fe', teal: '#00C3D0', mint: '#00C8B3', green: '#30D158', gold: '#e5a00d', neutral: '#CDCDCF',
  };
  const colorOf = (key) => (COLORS[key] ? `var(--hemma-color-${key}, ${COLORS[key]})` : 'var(--hemma-color-neutral, #CDCDCF)');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // One subscription per connection, shared by every card on the page.
  const store = window._hemmaHomeStore = window._hemmaHomeStore || { data: { status_badges: [] }, subs: new Set(), conn: null };
  store.ensure = function (hass) {
    const conn = hass && hass.connection;
    if (!conn || store.conn === conn) return;
    store.conn = conn;
    conn.subscribeMessage((data) => {
      store.data = data || { status_badges: [] };
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
      }).filter(Boolean);
    }
    _render() {
      const items = this._items();
      const key = JSON.stringify(items);
      if (key === this._key) return;
      this._key = key;
      this.toggleAttribute('empty', !items.length);
      this.shadowRoot.innerHTML = `<style>${CSS}</style>` + items.map((it) =>
        `<button class="b" data-entity="${esc(it.entity)}" aria-label="${esc(it.name + ', ' + it.sub)}">`
        + `<span class="i" style="--c:${it.color};--m:url('${esc(iconUrl(it.icon))}')"></span>`
        + `<span class="w"><span class="t">${esc(it.name)}</span><span class="s">${esc(it.sub)}</span></span></button>`).join('');
      this.shadowRoot.querySelectorAll('.b').forEach((el) => el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
      }));
    }
  }
  if (!customElements.get('hemma-status-badges')) customElements.define('hemma-status-badges', HemmaStatusBadges);
})();
