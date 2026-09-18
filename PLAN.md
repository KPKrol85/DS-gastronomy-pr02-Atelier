# Atelier No.02 — Development Plan

**Last reviewed:** 2026-09-17
**Project type:** Multi-page static front-end site (HTML, modular CSS, Vanilla JavaScript ES Modules) with a Node build/QA pipeline, Netlify hosting configuration and a manually maintained PWA layer
**Plan status:** Active

## Planning principles

- The plan reflects the repository state verified at the review date; no prior plan existed.
- A main item is checked only when every required subtask is complete.
- Canonical sources are the 11 root HTML pages, `css/style.css` and its modules, the entries and modules under `js/`, `sw.js`, `data/menu.json` and the files under `scripts/`. `dist/` is generated output and is never edited directly.
- Items converted from `daily-AUDIT.md` carry their source identifier; each was re-verified against current source before inclusion.
- When a task completes, evaluate whether the change belongs in `docs/CHANGELOG.md` and record it there when scope permits.

## Current priorities

1. `PH1-01` — Synchronise the desktop dropdown state reported to assistive technology.
2. `PH1-02` — Align the reduced JavaScript entry with the markup its four pages ship.
3. `PH1-03` — Stop the connection-restored notice from firing on every page load.
4. `PH1-04` — Expose menu filter state and result changes on the primary content page.
5. `PH2-01` — Correct the sitemap namespace that gates public URL discovery.

## Phase 1 — Interaction wiring defects

**Goal:** Resolve the verified cases where markup, CSS and JavaScript disagree about the same feature, so implemented interactions behave as their source claims.

- [x] **PH1-01 — Synchronise desktop navigation dropdown state** — **Priority:** High
  - [x] keep `aria-expanded` on `.nav__dropdown-toggle` aligned with the panel state the desktop rules render through `.nav__item--dropdown:hover` and `:focus-within` in `css/components/nav.css`, or give the toggle a real action above the 1024px breakpoint
  - [x] replace the unconditional early exit in the dropdown click handler in `js/features/nav.js` with the desktop behaviour chosen
  - [x] preserve the mobile accordion behaviour, `closeNavDropdowns` and the breakpoint-change normalisation in `syncNavA11y`
  - [x] verify by keyboard traversal that the announced state matches the visible panel on both sides of the 1024px breakpoint
  - **Completion condition:** on all 11 pages the toggle's `aria-expanded` matches whether the submenu links are visible and focusable, and the button performs an action at every width
  - **Source:** `daily-AUDIT.md` — P1-06

- [x] **PH1-02 — Align the reduced JavaScript entry with the markup its pages ship** — **Priority:** High
  - [x] decide whether `js/core.js` owns the demonstration disclosure and the scroll reveals, or whether the four pages it serves (`404.html`, `cookies.html`, `polityka-prywatnosci.html`, `regulamin.html`) should stop shipping that markup
  - [x] apply the decision consistently: either import `initDemoLegalModal` and `initReveal` into `js/core.js`, or remove the `#demo-legal-modal` block and the 19–35 `data-reveal` attributes from the three legal pages
  - [x] keep the shared `kp-demo-accepted` acknowledgement key and its legacy-key migration unchanged on the pages that retain the dialog
  - [x] verify on one legal page that the disclosure and its acceptance control are reachable and dismissible, or that no permanently inert dialog markup remains
  - **Completion condition:** no page ships feature markup that its JavaScript entry never initialises
  - **Source:** `daily-AUDIT.md` — P1-02

- [x] **PH1-03 — Seed connectivity state without announcing a transition** — **Priority:** High
  - [x] initialise `lastState` in `js/features/network.js` from the current `navigator.onLine` value without rendering the recovery message
  - [x] preserve the offline message, the four-second auto-hide and the `.offline-note` insertion on the menu and gallery heroes for genuine transitions
  - [x] verify that a normal online load on a `js/script.js` page shows no banner, and that going offline and back online still announces both directions
  - **Completion condition:** the `#network-status` region reports only real online/offline transitions
  - **Source:** `daily-AUDIT.md` — P1-03

- [x] **PH1-04 — Expose menu filter state and result changes** — **Priority:** High
  - [x] add `aria-pressed` to the `.menu-filters__btn` controls in `menu.html` and keep it synchronised with the `is-active` class in `js/features/menu.js`
  - [x] give `.menu-filters__empty` a live role so the no-results message is announced when it becomes visible
  - [x] announce the resulting item count, or its absence, after a search term or tag filter is applied
  - [x] verify that the announced state matches the visible filter after switching tags and after clearing the search field
  - **Completion condition:** applying a filter or search reports the selected filter and the resulting state without relying on visual feedback
  - **Source:** `daily-AUDIT.md` — P1-05

