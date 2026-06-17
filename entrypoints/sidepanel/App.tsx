import { useCallback, useEffect, useRef, useState } from 'react';
import type { Annotation, AnnotationType, Session } from '@/lib/core/types';
import { ANNOTATION_TYPES } from '@/lib/core/types';
import type { SessionSummary } from '@/lib/messaging/protocol';
import { getErrorMessage, sendMessage } from '@/lib/messaging/client';
import { clearComposeDraft, loadComposeDraft, saveComposeDraft } from '@/lib/storage/draft-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { AnnotationDetail, AnnotationReview } from '@/components/AnnotationDetail';
import { SaveDetailsDialog } from '@/components/SaveDetailsDialog';
import { cn } from '@/lib/utils';

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
type ViewMode = 'compose' | 'review' | 'list' | 'detail';

const EXPORT_OPTIONS: { id: ExportFormat; label: string; defaultMarker?: boolean }[] = [
  { id: 'markdown', label: 'Markdown (.zip)', defaultMarker: true },
  { id: 'markdown-inline', label: 'Markdown inline (.md)' },
  { id: 'json', label: 'JSON' },
  { id: 'csv', label: 'CSV' },
  { id: 'html', label: 'Standalone HTML' },
];

function descriptionLabel(type: AnnotationType): string {
  return type === 'bug' ? '오류 정보 (Markdown)' : '설명 (Markdown)';
}

