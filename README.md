# Atelier No.02

## PL

### Przegląd projektu

Atelier No.02 to demonstracyjna, wielostronicowa witryna fikcyjnej restauracji fine dining, opracowana przez KP_Code Digital Studio. Statyczne strony HTML są uzupełniane modułami JavaScript i wspólnym arkuszem CSS.

Projekt obejmuje stronę główną, informacje o restauracji, menu, galerię, kontakt, strony prawne oraz widoki offline, potwierdzenia formularza i 404. Nie zawiera systemu rezerwacji ani własnego backendu; formularz kontaktowy jest skonfigurowany do obsługi przez Netlify Forms.

### Wersja online

[Adres demo wskazany w repozytorium](https://gastronomy-project-02.netlify.app/) pochodzi z regulaminu i metadanych stron. Dostępność witryny oraz zgodność wdrożonej wersji z bieżącym kodem nie zostały potwierdzone.

### Kluczowe funkcje

- Menu renderowane z `data/menu.json`, wyszukiwanie tekstowe i filtrowanie po tagach; statyczne karty pozostają dostępne bez JavaScript lub po nieudanym pobraniu danych.
- Galeria z grupowanym lightboxem, podpisami, licznikiem, nawigacją klawiaturą i gestami oraz trybem pełnoekranowym.
- Nawigacja z rozwijanymi sekcjami i mobilnym panelem z obsługą fokusa.
- Motywy jasny i ciemny, preferencja systemowa oraz lokalny zapis wyboru użytkownika.
- Formularz kontaktowy z natywnym POST, honeypotem, walidacją pól i komunikatem trwającej wysyłki. JavaScript nie symuluje udanej dostawy; rzeczywisty odbiór przez Netlify nie został sprawdzony.
- Komunikaty online/offline i zamykana informacja o demonstracyjnym charakterze serwisu.

### Stack technologiczny

- **Interfejs:** HTML5, modułowy CSS, Vanilla JavaScript z ES Modules; lokalne fonty WOFF2.
- **Build:** Node.js i npm, PostCSS z `postcss-import` i `cssnano`, esbuild.
- **Obrazy:** Sharp i `fast-glob` do generowania wariantów AVIF, WebP i JPEG/PNG oraz kopiowania SVG.
- **Walidacja i development:** ESLint, html-validate, linkinator, pa11y-ci, http-server i lokalny runner Node.js.

### Architektura

Każda podstrona jest osobnym dokumentem HTML. Wspólny nagłówek i stopka są zapisane w poszczególnych stronach; build nie generuje ich z szablonów. `js/script.js` uruchamia `js/app/init.js`, który rozdziela inicjalizatory wspólne i funkcje stron według `data-page`. `js/core.js` jest mniejszym wejściem używanym przez strony prawne i stronę 404.

`css/style.css` importuje warstwy `base`, `layout`, `components` i `pages`. Źródłowy HTML ładuje zwykły CSS i wejścia ES Modules. PostCSS oraz esbuild zapisują bundle `.min.css` i `.min.js` wyłącznie w `dist/`; build przekształca odwołania w kopiach HTML. Osobny `js/bootstrap.js` synchronizuje kolor motywu i rejestruje Service Workera.

### Struktura projektu

```text
./
├── .github/
│   └── workflows/
│       └── quality.yml     # workflow CI: kontrole źródeł i paczki
├── index.html
├── about.html
├── menu.html
├── gallery.html
├── contact.html
├── cookies.html
├── polityka-prywatnosci.html
├── regulamin.html
├── offline.html
├── thank-you.html
├── 404.html
├── css/                    # wyłącznie źródła CSS
├── js/                     # źródła: wejścia, bootstrap, app/, core/, features/
├── data/menu.json
├── assets/
│   ├── img-src/            # źródła obrazów
│   ├── img-optimized/      # wygenerowane warianty
│   ├── fonts/
│   ├── icons/
│   └── docs/menu.svg
├── scripts/
│   ├── build-config.js
│   ├── build-dist.js
│   ├── validate-dist.js
│   ├── qa-links.js
│   ├── qa-server.js
│   └── images/build-images.js
├── docs/
│   ├── CHANGELOG.md        # zapis znaczących zmian
│   └── settings.md         # opis skryptów npm i workflow
├── dist/                   # generated production package (ignored)
├── manifest.webmanifest
├── sw.js
├── robots.txt
├── sitemap.xml
├── _headers
├── _redirects
├── package.json
├── package-lock.json
└── LICENSE
```

### Instalacja

Wymagane są Node.js i npm. Repozytorium zawiera `package-lock.json`; nie ustala jednej wersji Node.js w konfiguracji projektu.

```bash
npm ci
```

### Development lokalny

Serwer udostępnia katalog repozytorium i zwykłe zasoby źródłowe; build produkcyjny nie jest potrzebny. Po zmianach odśwież stronę. Serwer nie obserwuje plików ani nie generuje minifikowanych zasobów.

```bash
npm run dev
```

Serwis można otworzyć pod `http://127.0.0.1:5173`. Serwer wyłącza cache HTTP. Rejestracja Service Workera jest celowo pomijana na `localhost`, `127.0.0.1` i `::1`.

### Build produkcyjny

```bash
npm run build
npm run preview
```

Build usuwa poprzedni `dist/`, przygotowuje 11 stron, zasoby runtime i konfigurację hostingu, przekształca odwołania HTML/Service Workera, buduje CSS oraz oba wejścia JS bezpośrednio w `dist/` i sprawdza kompletność wyniku. Preview udostępnia wyłącznie `dist/` na porcie 5173; zatrzymaj dev przed preview. Build nie generuje obrazów ani nie kopiuje `assets/img-src/`. Zoptymalizowane obrazy pozostają śledzone w Git; minifikowane CSS/JS i cały `dist/` są ignorowanym wynikiem builda.

Paczka zawiera `css/style.min.css`, `js/script.min.js`, `js/core.min.js` i niezmieniony skrypt runtime `js/bootstrap.js`. Nie zawiera modułów źródłowych CSS/JS ani narzędzi developerskich. Root HTML pozostaje kanoniczny; osobne ręcznie edytowane wersje produkcyjne nie istnieją.

Po zmianie źródeł obrazów dostępny jest osobny workflow:

```bash
npm run images:build
```

Generator zastępuje zawartość `assets/img-optimized/`, zapisując warianty odpowiadające źródłom w `assets/img-src/`.

### Testy i walidacja

Skonfigurowane kontrole obejmują:

| Polecenie | Zakres |
| --- | --- |
| `npm run qa` | ESLint, kontrakt źródeł, HTML, uruchomienie dev, lokalne linki/zasoby/fragmenty i pa11y-ci. |
| `npm run qa:dist` | Integralność istniejącego `dist/`, produkcyjny HTML, uruchomienie preview, lokalne linki/zasoby/fragmenty i pa11y-ci. Najpierw uruchom build. |
| `npm run qa:links` | Wszystkie 11 stron i ich lokalne zasoby, w tym importy CSS i fonty; wymaga działającego dev albo preview. |
| `npm run qa:a11y` | Wszystkie 11 adresów z `.pa11yci`, w tym `contact.html`, HTML CodeSniffer, WCAG2AA. |
| `npm run qa:links:external` | Opcjonalna kontrola także zewnętrznych linków na działającym serwerze. |

QA źródeł nie buduje produkcji; QA dist sprawdza przygotowaną paczkę i nie przebudowuje jej. Kontrole lokalne pomijają zewnętrzne adresy, a nie bundle produkcyjne. Runner `scripts/qa-server.js` używa tego samego http-server i właściwego katalogu; zamyka serwer także po błędzie. Nie wymaga Windows WMIC. Port 5173 musi być wolny. Automatyczny audyt dostępności nie potwierdza pełnej zgodności WCAG. Strona kontaktowa jest sprawdzana w stanie po załadowaniu; audyt nie obejmuje interaktywnych stanów walidacji formularza.

### Ciągła integracja

Repozytorium zawiera jeden workflow GitHub Actions: [`.github/workflows/quality.yml`](.github/workflows/quality.yml). Uruchamia się przy push do `main`, przy pull requeście kierowanym do `main` oraz ręcznie przez `workflow_dispatch`.

Zadanie działa na `ubuntu-latest`: pobiera repozytorium, konfiguruje Node.js 22 z cache zależności npm, a następnie wykonuje kolejno:

1. `npm ci` — instalacja zależności z pliku lock.
2. `npm run qa` — kontrole źródeł.
3. `npm run build` — build paczki produkcyjnej.
4. `npm run qa:dist` — walidacja zbudowanej paczki.

Workflow wyłącznie weryfikuje projekt i zbudowaną paczkę. Nie publikuje ani nie wdraża witryny; opisane niżej wdrożenie na Netlify pozostaje poza tym procesem.

### Wdrożenie

Repozytorium przygotowuje statyczną paczkę `dist/` oraz pliki `_headers` i `_redirects` w formacie Netlify. Reguły określają nagłówki, cache i odpowiedź 404. Ścieżki manifestu, Service Workera i metadanych zakładają publikację w katalogu głównym domeny.

Formularz w `contact.html` ma oznaczenia Netlify Forms, ukryte pole `form-name`, honeypot i przekierowanie do `thank-you.html`. Obsługa zgłoszeń zależy od konfiguracji hostingu; lokalny serwer nie potwierdza ich dostawy. Strona kontaktowa zawiera również bezpośrednio osadzoną mapę Google Maps.

### Dostępność

Implementacja obejmuje semantyczne landmarki, skip linki, etykiety pól i widoczny fokus. Mobilna nawigacja, lightbox i okno informacji demo zarządzają fokusem oraz obsługują klawiaturę. Walidacja aktualizuje `aria-invalid`, a komunikaty stanu korzystają z regionów `aria-live`.

Animacje uwzględniają `prefers-reduced-motion`; moduł reveal pokazuje treść od razu także przy braku `IntersectionObserver`. Te mechanizmy i konfiguracja pa11y-ci nie stanowią potwierdzenia zgodności całego serwisu z WCAG.

### SEO

Strony zawierają tytuły, opisy, linki canonical, metadane Open Graph i Twitter Cards oraz JSON-LD, m.in. `Organization` i `Restaurant`. Repozytorium zawiera również `robots.txt` i `sitemap.xml`. Dane restauracji opisują fikcyjną markę demonstracyjną; obecność metadanych nie potwierdza indeksacji ani pozycji w wyszukiwarkach.

### PWA i obsługa offline

`manifest.webmanifest` definiuje widok `standalone`, `start_url` i `scope` ustawione na `/`, ikony 192/512 px, zrzuty ekranu oraz skróty do menu, galerii i kontaktu. Źródłem Service Workera jest ręcznie utrzymywany `sw.js` z odwołaniami źródłowymi; build przekształca wyłącznie ścieżki CSS/JS w jego kopii w `dist/`. Precache obejmuje oba bundle oraz bootstrap.

Worker używa cache `atelierno02-v1.3`. Wybrane strony i zasoby są precache'owane; nawigacja korzysta z sieci, następnie zapisanej strony lub `offline.html`. Pozostałe żądania GET korzystają najpierw z cache. Podczas aktywacji worker usuwa cache o innych nazwach.

Obsługa offline zależy od udanej rejestracji, instalacji i dostępnych zasobów cache; żądania POST formularza nie są obsługiwane przez worker. W izolowanym lokalnym Chrome sprawdzono ręczną rejestrację produkcyjnego workera, wszystkie 19 wpisów precache, działanie strony prawnej i motywu offline oraz fallback nawigacji. Instalowalności PWA ani wdrożonej witryny nie zweryfikowano.

### Wydajność

Skonfigurowano minifikację CSS i bundling/minifikację JS. Obrazy korzystają z `picture`, `srcset`, AVIF/WebP, wymiarów i selektywnego `loading="lazy"`. Strona główna preloaduje fonty i obraz hero, a deklaracje fontów używają `font-display: swap`. Nie podano wyników Lighthouse ani Core Web Vitals.

### Dane i trwałość stanu

`data/menu.json` zawiera statyczne pozycje menu, kategorie, opisy, ceny, tagi i warianty obrazów. Stan wyszukiwania i filtrów jest utrzymywany w pamięci strony.

`localStorage` przechowuje motyw pod `kp-theme` i potwierdzenie informacji demo pod `kp-demo-accepted`; odczytywany jest także starszy klucz `kp_demo_legal_ack`. Dostęp do storage jest zabezpieczony `try/catch`. Potwierdzenie demo nie jest zgodą na cookies. Cache Storage przechowuje zasoby witryny; projekt nie implementuje kont ani synchronizacji między urządzeniami.

### Utrzymanie projektu

- Edytuj źródła CSS i moduły JS; przed preview lub wydaniem uruchom `npm run build`; nie poprawiaj ręcznie plików `.min.css` i `.min.js`.
- Utrzymuj dane w `data/menu.json` oraz statyczne karty HTML pełniące rolę fallbacku.
- Zmiany stron i publicznych zasobów zestawiaj z listami w `scripts/build-config.js`, `sw.js`, `manifest.webmanifest` i `sitemap.xml`.
- Po zmianach zasobów cache aktualizuj `CACHE_VERSION` w `sw.js`.
- [CHANGELOG.md](docs/CHANGELOG.md) jest zapisem znaczących ukończonych zmian; aktualizuj go, gdy zakres zadania na to pozwala, lub zgłoś potrzebę wpisu.

### Licencja

Atelier No.02 jest projektem własnościowym objętym [Własnościową Licencją Projektu KP_CODE, wersja 1.0](LICENSE), z prawami zastrzeżonymi przez Kamila Króla — KP_Code. Publiczne udostępnienie nie oznacza licencji open source. Materiały podmiotów trzecich podlegają własnym warunkom.

### Atrybucje

Siedem ikon SVG w `assets/icons/svg-icon/` zawiera informacje o Font Awesome Free 7.1.0, m.in. [ikona GitHub](assets/icons/svg-icon/github-icon.svg). Zachowaj zawarte w plikach informacje o autorstwie i licencji.

## EN

### Project Overview

Atelier No.02 is a multi-page demonstration website for a fictional fine dining restaurant, developed by KP_Code Digital Studio. Static HTML pages are enhanced with JavaScript modules and a shared CSS stylesheet.

The project includes a homepage, restaurant information, menu, gallery, contact, legal pages, and offline, form confirmation and 404 views. It has no booking system or custom backend; the contact form is configured for Netlify Forms handling.

### Live Version

[Demo address stated in the repository](https://gastronomy-project-02.netlify.app/) comes from the terms and page metadata. Website availability and whether the deployed version matches the current code have not been confirmed.

### Key Features

- Menu rendered from `data/menu.json`, text search and tag filters; static cards remain available without JavaScript or when data fetching fails.
- Gallery with grouped lightboxes, captions, counters, keyboard and gesture navigation, and fullscreen mode.
- Navigation with dropdown sections and a mobile panel with focus handling.
- Light and dark themes, system preference support and browser-local persistence of the user's choice.
- Contact form with native POST, a honeypot, field validation and submission progress feedback. JavaScript does not simulate successful delivery; actual Netlify receipt has not been checked.
- Online/offline notices and a dismissible notice explaining the demonstration scope.

### Tech Stack

- **Interface:** HTML5, modular CSS, Vanilla JavaScript with ES Modules; local WOFF2 fonts.
- **Build:** Node.js and npm, PostCSS with `postcss-import` and `cssnano`, esbuild.
- **Images:** Sharp and `fast-glob` for AVIF, WebP and JPEG/PNG generation and SVG copying.
- **Validation and development:** ESLint, html-validate, linkinator, pa11y-ci, http-server and a local Node.js runner.

### Architecture

Each page is a separate HTML document. Shared header and footer markup is stored in individual pages; the build does not generate it from templates. `js/script.js` runs `js/app/init.js`, which separates common initializers and page features using `data-page`. `js/core.js` is a smaller entry point used by legal pages and the 404 page.

`css/style.css` imports the `base`, `layout`, `components` and `pages` layers. Source HTML loads ordinary CSS and ES Module entry points. PostCSS and esbuild write `.min.css` and `.min.js` bundles only into `dist/`; the build transforms references in copied HTML. The separate `js/bootstrap.js` synchronizes the theme color and registers the Service Worker.

### Project Structure

```text
./
├── .github/
│   └── workflows/
│       └── quality.yml     # CI workflow: source and package checks
├── index.html
├── about.html
├── menu.html
├── gallery.html
├── contact.html
├── cookies.html
├── polityka-prywatnosci.html
├── regulamin.html
├── offline.html
├── thank-you.html
├── 404.html
├── css/                    # CSS sources only
├── js/                     # sources: entries, bootstrap, app/, core/, features/
├── data/menu.json
├── assets/
│   ├── img-src/            # image sources
│   ├── img-optimized/      # generated variants
│   ├── fonts/
│   ├── icons/
│   └── docs/menu.svg
├── scripts/
│   ├── build-config.js
│   ├── build-dist.js
│   ├── validate-dist.js
│   ├── qa-links.js
│   ├── qa-server.js
│   └── images/build-images.js
├── docs/
│   ├── CHANGELOG.md        # record of significant changes
│   └── settings.md         # npm scripts and workflow reference
├── dist/                   # generated production package (ignored)
├── manifest.webmanifest
├── sw.js
├── robots.txt
├── sitemap.xml
├── _headers
├── _redirects
├── package.json
├── package-lock.json
└── LICENSE
```

### Installation

Node.js and npm are required. The repository includes `package-lock.json`; project configuration does not pin a single Node.js version.

```bash
npm ci
```

### Local Development

The server serves the repository and ordinary source assets; no production build is needed. Reload the page after changes. The server does not watch files or generate minified assets.

```bash
npm run dev
```

Open the website at `http://127.0.0.1:5173`. The server disables HTTP caching. Service Worker registration is deliberately skipped on `localhost`, `127.0.0.1` and `::1`.

### Production Build

```bash
npm run build
npm run preview
```

Build removes the previous `dist/`, prepares 11 pages, runtime assets and hosting configuration, transforms HTML/Service Worker references, builds CSS and both JS entries directly into `dist/`, and checks output integrity. Preview serves only `dist/` on port 5173; stop dev before preview. Build does not generate images or copy `assets/img-src/`. Optimized images remain tracked in Git; minified CSS/JS and the entire `dist/` are ignored build output.

The package includes `css/style.min.css`, `js/script.min.js`, `js/core.min.js` and the unchanged runtime script `js/bootstrap.js`. It excludes CSS/JS source modules and development tools. Root HTML remains canonical; no separate manually edited production pages are maintained.

A separate workflow is available after changing image sources:

```bash
npm run images:build
```

The generator replaces the contents of `assets/img-optimized/`, writing variants corresponding to sources in `assets/img-src/`.

### Testing and Validation

Configured checks include:

| Command | Scope |
| --- | --- |
| `npm run qa` | ESLint, source contract, HTML, dev startup, local links/assets/fragments and pa11y-ci. |
| `npm run qa:dist` | Integrity of existing `dist/`, production HTML, preview startup, local links/assets/fragments and pa11y-ci. Run build first. |
| `npm run qa:links` | All 11 pages and local resources, including CSS imports and fonts; requires a running dev or preview server. |
| `npm run qa:a11y` | All 11 addresses in `.pa11yci`, including `contact.html`, HTML CodeSniffer, WCAG2AA. |
| `npm run qa:links:external` | Optional external link checking against a running server. |

Source QA does not build production; dist QA checks the prepared package without rebuilding it. Local checks skip external addresses, not production bundles. The `scripts/qa-server.js` runner uses the same http-server and the appropriate directory; it closes the server even after failures. It does not require Windows WMIC. Port 5173 must be free. Automated accessibility auditing does not establish full WCAG compliance. The contact page is checked in its loaded state; the audit does not cover the form's interactive validation states.

### Continuous Integration

The repository contains one GitHub Actions workflow: [`.github/workflows/quality.yml`](.github/workflows/quality.yml). It runs on pushes to `main`, on pull requests targeting `main`, and manually through `workflow_dispatch`.

The job runs on `ubuntu-latest`: it checks out the repository, sets up Node.js 22 with npm dependency caching, and then runs in order:

1. `npm ci` — install locked dependencies.
2. `npm run qa` — source quality checks.
3. `npm run build` — production package build.
4. `npm run qa:dist` — validation of the built package.

The workflow only validates the project and the built package. It does not publish or deploy the website; the Netlify deployment described below remains outside this process.

### Deployment

The repository prepares a static `dist/` package and `_headers` and `_redirects` files in Netlify format. Rules define headers, caching and the 404 response. Manifest, Service Worker and metadata paths assume deployment at the domain root.

The form in `contact.html` has Netlify Forms attributes, a hidden `form-name` field, a honeypot and a redirect to `thank-you.html`. Submission handling depends on hosting configuration; the local server does not confirm delivery. The contact page also contains a directly embedded Google Maps iframe.

### Accessibility

The implementation includes semantic landmarks, skip links, field labels and visible focus states. Mobile navigation, lightboxes and the demo notice dialog manage focus and keyboard interaction. Validation updates `aria-invalid`, and status messages use `aria-live` regions.

Animations account for `prefers-reduced-motion`; the reveal module also exposes content immediately when `IntersectionObserver` is unavailable. These mechanisms and the pa11y-ci configuration do not confirm WCAG compliance across the website.

### SEO

Pages include titles, descriptions, canonical links, Open Graph and Twitter Cards metadata, and JSON-LD such as `Organization` and `Restaurant`. The repository also contains `robots.txt` and `sitemap.xml`. Restaurant data describes a fictional demonstration brand; metadata does not confirm indexing or search rankings.

### PWA and Offline Support

`manifest.webmanifest` defines `standalone` display, `start_url` and `scope` set to `/`, 192/512 px icons, screenshots and menu, gallery and contact shortcuts. The Service Worker source is the manually maintained `sw.js` with source references; the build transforms only CSS/JS paths in its `dist/` copy. Precache includes both bundles and bootstrap.

The worker uses the `atelierno02-v1.3` cache. Selected pages and assets are precached; navigation tries the network, then a saved page or `offline.html`. Other GET requests try the cache first. During activation, the worker removes caches with other names.

Offline support depends on successful registration, installation and available cached resources; form POST requests are not handled by the worker. An isolated local Chrome test verified manual production worker registration, all 19 precache entries, offline legal-page and theme behavior, and the navigation fallback. PWA installability and the deployed website were not verified.

### Performance

CSS minification and JS bundling/minification are configured. Images use `picture`, `srcset`, AVIF/WebP, dimensions and selective `loading="lazy"`. The homepage preloads fonts and the hero image, and font declarations use `font-display: swap`. No Lighthouse or Core Web Vitals results are reported.

### Data and State Persistence

`data/menu.json` contains static menu items, categories, descriptions, prices, tags and image variants. Search and filter state is kept in page memory.

`localStorage` stores the theme under `kp-theme` and demo acknowledgement under `kp-demo-accepted`; the legacy `kp_demo_legal_ack` key is also read. Storage access is guarded with `try/catch`. Demo acknowledgement is not cookie consent. Cache Storage holds website resources; the project does not implement accounts or synchronization across devices.

### Project Maintenance

- Edit CSS sources and JS modules; run `npm run build` before preview or release; do not manually patch `.min.css` and `.min.js` files.
- Maintain `data/menu.json` and the static HTML cards used as fallback content.
- Check page and public asset changes against the lists in `scripts/build-config.js`, `sw.js`, `manifest.webmanifest` and `sitemap.xml`.
- Update `CACHE_VERSION` in `sw.js` when cached resources change.
- [CHANGELOG.md](docs/CHANGELOG.md) records significant completed changes; update it when task scope permits, or report that an entry is needed.

### License

Atelier No.02 is a proprietary project governed by the [KP_CODE Proprietary Project License, version 1.0](LICENSE), with rights reserved by Kamil Król — KP_Code. Public availability does not grant an open source license. Third-party materials remain subject to their own terms.

### Attributions

Seven SVG icons in `assets/icons/svg-icon/` contain Font Awesome Free 7.1.0 notices, including the [GitHub icon](assets/icons/svg-icon/github-icon.svg). Preserve the attribution and license information included in these files.
