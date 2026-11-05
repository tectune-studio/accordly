'use client';

import { useDashboardContext } from '@/components/dashboard/dashboard-context';
import DomainSettings from '@/components/dashboard/domain-settings';
import PublishStatus from '@/components/dashboard/publish-status';
import { Badge } from '@/components/dashboard/status-badge';
import { request } from '@/lib/dashboard/api';
import { buildInstallSnippet, date } from '@/lib/dashboard/utils';
import { Copy } from 'lucide-react';

export default function BannerStudioPage() {
  const { state, project, draft, dirty, busy, setSelected, edit, action, reload, copy } =
    useDashboardContext();
  if (!state) return null;
  if (!project || !draft) {
    return <p>Create a project to start configuring your consent banner.</p>;
  }

  const install = buildInstallSnippet(
    project,
    typeof window !== 'undefined' ? window.location.origin : '',
  );

  return (
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
      <div className="flex -mt-3 mb-3.75 gap-3.75 [@media(max-width:720px)]:flex-wrap items-center justify-between py-4 px-0">
        <label className="flex text-[11px] text-muted-foreground items-center gap-3">
          Project{' '}
          <select
            className="pr-7.5 pl-2.5 border border-line rounded-[6px] bg-surface text-ink! text-[11px]! py-2 motion-reduce:transition-none!"
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
        <div className="flex items-center gap-3 [@media(max-width:720px)]:w-full [@media(max-width:720px)]:justify-end">
          {dirty && <span className="text-[10px] text-(--brand-hover)">Unsaved changes</span>}
          <Badge tone={project.activeRelease ? 'green' : 'orange'}>
            {project.activeRelease ? 'Published' : 'Draft'}
          </Badge>
          <button
            className="inline-flex items-center justify-center gap-2.25 min-h-8.5 border border-line rounded-1.75 bg-surface text-[10px]! font-semibold! whitespace-nowrap py-1.75 px-3 motion-reduce:transition-none!"
            disabled={busy || !dirty}
            onClick={() =>
              action(() => request(`projects/${project.id}/draft`, draft), 'Draft saved')
            }
          >
            Save draft
          </button>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(280px,_0.9fr)_minmax(350px,_1.25fr)] gap-6.25 items-start [@media(max-width:1200px)]:grid-cols-2 [@media(max-width:1200px)]:gap-4.5 [@media(max-width:1000px)]:grid-cols-1!">
        <section className="bg-surface border border-line rounded-[10px] min-w-0 p-6.25 [@media(max-width:720px)]:p-5">
          <h2 className="text-[14px] tracking-[-0.2px] font-semibold m-0">
            Words that build trust
          </h2>
          <p className="text-muted-foreground mt-1.75 mb-5.75 text-[10px] mx-0">
            Be clear. Be yourself. Give people a real choice.
          </p>
          <label className="block text-[11px] text-ink">
            Banner title
            <input
              className="block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-surface text-ink! text-[12px]! mx-0 py-2.5 px-3"
              value={draft.title}
              maxLength={120}
              onChange={(e) => edit('title', e.target.value)}
            />
          </label>
          <label className="block text-[11px] text-ink">
            Description
            <textarea
              className="resize-y leading-[1.6]! block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-surface text-ink! text-[12px]! mx-0 py-2.5 px-3"
              rows={3}
              value={draft.description}
              onChange={(e) => edit('description', e.target.value)}
            />
          </label>
          <label className="block text-[11px] text-ink">
            Privacy policy URL
            <input
              className="block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-surface text-ink! text-[12px]! mx-0 py-2.5 px-3"
              type="url"
              value={draft.privacyUrl}
              onChange={(e) => edit('privacyUrl', e.target.value)}
            />
          </label>
          <div className="flex gap-4">
            <label className="block text-[11px] text-ink w-1/2">
              Accent color
              <div className="flex items-center gap-2 border border-(--line-strong) rounded-[6px] h-10 mt-1.5 mb-4.25 text-muted-foreground text-[10px] mx-0 py-0 px-1.75">
                <input
                  className="border-0 w-6.25 h-6.25 bg-transparent p-0"
                  aria-label="Accent color"
                  type="color"
                  value={draft.brandColor || '#433BCA'}
                  onChange={(e) => edit('brandColor', e.target.value)}
                />
                <span>{draft.brandColor}</span>
              </div>
            </label>
            <label className="block text-[11px] text-ink w-1/2">
              Expires after (days)
              <input
                className="block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-surface text-ink! text-[12px]! mx-0 py-2.5 px-3"
                type="number"
                min={1}
                max={395}
                value={draft.expirationDays}
                onChange={(e) => edit('expirationDays', Number(e.target.value))}
              />
            </label>
          </div>
          <h3 className="text-[12px] mt-3 mb-3.75 mx-0">Consent purposes</h3>
          {draft.purposes.map((p, index) => (
            <div className="border-t border-line pt-3.25" key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <strong className="text-[11px] font-medium">{p.name}</strong>
                <Badge tone={p.required ? 'gray' : 'green'}>
                  {p.required ? 'Required' : 'Optional'}
                </Badge>
              </div>
              <label className="sr-only" htmlFor={'purpose-' + p.id}>
                {p.name} description
              </label>
              <textarea
                className="resize-y leading-[1.6]! w-full text-[11px]! border border-line rounded-1.25 text-muted-foreground! mb-3 p-2"
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
        <section className="sticky top-6.25 [@media(max-width:1000px)]:static">
          <div className="flex justify-between text-2.25 text-muted-foreground tracking-[0.8px] mt-1.25 mb-3.5 mx-0">
            <span className="first:flex first:items-center first:gap-1.25">
              <i className="w-1.25 h-1.25 bg-brand rounded-full animate-pulse" /> PREVIEW
            </span>
            <span className="first:flex first:items-center first:gap-1.25">Desktop</span>
          </div>
          <div className="border border-line rounded-[10px] overflow-hidden shadow-[0_6px_24px_var(--shadow-color)]">
            <div className="bg-(--muted-background) flex items-center text-[8px] text-muted-foreground py-2.5 px-3.25">
              <div className="flex gap-1">
                <i className="w-1.5 h-1.5 rounded-full bg-(--muted-background)" />
                <i className="w-1.5 h-1.5 rounded-full bg-(--muted-background)" />
                <i className="w-1.5 h-1.5 rounded-full bg-(--muted-background)" />
              </div>
              <span className="m-auto">⌁ {project.domain}</span>
            </div>
            <div className="bg-canvas relative min-h-134 [@media(max-width:1000px)]:min-h-[450px] p-5 [@media(max-width:1200px)]:p-[15px]">
              <div className="flex justify-between items-center text-muted-foreground">
                <b className="font-sans text-4.25">your brand.</b>
                <span className="text-[8px]">Home　 About　 Contact</span>
              </div>
              <div className="py-8.75 px-3.5">
                <span className="text-1.75 tracking-[1px] text-muted-foreground">
                  A SPACE FOR YOUR NEXT IDEA
                </span>
                <h2 className="text-[32px] tracking-[-0.2px] font-normal font-sans leading-[1.2] text-muted-foreground my-3 mx-0">
                  Something good
                  <br />
                  is on the way.
                </h2>
                <div className="h-1.25 rounded-[3px] bg-(--muted-background) max-w-50 mb-2 last:max-w-37.5" />
                <div className="h-1.25 rounded-[3px] bg-(--muted-background) max-w-50 mb-2 last:max-w-37.5" />
              </div>
              <div className="relative mt-[-70px] mr-0 mb-0 ml-6.25 border border-line bg-surface rounded-[11px] shadow-[0_12px_28px_var(--shadow-color)] max-w-[370px] [@media(max-width:1200px)]:ml-0 [@media(max-width:1000px)]:mt-[-100px] [@media(max-width:1000px)]:mb-0 [@media(max-width:1000px)]:max-w-[360px] [@media(max-width:1000px)]:mx-auto! p-5.5 [@media(max-width:1200px)]:p-4.25">
                <h3 className="font-sans text-[22px] font-normal leading-[1.2] mt-3.5 mb-1.75 mx-0">
                  {draft.title}
                </h3>
                <p className="text-muted-foreground text-[10px] leading-[1.7] whitespace-pre-wrap wrap-anywhere my-1.5 mx-0">
                  {draft.description}
                </p>
                {draft.purposes.map((p) => (
                  <div
                    className="flex justify-between border-t border-line text-[10px] text-muted-foreground first-of-type:mt-4 py-2.5 px-0"
                    key={p.id}
                  >
                    <span>{p.name}</span>
                    <span
                      className={
                        p.required
                          ? "w-6 h-3.5 bg-brand rounded-2.25 relative after:content-[''] after:absolute after:w-2.5 after:h-2.5 after:left-3 after:top-0.5 after:rounded-full after:bg-surface"
                          : "w-6 h-3.5 bg-(--muted-background) rounded-2.25 relative after:content-[''] after:absolute after:w-2.5 after:h-2.5 after:left-0.5 after:top-0.5 after:rounded-full after:bg-surface"
                      }
                    />
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.25 mt-2.5 [@media(max-width:1200px)]:flex-wrap">
                  <span className="flex-1 whitespace-nowrap text-[8px] border border-line rounded-1.25 text-center text-muted-foreground [@media(max-width:1200px)]:text-1.75 [@media(max-width:1000px)]:text-2.25! py-2.25 px-1.5">
                    Reject optional
                  </span>
                  <span className="flex-1 whitespace-nowrap text-[8px] border border-line rounded-1.25 text-center text-muted-foreground [@media(max-width:1200px)]:text-1.75 [@media(max-width:1000px)]:text-2.25! py-2.25 px-1.5">
                    Accept all
                  </span>
                  <span
                    className="flex-1 whitespace-nowrap text-[8px] border border-line rounded-1.25 text-center text-white [@media(max-width:1200px)]:text-1.75 [@media(max-width:1000px)]:text-2.25! py-2.25 px-1.5"
                    style={{ background: draft.brandColor }}
                  >
                    Save preferences
                  </span>
                </div>
                <small className="block text-center text-1.75 text-muted-foreground mt-3.25">
                  Privacy policy · Powered by Accordly
                </small>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-[10px] text-center my-3 mx-0">
            Illustrative preview. Test the accessible, interactive SDK below.
          </p>
          <button
            className="flex items-center justify-center gap-2.25 min-h-10 border rounded-1.75 bg-(--accent-background) text-[11px]! font-semibold! whitespace-nowrap w-full border-line text-(--brand-hover)! py-2.5 px-4 motion-reduce:transition-none!"
            disabled={!project.activeRelease}
            onClick={() => window.open('/demo?project=' + project.id, '_blank', 'noopener')}
          >
            ↗ Open published demo
          </button>
          <div className="mt-6.25">
            <h3 className="text-3.25">One small script. A better experience.</h3>
            <p className="text-muted-foreground text-[10px] my-1.5 mx-0">
              Demo delivery endpoint. Gate integrations before they load.
            </p>
            <button
              className="border-0 flex space-x-2 items-center bg-transparent text-[10px]! font-semibold! text-(--brand-hover)! py-1.75 px-0 motion-reduce:transition-none!"
              onClick={() => copy(install)}
            >
              <Copy size={10} />
              <span>Copy install snippet</span>
            </button>
            <pre className="bg-(--inverse-background) text-(--inverse-foreground) border border-(--brand-hover) rounded-[8px] text-[10px] leading-[1.8] overflow-auto max-h-50 whitespace-pre p-4">
              {install}
            </pre>
          </div>
        </section>
      </div>
      <section className="bg-surface border border-line rounded-[10px] min-w-0 mt-6.25 p-[23px]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] tracking-[-0.2px] font-semibold [@media(max-width:720px)]:text-3.25 m-0">
              Version history
            </h2>
            <p className="text-muted-foreground mt-1 mb-1.5 text-[10px] [@media(max-width:720px)]:text-2.25 mx-0">
              Every published configuration stays immutable.
            </p>
          </div>
        </div>
        {!project.releases.length ? (
          <p className="text-muted-foreground text-[12px] my-1.5 mx-0 py-5 px-0">
            No versions yet. Publish your first banner above.
          </p>
        ) : (
          project.releases.map((r) => (
            <div
              className="flex items-center justify-between border-b border-line gap-3 last:border-0 py-4 px-0"
              key={r.id}
            >
              <div>
                <code className="text-[10px] text-(--brand-hover)">{r.id}</code>
                <small className="block text-muted-foreground text-[10px] mt-1">
                  {date(r.createdAt)} · {r.config.title}
                </small>
              </div>
              {project.activeRelease === r.id ? (
                <Badge>Current release</Badge>
              ) : (
                <button
                  className="inline-flex items-center justify-center gap-2.25 min-h-8.5 border border-line rounded-1.75 bg-surface text-[10px]! font-semibold! whitespace-nowrap py-1.75 px-3 motion-reduce:transition-none!"
                  disabled={busy}
                  onClick={() =>
                    action(
                      () => request(`projects/${project.id}/rollback`, { releaseId: r.id }),
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
  );
}
