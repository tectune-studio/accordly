import { useEffect, type FormEventHandler } from 'react';
import { Icon } from './icon';

export function CreateProjectDialog({
  busy,
  error,
  onClose,
  onSubmit: createProject,
}: {
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const controls = [
        ...document.querySelectorAll<HTMLElement>(
          '#new-project-dialog button:not(:disabled), #new-project-dialog input',
        ),
      ];
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        last?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first?.focus();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 bg-(--overlay-color) backdrop-blur-[4px] z-[80] grid place-items-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="w-[min(440px,_100%)] bg-surface border border-line rounded-[15px] shadow-[0_25px_100px_var(--shadow-strong)] relative p-8 [@media(max-width:720px)]:p-6.25"
        id="new-project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
      >
        <button
          className="absolute right-[15px] top-2.5 bg-transparent border-0 text-muted-foreground! text-6.25! motion-reduce:transition-none!"
          onClick={() => onClose()}
          aria-label="Close project dialog"
        >
          ×
        </button>
        <div className="bg-(--accent-background) border border-line text-(--brand-hover) w-[52px] h-[52px] rounded-3.25 grid place-items-center mb-5">
          <Icon name="Projects" size={28} />
        </div>
        <h2
          className="text-[27px] tracking-[-0.2px] font-normal font-sans m-0"
          id="new-project-title"
        >
          A new space for trust.
        </h2>
        <p className="text-muted-foreground mt-2 mb-6.25 text-[12px] mx-0">
          Add your website. We’ll take it from there.
        </p>
        <form onSubmit={createProject}>
          <label className="block text-[11px] text-ink">
            Project name
            <input
              className="block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-surface text-ink! text-[12px]! mx-0 py-2.5 px-3"
              autoFocus
              name="name"
              placeholder="My wonderful website"
              required
              maxLength={80}
            />
          </label>
          <label className="block text-[11px] text-ink">
            Website domain
            <input
              className="block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-surface text-ink! text-[12px]! mx-0 py-2.5 px-3"
              name="domain"
              placeholder="example.com"
              required
            />
          </label>
          <p className="text-muted-foreground mt-3.5 mb-1.5 text-[10px] leading-[1.8] mx-0">
            Use a hostname without https://. Domain ownership verification is required before a
            future live deployment.
          </p>
          <div className="mt-6.25 flex justify-end gap-2.5">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2.25 min-h-10 border border-line rounded-1.75 bg-surface text-[11px]! font-semibold! whitespace-nowrap py-2.5 px-4 motion-reduce:transition-none!"
              onClick={() => onClose()}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2.25 min-h-10 border rounded-1.75 bg-brand text-[11px]! font-semibold! whitespace-nowrap border-brand text-(--on-brand)! shadow-[0_2px_3px_var(--shadow-color)] enabled:hover:bg-(--brand-hover) enabled:hover:border-(--brand-hover) enabled:hover:filter-none! py-2.5 px-4 motion-reduce:transition-none!"
              disabled={busy}
            >
              Create project →
            </button>
          </div>
          {error && (
            <p role="alert" className="text-(--error-foreground) text-[11px] font-bold my-1.5 mx-0">
              {error}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
