---
description: Implement the single lib/engine/generateSong(brief) module wrapping the licensed ElevenLabs Eleven Music API — the ONLY place the music vendor is called. Use for any music-generation work. Never use an unofficial Suno API.
---

# integrate-elevenlabs-music

**Purpose:** Provide the one engine-agnostic wrapper for music generation, so the vendor can be swapped in a single file.

**Use when:** building or changing how songs are generated.

## Inputs
- A `song_brief` (name, occasion, vibe, lyrics); engine params.

## Procedure
1. Create `lib/engine/generateSong(brief)` — the sole caller of the ElevenLabs SDK.
2. Submit an async generation job; return a normalized `{ engineJobId }`.
3. Completion arrives via the ElevenLabs webhook (see `handle-elevenlabs-webhook`), which stores audio and flips status.
4. Normalize output (audio URL/bytes, duration, title) behind an engine-agnostic interface.
5. Keep all vendor secrets server-side.

## Output
- `lib/engine/generateSong.ts` + a clean internal interface.

## Dependencies
- Library: ElevenLabs JS SDK. API: ElevenLabs Music (`ELEVENLABS_API_KEY`).
- Skills: `integrate-lyrics-generation`, `setup-storage-signed-urls`, `async-job-orchestration`, `handle-elevenlabs-webhook`.

## References
- [Eleven Music API](https://elevenlabs.io/music-api) · [ElevenLabs API ref](https://elevenlabs.io/docs/api-reference/introduction)

## Guardrails
- LICENSED engine ONLY. NEVER integrate an unofficial/reverse-engineered Suno API. No other module may call the vendor SDK directly. Escalate any change that raises per-song COGS.
