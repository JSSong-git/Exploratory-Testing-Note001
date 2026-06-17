import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import { initSession } from '@/lib/services/session-service';
import { handleAnnotationMessage } from '@/lib/background/handlers/annotation';
import { handleSessionMessage } from '@/lib/background/handlers/session';
import { handleExportMessage } from '@/lib/background/handlers/export';
import { handleScreenshotMessage } from '@/lib/background/handlers/screenshot';

export async function handleMessage(message: Message): Promise<MessageResponse> {
  const handlers = [
    handleAnnotationMessage,
    handleSessionMessage,
    handleExportMessage,
    handleScreenshotMessage,
  ];

  for (const handler of handlers) {
    const result = await handler(message);
    if (result) return result;
  }

  return { ok: false, error: 'Unknown message type' };
}

export async function registerBackground(): Promise<void> {
  await initSession();

  if (chrome.sidePanel) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.type) return false;
    handleMessage(message as Message)
      .then(sendResponse)
      .catch((err: Error) => sendResponse({ ok: false, error: err.message }));
    return true;
  });
}
