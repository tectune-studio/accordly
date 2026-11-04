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
    <section className="card settings" style={{ marginBottom: 20 }}>
      <h2>Domain ownership</h2>
      <p>
        {status?.domain} ·{' '}
        {status?.verified ? 'Verified' : 'Verification required before live publishing'}
      </p>
      {canManage && (
        <>
          <button className="button" disabled={busy} onClick={() => run('challenge', 'dns')}>
            Create DNS challenge
          </button>{' '}
          <button className="button" disabled={busy} onClick={() => run('challenge', 'http')}>
            Create HTTPS file challenge
          </button>
          {challenge && (
            <div>
              <p>
                Expires: {new Date(challenge.expiresAt).toLocaleString()}. A new challenge replaces
                the previous proof.
              </p>
              {challenge.method === 'dns' ? (
                <p>
                  Add a TXT record named <code>{challenge.dnsName}</code> with this exact value:
                </p>
              ) : (
                <p>
                  Serve a plain text file at <code>{challenge.httpUrl}</code> containing this exact
                  value. Redirects are not accepted.
                </p>
              )}
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {challenge.token}
              </pre>
              <p>Save this token now; it is shown only for the current page session.</p>
            </div>
          )}
          <button className="button primary" disabled={busy} onClick={() => run('verify')}>
            Check ownership
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
      <p className="footnote">
        Each hostname needs its own proof. DNS propagation may take time. Verification is valid for
        30 days.
      </p>
    </section>
  );
}
