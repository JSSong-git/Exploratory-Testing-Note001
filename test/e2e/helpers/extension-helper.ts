import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const extensionPath = path.resolve(__dirname, '../../../.output/chrome-mv3');

type Fixtures = {
  context: BrowserContext;
  extensionId: string;
  popup: Page;
};

export const test = base.extend<Fixtures>({
  context: async ({}, use) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'et-ext-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },
  extensionId: async ({ context }, use) => {
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
    if (!extensionId) throw new Error('Extension service worker not found');
    await use(extensionId);
  },
  popup: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.getByTestId('popup-root').waitFor();
    await use(page);
  },
});

export { expect } from '@playwright/test';

export async function clearExtensionStorage(extensionId: string) {
  const page = await chromium.launch().then(async (b) => {
    const p = await b.newPage();
    await p.goto(`chrome-extension://${extensionId}/popup.html`);
    return { page: p, browser: b };
  });
  try {
    await page.page.evaluate(() => chrome.storage.local.clear());
  } finally {
    await page.browser.close();
  }
}
