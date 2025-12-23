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
  ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRegister } from "../../hooks/useAuth";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';

const aespLogo: ImageSourcePropType = require("../../assets/images/imageLanding2.jpg");

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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 350 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Top illustration area */}
        <LinearGradient
          colors={['#7C3AED', '#8B5CF6', '#A78BFA']}
          className="h-[180px] justify-center items-center px-6"
          style={{ 
            paddingTop: 20,
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative circles */}
          <View 
            className="absolute bg-white/10 rounded-full"
            style={{ width: 150, height: 150, top: -50, right: -30 }}
          />
          <View 
            className="absolute bg-white/10 rounded-full"
            style={{ width: 100, height: 100, bottom: 20, left: -40 }}
          />
          
          <View className="items-center">
            <Image 
              source={aespLogo} 
              style={{
                width: 180,
                height: 180,
              }}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>

        {/* Register Form */}
        <View 
          className="flex-1 bg-white rounded-t-3xl -mt-6"
          
        >
          <View className="px-6 pt-8">

            {/* Header */}
            <View className="mb-6">
              <Text className="text-2xl font-bold text-gray-800 mb-1">
                Tạo tài khoản
              </Text>
              <Text className="text-gray-500 text-sm">
                Điền thông tin để đăng ký
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View className="space-y-4 pl-5 pr-5 pt-2">
               {/* Role Selection */}
            <View className="mb-5">
              <Text className="text-gray-600 text-sm mb-2 font-medium">Chọn vai trò của bạn</Text>
              <View className="flex-row rounded-xl p-1 border border-gray-200 bg-gray-50">
                {/* Learner Role */}
                <TouchableOpacity
                  onPress={() => setRole("LEARNER")}
                  className={`flex-1 rounded-lg py-3 ${role === "LEARNER" ? "bg-purple-500" : ""}`}
                >
                  <View className="items-center flex-row justify-center">
                    <Ionicons
                      name="school-outline"
                      size={18}
                      color={role === "LEARNER" ? "#FFFFFF" : "#9CA3AF"}
                    />
                    <Text
                      className={`ml-2 text-sm ${role === "LEARNER" ? "font-bold text-white" : "font-normal text-gray-500"}`}
                    >
                      Học viên
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Reviewer Role */}
                <TouchableOpacity
                  onPress={() => setRole("REVIEWER")}
                  className={`flex-1 rounded-lg py-3 ${role === "REVIEWER" ? "bg-purple-500" : ""}`}
                >
                  <View className="items-center flex-row justify-center">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={role === "REVIEWER" ? "#FFFFFF" : "#9CA3AF"}
                    />
                    <Text
                      className={`ml-2 text-sm ${role === "REVIEWER" ? "font-bold text-white" : "font-normal text-gray-500"}`}
                    >
                      Người đánh giá
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            {/* Full Name Input */}
            <View className="mb-3">
              <Text className="text-gray-600 text-sm mb-1.5 font-medium">Họ và tên</Text>
              <View className="flex-row items-center border-2 border-gray-200 rounded-xl px-4 py-3">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Phone Number Input */}
            <View className="mb-3">
              <Text className="text-gray-600 text-sm mb-1.5 font-medium">Số điện thoại</Text>
              <View 
                className={`flex-row items-center border-2 rounded-xl px-4 py-3 ${
                  phoneError ? "border-red-400" : "border-gray-200"
                }`}
              >
                <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
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
            <View className="mb-3">
              <Text className="text-gray-600 text-sm mb-1.5 font-medium">Email</Text>
              <View 
                className={`flex-row items-center border-2 rounded-xl px-4 py-3 ${
                  emailError ? "border-red-400" : "border-gray-200"
                }`}
              >
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
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
              <Text className="text-gray-600 text-sm mb-1.5 font-medium">Mật khẩu</Text>
              <View 
                className={`flex-row items-center border-2 rounded-xl px-4 py-3 ${
                  passwordError ? "border-red-400" : "border-gray-200"
                }`}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-700 text-base"
                  placeholder="••••••••"
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
                            y: 450,
                            animated: true,
                          });
                        }
                      }, 250);
                    }}
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
              <ErrorMessage error={passwordError} type="error" />
            </View>

         

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={registerMutation.isPending}
              className="rounded-xl py-4 items-center mb-4 bg-purple-500"
              style={{ opacity: registerMutation.isPending ? 0.8 : 1 }}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-lg font-bold" numberOfLines={1}>Đăng ký</Text>
              )}
            </TouchableOpacity>

          
            {/* Login Link */}
            <View className="flex-row justify-center mb-8">
              <Text className="text-gray-500 text-sm">
                Bạn đã có tài khoản?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text className="text-purple-600 font-semibold text-sm">
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