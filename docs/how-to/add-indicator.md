# Add an indicator

1. Define its meaning, scale, inputs and failure behavior in `docs/algorithm.md`.
2. Prefer a pure Job for one deterministic calculation.
3. Compose multiple calculations in an Operation only when the composition is meaningful/reused.
4. Add confidence and explanation metadata; avoid opaque magic scores.
5. Add unit tests with boundary cases and known historical examples.
6. Version any behavior change that alters output semantics.
