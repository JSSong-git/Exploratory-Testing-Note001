import { test, expect } from '../helpers/extension-helper';

test.beforeEach(async ({ popup }) => {
  await popup.evaluate(async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
  });
});

test('report preview renders chart and annotation table', async ({ context, extensionId, popup }) => {
  await popup.getByTestId('type-tab-bug').click();
  await popup.getByTestId('annotation-title').fill('Report preview bug');
  await popup.getByTestId('save-annotation').click();

  await expect.poll(async () => {
    return popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(1);

  const report = await context.newPage();
  await report.goto(`chrome-extension://${extensionId}/report.html`);
  await expect(report.getByTestId('report-root')).toBeVisible({ timeout: 10_000 });
  await expect(report.getByTestId('report-chart')).toBeVisible();
  await expect(report.getByTestId('annotations-table')).toContainText('Report preview bug');
  await expect(report.locator('.recharts-bar-rectangle').first()).toBeVisible({ timeout: 10_000 });

  await popup.getByTestId('type-tab-note').click();
  await popup.getByTestId('annotation-title').fill('Report note item');
  await popup.getByTestId('save-annotation').click();

  await expect.poll(async () => {
    return popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(2);

  await report.reload();
  await expect(report.getByTestId('report-root')).toBeVisible();
  await report.getByTestId('report-filter-note').click();
  await report.getByTestId('report-search').fill('note item');
  await expect(report.getByTestId('annotations-table')).toContainText('Report note item');
  await expect(report.getByTestId('annotations-table')).not.toContainText('Report preview bug');

  await report.close();
});
