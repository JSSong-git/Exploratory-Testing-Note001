import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import { initSession } from '@/lib/services/session-service';
import { handleAnnotationMessage } from '@/lib/background/handlers/annotation';
import { handleSessionMessage } from '@/lib/background/handlers/session';
import { handleExportMessage } from '@/lib/background/handlers/export';
import { handleScreenshotMessage } from '@/lib/background/handlers/screenshot';

export async function handleMessage(
  message: Message,
  sender?: chrome.runtime.MessageSender,
): Promise<MessageResponse> {
  const handlers = [
    handleAnnotationMessage,
    handleSessionMessage,
    handleExportMessage,
    handleScreenshotMessage,
  ];

  for (const handler of handlers) {
    const result = await handler(message, sender);
    if (result) return result;
  }

  return { ok: false, error: 'Unknown message type' };
}

let sessionReady: Promise<void> | null = null;

function ensureSessionReady(): Promise<void> {
  if (!sessionReady) {
    sessionReady = initSession();
  }
  return sessionReady;
}

/**
 * Register the message listener synchronously so MV3 service-worker wakeups
 * never miss the first message (e.g. SAVE_CROPPED_ANNOTATION).
 */
export function registerBackground(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message?.type) return false;
    ensureSessionReady()
      .then(() => handleMessage(message as Message, sender))
      .then(sendResponse)
      .catch((err: Error) => sendResponse({ ok: false, error: err.message }));
    return true;
  });

  void ensureSessionReady().then(async () => {
    if (chrome.sidePanel) {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  });
}
