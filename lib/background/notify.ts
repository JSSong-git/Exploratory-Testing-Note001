import type { AnnotationType } from '@/lib/core/types';
import { TYPE_LABELS } from '@/lib/i18n/ko';

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

export async function notifyAnnotationSaved(type: AnnotationType, title: string): Promise<void> {
  try {
    const label = TYPE_LABELS[type];
    await showNotification(`${label} 저장됨`, `"${title}" 기록이 세션에 추가되었습니다.`);
  } catch {
    // Notifications may be unavailable in some environments.
  }
}
