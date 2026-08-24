<!-- Last updated: 2026-08-05 -->
<!-- RULES for this file (repo-memory skill enforces them):
     - AGENTS.md describes WHAT THE REPO IS NOW — a map, not a changelog.
       No dated task history, no test-run results, no fix logs anywhere in
       this file: those belong in LEARNED.md or git.
     - Keep it readable in ONE agent read: soft cap ~1000 lines. When a
       section outgrows that, move the detail into a docs/how-to/ file and
       leave a pointer + one-line summary here.
     - Keep the HOW-TO Index in sync with docs/how-to/ (one line per file). -->
# ACTide Design System

Vanilla JavaScript Web Component design system for the ACTide platform.

## Tech Stack

- **Vanilla JS** — no frameworks, no transpilation (no Babel/TypeScript)
- **CommonJS** (`require`/`module.exports`)
- **Web Components** — Shadow DOM, `HTMLElement` extension
- **Webpack 5** — build tool with MiniCssExtractPlugin, Handlebars loader
- **PostCSS** — cssnano for minification
- **Fastify** — dev server only for demo purpose managed by PM2
- **No testing framework**

## Directory Structure

```
src/
  components/          -- Web Components
    button/
    badge/
    icon/
    toggle/
    alert/
    stepper/
    check_button/
    inline_message/
    pin_pad/
    pdf_viewer/      -- <actide-pdf-viewer>; imports pdfjs-dist's LEGACY build on purpose —
                        the modern build's bare Promise.try crashes Chrome/WebView < 128
                        inside the worker (LEARNED 2026-08-05); keep any pdfjs upgrade on legacy/
    form/
      input/           -- <actide-input> (supports type="textarea")
      checkbox/
      radio/
      inputs_group/
  foundations/         -- Fonts, icons, logos, illustrations
  tokens/              -- CSS custom properties, plus the LIGHT-DOM sheets every consumer gets
                          via index.css. component_reservations.css is the one that is not
                          theming: it holds the `:not(:defined)` pre-upgrade SIZE RESERVATIONS
                          (button 48px, input 86px, stepper 60px, pin-pad 280x419.38 / 320x484
                          either side of its own 768px breakpoint). They MUST be light-DOM — a
                          component cannot reserve its own space, because everything sizing it
                          lives in `:host` inside a shadow root that does not exist until the
                          element upgrades. Change a component's settled size and you must
                          change its reservation here, or it manufactures the very layout shift
                          it exists to remove
server/views/          -- Handlebars demo templates
demo/                  -- Webpack entry points
public/                -- Build output
```

## Conventions

- `"use strict"` at top of every module
- JSDoc on all classes, methods, attributes
- Private methods prefixed with `_`
- Getter/setter pairs for each attribute
- Custom events with `bubbles: true`
- CSS custom properties (`var(--...)`) — no hardcoded values
- BEM-like naming for internal CSS classes
- `snake_case` for directory names, `kebab-case` for tags
- Component template pattern: `const template = document.createElement("template"); template.innerHTML = require("./template");`

## Commands

- `npm run dev:server` — Start Fastify dev server
- `npm run watch` — Webpack watch mode
- `npm run start` — PM2 start + logs
- `npm run export` — Production webpack export

## Adding New Icons

Icons are rendered with CSS masks: `actide-icon` paints an empty `.glyph` span with `background-color: currentColor` clipped by `mask-image`, so one SVG file serves every color and size. Never create per-color icon files (no `*_white` variants).

SVG file convention (all files in `src/foundations/icons/`):
- `viewBox="0 0 24 24"`, **no** `width`/`height` attributes
- single color, always `currentColor` for `fill`/`stroke` (`fill="none"` allowed)
- kebab-case file name matching the icon name

To add an icon:
1. Add the SVG file to `src/foundations/icons/` following the convention above
2. Register it in `src/components/icon/style/index.css` with `:host([name="icon-name"]) .glyph { --icon-url: url("src/foundations/icons/icon-name.svg"); }`
3. Use it via `<actide-icon name="icon-name"></actide-icon>`

Color: icons default to `--color-icon-color` (set on `actide-icon`'s own `:host`), NOT plain ambient inheritance — a consumer that wants a different color must set it on an ancestor with a rule that targets the icon element/class directly (equal-specificity ties resolve in favor of the *outer* consumer rule, e.g. `actide-button`'s `.icon-slot actide-icon { color: inherit; }`), or force a token color with the `color` attribute: `primary`, `success`, `error`, `info`, `muted`, `on-primary`. Sizes via `size` attribute: `s`, default, `l`.

Components that draw icons in their own CSS (`alert`, `stepper`) use the same mask technique on a pseudo-element: `mask: url(...) no-repeat center / contain` + `background-color`.

Multicolor illustrations (`src/foundations/illustrations/`) are NOT masked — they render via `background-image` (see `not_found` in the icon stylesheet).

## Adding Icons to actide-button
- The `icon` attribute accepts an icon name (e.g., "plus") and `icon-position` controls placement ("left" or "right", default "left")
- Icons are rendered as `<actide-icon>` components inside named slots (`icon-left`, `icon-right`) in the button's Shadow DOM
- Button template has three slots: `icon-left`, default (text content), and `icon-right`

## HOW-TO Index
<!-- one line per docs/how-to/ file: path — when to use it -->
(empty — grows via the repo-memory skill)
