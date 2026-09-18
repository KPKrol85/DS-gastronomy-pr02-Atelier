# Changelog

All significant changes to this project are documented in this file.

`CHANGELOG.md` is the canonical record of significant completed changes. Evaluate each completed implementation task for a required update; record significant changes when task scope permits, and report any required update when it does not.

## [Unreleased]

### Added

- Added a static multi-page restaurant demonstration site with shared and page-specific JavaScript module initialization.
- Added featured and category menu rendering from `data/menu.json`, text search and tag filters, preserving static cards when data is unavailable.
- Added grouped gallery lightboxes with captions, image counters, keyboard and touch navigation, fullscreen controls and Tab trapping.
- Added mobile navigation with drawer focus management, Tab trapping, Escape and outside-click dismissal, and hidden-state `inert` handling.
- Added light and dark themes with system preference support, `localStorage` persistence and synchronized theme-color metadata.
- Added scroll reveals that expose content immediately when reduced motion is requested or `IntersectionObserver` is unavailable.
- Added a contact form configured for native Netlify Forms POST submission, honeypot filtering, field validation and submission progress feedback.
- Added a dismissible demonstration notice with keyboard focus handling and a locally persisted acknowledgement.
- Added a standalone PWA manifest and Service Worker caching with network-first navigation, cache-first assets, an offline fallback and connection-status notices.

### Changed

- Standardized the site terms and unified legal-page styling, operator information and contact details.
- Standardized the privacy policy and clarified Netlify Forms processing and embedded Google Maps disclosures, correcting the cookies policy's third-party integration description.
- Standardized the cookies policy and documented existing `localStorage`, Service Worker and Cache Storage use.
- Adopted the bilingual KP_CODE proprietary license and aligned root npm license metadata and README licensing notices, preserving third-party licenses.
- Synchronized navigation dropdown visibility and `aria-expanded` state across mobile and desktop, with explicit desktop disclosure controls and a preserved no-JavaScript hover/focus fallback.
- Aligned the reduced JavaScript entry with shipped page markup by initializing the shared demo disclosure and reveal features on legal and system pages.
- Corrected connectivity-state initialization so network status notifications are shown only for genuine online and offline transitions.
- Improved menu filtering accessibility with synchronized pressed states and live announcements for result counts and empty searches.
- Aligned sticky category navigation styling with the active scrollspy state on menu and gallery pages, using valid theme-aware shadow tokens.
- Corrected lightbox focus restoration so closing returns keyboard focus to the originating gallery link after the background becomes interactive.
- Corrected the sitemap protocol namespace and removed the unused XHTML namespace declaration while preserving the existing public URL inventory.

### Documentation

- Established the canonical changelog and its maintenance rule for significant completed changes, including tasks with restricted documentation scope.

### Build and Tooling

- Replaced QA server process-tree cleanup with the existing http-server API in a small Node runner, avoiding missing WMIC on Windows and rejecting occupied QA ports.

- Separated source development from production output: source HTML uses ordinary assets; a clean build writes minified CSS/JS only into `dist/` and transforms copied HTML/Service Worker references.
- Added explicit dev/build/preview/qa/qa:dist workflows, production integrity checks and dist-based link/accessibility QA; restored the required bootstrap script in the deployment package and removed tracked source-tree bundles and obsolete command aliases.

- Added PostCSS and esbuild asset builds, a local static development server and explicit `dist/` packaging of pages, selected public assets and static-hosting configuration.
- Added a Sharp image-generation workflow from `assets/img-src/` to `assets/img-optimized/`, producing AVIF, WebP and JPEG or PNG variants.

### Testing

- Added npm workflows for ESLint, HTML validation, local and external link checks, and configured pa11y-ci accessibility audits.
