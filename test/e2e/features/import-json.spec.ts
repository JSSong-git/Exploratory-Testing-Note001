import { test, expect } from '../helpers/extension-helper';
import { clearSession, saveAnnotationThroughReview } from '../helpers/extension-helper';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.beforeEach(async ({ sidepanel }) => {
  await clearSession(sidepanel);
});

test('imports JSON exported from the same extension', async ({ sidepanel }) => {
  await saveAnnotationThroughReview(sidepanel, {
    title: 'Round trip bug',
    description: 'Should survive import',
    type: 'bug',
  });

  const exportedJson = await sidepanel.evaluate(async () => {
    const res = await chrome.runtime.sendMessage({ type: 'GET_FULL_SESSION' });
    return JSON.stringify(res.data, null, 2);
  });

  await clearSession(sidepanel);

  const fixturesDir = path.join(__dirname, '../../fixtures');
  fs.mkdirSync(fixturesDir, { recursive: true });
  const tmpPath = path.join(fixturesDir, 'native-session-tmp.json');
  fs.writeFileSync(tmpPath, exportedJson);

  await sidepanel.getByTestId('more-menu-toggle').click();
  await sidepanel.getByTestId('import-json').click();
  await sidepanel.getByTestId('import-json-input').setInputFiles(tmpPath);

  await expect(sidepanel.getByTestId('session-count')).toHaveText('1건', { timeout: 10_000 });
  await sidepanel.getByTestId('nav-list').click();
  await expect(sidepanel.getByText('Round trip bug')).toBeVisible({ timeout: 10_000 });

  fs.unlinkSync(tmpPath);
});
