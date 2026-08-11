// hemma-redirect.js
// ─────────────────────────────────────────────────────────────────────────────
// Sends phones to the mobile dashboard and non-phones to the desktop one.
//
// ON BY DEFAULT, and narrowly scoped.
// Without it, a phone opening the DESKTOP Hemma dashboard gets desktop content
// wearing the mobile CSS from hemma_shared's max-width:767px blocks — it looks
// like a broken mobile dashboard rather than a desktop one, which is worse than
// either. Turn off input_boolean.hemma_dashboard_redirect to disable.
//
// It only ever acts on a path that is ALREADY a Hemma dashboard, so someone
// using a different dashboard is never pulled into Hemma's, toggle or not. And
// it only ever redirects to a dashboard HA actually has registered.
//
// The gate still fails CLOSED: it redirects only once it can positively confirm
// the boolean is 'on'. If `hass` isn't ready, or the helper doesn't exist,
// nothing happens. Never "redirect unless proven otherwise".
//
// This file is genuinely OPTIONAL — skipping it costs you nothing but the
// routing. The mobile wallpaper used to live here too, which made an optional
// resource load-bearing for a required feature; it now lives in hemma-core.js.
(function () {
  const REDIRECT_TOGGLE = 'input_boolean.hemma_dashboard_redirect';

  // url_path of each dashboard, as registered in configuration.yaml.
  const DESKTOP_PANEL = 'dashboard-hemma';
  const MOBILE_PANEL  = 'dashboard-hemma-mobile';
  const DESKTOP_HOME  = '/' + DESKTOP_PANEL + '/home';
  const MOBILE_HOME   = '/' + MOBILE_PANEL + '/home';
  // Matches any path on the desktop dashboard, but NOT /dashboard-hemma-mobile:
  // after "dashboard-hemma" the next character there is "-", which is neither a
  // slash nor end-of-string. This is also what keeps the redirect off anybody
  // else's dashboards — it only ever acts on a path that is already Hemma's.
  const DESKTOP_RE = /^\/dashboard-hemma(\/|$)/;
  const MOBILE_RE  = /^\/dashboard-hemma-mobile(\/|$)/;
  // Same breakpoints the card templates use for "mobile": narrow (phone
  // portrait) OR short (phone landscape / very short windows).
  const MOBILE_MQ  = window.matchMedia('(max-width: 767px), (max-height: 500px)');

  function getHass() {
    try { return document.querySelector('home-assistant')?.hass || null; }
    catch (e) { return null; }
  }

  // Only ever send someone to a dashboard Home Assistant actually has.
  //
  // This matters because the redirect ships ON. Plenty of people will install
  // the desktop dashboard and skip the mobile one, and without this check their
  // phones would be thrown at /dashboard-hemma-mobile/home and land on nothing.
  // The reverse case is just as real: a tablet opening the mobile dashboard when
  // no desktop dashboard was ever registered.
  function panelExists(hass, urlPath) {
    return !!(hass && hass.panels &&
      Object.prototype.hasOwnProperty.call(hass.panels, urlPath));
  }

  // ── Redirect ────────────────────────────────────────────────────────────────
  function maybeRedirect() {
    const hass = getHass();
    // Fails CLOSED: only redirect once the toggle can be positively confirmed
    // 'on'. No hass, no helper, no redirect.
    if (hass?.states?.[REDIRECT_TOGGLE]?.state !== 'on') return;

    const path = window.location.pathname;
    let target = null;
    if (MOBILE_MQ.matches && DESKTOP_RE.test(path) && panelExists(hass, MOBILE_PANEL)) {
      target = MOBILE_HOME;
    } else if (!MOBILE_MQ.matches && MOBILE_RE.test(path) && panelExists(hass, DESKTOP_PANEL)) {
      // Mobile dashboard has only one view (home) — always land on desktop home.
      target = DESKTOP_HOME;
    }
    if (target && path !== target) {
      window.history.replaceState(null, '', target);
      window.dispatchEvent(new Event('location-changed'));
    }
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
