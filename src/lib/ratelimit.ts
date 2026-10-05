// In-memory sliding window per client key. Good enough for one process behind
// a reverse proxy; restart resets the counters.
import net from "node:net";

type Bucket = { hits: number[] };

export class RateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(
    private limit: number,
    private windowMs: number,
    private maxKeys = 50_000,
  ) {}

  /** Returns true when the call is allowed and records `cost` hits. */
  allow(key: string, cost = 1, now = Date.now()): boolean {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= this.maxKeys) {
        this.sweep(now);
        if (this.buckets.size >= this.maxKeys) {
          const oldest = this.buckets.keys().next().value;
          if (oldest !== undefined) this.buckets.delete(oldest);
        }
      }
      bucket = { hits: [] };
    }
    bucket.hits = bucket.hits.filter((t) => now - t < this.windowMs);
    if (bucket.hits.length + cost > this.limit) {
      this.buckets.set(key, bucket);
      return false;
    }
    for (let i = 0; i < cost; i++) bucket.hits.push(now);
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

/** Expand an IPv6 address into eight 16-bit hextets (numbers). */
function expandIPv6(addr: string): number[] {
  let a = addr.split("%")[0];
  const dot = a.lastIndexOf(".");
  if (dot !== -1) {
    const idx = a.lastIndexOf(":");
    const v4 = a.slice(idx + 1).split(".").map(Number);
    const hi = ((v4[0] << 8) | v4[1]).toString(16);
    const lo = ((v4[2] << 8) | v4[3]).toString(16);
    a = `${a.slice(0, idx + 1)}${hi}:${lo}`;
  }
  const [head, tail] = a.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined && tail ? tail.split(":") : [];
  const fill = a.includes("::") ? new Array(8 - h.length - t.length).fill("0") : [];
  return [...h, ...fill, ...t].map((x) => parseInt(x, 16));
}

/** Rate-limit key: /64 prefix for IPv6, the address for IPv4, "unknown" if empty. */
export function limiterKey(ip: string): string {
  if (!ip) return "unknown";
  if (net.isIPv4(ip)) return ip;
  if (net.isIPv6(ip)) {
    const g = expandIPv6(ip);
    if (g.length === 8 && g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
      return `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
    }
    return g.slice(0, 4).map((x) => x.toString(16)).join(":");
  }
  return ip;
}
