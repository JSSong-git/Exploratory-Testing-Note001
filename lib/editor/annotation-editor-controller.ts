import {
  EDITOR_COLOR,
  clientToCanvasPoint,
  drawArrow,
  drawBlurRegion,
  drawRectangle,
  type EditorShape,
  type EditorTool,
  renderShapes,
} from '@/lib/editor/canvas-tools';

export class AnnotationEditorController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private baseImage = new Image();
  private shapes: EditorShape[] = [];
  private undoStack: EditorShape[][] = [];
  private tool: EditorTool = 'arrow';
  private drawing = false;
  private startX = 0;
  private startY = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unsupported');
    this.canvas = canvas;
    this.ctx = ctx;
    this.bindEvents();
  }

  setTool(tool: EditorTool) {
    this.tool = tool;
  }

  loadImage(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.baseImage.onload = () => {
        this.canvas.width = this.baseImage.width;
        this.canvas.height = this.baseImage.height;
        this.redraw();
        resolve();
      };
      this.baseImage.onerror = () => reject(new Error('Failed to load image'));
      this.baseImage.src = dataUrl;
    });
  }

  undo() {
    if (this.shapes.length === 0) return;
    this.undoStack.push([...this.shapes]);
    this.shapes.pop();
    this.redraw();
  }

  exportDataUrl(): string {
    this.redraw();
    // JPEG keeps chrome.runtime message payloads small enough for reliable saves.
    return this.canvas.toDataURL('image/jpeg', 0.85);
  }

  private bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
  }

  private getPos(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return clientToCanvasPoint(
      e.clientX,
      e.clientY,
      rect,
      this.canvas.width,
      this.canvas.height,
    );
  }

  private onPointerDown(e: MouseEvent) {
    if (this.tool === 'text') return;
    const { x, y } = this.getPos(e);
    this.drawing = true;
    this.startX = x;
    this.startY = y;
  }

  private onPointerMove(e: MouseEvent) {
    if (!this.drawing || this.tool === 'text') return;
    const { x, y } = this.getPos(e);
    this.redraw();
    const color = EDITOR_COLOR;
    if (this.tool === 'arrow') {
      drawArrow(this.ctx, this.startX, this.startY, x, y, color);
    } else if (this.tool === 'rectangle') {
      drawRectangle(this.ctx, this.startX, this.startY, x - this.startX, y - this.startY, color);
    } else if (this.tool === 'blur') {
      drawBlurRegion(this.ctx, this.canvas, this.startX, this.startY, x - this.startX, y - this.startY);
    }
  }

  private onPointerUp(e: MouseEvent) {
    if (!this.drawing || this.tool === 'text') return;
    this.drawing = false;
    const { x, y } = this.getPos(e);
    const color = EDITOR_COLOR;
    if (this.tool === 'arrow') {
      this.pushShape({ kind: 'arrow', x1: this.startX, y1: this.startY, x2: x, y2: y, color });
    } else if (this.tool === 'rectangle') {
      this.pushShape({
        kind: 'rectangle',
        x: this.startX,
        y: this.startY,
        w: x - this.startX,
        h: y - this.startY,
        color,
      });
    } else if (this.tool === 'blur') {
      this.pushShape({
        kind: 'blur',
        x: this.startX,
        y: this.startY,
        w: x - this.startX,
        h: y - this.startY,
      });
    }
    this.redraw();
  }

  private onClick(e: MouseEvent) {
    if (this.tool !== 'text') return;
    const { x, y } = this.getPos(e);
    const text = window.prompt('Enter label text');
    if (!text?.trim()) return;
    this.pushShape({ kind: 'text', x, y, text: text.trim(), color: EDITOR_COLOR });
    this.redraw();
  }

  private pushShape(shape: EditorShape) {
    this.undoStack.push([...this.shapes]);
    this.shapes.push(shape);
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.baseImage, 0, 0);
    renderShapes(this.ctx, this.canvas, this.shapes);
  }
}
