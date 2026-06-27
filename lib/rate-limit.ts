// ─────────────────────────────────────────────────────────────────
// Pluggable rate limiter — fixed-window counters.
//
// Store resolution is automatic:
//   • If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, counters
//     live in Upstash Redis (durable, shared across all serverless instances).
//   • Otherwise they live in process memory. This works out of the box with
//     zero setup, but on serverless each instance has its own memory, so it
//     only raises the bar against naive abuse. Add the two env vars whenever
//     you want production-grade limiting — no code change needed.
//
// No SDK dependency: Upstash is hit over its REST API with plain fetch.
// ─────────────────────────────────────────────────────────────────

export type RateResult = {
  /** false when the caller has exceeded the limit for this window. */
  ok: boolean;
  /** Requests left in the current window (never negative). */
  remaining: number;
  /** Milliseconds until the window resets (for a Retry-After header). */
  resetMs: number;
};

export type RateOptions = {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

function hasUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// ── In-memory store ────────────────────────────────────────────────
const memory = new Map<string, { count: number; resetAt: number }>();
let lastSweep = 0;

function sweep(now: number) {
  // Cheap opportunistic cleanup so the map can't grow unbounded.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of memory) {
    if (v.resetAt <= now) memory.delete(k);
  }
}

function memoryLimit(key: string, { limit, windowMs }: RateOptions): RateResult {
  const now = Date.now();
  sweep(now);
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetMs: windowMs };
  }
  entry.count += 1;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetMs: entry.resetAt - now,
  };
}

// ── Upstash store ──────────────────────────────────────────────────
async function upstashLimit(
  key: string,
  { limit, windowMs }: RateOptions
): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  // One round-trip: bump the counter, set the TTL only on the first hit of the
  // window (PEXPIRE … NX), then read the remaining TTL back.
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, String(windowMs), "NX"],
      ["PTTL", key],
    ]),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);

  const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  const count = Number(data[0]?.result ?? 0);
  const ttl = Number(data[2]?.result ?? windowMs);
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetMs: ttl > 0 ? ttl : windowMs,
  };
}

/**
 * Count one request against `key` and report whether it is within `limit`.
 * Always call this BEFORE doing the protected work, and bail when `ok` is false.
 *
 * `key` should be specific to the action and the actor, e.g.
 *   `login:1.2.3.4`  or  `contact:1.2.3.4`.
 */
export async function rateLimit(
  key: string,
  opts: RateOptions
): Promise<RateResult> {
  if (hasUpstash()) {
    try {
      return await upstashLimit(key, opts);
    } catch (err) {
      // Fail open to the in-memory store rather than locking everyone out if
      // Upstash is briefly unreachable.
      console.error("[rate-limit] Upstash error, falling back to memory:", err);
      return memoryLimit(key, opts);
    }
  }
  return memoryLimit(key, opts);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
