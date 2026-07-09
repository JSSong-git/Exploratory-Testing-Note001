import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import { getSession, replaceSession } from '@/lib/services/session-service';
import { buildCsv, buildJson, buildMarkdownZip, buildInlineMarkdown } from '@/lib/export/markdown';
import { buildStandaloneHtml } from '@/lib/export/html';
import { downloadBlob, downloadText, sessionFilename } from '@/lib/export/download';
import { importSessionJson } from '@/lib/export/session-import';
import { broadcastSessionChanged } from '@/lib/background/session-events';
import { en } from '@/lib/i18n';

export async function handleExportMessage(
  message: Message,
  _sender?: chrome.runtime.MessageSender,
): Promise<MessageResponse | null> {
  switch (message.type) {
    case 'EXPORT_MARKDOWN': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: en.errors.nothingToExport };
      }
      const zip = await buildMarkdownZip(session);
      await downloadBlob(zip, sessionFilename(session, 'zip'));
      return { ok: true };
    }
    case 'EXPORT_MARKDOWN_INLINE': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: en.errors.nothingToExport };
      }
      const md = await buildInlineMarkdown(session);
      await downloadText(md, sessionFilename(session, 'md'), 'text/markdown');
      return { ok: true };
    }
    case 'EXPORT_JSON': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: en.errors.nothingToExport };
      }
      await downloadText(buildJson(session), sessionFilename(session, 'json'), 'application/json');
      return { ok: true };
    }
    case 'EXPORT_CSV': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: en.errors.nothingToExport };
      }
      await downloadText(buildCsv(session), sessionFilename(session, 'csv'), 'text/csv');
      return { ok: true };
    }
    case 'EXPORT_HTML': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: en.errors.nothingToExport };
      }
      const html = await buildStandaloneHtml(session);
      await downloadText(html, sessionFilename(session, 'html'), 'text/html');
      return { ok: true };
    }
    case 'IMPORT_JSON': {
      try {
        const session = await importSessionJson(message.payload.json);
        await replaceSession(session);
        broadcastSessionChanged();
        return { ok: true };
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'Unknown error';
        return { ok: false, error: `${en.errors.importFailed} (${detail})` };
      }
    }
    default:
      return null;
  }
}
