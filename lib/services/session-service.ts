import type { Session } from '@/lib/core/types';
import { createEmptySession, countByType } from '@/lib/core/types';
import { getBrowserInfo } from '@/lib/core/browser-info';
import {
  addAnnotation as addToSession,
  deleteAnnotation as deleteFromSession,
  updateAnnotation as updateInSession,
} from '@/lib/core/annotation';
import type { AddAnnotationPayload, SessionSummary } from '@/lib/messaging/protocol';
import { loadSession, saveSession, clearSessionStorage } from '@/lib/storage/session-store';
import { deleteImage } from '@/lib/storage/image-store';
import { imageDataUrlToId } from '@/lib/export/markdown';

let sessionCache: Session | null = null;
let loadInFlight: Promise<Session | null> | null = null;

export async function initSession(): Promise<void> {
  sessionCache = await loadSession();
}

export function getSession(): Session | null {
  return sessionCache;
}

async function loadSessionCached(): Promise<Session | null> {
  if (sessionCache) return sessionCache;
  if (!loadInFlight) {
    loadInFlight = loadSession()
      .then((session) => {
        sessionCache = session;
        return session;
      })
      .finally(() => {
        loadInFlight = null;
      });
  }
  return loadInFlight;
}

async function ensureSession(): Promise<Session> {
  const existing = await loadSessionCached();
  if (existing) return existing;

  const browserInfo = await getBrowserInfo();
  sessionCache = createEmptySession(browserInfo);
  await saveSession(sessionCache);
  return sessionCache;
}

export async function addAnnotation(
  payload: AddAnnotationPayload,
  options?: { url?: string },
): Promise<void> {
  const session = await ensureSession();
  let url = options?.url;
  if (!url || !url.startsWith('http')) {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const capturable = tabs.find(
      (t) => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')),
    );
    url = capturable?.url ?? (url?.startsWith('http') ? url : undefined) ?? 'N/A';
  }
  const imageId = await imageDataUrlToId(payload.imageDataUrl);

  const annotation = {
    id: crypto.randomUUID(),
    type: payload.annotationType,
    title: payload.title.trim(),
    description: payload.description?.trim() || undefined,
    url,
    timestamp: Date.now(),
    imageId,
  };

  sessionCache = addToSession(session, annotation);
  await saveSession(sessionCache);
}

export async function updateAnnotation(
  id: string,
  title: string,
  description?: string,
): Promise<void> {
  const session = await ensureSession();
  sessionCache = updateInSession(session, id, {
    title: title.trim(),
    description: description?.trim() || undefined,
  });
  await saveSession(sessionCache);
}

export async function deleteAnnotation(id: string): Promise<void> {
  const session = await ensureSession();
  const target = session.annotations.find((a) => a.id === id);
  if (target?.imageId) {
    await deleteImage(target.imageId);
  }
  sessionCache = deleteFromSession(session, id);
  await saveSession(sessionCache);
}

export async function clearSession(): Promise<void> {
  await clearSessionStorage();
  sessionCache = null;
}

export function getSessionSummary(): SessionSummary {
  if (!sessionCache) {
    return { bugs: 0, notes: 0, ideas: 0, questions: 0, annotationsCount: 0 };
  }
  const counts = countByType(sessionCache);
  return {
    bugs: counts.bug,
    notes: counts.note,
    ideas: counts.idea,
    questions: counts.question,
    annotationsCount: sessionCache.annotations.length,
  };
}

export async function replaceSession(session: Session): Promise<void> {
  sessionCache = session;
  await saveSession(session);
}
