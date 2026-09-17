# settings.md

## Publiczny workflow

`npm run dev` → `npm run qa` → `npm run build` → `npm run preview` → `npm run qa:dist`.

Dev i preview używają portu 5173; uruchamiaj je osobno. Przed QA zatrzymaj ręczny serwer, aby runner QA mógł uruchomić właściwy serwer. QA źródeł nie generuje produkcji, QA dist nie przebudowuje paczki.

## package.json scripts

### `dev`

- command: `http-server . -a 127.0.0.1 -p 5173 -c-1`
- what it does: Serwuje źródła repozytorium na 127.0.0.1:5173 bez cache i bez builda.

### `build`

- command: `npm run build:static && npm run build:css && npm run build:js && npm run qa:dist:integrity`
- what it does: Czyści i przygotowuje dist, przekształca referencje HTML/SW, buduje CSS/JS w dist i sprawdza kompletność.

### `preview`

- command: `http-server dist -a 127.0.0.1 -p 5173 -c-1`
- what it does: Serwuje wyłącznie istniejący dist na 127.0.0.1:5173 bez cache. Najpierw build; zatrzymaj dev.

### `qa`

- command: `npm run lint && npm run qa:source && npm run qa:html && npm run qa:server`
- what it does: Waliduje źródła: ESLint, kontrakt zasobów, HTML oraz linki/fragmenty/CSS i dostępność na dev.

### `qa:dist`

- command: `npm run qa:dist:integrity && npm run qa:dist:html && npm run qa:dist:server`
- what it does: Waliduje istniejącą produkcję: kompletność, HTML oraz linki/fragmenty/CSS i dostępność na preview. Nie buduje.

### `build:static`

- command: `node scripts/build-dist.js`
- what it does: Zastępuje dist statycznymi plikami runtime i kopiami HTML/SW. Nie minifikuje.

### `build:css`

- command: `postcss css/style.css -o dist/css/style.min.css --no-map`
- what it does: PostCSS/postcss-import/cssnano; wyjście wyłącznie dist/css/style.min.css.

### `build:js`

- command: `esbuild js/script.js js/core.js --bundle --minify --outdir=dist/js --out-extension:.js=.min.js --target=es2018`
- what it does: esbuild; oba wejścia script i core, es2018, wyjście wyłącznie dist/js/*.min.js.

### `images:build`

- command: `node scripts/images/build-images.js`
- what it does: Osobny generator obrazów img-src → img-optimized. Nie jest częścią builda.

### `lint`

- command: `eslint "js/**/*.js"`
- what it does: ESLint dla źródeł JavaScript.

### `qa:source`

- command: `node scripts/validate-dist.js --source`
- what it does: Sprawdza brak wygenerowanych minifikowanych plików w css/js i wejścia źródłowe HTML.

### `qa:html`

- command: `html-validate "*.html"`
- what it does: Waliduje HTML źródeł.

### `qa:links`

- command: `node scripts/qa-links.js`
- what it does: Sprawdza wszystkie 11 stron, lokalne linki, zasoby, fragmenty, importy CSS i fonty. Wymaga serwera.

### `qa:links:external`

- command: `node scripts/qa-links.js --external`
- what it does: Opcjonalnie sprawdza również linki zewnętrzne na działającym serwerze.

### `qa:a11y`

- command: `pa11y-ci`
- what it does: Dotychczasowa .pa11yci: WCAG2AA/htmlcs, 10 stron, bez contact.html. Wymaga serwera.

### `qa:server`

- command: `node scripts/qa-server.js`
- what it does: Zarządza serwerem dev na czas linków i pa11y.

### `qa:dist:integrity`

- command: `node scripts/validate-dist.js`
- what it does: Sprawdza 11 stron, zasoby, CSS, manifest, obrazy menu, bootstrap i precache SW; odrzuca źródła w dist.

### `qa:dist:html`

- command: `html-validate "dist/*.html"`
- what it does: Waliduje wyłącznie HTML w dist.

### `qa:dist:server`

- command: `node scripts/qa-server.js --dist`
- what it does: Zarządza serwerem preview na czas linków i pa11y.

## Własność plików

Root HTML, css/style.css, moduły CSS, wejścia JS i sw.js są kanonicznymi źródłami. scripts/build-config.js utrzymuje listę stron, plików runtime i mapowanie ścieżek. Build zmienia tylko referencje zasobów w kopiach HTML/SW; bootstrap jest kopiowany bez zmian. dist/ pozostaje ignorowany. Nie generuj ani nie edytuj css/style.min.css, js/script.min.js ani js/core.min.js w źródłach.

Usunięte komendy build:dist, clean:dist, dev:server, validate:html, check* i osobne build:js:script/core są pokryte przez powyższy workflow. Nie zmieniono zależności ani targetu es2018.

Runner QA używa API istniejącego http-server w tym samym procesie, więc zamknięcie serwera nie wymaga ps-tree/wmic.exe. Lista zależności pozostaje bez zmian.
