import assert from "node:assert/strict";

const markerPattern = /(ZXQLOCK\d{5}QXZ)/g;

// The model translates text segments; only this trusted code assembles markers.
// This protocol repair deliberately retains the existing prompt/input attempt
// allowance. It neither resets counters nor retranslates cached successes.
export function splitTranslationBody(body) {
  const parts = body.split(markerPattern);
  return { parts, segments: parts.filter((_, index) => index % 2 === 0).map((part) => part.trim()) };
}

export function assembleTranslationBody(body, segments) {
  const { parts, segments: original } = splitTranslationBody(body);
  assert.ok(Array.isArray(segments) && segments.length === original.length, "Invalid body segment count");
  for (let index = 0; index < segments.length; index++) {
    assert.equal(typeof segments[index], "string", "Invalid body segment type");
    assert.ok(!/ZXQLOCK\d+QXZ/.test(segments[index]), "Model supplied a protected marker");
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
