'use client';

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="fixed bottom-6.25 left-[calc(50%_+_119px)] -translate-x-1/2 bg-(--inverse-background) text-(--on-brand) border border-(--brand-hover) rounded-[10px] shadow-[0_10px_40px_var(--shadow-strong)] flex items-center gap-3.5 text-[12px] z-[100] max-w-[90vw] [@media(max-width:1200px)]:left-[calc(50%_+_105px)] [@media(max-width:1000px)]:left-[calc(50%_+_92px)]! [@media(max-width:720px)]:left-1/2! [@media(max-width:720px)]:text-[11px] [@media(max-width:720px)]:min-w-[250px] py-[15px] px-5"
      role="status"
    >
      <span className="text-(--inverse-muted)">✓</span>
      {message}
      <button
        className="bg-transparent text-(--inverse-muted)! border-0 text-[18px]! motion-reduce:transition-none!"
        onClick={() => onDismiss()}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
