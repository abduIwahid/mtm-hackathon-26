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
- Follow-ups shipped same day: skeleton loader on the first assessment run (pulse blocks mirroring the result layout, shown only while no plan exists), OG/Twitter card meta on all pages with a branded og-card.png, a styled 404.html, and PWA support (manifest + icons + service worker; pages network-first, /api never cached; install button appears only when the browser offers it).

## Design system v4 "Neubrutalism" (2026-11-21, Wadi's pick from a preview)
- Cream paper #FFF4E4, ink #111110 frames: 3px black borders + hard offset shadows everywhere, zero blur. Clashing blocks: yellow header, pink primary buttons, blue secondary, area cards cycle pink/blue/yellow/green/orange. Headline carries a pink highlight block. Meter is striped orange.
- Dark mode kept as the inverted-frames variant: near-black ground, cream borders, black shadows, bright blocks unchanged.
- Dashboard restyled to match (ink sidebar, blue data accent, yellow/pink chips, hard shadows). OG card + app icons regenerated in the same style; theme colour is now the header yellow.
- Note: the v3 rewrite had silently broken the footer link columns (wrong markup structure assumed); v4 styles the real .in/.foot-links structure - footer verified visually this round.
