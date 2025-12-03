import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { useGetMeQuery } from "../../hooks/useGetMe";
import { useAuthRefresh } from "../../navigation/AppNavigator";
import { useLogout } from "../../hooks/useAuth";

type ReviewerWaitingProps = {
  navigation?: {
    navigate?: (route: string) => void;
    replace?: (route: string) => void;
  };
};

const statusDescriptions: Record<
  string,
  { title: string; message: string }
> = {
  pending: {
    title: "Hồ sơ đang được xem xét",
    message:
      "Cảm ơn bạn đã gửi thông tin. Quá trình duyệt có thể mất tới 24-48 giờ làm việc. Chúng tôi sẽ thông báo ngay khi hoàn tất.",
  },
  rejected: {
    title: "Hồ sơ chưa được chấp thuận",
    message:
      "Vui lòng kiểm tra lại thông tin và bổ sung chứng chỉ hoặc liên hệ hỗ trợ để biết thêm chi tiết.",
  },
  default: {
    title: "Đang xác nhận trạng thái hồ sơ",
    message:
      "Chúng tôi đang kiểm tra trạng thái tài khoản của bạn. Nhấn nút làm mới nếu bạn vừa cập nhật thông tin.",
  },
};

const ReviewerWaiting = ({ navigation }: ReviewerWaitingProps) => {
  const { data: meData, isLoading, isFetching, refetch } = useGetMeQuery();
  const { refreshAuth } = useAuthRefresh();
  const logoutMutation = useLogout();

  const statusRaw = meData?.reviewerProfile?.status ?? "";
  const normalizedStatus = statusRaw.trim().toLowerCase();

  const statusInfo = useMemo(() => {
    return (
      statusDescriptions[normalizedStatus as keyof typeof statusDescriptions] ||
      statusDescriptions.default
    );
  }, [normalizedStatus]);

  useEffect(() => {
    if (!isLoading && normalizedStatus) {
      if (
        normalizedStatus === "approved" ||
        normalizedStatus === "active" ||
        normalizedStatus === "actived"
      ) {
        refreshAuth();
        navigation?.replace?.("ReviewerMainApp");
      }
    }
  }, [isLoading, normalizedStatus, refreshAuth, navigation]);

  const handleRefresh = () => {
    refetch();
  };

  const handleAddCertificate = () => {
    navigation?.navigate?.("UploadingCertificate");
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await refreshAuth();
      },
    });
  };

  if (isLoading && !meData) {
    return (
      <SafeAreaView className="flex-1 bg-[#0f1a1f] items-center justify-center">
        <ActivityIndicator size="large" color="#2ed7ff" />
        <Text className="text-gray-300 mt-4">Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  const isRejected = normalizedStatus === "rejected";

  return (
    <SafeAreaView className="flex-1 bg-[#0f1a1f]">
      <LinearGradient
        colors={["#0f1a1f", "#18232a", "#0f1a1f"]}
        className="flex-1 px-6 py-10"
      >
        <View className="flex-1 justify-center">
          <View className="bg-[#1d2a33] rounded-3xl p-6 border border-[#2ed7ff]/30 shadow-2xl space-y-8">
            <View className="items-center">
              <View
                className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
                  isRejected
                    ? "bg-red-500/10 border-red-400/40"
                    : "bg-[#2ed7ff]/10 border-[#2ed7ff]/40"
                }`}
              >
                <Feather
                  name={isRejected ? "shield-off" : "clock"}
                  size={48}
                  color={isRejected ? "#fb7185" : "#2ed7ff"}
                />
              </View>
              <Text className="text-xs text-[#2ed7ff] tracking-widest font-semibold mt-6">
                TRẠNG THÁI HỒ SƠ:
              </Text>
              <Text className="text-white text-lg font-bold mt-1">
                {statusRaw ? statusRaw.toUpperCase() : "CHƯA XÁC ĐỊNH"}
              </Text>
            </View>

            <View className="space-y-3 px-1">
              <Text className="text-3xl font-bold text-white text-center">
                {statusInfo.title}
              </Text>
              <Text className="text-gray-300 text-base text-center leading-relaxed">
                {statusInfo.message}
              </Text>
            </View>

            <View className="gap-4">
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-14 rounded-2xl border border-white/20 bg-white/10 flex-row items-center justify-center"
                onPress={handleRefresh}
                disabled={isFetching}
              >
                {isFetching ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Feather name="refresh-ccw" size={18} color="#ffffff" />
                    <Text className="text-white font-semibold">
                      Kiểm tra lại
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                className="h-14 rounded-2xl border border-white/20 bg-white/10 flex-row items-center justify-center"
                onPress={handleAddCertificate}
              >
                <Feather name="plus" size={18} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">
                  Thêm chứng chỉ
                </Text>
              </TouchableOpacity>
            </View>

            <View className="pt-4 border-t border-white/10">
              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-row items-center justify-center"
                onPress={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <ActivityIndicator color="#94a3b8" />
                ) : (
                  <>
                    <Feather name="log-out" size={18} color="#94a3b8" />
                    <Text className="text-gray-400 font-medium ml-2">
                      Đăng xuất
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default ReviewerWaiting;
