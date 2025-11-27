import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import {
  useGetPlacementTest,
  useSubmitTestAssessment,
} from "../../hooks/learner/placementTest/placementTestHooks";
import { useAuthRefresh } from "../../navigation/AppNavigator";
import { useLogout } from "../../hooks/useAuth";
import { useGetMeQuery } from "../../hooks/useGetMe";

type RecordingStatus = "idle" | "recording" | "completed";

interface ResultsAfterTest {
  averageScore: number;
  assignedLevel: string;
}


export default function PlacementTestScreen() {
  const { refreshAuth } = useAuthRefresh();
  const logoutMutation = useLogout();
  // API Hooks
  const { data: testData, isLoading } = useGetPlacementTest();
  const { data: getMe } = useGetMeQuery();
  const { mutate: submitPlacementTest } = useSubmitTestAssessment();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("idle");
  const [recorded, setRecorded] = useState<boolean[]>([]);
  const [recordingAttempts, setRecordingAttempts] = useState<number[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [resultsAfterTest, setResultsAfterTest] =useState<ResultsAfterTest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recording refs
  const recording = useRef<Audio.Recording | null>(null);
  const audioRecordedRef = useRef<Audio.Sound | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // AI results storage
  const [pronunciationScores, setPronunciationScores] = useState<number[]>([]);
  const [pronunciationAccuracy, setPronunciationAccuracy] = useState<string[]>(
    []
  );
  const [ipaTranscripts, setIpaTranscripts] = useState<string[]>([]);
  const [realIpaTranscripts, setRealIpaTranscripts] = useState<string[]>([]);
  const [coloredContents, setColoredContents] = useState<string[]>([]);

  // AI API config (cần thêm vào .env)
  const apiMainPathSTS = process.env.EXPO_PUBLIC_AI_STS_API_URL;
  const STScoreAPIKey = process.env.EXPO_PUBLIC_AI_STS_API_KEY || "";
  const AILanguage = process.env.EXPO_PUBLIC_AI_STS_LANGUAGE || "en";

  // Flatten all questions from sections
  const allQuestions = useMemo(() => {
    if (!testData?.data?.sections) return [];

    const questions: Array<{
      id: string;
      content: string;
      type: string;
      sectionType: string;
    }> = [];

    const typeOrder = ["word", "sentence", "paragraph"];
    const sortedSections = [...testData.data.sections].sort((a, b) => {
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    });

    sortedSections.forEach((section) => {
      section.questions.forEach((question) => {
        questions.push({
          id: question.questionAssessmentId,
          content: question.content,
          type: section.type,
          sectionType: section.type,
        });
      });
    });

    return questions;
  }, [testData]);

  const totalQuestions = allQuestions.length;
  const currentQuestion = allQuestions[currentQuestionIndex];

  // Initialize arrays when questions load
  useEffect(() => {
    if (allQuestions.length > 0 && recorded.length === 0) {
      setRecorded(new Array(allQuestions.length).fill(false));
      setRecordingAttempts(new Array(allQuestions.length).fill(0));
      setPronunciationScores(new Array(allQuestions.length).fill(0));
      setPronunciationAccuracy(new Array(allQuestions.length).fill(""));
      setIpaTranscripts(new Array(allQuestions.length).fill(""));
      setRealIpaTranscripts(new Array(allQuestions.length).fill(""));
      setColoredContents(new Array(allQuestions.length).fill(""));
    }
  }, [allQuestions, recorded.length]);

  // Request audio permissions
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền microphone",
          "Vui lòng cấp quyền microphone để sử dụng tính năng này."
        );
      }
    })();
  }, []);

  const convertBlobToBase64 = useCallback(
    async (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    },
    []
  );

  const handleStartRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = newRecording;
      setRecordingStatus("recording");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể bắt đầu ghi âm.");
      console.error(error);
    }
  };
  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await refreshAuth();
      },
    });
  };
  const handleStopRecording = async () => {
    if (!recording.current) return;

    if (!currentQuestion) {
      Alert.alert("Lỗi", "Không tìm thấy câu hỏi");
      return;
    }

    try {
      setIsProcessingAudio(true);
      setRecordingStatus("completed");

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();

      if (!uri) {
        Alert.alert("Lỗi", "Không có file ghi âm");
        setIsProcessingAudio(false);
        return;
      }

      // Load sound for playback
      const { sound } = await Audio.Sound.createAsync({ uri });
      audioRecordedRef.current = sound;

      // Convert to blob for API
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await convertBlobToBase64(blob);

      if (!base64 || base64.length < 6) {
        setIsProcessingAudio(false);
        return;
      }

      // Call AI API
      const text = currentQuestion.content;
      const payload = {
        title: text,
        base64Audio: base64,
        language: AILanguage,
      };

      if (!apiMainPathSTS) {
        console.warn("AI API URL not configured");
        // Mark as recorded without AI analysis
        const newRecorded = [...recorded];
        newRecorded[currentQuestionIndex] = true;
        setRecorded(newRecorded);

        const newScores = [...pronunciationScores];
        newScores[currentQuestionIndex] = 50; // Default score
        setPronunciationScores(newScores);

        setIsProcessingAudio(false);
        return;
      }

      const res = await fetch(
        apiMainPathSTS + "/GetAccuracyFromRecordedAudio",
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": STScoreAPIKey,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      const acc = parseFloat(data.pronunciation_accuracy);

      // Store results
      const newAccuracy = [...pronunciationAccuracy];
      newAccuracy[currentQuestionIndex] = `${data.pronunciation_accuracy}%`;
      setPronunciationAccuracy(newAccuracy);

      const newScores = [...pronunciationScores];
      newScores[currentQuestionIndex] = acc;
      setPronunciationScores(newScores);

      const newIpa = [...ipaTranscripts];
      newIpa[currentQuestionIndex] = `/ ${data.ipa_transcript} /`;
      setIpaTranscripts(newIpa);

      const newRealIpa = [...realIpaTranscripts];
      newRealIpa[currentQuestionIndex] = data.real_transcripts_ipa
        ? `/ ${data.real_transcripts_ipa} /`
        : "";
      setRealIpaTranscripts(newRealIpa);

      // Color code words
      const isLetterCorrectAll: string[] = String(
        data.is_letter_correct_all_words || ""
      ).split(" ");
      const words = text.split(" ");
      let coloredWords = "";

      for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
        const word = words[wordIdx];
        const lettersMask = isLetterCorrectAll[wordIdx] || "";
        let wordTemp = "";

        for (let letterIdx = 0; letterIdx < word.length; letterIdx++) {
          const ok = lettersMask[letterIdx] === "1";
          const color = ok ? "#10B981" : "#EF4444";
          wordTemp += `<span style="color: ${color}">${word[letterIdx]}</span>`;
        }
        coloredWords += ` ${wordTemp}`;
      }

      const newColored = [...coloredContents];
      newColored[currentQuestionIndex] = coloredWords.trim();
      setColoredContents(newColored);

      const newRecorded = [...recorded];
      newRecorded[currentQuestionIndex] = true;
      setRecorded(newRecorded);

      // Tăng số lần ghi âm
      const newAttempts = [...recordingAttempts];
      newAttempts[currentQuestionIndex] =
        (newAttempts[currentQuestionIndex] || 0) + 1;
      setRecordingAttempts(newAttempts);

      setIsProcessingAudio(false);
    } catch (error) {
      setRecordingStatus("idle");
      setIsProcessingAudio(false);

      // Still mark as recorded so user can continue
      const newRecorded = [...recorded];
      newRecorded[currentQuestionIndex] = true;
      setRecorded(newRecorded);

      const newScores = [...pronunciationScores];
      newScores[currentQuestionIndex] = 50; // Default score on error
      setPronunciationScores(newScores);

      // Tăng số lần ghi âm kể cả khi lỗi
      const newAttempts = [...recordingAttempts];
      newAttempts[currentQuestionIndex] =
        (newAttempts[currentQuestionIndex] || 0) + 1;
      setRecordingAttempts(newAttempts);

      Alert.alert(
        "Cảnh báo",
        "Không thể phân tích phát âm, nhưng bản ghi đã được lưu. Bạn có thể tiếp tục.",
        [{ text: "OK" }]
      );
    }
  };

  const handleRecord = () => {
    const currentAttempts = recordingAttempts[currentQuestionIndex] || 0;

    if (recordingStatus === "recording") {
      handleStopRecording();
    } else {
      // Kiểm tra số lần ghi âm
      if (currentAttempts >= 2) {
        Alert.alert(
          "Đã hết lượt ghi âm",
          "Bạn đã ghi âm 2 lần cho câu này. Vui lòng chọn bản ghi tốt nhất và tiếp tục.",
          [{ text: "OK" }]
        );
        return;
      }
      handleStartRecording();
    }
  };

  const playRecording = async () => {
    if (!audioRecordedRef.current) return;

    try {
      setIsPlayingAudio(true);

      // Reset về đầu file trước khi phát
      await audioRecordedRef.current.setPositionAsync(0);
      await audioRecordedRef.current.playAsync();
      audioRecordedRef.current.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      setIsPlayingAudio(false);
      Alert.alert("Lỗi", "Không thể phát lại bản ghi âm");
    }
  };

  const handleSubmitTest = async () => {
    if (
      !testData?.data?.assessmentId ||
      !getMe?.learnerProfile?.learnerProfileId
    ) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
      return;
    }
    setIsSubmitting(true);

    try {
      const sectionMap = new Map<string, typeof allQuestions>();

      allQuestions.forEach((question) => {
        if (!sectionMap.has(question.sectionType)) {
          sectionMap.set(question.sectionType, []);
        }
        sectionMap.get(question.sectionType)!.push(question);
      });

      const tests = Array.from(sectionMap.entries()).map(
        ([type, questions]) => ({
          type,
          assessmentDetails: questions.map((q) => {
            const questionIndex = allQuestions.findIndex(
              (aq) => aq.id === q.id
            );
            return {
              questionAssessmentId: q.id,
              score: pronunciationScores[questionIndex] || 0,
              aI_Feedback: pronunciationAccuracy[questionIndex] || "",
            };
          }),
        })
      );

      const payload = {
        learnerProfileId: getMe.learnerProfile.learnerProfileId,
        numberOfQuestion: totalQuestions,
        tests,
      };

      submitPlacementTest(payload, {
        onSuccess: (data) => {
          if (data.data) {
            setResultsAfterTest(data.data);
          }
        },
        onError: (error: any) => {
          Alert.alert("Lỗi", error.message || "Không thể nộp bài");
        },
      });
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi nộp bài");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!recorded[currentQuestionIndex]) {
      Alert.alert("Chưa ghi âm", "Vui lòng ghi âm trước khi tiếp tục");
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRecordingStatus("idle");
    } else {
      setDone(true);
      handleSubmitTest();
    }
  };

  const handleNavigateDashboard = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refreshAuth();
  
    } catch (error: any) {
    
      setTimeout(() => {
        Alert.alert(
          "Lỗi",
          `Không thể cập nhật thông tin: ${error.message || "Vui lòng thử lại"}`
        );
      }, 100);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="mt-4 text-gray-600 text-base">
          Đang tải bài test...
        </Text>
      </View>
    );
  }

  const getProgress = () => {
    return ((currentQuestionIndex + (done ? 1 : 0)) / totalQuestions) * 100;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        {/* Header */}
       {/* <View>
        <TouchableOpacity
          onPress={handleLogout}
          className="mt-6 bg-purple-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-black font-semibold">Quay lại</Text>
        </TouchableOpacity>
      </View>  */}

    
        <View
          className="px-6 pt-12 pb-6"
          style={{
            backgroundColor: "#7C3AED",
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-2xl font-bold">
                Placement Test
              </Text>
              <Text className="text-white/90 text-sm mt-1">
                {currentQuestion.sectionType.toUpperCase()}
              </Text>
            </View>
            <View className="bg-white/20 rounded-full px-4 py-2">
              <Text className="text-white font-bold">
                {currentQuestionIndex + 1}/{totalQuestions}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="bg-white/30 h-2 rounded-full overflow-hidden">
            <View
              className="h-2 bg-white rounded-full"
              style={{ width: `${getProgress()}%` }}
            />
          </View>
          <Text className="text-white/90 text-xs mt-2">
            {Math.round(getProgress())}% hoàn thành
          </Text>
        </View>

        {!done ? (
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Processing Status */}
            {isProcessingAudio && (
              <View className="mt-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="ml-3 text-blue-900 font-semibold">
                    Đang phân tích âm thanh...
                  </Text>
                </View>
              </View>
            )}

            {/* Question Content */}
            <View className="mt-6 bg-white rounded-3xl p-3 border-2 border-gray-200 shadow-lg">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
                Nội dung cần đọc
              </Text>
              <Text className="text-2xl font-bold text-gray-900 leading-relaxed text-center">
                {currentQuestion.content}
              </Text>
            </View>

            {/* Recording Controls - TOP */}
            <View className="mt-6 bg-slate-50 rounded-3xl p-6 border-2 border-gray-200">
              <View className="items-center mb-4">
                <View
                  className={`px-4 py-2 rounded-full ${
                    recordingStatus === "recording"
                      ? "bg-red-100"
                      : recorded[currentQuestionIndex]
                        ? "bg-green-100"
                        : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      recordingStatus === "recording"
                        ? "text-red-700"
                        : recorded[currentQuestionIndex]
                          ? "text-green-700"
                          : "text-gray-700"
                    }`}
                  >
                    {recordingStatus === "recording"
                      ? "● Đang ghi âm..."
                      : recorded[currentQuestionIndex]
                        ? "✓ Đã hoàn thành"
                        : "Sẵn sàng ghi âm"}
                  </Text>
                </View>

                {/* Hiển thị số lần ghi âm còn lại */}
                <View className="mt-2 bg-blue-50 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-blue-700">
                    Còn {2 - (recordingAttempts[currentQuestionIndex] || 0)}/2
                    lượt
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleRecord}
                disabled={isProcessingAudio && recordingStatus !== "recording"}
                className="items-center mb-4"
                style={{
                  opacity:
                    (recordingAttempts[currentQuestionIndex] || 0) >= 2 &&
                    recordingStatus !== "recording"
                      ? 0.5
                      : 1,
                }}
              >
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor:
                      recordingStatus === "recording"
                        ? "#EF4444"
                        : recorded[currentQuestionIndex]
                          ? "#10B981"
                          : "#7C3AED",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 10,
                  }}
                >
                  <Ionicons
                    name={
                      recordingStatus === "recording"
                        ? "stop"
                        : recorded[currentQuestionIndex]
                          ? "checkmark"
                          : "mic"
                    }
                    size={40}
                    color="white"
                  />
                </View>
              </TouchableOpacity>

              <Text className="text-center text-base font-semibold text-gray-900 mb-1">
                {recordingStatus === "recording"
                  ? "Nhấn để dừng ghi âm"
                  : (recordingAttempts[currentQuestionIndex] || 0) >= 2
                    ? "Đã hết lượt ghi âm"
                    : recorded[currentQuestionIndex]
                      ? `Bạn có thể ghi lại (${2 - (recordingAttempts[currentQuestionIndex] || 0)} lượt)`
                      : "Nhấn để bắt đầu"}
              </Text>
              <Text className="text-center text-sm text-gray-600">
                {recordingStatus === "recording"
                  ? "Đọc rõ ràng vào microphone"
                  : (recordingAttempts[currentQuestionIndex] || 0) >= 2
                    ? "Vui lòng tiếp tục câu tiếp theo"
                    : "Bạn có 2 lần ghi âm cho mỗi câu"}
              </Text>
            </View>

            {/* Results Display */}
            {pronunciationAccuracy[currentQuestionIndex] && (
              <View className="mt-6 bg-green-50 rounded-2xl p-5 border-2 border-green-200">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white text-2xl">✓</Text>
                  </View>
                  <View>
                    <Text className="text-sm text-gray-600">Độ chính xác</Text>
                    <Text className="text-3xl font-bold text-green-600">
                      {pronunciationAccuracy[currentQuestionIndex]}
                    </Text>
                  </View>
                </View>

                {ipaTranscripts[currentQuestionIndex] && (
                  <View className="bg-white/70 rounded-xl p-3 mb-2">
                    <Text className="text-xs font-semibold text-gray-600 mb-1">
                       Phát âm của bạn
                    </Text>
                    <Text className="text-sm font-mono text-gray-800">
                      {ipaTranscripts[currentQuestionIndex]}
                    </Text>
                  </View>
                )}

                {realIpaTranscripts[currentQuestionIndex] && (
                  <View className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <Text className="text-xs font-semibold text-blue-700 mb-1">
                       Phát âm chuẩn
                    </Text>
                    <Text className="text-sm font-mono text-blue-900">
                      {realIpaTranscripts[currentQuestionIndex]}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Play Recording Button */}
            {recorded[currentQuestionIndex] && (
              <TouchableOpacity
                onPress={playRecording}
                disabled={isPlayingAudio}
                className="mt-4  rounded-full items-center mb-32"
                style={{ opacity: isPlayingAudio ? 0.5 : 1 }}
              >
                <Text className="text-gray-900 font-bold text-base">
                  {isPlayingAudio
                    ? "▶ Đang phát..."
                    : "▶ Nghe lại bản ghi âm"}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-6 py-8">
            <View className="bg-white rounded-3xl p-8 border border-gray-200">
              {isSubmitting || !resultsAfterTest ? (
                <View className="items-center py-12">
                  <View className="mb-6">
                    <ActivityIndicator size="large" color="#7C3AED" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 mb-2">
                    {isSubmitting ? "Đang nộp bài..." : "Đang xử lý kết quả..."}
                  </Text>
                  <Text className="text-gray-600 text-center px-4">
                    Vui lòng đợi trong giây lát
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
                    Chúc mừng bạn!
                  </Text>
                  <Text className="text-gray-600 text-center mb-6">
                    Bạn đã hoàn thành bài kiểm tra đầu vào
                  </Text>

                  {resultsAfterTest && (
                    <View className="bg-blue-50 rounded-2xl p-6 mb-6">
                      <Text className="text-xl font-semibold text-gray-800 mb-4 text-center">
                        Kết quả của bạn
                      </Text>

                      <View className="items-center mb-4">
                        <Text className="text-gray-700 text-base mb-2">
                          Điểm trung bình:
                        </Text>
                        <Text className="text-5xl font-bold text-blue-600">
                          {resultsAfterTest.averageScore.toFixed(1)}
                        </Text>
                        <Text className="text-gray-500 text-xl">/100</Text>
                      </View>

                      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <Text className="text-sm text-gray-600 mb-2 text-center">
                          Trình độ của bạn:
                        </Text>
                        <View className="bg-yellow-500 rounded-full py-3 px-6 items-center">
                          <Text className="text-white font-bold text-2xl">
                            🏆 {resultsAfterTest.assignedLevel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <Text className="text-gray-700 text-center mb-6">
                    Kết quả đã được ghi nhận. Hãy tiếp tục luyện tập!
                  </Text>

                  <TouchableOpacity
                    onPress={handleNavigateDashboard}
                    className="bg-blue-600 py-4 rounded-[50px]"
                  >
                    <Text className="text-white font-bold text-lg text-center">
                      Bắt đầu học ngay
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        )}

        {/* Footer Navigation */}
        {!done && (
          <View className="px-6 py-5">
            <TouchableOpacity
              className={`py-4 rounded-full ${
                recorded[currentQuestionIndex] ? "bg-gray-200" : "bg-gray-200"
              }`}
              onPress={handleNext}
              disabled={!recorded[currentQuestionIndex]}
            >
              <Text
                className={`text-center text-base font-bold ${
                  recorded[currentQuestionIndex]
                    ? "text-black"
                    : "text-gray-400"
                }`}
              >
                {currentQuestionIndex < totalQuestions - 1
                  ? "Tiếp tục →"
                  : "✓ Hoàn thành bài thi"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
