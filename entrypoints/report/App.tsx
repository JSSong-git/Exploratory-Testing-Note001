import { useEffect, useState } from 'react';
import type { Session } from '@/lib/core/types';
import { countByType } from '@/lib/core/types';
import { sendMessage } from '@/lib/messaging/client';
import { Badge } from '@/components/ui/badge';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '@/assets/styles/globals.css';

export default function ReportApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    sendMessage<Session>({ type: 'GET_FULL_SESSION' }).then((res) => {
      if (res.ok && res.data) setSession(res.data as Session);
      else setError('No session data available');
    });
  }, []);

  if (error) {
    return <div className="p-8 text-center text-[var(--color-muted)]">{error}</div>;
  }

  if (!session) {
    return <div className="p-8 text-center">Loading report...</div>;
  }

  const counts = countByType(session);
  const chartData = [
    { name: 'Bugs', count: counts.bug },
    { name: 'Notes', count: counts.note },
    { name: 'Ideas', count: counts.idea },
    { name: 'Questions', count: counts.question },
  ];

  return (
    <div className="min-h-screen p-6" data-testid="report-root">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Session Report</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Started {new Date(session.startDateTime).toLocaleString()}
        </p>
      </header>

      <div className="mb-8 h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis allowDecimals={false} stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm" data-testid="annotations-table">
          <thead className="bg-[var(--color-card)] text-left text-[var(--color-muted)]">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Title</th>
              <th className="p-3">URL</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {session.annotations.map((a) => (
              <tr key={a.id} className="border-t border-[var(--color-border)]">
                <td className="p-3">
                  <Badge tone={a.type}>{a.type}</Badge>
                </td>
                <td className="max-w-xs break-words p-3">{a.title}</td>
                <td className="max-w-xs break-words p-3 text-[var(--color-muted)]">{a.url}</td>
                <td className="p-3 whitespace-nowrap text-[var(--color-muted)]">
                  {new Date(a.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
