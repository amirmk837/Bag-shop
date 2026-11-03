import { createHmac } from "node:crypto";
import prisma from "../config/prisma.js";
import { config } from "../config/env.js";

let cleanupCounter = 0;
const CLEANUP_EVERY = 1000;

const hashClientIp = (ip) =>
  createHmac("sha256", config.JWT_SECRET).update(ip).digest("hex");

export const createRateLimiter = ({
  windowMs,
  max,
  name = "default",
  message = "تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.",
} = {}) => {
  if (
    !Number.isSafeInteger(windowMs) ||
    windowMs < 1000 ||
    !Number.isSafeInteger(max) ||
    max < 1 ||
    typeof name !== "string" ||
    !/^[a-zA-Z0-9:_-]{1,80}$/.test(name)
  ) {
    throw new Error("تنظیمات محدودکننده درخواست معتبر نیست.");
  }

  const limiterKey = `${name}:${windowMs}:${max}`;

  return async (req, res, next) => {
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${limiterKey}:${hashClientIp(clientIp)}`;

    try {
      // A single atomic PostgreSQL statement guarantees consistent counters
      // when multiple Node.js instances receive requests concurrently.
      const [bucket] = await prisma.$queryRaw`
        INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt", "updatedAt")
        VALUES (
          ${key},
          1,
          NOW() + (${windowMs} * INTERVAL '1 millisecond'),
          NOW()
        )
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE
            WHEN "RateLimitBucket"."expiresAt" <= NOW() THEN 1
            ELSE "RateLimitBucket"."count" + 1
          END,
          "expiresAt" = CASE
            WHEN "RateLimitBucket"."expiresAt" <= NOW()
              THEN NOW() + (${windowMs} * INTERVAL '1 millisecond')
            ELSE "RateLimitBucket"."expiresAt"
          END,
          "updatedAt" = NOW()
        RETURNING "count", "expiresAt"
      `;

      cleanupCounter += 1;
      if (cleanupCounter >= CLEANUP_EVERY) {
        cleanupCounter = 0;
        // Cleanup is best-effort; it must not delay or change the current decision.
        void prisma.$executeRaw`
          DELETE FROM "RateLimitBucket"
          WHERE "expiresAt" < NOW() - INTERVAL '1 day'
        `.catch((error) => {
          console.error("Rate-limit bucket cleanup failed:", error?.name || "Error");
        });
      }

      const count = Number(bucket.count);
      const expiresAt = new Date(bucket.expiresAt);
      const remainingSeconds = Math.max(
        1,
        Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
      );

      res.setHeader("RateLimit-Limit", String(max));
      res.setHeader("RateLimit-Remaining", String(Math.max(0, max - count)));
      res.setHeader("RateLimit-Reset", String(Math.ceil(expiresAt.getTime() / 1000)));

      if (count > max) {
        res.setHeader("Retry-After", String(remainingSeconds));
        return res.status(429).json({ success: false, message });
      }

      return next();
    } catch (error) {
      // Fail closed: if shared storage is unavailable, do not bypass protection.
      console.error("Shared rate limiter unavailable:", error?.name || "Error");
      return res.status(503).json({
        success: false,
        message: "سامانه امنیتی موقتاً در دسترس نیست؛ کمی بعد دوباره تلاش کنید.",
      });
    }
  };
};
