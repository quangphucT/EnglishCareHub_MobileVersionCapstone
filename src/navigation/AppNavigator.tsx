import React, { useEffect, useState, createContext, useContext, useRef } from "react";
import {
  NavigationContainer,
  LinkingOptions,
  ParamListBase,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { View, Text, ActivityIndicator } from "react-native";
import authMiddleware, { AuthState } from "../middleware/authMiddleware";
// import { useLearnerStore } from "../store/learnerStore";
import RootStack from "./RootStack";

const AuthContext = createContext<{
  refreshAuth: () => Promise<void>;
} | null>(null);

export const useAuthRefresh = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      refreshAuth: async () => {
        console.warn('Auth context not yet available, will refresh on next mount');
      }
    };
  }
  return context;
};

export default function AppNavigator() {
  const navigationRef = useNavigationContainerRef<ParamListBase>();
  const pendingRouteRef = useRef<string | null>(null);
  // const loadLearnerDataFromStorage = useLearnerStore((state) => state.loadLearnerDataFromStorage);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userRole: null,
    isLoading: true,
    user: null
  });
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // // Load data từ Async storage
      // await loadLearnerDataFromStorage();
      
      const initialAuthState = await authMiddleware.initializeAuth();
      setAuthState(initialAuthState);
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        userRole: null,
        isLoading: false,
        user: null
      });
      
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  };
  
  const navigateToRoute = (routeName: string) => {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: routeName }],
      });
      console.log("✅ [RefreshAuth] Navigation completed");
    } else {
      console.log(
        "⏳ [RefreshAuth] Navigation not ready, queueing route:",
        routeName
      );
      pendingRouteRef.current = routeName;
    }
  };

  const refreshAuth = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const newAuthState = await authMiddleware.initializeAuth();
      // Set state trước
      setAuthState(newAuthState);
      
      // Đợi lâu hơn để đảm bảo state đã update (300ms thay vì 100ms)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Sau đó mới navigate dựa trên newAuthState (không phải state cũ)
      const newRoute = authMiddleware.getInitialRoute(newAuthState);
      console.log('➡️ [RefreshAuth] Navigating to:', newRoute);
      navigateToRoute(newRoute);
    } catch (error) {
      console.error('❌ [RefreshAuth] Error:', error);
      setAuthState({
        isAuthenticated: false,
        userRole: null,
        isLoading: false,
        user: null
      });
    }
  };

  // Loading splash screen
  if (authState.isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  const initialRouteName = authMiddleware.getInitialRoute(authState);

  const linking: LinkingOptions<ParamListBase> = {
    prefixes: ["englishcarehub://"],
    config: {
      screens: {
        ResetPassword: "reset-password",
        ForgotPassword: "forgot-password",
      },
    },
  };

  const handleNavigationReady = () => {
    if (pendingRouteRef.current) {
      const queuedRoute = pendingRouteRef.current;
      pendingRouteRef.current = null;
      navigateToRoute(queuedRoute);
    }
  };

  return (
    <AuthContext.Provider value={{ refreshAuth }}>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={handleNavigationReady}
      >
        <RootStack 
          initialRouteName={initialRouteName}
        />
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
