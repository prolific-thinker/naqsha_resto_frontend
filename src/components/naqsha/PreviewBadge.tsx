import { Chip } from './Chip';

/**
 * Marks a screen that is still rendering mock data.
 *
 * The point is honesty: without it, a demo viewer cannot tell a wired screen from an
 * unwired one, and "the inventory numbers looked right" becomes a decision someone
 * later regrets. Remove the badge when the screen's getters move off
 * `src/lib/api/erp.ts`.
 */
export function PreviewBadge() {
  return <Chip variant="muted">Preview · not wired</Chip>;
}
