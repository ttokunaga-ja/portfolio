import test from "node:test";
import assert from "node:assert/strict";
import { localeFromAcceptLanguage, onRequest } from "../functions/_middleware.js";

test("Accept-Language ignores q=0 languages", () => {
  assert.equal(localeFromAcceptLanguage("en;q=0, ja;q=0.8"), "ja");
  assert.equal(localeFromAcceptLanguage("ja-JP;q=0, en-US;q=1"), "en");
});

test("Accept-Language honors weights and stable header order", () => {
  assert.equal(localeFromAcceptLanguage("ja;q=0.5, en;q=0.9"), "en");
  assert.equal(localeFromAcceptLanguage("en-GB, ja-JP"), "en");
});

test("Accept-Language safely falls back for missing, malformed, or out-of-range values", () => {
  assert.equal(localeFromAcceptLanguage(null), "ja");
  assert.equal(localeFromAcceptLanguage("en;q=invalid, fr;q=1"), "ja");
  assert.equal(localeFromAcceptLanguage("en;q=1.1, ja;q=0.8"), "ja");
  assert.equal(localeFromAcceptLanguage("en;q=-0.1, ja;q=0.8"), "ja");
  assert.equal(localeFromAcceptLanguage("en;q=0.1234, ja;q=0.8"), "ja");
});

function context(url, headers = {}) {
  const nextResponse = new Response("next", { status: 200 });
  return {
    request: new Request(url, { headers }),
    next: () => nextResponse,
    nextResponse
  };
}

test("onRequest redirects the root with English preference while preserving the query", async () => {
  const input = context("https://takumi-tokunaga.com/?ref=homepage", { "Accept-Language": "en-US" });
  const response = await onRequest(input);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("Location"), "https://takumi-tokunaga.com/en/?ref=homepage");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Vary"), "Cookie, Accept-Language");
});

test("onRequest gives a valid locale cookie precedence and leaves non-root paths untouched", async () => {
  const root = context("https://takumi-tokunaga.com/", {
    Cookie: "locale=en",
    "Accept-Language": "ja-JP"
  });
  assert.equal((await onRequest(root)).headers.get("Location"), "https://takumi-tokunaga.com/en/");

  const nonRoot = context("https://takumi-tokunaga.com/research/?ref=shared", { Cookie: "locale=en" });
  assert.equal(await onRequest(nonRoot), nonRoot.nextResponse);
});

test("onRequest permanently tombstones every safe spelling of the retired Ri-one pass", async () => {
  const spellings = [
    "https://takumi-tokunaga.com/images/experience/rione/rione_expo_pass.JPG",
    "https://takumi-tokunaga.com/images/experience/rione/rione_expo_pass.JPG?cache=bust",
    "https://takumi-tokunaga.com//images//experience/rione//rione_expo_pass.JPG",
    "https://takumi-tokunaga.com/%69mages%2Fexperience%2Frione%2Frione_expo_pass%2EJPG",
    "https://takumi-tokunaga.com/IMAGES/EXPERIENCE/RIONE/RIONE_EXPO_PASS.jpg"
  ];

  for (const url of spellings) {
    const response = await onRequest(context(url));
    assert.equal(response.status, 410, url);
    assert.equal(response.headers.get("Cache-Control"), "no-store, max-age=0", url);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex", url);
    assert.equal(await response.text(), "", url);
  }
});

test("onRequest permanently tombstones every safe spelling of the retired Kyudo group photo", async () => {
  const spellings = [
    "https://takumi-tokunaga.com/images/experience/marugame-kyudo-club/marugame-kyudo-club_farewell.webp",
    "https://takumi-tokunaga.com/images/experience/marugame-kyudo-club/marugame-kyudo-club_farewell.webp?cache=bust",
    "https://takumi-tokunaga.com//images//experience//marugame-kyudo-club//marugame-kyudo-club_farewell.webp",
    "https://takumi-tokunaga.com/%69mages%2Fexperience%2Fmarugame-kyudo-club%2Fmarugame-kyudo-club_farewell%2Ewebp",
    "https://takumi-tokunaga.com/IMAGES/EXPERIENCE/MARUGAME-KYUDO-CLUB/MARUGAME-KYUDO-CLUB_FAREWELL.WEBP",
    "https://takumi-tokunaga.com/images/experience/marugame-kyudo-club/marugame-kyudo-club_farewell.png"
  ];

  for (const url of spellings) {
    const response = await onRequest(context(url));
    assert.equal(response.status, 410, url);
    assert.equal(response.headers.get("Cache-Control"), "no-store, max-age=0", url);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex", url);
    assert.equal(await response.text(), "", url);
  }
});

test("onRequest leaves malformed and legitimate image paths untouched", async () => {
  for (const url of [
    "https://takumi-tokunaga.com/images/experience/rione/rione_expo_pass-2.JPG",
    "https://takumi-tokunaga.com/images/experience/rione/rione_expo_pass.WEBP",
    "https://takumi-tokunaga.com/images/experience/rione/rione_expo_pass%ZZ.JPG",
    "https://takumi-tokunaga.com/images/experience/marugame-kyudo-club/marugame-kyudo-club_practice.jpg",
    "https://takumi-tokunaga.com/images/experience/marugame-kyudo-club/marugame-kyudo-club_farewell-2.webp"
  ]) {
    const input = context(url);
    assert.equal(await onRequest(input), input.nextResponse, url);
  }
});
