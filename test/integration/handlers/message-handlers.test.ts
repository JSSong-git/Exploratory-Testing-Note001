import { describe, expect, it, vi, beforeEach } from 'vitest';
import { handleMessage } from '@/lib/background/index';
import * as sessionService from '@/lib/services/session-service';

vi.mock('@/lib/services/session-service', () => ({
  addAnnotation: vi.fn(async () => {}),
  clearSession: vi.fn(async () => {}),
  deleteAnnotation: vi.fn(async () => {}),
  getSession: vi.fn(),
  getSessionSummary: vi.fn(() => ({
    bugs: 0,
    notes: 0,
    ideas: 0,
    questions: 0,
    annotationsCount: 0,
  })),
  initSession: vi.fn(async () => {}),
  replaceSession: vi.fn(async () => {}),
  updateAnnotation: vi.fn(async () => {}),
}));

vi.mock('@/lib/background/notify', () => ({
  notifyAnnotationSaved: vi.fn(async () => {}),
}));

vi.mock('@/lib/export/download', () => ({
  downloadBlob: vi.fn(async () => {}),
  downloadText: vi.fn(async () => {}),
  sessionFilename: vi.fn(() => 'session.zip'),
}));

import { downloadText } from '@/lib/export/download';

describe('background handleMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects ADD_ANNOTATION without title', async () => {
    const res = await handleMessage({
      type: 'ADD_ANNOTATION',
      payload: { annotationType: 'bug', title: '   ' },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Title is required/);
    expect(sessionService.addAnnotation).not.toHaveBeenCalled();
  });

  it('accepts ADD_ANNOTATION with title', async () => {
    const res = await handleMessage({
      type: 'ADD_ANNOTATION',
      payload: { annotationType: 'bug', title: 'Login issue' },
    });
    expect(res.ok).toBe(true);
    expect(sessionService.addAnnotation).toHaveBeenCalled();
  });

  it('saves cropped annotation with image payload', async () => {
    const res = await handleMessage({
      type: 'SAVE_CROPPED_ANNOTATION',
      payload: {
        annotationType: 'bug',
        title: 'Cropped defect',
        description: 'Selected area',
        imageDataUrl: 'data:image/jpeg;base64,abc',
      },
    });
    expect(res.ok).toBe(true);
    expect(sessionService.addAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cropped defect',
        imageDataUrl: 'data:image/jpeg;base64,abc',
      }),
      expect.anything(),
    );
  });

  it('rejects SAVE_CROPPED_ANNOTATION without title', async () => {
    const res = await handleMessage({
      type: 'SAVE_CROPPED_ANNOTATION',
      payload: {
        annotationType: 'bug',
        title: '  ',
        imageDataUrl: 'data:image/jpeg;base64,abc',
      },
    });
    expect(res.ok).toBe(false);
    expect(sessionService.addAnnotation).not.toHaveBeenCalled();
  });

  it('returns error when exporting empty session', async () => {
    vi.mocked(sessionService.getSession).mockReturnValue({
      startDateTime: Date.now(),
      browserInfo: {
        brand: 'Chrome',
        browserVersion: '1',
        os: 'Win',
        osVersion: '',
        cookies: true,
        language: 'en',
        timezone: 'UTC',
        screenResolution: '1920x1080',
      },
      annotations: [],
    });

    const res = await handleMessage({ type: 'EXPORT_MARKDOWN' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Nothing to export/);
  });

  it('rejects UPDATE_ANNOTATION without title', async () => {
    const res = await handleMessage({
      type: 'UPDATE_ANNOTATION',
      payload: { id: 'a1', title: '   ' },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Title is required/);
    expect(sessionService.updateAnnotation).not.toHaveBeenCalled();
  });

  it('exports inline markdown for session with annotations', async () => {
    vi.mocked(sessionService.getSession).mockReturnValue({
      startDateTime: Date.now(),
      browserInfo: {
        brand: 'Chrome',
        browserVersion: '1',
        os: 'Win',
        osVersion: '',
        cookies: true,
        language: 'en',
        timezone: 'UTC',
        screenResolution: '1920x1080',
      },
      annotations: [
        {
          id: 'a1',
          type: 'bug',
          title: 'Bug one',
          url: 'https://example.com',
          timestamp: Date.now(),
        },
      ],
    });

    const res = await handleMessage({ type: 'EXPORT_MARKDOWN_INLINE' });
    expect(res.ok).toBe(true);
    expect(downloadText).toHaveBeenCalledWith(
      expect.stringContaining('Bug one'),
      expect.any(String),
      'text/markdown',
    );
  });
});
