import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Props = {
  title: string;
  refCode?: string;
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  onClose: () => void;
  busy?: boolean;
  /** Server-side failure message. Rendered in the dialog, never as a toast — the
   *  user needs it next to the field they have to change. */
  error?: string | null;
  disabled?: boolean;
};

/**
 * The modal shell the ERP write forms share.
 *
 * Submitting is a real `<form onSubmit>` so Enter works and the browser runs
 * `required` validation before anything reaches the server.
 */
export function FormDialog({
  title,
  refCode,
  children,
  submitLabel,
  onSubmit,
  onClose,
  busy,
  error,
  disabled,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) onSubmit();
        }}
        className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-lg border border-line bg-paper shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            {refCode && (
              <div className="font-mono text-[10px] uppercase tracking-ref text-muted">{refCode}</div>
            )}
            <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="close" className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">{children}</div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <span className="text-[12px] text-alert">{error ?? ''}</span>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={busy || disabled}>
              {busy ? 'Saving…' : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Labelled field wrapper, so the forms below stay readable. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-ref text-muted">
        {label}
        {hint && <span className="ml-2 normal-case tracking-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
