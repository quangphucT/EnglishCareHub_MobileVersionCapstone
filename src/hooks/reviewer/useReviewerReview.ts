import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    reviewerReviewHistoryService,
    reviewerReviewPendingService,
    reviewerReviewStatisticsService,
    submitReviewerReviewService,
    reviewerReviewWalletService,
    reviewerTipAfterReviewService,
} from "../../api/reviewerReview.service";
import type {
    ReviewerReviewHistoryResponse,
    ReviewerReviewPendingResponse,
    ReviewerReviewStatisticsResponse,
    ReviewerReviewSubmitResponse,
    ReviewerReviewWalletResponse,
} from "../../api/reviewerReview.service";
export const useReviewReviewSubmit = () => {
    const queryClient = useQueryClient();
    return useMutation<ReviewerReviewSubmitResponse, Error, { learnerAnswerId: string | null; recordId: string | null; reviewerProfileId: string | null; score: number; comment: string; recordAudioUrl: string | null }>({
        mutationFn: ({ learnerAnswerId, recordId, reviewerProfileId, score, comment ,recordAudioUrl}) => submitReviewerReviewService({ learnerAnswerId, recordId, reviewerProfileId, score, comment ,recordAudioUrl}),
        onSuccess: (data) => {
            const message = data.message || "Review answer submitted successfully";
            const remainingReviews = data.data?.remainingReviews;
            
            // Show success message with remaining reviews info if available
            if (remainingReviews !== undefined) {
                console.log(`${message} (Còn ${remainingReviews} câu trả lời cần review)`);
            } else {
                console.log(message);
            }
            
            // Invalidate pending reviews to refresh the list
            queryClient.invalidateQueries({ queryKey: ["reviewReviewPending"] });
        },
        onError: (error) => {
            console.error(error.message || "Review answer submission failed");
        },
    });
}
export const useReviewReviewHistory = (pageNumber: number, pageSize: number ) => {
    return useQuery<ReviewerReviewHistoryResponse, Error>({
        queryKey: ["reviewReviewHistory", pageNumber, pageSize],
        queryFn: () => reviewerReviewHistoryService(pageNumber, pageSize),
    });
}
export const useReviewReviewPending = (pageNumber: number, pageSize: number) => {
    return useQuery<ReviewerReviewPendingResponse, Error>({
        queryKey: ["reviewReviewPending", pageNumber, pageSize],
        queryFn: () => reviewerReviewPendingService(pageNumber, pageSize),
    });
}
export const useReviewReviewStatistics = () => {
    return useQuery<ReviewerReviewStatisticsResponse, Error>({
        queryKey: ["reviewReviewStatistics"],
        queryFn: () => reviewerReviewStatisticsService(),
    });
}
export const useReviewReviewWallet = (pageNumber: number, pageSize: number) => {
    return useQuery<ReviewerReviewWalletResponse, Error>({
        queryKey: ["reviewReviewWallet", pageNumber, pageSize],
        queryFn: () => reviewerReviewWalletService(pageNumber, pageSize),
    });
}
export const useReviewerTipAfterReview = () => {
    return useMutation<any, Error, { reviewId: string; amountCoin: number; message: string }>({
        mutationFn: ({ reviewId, amountCoin, message }) => reviewerTipAfterReviewService(reviewId, amountCoin, message),
        onSuccess: (data) => {
            console.log(data.message || "Tip after review successful");
        },
        onError: (error) => {
            console.error(error.message || "Tip after review failed");
        },
    });
}