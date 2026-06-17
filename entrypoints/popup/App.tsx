import { useCallback, useEffect, useRef, useState } from 'react';
import type { Annotation, AnnotationType, Session } from '@/lib/core/types';
import { ANNOTATION_TYPES } from '@/lib/core/types';
import type { SessionSummary } from '@/lib/messaging/protocol';
import { sendMessage } from '@/lib/messaging/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SaveDetailsDialog } from '@/components/SaveDetailsDialog';

const TYPE_LABELS: Record<AnnotationType, string> = {
  bug: 'Bug',
  note: 'Note',
  idea: 'Idea',
  question: 'Question',
};

const TYPE_COUNT_KEY: Record<AnnotationType, keyof SessionSummary> = {
  bug: 'bugs',
  note: 'notes',
  idea: 'ideas',
  question: 'questions',
};

type ExportFormat = 'markdown' | 'markdown-inline' | 'json' | 'csv' | 'html';

const EXPORT_OPTIONS: { id: ExportFormat; label: string; defaultMarker?: boolean }[] = [
  { id: 'markdown', label: 'Markdown (.zip)', defaultMarker: true },
  { id: 'markdown-inline', label: 'Markdown inline (.md)' },
  { id: 'json', label: 'JSON' },
  { id: 'csv', label: 'CSV' },
  { id: 'html', label: 'Standalone HTML' },
];

