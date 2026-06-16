import { test, expect } from '../helpers/extension-helper';

test.beforeEach(async ({ popup }) => {
  await popup.evaluate(async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
  });
});

test('adds bug annotation with title', async ({ popup }) => {
  await popup.getByTestId('type-tab-bug').click();
  await popup.getByTestId('annotation-title').fill('Login button broken');
  await popup.getByTestId('annotation-description').fill('Submit does nothing');
  await popup.getByTestId('save-annotation').click();
  await expect.poll(async () => {
    return popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(1);
});

test('rejects save without title', async ({ popup }) => {
  await expect(popup.getByTestId('save-annotation')).toBeDisabled();
});

test('adds note and idea types', async ({ popup }) => {
  await popup.getByTestId('type-tab-note').click();
  await popup.getByTestId('annotation-title').fill('Observation');
  await popup.getByTestId('save-annotation').click();

  await popup.getByTestId('type-tab-idea').click();
  await popup.getByTestId('annotation-title').fill('Try dark mode');
  await popup.getByTestId('save-annotation').click();

  await expect.poll(async () => {
    return popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(2);
});
