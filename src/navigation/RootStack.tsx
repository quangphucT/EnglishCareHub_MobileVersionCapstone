import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import VerifyOTPScreen from "../screens/Auth/VerifyOTPScreen";
import HomeScreen from "../screens/Home/HomeScreen";

import '../global.css'
const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator 
      screenOptions={{
        contentStyle: { backgroundColor: 'transparent' },
        headerShown: false // Tắt header để tránh SafeAreaView internal
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
       <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ 
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="VerifyOTPScreen" 
        component={VerifyOTPScreen}
        options={{ 
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
    </Stack.Navigator>
  );
}
