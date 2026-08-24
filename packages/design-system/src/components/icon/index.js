"use strict";
const templateHtml = require("./template.handlebars");
const searchIcon = require("../../foundations/icons/search.svg");
const template = document.createElement("template");
template.innerHTML = `<style>:host{display:inline-flex;width:var(--fanta-icon-size-md);height:var(--fanta-icon-size-md);color:var(--fanta-color-text)}.glyph{width:100%;height:100%;background:currentColor;mask:var(--icon-url) no-repeat center/contain}:host([name="search"]) .glyph{--icon-url:url("${searchIcon}")}</style>${templateHtml}`;
/** Mask-based single-color icon. */
class FantaIcon extends HTMLElement { constructor(){ super(); this.attachShadow({mode:"open"}).append(template.content.cloneNode(true)); } }
customElements.define("fanta-icon", FantaIcon);
