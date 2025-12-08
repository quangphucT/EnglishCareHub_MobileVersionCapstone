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
} from '../../hooks/learner/learnerRecord/learnerRecordHook';
import type { Record, RecordCategory } from '../../api/learnerRecord.service';

const LearnerRecordFolderPage = () => {
  const navigation = useNavigation();
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [folderToRename, setFolderToRename] = useState<RecordCategory | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderName, setRenamingFolderName] = useState('');

  // Queries
  const { data: foldersData, isLoading: isLoadingFolders } = useLearnerRecordFolders();

  // Mutations
  const { mutateAsync: createFolder, isPending: isCreatingFolder } = useLearnerRecordFolderCreate();
  const { mutateAsync: deleteFolder, isPending: isDeletingFolder } = useLearnerRecordFolderDelete();
  const { mutateAsync: renameFolder, isPending: isRenamingFolder } = useLearnerRecordFolderRename();

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
            {item.status && (
              <View className="mt-1">
                <View
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#F3F4F6', alignSelf: 'flex-start' }}
                >
                  <Text className="text-xs text-gray-600">{item.status}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            // Show action menu
            Alert.alert(
              item.name,
              'Chọn hành động',
              [
                {
                  text: 'Đổi tên',
                  onPress: () => openRenameDialog(item),
                },
                {
                  text: 'Xóa',
                  style: 'destructive',
                  onPress: () => handleDeleteFolder(item.learnerRecordId),
                },
                {
                  text: 'Hủy',
                  style: 'cancel',
                },
              ]
            );
          }}
          className="p-2"
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
            className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base ml-2">Tạo thư mục mới</Text>
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
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">Tạo thư mục mới</Text>
                <TouchableOpacity onPress={() => setShowCreateFolderDialog(false)}>
                  <Ionicons name="close" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Tên thư mục
                </Text>
                <TextInput
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Nhập tên thư mục"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                  onSubmitEditing={handleCreateFolder}
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
            </View>
          </View>
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
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-1">Đổi tên thư mục</Text>
                <Text className="text-sm text-gray-500">Nhập tên mới cho thư mục</Text>
              </View>

              <View className="mb-6">
                <TextInput
                  value={renamingFolderName}
                  onChangeText={setRenamingFolderName}
                  placeholder="Tên thư mục mới"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                  onSubmitEditing={handleRenameFolder}
                  returnKeyType="done"
                />
              </View>

              <View className="flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowRenameDialog(false);
                    setFolderToRename(null);
                    setRenamingFolderName('');
                  }}
                  className="px-6 py-3 bg-gray-100 rounded-xl"
                >
                  <Text className="text-gray-700 font-medium">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRenameFolder}
                  disabled={!renamingFolderName.trim() || isRenamingFolder}
                  className={`px-6 py-3 rounded-xl flex-row items-center ${
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
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default LearnerRecordFolderPage;

