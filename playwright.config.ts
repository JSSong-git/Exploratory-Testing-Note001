import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  workers: 1,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
  },
});
