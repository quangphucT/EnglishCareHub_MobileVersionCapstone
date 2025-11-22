import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import authService from "../api/auth.service";
import { ResendOTPRequest, VerifyOTPRequest } from "../types/auth";

// Custom hook for verify OTP
export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: (data: VerifyOTPRequest) => authService.verifyOTP(data),
  });
};

// Custom hook for resend OTP
export const useResendOTP = () => {
  return useMutation({
    mutationFn: (data: ResendOTPRequest) => authService.resendOTP(data),
  });
};

export default {
  useVerifyOTP,
  useResendOTP,
};
