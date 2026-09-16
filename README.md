# Elite Drillers Services Corp — Website

Static marketing site for Elite Drillers Services Corp (Midland, TX). No build
step, no dependencies, no framework install. Deploys to Cloudflare Pages as-is.

## Deploying to Cloudflare Pages

1. Push this folder's **contents** to a GitHub repository root.
2. Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:

   | Setting                | Value           |
   |------------------------|-----------------|
   | Framework preset       | None            |
   | Build command          | *(leave empty)* |
   | Build output directory | `/`             |
   | Root directory         | *(leave empty)* |

4. Save and Deploy. Production branch is `main`; every push auto-deploys.

Cloudflare picks up `functions/` automatically — no configuration needed, but
the environment variables and bindings below must exist or the forms will fail.

### Custom domain

Pages project → **Custom domains → Set up a domain** → `elitedrillers.com`.

## File map

```
index.html                  Homepage
about/                      One fully-rendered static index.html per page
drilling-services/
service-area/
careers/
water-well-faq/
reviews/
contact/
functions/api/quote.js      POST /api/quote      — quote request handler
functions/api/careers.js    POST /api/careers    — job application handler
functions/api/_intake.js    Shared gates (not routed; leading underscore)
site.js                     Mobile menu, quote-form chips, form submission
uploads/                    Photography, logos, social card
404.html                    Branded not-found page (served automatically)
quote-received.html         Post-quote confirmation
thanks.html                 Post-application confirmation
robots.txt · sitemap.xml    Crawler rules and sitemap
favicon.png                 512px favicon (logo mark, white on brown)
apple-touch-icon.png        180px iOS home-screen icon
site.webmanifest            Icon/theme metadata
_headers                    Security + cache headers
```

## Pages and URLs

Eight real paths, each a separate static HTML file that renders fully without
JavaScript:

| Page | URL |
| --- | --- |
| Home | `/` |
| About | `/about/` |
| Services | `/drilling-services/` |
| Service Area | `/service-area/` |
| Careers | `/careers/` |
| FAQ | `/water-well-faq/` |
| Reviews | `/reviews/` |
| Contact | `/contact/` |

Reviews is reachable by link and by URL but is intentionally not in the header
navigation. Legacy `#hash` links still work — the homepage redirects
`#services` → `/drilling-services/`, `#faq` → `/water-well-faq/`, and so on.

## Editing content

Each page owns its own markup and copy — edit it on the page it appears on.
The header and footer are repeated in every file, so a global change means a
find-and-replace across the eight `index.html` files.

Open roles live in `careers/index.html` as a list of rows; the same job titles
also populate the application form's `<select>`, so update both together.

## Form backends (Pages Functions)

Both forms POST to a Pages Function instead of to a third party directly, so
no destination address appears in the page source.

| Form | Route | Handler | Success page |
| --- | --- | --- | --- |
| Quote request | `/api/quote` | `functions/api/quote.js` | `/quote-received.html` |
| Job application | `/api/careers` | `functions/api/careers.js` | `/thanks.html` |

Shared gates live in `functions/api/_intake.js` (the leading underscore keeps
Pages from routing it). Both routes run the same pipeline, cheapest rejection
first:

1. **Honeypot** — a filled `_honey` field returns a normal 200; nothing is
   stored or sent.
2. **Rate limit** — 5 submissions per IP per hour, counted separately per
   route in KV. KV counters are eventually consistent, so a burst may squeeze
   through one or two extra; acceptable at this volume.
3. **Turnstile** — token verified server-side against Cloudflare's siteverify
   endpoint. Failure returns a human-readable message and resets the widget.
4. **Durable write** — the submission is recorded in KV *before* any email, so
   a bounced or spam-filtered email cannot lose a lead.
5. **Email** — sent via FormSubmit's JSON endpoint. Failures are logged, not
   shown to the visitor, because the record is already safe.

### Resumes

