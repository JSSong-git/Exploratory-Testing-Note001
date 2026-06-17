import { useState } from 'react';
import type { AnnotationType } from '@/lib/core/types';
import { ANNOTATION_TYPES } from '@/lib/core/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const TYPE_LABELS: Record<AnnotationType, string> = {
  bug: 'Bug',
  note: 'Note',
  idea: 'Idea',
  question: 'Question',
};

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
      setError('Title is required');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      data-testid="save-details-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-details-heading"
    >
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-xl">
        <h2 id="save-details-heading" className="mb-3 text-base font-semibold">
          Confirm annotation
        </h2>

        {previewImageUrl && (
          <img
            src={previewImageUrl}
            alt="Screenshot preview"
            className="mb-3 max-h-32 w-full rounded border border-[var(--color-border)] object-contain"
            data-testid="save-details-preview"
          />
        )}

        <div className="mb-3 flex gap-1" data-testid="save-details-type-tabs">
          {ANNOTATION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              data-testid={`save-details-type-${type}`}
              onClick={() => setActiveType(type)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                activeType === type
                  ? 'bg-sky-500 text-white'
                  : 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-white'
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[var(--color-muted)]">Title (required)</label>
            <Input
              data-testid="save-details-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${TYPE_LABELS[activeType]} title`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-muted)]">Description (optional)</label>
            <Textarea
              data-testid="save-details-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400" data-testid="save-details-error">
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
              Cancel
            </Button>
            <Button
              data-testid="save-details-confirm"
              className="flex-1"
              disabled={busy || titleInvalid}
              onClick={handleConfirm}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
