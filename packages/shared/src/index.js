// @ts-check
import pino from 'pino';
import { Redis } from 'ioredis';

/**
 * Structured JSON logger with secret redaction.
 * @param {{ name: string, level?: string }} opts
 */
export function createLogger({ name, level = 'info' }) {
  return pino({
    name,
    level,
    redact: {
      paths: [
        '*.password',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
        '*.apiKey',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[redacted]',
    },
  });
}

/**
 * Redis connection configured for BullMQ (maxRetriesPerRequest must be null).
 * @param {string} url
 * @param {import('ioredis').RedisOptions} [opts]
 */
export function createRedis(url, opts = {}) {
  return new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: true, ...opts });
}

/**
 * One-shot Redis health probe with a hard timeout.
 * @param {string} url
 * @param {number} [timeoutMs]
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string }>}
 */
export async function checkRedis(url, timeoutMs = 2000) {
  const started = Date.now();
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    connectTimeout: timeoutMs,
    retryStrategy: () => null,
  });
  client.on('error', () => {});
  try {
    await client.connect();
    await Promise.race([
      client.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - started, error: /** @type {Error} */ (err).message };
  } finally {
    client.disconnect();
  }
}

/** Queue names. Add one per worker domain in later modules. */
export const QUEUES = Object.freeze({
  SYSTEM: 'system',
});
