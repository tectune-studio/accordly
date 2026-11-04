export interface Purpose {
  id: string;
  name: string;
  description: string;
  required: boolean;
}
export interface ConsentConfig {
  projectId: string;
  version: string;
  title: string;
  description: string;
  privacyUrl: string;
  expirationDays: number;
  purposes: Purpose[];
  brandColor?: string;
}
export interface Receipt {
  receiptId: string;
  projectId: string;
  configurationVersion: string;
  choices: Record<string, boolean>;
  action: 'accept' | 'reject' | 'customize' | 'withdraw';
  clientTimestamp: string;
  sdkVersion: string;
  source: string;
}
export interface Manager {
  initialize(): Manager;
  getConsent(): Record<string, boolean>;
  getReceipt(): Receipt | null;
  hasDecision(): boolean;
  isAllowed(id: string): boolean;
  onConsentChange(cb: (choices: Record<string, boolean>) => void): () => void;
  gate(id: string, enable: () => void, disable?: () => void): () => void;
  setConsent(choices: Record<string, boolean>, action?: Receipt['action']): Receipt;
  acceptAll(): Receipt;
  rejectAll(): Receipt;
  withdraw(): Receipt;
  showPreferences(): void;
  close(): void;
  destroy(): void;
}
export const SDK_VERSION: string;
export function validateConfig(config: ConsentConfig): ConsentConfig;
export function choicesFor(config: ConsentConfig, allowed?: boolean): Record<string, boolean>;
export function normalizeChoices(
  config: ConsentConfig,
  choices: Record<string, boolean>,
): Record<string, boolean>;
export function isValidStoredReceipt(
  config: ConsentConfig,
  receipt: unknown,
  now?: number,
): boolean;
export function defaultGoogleConsent(gtag: (...args: unknown[]) => void): void;
export function applyGoogleConsent(
  choices: Record<string, boolean>,
  gtag: (...args: unknown[]) => void,
): void;
export function createConsentManager(options: {
  config: ConsentConfig;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  onDecision?: (receipt: Receipt) => unknown;
  googleConsent?: (...args: unknown[]) => void;
  onError?: (error: unknown) => void;
}): Manager;
