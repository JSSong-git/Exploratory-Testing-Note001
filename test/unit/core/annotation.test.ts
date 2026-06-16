import { describe, expect, it } from 'vitest';
import { addAnnotation, deleteAnnotation, getAnnotationImageIds } from '@/lib/core/annotation';
import { createEmptySession } from '@/lib/core/types';

const browserInfo = {
  brand: 'Chrome',
  browserVersion: '1.0',
  os: 'Windows',
  osVersion: '10',
  cookies: true,
  language: 'en',
  timezone: 'UTC',
  screenResolution: '1920x1080',
};

describe('annotation helpers', () => {
  it('adds and deletes annotations', () => {
    let session = createEmptySession(browserInfo);
    session = addAnnotation(session, {
      id: '1',
      type: 'bug',
      title: 'Test',
      url: 'https://example.com',
      timestamp: Date.now(),
      imageId: 'img-1',
    });
    expect(session.annotations).toHaveLength(1);
    session = deleteAnnotation(session, '1');
    expect(session.annotations).toHaveLength(0);
  });

  it('collects image ids', () => {
    let session = createEmptySession(browserInfo);
    session = addAnnotation(session, {
      id: '1',
      type: 'bug',
      title: 'A',
      url: 'u',
      timestamp: 1,
      imageId: 'img-a',
    });
    expect(getAnnotationImageIds(session)).toEqual(['img-a']);
  });
});
