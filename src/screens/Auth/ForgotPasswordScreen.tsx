

import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ValidationSummary, SuccessMessage } from "../../components/common/ValidationSummary";
import { ErrorMessage, HintMessage } from "../../components/common/ErrorMessage";
import { useForgotPassword } from "../../hooks/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const forgotPasswordMutation = useForgotPassword();
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError("Email không được bỏ trống");
      return false;
    }

    if (!EMAIL_REGEX.test(value.trim())) {
      setEmailError("Email không hợp lệ. Vui lòng kiểm tra lại.");
      return false;
    }

    setEmailError("");
    return true;
  };

  const handleSubmit = async () => {

    setGeneralErrors([]);
    setSuccessVisible(false);

    const isValid = validateEmail(email);

    if (!isValid) {
      setGeneralErrors(["Vui lòng nhập email hợp lệ để tiếp tục."]);
      return;
    }

    try {
      setIsSubmitting(true);
    //   console.log("Submitting email for password reset:", email);
    //   // Placeholder for API call
    //   await new Promise((resolve) => setTimeout(resolve, 1500));
       forgotPasswordMutation.mutate({ email },
        {
            onError: (error: any) => {
                setIsSubmitting(false);
                const errorMessage = error.message || 'Yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại.';
                setGeneralErrors([errorMessage]);
                setSuccessVisible(false);
            },
            onSuccess: (data) => {
                setIsSubmitting(false);
                setSuccessVisible(true);
                setGeneralErrors([]);
                Alert.alert(
                   data.message || "Đã gửi yêu cầu",
                );
            }
        }

       );

      setIsSubmitting(false);
      setSuccessVisible(true);
      Alert.alert(
        "Đã gửi yêu cầu",
        "Nếu email tồn tại trong hệ thống, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu tới bạn."
      );
    } catch (error) {
      setIsSubmitting(false);
      setGeneralErrors(["Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau."]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View
            className="h-[300px] justify-center items-center px-6"
            style={{ backgroundColor: "#fff", paddingTop: 50 }}
          >
            <View className="items-center">
              <Text className="text-4xl mb-2">📧</Text>
              <Text className="text-2xl font-bold text-gray-800">Quên mật khẩu?</Text>
              <Text className="text-gray-600 mt-2">Nhập email để đặt lại mật khẩu</Text>
            </View>
          </View>

          <View className="flex-1 bg-white">
            <View className="px-6 pt-8">
              {/* <Pressable
                accessibilityLabel="Quay lại"
                onPress={() => navigation.goBack()}
                className="absolute top-0 right-0 z-10"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Ionicons name="close" size={32} color="#FF6B6B" />
              </Pressable> */}

              <View className="mb-6 pr-10">
                <Text className="text-gray-900 text-[17px] mb-1">
                  Quên mật khẩu?
                </Text>
                <Text className="text-4xl font-extrabold text-gray-800 mb-2">
                  Khôi phục tài khoản
                </Text>
                <Text className="text-gray-600 text-base leading-6">
                  Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.
                </Text>
              </View>
            </View>

            <View className="px-6 pt-2">
              <ValidationSummary errors={generalErrors} />
              <SuccessMessage
                message="Đã gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra email của bạn."
                visible={successVisible}
              />

              <View className="mb-6">
                <Text className="text-gray-600 text-[18px] mb-2">Email</Text>
                <View
                  className={`border-2 rounded-2xl px-4 py-4 flex-row items-center ${
                    emailError ? "border-red-400" : "border-gray-800"
                  }`}
                  style={{ backgroundColor: "transparent" }}
                >
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                  <TextInput
                    className="flex-1 text-gray-700 text-[18px]"
                    placeholder="example@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError || generalErrors.length > 0) {
                        validateEmail(text);
                      }
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: 220, animated: true });
                      }, 150);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
                <ErrorMessage error={emailError} type="error" />
                <HintMessage message="Chúng tôi sẽ gửi liên kết đặt lại mật khẩu tới email hợp lệ." />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="rounded-[16px] py-5 items-center"
                style={{ backgroundColor: isSubmitting ? "#3a3a5a" : "#1a1a2e" }}
              >
                {isSubmitting ? (
                  <Text className="text-yellow-400 text-[19px] font-semibold">
                    Đang gửi...
                  </Text>
                ) : (
                  <Text className="text-yellow-400 text-[19px] font-semibold">
                    Gửi hướng dẫn qua email
                  </Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-600 text-[16px]">Nhớ lại mật khẩu? </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text className="text-red-500 text-[16px] font-semibold">Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
