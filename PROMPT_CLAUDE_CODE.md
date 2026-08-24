# Bootstrap prompt for Claude Code

You are bootstrapping **Fanta Luminous Platform**, a fantasy-football auction decision application.

Start by reading, in this exact order:

1. `SYSTEM.md`
2. `AGENTS.md`
3. `LEARNED.md`
4. `docs/architecture.md`
5. all ACCEPTED ADRs in `docs/adr/`
6. `docs/reference/LUMINOUS_ARCHITECTURE.md`
7. the package-specific README/package.json files you will touch

Then inspect the repository and run the existing verification commands before changing code.

## Product topology (non-negotiable)

There are three separately understandable products in this monorepo:

### 1. REST API — `apps/api`

Node.js 22 + Fastify. It owns domain/business behavior, storage, data acquisition and algorithms. It exposes versioned JSON REST endpoints under `/v1`.

Inside its `/src`, obey Luminous strictly:

- service -> feature -> operation -> job -> driver
- downward layer skipping is allowed if it avoids useless wrappers
- no same-layer calls
- no upward calls
- jobs do not call jobs in the same module
- operations call jobs only
- features do not call features in the same module
- services do not call services in the same module
- routes/server/framework code live outside `/src`
- every route calls exactly one public service
- core services receive and return plain JavaScript values, never Fastify request/reply

### 2. Web BFF — `apps/web-bff`

Node.js 22 + Fastify + Handlebars. This is NOT a SPA and must not access the API database. It calls the REST API over HTTP via its `backendApi` driver.

Responsibilities:

- server-render dashboard and player pages
- page composition/view models
- session/UI concerns when introduced later
- serve browser assets
- consume `@fanta/design-system`

The BFF core also follows Luminous. Fastify routes and Handlebars templates remain outside `/src`.

### 3. Design System — `packages/design-system`

Vanilla JS/CommonJS Web Components, inspired by the supplied ACTide architecture:

- no JS framework
- no TypeScript/transpilation
- Shadow DOM
- CSS custom-property tokens only for design values
- snake_case component directories
- kebab-case `fanta-*` custom tags
- JSDoc public API
- bubbled CustomEvents
- icon shapes use CSS masks/currentColor, no per-color files
- light-DOM pre-upgrade component reservations

The BFF should use semantic HTML first; use Web Components when they provide a reusable UI contract, not to replace every HTML tag.

## Domain baseline

Use the existing seed/reference data rather than inventing values:

- Fantacalcio.it is canonical for eligible/listed players, official role/quotation/FVM.
- FPEDIA enriches historical projections/skills/risk.
- 2025/26 auction ledger contains 200 real league transactions.
- market price calibration is role-specific and single-season; expose conservative confidence.
- first 3/4 matchday data will update technical projections with a capped weight, not replace preseason priors.
- raw WhatsApp chat is intentionally absent; only anonymized derived data is allowed.

## Initial deliverable

Bring the bootstrap to a clean runnable MVP while preserving the architecture:

1. Make `npm run bootstrap` idempotent.
2. Make `npm run verify` green.
3. Run API and BFF locally.
4. Ensure REST endpoints work:
   - `GET /v1/health`
   - `GET /v1/players`
   - `GET /v1/players/:id`
   - `GET /v1/players/:id/indicators`
   - `GET /v1/market/model`
   - `POST /v1/auction/evaluate`
5. Ensure BFF pages work:
   - `/`
   - `/players`
   - `/players/:id`
6. Build the design-system bundle and verify the demo page.
7. Preserve API/BFF separation in Docker Compose.
8. Add missing tests at the correct Luminous level rather than introducing broad integration coupling.

## Coding style

- CommonJS unless an existing file explicitly establishes another local convention.
- `"use strict"` at module top.
- one exported function per Luminous core file.
- pass only required inputs.
- comments explain why, not obvious syntax.
- KISS/YAGNI; do not create a layer solely to satisfy a diagram.
- do not add Python, React, Vue, TypeScript or an ORM during bootstrap.

## Required execution protocol

Before edits emit:

```text
####PRE_CODE####
SCOPE: ...
LAYERS: ...
CONVENTIONS: ...
ASSUMPTIONS: ...
TRAPS: ...
####END_PRE_CODE####
```

After work emit:

```text
####RESULT####
STATUS: COMPLETE | PARTIAL | FAILED
CHANGED: ...
VERIFIED: exact commands actually observed
OPEN_QUESTIONS: ...
####END_RESULT####
```

Do not claim Docker/browser/runtime verification unless you actually observed it.
