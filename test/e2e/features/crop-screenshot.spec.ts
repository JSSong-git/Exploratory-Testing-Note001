import { test, expect } from '../helpers/extension-helper';
import { clearSession } from '../helpers/extension-helper';

test.beforeEach(async ({ sidepanel }) => {
  await clearSession(sidepanel);
});

test('crop flow saves annotation through editor and save details dialog', async ({
  context,
  extensionId,
}) => {
  const contentPage = await context.newPage();
  await contentPage.goto('https://example.com');
  await contentPage.bringToFront();

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await panel.getByTestId('sidepanel-root').waitFor();

  await panel.getByTestId('annotation-title').fill('Cropped region');
  await panel.getByTestId('annotation-description-input').fill('Area selection test');
  await panel.getByTestId('screenshot-crop').click();

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
  await verifyPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
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

  await verifyPage.getByTestId('nav-list').click();
  const annotationId = session?.annotations?.[0]?.id as string;
  await verifyPage.getByTestId(`annotation-item-${annotationId}`).click();
  await expect(verifyPage.getByTestId('annotation-detail-image')).toBeVisible({ timeout: 10_000 });

  await contentPage.close();
  await verifyPage.close();
});
