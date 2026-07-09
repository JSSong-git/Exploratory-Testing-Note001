import { en } from '@/lib/i18n';

declare global {
  interface Window {
    __etCropContentLoaded?: boolean;
  }
}

function showPageNotice(message: string) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText =
    'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
    'background:#1e293b;color:#f8fafc;padding:10px 16px;border-radius:8px;font:14px system-ui,sans-serif;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.25);max-width:90vw;text-align:center;';
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 4000);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    if (window.__etCropContentLoaded) return;
    window.__etCropContentLoaded = true;

    let overlay: HTMLDivElement | null = null;
    let selectionBox: HTMLDivElement | null = null;
    let hint: HTMLDivElement | null = null;
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let cropDraft: { annotationType: string; title: string; description?: string } | null = null;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'PING_CROP') {
        sendResponse({ ok: true });
        return false;
      }
      if (message.type === 'START_CROP') {
        cropDraft = message.draft;
        initSelection();
        sendResponse({ ok: true });
      }
      return true;
    });

    function initSelection() {
      cleanupUi(false);

      overlay = document.createElement('div');
      overlay.id = 'et-crop-overlay';
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:2147483646;cursor:crosshair;' +
        'background:rgba(15,23,42,0.28);';

      hint = document.createElement('div');
      hint.textContent = en.notices.cropPageHint;
      hint.style.cssText =
        'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
        'background:#0f172a;color:#f8fafc;padding:10px 16px;border-radius:8px;' +
        'font:13px system-ui,sans-serif;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.25);';

      selectionBox = document.createElement('div');
      selectionBox.id = 'et-selection-box';
      selectionBox.style.cssText =
        'position:fixed;z-index:2147483647;border:2px dashed #38bdf8;' +
        'background:rgba(56,189,248,0.18);pointer-events:none;display:none;';

      document.body.appendChild(overlay);
      document.body.appendChild(hint);
      document.body.appendChild(selectionBox);

      overlay.addEventListener('mousedown', onMouseDown);
      document.addEventListener('keydown', onKeyDown);
    }

    function onMouseDown(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      isDrawing = true;
      startX = e.clientX;
      startY = e.clientY;
      if (selectionBox) {
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
      }
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDrawing || !selectionBox) return;
      e.preventDefault();
      const x = Math.min(startX, e.clientX);
      const y = Math.min(startY, e.clientY);
      selectionBox.style.left = `${x}px`;
      selectionBox.style.top = `${y}px`;
      selectionBox.style.width = `${Math.abs(e.clientX - startX)}px`;
      selectionBox.style.height = `${Math.abs(e.clientY - startY)}px`;
    }

    async function onMouseUp(e: MouseEvent) {
      if (!isDrawing || !selectionBox || !cropDraft) return;
      isDrawing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      const x = Math.min(startX, e.clientX);
      const y = Math.min(startY, e.clientY);
      const width = Math.abs(e.clientX - startX);
      const height = Math.abs(e.clientY - startY);

      if (width < 4 || height < 4) {
        cleanup();
        return;
      }

      // Hide UI before capture so the overlay is not in the screenshot.
      cleanupUi(true);
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));

      const dpr = window.devicePixelRatio || 1;
      const draft = cropDraft;
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_CROP_SCREENSHOT',
        payload: {
          coordinates: {
            x: x * dpr,
            y: y * dpr,
            width: width * dpr,
            height: height * dpr,
          },
        },
      });

      cropDraft = null;
      document.removeEventListener('keydown', onKeyDown);

      if (response?.ok && response.data) {
        await openAnnotationEditor(response.data as string, draft!);
      } else {
        showPageNotice(
          typeof response?.error === 'string'
            ? response.error
            : en.errors.cropCaptureFailed,
        );
      }
    }

    function openAnnotationEditor(
      imageData: string,
      draft: { annotationType: string; title: string; description?: string },
    ): Promise<void> {
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.id = 'et-annotation-editor';
        iframe.style.cssText =
          'position:fixed;inset:0;border:none;z-index:2147483647;width:100%;height:100%;';
        iframe.src = chrome.runtime.getURL('/annotation-editor.html');

        let editorReady = false;

        const onMessage = async (event: MessageEvent) => {
          if (event.source !== iframe.contentWindow) return;

          if (event.data?.type === 'annotationEditorReady' && !editorReady) {
            editorReady = true;
            iframe.contentWindow?.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
            return;
          }

          if (event.data?.type === 'annotationComplete') {
            closeEditor();
            await openSaveDetailsDialog(event.data.imageData as string, draft);
            resolve();
          } else if (event.data?.type === 'annotationCancelled') {
            closeEditor();
            resolve();
          }
        };

        function closeEditor() {
          window.removeEventListener('message', onMessage);
          iframe.remove();
        }

        window.addEventListener('message', onMessage);
        iframe.addEventListener('load', () => {
          if (!editorReady) {
            iframe.contentWindow?.postMessage({ type: 'requestAnnotationEditorReady' }, '*');
          }
        });
        document.body.appendChild(iframe);
      });
    }

    function openSaveDetailsDialog(
      imageData: string,
      draft: { annotationType: string; title: string; description?: string },
    ): Promise<void> {
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.id = 'et-save-details';
        iframe.style.cssText =
          'position:fixed;inset:0;border:none;z-index:2147483647;width:100%;height:100%;';
        iframe.src = chrome.runtime.getURL('/save-details.html');

        let confirmed = false;

        const sendInit = () => {
          iframe.contentWindow?.postMessage(
            {
              type: 'initSaveDetails',
              annotationType: draft.annotationType,
              title: draft.title,
              description: draft.description,
              imageDataUrl: imageData,
            },
            '*',
          );
        };

        const onMessage = async (event: MessageEvent) => {
          if (event.source !== iframe.contentWindow) return;

          if (event.data?.type === 'saveDetailsReady' && !confirmed) {
            sendInit();
            return;
          }

          if (event.data?.type === 'saveDetailsConfirmed') {
            if (confirmed) return;
            confirmed = true;
            const title = String(event.data.title ?? draft.title ?? '').trim();
            const annotationType = event.data.annotationType ?? draft.annotationType;
            const description =
              typeof event.data.description === 'string'
                ? event.data.description
                : draft.description;
            try {
              if (!title) {
                confirmed = false;
                showPageNotice(en.errors.titleRequired);
                return;
              }
              if (!imageData) {
                closeDialog();
                showPageNotice(en.errors.saveFailed);
                resolve();
                return;
              }
              const response = await chrome.runtime.sendMessage({
                type: 'SAVE_CROPPED_ANNOTATION',
                payload: {
                  annotationType,
                  title,
                  description,
                  imageDataUrl: imageData,
                },
              });
              closeDialog();
              if (!response?.ok) {
                showPageNotice(
                  typeof response?.error === 'string'
                    ? response.error
                    : en.errors.saveFailed,
                );
              } else {
                showPageNotice(en.notify.savedMessage(title));
              }
            } catch (err) {
              closeDialog();
              showPageNotice(err instanceof Error ? err.message : en.errors.saveFailed);
            }
            resolve();
          } else if (event.data?.type === 'saveDetailsCancelled') {
            closeDialog();
            resolve();
          }
        };

        function closeDialog() {
          window.removeEventListener('message', onMessage);
          iframe.remove();
        }

        window.addEventListener('message', onMessage);
        iframe.addEventListener('load', () => {
          if (!confirmed) {
            iframe.contentWindow?.postMessage({ type: 'requestSaveDetailsReady' }, '*');
          }
        });
        document.body.appendChild(iframe);
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') cleanup();
    }

    function cleanupUi(keepDraft: boolean) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      overlay?.remove();
      selectionBox?.remove();
      hint?.remove();
      overlay = null;
      selectionBox = null;
      hint = null;
      isDrawing = false;
      if (!keepDraft) {
        document.removeEventListener('keydown', onKeyDown);
      }
    }

    function cleanup() {
      cleanupUi(false);
      cropDraft = null;
    }
  },
});
