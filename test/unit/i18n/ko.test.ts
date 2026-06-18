import { describe, expect, it } from 'vitest';
import { ANNOTATION_TYPES } from '@/lib/core/types';
import { ko, TYPE_LABELS, descriptionLabel } from '@/lib/i18n/ko';

describe('ko i18n', () => {
  it('defines all annotation type labels', () => {
    for (const type of ANNOTATION_TYPES) {
      expect(TYPE_LABELS[type]).toBeTruthy();
      expect(descriptionLabel(type)).toContain('Markdown');
    }
  });

  it('uses QA domain terms for types', () => {
    expect(TYPE_LABELS.bug).toBe('결함');
    expect(TYPE_LABELS.note).toBe('관찰 기록');
    expect(TYPE_LABELS.idea).toBe('개선 아이디어');
    expect(TYPE_LABELS.question).toBe('확인 사항');
  });

  it('has required UI sections', () => {
    expect(ko.nav.compose).toBeTruthy();
    expect(ko.actions.export).toBe('보내기');
    expect(ko.errors.titleRequired).toBeTruthy();
  });
});
