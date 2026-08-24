"use strict";
const templateHtml = require("./template.handlebars");
const template = document.createElement("template");
template.innerHTML = `<style>
:host{display:block}
.card{min-height:var(--fanta-stat-card-min-height);box-sizing:border-box;padding:var(--fanta-space-5);background:var(--fanta-color-surface);border:1px solid var(--fanta-color-border);border-left:3px solid var(--fanta-color-border);border-radius:var(--fanta-radius-lg);box-shadow:var(--fanta-shadow-sm)}
.label{display:block;color:var(--fanta-color-muted);font-size:var(--fanta-font-size-sm);margin-bottom:var(--fanta-space-2)}
.value{font-size:var(--fanta-font-size-xl);color:var(--fanta-color-text)}
:host([trend="positive"]) .card{border-left-color:var(--fanta-color-success)}
:host([trend="warning"]) .card{border-left-color:var(--fanta-color-warning)}
</style>${templateHtml}`;
/**
 * Dashboard metric card.
 * @attr {string} label
 * @attr {string} value
 * @attr {string} [suffix]
 * @attr {"positive"|"warning"|"neutral"} [trend=neutral] - tints the left edge; neutral leaves it unstyled.
 */
class FantaStatCard extends HTMLElement {
    static get observedAttributes(){ return ["label","value","suffix"]; }
    constructor(){ super(); this.attachShadow({mode:"open"}).append(template.content.cloneNode(true)); }
    connectedCallback(){ this._render(); }
    attributeChangedCallback(){ this._render(); }
    _render(){ if(!this.shadowRoot) return; this.shadowRoot.querySelector(".label").textContent=this.getAttribute("label")||""; this.shadowRoot.querySelector(".value").textContent=`${this.getAttribute("value")||"—"}${this.getAttribute("suffix")||""}`; }
}
customElements.define("fanta-stat-card", FantaStatCard);
