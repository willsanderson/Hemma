// smart-row.js

const EMPTY_SET = new Set();
const activeStates     = () => window.HEMMA_ACTIVE_STATES || EMPTY_SET;
const filterCategories = () => window.HEMMA_FILTER_CATEGORIES || {};

(function measureSafeArea() {
  function measure() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;right:0;width:0;height:0;pointer-events:none;visibility:hidden;';
    probe.style.paddingLeft  = 'env(safe-area-inset-left, 0px)';
    probe.style.paddingRight = 'env(safe-area-inset-right, 0px)';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const l = cs.paddingLeft, r = cs.paddingRight;
    probe.remove();
    document.documentElement.style.setProperty('--hemma-measured-safe-left', l);
    document.documentElement.style.setProperty('--hemma-measured-safe-right', r);
  }
  if (document.body) measure();
  else document.addEventListener('DOMContentLoaded', measure, { once: true });
  window.addEventListener('resize', measure);
  window.addEventListener('orientationchange', measure);
})();

const PAGE_ANIM_MS  = 900;  // time for the card entrance animation to finish
const SORT_DELAY_MS = 2500; // hold time before a state change triggers a sort
const SORT_MS       = 450;  // FLIP slide duration
const EASE_FORWARD  = 'cubic-bezier(0.4, 0, 0.2, 1)';
const EASE_BACK     = 'cubic-bezier(0.4, 0, 0.2, 1)';
const STAGGER_MS    = 0;    // all cards move together

function resolveCardConfig(cfg) {
  let c = cfg, depth = 0;
  while (c?.type === 'conditional' && c.card && depth++ < 4) c = c.card;
  return c;
}

// Performance mode, asked twice: hemma-core owns the answer, but it is a
// separate resource, so early on the only evidence is the stylesheet it wrote.
function perfOn() {
  try {
    if (window._hemmaPerf && window._hemmaPerf.on()) return true;
  } catch (e) {}
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--hemma-anim-duration').trim();
    return v === '0s' || v === '0';
  } catch (e) { return false; }
}

// Opt in with ?hemma_rowlog=1 on the dashboard URL. Off, this costs one
// property read per call and prints nothing.
let ROWLOG = null;
function rowLog() {
  if (ROWLOG === null) {
    try { ROWLOG = /[?&]hemma_rowlog=1/.test(location.search) || !!window.HEMMA_ROW_DEBUG; }
    catch (e) { ROWLOG = false; }
  }
  if (!ROWLOG) return;
  console.info.apply(console, ['hemma-row'].concat([].slice.call(arguments)));
}

function isCardDisabled(cfg, phone) {
  const c = resolveCardConfig(cfg);
  const v = c && c.variables && c.variables.enabled;
  if (v === false || v === 'false' || v === 0 || v === '0') return true;
  const s = c && c.variables && c.variables.surfaces;
  if (s === 'phone')   return !phone;
  if (s === 'desktop') return !!phone;
  return false;
}

// A card with no template is one Hemma only stores: it draws whatever it likes
// at whatever height, and the tracks here are fixed.
function isRawCard(cfg) {
  const c = resolveCardConfig(cfg);
  return !!c && !c.template && !String(c.type || '').startsWith('custom:hemma-');
}

// button-card's templates, reached the way button-card reaches them.
let _llTpl = null;
function llTemplates() {
  if (_llTpl) return _llTpl;
  try {
    let e = document.querySelector('home-assistant');
    e = e && e.shadowRoot && e.shadowRoot.querySelector('home-assistant-main');
    e = e && (e.shadowRoot || e);
    e = e && e.querySelector('partial-panel-resolver, ha-drawer partial-panel-resolver');
    e = e && (e.shadowRoot || e);
    e = e && e.querySelector('ha-panel-lovelace');
    e = e && e.shadowRoot && e.shadowRoot.querySelector('hui-root');
    const t = e && e.lovelace && e.lovelace.config
      && e.lovelace.config.button_card_templates;
    if (t) _llTpl = t;
    return t || {};
  } catch (e) { return {}; }
}

// `show_when: active` is almost always declared in the template rather than on
// the card, and reading only the card missed it: the row never held the tile,
// so it entered the layout at full height and collapsed once button-card caught
// up, dropping every section below it.
function startsClosed(cfg) {
  const c = resolveCardConfig(cfg);
  if (!c) return false;
  if (String(c.variables?.show_when || '') === 'active') return true;
  const names = Array.isArray(c.template) ? c.template : (c.template ? [c.template] : []);
  const tpl = llTemplates();
  const seen = new Set();
  const walk = (name, depth) => {
    if (!name || depth > 4 || seen.has(name)) return false;
    seen.add(name);
    const t = tpl[name];
    if (!t) return false;
    if (String(t.variables?.show_when || '') === 'active') return true;
    const up = Array.isArray(t.template) ? t.template : (t.template ? [t.template] : []);
    return up.some((x) => walk(x, depth + 1));
  };
  return names.some((name) => walk(name, 0));
}

