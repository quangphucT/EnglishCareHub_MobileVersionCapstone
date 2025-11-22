import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './auth.service';


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
