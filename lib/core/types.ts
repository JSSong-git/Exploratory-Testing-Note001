export type AnnotationType = 'bug' | 'note' | 'idea' | 'question';

export interface BrowserInfo {
  brand: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  cookies: boolean;
  language: string;
  timezone: string;
  screenResolution: string;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  title: string;
  description?: string;
  url: string;
  timestamp: number;
  imageId?: string;
}

export interface Session {
  startDateTime: number;
  browserInfo: BrowserInfo;
  annotations: Annotation[];
}

export const ANNOTATION_TYPES: AnnotationType[] = [
  'bug',
  'note',
  'idea',
  'question',
];

export function createEmptySession(browserInfo: BrowserInfo): Session {
  return {
    startDateTime: Date.now(),
    browserInfo,
    annotations: [],
  };
}

export function countByType(session: Session): Record<AnnotationType, number> {
  return {
    bug: session.annotations.filter((a) => a.type === 'bug').length,
    note: session.annotations.filter((a) => a.type === 'note').length,
    idea: session.annotations.filter((a) => a.type === 'idea').length,
    question: session.annotations.filter((a) => a.type === 'question').length,
  };
}
