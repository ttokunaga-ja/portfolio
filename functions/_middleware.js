// Cloudflare Pages Functions middleware.
//
// Locale is carried in the URL (`/` = Japanese, `/en/...` = English). This
// middleware only personalizes the bare root `/`: returning visitors whose
// preference is English (explicit cookie, or browser language on a first
// visit) are redirected to `/en/`. Every other path — including deep
// Japanese links such as `/research/` — is served as requested, so shared
// links and crawlers always reach the URL they asked for.

const SUPPORTED = ["ja", "en"];

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

function localeFromAcceptLanguage(header) {
  if (!header) return "ja";
  const ranked = header
    .split(",")
    .map((entry) => {
      const [tag, q] = entry.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number.parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("en")) return "en";
  }
  return "ja";
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

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
