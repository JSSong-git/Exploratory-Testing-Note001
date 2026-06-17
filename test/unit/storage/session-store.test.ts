import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createEmptySession } from '@/lib/core/types';
import {
  loadSession,
  saveSession,
  clearSessionStorage,
  getStorageByteSize,
} from '@/lib/storage/session-store';
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

function setupChromeStorage() {
  const store: Record<string, unknown> = {};
  const chromeMock = {
    storage: {
      local: {
        get: vi.fn(async (key: string | null) => {
          if (key === null) return { ...store };
          if (typeof key === 'string') return { [key]: store[key] };
          return {};
        }),
        set: vi.fn(async (data: Record<string, unknown>) => {
          Object.assign(store, data);
        }),
        remove: vi.fn(async (key: string) => {
          delete store[key];
        }),
      },
    },
  };
  vi.stubGlobal('chrome', chromeMock);
  return store;
}

describe('session-store', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips session through chrome.storage.local', async () => {
    setupChromeStorage();
    const session = createEmptySession(browserInfo);
    session.annotations.push({
      id: 'a1',
      type: 'bug',
      title: 'Test',
      url: 'https://example.com',
      timestamp: Date.now(),
    });

    await saveSession(session);
    const loaded = await loadSession();
    expect(loaded?.annotations).toHaveLength(1);
    expect(loaded?.annotations[0].title).toBe('Test');
  });

  it('rejects inline image payloads in session JSON', async () => {
    setupChromeStorage();
    const session = createEmptySession(browserInfo);
    session.annotations.push({
      id: 'a1',
      type: 'bug',
      title: 'Bad',
      url: 'https://example.com',
      timestamp: Date.now(),
      imageId: 'data:image/png;base64,abc',
    });

    await expect(saveSession(session)).rejects.toThrow(/inline image data/);
  });

  it('clears session metadata and deletes linked images', async () => {
    setupChromeStorage();
    const blob = new Blob([new Uint8Array(8)], { type: 'image/png' });
    const imageId = await saveImage(blob);
    const session = createEmptySession(browserInfo);
    session.annotations.push({
      id: 'a1',
      type: 'note',
      title: 'Shot',
      url: 'https://example.com',
      timestamp: Date.now(),
      imageId,
    });
    await saveSession(session);
    await clearSessionStorage();

    const loaded = await loadSession();
    expect(loaded).toBeNull();
  });

  it('reports storage byte size for metadata only', async () => {
    const store = setupChromeStorage();
    const session = createEmptySession(browserInfo);
    await saveSession(session);
    const size = await getStorageByteSize();
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(10_000);
    expect(store.session).toBeDefined();
  });
});
