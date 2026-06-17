import type { Annotation } from '@/lib/core/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkdownView } from '@/components/MarkdownView';

const TYPE_LABELS = {
  bug: 'Bug',
  note: 'Note',
  idea: 'Idea',
  question: 'Question',
} as const;

interface AnnotationDetailProps {
  annotation: Annotation;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function AnnotationDetail({ annotation, onEdit, onDelete, onBack }: AnnotationDetailProps) {
  return (
    <section data-testid="annotation-detail" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button data-testid="detail-back" variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex gap-2">
          <Button data-testid="detail-edit" size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button data-testid="detail-delete" size="sm" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Badge tone={annotation.type}>{TYPE_LABELS[annotation.type]}</Badge>
          <span className="text-xs text-[var(--color-muted)]">
            {new Date(annotation.timestamp).toLocaleString()}
          </span>
        </div>
        <h2 className="text-base font-semibold">{annotation.title}</h2>
        <p className="mt-1 break-all text-xs text-[var(--color-muted)]">{annotation.url}</p>
        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">Description</p>
          <MarkdownView content={annotation.description ?? ''} emptyText="No description." />
        </div>
      </div>
    </section>
  );
}

interface AnnotationReviewProps {
  type: Annotation['type'];
  title: string;
  description: string;
  onBack: () => void;
  onConfirm: () => void;
  busy?: boolean;
}

export function AnnotationReview({
  type,
  title,
  description,
  onBack,
  onConfirm,
  busy,
}: AnnotationReviewProps) {
  return (
    <section data-testid="annotation-review" className="space-y-4">
      <h2 className="text-sm font-semibold">Review before saving</h2>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
        <Badge tone={type}>{TYPE_LABELS[type]}</Badge>
        <h3 className="mt-2 text-base font-semibold">{title}</h3>
        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          <MarkdownView content={description} emptyText="No description." />
        </div>
      </div>
      <div className="flex gap-2">
        <Button data-testid="review-back" variant="outline" className="flex-1" onClick={onBack}>
          Back to edit
        </Button>
        <Button data-testid="review-confirm" className="flex-1" disabled={busy} onClick={onConfirm}>
          Confirm save
        </Button>
      </div>
    </section>
  );
}
