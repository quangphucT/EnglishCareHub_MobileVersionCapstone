import httpClient from "./httpClient";
import {
    ChartCoinForConversationPayload,
  ChartCoinForConversationResponse,
  GetAIConversationChargesResponse,
  StartConversationResponse,
} from "../types/aiConversation.d";

// Get all AI packages
export const getAIPackagesService = async (): Promise<GetAIConversationChargesResponse> => {
  try {
    const response = await httpClient.get<GetAIConversationChargesResponse>(
      "Coin/ai-packages"
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể tải danh sách gói AI";
    throw new Error(message);
  }
};

// Charge coin for conversation
export const chargeCoinForConversationService = async (
  data: ChartCoinForConversationPayload
): Promise<ChartCoinForConversationResponse> => {
  try {
    const response = await httpClient.post<ChartCoinForConversationResponse>(
      "Coin/pay",
      data
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Lỗi khi trừ coin cho cuộc hội thoại";
    throw new Error(message);
  }
};

// Start conversation - get LiveKit token
export const startConversationService = async (
  aiPackageId: string
): Promise<StartConversationResponse> => {
  try {
    const response = await httpClient.post<StartConversationResponse>(
      `AIConversation/start`,
      { aiPackageId }
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể bắt đầu cuộc hội thoại";
    throw new Error(message);
  }
};
