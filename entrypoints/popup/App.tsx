import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnnotationType } from '@/lib/core/types';
import { ANNOTATION_TYPES } from '@/lib/core/types';
import type { SessionSummary } from '@/lib/messaging/protocol';
import { sendMessage } from '@/lib/messaging/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

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

export default function App() {
  const [activeType, setActiveType] = useState<AnnotationType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const refreshSummary = useCallback(async () => {
    const res = await sendMessage<SessionSummary>({ type: 'GET_SESSION_SUMMARY' });
    if (res.ok && res.data) setSummary(res.data as SessionSummary);
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  const titleInvalid = title.trim().length === 0;

  async function saveAnnotation(imageDataUrl?: string) {
    if (titleInvalid) {
      setError('Title is required');
      return;
    }
    setBusy(true);
    setError('');
    const res = await sendMessage({
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
    setTitle('');
    setDescription('');
    await refreshSummary();
  }

  async function captureFullScreenshot() {
    if (titleInvalid) {
      setError('Title is required before screenshot');
      return;
    }
    const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
    await saveAnnotation(dataUrl);
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
    setTitle('');
    setDescription('');
    window.close();
  }

  async function exportDefault() {
    const res = await sendMessage({ type: 'EXPORT_MARKDOWN' });
    if (!res.ok) setError(res.error ?? 'Export failed');
  }

  async function importJson(file: File) {
    const text = await file.text();
    const res = await sendMessage({ type: 'IMPORT_JSON', payload: { json: text } });
    if (!res.ok) {
      setError(res.error ?? 'Import failed');
      return;
    }
    await refreshSummary();
  }

  async function clearSession() {
    if (!summary?.annotationsCount) return;
    if (!confirm('Reset current session?')) return;
    await sendMessage({ type: 'CLEAR_SESSION' });
    await refreshSummary();
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
            Save
          </Button>
          <Button
            data-testid="screenshot-full"
            variant="outline"
            disabled={busy || titleInvalid}
            onClick={captureFullScreenshot}
          >
            Full
          </Button>
          <Button
            data-testid="screenshot-crop"
            variant="outline"
            disabled={busy || titleInvalid}
            onClick={startCrop}
          >
            Crop
          </Button>
        </div>
      </div>

      <footer className="mt-6 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
        <Button data-testid="preview-report" variant="outline" size="sm" onClick={openReport}>
          Preview Report
        </Button>
        <Button data-testid="export-markdown" size="sm" onClick={exportDefault}>
          Export MD
        </Button>
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
    </div>
  );
}
