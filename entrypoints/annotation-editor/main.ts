import { AnnotationEditorController } from '@/lib/editor/annotation-editor-controller';
import type { EditorTool } from '@/lib/editor/canvas-tools';

const canvas = document.getElementById('annotation-canvas') as HTMLCanvasElement;
const controller = new AnnotationEditorController(canvas);
let initialized = false;

window.addEventListener('message', async (event) => {
  if (event.data?.type !== 'initAnnotationEditor' || initialized) return;
  initialized = true;
  await controller.loadImage(event.data.imageData as string);
});

document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    controller.setTool(btn.dataset.tool as EditorTool);
  });
});

document.getElementById('undo-btn')?.addEventListener('click', () => controller.undo());

document.getElementById('save-btn')?.addEventListener('click', () => {
  window.parent.postMessage(
    { type: 'annotationComplete', imageData: controller.exportDataUrl() },
    '*',
  );
});

document.getElementById('cancel-btn')?.addEventListener('click', () => {
  window.parent.postMessage({ type: 'annotationCancelled' }, '*');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.parent.postMessage({ type: 'annotationCancelled' }, '*');
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    controller.undo();
  }
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    window.parent.postMessage(
      { type: 'annotationComplete', imageData: controller.exportDataUrl() },
      '*',
    );
  }
});
