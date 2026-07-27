type Props = {
  /** Retained for call-site compatibility; no longer rendered. */
  className?: string;
};

/**
 * Deprecated decorative registration ticks. The "warm hospitality" redesign
 * dropped the blueprint corner-brackets, so this now renders nothing. Kept as a
 * no-op so the ~18 existing call sites don't need touching; delete usages as
 * screens are next revised.
 */
export function CornerTicks(_props: Props) {
  return null;
}
