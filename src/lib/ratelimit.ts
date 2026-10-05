// In-memory sliding window per client IP. Good enough for one process behind
// a reverse proxy; restart resets the counters.

type Bucket = { hits: number[] };

export class RateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(private limit: number, private windowMs: number) {}

  /** Returns true when the call is allowed and records it. */
  allow(key: string, now = Date.now()): boolean {
    const bucket = this.buckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((t) => now - t < this.windowMs);
    if (bucket.hits.length >= this.limit) {
      this.buckets.set(key, bucket);
      return false;
    }
    bucket.hits.push(now);
    this.buckets.set(key, bucket);
    return true;
  }

  /** Drop idle keys so the map does not grow forever. */
  sweep(now = Date.now()) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.hits.every((t) => now - t >= this.windowMs)) this.buckets.delete(key);
    }
  }
}
