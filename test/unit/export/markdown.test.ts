import { describe, expect, it } from 'vitest';
import { buildCsv } from '@/lib/export/markdown';
import { createEmptySession } from '@/lib/core/types';

describe('markdown export helpers', () => {
  it('builds csv with title and description', () => {
    const session = createEmptySession({
      brand: 'Chrome',
      browserVersion: '1',
      os: 'Win',
      osVersion: '',
      cookies: true,
      language: 'en',
      timezone: 'UTC',
      screenResolution: '1x1',
    });
    session.annotations = [
      {
        id: '1',
        type: 'bug',
        title: 'Login fails',
        description: 'On submit',
        url: 'https://ex.com',
        timestamp: 1_700_000_000_000,
      },
    ];
    const csv = buildCsv(session);
    expect(csv).toContain('Login fails');
    expect(csv).toContain('On submit');
  });
});
