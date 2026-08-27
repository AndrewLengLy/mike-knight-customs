# Mike Knight Customs — Site Architecture & Design System v1.0

Direction: **Luxury Minimalist / Mechanical Grit** — deep ink backdrops, 1px structural borders, editorial asymmetry, monospace data readouts. Evolved from the baseline deployment at mike-knight-web0-1.vercel.app.

---

## 1. Full Navigation Hierarchy

Maps every baseline Vercel route into the evolved architecture. The five baseline service links consolidate into three authoritative destinations (thin pages dilute authority; pillar pages compound it).

```
MKC (root)
│
├── /index.html ·················· PAGE A — Homepage (built)
│
├── SERVICES (dropdown)
│   ├── /services/collision-frame-repair.html ····· PAGE C
│   │     ← absorbs baseline: /services/collision-repair.html
│   ├── /services/paint-coating-detailing.html ···· PAGE D
│   │     ← absorbs baseline: /services/custom-paint.html
│   │                         /services/ceramic-coating.html
│   │                         /services/detailing.html
│   └── /oem-advocacy.html ·················· PAGE B (built)
│         ← elevates baseline: /services/insurance-assistance.html
│
├── /oem-advocacy.html ····· "OEM Advocacy" (top-level pillar link)
├── /recent-work.html ······ "Recent Work" — case-file gallery of real projects
│                            (photos live in images/work/<project>/)
├── /contact.html ················ Quote form + map + carriers
│
├── /privacy.html ··············· Privacy policy (CCPA/CPRA)
├── /terms.html ················· Terms of use
├── /404.html ··················· Not-found page (noindex, Vercel auto-serves)
│
└── Footer utility: Google Maps · Facebook · Instagram · Yelp
    Footer legal bar: Privacy · Terms · Sitemap
```

**Redirect map (SEO preservation):** 301 each old baseline URL to its new destination above.

---

## 2. Design System Tokens (see css/mkc.css)

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0B0F12` | Page base — deep ink slate |
| `--ink-2` | `#10151A` | Raised panels / alternating bands |
| `--line` | `#222B33` | 1px structural borders (never box-shadows) |
| `--white` | `#F4F7F9` | Display type & headings |
| `--silver` | `#98A2AB` | Body copy |
| `--silver-dim` | `#5E6972` | Captions / index labels |
| `--mkc-green` | `#A8F040` | Single industrial accent — focus points only |

**Typography**
- Display — `Anton`: heavy condensed mechanical sans, uppercase, 0.96 line-height. Headlines only.
- Body — `Archivo`: geometric, hyper-legible, 400/500/600.
- Data — `IBM Plex Mono`: uppercase, 0.14em tracking. All metrics, indices, readouts, buttons, eyebrows.

**Signature components**
- `.meta-point` — border-scoped spec rows (replaces icon boxes)
- `.readout` — mono data-readout tables with `is-live` green values
- `.spec-frame` — 1px frame with blueprint corner ticks in accent green
- `.compare` — draggable before/after clip comparator
- `.matrix` — technical contrast table (OEM column tinted green)
- `.step` — 3-column advocacy framework rows with outlined display numerals

---

## 3. PAGE C Blueprint — Collision & Frame Repair

Theme: **surgical mechanical precision**. Every section reads like a calibration report.

```
┌──────────────────────────────────────────────────────────────┐
│ MASTHEAD  eyebrow: SERVICE FILE · MKC-SVC/01                 │
│ H1: STRUCTURE, RESTORED TO THE MILLIMETER.                   │
│ readout: Frame Tolerance ±1mm · Laser Measured · OEM Welds   │
├──────────────────────────┬───────────────────────────────────┤
│ COL 1 — STRUCTURAL       │ COL 2 — ELECTRONIC                │
│ Frame straightening      │ Unibody alignment tolerances      │
│ (computerized bench,     │ (datum-point verification vs      │
│ anchored pulls, factory  │ factory dimension sheets)         │
│ datum sheets)            │                                   │
│ Multi-panel reconstruct- │ ADAS sensor recalibration         │
│ ion metrics: weld count, │ protocol: static/dynamic cal,     │
│ seam sealer, e-coat,     │ radar aim, camera targets,        │
│ corrosion protection     │ printed calibration report        │
├──────────────────────────┴───────────────────────────────────┤
│ PROOF CENTER — GMC Sierra comparator w/ measurement readout  │
│ CTA — "Request a structural assessment"                      │
└──────────────────────────────────────────────────────────────┘
```

Dual columns are separated by a single 1px `--line` rule; each item is a `.meta-point`-style row with a mono metric on the right (e.g., `WELD SPEC — GM SI DOC 24-NA-021`).

---

## 4. PAGE D Blueprint — Paint Matching, Ceramic & Detailing

Theme: **texturally rich, staggered rhythm** — alternating rows with unexpected column breaks (7/5 → 4/8 → 6/6-offset) so no two bands repeat.

