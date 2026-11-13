// @ts-check
import pkg from '@prisma/client';

// Default import + destructure: @prisma/client is CJS, so this works in Node ESM and bundlers.
const { PrismaClient, Prisma, MemberRole, Plan, VideoStatus } = pkg;

const globalForPrisma = /** @type {any} */ (globalThis);

/** @type {import('@prisma/client').PrismaClient} */
export const prisma =
  globalForPrisma.__tubepilotPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Reuse the client across hot reloads in dev.
if (process.env.NODE_ENV !== 'production') globalForPrisma.__tubepilotPrisma = prisma;

export { PrismaClient, Prisma, MemberRole, Plan, VideoStatus };

/**
 * One-shot DB health probe with a timeout.
 * @param {number} [timeoutMs]
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string }>}
 */
export async function checkDatabase(timeoutMs = 2000) {
  const started = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - started, error: /** @type {Error} */ (err).message };
  }
}
