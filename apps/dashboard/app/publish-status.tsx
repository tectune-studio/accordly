'use client';
import { useEffect, useState } from 'react';
export default function PublishStatus({
  projectId,
  canManage,
  onComplete,
}: {
  projectId: string;
  canManage: boolean;
  onComplete: () => Promise<unknown>;
}) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/projects/${projectId}/publishes`);
        const value = await r.json();
        if (!r.ok) throw new Error(value.error);
        if (active) setJobs(value);
      } catch (e) {
        if (active) setMessage((e as Error).message);
      }
    };
    void load();
    const timer = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [projectId]);
  async function resume(id: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id }),
      });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error);
      setMessage('Publication completed.');
      await onComplete();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const pending = jobs.find((j) => j.phase !== 'completed');
  if (!pending && !message) return null;
  return (
    <section className="card settings" style={{ marginBottom: 20 }}>
      <h2>Publication status</h2>
      {pending && (
        <>
          <p>
            Release {pending.release_id} · {pending.phase}
          </p>
          <p>{pending.last_error || 'Publication in progress.'}</p>
          <p>
            Resume publishes the saved release. Publish again afterward to include newer draft
            edits.
          </p>
          {canManage && (
            <button className="button" disabled={busy} onClick={() => resume(pending.id)}>
              Resume publication
            </button>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
