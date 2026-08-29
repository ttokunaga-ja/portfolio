import { gzipSync } from "node:zlib";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const manifestPath = join(dist, ".vite", "manifest.json");
const reportPath = join(root, "reports", "performance-budget.json");
const limits = {
  routeJavaScriptGzipBytes: 256 * 1024,
  largestImageBytes: Math.floor(1.5 * 1024 * 1024),
  totalImageBytes: 30 * 1024 * 1024
};
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(path) : entry.isFile() ? [path] : [];
    })
  );
  return nested.flat();
}

function extension(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

function findManifestEntry(manifest, predicate, description) {
  const matches = Object.entries(manifest).filter(([key, entry]) => predicate(key, entry));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one manifest source key for ${description}; found ${matches.length}.`);
  }
  return matches[0][0];
}

function staticClosure(manifest, roots) {
  const pending = [...roots];
  const keys = new Set();
  const files = new Set();
  while (pending.length) {
    const key = pending.pop();
    if (keys.has(key)) continue;
    const entry = manifest[key];
    if (!entry?.file) throw new Error(`Manifest key ${key} has no emitted file.`);
    keys.add(key);
    files.add(entry.file);
    for (const dependency of entry.imports ?? []) pending.push(dependency);
  }
  return { keys, files };
}

async function gzipBytesFor(files) {
  const sizes = await Promise.all(
    [...files].map(async (file) => ({ file, gzipBytes: gzipSync(await readFile(join(dist, file))).length }))
  );
  return { gzipBytes: sizes.reduce((total, size) => total + size.gzipBytes, 0), sizes };
}

function detailSourceKey(route) {
  const match = route.match(/^\/(en\/)?(research|projects|experience|blog)\/([^/]+)\/index\.html$/);
  if (!match) return null;
  const [, english, collection, slug] = match;
  return `src/generated/content-details/${english ? "en" : "ja"}/${collection}/${slug}.ts`;
}

function routeForHtml(path) {
  return `/${relative(dist, path).replaceAll("\\", "/")}`;
}

const files = await filesUnder(dist);
const htmlFiles = files.filter((path) => extension(path) === ".html");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const clientKey = findManifestEntry(manifest, (_key, entry) => entry.name === "entry-client", "client entry");
const base = staticClosure(manifest, [clientKey]);
const baseGzip = await gzipBytesFor(base.files);
const clientDynamicImports = new Set(manifest[clientKey].dynamicImports ?? []);
const detailContentKey = findManifestEntry(
  manifest,
  (key, entry) => key === "src/content.ts" && entry.src === "src/content.ts",
  "detail content wrapper dynamic entry"
);
if (!clientDynamicImports.has(detailContentKey)) {
  throw new Error("Client manifest no longer declares the pre-hydration detail content wrapper dynamic entry.");
}
function pageSourceKey(route) {
  if (route === "/404.html") return "src/pages/detail.tsx";
  if (/^\/(?:en\/)?(?:research|projects|experience|blog)\/[^/]+\/index\.html$/.test(route)) {
    return "src/pages/detail.tsx";
  }
  if (/^\/(?:en\/)?(?:research|projects|blog)\/index\.html$/.test(route)) return "src/pages/listing.tsx";
  if (/^\/(?:en\/)?experience\/index\.html$/.test(route)) return "src/pages/experience.tsx";
  if (/^\/(?:en\/)?about\/index\.html$/.test(route)) return "src/pages/about.tsx";
  if (/^\/(?:en\/)?skills\/index\.html$/.test(route)) return "src/pages/skills.tsx";
  if (/^\/(?:en\/)?contact\/index\.html$/.test(route)) return "src/pages/contact.tsx";
  if (/^\/(?:en\/)?privacy\/index\.html$/.test(route)) return "src/pages/privacy.tsx";
  return "src/pages/home.tsx";
}

const firebaseSourceKeys = [
  findManifestEntry(
    manifest,
    (key, entry) => key === entry.src && /node_modules\/firebase\/app\/dist\/esm\/index\.esm\.js$/.test(entry.src),
    "Firebase app dynamic entry"
  ),
  findManifestEntry(
    manifest,
    (key, entry) => key === entry.src && /node_modules\/firebase\/auth\/dist\/esm\/index\.esm\.js$/.test(entry.src),
    "Firebase auth dynamic entry"
  )
];

const routeMeasurements = [];
for (const htmlFile of htmlFiles) {
  const route = routeForHtml(htmlFile);
  const pageKey = pageSourceKey(route);
  if (!manifest[pageKey] || !clientDynamicImports.has(pageKey)) {
    throw new Error(`Route ${route} is missing its client dynamic page entry ${pageKey}.`);
  }
  const page = staticClosure(manifest, [pageKey]);
  const pageGraphDynamicImports = new Set([...page.keys].flatMap((key) => manifest[key]?.dynamicImports ?? []));
  const automatic = [{ kind: "pre-hydration page", sourceKeys: [...page.keys], files: [...page.files] }];
  const extraFiles = new Set(page.files);
  const detailKey = detailSourceKey(route);
  if (detailKey) {
    const detailContent = staticClosure(manifest, [detailContentKey]);
    for (const file of detailContent.files) extraFiles.add(file);
    automatic.push({
      kind: "pre-hydration detail content wrapper",
      sourceKeys: [...detailContent.keys],
      files: [...detailContent.files]
    });
    if (!manifest[detailKey] || !pageGraphDynamicImports.has(detailKey)) {
      throw new Error(`Detail route ${route} is missing its manifest dynamic entry ${detailKey}.`);
    }
    const detail = staticClosure(manifest, [detailKey]);
    for (const file of detail.files) extraFiles.add(file);
    automatic.push({ kind: "pre-hydration detail", sourceKeys: [...detail.keys], files: [...detail.files] });
  }
  if (/^\/(?:en\/)?contact\/index\.html$/.test(route)) {
    if (!firebaseSourceKeys.every((key) => pageGraphDynamicImports.has(key))) {
      throw new Error("Contact page no longer declares both Firebase mount-time dynamic entries.");
    }
    const firebase = staticClosure(manifest, firebaseSourceKeys);
    for (const file of firebase.files) extraFiles.add(file);
    automatic.push({ kind: "mount-time Firebase preload", sourceKeys: [...firebase.keys], files: [...firebase.files] });
  }

  const routeFiles = new Set([...base.files, ...extraFiles]);
  const routeGzip = await gzipBytesFor(routeFiles);
  routeMeasurements.push({
    route,
    common: { sourceKeys: [...base.keys], files: [...base.files], gzipBytes: baseGzip.gzipBytes },
    automatic,
    gzipBytes: routeGzip.gzipBytes,
    files: routeGzip.sizes
  });
}

const imageMeasurements = await Promise.all(
  files
    .filter((path) => imageExtensions.has(extension(path)))
    .map(async (path) => ({ path: relative(dist, path), bytes: (await stat(path)).size }))
);
const largestRouteJavaScriptGzipBytes = Math.max(0, ...routeMeasurements.map((entry) => entry.gzipBytes));
const largestImageBytes = Math.max(0, ...imageMeasurements.map((entry) => entry.bytes));
const totalImageBytes = imageMeasurements.reduce((total, entry) => total + entry.bytes, 0);
const maxRoute = routeMeasurements.reduce((largest, entry) => (entry.gzipBytes > largest.gzipBytes ? entry : largest), {
  route: "none",
  gzipBytes: 0
});
const report = {
  limits,
  manifestPath: relative(root, manifestPath),
  largestRouteJavaScriptGzipBytes,
  maxRoute: { route: maxRoute.route, gzipBytes: maxRoute.gzipBytes },
  largestImageBytes,
  totalImageBytes,
  routes: routeMeasurements
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `[budget] largest route JS graph gzip: ${maxRoute.route} ${largestRouteJavaScriptGzipBytes} / ${limits.routeJavaScriptGzipBytes} bytes`
);
console.log(`[budget] largest image: ${largestImageBytes} / ${limits.largestImageBytes} bytes`);
console.log(`[budget] total images: ${totalImageBytes} / ${limits.totalImageBytes} bytes`);
if (
  largestRouteJavaScriptGzipBytes > limits.routeJavaScriptGzipBytes ||
  largestImageBytes > limits.largestImageBytes ||
  totalImageBytes > limits.totalImageBytes
) {
  throw new Error("Performance budget exceeded; inspect reports/performance-budget.json before raising a limit.");
}
