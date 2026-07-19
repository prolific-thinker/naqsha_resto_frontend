import type { FeedbackContext, FeedbackSubmission } from '@/types/domain';
import { FeedbackContextSchema, FeedbackSubmissionSchema } from '@/types/api';
import { mockGet, mockPost } from './client';
import { httpGet, httpPost, USE_MOCKS } from './http';
import { ENDPOINTS } from './endpoints';
import { feedbackContextForSlug } from '@/lib/mocks/feedback';

export function getFeedbackContext(tableSlug: string): Promise<FeedbackContext> {
  return USE_MOCKS
    ? mockGet(FeedbackContextSchema, feedbackContextForSlug(tableSlug))
    : httpGet(ENDPOINTS.feedbackContext(tableSlug), FeedbackContextSchema);
}

export function submitFeedback(payload: FeedbackSubmission): Promise<FeedbackSubmission> {
  return USE_MOCKS
    ? mockPost(FeedbackSubmissionSchema, payload)
    : httpPost(ENDPOINTS.submitFeedback(), payload, FeedbackSubmissionSchema);
}
