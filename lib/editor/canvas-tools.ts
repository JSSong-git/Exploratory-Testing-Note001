export type EditorTool = 'arrow' | 'rectangle' | 'text' | 'blur';

export type EditorShape =
  | { kind: 'arrow'; x1: number; y1: number; x2: number; y2: number; color: string }
  | { kind: 'rectangle'; x: number; y: number; w: number; h: number; color: string }
  | { kind: 'text'; x: number; y: number; text: string; color: string }
  | { kind: 'blur'; x: number; y: number; w: number; h: number };

export const EDITOR_COLOR = '#dc2626';

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  const head = 12;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.font = 'bold 16px IBM Plex Sans, sans-serif';
  ctx.fillText(text, x, y);
}

export function drawBlurRegion(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (w < 1 || h < 1) return;
  const tmp = document.createElement('canvas');
  tmp.width = Math.max(1, Math.floor(w));
  tmp.height = Math.max(1, Math.floor(h));
  const tctx = tmp.getContext('2d');
  if (!tctx) return;
  tctx.drawImage(canvas, x, y, w, h, 0, 0, tmp.width, tmp.height);
  ctx.save();
  ctx.filter = 'blur(6px)';
  ctx.drawImage(tmp, x, y, w, h);
  ctx.restore();
}

export function renderShapes(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  shapes: EditorShape[],
) {
  for (const shape of shapes) {
    switch (shape.kind) {
      case 'arrow':
        drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2, shape.color);
        break;
      case 'rectangle':
        drawRectangle(ctx, shape.x, shape.y, shape.w, shape.h, shape.color);
        break;
      case 'text':
        drawText(ctx, shape.x, shape.y, shape.text, shape.color);
        break;
      case 'blur':
        drawBlurRegion(ctx, canvas, shape.x, shape.y, shape.w, shape.h);
        break;
    }
  }
}
