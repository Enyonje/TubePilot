import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load the single root .env so web and worker share one config source.
const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@tubepilot/ai', '@tubepilot/media', '@tubepilot/auth', '@tubepilot/pipeline', '@tubepilot/research', '@tubepilot/config', '@tubepilot/database', '@tubepilot/shared', '@tubepilot/youtube'],
  // BullMQ optionally imports Valkey Glide, which we do not use: stop webpack warning about it.
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, '@valkey/valkey-glide': false };
    return config;
  },
  serverExternalPackages: ['@prisma/client', 'ioredis', 'pino', 'bullmq'],
};

export default nextConfig;
