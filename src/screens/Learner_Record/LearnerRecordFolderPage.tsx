import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  useLearnerRecordFolders,
  useLearnerRecordFolderCreate,
  useLearnerRecordFolderDelete,
  useLearnerRecordFolderRename,
  useLearnerRecordUpdateContent,
  useAdminRecordChargeActive,
  useLearnerBuyRecordCharge,
} from '../../hooks/learner/learnerRecord/learnerRecordHook';
import type { Record, RecordCategory, RecordChargeActiveItem, Status } from '../../api/learnerRecord.service';

const LearnerRecordFolderPage = () => {
  const navigation = useNavigation();
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [folderToRename, setFolderToRename] = useState<RecordCategory | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderName, setRenamingFolderName] = useState('');
  const [showBuyRecordChargeDialog, setShowBuyRecordChargeDialog] = useState(false);
  const [showSelectFolderDialog, setShowSelectFolderDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<RecordChargeActiveItem | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<RecordCategory | null>(null);
  // Queries
  const { data: foldersData, isLoading: isLoadingFolders } = useLearnerRecordFolders();

  // Mutations
  const { mutateAsync: createFolder, isPending: isCreatingFolder } = useLearnerRecordFolderCreate();
  const { mutateAsync: deleteFolder, isPending: isDeletingFolder } = useLearnerRecordFolderDelete();
  const { mutateAsync: renameFolder, isPending: isRenamingFolder } = useLearnerRecordFolderRename();
  const { mutateAsync: buyRecordCharge, isPending: isBuyingRecordCharge } = useLearnerBuyRecordCharge();
  
  // Record Charge Packages
  const { data: packagesData, isLoading: isLoadingPackages } = useAdminRecordChargeActive();
  const recordChargePackages: RecordChargeActiveItem[] = packagesData?.data || [];

  const [editingContent, setEditingContent] = useState("");
  const [recordToEdit, setRecordToEdit] = useState<Record | null>(null);
  const [showEditContentDialog, setShowEditContentDialog] = useState(false)
  const { mutateAsync: updateRecordContent, isPending: isUpdatingRecordContent } = useLearnerRecordUpdateContent();
  const handleUpdateRecordContent = async () => {
    if (!recordToEdit || !editingContent.trim()) return;
    try {
      await updateRecordContent({ 
        recordId: recordToEdit.recordId, 
        content: editingContent.trim() 
      });
      setEditingContent("");
      setRecordToEdit(null);
      setShowEditContentDialog(false);
      Alert.alert("Cập nhật nội dung thành công");
    } catch (error: any) {
      // Error handled by hook
      Alert.alert(error.message || "Cập nhật nội dung record thất bại");
      console.error(error);
    }
  };
  // Handle response structure
  const folders = (() => {
    if (!foldersData) return [];
    if (Array.isArray(foldersData.data)) {
      return foldersData.data;
    }
    if (Array.isArray(foldersData)) {
      return foldersData;
    }
    return [];
  })();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolderDialog(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa thư mục này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolder(folderId);
            } catch (error) {
              // Error handled by hook
            }
          },
        },
      ]
    );
  };

  const handleRenameFolder = async () => {
    if (!folderToRename || !renamingFolderName.trim()) return;

    try {
      await renameFolder({
        categoryId: folderToRename.learnerRecordId,
        newName: renamingFolderName.trim(),
      });
      setRenamingFolderName('');
      setFolderToRename(null);
      setShowRenameDialog(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openRenameDialog = (folder: RecordCategory) => {
    setFolderToRename(folder);
    setRenamingFolderName(folder.name);
    setShowRenameDialog(true);
  };

  /**
   * Mở dialog mua gói ghi âm
   * @param folder - Folder được chọn (nếu có)
   */
  const openBuyRecordChargeDialog = (folder?: RecordCategory) => {
    // Helper function để mở modal với folder đã chọn
    const openModalWithFolder = (folderId: string) => {
      setSelectedFolderId(folderId);
      setSelectedPackage(null);
      setShowBuyRecordChargeDialog(true);
    };

    // Nếu có folder được truyền vào, mở modal ngay
    if (folder) {
      openModalWithFolder(folder.learnerRecordId);
      return;
    }

    // Xử lý khi không có folder được truyền vào
    const folderCount = folders.length;

    switch (folderCount) {
      case 0:
        Alert.alert(
          'Thông báo',
          'Bạn cần tạo thư mục trước khi mua gói ghi âm',
          [{ text: 'Đã hiểu', style: 'default' }]
        );
        break;

      case 1:
        // Tự động chọn folder duy nhất
        openModalWithFolder(folders[0].learnerRecordId);
        break;

      default:
        // Hiển thị modal chọn folder khi có nhiều folder
        setShowSelectFolderDialog(true);
        break;
    }
  };
// Map folder status to Vietnamese
const getFolderStatusLabel = (status: Status | string | undefined): string => {
  if (!status) return "";
  switch (status) {
    case "Draft":
      return "Nháp";
    case "InProgress":
      return "Đang thực hiện";
    case "Done":
      return "Hoàn thành";
    default:
      return status;
  }
};

// Get badge style based on status
const getFolderStatusStyle = (status: Status | string | undefined) => {
  if (!status) return { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', textColor: '#6B7280' };
  
  switch (status) {
    case "Done":
      return { borderColor: '#86EFAC', backgroundColor: '#F0FDF4', textColor: '#166534' };
    case "InProgress":
      return { borderColor: '#FDE047', backgroundColor: '#FEFCE8', textColor: '#854D0E' };
    case "Draft":
      return { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', textColor: '#6B7280' };
    default:
      return { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', textColor: '#6B7280' };
  }
};
  const handleBuyRecordCharge = async () => {
    // Validation
    if (!selectedPackage) {
      Alert.alert('Lỗi', 'Vui lòng chọn gói ghi âm');
      return;
    }

    if (!selectedFolderId) {
      Alert.alert('Lỗi', 'Vui lòng chọn thư mục');
      return;
    }

    if (!selectedPackage.recordChargeId) {
      Alert.alert('Lỗi', 'Gói ghi âm không hợp lệ');
      return;
    }

    try {
      await buyRecordCharge({
        folderId: selectedFolderId,
        recordChargeId: selectedPackage.recordChargeId,
      });
      // Success - dialog sẽ được đóng bởi hook onSuccess
      setShowBuyRecordChargeDialog(false);
      setSelectedPackage(null);
      setSelectedFolderId(null);
    } catch (error: any) {
      // Error đã được xử lý bởi hook, nhưng log để debug
      console.error('Buy record charge error:', error);
      // Hook sẽ hiển thị Alert với error message
    }
  };

  const renderFolderItem = ({ item }: { item: RecordCategory }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
      onPress={() => {
        // Navigate to records page with folderId
        navigation.navigate('LearnerRecordPage', { folderId: item.learnerRecordId });
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1" style={{ flex: 1 }}>
          <View
            className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: '#EFF6FF' }}
          >
            <Ionicons name="folder" size={24} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {item.name}
            </Text>
            <View className="flex-row items-center flex-wrap" style={{ gap: 6, marginTop: 4 }}>
              {item.numberOfRecord !== undefined && item.numberOfRecord !== null && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F3E8FF',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E9D5FF',
                  }}
                >
                  <Ionicons name="mic" size={12} color="#7C3AED" style={{ marginRight: 4 }} />
                  <Text 
                    className="text-xs font-medium"
                    style={{ color: '#6B21A8' }}
                  >
                    {item.numberOfRecord} lượt còn lại
                  </Text>
                </View>
              )}
              {item.status && (() => {
                const statusStyle = getFolderStatusStyle(item.status);
                return (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: statusStyle.borderColor,
                      backgroundColor: statusStyle.backgroundColor,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: statusStyle.textColor }}
                    >
                      {getFolderStatusLabel(item.status)}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            setSelectedFolder(item);
            setShowActionMenu(true);
          }}
          className="p-2 rounded-full active:bg-gray-100"
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-gray-900 ml-4">
            Quản lý Record
          </Text>
        </View>

        <View className="flex-1 px-4 pt-4">
          {/* Header Section */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-gray-900">Thư mục</Text>
            <Text className="text-sm text-gray-600 mt-1">
              Tạo và quản lý các thư mục record của bạn
            </Text>
          </View>

          {/* Create Folder Button */}
          <TouchableOpacity
            onPress={() => setShowCreateFolderDialog(true)}
            className="rounded-xl p-4 flex-row items-center justify-center mb-4"
            style={{
              backgroundColor: '#DBEAFE',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color="#2563EB" />
            <Text className="font-bold text-base ml-2" style={{ color: '#2563EB' }}>Tạo thư mục mới</Text>
          </TouchableOpacity>
        {/* Buy Record Charge Button */}
          <TouchableOpacity
            onPress={() => openBuyRecordChargeDialog()}
            className="rounded-xl p-4 flex-row items-center justify-center mb-4"
            style={{
              backgroundColor: '#FAF5FF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="mic" size={22} color="#9333EA" />
            <Text className="font-bold text-base ml-2" style={{ color: '#9333EA' }}>Mua lượt ghi âm</Text>
          </TouchableOpacity>

          {/* Folders List */}
          {isLoadingFolders ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-600 mt-4">Đang tải...</Text>
            </View>
          ) : folders.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View
                className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 font-semibold text-lg mb-2">Chưa có thư mục nào</Text>
              <Text className="text-sm text-gray-400 text-center px-8">
                Tạo thư mục mới để bắt đầu quản lý records của bạn
              </Text>
            </View>
          ) : (
            <FlatList
              data={folders}
              renderItem={renderFolderItem}
              keyExtractor={(item) => item.learnerRecordId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolderDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateFolderDialog(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowCreateFolderDialog(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}
            >
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xl font-bold text-gray-900">Tạo thư mục mới</Text>
                  <TouchableOpacity onPress={() => setShowCreateFolderDialog(false)}>
                    <Ionicons name="close" size={28} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-600 mt-1">
                  Nhập tên cho thư mục mới của bạn
                </Text>
              </View>

              <View className="mb-4">
                <TextInput
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Tên thư mục"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                  onSubmitEditing={handleCreateFolder}
                  returnKeyType="done"
                  editable={!isCreatingFolder}
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateFolderDialog(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
                >
                  <Text className="text-gray-700 font-medium">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${
                    !newFolderName.trim() || isCreatingFolder
                      ? 'bg-gray-300'
                      : 'bg-blue-600'
                  }`}
                >
                  {isCreatingFolder && (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  )}
                  <Text
                    className={`font-medium ${
                      !newFolderName.trim() || isCreatingFolder
                        ? 'text-gray-500'
                        : 'text-white'
                    }`}
                  >
                    {isCreatingFolder ? 'Đang tạo...' : 'Tạo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rename Folder Dialog */}
      <Modal
        visible={showRenameDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowRenameDialog(false);
          setFolderToRename(null);
          setRenamingFolderName('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setShowRenameDialog(false);
              setFolderToRename(null);
              setRenamingFolderName('');
            }}
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}
            >
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xl font-bold text-gray-900">Đổi tên thư mục</Text>
                  <TouchableOpacity onPress={() => {
                    setShowRenameDialog(false);
                    setFolderToRename(null);
                    setRenamingFolderName('');
                  }}>
                    <Ionicons name="close" size={28} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-600 mt-1">
                  Nhập tên mới cho thư mục
                </Text>
              </View>

              <View className="mb-4">
                <TextInput
                  value={renamingFolderName}
                  onChangeText={setRenamingFolderName}
                  placeholder="Tên thư mục mới"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                  onSubmitEditing={handleRenameFolder}
                  returnKeyType="done"
                  editable={!isRenamingFolder}
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowRenameDialog(false);
                    setFolderToRename(null);
                    setRenamingFolderName('');
                  }}
                  className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
                >
                  <Text className="text-gray-700 font-medium">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRenameFolder}
                  disabled={!renamingFolderName.trim() || isRenamingFolder}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${
                    !renamingFolderName.trim() || isRenamingFolder
                      ? 'bg-gray-300'
                      : 'bg-blue-600'
                  }`}
                >
                  {isRenamingFolder && (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  )}
                  <Text
                    className={`font-medium ${
                      !renamingFolderName.trim() || isRenamingFolder
                        ? 'text-gray-500'
                        : 'text-white'
                    }`}
                  >
                    {isRenamingFolder ? 'Đang lưu...' : 'Lưu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Buy Record Charge Modal */}
      <Modal
        visible={showBuyRecordChargeDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowBuyRecordChargeDialog(false);
          setSelectedPackage(null);
          setSelectedFolderId(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setShowBuyRecordChargeDialog(false);
              setSelectedPackage(null);
              setSelectedFolderId(null);
            }}
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="px-4 pt-6 pb-4">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="mic" size={24} color="#7C3AED" />
                        <Text className="text-xl font-bold text-gray-900 ml-2">
                          Mua gói ghi âm
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-600">
                        Chọn gói ghi âm phù hợp để có thêm lượt ghi âm cho folder của bạn
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setShowBuyRecordChargeDialog(false);
                        setSelectedPackage(null);
                        setSelectedFolderId(null);
                      }}
                      className="ml-2"
                    >
                      <Ionicons name="close" size={28} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {!selectedFolderId && (
                    <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                      <View className="flex-row items-start">
                        <Ionicons name="warning" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-yellow-800 mb-1">
                            Lưu ý:
                          </Text>
                          <Text className="text-sm text-yellow-800">
                            Bạn cần có thông tin folder để mua gói ghi âm.
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {isLoadingPackages ? (
                    <View className="items-center justify-center py-12">
                      <ActivityIndicator size="large" color="#7C3AED" />
                      <Text className="text-gray-600 mt-4">Đang tải danh sách gói...</Text>
                    </View>
                  ) : recordChargePackages.length === 0 ? (
                    <View className="items-center justify-center py-12">
                      <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-4 text-center">
                        Hiện tại không có gói ghi âm nào khả dụng.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View className="space-y-3 mb-6">
                        {recordChargePackages.map((pkg) => {
                          const pricePerRecord = pkg.amountCoin / pkg.allowedRecordCount;
                          const isSelected = selectedPackage?.recordChargeId === pkg.recordChargeId;

                          return (
                            <TouchableOpacity
                              key={pkg.recordChargeId}
                              onPress={() => setSelectedPackage(pkg)}
                              className={`rounded-2xl p-4 border-2 ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 bg-white'
                              }`}
                              style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: isSelected ? 0.15 : 0.05,
                                shadowRadius: 4,
                                elevation: isSelected ? 4 : 2,
                              }}
                            >
                              <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center flex-1">
                                  <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center mr-3">
                                    <Ionicons name="mic" size={20} color="#7C3AED" />
                                  </View>
                                  <View className="flex-1">
                                    <Text className="text-lg font-bold text-gray-900">
                                      {pkg.allowedRecordCount} lượt ghi âm
                                    </Text>
                                    <Text className="text-xs text-gray-500 mt-0.5">
                                      {pricePerRecord} Coin / lượt ghi âm
                                    </Text>
                                  </View>
                                </View>
                                {isSelected && (
                                  <View className="bg-purple-600 px-3 py-1 rounded-full">
                                    <Text className="text-white text-xs font-semibold">
                                      Đã chọn
                                    </Text>
                                  </View>
                                )}
                              </View>

                              <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                                <View className="flex-row items-center">
                                  <Ionicons name="logo-bitcoin" size={16} color="#10B981" />
                                  <Text className="text-sm text-gray-600 ml-2">Tổng giá:</Text>
                                </View>
                                <Text className="text-xl font-bold text-green-600">
                                  {pkg.amountCoin.toLocaleString('vi-VN')} Coin
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                        <View className="flex-row items-start">
                          <Ionicons name="information-circle" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-purple-800 mb-2">
                              Lưu ý:
                            </Text>
                            <View>
                              <Text className="text-xs text-purple-700 mb-1">
                                • Gói ghi âm sẽ được thêm vào folder hiện tại của bạn
                              </Text>
                              <Text className="text-xs text-purple-700 mb-1">
                                • Thanh toán sẽ được trừ từ số coin trong tài khoản của bạn
                              </Text>
                              <Text className="text-xs text-purple-700 mb-1">
                                • Bạn có thể sử dụng các lượt ghi âm này để tạo record mới trong folder
                              </Text>
                              <Text className="text-xs text-purple-700">
                                • Số lượt ghi âm sẽ được cộng vào số lượt còn lại của folder
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>

              <View className="px-4 pb-6 pt-4 border-t border-gray-200 bg-gray-50">
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowBuyRecordChargeDialog(false);
                      setSelectedPackage(null);
                      setSelectedFolderId(null);
                    }}
                    disabled={isBuyingRecordCharge}
                    className="flex-1 py-3 bg-gray-200 rounded-xl items-center"
                  >
                    <Text className="text-gray-700 font-semibold">Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleBuyRecordCharge}
                    disabled={!selectedPackage || isBuyingRecordCharge || !selectedFolderId}
                    className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${
                      !selectedPackage || isBuyingRecordCharge || !selectedFolderId
                        ? 'bg-gray-300'
                        : 'bg-purple-600'
                    }`}
                    style={
                      !selectedPackage || isBuyingRecordCharge || !selectedFolderId
                        ? {}
                        : {
                            shadowColor: '#7C3AED',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                          }
                    }
                  >
                    {isBuyingRecordCharge && (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    )}
                    <Ionicons
                      name={isBuyingRecordCharge ? 'hourglass' : 'mic'}
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: isBuyingRecordCharge ? 0 : 6 }}
                    />
                    <Text
                      className={`font-semibold ${
                        !selectedPackage || isBuyingRecordCharge || !selectedFolderId
                          ? 'text-gray-500'
                          : 'text-white'
                      }`}
                    >
                      {isBuyingRecordCharge ? 'Đang xử lý...' : 'Mua gói ghi âm'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Select Folder Modal */}
      <Modal
        visible={showSelectFolderDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSelectFolderDialog(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowSelectFolderDialog(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: 24,
                width: '90%',
                maxWidth: 400,
                maxHeight: '80%',
                paddingHorizontal: 20,
                paddingTop: 24,
                paddingBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="folder" size={20} color="#7C3AED" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 flex-1">
                      Chọn thư mục
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSelectFolderDialog(false)}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-600" style={{ marginLeft: 52 }}>
                  Vui lòng chọn thư mục để mua gói ghi âm
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 384 }}
              >
                <View>
                  {folders.map((folder, index) => (
                    <TouchableOpacity
                      key={folder.learnerRecordId}
                      onPress={() => {
                        setSelectedFolderId(folder.learnerRecordId);
                        setSelectedPackage(null);
                        setShowSelectFolderDialog(false);
                        setShowBuyRecordChargeDialog(true);
                      }}
                      className="flex-row items-center p-4 rounded-xl border-2 border-gray-200 bg-gray-50"
                      style={{
                        marginBottom: index < folders.length - 1 ? 8 : 0,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                      activeOpacity={0.7}
                    >
                      <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mr-3">
                        <Ionicons name="folder" size={24} color="#3B82F6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">
                          {folder.name}
                        </Text>
                        {folder.numberOfRecord !== undefined && folder.numberOfRecord !== null && (
                          <View className="mt-1" style={{ alignSelf: 'flex-start' }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#F3E8FF',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E9D5FF',
                              }}
                            >
                              <Ionicons name="mic" size={12} color="#7C3AED" style={{ marginRight: 4 }} />
                              <Text 
                                className="text-xs font-medium"
                                style={{ color: '#6B21A8' }}
                              >
                                {folder.numberOfRecord} lượt còn lại
                              </Text>
                            </View>
                          </View>
                        )}
                        {folder.status && (() => {
                          const statusStyle = getFolderStatusStyle(folder.status);
                          return (
                            <View className="mt-1" style={{ alignSelf: 'flex-start' }}>
                              <View
                                style={{
                                  borderWidth: 1,
                                  borderColor: statusStyle.borderColor,
                                  backgroundColor: statusStyle.backgroundColor,
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  borderRadius: 12,
                                }}
                              >
                                <Text 
                                  className="text-xs font-medium"
                                  style={{ color: statusStyle.textColor }}
                                >
                                  {getFolderStatusLabel(folder.status)}
                                </Text>
                              </View>
                            </View>
                          );
                        })()}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowSelectFolderDialog(false)}
                className="mt-4 py-3 bg-gray-100 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Hủy</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowActionMenu(false);
          setSelectedFolder(null);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowActionMenu(false);
            setSelectedFolder(null);
          }}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: Platform.OS === 'ios' ? 34 : 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 20,
            }}
          >
            {selectedFolder && (
              <>
                {/* Drag Handle */}
                <View className="items-center pt-3 pb-2">
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      backgroundColor: '#D1D5DB',
                      borderRadius: 2,
                    }}
                  />
                </View>

                {/* Header */}
                <View className="px-5 pt-2 pb-4 border-b border-gray-100">
                  <Text className="text-xl font-bold text-gray-900 mb-1" numberOfLines={2}>
                    {selectedFolder.name}
                  </Text>
                  <Text className="text-sm text-gray-500">Chọn hành động cho thư mục này</Text>
                </View>

                {/* Actions */}
                <View className="px-5 py-4">
                  <TouchableOpacity
                    onPress={() => {
                      setShowActionMenu(false);
                      if (selectedFolder) {
                        openBuyRecordChargeDialog(selectedFolder);
                      }
                      setSelectedFolder(null);
                    }}
                    className="flex-row items-center py-4 px-4 rounded-2xl mb-3"
                    style={{ backgroundColor: '#FAF5FF' }}
                    activeOpacity={0.7}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: '#F3E8FF' }}
                    >
                      <Ionicons name="mic" size={22} color="#9333EA" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 mb-0.5">Mua lượt ghi âm</Text>
                      <Text className="text-xs text-gray-500">Thêm lượt ghi âm cho thư mục</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowActionMenu(false);
                      if (selectedFolder) {
                        openRenameDialog(selectedFolder);
                      }
                      setSelectedFolder(null);
                    }}
                    className="flex-row items-center py-4 px-4 rounded-2xl mb-3"
                    style={{ backgroundColor: '#EFF6FF' }}
                    activeOpacity={0.7}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: '#DBEAFE' }}
                    >
                      <Ionicons name="create-outline" size={22} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 mb-0.5">Đổi tên</Text>
                      <Text className="text-xs text-gray-500">Thay đổi tên thư mục</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowActionMenu(false);
                      if (selectedFolder) {
                        handleDeleteFolder(selectedFolder.learnerRecordId);
                      }
                      setSelectedFolder(null);
                    }}
                    className="flex-row items-center py-4 px-4 rounded-2xl mb-3"
                    style={{ backgroundColor: '#FEF2F2' }}
                    activeOpacity={0.7}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: '#FEE2E2' }}
                    >
                      <Ionicons name="trash-outline" size={22} color="#DC2626" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-red-600 mb-0.5">Xóa thư mục</Text>
                      <Text className="text-xs text-gray-500">Xóa vĩnh viễn thư mục này</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setShowActionMenu(false);
                      setSelectedFolder(null);
                    }}
                    className="py-4 bg-gray-100 rounded-2xl items-center mt-2"
                    activeOpacity={0.7}
                    style={{
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <Text className="text-gray-700 font-bold text-base">Hủy</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default LearnerRecordFolderPage;

