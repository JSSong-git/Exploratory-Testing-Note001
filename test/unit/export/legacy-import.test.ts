import { describe, expect, it } from 'vitest';
import { importLegacySession } from '@/lib/export/legacy-import';

const LEGACY_JSON = JSON.stringify({
  StartDateTime: 1_700_000_000_000,
  BrowserInfo: {
    browser: 'Chrome',
    browserVersion: '120',
    os: 'Windows',
    osVersion: '10',
    cookies: true,
  },
  annotations: [
    {
      type: 'Bug',
      name: 'Legacy bug',
      url: 'https://example.com',
      timestamp: 1_700_000_100_000,
      imageURL: null,
    },
  ],
});

describe('legacy import', () => {
  it('maps legacy fields to new session model', async () => {
    const session = await importLegacySession(LEGACY_JSON);
    expect(session.annotations).toHaveLength(1);
    expect(session.annotations[0].title).toBe('Legacy bug');
    expect(session.annotations[0].type).toBe('bug');
  });
});
