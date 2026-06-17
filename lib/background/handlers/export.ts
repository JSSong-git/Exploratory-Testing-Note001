import type { Message, MessageResponse } from '@/lib/messaging/protocol';
import { getSession, replaceSession } from '@/lib/services/session-service';
import { buildCsv, buildJson, buildMarkdownZip, buildInlineMarkdown } from '@/lib/export/markdown';
import { buildStandaloneHtml } from '@/lib/export/html';
import { downloadBlob, downloadText, sessionFilename } from '@/lib/export/download';
import { importLegacySession } from '@/lib/export/legacy-import';

export async function handleExportMessage(message: Message): Promise<MessageResponse | null> {
  switch (message.type) {
    case 'EXPORT_MARKDOWN': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      const zip = await buildMarkdownZip(session);
      await downloadBlob(zip, sessionFilename(session, 'zip'));
      return { ok: true };
    }
    case 'EXPORT_MARKDOWN_INLINE': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      const md = await buildInlineMarkdown(session);
      await downloadText(md, sessionFilename(session, 'md'), 'text/markdown');
      return { ok: true };
    }
    case 'EXPORT_JSON': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      await downloadText(buildJson(session), sessionFilename(session, 'json'), 'application/json');
      return { ok: true };
    }
    case 'EXPORT_CSV': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      await downloadText(buildCsv(session), sessionFilename(session, 'csv'), 'text/csv');
      return { ok: true };
    }
    case 'EXPORT_HTML': {
      const session = getSession();
      if (!session || session.annotations.length === 0) {
        return { ok: false, error: 'Nothing to export' };
      }
      const html = await buildStandaloneHtml(session);
      await downloadText(html, sessionFilename(session, 'html'), 'text/html');
      return { ok: true };
    }
    case 'IMPORT_JSON': {
      try {
        const session = await importLegacySession(message.payload.json);
        await replaceSession(session);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Invalid session JSON' };
      }
    }
    default:
      return null;
  }
}
