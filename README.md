# Pacito Coffee

Static, mobile-first single-page site for Pacito Coffee, an alcohol-free evening lepak spot at PJ8 Level 2, Petaling Jaya (Thu – Sat, 7PM – 11PM).

Built on the Pacita Coffee design system: five flat inks, Archivo Black / Patrick Hand / Space Mono, square borders and offset ink blocks.

## Sections

1. Sticky header with the live open/closed pill (Malaysia time) and section nav
2. Hero poster: PACITO? MINUM JOM!
3. Menu: Menu Mengada spotlight, coffee / non-coffee / bakes, Hari Gaji promo and sticker perk
4. About: the lepak vibe (indoor vinyl lounge and fairy-lit courtyard)
5. Community nights: Puisi Purnama with the poet sign-up drawer
6. The lepak wall: featured customer-tagged photos (#MinumJomPacito)
7. Stamp card: 10-stamp loyalty card (demo, stored in the browser)
8. Find us: address, Maps/Waze, arrival steps, amenities and opening hours
9. Footer

## Files

- `index.html` – the page
- `css/tokens.css` – design tokens, generated from the design system's `tokens.json`
- `css/components.css` – the design system's component styles (unchanged)
- `css/site.css` – page additions (nav, wall, stamp card, hours)
- `js/site.js` – status pill, RSVP drawer, photo wall, stamp card, copy address

## Run locally

No build step. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
```

Add `?now=2026-11-27T21:00:00+08:00` to the URL to preview the status pill at a fixed time.

## Placeholders to replace

- Menu prices and the extra menu items
- Tagged photos on the wall (drawn stand-ins; swap for curated posts)
- Social handles (`@pacitocoffee`) and the `#MinumJomPacito` hashtag
- Poet slot count and RSVP submission (wire to the Google Sheet webhook)
- Stamp card (demo only; real stamping needs a staff code or loyalty app)

Deploys as-is to GitHub Pages or Cloudflare Pages.
