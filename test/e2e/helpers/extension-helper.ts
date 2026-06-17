import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import type { AnnotationType } from '@/lib/core/types';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const extensionPath = path.resolve(__dirname, '../../../.output/chrome-mv3');

type Fixtures = {
  context: BrowserContext;
  extensionId: string;
  sidepanel: Page;
  /** @deprecated use sidepanel */
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
  sidepanel: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    await page.getByTestId('sidepanel-root').waitFor();
    await use(page);
  },
  popup: async ({ sidepanel }, use) => {
    await use(sidepanel);
  },
});

export { expect } from '@playwright/test';

export async function clearSession(page: Page) {
  await page.evaluate(async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
  });
}

export async function saveAnnotationThroughReview(
  page: Page,
  options: { title: string; description?: string; type?: AnnotationType },
) {
  await page.getByTestId('nav-compose').click();
  if (options.type) {
    await page.getByTestId(`type-tab-${options.type}`).click();
  }
  await page.getByTestId('annotation-title').fill(options.title);
  if (options.description) {
    await page.getByTestId('annotation-description-input').fill(options.description);
  }
  await page.getByTestId('save-annotation').click();
  await page.getByTestId('review-confirm').click();
  await page.getByTestId('annotation-list').waitFor({ timeout: 10_000 });
}

export async function clearExtensionStorage(extensionId: string) {
  const page = await chromium.launch().then(async (b) => {
    const p = await b.newPage();
    await p.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    return { page: p, browser: b };
  });
  try {
    await page.page.evaluate(() => chrome.storage.local.clear());
  } finally {
    await page.browser.close();
  }
}
