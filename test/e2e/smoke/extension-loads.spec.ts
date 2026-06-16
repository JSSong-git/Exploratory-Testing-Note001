import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '../../../.output/chrome-mv3');

let context: BrowserContext;
let userDataDir: string;

test.beforeAll(async () => {
  if (!fs.existsSync(extensionPath)) {
    throw new Error('Extension build not found. Run npm run build first.');
  }
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'et-ext-'));
  context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
});

test.afterAll(async () => {
  await context?.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});

test('extension loads and popup renders', async () => {
  const deadline = Date.now() + 30_000;
  let extensionId = '';

  while (Date.now() < deadline) {
    const workers = context.serviceWorkers();
    if (workers.length > 0) {
      extensionId = workers[0].url().split('/')[2];
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  expect(extensionId).toBeTruthy();

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.getByTestId('popup-root')).toBeVisible({ timeout: 10_000 });
  await expect(popup.getByTestId('annotation-title')).toBeVisible();
});
