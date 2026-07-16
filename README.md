# EZE — AI Music Studio (Front-End MVP)

Describe a song → the app generates it via the Suno API → play and download the tracks.
Built with **Next.js 14 (App Router)** + **Tailwind**. No database. Deploys to **Netlify**.

> ⚠️ **Prototype note.** This MVP uses the unofficial `sunoapi.org` service. It is a
> throwaway prototype for validation only — see `research/viability-analysis.md` for why
> the production plan uses a *licensed* engine instead.

## How it works

- The browser calls our own server routes; the Suno key is **never** exposed client-side.
  - `POST /api/generate` → starts a Suno generation, returns a `taskId`.
  - `GET /api/status?taskId=…` → polls Suno for progress + finished audio.
  - `POST /api/callback` → no-op (Suno requires a callback URL; we poll instead).
- The UI (`app/page.tsx`) collects a description, starts generation, shows an
  animated "creating" state, then renders playable/downloadable tracks.

## Run locally

```bash
npm install
cp .env.example .env   # then paste your SUNO_API_KEY into .env
npm run dev            # http://localhost:3000
```

## Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `SUNO_API_KEY` | ✅ | Your sunoapi.org key. Server-side only. |
| `SUNO_API_BASE` | — | Defaults to `https://api.sunoapi.org`. |
| `SUNO_CALLBACK_URL` | — | Optional; defaults to a placeholder (we poll for results). |

`.env` is gitignored and must **never** be committed. Set `SUNO_API_KEY` in Netlify too.

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from GitHub** and pick the repo.
3. Build command `npm run build` (auto-detected); Netlify adds the Next.js runtime.
4. **Site settings → Environment variables → add `SUNO_API_KEY`** with your key.
5. Deploy.

## Credits

Designed & developed by **Ana Zuliani**.
