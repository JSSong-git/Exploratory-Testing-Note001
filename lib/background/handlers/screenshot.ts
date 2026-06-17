import type { CropCoordinates, Message, MessageResponse } from '@/lib/messaging/protocol';

export async function captureFullWebTab(): Promise<string> {
  const tabs = await chrome.tabs.query({});
  const webTabs = tabs.filter(
    (tab) =>
      tab.id &&
      tab.windowId !== undefined &&
      tab.url &&
      (tab.url.startsWith('http://') || tab.url.startsWith('https://')),
  );
  const webTab = webTabs[webTabs.length - 1];

  if (!webTab?.id || webTab.windowId === undefined) {
    throw new Error('No web page tab found to capture');
  }

  const activeTabs = await chrome.tabs.query({ active: true, windowId: webTab.windowId });
  const previousTabId = activeTabs[0]?.id;

  if (webTab.id !== previousTabId) {
    await chrome.tabs.update(webTab.id, { active: true });
    await new Promise((r) => setTimeout(r, 150));
  }

  const dataUrl = await chrome.tabs.captureVisibleTab(webTab.windowId, { format: 'png' });

  if (previousTabId && previousTabId !== webTab.id) {
    await chrome.tabs.update(previousTabId, { active: true });
  }

  return dataUrl;
}

export async function captureCrop(coords: CropCoordinates): Promise<string | null> {
  const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
  if (!dataUrl) return null;

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(coords.width, coords.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(
    bitmap,
    coords.x,
    coords.y,
    coords.width,
    coords.height,
    0,
    0,
    coords.width,
    coords.height,
  );

  const cropped = await canvas.convertToBlob({ type: 'image/png' });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(cropped);
  });
}

export async function handleScreenshotMessage(message: Message): Promise<MessageResponse | null> {
  switch (message.type) {
    case 'INITIATE_CROP': {
      const tabs = await chrome.tabs.query({});
      const webTabs = tabs.filter(
        (t) =>
          t.id &&
          t.url &&
          (t.url.startsWith('http://') || t.url.startsWith('https://')),
      );
      const tab = webTabs[webTabs.length - 1];
      if (!tab?.id || !tab.url) {
        return { ok: false, error: 'No web page tab found for crop' };
      }
      await chrome.tabs.sendMessage(tab.id, {
        type: 'START_CROP',
        draft: message.payload,
      });
      await chrome.tabs.update(tab.id, { active: true });
      return { ok: true };
    }
    case 'REQUEST_CROP_SCREENSHOT': {
      const dataUrl = await captureCrop(message.payload.coordinates);
      return { ok: true, data: dataUrl };
    }
    case 'CAPTURE_FULL_SCREENSHOT': {
      try {
        const dataUrl = await captureFullWebTab();
        return { ok: true, data: dataUrl };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Capture failed' };
      }
    }
    default:
      return null;
  }
}
