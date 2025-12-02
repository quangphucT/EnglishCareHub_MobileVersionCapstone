// AI Conversation Types

export interface AIConversationCharge {
  aiConversationChargeId: string;
  amountCoin: number;
  allowedMinutes: number;
}

// API trả về array trực tiếp
export type GetAIConversationChargesResponse = AIConversationCharge[];

export interface ChartCoinForConversationResponse {
    isSuccess: boolean;
    data: null; 
    businessCode: string;
    message: string;
}
export interface ChartCoinForConversationPayload {
    aiConversationChargeId: string;
}

export interface StartConversationRequest {
  aiPackageId: string;
}

export interface StartConversationResponse {
  isSuccess: boolean;
  message: string;
  token: string;
  url: string;
  roomName: string;
  participantName: string;
}
