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
support.js                  Runtime that renders the page (required)
uploads/                    Photography, logos, maps
404.html                    Branded not-found page (Cloudflare serves automatically)
thanks.html                 Post-application confirmation page
robots.txt                  Crawler rules + sitemap pointer
sitemap.xml                 Sitemap with image entries
favicon.png                 512px favicon (logo mark, white on brown)
apple-touch-icon.png        180px iOS home-screen icon
site.webmanifest            Icon/theme metadata
_headers                    Security + cache headers (Cloudflare Pages)
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

## Image sizes

Photos in `uploads/` are web-optimized (1000–1600px, JPEG q82, ~50–320 KB each;
~2.5 MB for the whole folder). **Do not commit straight-from-camera originals** —
the first version of this repo had 6–12 MB files totalling 100 MB, which broke the
deploy and would have made the site unusable on mobile data. Keep the masters
somewhere else and export web copies at these sizes.

## If images don't load after deploying

Open your deployed site and go straight to an image URL, e.g.
`https://your-site.pages.dev/uploads/hero-rig.jpg`.

- **404** → the `uploads/` folder didn't make it into the repo. This happens when
  files are added through GitHub's web uploader. Confirm `uploads/` with all 15
  files is visible in the repo on github.com, and that Cloudflare's **Build output
  directory** points at the folder that contains `index.html`.
- **The HTML page loads instead of the image** → a catch-all rewrite rule is
  intercepting asset requests. Delete any `_redirects` file. This site is
  hash-routed and does not need one.
- **403** → check that the filename case matches exactly. All asset filenames here
  are lowercase with hyphens.
- **The image downloads as a tiny text file** → Git LFS is enabled for images in
  this repo. Cloudflare Pages does not resolve LFS pointers. Run
  `git lfs untrack "*.jpg" "*.png"`, remove the entries from `.gitattributes`,
  then re-add and commit the images normally.

## Viewing locally

Double-clicking `index.html` works. If you prefer a local server:

```
npx serve .
```

## Notes

- Fonts (Archivo, Barlow, Spline Sans Mono) load from Google Fonts at runtime.
- The site is responsive from 1920px desktop down to 360px phones.
- Licensing shown: drilling in TX · NM · OK, pump in TX.


## SEO / metadata

Baked into `index.html`:

- Page title + meta description, rewritten per page as you navigate
  (see `pageMeta()` in the app logic near the router)
- Canonical URL, `og:*` and `twitter:*` tags, updated per page
- Social share card at `uploads/og-card.jpg` (1200x630, brand card with
  logo, tagline and phone number) — this is what appears when the link is
  pasted into Facebook, LinkedIn, iMessage, Slack, etc.
- Geo meta (`geo.region`, `geo.position`, `ICBM`) pointing at Midland
- JSON-LD structured data: LocalBusiness/GeneralContractor with NAP, hours,
  service area, service catalog and social profiles; WebSite; and FAQPage
  built from the six FAQ answers (eligible for Google's FAQ rich results)
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, `404.html`
- `lang="en"`, alt text on every image, lazy loading below the fold

### Before you go live, update these

1. **Domain.** Every absolute URL assumes `https://elitedrillers.com`. If the
   live domain differs, find-and-replace it in `index.html`, `robots.txt`
   and `sitemap.xml`.
2. **Google Business Profile.** The JSON-LD address, phone and hours must match
   your Google Business Profile exactly, or the two will fight each other in
   local search. This is the single highest-value thing for a Midland-area
   service business.
3. **Search Console + Bing Webmaster.** Add the property and submit
   `sitemap.xml`.
4. **Analytics.** No tracking is installed. Drop your GA4 or Cloudflare Web
   Analytics snippet just before `</head>`.

### Known limitation: one indexable URL

Navigation uses hash routing (`/#services`), so the whole site is one URL as
far as search engines are concerned. Titles and descriptions swap correctly for
browsers and social scrapers, but Google will only rank the homepage.

If organic search matters, the fix is splitting the pages into real paths
(`/services/`, `/about/`, `/contact/`) so each gets its own indexable URL and
its own crawlable copy. That's a structural change to how the site is built,
not a settings toggle — ask and it can be done.


## Forms

Both forms send through [FormSubmit](https://formsubmit.co) — no account, no
API key, no server. FormSubmit takes ONE address in the endpoint and CCs the
rest.

| Form | Primary recipient | CC'd |
| --- | --- | --- |
| Quote request | estimates@elitedrillers.com | chad@, bliss@, caleb@ |
| Job application | careers@elitedrillers.com | chad@, bliss@ |

**One-time activation:** the first submission to each new primary address
triggers a confirmation email from FormSubmit. Click the link in it once and
every submission after that is delivered silently. Until that click,
submissions are held. So expect TWO confirmation emails — one at
estimates@ and one at careers@ — and test both forms after deploying.

| Form | How it sends | Where it lands |
| --- | --- | --- |
| Quote request (Contact) | `fetch` POST, stays on the page and shows an inline confirmation | Email, with the chip answers (Project Type / Service / Timeline) and the optional budget included |
| Job application (Careers) | Standard form POST so the résumé file attaches | Email with the résumé attached, then redirects to `/thanks.html` |

To change recipients, search `index.html` for `formsubmit.co` (the endpoint
appears twice: the careers form `action` and `FORM_ENDPOINT`) and for `_cc`
(the careers hidden field and `FORM_CC`).

**If the domain changes**, update the careers form's `_next` hidden field —
it currently points at `https://elitedrillers.com/thanks.html`. FormSubmit
requires an absolute URL there.

## Editing open roles

Open positions are a plain list in `index.html`. Search for `const roles = [`
and edit, add or delete lines:

```js
{ title: "Water Well Driller", req: "TX / NM drilling license required", immediate: false },
```

- `title` — the job name (this also populates the application form's dropdown)
- `req` — the one-line requirement shown underneath
- `immediate: true` — adds the brown IMMEDIATE badge

No other file needs touching. The same pattern applies to the FAQ
(`const faqs = [`), reviews (`const reviews = [`) and the team
(`const team = [`).

## Maps

Both maps are inline SVG generated from US Census boundary data (via
`us-atlas`), simplified with Ramer-Douglas-Peucker and hand-tuned for label
placement. The service-area map shows two tiers: TX / NM / OK / NV filled
solid as licensed states, and LA / MS / AR / KS / AZ in a lighter fill as the
surrounding region served. They are vector, so they stay sharp at any size and on any
display, they use the site's own fonts and brand colours, and together they
weigh ~15 KB instead of ~670 KB as images.

Standalone copies live at `uploads/map-service-area.svg` and
`uploads/map-midland-locator.svg` if you need them elsewhere. The generator
is `maps-svg.html` in the project root (not part of the deployed site).

## Accessibility & mobile

- All tap targets are at least 44x44 (footer links, social buttons, form
  chips, the menu button, the header call button)
- Form inputs are 16px, which stops iOS from zooming when a field is focused
- The mobile drawer has an explicit close control and cannot appear at
  desktop widths; it also closes itself if the window is widened past 1024px
- Both maps carry descriptive `aria-label`s; every photo has alt text
