import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';



interface AuthState {
  // State
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUserData: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  
  // Async actions
  saveTokenToStorage: (token: string) => Promise<void>;
  loadTokenFromStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
}




export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setAccessToken: (token: string) => {
    set({ 
      accessToken: token, 
      isAuthenticated: !!token 
    });
  },

  setRefreshToken: (token: string) => {
    set({ refreshToken: token });
  },

  // Set user data
  setUser: (user: User) => {
    set({ user });
  },

  // Set both tokens at once
  setTokens: (accessToken: string, refreshToken: string) => {
    set({ 
      accessToken, 
      refreshToken, 
      isAuthenticated: !!accessToken 
    });
  },

  // Set complete user data with tokens
  setUserData: (user: User, accessToken: string, refreshToken: string) => {
    set({ 
      user, 
      accessToken, 
      refreshToken, 
      isAuthenticated: true 
    });
  },

  // Logout and clear state
  logout: () => {
    set({ 
      accessToken: null, 
      refreshToken: null, 
      user: null, 
      isAuthenticated: false 
    });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // NOTE: accessToken is only stored in Zustand (memory) for security
  // refreshToken is stored in SecureStore by middleware
  // This method is deprecated in favor of middleware pattern
  saveTokenToStorage: async (accessToken: string) => {
    console.warn('saveTokenToStorage is deprecated. Use middleware.handleLoginSuccess instead.');
    // Only set in memory, don't persist accessToken
    get().setAccessToken(accessToken);
  },

  // Load token from storage - NOTE: This is deprecated, use middleware.initializeAuth instead
  loadTokenFromStorage: async () => {
    console.warn('loadTokenFromStorage is deprecated. Use middleware.initializeAuth instead.');
    try {
      set({ isLoading: true });
      // Read from correct storage locations per our architecture
      const refreshToken = await AsyncStorage.getItem('refresh_token'); // Should be SecureStore
      const userData = await AsyncStorage.getItem('user_data');

      if (refreshToken) {
        const user = userData ? JSON.parse(userData) : null;
        set({ 
          refreshToken, 
          user, 
          isAuthenticated: true,
          isLoading: false
          // Note: accessToken should be obtained via refresh token
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading token from storage:', error);
      set({ isLoading: false });
    }
  },

  // Clear all data from storage - NOTE: This is deprecated, use middleware.handleLogout instead
  clearStorage: async () => {
    console.warn('clearStorage is deprecated. Use middleware.handleLogout instead.');
    try {
      // Clear AsyncStorage (only user_data should be here per our architecture)
      await AsyncStorage.removeItem('user_data');
      // Note: refresh_token should be cleared from SecureStore by middleware
      get().logout();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
}));

export default useAuthStore;
