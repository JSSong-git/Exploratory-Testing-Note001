import type { Annotation, AnnotationType, BrowserInfo, Session } from '@/lib/core/types';
import { ANNOTATION_TYPES, createEmptySession } from '@/lib/core/types';
import { importLegacySession } from '@/lib/export/legacy-import';

function isAnnotationType(value: unknown): value is AnnotationType {
  return typeof value === 'string' && ANNOTATION_TYPES.includes(value as AnnotationType);
}

function looksLikeNativeSession(data: Record<string, unknown>): boolean {
  if (typeof data.startDateTime !== 'number') return false;
  if (!data.browserInfo || typeof data.browserInfo !== 'object') return false;
  if (!Array.isArray(data.annotations)) return false;
  const first = data.annotations[0] as Record<string, unknown> | undefined;
  if (!first) return true;
  return typeof first.title === 'string' || isAnnotationType(first.type);
}

function looksLikeLegacySession(data: Record<string, unknown>): boolean {
  if (data.StartDateTime !== undefined || data.BrowserInfo !== undefined) return true;
  const annotations = data.annotations;
  if (!Array.isArray(annotations) || annotations.length === 0) return false;
  const first = annotations[0] as Record<string, unknown>;
  return typeof first.name === 'string';
}

function normalizeBrowserInfo(raw: Record<string, unknown>): BrowserInfo {
  return {
    brand: String(raw.brand ?? raw.browser ?? 'Chrome'),
    browserVersion: String(raw.browserVersion ?? '0'),
    os: String(raw.os ?? 'Unknown'),
    osVersion: String(raw.osVersion ?? ''),
    cookies: Boolean(raw.cookies ?? true),
    language: String(raw.language ?? 'en'),
    timezone: String(raw.timezone ?? 'UTC'),
    screenResolution: String(raw.screenResolution ?? '0x0'),
  };
}

function normalizeNativeAnnotation(raw: Record<string, unknown>): Annotation {
  const type = raw.type;
  if (!isAnnotationType(type)) {
    throw new Error(`Unsupported annotation type: ${String(type)}`);
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) {
    throw new Error('Annotation title is required');
  }

  let imageId: string | undefined;
  if (typeof raw.imageId === 'string' && raw.imageId.length > 0) {
    if (raw.imageId.startsWith('data:image') || raw.imageId.includes('imageURL')) {
      throw new Error('Session must not contain inline image data');
    }
    imageId = raw.imageId;
  }

  return {
    id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : crypto.randomUUID(),
    type,
    title,
    description: typeof raw.description === 'string' ? raw.description.trim() || undefined : undefined,
    url: typeof raw.url === 'string' ? raw.url : 'N/A',
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
    imageId,
  };
}

export function parseNativeSession(data: Record<string, unknown>): Session {
  const browserInfo = normalizeBrowserInfo(data.browserInfo as Record<string, unknown>);
  const session = createEmptySession(browserInfo);
  session.startDateTime = data.startDateTime as number;
  session.annotations = (data.annotations as unknown[]).map((item) =>
    normalizeNativeAnnotation(item as Record<string, unknown>),
  );
  return session;
}

/** Supports native export format and legacy v1 JSON. */
export async function importSessionJson(json: string): Promise<Session> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('JSON parse failed');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Session root must be an object');
  }

  const data = parsed as Record<string, unknown>;

  if (looksLikeNativeSession(data)) {
    return parseNativeSession(data);
  }

  if (looksLikeLegacySession(data)) {
    return importLegacySession(json);
  }

  throw new Error('Unrecognized session JSON format');
}
