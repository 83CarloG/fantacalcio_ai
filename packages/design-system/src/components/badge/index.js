"use strict";
const templateHtml = require("./template.handlebars");
const template = document.createElement("template");
// tone colors derive from the existing semantic tokens only (no new hues invented):
// a tint background via color-mix() + a solid token for border/text, per tone.
template.innerHTML = `<style>
:host{display:inline-block}
.badge{display:inline-flex;align-items:center;min-height:var(--fanta-badge-height);padding:0 var(--fanta-space-2);border-radius:999px;background:var(--badge-bg,var(--fanta-color-bg));border:1px solid var(--badge-border,var(--fanta-color-border));font-size:var(--fanta-font-size-xs);font-weight:var(--fanta-font-weight-medium);color:var(--badge-fg,var(--fanta-color-text))}
:host([tone="P"]){--badge-fg:var(--fanta-color-muted);--badge-bg:color-mix(in srgb, var(--fanta-color-muted) 14%, var(--fanta-color-surface));--badge-border:color-mix(in srgb, var(--fanta-color-muted) 40%, var(--fanta-color-surface))}
:host([tone="D"]){--badge-fg:var(--fanta-color-success);--badge-bg:color-mix(in srgb, var(--fanta-color-success) 14%, var(--fanta-color-surface));--badge-border:color-mix(in srgb, var(--fanta-color-success) 40%, var(--fanta-color-surface))}
:host([tone="C"]){--badge-fg:var(--fanta-color-primary);--badge-bg:color-mix(in srgb, var(--fanta-color-primary) 14%, var(--fanta-color-surface));--badge-border:color-mix(in srgb, var(--fanta-color-primary) 40%, var(--fanta-color-surface))}
:host([tone="A"]),:host([tone="pass"]){--badge-fg:var(--fanta-color-danger);--badge-bg:color-mix(in srgb, var(--fanta-color-danger) 14%, var(--fanta-color-surface));--badge-border:color-mix(in srgb, var(--fanta-color-danger) 40%, var(--fanta-color-surface))}
:host([tone="bid"]){--badge-fg:var(--fanta-color-success);--badge-bg:color-mix(in srgb, var(--fanta-color-success) 14%, var(--fanta-color-surface));--badge-border:color-mix(in srgb, var(--fanta-color-success) 40%, var(--fanta-color-surface))}
</style>${templateHtml}`;
/**
 * Compact semantic status/role badge.
 * @attr {"P"|"D"|"C"|"A"|"bid"|"pass"} [tone] - maps to a color drawn from the existing role/verdict semantics; omit for the neutral default.
 */
class FantaBadge extends HTMLElement { constructor(){ super(); this.attachShadow({mode:"open"}).append(template.content.cloneNode(true)); } }
customElements.define("fanta-badge", FantaBadge);
