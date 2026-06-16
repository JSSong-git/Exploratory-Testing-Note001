export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    let selectionBox: HTMLDivElement | null = null;
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let cropDraft: { annotationType: string; title: string; description?: string } | null = null;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'START_CROP') {
        cropDraft = message.draft;
        initSelection();
        sendResponse({ ok: true });
      }
      return true;
    });

    function initSelection() {
      if (!selectionBox) {
        selectionBox = document.createElement('div');
        selectionBox.id = 'et-selection-box';
        selectionBox.style.cssText =
          'position:fixed;z-index:2147483647;border:2px dashed #38bdf8;background:rgba(56,189,248,0.15);pointer-events:none;display:none;';
        document.body.appendChild(selectionBox);
      }
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('keydown', onKeyDown);
    }

    function onMouseDown(e: MouseEvent) {
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
      selectionBox.style.display = 'none';

      if (width < 4 || height < 4) {
        cleanup();
        return;
      }

      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));

      const dpr = window.devicePixelRatio || 1;
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

      if (response?.ok && response.data) {
        await openAnnotationEditor(response.data as string);
      }
      cleanup();
    }

    function openAnnotationEditor(imageData: string): Promise<void> {
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.id = 'et-annotation-editor';
        iframe.style.cssText =
          'position:fixed;inset:0;border:none;z-index:2147483647;width:100%;height:100%;';
        iframe.src = chrome.runtime.getURL('/annotation-editor.html');
        document.body.appendChild(iframe);

        const draft = cropDraft;

        const onMessage = async (event: MessageEvent) => {
          if (event.source !== iframe.contentWindow) return;
          if (event.data?.type === 'annotationComplete') {
            await chrome.runtime.sendMessage({
              type: 'SAVE_CROPPED_ANNOTATION',
              payload: {
                annotationType: draft!.annotationType,
                title: draft!.title,
                description: draft!.description,
                imageDataUrl: event.data.imageData,
              },
            });
            closeEditor();
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
          iframe.contentWindow?.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
        });
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') cleanup();
    }

    function cleanup() {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
      if (selectionBox) selectionBox.style.display = 'none';
      cropDraft = null;
    }
  },
});
