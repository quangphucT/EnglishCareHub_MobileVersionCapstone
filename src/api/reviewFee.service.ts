import httpClient from './httpClient';

// Current Price Policy interface
export interface CurrentPricePolicy {
  reviewFeeDetailId: string;
  pricePerReviewFee: number;
  appliedDate: string;
  percentOfSystem: number;
  percentOfReviewer: number;
}

// Review Fee Package interface
export interface ReviewFeePackage {
  reviewFeeId: string;
  numberOfReview: number;
  currentPricePolicy: CurrentPricePolicy | null;
}

// Response from API
export interface ReviewFeePackagesResponse {
  isSucess: boolean; // Note: API uses "isSucess" not "isSuccess"
  data: {
    totalItems: number;
    items: ReviewFeePackage[];
  };
  businessCode: string;
  message: string;
}

export interface BuyReviewRequest {
  learnerAnswerId: string;
  reviewFeeId: string;
}

export interface BuyReviewRecordRequest {
  recordId: string;
  reviewFeeId: string;
}

export interface BuyReviewResponse {
  success: boolean;
  message: string;
  data: any;
}

// Get all review fee packages
export const getReviewFeePackages = async (): Promise<ReviewFeePackagesResponse> => {
  const response = await httpClient.get<ReviewFeePackagesResponse>(
    'AdminReviewFee/review-fee-packages/all'
  );
  return response.data;
};

// Buy review for learner answer
export const buyReview = async (data: BuyReviewRequest): Promise<BuyReviewResponse> => {
  const response = await httpClient.post<BuyReviewResponse>(
    'LearnerBuyReview/buy',
    data
  );
  return response.data;
};

// Buy review for record
export const buyReviewRecord = async (data: BuyReviewRecordRequest): Promise<BuyReviewResponse> => {
  const response = await httpClient.post<BuyReviewResponse>(
    'LearnerBuyReview/buy-record',
    data
  );
  return response.data;
};
