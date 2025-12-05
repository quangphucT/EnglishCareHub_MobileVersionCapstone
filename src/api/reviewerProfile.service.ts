import httpClient from "./httpClient";

export interface ReviewerProfileResponse {
    isSucess: boolean;
    data: {
      reviewerProfileId: string;
      userId: string;
      experience: string;
      rating: number;
      status: string;
      isReviewerActive: boolean;
      yearsExperience: number;
      certificates: Certificate[];
    };
  }
  export interface Certificate {
    certificateId: string;
    name: string;
    url: string;
    status: string;
  }
  export const reviewerProfileGetService = async (userId: string): Promise<ReviewerProfileResponse> => {
    try {
    const response = await httpClient.get<ReviewerProfileResponse>(`reviewer/profile/${userId}`);
    return response.data;
    } catch (error: any) {  
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Không thể tải thông tin reviewer";
      throw new Error(message);
    }
  };
  export const reviewerProfilePutService = async (userId: string, data: { experience: string; fullname: string; phoneNumber: string }): Promise<ReviewerProfileResponse> => {
    try {
    const response = await httpClient.put<ReviewerProfileResponse>(`reviewer/profile/${userId}`, data);
    return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Không thể cập nhật thông tin reviewer";
      throw new Error(message);
    }
  };