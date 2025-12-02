import React, { useState } from "react";
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
import { Ionicons } from '@expo/vector-icons';
import useGoogleAuth from "../../hooks/useGoogleAuth";

const googleIcon: ImageSourcePropType = require("../../assets/images/googleIcon.png");
const robotLogoIcon: ImageSourcePropType = require("../../assets/images/robotIcon.png");

type RoleTab = 'learner' | 'reviewer';

export default function LoginScreen() {
  const { signInWithGoogle, isLoading } = useGoogleAuth();
  const [activeTab, setActiveTab] = useState<RoleTab>('learner');

  const handleLogin = async () => {
    await signInWithGoogle(activeTab);
  };

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
          <View className="items-center mb-10">
            <Image source={robotLogoIcon} className="w-[100px] h-[100px] mb-3" />
            <Text className="text-3xl font-bold text-gray-800 mb-1">
              EnglishCareHub
            </Text>
            <Text className="text-gray-500 text-sm">
              Luyện nói tiếng Anh cùng AI mọi lúc mọi nơi
            </Text>
          </View>

          {/* Login Form */}
          <View className="w-full max-w-sm">
            <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Đăng nhập
            </Text>
            <Text className="text-gray-500 text-sm mb-6 text-center">
              Chọn vai trò và đăng nhập với Google
            </Text>

            {/* Tab Selector */}
            <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-6">
              <TouchableOpacity
                onPress={() => setActiveTab('learner')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activeTab === 'learner' ? '#FFFFFF' : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="school-outline" 
                  size={20} 
                  color={activeTab === 'learner' ? '#4F46E5' : '#6B7280'} 
                />
                <Text style={{
                  marginLeft: 8,
                  fontWeight: '600',
                  color: activeTab === 'learner' ? '#4F46E5' : '#6B7280'
                }}>
                  Học viên
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setActiveTab('reviewer')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activeTab === 'reviewer' ? '#FFFFFF' : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="clipboard-outline" 
                  size={20} 
                  color={activeTab === 'reviewer' ? '#059669' : '#6B7280'} 
                />
                <Text style={{
                  marginLeft: 8,
                  fontWeight: '600',
                  color: activeTab === 'reviewer' ? '#059669' : '#6B7280'
                }}>
                  Người đánh giá
                </Text>
              </TouchableOpacity>
            </View>

            {/* Role Description */}
            <View style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: activeTab === 'learner' ? '#EEF2FF' : '#ECFDF5'
            }}>
              {activeTab === 'learner' ? (
                <View className="flex-row items-start">
                  <Ionicons name="information-circle" size={20} color="#4F46E5" />
                  <Text style={{ color: '#4338CA', fontSize: 14, marginLeft: 8, flex: 1 }}>
                    Học viên có thể luyện nói tiếng Anh với AI, làm bài tập và theo dõi tiến trình học tập.
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-start">
                  <Ionicons name="information-circle" size={20} color="#059669" />
                  <Text style={{ color: '#047857', fontSize: 14, marginLeft: 8, flex: 1 }}>
                    Người đánh giá có thể xem và chấm điểm bài nói của học viên, đưa ra nhận xét và góp ý.
                  </Text>
                </View>
              )}
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
              className={`w-full py-4 rounded-[50px] shadow-lg ${
                activeTab === 'learner' ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}
              style={{
                opacity: isLoading ? 0.7 : 1,
                shadowColor: activeTab === 'learner' ? "#4F46E5" : "#059669",
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