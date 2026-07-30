# Elite Drillers Services Corp — Website

Static marketing site for Elite Drillers Services Corp (Midland, TX). No build step,
no dependencies, no framework install. Deploys to Cloudflare Pages as-is.

## Deploying to Cloudflare Pages

1. Push this folder to a GitHub repository (it can be the repo root, or a subfolder).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository and use these build settings:

   | Setting                | Value                              |
   |------------------------|------------------------------------|
   | Framework preset       | None                               |
   | Build command          | *(leave empty)*                    |
   | Build output directory | `/` (or `site` if nested)          |
   | Root directory         | *(leave empty, or `site`)*         |

4. Save and Deploy. Cloudflare serves `index.html` at the root.

### Custom domain

Pages project → **Custom domains → Set up a domain** → `elitedrillers.com`.
If the domain's DNS is already on Cloudflare the records are created automatically;
otherwise point the apex/`www` records at the Pages target Cloudflare shows you.

## File map

```
index.html                  Entire site: all 8 pages, routing, styles, content
Placeholder.dc.html         Image/placeholder tile component
support.js                  Runtime that renders the components (required)
uploads/                    Photography, logos, maps
_headers                    Security + cache headers (Cloudflare Pages)
_redirects                  Serves index.html for all routes
```

## Pages

Routing is hash-based and client-side (`#home`, `#services`, `#area`, `#about`,
`#reviews`, `#faq`, `#careers`, `#contact`). Reviews is reachable by link and by URL
but is intentionally not in the header navigation.

## Editing content

All copy, service descriptions, team members, reviews and FAQs live in the
`class Component extends DCLogic` script block near the bottom of `index.html` —
look for the `sd`, `team`, `reviews`, `faqs`, `stats` and `specBar` arrays.
Page markup is the HTML above it.

## Replacing photos

Drop a new file into `uploads/` using the same filename to swap an image in place.
Current filenames:

- `hero-rig.jpg` — homepage hero (portrait, 4:5)
- `service-water-well-drilling.jpg`, `service-pump-service.jpg`,
  `service-well-rehabilitation.jpg`, `service-environmental-drilling.jpg`,
  `service-geotechnical-coring.jpg` — services page (landscape, 4:3)
- `equipment-lineup.jpg`, `rig-detail.jpg` — equipment section (3:2)
- `crew-on-site.jpg` — about page (4:3)
- `team-bliss-jung.jpg` — headshot (square)
- `map-texas-service-area.png`, `map-midland-tx.png` — generated maps

### Still needed

Headshots for Chad Fischer, Reid Wagner, Caleb Gregory, Matt McCoy, Bo Atkins,
Leslie White and Cynthia Masters. Add them as `uploads/team-first-last.jpg`
(square, 2000px+) and add `src: "uploads/team-first-last.jpg"` to that person's
entry in the `team` array. Until then those cards show a placeholder tile.

## The contact & careers forms

Both forms are front-end only — they validate and show a confirmation state but do
not submit anywhere yet. To make them live, wire the submit handlers to a form
endpoint (Cloudflare Pages Functions, Formspree, Basin, etc.).

## Notes

- Fonts (Archivo, Barlow, Spline Sans Mono) load from Google Fonts at runtime.
- The site is responsive from 1920px desktop down to 360px phones.
- Licensing shown: drilling in TX · NM · OK, pump in TX.
