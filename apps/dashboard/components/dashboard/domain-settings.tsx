'use client';
import { useEffect, useState } from 'react';
export default function DomainSettings({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const [status, setStatus] = useState<any>(null),
    [challenge, setChallenge] = useState<any>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch(`/api/projects/${projectId}/domain`);
    const value = await r.json();
    if (!r.ok) throw new Error(value.error);
    setStatus(value);
  }
  useEffect(() => {
    setChallenge(null);
    setMessage('');
    load().catch((e) => setMessage(e.message));
  }, [projectId]);
  async function run(operation: string, method?: string) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(`/api/projects/${projectId}/domain/${operation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error);
      if (operation === 'challenge') setChallenge(value);
      else setMessage('Ownership verified. You can now publish.');
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mb-5 min-w-0 rounded-[10px] border border-line bg-surface p-6.25">
      <h2 className="mt-0 mb-5.75 text-sm leading-normal font-semibold tracking-[-0.2px]">
        Domain ownership
      </h2>
      <p className="my-1.5 text-xs leading-normal text-muted-foreground">
        {status?.domain} ·{' '}
        {status?.verified ? 'Verified' : 'Verification required before live publishing'}
      </p>
      {canManage && (
        <>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap motion-reduce:transition-none!"
            disabled={busy}
            onClick={() => run('challenge', 'dns')}
          >
            Create DNS challenge
          </button>{' '}
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap motion-reduce:transition-none!"
            disabled={busy}
            onClick={() => run('challenge', 'http')}
          >
            Create HTTPS file challenge
          </button>
          {challenge && (
            <div>
              <p className="my-1.5 text-xs leading-normal text-muted-foreground">
                Expires: {new Date(challenge.expiresAt).toLocaleString()}. A new challenge replaces
                the previous proof.
              </p>
              {challenge.method === 'dns' ? (
                <p className="my-1.5 text-xs leading-normal text-muted-foreground">
                  Add a TXT record named{' '}
                  <code className="text-[10px] text-(--brand-hover)">{challenge.dnsName}</code> with
                  this exact value:
                </p>
              ) : (
                <p className="my-1.5 text-xs leading-normal text-muted-foreground">
                  Serve a plain text file at{' '}
                  <code className="text-[10px] text-(--brand-hover)">{challenge.httpUrl}</code>{' '}
                  containing this exact value. Redirects are not accepted.
                </p>
              )}
              <pre className="whitespace-pre-wrap [overflow-wrap:anywhere]">{challenge.token}</pre>
              <p className="my-1.5 text-xs leading-normal text-muted-foreground">
                Save this token now; it is shown only for the current page session.
              </p>
            </div>
          )}
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-brand bg-brand px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap text-primary-foreground! shadow-[0_2px_3px_var(--shadow-color)] hover:enabled:border-(--brand-hover) hover:enabled:bg-(--brand-hover) hover:enabled:filter-none! motion-reduce:transition-none!"
            disabled={busy}
            onClick={() => run('verify')}
          >
            Check ownership
          </button>
        </>
      )}
      {message && (
        <p className="my-1.5 text-xs leading-normal text-muted-foreground" role="status">
          {message}
        </p>
      )}
      <p className="mt-3.5 mb-1.5 text-[10px] leading-[1.8] text-muted-foreground">
        Each hostname needs its own proof. DNS propagation may take time. Verification is valid for
        30 days.
      </p>
    </section>
  );
}
