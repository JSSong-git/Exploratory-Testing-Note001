import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { AnnotationType } from '@/lib/core/types';
import { SaveDetailsDialog } from '@/components/SaveDetailsDialog';
import '@/assets/styles/globals.css';

interface InitPayload {
  annotationType: AnnotationType;
  title: string;
  description?: string;
  imageDataUrl: string;
}

function SaveDetailsApp() {
  const [init, setInit] = useState<InitPayload | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'initSaveDetails') return;
      setInit({
        annotationType: event.data.annotationType,
        title: event.data.title ?? '',
        description: event.data.description,
        imageDataUrl: event.data.imageDataUrl,
      });
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'saveDetailsReady' }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!init) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }

  return (
    <SaveDetailsDialog
      open
      initialType={init.annotationType}
      initialTitle={init.title}
      initialDescription={init.description}
      previewImageUrl={init.imageDataUrl}
      onCancel={() => window.parent.postMessage({ type: 'saveDetailsCancelled' }, '*')}
      onConfirm={(values) => {
        window.parent.postMessage(
          {
            type: 'saveDetailsConfirmed',
            ...values,
            imageDataUrl: init.imageDataUrl,
          },
          '*',
        );
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SaveDetailsApp />
  </React.StrictMode>,
);
