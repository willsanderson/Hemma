window.hemmaMenuGlass = {
  radius: 'var(--hemma-menu-radius, var(--ha-card-border-radius, 28px))',

  _ensure: function () {
    if (document.getElementById('hemma-menu-radius-style')) return;
    var st = document.createElement('style');
    st.id = 'hemma-menu-radius-style';
    st.textContent = '.hemma-menu-glass,.hemma-menu-glass *{'
      + 'scrollbar-width:none;-ms-overflow-style:none;}'
      + '.hemma-menu-glass ::-webkit-scrollbar{display:none;width:0;height:0;}'
      + '.hemma-menu-glass::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:2;'
      + 'background:linear-gradient(to bottom, rgba(255,255,255,0.40), rgba(255,255,255,0.10) 22%,'
      + ' rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.07) 78%, rgba(255,255,255,0.20));'
      + '-webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);-webkit-mask-composite:xor;'
      + 'mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);mask-composite:exclude;}'
      + '.hemma-menu-glass.light [role=menuitem], .hemma-menu-glass.light [role=menuitem] > ha-icon{color:var(--hemma-menu-ink) !important;}'
      + '.hemma-menu-glass.light [role=menuitem] > span:first-child:not(:last-child){background:var(--hemma-menu-ink) !important;}'
      + '.hemma-menu-glass.light::before{background:linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.3) 22%,'
      + ' rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.18) 78%, rgba(255,255,255,0.45));}'
      // The panel's menus, not the card radius: a dropdown is chrome and reads as
      // a different object from the cards it floats over.
      + '.hemma-menu-glass{--hemma-menu-radius:'
      + ' var(--hemma-menu-radius-desktop, 22px);'
      + '--hemma-menu-pane-auto: rgba(150,152,158,0.08);'
      + '--hemma-popup-chev-opacity: .35;'
      + '--hemma-menu-shadow: var(--hemma-elevation-floating, 0 8px 20px rgba(0,0,0,0.13));}'
      + '@media (max-width: 767px), (max-height: 500px){'
      + '.hemma-menu-glass{--hemma-menu-radius:'
      + ' var(--hemma-tile-radius-phone, 26px);'
      + '--hemma-menu-pane-auto: rgba(30,33,38,0.44);'
      + '--hemma-popup-chev-opacity: .55;'
      // The phone floats over a busy photo and needs a little more.
      + '--hemma-menu-shadow: var(--hemma-elevation-floating-phone, 0 10px 26px rgba(0,0,0,0.18));}}';
    (document.head || document.documentElement).appendChild(st);
  },

  _vars: ['--hemma-menu-pane', '--hemma-menu-edge', '--hemma-menu-rim-top',
    '--hemma-menu-rim-bottom', '--ha-card-border-radius',
    '--hemma-tile-radius-phone',
    '--hemma-popup-ui-good', '--hemma-popup-ui-warn', '--hemma-popup-ui-bad',
    '--hemma-elevation-floating', '--hemma-elevation-floating-phone',
    '--hemma-popup-ui-action', '--hemma-color-teal', '--hemma-color-blue',
    '--hemma-color-green', '--hemma-color-purple', '--hemma-color-yellow',
    '--hemma-u'],

  _theme: function (el) {
    var src = document.querySelector('home-assistant');
    if (!src) return;
    try {
      var cs = window.getComputedStyle(src);
      this._vars.forEach(function (n) {
        var v = cs.getPropertyValue(n);
        if (v && v.trim()) el.style.setProperty(n, v.trim());
      });
    } catch (e) {}
  },

  apply: function (el) {
    var b = 'var(--hemma-perf-none, blur(32px) saturate(1.1))';
    this._ensure();
    el.classList.add('hemma-menu-glass');
    this._theme(el);
    el.style.borderRadius = this.radius;
    var ha = document.querySelector('home-assistant');
    var themes = ha && ha.hass && ha.hass.themes;
    var light = themes && typeof themes.darkMode === 'boolean' ? !themes.darkMode
      : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    el.classList.toggle('light', light);
    el.style.setProperty('--hemma-menu-ink', light ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)');
    el.style.setProperty('--hemma-menu-lit', light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.18)');
    el.style.color = light ? 'rgba(0,0,0,0.85)' : '#fff';
    el.style.backgroundColor = light ? 'var(--hemma-perf-pill, rgba(250,250,252,0.46))'
      : 'var(--hemma-perf-pill, var(--hemma-menu-pane, var(--hemma-menu-pane-auto, rgba(150,152,158,0.08))))';
    el.style.backgroundImage = 'none';
    el.style.backdropFilter = light ? 'var(--hemma-perf-none, blur(32px) saturate(1.2))' : b;
    el.style.webkitBackdropFilter = el.style.backdropFilter;
    el.style.boxShadow = '0 0 0 0.5px rgba(0,0,0,0.42), var(--hemma-menu-shadow, 0 8px 20px rgba(0,0,0,0.13))';
  },

  enter: function (el) {
    el.style.opacity = '0';
    el.style.transformOrigin = 'top right';
    el.style.transform = 'scale(0.92) translateY(-8px)';
    requestAnimationFrame(function () {
      el.style.transition = 'opacity 200ms cubic-bezier(0.32,0.72,0,1),'
        + ' transform 260ms cubic-bezier(0.32,0.72,0,1)';
      el.style.transform = 'scale(1) translateY(0)';
      el.style.opacity = '1';
    });
  },

  exit: function (el, done) {
    el.style.transition = 'opacity 150ms cubic-bezier(0.4,0,1,1),'
      + ' transform 170ms cubic-bezier(0.4,0,1,1)';
    el.style.transform = 'scale(0.95) translateY(-6px)';
    el.style.opacity = '0';
    setTimeout(function () { if (done) done(); }, 190);
  },

  dropTop: function (rect, gap) {
    var y = rect.bottom;
    var bar = this._navRow();
    if (bar) {
      var r = bar.getBoundingClientRect();
      if (r.height && r.top <= rect.bottom) y = Math.max(y, r.bottom);
    }
    return Math.round(y + (gap == null ? 10 : gap));
  },

  _navRow: function () {
    if (this._row && this._row.isConnected) return this._row;
    this._row = null;
    var walk = function (root, depth) {
      if (!root || depth > 12 || !root.querySelectorAll) return null;
      var hit = root.querySelector('hemma-nav-bar');
      if (hit && hit.shadowRoot) return hit.shadowRoot.querySelector('.bar');
      var kids = root.querySelectorAll('*');
      for (var i = 0; i < kids.length; i++) {
        if (kids[i].shadowRoot) {
          var f = walk(kids[i].shadowRoot, depth + 1);
          if (f) return f;
        }
      }
      return null;
    };
    try { this._row = walk(document, 0); } catch (e) {}
    return this._row;
  },

  lockScroll: function (panel, list) {
    if (!panel || panel._hemmaScrollLocked) return;
    panel._hemmaScrollLocked = true;
    panel.style.overscrollBehavior = 'contain';

    var y = 0;
    panel.addEventListener('touchstart', function (ev) {
      y = ev.touches && ev.touches[0] ? ev.touches[0].clientY : 0;
    }, { passive: true });

    // Non-passive: the whole point is to be able to preventDefault.
    panel.addEventListener('touchmove', function (ev) {
      if (!ev.touches || ev.touches.length !== 1) return;
      var dy = ev.touches[0].clientY - y;
      y = ev.touches[0].clientY;

      if (!list || !list.contains(ev.target)) { ev.preventDefault(); return; }

      var over = list.scrollHeight - list.clientHeight;
      if (over <= 0) { ev.preventDefault(); return; }

      var atTop = list.scrollTop <= 0;
      var atEnd = list.scrollTop >= over - 1;
      if ((dy > 0 && atTop) || (dy < 0 && atEnd)) ev.preventDefault();
    }, { passive: false });
  },
};


(function () {
  if (window._hemmaSidebarSurface) return;
  window._hemmaSidebarSurface = true;

  var ID = 'hemma-sidebar-surface';

  var FILL = 'var(--hemma-sidebar-fill, rgba(0,0,0,0.42))';
  var BLUR = 'var(--hemma-sidebar-backdrop, blur(20px) saturate(1.2))';
  var SCRIM = 'var(--hemma-sidebar-scrim, rgba(0,0,0,0.24))';

  var SURFACE = [
    '  background-color: ' + FILL + ' !important;',
    '  -webkit-backdrop-filter: ' + BLUR + ';',
    '  backdrop-filter: ' + BLUR + ';',
    '  border: none !important;',
    '  box-shadow: none !important;',
  ].join('\n');

  var DRAWER_CSS = [
    '.sidebar-shell {', SURFACE, '}',
    'wa-drawer::part(dialog) {', SURFACE, '}',
  ].join('\n');

  /* The element that actually paints the modal panel. */
  var PANEL_CSS = [
    '.drawer {', SURFACE, '}',
    '.drawer::backdrop { background-color: ' + SCRIM + '; }',
  ].join('\n');

  function sheet(root, css) {
    if (!root) return false;
    var el = root.querySelector('#' + ID);
    if (el) { if (el.textContent !== css) el.textContent = css; return true; }
    var s = document.createElement('style');
    s.id = ID;
    s.textContent = css;
    root.appendChild(s);
    return true;
  }

  function findDeep(root, tag, depth) {
    if (!root || depth > 10 || !root.querySelector) return null;
    var hit = root.querySelector(tag);
    if (hit) return hit;
    var kids = root.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].shadowRoot) {
        var f = findDeep(kids[i].shadowRoot, tag, depth + 1);
        if (f) return f;
      }
    }
    return null;
  }

  var _observed = null;

  function apply() {
    var drawer = findDeep(document, 'ha-drawer', 0);
    if (!drawer || !drawer.shadowRoot) return false;
    sheet(drawer.shadowRoot, DRAWER_CSS);

    if (_observed !== drawer.shadowRoot) {
      _observed = drawer.shadowRoot;
      new MutationObserver(function () { apply(); })
        .observe(drawer.shadowRoot, { childList: true, subtree: true });
    }

    var wa = drawer.shadowRoot.querySelector('wa-drawer');
    if (wa) {
      wa.style.setProperty('--wa-color-surface-raised', FILL);
      wa.style.setProperty('--wa-color-overlay-modal', SCRIM);
      if (wa.shadowRoot) sheet(wa.shadowRoot, PANEL_CSS);
    }
    return true;
  }

  var tries = 0;
  (function tick() {
    apply();
    if (++tries < 20) setTimeout(tick, tries < 6 ? 250 : 1500);
  })();
  window.addEventListener('hass-drawer-opened', apply, true);
  window.addEventListener('location-changed', apply, true);
})();

(function () {
  if (window._hemmaHeaderHide) return;
  window._hemmaHeaderHide = true;

  var ID = 'hemma-header-hide';
  // kiosk-mode's rule can land late or never on a cold start, leaving the hidden header's 56px of padding.
  var CSS = '.header { display: none !important; }'
    + ' #view { padding-top: calc(var(--safe-area-inset-top, 0px) + var(--view-container-padding-top, 0px)) !important; }';
  var OFF = /[?&](hemma_header=1|disable_km)/.test(location.search);
  // kiosk-mode's breakpoint, so one dashboard reads the same under either.
  var NARROW = window.matchMedia('(max-width: 812px)');

  function findDeep(root, tag, depth) {
    if (!root || depth > 10 || !root.querySelector) return null;
    var hit = root.querySelector(tag);
    if (hit) return hit;
    var kids = root.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].shadowRoot) {
        var f = findDeep(kids[i].shadowRoot, tag, depth + 1);
        if (f) return f;
      }
    }
    return null;
  }

  var _root = null;
  function huiRoot() {
    if (_root && _root.isConnected && _root.shadowRoot) return _root;
    _root = findDeep(document, 'hui-root', 0);
    return _root;
  }

  function wanted(cfg) {
    var km = cfg && cfg.kiosk_mode;
    if (!km) return false;
    var m = km.mobile_settings;
    if (m && m.hide_header !== undefined && NARROW.matches) return !!m.hide_header;
    return !!km.hide_header;
  }

  var _sr = null;
  var _head = null;

  function apply() {
    var root = huiRoot();
    var sr = root && root.shadowRoot;
    if (!sr) return false;

    if (_sr !== sr) {
      _sr = sr;
      new MutationObserver(function () { apply(); }).observe(sr, { childList: true });
    }
    var head = sr.querySelector('.header');
    if (head && _head !== head) {
      _head = head;
      new MutationObserver(function () { apply(); }).observe(head, { childList: true, subtree: true });
    }

    var ll = root.lovelace || {};
    var on = !OFF && !ll.editMode && wanted(ll.config);
    var el = sr.querySelector('#' + ID);
    if (on === !!el) return true;
    if (!on) { el.remove(); return true; }
    var st = document.createElement('style');
    st.id = ID;
    st.textContent = CSS;
    sr.appendChild(st);
    return true;
  }

  function kick() {
    var n = 0;
    (function tick() {
      apply();
      if (++n < 12) setTimeout(tick, n < 5 ? 200 : 1200);
    })();
  }
  kick();
  window.addEventListener('location-changed', kick, true);
  window.addEventListener('popstate', kick, true);
  NARROW.addEventListener('change', apply);
})();

// The last answer for this dashboard is applied before the first paint, so a load never shows Focus first.
(function () {
  try {
    var seg = String(location.pathname.split('/')[1] || '');
    if (!seg || localStorage.getItem('hemma_ov_boot') !== seg) return;
    var st = document.documentElement.style;
    st.setProperty('--hemma-page-chrome', 'hidden');
    st.setProperty('--hemma-fx-vis', 'hidden');
    st.setProperty('--hemma-anim-name', 'none');
    st.setProperty('--hero-img-blur', '7px');
    st.setProperty('--hemma-hero-anim-dur', '0s');
    st.setProperty('--hemma-hero-anim-delay', '0s');
    window._hemmaOvBoot = true;
  } catch (e) {}
})();

(function () {
  if (window._hemmaEnergyOn) return;
  window._hemmaEnergyOn = function (V) {
    if (!V || V.show_energy === false) return false;
    if (V.energy_power_entity) return true;
    if (V.energy_usage_today || V.energy_usage_month
      || V.energy_cost_today || V.energy_cost_month) return true;
    for (var i = 1; i <= 6; i++) if (V['energy_entity_' + i]) return true;
    return false;
  };
})();

// ── Performance mode ─────────────────────────────────────────────────────────
(function () {
  if (window._hemmaPerf) return;

  var ID = 'hemma-perf-style';
  var KEY = 'hemma_perf';
  var MODES = { off: 1, on: 1, auto: 1 };

  var DKEY = 'hemma_perf_dash';
  // Seeded from the last resolved Studio setting: it only reaches us when
  // hemma_room renders, by which time the entrance has already started.
  var dashboard = (function () {
    try { return clean(localStorage.getItem(DKEY)) || 'off'; } catch (e) { return 'off'; }
  })();
  var device = null;

  // A backdrop blur costs a full-screen readback per layer per frame. Nulling the
  // variables reaches every card: a document stylesheet cannot cross a shadow
  // boundary, but custom properties inherit through it.
  // Performance mode is about what is on screen the whole time. Popups and
  // dialogs keep their blur: they paint only while open, and the lights
  // popup has no plate, so its rows rely on that blur to read as a layer.
  var CSS = 'html{'
    + '--app-header-backdrop-filter:none!important;'
    + '--ha-card-backdrop-filter:none!important;'
    + '--hemma-toolbar-backdrop:none!important;'
    + '--hemma-glass-backdrop:none!important;'
    + '--hemma-pill-backdrop:none!important;'
    + '--hemma-pill-highlight:none!important;'
    + '--hemma-sidebar-backdrop:none!important;'
    + '--hemma-scene-chip-backdrop:none!important;'
    + '--badge-blur:0px!important;'
    + '--hemma-badge-media-backdrop:none!important;'
    + '--hemma-badge-ring-backdrop:none!important;'
    // The room photo is the one full-screen filter, and it repaints on every swap.
    + '--hemma-view-photo-filter:none!important;'
    + '--hero-img-blur:0px!important;'
    + '--hero-img-blur-mobile:0px!important;'
    + '--hemma-mobile-hero-blur:0px!important;'
    + '--hemma-card-will-change:auto!important;'
    // The nav bar's own blurs and rims (category page, veils, round buttons); the page's scrim turns solid without its blur.
    + '--hemma-perf-none:none!important;'
    + '--hemma-perf-scrim:rgba(14,16,20,0.9)!important;'
    + '--hemma-perf-pill:var(--hemma-perf-pill-fill,rgb(38,40,46))!important;'
    // Entrances stay. Every one of them animates transform and opacity only,
    // which the compositor handles without a repaint, so they cost nothing once
    // the blur above is gone. Suppressing them raced with the delays smart-row
    // writes inline per tile and left a half-played entrance that read as a bug.
    // Opaque stand-ins, or every surface above turns into clear glass.
    + '--hemma-glass-background:var(--hemma-perf-glass-fill,rgb(44,46,52))!important;'
    + '--hemma-pill-fill:var(--hemma-perf-pill-fill,rgb(38,40,46))!important;'
    + '--hemma-sidebar-fill:var(--hemma-perf-sidebar-fill,rgb(18,20,24))!important;'
    + '--badge-background:var(--hemma-perf-badge-fill,rgb(10,12,14))!important;'
    // The tiles. rgba(0,0,0,0.40) was a tint on a blurred photo; with the
    // blur gone it is a window onto the lawn.
    + '--hemma-entity-background:var(--hemma-perf-tile-fill,rgb(32,34,38))!important;'
    + '--ha-card-background:var(--hemma-perf-card-fill,rgb(32,34,38))!important;'
    + '}';

  function clean(v) {
    v = String(v == null ? '' : v).trim().toLowerCase();
    return MODES[v] ? v : '';
  }

  // Fully Kiosk and the companion app each get one start URL, so ?hemma_perf=on
  // has to stick to the device. Every other screen in the house keeps the glass.
  function pinned() {
    var m = /[?&]hemma_perf=([a-z]+)/.exec(location.search || '');
    var v = m ? clean(m[1]) : '';
    if (v) { try { localStorage.setItem(KEY, v); } catch (e) {} return v; }
    try { return clean(localStorage.getItem(KEY)); } catch (e) { return ''; }
  }

  function weak() {
    var n = navigator || {};
    var mem = n.deviceMemory, cpu = n.hardwareConcurrency;
    if (mem && mem <= 4) return true;
    if (cpu && cpu <= 4) return true;
    // Neither is exposed on iOS, where the floor is fast enough not to guess.
    return false;
  }

  function resolve() {
    var v = pinned() || dashboard || 'off';
    if (v === 'auto') {
      if (device === null) device = weak();
      return device;
    }
    return v === 'on';
  }

  function apply() {
    var head = document.head || document.documentElement;
    var el = document.getElementById(ID);
    var want = resolve();
    if (want === !!el) return;
    if (!want) { el.remove(); return; }
    el = document.createElement('style');
    el.id = ID;
    el.textContent = CSS;
    head.appendChild(el);
  }

  window._hemmaPerf = {
    // Called from hemma_room's variable block so the Studio setting lands too.
    // The device pin still wins: the tablet is the one that knows it is slow.
    dashboard: function (v) {
      var next = clean(v) || 'off';
      try { localStorage.setItem(DKEY, next); } catch (e) {}
      if (next !== dashboard) { dashboard = next; apply(); }
      return resolve() ? '1' : '0';
    },
    on: function () { return resolve(); }
  };

  apply();
})();

// ── Number and money formatting ──────────────────────────────────────────────
(function () {
  var hassNow = function () {
    var h = document.querySelector('home-assistant');
    return (h && h.hass) || null;
  };
  var LOCALES = {
    comma_decimal: ['en-US', 'en'], decimal_comma: ['de', 'es', 'it'],
    space_comma: ['fr', 'sv', 'cs'], quote_decimal: ['de-CH'],
  };
  var cache = {};
  var formatter = function (min, max, cur) {
    var hass = hassNow();
    var nf = (hass && hass.locale && hass.locale.number_format) || 'language';
    var lang = (hass && (hass.locale && hass.locale.language || hass.language)) || 'en';
    var key = nf + '|' + lang + '|' + min + '|' + max + '|' + (cur || '');
    if (cache[key]) return cache[key];
    var locale = nf === 'language' ? lang : nf === 'system' ? undefined
      : nf === 'none' ? 'en-US' : (LOCALES[nf] || lang);
    var opts = { minimumFractionDigits: min, maximumFractionDigits: max };
    if (nf === 'none') opts.useGrouping = false;
    if (cur) { opts.style = 'currency'; opts.currency = cur; }
    var f;
    try { f = new Intl.NumberFormat(locale, opts); } catch (e) { f = null; }
    return (cache[key] = f);
  };
  window.hemmaNum = function (v, min, max) {
    var n = Number(v);
    if (v === null || v === undefined || v === '' || !isFinite(n)) return '—';
    var lo = min == null ? 0 : min, hi = max == null ? Math.max(lo, 2) : max;
    var f = formatter(lo, hi, null);
    return f ? f.format(n) : n.toFixed(hi);
  };
  window.hemmaCurrency = function (unit) {
    var u = String(unit || '').trim();
    if (/^[A-Z]{3}$/.test(u)) return u;
    var hass = hassNow();
    var c = hass && hass.config && hass.config.currency;
    return c ? String(c).toUpperCase() : '';
  };
  window.hemmaMoney = function (v, unit, digits) {
    var n = Number(v);
    if (v === null || v === undefined || v === '' || !isFinite(n)) return '—';
    var d = digits == null ? (Math.abs(n) >= 100 ? 0 : 2) : digits;
    var cur = window.hemmaCurrency(unit);
    var f = cur ? formatter(d, d, cur) : null;
    if (f) return f.format(n);
    var u = String(unit || '').trim();
    return (window.hemmaNum(n, d, d) + (u ? ' ' + u : '')).trim();
  };
  // style 'short' is the top bar ("Tue Sep 29"), 'long' sits above the room name ("Tuesday, September 29").
  window.hemmaDate = function (hass, style, when) {
    var h = hass || hassNow() || {};
    var loc = h.locale || {};
    var lang = loc.language || h.language || 'en';
    var long = style === 'long';
    var opts = long ? { weekday: 'long', month: 'long', day: 'numeric' }
      : { weekday: 'short', month: 'short', day: 'numeric' };
    if (loc.time_zone === 'server' && h.config && h.config.time_zone) opts.timeZone = h.config.time_zone;
    var d = when || new Date();
    var df = loc.date_format || 'language';
    var out = '';
    try {
      if (df === 'DMY' || df === 'MDY' || df === 'YMD') {
        var parts = new Intl.DateTimeFormat(lang, opts).formatToParts(d);
        var pick = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ''; };
        out = df === 'DMY' ? pick('weekday') + ' ' + pick('day') + ' ' + pick('month')
          : pick('weekday') + ' ' + pick('month') + ' ' + pick('day');
      } else {
        out = new Intl.DateTimeFormat(df === 'system' ? undefined : lang, opts).format(d);
      }
    } catch (e) { return ''; }
    if (!long) out = out.replace(/,/g, '');
    return out.replace(/\s+/g, ' ').trim();
  };
  window.hemmaCurrencySymbol = function (unit) {
    var cur = window.hemmaCurrency(unit);
    var f = cur ? formatter(0, 0, cur) : null;
    var part = f && f.formatToParts ? f.formatToParts(1).filter(function (x) { return x.type === 'currency'; })[0] : null;
    return part ? part.value : (String(unit || '').trim() || '$');
  };
})();

(function () {
  var _hemmaT = function (k, en, v) {
    if (typeof window._hemmaT === 'function') return window._hemmaT(k, en, v);
    var s = String(en);
    if (v) for (var p in v) s = s.split('{' + p + '}').join(String(v[p]));
    return s;
  };
  // Reads through button-card's `states` so the title re-renders with the clock and the person.
  window.hemmaGreeting = function (hass, states, variables) {
    return String(greeting(hass, states, variables)).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  };
  var greeting = function (hass, states, variables) {
    var h = hass || {};
    var st = states || h.states || {};
    var all = h.states || {};
    void st[(variables && variables.time_entity) || 'sensor.time'];
    var uid = h.user && h.user.id;
    var pid = uid ? Object.keys(all).filter(function (id) {
      return id.indexOf('person.') === 0 && all[id].attributes && all[id].attributes.user_id === uid;
    })[0] : null;
    var person = pid ? st[pid] : null;
    var name = person ? String(person.attributes.friendly_name || '').trim().split(/\s+/)[0] : '';
    var v = name ? { name: name } : null;
    var arrived = person && person.state === 'home' && person.last_changed
      && Date.now() - Date.parse(person.last_changed) < 10 * 60 * 1000;
    if (arrived) return name ? _hemmaT('greeting.welcome_name', 'Welcome home, {name}', v) : _hemmaT('greeting.welcome', 'Welcome home');
    var hour = new Date().getHours();
    try {
      var loc = h.locale || {};
      if (loc.time_zone === 'server' && h.config && h.config.time_zone) {
        hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: h.config.time_zone }).format(new Date())) % 24;
      }
    } catch (e) { /* keep the device hour */ }
    if (hour >= 5 && hour < 12) return name ? _hemmaT('greeting.morning_name', 'Good morning, {name}', v) : _hemmaT('greeting.morning', 'Good morning');
    if (hour >= 12 && hour < 17) return name ? _hemmaT('greeting.afternoon_name', 'Good afternoon, {name}', v) : _hemmaT('greeting.afternoon', 'Good afternoon');
    return name ? _hemmaT('greeting.evening_name', 'Good evening, {name}', v) : _hemmaT('greeting.evening', 'Good evening');
  };
})();

// ── Now Playing collector ────────────────────────────────────────────────────
(function () {
  // The table may load before or after this file, so look it up per call.
  var _hemmaT = function (k, en, v) {
    if (typeof window._hemmaT === 'function') return window._hemmaT(k, en, v);
    var s = String(en);
    if (v) for (var p in v) s = s.split('{' + p + '}').join(String(v[p]));
    return s;
  };
  var _hemmaL = function (k, en) {
    var h = document.querySelector('home-assistant');
    var v = h && h.hass && h.hass.localize && h.hass.localize(k);
    return (v && v !== k) ? v : en;
  };
  if (!window.HEMMA_ACTIVE_STATES) {
    window.HEMMA_ACTIVE_STATES = new Set([
      'on', 'open', 'opening', 'playing', 'unlocked', 'unlocking',
      'cleaning', 'returning', 'cool', 'heat', 'washing', 'rinsing',
      'spinning', 'drying', 'running', 'active', 'problem',
    ]);
  }

  if (!window.HEMMA_TEMPLATE_SIZES) {
    window.HEMMA_TEMPLATE_SIZES = {};
  }

  window.hemmaDeviceId = function () {
    try {
      var k = 'hemma_device_id';
      var v = localStorage.getItem(k);
      if (!v) {
        v = Math.random().toString(36).slice(2, 8);
        localStorage.setItem(k, v);
      }
      return v;
    } catch (e) {
      return 'nostore';
    }
  };

  window.hemmaOverlayKey = function (eid) {
    return window.hemmaDeviceId() + '|' + String(eid || '');
  };

  // A card can render before its variables resolve, so the weather entity is
  // remembered - but per dashboard, and never on a Hemma-managed one, where
  // the config is the whole truth. The unscoped key this replaces was shared
  // by every dashboard, so a second dashboard with no weather inherited the
  // first one's sensors.
  var wxDash = function () {
    return (window.location.pathname || '').split('/').filter(Boolean)[0] || '';
  };
  // Read from the raw states: button-card's proxy would subscribe the card to every entity.
  const roomSensorsMemo = new Map();
  let roomSensorsFor = null;
  window.hemmaRoomSensors = function (hass, key, chips) {
    const ents = (hass && hass.entities) || {};
    if (roomSensorsFor !== ents) { roomSensorsMemo.clear(); roomSensorsFor = ents; }
    const c = (chips && chips[key]) || {};
    const memoKey = key + '|' + (c.motion_entity || '') + '|' + (c.occupancy_entity || '');
    if (roomSensorsMemo.has(memoKey)) return roomSensorsMemo.get(memoKey);
    const ha = document.querySelector('home-assistant');
    const S = (ha && ha.hass && ha.hass.states) || {};
    const cls = (id) => ((S[id] || {}).attributes || {}).device_class;
    const slug = (t) => String(t || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const want = String(key || '').replace(/^room_/, '');
    const areas = (hass && hass.areas) || {};
    const devs = (hass && hass.devices) || {};
    const aids = new Set(Object.keys(areas).filter((a) => slug((areas[a] || {}).name) === want));
    const cams = new Set(Object.keys(ents).filter((id) => id.indexOf('camera.') === 0).map((id) => (ents[id] || {}).device_id).filter(Boolean));
    const isCam = (id) => cams.has((ents[id] || {}).device_id);
    const own = (ok) => Object.keys(ents).filter((id) => {
      if (id.indexOf('binary_sensor.') !== 0 && id.indexOf('event.') !== 0) return false;
      const e = ents[id] || {};
      if (!S[id] || e.hidden || e.hidden_by || e.disabled_by || !ok(id)) return false;
      return aids.has(e.area_id || (devs[e.device_id] || {}).area_id);
    }).sort();
    const set = c.motion_entity && S[c.motion_entity] ? c.motion_entity : null;
    const motion = set && isCam(set) ? [set] : own((id) => isCam(id) && cls(id) === 'motion');
    const occupancy = c.occupancy_entity ? [c.occupancy_entity] : set && !isCam(set) ? [set]
      : own((id) => !isCam(id) && id.indexOf('binary_sensor.') === 0 && ['motion', 'occupancy', 'presence'].indexOf(cls(id)) >= 0);
    const out = { motion, occupancy };
    roomSensorsMemo.set(memoKey, out);
    return out;
  };
  // Detected or not: an event (a doorbell's motion) counts for a minute after it fires.
  window.hemmaSensorsOn = function (states, ids) {
    let seen = false;
    for (const id of ids || []) {
      const s = states && states[id];
      if (!s) continue;
      if (id.indexOf('event.') === 0) {
        const t = Date.parse(s.state);
        seen = true;
        if (Number.isFinite(t) && Date.now() - t < 60000) return true;
      } else if (s.state === 'on') return true;
      else if (s.state === 'off') seen = true;
    }
    return seen ? false : null;
  };
  window.hemmaBatterySvg = function (states, id) {
    var s = id && states && states[id];
    var lvl = s ? Math.round(Number(s.state)) : NaN;
    if (!Number.isFinite(lvl)) return '';
    var pct = Math.max(0, Math.min(100, lvl));
    var st = String((states[id.replace(/_battery_level$/, '_battery_state')] || {}).state || '').toLowerCase();
    var charging = (s.attributes && s.attributes.is_charging === true) || (st.indexOf('charging') >= 0 && st.indexOf('not') < 0);
    var fill = charging ? '#34C759' : (pct <= 20 ? '#FF3B30' : '#fff');
    var w = (24.5 * pct / 100).toFixed(2);
    // As iOS draws it: the bolt is cut out of the body beside the digits, which move left to make room.
    var bolt = charging ? '<path d="M20.9 2.4 17.6 7.3h2.2l-.8 3.9 3.3-5.1h-2.2z" fill="#000"/>' : '';
    var vw = 27.3;
    var tx = charging ? (pct >= 100 ? 9.4 : 10.2) : 12.25;
    var fs = charging && pct >= 100 ? 9.4 : 11.4;
    var u = pct + (charging ? 'c' : '');
    return '<svg viewBox="0 0 ' + vw + ' 13" width="' + (vw * 14 / 13).toFixed(2) + '" height="14" aria-label="' + pct + '%">'
      + '<defs><clipPath id="hbc' + u + '"><rect x="0" y="0" width="24.5" height="13" rx="4.2"/></clipPath>'
      + '<mask id="hbm' + u + '"><rect width="34" height="13" fill="#fff"/>'
      + '<text x="' + tx + '" y="10.6" text-anchor="middle" font-size="' + fs + '" font-weight="700" letter-spacing="-0.3"'
      + ' font-family="-apple-system, SF Pro Rounded, system-ui, sans-serif" fill="#000">' + pct + '</text>' + bolt + '</mask></defs>'
      + '<g mask="url(#hbm' + u + ')" clip-path="url(#hbc' + u + ')">'
      + '<rect x="0" y="0" width="24.5" height="13" fill="rgba(255,255,255,0.36)"/>'
      + '<rect x="0" y="0" width="' + w + '" height="13" fill="' + fill + '"/></g>'
      + '<rect x="25.4" y="4.3" width="1.9" height="4.4" rx="0.95" fill="rgba(255,255,255,0.4)"/></svg>';
  };
  window.hemmaWx = function (variables, which) {
    var v = variables || {};
    var name = which === 'temp' ? 'weather_temp_sensor' : 'weather_entity';
    var val = v[name] || '';
    var key = 'hemma_' + name + ':' + wxDash();
    try {
      if (val) localStorage.setItem(key, val);
      else if (v.hemma_ui_managed) localStorage.removeItem(key);
    } catch (e) { /* private mode */ }
    if (val) return val;
    if (v.hemma_ui_managed) return '';
    try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
  };
  // Cards saved before the scoping still read the shared key, so it is cleared
  // on every load and the window cache is dropped whenever the dashboard changes.
  try {
    localStorage.removeItem('hemma_weather_entity');
    localStorage.removeItem('hemma_weather_temp_sensor');
  } catch (e) { /* private mode */ }
  setInterval(function () {
    var d = wxDash();
    if (window._hemmaWxDash === d) return;
    window._hemmaWxDash = d;
    window._hemmaWx = null;
    window._hemmaWxTemp = null;
    try {
      localStorage.removeItem('hemma_weather_entity');
      localStorage.removeItem('hemma_weather_temp_sensor');
    } catch (e) { /* private mode */ }
  }, 1000);

  window.HEMMA_DOMAIN_GLYPH = {
    light: 'light', switch: 'plug', input_boolean: 'plug',
    fan: 'fan', climate: 'thermostat', humidifier: 'humidifier',
    media_player: 'speaker', lock: 'lock-fill', cover: 'curtain-open',
    vacuum: 'vacuum', script: 'scenes', scene: 'scenes',
    automation: 'scenes', button: 'power_on', input_button: 'power_on',
    binary_sensor: 'person-walking-motion', remote: 'tv', water_heater: 'hot_water',
    valve: 'curtain-open', siren: 'person-walking-motion',
  };

  window.hemmaDomainGlyph = function (eid) {
    var dom = String(eid || '').split('.')[0];
    return window.HEMMA_DOMAIN_GLYPH[dom] || 'default';
  };

  window.HEMMA_MDI = {
    alert: 'mdi:alert', automation: 'mdi:robot', binary_sensor: 'mdi:radiobox-blank',
    button: 'mdi:gesture-tap-button', calendar: 'mdi:calendar', camera: 'mdi:video',
    climate: 'mdi:thermostat', cover: 'mdi:window-shutter', fan: 'mdi:fan',
    humidifier: 'mdi:air-humidifier', input_boolean: 'mdi:check-circle-outline',
    input_button: 'mdi:gesture-tap-button', input_number: 'mdi:ray-vertex',
    input_select: 'mdi:format-list-bulleted', input_text: 'mdi:form-textbox',
    lawn_mower: 'mdi:robot-mower', light: 'mdi:lightbulb', lock: 'mdi:lock',
    media_player: 'mdi:cast', number: 'mdi:ray-vertex', person: 'mdi:account',
    remote: 'mdi:remote', scene: 'mdi:palette', script: 'mdi:script-text',
    select: 'mdi:format-list-bulleted', sensor: 'mdi:eye', siren: 'mdi:bullhorn',
    switch: 'mdi:toggle-switch-variant', text: 'mdi:form-textbox',
    todo: 'mdi:clipboard-list', vacuum: 'mdi:robot-vacuum', valve: 'mdi:pipe-valve',
    water_heater: 'mdi:water-boiler',
  };

  function mdiDefault(states, eid) {
    var dom = String(eid || '').split('.')[0];
    var st = states && states[eid];
    var a = (st && st.attributes) || {};
    var on = st && st.state === 'on';
    var dc = a.device_class;

    if (dom === 'switch') {
      if (dc === 'outlet') return on ? 'mdi:power-plug' : 'mdi:power-plug-off';
      return on ? 'mdi:toggle-switch-variant' : 'mdi:toggle-switch-variant-off';
    }
    if (dom === 'input_boolean') {
      return on ? 'mdi:check-circle-outline' : 'mdi:close-circle-outline';
    }
    if (dom === 'automation') return on ? 'mdi:robot' : 'mdi:robot-off';
    if (dom === 'lock') {
      var ls = st && st.state;
      if (ls === 'unlocked') return 'mdi:lock-open';
      if (ls === 'jammed') return 'mdi:lock-alert';
      return 'mdi:lock';
    }
    if (dom === 'media_player') {
      if (dc === 'tv') return 'mdi:television';
      if (dc === 'speaker') return 'mdi:speaker';
      if (dc === 'receiver') return 'mdi:audio-video';
      return st && st.state === 'playing' ? 'mdi:cast-connected' : 'mdi:cast';
    }
    return window.HEMMA_MDI[dom] || 'mdi:bookmark';
  }

  window.HEMMA_ICON_TR = window.HEMMA_ICON_TR || {};
  var _trCards = [];
  var TR_KEY = 'hemma_icon_tr_v1';

  function trStore() {
    try { return JSON.parse(localStorage.getItem(TR_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function trVersion(hass) {
    return (hass && hass.config && hass.config.version) || '';
  }

  function trLoad(hass, integration) {
    var all = trStore();
    var hit = all[integration];
    if (hit && hit.v === trVersion(hass)) return hit.icons;
    return undefined;
  }

  function trSave(hass, integration, icons) {
    try {
      var all = trStore();
      all[integration] = { v: trVersion(hass), icons: icons };
      localStorage.setItem(TR_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  function fetchIconTr(hass, integration) {
    if (window.HEMMA_ICON_TR[integration] !== undefined) return;
    window.HEMMA_ICON_TR[integration] = null;
    var send = hass.callWS
      ? function (m) { return hass.callWS(m); }
      : function (m) { return hass.connection.sendMessagePromise(m); };
    try {
      send({ type: 'frontend/get_icons', category: 'entity', integration: integration })
        .then(function (res) {
          var r = res && res.resources;
          var icons = (r && r[integration]) || null;
          window.HEMMA_ICON_TR[integration] = icons;
          if (icons) trSave(hass, integration, icons);
          _trCards.forEach(function (c) {
            try { if (c && c.requestUpdate) c.requestUpdate(); } catch (e) {}
          });
        }, function () {});
    } catch (e) {}
  }

  window.hemmaIconCardSeen = function (card) {
    if (card && _trCards.indexOf(card) === -1) _trCards.push(card);
  };

  window.hemmaEntityIcon = function (hass, states, eid) {
    if (!eid) return 'mdi:bookmark';
    var reg = hass && hass.entities && hass.entities[eid];
    if (reg && reg.icon) return reg.icon;

    if (hass && reg && reg.platform && reg.translation_key) {
      var tr = window.HEMMA_ICON_TR[reg.platform];
      if (tr === undefined) {
        var cached = trLoad(hass, reg.platform);
        if (cached) {
          tr = window.HEMMA_ICON_TR[reg.platform] = cached;
          // Refreshed in the background, in case the integration changed.
          setTimeout(function () {
            window.HEMMA_ICON_TR[reg.platform] = undefined;
            fetchIconTr(hass, reg.platform);
            if (!window.HEMMA_ICON_TR[reg.platform]) window.HEMMA_ICON_TR[reg.platform] = cached;
          }, 0);
        } else {
          fetchIconTr(hass, reg.platform);
        }
      }
      if (tr) {
        var dom = String(eid).split('.')[0];
        var node = tr[dom] && tr[dom][reg.translation_key];
        if (node) {
          var st = states && states[eid];
          var byState = node.state && st && node.state[st.state];
          if (byState) return byState;
          if (node.default) return node.default;
        }
      }
    }
    return mdiDefault(states, eid);
  };

  // Set outside the guard: a first-wins init would freeze this map at load.
  window.HEMMA_TEMPLATE_SIZES.hemma_entity_actions = 'large';

  // Works off the RAW config: both callers run before button-card merges templates.
  if (typeof window.hemmaCardSize !== 'function') {
    window.hemmaCardSize = function (cfg) {
      if (!cfg) return 'small';
      const direct = cfg.variables?.size;
      if (direct) return String(direct).toLowerCase() === 'large' ? 'large' : 'small';
      const tmpl = cfg.template;
      const list = Array.isArray(tmpl) ? tmpl : (tmpl ? [tmpl] : []);
      const sizes = window.HEMMA_TEMPLATE_SIZES || {};
      for (const t of list) {
        if (sizes[t] === 'large') return 'large';
      }
      return 'small';
    };
  }

  window._hemmaActions = (function () {
    var OFF = ['false', '0', 'no', 'off', 'disabled'];
    var ON_STATES = [
      'on', 'open', 'opening', 'unlocked', 'unlocking',
      'playing', 'buffering', 'home', 'connected', 'online',
      'cooling', 'heating', 'cleaning', 'running', 'active',
    ];
    var DEAD = ['unknown', 'unavailable', 'none', ''];

    function esc(v) {
      return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function enabled(variables, idx) {
      var v = variables['action_' + idx + '_enabled'];
      var ok = (v === undefined || v === null) ? true
        : (typeof v === 'boolean') ? v
        : (typeof v === 'number') ? v !== 0
        : OFF.indexOf(String(v).trim().toLowerCase()) === -1;
      return ok && !!variables['action_' + idx + '_entity'];
    }

    function order(variables) {
      return [1, 2].filter(function (i) { return enabled(variables, i); });
    }

    function any(variables) {
      return enabled(variables, 1) || enabled(variables, 2);
    }

    // Counted from the end, so slot 0 is always the bottom pill.
    function slot(variables, idx) {
      var o = order(variables);
      var p = o.indexOf(idx);
      return p < 0 ? 0 : (o.length - 1 - p);
    }

    function stateClass(states, eid) {
      if (!eid || !states[eid]) return 'unavailable';
      var st = String(states[eid].state || '').toLowerCase().replace(/_/g, ' ');
      if (DEAD.indexOf(st) !== -1) return 'unavailable';
      return ON_STATES.indexOf(st) !== -1 ? 'active' : 'normal';
    }

    function glyph(variables, idx, states, cls, hass) {
      var eid = variables['action_' + idx + '_entity'];
      var attrs = (states[eid] && states[eid].attributes) || {};
      var raw = String(variables['action_' + idx + '_icon'] || attrs.icon || '').trim();

      if (!raw && window.hemmaEntityIcon) raw = window.hemmaEntityIcon(hass, states, eid);
      if (!raw) raw = 'mdi:bookmark';

      if (raw.indexOf(':') !== -1) {
        return '<ha-icon class="hemma-act-icon hemma-act-ha-icon ' + cls + '"'
          + ' icon="' + esc(raw) + '"></ha-icon>';
      }

      var src;
      if (/^(\/|https?:\/\/)/.test(raw) || /\.(svg|png|webp)$/.test(raw)) {
        src = raw;
      } else {
        var base = String(variables.svg_path || '/local/hemma/icons').replace(/\/$/, '');
        src = base + '/' + raw + '.svg';
      }
      return '<img class="hemma-act-icon hemma-act-svg ' + cls + '" src="' + esc(src) + '" alt="">';
    }

    function label(variables, idx, states, prefix) {
      var explicit = variables['action_' + idx + '_label'];
      if (explicit) return String(explicit);

      var eid = variables['action_' + idx + '_entity'];
      var attrs = (states[eid] && states[eid].attributes) || {};
      var name = String(attrs.friendly_name || eid || '');
      var p = String(prefix || '').trim();

      if (p && name.toLowerCase().indexOf(p.toLowerCase() + ' ') === 0) {
        var rest = name.slice(p.length).trim();
        if (rest) name = rest.charAt(0).toUpperCase() + rest.slice(1);
      }
      return name;
    }

    var FIT_REF_PX = 12;
    var fitCtx = null;
    var fitFam = null;

    function fitEm(text, weight) {
      if (!fitCtx) {
        if (!document.createElement) return 0;
        fitCtx = document.createElement('canvas').getContext('2d');
      }
      if (!fitFam) {
        fitFam = getComputedStyle(document.documentElement)
          .getPropertyValue('--primary-font-family').trim() || 'system-ui, sans-serif';
      }
      fitCtx.font = (weight || 500) + ' ' + FIT_REF_PX + 'px ' + fitFam;
      return (fitCtx.measureText(String(text)).width / FIT_REF_PX) * 1.015;
    }

    function fitStyle(variables, states, prefix) {
      var em = 0;
      try {
        order(variables).forEach(function (i) {
          var w = fitEm(label(variables, i, states, prefix), 500);
          if (w > em) em = w;
        });
      } catch (e) { return ''; }
      if (!(em > 0)) return '';
      return ' style="font-size:clamp(var(--hemma-actions-label-min, 12px),'
        + ' calc((100cqi - var(--hemma-actions-label-inset, 0px)) / ' + em.toFixed(3) + '),'
        + ' var(--hemma-actions-label-size, 15px))"';
    }

    function markup(variables, idx, states, prefix, hass) {
      if (!enabled(variables, idx)) return '';
      var cls = stateClass(states, variables['action_' + idx + '_entity']);
      var text = label(variables, idx, states, prefix);
      return '<div class="hemma-act-hit hemma-act-pill ' + cls + '" data-action-index="' + idx + '">'
        + '<span class="hemma-act-glyphbox">' + glyph(variables, idx, states, cls, hass) + '</span>'
        + '<span class="hemma-act-label"' + fitStyle(variables, states, prefix)
        + '>' + esc(text) + '</span></div>';
    }

    var TOGGLE_SCRIPT = 'script.hemma_actions_overlay_toggle';

    function moreMarkup(variables, eid) {
      if (!any(variables)) return '';
      return '<div class="hemma-act-hit hemma-act-more" role="button" aria-label="' + _hemmaT('a11y.actions', 'Actions') + '"'
        + ' data-more-key="' + esc(openKey(eid)) + '">'
        + '<svg class="hemma-act-dots" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
        + '<circle cx="3" cy="12" r="2.5"></circle>'
        + '<circle cx="12" cy="12" r="2.5"></circle>'
        + '<circle cx="21" cy="12" r="2.5"></circle>'
        + '</svg></div>';
    }

    function run(card, variables, idx, fallbackHass) {
      var eid = variables['action_' + idx + '_entity'];
      if (!eid) return;

      var H = (card && card._hass) || fallbackHass;
      if (!H) return;

      var action = variables['action_' + idx + '_action'] || 'more-info';

      if (action === 'more-info') {
        card.dispatchEvent(new CustomEvent('hass-more-info', {
          bubbles: true, composed: true, detail: { entityId: eid },
        }));
        return;
      }

      if (action === 'toggle') {
        var domain = String(eid).split('.')[0];
        if (domain) H.callService(domain, 'toggle', { entity_id: eid });
        return;
      }

      if (action === 'call-service') {
        var full = variables['action_' + idx + '_service'];
        if (!full || String(full).indexOf('.') === -1) return;
        var parts = String(full).split('.');
        var data = Object.assign({}, variables['action_' + idx + '_service_data'] || {});
        if (!data.entity_id) data.entity_id = eid;
        H.callService(parts[0], parts[1], data);
        return;
      }

      if (action === 'navigate') {
        var path = variables['action_' + idx + '_navigation_path'];
        if (!path) return;
        history.pushState(null, '', path);
        window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
      }
    }

    function armRelease() {
      if (window._hemmaActReleaseArmed) return;
      window._hemmaActReleaseArmed = true;
      var clear = function () {
        var held = window._hemmaActHeld;
        window._hemmaActHeld = null;
        if (held && held.classList) held.classList.remove('pressed');
      };
      ['pointerup', 'pointercancel', 'touchend', 'touchcancel', 'blur']
        .forEach(function (t) { window.addEventListener(t, clear, true); });
    }

    function press(el, on) {
      if (!el || !el.classList) return;
      if (on) {
        var prev = window._hemmaActHeld;
        if (prev && prev !== el && prev.classList) prev.classList.remove('pressed');
        window._hemmaActHeld = el;
        el.classList.add('pressed');
      } else {
        if (window._hemmaActHeld === el) window._hemmaActHeld = null;
        el.classList.remove('pressed');
      }
    }

    function bind(card, variables, hass) {
      armRelease();
      // So a late icon-translation answer can ask this card to redraw.
      if (window.hemmaIconCardSeen) window.hemmaIconCardSeen(card);
      setTimeout(function () {
        try {
          var root = card && card.shadowRoot;
          if (!root) return;
          root.querySelectorAll('.hemma-act-hit').forEach(function (el) {
            if (el._hemmaActBound) return;
            el._hemmaActBound = true;

            el.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              var key = el.getAttribute('data-more-key');
              if (key) {
                var H = (card && card._hass) || hass;
                if (H) H.callService('script', 'turn_on', {
                  entity_id: TOGGLE_SCRIPT, variables: { actions_entity_id: key },
                });
                return;
              }
              run(card, variables, el.getAttribute('data-action-index'), hass);
            });

            el.addEventListener('pointerdown', function (ev) {
              ev.stopPropagation();
              press(el, true);
              try {
                window.dispatchEvent(new CustomEvent('haptic', { detail: 'light' }));
              } catch (e) {}
            });
            ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
              el.addEventListener(t, function () { press(el, false); });
            });

            ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(function (t) {
              el.addEventListener(t, function (ev) { ev.stopPropagation(); }, { passive: true });
            });
          });
        } catch (e) {}
      }, 0);
    }

    function repeat(term, n) {
      var out = '';
      for (var i = 0; i < n; i++) out += term;
      return out;
    }

    function deviceId() { return window.hemmaDeviceId(); }
    function openKey(eid) { return window.hemmaOverlayKey(eid); }

    function isOpen(variables, states, eid) {
      var t = states[variables.actions_toggle_helper];
      var a = states[variables.actions_active_helper];
      return !!(t && t.state === 'on' && a && a.state === openKey(eid));
    }

    // Safari cannot evaluate calc() over a clamp(), so every length is a sum of whole variables.
    function cornerWidth(variables, entityState) {
      if (variables.show_progress) {
        var active = variables.progress_active_states || [];
        var st = String(entityState || '').toLowerCase();
        if (active.indexOf(st) !== -1) return 'var(--hemma-progress-size-mq)';
      }
      if (variables.show_toggle) return 'var(--hemma-toggle-width)';
      return null;
    }

    function moreGeom(variables, entityState) {
      var corner = cornerWidth(variables, entityState);
      var lineTop = 'var(--hemma-icon-center-y) - var(--hemma-actions-hit) / 2';
      return {
        top: corner
          ? 'calc(' + lineTop + ')'
          : 'calc(' + lineTop + ' - var(--hemma-actions-more-inset))',
        right: corner
          ? 'calc(var(--hemma-actions-pad) + ' + corner
            + ' + var(--hemma-actions-corner-gap) - var(--hemma-actions-more-inset))'
          : 'calc(var(--hemma-actions-pad) - var(--hemma-actions-more-inset))',
        width: 'var(--hemma-actions-hit)',
        height: 'var(--hemma-actions-hit)',
      };
    }

    function pillGeom(variables, idx) {
      var s = slot(variables, idx);
      var n = Math.max(1, order(variables).length);
      var h = 'max(24px, min(var(--hemma-actions-pill-h), calc((100% - var(--hemma-actions-pad)'
        + ' - var(--hemma-icon-circle-size, 44px) - var(--hemma-actions-pill-clear, 10px)'
        + ' - var(--hemma-actions-pill-bottom)' + repeat(' - var(--hemma-actions-pill-gap)', n - 1)
        + ') / ' + n + ')))';
      return {
        top: 'calc(100% - var(--hemma-actions-pill-bottom)'
          + repeat(' - ' + h, s + 1)
          + repeat(' - var(--hemma-actions-pill-gap)', s) + ')',
        right: 'var(--hemma-actions-pad)',
        width: 'calc(100% - var(--hemma-actions-pad) - var(--hemma-actions-pad))',
        height: h,
      };
    }

    function motion(variables, states, eid, idx) {
      var open = isOpen(variables, states, eid);
      var s = slot(variables, idx);
      var step = open ? s : (order(variables).length - 1 - s);
      return {
        opacity: open ? '1' : '0',
        transform: open
          ? 'scale(1) translateY(0)'
          : 'scale(var(--hemma-actions-pill-scale, 0.94)) translateY(var(--hemma-actions-pill-rise, 6px))',
        pointerEvents: open ? 'auto' : 'none',
        duration: open
          ? 'var(--hemma-actions-dur-in, 0.30s)'
          : 'var(--hemma-actions-dur-out, 0.14s)',
        easing: open
          ? 'var(--hemma-actions-ease-in, cubic-bezier(0.32, 0.72, 0, 1))'
          : 'var(--hemma-actions-ease-out, cubic-bezier(0.4, 0, 0.7, 1))',
        delay: open ? (60 + step * 40) + 'ms' : (step * 25) + 'ms',
      };
    }

    return {
      enabled: enabled, any: any, order: order, slot: slot, stateClass: stateClass,
      markup: markup, moreMarkup: moreMarkup, run: run, bind: bind, esc: esc,
      isOpen: isOpen, motion: motion,
      deviceId: deviceId, openKey: openKey,
      cornerWidth: cornerWidth, moreGeom: moreGeom, pillGeom: pillGeom,
    };
  }());

  if (typeof window.hemmaStateFit !== 'function') {
    const emCache = new Map();
    let ctx = null;
    let fam = null;

    window.hemmaTextEm = function (text, weight) {
      const w = weight || 500;
      const key = w + '|' + text;
      const hit = emCache.get(key);
      if (hit !== undefined) return hit;
      if (!ctx) ctx = document.createElement('canvas').getContext('2d');
      if (!fam) {
        fam = getComputedStyle(document.documentElement)
          .getPropertyValue('--primary-font-family').trim() || 'system-ui, sans-serif';
      }
      // Measured at 100px and divided back down, so the result is a ratio.
      ctx.font = w + ' 100px ' + fam;
      // 2% slack for letter-spacing and sub-pixel rounding.
      const em = (ctx.measureText(String(text)).width / 100) * 1.02;
      emCache.set(key, em);
      return em;
    };

    window.hemmaStateFit = function (text, weight) {
      const t = text == null ? '' : String(text);
      if (!t) return '';
      const em = window.hemmaTextEm(t, weight);
      if (!(em > 0)) return t;
      const esc = t.replace(/[&<>"]/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
      ));
      return '<span style="display:inline-block;white-space:nowrap;font-size:min(1em,'
        + 'calc((100cqi - var(--hemma-tile-state-inset, 0px)) / ' + em.toFixed(3) + '))">'
        + esc + '</span>';
    };
  }

  if (typeof window.hemmaPsnStateTitle !== 'function') {
    const PSN_NOT_A_TITLE = new Set([
      'playing', 'paused', 'idle', 'on', 'off', 'home', 'away', 'online',
      'offline', 'standby', 'unavailable', 'unknown', 'none', 'null', '',
    ]);
    window.hemmaPsnStateTitle = (st) => !PSN_NOT_A_TITLE.has(String(st || '').trim());
  }

  if (typeof window.hemmaOptimistic !== 'function') {
    const PENDING = (window._hemmaIntent = window._hemmaIntent || {});
    const TTL = 1500;

    window.hemmaIntend = (key, value) => {
      PENDING[key] = { value: value, at: Date.now() };
    };

    window.hemmaKick = (el) => {
      if (!el) return;
      try {
        const h = el._hass || el.hass;
        if (h) el.hass = Object.assign({}, h);
        if (typeof el.requestUpdate === 'function') el.requestUpdate('_config', undefined);
      } catch (e) { /* the next state push will do it */ }
    };

    window.hemmaOptimistic = (key, state, actual) => {
      const p = PENDING[key];
      if (!p) return actual;
      const age = Date.now() - p.at;
      if (age > TTL) { delete PENDING[key]; return actual; }
      const changed = state && state.last_changed ? Date.parse(state.last_changed) : 0;
      if (changed && changed >= p.at) { delete PENDING[key]; return actual; }
      return p.value;
    };
  }

  if (!window.HEMMA_FILTER_CATEGORIES) {
    window.HEMMA_FILTER_CATEGORIES = {
      hemma_thermostat:    'climate',
      hemma_air_purifier:  'climate',
      hemma_cover:         'climate',
      hemma_fan:           'climate',
      hemma_humidifier:    'climate',
      hemma_light:         'lights',
      hemma_media:         'media',
      hemma_game:          'media',
      hemma_energy:        'energy',
      hemma_lock:          'security',
      hemma_camera:        'security',
      hemma_doorbell:      'security',   // deprecated alias for hemma_camera
      hemma_cameras:       'security',
      hemma_vacuum:        'unfiltered',
      hemma_plant:         'unfiltered',
      hemma_entity_actions: 'by_entity',
    };
  }
  // A light group's tile becomes one tile per member, room name dropped; a member that is a group itself stays one tile.
  window.hemmaExpandLights = function (st, room, list) {
    const members = (id) => {
      const kids = st[id] && st[id].attributes && st[id].attributes.entity_id;
      return Array.isArray(kids) && kids.length ? kids : [id];
    };
    const pre = String(room || '').toLowerCase() + ' ';
    const cards = [];
    const used = new Set();
    list.forEach((c) => {
      const ids = c.entity ? members(c.entity).filter((x) => x.indexOf('light.') === 0) : [];
      if (ids.length <= 1 && !(ids[0] && ids[0] !== c.entity)) { cards.push(c); return; }
      ids.forEach((id) => {
        if (used.has(id)) return;
        used.add(id);
        const fn = String((st[id] && st[id].attributes && st[id].attributes.friendly_name) || '');
        const card = { type: 'custom:button-card', template: 'hemma_light', entity: id, variables: { as_light: true },
          tap_action: { action: 'more-info' }, hold_action: { action: 'more-info' } };
        if (fn.toLowerCase().indexOf(pre) === 0 && fn.length > pre.length) card.name = fn.slice(pre.length);
        cards.push(card);
      });
    });
    return cards;
  };

  // A tile that takes any entity (Entity Actions) files under its entity's kind; 'by_entity' in the table above.
  window.hemmaEntityCategory = function (id) {
    return ({
      light: 'lights', media_player: 'media', remote: 'media',
      climate: 'climate', fan: 'climate', humidifier: 'climate', cover: 'climate', water_heater: 'climate',
      lock: 'security', alarm_control_panel: 'security', camera: 'security',
    })[String(id || '').split('.')[0]] || null;
  };

  if (typeof window._hemmaSameGame !== 'function') {
    window._hemmaSameGame = function (x, y) {
      const flat = (v) => String(v || '').toLowerCase()
        .replace(/[™®©]/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
      const a = flat(x), b = flat(y);
      if (!a || !b) return false;
      if (a === b) return true;
      const [short, long] = a.length <= b.length ? [a, b] : [b, a];
      if (!long.startsWith(short + ' ')) return false;
      return !/[0-9]/.test(long.slice(short.length));
    };
  }

  if (typeof window._hemmaPCSources !== 'function') {
    window._hemmaPCSources = function (states, V) {
      const norm = (x) => String(x ?? '').trim();
      const low = (x) => norm(x).toLowerCase();
      const dead = (v, extra) => !v ||
        ['unknown', 'unavailable', ''].concat(extra || []).includes(low(v));
      const url = (key) => {
        const s = key && states[key];
        const raw = s?.attributes?.entity_picture || s?.state;
        return (raw && String(raw).startsWith('http')) ? String(raw) : null;
      };

      const dcResolve = () => {
        const u = V.discord_user && states[V.discord_user];
        const a = (u && u.attributes) || {};
        const pick = (...xs) => xs.find((x) => x && String(x).startsWith('http')) || null;
        return {
          status: V.discord_online ? states[V.discord_online]?.state : u?.state,
          game: V.discord_game ? states[V.discord_game]?.state : a.game,
          details: V.discord_details ? states[V.discord_details]?.state
            : (a.game_details || a.game_state),
          img: V.discord_image ? url(V.discord_image)
            : pick(a.game_image_large, a.game_image_header, a.game_image_hero_capsule),
        };
      };

      // Discord: presence must not be offline (DND and idle are normal in-game).
      let discord = null;
      if (V.discord_user || (V.discord_online && V.discord_game)) {
        const d = dcResolve();
        const status = low(d.status);
        const game = norm(d.game);
        if (!dead(status, ['offline', 'none']) && !dead(game)) {
          const details = norm(d.details);
          discord = {
            game: game,
            details: dead(details) ? '' : details,
            img: d.img,
            label: norm(V.discord_label) || 'PC',
          };
        }
      }

      const stResolve = () => {
        const u = V.steam_account && states[V.steam_account];
        const a = (u && u.attributes) || {};
        const pick = (...xs) => xs.find((x) => x && String(x).startsWith('http')) || null;
        return {
          status: V.steam_online ? states[V.steam_online]?.state : u?.state,
          game: V.steam_game ? states[V.steam_game]?.state : a.game,
          img: V.steam_image ? url(V.steam_image)
            : pick(a.game_image_main, a.game_image_header, a.game_icon),
        };
      };

      let steam = null;
      if (V.steam_account || V.steam_game) {
        const t = stResolve();
        const status = low(t.status);
        const game = norm(t.game);
        const guard = !(V.steam_account || V.steam_online)
          || !dead(status, ['offline', 'none']);
        if (guard && !dead(game, ['none'])) {
          steam = {
            game: game,
            details: '',
            img: t.img,
            label: norm(V.steam_label) || 'Steam',
          };
        }
      }

      if (discord && steam && window._hemmaSameGame(discord.game, steam.game)) {
        const policy = low(V.duplicate_game) || 'discord';
        if (policy !== 'both') {
          const keepSteam = policy === 'steam';
          const win = keepSteam ? steam : discord;
          const lose = keepSteam ? discord : steam;
          if (!win.img) win.img = lose.img;
          if (!win.details) win.details = lose.details;
          if (keepSteam) discord = null; else steam = null;
        }
      }

      return { discord: discord, steam: steam };
    };
  }

  if (typeof window._hemmaPlexHidden !== 'function') {
    window._hemmaPlexHidden = function (V, user) {
      const raw = String((V || {}).plex_hide_users || '');
      const u = String(user || '').trim().toLowerCase();
      if (!raw.trim() || !u) return false;
      return raw.split(',').map((x) => x.trim().toLowerCase())
        .filter(Boolean).indexOf(u) !== -1;
    };
  }

  if (typeof window._hemmaNPSources !== 'function') {
    window._hemmaNPSources = function (states, V) {
      const norm = (x) => String(x ?? '').trim();
      const low  = (x) => norm(x).toLowerCase();
      const abs  = (u) => {
        if (!u) return null;
        const s = String(u);
        const full = s.startsWith('/') ? (location.origin + s) : s;
        // Strip Plex's cache-busting ?refresh= so images don't flash on each poll.
        try {
          const p = new URL(full, location.origin);
          // authSig signs the exact param list, so editing the query of a signed URL 401s it.
          if (p.searchParams.has('authSig')) return full;
          p.searchParams.delete('refresh');
          return p.toString();
        } catch (e) { return full; }
      };
      const ms = (t) => { const n = t ? Date.parse(t) : NaN; return Number.isFinite(n) ? n : 0; };
      const sameGame = (x, y) => {
        const flat = (v) => String(v || '').toLowerCase()
          .replace(/[\u2122\u00ae\u00a9]/g, ' ')
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();
        const a = flat(x), b = flat(y);
        if (!a || !b) return false;
        if (a === b) return true;
        const [short, long] = a.length <= b.length ? [a, b] : [b, a];
        if (!long.startsWith(short + ' ')) return false;
        return !/[0-9]/.test(long.slice(short.length));
      };

      const pauseTimeout = Number(V.pause_timeout_minutes ?? 10);
      const out = [];

      for (let i = 1; i <= 10; i++) {
        if (!V['show_media_player_' + i]) continue;
        const eid = V['media_player_' + i];
        const s = eid && states[eid];
        if (!s) continue;

        const st = low(s.state);
        const a  = s.attributes || {};
        const rawTitle = norm(a.media_title);
        let artist = norm(a.media_artist || a.artist || a.media_album_artist);
        const hasContent = !!(rawTitle || artist);

        const feats = Number(a.supported_features || 0);
        const controls = {
          toggle: !!(feats & 16385),
          next: !!(feats & 32),
          prev: !!(feats & 16),
        };
        const hasControls = !!(controls.toggle || controls.next || controls.prev);

        let active = false;
        let pauseUntil = 0;
        if (st === 'playing' || st === 'buffering') active = true;
        else if (st === 'paused' && hasContent && hasControls) {
          if (pauseTimeout <= 0) active = true;
          else {
            pauseUntil = ms(s.last_changed) + (pauseTimeout * 60000);
            active = Date.now() <= pauseUntil;
          }
        }
        if (!active) continue;

        // Same title/artist derivation as the media player badge, to stay in sync.
        let title = rawTitle;
        if (!artist && a.media_content_type === 'tvshow') {
          const series  = norm(a.media_series_title);
          const season  = a.media_season  ? 'S' + String(a.media_season).padStart(2, '0')  : '';
          const episode = a.media_episode ? 'E' + String(a.media_episode).padStart(2, '0') : '';
          artist = [series, [season, episode].filter(Boolean).join('')].filter(Boolean).join(' · ');
        }
        if (!artist) {
          const parts = rawTitle.split(/\s+[-–—]\s+/);
          if (parts.length >= 3) {
            title = parts[parts.length - 1];
            artist = parts.slice(0, -1).join(' – ');
          }
        }

        let art = abs(a.entity_picture || a.media_image_url || a.media_album_cover_url || a.image_url);
        if (!art) {
          const app = low(a.app_name || a.source) + ' ' + low(a.app_id);
          if (app.includes('youtube')) art = '/local/hemma/icons/youtube.png';
        }

        out.push({
          key: 'mp' + i,
          kind: 'player',
          entity: eid,
          art: art,
          title: title || norm(a.friendly_name) || _hemmaT('media.title', 'Media'),
          subtitle: artist,
          source: norm(a.app_name || a.source || a.friendly_name),
          started: ms(s.last_changed),
          state: st,
          playing: st === 'playing' || st === 'buffering',
          controls: controls,
          pauseUntil: pauseUntil,
          pos: Number(a.media_position),
          dur: Number(a.media_duration),
          posAt: ms(a.media_position_updated_at),
        });
      }

      for (let i = 1; i <= 2; i++) {
        if (!V['show_plex_' + i]) continue;
        const sid = V['plex_stream_' + i];
        const sState = sid && states[sid];
        if (!sState) continue;
        const sSt = low(sState.state);
        if (sSt !== 'playing' && sSt !== 'buffering') continue;
        const a = sState.attributes || {};
        if (window._hemmaPlexHidden(V, a.user)) continue;
        const full = norm(a.full_title || a.title);
        if (!full) continue;
        // Upstream Tautulli session entity.
        const tau = sid.replace(/^(sensor\.)plex_stream_(\d+)$/, '$1plex_session_$2_tautulli');
        const pst = low((states[tau]?.state) || sState.state || '');
        if (pst !== 'playing' && pst !== 'buffering') continue;
        out.push({
          key: 'plex' + i,
          kind: 'plex',
          entity: sid,
          art: abs(a.image_url || a.entity_picture_local || a.entity_picture || a.media_image_url),
          title: full,
          subtitle: '',
          source: _hemmaT('media.plex_user', 'Plex · {user}', { user: norm(a.user) || _hemmaL('state.default.unknown', 'Unknown') }),
          started: ms(sState.last_changed),
          state: 'playing',
          playing: true,
          controls: { toggle: false, next: false, prev: false },
        });
      }

      for (let i = 1; i <= 2; i++) {
        if (!V['show_psn_' + i]) continue;
        const eid = V['psn_' + i];
        const s = eid && states[eid];
        if (!s) continue;
        const st = low(s.state);
        if (['unavailable', 'unknown', 'off', 'standby', 'none', ''].includes(st)) continue;
        const a = s.attributes || {};
        // The integration's own sensor carries the game in its STATE.
        const notATitle = (window.HEMMA_PSN_NOT_A_TITLE || (window.HEMMA_PSN_NOT_A_TITLE =
          new Set(['playing', 'paused', 'idle', 'on', 'off', 'home', 'away',
            'online', 'offline', 'standby', 'unavailable', 'unknown',
            'none', 'null', ''])));
        const attrTitle = norm(a.full_title || a.media_title || a.title);
        const stateIsTitle = !attrTitle && !notATitle.has(st);
        const title = attrTitle || (stateIsTitle ? norm(s.state) : '');
        if (!title) continue;
        out.push({
          key: 'psn' + i,
          kind: 'activity',
          entity: eid,
          art: abs(a.entity_picture_local || a.entity_picture || a.image_url
            || a.media_image_url
            || (function () {
              const iid = String(eid).replace(/^sensor\./, 'image.');
              const im = states[iid];
              const iat = (im && im.attributes) || {};
              if (iat.entity_picture_local || iat.entity_picture) {
                return iat.entity_picture_local || iat.entity_picture;
              }
              if (!im || !iat.access_token) return '';
              return '/api/image_proxy/' + iid + '?token=' + iat.access_token;
            })()),
          title: title,
          subtitle: norm(a.user),
          // Friendly name ("PS5"), not a.source (verbose "PlayStation Network").
          source: norm(a.friendly_name) || norm(a.source) || 'PlayStation',
          started: ms(s.last_changed),
          state: stateIsTitle ? 'playing' : st,
          playing: stateIsTitle ? true : st === 'playing',
          controls: { toggle: false, next: false, prev: false },
        });
      }

      const dcOnline = V.discord_online;
      const dcGame = V.discord_game;
      const dcImage = V.discord_image;
      const dcDetails = V.discord_details;
      const dcU = V.discord_user && states[V.discord_user];
      const dcA = (dcU && dcU.attributes) || {};
      const dcHttp = (...xs) => xs.find((x) => x && String(x).startsWith('http')) || null;
      if (V.show_discord && (V.discord_user || (dcOnline && dcGame))) {
        // Any presence but offline counts - DND and idle are normal while gaming.
        const status = low(dcOnline ? states[dcOnline]?.state : dcU?.state);
        const live = !!status && !['offline', 'unknown', 'unavailable', 'none'].includes(status);
        const game = norm(dcGame ? states[dcGame]?.state : dcA.game);
        const dead = !game || ['unknown', 'unavailable'].includes(game.toLowerCase());
        if (live && !dead) {
          const imgS = dcImage && states[dcImage];
          const ia = (imgS && imgS.attributes) || {};
          const dcSub = dcDetails ? states[dcDetails]?.state : (dcA.game_details || dcA.game_state);
          out.push({
            key: 'discord',
            kind: 'activity',
            entity: dcImage || dcGame || V.discord_user,
            art: dcImage
              ? abs(ia.entity_picture_local || ia.entity_picture || ia.image_url
                || (function(){ const v = String(states[dcImage]?.state || ''); return /^(https?:)?\/\//.test(v) || v.charAt(0) === '/' ? v : ''; })())
              : abs(dcHttp(dcA.game_image_large, dcA.game_image_header, dcA.game_image_hero_capsule)),
            title: game,
            subtitle: norm(dcSub).replace(/^(unknown|unavailable)$/i, ''),
            source: norm(V.discord_label) || 'PC',
            started: ms((dcGame ? states[dcGame] : dcU)?.last_changed),
            state: 'playing',
            playing: true,
            controls: { toggle: false, next: false, prev: false },
          });
        }
      }

      if (V.show_steam && (V.steam_account || V.steam_game)) {
        const stU = V.steam_account && states[V.steam_account];
        const stA = (stU && stU.attributes) || {};
        const stStatus = low(V.steam_online ? states[V.steam_online]?.state : stU?.state);
        const stLive = !(V.steam_account || V.steam_online) ||
          (!!stStatus && !['offline', 'unknown', 'unavailable', 'none'].includes(stStatus));
        const game = norm(V.steam_game ? states[V.steam_game]?.state : stA.game);
        const dead = !game || ['none', 'unknown', 'unavailable'].includes(game.toLowerCase());
        if (stLive && !dead) {
          const imgS = V.steam_image && states[V.steam_image];
          const ia = (imgS && imgS.attributes) || {};
          // An override entity may be a template sensor whose STATE is the URL.
          const raw = V.steam_image
            ? (ia.entity_picture_local || ia.entity_picture || ia.image_url ||
               (String(imgS?.state || '').startsWith('http') ? imgS.state : null))
            : [stA.game_image_main, stA.game_image_header, stA.game_icon]
                .find((x) => x && String(x).startsWith('http'));
          out.push({
            key: 'steam',
            kind: 'activity',
            entity: V.steam_image || V.steam_game || V.steam_account,
            art: abs(raw),
            title: game,
            subtitle: '',
            source: norm(V.steam_label) || 'Steam',
            started: ms(states[V.steam_game || V.steam_account]?.last_changed),
            state: 'playing',
            playing: true,
            controls: { toggle: false, next: false, prev: false },
          });
        }
      }

      const dcRow = out.find((r) => r.key === 'discord');
      const stRow = out.find((r) => r.key === 'steam');
      if (dcRow && stRow && sameGame(dcRow.title, stRow.title)) {
        const policy = low(V.duplicate_game) || 'discord';
        if (policy !== 'both') {
          const win = policy === 'steam' ? stRow : dcRow;
          const lose = win === dcRow ? stRow : dcRow;
          if (!win.art) win.art = lose.art;
          if (!win.subtitle) win.subtitle = lose.subtitle;
          out.splice(out.indexOf(lose), 1);
        }
      }

      const rank = (r) => {
        const c = r.controls;
        const hasCtl = !!(c && (c.toggle || c.next || c.prev));
        const isMedia = r.kind !== 'activity';
        return (hasCtl ? 4 : 0) + (r.playing ? 2 : 0) + (isMedia ? 1 : 0);
      };
      out.sort((x, y) => (rank(y) - rank(x)) || (y.started - x.started));

      // No stability/hysteresis here by design - hold_src covers that.

      // Manual pin overrides ranking; ignored if that source is no longer active.
      const pin = String(V.pinned_key || '').trim();
      if (pin) {
        const i = out.findIndex(r => r.key === pin);
        if (i > 0) out.unshift(out.splice(i, 1)[0]);
      }
      return out;
    };
  }

  if (typeof window._hemmaNPCfgKey !== 'function') {
    window._hemmaNPCfgKey = function (V) {
      const v = V || {};
      const out = [];
      for (let i = 1; i <= 10; i++) out.push(v['media_player_' + i] || '');
      for (let i = 1; i <= 2; i++) out.push(v['plex_stream_' + i] || '', v['psn_' + i] || '');
      out.push(v.plex_hide_users || '');
      out.push(v.discord_user || '', v.discord_game || '', v.discord_online || '',
        v.discord_image || '', v.steam_account || '', v.steam_game || '',
        v.steam_online || '', v.steam_image || '');
      return out.join('|');
    };
  }

  if (typeof window._hemmaNPStore !== 'function') {
    window._hemmaNPStore = function (V, name) {
      const all = window._hemmaNPStores = window._hemmaNPStores || {};
      const k = window._hemmaNPCfgKey(V) + '|' + name;
      return all[k] = all[k] || {};
    };
  }

  if (typeof window._hemmaNPView !== 'function') {
    window._hemmaNPView = function (states, V) {
      const live = window._hemmaNP(states, V);
      const st = window._hemmaNPStore(V, 'hold');
      if (live.length) { st.last = live; st.emptyAt = 0; return live; }
      if (st.last && st.last.length) {
        if (!st.emptyAt) st.emptyAt = Date.now();
        // Comfortably past the 420ms exit animation; overshoot costs nothing.
        if (Date.now() - st.emptyAt < 900) return st.last;
      }
      return live;
    };
  }

  // Memoized per render pass, so each consumer reuses one sweep.
  if (typeof window._hemmaNP !== 'function') {
    window._hemmaNP = function (states, V) {
      const artSig = (u) => {
        const t = String(u || '');
        const q = t.indexOf('?');
        if (q < 0) return t;
        const rest = t.slice(q + 1).split('&')
          .filter((p) => p.slice(0, 6) !== 'token=' && p.slice(0, 8) !== 'authSig=')
          .sort().join('&');
        return t.slice(0, q) + (rest ? '?' + rest : '');
      };
      const parts = [];
      for (let i = 1; i <= 10; i++) {
        const e = V['show_media_player_' + i] && V['media_player_' + i];
        if (e) {
          const s = states[e]; const a = s?.attributes || {};
          parts.push(e + s?.state + (a.media_title || '') +
            (a.media_position_updated_at || '') +
            artSig(a.entity_picture || a.media_image_url || a.media_album_cover_url || a.image_url));
        }
      }
      for (let i = 1; i <= 2; i++) {
        const t = V['show_plex_' + i] && V['plex_stream_' + i];
        if (t) {
          const ta = states[t]?.attributes || {};
          parts.push(t + states[t]?.state + String(ta.full_title || '') +
            String((states[t.replace(/^(sensor\.)plex_stream_(\d+)$/, '$1plex_session_$2_tautulli')]?.state) || states[t]?.state || '') +
            artSig(ta.image_url || ta.entity_picture_local || ta.entity_picture || ta.media_image_url));
        }
        const p = V['show_psn_' + i] && V['psn_' + i];
        if (p) {
          const pa = states[p]?.attributes || {};
          const pim = states[String(p).replace(/^sensor\./, 'image.')];
          const pia = (pim && pim.attributes) || {};
          parts.push(p + states[p]?.state + (pa.full_title || '') +
            artSig(pa.entity_picture_local || pa.entity_picture || pa.image_url || pa.media_image_url) +
            artSig(pia.entity_picture_local || pia.entity_picture) +
            String(pim?.state || ''));
        }
      }
      if (V.show_steam) {
        const si = states[V.steam_image];
        const sa = states[V.steam_account];
        const saa = sa?.attributes || {};
        parts.push(String(states[V.steam_online]?.state) + String(states[V.steam_game]?.state) +
          String(sa?.state || '') + String(saa.game || '') +
          artSig(si?.attributes?.entity_picture || si?.state || '') +
          artSig(saa.game_image_main || saa.game_image_header || saa.game_icon || ''));
      }
      if (V.show_discord) {
        const ia = (V.discord_image && states[V.discord_image]?.attributes) || {};
        const dcSt = String(states[V.discord_image]?.state || '');
        parts.push(String(states[V.discord_user]?.state) +
          String(states[V.discord_user]?.attributes?.game) +
          String(states[V.discord_user]?.attributes?.game_details));
        parts.push(String(states[V.discord_online]?.state) +
          String(states[V.discord_game]?.state) +
          artSig(ia.entity_picture_local || ia.entity_picture || ia.image_url || dcSt));
      }
      parts.push('pin:' + String(V.pinned_key || ''));
      const sig = parts.join('|');
      const c = window._hemmaNPStore(V, 'memo');
      if (c.sig === sig) return c.list;
      c.sig = sig;
      c.list = window._hemmaNPSources(states, V);
      return c.list;
    };
  }



    if (typeof window._hemmaNPSyncMobileRow !== 'function') {
      window._hemmaNPSyncMobileRow = function (cardEl, states) {
        const root = cardEl && cardEl.getRootNode && cardEl.getRootNode();
        const rowHost = root && root.host;
        if (!rowHost || !rowHost.shadowRoot) return;
        // Cached so a later recheck can re-run without a live slot element.
        window._hemmaNPMobileRowHostCache = rowHost;
        const shadow = rowHost.shadowRoot;

        const flipIds = ['media1','media2','media3','media4','media5','media6','media7','media8','media9'];
        const slotState = window._hemmaNPSlotState || {};
        const settled = flipIds.map(id => slotState[id]?._npHoldSrc || null);
        const activeCount = settled.filter(Boolean).length;

        const outerRoot = rowHost.getRootNode && rowHost.getRootNode();
        const outerHost = outerRoot && outerRoot.host;
        const outerTpl  = outerHost && outerHost._config && outerHost._config.template;
        const isNpCard  = outerTpl === 'hemma_mobile_now_playing'
          || (Array.isArray(outerTpl) && outerTpl.includes('hemma_mobile_now_playing'));
        if (outerHost && isNpCard) {
          const shown = activeCount > 0;
          if (outerHost._npAnyActive !== shown) {
            outerHost._npAnyActive = shown;
            const ov = shown ? 'visible' : 'hidden';
            outerHost.style.setProperty('display', 'grid', 'important');
            outerHost.style.setProperty('overflow', ov, 'important');
            outerHost.style.setProperty('grid-template-rows', shown ? '1fr' : '0fr', 'important');
            outerHost.style.setProperty('grid-template-columns', 'minmax(0,1fr)', 'important');
            outerHost.style.setProperty('opacity', shown ? '1' : '0');
            outerHost.style.setProperty('pointer-events', shown ? 'auto' : 'none');
            outerHost.style.setProperty(
              'transition',
              `grid-template-rows .5s cubic-bezier(0.32,0.72,0,1), opacity ${shown ? '.35s ease .12s' : '.25s ease'}`
            );
            const aspectRatio = outerHost.shadowRoot?.getElementById('aspect-ratio');
            if (aspectRatio) aspectRatio.style.setProperty('overflow', ov, 'important');
            const haCard = outerHost.shadowRoot?.querySelector('ha-card.button-card-main');
            if (haCard) {
              haCard.style.setProperty('min-height', '0', 'important');
              haCard.style.setProperty('overflow', ov, 'important');
            }
          }
        }

        const filter = states?.['input_select.hemma_mobile_filter']?.state ?? 'all';
        const inColumn = filter === 'media';
        const usesPeek = !inColumn && activeCount > 1;

        const gutters = '(max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 16px)) + var(--hemma-rail-left, 16px))';
        const activeW = usesPeek
          ? `calc(100vw - ${gutters} - var(--np-peek, 26px))`
          : `calc(100vw - ${gutters})`;
        const activeGap = usesPeek ? 'var(--np-gap, 10px)' : '0px';

        const prevPeek = rowHost._npRowUsesPeek;
        const firstRun = prevPeek === undefined;
        rowHost._npRowUsesPeek = usesPeek;

        const curKeys = flipIds.map((_, i) => settled[i]?.key || null);
        const prevKeys = rowHost._npSlotKeys || [];
        const slotKeyChanged = new Set();
        curKeys.forEach((k, i) => { if (prevKeys[i] !== k) slotKeyChanged.add(flipIds[i]); });
        rowHost._npSlotKeys = curKeys;

        if (firstRun || prevPeek === usesPeek) {
          rowHost.style.setProperty('--np-active-w', activeW);
          rowHost.style.setProperty('--np-active-gap', activeGap);
          return;
        }

        if (rowHost._npFlipPending) {
          rowHost.style.setProperty('--np-active-w', activeW);
          rowHost.style.setProperty('--np-active-gap', activeGap);
          return;
        }
        rowHost._npFlipPending = true;

        const beforeRects = {};
        for (const id of flipIds) {
          const el = shadow.getElementById(id);
          if (el) beforeRects[id] = el.getBoundingClientRect();
        }

        rowHost.style.setProperty('--np-active-w', activeW);
        rowHost.style.setProperty('--np-active-gap', activeGap);

        const reduceMotion = window.matchMedia
          && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) { rowHost._npFlipPending = false; return; }

        requestAnimationFrame(() => {
          rowHost._npFlipPending = false;
          for (const id of flipIds) {
            if (slotKeyChanged.has(id)) continue;
            const el = shadow.getElementById(id);
            if (!el) continue;
            const before = beforeRects[id];
            if (!before || before.width < 2) continue;
            const after = el.getBoundingClientRect();
            if (after.width < 2) continue;
            if (Math.abs(before.width - after.width) < 1) continue;
            const ratio = before.width / after.width;
            el.style.transformOrigin = 'left center';
            try { el._npWidthFlip?.cancel(); } catch (e) {}
            el._npWidthFlip = el.animate(
              [{ transform: `scaleX(${ratio})` }, { transform: 'scaleX(1)' }],
              { duration: 460, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }
            );
          }
        });
      };
    }

    if (!window._hemmaNPResizeGuardInstalled) {
      window._hemmaNPResizeGuardInstalled = true;
      window.addEventListener('resize', () => {
        const slots = window._hemmaNPSlotState || {};
        for (const key of Object.keys(slots)) {
          const s = slots[key];
          try { s._npChipAnim?.cancel(); } catch (e) {}
          try { s._npShiftAnim?.cancel(); } catch (e) {}
        }
      });
    }

    if (typeof window._hemmaNPMobileRecheck !== 'function') {
      window._hemmaNPMobileRecheck = function (states) {
        const rowHost = window._hemmaNPMobileRowHostCache;
        if (!rowHost || !rowHost.isConnected) return;
        window._hemmaNPSyncMobileRow({ getRootNode: () => ({ host: rowHost }) }, states);
      };
    }

    if (typeof window._hemmaNPDesktopSettle !== 'function') {
      window._hemmaNPDesktopSettle = function (states, V) {
        const DEPART_HOLD_MS = 500;

        const raw = window._hemmaNP(states, V);
        const rawByKey = new Map(raw.map(r => [r.key, r]));
        const rawKeys = raw.map(r => r.key);

        // Keys here are slot names (psn1, mp3), which every card shares.
        const state = window._hemmaNPStore(V, 'desktop');
        state.keys = state.keys || {};

        for (const key of rawKeys) {
          const k = state.keys[key] = state.keys[key] || {};
          k.lastRecord = rawByKey.get(key);
          k.departedAt = null;
        }

        let anyPending = false;
        for (const key of Object.keys(state.keys)) {
          if (rawByKey.has(key)) continue;
          const k = state.keys[key];
          if (!k.departedAt) k.departedAt = Date.now();
          if (Date.now() - k.departedAt >= DEPART_HOLD_MS) { delete state.keys[key]; continue; }
          anyPending = true;
        }

        const departingKeys = Object.keys(state.keys).filter(k => !rawByKey.has(k));
        const orderedKeys = rawKeys.concat(departingKeys);

        for (const key of rawKeys) {
          if (rawByKey.get(key)?.state === 'paused') { anyPending = true; break; }
        }

        return { list: orderedKeys.map(k => state.keys[k].lastRecord), pending: anyPending };
      };
    }


    if (typeof window._hemmaNPPlan !== 'function') {
      window._hemmaNPPlan = function (states, V) {
        const EXIT_MS = 480;
        // Cap on waiting for artwork before opening an arrival anyway.
        const ART_CAP = 400;
        const OPEN_MIN = 60;
        const ANCHOR = 4;
        // Per card, like every other Now Playing store.
        const S = window._hemmaNPStore(V, 'plan');
        if (!S.order) Object.assign(S, {
          order: [], pos: {}, slotKeys: [], exits: [], exitSrc: {}, lastRec: {},
          changed: {}, done: {}, pending: {}, aliveN: -1, sig: null, timer: 0, gen: 0,
        });

        const live = (typeof window._hemmaNPView === 'function')
          ? window._hemmaNPView(states, V) : [];
        const now = Date.now();
        const liveKeys = live.map((x) => x && x.key).filter(Boolean);
        const sig = liveKeys.join(',');

        live.forEach((r) => {
          if (!r || !r.key) return;
          S.lastRec[r.key] = r;
          delete S.done[r.key];
        });

        const forceRender = () => {
          const targets = [window._hemmaNPRowCard, window._hemmaNPShell]
            .filter((t) => t && t.isConnected);
          for (const t of targets) {
            try {
              const h = t._hass || t.hass;
              if (h) t.hass = Object.assign({}, h);
              if (typeof t.requestUpdate === 'function') t.requestUpdate('_config', undefined);
            } catch (err) {}
          }
        };

        const alive = [];
        for (const e of S.exits) {
          if ((now - e.at) < EXIT_MS) alive.push(e);
          else S.done[e.key] = 1;
        }

        if (S.sig !== sig || alive.length !== S.aliveN) {
          S.exits = alive;
          const liveSet = {};
          liveKeys.forEach((k) => { liveSet[k] = 1; });
          const exiting = {};
          S.exits.forEach((e) => { exiting[e.key] = 1; });

          const prevOrder = S.order.slice();

          for (const k of prevOrder) {
            if (!k || liveSet[k] || exiting[k] || S.done[k]) continue;
            if (!S.lastRec[k]) continue;
            S.exits.push({ key: k, at: now });
            S.exitSrc[k] = S.lastRec[k];
            exiting[k] = 1;
          }

          // Existing sources hold their relative order; only genuinely new keys are placed.
          const order = prevOrder.filter((k) => liveSet[k] || exiting[k]);
          const fresh = [];
          for (const k of liveKeys) {
            if (order.indexOf(k) !== -1) continue;
            const rk = liveKeys.indexOf(k);
            let at = order.length;
            for (let i = 0; i < order.length; i++) {
              const oi = liveKeys.indexOf(order[i]);
              if (oi !== -1 && oi > rk) { at = i; break; }
            }
            order.splice(at, 0, k);
            fresh.push(k);
          }

          let base = ANCHOR;
          if (order.length) {
            const head = order[0];
            if (S.pos[head] !== undefined) base = S.pos[head];
            else {
              const prevHead = prevOrder.filter((k) => S.pos[k] !== undefined)[0];
              base = (prevHead !== undefined) ? (S.pos[prevHead] - 1) : ANCHOR;
            }
          }
          if (base + order.length > 9) base = 9 - order.length;
          if (base < 0) base = 0;

          const next = new Array(9).fill(null);
          const pos = {};
          order.forEach((k, i) => {
            const idx = base + i;
            if (idx >= 0 && idx < 9) { next[idx] = k; pos[k] = idx; }
          });

          const changed = {};
          for (let i = 0; i < 9; i++) {
            if ((S.slotKeys[i] || null) !== (next[i] || null)) changed['media' + (i + 1)] = true;
          }

          for (const k of Object.keys(S.exitSrc)) if (!exiting[k]) delete S.exitSrc[k];
          for (const k of Object.keys(S.pending)) if (!liveSet[k]) delete S.pending[k];

          const rowWasEmpty = !prevOrder.length;
          for (const k of fresh) {
            if (rowWasEmpty) continue;
            S.pending[k] = 1;
            const rec = S.lastRec[k];
            const art = rec && rec.art;
            let fired = false;
            const open = () => {
              if (fired) return;
              fired = true;
              setTimeout(() => {
                if (!S.pending[k]) return;
                delete S.pending[k];
                forceRender();
              }, OPEN_MIN);
            };
            if (art) {
              try {
                const img = new Image();
                img.decoding = 'async';
                img.src = art;
                if (img.decode) img.decode().then(open).catch(open);
                else { img.onload = open; img.onerror = open; }
              } catch (err) { open(); }
              setTimeout(open, ART_CAP);
            } else {
              open();
            }
          }

          S.order = order;
          S.pos = pos;
          S.slotKeys = next;
          S.changed = changed;
          S.sig = sig;
          S.aliveN = S.exits.length;
          S.gen = (S.gen || 0) + 1;

          try { clearTimeout(S.timer); } catch (err) {}
          if (S.exits.length) {
            const due = Math.min.apply(null, S.exits.map((e) => e.at + EXIT_MS));
            const delay = Math.max(30, (due - Date.now()) + 40);
            if (window._hemmaNPDebug === true) {
              console.log('%c[NP release scheduled]', 'color:#fa0', delay + 'ms');
            }
            S.timer = setTimeout(() => {
              forceRender();
              if (window._hemmaNPDebug === true) {
                console.log('%c[NP release fired]', 'color:#fa0');
              }
            }, delay);
          }
        }

        const byKey = {};
        live.forEach((r) => { if (r && r.key) byKey[r.key] = r; });
        return S.slotKeys.map((k) => (k ? (byKey[k] || S.exitSrc[k] || null) : null));
      };
    }


    // ── Plex session popup ─────────────────────────────────────────────────
    if (typeof window._hemmaPlexPopupCard !== 'function') {
      window._hemmaPlexPopupCard = function (sid, states) {
        const resolveTau = (id) => {
          if (!id) return null;
          const indexed = id.replace(/^(sensor\.)plex_stream_(\d+)$/, '$1plex_session_$2_tautulli');
          if (indexed !== id && states[indexed]) return indexed;
          const want = String(states[id]?.attributes?.full_title || '').trim();
          if (!want) return null;
          for (let n = 1; n <= 8; n++) {
            const cand = 'sensor.plex_session_' + n + '_tautulli';
            const ca = states[cand]?.attributes;
            if (ca && String(ca.full_title || '').trim() === want) return cand;
          }
          return null;
        };
        const tauEntity = resolveTau(sid) || sid || '';

        const a = states[tauEntity]?.attributes || {};

        /* Poster */
        const esc = (s) => String(s ?? '')
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

        const resolveUrl = (raw) => {
          if (!raw) return null;
          const s = String(raw);
          return s.startsWith('/') ? location.origin + s : s;
        };

        const posterUrl = resolveUrl(a.image_url);

        const posterHtml = posterUrl
          ? '<div style="position:relative;width:90px;height:135px;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.32);">'
              + '<img src="' + esc(posterUrl) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px;display:block;" />'
              + '<div style="position:absolute;inset:0;border-radius:12px;pointer-events:none;'
                + 'box-shadow:var(--hemma-media-poster-highlight, inset 0 1px 1px -0.5px rgba(255,255,255,0.15), inset 0 -1px 1px -0.5px rgba(255,255,255,0.05));'
                + 'background:var(--hemma-media-poster-glow-top, linear-gradient(to bottom, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.12) 10%, rgba(255,255,255,0) 38%)), '
                + 'var(--hemma-media-poster-glow-bottom, linear-gradient(to top, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.07) 10%, rgba(255,255,255,0) 35%));"></div>'
            + '</div>'
          : '<div style="width:90px;height:135px;background:rgba(255,255,255,0.07);border-radius:12px;display:flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:plex" style="--mdc-icon-size:32px;color:rgba(255,255,255,0.35);"></ha-icon></div>';

        const padTop = 24;
        const padBottom = 14;

        /* Card */
        const mainCard = {
          type: 'custom:button-card',
          entity: sid || tauEntity,
          tap_action: { action: 'none' },
          show_icon: false, show_name: false, show_label: false, show_state: false,
          variables: {
            tau_entity: tauEntity,
            pad_top: padTop,
            pad_bottom: padBottom,
          },
          styles: {
            card: [
              { border: 'none' },
              { padding: '0' },
              { background: 'var(--hemma-popup-chart-fill, rgba(0,0,0,0.26))' },
              { 'border-radius': 'var(--hemma-popup-row-radius, 20px)' },
              { 'backdrop-filter': 'var(--hemma-popup-plate-backdrop, none)' },
              { '-webkit-backdrop-filter': 'var(--hemma-popup-plate-backdrop, none)' },
              { 'box-shadow': 'var(--hemma-popup-plate-shadow, none)' },
              { '--ha-card-box-shadow': 'none' },
              { '--ha-card-border-color': 'transparent' },
            ],
            grid: [
              { 'grid-template-areas': '"c"' },
              { 'grid-template-columns': '1fr' },
            ],
            custom_fields: {
              poster: [
                { position: 'absolute' },
                { top: padTop + 'px' },
                { left: '28px' },
                { 'z-index': '2' },
              ],
              c: [{ 'justify-self': 'stretch' }],
            },
          },
          extra_styles: `[[[
            const tauEid = variables?.tau_entity || entity?.entity_id || '';
            const a = states[tauEid]?.attributes || entity?.attributes || {};
            const progress = Math.min(100, Math.max(0, parseFloat(a.progress_percent || '0') || 0));
            const remSecs = (() => {
              const t = String(a.stream_remaining || '');
              if (!t) return 0;
              const p = t.split(':').map(Number);
              return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p.length === 2 ? p[0]*60 + p[1] : 0;
            })();
            const isPlaying = (states[tauEid]?.state || '').toLowerCase() === 'playing';
            const totalSecs = (progress > 0 && progress < 100 && remSecs > 0)
              ? remSecs / (1 - progress / 100) : 0;
            const elapsedSecs = Math.max(0, totalSecs - remSecs);
            const animPart = (isPlaying && totalSecs > 0)
              ? \`animation: plexProgressFill \${totalSecs.toFixed(1)}s linear -\${elapsedSecs.toFixed(1)}s forwards;\`
              : '';
            return \`
              @keyframes plexProgressFill {
                from { width: 0%; }
                to { width: 100%; }
              }
              #plex-prog-fill { \${animPart} }
              :host {
                --ha-card-box-shadow: none !important;
                --button-card-box-shadow: none !important;
                --button-card-box-shadow-hover: none !important;
                --button-card-padding: 0px;
                overflow: visible !important;
              }
              ha-card {
                --ha-card-background: transparent !important;
                --card-background-color: transparent !important;
                --ha-card-box-shadow: none !important;
                --ha-card-border-color: transparent !important;
                overflow: visible !important;
                /* Here, not in styles.card: these are !important and beat an
                   inline style, so a transparent default left the player
                   floating on the room. will-change:auto because the theme's
                   will-change on ha-card makes the frost inert. */
                background: var(--hemma-popup-chart-fill, rgba(0,0,0,0.26)) !important;
                backdrop-filter: var(--hemma-popup-plate-backdrop, none) !important;
                -webkit-backdrop-filter: var(--hemma-popup-plate-backdrop, none) !important;
                border: none !important;
                border-radius: var(--hemma-popup-row-radius, 20px) !important;
                box-shadow: var(--hemma-popup-plate-shadow, none) !important;
                will-change: auto !important;
                cursor: default !important;
                position: relative !important;
                padding: 0 !important;
              }
              #container {
                padding: 0 !important;
                text-align: left !important;
                position: relative !important;
                z-index: 2 !important;
                overflow: visible !important;
              }
              /* button-card's .ellipsis class clips every custom_field tightly
               * to content, which cuts the poster's corner anti-aliasing and
               * shadow. Override #poster only - text truncation elsewhere still
               * relies on the shared class. */
              #poster { overflow: visible !important; }
              /* A phone sheet leaves the text column about 190px wide. The
                 avatar still says who is watching; the name is what does not
                 fit beside a title. */
              @media (max-width: 600px) {
                .plex-user-name { display: none !important; }
              }
              ha-ripple { display: none !important; }
              ha-card:hover { box-shadow: none !important; }
            \`;
          ]]]`,
          custom_fields: {
            poster: posterHtml,
            c: `[[[
              /* Resolution */
              const tauEid = variables?.tau_entity || entity?.entity_id || '';
              const a = states[tauEid]?.attributes || entity?.attributes || {};

              /* Helpers */
              const esc = (s) => String(s ?? '')
                .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

              /* Media Data */
              const mediaType = (a.media_type || '').toLowerCase();
              const isEpisode = mediaType === 'episode';
              const showTitle = isEpisode
                ? (a.grandparent_title || a.full_title || _hemmaL('state.default.unknown', 'Unknown'))
                : (a.title || a.full_title || _hemmaL('state.default.unknown', 'Unknown'));
              const episodeTitle = isEpisode ? (a.title || '') : '';
              const seasonEpisode = isEpisode
                ? 'S' + (a.parent_media_index || '?') + ' · E' + (a.media_index || '?')
                : (a.year ? String(a.year) : '');

              const progress = Math.min(100, Math.max(0, parseFloat(a.progress_percent || '0') || 0));

              const remSecs = (() => {
                const t = String(a.stream_remaining || '');
                if (!t) return null;
                const p = t.split(':').map(Number);
                return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2]
                     : p.length === 2 ? p[0]*60 + p[1] : null;
              })();
              const timeLeft = (remSecs == null || remSecs <= 0) ? ''
                : remSecs < 90   ? _hemmaT('time.less_than_min_left', 'Less than 1 min left')
                : remSecs < 3600 ? _hemmaT('time.min_left', '{n} min left', { n: Math.floor(remSecs/60) })
                : _hemmaT('time.hr_min_left', '{h} hr {m} min left', { h: Math.floor(remSecs/3600), m: Math.floor((remSecs%3600)/60) });

              /* Video / Audio Formatting */
              const fmtVCodec = (c) => {
                const m = {h264:'H.264',hevc:'H.265',h265:'H.265',av1:'AV1',vp9:'VP9',vc1:'VC1',mpeg4:'MPEG-4',mpeg2video:'MPEG-2'};
                return m[(c||'').toLowerCase()] || (c||'').toUpperCase();
              };
              const fmtACodec = (c) => {
                const m = {dts:'DTS',dca:'DTS','dts-hd ma':'DTS-HD MA','dts-hd':'DTS-HD',eac3:'EAC3','e-ac-3':'EAC3',ac3:'AC3',aac:'AAC',mp3:'MP3',truehd:'TrueHD',flac:'FLAC',opus:'Opus',pcm:'PCM'};
                return m[(c||'').toLowerCase()] || (c||'').toUpperCase();
              };
              const fmtCh = (l) => {
                const m = {'7.1':'7.1','5.1':'5.1','5.1(side)':'5.1','5.1(back)':'5.1',stereo:'Stereo','2.0':'Stereo',mono:'Mono','1.0':'Mono'};
                return m[(l||'').toLowerCase()] || l || '';
              };
              const fmtRes = (r) => { const m = {'4k':'4K','8k':'8K','2k':'2K'}; return m[(r||'').trim().toLowerCase()] || (r||''); };
              const fmtVideoDR = (dr) => {
                const d = (dr||'').toLowerCase();
                if (!d) return '';
                if (d.includes('dolby vision') && d.includes('hdr10+')) return 'Dolby Vision · HDR10+';
                if (d.includes('dolby vision') && d.includes('hdr10')) return 'Dolby Vision · HDR10';
                if (d.includes('dolby vision')) return 'Dolby Vision';
                if (d.includes('hdr10+')) return 'HDR10+';
                if (d.includes('hdr10')) return 'HDR10';
                if (d.includes('hdr')) return 'HDR';
                if (d === 'sdr') return 'SDR';
                return '';
              };
              const fmtAudioExtra = (prof) => {
                const p = (prof||'').toLowerCase();
                if (!p) return '';
                if (p.includes('atmos')) return 'Dolby Atmos';
                if (p.includes('truehd')) return 'TrueHD';
                if (p.includes('dts:x') || p.includes('dts-x')) return 'DTS:X';
                if (p.includes('auro-3d')) return 'Auro-3D';
                return '';
              };

              const videoRes = fmtRes(a.stream_video_full_resolution || (a.video_resolution ? a.video_resolution+'p' : ''));
              const videoCodec = fmtVCodec(a.stream_video_codec || a.video_codec || '');
              const vBrKbps = parseInt(a.stream_video_bitrate || '0');
              const videoBitrate = vBrKbps > 0 ? (vBrKbps >= 1000 ? window.hemmaNum(vBrKbps/1000, 1, 1)+' Mbps' : vBrKbps+' Kbps') : '';
              const videoDR = fmtVideoDR(a.stream_video_dynamic_range || a.video_dynamic_range || '');
              const hasDV = videoDR.startsWith('Dolby Vision');
              const videoDVExtra = hasDV ? 'Dolby Vision' : '';
              const videoDRLine = hasDV ? videoDR.replace('Dolby Vision · ', '').replace('Dolby Vision', '').trim() : videoDR;
              const videoStr = [videoRes, videoDRLine, videoCodec].filter(Boolean).join(' · ');

              const audioLang = a.stream_audio_language || a.audio_language || '';
              const audioCodec = fmtACodec(a.stream_audio_codec || a.audio_codec || '');
              const audioCh = fmtCh(a.stream_audio_channel_layout || a.audio_channel_layout || '');
              const audioStr = [audioLang, audioCodec, audioCh].filter(Boolean).join(' · ');
              const audioExtra = fmtAudioExtra(a.audio_profile || '');

              /* Stream Quality */
              const qualityProfile = a.quality_profile || '';
              const streamBrKbps = parseInt(a.stream_bitrate || a.bitrate || '0');
              const streamBrStr = streamBrKbps > 0
                ? (streamBrKbps >= 1000 ? window.hemmaNum(streamBrKbps/1000, 1, 1)+' Mbps' : streamBrKbps+' Kbps')
                : '';

              /* ip_address is NOT part of hasConn: without location or the local
               * flag an address cannot tell lan from wan. Geo is tooltip-only
               * and remote-only, since Tautulli derives it from the public ip
               * even on a lan session. */
              const locRaw = String(a.location || '').toLowerCase();
              const hasConn = !!(locRaw || a.local != null);
              const isLocal = locRaw ? locRaw === 'lan' : String(a.local ?? '') === '1';
              const relayed = String(a.relayed ?? '') === '1' || String(a.relay ?? '') === '1';
              const playerStr = String(a.player || a.device || a.platform || '').trim();
              const connValue = [
                hasConn ? (isLocal ? _hemmaT('media.local', 'Local') : _hemmaT('media.remote', 'Remote')) : '',
                playerStr,
              ].filter(Boolean).join(' · ');
              const connHint = [
                (hasConn && !isLocal)
                  ? ([a.geo_city || '', a.geo_region || ''].filter(Boolean).join(', ')
                     || String(a.geo_country || ''))
                  : '',
                relayed ? _hemmaT('media.relay_note', 'Proxied by Plex Relay rather than served directly') : '',
              ].filter(Boolean).join(' — ');

              /* Doubled backslashes, and they must stay: this block is a template
               * literal, so the JS engine consumes escapes BEFORE button-card
               * evals it. A single \\s arrives as a bare s and matches the wrong
               * thing silently. */
              const decisionLabel = (raw) => raw === 'direct play' ? _hemmaT('media.direct_play', 'Direct Play')
                : raw === 'direct stream' || raw === 'copy' ? _hemmaT('media.direct_stream', 'Direct Stream')
                : raw === 'transcode' ? _hemmaT('media.transcode', 'Transcode')
                : raw ? raw.replace(/(^|\\s)\\S/g, c => c.toUpperCase()) : '';
              const decisionColor = (raw) => raw === 'direct play'
                ? 'var(--hemma-popup-primary-color,#00c3d0)'
                : raw === 'direct stream' || raw === 'copy'
                ? 'var(--hemma-popup-yellow-color,#ffd600)'
                : raw === 'transcode' ? 'var(--hemma-popup-orange-color,#ff9230)'
                : 'rgba(255,255,255,0.4)';

              /* Transcode Chips - Video */
              const tdRaw = (a.transcode_decision || a.stream_video_decision || '').toLowerCase();
              const tdLabel = decisionLabel(tdRaw);
              const tdColor = decisionColor(tdRaw);

              /* Transcode Chips - Audio */
              const adRaw = (a.stream_audio_decision || a.audio_decision || '').toLowerCase();
              const adLabel = decisionLabel(adRaw);
              const adColor = decisionColor(adRaw);

              /* An indicator, not a control: a Plex session exposes no transport.
               * 14px against the text's 13px, and a shade more alpha: these
               * glyphs fill ~15 of 24 viewBox units, so matching the numbers
               * leaves the triangle reading weedy. Optical, not arithmetic. */
              const rawState = (states[tauEid]?.state || entity?.state || '').toLowerCase();
              const svgGlyph = (inner) => '<svg width="14" height="14" viewBox="0 0 24 24" style="flex-shrink:0;display:block;fill:rgba(255,255,255,0.58);">' + inner + '</svg>';
              const stateIconHtml = rawState === 'playing'   ? svgGlyph('<path d="M8.2 4.6a1.2 1.2 0 0 0-1.85 1.01v12.78A1.2 1.2 0 0 0 8.2 19.4l10.1-6.39a1.2 1.2 0 0 0 0-2.02L8.2 4.6z"/>')
                : rawState === 'paused'     ? svgGlyph('<rect x="6" y="4.5" width="4.2" height="15" rx="1.7"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.7"/>')
                : rawState === 'buffering'  ? svgGlyph('<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>')
                : rawState === 'stopped'    ? svgGlyph('<rect x="6" y="6" width="12" height="12" rx="2.4"/>')
                : '';

              /* User. The device tooltip only earns its keep when device and
               * player actually differ ("Apple TV → Living Room") - the player
               * is on the Connection tile now, so when they match, as they do on
               * a phone, this was just "iPhone → iPhone". */
              const userName = a.user_friendly_name || a.user || '';
              const userThumb = a.user_thumb || '';
              const devName = String(a.device || '').trim();
              const deviceStr = (devName && devName !== playerStr)
                ? [devName, playerStr].filter(Boolean).join(' → ')
                : '';

              /* HTML Fragments */
              /* Rounded square rather than a circle, so the avatar matches the
               * poster beside it. The rim is an inset box-shadow - a border
               * would pull the background-image away from the rounded edge. */
              const thumbUrl = userThumb.replace(/[()'" ]/g, encodeURIComponent);
              const avatarHtml = userThumb
                ? '<div style="width:28px;height:28px;border-radius:20%;flex-shrink:0;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.14);background:rgba(255,255,255,0.1) url(' + thumbUrl + ') center/cover no-repeat;"></div>'
                : '<div style="width:28px;height:28px;border-radius:20%;background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.14);"><ha-icon icon="mdi:account" style="--mdc-icon-size:16px;width:16px;height:16px;color:rgba(255,255,255,0.45);"></ha-icon></div>';

              const userBlock = (userName || userThumb)
                ? '<div style="display:flex;align-items:center;gap:9px;flex-shrink:0;"'
                    + (deviceStr ? ' title="' + esc(deviceStr) + '"' : '') + '>'
                    + (userName ? '<span class="plex-user-name" style="font-size:13px;font-weight:500;letter-spacing:-0.08px;color:rgba(255,255,255,0.72);white-space:nowrap;">' + esc(userName) + '</span>' : '')
                    + avatarHtml
                  + '</div>'
                : '';

              /* Type scale */
              const fsTitle = 'clamp(18px, 4.6vw, 20px)';
              const fsMeta = '14px';
              const fsValue = '15px';
              const fsCaption = '13px';

              const tilePrimary = 'var(--hemma-popup-tiles-text-primary, rgba(255,255,255,0.95))';
              const tileSecondary = 'var(--hemma-popup-tiles-text-secondary, rgba(255,255,255,0.75))';
              const tileMuted = 'var(--hemma-popup-tiles-text-muted, rgba(255,255,255,0.52))';

              /* Glass tiles */
              /* Flat. These sit INSIDE the player's own plate, so they get a
                 fill and nothing else: a specular rim would make them read as
                 glass objects resting on a surface that is not glass, and a
                 drop shadow inside a shadowed plate just muddies both. */
              const tileStyle = 'display:flex;flex-direction:column;box-sizing:border-box;'
                + 'flex:1 1 calc(50% - 4px);min-width:min(100%, 220px);'
                + 'padding:18px 18px 16px 18px;'
                + 'border-radius:var(--hemma-popup-row-radius, 20px);'
                + 'background:var(--hemma-media-tile-fill, rgba(255,255,255,0.055));';

              const tileHead = (icon, label, status, statusColor) =>
                '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px;">'
                  + '<div style="display:flex;align-items:center;gap:7px;min-width:0;">'
                    + '<ha-icon icon="' + icon + '" style="--mdc-icon-size:14px;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:' + tileMuted + ';"></ha-icon>'
                    + '<span style="font-size:' + fsCaption + ';font-weight:400;letter-spacing:-0.01em;white-space:nowrap;color:' + tileSecondary + ';">' + esc(label) + '</span>'
                  + '</div>'
                  + (status ? '<span style="font-size:' + fsCaption + ';font-weight:500;letter-spacing:-0.01em;white-space:nowrap;color:' + statusColor + ';">' + esc(status) + '</span>' : '')
                + '</div>';

              const tileValue = (text) =>
                '<span style="font-size:' + fsValue + ';font-weight:500;line-height:1.35;letter-spacing:-0.2px;color:' + tilePrimary + ';">' + esc(text) + '</span>';

              const tileSub = (text) => text
                ? '<span style="font-size:' + fsCaption + ';font-weight:400;line-height:1.3;margin-top:4px;color:' + tileMuted + ';">' + esc(text) + '</span>'
                : '';

              const videoTile = '<div style="' + tileStyle + '">'
                + tileHead('mdi:movie-open-outline', _hemmaT('media.video', 'Video'), tdLabel, tdColor)
                + tileValue(videoStr || '—')
                + tileSub(videoDVExtra)
              + '</div>';

              const audioTile = '<div style="' + tileStyle + '">'
                + tileHead('mdi:volume-high', _hemmaT('media.audio', 'Audio'), adLabel, adColor)
                + tileValue(audioStr || '—')
                + tileSub(audioExtra)
              + '</div>';

              const qualityTile = '<div style="' + tileStyle + '">'
                + tileHead('mdi:quality-high', _hemmaT('media.quality', 'Quality'), '', '')
                + tileValue([qualityProfile, streamBrStr].filter(Boolean).join(' · ') || '—')
              + '</div>';

              /* Relay gets the status slot rather than a line of its own - it is
               * the same kind of fact as Transcode, and worth the orange: a
               * relayed stream is proxied by Plex instead of coming from the
               * server directly, and is bandwidth-capped. */
              const connectionTile = '<div style="' + tileStyle + '"'
                  + (connHint ? ' title="' + esc(connHint) + '"' : '') + '>'
                + tileHead(isLocal ? 'mdi:lan-connect' : 'mdi:earth', _hemmaT('media.connection', 'Connection'),
                    relayed ? _hemmaT('media.relayed', 'Relayed') : '', 'var(--hemma-popup-orange-color,#ff9230)')
                + tileValue(connValue || '—')
              + '</div>';

              /* Scrubber */
              const progressHtml = '<div style="margin-top:14px;height:4px;border-radius:999px;overflow:hidden;background:var(--hemma-popup-progress-track, rgba(255,255,255,0.16));">'
                + '<div id="plex-prog-fill" style="height:100%;width:' + progress.toFixed(1) + '%;border-radius:999px;background:linear-gradient(90deg,#D28512,#e5a00d 55%,#F2BC1A);"></div>'
              + '</div>';

              /* Keep every line single-line: the poster is pinned 50px from the
               * top while this column centres against a 135px spacer, so a
               * taller column slides out from under it. */
              return '<div style="text-align:left;position:relative;">'
                + '<div style="padding:' + (variables?.pad_top ?? 24) + 'px 28px 26px 28px;display:flex;align-items:center;gap:20px;">'
                  + '<div style="width:90px;height:135px;flex-shrink:0;"></div>'
                  + '<div style="display:flex;flex-direction:column;min-width:0;flex:1;text-align:left;">'
                    /* The title gets the whole line - it is the one thing here that
                       must not be cut. Who is watching is secondary, so it drops
                       to the metadata line's trailing edge. */
                    /* The title wraps rather than truncating, which is what lets the
                       viewer share the row. On a phone the name drops and the
                       avatar stands alone. */
                    + '<div style="display:flex;align-items:flex-start;gap:12px;">'
                      + '<div style="flex:1;min-width:0;font-size:' + fsTitle + ';font-weight:700;letter-spacing:-0.4px;color:#fff;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + esc(showTitle) + '</div>'
                      + '<div style="flex:none;">' + userBlock + '</div>'
                    + '</div>'
                    + (episodeTitle ? '<div style="font-size:' + fsMeta + ';font-weight:500;letter-spacing:-0.2px;color:rgba(255,255,255,0.8);line-height:1.35;margin-top:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(episodeTitle) + '</div>' : '')
                    + (seasonEpisode ? '<div style="font-size:' + fsMeta + ';font-weight:400;letter-spacing:-0.2px;color:rgba(255,255,255,0.5);line-height:1.35;margin-top:10px;">' + esc(seasonEpisode) + '</div>' : '')
                    + progressHtml
                    + (timeLeft ? '<div style="display:flex;align-items:center;gap:6px;margin-top:9px;">'
                        + stateIconHtml
                        + '<span style="font-size:' + fsCaption + ';font-weight:400;letter-spacing:-0.08px;color:rgba(255,255,255,0.5);">' + esc(timeLeft) + '</span>'
                      + '</div>' : '')
                  + '</div>'
                + '</div>'
                + '<div style="padding:0 28px ' + (variables?.pad_bottom ?? 14) + 'px 28px;display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;">'
                  + videoTile
                  + audioTile
                  + qualityTile
                  + connectionTile
                + '</div>'
              + '</div>';
            ]]]`,
          },
        };

        return mainCard;
      };
    }
})();

// ── Mobile wallpaper ─────────────────────────────────────────────────────────
(function () {
  const MOBILE_MQ = window.matchMedia('(max-width: 767px), (max-height: 500px)');
  const MOBILE_RE = /^\/[^/]*[-_]mobile(\/|$)/i;
  const WALLPAPER_JS = 3;
  if ((window.__hemmaWallpaperJs || 0) >= WALLPAPER_JS) return;
  window.__hemmaWallpaperJs = WALLPAPER_JS;
  try {
    document.documentElement.style.setProperty(
      '--hemma-wallpaper-js', String(WALLPAPER_JS));
  } catch (e) {}

  // Phone landscape needs its own query: MOBILE_MQ matches 393x852 and 852x393 alike.
  const LANDSCAPE_MQ = window.matchMedia('(orientation: landscape) and (max-height: 500px)');

  // ── Background injection ─────────────────────────────────────────────────────

  const SAFE = 'env(safe-area-inset-top, 0px)';
  const off = (v) => `calc(${v} + ${SAFE})`;

  const BG = {
    image:
      'linear-gradient(to bottom,'
      + ' var(--hemma-mobile-hero-tint-top, rgba(170,170,170,0.30)) 0%,'
      + ' var(--hemma-mobile-hero-tint-bot, rgba(170,170,170,0.12))'
      + ` ${off('var(--hemma-mobile-hero-wash-mid, 34%)')},`
      + ` transparent ${off('var(--hemma-mobile-hero-wash-end, 70%)')}),`
      // Same order as the card's ::before, or the two meshes disagree.
      + ' radial-gradient('
      + ' var(--hemma-mobile-hero-mesh-a-size, 120% 46%) at'
      + ' var(--hemma-mobile-hero-mesh-a-pos, 18% 58%),'
      + ' var(--hemma-mobile-hero-mesh-a, transparent) 0%,'
      + ' transparent 72%),'
      + ' radial-gradient('
      + ' var(--hemma-mobile-hero-mesh-b-size, 130% 50%) at'
      + ' var(--hemma-mobile-hero-mesh-b-pos, 88% 92%),'
      + ' var(--hemma-mobile-hero-mesh-b, transparent) 0%,'
      + ' transparent 70%),'
      + ' linear-gradient(var(--hemma-mobile-hero-angle, 190deg),'
      + ` transparent ${off('var(--hemma-mobile-hero-fade-start, 0%)')},`
      + ' var(--hemma-mobile-hero-c-handoff, #967f67)'
      + ` ${off('var(--hemma-mobile-hero-p-handoff, 33%)')},`
      + ' var(--hemma-mobile-hero-c-upper, #7e6d59)'
      + ` ${off('var(--hemma-mobile-hero-p-upper, 43%)')},`
      + ' var(--hemma-mobile-hero-c-mid, #685a4b)'
      + ` ${off('var(--hemma-mobile-hero-p-mid, 63%)')},`
      + ' var(--hemma-mobile-hero-c-lower, #51473d)'
      + ` ${off('var(--hemma-mobile-hero-p-lower, 83%)')},`
      + ' var(--hemma-mobile-hero-c-base, #3b352e)'
      + ` ${off('var(--hemma-mobile-hero-p-base, 100%)')}),`
      + ' var(--hemma-mobile-hero-img, url("/local/hemma/rooms/home-demo.jpg"))',
    sizePortrait: '100% 100%, 100% 100%, 100% 100%, 100% 100%, auto '
      + off('var(--hemma-mobile-hero-height, 36.5%)'),
    sizeLandscape: '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% auto',
    position: '0 0, 0 0, 0 0, 0 0, '
      + 'var(--hemma-mobile-hero-x, 50%) var(--hemma-mobile-hero-y, 0%)',
    color: 'var(--hemma-mobile-hero-floor, #3b352e)',
  };

  function applyHtmlBackground() {
    if (!MOBILE_MQ.matches) return;
    const h = document.documentElement;
    if (!MOBILE_RE.test(window.location.pathname)) {
      h.style.backgroundImage = 'none';
      h.style.backgroundColor = 'var(--primary-background-color, #0d1117)';
      return;
    }
    h.style.backgroundImage    = BG.image;
    h.style.backgroundSize     = LANDSCAPE_MQ.matches ? BG.sizeLandscape : BG.sizePortrait;
    h.style.backgroundPosition = BG.position;
    h.style.backgroundRepeat   = 'no-repeat';
    h.style.backgroundColor    = BG.color;
  }

  // ── Gradient sampling ────────────────────────────────────────────────────────
  const SAMPLE_KEYS = ['handoff', 'upper', 'mid', 'lower', 'base'];
  // VERSIONED: bump this whenever paletteFrom's shape changes, or a cached palette wins forever.
  const CACHE_PREFIX = 'hemma-hero-sample:v2:';
  const CACHE_ROOT = 'hemma-hero-sample:';

  const CACHE_FIELDS = SAMPLE_KEYS.concat(['meshA', 'meshB']);

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_ROOT) && !k.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {}

  const clamp8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const hex = (c) => '#' + c.map((v) => clamp8(v).toString(16).padStart(2, '0')).join('');
  const mute = (c, k) => { const l = lum(c); return c.map((v) => v + (l - v) * k); };
  const atLum = (c, target) => { const l = lum(c) || 1; return c.map((v) => v * target / l); };
  const warmth = (c) => c[0] - c[2];

  function readVarUrl(name) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const m = raw && raw.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    return m ? m[1] : null;
  }

  function handoffRow() {
    const cs = getComputedStyle(document.documentElement);
    const pct = (name, dflt) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v / 100 : dflt;
    };
    const photoFrac = pct('--hemma-mobile-hero-height', 0.31);
    const pHandoff = pct('--hemma-mobile-hero-p-handoff', 0.30);
    if (!Number.isFinite(photoFrac) || photoFrac <= 0) return 0.85;
    return Math.max(0.05, Math.min(1, pHandoff / photoFrac));
  }

  function paletteFrom(img, slot) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih) return null;
    const w = 64, h = Math.max(8, Math.round(w * ih / iw));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    let data;
    try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return null; }

    const band = (y0, y1) => {
      const a = Math.max(0, Math.floor(y0 * h));
      const b = Math.min(h, Math.max(a + 1, Math.ceil(y1 * h)));
      let r = 0, g = 0, bl = 0, n = 0;
      for (let y = a; y < b; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          r += data[i]; g += data[i + 1]; bl += data[i + 2]; n++;
        }
      }
      return n ? [r / n, g / n, bl / n] : [128, 128, 128];
    };

    const row = Math.min(handoffRow(), 0.92);
    const handoff = band(row - 0.06, row + 0.02);
    // The subject: the house fills the middle of a home photo.
    const body = band(0.30, 0.75);

    const cs = getComputedStyle(document.documentElement);
    const num = (name, dflt) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v : dflt;
    };
    const lift = num('--hemma-mobile-hero-sample-lift', 0.86);
    const depth = num('--hemma-mobile-hero-sample-depth-' + slot, slot === 'night' ? 0.47 : 0.60);
    const muteTop = num('--hemma-mobile-hero-sample-mute-top', 0.41);
    const muteBase = num('--hemma-mobile-hero-sample-mute-base', 0.63);

    const anchor = (slot === 'night')
      ? (warmth(handoff) <= warmth(body) ? handoff : body)
      : (warmth(body) >= warmth(handoff) ? body : handoff);

    const lStart = lift * (lum(handoff) + lum(body)) / 2;
    const lEnd = Math.max(16, lStart * depth);

    let meshOut = null;

    // ── Mesh fields ──────────────────────────────────────────────────────
    const cell = (x0, x1, y0, y1) => {
      const a = Math.max(0, Math.floor(y0 * h)), b = Math.min(h, Math.ceil(y1 * h));
      const c = Math.max(0, Math.floor(x0 * w)), d = Math.min(w, Math.ceil(x1 * w));
      let r = 0, g = 0, bl = 0, n = 0;
      for (let y = a; y < b; y++) {
        for (let x = c; x < d; x++) {
          const i = (y * w + x) * 4;
          r += data[i]; g += data[i + 1]; bl += data[i + 2]; n++;
        }
      }
      return n ? [r / n, g / n, bl / n] : null;
    };
    const mTop = num('--hemma-mobile-hero-mesh-sample-top', 55) / 100;
    const mBot = num('--hemma-mobile-hero-mesh-sample-bottom', 94) / 100;
    const ROWS = 3, COLS = 6;
    const span = Math.max(0.01, (mBot - mTop) / ROWS);
    const cells = [];
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const c = cell(gx / COLS, (gx + 1) / COLS, mTop + gy * span, mTop + (gy + 1) * span);
        if (c) cells.push(c);
      }
    }
    if (cells.length >= 2) {
      cells.sort((p, q) => warmth(p) - warmth(q));
      const half = Math.max(1, Math.floor(cells.length / 2));
      const meanOf = (arr) => [0, 1, 2].map((i) =>
        arr.reduce((t, c) => t + c[i], 0) / arr.length);
      const cooler = meanOf(cells.slice(0, half));
      const warmer = meanOf(cells.slice(-half));

      const lMesh = lum(body) * num('--hemma-mobile-hero-mesh-lum', 0.95);
      const kMesh = num('--hemma-mobile-hero-mesh-mute', 0.45);
      const aA = num('--hemma-mobile-hero-mesh-a-alpha-' + slot, 0.46);
      const aB = num('--hemma-mobile-hero-mesh-b-alpha-' + slot, 0.42);
      const asRgba = (c, alpha) => {
        const v = mute(atLum(c, lMesh), kMesh).map(clamp8);
        return `rgba(${v[0]},${v[1]},${v[2]},${alpha})`;
      };
      meshOut = { a: asRgba(warmer, aA), b: asRgba(cooler, aB) };
    }

    const pal = {};
    if (meshOut) { pal.meshA = meshOut.a; pal.meshB = meshOut.b; }
    SAMPLE_KEYS.forEach((k, i) => {
      const t = i / (SAMPLE_KEYS.length - 1);
      pal[k] = hex(mute(atLum(anchor, lStart + (lEnd - lStart) * t),
                        muteTop + (muteBase - muteTop) * t));
    });
    return pal;
  }

  function publish(slot, pal) {
    if (!pal) return;
    const h = document.documentElement;
    SAMPLE_KEYS.forEach((k) => h.style.setProperty(`--hemma-sampled-${slot}-${k}`, pal[k]));
    if (pal.meshA) h.style.setProperty(`--hemma-sampled-${slot}-mesh-a`, pal.meshA);
    if (pal.meshB) h.style.setProperty(`--hemma-sampled-${slot}-mesh-b`, pal.meshB);
  }

  function sampleInto(slot, url) {
    if (!url) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const key = `${CACHE_PREFIX}${url}|${slot}|${handoffRow().toFixed(2)}`;
      let pal = null;
      try {
        const hit = JSON.parse(localStorage.getItem(key) || 'null');
        if (hit && CACHE_FIELDS.every((f) => typeof hit[f] === 'string')) pal = hit;
      } catch (e) {}
      if (!pal) {
        pal = paletteFrom(img, slot);
        try { if (pal) localStorage.setItem(key, JSON.stringify(pal)); } catch (e) {}
      }
      publish(slot, pal);
    };
    img.onerror = () => {};
    img.src = url;
  }

  let _sampledFor = null;
  function sampleWallpapers(attempt) {
    if (!MOBILE_MQ.matches) return;
    const day = readVarUrl('--hemma-mobile-hero-img-day');
    const night = readVarUrl('--hemma-mobile-hero-img-night');
    if (!day && !night) {
      if ((attempt || 0) < 20) setTimeout(() => sampleWallpapers((attempt || 0) + 1), 250);
      return;
    }
    const sig = `${day}|${night}|${handoffRow().toFixed(2)}`;
    if (sig === _sampledFor) return;
    _sampledFor = sig;
    sampleInto('day', day);
    sampleInto('night', night);
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  function init() {
    applyHtmlBackground();
    sampleWallpapers();
  }

  function waitForHA() {
    if (document.querySelector('home-assistant')) {
      init();
    } else {
      requestAnimationFrame(waitForHA);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForHA);
  } else {
    waitForHA();
  }

  window.addEventListener('location-changed', () => setTimeout(applyHtmlBackground, 50), true);
  window.addEventListener('popstate', () => setTimeout(applyHtmlBackground, 50), true);
  MOBILE_MQ.addEventListener('change', () => { applyHtmlBackground(); sampleWallpapers(); });
  window.addEventListener('orientationchange', () => setTimeout(() => {
    applyHtmlBackground();
    sampleWallpapers();
  }, 120));
  LANDSCAPE_MQ.addEventListener('change', applyHtmlBackground);
  // The wallpaper is keyed on dark mode, so repaint when the OS flips it.
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', applyHtmlBackground);
})();


// ── Navigation ───────────────────────────────────────────────────────────────
(function () {
  var _hemmaT = function (k, en, v) {
    if (typeof window._hemmaT === 'function') return window._hemmaT(k, en, v);
    var s = String(en);
    if (v) for (var p in v) s = s.split('{' + p + '}').join(String(v[p]));
    return s;
  };
  if (customElements.get('hemma-nav')) return;

  const CHEVRON =
    "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E" +
    "%3Cpath%20d%3D'M8.59%2C16.58L13.17%2C12L8.59%2C7.41L10%2C6L16%2C12L10%2C18L8.59%2C16.58Z'%2F%3E%3C%2Fsvg%3E";

  const MENU_CSS = `
    .hemma-nav-menu > button { background: transparent; transition: background .12s ease; }
    .hemma-nav-menu > button:hover, .hemma-nav-menu > button:focus, .hemma-nav-menu > button.on {
      background: var(--hemma-menu-lit, rgba(255,255,255,0.18)); }
    @media (prefers-reduced-motion: reduce) {
      .hemma-nav-menu > button { transition: none; }
    }
  `;

  // The theme writes its vars inline on <html>, so the override sits on body.
  if (!document.getElementById('hemma-tablet-dialog-css')) {
    const el = document.createElement('style');
    el.id = 'hemma-tablet-dialog-css';
    el.textContent = '@media (hover: none) and (pointer: coarse) and (min-width: 768px) and (min-height: 501px) {'
      + ' body { --dialog-surface-margin-top: initial; } }';
    document.head.appendChild(el);
  }

  function ensureMenuCss() {
    if (document.getElementById('hemma-nav-menu-css')) return;
    const el = document.createElement('style');
    el.id = 'hemma-nav-menu-css';
    el.textContent = MENU_CSS;
    document.head.appendChild(el);
  }

  const tplCache = new Map();

  function isTpl(v) {
    return typeof v === 'string' && v.trim().slice(0, 3) === '[[[';
  }

  function compile(src) {
    if (tplCache.has(src)) return tplCache.get(src);
    let fn = null;
    try {
      const body = String(src).trim().replace(/^\[\[\[/, '').replace(/\]\]\]$/, '');
      fn = new Function('hass', 'states', 'entity', 'variables', body);
    } catch (_) {}
    tplCache.set(src, fn);
    return fn;
  }

  function evalTpl(src, hass, fallback) {
    const fn = compile(src);
    if (!fn) return fallback;
    try {
      const r = fn(hass, hass && hass.states, null, {});
      return r === undefined ? fallback : r;
    } catch (_) {
      return fallback;
    }
  }

  function resolve(v, hass, fallback) {
    return isTpl(v) ? evalTpl(v, hass, fallback) : (v === undefined ? fallback : v);
  }

  function normalize(p) {
    return String(p || '').replace(/\/+$/, '') || '/';
  }

  function navigate(url) {
    if (!url) return;
    if (normalize(url) === normalize(location.pathname)) return;
    history.pushState(null, '', url);
    window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
  }

  function fire(node, type, detail) {
    node.dispatchEvent(new CustomEvent(type, {
      detail: detail, bubbles: true, composed: true,
    }));
  }

  // Stroked so its weight can match the desktop labels' text.
  const SIDEBAR_LINE_SVG = '<svg viewBox="0 0 24 19" fill="none" stroke="currentColor" stroke-width="2.3"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.4" y="1.4" width="21.2" height="16.2" rx="4.2"/>'
    + '<path d="M8.6 1.4v16.2"/></svg>';

  // The tablet navbar's: a touch over the labels' cap height (12px), with their 17px medium stem (~1.8px).
  const SIDEBAR_TAB_SVG = '<svg viewBox="0 0 24 19" fill="none" stroke="currentColor" stroke-width="2.65"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.45" y="1.45" width="21.1" height="16.1" rx="4.4"/>'
    + '<path d="M8.6 1.45v16.1"/></svg>';

  // Will's Apple glyphs from hemma-icons.js when loaded, else the drawn fallback.
  const navGlyph = (name, fallback) => {
    const d = window.HEMMA_ICONS && (window.HEMMA_ICONS[name] || (name === 'navbar' && window.HEMMA_ICONS.sidebar));
    return d ? '<i class="gl" style="--g:url(&quot;' + d + '&quot;)"></i>' : fallback;
  };

  const FX_EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  const FX_SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)';
  // Opacity below 1 makes an element the backdrop root of everything inside it, so glass would blur nothing.
  const FX_TEXT = (el) => el.id === 'name' || el.id === 'temperature';
  // The gap between the open sidebar and the content, on the dashboard and on category pages alike.

  class HemmaNavBar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._hass    = null;
      this._config  = null;
      this._routes  = [];
      this._els     = [];
      this._built   = false;
      this._path    = normalize(location.pathname);
      this._menu    = null;
      this._onRoute  = () => this._syncRoute();
      this._onResize = () => {
        this._fold(); this._syncHeaderOffset(); this._placeIndicator(true);
        this._pushEdge = null;
        if (this._sideOpen) this._pushView(true, true);
        else this._placeClock(0);
        setTimeout(() => this._sortSoon(true), 500);
        this._syncCatPush();
        setTimeout(() => this._fitNP(), 450);
        clearTimeout(this._repaintT);
        this._repaintT = setTimeout(() => this._repaintPhotos(), 400);
      };
      this._onVis = () => {
        if (document.hidden) return;
        // Again once a room Return to Home switched to while asleep has drawn and its photo settled.
        [300, 1200, 2500].forEach((t) => setTimeout(() => this._repaintPhotos(), t));
      };
    }

    static getStubConfig() { return { variant: 'desktop', routes: [] }; }

    setConfig(config) {
      if (!config || !Array.isArray(config.routes)) {
        throw new Error('hemma-nav: routes array required');
      }
      this._config  = config;
      this._variant = config.variant === 'tablet' ? 'tablet' : 'desktop';
      this._routes  = config.routes.slice();
      this._sig     = HemmaNavBar._sigOf(config);
      // A rebuild drops the page and the sidebar with the old shadow root; reset, so Overview opens them again.
      if (this._built) {
        this._closeCat(true);
        this._baseMode = false;
        this._sideOpen = false;
        clearInterval(this._statusTick);
      }
      this._built   = false;
      this.shadowRoot.innerHTML = '';
      if (this.isConnected) { this._build(); if (this._hass) this._syncOverview(); }
    }

    // A room's motion dot arrives already evaluated, so it would change the config on every motion; it is not layout.
    static _sigOf(c) {
      return JSON.stringify([c.variant === 'tablet' ? 'tablet' : 'desktop',
        c.routes.map((r) => (r && r.badge ? { ...r, badge: { ...r.badge, show: undefined } } : r))]);
    }

    updateConfig(config) {
      if (!config || !Array.isArray(config.routes)) return;
      if (HemmaNavBar._sigOf(config) === this._sig) {
        this._config = config;
        this._routes = config.routes.slice();
        (this._els || []).forEach((el, i) => { el.route = this._routes[i] || el.route; });
        if (this._built) this._syncBadges();
        return;
      }
      this.setConfig(config);
      if (this.isConnected && !this._built) this._build();
      this._syncRoute();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._built) return;
      const vh = this._vh && this._vh.isConnected ? this._vh : null;
      if (vh && vh.style.userSelect !== 'none') {
        vh.style.webkitUserSelect = 'none';
        vh.style.userSelect = 'none';
        vh.style.webkitTouchCallout = 'none';
      }
      if (!this._sideAuto && this._side && this._sVars) {
        this._sideAuto = true;
        const want = this._sideWanted();
        try {
          const seg = String(location.pathname.split('/')[1] || '');
          if (this._sVars.sidebar_open === true) localStorage.setItem(this._sideBootKey(), seg);
          else if (localStorage.getItem(this._sideBootKey()) === seg) localStorage.removeItem(this._sideBootKey());
        } catch (_) {}
        if (want && !this._sideOpen) setTimeout(() => { if (!this._sideOpen) this._openSide(true); }, 0);
        else if (!want && this._sideOpen && this._sideBooted) this._closeSide();
      }
      this._syncBadges();
      this._renderStatus();
      this._syncOverview();
      this._preloadPhotos();
      if (this._cat === 'home' && (this._titleStale || Date.now() - (this._titleAt || 0) > 30000)) {
        this._titleAt = Date.now();
        this._syncBaseTitle();
      }
      if (this._baseMode && !this._badgeVars) {
        this._readBadgeVars(this._heroBadgeRow());
        const pills = this._catPage && this._catPage.querySelector('.cat-pills');
        if (pills) this._applyBadgeVars(pills);
      }
      if (this._sideOpen) this._syncSideMotion();
      if (this._catEls) this._catHass();
      else if (this._warmBadge) { try { this._warmBadge.hass = window._hemmaFilter ? window._hemmaFilter.apply(hass) : hass; } catch (_) {} }
      if (!this._warmBadge && this._side) this._warmBadges();
      if (!this._npFitT) this._npFitT = setTimeout(() => { this._npFitT = 0; this._fitNP(); }, 2000);
      if (this._menu) this._menu._refresh && this._menu._refresh();
    }

    get hass() { return this._hass; }

    getCardSize() { return 1; }

    connectedCallback() {
      window.addEventListener('location-changed', this._onRoute, true);
      window.addEventListener('popstate', this._onRoute, true);
      window.addEventListener('resize', this._onResize);
      document.addEventListener('visibilitychange', this._onVis);
      window.addEventListener('pageshow', this._onVis);
      window.addEventListener('focus', this._onVis);
      if (this._onCategory) window.addEventListener('ll-custom', this._onCategory, true);
      if (this._config && !this._built) this._build();
      this._syncRoute();
      this._syncHeaderOffset();
      requestAnimationFrame(() => {
        if (!this.isConnected) return;
        this._syncHeaderOffset();
        this._placeIndicator();
      });
      if (document.fonts && document.fonts.ready && !HemmaNavBar._fontsReady) {
        document.fonts.ready.then(() => {
          HemmaNavBar._fontsReady = true;
          this._placeIndicator(true);
        }).catch(() => {});
      }
    }

    disconnectedCallback() {
      window.removeEventListener('location-changed', this._onRoute, true);
      window.removeEventListener('popstate', this._onRoute, true);
      window.removeEventListener('resize', this._onResize);
      document.removeEventListener('visibilitychange', this._onVis);
      window.removeEventListener('pageshow', this._onVis);
      window.removeEventListener('focus', this._onVis);
      if (this._onCategory) window.removeEventListener('ll-custom', this._onCategory, true);
      this._closeMenu();
      this._closeSide();
    }


    _build() {
      const root = this.shadowRoot;
      root.innerHTML = '';

      const style = document.createElement('style');
      style.textContent = this._css();
      root.appendChild(style);

      const bar = document.createElement('div');
      bar.className = 'bar';
      // The glass is a SIBLING of the routes, never their ancestor: an ancestor kills backdrop-filter.
      const glass = document.createElement('div');
      glass.className = 'glass';
      bar.appendChild(glass);
      if (this._variant === 'tablet') {
        const rim = document.createElement('div');
        rim.className = 'rim';
        bar.appendChild(rim);
        bar.appendChild(Object.assign(document.createElement('div'), { className: 'rim-in' }));
      }
      const scroller = document.createElement('div');
      scroller.className = 'scroller';
      bar.appendChild(scroller);
      if (this._variant === 'tablet') {
        const flash = document.createElement('div');
        flash.className = 'flash';
        bar.appendChild(flash);
        bar.addEventListener('pointerdown', (ev) => this._flash(ev), true);
        this._flashEl = flash;
      }
      root.appendChild(bar);

      const indicator = document.createElement('div');
      indicator.className = 'indicator instant';
      const fill = document.createElement('div');
      fill.className = 'fill';
      indicator.appendChild(fill);
      scroller.appendChild(indicator);
      this._fill = fill;

      this._bar       = bar;
      this._scroller  = scroller;
      this._indicator = indicator;
      this._els       = [];

      {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'route toggle';
        toggle.setAttribute('aria-label', _hemmaT('nav.sidebar', 'Sidebar'));
        toggle.innerHTML = '<span class="label">' + (this._variant === 'tablet' ? SIDEBAR_TAB_SVG : SIDEBAR_LINE_SVG) + '</span>';
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._toggleSide();
        });
        scroller.appendChild(toggle);
        this._toggle = toggle;
      }

      this._routes.forEach((route, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'route';
        btn.setAttribute('role', 'link');

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = route.menu === 'scenes' && route.label === 'Scenes'
          ? _hemmaT('nav.scenes', 'Scenes') : (route.label || '');
        btn.appendChild(label);

        const badge = document.createElement('span');
        badge.className = 'badge';
        btn.appendChild(badge);

        if (this._isMenuRoute(route)) btn.setAttribute('data-has-popup', '');

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._activate(route, btn);
        });

        scroller.appendChild(btn);
        this._els.push({ btn: btn, label: label, badge: badge, route: route });
      });

      if (this._variant !== 'tablet') {
        this._buildSide();
        const status = document.createElement('div');
        status.className = 'status';
        root.appendChild(status);
        this._status = status;
        if (!this._onShortcut) {
          this._onShortcut = (e) => {
            if (!this.isConnected || !e.ctrlKey || !e.metaKey || String(e.key).toLowerCase() !== 's') return;
            e.preventDefault();
            this._toggleSide();
          };
          window.addEventListener('keydown', this._onShortcut);
        }
      }
      if (!this._onCategory) {
        this._onCategory = (ev) => {
          const d = ev.detail || {};
          const k = d.hemma_category;
          // The phone's badge row carries its own filter; button-card merges the template's category into it.
          if (!k || 'hemma_filter' in d || !this.isConnected || !this.getClientRects().length) return;
          ev.stopPropagation();
          const here = this._activeIdx > 0 && this._els[this._activeIdx];
          const room = here ? String(here.route.label || here.label.textContent || '') : null;
          if (this._cat !== k || (this._catRoom || null) !== room) this._openCat(k, room, true);
        };
        window.addEventListener('ll-custom', this._onCategory, true);
      }
      if (this._variant === 'tablet') {
        this._buildSide();
        const status = document.createElement('div');
        status.className = 'status';
        root.appendChild(status);
        this._status = status;
        this._renderStatus();
      }

      this._built = true;
      this._syncRoute();
      this._syncBadges();
      // The setting lives on the room card, which draws after this; the last answer opens it before the first paint.
      try {
        const seg = String(location.pathname.split('/')[1] || '');
        if (this._side && !this._sideOpen && seg && localStorage.getItem(this._sideBootKey()) === seg && this._sideRoom()) {
          this._sideBooted = true;
          this._openSide(true);
        }
      } catch (_) {}
    }

    // ── Tablet sidebar ───────────────────────────────────────────────────────
    _buildSide() {
      // The idle return to Home asks these, so a sidebar or category page left open is reset with the view.
      window._hemmaNavBusy = () => !!(this.isConnected && (this._cat || this._sideOpen !== this._sideWanted()));
      window._hemmaNavReset = () => {
        if (this._cat) this._closeCat();
        const want = this._sideWanted();
        if (this._sideOpen && !want) this._closeSide();
        else if (!this._sideOpen && want) this._openSide();
      };
      const side = document.createElement('nav');
      side.className = 'side';
      side.setAttribute('aria-label', _hemmaT('nav.sidebar', 'Sidebar'));
      const glass = document.createElement('div');
      glass.className = 'side-glass';
      side.appendChild(glass);
      this._sideGlass = glass;
      try {
        const saved = parseInt(localStorage.getItem('hemma-side-w'), 10);
        if (saved > 0) this.style.setProperty('--side-w', 'min(' + saved + 'px, 45vw)');
      } catch (_) {}
      const grip = document.createElement('div');
      grip.className = 'side-grip';
      side.appendChild(grip);
      this._sideGrip = grip;
      // iOS hands a touch to the scroll views under the edge before the grip, so the edge is caught on the document.
      const onEdge = (x) => {
        if (!this._sideOpen || !this._pushed) return false;
        return Math.abs(x - this._side.getBoundingClientRect().right) <= 16;
      };
      this._edgeTouch = (ev) => {
        const t = ev.touches && ev.touches[0];
        if (t && ev.touches.length === 1 && onEdge(t.clientX)) ev.preventDefault();
      };
      this._edgeDown = (ev) => {
        if (ev.isPrimary === false || !onEdge(ev.clientX)) return;
        this._dragSide(ev, grip);
      };
      const head = document.createElement('div');
      head.className = 'side-head';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'side-close';
      close.setAttribute('aria-label', _hemmaT('nav.sidebar', 'Sidebar'));
      close.innerHTML = '<svg viewBox="0 0 25 19.5" fill="none" stroke="currentColor" stroke-width="2"'
        + ' stroke-linecap="round" aria-hidden="true"><rect x="1" y="1" width="23" height="17.5" rx="4"/><path d="M7.4 5.1h10.2"/></svg>';
      close.addEventListener('click', (e) => { e.stopPropagation(); this._closeSide(); });
      this._bloom(close);
      head.appendChild(close);
      side.appendChild(head);
      this._sideHead = head;
      document.documentElement.style.setProperty('--hemma-ha-menu', 'none');
      const list = document.createElement('div');
      list.className = 'side-list';
      list.addEventListener('scroll', () => list.classList.toggle('scrolled', list.scrollTop > 2), { passive: true });
      side.appendChild(list);
      // Until the ... menu with Home Assistant in it has drawn (templates saved before it existed), HA stays reachable here.
      const foot = document.createElement('div');
      foot.className = 'side-foot';
      foot.hidden = !!window._hemmaMenuHA;
      foot.appendChild(this._sideItem('mdi:home-assistant', _hemmaT('nav.home_assistant', 'Home Assistant'), false, () => this._openHaMenu()));
      side.appendChild(foot);
      window.addEventListener('hemma-menu-ha', () => { foot.hidden = true; });
      this.shadowRoot.appendChild(side);
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'side-back';
      back.setAttribute('aria-label', _hemmaT('nav.back', 'Back'));
      back.innerHTML = '<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.4"'
        + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.4 1.6 1.8 10l8.6 8.4"/></svg>';
      back.addEventListener('click', (e) => {
        e.stopPropagation();
        this._closeCat();
      });
      this._bloom(back);
      this.shadowRoot.appendChild(back);
      this._sideBack = back;
      this._side = side;
      this._sideList = list;
      this._onAway = (ev) => {
        // Landscape makes room for the page, so the page stays usable; only portrait's overlay dismisses.
        if (this._pushed) return;
        const path = ev.composedPath();
        if (path.indexOf(this._side) >= 0 || path.indexOf(this._toggle) >= 0) return;
        this._closeSide();
      };
      this._onKey = (ev) => { if (ev.key === 'Escape') this._closeSide(); };
    }

    _dragSide(e, grip) {
      if (!this._sideOpen || !this._pushed) return;
      e.preventDefault();
      e.stopPropagation();
      try { grip.setPointerCapture(e.pointerId); } catch (_) {}
      grip.classList.add('drag');
      const id = e.pointerId;
      const x0 = e.clientX;
      const w0 = this._side.getBoundingClientRect().width;
      const max = Math.max(w0, Math.min(300, window.innerWidth * 0.45));
      const labels = [...this._side.querySelectorAll('.side-item > span:not(.side-motion)')].filter((l) => l.getClientRects().length);
      const range = document.createRange();
      // Fractional, with a margin: clientWidth rounds, and a label a fraction too narrow already shows its ellipsis.
      const slack = labels.reduce((m, l) => {
        range.selectNodeContents(l);
        return Math.min(m, l.getBoundingClientRect().width - range.getBoundingClientRect().width);
      }, Infinity);
      const min = Math.min(w0, Math.max(200, Math.ceil(w0 - (Number.isFinite(slack) ? Math.max(0, slack) : 0) + 4)));
      let w = w0;
      const els = this._pushed ? [...(this._pushedSet || [])] : [];
      els.forEach((el) => { el.style.transition = 'none'; });
      const move = (ev) => {
        if (ev.pointerId !== id) return;
        ev.preventDefault();
        w = Math.round(Math.max(min, Math.min(max, w0 + ev.clientX - x0)));
        this.style.setProperty('--side-w', w + 'px');
        const P = this._pushShift(w);
        this._setPushVars(P);
        els.forEach((el) => this._setPush(el, P));
        this._syncBack();
      };
      const up = (ev) => {
        if (ev && ev.pointerId !== id) return;
        window.removeEventListener('pointermove', move, true);
        window.removeEventListener('pointerup', up, true);
        window.removeEventListener('pointercancel', up, true);
        grip.classList.remove('drag');
        try { localStorage.setItem('hemma-side-w', String(w)); } catch (_) {}
        this.style.setProperty('--side-w', 'min(' + w + 'px, 45vw)');
      };
      window.addEventListener('pointermove', move, { capture: true, passive: false });
      window.addEventListener('pointerup', up, true);
      window.addEventListener('pointercancel', up, true);
    }

    // HA listens for its menu toggle from inside the dashboard view, which this layer is not.
    _openHaMenu() {
      const src = this._heroCardFor(this._activeIdx) || this._viewHost() || this;
      if (!this._pushed) this._closeSide();
      src.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true }));
    }

    _sideItem(icon, label, active, onTap, badge) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'side-item' + (active ? ' on' : '');
      const data = window.HEMMA_ICONS && window.HEMMA_ICONS[icon];
      if (data) {
        const g = document.createElement('i');
        g.className = 'side-glyph';
        g.style.setProperty('--g', 'url("' + data + '")');
        b.appendChild(g);
      } else if (!window.HEMMA_ICONS && String(icon || '').indexOf(':') < 0) {
        // hemma-icons.js can load after the sidebar first fills: hold the glyph's place, _fillSide redraws it.
        const g = document.createElement('i');
        g.className = 'side-glyph';
        g.style.visibility = 'hidden';
        b.appendChild(g);
      } else {
        const ic = document.createElement('ha-icon');
        ic.setAttribute('icon', String(icon || '').indexOf(':') > 0 ? icon : 'mdi:circle-small');
        b.appendChild(ic);
      }
      const t = document.createElement('span');
      t.textContent = label;
      b.appendChild(t);
      if (badge !== undefined) {
        const m = document.createElement('span');
        m.className = 'side-motion' + (badge ? ' on' : '');
        const url = typeof window.hemmaIconUrl === 'function' ? window.hemmaIconUrl('person-walking-motion') : '/local/hemma/icons/person-walking-motion.svg';
        m.innerHTML = '<img src="' + url + '" alt="">';
        b.appendChild(m);
        b._motion = m;
      }
      b.addEventListener('click', (e) => { e.stopPropagation(); onTap(b); });
      return b;
    }

    _sideSection(list, key, text) {
      const store = 'hemma-side-shut-' + key;
      let shut = false;
      try { shut = localStorage.getItem(store) === '1'; } catch (_) {}
      const h = document.createElement('button');
      h.type = 'button';
      h.className = 'side-heading';
      h.innerHTML = '<span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"'
        + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
      h.firstChild.textContent = text;
      const g = document.createElement('div');
      g.className = 'side-group';
      const paint = () => {
        h.setAttribute('aria-expanded', shut ? 'false' : 'true');
        g.classList.toggle('shut', shut);
      };
      paint();
      h.addEventListener('click', (e) => {
        e.stopPropagation();
        const from = g.offsetHeight;
        shut = !shut;
        try { localStorage.setItem(store, shut ? '1' : '0'); } catch (_) {}
        paint();
        const to = g.offsetHeight;
        if (!g.animate || from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (shut) g.classList.remove('shut');
        g.style.overflow = 'clip';
        const a = g.animate([{ height: from + 'px' }, { height: to + 'px' }],
          { duration: 260, easing: 'cubic-bezier(.32,.72,0,1)' });
        const done = () => { g.style.overflow = ''; g.classList.toggle('shut', shut); };
        a.finished.then(done, done);
      });
      list.appendChild(h);
      list.appendChild(g);
      return g;
    }

    async _mobileConfig() {
      if (this._mobCfg && Date.now() - this._mobCfgAt < 60000) return this._mobCfg;
      const seg = String(location.pathname.split('/')[1] || '');
      const path = seg.replace(/[-_]mobile$/i, '') + '-mobile';
      let cfg = null;
      try { cfg = await this._hass.callWS({ type: 'lovelace/config', url_path: path }); } catch (_) {}
      this._mobCfg = cfg;
      this._mobCfgAt = Date.now();
      return cfg;
    }

    // The phone popup's own rule: an overlay's explicit sections, else every room's tiles in the category.
    _catSections(cfg, k) {
      const cats = window.HEMMA_FILTER_CATEGORIES || {};
      const catOf = (c) => {
        const d = c && c.variables && c.variables.mobile_filter_category;
        if (d !== null && d !== undefined) return d;
        for (const t of [].concat((c && c.template) || [])) if (t && cats[t]) return cats[t] === 'by_entity' ? window.hemmaEntityCategory(c.entity) : cats[t];
        return null;
      };
      const isHeader = (c) => [].concat((c && c.template) || []).indexOf('hemma_mobile_header') >= 0;
      let explicit = null;
      let favs = null;
      const rooms = [];
      let pending = null;
      const walk = (list) => {
        (list || []).forEach((c) => {
          if (!c || typeof c !== 'object') return;
          if (c.type === 'custom:hemma-filter-overlay') {
            if (c.filter_category === k && Array.isArray(c.sections) && c.sections.length) explicit = c.sections;
            return;
          }
          if (isHeader(c)) { pending = c.name; return; }
          if (k === 'home' && pending && [].concat(c.template || []).indexOf('hemma_scene_row') >= 0) {
            rooms.push({ name: pending, scenes: true });
            pending = null;
            return;
          }
          if (c.type === 'custom:hemma-smart-row' && pending) {
            const cards = (c.cards || []).filter((x) => k === 'home' || catOf(x) === k);
            if (pending === 'Favorites') { if (k !== 'lights' && cards.length) favs = cards; }
            else if (cards.length) rooms.push({ name: pending, cards });
            pending = null;
            return;
          }
          if (Array.isArray(c.cards)) walk(c.cards);
          if (c.card) walk([c.card]);
        });
      };
      ((cfg && cfg.views) || []).forEach((v) => walk(v.cards));
      if (explicit) return explicit;
      if (favs) rooms.unshift({ name: _hemmaT('mobile.favorites', 'Favorites'), cards: favs, fav: true });
      if (k !== 'lights') return rooms;
      return rooms.map((r) => ({ name: r.name, cards: this._expandLights(r.name, r.cards) }));
    }

    _expandLights(room, list) {
      return window.hemmaExpandLights((this._hass && this._hass.states) || {}, room, list);
    }

    async _openCat(k, room, fromBadge, base) {
      if (this._cat === k && (room || null) === (this._catRoom || null)) { this._closeCat(); return; }
      const fv = k === 'scenes' ? 'room_scenes' : k === 'home' ? 'all' : k;
      if (this._catPage) {
        this._cat = k;
        this._catRoom = room || null;
        this._catLift = false;
        this._markSide();
        this._syncBack();
        if (window._hemmaFilter) window._hemmaFilter.set(fv);
        this._fillCat(k);
        return;
      }
      const R = this.shadowRoot;
      if (this._catDefer) this._dropDeferred();
      this._closeCat(true);
      this._cat = k;
      this._catRoom = room || null;
      // From Home, or from a badge anywhere, the page lifts in; a sidebar category tapped in a room replaces it in place.
      const lift = !base && (this._activeIdx === 0 || !!fromBadge) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const fade = base === 'fade';
      this._catFrom = this._activeIdx === 0 || base ? 'home' : 'room';
      this._catLift = lift;
      this._markSide();
      const bg = document.createElement('div');
      bg.className = 'cat-bg';
      const page = document.createElement('div');
      page.className = 'cat';
      const veilWrap = document.createElement('div');
      veilWrap.className = 'cat-veilwrap';
      const veil = document.createElement('div');
      veil.className = 'cat-veil';
      veilWrap.appendChild(veil);
      const mini = document.createElement('div');
      mini.className = 'cat-mini';
      const inner = document.createElement('div');
      inner.className = 'cat-in';
      const title = document.createElement('h1');
      if (k === 'home') title.textContent = this._baseTitle();
      inner.appendChild(title);
      const pills = document.createElement('div');
      pills.className = 'cat-pills';
      inner.appendChild(pills);
      const body = document.createElement('div');
      body.className = 'cat-body';
      if (lift) body.style.visibility = 'hidden';
      // Held by opacity, never visibility: visibility is inherited and would hide the tiles from _pageDrawn.
      if (base === 'still') { inner.style.opacity = '0'; this._bootReveal = inner; }
      inner.appendChild(body);
      page.appendChild(veilWrap);
      page.appendChild(inner);
      if (this._sideOpen && this._pushed) [bg, page, mini].forEach((n) => n.classList.add('pushed'));
      [bg, page, mini].forEach((n) => R.appendChild(n));
      this._catEls = [bg, page, mini];
      // The badge row stays put while the page rises, so the page itself appears at once.
      if (lift) [page, mini].forEach((n) => n.classList.add('still'));
      else if (!fade) this._catEls.forEach((n) => n.classList.add('still'));
      if (lift) {
        this._glideStart();
        this._fxOut();
        title.animate([{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 520, easing: FX_SPRING, fill: 'backwards' });
      } else if (fade) this._fxOut();
      else this._fxHold('none');
      // HA runs a card's action only when hass-action reaches it from inside the dashboard view, which this layer is not.
      page.addEventListener('hass-action', (e) => {
        const src = this._heroCardFor(this._activeIdx) || this._viewHost();
        if (!src || !src.isConnected) return;
        e.stopPropagation();
        src.dispatchEvent(new CustomEvent('hass-action', { detail: e.detail, bubbles: true, composed: true }));
      });
      this._catPage = page;
      this._catCards = [];
      page.addEventListener('scroll', () => {
        const y = page.scrollTop;
        if (y > 2 && !veil.classList.contains('on')) this._sizeVeil();
        veil.classList.toggle('on', y > 2);
        mini.classList.toggle('on', y > 40);
        this.classList.toggle('under', y > 2 && !page.classList.contains('pushed'));
      }, { passive: true });
      this._syncCatPush();
      this._syncBack();
      const F = window._hemmaFilter;
      if (F) {
        F.set(fv);
        this._catFilterOff = F.onChange((v) => {
          this._catHass();
          if (!this._cat) return;
          v = v === 'people' ? 'presence' : v === 'room_scenes' ? 'scenes' : v;
          if (v === 'all' || v === 'none') { if (this._cat !== 'home') this._closeCat(); return; }
          if (v !== this._cat) {
            if (this._baseMode) this._catSwap = 'rise';
            this._cat = v; this._markSide(); this._syncBack(); this._fillCat(v);
          }
        });
      }
      if (lift || fade) requestAnimationFrame(() => this._catEls && this._catEls.forEach((n) => n.classList.add('show')));
      else this._catEls.forEach((n) => n.classList.add('show'));
      await this._fillCat(k);
    }

    // The veil holds no badges (they scroll, as in Apple Home): its height is the stylesheet's.
    _sizeVeil() {
      const veil = this._catPage && this._catPage.querySelector('.cat-veil');
      if (veil) veil.style.removeProperty('height');
    }

    // The Media page's players, one Now Playing tile each, from the same list the phone's card reads.
    _mountNP(box, cfg, np, helpers) {
      const tpl = cfg && cfg.button_card_templates && cfg.button_card_templates.hemma_mobile_now_playing;
      const src = tpl && tpl.variables && tpl.variables.cfg;
      let V = null;
      if (typeof src === 'string' && this._hass) {
        try {
          const body = src.trim().replace(/^\[\[\[/, '').replace(/\]\]\]$/, '');
          V = new Function('variables', 'states', 'hass', 'user', body)(np.variables || {}, this._hass.states, this._hass, this._hass.user);
        } catch (_) { V = null; }
      }
      if (!V || typeof window._hemmaNPView !== 'function') return;
      window._hemmaCatNPV = V;
      this._npBox = box;
      this._npHelpers = helpers;
      box._hemmaN = -1;
      this._syncNP();
    }

    _syncNP() {
      const box = this._npBox;
      if (!box || !box.isConnected || !this._hass) return;
      let n = 0;
      try { n = window._hemmaNPView(this._hass.states, window._hemmaCatNPV).filter(Boolean).length; } catch (_) { n = 0; }
      // Per box: a page back from the shelf holds the tiles of when it was left.
      if (n === box._hemmaN) return;
      box._hemmaN = n;
      // In place: a page being built still holds this list.
      for (let i = this._catCards.length - 1; i >= 0; i--) if (this._catCards[i]._hemmaNP) this._catCards.splice(i, 1);
      box.innerHTML = '';
      if (!n) return;
      const h = document.createElement('h2');
      h.textContent = _hemmaT('now_playing.title', 'Now Playing');
      box.appendChild(h);
      const row = document.createElement('div');
      row.className = 'cat-np';
      box.appendChild(row);
      const F = window._hemmaFilter;
      const hass = F ? F.apply(this._hass) : this._hass;
      for (let i = 0; i < n; i++) {
        let el = null;
        try {
          el = this._npHelpers.createCardElement({ type: 'custom:button-card', template: 'hemma_now_playing_primary',
            variables: { entry_direction: 'vertical', np_count: 1,
              src: '[[[ const L = (window._hemmaNPView && window._hemmaCatNPV) ? window._hemmaNPView(states, window._hemmaCatNPV).filter(Boolean) : []; return L[' + i + '] || null; ]]]' } });
        } catch (_) {}
        if (!el) continue;
        el._hemmaNP = true;
        try { el.hass = hass; } catch (_) {}
        row.appendChild(el);
        this._catCards.push(el);
      }
    }

    _catHass(force) {
      // State changes wait out a slide, as one update after it: every card re-rendering mid-slide costs frames.
      const left = (this._slideUntil || 0) - performance.now();
      if (left > 0 && !force) {
        clearTimeout(this._catHassT);
        this._catHassT = setTimeout(() => this._catHass(), left + 20);
        return;
      }
      if (this._npBox) this._syncNP();
      this._syncBattery();
      this._edgeFade();
      this._sortSoon();
      const F = window._hemmaFilter;
      const h = this._hass && F ? F.apply(this._hass) : this._hass;
      if (!h) return;
      (this._catHead || []).concat(this._catCards || [], this._catWx || [], this._catChrome || []).forEach((el) => { try { el.hass = h; } catch (_) {} });
      if (this._catChips && this._roomKey) { try { this._catChips.hass = this._roomHass(h); } catch (_) {} }
      if (this._catChips) this._fitChipRow();
    }

    _syncChips() {
      if (!this._catChips || !this._hass) return;
      const F = window._hemmaFilter;
      const h = F ? F.apply(this._hass) : this._hass;
      try { this._catChips.hass = this._roomKey ? this._roomHass(h) : h; } catch (_) {}
      this._fitChipRow();
    }

    // The last measured inset goes on a new row at once; measured later, the row moved left after it showed.
    _chipInset(ch) {
      let off = this._chipOff;
      if (!off) { try { off = parseInt(localStorage.getItem('hemma_chip_off_' + this._variant), 10) || 0; } catch (_) { off = 0; } }
      if (off) {
        this._chipOff = off;
        ch._hemmaOff = off;
        ch.style.setProperty('--hemma-rail-left', 'calc(var(--cat-gutter, 20px) - ' + off + 'px)');
      } else {
        ch._hemmaHold = true;
        ch.style.opacity = '0';
        setTimeout(() => { if (ch._hemmaHold) { ch._hemmaHold = false; ch.style.removeProperty('opacity'); } }, 1500);
      }
    }

    // Safari sizes a chip row's inner grid short of its last chip; same fix as filter-overlay _fixRowWidths.
    _fitChipRow() {
      const ch = this._catChips;
      if (!ch || !window._hemmaFixRowWidths) return;
      if (!this._chipRO && window.ResizeObserver) {
        this._chipRO = new ResizeObserver(() => this._fitChipRow());
        this._chipRO.observe(ch);
      }
      clearTimeout(this._chipFitT);
      this._chipFitT = setTimeout(() => {
        const rows = [];
        const walk = (n, d) => {
          if (!n || d > 10) return;
          if (n.id === 'rooms_row' || n.id === 'climate_row') rows.push(n);
          if (n.shadowRoot) [...n.shadowRoot.children].forEach((c) => walk(c, d + 1));
          [...(n.children || [])].forEach((c) => walk(c, d + 1));
        };
        walk(ch, 0);
        rows.forEach((r) => { if (r.firstElementChild) r.firstElementChild.style.removeProperty('width'); });
        // The row's inset gives back a bare chip's left padding, measured, since it varies with the badge size.
        const row = rows.find((r) => r.clientWidth && getComputedStyle(r).display !== 'none');
        if (row) {
          const icons = [];
          const find = (n, d) => {
            if (!n || d > 10) return;
            if (n.id === 'img-cell' && n.getBoundingClientRect().width) icons.push(n.getBoundingClientRect().left);
            if (n.shadowRoot) [...n.shadowRoot.children].forEach((c) => find(c, d + 1));
            [...(n.children || [])].forEach((c) => find(c, d + 1));
          };
          find(row, 0);
          if (icons.length) {
            const off = Math.round(Math.min(...icons) - row.getBoundingClientRect().left - (parseFloat(getComputedStyle(row).paddingLeft) || 0) + row.scrollLeft);
            if (off > 0 && off < 40 && off !== ch._hemmaOff) {
              this._chipOff = off;
              ch._hemmaOff = off;
              ch.style.setProperty('--hemma-rail-left', 'calc(var(--cat-gutter, 20px) - ' + off + 'px)');
              try { localStorage.setItem('hemma_chip_off_' + this._variant, String(off)); } catch (_) {}
            }
          }
        }
        if (ch._hemmaHold && (!row || row.clientWidth)) { ch._hemmaHold = false; ch.style.removeProperty('opacity'); }
        try { window._hemmaFixRowWidths(ch); } catch (_) {}
      }, 150);
    }

    // The chip row reads its room from the phone's filter entity; this page's room, without touching the device's filter.
    _roomHass(h) {
      const c = this._roomHassC;
      if (c && c.h === h && c.key === this._roomKey) return c.out;
      const id = 'input_select.hemma_mobile_filter';
      const st = Object.assign({ entity_id: id, attributes: {} }, h.states[id] || {}, { state: this._roomKey });
      const out = Object.assign(Object.create(Object.getPrototypeOf(h)), h, { states: Object.assign({}, h.states, { [id]: st }) });
      this._roomHassC = { h, key: this._roomKey, out };
      return out;
    }

    // The phone's room view (filter-overlay's room mode): the room's scenes, then its tiles by category.
    _roomSections(sec) {
      if (!sec) return [];
      const cats = window.HEMMA_FILTER_CATEGORIES || {};
      const catOf = (c) => {
        const d = c && c.variables && c.variables.mobile_filter_category;
        if (d !== null && d !== undefined) return d;
        for (const t of [].concat((c && c.template) || [])) if (t && cats[t]) return cats[t] === 'by_entity' ? window.hemmaEntityCategory(c.entity) : cats[t];
        return null;
      };
      const ORDER = ['climate', 'lights', 'media', 'security', 'energy', 'presence', 'other'];
      const EN = { climate: 'Climate', lights: 'Lights', media: 'Media', security: 'Security', energy: 'Energy', presence: 'People', other: 'Other' };
      const buckets = new Map();
      (sec.cards || []).forEach((c) => {
        const k = EN[catOf(c)] ? catOf(c) : 'other';
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(c);
      });
      const out = [];
      let n = 0;
      try { n = window._hemmaSC ? window._hemmaSC.list(this._hass.states, this._hass, Object.assign({}, this._scenePick, { room: sec.name })).length : 0; } catch (_) { n = 0; }
      if (n) out.push({ scenes: true, room: sec.name, name: _hemmaT('nav.scenes', 'Scenes') });
      // Lights lists every light in the room, as the Lights page does, not the room's one group tile.
      if (buckets.has('lights')) buckets.set('lights', this._expandLights(sec.name, buckets.get('lights')));
      ORDER.forEach((k) => { if (buckets.has(k)) out.push({ name: _hemmaT('filter.' + k, EN[k]), cards: buckets.get(k), bucket: true }); });
      return out;
    }

    async _catHelpers() {
      for (let i = 0; i < 100 && !window.loadCardHelpers; i++) await new Promise((r) => setTimeout(r, 50));
      try { return window.loadCardHelpers ? await window.loadCardHelpers() : null; } catch (_) { return null; }
    }

    _catHeadCards(cfg) {
      const out = {};
      const walk = (list) => (list || []).forEach((c) => {
        if (!c || typeof c !== 'object') return;
        const t = [].concat(c.template || []);
        if (t.indexOf('hemma_mobile_filter_badges') >= 0 && !out.badges) out.badges = c;
        if (t.indexOf('hemma_mobile_sensor_chips') >= 0 && !out.chips) out.chips = c;
        if (t.indexOf('hemma_mobile_now_playing') >= 0 && !out.np) out.np = c;
        if (Array.isArray(c.cards)) walk(c.cards);
        if (c.card) walk([c.card]);
      });
      ((cfg && cfg.views) || []).forEach((v) => walk(v.cards));
      return out;
    }

    async _fillCat(k) {
      const page = this._catPage;
      if (!page) return;
      const inner = page.querySelector('.cat-in');
      const ICON = { climate: 'fan', lights: 'light', presence: 'person', media: 'media', security: 'lock-fill', energy: 'energy' };
      const COLOR = { climate: 'var(--hemma-badge-climate-color, #00C3D0)', lights: 'var(--hemma-badge-light-color, #FFCC00)',
        presence: 'var(--hemma-color-green, #30D158)', media: 'var(--hemma-color-blue, #0A84FF)',
        security: 'var(--hemma-color-mint, #00C8B3)', energy: 'var(--hemma-color-green, #30D158)' };
      const EN = { climate: 'Climate', lights: 'Lights', presence: 'People', media: 'Media', security: 'Security', energy: 'Energy' };
      const name = (c) => (c === 'scenes' ? _hemmaT('nav.scenes', 'Scenes') : _hemmaT('filter.' + c, EN[c] || c));
      const head1 = k === 'home' ? this._baseTitle() : name(k);
      // A swap shows the new title with its page, not over the page it is leaving.
      if (this._catSwap) this._swapTitle = head1;
      else inner.querySelector('h1').textContent = head1;
      page.classList.toggle('scenes', k === 'scenes');
      page.classList.toggle('home', k === 'home');
      const mini = this.shadowRoot.querySelector('.cat-mini');
      if (mini) mini.classList.toggle('home', k === 'home');
      // Overview on a desktop runs smaller, as Apple Home does on a Mac; the tablet keeps its touch sizes.
      page.classList.toggle('compact', this._compact());
      // A room has its sensors where Home has its badges, from the phone's chip row for that room.
      page.classList.toggle('room', k === 'home' && !!this._catRoom);
      this._roomKey = k === 'home' && this._catRoom ? 'room_' + String(this._catRoom).trim().toLowerCase().replace(/[^a-z0-9]+/g, '') : null;
      // The chip row is one card and changes with the room, so it never waits for a slide as the tiles do.
      this._syncChips();
      this._catEls[0].classList.toggle('clear', k === 'home');
      this._syncChrome();
      this._catEls[2].textContent = this._miniTitle(k, head1);
      const pills = inner.querySelector('.cat-pills');
      const body = inner.querySelector('.cat-body');
      const cfg = await this._mobileConfig();
      const helpers = await this._catHelpers();
      if (this._cat !== k || this._catPage !== page) return;
      const head = this._catHeadCards(cfg);
      if (helpers && head.badges && !this._catHead) {
        this._catHead = [];
        pills.innerHTML = '';
        pills.classList.add('cards');
        const mk = (c, cls) => {
          let el = null;
          try { el = helpers.createCardElement(JSON.parse(JSON.stringify(c))); } catch (_) {}
          if (!el) return null;
          el.classList.add(cls);
          this._catHead.push(el);
          return el;
        };
        let b = this._warmBadge || null;
        if (b) this._catHead.push(b);
        else b = mk(head.badges, 'cat-badgecard');
        if (b) pills.appendChild(b);
        if (!this._badgeVars) this._readBadgeVars(this._heroBadgeRow());
        this._applyBadgeVars(pills);
        if (b && this._glideFrom) { pills.style.visibility = 'hidden'; this._glideUp(b, pills); }
        const chips = head.chips && mk(head.chips, 'cat-chipcard');
        // A mouse wheel scrolls a room's chips sideways when they run past the page; a trackpad already does.
        if (chips) chips.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          const row = e.composedPath().find((n) => n && (n.id === 'rooms_row' || n.id === 'climate_row'));
          if (!row || row.scrollWidth <= row.clientWidth + 1) return;
          const before = row.scrollLeft;
          row.scrollLeft += e.deltaY;
          if (row.scrollLeft !== before) e.preventDefault();
        }, { passive: false });
        if (chips) pills.after(chips);
        if (chips) this._chipInset(chips);
        if (chips && this._catLift) chips.style.visibility = 'hidden';
        this._catChips = chips || null;
        this._catHass(true);
      }
      if (helpers && !this._catWx) {
        const wx = this._wxCard(helpers);
        if (wx) {
          const box = document.createElement('div');
          box.className = 'cat-wx';
          box.appendChild(wx);
          inner.insertBefore(box, inner.firstChild);
          this._catWx = wx;
        }
      }
      if (!this._catHead) pills.innerHTML = '';
      if (!this._catHead) this._sideCategories().forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cat-pill' + (c === k ? ' on' : '');
        const data = window.HEMMA_ICONS && window.HEMMA_ICONS[ICON[c]];
        if (data) {
          const g = document.createElement('i');
          g.className = 'cat-glyph';
          g.style.setProperty('--g', 'url("' + data + '")');
          g.style.background = COLOR[c];
          b.appendChild(g);
        }
        const t = document.createElement('span');
        t.textContent = name(c);
        b.appendChild(t);
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          if (c === this._cat) return;
          this._cat = c;
          this._markSide();
          this._fillCat(c);
        });
        pills.appendChild(b);
      });
      const norm = (t) => String(t || '').trim().toLowerCase();
      const scope = this._catRoom && norm(this._catRoom);
      if (k === 'home' && !this._catRoom && !inner.querySelector('h1').textContent.trim()) setTimeout(() => this._syncBaseTitle(), 600);
      // Moving a card out of the document and back would have UIX restyle it mid-slide, so panes are only hidden.
      const shelf = this._shelf(page, cfg);
      const swap = this._catSwap;
      this._catSwap = null;
      const prev = this._pane;
      if (this._bodyKey && this._pane) shelf.set(this._bodyKey, { pane: this._pane, cards: this._catCards, np: this._npBox });
      this._bodyKey = null;
      this._pane = null;
      const kept = new Set([...shelf.values()].map((v) => v.pane));
      // The page being left stays up until the swap, so a category built for the first time never shows a blank.
      [...body.children].forEach((c) => { if (swap && c === prev) return; if (kept.has(c) || c._hemmaPre) c.hidden = true; else c.remove(); });
      page.scrollTop = 0;
      const key = k + '|' + (scope || '');
      const hit = shelf.get(key);
      const reused = !!(hit && hit.pane.parentNode === body);
      if (reused) {
        shelf.delete(key);
        hit.pane.hidden = false;
        this._pane = hit.pane;
        this._catCards = hit.cards;
        this._npBox = hit.np;
      } else {
        shelf.delete(key);
        const pane = body.appendChild(Object.assign(document.createElement('div'), { className: 'cat-pane', hidden: !!(swap && prev) }));
        pane._hemmaSorted = k === 'home';
        this._pane = pane;
        this._catCards = [];
        this._npBox = null;
        const ok = await this._buildBody(pane, k, scope, cfg, helpers, head, page, this._catCards);
        if (this._cat !== k || this._catPage !== page) return;
        if (!ok) { if (swap) this._swapPanes(prev, this._pane, swap); this._filled(); return; }
      }
      this._bodyKey = key;
      if (swap) this._swapPanes(prev, this._pane, swap, reused);
      else if (prev && prev !== this._pane && prev.parentNode === body) prev.hidden = true;
      // Its cards refresh a frame later, once the compositor is carrying the slide.
      if (reused) {
        const shown = this._pane;
        // Built in the background, or packed at another width (the sidebar moved), it is packed before it shows.
        const g = shown.querySelector('.cat-grid');
        if (g && g.offsetWidth && shown._hemmaPackW !== g.offsetWidth) this._sortSig = null;
        this._filled();
        requestAnimationFrame(() => setTimeout(() => {
          if (this._pane !== shown) return;
          this._catHass();
          this._sortSig = null;
          this._sortFilledAt = Date.now();
          this._sortSoon();
        }, 0));
      } else {
        this._catHass(true);
        this._sortSig = null;
        this._sortFilledAt = Date.now();
        this._sortSoon('fill');
        this._filled();
      }
      if (k === 'home' && !scope) this._prebuild(cfg, helpers, page);
      if (this._catLift) {
        this._catLift = false;
        body.style.visibility = '';
        if (this._catChips) this._catChips.style.visibility = '';
        const vh = window.innerHeight || 800;
        [this._catChips].filter((c) => c && c.isConnected).concat([...body.children]).forEach((el, i) => {
          if (el.animate) el.animate([{ transform: 'translateY(' + vh + 'px)' }, { transform: 'none' }],
            { duration: 550, delay: i * 40, easing: FX_SPRING, fill: 'backwards' });
        });
      }
    }

    async _buildBody(body, k, scope, cfg, helpers, head, page, cards) {
      const norm = (t) => String(t || '').trim().toLowerCase();
      // The scenes picked in Studio live on the scene row's template; a count must see them as the row will.
      const pick = (((cfg || {}).button_card_templates || {}).hemma_scene_row || {}).variables || {};
      this._scenePick = { scenes: pick.scenes, scene_exclude: pick.scene_exclude, scene_order: pick.scene_order };
      let sections = k === 'scenes' ? [{ scenes: true }]
        : this._catSections(cfg, k).filter((sec) => !scope || norm(sec.name) === scope);
      // Home is the phone's: Scenes, Favorites, then every room, so a wall tablet can reach everything from one screen.
      if (k === 'home' && !scope) sections = sections.filter((sec) => sec.scenes).concat(sections.filter((sec) => sec.fav), sections.filter((sec) => !sec.scenes && !sec.fav));
      if (k === 'home' && scope) sections = this._roomSections(sections[0]);
      // A category page leads with the scenes that set anything of its kind, as a room page leads with its own.
      if (k !== 'home' && k !== 'scenes' && !scope) {
        let n = 0;
        try { n = window._hemmaSC ? window._hemmaSC.list(this._hass.states, this._hass, Object.assign({}, this._scenePick, { category: k })).length : 0; } catch (_) { n = 0; }
        if (n) sections = [{ scenes: true, category: k, name: _hemmaT('nav.scenes', 'Scenes') }].concat(sections);
      }
      const devices = k === 'energy' && helpers && !scope ? await this._energyDevices() : false;
      if (this._cat !== k || this._catPage !== page) return false;
      if ((!sections.length && !devices) || !helpers) {
        body.style.visibility = '';
        const empty = document.createElement('div');
        empty.className = 'cat-empty';
        empty.textContent = k === 'home' ? _hemmaT('nav.room_empty', 'Nothing in this room yet') : _hemmaT('nav.category_empty', 'Nothing in this category yet');
        body.appendChild(empty);
        return false;
      }
      const group = () => body.appendChild(Object.assign(document.createElement('div'), { className: 'cat-sec' }));
      if ((k === 'media' || k === 'home') && !scope && head.np && cards === this._catCards) this._mountNP(group(), cfg, head.np, helpers);
      sections.forEach((sec) => {
        const box = group();
        if (sec.name && (!(k === 'home' && scope) || sec.bucket || sec.scenes)) {
          const h = document.createElement('h2');
          h.textContent = sec.name;
          box.appendChild(h);
        }
        if (sec.scenes) {
          let el = null;
          // Home keeps the phone's one scrolling row; the Scenes page lays them all out.
          const sv = sec.category ? { category: sec.category } : k === 'home' ? (sec.room ? { room: sec.room } : {}) : { layout: 'grid' };
          try { el = helpers.createCardElement({ type: 'custom:button-card', template: 'hemma_scene_row', variables: Object.assign(sv, this._compact() ? { chip_width: 'min(41vw, 150px)' } : {}) }); } catch (_) {}
          if (!el) return;
          el.classList.add('cat-scenes');
          // The card pins its own width at 100% with !important, so the row reaches the edge through a wider wrapper.
          if (k === 'home' || sec.category) box.appendChild(Object.assign(document.createElement('div'), { className: 'cat-scenes-row' })).appendChild(el);
          else box.appendChild(el);
          cards.push(el);
          return;
        }
        const grid = document.createElement('div');
        grid.className = 'cat-grid';
        (sec.cards || []).forEach((cc) => {
          let el = null;
          try { el = helpers.createCardElement(JSON.parse(JSON.stringify(cc))); } catch (_) {}
          if (!el) return;
          el.classList.add('hemma-compact');
          const size = (window.hemmaCardSize && window.hemmaCardSize(cc))
            || (String((cc.variables && cc.variables.size) || '').toLowerCase() === 'large' ? 'large' : 'small');
          if (size === 'large') el.dataset.hemmaSize = 'large';
          grid.appendChild(el);
          cards.push(el);
        });
        box.appendChild(grid);
      });
      if (devices) {
        const box = group();
        const h = document.createElement('h2');
        h.textContent = _hemmaT('nav.energy_devices', 'Devices');
        box.appendChild(h);
        const row = document.createElement('div');
        row.className = 'cat-cards';
        box.appendChild(row);
        this._drawEnergy(row, devices);
      }
      return true;
    }

    // Shown before its cards draw and pack, a new page's first frame jumps from the stylesheet's columns to the packed ones.
    _swapPanes(prev, next, mode, reused) {
      const drawn = (p) => [...p.querySelectorAll('.cat-grid')].every((g) => [...g.children].every((el) => el.hidden || (el.shadowRoot && el.shadowRoot.querySelector('ha-card'))));
      if (!reused && prev && prev !== next && prev.isConnected && !drawn(next)) {
        const t0 = performance.now();
        const tok = this._swapWait = {};
        const wait = () => {
          if (this._swapWait !== tok || this._pane !== next) return;
          if (!drawn(next) && performance.now() - t0 < 600) { requestAnimationFrame(wait); return; }
          this._swapWait = null;
          this._swapRun(prev, next, mode, true);
        };
        requestAnimationFrame(wait);
        return;
      }
      this._swapRun(prev, next, mode, false);
    }

    _swapRun(prev, next, mode, late) {
      next.hidden = false;
      if (this._swapTitle != null) {
        const h1 = this._catPage && this._catPage.querySelector('.cat-in > h1');
        if (h1) h1.textContent = this._swapTitle;
        this._swapTitle = null;
      }
      const g = next.querySelector('.cat-grid');
      if (late || (g && g.offsetWidth && next._hemmaPackW !== g.offsetWidth)) { this._sortSig = null; this._sortSoon('fill'); }
      if (!prev || prev === next || !prev.isConnected) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { prev.hidden = true; return; }
      (this._swapAnims || []).forEach((a) => { try { a.cancel(); } catch (_) {} });
      const anims = this._swapAnims = [];
      const rise = mode === 'rise';
      this._slideUntil = performance.now() + (rise ? 760 : 660);
      prev.hidden = false;
      Object.assign(prev.style, { position: 'absolute', left: '0', right: '0', top: '0', pointerEvents: 'none', zIndex: rise ? '0' : '2' });
      Object.assign(next.style, { position: 'relative', zIndex: '1' });
      const back = 'translateY(20px) scale(0.93)';
      const out = rise
        ? prev.animate([{ transform: 'none', opacity: 1 }, { transform: back, opacity: 0 }], { duration: 420, easing: FX_EASE, fill: 'forwards' })
        : prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });
      anims.push(out);
      const vh = window.innerHeight || 800;
      const inner = this._catPage && this._catPage.querySelector('.cat-in');
      if (rise) [...next.children].forEach((el, i) => {
        if (el.animate) anims.push(el.animate([{ transform: 'translateY(' + vh + 'px)' }, { transform: 'none' }], { duration: 550, delay: i * 40, easing: FX_SPRING, fill: 'backwards' }));
      });
      // An even ease-out: a spring spends its travel in the first, slowest frames and reads as no motion.
      else if (inner && inner.animate) {
        anims.push(inner.animate([{ transform: back, transformOrigin: '50% 30%' }, { transform: 'none', transformOrigin: '50% 30%' }],
          { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }));
      }
      const h1 = this._catPage && this._catPage.querySelector('.cat-in > h1');
      if (h1) anims.push(h1.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' }));
      const done = () => {
        if (this._swapAnims !== anims) return;
        if (prev !== this._pane) prev.hidden = true;
        ['position', 'left', 'right', 'top', 'pointerEvents', 'zIndex'].forEach((p) => { prev.style[p] = ''; next.style[p] = ''; });
        out.cancel();
      };
      out.finished.then(() => setTimeout(done, rise ? 340 : 400), done);
    }

    // Each Overview card's own ha-card takes the top-edge fade (tablet stylesheet), so its glass keeps blurring.
    _edgeFade(tries) {
      const page = this._catPage;
      if (this._variant !== 'tablet' || !page) return;
      if (!window._hemmaCatEdge) {
        window._hemmaCatEdge = true;
        try { CSS.registerProperty({ name: '--cat-edge', syntax: '<number>', inherits: true, initialValue: '1' }); } catch (_) {}
      }
      // A card's first render can replace what was put in its shadow root, so the style is checked for, not remembered.
      let late = false;
      page.querySelectorAll('.cat-pills > *, .cat-chipcard, .cat-grid > *, .cat-scenes, .cat-np > *').forEach((el) => {
        const sr = el.shadowRoot;
        if (!sr || !sr.querySelector('ha-card')) { late = true; return; }
        if (sr.getElementById('hemma-edge')) return;
        sr.appendChild(Object.assign(document.createElement('style'), { id: 'hemma-edge', textContent: 'ha-card{opacity:var(--cat-edge,1)}' }));
      });
      if (late && (tries || 0) < 20) setTimeout(() => this._edgeFade((tries || 0) + 1), 150);
    }

    _filled() {
      const boot = this._bootReveal;
      if (boot) {
        this._bootReveal = null;
        const t0 = performance.now();
        // Shown once drawn and sorted: revealed a frame before Smart Sort, the tiles visibly reshuffle.
        const wait = () => {
          const page = this._catPage;
          if (page && performance.now() - t0 < 1200) {
            if (!this._pageDrawn(page) || !this._sceneIconsDrawn(page)) { requestAnimationFrame(wait); return; }
            if (this._sortSig == null) { this._sortSoon('fill'); if (this._sortSig == null) { requestAnimationFrame(wait); return; } }
          }
          boot.style.removeProperty('opacity');
        };
        wait();
      }
      document.documentElement.style.removeProperty('--hemma-fx-vis');
      this._edgeFade();
      const f = this._afterFill;
      this._afterFill = null;
      if (f) f();
    }

    _shelf(page, cfg) {
      if (this._shelfPage === page && this._shelfCfg === cfg && this._shelfMap) return this._shelfMap;
      const sig = JSON.stringify((cfg && cfg.views) || []);
      this._shelfCfg = cfg;
      if (this._shelfPage === page && this._shelfSig === sig && this._shelfMap) return this._shelfMap;
      this._shelfPage = page;
      this._shelfSig = sig;
      this._shelfMap = new Map();
      this._bodyKey = null;
      this._pane = null;
      const body = page.querySelector('.cat-body');
      if (body) body.replaceChildren();
      return this._shelfMap;
    }

    // Every room's cards, built while nothing else is going on, so the first visit to a room is as quick as the next.
    _prebuild(cfg, helpers, page) {
      const shelf = this._shelfMap;
      if (!helpers || !shelf || this._prebuilt === shelf) return;
      this._prebuilt = shelf;
      const norm = (t) => String(t || '').trim().toLowerCase();
      const rooms = this._catSections(cfg, 'home').filter((sec) => sec.name && !sec.scenes && !sec.fav).map((sec) => norm(sec.name));
      const body = page.querySelector('.cat-body');
      const idle = (f) => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 2000 }) : setTimeout(f, 300));
      const next = () => {
        if (this._shelfMap !== shelf || this._catPage !== page) return;
        if (!rooms.length) return;
        const scope = rooms.shift();
        const key = 'home|' + scope;
        if (shelf.has(key) || this._bodyKey === key) { idle(next); return; }
        const box = body.appendChild(Object.assign(document.createElement('div'), { className: 'cat-pane', hidden: true }));
        box._hemmaPre = true;
        box._hemmaSorted = true;
        const cards = [];
        const ok = this._buildBody(box, 'home', scope, cfg, helpers, this._catHeadCards(cfg), page, cards);
        Promise.resolve(ok).then((built) => {
          box._hemmaPre = false;
          if (built && this._shelfMap === shelf && !shelf.has(key) && this._bodyKey !== key && box.parentNode === body) {
            const F = window._hemmaFilter;
            const h = this._hass && F ? F.apply(this._hass) : this._hass;
            cards.forEach((el) => { try { el.hass = h; } catch (_) {} });
            shelf.set(key, { pane: box, cards, np: null });
          } else box.remove();
          idle(next);
        });
      };
      idle(next);
    }

    async _energyDevices() {
      if (this._energyPrefs === undefined) {
        try { this._energyPrefs = await this._hass.callWS({ type: 'energy/get_prefs' }); } catch (_) { this._energyPrefs = null; }
      }
      const p = this._energyPrefs;
      const list = p && Array.isArray(p.device_consumption) ? p.device_consumption.filter((d) => d && d.stat_consumption) : [];
      return list.length ? list : false;
    }

    // HA's Energy dashboard reads the same numbers: each device's hourly change in long-term statistics.
    async _drawEnergy(row, devices) {
      const COLORS = ['#4FA08F', '#C9A13B', '#4466B8', '#C0655C', '#8E6CC1', '#5BA3D0', '#D08A4E', '#6FA35A'];
      const day = new Date(); day.setHours(0, 0, 0, 0);
      let stats = {};
      try {
        stats = await this._hass.callWS({ type: 'recorder/statistics_during_period', start_time: day.toISOString(),
          period: 'hour', statistic_ids: devices.map((d) => d.stat_consumption), types: ['change'], units: { energy: 'kWh' } });
      } catch (_) { stats = {}; }
      if (!row.isConnected) return;
      const st = (this._hass && this._hass.states) || {};
      const devs = devices.map((d, i) => {
        const id = d.stat_consumption;
        const e = st[id];
        const name = d.name || (e && e.attributes && e.attributes.friendly_name) || id;
        const hours = new Array(24).fill(0);
        (stats[id] || []).forEach((r) => {
          const h = new Date(typeof r.start === 'number' ? r.start : Date.parse(r.start)).getHours();
          if (h >= 0 && h < 24) hours[h] += Math.max(0, Number(r.change) || 0);
        });
        return { name, color: COLORS[i % COLORS.length], hours, total: hours.reduce((a, b) => a + b, 0) };
      });
      const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const kwh = (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' kWh';
      const per = devs[0].hours.map((_, h) => devs.reduce((a, d) => a + d.hours[h], 0));
      const top = Math.max(0.01, ...per);
      const step = [0.03, 0.06, 0.15, 0.3, 0.6, 1.5, 3, 6, 15, 30].find((s) => s * 3 >= top) || Math.ceil(top / 3);
      const max = step * 3;
      const W = 360, H = 190, X = 36, Y = 8, slot = W / 24;
      let svg = '<svg viewBox="0 0 ' + (W + X + 6) + ' ' + (H + Y + 24) + '" width="100%">';
      for (let i = 0; i <= 3; i++) {
        const y = Y + H - (H * i) / 3;
        svg += '<line x1="' + X + '" x2="' + (X + W) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="rgba(255,255,255,.12)"/>'
          + '<text x="' + (X - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" fill="rgba(255,255,255,.55)" font-size="11">' + (step * i).toFixed(step < 0.1 ? 2 : 1) + '</text>';
      }
      for (let h = 0; h < 24; h++) {
        let y = Y + H;
        devs.forEach((d) => {
          const v = d.hours[h];
          if (!v) return;
          const hh = (H * v) / max;
          y -= hh;
          svg += '<rect x="' + (X + h * slot + slot * 0.18).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (slot * 0.64).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + d.color + '"/>';
        });
      }
      const clock = (h) => { const d = new Date(day); d.setHours(h); return d.toLocaleTimeString(this._hass && this._hass.language, { hour: 'numeric' }); };
      [0, 6, 12, 18].forEach((h) => { svg += '<text x="' + (X + h * slot + 2).toFixed(1) + '" y="' + (Y + H + 18) + '" fill="rgba(255,255,255,.55)" font-size="11">' + esc(clock(h)) + '</text>'; });
      svg += '</svg>';
      const big = Math.max(0.001, ...devs.map((d) => d.total));
      const sorted = devs.slice().sort((a, b) => b.total - a.total);
      row.innerHTML = '<div class="cat-en"><h3>' + esc(_hemmaT('nav.energy_usage', 'Usage today')) + '</h3><div class="sub">' + esc(_hemmaT('nav.energy_per_hour', 'kWh per hour')) + '</div>' + svg
        + '<div class="lgs">' + devs.map((d) => '<span class="lg"><i style="background:' + d.color + '"></i>' + esc(d.name) + '</span>').join('') + '</div></div>'
        + '<div class="cat-en"><h3>' + esc(_hemmaT('nav.energy_devices_title', 'Individual devices')) + '</h3><div class="sub">' + esc(_hemmaT('nav.energy_today', 'Today')) + '</div>'
        + sorted.map((d) => '<div class="hb"><span class="hn">' + esc(d.name) + '</span><span class="hbar"><i style="width:' + Math.round((d.total / big) * 100) + '%;background:' + d.color + '"></i></span><span class="hv">' + kwh(d.total) + '</span></div>').join('')
        + '</div>';
      row.querySelectorAll('.cat-en').forEach((card) => {
        card.addEventListener('click', () => {
          if (window._hemmaOpenTarget) window._hemmaOpenTarget(['hemma_energy', 'hemma_badge_energy_group', 'hemma_badge_energy'], null);
        });
      });
      clearTimeout(this._energyTick);
      this._energyTick = setTimeout(() => { if (row.isConnected && this._cat === 'energy') this._drawEnergy(row, devices); }, 300000);
    }

    _closeCat(instant) {
      this.classList.remove('under');
      if (this._baseMode && !instant && this._catPage) {
        if (this._cat !== 'home') { this._catSwap = 'return'; this._toBase(); }
        return;
      }
      const els = this._catEls;
      if (!els) { this._cat = null; return; }
      this._catEls = null;
      this._catPage = null;
      this._catCards = [];
      this._catHead = null;
      this._catWx = null;
      this._catChrome = null;
      this._cat = null;
      if (this._catFilterOff) { this._catFilterOff(); this._catFilterOff = null; }
      if (window._hemmaFilter) window._hemmaFilter.set('all');
      this._markSide();
      this._syncBack();
      this._catRoom = null;
      if (instant) { this._parkBadge(els); els.forEach((n) => n.remove()); this._glideEnd(); return; }
      // A page opened from a room stays over it until the next room has painted, so the old one never shows.
      if (this._catFrom !== 'home' && Date.now() - (this._fxNoSlideAt || 0) < 50) {
        this._glideEnd();
        els.forEach((n) => { n.style.pointerEvents = 'none'; });
        this._catDefer = els;
        clearTimeout(this._catDeferT);
        this._catDeferT = setTimeout(() => this._dropDeferred(), 1500);
        return;
      }
      // The badges come forward with the rest of the header (_fxPlay), not down from the page's row.
      this._glideEnd();
      els.forEach((n) => n.classList.remove('still', 'show'));
      // The badge card stays in the fading page: taken out now, its row collapses and the page jumps up.
      setTimeout(() => { this._parkBadge(els); els.forEach((n) => n.remove()); }, 320);
      // Leaving for another room waits for that room, so the depth plays on what you land on.
      if (Date.now() - (this._fxNoSlideAt || 0) < 50) {
        this._fxAwait = true;
        this._fxAwaitT = setTimeout(() => { if (this._fxAwait) this._fxPlay(); }, 1500);
      } else this._fxPlay();
    }

    // The badge row is one row in both places: the page's badges start over the dashboard's and rise into place.
    _badgeMap(root) {
      const MAP = { hemma_badge_climate_group: 'climate', hemma_badge_light_group: 'lights', hemma_badge_presence_group: 'presence',
        hemma_badge_presence: 'presence', hemma_badge_media_group: 'media', hemma_badge_security_group: 'security',
        hemma_badge_lock_group: 'security', hemma_badge_energy_group: 'energy' };
      const found = [];
      try { walkFind(root, 'button-card', found, 0); } catch (_) {}
      const out = new Map();
      found.forEach((el) => {
        for (const t of [].concat((el._config || {}).template || [])) {
          const k = MAP[t];
          if (!k || out.has(k)) continue;
          if (el.getBoundingClientRect().width) out.set(k, el);
        }
      });
      return out;
    }

    // Building the page's badge row takes most of a second, so it is built once, parked out of sight, and moved in.
    async _warmBadges() {
      if (this._warmBadge || this._warming) return;
      this._warming = true;
      const cfg = await this._mobileConfig();
      const helpers = await this._catHelpers();
      const head = this._catHeadCards(cfg);
      let el = null;
      if (helpers && head.badges) { try { el = helpers.createCardElement(JSON.parse(JSON.stringify(head.badges))); } catch (_) {} }
      if (!el || !this.isConnected) { this._warming = false; return; }
      el.classList.add('cat-badgecard');
      const hold = document.createElement('div');
      hold.className = 'cat-warm';
      hold.appendChild(el);
      this.shadowRoot.appendChild(hold);
      this._warmHold = hold;
      this._warmBadge = el;
      const h = this._hass && window._hemmaFilter ? window._hemmaFilter.apply(this._hass) : this._hass;
      if (h) { try { el.hass = h; } catch (_) {} }
    }

    // Only from the page being removed: a page opened meanwhile has already taken the card.
    _parkBadge(from) {
      const el = this._warmBadge, hold = this._warmHold;
      if (!el || !hold || el.parentNode === hold) return;
      if (from && !from.some((n) => n.contains(el))) return;
      hold.appendChild(el);
    }

    // The budget ends 16px above whatever sits under the column, so a long stack shrinks instead of overlapping it.
    _fitNP() {
      const card = this._heroCardFor(this._activeIdx);
      const np = card && card.querySelector('#now_playing');
      if (!np) return;
      const found = [];
      try { walkFind(np, 'button-card', found, 0); } catch (_) {}
      const tpl = (el) => [].concat((el._config || {}).template || []);
      const host = found.find((el) => tpl(el).indexOf('hemma_now_playing') >= 0);
      const tile = found.find((el) => tpl(el).indexOf('hemma_now_playing_primary') >= 0 && el.getBoundingClientRect().height);
      if (!host || !tile) return;
      const col = tile.getBoundingClientRect();
      const under = [];
      ['#temperature', '#name'].forEach((sel) => { const e = card.querySelector(sel); if (e) under.push(e); });
      const row = card.querySelector('#badges');
      if (row) this._badgeMap(row).forEach((b) => under.push(b));
      try { const rows = []; walkFind(this._viewHost() || document, 'hemma-smart-row', rows, 0); rows.forEach((r) => under.push(r)); } catch (_) {}
      let floor = Infinity;
      under.forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.height && r.right > col.left - 8 && r.left < col.right && r.top > col.top) floor = Math.min(floor, r.top);
      });
      const budget = Number.isFinite(floor) ? Math.max(120, Math.round(floor - col.top - 16)) : null;
      if (host._npBudget === budget) return;
      host._npBudget = budget;
      if (budget == null) host.style.removeProperty('--np-stack-budget');
      else host.style.setProperty('--np-stack-budget', budget + 'px');
    }

    _heroBadgeRow() {
      const card = this._heroCardFor(this._activeIdx);
      return (card && card.querySelector('#badges')) || null;
    }

    // The room card's badge sizes, so the row glides into a page unchanged.
    _applyBadgeVars(pills) {
      (this._badgeVars || []).forEach(([n, v]) => pills.style.setProperty(n, v));
      if (!this._baseMode) return;
      // The gap between badges only: --badge-col-gap-current is the icon-to-text gap inside each one.
      pills.style.setProperty('--badge-gap-current', '11px');
      if (!(this._badgeVars || []).some(([n]) => n === '--badge-col-gap-current')) pills.style.removeProperty('--badge-col-gap-current');
      // layout-card gives every badge 4px either side as well.
      pills.style.setProperty('--masonry-view-card-margin', '4px 0 8px');
      // Plain px: Safari drops calc(clamp() * k), which is how the room card's own sizes are written.
      if (this._compact()) [['--badge-padding-current', '3px 12px 3px 7px'], ['--badge-min-height-current', '40px'],
        ['--badge-icon-size-current', '24px'], ['--badge-font-size-current', '12px'], ['--badge-btn-size-current', '18px']]
        .forEach(([n, v]) => pills.style.setProperty(n, v));
    }

    _compact() {
      return !!this._baseMode && this._variant !== 'tablet';
    }

    _readBadgeVars(row) {
      if (!row) return;
      const cs = getComputedStyle(row);
      const vars = ['--badge-gap-current', '--badge-col-gap-current', '--badge-padding-current', '--badge-min-height-current',
        '--badge-icon-size-current', '--badge-font-size-current', '--badge-btn-size-current']
        .map((n) => [n, cs.getPropertyValue(n).trim()]).filter(([, v]) => v);
      if (vars.length) this._badgeVars = vars;
    }

    _glideStart() {
      const row = this._heroBadgeRow();
      this._glideFrom = null;
      this._glideRow = row;
      if (!row) return;
      this._readBadgeVars(row);
      // Where the dashboard's row starts; the page's row starts there and rises with everything else.
      const r = row.getBoundingClientRect();
      this._glideFrom = { top: r.top, left: r.left };
      // Held in place and in view until the page's row takes over; the depth hold would otherwise hide it.
      row.style.visibility = 'visible';
      row.style.transform = 'none';
    }

    // The page's row moves as one container, so it needs nothing inside it measured or even drawn yet.
    _glideUp(card, pills) {
      const from = this._glideFrom;
      this._glideFrom = null;
      const row = this._glideRow;
      requestAnimationFrame(() => {
        if (!pills.isConnected) return;
        pills.style.visibility = '';
        if (from && pills.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const to = card.getBoundingClientRect();
          const inset = parseFloat(getComputedStyle(pills).getPropertyValue('--hemma-rail-left')) || 0;
          pills.animate([{ transform: 'translate(' + (from.left - to.left - inset) + 'px, ' + (from.top - to.top) + 'px)' }, { transform: 'none' }],
            { duration: 550, easing: FX_SPRING });
        }
        if (row) row.style.visibility = 'hidden';
      });
    }

    _glideEnd() {
      const row = this._glideRow;
      this._glideRow = null;
      this._glideFrom = null;
      if (row) { row.style.removeProperty('visibility'); row.style.removeProperty('transform'); }
    }

    // The view carries only a static start state, so a room HA builds mid-animation paints in place.
    _fxTargets() {
      const out = [];
      const card = this._heroCardFor(this._activeIdx);
      if (card) card.querySelectorAll('#name, #temperature, [id^="badges"], #now_playing').forEach((el) => { if (el !== this._glideRow) out.push(el); });
      const rows = [];
      try { walkFind(this._viewHost() || document, 'hemma-smart-row', rows, 0); } catch (_) {}
      rows.forEach((r) => { if (r.isConnected && r.getBoundingClientRect().width) out.push(r); });
      return { card, els: out, rows: rows.length };
    }

    _fxHold(xf) {
      const host = this._viewHost();
      if (!host) return;
      host.style.setProperty('--hemma-fx-xf', xf);
      host.style.setProperty('--hemma-fx-vis', 'hidden');
    }

    _fxRelease() {
      cancelAnimationFrame(this._fxRaf);
      clearTimeout(this._fxAwaitT);
      this._fxAwait = false;
      const host = this._viewHost();
      if (!host) return;
      host.style.removeProperty('--hemma-fx-xf');
      host.style.removeProperty('--hemma-fx-vis');
    }

    _fxStop() {
      (this._fxAnims || []).forEach((a) => { try { a.cancel(); } catch (_) {} });
      this._fxAnims = [];
    }

    _slideIn() {
      const dir = this._slideDir;
      this._slideDir = 0;
      if (!dir) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Overview hides the room card, so only the page slides; the card's photo still drifts on its own.
      if (this._baseMode) { this._baseDir = dir; return; }
      const W = this._sideOpen && this._pushed ? Math.round(this._side.getBoundingClientRect().width) : 0;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this._pushTargets().forEach((el) => {
          if (!el.animate || el.id === 'time') return;
          const P = this._pushShift(W);
          // The header fades in quickly, so it shows most of its travel; it moves less than the rows to look the same.
          const d = el.tagName === 'HEMMA-SMART-ROW' ? 70 : 32;
          el.animate([{ translate: (P + dir * d) + 'px 0px' }, { translate: P + 'px 0px' }],
            { duration: 480, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
          if (FX_TEXT(el)) el.animate([{ opacity: 0, offset: 0 }], { duration: 220, easing: 'ease-out' });
        });
      }));
    }

    // The photo a room's card will draw (hemma_room's --hero-img), worked out before HA has built that card.
    _photoFor(idx) {
      const el = this._els[idx];
      const map = this._roomPhotos;
      if (!el || !map || !el.route.url) return null;
      const v = map[normalize(el.route.url).split('/').pop()];
      if (!v) return null;
      const t = this._hass && this._hass.themes;
      const dark = t && typeof t.darkMode === 'boolean' ? t.darkMode : window.matchMedia('(prefers-color-scheme: dark)').matches;
      const base = v.image || 'default';
      return { url: '/local/hemma/rooms/' + (dark ? (v.night || base + '-night') : base) + '.jpg', pos: v.pos || 'center center' };
    }

    // The arriving photo fades in over the leaving one and is dropped once that room's card shows the same photo.
    _photoSwap(fromIdx, toIdx, drift) {
      this._photoEnd();
      const card = this._heroCardFor(fromIdx);
      const ph = this._photoFor(toIdx);
      if (!card || !card.isConnected || !ph) return false;
      const r = card.getBoundingClientRect();
      const cs = getComputedStyle(card, '::after');
      if (!r.width || !/url\(/.test(cs.backgroundImage)) return false;
      const box = document.createElement('div');
      box.className = 'cat-xfade';
      Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: getComputedStyle(card).borderRadius });
      const img = box.appendChild(document.createElement('div'));
      ['backgroundSize', 'backgroundRepeat', 'filter', 'transform', 'transformOrigin'].forEach((k) => { img.style[k] = cs[k]; });
      img.style.backgroundImage = cs.backgroundImage.replace(/url\([^)]*\)/g, 'url("' + ph.url + '")');
      img.style.backgroundPosition = cs.backgroundPosition.split(',').map((p, i) => (i ? ph.pos : p)).join(',');
      // The card's dither (::before) sits over its photo; without it the copy is a shade brighter and the hand-off shows.
      const ds = getComputedStyle(card, '::before');
      if (ds.backgroundImage && ds.backgroundImage !== 'none') {
        const dith = box.appendChild(document.createElement('div'));
        ['backgroundImage', 'backgroundSize', 'backgroundRepeat', 'backgroundPosition', 'opacity', 'mixBlendMode'].forEach((k) => { dith.style[k] = ds[k]; });
      }
      this.shadowRoot.appendChild(box);
      this._xfade = box;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
        // Home to a room and back, the photo drifts in as Focus's does (hemmaRoomParallax), from the tap.
        const xf = cs.transform === 'none' ? '' : cs.transform;
        if (drift) img.animate([{ transform: xf + ' translateX(1.2%)' }, { transform: xf || 'none' }],
          { duration: 500, delay: 50, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'backwards' });
      }
      this._xfadeT = setTimeout(() => this._photoEnd(), 4000);
      return true;
    }

    // Two frames after the card is found, so its own photo has painted under the copy.
    _photoDone() {
      const box = this._xfade;
      if (!box) return;
      requestAnimationFrame(() => requestAnimationFrame(() => { if (this._xfade === box) this._photoEnd(); }));
    }

    _photoEnd() {
      clearTimeout(this._xfadeT);
      if (this._xfade) this._xfade.remove();
      this._xfade = null;
    }

    // HA's switch to the room's view is the heaviest step; run on the tap, it held the first frame for a quarter second.
    _baseGo(idx, to) {
      const prev = this._activeIdx;
      const fromCat = !!this._cat && this._cat !== 'home';
      const dir = !fromCat && prev >= 0 && (prev === 0) !== (idx === 0) ? (idx === 0 ? -1 : 1) : 0;
      if (fromCat) this._catSwap = 'return';
      this._photoSwap(this._shownIdx, idx, !!dir);
      this._els.forEach((el, i) => el.btn.classList.toggle('active', i === idx));
      this._activeIdx = idx;
      if (this._variant === 'tablet') { this._fold(); this._placeIndicator(); }
      if (this._sideOpen) this._markSide();
      this._earlyIdx = idx;
      clearTimeout(this._navT);
      const token = this._navTok = {};
      const nav = () => { if (this._navTok === token) { this._navTok = null; navigate(to); } };
      this._toBase();
      if (dir && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this._afterSlide = nav;
        this._slidePage(dir);
        this._navT = setTimeout(nav, 1800);
      } else this._navT = setTimeout(nav, 120);
    }

    // Overview's page changes the frame the room's own card appears, so the photo and the page change together.
    _baseSwap(idx) {
      cancelAnimationFrame(this._baseRaf);
      const dir = this._baseDir || 0;
      this._baseDir = 0;
      const t0 = performance.now();
      const early = this._earlyIdx === idx;
      this._earlyIdx = null;
      const tick = () => {
        if (this._activeIdx !== idx || !this._baseMode) return;
        if (!this._heroCardFor(idx) && performance.now() - t0 < 600) { this._baseRaf = requestAnimationFrame(tick); return; }
        // Moved already (_baseGo): only the photo was waiting for HA.
        if (early) { this._photoDone(); return; }
        this._toBase();
        if (dir && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) this._slidePage(dir);
      };
      tick();
    }

    // The scene chips' ha-icons fetch their paths after the chips draw; shown before that, the row comes up without them.
    _sceneIconsDrawn(page) {
      const row = page.querySelector('.cat-scenes');
      if (!row || !row.shadowRoot) return !row;
      const icons = [];
      const walk = (r) => r.querySelectorAll('*').forEach((e) => { if (e.tagName === 'HA-ICON') icons.push(e); else if (e.shadowRoot) walk(e.shadowRoot); });
      walk(row.shadowRoot);
      return icons.every((i) => {
        const svg = i.shadowRoot && i.shadowRoot.querySelector('ha-svg-icon');
        const path = svg && svg.shadowRoot && svg.shadowRoot.querySelector('path');
        return !!(path && path.getAttribute('d'));
      });
    }

    // The pane on show, not every unhidden one: mid-swap the outgoing pane is unhidden too, to animate out.
    _pageDrawn(page) {
      const pane = this._pane && page.contains(this._pane) ? this._pane : null;
      // A card's ha-card exists a few frames before its first styles let it show.
      const shown = (el) => {
        const c = el.shadowRoot && el.shadowRoot.querySelector('ha-card');
        if (!c) return false;
        if (c._hemmaShown) return true;
        return (c._hemmaShown = getComputedStyle(c).visibility !== 'hidden');
      };
      return [...(pane ? pane.querySelectorAll('.cat-grid') : [])].every((g) => [...g.children].every((el) => el.hidden || shown(el)));
    }

    // It starts with the page's own fill, so the photo and the cards change in the same frame.
    _slidePage(dir) {
      const page = this._catPage;
      const inner = page && page.querySelector('.cat-in');
      if (!inner) return;
      (this._slideAnims || []).forEach((a) => { try { a.cancel(); } catch (_) {} });
      this._slideAnims = [];
      clearTimeout(this._slideT);
      const token = this._slideTok = {};
      inner.style.opacity = '0';
      const go = () => {
        if (this._slideTok !== token) return;
        this._slideTok = null;
        this._afterFill = null;
        clearTimeout(this._slideT);
        if (this._sortSig == null) this._sortSoon('fill');
        inner.style.removeProperty('opacity');
        if (this._catPage !== page) return;
        this._slideUntil = performance.now() + 660;
        // An even ease-out: the frames right after a room change are the slow ones, and a front-loaded curve jumps.
        const ease = 'cubic-bezier(0.33, 1, 0.68, 1)';
        const move = (el, d, fade) => {
          if (!el.animate || !el.getClientRects().length) return;
          this._slideAnims.push(el.animate([{ translate: dir * d + 'px 0px' }, { translate: '0px 0px' }], { duration: 640, easing: ease }));
          if (fade) this._slideAnims.push(el.animate([{ opacity: 0, offset: 0 }], { duration: 320, easing: 'ease-out' }));
        };
        inner.querySelectorAll(':scope > h1, :scope > .cat-wx').forEach((el) => move(el, 32, true));
        inner.querySelectorAll(':scope > .cat-pills, :scope > .cat-chipcard').forEach((el) => move(el, 32, false));
        inner.querySelectorAll(':scope > .cat-body > .cat-pane:not([hidden]) > *').forEach((el) => move(el, 70, false));
        const after = this._afterSlide;
        this._afterSlide = null;
        if (after) Promise.all(this._slideAnims.map((a) => a.finished)).then(after, after);
      };
      // A room built before is back at once; a new one waits until its cards have drawn, so none appear mid-slide.
      this._afterFill = () => {
        const t0 = performance.now();
        const wait = () => {
          if (this._slideTok !== token) return;
          if (!this._pageDrawn(page) && performance.now() - t0 < 600) { requestAnimationFrame(wait); return; }
          go();
        };
        wait();
      };
      this._slideT = setTimeout(go, 900);
    }

    // Two-row bands that never leave a hole before a later tile; a band with large tiles is only as wide as it fills.
    _packGrid(g, list, w0) {
      // Layout width, not the drawn one: a page coming back from a filter is still scaled down by its entrance.
      const w = (w0 != null ? w0 : g.offsetWidth) + (this._packDW || 0);
      if (!w) return;
      const pane = g.closest('.cat-pane');
      if (pane) pane._hemmaPackW = w;
      const cols = Math.max(1, Math.floor((w + 10) / (this._compact() ? 175 : 200)));
      g.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
      if (pane) pane.style.setProperty('--cat-two-tiles', (2 * (w - 10 * (cols - 1)) / cols + 10).toFixed(2) + 'px');
      const big = (el) => el.dataset.hemmaSize === 'large';
      const all = list || [...g.children];
      all.forEach((el) => { el.style.gridColumn = ''; el.style.gridRow = ''; el.style.order = ''; });
      const left = all.filter((el) => !el.hidden);
      let row = 1;
      while (left.length) {
        const band = [];
        let cells = 0;
        left.forEach((el) => { const n = big(el) ? 2 : 1; if (cells + n <= 2 * cols) { band.push(el); cells += n; } });
        if (!band.length) band.push(left[0]);
        band.forEach((el) => left.splice(left.indexOf(el), 1));
        const bigs = band.filter(big).length;
        if (!bigs) {
          band.forEach((el, i) => { el.style.gridColumn = String((i % cols) + 1); el.style.gridRow = String(row + Math.floor(i / cols)); });
          row += Math.ceil(band.length / cols);
          continue;
        }
        // A band that fits one row stays one row, large tiles first as Apple Home does; a wider one pairs smalls under each other.
        const fits = band.length <= cols;
        let top = (fits ? band.length : Math.min(cols, bigs + Math.ceil((band.length - bigs) / 2))) - bigs;
        const row1 = [], row2 = [];
        (fits ? band.filter(big).concat(band.filter((el) => !big(el))) : band).forEach((el) => { if (big(el)) row1.push(el); else if (top > 0) { row1.push(el); top--; } else row2.push(el); });
        row1.forEach((el, c) => { el.style.gridColumn = String(c + 1); el.style.gridRow = big(el) ? row + ' / span 2' : String(row); });
        const under = row1.map((el, c) => (big(el) ? -1 : c)).filter((c) => c >= 0);
        row2.forEach((el, k) => { el.style.gridColumn = String(under[k] + 1); el.style.gridRow = String(row + 1); });
        row += 2;
      }
    }

    // Moved a moment after the change, never mid-tap.
    _sortSoon(now) {
      const page = this._catPage;
      if (!page) return;
      // Reading every tile's style mid-slide costs frames; the sort catches up once the page has landed.
      if (now !== 'fill' && performance.now() < (this._slideUntil || 0)) {
        clearTimeout(this._sortLateT);
        this._sortLateT = setTimeout(() => this._sortSoon(), this._slideUntil - performance.now() + 20);
        return;
      }
      // Only the pane on show, by its own rule: the outgoing one is unhidden mid-swap and was scrambled for the next visit.
      const pane = this._pane;
      if (!pane || !page.contains(pane)) return;
      const sorted = !!pane._hemmaSorted;
      const active = (el) => this._tileActive(el);
      const grids = [...pane.querySelectorAll('.cat-grid')];
      // Sorted before the cards draw, every tile reads as off, so the first sort waits for them and never animates.
      const drawn = this._pageDrawn(page);
      if (!drawn) {
        clearTimeout(this._sortWaitT);
        if (Date.now() - (this._sortWaitAt || (this._sortWaitAt = Date.now())) < 600) {
          this._sortWaitT = setTimeout(() => this._sortSoon(now), 60);
          return;
        }
      }
      this._sortWaitAt = 0;
      const sig = grids.map((g) => [...g.children].map((el) => (el.hidden ? 'h' : sorted && active(el) ? 1 : 0)).join('')).join('|')
        + '@' + Math.round(page.getBoundingClientRect().width);
      if (sig === this._sortSig) return;
      const first = this._sortSig == null;
      this._sortSig = sig;
      clearTimeout(this._sortT);
      const run = (quiet) => {
        if (this._catPage !== page || this._pane !== pane) return;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || first || quiet === true;
        grids.forEach((g) => {
          this._watchShowWhen(g, pane);
          const kids = [...g.children];
          const before = still ? null : new Map(kids.map((el) => [el, el.getBoundingClientRect()]));
          this._packGrid(g, sorted ? kids.filter(active).concat(kids.filter((el) => !active(el))) : kids);
          if (!before) return;
          kids.forEach((el) => {
            const a = before.get(el), b = el.getBoundingClientRect();
            const dx = a.left - b.left, dy = a.top - b.top;
            if ((dx || dy) && el.animate) el.animate([{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'none' }],
              { duration: 420, easing: FX_SPRING });
          });
        });
      };
      // A tile that shows only while active (Plex, Updates) appears a moment after the page: in place, not moved later.
      const fresh = Date.now() - (this._sortFilledAt || 0) < 4000;
      if (first || now || !sorted || fresh) run(fresh);
      else this._sortT = setTimeout(run, 2500);
    }

    // Re-sorted in the same task, before paint, so a show_when tile first appears among the active tiles.
    _watchShowWhen(g, pane) {
      if (g._hemmaShowMO || !window.MutationObserver) return;
      g._hemmaShowMO = new MutationObserver(() => {
        if (this._pane !== pane || !g.isConnected) return;
        const kids = [...g.children];
        const active = (el) => this._tileActive(el);
        this._packGrid(g, pane._hemmaSorted ? kids.filter(active).concat(kids.filter((el) => !active(el))) : kids);
      });
      g._hemmaShowMO.observe(g, { attributes: true, attributeFilter: ['hidden'], subtree: true });
    }

    _tileActive(el) {
      if (el.hidden) return false;
      // Shown at all means active, even before its card has drawn the active look.
      if (((el._config || {}).variables || {}).show_when === 'active') return true;
      const ha = el.shadowRoot && el.shadowRoot.querySelector('ha-card');
      if (!ha) return false;
      const v = ha.style.getPropertyValue('--hemma-active-overlay-opacity').trim()
        || getComputedStyle(ha).getPropertyValue('--hemma-active-overlay-opacity').trim();
      return v === '1';
    }

    // The page glides to its new edge, so its columns are counted for where it lands, as the sidebar starts to move.
    _packFor(left) {
      const page = this._catPage;
      if (!page || this._sortSig == null) return;
      const pane = this._pane;
      if (!pane || !page.contains(pane)) return;
      this._packDW = Math.round(page.getBoundingClientRect().left - left);
      const sorted = !!pane._hemmaSorted;
      // Every tile is read before any grid is written, or each grid's write forces the next read to restyle the page.
      const plans = [...pane.querySelectorAll('.cat-grid')].map((g) => {
        const kids = [...g.children];
        const on = sorted ? new Set(kids.filter((el) => this._tileActive(el))) : null;
        return [g, on ? [...on].concat(kids.filter((el) => !on.has(el))) : kids, g.offsetWidth];
      });
      plans.forEach(([g, list, w]) => this._packGrid(g, list, w));
      this._packDW = 0;
      this._sortSig = null;
    }

    // Every room's photo, fetched once, so a room change never waits on one.
    async _preloadPhotos() {
      if (this._photosAsked || !this._hass) return;
      this._photosAsked = true;
      const seg = String(location.pathname.split('/')[1] || '');
      let cfg = null;
      try { cfg = await this._hass.callWS({ type: 'lovelace/config', url_path: seg }); } catch (_) { return; }
      const urls = new Set();
      const rooms = this._roomPhotos = {};
      let view = null;
      const walk = (c) => {
        if (!c || typeof c !== 'object') return;
        if ([].concat(c.template || []).indexOf('hemma_room') >= 0) {
          const v = c.variables || {};
          if (view != null && !rooms[view]) rooms[view] = { image: v.image, night: v.image_night, pos: v.image_position };
          const base = v.image || 'default';
          urls.add('/local/hemma/rooms/' + base + '.jpg');
          urls.add('/local/hemma/rooms/' + (v.image_night || base + '-night') + '.jpg');
        }
        (c.cards || []).forEach(walk);
        if (c.card) walk(c.card);
      };
      ((cfg && cfg.views) || []).forEach((v, i) => { view = String(v.path || i); (v.cards || []).forEach(walk); });
      this._photos = [...urls].map((u) => { const i = new Image(); i.src = u; if (i.decode) i.decode().catch(() => {}); return i; });
    }

    _dropDeferred() {
      clearTimeout(this._catDeferT);
      cancelAnimationFrame(this._catDeferRaf);
      const els = this._catDefer;
      this._catDefer = null;
      if (els) { this._parkBadge(els); els.forEach((n) => n.remove()); }
      if (!this._cat) this._fxRelease();
    }

    _dropDeferredWhenPainted() {
      const tick = () => {
        if (!this._catDefer) return;
        if (this._heroCardFor(this._activeIdx)) { this._dropDeferred(); return; }
        this._catDeferRaf = requestAnimationFrame(tick);
      };
      tick();
    }

    _fxOut() {
      this._fxStop();
      cancelAnimationFrame(this._fxRaf);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { this._fxHold('none'); return; }
      const xf = 'translateY(20px) scale(0.93)';
      const anims = [];
      this._fxTargets().els.forEach((el) => {
        if (!el.animate) return;
        if (FX_TEXT(el)) anims.push(el.animate([{ opacity: 0 }], { duration: 300, easing: FX_EASE, fill: 'forwards' }));
        anims.push(el.animate([{ transform: xf }], { duration: 420, easing: FX_EASE, fill: 'forwards' }));
      });
      this._fxAnims = anims;
      const settle = () => { if (this._fxAnims !== anims || !this._cat) return; this._fxHold(xf); this._fxStop(); };
      if (!anims.length) settle();
      else Promise.all(anims.map((a) => a.finished)).then(settle, () => {});
    }

    _fxPlay() {
      this._fxStop();
      cancelAnimationFrame(this._fxRaf);
      clearTimeout(this._fxAwaitT);
      this._fxAwait = false;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { this._fxRelease(); return; }
      const from = 'translateY(20px) scale(0.93)';
      this._fxHold(from);
      const start = performance.now();
      const go = () => {
        const t = this._fxTargets();
        const waited = performance.now() - start;
        // Rows can land a frame or two after the hero card; starting without them would leave them to pop in.
        if ((!t.card || (!t.rows && waited < 400)) && waited < 2000) { this._fxRaf = requestAnimationFrame(go); return; }
        const anims = [];
        t.els.forEach((el) => {
          if (!el.animate) return;
          if (FX_TEXT(el)) anims.push(el.animate([{ opacity: 0, offset: 0 }], { duration: 500, easing: FX_EASE }));
          anims.push(el.animate([{ transform: from, offset: 0 }], { duration: 620, easing: FX_SPRING }));
        });
        this._fxAnims = anims;
        this._fxRelease();
      };
      this._fxRaf = requestAnimationFrame(go);
    }

    // Pages start where the dashboard does, so Home Assistant's own docked sidebar stays reachable.
    _syncCatLeft() {
      const vh = this._viewHost();
      const left = vh ? Math.max(0, Math.round(vh.getBoundingClientRect().left)) : 0;
      if (left === this._catLeft) return;
      this._catLeft = left;
      this.shadowRoot.host.style.setProperty('--cat-left', left + 'px');
    }

    _syncCatPush(instant) {
      this._syncCatLeft();
      const vh = this._viewHost();
      if (vh && window.ResizeObserver && this._catLeftHost !== vh) {
        if (this._catLeftRO) this._catLeftRO.disconnect();
        this._catLeftHost = vh;
        this._catLeftRO = new ResizeObserver(() => this._syncCatLeft());
        this._catLeftRO.observe(vh);
      }
      const pushed = !!(this._sideOpen && this._pushed);
      (this._catEls || []).forEach((n) => {
        if (instant && n.classList.contains('pushed') !== pushed) {
          n.style.transition = 'none';
          requestAnimationFrame(() => requestAnimationFrame(() => n.style.removeProperty('transition')));
        }
        n.classList.toggle('pushed', pushed);
      });
      const page = this._catPage;
      if (!page) return;
      const card = !pushed && this._heroCardFor(this._activeIdx);
      const n = card && card.querySelector('#name');
      const r = n && n.getBoundingClientRect();
      // Overview without the sidebar keeps Apple Home's even margins: the left gutter is the right one.
      const x = pushed ? this._sideGap() : this._baseMode ? 22 : r && r.width ? Math.round(r.left - (parseFloat(n.style.translate) || 0)) : 0;
      const mini = this.shadowRoot.querySelector('.cat-mini');
      [page, mini].forEach((el) => { if (!el) return; if (pushed || x > 20) el.style.setProperty('--cat-gutter', x + 'px'); else el.style.removeProperty('--cat-gutter'); });
      this._syncBack();
    }

    _catHasContent(k) {
      if (this._catSections(this._mobCfg, k).length) return true;
      if (k !== 'energy') return false;
      if (this._energyPrefs === undefined) {
        if (!this._energyAsk && this._hass) {
          this._energyAsk = true;
          this._energyDevices().then((d) => { if (d && this._sideList) this._fillSide(); });
        }
        return false;
      }
      const p = this._energyPrefs;
      return !!(p && Array.isArray(p.device_consumption) && p.device_consumption.some((d) => d && d.stat_consumption));
    }

    _sideCategories() {
      const ALL = ['climate', 'lights', 'presence', 'media', 'security', 'energy'];
      if (this._mobCfg) {
        const b = this._catHeadCards(this._mobCfg).badges;
        if (b) {
          const order = (b.variables && Array.isArray(b.variables.badge_order) && b.variables.badge_order.length)
            ? b.variables.badge_order : ALL;
          const v = b.variables || {};
          return order.map((k) => (k === 'people' ? 'presence' : k)).filter((k, i, a) => ALL.indexOf(k) >= 0 && a.indexOf(k) === i
            && v['show_' + (k === 'presence' ? 'people' : k)] !== false && this._catHasContent(k));
        }
      } else if (this._hass && !this._mobCfgAsk) {
        this._mobCfgAsk = true;
        this._mobileConfig().then((c) => { if (c && this._sideList) this._fillSide(); });
      }
      const MAP = { climate_group: 'climate', light_group: 'lights', presence_group: 'presence',
        media_group: 'media', security_group: 'security', lock_group: 'security', energy_group: 'energy' };
      const found = [];
      try { walkFind(document, 'button-card', found, 0); } catch (_) {}
      const have = new Set();
      found.forEach((el) => {
        const t = [].concat((el._config || {}).template || []).join(' ');
        for (const k in MAP) {
          if (t.indexOf('hemma_badge_' + k) >= 0 && el.getBoundingClientRect().width > 0) have.add(MAP[k]);
        }
      });
      return ['climate', 'lights', 'presence', 'media', 'security', 'energy'].filter((k) => have.has(k));
    }

    _sceneCount() {
      if (!this._hass) return 0;
      try { return this._menuItems({ menu: 'scenes' }).length; } catch (_) { return 0; }
    }

    _fillSide() {
      if (!window.HEMMA_ICONS && !this._iconWait) {
        const t0 = Date.now();
        this._iconWait = setInterval(() => {
          if (!window.HEMMA_ICONS && Date.now() - t0 < 10000) return;
          clearInterval(this._iconWait);
          if (window.HEMMA_ICONS && this._sideList) this._fillSide();
        }, 100);
      }
      const list = this._sideList;
      if (!list) return;
      list.innerHTML = '';
      const hass = this._hass;
      // Apple Home keeps the sidebar open and swaps the room beside it.
      const go = (idx) => () => {
        const el = this._els[idx];
        if (!el) return;
        if (this._baseMode) {
          if (!this._pushed) this._closeSide();
          if (idx !== this._activeIdx) this._activate(el.route, el.btn);
          else if (this._cat && this._cat !== 'home') this._closeCat();
          else this._toBase();
          return;
        }
        const was = !!this._cat;
        if (was && idx !== this._activeIdx) this._fxNoSlideAt = Date.now();
        this._closeCat();
        if (idx === this._activeIdx) { if (was) this._markSide(); return; }
        if (!this._pushed) {
          // Portrait overlays the page: close and change room together.
          this._closeSide();
          this._activate(el.route, el.btn, true);
          return;
        }
        this._activate(el.route, el.btn);
        this._markSide();
      };
      const badgeOf = (route) => {
        const cfg = route.badge;
        if (!cfg) return undefined;
        return !!(hass && resolve(cfg.show, hass, false));
      };
      this._sideRooms = [];
      const rooms = [];
      this._els.forEach((el, i) => {
        if (i === 0 || this._isMenuRoute(el.route)) return;
        rooms.push(i);
      });
      if (this._els[0]) {
        const r = this._els[0].route;
        const home = this._sideItem(r.glyph || 'home', this._els[0].label.textContent,
          this._activeIdx === 0, go(0), badgeOf(r));
        this._sideRooms.push({ idx: 0, btn: home });
        list.appendChild(home);
      }
      // Overview has the scenes on Home and in every room, so the sidebar leaves them out.
      if (this._sceneCount() && !(this._baseMode || this._overview())) {
        const sc = this._sideItem('scenes', _hemmaT('nav.scenes', 'Scenes'), this._cat === 'scenes', () => {
          if (!this._pushed) this._closeSide();
          this._openCat('scenes');
        });
        sc.dataset.cat = 'scenes';
        sc.classList.add('side-cat');
        list.appendChild(sc);
      }
      if (rooms.length) {
        const group = this._sideSection(list, 'rooms', _hemmaT('nav.rooms', 'Rooms'));
        rooms.forEach((i) => {
          const el = this._els[i];
          const auto = { 'living room': 'living-room', kitchen: 'kitchen', bedroom: 'bedroom', office: 'desktop' };
          const item = this._sideItem(el.route.glyph || auto[String(el.label.textContent).toLowerCase()]
            || el.route.icon || 'default', el.label.textContent,
            this._activeIdx === i, go(i), badgeOf(el.route));
          this._sideRooms.push({ idx: i, btn: item });
          group.appendChild(item);
        });
      }
      const cats = this._sideCategories();
      if (cats.length) {
        const group = this._sideSection(list, 'categories', _hemmaT('nav.categories', 'Categories'));
        const ICON = { climate: 'fan', lights: 'light', presence: 'person',
          media: 'media', security: 'lock-fill', energy: 'energy' };
        const EN = { climate: 'Climate', lights: 'Lights', presence: 'People', media: 'Media',
          security: 'Security', energy: 'Energy' };
        cats.forEach((k) => {
          const cat = this._sideItem(ICON[k], _hemmaT('filter.' + k, EN[k]), this._cat === k, () => {
            if (!this._pushed) this._closeSide();
            this._openCat(k);
          });
          cat.dataset.cat = k;
          cat.classList.add('side-cat');
          group.appendChild(cat);
        });
      }
    }

    // Landscape folds rooms from the end once the pill reaches the chrome buttons' reserve.
    _fold() {
      if (this._variant !== 'tablet' || !this._scroller) return false;
      const was = this._els.map((el) => el.btn.classList.contains('folded'));
      const land = window.matchMedia('(orientation: landscape)').matches;
      const keep = (i) => i === 0 || i === this._activeIdx || this._isMenuRoute(this._els[i].route);
      this._els.forEach((el, i) => el.btn.classList.toggle('folded', !land && !keep(i)));
      if (land) {
        const sc = this._scroller;
        for (let i = this._els.length - 1; i > 0 && sc.scrollWidth > sc.clientWidth + 1; i--) {
          if (!keep(i)) this._els[i].btn.classList.add('folded');
        }
      }
      // Hidden behind the sidebar the pill is shifted and scaled, so a tab animated there is measured wrong.
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        || this._sideOpen || (this._bar && this._bar.classList.contains('away'));
      if (!this._folded || still) { this._folded = true; requestAnimationFrame(() => this._placeIndicator(true)); return false; }
      let moved = false;
      this._els.forEach((el, i) => {
        const now = el.btn.classList.contains('folded');
        if (now === was[i] || !el.btn.animate) return;
        moved = true;
        const b = el.btn;
        if (now) b.classList.remove('folded');
        const w = b.getBoundingClientRect().width;
        const shut = { maxWidth: '0px', opacity: 0, paddingLeft: '0px', paddingRight: '0px', marginLeft: '0px' };
        const full = { maxWidth: w + 'px', opacity: 1 };
        b.style.overflow = 'hidden';
        const anim = b.animate(now ? [full, shut] : [shut, full], { duration: 240, easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)' });
        const done = () => { b.style.overflow = ''; if (now) b.classList.add('folded'); this._placeIndicator(true); };
        anim.finished.then(done, done);
      });
      if (moved) requestAnimationFrame(() => this._placeIndicator(true));
      return moved;
    }

    // The view moves over and narrows, so right-anchored chrome stays put.
    _viewHost() {
      if (this._vh && this._vh.isConnected) return this._vh;
      let found = null;
      const walk = (root, d) => {
        if (!root || d > 14 || found || !root.querySelector) return;
        const hit = root.querySelector('hui-view-container') || root.querySelector('hui-view');
        if (hit) { found = hit; return; }
        root.querySelectorAll('*').forEach((el) => { if (!found && el.shadowRoot) walk(el.shadowRoot, d + 1); });
      };
      try { walk(this.getRootNode(), 0); } catch (_) {}
      if (!found) { try { walk(document, 0); } catch (_) {} }
      this._vh = found;
      return found;
    }

    // WebKit can stop painting the photo at a 1024px tile edge after a resize; only a blur change forces a redraw.
    _repaintPhotos() {
      const found = [];
      try { walkFind(this._viewHost() || document, 'button-card', found, 0); } catch (_) {}
      found.forEach((el) => {
        if ([].concat((el._config || {}).template || []).indexOf('hemma_room') < 0) return;
        const hc = el.isConnected && el.shadowRoot && el.shadowRoot.querySelector('ha-card');
        if (!hc) return;
        // --hero-img-filter arrives resolved from the host, so it is replaced whole, a hundredth of a pixel softer.
        const f = getComputedStyle(hc, '::after').filter;
        hc.style.setProperty('--hero-img-scale-current', 'calc(var(--hero-img-scale, 1.08) + 0.0002)');
        if (/blur\(/.test(f)) hc.style.setProperty('--hero-img-filter', f.replace(/blur\(([\d.]+)px\)/, (m, v) => 'blur(' + (+v + 0.01) + 'px)'));
        setTimeout(() => {
          hc.style.removeProperty('--hero-img-scale-current');
          hc.style.removeProperty('--hero-img-filter');
        }, 150);
      });
    }

    _pushTargets() {
      const out = [];
      const card = this._heroCardFor(this._activeIdx);
      if (card) card.querySelectorAll('#name, #temperature, [id^="badges"]').forEach((el) => out.push(el));
      const rows = [];
      try { walkFind(this._viewHost() || document, 'hemma-smart-row', rows, 0); } catch (_) {}
      rows.forEach((r) => { if (r.isConnected && r.getBoundingClientRect().width) out.push(r); });
      return out;
    }

    // Overview uses Apple Home's gap (20pt on an iPad, 15pt on a Mac); Focus is mostly photo and needs more.
    _sideGap() {
      if (!this._baseMode) return this._variant === 'tablet' ? 26 : 24;
      return this._variant === 'tablet' ? 20 : 15;
    }

    _pushShift(w) {
      if (!w) return 0;
      if (this._pushEdge == null) {
        const card = this._heroCardFor(this._activeIdx);
        const n = card && card.querySelector('#name');
        if (!n) return w;
        // Measured at rest: read while pushed or mid-entrance, the header pushed the page too little, often not at all.
        const st = n.style, keep = [st.translate, st.transform, st.transition];
        st.transition = 'none'; st.translate = 'none'; st.transform = 'none';
        const r = n.getBoundingClientRect();
        st.translate = keep[0]; st.transform = keep[1];
        void n.offsetWidth;
        st.transition = keep[2];
        if (!r.width) return w;
        this._pushEdge = r.left;
      }
      return Math.max(0, Math.round(w - Math.max(0, this._pushEdge - this._sideGap())));
    }

    _setPush(el, px) {
      el.style.translate = px + 'px 0px';
      if (el.tagName === 'HEMMA-SMART-ROW') el.style.setProperty('--hemma-push-end', px + 'px');
    }

    // translate:none is the only value that leaves fixed descendants alone, so each is unset when idle.
    _setPushVars(P) {
      const vh = this._viewHost();
      if (!vh) return;
      const names = ['--hemma-side-push', '--hemma-side-shift', '--hemma-side-origin'];
      if (!P) { names.forEach((n) => vh.style.removeProperty(n)); return; }
      vh.style.setProperty('--hemma-side-push', P + 'px');
      vh.style.setProperty('--hemma-side-shift', P + 'px 0px');
      vh.style.setProperty('--hemma-side-origin', '0 0');
    }

    // The card's own clock stays hidden behind the nav's, which slides into the sidebar with it.
    _placeClock(T, E) {
      const st = this._status;
      if (!st || this._variant === 'tablet') return;
      const card = this._heroCardFor(this._activeIdx);
      const t = card && card.querySelector('#time');
      const r = t && t.getBoundingClientRect();
      if (r && r.width) { this._clockX = Math.round(r.left - 22); this._clockY = Math.round(r.top); }
      // Overview lines everything up on its own gap, the clock included.
      if (this._baseMode && this._clockX != null) this._clockX = this._sideGap() - 22;
      if (this._clockX == null) return;
      const vh = this._viewHost();
      if (vh) vh.style.setProperty('--hemma-side-time', 'hidden');
      st.style.top = this._clockY + 'px';
      st.style.transition = T ? 'transform ' + T + 'ms ' + E : 'none';
      st.style.transform = this._sideOpen && this._pushed ? 'none' : 'translateX(' + this._clockX + 'px)';
      st.classList.add('on');
      this._fitClock();
    }

    // As the card's clock does, the date gives way rather than run into the first tab.
    _fitClock() {
      const st = this._status;
      if (!st || this._clockX == null || this._variant === 'tablet') return;
      st.classList.remove('tight');
      const edge = window._hemmaNavEdge;
      const span = window._hemmaNavSpan;
      if (this._sideOpen && this._pushed || typeof edge !== 'number' || !st.querySelector('.extra')) return;
      const r = st.getBoundingClientRect();
      const sameRow = !span || (r.bottom > span[0] && r.top < span[1]);
      if (sameRow && 22 + this._clockX + r.width > edge - 24) st.classList.add('tight');
    }

    _pushView(on, instant) {
      const land = this._variant === 'tablet' ? window.matchMedia('(orientation: landscape)').matches : window.innerWidth >= 900;
      const still = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const T = still ? 0 : (on ? 520 : 480);
      const E = 'cubic-bezier(0.32, 0.72, 0, 1)';
      const W = on && land ? Math.round(this._side.getBoundingClientRect().width) : 0;
      const seen = this._pushedSet || (this._pushedSet = new Set());
      clearTimeout(this._pushClear);
      // Every element ever pushed: HA keeps each room's view, so a room left while pushed would come back shifted.
      const els = W ? this._pushTargets() : [...seen];
      const P = this._pushShift(W);
      els.forEach((el) => {
        seen.add(el);
        el.style.transition = T ? 'translate ' + T + 'ms ' + E : 'none';
        if (W && !el.style.translate) { el.style.translate = '0px 0px'; void el.offsetWidth; }
        this._setPush(el, P);
      });
      // Focus's top-right buttons keep the hero's wide gutter; pushed, they come in to the title's gap.
      if (this._variant !== 'tablet') {
        const card = this._heroCardFor(this._activeIdx);
        // The waveform and its players hang off the same right edge, so they move by the same amount.
        const btns = card ? [...card.querySelectorAll('#settings, #assist, #notifications, #battery, #chrome_pill, #now_playing')] : [];
        const ref = card && card.querySelector('#settings, #notifications');
        const d = W && ref ? Math.max(0, Math.round((parseFloat(getComputedStyle(ref).right) || 0) - this._sideGap())) : 0;
        btns.forEach((el) => {
          // button-card stamps its own transition inline; keep it beside ours.
          if (el._hemmaTr == null) el._hemmaTr = el.style.transition || '';
          el.style.transition = [T ? 'translate ' + T + 'ms ' + E : '', el._hemmaTr].filter(Boolean).join(', ');
          el.style.translate = d + 'px 0px';
        });
      }
      // translate:none is the only value that leaves fixed descendants alone, so the var is unset when idle.
      this._setPushVars(W ? P : 0);
      this._pushed = !!W;
      this._placeClock(T, E);
      this._packFor(W || this._catLeft || 0);
      this._syncCatPush(!T);
      setTimeout(() => this._fitNP(), T + 60);
      setTimeout(() => this._sortSoon(true), T + 80);
      // Only when the sidebar moves: a room change pushes instantly, and re-rastering the blurred photo then blanks it mid-slide.
      if (this._variant === 'tablet' && T) setTimeout(() => this._repaintPhotos(), T + 80);
      if (!W) {
        const clear = () => {
          if (this._pushed) return;
          seen.forEach((el) => { el.style.translate = ''; el.style.transition = ''; el.style.removeProperty('--hemma-push-end'); });
          this._pushEdge = null;
          seen.clear();
        };
        if (!T) clear(); else this._pushClear = setTimeout(clear, T);
      }
      this._syncBack();
    }

    // A tablet left on "Same as desktop" follows the desktop's layout.
    _overview() {
      const V = this._statusVars();
      const t = this._variant === 'tablet' ? V.home_layout_tablet : '';
      if (t === 'focus') return false;
      if (t === 'overview') return true;
      return V.home_layout === 'overview';
    }

    // Desktop Overview keeps the sidebar open, as Apple Home's Mac app does; a tablet can still switch.
    _sideLocked() {
      return !!this._baseMode && this._variant !== 'tablet' && window.innerWidth >= 900;
    }

    _syncOverview() {
      const on = this._overview();
      window._hemmaOverview = on;
      try {
        const seg = String(location.pathname.split('/')[1] || '');
        if (on) localStorage.setItem('hemma_ov_boot', seg); else if (localStorage.getItem('hemma_ov_boot') === seg) localStorage.removeItem('hemma_ov_boot');
      } catch (_) {}
      if (window._hemmaOvBoot) {
        window._hemmaOvBoot = false;
        // The view host takes these over; --hemma-fx-vis is let go once the page is up (_baseSwap's first fill).
        ['--hemma-page-chrome', '--hemma-anim-name', '--hero-img-blur', '--hemma-hero-anim-dur', '--hemma-hero-anim-delay'].forEach((k) => document.documentElement.style.removeProperty(k));
        if (!on) document.documentElement.style.removeProperty('--hemma-fx-vis');
        this._bootOpen = true;
      }
      const vh = this._viewHost();
      this.classList.toggle('side-locked', on && this._variant !== 'tablet' && window.innerWidth >= 900);
      this.classList.toggle('compact', on && this._variant !== 'tablet');
      if (on && !this._baseMode) {
        // Overview lays far more over the photo, so it blurs it a little more than Focus (4px).
        if (vh) {
          vh.style.setProperty('--hemma-page-chrome', 'hidden'); vh.style.setProperty('--hemma-anim-name', 'none'); vh.style.setProperty('--hero-img-blur', '7px');
          // Overview changes its wallpaper with the tap (_photoSwap); the photo's own drift is Focus's.
          vh.style.setProperty('--hemma-hero-anim-dur', '0s'); vh.style.setProperty('--hemma-hero-anim-delay', '0s');
        }
        this._openBase(true);
        if (this._sideOpen) this._fillSide();
        this._syncSceneTab();
      }
      if (this._sideLocked() && !this._sideOpen && this._side) this._openSide(this._bootOpen || !this._everSynced);
      this._everSynced = true;
      this._bootOpen = false;
      if (!on && this._baseMode) {
        this._baseMode = false;
        if (vh) ['--hemma-page-chrome', '--hemma-anim-name', '--hero-img-blur', '--hemma-hero-anim-dur', '--hemma-hero-anim-delay'].forEach((k) => vh.style.removeProperty(k));
        // A room card drawn by the save that switched to Focus still read the Overview boot mark and hid its chrome.
        const rooms = [];
        try { walkFind(vh || document, 'button-card', rooms, 0); } catch (_) {}
        rooms.forEach((el) => {
          if ([].concat((el._config || {}).template || []).indexOf('hemma_room') < 0) return;
          const card = el.shadowRoot && el.shadowRoot.querySelector('ha-card');
          if (card && card.style.getPropertyValue('--hemma-boot-ov') === 'hidden') card.style.setProperty('--hemma-boot-ov', 'visible');
        });
        this._closeCat(true);
        this._fxRelease();
        this._shelfMap = null;
        if (this._sideOpen) this._fillSide();
        this._syncSceneTab();
      }
    }

    // Overview has the scenes on Home and in every room, so the navbar's Scenes tab goes with it.
    _syncSceneTab() {
      (this._els || []).forEach((el) => { if (el.route && el.route.menu === 'scenes') el.btn.style.display = this._baseMode ? 'none' : ''; });
      this._placeIndicator(true);
    }

    _openBase(instant) {
      this._baseMode = true;
      if (this._catPage) { this._syncBack(); this._syncChrome(); return; }
      this._openCat('home', this._baseRoom(), false, instant ? 'still' : 'fade');
    }

    _toBase() {
      if (!this._catPage) return;
      this._cat = 'home';
      this._catRoom = this._baseRoom();
      this._catLift = false;
      if (window._hemmaFilter) window._hemmaFilter.set('all');
      this._markSide();
      this._syncBack();
      this._fillCat('home');
    }

    _baseRoom() {
      const el = this._activeIdx > 0 && this._els[this._activeIdx];
      return el ? String(el.route.label || el.label.textContent || '').trim() || null : null;
    }

    _baseTitle() {
      this._titleStale = false;
      if (this._catRoom) return this._catRoom;
      const card = this._heroCardFor(0);
      // The greeting comes from its own function: the card's name reads its room name until its template has run.
      const host = card && card.getRootNode && card.getRootNode().host;
      const cfg = (host && host._config) || {};
      // Remembered: going Home, the title is set before Home's card has drawn.
      if (card) this._greetVars = String(cfg.name || '').indexOf('hemmaGreeting') >= 0 ? (cfg.variables || {}) : null;
      const vars = this._greetVars;
      if (vars && window.hemmaGreeting && this._hass) {
        const g = String(window.hemmaGreeting(this._hass, this._hass.states, vars)).replace(/&lt;/g, '<').replace(/&amp;/g, '&');
        if (g) return g;
      }
      const n = card && card.querySelector('#name');
      const t = n && n.textContent.trim();
      this._titleStale = !t;
      return t || _hemmaT('filter.all', 'Home');
    }

    // The page covers the room card, so it carries the card's top-right buttons and battery, in the card's place.
    async _syncChrome() {
      const page = this._catPage;
      if (!page) return;
      const want = !!this._baseMode;
      if (!want || page.querySelector('.cat-chrome')) {
        if (!want) page.querySelectorAll('.cat-chrome, .cat-batt').forEach((n) => n.remove());
        return;
      }
      const card = this._heroCardFor(this._activeIdx);
      const helpers = await this._catHelpers();
      if (!helpers || this._catPage !== page || page.querySelector('.cat-chrome')) return;
      const V = this._statusVars();
      const tablet = this._variant === 'tablet';
      const assist = V.show_assist !== false && ((this._hass && this._hass.config && this._hass.config.components) || []).includes('conversation');
      const box = document.createElement('div');
      box.className = 'cat-chrome' + (tablet ? ' cap' : '');
      const add = (template, variables) => {
        let el = null;
        try { el = helpers.createCardElement({ type: 'custom:button-card', template, variables }); } catch (_) {}
        if (el) { box.appendChild(el); this._catChrome.push(el); }
        return el;
      };
      this._catChrome = [];
      if (V.show_notifications !== false) add('hemma_notifications_button', { shown: true });
      // A tablet keeps Assist in the dots menu, as its room card does.
      if (assist && !tablet) add('hemma_assist_button', { shown: true });
      if (box.childElementCount && tablet) box.appendChild(Object.assign(document.createElement('i'), { className: 'sep' }));
      add('hemma_settings_button', { shown: true, assist_available: assist, hemma_ui_managed: !!V.hemma_ui_managed });
      if (!this._catChrome.length) return;
      if (tablet) ['cap-rim', 'cap-rim-in'].forEach((c) => box.appendChild(Object.assign(document.createElement('i'), { className: c })));
      const ref = card && [...card.querySelectorAll(tablet ? '#chrome_pill' : '#settings, #assist, #notifications')]
        .map((e) => e.getBoundingClientRect()).filter((r) => r.width).sort((a, b) => b.right - a.right)[0];
      if (ref && tablet) box.style.right = Math.max(0, Math.round(window.innerWidth - ref.right)) + 'px';
      page.appendChild(box);
      if (!tablet) page.style.setProperty('--cat-chrome-w', (box.childElementCount * 46 - 12) + 'px');
      if (tablet) {
        const b = document.createElement('div');
        b.className = 'cat-batt';
        page.appendChild(b);
        this._catBattId = V.status_battery || '';
        this._syncBattery();
      }
      this._catHass();
    }

    _syncBattery() {
      const b = this._catPage && this._catPage.querySelector('.cat-batt');
      if (!b || !this._hass) return;
      const html = window.hemmaBatterySvg ? window.hemmaBatterySvg(this._hass.states, this._catBattId) : '';
      if (b._html !== html) { b._html = html; b.innerHTML = html; }
    }

    // The greeting is Home's large title only; scrolled, the bar names the page as the tab does.
    _miniTitle(k, title) {
      if (k !== 'home' || this._catRoom) return title;
      const el = this._els && this._els[0];
      return String((el && (el.route.label || el.label.textContent)) || '').trim() || _hemmaT('nav.home', 'Home');
    }

    _syncBaseTitle() {
      const page = this._catPage;
      if (!page || this._cat !== 'home') return;
      const t = this._baseTitle();
      const h1 = page.querySelector('.cat-in h1');
      if (h1 && h1.textContent !== t) h1.textContent = t;
      const m = this._miniTitle('home', t);
      if (this._catEls && this._catEls[2].textContent !== m) this._catEls[2].textContent = m;
    }

    // The phone's corner weather, from the room card's settings.
    _wxCard(helpers) {
      const V = this._statusVars();
      const wx = (w) => (window.hemmaWx ? window.hemmaWx(V, w) : (w === 'entity' ? V.weather_entity : V.weather_temp_sensor)) || '';
      const entity = wx('entity');
      if (!entity && V.hero_line !== 'date') return null;
      try {
        return helpers.createCardElement({ type: 'custom:button-card', template: 'hemma_weather', entity,
          variables: { hero_mode: false, weather_temp_sensor: wx('temp') } });
      } catch (_) { return null; }
    }

    _syncBack() {
      const b = this._sideBack;
      if (!b) return;
      // Only a category page has somewhere to go back to; rooms are reached from the sidebar and tabs.
      const show = !!(this._cat && this._cat !== 'home' && this._catPage);
      if (show) {
        const edge = this._sideOpen && this._pushed ? this._side.getBoundingClientRect().width : (this._catLeft || 0);
        const g = parseFloat(this._catPage.style.getPropertyValue('--cat-gutter')) || 20;
        b.style.left = Math.round(edge + g) + 'px';
      }
      b.classList.toggle('on', show);
    }

    // Matched by name: mid room change HA keeps the previous view, so the first visible card is often the one just left.
    _heroCardFor(idx) {
      const el0 = this._els[idx];
      if (!el0) return null;
      const label = String(el0.route.label || '').trim().toLowerCase();
      // The walk below covers every shadow root; a card found before is reused while it is still in place and drawn.
      const hit = (this._heroCache || {})[idx];
      if (hit && hit.isConnected && hit.getRootNode().host && hit.getRootNode().host.isConnected && hit.getBoundingClientRect().width) return hit;
      const found = [];
      try { walkFind(this._viewHost() || document, 'button-card', found, 0); } catch (_) {}
      for (const el of found) {
        const c = el._config || {};
        if ([].concat(c.template || []).indexOf('hemma_room') < 0) continue;
        const n = String(c.name || '');
        if (n.trim().toLowerCase() !== label && !(idx === 0 && n.indexOf('hemmaGreeting') >= 0)) continue;
        const card = el.isConnected && el.shadowRoot && el.shadowRoot.querySelector('ha-card');
        if (card && card.getBoundingClientRect().width) { (this._heroCache = this._heroCache || {})[idx] = card; return card; }
      }
      return null;
    }

    // A room change brings a new card: push it the frame it appears, without animating.
    _watchPush() {
      cancelAnimationFrame(this._pushRaf);
      const start = performance.now();
      const tick = () => {
        if (!this._sideOpen || !this._pushed) return;
        if (this._heroCardFor(this._activeIdx)) { this._pushView(true, true); return; }
        if (performance.now() - start < 4000) this._pushRaf = requestAnimationFrame(tick);
      };
      tick();
    }

    _markSide() {
      (this._sideRooms || []).forEach((r) => r.btn.classList.toggle('on', (!this._cat || this._cat === 'home') && r.idx === this._activeIdx));
      if (this._sideList) this._sideList.querySelectorAll('.side-cat').forEach((b) => b.classList.toggle('on', b.dataset.cat === this._cat));
    }

    _syncSideMotion() {
      const hass = this._hass;
      (this._sideRooms || []).forEach((r) => {
        const cfg = this._els[r.idx] && this._els[r.idx].route.badge;
        if (!r.btn._motion || !cfg) return;
        r.btn._motion.classList.toggle('on', !!(hass && resolve(cfg.show, hass, false)));
      });
    }

    _toggleSide() { if (this._sideOpen) this._closeSide(); else this._openSide(); }

    _sideBootKey() { return 'hemma_side_boot_' + this._variant; }

    _sideRoom() {
      return this._variant === 'tablet' ? window.matchMedia('(orientation: landscape)').matches : window.innerWidth >= 900;
    }

    _sideWanted() {
      return this._sideRoom() && this._statusVars().sidebar_open === true;
    }

    _statusVars() {
      // A save rebuilds the room card, so a cached answer from the old one would keep the old layout.
      const live = this._sRoom && this._sRoom.isConnected && (this._sRoom._config || {}).variables === this._sVars;
      if (this._sVars && live && this._sVarsAt > Date.now() - 5000) return this._sVars;
      const found = [];
      try { walkFind(this._viewHost() || document, 'button-card', found, 0); } catch (_) {}
      const room = found.find((el) => [].concat((el._config || {}).template || []).indexOf('hemma_room') >= 0);
      if (room) { this._sRoom = room; this._sVars = (room._config && room._config.variables) || {}; this._sVarsAt = Date.now(); }
      return this._sVars || {};
    }

    _renderStatus() {
      const out = this._status, hass = this._hass;
      if (!out || !hass) return;
      const V = this._statusVars();
      const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      let html = '';
      const tid = V.time_entity || (V.hemma_ui_managed ? '' : 'sensor.time');
      const ts = tid && hass.states[tid];
      if (ts) {
        let t = String(ts.state || '');
        if (t.indexOf(',') >= 0) t = (t.split(',')[1] || '').trim() || t;
        const m = t.match(/^(\d{1,2}):(\d{2})$/);
        if (m && V.use_12h !== false) {
          const h = parseInt(m[1], 10);
          t = ((h % 12) || 12) + ':' + m[2] + ' ' + (h >= 12 ? _hemmaT('time.pm', 'PM') : _hemmaT('time.am', 'AM'));
        }
        const suffix = String(V.time_suffix || '').trim();
        if (suffix) t += ' ' + suffix;
        if (String(hass.language || 'en').indexOf('en') === 0) t = t.toUpperCase();
        html = esc(t);
        const dateUp = V.hero_line === 'date';
        if (!dateUp && V.show_date === true && V.date_on !== (this._variant === 'tablet' ? 'desktop' : 'tablet') && window.hemmaDate) {
          const d = window.hemmaDate(hass, V.date_style === 'long' ? 'long' : 'short');
          if (d) html += '<span class="extra">' + esc(d) + '</span>';
        }
        if (dateUp && V.weather_entity) {
          const w = hass.states[V.weather_entity];
          const tsn = V.weather_temp_sensor && hass.states[V.weather_temp_sensor];
          let deg = null;
          if (tsn && tsn.state !== '' && Number.isFinite(Number(tsn.state))) deg = Math.round(Number(tsn.state));
          if (deg === null && w && Number.isFinite(Number((w.attributes || {}).temperature))) deg = Math.round(Number(w.attributes.temperature));
          if (deg !== null) {
            let unit = '';
            if (V.show_temp_unit === true) {
              unit = String((tsn && tsn.attributes.unit_of_measurement) || (w && w.attributes.temperature_unit)
                || (hass.config && hass.config.unit_system && hass.config.unit_system.temperature) || '').replace('°', '').trim();
            }
            html += '<span class="extra">' + deg + '°' + (unit ? '&nbsp;' + esc(unit) : '') + '</span>';
          }
        }
      }
      if (html !== this._statusHtml) { this._statusHtml = html; out.innerHTML = html; this._fitClock(); }
      if (this._clockX == null && this._variant !== 'tablet') this._placeClock(0);
    }

    _syncSideStatus() { this._sVars = null; this._renderStatus(); this._syncBaseTitle(); }

    // Only the glass's clip-path animates: an animated opacity or transform on an ancestor drops backdrop-filter.
    _morph(open) {
      const side = this._side, bar = this._bar, glass = this._sideGlass;
      const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!glass || !glass.animate || still) return null;
      const gr = glass.getBoundingClientRect();
      const sr = side.getBoundingClientRect();
      const tab = this._variant === 'tablet';
      const glyph = !tab && this._toggle && this._toggle.querySelector('svg, .gl');
      const gb = (tab ? bar : (glyph || this._toggle || bar)).getBoundingClientRect();
      // Desktop lands on a small plate around the icon, under the raised tab row, as the tablet lands under its pill.
      const pr = tab ? gb : { left: gb.left - 8, top: gb.top - 8, width: gb.width + 16, height: gb.height + 16 };
      const r0 = tab ? pr.height / 2 : 10;
      const VW = gr.width, VH = gr.height, SW = sr.width;
      const spring = (t) => { const x = Math.max(0, Math.min(1, t)); return 1 - (1 + 8 * x) * Math.exp(-8 * x); };
      const norm = spring(1);
      const ease = (t) => spring(t) / norm;
      const seg = (t, a, b) => ease((t - a) / (b - a));
      const lerp = (a, b, k) => a + (b - a) * k;
      const rgba = (c) => (String(c).match(/[\d.]+/g) || [0, 0, 0, 1]).map(Number).concat([1]).slice(0, 4);
      const c0 = rgba(getComputedStyle(this).getPropertyValue('--hemma-pill-fill').trim() || 'rgba(255,255,255,0.10)');
      const c1 = rgba(getComputedStyle(glass).backgroundColor || 'rgba(28,28,32,0.74)');
      const N = 28, frames = [], barFrames = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        // k = how far from pill toward panel, per axis. Closing runs the curves backwards in time.
        const kx = open ? seg(t, 0, 0.78) : 1 - seg(t, 0.22, 1);
        const ky = open ? seg(t, 0.28, 1) : 1 - seg(t, 0, 0.72);
        const x = lerp(pr.left, 0, kx), w = lerp(pr.width, SW, kx);
        const y = lerp(pr.top, 0, ky), h = lerp(pr.height, VH, ky);
        const r = lerp(r0, 0, Math.max(kx, ky));
        const c = c0.map((v, j) => lerp(v, c1[j], ky));
        // Crossfade with the pill's own glass at the pill end, so its rim never pops in.
        const hand = open ? Math.min(1, t / 0.2) : Math.min(1, (1 - t) / (tab ? 0.25 : 0.35));
        frames.push({
          opacity: hand,
          clipPath: 'inset(' + y + 'px ' + (VW - x - w) + 'px ' + (VH - y - h) + 'px ' + x + 'px round ' + r + 'px)',
          backgroundColor: 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + c[3].toFixed(3) + ')',
        });
        // The labels ride the shape, blurring out as it grows and back in as it settles, as Apple's do.
        const lv = open ? Math.max(0, 1 - t / 0.5) : Math.max(0, (t - 0.5) / 0.5);
        barFrames.push({
          transform: 'translateX(' + ((x - pr.left) + (w - pr.width) / 2) + 'px)',
          opacity: lv,
          filter: 'blur(' + ((1 - lv) * 10).toFixed(2) + 'px)',
        });
      }
      const T = 480;
      const a = glass.animate(frames, { duration: T, easing: 'linear' });
      if (!tab) {
        bar.classList.add('morphing');
        const off = () => bar.classList.remove('morphing');
        a.finished.then(off, off);
      }
      if (tab) {
        bar.classList.add('morphing');
        bar.querySelectorAll('.glass, .rim, .rim-in').forEach((g) => g.animate(open
          ? [{ opacity: 1 }, { opacity: 0, offset: 0.2 }, { opacity: 0 }]
          : [{ opacity: 0 }, { opacity: 0, offset: 0.75 }, { opacity: 1 }], { duration: T, easing: 'linear' }));
        const ba = bar.animate(barFrames, { duration: T, easing: 'linear' });
        const off = () => bar.classList.remove('morphing');
        ba.finished.then(off, off);
      }
      [this._sideList, this._sideHead].filter(Boolean).forEach((n) => n.animate(open
        ? [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }]
        : [{ opacity: 1 }, { opacity: 0, offset: 0.22 }, { opacity: 0 }], { duration: T, easing: 'ease-out' }));
      return a;
    }

    _openSide(still) {
      const side = this._side;
      if (!side || this._sideOpen) return;
      this._closeMenu();
      this._fillSide();
      this._sideOpen = true;
      side.classList.add('open');
      this._syncSideStatus();
      this._statusTick = setInterval(() => this._syncSideStatus(), 15000);
      // On load it is simply there, as Apple Home's is; the morph is for a tap.
      if (!still) this._morph(true);
      this._pushView(true, still);
      if (still) {
        this._bar.style.transition = 'none';
        requestAnimationFrame(() => requestAnimationFrame(() => this._bar && this._bar.style.removeProperty('transition')));
      }
      this._bar.classList.add('away');
      document.addEventListener('pointerdown', this._onAway, true);
      document.addEventListener('keydown', this._onKey, true);
      document.addEventListener('touchstart', this._edgeTouch, { capture: true, passive: false });
      document.addEventListener('pointerdown', this._edgeDown, true);
    }

    _closeSide() {
      const side = this._side;
      if (!side || !this._sideOpen || this._sideLocked()) return Promise.resolve();
      this._sideOpen = false;
      if (!this._baseMode && this._cat) this._closeCat();
      clearInterval(this._statusTick);
      document.removeEventListener('pointerdown', this._onAway, true);
      document.removeEventListener('keydown', this._onKey, true);
      document.removeEventListener('touchstart', this._edgeTouch, true);
      document.removeEventListener('pointerdown', this._edgeDown, true);
      this._bar.classList.remove('away');
      const done = () => {
        if (this._sideOpen) return;
        side.classList.remove('open');
        this._placeIndicator(true);
      };
      this._pushView(false);
      const a = this._morph(false);
      if (!a) { done(); return Promise.resolve(); }
      return a.finished.then(done, done);
    }

    _isMenuRoute(route) {
      if (route.menu) return true;
      const ta = route.tap_action;
      return !!(ta && ta.action === 'open-popup');
    }

    _activate(route, btn, now) {
      if (this._isMenuRoute(route)) {
        if (this._menu && this._menu._owner === btn) { this._closeMenu(); return; }
        this._closeMenu();
        this._openMenu(route, btn);
        return;
      }
      const ta = route.tap_action;
      const to = route.url || (ta && ta.action === 'navigate' && ta.navigation_path) || null;
      if (!to) return;
      if (this._cat && !this._baseMode) {
        if (this._els.findIndex((el) => el.btn === btn) !== this._activeIdx) this._fxNoSlideAt = Date.now();
        this._closeCat();
      }
      const idx = this._els.findIndex((el) => el.btn === btn);
      // From a category page the room comes forward in depth, as closing the page does; only room and Home slide.
      if (this._baseMode && idx >= 0 && idx === this._activeIdx && this._cat && this._cat !== 'home') { this._closeCat(); return; }
      if (this._baseMode && idx >= 0 && idx !== this._activeIdx && this._photoFor(idx)) { this._baseGo(idx, to); return; }
      if (this._variant !== 'tablet') { navigate(to); return; }
      let folding = false;
      if (idx >= 0 && idx !== this._activeIdx) {
        this._els.forEach((el, i) => el.btn.classList.toggle('active', i === idx));
        this._activeIdx = idx;
        // Fold before navigating: HA's view rebuild would otherwise stall the width animation mid-way.
        folding = this._fold();
        this._placeIndicator();
      }
      if (folding && !now) setTimeout(() => navigate(to), 250);
      else requestAnimationFrame(() => requestAnimationFrame(() => navigate(to)));
    }

    // The phone capsule's tap: light blooms from the thumb, rises fast and leaves slowly.
    _flash(ev, f = this._flashEl, host = this._bar, size = 90) {
      if (!f || !host || !f.animate) return;
      const r = host.getBoundingClientRect();
      const x = r.width ? Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100)) : 50;
      f.style.background = 'radial-gradient(' + size + 'px circle at ' + x.toFixed(1) + '% 50%,'
        + ' rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0) 100%)';
      f.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25, easing: 'cubic-bezier(0.4,0,0.6,1)' }, { opacity: 0 }],
        { duration: 560, easing: 'ease-out' });
    }

    _bloom(btn) {
      const f = document.createElement('span');
      f.className = 'flash';
      btn.appendChild(f);
      btn.addEventListener('pointerdown', (ev) => this._flash(ev, f, btn, 58));
    }

    _syncRoute() {
      if (!this._built) return;
      const path = normalize(location.pathname);
      this._path = path;

      let bestIdx = -1;
      let bestLen = -1;
      this._els.forEach((el, i) => {
        const u = el.route.url ? normalize(el.route.url) : null;
        if (!u) return;
        if (path === u || path.indexOf(u + '/') === 0) {
          if (u.length > bestLen) { bestLen = u.length; bestIdx = i; }
        }
      });

      this._els.forEach((el, i) => {
        el.btn.classList.toggle('active', i === bestIdx);
      });

      this._activeIdx = bestIdx;
      const prev = this._shownIdx;
      this._shownIdx = bestIdx;
      if (prev != null && prev >= 0 && bestIdx >= 0 && prev !== bestIdx && (prev === 0) !== (bestIdx === 0)
        && !this._fxAwait && !(Date.now() - (this._fxNoSlideAt || 0) < 1500)) this._slideDir = bestIdx === 0 ? -1 : 1;
      if (this._fxAwait && prev !== bestIdx) this._fxPlay();
      if (this._catDefer && prev !== bestIdx) this._dropDeferredWhenPainted();
      this._fold();
      this._slideIn();
      if (this._baseMode && prev !== bestIdx) this._baseSwap(bestIdx);
      setTimeout(() => this._fitNP(), 700);
      if (this._sideOpen) {
        this._markSide();
        if (this._pushed) this._watchPush();
        this._syncBack();
        setTimeout(() => { if (this._sideOpen) this._syncSideStatus(); }, 400);
      }
      this._syncHeaderOffset();
      this._placeIndicator();
    }

    _syncHeaderOffset() {
      let view = null;
      // The bar lives in ha-app-layout, inside hui-root's shadow root.
      try {
        const near = this.getRootNode();
        if (near && near.querySelector) {
          view = near.querySelector('hui-view, hui-view-container');
        }
      } catch (_) {}

      const walk = (root, depth) => {
        if (!root || depth > 12 || view || !root.querySelectorAll) return;
        const hit = root.querySelector('hui-view, hui-view-container');
        if (hit) { view = hit; return; }
        root.querySelectorAll('*').forEach((el) => {
          if (!view && el.shadowRoot) walk(el.shadowRoot, depth + 1);
        });
      };
      if (!view) { try { walk(document, 0); } catch (_) {} }

      let px = 0;
      if (view) {
        const t = view.getBoundingClientRect().top;
        if (isFinite(t) && t > 0 && t < 240) px = Math.round(t);
      }
      if (px !== this._headerPx) {
        this._headerPx = px;
        this.style.setProperty('--hemma-nav-header-offset', px + 'px');
        this._placeIndicator(true);
      }
    }

    _labelBox(idx) {
      const el = this._els[idx];
      const sc = this._scroller;
      if (!el || !sc) return null;
      const sRect = sc.getBoundingClientRect();
      const lRect = el.label.getBoundingClientRect();
      if (!lRect.width || !sRect.width) return null;
      return { left: lRect.left - sRect.left + sc.scrollLeft, width: lRect.width };
    }

    // The clock hides its date rather than run into the first tab.
    _publishEdge() {
      let left = Infinity, top = Infinity, bottom = -Infinity;
      this._els.forEach((el) => {
        const r = el && el.btn && el.btn.isConnected ? el.btn.getBoundingClientRect() : null;
        if (r && r.width > 0) {
          left = Math.min(left, r.left);
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
        }
      });
      if (!isFinite(left)) return;
      window._hemmaNavSpan = [top, bottom];
      if (window._hemmaNavEdge === left) return;
      window._hemmaNavEdge = left;
      window.dispatchEvent(new CustomEvent('hemma-nav-edge'));
      this._fitClock();
    }

    _placeIndicator(instant) {
      this._publishEdge();
      const ind  = this._indicator;
      const fill = this._fill;
      if (!ind || !fill || !this._scroller) return;

      if (this._activeIdx < 0 || !this._els[this._activeIdx]) {
        ind.classList.remove('on');
        return;
      }

      const to = this._labelBox(this._activeIdx);
      if (!to) return;

      const from = this._from;
      if (!instant && from && from.left === to.left && from.width === to.width
          && ind.classList.contains('on')) return;

      ind.classList.remove('to-right', 'to-left');

      const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // No travel on any surface. The underline has nothing to move alongside:
      // the tap replaces the whole view, so a journey competing with that
      // rebuild lands late however it is eased. It leaves one name and arrives
      // under the other instead, which is what a sidebar selection does.
      if (!instant && from && ind.classList.contains('on') && ind.animate && !still) {
        const ghost = ind.cloneNode(true);
        ghost.classList.add('instant');
        ghost.classList.remove('on');
        ghost.style.opacity = '1';
        this._scroller.insertBefore(ghost, ind);
        const gone = () => ghost.remove();
        ghost.animate([{ opacity: 1 }, { opacity: 0 }],
          { duration: 110, easing: 'ease-out', fill: 'forwards' }).finished.then(gone, gone);
        ind.classList.add('instant');
        ind.style.width = to.width + 'px';
        ind.style.transform = 'translateX(' + to.left + 'px)';
        fill.style.transform = 'scaleX(1)';
        void ind.offsetWidth;
        ind.classList.remove('instant');
        // A whisper of width on the way in, so it reads as arriving rather than
        // being switched on. Anchored center: from the left edge it looks like
        // a short slide, which is the thing being removed.
        ind.animate(
          [{ opacity: 0, transform: ind.style.transform + ' scaleX(0.88)' },
           { opacity: 1, transform: ind.style.transform + ' scaleX(1)' }],
          { duration: 150, easing: 'cubic-bezier(0.2,0.8,0.2,1)' });
        this._from = to;
        return;
      }

      ind.style.width = to.width + 'px';

      if (instant || !from) {
        ind.classList.add('instant');
        ind.style.transform  = 'translateX(' + to.left + 'px)';
        fill.style.transform = 'scaleX(1)';
        ind.classList.add('on');
        void ind.offsetWidth;
        ind.classList.remove('instant');
      } else {
        ind.classList.add('instant');
        ind.style.transform  = 'translateX(' + from.left + 'px)';
        fill.style.transform = 'scaleX(' + (from.width / to.width) + ')';
        ind.classList.add('on');
        void ind.offsetWidth;
        ind.classList.remove('instant');

        if (to.left !== from.left) {
          ind.classList.add(to.left > from.left ? 'to-right' : 'to-left');
        }
        ind.style.transform  = 'translateX(' + to.left + 'px)';
        fill.style.transform = 'scaleX(1)';
      }

      this._from = to;
    }

    _syncBadges() {
      const hass = this._hass;
      this._els.forEach((el) => {
        const cfg = el.route.badge;
        let show = false;
        if (cfg && hass) show = !!resolve(cfg.show, hass, false);
        el.badge.style.display = show ? 'block' : 'none';
        if (show && cfg.color) el.badge.style.background = cfg.color;
      });
    }

    // ── Scenes menu ──────────────────────────────────────────────────────────
    _menuItems(route) {
      const hass = this._hass;
      const SC = window._hemmaSC;

      if (route.menu === 'scenes' || !route.popup) {
        if (SC && SC.list) {
          const ids = SC.list(hass.states, hass, this._config || {});
          if (SC.noteColors) SC.noteColors((this._config || {}).scene_colors);
          if (SC.prefetch) { try { SC.prefetch(ids, hass.states); } catch (_) {} }
          return ids.map((id) => ({
            id: id,
            label: (hass.states[id].attributes || {}).friendly_name
              || id.replace('scene.', '').replace(/_/g, ' '),
            icon: (hass.states[id].attributes || {}).icon || 'mdi:layers',
            active: SC.isActive ? !!SC.isActive(id, hass.states) : false,
            run: () => SC.apply(id, this._transition()),
          }));
        }
        return this._sceneFallback();
      }

      const items = evalTpl(route.popup, hass, []) || [];
      return items.map((it) => ({
        id: it.entity || null,
        label: it.label || '',
        icon: it.icon || 'mdi:layers',
        active: false,
        run: () => {
          const ta = it.tap_action || {};
          if (ta.action === 'call-service' || ta.action === 'perform-action') {
            const svc = String(ta.service || ta.perform_action || '');
            const dot = svc.indexOf('.');
            if (dot > 0) {
              hass.callService(svc.slice(0, dot), svc.slice(dot + 1),
                ta.service_data || ta.data || {});
            }
          } else if (ta.action === 'navigate' && ta.navigation_path) {
            navigate(ta.navigation_path);
          }
        },
      }));
    }

    _transition() {
      const t = (this._config || {}).scene_transition;
      return t === undefined ? 3 : t;
    }

    _sceneFallback() {
      const hass = this._hass;
      const states = hass.states || {};
      const reg = hass.entities || {};
      const getReg = (id) => reg[id] || (reg.get && reg.get(id)) || null;
      return Object.keys(states)
        .filter((id) => id.indexOf('scene.') === 0 && id.indexOf('scene.hemma') !== 0)
        .filter((id) => {
          const e = getReg(id);
          return e && !(e.hidden || e.hidden_by || e.disabled || e.disabled_by);
        })
        .map((id) => ({
          id: id,
          label: (states[id].attributes || {}).friendly_name
            || id.replace('scene.', '').replace(/_/g, ' '),
          icon: (states[id].attributes || {}).icon || 'mdi:layers',
          active: false,
          run: () => hass.callService('scene', 'turn_on',
            { entity_id: id, transition: this._transition() }),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    _openMenu(route, btn) {
      const hass = this._hass;
      if (!hass) return;

      const menu = document.createElement('div');
      menu.className = 'hemma-nav-menu';
      menu._owner = btn;
      Object.assign(menu.style, {
        position: 'fixed', zIndex: '99999', boxSizing: 'border-box',
        padding: '6px',
        maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', overflowX: 'hidden',
        width: 'max-content', maxWidth: 'calc(100vw - 24px)',
        display: 'flex', flexDirection: 'column', alignItems: 'stretch', rowGap: '2px',
        scrollbarWidth: 'none',
      });
      window.hemmaMenuGlass.apply(menu);

      const build = () => {
        const items = this._menuItems(route);
        const sig = items.map((i) => [i.id, i.label, i.icon, i.active].join('\u0001')).join('\u0002');
        if (sig === menu._sig) return;
        menu._sig = sig;
        menu.textContent = '';
        items.forEach((it) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.setAttribute('role', 'menuitem');
          if (it.active) row.className = 'on';
          Object.assign(row.style, {
            display: 'flex', alignItems: 'center', gap: '14px', width: '100%',
            padding: '9px 13px',
            borderRadius: 'calc(var(--hemma-menu-radius, 28px) - 6px)',
            border: '0', textAlign: 'left',
            font: 'inherit', fontSize: '14px', fontWeight: '500', letterSpacing: '-0.01em', lineHeight: '1.35',
            color: 'var(--hemma-menu-ink, #fff)',
            cursor: 'default', outline: 'none', boxSizing: 'border-box',
          });

          const ico = document.createElement('ha-icon');
          ico.setAttribute('icon', it.icon);
          Object.assign(ico.style, {
            width: '21px', height: '21px', color: 'currentColor', flex: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          });
          // Object.assign cannot set a custom property; it fails silently.
          ico.style.setProperty('--mdc-icon-size', '21px');

          const txt = document.createElement('span');
          txt.textContent = it.label;
          Object.assign(txt.style, {
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: '100%',
          });

          row.appendChild(ico);
          row.appendChild(txt);

          row.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            try { it.run(); } catch (_) {}
            close();
          };
          menu.appendChild(row);
        });
      };

      ensureMenuCss();
      build();
      menu._refresh = build;
      document.body.appendChild(menu);

      const place = () => {
        const r = btn.getBoundingClientRect();
        const w = menu.offsetWidth;
        const cx = r.left + r.width / 2;
        menu.style.top = window.hemmaMenuGlass.dropTop(r, 10) + 'px';
        menu.style.left = Math.round(
          Math.max(12, Math.min(cx - w / 2, window.innerWidth - w - 12))
        ) + 'px';
      };
      place();

      window.hemmaMenuGlass.enter(menu);

      btn.setAttribute('data-popup-open', '');

      const onKey = (e) => { if (e.key === 'Escape') close(); };
      const onAway = (e) => {
        const t = e.composedPath ? e.composedPath()[0] : e.target;
        if (!menu.contains(t) && t !== btn && !btn.contains(t)) close();
      };
      const close = () => {
        if (menu._closing) return;
        menu._closing = true;
        btn.removeAttribute('data-popup-open');
        window.removeEventListener('keydown', onKey, true);
        document.removeEventListener('pointerdown', onAway, true);
        window.removeEventListener('resize', close);
        window.removeEventListener('location-changed', close, true);
        window.hemmaMenuGlass.exit(menu, () => {
          if (menu.parentNode) menu.remove();
        });
        if (this._menu === menu) this._menu = null;
      };
      menu._close = close;

      setTimeout(() => {
        window.addEventListener('keydown', onKey, true);
        document.addEventListener('pointerdown', onAway, true);
        window.addEventListener('resize', close);
        window.addEventListener('location-changed', close, true);
      }, 0);

      this._menu = menu;
    }

    _closeMenu() {
      if (this._menu && this._menu._close) this._menu._close();
      this._menu = null;
    }

    _css() {
      const shared = `
        :host {
          position: fixed;
          left: 0;
          right: 0;
          height: 0;
          z-index: 50;
          display: block;
          pointer-events: none;
          text-size-adjust: 100%;
          -webkit-text-size-adjust: 100%;
        }

        .bar {
          position: relative;
          pointer-events: auto;
          box-sizing: border-box;
        }

        .glass {
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          pointer-events: none;
        }

        .scroller {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: row;
          align-items: center;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          touch-action: pan-x;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .scroller::-webkit-scrollbar { height: 0; width: 0; }

        /* Placed by TRANSFORM, a compositor property: left/right are layout, and
           on tablet they also re-blur the glass pill behind it. */
        .indicator {
          position: absolute;
          left: 0;
          z-index: 0;
          opacity: 0;
          pointer-events: none;
          transform-origin: left center;
          will-change: transform;
          transition:
            transform var(--hemma-nav-indicator-duration, 0.42s) var(--hemma-nav-indicator-ease, cubic-bezier(0.32, 0.72, 0, 1)),
            opacity 0.2s ease;
        }

        .indicator .fill {
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          transform-origin: left center;
          will-change: transform;
          transition: transform var(--hemma-nav-indicator-duration, 0.42s) var(--hemma-nav-indicator-ease, cubic-bezier(0.32, 0.72, 0, 1));
        }

        .indicator.on { opacity: 1; }

        .indicator.to-right       { transition-delay: var(--hemma-nav-indicator-lead, 0.07s), 0s; }
        .indicator.to-left .fill  { transition-delay: var(--hemma-nav-indicator-lead, 0.07s); }

        .indicator.instant,
        .indicator.instant .fill  { transition: none; }

        @media (prefers-reduced-motion: reduce) {
          .indicator,
          .indicator .fill { transition: opacity 0.2s ease !important; }
        }

        .route {
          position: relative;
          z-index: 1;
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
          box-shadow: none;
          font: inherit;
          color: inherit;
          cursor: pointer;
          overflow: visible;
          -webkit-tap-highlight-color: transparent;
        }

        .route:focus-visible { outline: none; }

        .label {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          white-space: nowrap;
          color: var(--hemma-nav-label-color, #fff);
          /* Per variant, not shared: how far an unselected label drops depends
             on how much work the indicator is doing. */
          opacity: var(--hemma-nav-label-inactive-opacity, 0.82);
        }

        .route.active .label { opacity: 1; }

        .route[data-has-popup] .label::after {
          content: "";
          display: inline-block;
          flex: none;
          width: 20px;
          height: 20px;
          margin-left: 2px;
          background-color: rgba(255,255,255,0.42);
          -webkit-mask: url("${CHEVRON}") no-repeat center / contain;
          mask: url("${CHEVRON}") no-repeat center / contain;
          transform: rotate(0deg);
          transition: transform 0.34s cubic-bezier(0.32, 0.72, 0, 1);
        }

        .route[data-has-popup][data-popup-open] .label::after {
          transform: rotate(90deg);
        }

        @keyframes hemma-badge-pulse {
          0%, 100% { opacity: .9; transform: scale(1); }
          50%      { opacity: 0;  transform: scale(0.85); }
        }

        .badge {
          position: absolute;
          display: none;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #ffd700;
          pointer-events: none;
          animation: hemma-badge-pulse 3s ease-in-out infinite;
        }
      `;

      const tabletCss = `
          /* The clock and chrome buttons are custom fields of the room card, whose
             position:fixed is captured by a transformed ancestor, so they ride
             down under HA's header. This bar hangs off the viewport and would
             not - hence the offset. */
          /* One row center for the pill, the capsule and the back button, each placed by its own half height. */
          :host {
            --hemma-nav-row-center: var(--hemma-chrome-row-center-tablet, 66px);
            top: calc(var(--hemma-nav-row-center) - var(--hemma-nav-pill-height-tablet, 46px) / 2
              + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            --hemma-nav-reserve-current: var(--hemma-chrome-side-reserve-tablet, 188px);
          }

          /* Both orientation-dependent values ride the one block that is known
             to match here. A second bar rule in its own media query is the same
             cascade on paper and was not worth the doubt. */
          @media (orientation: portrait) {
            :host {
              --hemma-nav-row-center: var(--hemma-chrome-row-center-tablet-portrait, 66px);
              top: calc(var(--hemma-nav-row-center) - var(--hemma-nav-pill-height-tablet, 46px) / 2
                + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
              --hemma-nav-reserve-current:
                var(--hemma-chrome-side-reserve-tablet-portrait, 108px);
            }
          }

          .bar {
            width: fit-content;
            max-width: var(--hemma-nav-bar-max, min(
              calc(75vw - 35px),
              calc(100vw - 2 * (var(--hero-gutter, 23px)
                + var(--hemma-nav-reserve-current, 188px)))
            ));
            margin: var(--hemma-nav-bar-margin, 0 auto);
            height: var(--hemma-nav-pill-height-tablet, 46px);
            padding: 0 var(--hemma-nav-pill-inset-x-tablet, 4px);
            border-radius: 9999px;
            overflow: hidden;
          }

          /* The capsule the phone dashboard and the panel share, from the same theme variables. */
          .glass {
            background: var(--hemma-pill-fill, rgba(255,255,255,0.10));
            -webkit-backdrop-filter: var(--hemma-pill-backdrop, blur(12px) saturate(1.4));
            backdrop-filter: var(--hemma-pill-backdrop, blur(12px) saturate(1.4));
            box-shadow: var(--hemma-pill-rim, inset 0 0.5px 0 rgba(255,255,255,0.10), inset 0 -0.5px 0 rgba(255,255,255,0.10)),
              inset 1px 0 0 var(--hemma-pill-edge, rgba(0,0,0,0.50)), inset -1px 0 0 var(--hemma-pill-edge, rgba(0,0,0,0.50));
          }

          .rim {
            position: absolute;
            inset: 0;
            z-index: 0;
            border-radius: inherit;
            pointer-events: none;
            -webkit-backdrop-filter: var(--hemma-pill-highlight, brightness(1.45));
            backdrop-filter: var(--hemma-pill-highlight, brightness(1.45));
            padding: 1px;
            box-sizing: border-box;
            -webkit-mask: linear-gradient(to bottom, #000 0, rgba(0,0,0,.45) 13%, transparent 31%, transparent 69%, rgba(0,0,0,.45) 87%, #000 100%), linear-gradient(#000 0 0), linear-gradient(#000 0 0) content-box;
            -webkit-mask-composite: source-in, source-out;
            mask: linear-gradient(to bottom, #000 0, rgba(0,0,0,.45) 13%, transparent 31%, transparent 69%, rgba(0,0,0,.45) 87%, #000 100%), linear-gradient(#000 0 0), linear-gradient(#000 0 0) content-box;
            mask-composite: intersect, subtract;
          }

          .flash {
            position: absolute;
            inset: 0;
            z-index: 2;
            border-radius: inherit;
            opacity: 0;
            pointer-events: none;
          }

          .scroller { height: 100%; }

          .route + .route { margin-left: var(--hemma-nav-route-gap-tablet, 4px); }

          .label {
            box-sizing: border-box;
            height: calc(var(--hemma-nav-pill-height-tablet, 46px)
              - 2 * var(--hemma-nav-pill-inset-y-tablet, 4px));
            padding: 0 var(--hemma-nav-label-pad-x-tablet, 16px);
            border-radius: 9999px;
            font-size: 16px;
            font-weight: var(--hemma-chrome-font-weight, 500);
            /* The pill fill is the selection cue, so the labels barely drop. */
            opacity: var(--hemma-nav-label-inactive-opacity, 0.84);
            background: transparent;
            transition: opacity .18s ease;
          }

          .indicator {
            top: var(--hemma-nav-pill-inset-y-tablet, 4px);
            height: calc(var(--hemma-nav-pill-height-tablet, 46px)
              - 2 * var(--hemma-nav-pill-inset-y-tablet, 4px));
          }

          .indicator .fill {
            background: var(--hemma-nav-active-fill, rgba(0,0,0,0.26));
          }

          .route[data-has-popup] .label::after {
            margin-left: -1px;
            margin-right: -6px;
          }

          /* Clear of the label's cap height in the 41px pill. */
          .badge { top: 4px; right: 12px; }

          .route.folded { display: none; }
          .route.toggle .label { display: flex; align-items: center; padding: 0 12px; opacity: 0.9; }
          .route.toggle svg { width: 16.7px; height: 13.2px; display: block; }
          /*SIDE-START*/
          .side-close svg { width: 25px; height: 19.5px; display: block; }

          .bar { transition: opacity .24s ease, transform .34s cubic-bezier(0.32, 0.72, 0, 1); }
          .bar.away { opacity: 0; transform: translateX(-14px) scale(0.96); pointer-events: none; }
          .bar.morphing { position: relative; z-index: 62; }
          .bar.morphing .glass, .bar.morphing .rim, .bar.morphing .rim-in { opacity: 0; }

          .side {
            position: fixed;
            z-index: 60;
            display: none;
            flex-direction: column;
            box-sizing: border-box;
            left: 0;
            top: 0;
            bottom: 0;
            width: var(--side-w, min(264px, 38vw));
            padding-top: calc(var(--hemma-chrome-row-top-tablet, 46px) - 8px
              + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            transform-origin: top left;
            color: #fff;
            font-family: var(--primary-font-family, system-ui);
          }
          @media (orientation: portrait) {
            .side { padding-top: calc(var(--hemma-chrome-row-top-tablet-portrait, 46px) - 8px
              + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px))); }
          }
          .status {
            position: fixed; z-index: 63; pointer-events: none; white-space: nowrap;
            left: 16px;
            top: calc(env(safe-area-inset-top, 0px) + 7px
              + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            line-height: 18px; font-size: 13.5px; font-weight: 600;
            color: #fff; opacity: var(--hemma-nav-label-inactive-opacity, 0.84);
            font-family: var(--primary-font-family, system-ui);
          }
          .status .extra { text-transform: none; }
          .status .extra { margin-left: .9em; }
          .side.open { display: flex; pointer-events: auto; }
          .side, .side * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
          .side-grip {
            position: absolute; top: 0; bottom: 0; right: -14px; width: 28px; z-index: 2;
            cursor: col-resize; touch-action: none;
          }
          @media (orientation: portrait) {
            .side { --side-w: min(264px, 38vw); }
            .side-grip { display: none; }
          }
          .side-glass {
            position: absolute; left: 0; top: 0; bottom: 0; width: 100vw; z-index: -1;
            pointer-events: none;
            clip-path: inset(0px calc(100% - var(--side-w, min(264px, 38vw))) 0px 0px);
            background: var(--hemma-sidebar-fill, rgba(28,28,32,0.74));
            -webkit-backdrop-filter: var(--hemma-sidebar-backdrop, blur(40px) saturate(1.15));
            backdrop-filter: var(--hemma-sidebar-backdrop, blur(40px) saturate(1.15));
          }
          .side-head { display: flex; justify-content: flex-end; padding: calc(var(--hemma-nav-row-center, 66px) - var(--hemma-chrome-row-top-tablet, 46px) - 14px) 10px 10px; }
          .side-close, .side-back {
            position: relative; width: 44px; height: 44px; border-radius: 50%; border: 0; padding: 0;
            display: grid; place-items: center; color: #fff; cursor: pointer;
            background-color: rgba(255,255,255,0.07);
            background-image: radial-gradient(140% 90% at 50% -20%, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 45%, transparent 62%);
            -webkit-backdrop-filter: var(--hemma-perf-none, blur(10px) saturate(1.2));
            backdrop-filter: var(--hemma-perf-none, blur(10px) saturate(1.2));
          }
          .side-close::before, .side-back::before {
            content: ""; position: absolute; inset: 0; border-radius: 50%; padding: 1px; pointer-events: none;
            /* Lit from the top-left as Apple's round glass is: a top and bottom glint reads as a tall oval. */
            background: conic-gradient(from 0deg, rgba(255,255,255,0.10) 0deg, rgba(255,255,255,0.05) 60deg,
              rgba(255,255,255,0.10) 100deg, rgba(255,255,255,0.26) 135deg, rgba(255,255,255,0.10) 170deg,
              rgba(255,255,255,0.05) 240deg, rgba(255,255,255,0.10) 280deg, rgba(255,255,255,0.46) 315deg,
              rgba(255,255,255,0.10) 350deg 360deg);
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask-composite: exclude;
          }
          .side-close::after, .side-back::after {
            content: ""; position: absolute; inset: -0.5px; border-radius: 50%; padding: 0.5px; pointer-events: none;
            background: rgba(0,0,0,0.30);
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask-composite: exclude;
          }
          .side-close > .flash, .side-back > .flash { position: absolute; inset: 0; border-radius: 50%; opacity: 0; pointer-events: none; }
          .side-close:active { transform: scale(0.94); }
          .side-close { transition: transform .15s ease; }
          .gl {
            display: block; width: 23px; height: 18px; background: currentColor;
            -webkit-mask: var(--g) center / contain no-repeat; mask: var(--g) center / contain no-repeat;
          }
          .route.toggle .gl { width: 21px; height: 16.5px; }
          .side-list {
            flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
            padding: 4px 10px calc(14px + env(safe-area-inset-bottom, 0px));
            -webkit-overflow-scrolling: touch; scrollbar-width: none;
          }
          .side-list::-webkit-scrollbar { display: none; }
          .side-foot {
            flex: none; padding: 6px 10px calc(10px + env(safe-area-inset-bottom, 0px));
            border-top: 0.5px solid rgba(255, 255, 255, 0.10);
          }
          .side-foot[hidden] { display: none; }
          .side-list.scrolled {
            -webkit-mask-image: linear-gradient(to bottom, transparent, #000 18px);
            mask-image: linear-gradient(to bottom, transparent, #000 18px);
          }
          .side-heading, .side-close, .side-back { -webkit-tap-highlight-color: transparent; }
          .side-heading {
            display: flex; align-items: center; justify-content: space-between; width: 100%;
            border: 0; background: none; cursor: pointer; text-align: left; font: inherit;
            font-size: 15px; font-weight: 600; letter-spacing: -0.01em;
            color: rgba(255,255,255,0.55); padding: 18px 12px 6px;
          }
          .side-heading svg { width: 17px; height: 17px; flex: none; transition: transform .26s cubic-bezier(.32,.72,0,1); }
          .side-heading[aria-expanded="false"] svg { transform: rotate(-90deg); }
          .side-group.shut { display: none; }
          .side-item {
            position: relative; display: flex; align-items: center; gap: 14px; width: 100%;
            height: 44px; padding: 0 12px; box-sizing: border-box; border: 0; border-radius: 22px;
            background: transparent; color: #fff; cursor: pointer; text-align: left;
            font: inherit; font-size: 17px; font-weight: 500; letter-spacing: -0.01em;
            -webkit-tap-highlight-color: transparent;
          }
          .side-item > * { transition: opacity .12s ease; }
          .side-item:active > :not(.side-motion), .side-item:active > .side-motion.on { opacity: 0.35; transition: none; }
          .side-item ha-icon { --mdc-icon-size: 22px; width: 22px; flex: none; color: var(--hemma-color-teal, #00C3D0); }
          .side-glyph {
            width: 24px; height: 24px; flex: none; background: var(--hemma-color-teal, #00C3D0);
            -webkit-mask: var(--g) center / contain no-repeat; mask: var(--g) center / contain no-repeat;
          }
          .side-item + .side-item { margin-top: 4px; }
          /* Home Assistant's own sidebar rows on a desktop: smaller than the tablet's touch rows, like the compact page. */
          :host(.compact) .side-item { height: 40px; gap: 12px; border-radius: 20px; font-size: 14px; }
          :host(.compact) .side-glyph { width: 22px; height: 22px; }
          :host(.compact) .side-item ha-icon { --mdc-icon-size: 22px; width: 22px; }
          :host(.compact) .side-heading { font-size: 13px; padding: 16px 12px 6px; }
          :host(.compact) .side-heading svg { width: 14px; height: 14px; }
          :host(.compact) .side-motion { width: 22px; height: 22px; }
          :host(.compact) .side-motion img { height: 12px; }
          .side-item.on { background: rgba(255,255,255,0.12); }
          .side-item > span:not(.side-motion) { flex: 1 1 auto; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .side-motion {
            width: 26px; height: 26px; border-radius: 9999px; flex: none; box-sizing: border-box;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.35);
            opacity: 0; transform: scale(0.5);
            transition: opacity .4s cubic-bezier(.34,1.56,.64,1), transform .4s cubic-bezier(.34,1.56,.64,1);
          }
          .side-motion.on { opacity: 1; transform: scale(1); }
          .side-back {
            position: fixed; z-index: 61;
            top: calc(var(--hemma-nav-row-center, 66px) - 22px
              + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            opacity: 0; transform: scale(0.8); pointer-events: none;
            transition: opacity .28s ease, transform .4s cubic-bezier(.34,1.56,.64,1);
          }
          .side-back.on { opacity: 1; transform: none; pointer-events: auto; }
          .side-back svg { width: 12px; height: 20px; display: block; margin-right: 3px; }
          .side-motion img { height: 14px; width: auto; display: block; }
          .bar { position: relative; z-index: 50; }
          .cat-bg, .cat, .cat-mini {
            position: fixed; top: 0; bottom: 0; right: 0; left: var(--cat-left, 0px);
            transition: opacity .28s cubic-bezier(0.25, 0.46, 0.45, 0.94), left .48s cubic-bezier(0.32, 0.72, 0, 1);
          }
          .cat-bg.show, .cat.show { transition: opacity .25s ease, left .48s cubic-bezier(0.32, 0.72, 0, 1); }
          .cat-bg.still, .cat.still, .cat-mini.still { transition: left .48s cubic-bezier(0.32, 0.72, 0, 1); }
          .cat-bg.pushed, .cat.pushed, .cat-mini.pushed { left: var(--side-w, min(264px, 38vw)); }
          .cat-bg {
            z-index: 39; opacity: 0; pointer-events: none;
            background: var(--hemma-perf-scrim, rgba(0, 0, 0, 0.22));
            -webkit-backdrop-filter: var(--hemma-perf-none, blur(40px)); backdrop-filter: var(--hemma-perf-none, blur(40px));
          }
          .cat-bg.show { opacity: 1; }
          .cat-xfade { position: fixed; z-index: 38; overflow: hidden; pointer-events: none; }
          .cat-xfade > div { position: absolute; inset: 0; }
          .cat {
            z-index: 40; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain; scrollbar-width: none; color: #fff;
            font-family: var(--primary-font-family, system-ui);
            opacity: 0; pointer-events: none;
          }
          .cat::-webkit-scrollbar { display: none; }
          .cat.show { opacity: 1; transform: none; pointer-events: auto; }
          .cat-in {
            padding: calc(var(--hemma-chrome-row-top-tablet, 46px) + 51px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px))) 22px
              calc(40px + env(safe-area-inset-bottom, 0px)) var(--cat-gutter, 20px);
          }
          .cat-in { --hemma-anim-name: none; --hemma-anim-delay: -1s; --hemma-anim-duration: 0.001s; position: relative; }
          /* Under the top-right buttons on the tiles' edge, as Apple Home sets its forecast. */
          .cat-wx { display: none; position: absolute; right: 22px; transform: translateY(-50%);
            top: calc(var(--hemma-chrome-row-top-tablet, 46px) + 51px + 20.5px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px))); }
          .cat.home .cat-wx { display: block; }
          .cat-bg.show.clear { opacity: 0; }
          .cat-chrome {
            position: fixed; z-index: 4; right: 22px; display: flex; align-items: center; gap: 12px;
            top: calc(var(--hemma-nav-row-center, 66px) + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            transform: translateY(-50%); --hemma-chrome-btn-size: 34px;
          }
          .cat-chrome > :not(.sep) { flex: none; width: var(--hemma-chrome-btn-size); height: var(--hemma-chrome-btn-size); }
          .cat-chrome.cap {
            --hemma-chrome-btn-size: var(--hemma-chrome-btn-size-tablet, 34px);
            padding: 6px; border-radius: 9999px; --hemma-chrome-capsule: 1;
            --hemma-chrome-fill: transparent; --hemma-chrome-fill-hover: rgba(255,255,255,0.10);
            --hemma-bell-fill: transparent; --hemma-settings-fill: transparent; --hemma-assist-fill: transparent;
          }
          /* The navbar's two layers, side by side: a blur inside a blurring parent samples the parent, not the photo. */
          .cat-chrome.cap::before, .cat-chrome.cap::after {
            content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
          }
          .cat-chrome.cap::before {
            background: var(--hemma-pill-fill, rgba(255,255,255,0.10));
            -webkit-backdrop-filter: var(--hemma-pill-backdrop, blur(12px) saturate(1.4));
            backdrop-filter: var(--hemma-pill-backdrop, blur(12px) saturate(1.4));
            box-shadow: var(--hemma-pill-rim, inset 0 0.5px 0 rgba(255,255,255,0.10), inset 0 -0.5px 0 rgba(255,255,255,0.10)),
              inset 1px 0 0 var(--hemma-pill-edge, rgba(0,0,0,0.50)), inset -1px 0 0 var(--hemma-pill-edge, rgba(0,0,0,0.50));
          }
          .cat-chrome.cap::after {
            -webkit-backdrop-filter: var(--hemma-pill-highlight, brightness(1.45));
            backdrop-filter: var(--hemma-pill-highlight, brightness(1.45));
            padding: 1px; box-sizing: border-box;
            -webkit-mask: linear-gradient(to bottom, #000 0, rgba(0,0,0,.45) 13%, transparent 31%, transparent 69%, rgba(0,0,0,.45) 87%, #000 100%), linear-gradient(#000 0 0), linear-gradient(#000 0 0) content-box;
            -webkit-mask-composite: source-in, source-out;
            mask: linear-gradient(to bottom, #000 0, rgba(0,0,0,.45) 13%, transparent 31%, transparent 69%, rgba(0,0,0,.45) 87%, #000 100%), linear-gradient(#000 0 0), linear-gradient(#000 0 0) content-box;
            mask-composite: intersect, subtract;
          }
          .cat-chrome .sep { flex: none; width: 1px; height: 18px; margin: 0 -6.5px; background: var(--hemma-pill-divider, rgba(60,60,67,0.36)); }
          .cat-batt {
            position: fixed; z-index: 4; right: 15px; top: calc(env(safe-area-inset-top, 0px) + 7px); height: 18px;
            display: flex; align-items: center; pointer-events: none; opacity: var(--hemma-nav-label-inactive-opacity, 0.84);
          }
          .cat-in h1 { margin: 0; font-size: 34px; font-weight: 700; letter-spacing: 0.01em; line-height: 41px; }
          .cat-pills {
            position: sticky; top: calc(var(--hemma-chrome-row-top-tablet, 46px) + 58px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            z-index: 3; display: flex; gap: 8px; margin: 18px 0 4px; overflow-x: auto; scrollbar-width: none;
          }
          .cat-pills::-webkit-scrollbar { display: none; }
          .cat-pills.cards { display: block; overflow: visible; margin: 14px -20px 0 calc(-1 * var(--cat-gutter, 20px)); --hemma-rail-left: var(--cat-gutter, 20px); }
          .cat-chipcard { display: block; margin: 4px -20px 6px calc(-1 * var(--cat-gutter, 20px)); --hemma-rail-left: var(--cat-gutter, 20px); }
          /* Bare chips read further apart than filled ones: layout-card's 4px either side of each goes. */
          .cat-chipcard { --masonry-view-card-margin: 4px 0 8px; }
          /* A button-card's #container is z-index 2, which would tie the veil's and paint over it. */
          .cat-chipcard { position: relative; z-index: 0; }
          /* Pinned to the page's width: sized to its chips, the row would never be narrower than them and so never scroll. */
          .cat.room .cat-chipcard {
            width: calc(100% + 20px + var(--cat-gutter, 20px)) !important; max-width: calc(100% + 20px + var(--cat-gutter, 20px)) !important;
            min-width: 0 !important; box-sizing: border-box;
          }
          .cat-pill {
            flex: none; display: flex; align-items: center; gap: 7px; height: 40px; padding: 0 14px 0 11px;
            border: 0; border-radius: 20px; cursor: pointer; font: inherit; font-size: 13px; font-weight: 600;
            color: #fff; background: rgba(0, 0, 0, 0.40);
            -webkit-backdrop-filter: var(--hemma-perf-none, blur(20px) saturate(1.2)); backdrop-filter: var(--hemma-perf-none, blur(20px) saturate(1.2));
            transition: background-color .2s ease, color .2s ease;
          }
          .cat-pill.on { background: rgba(255, 255, 255, 0.94); color: #1c1c1e; }
          .cat-glyph { width: 20px; height: 20px; flex: none; -webkit-mask: var(--g) center / contain no-repeat; mask: var(--g) center / contain no-repeat; }
          .cat-body h2 { margin: 36px 0 12px; font-size: 20px; font-weight: 600; letter-spacing: 0.01em; line-height: 24px; }
          .cat-pane > .cat-sec:first-child h2 { margin-top: 22px; }
          .cat-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
            grid-auto-rows: 72px; grid-auto-flow: row dense; gap: 10px;
            --hemma-entity-inner-pad-current: 10px;
            --hemma-entity-name-font-current: 14px;
            --hemma-entity-state-font-current: 14px;
          }
          .cat-grid > [data-hemma-size="large"] { grid-row: span 2; }
          /* button-card hides a card with the host's hidden attribute, which its own :host display outranks. */
          .cat-grid > [hidden] { display: none; }
          .cat-pane[hidden] { display: none !important; }
          /* Hidden but still laid out, so showing Home again does not rebuild every tile's layout. */
          @supports (content-visibility: hidden) {
            .cat-pane[hidden] { display: block !important; content-visibility: hidden; }
          }
          .cat.compact .cat-grid {
            grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
            grid-auto-rows: 62px; --hemma-entity-inner-pad-current: 8px; --hemma-entity-icon-size-current: 28px;
            --hemma-entity-name-font-current: 13px; --hemma-entity-state-font-current: 13px;
          }
          .cat.compact .cat-grid > [data-hemma-size="large"] { --hemma-entity-inner-pad-current: 10px; }
          .cat.compact .cat-body h2 { font-size: 17px; line-height: 21px; }
          /* A Mac's title sits in the toolbar row, as Apple Home's: level with the clock and the buttons, the forecast beside them. */
          .cat.compact .cat-in { padding-top: calc(var(--hemma-nav-row-center, 66px) - 20.5px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px))); }
          .cat.compact:not(.home) .cat-in > h1 { margin-left: 58px; }
          .cat.compact .cat-wx { top: calc(var(--hemma-nav-row-center, 66px) + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            right: calc(var(--cat-gutter, 20px) + var(--cat-chrome-w, 80px) + 26px); }
          :host(.compact) .cat-chrome { right: var(--cat-gutter, 20px); }
          /* A dashboard is tapped, not read: a double tap on a title must not select it. */
          .bar, .side, .cat, .cat-mini, .cat-chrome { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
          .cat.compact .cat-np > * { --np-tile-width: min(var(--cat-two-tiles, 366px), 100%); --np-inner-radius: 20px; }
          /* Apple Home on a Mac: 19px corners on 54px tiles, so 20 on these 62px ones. */
          .cat.compact { --hemma-tile-radius-phone: 20px; --hemma-scene-tile-radius: 20px; }
          .cat.room .cat-pills { display: none; }
          .cat-body { position: relative; }
          .cat.scenes .cat-pills, .cat.scenes .cat-chipcard { display: none; }
          .cat-warm { position: fixed; left: -10000px; top: 0; visibility: hidden; pointer-events: none; }
          /* The tile's #container is z-index 2, which would tie the veil's and paint over it: keep it in here. */
          .cat-np { position: relative; z-index: 0; display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; --np-elevation: 0 0 #0000; }
          /* The tile's :host sizes it with !important, so it is fed variables instead. */
          .cat-np > * { flex: none; --np-tile-width: min(360px, 100%); --np-max-w: 100%; --np-inner-radius: 26px; margin: 0 !important; }
          .cat-scenes-row { margin: 0 -22px 0 calc(-1 * var(--cat-gutter, 20px)); }
          .cat-scenes-row > .cat-scenes { --hemma-rail-left: var(--cat-gutter, 20px); }
          .cat-scenes { display: block; margin-top: 14px; --hemma-rail-left: 0px; --hemma-measured-safe-left: 0px;
            --hemma-scene-grid-cols: repeat(auto-fill, minmax(190px, 1fr)); --hemma-scene-grid-col-gap: 10px; --hemma-scene-grid-row-gap: 10px; }
          .cat-empty { margin-top: 40px; font-size: 17px; opacity: 0.6; }
          .cat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 560px)); gap: 10px; align-items: start; }
          .cat-en {
            border-radius: 26px; padding: 16px 18px 14px; background: rgba(12, 14, 19, 0.62);
            -webkit-backdrop-filter: var(--hemma-perf-none, blur(24px) saturate(1.8)); backdrop-filter: var(--hemma-perf-none, blur(24px) saturate(1.8));
            box-shadow: 0 18px 40px -22px rgba(0, 0, 0, 0.50);
          }
          .cat-en { cursor: pointer; -webkit-tap-highlight-color: transparent; }
          .cat-en h3 { margin: 0 0 2px; font-size: 16px; font-weight: 600; }
          .cat-en .sub { font-size: 12.5px; opacity: 0.6; margin-bottom: 8px; }
          .cat-en svg { display: block; }
          .cat-en .lgs { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 4px; }
          .cat-en .lg { font-size: 12px; opacity: 0.85; display: flex; align-items: center; gap: 6px; }
          .cat-en .lg i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
          .cat-en .hb { display: grid; grid-template-columns: minmax(0, 120px) 1fr 74px; align-items: center; gap: 10px; height: 40px; }
          .cat-en .hn { font-size: 13.5px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .cat-en .hbar { height: 12px; border-radius: 6px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
          .cat-en .hbar i { display: block; height: 100%; border-radius: 6px; }
          .cat-en .hv { font-size: 13px; opacity: 0.7; text-align: right; }
          .cat-veilwrap { position: sticky; top: 0; height: 0; z-index: 2; pointer-events: none; }
          .cat-veil {
            position: absolute; top: 0; left: 0; right: 0; pointer-events: none; opacity: 0;
            height: calc(var(--hemma-chrome-row-top-tablet, 46px) + 58px + 40px + 12px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            -webkit-backdrop-filter: var(--hemma-perf-none, blur(30px) saturate(1.3) brightness(0.72));
            backdrop-filter: var(--hemma-perf-none, blur(30px) saturate(1.3) brightness(0.72));
            transition: opacity 220ms ease-in-out;
          }
          .cat-veil.on { opacity: 1; }
          .cat-mini {
            z-index: 42; bottom: auto; pointer-events: none; opacity: 0; text-align: center;
            top: calc(var(--hemma-chrome-row-top-tablet, 46px) - 3px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            font-family: var(--primary-font-family, system-ui); font-size: 17px; font-weight: 600; color: #fff;
            transition: opacity 200ms ease, left .48s cubic-bezier(0.32, 0.72, 0, 1);
          }
          .cat-mini.show.on.pushed { opacity: 1; }
          /* On a desktop the small title takes the big one's place in the toolbar row: same left edge, same center line. */
          :host(.compact) .cat-mini { text-align: left; padding-left: var(--cat-gutter, 20px); line-height: 22px;
            top: calc(var(--hemma-nav-row-center, 66px) - 11px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px))); }
          :host(.compact) .cat-mini:not(.home) { padding-left: calc(var(--cat-gutter, 20px) + 58px); }
          /*SIDE-END*/
          /* As Apple Home on an iPad: badges scroll; the veil is a thin fading band under the navbar, button-row deep with the sidebar. */
          .cat-pills { position: relative; top: auto; z-index: 0; }
          /* Apple's top edge: what scrolls up fades into the wallpaper as it reaches the clock, under only a light blur. */
          .cat-veil {
            height: calc(env(safe-area-inset-top, 0px) + 34px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            background: none;
            -webkit-backdrop-filter: var(--hemma-perf-none, blur(6px)); backdrop-filter: var(--hemma-perf-none, blur(6px));
            -webkit-mask-image: linear-gradient(to bottom, #000 40%, transparent); mask-image: linear-gradient(to bottom, #000 40%, transparent);
          }
          /* Fades a registered --cat-edge, never opacity on the card: an animated ancestor opacity kills the tile's own glass blur. */
          @supports (animation-timeline: view()) {
            @keyframes cat-edge { to { --cat-edge: 0; } }
            .cat:not(.pushed) :is(.cat-in > h1, .cat-pills, .cat-chipcard, .cat-body h2, .cat-grid > *, .cat-scenes-row, .cat-np > *) {
              animation: cat-edge linear both; animation-timeline: view(block 0px 0px);
              animation-range: exit calc(50% - 45px) exit calc(50% + 5px);
            }
            .cat:not(.pushed) :is(.cat-in > h1, .cat-body h2) { opacity: var(--cat-edge, 1); }
          }
          :host(.under) :is(.status, .cat-batt) { opacity: 1; text-shadow: 0 0 6px rgba(0,0,0,0.30), 0 0.5px 1.5px rgba(0,0,0,0.22); }
          :host(.under) .cat-batt { filter: drop-shadow(0 0 3px rgba(0,0,0,0.30)); }
          /* Apple's tablet glass, matched pixel for pixel over Apple's own sky (harnesses/glasslab): a blur mixed 26% toward a
             NEUTRAL gray (a tinted gray turned every room photo blue); one crisp light pixel top and bottom with a softer one inside it and a faint glow. Half-point shadows,
             not masked rings: those round to two device pixels wherever the pill lands on a fraction. */
          :host {
            --hemma-pill-backdrop: var(--hemma-perf-none, blur(12px) saturate(1.45));
            --hemma-pill-fill: var(--hemma-perf-pill, rgba(108,108,108,0.26));
            --hemma-pill-edge: transparent;
            /* Apple's glass is flat a couple of pixels inside the edge: only a short falloff, no deep glow band. */
            --hemma-pill-rim: inset 0 2px 2px -1px rgba(255,255,255,0.05), inset 0 -2px 2px -1px rgba(255,255,255,0.05);
            --hemma-nav-active-fill: rgba(0,0,0,0.26);
            --hemma-nav-label-inactive-opacity: 1;
          }
          .bar { font-family: var(--primary-font-family, -apple-system, system-ui); }
          .label { font-weight: 500; font-size: 17px; }
          .route.toggle .label { opacity: 1; }
          /* Apple's edge, placed and toned against Apple's own pixels (glasslab option H): a light line on the glass's outermost
             row along the top and bottom, and a dark line on the pixel just OUTSIDE the glass, strongest mid-end; both full
             half-point rings faded by vertical masks, so they follow the curve without a seam. */
          .glass::after, .cat-chrome.cap::after {
            content: ""; position: absolute; border-radius: 9999px; pointer-events: none; z-index: 0;
            padding: 0; border: 0; background: none; -webkit-backdrop-filter: none; backdrop-filter: none;
          }
          /* The light line is the glass itself brightened (Apple's is 1.2x what is behind it, so it takes that color): a
             half-point ring of backdrop brightness beside the glass, faded out a quarter of the way round the curve. */
          .bar > .rim, .cat-chrome > .cap-rim, .bar > .rim-in, .cat-chrome > .cap-rim-in {
            display: block; position: absolute; inset: 0.5px; z-index: 0; border-radius: 9999px; pointer-events: none;
            width: auto; height: auto; padding: 1px; box-sizing: border-box; background: none; box-shadow: none;
            -webkit-backdrop-filter: var(--hemma-perf-none, brightness(1.24)); backdrop-filter: var(--hemma-perf-none, brightness(1.24));
            -webkit-mask: linear-gradient(to bottom, #000 0%, rgba(0,0,0,.3) 10%, transparent 22%, transparent 78%, rgba(0,0,0,.3) 90%, #000 100%), linear-gradient(#000 0 0), linear-gradient(#000 0 0) content-box;
            -webkit-mask-composite: source-in, source-out;
            mask: linear-gradient(to bottom, #000 0%, rgba(0,0,0,.3) 10%, transparent 22%, transparent 78%, rgba(0,0,0,.3) 90%, #000 100%), linear-gradient(#000 0 0), linear-gradient(#000 0 0) content-box;
            mask-composite: intersect, subtract;
          }
          /* iOS WebKit draws a half-point ring as one crisp pixel; Chrome rounds its bottom edge away, so it keeps a full point. */
          .bar > .rim-in, .cat-chrome > .cap-rim-in { display: none; }
          /* On iOS, two rows: the outer pixel at 1.315x, the one inside it at 1.16x. */
          @supports (-webkit-touch-callout: none) {
            .bar > .rim, .cat-chrome > .cap-rim { padding: 0.5px; -webkit-backdrop-filter: var(--hemma-perf-none, brightness(1.315)); backdrop-filter: var(--hemma-perf-none, brightness(1.315)); }
            .bar > .rim-in, .cat-chrome > .cap-rim-in { display: block; inset: 1px; padding: 0.5px;
              -webkit-backdrop-filter: var(--hemma-perf-none, brightness(1.16)); backdrop-filter: var(--hemma-perf-none, brightness(1.16)); }
          }
          .glass::after, .cat-chrome.cap::after {
            inset: -0.5px; box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.58);
            -webkit-mask: linear-gradient(to bottom, transparent 8%, rgba(0,0,0,.6) 20%, #000 32%, #000 68%, rgba(0,0,0,.6) 80%, transparent 92%); mask: linear-gradient(to bottom, transparent 8%, rgba(0,0,0,.6) 20%, #000 32%, #000 68%, rgba(0,0,0,.6) 80%, transparent 92%);
          }
          /* The bar clips to its shape, so the glass gives up half a point and the dark line lands on the bar's own edge. */
          .bar > .glass { inset: 0.5px; }
          .cat-chrome.cap::before { inset: 0.5px; }
          .cat-chrome.cap::after { inset: 0; }

          .cat.pushed .cat-veil {
            height: calc(var(--hemma-chrome-row-center-tablet, 54.5px) + 30.5px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
            background: none; -webkit-backdrop-filter: var(--hemma-perf-none, blur(30px) saturate(1.3) brightness(0.72)); backdrop-filter: var(--hemma-perf-none, blur(30px) saturate(1.3) brightness(0.72));
            -webkit-mask-image: none; mask-image: none;
          }
          .cat-mini { line-height: 22px;
            top: calc(var(--hemma-chrome-row-center-tablet, 54.5px) - 11px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px))); }
        `;
      const desktopCss = `
        :host {
          top: calc(var(--hemma-chrome-row-center-desktop, 56px)
            - var(--hemma-nav-label-pad-top, 8px)
            - (var(--hemma-chrome-font-size, 18px) / 2)
            + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px)));
        }

        .bar {
          display: flex;
          justify-content: center;
          width: fit-content;
          max-width: calc(100vw - 2 * var(--hemma-nav-margin-current, 8vw));
          margin: 0 auto;
        }

        @supports (animation-timeline: scroll()) {
          .scroller {
            animation: hemma-fade-mask linear;
            animation-timeline: scroll(self inline);
          }
        }

        @keyframes hemma-fade-mask {
          0% {
            -webkit-mask-image: linear-gradient(to right, transparent 0px, black 0px, black calc(100% - 80px), transparent 100%);
            mask-image: linear-gradient(to right, transparent 0px, black 0px, black calc(100% - 80px), transparent 100%);
          }
          100% {
            -webkit-mask-image: linear-gradient(to right, transparent 0px, black 80px, black 100%, transparent calc(100% + 80px));
            mask-image: linear-gradient(to right, transparent 0px, black 80px, black 100%, transparent calc(100% + 80px));
          }
        }

        .route { padding: 0 20px; }

        .label {
          box-sizing: border-box;
          height: calc(var(--hemma-chrome-font-size, 18px)
            + var(--hemma-nav-label-pad-top, 8px) + 14px);
          padding: var(--hemma-nav-label-pad-top, 8px) 0 14px;
          font-size: var(--hemma-chrome-font-size, 18px);
          font-weight: var(--hemma-chrome-font-weight, 500);
          letter-spacing: var(--hemma-chrome-letter-spacing, 0.2px);
          opacity: 1;
        }

        .indicator {
          bottom: var(--hemma-nav-underline-gap, 4px);
          height: var(--hemma-nav-underline-thickness, 2px);
        }

        .indicator .fill { background: rgba(255,255,255,0.85); }

        .badge { top: 6px; right: 10px; }
      `;
      if (this._variant === 'tablet') return shared + tabletCss;
      const sideCss = tabletCss.slice(tabletCss.indexOf('/*SIDE-START*/'), tabletCss.indexOf('/*SIDE-END*/'));
      return shared + desktopCss + sideCss + `
        :host { --hemma-chrome-row-top-tablet: calc(var(--hemma-chrome-row-center-desktop, 56px) - 20px);
          --hemma-nav-row-center: var(--hemma-chrome-row-center-desktop, 56px); }
        /* As the tablet: the badges scroll with the page, so the veil only covers the toolbar row. */
        .cat-pills { position: relative; top: auto; z-index: 0; }
        .cat-veil { height: calc(var(--hemma-nav-row-center, 66px) + 30.5px + var(--hemma-nav-header-offset, var(--hemma-header-offset, 0px))); }
        /* The room card's clock, rule for rule (hemma_time), so one element can stand in for it everywhere. */
        .status {
          left: 22px; top: 0; z-index: 63; line-height: 1; padding-block: .16em; margin-block: -.16em;
          font-size: var(--hemma-chrome-font-size, 18px); font-weight: var(--hemma-chrome-font-weight, 700);
          letter-spacing: var(--hemma-time-letter-spacing, 1px); color: var(--primary-text-color, #fff); opacity: 0;
        }
        .status.on { opacity: var(--hemma-time-opacity, 1); }
        .status .extra { margin-left: 0; text-transform: none; font-weight: 500; letter-spacing: var(--hemma-time-sub-spacing, .2px); }
        .status .extra::before { content: "\\00b7"; margin: 0 .4em; }
        .status.tight .extra { display: none; }
        :host(.side-locked) .side-close { visibility: hidden; pointer-events: none; }
        .route.toggle { padding: 0 14px 0 0; }
        .route.toggle .label { display: flex; align-items: center; }
        .route.toggle svg { width: 18px; height: 14.25px; display: block; }
      `;
    }
  }

  customElements.define('hemma-nav-bar', HemmaNavBar);

  function walkFind(root, selector, out, depth) {
    if (!root || depth > 20 || !root.querySelectorAll) return;
    root.querySelectorAll(selector).forEach((el) => out.push(el));
    root.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) walkFind(el.shadowRoot, selector, out, depth + 1);
    });
  }

  function persistentHost() {
    const found = [];
    walkFind(document, 'ha-app-layout', found, 0);
    for (const el of found) if (el.isConnected) return el;
    return document.body;
  }

  class HemmaNav extends HTMLElement {
    static getStubConfig() { return { variant: 'desktop', routes: [] }; }

    setConfig(config) {
      if (!config || !Array.isArray(config.routes)) {
        throw new Error('hemma-nav: routes array required');
      }
      this._config = config;
      if (this._adoptReady) this._adopt();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._bar) this._bar.hass = hass;
    }

    get hass() { return this._hass; }

    getCardSize() { return 0; }

    connectedCallback() {
      this.style.display = 'none';
      (HemmaNav._live || (HemmaNav._live = new Set())).add(this);
      // HA 2026.10 attaches a conditional's card before checking its condition; the nav bar swapped and the sidebar reopened.
      cancelAnimationFrame(this._adoptRaf);
      this._adoptReady = false;
      this._adoptRaf = requestAnimationFrame(() => { this._adoptRaf = requestAnimationFrame(() => {
        if (!this.isConnected) return;
        this._adoptReady = true;
        this._adopt();
      }); });
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._adoptRaf);
      this._adoptReady = false;
      if (HemmaNav._live) HemmaNav._live.delete(this);
      requestAnimationFrame(() => {
        if (HemmaNav._live && HemmaNav._live.size) return;
        if (HemmaNav._bar) { HemmaNav._bar.remove(); HemmaNav._bar = null; }
      });
    }

    _adopt() {
      if (!this._config || !this.isConnected) return;
      const variant = this._config.variant === 'tablet' ? 'tablet' : 'desktop';

      let bar = HemmaNav._bar;
      if (bar && bar._variant !== variant) { bar.remove(); bar = null; }

      if (!bar) {
        bar = document.createElement('hemma-nav-bar');
        bar.setConfig(this._config);
        HemmaNav._bar = bar;
      } else {
        bar.updateConfig(this._config);
      }

      const host = persistentHost();
      if (bar.parentNode !== host) host.appendChild(bar);

      this._bar = bar;
      if (this._hass) bar.hass = this._hass;
    }
  }

  customElements.define('hemma-nav', HemmaNav);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'hemma-nav',
    name: 'Hemma Navigation',
    description: 'Hemma navigation bar — desktop labels or tablet glass pill',
  });
})();

(function () {
  // The table may load before or after this file, so look it up per call.
  var _hemmaT = function (k, en, v) {
    if (typeof window._hemmaT === 'function') return window._hemmaT(k, en, v);
    var s = String(en);
    if (v) for (var p in v) s = s.split('{' + p + '}').join(String(v[p]));
    return s;
  };
  var _hemmaL = function (k, en) {
    var h = document.querySelector('home-assistant');
    var v = h && h.hass && h.hass.localize && h.hass.localize(k);
    return (v && v !== k) ? v : en;
  };
  if (window.hemmaPopup) return;

  var SHEET_MAX = 768;

  function flagOn() {
    if (typeof window.HEMMA_POPUP === 'boolean') return window.HEMMA_POPUP;
    try {
      var q = new URLSearchParams(location.search).get('hemma_popup');
      if (q === '1') return true;
      if (q === '0') return false;
      return localStorage.getItem('hemma_popup') !== '0';
    } catch (e) { return true; }
  }

  var CHART_WAIT_MAX = 1600;

  var FOREIGN = /([^\w.#-]|^)(ha-adaptive-dialog|ha-bottom-sheet|ha-dialog|wa-dialog|wa-drawer)(?![\w-])/g;
  function retarget(css) { return String(css == null ? '' : css).replace(FOREIGN, '$1.surface'); }

  var BASE_CSS = `
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--hemma-popup-z, 2147483000);
      display: none;
      color: var(--primary-text-color, #fff);
      --hemma-popup-grain-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    :host([open]) { display: block; }

    .scrim {
      position: absolute;
      inset: 0;
      background: var(--hemma-popup-scrim, var(--mdc-dialog-scrim-color, rgba(0, 0, 0, 0.40)));
      backdrop-filter: var(--hemma-popup-scrim-backdrop, var(--hemma-scrim-backdrop, blur(6px) saturate(1.35)));
      -webkit-backdrop-filter: var(--hemma-popup-scrim-backdrop, var(--hemma-scrim-backdrop, blur(6px) saturate(1.35)));
      opacity: 0;
      /* Deliberately slower than the pane and on its own curve: the panel
         arrives, then the room settles back behind it. Sharing the pane's
         260ms is what made the blur read as a snap. */
      transition: opacity var(--hemma-popup-scrim-enter, 480ms)
                  var(--hemma-popup-scrim-ease, cubic-bezier(0.25, 0.6, 0.3, 1));
    }
    :host([shown]) .scrim { opacity: 1; }
    /* Out faster than in, and inside the 400ms teardown or it gets cut off. */
    :host([closing]) .scrim {
      transition-duration: var(--hemma-popup-scrim-exit, 200ms);
      transition-timing-function: ease-in;
    }

    .layer {
      position: absolute;
      inset: 0;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      pointer-events: none;
    }

    .surface {
      pointer-events: auto;
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: var(--popup-min-width, 580px);
      max-width: min(var(--popup-max-width, 600px), calc(100vw - 16px));
      margin-top: var(--hemma-popup-top, 112px);
      max-height: calc(100svh - var(--hemma-popup-top, 112px) - 8px - var(--safe-area-inset-bottom, 0px));
      border-radius: var(--hemma-popup-radius, 38px);
      background: transparent;
      overflow: hidden;
    }
    /* A sheet may size itself to its content - see hemma_popup_recently_added,
       where two shelves of two tiles must not sit in a sheet built for three.
       Below the two-column breakpoint the shelves go fluid and have no
       intrinsic width, so a popup that opts in names what to use instead. */
    @media (max-width: 900px) {
      .surface { width: var(--popup-min-width-narrow, var(--popup-min-width, 580px)); }
    }
    /* A landscape tablet is wide but short: 112px above the sheet plus the
       header was 22% of the screen gone before any content. The offset follows
       the height it has to fit into, not the width. */
    @media (max-height: 900px) and (min-width: 601px) {
      :host { --hemma-popup-top: 64px; }
    }
    @media (max-height: 720px) and (min-width: 601px) {
      :host { --hemma-popup-top: 40px; }
    }

    /* The frost is a sibling of the content, not a wrapper around it. As an
       ancestor it would make every backdrop-filter inside the popup a silent
       no-op, which is what pinned --hemma-glass-pill-backdrop to none. */
    .glass {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      animation: hemma-popup-fade var(--hemma-popup-enter, 260ms) ease-out;
      isolation: isolate;
      box-shadow: var(--hemma-popup-shadow,
        0 40px 90px -32px rgba(0, 0, 0, 0.78),
        0 10px 28px -14px rgba(0, 0, 0, 0.55));
      background: var(--hemma-popup-tint,
        var(--ha-dialog-surface-background, var(--ha-dialog-background, rgba(0, 0, 5, 0.5))));
    }
    :host(:not([flat])) .glass {
      backdrop-filter: var(--hemma-popup-backdrop,
        var(--hemma-surface-backdrop, blur(28px) saturate(200%)));
      -webkit-backdrop-filter: var(--hemma-popup-backdrop,
        var(--hemma-surface-backdrop, blur(28px) saturate(200%)));
    }
    :host([flat]) .glass { background: var(--hemma-popup-tint-flat, rgba(8, 8, 12, 0.24)); }

    /* A mix-blend-mode layer makes the browser read the backdrop back and
       composite the subtree as one group, and zero opacity does not remove it -
       an invisible grain costs exactly what a visible one costs. Every widget
       popup runs at grain 0, so the layer has to be able to go entirely. */
    .glass::before, .glass::after {
      content: var(--hemma-popup-grain-content, "");
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      background-image: var(--hemma-popup-grain-image);
      background-size: 180px 180px;
    }
    /* overlay is midpoint-relative and goes weak on dark ground; screen falls
       off the opposite way, so the pair holds roughly flat across the ramp. */
    .glass::before { mix-blend-mode: overlay; opacity: var(--hemma-popup-grain, 0.10); }
    .glass::after  { mix-blend-mode: screen;  opacity: var(--hemma-popup-grain-dark, 0.04); }

    /* Decoration, off by default - the popups read flat now, matching HA's
       dialogs. Set --hemma-popup-rim to a box-shadow to bring it back. */
    .rim {
      display: var(--hemma-popup-rim-display, none);
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      animation: hemma-popup-fade var(--hemma-popup-enter, 260ms) ease-out;
      box-shadow: var(--hemma-popup-rim,
        inset 0 1px 0 -0.5px rgba(255, 255, 255, 0.34),
        inset 0 8px 14px -12px rgba(255, 255, 255, 0.22),
        inset 0 -1px 0 -0.5px rgba(255, 255, 255, 0.11),
        inset 1px 0 0 -0.5px rgba(255, 255, 255, 0.13),
        inset -1px 0 0 -0.5px rgba(255, 255, 255, 0.13));
    }

    :host([closing]) .surface { animation: hemma-popup-out 140ms ease-in forwards; }

    @keyframes hemma-popup-fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes hemma-popup-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    /* Transform, deliberately - a margin slide relayouts every frame and drops
       them. No opacity here: opacity below 1 makes the surface a backdrop root
       and kills the frost inside it, which is what HA's own drawer does wrong. */
    @keyframes hemma-sheet-in {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    @keyframes hemma-sheet-out {
      from { transform: translateY(0); }
      to   { transform: translateY(100%); }
    }

    /* The entrance starts off-screen, so anything that stalls the animation
       clock would strand the surface there. Opting out restores the resting
       state, which is the laid-out one. */
    @media (prefers-reduced-motion: reduce) {
      .surface, .glass, .rim, .content { animation: none !important; }
      .scrim { transition: none !important; }
    }

    .grab { display: none; }

    /* .glass is absolutely positioned, so it paints above in-flow siblings.
       .content escapes that only because animating opacity makes it paint in
       the positioned step; the header has no animation, so it needs this or
       the frost fades in over the title. */
    /* The header was never part of the entrance. .content animates, and in a
       widget popup even that is off because each plate animates itself - so the
       close, the actions and the title were simply present on frame one while
       everything under them faded in. They arrive with the first plate now. */
    /* The same depth entrance the plates use, so the chrome arrives as part of
       the popup rather than ahead of it. */
    @keyframes hemma-popup-chrome-in {
      from { opacity: 0; transform: perspective(900px) translateZ(-70px); }
      to   { opacity: 1; transform: perspective(900px) translateZ(0); }
    }
    .header {
      flex: 0 0 auto;
      position: relative;
      z-index: 1;
    }
    /* On each control, never on .header. An animated opacity on an ANCESTOR
       paints the subtree into its own layer and every backdrop-filter inside it
       has nothing left to sample - animating the bar would flatten the close
       button's frost for the length of its own entrance. */
    .header-close,
    .header-content,
    .header-actions {
      animation: var(--hemma-popup-chrome-enter, none);
    }
    @media (prefers-reduced-motion: reduce) {
      .header-close, .header-content, .header-actions { animation: none; }
    }
    .header[hidden] { display: none; }
    .header-bar {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      /* The close glyph's ink sits on the same left margin as the body content
         (8px container + 26px card gutter = 34px), so the popup has one left
         edge instead of three. Measured, not derived: the glyph's ink starts
         5/24 into its own box, so 17px of bar padding is what lands it on 34. */
      /* The SAME gutter the content pads by. These were two independent
         numbers, so every popup that padded its content differently put the
         close button somewhere else, and each one had to be found and tuned by
         hand. One value, read by both, cannot disagree. */
      padding: 0 var(--hemma-popup-gutter, 26px);
      box-sizing: border-box;
    }
    /* Room under the row, so the close control is not against the edge of the
       header and the title has somewhere to breathe. */
    .header { padding-bottom: var(--hemma-popup-header-gap, 10px); }
    .header-nav, .header-actions {
      flex: none;
      min-width: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;
    }
    /* The close glyph sits 25px in because a 24px icon is centered in a 48px
       target. An action pill has no such target, so without this it lands 8px
       from the edge and crowds the 28px corner radius. */
    .header-actions { padding-right: var(--hemma-popup-header-actions-pad, 12px); }
    /* Centered on the BAR, not between the nav and the actions - those are
       different widths, so centering between them is off by half the difference.
       Absolute, so the actions cannot push it; pointer-events off so it never
       eats a tap meant for the close control. */
    .header-content {
      position: absolute;
      /* Centered with auto margins, NOT a translate. The chrome entrance
         animates transform, and its final keyframe replaced a centering
         translateX(-50%) outright - which shifted the title right by half its
         own width once the animation settled. Nothing here may use transform. */
      left: 0;
      right: 0;
      margin-inline: auto;
      width: fit-content;
      max-width: calc(100% - 132px);
      padding: 10px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
      pointer-events: none;
    }
    /* .header-content is out of the flow now, so the actions need to be told
       to hold the trailing edge rather than sliding up against the close. */
    .header-actions { margin-left: auto; }
    .header-eyebrow {
      font-size: var(--ha-font-size-m, 14px);
      line-height: 16px;
      color: var(--hemma-popup-header-subtitle-color,
        var(--secondary-text-color, rgba(255, 255, 255, 0.55)));
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .header-title {
      font-size: var(--hemma-popup-header-title-size, 22px);
      line-height: var(--ha-line-height-condensed, 1.2);
      font-weight: var(--ha-font-weight-medium, 500);
      color: var(--hemma-popup-header-title-color,
        var(--primary-text-color, #fff));
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .header-eyebrow:empty, .header-title:empty { display: none; }
    /* A circle and a rectangle set to the same x do not read as aligned: the
       circle's edge is a tangent and only its widest point reaches the margin,
       so it looks further left than the flat edge beside it. A few pixels of
       indent is what makes them read as one gutter. */
    /* One gutter, two widths. A popup sets the desktop value; the phone value
       is the same for all of them because the content cards narrow together. */
    :host { --hemma-popup-gutter: var(--hemma-popup-gutter-wide, 26px);
            --hemma-popup-value-gap: var(--hemma-popup-value-gap-wide, 0px); }
    @media (max-width: 600px) {
      :host { --hemma-popup-gutter: var(--hemma-popup-gutter-phone, 14px);
              --hemma-popup-value-gap: 0px; }
    }
    /* Parked chart cards. Off screen but connected, so apexcharts keeps the
       chart it already drew instead of fetching and drawing it again. */
    .keep { position: absolute; left: -99999px; top: 0; width: 1px; height: 1px;
            overflow: hidden; pointer-events: none; }
    .header-close {
      transition: opacity 0.16s ease;
      appearance: none;
      -webkit-appearance: none;
      background: none;
      border: 0;
      margin: 0;
      padding: 0;
      width: 48px;
      height: 48px;
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      isolation: isolate;
      color: var(--hemma-popup-header-title-color,
        var(--primary-text-color, #fff));
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    }
    .header-close[hidden] { display: none; }
    .header-close svg {
      width: 24px;
      height: 24px;
      display: block;
      fill: currentColor;
    }
    /* HA's ha-icon-button: a currentColor disc at opacity 0 that comes up to
       0.1 on hover. Never visible at rest, so it never shows on a phone. */
    .header-close::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background-color: currentColor;
      opacity: 0;
      pointer-events: none;
      z-index: -1;
    }
    @media (hover: hover) {
      .header-close:hover:not([disabled])::after { opacity: 0.1; }
    }

    /* A chart fetches history first, so the shell is hidden and cross-dissolves
       in. The rule cannot live here - a popup's chart sits inside a
       button-card's shadow root, so this selector matches nothing. What stays
       is the safety net below, which walks shadow roots. */

    .content {
      /* Every ha-card inherits the theme's --ha-card-backdrop-filter and lays a
         SECOND one over .glass - the haze under the header. Null the VARIABLE,
         not the property: it is what ha-card's own :host rule reads, and it
         inherits through shadow boundaries to nested cards. */
      --ha-card-backdrop-filter: none;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      outline: none !important;
      scrollbar-width: none;
      -ms-overflow-style: none;
      animation: hemma-popup-fade var(--hemma-popup-enter, 260ms) ease-out;
    }
    .content::-webkit-scrollbar { display: none; }
    .content .container {
      padding: 8px 8px 20px 8px;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      outline: none !important;
    }

    hemma-popup-hass { display: none; }

    /* A frameless popup's surface is invisible, so its edges must never show: full screen, content in the old column. */
    @media (min-width: 769px) {
      :host([frameless]) .surface {
        width: 100vw; max-width: none; margin-top: 0; max-height: 100svh; border-radius: 0;
      }
      :host([frameless]) .header {
        position: absolute; top: 0; left: 0; right: 0; z-index: 2;
        padding-top: var(--hemma-popup-top, 112px); padding-bottom: 14px;
      }
      :host([frameless]) .header-bar {
        max-width: var(--popup-max-width, 600px); margin: 0 auto; box-sizing: border-box;
      }
      :host([frameless]) .header::before {
        content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
        opacity: 0; transition: opacity 220ms ease-in-out;
        backdrop-filter: blur(30px) saturate(1.3) brightness(0.72);
        -webkit-backdrop-filter: blur(30px) saturate(1.3) brightness(0.72);
      }
      :host([frameless]) .surface.scrolled .header::before { opacity: 1; }
      :host([frameless]) .content { padding-top: var(--hemma-popup-head-h, 132px); }
      :host([frameless]) .content .container {
        box-sizing: border-box; max-width: var(--popup-max-width, 600px); margin: 0 auto;
        padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px)) !important;
      }
    }

    @media (max-width: 768px) {
      .layer { align-items: flex-end; }

      /* The sheet's top edge IS the line the popup is cut off at, and the header
         bar has no vertical padding - so the close control sits hard against
         it. A negative value moves the clearance above the button instead. */
      .header-bar { padding-top: var(--hemma-popup-header-top-mobile, 10px); }
      .surface {
        width: 100%;
        max-width: none;
        margin-top: 0;
        /* Full height on every popup, the way more-info sizes its mobile sheet.
           Detents were tried and rejected: a sheet that is sometimes short and
           sometimes tall reads as a bug, and the hero needs the room. */
        height: var(--hemma-sheet-height, calc(100dvh - env(safe-area-inset-top, 0px)));
        min-height: var(--hemma-sheet-min, calc(100dvh - env(safe-area-inset-top, 0px)));
        max-height: calc(100dvh - env(safe-area-inset-top, 0px));
        border-radius: var(--hemma-sheet-radius, 24px) var(--hemma-sheet-radius, 24px) 0 0;
        box-shadow: none;
        animation: hemma-sheet-in 300ms cubic-bezier(0.32, 0.72, 0, 1);
      }
      .glass, .rim, .content { animation: none; }

      :host([closing]) .surface {
        animation: hemma-sheet-out 220ms ease-in forwards;
      }
      /* A swipe has already put the sheet where the keyframe would end. */
      :host([swipe-out]) .surface { animation: none !important; }
      .grab {
        display: block;
        flex: 0 0 auto;
        padding: 10px 0 2px;
        touch-action: none;
      }
      .grab span {
        display: block;
        width: 36px;
        height: 4px;
        margin: 0 auto;
        border-radius: 2px;
        background: var(--hemma-popup-grabber, rgba(255, 255, 255, 0.28));
      }
    }
  `;

  var LIVE_SCAN_MS = 2000;

  function collectLive(root, out) {
    var nodes;
    try { nodes = root.querySelectorAll('[data-hemma-live]'); } catch (e) { return out; }
    for (var i = 0; i < nodes.length; i++) out.push(nodes[i]);
    var kids;
    try { kids = root.querySelectorAll('*'); } catch (e) { return out; }
    for (var j = 0; j < kids.length; j++) {
      if (kids[j].shadowRoot) collectLive(kids[j].shadowRoot, out);
    }
    return out;
  }

  function refreshLive(root, hass, cache) {
    if (!root || !hass) return;
    // A popup with no live markers in its config never scans at all.
    if (cache && cache.none) return;
    var now = Date.now();
    if (!cache) {
      cache = { nodes: null, at: 0 };
    }
    if (!cache.nodes || now - cache.at > LIVE_SCAN_MS) {
      cache.nodes = collectLive(root, []);
      cache.at = now;
    }
    paintLive(cache.nodes, hass);
  }

  function paintLive(nodes, hass) {
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var st = hass.states[el.dataset.hemmaEnt];
      if (!st && el.dataset.hemmaLive !== 'fill') continue;
      if (el.dataset.hemmaLive === 'share') {
        var shSt = hass.states[el.dataset.hemmaEnt];
        var shTot = hass.states[el.dataset.hemmaTotal];
        if (!shSt || !shTot) continue;
        var shV = Number(shSt.state);
        var shT = Number(shTot.state);
        if (isNaN(shV) || isNaN(shT) || shT <= 0) { el.textContent = ''; continue; }
        var shPct = Math.round((shV / shT) * 100);
        var shSfx = el.dataset.hemmaSuffix || '%';
        el.textContent = shPct <= 0 ? ''
          : shSfx.indexOf('{n}') >= 0 ? shSfx.split('{n}').join(String(shPct)) : shPct + shSfx;
        continue;
      }
      if (el.dataset.hemmaLive === 'fill') {
        var fIds;
        try { fIds = JSON.parse(el.dataset.hemmaEnts || '[]'); } catch (e) { continue; }
        var fAttr = el.dataset.hemmaAttr || 'current_position';
        var fVals = [];
        for (var f = 0; f < fIds.length; f++) {
          var fSt = hass.states[fIds[f]];
          if (!fSt) continue;
          var fv = Number((fSt.attributes || {})[fAttr]);
          if (!isNaN(fv)) fVals.push(fv);
        }
        if (!fVals.length) continue;
        var fAvg = 0;
        for (var g = 0; g < fVals.length; g++) fAvg += fVals[g];
        fAvg = Math.max(0, Math.min(100, Math.round(fAvg / fVals.length)));
        el.style.height = (el.dataset.hemmaInvert === '1' ? 100 - fAvg : fAvg) + '%';
        continue;
      }
      if (el.dataset.hemmaLive === 'act') {
        var aspec;
        try { aspec = JSON.parse(el.dataset.hemmaAct || '{}'); } catch (e) { continue; }
        var arules = aspec.rules || [];
        var atest = function (c) {
          var v = c.attr === 'state' ? st.state : (st.attributes || {})[c.attr];
          if (c.has !== undefined) {
            return String(v == null ? '' : v).toLowerCase()
              .indexOf(String(c.has).toLowerCase()) !== -1;
          }
          if (c.eq !== undefined) return v === c.eq;
          return !!v;
        };
        var apick = null;
        for (var ai = 0; ai < arules.length && !apick; ai++) {
          var ar = arules[ai];
          if (atest(ar) && (ar.and || []).every(atest)) apick = ar;
        }
        if (!apick) apick = aspec;
        el.textContent = apick.text != null ? apick.text : '';
        if (apick.color) el.style.color = apick.color;
        el.style.display = apick.text === '' ? 'none' : '';
        continue;
      }
      if (el.dataset.hemmaLive === 'word') {
        var spec;
        try { spec = JSON.parse(el.dataset.hemmaWords || '{}'); } catch (e) { continue; }
        var sw = spec.state && spec.state[st.state];
        if (sw) { el.textContent = sw; continue; }
        var av = Number((st.attributes || {})[spec.attr]);
        if (isNaN(av)) {
          var fw = spec.fallbackState && spec.fallbackState[st.state];
          if (fw) el.textContent = fw;
          continue;
        }
        av = Math.round(av);
        var ex = spec.exact && spec.exact[String(av)];
        el.textContent = ex != null ? ex
          : String(spec.tpl || '{n}').replace('{n}', String(av));
        continue;
      }
      var raw = el.dataset.hemmaAttr === 'state'
        ? st.state : (st.attributes || {})[el.dataset.hemmaAttr];
      var n = Number(raw);
      if (isNaN(n)) continue;
      if (el.dataset.hemmaLive === 'bar') {
        el.style.width = Math.max(0, Math.min(100, n)) + '%';
      } else {
        el.textContent = window.hemmaNum(Math.round(n), 0, 0) + (el.dataset.hemmaSuffix || '');
      }
    }
  }

  class HemmaPopupHass extends HTMLElement {
    set hass(h) {
      this._hass = h;
      var t = this._targets || [];
      for (var i = 0; i < t.length; i++) { if (t[i]) t[i].hass = h; }
      var host = this.getRootNode && this.getRootNode();
      if (host) refreshLive(host, h, this._liveCache || (this._liveCache = {}));
    }
    get hass() { return this._hass; }
    set target(el) { this._targets = el ? [el] : []; }
    get target() { return (this._targets || [])[0] || null; }
    set targets(list) { this._targets = list || []; }
  }
  customElements.define('hemma-popup-hass', HemmaPopupHass);

  class HemmaPopup extends HTMLElement {
    constructor() {
      super();
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' + BASE_CSS + '</style><style id="dyn"></style>' +
        '<div class="scrim" part="scrim"></div>' +
        '<div class="layer">' +
          '<div class="surface" part="surface">' +
            '<div class="glass" part="glass"></div>' +
            '<div class="grab"><span></span></div>' +
            '<div class="header" hidden>' +
              '<div class="header-bar">' +
                '<section class="header-nav">' +
                  '<button class="header-close" type="button" aria-label="' + _hemmaL('ui.common.close', 'Close') + '">' +
                    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                      '<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>' +
                    '</svg>' +
                  '</button>' +
                '</section>' +
                '<section class="header-content">' +
                  '<div class="header-eyebrow"></div>' +
                  '<div class="header-title"></div>' +
                '</section>' +
                '<section class="header-actions"></section>' +
              '</div>' +
            '</div>' +
            '<div class="content" tabindex="-1"><div class="container"></div></div>' +
            '<div class="rim" part="rim"></div>' +
            '<div class="keep" aria-hidden="true"></div>' +
            '<hemma-popup-hass></hemma-popup-hass>' +
          '</div>' +
        '</div>';

      this.scrim = root.querySelector('.scrim');
      this.surface = root.querySelector('.surface');
      this.container = root.querySelector('.container');
      this.content = root.querySelector('.content');
      this._header = root.querySelector('.header');
      this._headerTitle = root.querySelector('.header-title');
      this._headerEyebrow = root.querySelector('.header-eyebrow');
      this._headerActions = root.querySelector('.header-actions');
      this._headerClose = root.querySelector('.header-close');
      this._headerContent = root.querySelector('.header-content');
      this._dyn = root.querySelector('#dyn');
      this._keep = root.querySelector('.keep');
      this._parked = new Map();
      this._bridge = root.querySelector('hemma-popup-hass');
      this.content.addEventListener('scroll', () => {
        this.surface.classList.toggle('scrolled', this.content.scrollTop > 2);
      }, { passive: true });
      if (window.ResizeObserver) {
        new ResizeObserver(() => {
          this.surface.style.setProperty('--hemma-popup-head-h', this._header.offsetHeight + 'px');
        }).observe(this._header);
      }

      this._dismissable = true;

      this._onKey = (e) => {
        if (e.key !== 'Escape' && e.key !== 'Esc') return;
        e.stopPropagation();
        this.dismiss();
      };
      this._onNav = () => {
        if (location.pathname === this._navPath) return;
        var ha = document.querySelector('home-assistant');
        if (ha && ha.shadowRoot && ha.shadowRoot.querySelector('ha-more-info-dialog')) return;
        if (Date.now() - (this._miOpenedAt || 0) < 1000) return;
        this.close();
      };

      // Only a gesture that BEGAN on the scrim dismisses. A tap on a tile can
      // finish on the scrim: the tile re-renders while the tap is dispatching,
      // so the click lands on whatever is underneath. Timing flags have to win
      // that race; where the finger went down does not.
      this.scrim.addEventListener('pointerdown', () => { this._scrimDown = true; }, true);
      document.addEventListener('pointerdown', (e) => {
        if (e.target !== this.scrim) this._scrimDown = false;
      }, true);
      this.scrim.addEventListener('click', () => {
        var began = this._scrimDown;
        this._scrimDown = false;
        if (began) this.dismiss();
      });

      this.content.addEventListener('pointerdown', (e) => {
        this._bgTap = { x: e.clientX, y: e.clientY,
                        slop: e.pointerType === 'mouse' ? 10 : 24 };
      }, true);
      this.content.addEventListener('click', (e) => {
        if (!this._bgDismiss || !this._dismissable) return;
        var d = this._bgTap;
        this._bgTap = null;
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > (d.slop || 10)) return;
        if (this._overWidget(e)) return;
        this.dismiss();
      });
      var closeTap = (e) => {
        var now = Date.now();
        if (now - (this._lastClose || 0) < 400) return;
        this._lastClose = now;
        e.preventDefault();
        e.stopPropagation();
        this.close();
      };
      this._headerClose.addEventListener('click', closeTap);
      this._headerClose.addEventListener('touchend', closeTap, { passive: false });
      this._bindSheetDrag(this.surface, root.querySelector('.grab'), this.content);
    }

    async open(data) {
      var cfg = data || {};
      var wasOpen = this.hasAttribute('open');

      this._dismissable = cfg.dismissable !== false;
      this._bgDismiss = cfg.dismiss_on_background === true;

      var isCard = !!cfg.content && typeof cfg.content === 'object';
      this.toggleAttribute('card', isCard);
      this.toggleAttribute('flat', cfg.flat === true);
      this.toggleAttribute('frameless', cfg.frameless === true);
      var hasHeader = !!(cfg.title || cfg.eyebrow);
      this._headerTitle.textContent = cfg.title || '';
      this._headerEyebrow.textContent = cfg.eyebrow || '';
      this._headerClose.hidden = cfg.close === false;
      this._header.hidden = !hasHeader;
      this._headerActions.textContent = '';
      this._dyn.textContent = this._dynamicCss(cfg);

      this.container.textContent = '';
      this._bridge.target = null;
      this.removeAttribute('data-hemma-charts-ready');
      if (this._chartPoll) { clearTimeout(this._chartPoll); this._chartPoll = null; }

      if (!wasOpen) {
        this.setAttribute('open', '');
        requestAnimationFrame(() => this.setAttribute('shown', ''));
        // Pinned invisible, entrance replayed below once the cards are in.
        this._holdChrome();
        document.addEventListener('keydown', this._onKey, true);
        this._navPath = location.pathname;
        window.addEventListener('location-changed', this._onNav, true);
        window.addEventListener('popstate', this._onNav, true);
        this._prevOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
      }

      if (hasHeader && cfg.header_actions && typeof cfg.header_actions === 'object') {
        await this._buildCard(cfg.header_actions, this._headerActions);
      }

      if (isCard) await this._buildCard(cfg.content);
      else if (cfg.content) this.container.textContent = String(cfg.content);

      if (!wasOpen) this._replayChrome();

      setTimeout(() => this._probe(), 900);   // after card_mod has landed

      this._gateOnCharts(isCard ? cfg.content : null);
    }


    _gateOnCharts(config) {
      if (this.hasAttribute('open')) this.setAttribute('data-hemma-charts-ready', '');
      var hasChart = false;
      try { hasChart = JSON.stringify(config || '').indexOf('custom:apexcharts-card') > -1; }
      catch (e) { hasChart = false; }
      if (!hasChart) return;
      if (this._chartPoll) clearTimeout(this._chartPoll);
      this._chartPoll = setTimeout(() => {
        this._chartPoll = null;
        if (!this.hasAttribute('open')) return;
        (function walk(node) {
          if (!node || !node.querySelectorAll) return;
          node.querySelectorAll('*').forEach((el) => {
            if (el.tagName === 'APEXCHARTS-CARD' && !el.hasAttribute('data-hemma-ready')) {
              el.setAttribute('data-hemma-ready', 'timeout');
            }
            if (el.shadowRoot) walk(el.shadowRoot);
          });
        })(this.shadowRoot);
      }, CHART_WAIT_MAX);
    }

    _probe() {
      if (!/[?&]hemmaprobe=1/.test(location.search)) return;
      var rows = [];
      var seen = new Set();
      var walk = (root, depth) => {
        if (!root || depth > 12 || seen.has(root)) return;
        seen.add(root);
        var els;
        try { els = root.querySelectorAll('*'); } catch (e) { return; }
        els.forEach((el) => {
          var cs, r;
          try { cs = getComputedStyle(el); r = el.getBoundingClientRect(); }
          catch (e) { return; }
          if (el.shadowRoot) walk(el.shadowRoot, depth + 1);
          if (r.width * r.height < 20000) return;
          var bg = cs.backgroundColor || '';
          var bd = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
          var bl = cs.mixBlendMode || 'normal';
          var wc = cs.willChange || 'auto';
          var op = cs.opacity;
          var painted = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
          if (!painted && bd === 'none' && bl === 'normal' && wc === 'auto' && op === '1') return;
          rows.push([
            el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
              + (typeof el.className === 'string' && el.className.trim()
                  ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
            Math.round(r.width) + 'x' + Math.round(r.height)
              + '@' + Math.round(r.left) + ',' + Math.round(r.top),
            painted ? 'bg=' + bg : '',
            bd !== 'none' ? 'backdrop=' + bd : '',
            bl !== 'normal' ? 'blend=' + bl : '',
            wc !== 'auto' ? 'wc=' + wc : '',
            op !== '1' ? 'opacity=' + op : '',
          ].filter(Boolean).join('  '));
        });
      };
      walk(this.shadowRoot, 0);
      var box = document.createElement('div');
      box.setAttribute('style', 'position:fixed;left:0;right:0;bottom:0;max-height:62vh;'
        + 'overflow:auto;z-index:2147483647;background:#000;color:#0f0;'
        + 'font:10px/1.35 ui-monospace,Menlo,monospace;padding:8px;white-space:pre-wrap;');
      box.textContent = 'HEMMA PROBE  (' + rows.length + ' painting elements, tap to dismiss)\n\n'
        + rows.join('\n');
      box.addEventListener('click', function () { box.remove(); });
      document.body.appendChild(box);
    }

    // Positional, not path-based: composedPath fails on a retargeted event.
    _overWidget(ev) {
      var x = ev.clientX, y = ev.clientY;
      if (typeof x !== 'number' || typeof y !== 'number') return false;
      var box;
      try { box = this.content.getBoundingClientRect(); } catch (e) { return true; }
      if (!box || !box.width || !box.height) return true;
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) return true;
      var hit = false;
      (function walk(root) {
        if (hit || !root || !root.querySelectorAll) return;
        var all;
        try { all = root.querySelectorAll('*'); } catch (e) { return; }
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          if (el.shadowRoot) walk(el.shadowRoot);
          if (hit) return;
          var r;
          try { r = el.getBoundingClientRect(); } catch (e) { continue; }
          if (!r.width || !r.height) continue;
          if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
          if (el.dataset && el.dataset.hemmaNodismiss !== undefined) { hit = true; return; }
          if (el.classList && el.classList.contains('hui-plate')) { hit = true; return; }
          var cs;
          try { cs = window.getComputedStyle(el); } catch (e) { continue; }
          if (!cs || cs.visibility === 'hidden' || cs.display === 'none') continue;
          var bd = cs.backdropFilter || cs.webkitBackdropFilter;
          if (bd && bd !== 'none') { hit = true; return; }
          var m = /^rgba?\(([^)]+)\)/.exec(cs.backgroundColor || '');
          if (!m) continue;
          var parts = m[1].split(',');
          if ((parts.length > 3 ? parseFloat(parts[3]) : 1) > 0.01) { hit = true; return; }
        }
      })(this.content);
      return hit;
    }

    _parkedHas(el) {
      var found = false;
      this._parked.forEach(function (v) { if (v === el) found = true; });
      return found;
    }

    // animation-name before opacity, never the other way round.
    _holdChrome() {
      var els = [this._headerClose, this._headerContent, this._headerActions];
      for (var i = 0; i < els.length; i++) {
        if (!els[i]) continue;
        els[i].style.animationName = 'none';
        els[i].style.opacity = '0';
      }
    }

    _replayChrome() {
      var els = [this._headerClose, this._headerContent, this._headerActions];
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el) continue;
        el.style.animationName = 'none';
        el.style.opacity = '';
        // Read it back, or the two writes coalesce and nothing restarts.
        void el.offsetWidth;
        el.style.animationName = '';
      }
    }

    dismiss() {
      if (Date.now() < (window._hemmaSuppressDismiss || 0)) return;
      if (this._dismissable) this.close();
    }

    close() {
      if (!this.hasAttribute('open') || this.hasAttribute('closing')) return;
      document.removeEventListener('keydown', this._onKey, true);
      window.removeEventListener('location-changed', this._onNav, true);
      window.removeEventListener('popstate', this._onNav, true);
      document.documentElement.style.overflow = this._prevOverflow || '';

      this.removeAttribute('shown');
      this.setAttribute('closing', '');

      var done = false;
      var finish = () => {
        if (done) return;
        done = true;
        this.removeAttribute('closing');
        this.removeAttribute('swipe-out');
        this.removeAttribute('open');
        this.removeAttribute('data-hemma-charts-ready');
        if (this._chartPoll) { clearTimeout(this._chartPoll); this._chartPoll = null; }
        this.surface.style.removeProperty('transform');
        this.surface.style.removeProperty('transition');
        var live = this.container.firstElementChild;
        if (live && this._keep && this._parkedHas(live)) this._keep.appendChild(live);
        this.container.textContent = '';
        this._bridge.target = null;
        this._dyn.textContent = '';
        this.dispatchEvent(new CustomEvent('hemma-popup-closed', { bubbles: true, composed: true }));
      };
      this.surface.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, 400);
    }

    _dynamicCss(cfg) {
      var out = ':host {\n' + (cfg.style || '') + '\n}\n';
      var list = Array.isArray(cfg.popup_styles) ? cfg.popup_styles : [];
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (!e || !e.styles) continue;
        var sel = (!e.style || e.style === 'all') ? ':host' : ':host([' + e.style + '])';
        out += sel + ' {\n' + retarget(e.styles) + '\n}\n';
      }
      return out;
    }

    async _buildCard(config, host) {
      var target = host || this.container;
      if (this._bridge) {
        var hasLive = false;
        try { hasLive = JSON.stringify(config || '').indexOf('data-hemma-live') > -1; }
        catch (e) { hasLive = true; }
        this._bridge._liveCache = { none: !hasLive, nodes: null, at: 0 };
      }
      var key = null;
      try {
        var cfgStr = JSON.stringify(config || '');
        if (cfgStr.indexOf('custom:apexcharts-card') > -1) key = target === this.container ? cfgStr : null;
      } catch (e) { key = null; }
      if (key && this._parked.has(key)) {
        var kept = this._parked.get(key);
        if (kept && kept.isConnected) {
          kept.hass = (this._bridge.hass || (document.querySelector('home-assistant') || {}).hass);
          target.textContent = '';
          target.appendChild(kept);
          this._syncTargets();
          return;
        }
        this._parked.delete(key);
      }

      var helpers = await cardHelpers();
      if (!helpers || !this.hasAttribute('open')) return;

      var el;
      try {
        el = await helpers.createCardElement(config);
      } catch (err) {
        console.error('hemma-popup: could not build the popup card', err);
        return;
      }
      if (!this.hasAttribute('open')) return;

      var ha = document.querySelector('home-assistant');
      if (ha && !this._bridge._provided) {
        this._bridge._provided = true;
        try { ha.provideHass(this._bridge); } catch (e) { this._bridge._provided = false; }
      }
      el.hass = (this._bridge.hass || (ha && ha.hass));

      el.addEventListener('ll-rebuild', () => {
        if (this.hasAttribute('open')) this._buildCard(config, target);
      }, { once: true });

      target.textContent = '';
      target.appendChild(el);
      this._syncTargets();
      if (key) {
        this._parked.set(key, el);
        // Two is enough to cover going back and forth between two popups.
        while (this._parked.size > 2) {
          var oldest = this._parked.keys().next().value;
          var drop = this._parked.get(oldest);
          this._parked.delete(oldest);
          if (drop && drop.parentNode) drop.parentNode.removeChild(drop);
        }
      }

      if (!customElements.get(el.localName)) {
        customElements.whenDefined(el.localName).then(() => {
          if (this.hasAttribute('open')) this._buildCard(config, target);
        });
      }
    }

    _syncTargets() {
      var list = [];
      var a = this.container.firstElementChild;
      var b = this._headerActions && this._headerActions.firstElementChild;
      if (a) list.push(a);
      if (b) list.push(b);
      this._bridge.targets = list;
    }

    _isSheet() {
      try { return window.matchMedia('(max-width: ' + SHEET_MAX + 'px)').matches; }
      catch (e) { return window.innerWidth <= SHEET_MAX; }
    }

    _bindSheetDrag(surface, grab, content) {
      var y0 = 0, dy = 0, tracking = false, dragging = false;

      var start = (e) => {
        if (!this._isSheet() || !this._dismissable) return;
        var t = e.touches ? e.touches[0] : e;
        y0 = t.clientY;
        dy = 0;
        dragging = false;
        var onGrab = e.composedPath && e.composedPath().indexOf(grab) !== -1;
        tracking = onGrab || content.scrollTop <= 0;
      };

      var move = (e) => {
        if (!tracking) return;
        var t = e.touches ? e.touches[0] : e;
        var d = t.clientY - y0;
        if (!dragging) {
          if (d < -4) { tracking = false; return; }
          if (d < 8) return;
          dragging = true;
          surface.style.transition = 'none';
        }
        dy = Math.max(0, d);
        if (e.cancelable) e.preventDefault();
        surface.style.transform = 'translateY(' + dy + 'px)';
      };

      var end = () => {
        if (!tracking) return;
        var moved = dragging, traveled = dy;
        tracking = false;
        dragging = false;
        if (!moved) return;

        if (traveled > Math.min(120, surface.offsetHeight * 0.25)) {
          this.setAttribute('swipe-out', '');
          surface.style.transition = 'transform 200ms ease-in';
          surface.style.transform = 'translateY(100%)';
          setTimeout(() => this.close(), 170);
          return;
        }
        surface.style.transition = 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)';
        surface.style.transform = 'translateY(0)';
        setTimeout(() => {
          surface.style.removeProperty('transform');
          surface.style.removeProperty('transition');
        }, 260);
      };

      surface.addEventListener('touchstart', start, { passive: true });
      surface.addEventListener('touchmove', move, { passive: false });
      surface.addEventListener('touchend', end);
      surface.addEventListener('touchcancel', end);
    }
  }
  customElements.define('hemma-popup', HemmaPopup);

  async function cardHelpers() {
    for (var i = 0; i < 120 && !window.loadCardHelpers; i++) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return window.loadCardHelpers ? window.loadCardHelpers() : null;
  }

  function popupHost() {
    var ha = document.querySelector('home-assistant');
    return (ha && ha.shadowRoot) || document.body;
  }

  var _el = null;
  function instance() {
    if (!_el) _el = document.createElement('hemma-popup');
    var host = popupHost();
    if (_el.parentNode !== host) host.appendChild(_el);
    return _el;
  }

  window.hemmaPopupAction = function () {
    return window.hemmaPopup ? 'fire-dom-event' : 'more-info';
  };

  window.hemmaPopup = {
    open: function (data) { return instance().open(data || {}); },
    close: function () { if (_el) _el.close(); },
    moreInfo: function (entityId, view) {
      var ha = document.querySelector('home-assistant');
      if (!ha || !entityId) return;
      ha.dispatchEvent(new CustomEvent('hass-more-info', {
        bubbles: true, composed: true, detail: { entityId: entityId, view: view },
      }));
    },
    get element() { return _el; },
    get surface() { return _el && _el.hasAttribute('open') ? _el.surface : null; },
    get enabled() { return flagOn(); },
    setEnabled: function (on) {
      window.HEMMA_POPUP = !!on;
      try { localStorage.setItem('hemma_popup', on ? '1' : '0'); } catch (e) {}
    },
  };

  window.addEventListener('ll-custom', function (ev) {
    if (!flagOn()) return;
    var cfg = ev.detail && ev.detail.hemma_popup;
    if (!cfg) return;
    // A tap that sets the mobile filter is not a tap that opens a popup. The
    // badge inherits its popup from hemma_popup_base, and button-card merges a
    // card's tap_action over the template's rather than replacing it, so one
    // event can carry both intentions.
    if (ev.detail.hemma_filter !== undefined || ev.detail.hemma_category !== undefined) return;
    ev.stopPropagation();
    window.hemmaPopup.open(cfg);
  }, true);
})();

(function () {
  if (window._hemmaDialogChrome) return;
  window._hemmaDialogChrome = true;

  var MARK = '_hemmaChrome';

  var SHEET_RADIUS =
    ':host([placement="bottom"]) dialog {' +
    '  border-start-start-radius: var(--hemma-sheet-radius, 24px) !important;' +
    '  border-start-end-radius: var(--hemma-sheet-radius, 24px) !important;' +
    '}';

  var GRAIN = `
    dialog { isolation: isolate; }
    dialog::before, dialog::after {
      content: var(--hemma-dialog-grain-content, none); position: absolute; inset: 0; border-radius: inherit;
      pointer-events: none; background-size: 180px 180px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    dialog::before { mix-blend-mode: overlay; opacity: var(--hemma-popup-grain, 0.10); }
    dialog::after  { mix-blend-mode: screen;  opacity: var(--hemma-popup-grain-dark, 0.04); }
  `;

  var NO_ENTRANCE =
    'dialog::backdrop { animation: none !important; transition: none !important; }';

  var STACKED_SCRIM =
    ':host([hemma-stacked]) dialog::backdrop {' +
    '  background-color: var(--hemma-stacked-scrim, transparent) !important;' +
    '  background-image: none !important;' +
    '  backdrop-filter: var(--hemma-stacked-scrim-backdrop, none) !important;' +
    '  -webkit-backdrop-filter: var(--hemma-stacked-scrim-backdrop, none) !important;' +
    '}';

  var DRAWER_SLIDE =
    '@keyframes hemma-drawer-in { from { translate: 0 100%; } to { translate: 0 0; } }' +
    ':host([placement="bottom"]) dialog { animation-name: hemma-drawer-in !important; }';

  var CSS_BY_HOST = {
    'wa-dialog':
      'dialog {' +
      '  margin-block-start: var(--hemma-popup-top, 112px) !important;' +
      '  max-block-size: calc(100dvh - var(--hemma-popup-top, 112px)' +
      '                  - var(--hemma-dialog-bottom-gap, 16px)) !important;' +
      '}' + NO_ENTRANCE + STACKED_SCRIM + GRAIN,
    'wa-drawer': NO_ENTRANCE + STACKED_SCRIM + DRAWER_SLIDE + SHEET_RADIUS + GRAIN,
  };

  // The sidebar is a wa-drawer too; only the bottom sheet counts as a dialog.
  function isDialogHost(el) {
    if (!el || !CSS_BY_HOST[el.localName]) return false;
    return el.localName !== 'wa-drawer' || el.getAttribute('placement') === 'bottom';
  }

  function injectInto(el) {
    if (!el || el[MARK] || !el.shadowRoot) return false;
    if (!isDialogHost(el)) return false;
    el[MARK] = true;
    var css = CSS_BY_HOST[el.localName];
    var st = document.createElement('style');
    st.textContent = css;
    el.shadowRoot.appendChild(st);
    return true;
  }

  function inject(root, depth) {
    if (!root || depth > 12 || !root.querySelectorAll) return;
    root.querySelectorAll('*').forEach(function (el) {
      if (CSS_BY_HOST[el.localName]) injectInto(el);
      if (el.shadowRoot) inject(el.shadowRoot, depth + 1);
    });
  }

  function sweep() { inject(document, 0); }

  function patchShowModal() {
    var P = window.HTMLDialogElement && HTMLDialogElement.prototype;
    if (!P || P._hemmaPatched) return;
    P._hemmaPatched = true;
    var orig = P.showModal;
    P.showModal = function () {
      try {
        var root = this.getRootNode();
        if (root && root.host && isDialogHost(root.host)) {
          injectInto(root.host);
          var hp = window.hemmaPopup && window.hemmaPopup.element;
          root.host.toggleAttribute('hemma-stacked', !!(hp && hp.hasAttribute('open')));
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
  }

  function patchClass() {
    if (!window.customElements || !customElements.whenDefined) return;
    customElements.whenDefined('wa-dialog').then(function () {
      var C = customElements.get('wa-dialog');
      if (!C || C.prototype._hemmaPatched) return;
      C.prototype._hemmaPatched = true;
      var orig = C.prototype.connectedCallback;
      C.prototype.connectedCallback = function () {
        if (orig) orig.apply(this, arguments);
        var self = this;
        if (injectInto(self)) return;
        requestAnimationFrame(function () { injectInto(self); });
        [0, 8, 30, 120].forEach(function (d) {
          setTimeout(function () { injectInto(self); }, d);
        });
      };
    }).catch(function () {});
  }

  function boot() {
    var ha = document.querySelector('home-assistant');
    if (!ha || !ha.shadowRoot) { setTimeout(boot, 200); return; }
    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        for (var j = 0; j < recs[i].addedNodes.length; j++) {
          var n = recs[i].addedNodes[j];
          if (n.localName && /-dialog$/.test(n.localName)) {
            [0, 30, 120, 300].forEach(function (d) { setTimeout(sweep, d); });
            return;
          }
        }
      }
    }).observe(ha.shadowRoot, { childList: true });
    patchShowModal();
    patchClass();
    sweep();
  }

  // A backdrop-filter's first paint builds its texture, so it cannot be animated from nothing.
  var WARM = ['--hemma-scrim-backdrop, blur(6px) saturate(1.35)'];

  function warmFilter() {
    try {
      WARM.forEach(function (f, i) {
        var w = document.createElement('div');
        w.style.cssText =
          'position:fixed;left:' + i + 'px;bottom:0;width:1px;height:1px;'
          + 'z-index:0;pointer-events:none;'
          + 'backdrop-filter:var(' + f + ');'
          + '-webkit-backdrop-filter:var(' + f + ');';
        document.body.appendChild(w);
        w.getBoundingClientRect();
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { w.remove(); });
        });
      });
    } catch (e) {}
  }

  patchShowModal();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(); warmFilter(); });
  } else {
    boot();
    warmFilter();
  }
})();

(function () {
  // The table may load before or after this file, so look it up per call.
  var _hemmaT = function (k, en, v) {
    if (typeof window._hemmaT === 'function') return window._hemmaT(k, en, v);
    var s = String(en);
    if (v) for (var p in v) s = s.split('{' + p + '}').join(String(v[p]));
    return s;
  };
  var _hemmaL = function (k, en) {
    var h = document.querySelector('home-assistant');
    var v = h && h.hass && h.hass.localize && h.hass.localize(k);
    return (v && v !== k) ? v : en;
  };
  if (window._hemmaUI) return;

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var T = {
    ink:  'var(--hemma-popup-tiles-text-primary, #fff)',
    ink2: 'var(--hemma-popup-tiles-text-secondary, rgba(255,255,255,0.56))',
    ink3: 'var(--hemma-popup-ui-tertiary, rgba(255,255,255,0.42))',
    fill: 'var(--hemma-popup-ui-fill, rgba(255,255,255,0.06))',
    fill2:'var(--hemma-popup-ui-fill-2, rgba(255,255,255,0.10))',
    div:  'var(--hemma-popup-ui-divider, rgba(255,255,255,0.08))',
    blue: 'var(--hemma-popup-ui-action, var(--hemma-color-teal, #00C3D0))',
    green:'var(--hemma-popup-ui-good, #30D158)',
    amber:'var(--hemma-popup-ui-warn, #FF9F0A)',
    red:  'var(--hemma-popup-ui-bad, #FF453A)',
    accent: 'var(--hemma-color-teal, #00C3D0)',
    font: 'var(--primary-font-family, system-ui)',
    controlH: 314,
    controlW: 120,
  };

  var tone = function (t) {
    return t === 'good' ? T.green : t === 'warn' ? T.amber : t === 'bad' ? T.red
      : t === 'accent' ? T.accent : null;
  };

  function headline(o) {
    o = o || {};
    if (o.barTitle && !o.state) return '';
    var out = '<div style="font-family:' + T.font + ';text-align:center;'
      + 'padding:' + (o.padTop != null ? o.padTop : 2) + 'px 8px '
      + (o.barTitle ? ((o.caption != null || o.captionSlot) ? 3 : 10) : 18)
      + 'px;">';
    if (!o.barTitle) {
      out += '<div style="font-size:clamp(28px, 4.2vw, 38px);font-weight:700;'
        + 'letter-spacing:-0.02em;line-height:1.1;color:' + T.ink + ';">'
        + esc(o.title || '') + '</div>';
    }
    if (o.state) {
      var sheet = o.measure === 'sheet';
      out += '<div style="font-size:' + (sheet ? '22px' : 'clamp(17px, 2.1vw, 21px)')
        + ';font-weight:400;letter-spacing:' + (sheet ? '-0.5px' : '-0.01em')
        + ';margin-top:3px;color:'
        + (tone(o.stateTone) || (sheet ? T.ink : T.ink2)) + ';">'
        + esc(o.state) + '</div>';
    }
    if (o.caption != null || o.captionSlot) {
      out += '<div' + (o.captionId ? ' id="' + esc(o.captionId) + '"' : '')
        + ' style="font-size:' + (o.measure === 'sheet' ? '15px' : '14px')
        + ';font-weight:400;letter-spacing:-0.006em;'
        + 'margin-top:5px;min-height:18px;color:' + T.ink3 + ';'
        + 'transition:opacity .3s ease;opacity:' + (o.caption ? '1' : '0') + ';">'
        + esc(o.caption || '') + '</div>';
    }
    return out + '</div>';
  }

  function hero(o) {
    o = o || {};
    if (o.compact) {
      var cInk = tone(o.subTone);
      var out = '<div style="font-family:' + T.font + ';text-align:left;'
        + 'display:flex;align-items:flex-start;justify-content:space-between;'
        + 'gap:12px;padding:2px 2px 10px;">'
        + '<div style="display:flex;flex-direction:column;gap:1px;min-width:0;">';
      if (o.label) {
        out += '<div style="font-size:var(--hemma-popup-hero-label-size, 13px);'
          + 'letter-spacing:-0.01em;color:' + T.ink2 + ';">'
          + esc(o.label) + '</div>';
      }
      out += '<div style="font-size:var(--hemma-popup-hero-value-size,'
        + ' clamp(21px, 3.4vw, 28px));font-weight:600;letter-spacing:-0.02em;'
        + 'line-height:1.1;min-width:0;color:' + T.ink + ';">' + esc(o.value);
      if (o.unit) {
        out += '<span style="font-size:var(--hemma-popup-hero-unit-size,'
          + ' clamp(13px, 1.9vw, 17px));font-weight:400;letter-spacing:0;'
          + 'color:' + T.ink2 + ';"> ' + esc(o.unit) + '</span>';
      }
      out += '</div>';
      if (o.sub) {
        out += '<div style="font-size:13px;margin-top:2px;color:'
          + (cInk || T.ink2) + ';">' + esc(o.sub) + '</div>';
      }
      out += '</div>';
      if (o.trailing) {
        out += '<div style="flex:none;text-align:right;white-space:nowrap;'
          + 'display:flex;flex-direction:column;gap:1px;">';
        if (o.trailingLabel) {
          out += '<div style="font-size:var(--hemma-popup-hero-label-size, 13px);'
            + 'letter-spacing:-0.01em;color:' + T.ink3 + ';">'
            + esc(o.trailingLabel) + '</div>';
        }
        out += '<div style="font-size:17px;font-weight:600;letter-spacing:-0.01em;'
          + 'color:' + T.ink2 + ';">' + esc(o.trailing) + '</div></div>';
      }
      return out + '</div>';
    }
    var c = !!o.center;
    var left = '<div style="display:flex;flex-direction:column;min-width:0;'
      + 'gap:' + (c ? '6px' : '2px') + ';'
      + (c ? 'align-items:center;text-align:center;' : '') + '">';
    if (o.label) {
      left += '<div style="font-size:15px;font-weight:400;letter-spacing:-0.01em;'
        + 'color:' + T.ink2 + ';">' + esc(o.label) + '</div>';
    }
    var big = String(o.value == null ? '' : o.value).length <= 6;
    left += '<div style="font-size:' + (c ? '36px' : big ? '40px' : '28px') + ';'
      + 'font-weight:' + (c ? '400' : '600') + ';'
      + 'letter-spacing:' + (c ? '-0.01em' : '-0.025em') + ';line-height:1.08;'
      + 'font-variant-numeric:tabular-nums;display:flex;align-items:baseline;gap:7px;'
      + (c ? 'justify-content:center;' : '') + 'color:' + T.ink + ';">'
      + esc(o.value);
    if (o.unit) {
      left += '<span style="font-size:19px;font-weight:400;letter-spacing:0;color:' + T.ink2 + ';">'
        + esc(o.unit) + '</span>';
    }
    left += '</div>';
    if (o.sub) {
      left += '<div style="font-size:' + (c ? '16px' : '14px') + ';'
        + 'color:' + (tone(o.subTone) || (c ? T.ink : T.ink2)) + ';">'
        + esc(o.sub) + '</div>';
    }
    left += '</div>';

    var right = '';
    if (o.chip && o.chip.text) {
      var chipInk = tone(o.chip.tone) || T.ink2;
      right = '<span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;'
        + 'font-weight:500;padding:5px 11px;border-radius:999px;background:' + T.fill + ';color:' + chipInk + ';">'
        + '<span style="width:7px;height:7px;border-radius:50%;background:currentColor;"></span>'
        + esc(o.chip.text) + '</span>';
    }

    return '<div style="font-family:' + T.font + ';display:flex;'
      + (c
          ? 'flex-direction:column;align-items:center;justify-content:center;gap:10px;'
            + 'padding:2px 4px 18px;text-align:center;'
          : 'align-items:flex-end;justify-content:space-between;gap:20px;'
            + 'padding:6px 4px 2px;text-align:left;')
      + '">' + left + right + '</div>';
  }

  var ICON_HUE = {
    light: 'var(--hemma-color-yellow, #FFCC00)',
    lamp: 'var(--hemma-color-yellow, #FFCC00)',
    bulb: 'var(--hemma-color-yellow, #FFCC00)',
    plex: 'var(--hemma-color-yellow, #FFCC00)',
    battery: 'var(--hemma-color-green, #30D158)',
    plant: 'var(--hemma-color-green, #30D158)',
    leaf: 'var(--hemma-color-green, #30D158)',
    energy: 'var(--hemma-color-green, #30D158)',
    power: 'var(--hemma-color-green, #30D158)',
    motion: 'var(--hemma-color-purple, #9333ea)',
    occupancy: 'var(--hemma-color-purple, #9333ea)',
    presence: 'var(--hemma-color-purple, #9333ea)',
    cellphone: 'var(--hemma-color-blue, #0A84FF)',
    phone: 'var(--hemma-color-blue, #0A84FF)',
    tablet: 'var(--hemma-color-blue, #0A84FF)',
    sunny: 'var(--hemma-color-yellow, #FFCC00)',
    beaker: 'var(--hemma-color-purple, #9333ea)',
  };

  function hueFor(name) {
    var n = String(name || '').toLowerCase();
    var keys = Object.keys(ICON_HUE);
    for (var i = 0; i < keys.length; i++) {
      if (n.indexOf(keys[i]) !== -1) return ICON_HUE[keys[i]];
    }
    return T.accent;
  }

  function icon(name, t) {
    if (!name) return '';
    var literal = (typeof t === 'string' && /^(var\(|#|rgb|hsl)/.test(t)) ? t : null;
    var fill = tone(t) || literal || hueFor(name);
    var tsz = 'var(--hemma-popup-icon-tile, 29px)';
    var tile = 'width:' + tsz + ';height:' + tsz + ';border-radius:7px;background:' + fill + ';flex:none;'
      + 'display:flex;align-items:center;justify-content:center;line-height:0;pointer-events:none;';
    if (String(name).indexOf(':') !== -1) {
      return '<div style="' + tile + '"><ha-icon icon="' + esc(name) + '" style="--mdc-icon-size:calc(' + tsz + ' * .62);'
        + 'width:calc(' + tsz + ' * .62);height:calc(' + tsz + ' * .62);color:#fff;display:flex;align-items:center;justify-content:center;'
        + 'line-height:0;"></ha-icon></div>';
    }
    var url = (typeof window.hemmaIconUrl === 'function')
      ? window.hemmaIconUrl(name) : '/local/hemma/icons/' + name + '.svg';
    return '<div style="' + tile + '"><div style="width:calc(' + tsz + ' * .586);height:calc(' + tsz + ' * .586);'
      + 'background-color:#fff;'
      + "-webkit-mask:url('" + url + "') center / contain no-repeat;"
      + "mask:url('" + url + "') center / contain no-repeat;\"></div></div>";
  }

  function group(rows, label, labelAction, opts) {
    rows = rows || [];
    var inside = !!(opts && opts.labelInside);
    var out = '';
    if (label && !inside) {
      out += '<div style="display:flex;align-items:baseline;justify-content:space-between;'
        + 'gap:12px;padding:0 4px 8px;">'
        + '<div style="font-size:15px;font-weight:600;letter-spacing:-0.01em;'
        + 'color:' + T.ink + ';">' + esc(label) + '</div>';
      if (labelAction && labelAction.text) {
        out += '<div class="hui-ga" style="font-size:15px;font-weight:500;'
          + 'color:' + (tone(labelAction.tone) || T.blue) + ';'
          + 'cursor:pointer;white-space:nowrap;letter-spacing:-0.01em;"'
          + (labelAction.svc ? ' data-hemma-svc="' + esc(JSON.stringify(labelAction.svc)) + '"' : '')
          + '>' + esc(labelAction.text) + '</div>';
      }
      out += '</div>';
    }
    out += '<style>'
      + 'ha-card.disabled{pointer-events:auto!important;}'
      + '.hui-row{transition:background-color .18s ease;}'
      + '@keyframes hemma-plate-hold{from,to{opacity:0;}}'
      + '@keyframes hemma-plate-in{'
      + 'from{opacity:0;transform:perspective(900px) translateZ(-70px);}'
      + 'to{opacity:1;transform:perspective(900px) translateZ(0);}}'
      + '.hui-plate{animation:var(--hemma-popup-plate-enter, none);'
      + 'animation-delay:var(--hemma-popup-plate-delay, 0ms);}'
      + '.hui-div{transition:opacity .18s ease;}'
      + '.hui-tap:active{background:' + T.fill2 + ';}'
      + '.hui-tap:active + .hui-div{opacity:0;}'
      + '.hui-div:has(+ .hui-tap:active){opacity:0;}'
      + '@media (hover:hover){'
      +   '.hui-tap:hover{background:var(--hemma-popup-row-hover, rgba(255,255,255,0.045));}'
      +   '.hui-tap:hover + .hui-div{opacity:0;}'
      +   '.hui-div:has(+ .hui-tap:hover){opacity:0;}'
      + '}'
      + '.hui-chev{opacity:var(--hemma-popup-chev-opacity, .35);'
      +   'flex:none;pointer-events:none;'
      +   'margin-inline-start:var(--hemma-popup-chev-gap, 0px);}'
      + '@media (min-width: 340px){'
      +   '.hui-sub{display:inline-block;max-width:100%;vertical-align:bottom;'
      +     'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
      +   '.hui-sub2::before{content:"\\00b7";opacity:.6;margin:0 .4em}'
      + '}'
      + '.hui-row{overflow:hidden;position:relative;--cf-w:88px;}'
      + '.hui-cf{position:absolute;top:12px;bottom:12px;right:8px;width:var(--cf-w);'
      +   'border-radius:calc(var(--hemma-popup-row-radius, 20px) - 9px);'
      +   'background:' + T.blue + ';color:#fff;font-size:14px;'
      +   'font-weight:560;display:grid;place-items:center;cursor:pointer;'
      +   'transform:translateX(calc(var(--cf-w) + 16px));'
      +   'transition:transform .36s cubic-bezier(.36,0,.16,1);}'
      // It is a button, so it answers the pointer like one.
      + '@media (hover:hover){.hui-cf:hover{filter:brightness(1.12);}}'
      + '.hui-cf:active{filter:brightness(0.94);}'
      + '.hui-row:not(.armed) .hui-cf{pointer-events:none;}'
      + '.hui-row.armed .hui-cf{transform:none;}'
      + '.hui-inner{display:flex;align-items:center;gap:12px;flex:1;min-width:0;'
      +   '--armed-x:0px;transform:translateX(var(--armed-x));'
      +   'transition:transform .36s cubic-bezier(.36,0,.16,1);}'
      + '.hui-row.armed .hui-inner{--armed-x:calc((var(--cf-w) + 16px) * -1);}'
      + '@media (prefers-reduced-motion:reduce){.hui-cf,.hui-inner{transition:none;}}'
      + '</style>';
    out += '<div class="hui-plate" style="background:var(--hemma-popup-row-fill, rgba(255,255,255,0.10));'
      + 'border-radius:var(--hemma-popup-row-radius, 20px);overflow:hidden;'
      + 'box-shadow:var(--hemma-popup-plate-shadow, none);'
      + 'backdrop-filter:var(--hemma-popup-plate-backdrop, none);'
      + '-webkit-backdrop-filter:var(--hemma-popup-plate-backdrop, none);">';
    if (label && inside) {
      out += '<div style="padding:var(--hemma-popup-row-pad-y, 8px)'
        + ' var(--hemma-popup-row-pad-x, 16px)'
        + ' var(--hemma-popup-group-label-gap, 10px);'
        + 'font-size:var(--hemma-popup-group-label-size, 15px);font-weight:600;'
        + 'letter-spacing:-0.01em;color:' + T.ink + ';">' + esc(label) + '</div>';
    }
    rows.forEach(function (r, i) {
      if (i) {
        out += '<div class="hui-div" style="height:1px;background:' + T.div
          + ';margin-left:calc(var(--hemma-popup-row-pad-x, 16px)'
          + ' + var(--hemma-popup-divider-inset, 0px));'
          + 'margin-right:var(--hemma-popup-row-pad-x, 16px);"></div>';
      }

      var arming = !!(r.svc && r.confirm);
      var armOnAction = !!(arming && r.entity && r.action);
      var tap = armOnAction
        ? ' data-hemma-mi="' + esc(r.entity) + '"'
        : arming
          ? ' data-hemma-arm=""'
          : (r.svc ? ' data-hemma-svc="' + esc(JSON.stringify(r.svc)) + '"'
                   : (r.entity ? ' data-hemma-mi="' + esc(r.entity) + '"' : ''));
      var tappable = arming || r.svc || r.entity || r.tappable;

      var lead;
      if (r.image !== undefined) {
        var plate = tone(r.iconTone)
          || ((typeof r.iconTone === 'string' && /^(var\(|#|rgb|hsl)/.test(r.iconTone))
                ? r.iconTone : null)
          || T.fill2;
        var psz = 'var(--hemma-popup-lead-plate, 32px)';
        lead = '<div style="width:' + psz + ';height:' + psz + ';border-radius:9px;flex:none;'
          + 'background:' + plate + ';display:grid;place-items:center;overflow:hidden;">'
          + (r.image
              ? '<img src="' + esc(r.image) + '" alt="" '
                + 'style="' + (r.imageFit === 'cover'
                    ? 'width:calc(' + psz + ' * .875);height:calc(' + psz + ' * .875);'
                      + 'border-radius:7px;object-fit:cover;'
                    : 'width:calc(' + psz + ' * .875);height:calc(' + psz + ' * .875);'
                      + 'object-fit:contain;')
                + 'display:block;">'
              : '<ha-icon icon="mdi:package-variant" style="--mdc-icon-size:19px;'
                + 'width:19px;height:19px;color:' + T.ink3 + ';"></ha-icon>')
          + '</div>';
      } else {
        lead = icon(r.icon, r.iconTone);
      }

      out += '<div class="hui-row' + (tappable ? ' hui-tap' : '') + '"' + tap
        + ' style="' + (tappable ? 'cursor:pointer;' : '')
        + 'display:flex;align-items:center;gap:12px;'
        + 'min-height:var(--hemma-popup-row-min, 52px);'
        + 'padding:var(--hemma-popup-row-pad-y, 8px) var(--hemma-popup-row-pad-x, 16px);">'
        + '<div class="hui-inner">'
        + lead
        + '<div style="flex:1;min-width:0;pointer-events:none;">'
        + '<div style="font-size:var(--hemma-popup-row-label-size, 17px);'
        + 'font-weight:var(--hemma-popup-row-label-weight, 400);'
        + 'letter-spacing:-0.022em;color:'
        + (tone(r.labelTone) || T.ink) + ';overflow:hidden;'
        + 'text-overflow:ellipsis;white-space:nowrap;">'
        // A dot stays visible beside a title that is cut short, so it sits outside the ellipsis.
        + (r.dot ? '<span style="display:flex;align-items:center;min-width:0;">'
          + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">' + esc(r.label) + '</span>'
          + '<span style="flex:none;width:7px;height:7px;border-radius:50%;background:' + r.dot
          + ';margin-inline-start:7px;"></span></span>' : esc(r.label)) + '</div>';

      if (r.sub) {
        var subs = Array.isArray(r.sub) ? r.sub : [r.sub];
        subs.forEach(function (line, si) {
          var sLive = '';
          if (si === 0 && r.subLive && r.entity && r.subLive.total) {
            sLive = ' data-hemma-live="share" data-hemma-ent="' + esc(r.entity) + '"'
              + ' data-hemma-total="' + esc(r.subLive.total) + '"'
              + ' data-hemma-suffix="' + esc(r.subLive.suffix || '%') + '"';
          }
          out += '<div class="hui-sub' + (si ? ' hui-sub2' : '') + '"' + sLive
            + ' style="font-size:var(--hemma-popup-sub-size, 13px);'
            + 'color:var(--hemma-popup-sub-color, ' + T.ink3 + ');overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
            + esc(line) + '</div>';
        });
      }
      if (r.bar != null) {
        var bt = tone(r.barTone) || T.ink2;
        var pct = Math.max(0, Math.min(1, r.bar)) * 100;
        var live = r.liveAttr && r.entity
          ? ' data-hemma-live="bar" data-hemma-ent="' + esc(r.entity)
            + '" data-hemma-attr="' + esc(r.liveAttr) + '"'
          : '';
        out += '<div style="height:4px;border-radius:999px;background:' + T.fill2
          + ';margin-top:7px;overflow:hidden;">'
          + '<div' + live + ' style="height:100%;width:' + pct.toFixed(1) + '%;'
          + 'border-radius:999px;background:' + bt + ';'
          + 'transition:width .3s cubic-bezier(.36,0,.16,1);"></div></div>';
      }
      out += '</div>';

      if (r.action) {
        var aLive = '';
        if (r.actionLive && r.entity) {
          aLive = ' data-hemma-live="act" data-hemma-ent="' + esc(r.entity) + '"'
            + ' data-hemma-act="' + esc(JSON.stringify(r.actionLive)) + '"';
        }
        out += '<div' + aLive + (armOnAction ? ' data-hemma-arm=""' : '')
          + ' style="font-size:var(--hemma-popup-row-action-size, 16px);'
          + 'font-weight:500;color:'
          + (tone(r.actionTone) || T.blue) + ';white-space:nowrap;'
          + (armOnAction
              ? 'pointer-events:auto;cursor:pointer;padding:8px 10px;margin:-8px -10px;'
              : 'pointer-events:none;')
          + '">' + esc(r.action) + '</div>';
      }
      if (r.value != null && r.value !== '') {
        var vlive = '';
        if (r.liveWords && r.entity) {
          vlive = ' data-hemma-live="word" data-hemma-ent="' + esc(r.entity)
            + '" data-hemma-words="' + esc(JSON.stringify(r.liveWords)) + '"';
        } else if (r.liveAttr && r.entity) {
          vlive = ' data-hemma-live="text" data-hemma-ent="' + esc(r.entity)
            + '" data-hemma-attr="' + esc(r.liveAttr) + '"'
            + ' data-hemma-suffix="' + esc(r.liveSuffix || '') + '"';
        }
        out += '<div' + vlive + ' style="font-size:var(--hemma-popup-row-value-size, 17px);'
          + 'letter-spacing:-0.022em;color:'
          + (tone(r.valueTone) || r.valueColor || T.ink2)
          + ';margin-inline-start:var(--hemma-popup-value-gap, 0px)'
          + ';white-space:nowrap;pointer-events:none;">'
          + esc(r.value) + '</div>';
      }
      if ((r.entity || r.tappable) && (!r.svc || armOnAction) && r.chev !== false) {
        out += '<svg class="hui-chev" width="7" height="12" viewBox="0 0 7 12" aria-hidden="true">'
          + '<path d="M1 1L6 6L1 11" fill="none" stroke="' + T.ink3 + '" stroke-width="2" '
          + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
      out += '</div>';   // .hui-inner

      if (arming) {
        out += '<div class="hui-cf" data-hemma-cf="' + esc(JSON.stringify(r.svc)) + '">'
          + esc(r.confirm === true ? _hemmaT('common.confirm', 'Confirm') : r.confirm) + '</div>';
      }
      out += '</div>';   // .hui-row
    });
    out += '</div>';

    return '<div style="font-family:' + T.font + ';text-align:left;">' + out + '</div>';
  }

  // series: [{ color, value, label }]
  function legend(series) {
    var out = '<div style="font-family:' + T.font + ';display:flex;gap:16px;padding:8px 4px 0;">';
    (series || []).forEach(function (s) {
      out += '<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:' + T.ink2 + ';'
        + 'font-variant-numeric:tabular-nums;">'
        + '<span style="width:8px;height:8px;border-radius:2px;background:' + s.color + ';"></span>'
        + '<b style="color:' + T.ink + ';font-weight:500;">' + esc(s.value) + '</b> ' + esc(s.label) + '</div>';
    });
    return out + '</div>';
  }

  if (!window._hemmaUIBound) {
    window._hemmaUIBound = true;
    var closeMediaOverlay = function (ov) {
      if (!ov || ov.hidden) return;
      if (ov._hemmaHidX) {
        ov._hemmaHidX.style.removeProperty('visibility');
        ov._hemmaHidX = null;
      }
      ov.classList.add('hui-closing');
      setTimeout(function () {
        ov.hidden = true;
        ov.classList.remove('hui-closing');
      }, 190);
    };
    var fire = function (ev) {
      if (Date.now() - (window._hemmaLastScrollTs || 0) < 400) return;
      var path = (ev.composedPath && ev.composedPath()) || [ev.target];
      for (var i = 0; i < path.length; i++) {
        var t = path[i];
        if (t && t.classList && t.classList.contains('hui-cf')) {
          if (Date.now() - (window._hemmaUILastTap || 0) < 400) return;
          window._hemmaUILastTap = Date.now();
          try {
            var cs = JSON.parse(t.dataset.hemmaCf);
            var ha3 = document.querySelector('home-assistant');
            if (ha3 && ha3.hass && cs && cs.domain) {
              ha3.hass.callService(cs.domain, cs.service, cs.data || {}, cs.target || undefined);
            }
          } catch (err) { console.error('hemma: bad confirm row', err); }
          if (t.parentNode && t.parentNode.classList) t.parentNode.classList.remove('armed');
          ev.preventDefault(); ev.stopPropagation();
          return;
        }
        if (t && t.dataset && t.dataset.hemmaMedia !== undefined) {
          if (Date.now() - (window._hemmaUILastTap || 0) < 400) return;
          window._hemmaUILastTap = Date.now();
          window._hemmaSuppressDismiss = Date.now() + 600;
          var shelf = t.closest && t.closest('.hui-mrow');
          var wrapM = shelf && shelf.parentElement;
          var ov = wrapM && wrapM.querySelector && wrapM.querySelector('.hui-mov');
          if (ov) {
            var vv = window.visualViewport;
            var vw = (vv && vv.width) || window.innerWidth;
            var vh = (vv && vv.height) || window.innerHeight;
            var place = function () {
              ov.style.left = '0px'; ov.style.top = '0px';
              ov.style.right = 'auto'; ov.style.bottom = 'auto';
              ov.style.width = vw + 'px';
              ov.style.height = vh + 'px';
              var r0 = ov.getBoundingClientRect();
              ov.style.left = (r0.left ? -r0.left : 0) + 'px';
              ov.style.top = (r0.top ? -r0.top : 0) + 'px';
              var host = ov.getRootNode && ov.getRootNode().host;
              var pop = host;
              while (pop && !(pop.shadowRoot
                     && pop.shadowRoot.querySelector('.header-close'))) {
                pop = pop.parentElement
                  || (pop.getRootNode && pop.getRootNode().host);
              }
              var cls = pop && pop.shadowRoot.querySelector('.header-close');
              if (cls) {
                var cr = cls.getBoundingClientRect();
                if (cr.height) {
                  ov.style.paddingTop = Math.max(0, cr.top) + 'px';
                  var bk = ov.querySelector('.hui-mback');
                  var col = ov.querySelector('.hui-movin');
                  if (bk && col) {
                    bk.style.marginLeft = '0px';
                    var br = col.getBoundingClientRect();
                    bk.style.marginLeft = (cr.left - br.left) + 'px';
                  }
                  ov._hemmaHidX = cls;
                  cls.style.visibility = 'hidden';
                }
              }
            };
            ov.hidden = false;
            place();
            requestAnimationFrame(place);
            if (ov._hemmaPlace) window.removeEventListener('resize', ov._hemmaPlace);
            ov._hemmaPlace = function () {
              if (ov.hidden) return;
              vw = (vv && vv.width) || window.innerWidth;
              vh = (vv && vv.height) || window.innerHeight;
              place();
            };
            window.addEventListener('resize', ov._hemmaPlace);
            var want = t.dataset.hemmaMedia;
            ov.querySelectorAll('.hui-mdet').forEach(function (d) {
              d.hidden = d.dataset.i !== want;
              if (!d.hidden) { d.style.animation = 'none'; void d.offsetWidth; d.style.animation = ''; }
            });
            ov.hidden = false;
          }
          ev.preventDefault(); ev.stopPropagation();
          return;
        }
        if (t && t.classList && t.classList.contains('hui-mback')) {
          window._hemmaSuppressDismiss = Date.now() + 600;
          closeMediaOverlay(t.closest ? t.closest('.hui-mov') : null);
          ev.preventDefault(); ev.stopPropagation();
          return;
        }
        // Anywhere on the overlay that is not the detail itself closes it.
        if (t && t.classList && t.classList.contains('hui-mov')) {
          window._hemmaSuppressDismiss = Date.now() + 600;
          closeMediaOverlay(t);
          ev.preventDefault(); ev.stopPropagation();
          return;
        }
        if (t && t.dataset && t.dataset.hemmaArm !== undefined) {
          if (Date.now() - (window._hemmaUILastTap || 0) < 400) return;
          window._hemmaUILastTap = Date.now();
          // The marker may sit on the row or on its action label.
          var armRow = (t.classList && t.classList.contains('hui-row')) ? t
            : (t.closest ? t.closest('.hui-row') : null);
          if (!armRow) return;
          var rt = t.getRootNode && t.getRootNode();
          if (rt && rt.querySelectorAll) {
            rt.querySelectorAll('.hui-row.armed').forEach(function (o) {
              if (o !== armRow) o.classList.remove('armed');
            });
          }
          armRow.classList.toggle('armed');
          ev.preventDefault(); ev.stopPropagation();
          return;
        }
        if (t && t.dataset && t.dataset.hemmaSvc) {
          if (Date.now() - (window._hemmaUILastTap || 0) < 400) return;
          window._hemmaUILastTap = Date.now();
          try {
            var spec = JSON.parse(t.dataset.hemmaSvc);
            var ha2 = document.querySelector('home-assistant');
            if (ha2 && ha2.hass && spec && spec.domain && spec.service) {
              ha2.hass.callService(spec.domain, spec.service, spec.data || {}, spec.target || undefined);
            }
          } catch (err) { console.error('hemma: bad service row', err); }
          ev.preventDefault(); ev.stopPropagation();
          return;
        }
        if (t && t.dataset && t.dataset.hemmaMi) {
          if (Date.now() - (window._hemmaUILastTap || 0) < 400) return;
          window._hemmaUILastTap = Date.now();
          var ha = document.querySelector('home-assistant');
          if (ha) {
            var el = window.hemmaPopup && window.hemmaPopup.element;
            if (el) el._miOpenedAt = Date.now();
            ha.dispatchEvent(new CustomEvent('hass-more-info', {
              bubbles: true, composed: true, detail: { entityId: t.dataset.hemmaMi },
            }));
          }
          return;
        }
      }
    };
    var TAP_SLOP = 10;
    var tp = null;
    document.addEventListener('touchstart', function (ev) {
      var t0 = ev.touches && ev.touches[0];
      tp = t0 ? { x: t0.clientX, y: t0.clientY, moved: false } : null;
    }, { capture: true, passive: true });
    document.addEventListener('touchmove', function (ev) {
      if (!tp) return;
      var t1 = ev.touches && ev.touches[0];
      if (!t1) return;
      if (Math.abs(t1.clientX - tp.x) > TAP_SLOP
        || Math.abs(t1.clientY - tp.y) > TAP_SLOP) {
        tp.moved = true;
        window._hemmaLastScrollTs = Date.now();
      }
    }, { capture: true, passive: true });
    document.addEventListener('touchcancel', function () { tp = null; },
      { capture: true, passive: true });
    document.addEventListener('click', fire, true);
    document.addEventListener('touchend', function (ev) {
      var moved = !!(tp && tp.moved);
      tp = null;
      if (moved) return;
      fire(ev);
    }, true);

    var drag = null;
    var pctFrom = function (el, clientY) {
      var b = el.getBoundingClientRect();
      if (!b.height) return 0;
      var p = (b.bottom - clientY) / b.height * 100;
      return Math.max(0, Math.min(100, Math.round(p)));
    };
    var paint = function (el, pct) {
      var fill = el.querySelector('.hui-sl-fill');
      if (!fill) return;
      var inv = false;
      try { inv = !!JSON.parse(el.dataset.hemmaSlider).invert; } catch (e) {}
      fill.style.height = (inv ? 100 - pct : pct) + '%';
    };
    document.addEventListener('pointerdown', function (ev) {
      var path = (ev.composedPath && ev.composedPath()) || [ev.target];
      for (var i = 0; i < path.length; i++) {
        var el = path[i];
        if (el && el.dataset && el.dataset.hemmaSlider !== undefined) {
          drag = { el: el, pct: pctFrom(el, ev.clientY) };
          el.classList.add('drag');
          paint(el, drag.pct);
          ev.preventDefault();
          return;
        }
      }
    }, true);
    document.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      drag.pct = pctFrom(drag.el, ev.clientY);
      paint(drag.el, drag.pct);
      ev.preventDefault();
    }, true);
    var endDrag = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.el.classList.remove('drag');
      try {
        var spec = JSON.parse(d.el.dataset.hemmaSlider);
        var ha = document.querySelector('home-assistant');
        if (ha && ha.hass && spec && spec.domain) {
          var data = {};
          data[spec.field || 'position'] = d.pct;
          ha.hass.callService(spec.domain, spec.service, data, spec.target || undefined);
        }
      } catch (err) { console.error('hemma: bad slider', err); }
    };
    document.addEventListener('pointerup', endDrag, true);
    document.addEventListener('pointercancel', endDrag, true);
  }

  function shelf(items, label) {
    items = items || [];
    var out = '';
    if (label) {
      out += '<div style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:'
        + T.ink + ';padding:0 4px 10px;">' + esc(label) + '</div>';
    }
    out += '<style>'
      + '.hui-shelf{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x proximity;'
      +   '-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:2px 4px 4px;}'
      + '.hui-shelf::-webkit-scrollbar{display:none;}'
      + '.hui-art{flex:0 0 auto;width:136px;scroll-snap-align:start;}'
      + '.hui-art .p{position:relative;width:136px;height:204px;border-radius:12px;'
      +   'overflow:hidden;background:' + T.fill + ';'
      +   'box-shadow:0 8px 22px -10px rgba(0,0,0,.75);'
      +   'transition:transform .2s cubic-bezier(.36,0,.16,1);}'
      + '.hui-art .p::after{content:"";position:absolute;inset:0;border-radius:inherit;'
      +   'box-shadow:inset 0 0 0 1px rgba(255,255,255,.10);pointer-events:none;}'
      + '.hui-art img{width:100%;height:100%;object-fit:cover;display:block;}'
      + '.hui-art .t{font-size:15px;font-weight:500;color:' + T.ink + ';margin-top:9px;'
      +   'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
      + '.hui-cap{display:flex;align-items:center;gap:6px;margin-top:4px;}'
      + '.hui-pill{font-size:11px;font-weight:600;letter-spacing:.02em;padding:2px 7px;'
      +   'border-radius:999px;white-space:nowrap;flex:none;background:' + T.fill2 + ';'
      +   'color:' + T.ink2 + ';font-variant-numeric:tabular-nums;}'
      + '.hui-when{font-size:13px;color:' + T.ink3 + ';overflow:hidden;'
      +   'text-overflow:ellipsis;white-space:nowrap;}'
      + '.hui-art .n{position:absolute;top:8px;right:8px;width:10px;height:10px;'
      +   'border-radius:50%;background:' + T.blue + ';box-shadow:0 0 0 2px rgba(0,0,0,.45);}'
      + '@media (hover:hover){.hui-art:hover .p{transform:scale(1.035);}}'
      + '@media (prefers-reduced-motion:reduce){.hui-art .p{transition:none;}}'
      + '</style>';
    out += '<div class="hui-shelf">';
    items.forEach(function (it) {
      out += '<div class="hui-art"><div class="p">'
        + (it.image
            ? '<img src="' + esc(it.image) + '" loading="lazy" alt=""/>'
            : '<div style="width:100%;height:100%;display:flex;align-items:center;'
              + 'justify-content:center;color:' + T.ink3 + ';font-size:24px;">\u25b6</div>')
        + (it.unwatched ? '<div class="n"></div>' : '')
        + '</div>'
        + '<div class="t">' + esc(it.title) + '</div>';
      if (it.badge || it.meta) {
        out += '<div class="hui-cap">';
        if (it.badge) out += '<span class="hui-pill">' + esc(it.badge) + '</span>';
        if (it.meta) out += '<span class="hui-when">' + esc(it.meta) + '</span>';
        out += '</div>';
      }
      out += '</div>';
    });
    out += '</div>';
    return '<div style="font-family:' + T.font + ';text-align:left;">' + out + '</div>';
  }

  function prime(urls) {
    var seen = window._hemmaImgPrimed || (window._hemmaImgPrimed = new Set());
    var todo = [];
    (urls || []).forEach(function (u) {
      if (!u || seen.has(u)) return;
      seen.add(u);
      todo.push(u);
    });
    if (!todo.length) return;
    var go = function () {
      todo.forEach(function (u) {
        var im = new Image();
        try { im.fetchPriority = 'low'; } catch (e) {}
        im.decoding = 'async';
        im.src = u;
      });
    };
    if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 4000 });
    else setTimeout(go, 1200);
  }

  function mediaRow(items, label, opts) {
    items = items || [];
    opts = opts || {};
    var base = opts.base == null ? 0.08 : Number(opts.base);
    var step = opts.step == null ? 0.028 : Number(opts.step);
    var first = Number(opts.index) || 0;
    var delay = function (i) { return (base + (first + i) * step).toFixed(3) + 's'; };
    var out = '';
    if (label) {
      out += '<div class="hui-mlabel" style="--hui-d:' + delay(0) + ';">'
        + esc(label) + '</div>';
    }
    out += '<style>'
      + '.hui-mrow{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));'
      +   'gap:26px 30px;padding:2px var(--hui-gutter, var(--hemma-popup-gutter, 26px)) 4px;}'
      + '@media (max-width: 900px){.hui-mrow{grid-template-columns:repeat(2, minmax(0, 1fr));}}'
      + '@media (max-width: 640px){.hui-mrow{grid-template-columns:minmax(0, 1fr);'
      +   'gap:var(--hui-mrow-gap-phone, 32px);}}'
      + '.hui-m{min-width:0;padding:0;border-radius:18px;}'
      + '.hui-m .fa{position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;'
      +   'overflow:hidden;background:' + T.fill + ';'
      +   'box-shadow:0 10px 26px -12px rgba(0,0,0,.8);}'
      + '.hui-m .fa::after{content:"";position:absolute;inset:0;border-radius:inherit;'
      +   'box-shadow:inset 0 0 0 1px rgba(255,255,255,.10);pointer-events:none;}'
      + '.hui-m img{width:100%;height:100%;object-fit:cover;display:block;}'
      + '.hui-m .w{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;'
      +   'color:' + T.ink3 + ';margin-top:10px;overflow:hidden;'
      +   'text-overflow:ellipsis;white-space:nowrap;}'
      + '.hui-m .h,.hui-m .hm{font-size:16px;font-weight:600;letter-spacing:-0.01em;'
      +   'color:' + T.ink + ';margin-top:2px;overflow:hidden;'
      +   'text-overflow:ellipsis;white-space:nowrap;}'
      + '.hui-m .e{font-size:13px;color:' + T.ink2 + ';margin-top:2px;overflow:hidden;'
      +   'text-overflow:ellipsis;white-space:nowrap;}'
      + '.hui-m .hm,.hui-m .e{display:none;}'
      + '.hui-m .s{font-size:14px;line-height:1.42;color:' + T.ink2 + ';margin-top:4px;'
      +   'white-space:normal !important;overflow-wrap:anywhere;'
      +   'display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;'
      +   'overflow:hidden;max-height:calc(1.42em * 5);}'
      + '.hui-m .ck{position:absolute;top:8px;right:8px;width:26px;height:26px;'
      +   'border-radius:50%;background:rgba(0,0,0,.64);display:grid;'
      +   'place-items:center;box-shadow:0 1px 3px rgba(0,0,0,.30),'
      +   'inset 0 0 0 0.5px rgba(255,255,255,.18);}'
      + '.hui-m .ck svg{width:15px;height:15px;display:block;}'
      + '@media (max-width: 640px){'
      +   '.hui-m.split .h{display:none;}'
      +   '.hui-m .hm,.hui-m .e{display:block;}'
      +   '.hui-m .s{display:none;}'
      +   '.hui-mlabel{--hui-label-size:24px;--hui-label-gap:10px;'
      +     '--hui-label-weight:700;--hui-label-track:-0.02em;}}'
      + '@media (max-width: 640px){.hui-mlabel{--hui-label-size:17px;}}'
      + '@keyframes hui-m-in{from{opacity:0;transform:translateY(10px) scale(0.986);}'
      +   'to{opacity:1;transform:none;}}'
      + '@keyframes hui-tx-in{from{opacity:0.2;transform:scale(0.972) translateY(5px);}'
      +   'to{opacity:1;transform:none;}}'
      + '.hui-mlabel{font-size:var(--hui-label-size, 17px);'
      +   'font-weight:var(--hui-label-weight, 600);'
      +   'letter-spacing:var(--hui-label-track, -0.01em);color:' + T.ink + ';'
      +   'padding:0 var(--hui-gutter, var(--hemma-popup-gutter, 26px)) var(--hui-label-gap, 10px);'
      +   'transform-origin:0% 40%;'
      +   'animation:hui-tx-in var(--hui-tx-dur, .28s) cubic-bezier(0.32, 0.72, 0, 1) both;'
      +   'animation-delay:var(--hui-d, 0s);}'
      + '.hui-m{animation:hui-m-in var(--hui-cell-dur, .28s) cubic-bezier(0.16, 1, 0.3, 1) backwards;'
      +   'animation-delay:var(--hui-d, 0s);}'
      + '.hui-m .w,.hui-m .h,.hui-m .hm,.hui-m .e,.hui-m .s{transform-origin:0% 40%;'
      +   'animation:hui-tx-in var(--hui-tx-dur, .28s) cubic-bezier(0.32, 0.72, 0, 1) both;}'
      + '.hui-m .w{animation-delay:calc(var(--hui-d, 0s) + .03s);}'
      + '.hui-m .h,.hui-m .hm{animation-delay:calc(var(--hui-d, 0s) + .045s);}'
      + '.hui-m .e,.hui-m .s{animation-delay:calc(var(--hui-d, 0s) + .06s);}'
      + '.hui-m .fa img{opacity:0;transition:opacity .24s ease;}'
      + '.hui-m .fa.rdy img{opacity:1;}'
      + '@media (prefers-reduced-motion:reduce){'
      +   '.hui-mlabel,.hui-m,.hui-m .w,.hui-m .h,.hui-m .hm,.hui-m .e,'
      +   '.hui-m .s{animation:none;}'
      +   '.hui-m .fa img{transition:none;}}'
      + (opts.tiles
          ? '.hui-m{position:relative;border-radius:var(--hemma-popup-row-radius, 20px);'
          +   'overflow:hidden;box-shadow:var(--hemma-popup-plate-shadow, none);'
          +   'background:var(--hemma-popup-row-fill, rgba(255,255,255,0.10));}'
          + '.hui-m .fa{position:relative;width:100%;aspect-ratio:16/9;'
          +   'border-radius:0;margin:0;overflow:hidden;}'
          + '.hui-m .fa img{width:100%;height:100%;object-fit:cover;display:block;}'
          + '.hui-m .ph{width:100%;height:100%;display:flex;align-items:center;'
          +   'justify-content:center;color:' + T.ink3 + ';font-size:26px;}'
          + '.hui-m .sc{position:absolute;inset:auto 0 0 0;height:48%;'
          +   'background:linear-gradient(to top,'
          +     'rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.44) 38%,'
          +     'rgba(0,0,0,0.16) 70%,rgba(0,0,0,0) 100%);'
          +   'pointer-events:none;}'
          + '.hui-m .cap{position:absolute;left:0;right:0;bottom:0;'
          +   'padding:0 14px 12px;pointer-events:none;}'
          + '.hui-m .cap .t{font-size:16px;font-weight:600;letter-spacing:-0.01em;'
          +   'color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);'
          +   'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
          + '.hui-m .cap .yr{font-weight:400;color:rgba(255,255,255,0.72);}'
          + '.hui-m .cap .l2{font-size:13px;margin-top:1px;'
          +   'color:rgba(255,255,255,0.62);text-shadow:0 1px 3px rgba(0,0,0,0.5);'
          +   'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
          + '.hui-m .rt{position:absolute;top:10px;left:10px;'
          +   'font-size:12px;font-weight:600;color:#fff;'
          +   'padding:4px 9px;border-radius:999px;'
          +   'background:rgba(0,0,0,0.55);'
          +   'backdrop-filter:var(--hemma-popup-tile-backdrop, none);'
          +   '-webkit-backdrop-filter:var(--hemma-popup-tile-backdrop, none);}'
          + '.hui-m .ck{top:10px;right:10px;}'
          + '.hui-m{transition:transform .2s ease, box-shadow .2s ease;'
          +   'transform:scale(1);}'
          + '@media (hover:hover){'
          +   '.hui-m:hover{transform:scale(1.014);'
          +     'box-shadow:var(--hemma-popup-plate-shadow-hover,'
          +     ' 0 22px 48px -20px rgba(0,0,0,0.58), 0 3px 10px -5px rgba(0,0,0,0.34));}'
          + '}'
          + '@media (hover:hover){.hui-m:hover .fa img{transform:scale(1.022);}}'
          + '.hui-m .fa img{transition:transform .3s cubic-bezier(0.16, 1, 0.3, 1);}'
          + '.hui-m:active{transform:scale(0.99);}'
          + '.hui-m{cursor:pointer;}'
          + '.hui-mov{position:fixed;inset:0;z-index:20;display:grid;'
          +   'align-items:start;justify-items:center;padding:24px;'
          +   'box-sizing:border-box;'
          // Blur only - the darkening read as a scrim on top of the popup's own.
          +   'backdrop-filter:var(--hemma-media-overlay-backdrop,blur(18px));'
          +   '-webkit-backdrop-filter:var(--hemma-media-overlay-backdrop,blur(18px));}'
          + '.hui-mov[hidden]{display:none;}'
          + '.hui-mov{transition:opacity .19s ease,'
          +   'backdrop-filter .19s ease,-webkit-backdrop-filter .19s ease;}'
          + '.hui-mov.hui-closing{opacity:0;'
          +   'backdrop-filter:var(--hemma-media-overlay-backdrop,blur(0px));'
          +   '-webkit-backdrop-filter:var(--hemma-media-overlay-backdrop,blur(0px));}'
          + '.hui-mdet{transition:transform .19s cubic-bezier(0.4, 0, 1, 1);}'
          + '.hui-mov.hui-closing .hui-mdet{transform:scale(0.97);}'
          + '.hui-mdet[hidden]{display:none;}'
          + '.hui-movin{width:min(760px, 100%);max-height:100%;min-height:0;'
          +   'display:flex;flex-direction:column;align-items:flex-start;gap:18px;}'
          + '.hui-mback{width:48px;height:48px;border-radius:50%;position:relative;'
          +   'flex:none;display:flex;align-items:center;justify-content:center;'
          +   'cursor:pointer;pointer-events:auto;transition:transform .15s ease;'
          +   'background:var(--hemma-popup-row-fill, rgba(255,255,255,0.10));'
          +   'backdrop-filter:var(--hemma-popup-plate-backdrop, none);'
          +   '-webkit-backdrop-filter:var(--hemma-popup-plate-backdrop, none);'
          +   'box-shadow:var(--hemma-popup-plate-shadow, none);}'
          + '.hui-mback:active{transform:scale(0.94);}'
          + '.hui-mdet{width:100%;flex:1 1 auto;min-height:0;overflow:auto;'
          +   'scrollbar-width:none;'
          +   'border-radius:var(--hemma-popup-row-radius, 20px);'
          +   'background:var(--hemma-popup-row-fill, rgba(255,255,255,0.10));'
          +   'box-shadow:var(--hemma-popup-detail-shadow,'
          +   ' 0 10px 30px -22px rgba(0,0,0,0.45));'
          // The same depth entrance everything else uses.
          +   'animation:hemma-plate-in 320ms cubic-bezier(0.2,0.8,0.3,1) both;}'
          + '.hui-mdet::-webkit-scrollbar{display:none;}'
          + '.hui-mdet .fa{width:100%;aspect-ratio:16/9;overflow:hidden;'
          +   'border-radius:var(--hemma-popup-row-radius, 20px)'
          +   ' var(--hemma-popup-row-radius, 20px) 0 0;}'
          + '.hui-mdet .fa img{width:100%;height:100%;object-fit:cover;display:block;}'
          + '.hui-mdet .meta{padding:18px 22px 22px;}'
          + '.hui-mdet .t{font-size:24px;font-weight:700;letter-spacing:-0.02em;'
          +   'color:' + T.ink + ';}'
          + '.hui-mdet .yr{font-weight:400;color:' + T.ink2 + ';}'
          + '.hui-mdet .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}'
          + '.hui-mdet .c{font-size:12px;font-weight:600;color:' + T.ink2 + ';'
          +   'background:' + T.fill2 + ';border-radius:999px;padding:5px 10px;}'
          + '.hui-mdet .t,.hui-mdet .s,.hui-mdet .c{white-space:normal;'
          +   'overflow:visible;text-overflow:clip;}'
          + '.hui-mdet .s{overflow-wrap:anywhere;'
          +   'font-size:15px;line-height:1.45;margin-top:14px;'
          +   'color:' + T.ink2 + ';}'
          + '@keyframes hemma-plate-in{'
          +   'from{opacity:0;transform:perspective(900px) translateZ(-70px);}'
          +   'to{opacity:1;transform:perspective(900px) translateZ(0);}}'
          + '.hui-m{animation:hemma-plate-in var(--hui-cell-dur, .42s) '
          +   'cubic-bezier(0.16, 1, 0.3, 1) backwards;animation-delay:0s;}'
          + '.hui-mlabel{animation-delay:0s;}'
          + '.hui-m,.hui-mrow,.hui-mov{pointer-events:auto;}'
          + '.hui-mrow{grid-template-columns:'
          +   'repeat(var(--hui-cols, 3), var(--hui-tile-w, min(381px, (min(1260px, 94vw) - 116px) / 3)));}'
          + '@media (max-width: 900px){.hui-mrow{'
          +   'grid-template-columns:repeat(2, minmax(0, 1fr));}}'
          + '@media (max-width: 640px){.hui-mrow{'
          +   'grid-template-columns:minmax(0, 1fr);}}'
          + '@media (max-width: 640px){'
          +   '.hui-mrow{grid-template-columns:minmax(0, 1fr);}'
          +   '.hui-m,.hui-m:first-child{grid-column:auto;}}'
          : '')
      + '</style>';
    var nT = items.length;
    out += '<div class="hui-mrow"'
      + (opts.tiles ? ' style="--hui-cols:' + Math.min(nT, 3) + ';"' : '')
      + '>';
    if (opts.tiles) {
      items.forEach(function (it, i) {
        out += '<div class="hui-m" data-hemma-media="' + i + '"'
          + ' style="--hui-d:' + delay(i + 1) + ';">'
          + '<div class="fa">'
          + (it.image
              ? '<img src="' + esc(it.image) + '" alt="" decoding="async" '
                + 'onload="this.parentNode.classList.add(\'rdy\')" '
                + 'onerror="this.onerror=null;this.style.display=\'none\'"/>'
              : '<div class="ph">\u25b6</div>')
          + '<div class="sc"></div>'
          + (it.rating ? '<div class="rt">' + esc(it.rating) + '</div>' : '')
          + (it.watched
              ? '<div class="ck"><svg viewBox="0 0 24 24" aria-hidden="true">'
                + '<path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" fill="none" stroke="#fff" '
                + 'stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
                + '</svg></div>'
              : '')
          + '<div class="cap">'
          + (it.title ? '<div class="t">' + esc(it.title)
              + (it.year ? '<span class="yr"> \u00b7 ' + esc(it.year) + '</span>' : '')
              + '</div>' : '')
          + (it.line2 ? '<div class="l2">' + esc(it.line2) + '</div>' : '')
          + '</div></div></div>';
      });
      out += '</div>';
      out += '<div class="hui-mov" hidden><div class="hui-movin">'
        + '<div class="hui-mback" role="button" aria-label="' + _hemmaL('ui.common.back', 'Back') + '">'
        +   '<svg width="14" height="24" viewBox="0 0 14 24" fill="none"'
        +   ' style="margin-right:2px;pointer-events:none;">'
        +   '<path d="M12 2.5 L2.8 12 L12 21.5" stroke="#fff" stroke-width="3"'
        +   ' stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '</div>';
      items.forEach(function (it, i) {
        out += '<div class="hui-mdet" data-i="' + i + '" hidden>'
          + '<div class="fa">'
          + (it.image ? '<img src="' + esc(it.image) + '" alt=""/>' : '')
          + '</div>'
          + '<div class="meta">'
          + (it.title ? '<div class="t">' + esc(it.title)
              + (it.year ? '<span class="yr"> \u00b7 ' + esc(it.year) + '</span>' : '')
              + '</div>' : '')
          + '<div class="chips">'
          +   (it.rating ? '<span class="c">' + esc(it.rating) + '</span>' : '')
          +   (it.line2 ? '<span class="c">' + esc(it.line2) + '</span>' : '')
          +   (it.runtime ? '<span class="c">' + esc(it.runtime) + '</span>' : '')
          +   (it.added ? '<span class="c">' + esc(it.added) + '</span>' : '')
          + '</div>'
          + (it.summary ? '<div class="s">' + esc(it.summary) + '</div>' : '')
          + '</div></div>';
      });
      out += '</div></div>';
      return '<div style="font-family:' + T.font + ';text-align:left;">'
        + out + '</div>';
    }

    items.forEach(function (it, i) {
      var tm = it.titleMobile && it.titleMobile !== it.title ? it.titleMobile : null;
      out += '<div class="hui-m' + (tm ? ' split' : '')
        + '" style="--hui-d:' + delay(i + 1) + ';"><div class="fa">'
        + (it.image
            ? '<img src="' + esc(it.image) + '" alt="" decoding="async" '
              + 'onload="this.parentNode.classList.add(\'rdy\')" '
              + 'onerror="this.onerror=null;this.style.display=\'none\'"/>'
            : '<div style="width:100%;height:100%;display:flex;align-items:center;'
              + 'justify-content:center;color:' + T.ink3 + ';font-size:26px;">\u25b6</div>')
        + (it.watched
            ? '<div class="ck"><svg viewBox="0 0 24 24" aria-hidden="true">'
              + '<path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" fill="none" stroke="#fff" '
              + 'stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
              + '</svg></div>'
            : '')
        + '</div>';
      if (it.when)    out += '<div class="w">' + esc(it.when) + '</div>';
      if (it.title)   out += '<div class="h">' + esc(it.title) + '</div>';
      if (tm)         out += '<div class="hm">' + esc(tm) + '</div>';
      if (it.sub)     out += '<div class="e">' + esc(it.sub) + '</div>';
      if (it.summary) out += '<div class="s">' + esc(it.summary) + '</div>';
      out += '</div>';
    });
    out += '</div>';
    if (opts.plate) {
      return '<div class="hui-plate" style="font-family:' + T.font + ';text-align:left;'
        + 'background:var(--hemma-popup-row-fill, rgba(255,255,255,0.10));'
        + 'border-radius:var(--hemma-popup-row-radius, 20px);'
        + 'box-shadow:var(--hemma-popup-plate-shadow, none);'
        + 'backdrop-filter:var(--hemma-popup-plate-backdrop, none);'
        + '-webkit-backdrop-filter:var(--hemma-popup-plate-backdrop, none);'
        + 'padding:var(--hemma-popup-shelf-pad, 18px 0 22px);">' + out + '</div>';
    }
    return '<div style="font-family:' + T.font + ';text-align:left;">' + out + '</div>';
  }

  // A row of preset pills. items: [{ label, svc, active }]
  function segments(items, label) {
    items = items || [];
    var out = '';
    if (label) {
      out += '<div style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:'
        + T.ink + ';padding:0 4px 8px;">' + esc(label) + '</div>';
    }
    out += '<style>'
      + 'ha-card.disabled{pointer-events:auto!important;}'
      + '.hui-seg{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;}'
      + '.hui-sg{flex:0 1 auto;text-align:center;'
      +   'font-size:14px;font-weight:500;'
      +   'padding:11px 13px;border-radius:var(--hemma-popup-seg-radius, 999px);'
      +   'background:var(--hemma-popup-seg-fill, rgba(255,255,255,0.16));'
      +   'color:' + T.ink + ';'
      +   'cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
      +   'transition:background-color .16s ease;}'
      + '.hui-sg.on{background:' + T.ink + ';color:#000;}'
      + '@media (hover:hover){.hui-sg:not(.on):hover{background:var(--hemma-popup-seg-fill-hover, rgba(255,255,255,0.24));}}'
      + '@media (prefers-reduced-motion:reduce){.hui-sg{transition:none;}}'
      + '</style>';
    out += '<div class="hui-seg">';
    items.forEach(function (it) {
      out += '<div class="hui-sg' + (it.active ? ' on' : '') + '"'
        + (it.svc ? ' data-hemma-svc="' + esc(JSON.stringify(it.svc)) + '"' : '')
        + '>' + esc(it.label) + '</div>';
    });
    out += '</div>';
    return '<div style="font-family:' + T.font + ';text-align:left;">' + out + '</div>';
  }

  function slider(o) {
    o = o || {};
    var v = Math.max(0, Math.min(100, Number(o.value) || 0));
    var inv = !!o.invert;
    var h = o.height || T.controlH;
    var w = o.width || T.controlW;
    var fillPct = inv ? (100 - v) : v;
    var payload = esc(JSON.stringify(Object.assign({ invert: inv }, o.svc || {})));

    var glyph = '';
    if (o.icon) {
      var url = (typeof window.hemmaIconUrl === 'function')
        ? window.hemmaIconUrl(o.icon) : '/local/hemma/icons/' + o.icon + '.svg';
      glyph = '<div class="hui-sl-ic" style="-webkit-mask:url(\'' + url + '\') center / contain no-repeat;'
        + 'mask:url(\'' + url + '\') center / contain no-repeat;"></div>';
    }

    var live = '';
    if (o.live && o.live.entities && o.live.entities.length) {
      live = ' data-hemma-live="fill"'
        + ' data-hemma-ents="' + esc(JSON.stringify(o.live.entities)) + '"'
        + ' data-hemma-attr="' + esc(o.live.attr || 'current_position') + '"'
        + (inv ? ' data-hemma-invert="1"' : '');
    }

    var out = '<style>'
      + 'ha-card.disabled{pointer-events:auto!important;}'
      + '.hui-sl-wrap{display:flex;justify-content:center;}'
      + '.hui-sl{position:relative;width:' + w + 'px;height:' + h + 'px;'
      +   'border-radius:var(--hemma-popup-control-radius, 37px);overflow:hidden;'
      +   'background:var(--hemma-popup-slider-track, rgba(0,0,0,0.34));'
      +   'cursor:ns-resize;touch-action:none;user-select:none;-webkit-user-select:none;}'
      + '.hui-sl-fill{position:absolute;left:0;right:0;'
      +   (inv ? 'top:0;' : 'bottom:0;')
      +   'background:var(--hemma-popup-slider-fill, var(--hemma-color-teal, #00C3D0));'
      +   'transition:height .18s cubic-bezier(.36,0,.16,1);}'
      + '.hui-sl.drag .hui-sl-fill{transition:none;}'
      + '.hui-sl-ic{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);'
      +   'width:30px;height:30px;pointer-events:none;'
      +   'background-color:var(--hemma-popup-slider-icon, #ffffff);}'
      + '@media (prefers-reduced-motion:reduce){.hui-sl-fill{transition:none;}}'
      + '</style>'
      + '<div class="hui-sl-wrap"><div class="hui-sl" data-hemma-slider="' + payload + '">'
      +   '<div class="hui-sl-fill"' + live + ' style="height:' + fillPct + '%"></div>'
      +   glyph
      + '</div></div>';
    return '<div style="font-family:' + T.font + ';">' + out + '</div>';
  }

  function note(text) {
    return '<div style="font-family:' + T.font + ';font-size:13px;color:' + T.ink3
      + ';padding:2px 4px 0;text-align:left;">' + esc(text) + '</div>';
  }

  var COVER_KINDS = {
    curtain: { key: 'curtain', get label() { return _hemmaT('covers.kind.curtain', 'Curtains'); }, open: 'curtain-open',         closed: 'curtain-closed' },
    blind:   { key: 'blind',   get label() { return _hemmaT('covers.kind.blind', 'Blinds'); },   open: 'blinds-vertical-open', closed: 'blinds-vertical-closed' },
    shade:   { key: 'shade',   get label() { return _hemmaT('covers.kind.shade', 'Shades'); },   open: 'roller-shade-open',    closed: 'roller-shade-closed' },
    shutter: { key: 'shutter', get label() { return _hemmaT('covers.kind.shutter', 'Shutters'); }, open: 'window-shade-open',    closed: 'window-shade-closed' },
    awning:  { key: 'awning',  get label() { return _hemmaT('covers.kind.awning', 'Awnings'); },  open: 'window-shade-open',    closed: 'window-shade-closed' },
    window:  { key: 'window',  get label() { return _hemmaT('covers.kind.window', 'Windows'); },  open: 'window-shade-open',    closed: 'window-shade-closed' },
    door:    { key: 'door',    get label() { return _hemmaT('covers.kind.door', 'Doors'); },    open: 'door-open',            closed: 'door-closed' },
    garage:  { key: 'garage',  get label() { return _hemmaT('covers.kind.garage', 'Garage'); },   open: 'door-open',            closed: 'door-closed' },
    gate:    { key: 'gate',    get label() { return _hemmaT('covers.kind.gate', 'Gates'); },    open: 'door-open',            closed: 'door-closed' },
  };
  // device_class first, then a guess from the entity_id, then curtain.
  window.hemmaCoverKind = function (dc, id) {
    var k = String(dc == null ? '' : dc).toLowerCase();
    if (COVER_KINDS[k]) return COVER_KINDS[k];
    var n = String(id == null ? '' : id).toLowerCase();
    var keys = Object.keys(COVER_KINDS);
    for (var i = 0; i < keys.length; i++) {
      if (n.indexOf(keys[i]) !== -1) return COVER_KINDS[keys[i]];
    }
    return COVER_KINDS.curtain;
  };


  var PLANT_CACHE_V = 1;
  function plantWater(node, entityId, dryPct) {
    if (!node || !entityId) return;
    var hass = (document.querySelector('home-assistant') || {}).hass;
    if (!hass || !hass.callWS) return;
    var key = 'v' + PLANT_CACHE_V + ':' + entityId;
    window._hemmaPlantW = window._hemmaPlantW || {};
    var hit = window._hemmaPlantW[key];
    if (hit && Date.now() - hit.at < 300000) { paintPlant(node, hit.txt); return; }

    var end = new Date();
    var start = new Date(end.getTime() - 14 * 86400000);
    var stat = hass.callWS({
      type: 'recorder/statistics_during_period',
      start_time: start.toISOString(), end_time: end.toISOString(),
      statistic_ids: [entityId], period: 'hour', types: ['mean'],
    }).then(function (r) {
      var pts = (r && r[entityId]) || [];
      return pts.map(function (p) { return { t: p.start, v: p.mean }; });
    }).catch(function () { return []; });

    stat.then(function (pts) {
      if (pts.length >= 6) return pts;
      // Statistics are not being kept for this sensor - take what history has.
      return hass.callWS({
        type: 'history/history_during_period',
        start_time: start.toISOString(), end_time: end.toISOString(),
        entity_ids: [entityId], minimal_response: true, no_attributes: true,
      }).then(function (r) {
        var raw = (r && r[entityId]) || [];
        return raw.map(function (p) {
          return { t: (p.lu != null ? p.lu * 1000 : p.last_updated), v: parseFloat(p.s || p.state) };
        }).filter(function (p) { return isFinite(p.v); });
      }).catch(function () { return []; });
    }).then(function (pts) {
      var txt = readPlant(pts, dryPct);
      window._hemmaPlantW[key] = { at: Date.now(), txt: txt };
      paintPlant(node, txt);
    });
  }

  function paintPlant(node, txt) {
    if (!node) return;
    node.textContent = txt || '';
    node.style.opacity = txt ? '1' : '0';
  }

  function readPlant(pts, dryPct) {
    pts = (pts || []).filter(function (p) { return p && isFinite(p.v) && p.t; })
      .sort(function (a, b) { return new Date(a.t) - new Date(b.t); });
    if (pts.length < 4) return '';
    var ms = function (p) { return new Date(p.t).getTime(); };
    var watered = null;
    for (var i = pts.length - 1; i > 0; i--) {
      if (pts[i].v - pts[i - 1].v >= 8) { watered = pts[i]; break; }
    }
    var bits = [];
    if (watered) {
      var d0 = new Date(); d0.setHours(0, 0, 0, 0);
      var dw = new Date(ms(watered)); dw.setHours(0, 0, 0, 0);
      var days = Math.round((d0 - dw) / 86400000);
      bits.push(days <= 0 ? _hemmaT('plant.watered_today', 'Watered today')
        : days === 1 ? _hemmaT('plant.watered_yesterday', 'Watered yesterday') : _hemmaT('plant.watered_days_ago', 'Watered {n} days ago', { n: days }));
    }
    // Drying rate from the tail since the last watering, in points per day.
    var tail = watered ? pts.filter(function (p) { return ms(p) >= ms(watered); }) : pts;
    if (tail.length >= 4) {
      var first = tail[0], last = tail[tail.length - 1];
      var spanD = (ms(last) - ms(first)) / 86400000;
      var drop = first.v - last.v;
      if (spanD >= 0.4 && drop > 0.5) {
        var perDay = drop / spanD;
        var floorPct = isFinite(dryPct) ? dryPct : 20;
        var left = (last.v - floorPct) / perDay;
        if (left >= 1 && left < 60) {
          bits.push(Math.round(left) === 1 ? _hemmaT('plant.dry_in_day', 'dry in about {n} day', { n: 1 }) : _hemmaT('plant.dry_in_days', 'dry in about {n} days', { n: Math.round(left) }));
            
        }
      }
    }
    return bits.join(' · ');
  }

  window._hemmaUI = { hero: hero, headline: headline, group: group, legend: legend, note: note, shelf: shelf, mediaRow: mediaRow, segments: segments, slider: slider, icon: icon, esc: esc, prime: prime, plantWater: plantWater, tokens: T, v: 146 };
})();
(function () {
  // The table may load before or after this file, so look it up per call.
  var _hemmaT = function (k, en, v) {
    if (typeof window._hemmaT === 'function') return window._hemmaT(k, en, v);
    var s = String(en);
    if (v) for (var p in v) s = s.split('{' + p + '}').join(String(v[p]));
    return s;
  };
  var _hemmaL = function (k, en) {
    var h = document.querySelector('home-assistant');
    var v = h && h.hass && h.hass.localize && h.hass.localize(k);
    return (v && v !== k) ? v : en;
  };
  if (window._hemmaNotify) return;

  var HOURS = 24;
  var MAX_ROWS = 40;
  var DEDUPE_MS = 5 * 60 * 1000;
  // One flapping device must not be able to fill the panel on its own.
  var PER_ENTITY_MAX = 3;
  var POLL_MS = 60000;
  // A battery has to read low for this long before it counts; devices glitch.
  var BATTERY_HOLD_MIN = 30;
  var KEY = 'hemma_notify_read_v1';
  var COUNT_IN_BADGE = true;

  function iconUrl(name) {
    return (typeof window.hemmaIconUrl === 'function')
      ? window.hemmaIconUrl(name) : '/local/hemma/icons/' + name + '.svg';
  }

  function ha() { return document.querySelector('home-assistant'); }
  function hassOf() { var h = ha(); return h && h.hass; }

  var READ_ENTITY = 'input_datetime.hemma_notifications_read';

  function readEntityId() {
    if (window.HEMMA_NOTIFY_READ_ENTITY) return window.HEMMA_NOTIFY_READ_ENTITY;
    var h = hassOf();
    if (h && h.states && h.states[READ_ENTITY]) return READ_ENTITY;
    return null;
  }

  function sharedRead() {
    var id = readEntityId();
    if (!id) return null;
    var h = hassOf();
    var st = h && h.states && h.states[id];
    if (!st) return null;
    var ms;
    if (id.indexOf('input_datetime.') === 0) {
      var ts = st.attributes && Number(st.attributes.timestamp);
      ms = isFinite(ts) ? ts * 1000 : NaN;
    } else {
      ms = parseFloat(st.state);
    }
    if (!isFinite(ms)) return null;
    if (ms < Date.now() - 90 * 864e5) return null;
    return ms;
  }

  function writeShared(ts) {
    var id = readEntityId();
    if (!id) return false;
    var h = hassOf();
    if (!h || !h.callWS) return false;
    // A write while Core shuts down fails, and callService turns that into an error toast.
    if (h.connection && h.connection.connected === false) return false;
    var dom = String(id).split('.')[0];
    var service, data;
    if (dom === 'input_datetime') {
      service = 'set_datetime';
      data = { entity_id: id, timestamp: Math.round(ts / 1000) };
    } else if (dom === 'input_text') {
      service = 'set_value';
      data = { entity_id: id, value: String(ts) };
    } else if (dom === 'input_number') {
      service = 'set_value';
      data = { entity_id: id, value: ts };
    } else {
      return false;
    }
    try {
      Promise.resolve(h.callWS({ type: 'call_service', domain: dom, service: service, service_data: data }))
        .catch(function () {
          try { localStorage.setItem(KEY, String(ts)); } catch (e) {}
        });
    } catch (e) { return false; }
    return true;
  }

  var _sealedAt = 0;

  function watermark() {
    var shared = sharedRead();
    if (shared !== null) return Math.max(shared, _sealedAt);
    if (_sealedAt) return _sealedAt;
    try {
      var v = parseFloat(localStorage.getItem(KEY));
      if (isFinite(v)) return v;
    } catch (e) {}
    // A first run must not open on 24 hours of red.
    var now = Date.now();
    try { localStorage.setItem(KEY, String(now)); } catch (e) {}
    return now;
  }

  function setWatermark(ts) {
    _sealedAt = ts;
    if (writeShared(ts)) return;
    try { localStorage.setItem(KEY, String(ts)); } catch (e) {}
  }

  function nameOf(st) {
    return (st && st.attributes && st.attributes.friendly_name) || (st && st.entity_id) || '';
  }

  function tidyName(n) {
    var s = String(n || '').trim().replace(/\s+/g, ' ');
    var out = s.replace(/\s+(sensor|contact)$/i, '');
    var w = out.split(' ');
    while (w.length > 1
      && w[w.length - 1].toLowerCase() === w[w.length - 2].toLowerCase()) {
      w.pop();
    }
    out = w.join(' ');
    return out || s;
  }

  function dc(st) {
    return (st && st.attributes && st.attributes.device_class) || '';
  }

  // The room a device is in, from Home Assistant's areas (the entity's own, else its device's).
  function roomOf(id) {
    var h = hassOf();
    var e = h && h.entities && id && h.entities[id];
    if (!e) return null;
    var aid = e.area_id || (e.device_id && h.devices && h.devices[e.device_id] && h.devices[e.device_id].area_id);
    var a = aid && h.areas && h.areas[aid];
    return (a && a.name) || null;
  }

  function ago(ms) {
    var s = Math.max(0, (Date.now() - ms) / 1000);
    if (s < 60) return _hemmaT('time.now', 'now');
    if (s < 3600) return _hemmaT('time.short.minutes', '{n}m ago', { n: Math.floor(s / 60) });
    var h = hassOf();
    var loc = (h && h.locale) || {};
    var lang = loc.language || (h && h.language) || undefined;
    var hour12 = loc.time_format === '12' ? true : loc.time_format === '24' ? false : undefined;
    var d = new Date(ms);
    var now = new Date();
    var day = function (x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };
    var days = Math.round((day(now) - day(d)) / 864e5);
    try {
      if (days === 0) return d.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit', hour12: hour12 });
      if (days === 1) return _hemmaT('time.yesterday', 'Yesterday');
      if (days < 7) return d.toLocaleDateString(lang, { weekday: 'long' });
      return d.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
    } catch (e) {
      return d.toLocaleTimeString();
    }
  }


  var ALARM_WORD = {
    get armed_home() { return _hemmaT('notify.alarm.armed_home', 'Alarm armed (Home)'); },
    get armed_away() { return _hemmaT('notify.alarm.armed_away', 'Alarm armed (Away)'); },
    get armed_night() { return _hemmaT('notify.alarm.armed_night', 'Alarm armed (Night)'); },
    get armed_vacation() { return _hemmaT('notify.alarm.armed_vacation', 'Alarm armed (Vacation)'); },
    get armed_custom_bypass() { return _hemmaT('notify.alarm.armed_custom_bypass', 'Alarm armed (Custom)'); },
    get disarmed() { return _hemmaT('notify.alarm.disarmed', 'Alarm disarmed'); },
    get triggered() { return _hemmaT('notify.alarm.triggered', 'Alarm triggered'); },
  };

  var VACUUM_BUSY = { cleaning: 1, returning: 1 };
  var VACUUM_DONE = { docked: 1, idle: 1 };

  // Every category is on unless a dashboard turns it off.
  function on(type) {
    var t = window.HEMMA_NOTIFY_TYPES;
    return !t || t[type] !== false;
  }

  function appliances() {
    var list = window.HEMMA_NOTIFY_APPLIANCES;
    if (!Array.isArray(list)) return [];
    return list.filter(Boolean).map(function (a) {
      return typeof a === 'string' ? { entity: a } : a;
    }).filter(function (a) { return a && a.entity; });
  }

  function applianceFor(id) {
    var all = appliances();
    for (var i = 0; i < all.length; i++) if (all[i].entity === id) return all[i];
    return null;
  }

  function minutesLeft(st) {
    if (!st) return null;
    var a = st.attributes || {};
    if (a.device_class === 'timestamp') {
      var t = Date.parse(st.state);
      if (!isFinite(t)) return null;
      return Math.max(0, Math.round((t - Date.now()) / 60000));
    }
    var n = parseFloat(st.state);
    if (!isFinite(n)) return null;
    var u = String(a.unit_of_measurement || '').toLowerCase();
    if (u === 's' || u === 'sec' || u === 'seconds') return Math.round(n / 60);
    if (u === 'h' || u === 'hr' || u === 'hours') return Math.round(n * 60);
    return Math.round(n);
  }

  var PLANT_WORD = {
    get 'moisture:Low'() { return _hemmaT('notify.plant.needs_water', '{name} needs water'); },
    get 'moisture:High'() { return _hemmaT('notify.plant.overwatered', '{name} is overwatered'); },
    get 'conductivity:Low'() { return _hemmaT('notify.plant.needs_feeding', '{name} needs feeding'); },
    get 'conductivity:High'() { return _hemmaT('notify.plant.too_much_fertilizer', '{name} is overfed'); },
    get 'illuminance:Low'() { return _hemmaT('notify.plant.needs_light', '{name} needs light'); },
    get 'illuminance:High'() { return _hemmaT('notify.plant.too_much_light', '{name} needs shade'); },
    get 'dli:Low'() { return _hemmaT('notify.plant.needs_light', '{name} needs light'); },
    get 'dli:High'() { return _hemmaT('notify.plant.too_much_light', '{name} needs shade'); },
    get 'temperature:Low'() { return _hemmaT('notify.plant.too_cold', '{name} is too cold'); },
    get 'temperature:High'() { return _hemmaT('notify.plant.too_warm', '{name} is too warm'); },
    get 'humidity:Low'() { return _hemmaT('notify.plant.air_too_dry', '{name} needs humidity'); },
    get 'humidity:High'() { return _hemmaT('notify.plant.air_too_humid', '{name} needs drier air'); },
  };

  var APPLIANCE_DONE = /^(off|idle|finished|complete|completed|standby|end|ready)$/i;
  var APPLIANCE_BUSY = /^(on|run|running|active|washing|rinsing|spinning|drying|printing|busy)$/i;

  function isDoorbell(id, st) {
    if (id.indexOf('event.') === 0) return dc(st) === 'doorbell';
    if (id.indexOf('binary_sensor.') === 0) {
      return dc(st) === 'occupancy' && /doorbell|ding|chime/i.test(id);
    }
    return false;
  }

  // Entities whose past matters. Everything else is read from current state.
  // Custom notification sources, so a letterbox or a bin collection does not
  // mean patching this file and merging it again on every update. See #71.
  function exts() {
    var x = window.HEMMA_NOTIFY_EXTENSIONS;
    return Array.isArray(x) ? x : [];
  }

  function extApi() {
    return { on: on, nameOf: nameOf, tidyName: tidyName, dc: dc };
  }

  function eachExt(name, fn) {
    exts().forEach(function (e) {
      if (!e || typeof e[name] !== 'function') return;
      try { fn(e); } catch (err) {
        console.warn('Hemma notify extension (' + name + '):', err);
      }
    });
  }

  function watched(hass) {
    var out = [];
    var appl = appliances().map(function (a) { return a.entity; });
    Object.keys(hass.states).forEach(function (id) {
      var st = hass.states[id];
      if (on('locks') && id.indexOf('lock.') === 0) return void out.push(id);
      if (on('alarm') && id.indexOf('alarm_control_panel.') === 0) return void out.push(id);
      if (on('vacuum') && id.indexOf('vacuum.') === 0) return void out.push(id);
      if (on('doorbell') && isDoorbell(id, st)) return void out.push(id);
      if (on('people') && id.indexOf('person.') === 0) return void out.push(id);
      if (on('appliances') && appl.indexOf(id) !== -1) return void out.push(id);
    });
    eachExt('watch', function (e) {
      (e.watch(hass, extApi()) || []).forEach(function (id) {
        if (out.indexOf(id) === -1) out.push(id);
      });
    });
    return out;
  }

  // entry: a logbook row. prev: that entity's previous state in the window.
  function describe(entry, st, prev) {
    // undefined means "not mine", so the built-in rules still run. null means
    // "mine, and deliberately not a row".
    var ex = exts();
    for (var xi = 0; xi < ex.length; xi++) {
      if (!ex[xi] || typeof ex[xi].describe !== 'function') continue;
      try {
        var xr = ex[xi].describe(entry, st, prev, extApi());
        if (xr !== undefined) return xr;
      } catch (err) { console.warn('Hemma notify extension (describe):', err); }
    }
    var id = entry.entity_id || '';
    var s = String(entry.state == null ? '' : entry.state);
    var name = entry.name || nameOf(st);

    if (id.indexOf('lock.') === 0) {
      var lk = { opens: ['hemma_badge_lock_group', 'hemma_popup_lock'] };
      var lkRoom = roomOf(id);
      if (s === 'locked') return { label: _hemmaT('notify.lock_locked', '{name} locked', { name }), sub: lkRoom, icon: 'lock-fill', tone: 'good', opens: lk.opens };
      if (s === 'unlocked') return { label: _hemmaT('notify.lock_unlocked', '{name} unlocked', { name }), sub: lkRoom, icon: 'lock-open-fill', tone: 'warn', opens: lk.opens };
      if (s === 'jammed') return { label: _hemmaT('notify.lock_jammed', '{name} jammed', { name }), sub: lkRoom, icon: 'exclamation', tone: 'bad', opens: lk.opens };
      return null;
    }

    if (id.indexOf('person.') === 0) {
      var AWAY = 'var(--hemma-color-blue, #0A84FF)';
      var pic = st && st.attributes && st.attributes.entity_picture;
      var who = {
        once: 'person:' + name, icon: 'person',
        image: pic || undefined, imageFit: 'cover',
      };
      if (s === 'home') {
        return { label: _hemmaT('notify.arrived', '{name} arrived', { name }), tone: 'good', icon: who.icon,
          image: who.image, imageFit: who.imageFit, once: who.once };
      }
      if (s === 'not_home') {
        return { label: _hemmaT('notify.left', '{name} left', { name }), tone: AWAY, icon: who.icon,
          image: who.image, imageFit: who.imageFit, once: who.once };
      }
      if (s && s !== 'unknown' && s !== 'unavailable') {
        return { label: _hemmaT('notify.is_at', '{name} is at {place}', { name, place: s }), tone: AWAY, icon: who.icon,
          image: who.image, imageFit: who.imageFit, once: who.once };
      }
      return null;
    }

    if (id.indexOf('alarm_control_panel.') === 0) {
      var word = ALARM_WORD[s];
      if (!word) return null;
      return {
        label: word,
        icon: s === 'disarmed' ? 'lock-open-fill' : 'lock-fill',
        tone: s === 'triggered' ? 'bad' : s === 'disarmed' ? 'warn' : 'good',
        urgent: s === 'triggered' && !!st && st.state === 'triggered',
      };
    }

    if (id.indexOf('vacuum.') === 0) {
      if (VACUUM_DONE[s] && VACUUM_BUSY[prev]) {
        return { label: _hemmaT('notify.finished_cleaning', '{name} finished cleaning', { name }), icon: 'vacuum-charge', tone: 'good' };
      }
      if (s === 'error') {
        var verr = st && st.attributes && st.attributes.error;
        return { label: _hemmaT('notify.needs_attention', '{name} needs attention', { name }),
          sub: typeof verr === 'string' && verr.trim() ? verr.trim() : null, icon: 'vacuum', tone: 'bad' };
      }
      return null;
    }

    if (isDoorbell(id, st)) {
      // A restart logs the event entity as unknown; only a timestamp (or a sensor turning on) is a press.
      var pressed = id.indexOf('event.') === 0 ? (!isNaN(Date.parse(s)) && s !== prev) : s === 'on';
      if (!pressed) return null;
      // "Front Door Ding" is the entity, "Front Door" is the thing that rang.
      var who = name.replace(/\s+(ding|doorbell|chime|button)$/i, '');
      return { label: _hemmaT('notify.rang', '{name} rang', { name: who || name }), sub: roomOf(id), icon: 'doorbell', tone: 'accent' };
    }

    var appl = applianceFor(id);
    if (appl) {
      var done = appl.done ? new RegExp('^' + appl.done + '$', 'i') : APPLIANCE_DONE;
      if (done.test(s) && APPLIANCE_BUSY.test(prev || '')) {
        return { label: _hemmaT('notify.finished', '{name} finished', { name: appl.name || name }), sub: roomOf(id), icon: 'default', tone: 'good' };
      }
      return null;
    }

    return null;
  }


  // When each sensor's current run of bad readings began, read from HA's history so every device agrees.
  var _since = {};
  var _wantSince = {};

  function sinceOf(id, isBad) {
    if (_since[id] != null) return _since[id];
    _wantSince[id] = isBad;
    return null;
  }

  function fetchSince(hass) {
    var want = _wantSince;
    _wantSince = {};
    var ids = Object.keys(want);
    if (!ids.length || !hass.callWS) return Promise.resolve(false);
    var settle = function (id, at) {
      var st = hass.states[id];
      _since[id] = at != null ? at : (Date.parse((st && st.last_changed) || '') || Date.now());
    };
    return hass.callWS({
      type: 'history/history_during_period',
      start_time: new Date(Date.now() - 7 * 864e5).toISOString(),
      entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false,
    }).then(function (res) {
      ids.forEach(function (id) {
        var list = (res && res[id]) || [];
        var at = null;
        for (var i = list.length - 1; i >= 0; i--) {
          var v = list[i].s;
          if (v === 'unavailable' || v === 'unknown') continue;
          if (!want[id](v)) break;
          at = Math.round(Number(list[i].lc || list[i].lu) * 1000) || at;
        }
        settle(id, at);
      });
      return true;
    }).catch(function () {
      ids.forEach(function (id) { settle(id, null); });
      return true;
    });
  }

  function standing(hass) {
    var rows = [];
    var S = hass.states;
    var ids = Object.keys(S);

    var updates = [];
    var restarts = [];
    ids.forEach(function (id) {
      if (id.indexOf('update.') !== 0) return;
      var st = S[id];
      var a = st.attributes || {};
      if (st.state === 'on' && !a.in_progress) { updates.push(st); return; }
      var rs = String(a.release_summary || '').toLowerCase();
      if (rs.indexOf('restart') !== -1 && st.state === 'off'
        && a.installed_version && a.installed_version === a.latest_version) {
        restarts.push(st);
      }
    });

    var newest = function (list) {
      return list.reduce(function (t, st) {
        var v = Date.parse(st.last_changed || '') || 0;
        return v > t ? v : t;
      }, 0);
    };

    if (updates.length && on('updates')) {
      rows.push({
        id: 'hemma:updates',
        when: newest(updates) || Date.now(),
        // The name goes under a short title: in the title it ran past the row. Several are only counted.
        label: updates.length === 1
          ? _hemmaT('notify.update_one', 'Update available')
          : _hemmaT('notify.updates_available', '{n} updates available', { n: updates.length }),
        sub: updates.length === 1 ? nameOf(updates[0]).replace(/\s+Update$/i, '') : null,
        icon: 'updates',
        tone: 'accent',
        entity: updates[0].entity_id,
        opens: ['hemma_updates', 'hemma_popup_updates'],
      });
    }

    if (restarts.length && on('restart')) {
      rows.push({
        id: 'hemma:restart',
        when: newest(restarts) || Date.now(),
        label: _hemmaT('notify.restart_pending', 'Restart pending'),
        sub: restarts.length === 1
          ? _hemmaT('notify.finishes_one', 'Finishes the {name} update', { name: nameOf(restarts[0]).replace(/\s+Update$/i, '') })
          : _hemmaT('notify.finishes_n', 'Finishes {n} updates', { n: restarts.length }),
        icon: 'exclamation',
        tone: 'warn',
        entity: restarts[0].entity_id,
        opens: ['hemma_updates', 'hemma_popup_updates'],
      });
    }

    var lowPct = Number(window.HEMMA_NOTIFY_BATTERY);
    if (!isFinite(lowPct)) lowPct = 20;
    var holdMin = Number(window.HEMMA_NOTIFY_BATTERY_HOLD);
    if (!isFinite(holdMin) || holdMin < 0) holdMin = BATTERY_HOLD_MIN;
    var nowMs = Date.now();
    var low = [];
    ids.forEach(function (id) {
      var st = S[id];
      if (dc(st) !== 'battery') return;
      var pct = null;
      var lowAt;
      if (id.indexOf('sensor.') === 0) {
        pct = parseFloat(st.state);
        // Unavailable is no news: hold the clock rather than start it over.
        if (!isFinite(pct)) return;
        lowAt = function (v) { var n = parseFloat(v); return isFinite(n) && n <= lowPct; };
      } else if (id.indexOf('binary_sensor.') === 0) {
        if (st.state !== 'on' && st.state !== 'off') return;
        lowAt = function (v) { return v === 'on'; };
      } else {
        return;
      }
      if (!lowAt(st.state)) { delete _since[id]; return; }
      var since = sinceOf(id, lowAt);
      if (since != null && nowMs - since >= holdMin * 60000) low.push({ st: st, pct: pct, since: since });
    });
    if (low.length && on('battery')) {
      low.sort(function (a, b) { return (a.pct == null ? -1 : a.pct) - (b.pct == null ? -1 : b.pct); });
      rows.push({
        id: 'hemma:battery',
        when: Math.max.apply(null, low.map(function (x) { return x.since; })),
        label: low.length === 1
          ? _hemmaT('notify.battery_low_one', '{name} battery low', { name: nameOf(low[0].st).replace(/\s+Battery$/i, '') })
          : _hemmaT('notify.battery_low_n', '{n} devices low on battery', { n: low.length }),
        sub: low.length === 1 && low[0].pct != null ? _hemmaT('notify.battery_left', '{n}% left', { n: low[0].pct }) : null,
        icon: 'battery',
        tone: 'bad',
        entity: low.length === 1 ? low[0].st.entity_id : null,
        opens: ['hemma_battery', 'hemma_popup_battery'],
      });
    }

    var SAFETY = {
      moisture: { word: _hemmaT('notify.safety.moisture', 'Water detected'), icon: 'exclamation' },
      smoke: { word: _hemmaT('notify.safety.smoke', 'Smoke detected'), icon: 'exclamation' },
      gas: { word: _hemmaT('notify.safety.gas', 'Gas detected'), icon: 'gas' },
      carbon_monoxide: { word: _hemmaT('notify.safety.carbon_monoxide', 'Carbon monoxide detected'), icon: 'exclamation' },
      safety: { word: _hemmaT('notify.safety.safety', 'Safety alert'), icon: 'exclamation' },
    };
    if (on('safety')) {
      ids.forEach(function (id) {
        if (id.indexOf('binary_sensor.') !== 0) return;
        var st = S[id];
        if (st.state !== 'on') return;
        var kind = SAFETY[dc(st)];
        if (!kind) return;
        rows.push({
          id: 'hemma:safety:' + id,
          when: Date.parse(st.last_changed || '') || Date.now(),
          label: kind.word,
          sub: roomOf(id) || nameOf(st),
          icon: kind.icon,
          tone: 'bad',
          entity: id,
          rank: 1,
          urgent: true,
        });
      });
    }

    var openMins = Number(window.HEMMA_NOTIFY_OPEN_MINUTES);
    if (!isFinite(openMins)) openMins = 10;
    if (on('doors') && openMins > 0) {
      var openSeen = {};
      ids.forEach(function (id) {
        if (id.indexOf('binary_sensor.') !== 0) return;
        var st = S[id];
        if (st.state !== 'on') return;
        var kind = dc(st);
        if (kind !== 'door' && kind !== 'window' && kind !== 'garage_door'
          && kind !== 'opening') return;
        var since = Date.parse(st.last_changed || '');
        if (!isFinite(since)) return;
        var mins = Math.round((Date.now() - since) / 60000);
        if (mins < openMins) return;
        // A lock's door sensor and a contact sensor on the same door report twice.
        var openName = tidyName(nameOf(st));
        if (openSeen[openName]) return;
        openSeen[openName] = true;
        rows.push({
          id: 'hemma:open:' + id,
          when: since,
          label: _hemmaT('notify.is_open', '{name} is open', { name: tidyName(nameOf(st)) }),
          // The time on the right already says how long; the room says where.
          sub: roomOf(id),
          icon: kind === 'window' ? 'window-shade-open' : 'door-open',
          tone: 'warn',
          entity: id,
          // Door and window sensors sit beside their lock in that popup.
          opens: ['hemma_badge_lock_group', 'hemma_popup_lock'],
        });
      });
    }

    var co2Limit = Number(window.HEMMA_NOTIFY_CO2);
    if (!isFinite(co2Limit)) co2Limit = 1800;
    if (on('air') && co2Limit > 0) {
      var plants = ids.filter(function (id) { return id.indexOf('plant.') === 0; })
        .map(function (id) { return id.slice(6); });
      ids.forEach(function (id) {
        if (id.indexOf('sensor.') !== 0) return;
        var st = S[id];
        if (dc(st) !== 'carbon_dioxide') return;
        var bare = id.slice(7);
        if (plants.some(function (n) { return bare.indexOf(n) === 0; })) return;
        var ppm = parseFloat(st.state);
        if (!isFinite(ppm)) return;
        if (ppm < co2Limit) { delete _since[id]; return; }
        var bad = ppm >= 2000;
        var crossed = sinceOf(id, function (v) { var n = parseFloat(v); return isFinite(n) && n >= co2Limit; });
        if (crossed == null) return;
        rows.push({
          id: 'hemma:co2:' + id,
          when: crossed,
          label: _hemmaT('notify.co2_high', 'Carbon dioxide is high'),
          sub: (function () {
            var where = roomOf(id) || nameOf(st)
              .replace(/\s*(carbon dioxide|co2)\s*/gi, ' ')
              .replace(/\s+/g, ' ').trim();
            return where ? _hemmaT('notify.co2_in', '{ppm} ppm in {where}', { ppm: Math.round(ppm), where }) : _hemmaT('notify.co2', '{ppm} ppm', { ppm: Math.round(ppm) });
          })(),
          icon: 'co2-fill',
          tone: bad ? 'bad' : 'warn',
          entity: id,
          opens: ['hemma_badge_air_quality'],
        });
      });
    }

    if (on('plants')) {
      var midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      ids.forEach(function (id) {
        if (id.indexOf('plant.') !== 0) return;
        var st = S[id];
        if (st.state !== 'problem') return;
        var probs = (st.attributes || {}).problems;
        if (!Array.isArray(probs) || !probs.length) return;
        // Watering is the one you can act on standing there, so it leads.
        var first = probs.filter(function (x) { return x.sensor_type === 'moisture'; })[0]
          || probs[0];
        var word = PLANT_WORD[first.sensor_type + ':' + first.status];
        if (!word) return;
        var cur = parseFloat(first.current);
        rows.push({
          id: 'hemma:plant:' + id,
          when: Math.max(Date.parse(st.last_changed || '') || 0, midnight.getTime()),
          label: word.split('{name}').join(nameOf(st)),
          // The reading where a number means something at a glance; light and feeding values do not.
          sub: !isFinite(cur) ? null
            : first.sensor_type === 'moisture' ? _hemmaT('notify.soil_at', 'Soil at {n}%', { n: Math.round(cur) })
            : first.sensor_type === 'humidity' ? _hemmaT('notify.humidity_at', 'Humidity {n}%', { n: Math.round(cur) })
            : first.sensor_type === 'temperature' ? _hemmaT('notify.degrees', '{n}°', { n: Math.round(cur) })
            : null,
          icon: 'plant',
          tone: 'warn',
          entity: id,
          opens: ['hemma_plant', 'hemma_popup_plant'],
        });
      });
    }

    if (on('appliances')) {
      appliances().forEach(function (a) {
        var st = S[a.entity];
        if (!st) return;
        var done = a.done ? new RegExp('^' + a.done + '$', 'i') : APPLIANCE_DONE;
        if (done.test(st.state)) return;
        var left = a.remaining ? minutesLeft(S[a.remaining]) : null;
        if (left == null) return;
        rows.push({
          id: 'hemma:appliance:' + a.entity,
          when: Date.now(),
          label: left > 0 ? _hemmaT('notify.appliance_running', '{name} is running', { name: a.name || nameOf(st) }) : _hemmaT('notify.appliance_finishing', '{name} is finishing up', { name: a.name || nameOf(st) }),
          sub: left > 0
            ? (left < 60 ? _hemmaT('time.min_left', '{n} min left', { n: left })
               : _hemmaT('time.hr_min_left', '{h} hr {m} min left', { h: Math.floor(left / 60), m: left % 60 }))
            : _hemmaT('notify.almost_done', 'Almost done'),
          icon: 'default',
          tone: 'accent',
          entity: a.entity,
        });
      });
    }

    eachExt('standing', function (e) {
      var next = e.standing(hass, rows, extApi());
      if (Array.isArray(next)) rows = next;
    });

    return rows;
  }

  // ── Collection ─────────────────────────────────────────────────────────────

  var _all = [];
  var _rows = [];
  var _busy = null;

  function collect() {
    var hass = hassOf();
    if (!hass) return Promise.resolve(_rows);
    if (_busy) return _busy;

    var live = standing(hass);
    var ids = watched(hass);
    var crossings = fetchSince(hass).then(function (asked) { if (asked) live = standing(hass); });
    var since = new Date(Date.now() - HOURS * 3600 * 1000).toISOString();

    var fetch = (ids.length && hass.callWS)
      ? hass.callWS({ type: 'logbook/get_events', start_time: since, entity_ids: ids })
      : Promise.resolve([]);

    _busy = Promise.all([fetch.catch(function () { return []; }), crossings]).then(function (got) {
      var entries = got[0];
      var prev = {};
      var events = [];
      var asked = {};
      ids.forEach(function (id) { asked[id] = 1; });
      (entries || []).forEach(function (e) {
        var id = e.entity_id;
        if (!id || !asked[id]) return;
        var st = hass.states[id];
        var was = prev[id];
        prev[id] = String(e.state == null ? '' : e.state);
        var d = describe(e, st, was);
        if (!d) return;
        // `when` is epoch seconds, and float on some HA versions.
        var when = Math.round(Number(e.when) * 1000);
        if (!isFinite(when)) return;
        events.push({
          id: id + '@' + when,
          when: when,
          label: d.label,
          sub: d.sub || null,
          icon: d.icon,
          tone: d.tone,
          image: d.image,
          imageFit: d.imageFit,
          entity: id,
          opens: d.opens || null,
          once: d.once || null,
          urgent: !!d.urgent,
        });
      });

      events.sort(function (a, b) { return b.when - a.when; });

      var kept = [];
      var perEntity = {};
      var onlyOnce = {};
      events.forEach(function (e) {
        if (e.once) {
          if (onlyOnce[e.once]) return;
          onlyOnce[e.once] = 1;
          kept.push(e);
          return;
        }
        var n = (perEntity[e.entity] || 0);
        if (n >= PER_ENTITY_MAX) return;
        var dupe = kept.some(function (k) {
          return k.label === e.label && Math.abs(k.when - e.when) < DEDUPE_MS;
        });
        if (dupe) return;
        perEntity[e.entity] = n + 1;
        kept.push(e);
      });

      // Only the latest trigger of an alarm that is still going off stays pinned.
      var pinned = {};
      kept.forEach(function (e) {
        if (!e.urgent) return;
        if (pinned[e.entity]) { e.urgent = false; return; }
        pinned[e.entity] = 1;
        e.rank = 1;
      });

      var room = Math.max(0, MAX_ROWS - live.length);
      _all = live.concat(kept.slice(0, room))
        .sort(function (a, b) {
          return ((b.rank || 0) - (a.rank || 0)) || (b.when - a.when);
        });
      _busy = null;
      shown();
      return _rows;
    });

    return _busy;
  }

  function unread() {
    var w = watermark();
    return _rows.filter(function (r) { return r.when > w; }).length;
  }


  var _bells = [];
  var _lastCount = -1;

  function mountCount(glyph) {
    var root = glyph.getRootNode();
    if (!root || !root.querySelector || !root.appendChild) return null;
    var have = root.querySelector('.hemma-bell-count');
    if (have) return have;
    var span = document.createElement('span');
    span.className = 'hemma-bell-count';
    span.style.display = 'none';
    root.appendChild(span);
    return span;
  }

  function findBells() {
    var out = [];
    (function walk(root, depth) {
      if (!root || depth > 14 || !root.querySelectorAll) return;
      root.querySelectorAll('.hemma-bell').forEach(function (glyph) {
        var el = mountCount(glyph);
        if (el && out.indexOf(el) === -1) out.push(el);
      });
      root.querySelectorAll('*').forEach(function (el) {
        if (el.shadowRoot) walk(el.shadowRoot, depth + 1);
      });
    })(document, 0);
    return out;
  }

  function bells() {
    _bells = _bells.filter(function (el) { return el.isConnected; });
    if (!_bells.length) _bells = findBells();
    return _bells;
  }

  function announce() {
    var n = unread();
    var text = n > 99 ? '99+' : String(n);
    var inBadge = COUNT_IN_BADGE && !isPhone();
    var show = (n > 0 && inBadge) ? 'grid' : 'none';
    var src = iconUrl(!inBadge && n > 0 ? 'bell-badge' : 'bell');
    bells().forEach(function (el) {
      if (el.textContent !== text) el.textContent = text;
      if (el.style.display !== show) el.style.display = show;
      var glyph = el.parentNode && el.parentNode.querySelector('.hemma-bell');
      if (glyph && glyph.getAttribute('src') !== src) glyph.setAttribute('src', src);
      if (glyph) glyph.classList.toggle('badged', !inBadge && n > 0);
    });
    if (n !== _lastCount) {
      _lastCount = n;
      window.dispatchEvent(new CustomEvent('hemma-notify-count', { detail: { count: n } }));
    }
  }

  // ── Panel body ─────────────────────────────────────────────────────────────

  function configure(cfg) {
    cfg = cfg || {};
    if (cfg.types !== undefined) window.HEMMA_NOTIFY_TYPES = cfg.types;
    if (cfg.appliances !== undefined) window.HEMMA_NOTIFY_APPLIANCES = cfg.appliances;
    if (cfg.battery !== undefined) window.HEMMA_NOTIFY_BATTERY = cfg.battery;
    if (cfg.battery_hold !== undefined) window.HEMMA_NOTIFY_BATTERY_HOLD = cfg.battery_hold;
    if (cfg.open_minutes !== undefined) window.HEMMA_NOTIFY_OPEN_MINUTES = cfg.open_minutes;
    if (cfg.co2 !== undefined) window.HEMMA_NOTIFY_CO2 = cfg.co2;
    if (cfg.read_entity !== undefined) {
      window.HEMMA_NOTIFY_READ_ENTITY = cfg.read_entity || null;
    }
    return true;
  }

  function templatesOf(cfg) {
    var t = cfg && cfg.template;
    return Array.isArray(t) ? t : (t ? [t] : []);
  }

  function wants(cfg, names, entityId) {
    var list = templatesOf(cfg);
    var hit = names.some(function (n) { return list.indexOf(n) !== -1; });
    if (!hit) return false;
    if (!entityId) return true;
    var v = cfg.variables || {};
    return cfg.entity === entityId
      || Object.keys(v).some(function (k) { return v[k] === entityId; });
  }

  function cardWithTemplate(names, entityId) {
    var out = null;
    var scan = function (id) {
      (function walk(root, depth) {
        if (!root || out || depth > 14 || !root.querySelectorAll) return;
        root.querySelectorAll('button-card').forEach(function (el) {
          if (!out && wants(el._config, names, id)) out = el;
        });
        root.querySelectorAll('*').forEach(function (el) {
          if (!out && el.shadowRoot) walk(el.shadowRoot, depth + 1);
        });
      })(document, 0);
    };
    if (entityId) scan(entityId);
    if (!out) scan(null);
    return out;
  }

  function cardFromConfig(names, entityId) {
    var h = hassOf();
    if (!h || !h.callWS) return Promise.resolve(null);
    var seg = (location.pathname || '').split('/').filter(Boolean);
    var url = seg[0] || 'lovelace';
    return h.callWS({ type: 'lovelace/config', url_path: url }).then(function (cfg) {
      var found = null;
      (function walk(cards) {
        (cards || []).forEach(function (c) {
          if (found || !c || typeof c !== 'object') return;
          if (wants(c, names, entityId)) { found = c; return; }
          walk(c.cards);
        });
      })((cfg.views || []).reduce(function (a, v) {
        return a.concat(v.cards || []);
      }, []));
      if (!found && entityId) {
        (function walk(cards) {
          (cards || []).forEach(function (c) {
            if (found || !c || typeof c !== 'object') return;
            if (wants(c, names, null)) { found = c; return; }
            walk(c.cards);
          });
        })((cfg.views || []).reduce(function (a, v) {
          return a.concat(v.cards || []);
        }, []));
      }
      if (!found) return null;
      var el = document.createElement('button-card');
      try { el.setConfig(JSON.parse(JSON.stringify(found))); } catch (e) { return null; }
      el.hass = h;
      el.style.cssText = 'position:fixed;left:-9999px;top:0;'
        + 'width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(el);
      return el;
    }).catch(function () { return null; });
  }

  function tapCard(card, done) {
    if (!card || typeof card._handleAction !== 'function' || !card._config) {
      return done(false);
    }
    if (typeof card._isActionDoingSomething === 'function') {
      try {
        if (!card._isActionDoingSomething(card._stateObj, card._config.tap_action)) {
          return done(false);
        }
      } catch (e) {}
    }
    var settled = false;
    var take = function (ev) {
      var cfg = ev.detail && ev.detail.config;
      var act = cfg && cfg[((ev.detail && ev.detail.action) || 'tap') + '_action'];
      if (act && act.hemma_popup && window.hemmaPopup) {
        // Only ours gets intercepted; anything else stays HA's to handle.
        ev.stopPropagation();
        window.hemmaPopup.open(act.hemma_popup);
        return finish(true);
      }
      finish(false);
    };
    var finish = function (ok) {
      if (settled) return;
      settled = true;
      card.removeEventListener('hass-action', take, true);
      done(ok);
    };
    card.addEventListener('hass-action', take, true);
    try {
      card._handleAction({ detail: { action: 'tap' } }, { isIcon: false });
    } catch (e) { return finish(false); }
    // hass-action arrives a microtask later, so the miss cannot be decided yet.
    setTimeout(function () { finish(false); }, 400);
  }

  window._hemmaOpenTarget = function (what, fallbackEntity) { openTarget(what, fallbackEntity); };

  function openTarget(what, fallbackEntity) {
    // dataset stringifies an array, so a retagged row arrives comma-joined.
    var names = Array.isArray(what) ? what
      : (what ? String(what).split(',').map(function (n) { return n.trim(); })
                .filter(Boolean)
              : []);
    var fall = function () {
      if (fallbackEntity && window.hemmaPopup) window.hemmaPopup.moreInfo(fallbackEntity);
    };
    if (!names.length) return fall();
    tapCard(cardWithTemplate(names, fallbackEntity), function (hit) {
      if (hit) return;
      cardFromConfig(names, fallbackEntity).then(function (el) {
        if (!el) return fall();
        // One frame for button-card to evaluate its config before the tap.
        setTimeout(function () {
          tapCard(el, function (ok) {
            if (!ok) fall();
            setTimeout(function () { if (el.parentNode) el.remove(); }, 1500);
          });
        }, 80);
      });
    });
  }

  // ── Cleared ────────────────────────────────────────────────────────────────

  var CLEARED_KEY = 'hemma_notify_cleared_v1';
  var _cleared = { cleared_at: 0, ids: {} };
  var _synced = false;
  var _subConn = null;

  try {
    var savedClear = JSON.parse(localStorage.getItem(CLEARED_KEY) || 'null');
    if (savedClear && typeof savedClear === 'object') {
      _cleared = { cleared_at: Number(savedClear.cleared_at) || 0, ids: savedClear.ids || {} };
    }
  } catch (e) {}

  function isCleared(r) {
    if (r.when <= _cleared.cleared_at) return true;
    var at = _cleared.ids[r.id];
    return at != null && at >= r.when;
  }

  function shown() {
    _rows = _all.filter(function (r) { return !isCleared(r); });
    announce();
    if (_center) _center._sync();
  }

  function keepCleared() {
    var ids = _cleared.ids;
    var keys = Object.keys(ids).sort(function (a, b) { return ids[a] - ids[b]; });
    var horizon = Date.now() - 30 * 864e5;
    var kept = {};
    keys.slice(-200).forEach(function (k) { if (ids[k] >= horizon) kept[k] = ids[k]; });
    _cleared.ids = kept;
    try { localStorage.setItem(CLEARED_KEY, JSON.stringify(_cleared)); } catch (e) {}
  }

  // The integration keeps the list, so a clear lands on every open dashboard at once.
  function subscribeCleared() {
    var h = hassOf();
    var conn = h && h.connection;
    if (!conn || conn === _subConn || typeof conn.subscribeMessage !== 'function') return;
    _subConn = conn;
    Promise.resolve(conn.subscribeMessage(function (msg) {
      _synced = true;
      _cleared = { cleared_at: Number(msg && msg.cleared_at) || 0, ids: (msg && msg.ids) || {} };
      keepCleared();
      shown();
    }, { type: 'hemma/notify/subscribe' })).catch(function () {});
  }

  function clearRows(list, all) {
    var ids = {};
    var now = Date.now();
    list.forEach(function (r) { if (r.id) ids[r.id] = Math.max(r.when, now); });
    if (all) _cleared.cleared_at = Math.max(_cleared.cleared_at, Date.now());
    Object.keys(ids).forEach(function (k) { _cleared.ids[k] = ids[k]; });
    keepCleared();
    var h = hassOf();
    if (_synced && h && h.callWS) {
      Promise.resolve(h.callWS({ type: 'hemma/notify/clear', ids: ids, all: !!all }))
        .catch(function () {});
    }
    shown();
  }

  // ── Notification Center ────────────────────────────────────────────────────

  function isPhone() {
    try {
      return window.matchMedia('(max-width: 767px), (max-height: 500px)').matches;
    } catch (e) { return false; }
  }

  function seal() {
    setWatermark(Date.now());
    announce();
  }

  function capsuled(anchor) {
    try {
      return getComputedStyle(anchor).getPropertyValue('--hemma-chrome-capsule').trim() === '1';
    } catch (e) { return false; }
  }

  function lift(anchor, on) {
    if (!anchor || !anchor.style) return;
    if (isPhone() || capsuled(anchor)) return;
    if (on) {
      anchor.style.setProperty('--hemma-bell-fill', '#fff');
      anchor.style.setProperty('--hemma-bell-filter', 'brightness(0)');
    } else {
      anchor.style.removeProperty('--hemma-bell-fill');
      anchor.style.removeProperty('--hemma-bell-filter');
    }
  }

  var EASE = 'cubic-bezier(0.22,1,0.36,1)';
  var X_SVG = '<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" style="display:block;flex:none;">'
    + '<path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  function centerStyle() {
    if (document.getElementById('hemma-nc-style')) return;
    var glass = 'background:var(--hemma-perf-pill, rgba(150,152,158,0.08));'
      + '-webkit-backdrop-filter:var(--hemma-perf-none, blur(32px) saturate(1.1));'
      + 'backdrop-filter:var(--hemma-perf-none, blur(32px) saturate(1.1));';
    var rim = '{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;'
      + 'background:linear-gradient(to bottom, rgba(255,255,255,0.40), rgba(255,255,255,0.10) 22%,'
      + ' rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.07) 78%, rgba(255,255,255,0.20));'
      + '-webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);-webkit-mask-composite:xor;'
      + 'mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);mask-composite:exclude;}';
    var MORPH = '420ms cubic-bezier(0.4,0,0.2,1)';
    // Measured off Apple's: a hairline just outside the card, darker down the sides, and a one-pixel highlight inside top and bottom.
    // WebKit drops a masked border along curves; a half-pixel shadow ring on the card itself stays continuous.
    var EDGE = '0 0 0 0.5px rgba(0,0,0,0.42)';
    var st = document.createElement('style');
    st.id = 'hemma-nc-style';
    st.textContent = ''
      + '.hemma-nc-scrim{position:fixed;inset:0;z-index:99998;}'
      + '.hemma-nc{position:fixed;z-index:99999;box-sizing:border-box;display:flex;flex-direction:column;'
      + 'color:#fff;-webkit-text-size-adjust:100%;text-size-adjust:100%;}'
      + '.hemma-nc *{box-sizing:border-box;}'
      + '.hemma-nc-halo{position:absolute;left:-30px;right:-30px;top:-30px;bottom:-30px;z-index:-2;pointer-events:none;}'
      + '.hemma-nc-slot.stack .hemma-nc-halo{bottom:-39px;}'
      + '.hemma-nc-slot.stack.deep .hemma-nc-halo{bottom:-46px;}'
      + '.hemma-nc-halo > div{position:absolute;inset:0;}'
      + '.hemma-nc-shades{position:absolute;inset:0;z-index:-3;pointer-events:none;}'
      + '.hemma-nc-shades > div{position:absolute;border-radius:22px;box-shadow:var(--hemma-perf-none, 0 32px 180px rgba(0,0,0,0.5));}'
      // An outer shadow leaves its own box clear, which bare text cannot cover.
      + '.hemma-nc-shades > div.text{box-shadow:none;border-radius:50%;background:var(--hemma-perf-none, rgba(0,0,0,0.24));filter:blur(26px);}'
      + '.hemma-nc-head{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;'
      + 'min-height:26px;padding:0 0 0 8px;}'
      + '.hemma-nc-title{margin:0;font-size:18px;font-weight:700;letter-spacing:-0.01em;'
      + 'text-shadow:0 1px 8px rgba(0,0,0,0.30);white-space:nowrap;}'
      + '.hemma-nc-x{display:inline-flex;align-items:center;justify-content:center;gap:0;flex:none;'
      + 'position:relative;height:24px;min-width:24px;padding:0 7.5px;border:0;border-radius:12px;cursor:pointer;'
      + 'font:inherit;font-size:11px;font-weight:500;letter-spacing:0;color:rgba(255,255,255,0.8);'
      + glass + 'box-shadow:' + EDGE + ';transition:background-color 160ms ease, padding ' + MORPH + ';-webkit-tap-highlight-color:transparent;}'
      + '.hemma-nc-x::before' + rim
      // Apple's highlight is brightest along the top and bottom, fading into the corners and on faintly down the sides.
      + '.hemma-nc-card::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;'
      + 'background:linear-gradient(to right, rgba(255,255,255,0) 24px, rgba(255,255,255,var(--nc-hl-t, 0.15)) 62px, rgba(255,255,255,var(--nc-hl-t, 0.15)) calc(100% - 62px), rgba(255,255,255,0) calc(100% - 24px)) 0 0/100% 0.5px no-repeat,'
      + ' linear-gradient(to right, rgba(255,255,255,0) 24px, rgba(255,255,255,var(--nc-hl-2, 0.14)) 62px, rgba(255,255,255,var(--nc-hl-2, 0.14)) calc(100% - 62px), rgba(255,255,255,0) calc(100% - 24px)) 0 0.5px/100% 0.5px no-repeat,'
      + ' linear-gradient(to right, rgba(255,255,255,0) 24px, rgba(255,255,255,var(--nc-hl-b, 0.26)) 62px, rgba(255,255,255,var(--nc-hl-b, 0.26)) calc(100% - 62px), rgba(255,255,255,0) calc(100% - 24px)) 0 100%/100% 0.5px no-repeat,'
      + ' linear-gradient(to right, rgba(255,255,255,0) 24px, rgba(255,255,255,var(--nc-hl-2, 0.14)) 62px, rgba(255,255,255,var(--nc-hl-2, 0.14)) calc(100% - 62px), rgba(255,255,255,0) calc(100% - 24px)) 0 calc(100% - 0.5px)/100% 0.5px no-repeat,'
      + ' linear-gradient(rgba(255,255,255,var(--nc-hl-s, 0.06)), rgba(255,255,255,var(--nc-hl-s, 0.06)));'
      + '-webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);-webkit-mask-composite:xor;'
      + 'mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);mask-composite:exclude;}'
      + '.hemma-nc-x span{display:block;max-width:0;overflow:hidden;white-space:nowrap;opacity:0;'
      + 'transition:max-width ' + MORPH + ', opacity 200ms ease;}'
      + '.hemma-nc-x svg{transition:width ' + MORPH + ', opacity 240ms ease 160ms;}'
      + '.hemma-nc-x.open{padding:0 10px;}'
      + '.hemma-nc-x.open svg{width:0;opacity:0;transition:width ' + MORPH + ', opacity 180ms ease;}'
      + '.hemma-nc-x.open span{opacity:1;transition:max-width ' + MORPH + ', opacity 280ms ease 140ms;}'
      + '.hemma-nc-list{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;'
      // A scroller clips: the padding holds the cards' shadow, the margins put the cards back where they were.
      + 'pointer-events:none;padding:30px 30px 60px 118px;margin:-24px -30px -44px -110px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}'
      + '.hemma-nc-list::-webkit-scrollbar{display:none;}'
      + '.hemma-nc-slot{position:relative;margin-bottom:7px;pointer-events:auto;}'
      + '.hemma-nc-slot.fresh-in > .hemma-nc-card{animation:hemma-nc-in 320ms ' + EASE + ' backwards;}'
      + '@keyframes hemma-nc-in{from{opacity:0;transform:translateY(-6px);}}'
      + '.hemma-nc-card{position:relative;z-index:1;display:flex;gap:11px;align-items:center;'
      + 'padding:12px 14px 12px 12px;border-radius:22px;min-height:56px;' + glass
      + 'box-shadow:' + EDGE + ', 0 4px 16px rgba(0,0,0,0.10);'
      + 'touch-action:pan-y;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;'
      + 'transition:background-color 160ms ease, transform 300ms ' + EASE + ', opacity 220ms ease;}'
      + '.hemma-nc-card.tap{cursor:pointer;}'
      + '.hemma-nc-lead{flex:none;width:32px;height:32px;border-radius:8px;overflow:hidden;'
      + 'display:grid;place-items:center;--hemma-popup-icon-tile:32px;}'
      + '.hemma-nc-lead > div{border-radius:8px !important;}'
      + '.hemma-nc-lead img{display:block;width:100%;height:100%;object-fit:cover;}'
      + '.hemma-nc-lead.contain{background:rgba(255,255,255,0.12);}'
      + '.hemma-nc-lead.contain img{width:86%;height:86%;object-fit:contain;}'
      + '.hemma-nc-txt{flex:1;min-width:0;}'
      + '.hemma-nc-leadwrap{position:relative;flex:none;}'
      + '.hemma-nc-count{position:absolute;right:-6px;top:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;'
      + 'font-size:10.5px;font-weight:600;line-height:16px;text-align:center;color:#fff;background:rgba(60,64,72,0.92);'
      + 'box-shadow:0 0 0 0.5px rgba(0,0,0,0.45), inset 0 0.5px 0 rgba(255,255,255,0.3);}'
      + '.hemma-nc-tag{font-size:11px;font-weight:600;line-height:14px;letter-spacing:0.02em;text-transform:uppercase;'
      + 'color:rgba(255,255,255,0.45);margin-bottom:1px;}'
      + '.hemma-nc-slot.stack{margin-bottom:16px;}'
      + '.hemma-nc-slot.stack.deep{margin-bottom:23px;}'
      + '.hemma-nc-ghost{position:absolute;left:9px;right:9px;top:9px;bottom:-9px;border-radius:20px;z-index:0;pointer-events:none;'
      + glass.replace('0.08)', '0.13)') + 'box-shadow:' + EDGE + ', inset 0 -1px 0 rgba(255,255,255,0.22);}'
      + '.hemma-nc-ghost.far{left:18px;right:18px;top:16px;bottom:-16px;z-index:-1;' + glass.replace('0.08)', '0.09)') + '}'
      + '.hemma-nc-ghead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 0 1px 4px;}'
      + '.hemma-nc-ghead b{font-size:15px;font-weight:700;letter-spacing:-0.01em;color:rgba(255,255,255,0.92);'
      + 'text-shadow:0 1px 8px rgba(0,0,0,0.3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
      + '.hemma-nc-pills{display:flex;gap:6px;flex:none;}'
      + '.hemma-nc-pill{position:relative;height:24px;min-width:24px;padding:0 10px;border:0;border-radius:12px;cursor:pointer;'
      + 'display:inline-flex;align-items:center;justify-content:center;font:inherit;font-size:11px;font-weight:500;'
      + 'color:rgba(255,255,255,0.8);' + glass + 'box-shadow:' + EDGE + ';-webkit-tap-highlight-color:transparent;}'
      + '.hemma-nc-pill.round{padding:0;width:24px;}'
      + '.hemma-nc-pill svg{width:8px;height:8px;}'
      + '.hemma-nc-pill::before' + rim
      + '.hemma-nc-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;}'
      + '.hemma-nc-t{display:flex;align-items:center;gap:6px;min-width:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.92);'
      + 'letter-spacing:-0.005em;line-height:16px;}'
      + '.hemma-nc-t b{font-weight:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
      + '.hemma-nc-t i{flex:none;width:6px;height:6px;border-radius:50%;background:var(--hemma-color-teal, #00C3D0);}'
      + '.hemma-nc-when{flex:none;font-size:11px;color:rgba(255,255,255,0.55);white-space:nowrap;}'
      + '.hemma-nc-s{margin-top:1px;font-size:13px;line-height:16px;letter-spacing:-0.005em;color:rgba(255,255,255,0.85);'
      + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
      + '.hemma-nc-close{position:absolute;left:-6px;top:-6px;z-index:2;width:20px;height:20px;padding:0;'
      + 'border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:rgba(255,255,255,0.62);'
      + glass + 'box-shadow:' + EDGE + ';'
      + 'opacity:0;pointer-events:none;transition:opacity 140ms ease;}'
      + '.hemma-nc-close::before' + rim
      + '.hemma-nc-close svg{width:8px;height:8px;}'
      + '.hemma-nc-clear{position:absolute;right:0;top:0;bottom:0;width:66px;border:0;border-radius:18px;'
      + 'padding:0;cursor:pointer;font:inherit;font-size:13px;font-weight:600;color:#fff;'
      + 'background:rgba(255,69,58,0.92);opacity:0;-webkit-tap-highlight-color:transparent;}'
      + '@keyframes hemma-nc-fade{from{opacity:0;}}'
      + '.hemma-nc-empty{position:relative;width:fit-content;margin:2px 0 0 auto;padding:4px 2px;border-radius:22px;animation:hemma-nc-in 320ms ' + EASE + ' backwards;'
      + 'font-size:15px;font-weight:600;letter-spacing:-0.01em;white-space:nowrap;'
      + 'color:rgba(255,255,255,0.92);text-shadow:0 1px 8px rgba(0,0,0,0.35);}'
      + '.hemma-nc.light .hemma-nc-card, .hemma-nc.light .hemma-nc-x, .hemma-nc.light .hemma-nc-close, .hemma-nc.light .hemma-nc-pill{'
      + 'background:var(--hemma-perf-pill, rgba(250,250,252,0.46));-webkit-backdrop-filter:var(--hemma-perf-none, blur(32px) saturate(1.2));'
      + 'backdrop-filter:var(--hemma-perf-none, blur(32px) saturate(1.2));color:rgba(0,0,0,0.7);}'
      + '.hemma-nc.light .hemma-nc-card{box-shadow:' + EDGE + ', 0 4px 16px rgba(0,0,0,0.08);}'
      + '.hemma-nc.light .hemma-nc-ghost{background:rgba(250,250,252,0.32);box-shadow:' + EDGE + ', inset 0 -1px 0 rgba(255,255,255,0.5);}'
      + '.hemma-nc.light .hemma-nc-ghost.far{background:rgba(250,250,252,0.22);}'
      + '.hemma-nc.light .hemma-nc-x::before, .hemma-nc.light .hemma-nc-close::before, .hemma-nc.light .hemma-nc-pill::before{'
      + 'background:linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.3) 22%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.18) 78%, rgba(255,255,255,0.45));}'
      + '.hemma-nc.light .hemma-nc-t{color:rgba(0,0,0,0.88);}'
      + '.hemma-nc.light .hemma-nc-s{color:rgba(0,0,0,0.8);}'
      + '.hemma-nc.light .hemma-nc-when{color:rgba(0,0,0,0.5);}'
      + '.hemma-nc.light .hemma-nc-tag{color:rgba(0,0,0,0.45);}'
      + '@media (hover:hover) and (pointer:fine){'
      + '.hemma-nc.light .hemma-nc-card:hover{background-color:var(--hemma-perf-pill, rgba(250,250,252,0.6));}'
      + '.hemma-nc.light .hemma-nc-x:hover{background:rgba(250,250,252,0.62);}}'
      + '@media (hover:hover) and (pointer:fine){'
      + '.hemma-nc-card:hover{background-color:var(--hemma-perf-pill, rgba(160,162,168,0.14));}'
      + '.hemma-nc-slot:hover .hemma-nc-close{opacity:1;pointer-events:auto;}'
      + '.hemma-nc-x:hover{background:rgba(160,162,168,0.16);}}'
      + '.hemma-nc.light{--nc-hl-t:0.9;--nc-hl-b:0.75;--nc-hl-2:0.45;--nc-hl-s:0.13;--nc-glow-t:0.22;--nc-glow-b:0.16;}'
      + '.hemma-nc .hemma-nc-card, .hemma-nc.light .hemma-nc-card{'
      + 'background-image:linear-gradient(to bottom, rgba(255,255,255,var(--nc-glow-t, 0.03)), rgba(255,255,255,0) 12px,'
      + ' rgba(255,255,255,0) calc(100% - 8px), rgba(255,255,255,var(--nc-glow-b, 0.05)));'
      + '-webkit-backdrop-filter:var(--hemma-perf-none, blur(16px) saturate(1.3));backdrop-filter:var(--hemma-perf-none, blur(16px) saturate(1.3));}';
    (document.head || document.documentElement).appendChild(st);
  }

  function chromeRect(anchor) {
    var card = anchor && anchor.shadowRoot && anchor.shadowRoot.querySelector('ha-card');
    var r = (card || anchor).getBoundingClientRect();
    for (var up = anchor, i = 0; up && i < 6; i++) {
      var rootNode = up.getRootNode && up.getRootNode();
      up = rootNode && rootNode.host;
      var tpl = up && up._config && up._config.template;
      if (tpl && [].concat(tpl).indexOf('hemma_mobile_chrome') >= 0) {
        var cap = up.shadowRoot && up.shadowRoot.querySelector('ha-card');
        if (cap) r = cap.getBoundingClientRect();
        break;
      }
      if (capsuled(anchor) && tpl && [].concat(tpl).indexOf('hemma_room') >= 0) {
        var pill = up.shadowRoot && up.shadowRoot.querySelector('#chrome_pill');
        if (pill && pill.getBoundingClientRect().width) r = pill.getBoundingClientRect();
        break;
      }
    }
    return r;
  }

  function rowRight(anchor, r) {
    var right = r.right;
    var root = anchor && anchor.getRootNode && anchor.getRootNode();
    if (!root || !root.querySelectorAll) return right;
    root.querySelectorAll('button-card').forEach(function (c) {
      var t = c._config && c._config.template;
      if (!t || [].concat(t).indexOf('hemma_settings_button') < 0) return;
      var card = c.shadowRoot && c.shadowRoot.querySelector('ha-card');
      var b = (card || c).getBoundingClientRect();
      if (b.width && Math.abs(b.top - r.top) < 30 && b.right > right) right = b.right;
    });
    return right;
  }

  function groupOf(r) {
    if (r.urgent) return r.id;
    var id = String(r.id || '');
    if (id.indexOf('hemma:') === 0) return id.split(':').slice(0, 2).join(':');
    return r.entity || id;
  }

  function groupName(rows) {
    var r = rows[0];
    var KIND = {
      'hemma:co2': _hemmaT('notify.group.co2', 'Carbon dioxide'),
      'hemma:open': _hemmaT('notify.group.open', 'Open doors'),
      'hemma:plant': _hemmaT('notify.group.plants', 'Plants'),
      'hemma:appliance': _hemmaT('notify.group.appliances', 'Appliances'),
    };
    var g = groupOf(r);
    if (KIND[g]) return KIND[g];
    var h = hassOf();
    var st = h && h.states && h.states[r.entity];
    return tidyName(nameOf(st)).replace(/\s+(ding|doorbell|chime|button)$/i, '') || r.label;
  }

  function leadHtml(r) {
    var UI = window._hemmaUI;
    if (r.image) {
      return '<div class="hemma-nc-lead' + (r.imageFit === 'cover' ? '' : ' contain') + '">'
        + '<img src="' + UI.esc(r.image) + '" alt=""></div>';
    }
    return '<div class="hemma-nc-lead">' + UI.icon(r.icon || 'bell', r.tone) + '</div>';
  }

  function cardHtml(r, fresh, count) {
    var esc = window._hemmaUI.esc;
    return '<span class="hemma-nc-leadwrap">' + leadHtml(r)
      + (count > 1 ? '<span class="hemma-nc-count">' + count + '</span>' : '') + '</span>'
      + '<div class="hemma-nc-txt">'
      + (r.urgent ? '<div class="hemma-nc-tag">' + esc(_hemmaT('notify.time_sensitive', 'Time Sensitive')) + '</div>' : '')
      + '<div class="hemma-nc-top">'
      + '<span class="hemma-nc-t"><b>' + esc(r.label) + '</b>' + (fresh ? '<i></i>' : '') + '</span>'
      + '<span class="hemma-nc-when">' + esc(ago(r.when)) + '</span></div>'
      + (r.sub ? '<div class="hemma-nc-s">' + esc(r.sub) + '</div>' : '')
      + '</div>';
  }

  var _center = null;

  function openCenter(anchor) {
    if (!window._hemmaUI) return;
    centerStyle();
    var phone = isPhone();
    var r = chromeRect(anchor);
    var mark = watermark();

    var scrim = document.createElement('div');
    scrim.className = 'hemma-nc-scrim' + (phone ? ' phone' : '');

    var nc = document.createElement('div');
    var themes = (hassOf() || {}).themes;
    var dark = themes && typeof themes.darkMode === 'boolean' ? themes.darkMode
      : !(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    nc.className = 'hemma-nc' + (phone ? ' phone' : '') + (dark ? '' : ' light');
    nc.setAttribute('role', 'dialog');
    nc.setAttribute('aria-label', _hemmaT('notify.title', 'Notifications'));
    nc.style.fontFamily = window._hemmaUI.tokens.font;
    var top = Math.round(r.bottom + (phone ? 12 : 14));
    nc.style.top = top + 'px';
    nc.style.maxHeight = 'calc(100% - ' + (top + 12) + 'px)';
    var gutter = Math.max(12, Math.round(window.innerWidth - rowRight(anchor, r)));
    nc.style.width = Math.min(phone ? 460 : 346, window.innerWidth - 2 * gutter + 8) + 'px';
    nc.style.right = gutter + 'px';

    var head = document.createElement('div');
    head.className = 'hemma-nc-head';
    var title = document.createElement('h3');
    title.className = 'hemma-nc-title';
    title.textContent = _hemmaT('notify.title', 'Notifications');
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'hemma-nc-x';
    x.setAttribute('aria-label', _hemmaT('notify.clear_all', 'Clear All'));
    x.innerHTML = X_SVG + '<span>' + window._hemmaUI.esc(_hemmaT('notify.clear_all', 'Clear All')) + '</span>';
    head.appendChild(title);
    head.appendChild(x);

    var list = document.createElement('div');
    list.className = 'hemma-nc-list';
    var empty = document.createElement('div');
    empty.className = 'hemma-nc-empty';
    empty.textContent = _hemmaT('notify.none', 'No recent notifications');

    // Apple's column blur grows in strength toward the cards; one blur faded by opacity shows a sharp and a soft copy at once.
    var ramp = function (from, len) {
      var r = function (dir) {
        return 'linear-gradient(' + dir + ', transparent ' + from + 'px, #000 ' + (from + len) + 'px, #000 calc(100% - '
          + (from + len) + 'px), transparent calc(100% - ' + from + 'px))';
      };
      return r('to right') + ', ' + r('to bottom');
    };
    // Measured off Apple's over a white page: a wide soft shadow, heavier below, and only a hint of blur near the card.
    var halo = function () {
      var h = document.createElement('div');
      h.className = 'hemma-nc-halo';
      var soft = document.createElement('div');
      var f = 'var(--hemma-perf-none, blur(2px))';
      soft.style.backdropFilter = f;
      soft.style.webkitBackdropFilter = f;
      var m = ramp(0, 30);
      soft.style.webkitMaskImage = m;
      soft.style.maskImage = m;
      soft.style.webkitMaskComposite = 'source-in';
      soft.style.maskComposite = 'intersect';
      h.appendChild(soft);
      return h;
    };
    nc.appendChild(head);
    nc.appendChild(list);
    document.body.appendChild(scrim);
    document.body.appendChild(nc);
    _center = nc;
    lift(anchor, true);

    var slots = {};
    var opened = {};
    var swiped = null;
    var clearing = false;
    var idle = null;
    var idleOut = false;
    var bump = function () {
      clearTimeout(idle);
      idle = setTimeout(function () { idleOut = true; nc._close(); }, 30000);
    };

    var frost = function (slot) {
      var h = slot.querySelector(':scope > .hemma-nc-halo');
      return h ? [].slice.call(h.children) : [];
    };

    var collapse = function (slot, dir) {
      if (slot._gone) return;
      slot._gone = true;
      if (swiped === slot) swiped = null;
      delete slots[slot._ukey];
      var card = slot.firstChild;
      slot.style.height = slot.offsetHeight + 'px';
      slot.style.overflow = 'visible';
      card.style.transition = 'transform 260ms ' + EASE + ', opacity 200ms ease';
      card.style.transform = 'translateX(' + (dir < 0 ? '-110%' : '40px') + ')';
      card.style.opacity = '0';
      var btn = slot.querySelector('.hemma-nc-clear');
      if (btn) { btn.style.transition = 'opacity 160ms ease'; btn.style.opacity = '0'; }
      [].concat([].slice.call(slot.querySelectorAll('.hemma-nc-ghost')), frost(slot)).forEach(function (gh) {
        gh.style.transition = card.style.transition;
        gh.style.transform = card.style.transform;
        gh.style.opacity = '0';
      });
      var x1 = slot.querySelector('.hemma-nc-close');
      if (x1) {
        x1.style.pointerEvents = 'none';
        x1.style.transition = card.style.transition;
        x1.style.transform = card.style.transform;
        x1.style.opacity = '0';
      }
      setTimeout(function () {
        slot.style.transition = 'height 260ms ' + EASE + ', margin-bottom 260ms ' + EASE;
        slot.style.height = '0px';
        slot.style.marginBottom = '0px';
      }, 150);
      setTimeout(function () { if (slot.parentNode) slot.remove(); }, 440);
    };

    var settle = function (slot, off) {
      var card = slot.firstChild;
      var btn = slot.querySelector('.hemma-nc-clear');
      var spring = 'transform 420ms cubic-bezier(0.3, 1.35, 0.5, 1)';
      card.style.transition = spring;
      btn.style.transition = 'opacity 200ms ease';
      card.style.transform = off ? 'translateX(' + off + 'px)' : '';
      frost(slot).forEach(function (f) {
        f.style.transition = spring;
        f.style.transform = card.style.transform;
      });
      btn.style.opacity = off ? '1' : '0';
      swiped = off ? slot : (swiped === slot ? null : swiped);
    };

    var activate = function (row) {
      nc._close();
      if (row.opens) { openTarget(row.opens, row.entity); return; }
      if (!row.entity) return;
      var h = ha();
      if (h) {
        h.dispatchEvent(new CustomEvent('hass-more-info', {
          bubbles: true, composed: true, detail: { entityId: row.entity },
        }));
      }
    };

    var makeHead = function (u) {
      var slot = document.createElement('div');
      slot.className = 'hemma-nc-slot hemma-nc-ghead-slot';
      var head1 = document.createElement('div');
      head1.className = 'hemma-nc-ghead';
      var name = document.createElement('b');
      var pills = document.createElement('span');
      pills.className = 'hemma-nc-pills';
      var less = document.createElement('button');
      less.type = 'button';
      less.className = 'hemma-nc-pill';
      less.textContent = _hemmaT('notify.show_less', 'Show less');
      var drop = document.createElement('button');
      drop.type = 'button';
      drop.className = 'hemma-nc-pill round';
      drop.setAttribute('aria-label', _hemmaT('notify.clear', 'Clear'));
      drop.innerHTML = X_SVG;
      pills.appendChild(less);
      pills.appendChild(drop);
      head1.appendChild(name);
      head1.appendChild(pills);
      slot.appendChild(head1);
      slot._name = name;
      less.addEventListener('click', function (e) { e.stopPropagation(); fold(slot._group); });
      drop.addEventListener('click', function (e) { e.stopPropagation(); clearRows(slot._rows, false); });
      return slot;
    };

    var make = function (u) {
      if (u.head) return makeHead(u);
      var row = u.row;
      var slot = document.createElement('div');
      slot.className = 'hemma-nc-slot';
      var card = document.createElement('div');
      card.className = 'hemma-nc-card' + ((u.stack || row.opens || row.entity) ? ' tap' : '');
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'hemma-nc-close';
      close.setAttribute('aria-label', _hemmaT('notify.clear', 'Clear'));
      close.innerHTML = X_SVG;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hemma-nc-clear';
      btn.textContent = _hemmaT('notify.clear', 'Clear');
      slot.appendChild(card);
      slot.appendChild(close);
      slot.appendChild(btn);
      slot.appendChild(halo());

      close.addEventListener('click', function (e) {
        e.stopPropagation();
        clearRows(slot._rows, false);
      });
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        slot._dir = -1;
        clearRows(slot._rows, false);
      });

      var g = null;
      var blockClick = 0;
      var OPEN = -74;
      card.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' || slot._gone) return;
        if (swiped && swiped !== slot) settle(swiped, 0);
        var m = /translateX\((-?[\d.]+)px\)/.exec(card.style.transform || '');
        g = { x: e.clientX, y: e.clientY, base: m ? parseFloat(m[1]) : 0, off: 0, mode: null, id: e.pointerId };
      });
      card.addEventListener('pointermove', function (e) {
        if (!g || e.pointerId !== g.id) return;
        var dx = e.clientX - g.x, dy = e.clientY - g.y;
        if (!g.mode) {
          if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { g = null; return; }
          if (Math.abs(dx) < 8) return;
          g.mode = 'drag';
          try { card.setPointerCapture(e.pointerId); } catch (err) {}
          card.style.transition = 'none';
          btn.style.transition = 'none';
        }
        var off = g.base + dx;
        if (off > 0) off = off * 0.25;
        // Past the Clear button the card only stretches a little, so it never runs off the panel.
        else if (off < OPEN) off = OPEN - 28 * (1 - Math.exp((off - OPEN) / 80));
        g.off = off;
        card.style.transform = 'translateX(' + off + 'px)';
        frost(slot).forEach(function (f) { f.style.transition = 'none'; f.style.transform = card.style.transform; });
        btn.style.opacity = String(Math.max(0, Math.min(1, -off / 60)));
      });
      var end = function (e) {
        if (!g || e.pointerId !== g.id) return;
        var was = g;
        g = null;
        if (was.mode !== 'drag') return;
        blockClick = Date.now();
        bump();
        settle(slot, was.off < -40 ? OPEN : 0);
      };
      card.addEventListener('pointerup', end);
      card.addEventListener('pointercancel', end);
      card.addEventListener('click', function (e) {
        e.stopPropagation();
        if (Date.now() - blockClick < 400) return;
        if (swiped) { settle(swiped, 0); return; }
        if (slot._stack) { spread(slot._stack); return; }
        activate(slot._row);
      });
      return slot;
    };

    var paintSlot = function (slot, u) {
      slot._ukey = u.key;
      slot._group = u.group;
      slot._rows = u.rows;
      if (u.head) {
        var n = groupName(u.rows);
        if (slot._name.textContent !== n) slot._name.textContent = n;
        return;
      }
      var row = u.row;
      var count = u.stack ? u.rows.length : 0;
      var fresh = row.when > mark;
      var key = row.label + '|' + (row.sub || '') + '|' + ago(row.when) + '|' + fresh + '|' + (row.image || row.icon)
        + '|' + count + '|' + !!row.urgent;
      slot._row = row;
      slot._stack = u.stack || null;
      var depth = count > 2 ? 2 : count > 1 ? 1 : 0;
      if (slot._depth !== depth) {
        slot._depth = depth;
        slot.classList.toggle('stack', depth > 0);
        slot.classList.toggle('deep', depth > 1);
        [].forEach.call(slot.querySelectorAll('.hemma-nc-ghost'), function (gh) { gh.remove(); });
        for (var d = depth; d > 0; d--) {
          var gh = document.createElement('div');
          gh.className = 'hemma-nc-ghost' + (d > 1 ? ' far' : '');
          slot.appendChild(gh);
        }
      }
      if (slot._key === key) return;
      slot._key = key;
      slot.firstChild.innerHTML = cardHtml(row, fresh, count);
    };

    var units = function () {
      var order = [];
      var by = {};
      _rows.forEach(function (row) {
        var g = groupOf(row);
        if (!by[g]) { by[g] = []; order.push(g); }
        by[g].push(row);
      });
      var out = [];
      order.forEach(function (g) {
        var rows = by[g];
        if (rows.length < 2) {
          delete opened[g];
          out.push({ key: rows[0].id, row: rows[0], rows: rows });
        } else if (opened[g]) {
          out.push({ key: 'head:' + g, head: true, group: g, rows: rows });
          rows.forEach(function (row, i) { out.push({ key: row.id, row: row, rows: [row], group: g, index: i }); });
        } else {
          out.push({ key: 'stack:' + g, row: rows[0], rows: rows, stack: g, group: g });
        }
      });
      return out;
    };

    nc._sync = function (first, quiet) {
      if (clearing) return;
      var all = units();
      var want = {};
      all.forEach(function (u) { want[u.key] = 1; });
      Object.keys(slots).forEach(function (k) {
        if (!want[k]) collapse(slots[k], slots[k]._dir || 1);
      });
      var ref = list.firstChild;
      all.forEach(function (u) {
        var slot = slots[u.key];
        if (!slot) {
          slot = slots[u.key] = make(u);
          if (!first && !quiet) slot.classList.add('fresh-in');
        }
        slot._index = u.index || 0;
        paintSlot(slot, u);
        while (ref && ref._gone) ref = ref.nextSibling;
        if (slot !== ref) list.insertBefore(slot, ref);
        else ref = ref.nextSibling;
      });
      var none = !_rows.length;
      head.style.display = none ? 'none' : '';
      if (none && !empty.parentNode) {
        setTimeout(function () {
          if (_center === nc && !_rows.length && !empty.parentNode) list.appendChild(empty);
        }, (first || !list.querySelector('.hemma-nc-slot')) ? 0 : 380);
      } else if (!none && empty.parentNode) {
        empty.remove();
      }
      taper();
    };

    // Children move, never the slot: an animated ancestor blanks the glass's blur.
    var SPRING = (function () {
      var zeta = 0.78;
      var w = 2 * Math.PI / 0.4;
      var a = zeta * w;
      var wd = w * Math.sqrt(1 - zeta * zeta);
      var dur = Math.log(1000) / a;
      var pts = [];
      for (var i = 0; i <= 48; i++) {
        var t = dur * i / 48;
        pts.push((1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t))).toFixed(4));
      }
      pts[48] = '1';
      var ok = window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');
      return { ease: ok ? 'linear(' + pts.join(', ') + ')' : 'cubic-bezier(0.34,1.36,0.64,1)', ms: Math.round(dur * 1000) };
    })();
    var drift = function (slot, frames, opts) {
      [].forEach.call(slot.children, function (el) {
        if (!el.animate) return;
        // The swipe Clear and the hover ✕ only travel with the card; animating their opacity shows them.
        if (el.classList.contains('hemma-nc-halo')) {
          [].forEach.call(el.children, function (f) { f.animate(frames, opts); });
          return;
        }
        if (el.classList.contains('hemma-nc-clear') || el.classList.contains('hemma-nc-close')) {
          if (!frames[0].transform) return;
          el.animate(frames.map(function (f) { return { transform: f.transform }; }), opts);
          return;
        }
        el.animate(frames, opts);
      });
    };
    var flip = function (change, enter) {
      var before = new Map();
      [].forEach.call(list.children, function (el) { if (!el._gone) before.set(el, el.getBoundingClientRect().top); });
      change();
      [].forEach.call(list.children, function (el) {
        if (el._gone || !el.classList.contains('hemma-nc-slot')) return;
        var top = el.getBoundingClientRect().top;
        if (before.has(el)) {
          var dy = before.get(el) - top;
          if (Math.abs(dy) > 0.5) drift(el, [{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: SPRING.ms, easing: SPRING.ease });
        } else if (enter) {
          enter(el, top);
        }
      });
    };
    var layer = function (slot, i) {
      var card = slot.firstChild;
      card.style.zIndex = String(10 - Math.min(i, 8));
      clearTimeout(card._zt);
      card._zt = setTimeout(function () { card.style.zIndex = ''; }, 800);
    };
    var drop = function (slot) {
      slot._gone = true;
      delete slots[slot._ukey];
      if (swiped === slot) swiped = null;
      slot.remove();
    };

    var spread = function (g) {
      var stack = slots['stack:' + g];
      if (!stack) return;
      settle2(SPRING.ms + 160);
      var from = stack.getBoundingClientRect().top;
      flip(function () {
        drop(stack);
        opened[g] = true;
        nc._sync(false, true);
      }, function (el, top) {
        if (el.classList.contains('hemma-nc-ghead-slot')) {
          drift(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 120, easing: 'ease', fill: 'backwards' });
          return;
        }
        var i = el._index || 0;
        layer(el, i);
        drift(el, [
          { transform: 'translateY(' + (from - top) + 'px) scale(' + (i ? 0.94 : 1) + ')', opacity: i ? 0 : 1 },
          { transform: 'none', opacity: 1 },
        ], { duration: SPRING.ms, delay: Math.min(i, 4) * 25, easing: SPRING.ease, fill: 'backwards' });
      });
    };

    var fold = function (g) {
      var group = [].filter.call(list.children, function (el) { return !el._gone && el._group === g && !el._stack; });
      var cards = group.filter(function (el) { return !el.classList.contains('hemma-nc-ghead-slot'); });
      if (!cards.length) return;
      var lead = cards[0];
      var leadTop = lead.getBoundingClientRect().top;
      // A positioned scroller would make WebKit blur only what is inside it, so these anchor to the panel.
      var box = nc.getBoundingClientRect();
      var spots = group.filter(function (el) { return el !== lead; }).map(function (el) {
        var b = el.getBoundingClientRect();
        return { el: el, top: b.top - box.top, left: b.left - box.left, width: b.width };
      });
      var landed = leadTop;
      settle2(SPRING.ms + 60);
      flip(function () {
        drop(lead);
        spots.forEach(function (p) {
          var el = p.el;
          el._gone = true;
          delete slots[el._ukey];
          if (swiped === el) swiped = null;
          el.style.position = 'absolute';
          el.style.top = p.top + 'px';
          el.style.left = p.left + 'px';
          el.style.width = p.width + 'px';
          el.style.margin = '0';
          el.style.pointerEvents = 'none';
        });
        delete opened[g];
        nc._sync(false, true);
      }, function (el, top) {
        landed = top;
        layer(el, 0);
        drift(el, [{ transform: 'translateY(' + (leadTop - top) + 'px)' }, { transform: 'none' }],
          { duration: SPRING.ms, easing: SPRING.ease });
      });
      spots.forEach(function (p, n) {
        var el = p.el;
        if (el.classList.contains('hemma-nc-ghead-slot')) {
          drift(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease', fill: 'forwards' });
        } else {
          layer(el, n + 1);
          drift(el, [
            { transform: 'none', opacity: 1 },
            { transform: 'translateY(' + (landed - el.getBoundingClientRect().top) + 'px) scale(0.94)', opacity: 0 },
          ], { duration: SPRING.ms, easing: SPRING.ease, fill: 'forwards' });
        }
        setTimeout(function () { if (el.parentNode) el.remove(); }, SPRING.ms + 40);
      });
    };

    var label = x.querySelector('span');
    var expand = function (on) {
      // The label's own width, not a generous cap, or the morph spends most of its time on nothing.
      label.style.maxWidth = on ? label.scrollWidth + 'px' : '';
      x.classList.toggle('open', !!on);
      clearTimeout(x._t);
      if (on) x._t = setTimeout(function () { expand(false); }, 3000);
    };
    x.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') expand(true); });
    x.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') expand(false); });
    x.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!x.classList.contains('open')) { expand(true); return; }
      if (clearing) return;
      clearing = true;
      clearTimeout(x._t);
      var all = _rows.slice();
      var live = [].slice.call(list.querySelectorAll('.hemma-nc-slot'));
      var DUR = 480, STEP = 40, OUT = 'cubic-bezier(0.4,0,0.2,1)';
      var fadeX = x.animate ? x.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: OUT, fill: 'forwards' }) : null;
      live.forEach(function (slot, i) {
        slot._gone = true;
        delete slots[slot._ukey];
        var cx = slot.querySelector('.hemma-nc-close');
        if (cx) cx.style.opacity = '0';
        drift(slot, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(56px)' }],
          { duration: DUR, delay: Math.min(i, 8) * STEP, easing: OUT, fill: 'forwards' });
      });
      setTimeout(function () {
        live.forEach(function (slot) { slot.remove(); });
        clearing = false;
        expand(false);
        clearRows(all, true);
        if (fadeX) fadeX.cancel();
      }, DUR + Math.min(Math.max(live.length - 1, 0), 8) * STEP);
    });

    var TAPER = 100;
    var tapering = 0;
    var settling = 0;
    var settle2 = function (ms) {
      settling++;
      setTimeout(function () { settling--; taper(); }, ms);
    };

    function taper() {
      if (settling) return;
      var lb = list.getBoundingClientRect();
      var edge = Math.min(lb.bottom, window.innerHeight) - 8;
      var left = list.scrollHeight - list.clientHeight - list.scrollTop;
      var room = Math.max(0, Math.min(1, left / TAPER));
      [].forEach.call(list.children, function (slot) {
        if (slot._gone || !slot.classList.contains('hemma-nc-slot') || slot.classList.contains('hemma-nc-ghead-slot')) return;
        var card = slot.firstChild;
        var b = card.getBoundingClientRect();
        var t = room * Math.max(0, Math.min(1, (b.bottom - (edge - TAPER)) / TAPER));
        var op = t ? (1 - 0.85 * t).toFixed(3) : '';
        var sc = t ? (1 - 0.07 * t).toFixed(4) : '';
        if (card.style.opacity !== op && swiped !== slot) card.style.opacity = op;
        if (card.style.scale !== sc) { card.style.scale = sc; card.style.transformOrigin = '50% 0'; }
        [].concat([].slice.call(slot.querySelectorAll('.hemma-nc-ghost')), frost(slot)).forEach(function (gh) { gh.style.opacity = op; });
      });
    }
    list.addEventListener('scroll', function () {
      if (tapering) return;
      tapering = requestAnimationFrame(function () { tapering = 0; taper(); });
    }, { passive: true });

    nc.addEventListener('click', function () { if (swiped) settle(swiped, 0); });
    nc.addEventListener('pointerdown', bump, true);
    nc.addEventListener('wheel', bump, { passive: true, capture: true });
    scrim.addEventListener('click', function (e) { e.stopPropagation(); nc._close(); });

    // A scroller clips, so the shadows live outside it and copy each card's place and fade every frame.
    var shades = document.createElement('div');
    shades.className = 'hemma-nc-shades';
    var shadeOf = new Map();
    var shadeRaf = 0;
    var mirror = function () {
      shadeRaf = requestAnimationFrame(mirror);
      var nb = nc.getBoundingClientRect();
      var lb = list.getBoundingClientRect();
      var seen = new Set();
      [].forEach.call(list.children, function (slot) {
        if (!slot.classList.contains('hemma-nc-slot') || slot.classList.contains('hemma-nc-ghead-slot')) return;
        var card = slot.firstChild;
        var b = card.getBoundingClientRect();
        var extra = slot.classList.contains('deep') ? 16 : slot.classList.contains('stack') ? 9 : 0;
        var sh = shadeOf.get(slot);
        if (!sh) { sh = shades.appendChild(document.createElement('div')); shadeOf.set(slot, sh); }
        seen.add(slot);
        var shown = Math.max(0, Math.min(b.bottom, lb.bottom) - Math.max(b.top, lb.top)) / Math.max(1, b.height);
        var op = (Number(getComputedStyle(card).opacity) * shown).toFixed(3);
        var css = 'left:' + (b.left - nb.left) + 'px;top:' + (b.top - nb.top) + 'px;width:' + b.width + 'px;height:' + (b.height + extra) + 'px;opacity:' + op;
        if (sh._css !== css) { sh._css = css; sh.style.cssText = css; }
      });
      if (empty.isConnected) {
        var eb = empty.getBoundingClientRect();
        var es = shadeOf.get(empty);
        if (!es) { es = shades.appendChild(document.createElement('div')); es.className = 'text'; shadeOf.set(empty, es); }
        seen.add(empty);
        var ecss = 'left:' + (eb.left - nb.left - 24) + 'px;top:' + (eb.top - nb.top - 14) + 'px;width:' + (eb.width + 48) + 'px;height:' + (eb.height + 28)
          + 'px;opacity:' + Number(getComputedStyle(empty).opacity).toFixed(3);
        if (es._css !== ecss) { es._css = ecss; es.style.cssText = ecss; }
      }
      shadeOf.forEach(function (sh, slot) {
        if (seen.has(slot)) return;
        sh.remove();
        shadeOf.delete(slot);
      });
    };
    nc.insertBefore(shades, nc.firstChild);
    mirror();
    nc._sync(true);
    bump();
    // Each glass piece moves on its own: an animated ancestor leaves their blur blank until it settles.
    var pieces = function () {
      return [title, x, empty].concat([].slice.call(list.querySelectorAll('.hemma-nc-card, .hemma-nc-ghost, .hemma-nc-ghead, .hemma-nc-halo > div')));
    };
    var away = phone ? 'translateY(-14px)' : 'translateX(28px)';
    pieces().forEach(function (el) {
      if (!el.animate) return;
      el.animate([{ opacity: 0, transform: away }, { opacity: 1, transform: 'none' }],
        { duration: 420, easing: EASE, fill: 'backwards' });
    });
    requestAnimationFrame(function () { scrim.classList.add('on'); });

    var yielded = [];
    var box = nc.getBoundingClientRect();
    var yieldTo = function (c) {
      var t = c._config && c._config.template;
      t = t ? [].concat(t) : [];
      if (t.indexOf('hemma_weather') < 0 && t.indexOf('hemma_mobile_weather') < 0) return;
      if (yielded.some(function (y) { return y.el === c; })) return;
      var b = c.getBoundingClientRect();
      if (!b.width || b.right < box.left || b.left > box.right || b.bottom < box.top - 8 || b.top > box.bottom) return;
      if (!c.animate) return;
      yielded.push({ el: c, anim: c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease', fill: 'forwards' }) });
    };
    var bar = document.querySelector('hemma-nav-bar');
    [bar && bar.shadowRoot, anchor && anchor.getRootNode && anchor.getRootNode()].forEach(function (root) {
      if (root && root.querySelectorAll) root.querySelectorAll('button-card').forEach(yieldTo);
    });
    // The phone's title and weather are one header card in the view, out of the bell's reach.
    if (phone) {
      (function walk(root, depth) {
        if (!root || depth > 12 || !root.querySelectorAll) return;
        root.querySelectorAll('*').forEach(function (el) {
          if (el.tagName === 'BUTTON-CARD') yieldTo(el);
          if (el.shadowRoot) walk(el.shadowRoot, depth + 1);
        });
      })(document, 0);
    }

    var width = window.innerWidth;
    var onKey = function (e) { if (e.key === 'Escape') nc._close(); };
    var onResize = function () { if (window.innerWidth !== width) nc._close(); };

    nc._close = function () {
      setTimeout(function () { cancelAnimationFrame(shadeRaf); }, 460);
      if (_center !== nc) return;
      _center = null;
      clearTimeout(idle);
      clearTimeout(x._t);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onResize);
      lift(anchor, false);
      if (!idleOut) seal();
      scrim.classList.remove('on');
      nc.style.pointerEvents = 'none';
      yielded.forEach(function (y) {
        y.anim.reverse();
        y.anim.onfinish = function () { y.anim.cancel(); };
      });
      pieces().forEach(function (el) {
        if (!el.animate) { el.style.opacity = '0'; return; }
        el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: away }],
          { duration: 260, easing: 'ease-in', fill: 'forwards' });
      });
      setTimeout(function () {
        if (scrim.parentNode) scrim.remove();
        if (nc.parentNode) nc.remove();
      }, 440);
    };

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
  }

  function open(anchor) {
    if (_center) { _center._close(); return; }
    var pop = window.hemmaPopup && window.hemmaPopup.element;
    if (pop && pop.hasAttribute('open')) { window.hemmaPopup.close(); return; }

    var show = function () { openCenter(anchor); };
    // Opening waits on the network only the very first time.
    if (_all.length) { show(); collect(); } else { collect().then(show); }
  }

  // The categories a dashboard can switch off, as the panel writes them.
  var TYPES = ['safety', 'air', 'locks', 'alarm', 'doorbell', 'doors', 'people',
    'vacuum', 'appliances', 'plants', 'battery', 'updates', 'restart'];

  function configureFrom(V) {
    V = V || {};
    var types = {};
    TYPES.forEach(function (k) {
      if (V['notify_' + k] === false) types[k] = false;
    });

    var list = Array.isArray(V.notification_appliances) ? V.notification_appliances : [];
    var timers = (V.notification_appliance_timers
      && typeof V.notification_appliance_timers === 'object')
      ? V.notification_appliance_timers : {};

    var num = function (x) {
      if (x === null || x === undefined || x === '') return undefined;
      var n = Number(x);
      return isFinite(n) ? n : undefined;
    };

    return configure({
      types: types,
      appliances: list.filter(Boolean).map(function (e) {
        return { entity: e, remaining: timers[e] || undefined };
      }),
      battery: num(V.notification_battery_threshold),
      battery_hold: num(V.notification_battery_hold_minutes),
      open_minutes: num(V.notification_open_minutes),
      co2: num(V.notification_co2_ppm),
      read_entity: V.notification_read_entity || null,
    });
  }

  if (window._hemmaNotifyCfg) {
    try { configureFrom(window._hemmaNotifyCfg); } catch (e) {}
  }

  window._hemmaNotify = {
    open: open,
    close: function () { if (_center) _center._close(); },
    clearAll: function () { clearRows(_rows.slice(), true); },
    refresh: collect,
    configure: configure,
    configureFrom: configureFrom,
    markAll: seal,
    get count() { return unread(); },
    get rows() { return _rows.slice(); },
  };

  function boot() {
    var tick = function () { if (!document.hidden) collect(); };
    var wait = setInterval(function () {
      if (!hassOf()) return;
      clearInterval(wait);
      subscribeCleared();
      tick();
      setInterval(tick, POLL_MS);
      // A new bell arrives with every view change and starts out empty.
      window.addEventListener('location-changed', function () {
        _bells = [];
        setTimeout(announce, 120);
      }, true);
      setInterval(announce, 2000);
    }, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

// HACS serves button-card cached, so some cards render before this file runs.
(function () {
  var waiting = window._hemmaCoreWaiters;
  window._hemmaCoreWaiters = null;
  // Retained so a sibling resource landing after this flush can re-kick them.
  window._hemmaKicked = waiting;
  if (!waiting || typeof window.hemmaKick !== 'function') return;
  setTimeout(function () {
    waiting.forEach(function (el) { window.hemmaKick(el); });
  }, 0);
})();

// Return to Home after a spell without input, for wall tablets. Off unless a
// dashboard asks for it in Hemma Studio under General > Dashboard.
(function () {
  if (window._hemmaIdleHome) return;
  window._hemmaIdleHome = true;

  var POLL_MS = 10000;
  var OFF = /[?&]hemma_idle=0/.test(location.search);
  // The tablet navbar's own test, so one dashboard reads the same under either.
  var TABLET = window.matchMedia
    ? window.matchMedia('(hover: none) and (pointer: coarse) and (min-width: 600px)')
    : null;

  var last = Date.now();
  function bump() { last = Date.now(); }

  ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach(function (t) {
    window.addEventListener(t, bump, { capture: true, passive: true });
  });
  window.addEventListener('location-changed', bump, true);

  function deep(root, tag, depth) {
    if (!root || depth > 10 || !root.querySelector) return null;
    var hit = root.querySelector(tag);
    if (hit) return hit;
    var kids = root.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].shadowRoot) {
        var f = deep(kids[i].shadowRoot, tag, depth + 1);
        if (f) return f;
      }
    }
    return null;
  }

  var _root = null;
  function huiRoot() {
    if (_root && _root.isConnected) return _root;
    _root = deep(document, 'hui-root', 0);
    return _root;
  }

  function config() {
    var root = huiRoot();
    var ll = (root && root.lovelace) || {};
    return ll.editMode ? null : (ll.config || null);
  }

  // The setting is a room variable, like every other dashboard-scoped one, so
  // it rides along in the hero card of each view.
  function minutes(cfg) {
    var views = (cfg && cfg.views) || [];
    for (var i = 0; i < views.length; i++) {
      var card = ((views[i].cards || [])[0]) || {};
      var v = (card.variables || {}).hemma_idle_home;
      if (v !== undefined && v !== null && v !== '') return parseFloat(v) || 0;
    }
    return 0;
  }

  // Never hard-code the path: dashboards get renamed and people run more than one.
  function homePath(cfg) {
    var views = (cfg && cfg.views) || [];
    if (!views.length) return null;
    var home = null;
    for (var i = 0; i < views.length; i++) {
      if (views[i].path === 'home') { home = views[i]; break; }
    }
    if (!home) home = views[0];
    var parts = String(location.pathname).split('/').filter(Boolean);
    if (!parts.length) return null;
    return '/' + parts[0] + '/' + (home.path || '');
  }

  function norm(p) { return String(p || '').replace(/\/+$/, '') || '/'; }

  function check() {
    if (OFF || !TABLET || !TABLET.matches) return bump();
    var cfg = config();
    if (!cfg) return bump();
    var mins = minutes(cfg);
    if (!mins) return bump();
    var home = homePath(cfg);
    var busy = typeof window._hemmaNavBusy === 'function' && window._hemmaNavBusy();
    var away = norm(location.pathname) !== norm(home);
    if (!home || (!away && !busy)) return bump();
    // Never pull the view out from under someone reading a popup.
    if (window.hemmaPopup && window.hemmaPopup.surface) return bump();
    if (Date.now() - last < mins * 60000) return;
    if (busy && typeof window._hemmaNavReset === 'function') window._hemmaNavReset();
    if (away) {
      history.pushState(null, '', home);
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    }
    bump();
  }

  setInterval(check, POLL_MS);
  // A tablet coming back from sleep has been idle the whole time.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) check();
  });
})();

// The mobile filter, per device. It lives in an input_select so the button-card
// templates re-render when it changes, but an entity is one value for the whole
// house, so two phones open at once drove each other. Each device now keeps its
// own and the entity is rewritten on the way to the cards, which leaves the
// templates untouched and the helper still correct for automations.
(function () {
  if (window._hemmaFilter) return;

  var ENTITY = 'input_select.hemma_mobile_filter';
  var KEY = 'hemma_mobile_filter';
  var listeners = [];
  var current = null;

  function get() {
    if (current !== null) return current;
    try { current = localStorage.getItem(KEY) || 'all'; } catch (e) { current = 'all'; }
    return current;
  }

  function set(v) {
    v = String(v == null ? 'all' : v) || 'all';
    if (get() === v) return v;
    current = v;
    try { localStorage.setItem(KEY, v); } catch (e) {}
    listeners.slice().forEach(function (fn) { try { fn(v); } catch (e) {} });
    return v;
  }

  // One hass object arrives per update and is handed to every card, so the
  // rewrite is memoized on it rather than repeated down the tree.
  var lastIn = null, lastVal = null, lastOut = null;

  function apply(hass) {
    if (!hass || !hass.states) return hass;
    var ent = hass.states[ENTITY];
    if (!ent) return hass;                    // no helper: nothing to stand in for
    var v = get();
    if (ent.state === v) return hass;
    if (hass === lastIn && v === lastVal) return lastOut;
    var states = Object.assign({}, hass.states);
    states[ENTITY] = Object.assign({}, ent, { state: v });
    var out = Object.assign({}, hass);
    out.states = states;
    lastIn = hass; lastVal = v; lastOut = out;
    return out;
  }

  // Keeps the helper current for anyone automating on it. The other devices
  // ignore it, because each one rewrites it with its own value on the way in.
  function share(hass, v) {
    if (!hass || typeof hass.callWS !== 'function') return;
    if (hass.connection && hass.connection.connected === false) return;
    var ent = hass.states && hass.states[ENTITY];
    if (!ent || ent.state === v) return;
    try {
      Promise.resolve(hass.callWS({ type: 'call_service', domain: 'input_select',
        service: 'select_option', service_data: { entity_id: ENTITY, option: v } }))
        .catch(function () {});
    } catch (e) {}
  }

  // The badge row and the room headers tap through this, since a button-card
  // tap_action cannot call a function directly.
  window.addEventListener('ll-custom', function (ev) {
    var d = ev.detail || {};
    if (!('hemma_filter' in d)) return;
    ev.stopPropagation();
    var v = set(d.hemma_filter);
    var ha = document.querySelector('home-assistant');
    share(ha && ha.hass, v);
  }, true);

  window._hemmaFilter = {
    ENTITY: ENTITY,
    get: get,
    set: set,
    apply: apply,
    share: share,
    onChange: function (fn) {
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (x) { return x !== fn; });
      };
    },
  };
})();
