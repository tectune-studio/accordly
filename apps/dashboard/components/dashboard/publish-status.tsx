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
    <section className="mb-5 min-w-0 rounded-[10px] border border-line bg-surface p-6.25">
      <h2 className="mt-0 mb-5.75 text-sm leading-normal font-semibold tracking-[-0.2px]">
        Publication status
      </h2>
      {pending && (
        <>
          <p className="my-1.5 text-xs leading-normal text-muted-foreground">
            Release {pending.release_id} · {pending.phase}
          </p>
          <p className="my-1.5 text-xs leading-normal text-muted-foreground">
            {pending.last_error || 'Publication in progress.'}
          </p>
          <p className="my-1.5 text-xs leading-normal text-muted-foreground">
            Resume publishes the saved release. Publish again afterward to include newer draft
            edits.
          </p>
          {canManage && (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap motion-reduce:transition-none!"
              disabled={busy}
              onClick={() => resume(pending.id)}
            >
              Resume publication
            </button>
          )}
        </>
      )}
      {message && (
        <p className="my-1.5 text-xs leading-normal text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
