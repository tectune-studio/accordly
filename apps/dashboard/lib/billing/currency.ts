/**
 * Currency helpers for the public pricing section.
 *
 * - Detects the visitor's currency from their location WITHOUT any third-party
 *   IP lookup (important for a consent product): the server route /api/geo
 *   reads the country header your edge already adds (Cloudflare, Vercel or
 *   CloudFront), then we fall back to the browser locale, then USD.
 * - Converts the USD list prices from `plans` into the selected currency and
 *   formats them.
 */

export const CURRENCY_CODES = [
  'EUR',
  'USD',
  'GBP',
  'CAD',
  'AUD',
  'BRL',
  'JPY',
  'INR',
  'SGD',
] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

/** Date the `rate` values below were taken (ECB reference rates, converted to USD base). */
export const RATES_AS_OF = '2026-11-06';

type CurrencyConfig = {
  code: CurrencyCode;
  /** Shown in the dropdown, e.g. "Euro (€)". */
  label: string;
  /** Prefix used when formatting amounts. */
  symbol: string;
  /** Locale used only for digit grouping / decimal separator. */
  numberLocale: string;
  /** Max fraction digits shown (JPY has none). */
  decimals: number;
  /** Units of this currency per 1 USD. */
  rate: number;
  /** Converted prices are rounded to a multiple of this (keeps prices tidy). */
  step: number;
};

// Update `rate` periodically, or replace convertFromUsd() with an explicit
// per-currency price table once you set final local prices in Stripe.
export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: {
    code: 'EUR',
    label: 'Euro (€)',
    symbol: '€',
    numberLocale: 'en-IE',
    decimals: 2,
    rate: 0.8957,
    step: 1,
  },
  USD: {
    code: 'USD',
    label: 'US Dollar ($)',
    symbol: '$',
    numberLocale: 'en-US',
    decimals: 2,
    rate: 1,
    step: 1,
  },
  GBP: {
    code: 'GBP',
    label: 'British Pound (£)',
    symbol: '£',
    numberLocale: 'en-GB',
    decimals: 2,
    rate: 0.7471,
    step: 1,
  },
  CAD: {
    code: 'CAD',
    label: 'Canadian Dollar (CA$)',
    symbol: 'CA$',
    numberLocale: 'en-CA',
    decimals: 2,
    rate: 1.4066,
    step: 1,
  },
  AUD: {
    code: 'AUD',
    label: 'Australian Dollar (A$)',
    symbol: 'A$',
    numberLocale: 'en-AU',
    decimals: 2,
    rate: 1.4554,
    step: 1,
  },
  BRL: {
    code: 'BRL',
    label: 'Brazilian Real (R$)',
    symbol: 'R$',
    numberLocale: 'pt-BR',
    decimals: 2,
    rate: 5.5037,
    step: 1,
  },
  JPY: {
    code: 'JPY',
    label: 'Japanese Yen (¥)',
    symbol: '¥',
    numberLocale: 'ja-JP',
    decimals: 0,
    rate: 158.3251,
    step: 100,
  },
  INR: {
    code: 'INR',
    label: 'Indian Rupee (₹)',
    symbol: '₹',
    numberLocale: 'en-IN',
    decimals: 2,
    rate: 93.9225,
    step: 10,
  },
  SGD: {
    code: 'SGD',
    label: 'Singapore Dollar (S$)',
    symbol: 'S$',
    numberLocale: 'en-SG',
    decimals: 2,
    rate: 1.2816,
    step: 1,
  },
};

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (CURRENCY_CODES as readonly string[]).includes(value);
}

/* ------------------------------ location → currency ------------------------------ */

// Euro-area members (Bulgaria joined on 1 Jan 2026) plus states that use the euro.
const EURO_COUNTRIES = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PT',
  'SK',
  'SI',
  'ES',
  'AD',
  'MC',
  'SM',
  'VA',
  'ME',
  'XK',
];

const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  ...Object.fromEntries(EURO_COUNTRIES.map((c) => [c, 'EUR' as const])),
  US: 'USD',
  GB: 'GBP',
  GG: 'GBP',
  JE: 'GBP',
  IM: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  BR: 'BRL',
  JP: 'JPY',
  IN: 'INR',
  SG: 'SGD',
};

/** Accepts "in", "IN", etc. Returns null for junk or the "unknown" codes CDNs send (XX, T1). */
export function normalizeCountry(value?: string | null): string | null {
  const code = value?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') return null;
  return code;
}

/** Country → one of our currencies. Any country we don't list falls back to USD. */
export function currencyForCountry(country?: string | null): CurrencyCode {
  const code = normalizeCountry(country);
  return (code && COUNTRY_CURRENCY[code]) || DEFAULT_CURRENCY;
}

/** Uses only an explicit region in the browser's language list (e.g. "en-IN"), never a guess from "en". */
export function currencyFromBrowserLocale(): CurrencyCode | null {
  if (typeof navigator === 'undefined') return null;
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    try {
      const region = normalizeCountry(new Intl.Locale(tag).region);
      if (region) return currencyForCountry(region);
    } catch {
      /* ignore malformed tags */
    }
  }
  return null;
}

/* ------------------------------ remembered choice ------------------------------ */

const STORAGE_KEY = 'accordly:currency';

export function getStoredCurrency(): CurrencyCode | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isCurrencyCode(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeCurrency(code: CurrencyCode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* storage can be unavailable (private mode, blocked) */
  }
}

/**
 * Client-side detection order:
 *   1. currency the visitor picked before
 *   2. country from our own /api/geo route (edge header)
 *   3. region of the browser language
 *   4. USD
 */
export async function detectCurrency(): Promise<CurrencyCode> {
  const stored = getStoredCurrency();
  if (stored) return stored;
  try {
    const res = await fetch('/api/geo', { cache: 'no-store' });
    if (res.ok) {
      const data: { country?: string | null } = await res.json();
      if (normalizeCountry(data.country)) return currencyForCountry(data.country);
    }
  } catch {
    /* offline or route missing: fall through */
  }
  return currencyFromBrowserLocale() ?? DEFAULT_CURRENCY;
}

/* ------------------------------ conversion & formatting ------------------------------ */

/** Converts a USD list price and rounds it to the currency's step. 0 stays 0. */
export function convertFromUsd(usd: number, code: CurrencyCode): number {
  if (usd <= 0) return 0;
  const { rate, step } = CURRENCIES[code];
  return Math.max(step, Math.round((usd * rate) / step) * step);
}

/** "₹1,130", "¥1,900", "$10.83". Whole amounts never show ".00". */
export function formatMoney(amount: number, code: CurrencyCode): string {
  const { symbol, numberLocale, decimals } = CURRENCIES[code];
  const digits = new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${symbol}${digits}`;
}
