import { test, expect } from '../helpers/extension-helper';
import { clearSession } from '../helpers/extension-helper';

test.beforeEach(async ({ sidepanel }) => {
  await clearSession(sidepanel);
});

test('full screenshot opens save details dialog and requires title', async ({ context, extensionId }) => {
  const content = await context.newPage();
  await content.goto('https://example.com');

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await panel.getByTestId('sidepanel-root').waitFor();

  await panel.getByTestId('screenshot-full').click();
  await expect(panel.getByTestId('save-details-dialog')).toBeVisible();
  await expect(panel.getByTestId('save-details-confirm')).toBeDisabled();

  await panel.getByTestId('save-details-title').fill('Captured screen');
  await expect(panel.getByTestId('save-details-confirm')).toBeEnabled();
  await panel.getByTestId('save-details-confirm').click();

  await expect.poll(async () => {
    return panel.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(1);
});
