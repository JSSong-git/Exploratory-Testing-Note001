import type { CropCoordinates, Message, MessageResponse } from '@/lib/messaging/protocol';
import { ensureContentScript, getCapturableWebTab } from '@/lib/background/web-tab';

export async function captureFullWebTab(): Promise<string> {
  const webTab = await getCapturableWebTab();

  if (!webTab.id || webTab.windowId === undefined) {
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

export async function captureCrop(
  coords: CropCoordinates,
  windowId: number,
): Promise<string | null> {
  const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
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

export async function handleScreenshotMessage(
  message: Message,
  sender?: chrome.runtime.MessageSender,
): Promise<MessageResponse | null> {
  switch (message.type) {
    case 'INITIATE_CROP': {
      let tab: chrome.tabs.Tab;
      try {
        tab = await getCapturableWebTab();
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'No web page tab found for crop',
        };
      }

      if (!tab.id) {
        return { ok: false, error: 'No web page tab found for crop' };
      }

      // Bring the page forward first so the selection overlay is visible immediately.
      await chrome.tabs.update(tab.id, { active: true });
      if (tab.windowId !== undefined) {
        try {
          await chrome.windows.update(tab.windowId, { focused: true });
        } catch {
          // Some environments disallow focusing windows; crop can still proceed.
        }
      }

      try {
        await ensureContentScript(tab.id);
        await chrome.tabs.sendMessage(tab.id, {
          type: 'START_CROP',
          draft: message.payload,
        });
      } catch {
        return {
          ok: false,
          error: 'Could not reach the page. Reload the tab and try again.',
        };
      }

      return { ok: true };
    }
    case 'REQUEST_CROP_SCREENSHOT': {
      const windowId = sender?.tab?.windowId;
      if (windowId === undefined) {
        return { ok: false, error: 'No window context for area capture' };
      }

      try {
        const dataUrl = await captureCrop(message.payload.coordinates, windowId);
        if (!dataUrl) {
          return { ok: false, error: 'Area screenshot capture failed' };
        }
        return { ok: true, data: dataUrl };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Area screenshot capture failed',
        };
      }
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
