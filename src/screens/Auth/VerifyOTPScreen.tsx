import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useVerifyOTP, useResendOTP } from '../../hooks/useOTP';

const { width } = Dimensions.get('window');

interface VerifyOTPScreenProps {
  email: string;
}

const VerifyOTPScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params as VerifyOTPScreenProps;

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(120); // 2 minutes = 120 seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // React Query hooks
  const verifyOTPMutation = useVerifyOTP();
  const resendOTPMutation = useResendOTP();

  // Refs for input focus
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setIsResendDisabled(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP code');
      return;
    }

    verifyOTPMutation.mutate(
      { email, otp: otpCode },
      {
        onSuccess: () => {
          Alert.alert(
            'Success',
            'Verification successful!',
            [
              {
                text: 'OK',
                onPress: () => (navigation as any).navigate('Login')
              }
            ]
          );
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Invalid OTP code');
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    );
  };

  // Resend OTP
  const handleResendOTP = async () => {
    resendOTPMutation.mutate(
      { email },
      {
        onSuccess: () => {
          // Reset timer and state
          setTimer(120);
          setIsResendDisabled(true);
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Gradient Header with Wave */}
      <View className="absolute top-0 left-0 right-0" style={{ height: 180 }}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
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
            height="80"
            width={width}
            style={{ position: "absolute", bottom: -2 }}
            viewBox={`0 0 ${width} 80`}
          >
            <Path
              d={`M0,0 C${width * 0.25},60 ${width * 0.75},20 ${width},40 L${width},80 L0,80 Z`}
              fill="white"
            />
          </Svg>
        </LinearGradient>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 justify-center px-8 pt-32">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-16 left-8 bg-white/20 rounded-full p-3"
            >
              <Ionicons name="arrow-back" size={24} color="#667eea" />
            </TouchableOpacity>

          {/* Title */}
          <View className="items-center mb-12">
            <View className="bg-blue-100 rounded-full p-6 mb-6">
              <Ionicons name="mail-outline" size={48} color="#667eea" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Verify OTP
            </Text>
            <Text className="text-gray-600 text-center text-base">
              Enter the 6-digit code sent to
            </Text>
            <Text className="text-blue-600 font-semibold text-base">
              {email}
            </Text>
          </View>

          {/* OTP Input */}
          <View className="flex-row justify-center mb-8" style={{ gap: 16 }}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                className="w-12 h-14 border-2 border-gray-300 rounded-xl text-center text-xl font-bold text-gray-800 bg-white"
                style={{
                  borderColor: digit ? '#667eea' : '#D1D5DB',
                  backgroundColor: digit ? '#F0F4FF' : '#FFFFFF',
                }}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Timer */}
          <View className="items-center mb-8">
            <Text className="text-gray-600 text-base mb-2">
              Code expires in:
            </Text>
            <Text className="text-2xl font-bold text-red-500">
              {formatTime(timer)}
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleVerifyOTP}
            disabled={verifyOTPMutation.isPending || otp.join('').length !== 6}
            activeOpacity={0.8}
            className={`mb-6 ${
              verifyOTPMutation.isPending || otp.join('').length !== 6 ? 'opacity-50' : ''
            }`}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ minHeight: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text className="text-white text-lg font-bold">
                {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify Code'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend OTP */}
          <View className="items-center">
            <Text className="text-gray-600 text-base mb-4">
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={isResendDisabled || resendOTPMutation.isPending}
              className={`${isResendDisabled || resendOTPMutation.isPending ? 'opacity-50' : ''}`}
            >
              <Text className="text-blue-600 font-semibold text-base underline">
                {resendOTPMutation.isPending ? 'Sending...' : isResendDisabled ? 'Resend later' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default VerifyOTPScreen;
