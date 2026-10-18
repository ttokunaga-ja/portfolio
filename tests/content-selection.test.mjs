import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function contentWith(entries) {
  const source = (await readFile(new URL("../src/content.ts", import.meta.url), "utf8")).replace(
    /import \{ detailLoaders, entries \} from "\.\/generated\/content.generated";/,
    `const detailLoaders = {}; const entries = ${JSON.stringify(entries)};`
  );
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const entry = (slug, extra = {}) => ({
  locale: "ja",
  collection: "projects",
  slug,
  title: slug,
  publishedAt: "",
  updatedAt: "",
  startDate: "",
  endDate: "",
  sortOrder: 10,
  featured: true,
  demoUrl: "",
  links: [],
  ...extra
});

test("latest prefers dated entries, then deterministic editorial order for ties and undated fallback", async () => {
  const dated = entry("dated", { startDate: "2026-06-07" });
  const undated = entry("undated", { sortOrder: 1 });
  let content = await contentWith([undated, dated]);
  assert.equal(content.getLatestEntry("ja", "projects").slug, "dated");
  content = await contentWith([entry("z", { startDate: "2026-06-07" }), dated]);
  assert.equal(content.getLatestEntry("ja", "projects").slug, "dated");
  content = await contentWith([entry("z"), undated, entry("a")]);
  assert.equal(content.getLatestEntry("ja", "projects").slug, "undated");
  content = await contentWith([entry("z"), entry("a")]);
  assert.equal(content.getLatestEntry("ja", "projects").slug, "a");
  content = await contentWith([]);
  assert.equal(content.getLatestEntry("ja", "projects"), undefined);
});

test("featured entries follow editorial order regardless of generated input order", async () => {
  const content = await contentWith([entry("z"), entry("b", { sortOrder: 1 }), entry("a")]);
  assert.deepEqual(
    content.getFeaturedEntries("ja", "projects").map((item) => item.slug),
    ["b", "a", "z"]
  );
});

test("Home chooses one latest entry per collection and merges them newest first", async () => {
  const content = await contentWith([
    entry("old", { startDate: "2025-01-01" }),
    entry("undated", { sortOrder: 1 }),
    entry("project", { updatedAt: "2026-06-07" }),
    entry("research", { collection: "research", publishedAt: "2026-09-16" }),
    entry("blog-old", { collection: "blog", publishedAt: "2026-01-01" }),
    entry("blog-new", { collection: "blog", publishedAt: "2026-10-01" }),
    entry("experience", { collection: "experience", startDate: "2027-04-01" })
  ]);
  assert.deepEqual(
    content.getHomeTimeline("ja").map((item) => item.slug),
    ["blog-new", "research", "project"]
  );
  assert.equal(content.getEntryDate(entry("undated")), "");
  assert.equal(content.getEntryDate(entry("month", { startDate: "2026-06" })), "2026-06");
});

test("timeline deterministically handles equal dates, missing dates, and missing categories", async () => {
  const content = await contentWith([
    entry("z", { title: "Same", startDate: "2026-06-07" }),
    entry("a", { title: "Same", startDate: "2026-06-07" }),
    entry("undated-research", { collection: "research" })
  ]);
  assert.deepEqual(
    content.getHomeTimeline("ja").map((item) => item.slug),
    ["a", "undated-research"]
  );
  assert.deepEqual(content.getHomeTimeline("en"), []);
});

test("GitHub and release links do not become a demo", async () => {
  const content = await contentWith([]);
  assert.equal(
    content.getDemoHref(
      entry("kio", {
        links: [
          { kind: "github", label: "GitHub", url: "https://github.com/ttokunaga-ja/kio" },
          {
            kind: "release",
            label: "CLI pre-release",
            url: "https://github.com/ttokunaga-ja/kio/releases/tag/v0.1.0-rc.3"
          }
        ]
      })
    ),
    ""
  );
});
