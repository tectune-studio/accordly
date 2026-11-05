'use client';
import Image from 'next/image';
import BrandLogo from './brand-logo';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import TeamSettings from './team-settings';
import DomainSettings from './domain-settings';
import PublishStatus from './publish-status';
import type { ConsentConfig, Receipt } from '@consentkit/core';
type Release = { id: string; createdAt: string; config: ConsentConfig };
type Project = {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  draft: ConsentConfig;
  releases: Release[];
  activeRelease: string | null;
};
type State = {
  mode?: 'live';
  viewer?: { userId: string; role: string };
  organization: { id?: string; name: string; plan: string };
  projects: Project[];
  receipts: (Receipt & { receivedAt: string })[];
  audit: { id: string; action: string; at: string; actor: string; projectId: string }[];
};
type View =
  | 'Overview'
  | 'Projects'
  | 'Banner studio'
  | 'Consent records'
  | 'Integrations'
  | 'Billing'
  | 'Settings';
const navigation: View[] = [
  'Overview',
  'Projects',
  'Banner studio',
  'Consent records',
  'Integrations',
];
const paths: Record<string, ReactNode> = {
  Overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  Projects: (
    <>
      <path d="M3 7h7l2 2h9v11H3z" />
      <path d="M3 7V4h7l2 3" />
    </>
  ),
  'Banner studio': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 13h8M8 16h5" />
    </>
  ),
  'Consent records': (
    <>
      <path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4" />
    </>
  ),
  Integrations: (
    <>
      <path d="M8 3v5M16 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v4" />
    </>
  ),
  Billing: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  Settings: (
    <>
      <path d="m12 3 2 3 4-1 1 4 3 3-3 2 1 4-4 1-4 3-2-3-4 1-1-4-3-2 3-3-1-4 4 1z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};
function Icon({ name, size = 19 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  );
}
const date = (s: string) =>
  new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const human = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
async function request(path: string, data?: unknown) {
  let retryKey: string | undefined;
  if (data && /\/publish$|\/rollback$/.test(path)) {
    const payload = data as Record<string, unknown>;
    retryKey = 'accordly:publish:' + path + ':' + String(payload.releaseId || 'draft');
    let requestId = crypto.randomUUID();
    try {
      requestId = (sessionStorage.getItem(retryKey) || requestId) as typeof requestId;
      sessionStorage.setItem(retryKey, requestId);
    } catch {
      /* Storage may be disabled; the server can still resume a pending job. */
    }
    data = { ...payload, requestId };
  }
  const response = await fetch(
    '/api/' + path,
    data === undefined
      ? { cache: 'no-store' }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed');
  if (retryKey) {
    try {
      sessionStorage.removeItem(retryKey);
    } catch {}
  }
  return result;
}
function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: string }) {
  return (
    <span className={'badge ' + tone}>
      <i />
      {children}
    </span>
  );
}
export default function Dashboard() {
  const [view, setView] = useState<View>('Overview');
  const [state, setState] = useState<State | null>(null);
  const [selected, setSelected] = useState('proj_studio');
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [decision, setDecision] = useState('all');
  const [draft, setDraft] = useState<ConsentConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const reload = async () => {
    const next = await request('state');
    setState(next);
    return next as State;
  };
  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(false);
      if (e.key !== 'Tab') return;
      const controls = [
        ...document.querySelectorAll<HTMLElement>('.modal button:not(:disabled),.modal input'),
      ];
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        last?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first?.focus();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [modal]);
  const project = state?.projects.find((p) => p.id === selected) || state?.projects[0];
  useEffect(() => {
    if (project) {
      setDraft(structuredClone(project.draft));
      setDirty(false);
    }
  }, [project]);
  async function action(fn: () => Promise<unknown>, message: string) {
    setError('');
    setBusy(true);
    try {
      await fn();
      await reload();
      setToast(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }
  function openStudio(p: Project) {
    setSelected(p.id);
    setView('Banner studio');
  }
  async function createProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    await action(async () => {
      const p = await request('projects', {
        name: fields.get('name'),
        domain: fields.get('domain'),
      });
      setSelected(p.id);
      setModal(false);
      setView('Banner studio');
    }, 'Project created. Make it your own.');
  }
  function edit<K extends keyof ConsentConfig>(key: K, value: ConsentConfig[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  }
  async function publish() {
    if (!project || !draft) return;
    await action(async () => {
      await request(`projects/${project.id}/draft`, draft);
      await request(`projects/${project.id}/publish`, {});
    }, 'Your consent experience is published.');
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast('Copied to clipboard');
    } catch {
      setError('Clipboard unavailable. Select and copy the code below.');
    }
  }
  const total = state?.receipts.length || 0;
  const accepted = state?.receipts.filter((r) => r.action === 'accept').length || 0;
  const rejected = state?.receipts.filter((r) => r.action === 'reject').length || 0;
  const customized = state?.receipts.filter((r) => r.action === 'customize').length || 0;
  const active = state?.projects.filter((p) => p.activeRelease).length || 0;
  const install = project
    ? `<script type="module">\n  import { createConsentManager } from '${typeof window !== 'undefined' ? window.location.origin : ''}/api/sdk/0.2.0/consent.js';\n  const config = await fetch('${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/${project.id}/current').then(r => r.json());\n  const cmp = createConsentManager({ config }).initialize();\n  // Gate optional integrations with cmp.gate() before loading them.\n  if (!cmp.hasDecision()) cmp.showPreferences();\n</script>`
    : '';
  return (
    <div className="min-h-screen">
      <aside className="sidebar" inert={modal}>
        <a className="brand" href="/" aria-label="Accordly home">
          <BrandLogo />
        </a>
        <div className="workspace">
          <span className="workspace-avatar">A</span>
          <div>
            <strong>{state?.organization.name || 'Acme Studio'}</strong>
            <small>Workspace</small>
          </div>
          <span className="chevrons">
            ⌃<br />⌄
          </span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navigation.map((item) => (
            <button
              key={item}
              className={view === item ? 'nav-item active' : 'nav-item'}
              onClick={() => setView(item)}
            >
              <Icon name={item} />
              {item}
              {item === 'Projects' && (
                <span className="nav-count">{state?.projects.length || 0}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="open-source-card">
            <span className="sparkle">✧</span>
            <strong>
              Built for trust.
              <br />
              Open by design.
            </strong>
            <p>
              Your consent engine.
              <br />
              Your rules. Always.
            </p>
            <a href="https://github.com/sajal-01/saas-app" target="_blank" rel="noreferrer">
              Explore the source <span>↗</span>
            </a>
          </div>
          {(['Billing', 'Settings'] as View[]).map((item) => (
            <button
              key={item}
              className={'nav-item ' + (view === item ? 'active' : '')}
              onClick={() => setView(item)}
            >
              <Icon name={item} />
              {item}
            </button>
          ))}
          <div className="user">
            <span className="avatar">JD</span>
            <div>
              <strong>{state?.mode === 'live' ? state.viewer?.role : 'Demo owner'}</strong>
              <small>{state?.mode === 'live' ? 'Organization workspace' : 'Local workspace'}</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={modal}>
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span> <strong>{view}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-label">
              {state?.mode === 'live' ? 'ACCORDLY' : 'DEMO WORKSPACE'}
            </span>
            <button
              className="mobile-utility"
              aria-label="Billing"
              onClick={() => setView('Billing')}
            >
              <Icon name="Billing" size={17} />
            </button>
            <button
              className="mobile-utility"
              aria-label="Settings"
              onClick={() => setView('Settings')}
            >
              <Icon name="Settings" size={17} />
            </button>
            <a href="https://github.com/sajal-01/saas-app#readme" target="_blank" rel="noreferrer">
              Documentation ↗
            </a>
            <span className="avatar small">JD</span>
          </div>
        </header>
        <main>
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError('')}>
                ×
              </button>
            </div>
          )}
          {!state ? (
            <div className="loading">
              <span className="spinner" />
              <h2>Opening your workspace</h2>
              <p>Getting everything in order…</p>
              <button className="button" onClick={() => reload().catch((e) => setError(e.message))}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="page-heading flex items-center justify-between gap-5">
                <div>
                  <div className="eyebrow">YOUR PRIVACY WORKSPACE</div>
                  <h1>{view === 'Overview' ? 'Good things start with trust.' : view}</h1>
                  <p>
                    {
                      {
                        Overview: 'A clear view of your consent experience. All in one place.',
                        Projects: 'A thoughtful consent experience for every website.',
                        'Banner studio': 'Make privacy feel like part of your brand.',
                        'Consent records': 'Every choice matters. Here’s the record.',
                        Integrations: 'Connect your tools. Keep consent in control.',
                        Billing: 'A plan that grows with your ambition.',
                        Settings: 'The foundation of your workspace.',
                      }[view]
                    }
                  </p>
                </div>
                {['Overview', 'Projects'].includes(view) && (
                  <button className="button primary" onClick={() => setModal(true)}>
                    <span aria-hidden="true">＋</span> Create project
                  </button>
                )}
                {view === 'Consent records' && (
                  <a className="button" href="/api/export">
                    ↓ Export JSON
                  </a>
                )}
                {view === 'Banner studio' && (
                  <button className="button primary" disabled={busy} onClick={publish}>
                    ↑ Publish banner
                  </button>
                )}
              </div>
              {view === 'Overview' && (
                <>
                  <div className="welcome-card">
                    <div>
                      <span className="welcome-tag">
                        <span /> LET’S MAKE PRIVACY HUMAN
                      </span>
                      <h2>
                        Small banner.
                        <br />
                        Meaningful choices.
                      </h2>
                      <p>
                        Give your visitors a voice, and build a better
                        <br className="desktop-break" /> relationship with every visit.
                      </p>
                      <button
                        className="button dark"
                        onClick={() => {
                          if (project) openStudio(project);
                        }}
                      >
                        Customize your banner <span>↗</span>
                      </button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <span className="art-star">✳</span>
                      <span className="art-dot" />
                      <div className="mini-banner">
                        <BrandLogo className="mini-wordmark" />
                        <div className="mini-heart">♡</div>
                        <h3>
                          A little respect.
                          <br />A lot of trust.
                        </h3>
                        <p>
                          Your privacy is yours.
                          <br />
                          Let’s keep it that way.
                        </p>
                        <div className="mini-buttons">
                          <span>My preferences</span>
                          <span>Sounds good ✓</span>
                        </div>
                      </div>
                      <div className="trust-pill">
                        <span>✓</span> Privacy, with personality.
                      </div>
                    </div>
                  </div>
                  <div className="stats-grid">
                    {[
                      {
                        label: 'Total consent decisions',
                        value: total.toLocaleString(),
                        note: 'Recorded in this workspace',
                        icon: 'Consent records',
                      },
                      {
                        label: 'Accept-all rate',
                        value: total ? Math.round((accepted / total) * 100) + '%' : '—',
                        note: total
                          ? `${accepted} accept-all decisions`
                          : 'Waiting for your first decision',
                        icon: 'Overview',
                      },
                      {
                        label: 'Published projects',
                        value: `${active}`,
                        note: `${state.projects.length} ${state.projects.length === 1 ? 'project' : 'projects'} in your workspace`,
                        icon: 'Projects',
                      },
                      {
                        label: 'Configuration versions',
                        value: state.projects.reduce((n, p) => n + p.releases.length, 0).toString(),
                        note: 'Immutable, ready to roll back',
                        icon: 'Banner studio',
                      },
                    ].map((s) => (
                      <div className="stat-card" key={s.label}>
                        <div className="stat-label flex items-center justify-between">
                          {s.label}
                          <Icon name={s.icon} size={17} />
                        </div>
                        <strong>{s.value}</strong>
                        <small>{s.note}</small>
                      </div>
                    ))}
                  </div>
                  <div className="overview-grid">
                    <section className="card activity-card">
                      <div className="section-heading flex items-center justify-between gap-3">
                        <div>
                          <h2>Consent breakdown</h2>
                          <p>Real choices from your published experiences</p>
                        </div>
                        <span className="subtle-tag">All time</span>
                      </div>
                      {total ? (
                        <div className="breakdown">
                          <div className="stacked-bar">
                            {[
                              ['Accept all', accepted, '#177d65'],
                              ['Reject optional', rejected, '#e8ad75'],
                              ['Custom preferences', customized, '#9abeb3'],
                              ['Withdrawn', total - accepted - rejected - customized, '#c9cfcd'],
                            ].map(([label, n, color]) => (
                              <div
                                key={label}
                                title={`${label}: ${n}`}
                                style={{
                                  width: `${(Number(n) / total) * 100}%`,
                                  background: String(color),
                                }}
                              />
                            ))}
                          </div>
                          <div className="legend">
                            {[
                              ['Accept all', accepted],
                              ['Reject optional', rejected],
                              ['Custom preferences', customized],
                              ['Withdrawn', total - accepted - rejected - customized],
                            ].map(([label, n], i) => (
                              <div key={label}>
                                <i
                                  style={{
                                    background: ['#177d65', '#e8ad75', '#9abeb3', '#c9cfcd'][i],
                                  }}
                                />
                                <span>{label}</span>
                                <strong>{n}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="chart-empty">
                          <div className="chart-bars">
                            {[25, 46, 34, 66, 52, 80, 61, 100, 78, 115, 95, 130].map((h, i) => (
                              <i key={i} style={{ height: h }} />
                            ))}
                          </div>
                          <div>
                            <strong>Your first choices start here</strong>
                            <p>Publish a banner and try your demo site to see real data.</p>
                            <button
                              className="text-button"
                              onClick={() => {
                                if (project) openStudio(project);
                              }}
                            >
                              Set up your banner →
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="card-footer">
                        <span className="tiny-dot" /> No page-view tracking. Just consent decisions.
                      </div>
                    </section>
                    <section className="card checklist">
                      <div className="section-heading flex items-center justify-between gap-3">
                        <div>
                          <h2>Make yourself at home</h2>
                          <p>Your launch checklist</p>
                        </div>
                        <span className="progress-circle">
                          {1 + (active ? 2 : 0) + (total ? 1 : 0)}/4
                        </span>
                      </div>
                      {[
                        [
                          'Create your workspace',
                          'A place for all your projects.',
                          true,
                          () => setView('Settings'),
                        ],
                        [
                          'Make your banner yours',
                          'A little personality goes a long way.',
                          !!active,
                          () => {
                            if (project) openStudio(project);
                          },
                        ],
                        [
                          'Publish your first version',
                          'Ready when you are.',
                          !!active,
                          () => {
                            if (project) openStudio(project);
                          },
                        ],
                        [
                          'Collect your first decision',
                          'Try the interactive demo site.',
                          !!total,
                          () => {
                            if (project?.activeRelease)
                              window.open('/demo?project=' + project.id, '_blank', 'noopener');
                            else setError('Publish a banner first.');
                          },
                        ],
                      ].map(([title, description, done, click]) => (
                        <button
                          className="checklist-item"
                          key={String(title)}
                          onClick={click as () => void}
                        >
                          <span className={done ? 'check done' : 'check'}>{done ? '✓' : ''}</span>
                          <span>
                            <strong>{String(title)}</strong>
                            <small>{String(description)}</small>
                          </span>
                          <span className="check-arrow">↗</span>
                        </button>
                      ))}
                    </section>
                  </div>
                  <div className="section-heading flex items-center justify-between gap-3 projects-heading">
                    <div>
                      <h2>
                        Your projects <span className="count-pill">{state.projects.length}</span>
                      </h2>
                      <p>Good consent, wherever you build.</p>
                    </div>
                    <button className="text-button" onClick={() => setView('Projects')}>
                      View all projects →
                    </button>
                  </div>
                  <div className="project-grid">
                    {state.projects.slice(0, 2).map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        receipts={state.receipts.filter((r) => r.projectId === p.id).length}
                        onOpen={() => openStudio(p)}
                      />
                    ))}
                    <button className="new-project-card" onClick={() => setModal(true)}>
                      <span>＋</span>
                      <strong>Your next great project</strong>
                      <small>Add a website. Build more trust.</small>
                    </button>
                  </div>
                </>
              )}
              {view === 'Projects' && (
                <>
                  <div className="toolbar">
                    <label className="search">
                      ⌕{' '}
                      <input
                        aria-label="Search projects"
                        placeholder="Search projects or domains…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <span>{state.projects.length} projects</span>
                  </div>
                  <div className="project-grid full">
                    {state.projects
                      .filter((p) =>
                        (p.name + ' ' + p.domain).toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          receipts={state.receipts.filter((r) => r.projectId === p.id).length}
                          onOpen={() => openStudio(p)}
                        />
                      ))}
                    <button className="new-project-card" onClick={() => setModal(true)}>
                      <span>＋</span>
                      <strong>Create a project</strong>
                      <small>A new home for a better consent experience.</small>
                    </button>
                  </div>
                </>
              )}
              {view === 'Banner studio' && project && draft && (
                <>
                  {state.mode === 'live' && (
                    <PublishStatus
                      key={'publish-' + project.id}
                      projectId={project.id}
                      canManage={state.viewer?.role === 'admin'}
                      onComplete={reload}
                    />
                  )}
                  {state.mode === 'live' && (
                    <DomainSettings
                      key={project.id}
                      projectId={project.id}
                      canManage={state.viewer?.role === 'admin'}
                    />
                  )}
                  <div className="studio-toolbar flex items-center justify-between">
                    <label>
                      Project{' '}
                      <select
                        aria-label="Select project"
                        value={project.id}
                        onChange={(e) => setSelected(e.target.value)}
                      >
                        {state.projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div>
                      {dirty && <span className="unsaved">Unsaved changes</span>}
                      <Badge tone={project.activeRelease ? 'green' : 'orange'}>
                        {project.activeRelease ? 'Published' : 'Draft'}
                      </Badge>
                      <button
                        className="button compact"
                        disabled={busy || !dirty}
                        onClick={() =>
                          action(
                            () => request(`projects/${project.id}/draft`, draft),
                            'Draft saved',
                          )
                        }
                      >
                        Save draft
                      </button>
                    </div>
                  </div>
                  <div className="studio-grid">
                    <section className="card editor">
                      <h2>Words that build trust</h2>
                      <p>Be clear. Be yourself. Give people a real choice.</p>
                      <label>
                        Banner title
                        <input
                          value={draft.title}
                          maxLength={120}
                          onChange={(e) => edit('title', e.target.value)}
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          rows={3}
                          value={draft.description}
                          onChange={(e) => edit('description', e.target.value)}
                        />
                      </label>
                      <label>
                        Privacy policy URL
                        <input
                          type="url"
                          value={draft.privacyUrl}
                          onChange={(e) => edit('privacyUrl', e.target.value)}
                        />
                      </label>
                      <div className="form-row flex gap-4">
                        <label>
                          Accent color
                          <div className="color-field">
                            <input
                              aria-label="Accent color"
                              type="color"
                              value={draft.brandColor || '#177d65'}
                              onChange={(e) => edit('brandColor', e.target.value)}
                            />
                            <span>{draft.brandColor}</span>
                          </div>
                        </label>
                        <label>
                          Expires after (days)
                          <input
                            type="number"
                            min={1}
                            max={395}
                            value={draft.expirationDays}
                            onChange={(e) => edit('expirationDays', Number(e.target.value))}
                          />
                        </label>
                      </div>
                      <h3>Consent purposes</h3>
                      {draft.purposes.map((p, index) => (
                        <div className="purpose-editor" key={p.id}>
                          <div>
                            <strong>{p.name}</strong>
                            <Badge tone={p.required ? 'gray' : 'green'}>
                              {p.required ? 'Required' : 'Optional'}
                            </Badge>
                          </div>
                          <label className="sr-only" htmlFor={'purpose-' + p.id}>
                            {p.name} description
                          </label>
                          <textarea
                            id={'purpose-' + p.id}
                            rows={2}
                            value={p.description}
                            onChange={(e) =>
                              edit(
                                'purposes',
                                draft.purposes.map((other, i) =>
                                  i === index ? { ...other, description: e.target.value } : other,
                                ),
                              )
                            }
                          />
                        </div>
                      ))}
                    </section>
                    <section className="preview-area">
                      <div className="preview-label">
                        <span>
                          <i /> LIVE PREVIEW
                        </span>
                        <span>Desktop</span>
                      </div>
                      <div className="browser-frame">
                        <div className="browser-chrome">
                          <div>
                            <i />
                            <i />
                            <i />
                          </div>
                          <span>⌁ {project.domain}</span>
                        </div>
                        <div className="preview-page">
                          <div className="fake-navigation">
                            <b>your brand.</b>
                            <span>Home　 About　 Contact</span>
                          </div>
                          <div className="fake-content">
                            <span>A SPACE FOR YOUR NEXT IDEA</span>
                            <h2>
                              Something good
                              <br />
                              is on the way.
                            </h2>
                            <div />
                            <div />
                          </div>
                          <div className="banner-preview">
                            <span className="preview-brand" style={{ color: draft.brandColor }}>
                              ✳
                            </span>
                            <h3>{draft.title}</h3>
                            <p>{draft.description}</p>
                            {draft.purposes.map((p) => (
                              <div className="preview-purpose" key={p.id}>
                                <span>{p.name}</span>
                                <span className={p.required ? 'mini-toggle on' : 'mini-toggle'} />
                              </div>
                            ))}
                            <div className="preview-actions">
                              <span>Reject optional</span>
                              <span>Accept all</span>
                              <span style={{ background: draft.brandColor, color: 'white' }}>
                                Save preferences
                              </span>
                            </div>
                            <small>Privacy policy · Powered by Accordly</small>
                          </div>
                        </div>
                      </div>
                      <p className="preview-note">
                        Illustrative preview. Test the accessible, interactive SDK below.
                      </p>
                      <button
                        className="button"
                        disabled={!project.activeRelease}
                        onClick={() =>
                          window.open('/demo?project=' + project.id, '_blank', 'noopener')
                        }
                      >
                        ↗ Open published demo
                      </button>
                      <div className="install-card">
                        <h3>One small script. A better experience.</h3>
                        <p>Demo delivery endpoint. Gate integrations before they load.</p>
                        <pre>{install}</pre>
                        <button className="text-button" onClick={() => copy(install)}>
                          Copy install snippet ↗
                        </button>
                      </div>
                    </section>
                  </div>
                  <section className="card releases">
                    <div className="section-heading flex items-center justify-between gap-3">
                      <div>
                        <h2>Version history</h2>
                        <p>Every published configuration stays immutable.</p>
                      </div>
                    </div>
                    {!project.releases.length ? (
                      <p>No versions yet. Publish your first banner above.</p>
                    ) : (
                      project.releases.map((r) => (
                        <div className="release" key={r.id}>
                          <div>
                            <code>{r.id}</code>
                            <small>
                              {date(r.createdAt)} · {r.config.title}
                            </small>
                          </div>
                          {project.activeRelease === r.id ? (
                            <Badge>Current release</Badge>
                          ) : (
                            <button
                              className="button compact"
                              disabled={busy}
                              onClick={() =>
                                action(
                                  () =>
                                    request(`projects/${project.id}/rollback`, { releaseId: r.id }),
                                  'Previous release restored',
                                )
                              }
                            >
                              Restore version
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </section>
                </>
              )}
              {view === 'Consent records' && (
                <>
                  <div className="stats-grid three">
                    <div className="stat-card">
                      <span>Recorded decisions</span>
                      <strong>{total}</strong>
                      <small>Server-received browser assertions</small>
                    </div>
                    <div className="stat-card">
                      <span>Accept all</span>
                      <strong>{accepted}</strong>
                      <small>Optional purposes enabled</small>
                    </div>
                    <div className="stat-card">
                      <span>Reject optional</span>
                      <strong>{rejected}</strong>
                      <small>Required purposes only</small>
                    </div>
                  </div>
                  <section className="card">
                    <div className="toolbar">
                      <label className="search">
                        ⌕{' '}
                        <input
                          aria-label="Search receipts"
                          placeholder="Search receipt or project…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <select
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
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Receipt / received</th>
                            <th>Project</th>
                            <th>Decision</th>
                            <th>Purposes enabled</th>
                            <th>Version</th>
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
                                <td>
                                  <code>{r.receiptId.slice(0, 13)}…</code>
                                  <small>{new Date(r.receivedAt).toLocaleString()}</small>
                                </td>
                                <td>{state.projects.find((p) => p.id === r.projectId)?.name}</td>
                                <td>
                                  <Badge tone={r.action === 'accept' ? 'green' : 'gray'}>
                                    {human(r.action)}
                                  </Badge>
                                </td>
                                <td>
                                  {Object.entries(r.choices)
                                    .filter(([, value]) => value)
                                    .map(([key]) => key)
                                    .join(', ')}
                                </td>
                                <td>
                                  <code>{r.configurationVersion.slice(0, 12)}…</code>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {!total && (
                        <div className="empty-state">
                          <Icon name="Consent records" size={36} />
                          <h3>A fresh start for trust.</h3>
                          <p>Consent decisions from the published demo will appear here.</p>
                          <button className="button" onClick={() => setView('Banner studio')}>
                            Open banner studio →
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                  <p className="footnote">
                    Records reflect what a browser submitted, not verified identity. Exports include
                    full configuration version IDs and timestamps.
                  </p>
                </>
              )}
              {view === 'Integrations' && (
                <>
                  <div className="notice">
                    <span>ⓘ</span>
                    <div>
                      <strong>Your core works without a single third-party service.</strong>
                      <p>
                        Dummy service variables are configured for development. Only the local demo
                        and open-source SDK run today.
                      </p>
                    </div>
                  </div>
                  <div className="integration-grid">
                    {[
                      [
                        'G',
                        'Google Consent Mode',
                        'Map analytics and marketing choices to Google’s four consent signals.',
                        'SDK adapter available',
                        '#e8f1ff',
                      ],
                      [
                        'N',
                        'Next.js / React',
                        'Connect your app with a provider, preference hooks, and explicit gates.',
                        'Source adapter available',
                        '#efefef',
                      ],
                      [
                        'W',
                        'WordPress',
                        'Guided CMS installation and tag management.',
                        'Planned',
                        '#e7f0f5',
                      ],
                      [
                        'S',
                        'Shopify',
                        'Platform-specific privacy API and storefront integration.',
                        'Planned',
                        '#edf4dc',
                      ],
                      [
                        'C',
                        'Clerk',
                        'Organization authentication for the hosted control plane.',
                        'Dummy configuration',
                        '#eee9ff',
                      ],
                      [
                        'S',
                        'Stripe',
                        'Subscription checkout, invoices, and billing portal.',
                        'Dummy configuration',
                        '#eeecff',
                      ],
                      [
                        '☁',
                        'Cloudflare',
                        'R2 releases, edge delivery, and queued consent ingestion.',
                        'Deployment scaffold',
                        '#fff0de',
                      ],
                      [
                        'P',
                        'PostgreSQL',
                        'Tenant-isolated data, releases, receipts, and audit history.',
                        'Schema scaffold',
                        '#e8f1f6',
                      ],
                    ].map(([letter, title, description, status, color]) => (
                      <article className="card integration" key={title}>
                        <div className="integration-logo" style={{ background: color }}>
                          {letter}
                        </div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                        <Badge tone={status.includes('available') ? 'green' : 'gray'}>
                          {status}
                        </Badge>
                      </article>
                    ))}
                  </div>
                  <section className="card code-guide">
                    <h2>Explicit consent. Explicit integrations.</h2>
                    <p>
                      Initialize consent before vendor SDKs and stop future processing when
                      permission is withdrawn.
                    </p>
                    <pre>{`const cmp = createConsentManager({ config }).initialize();\n\nconst release = cmp.gate('analytics',\n  () => analytics.start(),\n  () => analytics.stop()\n);\n\n// Give visitors a persistent way to change their mind.\npreferencesButton.onclick = () => cmp.showPreferences();`}</pre>
                  </section>
                </>
              )}
              {view === 'Billing' && state.mode === 'live' && (
                <p>Live billing is not configured yet.</p>
              )}
              {view === 'Billing' && state.mode !== 'live' && (
                <>
                  <div className="notice">
                    <span>◇</span>
                    <div>
                      <strong>Explore plans in demo mode.</strong>
                      <p>
                        Plan changes are simulated locally. There is no checkout, charge, or live
                        subscription.
                      </p>
                    </div>
                  </div>
                  <div className="pricing-grid">
                    {[
                      [
                        'free',
                        'Hosted Free',
                        '0',
                        'For your first consent experience.',
                        '1 production domain',
                        '10k managed loads',
                        'Hosted configuration',
                        'Core consent controls',
                      ],
                      [
                        'starter',
                        'Starter',
                        '19',
                        'For independent sites getting serious.',
                        '1 production domain',
                        '100k managed loads',
                        'Consent records & export',
                        'Monthly website scan',
                      ],
                      [
                        'growth',
                        'Growth',
                        '59',
                        'For growing brands and small teams.',
                        '5 production domains',
                        '500k managed loads',
                        'Advanced reports',
                        'Scheduled scans & teams',
                      ],
                      [
                        'business',
                        'Business',
                        '199',
                        'For teams building trust at scale.',
                        '20 production domains',
                        '2M managed loads',
                        'Experiments & approvals',
                        'API access & longer retention',
                      ],
                    ].map(([id, title, price, description, ...features]) => (
                      <article
                        className={'card pricing ' + (id === 'growth' ? 'featured' : '')}
                        key={id}
                      >
                        {id === 'growth' && <div className="popular">ROOM TO GROW</div>}
                        <h3>{title}</h3>
                        <p>{description}</p>
                        <div className="price">
                          ${price}
                          <span>/ month</span>
                        </div>
                        <ul>
                          {features.map((f) => (
                            <li key={f}>
                              ✓ <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          disabled={busy || state.organization.plan === id}
                          className={'button ' + (id === 'growth' ? 'primary' : '')}
                          onClick={() =>
                            action(
                              () => request('billing', { plan: id }),
                              'Demo plan changed. No payment was taken.',
                            )
                          }
                        >
                          {state.organization.plan === id
                            ? 'Current demo plan'
                            : 'Try ' + title + ' in demo'}
                        </button>
                      </article>
                    ))}
                  </div>
                  <p className="footnote">
                    Proposed product packaging. Limits and premium features are not implemented or
                    enforced in this demo. Open-source core remains free to self-host.
                  </p>
                </>
              )}
              {view === 'Settings' && (
                <div className="settings-grid">
                  {state.mode === 'live' && <TeamSettings />}
                  <section className="card settings">
                    <h2>Workspace</h2>
                    <label>
                      Name
                      <input readOnly value={state.organization.name} />
                    </label>
                    <label>
                      Workspace identifier
                      <input readOnly value={state.organization.id || 'org_demo'} />
                    </label>
                    <label>
                      Current mode
                      <input
                        readOnly
                        value={
                          state.mode === 'live'
                            ? 'Clerk organization · PostgreSQL'
                            : 'Local demo · single organization'
                        }
                      />
                    </label>
                    <p className="footnote">
                      {state.mode === 'live'
                        ? 'Access is checked against current organization membership.'
                        : 'Demo mode uses a fixed workspace identity.'}
                    </p>
                  </section>
                  <section className="card settings">
                    <h2>Environment status</h2>
                    {[
                      [
                        'Authentication',
                        state.mode === 'live'
                          ? 'Clerk membership verification'
                          : 'Demo owner — no live login',
                      ],
                      [
                        'Storage',
                        state.mode === 'live'
                          ? 'PostgreSQL with tenant RLS'
                          : 'Local JSON · single-process only',
                      ],
                      ['Payments', 'Simulated · no Stripe requests'],
                      ['Configuration delivery', 'Local immutable releases'],
                      ['Public deployment', 'Blocked until live adapters exist'],
                    ].map(([label, value]) => (
                      <div className="setting-row" key={label}>
                        <strong>{label}</strong>
                        <span>{value}</span>
                      </div>
                    ))}
                  </section>
                  <section className="card audit">
                    <h2>Workspace activity</h2>
                    {!state.audit.length ? (
                      <p>Publish a banner or create a project to start your audit history.</p>
                    ) : (
                      state.audit.slice(0, 15).map((a) => (
                        <div className="audit-row" key={a.id}>
                          <span className="audit-dot" />
                          <div>
                            <strong>{a.action}</strong>
                            <small>
                              {a.actor} · {new Date(a.at).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      ))
                    )}
                  </section>
                </div>
              )}
              <footer className="main-footer">
                <span>
                  <Image
                    className="footer-app-icon"
                    src="/accordly.png"
                    alt=""
                    width={24}
                    height={24}
                  />{' '}
                  A little respect. A lot of trust.
                </span>
                <span>
                  Accordly <span>·</span> Open-core, always.
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>✓</span>
          {toast}
          <button onClick={() => setToast('')} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
      {modal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
          >
            <button
              className="modal-close"
              onClick={() => setModal(false)}
              aria-label="Close project dialog"
            >
              ×
            </button>
            <div className="modal-icon">
              <Icon name="Projects" size={28} />
            </div>
            <h2 id="new-project-title">A new space for trust.</h2>
            <p>Add your website. We’ll take it from there.</p>
            <form onSubmit={createProject}>
              <label>
                Project name
                <input
                  autoFocus
                  name="name"
                  placeholder="My wonderful website"
                  required
                  maxLength={80}
                />
              </label>
              <label>
                Website domain
                <input name="domain" placeholder="example.com" required />
              </label>
              <p className="footnote">
                Use a hostname without https://. Domain ownership verification is required before a
                future live deployment.
              </p>
              <div className="modal-actions flex justify-end gap-2.5">
                <button type="button" className="button" onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button className="button primary" disabled={busy}>
                  Create project →
                </button>
              </div>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function ProjectCard({
  project: p,
  receipts,
  onOpen,
}: {
  project: Project;
  receipts: number;
  onOpen: () => void;
}) {
  return (
    <article className="card project-card">
      <div className="project-top flex items-center justify-between">
        <div className="site-icon">{p.name.charAt(0).toUpperCase()}</div>
        <Badge tone={p.activeRelease ? 'green' : 'orange'}>
          {p.activeRelease ? 'Published' : 'Draft'}
        </Badge>
      </div>
      <h3>{p.name}</h3>
      <p>⌁ {p.domain}</p>
      <div className="project-meta flex justify-between">
        <span>
          <strong>{receipts}</strong> decisions
        </span>
        <span>{p.releases.length} versions</span>
      </div>
      <button onClick={onOpen}>
        Manage project <span>↗</span>
      </button>
    </article>
  );
}
