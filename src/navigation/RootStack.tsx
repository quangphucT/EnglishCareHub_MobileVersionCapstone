import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import VerifyOTPScreen from "../screens/Auth/VerifyOTPScreen";
import PlacementTestScreen from "../screens/Entrance_Test/PlacementTestScreen";
import MainTabs from "./MainTabs";
import ReviewerTabs from "./ReviewerTabs";
import LearningPathScreen from "../screens/LearningPath/LearningPathScreen";
import ExerciseScreen from "../screens/Exercise/ExerciseScreen";
import FeedbackScreen from "../screens/Chat/FeedbackScreen";

import "../global.css";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/Auth/ResetPasswordScreen";
import UploadingCertificate from "../screens/Reviewer/UploadingCertificate";
import ReviewerWaiting from "../screens/Reviewer/ReviewerWaiting";
import ReviewerReviewScreen from "../screens/Reviewer/ReviewerReview";
import ReviewerWalletScreen from "../screens/Reviewer/ReviewerWallet";
import CompletedReviewsScreen from "../screens/Reviewer/CompletedReviewsScreen";
import ReviewerProfileScreen from "../screens/Reviewer/ReviewerProfile";
import AudioReviewScreen from "../screens/Profile/AudioReviewScreen";
import MyRecordingsScreen from "../screens/Profile/MyRecordingsScreen";
import LearnerRecordFolderPage from "../screens/Learner_Record/LearnerRecordFolderPage";
import LearnerRecordPage from "../screens/Learner_Record/LeanerRecordPage";
import LearnerRecordQuestion from "../screens/Learner_Record/LearnerRecordQuestion";
const Stack = createNativeStackNavigator();

interface RootStackProps {
  initialRouteName: string;
}

export default function RootStack({ initialRouteName }: RootStackProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: "transparent" },
        headerShown: false,
      }}
      initialRouteName={initialRouteName}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
       <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="VerifyOTPScreen"
        component={VerifyOTPScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="Home"
        component={MainTabs}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="PlacementTest"
        component={PlacementTestScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="UploadingCertificate"
        component={UploadingCertificate}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="MainApp"
        component={MainTabs}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="LearningPath"
        component={LearningPathScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="Exercise"
        component={ExerciseScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="ReviewerMainApp"
        component={ReviewerTabs}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="ReviewerWaiting"
        component={ReviewerWaiting}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="ReviewerReview"
        component={ReviewerReviewScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="ReviewerWallet"
        component={ReviewerWalletScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="ReviewerProfile"
        component={ReviewerProfileScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="CompletedReviews"
        component={CompletedReviewsScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="AudioReview"
        component={AudioReviewScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="MyRecordings"
        component={MyRecordingsScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="LearnerRecordFolderPage"
        component={LearnerRecordFolderPage}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="LearnerRecordPage"
        component={LearnerRecordPage}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="LearnerRecordQuestion"
        component={LearnerRecordQuestion}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack.Navigator>
  );
}
