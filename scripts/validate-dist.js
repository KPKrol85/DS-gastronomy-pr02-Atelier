const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  rootDir, distDir, htmlPages, rootFiles, assetEntries, productionAssets,
  productionHtml, productionWorker,
} = require("./build-config.js");

const DEMO_MODAL_MODULE = path.join(rootDir, "js", "features", "demo-modal.js");
const DEMO_MODAL_INITIALIZER = "initDemoLegalModal";
const DEMO_MODAL_MARKUP = /\bid=(['"])demo-legal-modal\1/;
const DEMO_MODAL_ID = "demo-legal-modal";
const DEMO_MODAL_CLASS = "demo-legal-modal";
const DEMO_MODAL_OPEN_CLASS = "is-open";
const DEMO_MODAL_CLOSED_ATTRIBUTES = ["hidden", "inert"];
const PAGE_CLASS = "page";
const PAGE_MODIFIER = "page--";
const REDUCED_ENTRY_PAGES = ["404.html", "cookies.html", "polityka-prywatnosci.html", "regulamin.html"];
const IMPORT_STATEMENT = /\bimport\s+([\s\S]*?)\s+from\s*(['"])([^'"]+)\2\s*;?/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const JS_COMMENT_OR_LITERAL = /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|'(?:[^'\\\r\n]|\\[\s\S])*'|"(?:[^"\\\r\n]|\\[\s\S])*"|`(?:[^`\\]|\\[\s\S])*`/g;
const MENU_DATA = "data/menu.json";
const MENU_PAGE = "menu.html";
const FEATURED_PAGE = "index.html";
const FEATURED_CATEGORIES = ["przystawki", "dania-glowne", "desery"];
const FEATURED_SIZE = 3;
const IMAGE_SOURCES = "assets/img-src";
const IMAGE_OUTPUTS = "assets/img-optimized";
const RASTER_SOURCE_FORMATS = [".jpg", ".jpeg", ".png"];
const DERIVED_RASTER_FORMATS = [".avif", ".webp"];
const VECTOR_FORMAT = ".svg";
const OPEN_TAG = /<([\w-]+)\b[^>]*>/g;
const TAG_NAME = /^<\s*([\w:-]+)/;
const TAG_ATTRIBUTE = /\s+([^\s/=>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/y;

function read(base, file) {
  return fs.readFileSync(path.join(base, file), "utf8");
}

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(file) : [file];
  });
}

function withoutComments(code) {
  return code.replace(JS_COMMENT_OR_LITERAL, (token) => (/^\/[/*]/.test(token) ? " " : token));
}

// Literal text never executes; template substitutions do, so they are kept.
function withoutLiterals(code) {
  return code.replace(JS_COMMENT_OR_LITERAL, (token) =>
    token.startsWith("`") ? (token.match(/\$\{[\s\S]*?\}/g) || []).join(" ") : " ");
}

function moduleImports(code) {
  return [...code.matchAll(IMPORT_STATEMENT)].flatMap((statement) =>
    statement[1].replace(/[{}]/g, ",").split(",").flatMap((clause) => {
      const names = clause.trim().match(/[\w$]+/g);
      return names ? [{ binding: names[names.length - 1], specifier: statement[3] }] : [];
    }),
  );
}

function initializesDemoModal(moduleFile, visited = new Set()) {
  if (visited.has(moduleFile) || !fs.existsSync(moduleFile)) return false;
  visited.add(moduleFile);
  const code = withoutComments(fs.readFileSync(moduleFile, "utf8"));
  const executed = new Set(withoutLiterals(code.replace(IMPORT_STATEMENT, "")).match(/[\w$]+/g) || []);
  return moduleImports(code).some(({ binding, specifier }) => {
    if (!specifier.startsWith(".") || !executed.has(binding)) return false;
    const imported = path.resolve(path.dirname(moduleFile), specifier);
    return (imported === DEMO_MODAL_MODULE && binding === DEMO_MODAL_INITIALIZER)
      || initializesDemoModal(imported, visited);
  });
}

function documentHead(page, html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  assert(head, `${page} has no <head> to carry the theme contract`);
  return head[1].replace(HTML_COMMENT, "");
}

/*
 Attributes of one open tag, a boolean attribute holding "". The scan is sticky, so it can
 only step from one attribute to the next: a name written inside a quoted value is never
 read as an attribute of its own, and aria-hidden never answers for the hidden attribute.
*/
function tagAttributes(tag) {
  const name = tag.match(TAG_NAME);
  const attributes = new Map();
  if (!name) return attributes;
  TAG_ATTRIBUTE.lastIndex = name[0].length;
  for (let match = TAG_ATTRIBUTE.exec(tag); match; match = TAG_ATTRIBUTE.exec(tag)) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (!attributes.has(key)) attributes.set(key, value.trim().replace(/\s+/g, " "));
  }
  return attributes;
}

function tagAttribute(tag, name) {
  const value = tagAttributes(tag).get(name);
  return value === undefined ? null : value;
}

function hasThemePreload(head) {
  return [...head.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].some((script) => {
    const code = withoutComments(script[1]);
    return /(['"])kp-theme\1/.test(code) && /setAttribute\(\s*(['"])data-theme\1/.test(code);
  });
}

function hasScript(head, source) {
  return [...head.matchAll(/<script\b[^>]*>/gi)].some((tag) => {
    const reference = tagAttribute(tag[0], "src");
    return reference !== null && reference.replace(/^\.\//, "").split(/[?#]/)[0] === source;
  });
}

function hasMeta(head, name, content) {
  return [...head.matchAll(/<meta\b[^>]*>/gi)].some((tag) =>
    tagAttribute(tag[0], "name") === name
    && (tagAttribute(tag[0], "content") || "").toLowerCase() === content);
}

/*
 Menu cards nest <ul class="menu-card__tags"> and <li class="menu-card__tag"> inside
 themselves, so outermost elements are collected by tracking tag depth: the first
 closing tag of a name never ends an element that still has an open descendant.
*/
function elementsOf(html, tagName, start = 0) {
  const boundary = new RegExp(`</?${tagName}\\b[^>]*>`, "gi");
  boundary.lastIndex = start;
  const found = [];
  let depth = 0;
  let open = "";
  let contentStart = 0;
  for (let match = boundary.exec(html); match; match = boundary.exec(html)) {
    if (!match[0].startsWith("</")) {
      depth += 1;
      if (depth === 1) {
        open = match[0];
        contentStart = boundary.lastIndex;
      }
    } else if (depth > 0) {
      depth -= 1;
      if (depth === 0) found.push({ tag: open, content: html.slice(contentStart, match.index) });
    }
  }
  return found;
}

function classNames(tag) {
  return (tagAttribute(tag, "class") || "").split(" ").filter(Boolean);
}

function openTag(html, tagName) {
  for (const tag of html.matchAll(OPEN_TAG)) {
    if (tag[1].toLowerCase() === tagName) return tag[0];
  }
  return null;
}

// The element carrying the id, never an id spelled out in a script or a neighbouring tag.
function elementById(html, id) {
  for (const tag of html.matchAll(OPEN_TAG)) {
    if (tagAttribute(tag[0], "id") === id) return tag[0];
  }
  return null;
}

// Indentation and line breaks inside a card carry no meaning; the words do.
function elementText(markup) {
  return markup.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function cardField(card, className) {
  for (const tag of card.matchAll(OPEN_TAG)) {
    if (!classNames(tag[0]).includes(className)) continue;
    const element = elementsOf(card, tag[1], tag.index)[0];
    return element ? elementText(element.content) : null;
  }
  return null;
}

function listsWith(html, attribute) {
  return [...html.matchAll(OPEN_TAG)].flatMap((tag) =>
    tagAttribute(tag[0], attribute) === null
      ? []
      : [{ tag: tag[0], element: elementsOf(html, tag[1], tag.index)[0] }]);
}

// Every direct <li> child of a static menu list, read as the fields the data owns.
function staticCards(scope, listContent) {
  return elementsOf(listContent, "li").map((card, index) => {
    const position = `${scope} card ${index + 1}`;
    const title = cardField(card.content, "card__title");
    const price = cardField(card.content, "menu-card__price");
    assert(title, `${position} carries no .card__title`);
    assert(price, `${position} carries no .menu-card__price`);
    return { position, title, price };
  });
}

/*
 Mirrors renderFeaturedMenu() in js/features/menu.js: the first item of each preferred
 category in that order, replaced by the first three dataset items when the preferred
 categories yield fewer than three. Any other trio is a drift, not an alternative.
*/
function featuredSelection(items) {
  const selection = FEATURED_CATEGORIES
    .map((category) => items.find((item) => item.category === category))
    .filter(Boolean);
  return selection.length < FEATURED_SIZE ? items.slice(0, FEATURED_SIZE) : selection;
}

function validateCompleteMenu(items) {
  const byTitle = new Map();
  for (const item of items) {
    assert(!byTitle.has(item.title),
      `${MENU_DATA} lists "${item.title}" twice; a static menu cannot mirror it unambiguously`);
    byTitle.set(item.title, item);
  }

  const html = read(rootDir, MENU_PAGE).replace(HTML_COMMENT, "");
  const cards = [];
  const categories = new Set();
  for (const list of listsWith(html, "data-menu-category")) {
    const category = tagAttribute(list.tag, "data-menu-category");
    assert(category, `${MENU_PAGE} has a [data-menu-category] list without a category name`);
    const scope = `${MENU_PAGE} [data-menu-category="${category}"]`;
    assert(list.element, `${scope} is never closed`);
    assert(!categories.has(category), `${MENU_PAGE} repeats the [data-menu-category="${category}"] list`);
    categories.add(category);
    cards.push(...staticCards(scope, list.element.content).map((card) => ({ ...card, category })));
  }

  const mirrored = new Set();
  for (const card of cards) {
    const item = byTitle.get(card.title);
    assert(item, `${card.position} is an unexpected menu item: `
      + `"${card.title}" (${card.price}) has no entry in ${MENU_DATA}`);
    assert(!mirrored.has(card.title), `${card.position} duplicates the menu item "${card.title}"`);
    mirrored.add(card.title);
    assert.equal(card.category, item.category, `${card.position} places "${card.title}" in `
      + `"${card.category}" where ${MENU_DATA} assigns it to "${item.category}"`);
    assert.equal(card.price, item.price, `${card.position} prices "${card.title}" at `
      + `"${card.price}" where ${MENU_DATA} says "${item.price}"`);
  }
  for (const item of items) {
    assert(mirrored.has(item.title), `${MENU_PAGE} is missing the menu item "${item.title}" `
      + `(${item.category}, ${item.price}) that ${MENU_DATA} defines`);
  }
  assert.equal(cards.length, items.length,
    `${MENU_PAGE} holds ${cards.length} static menu cards for the ${items.length} items in ${MENU_DATA}`);
}

function validateFeaturedMenu(items) {
  const html = read(rootDir, FEATURED_PAGE).replace(HTML_COMMENT, "");
  const lists = listsWith(html, "data-menu-featured");
  assert.equal(lists.length, 1,
    `${FEATURED_PAGE} must carry exactly one [data-menu-featured] list, found ${lists.length}`);
  assert.equal(tagAttribute(lists[0].tag, "data-menu-featured"), "true",
    `${FEATURED_PAGE} featured list is not [data-menu-featured="true"], so renderFeaturedMenu() never fills it`);
  assert(lists[0].element, `${FEATURED_PAGE} [data-menu-featured] list is never closed`);

  const cards = staticCards(`${FEATURED_PAGE} [data-menu-featured]`, lists[0].element.content);
  const selection = featuredSelection(items);
  assert.equal(cards.length, selection.length, `${FEATURED_PAGE} shows ${cards.length} featured cards `
    + `where renderFeaturedMenu() selects ${selection.length}`);
  selection.forEach((item, index) => {
    const card = cards[index];
    assert.equal(card.title, item.title, `${card.position} shows "${card.title}" where `
      + `renderFeaturedMenu() selects "${item.title}" from ${MENU_DATA}`);
    assert.equal(card.price, item.price, `${card.position} prices "${item.title}" at `
      + `"${card.price}" where ${MENU_DATA} says "${item.price}"`);
  });
}

// The rendered menu and the static fallback both claim to show data/menu.json.
function validateMenuParity() {
  const data = JSON.parse(read(rootDir, MENU_DATA));
  const items = Array.isArray(data.items) ? data.items : [];
  assert(items.length, `${MENU_DATA} carries no items for the static menus to mirror`);
  validateCompleteMenu(items);
  validateFeaturedMenu(items);
}

/*
 Every page opens the same block: the shared page class, one page-- modifier and the
 data-page value that modifier is named after. Any further body class stays the page's own.
*/
function validateBodyContract(page, markup) {
  const tag = openTag(markup, "body");
  assert(tag, `${page} has no opening <body> tag to carry the shared page contract`);
  const scope = `${page}: <body>`;
  const classes = classNames(tag);
  assert(classes.includes(PAGE_CLASS), `${scope} is missing the shared ${PAGE_CLASS} class`);
  const dataPage = tagAttribute(tag, "data-page");
  assert(dataPage, `${scope} is missing a non-empty data-page value`);
  const modifiers = classes.filter((className) => className.startsWith(PAGE_MODIFIER));
  assert.equal(modifiers.length, 1, modifiers.length === 0
    ? `${scope} is missing its ${PAGE_MODIFIER}${dataPage} modifier`
    : `${scope} carries the page modifiers ${modifiers.join(", ")} where one is expected`);
  assert.equal(modifiers[0], `${PAGE_MODIFIER}${dataPage}`,
    `${scope} modifier ${modifiers[0]} does not match data-page="${dataPage}"`);
}

/*
 initDemoLegalModal() opens the dialog, so every copy of the wrapper ships closed. A copy
 that drifts leaves its controls focusable inside an aria-hidden subtree before a script runs.
*/
function validateDemoModalWrapper(page, markup) {
  const scope = `${page}: #${DEMO_MODAL_ID}`;
  const tag = elementById(markup, DEMO_MODAL_ID);
  assert(tag, `${scope} is not carried by any element of the page`);
  const classes = classNames(tag);
  assert(classes.includes(DEMO_MODAL_CLASS), `${scope} is missing the ${DEMO_MODAL_CLASS} class`);
  assert(!classes.includes(DEMO_MODAL_OPEN_CLASS),
    `${scope} ships the ${DEMO_MODAL_OPEN_CLASS} class, so the dialog is open before any script runs`);
  const attributes = tagAttributes(tag);
  assert(attributes.has("aria-hidden"), `${scope} is missing aria-hidden`);
  assert.equal(attributes.get("aria-hidden"), "true", `${scope} must start with aria-hidden="true"`);
  for (const attribute of DEMO_MODAL_CLOSED_ATTRIBUTES) {
    assert(attributes.has(attribute), `${scope} is missing ${attribute}`);
  }
}

/*
 Relative paths below a directory, each carrying the lower-cased extension build-images.js
 names its outputs after, so both image trees are read the same way. A missing tree holds none.
*/
function imagesBelow(directory) {
  if (!fs.existsSync(directory)) return [];
  return filesBelow(directory).map((file) => {
    const relative = path.relative(directory, file).split(path.sep).join("/");
    const extension = path.extname(relative);
    return relative.slice(0, relative.length - extension.length) + extension.toLowerCase();
  });
}

/*
 build-images.js removes assets/img-optimized/ and rebuilds it from assets/img-src/, so an
 output no source can produce survives only until the next image build. Every generated file is
 therefore read back to the source that names it, under the same relative directory and stem:
 .avif and .webp are encoded from any supported raster, an original-format raster keeps its
 source extension, and an .svg is copied unchanged. Provenance only; no image bytes are read.
*/
function validateImageProvenance() {
  const sources = new Set(imagesBelow(path.join(rootDir, IMAGE_SOURCES)));
  for (const relative of imagesBelow(path.join(rootDir, IMAGE_OUTPUTS))) {
    const extension = path.extname(relative);
    const stem = relative.slice(0, relative.length - extension.length);
    const formats = extension === VECTOR_FORMAT ? [VECTOR_FORMAT]
      : DERIVED_RASTER_FORMATS.includes(extension) ? RASTER_SOURCE_FORMATS
        : RASTER_SOURCE_FORMATS.includes(extension) ? [extension] : [];
    if (!formats.length) continue;
    const expected = formats.map((format) => `${stem}${format}`);
    assert(expected.some((candidate) => sources.has(candidate)),
      `Missing image source for ${IMAGE_OUTPUTS}/${relative}: expected `
      + expected.map((candidate) => `${IMAGE_SOURCES}/${candidate}`).join(" or "));
  }
}

function validateSource() {
  for (const directory of ["css", "js"]) {
    assert(!filesBelow(path.join(rootDir, directory)).some((file) => /\.min\.(css|js)$/.test(file)),
      `Generated production assets found in source ${directory}/`);
  }
  const demoModalEntries = new Map();
  for (const page of htmlPages) {
    const html = read(rootDir, page);
    assert(!/\.min\.(css|js)/.test(html), `${page} references a production bundle`);
    assert(html.includes('href="css/style.css"'), `${page} is missing source CSS`);
    const entry = REDUCED_ENTRY_PAGES.includes(page) ? "js/core.js" : "js/script.js";
    assert(html.includes(`src="${entry}"`), `${page} is missing its source JS entry`);

    const markup = html.replace(HTML_COMMENT, "");
    validateBodyContract(page, markup);

    if (!demoModalEntries.has(entry)) {
      demoModalEntries.set(entry, initializesDemoModal(path.join(rootDir, entry)));
    }
    if (DEMO_MODAL_MARKUP.test(markup)) {
      assert(demoModalEntries.get(entry),
        `${page} ships #demo-legal-modal markup its entry never initialises: `
        + `no executed path from ${entry} reaches ${DEMO_MODAL_INITIALIZER}()`);
      validateDemoModalWrapper(page, markup);
    }

    const head = documentHead(page, html);
    assert(hasThemePreload(head),
      `${page} is missing the inline kp-theme preload script that sets data-theme in <head>`);
    assert(hasScript(head, "js/bootstrap.js"), `${page} is missing the js/bootstrap.js reference in <head>`);
    assert(hasMeta(head, "color-scheme", "light dark"),
      `${page} is missing <meta name="color-scheme" content="light dark"> in <head>`);
    assert(hasMeta(head, "theme-color", "#ffffff"),
      `${page} is missing <meta name="theme-color" content="#ffffff"> in <head>`);
  }
  validateMenuParity();
  validateImageProvenance();
}

function assertReference(reference, owner) {
  const url = new URL(reference.replace(/&amp;/g, "&"), `http://production.local/${owner}`);
  if (url.origin !== "http://production.local") return;
  const relative = decodeURIComponent(url.pathname).replace(/^\//, "") || "index.html";
  const target = path.resolve(distDir, relative);
  assert(target.startsWith(distDir + path.sep), `Invalid production path: ${reference}`);
  assert(fs.existsSync(target) && fs.statSync(target).isFile(),
    `Missing production reference: ${reference} (from ${owner})`);
}

function validateDist() {
  validateSource();
  for (const entry of [...htmlPages, ...rootFiles, ...assetEntries, ...Object.values(productionAssets)]) {
    assert(fs.existsSync(path.join(distDir, entry)), `Missing production entry: ${entry}`);
  }
  assert.deepEqual(fs.readdirSync(path.join(distDir, "css")).sort(), ["style.min.css"]);
  assert.deepEqual(fs.readdirSync(path.join(distDir, "js")).sort(), ["bootstrap.js", "core.min.js", "script.min.js"]);
  for (const entry of ["scripts", "node_modules", "assets/img-src", "package.json"]) {
    assert(!fs.existsSync(path.join(distDir, entry)), `Source-only entry in production: ${entry}`);
  }

  for (const page of htmlPages) {
    const html = read(distDir, page);
    assert.equal(html, productionHtml(read(rootDir, page)), `Stale or incorrectly transformed HTML: ${page}`);
    for (const tag of html.matchAll(/<(?:a|link|script|img|source|iframe|form)\b[^>]*>/gi)) {
      for (const attribute of tag[0].matchAll(/\b(?:href|src|action)=(['"])(.*?)\1/gi)) {
        assertReference(attribute[2], page);
      }
      for (const attribute of tag[0].matchAll(/\b(?:srcset|imagesrcset)=(['"])(.*?)\1/gi)) {
        for (const candidate of attribute[2].split(",")) {
          assertReference(candidate.trim().split(/\s+/)[0], page);
        }
      }
    }
  }
  const css = read(distDir, "css/style.min.css");
  assert(!/@import\b/.test(css), "Production CSS still depends on source imports");
  for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) {
    assertReference(match[2], "css/style.min.css");
  }

  const worker = read(distDir, "sw.js");
  assert.equal(worker, productionWorker(read(rootDir, "sw.js")), "Stale production Service Worker");
  const precache = vm.runInNewContext(`${worker}\nFILES_TO_CACHE;`, {
    self: { addEventListener() {} },
  }, { timeout: 1000 });
  precache.forEach((reference) => assertReference(reference, "sw.js"));
  for (const source of Object.keys(productionAssets)) {
    assert(!worker.includes(`"/${source}"`), `Source asset in production precache: ${source}`);
  }

  const manifest = JSON.parse(read(distDir, "manifest.webmanifest"));
  for (const entry of [...manifest.icons, ...manifest.screenshots]) {
    assertReference(entry.src, "manifest.webmanifest");
  }
  assertReference(manifest.start_url, "manifest.webmanifest");
  for (const shortcut of manifest.shortcuts) {
    assertReference(shortcut.url, "manifest.webmanifest");
    shortcut.icons.forEach((icon) => assertReference(icon.src, "manifest.webmanifest"));
  }
  const menu = JSON.parse(read(distDir, "data/menu.json"));
  for (const item of menu.items) {
    const image = item.image;
    if (!image) continue;
    for (const variant of image.variants || []) {
      for (const format of variant.formats) {
        assertReference(`/${image.basePath}/${image.category}/${image.slug}-${variant.width}x${variant.height}.${format}`, "data/menu.json");
      }
    }
  }
  assert.equal(read(distDir, "js/bootstrap.js"), read(rootDir, "js/bootstrap.js"), "Stale bootstrap");
  console.log(`Production integrity passed: ${htmlPages.length} pages, CSS/JS, precache, manifest and menu assets.`);
}

if (process.argv.includes("--source")) {
  validateSource();
  console.log("Source asset contract passed.");
} else {
  validateDist();
}
