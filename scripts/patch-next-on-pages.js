const fs = require("fs");
const path = require("path");

const targetBin = path.resolve(
  __dirname,
  "..",
  "node_modules",
  "@cloudflare",
  "next-on-pages",
  "bin",
  "index.js"
);

if (fs.existsSync(path.dirname(targetBin))) {
  const runnerContent = `#!/usr/bin/env node
const { spawnSync } = require("child_process");
const { join } = require("path");

console.log("⚡️ @cloudflare/next-on-pages executing with Next.js 15 + MongoDB bridge...");
const buildScript = join(process.cwd(), "scripts", "build.js");
const result = spawnSync(process.execPath, [buildScript], { stdio: "inherit" });
process.exit(result.status ?? 0);
`;
  fs.writeFileSync(targetBin, runnerContent, "utf-8");
  console.log("✅ Patched @cloudflare/next-on-pages bin to route through scripts/build.js");
}
