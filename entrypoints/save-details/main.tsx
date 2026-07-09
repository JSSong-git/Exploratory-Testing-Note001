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
    let hasInit = false;
    const announceReady = () => {
      window.parent.postMessage({ type: 'saveDetailsReady' }, '*');
    };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'requestSaveDetailsReady') {
        if (!hasInit) announceReady();
        return;
      }
      if (event.data?.type !== 'initSaveDetails') return;
      hasInit = true;
      setInit({
        annotationType: event.data.annotationType,
        title: event.data.title ?? '',
        description: event.data.description,
        imageDataUrl: event.data.imageDataUrl,
      });
    };
    window.addEventListener('message', onMessage);
    announceReady();
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
        // Do not post the screenshot back — parent content script already holds it.
        // Re-sending a large data URL through cross-origin postMessage often fails silently.
        window.parent.postMessage(
          {
            type: 'saveDetailsConfirmed',
            annotationType: values.annotationType,
            title: values.title,
            description: values.description,
          },
          '*',
        );
      }}
    />
  );
}

// Avoid StrictMode double-mount: parent iframe handshake is one-shot.
ReactDOM.createRoot(document.getElementById('root')!).render(<SaveDetailsApp />);