export default function App() {
  const [activeType, setActiveType] = useState<AnnotationType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingScreenshot, setPendingScreenshot] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const refreshSession = useCallback(async () => {
    const summaryRes = await sendMessage<SessionSummary>({ type: 'GET_SESSION_SUMMARY' });
    const sessionRes = await sendMessage<Session>({ type: 'GET_FULL_SESSION' });
    if (summaryRes.ok && summaryRes.data) setSummary(summaryRes.data as SessionSummary);
    if (sessionRes.ok && sessionRes.data) {
      setAnnotations((sessionRes.data as Session).annotations);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const titleInvalid = title.trim().length === 0;

  function resetForm() {
    setTitle('');
    setDescription('');
    setEditingId(null);
    setActiveType('bug');
  }

  async function saveAnnotation(imageDataUrl?: string) {
    if (titleInvalid) {
      setError('Title is required');
      return;
    }
    setBusy(true);
    setError('');

    const res = editingId
      ? await sendMessage({
          type: 'UPDATE_ANNOTATION',
          payload: {
            id: editingId,
            title: title.trim(),
            description: description.trim() || undefined,
          },
        })
      : await sendMessage({
          type: 'ADD_ANNOTATION',
          payload: {
            annotationType: activeType,
            title: title.trim(),
            description: description.trim() || undefined,
            imageDataUrl,
          },
        });

    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Failed to save');
      return;
    }
    resetForm();
    await refreshSession();
  }

  function startEdit(annotation: Annotation) {
    setEditingId(annotation.id);
    setActiveType(annotation.type);
    setTitle(annotation.title);
    setDescription(annotation.description ?? '');
    setError('');
  }

  async function removeAnnotation(id: string) {
    if (!confirm('Delete this annotation?')) return;
    setBusy(true);
    const res = await sendMessage({ type: 'DELETE_ANNOTATION', payload: { id } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Failed to delete');
      return;
    }
    if (editingId === id) resetForm();
    await refreshSession();
  }

  async function captureFullScreenshot() {
    setError('');
    setBusy(true);
    try {
      const res = await sendMessage<string>({ type: 'CAPTURE_FULL_SCREENSHOT' });
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Screenshot capture failed');
        return;
      }
      setPendingScreenshot(res.data as string);
    } catch {
      setError('Screenshot capture failed');
    } finally {
      setBusy(false);
    }
  }

  async function startCrop() {
    if (titleInvalid) {
      setError('Title is required before crop');
      return;
    }
    setError('');
    const res = await sendMessage({
      type: 'INITIATE_CROP',
      payload: {
        annotationType: activeType,
        title: title.trim(),
        description: description.trim() || undefined,
      },
    });
    if (!res.ok) {
      setError(res.error ?? 'Could not start crop');
      return;
    }
    resetForm();
    window.close();
  }

  async function runExport(format: ExportFormat) {
    setExportOpen(false);
    const message =
      format === 'markdown'
        ? { type: 'EXPORT_MARKDOWN' as const }
        : format === 'markdown-inline'
          ? { type: 'EXPORT_MARKDOWN_INLINE' as const }
          : format === 'json'
            ? { type: 'EXPORT_JSON' as const }
            : format === 'csv'
              ? { type: 'EXPORT_CSV' as const }
              : { type: 'EXPORT_HTML' as const };
    const res = await sendMessage(message);
    if (!res.ok) setError(res.error ?? 'Export failed');
  }

  async function importJson(file: File) {
    const text = await file.text();
    const res = await sendMessage({ type: 'IMPORT_JSON', payload: { json: text } });
    if (!res.ok) {
      setError(res.error ?? 'Import failed');
      return;
    }
    await refreshSession();
  }

  async function clearSession() {
    if (!summary?.annotationsCount) return;
    if (!confirm('Reset current session?')) return;
    await sendMessage({ type: 'CLEAR_SESSION' });
    resetForm();
    await refreshSession();
  }

  function openReport() {
    if (!summary?.annotationsCount) return;
    chrome.tabs.create({ url: chrome.runtime.getURL('/report.html') });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      saveAnnotation();
    }
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      captureFullScreenshot();
    }
  }

  return (
    <div className="w-[380px] min-h-[520px] p-4" data-testid="popup-root">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">ET Session</h1>
          <p className="text-xs text-[var(--color-muted)]">Exploratory Testing</p>
        </div>
        {summary && summary.annotationsCount > 0 && (
          <Badge tone="neutral" data-testid="session-count">
            {summary.annotationsCount} items
          </Badge>
        )}
      </header>

      <div className="mb-3 flex gap-1" data-testid="type-tabs">
        {ANNOTATION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            data-testid={`type-tab-${type}`}
            onClick={() => setActiveType(type)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              activeType === type
                ? 'bg-sky-500 text-white'
                : 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-white'
            }`}
          >
            {TYPE_LABELS[type]}
            {summary && (summary[TYPE_COUNT_KEY[type]] as number) > 0 ? (
              <span className="ml-1 opacity-80">({summary[TYPE_COUNT_KEY[type]]})</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {editingId && (
          <p className="text-xs text-sky-400" data-testid="editing-indicator">
            Editing annotation
          </p>
        )}
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">Title (required)</label>
          <Input
            data-testid="annotation-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${TYPE_LABELS[activeType]} title`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">Description (optional)</label>
          <Textarea
            data-testid="annotation-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Additional details"
          />
        </div>
        <p className="text-[10px] text-[var(--color-muted)]">
          Ctrl+Enter save · Shift+Enter full screenshot
        </p>
        {error && <p className="text-xs text-red-400" data-testid="form-error">{error}</p>}
        <div className="flex gap-2">
          <Button
            data-testid="save-annotation"
            disabled={busy || titleInvalid}
            onClick={() => saveAnnotation()}
            className="flex-1"
          >
            {editingId ? 'Update' : 'Save'}
          </Button>
          <Button
            data-testid="screenshot-full"
            variant="outline"
            disabled={busy || !!editingId}
            onClick={captureFullScreenshot}
          >
            Full
          </Button>
          <Button
            data-testid="screenshot-crop"
            variant="outline"
            disabled={busy || titleInvalid || !!editingId}
            onClick={startCrop}
          >
            Crop
          </Button>
        </div>
        {editingId && (
          <Button data-testid="cancel-edit" variant="ghost" size="sm" onClick={resetForm}>
            Cancel edit
          </Button>
        )}
      </div>

      {annotations.length > 0 && (
        <section className="mt-4 max-h-40 overflow-y-auto border-t border-[var(--color-border)] pt-3" data-testid="annotation-list">
          <h2 className="mb-2 text-xs font-semibold text-[var(--color-muted)]">Saved annotations</h2>
          <ul className="space-y-2">
            {annotations.map((annotation) => (
              <li
                key={annotation.id}
                className="flex items-start justify-between gap-2 rounded-md bg-[var(--color-card)] p-2"
                data-testid={`annotation-item-${annotation.id}`}
              >
                <div className="min-w-0">
                  <Badge tone={annotation.type}>{annotation.type}</Badge>
                  <p className="truncate text-xs font-medium">{annotation.title}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    data-testid={`edit-annotation-${annotation.id}`}
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(annotation)}
                  >
                    Edit
                  </Button>
                  <Button
                    data-testid={`delete-annotation-${annotation.id}`}
                    size="sm"
                    variant="destructive"
                    onClick={() => removeAnnotation(annotation.id)}
                  >
                    Del
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-6 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
        <Button data-testid="preview-report" variant="outline" size="sm" onClick={openReport}>
          Preview Report
        </Button>
        <div className="relative" ref={exportMenuRef}>
          <Button
            data-testid="export-menu-toggle"
            size="sm"
            onClick={() => setExportOpen((v) => !v)}
          >
            Export ▾
          </Button>
          {exportOpen && (
            <div
              className="absolute bottom-full left-0 z-10 mb-1 min-w-[200px] rounded-md border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-lg"
              data-testid="export-menu"
            >
              {EXPORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  data-testid={`export-${option.id}`}
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-[var(--color-background)]"
                  onClick={() => runExport(option.id)}
                >
                  {option.defaultMarker ? '● ' : '○ '}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          data-testid="import-json"
          variant="outline"
          size="sm"
          onClick={() => importRef.current?.click()}
        >
          Import
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="import-json-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importJson(file);
            e.target.value = '';
          }}
        />
        <Button data-testid="reset-session" variant="destructive" size="sm" onClick={clearSession}>
          Reset
        </Button>
      </footer>

      {pendingScreenshot && (
        <SaveDetailsDialog
          key={pendingScreenshot}
          open
          initialType={activeType}
          initialTitle={title}
          initialDescription={description}
          previewImageUrl={pendingScreenshot}
          onCancel={() => setPendingScreenshot(null)}
          onConfirm={async (values) => {
            setBusy(true);
            const res = await sendMessage({
              type: 'ADD_ANNOTATION',
              payload: {
                annotationType: values.annotationType,
                title: values.title,
                description: values.description,
                imageDataUrl: pendingScreenshot,
              },
            });
            setBusy(false);
            if (!res.ok) {
              setError(res.error ?? 'Failed to save');
              return;
            }
            setPendingScreenshot(null);
            resetForm();
            await refreshSession();
          }}
        />
      )}
    </div>
  );
}
