# settings.md

## Publiczny workflow

`npm run dev` → `npm run qa` → `npm run build` → `npm run preview` → `npm run qa:dist`.

Dev i preview używają portu 5173; uruchamiaj je osobno. Przed QA zatrzymaj ręczny serwer, aby runner QA mógł uruchomić właściwy serwer. QA źródeł nie generuje produkcji, QA dist nie przebudowuje paczki.

## package.json scripts

### `dev`

- command: `node scripts/dev-server.js`
- what it does: Serwuje źródła repozytorium na 127.0.0.1:5173 bez cache i bez builda. Każdą stronę (`/`, `/strona.html`, `/strona`) składa w pamięci z szablonu i partiali przy każdym żądaniu; nieistniejący adres zwraca złożoną stronę 404 ze statusem 404. Nie zapisuje plików ani nie obserwuje zmian; zmiana szablonu lub partiala jest widoczna po odświeżeniu.

### `build`

- command: `npm run build:static && npm run build:css && npm run build:js && npm run qa:dist:integrity`
- what it does: Czyści i przygotowuje dist, przekształca referencje HTML/SW, buduje CSS/JS w dist i sprawdza kompletność.

### `preview`

- command: `http-server dist -a 127.0.0.1 -p 5173 -c-1`
- what it does: Serwuje wyłącznie istniejący dist na 127.0.0.1:5173 bez cache. Najpierw build; zatrzymaj dev.

### `qa`

- command: `npm run lint && npm run qa:source && npm run qa:html && npm run qa:server`
- what it does: Waliduje źródła: ESLint, kontrakt zasobów i partiali, HTML złożonych stron oraz linki/fragmenty/CSS i dostępność na składającym serwerze dev.

### `qa:dist`

- command: `npm run qa:dist:integrity && npm run qa:dist:html && npm run qa:dist:server`
- what it does: Waliduje istniejącą produkcję: kompletność, HTML oraz linki/fragmenty/CSS i dostępność na preview. Nie buduje.

### `build:static`

- command: `node scripts/build-dist.js`
- what it does: Składa wszystkie strony z szablonów i partiali, zanim usunie dist; błąd składania pozostawia poprzedni dist. Następnie zastępuje dist statycznymi plikami runtime, złożonymi stronami HTML i kopią SW. Nie minifikuje.

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

- command: `eslint "js/**/*.js" "sw.js" "scripts/**/*.js"`
- what it does: ESLint dla modułów JavaScript przeglądarki, Service Workera `sw.js` i skryptów Node.js w `scripts/`.

### `qa:source`

- command: `node scripts/validate-dist.js --source`
- what it does: Sprawdza brak wygenerowanych minifikowanych plików w css/js oraz kontrakty złożonych stron, w tym znaczniki partiali i brak ręcznie wklejonego nagłówka lub stopki w szablonach.

### `qa:html`

- command: `node scripts/qa-html.js`
- what it does: Waliduje html-validate 11 złożonych stron źródłowych z konfiguracją .htmlvalidate.json. Numery linii w błędach dotyczą złożonej strony, takiej jak z `npm run dev`.

### `qa:links`

- command: `node scripts/qa-links.js`
- what it does: Sprawdza wszystkie 11 stron, lokalne linki, zasoby, fragmenty, importy CSS i fonty. Wymaga serwera.

### `qa:links:external`

- command: `node scripts/qa-links.js --external`
- what it does: Opcjonalnie sprawdza również linki zewnętrzne na działającym serwerze.

### `qa:a11y`

- command: `pa11y-ci`
- what it does: Konfiguracja .pa11yci: WCAG2AA/htmlcs, 12 scenariuszy — wszystkie 11 stron po załadowaniu oraz `contact.html?a11y=form-errors`. Dodatkowy scenariusz akceptuje informację demo, przenosi fokus przez trzy puste pola i czeka na `aria-invalid="true"` oraz niepuste komunikaty błędów dla każdego pola. Wymaga serwera; nie sprawdza wysyłki formularza ani wszystkich jego stanów.

