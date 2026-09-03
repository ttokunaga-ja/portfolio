// Cloudflare Pages Functions middleware.
//
// Locale is carried in the URL (`/` = Japanese, `/en/...` = English). This
// middleware only personalizes the bare root `/`: returning visitors whose
// preference is English (explicit cookie, or browser language on a first
// visit) are redirected to `/en/`. Every other path — including deep
// Japanese links such as `/research/` — is served as requested, so shared
// links and crawlers always reach the URL they asked for.

const SUPPORTED = ["ja", "en"];
const RETIRED_ASSET_PATHS = new Set([
  "/images/experience/rione/rione_expo_pass.jpg",
  "/images/experience/marugame-kyudo-club/marugame-kyudo-club_farewell.webp",
  "/images/experience/marugame-kyudo-club/marugame-kyudo-club_farewell.png"
]);

// Cloudflare normalizes the URL before static-asset lookup less strictly than
// applications tend to normalize route paths. Compare a decoded, collapsed
// pathname here so alternate spellings of retired public assets cannot bypass
// their permanent tombstones. A decode error is deliberately treated as a
// non-match: malformed URLs must never make the middleware throw or broaden the
// block to unrelated assets.
function isRetiredAssetPath(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  return RETIRED_ASSET_PATHS.has(decodedPath.replace(/\/{2,}/g, "/").toLowerCase());
}

function readLocaleCookie(cookieHeader) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "locale") {
      const value = rest.join("=");
      return SUPPORTED.includes(value) ? value : null;
    }
  }
  return null;
}

export function localeFromAcceptLanguage(header) {
  if (!header) return "ja";
  const ranked = header
    .split(",")
    .map((entry, index) => {
      const [rawTag, ...parameters] = entry.trim().split(";");
      const quality = parameters.find((parameter) => parameter.trim().toLowerCase().startsWith("q="));
      const qValue = quality?.trim().slice(2);
      // RFC 9110 quality values are bounded decimals with at most three
      // fractional digits. A malformed or out-of-range explicit q never
      // becomes an implicit preference.
      const q = qValue === undefined || /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(qValue) ? Number(qValue ?? 1) : 0;
      return { tag: rawTag.toLowerCase(), q, index };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { tag } of ranked) {
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("en")) return "en";
  }
  return "ja";
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (isRetiredAssetPath(url.pathname)) {
    return new Response(null, {
      status: 410,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex"
      }
    });
  }

  if (url.pathname !== "/") {
    return next();
  }

  const preferred =
    readLocaleCookie(request.headers.get("Cookie")) ?? localeFromAcceptLanguage(request.headers.get("Accept-Language"));

  if (preferred === "en") {
    const target = new URL("/en/", url);
    target.search = url.search;
    return new Response(null, {
      status: 302,
      headers: {
        Location: target.toString(),
        // Decision depends on per-visitor cookie / Accept-Language.
        "Cache-Control": "no-store",
        Vary: "Cookie, Accept-Language"
      }
    });
  }

  return next();
}
