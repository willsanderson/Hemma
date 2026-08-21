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

// A `type: conditional` wrapper carries no entity, template or variables of its
// own — everything this file reads about a card lives under cfg.card.
function resolveCardConfig(cfg) {
  let c = cfg, depth = 0;
  while (c?.type === 'conditional' && c.card && depth++ < 4) c = c.card;
  return c;
}

// Returns the card's filter category, or null if it should always be shown.
function getFilterCategory(card) {
  const cfg = resolveCardConfig(card?._config);
  if (!cfg) return null;
  // The resolved variable is only present once button-card has merged its
  // templates, so fall back to the raw template name.
  const direct = cfg.variables?.mobile_filter_category;
  if (direct !== null && direct !== undefined) return direct;
  const tmpl = cfg.template;
  const list = Array.isArray(tmpl) ? tmpl : (tmpl ? [tmpl] : []);
  const cats = filterCategories();
  for (const t of list) {
    if (Object.prototype.hasOwnProperty.call(cats, t)) return cats[t];
  }
  if (list.includes('hemma_mobile_header')) {
    const slug = String(cfg.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (Object.prototype.hasOwnProperty.call(HEADER_CATEGORIES, slug)) return HEADER_CATEGORIES[slug];
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
  hemma_scene_row:             { full_width: true },
};

// A header is generic, so the category it labels comes from its name.
const HEADER_CATEGORIES = { scenes: 'unfiltered' };

// Lives in hemma-core.js so this file and filter-overlay.js agree. Read at call
// time; the local variables.size read is a fail-safe against a stale copy.
const getCardSize = (rawCfg) => {
  const cfg = resolveCardConfig(rawCfg);
  return window.hemmaCardSize?.(cfg) ||
    (String(cfg?.variables?.size || '').toLowerCase() === 'large' ? 'large' : 'small');
};

// An explicit key on the card config wins; otherwise the flag is inferred from
// the card type or its template names.
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
        ? '0 var(--hemma-rail-left, 16px) 0 max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 16px))'
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
        this._updateWrapperVisibility();
        this._updateSort();
      });
    }
  }

  // WebKit's getComputedStyle reports display:none for EVERY element inside a
  // display:none subtree, not just the hidden ancestor — so the moment a wrapper
  // is hidden, the card inside it stops reporting its own display and can never
  // be shown again. Blink returns the element's own value, which is why this
  // only bites in Safari and the iOS app.
  //
  // hui-conditional-card states its intent explicitly (it sets both the hidden
  // attribute and inline display), so trust that first — no layout needed. Cards
  // that hide themselves through their own CSS give no such signal, so put the
  // wrapper back in flow just long enough to read a truthful value, then restore
  // it and let the caller decide.
  _isCardHidden(card, wrapper) {
    if (!card) return false;
    if (card.hidden || card.style.display === 'none') return true;
    if (!wrapper || wrapper.style.display !== 'none') {
      return getComputedStyle(card).display === 'none';
    }
    wrapper.style.display = '';
    const hidden = getComputedStyle(card).display === 'none';
    wrapper.style.display = 'none';
    return hidden;
  }

  _updateWrapperVisibility() {
    if (!this._initialized) return;

    // The filter entity is global, so a filter left set on the phone must not
    // hide cards on a desktop row — only scroll_mode rows honour it. Desktop
    // still runs this pass to collapse wrappers of hidden conditional cards.
    const filter = this._scrollMode
      ? this._hass?.states['input_select.hemma_mobile_filter']?.state
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
          const hide = isFilterHidden(card) || this._isCardHidden(card, wrapper);
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

    // Desktop lays the row out as a horizontal flex strip, so a collapse there
    // animates width, not height — and has to eat the container's column gap on
    // the way out, or the row keeps 8px of the departed card's slot. Mobile's
    // two-column grid keeps the original height collapse.
    const horizontal = isDesktop();
    const gap = horizontal
      ? (parseFloat(getComputedStyle(this._container).columnGap) || 0)
      : 0;

    const clearAnimStyles = (wrapper) => {
      wrapper.style.transition  = '';
      wrapper.style.height      = '';
      wrapper.style.width       = '';
      wrapper.style.flex        = '';
      wrapper.style.marginRight = '';
      wrapper.style.opacity     = '';
      wrapper.style.overflow    = '';
      const card = wrapper.firstElementChild;
      if (card) {
        card.style.width = '';
        // Only reclaim what we set. hui-conditional-card owns this property and
        // may have written display:none in the meantime — clearing that blindly
        // would flash the card back on screen.
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
      // No need to pin the card on the way out — anything being collapsed is
      // already invisible, so only the closing gap is on screen.
      if (horizontal) {
        wrapper.style.flex  = `0 0 ${size}px`;
        wrapper.style.width = size + 'px';
      } else {
        wrapper.style.height = size + 'px';
      }
      wrapper.style.overflow   = 'hidden';
      wrapper.style.opacity    = '1';
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
        wrapper.style.opacity = '0';
      }));
      setTimeout(() => {
        // showWrapper can take a wrapper back mid-collapse (a conditional card
        // that flips off and on inside 220ms); hiding it here would strand it
        // off screen until the next 500ms sweep.
        if (!this._animHiding.has(wrapper)) return;
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
      if (wrapper.dataset.size === 'large') this._scheduleLargeFill(wrapper);
      if (!animate) return;
      this._animShowing.add(wrapper);
      const axis = horizontal ? 'width' : 'height';
      const size = horizontal ? wrapper.offsetWidth : wrapper.offsetHeight;
      const card = wrapper.firstElementChild;
      if (horizontal && card) {
        // hui-conditional-card carries no styles of its own, so it is display:
        // inline and a width on it would be ignored — block it out, or the card
        // reflows its text as the wrapper widens instead of wiping into view.
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
      wrapper.style.opacity    = '0';
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
        wrapper.style.opacity = '1';
      }));
      setTimeout(() => {
        if (!this._animShowing.has(wrapper)) return;
        this._animShowing.delete(wrapper);
        clearAnimStyles(wrapper);
      }, DUR + 50);
    };

    // filter-overlay sets this flag while dismissing so wrappers snap into place
    // behind the closing blur instead of animating in view.
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
          // Collapse only once this card has actually been seen visible. A card
          // that is merely mid-render reads as hidden too, and snapping its
          // wrapper shut on that would flicker — the 500ms sweep settles those.
          if (was === false) hideWrapper(wrapper, !snap);
          return;
        }
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
      let anyVisible = false;
      this._wrappers.forEach((wrapper, i) => {
        const card = this._cards[i];
        if (!card) return;
        if (isFilterHidden(card) || this._isCardHidden(card, wrapper)) {
          this._hiddenState[i] = true;
          if (!this._animHiding.has(wrapper)) hideWrapper(wrapper, false);
        } else {
          this._hiddenState[i] = false;
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

  _scheduleLargeFill(wrapper) {
    const run = () => this._stampLargeFill(wrapper);
    requestAnimationFrame(run);
    setTimeout(run, 400);
    setTimeout(run, 1200);
  }

  // A large tile's height comes from the two grid tracks its wrapper spans, and
  // the card only inherits that if every element down to its ha-card has a
  // definite height. The stylesheet reaches the wrapper's own child and stops at
  // the first shadow boundary, so a wrapped card (conditional, auto-entities, a
  // swipe card) has to be stamped by hand. Returns whether an ha-card was found
  // below, so only elements on the path to one are touched.
  _stampLargeFill(el, depth = 0) {
    if (!el || depth > 16) return false;
    if (el.tagName === 'HA-CARD') return true;
    // Inline display, not computed: WebKit reports none for a whole hidden
    // subtree, which would skip every card in a row that is merely off screen.
    if (el.style && el.style.display === 'none') return false;

    let onPath = false;
    const roots = el.shadowRoot ? [el.shadowRoot, el] : [el];
    for (const root of roots) {
      for (const kid of root.children || []) {
        if (this._stampLargeFill(kid, depth + 1)) onPath = true;
      }
    }

    // Card elements only. A host card's own layout divs already size themselves,
    // and stamping them would fight the stylesheet that owns them.
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

    this._cards       = [];
    this._wrappers    = [];
    this._haCards     = [];
    this._hiddenState = [];
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
      if (getCardSize(cfg) === 'large') {
        wrapper.dataset.size = 'large';
        this._scheduleLargeFill(wrapper);
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

    this._cardsCreated = true;
    this._initializing = false;

    container.addEventListener('pointerdown', () => {
      if (this._sortTimer !== null) this._scheduleSort();
    }, { passive: true });

    setTimeout(() => {
      // Collapse already-hidden cards before the entrance animation is released.
      // _updateWrapperVisibility can't do it — it's gated on _initialized, which
      // isn't set until PAGE_ANIM_MS later, so a conditional card whose condition
      // is unmet would hold an empty slot open for the first second of the load.
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

  // querySelector can't cross a shadow boundary it doesn't own, so descend
  // manually: a conditional card's ha-card sits two roots deep
  // (hui-conditional-card > custom:button-card > ha-card).
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

  _isActive(index) {
    // A conditional card whose condition is unmet still occupies its slot, so
    // check the card's own visibility before trusting either detector.
    if (this._isCardHidden(this._cards[index], this._wrappers[index])) return false;
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
           gap's worth so the total space matches every other section gap.

           CHILD COMBINATOR LOAD-BEARING for the same reason as the rule below:
           unscoped, it followed Now Playing into the media popup, where the
           gap it cancels doesn't exist and its margin-top transition turned
           filter-overlay's inline alignment stamps into visible half-second
           glides. */
        #container > .card-wrapper:has([data-hemma-np-empty]) {
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
