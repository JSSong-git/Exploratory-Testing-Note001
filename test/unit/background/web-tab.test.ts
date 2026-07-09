import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCapturableWebTab,
  isCapturableUrl,
  pickPreferredTab,
} from '@/lib/background/web-tab';

function tab(
  partial: Partial<chrome.tabs.Tab> & Pick<chrome.tabs.Tab, 'id' | 'windowId' | 'url'>,
): chrome.tabs.Tab {
  return {
    index: 0,
    pinned: false,
    highlighted: false,
    active: false,
    discarded: false,
    autoDiscardable: true,
    frozen: false,
    groupId: -1,
    selected: false,
    incognito: false,
    ...partial,
  } as chrome.tabs.Tab;
}

describe('isCapturableUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isCapturableUrl('https://example.com')).toBe(true);
    expect(isCapturableUrl('http://localhost:3000')).toBe(true);
  });

  it('rejects non-web URLs', () => {
    expect(isCapturableUrl('chrome://extensions')).toBe(false);
    expect(isCapturableUrl(undefined)).toBe(false);
  });
});

describe('pickPreferredTab', () => {
  it('picks the most recently accessed capturable tab', () => {
    const older = tab({ id: 1, windowId: 1, url: 'https://old.example', lastAccessed: 10 });
    const newer = tab({ id: 2, windowId: 1, url: 'https://new.example', lastAccessed: 99 });
    expect(pickPreferredTab([older, newer])).toEqual(newer);
  });
});

describe('getCapturableWebTab', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', {
      tabs: {
        query: vi.fn(),
      },
    });
  });

  it('returns the active capturable tab', async () => {
    const active = tab({ id: 1, windowId: 2, url: 'https://example.com', active: true });
    vi.mocked(chrome.tabs.query).mockResolvedValue([active]);

    await expect(getCapturableWebTab()).resolves.toEqual(active);
    expect(chrome.tabs.query).toHaveBeenCalledWith({
      active: true,
      lastFocusedWindow: true,
    });
  });

  it('falls back to the most recently accessed tab in the same window', async () => {
    const sidepanel = tab({
      id: 2,
      windowId: 1,
      url: 'chrome-extension://abc/sidepanel.html',
      active: true,
    });
    const older = tab({ id: 3, windowId: 1, url: 'https://old.example', lastAccessed: 1 });
    const newer = tab({ id: 4, windowId: 1, url: 'https://new.example', lastAccessed: 50 });

    vi.mocked(chrome.tabs.query).mockImplementation(async (query) => {
      if ('active' in query && query.active) {
        return [sidepanel];
      }
      if ('windowId' in query && query.windowId === 1) {
        return [sidepanel, older, newer];
      }
      return [];
    });

    await expect(getCapturableWebTab()).resolves.toEqual(newer);
  });

  it('throws when no capturable tab exists', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      tab({ id: 1, windowId: 2, url: 'chrome://newtab' }),
    ]);

    await expect(getCapturableWebTab()).rejects.toThrow(/capturable web page/i);
  });
});
