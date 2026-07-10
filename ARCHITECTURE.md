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

- `css/mkc.css` — global design system (tokens, type, grid, nav, footer, components)
- `js/mkc.js` — nav toggle, scroll reveals, before/after comparators
- `index.html` — PAGE A, complete
- `oem-advocacy.html` — PAGE B, complete
- `standalone/` — self-contained single-file versions for instant preview
