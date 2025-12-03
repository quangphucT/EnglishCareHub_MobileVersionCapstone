import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { LoginRequest, LoginResponse, User } from "../types/auth";
import { decodeJWT } from "../utils/jwtDecoder";
import { authService } from "../api/auth.service";

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

  async initializeAuth(): Promise<AuthState> {
    try {
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      if (!refreshToken) {
        return {
          isAuthenticated: false,
          userRole: null,
          isLoading: false,
          user: null,
        };
      }

      try {
        // Add timeout to refresh token call (10 seconds)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Token refresh timeout")), 10000)
        );

        const tokenResponse = await Promise.race([
          authService.refreshToken({ refreshToken }),
          timeoutPromise,
        ]);
        console.log("tokenResponse", tokenResponse);
        console.log("CheckaccessToken", tokenResponse.accessToken);
        // Lưu accessToken mới
        await SecureStore.setItemAsync(
          "access_token",
          tokenResponse.accessToken
        );
        // Decode JWT để lấy thông tin user
        const decodedToken = decodeJWT(tokenResponse.accessToken);
   
        if (!decodedToken) {
          await this.handleLogout();
          return {
            isAuthenticated: false,
            userRole: null,
            isLoading: false,
            user: null,
          };
        }
        const user: User = {
          role: decodedToken.role || "",
          isPlacementTestDone: decodedToken.isPlacementTestDone || false,
          IsReviewerActive: decodedToken.IsReviewerActive || false,
          isGoalSet: decodedToken.isGoalSet || false,
          accessToken: tokenResponse.accessToken,
          reviewerStatus: decodedToken.ReviewerStatus || "",
        };
        const authState: AuthState = {
          isAuthenticated: true,
          userRole: decodedToken.role as "LEARNER" | "REVIEWER" | null,
          isLoading: false,
          user: user,
        };
        return authState;
      } catch (refreshError) {
        await this.handleLogout();
        return {
          isAuthenticated: false,
          userRole: null,
          isLoading: false,
          user: null,
        };
      }
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
        const reviewerRoute = this.getReviewerInitialRoute(authState.user);
        return reviewerRoute;   
      case "LEARNER":
        const learnerRoute = this.getLearnerInitialRoute(authState.user);
        return learnerRoute;
      default:
        return "Login";
    }
  }

  private getReviewerInitialRoute(user: User | null): string {
    // Nếu IsReviewerActive = false -> Upload Certificate
    if (!user?.IsReviewerActive) {
      return "UploadingCertificate";
    }
    
    // Nếu IsReviewerActive = true -> Check reviewerStatus
    if (user.reviewerStatus === "Pending") {
      return "ReviewerWaiting";
    }
    
    // Nếu reviewerStatus = "Active" -> Main App
    if (user.reviewerStatus === "Active") {
      return "ReviewerMainApp";
    }
    
    // Default fallback
    return "UploadingCertificate";
  }
  private getLearnerInitialRoute(user: User | null): string {
    if (!user?.isPlacementTestDone) {
      return "PlacementTest";
    }
    return "MainApp";
  }

  async handleGoogleLoginSuccess(
    googleLoginResponse: LoginResponse
  ): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(
          "access_token",
          googleLoginResponse.accessToken
        ),
        SecureStore.setItemAsync(
          "refresh_token",
          googleLoginResponse.refreshToken
        ),
      ]);
    } catch (error) {
      console.error("Google login save error:", error);
      throw error;
    }
  }

  /**
   * Handle login success - only save tokens to SecureStore
   * User info will be decoded from JWT when needed
   */
  async handleLoginSuccess(
    loginResponse: LoginResponse,
    credentials: LoginRequest
  ): Promise<void> {
    try {
      // Chỉ lưu tokens vào SecureStore
      await Promise.all([
        SecureStore.setItemAsync("access_token", loginResponse.accessToken),
        SecureStore.setItemAsync("refresh_token", loginResponse.refreshToken),
      ]);
    } catch (error) {
      console.error("Login save error:", error);
      throw error;
    }
  }

  /**
   * Handle logout - clear tokens from SecureStore only
   */
  async handleLogout(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync("access_token"),
        SecureStore.deleteItemAsync("refresh_token"),
      ]);
    } catch (error) {
      console.error("Logout error:", error);
      // Still continue logout even if delete fails
    }
  }
  decodeAccessToken(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("❌ Failed to decode access token:", error);
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
