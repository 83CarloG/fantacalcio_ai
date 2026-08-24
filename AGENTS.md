# Fanta Luminous Platform — Repo Map

## What this repo is

A monorepo with two independent Node/Fastify applications and one vanilla Web Component design system:

- `apps/api`: REST API and business core.
- `apps/web-bff`: server-rendered frontend backend; calls `apps/api` over HTTP only.
- `packages/design-system`: vanilla JS Web Components and CSS tokens.
- `packages/contracts`: JSON Schema contracts shared at integration boundaries.

## Architectural rule

The generic Luminous specification in `docs/reference/LUMINOUS_ARCHITECTURE.md` is the architectural baseline. Accepted ADRs may document intentional local deviations.

Dependency direction inside each backend core:

- services orchestrate features, operations, jobs and drivers
- features orchestrate operations, jobs and drivers
- operations compose jobs only
- jobs may use drivers
- drivers talk to external resources
- no same-layer calls
- no upward calls
- framework code is outside `/src`

## Backend API

`apps/api/src/` owns business logic. `apps/api/server/` owns Fastify.

Modules currently bootstrapped:

- players
- indicators
- market
- auction
- sources

## Web BFF

`apps/web-bff/src/` owns page/application composition using plain objects. `apps/web-bff/server/` owns Fastify, Handlebars, static files and HTTP routes. It may consume only public REST endpoints from the API through its HTTP driver.

The browser does not receive database credentials, source credentials or internal API topology.

## Design System

- Vanilla JS, CommonJS, no frontend framework/transpiler.
- Web Components use Shadow DOM.
- CSS values come from custom-property design tokens.
- Component directories use snake_case; custom-element tags use kebab-case.
- Icons use one SVG shape with `currentColor`/CSS mask, never per-color icon assets.
- Component size reservations live in light DOM CSS to reduce layout shift before custom elements upgrade.
- `/design-system` in the Web BFF is the runtime demo/verification surface (ADR-0004).

## Data

`data/reference/` contains calibration/reference inputs. Raw private WhatsApp chat must not be committed.

## Commands

- `npm run bootstrap`
- `npm run verify`
- `npm run dev:api`
- `npm run dev:web`
- `npm run build:ds`

## HOW-TO Index

- `docs/how-to/add-api-endpoint.md` — expose a new REST business request.
- `docs/how-to/add-bff-page.md` — add a server-rendered page backed by API calls.
- `docs/how-to/add-design-system-component.md` — add a Web Component/token safely.
- `docs/how-to/add-indicator.md` — extend player indicators without breaking explainability.
