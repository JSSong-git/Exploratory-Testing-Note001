import { describe, expect, it } from 'vitest';
import { ANNOTATION_TYPES } from '@/lib/core/types';
import { en, TYPE_LABELS, descriptionLabel, formatItemCount } from '@/lib/i18n';

describe('en i18n', () => {
  it('defines all annotation type labels', () => {
    for (const type of ANNOTATION_TYPES) {
      expect(TYPE_LABELS[type]).toBeTruthy();
      expect(descriptionLabel(type)).toContain('Markdown');
    }
  });

  it('uses ISTQB-aligned terms for types', () => {
    expect(TYPE_LABELS.bug).toBe('Defect');
    expect(TYPE_LABELS.note).toBe('Observation');
    expect(TYPE_LABELS.idea).toBe('Improvement');
    expect(TYPE_LABELS.question).toBe('Question');
  });

  it('has required UI sections', () => {
    expect(en.nav.compose).toBe('Record');
    expect(en.actions.export).toBe('Export');
    expect(en.errors.titleRequired).toBeTruthy();
  });

  it('formats item count in English', () => {
    expect(formatItemCount(1)).toBe('1 item');
    expect(formatItemCount(3)).toBe('3 items');
  });
});
