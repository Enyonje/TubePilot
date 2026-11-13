// @ts-check
import { z } from 'zod';

const startsWithAny = (prefixes) => (v) => prefixes.some((p) => v.startsWith(p));

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z
    .string()
    .url()
    .refine(startsWithAny(['postgres://', 'postgresql://']), 'must be a postgres:// URL'),
  REDIS_URL: z
    .string()
    .url()
    .refine(startsWithAny(['redis://', 'rediss://']), 'must be a redis:// or rediss:// URL'),

  AUTH_SECRET: z.string().min(32, 'must be at least 32 characters (openssl rand -base64 48)'),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'must be 64 hex characters (openssl rand -hex 32)'),
});

export class EnvValidationError extends Error {
  /** @param {string[]} issues */
  constructor(issues) {
    super(`Invalid environment configuration:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

/**
 * Validate an env source. Throws EnvValidationError listing every problem at once.
 * @param {Record<string, string | undefined>} [source]
 */
export function parseEnv(source = process.env) {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    );
  }
  return result.data;
}

/** @type {z.infer<typeof serverEnvSchema> | undefined} */
let cached;

/** Lazily validated, cached env. Never imported at build time, so `next build` needs no secrets. */
export function getEnv() {
  cached ??= parseEnv();
  return cached;
}
