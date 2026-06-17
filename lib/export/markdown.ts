import type { Session, Annotation, AnnotationType } from '@/lib/core/types';
import { getImage } from '@/lib/storage/image-store';
import { saveImage } from '@/lib/storage/image-store';

function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19);
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
}

function sessionHeaderMarkdown(session: Session): string {
  let md = `# Exploratory Testing Session\n\n`;
  md += `| Field | Value |\n|-------|-------|\n`;
  md += `| Started | ${formatTimestamp(session.startDateTime)} |\n`;
  md += `| Browser | ${session.browserInfo.brand} ${session.browserInfo.browserVersion} |\n`;
  md += `| OS | ${session.browserInfo.os} |\n\n`;

  const counts = { bug: 0, note: 0, idea: 0, question: 0 };
  for (const a of session.annotations) counts[a.type]++;

  md += `## Summary\n\n`;
  md += `- Bugs: ${counts.bug} | Notes: ${counts.note} | Ideas: ${counts.idea} | Questions: ${counts.question}\n\n`;
  md += `## Annotations\n\n`;
  return md;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function buildMarkdownZip(session: Session): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const imagesFolder = zip.folder('images')!;

  let md = sessionHeaderMarkdown(session);

  for (const annotation of session.annotations) {
    md += await annotationToMarkdown(annotation, imagesFolder);
    md += '\n';
  }

  zip.file('session.md', md);
  return zip.generateAsync({ type: 'blob' });
}

export async function buildInlineMarkdown(session: Session): Promise<string> {
  let md = sessionHeaderMarkdown(session);

  for (const annotation of session.annotations) {
    md += await annotationToInlineMarkdown(annotation);
    md += '\n';
  }

  return md;
}

async function annotationToInlineMarkdown(annotation: Annotation): Promise<string> {
  const typeLabel = annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1);
  let block = `### [${typeLabel}] ${annotation.title}\n\n`;
  block += `- **URL:** ${annotation.url}\n`;
  block += `- **Time:** ${formatTimestamp(annotation.timestamp)}\n`;
  if (annotation.description) {
    block += `- **Description:** ${annotation.description}\n`;
  }

  if (annotation.imageId) {
    const blob = await getImage(annotation.imageId);
    if (blob) {
      const dataUrl = await blobToDataUrl(blob);
      block += `\n![${annotation.title}](${dataUrl})\n`;
    }
  }

  return block;
}

async function annotationToMarkdown(
  annotation: Annotation,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imagesFolder: { file: (name: string, data: Blob) => void },
): Promise<string> {
  const typeLabel = annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1);
  let block = `### [${typeLabel}] ${annotation.title}\n\n`;
  block += `- **URL:** ${annotation.url}\n`;
  block += `- **Time:** ${formatTimestamp(annotation.timestamp)}\n`;
  if (annotation.description) {
    block += `- **Description:** ${annotation.description}\n`;
  }

  if (annotation.imageId) {
    const { getImage } = await import('@/lib/storage/image-store');
    const blob = await getImage(annotation.imageId);
    if (blob) {
      const filename = `${sanitizeFilename(annotation.type)}_${sanitizeFilename(annotation.title)}_${annotation.id.slice(0, 8)}.png`;
      imagesFolder.file(filename, blob);
      block += `\n![${annotation.title}](./images/${filename})\n`;
    }
  }

  return block;
}

export function buildCsv(session: Session): string {
  let csv = 'TimeStamp,Type,Title,Description,URL\n';
  for (const a of session.annotations) {
    const desc = (a.description ?? '').replace(/"/g, '""');
    const title = a.title.replace(/"/g, '""');
    csv += `"${formatTimestamp(a.timestamp)}","${a.type}","${title}","${desc}","${a.url}"\n`;
  }
  return csv;
}

export function buildJson(session: Session): string {
  return JSON.stringify(session, null, 2);
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function imageDataUrlToId(dataUrl?: string): Promise<string | undefined> {
  if (!dataUrl) return undefined;
  const blob = await dataUrlToBlob(dataUrl);
  return saveImage(blob);
}
