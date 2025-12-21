import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useGetMeQuery } from "../../hooks/useGetMe";
import { useEditLearnerProfile, useGetMyProgressAnalytics } from "../../hooks/learner/profile/profileHook";
import httpClient from "../../api/httpClient";
import { useNavigation } from "@react-navigation/native";

const LearnerProfile = () => {
  const navigation = useNavigation();
  const { data: userData, isLoading, refetch } = useGetMeQuery();
  const { data: progressData } = useGetMyProgressAnalytics();
  const updateProfileMutation = useEditLearnerProfile();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const analytics = progressData?.data;

  const [openEdit, setOpenEdit] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      setFullName(userData.fullName || "");
      setPhoneNumber(userData.phoneNumber || "");
    }
  }, [userData]);

  const formatDate = (dateString?: string | null, includeTime: boolean = false) => {
    if (!dateString) return "Chưa cập nhật";
    if (includeTime) {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const openEditModal = () => {
    setFullName(userData?.fullName || "");
    setPhoneNumber(userData?.phoneNumber || "");
    setSelectedImageUri(null);
    setOpenEdit(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh. Vui lòng thử lại.");
    }
  };

  const handleSubmitEdit = async () => {
    try {
      // ✅ VALIDATION
      const trimmedFullName = fullName.trim();
      const trimmedPhoneNumber = phoneNumber.trim();

      if (!trimmedFullName || trimmedFullName.length === 0) {
        Alert.alert("Lỗi", "Vui lòng nhập họ tên.");
        return;
      }

      if (trimmedFullName.length < 2) {
        Alert.alert("Lỗi", "Họ tên phải có ít nhất 2 ký tự.");
        return;
      }

      // Kiểm tra fullName không được chứa số
      if (/\d/.test(trimmedFullName)) {
        Alert.alert("Lỗi", "Họ tên không được chứa số.");
        return;
      }

      if (trimmedPhoneNumber && trimmedPhoneNumber.length > 0) {
        // Remove spaces, dashes, and parentheses for validation
        const cleanedPhone = trimmedPhoneNumber.replace(/[\s\-\(\)]/g, "");
        
        // Check if phone number contains only digits and optional + at start
        if (!/^(\+84|0)?[0-9]{9,10}$/.test(cleanedPhone)) {
          Alert.alert(
            "Lỗi",
            "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số)."
          );
          return;
        }
      }

      let avatarUrl = userData?.avatarUrl; // mặc định giữ ảnh cũ

      // ✅ NẾU CÓ CHỌN ẢNH → UPLOAD TRƯỚC
      if (selectedImageUri) {
        setIsUploadingAvatar(true);
        try {
          // Convert image URI to FormData for React Native
          const fileName = selectedImageUri.split("/").pop() || `avatar_${Date.now()}.jpg`;
          const fileType = "image/jpeg";
          
          // Create FormData for React Native
          const formData = new FormData();
          formData.append("file", {
            uri: selectedImageUri,
            name: fileName,
            type: fileType,
          } as any);

          // Upload using httpClient directly
          const response = await httpClient.post<{ success: boolean; url: string }>(
            "Avatar/avatar",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          
          avatarUrl = response.data.url; // ✅ LINK CLOUDINARY
        } catch (uploadError: any) {
          setIsUploadingAvatar(false);
          Alert.alert(
            "Lỗi",
            uploadError?.response?.data?.message || "Không thể tải lên ảnh đại diện"
          );
          return;
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      // ✅ SAU ĐÓ MỚI UPDATE PROFILE
      const res = await updateProfileMutation.mutateAsync({
        fullName: trimmedFullName,
        phoneNumber: trimmedPhoneNumber || "",
        avatarUrl, // ✅ GỬI LINK ẢNH LÊN BE
      });

      if (res.isSucess) {
        setOpenEdit(false);
        setSelectedImageUri(null);
        await refetch(); // ✅ load lại avatar mới
        Alert.alert("Thành công", "Đã cập nhật thông tin thành công");
      }
    } catch (err: any) {
      console.error("Update profile failed:", err);
      Alert.alert(
        "Lỗi",
        err?.message || "Không thể cập nhật thông tin. Vui lòng thử lại."
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-gray-600 font-medium mt-4">
            Đang tải thông tin...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6 py-8">
          {/* HEADER */}
          <View className="mb-10">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-3"
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#475569" />
              </TouchableOpacity>
              
              <Text className="text-2xl font-semibold  text-indigo-600">
                Hồ sơ cá nhân
              </Text>
            </View>
          </View>

          {/* PROFILE CARD */}
          <View className="mb-10 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <View className="p-6 flex-row gap-6">
              <View className="w-28 h-28 rounded-full border-2 border-indigo-500 overflow-hidden">
                {userData?.avatarUrl ? (
                  <Image
                    source={{ uri: userData.avatarUrl }}
                    className="w-full h-full"
                    style={{ resizeMode: "cover" }}
                  />
                ) : (
                  <View className="w-full h-full bg-indigo-100 items-center justify-center">
                    <Text className="text-indigo-600 text-2xl font-bold">
                      {userData?.fullName?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-1 flex-col justify-between items-start">
                <View className="flex-1">
                  <Text className="text-xl font-semibold text-slate-900 mb-1">
                    {userData?.fullName}
                  </Text>
                  <Text className="text-sm text-slate-500">
                    {userData?.email}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={openEditModal}
                  disabled={updateProfileMutation.isPending}
                  activeOpacity={0.8}
                  className="bg-indigo-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-medium">
                    Chỉnh sửa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
         <View className="border-t border-slate-200 px-6 py-4 gap-3">

  {/* Email */}
  <View className="flex-row items-center gap-4 bg-slate-50 rounded-xl px-4 py-3">
    <View className="w-9 h-9 rounded-full bg-indigo-100 items-center justify-center">
      <Ionicons name="mail" size={18} color="#4F46E5" />
    </View>

    <View className="flex-1">
      <Text className="text-xs text-slate-500">Email</Text>
      <Text
        className="text-slate-800 font-medium"
        numberOfLines={1}
      >
        {userData?.email}
      </Text>
    </View>
  </View>

  {/* Phone */}
  <View className="flex-row items-center gap-4 bg-slate-50 rounded-xl px-4 py-3">
    <View className="w-9 h-9 rounded-full bg-indigo-100 items-center justify-center">
      <Ionicons name="call" size={18} color="#4F46E5" />
    </View>

    <View className="flex-1">
      <Text className="text-xs text-slate-500">Số điện thoại</Text>
      <Text
        className={`font-medium ${
          userData?.phoneNumber
            ? "text-slate-800"
            : "text-slate-400 italic"
        }`}
      >
        {userData?.phoneNumber || "Chưa cập nhật"}
      </Text>
    </View>
  </View>

</View>

          </View>

          {/* PROGRESS HEADER */}
          <View className="mb-6">
            <View className="flex-row items-center">
              <View className="w-1 h-6 bg-indigo-600 rounded-full mr-2" />
              <Text className="text-2xl font-semibold text-slate-900">
                Tiến độ học tập
              </Text>
            </View>
          </View>

          {/* STATS CARDS */}
          <View className="mb-10">
            <View className="flex-row flex-wrap gap-4">
              {/* Trình độ */}
              <View className="flex-1 min-w-[45%] bg-white border border-slate-200 rounded-lg p-5">
                <Text className="text-sm text-slate-500 mb-1">Trình độ</Text>
                <Text className="text-2xl font-semibold text-rose-600 mb-1">
                  {userData?.learnerProfile?.level || "N/A"}
                </Text>
                <Text className="text-xs text-slate-400">
                  Cấp độ hiện tại theo đánh giá của hệ thống
                </Text>
              </View>

              {/* Thời gian luyện nói */}
              <View className="flex-1 min-w-[45%] bg-white border border-slate-200 rounded-lg p-5">
                <Text className="text-sm text-slate-500 mb-1 flex-row items-center">
                  <Text>🎤 </Text>
                  <Text>Thời gian luyện nói</Text>
                </Text>
                <Text className="text-2xl font-semibold text-blue-600 mb-1">
                  {analytics?.speakingTime ?? 0} phút
                </Text>
                <Text className="text-xs text-slate-400">
                  Tổng thời gian bạn đã luyện nói với hệ thống
                </Text>
              </View>

              {/* Số buổi hoàn thành */}
              <View className="flex-1 min-w-[45%] bg-white border border-slate-200 rounded-lg p-5">
                <Text className="text-sm text-slate-500 mb-1 flex-row items-center">
                  <Text>📘 </Text>
                  <Text>Số buổi hoàn thành</Text>
                </Text>
                <Text className="text-2xl font-semibold text-emerald-600 mb-1">
                  {analytics?.sessionsCompleted ?? 0} buổi
                </Text>
                <Text className="text-xs text-slate-400">
                  Số lần luyện nói đã hoàn thành
                </Text>
              </View>

              {/* Điểm phát âm trung bình */}
              <View className="flex-1 min-w-[45%] bg-white border border-slate-200 rounded-lg p-5">
                <Text className="text-sm text-slate-500 mb-1 flex-row items-center">
                  <Text>⭐ </Text>
                  <Text>Điểm phát âm trung bình</Text>
                </Text>
                <Text className="text-2xl font-semibold text-amber-600 mb-1">
                  {analytics?.pronunciationScoreAvg?.toFixed(1) ?? "0.0"}
                </Text>
                <Text className="text-xs text-slate-400">
                  Trung bình điểm phát âm các bài luyện
                </Text>
              </View>
            </View>
          </View>

          {/* DETAIL CARD */}
          <View className="bg-white border border-slate-200 rounded-lg p-6">
            <View className="flex-row justify-between items-center py-3 border-b border-slate-200">
              <Text className="text-slate-700">Tham gia từ</Text>
              <Text className="text-slate-900 font-medium">
                {formatDate(userData?.learnerProfile?.createdAt, false)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-slate-700">Trạng thái</Text>
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 bg-emerald-500 rounded-full" />
                <Text className="text-emerald-600 font-medium">Đang hoạt động</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={openEdit}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOpenEdit(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[90%]">
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
              <Text className="text-xl font-semibold text-gray-900">
                Chỉnh sửa hồ sơ
              </Text>
              <TouchableOpacity onPress={() => setOpenEdit(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                {/* Avatar Upload */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-3">
                    Ảnh đại diện
                  </Text>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <View className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 items-center justify-center">
                      {selectedImageUri ? (
                        <Image
                          source={{ uri: selectedImageUri }}
                          className="w-full h-full"
                          style={{ resizeMode: "cover" }}
                        />
                      ) : userData?.avatarUrl ? (
                        <Image
                          source={{ uri: userData.avatarUrl }}
                          className="w-full h-full"
                          style={{ resizeMode: "cover" }}
                        />
                      ) : (
                        <View className="w-full h-full bg-indigo-100 items-center justify-center">
                          <Text className="text-indigo-600 text-3xl font-bold">
                            {userData?.fullName?.charAt(0).toUpperCase() || "U"}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="mt-3 flex-row items-center gap-2">
                      <Ionicons name="camera" size={20} color="#6366F1" />
                      <Text className="text-indigo-600 font-medium">
                        Chọn ảnh mới
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Full Name */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Họ tên
                  </Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nhập họ tên"
                    className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                  />
                </View>

                {/* Phone Number */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </Text>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                    className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View className="flex-row justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <TouchableOpacity
                onPress={() => setOpenEdit(false)}
                className="px-6 py-3 rounded-xl border border-gray-300"
                activeOpacity={0.8}
              >
                <Text className="text-gray-700 font-medium">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitEdit}
                disabled={
                  updateProfileMutation.isPending || isUploadingAvatar
                }
                className="rounded-xl overflow-hidden"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#6366F1", "#9333EA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="px-6 py-3"
                  style={{
                    opacity:
                      updateProfileMutation.isPending || isUploadingAvatar
                        ? 0.6
                        : 1,
                  }}
                >
                  {updateProfileMutation.isPending || isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold">Lưu</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LearnerProfile;

