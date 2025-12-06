import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { learnerFeedbackService, learnerReportReviewService, LearnerReviewHistoryResponse, learnerReviewHistoryService } from "../../../api/learnerFeedback.service";
import { Alert } from "react-native";

export const    useLearnerFeedback = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { rating: number; content: string; reviewId: string }>({
        mutationFn: (body) => learnerFeedbackService(body),
        onSuccess: (data) => {
            Alert.alert(data.message || "Feedback submitted successfully");
            queryClient.invalidateQueries({ queryKey: ["learnerReviewHistory"] });
        },
        onError: (error) => {
            Alert.alert(error.message || "Feedback submission failed");
        },
    });
}
export const useLearnerReportReview = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { reviewId: string, reason: string }>({
        mutationFn: (body) => learnerReportReviewService(body),
        onSuccess: (data) => {
            Alert.alert(data.message || "Report review submitted successfully");
            queryClient.invalidateQueries({ queryKey: ["learnerReviewHistory"] });
        },
        onError: (error) => {
            Alert.alert(error.message || "Report review submission failed");
        },
    });
}
export const useLearnerReviewHistory = (pageNumber: number, pageSize: number, status: string, keyword: string) => {
    return useQuery<LearnerReviewHistoryResponse, Error>({
        queryKey: ["learnerReviewHistory", pageNumber, pageSize, status, keyword],
        queryFn: () => learnerReviewHistoryService(pageNumber, pageSize, status, keyword),
        placeholderData: keepPreviousData,
    });
}