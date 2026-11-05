'use client';

import { createContext, useContext } from 'react';
import type { useDashboard } from '@/hooks/use-dashboard';

export const DashboardContext = createContext<ReturnType<typeof useDashboard> | null>(null);

export function useDashboardContext() {
  const dashboard = useContext(DashboardContext);
  if (!dashboard) throw new Error('Dashboard pages must be rendered inside the dashboard layout.');
  return dashboard;
}
