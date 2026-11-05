'use client';

import { useDashboardContext } from '@/components/dashboard/dashboard-context';
import { ProjectCard } from '@/components/dashboard/project-card';
import { SearchIcon } from 'lucide-react';

export default function ProjectsPage() {
  const {
    state,
    query,
    setQuery,
    openStudio,
    openCreateProject: onCreateProject,
  } = useDashboardContext();
  if (!state) return null;
  return (
    <>
      <div className="flex items-start flex-col justify-start gap-4 mb-5 text-muted-foreground text-[11px] [@media(max-width:720px)]:flex-wrap">
        <label className="flex text-[11px]  text-ink items-center gap-2 border border-line rounded-1.75 bg-surface focus:outline-none focus:ring-0 min-w-62.5 [@media(max-width:720px)]:min-w-0 [@media(max-width:720px)]:w-full py-0 px-3">
          <SearchIcon size={15} className="text-ink" />
          <input
            className="block w-full border-0 rounded-[6px] bg-surface text-ink! text-[11px]! focus:outline-none focus:ring-0  min-w-0 mx-0 py-2.5 px-0"
            aria-label="Search projects"
            placeholder="Search projects or domains…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span>{state.projects.length} projects</span>
      </div>
      <div className="grid grid-cols-3 gap-4.5 [@media(max-width:1000px)]:grid-cols-2 [@media(max-width:720px)]:gap-3">
        {state.projects
          .filter((p) => (p.name + ' ' + p.domain).toLowerCase().includes(query.toLowerCase()))
          .map((p) => (
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
            Create a project
          </strong>
          <small className="text-[10px] text-muted-foreground [@media(max-width:720px)]:text-[8px]">
            A new home for a better consent experience.
          </small>
        </button>
      </div>
    </>
  );
}
