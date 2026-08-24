Read and obey, in order:
1. `SYSTEM.md`
2. `AGENTS.md`
3. accepted ADRs in `docs/adr/`
4. matching `docs/how-to/`
5. `docs/reference/LUMINOUS_ARCHITECTURE.md`

For every coding task use the PRE_CODE / RESULT protocol defined in SYSTEM.md.
Do not bypass the REST boundary between `apps/web-bff` and `apps/api`.
Do not put framework code into backend `/src`.
