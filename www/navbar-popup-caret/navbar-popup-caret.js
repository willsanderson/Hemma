/**
 * navbar-popup-caret.js
 * Adds a dropdown caret (▾) to navbar-card routes that use open-popup.
 *
 * Usage — register as a Lovelace resource:
 *   resources:
 *     - url: /local/hemma/navbar-popup-caret.js
 *       type: module
 */
(function () {
  const STYLE_ID = "hemma-popup-caret";
  const CARET_CSS = `
    .route[data-has-popup] .label::after {
      content: "";
      display: inline-block;
      width: 6px;
      height: 6px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg);
      margin-left: 6px;
      margin-right: 2px;
      margin-bottom: 3px;
      opacity: 0.55;
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
      });
    };
  });
})();
