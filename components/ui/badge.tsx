import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'bug' | 'note' | 'idea' | 'question' | 'neutral';
};

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  bug: 'bg-red-500/20 text-red-300',
  note: 'bg-blue-500/20 text-blue-300',
  idea: 'bg-amber-500/20 text-amber-300',
  question: 'bg-purple-500/20 text-purple-300',
  neutral: 'bg-slate-500/20 text-slate-300',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
