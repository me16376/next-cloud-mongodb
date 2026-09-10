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

// Copy worker.js to _worker.js in out root with Cloudflare Pages static asset handling
if (fs.existsSync(workerFile)) {
  let workerCode = fs.readFileSync(workerFile, "utf-8");
  
  // In Pages Advanced Mode, intercept and serve static assets via env.ASSETS
  const pagesAssetHook = `const url = new URL(request.url);
            if (env.ASSETS && (url.pathname.startsWith("/_next/static/") || url.pathname === "/favicon.ico")) {
                const assetResponse = await env.ASSETS.fetch(request);
                if (assetResponse.status !== 404) {
                    return assetResponse;
                }
            }`;
  
  workerCode = workerCode.replace(
    "const url = new URL(request.url);",
    pagesAssetHook
  );
  
  fs.writeFileSync(path.join(outDir, "_worker.js"), workerCode, "utf-8");
}

// Also sync to .vercel/output/static so user can use .vercel/output/static or out in Cloudflare Pages
const vercelStaticDir = path.resolve(__dirname, "..", ".vercel", "output", "static");
fs.mkdirSync(vercelStaticDir, { recursive: true });
fs.cpSync(outDir, vercelStaticDir, { recursive: true });

console.log("✅ Successfully generated both 'out' and '.vercel/output/static' with _worker.js for Cloudflare Pages!");
