'use client';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Users, HelpCircle, X } from 'lucide-react';
import {
  CURRENCIES,
  CURRENCY_CODES,
  DEFAULT_CURRENCY,
  convertFromUsd,
  detectCurrency,
  formatMoney,
  storeCurrency,
  type CurrencyCode,
} from '@/lib/billing/currency';
import { FEATURE_MATRIX, PLANS } from '@/lib/billing/pricing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Plan = (typeof PLANS)[number];
type Billing = 'monthly' | 'annual';
// Highlight Plan
const HIGHLIGHT_PLAN_ID = 'business';
// Highlight Label
const HIGHLIGHT_LABEL = 'Most Subscribed';
const INCREMENTAL_FEATURES = false;

const PLAN_BLURBS: Record<string, string> = {
  starter: 'For a single site getting started with consent choices.',
  pro: 'For growing teams managing consent across more domains.',
  business: 'For teams that need more visitors, domains and controls.',
  agency: 'For agencies managing consent across client projects.',
};

type PriceView =
  | { kind: 'custom' }
  | { kind: 'paid'; label: string; current: string; strike?: string; pill?: string };

function buildPrice(plan: Plan, billing: Billing, currency: CurrencyCode): PriceView {
  const money = (amount: number) => formatMoney(amount, currency);

  if (plan.id === 'agency') {
    return { kind: 'paid', label: 'From', current: money(convertFromUsd(199, currency)) };
  }

  const monthlyUsd = plan.monthly;
  const usd = plan[billing];

  if (usd === null || monthlyUsd === null) return { kind: 'custom' };

  const monthly = convertFromUsd(monthlyUsd as number, currency);
  if (billing === 'monthly') {
    return { kind: 'paid', label: 'Billed monthly', current: money(monthly) };
  }

  const ratio = (usd as number) / (monthlyUsd as number);
  const annual = Math.round(monthly * ratio);
  const monthsFree = 12 - ratio;
  const pill =
    monthsFree >= 1 && Number.isInteger(monthsFree)
      ? `${monthsFree} months free`
      : `${Math.round((1 - ratio / 12) * 100)}% off`;

  return {
    kind: 'paid',
    label: `Billed yearly at ${money(annual)}`,
    current: money(annual / 12),
    strike: money(monthly),
    pill,
  };
}

