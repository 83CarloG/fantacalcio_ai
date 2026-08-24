# Add an API endpoint

1. Define the business request as a Service in the correct module.
2. Add only the lower layers that add real cohesion/reuse.
3. Add JSON Schema for route input/output where useful.
4. Add a Fastify route outside `/src`.
5. The route validates HTTP input, calls exactly one Service, and serializes the result.
6. Add unit tests for Jobs/Operations and service/feature scenarios where appropriate.
7. Run `npm run check:architecture`.
