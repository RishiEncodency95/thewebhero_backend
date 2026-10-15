import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  // Public base URL of this API, used to build links to locally stored uploads.
  PUBLIC_API_URL: z.string().optional(),
  ADMIN_URL: z.string().default("http://localhost:3001"),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  // Shared with the website's /api/revalidate route so admin edits go live instantly.
  REVALIDATE_SECRET: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().min(16, "REVALIDATE_SECRET must be at least 16 chars").optional()),

  JWT_ACCESS_SECRET: z.string().min(10, "JWT_ACCESS_SECRET must be at least 10 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET must be at least 10 chars"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("TheWebHero <no-reply@thewebhero.com>"),
  // Where new lead alerts are emailed. Falls back to Settings > contactEmail.
  LEADS_NOTIFY_EMAIL: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().email().optional()),

  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("thewebhero"),

  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),

  SEED_ADMIN_EMAIL: z.string().email().default("admin@thewebhero.com"),
  SEED_ADMIN_PASSWORD: z.string().min(6).default("ChangeMe@123"),
  SEED_ADMIN_NAME: z.string().default("Super Admin"),
  // Extra admin users: "email|password|Name|role" separated by ";" (role defaults to super-admin).
  SEED_USERS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
