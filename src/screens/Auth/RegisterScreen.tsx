import React, { useState, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRegister } from "../../hooks/useAuth";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"LEARNER" | "REVIEWER">("LEARNER");
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const registerMutation = useRegister();

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Email không hợp lệ");
    } else {
      setEmailError("");
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) {
      setPhoneError("");
      return;
    }
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(phone.trim())) {
      setPhoneError("Số điện thoại không hợp lệ");
    } else {
      setPhoneError("");
    }
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("");
      return;
    }
    
    if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    
    setPasswordError("");
  };

  const handleRegister = async () => {
    registerMutation.mutate(
      {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      },
      {
        onSuccess: (data) => {
          Alert.alert(
            data.message || 'Registration successful!',
          );

          const userEmail = data.email;
          (navigation as any).navigate("VerifyOTPScreen", { email: userEmail });
        },
        onError: (error: any) => {
          const errorMessage = error.message || 'Registration failed. Please try again.';
          Alert.alert('Error', errorMessage);
        }
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fff]" >
      <View className="flex-1 bg-[#fff]">
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1,paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Top illustration area */}
        <View
          className="h-[230px] justify-center items-center px-6"
          style={{ backgroundColor: '#fff', paddingTop: 50 }}
        >
          <View className="items-center">
            <Text className="text-4xl font-bold text-purple-600 mb-2">EnglishCareHub</Text>
            <Text className="text-gray-600">Đăng ký tài khoản mới</Text>
          </View>
        </View>

        {/* Register Form */}
        <View 
          className="flex-1 bg-[#fff]"
          
        >
          <View className="px-6 pt-8">
           
      

            {/* Header */}
            <View className="mb-6">
              <Text className="text-gray-900 text-[15px] mb-1">
                Xin chào!
              </Text>
              <Text className="text-4xl font-extrabold text-gray-800">
                Đăng ký
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View className="space-y-4 pl-5 pr-5 pt-4">
            {/* Full Name Input */}
            <View className="mb-4">
              <Text className="text-gray-600 text-[16px] mb-2">Họ và tên</Text>
              <View className="border-2 border-gray-800 rounded-xl px-4 py-4">
                <TextInput
                  className="text-gray-700 text-[18px]"
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                
                />
              </View>
            </View>

            {/* Phone Number Input */}
            <View className="mb-4">
              <Text className="text-gray-600 text-[16px] mb-2">Số điện thoại</Text>
              <View 
                className={`border-2 rounded-xl px-4 py-4 ${
                  phoneError ? "border-red-400" : "border-gray-800"
                }`}
              >
                <TextInput
                  className="text-gray-700 text-[18px]"
                  placeholder="0912345678"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    validatePhone(text);
                  }}
                  keyboardType="phone-pad"
                />
              </View>
              <ErrorMessage error={phoneError} type="error" />
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-600 text-[16px] mb-2">Email</Text>
              <View 
                className={`border-2 rounded-xl px-4 py-4 ${
                  emailError ? "border-red-400" : "border-gray-800"
                }`}
              >
                <TextInput
                  className="text-gray-700 text-[18px]"
                  placeholder="example@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    validateEmail(text);
                  }}
                   onFocus={() => {
                      setTimeout(() => {
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({
                            y: 200,
                            animated: true,
                          });
                        }
                      }, 150);
                    }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <ErrorMessage error={emailError} type="error" />
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-gray-600 text-[16px] mb-2">Mật khẩu</Text>
              <View 
                className={`border-2 rounded-xl px-4 py-4 flex-row items-center ${
                  passwordError ? "border-red-400" : "border-gray-800"
                }`}
              >
                <TextInput
                  className="flex-1 text-gray-700 text-[18px]"
                  placeholder="•••••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    validatePassword(text);
                  }}
                    onFocus={() => {
                      setTimeout(() => {
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({
                            y: 300,
                            animated: true,
                          });
                        }
                      }, 250);
                    }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <ErrorMessage error={passwordError} type="error" />
            </View>

            {/* Role Selection */}
            <View className="mb-6">
              <Text className="text-gray-600 text-[16px] mb-3">Chọn vai trò của bạn</Text>
              <View className="flex-row gap-3">
                {/* Learner Role */}
                <TouchableOpacity
                  onPress={() => setRole("LEARNER")}
                  className={`flex-1 rounded-xl p-4 border-2 ${
                    role === "LEARNER"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-400 bg-gray-50"
                  }`}
                >
                  <View className="items-center">
                    <Ionicons
                      name="school-outline"
                      size={24}
                      color={role === "LEARNER" ? "#8B5CF6" : "#9CA3AF"}
                    />
                    <Text
                      className={`font-semibold text-center mt-2 ${
                        role === "LEARNER" ? "text-purple-600" : "text-gray-600"
                      }`}
                    >
                      Học viên
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Reviewer Role */}
                <TouchableOpacity
                  onPress={() => setRole("REVIEWER")}
                  className={`flex-1 rounded-xl p-4 border-2 ${
                    role === "REVIEWER"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-400 bg-gray-50"
                  }`}
                >
                  <View className="items-center">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={24}
                      color={role === "REVIEWER" ? "#3B82F6" : "#9CA3AF"}
                    />
                    <Text
                      className={`font-semibold text-center mt-2 ${
                        role === "REVIEWER" ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      Người đánh giá
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={registerMutation.isPending}
              className={`rounded-[15px] py-6 items-center mb-2`}
              style={{ backgroundColor: registerMutation.isPending ? '#3a3a5a' : "#1a1a2e" }}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator size="small" color="#FACC15" />
              ) : (
                <Text className="text-yellow-400 text-[20px] font-semibold">Đăng ký</Text>
              )}
            </TouchableOpacity>

          
            {/* Login Link */}
            <View className="flex-row justify-center mb-8">
              <Text className="text-gray-600 text-[18px]">
                Bạn đã có tài khoản?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text className="text-red-500 text-[18px] font-semibold">
                  Đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}