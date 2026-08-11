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

  // offsetParent is null for position:fixed elements like the navbar even when
  // they're on screen, so measure the box instead.
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

  // Phones get the mobile dashboard instead, but a narrow desktop window can
  // still land here.
  function isDesktopOrTablet() {
    try {
      return !(window.matchMedia('(max-width: 767px)').matches &&
               window.matchMedia('(orientation: portrait)').matches);
    } catch (e) {
      return true;
    }
  }

  function findRoomHeaderStack() {
    var found = [];
    walkFind(document, '#badges_media', found, 0);
    for (var i = 0; i < found.length; i++) {
      var container = found[i].closest('#container');
      if (container && isVisible(container)) return container;
    }
    return null;
  }

  // _scrollMode is set by smart-row.js and separates the entity tile row from
  // the scroll-mode badge sub-rows.
  function findActiveEntityRow() {
    var found = [];
    walkFind(document, 'hemma-smart-row', found, 0);
    for (var i = 0; i < found.length; i++) {
      var el = found[i];
      if (el._scrollMode === false && isVisible(el)) return el;
    }
    return null;
  }

  // navbar-card has no box of its own; the positioned element is .navbar in
  // its shadow root.
  function findNavbar() {
    var found = [];
    walkFind(document, 'navbar-card', found, 0);
    for (var i = 0; i < found.length; i++) {
      var nb = found[i];
      var inner = nb.shadowRoot ? nb.shadowRoot.querySelector('.navbar') : null;
      if (inner && isVisible(inner)) return inner;
      if (isVisible(nb)) return nb;
    }
    return null;
  }

  // Falling back to the theme's declared nav position rather than 0 keeps a
  // failed lookup from collapsing the header onto the weather widget.
  function fallbackNavbarBottom() {
    var v = getComputedStyle(html).getPropertyValue('--hemma-nav-top-current').trim();
    var px = parseFloat(v);
    return isNaN(px) ? 60 : px + 40; // plus an approximate navbar height
  }

  function setHeaderTop(px) {
    var rounded = Math.round(px);
    if (rounded !== lastHeaderTop) {
      lastHeaderTop = rounded;
      html.style.setProperty('--hero-top', rounded + 'px');
    }
  }

  function computeAndApplyHeader() {
    if (!isDesktopOrTablet()) return;

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
    computeAndApplyHeader();
    setupHeaderObservers();
    // The room card may not be in the DOM yet, and its badges settle a beat
    // after first paint.
    var attempts = 0;
    var iv = setInterval(function () {
      if (++attempts > 20) { clearInterval(iv); return; }
      computeAndApplyHeader();
      setupHeaderObservers();
    }, 250);
  }

  window.addEventListener('resize', queueRecompute);
  window.addEventListener('location-changed', function () {
    // Drop stale observations and re-discover once the new view has rendered.
    headerObservedEls = [];
    if (headerRO) { try { headerRO.disconnect(); } catch (e) {} }
    setTimeout(initHeader, 400);
  });

  setTimeout(initSidebar, 200);
  setTimeout(initSidebar, 1500);
  setTimeout(initSidebar, 5000);

  setTimeout(initHeader, 200);
  setTimeout(initHeader, 1500);
})();
