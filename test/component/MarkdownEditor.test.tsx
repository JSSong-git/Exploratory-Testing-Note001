import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import '@/assets/styles/globals.css';

describe('MarkdownEditor', () => {
  afterEach(() => cleanup());

  it('switches between edit and preview tabs', () => {
    render(<MarkdownEditor value="**hello**" onChange={() => {}} />);
    expect(screen.getByTestId('markdown-editor-input')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('markdown-editor-tab-preview'));
    expect(screen.getByTestId('markdown-editor-preview')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