- [x] **PH1-05 — Render the active category state in the sticky tabs** — **Priority:** High
  - [x] align the active-state rules in `css/components/tabs-nav.css` with the `is-active` class and the `aria-current="location"` value that `setActive` in `js/core/scrollspy.js` writes
  - [x] replace the undefined `--shadow-box` custom property used inside that rule with a defined token, or remove the declaration
  - [x] verify on `menu.html` and `gallery.html` that the current category is marked while scrolling and after clicking a tab
  - **Completion condition:** the sticky category navigation shows the current section on both pages, and no rule in `css/` references an undefined shadow token
  - **Source:** `daily-AUDIT.md` — P1-01

- [x] **PH1-06 — Restore lightbox focus after the background becomes interactive** — **Priority:** High
  - [x] move the `lastTrigger.focus()` call in `closeLightbox()` (`js/features/lightbox.js`) to after `setPageInert(false)` removes `inert` and `aria-hidden` from the page landmarks
  - [x] verify that closing with Escape and with the close button both return focus to the gallery link that opened the dialog
  - **Completion condition:** keyboard focus returns to the originating gallery link instead of the document body
  - **Source:** `daily-AUDIT.md` — P1-04

## Phase 2 — Public-facing contract consistency

**Goal:** Make the public metadata and the per-page blocks duplicated across the 11 pages consistent with each other.

- [x] **PH2-01 — Correct the sitemap namespace declarations** — **Priority:** High
  - [x] set the `urlset` default namespace in `sitemap.xml` to the `http` form defined by the sitemap protocol
  - [x] remove the declared but unused `xhtml` prefix
  - [x] verify the document still lists the eight URLs advertised through `robots.txt`
  - **Completion condition:** `sitemap.xml` declares only namespaces the sitemap protocol defines
  - **Source:** `daily-AUDIT.md` — P1-07

- [x] **PH2-02 — Restore the shared head contract on the system pages** — **Priority:** Medium
  - [x] add the inline `kp-theme` preload script and the `js/bootstrap.js` reference to `offline.html`
  - [x] add the `theme-color` and `color-scheme` meta tags missing from `offline.html`, `404.html` and `thank-you.html`
  - [x] verify that a dark-theme load of the precached offline page renders dark without a visible flip to light
  - **Completion condition:** all 11 pages carry the same theme bootstrap and colour metadata
  - **Source:** `daily-AUDIT.md` — P2-03

- [ ] **PH2-03 — Establish one canonical demonstration disclosure** — **Priority:** Medium
  - [ ] choose the canonical wording and correct the misspelling in the variant currently carried by nine pages
  - [ ] replace the divergent `contact.html` wording, which names a different owner entity, with the canonical text
  - [ ] apply the canonical text to every page that still carries `#demo-legal-modal` after `PH1-02`
  - **Completion condition:** every page carrying the disclosure shows identical, correctly spelled wording
  - **Depends on:** `PH1-02`
  - **Source:** `daily-AUDIT.md` — P2-07

- [ ] **PH2-04 — Name the contact form after its visible heading** — **Priority:** Low
  - [ ] replace the reservation-form `aria-label` on the `contact.html` form with a name matching the visible `#contact-title` heading, or associate the form with that heading
  - [ ] verify the accessible name no longer describes a booking capability the three-field form does not implement
  - **Completion condition:** the form's accessible name matches the visible heading that introduces it
  - **Source:** `daily-AUDIT.md` — P2-05

## Phase 3 — Styling contract integrity

**Goal:** Make CSS tokens and authoring attributes resolve to real, theme-aware implementations.

- [ ] **PH3-01 — Replace the undefined accent token in the menu-card focus outline** — **Priority:** Medium
  - [ ] point the `.menu-card` link `:focus-visible` rule in `css/components/cards.css` at a defined, theme-aware token instead of the undefined `--accent` property with a literal fallback
  - [ ] confirm the rule still resolves as intended against the `:where()`-based link focus rule in `css/components/buttons.css`, or fold it into that rule
  - [ ] verify the focus indicator on menu-card links is visible in both light and dark themes
  - **Completion condition:** no focus rule in `css/` depends on an undefined custom property, and the menu-card indicator changes with the theme
  - **Source:** `daily-AUDIT.md` — P2-06

- [ ] **PH3-02 — Reconcile the reveal authoring API with the stylesheet** — **Priority:** Low
  - [ ] decide whether `--rx`, `--ry` and `--reveal-delay` become part of the reveal transition or are removed
  - [ ] apply the decision across `css/components/animations.css`, the per-item delay loop in `js/features/reveal.js` and the `data-reveal-dir` attributes authored in `index.html` and `contact.html`
  - [ ] keep the reduced-motion and missing-`IntersectionObserver` paths showing content immediately
  - **Completion condition:** every reveal custom property and `data-reveal-dir` attribute in the repository is either consumed by a rule or no longer present
  - **Source:** `daily-AUDIT.md` — P2-01

## Phase 4 — Module ownership and redundant work

**Goal:** Give each interactive behaviour one owner and remove code that has no effect.

