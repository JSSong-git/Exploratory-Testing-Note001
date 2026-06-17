import { test, expect } from '../helpers/extension-helper';
import { clearSession, saveAnnotationThroughReview } from '../helpers/extension-helper';

test.beforeEach(async ({ sidepanel }) => {
  await clearSession(sidepanel);
});

test('report preview renders chart and annotation table', async ({ context, extensionId, sidepanel }) => {
  await saveAnnotationThroughReview(sidepanel, { title: 'Report preview bug', type: 'bug' });
  await saveAnnotationThroughReview(sidepanel, { title: 'Report note item', type: 'note' });

  await expect.poll(async () => {
    return sidepanel.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(2);

  const report = await context.newPage();
  await report.goto(`chrome-extension://${extensionId}/report.html`);
  await expect(report.getByTestId('report-root')).toBeVisible({ timeout: 10_000 });
  await expect(report.getByTestId('report-chart')).toBeVisible();
  await expect(report.getByTestId('annotations-table')).toContainText('Report preview bug');
  await expect(report.locator('.recharts-bar-rectangle').first()).toBeVisible({ timeout: 10_000 });

  await report.getByTestId('report-filter-note').click();
  await report.getByTestId('report-search').fill('note item');
  await expect(report.getByTestId('annotations-table')).toContainText('Report note item');
  await expect(report.getByTestId('annotations-table')).not.toContainText('Report preview bug');

  await report.close();
});
