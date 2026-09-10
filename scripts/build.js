const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting OpenNext Cloudflare build...");

// 1. Run OpenNext build
execSync("npx @opennextjs/cloudflare build", { stdio: "inherit" });

console.log("📦 Preparing Cloudflare Pages Advanced Mode output in 'out'...");

const outDir = path.resolve(__dirname, "..", "out");
const openNextDir = path.resolve(__dirname, "..", ".open-next");
const assetsDir = path.join(openNextDir, "assets");
const workerFile = path.join(openNextDir, "worker.js");

// Clean and recreate out directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Copy all open-next runtime dependencies into out
fs.cpSync(openNextDir, outDir, { recursive: true });

// Copy assets to the root of out
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, outDir, { recursive: true });
}

// Copy worker.js to _worker.js in out root (Pages Advanced Mode entrypoint)
if (fs.existsSync(workerFile)) {
  fs.copyFileSync(workerFile, path.join(outDir, "_worker.js"));
}

console.log("✅ Successfully generated 'out' directory with _worker.js for Cloudflare Pages!");
