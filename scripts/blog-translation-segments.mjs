import assert from "node:assert/strict";

// The model translates text segments; only this trusted code assembles markers.
// This protocol repair deliberately retains the existing prompt/input attempt
// allowance. It neither resets counters nor retranslates cached successes.
export function splitTranslationBody(body, names = []) {
  assert.ok(
    Array.isArray(names) &&
      names.length <= 100 &&
      names.every((name) => typeof name === "string" && name.length > 0 && name.length <= 160),
    "Invalid protected names"
  );
  const fixedNames = [...names].sort((a, b) => b.length - a.length);
  const parts = [];
  let cursor = 0;
  while (cursor < body.length) {
    const match = body.slice(cursor).match(/ZXQLOCK\d{5}QXZ|[+-]?\d+(?:[.,]\d+)*%?/);
    let at = match ? cursor + match.index : Infinity;
    let value = match?.[0];
    for (const name of fixedNames) {
      const found = body.indexOf(name, cursor);
      if (found >= 0 && found < at) {
        at = found;
        value = name;
      }
    }
    if (at === Infinity) break;
    parts.push(body.slice(cursor, at), value);
    cursor = at + value.length;
  }
  parts.push(body.slice(cursor));
  return { parts, segments: parts.filter((_, index) => index % 2 === 0).map((part) => part.trim()) };
}

export function assembleTranslationBody(body, segments, names = []) {
  const { parts, segments: original } = splitTranslationBody(body, names);
  assert.ok(Array.isArray(segments) && segments.length === original.length, "Invalid body segment count");
  for (let index = 0; index < segments.length; index++) {
    assert.equal(typeof segments[index], "string", "Invalid body segment type");
    assert.ok(!/ZXQLOCK\d+QXZ/.test(segments[index]), "Model supplied a protected marker");
    assert.ok(!/[0-9]/.test(segments[index]), "Numeric literals in prose segment");
    if (!original[index].trim()) assert.equal(segments[index], original[index], "Whitespace segment changed");
  }
  let index = 0;
  return parts
    .map((part, position) => {
      if (position % 2) return part;
      const translated = segments[index++].trim();
      if (!part.trim()) return part;
      const prefix = part.match(/^\s*/)[0];
      const suffix = part.match(/\s*$/)[0];
      return prefix + translated + suffix;
    })
    .join("");
}

// A source-owned Markdown skeleton. Every line boundary, indentation, block
// prefix, inline delimiter and protected value stays outside the model's slots.
// This also preserves Markdown's two-space hard breaks byte for byte.
export function splitStructuralBody(body) {
  const parts = [];
  const segments = [];
  const fixed = (text) => parts.push({ text });
  for (const line of body.match(/[^\n]*\n|[^\n]+$/g) ?? []) {
    const prefix = line.match(
      /^[ \t]*(?:(?:>[ \t]*)*(?:(?:#{1,6}[ \t]+)|(?:[-+*][ \t]+)|(?:\d+[.)][ \t]+)|(?:\[[ xX]\][ \t]+))?)/
    )[0];
    fixed(prefix);
    const rest = line.slice(prefix.length);
    const pattern = /ZXQLOCK\d{5}QXZ|[+-]?\d+(?:[.,]\d+)*%?|\p{N}+|[\\`*_{}\[\]()<>!|#~:$=]|\r?\n/gu;
    let cursor = 0;
    const prose = (text) => {
      const leading = text.match(/^\s*/)[0];
      const trailing = text.match(/\s*$/)[0];
      const trimmed = text.trim();
      if (!trimmed) return fixed(text);
      fixed(leading);
      parts.push({ slot: segments.length });
      segments.push(trimmed);
      fixed(trailing);
    };
    for (const match of rest.matchAll(pattern)) {
      prose(rest.slice(cursor, match.index));
      fixed(match[0]);
      cursor = match.index + match[0].length;
    }
    prose(rest.slice(cursor));
  }
  return { parts, segments };
}

export function assembleStructuralBody(body, segments, names = []) {
  const skeleton = splitStructuralBody(body);
  assert.ok(Array.isArray(segments) && segments.length === skeleton.segments.length, "Invalid body segment count");
  for (const [index, value] of segments.entries()) {
    assert.equal(typeof value, "string", "Invalid body segment type");
    assert.ok(value.trim() && !/\u0000|[\r\n\\`*_{}\[\]()<>!|#~:$=]/.test(value), "Injected Markdown in prose slot");
    assert.ok(!/ZXQLOCK\d+QXZ/.test(value), "Model supplied a protected marker");
    assert.ok(!/(?:https?:|ftp:|www\.)/i.test(value), "Injected URL in prose slot");
    assert.ok(!/\p{N}/u.test(value), "Numeric literals in prose segment");
    assert.ok(!names.some((name) => value.includes(name)), "A protected name changed in metadata");
    if (!/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(skeleton.segments[index]))
      assert.equal(value.trim(), skeleton.segments[index], "Literal prose slot changed");
  }
  return skeleton.parts.map((part) => (part.slot === undefined ? part.text : segments[part.slot].trim())).join("");
}
