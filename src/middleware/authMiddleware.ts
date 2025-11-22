import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/authStore";
import { LoginRequest, LoginResponse, User } from "../types/auth";

export interface AuthState {
  isAuthenticated: boolean;
  userRole: "LEARNER" | "REVIEWER" | null;
  isLoading: boolean;
  user: User | null;
}

export class AuthMiddleware {
  private static instance: AuthMiddleware;

  static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  /**
   * Initialize authentication state from storage
   */
  async initializeAuth(): Promise<AuthState> {
    try {
      const [refreshToken, userData] = await Promise.all([
        SecureStore.getItemAsync("refresh_token"),
        AsyncStorage.getItem("user_data"),
      ]);

      if (refreshToken) {
        
        const user = userData ? JSON.parse(userData) : null;

        const { setUser } = useAuthStore.getState();
        if (user) setUser(user);

        const hasValidSession = !!refreshToken;

        const authState = {
          isAuthenticated: !!hasValidSession,
          userRole: user?.role || null,
          isLoading: false,
          user,
        };
        return authState;
      }

      const authState = {
        isAuthenticated: false,
        userRole: null,
        isLoading: false,
        user: null,
      };

      return authState;
    } catch (error) {
      return {
        isAuthenticated: false,
        userRole: null,
        isLoading: false,
        user: null,
      };
    }
  } /**
   * Get initial route based on auth state
   */
  getInitialRoute(authState: AuthState): string {
    if (!authState.isAuthenticated) {
      return "Login";
    }

    switch (authState.userRole) {
      case "REVIEWER":
        return "ReviewerMainApp";
      case "LEARNER":
        const learnerRoute = this.getLearnerInitialRoute(authState.user);
        return learnerRoute;
      default:
        return "Login";
    }
  }

  /**
   * Determine learner's initial route based on progress
   */
  private getLearnerInitialRoute(user: User | null): string {
   

    // Skip SetGoal, go directly to PlacementTest if not done
    if (!user?.isPlacementTestDone) {
      return "PlacementTest";
    }
    return "MainApp";
  }

  /**
   * Handle Google login success - save tokens and user data from Google OAuth
   */
  async handleGoogleLoginSuccess(
    googleLoginResponse: LoginResponse
  ): Promise<void> {
    try {
      const userData = {
        accessToken: googleLoginResponse.accessToken,
        refreshToken: googleLoginResponse.refreshToken,
        email: '', 
        message: googleLoginResponse.message,
        role: googleLoginResponse.role as "LEARNER" | "REVIEWER",
        isGoalSet: googleLoginResponse.isGoalSet || false,
        isPlacementTestDone: googleLoginResponse.isPlacementTestDone || false,
      };
      const { setAccessToken, setRefreshToken, setUser } =
        useAuthStore.getState();
      setAccessToken(googleLoginResponse.accessToken);
      setRefreshToken(googleLoginResponse.refreshToken);
      setUser(userData);
      
      // Store tokens and user data persistently
      await Promise.all([
        SecureStore.setItemAsync("access_token", googleLoginResponse.accessToken),
        SecureStore.setItemAsync("refresh_token", googleLoginResponse.refreshToken),
        AsyncStorage.setItem("user_data", JSON.stringify(userData)),
      ]);
    } catch (error) {
      throw error;
    }
  }
  async handleLoginSuccess(
    loginResponse: LoginResponse,
    credentials: LoginRequest
  ): Promise<void> {


    try {
      const userData = {
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        email: credentials.email,
        message: loginResponse.message,
        role: loginResponse.role as "LEARNER" | "REVIEWER",
        isGoalSet: loginResponse.isGoalSet || false,
        isPlacementTestDone: loginResponse.isPlacementTestDone || false,
      };

      const { setAccessToken, setRefreshToken, setUser } =
        useAuthStore.getState();
      setAccessToken(loginResponse.accessToken);
      setRefreshToken(loginResponse.refreshToken);
      setUser(userData);
      await Promise.all([
        SecureStore.setItemAsync("access_token", loginResponse.accessToken),
        SecureStore.setItemAsync("refresh_token", loginResponse.refreshToken),
        AsyncStorage.setItem("user_data", JSON.stringify(userData)),
      ]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle logout - clear all data
   */
  async handleLogout(): Promise<void> {
    try {
      // Clear ALL stored data
      await Promise.all([
        // SecureStore
        SecureStore.deleteItemAsync("refresh_token"),
        SecureStore.deleteItemAsync("access_token"),
        // AsyncStorage
        AsyncStorage.removeItem("user_data"),
        AsyncStorage.removeItem("token_timestamp"),
        AsyncStorage.removeItem("auth_token"), // Legacy, if exists
      ]);

      const { logout } = useAuthStore.getState();
      logout();
    } catch (error) {
      const { logout } = useAuthStore.getState();
      logout();
    }
  }
  decodeAccessToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Failed to decode access token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired (if you have JWT)
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Validate current authentication state
   */
  async validateAuthState(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return false;

      // Add token validation logic here
      // For now, just check if token exists
      return !this.isTokenExpired(token);
    } catch {
      return false;
    }
  }
}

export default AuthMiddleware.getInstance();
