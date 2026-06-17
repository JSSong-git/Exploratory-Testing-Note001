import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownViewProps {
  content: string;
  className?: string;
  emptyText?: string;
}

export function MarkdownView({ content, className, emptyText = '—' }: MarkdownViewProps) {
  const trimmed = content.trim();
  if (!trimmed) {
    return <span className="text-[var(--color-muted)]">{emptyText}</span>;
  }

  return (
    <div className={cn('markdown-body', className)} data-testid="markdown-view">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{trimmed}</ReactMarkdown>
    </div>
  );
}