The careers form takes plain fields only — no upload, so nothing is stored as
a blob and no object storage is needed. The form, the confirmation page and
the notification email all invite the applicant to email a resume directly to
the careers address.

Applications carry triage fields (position, years of experience, CDL status,
licenses, equipment run) so a candidate can be judged without one. The
notification subject line leads with position and experience.

### Cloudflare setup (project `elitedrillerssite3-6`)

Environment variables — **Settings → Environment variables**:

| Name | Value | Type |
| --- | --- | --- |
| `QUOTE_EMAIL` | `estimates@elitedrillers.com` | plaintext |
| `QUOTE_CC` | `chad@…,bliss@…,caleb@…` | plaintext, optional |
| `CAREERS_EMAIL` | `careers@elitedrillers.com` | plaintext |
| `CAREERS_CC` | `chad@…,bliss@…` | plaintext, optional |
| `TURNSTILE_SECRET` | Turnstile secret key | **secret** |

Bindings — **Settings → Bindings**:

| Type | Variable name | Purpose |
| --- | --- | --- |
| Workers KV | `LEADS` | submission records + rate-limit counters |

One Turnstile widget covers both forms — it is scoped to the domain, not the
form. The site key (`0x4AAAAAAEfUn9VNzNqAq4gT`) is already in
`contact/index.html` and `careers/index.html`. The matching **secret** key
goes in the `TURNSTILE_SECRET` environment variable.

Reading submissions: dashboard → **KV → LEADS**. Keys are prefixed `lead:` for
quote requests and `application:` for job applications, each carrying an ISO
timestamp.

**FormSubmit activation:** the first submission to a new address triggers a
confirmation email from FormSubmit. Click the link once per address
(`estimates@` and `careers@`) or submissions are held.

## Replacing photos

Drop a new file into `uploads/` using the same filename to swap an image in
place.

- `service-geotechnical-coring.jpg` — homepage hero (portrait, 3:4)
- `hero-rig.jpg` — geotechnical block on the services page
- `service-water-well-drilling.jpg`, `service-pump-service.jpg`,
  `service-well-rehabilitation.jpg`, `service-environmental-drilling.jpg`
  — services page (landscape, 4:3)
- `equipment-lineup.jpg`, `rig-detail.jpg` — equipment section (3:2)
- `crew-on-site.jpg` — about page (4:3)
- `team-bliss-jung.jpg`, `team-reid-wagner.jpg`, `team-bo-atkins.jpg`,
  `team-cynthia-masters.jpg` — headshots (square)
- `og-card.jpg` — social share card (1200×630)

### Videos

Two video slots are in place, both self-hosted MP4 with click-to-play controls:

| Page | File | Poster |
| --- | --- | --- |
| Home (between the stat tiles and the services list) | `uploads/home-video.mp4` | `uploads/hero-rig.jpg` |
| Careers (above the open roles) | `uploads/careers-video.mp4` | `uploads/crew-on-site.jpg` |

**Both sections ship hidden.** An inline script sends a `HEAD` request for the
MP4 on page load and reveals the section only if the file is actually there.
So the site can deploy before the videos exist and a visitor sees nothing —
no empty frame, no placeholder, no console error. Drop the file into
`uploads/` with the exact name above and the section appears on its own; no
markup change and nothing to switch on.

**Encoding.** Cloudflare Pages caps a single file at 25 MB, so keep each clip
to roughly 30 seconds at 1080p: H.264 / AAC, MP4 container, ~2.5 Mbps video.
For example:

```
ffmpeg -i source.mov -t 30 -vf scale=1920:-2 -c:v libx264 -crf 24 \
  -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart \
  uploads/home-video.mp4
```

`-movflags +faststart` matters — without it the video won't begin playing
until the whole file has downloaded.

If a clip needs to be longer than ~30 seconds, don't raise the bitrate ceiling
— switch that slot to a YouTube/Vimeo iframe or Cloudflare Stream instead. To
swap to an embed, replace the `<video>` element inside `[data-video-slot]`
with the iframe and delete the `[data-video-missing]` sibling.

