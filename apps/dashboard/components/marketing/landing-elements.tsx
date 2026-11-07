'use client';
import { useEffect, useRef, useState, useId, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from 'cn';
import { LockKeyhole, Play } from 'lucide-react';
import {
  blockFrame,
  blockToneProps,
  CtaLink,
  SectionHeader,
  type BlockLink,
  type BlockTone,
} from '@/components/ui/marketing-feature-bento-utils/marketing-kit';

type OptionType = {
  id: string;
  name: string;
  default: boolean;
};

const OPTIONS: OptionType[] = [
  {
    id: '1',
    name: 'Necessary cookies',
    default: true,
  },
  {
    id: '2',
    name: 'Analytical cookies',
    default: false,
  },
  {
    id: '3',
    name: 'Advertising/profiling cookies',
    default: false,
  },
];

// Landing Page Features Types
export type BentoSpan = {
  label: string;
  start: number;
  duration: number;
  slow?: boolean;
  color?: string;
};
export type BentoVisual =
  | { type: 'waterfall'; spans: BentoSpan[]; total: number; unit?: string }
  | {
      type: 'replay';
      /** Marker and playhead positions are normalized from 0 to 1. */
      markers: number[];
      position: number;
      timecode: string;
      label: string;
    }
  | { type: 'alerts'; alerts: { title: string; meta: string }[] }
  | { type: 'cost'; value: string; caption: string; bars: number[]; highlight?: number }
  | { type: 'code'; filename: string; lines: string[] }
  | { type: 'keys'; shortcuts: { keys: string[]; label: string }[] }
  | { type: 'redact'; segments: (string | { redacted: string })[]; badge: string }
  | { type: 'custom'; node: ReactNode };

export type BentoFeature = {
  id: string;
  title: string;
  description: ReactNode;
  visual: BentoVisual;
  size?: 'sm' | 'md' | 'lg' | 'full';
  href?: string;
};

export type MarketingFeatureBentoProps = {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  cta?: BlockLink;
  features: BentoFeature[];
  tone?: BlockTone;
  animate?: boolean;
  className?: string;
};

// #-----------

export const features: BentoFeature[] = [
  {
    id: 'choice',
    size: 'md',
    title: 'A real choice. Every time.',
    description:
      'Accept, reject, customize, or withdraw. Keyboard-accessible controls and a preference center that visitors can reopen.',
    visual: {
      type: 'custom',
      node: (
        <div className="w-full max-w-[440px] rounded-[14px] border border-[var(--bjork-border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold">Your privacy, your call.</span>
            <span className="rounded-full bg-[var(--accent-background)] px-2 py-1 text-[10px] font-medium text-[var(--brand-primary)]">
              Always in control
            </span>
          </div>
          <p className="max-w-[36ch] text-[12px] leading-6 text-[var(--bjork-muted)]">
            Choose what you share. Change your mind whenever you need to.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-medium">
            <span className="rounded-lg border border-[var(--bjork-border)] px-2 py-2.5">
              Reject all
            </span>
            <span className="rounded-lg border border-[var(--bjork-border)] px-2 py-2.5">
              Customize
            </span>
            <span className="rounded-lg bg-[var(--brand-primary)] px-2 py-2.5 text-[var(--surface)]">
              Accept all
            </span>
          </div>
        </div>
      ),
    },
  },
  {
    id: 'permission',
    size: 'md',
    title: 'Permission before execution.',
    description:
      'Set Google Consent Mode v2 defaults before tags load, then update after a decision. Customize your consent choices with a simple, keyboard-accessible interface.',
    visual: {
      type: 'waterfall',
      total: 10,
      unit: 's',
      spans: [
        { label: 'Defaults', start: 0, duration: 1.2 },
        { label: 'Choice', start: 1.2, duration: 4.4, slow: true },
        { label: 'Update', start: 5.6, duration: 1.2 },
        { label: 'Allow tags', start: 6.8, duration: 2.4 },
      ],
    },
  },
  {
    id: 'context',
    size: 'sm',
    title: 'Every decision has context.',
    description:
      'Versioned configurations and consent events connect each choice to the banner shown. Unique event IDs make retries deduplicatable.',
    visual: {
      type: 'alerts',
      alerts: [
        { title: 'Preferences updated', meta: 'Consent event · configuration v3' },
        { title: 'Choice recorded', meta: 'Unique event ID · first-party storage' },
        { title: 'Banner published', meta: 'Versioned configuration · audit history' },
      ],
    },
  },
  {
    id: 'lightweight',
    size: 'sm',
    title: 'Small script. Big responsibility.',
    description:
      'A lightweight framework-independent core, a lazy-loaded banner, first-party storage, and a React integration.',
    visual: {
      type: 'code',
      filename: 'consent-flow',
      lines: [
        '01  Load the lightweight core',
        '02  Set consent defaults',
        '03  Show visitor preferences',
        '04  Store the choice first-party',
      ],
    },
  },
  {
    id: 'workspace',
    size: 'sm',
    title: 'A workspace for your team.',
    description:
      'Clerk organizations, verified membership, invitations and role-based access. PostgreSQL policies isolate tenant data.',
    visual: {
      type: 'custom',
      node: (
        <div className="w-full max-w-[300px] rounded-[14px] border border-[var(--bjork-border)] bg-[var(--surface)] p-4">
          <p className="mb-4 text-[10px] font-semibold tracking-[0.12em] text-[var(--bjork-muted)] uppercase">
            One team. Clear roles.
          </p>
          {[
            ['JD', 'Workspace owner', 'Owner'],
            ['AK', 'Site manager', 'Admin'],
            ['MR', 'Team member', 'Member'],
          ].map(([initials, name, role]) => (
            <div
              key={role}
              className="flex items-center gap-3 border-t border-[var(--bjork-border)] py-2.5"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--accent-background)] text-[10px] font-semibold text-[var(--brand-primary)]">
                {initials}
              </span>
              <span className="flex-1 text-[11px]">{name}</span>
              <span className="text-[10px] text-[var(--bjork-muted)]">{role}</span>
            </div>
          ))}
        </div>
      ),
    },
  },
  {
    id: 'publish',
    size: 'full',
    title: 'Publish with confidence.',
    description:
      'Verify domain ownership with DNS or HTTPS. Publish immutable configuration objects with read verification, guarded pointers and audit history.',
    visual: {
      type: 'custom',
      node: (
        <div className="grid w-full max-w-[860px] grid-cols-2 gap-3 sm:grid-cols-4">
          {['Verify domain', 'Version configuration', 'Read verification', 'Publish & audit'].map(
            (step, index) => (
              <div
                key={step}
                className="rounded-[14px] border border-[var(--bjork-border)] bg-[var(--surface)] p-4"
              >
                <span className="mb-4 grid size-7 place-items-center rounded-full bg-[var(--accent-background)] font-mono text-[11px] text-[var(--brand-primary)]">
                  0{index + 1}
                </span>
                <span className="text-[12px] font-medium">{step}</span>
              </div>
            ),
          )}
        </div>
      ),
    },
  },
];

