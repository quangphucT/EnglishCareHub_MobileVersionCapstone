import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './auth.service';
import { decodeJWT } from '../utils/jwtDecoder';
import { useAuthStore } from '../store/authStore';

// Token refresher interval ID
let tokenRefresherIntervalId: NodeJS.Timeout | null = null;

// Token refresher interval time (45 seconds)
const TOKEN_REFRESH_INTERVAL = 45 * 1000;

/**
 * Interface for reviewer ban check result
 */
interface ReviewerBanCheckResult {
  isBanned: boolean;
  isReviewerActive: boolean;
  reviewerStatus: string | null;
}

/**
 * Check if reviewer is banned from decoded token
 * Token format:
 * {
 *   "sub": "...",
 *   "FullName": "...",
 *   "IsReviewerActive": true/false (boolean),
 *   "ReviewerStatus": "Active" | "Banned" (string),
 *   ...
 * }
 */
const checkReviewerBanStatus = (accessToken: string): ReviewerBanCheckResult => {
  const decoded = decodeJWT(accessToken);
  
  if (!decoded) {
    return {
      isBanned: false,
      isReviewerActive: true,
      reviewerStatus: null,
    };
  }

  // IsReviewerActive is boolean in token
  const isReviewerActive = decoded['IsReviewerActive'] === true;
  // ReviewerStatus is string: "Active" or "Banned"
  const reviewerStatus = decoded['ReviewerStatus'] as string | null;

  // Reviewer is banned when IsReviewerActive = false AND ReviewerStatus = "Banned"
  const isBanned = isReviewerActive === false && reviewerStatus === 'Banned';

  return {
    isBanned,
    isReviewerActive,
    reviewerStatus,
  };
};

/**
 * Token refresher function that checks reviewer ban status every 45 seconds
 * If reviewer is banned (IsReviewerActive = false && ReviewerStatus = 'Banned'), 
 * it will trigger logout
 */
export const startTokenRefresher = (onBanned?: () => void): void => {
  // Clear existing interval if any
  if (tokenRefresherIntervalId) {
    clearInterval(tokenRefresherIntervalId);
  }

  console.log('🔄 Token refresher started - checking every 45 seconds');

  tokenRefresherIntervalId = setInterval(async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      
      if (!refreshToken) {
        console.log('⚠️ No refresh token found, stopping token refresher');
        stopTokenRefresher();
        return;
      }

      // Refresh token to get new access token
      const data = await authService.refreshToken({ refreshToken });
      
      if (!data?.accessToken) {
        console.log('⚠️ Failed to get new access token');
        return;
      }

      // Update tokens in storage
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      await AsyncStorage.setItem('accessToken', data.accessToken);

      // Check reviewer ban status from new token
      const banStatus = checkReviewerBanStatus(data.accessToken);

      console.log('🔍 Reviewer status check:', {
        isReviewerActive: banStatus.isReviewerActive,
        reviewerStatus: banStatus.reviewerStatus,
        isBanned: banStatus.isBanned,
      });

      if (banStatus.isBanned) {
        console.log('🚫 Reviewer is BANNED! Triggering logout...');
        
        // Stop the refresher
        stopTokenRefresher();

        // Clear all tokens and logout
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user_data');
        
        // Update auth store
        useAuthStore.getState().logout();

        // Call callback if provided
        if (onBanned) {
          onBanned();
        }
      }
    } catch (error) {
      console.error('❌ Token refresher error:', error);
    }
  }, TOKEN_REFRESH_INTERVAL);
};

/**
 * Stop the token refresher
 */
export const stopTokenRefresher = (): void => {
  if (tokenRefresherIntervalId) {
    clearInterval(tokenRefresherIntervalId);
    tokenRefresherIntervalId = null;
    console.log('🛑 Token refresher stopped');
  }
};

/**
 * Check reviewer ban status immediately (without waiting for interval)
 * Returns true if reviewer is banned
 */
export const checkReviewerBanImmediately = async (): Promise<ReviewerBanCheckResult> => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    
    if (!refreshToken) {
      return {
        isBanned: false,
        isReviewerActive: true,
        reviewerStatus: null,
      };
    }

    // Refresh token to get new access token
    const data = await authService.refreshToken({ refreshToken });
    
    if (!data?.accessToken) {
      return {
        isBanned: false,
        isReviewerActive: true,
        reviewerStatus: null,
      };
    }

    // Update tokens in storage
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);
    await AsyncStorage.setItem('accessToken', data.accessToken);

    return checkReviewerBanStatus(data.accessToken);
  } catch (error) {
    console.error('❌ Check reviewer ban immediately error:', error);
    return {
      isBanned: false,
      isReviewerActive: true,
      reviewerStatus: null,
    };
  }
};

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu 401 và chưa retry thì refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) return Promise.reject(error);

      try {
        // 🔁 GỌI SERVICE REFRESH TOKEN
        const data = await authService.refreshToken({ refreshToken });

        // Cập nhật lại token trong SecureStore và AsyncStorage
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        await AsyncStorage.setItem('accessToken', data.accessToken);

        // Retry lại request cũ
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        console.log('Refresh token failed:', refreshErr);
        // TODO: logout user nếu cần
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
