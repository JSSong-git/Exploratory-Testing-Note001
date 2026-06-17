import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SaveDetailsDialog } from '@/components/SaveDetailsDialog';

describe('SaveDetailsDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('disables confirm when title is empty', () => {
    render(
      <SaveDetailsDialog
        open
        initialType="bug"
        initialTitle=""
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByTestId('save-details-confirm')).toBeDisabled();
  });

  it('calls onConfirm with trimmed values', async () => {
    const onConfirm = vi.fn();
    render(
      <SaveDetailsDialog
        open
        initialType="note"
        initialTitle="Draft"
        initialDescription=" details "
        onCancel={() => {}}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByTestId('save-details-confirm'));
    expect(onConfirm).toHaveBeenCalledWith({
      annotationType: 'note',
      title: 'Draft',
      description: 'details',
    });
  });

  it('invokes onCancel', () => {
    const onCancel = vi.fn();
    render(
      <SaveDetailsDialog
        open
        initialType="bug"
        initialTitle="x"
        onCancel={onCancel}
        onConfirm={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('save-details-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
