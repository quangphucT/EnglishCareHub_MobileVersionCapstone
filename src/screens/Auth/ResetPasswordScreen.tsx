import React, { useState, useRef } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

type ResetPasswordParams = {
  token?: string;
  email?: string;
};

const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef<ScrollView>(null);
  const { token, email } = (route.params as ResetPasswordParams) ?? {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      setPasswordError("Mật khẩu mới không được bỏ trống");
      return false;
    }
    if (value.length < 8) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (value: string, original: string) => {
    if (!value.trim()) {
      setConfirmPasswordError("Vui lòng nhập lại mật khẩu để xác nhận");
      return false;
    }
    if (value !== original) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleResetPassword = async () => {
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword, password);

    if (!isPasswordValid || !isConfirmValid) {
      return;
    }

    if (!token) {
      Alert.alert(
        "Thiếu mã xác thực",
        "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thử gửi lại email quên mật khẩu."
      );
      return;
    }

    // TODO: Replace with real API integration when backend endpoint is ready
    Alert.alert(
      "Cập nhật mật khẩu",
      "Mật khẩu mới đã được gửi lên máy chủ (mô phỏng).",
      [
        {
          text: "Đăng nhập",
          onPress: () => (navigation as any).navigate("Login"),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View className="px-6 pt-8">
            <Pressable
              accessibilityLabel="Quay lại"
              onPress={() => navigation.goBack()}
              className="absolute top-0 right-0 z-10"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="close" size={32} color="#FF6B6B" />
            </Pressable>

            <View className="mt-12">
              <Text className="text-gray-900 text-[17px] mb-1">
                Đặt lại mật khẩu
              </Text>
              <Text className="text-3xl font-extrabold text-gray-800 mb-3">
                Tạo mật khẩu mới
              </Text>
              {email ? (
                <Text className="text-gray-600 text-base leading-6">
                  Đang cập nhật cho tài khoản <Text className="font-semibold">{email}</Text>.
                </Text>
              ) : (
                <Text className="text-gray-600 text-base leading-6">
                  Nhập mật khẩu mới của bạn bên dưới.
                </Text>
              )}
            </View>
          </View>

          <View className="px-6 pt-10">
            <View className="mb-6">
              <Text className="text-gray-600 text-[18px] mb-2">
                Mật khẩu mới
              </Text>
              <View
                className={`border-2 rounded-2xl px-4 py-4 ${
                  passwordError ? "border-red-400" : "border-gray-800"
                }`}
              >
                <TextInput
                  className="text-gray-700 text-[18px]"
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) {
                      validatePassword(text);
                    }
                  }}
                  onBlur={() => validatePassword(password)}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 160, animated: true });
                    }, 150);
                  }}
                />
              </View>
              {passwordError ? (
                <Text className="text-red-500 text-sm mt-2">{passwordError}</Text>
              ) : null}
            </View>

            <View className="mb-6">
              <Text className="text-gray-600 text-[18px] mb-2">
                Xác nhận mật khẩu
              </Text>
              <View
                className={`border-2 rounded-2xl px-4 py-4 ${
                  confirmPasswordError ? "border-red-400" : "border-gray-800"
                }`}
              >
                <TextInput
                  className="text-gray-700 text-[18px]"
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) {
                      validateConfirmPassword(text, password);
                    }
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword, password)}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 260, animated: true });
                    }, 150);
                  }}
                />
              </View>
              {confirmPasswordError ? (
                <Text className="text-red-500 text-sm mt-2">{confirmPasswordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              className="rounded-[16px] py-5 items-center mb-8"
              style={{ backgroundColor: "#1a1a2e" }}
            >
              <Text className="text-yellow-400 text-[19px] font-semibold">
                Cập nhật mật khẩu
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mb-10">
              <Text className="text-gray-600 text-[16px]">
                Quay lại màn hình đăng nhập?
              </Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate("Login")}>
                <Text className="text-red-500 text-[16px] font-semibold ml-2">
                  Đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
