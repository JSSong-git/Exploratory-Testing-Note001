import type { Session, Annotation } from '@/lib/core/types';
import { getImage } from '@/lib/storage/image-store';

function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function imageToDataUrl(annotation: Annotation): Promise<string | null> {
  if (!annotation.imageId) return null;
  const blob = await getImage(annotation.imageId);
  if (!blob) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function buildStandaloneHtml(session: Session): Promise<string> {
  const annotationBlocks: string[] = [];

  for (const annotation of session.annotations) {
    const typeLabel = annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1);
    let block = `<article class="annotation annotation-${annotation.type}">`;
    block += `<h3>[${escapeHtml(typeLabel)}] ${escapeHtml(annotation.title)}</h3>`;
    block += `<ul><li><strong>URL:</strong> ${escapeHtml(annotation.url)}</li>`;
    block += `<li><strong>Time:</strong> ${formatTimestamp(annotation.timestamp)}</li>`;
    if (annotation.description) {
      block += `<li><strong>Description:</strong> ${escapeHtml(annotation.description)}</li>`;
    }
    block += '</ul>';
    const dataUrl = await imageToDataUrl(annotation);
    if (dataUrl) {
      block += `<img src="${dataUrl}" alt="${escapeHtml(annotation.title)}" />`;
    }
    block += '</article>';
    annotationBlocks.push(block);
  }

  const counts = { bug: 0, note: 0, idea: 0, question: 0 };
  for (const a of session.annotations) counts[a.type]++;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exploratory Testing Session</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; color: #0f172a; }
    h1 { margin-bottom: 0.5rem; }
    .meta { color: #64748b; margin-bottom: 2rem; }
    .summary { margin-bottom: 2rem; }
    .annotation { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .annotation-bug { border-left: 4px solid #dc2626; }
    .annotation-note { border-left: 4px solid #2563eb; }
    .annotation-idea { border-left: 4px solid #d97706; }
    .annotation-question { border-left: 4px solid #7c3aed; }
    img { max-width: 100%; margin-top: 0.75rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Exploratory Testing Session</h1>
  <p class="meta">Started ${formatTimestamp(session.startDateTime)} · ${escapeHtml(session.browserInfo.brand)} ${escapeHtml(session.browserInfo.browserVersion)} · ${escapeHtml(session.browserInfo.os)}</p>
  <p class="summary">Bugs: ${counts.bug} | Notes: ${counts.note} | Ideas: ${counts.idea} | Questions: ${counts.question}</p>
  ${annotationBlocks.join('\n')}
</body>
</html>`;
}
