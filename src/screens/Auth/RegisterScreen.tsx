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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegister } from "../../hooks/useAuth";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'LEARNER' | 'REVIEWER'>('LEARNER');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  
  // React Query
  const registerMutation = useRegister();

  const handleRegister = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }

    // Call register mutation
    registerMutation.mutate({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      password,
      role
    }, {
      onSuccess: (data) => {
        // Show success alert
        Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng xác thực số điện thoại.', [{ text: 'OK' }]);
        const userEmail = data.email;
        (navigation as any).navigate('VerifyOTPScreen', { email: userEmail });
      }
    });
  };

  const handleGoogleSignIn = () => {
    // Handle Google sign in
    console.log("Google Sign In");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Gradient Header with Wave */}
     <View className="absolute top-0 left-0 right-0" style={{ height: 180 }}>
            <LinearGradient
             colors={["#F57C3A", "#F24B84", "#A450DA"]}

              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 140,
              }}
            >
              <Svg
                height="100"
                width={width}
                style={{ position: "absolute", bottom: -2 }}
                viewBox={`0 0 ${width} 100`}
              >
                <Path
                  d={`M0,0 C${width * 0.05},99 ${width * 0.35},50 ${width * 0.5},99 C${width * 0.65},-10 ${width * 0.85},30 ${width},10 L${width},100 L0,100 Z`}
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
                  className="flex-1 ml-3 text-gray-700 text-[17px] h-10"
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
                  className="flex-1 ml-3 text-gray-700 text-[17px] h-10"
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
                  className="flex-1 ml-3 text-gray-700 text-[17px] h-10"
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
                  className="flex-1 ml-3 text-gray-700 text-[17px] h-10"
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

              {/* Role Selection */}
              <View className="mt-6">
                <Text className="text-gray-700 font-semibold text-[17px] mb-3 ml-2">
                  Choose your role
                </Text>
                <View className="flex-row space-x-4 gap-2">
                  {/* Learner Role */}
                  <TouchableOpacity
                    onPress={() => setRole('LEARNER')}
                    activeOpacity={0.8}
                    className={`flex-1 rounded-2xl p-4 border-2 ${
                      role === 'LEARNER' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <View className="items-center">
                      <View className={`rounded-full p-3 mb-2 ${
                        role === 'LEARNER' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <Ionicons 
                          name="school-outline" 
                          size={24} 
                          color={role === 'LEARNER' ? '#8B5CF6' : '#9CA3AF'} 
                        />
                      </View>
                      <Text className={`font-semibold text-center ${
                        role === 'LEARNER' ? 'text-purple-600' : 'text-gray-600'
                      }`}>
                        Learner
                      </Text>
                      <Text className={`text-xs text-center mt-1 ${
                        role === 'LEARNER' ? 'text-purple-500' : 'text-gray-500'
                      }`}>
                        I want to learn English
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Reviewer Role */}
                  <TouchableOpacity
                    onPress={() => setRole('REVIEWER')}
                    activeOpacity={0.8}
                    className={`flex-1 rounded-2xl p-4 border-2 ${
                      role === 'REVIEWER' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <View className="items-center">
                      <View className={`rounded-full p-3 mb-2 ${
                        role === 'REVIEWER' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Ionicons 
                          name="checkmark-circle-outline" 
                          size={24} 
                          color={role === 'REVIEWER' ? '#3B82F6' : '#9CA3AF'} 
                        />
                      </View>
                      <Text className={`font-semibold text-center ${
                        role === 'REVIEWER' ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        Reviewer
                      </Text>
                      <Text className={`text-xs text-center mt-1 ${
                        role === 'REVIEWER' ? 'text-blue-500' : 'text-gray-500'
                      }`}>
                        I want to help others
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {registerMutation.error && (
                <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
                  <Text className="text-red-600 text-center">{registerMutation.error.message}</Text>
                </View>
              )}

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={registerMutation.isPending}
                className={`mt-8 flex-row items-center justify-center ${
                  registerMutation.isPending ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-gray-800 text-xl font-bold mr-4">
                  {registerMutation.isPending ? 'Đang đăng ký...' : 'Sign up'}
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
                  {registerMutation.isPending ? (
                    <Ionicons name="hourglass" size={24} color="white" />
                  ) : (
                    <Ionicons name="arrow-forward" size={24} color="white" />
                  )}
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
    </SafeAreaView>
  );
}