export default function App() {
  const [view, setView] = useState<ViewMode>('compose');
  const [activeType, setActiveType] = useState<AnnotationType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingScreenshot, setPendingScreenshot] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const selectedAnnotation = annotations.find((a) => a.id === selectedId) ?? null;

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
    loadComposeDraft().then((draft) => {
      if (draft && !editingId) {
        setActiveType(draft.activeType);
        setTitle(draft.title);
        setDescription(draft.description);
      }
      setDraftLoaded(true);
    });
  }, [editingId]);

  useEffect(() => {
    if (!draftLoaded || editingId || view !== 'compose') return;
    const timer = window.setTimeout(() => {
      void saveComposeDraft({ activeType, title, description });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [activeType, title, description, draftLoaded, editingId, view]);

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
    void clearComposeDraft();
  }

  async function persistAnnotation(imageDataUrl?: string) {
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
      setError(getErrorMessage(res, 'Failed to save'));
      return false;
    }
    resetForm();
    setView('list');
    await refreshSession();
    return true;
  }

  function goToReview() {
    if (titleInvalid) {
      setError('Title is required');
      return;
    }
    setError('');
    setView('review');
  }

  async function saveAnnotation(imageDataUrl?: string) {
    if (editingId) {
      await persistAnnotation(imageDataUrl);
      return;
    }
    goToReview();
  }

  function startEdit(annotation: Annotation) {
    setEditingId(annotation.id);
    setActiveType(annotation.type);
    setTitle(annotation.title);
    setDescription(annotation.description ?? '');
    setError('');
    setView('compose');
  }

  async function removeAnnotation(id: string) {
    if (!confirm('Delete this annotation?')) return;
    setBusy(true);
    const res = await sendMessage({ type: 'DELETE_ANNOTATION', payload: { id } });
    setBusy(false);
    if (!res.ok) {
      setError(getErrorMessage(res, 'Failed to delete'));
      return;
    }
    if (editingId === id) resetForm();
    if (selectedId === id) {
      setSelectedId(null);
      setView('list');
    }
    await refreshSession();
  }

  async function captureFullScreenshot() {
    setError('');
    setBusy(true);
    try {
      const res = await sendMessage<string>({ type: 'CAPTURE_FULL_SCREENSHOT' });
      if (!res.ok || !res.data) {
        setError(getErrorMessage(res, 'Screenshot capture failed'));
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
      setError(getErrorMessage(res, 'Could not start crop'));
      return;
    }
    resetForm();
    setView('list');
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
    if (!res.ok) setError(getErrorMessage(res, 'Export failed'));
  }

  async function importJson(file: File) {
    const text = await file.text();
    const res = await sendMessage({ type: 'IMPORT_JSON', payload: { json: text } });
    if (!res.ok) {
      setError(getErrorMessage(res, 'Import failed'));
      return;
    }
    await refreshSession();
    setView('list');
  }

  async function clearSession() {
    if (!summary?.annotationsCount) return;
    if (!confirm('Reset current session?')) return;
    await sendMessage({ type: 'CLEAR_SESSION' });
    resetForm();
    setView('compose');
    await refreshSession();
  }

  function openReport() {
    if (!summary?.annotationsCount) return;
    chrome.tabs.create({ url: chrome.runtime.getURL('/report.html') });
  }

  return (
    <div className="flex min-h-screen flex-col" data-testid="sidepanel-root">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight">ET Session</h1>
            <p className="text-xs text-[var(--color-muted)]">Exploratory Testing</p>
          </div>
          {summary && summary.annotationsCount > 0 && (
            <Badge tone="neutral" data-testid="session-count">
              {summary.annotationsCount} items
            </Badge>
          )}
        </div>
        <nav className="mt-3 flex gap-4 border-b border-[var(--color-border)]">
          {(
            [
              ['compose', 'Compose'],
              ['list', 'Saved'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              data-testid={`nav-${mode}`}
              onClick={() => {
                setView(mode);
                setError('');
              }}
              className={cn(
                'border-b-2 pb-2 text-sm font-medium transition-colors',
                view === mode || (mode === 'list' && (view === 'detail' || view === 'review'))
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-[var(--color-muted)] hover:text-zinc-700',
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {view === 'compose' && (
          <div className="space-y-4">
            {editingId && (
              <p className="text-xs font-medium text-zinc-600" data-testid="editing-indicator">
                Editing annotation
              </p>
            )}
            <div className="flex gap-1 border-b border-[var(--color-border)]" data-testid="type-tabs">
              {ANNOTATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  data-testid={`type-tab-${type}`}
                  onClick={() => setActiveType(type)}
                  className={cn(
                    'flex-1 border-b-2 px-2 py-2 text-xs font-medium transition-colors',
                    activeType === type
                      ? 'text-zinc-900'
                      : 'border-transparent text-[var(--color-muted)] hover:text-zinc-700',
                  )}
                  style={
                    activeType === type
                      ? { borderBottomColor: `var(--color-${type})` }
                      : undefined
                  }
                >
                  {TYPE_LABELS[type]}
                  {summary && (summary[TYPE_COUNT_KEY[type]] as number) > 0 ? (
                    <span className="ml-1 opacity-70">({summary[TYPE_COUNT_KEY[type]]})</span>
                  ) : null}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
                Title (required)
              </label>
              <Input
                data-testid="annotation-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${TYPE_LABELS[activeType]} title`}
              />
            </div>

            <MarkdownEditor
              value={description}
              onChange={setDescription}
              label={descriptionLabel(activeType)}
              placeholder="Steps to reproduce, expected vs actual, notes…"
              testId="annotation-description"
            />

            {error && (
              <p className="text-xs text-red-600" data-testid="form-error">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                data-testid="save-annotation"
                disabled={busy || titleInvalid}
                onClick={() => void saveAnnotation()}
                className="flex-1"
              >
                {editingId ? 'Update' : 'Review'}
              </Button>
              <Button
                data-testid="screenshot-full"
                variant="outline"
                disabled={busy || !!editingId}
                onClick={() => void captureFullScreenshot()}
              >
                Full
              </Button>
              <Button
                data-testid="screenshot-crop"
                variant="outline"
                disabled={busy || titleInvalid || !!editingId}
                onClick={() => void startCrop()}
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
        )}

        {view === 'review' && (
          <AnnotationReview
            type={activeType}
            title={title.trim()}
            description={description}
            busy={busy}
            onBack={() => setView('compose')}
            onConfirm={() => void persistAnnotation()}
          />
        )}

        {view === 'list' && (
          <section data-testid="annotation-list">
            {annotations.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-muted)]">No saved annotations yet.</p>
            ) : (
              <ul className="space-y-2">
                {annotations.map((annotation) => (
                  <li key={annotation.id}>
                    <button
                      type="button"
                      data-testid={`annotation-item-${annotation.id}`}
                      onClick={() => {
                        setSelectedId(annotation.id);
                        setView('detail');
                      }}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-left shadow-sm transition-colors hover:bg-zinc-50"
                    >
                      <div className="flex items-center gap-2">
                        <Badge tone={annotation.type}>{annotation.type}</Badge>
                        <span className="truncate text-sm font-medium">{annotation.title}</span>
                      </div>
                      {annotation.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                          {annotation.description}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {view === 'detail' && selectedAnnotation && (
          <AnnotationDetail
            annotation={selectedAnnotation}
            onBack={() => setView('list')}
            onEdit={() => startEdit(selectedAnnotation)}
            onDelete={() => void removeAnnotation(selectedAnnotation.id)}
          />
        )}
      </main>

      <footer className="flex flex-wrap gap-2 border-t border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
        <Button data-testid="preview-report" variant="outline" size="sm" onClick={openReport}>
          Preview Report
        </Button>
        <div className="relative" ref={exportMenuRef}>
          <Button
            data-testid="export-menu-toggle"
            size="sm"
            variant="outline"
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
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-zinc-50"
                  onClick={() => void runExport(option.id)}
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
            if (file) void importJson(file);
            e.target.value = '';
          }}
        />
        <Button data-testid="reset-session" variant="destructive" size="sm" onClick={() => void clearSession()}>
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
              setError(getErrorMessage(res, 'Failed to save'));
              return;
            }
            setPendingScreenshot(null);
            resetForm();
            setView('list');
            await refreshSession();
          }}
        />
      )}
    </div>
  );
}
