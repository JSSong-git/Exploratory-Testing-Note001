import { describe, expect, it, vi } from 'vitest';
import { buildCsv, buildInlineMarkdown } from '@/lib/export/markdown';
import { createEmptySession } from '@/lib/core/types';

vi.mock('@/lib/storage/image-store', () => ({
  getImage: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
}));

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

  it('builds inline markdown with embedded image data', async () => {
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
        id: 'img-1',
        type: 'bug',
        title: 'Screenshot',
        url: 'https://ex.com',
        timestamp: 1_700_000_000_000,
        imageId: 'stored-image',
      },
    ];

    const md = await buildInlineMarkdown(session);
    expect(md).toContain('### [Bug] Screenshot');
    expect(md).toContain('data:image/');
  });
});
