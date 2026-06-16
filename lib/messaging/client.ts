import type { Message, MessageResponse } from '@/lib/messaging/protocol';

export async function sendMessage<T = unknown>(message: Message): Promise<MessageResponse & { data?: T }> {
  return chrome.runtime.sendMessage(message);
}
