---
type: session-log
project: Trimax7 Portfolio
date: 2026-08-19
status: deployed
tags:
  - portfolio
  - web
  - single-file
  - gsap
  - threejs
  - lenis
  - ui-polish
  - vercel
---

# Session — Trimax7 Portfolio (Phase 1–3)

## Objective

Build and polish a premium single-file portfolio for Taimoor / Trimax7 that lands clients:
design-first, technically impressive, honest (no fake testimonials/stats), fully responsive,
and deployed.

## Deliverables this session

### Phase 1 — Design & architecture (document)
- Concept approved: **"KINETIC SPEC"** — technical-editorial, near-black + electric lime + cyan.
- Type: Instrument Serif (display) + Space Grotesk (UI) + JetBrains Mono (labels/data).
- Stack: single self-contained `index.html` (CDN GSAP 3.12.5, ScrollTrigger, Lenis, Three.js r128).

### Phase 2 — Implementation (`index.html`, ~1,650 lines)
Sections: preloader → floating pill nav + spy → full-screen menu → hero (masked serif headline +
3D wireframe core) → pinned horizontal work gallery (5 live projects) → services (8 outcome-first rows)
→ process (5 steps, scroll rail) → about (word-scrub quote) → stack (SVG constellation) → Upwork trust card
→ CTA ("Let's build something memorable") → footer (year clock, local time).

### Phase 3 — Brutal audit + premium polish
- Hero: technical grid backdrop, de-neoned 3D (removed glow sphere/inner mesh, cut opacities),
  clean 3-line headline that never wraps, globe no longer zooms on scroll, short-viewport fallback.
- Real bugs fixed: process rail node alignment, mobile menu `inert`, WebGL try/catch, section-head selector.
- Projects: per-project micro-labels (Booking flow / Lead capture / Fleet showcase / Online booking /
  Consultation intake), stat-bar mockup strips, JSON-LD synced to 5 live projects.
- Micro-interactions: magnetic CTAs, link underlines, arrow nudges, subtle button glow.
- Cleanup: dead CSS/tokens removed, `color-scheme: dark`, `scroll-margin-top`.

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
- Commit: `ef2a747` — "feat: trimax7 portfolio — single-file premium portfolio with 5 live demos, GSAP/Lenis/Three.js, full responsive + a11y"

## Files Touched
- `index.html` — entire portfolio (single file).
- `Session Notes/2026-08-19 Portfolio Session.md` — this log.
- `.obsidian/` — vault config for this folder.

## Next Steps
- Final visual QA pass in browser (320→1920px, reduced-motion, touch).
- Add OG image (`og.jpg`) and point `og:image` meta to a real asset.
- Swap `hello@trimax7.com` placeholders if a custom domain is added later.