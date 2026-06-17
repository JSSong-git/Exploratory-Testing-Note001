import { test, expect } from '../helpers/extension-helper';
import { clearSession, saveAnnotationThroughReview } from '../helpers/extension-helper';

test.beforeEach(async ({ sidepanel }) => {
  await clearSession(sidepanel);
});

test('exports markdown when session has annotations', async ({ sidepanel }) => {
  await saveAnnotationThroughReview(sidepanel, {
    title: 'Export me',
    description: '**bold** note',
  });

  await expect.poll(async () => {
    return sidepanel.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(1);

  const exportResult = await sidepanel.evaluate(async () => {
    return chrome.runtime.sendMessage({ type: 'EXPORT_MARKDOWN' });
  });
  expect(exportResult?.ok).toBe(true);
});

test('export menu lists markdown as default option', async ({ sidepanel }) => {
  await sidepanel.getByTestId('export-menu-toggle').click();
  await expect(sidepanel.getByTestId('export-menu')).toBeVisible();
  await expect(sidepanel.getByTestId('export-markdown')).toContainText('Markdown');
  await expect(sidepanel.getByTestId('export-json')).toBeVisible();
  await expect(sidepanel.getByTestId('export-csv')).toBeVisible();
  await expect(sidepanel.getByTestId('export-html')).toBeVisible();
});
