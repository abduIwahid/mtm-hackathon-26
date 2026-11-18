# MTM Hackathon '26 — Team AXIONS

**Event:** MTM Hackathon '26 (Mind-to-Machine), GDG On Campus CUI Wah — Wednesday 18 November 2026, Study Hall, CUI Wah Campus.
**Team:** AXIONS — GDG On Campus CUI Attock. Lead + presenter: Abdul Wahid.
**Problem statement:** Revealed 10:00 AM on the day — this README is updated with the project name, one-liner and demo link as soon as the build starts.

## Status

Scaffold is set up and ready before the reveal: design tokens, AI plumbing, UI states and the project brain are all in place, so the 3.5-hour build window (10:30 AM – 2:00 PM) goes entirely into the product.

## What is wired already

- Next.js 15 + Tailwind shell, design tokens in `app/globals.css` (solid colours, one accent, no gradients)
- `/api/ai` — AI fallback chain (Gemini → Groq) in `lib/ai.ts`, so a single provider outage cannot kill the demo
- Loading / empty / error UI states in `components/States.tsx`
- Optional Supabase client in `lib/supabase.ts` (null-safe — the app runs without it)
- `brain/` — the living project brain: PRD, architecture, build plan, demo data, judge Q&A and submission notes, updated after every step

## Run locally

1. Copy `.env.example` to `.env.local` and fill in the keys.
2. `npm install`
3. `npm run dev`

## Deploy

Push to `main` → Vercel auto-deploys. Live URL is added here at freeze time (1:30 PM).

## License

MIT — see `LICENSE`.
