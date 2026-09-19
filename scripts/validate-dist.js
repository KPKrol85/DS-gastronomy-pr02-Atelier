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
