import { useMutation} from '@tanstack/react-query';
import { Alert } from 'react-native';
import authService from '../api/auth.service';
import { RegisterRequest } from '../types/auth';



// export interface LoginRequest {
//   phoneNumber: string;
//   password: string;
// }

// Query Keys
// export const authKeys = {
//   all: ['auth'] as const,
//   profile: () => [...authKeys.all, 'profile'] as const,
// };

// Custom hook for register
export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (data) => {
      Alert.alert(
        'Thành công',
        'Đăng ký thành công! Vui lòng đăng nhập.',
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Đăng ký thất bại';
      Alert.alert('Lỗi', errorMessage);
    },
  });
};

// Custom hook for login
// export const useLogin = () => {
//   const queryClient = useQueryClient();
  
//   return useMutation({
//     mutationFn: (credentials: LoginRequest) => authService.login(credentials),
//     onSuccess: async (data) => {
//       // Save token to AsyncStorage
//       await AsyncStorage.setItem('auth_token', data.accessToken);
//       await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      
//       // Invalidate and refetch user profile
//       queryClient.setQueryData(authKeys.profile(), data.user);
      
//       Alert.alert('Thành công', 'Đăng nhập thành công!');
//     },
//     onError: (error: any) => {
//       const errorMessage = error.message || 'Đăng nhập thất bại';
//       Alert.alert('Lỗi', errorMessage);
//     },
//   });
// };

// Custom hook for logout
// export const useLogout = () => {
//   const queryClient = useQueryClient();
  
//   return useMutation({
//     mutationFn: () => authService.logout(),
//     onSuccess: async () => {
//       // Clear AsyncStorage
//       await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      
//       // Clear all queries
//       queryClient.clear();
      
//       Alert.alert('Thành công', 'Đăng xuất thành công!');
//     },
//     onError: async (error: any) => {
//       // Still logout locally even if server request fails
//       await AsyncStorage.multiRemove(['auth_token', 'user_data']);
//       queryClient.clear();
      
//       console.warn('Logout request failed, but continuing with local logout');
//     },
//   });
// };

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
