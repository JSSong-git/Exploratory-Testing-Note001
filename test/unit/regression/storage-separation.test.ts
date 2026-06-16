import { describe, expect, it, vi } from 'vitest';
import { createEmptySession } from '@/lib/core/types';
import { saveSession } from '@/lib/storage/session-store';
import { saveImage } from '@/lib/storage/image-store';

const browserInfo = {
  brand: 'Chrome',
  browserVersion: '1',
  os: 'Win',
  osVersion: '',
  cookies: true,
  language: 'en',
  timezone: 'UTC',
  screenResolution: '1920x1080',
};

describe('storage separation regression', () => {
  it('session JSON in chrome.storage does not embed base64 images', async () => {
    const session = createEmptySession(browserInfo);
    const blob = new Blob([new Uint8Array(1024)], { type: 'image/png' });
    const imageId = await saveImage(blob);
    session.annotations.push({
      id: 'a1',
      type: 'bug',
      title: 'Shot',
      url: 'https://example.com',
      timestamp: Date.now(),
      imageId,
    });

    const setMock = vi.fn();
    const chromeMock = {
      storage: {
        local: {
          set: setMock,
          get: vi.fn(),
          remove: vi.fn(),
        },
      },
    };
    vi.stubGlobal('chrome', chromeMock);

    await saveSession(session);
    const payload = setMock.mock.calls[0][0].session;
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('data:image');
    expect(serialized).not.toContain('imageURL');
    expect(payload.annotations[0].imageId).toBe(imageId);

    vi.unstubAllGlobals();
  });
});
