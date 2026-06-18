import { useEffect, useState } from 'react';
import { getImage } from '@/lib/storage/image-store';

export type ImageLoadState = 'idle' | 'loading' | 'ready' | 'error';

export function useAnnotationImage(imageId?: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<ImageLoadState>('idle');

  useEffect(() => {
    if (!imageId) {
      setUrl(null);
      setState('idle');
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setState('loading');

    getImage(imageId)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setUrl(null);
          setState('error');
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null);
          setState('error');
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  return { url, state };
}
