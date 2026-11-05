'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ConsentConfig } from '@accordly/core';
import { usePathname, useRouter } from 'next/navigation';
import { viewFromPathname, viewPaths } from '@/lib/dashboard/navigation';
import { request } from '@/lib/dashboard/api';
import type { Project, State, View } from '@/lib/dashboard/types';

export function useDashboard() {
  const router = useRouter();
  const view = viewFromPathname(usePathname());
  const setView = useCallback((next: View) => router.push(viewPaths[next]), [router]);
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
    const next = await request<State>('state');
    setState(next);
    return next;
  };

  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const project = state?.projects.find((item) => item.id === selected) || state?.projects[0];
  useEffect(() => {
    if (project) {
      setDraft(structuredClone(project.draft));
      setDirty(false);
    }
  }, [project]);

  const openCreateProject = useCallback(() => setModal(true), []);
  const closeCreateProject = useCallback(() => setModal(false), []);
  const dismissToast = useCallback(() => setToast(''), []);

  async function action(operation: () => Promise<unknown>, message: string) {
    setError('');
    setBusy(true);
    try {
      await operation();
      await reload();
      setToast(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  function openStudio(item: Project) {
    setSelected(item.id);
    setView('Banner Studio');
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    await action(async () => {
      const created = await request<Project>('projects', {
        name: fields.get('name'),
        domain: fields.get('domain'),
      });
      setSelected(created.id);
      setModal(false);
      setView('Banner Studio');
    }, 'Project created. Make it your own.');
  }

  function edit<K extends keyof ConsentConfig>(key: K, value: ConsentConfig[K]) {
    setDraft((previous) => (previous ? { ...previous, [key]: value } : previous));
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

  return {
    view,
    setView,
    state,
    project,
    setSelected,
    modal,
    openCreateProject,
    closeCreateProject,
    toast,
    dismissToast,
    error,
    setError,
    busy,
    query,
    setQuery,
    decision,
    setDecision,
    draft,
    dirty,
    reload,
    action,
    openStudio,
    createProject,
    edit,
    publish,
    copy,
  };
}