- [ ] **PH4-01 — Give the scrollspy a single active-section owner** — **Priority:** Medium
  - [ ] make either the `IntersectionObserver` branch or the scroll-offset algorithm in `js/core/scrollspy.js` the owner of the active section, and reduce the other to a fallback
  - [ ] ensure the `topPercent`, `bottomPercent` and `bottomPercentMobile` configuration passed from `js/features/menu.js` and `js/features/gallery.js` reaches the owning mechanism
  - [ ] verify the active tab tracks scrolling on `menu.html` and `gallery.html` at mobile and desktop widths
  - **Completion condition:** one mechanism determines the active section, and the configured thresholds have a single meaning
  - **Depends on:** `PH1-05`
  - **Source:** `daily-AUDIT.md` — P2-02

- [ ] **PH4-02 — Limit form progress live-region writes to real changes** — **Priority:** Medium
  - [ ] compare the computed message against the current `#form-progress` text before assigning it in `updateProgress()` (`js/features/form.js`)
  - [ ] verify that typing in the message field no longer rewrites the region while the counted message is unchanged
  - **Completion condition:** the progress region is written only when its message actually changes
  - **Source:** `daily-AUDIT.md` — P2-04

- [ ] **PH4-03 — Remove dead lightbox interaction code** — **Priority:** Low
  - [ ] remove the overlay `click` handler in `js/features/lightbox.js` that contains only an early return, or implement the backdrop dismissal it implies
  - [ ] collapse the duplicated control-label initialisation into a single assignment
  - [ ] verify the lightbox still opens, navigates, toggles fullscreen and closes
  - **Completion condition:** the module contains no handler or assignment without an effect
  - **Source:** `daily-AUDIT.md` — P2-08

## Phase 5 — Documentation and validation contracts

**Goal:** Bring the documented repository layout and the executable source contract back in line with the files that exist.

- [ ] **PH5-01 — Correct the README layout and workflow references** — **Priority:** Medium
  - [ ] update both changelog links in `README.md` to `docs/CHANGELOG.md`
  - [ ] add the `docs/` directory, including `docs/settings.md`, to both project-structure trees and remove the root `CHANGELOG.md` entry from both
  - [ ] document the `.github/workflows/quality.yml` workflow and the checks it runs on push and pull request to `main`
  - [ ] verify every path listed in both trees exists in the repository
  - **Completion condition:** both language sections of `README.md` describe the current documentation layout and CI contract
  - **Source:** `daily-AUDIT.md` — P2-09

- [ ] **PH5-02 — Extend the source contract check to the page contracts that drifted** — **Priority:** Medium
  - [ ] in `validateSource()` (`scripts/validate-dist.js`), assert that `#demo-legal-modal` markup appears only on pages whose JavaScript entry initialises it
  - [ ] assert that every page in `htmlPages` carries the inline theme bootstrap, the `js/bootstrap.js` reference and the colour metadata
  - [ ] verify `npm run qa:source` fails on a page deliberately changed to violate either contract, and passes on the corrected tree
  - **Completion condition:** `npm run qa:source` rejects both drift patterns this plan corrects
  - **Depends on:** `PH1-02`, `PH2-02`

## Phase 6 — Final verification

**Goal:** Confirm the corrected tree passes the project's own source and production contracts.

- [ ] **PH6-01 — Run the full source and production pipeline** — **Priority:** Medium
  - [ ] install locked dependencies with `npm ci`
  - [ ] run `npm run qa` and record the ESLint, source contract, HTML validation, link and pa11y-ci results
  - [ ] run `npm run build`, then `npm run qa:dist`
  - [ ] capture any failure as a new plan item rather than leaving it undocumented
  - **Completion condition:** both pipelines complete, or every failure is recorded as a tracked item
  - **Depends on:** Phases 1–5
  - **Note:** `daily-AUDIT.md` reports these commands as not run and `node_modules/` is absent from the current checkout, so their current results are unknown

## Optional future improvements

- [ ] **O-01 — Add a menu data and static fallback parity check**
  - **Value:** `data/menu.json` and the static fallback cards in `menu.html` and `index.html` currently list the same 18 titles and prices; a comparison inside `scripts/validate-dist.js` would catch future divergence between the JavaScript and no-JavaScript menus at the same moment as the other contract checks.
  - **Scope boundary:** safeguard against future drift; the two sources agree today, so this corrects no current defect.

- [ ] **O-02 — Extend ESLint coverage to the service worker and build scripts**
  - **Value:** `npm run lint` runs ESLint over `js/` only, leaving `sw.js` and the six files under `scripts/` as the only JavaScript in the repository without static analysis in CI.
  - **Scope boundary:** tooling coverage only; no defect in those files was found.

- [ ] **O-03 — Include the contact page in the automated accessibility run**
  - **Value:** `.pa11yci` lists 10 URLs and omits `contact.html`, the only page with a form, validation messaging and live regions.
  - **Scope boundary:** the omission is documented in `README.md` and `docs/settings.md` as an intentional current limitation; adding it is non-blocking.
