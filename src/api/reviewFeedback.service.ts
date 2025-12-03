import httpClient from "./httpClient";

export interface ReviewerFeedbackHistoryResponse {
    isSucess: boolean;
    data: {
        pageNumber: number;
        pageSize: number;
        totalItems: number;
        items: ReviewerFeedbackHistory[];
    };
    message: string;
    businessCode: number;
}
export interface ReviewerFeedbackHistory {
    feedbackId: string;
    content: string;
    rating: number;
    createdAt: Date;
    learnerName: string;
    learnerEmail: string;
    reviewId: string;
    reviewType: string;
    questionOrContent: string;
}
export const reviewerFeedbackHistoryService = async (
    pageNumber: number,
    pageSize: number
): Promise<ReviewerFeedbackHistoryResponse> => {
    try {
        const response = await httpClient.get<ReviewerFeedbackHistoryResponse>(`ReviewerFeedback/my-feedback`, {
            params: {
                pageNumber: pageNumber,
                pageSize: pageSize
            }
        });
        return response.data;
    } catch (error: any) {
        const message =
            error?.response?.data?.message ||
            error.message ||
            "Không thể tải lịch sử đánh giá";
        throw new Error(message);
    }
}