(function () {
  const REDIRECT_TOGGLE = 'input_boolean.hemma_dashboard_redirect';

  const MOBILE_SUFFIX = /[-_]mobile$/i;
  const MOBILE_MQ  = window.matchMedia('(max-width: 767px), (max-height: 500px)');

  function getHass() {
    try { return document.querySelector('home-assistant')?.hass || null; }
    catch (e) { return null; }
  }

  function panelExists(hass, urlPath) {
    return !!(hass && hass.panels &&
      Object.prototype.hasOwnProperty.call(hass.panels, urlPath));
  }

  function pairFor(hass, path) {
    const panel = path.split('/')[1] || '';
    if (!panel) return null;
    const onMobile = MOBILE_SUFFIX.test(panel);
    const desktop  = onMobile ? panel.replace(MOBILE_SUFFIX, '') : panel;
    const mobile   = onMobile ? panel : panel + '-mobile';
    if (!panelExists(hass, desktop) || !panelExists(hass, mobile)) return null;
    return { desktop, mobile, onMobile };
  }

  // ── Redirect ───────────────────────────────────────────────────────────
  function maybeRedirect() {
    const hass = getHass();
    if (hass?.states?.[REDIRECT_TOGGLE]?.state !== 'on') return;

    const path = window.location.pathname;
    const pair = pairFor(hass, path);
    if (!pair) return;

    // A phone dashboard stays put when the screen widens, as an unfolded foldable does.
    if (pair.onMobile || !MOBILE_MQ.matches) return;

    const target = '/' + pair.mobile + '/home';
    if (path === target) return;
    window.history.replaceState(null, '', target);
    window.dispatchEvent(new Event('location-changed'));
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  function waitForHA() {
    if (document.querySelector('home-assistant')) {
      maybeRedirect();
    } else {
      requestAnimationFrame(waitForHA);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForHA);
  } else {
    waitForHA();
  }

  window.addEventListener('location-changed', () => setTimeout(maybeRedirect, 50), true);
  MOBILE_MQ.addEventListener('change', maybeRedirect);
})();
