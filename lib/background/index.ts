import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import type { CropCoordinates } from '@/lib/messaging/protocol';
import {
  addAnnotation,
  clearSession,
  deleteAnnotation,
  getSession,
  getSessionSummary,
  initSession,
  replaceSession,
  updateAnnotation,
} from '@/lib/services/session-service';
import { buildCsv, buildJson, buildMarkdownZip } from '@/lib/export/markdown';
import { buildStandaloneHtml } from '@/lib/export/html';
import { downloadBlob, downloadText, sessionFilename } from '@/lib/export/download';
import { importLegacySession } from '@/lib/export/legacy-import';
import { notifyAnnotationSaved } from '@/lib/background/notify';

export async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case 'ADD_ANNOTATION': {
      if (!message.payload.title.trim()) {
        return { ok: false, error: 'Title is required' };
      }
      await addAnnotation(message.payload);
      await notifyAnnotationSaved(message.payload.annotationType, message.payload.title);
      return { ok: true };
    }
    case 'UPDATE_ANNOTATION': {
      await updateAnnotation(
        message.payload.id,
        message.payload.title,
        message.payload.description,
      );
      return { ok: true };
    }
    case 'DELETE_ANNOTATION': {
      await deleteAnnotation(message.payload.id);
      return { ok: true };
    }
    case 'GET_SESSION_SUMMARY':
      return { ok: true, data: getSessionSummary() };
    case 'GET_FULL_SESSION': {
      const session = getSession();
      return { ok: true, data: session };
    }
    case 'CLEAR_SESSION': {
      await clearSession();
      return { ok: true };
    }
    case 'EXPORT_MARKDOWN': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      const zip = await buildMarkdownZip(session);
      await downloadBlob(zip, sessionFilename(session, 'zip'));
      return { ok: true };
    }
    case 'EXPORT_JSON': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      await downloadText(buildJson(session), sessionFilename(session, 'json'), 'application/json');
      return { ok: true };
    }
    case 'EXPORT_CSV': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      await downloadText(buildCsv(session), sessionFilename(session, 'csv'), 'text/csv');
      return { ok: true };
    }
    case 'EXPORT_HTML': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      const html = await buildStandaloneHtml(session);
      await downloadText(html, sessionFilename(session, 'html'), 'text/html');
      return { ok: true };
    }
    case 'IMPORT_JSON': {
      try {
        const session = await importLegacySession(message.payload.json);
        await replaceSession(session);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Invalid session JSON' };
      }
    }
    case 'INITIATE_CROP': {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id || !tab.url) {
        return { ok: false, error: 'No active tab' };
      }
      if (
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('chrome-extension://')
      ) {
        return { ok: false, error: 'Cannot crop on this page' };
      }
      await chrome.tabs.sendMessage(tab.id, {
        type: 'START_CROP',
        draft: message.payload,
      });
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
    case 'SAVE_CROPPED_ANNOTATION': {
      await addAnnotation({
        annotationType: message.payload.annotationType,
        title: message.payload.title,
        description: message.payload.description,
        imageDataUrl: message.payload.imageDataUrl,
      });
      await notifyAnnotationSaved(message.payload.annotationType, message.payload.title);
      return { ok: true };
    }
    default:
      return { ok: false, error: 'Unknown message type' };
  }
}

async function captureFullWebTab(): Promise<string> {
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

async function captureCrop(coords: CropCoordinates): Promise<string | null> {
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

export async function registerBackground(): Promise<void> {
  await initSession();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.type) return false;
    handleMessage(message as Message)
      .then(sendResponse)
      .catch((err: Error) => sendResponse({ ok: false, error: err.message }));
    return true;
  });
}
