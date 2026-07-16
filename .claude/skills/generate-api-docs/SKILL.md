---
description: Produce and maintain the API reference (OpenAPI or markdown) from the Route Handlers and shared Zod schemas so PRD §5 stays in sync with code. Use after adding/changing endpoints.
---

# generate-api-docs

**Purpose:** Keep API documentation accurate and derived from real code.

**Use when:** endpoints or payload schemas change.

## Inputs
- Route handlers; shared Zod schemas.

## Procedure
1. Derive endpoint list + request/response shapes from `app/api/*` and `lib/schemas/`.
2. Generate `docs/api.md` (or OpenAPI via `zod-to-openapi`).
3. Reconcile against PRD §5; note any intentional differences.

## Output
- `docs/api.md` or an OpenAPI spec in sync with code.

## Dependencies
- Library: `zod-to-openapi` (optional). Skills: `create-api-route-handler`, `write-zod-schemas`.

## References
- [OpenAPI](https://swagger.io/specification/) · [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)

## Guardrails
- Docs derive from code, not assumptions. If code and PRD disagree, flag it.
