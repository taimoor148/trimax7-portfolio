# Trimax7 — Portfolio

Single-file portfolio for **Taimoor Mateen / Trimax7** — premium websites, AI-powered interfaces, and the automation systems behind them.

## What's inside

One self-contained `index.html` (~4,700 lines) with:

- **Motion** — GSAP 3.12.5 + ScrollTrigger, Lenis smooth scroll, Three.js wireframe core, canvas background field, section-reactive ambient colour, and a motion pause toggle (CDN).
- **Sections** — preloader, floating pill nav + full-screen menu, hero, pinned horizontal work gallery, capabilities, process journey, about, stack constellation, hiring, contact form, footer.
- **Work** — five live builds with real desktop + mobile screenshots: Glitz & Glam (Luxe & Bloom), Built Solid (PrimeBuild), VELOCE, Sharp & Fade, Justice Desk. Each card links to the live site and expands inline details.
- **Capabilities** — three interactive panels: wireframe/interface/responsive browser switcher, cursor-reactive neural interface, and an animated lead-to-CRM workflow diagram.
- **Process** — scroll-synced five-stage journey with progress ring, stage glyphs and sticky visual on mobile.
- **Stack** — 17 tools in a filterable SVG constellation (desktop) and an accordion list (mobile).
- **Contact** — real inquiry form wired to the LeadPilot AI CRM through a Supabase RPC (`contact-form.js`), with honeypot, time-on-form, validation, duplicate and rate-limit guards.
- **Analytics** — privacy-first anonymous visitor tracking (`analytics.js`): no cookies, IP, user-agent or fingerprinting; honours DNT/GPC; opt-out via `localStorage["trimax7:analytics-optout"]`.
- **Accessible** — skip link, focus states, focus-trapped menu with inert background, semantic headings, reduced-motion support, and no-JS fallbacks for work and stack content.
- **Responsive** — verified 320 → 1920px with zero horizontal overflow, including short-landscape phones.

## Files

```
index.html                  entire portfolio (styles, markup, motion)
analytics.js                anonymous visitor tracking (LeadPilot AI, Stage 3)
contact-form.js             contact form → LeadPilot AI CRM (Stage 2)
assets/work/                real project screenshots (WebP served, JPG source)
Session Notes/              build history
```

## Deploy

Static site — deploy the repository root to any static host (Vercel, Netlify, Cloudflare Pages).

- Production: https://trimax7-portfolio.vercel.app
- Repo: https://github.com/taimoor148/trimax7-portfolio

## Contact

- Email: taimoormateen80@gmail.com
- Upwork: https://www.upwork.com/freelancers/~0140fb2d4324cae6a4
- Contra: https://contra.com/taimoor_mateen_gieqp6oh/work?r=taimoor_mateen_gieqp6oh

## Session log

See `Session Notes/` for the build history.