```
┌──────────────────────────────────────────────────────────────┐
│ MASTHEAD  H1: FINISHES YOU CANNOT FIND IN DIRECT SUNLIGHT.   │
├───────────────────────────────┬──────────────────────────────┤
│ ROW 1 (7/5) IMG left          │ Invisible Color Match:       │
│ AMG GLE53 blend photo         │ spectrophotometer formula,   │
│                               │ blended panel transitions    │
├───────────────┬───────────────┴──────────────────────────────┤
│ ROW 2 (4/8)   │ Ceramic Protection: 9H hardness, UV shield,  │
│ readout:      │ hydrophobic maintenance, multi-year film     │
│ coating spec  │ integrity — copy right, break comes early    │
├───────────────┴───────────────────┬──────────────────────────┤
│ ROW 3 (6/6, pushed right +1 col)  │ MARINE & AVIATION        │
│ Concours detailing: paint         │ Why local pilots & boat  │
│ correction stages, interior spec  │ owners choose MKC —      │
│                                   │ gelcoat & aerospace-     │
│                                   │ grade finish standards   │
├───────────────────────────────────┴──────────────────────────┤
│ CTA — "Book a finish consultation"                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Files in this build

- `css/mkc.css` — global design system (`@font-face` block, tokens, type, grid, nav, footer, components)
- `js/mkc.js` — nav toggle, scroll reveals, before/after comparators, review carousel, photo lightbox
- `fonts/` — self-hosted latin `woff2` subsets (Anton, Archivo variable, IBM Plex Mono 400/500)
- `tools/` — local image tooling, not deployed and not part of any build (see §7)
- `index.html` — PAGE A, complete
- `oem-advocacy.html` — PAGE B, complete
- `standalone/` — self-contained single-file versions for instant preview (`noindex`)
- `privacy.html` / `terms.html` — legal pages on the shared `.legal` prose layout
- `404.html` — not-found page, served automatically by Vercel
- `sitemap.xml` — all 8 indexable URLs with `lastmod` + image entries for the work gallery
- `robots.txt` — allows all, disallows `/standalone/`
- `images/og/mkc-og.jpg` — 1200×630 social card used by every page

---

## 6. SEO conventions

The head opens with the render-critical links: stylesheet, font preloads, and on
the homepage the hero image preload. The favicons follow, then the metadata, in
this order: `theme-color` · `title` · `description` · `canonical` · `robots` ·
Open Graph (with `og:image:width/height/alt`) · Twitter card · one
`application/ld+json` `@graph`.

The JSON-LD block runs to roughly 150 lines, so it sits last. Anything the
browser needs to start fetching belongs above it.

Structured data uses a single canonical business node, `#business`
(`AutoBodyShop` + `AutoRepair`), declared on the homepage. Every other page
references it by `@id` rather than redeclaring it, and adds its own `WebPage`,
`BreadcrumbList`, and where relevant a `Service`, `ContactPage`,
`CollectionPage`, or `FAQPage` node.

**Deliberate omission:** no `aggregateRating` / `Review` markup. Google's
structured-data policy disallows self-serving review markup on a business's own
pages, so the 5.0 ratings stay as on-page copy only.

Images all carry intrinsic `width`/`height` (CLS), `decoding="async"`, and
`loading="lazy"` except the nav logo and the homepage hero, which are
`fetchpriority="high"`. The hero is also `<link rel="preload">`ed, as
`type="image/avif"` so the preload matches what `<picture>` actually picks.

Copy rules in force: no em dashes, no two-beat antithesis, no aphorism
formulas, no generic openers, no padded triads. Written for skimmers.

---

## 7. Asset delivery

Every photo ships three ways. The `.jpg`/`.png` in `src` is the untouched
original and the fallback; alongside it sit `.avif` (q65) and `.webp` (q80)
generated from that original, offered through `<picture>`:

```html
<picture>
  <source type="image/avif" srcset="images/work/venza/venza-01.avif" />
  <source type="image/webp" srcset="images/work/venza/venza-01.webp" />
  <img src="images/work/venza/venza-01.jpg" width="480" height="640" ... />
</picture>
```

`picture { display: contents }` in the CSS keeps the wrapper out of the box
tree, so the `<img>` stays the grid/flex item and wrapping an image never
changes layout.

**Do not hand-write any of this.** `tools/optimize-images.mjs` generates the
variants and rewrites the markup:

```bash
cd tools && npm install     # once
node tools/optimize-images.mjs          # from the repo root
node tools/optimize-images.mjs --check  # report only, changes nothing
```

Run it after adding photos or publishing a case file. It is idempotent, so
running it twice is harmless. It writes a plain `<img>` into a `<picture>`,
skips images already wrapped, ignores SVG and the single-format assets above,
and drops a variant that comes out no smaller than the original it would
replace. It always encodes from the original `.jpg`/`.png` and never from an
existing variant, because a variant of a variant carries two generations of
loss.

`images/work/<project>/` holds more photos than the site currently shows; the
extras are staged for future case files. They deliberately have no variants
yet. Reference one from a page, run the tool, and it picks them up.

Exceptions that stay single-format: the favicons, the apple-touch icon, and
`images/og/mkc-og.jpg`. Social crawlers and OS icon fetchers do not content-
negotiate, so those keep their original format.

Fonts are self-hosted from `/fonts` rather than Google Fonts, which removes two
render-blocking third-party origins from the critical path. Archivo is one
variable file covering 400-600; the Google Fonts link fetched the same file once
per weight. The stylesheet link sits directly after the viewport meta, ahead of
the JSON-LD block, so the parser reaches it immediately.

**Known limit:** the source photos are 480×640. That is fine for the gallery
grid but means the lightbox upscales on a retina phone. Higher-resolution
originals are the only fix; re-encoding cannot recover detail that is not there.
