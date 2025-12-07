import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Sound from "react-native-sound";
import dayjs from "dayjs";
import {
  useReviewReviewPending,
  useReviewReviewSubmit,
  useReviewReviewStatistics,
} from "../../hooks/reviewer/useReviewerReview";
import { useReviewFeedback } from "../../hooks/reviewer/useReviewerFeedback";
import { useGetMeQuery } from "../../hooks/useGetMe";
import { ReviewCompleted, signalRService } from "../../utils/realtime";
import { useRealtime } from "../../utils/realtimeProvider";

type PendingReview = {
  id: string;
  question: string;
  audioUrl: string;
  submittedAt: string;
  learnerFullName: string;
  type: string;
  aiFeedback: string;
  numberOfReview: number;
};

const PENDING_PAGE_SIZE = 5;
const FEEDBACK_PAGE_SIZE = 6;

export default function ReviewerReviewScreen() {
  const [pendingPageNumber, setPendingPageNumber] = useState(1);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(
    null
  );
  const [comment, setComment] = useState("");
  const [score, setScore] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showAiFeedback, setShowAiFeedback] = useState(false);
  const [reviewedAnswers, setReviewedAnswers] = useState<string[]>([]);
  const [numberOfReviewUpdates, setNumberOfReviewUpdates] = useState<
    Record<string, number>
  >({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackPageNumber, setFeedbackPageNumber] = useState(1);

  const {
    data: pendingReviewsData,
    isLoading: isPendingLoading,
    error: pendingError,
  } = useReviewReviewPending(pendingPageNumber, PENDING_PAGE_SIZE);
  const { data: statsData } = useReviewReviewStatistics();
  const {
    data: feedbackData,
    isLoading: isFeedbackLoading,
  } = useReviewFeedback(feedbackPageNumber, FEEDBACK_PAGE_SIZE);
  const { data: userData } = useGetMeQuery();
  const submitReviewMutation = useReviewReviewSubmit();
  const { isConnected } = useRealtime();
  const modalScrollRef = useRef<ScrollView>(null);
  const audioPlayerRef = useRef<Sound | null>(null);

  useEffect(() => {
    Sound.setCategory("Playback", true);
    return () => {
      audioPlayerRef.current?.release();
      audioPlayerRef.current = null;
    };
  }, []);
  const handlePlayAudio = useCallback(
    async (audioUrl?: string) => {
      if (!audioUrl) {
        Alert.alert("Không có audio", "Bài này không có file audio đính kèm.");
        return;
      }

      setIsAudioLoading(true);
      try {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.stop(() => {
            audioPlayerRef.current?.release();
            audioPlayerRef.current = null;
          });
        }

        const sound = new Sound(audioUrl, undefined, (error?: Error) => {
          if (error) {
            console.error("❌ [AUDIO] Failed to load audio:", error);
            Alert.alert("Không thể phát audio", "Vui lòng thử lại sau.");
            setIsAudioLoading(false);
            return;
          }

          audioPlayerRef.current = sound;
          sound.setVolume(1);
          sound.play((success: boolean) => {
            if (!success) {
              console.warn("⚠️ [AUDIO] Playback was interrupted");
              Alert.alert("Không thể phát audio", "Luồng phát bị gián đoạn.");
            }
            sound.release();
            if (audioPlayerRef.current === sound) {
              audioPlayerRef.current = null;
            }
            setIsAudioLoading(false);
          });
        });
      } catch (error) {
        console.error("❌ [AUDIO] Failed to play audio:", error);
        Alert.alert("Không thể phát audio", "Vui lòng thử lại sau.");
        setIsAudioLoading(false);
      }
    },
    []
  );

  const pendingReviews: PendingReview[] = useMemo(() => {
    const items = pendingReviewsData?.data?.items ?? [];
    return items.map((item) => ({
      id: item.id,
      question: item.questionText,
      audioUrl: item.audioUrl,
      submittedAt: dayjs(item.submittedAt).format("DD/MM/YYYY"),
      learnerFullName: item.learnerFullName,
      type: item.type,
      aiFeedback: item.aiFeedback,
      numberOfReview:
        numberOfReviewUpdates[item.id] ?? item.numberOfReview ?? 0,
    }));
  }, [pendingReviewsData, numberOfReviewUpdates]);

  const availableReviews = useMemo(
    () => pendingReviews.filter((review) => !reviewedAnswers.includes(review.id)),
    [pendingReviews, reviewedAnswers]
  );

  const pendingPagination = useMemo(() => {
    const totalItems = pendingReviewsData?.data?.totalItems ?? 0;
    const totalPages = Math.ceil(totalItems / PENDING_PAGE_SIZE) || 1;
    return {
      totalItems,
      totalPages,
      currentPage: pendingPageNumber,
    };
  }, [pendingReviewsData, pendingPageNumber]);

  const pendingStartItem =
    pendingPagination.totalItems === 0
      ? 0
      : (pendingPageNumber - 1) * PENDING_PAGE_SIZE + 1;
  const pendingEndItem = Math.min(
    pendingPageNumber * PENDING_PAGE_SIZE,
    pendingPagination.totalItems
  );

  const feedbackItems = useMemo(
    () => feedbackData?.data?.items ?? [],
    [feedbackData]
  );

  const feedbackPagination = useMemo(() => {
    const totalItems = feedbackData?.data?.totalItems ?? 0;
    const totalPages = Math.ceil(totalItems / FEEDBACK_PAGE_SIZE) || 1;
    return {
      totalItems,
      totalPages,
      currentPage: feedbackPageNumber,
    };
  }, [feedbackData, feedbackPageNumber]);

  const handleOpenReviewModal = useCallback(
    (review: PendingReview) => {
      setSelectedReview(review);
      setComment("");
      setScore("");
      setShowAiFeedback(false);
      setIsModalVisible(true);
      setIsSubmittingReview(false);
      requestAnimationFrame(() => {
        modalScrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedReview(null);
    setComment("");
    setScore("");
    setShowAiFeedback(false);
    setIsSubmittingReview(false);
  }, []);

  const handleReviewCompleted = useCallback(
    (review: ReviewCompleted) => {
      if (!review.learnerAnswerId) return;
      if (review.remaining === 0) {
        setReviewedAnswers((prev) =>
          prev.includes(review.learnerAnswerId)
            ? prev
            : [...prev, review.learnerAnswerId]
        );
      } else {
        setNumberOfReviewUpdates((prev) => ({
          ...prev,
          [review.learnerAnswerId]: review.remaining,
        }));
      }
    },
    []
  );

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    signalRService.setReviewCompletedHandler(handleReviewCompleted);
    return () => signalRService.setReviewCompletedHandler(null);
  }, [isConnected, handleReviewCompleted]);

  const handleSubmitReview = useCallback(async () => {
    if (!selectedReview) return;

    const trimmedComment = comment.trim();
    const parsedScore = Number(score);

    if (!trimmedComment) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập nhận xét.");
      return;
    }

    if (
      Number.isNaN(parsedScore) ||
      parsedScore < 1 ||
      parsedScore > 10 ||
      !Number.isInteger(parsedScore)
    ) {
      Alert.alert("Điểm không hợp lệ", "Điểm phải là số nguyên từ 1 đến 10.");
      return;
    }

    if (!userData?.reviewerProfile?.reviewerProfileId) {
      Alert.alert("Thiếu thông tin", "Không tìm thấy tài khoản Reviewer.");
      return;
    }

    try {
      setIsSubmittingReview(true);
      await submitReviewMutation.mutateAsync({
        learnerAnswerId:
          selectedReview.type === "Record" ? null : selectedReview.id,
        recordId: selectedReview.type === "Record" ? selectedReview.id : null,
        reviewerProfileId: userData.reviewerProfile.reviewerProfileId,
        score: parsedScore,
        comment: trimmedComment,
        recordAudioUrl: null,
      });

      setReviewedAnswers((prev) => [...prev, selectedReview.id]);
      Alert.alert("Thành công", "Bạn đã đánh giá bài làm này.");
      handleCloseModal();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Gửi đánh giá thất bại.");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [
    comment,
    score,
    selectedReview,
    userData,
    submitReviewMutation,
    handleCloseModal,
  ]);

  const renderPendingItem = ({ item }: { item: PendingReview }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 shadow-sm"
      activeOpacity={0.9}
      onPress={() => handleOpenReviewModal(item)}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-base font-semibold text-slate-900">
            {item.learnerFullName}
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            Gửi ngày {item.submittedAt}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="people" size={16} color="#64748B" />
          <Text className="text-xs text-slate-500 ml-1">
            {item.numberOfReview} reviewer
          </Text>
        </View>
      </View>
      <Text className="text-sm text-slate-700 mb-3" numberOfLines={3}>
        {item.question}
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="mic" size={16} color="#2563EB" />
          <Text className="text-xs text-slate-500 ml-2">
            {item.type === "Record" ? "Thu âm" : "Câu trả lời"}
          </Text>
        </View>
        <Text className="text-sm font-medium text-blue-600">
          Nhấn để đánh giá
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderListHeader = () => {
    const stats = [
      {
        label: "Cần đánh giá",
        value: pendingReviewsData?.data?.totalItems ?? 0,
        icon: "time-outline" as const,
        color: "#2563EB",
      },
      {
        label: "Đã hoàn thành",
        value: statsData?.data?.totalReviews ?? 0,
        icon: "checkmark-done-outline" as const,
        color: "#16A34A",
      },
      {
        label: "Điểm trung bình",
        value: (statsData?.data?.averageRating ?? 0).toFixed(1),
        icon: "star-outline" as const,
        color: "#F59E0B",
      },
    ];

    return (
      <View className="px-5 pt-5">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xl font-semibold text-slate-900">
              Quản lý bài đánh giá
            </Text>
            <Text className="text-sm text-slate-500 mt-1">
              Theo dõi và chấm điểm câu trả lời của học viên
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${
              isConnected ? "bg-green-100" : "bg-slate-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isConnected ? "text-green-700" : "text-slate-500"
              }`}
            >
              {isConnected ? "Realtime ON" : "Realtime OFF"}
            </Text>
          </View>
        </View>
        <View className="flex-row -mx-1 mb-6">
          {stats.map((stat) => (
            <View key={stat.label} className="flex-1 mx-1">
              <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <View className="w-10 h-10 rounded-full items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}1A` }}>
                  <Ionicons name={stat.icon} size={18} color={stat.color} />
                </View>
                <Text className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </Text>
                <Text className="text-xs text-slate-500 mt-1">
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-between bg-blue-50 rounded-2xl px-4 py-3 mb-4"
          onPress={() => setShowFeedbackModal(true)}
        >
          <View>
            <Text className="text-sm font-semibold text-blue-900">
              Xem phản hồi của học viên
            </Text>
            <Text className="text-xs text-blue-700 mt-1">
              Tổng cộng {feedbackPagination.totalItems} phản hồi
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#1D4ED8" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-slate-900 mb-2">
          Bài cần đánh giá
        </Text>
      </View>
    );
  };

  const renderListFooter = () => {
    if (pendingPagination.totalItems === 0) {
      return null;
    }

    return (
      <View className="px-5 pb-8">
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-xs text-slate-500">
            Hiển thị {pendingStartItem}-{pendingEndItem} /{" "}
            {pendingPagination.totalItems}
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              className="px-3 py-2 rounded-full border border-slate-200 mr-2"
              activeOpacity={0.8}
              onPress={() =>
                setPendingPageNumber((prev) => Math.max(1, prev - 1))
              }
              disabled={pendingPageNumber === 1 || isPendingLoading}
            >
              <Text
                className={`text-sm ${
                  pendingPageNumber === 1
                    ? "text-slate-300"
                    : "text-slate-700"
                }`}
              >
                Trước
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-2 rounded-full border border-slate-200"
              activeOpacity={0.8}
              onPress={() =>
                setPendingPageNumber((prev) =>
                  Math.min(pendingPagination.totalPages, prev + 1)
                )
              }
              disabled={
                pendingPageNumber >= pendingPagination.totalPages ||
                isPendingLoading
              }
            >
              <Text
                className={`text-sm ${
                  pendingPageNumber >= pendingPagination.totalPages
                    ? "text-slate-300"
                    : "text-slate-700"
                }`}
              >
                Tiếp
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const [recording, setRecording] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioBlobMp3Ref = useRef<Blob | null>(null); // Store recorded audio blob
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const updateRecordingState = useCallback(() => {
    if (recording) {
      setRecording(false);
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    } else {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "recording"
      ) {
        audioChunksRef.current = [];
        setRecording(true);
        mediaRecorderRef.current.start();
      }
    }
  }, [recording]);

  // Pulse animation when recording
  useEffect(() => {
    if (recording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recording, pulseAnim]);
  // Initialize MediaRecorder on component mount
  useEffect(() => {
    const constraints: MediaStreamConstraints = {
      audio: { channelCount: 1, sampleRate: 48000 },
    };
    
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        
        mr.ondataavailable = (ev) => {
          // Some browsers use ev.data.size
          if (ev.data && ev.data.size > 0) {
            audioChunksRef.current.push(ev.data);
          }
        };
        
        mr.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/ogg" });
          const blobMp3 = new Blob(audioChunksRef.current, { type: "audio/mp3" });
          recordedAudioBlobMp3Ref.current = blobMp3; // Store blob for later upload
          console.log("Recording stopped, blob stored:", blobMp3.size, "bytes");
        };
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        data={availableReviews}
        keyExtractor={(item) => item.id}
        renderItem={renderPendingItem}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-24">
            {isPendingLoading ? (
              <ActivityIndicator size="large" color="#2563EB" />
            ) : pendingError ? (
              <Text className="text-sm text-red-500 px-6 text-center">
                Không thể tải danh sách: {pendingError.message}
              </Text>
            ) : (
              <View className="items-center">
                <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
                <Text className="mt-3 text-sm text-slate-500 px-6 text-center">
                  Bạn đã hoàn thành tất cả bài đánh giá!
                </Text>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      />

      {/* Review modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 bg-black/40 justify-center px-4">
          <View className="bg-white rounded-3xl p-5 max-h-[85%]">
            <ScrollView
              ref={modalScrollRef}
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-semibold text-slate-900">
                    {selectedReview?.question}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    {selectedReview?.learnerFullName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {selectedReview?.audioUrl ? (
              <TouchableOpacity
                className="mt-5 flex-row items-center bg-blue-50 rounded-2xl px-4 py-3"
                activeOpacity={0.8}
                onPress={() => handlePlayAudio(selectedReview.audioUrl)}
                disabled={isAudioLoading}
              >
                <Ionicons
                  name="play-circle"
                  size={28}
                  color={isAudioLoading ? "#94A3B8" : "#1D4ED8"}
                />
                  <View className="ml-3">
                    <Text className="text-sm font-semibold text-blue-900">
                    {isAudioLoading ? "Đang tải audio..." : "Phát audio của học viên"}
                    </Text>
                    <Text className="text-xs text-blue-700 mt-0.5">
                    Nhấn để nghe trực tiếp trong ứng dụng
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View className="mt-5 bg-slate-100 rounded-2xl px-4 py-3">
                  <Text className="text-sm text-slate-600">
                    Câu trả lời dạng văn bản. Không có file audio đính kèm.
                  </Text>
                </View>
              )}

              <View className="mt-5">
                <Text className="text-sm font-medium text-slate-700 mb-2">
                  Nhận xét
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholder="Nhập nhận xét chi tiết cho học viên"
                  className="border border-slate-200 rounded-2xl p-3 text-sm"
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-medium text-slate-700 mb-2">
                  Điểm số (1 - 10)
                </Text>
                <TextInput
                  value={score}
                  onChangeText={setScore}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 8"
                  className="border border-slate-200 rounded-2xl p-3 text-sm w-32"
                />
              </View>

              {selectedReview?.aiFeedback ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="mt-4"
                  onPress={() => setShowAiFeedback((prev) => !prev)}
                >
                  <View className="flex-row items-center justify-between bg-slate-100 rounded-2xl px-4 py-3">
                    <Text className="text-sm font-semibold text-slate-800 text-black">
                      {showAiFeedback ? "Ẩn" : "Hiện"} phản hồi từ AI
                    </Text>
                    <Ionicons
                      name={showAiFeedback ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#0F172A"
                    />
                  </View>
                  {showAiFeedback && (
                    <View className="mt-3 bg-white border border-slate-200 rounded-2xl p-3">
                      <Text className="text-sm text-slate-600 leading-relaxed">
                        {selectedReview.aiFeedback}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : null}

              <View className="flex-row justify-end items-center mt-6">
                <TouchableOpacity
                  onPress={updateRecordingState}
                  disabled={
                    !mediaRecorderRef.current ||
                    submitReviewMutation.isPending ||
                    isSubmittingReview
                  }
                  activeOpacity={0.8}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 6,
                    borderColor: '#FFFFFF',
                    backgroundColor: recording ? '#477c5b' : '#49d67d',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                    opacity: (!mediaRecorderRef.current ||
                      submitReviewMutation.isPending ||
                      isSubmittingReview) ? 0.5 : 1,
                  }}
                >
                  <Animated.View
                    style={{
                      opacity: recording ? pulseAnim : 1,
                    }}
                  >
                    <Ionicons
                      name="mic"
                      size={40}
                      color="#FFFFFF"
                    />
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-3 rounded-2xl border border-slate-200 mr-3 ml-4"
                  activeOpacity={0.8}
                  onPress={handleCloseModal}
                  disabled={isSubmittingReview || submitReviewMutation.isPending}
                >
                  <Text className="text-sm font-semibold text-slate-700">
                    Đóng
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-5 py-3 rounded-2xl bg-blue-600"
                  activeOpacity={0.8}
                  onPress={handleSubmitReview}
                  disabled={
                    isSubmittingReview || submitReviewMutation.isPending
                  }
                >
                  <Text className="text-sm font-semibold text-white">
                    {isSubmittingReview || submitReviewMutation.isPending
                      ? "Đang gửi..."
                      : "Hoàn thành"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Feedback modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-3xl p-5 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-slate-900">
                Phản hồi của học viên
              </Text>
              <TouchableOpacity
                onPress={() => setShowFeedbackModal(false)}
                className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isFeedbackLoading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              ) : feedbackItems.length === 0 ? (
                <View className="py-10 items-center">
                  <Text className="text-sm text-slate-500">
                    Chưa có phản hồi nào.
                  </Text>
                </View>
              ) : (
                feedbackItems.map((item) => (
                  <View
                    key={item.feedbackId}
                    className="border border-slate-100 rounded-2xl p-4 mb-3 bg-slate-50"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-semibold text-slate-900">
                        {item.learnerName}
                      </Text>
                    <Text className="text-xs text-slate-500">
                      {dayjs(item.createdAt).format("DD/MM/YYYY")}
                    </Text>
                    </View>
                    <Text className="text-sm text-slate-600 mb-2">
                      {item.content}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-slate-500">
                        {item.reviewType || "Đánh giá"}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text className="text-xs font-semibold text-slate-600 ml-1">
                          {item.rating}/5
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {feedbackPagination.totalPages > 1 && (
              <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <TouchableOpacity
                  className="px-3 py-2 rounded-full border border-slate-200"
                  activeOpacity={0.8}
                  onPress={() =>
                    setFeedbackPageNumber((prev) => Math.max(1, prev - 1))
                  }
                  disabled={feedbackPageNumber === 1 || isFeedbackLoading}
                >
                  <Text
                    className={`text-sm ${
                      feedbackPageNumber === 1
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Trang trước
                  </Text>
                </TouchableOpacity>
                <Text className="text-xs text-slate-500">
                  Trang {feedbackPagination.currentPage}/
                  {feedbackPagination.totalPages}
                </Text>
                <TouchableOpacity
                  className="px-3 py-2 rounded-full border border-slate-200"
                  activeOpacity={0.8}
                  onPress={() =>
                    setFeedbackPageNumber((prev) =>
                      Math.min(feedbackPagination.totalPages, prev + 1)
                    )
                  }
                  disabled={
                    feedbackPageNumber >= feedbackPagination.totalPages ||
                    isFeedbackLoading
                  }
                >
                  <Text
                    className={`text-sm ${
                      feedbackPageNumber >= feedbackPagination.totalPages
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Trang sau
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

