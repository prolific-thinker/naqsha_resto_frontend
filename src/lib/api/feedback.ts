import type { FeedbackContext, FeedbackSubmission } from '@/types/domain';
import { FeedbackContextSchema } from '@/types/api';
import { apiGet, apiPost, unwrapOk } from './http';
import { METHODS } from './endpoints';
import type { SrvFeedbackContext } from '@/types/server';

/**
 * Guest feedback. Both calls are `authScope: 'guest'` — they are unauthenticated by
 * design, and a 403 here must never sign out a staff session in another tab.
 */

export async function getFeedbackContext(tableSlug: string): Promise<FeedbackContext> {
  const raw = await apiGet<SrvFeedbackContext>(METHODS.guestFeedbackContext, {
    query: { t: tableSlug },
    authScope: 'guest',
  });
  const ctx = unwrapOk(raw);

  return FeedbackContextSchema.parse({
    tableSlug: ctx.tableSlug,
    // The guest payload deliberately never leaks the table's docname (guest.py rule 1),
    // so the human-facing table number stands in. The component renders
    // `Table {tableRef}` → "Table 07".
    tableRef: ctx.tableNumber,
    // Required string; _recent_invoice returns None outside the feedback window.
    invoiceRef: ctx.invoiceRef ?? '—',
    branchLabel: ctx.branchLabel ?? 'Naqsha',
    // Not on the payload, and correctly so — the server has no reason to know how the
    // owner wants to be greeted. Configured client-side.
    ownerFirstName: import.meta.env.VITE_OWNER_GREETING ?? 'the owner',
    dishOptions: (ctx.dishOptions ?? []).map((d) => d.name),
  });
}

/**
 * Returns void, not the payload. The server answers `{ok: true, feedback: <name>}`;
 * the component only reads `isSuccess`. (The previous implementation parsed the
 * *response* with FeedbackSubmissionSchema, which only ever worked against a mock
 * that echoed the request back.)
 */
export async function submitFeedback(payload: FeedbackSubmission): Promise<void> {
  const res = await apiPost<{ ok: boolean }>(
    METHODS.guestSubmitFeedback,
    {
      t: payload.tableSlug,
      rating: payload.rating,
      likedDishes: payload.likedDishes,
      comment: payload.comment,
      phone: payload.phone,
    },
    { authScope: 'guest' },
  );
  unwrapOk(res);
}
