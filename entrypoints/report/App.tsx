import { useEffect, useMemo, useState } from 'react';
import type { Annotation, AnnotationType, Session } from '@/lib/core/types';
import { ANNOTATION_TYPES, countByType } from '@/lib/core/types';
import { sendMessage } from '@/lib/messaging/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MarkdownView } from '@/components/MarkdownView';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '@/assets/styles/globals.css';

type TypeFilter = AnnotationType | 'all';

const TYPE_LABELS: Record<AnnotationType, string> = {
  bug: 'Bug',
  note: 'Note',
  idea: 'Idea',
  question: 'Question',
};

export default function ReportApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    sendMessage<Session>({ type: 'GET_FULL_SESSION' }).then((res) => {
      if (res.ok && res.data) setSession(res.data as Session);
      else setError('No session data available');
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
    return [
      { name: 'Bugs', count: counts.bug },
      { name: 'Notes', count: counts.note },
      { name: 'Ideas', count: counts.idea },
      { name: 'Questions', count: counts.question },
    ];
  }, [session, filteredAnnotations]);

  if (error) {
    return <div className="p-8 text-center text-[var(--color-muted)]">{error}</div>;
  }

  if (!session) {
    return <div className="p-8 text-center">Loading report...</div>;
  }

  return (
    <div className="min-h-screen p-6" data-testid="report-root">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Session Report</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Started {new Date(session.startDateTime).toLocaleString()}
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
          All
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
          placeholder="Search title, description, URL"
          className="max-w-xs"
        />
      </div>

      <div className="mb-8 h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4" data-testid="report-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#71717a" />
            <YAxis allowDecimals={false} stroke="#71717a" />
            <Tooltip />
            <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm" data-testid="annotations-table">
          <thead className="bg-[var(--color-card)] text-left text-[var(--color-muted)]">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Title</th>
              <th className="p-3">Description</th>
              <th className="p-3">URL</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnnotations.map((a) => (
              <tr key={a.id} className="border-t border-[var(--color-border)]" data-testid={`report-row-${a.id}`}>
                <td className="p-3">
                  <Badge tone={a.type}>{a.type}</Badge>
                </td>
                <td className="max-w-xs break-words p-3">{a.title}</td>
                <td className="max-w-xs p-3 text-[var(--color-muted)]">
                  <MarkdownView content={a.description ?? ''} />
                </td>
                <td className="max-w-xs break-words p-3 text-[var(--color-muted)]">{a.url}</td>
                <td className="p-3 whitespace-nowrap text-[var(--color-muted)]">
                  {new Date(a.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAnnotations.length === 0 && (
          <p className="p-4 text-center text-sm text-[var(--color-muted)]" data-testid="report-empty">
            No annotations match the current filters.
          </p>
        )}
      </div>
    </div>
  );
}
