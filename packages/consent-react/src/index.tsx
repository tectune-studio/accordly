'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createConsentManager,
  type ConsentConfig,
  type Manager,
  type Receipt,
} from '@accordly/core';
const Context = createContext<{ manager: Manager | null; choices: Record<string, boolean> }>({
  manager: null,
  choices: {},
});
export function ConsentProvider({
  config,
  onDecision,
  children,
}: {
  config: ConsentConfig;
  onDecision?: (receipt: Receipt) => unknown;
  children: ReactNode;
}) {
  const [manager, setManager] = useState<Manager | null>(null);
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const m = createConsentManager({ config, onDecision });
    const off = m.onConsentChange(setChoices);
    m.initialize();
    setManager(m);
    if (!m.hasDecision()) m.showPreferences();
    return () => {
      off();
      m.destroy();
    };
  }, [config, onDecision]);
  return <Context.Provider value={{ manager, choices }}>{children}</Context.Provider>;
}
export const useConsent = () => useContext(Context);
