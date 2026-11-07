'use client';

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { cn } from 'cn';

export type BlockTone = 'auto' | 'light' | 'dark';

export type BlockLink = {
  label: string;
  href: string;
};

export const blockFrame = 'mx-auto w-[calc(100%-48px)] lg:w-[calc(100%-100px)] max-w-[1320px]';

export function blockToneProps(tone: BlockTone = 'auto') {
  return {
    className: 'marketing-feature-bento',
    'data-tone': tone === 'auto' ? undefined : tone,
  };
}

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getServerReducedMotionSnapshot() {
  return true;
}

export function useBlockReducedMotion() {
  // Hydration must use the same visible, motion-free markup as the server.
  // React reads the browser preference only after hydration, and tracks changes.
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

export function SectionHeader({
  id,
  title,
  className,
}: {
  id?: string;
  title: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 max-w-[800px] flex items-start flex-col', className)}>
      <h2
        id={id}
        className="font-[family-name:var(--font-marketing-heading)] text-[clamp(36px,4vw,57px)] leading-[1.12] font-semibold tracking-[-1.5px] text-[var(--bjork-ink)] "
      >
        {title}
      </h2>
    </div>
  );
}

export function CtaLink({ label, href, className }: BlockLink & { className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-x-3 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white! px-4 py-3 text-sm font-medium text-[var(--bjork-ink)] no-underline transition-colors hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220] duration-300 transition-all ',
        className,
      )}
    >
      {label}
      <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
    </a>
  );
}

export function Reveal({
  children,
  className,
  animate = true,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!animate || !el) return;
    gsap.registerPlugin(ScrollTrigger);

    // Tweens created inside mm.add are reverted automatically when the media
    // query stops matching or when mm.revert() runs on unmount.
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(el, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        delay,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    return () => mm.revert();
  }, [animate, delay]);

  return (
    <li ref={ref} className={className}>
      {children}
    </li>
  );
}
