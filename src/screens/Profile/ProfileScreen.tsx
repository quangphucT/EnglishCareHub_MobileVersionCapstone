import React, { useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLogout } from "../../hooks/useAuth";
import { useAuthRefresh } from "../../navigation/AppNavigator";
import { useGetMeQuery } from "../../hooks/useGetMe";

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const logoutMutation = useLogout();
  const { refreshAuth } = useAuthRefresh();
  const { data: getMe, isLoading, refetch } = useGetMeQuery();

  // Refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const isReviewer = getMe?.role === "REVIEWER";

  // Text based on user role
  const texts = {
    title: isReviewer ? "My Profile" : "Hồ sơ của tôi",
    user: isReviewer ? "User" : "Người dùng",
    myActivity: isReviewer ? "My Activity" : "Hoạt động của tôi",
    audioReview: isReviewer ? "Audio Review" : "Đánh giá Audio",
    audioReviewDesc: isReviewer
      ? "View your pronunciation reviews"
      : "Xem đánh giá phát âm của bạn",
    myRecordings: isReviewer ? "My Recordings" : "Thu âm của tôi",
    recordingsDesc: isReviewer
      ? "Manage your recordings"
      : "Quản lý các bản ghi âm",
    account: isReviewer ? "Account" : "Tài khoản",
    personalInfo: isReviewer ? "Personal Information" : "Thông tin cá nhân",
    editProfile: isReviewer ? "Edit your profile" : "Chỉnh sửa hồ sơ của bạn",
    logout: isReviewer ? "Logout" : "Đăng xuất",
  };

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await refreshAuth();
      },
    });
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={["#EEF2FF", "#E0E7FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
        >
          <Text className="text-2xl font-bold text-black mb-6">
            {texts.title}
          </Text>

          <View className="flex-row items-center">
            {/* Avatar */}
            <View
              className="w-20 h-20 bg-white rounded-full items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text className="text-purple-600 text-2xl font-bold">
                {isLoading
                  ? "..."
                  : getMe?.fullName?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>

            {/* User Info */}
            <View className="flex-1 ml-4">
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-xl font-bold text-black">
                    {getMe?.fullName || texts.user}
                  </Text>
                  <Text className="text-sm text-black/80 mt-1">
                    {getMe?.email || ""}
                  </Text>
                  {getMe?.learnerProfile?.level && (
                    <View className="flex-row items-center mt-3 gap-3">
                      {/* Level */}
                      <View className="flex-row items-center bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5">
                        <Ionicons name="school" size={14} color="#4F46E5" />
                        <Text className="text-indigo-700 font-semibold text-xs ml-1">
                          {getMe.learnerProfile.level}
                        </Text>
                      </View>

                      {/* Coins */}
                      <View className="flex-row items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                        <Ionicons
                          name="logo-bitcoin"
                          size={14}
                          color="#D97706"
                        />
                        <Text className="text-amber-700 font-semibold text-xs ml-1">
                          {getMe.coinBalance ?? 0} Coins
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Learning Section - Only show for Learner role */}
        {getMe?.role === "LEARNER" && (
          <View className="px-4" style={{ marginTop: -20 }}>
            <View
              className="bg-white rounded-2xl p-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <Text className="text-base font-bold text-gray-900 mb-4">
                {texts.myActivity}
              </Text>

              <View style={{ gap: 12 }}>
                {/* Audio Review */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("AudioReview" as never)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: "#F3E8FF",
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#E9D5FF",
                  }}
                >
                  <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center">
                    <Ionicons name="mic" size={24} color="#7C3AED" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-purple-700 font-bold text-base">
                      {texts.audioReview}
                    </Text>
                    <Text className="text-purple-500 text-xs mt-0.5">
                      {texts.audioReviewDesc}
                    </Text>
                  </View>
                  <View className="w-8 h-8 bg-purple-200 rounded-full items-center justify-center">
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#7C3AED"
                    />
                  </View>
                </TouchableOpacity>

                {/* Recording */}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("LearnerRecordFolderPage" as never)
                  }
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: "#DBEAFE",
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#BFDBFE",
                  }}
                >
                  <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center">
                    <Ionicons name="recording" size={24} color="#3B82F6" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-blue-700 font-bold text-base">
                      {texts.myRecordings}
                    </Text>
                    <Text className="text-blue-500 text-xs mt-0.5">
                      {texts.recordingsDesc}
                    </Text>
                  </View>
                  <View className="w-8 h-8 bg-blue-200 rounded-full items-center justify-center">
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#3B82F6"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View className="px-4 mt-6">
          <Text className="text-base font-bold text-gray-900 mb-4">
            {texts.account}
          </Text>
          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                if (getMe?.role === "REVIEWER") {
                  const parent = navigation.getParent();
                  if (parent) {
                    parent.navigate("ReviewerProfile" as never);
                  } else {
                    (navigation as any).navigate("ReviewerProfile");
                  }
                } else if (getMe?.role === "LEARNER") {
                  const parent = navigation.getParent();
                  if (parent) {
                    parent.navigate("LearnerProfile" as never);
                  } else {
                    (navigation as any).navigate("LearnerProfile");
                  }
                }
              }}
              className="flex-row items-center p-4"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 bg-purple-50 rounded-xl items-center justify-center">
                <Ionicons name="person" size={22} color="#7C3AED" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-gray-900 font-bold text-base">
                  {texts.personalInfo}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {texts.editProfile}
                </Text>
              </View>
              <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-4 mt-6 mb-4">
          <TouchableOpacity
            onPress={handleLogout}
            disabled={logoutMutation.isPending}
            activeOpacity={0.8}
            // style={{
            //   backgroundColor: '#FEF2F2',
            //   borderRadius: 16,
            //   paddingVertical: 16,
            //   borderWidth: 1,
            //   borderColor: '#FECACA',
            // }}
          >
            <View className="flex-row items-center justify-center">
              {logoutMutation.isPending ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <View className="w-10 h-10  rounded-full items-center justify-center mr-3">
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color="#EF4444"
                    />
                  </View>
                  <Text className="text-red-600 font-bold text-base">
                    {texts.logout}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
