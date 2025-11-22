import { useMutation} from '@tanstack/react-query';
import { Alert } from 'react-native';
import authService from '../api/auth.service';
import { ForgotPasswordRequest, LoginRequest, RegisterRequest } from '../types/auth';



export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData)
  });
};

// Custom hook for login
export const useLogin = () => {
  const authMiddleware = require('../middleware/authMiddleware').default;
  
  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async (data, variables) => {
      try {
        // Use middleware to handle login success - just save tokens, no UI
        await authMiddleware.handleLoginSuccess(data, variables);
        // Let the component handle UI feedback
      } catch (error) {
        Alert.alert('Lỗi', 'Đăng nhập thành công nhưng xử lý nội bộ thất bại. Vui lòng thử đăng nhập lại.');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    },
  });
};

// Custom hook for logout
export const useLogout = () => {
  const authMiddleware = require('../middleware/authMiddleware').default;
  
  return useMutation({
    mutationFn: async () => {
      // You can add API logout call here if needed
      // await authService.logout();
      return Promise.resolve();
    },
    onSuccess: async () => {
      try {
        await authMiddleware.handleLogout();
        Alert.alert('Thành công', 'Đăng xuất thành công!');
      } catch (error) {
        console.error('Error in logout handler:', error);
      }
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      // Still try to logout locally
      authMiddleware.handleLogout();
    },
  });
};


export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: ForgotPasswordRequest) => authService.forgotPassword(email),
  });
}
// Custom hook for getting user profile
// export const useProfile = () => {
//   return useQuery({
//     queryKey: authKeys.profile(),
//     queryFn: async () => {
//       const userData = await AsyncStorage.getItem('user_data');
//       const token = await AsyncStorage.getItem('auth_token');
      
//       if (userData && token) {
//         return JSON.parse(userData);
//       }
      
//       // If no local data, fetch from server
//       return authService.getProfile();
//     },
//     enabled: true, // Always enabled to check auth status
//   });
// };

// Custom hook to check authentication status
// export const useAuth = () => {
//   const { data: user, isLoading, error } = useProfile();
//   const loginMutation = useLogin();
//   const registerMutation = useRegister();
//   const logoutMutation = useLogout();
  
//   const isAuthenticated = !!user;
  
//   return {
//     // State
//     user,
//     isAuthenticated,
//     isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
//     error: error?.message || loginMutation.error?.message || registerMutation.error?.message,
    
//     // Actions
//     login: loginMutation.mutate,
//     register: registerMutation.mutate,
//     logout: logoutMutation.mutate,
    
//     // Individual mutation states
//     loginState: {
//       isLoading: loginMutation.isPending,
//       error: loginMutation.error?.message,
//       isSuccess: loginMutation.isSuccess,
//     },
//     registerState: {
//       isLoading: registerMutation.isPending,
//       error: registerMutation.error?.message,
//       isSuccess: registerMutation.isSuccess,
//     },
//     logoutState: {
//       isLoading: logoutMutation.isPending,
//       error: logoutMutation.error?.message,
//       isSuccess: logoutMutation.isSuccess,
//     },
//   };
// };

// export default useAuth;
