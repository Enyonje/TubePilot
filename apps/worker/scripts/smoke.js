// Enqueues a ping job and waits for the running worker to answer it.
// Proves: env -> Redis -> BullMQ -> worker process, end to end.
import { Queue, QueueEvents } from 'bullmq';
import { getEnv } from '@tubepilot/config';
import { createRedis, QUEUES } from '@tubepilot/shared';

const env = getEnv();
const connection = createRedis(env.REDIS_URL);
const queue = new Queue(QUEUES.SYSTEM, { connection });
const events = new QueueEvents(QUEUES.SYSTEM, { connection: createRedis(env.REDIS_URL) });

try {
  await events.waitUntilReady();
  const job = await queue.add('ping', {}, { removeOnComplete: true, removeOnFail: true });
  const result = await job.waitUntilFinished(events, 10_000);
  console.log('worker replied:', result);
} catch (err) {
  console.error('smoke test failed (is `pnpm dev` running?):', err.message);
  process.exitCode = 1;
} finally {
  await queue.close();
  await events.close();
  await connection.quit();
}
