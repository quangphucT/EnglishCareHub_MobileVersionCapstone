import { useQuery, useMutation } from '@tanstack/react-query';
import { buyingCoinServicePackagesService, cancelBuyingCoinServicePackagesService, getCoinServicePackages, getOrderCodeStatusService } from '../../../api/coin.service';
export interface CoinServicePackageResponse {
    isSuccess: boolean; 
    data: CoinPackage[];
    message: string;
  
}
export interface CoinPackage {
    servicePackageId: string;
    name: string;
    description: string; 
    price: number; 
    numberOfCoin: number; 
    bonusPercent: number;
    purchaseCount?: number; // Số lượt mua - dùng để xác định gói phổ biến

}

// Get all coin service packages
export const useGetCoinServicePackage = () => {
  return useQuery<CoinServicePackageResponse, Error>({
    queryKey: ["CoinServicePackages"],
    queryFn: getCoinServicePackages,
    staleTime: 1000 * 60 * 5, 
  });
};



export interface BuyCoinRequest {
    servicePackageId: string;   
}
export interface PayOSCheckoutResponse {

    checkoutUrl: string;  
    orderCode: string;
    qrCode: string;
    qrBase64: string;

}
// Buy coin service package
export const useBuyingCoinServicePackages = () => {
  return useMutation<PayOSCheckoutResponse, Error, BuyCoinRequest>({
    mutationFn: buyingCoinServicePackagesService,
   
  });
};


// Get order status
export interface getOrderCodeStatusResponse{
    orderCode: string;
    status: string;
}
export const useGetOrderCodeStatusQuery = (orderCode: string) => {
  return useQuery<getOrderCodeStatusResponse, Error>({
    queryKey: ["getOrderCodeStatus", orderCode], // <-- Thêm orderCode để theo dõi sự thay đổi
    queryFn: () => getOrderCodeStatusService(orderCode),
    enabled: !!orderCode, // <-- Chỉ chạy khi orderCode có giá trị
  
  });
};


export interface CancelBuyingCoinRequest{
    orderCode: string;
}
export interface CancelBuyingCoinResponse{
    message: string;
}
// Cancel order
export const useCancelBuyingCoinServicePackages = () => {
  return useMutation<CancelBuyingCoinResponse, Error, CancelBuyingCoinRequest>({
    mutationFn:  cancelBuyingCoinServicePackagesService,
  });
};