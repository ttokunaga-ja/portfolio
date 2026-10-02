import assert from "node:assert/strict";

export const MAX_ATTEMPTS = 5;
const HOUR = 60 * 60 * 1000;

// Only these sanitized hints leave the adapter; never persist provider bodies.
export function errorHints(response, payload, now = Date.now()) {
  const header = response.headers.get("retry-after");
  const numeric = header && /^\d+(?:\.\d+)?$/.test(header) ? Number(header) * 1000 : NaN;
  const dated = header ? Date.parse(header) - now : NaN;
  let retryAfterMs = Number.isFinite(numeric) ? numeric : Number.isFinite(dated) ? Math.max(0, dated) : 0;
  let dailyQuota = false;
  for (const detail of payload?.error?.details ?? []) {
    if (detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo") {
      const delay = /^(\d+(?:\.\d+)?)s$/.exec(detail.retryDelay ?? "");
      if (delay) retryAfterMs = Math.max(retryAfterMs, Number(delay[1]) * 1000);
    }
    if (detail?.["@type"] === "type.googleapis.com/google.rpc.QuotaFailure") {
      dailyQuota ||= (detail.violations ?? []).some((item) => /perday|per_day/i.test(item.quotaId ?? ""));
    }
  }
  return { retryAfterMs: Number.isFinite(retryAfterMs) && retryAfterMs >= 0 ? retryAfterMs : 0, dailyQuota };
}

export function nextPacificMidnight(nowMs) {
  // Find the next local date boundary, including both daylight-saving changes.
  const day = (ms) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(ms);
  const today = day(nowMs);
  let low = nowMs;
  let high = nowMs + 26 * HOUR;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (day(middle) === today) low = middle;
    else high = middle;
  }
  return high;
}

export function retryDecision(error, attemptCount, nowMs, random = Math.random) {
  assert.ok(Number.isInteger(attemptCount) && attemptCount >= 1 && attemptCount <= MAX_ATTEMPTS);
  const status = Number(error?.status ?? error?.statusCode ?? error?.code);
  const transient =
    status === 429 ||
    status === 408 ||
    (status >= 500 && status <= 599) ||
    ["AbortError", "TimeoutError", "TypeError"].includes(error?.name);
  const reason =
    status === 429
      ? "quota"
      : transient
        ? "temporarily_unavailable"
        : [400, 401, 402, 403].includes(status)
          ? "credentials_or_request"
          : "request_failed";
  if (!transient || attemptCount >= MAX_ATTEMPTS) return { status: "exhausted", reason, nextAttemptAt: null };
  const jitter = Math.max(0, Math.min(1, Number(random()) || 0)) * 5 * 60 * 1000;
  let due = nowMs + HOUR * 2 ** (attemptCount - 1) + jitter;
  if (Number.isFinite(error?.retryAfterMs) && error.retryAfterMs > 0) due = Math.max(due, nowMs + error.retryAfterMs);
  if (status === 429 && error?.dailyQuota) due = Math.max(due, nextPacificMidnight(nowMs) + 5 * 60 * 1000);
  return { status: "wait", reason, nextAttemptAt: new Date(due).toISOString() };
}
