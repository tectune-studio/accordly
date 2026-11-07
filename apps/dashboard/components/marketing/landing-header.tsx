'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function LandingHeader({ children }: { children: ReactNode }) {
  const header = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let previousY = Math.max(0, window.scrollY);
    let distance = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      // Clamp elastic overscroll so bouncing at either edge isn't a direction change.
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.max(0, Math.min(window.scrollY, maxY));
      const delta = y - previousY;
      previousY = y;

      if (y <= (header.current?.offsetHeight ?? 0)) {
        distance = 0;
        setHidden(false);
        return;
      }

      if (delta === 0) return;
      distance = Math.sign(delta) === Math.sign(distance) ? distance + delta : delta;
      // Ignore small trackpad jitters, but react promptly to a deliberate reversal.
      if (Math.abs(distance) >= 8) {
        setHidden(distance > 0 && !header.current?.contains(document.activeElement));
        distance = 0;
      }
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      ref={header}
      data-landing-header
      data-hidden={hidden}
      onFocusCapture={() => setHidden(false)}
      className={`sticky top-0 z-50 bg-white border-b-[0.05rem] border-gray-300 transition-transform duration-300 ease-in-out motion-reduce:transition-none  ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
    >
      {children}
    </header>
  );
}
