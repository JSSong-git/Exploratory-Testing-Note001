import { test, expect } from '../helpers/extension-helper';

test.beforeEach(async ({ popup }) => {
  await popup.evaluate(async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
  });
});

test('full screenshot opens save details dialog and requires title', async ({
  context,
  extensionId,
}) => {
  const contentPage = await context.newPage();
  await contentPage.goto('https://example.com');

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByTestId('popup-root').waitFor();

  await popup.getByTestId('screenshot-full').click();
  await expect(popup.getByTestId('save-details-dialog')).toBeVisible();
  await expect(popup.getByTestId('save-details-confirm')).toBeDisabled();

  await popup.getByTestId('save-details-title').fill('Captured screen');
  await expect(popup.getByTestId('save-details-confirm')).toBeEnabled();
  await popup.getByTestId('save-details-confirm').click();

  await expect.poll(async () => {
    return popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(1);

  await contentPage.close();
});
