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
    expect(res.error).toMatch(/Title is required/);
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
    expect(res.error).toMatch(/Nothing to export/);
  });
});
