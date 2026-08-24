# ADR-0004: Use the Web BFF as the design-system runtime demo

Status: ACCEPTED

Instead of maintaining a second Fastify demo server inside the design-system package, `/design-system` in the Web BFF is the bootstrap verification surface. This keeps one real consumer page and avoids a duplicate framework shell. The design-system package remains framework-agnostic.
