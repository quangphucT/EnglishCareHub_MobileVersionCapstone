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
import { useEditLearnerProfile } from "../../hooks/learner/profile/profileHook";
import httpClient from "../../api/httpClient";
import { useNavigation } from "@react-navigation/native";

const LearnerProfile = () => {
  const navigation = useNavigation();
  const { data: userData, isLoading, refetch } = useGetMeQuery();
  const updateProfileMutation = useEditLearnerProfile();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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
        fullName,
        phoneNumber,
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
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-3 pt-2">
          {/* HEADER */}
          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-2"
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color="#6366F1" />
              </TouchableOpacity>
              <Text className="text-2xl font-black text-indigo-600">
                Hồ sơ cá nhân
              </Text>
            </View>
          </View>

        {/* MAIN PROFILE CARD */}
        <View className="mb-3 bg-white rounded-2xl overflow-hidden shadow-md">
          {/* Gradient Header */}
          <LinearGradient
            colors={["#6366F1", "#9333EA", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 100 }}
          >
            <View className="absolute inset-0 bg-black/10" />
          </LinearGradient>

          <View className="px-4 pb-4 -mt-12">
            <View className="flex-col gap-3">
              {/* Avatar + Name + Edit */}
              <View className="flex-row items-center gap-3">
                <View className="w-20 h-20 rounded-full border-3 border-white overflow-hidden bg-white shadow-lg">
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
                <View className="flex-1 ">
                  <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                    {userData?.fullName}
                  </Text>
                  <TouchableOpacity
                    onPress={openEditModal}
                    disabled={updateProfileMutation.isPending}
                    className="mt-1 self-start rounded-full"
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#6366F1", "#9333EA"]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="px-3 py-1.5 rounded-full"
                    >
                      <Text className="text-white font-semibold text-xs">
                        Chỉnh sửa
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* CONTACT - Compact */}
              <View className="mt-2 gap-2">
                <View className="flex-row items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center">
                    <Ionicons name="mail" size={16} color="#6366F1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-gray-500">
                      Email
                    </Text>
                    <Text className="font-medium text-gray-900 text-xs" numberOfLines={1}>
                      {userData?.email}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center">
                    <Ionicons name="call" size={16} color="#9333EA" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-gray-500">
                      Số điện thoại
                    </Text>
                    <Text className="font-medium text-gray-900 text-xs">
                      {userData?.phoneNumber || "Chưa cập nhật"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* STATS - Compact */}
        <View className="gap-2 mb-3">
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-xl overflow-hidden">
              <LinearGradient
                colors={["#3B82F6", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-3"
              >
                <Ionicons name="trending-up" size={20} color="white" />
                <Text className="text-white text-[10px] mt-1">Trình độ</Text>
                <Text className="text-white text-lg font-bold">
                  {userData?.learnerProfile?.level || "N/A"}
                </Text>
              </LinearGradient>
            </View>

            <View className="flex-1 rounded-xl overflow-hidden">
              <LinearGradient
                colors={["#9333EA", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-3"
              >
                <Ionicons name="trophy" size={20} color="white" />
                <Text className="text-white text-[10px] mt-1">Điểm phát âm</Text>
                <Text className="text-white text-lg font-bold">
                  {userData?.learnerProfile?.pronunciationScore?.toFixed(1) ?? "0.0"}
                </Text>
              </LinearGradient>
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 rounded-xl overflow-hidden">
              <LinearGradient
                colors={["#F97316", "#EF4444"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-3"
              >
                <Ionicons name="time" size={20} color="white" />
                <Text className="text-white text-[10px] mt-1">Học hôm nay</Text>
                <Text className="text-white text-lg font-bold">
                  {(userData?.learnerProfile as any)?.dailyMinutes ?? 0} phút
                </Text>
              </LinearGradient>
            </View>

            <View className="flex-1 rounded-xl overflow-hidden">
              <LinearGradient
                colors={["#14B8A6", "#10B981"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-3"
              >
                <Ionicons name="calendar" size={20} color="white" />
                <Text className="text-white text-[10px] mt-1">Tham gia</Text>
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {formatDate(userData?.learnerProfile?.createdAt).split(" ")[0]}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* ADDITIONAL INFO - Compact */}
        <View className="px-3 mb-3">
          <View className="bg-white rounded-xl shadow-md p-4">
            <Text className="text-sm font-bold text-gray-900 mb-3">
              Thông tin chi tiết
            </Text>
            <View className="gap-2">
              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-gray-600 font-medium text-xs">
                  Cập nhật lần cuối
                </Text>
                <Text className="text-gray-900 font-semibold text-xs">
                  {formatDate(userData?.learnerProfile?.updatedAt)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-600 font-medium text-xs">
                  Trạng thái tài khoản
                </Text>
                <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full overflow-hidden">
                  <LinearGradient
                    colors={["#10B981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
                  >
                    <View className="w-1.5 h-1.5 bg-white rounded-full" />
                    <Text className="text-white font-semibold text-[10px]">
                      Đang hoạt động
                    </Text>
                  </LinearGradient>
                </View>
              </View>
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

