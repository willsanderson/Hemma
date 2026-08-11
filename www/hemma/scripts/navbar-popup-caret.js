// Adds a dropdown caret to navbar-card routes whose tap_action is open-popup.
// Register as a module-type Lovelace resource.
(function () {
  const STYLE_ID = "hemma-popup-caret";
  // MDI chevron-right, matching the Now Playing header caret.
  const CHEVRON =
    "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E" +
    "%3Cpath%20d%3D'M8.59%2C16.58L13.17%2C12L8.59%2C7.41L10%2C6L16%2C12L10%2C18L8.59%2C16.58Z'%2F%3E%3C%2Fsvg%3E";

  const CARET_CSS = `
    .route[data-has-popup] .label::after {
      content: "";
      display: inline-block;
      width: 20px;
      height: 20px;
      margin-left: 2px;
      vertical-align: -5px;
      background-color: rgba(255,255,255,0.42);
      -webkit-mask: url("${CHEVRON}") no-repeat center / contain;
      mask: url("${CHEVRON}") no-repeat center / contain;
      transform: rotate(0deg);
      transition: transform 0.34s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .route[data-has-popup][data-popup-open] .label::after {
      transform: rotate(90deg);
    }
    .navbar.mobile .route[data-has-popup] .label::after {
      display: none;
    }
  `;

  customElements.whenDefined("navbar-card").then(() => {
    const Klass = customElements.get("navbar-card");
    const origUpdated = Klass.prototype.updated;

    Klass.prototype.updated = function (changed) {
      origUpdated?.call(this, changed);
      const sr = this.shadowRoot;
      if (!sr) return;

      if (!sr.getElementById(STYLE_ID)) {
        const s = document.createElement("style");
        s.id = STYLE_ID;
        s.textContent = CARET_CSS;
        sr.appendChild(s);
      }

      requestAnimationFrame(() => {
        const cfg = this._config || this.config;
        const routes = cfg?.routes;
        if (!routes?.length) return;

        const els = sr.querySelectorAll(".route");
        const n = routes.length;
        els.forEach((el, i) => {
          if (routes[i % n]?.tap_action?.action === "open-popup") {
            el.setAttribute("data-has-popup", "");
          } else {
            el.removeAttribute("data-has-popup");
          }
        });

        syncOpenState(sr);
      });

      // navbar-card opens and closes the popup without a lit update we can
      // hook, so watch the shadow root directly.
      if (!this._hemmaCaretObserver) {
        this._hemmaCaretObserver = new MutationObserver(() => syncOpenState(sr));
        this._hemmaCaretObserver.observe(sr, { childList: true, subtree: true });
      }
    };
  });

  // Only one popup can be open at a time, so a single flag on every
  // popup-bearing route is enough.
  function syncOpenState(sr) {
    const open = !!sr.querySelector(".navbar-popup");
    sr.querySelectorAll(".route[data-has-popup]").forEach((el) => {
      if (open) el.setAttribute("data-popup-open", "");
      else el.removeAttribute("data-popup-open");
    });
  }
})();
