---
description: Screen all user free-text and generated lyrics against a moderation policy before/after generation, block disallowed content with a friendly message, and log to moderation_events. Use for any user text or lyric content. Elevated importance — child audience.
---

# integrate-content-moderation

**Purpose:** Keep a kids' product safe and lawful by screening inputs and outputs.

**Use when:** accepting user free-text or producing lyrics.

## Inputs
- Text + context (`brief_text` | `lyrics`).

## Procedure
1. On brief submit, moderate user free-text (names, notes) BEFORE generation.
2. After lyric generation, moderate the lyrics BEFORE they reach the engine/user.
3. On block: stop the flow, show a friendly message, log an `allow|block|flag` verdict to `moderation_events`.
4. Disallow hate, sexual, real-person impersonation of non-owned individuals, etc.

## Output
- A verdict + logged event; blocks halt generation.

## Dependencies
- API: a moderation endpoint (provider TBD). Skills: `integrate-lyrics-generation`, `create-api-route-handler`.

## References
- [OpenAI Moderation](https://platform.openai.com/docs/guides/moderation) · [Anthropic content moderation](https://docs.claude.com/en/docs/about-claude/use-case-guides/content-moderation)

## Guardrails
- Moderation is mandatory on BOTH input and generated output. Never skip it for a child-facing artifact.
