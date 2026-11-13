import { describe, it, expect } from 'vitest';
import { parseEnv, EnvValidationError } from '../src/index.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db?schema=public',
  REDIS_URL: 'redis://localhost:6379',
  AUTH_SECRET: 'a'.repeat(32),
  ENCRYPTION_KEY: 'ab'.repeat(32),
};

describe('parseEnv', () => {
  it('accepts a valid config and applies defaults', () => {
    const env = parseEnv(valid);
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.APP_URL).toBe('http://localhost:3000');
  });

  it('reports every problem at once', () => {
    try {
      parseEnv({});
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(EnvValidationError);
      expect(e.issues.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('rejects a short ENCRYPTION_KEY', () => {
    expect(() => parseEnv({ ...valid, ENCRYPTION_KEY: 'abc' })).toThrow(EnvValidationError);
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'mysql://u:p@h/db' })).toThrow(
      EnvValidationError,
    );
  });
});
