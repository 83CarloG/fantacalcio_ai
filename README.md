# Fanta Luminous Platform

Bootstrap monorepo for a fantasy-football decision platform.

## Topology

```text
browser
  -> web-bff :3001 (Fastify + Handlebars + vanilla JS)
      -> api :3000 (REST only)
          -> SQLite/MySQL + Redis + public source adapters

web-bff
  -> @fanta/design-system (Web Components + design tokens)

api/web-bff
  -> @fanta/contracts (JSON Schemas)
```

The browser never calls the API directly by default. The Web BFF owns page composition and calls the REST API. The API owns business logic, persistence, data collection, market calibration and indicators.

## Architecture

Both Node backends follow Luminous dependency direction:

`service -> feature -> operation -> job -> driver`

Skipping lower layers is allowed when no useful boundary/reuse is added. Same-layer and upward calls are forbidden. Fastify, routes, HTTP request/response objects and Handlebars remain outside `/src`.

See `docs/architecture.md`, `SYSTEM.md`, `AGENTS.md` and the reference architecture in `docs/reference/`.

## Quick start

```bash
cp .env.example .env
npm run bootstrap
npm run dev:api
# second terminal
npm run dev:web
```

Or:

```bash
docker compose up --build
```

Dashboard: http://localhost:3001  
REST API: http://localhost:3000/v1  
OpenAPI: http://localhost:3000/docs

## Seed data

The bootstrap includes:

- 200 normalized auction transactions from 2025/26
- the single-season market calibration model
- anonymized league profile/chat-derived signals
- three sample player snapshots (Nico Paz, De Gea, Kean)
- the original 2025/26 auction workbook and the analyzed workbook

The raw WhatsApp chat is deliberately NOT bundled.

## Important model limitation

The price model is calibrated on one complete auction season only (2025/26). It must expose this limitation in confidence metadata and must not pretend to have multi-season validation.
