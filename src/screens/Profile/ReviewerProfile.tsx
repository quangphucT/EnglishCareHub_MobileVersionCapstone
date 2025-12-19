import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useGetMeQuery } from "../../hooks/useGetMe";
import {
  useReviewerProfileGet,
  useReviewerProfilePut,
} from "../../hooks/reviewer/useReviewerProfile";
import { useReviewerCertificationUpload } from "../../hooks/reviewer/useReviewerCertificationUpload";
import { useNavigation } from "@react-navigation/native";

const ReviewerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [certFormData, setCertFormData] = useState({
    name: "",
    imageUrl: "",
  });
  const [imageFiles, setImageFiles] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const { data: meData } = useGetMeQuery();
  const { data: reviewerProfileData } = useReviewerProfileGet(
    meData?.userId || ""
  );
  const { mutate: reviewerProfilePut, isPending } = useReviewerProfilePut();
  const {
    mutate: reviewerCertificationUpload,
    isPending: isCertUploadPending,
  } = useReviewerCertificationUpload();
  const queryClient = useQueryClient();
  const profileData = reviewerProfileData?.data;

  const [formData, setFormData] = useState({
    fullname: meData?.fullName || "",
    experience: meData?.reviewerProfile?.experience || "",
    phoneNumber: meData?.phoneNumber || "",
  });

  // Update formData when API data loads
  useEffect(() => {
    if (profileData && meData) {
      setFormData({
        fullname: meData.fullName || "",
        experience: profileData.experience || "",
        phoneNumber: meData.phoneNumber || "",
      });
    }
  }, [profileData, meData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!meData?.userId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
      return;
    }

    // Validate fullname
    if (!formData.fullname || formData.fullname.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên");
      return;
    }

    if (formData.fullname.trim().length < 2) {
      Alert.alert("Lỗi", "Họ tên phải có ít nhất 2 ký tự");
      return;
    }

    // Validate experience
    if (!formData.experience || formData.experience.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập số năm kinh nghiệm");
      return;
    }

    const experienceNum = parseFloat(formData.experience.trim());
    if (isNaN(experienceNum) || experienceNum < 0) {
      Alert.alert("Lỗi", "Số năm kinh nghiệm phải là số hợp lệ (>= 0)");
      return;
    }

    if (!Number.isInteger(experienceNum)) {
      Alert.alert("Lỗi", "Số năm kinh nghiệm phải là số nguyên");
      return;
    }

    // Validate phone number (optional but if provided, must be valid)
    if (formData.phoneNumber && formData.phoneNumber.trim() !== "") {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        Alert.alert("Lỗi", "Số điện thoại phải có 10-11 chữ số");
        return;
      }
    }

    reviewerProfilePut(
      {
        userId: meData.userId,
        fullname: formData.fullname.trim(),
        experience: formData.experience.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          queryClient.invalidateQueries({
            queryKey: ["reviewerProfile", meData.userId],
          });
          queryClient.invalidateQueries({ queryKey: ["getMe"] });
          Alert.alert("Thành công", "Đã cập nhật thông tin thành công");
        },
        onError: (error: any) => {
          Alert.alert(
            "Lỗi",
            error?.message || "Không thể cập nhật thông tin"
          );
        },
      }
    );
  };

  const handleCancel = () => {
    if (profileData && meData) {
      setFormData({
        fullname: meData.fullName || "",
        experience: profileData.experience || "",
        phoneNumber: meData.phoneNumber || "",
      });
    }
    setIsEditing(false);
  };

  // Certification handlers
  const handleCertInputChange = (field: string, value: string) => {
    setCertFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagePick = async () => {
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
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        }));

        setImageFiles(newFiles);
        setUploadedImageUrls(result.assets.map((asset) => asset.uri));

        if (result.assets.length > 0) {
          setCertFormData((prev) => ({
            ...prev,
            imageUrl: result.assets[0].uri,
          }));
        }
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh. Vui lòng thử lại.");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    setImageFiles(newFiles);
    const newUrls = newFiles.map((file) => file.uri);
    setUploadedImageUrls(newUrls);

    if (newUrls.length > 0) {
      setCertFormData((prev) => ({
        ...prev,
        imageUrl: newUrls[0],
      }));
    } else {
      setCertFormData((prev) => ({
        ...prev,
        imageUrl: "",
      }));
    }
  };

  const handleSaveCert = () => {
    // Validate certificate name
    if (!certFormData.name || certFormData.name.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập tên chứng chỉ");
      return;
    }

    if (certFormData.name.trim().length < 2) {
      Alert.alert("Lỗi", "Tên chứng chỉ phải có ít nhất 2 ký tự");
      return;
    }

    // Validate image
    if (imageFiles.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ảnh chứng chỉ");
      return;
    }

    reviewerCertificationUpload(
      {
        file: {
          uri: imageFiles[0].uri,
          name: imageFiles[0].name,
          type: imageFiles[0].type,
        },
        name: certFormData.name,
      },
      {
        onSuccess: () => {
          setIsAddingCert(false);
          setCertFormData({ name: "", imageUrl: "" });
          setImageFiles([]);
          setUploadedImageUrls([]);

          if (meData?.userId) {
            queryClient.invalidateQueries({
              queryKey: ["reviewerProfile", meData.userId],
            });
          }
          Alert.alert("Thành công", "Đã thêm chứng chỉ thành công");
        },
        onError: (error: any) => {
          Alert.alert(
            "Lỗi",
            error?.message || "Không thể tải lên chứng chỉ"
          );
        },
      }
    );
  };

  const handleCancelCert = () => {
    setIsAddingCert(false);
    setCertFormData({ name: "", imageUrl: "" });
    setImageFiles([]);
    setUploadedImageUrls([]);
  };

  // Use real data from API
  const derivedLevel =
    (profileData as { level?: string } | undefined)?.level ??
    (meData?.reviewerProfile as { level?: string } | undefined)?.level ??
    meData?.reviewerProfile?.levels ??
    "___";

  const mentorData = {
    id: profileData?.reviewerProfileId || "",
    name: meData?.fullName || "Name not provided",
    avatar: meData?.avatarUrl || "",
    rating: profileData?.rating || 0,
    totalReviews: 0,
    totalFeedbacks: 0,
    yearsExperience:
      profileData?.experience ??
      profileData?.yearsExperience ??
      meData?.reviewerProfile?.experience ??
      0,
    level: derivedLevel,
    certifications: profileData?.certificates || [],
  };
  const navigation = useNavigation();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full border border-green-200">
            <Ionicons name="checkmark-circle" size={16} color="#166534" />
            <Text className="text-green-800 text-xs font-semibold">
              Approved
            </Text>
          </View>
        );
      case "Pending":
        return (
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 bg-yellow-100 rounded-full border border-yellow-200">
            <Ionicons name="time" size={16} color="#854D0E" />
            <Text className="text-yellow-800 text-xs font-semibold">
              Pending approval
            </Text>
          </View>
        );
      case "Rejected":
        return (
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 bg-red-100 rounded-full border border-red-200">
            <Ionicons name="alert-circle" size={16} color="#991B1B" />
            <Text className="text-red-800 text-xs font-semibold">
              Rejected
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
        <View className="flex-1 px-3 pt-2">
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
        {/* Header Profile Section - Compact */}
        <View className="bg-white rounded-2xl overflow-hidden shadow-md mb-2">
          <LinearGradient
            colors={["#EFF6FF", "#FFFFFF", "#F5F3FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-3"
          >
            <View className="flex-col gap-2">
              {/* Avatar & Basic Info - Compact */}
              <View className="flex-row items-center gap-3">
                <View className="relative">
                  {mentorData.avatar ? (
                    <Image
                      source={{ uri: mentorData.avatar }}
                      className="w-16 h-16 rounded-full border-2 border-white"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                      }}
                    />
                  ) : (
                    <LinearGradient
                      colors={["#9333EA", "#2563EB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="w-16 h-16 rounded-full items-center justify-center border-2 border-white"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                      }}
                    >
                      <Text className="text-white text-xl font-bold">
                        {mentorData.name.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  )}
                  <View
                    className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-4 h-4 rounded-full items-center justify-center"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                    }}
                  >
                    <Ionicons name="checkmark" size={10} color="white" />
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                    {mentorData.name}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    {mentorData.level && (
                      <Text className="text-xs text-gray-600">
                        {mentorData.level}
                      </Text>
                    )}
                    <Text className="text-xs text-gray-500">•</Text>
                    <Text className="text-xs text-gray-600">
                      {mentorData.yearsExperience} yrs
                    </Text>
                    <Text className="text-xs text-gray-500">•</Text>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="star" size={12} color="#EAB308" />
                      <Text className="text-xs font-bold text-gray-900">
                        {mentorData.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Stats Cards - Compact Grid */}
              <View className="flex-row gap-2 mt-2">
                <View className="flex-1 bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="trophy" size={14} color="#2563EB" />
                    <Text className="text-xs font-semibold text-gray-900">
                      {mentorData.certifications?.length || 0} certs
                    </Text>
                  </View>
                </View>
                <View className="flex-1 bg-purple-50 p-2 rounded-lg border border-purple-100">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="star" size={14} color="#9333EA" />
                    <Text className="text-xs font-semibold text-gray-900">
                      {mentorData.rating.toFixed(1)}/5
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Button - Compact */}
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                className="rounded-xl overflow-hidden mt-2"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#2563EB", "#9333EA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="px-4 py-2 items-center justify-center"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="create-outline" size={16} color="white" />
                    <Text className="text-white font-semibold text-xs">
                      Chỉnh sửa
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Contact Info Section */}
        <View className="bg-white rounded-2xl overflow-hidden shadow-md mb-2">
          <View className="p-3">
            <Text className="text-sm font-bold text-gray-900 mb-2">
              Thông tin liên hệ
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center">
                  <Ionicons name="mail" size={14} color="#6366F1" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-semibold text-gray-500">
                    Email
                  </Text>
                  <Text className="font-medium text-gray-900 text-xs" numberOfLines={1}>
                    {meData?.email || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center">
                  <Ionicons name="call" size={14} color="#9333EA" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-semibold text-gray-500">
                    Số điện thoại
                  </Text>
                  <Text className="font-medium text-gray-900 text-xs">
                    {meData?.phoneNumber || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View className="bg-white rounded-2xl overflow-hidden shadow-md mb-2">
          <View className="p-3">
            <Text className="text-sm font-bold text-gray-900 mb-2">
              Thống kê
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-lg overflow-hidden">
                <LinearGradient
                  colors={["#3B82F6", "#6366F1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-3"
                >
                  <Ionicons name="trophy" size={18} color="white" />
                  <Text className="text-white text-[10px] mt-1">Kinh nghiệm</Text>
                  <Text className="text-white text-base font-bold">
                    {mentorData.yearsExperience} năm
                  </Text>
                </LinearGradient>
              </View>

              <View className="flex-1 rounded-lg overflow-hidden">
                <LinearGradient
                  colors={["#9333EA", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-3"
                >
                  <Ionicons name="star" size={18} color="white" />
                  <Text className="text-white text-[10px] mt-1">Đánh giá</Text>
                  <Text className="text-white text-base font-bold">
                    {mentorData.rating.toFixed(1)}/5
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </View>

        {/* Certificates Section - Compact */}
        <View className="bg-white rounded-2xl overflow-hidden shadow-md">
          <View className="p-3">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center gap-2">
                <View className="p-1.5 bg-indigo-500 rounded-lg">
                  <Ionicons name="trophy" size={14} color="white" />
                </View>
                <Text className="text-sm font-bold text-gray-900">
                  Chứng chỉ ({mentorData.certifications?.length || 0})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddingCert(true)}
                className="rounded-lg overflow-hidden"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#2563EB", "#9333EA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="px-3 py-1.5"
                >
                  <Text className="text-white font-semibold text-[10px]">
                    + Thêm
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {mentorData.certifications && mentorData.certifications.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8 }}
              >
                <View className="flex-row gap-3">
                  {mentorData.certifications.map((cert) => (
                    <View
                      key={cert.certificateId}
                      className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                      style={{ width: 160 }}
                    >
                      <View className="w-full h-32 bg-gray-100">
                        <Image
                          source={{ uri: cert.url || "" }}
                          className="w-full h-full"
                          style={{ resizeMode: "cover" }}
                        />
                      </View>
                      <View className="p-3">
                        <Text
                          className="font-bold text-gray-900 text-xs"
                          numberOfLines={2}
                        >
                          {cert.name}
                        </Text>
                        <View className="mt-2">
                          {getStatusBadge(cert.status)}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <Text className="text-gray-600 text-center text-xs">
                  Chưa có chứng chỉ
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[90%]">
              <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
                <Text className="text-xl font-semibold text-gray-900">
                  Chỉnh sửa hồ sơ
                </Text>
                <TouchableOpacity onPress={handleCancel}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                className="p-6" 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="space-y-6">
                  <View className="space-y-4">
                    <Text className="text-lg font-semibold text-gray-900">
                      Thông tin cơ bản
                    </Text>

                    <View className="space-y-4">
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                          Họ tên
                        </Text>
                        <TextInput
                          value={formData.fullname}
                          onChangeText={(value) =>
                            handleInputChange("fullname", value)
                          }
                          className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                          placeholder="Nhập họ tên"
                        />
                      </View>

                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                          Kinh nghiệm
                        </Text>
                        <TextInput
                          value={formData.experience}
                          onChangeText={(value) =>
                            handleInputChange("experience", value)
                          }
                          className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                          placeholder="Nhập số năm kinh nghiệm..."
                          keyboardType="numeric"
                        />
                      </View>

                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại
                        </Text>
                        <TextInput
                          value={formData.phoneNumber}
                          onChangeText={(value) =>
                            handleInputChange("phoneNumber", value)
                          }
                          className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                          placeholder="Nhập số điện thoại..."
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View className="flex-row items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <TouchableOpacity
                  onPress={handleCancel}
                  className="px-6 py-3 rounded-xl border border-gray-300"
                >
                  <Text className="text-gray-700 font-medium">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isPending}
                  className="rounded-xl overflow-hidden"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#2563EB", "#9333EA"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-6 py-3"
                    style={{ opacity: isPending ? 0.6 : 1 }}
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="checkmark" size={16} color="white" />
                        <Text className="text-white font-semibold">
                          Lưu thay đổi
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Certification Modal */}
      <Modal
        visible={isAddingCert}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelCert}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[90%]">
              <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
                <View className="flex-row items-center gap-3">
                  <View className="p-2 bg-indigo-500 rounded-xl">
                    <Ionicons name="trophy" size={24} color="white" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    Thêm chứng chỉ mới
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCancelCert}
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="p-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="space-y-6">
                  {/* Certification Name */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Tên chứng chỉ *
                    </Text>
                    <TextInput
                      value={certFormData.name}
                      onChangeText={(value) =>
                        handleCertInputChange("name", value)
                      }
                      className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                      placeholder="Nhập tên chứng chỉ..."
                    />
                  </View>

                  {/* Image Upload Section */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-3">
                      Hình ảnh chứng chỉ *
                    </Text>
                    <TouchableOpacity
                      onPress={handleImagePick}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      {uploadedImageUrls.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="w-full"
                        >
                          <View className="flex-row gap-4">
                            {uploadedImageUrls.map((url, index) => (
                              <View key={index} className="relative">
                                <View className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                  <Image
                                    source={{ uri: url }}
                                    className="w-32 h-32"
                                    style={{ width: 128, height: 128 }}
                                  />
                                </View>
                                <TouchableOpacity
                                  onPress={() => handleRemoveImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center"
                                >
                                  <Ionicons name="close" size={14} color="white" />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      ) : (
                        <View className="items-center">
                          <Ionicons
                            name="cloud-upload-outline"
                            size={48}
                            color="#9CA3AF"
                          />
                          <Text className="text-gray-600 mb-2 mt-4 text-center">
                            Nhấn để chọn ảnh
                          </Text>
                          <Text className="text-gray-500 text-sm text-center">
                            Chọn ảnh chứng chỉ từ thư viện
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View className="flex-row justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <TouchableOpacity
                  onPress={handleCancelCert}
                  className="px-6 py-2 rounded-xl border border-gray-300"
                  activeOpacity={0.8}
                >
                  <Text className="text-gray-700 font-medium">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveCert}
                  disabled={
                    !certFormData.name ||
                    imageFiles.length === 0 ||
                    isCertUploadPending
                  }
                  className="rounded-xl overflow-hidden"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#2563EB", "#9333EA"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-6 py-2 flex-row items-center gap-2"
                    style={{
                      opacity:
                        !certFormData.name ||
                        imageFiles.length === 0 ||
                        isCertUploadPending
                          ? 0.5
                          : 1,
                    }}
                  >
                    {isCertUploadPending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color="white" />
                        <Text className="text-white font-semibold">
                          Lưu chứng chỉ
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default ReviewerProfile;

