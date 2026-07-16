---
description: Build the authenticated song library — list the user's songs/orders with replay, entitlement-gated re-download, and copy-share-link. Use for the account/library view.
---

# build-song-library

**Purpose:** Let users revisit, replay, re-download, and share their songs.

**Use when:** building the account library.

## Inputs
- Caller session; pagination.

## Procedure
1. Fetch the user's songs/orders (org-scoped via RLS) with `GET /api/songs`.
2. Render song cards: replay, re-download (if entitled), copy share link.
3. Support the anonymous→permanent claim entry point.

## Output
- Library page + song cards.

## Dependencies
- Skills: `write-data-access-layer`, `create-api-route-handler`, `build-reveal-player`.

## References
- [Next.js data fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

## Guardrails
- Downloads gated on entitlement; list scoped to the caller's org.
