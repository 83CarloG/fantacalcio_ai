# Add a design-system component

1. Create a `snake_case` directory in `packages/design-system/src/components/`.
2. Use a `fanta-*` kebab-case custom-element tag.
3. Use Shadow DOM and a template loaded via CommonJS.
4. Use tokens for visual CSS values.
5. Document public attributes/events with JSDoc.
6. Bubble CustomEvents.
7. If the component has stable height/width, add a light-DOM `:not(:defined)` reservation.
8. Add it to the demo page before calling it verified.
