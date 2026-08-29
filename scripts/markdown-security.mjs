function hasUnsafeCharacters(value) {
  return /[\u0000-\u001f\u007f]/.test(value) || value.trim() !== value;
}

export function isAllowedMarkdownHref(value) {
  if (typeof value !== "string" || !value || hasUnsafeCharacters(value)) return false;
  if (value.startsWith("#")) return true;

  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname) && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

function walkMarkdownTokens(tokens, visitor) {
  const pending = [...tokens];
  const seen = new WeakSet();
  while (pending.length > 0) {
    const token = pending.pop();
    if (!token || typeof token !== "object") continue;
    if (seen.has(token)) continue;
    seen.add(token);

    if (typeof token.type === "string") visitor(token);

    for (const value of Object.values(token)) {
      if (Array.isArray(value)) {
        pending.push(...value.filter((item) => item && typeof item === "object"));
      } else if (value && typeof value === "object") {
        pending.push(value);
      }
    }
  }
}

export function assertSafeMarkdownTokens(tokens, context) {
  walkMarkdownTokens(tokens, (token) => {
    if (token.type === "html") {
      throw new Error(
        `${context.normalized} contains raw HTML. Use Markdown, supported Zenn directives, or a standalone YouTube URL.`
      );
    }
    if (token.type === "link" && !isAllowedMarkdownHref(token.href)) {
      throw new Error(
        `${context.normalized} contains an unsafe Markdown link: ${String(token.href)}. Only credential-free http(s) URLs and fragments are allowed.`
      );
    }
  });
}
