'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createConsentManager, type Manager, type Receipt } from '@consentkit/core';
const OUTBOX = 'consentkit:receipt-outbox';
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
          throw new Error('Publish this project in Banner studio before opening the demo.');
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
    <div className="demo-site">
      <div className="demo-mode-banner">
        INTERACTIVE DEMO · No third-party analytics or advertising requests are made.
      </div>
      <nav>
        <b>the good studio.</b>
        <a className="button" href="/">
          ← Back to workspace
        </a>
      </nav>
      <main>
        <span className="eyebrow">THOUGHTFULLY MADE. RESPECTFULLY SHARED.</span>
        <h1>
          A little space
          <br />
          for good things.
        </h1>
        <p className="lead">
          This is your consent experience in action. Make a choice, change your mind, and see
          exactly which integrations are allowed to run.
        </p>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <button
          className="button primary"
          disabled={!ready}
          onClick={() => manager.current?.showPreferences()}
        >
          Manage my preferences
        </button>
        <button className="button" disabled={!ready} onClick={() => manager.current?.withdraw()}>
          Withdraw optional consent
        </button>
        <section className="demo-status">
          <h2>Your choices, in real time.</h2>
          <p>
            Analytics simulation:{' '}
            <strong className={analytics ? 'enabled' : 'disabled'} data-testid="analytics-status">
              {analytics ? 'Running' : 'Blocked'}
            </strong>
          </p>
          <p>
            Marketing simulation:{' '}
            <strong className={marketing ? 'enabled' : 'disabled'} data-testid="marketing-status">
              {marketing ? 'Running' : 'Blocked'}
            </strong>
          </p>
          <pre>{JSON.stringify(choices, null, 2)}</pre>
          <p role="status">{status}</p>
          <small className="footnote">
            Gates run local start/stop callbacks. Production vendor integrations require their own
            initialization and teardown.
          </small>
        </section>
      </main>
      <footer>
        Preferences are stored in this browser. Decisions are sent to your local workspace, with a
        bounded browser retry queue.
      </footer>
    </div>
  );
}
