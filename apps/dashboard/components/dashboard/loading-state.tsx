'use client';

export function LoadingState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center flex-col gap-3.75">
      <span className="w-7.5 h-7.5 border-2 border-line border-t-brand rounded-full animate-spin [animation-duration:0.8s] motion-reduce:animate-none" />
      <h2 className="text-[14px] tracking-[-0.2px] font-semibold m-0">Opening your workspace</h2>
      <p className="text-muted-foreground text-[12px] my-1.5 mx-0">Getting everything in order…</p>
      <button
        className="inline-flex items-center justify-center gap-2.25 min-h-10 border border-line rounded-1.75 bg-surface text-[11px]! font-semibold! whitespace-nowrap py-2.5 px-4 motion-reduce:transition-none!"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}
