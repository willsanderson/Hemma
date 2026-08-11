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

// Returns the card's filter category, or null if it should always be shown.
function getFilterCategory(card) {
  if (!card || !card._config) return null;
  // The resolved variable is only present once button-card has merged its
  // templates, so fall back to the raw template name.
  const direct = card._config.variables?.mobile_filter_category;
  if (direct !== null && direct !== undefined) return direct;
  const tmpl = card._config.template;
  const list = Array.isArray(tmpl) ? tmpl : (tmpl ? [tmpl] : []);
  const cats = filterCategories();
  for (const t of list) {
    if (Object.prototype.hasOwnProperty.call(cats, t)) return cats[t];
  }
  return null;
}

// Implicit layout flags per row template, so dashboard YAML doesn't repeat
// full_width/no_filter on every row card.
const ROW_TEMPLATE_FLAGS = {
  hemma_mobile_weather:        { full_width: true },
  hemma_mobile_header:         { full_width: true },
  hemma_mobile_filter_badges:  { full_width: true, no_filter: true },
  hemma_mobile_sensor_chips:   { full_width: true, no_filter: true, collapsed_spacer: true },
  hemma_mobile_now_playing:    { full_width: true, no_filter: true },
};

// Lives in hemma-core.js so this file and filter-overlay.js agree. Read at call
// time; the local variables.size read is a fail-safe against a stale copy.
const getCardSize = (cfg) =>
  window.hemmaCardSize?.(cfg) ||
  (String(cfg?.variables?.size || '').toLowerCase() === 'large' ? 'large' : 'small');

