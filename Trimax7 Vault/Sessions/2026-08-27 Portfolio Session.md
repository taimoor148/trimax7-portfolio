---
type: session-log
project: Trimax7 Portfolio
date: 2026-08-27
status: deployed
tags:
  - portfolio
  - web
  - single-file
  - gsap
  - threejs
  - lenis
  - micro-polish
  - hero-reveal
  - vercel
---

# Session — Trimax7 Portfolio (Micro-Polish Pass + Safe Hero Reveal)

## Objective

Make the whole single-file portfolio feel more "impressive" with a low-risk
**micro-polish pass** — subtle refinements per section, no invented
results/testimonials/stats, no random 3D. Also fix the hero visibility issue
once and for all with a robust, animation-fail-safe reveal.

## Deliverables this session

### Trust (Upwork / Contra) section redesign
- Card dropped `data-tilt`; added `.ub-ghost` "06", `.u-verify-row` (Upwork + Contra verified badges), `.u-kick` "Trust, verifiable", 4 proof points, right column `.u-platforms` with two `.u-card` links:
  - Upwork: `https://www.upwork.com/freelancers/~0140fb2d4324cae6a4`
  - **Contra (new):** `https://contra.com/taimoor_mateen_gieqp6oh/work?r=taimoor_mateen_gieqp6oh`
- removed old conflicting `.upwork-card` grid CSS block; rewrote phase-5 block (`.u-inner` grid 1.25fr 1fr balanced, `.ub-ghost`, `.u-card::before` top highlight, grid texture mask + layered gradient card backgrounds).

### Hero visibility fix (robust / fail-safe)
- Removed CSS-default hidden states (`.hero .mask > span` translateY(110%), `.hero-kicker` opacity 0) and the forced `gsap.set yPercent:110`.
- `init()` now toggles `body.anim` / `body.no-anim`; `initHero()` uses `gsap.from(...)` instead of `.to(...)`.
- Result: **hero content is visible even if GSAP/CDN or reveal ever fails.**
- Hero left content rewritten: kicker "Taimoor · Trimax7 — Web · AI · Automation", masked H1 "I'm Taimoor — / I build premium / digital experiences.", `.hero-intro` role line, trimmed `.hero-sub`.

### Micro-polish pass
- **Section-head reveal restore** — earlier hero fix had removed the `yPercent:110` hidden state that section headings relied on, silently killing their clip-reveal. Converted `initReveals` `.section-head h2` from `.to(yPercent:0)` → `gsap.from(yPercent:115)` (safe, always-visible fallback).
- **New safe reveals** (`gsap.from` in `initReveals`):
  - `.about-copy > p` fade-up, `.about-stats` fade-up
  - `.upwork-proof li` x-slide-in, `.u-card` fade-up (platform cards)
  - `.step` (process) fade-up
- **Process hover** — `.step h3` lime color + 6px translate on hover.

## Verification
- Puppeteer-core + Edge headless, desktop (1440) + mobile (390):
  - Desktop overflow **0**, mobile overflow **0**, zero console/page errors.
  - After full-page scroll: `.service-row`, `.about-stats`, `.u-card`, `.step` all opacity 1 (reveals complete).
  - Mobile hero DOM: heading/intro/sub/CTAs all visible, opacity 1, no covering overlay, no overflow.

## Deployment (phone-viewable)
- Root cause of "mobile hero not showing": viewing the local `file:///F:/...` file on a real phone — `F:` drive does not exist on a phone, so `file:///` can never load there. The fix is the **live Vercel deployment**.
- Committed `fix: safe hero reveal (gsap.from) + restore section-head reveal, micro-polish reveals and hover states`.
- Pushed to GitHub `main` (`taimoor148/trimax7-portfolio`).
- Live: https://trimax7-portfolio.vercel.app (production deploy via linked Vercel project `trimax7-portfolio`).

## Contact
- Email (CTA/footer): taimoormateen80@gmail.com
