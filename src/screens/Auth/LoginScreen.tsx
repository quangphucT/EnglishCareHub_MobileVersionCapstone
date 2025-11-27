import React from "react";
import {
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageSourcePropType } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
const googleIcon: ImageSourcePropType = require("../../assets/images/googleIcon.png");
import useGoogleAuth from "../../hooks/useGoogleAuth";
const robotLogoIcon: ImageSourcePropType = require("../../assets/images/robotIcon.png");

export default function LoginScreen() {
  const { signInWithGoogle, isLoading } = useGoogleAuth();

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#F0F9FF', '#FEFCE8', '#FFF7ED']}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-1 justify-center items-center px-8">
          {/* Logo */}
          <View className="items-center mb-12">
            <Image source={robotLogoIcon} className="w-[120px] h-[120px] mb-4" />
            <Text className="text-3xl font-bold text-gray-800 mb-1">
              EnglishCareHub
            </Text>
            <Text className="text-gray-500 text-sm">
              Luyện nói tiếng Anh cùng AI mọi lúc mọi nơi
            </Text>
          </View>

          {/* Login Form */}
          <View className="w-full max-w-sm">
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              Đăng nhập
            </Text>
            <Text className="text-gray-500 text-sm mb-8">
              Sử dụng tài khoản Google để tiếp tục
            </Text>

            {/* Google Button */}
            <TouchableOpacity
              onPress={signInWithGoogle}
              disabled={isLoading}
              activeOpacity={0.8}
              className="w-full bg-indigo-600 py-4 rounded-[50px] mb-4 shadow-lg"
              style={{
                opacity: isLoading ? 0.7 : 1,
                shadowColor: "#4F46E5",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text className="text-white font-semibold text-[18px] ml-3">
                    Đang đăng nhập...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Image source={googleIcon} className="w-7 h-7 mr-3" />
                  <Text className="text-white font-semibold text-[18px]">
                    Đăng nhập với Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="absolute bottom-8">
            <Text className="text-gray-400 text-center text-xs">
              Bằng việc đăng nhập, bạn đồng ý với{"\n"}
              <Text className="text-gray-600">Điều khoản dịch vụ</Text>
              {" và "}
              <Text className="text-gray-600">Chính sách bảo mật</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
