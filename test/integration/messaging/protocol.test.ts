import { describe, expect, it } from 'vitest';
import { isMessage } from '@/lib/messaging/protocol';

describe('messaging protocol', () => {
  it('accepts known message shapes', () => {
    expect(isMessage({ type: 'GET_SESSION_SUMMARY' })).toBe(true);
    expect(
      isMessage({
        type: 'ADD_ANNOTATION',
        payload: { annotationType: 'bug', title: 'Test' },
      }),
    ).toBe(true);
    expect(isMessage({ type: 'EXPORT_MARKDOWN' })).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isMessage(null)).toBe(false);
    expect(isMessage({})).toBe(false);
    expect(isMessage({ type: 123 })).toBe(false);
    expect(isMessage('ADD_ANNOTATION')).toBe(false);
  });
});
