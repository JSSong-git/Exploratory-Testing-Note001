import { describe, expect, it } from 'vitest';
import { stripMarkdownForPreview } from '@/lib/markdown-preview';

describe('stripMarkdownForPreview', () => {
  it('removes bold and headings', () => {
    expect(stripMarkdownForPreview('**bold** text')).toBe('bold text');
    expect(stripMarkdownForPreview('## title\nbody')).toBe('title body');
  });

  it('removes inline code and links', () => {
    expect(stripMarkdownForPreview('use `code` here')).toBe('use code here');
    expect(stripMarkdownForPreview('[link](https://example.com)')).toBe('link');
  });

  it('returns empty for whitespace', () => {
    expect(stripMarkdownForPreview('   ')).toBe('');
  });
});
