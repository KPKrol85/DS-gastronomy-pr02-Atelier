const { spawn } = require("node:child_process");
const path = require("node:path");
const httpServer = require("http-server");
const { rootDir, distDir } = require("./build-config.js");
const { createSourceServer } = require("./dev-server.js");

const production = process.argv.includes("--dist");
// Source QA checks the composed pages npm run dev serves; production QA checks dist/ as built.
const server = production ? httpServer.createServer({ root: distDir, cache: -1 }) : createSourceServer();
let activeCheck;

function runCheck(script) {
  return new Promise((resolve, reject) => {
    activeCheck = spawn(process.execPath, [script], {
      cwd: rootDir,
      stdio: ["ignore", "inherit", "inherit"],
    });
    activeCheck.once("error", reject);
    activeCheck.once("exit", (code, signal) => {
      activeCheck = null;
      if (code === 0) resolve();
      else reject(new Error(`QA check failed: ${script} (exit ${code}, signal ${signal})`));
    });
  });
}

async function checkServer() {
  try {
    await new Promise((resolve, reject) => {
      server.server.once("error", reject);
      server.listen(5173, "127.0.0.1", resolve);
    });
    console.log(`QA serving ${production ? "dist/ (production)" : "repository source with composed pages"} at http://127.0.0.1:5173`);
    await runCheck(path.join(__dirname, "qa-links.js"));
    const pa11yPackage = require("pa11y-ci/package.json");
    const pa11yCli = path.join(path.dirname(require.resolve("pa11y-ci/package.json")), pa11yPackage.bin["pa11y-ci"]);
    await runCheck(pa11yCli);
  } finally {
    // Same-process HTTP serving needs no shell or process-tree discovery.
    server.close();
    if (server.server.closeAllConnections) server.server.closeAllConnections();
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    process.exitCode = 1;
    if (activeCheck) activeCheck.kill();
    server.close();
  });
}

checkServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
