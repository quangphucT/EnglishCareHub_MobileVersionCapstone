import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageSourcePropType } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useGoogleAuth from "../../hooks/useGoogleAuth";
import { useLogin } from "../../hooks/useAuth";

const googleIcon: ImageSourcePropType = require("../../assets/images/googleIcon.png");
const aespLogo: ImageSourcePropType = require("../../assets/images/imageLanding2.jpg");

const { width } = Dimensions.get('window');

type RoleTab = 'learner' | 'reviewer';
type LoginMethod = 'google' | 'email';

type ReviewerLoginMeta = {
  reviewerStatus?: string;
  reviewStatus?: string;
  isReviewerActive?: boolean;
};

type LoginScreenProps = {
  navigation?: {
    navigate?: (route: string, params?: any) => void;
  };
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signInWithGoogle, isLoading } = useGoogleAuth();
  const loginMutation = useLogin();
  const [activeTab, setActiveTab] = useState<RoleTab>('learner');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('Vui lòng nhập email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      setEmailError('Email không hợp lệ');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    setPasswordError('');
    return true;
  };

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

  const handleEmailLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    const role = activeTab === 'learner' ? 'LEARNER' : 'REVIEWER';

    loginMutation.mutate(
      { email: email.trim().toLowerCase(), password, role },
      {
        onSuccess: (data) => {
          if (activeTab === 'reviewer') {
            handleReviewerNavigation(
              data.isPlacementTestDone,
              data.role
            );
          } else {
            if (!data.isPlacementTestDone) {
              navigation?.navigate?.("PlacementTest");
            // } else if (!data.isGoalSet) {
            //   navigation?.navigate?.("LearningPath");
            } else {
              navigation?.navigate?.("MainApp");
            }
          }
        },
        onError: (error: any) => {
          Alert.alert('Lỗi', error.message || 'Đăng nhập thất bại');
        }
      }
    );
  };

  const handleGoogleLogin = async () => {
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
        style={{ height: loginMethod === 'email' ? '30%' : '45%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-6">
        {/* Header Section */}
<View
  className={`items-center ${
    loginMethod === 'email' ? 'pt-6 pb-4' : 'pt-10 pb-6'
  }`}
>
  {/* Logo */}
  <View className="mb-3">
    <Image
      source={aespLogo}
      style={{
        width: 96,
        height: 96,
      }}
      resizeMode="contain"
    />
  </View>

  {/* App Name */}
  <Text className="text-white text-3xl font-extrabold tracking-wide mb-1">
    AESP
  </Text>

  {/* Tagline */}
  <Text className="text-white/70 text-sm text-center leading-5 px-6">
    Luyện nói tiếng Anh cùng AI{'\n'}mọi lúc, mọi nơi
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
                  {loginMethod === 'google' ? 'Chào mừng bạn! ' : 'Đăng nhập'}
                </Text>
                <Text className="text-gray-500 text-sm mb-4 text-center">
                  {loginMethod === 'google' ? 'Chọn vai trò và đăng nhập để bắt đầu' : 'Nhập thông tin tài khoản của bạn'}
                </Text>

                {/* Tab Selector */}
                <View className="flex-row rounded-xl p-1 mb-4 border border-gray-200 bg-gray-50">
                  <TouchableOpacity
                    onPress={() => setActiveTab('learner')}
                    className={`flex-1 rounded-lg ${activeTab === 'learner' ? 'bg-purple-500' : ''}`}
                    activeOpacity={0.7}
                  >
                    <View className="py-3 flex-row items-center justify-center">
                      <Ionicons 
                        name="school" 
                        size={18} 
                        color={activeTab === 'learner' ? '#FFFFFF' : '#9CA3AF'} 
                      />
                      <Text 
                        className={`ml-2 text-sm ${activeTab === 'learner' ? 'font-bold' : 'font-normal'}`}
                        style={{ color: activeTab === 'learner' ? '#FFFFFF' : '#9CA3AF' }}
                      >
                        Học viên
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setActiveTab('reviewer')}
                    className={`flex-1 rounded-lg ${activeTab === 'reviewer' ? 'bg-purple-500' : ''}`}
                    activeOpacity={0.7}
                  >
                    <View className="py-3 flex-row items-center justify-center">
                      <Ionicons 
                        name="clipboard" 
                        size={18} 
                        color={activeTab === 'reviewer' ? '#FFFFFF' : '#9CA3AF'} 
                      />
                      <Text 
                        className={`ml-2 text-sm ${activeTab === 'reviewer' ? 'font-bold' : 'font-normal'}`}
                        style={{ color: activeTab === 'reviewer' ? '#FFFFFF' : '#9CA3AF' }}
                      >
                        Người đánh giá
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {loginMethod === 'email' ? (
                  <>
                    {/* Email Input */}
                    <View className="mb-3">
                      <Text className="text-gray-600 text-sm mb-1.5 font-medium">Email</Text>
                      <View 
                        className={`flex-row items-center border-2 rounded-xl px-4 py-3 ${
                          emailError ? 'border-red-400' : 'border-gray-200'
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
                            if (emailError) setEmailError('');
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      {emailError ? (
                        <Text className="text-red-500 text-xs mt-1">{emailError}</Text>
                      ) : null}
                    </View>

                    {/* Password Input */}
                    <View className="mb-4">
                      <Text className="text-gray-600 text-sm mb-1.5 font-medium">Mật khẩu</Text>
                      <View 
                        className={`flex-row items-center border-2 rounded-xl px-4 py-3 ${
                          passwordError ? 'border-red-400' : 'border-gray-200'
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
                            if (passwordError) setPasswordError('');
                          }}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Ionicons 
                            name={showPassword ? "eye-outline" : "eye-off-outline"} 
                            size={20} 
                            color="#9CA3AF" 
                          />
                        </TouchableOpacity>
                      </View>
                      {passwordError ? (
                        <Text className="text-red-500 text-xs mt-1">{passwordError}</Text>
                      ) : null}
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity 
                      className="mb-4"
                      onPress={() => {
                        Alert.alert(
                          'Quên mật khẩu?',
                          'Để đặt lại mật khẩu, vui lòng truy cập trang web AESP và sử dụng chức năng "Quên mật khẩu" tại đó.\n\nNếu cần hỗ trợ thêm, hãy liên hệ với chúng tôi qua email.',
                          [
                            { text: 'Đã hiểu', style: 'default' }
                          ]
                        );
                      }}
                    >
                      <Text className="text-purple-600 text-sm text-right font-medium">
                        Quên mật khẩu?
                      </Text>
                    </TouchableOpacity>

                    {/* Email Login Button */}
                    <TouchableOpacity
                      onPress={handleEmailLogin}
                      disabled={loginMutation.isPending}
                      activeOpacity={0.85}
                      className="py-4 rounded-xl flex-row items-center justify-center bg-purple-500"
                      style={{
                        opacity: loginMutation.isPending ? 0.8 : 1,
                      }}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <Text className="text-white font-bold text-lg ml-3">
                            Đang đăng nhập...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
                          <Text className="text-white font-bold text-lg ml-2">
                              Đăng nhập
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-4">
                      <View className="flex-1 h-[1px] bg-gray-200" />
                      <Text className="mx-3 text-gray-400 text-sm">hoặc</Text>
                      <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    {/* Google Login Button */}
                    <TouchableOpacity
                      onPress={handleGoogleLogin}
                      disabled={isLoading}
                      activeOpacity={0.85}
                      className="border-2 border-gray-200 rounded-2xl py-3.5 flex-row items-center justify-center"
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#7C3AED" size="small" />
                      ) : (
                        <>
                          <Image source={googleIcon} className="w-5 h-5" />
                          <Text className="text-gray-700 font-semibold text-base ml-3">
                            Đăng nhập với Google
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Register Link */}
                    <View className="flex-row justify-center mt-4">
                      <Text className="text-gray-500 text-sm">Chưa có tài khoản? </Text>
                      <TouchableOpacity onPress={() => navigation?.navigate?.('Register')}>
                        <Text className="text-purple-600 font-semibold text-sm" numberOfLines={1}>Đăng ký ngay</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Role Description Card */}
                    <View 
                      className="rounded-xl p-4 mb-4"
                      style={{
                        backgroundColor: '#F5F3FF',
                        borderWidth: 1,
                        borderColor: '#DDD6FE',
                      }}
                    >
                      <View className="flex-row items-center mb-2">
                        <View 
                          className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: '#7C3AED' }}
                        >
                          <Ionicons 
                            name={activeTab === 'learner' ? 'bulb' : 'star'} 
                            size={16} 
                            color="#FFFFFF" 
                          />
                        </View>
                        <Text 
                          className="font-semibold text-base"
                          style={{ color: '#5B21B6' }}
                        >
                          {activeTab === 'learner' ? 'Dành cho Học viên' : 'Dành cho Người đánh giá'}
                        </Text>
                      </View>
                      <Text 
                        className="text-sm leading-5 ml-11"
                        style={{ color: '#6D28D9' }}
                      >
                        {activeTab === 'learner' 
                          ? 'Luyện nói tiếng Anh với AI, làm bài tập và theo dõi tiến trình học tập của bạn.'
                          : 'Xem và chấm điểm bài nói của học viên, đưa ra nhận xét và góp ý chi tiết.'}
                      </Text>
                    </View>

                    {/* Email Login Button */}
                    <TouchableOpacity
                      onPress={() => setLoginMethod('email')}
                      activeOpacity={0.85}
                      className="py-4 rounded-xl flex-row items-center justify-center bg-purple-500"
                    >
                      <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold text-lg ml-2">
                        Đăng nhập với Email
                      </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-4">
                      <View className="flex-1 h-[1px] bg-gray-200" />
                      <Text className="mx-3 text-gray-400 text-sm">hoặc</Text>
                      <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    {/* Google Login Button */}
                    <TouchableOpacity
                      onPress={handleGoogleLogin}
                      disabled={isLoading}
                      activeOpacity={0.85}
                      className="py-3.5 rounded-xl flex-row items-center justify-center border-2 border-gray-200"
                      style={{
                        opacity: isLoading ? 0.8 : 1,
                      }}
                    >
                      {isLoading ? (
                        <>
                          <ActivityIndicator color="#7C3AED" size="small" />
                          <Text className="text-gray-700 font-semibold text-base ml-3">
                            Đang đăng nhập...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Image source={googleIcon} className="w-5 h-5" />
                          <Text className="text-gray-700 font-semibold text-base ml-2">
                            Đăng nhập với Google
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Register Link */}
                    <View className="flex-row justify-center mt-4">
                      <Text className="text-gray-500 text-sm">Chưa có tài khoản? </Text>
                      <TouchableOpacity onPress={() => navigation?.navigate?.('Register')}>
                        <Text className="text-purple-600 font-semibold text-sm" numberOfLines={1}>Đăng ký ngay</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {/* Features Section - Only show in Google mode */}
              {loginMethod === 'google' && (
                <View className="flex-row justify-center mt-6 px-4">
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
                </View>
              )}

              {/* Back button for email mode */}
              {loginMethod === 'email' && (
                <TouchableOpacity 
                  className="mt-4 flex-row items-center justify-center"
                  onPress={() => setLoginMethod('google')}
                >
                  <Ionicons name="arrow-back" size={18} color="#7C3AED" />
                  <Text className="text-purple-600 font-medium ml-1">Quay lại</Text>
                </TouchableOpacity>
              )}

              {/* Footer */}
              <View className="py-6">
                <Text className="text-gray-400 text-center text-xs">
                  Bằng việc đăng nhập, bạn đồng ý với{" "}
                  <Text className="text-purple-600 font-medium">Điều khoản dịch vụ</Text>
                  {" "}và{" "}
                  <Text className="text-purple-600 font-medium">Chính sách bảo mật</Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}