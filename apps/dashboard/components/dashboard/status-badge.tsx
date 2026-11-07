import type { ReactNode } from 'react';
import { cn } from 'cn';

export function Badge({
  children,
  tone = 'green',
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.25 rounded-1.25 px-1.75 py-1 text-2.25 whitespace-nowrap',
        tone === 'orange'
          ? 'bg-(--accent-strong) text-(--brand-hover)'
          : tone === 'gray'
            ? 'bg-(--muted-background) text-muted-foreground'
            : 'bg-(--accent-background) text-(--brand-hover)',
        className,
      )}
    >
      <i className="w-1 h-1 rounded-full bg-current" />
      {children}
    </span>
  );
}
