import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import { addAnnotation, deleteAnnotation, updateAnnotation } from '@/lib/services/session-service';
import { notifyAnnotationSaved } from '@/lib/background/notify';
import { broadcastSessionChanged } from '@/lib/background/session-events';
import { en } from '@/lib/i18n';

export async function handleAnnotationMessage(
  message: Message,
  sender?: chrome.runtime.MessageSender,
): Promise<MessageResponse | null> {
  switch (message.type) {
    case 'ADD_ANNOTATION': {
      if (!message.payload.title.trim()) {
        return { ok: false, error: en.errors.titleRequired };
      }
      await addAnnotation(message.payload, { url: sender?.tab?.url });
      await notifyAnnotationSaved(message.payload.annotationType, message.payload.title);
      broadcastSessionChanged();
      return { ok: true };
    }
    case 'UPDATE_ANNOTATION': {
      if (!message.payload.title.trim()) {
        return { ok: false, error: en.errors.titleRequired };
      }
      await updateAnnotation(
        message.payload.id,
        message.payload.title,
        message.payload.description,
      );
      broadcastSessionChanged();
      return { ok: true };
    }
    case 'DELETE_ANNOTATION': {
      await deleteAnnotation(message.payload.id);
      broadcastSessionChanged();
      return { ok: true };
    }
    case 'SAVE_CROPPED_ANNOTATION': {
      if (!message.payload.title?.trim()) {
        return { ok: false, error: en.errors.titleRequired };
      }
      if (!message.payload.imageDataUrl) {
        return { ok: false, error: en.errors.saveFailed };
      }
      try {
        await addAnnotation(
          {
            annotationType: message.payload.annotationType,
            title: message.payload.title,
            description: message.payload.description,
            imageDataUrl: message.payload.imageDataUrl,
          },
          { url: sender?.tab?.url },
        );
        await notifyAnnotationSaved(message.payload.annotationType, message.payload.title);
        broadcastSessionChanged();
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : en.errors.saveFailed,
        };
      }
    }
    default:
      return null;
  }
}
