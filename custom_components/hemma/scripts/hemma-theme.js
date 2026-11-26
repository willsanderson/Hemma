(function () {
  if (window.hemmaTheme) return;
  var KEY = 'hemma_theme_paths', el = null, applied = '', paths = [];
  try { paths = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { paths = []; }
  var ha = function () { return document.querySelector('home-assistant'); };
  var seg = function () { return (location.pathname.split('/')[1] || ''); };
  var config = function () {
    try {
      var main = ha().shadowRoot.querySelector('home-assistant-main');
      var p = main.shadowRoot.querySelector('ha-panel-lovelace');
      return p && p.lovelace && p.lovelace.config;
    } catch (e) { return null; }
  };
  var isHemma = function () {
    var h = ha() && ha().hass, s = seg(), pn = h && h.panels && h.panels[s];
    if (s === 'hemma-studio' || s === 'hemma-native') return true;
    if (!pn || pn.component_name !== 'lovelace') return false;
    var c = config();
    try { var lp = ha().shadowRoot.querySelector('home-assistant-main').shadowRoot.querySelector('ha-panel-lovelace'); if (!lp || !lp.panel || lp.panel.url_path !== s) c = null; } catch (e) { c = null; }
    if (c && c.button_card_templates) {
      var yes = Object.keys(c.button_card_templates).some(function (k) { return k.indexOf('hemma_') === 0; });
      var i = paths.indexOf(s);
      if (yes && i < 0) paths.push(s); else if (!yes && i >= 0) paths.splice(i, 1);
      try { localStorage.setItem(KEY, JSON.stringify(paths)); } catch (e) {}
      return yes;
    }
    return paths.indexOf(s) >= 0;
  };
  var userTheme = function (h) {
    var sel = h.selectedTheme && h.selectedTheme.theme;
    if (sel && sel !== 'default' && !(h.themes.themes || {})[sel]) sel = '';
    if (sel) return sel;
    var dark = isDark(h);
    return (dark && h.themes.default_dark_theme) || h.themes.default_theme || 'default';
  };
  var isDark = function (h) { return !!(h.themes && h.themes.darkMode); };
  var vars = function (t, dark) {
    var out = {}, put = function (o) {
      Object.keys(o || {}).forEach(function (k) {
        if (k === 'modes') return;
        var v = String(o[k]);
        out['--' + k] = v;
        if (v.charAt(0) === '#' && o['rgb-' + k] === undefined) {
          var m = v.length === 4 ? v.slice(1).split('').map(function (c) { return parseInt(c + c, 16); }) : [1, 3, 5].map(function (i) { return parseInt(v.slice(i, i + 2), 16); });
          if (m.every(function (n) { return n >= 0; })) out['--rgb-' + k] = m.join(',');
        }
      });
    };
    put(t); put((t.modes || {})[dark ? 'dark' : 'light']);
    return out;
  };
  var defaults = function () {
    var out = {};
    [].forEach.call(document.styleSheets, function (sh) {
      if (sh.ownerNode === el) return;
      try {
        [].forEach.call(sh.cssRules, function (r) {
          if (!r.style || !/^(html|:root)$/.test(String(r.selectorText).trim())) return;
          for (var i = 0; i < r.style.length; i++) { var k = r.style[i]; if (k.indexOf('--') === 0 && !r.style.getPropertyPriority(k)) out[k] = r.style.getPropertyValue(k); }
        });
      } catch (e) {}
    });
    return out;
  };
  // hv-ink-w darkens --ha-color-on-neutral-loud for its light buttons; HA's toast reads it over a near-black fill.
  var toastInk = function () {
    try {
      var nm = document.querySelector('home-assistant').shadowRoot.querySelector('notification-manager');
      (nm && nm.shadowRoot ? nm.shadowRoot.querySelectorAll('ha-toast') : []).forEach(function (t) { t.style.setProperty('--ha-color-on-neutral-loud', 'var(--white-color, #fff)'); });
    } catch (e) {}
  };
  window.addEventListener('hass-notification', function () { toastInk(); requestAnimationFrame(toastInk); }, true);
  [0, 1000, 4000, 10000].forEach(function (ms) { setTimeout(toastInk, ms); });
  var LOOK = 'hemma_ha_look', looked = '', settle = 0, keptAt = 0, keepT = 0;
  var sheets = function () { return [].slice.call(document.querySelectorAll('style[id^="hemma-"], link[rel="stylesheet"][href*="/hemma_assets/"]')).filter(function (s) { return s !== el; }); };
  var still = function () {
    var H = document.documentElement, was = H.style.transition, off = document.createElement('style');
    off.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0s!important}';
    document.head.appendChild(off);
    H.style.transition = 'none';
    cancelAnimationFrame(settle);
    settle = requestAnimationFrame(function () { settle = requestAnimationFrame(function () { off.remove(); if (H.style.transition === 'none') { if (was && was !== 'none') H.style.transition = was; else H.style.removeProperty('transition'); } }); });
  };
  var quiet = function (off) {
    var H = document.documentElement, change = false;
    sheets().forEach(function (s) {
      if (off && !s.hasAttribute('data-hemma-quiet')) { s.setAttribute('data-hemma-quiet', s.getAttribute('media') || ''); s.setAttribute('media', 'not all'); change = true; }
      else if (!off && s.hasAttribute('data-hemma-quiet')) { var m = s.getAttribute('data-hemma-quiet'); if (m) s.setAttribute('media', m); else s.removeAttribute('media'); s.removeAttribute('data-hemma-quiet'); change = true; }
    });
    if (off && H.style.backgroundColor && !H.hasAttribute('data-hemma-bg')) { H.setAttribute('data-hemma-bg', H.style.backgroundColor); H.style.removeProperty('background-color'); change = true; }
    else if (!off && H.hasAttribute('data-hemma-bg')) { if (!H.style.backgroundColor) H.style.backgroundColor = H.getAttribute('data-hemma-bg'); H.removeAttribute('data-hemma-bg'); change = true; }
    if (change) still();
  };
  var remember = function () {
    var H = document.documentElement, css = {};
    sheets().forEach(function (s) { if (s.tagName === 'STYLE' && s.id && !s.hasAttribute('data-hemma-cached')) css[s.id] = s.textContent; });
    if (!css['hemma-hv-style'] && !Object.keys(css).length) return;
    var vars = {};
    [].forEach.call(H.style, function (k) { if (k.indexOf('--hv-') === 0 || k.indexOf('--hemma-') === 0) vars[k] = H.style.getPropertyValue(k); });
    var cs = getComputedStyle(H), comp = {};
    ['--hv-backdrop', '--hv-bg-solid', '--hv-bg', '--hv-veil'].forEach(function (k) { var v = cs.getPropertyValue(k).trim(); if (v) comp[k] = v; });
    var look = JSON.stringify({ comp: comp, css: css, cls: [].filter.call(H.classList, function (c) { return c === 'hemma-hv' || c.indexOf('hv-') === 0; }), vars: vars, bg: H.style.backgroundColor || '' });
    if (look === looked) return;
    looked = look;
    try { localStorage.setItem(LOOK, look); } catch (e) {}
  };
  var recall = function () {
    if (document.getElementById('hemma-hv-style') || document.querySelector('style[data-hemma-cached]')) return;
    var look = null;
    try { look = JSON.parse(localStorage.getItem(LOOK) || 'null'); } catch (e) {}
    if (!look || !look.css) return;
    var H = document.documentElement;
    still();
    Object.keys(look.css).forEach(function (id) {
      if (document.getElementById(id)) return;
      var st = document.createElement('style'); st.id = id; st.setAttribute('data-hemma-cached', ''); st.textContent = look.css[id]; document.head.appendChild(st);
    });
    (look.cls || []).forEach(function (c) { H.classList.add(c); });
    H.classList.add('hv-ha');
    Object.keys(look.vars || {}).forEach(function (k) { if (!H.style.getPropertyValue(k)) H.style.setProperty(k, look.vars[k]); });
    if (look.bg && !H.style.backgroundColor) H.style.backgroundColor = look.bg;
  };
  var dedupe = function () {
    [].forEach.call(document.querySelectorAll('style[data-hemma-cached]'), function (c) {
      var real = [].some.call(document.querySelectorAll('style#' + c.id), function (x) { return x !== c && !x.hasAttribute('data-hemma-cached'); });
      if (real) c.remove();
    });
  };
  var apply = function () {
    var h = ha() && ha().hass;
    if (!h || !h.themes) return;
    var t = (h.themes.themes || {}).Hemma, dark = isDark(h), mine = isHemma(), own = userTheme(h) === 'Hemma';
    dedupe();
    if (mine && seg() !== 'hemma-studio' && seg() !== 'hemma-native') { var now = Date.now(); clearTimeout(keepT); if (now - keptAt > 3000) { keptAt = now; remember(); } else keepT = setTimeout(function () { keptAt = Date.now(); if (isHemma()) remember(); }, 3000); }
    else if (own) recall();
    quiet(!mine && !own);
    var want = t && mine && !own ? userTheme(h) + '|' + dark : '';
    if (want === applied) return;
    applied = want;
    if (!want) { if (el) { el.remove(); el = null; } document.documentElement.removeAttribute('data-hemma-theme'); }
    else {
      if (!el) { el = document.createElement('style'); el.id = 'hemma-theme'; document.head.appendChild(el); el.textContent = ':where(:root){}'; }
      var r = el.sheet.cssRules[0], v = vars(t, dark), ut = (h.themes.themes || {})[userTheme(h)], base = ut ? defaults() : {};
      if (ut) Object.keys(vars(ut, dark)).forEach(function (k) { if (!(k in v)) v[k] = base[k] || 'initial'; });
      r.style.cssText = '';
      Object.keys(v).forEach(function (k) { r.style.setProperty(k, v[k], 'important'); });
      document.documentElement.setAttribute('data-hemma-theme', dark ? 'dark' : 'light');
    }
    document.dispatchEvent(new CustomEvent('uix-update', { detail: { reason: 'theme', variablesChanged: true } }));
  };
  var soon = function () { apply(); [60, 400, 1500].forEach(function (ms) { setTimeout(apply, ms); }); };
  window.addEventListener('location-changed', soon);
  window.addEventListener('popstate', soon);
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(apply).observe(document.head, { childList: true });
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply); } catch (e) {}
  window.hemmaTheme = { apply: apply, active: function () { return applied; } };
  soon();
})();
