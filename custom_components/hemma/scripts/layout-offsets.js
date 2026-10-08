// layout-offsets.js
(function () {
  if (window._hemmaLayoutOffsets) return;
  window._hemmaLayoutOffsets = true;

  var html = document.documentElement;

  function walkFind(root, selector, out, depth) {
    if (!root || depth > 20) return;
    if (root.querySelectorAll) {
      root.querySelectorAll(selector).forEach(function (el) { out.push(el); });
      root.querySelectorAll('*').forEach(function (el) {
        if (el.shadowRoot) walkFind(el.shadowRoot, selector, out, depth + 1);
      });
    }
  }

  function isVisible(el) {
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  // ── Sidebar width ─────────────────────────────────────────────────────────
  var lastSidebarW = -1;
  var sidebarDebounce = null;
  var sidebarObserversReady = false;

  function findSidebar() {
    try {
      var ha = document.querySelector('home-assistant');
      if (!ha || !ha.shadowRoot) return null;
      var ham = ha.shadowRoot.querySelector('home-assistant-main');
      if (!ham || !ham.shadowRoot) return null;
      var sb = ham.shadowRoot.querySelector('ha-sidebar');
      if (sb) return sb;
      var dr = ham.shadowRoot.querySelector('ha-drawer');
      if (!dr) return null;
      return dr.shadowRoot ? dr.shadowRoot.querySelector('ha-sidebar') : dr.querySelector('ha-sidebar');
    } catch (e) {
      return null;
    }
  }

  function setSidebarWidth(w) {
    if (w !== lastSidebarW) {
      lastSidebarW = w;
      html.style.setProperty('--hemma-sidebar-w', w + 'px');
    }
  }

  function applySidebar() {
    var sb = findSidebar();
    if (!sb) return false;

    var r = sb.getBoundingClientRect();
    var w = (r.width > 0 && r.right > 0) ? Math.round(r.width) : 0;

    if (w > 0) {
      if (sidebarDebounce) { clearTimeout(sidebarDebounce); sidebarDebounce = null; }
      setSidebarWidth(w);
    } else if (!sidebarDebounce) {
      sidebarDebounce = setTimeout(function () {
        sidebarDebounce = null;
        var sb2 = findSidebar();
        if (sb2) {
          var r2 = sb2.getBoundingClientRect();
          setSidebarWidth((r2.width > 0 && r2.right > 0) ? Math.round(r2.width) : 0);
        }
      }, 300);
    }
    return true;
  }

  function setupSidebarObservers() {
    if (sidebarObserversReady) return;
    var sb = findSidebar();
    if (!sb) return;
    sidebarObserversReady = true;

    try { new ResizeObserver(applySidebar).observe(sb); } catch (e) {}
    try {
      var mo = new MutationObserver(applySidebar);
      mo.observe(sb, { attributes: true });
      if (sb.parentNode) mo.observe(sb.parentNode, { attributes: true, childList: true });
    } catch (e) {}
  }

  function initSidebar() {
    if (applySidebar()) { setupSidebarObservers(); return; }
    var attempts = 0;
    var iv = setInterval(function () {
      if (++attempts > 60) { clearInterval(iv); return; }
      if (applySidebar()) { clearInterval(iv); setupSidebarObservers(); }
    }, 250);
  }

  // ── Header stack centering ────────────────────────────────────────────────
  var headerRO = null;
  var headerObservedEls = [];
  var lastHeaderTop = -1;
  var recomputeQueued = false;

  function isDesktopOrTablet() {
    try {
      return !(window.matchMedia('(max-width: 767px)').matches &&
               window.matchMedia('(orientation: portrait)').matches);
    } catch (e) {
      return true;
    }
  }

  // A full walk of every shadow root forces layout; on a room change it landed mid-slide, so each find is kept.
  var cached = {};
  function keep(key, find) {
    var el = cached[key];
    if (el && el.isConnected && isVisible(el)) return el;
    return (cached[key] = find());
  }

  function findRoomHeaderStack() { return keep('stack', walkHeaderStack); }
  function findActiveEntityRow() { return keep('row', walkEntityRow); }
  function findNavbar() { return keep('nav', walkNavbar); }

  function walkHeaderStack() {
    var found = [];
    walkFind(document, '#badges_media', found, 0);
    for (var i = 0; i < found.length; i++) {
      var container = found[i].closest('#container');
      if (container && isVisible(container)) return container;
    }
    return null;
  }

  function walkEntityRow() {
    var found = [];
    walkFind(document, 'hemma-smart-row', found, 0);
    for (var i = 0; i < found.length; i++) {
      var el = found[i];
      if (el._scrollMode === false && isVisible(el)) return el;
    }
    return null;
  }

  // The hemma-nav-bar host is a zero-height fixed anchor; .bar is the real box.
  function walkNavbar() {
    var found = [];
    walkFind(document, 'hemma-nav-bar', found, 0);
    for (var i = 0; i < found.length; i++) {
      var nb = found[i];
      var inner = nb.shadowRoot ? nb.shadowRoot.querySelector('.bar') : null;
      if (inner && isVisible(inner)) return inner;
    }
    return null;
  }

  function fallbackNavbarBottom() {
    var v = getComputedStyle(html).getPropertyValue('--hemma-nav-top-current').trim();
    var px = parseFloat(v);
    return isNaN(px) ? 60 : px + 40; // plus an approximate navbar height
  }

  // A card placed under the tile row is the one thing in this view still in
  // normal flow, so its height has to come off the hero or the view grows past
  // the viewport and the whole dashboard scrolls.
  var lastExtras = -1;
  function extrasHeight() {
    var row = findActiveEntityRow();
    if (!row) return 0;
    var node = row;
    while (node.parentElement && node.parentElement.children.length < 2) {
      node = node.parentElement;
    }
    if (!node.parentElement) return 0;
    var kids = node.parentElement.children;
    var total = 0, seen = false;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i] === node) { seen = true; continue; }
      if (!seen) continue;
      var r = kids[i].getBoundingClientRect();
      if (r.height <= 0) continue;
      total += r.height;
      // The gap a card sits in counts too, or the view is short by it.
      try {
        var cs = getComputedStyle(kids[i]);
        total += (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      } catch (e) {}
    }
    return total;
  }

  function applyExtras() {
    if (!isDesktopOrTablet()) return;
    var px = Math.round(extrasHeight());
    if (px === lastExtras) return;
    lastExtras = px;
    html.style.setProperty('--hemma-extras-h', px + 'px');
  }

  function setHeaderTop(px) {
    var rounded = Math.round(px);
    if (rounded !== lastHeaderTop) {
      lastHeaderTop = rounded;
      html.style.setProperty('--hero-top', rounded + 'px');
    }
  }

  // Overview hides the room card's header and rows, so there is nothing to place, and a search would never find them.
  function computeAndApplyHeader() {
    if (!isDesktopOrTablet() || window._hemmaOverview) return;
    applyExtras();

    var headerStack = findRoomHeaderStack();
    if (!headerStack) return;

    var entityRow = findActiveEntityRow();
    var navbar = findNavbar();
    var navbarBottom = navbar ? navbar.getBoundingClientRect().bottom : fallbackNavbarBottom();

    var viewportH = window.innerHeight;
    var headerH = headerStack.getBoundingClientRect().height;
    var entityRowH = entityRow ? entityRow.getBoundingClientRect().height : 0;

    var available = viewportH - navbarBottom - entityRowH;
    var centeredTop = navbarBottom + Math.max(0, (available - headerH) / 2);

    setHeaderTop(centeredTop);
  }

  function queueRecompute() {
    if (recomputeQueued) return;
    recomputeQueued = true;
    requestAnimationFrame(function () {
      recomputeQueued = false;
      computeAndApplyHeader();
    });
  }

  function observeEl(el) {
    if (!el || headerObservedEls.indexOf(el) !== -1) return;
    headerObservedEls.push(el);
    try { headerRO.observe(el); } catch (e) {}
  }

  function setupHeaderObservers() {
    if (!headerRO) {
      try { headerRO = new ResizeObserver(queueRecompute); } catch (e) { return; }
    }

    var headerStack = findRoomHeaderStack();
    if (headerStack) observeEl(headerStack);
    var entityRow = findActiveEntityRow();
    if (entityRow) observeEl(entityRow);

    // Catches zoom and devtools changes that don't fire a resize event.
    observeEl(html);
  }

  function initHeader() {
    if (window._hemmaOverview) return;
    computeAndApplyHeader();
    setupHeaderObservers();
    var attempts = 0;
    var iv = setInterval(function () {
      if (++attempts > 20 || headerObservedEls.length >= 2 || window._hemmaOverview) { clearInterval(iv); return; }
      computeAndApplyHeader();
      setupHeaderObservers();
    }, 250);
  }

  window.addEventListener('resize', queueRecompute);
  window.addEventListener('location-changed', function () {
    // Drop stale observations and re-discover once the new view has rendered.
    headerObservedEls = [];
    cached = {};
    lastExtras = -1;
    if (headerRO) { try { headerRO.disconnect(); } catch (e) {} }
    setTimeout(initHeader, 600);
  });

  setTimeout(initSidebar, 200);
  setTimeout(initSidebar, 1500);
  setTimeout(initSidebar, 5000);

  setTimeout(initHeader, 200);
  setTimeout(initHeader, 1500);
})();
