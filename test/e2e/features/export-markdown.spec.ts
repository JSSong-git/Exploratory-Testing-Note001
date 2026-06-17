import { test, expect } from '../helpers/extension-helper';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.beforeEach(async ({ popup }) => {
  await expect
    .poll(async () => {
      try {
        await popup.evaluate(async () => {
          await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
        });
        return true;
      } catch {
        return false;
      }
    })
    .toBe(true);
});

test('exports markdown when session has annotations', async ({ popup }) => {
  await popup.getByTestId('annotation-title').fill('Export me');
  await popup.getByTestId('save-annotation').click();

  await expect.poll(async () => {
    return popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(1);

  const exportResult = await popup.evaluate(async () => {
    return chrome.runtime.sendMessage({ type: 'EXPORT_MARKDOWN' });
  });
  expect(exportResult.ok).toBe(true);
});

test('export menu lists markdown as default option', async ({ popup }) => {
  await popup.getByTestId('export-menu-toggle').click();
  await expect(popup.getByTestId('export-menu')).toBeVisible();
  await expect(popup.getByTestId('export-markdown')).toContainText('Markdown');
  await expect(popup.getByTestId('export-json')).toBeVisible();
  await expect(popup.getByTestId('export-csv')).toBeVisible();
  await expect(popup.getByTestId('export-html')).toBeVisible();
});
