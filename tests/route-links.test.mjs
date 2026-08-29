import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const generated = await readFile(new URL("../src/generated/content.generated.ts", import.meta.url), "utf8");
const clientRoutes = await readFile(new URL("../src/clientRoutes.ts", import.meta.url), "utf8");
const entryClient = await readFile(new URL("../src/entry-client.tsx", import.meta.url), "utf8");
const routeLinks = await readFile(new URL("../src/routeLinks.ts", import.meta.url), "utf8");
const detailRoute = await readFile(new URL("../src/pages/detail.tsx", import.meta.url), "utf8");
const budgetChecker = await readFile(new URL("../scripts/check-performance-budget.mjs", import.meta.url), "utf8");

function hasDetail(locale, collection, slug) {
  return generated.includes(`\"${locale}/${collection}/${slug}\": () => import(`);
}

test("known Japanese-only blog detail has no English target while rione is bilingual", () => {
  assert.equal(hasDetail("ja", "blog", "2025-08-03-india-internship-week-0"), true);
  assert.equal(hasDetail("en", "blog", "2025-08-03-india-internship-week-0"), false);
  assert.equal(hasDetail("ja", "experience", "rione"), true);
  assert.equal(hasDetail("en", "experience", "rione"), true);
});

test("detail locale switching checks target availability before retaining the detail URL", () => {
  assert.match(routeLinks, /const \{ getEntry \} = await import\("\.\/content"\)/);
  assert.match(routeLinks, /getEntry\(locale, route\.collection, route\.slug\)/);
  assert.match(routeLinks, /: hrefFor\(route\.collection, locale\)/);
  assert.match(
    routeLinks,
    /catch \{\s*\/\/ A missing metadata wrapper cannot establish that the target detail exists\.\s*return hrefFor\(route\.collection, locale\);\s*\}/
  );
});

test("unknown Japanese and English paths render the localized not-found component", () => {
  assert.match(detailRoute, /if \(route\.kind !== "detail"\) \{\s*return <NotFoundPage locale=\{locale\} \/>;\s*\}/);
  assert.match(detailRoute, /isJapanese \? "ページが見つかりません" : "Page not found"/);
});

test("shaped unknown detail URLs are converted to not-found before hydration", () => {
  assert.match(clientRoutes, /resolveKnownClientDetail\(route: RouteState, exists: boolean\)/);
  assert.match(clientRoutes, /route\.kind === "detail" && !exists \? \{ kind: "notFound" \} : route/);
  assert.match(entryClient, /const \{ getEntry, loadEntryDetail \} = await import\("\.\/content"\)/);
  assert.match(
    entryClient,
    /const entryExists = Boolean\(getEntry\(locale, route\.collection, route\.slug\)\);\s*knownMissingDetail = !entryExists;\s*route = resolveKnownClientDetail\(route, entryExists\);/
  );
  assert.match(
    entryClient,
    /if \(app && knownMissingDetail\) \{[\s\S]*root\.replaceChildren\(\);[\s\S]*createRoot\(root\)\.render\(app\);/
  );
});

test("detail budgets include the pre-hydration content wrapper", () => {
  assert.match(budgetChecker, /key === "src\/content\.ts"/);
  assert.match(budgetChecker, /pre-hydration detail content wrapper/);
  assert.match(budgetChecker, /Client manifest no longer declares the pre-hydration detail content wrapper/);
});

test("the generated 404 shell is budgeted with the localized not-found page module", () => {
  assert.match(budgetChecker, /if \(route === "\/404\.html"\) return "src\/pages\/detail\.tsx"/);
});
