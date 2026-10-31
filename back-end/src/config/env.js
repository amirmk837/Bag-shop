import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return value;
  },
  z.boolean(),
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters."),
  DATABASE_URL: z.string().url().refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "DATABASE_URL must be a PostgreSQL connection URL.",
  ),
  FRONTEND_ORIGINS: z.string().min(1),
  TRUST_PROXY: booleanFromEnv.default(false),
  ZARINPAL_SANDBOX: booleanFromEnv.default(false),
  PAYMENT_CALLBACK_URL: z.string().trim().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid server environment configuration:\n${issues.join("\n")}`);
}

const env = parsed.data;

if (env.PAYMENT_CALLBACK_URL) {
  let callbackUrl;
  try {
    callbackUrl = new URL(env.PAYMENT_CALLBACK_URL);
  } catch {
    throw new Error("PAYMENT_CALLBACK_URL must be a valid absolute URL.");
  }

  const isLocalhost =
    callbackUrl.hostname === "localhost" ||
    callbackUrl.hostname === "127.0.0.1";

  const isAllowedLocalSandbox =
    env.ZARINPAL_SANDBOX && isLocalhost && callbackUrl.protocol === "http:";

  if (
    callbackUrl.username ||
    callbackUrl.password ||
    callbackUrl.hash ||
    (callbackUrl.protocol !== "https:" && !isAllowedLocalSandbox)
  ) {
    throw new Error("PAYMENT_CALLBACK_URL must use HTTPS (HTTP is allowed only for localhost sandbox).");
  }
}

if (env.NODE_ENV === "production" && env.ZARINPAL_SANDBOX) {
  throw new Error("ZARINPAL_SANDBOX must be disabled in production.");
}

const origins = env.FRONTEND_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
if (origins.length === 0) throw new Error("FRONTEND_ORIGINS must contain at least one origin.");

for (const origin of origins) {
  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new Error("FRONTEND_ORIGINS contains an invalid URL origin.");
  }

  if (
    parsedOrigin.origin !== origin ||
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error("Each FRONTEND_ORIGINS entry must be an origin only, without path, query, or fragment.");
  }

  if (env.NODE_ENV === "production" && parsedOrigin.protocol !== "https:") {
    throw new Error("Every FRONTEND_ORIGINS entry must use HTTPS in production.");
  }
}

export const config = Object.freeze({
  ...env,
  FRONTEND_ORIGINS: Object.freeze(origins),
});
