import type { Session, Annotation, AnnotationType } from '@/lib/core/types';
import { createEmptySession } from '@/lib/core/types';
import { saveImage } from '@/lib/storage/image-store';

interface LegacyAnnotation {
  type: string;
  name: string;
  url: string;
  timestamp: number;
  imageURL?: string | null;
}

interface LegacySession {
  StartDateTime: number;
  BrowserInfo: {
    browser?: string;
    brand?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    cookies?: boolean;
    language?: string;
    timezone?: string;
    screenResolution?: string;
  };
  annotations: LegacyAnnotation[];
}

const TYPE_MAP: Record<string, AnnotationType> = {
  Bug: 'bug',
  Note: 'note',
  Idea: 'idea',
  Question: 'question',
};

export async function importLegacySession(json: string): Promise<Session> {
  const legacy = JSON.parse(json) as LegacySession;
  const browserInfo = {
    brand: legacy.BrowserInfo.brand ?? legacy.BrowserInfo.browser ?? 'Chrome',
    browserVersion: legacy.BrowserInfo.browserVersion ?? '0',
    os: legacy.BrowserInfo.os ?? 'Unknown',
    osVersion: legacy.BrowserInfo.osVersion ?? '',
    cookies: legacy.BrowserInfo.cookies ?? true,
    language: legacy.BrowserInfo.language ?? 'en',
    timezone: legacy.BrowserInfo.timezone ?? 'UTC',
    screenResolution: legacy.BrowserInfo.screenResolution ?? '0x0',
  };

  const session = createEmptySession(browserInfo);
  session.startDateTime = legacy.StartDateTime ?? session.startDateTime;

  const annotations: Annotation[] = [];
  for (const ann of legacy.annotations ?? []) {
    const type = TYPE_MAP[ann.type];
    if (!type) continue;

    let imageId: string | undefined;
    if (ann.imageURL && ann.imageURL.startsWith('data:')) {
      const response = await fetch(ann.imageURL);
      imageId = await saveImage(await response.blob());
    }

    annotations.push({
      id: crypto.randomUUID(),
      type,
      title: ann.name,
      url: ann.url,
      timestamp: ann.timestamp,
      imageId,
    });
  }

  session.annotations = annotations;
  return session;
}
