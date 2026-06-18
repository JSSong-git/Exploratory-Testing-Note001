import { useEffect, useMemo, useState } from 'react';
import type { Annotation, AnnotationType, Session } from '@/lib/core/types';
import { ANNOTATION_TYPES, countByType } from '@/lib/core/types';
import { sendMessage } from '@/lib/messaging/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MarkdownView } from '@/components/MarkdownView';
import { AnnotationImage } from '@/components/AnnotationImage';
import { CHART_TYPE_LABELS, ko, TYPE_LABELS } from '@/lib/i18n/ko';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '@/assets/styles/globals.css';

type TypeFilter = AnnotationType | 'all';

const CHART_COLORS: Record<AnnotationType, string> = {
  bug: 'var(--color-bug)',
  note: 'var(--color-note)',
  idea: 'var(--color-idea)',
  question: 'var(--color-question)',
};

const CHART_TYPES: AnnotationType[] = ['bug', 'note', 'idea', 'question'];

export default function ReportApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    sendMessage<Session>({ type: 'GET_FULL_SESSION' }).then((res) => {
      if (res.ok && res.data) setSession(res.data as Session);
      else setError(ko.report.noData);
    });
  }, []);

  const filteredAnnotations = useMemo(() => {
    if (!session) return [];
    const query = search.trim().toLowerCase();
    return session.annotations.filter((annotation) => {
      if (typeFilter !== 'all' && annotation.type !== typeFilter) return false;
      if (!query) return true;
      const haystack = `${annotation.title} ${annotation.description ?? ''} ${annotation.url}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [session, typeFilter, search]);

  const chartData = useMemo(() => {
    if (!session) return [];
    const counts = countByType({ ...session, annotations: filteredAnnotations });
    return CHART_TYPES.map((type) => ({
      type,
      name: CHART_TYPE_LABELS[type],
      count: counts[type],
    }));
  }, [session, filteredAnnotations]);

  if (error) {
    return <div className="p-8 text-center text-[var(--color-muted)]">{error}</div>;
  }

  if (!session) {
    return <div className="p-8 text-center">{ko.report.loading}</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-6" data-testid="report-root">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{ko.report.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {ko.report.started(new Date(session.startDateTime).toLocaleString())}
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2" data-testid="report-filters">
        <button
          type="button"
          data-testid="report-filter-all"
          onClick={() => setTypeFilter('all')}
          className={`border-b-2 px-3 py-1.5 text-xs font-medium ${
            typeFilter === 'all'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-[var(--color-muted)]'
          }`}
        >
          {ko.report.all}
        </button>
        {ANNOTATION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            data-testid={`report-filter-${type}`}
            onClick={() => setTypeFilter(type)}
            className={`border-b-2 px-3 py-1.5 text-xs font-medium ${
              typeFilter === type
                ? 'text-zinc-900'
                : 'border-transparent text-[var(--color-muted)]'
            }`}
            style={typeFilter === type ? { borderBottomColor: `var(--color-${type})` } : undefined}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
        <Input
          data-testid="report-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={ko.report.searchPlaceholder}
          className="max-w-xs"
        />
      </div>

      <div className="mb-8 h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4" data-testid="report-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#71717a" />
            <YAxis allowDecimals={false} stroke="#71717a" />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={CHART_COLORS[entry.type]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm" data-testid="annotations-table">
          <thead className="bg-[var(--color-card)] text-left text-[var(--color-muted)]">
            <tr>
              <th className="p-3">{ko.report.colType}</th>
              <th className="p-3">{ko.report.colTitle}</th>
              <th className="p-3">{ko.report.colDescription}</th>
              <th className="p-3">{ko.report.colScreenshot}</th>
              <th className="p-3">{ko.report.colUrl}</th>
              <th className="p-3">{ko.report.colTime}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnnotations.map((a) => (
              <ReportRow key={a.id} annotation={a} />
            ))}
          </tbody>
        </table>
        {filteredAnnotations.length === 0 && (
          <p className="p-4 text-center text-sm text-[var(--color-muted)]" data-testid="report-empty">
            {ko.report.empty}
          </p>
        )}
      </div>
    </div>
  );
}

function ReportRow({ annotation }: { annotation: Annotation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <tr className="border-t border-[var(--color-border)]" data-testid={`report-row-${annotation.id}`}>
      <td className="p-3">
        <Badge tone={annotation.type}>{TYPE_LABELS[annotation.type]}</Badge>
      </td>
      <td className="max-w-xs break-words p-3">{annotation.title}</td>
      <td className="max-w-xs p-3 text-[var(--color-muted)]">
        <MarkdownView content={annotation.description ?? ''} />
      </td>
      <td className="p-3">
        {annotation.imageId ? (
          <AnnotationImage
            imageId={annotation.imageId}
            alt={annotation.title}
            variant="thumbnail"
            testId={`report-image-${annotation.id}`}
            onClick={() => setExpanded((v) => !v)}
          />
        ) : (
          <span className="text-xs text-[var(--color-muted)]">—</span>
        )}
        {expanded && annotation.imageId && (
          <div className="mt-2">
            <AnnotationImage
              imageId={annotation.imageId}
              alt={annotation.title}
              variant="full"
              testId={`report-image-full-${annotation.id}`}
            />
          </div>
        )}
      </td>
      <td className="max-w-xs break-words p-3 text-[var(--color-muted)]">{annotation.url}</td>
      <td className="p-3 whitespace-nowrap text-[var(--color-muted)]">
        {new Date(annotation.timestamp).toLocaleString()}
      </td>
    </tr>
  );
}
