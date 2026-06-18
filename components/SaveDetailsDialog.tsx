import { useState } from 'react';
import type { AnnotationType } from '@/lib/core/types';
import { ANNOTATION_TYPES } from '@/lib/core/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { cn } from '@/lib/utils';
import { ko, TYPE_LABELS, descriptionLabel, titlePlaceholder } from '@/lib/i18n/ko';

export interface SaveDetailsValues {
  annotationType: AnnotationType;
  title: string;
  description?: string;
}

interface SaveDetailsDialogProps {
  open: boolean;
  initialType: AnnotationType;
  initialTitle: string;
  initialDescription?: string;
  previewImageUrl?: string;
  onCancel: () => void;
  onConfirm: (values: SaveDetailsValues) => void | Promise<void>;
}

export function SaveDetailsDialog({
  open,
  initialType,
  initialTitle,
  initialDescription = '',
  previewImageUrl,
  onCancel,
  onConfirm,
}: SaveDetailsDialogProps) {
  const [activeType, setActiveType] = useState<AnnotationType>(initialType);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const titleInvalid = title.trim().length === 0;

  async function handleConfirm() {
    if (titleInvalid) {
      setError(ko.errors.titleRequired);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onConfirm({
        annotationType: activeType,
        title: title.trim(),
        description: description.trim() || undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      data-testid="save-details-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-details-heading"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-xl">
        <h2 id="save-details-heading" className="mb-3 text-base font-semibold">
          {ko.actions.confirmAnnotation}
        </h2>

        {previewImageUrl && (
          <img
            src={previewImageUrl}
            alt={ko.actions.screenshotPreview}
            className="mb-3 max-h-40 w-full rounded border border-[var(--color-border)] object-contain"
            data-testid="save-details-preview"
          />
        )}

        <div className="mb-3 flex gap-1 border-b border-[var(--color-border)]" data-testid="save-details-type-tabs">
          {ANNOTATION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              data-testid={`save-details-type-${type}`}
              onClick={() => setActiveType(type)}
              className={cn(
                'flex-1 border-b-2 px-2 py-2 text-xs font-medium transition-colors',
                activeType === type
                  ? 'text-zinc-900'
                  : 'border-transparent text-[var(--color-muted)]',
              )}
              style={
                activeType === type ? { borderBottomColor: `var(--color-${type})` } : undefined
              }
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
              {ko.form.titleRequired}
            </label>
            <Input
              data-testid="save-details-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder(activeType)}
            />
          </div>
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            label={descriptionLabel(activeType)}
            testId="save-details-description"
            minHeightClass="min-h-[180px]"
          />
          {error && (
            <p className="text-xs text-red-600" data-testid="save-details-error">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              data-testid="save-details-cancel"
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={onCancel}
            >
              {ko.actions.cancel}
            </Button>
            <Button
              data-testid="save-details-confirm"
              className="flex-1"
              disabled={busy || titleInvalid}
              onClick={handleConfirm}
            >
              {ko.actions.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
