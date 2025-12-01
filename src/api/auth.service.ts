import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  ResendOTPRequest,
  ResendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
} from "../types/auth";
import httpClient from "./httpClient";

export const authService = {
  // Register new account

  register: async (userData: RegisterRequest): Promise<any> => {
    try {
      const response = await httpClient.post("Auth/register", userData);
      return response.data;
    } catch (error: any) {
      // Handle different error response formats
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  },

  /**
   * Login with phone number and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await httpClient.post<LoginResponse>('Auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      return response.data;
    } catch (error: any) {
       throw new Error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    try {
      const response = await httpClient.post<RefreshTokenResponse>('Auth/refresh-token', refreshToken);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to refresh token. Please try again.');
    }
  },


  forgotPassword:  async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    try {
      const response = await httpClient.post("Auth/forgot-password", data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send password reset email. Please try again.');
    }
  },

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
   * Google Login - Send idToken to backend
   */
  googleLogin: async (googleData: GoogleLoginRequest): Promise<GoogleLoginResponse> => {
    try {
      const response = await httpClient.post<GoogleLoginResponse>('Auth/google-login', {
        idToken: googleData.idToken,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Google login failed. Please try again.');
    }
  },

  /**
   * Google Login for Reviewer - Send idToken to backend
   */
  googleLoginReviewer: async (googleData: GoogleLoginRequest): Promise<GoogleLoginResponse> => {
    try {
      const response = await httpClient.post<GoogleLoginResponse>('Auth/google-login-reviewer', {
        idToken: googleData.idToken,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Google login failed. Please try again.');
    }
  },

  /**
   * Verify OTP
   */
  verifyOTP: async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    try {
      const response = await httpClient.post("Auth/verify-otp", data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Verification failed. Please try again.');

    }
  },

  /**
   * Resend OTP
   */
  resendOTP: async (data: ResendOTPRequest): Promise<ResendOTPResponse> => {
    try {
      const response = await httpClient.post("Auth/resend-otp", data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Resend OTP failed. Please try again.');
    }
  },
};

export default authService;
