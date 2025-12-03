import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthRefresh } from "../../navigation/AppNavigator";
import { useReviewerCertificationUpload } from "../../hooks/reviewer/useReviewerCertificationUpload";
import { useReviewerProfilePut } from "../../hooks/reviewer/useReviewerProfile";
import { useGetMeQuery } from "../../hooks/useGetMe";

type CertificateItem = {
  id: string;
  uri: string;
  originalName: string;
  displayName: string;
  size?: number | null;
  mimeType?: string | null;
};

type LegacyDocumentPickerSuccess = {
  uri: string;
  name?: string | null;
  size?: number | null;
  mimeType?: string | null;
  type?: "success" | "cancel";
};

type UploadingCertificateProps = {
  navigation?: {
    canGoBack: () => boolean;
    goBack: () => void;
    navigate?: (route: string) => void;
  };
};

const UploadingCertificate = ({ navigation }: UploadingCertificateProps) => {
  const queryClient = useQueryClient();
  const { refreshAuth } = useAuthRefresh();
  const { data: meData } = useGetMeQuery();
  const {
    mutateAsync: uploadCertificate,
    isPending: isUploadingCertificate,
  } = useReviewerCertificationUpload();
  const {
    mutateAsync: updateProfile,
    isPending: isUpdatingProfile,
  } = useReviewerProfilePut();

  const [experienceYears, setExperienceYears] = useState("");
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);

  const isPending = isUploadingCertificate || isUpdatingProfile;

  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const formatFileSize = (size?: number | null) => {
    if (!size && size !== 0) return "Không rõ dung lượng";
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(size / 1024).toFixed(1)} KB`;
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const normalizeAssets = (
    result:
      | DocumentPicker.DocumentPickerResult
      | (LegacyDocumentPickerSuccess & { canceled?: boolean })
  ): LegacyDocumentPickerSuccess[] => {
    if ("assets" in result && Array.isArray(result.assets)) {
      return result.assets;
    }

    if ("type" in result && result.type === "success") {
      return [result];
    }

    return [];
  };

  const handlePickDocuments = async () => {
    try {
      const result =
        (await DocumentPicker.getDocumentAsync({
          type: ["image/*", "application/pdf"],
          multiple: true,
          copyToCacheDirectory: true,
        })) as DocumentPicker.DocumentPickerResult &
          LegacyDocumentPickerSuccess;

      if ("canceled" in result && result.canceled) {
        return;
      }
      if ("type" in result && result.type === "cancel") {
        return;
      }

      const assets = normalizeAssets(result);
      if (!assets.length) {
        return;
      }

      const mapped = assets.map((asset) => ({
        id: generateId(),
        uri: asset.uri,
        originalName: asset.name || "certificate",
        displayName: asset.name || "",
        size: asset.size,
        mimeType: asset.mimeType,
      }));

      setCertificates((prev) => [...prev, ...mapped]);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở trình chọn tệp. Vui lòng thử lại.");
    }
  };

  const handleNameChange = (id: string, value: string) => {
    setCertificates((prev) =>
      prev.map((certificate) =>
        certificate.id === id
          ? { ...certificate, displayName: value }
          : certificate
      )
    );
  };

  const handleRemoveCertificate = (id: string) => {
    setCertificates((prev) =>
      prev.filter((certificate) => certificate.id !== id)
    );
  };

  const handleReset = () => {
    setCertificates([]);
  };

  const validateExperience = () => {
    const trimmed = experienceYears.trim();
    if (!trimmed) {
      Alert.alert("Lỗi", "Số năm kinh nghiệm không được để trống!");
      return null;
    }

    const value = Number(trimmed);
    if (Number.isNaN(value)) {
      Alert.alert("Lỗi", "Số năm kinh nghiệm phải là số hợp lệ!");
      return null;
    }
    if (value < 0) {
      Alert.alert("Lỗi", "Số năm kinh nghiệm không được nhỏ hơn 0!");
      return null;
    }
    if (value > 100) {
      Alert.alert("Lỗi", "Số năm kinh nghiệm không được lớn hơn 100!");
      return null;
    }
    if (!Number.isInteger(value)) {
      Alert.alert("Lỗi", "Số năm kinh nghiệm phải là số nguyên!");
      return null;
    }

    return trimmed;
  };

  const onSubmit = async () => {
    if (!certificates.length) {
      Alert.alert("Lỗi", "Chưa chọn file!");
      return;
    }

    if (!meData?.userId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng!");
      return;
    }

    const validExperience = validateExperience();
    if (!validExperience) {
      return;
    }

    try {
      for (const certificate of certificates) {
        const certificateName =
          certificate.displayName.trim() || certificate.originalName;
        await uploadCertificate({
          file: {
            uri: certificate.uri,
            name: certificate.originalName,
            type: certificate.mimeType || "application/octet-stream",
          },
          name: certificateName,
        });
      }

      await sleep(1000);

      await updateProfile({
        userId: meData.userId,
        experience: validExperience,
        fullname: meData.fullName || "",
        phoneNumber: meData.phoneNumber || "",
      });

      queryClient.invalidateQueries({ queryKey: ["getMe"] });
      queryClient.invalidateQueries({
        queryKey: ["reviewerProfile", meData.userId],
      });

      Alert.alert(
        "Thành công",
        "Bằng cấp đã được gửi. Vui lòng chờ hệ thống phê duyệt."
      );
      setCertificates([]);

      if (refreshAuth) {
        await refreshAuth();
      }
      navigation?.navigate?.("ReviewerWaiting");
    } catch (error: any) {
      const message =
        error?.message || "Đã xảy ra lỗi trong quá trình tải lên chứng chỉ.";
      Alert.alert("Lỗi", message);
    }
  };

  const canSubmit = useMemo(
    () => certificates.length > 0 && !isPending,
    [certificates.length, isPending]
  );

  return (
    <SafeAreaView className="flex-1 bg-[#18232a]">
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingVertical: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          className="flex-row items-center gap-2 mb-6"
          onPress={() => {
            if (navigation?.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#94A3B8" />
          <Text className="text-sm font-medium text-gray-300">Quay lại</Text>
        </TouchableOpacity>

        <View className="bg-[#1d2a33] rounded-3xl p-6 shadow-2xl shadow-black/40 border border-[#243545]">
          <Text className="text-2xl font-extrabold text-white text-center">
            Upload bằng cấp
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2">
            Tải lên bằng cấp của bạn để hoàn tất hồ sơ reviewer
          </Text>

          <View className="mt-8 space-y-4">
            <View>
              <Text className="text-sm font-semibold text-gray-200 mb-2">
                Số năm kinh nghiệm
              </Text>
              <TextInput
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="Nhập số năm kinh nghiệm (ví dụ: 5)"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                className="bg-[#1a2730] text-white h-12 rounded-2xl px-4 border border-[#2c3e50]"
                editable={!isPending}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-200 mb-2">
                Tải lên tệp chứng chỉ
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePickDocuments}
                disabled={isPending}
                className="bg-[#1d2a33] rounded-3xl border border-[#2ed7ff]/40 items-center justify-center px-5 py-8"
                style={{ borderStyle: "dashed" }}
              >
                <Feather name="upload-cloud" size={38} color="#2ed7ff" />
                <Text className="text-base text-white font-semibold mt-4">
                  Kéo thả hoặc nhấn để chọn tệp
                </Text>
                <Text className="text-xs text-gray-400 mt-2 text-center px-4">
                  Hỗ trợ hình ảnh và PDF. Có thể chọn nhiều tệp cùng lúc.
                </Text>
              </TouchableOpacity>
            </View>

            {certificates.length > 0 && (
              <View className="bg-[#1d2a33] border border-[#243545] rounded-3xl p-4 space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-gray-200">
                    Danh sách chứng chỉ ({certificates.length})
                  </Text>
                  <TouchableOpacity
                    onPress={handleReset}
                    disabled={isPending}
                    className="px-3 py-1 rounded-full bg-[#22313c]"
                  >
                    <Text className="text-xs text-gray-300 font-semibold">
                      Xoá tất cả
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3">
                  {certificates.map((certificate, index) => (
                    <View
                      key={certificate.id}
                      className="bg-[#22313c] border border-[#2c3e50] rounded-2xl p-4 space-y-3"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 pr-3">
                          <Feather name="file-text" size={20} color="#2ed7ff" />
                          <View className="ml-3 flex-1">
                            <Text
                              className="text-sm text-white font-semibold"
                              numberOfLines={1}
                            >
                              {certificate.originalName}
                            </Text>
                            <Text className="text-xs text-gray-400 mt-1">
                              {formatFileSize(certificate.size)}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            handleRemoveCertificate(certificate.id)
                          }
                          disabled={isPending}
                          className="w-9 h-9 rounded-full items-center justify-center bg-[#1b2530]"
                        >
                          <Feather name="trash-2" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>

                      <View>
                        <Text className="text-xs text-gray-300 mb-2">
                          Tên hiển thị
                        </Text>
                        <TextInput
                          value={certificate.displayName}
                          onChangeText={(value) =>
                            handleNameChange(certificate.id, value)
                          }
                          placeholder={`Nhập tên chứng chỉ #${index + 1}`}
                          placeholderTextColor="#64748B"
                          className="bg-[#1a2730] text-white rounded-2xl px-4 h-12 border border-[#2c3e50]"
                          editable={!isPending}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            disabled={!canSubmit}
            onPress={onSubmit}
            className={`mt-8 h-12 rounded-2xl items-center justify-center ${
              canSubmit
                ? "bg-[#2ed7ff]"
                : "bg-[#2ed7ff]/40"
            }`}
            activeOpacity={0.85}
          >
            {isPending ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#18232a" />
                <Text className="text-[#18232a] font-semibold">
                  Đang tải...
                </Text>
              </View>
            ) : (
              <Text className="text-[#18232a] font-semibold text-base">
                Tải lên chứng chỉ
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UploadingCertificate;
