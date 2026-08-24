# Indicator algorithm baseline

Indicators remain separated into independent concerns:

- `technicalProjectionScore`: preseason prior + capped early-season evidence.
- `availabilityScore`: reliability of actually receiving a fantasy grade/minutes.
- `riskScore`: injuries, availability uncertainty and projection uncertainty.
- `upsideScore`: positive-tail potential, especially for new/young players.
- `expectedPrice`: league-specific price prediction from role/FVM calibration.
- `scarcityIndex`: replacement gap within role.
- `recommendedMaxBid`: roster-context-aware maximum, never just expected price.
- `valueGap`: recommended maximum minus expected market price.

Every derived response should include `modelVersion`, `confidence`, and explanations/inputs sufficient to audit why a score was produced.

The 2025/26 market calibration has only one full auction season. Do not present its confidence as multi-season validated.
