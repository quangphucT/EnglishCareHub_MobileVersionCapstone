import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { learnerFeedbackService, learnerReportReviewService, LearnerReviewHistoryResponse, learnerReviewHistoryService } from "../../../api/learnerFeedback.service";

export const    useLearnerFeedback = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { rating: number; content: string; reviewId: string }>({
        mutationFn: (body) => learnerFeedbackService(body),
        onSuccess: () => {
            // Không gọi Alert ở đây - để component tự xử lý
            queryClient.invalidateQueries({ queryKey: ["learnerReviewHistory"] });
        },
        // Không gọi Alert trong onError - để component tự xử lý
    });
}
export const useLearnerReportReview = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { reviewId: string, reason: string }>({
        mutationFn: (body) => learnerReportReviewService(body),
        onSuccess: () => {
            // Không gọi Alert ở đây - để component tự xử lý
            queryClient.invalidateQueries({ queryKey: ["learnerReviewHistory"] });
        },
        // Không gọi Alert trong onError - để component tự xử lý
    });
}
export const useLearnerReviewHistory = (pageNumber: number, pageSize: number, status: string, keyword: string) => {
    return useQuery<LearnerReviewHistoryResponse, Error>({
        queryKey: ["learnerReviewHistory", pageNumber, pageSize, status, keyword],
        queryFn: () => learnerReviewHistoryService(pageNumber, pageSize, status, keyword),
        placeholderData: keepPreviousData,
    });
}