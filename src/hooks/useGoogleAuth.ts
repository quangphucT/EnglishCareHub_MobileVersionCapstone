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
export type LoginRole = 'learner' | 'reviewer';


// Cấu hình Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  scopes: ["profile", "email"],
});


export const useGoogleAuth = () => {

  const authRefresh = useAuthRefresh();

  const mutation = useMutation({
    mutationFn: async (role: LoginRole = 'learner') => {
      try {
        await GoogleSignin.signOut();
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        const signInResult = await GoogleSignin.signIn();
        if (!signInResult || !signInResult.data) {
          return null;
        }
        const { idToken } = await GoogleSignin.getTokens();
        if (!idToken) throw new Error("Không lấy được idToken từ Google Sign-In");
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        const userCredential = await auth().signInWithCredential(googleCredential);
        const firebaseIdToken = await userCredential.user.getIdToken();
        let loginResponse;
        if (role === 'reviewer') {
          loginResponse = await authService.googleLoginReviewer({
            idToken: firebaseIdToken,
          });
        } else {
          loginResponse = await authService.googleLogin({
            idToken: firebaseIdToken,
          });
        }
        await authMiddleware.handleGoogleLoginSuccess(loginResponse as any);

        // best-effort: sign in to firebase
        const cred = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(getAuth(), cred);
        return loginResponse;
      } catch (error: any) {
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
      if (data && authRefresh) {
        try {
          await authRefresh.refreshAuth();
        } catch (error) {
          console.log('Auth refresh error (will retry on next mount):', error);
        }
      }
    },
    onError: (error: any) => {
      const message =
        error?.message ?? "Google login failed. Please try again.";
      Alert.alert("Google login", message);
    },
  });

  return {
    signInWithGoogle: (role: LoginRole = 'learner') => mutation.mutateAsync(role),
    isLoading: mutation.isPending ?? false,
    error: mutation.error,
  };
};

export default useGoogleAuth;
