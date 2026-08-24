"use strict";
const templateHtml = require("./template.handlebars");
const template = document.createElement("template");
template.innerHTML = `<style>:host{display:block}.search{display:block}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}input{box-sizing:border-box;width:100%;min-height:var(--fanta-search-height);padding:0 var(--fanta-space-3);border:1px solid var(--fanta-color-border);border-radius:var(--fanta-radius-md);background:var(--fanta-color-surface);color:var(--fanta-color-text);font:inherit}</style>${templateHtml}`;
/** Search input emitting a bubbled `fanta-search` event. */
class FantaSearch extends HTMLElement {
    constructor(){ super(); this.attachShadow({mode:"open"}).append(template.content.cloneNode(true)); }
    connectedCallback(){ const input=this.shadowRoot.querySelector("input"); input.placeholder=this.getAttribute("placeholder")||"Cerca"; input.addEventListener("input",()=>this.dispatchEvent(new CustomEvent("fanta-search",{bubbles:true,detail:{target:this.getAttribute("target"),query:input.value}}))); }
}
customElements.define("fanta-search", FantaSearch);
