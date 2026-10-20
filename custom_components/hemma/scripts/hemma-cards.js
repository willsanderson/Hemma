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
      animation:glassIn .48s cubic-bezier(0.3, 1.35, 0.5, 1) both; }
    .content { position:relative; box-sizing:border-box; padding:22px 16px 16px; animation:contentIn .48s cubic-bezier(0.3, 1.35, 0.5, 1) both; }
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
  const spring = (response, damping) => {
    const w0 = 2 * Math.PI / response, wd = w0 * Math.sqrt(1 - damping * damping);
    const x = (t) => 1 - Math.exp(-damping * w0 * t) * (Math.cos(wd * t) + (damping * w0 / wd) * Math.sin(wd * t));
    const dur = Math.log(1000) / (damping * w0);
    const pts = [];
    for (let i = 0; i <= 60; i++) pts.push(i === 60 ? 1 : +x(dur * i / 60).toFixed(4));
    return { ease: 'linear(' + pts.join(', ') + ')', dur: Math.round(dur * 1000) };
  };
  const SPRING = window.CSS && CSS.supports && CSS.supports('animation-timing-function', 'linear(0, 1)');
  const GROW = SPRING ? spring(0.34, 0.86) : { ease: 'cubic-bezier(0.3, 1.2, 0.5, 1)', dur: 380 };
  const SHRINK = SPRING ? spring(0.3, 0.92) : { ease: 'cubic-bezier(0.3, 0.95, 0.4, 1)', dur: 300 };
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
        width: pc.width === 'auto' ? '100%' : pc.width, height: pc.height === 'auto' ? '100%' : pc.height });
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
    if (!el.children.length && el.textContent.trim()) { box.textContent = el.textContent.trim(); box.style.width = 'auto'; }
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
      if (n && n.textContent.trim() && n.getBoundingClientRect().width) parts.push(cloneShown(n));
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
  window.hemmaMorph = { look: tileLook, grow: GROW, shrink: SHRINK, settle };

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
    let tile = wide && card ? tileLook(card) : null;
    let W = 0, H = 0, fx = 0, fy = 0;
    if (tile) {
      const b = box.getBoundingClientRect();
      W = b.width; H = b.height;
      const m = 16, vw = window.innerWidth, vh = window.innerHeight, t = tile.rect;
      fx = Math.max(m, Math.min(vw - m - W, t.left + t.width / 2 - W / 2));
      fy = Math.max(m, Math.min(vh - m - H, t.top + t.height / 2 - H / 2));
      Object.assign(box.style, { position: 'fixed', left: fx + 'px', top: fy + 'px', width: W + 'px', margin: '0' });
      Object.assign(glass.style, { animation: 'none', inset: 'auto', left: '0', top: '0', width: W + 'px', height: H + 'px', overflow: 'hidden' });
      content.style.animation = 'none';
      card.style.visibility = 'hidden';
      const from = frame(t.left - fx, t.top - fy, t.width, t.height, tile.radius, tile.fill, tile.blur, 0);
      glass.animate([from, frame(0, 0, W, H, 28, 'rgba(30,33,38,0.30)', 40, 1)], { duration: GROW.dur, easing: GROW.ease, fill: 'backwards' });
      content.animate([{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }], { duration: GROW.dur, easing: GROW.ease, fill: 'backwards' });
      content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GROW.dur * 0.45, delay: GROW.dur * 0.25, easing: 'ease-out', fill: 'backwards' });
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
