import type { Session } from '@/lib/core/types';
import { getAnnotationImageIds } from '@/lib/core/annotation';
import { deleteImages } from '@/lib/storage/image-store';

const SESSION_KEY = 'session';

export async function loadSession(): Promise<Session | null> {
  const data = await chrome.storage.local.get(SESSION_KEY);
  return (data[SESSION_KEY] as Session | undefined) ?? null;
}

export async function saveSession(session: Session): Promise<void> {
  const serialized = JSON.stringify(session);
  if (serialized.includes('data:image') || serialized.includes('imageURL')) {
    throw new Error('Session must not contain inline image data');
  }
  await chrome.storage.local.set({ [SESSION_KEY]: session });
}

export async function clearSessionStorage(): Promise<void> {
  const session = await loadSession();
  if (session) {
    const imageIds = getAnnotationImageIds(session);
    if (imageIds.length > 0) {
      await deleteImages(imageIds);
    }
  }
  await chrome.storage.local.remove(SESSION_KEY);
}

export async function getStorageByteSize(): Promise<number> {
  const data = await chrome.storage.local.get(null);
  return new Blob([JSON.stringify(data)]).size;
}
