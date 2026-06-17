import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'bug' | 'note' | 'idea' | 'question' | 'neutral';
};

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  bug: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  note: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  idea: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  question: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  neutral: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
