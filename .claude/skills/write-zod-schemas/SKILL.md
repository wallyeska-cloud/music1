---
description: Author the shared Zod schemas (brief, subject, song, order, API payloads) used by BOTH client and server as the single source of validation truth. Use whenever a new data shape or endpoint payload is introduced.
---

# write-zod-schemas

**Purpose:** One validation definition shared across frontend and backend.

**Use when:** introducing a new entity or endpoint payload.

## Inputs
- Field specs + validation rules (PRD §4.5).

## Procedure
1. Create/extend schemas in `lib/schemas/`.
2. Encode validation rules (name/note length caps, age 0–18, enums for occasion/vibe/status).
3. Export inferred TS types.
4. Import the SAME schema in the route handler and the form — never re-declare validation.

## Output
- `lib/schemas/*.ts` reused everywhere.

## Dependencies
- Library: `zod`. Consumed by most API/frontend skills.

## References
- [Zod](https://zod.dev/)

## Guardrails
- Client and server must validate with the same schema. No divergent copies.
