import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

console.log("🚀 Building Next.js with vinext...");
execSync("npx vinext build", { stdio: "inherit" });

const outDir = path.resolve(process.cwd(), "out");
const distClient = path.resolve(process.cwd(), "dist", "client");
const distServer = path.resolve(process.cwd(), "dist", "server");

// Clean and recreate out directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// 1. Copy client assets to out
console.log("📦 Copying client assets from dist/client to out...");
fs.cpSync(distClient, outDir, { recursive: true });

// 2. Set up Pages Advanced Mode Worker in out/_worker.js
const workerDir = path.join(outDir, "_worker.js");
console.log("⚡ Setting up Cloudflare Pages Worker in out/_worker.js...");
fs.cpSync(distServer, workerDir, { recursive: true });

// Remove server-only wrangler config from worker directory if present
const innerWrangler = path.join(workerDir, "wrangler.json");
if (fs.existsSync(innerWrangler)) {
  fs.rmSync(innerWrangler, { force: true });
}

// 3. Create _routes.json for Pages: route dynamic requests to _worker.js and static assets directly
const routesJson = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/favicon.ico"
  ]
};
fs.writeFileSync(path.join(outDir, "_routes.json"), JSON.stringify(routesJson, null, 2));

console.log("✅ Build complete! 'out' directory successfully prepared for Cloudflare Pages.");
