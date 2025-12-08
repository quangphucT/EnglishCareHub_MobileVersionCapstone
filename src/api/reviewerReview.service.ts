import httpClient from "./httpClient";
export interface ReviewerReviewPendingResponse {
    isSucess: boolean;
    data: {
      pageNumber: number;
      pageSize: number;
      totalItems: number;
      items: ReviewerReviewPending[];
      businessCode: number;
      message: string;
    };
  }
  export interface ReviewerReviewPending {
    aiFeedback: string;
    type: string;
    id: string;
    submittedAt: Date;
    content: string;
    audioUrl: string;
    numberOfReview: number;
    learnerFullName: string;
    questionText: string;
  }
  export interface SubmitReviewerReviewRequest {
      learnerAnswerId: string | null;
      recordId: string | null;
      reviewerProfileId: string | null;
      score: number;
      comment: string;
      recordAudioUrl: string | null;
    }
    export interface ReviewerReviewSubmitResponse {
        isSucess: boolean;
        data: {
          reviewId: string;
          learnerAnswerId: string;
          score: number;
          comment: string;
          status: string;
          remainingReviews: number;
        };
        businessCode: string;
        message: string;
      }
      export interface ReviewerReviewWalletResponse {
        isSucess: boolean;
        data: {
          totalEarnedCoin: number;
          totalEarnedMoney: number;
          currentBalanceCoin: number;
          currentBalanceMoney: number;
          transactions: Transaction;
        };
        businessCode: string;
        message: string;
      }
      export interface Transaction {
        pageNumber: number;
        pageSize: number;
        totalItems: number;
        items: TransactionItem[];
      }
      export interface TransactionItem {
        transactionId: string;
          coin: number;
        money: number;
        bankName: string;
        accountNumber: string;
        status: "Withdraw" | "Reject" | "Pending";
        orderCode: string;
        createdAt: string;
        description: string;
      }
      export interface ReviewerReviewStatisticsResponse {
        isSucess: boolean;
        data: {
          totalFeedback: number;
          totalReviews: number;
          averageRating: number;
          coinBalance: number;
        };
        businessCode: string;
        message: string;
      }
      export interface ReviewerReviewHistory {
        reviewId: string;
        score: number;
        comment: string;
        status: string;
        learnerAnswerId: string;
        createdAt: Date;
        questionContent: string;
        learnerFullName: string;
        reviewType: string;
        learnerAudioUrl: string;
      }
      export interface ReviewerReviewHistoryResponse {
        isSucess: boolean;
        data: {
          pageNumber: number;
          pageSize: number;
          totalItems: number;
          items: ReviewerReviewHistory[];
          businessCode: number;
          message: string;
        };
      }
// Submit reviewer review
export const submitReviewerReviewService = async (body: SubmitReviewerReviewRequest): Promise<ReviewerReviewSubmitResponse> => {
  try {
    
    const response = await httpClient.post<ReviewerReviewSubmitResponse>(
      "ReviewerReview/submit",
      body
    );
        
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Gửi đánh giá thất bại";
    throw new Error(message);
  }
};

export const reviewerReviewHistoryService = async (
    pageNumber: number,
    pageSize: number
  ): Promise<ReviewerReviewHistoryResponse> => {
    try {
        const response = await httpClient.get<ReviewerReviewHistoryResponse>(
            "ReviewerReview/history",
            {
                params: {
                    pageNumber: pageNumber,
                    pageSize: pageSize
                }
            }
        );
        
        return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Không thể tải lịch sử đánh giá";
      throw new Error(message);
    }
};

export const reviewerReviewPendingService = async (
    pageNumber: number,
    pageSize: number
  ): Promise<ReviewerReviewPendingResponse> => {

    try {
        const response = await httpClient.get<ReviewerReviewPendingResponse>(
            "ReviewerReview/pending",
            {
                params: {
                    pageNumber: pageNumber,
                    pageSize: pageSize
                }
            }
        );
        
        return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Không thể tải đánh giá chờ";
      throw new Error(message);
    }
}

export const reviewerReviewStatisticsService = async (): Promise<ReviewerReviewStatisticsResponse> => {
    try {
        const response = await httpClient.get<ReviewerReviewStatisticsResponse>("ReviewerReview/statistics");
        return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Không thể tải thống kê đánh giá";
      throw new Error(message);
    }
}

export const reviewerReviewWalletService = async (pageNumber: number, pageSize: number): Promise<ReviewerReviewWalletResponse> => {
    try {
        const response = await httpClient.get<ReviewerReviewWalletResponse>("ReviewerReview/wallet", {
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
        "Không thể tải ví đánh giá";
      throw new Error(message);
    }
}

export const reviewerTipAfterReviewService = async (
    reviewId: string,
    amountCoin: number, 
    message: string
  ): Promise<any> => {
    try {
         // Validate required fields
      if (!reviewId || !reviewId.trim()) {
        throw new Error("Review ID is required");
      }
      if (!amountCoin || amountCoin <= 0) {
        throw new Error("Amount coin must be greater than 0");
      }
        const response = await httpClient.post<any>("reviewer/tip", {
            reviewId: reviewId,
            amountCoin: amountCoin,
            message: message
        });
        return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Không thể gửi tiền tip sau khi đánh giá";
      throw new Error(message);
    }
}