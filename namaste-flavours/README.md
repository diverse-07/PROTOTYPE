# Namaste Flavours — Royal Fine Dining &amp; Heritage Kitchen

A single-file, self-contained website for **Namaste Flavours**, Panchsheel Garden,
Navin Shahdara, Delhi 110032. Open `index.html` in any browser — there is no build
step, no server and no framework.

---

## Files

```
namaste-flavours/
├── index.html      the entire site (markup, styles, behaviour)
├── img/            every photograph, self-hosted
└── README.md       this file
```

Everything is local. The page makes no image requests to any third party, so it
cannot be broken by a CDN changing its rules, rate-limiting you, or blocking a
hotlink. The only external requests are the web fonts and Tailwind's CDN script.

---

## The photographs

All 26 files were cropped on the server side to the exact size each slot needs, so
no image is ever upscaled or squashed. They were sourced from the restaurant's public
Zomato listing (restaurant ID `22795977`) — the same photographs customers see on
Google and Zomato, not stock imagery.

### Display images (`src`)

| File | Size | Used for |
|---|---|---|
| `01-1800x1670.jpg` | 1800×1670 | Hero portrait (arched frame) |
| `02-700x900.jpg` | 700×900 | Hero inset medallion |
| `03-1300x730.jpg` | 1300×730 | Hero detail strip, 1 |
| `04-1300x730.jpg` | 1300×730 | Hero detail strip, 2 |
| `05-1300x730.jpg` | 1300×730 | Hero detail strip, 3 |
| `06-1500x1500.jpg` | 1500×1500 | Gallery lead tile (01) |
| `07-900x900.jpg` … `13-900x900.jpg` | 900×900 | Gallery tiles 02–08 |
| `14-2300x1080.jpg` | 2300×1080 | Panorama ("The House Table") |
| `15-1900x1216.jpg` | 1900×1216 | Signature dish — Dal Makhani |
| `16-1900x1216.jpg` | 1900×1216 | Signature dish — Tandoori Platter |
| `17-2300x620.jpg` | 2300×620 | Heritage wide frame ("From the House Kitchen") |
| `18-1900x1086.jpg` | 1900×1086 | Reservation block |

### Viewer images (`view-*.jpg`, 1600×1600)

The eight gallery tiles load a light file in the grid and a 1600 px file only when a
photograph is actually opened, via `data-full` on each tile. This keeps the first load
small while the full-screen viewer stays sharp on a retina display.

### Resolution

Every slot was measured against its own rendered width at a 2× device pixel ratio:

- **1440 px viewport** — everything at or above 1:1 except the panorama at 0.97
- **1024 px viewport** — everything at or above 1:1 except the hero at 0.93
- **390 px viewport** — everything above 1:1

The two values under 1.0 are capped by the source photograph's native resolution
(1836 px and 2304 px wide), not by the crop.

---

## Swapping in your own photographs

Drop your file into `img/` and point the `src` at it. Two rules:

1. **Match the aspect ratio** of the file you replace, or `object-cover` will crop it.
2. **Keep it at least as wide** as the size in the table above.

To change the alt text or a viewer caption, edit the `alt` attribute on the image and
the `CAPTIONS` map in the script at the bottom of `index.html`.

If you replace a gallery tile's photograph, either update its `data-full` to point at
your own larger file or delete the `data-full` attribute — the viewer falls back to
the tile image automatically.

### Cutting page weight

The files are JPEG for universal compatibility. Re-encoding the same crops as **AVIF**
at quality 85 typically cuts the folder from ~5.9 MB to ~1 MB with no visible loss —
worth doing before you publish:

```bash
# requires ImageMagick or sharp
for f in img/*.jpg; do magick "$f" -quality 85 "${f%.jpg}.avif"; done
```

Then add an AVIF `<source>` before each `<img>` in a `<picture>` wrapper.

---

## What the page does

**Layout** — royal navy / antique gold palette, Cinzel for inscriptions, Playfair
Display for headings. Arch-framed hero, hairline gold borders, a 22-dish menu with
category filters, and a nine-frame house gallery.

**Interaction** — a gold reading-progress rule; header that condenses on scroll;
scroll-spy navigation; slow Ken Burns on the hero with clamped parallax; counters that
ease up; a full gallery lightbox with prev/next, keyboard arrows, Escape, swipe on
touch and focus management; a sliding filter pill with FLIP-animated reflow; a tasting
selection pill that tracks your picks; validated reservation form; back-to-top; and a
mobile reservation bar.

**Motion added last** — cursor spotlight across the menu cards, staggered entrances
for grids, a scroll-linked wipe revealing the wide house frames, self-drawing section
rules, animated gold underlines, and gold keyboard focus rings.

Everything is scoped behind an `html.js` class, so with JavaScript disabled all content
is visible and static. Every effect also honours `prefers-reduced-motion: reduce`.

---

## Known limitations

- Tailwind is loaded from its CDN, which prints a console notice and blocks rendering
  briefly. For production, compile it to a stylesheet and self-host it.
- The fonts come from Google Fonts; self-host them if you need the site to work fully
  offline.
- The reservation form validates and confirms on the client but is not wired to a
  backend — it needs an endpoint to actually receive bookings.
- The phone number in the location block is a placeholder (`+91 98765-43210`).
