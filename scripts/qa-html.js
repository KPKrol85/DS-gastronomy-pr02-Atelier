const path = require("node:path");
const { FileSystemConfigLoader, HtmlValidate, formatterFactory } = require("html-validate");
const { rootDir, htmlPages, composePage } = require("./build-config.js");

/*
 The 11 pages as the servers and the build deliver them: composed from their templates and partials/,
 then validated under the repository .htmlvalidate.json, which each page's own path resolves.
*/
async function validateComposedPages() {
  const validator = new HtmlValidate(new FileSystemConfigLoader());
  const results = [];
  for (const page of htmlPages) {
    const report = await validator.validateString(composePage(page), path.join(rootDir, page));
    results.push(...report.results);
  }
  if (results.length) console.log(formatterFactory("stylish")(results));
  if (results.some((result) => result.errorCount > 0)) {
    console.error("Line numbers refer to the composed pages, as npm run dev serves them.");
    process.exitCode = 1;
    return;
  }
  console.log(`Composed HTML valid: ${htmlPages.length} pages.`);
}

validateComposedPages().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
