import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownView } from '@/components/MarkdownView';
import { cn } from '@/lib/utils';

type EditorTab = 'edit' | 'preview';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  testId?: string;
  minHeightClass?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder = 'Write in Markdown…',
  testId = 'markdown-editor',
  minHeightClass = 'min-h-[240px]',
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<EditorTab>('edit');

  return (
    <div data-testid={testId}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{label}</label>
      )}
      <div className="mb-2 flex gap-4 border-b border-[var(--color-border)]">
        {(['edit', 'preview'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            data-testid={`${testId}-tab-${mode}`}
            onClick={() => setTab(mode)}
            className={cn(
              'border-b-2 px-1 pb-2 text-xs font-medium capitalize transition-colors',
              tab === mode
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-[var(--color-muted)] hover:text-zinc-700',
            )}
          >
            {mode}
          </button>
        ))}
      </div>
      {tab === 'edit' ? (
        <>
          <Textarea
            data-testid={`${testId}-input`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn('font-mono text-[13px] leading-relaxed', minHeightClass)}
          />
          <p className="mt-1.5 text-[10px] text-[var(--color-muted)]">
            **bold** · - list · `code` · ## heading
          </p>
        </>
      ) : (
        <div
          className={cn(
            'rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm',
            minHeightClass,
          )}
          data-testid={`${testId}-preview`}
        >
          <MarkdownView content={value} emptyText="Nothing to preview yet." />
        </div>
      )}
    </div>
  );
}