### `qa:server`

- command: `node scripts/qa-server.js`
- what it does: Zarządza składającym serwerem dev (scripts/dev-server.js) na 127.0.0.1:5173. Domyślnie uruchamia linki, następnie pa11y; nie wymaga builda.
- focused usage: `npm run qa:server -- --check=links` uruchamia tylko kontrolę linków; `npm run qa:server -- --check=a11y` tylko dostępność. Selektor można podać raz, wyłącznie w jednej z tych postaci; błędny wybór przerywa polecenie przed uruchomieniem serwera. Wybrana kontrola nie zastępuje pełnego `npm run qa`.

### `qa:dist:integrity`

- command: `node scripts/validate-dist.js`
- what it does: Sprawdza 11 stron, zasoby, CSS, manifest, obrazy menu, bootstrap i precache SW; porównuje każdą stronę dist ze złożonym szablonem po przekształceniu produkcyjnym; odrzuca źródła, znaczniki i partiale w dist. Oblicza również SHA-256 z wpisów `FILES_TO_CACHE` i wskazanych plików w dist, normalizując końce linii plików tekstowych do LF, i porównuje go z `PRECACHE_FINGERPRINT` w `sw.js`. Niezgodność przerywa kontrolę oraz `npm run build` i wypisuje zapisany oraz obliczony skrót. Dla wydania zmieniającego precache należy podnieść `CACHE_VERSION`, zapisać obliczony fingerprint i ponowić build; kontrola nie sprawdza wzrostu wersji względem poprzedniego wydania. Zobacz [Utrzymanie projektu](../README.md#utrzymanie-projektu).

### `qa:dist:html`

- command: `html-validate "dist/*.html"`
- what it does: Waliduje wyłącznie HTML w dist.

### `qa:dist:server`

- command: `node scripts/qa-server.js --dist`
- what it does: Zarządza serwerem preview na 127.0.0.1:5173 dla istniejącego `dist/`. Domyślnie uruchamia linki, następnie pa11y. Wymaga wcześniejszego `npm run build`; sam nie buduje paczki.
- focused usage: `npm run qa:dist:server -- --check=links` uruchamia tylko kontrolę linków; `npm run qa:dist:server -- --check=a11y` tylko dostępność. Selektor działa razem z `--dist` ustawionym przez ten skrypt npm i podlega tym samym zasadom co w `qa:server`. Wybrana kontrola nie zastępuje pełnego `npm run qa:dist`.

## Własność plików

Szablony stron w katalogu głównym, partials/header.html i partials/footer.html, css/style.css, moduły CSS, wejścia JS i sw.js są kanonicznymi źródłami. Wspólny nagłówek i stopka istnieją wyłącznie w partials/; szablony wskazują je znacznikami `<!-- partial:header -->` i `<!-- partial:footer -->`. scripts/build-config.js utrzymuje listę stron, rejestr partiali z composeHtml(), pliki runtime i mapowanie ścieżek. Build składa strony z partiali i zmienia tylko referencje zasobów w złożonych kopiach HTML i w kopii SW; bootstrap jest kopiowany bez zmian. dist/ pozostaje ignorowany. Nie generuj ani nie edytuj css/style.min.css, js/script.min.js ani js/core.min.js w źródłach.

Usunięte komendy build:dist, clean:dist, dev:server, validate:html, check* i osobne build:js:script/core są pokryte przez powyższy workflow. Nie zmieniono zależności ani targetu es2018.

Runner QA używa API istniejącego http-server w tym samym procesie, więc zamknięcie serwera nie wymaga ps-tree/wmic.exe. Dla źródeł uruchamia ten sam składający serwer co `npm run dev`, dla dist zwykły http-server. Lista zależności pozostaje bez zmian.
