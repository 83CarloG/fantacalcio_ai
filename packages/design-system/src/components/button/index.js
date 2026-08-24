"use strict";
const templateHtml = require("./template.handlebars");
const template = document.createElement("template");
template.innerHTML = `<style>:host{display:inline-block}.button{min-height:var(--fanta-search-height);padding:0 var(--fanta-space-4);border:0;border-radius:var(--fanta-radius-md);background:var(--fanta-color-primary);color:var(--fanta-color-surface);font:inherit;font-weight:var(--fanta-font-weight-medium);cursor:pointer}.button:hover{background:var(--fanta-color-primary-hover)}.button:focus-visible{outline:2px solid var(--fanta-color-primary);outline-offset:2px}.button:disabled{opacity:.55;cursor:not-allowed}</style>${templateHtml}`;
/**
 * Primary action button.
 * @attr {"button"|"submit"|"reset"} [type=button] - a native `<button type="submit">` living inside
 *   a shadow tree does NOT submit an ancestor `<form>` in the light DOM (shadow boundaries break the
 *   browser's form-association algorithm unless the element opts into ElementInternals). Rather than
 *   implement full form-associated-custom-element machinery for this simple wrapper, a click handler
 *   bridges the gap by calling `.requestSubmit()`/`.reset()` on `this.closest("form")` directly.
 */
class FantaButton extends HTMLElement {
    static get observedAttributes(){ return ["type"]; }
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
    }
    _bridgeToHostForm(){
        const type = this.getAttribute("type");
        if (type !== "submit" && type !== "reset") return;
        const form = this.closest("form");
        if (!form) return;
        if (type === "submit") form.requestSubmit();
        else form.reset();
    }
}
customElements.define("fanta-button", FantaButton);
