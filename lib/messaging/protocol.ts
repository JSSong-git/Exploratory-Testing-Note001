import type { Annotation, AnnotationType, Session } from '@/lib/core/types';

export type Message =
  | { type: 'ADD_ANNOTATION'; payload: AddAnnotationPayload }
  | { type: 'UPDATE_ANNOTATION'; payload: { id: string; title: string; description?: string } }
  | { type: 'DELETE_ANNOTATION'; payload: { id: string } }
  | { type: 'GET_SESSION_SUMMARY' }
  | { type: 'GET_FULL_SESSION' }
  | { type: 'CLEAR_SESSION' }
  | { type: 'EXPORT_MARKDOWN' }
  | { type: 'EXPORT_MARKDOWN_INLINE' }
  | { type: 'EXPORT_JSON' }
  | { type: 'EXPORT_CSV' }
  | { type: 'EXPORT_HTML' }
  | { type: 'IMPORT_JSON'; payload: { json: string } }
  | { type: 'INITIATE_CROP'; payload: CropDraft }
  | { type: 'REQUEST_CROP_SCREENSHOT'; payload: { coordinates: CropCoordinates } }
  | { type: 'CAPTURE_FULL_SCREENSHOT' }
  | { type: 'SAVE_CROPPED_ANNOTATION'; payload: SaveCroppedPayload };

export interface AddAnnotationPayload {
  annotationType: AnnotationType;
  title: string;
  description?: string;
  imageDataUrl?: string;
}

export interface CropDraft {
  annotationType: AnnotationType;
  title: string;
  description?: string;
}

export interface CropCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SaveCroppedPayload {
  annotationType: AnnotationType;
  title: string;
  description?: string;
  imageDataUrl: string;
}

export type MessageResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };

export interface SessionSummary {
  bugs: number;
  notes: number;
  ideas: number;
  questions: number;
  annotationsCount: number;
}

export function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Message).type === 'string'
  );
}

export type { Session };