Custom poster images are optional; the current ones are existing site photos.
A dedicated frame grab usually looks better:
`ffmpeg -i clip.mp4 -ss 2 -vframes 1 uploads/home-video-poster.jpg`

### Still needed

Headshots for Chad Fischer, Caleb Gregory, Larry Keith and Leslie White. Add
them as `uploads/team-first-last.jpg` (square, 2000px+) and point that
person's card at the new file in `about/index.html`. Until then those cards
show a silhouette placeholder.

## Maps

Both maps are inline SVG generated from US Census boundary data, simplified
with Ramer-Douglas-Peucker and hand-tuned for label placement. They are
vector, use the site's own fonts and brand colours, and together weigh ~15 KB
instead of ~670 KB as images. Standalone copies live at
`uploads/map-service-area.svg` and `uploads/map-midland-locator.svg`.

## Image sizes

Photos in `uploads/` are web-optimized (1000–1600px, JPEG q82, ~50–320 KB
each). **Do not commit straight-from-camera originals** — the first version of
this repo had 6–12 MB files totalling 100 MB, which broke the deploy. Keep the
masters elsewhere and export web copies at these sizes.

## SEO / metadata

Every page ships its own:

- `<title>` and meta description
- self-referencing `<link rel="canonical">` with no fragment
- `og:*` and `twitter:*` tags, including the share card at
  `uploads/og-card.jpg`
- exactly one `<h1>` naming the page's subject
- JSON-LD: LocalBusiness/GeneralContractor + WebSite on every page; FAQPage
  only on `/water-well-faq/`

Also site-wide: geo meta pointing at Midland, `lang="en"`, alt text on every
image, lazy loading below the fold, `robots.txt`, `sitemap.xml`.

Google Analytics 4 (tag `G-2VHV3C8P4V`) is installed on every page.

### Before you go live

1. **Domain.** Absolute URLs assume `https://elitedrillers.com`. If the live
   domain differs, find-and-replace across the HTML files, `robots.txt` and
   `sitemap.xml`.
2. **Env vars and bindings** above (the Turnstile site key is already in place).
3. **Google Business Profile.** The JSON-LD address, phone and hours must
   match it exactly, or the two fight each other in local search. This is the
   highest-value item for a Midland-area service business.
4. **Search Console + Bing Webmaster.** Add the property, submit
   `sitemap.xml`.

## Accessibility & mobile

- All tap targets are at least 44×44
- Form inputs are 16px, which stops iOS from zooming on focus
- Every form field has a real `<label>`; placeholders are examples only
- The mobile drawer has an explicit close control, cannot appear at desktop
  widths, and closes itself if the window is widened past 1024px
- Both maps carry descriptive `aria-label`s
- Responsive from 1920px desktop down to 360px phones

## Troubleshooting images after deploy

Go straight to an image URL, e.g. `https://your-site.pages.dev/uploads/hero-rig.jpg`.

- **404** → the `uploads/` folder didn't make it into the repo. Confirm it is
  visible on github.com and that the build output directory contains
  `index.html`.
- **HTML loads instead of the image** → a catch-all rewrite is intercepting
  assets. Delete any `_redirects` file; this site doesn't need one.
- **403** → filename case mismatch. All asset filenames are lowercase-hyphen.
- **Downloads as a tiny text file** → Git LFS is tracking images and
  Cloudflare Pages cannot resolve LFS pointers. Run
  `git lfs untrack "*.jpg" "*.png"`, clear `.gitattributes`, re-commit.

## Viewing locally

Static pages open fine by double-clicking, but the form routes need the Pages
runtime:

```
npx wrangler pages dev .
```

## Notes

- Fonts (Archivo, Barlow, Spline Sans Mono) load from Google Fonts at runtime.
- Licensing shown: drilling in TX · NM · OK, pump in TX. TX driller license #1988.
- Insurance shown: $20MM insured, bonded to $20MM per project.
