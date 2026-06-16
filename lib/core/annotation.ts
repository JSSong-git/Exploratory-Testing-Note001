import type { Annotation, Session } from '@/lib/core/types';

export function addAnnotation(session: Session, annotation: Annotation): Session {
  return {
    ...session,
    annotations: [...session.annotations, annotation],
  };
}

export function updateAnnotation(
  session: Session,
  id: string,
  updates: Partial<Pick<Annotation, 'title' | 'description' | 'type'>>,
): Session {
  return {
    ...session,
    annotations: session.annotations.map((a) =>
      a.id === id ? { ...a, ...updates } : a,
    ),
  };
}

export function deleteAnnotation(session: Session, id: string): Session {
  return {
    ...session,
    annotations: session.annotations.filter((a) => a.id !== id),
  };
}

export function getAnnotationImageIds(session: Session): string[] {
  return session.annotations
    .map((a) => a.imageId)
    .filter((id): id is string => Boolean(id));
}
