import httpClient from "./httpClient";

export interface EditLearnerProfileResponse {
    isSucess: boolean;
    data: string; // learnerProfileId
    businessCode: string;
    message: string;
  }
  export interface EditLearnerProfileRequest {
    fullName: string;
    phoneNumber: string;
    avatarUrl?: string; // ✅ BẮT BUỘC thêm dòng này
  
  }
  export const editLearnerProfileService = async (payload: EditLearnerProfileRequest): Promise<EditLearnerProfileResponse> => {
    try {
      const response = await httpClient.put<EditLearnerProfileResponse>('LearnerProfile/edit', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Edit learner profile thất bại');
    }
  };

  export interface ProgressAnalyticsResponse {
    isSucess: boolean;
    data: ProgressAnalytics;
    businessCode: string;
    message: string;
  }
  
  export interface ProgressAnalytics {
    progressAnalyticsId: string;
    dateRecorded: string;
    speakingTime: number;
    sessionsCompleted: number;
    pronunciationScoreAvg: number;
    learnerProfileId: string;
  }
  
  export const getMyProgressAnalyticsService =
    async (): Promise<ProgressAnalyticsResponse> => {
      try {
        const response = await httpClient.get<ProgressAnalyticsResponse>('ProgressAnalytics/my');
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy dữ liệu tiến trình thất bại');
      }
    };