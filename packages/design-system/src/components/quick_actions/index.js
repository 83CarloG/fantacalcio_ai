"use strict";
const templateHtml = require("./template.handlebars");
const template = document.createElement("template");
template.innerHTML = `<style>
:host{position:relative;display:inline-block}
.trigger{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:1px solid var(--fanta-color-border);background:var(--fanta-color-surface);color:var(--fanta-color-text);cursor:pointer;font-size:18px;line-height:1;transition:transform .15s ease,background .15s ease,border-color .15s ease}
.trigger:focus-visible{outline:2px solid var(--fanta-color-primary);outline-offset:2px}
:host([data-target-active]) .trigger{background:var(--fanta-color-primary);color:var(--fanta-color-on-primary);border-color:var(--fanta-color-primary)}
:host([open]) .trigger{transform:rotate(45deg)}
.menu{position:absolute;right:0;bottom:calc(100% + var(--fanta-space-2));z-index:10;display:flex;flex-direction:column;align-items:flex-end;gap:var(--fanta-space-2);opacity:0;pointer-events:none;transform:translateY(6px);transition:opacity .15s ease,transform .15s ease}
:host([open]) .menu{opacity:1;pointer-events:auto;transform:translateY(0)}
.action{display:inline-flex;align-items:center;gap:var(--fanta-space-2);padding:0 var(--fanta-space-3);height:34px;border-radius:999px;border:1px solid var(--fanta-color-border);background:var(--fanta-color-surface);color:var(--fanta-color-text);font:inherit;font-size:var(--fanta-font-size-sm);white-space:nowrap;cursor:pointer;box-shadow:var(--fanta-shadow-sm)}
.action:hover,.action:focus-visible{border-color:var(--fanta-color-primary)}
</style>${templateHtml}`;

/**
 * A round trigger that fans a short, LABELED menu of quick actions open on click — used
 * instead of one ambiguous icon-only toggle (see the plan's D.3: the single star toggle
 * on the call screen tested as unclear). Dumb component: reads `data-actions` (a JSON
 * array of `{action, label}`) and `data-player-id`, and emits a bubbling
 * `fanta-quick-action` CustomEvent with `{playerId, action}` per click — the host page
 * owns the actual side effect (fetch, navigate, …), same division of labor as
 * `fanta-search`'s `fanta-search` event.
 *
 * @attr {string} data-actions - JSON `[{"action":"toggle-target","label":"Aggiungi a lista"}]`
 * @attr {string} data-player-id
 * @attr {boolean} data-target-active - visual-only: fills the trigger to show "already on
 *   the list"; the host script sets/clears it after each toggle response, this component
 *   never infers it.
 */
class FantaQuickActions extends HTMLElement {
    static get observedAttributes() { return ["data-actions"]; }
    constructor() { super(); this.attachShadow({mode: "open"}).append(template.content.cloneNode(true)); }
    connectedCallback() {
        this._renderActions();
        this.shadowRoot.querySelector(".trigger").addEventListener("click", (event) => {
            event.stopPropagation();
            this.toggleAttribute("open");
        });
        this._onOutsideClick = (event) => { if (!event.composedPath().includes(this)) this.removeAttribute("open"); };
        document.addEventListener("click", this._onOutsideClick);
    }
    disconnectedCallback() { document.removeEventListener("click", this._onOutsideClick); }
    attributeChangedCallback(name) { if (name === "data-actions") this._renderActions(); }
    _renderActions() {
        const menu = this.shadowRoot.querySelector(".menu");
        if (!menu) return;
        menu.innerHTML = "";
        let actions = [];
        try { actions = JSON.parse(this.getAttribute("data-actions") || "[]"); } catch (_error) { actions = []; }
        for (const item of actions) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "action";
            button.setAttribute("role", "menuitem");
            button.textContent = item.label;
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                this.removeAttribute("open");
                this.dispatchEvent(new CustomEvent("fanta-quick-action", {bubbles: true, detail: {playerId: this.getAttribute("data-player-id"), action: item.action}}));
            });
            menu.append(button);
        }
    }
}
customElements.define("fanta-quick-actions", FantaQuickActions);
