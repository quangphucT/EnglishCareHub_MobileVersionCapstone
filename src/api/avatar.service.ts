import { HttpClient } from "@microsoft/signalr";
import httpClient from "./httpClient";

export interface UploadAvatarResponse {
    success: boolean;
    url: string;
  }

  export const uploadAvatarService = async ( file: File): Promise<UploadAvatarResponse> => {
    try {
      const response = await httpClient.post<UploadAvatarResponse>('Avatar/avatar', file);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Upload avatar thất bại');
    }
  };
  