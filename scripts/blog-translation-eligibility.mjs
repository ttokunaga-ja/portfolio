import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { marked } from "marked";
import { hasTranslationMarkers } from "./blog-translation-markers.mjs";
import { parseFrontmatter } from "./frontmatter.mjs";

// Only this marker opts a file into automated translation lifecycle management.
// In particular, sourceUrl alone must never suppress a manually authored post.
export function isManagedBlogTranslation({ locale, collection, data }) {
  return locale === "en" && collection === "blog" && Object.hasOwn(data, "translationSourceHash");
}

export function hashTranslationSource(raw) {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function isPublicBlogTranslationSource(data, slug) {
  return (
    data.canonicalUrl === `https://zenn.dev/t_tokunaga/articles/${slug}` &&
    data.published !== false &&
    data.draft !== true
  );
}

function localImagePath(href, slug) {
  const value = String(href ?? "").trim();
  const base = `/images/blog/${slug}/`;
  if (!value || /^(?:https?:)?\/\//.test(value) || value.startsWith("data:")) return null;
  const normalized = posix.normalize(value.startsWith("/") ? value : `${base}${value.replace(/^\.\/+/, "")}`);
  // Leave unsafe paths for the ordinary Markdown validation to reject.
  return normalized.startsWith(base) ? normalized : null;
}

export async function getBlogTranslationEligibility({ contentDir, locale, collection, slug, data, body = "" }) {
  if (!isManagedBlogTranslation({ locale, collection, data })) {
    return { managed: false, eligible: true, reason: "unmanaged" };
  }

  const excluded = (reason) => ({ managed: true, eligible: false, reason });
  if (hasTranslationMarkers(data) || hasTranslationMarkers(body)) return excluded("unresolved-translation-marker");
  let source;
  try {
    source = await readFile(join(contentDir, "ja", "blog", `${slug}.md`));
  } catch (error) {
    if (error.code === "ENOENT") return excluded("source-missing");
    throw error;
  }

  if (typeof data.translationSourceHash !== "string" || !/^[a-f0-9]{64}$/.test(data.translationSourceHash)) {
    return excluded("source-hash-invalid");
  }
  if (hashTranslationSource(source) !== data.translationSourceHash) {
    return excluded("source-hash-mismatch");
  }
  const { data: sourceData } = parseFrontmatter(source.toString("utf8"));
  if (!isPublicBlogTranslationSource(sourceData, slug)) {
    return excluded("source-not-public");
  }

  // A removed image must not take down the build or be restored from an older
  // translation. Both output surfaces make the same publication decision.
  const imagePaths = new Set();
  marked.walkTokens(marked.lexer(body), (token) => {
    if (token.type !== "image") return;
    const path = localImagePath(token.href, slug);
    if (path) imagePaths.add(path);
  });
  for (const path of imagePaths) {
    try {
      await access(join(dirname(contentDir), "public", path.slice(1)));
    } catch (error) {
      if (error.code === "ENOENT") return excluded("image-missing");
      throw error;
    }
  }

  return { managed: true, eligible: true, reason: "current" };
}
