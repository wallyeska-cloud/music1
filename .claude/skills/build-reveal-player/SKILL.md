---
description: Build the premium song "reveal" experience — cover art, animated/synced lyrics, waveform player (play/scrub/download), tap-to-reveal, mobile-first, prefers-reduced-motion aware. Use for the song page. This is the product's emotional core.
---

# build-reveal-player

**Purpose:** Make the first listen a keepsake moment, not a file download.

**Use when:** building or changing the song reveal page/player.

## Inputs
- Song data (title, lyrics, signed stream URL, cover); entitlement.

## Procedure
1. Layout: cover art, child's name as title, animated/synced lyric display.
2. Custom audio player with waveform scrub (wavesurfer.js): play/pause, seek, download (entitled only).
3. Optional tap-to-reveal "curtain" for playing to the child/family.
4. Mobile-first, premium; respect `prefers-reduced-motion`.
5. Stream via signed URL; never expose raw paths.

## Output
- The reveal page + player component.

## Dependencies
- Libraries: `wavesurfer.js`, shadcn/ui, TanStack Query. Skills: `setup-storage-signed-urls`, `build-realtime-status`.

## References
- [wavesurfer.js](https://wavesurfer.xyz/) · [HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)

## Guardrails
- The reveal IS the product — escalate any change that diminishes the moment. Download gated on entitlement.
