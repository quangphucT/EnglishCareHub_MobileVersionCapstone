import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  AppState,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useLearnerReviewHistory } from '../../hooks/learner/feedback/feedbackHook';
import { useLearnerFeedback, useLearnerReportReview } from '../../hooks/learner/feedback/feedbackHook';
import type { LearnerReviewHistory } from '../../api/learnerFeedback.service';
import BuyReviewModal from '../../components/BuyReviewModal';

const PAGE_SIZE = 10;

// Internal component - không phụ thuộc vào navigation
const AudioReviewScreenContent = ({ onGoBack }: { onGoBack?: () => void }) => {
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [status, setStatus] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isBuyReviewModalOpen, setIsBuyReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<LearnerReviewHistory | null>(null);
  const [activeTab, setActiveTab] = useState<string>('feedback');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const appState = useRef(AppState.currentState);

  const apiStatus = status === 'all' ? '' : status;

  const { data, isLoading, isError, error, refetch } = useLearnerReviewHistory(
    pageNumber,
    PAGE_SIZE,
    apiStatus,
    searchKeyword
  );

  // Refetch dữ liệu và setup audio khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      
      // Setup audio mode mỗi khi screen được focus
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      }).catch(console.error);

      // Cleanup khi rời khỏi screen
      return () => {
        if (soundRef.current) {
          soundRef.current.stopAsync().catch(() => {});
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
        setPlayingAudioId(null);
        setIsAudioLoading(null);
      };
    }, [refetch])
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

  // Setup and cleanup audio + AppState listener
  useEffect(() => {
    // Setup audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // AppState listener - stop audio when app goes to background
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App going to background - stop audio
        if (soundRef.current) {
          soundRef.current.stopAsync().catch(() => {});
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
        setPlayingAudioId(null);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
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
        onSuccess: (data) => {
          Alert.alert('Thành công', data?.message || 'Feedback đã được gửi thành công.');
          setIsRequestDialogOpen(false);
          setFeedbackContent('');
          setFeedbackRating(5);
          setSelectedReview(null);
        },
        onError: (error: any) => {
          console.error('Feedback submission error:', error);
          const errorMessage = error?.message || 'Không thể gửi feedback. Vui lòng thử lại.';
          Alert.alert('Lỗi', errorMessage);
        },
      }
    );
  };

  const handleSubmitReport = () => {
    // Validation
    if (!selectedReview) {
      Alert.alert('Lỗi', 'Không tìm thấy review được chọn.');
      return;
    }

    if (!selectedReview.reviewId) {
      Alert.alert('Lỗi', 'Review ID không hợp lệ.');
      return;
    }

    if (!reportReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do báo cáo.');
      return;
    }

    if (reportReason.trim().length < 10) {
      Alert.alert('Lỗi', 'Lý do báo cáo phải có ít nhất 10 ký tự.');
      return;
    }

    // Submit report
    submitReport(
      {
        reviewId: selectedReview.reviewId,
        reason: reportReason.trim(),
      },
      {
        onSuccess: (data) => {
          Alert.alert('Thành công', data?.message || 'Báo cáo đã được gửi thành công.');
          setIsRequestDialogOpen(false);
          setReportReason('');
          setSelectedReview(null);
          setActiveTab('feedback'); // Reset về tab feedback
        },
        onError: (error: any) => {
          console.error('Report submission error:', error);
          const errorMessage = error?.message || error?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.';
          Alert.alert('Lỗi', errorMessage);
        },
      }
    );
  };

  const handlePlayAudio = async (audioUrl: string | null, reviewId: string) => {
    if (!audioUrl) {
      Alert.alert('Không có audio', 'Bài này không có file âm thanh.');
      return;
    }

    // Check if app is in foreground
    if (AppState.currentState !== 'active') {
      Alert.alert('Lỗi', 'Vui lòng mở app và thử lại.');
      return;
    }

    // Prevent double tap
    if (isAudioLoading) {
      return;
    }

    try {
      // If clicking the same audio, stop it
      if (playingAudioId === reviewId) {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (e) {
            // Ignore errors when stopping
          }
          soundRef.current = null;
        }
        setPlayingAudioId(null);
        return;
      }

      // Stop current audio if playing
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) {
          // Ignore errors when stopping previous audio
        }
        soundRef.current = null;
        setPlayingAudioId(null);
      }

      // Set loading state
      setIsAudioLoading(reviewId);

      // Setup audio mode trước khi phát
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Check again if app is still active
      if (AppState.currentState !== 'active') {
        setIsAudioLoading(null);
        return;
      }

      console.log('Playing audio from URL:', audioUrl);
      
      // Load audio trước
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: false,
          volume: 1.0,  // Đảm bảo volume max
        }
      );
      
      if (!status.isLoaded) {
        console.error('Audio failed to load');
        setIsAudioLoading(null);
        Alert.alert('Lỗi', 'Không thể tải audio. Vui lòng thử lại.');
        return;
      }

      soundRef.current = sound;

      // Setup callback trước khi play
      sound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
          setPlayingAudioId(null);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });

      // Check one more time before playing
      if (AppState.currentState !== 'active') {
        await sound.unloadAsync();
        soundRef.current = null;
        setIsAudioLoading(null);
        return;
      }

      // Delay nhỏ để đảm bảo audio system sẵn sàng
      await new Promise(resolve => setTimeout(resolve, 100));

      // Play sau khi đã setup xong
      await sound.playAsync();
      setPlayingAudioId(reviewId);
      setIsAudioLoading(null);
      
      console.log('Audio started playing successfully');
      
    } catch (error: any) {
      console.error('Error playing audio:', error, audioUrl);
      
      // Cleanup
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (e) {}
        soundRef.current = null;
      }
      
      setPlayingAudioId(null);
      setIsAudioLoading(null);
      
      // Show user-friendly error
      if (error?.message?.includes('background') || error?.message?.includes('AudioFocus')) {
        Alert.alert('Lỗi', 'Vui lòng đợi một chút rồi thử lại.');
      } else {
        Alert.alert('Lỗi', 'Không thể phát audio. Vui lòng thử lại.');
      }
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
      <View className={`px-3 py-1.5 rounded-full ${statusInfo.bg}`} style={{ flexShrink: 0 }}>
        <Text className={`text-xs font-medium ${statusInfo.text}`} numberOfLines={1}>
          {statusInfo.label}
        </Text>
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
      <View className="flex-row items-start justify-between mb-3" >
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
              disabled={isAudioLoading === item.reviewId}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: playingAudioId === item.reviewId ? '#BFDBFE' : '#DBEAFE',
                borderRadius: 18,
                opacity: isAudioLoading === item.reviewId ? 0.6 : 1,
              }}
            >
              {isAudioLoading === item.reviewId ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons
                  name={playingAudioId === item.reviewId ? 'pause' : 'play'}
                  size={18}
                  color="#3B82F6"
                />
              )}
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
          {onGoBack && (
            <TouchableOpacity onPress={onGoBack}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text className={`flex-1 text-xl font-bold text-gray-900 ${onGoBack ? 'ml-4' : ''}`}>
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
            <View
              className="bg-white rounded-t-3xl"
              style={{ maxHeight: '85%', flexDirection: 'column', flex: 1 }}
            >
              {/* Header */}
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

              {/* Review Info - Fixed at top */}
              {selectedReview && (
                <View className="px-4 pt-4">
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

                  {/* Tabs - Kiểu Login Screen */}
                  <View className="flex-row bg-gray-100 mb-4">
                    <TouchableOpacity
                      onPress={() => {
                        console.log('Switching to feedback tab');
                        setActiveTab('feedback');
                      }}
                      className="flex-1"
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={activeTab === 'feedback' ? ['#7C3AED', '#8B5CF6'] : ['transparent', 'transparent']}
                        className="py-3.5 rounded-xl flex-row items-center justify-center"
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons 
                          name="star" 
                          size={18} 
                          color={activeTab === 'feedback' ? '#FFFFFF' : '#9CA3AF'} 
                        />
                        <Text 
                          className="ml-2 font-semibold text-sm"
                          style={{ color: activeTab === 'feedback' ? '#FFFFFF' : '#9CA3AF' }}
                        >
                          Gửi feedback
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => {
                        console.log('Switching to report tab');
                        setActiveTab('report');
                      }}
                      className="flex-1"
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={activeTab === 'report' ? ['#EF4444', '#F87171'] : ['transparent', 'transparent']}
                        className="py-3.5 rounded-xl flex-row items-center justify-center"
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons 
                          name="flag" 
                          size={18} 
                          color={activeTab === 'report' ? '#FFFFFF' : '#9CA3AF'} 
                        />
                        <Text 
                          className="ml-2 font-semibold text-sm"
                          style={{ color: activeTab === 'report' ? '#FFFFFF' : '#9CA3AF' }}
                        >
                          Gửi report
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Scrollable Content - Only form content */}
              {selectedReview && (
                <ScrollView 
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  style={{ flex: 1 }}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="px-4">
                    {/* Tab Content */}
                    {activeTab === 'feedback' ? (
                      <View style={{ gap: 16 }}>
                        <View>
                          <Text className="text-sm font-medium text-gray-700 mb-2">
                            Đánh giá (1-5) *
                          </Text>
                          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 8 }}>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <TouchableOpacity
                                key={rating}
                                onPress={() => setFeedbackRating(rating)}
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 8,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: feedbackRating === rating ? '#7C3AED' : '#F3F4F6',
                                }}
                              >
                                <Ionicons
                                  name="star"
                                  size={24}
                                  color={feedbackRating === rating ? '#FFFFFF' : '#9CA3AF'}
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                          
                          {feedbackRating < 1 || feedbackRating > 5 ? (
                            <Text className="text-xs text-red-500 mt-1">
                              Vui lòng chọn đánh giá từ 1 đến 5
                            </Text>
                          ) : null}
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-700 mb-2">
                            Nhận xét của bạn *
                          </Text>
                          <TextInput
                            multiline
                            numberOfLines={4}
                            value={feedbackContent}
                            onChangeText={setFeedbackContent}
                            placeholder="Chia sẻ cảm nhận của bạn về chất lượng review..."
                            style={{
                              borderWidth: 1,
                              borderColor: '#E5E7EB',
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              fontSize: 14,
                              color: '#111827',
                              minHeight: 100,
                              backgroundColor: '#FFFFFF',
                            }}
                            placeholderTextColor="#9CA3AF"
                            textAlignVertical="top"
                          />
                          {!feedbackContent.trim() ? (
                            <Text className="text-xs text-red-500 mt-1">
                              Vui lòng nhập nhận xét
                            </Text>
                          ) : null}
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
                          style={{
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 14,
                            color: '#111827',
                            minHeight: 100,
                            backgroundColor: '#FFFFFF',
                          }}
                          placeholderTextColor="#9CA3AF"
                          textAlignVertical="top"
                        />
                        {!reportReason.trim() ? (
                          <Text className="text-xs text-red-500 mt-1">
                            Vui lòng nhập lý do báo cáo
                          </Text>
                        ) : reportReason.trim().length > 0 && reportReason.trim().length < 10 ? (
                          <Text className="text-xs text-yellow-600 mt-1">
                            Lý do báo cáo phải có ít nhất 10 ký tự (hiện tại: {reportReason.trim().length} ký tự)
                          </Text>
                        ) : null}
                        <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <View className="flex-row items-start">
                            <Ionicons name="information-circle" size={16} color="#3B82F6" style={{ marginTop: 2, marginRight: 8 }} />
                            <Text className="text-xs text-blue-700 flex-1">
                              Báo cáo sẽ được xem xét bởi đội ngũ quản trị. Vui lòng cung cấp thông tin chi tiết và chính xác.
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}

              {/* Footer - Always visible at bottom */}
              <View className="px-4 py-4 border-t border-gray-200 bg-white flex-row" style={{ gap: 8 }}>
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
                    disabled={
                      !selectedReview || 
                      !reportReason.trim() || 
                      reportReason.trim().length < 10 ||
                      isSubmittingReport
                    }
                    className={`flex-1 py-3 rounded-lg items-center flex-row justify-center ${
                      !selectedReview || 
                      !reportReason.trim() || 
                      reportReason.trim().length < 10 ||
                      isSubmittingReport
                        ? 'bg-gray-300'
                        : 'bg-purple-600'
                    }`}
                  >
                    {isSubmittingReport && (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    )}
                    <Text
                      className={`text-sm font-medium ${
                        !selectedReview || 
                        !reportReason.trim() || 
                        reportReason.trim().length < 10 ||
                        isSubmittingReport
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

      {/* Buy Review Modal */}
      <BuyReviewModal
        visible={isBuyReviewModalOpen}
        onClose={() => {
          setIsBuyReviewModalOpen(false);
          setSelectedReview(null);
        }}
        learnerAnswerId={selectedReview?.learnerAnswerId}
      />
    </SafeAreaView>
  );
};

// Wrapper component - nhận navigation prop từ React Navigation
// React Navigation tự động inject navigation, route vào screen components
const AudioReviewScreen = (props: any) => {
  // React Navigation inject navigation prop vào screen components
  // Nếu không có, có thể component được render bên ngoài Stack Navigator
  const navigation = props?.navigation || props?.route?.params?.navigation;
  
  // Debug: log để kiểm tra
  React.useEffect(() => {
    if (!navigation) {
      console.warn('[AudioReviewScreen] Navigation prop not found. Props:', Object.keys(props || {}));
    }
  }, [navigation, props]);
  
  const handleGoBack = React.useCallback(() => {
    if (!navigation) {
      console.warn('[AudioReviewScreen] Cannot go back: navigation not available');
      return;
    }

    try {
      if (typeof navigation.goBack === 'function') {
        // Kiểm tra canGoBack nếu có
        if (navigation.canGoBack && typeof navigation.canGoBack === 'function') {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // Không thể goBack, thử navigate về Home
            if (typeof navigation.navigate === 'function') {
              navigation.navigate('Home');
            }
          }
        } else {
          // Không có canGoBack, thử goBack trực tiếp
          navigation.goBack();
        }
      } else if (typeof navigation.navigate === 'function') {
        // Fallback: navigate về Home
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('[AudioReviewScreen] Navigation error:', error);
    }
  }, [navigation]);

  // Chỉ truyền onGoBack nếu có navigation
  return <AudioReviewScreenContent onGoBack={navigation ? handleGoBack : undefined} />;
};

export default AudioReviewScreen;
