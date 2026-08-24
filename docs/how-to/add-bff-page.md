# Add a BFF page

1. Identify which REST endpoints provide the page data.
2. Add BFF Jobs that call the `backendApi` driver for each cohesive API request.
3. Compose them in a Feature only when page composition needs multiple calls.
4. Expose one BFF Service returning a plain view model.
5. Add one Fastify web route that calls that Service once and renders Handlebars.
6. Add browser JS only for progressive enhancement.
7. Never import API internals or read the API database.
