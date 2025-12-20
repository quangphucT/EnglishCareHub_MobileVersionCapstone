import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getReviewFeePackages, 
  buyReview, 
  buyReviewRecord,
  type BuyReviewRequest,
  type BuyReviewRecordRequest,
  type ReviewFeePackagesResponse,
  type BuyReviewResponse
} from '../../../api/reviewFee.service';
import { Alert } from 'react-native';

// Hook to get review fee packages
export const useReviewFeePackages = () => {
  return useQuery<ReviewFeePackagesResponse>({
    queryKey: ['reviewFeePackages'],
    queryFn: getReviewFeePackages,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to buy review
export const useBuyReview = () => {
  const queryClient = useQueryClient();

  return useMutation<BuyReviewResponse, Error, BuyReviewRequest>({
    mutationFn: buyReview,
    onSuccess: (data) => {
      Alert.alert('Thành công', data.message || 'Đã mua đánh giá thành công!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['learnerReviewHistory'] });
      queryClient.invalidateQueries({ queryKey: ['getMe'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể mua đánh giá. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    },
  });
};

// Hook to buy review record
export const useBuyReviewRecord = () => {
  const queryClient = useQueryClient();

  return useMutation<BuyReviewResponse, Error, BuyReviewRecordRequest>({
    mutationFn: buyReviewRecord,
    onSuccess: (data) => {
      Alert.alert('Thành công', data.message || 'Đã mua đánh giá record thành công!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['learnerReviewHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể mua đánh giá record. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    },
  });
};
