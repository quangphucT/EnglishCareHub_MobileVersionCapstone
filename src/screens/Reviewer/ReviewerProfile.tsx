import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";

import { useGetMeQuery } from "../../hooks/useGetMe";
import {
  useReviewerProfileGet,
  useReviewerProfilePut,
} from "../../hooks/reviewer/useReviewerProfile";

type ReviewerProfileScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

const ReviewerProfileScreen: React.FC<ReviewerProfileScreenProps> = ({
  navigation,
}) => {
  const queryClient = useQueryClient();

  const { data: meData } = useGetMeQuery();
  const userId = meData?.userId ?? "";

  const {
    data: reviewerProfile,
    isLoading,
    error,
  } = useReviewerProfileGet(userId);

  const updateProfileMutation = useReviewerProfilePut();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [experience, setExperience] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const profileData = reviewerProfile?.data;

  useEffect(() => {
    if (meData && profileData) {
      setFullName(meData.fullName || "");
      setExperience(
        profileData.experience ??
          String(profileData.yearsExperience ?? "") ??
          ""
      );
      setPhoneNumber(meData.phoneNumber || "");
    }
  }, [meData, profileData]);

  const stats = useMemo(() => {
    return {
      rating: profileData?.rating ?? 0,
      certificatesCount: profileData?.certificates?.length ?? 0,
      yearsExperience:
        profileData?.yearsExperience ??
        Number(profileData?.experience ?? 0) ??
        0,
    };
  }, [profileData]);

  const handleSaveProfile = useCallback(() => {
    if (!meData?.userId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
      return;
    }

    updateProfileMutation.mutate(
      {
        userId: meData.userId,
        fullname: fullName.trim(),
        experience: experience.trim(),
        phoneNumber: phoneNumber.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert("Thành công", "Cập nhật hồ sơ Reviewer thành công.");
          setIsEditing(false);
          queryClient.invalidateQueries({
            queryKey: ["reviewerProfile", meData.userId],
          });
          queryClient.invalidateQueries({ queryKey: ["getMe"] });
        },
        onError: err => {
          Alert.alert("Lỗi", err.message || "Không thể cập nhật hồ sơ.");
        },
      }
    );
  }, [
    meData?.userId,
    fullName,
    experience,
    phoneNumber,
    updateProfileMutation,
    queryClient,
  ]);

  const handleCancelEdit = useCallback(() => {
    if (meData && profileData) {
      setFullName(meData.fullName || "");
      setExperience(
        profileData.experience ??
          String(profileData.yearsExperience ?? "") ??
          ""
      );
      setPhoneNumber(meData.phoneNumber || "");
    }
    setIsEditing(false);
  }, [meData, profileData]);

  const handleGoToUploadCertificate = useCallback(() => {
    navigation.navigate("UploadingCertificate");
  }, [navigation]);

  const renderCertificates = () => {
    const certs = profileData?.certificates ?? [];
    if (!certs.length) {
      return (
        <View className="items-center py-10">
          <Ionicons name="document-text-outline" size={40} color="#94a3b8" />
          <Text className="mt-3 text-sm text-slate-500">
            Bạn chưa tải chứng chỉ nào.
          </Text>
        </View>
      );
    }

    return (
      <View className="mt-4">
        {certs.map(cert => (
          <View
            key={cert.certificateId}
            className="flex-row p-4 mb-3 bg-white rounded-2xl border border-slate-100 shadow-sm"
          >
            <Image
              source={{
                uri: cert.url || "https://via.placeholder.com/80x80.png",
              }}
              style={{ width: 64, height: 64, borderRadius: 12 }}
            />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-slate-900">
                {cert.name}
              </Text>
              <View className="mt-2 flex-row items-center">
                <View
                  className={`px-3 py-1 rounded-full ${
                    cert.status === "Approved"
                      ? "bg-green-50"
                      : cert.status === "Rejected"
                      ? "bg-red-50"
                      : "bg-amber-50"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      cert.status === "Approved"
                        ? "text-green-700"
                        : cert.status === "Rejected"
                        ? "text-red-700"
                        : "text-amber-700"
                    }`}
                  >
                    {cert.status === "Approved"
                      ? "Đã duyệt"
                      : cert.status === "Rejected"
                      ? "Bị từ chối"
                      : "Đang chờ duyệt"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mt-4 mb-4">
          <Text className="text-2xl font-bold text-slate-900">
            Hồ sơ Reviewer
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
            Thông tin và thành tích của bạn trên EnglishCareHub
          </Text>
        </View>

        {/* Profile Card */}
        <View className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-5 mb-5 shadow-md">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-white items-center justify-center mr-4">
              {meData?.avatarUrl ? (
                <Image
                  source={{ uri: meData.avatarUrl }}
                  style={{ width: 56, height: 56, borderRadius: 28 }}
                />
              ) : (
                <Ionicons name="person" size={40} color="#4f46e5" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold">
                {meData?.fullName || "Reviewer"}
              </Text>
              <Text className="text-indigo-100 text-xs mt-1">
                {meData?.email || "Chưa cập nhật email"}
              </Text>
              <Text className="text-indigo-100 text-xs mt-1">
                Số năm kinh nghiệm: {stats.yearsExperience || 0}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mt-4">
            <View className="items-center flex-1">
              <Text className="text-xs text-indigo-100">Đánh giá</Text>
              <Text className="text-xl font-bold text-white mt-1">
                {stats.rating.toFixed(1)}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xs text-indigo-100">Chứng chỉ</Text>
              <Text className="text-xl font-bold text-white mt-1">
                {stats.certificatesCount}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xs text-indigo-100">Kinh nghiệm</Text>
              <Text className="text-xl font-bold text-white mt-1">
                {stats.yearsExperience} năm
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            activeOpacity={0.9}
            className="mt-4 self-start px-4 py-2 rounded-full bg-white/10 border border-white/40"
          >
            <Text className="text-xs font-semibold text-white">
              Chỉnh sửa thông tin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Certificates Section */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-5">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-base font-semibold text-slate-900">
                Chứng chỉ
              </Text>
              <Text className="text-xs text-slate-500 mt-1">
                Quản lý chứng chỉ chuyên môn của bạn
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleGoToUploadCertificate}
              className="px-3 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <Text className="text-xs font-semibold text-white">
                Tải chứng chỉ
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : error ? (
            <View className="py-8 items-center">
              <Ionicons name="alert-circle" size={32} color="#ef4444" />
              <Text className="mt-2 text-xs text-red-500 text-center">
                Không thể tải thông tin: {error.message}
              </Text>
            </View>
          ) : (
            renderCertificates()
          )}
        </View>

        {/* Contact Info */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-5">
          <Text className="text-base font-semibold text-slate-900 mb-3">
            Thông tin liên hệ
          </Text>
          <View className="flex-row items-center mb-2">
            <Ionicons name="call-outline" size={18} color="#64748b" />
            <Text className="ml-2 text-sm text-slate-700">
              {phoneNumber || meData?.phoneNumber || "Chưa cập nhật"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      {isEditing && (
        <View className="absolute inset-0 bg-black/40 justify-center px-5">
          <View className="bg-white rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-slate-900">
                Chỉnh sửa hồ sơ
              </Text>
              <TouchableOpacity
                onPress={handleCancelEdit}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">
                  Họ và tên
                </Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ tên"
                  className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">
                  Kinh nghiệm (năm)
                </Text>
                <TextInput
                  value={experience}
                  onChangeText={setExperience}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 3"
                  className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">
                  Số điện thoại
                </Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="Nhập số điện thoại"
                  className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              className={`mt-6 rounded-2xl py-3 items-center ${
                updateProfileMutation.isPending
                  ? "bg-slate-200"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600"
              }`}
            >
              {updateProfileMutation.isPending ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Lưu thay đổi
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ReviewerProfileScreen;
