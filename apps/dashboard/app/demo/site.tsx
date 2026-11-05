'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createConsentManager, type Manager, type Receipt } from '@accordly/core';
const OUTBOX = 'accordly:receipt-outbox';
function queueReceipt(receipt: Receipt) {
  try {
    const pending: Receipt[] = JSON.parse(localStorage.getItem(OUTBOX) || '[]');
    if (!pending.some((r) => r.receiptId === receipt.receiptId)) pending.push(receipt);
    localStorage.setItem(OUTBOX, JSON.stringify(pending.slice(-100)));
  } catch {
    throw new Error('Receipt delivery could not be persisted. Browser preferences still work.');
  }
}
let flushing: Promise<void> | null = null;
function flush() {
  if (flushing) return flushing;
  flushing = (async () => {
    const pending: Receipt[] = JSON.parse(localStorage.getItem(OUTBOX) || '[]');
    for (const receipt of pending) {
      const r = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receipt),
      });
      if (!r.ok) throw new Error('Receipt delivery pending. Retry when online.');
      const remaining: Receipt[] = JSON.parse(localStorage.getItem(OUTBOX) || '[]');
      localStorage.setItem(
        OUTBOX,
        JSON.stringify(remaining.filter((item) => item.receiptId !== receipt.receiptId)),
      );
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}
export default function Demo() {
  const params = useSearchParams();
  const id = params.get('project') || 'proj_studio';
  const manager = useRef<Manager | null>(null);
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('No decision submitted');
  useEffect(() => {
    let canceled = false;
    let cleanup = () => {};
    const abort = new AbortController();
    fetch('/api/public/' + encodeURIComponent(id) + '/current', { signal: abort.signal })
      .then(async (r) => {
        if (!r.ok)
          throw new Error('Publish this project in Banner Studio before opening the demo.');
        return r.json();
      })
      .then((config) => {
        if (canceled) return;
        const m = createConsentManager({
          config,
          onDecision: async (receipt) => {
            queueReceipt(receipt);
            setStatus('Sending receipt…');
            await flush();
            setStatus('Receipt stored. View it in Consent records.');
            setError('');
          },
          onError: (e) =>
            setError(e instanceof Error ? e.message : 'Preference storage unavailable'),
        });
        const off = m.onConsentChange(setChoices);
        m.initialize();
        const offAnalytics = m.gate(
          'analytics',
          () => setAnalytics(true),
          () => setAnalytics(false),
        );
        const offMarketing = m.gate(
          'marketing',
          () => setMarketing(true),
          () => setMarketing(false),
        );
        manager.current = m;
        setReady(true);
        if (!m.hasDecision()) m.showPreferences();
        cleanup = () => {
          off();
          offAnalytics();
          offMarketing();
          m.destroy();
          manager.current = null;
        };
      })
      .catch((e) => {
        if (!canceled) setError(e.message);
      });
    const retry = () =>
      flush()
        .then(() => {
          setStatus('Pending receipts delivered');
          setError('');
        })
        .catch((e) => setError(e.message));
    retry();
    window.addEventListener('online', retry);
    const interval = setInterval(retry, 30000);
    return () => {
      canceled = true;
      abort.abort();
      cleanup();
      window.removeEventListener('online', retry);
      clearInterval(interval);
    };
  }, [id]);
  return (
    <div className="min-h-screen bg-canvas">
      <div className="px-[6vw] py-2.5 text-[11px] text-muted-foreground bg-(--accent-background)">
        INTERACTIVE DEMO · No third-party analytics or advertising requests are made.
      </div>
      <nav className="flex items-center justify-between border-b border-line px-[6vw] py-6.25 [@media(max-width:720px)]:p-5">
        <b className="font-sans text-6.25 [@media(max-width:720px)]:text-[22px]">
          the good studio.
        </b>
        <a
          className="mr-2.5 mb-2.5 inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap [@media(max-width:720px)]:text-[10px]"
          href="/"
        >
          ← Back to workspace
        </a>
      </nav>
      <main className="m-auto max-w-[1100px] px-8.75 py-[90px] [@media(max-width:720px)]:px-[22px] [@media(max-width:720px)]:py-[60px]">
        <span className="mb-2.5 text-[8px] font-bold tracking-[1.7px] text-muted-foreground [@media(max-width:720px)]:text-1.75">
          THOUGHTFULLY MADE. RESPECTFULLY SHARED.
        </span>
        <h1 className="mt-5 mb-2.25 max-w-[650px] font-sans text-[72px] leading-[1.2] font-normal tracking-[-1px] text-ink [@media(max-width:720px)]:text-[49px]">
          A little space
          <br />
          for good things.
        </h1>
        <p className="my-6.25 max-w-[550px] text-4.25 leading-[1.9] text-muted-foreground [@media(max-width:720px)]:text-sm">
          This is your consent experience in action. Make a choice, change your mind, and see
          exactly which integrations are allowed to run.
        </p>
        {error && (
          <div
            className="mb-5 flex max-w-[650px] items-center justify-between rounded-[8px] border border-(--error-border) bg-(--error-background) px-4.25 py-3.5 text-xs leading-normal font-semibold text-(--error-foreground)"
            role="alert"
          >
            {error}
          </div>
        )}
        <button
          className="mr-2.5 mb-2.5 inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-brand bg-brand px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap text-primary-foreground! shadow-[0_2px_3px_var(--shadow-color)] hover:enabled:border-(--brand-hover) hover:enabled:bg-(--brand-hover) hover:enabled:filter-none! motion-reduce:transition-none!"
          disabled={!ready}
          onClick={() => manager.current?.showPreferences()}
        >
          Manage my preferences
        </button>
        <button
          className="mr-2.5 mb-2.5 inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap motion-reduce:transition-none!"
          disabled={!ready}
          onClick={() => manager.current?.withdraw()}
        >
          Withdraw optional consent
        </button>
        <section className="mt-10 max-w-[700px] rounded-[12px] border border-line bg-(--accent-background) p-6.25 [@media(max-width:720px)]:p-5">
          <h2 className="mt-0 mb-3 font-sans text-6.25 font-normal tracking-[-0.2px]">
            Your choices, in real time.
          </h2>
          <p className="my-1.5 text-xs leading-normal text-muted-foreground">
            Analytics simulation:{' '}
            <strong
              className={analytics ? 'text-(--brand-hover)' : 'text-muted-foreground'}
              data-testid="analytics-status"
            >
              {analytics ? 'Running' : 'Blocked'}
            </strong>
          </p>
          <p className="my-1.5 text-xs leading-normal text-muted-foreground">
            Marketing simulation:{' '}
            <strong
              className={marketing ? 'text-(--brand-hover)' : 'text-muted-foreground'}
              data-testid="marketing-status"
            >
              {marketing ? 'Running' : 'Blocked'}
            </strong>
          </p>
          <pre className="whitespace-pre-wrap text-xs leading-normal text-muted-foreground">
            {JSON.stringify(choices, null, 2)}
          </pre>
          <p className="my-1.5 text-xs leading-normal text-muted-foreground" role="status">
            {status}
          </p>
          <small className="mt-3.5 text-[10px] leading-[1.8] text-muted-foreground">
            Gates run local start/stop callbacks. Production vendor integrations require their own
            initialization and teardown.
          </small>
        </section>
      </main>
      <footer className="px-[6vw] py-7.5 text-[11px] text-muted-foreground">
        Preferences are stored in this browser. Decisions are sent to your local workspace, with a
        bounded browser retry queue.
      </footer>
    </div>
  );
}
