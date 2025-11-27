import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import VerifyOTPScreen from "../screens/Auth/VerifyOTPScreen";
import PlacementTestScreen from "../screens/Entrance_Test/PlacementTestScreen";
import ReviewerMainScreen from "../screens/Reviewer/ReviewerMainScreen";
import MainTabs from "./MainTabs";
import LearningPathScreen from "../screens/LearningPath/LearningPathScreen";
import ExerciseScreen from "../screens/Exercise/ExerciseScreen";

import "../global.css";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/Auth/ResetPasswordScreen";

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
        component={ReviewerMainScreen}
        options={{
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack.Navigator>
  );
}
