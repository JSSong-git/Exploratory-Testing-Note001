import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AnnotationDetail } from '@/components/AnnotationDetail';
import '@/assets/styles/globals.css';

vi.mock('@/hooks/useAnnotationImage', () => ({
  useAnnotationImage: (imageId?: string) => ({
    url: imageId ? 'blob:mock' : null,
    state: imageId ? 'ready' : 'idle',
  }),
}));

describe('AnnotationDetail', () => {
  afterEach(() => cleanup());

  it('renders screenshot when imageId is present', () => {
    render(
      <AnnotationDetail
        annotation={{
          id: 'a1',
          type: 'bug',
          title: 'Defect title',
          url: 'https://example.com',
          timestamp: Date.now(),
          description: 'Details',
          imageId: 'img-1',
        }}
        onBack={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByTestId('annotation-detail-image')).toBeInTheDocument();
  });

  it('omits screenshot section without imageId', () => {
    render(
      <AnnotationDetail
        annotation={{
          id: 'a2',
          type: 'note',
          title: 'Observation record',
          url: 'https://example.com',
          timestamp: Date.now(),
        }}
        onBack={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.queryByTestId('annotation-detail-image')).not.toBeInTheDocument();
  });
});
