import { test, expect } from '../helpers/extension-helper';
import { clearSession } from '../helpers/extension-helper';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.beforeEach(async ({ sidepanel }) => {
  await clearSession(sidepanel);
});

test('stores many screenshots without inline base64 in session metadata', async ({ sidepanel }) => {
  for (let i = 0; i < 12; i++) {
    const result = await sidepanel.evaluate(
      async ({ index, imageDataUrl }) => {
        return chrome.runtime.sendMessage({
          type: 'ADD_ANNOTATION',
          payload: {
            annotationType: 'note',
            title: `Screenshot ${index}`,
            imageDataUrl,
          },
        });
      },
      { index: i, imageDataUrl: TINY_PNG },
    );
    expect(result.ok).toBe(true);
  }

  const snapshot = await sidepanel.evaluate(async () => {
    const summary = await chrome.runtime.sendMessage({ type: 'GET_SESSION_SUMMARY' });
    const storage = await chrome.storage.local.get('session');
    const serialized = JSON.stringify(storage);
    return {
      count: summary.data?.annotationsCount ?? 0,
      hasInlineImage: serialized.includes('data:image'),
      exportOk: (await chrome.runtime.sendMessage({ type: 'EXPORT_MARKDOWN' })).ok,
    };
  });

  expect(snapshot.count).toBe(12);
  expect(snapshot.hasInlineImage).toBe(false);
  expect(snapshot.exportOk).toBe(true);
});
