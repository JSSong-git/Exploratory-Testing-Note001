/** Notify open extension pages (side panel, report) that session data changed. */
export function broadcastSessionChanged(): void {
  try {
    void chrome.runtime.sendMessage({ type: 'SESSION_CHANGED' }).catch(() => {
      // No listeners yet (e.g. side panel closed) — ignore.
    });
  } catch {
    // chrome may be unavailable in unit/integration test environments.
  }
}