// Returns the card's filter category, or null if it should always be shown.
function getFilterCategory(card) {
  const cfg = resolveCardConfig(card?._config);
  if (!cfg) return null;
  const direct = cfg.variables?.mobile_filter_category;
  if (direct !== null && direct !== undefined) return direct;
  const tmpl = cfg.template;
  const list = Array.isArray(tmpl) ? tmpl : (tmpl ? [tmpl] : []);
  const cats = filterCategories();
  for (const t of list) {
    if (!Object.prototype.hasOwnProperty.call(cats, t)) continue;
    if (cats[t] !== 'by_entity') return cats[t];
    return window.hemmaEntityCategory ? window.hemmaEntityCategory(cfg.entity) : null;
  }
  if (list.includes('hemma_mobile_header')) {
    const slug = String(cfg.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (Object.prototype.hasOwnProperty.call(HEADER_CATEGORIES, slug)) return HEADER_CATEGORIES[slug];
  }
  return null;
}

const ROW_TEMPLATE_FLAGS = {
  hemma_mobile_weather:        { full_width: true },
  hemma_mobile_header:         { full_width: true },
  hemma_mobile_filter_badges:  { full_width: true, no_filter: true },
  hemma_mobile_sensor_chips:   { full_width: true, no_filter: true, collapsed_spacer: true },
  hemma_mobile_now_playing:    { full_width: true, no_filter: true },
  hemma_scene_row:             { full_width: true },
};

// A header is generic, so the category it labels comes from its name.
const HEADER_CATEGORIES = { scenes: 'unfiltered' };

const getCardSize = (rawCfg) => {
  const cfg = resolveCardConfig(rawCfg);
  return window.hemmaCardSize?.(cfg) ||
    (String(cfg?.variables?.size || '').toLowerCase() === 'large' ? 'large' : 'small');
};

function cardFlag(cfg, flag) {
  if (!cfg) return false;
  if (cfg[flag] !== undefined) return !!cfg[flag];
  const inner = resolveCardConfig(cfg);
  if (inner !== cfg) return cardFlag(inner, flag);
  if (flag === 'no_filter'  && cfg.type === 'custom:hemma-filter-overlay') return true;
  if (flag === 'full_width' && cfg.type === 'custom:hemma-smart-row') return true;
  const tmpl = cfg.template;
  const list = Array.isArray(tmpl) ? tmpl : (tmpl ? [tmpl] : []);
  return list.some((t) => ROW_TEMPLATE_FLAGS[t]?.[flag] === true);
}

function isDesktop() {
  const p = window.matchMedia('(max-width: 767px) and (orientation: portrait), (max-height: 500px) and (orientation: portrait)').matches;
  const l = window.matchMedia('(max-height: 600px) and (orientation: landscape)').matches;
  return !p && !l;
}

class HemmaSmartRow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass            = null;
    this._config          = null;
    this._helpers         = null;
    this._cards           = [];
    this._wrappers        = [];
    this._haCards         = [];  // per-index ha-card cache for _isActiveByDom
    this._hiddenState     = [];  // last observed per-index hidden state
    this._reported        = new Set();  // indices whose card has announced its visibility
    this._cardsCreated    = false;
    this._initialized     = false;
    this._initializing    = false;
    this._activeSet       = new Set();
    this._activationOrder = [];
    this._sortTimer       = null;
    this._rafId           = null;
    this._sortEnabled     = true;
    this._lastKnownFilter = undefined;
    this._animHiding      = new Set();
    this._animShowing     = new Set();
    this._vizRetry1       = null;  // coalescing guards for the staggered
    this._vizRetry2       = null;  // re-checks in _updateWrapperVisibility
    this._vizSweep        = null;
  }

  connectedCallback() {
    (window._hemmaSmartRows = window._hemmaSmartRows || new Set()).add(this);
    if (this._rawHass && !this._filterOff) this.hass = this._rawHass;
    if (!this._onVisChange) {
      this._onVisChange = (ev) => {
        const el = ev.composedPath ? ev.composedPath()[0] : ev.target;
        const i = this._cards.indexOf(el);
        if (i >= 0) this._reported.add(i);
        this._updateWrapperVisibility();
      };
      this.addEventListener('card-visibility-changed', this._onVisChange);
    }
    if (!this._initialized || !this._wrappers.length) return;
    if (isDesktop()) this.scrollTo({ left: 0, behavior: 'instant' });
    if (!this._probed) { this._probed = true; setTimeout(() => this._probe(), 900); }

    const inactive = this._config.cards.map((_, i) => i)
      .filter(i => !this._activeSet.has(i));
    const currentOrder = [...this._activationOrder, ...inactive];
    currentOrder.forEach((origIdx, pos) => {
      this._wrappers[origIdx].style.setProperty(
        '--hemma-anim-delay', `${(pos * 0.04).toFixed(2)}s`
      );
    });
  }

  _probe() {
    if (!/[?&]hemmarowprobe=1/.test(location.search)) return;
    const R = (el) => {
      if (!el) return 'none';
      const r = el.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`
        + ` top ${Math.round(r.top)} bottom ${Math.round(r.bottom)}`;
    };
    const name = (el) => !el ? 'none'
      : el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
        + (typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/)[0] : '');
    const unit = (u) => {
      const d = document.createElement('div');
      d.style.cssText = `position:fixed;top:0;left:0;width:0;height:100${u};visibility:hidden;`;
      document.body.appendChild(d);
      const h = Math.round(d.getBoundingClientRect().height);
      d.remove();
      return h;
    };
    const box = this.shadowRoot.getElementById('container');
    const wrap = box && box.querySelector('.card-wrapper');
    const card = wrap && wrap.firstElementChild;
    const inner = card && card.shadowRoot && card.shadowRoot.querySelector('ha-card');
    const cs = getComputedStyle(this);
    const rows = [
      `window        ${window.innerWidth}x${window.innerHeight}`,
      `100svh        ${unit('svh')}        100dvh ${unit('dvh')}`,
      `row host      ${R(this)}   position ${cs.position}`,
      `offsetParent  ${name(this.offsetParent)}   ${R(this.offsetParent)}`,
      `#container    ${R(box)}   padding-bottom ${box ? getComputedStyle(box).paddingBottom : '?'}`,
      `card wrapper  ${R(wrap)}`,
      `card host     ${R(card)}   ${name(card)}`,
      `ha-card       ${R(inner)}`,
    ];
    const out = document.createElement('div');
    out.setAttribute('style', 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;'
      + 'background:#000;color:#0f0;font:11px/1.5 ui-monospace,Menlo,monospace;'
      + 'padding:10px;white-space:pre-wrap;');
    out.textContent = 'HEMMA ROW PROBE  (tap to dismiss)\n\n' + rows.join('\n');
    out.addEventListener('click', () => out.remove());
    document.body.appendChild(out);
  }

  disconnectedCallback() {
    window._hemmaSmartRows?.delete(this);
    if (this._filterOff) { this._filterOff(); this._filterOff = null; }
    if (this._sortTimer) { clearTimeout(this._sortTimer); this._sortTimer = null; }
    if (this._rafId)     { cancelAnimationFrame(this._rafId); this._rafId = null; }
    if (this._vizRetry1) { clearTimeout(this._vizRetry1); this._vizRetry1 = null; }
    if (this._vizRetry2) { clearTimeout(this._vizRetry2); this._vizRetry2 = null; }
    if (this._vizSweep)  { clearTimeout(this._vizSweep);  this._vizSweep  = null; }
  }

  static getConfigElement() { return document.createElement('div'); }
  static getStubConfig()    { return { cards: [] }; }

  setConfig(config) {
    if (!Array.isArray(config.cards)) throw new Error('hemma-smart-row: cards array required');
    this._config      = config;
    this._showWhenIdx = null;
    this._sortEnabled = config.sort !== false;
    this._scrollMode  = config.scroll_mode !== undefined
      ? !!config.scroll_mode
      : /^\/[^/]*[-_]mobile(\/|$)/i.test(window.location.pathname);
    this._rowPadding  = config.row_padding ??
      (this._sortEnabled
        ? '0 var(--hemma-rail-left, 16px) 0 max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 16px))'
        : null);
  }

  set hass(hass) {
    // The filter is per device, so the entity is rewritten before any card in
    // the row sees it. hemma-core may not have loaded yet, in which case this
    // is the shared value it always was.
    this._rawHass = hass;
    const F = window._hemmaFilter;
    if (F && !this._filterOff) {
      this._filterOff = F.onChange(() => {
        if (this._rawHass) this.hass = this._rawHass;
      });
    }
    hass = F ? F.apply(hass) : hass;
    this._hass = hass;

    if (!this._cardsCreated) {
      if (!this._initializing) this._init();
      return;
    }

    for (const card of this._cards) {
      if (card) card.hass = hass;
    }

    if (!this._initialized) return;

    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        this._updateWrapperVisibility();
        this._updateSort();
      });
    }
  }

  // WebKit reports display:none for everything inside a hidden subtree.
  _isCardHiddenExplicit(card, wrapper) {
    if (wrapper && wrapper.dataset.off === '1') return true;
    return !!card && (card.hidden || card.style.display === 'none');
  }

  _heldClosed(i) {
    if (this._reported.has(i)) return false;
    return startsClosed(this._config.cards[i]);
  }

  _isCardHidden(card, wrapper) {
    if (wrapper && wrapper.dataset.off === '1') return true;
    if (!card) return false;
    if (card.hidden || card.style.display === 'none') return true;
    if (!wrapper || wrapper.style.display !== 'none') {
      return getComputedStyle(card).display === 'none';
    }
    // Never un-hide a held show_when card to measure it: a tile re-entering the
    // layout while a filter animates out is what left a gap under its section.
    // button-card sets `hidden` on the host before it reports, so read that.
    if (wrapper.dataset.showWhen === '1') {
      if (!this._reported.has(Number(wrapper.dataset.idx))) return true;
      return !!(card.hidden || card.style.display === 'none');
    }
    wrapper.style.display = '';
    const hidden = getComputedStyle(card).display === 'none';
    wrapper.style.display = 'none';
    return hidden;
  }

  _updateWrapperVisibility() {
    if (!this._initialized) return;

    // The filter entity is global: only scroll_mode rows may honor it.
    const filter = this._scrollMode
      ? (window._hemmaFilter
          ? window._hemmaFilter.get()
          : this._hass?.states['input_select.hemma_mobile_filter']?.state)
      : undefined;
    const filterChanged = this._lastKnownFilter !== undefined && filter !== this._lastKnownFilter;
    this._lastKnownFilter = filter;

    const isFilterHidden = (card) => {
      if (!filter || filter === 'all') return false;
      const cat = getFilterCategory(card);
      if (cat === null || cat === undefined) return false;
      if (cat === 'unfiltered') return true;
      return filter !== cat;
    };

    if (!this._sortEnabled) {
      // Repeat at intervals to catch both quick and slow card renders.
      const sync = () => {
        this._wrappers.forEach((wrapper, i) => {
          const card = this._cards[i];
          if (!card) return;
          const hide = isFilterHidden(card) || this._isCardHidden(card, wrapper)
            || this._heldClosed(i);
          wrapper.style.display = hide ? 'none' : '';
        });
      };
      sync();
      setTimeout(sync, 50);
      setTimeout(sync, 500);
      return;
    }

    const DUR  = 220;
    const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

    const horizontal = isDesktop();
    const gap = horizontal
      ? (parseFloat(getComputedStyle(this._container).columnGap) || 0)
      : 0;

    // The filter page hides rows with opacity 0 !important; a plain write here replaced it and the row showed through.
    const setOpacity = (wrapper, v) => {
      if (wrapper.style.getPropertyPriority('opacity') === 'important') return;
      wrapper.style.opacity = v;
    };
    const clearAnimStyles = (wrapper) => {
      wrapper.style.transition  = '';
      wrapper.style.height      = '';
      wrapper.style.width       = '';
      wrapper.style.flex        = '';
      wrapper.style.marginRight = '';
      setOpacity(wrapper, '');
      wrapper.style.overflow    = '';
      const card = wrapper.firstElementChild;
      if (card) {
        card.style.width = '';
        if (card.style.display === 'block') card.style.display = '';
      }
    };

    const hideWrapper = (wrapper, animate) => {
      if (wrapper.style.display === 'none') return;
      if (this._animHiding.has(wrapper)) return;
      if (this._animShowing.has(wrapper)) {
        this._animShowing.delete(wrapper);
        clearAnimStyles(wrapper);
      }
      if (!animate) { wrapper.style.display = 'none'; return; }
      this._animHiding.add(wrapper);
      const axis = horizontal ? 'width' : 'height';
      const size = horizontal ? wrapper.offsetWidth : wrapper.offsetHeight;
      if (horizontal) {
        wrapper.style.flex  = `0 0 ${size}px`;
        wrapper.style.width = size + 'px';
      } else {
        wrapper.style.height = size + 'px';
      }
      wrapper.style.overflow   = 'hidden';
      setOpacity(wrapper, '1');
      wrapper.style.transition =
        `${axis} ${DUR}ms ${EASE}, flex-basis ${DUR}ms ${EASE}, ` +
        `margin-right ${DUR}ms ${EASE}, opacity ${DUR}ms ${EASE}`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!this._animHiding.has(wrapper)) return;
        if (horizontal) {
          wrapper.style.flex        = '0 0 0px';
          wrapper.style.width       = '0px';
          wrapper.style.marginRight = `-${gap}px`;
        } else {
          wrapper.style.height = '0';
        }
        setOpacity(wrapper, '0');
      }));
      setTimeout(() => {
        if (!this._animHiding.has(wrapper)) return;
        this._animHiding.delete(wrapper);
        wrapper.style.display = 'none';
        clearAnimStyles(wrapper);
      }, DUR);
    };

    const showWrapper = (wrapper, animate) => {
      // Put in its sorted place before it shows; opened at the end and moved later, it read as a jump.
      delete wrapper.dataset.showWhen;
      const idx = Number(wrapper.dataset.idx);
      if (this._isShowWhen(idx) && wrapper.style.display === 'none') {
        animate = false;
        if (this._sortEnabled && !this._activeSet.has(idx)) {
          this._activeSet.add(idx);
          this._activationOrder = [...this._activeSet].sort((a, b) => a - b);
          this._applyOrder(false);
        }
      }
      if (this._animShowing.has(wrapper)) return;
      if (this._animHiding.has(wrapper)) {
        this._animHiding.delete(wrapper);
        clearAnimStyles(wrapper);
        wrapper.style.display = '';
        return;
      }
      if (wrapper.style.display !== 'none') return;
      wrapper.style.display = '';
      if (wrapper.dataset.size === 'large') this._scheduleLargeFill(wrapper);
      if (!animate) return;
      this._animShowing.add(wrapper);
      const axis = horizontal ? 'width' : 'height';
      const size = horizontal ? wrapper.offsetWidth : wrapper.offsetHeight;
      const card = wrapper.firstElementChild;
      if (horizontal && card) {
        card.style.display = 'block';
        card.style.width   = size + 'px';
      }
      if (horizontal) {
        wrapper.style.flex        = '0 0 0px';
        wrapper.style.width       = '0px';
        wrapper.style.marginRight = `-${gap}px`;
      } else {
        wrapper.style.height = '0';
      }
      wrapper.style.overflow   = 'hidden';
      setOpacity(wrapper, '0');
      wrapper.style.transition =
        `${axis} ${DUR}ms ${EASE}, flex-basis ${DUR}ms ${EASE}, ` +
        `margin-right ${DUR}ms ${EASE}, opacity ${DUR}ms ${EASE}`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!this._animShowing.has(wrapper)) return;
        if (horizontal) {
          wrapper.style.flex        = `0 0 ${size}px`;
          wrapper.style.width       = size + 'px';
          wrapper.style.marginRight = '0px';
        } else {
          wrapper.style.height = size + 'px';
        }
        setOpacity(wrapper, '1');
      }));
      setTimeout(() => {
        if (!this._animShowing.has(wrapper)) return;
        this._animShowing.delete(wrapper);
        clearAnimStyles(wrapper);
      }, DUR + 50);
    };

    const snap = !!window._hemmaNoFilterAnim;

    const show = (firstCall) => {
      this._wrappers.forEach((wrapper, i) => {
        const card = this._cards[i];
        if (!card) return;
        if (isFilterHidden(card)) {
          hideWrapper(wrapper, firstCall && filterChanged && !snap);
          this._hiddenState[i] = true;
          return;
        }
        const hidden = this._isCardHidden(card, wrapper);
        const was    = this._hiddenState[i];
        this._hiddenState[i] = hidden;

        if (hidden) {
          if (was === false || this._isCardHiddenExplicit(card, wrapper)) {
            hideWrapper(wrapper, !snap && was === false);
          }
          return;
        }
        if (this._heldClosed(i)) return;
        showWrapper(wrapper, !snap && (was === true || (firstCall && filterChanged)));
      });
      this.style.display = '';
    };

    show(true);

    if (!this._vizRetry1) this._vizRetry1 = setTimeout(() => {
      this._vizRetry1 = null;
      show(false);
    }, 100);
    if (!this._vizRetry2) this._vizRetry2 = setTimeout(() => {
      this._vizRetry2 = null;
      show(false);
    }, 250);
    if (this._vizSweep) return;
    this._vizSweep = setTimeout(() => {
      this._vizSweep = null;
      if (!this._initialized) return;
      this._config.cards.forEach((_, i) => this._reported.add(i));
      let anyVisible = false;
      this._wrappers.forEach((wrapper, i) => {
        const card = this._cards[i];
        if (!card) return;
        if (isFilterHidden(card) || this._isCardHidden(card, wrapper)) {
          this._hiddenState[i] = true;
          if (!this._animHiding.has(wrapper)) hideWrapper(wrapper, false);
        } else {
          this._hiddenState[i] = false;
          // The sweep is what releases the show_when hold, so it has to reveal
          // as well as hide: a card that is active from the start never fires
          // card-visibility-changed, so nothing else would bring it back.
          if (wrapper.dataset.showWhen === '1' && wrapper.style.display === 'none'
              && !this._animShowing.has(wrapper)) {
            showWrapper(wrapper, false);
          }
          if (wrapper.style.display !== 'none' || this._animShowing.has(wrapper)) anyVisible = true;
        }
      });
      this.style.display = anyVisible ? '' : 'none';
    }, 500);
  }

  _patchNoFilterCard(card) {
    card.style.setProperty('filter',         'none', 'important');
    card.style.setProperty('-webkit-filter', 'none', 'important');
    // Retries catch nested cards that haven't rendered on the first pass.
    this._patchHaCardsDeep(card);
    setTimeout(() => this._patchHaCardsDeep(card), 400);
    setTimeout(() => this._patchHaCardsDeep(card), 1200);
  }

  _patchHaCardsDeep(root, attempts = 0) {
    const sr = root.shadowRoot;
    if (!sr) {
      if (attempts < 40) requestAnimationFrame(() => this._patchHaCardsDeep(root, attempts + 1));
      return;
    }
    const haCards = sr.querySelectorAll('ha-card');
    if (!haCards.length && attempts < 40) {
      requestAnimationFrame(() => this._patchHaCardsDeep(root, attempts + 1));
      return;
    }
    haCards.forEach(h => {
      h.style.setProperty('will-change',               'auto', 'important');
      h.style.setProperty('transition',                'none', 'important');
      h.style.setProperty('filter',                    'none', 'important');
      h.style.setProperty('-webkit-filter',            'none', 'important');
      h.style.setProperty('--hemma-card-hover-filter', 'none');
    });
    sr.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) this._patchHaCardsDeep(el, 0);
    });
  }

  _scheduleLargeFill(wrapper) {
    const run = () => this._stampLargeFill(wrapper);
    requestAnimationFrame(run);
    setTimeout(run, 400);
    setTimeout(run, 1200);
  }

  _stampLargeFill(el, depth = 0) {
    if (!el || depth > 16) return false;
    if (el.tagName === 'HA-CARD') return true;
    // Inline, not computed: a hidden subtree reads as none all the way down.
    if (el.style && el.style.display === 'none') return false;

    let onPath = false;
    const roots = el.shadowRoot ? [el.shadowRoot, el] : [el];
    for (const root of roots) {
      for (const kid of root.children || []) {
        if (this._stampLargeFill(kid, depth + 1)) onPath = true;
      }
    }

    if (onPath && depth > 0 && el.tagName.includes('-')) {
      if (getComputedStyle(el).display === 'inline') el.style.display = 'block';
      el.style.height    = '100%';
      el.style.flexGrow  = '1';
      el.style.minHeight = '0';
    }
    return onPath;
  }

  get hass() { return this._hass; }

  async _init() {
    this._initializing = true;

    if (!this._helpers) this._helpers = await window.loadCardHelpers();

    const styleEl = document.createElement('style');
    styleEl.textContent = this._css();
    this.shadowRoot.appendChild(styleEl);

    const container = document.createElement('div');
    container.id = 'container';
    this.shadowRoot.appendChild(container);
    this._container = container;

    rowLog('build start', { sort: this._sortEnabled,
      scroll: this._scrollMode, cards: (this._config.cards || []).length });

    // Sort disabled: render in config order, no detection or reordering.
    if (!this._sortEnabled) {
      this._cards = this._config.cards.map((cfg) => {
        // Same rule as the sorted path below: an off card is never built.
        if (isCardDisabled(cfg, this._scrollMode)) return null;
        try {
          const card = this._helpers.createCardElement(cfg);
          card.hass = this._hass;
          return card;
        } catch (e) {
          console.warn('hemma-smart-row: failed to create card', cfg, e);
          return null;
        }
      });
      this._wrappers = this._cards.map((card, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper';
        wrapper.dataset.idx = String(i);
        wrapper.style.setProperty('--hemma-position-index', String(i));
        if (cardFlag(this._config.cards[i], 'full_width')) wrapper.dataset.fullwidth = '1';
        if (cardFlag(this._config.cards[i], 'collapsed_spacer')) wrapper.dataset.collapsedSpacer = '1';
        if (isCardDisabled(this._config.cards[i], this._scrollMode)) {
          wrapper.dataset.off = '1';
          wrapper.style.display = 'none';
          this._hiddenState[i] = true;
        } else if (startsClosed(this._config.cards[i])) {
          wrapper.dataset.showWhen = '1';
          wrapper.style.display = 'none';
          this._hiddenState[i] = true;
        }
        if (card) wrapper.appendChild(card);
        container.appendChild(wrapper);
        return wrapper;
      });
      this._cards.forEach((card, i) => {
        if (card && cardFlag(this._config.cards[i], 'no_filter')) this._patchNoFilterCard(card);
      });
      this._cardsCreated = true;
      this._initialized  = true;
      this._initializing = false;
      this._updateWrapperVisibility();
      return;
    }

    const yieldFrame = () => new Promise((r) => requestAnimationFrame(() => r()));



    this._cards       = [];
    this._wrappers    = [];
    this._haCards     = [];
    this._hiddenState = [];
    this._reported.clear();
    let budget = performance.now();

    for (let i = 0; i < this._config.cards.length; i++) {
      const cfg = this._config.cards[i];
      let card = null;
      const off = isCardDisabled(cfg, this._scrollMode);
      if (!off) {
        try {
          card = this._helpers.createCardElement(cfg);
        } catch (e) {
          console.warn('hemma-smart-row: failed to create card', cfg, e);
        }
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'card-wrapper';
      wrapper.dataset.idx = String(i);
      wrapper.style.setProperty('--hemma-position-index', String(i));
      if (cardFlag(cfg, 'full_width')) wrapper.dataset.fullwidth = '1';
      if (isRawCard(cfg)) wrapper.dataset.raw = '1';
      if (cardFlag(cfg, 'collapsed_spacer')) wrapper.dataset.collapsedSpacer = '1';
      if (getCardSize(cfg) === 'large') {
        wrapper.dataset.size = 'large';
        this._scheduleLargeFill(wrapper);
      }
      if (off) {
        wrapper.dataset.off = '1';
        wrapper.style.display = 'none';
        this._hiddenState[i] = true;
      } else if (startsClosed(cfg)) {
        wrapper.dataset.showWhen = '1';
        wrapper.style.display = 'none';
        this._hiddenState[i] = true;
      }
      wrapper.style.setProperty('--hemma-init-play', 'paused');
      if (card) wrapper.appendChild(card);
      container.appendChild(wrapper);

      this._cards.push(card);
      this._wrappers.push(wrapper);

      if (card) card.hass = this._hass;

      if (i < this._config.cards.length - 1 && performance.now() - budget > 8) {
        await yieldFrame();
        budget = performance.now();
      }
    }

    const painted = this._cards.filter(Boolean)
      .map((c) => c.updateComplete).filter((p) => p && typeof p.then === 'function');
    if (painted.length) { try { await Promise.all(painted); } catch (e) {} }
    // A timer, not a frame: requestAnimationFrame does not fire in a background
    // tab, and the row must never wait on one to become visible.
    await new Promise((r) => setTimeout(r, 0));
    this._builtAt = Date.now();
    rowLog('revealed', {});

    this._cardsCreated = true;
    this._initializing = false;

    container.addEventListener('pointerdown', () => {
      if (this._sortTimer !== null) this._scheduleSort();
    }, { passive: true });

    setTimeout(() => {
      // Every card has drawn, so a show_when card that is showing joins the first sort in its sorted place.
      this._wrappers.forEach((wrapper, i) => {
        const card = this._cards[i];
        if (wrapper.dataset.showWhen !== '1' || !card || !card.shadowRoot) return;
        if (card.hidden || getComputedStyle(card).display === 'none') return;
        delete wrapper.dataset.showWhen;
        wrapper.style.display = '';
        this._hiddenState[i] = false;
        this._reported.add(i);
      });
      this._wrappers.forEach((wrapper, i) => {
        if (!this._isCardHidden(this._cards[i], wrapper)) return;
        wrapper.style.display = 'none';
        // Seeded so the first reveal reads as a transition and animates open.
        this._hiddenState[i] = true;
      });

      const active = [], inactive = [];
      this._config.cards.forEach((_, i) => {
        (this._isActive(i) ? active : inactive).push(i);
      });
      const order = [...active, ...inactive];

      this._activeSet       = new Set(active);
      this._activationOrder = [...active];

      // Active cards move to the front, keeping config order among themselves.
      order.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });
      // Inline on the wrapper, so it beats anything inherited.
      order.forEach((origIdx, sortedPos) => {
        this._wrappers[origIdx].style.setProperty('--hemma-anim-delay',
          `${(sortedPos * 0.04).toFixed(2)}s`);
      });

      if (!!window._hemmaFromBg) {
        this._wrappers.forEach(w => w.style.removeProperty('--hemma-init-play'));
        this._initialized = true;
        this._updateWrapperVisibility();
        return;
      }

      const release = () => {
        this._wrappers.forEach(w => w.style.removeProperty('--hemma-init-play'));
        setTimeout(() => {
          this._initialized = true;
          // The build cleared _reported, and only a hass update drives a pass:
          // a show_when tile that is active from the start never fires
          // card-visibility-changed, so nothing else would release its hold.
          this._updateWrapperVisibility();
          setTimeout(() => this._updateSort(), 2000);
          setTimeout(() => this._updateSort(), 5000);
        }, PAGE_ANIM_MS);
      };

      if (window.requestIdleCallback) window.requestIdleCallback(release, { timeout: 500 });
      else requestAnimationFrame(() => requestAnimationFrame(release));

    }, 100);
  }

  // ── Active detection ────────────────────────────────────────────────────────

  _findHaCard(el, depth = 0) {
    if (!el || depth > 6) return null;
    if (el.tagName === 'HA-CARD') return el;
    const roots = el.shadowRoot ? [el.shadowRoot, el] : [el];
    for (const root of roots) {
      for (const kid of root.children || []) {
        const found = this._findHaCard(kid, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  _isActiveByDom(index) {
    const card = this._cards[index];
    if (!card) return null;
    let ha = this._haCards[index];
    if (!ha || !ha.isConnected) {
      ha = this._findHaCard(card);
      this._haCards[index] = ha;
    }
    if (!ha) return null;
    let v = ha.style.getPropertyValue('--hemma-active-overlay-opacity').trim();
    if (!v) v = getComputedStyle(ha).getPropertyValue('--hemma-active-overlay-opacity').trim();
    if (!v) return null;
    return v === '1';
  }

  _isActiveByState(index) {
    const cfg = resolveCardConfig(this._config.cards[index]);
    if (cardFlag(cfg, 'full_width')) return false;
    if (!cfg?.entity || !this._hass) return false;
    const st = this._hass.states[cfg.entity];
    return st ? activeStates().has((st.state || '').toLowerCase()) : false;
  }

  // show_when: active cards (Plex, Updates) are only ever on screen while active, whatever their card has drawn yet.
  _isShowWhen(index) {
    if (!this._showWhenIdx) this._showWhenIdx = new Map();
    if (!this._showWhenIdx.has(index)) this._showWhenIdx.set(index, !!startsClosed((this._config.cards || [])[index]));
    return this._showWhenIdx.get(index);
  }

  _isActive(index) {
    if (this._heldClosed(index)) return false;
    if (this._isCardHidden(this._cards[index], this._wrappers[index])) return false;
    if (this._isShowWhen(index)) return true;
    const dom = this._isActiveByDom(index);
    return dom !== null ? dom : this._isActiveByState(index);
  }

  // ── Sort logic ──────────────────────────────────────────────────────────────

  _seedFromDom() {
    const active = [];
    this._config.cards.forEach((_, i) => {
      if (this._isActive(i)) active.push(i);
    });

    this._activeSet       = new Set(active);
    this._activationOrder = active;
  }

  _updateSort() {
    if (!this._sortEnabled || !this._wrappers.length) return;

    const newActive = new Set();
    this._config.cards.forEach((_, i) => {
      if (this._isActive(i)) newActive.add(i);
    });

    let changed = false;
    for (const i of newActive)      { if (!this._activeSet.has(i)) { changed = true; break; } }
    if (!changed) for (const i of this._activeSet) { if (!newActive.has(i)) { changed = true; break; } }
    if (!changed) return;

    this._activationOrder = [...newActive].sort((a, b) => a - b);
    this._activeSet = newActive;

    this._scheduleSort();
  }

  _scheduleSort() {
    if (!this._sortEnabled) return;
    if (this._sortTimer) clearTimeout(this._sortTimer);
    const delay = window._hemmaNoFilterAnim ? 100 : SORT_DELAY_MS;
    this._sortTimer = setTimeout(() => {
      this._sortTimer = null;
      this._applyOrder(true);
    }, delay);
  }

  // ── FLIP animation ──────────────────────────────────────────────────────────

  _applyOrder(animate) {
    if (!this._wrappers.length) return;
    rowLog('applyOrder', { animate: !!animate,
      sinceBuilt: Date.now() - (this._builtAt || 0),
      noFilterAnim: !!window._hemmaNoFilterAnim });

    const inactive = this._config.cards.map((_, i) => i).filter(i => !this._activeSet.has(i));
    const newOrder  = [...this._activationOrder, ...inactive];

    if (!animate || window._hemmaNoFilterAnim) {
      newOrder.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });
      if (isDesktop()) this.scrollTo({ left: 0, behavior: 'instant' });
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      newOrder.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });
      if (isDesktop()) this.scrollTo({ left: 0, behavior: 'instant' });
      return;
    }

    const firstRects = this._wrappers.map(w => w.getBoundingClientRect());
    newOrder.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });
    const lastRects = this._wrappers.map(w => w.getBoundingClientRect());

    if (isDesktop() && this.scrollLeft > 10) {
      this.scrollTo({ left: 0, behavior: 'smooth' });
    }

    const deltas = this._wrappers.map((_, i) => ({
      dx: firstRects[i].left - lastRects[i].left,
      dy: firstRects[i].top  - lastRects[i].top,
    }));

    this._wrappers.forEach(w => w.style.setProperty('--hsr-anim-paused', 'paused'));

    deltas.forEach(({ dx, dy }, i) => {
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      this._wrappers[i].style.transition = 'none';
      this._wrappers[i].style.transform  = `translate(${dx}px, ${dy}px)`;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        deltas.forEach(({ dx, dy }, i) => {
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
          const toFront = dx > 0 || dy > 0;
          this._wrappers[i].style.transition =
            `transform ${SORT_MS}ms ${toFront ? EASE_FORWARD : EASE_BACK} ${toFront ? 0 : STAGGER_MS}ms`;
          this._wrappers[i].style.transform = '';
        });

        setTimeout(() => {
          this._wrappers.forEach(w => {
            w.style.transition = '';
            w.style.removeProperty('--hsr-anim-paused');
          });
        }, SORT_MS + STAGGER_MS + 50);
      });
    });
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  _css() {
    return `
      :host {
        --hsr-rail: var(--hemma-entity-left-inset-current, var(--hemma-entity-left-inset-desktop, var(--hemma-rail-left, var(--page-gutter, 8vw))));
        translate: var(--hemma-side-shift, none);
        visibility: var(--hemma-fx-vis);
        transform: var(--hemma-fx-xf, none);
        transform-origin: 50% 30%;
        display: block;
        position: absolute;
        z-index: 3;
        /* Rail lives in the container's padding, so cards leave at the display
           edge instead of clipping on a line mid-screen. */
        inset: auto
          var(--hemma-entity-right-inset-current, var(--hemma-entity-right-inset-desktop, var(--hemma-rail-left, var(--page-gutter, 8vw))))
          var(--hemma-entity-bottom-current, var(--hemma-entity-bottom-desktop, 0px))
          0;
        scroll-padding-left: var(--hsr-rail);
        box-sizing: border-box;
        overflow-x: auto;
        overflow-y: clip;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x;
        overscroll-behavior-x: auto;
        overscroll-behavior-y: none;
        scroll-snap-type: x proximity;
        overflow-anchor: none;
        scrollbar-width: none;
        -ms-overflow-style: none;
        direction: ltr;
      }
      :host::-webkit-scrollbar { display: none; }

      /* A tablet anchors the row to the SCREEN, not to the flow. Absolute
         positioning hands the bottom edge to whatever containing block the view
         ends up with, which on an iPad stopped 56px short of the display and no
         padding value could reach past it. Desktop is left alone: its own
         containing block does reach the bottom, which is why its gutter reads
         right and this one did not. Run ?hemmarowprobe=1 to see the boxes. */
      @media (min-width: 768px) and (max-width: 1600px) and (min-height: 501px) and (pointer: coarse),
             (min-width: 768px) and (max-width: 1600px) and (min-height: 501px) and (hover: none) {
        :host { position: fixed; }
      }

      /* Only the wrappers take taps, so the host can't block the navbar. */
      .card-wrapper { pointer-events: auto; }

      #container {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        gap: 8px;
        padding: 20px calc(var(--hemma-entity-shadow-pad-right-current, var(--hemma-entity-shadow-pad-right-desktop, 0px))
          + var(--hemma-entity-row-pad-end-current, 0px) + var(--hemma-push-end, var(--hemma-side-push, 0px))) var(--hemma-entity-row-pad-bottom-current, 40px) var(--hsr-rail);
        min-width: max-content;
        box-sizing: border-box;
      }

      .card-wrapper {
        flex: 0 0 var(--hemma-entity-col-width-current, var(--hemma-entity-col-width-desktop, 300px));
        width: var(--hemma-entity-col-width-current, var(--hemma-entity-col-width-desktop, 300px));
        scroll-snap-align: start;
      }

      /* Phones reach this row only through the mobile dashboard, so portrait
         and landscape share one in-flow scrolling layout. */
      @media (max-width: 767px) and (orientation: portrait),
             (max-height: 500px) and (orientation: portrait),
             (max-height: 600px) and (orientation: landscape) {
        :host {
          position: relative;
          z-index: auto;
          inset: auto;
          display: block;
          width: 100%;
          overflow: visible;
          touch-action: auto;
          overscroll-behavior: auto;
          pointer-events: auto;
        }
        #container {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-content: start;
          gap: 8px;
          padding: ${this._rowPadding || '0'};
          min-width: unset;
          overflow: visible;
          box-sizing: border-box;
          ${this._sortEnabled ? `
          /* Fixed tracks make a large tile exactly two small ones tall and give
             a row-spanning item an unambiguous height. Dense backfills the hole
             a large tile leaves beside it. */
          grid-auto-rows: var(--hemma-tile-row-h-current, 66px);
          grid-auto-flow: row dense;
          align-items: stretch;
          ` : `
          /* Outer row: weather, badges, headers, Now Playing all size to content. */
          grid-auto-rows: min-content;
          align-items: start;
          `}
        }
        .card-wrapper { flex: unset; width: auto; scroll-snap-align: none; will-change: auto; }
        ${this._sortEnabled ? `
        /* Child combinator load-bearing - see the collapsed-spacer rule below. */
        #container > .card-wrapper[data-size="large"] { grid-row: span 2; }
        /* Passes the track height down for the card's own height:100%. */
        #container > .card-wrapper > * { display: block; height: 100%; }
        /* And holds a pasted card to it. Safari leaks past overflow alone. */
        #container > .card-wrapper[data-raw="1"] {
          overflow: hidden;
          border-radius: var(--hemma-tile-radius-phone, 26px);
          clip-path: inset(0 round var(--hemma-tile-radius-phone, 26px));
        }
        /* That display beats the hidden attribute's UA display:none, so a card
           that has turned itself off still paints whenever its wrapper is open.
           Collapsing the wrapper is what normally keeps it off screen, and that
           is a JS pass with retries - it has a window. This closes it. */
        #container > .card-wrapper > *[hidden] { display: none; }
        ` : ''}
        .card-wrapper[data-fullwidth="1"] { grid-column: 1 / -1 !important; width: 100% !important; flex: none !important; }
        /* A negative margin on the empty row itself only moves it inside its track, so the gap stays. */
        #container > .card-wrapper:has([data-hemma-np]) + .card-wrapper {
          transition: margin-top 0.5s cubic-bezier(0.32, 0.72, 0, 1);
        }
        #container > .card-wrapper:has([data-hemma-np-empty]) + .card-wrapper {
          margin-top: -8px;
        }
        #container > .card-wrapper[data-collapsed-spacer] {
          display: none;
        }
        .card-wrapper[data-off] { display: none !important; }
      }

      /* Landscape has enough width for a third column of entity cards. */
      @media (max-height: 600px) and (orientation: landscape) {
        #container { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      }
    `;
  }
}

customElements.define('hemma-smart-row', HemmaSmartRow);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hemma-smart-row',
  name: 'Hemma Smart Row',
  description: 'Smart entity row — active cards slide to the front on desktop',
});
