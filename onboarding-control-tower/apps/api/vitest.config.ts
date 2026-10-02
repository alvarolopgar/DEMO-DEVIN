import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'api',
          include: ['test/api/**/*.test.ts', 'test/contract/**/*.test.ts', 'test/security/**/*.test.ts'],
          env: { DATABASE_URL: 'file:' + resolve(import.meta.dirname, 'prisma/test.db') },
          globalSetup: ['test/global-setup.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
});
