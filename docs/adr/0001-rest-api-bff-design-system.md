# ADR-0001: Separate REST API, Web BFF and Design System

Status: ACCEPTED

## Decision

Use a REST-only backend API, a separate server-rendered Web BFF that calls that API over HTTP, and an independent vanilla Web Component design system.

## Consequences

- Browser pages stay simple and server-rendered.
- The BFF cannot bypass API contracts by importing API internals.
- Business rules live once, in the REST API core.
- UI components remain reusable and business-agnostic.
