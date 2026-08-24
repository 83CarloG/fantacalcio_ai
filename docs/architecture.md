# Architecture

## System context

```text
+-------------------+
| Browser           |
| HTML/CSS/JS       |
+---------+---------+
          |
          | HTTP pages/forms
          v
+-------------------+       REST/JSON       +-------------------+
| Web BFF           +---------------------->+ REST API          |
| Fastify/Handlebars|                        | Fastify           |
+---------+---------+                        +---------+---------+
          |                                            |
          | uses                                       | drivers
          v                                            v
+-------------------+                        +-------------------+
| Design System     |                        | SQLite/MySQL      |
| Web Components    |                        | Redis / Sources   |
+-------------------+                        +-------------------+
```

## Why a BFF

The dashboard has a backend of its own so browser code stays simple and the page layer can aggregate API calls without exposing internal service topology. The BFF does not duplicate fantasy-football business rules. Technical/market/auction calculations live in the API.

## Luminous backend rule

Inside `apps/api/src` and `apps/web-bff/src`:

`services -> features -> operations -> jobs -> drivers`

Calls only travel down. A lower layer never calls a higher one, and files in a layer do not call peers in the same layer. Skipping a layer is encouraged when it adds no reuse/boundary.

Framework directories are outside `/src`:

- API: `server/`
- Web BFF: `server/`

## REST boundary

The Web BFF must not import `apps/api/src`, `apps/api/server`, DB files or source collectors. It consumes only `/v1/*` endpoints via HTTP.

## Design System boundary

`packages/design-system` is visual/reusable UI only. It contains no fantasy-football business rules and never calls the API.
