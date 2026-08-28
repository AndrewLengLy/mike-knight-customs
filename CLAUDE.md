# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

The marketing site for Mike Knight Customs (MKC), an OEM collision repair, paint
and ceramic coating, and insurance advocacy shop in Chico, CA. Built by Parabox
Digital.

It is hand written static HTML, CSS and JS. **There is no build step and no
bundler: the files in this repo are exactly what ships.** Deployed on Vercel.

Two `package.json` files exist and neither one builds the site:

- Root `package.json` exists only so Vercel can compile `middleware.ts`. It has
  no build script. **Do not add one.**
- `tools/package.json` is local image tooling. It is `.vercelignore`d and never
  reaches the CDN.

## Commands

Serve the directory as static files. There is nothing to compile, so edits to
`.html`, `.css` and `.js` are live on refresh.

```
python3 -m http.server 4188
```

`.claude/launch.json` defines this as the `mkc` preview target on port 4188.

Note that `middleware.ts` does not run under a plain static server, so the
`mkc_geo` cookie is absent locally and the consent layer treats you as a
restricted visitor. That is the intended failure direction, not a bug.

Two checks, both run by hand:

```
node tools/check-legal-dates.mjs
```

Run before committing any change to `privacy.html`, `terms.html` or
`accessibility.html`. It exits non-zero if a page's visible "Last Updated" row
and its JSON-LD `dateModified` disagree.

```
cd tools && npm install     # once
node tools/optimize-images.mjs [--check]
```

Regenerates the AVIF layer and keeps `<picture>` markup in sync. Read the header
comment first: the full resolution masters are **not** in the working tree, and
the script refuses to encode AVIF from shipped WebP rather than stack a second
generation of loss.

## Architecture

`ARCHITECTURE.md` is the design system brief and the definition of record for
navigation hierarchy, tokens and page blueprints. Read it before making
structural or visual changes. Section 6 covers the measurement, consent and
legal layer in full detail; the summary below is only a map.

### Pages

Every page is hand authored. There is no templating and no includes.

| File | Role |
|---|---|
| `index.html` | Homepage |
| `oem-advocacy.html` | OEM advocacy pillar page (insurance claims) |
| `services/collision-frame-repair.html` | Structural and frame repair, ADAS recalibration |
| `services/paint-coating-detailing.html` | Paint matching, ceramic coating, detailing |
| `recent-work.html` | Work gallery with before/after comparators |
| `contact.html` | Quote request form, shop info, location card, carrier logos |
| `privacy.html`, `terms.html`, `accessibility.html` | Legal pages |
| `404.html` | Designed not-found page |

The site deliberately consolidates services into three pillar pages rather than
many thin ones. Retired URLs are 301 redirected in `vercel.json`; add a redirect
there instead of leaving a dead route.

`cleanUrls: true` is set in `vercel.json`, so internal links are extensionless
(`href="contact"`, not `href="contact.html"`). Match that in new markup.

### Shared assets

- `css/mkc.css` is the entire design system: tokens, reset, typography
  utilities (`.display`, `.data`, `.eyebrow`, `.lede`), layout primitives
  (`.wrap`, `.grid-12`), and components (nav, footer, `.meta-point`,
  `.readout`, `.spec-frame`, `.compare`, `.lightbox`, `.legal`, form styles).
- `js/mkc.js` is shared behavior: mobile nav, services submenu,
  `IntersectionObserver` scroll reveals (`.reveal` to `.is-in`), the
  before/after `[data-compare]` comparators, and the photo lightbox.
- `fonts/` holds self-hosted woff2 files, loaded via `fonts/fonts.css` and
  preloaded in each page head. **Fonts are not loaded from Google Fonts.** Do
  not reintroduce a `fonts.googleapis.com` link.
- Each page also carries a page scoped `<style>` block in its own `<head>` for
  layout unique to that page. Global and reusable rules belong in
  `css/mkc.css`; one-off layout stays inline in that page.

### Measurement, consent and legal layer

Added August 2026. See `ARCHITECTURE.md` section 6 and `docs/measurement-plan.md`.

| File | Role |
|---|---|
| `middleware.ts` | Vercel middleware. Writes the `mkc_geo` region cookie (`us`, `other`, `unknown`) |
| `js/mkc-consent.js` | Region and GPC detection, consent cookie, the banner, vendor consent signals |
| `js/mkc-analytics.js` | The single `track()` function, tag loading, attribution, form and link events |
| `tools/check-legal-dates.mjs` | Guards the legal page date pair |

