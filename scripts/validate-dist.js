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
const REDUCED_ENTRY_PAGES = ["404.html", "cookies.html", "polityka-prywatnosci.html", "regulamin.html"];
const IMPORT_STATEMENT = /\bimport\s+([\s\S]*?)\s+from\s*(['"])([^'"]+)\2\s*;?/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const JS_COMMENT_OR_LITERAL = /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|'(?:[^'\\\r\n]|\\[\s\S])*'|"(?:[^"\\\r\n]|\\[\s\S])*"|`(?:[^`\\]|\\[\s\S])*`/g;
const MENU_DATA = "data/menu.json";
const MENU_PAGE = "menu.html";
const FEATURED_PAGE = "index.html";
const FEATURED_CATEGORIES = ["przystawki", "dania-glowne", "desery"];
const FEATURED_SIZE = 3;
const OPEN_TAG = /<([\w-]+)\b[^>]*>/g;

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

function tagAttribute(tag, name) {
  for (const attribute of tag.matchAll(/([\w-]+)=(['"])(.*?)\2/g)) {
    if (attribute[1].toLowerCase() === name) return attribute[3].trim().replace(/\s+/g, " ");
  }
  return null;
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

    if (!demoModalEntries.has(entry)) {
      demoModalEntries.set(entry, initializesDemoModal(path.join(rootDir, entry)));
    }
    if (DEMO_MODAL_MARKUP.test(html.replace(HTML_COMMENT, ""))) {
      assert(demoModalEntries.get(entry),
        `${page} ships #demo-legal-modal markup its entry never initialises: `
        + `no executed path from ${entry} reaches ${DEMO_MODAL_INITIALIZER}()`);
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
