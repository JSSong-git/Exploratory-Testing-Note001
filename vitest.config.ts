import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup/vitest.setup.ts'],
    include: ['test/unit/**/*.test.ts', 'test/integration/**/*.test.ts', 'test/component/**/*.test.tsx'],
  },
});
