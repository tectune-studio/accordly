'use client';
import { useEffect, useState, type FormEvent } from 'react';
export default function TeamSettings() {
  const [data, setData] = useState<any>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function refresh() {
    const r = await fetch('/api/organization/members');
    const v = await r.json();
    if (!r.ok) throw new Error(v.error);
    setData(v);
  }
  useEffect(() => {
    refresh().catch((e) => setMessage(e.message));
  }, []);
  async function action(path: string, value: unknown) {
    setBusy(true);
    try {
      const r = await fetch('/api/' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      await refresh();
      setMessage('Saved.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    void action('organization/invitations', {
      email: values.get('email'),
      role: values.get('role'),
    });
  }
  return (
    <section className="min-w-0 rounded-[10px] border border-line bg-surface p-6.25">
      <h2 className="mt-0 mb-5.75 text-sm leading-normal font-semibold tracking-[-0.2px]">
        Organization access
      </h2>
      <p className="my-1.5 text-xs leading-normal text-muted-foreground">
        Administrators manage members and publishing. Editors manage drafts. Viewers read and
        export.
      </p>
      {message && (
        <p className="my-1.5 text-xs leading-normal text-muted-foreground" role="status">
          {message}
        </p>
      )}
      {data?.members.map((m: any) => (
        <div
          className="flex justify-between gap-5 border-b border-line py-3.25 text-[10px]"
          key={m.id}
        >
          <span className="text-right text-muted-foreground">{m.name}</span>
          <span className="text-right text-muted-foreground">{m.role}</span>
          {data.canManage && m.userId !== data.userId && (
            <>
              <select
                className="rounded-[6px] border border-line bg-surface py-2 pr-7.5 pl-2.5 text-[11px]! text-ink motion-reduce:transition-none!"
                aria-label={'Role for ' + m.name}
                defaultValue={
                  m.role === 'org:admin' ? 'admin' : m.role === 'org:editor' ? 'editor' : 'viewer'
                }
                disabled={busy}
                onChange={(e) =>
                  action(`organization/members/${m.userId}/role`, { role: e.target.value })
                }
              >
                <option value="admin">Administrator</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap motion-reduce:transition-none!"
                disabled={busy}
                onClick={() => {
                  if (confirm('Remove this organization member?'))
                    void action(`organization/members/${m.userId}/remove`, {});
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      ))}
      {data?.canManage && (
        <>
          <form onSubmit={invite}>
            <label className="block text-[11px] text-ink">
              Email
              <input
                className="mt-1.5 mb-4.25 block w-full rounded-[6px] border border-(--line-strong) bg-canvas px-3 py-2.5 text-[12px]! text-ink"
                type="email"
                name="email"
                required
              />
            </label>
            <label className="block text-[11px] text-ink">
              Role
              <select
                className="rounded-[6px] border border-line bg-surface py-2 pr-7.5 pl-2.5 text-[11px]! text-ink motion-reduce:transition-none!"
                name="role"
                defaultValue="viewer"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrator</option>
              </select>
            </label>
            <p className="my-1.5 text-xs leading-normal text-muted-foreground">
              Enable the org:editor custom role in Clerk before inviting editors.
            </p>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap motion-reduce:transition-none!"
              disabled={busy}
            >
              Send invitation
            </button>
          </form>
          {data.invitations.map((i: any) => (
            <div
              className="flex justify-between gap-5 border-b border-line py-3.25 text-[10px]"
              key={i.id}
            >
              <span className="text-right text-muted-foreground">{i.email}</span>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap motion-reduce:transition-none!"
                disabled={busy}
                onClick={() => action(`organization/invitations/${i.id}/revoke`, {})}
              >
                Revoke
              </button>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action('organization/retention', {
                days: Number(new FormData(e.currentTarget).get('days')),
              });
            }}
          >
            <label className="block text-[11px] text-ink">
              Consent retention (days)
              <input
                className="mt-1.5 mb-4.25 block w-full rounded-[6px] border border-(--line-strong) bg-canvas px-3 py-2.5 text-[12px]! text-ink"
                name="days"
                type="number"
                min={1}
                max={395}
                defaultValue={180}
                required
              />
            </label>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2.25 rounded-1.75 border border-line bg-surface px-4 py-2.5 text-[11px]! font-semibold! whitespace-nowrap motion-reduce:transition-none!"
              disabled={busy}
            >
              Save retention policy
            </button>
          </form>
        </>
      )}
    </section>
  );
}
