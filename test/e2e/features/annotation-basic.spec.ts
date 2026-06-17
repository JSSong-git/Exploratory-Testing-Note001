import { test, expect } from '../helpers/extension-helper';
import { clearSession, saveAnnotationThroughReview } from '../helpers/extension-helper';

test.beforeEach(async ({ sidepanel }) => {
  await clearSession(sidepanel);
});

test('adds bug annotation with title', async ({ sidepanel }) => {
  await saveAnnotationThroughReview(sidepanel, {
    title: 'Login button broken',
    description: 'Submit does nothing',
    type: 'bug',
  });
  await expect.poll(async () => {
    return sidepanel.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.bugs ?? 0),
    );
  }).toBe(1);
});

test('rejects save without title', async ({ sidepanel }) => {
  await expect(sidepanel.getByTestId('save-annotation')).toBeDisabled();
});

test('adds note and idea types', async ({ sidepanel }) => {
  await saveAnnotationThroughReview(sidepanel, { title: 'Observation', type: 'note' });
  await saveAnnotationThroughReview(sidepanel, { title: 'Try dark mode', type: 'idea' });

  await expect.poll(async () => {
    return sidepanel.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' }).then((r) => r?.data?.annotationsCount ?? 0),
    );
  }).toBe(2);
});