const sizeClasses: Record<NonNullable<BentoFeature['size']>, string> = {
  sm: '@5xl:col-span-2',
  md: '@5xl:col-span-3',
  lg: '@2xl:col-span-2 @5xl:col-span-4',
  full: '@2xl:col-span-2 @5xl:col-span-6',
};

const panelClass =
  'rounded-xl border border-[var(--bjork-border)] bg-[var(--bjork-background)] shadow-sm';

function percent(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

// Hover-driven visuals (Alerts, Code) behave differently per viewport:
//  - desktop (>= 640px, the Tailwind `sm` breakpoint): play on card hover, as before
//  - mobile (< 640px): no hover on touch, so autoplay while the card is on screen
//    and repeat every MOBILE_LOOP_DELAY seconds
const DESKTOP_MOTION = '(min-width: 640px) and (prefers-reduced-motion: no-preference)';
const MOBILE_MOTION = '(max-width: 639px) and (prefers-reduced-motion: no-preference)';
const MOBILE_LOOP_DELAY = 2; // seconds of rest between repeats on mobile

// Calls onChange(true/false) as the element enters/leaves the viewport.
// Returns a cleanup function.
function observeVisibility(el: Element, onChange: (visible: boolean) => void) {
  const observer = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), {
    threshold: 0.4,
  });
  observer.observe(el);
  return () => observer.disconnect();
}

/**
 * Static wrapper. The scale-in is driven by the GSAP effect in AppFeatures,
 * which finds every `[data-growth]` element inside the section.
 */
function Growth({
  children,
  className,
  axis,
  delay,
}: {
  children?: ReactNode;
  className?: string;
  axis: 'x' | 'y';
  delay: number;
}) {
  return (
    <div className={className} data-growth={axis} data-growth-delay={delay}>
      {children}
    </div>
  );
}

function FeatureVisual({ visual, enabled }: { visual: BentoVisual; enabled: boolean }) {
  switch (visual.type) {
    case 'waterfall':
      return <Waterfall visual={visual} />;
    case 'replay':
      return <Replay visual={visual} />;
    case 'alerts':
      return <Alerts visual={visual} enabled={enabled} />;
    case 'cost':
      return <Cost visual={visual} />;
    case 'code':
      return <Code visual={visual} enabled={enabled} />;
    case 'keys':
      return <Keys visual={visual} />;
    case 'redact':
      return <Redact visual={visual} />;
    case 'custom':
      return visual.node;
  }
}

