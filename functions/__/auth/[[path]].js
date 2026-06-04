const firebaseAuthOrigin = "https://trialauth-498405.firebaseapp.com";

function proxiedAuthUrl(requestUrl) {
  const url = new URL(requestUrl);
  return `${firebaseAuthOrigin}${url.pathname}${url.search}`;
}

function rewriteLocation(headers, requestUrl) {
  const location = headers.get("Location");
  if (!location) return;

  const request = new URL(requestUrl);
  const proxied = new URL(location, firebaseAuthOrigin);
  if (proxied.origin !== firebaseAuthOrigin) return;

  proxied.protocol = request.protocol;
  proxied.host = request.host;
  headers.set("Location", proxied.toString());
}

export async function onRequest({ request }) {
  const response = await fetch(proxiedAuthUrl(request.url), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  });

  const headers = new Headers(response.headers);
  rewriteLocation(headers, request.url);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
