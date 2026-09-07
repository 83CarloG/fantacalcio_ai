"use strict";
const templateHtml = require("./template.handlebars");
const template = document.createElement("template");
template.innerHTML = `<style>
:host{display:inline-block}
.button{display:inline-flex;align-items:center;justify-content:center;gap:var(--fanta-space-2);min-height:var(--fanta-search-height);padding:0 var(--fanta-space-4);border:0;border-radius:var(--fanta-radius-md);background:var(--fanta-color-primary);color:var(--fanta-color-on-primary);font:inherit;font-weight:var(--fanta-font-weight-medium);cursor:pointer}
.button:hover{background:var(--fanta-color-primary-hover)}
.button:focus-visible{outline:2px solid var(--fanta-color-primary);outline-offset:2px}
.button:disabled{opacity:.55;cursor:not-allowed}
:host([variant="outline"]) .button{background:transparent;color:var(--fanta-color-text);border:1px solid var(--fanta-color-border)}
:host([variant="outline"]) .button:hover{background:transparent;border-color:var(--fanta-color-primary)}
:host([variant="outline"][tone="danger"]) .button{border-color:color-mix(in srgb, var(--fanta-color-danger) 55%, var(--fanta-color-border))}
:host([variant="outline"][tone="danger"]) .button:hover{border-color:var(--fanta-color-danger)}
:host([loading]) .button{cursor:not-allowed;opacity:.7}
:host([loading]) .button::before{content:"";width:14px;height:14px;flex:none;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation:fanta-button-spin .7s linear infinite}
@keyframes fanta-button-spin{to{transform:rotate(360deg)}}
</style>${templateHtml}`;
/**
 * Primary action button.
 * @attr {"button"|"submit"|"reset"} [type=button] - a native `<button type="submit">` living inside
 *   a shadow tree does NOT submit an ancestor `<form>` in the light DOM (shadow boundaries break the
 *   browser's form-association algorithm unless the element opts into ElementInternals). Rather than
 *   implement full form-associated-custom-element machinery for this simple wrapper, a click handler
 *   bridges the gap by calling `.requestSubmit()`/`.reset()` on `this.closest("form")` directly.
 * @attr {"solid"|"outline"} [variant=solid] - solid is the filled brand button; outline is a
 *   bordered/transparent button for secondary actions grouped in a toolbar.
 * @attr {"primary"|"danger"} [tone=primary] - only meaningful combined with variant="outline";
 *   danger tints the border for an irreversible/destructive action. Icons slotted into a
 *   danger-tone button are colored by the page stylesheet (light-DOM `<svg>`, not shadow CSS),
 *   e.g. `fanta-button[tone="danger"] svg{color:var(--fanta-color-danger)}`.
 * @attr {boolean} [loading=false] - shows a spinner before the slotted content and disables the
 *   button (real `disabled`, not just a visual state) so a background-triggering action can't be
 *   double-submitted while its result is still pending.
 */
class FantaButton extends HTMLElement {
    static get observedAttributes(){ return ["type", "loading"]; }
    constructor(){ super(); this.attachShadow({mode:"open"}).append(template.content.cloneNode(true)); }
    connectedCallback(){
        this._render();
        this.shadowRoot.querySelector(".button").addEventListener("click", (event) => this._bridgeToHostForm(event));
    }
    attributeChangedCallback(){ this._render(); }
    _render(){
        const button = this.shadowRoot.querySelector(".button");
        if (!button) return;
        // only "submit"/"reset" are meaningful outside the default; anything else stays "button"
        const type = this.getAttribute("type");
        button.type = (type === "submit" || type === "reset") ? type : "button";
        const loading = this.hasAttribute("loading");
        button.disabled = loading;
        button.setAttribute("aria-busy", String(loading));
    }
    _bridgeToHostForm(){
        if (this.hasAttribute("loading")) return;
        const type = this.getAttribute("type");
        if (type !== "submit" && type !== "reset") return;
        const form = this.closest("form");
        if (!form) return;
        if (type === "submit") form.requestSubmit();
        else form.reset();
    }
}
customElements.define("fanta-button", FantaButton);
