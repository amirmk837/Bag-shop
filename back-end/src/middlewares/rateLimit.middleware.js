const buckets = new Map();
const MAX_BUCKETS = 10000;

export const createRateLimiter = ({
  windowMs,
  max,
  message = "تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.",
} = {}) => {
  if (!Number.isSafeInteger(windowMs) || windowMs < 1000 ||
      !Number.isSafeInteger(max) || max < 1) {
    throw new Error("تنظیمات محدودکننده درخواست معتبر نیست.");
  }

  const limiterKey = `${windowMs}:${max}`;

  return (req, res, next) => {
    const now = Date.now();
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${limiterKey}:${clientIp}`;
    let bucket = buckets.get(key);

    if (!bucket || now - bucket.startedAt >= windowMs) {
      bucket = { startedAt: now, count: 0 };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (buckets.size > MAX_BUCKETS) {
      for (const [entryKey, entry] of buckets) {
        if (now - entry.startedAt >= windowMs) buckets.delete(entryKey);
        if (buckets.size <= MAX_BUCKETS * 0.8) break;
      }
    }

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil((bucket.startedAt + windowMs) / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.startedAt + windowMs - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ success: false, message });
    }

    return next();
  };
};
