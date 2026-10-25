import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const sourceScript = fileURLToPath(new URL("../scripts/check-performance-budget.mjs", import.meta.url));
const run = promisify(execFile);

test("image archive size is reported while only route JavaScript can exceed the budget", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "portfolio-budget-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "scripts"));
  await mkdir(join(root, "dist/.vite"), { recursive: true });
  await mkdir(join(root, "dist/assets"));
  await mkdir(join(root, "dist/images"));
  await copyFile(sourceScript, join(root, "scripts/check-performance-budget.mjs"));
  await writeFile(join(root, "dist/index.html"), "<title>Home</title>");
  await writeFile(join(root, "dist/assets/client.js"), "client");
  await writeFile(join(root, "dist/assets/home.js"), "home");
  await writeFile(join(root, "dist/assets/content.js"), "content");
  const manifest = {
    "src/entry-client.tsx": {
      name: "entry-client",
      file: "assets/client.js",
      dynamicImports: ["src/content.ts", "src/pages/home.tsx"]
    },
    "src/content.ts": { src: "src/content.ts", file: "assets/content.js" },
    "src/pages/home.tsx": { file: "assets/home.js" },
    "node_modules/firebase/app/dist/esm/index.esm.js": {
      src: "node_modules/firebase/app/dist/esm/index.esm.js",
      file: "assets/firebase-app.js"
    },
    "node_modules/firebase/auth/dist/esm/index.esm.js": {
      src: "node_modules/firebase/auth/dist/esm/index.esm.js",
      file: "assets/firebase-auth.js"
    }
  };
  await writeFile(join(root, "dist/.vite/manifest.json"), JSON.stringify(manifest));
  await writeFile(join(root, "dist/images/first.png"), Buffer.alloc(17 * 1024 * 1024));
  await writeFile(join(root, "dist/images/second.png"), Buffer.alloc(17 * 1024 * 1024));

  const script = join(root, "scripts/check-performance-budget.mjs");
  const result = await run(process.execPath, [script]);
  const report = JSON.parse(await readFile(join(root, "reports/performance-budget.json"), "utf8"));
  assert.match(result.stdout, /largest image:/);
  assert.ok(report.largestImageBytes > 1.5 * 1024 * 1024);
  assert.ok(report.totalImageBytes > 30 * 1024 * 1024);
  assert.deepEqual(report.limits, { routeJavaScriptGzipBytes: 256 * 1024 });

  await writeFile(join(root, "dist/assets/home.js"), randomBytes(300 * 1024));
  await assert.rejects(run(process.execPath, [script]), /Performance budget exceeded/);
});
