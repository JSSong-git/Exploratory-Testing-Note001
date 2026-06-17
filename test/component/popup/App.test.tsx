import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '@/entrypoints/popup/App';
import { sendMessage } from '@/lib/messaging/client';
import '@/assets/styles/globals.css';

vi.mock('@/lib/messaging/client', () => ({
  sendMessage: vi.fn(),
}));

const mockSendMessage = vi.mocked(sendMessage);

const browserInfo = {
  brand: 'Chrome',
  browserVersion: '1',
  os: 'Win',
  osVersion: '',
  cookies: true,
  language: 'en',
  timezone: 'UTC',
  screenResolution: '1920x1080',
};

function mockSessionResponses() {
  mockSendMessage.mockImplementation(async (message) => {
    if (message.type === 'GET_SESSION_SUMMARY') {
      return {
        ok: true,
        data: { bugs: 1, notes: 0, ideas: 0, questions: 0, annotationsCount: 1 },
      };
    }
    if (message.type === 'GET_FULL_SESSION') {
      return {
        ok: true,
        data: {
          startDateTime: Date.now(),
          browserInfo,
          annotations: [
            {
              id: 'a1',
              type: 'bug',
              title: 'Existing bug',
              url: 'https://example.com',
              timestamp: Date.now(),
            },
          ],
        },
      };
    }
    return { ok: true };
  });
}

describe('Popup App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionResponses();
    vi.stubGlobal('chrome', {
      tabs: { create: vi.fn() },
      runtime: { getURL: vi.fn((path: string) => `chrome-extension://test${path}`) },
    });
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders popup shell and type tabs', async () => {
    render(<App />);
    expect(screen.getByTestId('popup-root')).toBeInTheDocument();
    expect(screen.getByTestId('type-tab-bug')).toBeInTheDocument();
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());
  });

  it('disables save and crop when title is empty', () => {
    render(<App />);
    expect(screen.getByTestId('save-annotation')).toBeDisabled();
    expect(screen.getByTestId('screenshot-crop')).toBeDisabled();
    expect(screen.getByTestId('screenshot-full')).toBeEnabled();
  });

  it('shows session count and annotation list', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('session-count')).toHaveTextContent('1 items');
      expect(screen.getByTestId('annotation-list')).toBeInTheDocument();
      expect(screen.getByText('Existing bug')).toBeInTheDocument();
    });
  });

  it('opens export menu with inline markdown option', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('export-menu-toggle'));
    expect(screen.getByTestId('export-markdown-inline')).toBeVisible();
  });

  it('enters edit mode and sends UPDATE_ANNOTATION', async () => {
    render(<App />);
    await waitFor(() => screen.getByTestId('edit-annotation-a1'));

    fireEvent.click(screen.getByTestId('edit-annotation-a1'));
    expect(screen.getByTestId('editing-indicator')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('annotation-title'), { target: { value: 'Updated bug' } });
    fireEvent.click(screen.getByTestId('save-annotation'));

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_ANNOTATION',
        payload: {
          id: 'a1',
          title: 'Updated bug',
          description: undefined,
        },
      });
    });
  });

  it('deletes annotation when confirmed', async () => {
    render(<App />);
    await waitFor(() => screen.getByTestId('delete-annotation-a1'));
    fireEvent.click(screen.getByTestId('delete-annotation-a1'));

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'DELETE_ANNOTATION',
        payload: { id: 'a1' },
      });
    });
  });
});
