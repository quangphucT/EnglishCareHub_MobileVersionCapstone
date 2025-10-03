import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import authService from '../api/auth.service';
import { ResendOTPRequest, VerifyOTPRequest } from '../types/auth';




// Custom hook for verify OTP
export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: (data: VerifyOTPRequest) => authService.verifyOTP(data),
    onSuccess: (data) => {
      console.log('OTP verified successfully:', data);
    },
    onError: (error: any) => {
      console.error('OTP verification failed:', error);
    },
  });
};

// Custom hook for resend OTP
export const useResendOTP = () => {
  return useMutation({
    mutationFn: (data: ResendOTPRequest) => authService.resendOTP(data),
    onSuccess: (data) => {
      Alert.alert('Thành công', 'Mã OTP mới đã được gửi!');
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Gửi lại OTP thất bại';
      Alert.alert('Lỗi', errorMessage);
    },
  });
};

export default {
  useVerifyOTP,
  useResendOTP,
};