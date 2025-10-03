import { RegisterRequest, ResendOTPResponse, VerifyOTPResponse } from '../types/auth';
import httpClient from './httpClient';



export const authService = {
 
   // Register new account
  
  register: async (userData: RegisterRequest): Promise<any> => {
    try {
      const response = await httpClient.post('Auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  },

  /**
   * Login with phone number and password
   */
  // login: async (credentials: LoginRequest): Promise<LoginResponse> => {
  //   try {
  //     const response = await httpClient.post<LoginResponse>('/auth/login', {
  //       phoneNumber: credentials.phoneNumber,
  //       password: credentials.password,
  //     });
  //     return response.data;
  //   } catch (error: any) {
  //     throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
  //   }
  // },

  /**
   * Logout user
   */
  // logout: async (): Promise<void> => {
  //   try {
  //     await httpClient.post('/auth/logout');
  //   } catch (error) {
  //     // Logout locally even if server request fails
  //     console.warn('Logout request failed, but continuing with local logout');
  //   }
  // },

  
 
  // getProfile: async (): Promise<LoginResponse['user']> => {
  //   try {
  //     const response = await httpClient.get<LoginResponse['user']>('/auth/profile');
  //     return response.data;
  //   } catch (error: any) {
  //     throw new Error(error.response?.data?.message || 'Lấy thông tin người dùng thất bại');
  //   }
  // },

  /**
   * Verify OTP
   */
  verifyOTP: async (data: { email: string; otp: string }): Promise<VerifyOTPResponse> => {
    try {
      const response = await httpClient.post('Auth/verify-otp', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Xác thực OTP thất bại');
    }
  },

  /**
   * Resend OTP
   */
  resendOTP: async (data: { email: string }): Promise<ResendOTPResponse> => {
    try {
      const response = await httpClient.post('Auth/resend-otp', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gửi lại OTP thất bại');
    }
  },
};

export default authService;
