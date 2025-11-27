import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import authService from "../api/auth.service";
import authMiddleware from "../middleware/authMiddleware";
import { useAuthRefresh } from "../navigation/AppNavigator";
import auth from "@react-native-firebase/auth";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  scopes: ["profile", "email"],
});

export const useGoogleAuth = () => {
  const { refreshAuth } = useAuthRefresh();

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        await GoogleSignin.signOut();

        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });

        const signInResult = await GoogleSignin.signIn();
        
        // Nếu user không chọn tài khoản (bấm ra ngoài popup)
        if (!signInResult || !signInResult.data) {
          // Dừng lại, không làm gì cả
          return null;
        }

        // Chỉ tiếp tục nếu user đã chọn tài khoản
        // Lấy token
        const { idToken } = await GoogleSignin.getTokens();
        if (!idToken)
          throw new Error("Không lấy được idToken từ Google Sign-In");
        // Tạo credential Firebase từ Google token
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        // Đăng nhập Firebase
        const userCredential =
          await auth().signInWithCredential(googleCredential);
        // Lấy Firebase ID token
        const firebaseIdToken = await userCredential.user.getIdToken();
        // exchange idToken with backend to get app tokens & user
        const loginResponse = await authService.googleLogin({
          idToken: firebaseIdToken,
        });
        // persist tokens and user via middleware
        await authMiddleware.handleGoogleLoginSuccess(loginResponse as any);
        // best-effort: sign in to firebase
        const cred = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(getAuth(), cred);

        return loginResponse;
      } catch (error: any) {
        // Nếu user cancel (bấm ra ngoài popup), dừng lại không làm gì
        if (error?.code === '-5' || error?.code === '12501' || error?.code === statusCodes.SIGN_IN_CANCELLED) {
          return null;
        }
        
        const message =
          error?.response?.data?.message ??
          error?.message ??
          "Google login failed. Please try again.";
        throw new Error(message);
      }
    },
    onSuccess: async (data) => {
      // Chỉ refresh auth nếu thực sự đăng nhập thành công
      if (data) {
        await refreshAuth();
      }
    },
    onError: (error: any) => {
      const message =
        error?.message ?? "Google login failed. Please try again.";
      Alert.alert("Google login", message);
    },
  });

  return {
    signInWithGoogle: () => mutation.mutateAsync(),
    isLoading: mutation.isPending ?? false,
    error: mutation.error,
  };
};

export default useGoogleAuth;
