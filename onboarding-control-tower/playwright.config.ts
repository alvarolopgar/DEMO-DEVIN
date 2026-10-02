import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const PRISMA_DIR = resolve(import.meta.dirname, 'apps/api/prisma');
const SEEDED_PORT = 3100;
const EMPTY_PORT = 3101;

const server = (port: number, db: string, prepare: 'db:reset' | 'db:empty') => ({
  command: `npm run ${prepare} -w apps/api && npm run start -w apps/api`,
  url: `http://127.0.0.1:${port}/api/health`,
  reuseExistingServer: false,
  timeout: 180_000,
  env: { PORT: String(port), DATABASE_URL: `file:${resolve(PRISMA_DIR, db)}`, LOG_LEVEL: 'warn' },
});

/** AC ejecutables (PLAN-001 §13): seed determinista en :3100 y base vacía en :3101 (AC-001-09). */
export default defineConfig({
  testDir: 'tests/acceptance',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${SEEDED_PORT}`,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: [server(SEEDED_PORT, 'e2e.db', 'db:reset'), server(EMPTY_PORT, 'e2e-empty.db', 'db:empty')],
});
