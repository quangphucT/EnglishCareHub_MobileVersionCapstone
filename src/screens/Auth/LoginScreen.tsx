import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleLogin = () => {
    // Handle login logic here
    console.log("Login with:", username, password);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Top Gradient Header with Wave */}
      <View className="absolute top-0 left-0 right-0" style={{ height: 180 }}>
        <LinearGradient
          colors={["#FF9A62", "#FF6B9D", "#C471ED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 240,
          }}
        >
          <Svg
            height="100"
            width={width}
            style={{ position: "absolute", bottom: -2 }}
            viewBox={`0 0 ${width} 100`}
          >
            <Path
              d={`M0,0 C${width * 0.15},99 ${width * 0.35},50 ${width * 0.5},90 C${width * 0.65},-10 ${width * 0.85},30 ${width},10 L${width},100 L0,100 Z`}
              fill="white"
            />
          </Svg>
        </LinearGradient>
      </View>



      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-8 pt-52">
            {/* Title */}
            <View className="items-center mb-12">
              <Text className="text-6xl font-bold text-gray-800 mb-3">
                Hello !
              </Text>
              <Text className="text-[17px] text-gray-700">
                Sign in to your account
              </Text>
            </View>

            {/* Form Container */}
            <View className="space-y-4">
              {/* Username Input */}
              <View className="bg-gray-50 rounded-3xl px-6 py-4 flex-row items-center shadow-sm">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
                  placeholder="Username"
                  placeholderTextColor="#D1D5DB"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View className="bg-gray-50 rounded-3xl px-6 py-4 flex-row items-center shadow-sm mt-4">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
                  placeholder="Password"
                  placeholderTextColor="#D1D5DB"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity className="items-end mt-3">
                <Text className="text-gray-400 text-sm">
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.8}
                className="mt-8 flex-row items-center justify-center"
              >
                <Text className="text-gray-800 text-xl font-bold mr-4">
                  Sign in
                </Text>
                <LinearGradient
                  colors={["#C471ED", "#F64F59"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="arrow-forward" size={24} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Create Account Link */}
              <View className="flex-row justify-center mt-8">
                <Text className="text-gray-600 text-sm">
                  Don't have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register" as never)}
                >
                  <Text className="text-gray-800 text-sm font-semibold underline">
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
