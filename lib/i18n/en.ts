/**
 * Exploratory Testing UI glossary (ISTQB / session-based ET terminology)
 * - Defect: ISTQB standard term for flaw that can cause failure
 * - Observation, Improvement, Question: common ET session note categories
 * - Format names (Markdown, JSON, etc.) remain in English
 */
import type { AnnotationType } from '@/lib/core/types';

export const TYPE_LABELS: Record<AnnotationType, string> = {
  bug: 'Defect',
  note: 'Observation',
  idea: 'Improvement',
  question: 'Question',
};

export const CHART_TYPE_LABELS: Record<AnnotationType, string> = {
  bug: 'Defect',
  note: 'Observation',
  idea: 'Improvement',
  question: 'Question',
};

export function descriptionLabel(type: AnnotationType): string {
  return type === 'bug' ? 'Defect details (Markdown)' : 'Description (Markdown)';
}

export function titlePlaceholder(type: AnnotationType): string {
  return `${TYPE_LABELS[type]} title`;
}

export function formatItemCount(n: number): string {
  return n === 1 ? '1 item' : `${n} items`;
}

export const LOCALE_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

export function formatLocaleDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', LOCALE_DATE_OPTIONS);
}

export const en = {
  app: {
    title: 'Test Session',
    subtitle: 'Exploratory Testing',
    itemCount: formatItemCount,
    loading: 'Loading…',
  },
  nav: {
    compose: 'Record',
    saved: 'Saved',
  },
  form: {
    titleRequired: 'Title (required)',
    description: 'Description',
    bugPlaceholder: 'Steps to reproduce, expected result, actual result, notes…',
    editing: 'Editing record',
    noDescription: 'No description.',
    noSaved: 'No saved records yet.',
  },
  actions: {
    review: 'Review',
    update: 'Update',
    cancelEdit: 'Cancel edit',
    captureFull: 'Full capture',
    captureCrop: 'Area capture',
    captureFullAria: 'Capture full screen',
    captureCropAria: 'Capture selected area',
    back: '← Back',
    edit: 'Edit',
    delete: 'Delete',
    reviewTitle: 'Review before saving',
    backToEdit: 'Back to edit',
    confirmSave: 'Confirm save',
    previewReport: 'Preview report',
    export: 'Export',
    import: 'Import',
    resetSession: 'Reset session',
    more: 'More',
    save: 'Save',
    cancel: 'Cancel',
    confirmAnnotation: 'Confirm record',
    screenshotPreview: 'Screenshot preview',
  },
  export: {
    markdown: 'Markdown (.zip)',
    markdownInline: 'Markdown inline (.md)',
    json: 'JSON',
    csv: 'CSV',
    html: 'Standalone HTML',
    default: 'Default',
  },
  report: {
    title: 'Session Report',
    started: (date: string) => `Started ${date}`,
    all: 'All',
    searchPlaceholder: 'Search title, description, URL',
    colType: 'Type',
    colTitle: 'Title',
    colDescription: 'Description',
    colUrl: 'URL',
    colScreenshot: 'Screenshot',
    colTime: 'Recorded at',
    empty: 'No records match the current filters.',
    noData: 'Unable to load session data.',
    loading: 'Loading report…',
  },
  editor: {
    edit: 'Edit',
    preview: 'Preview',
    hint: '**bold** · - list · `code` · ## heading',
    emptyPreview: 'Nothing to preview yet.',
    writePlaceholder: 'Write in Markdown…',
    tools: {
      arrow: 'Arrow',
      rectangle: 'Rectangle',
      text: 'Text',
      blur: 'Redact',
      undo: 'Undo',
      save: 'Save',
      cancel: 'Cancel',
    },
  },
  errors: {
    titleRequired: 'Title is required.',
    titleRequiredBeforeCrop: 'Enter a title before area capture.',
    saveFailed: 'Failed to save.',
    deleteFailed: 'Failed to delete.',
    exportFailed: 'Export failed.',
    importFailed: 'Import failed.',
    screenshotFailed: 'Screenshot capture failed.',
    cropFailed: 'Could not start area capture.',
    cropCaptureFailed: 'Area capture failed. Try again on a normal web page.',
    nothingToExport: 'Nothing to export.',
  },
  notices: {
    cropStarted:
      'Switch to the web page tab and drag to select an area. Press Esc to cancel.',
  },
  confirm: {
    delete: 'Delete this record?',
    resetSession:
      'Reset the current test session? All saved records will be removed.',
  },
  image: {
    loading: 'Loading image…',
    unavailable: 'Image unavailable.',
    hasScreenshot: 'Has screenshot',
  },
  notify: {
    saved: (label: string, title: string) => `${label} saved`,
    savedMessage: (title: string) => `"${title}" was added to the session.`,
  },
} as const;
