import httpClient from "./httpClient";

export interface ReviewerCoinHistoryWithdrawResponse {
    data: Array<{
      orderCode: string;
      amountMoney: number;
      amountCoin: number;
      status: string;
      bankName: string;
      accountNumber: string;
      description: string;
      createdAt: string;
    }>;
  }
export interface ReviewerCoinWithdrawResponse {
      orderCode: string;
      amountMoney: number;
      amountCoin: number;
      status: string;
  }
export const reviewerCoinWithdrawService = async (
    body: {
        coin: number;
        bankName: string;
        accountNumber: string;
    }
  ): Promise<ReviewerCoinWithdrawResponse> => {
    try {
        const response = await httpClient.post<ReviewerCoinWithdrawResponse>(`Coin/withdraw`, body);
        return response.data;
    } catch (error: any) {
        const message =
            error?.response?.data?.message ||
            error.message ||
            "Không thể rút tiền";
        throw new Error(message);
    }
  }
  export const reviewerCoinHistoryWithdrawService = async (
): Promise<ReviewerCoinHistoryWithdrawResponse> => {
    try {
        const response = await httpClient.get<ReviewerCoinHistoryWithdrawResponse>(`Coin/history/withdraw`);
        return response.data;
    } catch (error: any) {
        const message =
            error?.response?.data?.message ||
            error.message ||
            "Không thể tải lịch sử rút tiền";
        throw new Error(message);
    }
}