export function isCapturableUrl(url: string | undefined): url is string {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}

function isUsableTab(tab: chrome.tabs.Tab | undefined): tab is chrome.tabs.Tab & {
  id: number;
  windowId: number;
  url: string;
} {
  return !!tab?.id && tab.windowId !== undefined && isCapturableUrl(tab.url);
}

/** Prefer the most recently accessed capturable tab when several exist. */
export function pickPreferredTab(tabs: chrome.tabs.Tab[]): chrome.tabs.Tab | undefined {
  const usable = tabs.filter(isUsableTab);
  if (usable.length === 0) return undefined;
  return [...usable].sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))[0];
}

/**
 * Returns the web page tab to capture or crop.
 * Side panel focus does not change the active tab, but when the focused
 * context is an extension page we fall back to capturable tabs in-window.
 */
export async function getCapturableWebTab(): Promise<chrome.tabs.Tab> {
  const [lastFocusedActive] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (isUsableTab(lastFocusedActive)) {
    return lastFocusedActive;
  }

  if (lastFocusedActive?.windowId !== undefined) {
    const windowTabs = await chrome.tabs.query({ windowId: lastFocusedActive.windowId });
    const preferred = pickPreferredTab(windowTabs);
    if (preferred) return preferred;
  }

  const activeTabs = await chrome.tabs.query({ active: true });
  const preferredActive = pickPreferredTab(activeTabs);
  if (preferredActive) return preferredActive;

  const allTabs = await chrome.tabs.query({});
  const fallback = pickPreferredTab(allTabs);
  if (fallback) return fallback;

  throw new Error('No capturable web page tab found. Open an http(s) page first.');
}

const CONTENT_SCRIPT_FILE = 'content-scripts/content.js';

/** Ensure the crop content script is present, injecting it if the tab was open before install/reload. */
export async function ensureContentScript(tabId: number): Promise<void> {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: 'PING_CROP' });
    if (res?.ok) return;
  } catch {
    // Not injected yet.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_SCRIPT_FILE],
  });
}
