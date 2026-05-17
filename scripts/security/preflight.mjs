import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

function hasAnyValue(values, keys) {
  return keys.some((key) => {
    const value = values[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

function printBucket(level, title, details = "") {
  const prefix = level === "error" ? "[ERROR]" : level === "warn" ? "[WARN]" : "[OK]";
  const line = details ? `${title} - ${details}` : title;
  console.log(`${prefix} ${line}`);
}

const env = parseEnvFile(envPath);
const errors = [];
const warnings = [];

const isLikelyProd = process.env.NODE_ENV === "production";
const hasSupabaseUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim());
const hasSupabasePublishable = hasAnyValue(env, [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]);
const hasSupabaseSecret = hasAnyValue(env, ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]);

if (!hasSupabaseUrl) {
  errors.push("Missing NEXT_PUBLIC_SUPABASE_URL.");
}
if (!hasSupabasePublishable) {
  errors.push("Missing Supabase public key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY).");
}
if (!hasSupabaseSecret) {
  errors.push("Missing Supabase server secret key (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY).");
}

if (env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY === "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI") {
  warnings.push("reCAPTCHA site key is Google test key. Replace it in production.");
}
if (env.RECAPTCHA_SECRET_KEY === "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe") {
  warnings.push("reCAPTCHA secret key is Google test key. Replace it in production.");
}

if (env.SUPABASE_SERVICE_ROLE_KEY?.startsWith("eyJ")) {
  warnings.push("Legacy JWT service role key detected. Prefer SUPABASE_SECRET_KEY (sb_secret_...) and plan migration.");
}

if (isLikelyProd && !env.ALLOWED_ORIGINS?.trim()) {
  warnings.push("ALLOWED_ORIGINS is empty. Set it in production to tighten origin checks.");
}

if (isLikelyProd && env.ENABLE_AUTH_BOOTSTRAP === "true") {
  errors.push("ENABLE_AUTH_BOOTSTRAP must not be true in production.");
}

const whitespaceSecrets = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMTP_PASS",
  "SPORTMONKS_API_TOKEN",
  "RECAPTCHA_SECRET_KEY",
].filter((key) => {
  const value = env[key];
  return typeof value === "string" && (value.startsWith(" ") || value.endsWith(" "));
});
if (whitespaceSecrets.length > 0) {
  warnings.push(`Secrets with leading/trailing whitespace: ${whitespaceSecrets.join(", ")}.`);
}

if (errors.length === 0) {
  printBucket("ok", "Core environment checks passed.");
}

for (const message of warnings) {
  printBucket("warn", message);
}
for (const message of errors) {
  printBucket("error", message);
}

if (errors.length > 0) {
  process.exitCode = 1;
}
