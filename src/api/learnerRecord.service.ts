import httpClient from "./httpClient";

// Interfaces
export interface RecordCategory {
    learnerRecordId: string;
    name: string;
    status?: string;
    createdAt?: Date;
  }
  
  export interface RecordCategoryResponse {
    data: RecordCategory[];
    message?: string;
    isSucess: boolean; // Note: API returns "isSucess" with one 'c'
    businessCode?: string;
  }
  
  export interface Record {
      recordId: string;
      learnerRecordId: string;
      content: string;
      audioRecordingURL: string;
      score: number;
      aiFeedback: string;
      status: string;
      createdAt: Date;
  }
  
  export interface RecordResponse {
    data?: Record[] | Record; // Support both array and single object
    message?: string;
    isSucess?: boolean;
    businessCode?: string;
  }
  
  export interface CreateRecordCategoryResponse {
    message?: string;
    data?: RecordCategory;
    isSuccess?: boolean;
  }
  
  export interface CreateRecordResponse {
    message?: string;
    data?: Record;
    isSuccess?: boolean;
  }
  
  export interface DeleteResponse {
    message?: string;
    isSuccess?: boolean;
  }
  
  export interface ReviewRecordRequest {
    score?: number;
    aiFeedback?: string;
    audioRecordingURL?: string;
    transcribedText?: string;
  }
  
  export interface ReviewRecordResponse {
    message?: string;
    isSuccess?: boolean;  
  }
  export const LearnerRecordFolderService = async (): Promise<RecordCategoryResponse> => {
    try {
        const response = await httpClient.get<RecordCategoryResponse>('RecordCategory/mine');
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể tải danh mục bản ghi');
    }
}
export const LearnerRecordFolderCreateService = async (name: string): Promise<CreateRecordCategoryResponse> => {
    try {
        const response = await httpClient.post<CreateRecordCategoryResponse>('RecordCategory/create', { name });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể tạo danh mục bản ghi');
    }
}
export const LearnerRecordFolderDeleteService = async (categoryId: string): Promise<DeleteResponse> => {
    try{
        const response = await httpClient.delete<DeleteResponse>(`RecordCategory/${categoryId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể xóa danh mục bản ghi');
    }
}
export const LearnerRecordFolderRenameService = async (categoryId: string, newName: string): Promise<CreateRecordCategoryResponse> => {
    try {
        const response = await httpClient.put<CreateRecordCategoryResponse>(`RecordCategory/${categoryId}/rename`, { newName });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể đổi tên danh mục bản ghi');
    }
}
export const LearnerRecordService = async (folderId: string): Promise<RecordResponse> => {
    try {
        const response = await httpClient.get<RecordResponse>(`Record/${folderId}/mine`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể tải bản ghi');
    }
}
export const LearnerRecordCreateService = async (folderId: string, content: string): Promise<CreateRecordResponse> => {
    try {
        const response = await httpClient.post<CreateRecordResponse>(`Record/${folderId}/create-content-only`, { content });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể tạo bản ghi');
    }
}
export const LearnerRecordDeleteService = async (recordId: string): Promise<DeleteResponse> => {
    try {
        const response = await httpClient.delete<DeleteResponse>(`Record/${recordId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể xóa bản ghi');
    }
}
export const LearnerRecordUpdateContentService = async (recordId: string, content: string): Promise<CreateRecordResponse> => {
    try {
        const response = await httpClient.put<CreateRecordResponse>(`Record/${recordId}/update-content`, { content });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể cập nhật nội dung bản ghi');
    }
}
export const LearnerRecordUpdateService = async (recordId: string, reviewData: ReviewRecordRequest): Promise<ReviewRecordResponse> => {
    try {
        const response = await httpClient.put<ReviewRecordResponse>(`Record/${recordId}/submit`, reviewData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể cập nhật bản ghi');
    }
}