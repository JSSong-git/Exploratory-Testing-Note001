import { describe, expect, it } from 'vitest';
import { buildJson } from '@/lib/export/markdown';
import { createEmptySession } from '@/lib/core/types';
import { importSessionJson, parseNativeSession } from '@/lib/export/session-import';

const browserInfo = {
  brand: 'Chrome',
  browserVersion: '120',
  os: 'Windows',
  osVersion: '11',
  cookies: true,
  language: 'ko',
  timezone: 'Asia/Seoul',
  screenResolution: '1920x1080',
};

describe('importSessionJson', () => {
  it('imports native session exported by buildJson', async () => {
    const session = createEmptySession(browserInfo);
    session.startDateTime = 1_700_000_000_000;
    session.annotations = [
      {
        id: 'a-native-1',
        type: 'bug',
        title: 'Exported bug',
        description: '**details**',
        url: 'https://example.com/page',
        timestamp: 1_700_000_100_000,
      },
    ];

    const json = buildJson(session);
    const imported = await importSessionJson(json);

    expect(imported.startDateTime).toBe(session.startDateTime);
    expect(imported.annotations).toHaveLength(1);
    expect(imported.annotations[0]).toMatchObject({
      id: 'a-native-1',
      type: 'bug',
      title: 'Exported bug',
      description: '**details**',
      url: 'https://example.com/page',
    });
  });

  it('imports legacy session JSON', async () => {
    const legacyJson = JSON.stringify({
      StartDateTime: 1_700_000_000_000,
      BrowserInfo: { browser: 'Chrome', browserVersion: '120', os: 'Windows', cookies: true },
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

    const imported = await importSessionJson(legacyJson);
    expect(imported.annotations[0].title).toBe('Legacy bug');
    expect(imported.annotations[0].type).toBe('bug');
  });

  it('rejects inline image data in native JSON', () => {
    expect(() =>
      parseNativeSession({
        startDateTime: Date.now(),
        browserInfo,
        annotations: [
          {
            id: 'x',
            type: 'bug',
            title: 'Bad',
            url: 'https://example.com',
            timestamp: Date.now(),
            imageId: 'data:image/png;base64,abc',
          },
        ],
      }),
    ).toThrow(/inline image data/);
  });
});
