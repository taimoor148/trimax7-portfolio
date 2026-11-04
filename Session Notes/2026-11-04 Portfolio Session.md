---
type: session-log
project: Trimax7 Portfolio
date: 2026-11-04
status: verified
tags:
  - portfolio
  - web
  - single-file
  - phase6
  - gsap
  - threejs
  - lenis
  - crm
  - analytics
  - a11y
  - vercel
---

# Session — Trimax7 Portfolio (Phase 6 immersive redesign + CRM/analytics backfill)

## Objective

Finish and verify the in-progress Phase 6 redesign, close the accessibility and
no-JS gaps it introduced, document the unlogged October CRM/analytics work, and
commit the whole state so the live deployment can be updated.

## Backfill — unlogged October work

Two commits landed after the 2026-08-27 note without a session log:

- **2026-10-29 — `0b25e2d`**: contact form connected to the LeadPilot AI CRM.
  `contact-form.js` submits through the existing public `create_lead_from_form`
  RPC. Client layers: honeypot, minimum time-on-form, field validation, link-spam
  heuristic, in-flight + 2-minute duplicate guard; the database adds a
  per-form rate limit.
- **2026-10-30 — `00af9ab`**: anonymous visitor tracking (Stage 3).
  `analytics.js` sends page views, CTA clicks and form starts to LeadPilot.
  Privacy model: no cookies, IP, user-agent or fingerprinting; referrer is
  hostname-only; visitor/session IDs are random UUIDs in local/session storage;
  DNT + GPC respected; opt-out key `trimax7:analytics-optout`.

Both scripts are referenced from `index.html` with `defer` and are already in
the repository.

## Phase 6 — what the redesign added

### Work gallery
- Replaced generated/browser mockups with **real screenshots** for all five
  projects, desktop + mobile, in `assets/work/` (WebP served, JPG source).
- Editorial case cards: ghost index, category/status row, clipped screenshot
  curtain, floating device phone, micro/stack/status meta, per-project accent
  variables.
- Inline **Details** disclosure per project (animated height, `aria-expanded`
  + `aria-controls`), plus live-site links throughout.
- Pointer 3D tilt on cards (desktop, fine pointer, motion on).

### Capabilities (replaces the services list)
- Three interactive panels:
  1. **Creative website design & build** — browser switcher between
     Wireframe / Interface / Responsive states (`data-mode` on `#vbWindow`).
  2. **AI-powered web development** — cursor-reactive neural canvas
     (`buildNeural`) with a generated-interface overlay.
  3. **Business & CRM automation** — animated four-node workflow diagram
     (capture → qualify → record → follow up) with hover/focus captions and a
     travelling pulse.

### Process journey
- Replaced the old step rail with a sticky SVG progress ring, five stage glyphs,
  scroll-synced active/done states, stage word + meta readout, and a fill rail
  (`initProcessJourney`). On mobile the visual is sticky above the steps.

### About / Stack / Hire
- About: new editorial statement with word-by-word scrub, identity table,
  body copy, and three art cards (design / development / automation) with tilt.
- Stack: 17 tools, five categories, filter pills, animated re-layout of the
  constellation, per-node descriptions, mobile accordion fallback.
- Hire: Upwork-first card with scope/protection/direct-communication points and
  a Contra link.

### Site-wide motion and chrome
- Canvas background field (`initBgField`) + `--amb-a/--amb-b` section-reactive
  ambient gradients, driven by the active project accent.
- New labelled side rail, progress bar, floating nav with **Motion** pause
  toggle (persisted in `localStorage["taimoormateen-motion"]`).
- Contact section rebuilt around the real CRM form, with live status messaging,
  consent line and privacy link.

## Fixes in this session

1. **Mobile menu accessibility**
   - Added `role="dialog"`, `aria-modal="true"` and an accessible label.
   - Background regions (`main`, footer, side rail, nav) now get `inert` while
     the menu is open and are restored on close.
   - Added a Tab/Shift+Tab focus trap; focus moves to **Close** on open and
     returns to the **Menu** button on close/Escape.
   - Menu links close without stealing focus back to the nav; resize above
     1024px closes safely.

2. **No-JS fallbacks**
   - Work section now lists the five live builds with categories when JS is off.
   - Stack section lists all five groups and their tools.
   - `noscript` styles hide the preloader, cursor, progress bar, motion/menu
     buttons, side rail, work progress, stack readout and empty WebGL stage;
     the hero remains fully visible.

3. **Short-landscape hero**
   - `@media (max-height: 520px) and (min-width: 681px)` compacts the headline,
     hides the sub-copy/satellites/scroll cue/3D stage and trims spacing, so the
     hero fits inside a 390px-tall viewport.

4. **Heading hierarchy**
   - Footer column headings `h4 → h3`; the hire sub-heading `h2 → h3`.
   - Removes the remaining `h2 → h4` jump in the accessibility tree.

5. **README**
   - Rewritten to match the Phase 6 build, the real files, CRM/analytics
     integrations, accessibility behaviour and deployment URLs.

## Verification

Headless Edge (`puppeteer-core`) against the local static build, plus a manual
screenshot review of every section on desktop and mobile.

- **Viewports:** 320, 390, 768, 1024, 1440, 1920, 844×390 landscape.
  Horizontal overflow **0** at every size; hero fits every viewport.
- **Console:** zero page errors, zero console errors, zero failed requests.
- **Interactions verified:** capability tabs (wire/ui/responsive), workflow
  hover/focus captions, project Details open/close, stack filter + dimming,
  mobile stack accordion, nav anchor scrolling, motion toggle, menu open/close.
- **Menu:** 12 Tab presses and Shift+Tab stay inside the dialog; `inert` is
  applied to background regions while open, removed on close; Escape restores
  focus to the Menu button.
- **Form:** empty submit shows three inline field errors plus the consent
  message, focuses the name field, and makes no network call.
- **Images:** all 10 screenshots load (1440×900 desktop, 780×900 mobile).
- **Reduced motion:** hero content visible, no errors, no overflow.
- **No-JS:** preloader hidden, hero visible, 5 work links + 5 stack groups
  rendered, non-functional controls hidden.
- **Content audit:** no duplicate IDs, no unnamed buttons, no missing image
  alts, no `target="_blank"` without `rel="noopener"`.

## Files touched this session

- `index.html` — Phase 6 markup/styles/motion, menu focus management, no-JS
  fallbacks, short-landscape rules, heading hierarchy.
- `assets/work/*` — ten real project screenshots (WebP + JPG source).
- `README.md` — rewritten for the current build.
- `Session Notes/2026-11-04 Portfolio Session.md` — this log.

## Next steps

- Push and let Vercel rebuild production: https://trimax7-portfolio.vercel.app
- Replace the `https://trimax7.dev/` canonical/`og:image` placeholders and add a
  real `og.jpg`, or point them at the Vercel URL.
- Optional: drop the unused JPG sources from the deployed artifact to trim
  payload (the site only references WebP).
- Optional: add a session-log index note if the folder keeps growing.
