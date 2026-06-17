import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-sm text-[var(--color-foreground)] shadow-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1',
        className,
      )}
      {...props}
    />
  );
}
