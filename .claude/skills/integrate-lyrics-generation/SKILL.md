---
description: Generate kid-safe, personalized lyrics from a brief via the Anthropic API with a locked safety system prompt, then hand them to the music engine. Use when producing song lyrics.
---

# integrate-lyrics-generation

**Purpose:** Turn a brief into safe, personalized lyrics for the child hero.

**Use when:** generating lyrics before music generation.

## Inputs
- Brief fields (child name, age, loves, occasion, vibe); the kid-safe system prompt.

## Procedure
1. Call the Anthropic API (Claude) with a locked, kid-safe system prompt and the brief.
2. Produce lyrics + a title (e.g., "Ava the Brave").
3. Run the result through moderation (see `integrate-content-moderation`) before use.
4. Pass approved lyrics to `generateSong()`.

## Output
- Lyrics string + title, pre-screened for kid safety.

## Dependencies
- Library: `@anthropic-ai/sdk`. API: Anthropic (`ANTHROPIC_API_KEY`).
- Skills: `integrate-content-moderation`, `integrate-elevenlabs-music`.

## References
- [Anthropic API](https://docs.claude.com/en/api/overview) · [SDKs](https://docs.claude.com/en/api/client-sdks)

## Guardrails
- Child audience: the safety prompt is not optional, and generated lyrics must pass moderation before they reach the engine or the user.