// An explicit key on the card config wins; otherwise the flag is inferred from
// the card type or its template names.
function cardFlag(cfg, flag) {
  if (!cfg) return false;
  if (cfg[flag] !== undefined) return !!cfg[flag];
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
    if (!this._initialized || !this._wrappers.length) return;
    if (isDesktop()) this.scrollTo({ left: 0, behavior: 'instant' });

    const inactive = this._config.cards.map((_, i) => i)
      .filter(i => !this._activeSet.has(i));
    const currentOrder = [...this._activationOrder, ...inactive];
    currentOrder.forEach((origIdx, pos) => {
      this._wrappers[origIdx].style.setProperty(
        '--hemma-anim-delay', `${(pos * 0.04).toFixed(2)}s`
      );
    });
  }

  disconnectedCallback() {
    window._hemmaSmartRows?.delete(this);
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
    this._sortEnabled = config.sort !== false;
    this._scrollMode  = config.scroll_mode !== undefined
      ? !!config.scroll_mode
      : window.location.pathname.includes('dashboard-hemma-mobile');
    this._rowPadding  = config.row_padding ??
      (this._sortEnabled
        ? '0 var(--hemma-rail-left, 11px) 0 max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px))'
        : null);
  }

  set hass(hass) {
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
        if (this._scrollMode) this._updateWrapperVisibility();
        this._updateSort();
      });
    }
  }

  _updateWrapperVisibility() {
    if (!this._initialized) return;

    const filter = this._hass?.states['input_select.hemma_mobile_filter']?.state;
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
          const hide = isFilterHidden(card) || getComputedStyle(card).display === 'none';
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

    const clearAnimStyles = (wrapper) => {
      wrapper.style.transition = '';
      wrapper.style.height     = '';
      wrapper.style.opacity    = '';
      wrapper.style.overflow   = '';
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
      const h = wrapper.offsetHeight;
      wrapper.style.overflow   = 'hidden';
      wrapper.style.height     = h + 'px';
      wrapper.style.opacity    = '1';
      wrapper.style.transition = `height ${DUR}ms ${EASE}, opacity ${DUR}ms ${EASE}`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!this._animHiding.has(wrapper)) return;
        wrapper.style.height  = '0';
        wrapper.style.opacity = '0';
      }));
      setTimeout(() => {
        this._animHiding.delete(wrapper);
        wrapper.style.display = 'none';
        clearAnimStyles(wrapper);
      }, DUR);
    };

    const showWrapper = (wrapper, animate) => {
      if (this._animShowing.has(wrapper)) return;
      if (this._animHiding.has(wrapper)) {
        this._animHiding.delete(wrapper);
        clearAnimStyles(wrapper);
        wrapper.style.display = '';
        return;
      }
      if (wrapper.style.display !== 'none') return;
      wrapper.style.display = '';
      if (!animate) return;
      this._animShowing.add(wrapper);
      const h = wrapper.offsetHeight;
      wrapper.style.overflow   = 'hidden';
      wrapper.style.height     = '0';
      wrapper.style.opacity    = '0';
      wrapper.style.transition = `height ${DUR}ms ${EASE}, opacity ${DUR}ms ${EASE}`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!this._animShowing.has(wrapper)) return;
        wrapper.style.height  = h + 'px';
        wrapper.style.opacity = '1';
      }));
      setTimeout(() => {
        this._animShowing.delete(wrapper);
        clearAnimStyles(wrapper);
      }, DUR + 50);
    };

    const show = (firstCall) => {
      this._wrappers.forEach((wrapper, i) => {
        const card = this._cards[i];
        if (!card) return;
        if (isFilterHidden(card)) {
          hideWrapper(wrapper, firstCall && filterChanged);
          return;
        }
        if (getComputedStyle(card).display !== 'none') {
          // filter-overlay sets this flag while dismissing so wrappers snap
          // visible instead of expanding behind the closing blur.
          showWrapper(wrapper, firstCall && filterChanged && !window._hemmaNoFilterAnim);
        }
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
      let anyVisible = false;
      this._wrappers.forEach((wrapper, i) => {
        const card = this._cards[i];
        if (!card) return;
        if (isFilterHidden(card) || getComputedStyle(card).display === 'none') {
          if (!this._animHiding.has(wrapper)) hideWrapper(wrapper, false);
        } else {
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

  // Walks the whole layout-card → grid-layout → button-card chain, since badge
  // cards can sit several shadow roots deep.
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

    // Sort disabled: render in config order, no detection or reordering.
    if (!this._sortEnabled) {
      this._cards = this._config.cards.map((cfg) => {
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
      return;
    }

    const yieldFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

    this._cards    = [];
    this._wrappers = [];
    let budget = performance.now();

    for (let i = 0; i < this._config.cards.length; i++) {
      const cfg = this._config.cards[i];
      let card = null;
      try {
        card = this._helpers.createCardElement(cfg);
      } catch (e) {
        console.warn('hemma-smart-row: failed to create card', cfg, e);
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'card-wrapper';
      wrapper.dataset.idx = String(i);
      wrapper.style.setProperty('--hemma-position-index', String(i));
      if (cardFlag(cfg, 'full_width')) wrapper.dataset.fullwidth = '1';
      if (cardFlag(cfg, 'collapsed_spacer')) wrapper.dataset.collapsedSpacer = '1';
      if (getCardSize(cfg) === 'large') wrapper.dataset.size = 'large';
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

    this._cardsCreated = true;
    this._initializing = false;

    container.addEventListener('pointerdown', () => {
      if (this._sortTimer !== null) this._scheduleSort();
    }, { passive: true });

    setTimeout(() => {
      const active = [], inactive = [];
      this._config.cards.forEach((_, i) => {
        (this._isActive(i) ? active : inactive).push(i);
      });
      const order = [...active, ...inactive];

      this._activeSet       = new Set(active);
      this._activationOrder = [...active];

      // Active cards move to the front, keeping config order among themselves.
      order.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });
      order.forEach((origIdx, sortedPos) => {
        this._wrappers[origIdx].style.setProperty('--hemma-anim-delay', `${(sortedPos * 0.04).toFixed(2)}s`);
      });

      if (!!window._hemmaFromBg) {
        this._wrappers.forEach(w => w.style.removeProperty('--hemma-init-play'));
        this._initialized = true;
        return;
      }

      const release = () => {
        this._wrappers.forEach(w => w.style.removeProperty('--hemma-init-play'));
        setTimeout(() => {
          this._initialized = true;
          setTimeout(() => this._updateSort(), 2000);
          setTimeout(() => this._updateSort(), 5000);
        }, PAGE_ANIM_MS);
      };

      if (window.requestIdleCallback) window.requestIdleCallback(release, { timeout: 500 });
      else requestAnimationFrame(() => requestAnimationFrame(release));

    }, 100);
  }

  // ── Active detection ────────────────────────────────────────────────────────

  _isActiveByDom(index) {
    const card = this._cards[index];
    if (!card?.shadowRoot) return null;
    const ha = card.shadowRoot.querySelector('ha-card');
    if (!ha) return null;
    let v = ha.style.getPropertyValue('--hemma-active-overlay-opacity').trim();
    if (!v) v = getComputedStyle(ha).getPropertyValue('--hemma-active-overlay-opacity').trim();
    if (!v) return null;
    return v === '1';
  }

  _isActiveByState(index) {
    if (cardFlag(this._config.cards[index], 'full_width')) return false;
    const cfg = this._config.cards[index];
    if (!cfg?.entity || !this._hass) return false;
    const st = this._hass.states[cfg.entity];
    return st ? activeStates().has((st.state || '').toLowerCase()) : false;
  }

  _isActive(index) {
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
    // While the filter overlay is dismissing, sort straight away so the cards
    // snap into place behind the blur rather than in view.
    const delay = window._hemmaNoFilterAnim ? 100 : SORT_DELAY_MS;
    this._sortTimer = setTimeout(() => {
      this._sortTimer = null;
      this._applyOrder(true);
    }, delay);
  }

  // ── FLIP animation ──────────────────────────────────────────────────────────

  _applyOrder(animate) {
    if (!this._wrappers.length) return;

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
        display: block;
        position: absolute;
        z-index: 3;
        inset: auto
          var(--hemma-entity-right-inset-current, var(--hemma-entity-right-inset-desktop, var(--hemma-rail-left, var(--page-gutter, 8vw))))
          var(--hemma-entity-bottom-current, var(--hemma-entity-bottom-desktop, 0px))
          var(--hemma-entity-left-inset-current, var(--hemma-entity-left-inset-desktop, var(--hemma-rail-left, var(--page-gutter, 8vw))));
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

      /* Only the wrappers take taps, so the host can't block the navbar. */
      .card-wrapper { pointer-events: auto; }

      #container {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        gap: 8px;
        padding: 20px var(--hemma-entity-shadow-pad-right-current, var(--hemma-entity-shadow-pad-right-desktop, 0px)) 40px 0;
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
        /* Child combinator load-bearing — see the collapsed-spacer rule below. */
        #container > .card-wrapper[data-size="large"] { grid-row: span 2; }
        /* Passes the track height down for the card's own height:100%. */
        #container > .card-wrapper > * { display: block; height: 100%; }
        ` : ''}
        .card-wrapper[data-fullwidth="1"] { grid-column: 1 / -1 !important; width: 100% !important; flex: none !important; }
        /* Now Playing collapses its own content to ~0 height when nothing's
           active (hemma_mobile_now_playing.yaml's 0fr grid-template-rows
           trick), but this grid's row-gap still applies above AND below
           that now-empty row regardless of its size — a phantom double gap
           before whatever comes next (e.g. Favorites). Cancel exactly one
           gap's worth so the total space matches every other section gap. */
        .card-wrapper:has([data-hemma-np-empty]) {
          margin-top: -8px;
          transition: margin-top 0.5s cubic-bezier(0.32, 0.72, 0, 1);
        }
        /* Collapses the phantom grid row this card would otherwise leave below
           the badge row. display:none, NOT a negative margin: gap is spacing
           between grid TRACKS, so a margin only shifts the item inside its own
           area and both surrounding gaps survive. A display:none element
           generates no box, so no track and no gaps exist.

           THE CHILD COMBINATOR IS LOAD-BEARING — do not loosen it to a bare
           .card-wrapper[...] selector. filter-overlay.js appends its popups into
           THIS shadow root on purpose (document.body breaks pointerup in the iOS
           app), so a card it DOM-moves into a popup is still matched by rules
           declared here. Scoped to "#container >" the rule applies on the
           dashboard, where the wrapper is a direct child of #container, and
           stops applying inside a popup, where its parent is filter-overlay's
           content div (a sibling of #container, not a descendant). An unscoped
           version hid the sensor chips in every filter and room popup for a
           whole release cycle. Inline overrides from filter-overlay do NOT
           rescue it: hideWrapper/showWrapper below assign wrapper.style.display
           directly, and a plain CSSOM assignment drops the !important flag. */
        #container > .card-wrapper[data-collapsed-spacer] {
          display: none;
        }
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
