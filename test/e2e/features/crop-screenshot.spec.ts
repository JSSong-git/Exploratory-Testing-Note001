import { test, expect } from '../helpers/extension-helper';

test.beforeEach(async ({ popup }) => {
  await popup.evaluate(async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
  });
});

test('crop flow saves annotation through editor and save details dialog', async ({
  context,
  extensionId,
}) => {
  const contentPage = await context.newPage();
  await contentPage.goto('https://example.com');
  await contentPage.bringToFront();

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByTestId('popup-root').waitFor();

  await popup.getByTestId('annotation-title').fill('Cropped region');
  await popup.getByTestId('annotation-description').fill('Area selection test');
  await popup.getByTestId('screenshot-crop').click();

  await contentPage.bringToFront();
  await contentPage.waitForTimeout(300);

  await contentPage.mouse.move(120, 120);
  await contentPage.mouse.down();
  await contentPage.mouse.move(320, 280);
  await contentPage.mouse.up();

  await expect(contentPage.locator('#et-annotation-editor')).toBeAttached({ timeout: 15_000 });
  const editor = contentPage.frameLocator('#et-annotation-editor');
  await editor.locator('#save-btn').click();

  await expect(contentPage.locator('#et-save-details')).toBeAttached({ timeout: 15_000 });
  const saveDetails = contentPage.frameLocator('#et-save-details');
  await expect(saveDetails.getByTestId('save-details-title')).toHaveValue('Cropped region');
  await saveDetails.getByTestId('save-details-confirm').click();

  await expect(contentPage.locator('#et-save-details')).toBeHidden({ timeout: 15_000 });

  const verifyPage = await context.newPage();
  await verifyPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect.poll(async () => {
    return verifyPage.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(1);

  const session = await verifyPage.evaluate(async () => {
    const res = await chrome.runtime.sendMessage({ type: 'GET_FULL_SESSION' });
    return res?.data;
  });
  expect(session?.annotations?.[0]?.title).toBe('Cropped region');
  expect(session?.annotations?.[0]?.imageId).toBeTruthy();

  await contentPage.close();
  await verifyPage.close();
});
