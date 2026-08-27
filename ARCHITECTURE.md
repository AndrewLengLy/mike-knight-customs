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
└── Footer utility: Google Maps · Facebook · Instagram · Yelp
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
- Display — `Anton`: heavy condensed mechanical sans, uppercase, 1.0 line-height. Headlines only.
- Body — `Archivo`: geometric, hyper-legible, 400/500/600. 1.6 line-height.
- Data — `IBM Plex Mono`: uppercase, 0.14em tracking. All metrics, indices, readouts, buttons, eyebrows.

**Fluid scale** — type (`--step--1` … `--step-4`) and rhythm (`--space-2` … `--space-6`)
are `clamp()` ramps with hard upper bounds, so a 1920px display gets the same
capped sizes as a 1440px one rather than continuing to grow. Content container
is `--max-w: 1320px`. There is no phone-only spacing override: the clamps handle it.

| Token | 375px | 1440px+ |
|---|---|---|
| `--step-4` display | 38px | 70px |
| `--step-3` | 29px | 45px |
| `--step-0` body | 15px | 16px |
| `--space-6` section pad | 52px | 88px |

**Touch targets** — every control clears 44px. Sizing that exists only to hit
that minimum (footer links, gallery captions, readout links) is scoped to
`@media (hover: none)` so pointer devices keep the tighter desktop rhythm.

**Fonts** — Anton, Archivo and IBM Plex Mono are self-hosted from `fonts/`
(SIL OFL 1.1, license text alongside the files). Same-origin, so no
third-party DNS, TCP or TLS handshake sits on the critical path and the
typography cannot silently fall back to system metrics when a CDN is
unreachable. Only latin and latin-ext subsets ship; `unicode-range` means a
browser fetches a file only when the page needs those codepoints, so an
English page pulls just the four latin faces (~81 KB). The three faces that
paint the first screen are preloaded.

**Images** — photographs ship as WebP at quality 85 (~30 percent smaller than
the JPEG sources, worst-case PSNR 38.5 dB), with an AVIF at quality 65 offered
ahead of it through `<picture>`:

```html
<picture>
  <source type="image/avif" srcset="images/work/venza/venza-01.avif" />
  <img src="images/work/venza/venza-01.webp" ... />
</picture>
```

AVIF takes a further ~23 percent off the WebP for browsers that support it;
everyone else still gets the WebP from `src`. `picture { display: contents }`
keeps the wrapper out of the box tree, so the `<img>` stays the grid/flex item
and wrapping an image never changes layout.

The Open Graph, Twitter card and JSON-LD `image` URLs deliberately stay JPEG:
social crawler support for WebP is inconsistent and a broken share preview
costs leads. Flat-art carrier logos stay SVG or PNG wherever WebP and AVIF did
not beat them — the nav logo is one of these, a 10 KB PNG that neither format
improved on.

**Do not hand-write any of this.** `tools/optimize-images.mjs` generates the
AVIF and rewrites the markup:

```bash
cd tools && npm install     # once
ORIGINALS_DIR=/path/to/masters node tools/optimize-images.mjs
node tools/optimize-images.mjs --check     # report only
```

It is idempotent, skips images already wrapped, and drops any variant that does
not actually beat the file it would replace.

**Where the masters live.** The full-resolution JPEG/PNG originals are no longer
in the working tree; they were removed when the site moved to WebP. AVIF must
still be encoded from those masters, never from the shipped WebP, because
encoding one lossy format into another stacks a second generation of loss.
Recover them from a commit that predates the migration, for example the tag
`backup/pre-reconcile-53f3768`:

```bash
git cat-file blob backup/pre-reconcile-53f3768:images/work/venza/venza-01.jpg > masters/...
```

then point `ORIGINALS_DIR` at that folder. With no master available the script
refuses to encode and says so rather than quietly shipping a degraded image.

**Known limit:** the source photos are 480x640. That is fine for the gallery
grid but means the lightbox upscales on a retina phone. Higher-resolution
originals are the only fix; re-encoding cannot recover detail that is not there.

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

- `css/mkc.css` — global design system (tokens, type, grid, nav, footer, components)
- `js/mkc.js` — nav toggle, scroll reveals, before/after comparators
- `tools/` — local image tooling, not deployed and not part of any build (see §2)
- `index.html` — PAGE A, complete
- `oem-advocacy.html` — PAGE B, complete
