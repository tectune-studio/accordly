'use client';

import { useDashboardContext } from '@/components/dashboard/dashboard-context';
import { cn } from 'cn';
import { getConsentStats } from '@/lib/dashboard/utils';
import { Icon } from '@/components/dashboard/icon';
import { ProjectCard } from '@/components/dashboard/project-card';
import BrandLogo from '@/components/brand-logo';
import { PenLine } from 'lucide-react';

export default function OverviewPage() {
  const {
    state,
    project,
    openStudio,
    setView,
    openCreateProject: onCreateProject,
    setError,
  } = useDashboardContext();
  if (!state) return null;

  const { total, accepted, rejected, customized, active } = getConsentStats(state);

  return (
    <>
      <div className="border border-line rounded-3.25 bg-(--accent-background) min-h-73 flex justify-between items-center overflow-hidden relative min-[1600px]:min-h-[320px] [@media(max-width:1000px)]:min-h-[275px] [@media(max-width:720px)]:min-h-62.5 py-7.5 px-8.75 [@media(max-width:1200px)]:p-7 [@media(max-width:1000px)]:p-6! [@media(max-width:720px)]:py-6.25! [@media(max-width:720px)]:px-5!">
        <div>
          <span className="flex items-center gap-1.5 tracking-[1.3px] text-[8px] font-semibold text-(--brand-hover)">
            <span className="w-1.25 h-1.25 bg-brand rounded-full" /> LET’S MAKE PRIVACY HUMAN
          </span>
          <h2 className="text-[38px] tracking-[-0.8px] mt-4 mb-3 font-normal font-sans leading-[1.12] text-ink min-[1600px]:text-[45px] [@media(max-width:1200px)]:text-[34px] [@media(max-width:1000px)]:text-[31px]! [@media(max-width:720px)]:text-7.5! mx-0">
            Small banner.
            <br />
            Meaningful choices.
          </h2>
          <p className="text-muted-foreground text-[11px] leading-[1.8] [@media(max-width:720px)]:text-[10px] [@media(max-width:720px)]:max-w-[190px] my-1.5 mx-0">
            Give your visitors a voice, and build a better
            <br /> relationship with every visit.
          </p>
          <button
            className="inline-flex items-center justify-center gap-2.25 min-h-10 border rounded-1.75 bg-brand text-md font-semibold! whitespace-nowrap border-brand text-(--on-brand)! mt-5 [@media(max-width:720px)]:text-xs! [@media(max-width:720px)]:mt-3.25 enabled:hover:bg-(--brand-hover) enabled:hover:border-(--brand-hover) enabled:hover:filter-none! py-[11px] px-[15px] [@media(max-width:720px)]:py-2.25 [@media(max-width:720px)]:px-2.5 motion-reduce:transition-none!"
            onClick={() => {
              if (project) openStudio(project);
            }}
          >
            Customize Banner{' '}
            <span className="ml-4.5 [@media(max-width:720px)]:ml-0">
              <PenLine size={15} />
            </span>
          </button>
        </div>
        <div
          className="w-[48%] h-[240px] relative flex justify-center items-center isolate min-[1600px]:mr-[60px] [@media(max-width:1200px)]:w-[45%] [@media(max-width:720px)]:w-[43%] [@media(max-width:720px)]:h-50"
          aria-hidden="true"
        >
          <div className="absolute w-[300px] h-[300px] border border-line rounded-full z-[-1] [@media(max-width:720px)]:w-[220px] [@media(max-width:720px)]:h-[220px]" />
          <div className="absolute w-[410px] h-[410px] border rounded-full z-[-1] border-dashed border-line rotate-[-20deg] [@media(max-width:720px)]:w-[300px] [@media(max-width:720px)]:h-[300px]" />
          <span className="absolute top-1.75 right-[15%] text-[62px] text-muted-foreground rotate-[12deg] [@media(max-width:1200px)]:right-0 [@media(max-width:1000px)]:text-[50px] [@media(max-width:1000px)]:right-[-5px]! [@media(max-width:720px)]:text-[41px] [@media(max-width:720px)]:right-[-12px]! [@media(max-width:720px)]:top-[-9px]">
            ✳
          </span>
          <span className="absolute bottom-2.25 left-[9%] w-5.5 h-5.5 rounded-full bg-(--accent-strong) [@media(max-width:720px)]:left-[2%] [@media(max-width:720px)]:bottom-0 [@media(max-width:720px)]:w-4.25 [@media(max-width:720px)]:h-4.25" />
          <div className="relative w-62.5 rounded-3.25 bg-surface shadow-[0_12px_35px_var(--shadow-color)] border border-line rotate-[-5deg] [@media(max-width:1200px)]:w-[220px] [@media(max-width:1000px)]:w-[195px]! [@media(max-width:720px)]:w-[165px]! py-4.5 px-5 [@media(max-width:1000px)]:p-[15px] [@media(max-width:720px)]:p-3.25">
            <BrandLogo className="w-26.25" />
            <div className="absolute right-4.5 top-4 text-[23px] text-(--brand-hover) [@media(max-width:720px)]:text-[19px] [@media(max-width:720px)]:right-3">
              ♡
            </div>
            <h3 className="font-sans text-6.25 font-normal leading-[1.1] mt-3.5 mb-2 text-ink [@media(max-width:1000px)]:text-[23px] [@media(max-width:720px)]:text-[20px] mx-0">
              Your Trust.
              <br />
              Your Choice.
            </h3>
            <p className="text-muted-foreground text-2.25 leading-[1.5] [@media(max-width:720px)]:text-[8px] [@media(max-width:720px)]:max-w-[190px] my-1.5 mx-0">
              Your privacy is yours.
              <br />
              Let’s keep it that way.
            </p>
            <div className="flex gap-1.75 mt-4.25 text-1.75 [@media(max-width:1200px)]:text-[6px] [@media(max-width:720px)]:flex-col [@media(max-width:720px)]:gap-1">
              <span className="border border-line rounded-1.25 flex-1 text-center whitespace-nowrap last:bg-brand last:text-(--on-brand) last:border-brand p-2 [@media(max-width:720px)]:p-1.25">
                My preferences
              </span>
              <span className="border border-line rounded-1.25 flex-1 text-center whitespace-nowrap last:bg-brand last:text-(--on-brand) last:border-brand p-2 [@media(max-width:720px)]:p-1.25">
                Sounds good ✓
              </span>
            </div>
          </div>
          <div className="absolute -bottom-0.5 right-[9%] bg-surface border border-line rounded-[20px] shadow-[0_5px_16px_var(--shadow-color)] text-2.25 rotate-[3deg] [@media(max-width:1200px)]:right-0 [@media(max-width:1200px)]:bottom-1.75 [@media(max-width:1000px)]:text-[8px] [@media(max-width:1000px)]:right-[-5px]! [@media(max-width:720px)]:hidden py-2.5 px-4.25 [@media(max-width:1000px)]:py-2 [@media(max-width:1000px)]:px-2.5">
            <span className="text-(--brand-hover) mr-1.5">✓</span> Privacy, with personality.
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 [@media(max-width:1200px)]:gap-2.5 [@media(max-width:1000px)]:grid-cols-2 [@media(max-width:720px)]:mt-4 my-[23px] mx-0">
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
            note: total ? `${accepted} accept-all decisions` : 'Waiting for your first decision',
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
            icon: 'Banner Studio',
          },
        ].map((s) => (
          <div
            data-testid="stat-card"
            className="bg-surface border border-line rounded-2.25 pt-[19px] pb-4.25 min-h-[133px] px-[19px] [@media(max-width:1200px)]:p-[15px] [@media(max-width:720px)]:p-4"
            key={s.label}
          >
            <div className="flex text-[10px] text-muted-foreground gap-1.75 [@media(max-width:1200px)]:text-2.25 [@media(max-width:1000px)]:text-[10px]! items-center justify-between">
              {s.label}
              <Icon name={s.icon} size={17} />
            </div>
            <strong className="text-[28px] tracking-[-0.6px] font-medium block [@media(max-width:720px)]:text-6.25 my-2.5 mx-0">
              {s.value}
            </strong>
            <small className="text-2.25 text-muted-foreground block [@media(max-width:720px)]:text-[8px]">
              {s.note}
            </small>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1.35fr_1fr] gap-5 min-[1600px]:grid-cols-[1.5fr_1fr] [@media(max-width:1200px)]:gap-3.75 [@media(max-width:1000px)]:grid-cols-1">
        <section className="bg-surface border border-line rounded-[10px] min-w-0">
          <div className="flex pt-5.5 pb-0 items-center justify-between gap-3 px-5.5">
            <div>
              <h2 className="text-[14px] tracking-[-0.2px] font-semibold [@media(max-width:720px)]:text-3.25 m-0">
                Consent breakdown
              </h2>
              <p className="text-muted-foreground mt-1 mb-1.5 text-[10px] [@media(max-width:720px)]:text-2.25 mx-0">
                Real choices from your published experiences
              </p>
            </div>
            <span className="border border-line rounded-1.25 text-muted-foreground text-2.25 whitespace-nowrap py-1.25 px-2.25">
              All time
            </span>
          </div>
          {total ? (
            <div className="min-h-[205px] py-10 px-6.25">
              <div
                data-testid="consent-breakdown-bar"
                className="h-5.5 flex overflow-hidden rounded-[6px]"
              >
                {[
                  ['Accept all', accepted, 'bg-(--chart-accepted)'],
                  ['Reject optional', rejected, 'bg-(--chart-rejected)'],
                  ['Custom preferences', customized, 'bg-(--chart-customized)'],
                  ['Withdrawn', total - accepted - rejected - customized, 'bg-(--chart-withdrawn)'],
                ].map(([label, n, background]) => (
                  <div
                    key={label}
                    title={`${label}: ${n}`}
                    className={String(background)}
                    style={{ width: `${(Number(n) / total) * 100}%` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-[15px_20px] mt-6.25 [@media(max-width:720px)]:text-2.25">
                {[
                  ['Accept all', accepted],
                  ['Reject optional', rejected],
                  ['Custom preferences', customized],
                  ['Withdrawn', total - accepted - rejected - customized],
                ].map(([label, n], i) => (
                  <div
                    className="flex items-center gap-1.75 text-[10px] text-muted-foreground"
                    key={label}
                  >
                    <i
                      data-testid="consent-legend-swatch"
                      className={cn(
                        'size-1.75 rounded-[2px]',
                        [
                          'bg-(--chart-accepted)',
                          'bg-(--chart-rejected)',
                          'bg-(--chart-customized)',
                          'bg-(--chart-withdrawn)',
                        ][i],
                      )}
                    />
                    <span>{label}</span>
                    <strong className="ml-auto text-[11px] font-medium text-ink">{n}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[205px] relative overflow-hidden grid place-items-center my-0 mx-5.5">
              <div className="absolute inset-[35px_10px_10px] flex items-end justify-around gap-2 opacity-[0.55] bg-[repeating-linear-gradient(to_top,var(--line)_0,var(--line)_1px,transparent_1px,transparent_35px)]">
                {[25, 46, 34, 66, 52, 80, 61, 100, 78, 115, 95, 130].map((h, i) => (
                  <i
                    className="bg-[linear-gradient(var(--accent-strong),var(--canvas))] rounded-[4px_4px_0_0] flex-1 max-w-6 border-t-2 border-line"
                    key={i}
                    style={{ height: h }}
                  />
                ))}
              </div>
              <div className="relative z-[1] rounded-[10px] bg-(--surface-overlay) px-4 py-3.25 text-center">
                <strong className="text-3.25 font-medium">Your first choices start here</strong>
                <p className="text-muted-foreground text-[10px] max-w-62.5 my-1.5 mx-0">
                  Publish a banner and try your demo site to see real data.
                </p>
                <button
                  className="border-0 bg-transparent text-[10px]! font-semibold! text-(--brand-hover)! py-1.75 px-0 motion-reduce:transition-none!"
                  onClick={() => {
                    if (project) openStudio(project);
                  }}
                >
                  Set up your banner →
                </button>
              </div>
            </div>
          )}
          <div className="border-t border-line text-2.25 text-muted-foreground flex gap-1.75 items-center py-3.25 px-5.5">
            <span className="w-1.25 h-1.25 bg-brand rounded-full" /> No page-view tracking. Just
            consent decisions.
          </div>
        </section>
        <section className="bg-surface border border-line rounded-[10px] min-w-0 pb-2.5 [@media(max-width:1000px)]:grid [@media(max-width:1000px)]:grid-cols-2">
          <div className="flex pt-5.5 pb-0 [@media(max-width:1000px)]:col-span-full [@media(max-width:1000px)]:mb-1.25 items-center justify-between gap-3 px-5.5">
            <div>
              <h2 className="text-[14px] tracking-[-0.2px] font-semibold [@media(max-width:720px)]:text-3.25 m-0">
                Make yourself at home
              </h2>
              <p className="text-muted-foreground mt-1 mb-1.5 text-[10px] [@media(max-width:720px)]:text-2.25 mx-0">
                Your launch checklist
              </p>
            </div>
            <span className="border-3 border-line border-r-brand rounded-full text-2.25 w-[34px] h-[34px] grid place-items-center text-(--brand-hover)">
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
              className="flex items-center bg-transparent border-0 w-full text-left! gap-3 py-3.25 px-5.5 [@media(max-width:1000px)]:py-3 [@media(max-width:1000px)]:px-5 motion-reduce:transition-none!"
              key={String(title)}
              onClick={click as () => void}
            >
              <span
                className={
                  done
                    ? 'w-[19px] h-[19px] border rounded-full shrink-0 grid place-items-center bg-(--accent-background) border-line text-(--brand-hover) text-[11px]'
                    : 'w-[19px] h-[19px] border border-line rounded-full shrink-0'
                }
              >
                {done ? '✓' : ''}
              </span>
              <span>
                <strong className="text-[11px] font-medium block">{String(title)}</strong>
                <small className="text-2.25 block text-muted-foreground mt-0.5">
                  {String(description)}
                </small>
              </span>
              <span className="ml-auto text-muted-foreground text-[12px]">↗</span>
            </button>
          ))}
        </section>
      </div>
      <div className="flex mt-7 mb-4.25 [@media(max-width:720px)]:mt-6.25 items-center justify-between gap-3 mx-0">
        <div>
          <h2 className="text-[14px] tracking-[-0.2px] font-semibold [@media(max-width:720px)]:text-3.25 m-0">
            Your projects{' '}
            <span className="font-sans text-2.25 text-muted-foreground bg-(--accent-background) rounded-[4px] ml-1.5 py-[3px] px-1.5">
              {state.projects.length}
            </span>
          </h2>
          <p className="text-muted-foreground mt-1 mb-1.5 text-[10px] [@media(max-width:720px)]:text-2.25 mx-0">
            Good consent, wherever you build.
          </p>
        </div>
        <button
          className="border-0 bg-transparent text-[10px]! font-semibold! text-(--brand-hover)! py-1.75 px-0 motion-reduce:transition-none!"
          onClick={() => setView('Projects')}
        >
          View all projects →
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4.5 [@media(max-width:1000px)]:grid-cols-2 [@media(max-width:720px)]:gap-3">
        {state.projects.slice(0, 2).map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            receipts={state.receipts.filter((r) => r.projectId === p.id).length}
            onOpen={() => openStudio(p)}
          />
        ))}
        <button
          className="border border-dashed border-(--line-strong) rounded-[10px] bg-canvas min-h-[210px] flex items-center justify-center flex-col gap-2 [@media(max-width:1000px)]:min-h-[210px] motion-reduce:transition-none!"
          onClick={() => onCreateProject()}
        >
          <span className="border border-line bg-(--accent-background) rounded-full w-7.5 h-7.5 grid place-items-center text-muted-foreground text-[19px]">
            ＋
          </span>
          <strong className="text-[12px] font-medium mt-1.25 text-muted-foreground [@media(max-width:720px)]:text-[11px]">
            Your next great project
          </strong>
          <small className="text-[10px] text-muted-foreground [@media(max-width:720px)]:text-[8px]">
            Add a website. Build more trust.
          </small>
        </button>
      </div>
    </>
  );
}
