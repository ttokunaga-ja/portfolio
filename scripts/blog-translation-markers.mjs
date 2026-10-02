// Reserved placeholders must never appear in published text or metadata.
// Non-global matching avoids stateful RegExp.lastIndex behavior.
export function hasTranslationMarkers(value) {
  return /ZXQLOCK\d+QXZ/.test(typeof value === "string" ? value : JSON.stringify(value));
}
