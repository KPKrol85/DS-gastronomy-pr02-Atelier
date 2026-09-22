const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const htmlPages = [
  "index.html",
  "about.html",
  "menu.html",
  "gallery.html",
  "contact.html",
  "cookies.html",
  "polityka-prywatnosci.html",
  "regulamin.html",
  "offline.html",
  "thank-you.html",
  "404.html",
];
const rootFiles = [
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "sw.js",
  "_headers",
  "_redirects",
];
const assetEntries = [
  "js/bootstrap.js",
  "data/menu.json",
  "assets/docs",
  "assets/fonts/montserrat-vari-latin.woff2",
  "assets/fonts/montserrat-vari-latin-ext.woff2",
  "assets/fonts/playfair-display-vari-latin.woff2",
  "assets/fonts/playfair-display-vari-latin-ext.woff2",
  "assets/icons",
  "assets/img-optimized",
];
const productionAssets = {
  "css/style.css": "css/style.min.css",
  "js/script.js": "js/script.min.js",
  "js/core.js": "js/core.min.js",
};

function productionReference(reference) {
  const match = reference.match(/^(\/|\.\/)?([^?#]+)([?#].*)?$/);
  if (!match || !productionAssets[match[2]]) return reference;
  return (match[1] || "") + productionAssets[match[2]] + (match[3] || "");
}

function productionHtml(html) {
  return html.replace(/<(?:link|script)\b[^>]*>/gi, (tag) =>
    tag.replace(/\b(href|src)=(['"])(.*?)\2/gi, (_, attribute, quote, reference) =>
      `${attribute}=${quote}${productionReference(reference)}${quote}`,
    ),
  );
}

function productionWorker(worker) {
  return worker.replace(/(['"])(\/[^'"\r\n]+)\1/g, (_, quote, reference) =>
    `${quote}${productionReference(reference)}${quote}`,
  );
}

module.exports = {
  rootDir, distDir, htmlPages, rootFiles, assetEntries, productionAssets,
  productionHtml, productionWorker,
};
