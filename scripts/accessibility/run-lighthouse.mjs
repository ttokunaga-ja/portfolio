import { spawn } from "node:child_process";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dist = join(root, "dist");
const reportDir = join(root, ".accessibility-reports/lighthouse");
const viteBin = join(root, "node_modules/.bin/vite");
const port = Number(process.env.PORTFOLIO_A11Y_PORT ?? 4175);
const baseUrl = process.env.PORTFOLIO_BASE_URL ?? `http://127.0.0.1:${port}`;
const minScore = Number(process.env.PORTFOLIO_A11Y_LIGHTHOUSE_MIN ?? 90);
const useExistingBuild = process.env.PORTFOLIO_USE_EXISTING_BUILD === "1";

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // retry until preview is ready
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function collectIndexFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const next = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "assets") {
        return collectIndexFiles(next);
      }
      return entry.isFile() && entry.name === "index.html" ? [next] : [];
    })
  );
  return files.flat();
}

async function assertExistingBuild() {
  for (const required of [join(dist, "index.html"), join(dist, "assets")]) {
    try {
      await stat(required);
    } catch {
      throw new Error(`PORTFOLIO_USE_EXISTING_BUILD=1 requires ${required} from pnpm build.`);
    }
  }
}

function routeForIndexFile(file) {
  const routeDir = relative(dist, file.replace(/index\.html$/, "")).replaceAll("\\", "/");
  return routeDir ? `/${routeDir}` : "/";
}

function slugForRoute(route) {
  return route === "/" ? "index" : route.replace(/^\/+/, "").replaceAll("/", "-").replace(/-$/, "");
}

await rm(reportDir, { recursive: true, force: true });
await mkdir(reportDir, { recursive: true });
if (useExistingBuild) {
  await assertExistingBuild();
} else {
  await run("pnpm", ["run", "build"]);
}

const routes = [...(await collectIndexFiles(dist)).map(routeForIndexFile), "/404.html"].sort((a, b) => {
  if (a === "/") return -1;
  if (b === "/") return 1;
  return a.localeCompare(b);
});

const preview = spawn(viteBin, ["preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"]
});

preview.stdout.on("data", (chunk) => process.stdout.write(chunk));
preview.stderr.on("data", (chunk) => process.stderr.write(chunk));

function stopPreview() {
  if (!preview.killed) {
    preview.kill("SIGTERM");
  }
}

process.once("SIGINT", stopPreview);
process.once("SIGTERM", stopPreview);

let chrome;
let failed = false;

try {
  await waitForServer(`${baseUrl}/`);
  chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"]
  });

  for (const route of routes) {
    const url = new URL(route, baseUrl).toString();
    const result = await lighthouse(url, {
      port: chrome.port,
      onlyCategories: ["accessibility"],
      logLevel: "error",
      output: "json"
    });
    const lhr = result?.lhr;
    if (!lhr) {
      throw new Error(`Lighthouse did not return a report for ${url}`);
    }

    const score = Math.round((lhr.categories.accessibility.score ?? 0) * 100);
    const reportPath = join(reportDir, `${slugForRoute(route)}.json`);
    await writeFile(reportPath, result.report, "utf8");
    console.log(`[a11y:lighthouse] ${route} accessibility score: ${score}`);

    if (score < minScore) {
      failed = true;
      const audits = Object.values(lhr.audits)
        .filter((audit) => audit.score !== null && audit.score !== 1)
        .map((audit) => `${audit.id}: ${audit.title}`);
      console.error(audits.join("\n"));
    }
  }
} finally {
  if (chrome) {
    await chrome.kill();
  }
  stopPreview();
}

if (failed) {
  throw new Error(`Lighthouse accessibility score must be at least ${minScore}`);
}
