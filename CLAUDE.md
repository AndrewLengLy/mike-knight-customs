# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The marketing website for Mike Knight Customs (MKC), an OEM collision repair, paint/ceramic coating, and insurance-advocacy shop in Chico, CA. It is a static HTML/CSS/JS site with **no build system, package manager, or test suite** — every page is hand-authored HTML that links a shared stylesheet and script. Deployed on Vercel as a static site.

## Commands

There is no build/lint/test tooling (no `package.json`). To preview locally, serve the directory as static files, e.g.:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/index.html`. There is nothing to compile — edits to `.html`/`.css`/`.js` are live on refresh.

## Architecture

### Page structure
- `index.html` — Homepage
- `oem-advocacy.html` — OEM Advocacy pillar page (insurance claims advocacy)
- `services/collision-frame-repair.html` — Structural/frame repair, ADAS recalibration
- `services/paint-coating-detailing.html` — Paint matching, ceramic coating, detailing
- `contact.html` — Quote request form, shop info, map, insurance carrier logos
- `standalone/` — **Self-contained single-file duplicates** of `index.html` and `oem-advocacy.html`, with `css/mkc.css` and `js/mkc.js` inlined directly into `<style>`/`<script>` tags instead of linked. These exist for instant, dependency-free preview (e.g. dropping into a design tool or sharing a single file). **They must be kept in sync by hand** — if you edit shared markup/behavior on the equivalent full page, port the same change into the matching `standalone/` file, and vice versa.
- `ARCHITECTURE.md` — the design-system brief (navigation hierarchy, tokens, page blueprints for the pillar pages). Read this before making structural or visual changes; it documents *why* the layouts are shaped the way they are, not just what's on screen.
- `vercel.json` — 301 redirect rules for retiring old URLs to their new pillar-page destinations.

### Shared assets
- `css/mkc.css` — the entire design system: CSS custom-property tokens (`--ink`, `--line`, `--mkc-green`, spacing/type scale), reset, typography utilities (`.display`, `.data`, `.eyebrow`, `.lede`), layout primitives (`.wrap`, `.grid-12`), and reusable components (nav, footer, `.meta-point`, `.readout`, `.spec-frame`, `.compare`, `.matrix`, `.step`, form styles). Linked by every top-level page.
- `js/mkc.js` — shared behaviors: mobile nav toggle, `IntersectionObserver`-driven scroll reveals (`.reveal` → `.is-in`), and the draggable before/after `[data-compare]` photo comparator. Respects `prefers-reduced-motion`.
- Each page also has a page-scoped `<style>` block in its own `<head>` for layout unique to that page (hero grids, section-specific rules). Global/reusable rules belong in `css/mkc.css`; one-off layout for a single page stays inline in that page's `<head>`.
- The homepage additionally has an inline `<script>` block (review carousel data + logic, quote-form submit handler) that is homepage-specific and not shared via `js/mkc.js`.

### Design system conventions (see `ARCHITECTURE.md` for full detail)
- Direction: "Luxury Minimalist / Mechanical Grit" — deep ink backgrounds (`--ink`), 1px structural borders (`--line`) instead of box-shadows, editorial asymmetric grids, monospace data readouts.
- Type stacks are role-based, not interchangeable: `--f-display` (Anton, uppercase headlines only), `--f-body` (Archivo, body copy), `--f-data` (IBM Plex Mono, uppercase/tracked — used for all metrics, labels, eyebrows, buttons).
- `--mkc-green` is a single accent color used sparingly for focus points (links, live data, CTAs) — don't introduce other accent colors.
- Named components (`.meta-point`, `.readout`, `.spec-frame`, `.compare`, `.matrix`, `.step`) are the vocabulary for recurring content patterns (spec rows, data tables, before/after sliders, comparison tables, numbered process steps). Reuse them rather than inventing new one-off patterns for the same kind of content.

### Forms & third-party integrations
- The quote-request form on `contact.html` (and homepage) posts to Web3Forms (`https://api.web3forms.com/submit`) and is progressively enhanced with a JS submit handler that shows inline status (`.form__status.is-ok` / `.is-err`) instead of a page navigation. It includes a honeypot field (`form__botcheck`) for spam mitigation — preserve this if editing the form.
- Every page, including the `standalone/` copies, loads Vercel Web Analytics via the `window.va` snippet + `/_vercel/insights/script.js`. Keep this block when duplicating a page.
- Fonts (Anton, Archivo, IBM Plex Mono) are loaded from Google Fonts via `<link>` tags in each page's `<head>` — `standalone/` pages must keep these too since they can't rely on the shared stylesheet's imports.

### Navigation & IA
- Primary nav is duplicated in the `<nav>` markup of every page (no templating/includes exist). The "Services" item is a dropdown (`.nav__toggle` / `.nav__menu`) linking the two service pillar pages plus OEM Advocacy. When adding/removing/renaming a page, update the nav block in **every** HTML file (top-level pages and `standalone/` copies).
- The site intentionally consolidates services into three pillar pages (Collision & Frame Repair, Paint/Coating/Detailing, OEM Advocacy) rather than many thin pages; old baseline URLs are 301-redirected via `vercel.json` — add a redirect there instead of leaving a dead route if a page is retired or renamed.

## Conventions when editing

- No JS framework, no bundler, no CSS preprocessor — everything is hand-written vanilla HTML/CSS/JS. Keep new code dependency-free and consistent with that.
- Use existing CSS custom properties and utility classes from `css/mkc.css` before adding new raw values; check the tokens table in `ARCHITECTURE.md` first.
- BEM-ish naming is used throughout (`.hero__grid`, `.nav__burger`, `.compare__handle`, `is-` prefix for state classes like `is-open`, `is-in`, `is-active`). Follow this pattern for new markup.
- Accessibility touches already in place that should be preserved: `aria-expanded`/`aria-haspopup` on the nav toggle, `aria-current="page"` on the active nav link, `aria-live="polite"` on the form status region, `prefers-reduced-motion` handling in both CSS and JS.
