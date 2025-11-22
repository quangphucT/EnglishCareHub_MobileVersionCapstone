import React, { useRef } from "react";
import {
  Text,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageSourcePropType } from "react-native";
const googleIcon: ImageSourcePropType = require("../../assets/images/googleIcon.png");
import useGoogleAuth from "../../hooks/useGoogleAuth";

export default function LoginScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const { signInWithGoogle, isLoading } = useGoogleAuth();

  return (
    <SafeAreaView className="flex-1  bg-[#fff]">
      <View className="flex-1" style={{ backgroundColor: "#fff" }}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Top illustration area */}
          <View
            className="h-[350px] justify-center items-center px-6"
            style={{ backgroundColor: "#fff", paddingTop: 50 }}
          >
            {/* Logo/Title */}
            <View className="items-center mb-8">
              <Text className="text-4xl font-bold text-purple-600 mb-2">EnglishCareHub</Text>
              <Text className="text-gray-600 text-base">Learn English with AI</Text>
            </View>
          </View>

          {/* Login Form - chiếm toàn màn hình phần dưới */}
          <View className="flex-1 rounded-t-[40px] bg-[#fff]">
            <View className="px-6 pt-8">
             

              {/* Header */}
              <View className="mb-6">
                <Text className="text-gray-900 text-[17px] mb-1">
                  Chào mừng bạn!
                </Text>
                <Text className="text-4xl font-extrabold text-gray-800 mb-2">
                  Đăng nhập học viên
                </Text>
                <Text className="text-gray-600 text-base">
                  Sử dụng tài khoản Google để tiếp tục
                </Text>
              </View>
            </View>

            {/* Form Container */}
            <View className="space-y-4 pl-5 pr-5 pt-8">
              <View className="mb-8">
                <Text className="text-gray-600 text-center text-base mb-4 leading-6">
                  Đăng nhập bằng tài khoản Google của bạn để bắt đầu học tiếng Anh
                </Text>
              </View>

              <View className="items-center">
                <TouchableOpacity
                  onPress={signInWithGoogle}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  className="w-full flex-row items-center justify-center bg-white py-5 rounded-2xl border-2 border-gray-300 shadow-lg"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="#4285F4" size="small" />
                      <Text className="text-gray-700 font-semibold text-[16px] ml-3">
                        Đang đăng nhập...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Image source={googleIcon} className="w-12 h-12 mr-4" />
                      <Text className="text-gray-800 font-bold text-[18px]">
                        Đăng nhập với Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View className="mt-12">
                <Text className="text-gray-500 text-center text-sm leading-5">
                  Bằng việc đăng nhập, bạn đồng ý với{"\n"}
                  <Text className="text-blue-600 font-semibold">Điều khoản dịch vụ</Text>
                  {" và "}
                  <Text className="text-blue-600 font-semibold">Chính sách bảo mật</Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
