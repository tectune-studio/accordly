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
    <section className="card settings">
      <h2>Organization access</h2>
      <p>
        Administrators manage members and publishing. Editors manage drafts. Viewers read and
        export.
      </p>
      {message && <p role="status">{message}</p>}
      {data?.members.map((m: any) => (
        <div className="setting-row" key={m.id}>
          <span>{m.name}</span>
          <span>{m.role}</span>
          {data.canManage && m.userId !== data.userId && (
            <>
              <select
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
                className="button"
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
            <label>
              Email
              <input type="email" name="email" required />
            </label>
            <label>
              Role
              <select name="role" defaultValue="viewer">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrator</option>
              </select>
            </label>
            <p>Enable the org:editor custom role in Clerk before inviting editors.</p>
            <button className="button" disabled={busy}>
              Send invitation
            </button>
          </form>
          {data.invitations.map((i: any) => (
            <div className="setting-row" key={i.id}>
              <span>{i.email}</span>
              <button
                className="button"
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
            <label>
              Consent retention (days)
              <input name="days" type="number" min={1} max={395} defaultValue={180} required />
            </label>
            <button className="button" disabled={busy}>
              Save retention policy
            </button>
          </form>
        </>
      )}
    </section>
  );
}
