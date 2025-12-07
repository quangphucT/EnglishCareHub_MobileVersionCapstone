import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import {
  useLearnerRecords,
  useLearnerRecordCreate,
  useLearnerRecordDelete,
} from '../../hooks/learner/learnerRecord/learnerRecordHook';
import type { Record } from '../../api/learnerRecord.service';

const LearnerRecordPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const folderId = (route.params as any)?.folderId || null;

  const [showCreateRecordDialog, setShowCreateRecordDialog] = useState(false);
  const [newRecordContent, setNewRecordContent] = useState('');
  const [feedbackRecord, setFeedbackRecord] = useState<Record | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Queries
  const { data: recordsData, isLoading: isLoadingRecords } = useLearnerRecords(folderId);

  // Mutations
  const { mutateAsync: createRecord, isPending: isCreatingRecord } = useLearnerRecordCreate();
  const { mutateAsync: deleteRecord, isPending: isDeletingRecord } = useLearnerRecordDelete();

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

  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return typeof dateString === 'string' ? dateString : dateString.toString();
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
              {getStatusBadge(item.status)}
              {hasAiFeedback && (
                <View className="px-2 py-0.5 rounded" style={{ backgroundColor: '#DBEAFE' }}>
                  <Text className="text-xs text-blue-600">Có phản hồi AI</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                item.content,
                'Chọn hành động',
                [
                  hasAiFeedback
                    ? {
                        text: 'Xem phản hồi AI',
                        onPress: () => setFeedbackRecord(item),
                      }
                    : null,
                  {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => handleDeleteRecord(item.recordId),
                  },
                  {
                    text: 'Hủy',
                    style: 'cancel',
                  },
                ].filter(Boolean) as any
              );
            }}
            className="p-2"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Audio Player */}
        {item.audioRecordingURL && (
          <TouchableOpacity
            onPress={() => handlePlayAudio(item.audioRecordingURL, item.recordId)}
            className="flex-row items-center bg-blue-50 rounded-lg p-3 mb-3"
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
              {item.score || 'N/A'}
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
            <Text className="text-white font-semibold">Quay lại</Text>
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
              className="flex-1 bg-green-600 rounded-xl p-4 flex-row items-center justify-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold text-base ml-2">Tạo record</Text>
            </TouchableOpacity>
            {selectedRecords.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  // Navigate to practice page
                  // navigation.navigate('PracticeRecord', { folderId });
                }}
                className="flex-1 bg-blue-600 rounded-xl p-4 flex-row items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-2">Học record</Text>
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
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="px-4 pt-4 pb-2 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-gray-900">Phản hồi AI</Text>
                <TouchableOpacity onPress={() => setFeedbackRecord(null)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {feedbackRecord?.content && (
                <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                  Nội dung: "{feedbackRecord.content}"
                </Text>
              )}
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
              {feedbackRecord?.aiFeedback ? (
                <View className="mb-4">
                  <Text className="text-sm leading-6 text-gray-700">
                    {feedbackRecord.aiFeedback}
                  </Text>
                </View>
              ) : (
                <View className="items-center py-8">
                  <Text className="text-sm text-gray-500">Chưa có phản hồi AI.</Text>
                </View>
              )}
            </ScrollView>

            <View className="px-4 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setFeedbackRecord(null)}
                className="py-3 bg-gray-100 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-medium">Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LearnerRecordPage;

