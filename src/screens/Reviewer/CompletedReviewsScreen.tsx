import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import Sound from "react-native-sound";
import {
  useReviewReviewHistory,
  useReviewerTipAfterReview,
} from "../../hooks/reviewer/useReviewerReview";

type ReviewCard = {
  id: string;
  question: string;
  comment: string;
  score: number;
  status: string;
  reviewType: string;
  createdAt: string | Date;
  audioUrl?: string;
};

const PAGE_SIZE = 10;

const statusConfig: Record<
  "Approved" | "Rejected" | "Pending" | "Other",
  { label: string; color: string; bg: string }
> = {
  Approved: { label: "Đã duyệt", color: "text-green-700", bg: "bg-green-50" },
  Rejected: { label: "Bị từ chối", color: "text-red-700", bg: "bg-red-50" },
  Pending: { label: "Đang chờ", color: "text-amber-600", bg: "bg-amber-50" },
  Other: { label: "Đang xử lý", color: "text-slate-600", bg: "bg-slate-100" },
};

const CompletedReviewsScreen: React.FC = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useReviewReviewHistory(
    pageNumber,
    PAGE_SIZE
  );
  const tipMutation = useReviewerTipAfterReview();
  const audioPlayerRef = useRef<Sound | null>(null);
  const [playingReviewId, setPlayingReviewId] = useState<string | null>(null);

  useEffect(() => {
    Sound.setCategory("Playback", true);
    return () => {
      audioPlayerRef.current?.release();
      audioPlayerRef.current = null;
    };
  }, []);

  const reviews = useMemo<ReviewCard[]>(() => {
    const items = data?.data?.items ?? [];
    return items.map(item => ({
      id: item.reviewId,
      question: item.questionContent,
      comment: item.comment,
      score: item.score,
      status: (item.status as ReviewCard["status"]) || "Pending",
      reviewType: item.reviewType || "Sentence",
      createdAt: item.createdAt,
      audioUrl: item.learnerAudioUrl,
    }));
  }, [data]);

  const pagination = useMemo(() => {
    const totalItems = data?.data?.totalItems ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const start =
      totalItems > 0 ? (pageNumber - 1) * PAGE_SIZE + 1 : 0;
    const end = Math.min(pageNumber * PAGE_SIZE, totalItems);
    return { totalItems, totalPages, start, end };
  }, [data, pageNumber]);

  const handlePlayAudio = useCallback((audioUrl?: string, reviewId?: string) => {
    if (!audioUrl || !reviewId) {
      Alert.alert("Không có audio", "Bài này không có file âm thanh.");
      return;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop(() => {
        audioPlayerRef.current?.release();
      });
      audioPlayerRef.current = null;
      setPlayingReviewId(null);
    }
    const sound = new Sound(audioUrl, undefined, error => {
      if (error) {
        console.error("❌ [AUDIO] Failed to load audio:", error);
        Alert.alert("Không thể phát audio", "Vui lòng thử lại sau.");
        return;
      }
      audioPlayerRef.current = sound;
      setPlayingReviewId(reviewId);
      sound.play(success => {
        if (!success) {
          Alert.alert("Không thể phát audio", "Luồng phát bị gián đoạn.");
        }
        sound.release();
        if (audioPlayerRef.current === sound) {
          audioPlayerRef.current = null;
        }
        setPlayingReviewId(null);
      });
    });
  }, []);

  const openTipModal = useCallback((reviewId: string) => {
    setSelectedReviewId(reviewId);
    setTipAmount("");
    setTipMessage("");
    setIsTipModalVisible(true);
  }, []);

  const closeTipModal = useCallback(() => {
    setIsTipModalVisible(false);
    setSelectedReviewId(null);
    setTipAmount("");
    setTipMessage("");
  }, []);

  const handleSubmitTip = useCallback(async () => {
    if (!selectedReviewId) {
      Alert.alert("Thiếu thông tin", "Không xác định được bài review.");
      return;
    }
    const amount = Number(tipAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      Alert.alert("Số coin không hợp lệ", "Vui lòng nhập số coin lớn hơn 0.");
      return;
    }
    try {
      await tipMutation.mutateAsync({
        reviewId: selectedReviewId,
        amountCoin: amount,
        message: tipMessage.trim() || "Cảm ơn bạn vì bài làm!",
      });
      closeTipModal();
    } catch (mutationError) {
      console.error("Tip error:", mutationError);
    }
  }, [closeTipModal, selectedReviewId, tipAmount, tipMessage, tipMutation]);

  const renderReviewCard = (review: ReviewCard) => {
    const statusKey =
      (statusConfig as any)[review.status] ? review.status : "Other";
    const statusStyle =
      statusConfig[statusKey as keyof typeof statusConfig];

    return (
      <View
        key={review.id}
        className="bg-white rounded-3xl p-5 mb-4 border border-slate-100 shadow-sm"
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-3">
            <Text className="text-xs font-semibold text-blue-600">
              {review.reviewType}
            </Text>
            <Text className="text-base font-semibold text-slate-900 mt-1">
              {review.question}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.color}`}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3">
          <View className="px-3 py-1 rounded-full bg-slate-100">
            <Text className="text-xs font-semibold text-slate-700">
              Điểm: {review.score}/10
            </Text>
          </View>
          <Text className="text-xs text-slate-500 ml-3">
            {dayjs(review.createdAt).format("DD/MM/YYYY HH:mm")}
          </Text>
        </View>

        <Text className="text-sm text-slate-600 mt-3">
          {review.comment || "Không có nhận xét thêm."}
        </Text>

        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity
            activeOpacity={0.8}
            className={`flex-row items-center px-4 py-2 rounded-2xl ${
              review.audioUrl
                ? "bg-slate-100"
                : "bg-slate-100 opacity-60"
            }`}
            disabled={!review.audioUrl}
            onPress={() => handlePlayAudio(review.audioUrl, review.id)}
          >
            <Ionicons
              name={
                playingReviewId === review.id ? "pause" : "play"
              }
              size={16}
              color="#0f172a"
            />
            <Text className="ml-2 text-sm font-semibold text-slate-800">
              {playingReviewId === review.id
                ? "Đang phát..."
                : review.audioUrl
                ? "Nghe audio"
                : "Không có audio"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-row items-center px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 bg-slate-100 border border-slate-200 to-blue-600 hover:bg-slate-200 transition-colors duration-200 active:bg-slate-200"
            onPress={() => openTipModal(review.id)}
            disabled={tipMutation.isPending}
          >
            <Ionicons name="gift" size={16} color="#0f172a" />
            <Text className="ml-2 text-sm font-semibold text-black">
              Tip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4">
          <Text className="text-2xl font-bold text-slate-900">
            Bài đã đánh giá
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
            Theo dõi các bài bạn đã review và gửi thưởng cho học viên
          </Text>
        </View>

        {isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-3 text-sm text-slate-500">
              Đang tải dữ liệu...
            </Text>
          </View>
        ) : error ? (
          <View className="py-16 items-center">
            <Ionicons name="alert-circle" size={40} color="#ef4444" />
            <Text className="mt-3 text-sm text-red-500 text-center">
              Không thể tải dữ liệu: {error.message}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-4 px-4 py-2 rounded-full border border-slate-200"
            >
              <Text className="text-sm font-semibold text-slate-700">
                Thử lại
              </Text>
            </TouchableOpacity>
          </View>
        ) : reviews.length === 0 ? (
          <View className="py-16 items-center">
            <Ionicons name="document-text" size={40} color="#94a3b8" />
            <Text className="mt-3 text-sm text-slate-500">
              Bạn chưa đánh giá bài nào.
            </Text>
          </View>
        ) : (
          <View className="mt-4">{reviews.map(renderReviewCard)}</View>
        )}

        {reviews.length > 0 ? (
          <View className="flex-row items-center justify-between mt-4 mb-4">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPageNumber(prev => Math.max(1, prev - 1))}
              disabled={pageNumber === 1}
              className={`px-4 py-2 rounded-full border ${
                pageNumber === 1
                  ? "border-slate-100 bg-slate-100"
                  : "border-slate-200 bg-white"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  pageNumber === 1 ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Trước
              </Text>
            </TouchableOpacity>

            <Text className="text-xs text-slate-500">
              {pagination.start}-{pagination.end} / {pagination.totalItems}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setPageNumber(prev =>
                  Math.min(pagination.totalPages, prev + 1)
                )
              }
              disabled={pageNumber >= pagination.totalPages}
              className={`px-4 py-2 rounded-full border ${
                pageNumber >= pagination.totalPages
                  ? "border-slate-100 bg-slate-100"
                  : "border-slate-200 bg-white"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  pageNumber >= pagination.totalPages
                    ? "text-slate-300"
                    : "text-slate-700"
                }`}
              >
                Tiếp
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={isTipModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeTipModal}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-slate-900">
                Gửi tip cho học viên
              </Text>
              <TouchableOpacity
                onPress={closeTipModal}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">
                  Số coin muốn tip
                </Text>
                <TextInput
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 20"
                  className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">
                  Lời nhắn (không bắt buộc)
                </Text>
                <TextInput
                  value={tipMessage}
                  onChangeText={setTipMessage}
                  placeholder="Ví dụ: Bài làm rất tốt!"
                  className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmitTip}
              disabled={tipMutation.isPending}
              className={`mt-6 rounded-2xl py-3 items-center ${
                tipMutation.isPending
                  ? "bg-slate-200"
                  : "bg-gradient-to-r from-purple-600 to-blue-600"
              }`}
            >
              {tipMutation.isPending ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text className="text-black font-semibold text-base border border-slate-200 rounded-2xl px-4 py-2 hover:bg-slate-200 transition-colors duration-200 active:bg-slate-200">
                  Gửi tip
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CompletedReviewsScreen;
