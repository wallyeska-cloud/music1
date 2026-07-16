---
description: Build the ≤5-step guided song-creation wizard with preset vibe cards, inline validation, draft autosave, moderation pre-check, and full accessibility. Use for the creation flow. NO open-ended "describe the music" field.
---

# build-song-wizard

**Purpose:** Let a non-technical parent create a song by answering a few friendly questions.

**Use when:** building or changing the creation flow.

## Inputs
- Brief fields (name, age, loves, occasion, optional note); vibe presets; shared Zod schema.

## Procedure
1. Build ≤5 steps; each validates inline before "Next" (React Hook Form + Zod).
2. Vibe/genre = selectable preset cards with a short audio sample each. NO free-text "describe the music" field.
3. Autosave draft to `song_briefs` (keyed to session/anon user); survive refresh.
4. Moderation pre-check on free-text before submit.
5. Full a11y: keyboard nav, labels, focus states.
6. On complete, persist the brief and advance to preview/checkout.

## Output
- The wizard components + draft persistence.

## Dependencies
- Libraries: React Hook Form, Zod, Zustand, shadcn/ui. Skills: `write-zod-schemas`, `setup-state-management`, `create-api-route-handler`.

## References
- [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/) · [Zustand](https://zustand.docs.pmnd.rs/)

## Guardrails
- Curate, don't configure. No open-ended prompt field — escalate any request to add one.
