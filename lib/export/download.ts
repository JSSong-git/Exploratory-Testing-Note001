export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({ url, filename, saveAs: true });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

export async function downloadText(content: string, filename: string, mime: string): Promise<void> {
  const blob = new Blob([content], { type: mime });
  await downloadBlob(blob, filename);
}

export function sessionFilename(session: { browserInfo: { brand: string; browserVersion: string }; startDateTime: number }, ext: string): string {
  const date = new Date(session.startDateTime);
  const stamp =
    date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    '_' +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0');
  const browser = `${session.browserInfo.brand}_${session.browserInfo.browserVersion}`.replace(/\s+/g, '_');
  return `ExploratorySession_${browser}_${stamp}.${ext}`;
}
