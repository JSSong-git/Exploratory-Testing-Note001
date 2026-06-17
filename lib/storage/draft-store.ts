import type { AnnotationType } from '@/lib/core/types';

const DRAFT_KEY = 'et-compose-draft';

export interface ComposeDraft {
  activeType: AnnotationType;
  title: string;
  description: string;
  updatedAt: number;
}

export async function loadComposeDraft(): Promise<ComposeDraft | null> {
  const result = await chrome.storage.local.get(DRAFT_KEY);
  const draft = result[DRAFT_KEY] as ComposeDraft | undefined;
  return draft ?? null;
}

export async function saveComposeDraft(draft: Omit<ComposeDraft, 'updatedAt'>): Promise<void> {
  await chrome.storage.local.set({
    [DRAFT_KEY]: { ...draft, updatedAt: Date.now() } satisfies ComposeDraft,
  });
}

export async function clearComposeDraft(): Promise<void> {
  await chrome.storage.local.remove(DRAFT_KEY);
}