function CurrencyPicker({
  value,
  onChange,
}: {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  }, [open]);

  const choose = (code: CurrencyCode) => {
    onChange(code);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[Math.min(index + 1, items.length - 1)]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[Math.max(index - 1, 0)]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${CURRENCIES[value].label}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full border-0  bg-gray-50 px-3 py-2 sm:text-[14px] text-xs font-semibold text-black"
      >
        {value}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Currency"
          onKeyDown={onListKeyDown}
          className="absolute top-[calc(100%+6px)] sm:right-0 -right-40 z-30 max-h-[260px] w-[220px] overflow-y-auto rounded-[10px] bg-[var(--surface)] py-[6px] shadow-[0_8px_30px_rgba(0,0,0,0.16)] "
        >
          {CURRENCY_CODES.map((code) => (
            <li
              key={code}
              role="option"
              tabIndex={-1}
              aria-selected={code === value}
              onClick={() => choose(code)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  choose(code);
                }
              }}
              className="cursor-pointer px-[16px] py-[9px] text-[14px] outline-none hover:bg-[var(--brand-primary)]/10 focus:bg-[var(--brand-primary)]/10 aria-selected:font-semibold aria-selected:text-[var(--brand-primary)]"
            >
              {CURRENCIES[code].label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const pickedByVisitor = useRef(false);

  useEffect(() => {
    let active = true;
    detectCurrency().then((code) => {
      if (active && !pickedByVisitor.current) setCurrency(code);
    });
    return () => {
      active = false;
    };
  }, []);

  const onCurrencyChange = (code: CurrencyCode) => {
    pickedByVisitor.current = true;
    setCurrency(code);
    storeCurrency(code);
  };

  return (
    <section
      id="pricing"
      className="bg-[var(--surface)] text-[var(--ink)] [--brand-primary:#433bca] [--brand-hover:#38319c] [--ink:#000000] [--surface:#ffffff]"
    >
      <div className="mx-auto w-[calc(100%-100px)] max-w-[1320px] py-[100px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:py-[65px]">
        <div className="text-center">
          <h2 className="my-[25px] font-[family-name:var(--font-marketing-heading)] text-[clamp(30px,4vw,57px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)] [@media(max-width:720px)]:tracking-[-1.5px]">
            A foundation today.
            <br />
            More possibilities ahead.
          </h2>
          <p className="mx-auto max-w-[620px] text-[14px] leading-[1.7] text-[var(--ink)]/70">
            Usage is measured in <strong>monthly unique visitors (MUV)</strong> who visit your app.
          </p>
        </div>

        <div className="relative mt-[40px] flex flex-col items-center w-full gap-2">
          <div
            role="group"
            aria-label="Billing interval"
            className="flex sm:relative items-center justify-between sm:justify-center w-full gap-x-5 "
          >
            <div className="sm:right-0 sm:absolute block ">
              <CurrencyPicker value={currency} onChange={onCurrencyChange} />
            </div>
            <div className="bg-[var(--ink)]/[0.06]  rounded-full p-[3px]">
              {(['monthly', 'annual'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={billing === value}
                  onClick={() => setBilling(value)}
                  className="cursor-pointer rounded-full border-0 bg-transparent px-[12px] py-[6px] text-[14px] font-medium text-[var(--brand-primary)] aria-pressed:bg-[var(--surface)] aria-pressed:shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                >
                  {value === 'monthly' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-[56px] grid grid-cols-[repeat(auto-fill,minmax(min(100%,255px),1fr))] gap-x-[24px]">
          {PLANS.map((plan, index) => {
            const highlighted = plan.id === HIGHLIGHT_PLAN_ID;
            const price = buildPrice(plan, billing, currency);
            const blurb = PLAN_BLURBS[plan.id];
            const divider = highlighted
              ? 'border-[var(--brand-primary)]'
              : 'border-[var(--ink)]/10';
            return (
              <article
                key={plan.id}
                className={`relative row-span-3 mb-[24px] grid grid-rows-subgrid rounded-[20px]   ${
                  highlighted
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 border-3'
                    : ' border border-[var(--ink)]/10 bg-[var(--surface)]'
                }`}
              >
                {highlighted && (
                  <p
                    data-highlight-bar
                    className="absolute -top-[12px] left-1/2 z-10 -translate-x-1/2 rounded-[6px] bg-[var(--brand-primary)] px-[10px] py-[2px] text-[12px] font-medium whitespace-nowrap text-white"
                  >
                    {HIGHLIGHT_LABEL}
                  </p>
                )}

                <div className="px-[14px] pt-[26px]">
                  <h3 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.5px] text-[var(--brand-primary)]">
                    {plan.name}
                  </h3>
                  {blurb && <p className="mt-[14px] text-[12px] leading-[20px]">{blurb}</p>}
                </div>

                <div className="flex flex-col px-[14px] pt-[32px] pb-[22px]">
                  <div>
                    <p className="h-[16px] text-[12px] leading-[16px]">
                      {price.kind === 'paid' ? price.label : ''}
                    </p>
                    {price.kind === 'paid' && price.strike && (
                      <p className="mt-[4px] flex items-center gap-[6px]">
                        <span className="relative text-[14px] text-[var(--ink)]/60">
                          {price.strike}
                          <span
                            aria-hidden="true"
                            className="absolute top-1/2 left-0 h-[1.5px] w-[110%] -translate-y-1/2 -rotate-12 bg-current"
                          ></span>
                        </span>
                        <span className="rounded-[6px] bg-[var(--brand-primary)]/10 px-[8px] py-[2px] text-[11px] font-medium text-[var(--brand-primary)]">
                          {price.pill}
                        </span>
                      </p>
                    )}
                    {price.kind === 'paid' && (
                      <p data-price className="mt-[2px] flex items-baseline gap-[6px]">
                        <span className="text-[30px] leading-[1.2] font-semibold">
                          {price.current}
                        </span>{' '}
                        <span className="text-[14px]">per month</span>
                      </p>
                    )}
                    {price.kind === 'custom' && (
                      <p data-price className="mt-[2px] text-[30px] leading-[1.2] font-semibold">
                        Custom price
                      </p>
                    )}
                    {plan.id === 'agency' && (
                      <p className="mt-[6px] text-[11px] leading-[16px] text-[var(--ink)]/60">
                        Plus per-project rates. Annual terms by quote.
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-[18px]">
                    <p className="mb-[14px] flex items-center gap-[8px] text-[11px] text-[var(--ink)]/70">
                      <Users size={14} aria-hidden="true" className="shrink-0" />
                      {plan.muv === null
                        ? 'Custom visitor allowance'
                        : `${plan.muv.toLocaleString('en-US')} MUV per month`}
                    </p>
                    <a
                      className="flex w-full items-center justify-center rounded-full bg-[var(--ink)] px-[12px] py-[9px] text-[13px] font-bold text-white! no-underline transition-colors duration-200 hover:bg-[var(--brand-hover)]"
                      href="#features" // TODO: Add onboarding page. Instead of direct signup, redirect to onboarding.
                    >
                      Explore Features
                    </a>
                  </div>
                </div>

                <div className={`border-t px-[14px] py-[20px] ${divider}`}>
                  <p className="text-[13px] font-bold">
                    {INCREMENTAL_FEATURES && index > 0
                      ? `Everything in ${PLANS[index - 1].name}, plus:`
                      : `Features included in ${plan.name}:`}
                  </p>
                  <ul className="mt-[14px] flex flex-col gap-[14px]">
                    {[
                      plan.domains === null
                        ? 'Custom domain limits'
                        : `${plan.domains} ${plan.domains === 1 ? 'domain' : 'domains'}`,
                      plan.retention,
                      ...plan.features,
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-[10px] text-[12px] leading-[16px]"
                      >
                        <Check
                          size={14}
                          strokeWidth={2.4}
                          aria-hidden="true"
                          className="mt-[1px] shrink-0 text-[var(--brand-primary)]"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-[100px]" id="features">
          <h3 className="mb-[40px] text-center text-[32px] font-semibold text-[var(--ink)]">
            All features
          </h3>
          <TooltipProvider delayDuration={200}>
            <div className="overflow-x-auto pb-[20px]">
              <table className="w-full min-w-[900px] border-collapse text-[14px]">
                <thead>
                  <tr>
                    <th className="w-[280px] border-b border-[var(--ink)]/10 px-[16px] py-[24px] text-left text-[16px] font-semibold text-[var(--ink)] align-bottom">
                      Key Features
                    </th>
                    {PLANS.map((plan) => {
                      return (
                        <th
                          key={plan.id}
                          className="border-b border-l border-[var(--ink)]/10 px-[16px] py-[24px] align-bottom text-center"
                        >
                          <div className="mb-[8px] text-[16px] font-semibold text-[var(--ink)]">
                            {plan.name}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {FEATURE_MATRIX.map((row) => (
                    <tr
                      key={row.feature}
                      className="group border-b border-[var(--ink)]/10 hover:bg-[var(--ink)]/[0.02]"
                    >
                      <td className="px-[16px] py-[20px] align-middle">
                        <div className="flex items-center gap-[8px] font-medium text-[var(--ink)]/80">
                          {row.feature}
                          {/* Tooltip Added Here */}
                          {row.description && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center outline-none"
                                >
                                  <HelpCircle
                                    size={14}
                                    className="shrink-0 cursor-help text-[var(--ink)]/40 transition-colors hover:text-[var(--ink)]/80"
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                align="center"
                                className="max-w-[260px] text-sm"
                              >
                                {row.description}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      {PLANS.map((plan, j) => {
                        const val = row.values[j];
                        return (
                          <td
                            key={plan.id}
                            className="border-l border-[var(--ink)]/10 px-[16px] py-[20px] text-center align-middle text-[var(--ink)]/70"
                          >
                            {typeof val === 'boolean' ? (
                              val ? (
                                <Check
                                  size={18}
                                  strokeWidth={2.5}
                                  className="mx-auto text-[#00b27b]"
                                />
                              ) : (
                                <X
                                  size={18}
                                  strokeWidth={2.5}
                                  className="mx-auto text-[var(--ink)]/20"
                                />
                              )
                            ) : (
                              val || (
                                <X
                                  size={18}
                                  strokeWidth={2.5}
                                  className="mx-auto text-[var(--ink)]/20"
                                />
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </section>
  );
}