**Load order is not arbitrary.** Each page has an inline script at the end of
`<head>` that defines `gtag` and sets Consent Mode v2 defaults, region-specific
denied first and global default second, because the more specific region wins.
This must happen before any Google tag loads, which is why it is inline on
every page rather than in a shared file that could fail to load.

Then, deferred and in this order: `mkc.js`, `mkc-consent.js`,
`mkc-analytics.js`. Deferred scripts run in document order, so consent always
resolves before analytics decides whether it may request a vendor script.
Preserve this order when editing any page head or script block.

To add an event, add the name to the `NAMES` array in `js/mkc-analytics.js`
**and** to the table in `docs/measurement-plan.md` in the same commit.
`track()` silently drops names that are not on the list, so a typo fails closed.

GA4 and Clarity IDs sit in the `CONFIG` block at the top of
`js/mkc-analytics.js`. They are public identifiers, not secrets, and everything
is hostname guarded so localhost and `*.vercel.app` previews never send a hit.

### Images

Photos ship as WebP with an AVIF layer offered first:

```html
<picture>
  <source type="image/avif" srcset="images/work/bmw-750i/bmw-08.avif" />
  <img decoding="async" src="images/work/bmw-750i/bmw-08.webp"
       alt="..." width="480" height="640" />
</picture>
```

Always include `width`, `height` and real `alt` text. Use
`fetchpriority="high"` only on the LCP image, which is also preloaded in the
head.

### Docs

`docs/` is `.vercelignore`d and does not deploy. It holds client facing and
operational material, not code docs:
`measurement-plan.md` (definition of record for what the site measures),
`console-setup-checklist.md` (everything that cannot be done in code), and
`client-explainer.md` (the plain language version for Mike).

## Conventions when editing

- No framework, no bundler, no preprocessor. Keep new code dependency free and
  vanilla.
- Use existing custom properties and utility classes from `css/mkc.css` before
  adding raw values. Check the tokens table in `ARCHITECTURE.md` first.
- `--mkc-green` is the single accent color, used sparingly for focus points.
  Do not introduce other accent colors.
- Type stacks are role based and not interchangeable: `--f-display` (Anton,
  uppercase headlines only), `--f-body` (Archivo, body copy), `--f-data` (IBM
  Plex Mono, uppercase and tracked, for metrics, labels, eyebrows, buttons).
- BEM-ish naming throughout (`.hero__grid`, `.nav__burger`,
  `.compare__handle`), with an `is-` prefix for state (`is-open`, `is-in`,
  `is-active`). Follow it in new markup.
- Reuse the shared components in `css/mkc.css` (`.meta-point`, `.readout`,
  `.spec-frame`, `.compare`, `.lightbox`, `.legal`) rather than inventing
  one-off patterns for the same kind of content.
- Two BEM-looking patterns are **page scoped, not shared**, despite the naming:
  `.matrix` is defined only in `oem-advocacy.html` and `.step` only in
  `contact.html`, each inside that page's own `<style>` block. If you need one on
  a second page, promote it into `css/mkc.css` rather than copying the block.
  `ARCHITECTURE.md` section 2 splits its component list on the same line.
- The primary nav is duplicated in every HTML file. When adding, removing or
  renaming a page, update the nav block in **every** page.

### Copy

- **Never use em dashes.** This is a Parabox house rule across all copy and
  deliverables. Use periods, commas, or restructure.
- Direct, plain language. No agency jargon.
- Headlines lead with the customer's outcome, not the shop's features.

### Accessibility and forms

Preserve what is already in place: `aria-expanded` and `aria-haspopup` on the
nav toggle, `aria-current="page"` on the active nav link, `aria-live="polite"`
on the form status region, and `prefers-reduced-motion` handling in both CSS
and JS.

The quote form on `contact.html` posts to Web3Forms and is progressively
enhanced with a submit handler showing inline status (`.form__status.is-ok` /
`.is-err`) instead of navigating away. It includes a `botcheck` honeypot.
Preserve the honeypot and the status region when editing the form.

Before presenting work as finished, run the Parabox pre-delivery QA checklist
(`parabox-design-system` skill): contrast, keyboard nav, heading hierarchy,
responsive at 375 / 768 / 1024 / 1440, unique title and description per page,
and no horizontal overflow.
