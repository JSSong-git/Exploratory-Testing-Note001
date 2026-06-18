import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import { addAnnotation, deleteAnnotation, updateAnnotation } from '@/lib/services/session-service';
import { notifyAnnotationSaved } from '@/lib/background/notify';
import { ko } from '@/lib/i18n/ko';

export async function handleAnnotationMessage(message: Message): Promise<MessageResponse | null> {
  switch (message.type) {
    case 'ADD_ANNOTATION': {
      if (!message.payload.title.trim()) {
        return { ok: false, error: ko.errors.titleRequired };
      }
      await addAnnotation(message.payload);
      await notifyAnnotationSaved(message.payload.annotationType, message.payload.title);
      return { ok: true };
    }
    case 'UPDATE_ANNOTATION': {
      if (!message.payload.title.trim()) {
        return { ok: false, error: ko.errors.titleRequired };
      }
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
      return null;
  }
}
