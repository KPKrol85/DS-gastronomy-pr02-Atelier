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
- Restored the shared theme bootstrap and colour metadata contract on system pages, including early dark-theme initialization for the offline fallback.
- Standardized the demonstration disclosure across all pages, correcting the project wording and removing the divergent contact-page variant.
- Aligned the contact form's accessible name with its visible `Formularz kontaktowy` heading.
- Replaced the undefined menu-card focus colour fallback with the shared theme-aware focus token, restoring a visible indicator in both light and dark themes.
- Activated the reveal direction and stagger authoring contract, with immediate no-motion rendering for reduced-motion users and fallback environments.
- Simplified scrollspy ownership so IntersectionObserver exclusively tracks active sections when available, with the scroll-offset algorithm retained as a fallback and responsive observer geometry rebuilt on resize.
- Reduced redundant contact-form live-region updates so progress status is rewritten only when the validation summary actually changes.
- Removed the ineffective lightbox backdrop listener and consolidated control initialization while preserving navigation, accessibility metadata and focus restoration.
- Corrected the `cytrusowe-ciasto` source filename and added its missing 720×480 menu image variant, restoring reproducible optimized-image builds.
- Corrected gallery metadata and breadcrumb structured data, removing FAQ markup unrelated to the gallery page.
- Replaced the placeholder menu download with a complete demonstration PDF containing all 18 menu items, and aligned the download control with the delivered format.
- Improved keyboard focus visibility on contact form fields using the theme-aware focus-ring token, with verified contrast in both themes.
- Restored the contact dialog's inert closed state, preventing its controls from entering the keyboard tab order before acceptance and on returning visits.
- Aligned contact and reservation messaging across the home, contact and menu pages, SEO metadata and web manifest with the site's non-binding contact form.
- Replaced the About FAQ and matching structured data with project-focused content, and removed misleading reservation messaging from the location and contact sections.
- Standardized the author address and map destinations across all pages, with subtle KP_Code Digital Studio address captions.
- Aligned accessible names with visible labels across site-wide address links and key navigation CTAs.
- Updated sitemap modification dates to reflect verified substantive revisions across all eight indexed pages.
- Rendered the existing offline banner and page-specific hero notices on initial offline loads while preserving connectivity transition behaviour.
- Separated menu copy-link controls from all 24 headings, preserving clean accessible names, keyboard operation and responsive reveal behaviour.
- Aligned the 404 page with the shared body class contract without changing its rendering or runtime behaviour.
- Enforced shared body and closed demo-modal wrapper contracts in source QA with actionable validation errors.
- Corrected the small box-shadow token name and its legal-page consumer without changing the rendered shadow.

### Documentation

- Established the canonical changelog and its maintenance rule for significant completed changes, including tasks with restricted documentation scope.
- Established the canonical changelog and its maintenance rule for significant completed changes, including tasks with restricted documentation scope.
- Corrected bilingual README paths and project trees, and documented the GitHub Actions quality workflow and its separation from deployment.
- Documented the active development plan and current audit in both README language sections, aligning both project trees with the repository layout.

### Build and Tooling

- Replaced QA server process-tree cleanup with the existing http-server API in a small Node runner, avoiding missing WMIC on Windows and rejecting occupied QA ports.
- Separated source development from production output: source HTML uses ordinary assets; a clean build writes minified CSS/JS only into `dist/` and transforms copied HTML/Service Worker references.
- Added explicit dev/build/preview/qa/qa:dist workflows, production integrity checks and dist-based link/accessibility QA; restored the required bootstrap script in the deployment package and removed tracked source-tree bundles and obsolete command aliases.
- Added PostCSS and esbuild asset builds, a local static development server and explicit `dist/` packaging of pages, selected public assets and static-hosting configuration.
- Added a Sharp image-generation workflow from `assets/img-src/` to `assets/img-optimized/`, producing AVIF, WebP and JPEG or PNG variants.
- Extended ESLint coverage to browser modules, the Service Worker and all Node.js build and QA scripts with environment-specific globals, and removed an unused image-build declaration.

### Testing

- Added npm workflows for ESLint, HTML validation, local and external link checks, and configured pa11y-ci accessibility audits.
- Extended source contract validation to reject demonstration-modal markup without its JavaScript initializer and incomplete theme bootstrap or colour metadata across all 11 pages.
- Added source validation to keep the complete static menu and featured cards consistent with canonical menu data, including item selection, prices, categories and completeness.
- Extended automated accessibility checks to all 11 pages, including the contact form page, with successful source and production validation.
