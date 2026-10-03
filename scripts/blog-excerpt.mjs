import { marked } from "marked";

function decodeEntities(text) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, value) => {
    if (!value.startsWith("#")) return named[value.toLowerCase()];
    const codePoint = value.toLowerCase().startsWith("#x")
      ? Number.parseInt(value.slice(2), 16)
      : Number(value.slice(1));
    return codePoint > 0 && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      ? String.fromCodePoint(codePoint)
      : entity;
  });
}

function containsHtml(tokens) {
  return tokens.some((token) => token.type === "html" || (token.tokens && containsHtml(token.tokens)));
}

function inlineText(tokens) {
  return tokens
    .map((token) => {
      if (token.type === "image" || token.type === "html" || token.type === "br") return " ";
      if (token.type === "link" && token.text === token.href) return " ";
      if (token.tokens) return inlineText(token.tokens);
      return token.type === "text" || token.type === "codespan" || token.type === "escape" ? token.text : "";
    })
    .join("");
}

function proseBlocks(tokens) {
  return tokens.flatMap((token) => {
    if (token.type === "paragraph" || token.type === "text") {
      const inline = token.tokens ?? [];
      return containsHtml(inline) ? [] : [inline.length ? inlineText(inline) : token.text];
    }
    if (token.type === "blockquote") return proseBlocks(token.tokens);
    if (token.type === "list") return token.items.flatMap((item) => proseBlocks(item.tokens));
    // Headings, tables, code, raw HTML and images are not introductory prose.
    return [];
  });
}

/** Derive a plain-text preview from the beginning of the article's prose. */
export function excerptFromMarkdown(body, limit = 180) {
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError("Excerpt limit must be a non-negative integer.");
  if (limit === 0) return "";
  const markdown = String(body ?? "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*:::/u.test(line))
    .join("\n");
  const text = decodeEntities(proseBlocks(marked.lexer(markdown, { gfm: true })).join(" "))
    .replace(/(?:https?:\/\/|mailto:|www\.)[^\s<>]+/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  const characters = Array.from(text);
  return characters.length <= limit
    ? text
    : `${characters
        .slice(0, limit - 1)
        .join("")
        .trimEnd()}…`;
}
