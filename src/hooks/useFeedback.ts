import { useMutation, useQuery } from '@tanstack/react-query';
import type { FeedbackSubmission } from '@/types/domain';
import { getFeedbackContext, submitFeedback } from '@/lib/api/feedback';

export function useFeedbackContext(tableSlug: string) {
  return useQuery({
    queryKey: ['feedback', 'context', tableSlug],
    queryFn: () => getFeedbackContext(tableSlug),
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (payload: FeedbackSubmission) => submitFeedback(payload),
  });
}
