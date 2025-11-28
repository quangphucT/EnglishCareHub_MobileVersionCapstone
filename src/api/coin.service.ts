import {
  BuyCoinRequest,
  CancelBuyingCoinRequest,
  CancelBuyingCoinResponse,
  CoinServicePackageResponse,
  getOrderCodeStatusResponse,
  PayOSCheckoutResponse,
} from "../hooks/learner/coin/coinHooks";
import httpClient from "./httpClient";

// API Functions
export const getCoinServicePackages =
  async (): Promise<CoinServicePackageResponse> => {
    try {
      const response = await httpClient.get<CoinServicePackageResponse>(
        "AdminServicePackage/active"
      );
      return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách gói dịch vụ coin";
      throw new Error(message);
    }
  };

export const buyingCoinServicePackagesService = async (
  data: BuyCoinRequest
): Promise<PayOSCheckoutResponse> => {
  try {
    const response = await httpClient.post<PayOSCheckoutResponse>(
      "Coin/add",
      data
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Lỗi khi mua gói dịch vụ coin";
    throw new Error(message);
  }
};

export const getOrderCodeStatusService = async (orderCode: string): Promise<getOrderCodeStatusResponse> => {
  const response = await httpClient.get<getOrderCodeStatusResponse>(`Coin/status/${orderCode}`);
  return response.data;
};

export const cancelBuyingCoinServicePackagesService = async (data: CancelBuyingCoinRequest): Promise<CancelBuyingCoinResponse> => {
  const response = await httpClient.post<CancelBuyingCoinResponse>('Coin/cancel', data);
  return response.data;
};


