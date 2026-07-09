import { en } from '@/lib/i18n';
import { useAnnotationImage } from '@/hooks/useAnnotationImage';
import { cn } from '@/lib/utils';

interface AnnotationImageProps {
  imageId?: string;
  alt: string;
  variant?: 'thumbnail' | 'full';
  className?: string;
  testId?: string;
  onClick?: () => void;
}

export function AnnotationImage({
  imageId,
  alt,
  variant = 'full',
  className,
  testId = 'annotation-image',
  onClick,
}: AnnotationImageProps) {
  const { url, state } = useAnnotationImage(imageId);

  if (!imageId) return null;

  if (state === 'loading') {
    return (
      <p className="text-xs text-[var(--color-muted)]" data-testid={`${testId}-loading`}>
        {en.image.loading}
      </p>
    );
  }

  if (state === 'error' || !url) {
    return (
      <p className="text-xs text-[var(--color-muted)]" data-testid={`${testId}-error`}>
        {en.image.unavailable}
      </p>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'rounded border border-[var(--color-border)] object-contain',
        variant === 'thumbnail' ? 'h-10 w-14 shrink-0' : 'max-h-64 w-full',
        onClick && 'cursor-pointer hover:opacity-90',
        className,
      )}
    />
  );
}
