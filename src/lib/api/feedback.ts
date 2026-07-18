import type { FeedbackContext, FeedbackSubmission } from '@/types/domain';
import { FeedbackContextSchema, FeedbackSubmissionSchema } from '@/types/api';
import { mockGet, mockPost } from './client';
import { feedbackContextForSlug } from '@/lib/mocks/feedback';

export function getFeedbackContext(tableSlug: string): Promise<FeedbackContext> {
  return mockGet(FeedbackContextSchema, feedbackContextForSlug(tableSlug));
}

export function submitFeedback(payload: FeedbackSubmission): Promise<FeedbackSubmission> {
  return mockPost(FeedbackSubmissionSchema, payload);
}
