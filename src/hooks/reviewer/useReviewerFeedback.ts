import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
    reviewerFeedbackHistoryService,
    type ReviewerFeedbackHistoryResponse,
} from "../../api/reviewFeedback.service";

export const useReviewFeedback = (pageNumber: number, pageSize: number) => {
    return useQuery<ReviewerFeedbackHistoryResponse, Error>({
        queryKey: ["reviewerFeedback", pageNumber, pageSize],
        queryFn: () => reviewerFeedbackHistoryService(pageNumber, pageSize),
        placeholderData: keepPreviousData,
    });
}