function Waterfall({ visual }: { visual: Extract<BentoVisual, { type: 'waterfall' }> }) {
  const total = Number.isFinite(visual.total) && visual.total > 0 ? visual.total : 1;

  return (
    <div className="w-full max-w-[450px] space-y-3 font-mono text-[10px]">
      <div className="flex justify-between text-[var(--bjork-muted)]">
        <span>Request timeline</span>
        <span>
          {visual.total}
          {visual.unit ?? 's'}
        </span>
      </div>
      <div className="relative space-y-3 py-2">
        <div className="pointer-events-none absolute inset-y-0 right-[60px] left-[84px] flex justify-between">
          {[0, 1, 2, 3].map((line) => (
            <span
              key={line}
              className="h-full border-l border-dashed border-[var(--bjork-border)]"
            />
          ))}
        </div>
        {visual.spans.map((span, index) => {
          const start = percent((span.start / total) * 100);
          const width = Math.min(100 - start, percent((span.duration / total) * 100));
          return (
            <div key={`${span.label}-${index}`} className="relative flex items-center gap-3">
              <span className="w-[72px] shrink-0 truncate text-[var(--bjork-muted)]">
                {span.label}
              </span>
              <div className="min-w-0 flex-1">
                <div style={{ marginLeft: `${start}%`, width: `${width}%` }}>
                  <Growth
                    axis="x"
                    delay={index * 0.07}
                    className={cn(
                      'h-5 min-w-px rounded-[4px]',
                      span.slow ? 'bg-[var(--bjork-accent)]' : 'bg-[var(--bjork-border)]',
                    )}
                  >
                    <div
                      className="h-full rounded-[4px]"
                      style={{ backgroundColor: span.slow ? undefined : span.color }}
                    />
                  </Growth>
                </div>
              </div>
              <span
                className={cn(
                  'w-12 shrink-0 text-right',
                  span.slow
                    ? 'font-medium text-[var(--bjork-accent)]'
                    : 'text-[var(--bjork-muted)]',
                )}
              >
                {span.duration}
                {visual.unit ?? 's'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Replay({ visual }: { visual: Extract<BentoVisual, { type: 'replay' }> }) {
  return (
    <div className={cn(panelClass, 'w-full max-w-[430px] overflow-hidden')}>
      <div className="flex h-24 items-center justify-center bg-[var(--bjork-surface)]">
        <span className="flex size-11 items-center justify-center rounded-full border border-[var(--bjork-border)] bg-[var(--bjork-background)] text-[var(--bjork-accent)]">
          <Play className="ml-0.5 size-4" fill="currentColor" strokeWidth={1.5} />
        </span>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="flex justify-between gap-3 text-[10px] text-[var(--bjork-muted)]">
          <span className="truncate">{visual.label}</span>
          <span className="shrink-0 font-mono">{visual.timecode}</span>
        </div>
        <div className="relative h-1 rounded-full bg-[var(--bjork-border)]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--bjork-accent)]"
            style={{ width: `${percent(visual.position * 100)}%` }}
          />
          {visual.markers.map((marker, index) => (
            <span
              key={index}
              className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--bjork-background)] bg-[var(--bjork-accent)]"
              style={{ left: `${percent(marker * 100)}%` }}
            />
          ))}
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--bjork-ink)]"
            style={{ left: `${percent(visual.position * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Stacked-card geometry for Alerts: collapsed (rest) and fanned-out (hover).
const alertRestY = (index: number) => index * 12 + 42;
const alertRestScale = (index: number) => 1 - index * 0.045;
const alertExpandedY = (index: number) => index * 66;

function Alerts({
  visual,
  enabled,
}: {
  visual: Extract<BentoVisual, { type: 'alerts' }>;
  enabled: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const alerts = visual.alerts.slice(0, 3);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    const featureCard = root?.closest<HTMLElement>('[data-feature-card]');
    if (!root || !featureCard) return;

    const mm = gsap.matchMedia();

    // Desktop: fan out on hover (unchanged).
    mm.add(DESKTOP_MOTION, () => {
      const ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>('[data-alert-card]');

        // Normalize GSAP's transform cache to the rest pose rendered by CSS.
        gsap.set(cards, {
          y: (i: number) => alertRestY(i),
          scale: (i: number) => alertRestScale(i),
        });

        const move = (expanded: boolean) =>
          gsap.to(cards, {
            y: (i: number) => (expanded ? alertExpandedY(i) : alertRestY(i)),
            scale: (i: number) => (expanded ? 1 : alertRestScale(i)),
            duration: 0.45,
            ease: 'power3.out',
            overwrite: 'auto',
          });

        const open = () => move(true);
        const close = () => move(false);
        featureCard.addEventListener('mouseenter', open);
        featureCard.addEventListener('mouseleave', close);
        if (featureCard.matches(':hover')) open();

        return () => {
          featureCard.removeEventListener('mouseenter', open);
          featureCard.removeEventListener('mouseleave', close);
        };
      }, root);

      return () => ctx.revert();
    });

    // Mobile: fan out and collapse on a loop while the card is on screen.
    mm.add(MOBILE_MOTION, () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-alert-card]', root);

      gsap.set(cards, {
        y: (i: number) => alertRestY(i),
        scale: (i: number) => alertRestScale(i),
      });

      const loop = gsap.timeline({
        paused: true,
        delay: 0.4,
        repeat: -1,
        repeatDelay: MOBILE_LOOP_DELAY,
      });
      loop
        .to(cards, {
          y: (i: number) => alertExpandedY(i),
          scale: 1,
          duration: 0.45,
          ease: 'power3.out',
        })
        .to(
          cards,
          {
            y: (i: number) => alertRestY(i),
            scale: (i: number) => alertRestScale(i),
            duration: 0.45,
            ease: 'power3.out',
          },
          '+=1.6',
        );

      return observeVisibility(featureCard, (visible) => {
        if (visible) loop.restart();
        else loop.pause(0);
      });
    });

    return () => mm.revert();
  }, [enabled]);

  return (
    <div ref={rootRef} data-alerts className="relative group h-[150px] w-full max-w-[370px]">
      {alerts.map((alert, index) => (
        <div
          key={`${alert.title}-${index}`}
          data-alert-card
          style={{
            zIndex: alerts.length - index,
            // Rest pose is rendered in CSS so reduced-motion users see the stacked layout.
            transform: `translateY(${alertRestY(index)}px) scale(${alertRestScale(index)})`,
          }}
          className={cn(
            panelClass,
            'bg-gray-50 absolute inset-x-0 top-0 flex items-center gap-3 px-4 py-3',
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <span className="size-3.5 rounded-full bg-current" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[var(--bjork-ink)]">{alert.title}</p>
            <p className="mt-1 truncate text-[10px] text-[var(--bjork-muted)]">{alert.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Cost({ visual }: { visual: Extract<BentoVisual, { type: 'cost' }> }) {
  const max = Math.max(1, ...visual.bars.filter(Number.isFinite));
  return (
    <div className="w-full max-w-[380px]">
      <div className="flex items-baseline gap-3">
        <span className="font-[family-name:var(--font-marketing-heading)] text-4xl tracking-[-1.5px] text-[var(--bjork-ink)]">
          {visual.value}
        </span>
        <span className="text-[11px] text-[var(--bjork-muted)]">{visual.caption}</span>
      </div>
      <div className="mt-5 flex h-[78px] items-end gap-1.5 border-b border-[var(--bjork-border)]">
        {visual.bars.map((bar, index) => (
          <div
            key={index}
            className="min-w-0 flex-1"
            style={{ height: `${percent((bar / max) * 100)}%` }}
          >
            <Growth
              axis="y"
              delay={index * 0.025}
              className={cn(
                'h-full rounded-t-[3px] bg-[var(--bjork-accent)]',
                index !== (visual.highlight ?? visual.bars.length - 1) && 'opacity-25',
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// A small illustrative tokenizer, not a full language parser or HTML renderer.
function tokenize(line: string): ReactNode[] {
  const pattern =
    /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|return|import|from|export|function|true|false|null|await|async)\b|\b\d+(?:\.\d+)?\b)/g;
  return line.split(pattern).map((token, index) => {
    const isComment = token.startsWith('//');
    const isString = token.startsWith('"') || token.startsWith("'");
    const isKeyword =
      /^(const|let|return|import|from|export|function|true|false|null|await|async)$/.test(token);
    return (
      <span
        key={index}
        className={cn(
          isComment && 'text-[var(--bjork-muted)]',
          (isString || isKeyword) && 'text-[var(--bjork-accent)]',
          isKeyword && 'font-medium',
        )}
      >
        {token}
      </span>
    );
  });
}

function Code({
  visual,
  enabled,
}: {
  visual: Extract<BentoVisual, { type: 'code' }>;
  enabled: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [typedLength, setTypedLength] = useState<number | null>(null);
  const text = visual.lines.join('\n');
  const visibleLines = typedLength === null ? visual.lines : text.slice(0, typedLength).split('\n');

  useEffect(() => {
    if (!enabled) return;
    const featureCard = rootRef.current?.closest<HTMLElement>('[data-feature-card]');
    if (!featureCard) return;

    const mm = gsap.matchMedia();

    // Desktop: type out on hover (unchanged).
    mm.add(DESKTOP_MOTION, () => {
      let timer: ReturnType<typeof setInterval> | undefined;
      const stop = () => {
        clearInterval(timer);
        timer = undefined;
        setTypedLength(null);
      };
      const start = () => {
        clearInterval(timer);
        let length = 0;
        setTypedLength(0);
        timer = setInterval(() => {
          length += 1;
          setTypedLength(length);
          if (length >= text.length) stop();
        }, 30);
      };

      featureCard.addEventListener('mouseenter', start);
      featureCard.addEventListener('mouseleave', stop);
      if (featureCard.matches(':hover')) start();

      return () => {
        stop();
        featureCard.removeEventListener('mouseenter', start);
        featureCard.removeEventListener('mouseleave', stop);
      };
    });

    // Mobile: type out on a loop while the card is on screen. The full text
    // stays visible during the pause between repeats.
    mm.add(MOBILE_MOTION, () => {
      const progress = { chars: 0 };
      const typing = gsap.fromTo(
        progress,
        { chars: 0 },
        {
          chars: text.length,
          duration: text.length * 0.03,
          ease: 'none',
          delay: 0.4,
          repeat: -1,
          repeatDelay: MOBILE_LOOP_DELAY,
          paused: true,
          onUpdate: () => setTypedLength(Math.round(progress.chars)),
        },
      );

      const stopObserving = observeVisibility(featureCard, (visible) => {
        if (visible) {
          setTypedLength(0);
          typing.restart();
        } else {
          typing.pause(0);
          setTypedLength(null);
        }
      });

      return () => {
        stopObserving();
        setTypedLength(null);
      };
    });

    return () => mm.revert();
  }, [enabled, text]);

  return (
    <div
      ref={rootRef}
      className={cn(panelClass, 'w-full max-w-[460px] overflow-hidden font-mono text-[10px]')}
    >
      <div className="flex items-center gap-1.5 border-b border-[var(--bjork-border)] px-4 py-2.5">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-1.5 rounded-full bg-[var(--bjork-border)]" />
        ))}
        <span className="ml-2 truncate text-[var(--bjork-muted)]">{visual.filename}</span>
      </div>
      <pre className="overflow-hidden px-4 py-3 leading-[1.9] text-[var(--bjork-ink)]">
        <code>
          {visual.lines.map((line, index) => (
            <span key={index} className="block min-h-[1.9em]">
              <span className="mr-4 inline-block w-3 text-right text-[var(--bjork-muted)]">
                {index + 1}
              </span>
              {tokenize(visibleLines[index] ?? '')}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function Keys({ visual }: { visual: Extract<BentoVisual, { type: 'keys' }> }) {
  return (
    <div className="w-full max-w-[330px] space-y-4">
      {visual.shortcuts.map((shortcut, index) => (
        <div key={`${shortcut.label}-${index}`} className="flex items-center justify-between gap-4">
          <span className="text-xs text-[var(--bjork-muted)]">{shortcut.label}</span>
          <span className="flex shrink-0 gap-1.5">
            {shortcut.keys.map((key, keyIndex) => (
              <kbd
                key={`${key}-${keyIndex}`}
                className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-b-[3px] border-[var(--bjork-border)] bg-[var(--bjork-background)] px-2 font-mono text-xs text-[var(--bjork-ink)] shadow-sm"
              >
                {key}
              </kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Redact({ visual }: { visual: Extract<BentoVisual, { type: 'redact' }> }) {
  return (
    <div className="w-full max-w-[370px]">
      <div
        className={cn(panelClass, 'p-5 font-mono text-xs leading-[2.2] text-[var(--bjork-muted)]')}
      >
        {visual.segments.map((segment, index) =>
          typeof segment === 'string' ? (
            <span key={index}>{segment}</span>
          ) : (
            // Only preserve an illustrative width; do not put the original text in the DOM.
            <span
              key={index}
              className="mx-1 inline-block h-[1em] max-w-full rounded-[3px] bg-[var(--bjork-ink)] align-middle opacity-80"
              style={{ width: `${Math.max(3, Math.min(24, segment.redacted.length))}ch` }}
            />
          ),
        )}
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--bjork-border)] bg-[var(--bjork-background)] px-2.5 py-1 text-[10px] text-[var(--bjork-muted)]">
        <LockKeyhole className="size-3" strokeWidth={1.5} />
        {visual.badge}
      </span>
    </div>
  );
}

// ----------------------FEATURES-----------------------

function FEATURES({
  id,
  title,
  description,
  cta,
  features,
  tone = 'auto',
  animate = true,
  className,
}: MarketingFeatureBentoProps) {
  const titleId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const toneProps = blockToneProps(tone);

  // Scroll-triggered motion: card reveals + waterfall/cost bar growth.
  // Reduced motion is handled by matchMedia, so no JS reduced-motion hook is needed.
  useEffect(() => {
    if (!animate) return;
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            delay: Number(el.dataset.revealDelay ?? 0),
            ease: 'power2.out',
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>('[data-growth]').forEach((el) => {
          const isX = el.dataset.growth === 'x';
          gsap.from(el, {
            ...(isX ? { scaleX: 0 } : { scaleY: 0 }),
            transformOrigin: isX ? 'left center' : 'center bottom',
            duration: 0.9,
            delay: Number(el.dataset.growthDelay ?? 0),
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
          });
        });
      }, rootRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [animate]);

  return (
    <section
      {...toneProps}
      ref={rootRef}
      id={id}
      aria-labelledby={titleId}
      className={cn(
        toneProps.className,
        '@container py-[65px] bg-dull-white text-[var(--bjork-ink)] lg:py-[100px]',
        className,
      )}
    >
      <div className={cn(blockFrame, '@container')}>
        <div className="mb-12 items-start grid gap-y-4 @4xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] @4xl:items-end @4xl:gap-16">
          <SectionHeader id={titleId} title={title} />
          <div className="flex flex-col items-start ">
            {description && (
              <p className="max-w-[46ch] text-base sm:leading-[1.8] sm:mb-8 pb-0 leading-normal text-[var(--bjork-muted)]">
                {description}
              </p>
            )}
            <div className="sm:block hidden ">{cta && <CtaLink {...cta} />}</div>
          </div>
        </div>
        <ul className="grid list-none grid-cols-1 gap-4 p-0 @2xl:grid-cols-2 @5xl:grid-cols-6">
          {features.map((feature, index) => (
            <li
              key={feature.id}
              data-reveal
              data-reveal-delay={(index % 6) * 0.06}
              className={cn('min-w-0', sizeClasses[feature.size ?? 'sm'])}
            >
              <article
                data-feature-card
                className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--bjork-border)] bg-[var(--bjork-background)] transition-colors hover:border-[var(--bjork-accent)] motion-reduce:transition-none"
              >
                <div
                  aria-hidden="true"
                  className="flex min-h-[190px] min-w-0 flex-1  items-center justify-center overflow-hidden bg-[var(--bjork-surface)] px-6 py-7 @2xl:min-h-[210px]"
                >
                  <FeatureVisual visual={feature.visual} enabled={animate} />
                </div>
                <div className="border-t border-[var(--bjork-border)] bg-gray-50 p-6 @2xl:px-7">
                  <h3 className="font-[family-name:var(--font-marketing-heading)] text-xl leading-tight font-medium tracking-[-0.5px] text-[var(--bjork-ink)]">
                    {feature.href ? (
                      <a
                        href={feature.href}
                        className="rounded-sm text-inherit no-underline underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--bjork-accent)]"
                      >
                        {feature.title}
                      </a>
                    ) : (
                      feature.title
                    )}
                  </h3>
                  <div className="mt-3 text-sm leading-[1.8] text-[var(--bjork-muted)]">
                    {feature.description}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
        <div className="mt-6 justify-center flex sm:hidden">{cta && <CtaLink {...cta} />}</div>
      </div>
    </section>
  );
}

export const MARKETING_BENTO_SAMPLE: MarketingFeatureBentoProps = {
  eyebrow: 'Platform',
  title: 'Thoughtful consent, end to end.',
  description: 'Make every choice clear, and give your team the context to understand it.',
  features: [
    {
      id: 'consent-before-tags',
      title: 'Consent before a single tag runs.',
      description: 'Make the visitor’s choice the starting point, not an afterthought.',
      size: 'md',
      visual: {
        type: 'waterfall',
        total: 1.2,
        spans: [
          { label: 'Policy', start: 0, duration: 0.24 },
          { label: 'Choice', start: 0.24, duration: 0.42 },
          { label: 'Allowed tags', start: 0.66, duration: 0.54, slow: true },
        ],
      },
    },
    {
      id: 'privacy-by-design',
      title: 'Less data. More peace of mind.',
      description: 'Keep personal details out of the picture with privacy-conscious defaults.',
      size: 'md',
      visual: {
        type: 'redact',
        segments: ['Visitor ', { redacted: 'example visitor' }, ' chose essential cookies only.'],
        badge: 'Privacy by design',
      },
    },
  ],
};

// ======================================================
// ======================================================

function SIDEHERO() {
  const root = useRef<HTMLDivElement>(null);
  const [decision, setDecision] = useState('');
  const [shadow, setShadow] = useState(false);
  const [preferences, setPreferences] = useState<OptionType[]>(OPTIONS);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.from('[data-consent-card]', {
          y: 35,
          rotation: -4,
          opacity: 0,
          duration: 1,
          delay: 0.3,
          ease: 'power3.out',
        });
        gsap.to('[data-floating-label]', {
          y: -8,
          rotation: 6,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  const choose = (acceptOptional: boolean) => {
    setPreferences((current) =>
      current.map((option) => ({
        ...option,
        default: option.id === '1' || acceptOptional,
      })),
    );
    setDecision(
      acceptOptional ? 'All optional categories accepted' : 'Optional categories rejected',
    );
    setShadow(false);
  };
  return (
    <div
      ref={root}
      className="relative flex sm:min-h-[510px]  min-h-[350px] min-w-0 items-center justify-center bg-[radial-gradient(ellipse,#dfdfcb_0,transparent_68%)]  [@media(max-width:720px)]:overflow-visible"
    >
      <div
        className="absolute aspect-square h-auto sm:w-[490px] w-full sm:max-w-[70%] max-w-[80%] rounded-full border border-dashed border-[#c5c7b3] [transform:rotate(-15deg)] "
        aria-hidden="true"
      ></div>
      <span
        data-floating-label
        className={cn(
          'absolute sm:text-sm  text-[12px] border-[var(--brand-primary)] font-medium z-2  rounded-[30px] bg-[var(--brand-primary)] text-white! px-[20px] py-[12px] [transform:rotate(6deg)]',
          shadow ? 'sm:top-15 -top-5 right-0' : 'sm:top-30 top-10 sm:right-10 right-0',
        )}
      >
        Your design. Your brand.
      </span>
      <div
        data-consent-card
        className="z-[1] w-[360px] max-w-[94%] rounded-[17px] border border-[#deded5] bg-white p-[26px] shadow-[0_30px_70px_#34432915] [transform:rotate(-3deg)]"
      >
        <h2 className="my-[12px] sm:text-[35px] text-2xl leading-[1.1] font-medium tracking-[-1.5px] text-[var(--ink)]">
          We value your privacy.
        </h2>
        <p className="sm:text-base text-base max-w-prose  text-[var(--muted)]">
          We use cookies to run this site. <br />
          You can edit your preferences.
        </p>
        {shadow && (
          <>
            {OPTIONS.map((option) => (
              <label
                key={option.id}
                className="flex justify-between py-[12px] sm:text-base text-md"
              >
                <span>{option.name}</span>
                <input
                  type="checkbox"
                  checked={preferences.find((p) => p.id === option.id)?.default ?? false}
                  disabled={option.id === '1'}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPreferences((current) =>
                      current.map((preference) =>
                        preference.id === option.id
                          ? { ...preference, default: checked }
                          : preference,
                      ),
                    );
                  }}
                />
              </label>
            ))}
          </>
        )}
        <div className="mt-[22px] flex gap-[10px]">
          <button
            className="flex-1 rounded-full border-0 bg-gray-200 px-1.25 sm:py-3 py-2 text-[11px] "
            onClick={() => choose(false)}
          >
            Reject
          </button>
          <button
            className="flex-1 rounded-full border-0 bg-[var(--brand-primary)] px-1.25 sm:py-3 py-2 text-[11px] text-white!"
            onClick={() => {
              if (shadow) setDecision('Custom Preferences saved');
              setShadow((open) => !open);
            }}
          >
            {shadow ? 'Save' : 'Edit'}
          </button>
          <button
            className="flex-1 rounded-full border-0 bg-green-600 px-1.25 sm:py-3 py-2 text-[11px] text-white!"
            onClick={() => choose(true)}
          >
            Accept
          </button>
        </div>
        <div className="flex justify-center  pt-5 text-xs">
          <span>Powered by Accordly</span>
        </div>
        <span
          role="status"
          className="absolute -bottom-[27px] text-left sm:text-base text-xs text-[var(--muted)]"
        >
          {decision ? `✓ ${decision}` : '↳ Try it. This is an interactive preview.'}
        </span>
      </div>
    </div>
  );
}

// ======================================================
// ======================================================

function OPENSOURCE({ github }: { github: string }) {
  return (
    <section
      id="opensource"
      className="mx-auto grid w-[calc(100%-100px)] max-w-[1320px] grid-cols-2 items-center gap-[60px] sm:pt-32 mb-10 [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:1000px)]:gap-[25px] [@media(max-width:720px)]:grid-cols-1 [@media(max-width:720px)]:py-[65px]"
    >
      <div className="min-w-0" data-reveal>
        <h2 className="sm:my-[25px] font-[family-name:var(--font-marketing-heading)] text-[clamp(36px,4vw,57px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)] [@media(max-width:720px)]:tracking-[-1.5px]">
          Your infrastructure.
          <br />
          <em className="font-[Georgia,serif] font-normal text-primary">Your rules.</em>
        </h2>
        <p className="max-w-[475px] text-[17px] pt-4 leading-[1.8] text-[var(--muted)]">
          The consent core is open source. Read it, adapt it, self-host it. No subscription is
          required to run the core.
        </p>
        <div className="pt-[30px] flex  flex-row w-full items-center sm:gap-x-6 gap-x-2">
          <a
            className="text-[14px] rounded-full sm:inline-flex hidden items-center  gap-x-1 bg-black text-white!    py-3 px-6 transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220] border "
            href={github}
          >
            ⭐ Give us a star{' '}
            <img width="18" height="18" src="/github.png" alt="github" className="invert" />
          </a>
          <a
            className="inline-flex items-center justify-center gap-x-1 rounded-full border border-dull-white bg-dull-white  py-3 px-6 text-[14px] font-semibold  no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220]"
            href={`${github}/tree/main/packages/consent-core`}
          >
            Read Docs
          </a>
          <a
            className="text-[14px] rounded-full sm:hidden inline-flex items-center gap-x-1 bg-black text-white!    py-3 px-6 transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220] border "
            href={github}
          >
            ⭐ Give us a star{' '}
            <img width="18" height="18" src="/github.png" alt="github" className="invert" />
          </a>
        </div>
      </div>
      <div
        className="min-w-0 overflow-hidden rounded-[12px] bg-[#242830] text-[#d1d7d1] shadow-[0_25px_45px_#181e2210] [@media(max-width:720px)]:mt-[20px]"
        data-reveal
      >
        <div className="flex items-center gap-[6px] border-b border-[#42454a] p-[18px]">
          <i className="h-[7px] w-[7px] rounded-full bg-[#69716f]" />
          <i className="h-[7px] w-[7px] rounded-full bg-[#69716f]" />
          <i className="h-[7px] w-[7px] rounded-full bg-[#69716f]" />
          <span className="ml-auto font-[monospace] text-[11px] leading-[normal]">
            your-site.js
          </span>
        </div>
        <pre className="overflow-auto p-[25px] text-[13px] leading-[2] text-[#d5e4b7] [@media(max-width:1000px)]:text-[11px]">
          <code>{`// A choice your code can respect.\nconst cmp = createConsentManager({\n  config: publishedConfiguration\n}).initialize();\n\n// Ask first.\nif (!cmp.hasDecision()) {\n  cmp.showPreferences();\n}`}</code>
        </pre>
        <footer className="flex justify-between border-t border-[#42454a] p-[18px] text-[10px]">
          <span>Readable by design.</span>
          <span> Inspect. Adapt. Contribute.</span>
        </footer>
      </div>
    </section>
  );
}

// ======================================================
// ======================================================

function CTACOMP({ app }: { app: string }) {
  return (
    <section
      className="mx-auto w-[calc(100%-100px)] max-w-[1320px]  sm:pt-[80px] pb-[100px] text-center [@media(max-width:1000px)]:w-[calc(100%-48px)] "
      data-reveal
    >
      <p className="flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[1px] sm:tracking-[2px]">
        MAKE YOUR NEXT FIRST IMPRESSION COUNT
      </p>
      <h2 className="mt-[25px] mb-[40px] font-[family-name:var(--font-marketing-heading)] text-[clamp(50px,7vw,90px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)]">
        Trust starts
        <br />
        with <em className="font-[Georgia,serif] font-normal text-primary">a choice.</em>
      </h2>
      <a
        href={app}
        className="inline-flex items-center justify-center gap-x-[24px] rounded-full border border-primary bg-primary px-[24px] py-[17px] text-[14px] font-semibold text-white! no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220]"
      >
        Start with Accordly
      </a>
    </section>
  );
}

// ======================================================
// ======================================================

function FOOTER({ github }: { github: string }) {
  return (
    <footer className="mx-auto flex  bg-white w-full sm:max-w-[1320px]  items-center sm:flex-row flex-col-reverse sm:justify-between justify-center sm:gap-x-[20px] border-t border-[var(--line)] py-[30px] ">
      <a
        aria-label="Accordly home"
        className="flex flex-row items-center gap-x-2 no-underline"
        href={process.env.NEXT_PUBLIC_APP_URL === undefined ? '/' : process.env.NEXT_PUBLIC_APP_URL}
      >
        <img src="/accordly.png" width="20" height="20" alt="Accordly Logo" />
        <span className="text-lg font-semibold text-black">accordly</span>
      </a>
      <span className="flex gap-x-6 items-center justify-center sm:gap-x-5 pb-5 sm:pb-0 text-sm text-[var(--muted)]  ">
        <a className="text-inherit no-underline" href={github}>
          GitHub ↗
        </a>
        <a className="text-inherit no-underline" href={`${github}#readme`}>
          Documentation ↗
        </a>
        <a className="text-inherit no-underline" href="/dashboard">
          Workspace ↗
        </a>
      </span>
    </footer>
  );
}

// ======================================================
// ======================================================

export { FEATURES, CTACOMP, FOOTER, SIDEHERO, OPENSOURCE };
