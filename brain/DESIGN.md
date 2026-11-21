# Design

Tokens live in boilerplate/app/globals.css. Solid colours only, no gradients.
If a reference design is used, record here: source, tokens taken, what was changed.
Taste format: Design Map + 3–4 Taste DNA trade-offs (Trigger → Decision →
Reason → Evidence) before building. Polish hour: Hallmark audit (ranked punch
list) + Impeccable polish/audit, one batch, then stop. No italic headers,
no invented metrics, no re-drawn chrome. Breakpoints + the 320–1920 overflow check before freeze.

## Design system v3 (2026-11-21, post-hackathon polish round)
- Type: Archivo (UI) + JetBrains Mono (figures/labels) via Google Fonts, system fallbacks.
- One shared token layer in demo/style.css: colours (unchanged palette), shadow scale, house ease cubic-bezier(.22,.8,.3,1), radii.
- Primary buttons are the teal accent; every interactive element has hover + active-press + focus-visible states; tap targets >=44px.
- Motion: one-shot reveals with per-child stagger inside .rv containers; meter fills transition; marquee pauses on hover; full prefers-reduced-motion kill switch.
- Home hero carries a "sample plan" card — the planner's real verified output on the brief's pack (Rs 547,400 of Rs 650,000, 6/6 checks) — product first, no stock imagery.
- Verified: no horizontal overflow on 7 pages x 9 widths (320-1920), light + dark, before deploy.
