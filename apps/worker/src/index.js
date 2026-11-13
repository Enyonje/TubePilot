// @ts-check
import { Worker } from 'bullmq';
import { getEnv, EnvValidationError } from '@tubepilot/config';
import { prisma, checkDatabase } from '@tubepilot/database';
import { createLogger, createRedis, QUEUES } from '@tubepilot/shared';
import { registerMediaWorker } from '@tubepilot/media';
import { registerPipelineWorkers } from '@tubepilot/pipeline';
import { registerResearchWorker } from '@tubepilot/research';
import { registerYouTubeWorker } from '@tubepilot/youtube';

let env;
try {
  env = getEnv();
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}

const log = createLogger({ name: 'worker', level: env.LOG_LEVEL });
const connection = createRedis(env.REDIS_URL);

/** @type {Worker[]} */
const workers = [];
/** @type {Array<{ close: () => Promise<unknown> }>} */
const closables = [];

async function main() {
  const db = await checkDatabase(5000);
  if (!db.ok) throw new Error(`Database unreachable: ${db.error}`);
  await connection.ping();
  log.info('dependencies healthy');

  const system = new Worker(
    QUEUES.SYSTEM,
    async (job) => {
      if (job.name === 'ping') return { pong: true, at: new Date().toISOString() };
      throw new Error(`Unknown job: ${job.name}`);
    },
    { connection, concurrency: 5 },
  );
  system.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'job failed'));
  system.on('error', (err) => log.error({ err: err.message }, 'worker error'));
  workers.push(system);

  const pipeline = await registerPipelineWorkers({ env, connection, logger: log });
  workers.push(...pipeline.workers);
  closables.push(...pipeline.queues);

  const media = await registerMediaWorker({ env, connection, logger: log });
  if (media) {
    workers.push(media.worker);
    log.info('media worker ready');
  }

  const research = await registerResearchWorker({ env, connection, logger: log });
  if (research) {
    workers.push(research.worker);
    closables.push(research.queue);
    log.info('research worker ready');
  }

  if (env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET) {
    const yt = await registerYouTubeWorker({ env, connection, logger: log });
    workers.push(yt.worker);
    closables.push(yt.queue);
    log.info({ cron: env.YOUTUBE_SYNC_CRON }, 'youtube worker ready');
  } else {
    log.info('YOUTUBE_CLIENT_ID not set; youtube worker not started');
  }

  log.info({ queues: [QUEUES.SYSTEM] }, 'worker ready');
}

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info({ signal }, 'shutting down');
  try {
    await Promise.all([...workers, ...closables].map((w) => w.close()));
    await connection.quit();
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((err) => {
  log.fatal({ err: err.message }, 'worker failed to start');
  process.exit(1);
});
