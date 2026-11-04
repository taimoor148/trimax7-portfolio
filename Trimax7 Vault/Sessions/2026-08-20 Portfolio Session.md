---
type: session-log
project: Trimax7 Portfolio
date: 2026-08-20
status: deployed
tags:
  - portfolio
  - web
  - single-file
  - gsap
  - threejs
  - lenis
  - phase5
  - ui-polish
  - vercel
---

# Session — Trimax7 Portfolio (Phase 5: Award-Level Experience)

## Objective

Transform the existing single-file portfolio section by section into an award-level,
cohesive interactive experience — without touching the hero design (kept as the quality
benchmark), no random 3D, no invented results/testimonials/stats, no mobile horizontal
overflow, performance-first (rAF, IntersectionObserver, reduced-motion, mobile fallbacks).

## Deliverables this session

### Phase 5 — Unified motion system
- Fixed drifting `.page-grid` behind the whole page (`gridDrift` rAF) — sections read as one continuous surface.
- Ghost section numbers (`01`–`06`) behind every heading with parallax (`initParallax`), `.section-head .head-row` restructure.

### Section transformations
- **WORK** — editorial showcase: `buildProjects()` now emits `.project-num` ghost, `.case-top` (`.case-index`, `.case-status`), `.project-mask` clip-path reveal, `.case-foot`/`.case-cta`, per-project accent vars `--pa`/`--pa-line`. Reveal trigger `start: "left 100%"` with `if (i === 0) return;` so the first card is never stuck hidden.
- **SERVICES** — `.service-num`, `.sv-num` ghost, `.service-title`, `.service-reveal`, `.service-tags`; `.sv-glow` cursor-follow lime glow via `initServiceGlow()`.
- **PROCESS** — `.step-ghost` stage numbers, `.process-cursor` + `.process-fill` scroll-synced rail via `initProcessCursor()`, `.is-active`/`.is-done` states.
- **ABOUT** — ghost "04", word-by-word quote scrub (lime + text-shadow), `.about-stats`, `.ring-orb` parallax, `data-tilt`.
- **STACK** — `STACK_DESC` map, filter pills (All / Development / Design / AI / Automation / CRM & Growth), node breathing pulse, click-to-expand tool description in `#stackNote`.
- **UPWORK** — `.u-inner` grid, verified badge + check, shine sweep, numbered proof list, dashed orbit ring.
- **CTA** — `.cta-field` mouse-follow dual gradient (`initCtaField`, `--mx/--my`), animated sweep.

### Fixes after implementation
- **Mobile overflow (was 108px)** — culprits `.sv-glow`, `.pg-glow`, `.ring-orb`, `.cta-field`; now hidden ≤680px. Verified **0 overflow** on 390px + desktop.
- **Demo cards oversized** — `.project` 1080px → `min(78vw, 900px)`; preview ratio 16/10 → **16/9**; card fits fully inside viewport (~897px), badge/word never clipped.
- **Hero left column incomplete** — content grew past 100svh after adding intro + facts; bottom row (meta) was falling below the fold and overlapping the scroll/rule line. Tightened margins (h1/ctas/meta/facts), compact mobile hero (facts → single row), `hero-scroll` hidden ≤900px height, `hero-rule` repositioned. Hero now fits exactly in one viewport on desktop + mobile with no overlap.

## Verification
- Puppeteer-core + Edge headless: JS syntax OK; desktop + mobile zero console/page errors.
- All sections render at every scroll step; hero masks revealed, intro + 4 facts present.
- Mobile horizontal overflow: **0** on 390px; desktop overflow: **0**.

## Live projects wired into the portfolio
1. Glitz & Glam — https://glitz-glam-salon.vercel.app
2. Built Solid (construction) — https://construction-website-bice-pi.vercel.app
3. VELOCE (automotive) — https://veloce-website-azure.vercel.app
4. Sharp & Fade (barbershop) — https://sharp-and-fade.vercel.app
5. Justice Desk (legal) — https://law-website-flame.vercel.app

## Contact
- Email (CTA/footer): taimoormateen80@gmail.com
- Upwork: https://www.upwork.com/freelancers/~0140fb2d4324cae6a4

## Deploy
- Repo: taimoor148/trimax7-portfolio — **PRIVATE** (https://github.com/taimoor148/trimax7-portfolio)
- Vercel production: **https://trimax7-portfolio.vercel.app**
- Vercel inspect: https://vercel.com/taimoormateen80-gmailcoms-projects/trimax7-portfolio

## Files Touched
- `index.html` — entire portfolio (single file, ~2,300 lines after Phase 5).
- `Trimax7 Vault/Sessions/2026-08-20 Portfolio Session.md` — this log.
- Screenshots taken for QA were deleted at the user's request.

## Next Steps
- Final visual QA pass in browser (320→1920px, reduced-motion, touch).
- Add OG image (`og.jpg`) and point `og:image` meta to a real asset.
- Custom domain + swap `hello@trimax7.com` placeholders if desired.