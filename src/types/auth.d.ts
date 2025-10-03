// Types
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
export interface VerifyOTPRequest {
  email: string;
  otp: string;
}
export interface VerifyOTPResponse {
  message: string;
}

export interface ResendOTPRequest {
  email: string;
}

export interface ResendOTPResponse {
  message: string;
}

interface LoginRequest {
  phoneNumber: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phoneNumber: string;
    fullName?: string;
    email?: string;
    role: 'LEARNER' | 'REVIEWER';
  };
  message: string;
}


interface User {
  id: string;
  phoneNumber: string;
  fullName?: string;
  email?: string;
  role: 'LEARNER' | 'REVIEWER';
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
