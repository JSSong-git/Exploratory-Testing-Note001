import type { AnnotationType } from '@/lib/core/types';

export async function showNotification(title: string, message: string): Promise<void> {
  const id = `et-notif-${Date.now()}`;
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon/128.png'),
    title,
    message,
  });
  setTimeout(() => chrome.notifications.clear(id), 5000);
}

const TYPE_LABELS: Record<AnnotationType, string> = {
  bug: 'Bug',
  note: 'Note',
  idea: 'Idea',
  question: 'Question',
};

export async function notifyAnnotationSaved(type: AnnotationType, title: string): Promise<void> {
  try {
    const label = TYPE_LABELS[type];
    await showNotification(`${label} saved`, `"${title}" was added to the session.`);
  } catch {
    // Notifications may be unavailable in some environments.
  }
}
