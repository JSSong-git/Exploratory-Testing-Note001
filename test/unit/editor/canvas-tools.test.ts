import { describe, expect, it, vi } from 'vitest';
import {
  clientToCanvasPoint,
  drawArrow,
  drawRectangle,
  drawText,
  renderShapes,
  type EditorShape,
} from '@/lib/editor/canvas-tools';

describe('clientToCanvasPoint', () => {
  it('scales pointer coordinates to canvas space', () => {
    const point = clientToCanvasPoint(
      150,
      250,
      { left: 50, top: 100, width: 200, height: 400 },
      400,
      800,
    );
    expect(point).toEqual({ x: 200, y: 300 });
  });
});

function createMockContext() {
  return {
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    font: '',
    filter: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('canvas draw helpers', () => {
  it('renderShapes invokes rectangle drawing', () => {
    const ctx = createMockContext();
    const canvas = document.createElement('canvas');

    renderShapes(ctx, canvas, [
      { kind: 'rectangle', x: 10, y: 10, w: 20, h: 20, color: '#dc2626' },
    ]);

    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 10, 20, 20);
  });

  it('drawArrow and drawText mutate canvas context', () => {
    const ctx = createMockContext();

    drawArrow(ctx, 0, 0, 40, 40, '#dc2626');
    drawText(ctx, 5, 15, 'Bug', '#dc2626');

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('Bug', 5, 15);
  });

  it('renderShapes dispatches arrow and text shapes', () => {
    const ctx = createMockContext();
    const canvas = document.createElement('canvas');
    const shapes: EditorShape[] = [
      { kind: 'arrow', x1: 0, y1: 0, x2: 10, y2: 10, color: '#dc2626' },
      { kind: 'text', x: 1, y: 2, text: 'Hi', color: '#dc2626' },
    ];

    renderShapes(ctx, canvas, shapes);

    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('Hi', 1, 2);
  });
});
