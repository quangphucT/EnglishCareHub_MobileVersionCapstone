import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageSourcePropType } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useGoogleAuth from "../../hooks/useGoogleAuth";

const googleIcon: ImageSourcePropType = require("../../assets/images/googleIcon.png");
const robotLogoIcon: ImageSourcePropType = require("../../assets/images/robotIcon.png");

const { width } = Dimensions.get('window');

type RoleTab = 'learner' | 'reviewer';

type ReviewerLoginMeta = {
  reviewerStatus?: string;
  reviewStatus?: string;
  isReviewerActive?: boolean;
};

type LoginScreenProps = {
  navigation?: {
    navigate?: (route: string) => void;
  };
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signInWithGoogle, isLoading } = useGoogleAuth();
  const [activeTab, setActiveTab] = useState<RoleTab>('learner');
  const handleReviewerNavigation = (
    isReviewerActive?: boolean,
    rawStatus?: string
  ) => {
    const normalizedStatus = rawStatus?.trim().toLowerCase();

    if (normalizedStatus === "pending") {
      if (isReviewerActive === false) {
        navigation?.navigate?.("EntranceInformation");
        return;
      }
      navigation?.navigate?.("ReviewerWaiting");
      return;
    }

    if (
      normalizedStatus === "active" ||
      normalizedStatus === "approved" ||
      normalizedStatus === "actived"
    ) {
      navigation?.navigate?.("ReviewerMainApp");
      return;
    }

    if (isReviewerActive === false) {
      navigation?.navigate?.("UploadingCertificate");
      return;
    }

    navigation?.navigate?.("ReviewerWaiting");
  };
  const extractReviewerMeta = (data: unknown): ReviewerLoginMeta => {
    return (data as ReviewerLoginMeta) || {};
  };
  const handleLogin = async () => {
    const loginResponse = await signInWithGoogle(activeTab);
    if (!loginResponse) {
      return;
    }

    if (activeTab === "reviewer") {
      try {
        const reviewerMeta = extractReviewerMeta(loginResponse);
        handleReviewerNavigation(
          reviewerMeta.isReviewerActive,
          reviewerMeta.reviewerStatus ?? reviewerMeta.reviewStatus
        );
      } catch (error) {
        navigation?.navigate?.("ReviewerWaiting");
      }
      return;
    }

    navigation?.navigate?.("MainApp");
  };

  return (
    <View className="flex-1 bg-white">
      {/* Top Gradient Background */}
      <LinearGradient
        colors={['#7C3AED', '#8B5CF6', '#A78BFA']}
        className="absolute top-0 left-0 right-0"
        style={{ height: '45%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View 
        className="absolute bg-white/10 rounded-full"
        style={{ width: 200, height: 200, top: -50, right: -50 }}
      />
      <View 
        className="absolute bg-white/10 rounded-full"
        style={{ width: 150, height: 150, top: 100, left: -75 }}
      />

      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6">
          {/* Header Section */}
          <View className="items-center pt-8 pb-6">
            {/* Logo Container */}
            <View 
              className="bg-white rounded-3xl p-4 mb-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Image source={robotLogoIcon} className="w-20 h-20" />
            </View>
            
            <Text className="text-3xl font-bold text-white mb-2">
              EnglishCareHub
            </Text>
            <Text className="text-white/80 text-base text-center">
              Luyện nói tiếng Anh cùng AI{'\n'}mọi lúc mọi nơi
            </Text>
          </View>

          {/* Login Card */}
          <View 
            className="bg-white rounded-3xl p-6 mt-4"
            style={{
              shadowColor: "#7C3AED",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 30,
              elevation: 15,
            }}
          >
            <Text className="text-2xl font-bold text-gray-800 mb-1 text-center">
              Chào mừng bạn! 👋
            </Text>
            <Text className="text-gray-500 text-sm mb-6 text-center">
              Chọn vai trò và đăng nhập để bắt đầu
            </Text>

            {/* Tab Selector */}
            <View className="flex-row bg-gray-100 rounded-2xl p-1.5 mb-5">
              <TouchableOpacity
                onPress={() => setActiveTab('learner')}
                className="flex-1"
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={activeTab === 'learner' ? ['#7C3AED', '#8B5CF6'] : ['transparent', 'transparent']}
                  className="py-3.5 rounded-xl flex-row items-center justify-center"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons 
                    name="school" 
                    size={20} 
                    color={activeTab === 'learner' ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text 
                    className="ml-2 font-semibold"
                    style={{ color: activeTab === 'learner' ? '#FFFFFF' : '#9CA3AF' }}
                  >
                    Học viên
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setActiveTab('reviewer')}
                className="flex-1"
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={activeTab === 'reviewer' ? ['#059669', '#10B981'] : ['transparent', 'transparent']}
                  className="py-3.5 rounded-xl flex-row items-center justify-center"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons 
                    name="clipboard" 
                    size={20} 
                    color={activeTab === 'reviewer' ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text 
                    className="ml-2 font-semibold"
                    style={{ color: activeTab === 'reviewer' ? '#FFFFFF' : '#9CA3AF' }}
                  >
                    Người đánh giá
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Role Description Card */}
            <View 
              className="rounded-2xl p-4 mb-6"
              style={{
                backgroundColor: activeTab === 'learner' ? '#F5F3FF' : '#ECFDF5',
                borderWidth: 1,
                borderColor: activeTab === 'learner' ? '#DDD6FE' : '#A7F3D0',
              }}
            >
              <View className="flex-row items-center mb-2">
                <View 
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: activeTab === 'learner' ? '#7C3AED' : '#059669' }}
                >
                  <Ionicons 
                    name={activeTab === 'learner' ? 'bulb' : 'star'} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text 
                  className="font-semibold text-base"
                  style={{ color: activeTab === 'learner' ? '#5B21B6' : '#047857' }}
                >
                  {activeTab === 'learner' ? 'Dành cho Học viên' : 'Dành cho Người đánh giá'}
                </Text>
              </View>
              <Text 
                className="text-sm leading-5 ml-11"
                style={{ color: activeTab === 'learner' ? '#6D28D9' : '#059669' }}
              >
                {activeTab === 'learner' 
                  ? 'Luyện nói tiếng Anh với AI, làm bài tập và theo dõi tiến trình học tập của bạn.'
                  : 'Xem và chấm điểm bài nói của học viên, đưa ra nhận xét và góp ý chi tiết.'}
              </Text>
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={activeTab === 'learner' ? ['#7C3AED', '#6D28D9'] : ['#059669', '#047857']}
                className="py-4 rounded-2xl flex-row items-center justify-center"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  opacity: isLoading ? 0.8 : 1,
                  shadowColor: activeTab === 'learner' ? "#7C3AED" : "#059669",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text className="text-white font-bold text-lg ml-3">
                      Đang đăng nhập...
                    </Text>
                  </>
                ) : (
                  <>
                    <View className="bg-white rounded-full p-1.5 mr-3">
                      <Image source={googleIcon} className="w-5 h-5" />
                    </View>
                    <Text className="text-white font-bold text-lg">
                      Đăng nhập với Google
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Features Section */}
          <View className="flex-row justify-center mt-8 px-4">
            <View className="items-center flex-1">
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="mic" size={24} color="#7C3AED" />
              </View>
              <Text className="text-xs text-gray-600 text-center">Luyện phát âm</Text>
            </View>
            <View className="items-center flex-1">
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
              </View>
              <Text className="text-xs text-gray-600 text-center">Luyện nói{'\n'}với AI</Text>
            </View>
            <View className="items-center flex-1">
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
              </View>
              <Text className="text-xs text-gray-600 text-center">Đánh giá từ{'\n'}Reviewer</Text>
            </View>
            {/* <View className="items-center flex-1">
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="trophy" size={24} color="#F59E0B" />
              </View>
              <Text className="text-xs text-gray-600 text-center">Thành tích</Text>
            </View> */}
          </View>

          {/* Footer */}
          <View className="absolute bottom-6 left-0 right-0 px-6">
            <Text className="text-gray-400 text-center text-xs">
              Bằng việc đăng nhập, bạn đồng ý với{" "}
              <Text className="text-purple-600 font-medium">Điều khoản dịch vụ</Text>
              {" "}và{" "}
              <Text className="text-purple-600 font-medium">Chính sách bảo mật</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}