// filter-overlay.js
(function () {
  'use strict';
  if (customElements.get('hemma-filter-overlay')) return;

  const HEMMA_VARS = [
    '--hemma-entity-height-current','--hemma-entity-inner-pad-current',
    '--hemma-entity-icon-size-current','--hemma-entity-name-font-current',
    '--hemma-entity-state-font-current','--hemma-entity-col-width-current',
    '--hemma-entity-rows-current','--hemma-entity-justify-current',
    '--hemma-entity-right-inset-current','--hemma-entity-left-inset-current',
    '--hemma-entity-shadow-pad-right-current','--hemma-entity-overflow-y-current',
    '--hemma-button-card-box-shadow-current','--hemma-button-card-box-shadow-active-current',
    '--hemma-button-card-box-shadow-hover-current','--hemma-rail-left','--page-gutter',
    '--badge-gap-current','--badge-col-gap-current','--badge-padding-current',
    '--badge-min-height-current','--badge-icon-size-current','--badge-font-size-current',
    '--badge-btn-size-current','--badge-media-icon-size-current',
    '--badge-media-btn-size-current','--badge-media-btn-icon-size-current',
    '--hemma-entity-background','--hemma-entity-background-active',
    '--hemma-entity-active-tint','--hemma-entity-active-tint-mobile',
    '--hemma-entity-hover-tint',
    '--hemma-entity-name','--hemma-entity-name-active',
    '--hemma-entity-state','--hemma-entity-state-opacity','--hemma-entity-state-active',
    '--hemma-entity-state-active-color','--ha-card-border-radius',
    '--ha-card-background','--button-card-box-shadow','--button-card-box-shadow-active',
    '--button-card-box-shadow-mobile','--button-card-box-shadow-active-mobile',
    '--hemma-progress-color','--hemma-progress-track',
    '--hero-room-name-size-current',
  ];

  const SPRING_IN = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const EASE_OUT  = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  // Vertical alignment of the overlay title within the header button-card.
  // 0 = card top edge, 1 = card bottom edge. Increase to move title lower.
  const TITLE_VCENTER = 0.45;

  const LANDSCAPE_PHONE_VAR = '--hemma-landscape-phone'; // '0' or '1', flipped by @media
  if (!document.getElementById('hemma-landscape-phone-style')) {
    const s = document.createElement('style');
    s.id = 'hemma-landscape-phone-style';
    s.textContent =
      `:root{${LANDSCAPE_PHONE_VAR}:0;}` +
      `@media (max-height:600px) and (orientation:landscape){:root{${LANDSCAPE_PHONE_VAR}:1;}}`;
    document.head.appendChild(s);
  }
  const LANDSCAPE_GUTTER_CALC = `calc(60px * var(${LANDSCAPE_PHONE_VAR}, 0))`;

  // Scroll-header mode tunables.
  const COMPACT_BAR_HEIGHT = 44; // compact nav title content height, below the safe-area inset
  const BADGE_LOCK_GAP     = 6;  // gap between compact bar bottom and the pinned badge row
  // Inactive pill background while the popup is open. Mirrors the themes'
  // badge-background — update both together.
  const BADGE_INACTIVE_BG  = 'rgba(46,48,56,0.78)';

  let _movedBadgeRow = null; // { owner, wrapper, el, parent, sibling }
  // iOS decides a pan gesture's fate at touchstart, and mutating layout inside
  // the scroller while a finger is down kills it until the finger lifts.
  let _touchActive = false;
  document.addEventListener('touchstart', () => { _touchActive = true; },  { passive: true, capture: true });
  document.addEventListener('touchend',   (e) => { _touchActive = e.touches.length > 0; }, { passive: true, capture: true });
  document.addEventListener('touchcancel',(e) => { _touchActive = e.touches.length > 0; }, { passive: true, capture: true });
  // The overlay currently presenting. A closing overlay's deferred badge
  // cleanup must not strip styles a newly opened one just applied.
  let _activeOverlay = null;

  function _restoreBadgeRow() {
    const m = _movedBadgeRow;
    if (!m) return;
    _movedBadgeRow = null;
    const { wrapper, el, parent, sibling } = m;
    wrapper.style.removeProperty('position');
    wrapper.style.removeProperty('top');
    wrapper.style.removeProperty('left');
    wrapper.style.removeProperty('right');
    wrapper.style.removeProperty('width');
    wrapper.style.removeProperty('height');
    wrapper.style.removeProperty('z-index');
    wrapper.style.removeProperty('margin-top');
    wrapper.style.removeProperty('--ha-card-backdrop-filter');
    wrapper.style.removeProperty('padding-left');
    el.style.removeProperty('position'); // lets the stylesheet's sticky return
    el.style.removeProperty('top');
    el.style.removeProperty('left');
    el.style.removeProperty('right');
    el.style.removeProperty('width');
    el.style.removeProperty('z-index');
    el.style.removeProperty('--ha-card-backdrop-filter');
    // DOM moves reset descendant scroll positions — preserve the pills' scroll.
    const scroller = el.shadowRoot?.querySelector('#badges');
    const keepSL   = scroller ? scroller.scrollLeft : 0;
    if (parent) {
      if (sibling && sibling.parentNode === parent) parent.insertBefore(wrapper, sibling);
      else parent.appendChild(wrapper);
    }
    if (scroller && keepSL) scroller.scrollLeft = keepSL;
  }

  // ── Main-dashboard collapsing header ───────────────────────────────────────
  const DASH_BAR_HEIGHT = 44;
  let _dashHeader = null; // { grad, title, scrollEl, onScroll, update, hide, inst }
  let _dashBarOn  = false; // frosted bar visible (hysteresis state)
  let _dashTitleStyle = null;

  // The dashboard scrolls in an inner shadow-DOM container, and scroll events
  // don't cross shadow boundaries, so document-level listeners never see them.
  function _findScrollAncestor(el) {
    let node = el;
    for (let i = 0; node && i < 40; i++) {
      if (node.nodeType === 1) {
        try {
          const cs = getComputedStyle(node);
          if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') &&
              node.scrollHeight > node.clientHeight + 40) return node;
        } catch (_) {}
      }
      node = node.parentNode || node.host || null;
    }
    return null;
  }

  let _bgCardCache = null;
  function _findBgCard() {
    if (_bgCardCache?.isConnected) return _bgCardCache;
    _bgCardCache = null;
    const walk = (root, depth) => {
      if (!root || depth > 15) return null;
      let cards;
      try { cards = root.querySelectorAll('button-card'); } catch (_) { return null; }
      for (const bc of cards) {
        const t = bc._config?.template;
        if (t !== 'hemma_mobile_bg' && !(Array.isArray(t) && t.includes('hemma_mobile_bg'))) continue;
        const inner = bc.shadowRoot?.querySelector('ha-card');
        if (!inner) continue;
        const acs = getComputedStyle(inner, '::after');
        if (acs.backgroundImage && acs.backgroundImage.includes('url(')) return inner;
      }
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) {
          const found = walk(el.shadowRoot, depth + 1);
          if (found) return found;
        }
      }
      return null;
    };
    _bgCardCache = walk(document, 0);
    return _bgCardCache;
  }

  const EMPTY_SET = new Set();
  const activeStates     = () => window.HEMMA_ACTIVE_STATES || EMPTY_SET;
  const filterCategories = () => window.HEMMA_FILTER_CATEGORIES || {};

  function _cardCategory(cfg) {
    const direct = cfg?.variables?.mobile_filter_category;
    if (direct !== null && direct !== undefined) return direct;
    const t = cfg?.template;
    const cats = filterCategories();
    for (const n of (Array.isArray(t) ? t : [t])) {
      if (n && Object.prototype.hasOwnProperty.call(cats, n)) return cats[n];
    }
    return null;
  }

  const H_SCROLL_IDS = new Set(['media_row', 'climate_row', 'rooms_row']);

  const _blurLayers = new Set();
  const _otherBlurUp = (ownBlurEl) => {
    for (const el of _blurLayers) {
      if (el === ownBlurEl || !el.isConnected) continue;
      if (el.style.display === 'none') continue;
      if (parseFloat(getComputedStyle(el).opacity || '0') > 0.05) return true;
    }
    return false;
  };

  const _rowContentRight = (row) => {
    const rowRect = row.getBoundingClientRect();
    const limit = rowRect.left + Math.max(4096, row.clientWidth * 6);
    let right = rowRect.right;
    const walk = (node, depth) => {
      if (depth > 8 || !(node instanceof Element)) return;
      const r = node.getBoundingClientRect();
      if (r.width > 0.5 && r.right <= limit && r.right > right) right = r.right;
      if (node.shadowRoot) for (const c of node.shadowRoot.children) walk(c, depth + 1);
      for (const c of node.children) walk(c, depth + 1);
    };
    walk(row.firstElementChild, 0);
    return right;
  };

  function _fixRowWidth(row) {
    const inner = row.firstElementChild;
    if (!inner) return;
    const cap = Math.max(4096, row.clientWidth * 6);
    // Undo a width left over from a pre-clamp measurement.
    const curW = parseFloat(inner.style.getPropertyValue('width')) || 0;
    if (curW > cap) inner.style.removeProperty('width');
    const ext = _rowContentRight(row) - inner.getBoundingClientRect().left;
    if (ext > row.clientWidth + 4 && ext <= cap &&
        Math.abs(ext - inner.getBoundingClientRect().width) > 4) {
      // Needs !important — the template's own max-content rule beats a plain
      // inline style.
      inner.style.setProperty('width', `${Math.ceil(ext)}px`, 'important');
    }
  }
  function _fixRowWidths(root) {
    const walk = (node, depth) => {
      if (depth > 12 || !(node instanceof Element)) return;
      if (H_SCROLL_IDS.has(node.id)) _fixRowWidth(node);
      if (node.shadowRoot) for (const c of node.shadowRoot.children) walk(c, depth + 1);
      for (const c of node.children) walk(c, depth + 1);
    };
    if (root instanceof Element) walk(root, 0);
  }

  (function attachRowScrollFix() {
    let row = null, inner = null, maxPan = 0, panStart = 0;
    let useNative = true, startX = 0, startY = 0;
    let decided = false, horizontal = false;
    let lastX = 0, lastT = 0, vel = 0, momentumRaf = 0;
    const getPan = () => useNative ? row?.scrollLeft ?? 0 : (row?._hemmaPanX || 0);
    const setPan = (el, innerEl, native, v) => {
      v = Math.max(0, Math.min(maxPan, v));
      if (native) el.scrollLeft = v;
      else if (innerEl) { el._hemmaPanX = v; innerEl.style.transform = `translateX(${-v}px)`; }
      return v;
    };
    document.addEventListener('touchstart', (e) => {
      cancelAnimationFrame(momentumRaf);
      row = null; decided = horizontal = false;
      const t = e.touches[0];
      if (!t) return;
      let hit = null;
      for (const el of e.composedPath()) {
        if (el instanceof Element && H_SCROLL_IDS.has(el.id)) { hit = el; break; }
      }
      if (!hit) return;
      inner = hit.firstElementChild;
      if (hit.scrollWidth > hit.clientWidth + 4) {
        // A real scroll container, so iOS handles it natively and this drive
        // only covers desktop and emulators.
        useNative = true;
        maxPan = hit.scrollWidth - hit.clientWidth;
      } else if (inner) {
        // Content only paints past the row, so pan by transform. Non-iOS only.
        const cur = hit._hemmaPanX || 0;
        maxPan = Math.round(_rowContentRight(hit) + cur - hit.getBoundingClientRect().right);
        useNative = false;
      } else {
        return;
      }
      if (maxPan < 5) return;
      row = hit;
      panStart = getPan();
      startX = lastX = t.clientX;
      startY = t.clientY;
      lastT = e.timeStamp;
      vel = 0;
    }, { passive: true, capture: true });
    document.addEventListener('touchcancel', () => {
      row = null;
    }, { passive: true, capture: true });
    document.addEventListener('touchmove', (e) => {
      if (!row) return;
      const t = e.touches[0];
      if (!t) return;
      if (!decided) {
        const dx = Math.abs(t.clientX - startX), dy = Math.abs(t.clientY - startY);
        if (dx < 2 && dy < 2) return;      // taps never reach preventDefault
        decided = true;
        horizontal = dx >= dy;
      }
      if (!horizontal) { row = null; return; }
      setPan(row, inner, useNative, panStart + (startX - t.clientX));
      const dt = Math.max(1, e.timeStamp - lastT);
      vel = (lastX - t.clientX) / dt;      // px per ms
      lastX = t.clientX;
      lastT = e.timeStamp;
      if (e.cancelable) e.preventDefault(); // keep the page from scrolling vertically
    }, { passive: false, capture: true });
    document.addEventListener('touchend', () => {
      if (!row || !horizontal) {
        // Re-fit only after the touch, never while iOS is arbitrating a pan.
        if (row) { const r = row; setTimeout(() => { if (!_touchActive) _fixRowWidth(r); }, 80); }
        row = null;
        return;
      }
      const el = row, innerEl = inner, native = useNative, max = maxPan;
      row = null;
      setTimeout(() => { if (!_touchActive) _fixRowWidth(el); }, 80);
      let v = vel * 16;                    // px per frame
      let pos = native ? el.scrollLeft : (el._hemmaPanX || 0);
      const glide = () => {
        if (Math.abs(v) < 0.5) return;
        pos = Math.max(0, Math.min(max, pos + v));
        if (native) el.scrollLeft = pos;
        else if (innerEl) { el._hemmaPanX = pos; innerEl.style.transform = `translateX(${-pos}px)`; }
        if (pos <= 0 || pos >= max) return;
        v *= 0.94;
        momentumRaf = requestAnimationFrame(glide);
      };
      momentumRaf = requestAnimationFrame(glide);
    }, { passive: true, capture: true });
  })();

  function _ensureDashboardHeader(inst) {
    if (_dashHeader?.grad?.isConnected) return;
    if (_dashHeader) {
      // The view was torn down; detach the stale listener before rebuilding.
      try {
        _dashHeader.scrollEl?.removeEventListener('scroll', _dashHeader.onScroll);
        document.removeEventListener('touchmove', _dashHeader.onScroll, true);
      } catch (_) {}
      _dashHeader.grad?.remove();
      _dashHeader.veil?.remove();
      _dashHeader.edge?.remove();
      _dashHeader.title?.remove();
      _dashHeader = null;
    }
    const target = inst._appendTarget;
    if (!target || !inst._headerEl) return;

    // Reset the filter on load. It's a global entity, so a popup left open on
    // one device would otherwise greet every other one.
    if (inst._hass?.states?.['input_select.hemma_mobile_filter']?.state !== 'all') {
      try {
        inst._hass.callService('input_select', 'select_option', {
          entity_id: 'input_select.hemma_mobile_filter',
          option: 'all',
        });
      } catch (_) {}
    }

    // Masks anchor to the safe-area inset. The stop has to be hard — any
    // falloff renders as partial blur above the hairline.
    const st = (px) => `calc(env(safe-area-inset-top, 0px) + ${px}px)`;
    const hardStop = (px, maxA = 1) => {
      const c = maxA >= 1 ? 'black' : `rgba(0,0,0,${maxA})`;
      return `linear-gradient(to bottom, ${c} 0px, ${c} ${st(px)}, transparent ${st(px)})`;
    };

    const gm = hardStop(52);
    const grad = document.createElement('div');
    grad.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'height:calc(env(safe-area-inset-top, 0px) + 150px)',
      'z-index:110', 'pointer-events:none', 'opacity:0',
      'transition:opacity 220ms ease-in-out',
      'backdrop-filter:blur(22px) saturate(1.2) brightness(0.97)',
      '-webkit-backdrop-filter:blur(22px) saturate(1.2) brightness(0.97)',
      `mask-image:${gm}`, `-webkit-mask-image:${gm}`,
      'transform:translateZ(0)', '-webkit-transform:translateZ(0)',
    ].join(';');

    const veil = document.createElement('div');
    const vm = hardStop(52, 0.5);
    veil.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'z-index:111', 'pointer-events:none', 'opacity:0', 'overflow:hidden',
      'transition:opacity 220ms ease-in-out',
      `mask-image:${vm}`, `-webkit-mask-image:${vm}`,
    ].join(';');
    const veilInner = document.createElement('div');
    veilInner.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background-repeat:no-repeat',
      'background-size:100% 100%, cover',
      'filter:blur(8px) saturate(1.02)',
      'transform:scale(1.08)',
      'transform-origin:top center',
    ].join(';');
    veil.appendChild(veilInner);

    const edge = document.createElement('div');
    edge.style.cssText = [
      'position:fixed', 'left:0', 'right:0',
      'top:calc(env(safe-area-inset-top, 0px) + 51px)',
      'height:11px', 'z-index:112', 'pointer-events:none', 'opacity:0',
      'transition:opacity 220ms ease-in-out',
      'background:linear-gradient(to bottom, rgba(18,20,26,0.025), rgba(18,20,26,0))',
      'border-top:0.5px solid rgba(255,255,255,0.10)',
      'box-sizing:border-box',
    ].join(';');

    const syncVeilBg = () => {
      let bgCard = _dashHeader?.bgCard;
      if (!bgCard?.isConnected) {
        bgCard = _findBgCard();
        if (_dashHeader) _dashHeader.bgCard = bgCard;
      }
      if (!bgCard) {
        // Fall back to a plain dark veil rather than letting bright content
        // bloom through the title.
        if (!veilInner.style.backgroundImage) {
          veilInner.style.backgroundImage = 'linear-gradient(rgba(24,28,38,0.92), rgba(24,28,38,0.92))';
        }
        return;
      }
      const acs = getComputedStyle(bgCard, '::after');
      const bcs = getComputedStyle(bgCard, '::before');
      const bgi = acs.backgroundImage;
      if (!bgi || !bgi.includes('url(')) return;
      const has = (v) => v && v !== 'none';
      const image = has(bcs.backgroundImage) ? `${bcs.backgroundImage}, ${bgi}` : bgi;
      if (veilInner.style.backgroundImage !== image) {
        veilInner.style.backgroundImage = image;
        veilInner.style.backgroundPosition = has(bcs.backgroundImage)
          ? `${bcs.backgroundPosition}, ${acs.backgroundPosition}` : acs.backgroundPosition;
        veilInner.style.backgroundSize = has(bcs.backgroundImage)
          ? `${bcs.backgroundSize}, ${acs.backgroundSize}` : acs.backgroundSize;
      }
    };

    // Built once for the page rather than per popup, but it reads the same
    // live CSS var, so it survives rotation too.
    if (!_dashTitleStyle?.isConnected) {
      _dashTitleStyle = document.createElement('style');
      _dashTitleStyle.textContent =
        `.hemma-dash-compact-title{padding-left:calc(max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px)) + ${LANDSCAPE_GUTTER_CALC}) !important;}`;
      (target || document.head).appendChild(_dashTitleStyle);
    }
    const title = document.createElement('div');
    title.className = 'hemma-dash-compact-title';
    title.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:112',
      `height:${DASH_BAR_HEIGHT}px`,
      'padding-top:env(safe-area-inset-top, 0px)',
      'padding-left:max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px))',
      'box-sizing:content-box',
      'display:flex', 'align-items:center', 'justify-content:flex-start',
      'font-size:20px', 'font-weight:700', 'color:#ffffff', 'letter-spacing:-0.3px',
      'opacity:0', 'transform:translateY(5px)', 'pointer-events:none', 'cursor:pointer',
    ].join(';');
    title.textContent = 'Home';
    title.addEventListener('click', () => {
      const se = _dashHeader?.scrollEl;
      if (se === window) window.scrollTo({ top: 0, behavior: 'smooth' });
      else se?.scrollTo({ top: 0, behavior: 'smooth' });
    });

    target.appendChild(grad);
    target.appendChild(veil);
    target.appendChild(edge);
    target.appendChild(title);

    const hide = () => {
      _dashBarOn                = false;
      grad.style.opacity        = '0';
      veil.style.opacity        = '0';
      edge.style.opacity        = '0';
      title.style.opacity       = '0';
      title.style.pointerEvents = 'none';
    };

    const update = () => {
      if (!grad.isConnected) return;
      if (_activeOverlay) { hide(); return; }
      let headerEl = inst._headerEl;
      if (!headerEl?.isConnected || !inst._container?.isConnected) {
        // Both are nulled on dismiss, and HA can re-render the cards.
        inst._discoverElements();
        headerEl = inst._headerEl;
        if (!headerEl?.isConnected) { hide(); return; }
      }
      const nameEl = headerEl.shadowRoot?.querySelector('#name');
      const src    = nameEl || headerEl;
      const rect   = src.getBoundingClientRect();
      if (!rect.height) { hide(); return; }
      const barBottom = title.getBoundingClientRect().bottom;
      const safeTop   = barBottom - DASH_BAR_HEIGHT;
      const p = Math.max(0, Math.min(1,
        (barBottom + 24 - rect.bottom) / (barBottom + 24 - safeTop)));
      // Sequential cross-fade, as in the popup: the large title is gone by 45%
      // of the window and the compact one enters after 55%.
      const tp = Math.min(1, p / 0.45);
      if (nameEl) {
        nameEl.style.animation  = 'none'; // titleFadeIn's fill:both beats inline opacity
        nameEl.style.opacity    = String(0.9 * (1 - tp)); // 0.9 is its resting opacity
      }
      const nameText = nameEl?.textContent?.trim();
      if (nameText && title.textContent !== nameText) title.textContent = nameText;
      const cp = Math.max(0, (p - 0.55) / 0.45);
      title.style.opacity       = String(cp);
      title.style.transform     = `translateY(${(1 - cp) * 5}px)`;
      title.style.pointerEvents = cp > 0.5 ? 'auto' : 'none';
      const badgeRect = inst._badgeRowEl?.getBoundingClientRect();
      let barOn;
      if (badgeRect && badgeRect.height) {
        barOn = _dashBarOn
          ? badgeRect.bottom <= barBottom + 8
          : badgeRect.bottom <= barBottom;
      } else {
        barOn = p >= 1;
      }
      _dashBarOn = barOn;
      grad.style.opacity = barOn ? '1' : '0';
      edge.style.opacity = barOn ? '1' : '0';
      syncVeilBg();
      veil.style.opacity = barOn ? '1' : '0';
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    };
    const scrollEl = _findScrollAncestor(inst._container) || window;
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    // touchmove crosses shadow boundaries, so the fade stays responsive
    // mid-gesture even if the scroll container was mis-detected.
    document.addEventListener('touchmove', onScroll, { passive: true, capture: true });

    _dashHeader = { grad, veil, edge, title, scrollEl, onScroll, update, hide, inst, bgCard: null };
    update();
  }

  class HemmaFilterOverlay extends HTMLElement {
    constructor() {
      super();
      this._hass         = null;
      this._config       = null;
      this._helpers      = null;
      this._blurLayerEl  = null;
      this._overlayEl    = null;
      this._contentEl    = null;
      this._cardEls      = [];
      this._showing      = false;
      this._initialized  = false;
      this._initializing = false;

      this._container        = null;
      this._selfWrapper      = null;
      this._badgeRowEl       = null;
      this._badgeRowWrapper  = null;
      this._headerEl         = null;
      this._subBadgesEl      = null;
      this._subBadgesWrapper = null;
      this._scalableEls      = [];

      this._noScrollStyle   = null;
      this._bodyScrollStyle = null;

      this._titleEl               = null;
      this._compactHeaderEl       = null;
      this._gradientBlurEl        = null;
      this._subBadgesSavedParent  = null;
      this._subBadgesSavedSibling = null;
      this._npWrapper             = null;
      this._npSaved               = null;
      this._npSpacer              = null;
      this._gapSpacer             = null;
      this._npNaturalTop          = null;
      this._appendTarget          = null;

      this._pendingBlurFade    = null;
      this._favPopupDone       = false;
      this._autoSectionsDone   = false;
      this._suppressedWrappers = [];
      this._hiddenSmartRows    = [];
      this._scrollHandler      = null;
      this._cardSectionEl      = null;
      this._badgePopupStyle    = null;
      this._badgeShadowCards   = [];
      this._headerWrapper      = null;
    }


    connectedCallback() {
      this.style.cssText = 'display:none!important;';
      if (this._config && !this._initialized && !this._initializing) this._init();
    }

    disconnectedCallback() {
      if (this._blurLayerEl) _blurLayers.delete(this._blurLayerEl);
      this._blurLayerEl?.remove();
      this._overlayEl?.remove();
      this._compactHeaderEl?.remove();
      this._compactHeaderEl = null;
      this._gradientBlurEl?.remove();
      this._gradientBlurEl = null;
      if (_movedBadgeRow && _movedBadgeRow.owner === this) _restoreBadgeRow();
      if (_activeOverlay === this) _activeOverlay = null;
      this._blurLayerEl = this._overlayEl = this._contentEl = null;
      this._cardEls = [];
      this._scalableEls  = [];
      this._headerWrapper = null;
      this._initialized  = false;
    }

    static getConfigElement() { return document.createElement('div'); }
    static getStubConfig()    { return { filter_category: 'climate', sections: [] }; }

    setConfig(config) {
      if (!config.filter_category && config.room) {
        const slug = String(config.room).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
        if (slug) config = { ...config, filter_category: 'room_' + slug };
      }
      if (!config.filter_category) throw new Error('hemma-filter-overlay: filter_category or room required');
      this._config = config;
      if (this.isConnected && !this._initialized && !this._initializing) this._init();
    }

    set hass(v) {
      const prevFilter = this._hass?.states?.['input_select.hemma_mobile_filter']?.state;
      this._hass = v;
      for (const el of this._cardEls) { try { el.hass = v; } catch (_) {} }
      const filter = v?.states?.['input_select.hemma_mobile_filter']?.state;

      // Fires once the filter confirms 'all' after a dismiss. The delay lets
      // smart-row's fast sort snap the cards under the still-opaque blur first.
      if (this._pendingBlurFade && filter === 'all' && prevFilter !== 'all') {
        setTimeout(() => {
          if (!this._pendingBlurFade) return;
          requestAnimationFrame(() => requestAnimationFrame(() => this._runBlurFade()));
        }, 250);
      }

      const shouldShow = filter === this._config?.filter_category;
      if (shouldShow !== this._showing) {
        this._showing = shouldShow;
        if (shouldShow) {
          this._initialized ? this._animIn() : this._init().then(() => this._animIn());
        } else {
          this._animOut();
        }
      }
    }

    async _init() {
      if (this._initializing || this._initialized) return;
      this._initializing = true;
      try {
        if (!this._helpers) this._helpers = await window.loadCardHelpers();
        this._buildOverlay();
        this._initialized = true;
      } catch (e) {
        console.error('[hemma-filter-overlay] init error:', e);
      } finally {
        this._initializing = false;
      }
    }

    _buildOverlay() {
      if (this._overlayEl) return;

      this._discoverElements();
      const shadowRoot   = this._container?.getRootNode?.();
      const inShadow     = shadowRoot instanceof ShadowRoot;
      const appendTarget = inShadow ? shadowRoot : document.body;
      this._appendTarget = appendTarget;


      // html/body scrollbar hiding — always in document.head (not shadow root scoped)
      if (!this._bodyScrollStyle) {
        const s = document.createElement('style');
        s.textContent = 'html::-webkit-scrollbar,body::-webkit-scrollbar{display:none!important}html,body{scrollbar-width:none!important;-ms-overflow-style:none!important}';
        document.head.appendChild(s);
        this._bodyScrollStyle = s;
      }

      // Must be injected here, not document.head — those styles don't reach
      // into a shadow root.
      if (!this._noScrollStyle) {
        const s = document.createElement('style');
        s.textContent = [
          '[data-hemma-filter-overlay]::-webkit-scrollbar{display:none!important}',
          '[data-hemma-filter-overlay]{scrollbar-width:none!important}',
        ].join(' ');
        (inShadow ? shadowRoot : document.head).appendChild(s);
        this._noScrollStyle = s;
      }

      // Blur layer: backdrop-filter and tint, no scroll, no pointer events.
      const blurLayer = document.createElement('div');
      blurLayer.setAttribute('data-hemma-filter-blur', this._config.filter_category);
      Object.assign(blurLayer.style, {
        position:             'fixed',
        top: '0', left: '0', right: '0', bottom: '0',
        zIndex:               '49',
        backdropFilter:       'blur(40px)',
        webkitBackdropFilter: 'blur(40px)',
        background:           'rgba(0, 0, 0, 0.22)',
        pointerEvents:        'none',
        display:              'none',
        // Its own compositing layer, so the blur doesn't flicker when the
        // content behind it re-sorts during a filter change.
        transform:            'translateZ(0)',
        webkitTransform:      'translateZ(0)',
        willChange:           'transform',
      });
      appendTarget.appendChild(blurLayer);
      this._blurLayerEl = blurLayer;
      _blurLayers.add(blurLayer);

      const overlay = document.createElement('div');
      overlay.setAttribute('data-hemma-filter-overlay', this._config.filter_category);
      Object.assign(overlay.style, {
        position:           'fixed',
        top: '0', left: '0', right: '0', bottom: '0',
        zIndex:             '50',
        background:         'transparent',
        overflowY:          'auto',
        overflowX:          'hidden',
        touchAction:        'pan-x pan-y',
        scrollbarWidth:     'none',
        display:            'none',
      });

      // Dismiss on a tap in empty space. A tap on a card retargets e.target to
      // the button-card host, so only bare overlay/content hits match.
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target === content) {
          this._dismiss();
        }
      });

      const content = document.createElement('div');
      content.style.cssText = [
        'position:relative',
        'padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))',
        'width:100%',
        'box-sizing:border-box',
      ].join(';');
      overlay.appendChild(content);
      this._contentEl = content;

      // Cards are already visible as the sheet slides up, so suppress their own
      // entrance animation.
      content.style.setProperty('--hemma-anim-delay',    '-1s');
      content.style.setProperty('--hemma-anim-duration', '0.001s');

      const sections = this._config.sections || [];
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        // A static section renders in place with no slide-up, so it lines up
        // with the matching dashboard section behind it.
        const animIdx = section.static ? null : i;

        // Omit a section's name to get a flat, headerless card group.
        if (section.name) {
          this._appendRevealCard({
            type:      'custom:button-card',
            template:  'hemma_mobile_header',
            full_width: true,
            name:      section.name,
            variables: { mobile_filter_categories: null },
            styles:    {
              card:          [{ padding: '24px 0px 8px 11px' }],
              custom_fields: { arrow: [{ display: 'none' }] },
            },
          }, content, animIdx);
        }

        if (section.full_width) {
          // Full-width blocks instead of the two-column entity grid.
          for (const c of section.cards || []) this._appendRevealCard(c, content, animIdx);
        } else {
          this._appendEntityGrid(section.cards || [], content, animIdx);
        }
      }

      appendTarget.appendChild(overlay);
      this._overlayEl = overlay;

      if (this._hass) {
        for (const el of this._cardEls) { try { el.hass = this._hass; } catch (_) {} }
      }

      // Set up the collapsing header once per view. Discovery can fail this
      // early while cards are still rendering, so keep retrying for a while.
      const tryDashExtras = (n) => {
        const headerDone = !!_dashHeader?.grad?.isConnected;
        if (!_activeOverlay) {
          this._discoverElements();
          if (!headerDone && this._headerEl) _ensureDashboardHeader(this);
          // Give the sub-badge rows real scrollWidth as soon as they render.
          _fixRowWidths(this._container);
        }
        if (n < 20 && !headerDone) setTimeout(() => tryDashExtras(n + 1), 500);
      };
      tryDashExtras(0);
    }

    _appendRevealCard(cfg, parent, animIndex) {
      const el = this._helpers.createCardElement(cfg);
      if (!el) return;
      if (this._hass) { try { el.hass = this._hass; } catch (_) {} }
      const wrap = document.createElement('div');
      // A null animIndex means static: visible immediately, appearing with the
      // overlay fade like the title and sub-badges.
      wrap.style.cssText = `display:block;width:100%;box-sizing:border-box;opacity:${animIndex == null ? '1' : '0'};`;
      if (animIndex != null) wrap._animIndex = animIndex;
      wrap.appendChild(el);
      parent.appendChild(wrap);
      this._cardEls.push(el);
    }

    _appendEntityGrid(cards, parent, animIndex) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:block;width:100%;box-sizing:border-box;opacity:0;margin-bottom:8px;touch-action:pan-y;';
      wrap._animIndex = animIndex;

      // The column count needs a real media query rather than a one-time JS
      // check, so it follows a rotation while the popup is open.
      if (!this._entityGridStyle) {
        const st = document.createElement('style');
        st.textContent =
          '.hemma-entity-grid{grid-template-columns:repeat(2,minmax(0,1fr));}' +
          // Same fixed tracks + dense packing hemma-smart-row gives its entity
          // rows, or a large card's 1fr icon row collapses in the popup.
          '@media (max-width:767px) and (orientation:portrait),' +
          '(max-height:500px) and (orientation:portrait),' +
          '(max-height:600px) and (orientation:landscape){' +
          '.hemma-entity-grid{grid-auto-rows:var(--hemma-tile-row-h-current,66px);' +
          'grid-auto-flow:row dense;align-items:stretch;}' +
          '.hemma-entity-grid > [data-hemma-size="large"]{grid-row:span 2;}}' +
          '@media (max-height:600px) and (orientation:landscape){' +
          '.hemma-entity-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}';
        (this._appendTarget || document.head).appendChild(st);
        this._entityGridStyle = st;
      }

      const grid = document.createElement('div');
      grid.className = 'hemma-entity-grid';
      grid.style.cssText = [
        'display:grid',
        'gap:8px',
        `padding-left:calc(max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px)) + ${LANDSCAPE_GUTTER_CALC})`,
        `padding-right:calc(var(--hemma-rail-left, 11px) + ${LANDSCAPE_GUTTER_CALC})`,
        'box-sizing:border-box',
        'width:100%',
      ].join(';');

      for (const cardCfg of cards) {
        const card = this._helpers.createCardElement(cardCfg);
        if (!card) continue;
        if (this._hass) { try { card.hass = this._hass; } catch (_) {} }
        // Built fresh, not DOM-moved, so there is no wrapper to tag.
        // Fail-safe against a stale hemma-core.js — see smart-row.js.
        const cardSize = window.hemmaCardSize?.(cardCfg)
          || (String(cardCfg?.variables?.size || '').toLowerCase() === 'large' ? 'large' : 'small');
        if (cardSize === 'large') card.dataset.hemmaSize = 'large';
        grid.appendChild(card);
        this._cardEls.push(card);
      }

      wrap._hemmaGrid = grid;
      wrap.appendChild(grid);
      parent.appendChild(wrap);
    }

    _ensureAutoSections() {
      if (this._autoSectionsDone) return;
      if ((this._config.sections || []).length) { this._autoSectionsDone = true; return; }
      const container = this._container;
      if (!container || !this._helpers || !this._contentEl) return;
      // In room mode the popup is a single room: every card from that room, no
      // category filter, and no section header since the title already names it.
      const roomMode = this._config.room || null;
      const rooms = [];
      let pending = null; // last seen room header
      for (const kid of container.children) {
        const bc = this._getBC(kid);
        const t  = bc?._config?.template;
        const isHdr = t === 'hemma_mobile_header' ||
          (Array.isArray(t) && t.includes('hemma_mobile_header'));
        if (isHdr) {
          pending = {
            name:    bc._config?.name,
            roomKey: bc._config?.variables?.room_key,
          };
          continue;
        }
        const hsr = kid.querySelector?.('hemma-smart-row');
        if (hsr && pending) {
          if (roomMode) {
            if (pending.name === roomMode) {
              rooms.push({ ...pending, cards: (hsr._config?.cards || []).slice() });
            }
          } else if (pending.name && pending.name !== 'Favorites') {
            const cards = (hsr._config?.cards || []).filter(
              (c) => _cardCategory(c) === this._config.filter_category);
            if (cards.length) rooms.push({ ...pending, cards });
          }
          pending = null;
        }
      }
      this._autoSectionsDone = true;
      if (!rooms.length) return;
      let i = 0;
      for (const room of rooms) {
        if (!roomMode) {
          this._appendRevealCard({
            type:      'custom:button-card',
            template:  'hemma_mobile_header',
            full_width: true,
            name:      room.name,
            // room_key lets a tap on a room name inside a category popup switch
            // straight to that room's popup.
            variables: { room_key: room.roomKey || null,
                         mobile_filter_categories: null },
            styles:    {
              // Mirrors hemma_mobile_header.yaml's padding formula.
              // Popups clone the header rather than reuse it, so keep in sync.
              card:          [{ padding: `24px var(--hemma-rail-left, 11px) 10px calc(max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px)) + ${LANDSCAPE_GUTTER_CALC})` }],
              custom_fields: { arrow: [{ display: 'none' }] },
            },
          }, this._contentEl, i);
        }
        this._appendEntityGrid(room.cards.map((c) => JSON.parse(JSON.stringify(c))), this._contentEl, i);
        i++;
      }
      if (this._hass) {
        for (const el of this._cardEls) { try { el.hass = this._hass; } catch (_) {} }
      }
    }

    _ensureFavoritesPopupSection() {
      if (this._favPopupDone) return;
      const container = this._container;
      if (!container || !this._helpers || !this._contentEl) return;
      // The dashboard's Favorites section is a header named "Favorites"
      // immediately followed by its smart-row.
      let rowEl = null, seenHeader = false;
      for (const kid of container.children) {
        if (!seenHeader) {
          if (this._getBC(kid)?._config?.name === 'Favorites') seenHeader = true;
        } else {
          rowEl = kid.querySelector?.('hemma-smart-row') ||
            (kid.tagName?.toLowerCase() === 'hemma-smart-row' ? kid : null);
          break;
        }
      }
      const cards = (rowEl?._config?.cards || []).filter(
        (c) => _cardCategory(c) === this._config.filter_category);
      this._favPopupDone = true; // attempted, so don't rescan on every open
      if (!cards.length) return;
      const frag = document.createDocumentFragment();
      this._appendRevealCard({
        type:      'custom:button-card',
        template:  'hemma_mobile_header',
        full_width: true,
        name:      'Favorites',
        variables: { mobile_filter_categories: null },
        // Mirrors hemma_mobile_header.yaml's padding formula.
        styles:    { card: [{ padding: `24px var(--hemma-rail-left, 11px) 10px calc(max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px)) + ${LANDSCAPE_GUTTER_CALC})` }] },
      }, frag, 0);
      this._appendEntityGrid(cards.map((c) => JSON.parse(JSON.stringify(c))), frag, 0);
      this._contentEl.insertBefore(frag, this._contentEl.firstChild);
      if (this._hass) {
        for (const el of this._cardEls) { try { el.hass = this._hass; } catch (_) {} }
      }
    }

    _sortSectionGrids() {
      if (!this._hass?.states || !this._contentEl) return;
      const ACTIVE = activeStates();
      for (const wrap of Array.from(this._contentEl.children)) {
        const grid = wrap._hemmaGrid;
        if (!grid) continue;
        const items = Array.from(grid.children).map(card => {
          const bc = card.tagName?.toLowerCase() === 'button-card' ? card
            : card.querySelector?.('button-card');
          let active = null;
          const ha = bc?.shadowRoot?.querySelector('ha-card');
          if (ha) {
            let v = ha.style.getPropertyValue('--hemma-active-overlay-opacity').trim();
            if (!v) { try { v = getComputedStyle(ha).getPropertyValue('--hemma-active-overlay-opacity').trim(); } catch (_) {} }
            if (v) active = v === '1';
          }
          if (active === null) {
            const entityId = bc?._config?.entity;
            const state = entityId ? this._hass.states[entityId]?.state : null;
            active = state != null && ACTIVE.has(state.toLowerCase());
          }
          return { card, active };
        });
        // Sort active cards first, maintaining relative order within each group.
        const active   = items.filter(x => x.active);
        const inactive = items.filter(x => !x.active);
        [...active, ...inactive].forEach(({ card }, idx) => { card.style.order = idx; });
      }
    }

    _dismiss() {
      if (!this._hass || !this._showing) return;
      this._showing = false;
      if (_activeOverlay === this) _activeOverlay = null;

      const blurEl    = this._blurLayerEl;
      const overlayEl = this._overlayEl;
      if (!blurEl || !overlayEl) return;

      // ── Phase 1: cleanup and overlay slide ──────────────────────────────────
      this._suppressedWrappers = [];
      this._hiddenSmartRows    = [];
      for (const hsr of (window._hemmaSmartRows || [])) {
        const sr = hsr.shadowRoot;
        if (sr) {
          for (const wrapper of sr.querySelectorAll('.card-wrapper')) {
            // Category popups adopt the badge row, so exempt it there. Room
            // popups don't, so it's suppressed like any other wrapper.
            if (wrapper === this._badgeRowWrapper && !this._config?.room) continue;
            if (this._headerEl && wrapper.contains(this._headerEl)) continue;
            wrapper.style.setProperty('--hemma-anim-name',     'none');
            wrapper.style.setProperty('--hemma-anim-duration', '0.001s');
            wrapper.style.setProperty('--hemma-anim-delay',    '-1s');
            wrapper.style.setProperty('opacity', '0', 'important');
            // opacity:0 elements still hit-test, and an invisible wrapper above
            // the overlay would swallow touches meant for it.
            wrapper.style.setProperty('pointer-events', 'none', 'important');
            this._suppressedWrappers.push(wrapper);
          }
        }
      }

      if (this._container) {
        this._container.style.setProperty('--hemma-anim-name', 'none');
        this._container.style.setProperty('--hemma-anim-duration', '0.001s');
        this._container.style.setProperty('--hemma-anim-delay', '-1s');
      }

      if (this._contentEl) this._contentEl.style.visibility = 'hidden';
      if (this._scrollHandler) {
        this._overlayEl?.removeEventListener('scroll', this._scrollHandler);
        this._scrollHandler = null;
      }
      if (this._titleEl) { this._titleEl.remove(); this._titleEl = null; }
      this._backBtn?.remove();
      this._backBtn = null;
      // Scroll-header teardown: drop the compact title and return the badge row
      // to its dashboard slot, at the same viewport position it left.
      if (this._compactHeaderEl) { this._compactHeaderEl.remove(); this._compactHeaderEl = null; }
      if (this._gradientBlurEl)  { this._gradientBlurEl.remove();  this._gradientBlurEl  = null; }
      // The badge row is restored instantly, never animated, so it reads as a
      // fixed anchor while everything else springs in around it.
      if (_movedBadgeRow && _movedBadgeRow.owner === this) _restoreBadgeRow();
      // Idempotent — a filter-to-filter switch forces this from the next
      // overlay's _animIn too.
      const npWasMoved = !!this._npSaved;
      this._restoreMovedWrappers();
      if (npWasMoved && this._npWrapper) {
        this._npWrapper.style.setProperty('position', 'relative', 'important');
        this._npWrapper.style.setProperty('z-index', '51', 'important');
      }
      // Capture before nulling: _runBlurFade needs it to un-hide the header as
      // the zoom-fade starts, while its wrapper is still transparent.
      const headerEl      = this._headerEl;
      this._headerEl      = null;
      const headerWrapper = this._headerWrapper;
      this._headerWrapper = null;
      for (const bc of this._badgeShadowCards) {
        bc.style.removeProperty('box-shadow');
        bc.style.removeProperty('background');
        bc.style.removeProperty('backdrop-filter');
        bc.style.removeProperty('-webkit-backdrop-filter');
      }
      this._badgeShadowCards = [];
      if (this._badgeRowEl) {
        this._badgeRowEl.style.removeProperty('background');
        this._badgeRowEl.style.removeProperty('backdrop-filter');
        this._badgeRowEl.style.removeProperty('-webkit-backdrop-filter');
        this._badgeRowEl.style.removeProperty('box-shadow');
        // Above the blur, so the badge stays visible through the fade. The rest
        // of the cleanup is deferred to _runBlurFade.
        this._badgeRowEl.style.setProperty('z-index', '51', 'important');
      }
      const badgeRowEl = this._badgeRowEl;
      this._badgeRowEl = this._badgeRowWrapper = null;

      const scalableEls = this._scalableEls;
      this._scalableEls = [];

      overlayEl.style.overflow   = '';
      overlayEl.style.pointerEvents = 'none';
      overlayEl.style.clipPath   = 'inset(0%)';
      overlayEl.style.transition = `opacity 0.22s ${EASE_OUT}, transform 0.30s ${EASE_OUT}, clip-path 0.32s ${EASE_OUT}`;
      overlayEl.style.opacity    = '0';
      overlayEl.style.transform  = 'translateY(40%)';
      overlayEl.style.clipPath   = 'inset(6% round 22px)';

      this._pendingBlurFade = { blurEl, overlayEl, scalableEls, headerEl, badgeRowEl, headerWrapper,
        npWrappers: npWasMoved ? [this._npWrapper] : [] };

      // Call the service first, so its round trip overlaps the blur fade.
      window._hemmaNoFilterAnim = true;
      try {
        this._hass.callService('input_select', 'select_option', {
          entity_id: 'input_select.hemma_mobile_filter',
          option: 'all',
        });
      } catch (_) {}

      this._runBlurFade();
    }

    _runBlurFade() {
      const args = this._pendingBlurFade;
      if (!args) return;
      this._pendingBlurFade = null;
      if (this._showing) return;

      const { blurEl, overlayEl, scalableEls = [], headerEl, badgeRowEl, headerWrapper,
        npWrappers = [] } = args;
      const scalableSet   = new Set(scalableEls);
      // Now Playing wrappers held above the blur are already at their final
      // position, so they must skip the reveal's snap and spring.
      const npHoldSet     = new Set(npWrappers.filter(Boolean));
      const animContainer = this._container; // capture before cleanup nulls it
      const outerHost     = animContainer ? animContainer.host : null;

      const restoreDisplaySet = new Set();
      for (let i = 0; i < scalableEls.length; i++) {
        const el = scalableEls[i];
        if (el.querySelector?.('hemma-smart-row')) {
          restoreDisplaySet.add(el);
          if (i > 0) restoreDisplaySet.add(scalableEls[i - 1]); // its section header
        }
      }

      const zoomHeaderSet = new Set();
      for (const el of scalableEls) {
        if (el === headerWrapper) continue;
        const t = el.querySelector?.('button-card')?._config?.template;
        const isHdr = (n) => t === n || (Array.isArray(t) && t.includes(n));
        if (isHdr('hemma_mobile_header')) {
          zoomHeaderSet.add(el);
        }
      }

      if (!_activeOverlay) {
      for (const wrapper of (this._suppressedWrappers || [])) {
        if (!scalableSet.has(wrapper)) {
          wrapper.style.removeProperty('opacity');
          wrapper.style.removeProperty('pointer-events');
          const isInOuter = wrapper.getRootNode() === animContainer;
          if (!isInOuter && wrapper.style.display === 'none') wrapper.style.display = '';
        }
      }

      for (const hsr of (window._hemmaSmartRows || [])) {
        if (hsr.style.display === 'none') hsr.style.display = '';
        hsr.style.removeProperty('opacity');
        hsr.style.removeProperty('pointer-events');
        const sr = hsr.shadowRoot;
        if (!sr) continue;
        const isOuter = hsr === outerHost;
        for (const w of sr.querySelectorAll('.card-wrapper')) {
          if (!scalableSet.has(w)) {
            w.style.removeProperty('opacity');
            w.style.removeProperty('pointer-events');
            if (!isOuter && w.style.display === 'none') w.style.display = '';
          }
        }
      }

      const snapRows = this._hiddenSmartRows;
      this._hiddenSmartRows = [];
      for (const hsr of snapRows) {
        hsr.style.removeProperty('opacity');
        hsr.style.removeProperty('pointer-events');
        hsr.style.removeProperty('transition');
        if (hsr.style.display === 'none') hsr.style.display = '';
      }

      // ── Reveal: snap all wrappers visible, animate only the blur layer ─────────
      if (headerEl) headerEl.style.removeProperty('visibility');
      for (const el of scalableEls) {
        if (el === headerWrapper) continue;   // animated separately with zoom
        if (npHoldSet.has(el))    continue;   // held visible, no reveal motion
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
        el.style.transition = 'none';
        if (zoomHeaderSet.has(el)) {
          // Start low and zoomed out; springs back in the double-rAF below.
          // Must be set before the observer attaches so it isn't reverted.
          el.style.opacity         = '0';
          el.style.transformOrigin = '50% 30%';
          el.style.transform       = 'scale(0.93) translateY(20px)';
        } else {
          el.style.opacity         = '1';
          el.style.transformOrigin = '50% 30%';
          el.style.transform       = 'scale(0.93) translateY(20px)';
        }
        if (el.style.display === 'none' && restoreDisplaySet.has(el)) el.style.display = '';
      }

      const mo = new MutationObserver((mutations) => {
        if (this._showing || _activeOverlay) { mo.disconnect(); return; }
        for (const mut of mutations) {
          const t = mut.target;
          if (t.style.display === 'none') t.style.display = '';
          // Leave !important alone — that's our own suppression stamp.
          if (t.style.opacity === '0' && !t.style.getPropertyPriority('opacity')) {
            t.style.removeProperty('opacity');
            t.style.removeProperty('pointer-events');
          }
          // showWrapper sets height:0 and animates up; snap to auto so the
          // grow isn't visible.
          if (t.style.height === '0px' || t.style.height === '0') {
            t.style.transition = 'none';
            t.style.removeProperty('height');
            t.style.removeProperty('overflow');
          }
        }
      });
      for (const hsr of (window._hemmaSmartRows || [])) {
        mo.observe(hsr, { attributes: true, attributeFilter: ['style'] });
        const sr = hsr.shadowRoot;
        if (sr) for (const w of sr.querySelectorAll('.card-wrapper')) {
          mo.observe(w, { attributes: true, attributeFilter: ['style'] });
        }
      }
      setTimeout(() => mo.disconnect(), 560);
      } // end dashboard-reveal block

      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (this._showing) return;
        blurEl.style.transition = `opacity 0.50s ${EASE_OUT}`;
        blurEl.style.opacity    = '0';
        // Springs only when actually revealing the dashboard — not when another
        // overlay took the stage (its blur is fading IN over all of this).
        if (_activeOverlay) return;
        // Header springs in from a zoomed-out/below position.
        if (headerWrapper) {
          headerWrapper.style.transition = `transform 0.62s ${SPRING_IN}, opacity 0.50s ${EASE_OUT}`;
          headerWrapper.style.transform  = 'scale(1) translateY(0px)';
          headerWrapper.style.opacity    = '1';
        }
        // Section header text springs in with the same depth motion.
        for (const el of zoomHeaderSet) {
          el.style.transition = `transform 0.62s ${SPRING_IN}, opacity 0.50s ${EASE_OUT}`;
          el.style.transform  = 'scale(1) translateY(0px)';
          el.style.opacity    = '1';
        }
        // Entity rows spring too — transform only, opacity untouched.
        for (const el of scalableEls) {
          if (el === headerWrapper || zoomHeaderSet.has(el)) continue;
          if (npHoldSet.has(el)) continue; // NP: held visible, no spring
          el.style.transition = `transform 0.62s ${SPRING_IN}`;
          el.style.transform  = 'scale(1) translateY(0px)';
        }
      }));

      const sweepReHidden = () => {
        if (this._showing || _activeOverlay) return;
        for (const hsr of (window._hemmaSmartRows || [])) {
          if (hsr.style.display === 'none') hsr.style.display = '';
          hsr.style.removeProperty('opacity');
          hsr.style.removeProperty('pointer-events');
          const sr = hsr.shadowRoot;
          if (!sr) continue;
          const isOuter = hsr === outerHost;
          for (const w of sr.querySelectorAll('.card-wrapper')) {
            if (!scalableSet.has(w)) {
              w.style.removeProperty('opacity');
              w.style.removeProperty('pointer-events');
              if (!isOuter) {
                w.style.removeProperty('height');
                w.style.removeProperty('overflow');
                w.style.removeProperty('transition');
                if (w.style.display === 'none') w.style.display = '';
              }
            } else if (w.style.display === 'none' && restoreDisplaySet.has(w)) {
              w.style.display = '';
            }
          }
        }
      };
      for (const delay of [250, 400, 750]) setTimeout(sweepReHidden, delay);

      // Cleanup, just after the 500ms blur fade finishes.
      setTimeout(() => {
        if (this._showing) return;
        blurEl.style.display    = 'none';
        blurEl.style.transition = 'none';
        blurEl.style.opacity    = '1';
        overlayEl.style.display    = 'none';
        overlayEl.style.transition = 'none';
        overlayEl.style.transform  = 'translateY(100%)';
        overlayEl.style.clipPath   = '';
        overlayEl.style.opacity    = '1';
        overlayEl.style.overflow   = '';
        // Skip if another overlay opened meanwhile — it has already applied its
        // own positioning to this same shared badge row.
        if (badgeRowEl && !_activeOverlay) {
          badgeRowEl.style.removeProperty('z-index');
          badgeRowEl.style.removeProperty('position');
          badgeRowEl.style.removeProperty('top');
          badgeRowEl.style.removeProperty('left');
          badgeRowEl.style.removeProperty('right');
          badgeRowEl.style.removeProperty('width');
          badgeRowEl.style.removeProperty('transform');
          badgeRowEl.style.removeProperty('transition');
        }
        // A room popup can dismiss with the page still scrolled, and update()
        // would otherwise wait for the next scroll event to redraw the bar.
        if (!_activeOverlay) { try { _dashHeader?.update(); } catch (_) {} }
        for (const w of npWrappers) {
          if (!w) continue;
          w.style.removeProperty('z-index');
          w.style.removeProperty('position');
        }
        for (const w of Array.from(this._contentEl?.children || [])) {
          if (w._animIndex !== undefined) {
            w.style.transition = 'none';
            w.style.transform  = '';
            w.style.opacity    = '0';
          }
        }
        if (this._contentEl) {
          this._contentEl.style.visibility = '';
          this._contentEl.style.paddingTop = '';
        }
        this._container = this._selfWrapper = null;
        _dashHeader?.update();
      }, 560);

      setTimeout(() => {
        if (this._showing) return;
        for (const el of scalableEls) {
          el.style.removeProperty('transition');
          el.style.removeProperty('opacity');
          el.style.removeProperty('pointer-events');
          el.style.removeProperty('transform');
          el.style.removeProperty('transform-origin');
        }
        if (headerWrapper) {
          headerWrapper.style.removeProperty('transform');
          headerWrapper.style.removeProperty('transform-origin');
          headerWrapper.style.removeProperty('transition');
          headerWrapper.style.removeProperty('opacity');
          headerWrapper.style.removeProperty('pointer-events');
        }
      }, 700);

      setTimeout(() => {
        if (this._showing || _activeOverlay) return;
        window._hemmaNoFilterAnim = false;
        if (animContainer) {
          animContainer.style.removeProperty('--hemma-anim-name');
          animContainer.style.removeProperty('--hemma-anim-duration');
          animContainer.style.removeProperty('--hemma-anim-delay');
        }
      }, 4000);
    }

    _copyThemeVars(source) {
      if (!source || !this._overlayEl) return;
      try {
        const cs = window.getComputedStyle(source);
        for (const v of HEMMA_VARS) {
          const val = cs.getPropertyValue(v)?.trim();
          if (val) this._overlayEl.style.setProperty(v, val);
        }
        // The blur layer already does this; a second blur on the cards
        // themselves renders them solid and dark.
        this._overlayEl.style.setProperty('--ha-card-backdrop-filter', 'none');
      } catch (_) {}
    }

    _getBC(el) {
      if (!el) return null;
      if (el.tagName?.toLowerCase() === 'button-card') return el;
      return el.querySelector?.('button-card') || null;
    }

    _findContainerAndSelf() {
      let el = this;
      while (el.parentElement) {
        const parent = el.parentElement;
        for (const sib of parent.children) {
          if (sib === el) continue;
          if (this._getBC(sib)) return { container: parent, self: el };
        }
        el = parent;
      }
      return null;
    }

    _discoverElements() {
      this._container = this._selfWrapper = this._badgeRowEl = this._badgeRowWrapper =
        this._headerEl = this._subBadgesEl = this._subBadgesWrapper = null;

      const found = this._findContainerAndSelf();
      if (!found) return;

      const { container, self } = found;
      this._container   = container;
      this._selfWrapper = self;

      const kids    = Array.from(container.children);
      const selfIdx = kids.indexOf(self);

      for (let i = selfIdx - 1; i >= 0; i--) {
        const bc = this._getBC(kids[i]);
        if (!bc) continue;
        try {
          const pos = window.getComputedStyle(bc).position;
          if (pos === 'sticky' || pos === '-webkit-sticky') {
            this._badgeRowEl = bc; this._badgeRowWrapper = kids[i]; break;
          }
        } catch (_) {}
      }

      if (this._badgeRowWrapper) {
        const brIdx = kids.indexOf(this._badgeRowWrapper);
        for (let i = 0; i < brIdx; i++) {
          const bc = this._getBC(kids[i]);
          if (bc) this._headerEl = bc;
        }
      }

      for (let i = selfIdx + 1; i < kids.length; i++) {
        const bc = this._getBC(kids[i]);
        if (bc) { this._subBadgesEl = bc; this._subBadgesWrapper = kids[i]; break; }
      }

      // Now Playing sits right after the sub-badges row, and is moved into the
      // media popup so the popup shows the dashboard's real element.
      this._npWrapper = null;
      if (this._subBadgesWrapper) {
        const sbIdx = kids.indexOf(this._subBadgesWrapper);
        for (let i = sbIdx + 1; i < kids.length; i++) {
          const bc = this._getBC(kids[i]);
          const t  = bc?._config?.template;
          const has = (name) => t === name || (Array.isArray(t) && t.includes(name));
          if (has('hemma_mobile_now_playing')) { this._npWrapper = kids[i]; break; }
          if (has('hemma_mobile_header')) break; // reached Favorites/rooms
        }
      }

      if (this._selfWrapper && !this._selfWrapper._hemmaOutOfFlow) {
        this._selfWrapper._hemmaOutOfFlow = true;
        this._selfWrapper.style.setProperty('position', 'absolute', 'important');
        this._selfWrapper.style.setProperty('width',    '0', 'important');
        this._selfWrapper.style.setProperty('height',   '0', 'important');
        this._selfWrapper.style.setProperty('overflow', 'hidden', 'important');
        this._selfWrapper.style.setProperty('margin',   '0', 'important');
      }
    }

    _restoreMovedWrappers() {
      // Now Playing first: the sub-badges' saved sibling is its wrapper.
      if (this._npSaved) {
        const { parent, sibling } = this._npSaved;
        this._npSaved = null;
        const w = this._npWrapper;
        if (w) {
          w.style.removeProperty('width');
          w.style.removeProperty('margin-top');
          if (parent) {
            if (sibling && sibling.parentNode === parent) parent.insertBefore(w, sibling);
            else parent.appendChild(w);
          }
          w.style.removeProperty('opacity');
          w.style.removeProperty('pointer-events');
          const bc = this._getBC(w);
          if (bc && this._hass) { try { bc.hass = this._hass; } catch (_) {} }
        }
      }
      this._npSpacer?.remove();
      this._npSpacer = null;
      if (this._subBadgesWrapper) {
        // Restore the dashboard's phantom-gap suppression (see _animIn).
        this._subBadgesWrapper.setAttribute('data-collapsed-spacer', '1');
        this._subBadgesWrapper.style.removeProperty('display');
        this._subBadgesWrapper.style.removeProperty('width');
        this._subBadgesWrapper.style.removeProperty('margin-top');
        this._subBadgesWrapper.style.removeProperty('--badge-background');
        this._subBadgesWrapper.style.removeProperty('--badge-blur');
        this._subBadgesWrapper.style.removeProperty('padding-left');
        if (this._subBadgesSavedParent) {
          const sib = this._subBadgesSavedSibling;
          if (sib && sib.parentNode === this._subBadgesSavedParent) {
            this._subBadgesSavedParent.insertBefore(this._subBadgesWrapper, sib);
          } else {
            this._subBadgesSavedParent.appendChild(this._subBadgesWrapper);
          }
          // Same reconnect poke as above, or the chips card keeps rendering its
          // popup state on the dashboard until the next hass update.
          const bc = this._getBC(this._subBadgesWrapper);
          if (bc && this._hass) { try { bc.hass = this._hass; } catch (_) {} }
        }
      }
      this._subBadgesEl = this._subBadgesWrapper = null;
      this._subBadgesSavedParent = this._subBadgesSavedSibling = null;
    }

    // Shadow DOM section/entity wrappers — scaled during open for depth effect
    _findScalableEls() {
      if (!this._container) return [];
      const kids  = Array.from(this._container.children);
      const pivot = this._subBadgesWrapper || this._selfWrapper;
      if (!pivot) return [];
      const idx = kids.indexOf(pivot);
      return idx >= 0 ? kids.slice(idx + 1) : [];
    }

    // ── Animate In ─────────────────────────────────────────────────────────────

    _animIn() {
      const blurEl    = this._blurLayerEl;
      const overlayEl = this._overlayEl;
      if (!blurEl || !overlayEl) return;

      const prevOverlay = _activeOverlay;
      _activeOverlay = this;
      _dashHeader?.hide();
      _restoreBadgeRow();
      if (prevOverlay && prevOverlay !== this) prevOverlay._restoreMovedWrappers();
      this._restoreMovedWrappers();
      this._discoverElements();
      this._copyThemeVars(this._headerEl || this._badgeRowEl || null);

      // Clear animation suppression left by the previous dismiss.
      for (const wrapper of (this._suppressedWrappers || [])) {
        wrapper.style.removeProperty('--hemma-anim-name');
        wrapper.style.removeProperty('--hemma-anim-duration');
        wrapper.style.removeProperty('--hemma-anim-delay');
      }
      this._suppressedWrappers = [];
      for (const hsr of (this._hiddenSmartRows || [])) {
        hsr.style.removeProperty('opacity');
        hsr.style.removeProperty('pointer-events');
        hsr.style.removeProperty('transition');
      }
      this._hiddenSmartRows = [];

      const headerWrapper = this._headerEl && this._container
        ? Array.from(this._container.children).find(k => k.contains(this._headerEl))
        : null;
      this._scalableEls   = [
        ...(headerWrapper ? [headerWrapper] : []),
        ...this._findScalableEls(),
      ];
      for (const w of this._scalableEls) {
        w.style.removeProperty('transition');
        w.style.removeProperty('transform');
        w.style.removeProperty('transform-origin');
      }
      headerWrapper?.style.removeProperty('opacity');
      headerWrapper?.style.removeProperty('pointer-events');
      this._headerWrapper = headerWrapper;

      window._hemmaNoFilterAnim = true;
      for (const hsr of (window._hemmaSmartRows || [])) {
        const sr = hsr.shadowRoot;
        if (sr) {
          for (const wrapper of sr.querySelectorAll('.card-wrapper')) {
            if (wrapper === this._badgeRowWrapper && !this._config?.room) continue;
            if (this._headerEl && wrapper.contains(this._headerEl)) continue;
            if (this._subBadgesWrapper && wrapper === this._subBadgesWrapper) continue;
            if (this._config?.filter_category === 'media' &&
                wrapper === this._npWrapper) continue;
            wrapper.style.setProperty('--hemma-anim-name',     'none');
            wrapper.style.setProperty('--hemma-anim-duration', '0.001s');
            wrapper.style.setProperty('--hemma-anim-delay',    '-1s');
            wrapper.style.setProperty('opacity', '0', 'important');
            // opacity:0 elements still hit-test, and an invisible wrapper above
            // the overlay would swallow touches meant for it.
            wrapper.style.setProperty('pointer-events', 'none', 'important');
            this._suppressedWrappers.push(wrapper);
          }
        }
      }
      if (this._container) {
        this._container.style.setProperty('--hemma-anim-name',     'none');
        this._container.style.setProperty('--hemma-anim-duration', '0.001s');
        this._container.style.setProperty('--hemma-anim-delay',    '-1s');
      }

      const TITLE_FONT_PX = 34;
      const TITLE_PAD_BOT = 12;

      const npRect0 = (this._config?.filter_category === 'media' && this._npWrapper)
        ? this._npWrapper.getBoundingClientRect() : null;
      const npNaturalTop = (npRect0 && npRect0.height > 4) ? npRect0.top : null;
      this._npNaturalTop = npNaturalTop; // engage() re-verifies at settle time

      const nameSrcEl  = this._headerEl?.shadowRoot?.querySelector('#name');
      const nameRect   = nameSrcEl?.getBoundingClientRect();

      const filterState = this._hass?.states?.['input_select.hemma_mobile_filter']?.state;
      // Room popups use the room name; category popups capitalize the filter
      // value. 'presence' displays as People, so it needs an explicit entry.
      const CATEGORY_TITLES = { presence: 'People' };
      const titleText   = this._config?.room
        ? this._config.room
        : (!filterState || filterState === 'all' ? 'Home'
          : (CATEGORY_TITLES[filterState] || filterState.charAt(0).toUpperCase() + filterState.slice(1)));
      const titleEl = document.createElement('div');
      titleEl.style.cssText = [
        'display:block', 'width:100%', 'box-sizing:border-box',
        `padding-bottom:${TITLE_PAD_BOT}px`,
        `font-size:${TITLE_FONT_PX}px`, 'font-weight:700', 'color:#ffffff',
        'letter-spacing:-0.5px', 'pointer-events:none',
        'transform-origin:left center',
      ].join(';');
      titleEl.style.setProperty('margin-top',
        `calc(env(safe-area-inset-top, 0px) + 52px + calc(12px * var(${LANDSCAPE_PHONE_VAR}, 0)))`);
      titleEl.style.setProperty('padding-left',
        `calc(max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px)) + ${LANDSCAPE_GUTTER_CALC})`);
      // Copy the dashboard title's text metrics so the margin-top above lands
      // the glyphs at exactly the same y.
      if (nameSrcEl && nameRect?.height) {
        const ncs = getComputedStyle(nameSrcEl);
        if (ncs.fontSize)      titleEl.style.fontSize      = ncs.fontSize;
        if (ncs.lineHeight)    titleEl.style.lineHeight    = ncs.lineHeight;
        if (ncs.letterSpacing) titleEl.style.letterSpacing = ncs.letterSpacing;
      }
      titleEl.textContent = titleText;
      this._titleEl = titleEl;

      this._backBtn?.remove();
      this._backBtn = null;
      {
        if (!overlayEl.querySelector('#hemma-back-glass-style')) {
          const st = document.createElement('style');
          st.id = 'hemma-back-glass-style';
          st.textContent =
            '.hemma-back-glass::before{content:"";position:absolute;inset:0;' +
            'border-radius:50%;padding:1.4px;' +
            // Subtle: the rim should melt into the background, not glint.
            'background:conic-gradient(from 0deg,' +
            'rgba(255,255,255,0.55) 0deg,rgba(255,255,255,0.12) 55deg,' +
            'rgba(255,255,255,0.02) 90deg,rgba(255,255,255,0.12) 130deg,' +
            'rgba(255,255,255,0.30) 175deg 185deg,rgba(255,255,255,0.12) 230deg,' +
            'rgba(255,255,255,0.02) 270deg,rgba(255,255,255,0.12) 305deg,' +
            'rgba(255,255,255,0.55) 360deg);' +
            '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);' +
            '-webkit-mask-composite:xor;' +
            'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);' +
            'mask-composite:exclude;pointer-events:none;}' +
            // Side wraps: a crisp dark hairline, not a soft band.
            '.hemma-back-glass::after{content:"";position:absolute;inset:-1px;' +
            'border-radius:50%;padding:1px;' +
            'background:conic-gradient(from 0deg,' +
            'transparent 0deg 50deg,rgba(0,0,0,0.32) 80deg 100deg,' +
            'transparent 130deg 230deg,rgba(0,0,0,0.32) 260deg 280deg,' +
            'transparent 310deg 360deg);' +
            '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);' +
            '-webkit-mask-composite:xor;' +
            'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);' +
            'mask-composite:exclude;pointer-events:none;}' +
            '.hemma-back-glass:active{transform:scale(0.94);}' +
            '.hemma-back-glass{transition:transform 0.15s ease;}';
          overlayEl.appendChild(st);
        }
        const back = document.createElement('div');
        back.className = 'hemma-back-glass';
        back.style.cssText = [
          'position:fixed',
          `left:calc(max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px)) + ${LANDSCAPE_GUTTER_CALC})`,
          `top:calc(env(safe-area-inset-top, 0px) + 4px + calc(12px * var(${LANDSCAPE_PHONE_VAR}, 0)))`,
          'width:40px', 'height:40px', 'border-radius:50%',
          'display:flex', 'align-items:center', 'justify-content:center',
          // Transparent fill with a convex sheen lit from above. No drop
          // shadow — the rim and outer wraps do the grounding.
          'background-image:radial-gradient(140% 90% at 50% -20%,' +
            'rgba(255,255,255,0.14), rgba(255,255,255,0.04) 45%, transparent 62%)',
          'background-color:rgba(255,255,255,0.07)',
          // Deliberately low: a heavier blur smears the title scrolling
          // beneath into washes that make the whole disc flicker.
          'backdrop-filter:blur(10px) saturate(1.2)',
          '-webkit-backdrop-filter:blur(10px) saturate(1.2)',
          'cursor:pointer', 'z-index:61',
        ].join(';');
        back.innerHTML =
          '<svg width="14" height="24" viewBox="0 0 14 24" fill="none" style="margin-right:2px">' +
          '<path d="M12 2.5 L2.8 12 L12 21.5" stroke="#fff" stroke-width="3" ' +
          'stroke-linecap="round" stroke-linejoin="round"/></svg>';
        back.addEventListener('click', (e) => { e.stopPropagation(); this._dismiss(); });
        this._backBtn = back;
      }

      this._compactHeaderEl?.remove();
      const compactEl = document.createElement('div');
      compactEl.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:60',
        `height:${COMPACT_BAR_HEIGHT}px`,
        'padding-top:env(safe-area-inset-top, 0px)',
        'box-sizing:content-box',
        'display:flex', 'align-items:center', 'justify-content:center',
        'font-size:17px', 'font-weight:600', 'color:#ffffff', 'letter-spacing:-0.2px',
        'opacity:0', 'transform:translateY(5px)', 'pointer-events:none',
      ].join(';');
      compactEl.textContent = titleText;
      // Tapping it scrolls back to the top; the scroll handler toggles
      // pointer-events so it's only tappable while visible.
      compactEl.addEventListener('click', () => {
        this._overlayEl?.scrollTo({ top: 0, behavior: 'smooth' });
      });
      (this._appendTarget || document.body).appendChild(compactEl);
      this._compactHeaderEl = compactEl;


      // Hide the original header so the overlay title doesn't double up.
      if (this._headerEl) {
        this._headerEl.style.setProperty('visibility', 'hidden', 'important');
      }

      // Chips render as bare text in the popup. Set the chrome vars now, before
      // anything is visible, or the pill backgrounds flash first.
      if (this._subBadgesWrapper) {
        this._subBadgesWrapper.style.setProperty('--badge-background', 'transparent');
        this._subBadgesWrapper.style.setProperty('--badge-blur', '0px');
      }

      // Auto sections first (rooms), then Favorites prepends itself in front.
      this._ensureAutoSections();
      this._ensureFavoritesPopupSection();

      // Active cards first, before anything becomes visible.
      this._sortSectionGrids();

      requestAnimationFrame(() => {
        if (!this._showing) return;

        overlayEl.style.transform = 'translateY(0)';
        overlayEl.style.display   = 'block';
        // The exit set pointer-events:none so the fading overlay couldn't
        // swallow gestures meant for what replaced it.
        overlayEl.style.pointerEvents = '';

        this._badgeShadowCards = [];
        const _tryBadgeShadows = (attempt) => {
          if (!this._showing) return;
          const badgeSR = this._badgeRowEl?.shadowRoot;
          if (!badgeSR) return;
          const badges = Array.from(badgeSR.querySelectorAll('button-card'));
          if (badges.length === 0 && attempt < 8) {
            setTimeout(() => _tryBadgeShadows(attempt + 1), 80);
            return;
          }
          this._badgeShadowCards = [];
          for (const badge of badges) {
            const bCard = badge.shadowRoot?.querySelector('ha-card');
            if (!bCard) continue;
            const bg  = getComputedStyle(bCard).backgroundColor;
            const m   = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            const lum = m ? (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255 : 0;
            bCard.style.setProperty('box-shadow',
              lum > 0.45
                ? '0 6px 20px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.28)'
                : '0 0 22px 4px rgba(255,255,255,0.4), 0 0 8px 1px rgba(255,255,255,0.2)',
              'important');
            if (lum <= 0.45) bCard.style.setProperty('background', BADGE_INACTIVE_BG, 'important');
            this._badgeShadowCards.push(bCard);
          }
        };
        _tryBadgeShadows(0);

        const useSubBadges = this._subBadgesWrapper
          && this._config?.filter_category !== 'presence';
        if (useSubBadges) {
          this._subBadgesSavedParent  = this._subBadgesWrapper.parentNode;
          this._subBadgesSavedSibling = this._subBadgesWrapper.nextSibling;
          this._subBadgesWrapper.removeAttribute('data-collapsed-spacer');
          this._subBadgesWrapper.style.setProperty('display',    'block', 'important');
          // Sits below the pill row; room popups have none, so the chips tuck
          // up under the title instead.
          this._subBadgesWrapper.style.setProperty('width',      '100%', 'important');
          this._subBadgesWrapper.style.setProperty('margin-top',
            this._config?.room ? '6px' : '16px', 'important');
          this._subBadgesWrapper.style.setProperty('padding-left', LANDSCAPE_GUTTER_CALC, 'important');
        }

        this._contentEl.style.visibility = '';
        this._contentEl.style.paddingTop = '0';
        if (useSubBadges) {
          this._contentEl.insertBefore(this._subBadgesWrapper, this._contentEl.firstChild);
        }
        this._contentEl.insertBefore(this._titleEl, this._contentEl.firstChild);
        if (this._backBtn) overlayEl.appendChild(this._backBtn);
        this._gapSpacer?.remove();
        this._gapSpacer = null;
        if (_movedBadgeRow && _movedBadgeRow.owner !== this) {
          _restoreBadgeRow();
        }
        const noBadge = !!this._config?.room;
        if (!noBadge && this._badgeRowWrapper && this._badgeRowEl &&
            this._compactHeaderEl && !_movedBadgeRow) {
          const badgeW  = this._badgeRowWrapper;
          const badgeEl = this._badgeRowEl;
          const hdrRect = this._compactHeaderEl.getBoundingClientRect();
          const lockTop = hdrRect.bottom + BADGE_LOCK_GAP;
          const pillBf  = window.getComputedStyle(badgeEl)
            .getPropertyValue('--ha-card-backdrop-filter').trim();
          _movedBadgeRow = {
            owner: this, wrapper: badgeW, el: badgeEl,
            parent: badgeW.parentNode, sibling: badgeW.nextSibling,
          };
          badgeEl.style.removeProperty('transform');
          badgeEl.style.removeProperty('transition');
          badgeEl.style.setProperty('position', 'relative', 'important');
          badgeEl.style.setProperty('top',      '0',        'important');
          badgeEl.style.removeProperty('left');
          badgeEl.style.removeProperty('right');
          badgeEl.style.removeProperty('width');
          // A room popup before this one suppressed the wrapper like any other,
          // so clear its stamps or the pills arrive invisible.
          badgeW.style.removeProperty('opacity');
          badgeW.style.removeProperty('pointer-events');
          badgeW.style.setProperty('position',   'sticky',       'important');
          badgeW.style.setProperty('top',        `${lockTop}px`, 'important');
          badgeW.style.setProperty('z-index',    '30',           'important');
          // Lands the pills at the dashboard badge row's resting position.
          badgeW.style.setProperty('margin-top', '10px',         'important');
          badgeW.style.setProperty('padding-left', LANDSCAPE_GUTTER_CALC, 'important');
          if (pillBf) badgeW.style.setProperty('--ha-card-backdrop-filter', pillBf);
          const badgesScroller = badgeEl.shadowRoot?.querySelector('#badges');
          const badgesSL       = badgesScroller ? badgesScroller.scrollLeft : 0;
          this._contentEl.insertBefore(badgeW, this._titleEl.nextSibling);
          if (badgesScroller && badgesSL) badgesScroller.scrollLeft = badgesSL;
          if (!useSubBadges) {
            const sp = document.createElement('div');
            sp.style.cssText = 'height:24px;';
            this._contentEl.insertBefore(sp, badgeW.nextSibling);
            this._gapSpacer = sp;
          }
        } else if (!useSubBadges) {
          // No badge row, so the same gap without the pills.
          const sp = document.createElement('div');
          sp.style.cssText = 'height:24px;';
          this._contentEl.insertBefore(sp, this._titleEl.nextSibling);
          this._gapSpacer = sp;
        }

        const seamlessNp = this._config?.filter_category === 'media' && npNaturalTop != null;
        overlayEl.style.transition = 'none';
        overlayEl.style.transform  = 'translateY(0)';
        overlayEl.style.clipPath   = '';
        overlayEl.style.opacity    = seamlessNp ? '1' : '0';
        // Scrollable from the first frame. _dismiss clears overflow so the
        // clip-path is the only clip during the exit, so re-assert it here.
        overlayEl.style.overflowY = 'auto';
        overlayEl.style.overflowX = 'hidden';
        overlayEl.style.display   = 'block';
        overlayEl.scrollTop       = 0;

        if (this._config?.filter_category === 'media' && npNaturalTop != null &&
            this._npWrapper && this._subBadgesWrapper) {
          this._npSaved = {
            parent:  this._npWrapper.parentNode,
            sibling: this._npWrapper.nextSibling,
          };
          this._npWrapper.style.setProperty('width', '100%', 'important');
          this._contentEl.insertBefore(this._npWrapper, this._subBadgesWrapper.nextSibling);
          const shift = npNaturalTop - this._npWrapper.getBoundingClientRect().top;
          if (Math.abs(shift) > 0.1 && Math.abs(shift) <= 160) {
            this._npWrapper.style.setProperty('margin-top', `${shift.toFixed(2)}px`, 'important');
          }
          requestAnimationFrame(() => {
            if (!this._showing || this._npWrapper?.parentNode !== this._contentEl) return;
            const resid = npNaturalTop - this._npWrapper.getBoundingClientRect().top;
            if (Math.abs(resid) > 0.1 && Math.abs(resid) <= 12) {
              const cur = parseFloat(this._npWrapper.style.getPropertyValue('margin-top')) || 0;
              this._npWrapper.style.setProperty('margin-top', `${(cur + resid).toFixed(2)}px`, 'important');
            }
          });
        }

        for (const w of [this._subBadgesWrapper, this._npWrapper]) {
          if (!w) continue;
          if (w !== this._npWrapper || this._config?.filter_category === 'media') {
            w.style.removeProperty('opacity');
            w.style.removeProperty('pointer-events');
          }
          const bc = this._getBC(w);
          if (bc && this._hass) { try { bc.hass = this._hass; } catch (_) {} }
        }

        if (seamlessNp) {
          this._titleEl.style.opacity = '0';
          if (this._subBadgesWrapper) this._subBadgesWrapper.style.opacity = '0';
        }

        blurEl.style.transition    = 'none';
        const seamlessSwitch       = _otherBlurUp(blurEl);
        blurEl.style.opacity       = seamlessSwitch ? '1' : '0';
        blurEl.style.display       = 'block';
        if (seamlessSwitch) {
          blurEl.style.background = 'transparent';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            blurEl.style.background = 'rgba(0, 0, 0, 0.22)'; // matches creation
            if (!this._showing) return;
            for (const el of _blurLayers) {
              if (el === blurEl) continue;
              el.style.transition = 'none';
              el.style.opacity    = '0';
            }
          }));
        }
        // Entity sections start below the viewport, ready to slide up.
        const vhPx = window.innerHeight || 800;
        for (const w of Array.from(this._contentEl?.children || [])) {
          if (w._animIndex !== undefined) {
            w.style.transition = 'none';
            w.style.transform  = `translateY(${vhPx}px)`;
            w.style.opacity    = '1';
          }
        }

        // Blur fades in, overlay fades in, entity sections slide up.
        requestAnimationFrame(() => {
          if (!this._showing) return;

          blurEl.style.transition    = `opacity 0.30s ease`;
          blurEl.style.opacity       = '1';

          // The header recedes as the blur comes in; _runBlurFade springs it
          // back on dismiss.
          if (headerWrapper) {
            headerWrapper.style.transition      = `transform 0.42s ${EASE_OUT}, opacity 0.30s ${EASE_OUT}`;
            headerWrapper.style.transformOrigin = '50% 30%';
            headerWrapper.style.transform       = 'scale(0.93) translateY(20px)';
            headerWrapper.style.opacity         = '0';
            // Same trap as the suppressed wrappers: faded out, it still spans
            // the title area and would intercept touches there.
            headerWrapper.style.setProperty('pointer-events', 'none', 'important');
          }

          // Normally the overlay fades in and the title and chips come with it.
          // On a media entry it's already opaque, so those fade individually.
          if (seamlessNp) {
            for (const el of [this._titleEl, this._subBadgesWrapper]) {
              if (!el) continue;
              el.style.transition = 'opacity 0.20s ease';
              el.style.opacity    = '1';
            }
          } else {
            overlayEl.style.transition = `opacity 0.20s ease`;
            overlayEl.style.opacity    = '1';
          }

          // Each entity section slides up with a spring curve and slight stagger.
          let maxMs = 600;
          for (const w of Array.from(this._contentEl?.children || [])) {
            if (w._animIndex !== undefined) {
              const delayMs = (w._animIndex || 0) * 40;
              if (550 + delayMs > maxMs) maxMs = 550 + delayMs;
              w.style.transition = `transform 0.55s ${delayMs}ms ${SPRING_IN}`;
              w.style.transform  = 'translateY(0)';
            }
          }

          // Entry settled — engage the scroll-linked header.
          setTimeout(() => {
            if (this._showing && overlayEl) {
              overlayEl.style.transition = 'none';
              if (this._titleEl)          this._titleEl.style.transition = 'none';
              if (this._subBadgesWrapper) this._subBadgesWrapper.style.transition = 'none';
              for (const w of Array.from(this._contentEl?.children || [])) {
                if (w._animIndex !== undefined) {
                  w.style.transition = 'none';
                  w.style.removeProperty('transform');
                }
              }
              const tryEngage = () => {
                if (!this._showing) return;
                if (_touchActive) { setTimeout(tryEngage, 120); return; }
                this._engageScrollHeader();
              };
              tryEngage();
            }
          }, maxMs + 60);
        });
      });
    }

    // ── Scroll-header mode ─────────────────────────────────────────────────────
    _engageScrollHeader() {
      const overlayEl = this._overlayEl;
      const contentEl = this._contentEl;
      const badgeW    = this._badgeRowWrapper;
      const badgeEl   = this._badgeRowEl;
      const titleEl   = this._titleEl;
      const hdr       = this._compactHeaderEl;
      if (!this._showing || this._scrollHandler) return;
      if (_movedBadgeRow && _movedBadgeRow.owner !== this) return;
      // Room popups have no badge row, so their bar is title and back button
      // only and the badge elements aren't required.
      const noBadge = !!this._config?.room;
      if (!overlayEl || !contentEl || !titleEl || !hdr ||
          (!noBadge && (!badgeW || !badgeEl))) return;

      overlayEl.style.removeProperty('transform');

      const preMoved = !!(_movedBadgeRow && _movedBadgeRow.owner === this);

      const hdrRect = hdr.getBoundingClientRect();
      const lockTop = hdrRect.bottom + BADGE_LOCK_GAP;
      // The bar's bottom anchors to the pinned pill row, or to the compact
      // title in popups that have no pills.
      let badgeBottom = hdrRect.bottom - 4;

      if (!noBadge) {
        const card = badgeEl.shadowRoot?.querySelector('ha-card') || badgeEl;
        const cardRect0      = card.getBoundingClientRect();
        const badgeTopTarget = cardRect0.top;
        const cardH          = cardRect0.height;
        badgeBottom = lockTop + cardH;
        const sub = (this._subBadgesWrapper && this._subBadgesWrapper.parentNode === contentEl)
          ? this._subBadgesWrapper
          : (this._gapSpacer?.parentNode === contentEl ? this._gapSpacer : null);
        const subTopBefore = sub ? sub.getBoundingClientRect().top : null;
        const pillBf = window.getComputedStyle(badgeEl)
          .getPropertyValue('--ha-card-backdrop-filter').trim();

        if (!preMoved) {
          // Fallback for a discovery failure at rAF1: the same sticky adoption.
          _movedBadgeRow = {
            owner: this, wrapper: badgeW, el: badgeEl,
            parent: badgeW.parentNode, sibling: badgeW.nextSibling,
          };

          badgeEl.style.setProperty('position', 'relative', 'important');
          badgeEl.style.setProperty('top',      '0',        'important');
          badgeEl.style.removeProperty('left');
          badgeEl.style.removeProperty('right');
          badgeEl.style.removeProperty('width');
          // Clear a preceding room popup's stamps, as the rAF1 path does.
          badgeW.style.removeProperty('opacity');
          badgeW.style.removeProperty('pointer-events');
          badgeW.style.setProperty('position', 'sticky',       'important');
          badgeW.style.setProperty('top',      `${lockTop}px`, 'important');
          badgeW.style.setProperty('z-index',  '30',           'important');
          if (pillBf) badgeW.style.setProperty('--ha-card-backdrop-filter', pillBf);
          // DOM moves reset descendant scroll positions, and tapping a badge on
          // the right must not snap the row back to the left.
          const badgesScroller = badgeEl.shadowRoot?.querySelector('#badges');
          const badgesSL       = badgesScroller ? badgesScroller.scrollLeft : 0;
          contentEl.insertBefore(badgeW, titleEl.nextSibling);
          if (badgesScroller && badgesSL) badgesScroller.scrollLeft = badgesSL;

          const cardShift = badgeTopTarget - card.getBoundingClientRect().top;
          badgeW.style.setProperty('margin-top', `${cardShift.toFixed(2)}px`, 'important');
          if (sub && subTopBefore != null) {
            const subShift = subTopBefore - sub.getBoundingClientRect().top;
            const curMt    = parseFloat(sub.style.getPropertyValue('margin-top')) || 0;
            sub.style.setProperty('margin-top', `${(curMt + subShift).toFixed(2)}px`, 'important');
          }
        } else {
          // Pre-moved (common case): refresh the sticky lock in case the
          // compact bar measured differently at rAF1 (font/safe-area settling).
          badgeW.style.setProperty('top', `${lockTop}px`, 'important');
        }
      }

      this._gradientBlurEl?.remove();
      const gradH = badgeBottom + 100;
      const popupHard = (px, maxA = 1) => {
        const c = maxA >= 1 ? 'black' : `rgba(0,0,0,${maxA})`;
        return `linear-gradient(to bottom, ${c} 0px, ${c} ${px}px, transparent ${px}px)`;
      };
      const gradMask = popupHard(badgeBottom + 12);
      const gradWrap = document.createElement('div');
      gradWrap.style.cssText = 'position:sticky;top:0;height:0;z-index:25;pointer-events:none;';
      const grad = document.createElement('div');
      grad.style.cssText = [
        'position:absolute', 'top:0', 'left:0', 'right:0',
        `height:${gradH}px`, 'opacity:0',
        'transition:opacity 220ms ease-in-out',
        // Same material as the dashboard bar.
        'backdrop-filter:blur(22px) saturate(1.2) brightness(0.97)',
        '-webkit-backdrop-filter:blur(22px) saturate(1.2) brightness(0.97)',
        `mask-image:${gradMask}`, `-webkit-mask-image:${gradMask}`,
        'transform:translateZ(0)', '-webkit-transform:translateZ(0)',
      ].join(';');
      gradWrap.appendChild(grad);

      // Hairline and faint shadow at the bar's bottom, mirroring the dashboard
      // bar's edge treatment in _ensureDashboardHeader.
      const barEdge = document.createElement('div');
      barEdge.style.cssText = [
        'position:absolute', 'left:0', 'right:0',
        `top:${badgeBottom + 11}px`, 'height:11px', 'opacity:0',
        'transition:opacity 220ms ease-in-out',
        'background:linear-gradient(to bottom, rgba(18,20,26,0.025), rgba(18,20,26,0))',
        'border-top:0.5px solid rgba(255,255,255,0.10)',
        'box-sizing:border-box',
      ].join(';');

      let veil = null;
      try {
        let bgAfter = null;
        const bgInner = _findBgCard();
        if (bgInner) {
          const acs = getComputedStyle(bgInner, '::after');
          if (acs.backgroundImage && acs.backgroundImage.includes('url(')) bgAfter = acs;
        }
        const vh = window.innerHeight || 800;
        veil = document.createElement('div');
        // Hard-edged mask matching the blur bar, with mask and transform split
        // across two elements for the same reason as the dashboard veil.
        const veilMask = popupHard(badgeBottom + 12, 0.5);
        veil.style.cssText = [
          'position:absolute', 'top:0', 'left:0', 'right:0',
          `height:${vh}px`, 'opacity:0', 'overflow:hidden',
          'transition:opacity 220ms ease-in-out',
          `mask-image:${veilMask}`, `-webkit-mask-image:${veilMask}`,
        ].join(';');
        const veilInner = document.createElement('div');
        veilInner.style.cssText = [
          'position:absolute', 'top:0', 'left:0', 'right:0', 'bottom:0',
          'background-repeat:no-repeat',
          // The scale pushes the blur's transparent edge bleed off-screen.
          'filter:blur(44px) saturate(1.02)', 'transform:scale(1.12)',
        ].join(';');
        if (bgAfter) {
          // ::after already includes the hero tint layer; prepend the popup
          // blur layer's dark tint so the veil matches the popup backdrop.
          veilInner.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), ${bgAfter.backgroundImage}`;
          veilInner.style.backgroundPosition = `0 0, ${bgAfter.backgroundPosition}`;
          veilInner.style.backgroundSize     = `100% 100%, ${bgAfter.backgroundSize}`;
        } else {
          // Fall back to a plain dark veil so bright content still recedes
          // behind the pills.
          veilInner.style.backgroundImage = 'linear-gradient(rgba(24,28,38,0.92), rgba(24,28,38,0.92))';
        }
        veil.appendChild(veilInner);
        gradWrap.appendChild(veil);
      } catch (_) {}
      // Appended last so the edge line paints above the veil.
      gradWrap.appendChild(barEdge);

      contentEl.insertBefore(gradWrap, contentEl.firstChild);
      this._gradientBlurEl = gradWrap;

      const titleBottomDoc = titleEl.getBoundingClientRect().bottom + overlayEl.scrollTop;
      const fadeStart = Math.max(0, titleBottomDoc - lockTop - 24);
      const fadeEnd   = Math.max(fadeStart + 1,
        titleBottomDoc - (hdrRect.bottom - COMPACT_BAR_HEIGHT));
      let popupBarOn = false; // bar hysteresis state (per engage)
      this._scrollHandler = () => {
        const p = Math.max(0, Math.min(1,
          (overlayEl.scrollTop - fadeStart) / (fadeEnd - fadeStart)));
        const tp = Math.min(1, p / 0.45);
        titleEl.style.opacity   = String(1 - tp);
        titleEl.style.transform = `scale(${1 - tp * 0.04})`;
        const cp = Math.max(0, (p - 0.55) / 0.45);
        hdr.style.opacity     = String(cp);
        // Rises gently into place from below.
        hdr.style.transform   = `translateY(${(1 - cp) * 5}px)`;
        hdr.style.pointerEvents = cp > 0.5 ? 'auto' : 'none';
        popupBarOn = popupBarOn ? p >= 0.45 : p >= 0.55;
        grad.style.opacity    = popupBarOn ? '1' : '0';
        barEdge.style.opacity = popupBarOn ? '1' : '0';
        if (veil) veil.style.opacity = popupBarOn ? '1' : '0';
      };
      overlayEl.addEventListener('scroll', this._scrollHandler, { passive: true });
      this._scrollHandler();

      // Give the popup's sub-badge/Now Playing rows real scrollWidth.
      _fixRowWidths(contentEl);

      // Same re-dispatch as in _animIn, catching an update dropped by a late
      // reconnect.
      for (const w of [this._subBadgesWrapper, this._npWrapper]) {
        const bc = w && this._getBC(w);
        if (bc && this._hass) { try { bc.hass = this._hass; } catch (_) {} }
      }

      if (this._npNaturalTop != null && this._npWrapper?.parentNode === contentEl) {
        const fixNp = () => {
          if (!this._showing || overlayEl.scrollTop > 1) return;
          if (this._npWrapper?.parentNode !== contentEl) return;
          for (let i = 0; i < 2; i++) {
            const resid = this._npNaturalTop - this._npWrapper.getBoundingClientRect().top;
            if (Math.abs(resid) <= 0.1 || Math.abs(resid) > 12) break;
            const cur = parseFloat(this._npWrapper.style.getPropertyValue('margin-top')) || 0;
            this._npWrapper.style.setProperty('margin-top', `${(cur + resid).toFixed(2)}px`, 'important');
          }
        };
        fixNp();
        setTimeout(fixNp, 350);
      }
    }

    // ── Animate Out ────────────────────────────────────────────────────────────

    _animOut() {
      const blurEl    = this._blurLayerEl;
      const overlayEl = this._overlayEl;
      if (!blurEl || !overlayEl) return;
      if (_activeOverlay === this) _activeOverlay = null;

      this._suppressedWrappers = [];
      this._hiddenSmartRows    = [];
      window._hemmaNoFilterAnim = true;
      for (const hsr of (window._hemmaSmartRows || [])) {
        const sr = hsr.shadowRoot;
        if (sr) {
          for (const wrapper of sr.querySelectorAll('.card-wrapper')) {
            // Category popups adopt the badge row and keep it visible; room
            // popups suppress it like any other wrapper.
            if (wrapper === this._badgeRowWrapper && !this._config?.room) continue;
            if (this._headerEl && wrapper.contains(this._headerEl)) continue;
            wrapper.style.transition = 'none';
            wrapper.style.height     = '';
            wrapper.style.overflow   = '';
            wrapper.style.setProperty('--hemma-anim-name',     'none');
            wrapper.style.setProperty('--hemma-anim-duration', '0.001s');
            wrapper.style.setProperty('--hemma-anim-delay',    '-1s');
            wrapper.style.setProperty('opacity', '0', 'important');
            // opacity:0 elements still hit-test, and an invisible wrapper above
            // the overlay would swallow touches meant for it.
            wrapper.style.setProperty('pointer-events', 'none', 'important');
            this._suppressedWrappers.push(wrapper);
          }
        }
      }

      // Cascade the suppression, as the dismiss path does.
      if (this._container) {
        this._container.style.setProperty('--hemma-anim-name', 'none');
        this._container.style.setProperty('--hemma-anim-duration', '0.001s');
        this._container.style.setProperty('--hemma-anim-delay', '-1s');
      }

      // Hide the content immediately so no card flashes.
      if (this._contentEl) this._contentEl.style.visibility = 'hidden';

      if (this._scrollHandler) {
        this._overlayEl?.removeEventListener('scroll', this._scrollHandler);
        this._scrollHandler = null;
      }
      if (this._titleEl) { this._titleEl.remove(); this._titleEl = null; }
      this._backBtn?.remove();
      this._backBtn = null;
      // Scroll-header teardown, as in _dismiss.
      if (this._compactHeaderEl) { this._compactHeaderEl.remove(); this._compactHeaderEl = null; }
      if (this._gradientBlurEl)  { this._gradientBlurEl.remove();  this._gradientBlurEl  = null; }
      // Restored instantly, never animated, so it reads as a fixed anchor.
      if (_movedBadgeRow && _movedBadgeRow.owner === this) _restoreBadgeRow();
      const toFilter   = this._hass?.states?.['input_select.hemma_mobile_filter']?.state;
      const npWasMoved = !!this._npSaved;
      this._restoreMovedWrappers();
      if (npWasMoved && toFilter === 'all' && this._npWrapper) {
        this._npWrapper.style.setProperty('position', 'relative', 'important');
        this._npWrapper.style.setProperty('z-index', '51', 'important');
      }
      const headerEl      = this._headerEl;
      this._headerEl      = null;
      const headerWrapper = this._headerWrapper;
      this._headerWrapper = null;
      for (const bc of this._badgeShadowCards) {
        bc.style.removeProperty('box-shadow');
        bc.style.removeProperty('background');
        bc.style.removeProperty('backdrop-filter');
        bc.style.removeProperty('-webkit-backdrop-filter');
      }
      this._badgeShadowCards = [];
      if (this._badgeRowEl) {
        this._badgeRowEl.style.removeProperty('background');
        this._badgeRowEl.style.removeProperty('backdrop-filter');
        this._badgeRowEl.style.removeProperty('-webkit-backdrop-filter');
        this._badgeRowEl.style.removeProperty('box-shadow');
        this._badgeRowEl.style.setProperty('z-index', '51', 'important');
      }
      const badgeRowEl = this._badgeRowEl;
      this._badgeRowEl = this._badgeRowWrapper = null;

      const scalableEls = this._scalableEls;
      this._scalableEls = [];

      overlayEl.style.overflow   = '';
      overlayEl.style.pointerEvents = 'none';
      overlayEl.style.clipPath   = 'inset(0%)';
      overlayEl.style.transition = `opacity 0.22s ${EASE_OUT}, transform 0.30s ${EASE_OUT}, clip-path 0.32s ${EASE_OUT}`;
      overlayEl.style.opacity    = '0';
      overlayEl.style.transform  = 'translateY(40%)';
      overlayEl.style.clipPath   = 'inset(6% round 22px)';

      this._pendingBlurFade = { blurEl, overlayEl, scalableEls, headerEl, badgeRowEl, headerWrapper,
        npWrappers: (npWasMoved && toFilter === 'all') ? [this._npWrapper] : [] };
      if (toFilter && toFilter !== 'all') {
        setTimeout(() => this._runBlurFade(), 600);
      } else {
        this._runBlurFade();
      }
    }
  }

  customElements.define('hemma-filter-overlay', HemmaFilterOverlay);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type:        'hemma-filter-overlay',
    name:        'Hemma Filter Overlay',
    description: 'Hemma category filter overlay panel',
    preview:     false,
  });
})();
