// register
interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: 'LEARNER' | 'REVIEWER';
}

interface RegisterResponse {
  message: string;
  email: string;
}


// verify OTP
export interface VerifyOTPRequest {
  email: string;
  otp: string;
}
export interface VerifyOTPResponse {
  message: string;
}

// resend OTP
export interface ResendOTPRequest {
  email: string;
}
export interface ResendOTPResponse {
  message: string;
}


// login 
interface LoginRequest {
  email: string;
  password: string;
}

// Google login request
interface GoogleLoginRequest {
  idToken: string;
}
interface GoogleLoginResponse { 
  message: string;
  accessToken: string;
  refreshToken: string;
  role: string;
  isPlacementTestDone: boolean;
  isGoalSet: boolean;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  message: string;
  role: string;
  isPlacementTestDone: boolean;
  isGoalSet: boolean;
}
// forgot password
interface ForgotPasswordResponse {
  message: string;
}
interface ForgotPasswordRequest {
  email: string;
}

// refresh token
interface RefreshTokenRequest {
  refreshToken: string;
}
interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  message: string;
  role: "LEARNER" | "REVIEWER";
}




interface User {
  accessToken: string;
  refreshToken: string;
  message: string;
  role: string;
  isPlacementTestDone: boolean;
  isGoalSet: boolean;
}

interface AuthState {
  // State
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}
