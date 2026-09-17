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

### Documentation

- Established the canonical changelog and its maintenance rule for significant completed changes, including tasks with restricted documentation scope.

### Build and Tooling

- Added PostCSS and esbuild asset builds, a local static development server and explicit `dist/` packaging of pages, selected public assets and static-hosting configuration.
- Added a Sharp image-generation workflow from `assets/img-src/` to `assets/img-optimized/`, producing AVIF, WebP and JPEG or PNG variants.

### Testing

- Added npm workflows for ESLint, HTML validation, local and external link checks, and configured pa11y-ci accessibility audits.
