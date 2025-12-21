import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import {
  useLearnerRecords,
  useLearnerRecordCreate,
  useLearnerRecordDelete,
  useLearnerRecordUpdateContent,
} from '../../hooks/learner/learnerRecord/learnerRecordHook';
import type { Record, StatusRecord } from '../../api/learnerRecord.service';

const LearnerRecordPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const folderId = (route.params as any)?.folderId || null;

  const [showCreateRecordDialog, setShowCreateRecordDialog] = useState(false);
  const [newRecordContent, setNewRecordContent] = useState('');
  const [feedbackRecord, setFeedbackRecord] = useState<Record | null>(null);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Queries
  const { data: recordsData, isLoading: isLoadingRecords, refetch: refetchRecords } = useLearnerRecords(folderId);

  // Mutations
  const { mutateAsync: createRecord, isPending: isCreatingRecord } = useLearnerRecordCreate();
  const { mutateAsync: deleteRecord, isPending: isDeletingRecord } = useLearnerRecordDelete();
  const { mutateAsync: updateRecordContent, isPending: isUpdatingContent } = useLearnerRecordUpdateContent();

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (folderId) {
        refetchRecords();
      }
    }, [folderId, refetchRecords])
  );

  // Setup and cleanup audio
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Handle response structure
  const selectedRecords = (() => {
    if (!recordsData) return [];
    if (Array.isArray(recordsData.data)) {
      return recordsData.data;
    }
    if (recordsData.data && typeof recordsData.data === 'object' && 'recordId' in recordsData.data) {
      return [recordsData.data];
    }
    if (Array.isArray(recordsData)) {
      return recordsData;
    }
    return [];
  })();

  const handleCreateRecord = async () => {
    if (!folderId || !newRecordContent.trim()) return;

    try {
      await createRecord({
        folderId: folderId,
        content: newRecordContent.trim(),
      });
      setNewRecordContent('');
      setShowCreateRecordDialog(false);
    } catch (error) {
      // Error handled by hook
    }
  };
 console.log("Feedback record:", feedbackRecord)
  const handleDeleteRecord = async (recordId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa record này?',
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
              await deleteRecord(recordId);
            } catch (error) {
              // Error handled by hook
            }
          },
        },
      ]
    );
  };

  const handleEditRecord = (record: Record) => {
    setEditingRecord(record);
    setEditingContent(record.content);
  };

  const handleUpdateRecordContent = async () => {
    if (!editingRecord || !editingContent.trim()) return;

    try {
      await updateRecordContent({
        recordId: editingRecord.recordId,
        content: editingContent.trim(),
      });
      setEditingRecord(null);
      setEditingContent('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handlePlayAudio = async (audioUrl: string | null, recordId: string) => {
    if (!audioUrl) {
      Alert.alert('Không có audio', 'Bài này không có file âm thanh.');
      return;
    }

    try {
      // Stop current audio if playing
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // If clicking the same audio, stop it
      if (playingAudioId === recordId) {
        setPlayingAudioId(null);
        return;
      }

      setPlayingAudioId(recordId);
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Lỗi', 'Không thể phát audio. Vui lòng thử lại.');
      setPlayingAudioId(null);
    }
  };

  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return typeof dateString === 'string' ? dateString : (dateString?.toString() || 'N/A');
    }
  };
  // Map record status to Vietnamese
  const getRecordStatusLabel = (status: StatusRecord | string | undefined): string => {
    if (!status) return "";
    switch (status) {
      case "Draft":
        return "Nháp";
      case "Submitted":
        return "Đã nộp";
      default:
        return status;
    }
  };
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; bg: string; text: string } } = {
      Completed: { label: 'Hoàn thành', bg: 'bg-green-50', text: 'text-green-700' },
      Pending: { label: 'Đang chờ', bg: 'bg-yellow-50', text: 'text-yellow-700' },
      InProgress: { label: 'Đang xử lý', bg: 'bg-blue-50', text: 'text-blue-700' },
    };

    const statusInfo = statusMap[status] || { label: status, bg: 'bg-gray-50', text: 'text-gray-700' };
    return (
      <View className={`px-3 py-1 rounded-full ${statusInfo.bg}`}>
        <Text className={`text-xs font-medium ${statusInfo.text}`}>{statusInfo.label}</Text>
      </View>
    );
  };

  const renderRecordItem = ({ item }: { item: Record }) => {
    const hasAiFeedback = Boolean(item.aiFeedback && item.aiFeedback.trim());

    return (
      <View
        className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text className="text-base font-semibold text-gray-900 mb-2" numberOfLines={3}>
              {item.content}
            </Text>
            <View className="flex-row items-center gap-2 flex-wrap">
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#DBEAFE' }}>
                <Text className="text-xs font-medium text-blue-600">{getRecordStatusLabel(item.status)}</Text>
              </View>
              {hasAiFeedback && (
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: '#DBEAFE' }}>
                  <View className="flex-row items-center">
                    <Ionicons name="sparkles" size={12} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text className="text-xs font-medium text-blue-600">Có phản hồi AI</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedRecord(item);
              setShowActionMenu(true);
            }}
            className="p-2 rounded-full active:bg-gray-100"
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Audio Player */}
        {item.audioRecordingURL && (
          <TouchableOpacity
            onPress={() => handlePlayAudio(item.audioRecordingURL, item.recordId)}
            className="flex-row items-center  rounded-lg p-3 mb-3"
          >
            <Ionicons
              name={playingAudioId === item.recordId ? 'pause' : 'play'}
              size={24}
              color="#3B82F6"
            />
            <Text className="text-sm font-medium text-blue-700 ml-2">
              {playingAudioId === item.recordId ? 'Đang phát...' : 'Phát audio'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Record Info */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="#FBBF24" />
            <Text className="text-sm text-gray-600 ml-1">Điểm số:</Text>
            <Text className="text-sm font-semibold text-gray-900 ml-1">
              {item.score !== undefined && item.score !== null ? item.score : 0}/100
            </Text>
          </View>
        </View>

        <Text className="text-xs text-gray-500">Tạo lúc: {formatDate(item.createdAt)}</Text>
      </View>
    );
  };

  if (!folderId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-500 font-semibold text-lg mt-4 text-center">
            Chưa chọn thư mục
          </Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">
            Vui lòng chọn một thư mục để xem records
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-6 bg-blue-600 rounded-xl px-6 py-3"
          >
            <Text className="text-black font-semibold">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-gray-900 ml-4">Records</Text>
        </View>

        <View className="flex-1 px-4 pt-4">
          {/* Header Section */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-gray-900">Danh sách Records</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {selectedRecords.length} record trong thư mục này
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => setShowCreateRecordDialog(true)}
              className="flex-1 rounded-xl p-4 flex-row items-center justify-center"
              style={{
                backgroundColor: '#ECFDF5',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#059669" />
              <Text className="font-bold text-base ml-2" style={{ color: '#059669' }}>Tạo record</Text>
            </TouchableOpacity>
            {selectedRecords.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  // Navigate to practice page
                  navigation.navigate('LearnerRecordQuestion', { folderId });
                }}
                className="flex-1 rounded-xl p-4 flex-row items-center justify-center"
                style={{
                  backgroundColor: '#EFF6FF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="play" size={22} color="#2563EB" />
                <Text className="font-bold text-base ml-2" style={{ color: '#2563EB' }}>Học record</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Records List */}
          {isLoadingRecords ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-600 mt-4">Đang tải...</Text>
            </View>
          ) : selectedRecords.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View
                className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Ionicons name="musical-notes-outline" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 font-semibold text-lg mb-2">Chưa có record nào</Text>
              <Text className="text-sm text-gray-400 text-center px-8 mb-4">
                Tạo record mới để bắt đầu luyện tập
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateRecordDialog(true)}
                className="bg-green-600 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">Tạo record đầu tiên</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={selectedRecords}
              renderItem={renderRecordItem}
              keyExtractor={(item) => item.recordId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>

      {/* Create Record Modal */}
      <Modal
        visible={showCreateRecordDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateRecordDialog(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">Tạo record mới</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateRecordDialog(false);
                    setNewRecordContent('');
                  }}
                >
                  <Ionicons name="close" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Câu mà bạn muốn luyện tập
                </Text>
                <TextInput
                  value={newRecordContent}
                  onChangeText={setNewRecordContent}
                  placeholder="Nhập câu mà bạn muốn luyện tập"
                  multiline
                  numberOfLines={4}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                  autoFocus
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateRecordDialog(false);
                    setNewRecordContent('');
                  }}
                  className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
                >
                  <Text className="text-gray-700 font-medium">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateRecord}
                  disabled={!newRecordContent.trim() || isCreatingRecord}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${
                    !newRecordContent.trim() || isCreatingRecord
                      ? 'bg-gray-300'
                      : 'bg-green-600'
                  }`}
                >
                  {isCreatingRecord && (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  )}
                  <Text
                    className={`font-medium ${
                      !newRecordContent.trim() || isCreatingRecord
                        ? 'text-gray-500'
                        : 'text-white'
                    }`}
                  >
                    {isCreatingRecord ? 'Đang tạo...' : 'Tạo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* AI Feedback Modal */}
      <Modal
        visible={!!feedbackRecord}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackRecord(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setFeedbackRecord(null)}
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                minHeight: '75%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 16,
              }}
            >
              {/* Header */}
              <View className="px-4 pt-6 pb-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="sparkles" size={20} color="#9333EA" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 flex-1">
                      Phản hồi AI
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setFeedbackRecord(null)}
                    className="w-8 h-8 rounded-full items-center justify-center bg-gray-100"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                {feedbackRecord?.content && (
                  <View className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <Text className="text-xs font-medium text-gray-500 mb-1">Nội dung:</Text>
                    <Text className="text-sm text-gray-900" numberOfLines={3}>
                      "{feedbackRecord.content}"
                    </Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <ScrollView
                className="flex-1"
                style={{ maxHeight: 500 }}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ padding: 16 }}
              >
                {feedbackRecord?.aiFeedback ? (
                  <View className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="chatbubble-ellipses" size={18} color="#9333EA" />
                      <Text className="text-sm font-semibold text-purple-900 ml-2">
                        Phản hồi từ AI
                      </Text>
                    </View>
                    <Text className="text-base leading-6 text-gray-800">
                      {feedbackRecord.aiFeedback}
                    </Text>
                  </View>
                ) : (
                  <View className="items-center justify-center py-12">
                    <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                      <Ionicons name="document-text-outline" size={32} color="#9CA3AF" />
                    </View>
                    <Text className="text-base font-semibold text-gray-700 mb-1">
                      Chưa có phản hồi AI
                    </Text>
                    <Text className="text-sm text-gray-500 text-center px-8">
                      Phản hồi từ AI sẽ hiển thị ở đây khi có
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer */}
              {/* <View className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                <TouchableOpacity
                  onPress={() => setFeedbackRecord(null)}
                  className="py-3 bg-purple-600 rounded-xl items-center"
                  activeOpacity={0.8}
                  style={{
                    shadowColor: '#9333EA',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text className="text-white font-semibold text-base">Đóng</Text>
                </TouchableOpacity>
              </View> */}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Record Modal */}
      <Modal
        visible={!!editingRecord}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditingRecord(null);
          setEditingContent('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">Chỉnh sửa record</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingRecord(null);
                    setEditingContent('');
                  }}
                >
                  <Ionicons name="close" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Nội dung record
                </Text>
                <TextInput
                  value={editingContent}
                  onChangeText={setEditingContent}
                  placeholder="Nhập nội dung record"
                  multiline
                  numberOfLines={4}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                  autoFocus
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setEditingRecord(null);
                    setEditingContent('');
                  }}
                  className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
                >
                  <Text className="text-gray-700 font-medium">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateRecordContent}
                  disabled={!editingContent.trim() || isUpdatingContent}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${
                    !editingContent.trim() || isUpdatingContent
                      ? 'bg-gray-300'
                      : 'bg-blue-600'
                  }`}
                >
                  {isUpdatingContent && (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  )}
                  <Text
                    className={`font-medium ${
                      !editingContent.trim() || isUpdatingContent
                        ? 'text-gray-500'
                        : 'text-white'
                    }`}
                  >
                    {isUpdatingContent ? 'Đang cập nhật...' : 'Cập nhật'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowActionMenu(false);
          setSelectedRecord(null);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowActionMenu(false);
            setSelectedRecord(null);
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
            {selectedRecord && (
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
                    {selectedRecord.content}
                  </Text>
                  <Text className="text-sm text-gray-500">Chọn hành động cho record này</Text>
                </View>

                {/* Actions */}
                <View className="px-5 py-4">
                  <TouchableOpacity
                    onPress={() => {
                      setShowActionMenu(false);
                      if (selectedRecord) {
                        handleEditRecord(selectedRecord);
                      }
                      setSelectedRecord(null);
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
                      <Text className="text-base font-bold text-gray-900 mb-0.5">Chỉnh sửa</Text>
                      <Text className="text-xs text-gray-500">Thay đổi nội dung record</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  {selectedRecord.aiFeedback && selectedRecord.aiFeedback.trim() && (
                    <TouchableOpacity
                      onPress={() => {
                        setShowActionMenu(false);
                        if (selectedRecord) {
                          setFeedbackRecord(selectedRecord);
                        }
                        setSelectedRecord(null);
                      }}
                      className="flex-row items-center py-4 px-4 rounded-2xl mb-3"
                      style={{ backgroundColor: '#FAF5FF' }}
                      activeOpacity={0.7}
                    >
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: '#F3E8FF' }}
                      >
                        <Ionicons name="sparkles" size={22} color="#9333EA" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900 mb-0.5">
                          Xem phản hồi AI
                        </Text>
                        <Text className="text-xs text-gray-500">Đánh giá và gợi ý cải thiện</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setShowActionMenu(false);
                      if (selectedRecord) {
                        handleDeleteRecord(selectedRecord.recordId);
                      }
                      setSelectedRecord(null);
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
                      <Text className="text-base font-bold text-red-600 mb-0.5">Xóa record</Text>
                      <Text className="text-xs text-gray-500">Xóa vĩnh viễn record này</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setShowActionMenu(false);
                      setSelectedRecord(null);
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

export default LearnerRecordPage;

