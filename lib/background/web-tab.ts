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
 * When the side panel (or another extension page) is focused, falls back to
 * another http(s) tab in the same window, then any capturable tab.
 */
export async function getCapturableWebTab(): Promise<chrome.tabs.Tab> {
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (isUsableTab(active)) {
    return active;
  }

  if (active?.windowId !== undefined) {
    const windowTabs = await chrome.tabs.query({ windowId: active.windowId });
    const preferred = pickPreferredTab(windowTabs);
    if (preferred) return preferred;
  }

  const allTabs = await chrome.tabs.query({});
  const fallback = pickPreferredTab(allTabs);
  if (fallback) return fallback;

  throw new Error('No capturable web page tab found. Open an http(s) page first.');
}
