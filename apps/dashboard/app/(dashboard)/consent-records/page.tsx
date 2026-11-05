'use client';

import { useDashboardContext } from '@/components/dashboard/dashboard-context';
import { getConsentStats, human } from '@/lib/dashboard/utils';
import { Icon } from '@/components/dashboard/icon';
import { Badge } from '@/components/dashboard/status-badge';
import { SearchIcon } from 'lucide-react';

export default function ConsentRecordsPage() {
  const { state, query, setQuery, decision, setDecision, setView } = useDashboardContext();
  if (!state) return null;
  const { total, accepted, rejected } = getConsentStats(state);

  return (
    <>
      <div className="grid grid-cols-3 gap-4 [@media(max-width:1200px)]:gap-2.5 [@media(max-width:720px)]:mt-4 [@media(max-width:720px)]:grid-cols-2 my-[23px] mx-0">
        <div
          data-testid="stat-card"
          className="bg-surface border border-line rounded-2.25 pt-[19px] pb-4.25 min-h-[133px] [@media(max-width:720px)]:first:col-span-full px-[19px] [@media(max-width:1200px)]:p-[15px] [@media(max-width:720px)]:p-4"
        >
          <span className="text-[11px] text-muted-foreground">Recorded decisions</span>
          <strong className="text-[28px] tracking-[-0.6px] font-medium block [@media(max-width:720px)]:text-6.25 my-2.5 mx-0">
            {total}
          </strong>
          <small className="text-2.25 text-muted-foreground block [@media(max-width:720px)]:text-[8px]">
            Server-received browser assertions
          </small>
        </div>
        <div
          data-testid="stat-card"
          className="bg-surface border border-line rounded-2.25 pt-[19px] pb-4.25 min-h-[133px] [@media(max-width:720px)]:first:col-span-full px-[19px] [@media(max-width:1200px)]:p-[15px] [@media(max-width:720px)]:p-4"
        >
          <span className="text-[11px] text-muted-foreground">Accept all</span>
          <strong className="text-[28px] tracking-[-0.6px] font-medium block [@media(max-width:720px)]:text-6.25 my-2.5 mx-0">
            {accepted}
          </strong>
          <small className="text-2.25 text-muted-foreground block [@media(max-width:720px)]:text-[8px]">
            Optional purposes enabled
          </small>
        </div>
        <div
          data-testid="stat-card"
          className="bg-surface border border-line rounded-2.25 pt-[19px] pb-4.25 min-h-[133px] [@media(max-width:720px)]:first:col-span-full px-[19px] [@media(max-width:1200px)]:p-[15px] [@media(max-width:720px)]:p-4"
        >
          <span className="text-[11px] text-muted-foreground">Reject optional</span>
          <strong className="text-[28px] tracking-[-0.6px] font-medium block [@media(max-width:720px)]:text-6.25 my-2.5 mx-0">
            {rejected}
          </strong>
          <small className="text-2.25 text-muted-foreground block [@media(max-width:720px)]:text-[8px]">
            Required purposes only
          </small>
        </div>
      </div>
      <section className="bg-surface border border-line rounded-[10px] min-w-0">
        <div className="flex items-center justify-between gap-4 mb-5 text-muted-foreground text-[11px] [@media(max-width:720px)]:flex-wrap pt-4.5 pb-0 px-5">
          <label className="flex text-[11px] text-ink items-center gap-2 border border-line rounded-1.75 bg-surface min-w-62.5 [@media(max-width:720px)]:min-w-0 [@media(max-width:720px)]:w-full py-0 px-3">
            <SearchIcon size={15} className="text-ink" />
            <input
              className="block w-full border-0 rounded-[6px] bg-surface text-ink! text-[11px]! focus:outline-none focus:ring-0  min-w-0 mx-0 py-2.5 px-0"
              aria-label="Search projects"
              placeholder="Search receipt or project…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className="pr-7.5 pl-2.5 border border-line rounded-[6px] bg-surface text-ink! text-[11px]! py-2 motion-reduce:transition-none!"
            aria-label="Filter decisions"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <option value="all">All decisions</option>
            {['accept', 'reject', 'customize', 'withdraw'].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr>
                <th className="text-2.25 text-muted-foreground tracking-[0.4px] font-medium bg-canvas border-y border-line whitespace-nowrap py-3.25 px-5">
                  Receipt / received
                </th>
                <th className="text-2.25 text-muted-foreground tracking-[0.4px] font-medium bg-canvas border-y border-line whitespace-nowrap py-3.25 px-5">
                  Project
                </th>
                <th className="text-2.25 text-muted-foreground tracking-[0.4px] font-medium bg-canvas border-y border-line whitespace-nowrap py-3.25 px-5">
                  Decision
                </th>
                <th className="text-2.25 text-muted-foreground tracking-[0.4px] font-medium bg-canvas border-y border-line whitespace-nowrap py-3.25 px-5">
                  Purposes enabled
                </th>
                <th className="text-2.25 text-muted-foreground tracking-[0.4px] font-medium bg-canvas border-y border-line whitespace-nowrap py-3.25 px-5">
                  Version
                </th>
              </tr>
            </thead>
            <tbody>
              {state.receipts
                .filter(
                  (r) =>
                    (decision === 'all' || r.action === decision) &&
                    (r.receiptId + ' ' + r.projectId).includes(query),
                )
                .map((r) => (
                  <tr key={r.receiptId}>
                    <td className="border-b border-line whitespace-nowrap text-muted-foreground py-4 px-5">
                      <code className="text-[10px] text-(--brand-hover)">
                        {r.receiptId.slice(0, 13)}…
                      </code>
                      <small className="block text-2.25 text-muted-foreground mt-1">
                        {new Date(r.receivedAt).toLocaleString()}
                      </small>
                    </td>
                    <td className="border-b border-line whitespace-nowrap text-muted-foreground py-4 px-5">
                      {state.projects.find((p) => p.id === r.projectId)?.name}
                    </td>
                    <td className="border-b border-line whitespace-nowrap text-muted-foreground py-4 px-5">
                      <Badge tone={r.action === 'accept' ? 'green' : 'gray'}>
                        {human(r.action)}
                      </Badge>
                    </td>
                    <td className="border-b border-line whitespace-nowrap text-muted-foreground py-4 px-5">
                      {Object.entries(r.choices)
                        .filter(([, value]) => value)
                        .map(([key]) => key)
                        .join(', ')}
                    </td>
                    <td className="border-b border-line whitespace-nowrap text-muted-foreground py-4 px-5">
                      <code className="text-[10px] text-(--brand-hover)">
                        {r.configurationVersion.slice(0, 12)}…
                      </code>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!total && (
            <div className="text-center text-muted-foreground py-[60px] px-6.25">
              <Icon name="Consent records" size={36} />
              <h3 className="font-sans font-normal text-[24px] text-ink mt-[15px] mb-1.25 mx-0">
                A fresh start for trust.
              </h3>
              <p className="text-muted-foreground mt-1.5 mb-5 text-[11px] mx-0">
                Consent decisions from the published demo will appear here.
              </p>
              <button
                className="inline-flex items-center justify-center gap-2.25 min-h-10 border border-line rounded-1.75 bg-surface text-[11px]! font-semibold! whitespace-nowrap py-2.5 px-4 motion-reduce:transition-none!"
                onClick={() => setView('Banner Studio')}
              >
                Open banner studio →
              </button>
            </div>
          )}
        </div>
      </section>
      <p className="text-muted-foreground mt-3.5 mb-1.5 text-[10px] leading-[1.8] mx-0">
        Records reflect what a browser submitted, not verified identity. Exports include full
        configuration version IDs and timestamps.
      </p>
    </>
  );
}
