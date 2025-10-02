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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleRegister = () => {
    // Handle register logic here
    console.log("Register with:", { fullName, phoneNumber, email, password });
  };

  const handleGoogleSignIn = () => {
    // Handle Google sign in
    console.log("Google Sign In");
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
                height: 120,
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
              <Text className="text-5xl font-bold text-gray-800 mb-3">
                Create Account
              </Text>
              <Text className="text-[18px] text-gray-800">
                Sign up to get started
              </Text>
            </View>

            {/* Form Container */}
            <View className="space-y-4">
              {/* Full Name Input */}
              <View className="bg-gray-50 rounded-3xl px-6 py-4 flex-row items-center shadow-sm">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
                  placeholder="Full Name"
                  placeholderTextColor="#D1D5DB"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              {/* Phone Number Input */}
              <View className="bg-gray-50 rounded-3xl px-6 py-4 flex-row items-center shadow-sm mt-6">
                <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
                  placeholder="Phone Number"
                  placeholderTextColor="#D1D5DB"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>

              {/* Email Input */}
              <View className="bg-gray-50 rounded-3xl px-6 py-4 flex-row items-center shadow-sm mt-6">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
                  placeholder="Email"
                  placeholderTextColor="#D1D5DB"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View className="bg-gray-50 rounded-3xl px-6 py-4 flex-row items-center shadow-sm mt-6">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
                  placeholder="Password"
                  placeholderTextColor="#D1D5DB"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleRegister}
                activeOpacity={0.8}
                className="mt-8 flex-row items-center justify-center"
              >
                <Text className="text-gray-800 text-xl font-bold mr-4">
                  Sign up
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

              {/* Divider */}
              <View className="flex-row items-center mt-8">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-400 text-sm">Or sign up with</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Google Sign In Button */}
              <View className="items-center mt-6">
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.8}
                  className="bg-white border-2 border-gray-200 rounded-full p-4 shadow-sm"
                  style={{ width: 64, height: 64, justifyContent: "center", alignItems: "center" }}
                >
                  <Image
                    source={require("../../assets/images/googleIcon.png")}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Link */}
              <View className="flex-row justify-center mt-6 mb-8">
                <Text className="text-gray-600 text-sm">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text className="text-gray-800 text-sm font-semibold underline">
                    Sign in
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
