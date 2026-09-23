# Atelier No.02 — Project Context

**Project type:** Static multi-page website (frontend-only, vanilla HTML/CSS/JS); no backend service
**Context status:** Active
**Last reviewed:** 2026-09-23

## Project identity

Atelier No.02 (`package.json` name: `atelier-no-02-restaurant`) is a multi-page demonstration website for a fictional fine-dining restaurant, built by Kamil Król under the KP_Code Digital Studio brand. It has no booking system, no CMS, and no custom backend; the contact form depends on Netlify Forms for delivery.

The site has 11 canonical pages: `index` (home), `about`, `menu`, `gallery`, `contact`, `cookies`, `polityka-prywatnosci` (privacy policy), `regulamin` (terms), `offline`, `thank-you`, and `404`. User-facing content is Polish-primary (`lang="pl"` on every page); `README.md` is maintained bilingually (Polish, then a full English translation).

The project is governed by a proprietary KP_CODE license (`LICENSE`), not an open-source license — see [Project boundaries](#project-boundaries).

## Project intent

The repository is explicitly positioned as KP_Code Digital Studio reference/portfolio work (`package.json` keywords include `portfolio`; `LICENSE` frames permitted use around "portfolio review, code review, testing, or educational study"). Treat it as a technically serious reference implementation: architecture, accessibility, semantics, maintainability, and content/metadata integrity are expected to hold up under technical review, not just visual review.

## Technology stack

- **Interface:** HTML5, layered CSS (`@import`-based, no preprocessor), vanilla JavaScript via native ES Modules — no frontend framework or UI library. Self-hosted local WOFF2 fonts.
- **Build:** Node.js/npm scripts, PostCSS (`postcss-import`, `cssnano`) for CSS, esbuild for JS bundling/minification (target `es2018`).
- **Images:** Sharp + `fast-glob` (`scripts/images/build-images.js`) generate AVIF/WebP/JPEG variants from source images and copy SVGs.
- **Quality tooling:** ESLint (flat config), html-validate, pa11y-ci (WCAG2AA via HTML CodeSniffer), a custom linkinator-based link checker (`scripts/qa-links.js`), and a custom Node contract validator (`scripts/validate-dist.js`).
- **Dev/runtime glue:** `http-server` for local dev/preview, a custom managed-server QA runner (`scripts/qa-server.js`), a hand-written Service Worker (`sw.js`) and Web App Manifest (`manifest.webmanifest`) for PWA/offline behavior.
- No runtime dependencies are declared — `package.json` has no `dependencies` key, only `devDependencies`. No Node.js version is pinned in project configuration (no `engines` field); CI pins Node 22 independently.

## Architecture

Static multi-page site: each route is its own HTML document, and header/footer markup is duplicated per page rather than generated from a shared template.

Two JS entry points, selected per page by which `<script type="module">` the page loads:

- `js/script.js` → `js/app/init.js` — full entry, used by `index`, `about`, `menu`, `gallery`, `contact`, `thank-you`, `offline`. Runs common initializers, then page-specific initializers selected by `document.body.dataset.page` (`<body class="page page--<name>" data-page="<name>">`).
- `js/core.js` — reduced entry, used by `404`, `cookies`, `polityka-prywatnosci`, `regulamin`. Runs only the shared initializers (icons, misc, demo modal, nav, reveal, theme toggle); no page-specific features.

`js/bootstrap.js` loads separately (`<script defer>` in `<head>`) on every page, outside both bundles: it syncs the `theme-color` meta tag to the active theme and registers `/sw.js` (registration is skipped on `localhost`/`127.0.0.1`/`::1`).

CSS has a single entry, `css/style.css`, which `@import`s layered partials in a fixed order — `base` (tokens, reset, base, typography) → `layout` → `components` → `pages`. `postcss-import` inlines these into one file at build time; there is no CSS-in-JS or scoped-component styling.

## Canonical source ownership

- **Canonical:** root `*.html`, `css/style.css` and its imported partials, `js/**/*.js` sources, `sw.js`, `data/menu.json`, `assets/img-src/**` (image sources), and `scripts/*.js` (build/QA tooling). `scripts/build-config.js` is the single source of truth for the page list, root runtime files, copied asset entries, and the source→production filename map; `build-dist.js`, `validate-dist.js`, and `README.md`'s structure listing all derive from it.
- **Generated, gitignored (`dist/`):** `dist/css/style.min.css`, `dist/js/script.min.js`, `dist/js/core.min.js`, and the rest of the prepared production package. Entirely rebuilt by `npm run build`; never hand-edited or committed. Not present in a checkout until a build runs.
- **Generated, but tracked:** `assets/img-optimized/**`, produced from `assets/img-src/**` by `npm run images:build` (a separate workflow, not part of `npm run build`). Source HTML/CSS/`data/menu.json` reference it directly, so it must be regenerated and committed after source-image changes.
- `sw.js` is hand-maintained; the build only rewrites its embedded CSS/JS path references for the `dist/` copy. `js/bootstrap.js` is copied into `dist/` verbatim (not rewritten, not bundled).

## Project structure

```text
./
├── index.html, about.html, menu.html, gallery.html, contact.html
├── cookies.html, polityka-prywatnosci.html, regulamin.html
├── offline.html, thank-you.html, 404.html   # 11 canonical pages
├── css/
│   ├── style.css                # single entry; @imports the layers below
│   ├── base/                    # tokens, reset, base, typography
│   ├── layout/                  # layout, grid, header, footer
│   ├── components/              # nav, buttons, cards, forms, lightbox, modal, ...
│   └── pages/                   # home, about, contact, menu, gallery, legal, system-pages
├── js/
│   ├── script.js                # full entry -> app/init.js
│   ├── core.js                  # reduced entry (404 + 3 legal pages)
│   ├── bootstrap.js             # theme-color sync + SW registration, loaded on every page
│   ├── app/init.js              # data-page dispatch, common + per-page initializers
│   ├── core/                    # dom.js, scrollspy.js
│   └── features/                # demo-modal, form, gallery, icons, lightbox, menu, misc, nav, network, reveal, theme
├── data/menu.json               # canonical menu content
├── assets/
│   ├── img-src/                 # tracked image sources
│   ├── img-optimized/           # tracked; generated by `npm run images:build`
│   ├── fonts/, icons/, docs/menu.pdf
├── scripts/
│   ├── build-config.js          # source of truth: pages, runtime files, asset entries, prod filename map
│   ├── build-dist.js, validate-dist.js, qa-links.js, qa-server.js
│   └── images/build-images.js
├── docs/
│   ├── CHANGELOG.md, settings.md
│   └── archive/{audits,plans}/  # superseded audit/plan documents
├── .github/workflows/quality.yml  # CI: qa -> build -> qa:dist
├── manifest.webmanifest, sw.js, robots.txt, sitemap.xml
├── _headers, _redirects         # Netlify hosting rules
├── package.json, package-lock.json
├── dist/                        # generated production package (gitignored)
└── LICENSE
```

## Development conventions

- **Page identity:** `<body class="page page--<name>" data-page="<name>">` on every page; `js/app/init.js` reads `dataset.page` (falling back to `dataset.template`) to select page-specific initializers.
- **SVG icons:** a shared inline registry (`js/features/icons.js`) holds path data for 7 retained Font Awesome Free icons keyed by `data-icon`, and fills empty `<svg data-icon="...">` placeholders at runtime. Preserve the Font Awesome Free 7.1.0 attribution comments in that file and in `assets/icons/svg-icon/*.svg`.
- **Design tokens:** colors, breakpoints, shadows, and focus-ring values are centralized as CSS custom properties in `css/base/tokens.css`.
- **JS modules:** native ES Modules under `js/app/`, `js/core/`, `js/features/`; feature modules export `init*` functions composed by the two entry points. `scripts/**/*.js` are Node CommonJS (no `type: module` in `package.json`).
- **Menu content:** `data/menu.json` is the single source for menu items (category, title, description, price, tags, responsive image variants); `menu.html` fetches and renders it with search/tag filtering. Static HTML cards remain in the page markup as a fallback when JavaScript or the fetch is unavailable — keep both in sync when editing menu content.
- **Per-page metadata contract:** `scripts/validate-dist.js` enforces that title, meta description, `og:title`, breadcrumb terminal name, and canonical URL are unique per page, and that `og:url`/breadcrumb self-references match the page's own canonical URL.

## Quality contracts

- **Accessibility:** semantic landmarks, skip links, field labels, and visible focus states throughout; mobile navigation, the lightbox, and the demo-notice dialog manage focus and support keyboard interaction; form validation toggles `aria-invalid` and status messages use `aria-live` regions. `pa11y-ci` (WCAG2AA/htmlcs) runs against all 11 pages but does not by itself establish full WCAG conformance, and does not cover the contact form's interactive validation states.
- **Motion:** animations respect `prefers-reduced-motion`; the reveal-on-scroll module also shows content immediately when `IntersectionObserver` is unavailable.
- **SEO/metadata:** every page has a title, description, canonical link, Open Graph and Twitter Card tags, and JSON-LD (`Organization`, plus per-page types such as `Restaurant`/`BreadcrumbList`); uniqueness and self-reference consistency are enforced by `scripts/validate-dist.js` against both source and built output.
- **Images/performance:** `<picture>`/`srcset` with AVIF/WebP/JPEG variants, explicit dimensions, and selective `loading="lazy"`; the homepage preloads its two referenced variable fonts and the hero image (`fetchpriority="high"`); font-face declarations use `font-display: swap`. No Lighthouse or Core Web Vitals results are recorded in the repository.

## Data and state

- `data/menu.json` holds static menu content (items, categories, descriptions, prices, tags, responsive image variant metadata). There is no CMS or remote API.
- Menu search/filter state lives in page memory only and is not persisted.
- `localStorage` stores the theme choice under `kp-theme` and demo-notice acknowledgement under `kp-demo-accepted` (a legacy `kp_demo_legal_ack` key is also read); all storage access is wrapped in `try/catch`.
- Cache Storage (via `sw.js`) holds precached pages/assets for offline support. There is no account system or cross-device sync.

## Build and generated output

- **Dev:** `npm run dev` — `http-server` serves the repository root, unbuilt, with HTTP caching disabled, on `127.0.0.1:5173`.
- **Build:** `npm run build` chains `build:static` (`scripts/build-dist.js` — clears and repopulates `dist/`, copies/transforms HTML and `sw.js` references, copies root runtime files and tracked assets) → `build:css` (PostCSS to `dist/css/style.min.css`) → `build:js` (esbuild, `js/script.js` + `js/core.js` → `dist/js/*.min.js`) → `qa:dist:integrity`.
- **Preview:** `npm run preview` — `http-server` serves only `dist/` on the same port; stop `dev` first.
- **Images:** `npm run images:build` is separate and manually triggered; it is not part of `npm run build`.
- Only `dist/` is gitignored generated output; `assets/img-optimized/` is generated but tracked (see [Canonical source ownership](#canonical-source-ownership)).

## Testing and verification

- `npm run lint` — ESLint (flat config, `eslint.config.mjs`) over `js/**/*.js`, `sw.js`, `scripts/**/*.js`, each with an appropriate global set and module type.
- `npm run qa` — `lint` + `qa:source` (rejects generated files among sources; checks source HTML entries) + `qa:html` (html-validate on root `*.html`) + `qa:server` (starts a managed dev server, then runs `qa:links` and `qa:a11y` against it, closing the server afterward even on failure).
- `npm run qa:dist` — the same shape against the built package: `qa:dist:integrity` (`scripts/validate-dist.js` — full contract check of pages, assets, CSS, manifest, menu images, bootstrap, Service Worker precache list, and per-page metadata uniqueness) + `qa:dist:html` + `qa:dist:server` (against the preview server). Does not rebuild.
- `npm run qa:links` / `qa:links:external` — custom checker (`scripts/qa-links.js`) over all 11 pages' local links, assets, fragments, CSS imports, and fonts; the `:external` variant additionally checks outbound links against a running server.
- `npm run qa:a11y` — `pa11y-ci` against all 11 URLs listed in `.pa11yci`.
- **CI** (`.github/workflows/quality.yml`): on push/PR to `main` and manual dispatch, `ubuntu-latest` + Node 22 runs `npm ci` → `npm run qa` → `npm run build` → `npm run qa:dist`. This validates and builds only — it does not deploy.
- There is no unit or component test suite; verification is static analysis, contract/schema checks, and accessibility/link auditing against a running server.

## Deployment

- The repository prepares a static `dist/` package together with root-level `_headers`/`_redirects` in Netlify's format: differentiated caching (long-cache immutable for `assets/*`, must-revalidate for HTML/CSS/JS), baseline security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, Cross-Origin-*), and a `/* → /404.html` catch-all returning a 404 status.
- The contact form (`contact.html`) is wired for Netlify Forms (`data-netlify`, `netlify-honeypot`, hidden `form-name` field) with a redirect to `thank-you.html`.
- Manifest, Service Worker, and canonical/Open Graph metadata assume deployment at a domain root.
- CI builds and validates the package but does not publish it. `README.md` documents deployment as a manual step performed by the project owner on Netlify; this repository does not itself verify that a deployment is live or reflects the current source.

## Project boundaries

- Frontend-only: no backend service, database, authentication, or booking system.
- The restaurant is a fictional demonstration brand; content and SEO metadata do not imply real-world indexing, ranking, or business operation.
- Contact-form delivery, PWA installability, and the state of any deployed site are outside what this repository's own checks verify.
- Proprietary license (`LICENSE`, KP_CODE Proprietary Project License v1.0; Polish text controls in case of conflict with the English text): the repository is source-available for review, not open source. Reuse, redistribution, derivative works, and commercial use all require the owner's prior written permission.

## Maintenance rules

- Never hand-edit anything in `dist/`, including `css/style.min.css`, `js/script.min.js`, or `js/core.min.js` — run `npm run build` instead.
- After changing `assets/img-src/**`, re-run `npm run images:build` and commit the regenerated `assets/img-optimized/**`.
- When adding, removing, or renaming a page or root runtime file, update `scripts/build-config.js` together with `sw.js` and `manifest.webmanifest`, and check `sitemap.xml`.
- When cached assets change, bump `CACHE_VERSION` in `sw.js`.
- Keep per-page metadata (title, description, `og:title`, breadcrumb name, canonical, `og:url`) unique and self-consistent; `scripts/validate-dist.js` enforces this against both source and built output.
