import { test, expect } from '../helpers/extension-helper';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const legacyJson = JSON.stringify({
  StartDateTime: 1_700_000_000_000,
  BrowserInfo: { browser: 'Chrome', browserVersion: '120', os: 'Windows', cookies: true },
  annotations: [
    {
      type: 'Bug',
      name: 'Imported bug',
      url: 'https://example.com',
      timestamp: 1_700_000_100_000,
      imageURL: null,
    },
  ],
});

test('imports legacy JSON session', async ({ sidepanel }) => {
  const fixturesDir = path.join(__dirname, '../../fixtures');
  fs.mkdirSync(fixturesDir, { recursive: true });
  const tmpPath = path.join(fixturesDir, 'legacy-session-tmp.json');
  fs.writeFileSync(tmpPath, legacyJson);

  await sidepanel.getByTestId('import-json').click();
  await sidepanel.getByTestId('import-json-input').setInputFiles(tmpPath);
  await expect(sidepanel.getByTestId('session-count')).toHaveText('1 items', { timeout: 10_000 });

  fs.unlinkSync(tmpPath);
});
