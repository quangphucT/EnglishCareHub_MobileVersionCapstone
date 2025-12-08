import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useLearnerReviewHistory } from '../../hooks/learner/feedback/feedbackHook';
import { useLearnerFeedback, useLearnerReportReview } from '../../hooks/learner/feedback/feedbackHook';
import type { LearnerReviewHistory } from '../../api/learnerFeedback.service';

const PAGE_SIZE = 10;

const AudioReviewScreen = () => {
  const navigation = useNavigation();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [status, setStatus] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<LearnerReviewHistory | null>(null);
  const [activeTab, setActiveTab] = useState<string>('feedback');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const apiStatus = status === 'all' ? '' : status;

  const { data, isLoading, isError, error } = useLearnerReviewHistory(
    pageNumber,
    PAGE_SIZE,
    apiStatus,
    searchKeyword
  );

  const { mutate: submitFeedback, isPending: isSubmittingFeedback } = useLearnerFeedback();
  const { mutate: submitReport, isPending: isSubmittingReport } = useLearnerReportReview();

  // Debounce keyword search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(keyword);
      setPageNumber(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Reset to first page when status filter changes
  useEffect(() => {
    setPageNumber(1);
  }, [status]);

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

  const reviews = useMemo(() => data?.data?.items ?? [], [data]);
  const totalItems = data?.data?.totalItems ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  const summaryStats = useMemo(() => {
    const completed = data?.data?.completed ?? reviews.filter((r) => r.status === 'Completed').length;
    const pending = data?.data?.pending ?? reviews.filter((r) => r.status === 'Pending' || r.status === 'InProgress').length;
    const rejected = data?.data?.rejected ?? reviews.filter((r) => r.status === 'Rejected').length;
    const total = data?.data?.totalItems ?? totalItems;
    return { completed, pending, rejected, total };
  }, [data, reviews, totalItems]);

  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const handleClearSearch = () => {
    setKeyword('');
    setSearchKeyword('');
    setPageNumber(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPageNumber(1);
  };

  const handleOpenRequest = (review: LearnerReviewHistory) => {
    setSelectedReview(review);
    setActiveTab('feedback');
    setFeedbackRating(5);
    setFeedbackContent('');
    setReportReason('');
    setIsRequestDialogOpen(true);
  };

  const handleSubmitFeedback = () => {
    if (!selectedReview || !feedbackContent.trim() || feedbackRating < 1 || feedbackRating > 5 || !selectedReview.reviewId) {
      return;
    }

    submitFeedback(
      {
        reviewId: selectedReview.reviewId,
        rating: feedbackRating,
        content: feedbackContent.trim(),
      },
      {
        onSuccess: () => {
          setIsRequestDialogOpen(false);
          setFeedbackContent('');
          setFeedbackRating(5);
          setSelectedReview(null);
        },
        onError: (error) => {
          console.error('Feedback submission error:', error);
        },
      }
    );
  };

  const handleSubmitReport = () => {
    if (!selectedReview || !reportReason.trim() || !selectedReview.reviewId) {
      return;
    }

    submitReport(
      {
        reviewId: selectedReview.reviewId,
        reason: reportReason.trim(),
      },
      {
        onSuccess: () => {
          setIsRequestDialogOpen(false);
          setReportReason('');
          setSelectedReview(null);
        },
        onError: (error) => {
          console.error('Report submission error:', error);
        },
      }
    );
  };

  const handlePlayAudio = async (audioUrl: string | null, reviewId: string) => {
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
      if (playingAudioId === reviewId) {
        setPlayingAudioId(null);
        return;
      }

      setPlayingAudioId(reviewId);
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

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (feedbackStatus: string) => {
    const statusMap: Record<string, { label: string; bg: string; text: string }> = {
      Approved: { label: 'Hoàn thành', bg: 'bg-green-50', text: 'text-green-700' },
      Pending: { label: 'Đang chờ', bg: 'bg-yellow-50', text: 'text-yellow-700' },
      Rejected: { label: 'Từ chối', bg: 'bg-red-50', text: 'text-red-700' },
      NotSent: { label: 'Chưa Gửi', bg: 'bg-gray-50', text: 'text-gray-700' },
    };

    const statusInfo = statusMap[feedbackStatus] || { label: feedbackStatus, bg: 'bg-gray-50', text: 'text-gray-700' };
    return (
      <View className={`px-3 py-1 rounded-full ${statusInfo.bg}`}>
        <Text className={`text-xs font-medium ${statusInfo.text}`}>{statusInfo.label}</Text>
      </View>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const startItem = totalItems === 0 ? 0 : (pageNumber - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(pageNumber * PAGE_SIZE, totalItems);

  const renderReviewItem = ({ item }: { item: LearnerReviewHistory }) => (
    <View className="border-b border-gray-200 p-4 bg-white" style={{ borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
      <View className="flex-row items-start justify-between mb-3">
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text className="text-xs text-gray-500 mb-1.5">{formatDate(item.createdAt)}</Text>
          <Text className="text-sm font-semibold text-gray-900 mb-2" numberOfLines={2} style={{ lineHeight: 20 }}>
            {item.questionContent || 'N/A'}
          </Text>
        </View>
        {getStatusBadge(item.feedbackStatus)}
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center" style={{ flex: 1 }}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text className="text-xs text-gray-600 ml-1.5" numberOfLines={1} style={{ flex: 1 }}>
            {item.reviewerFullName || 'Chưa có reviewer'}
          </Text>
        </View>
        <View className="flex-row items-center ml-3">
          <Ionicons name="star" size={18} color="#FBBF24" />
          <Text className={`text-base font-bold ml-1 ${getScoreColor(item.score)}`}>
            {item.score}/10
          </Text>
        </View>
      </View>

      {item.comment ? (
        <View className="mb-3">
          <Text className="text-sm text-gray-700" numberOfLines={2} style={{ lineHeight: 20 }}>
            {item.comment}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between mt-1">
        <View className="px-2.5 py-1 bg-gray-100 rounded-md">
          <Text className="text-xs text-gray-600 font-medium">
            {item.reviewType === 'Record' ? 'Record' : 'Learner Answer'}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {item.reviewAudioUrl && (
            <TouchableOpacity
              onPress={() => handlePlayAudio(item.reviewAudioUrl, item.reviewId)}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#DBEAFE',
                borderRadius: 18,
              }}
            >
              <Ionicons
                name={playingAudioId === item.reviewId ? 'pause' : 'play'}
                size={18}
                color="#3B82F6"
              />
            </TouchableOpacity>
          )}
          {item.feedbackStatus === 'NotSent' && (
            <TouchableOpacity
              onPress={() => handleOpenRequest(item)}
              disabled={item.status === 'Completed' || item.status === 'Rejected'}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: item.status === 'Completed' || item.status === 'Rejected' ? '#E5E7EB' : '#F3E8FF',
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: item.status === 'Completed' || item.status === 'Rejected' ? 0.5 : 1,
              }}
            >
              <Ionicons name="send" size={14} color="#7C3AED" />
              <Text className="text-xs font-medium text-purple-700 ml-1.5">Gửi đơn</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
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
            Lịch sử đánh giá
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Statistics Cards */}
          <View className="px-4 pt-4">
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
              <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                <View className="bg-white rounded-xl p-4 border-l-4 border-l-blue-500" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                  <Text className="text-xs text-gray-600 mb-1">Tổng số review</Text>
                  <Text className="text-2xl font-bold text-gray-900">{summaryStats.total}</Text>
                </View>
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                <View className="bg-white rounded-xl p-4 border-l-4 border-l-green-500" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                  <Text className="text-xs text-gray-600 mb-1">Đã hoàn thành</Text>
                  <Text className="text-2xl font-bold text-gray-900">{summaryStats.completed}</Text>
                </View>
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                <View className="bg-white rounded-xl p-4 border-l-4 border-l-yellow-500" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                  <Text className="text-xs text-gray-600 mb-1">Đang chờ</Text>
                  <Text className="text-2xl font-bold text-gray-900">{summaryStats.pending}</Text>
                </View>
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                <View className="bg-white rounded-xl p-4 border-l-4 border-l-red-500" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                  <Text className="text-xs text-gray-600 mb-1">Bị từ chối</Text>
                  <Text className="text-2xl font-bold text-gray-900">{summaryStats.rejected}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Filters */}
          <View className="px-4 mb-4">
            <View className="bg-white rounded-xl p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
              <Text className="text-base font-semibold text-gray-900 mb-4">Bộ lọc</Text>
              
              {/* Status Filter */}
              <View className="mb-4">
                <Text className="text-xs text-gray-600 mb-2.5">Trạng thái</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['all', 'Approved', 'NotSent', 'Pending', 'Rejected'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => handleStatusChange(s)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: status === s ? '#7C3AED' : '#F3F4F6',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '500',
                            color: status === s ? '#FFFFFF' : '#374151',
                          }}
                        >
                          {s === 'all'
                            ? 'Tất cả'
                            : s === 'Approved'
                            ? 'Hoàn thành'
                            : s === 'NotSent'
                            ? 'Chưa Gửi'
                            : s === 'Pending'
                            ? 'Đang chờ'
                            : 'Từ chối'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Search */}
              <View>
                <Text className="text-xs text-gray-600 mb-2.5">Tìm kiếm</Text>
                <View className="flex-row items-center bg-gray-50 rounded-lg px-3" style={{ height: 44 }}>
                  <Ionicons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    value={keyword}
                    onChangeText={setKeyword}
                    placeholder="Tìm kiếm theo câu hỏi, reviewer..."
                    style={{ flex: 1, paddingHorizontal: 8, fontSize: 14, color: '#111827' }}
                    placeholderTextColor="#9CA3AF"
                  />
                  {keyword ? (
                    <TouchableOpacity onPress={handleClearSearch} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          {/* Reviews List */}
          <View className="px-4 mb-4">
            <View className="bg-white rounded-xl overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
              <View className="px-4 py-3 border-b border-gray-200">
                <Text className="text-sm font-semibold text-gray-900">
                  Danh sách đánh giá ({reviews.length}/{totalItems})
                </Text>
              </View>

              {isError ? (
                <View className="items-center py-12 px-4">
                  <Ionicons name="alert-circle" size={56} color="#EF4444" />
                  <Text className="text-red-500 font-semibold mt-3 text-base">Không thể tải dữ liệu</Text>
                  <Text className="text-sm text-gray-500 mt-2 text-center">
                    {error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'}
                  </Text>
                </View>
              ) : isLoading ? (
                <View className="items-center justify-center py-20">
                  <ActivityIndicator size="large" color="#7C3AED" />
                  <Text className="text-gray-600 mt-4 text-base">Đang tải dữ liệu...</Text>
                </View>
              ) : reviews.length === 0 ? (
                <View className="items-center py-20 px-4">
                  <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                  </View>
                  <Text className="text-gray-500 font-semibold text-lg mt-2">Chưa có review nào</Text>
                  <Text className="text-sm text-gray-400 mt-2 text-center leading-5">
                    Các review của bạn sẽ hiển thị ở đây sau khi được reviewer chấm điểm
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={reviews}
                  renderItem={renderReviewItem}
                  keyExtractor={(item) => item.reviewId}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>

          {/* Pagination */}
          {totalItems > 0 && (
            <View className="px-4 pb-6">
              <View className="bg-white rounded-xl p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                <View className="mb-3">
                  <Text className="text-xs text-gray-600 text-center">
                    Hiển thị {startItem}-{endItem} trên {totalItems} review
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={handlePreviousPage}
                    disabled={pageNumber === 1 || isLoading}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: pageNumber === 1 || isLoading ? '#F3F4F6' : '#F3E8FF',
                      opacity: pageNumber === 1 || isLoading ? 0.6 : 1,
                    }}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={pageNumber === 1 || isLoading ? '#9CA3AF' : '#7C3AED'}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        marginLeft: 4,
                        color: pageNumber === 1 || isLoading ? '#9CA3AF' : '#7C3AED',
                      }}
                    >
                      Trước
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pageNumber <= 3) {
                        pageNum = i + 1;
                      } else if (pageNumber >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = pageNumber - 2 + i;
                      }
                      return (
                        <TouchableOpacity
                          key={pageNum}
                          onPress={() => setPageNumber(pageNum)}
                          disabled={isLoading}
                          style={{
                            width: 40,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 8,
                            backgroundColor: pageNumber === pageNum ? '#7C3AED' : '#F3F4F6',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '500',
                              color: pageNumber === pageNum ? '#FFFFFF' : '#374151',
                            }}
                          >
                            {pageNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    onPress={handleNextPage}
                    disabled={pageNumber === totalPages || isLoading}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: pageNumber === totalPages || isLoading ? '#F3F4F6' : '#F3E8FF',
                      opacity: pageNumber === totalPages || isLoading ? 0.6 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        marginRight: 4,
                        color: pageNumber === totalPages || isLoading ? '#9CA3AF' : '#7C3AED',
                      }}
                    >
                      Sau
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={pageNumber === totalPages || isLoading ? '#9CA3AF' : '#7C3AED'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Dialog gửi đơn với tabs */}
      <Modal
        visible={isRequestDialogOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRequestDialogOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[85%]">
              <View className="px-4 pt-4 pb-2 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-gray-900">Gửi đơn</Text>
                  <TouchableOpacity onPress={() => setIsRequestDialogOpen(false)}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-500 mt-1">
                  Chọn loại đơn bạn muốn gửi cho review này
                </Text>
              </View>

              {selectedReview && (
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                  <View className="px-4 pt-4">
                    {/* Review Info */}
                    <View className="bg-gray-50 rounded-lg p-4 mb-4">
                      <Text className="text-xs text-gray-500 mb-1">Câu hỏi:</Text>
                      <Text className="text-sm font-medium text-gray-800 mb-2" numberOfLines={2}>
                        {selectedReview.questionContent || 'N/A'}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                        <Text className="text-xs text-gray-600 ml-1">
                          {selectedReview.reviewerFullName || 'Reviewer ẩn danh'}
                        </Text>
                      </View>
                    </View>

                    {/* Tabs */}
                    <View className="flex-row bg-gray-100 rounded-lg p-1 mb-4">
                      <TouchableOpacity
                        onPress={() => setActiveTab('feedback')}
                        className={`flex-1 py-2 rounded-lg items-center ${
                          activeTab === 'feedback' ? 'bg-white shadow-sm' : ''
                        }`}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="star"
                            size={16}
                            color={activeTab === 'feedback' ? '#7C3AED' : '#6B7280'}
                          />
                          <Text
                            className={`text-sm font-medium ml-1 ${
                              activeTab === 'feedback' ? 'text-purple-700' : 'text-gray-600'
                            }`}
                          >
                            Gửi feedback
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setActiveTab('report')}
                        className={`flex-1 py-2 rounded-lg items-center ${
                          activeTab === 'report' ? 'bg-white shadow-sm' : ''
                        }`}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="chatbubble-outline"
                            size={16}
                            color={activeTab === 'report' ? '#7C3AED' : '#6B7280'}
                          />
                          <Text
                            className={`text-sm font-medium ml-1 ${
                              activeTab === 'report' ? 'text-purple-700' : 'text-gray-600'
                            }`}
                          >
                            Gửi report
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Tab Content */}
                    {activeTab === 'feedback' ? (
                      <View className="space-y-4">
                        <View>
                          <Text className="text-sm font-medium text-gray-700 mb-2">
                            Đánh giá (1-5)
                          </Text>
                          <View className="flex-row items-center gap-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <TouchableOpacity
                                key={rating}
                                onPress={() => setFeedbackRating(rating)}
                                className={`w-12 h-12 rounded-lg items-center justify-center ${
                                  feedbackRating === rating
                                    ? 'bg-purple-600'
                                    : 'bg-gray-100'
                                }`}
                              >
                                <Ionicons
                                  name="star"
                                  size={24}
                                  color={feedbackRating === rating ? '#FFFFFF' : '#9CA3AF'}
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-700 mb-2">
                            Nhận xét của bạn
                          </Text>
                          <TextInput
                            multiline
                            numberOfLines={4}
                            value={feedbackContent}
                            onChangeText={setFeedbackContent}
                            placeholder="Chia sẻ cảm nhận của bạn về chất lượng review..."
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[100px]"
                            placeholderTextColor="#9CA3AF"
                            textAlignVertical="top"
                          />
                        </View>
                      </View>
                    ) : (
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                          Lý do báo cáo *
                        </Text>
                        <TextInput
                          multiline
                          numberOfLines={4}
                          value={reportReason}
                          onChangeText={setReportReason}
                          placeholder="Mô tả chi tiết vấn đề bạn gặp phải với review này..."
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[100px]"
                          placeholderTextColor="#9CA3AF"
                          textAlignVertical="top"
                        />
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}

              {/* Footer */}
              <View className="px-4 py-4 border-t border-gray-200 flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setIsRequestDialogOpen(false)}
                  disabled={isSubmittingFeedback || isSubmittingReport}
                  className="flex-1 py-3 bg-gray-100 rounded-lg items-center"
                >
                  <Text className="text-sm font-medium text-gray-700">Hủy</Text>
                </TouchableOpacity>
                {activeTab === 'feedback' ? (
                  <TouchableOpacity
                    onPress={handleSubmitFeedback}
                    disabled={
                      !selectedReview ||
                      !feedbackContent.trim() ||
                      feedbackRating < 1 ||
                      feedbackRating > 5 ||
                      isSubmittingFeedback
                    }
                    className={`flex-1 py-3 rounded-lg items-center flex-row justify-center ${
                      !selectedReview ||
                      !feedbackContent.trim() ||
                      feedbackRating < 1 ||
                      feedbackRating > 5 ||
                      isSubmittingFeedback
                        ? 'bg-gray-300'
                        : 'bg-purple-600'
                    }`}
                  >
                    {isSubmittingFeedback && (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    )}
                    <Text
                      className={`text-sm font-medium ${
                        !selectedReview ||
                        !feedbackContent.trim() ||
                        feedbackRating < 1 ||
                        feedbackRating > 5 ||
                        isSubmittingFeedback
                          ? 'text-gray-500'
                          : 'text-white'
                      }`}
                    >
                      Gửi feedback
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleSubmitReport}
                    disabled={!selectedReview || !reportReason.trim() || isSubmittingReport}
                    className={`flex-1 py-3 rounded-lg items-center flex-row justify-center ${
                      !selectedReview || !reportReason.trim() || isSubmittingReport
                        ? 'bg-gray-300'
                        : 'bg-purple-600'
                    }`}
                  >
                    {isSubmittingReport && (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    )}
                    <Text
                      className={`text-sm font-medium ${
                        !selectedReview || !reportReason.trim() || isSubmittingReport
                          ? 'text-gray-500'
                          : 'text-white'
                      }`}
                    >
                      Gửi report
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default AudioReviewScreen;
