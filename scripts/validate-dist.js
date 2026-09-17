const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  rootDir, distDir, htmlPages, rootFiles, assetEntries, productionAssets,
  productionHtml, productionWorker,
} = require("./build-config.js");

function read(base, file) {
  return fs.readFileSync(path.join(base, file), "utf8");
}

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(file) : [file];
  });
}

function validateSource() {
  for (const directory of ["css", "js"]) {
    assert(!filesBelow(path.join(rootDir, directory)).some((file) => /\.min\.(css|js)$/.test(file)),
      `Generated production assets found in source ${directory}/`);
  }
  for (const page of htmlPages) {
    const html = read(rootDir, page);
    assert(!/\.min\.(css|js)/.test(html), `${page} references a production bundle`);
    assert(html.includes('href="css/style.css"'), `${page} is missing source CSS`);
    const entry = ["404.html", "cookies.html", "polityka-prywatnosci.html", "regulamin.html"].includes(page)
      ? "js/core.js" : "js/script.js";
    assert(html.includes(`src="${entry}"`), `${page} is missing its source JS entry`);
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
