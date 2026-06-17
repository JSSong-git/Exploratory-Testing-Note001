import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import { clearSession, getSession, getSessionSummary } from '@/lib/services/session-service';

export async function handleSessionMessage(message: Message): Promise<MessageResponse | null> {
  switch (message.type) {
    case 'GET_SESSION_SUMMARY':
      return { ok: true, data: getSessionSummary() };
    case 'GET_FULL_SESSION':
      return { ok: true, data: getSession() };
    case 'CLEAR_SESSION': {
      await clearSession();
      return { ok: true };
    }
    default:
      return null;
  }
}
