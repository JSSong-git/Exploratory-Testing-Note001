import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import { clearSession, getSession, getSessionSummary } from '@/lib/services/session-service';
import { broadcastSessionChanged } from '@/lib/background/session-events';

export async function handleSessionMessage(
  message: Message,
  _sender?: chrome.runtime.MessageSender,
): Promise<MessageResponse | null> {
  switch (message.type) {
    case 'GET_SESSION_SUMMARY':
      return { ok: true, data: getSessionSummary() };
    case 'GET_FULL_SESSION':
      return { ok: true, data: getSession() };
    case 'CLEAR_SESSION': {
      await clearSession();
      broadcastSessionChanged();
      return { ok: true };
    }
    case 'SESSION_CHANGED':
      // Broadcast echo — ignore in the service worker.
      return { ok: true };
    default:
      return null;
  }
}
