import type { Message, MessageResponse } from '@/lib/messaging/protocol';

export async function sendMessage<T = unknown>(
  message: Message,
): Promise<MessageResponse & { data?: T }> {
  return chrome.runtime.sendMessage(message);
}

export function getErrorMessage(res: MessageResponse, fallback = 'Request failed'): string {
  if (!res.ok) return res.error;
  return fallback;
}
