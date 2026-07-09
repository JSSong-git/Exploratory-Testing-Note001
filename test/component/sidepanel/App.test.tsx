import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '@/entrypoints/sidepanel/App';
import { sendMessage } from '@/lib/messaging/client';
import '@/assets/styles/globals.css';

vi.mock('@/lib/messaging/client', () => ({
  sendMessage: vi.fn(),
  getErrorMessage: (res: { ok: boolean; error?: string }, fallback?: string) =>
    !res.ok ? res.error ?? fallback ?? 'Failed' : fallback ?? 'Failed',
}));

vi.mock('@/lib/storage/draft-store', () => ({
  loadComposeDraft: vi.fn(async () => null),
  saveComposeDraft: vi.fn(async () => {}),
  clearComposeDraft: vi.fn(async () => {}),
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
              description: '**steps**',
            },
          ],
        },
      };
    }
    return { ok: true };
  });
}

describe('Side Panel App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionResponses();
    vi.stubGlobal('chrome', {
      tabs: { create: vi.fn() },
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://test${path}`),
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
        sendMessage: vi.fn(),
      },
      storage: {
        local: { set: vi.fn(), get: vi.fn(), remove: vi.fn() },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders side panel shell and type tabs', async () => {
    render(<App />);
    expect(screen.getByTestId('sidepanel-root')).toBeInTheDocument();
    expect(screen.getByTestId('type-tab-bug')).toBeInTheDocument();
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());
  });

  it('shows review step before saving new annotation', async () => {
    render(<App />);
    fireEvent.change(screen.getByTestId('annotation-title'), { target: { value: 'New bug' } });
    fireEvent.change(screen.getByTestId('annotation-description-input'), {
      target: { value: '## Details' },
    });
    fireEvent.click(screen.getByTestId('save-annotation'));
    expect(screen.getByTestId('annotation-review')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('review-confirm'));
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'ADD_ANNOTATION',
        payload: expect.objectContaining({
          title: 'New bug',
          description: '## Details',
        }),
      });
    });
  });

  it('enters edit mode from saved list', async () => {
    render(<App />);
    await waitFor(() => screen.getByTestId('nav-list'));
    fireEvent.click(screen.getByTestId('nav-list'));
    fireEvent.click(screen.getByTestId('annotation-item-a1'));
    fireEvent.click(screen.getByTestId('detail-edit'));
    expect(screen.getByTestId('editing-indicator')).toBeInTheDocument();
  });
});
