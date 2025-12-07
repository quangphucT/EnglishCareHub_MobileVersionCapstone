import httpClient from "./httpClient";

export const learnerFeedbackService = async (body: { rating: number; content: string; reviewId: string }) => {
    try {
        const response = await httpClient.post<any>('Feedback/create', body);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gửi đánh giá thất bại');
    }
}
export const learnerReportReviewService = async (body: { reviewId: string ,reason: string}) => {
    try {
        const response = await httpClient.post<any>('Feedback/report-review', body);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gửi báo cáo đánh giá thất bại');
    }
}

export interface LearnerReviewHistory {
    reviewId: string;
    score: number;
    comment: string;
    status: string;
    recordId: string;
    createdAt: Date;
    questionContent: string;
    reviewerFullName: string;
    // API trả về field reviewAudioUrl
    reviewAudioUrl: string | null;
    reviewType: "Record" | "LearnerAnswer" ;
    feedbackStatus: "NotSent" | "Approved" | "Rejected" | "Pending";
}
export interface LearnerReviewHistoryResponse {
    isSucess: boolean;
    data: {
        pageNumber: number;
        pageSize: number;
        totalItems: number;
        completed: number;
        pending: number;
        rejected: number;
        items: LearnerReviewHistory[];          
    };
    businessCode: number;
    message: string;
}
export const learnerReviewHistoryService = async (pageNumber: number, pageSize: number, status: string, keyword: string): Promise<LearnerReviewHistoryResponse> => {
    try {
        const response = await httpClient.get<LearnerReviewHistoryResponse>('Feedback/history', {
            params: {
                pageNumber: pageNumber,
                pageSize: pageSize,
                status: status,
                keyword: keyword
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể tải lịch sử đánh giá');
    }
}