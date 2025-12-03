import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Audio } from "expo-av";
import { Video, ResizeMode } from "expo-av";
import * as Speech from "expo-speech";
import { useLearnerStore } from "../../store/learnerStore";
import { useLearningPathCourseFull } from "../../hooks/learner/learningPath/learningPathHooks";
import {
  useStartExercise,
  useSubmitAnswerQuestion,
} from "../../hooks/learner/exercise/exerciseHooks";

interface RouteParams {
  exerciseId: string;
  chapterId?: string;
  refetchLearningPath?: () => void;
}

const ExerciseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { exerciseId, chapterId, refetchLearningPath } =
    route.params as RouteParams;

  const currentCourse = useLearnerStore((state) => state.currentCourse);

  // Get full learning path data
  const {
    data: apiResponse,
    isLoading,
    refetch,
  } = useLearningPathCourseFull(
    {
      learningPathCourseId: currentCourse?.learningPathCourseId || "",
      courseId: currentCourse?.courseId || "",
    },
    Boolean(currentCourse)
  );

  // Refetch data when screen mounts (for "Xem lại" or "Tiếp tục học")
  useEffect(() => {
    refetch();
    if (refetchLearningPath) {
      refetchLearningPath();
    }
  }, [exerciseId]);

  const { mutate: startExercise } = useStartExercise();
  const { mutate: submitAnswerQuestion } = useSubmitAnswerQuestion();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded] = useState<boolean[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pronunciationScores, setPronunciationScores] = useState<number[]>([]);
  const [ipaTranscripts, setIpaTranscripts] = useState<string[]>([]);
  const [realIpaTranscripts, setRealIpaTranscripts] = useState<string[]>([]);
  const [coloredContents, setColoredContents] = useState<string[]>([]);
  const [AIExplainTheWrongForVoiceAI, setAIExplainTheWrongForVoiceAI] =
    useState<string[]>([]);
  const [learnerAnswerIds, setLearnerAnswerIds] = useState<string[]>([]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordedAudioUriRef = useRef<string | null>(null);

  // AI API config
  const apiMainPathSTS = process.env.EXPO_PUBLIC_AI_STS_API_URL;
  const STScoreAPIKey = process.env.EXPO_PUBLIC_AI_STS_API_KEY || "";
  const AILanguage = process.env.EXPO_PUBLIC_AI_STS_LANGUAGE || "en";

  // Find current exercise from learning path data
  const currentExerciseData = React.useMemo(() => {
    if (!apiResponse?.data?.chapters || !exerciseId) return null;

    for (const chapter of apiResponse.data.chapters) {
      const exercise = chapter.exercises.find(
        (ex) => ex.exerciseId === exerciseId
      );
      if (exercise) return exercise;
    }
    return null;
  }, [apiResponse, exerciseId]);

  const questions = React.useMemo(() => {
    if (!currentExerciseData?.questions) return [];
    return currentExerciseData.questions.sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
  }, [currentExerciseData]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage =
    ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Initialize recorded state based on question status
  useEffect(() => {
    if (questions.length > 0 && recorded.length === 0) {
      // Mark questions as recorded if they are already completed
      const initialRecorded = questions.map(
        (q) => q.status?.toLowerCase() === "completed"
      );
      setRecorded(initialRecorded);
      
      // Initialize scores from existing question scores
      const initialScores = questions.map((q) => q.score || 0);
      setPronunciationScores(initialScores);
      
      setIpaTranscripts(new Array(questions.length).fill(""));
      setRealIpaTranscripts(new Array(questions.length).fill(""));
      setColoredContents(new Array(questions.length).fill(""));
      setAIExplainTheWrongForVoiceAI(new Array(questions.length).fill(""));
      setLearnerAnswerIds(new Array(questions.length).fill(""));
    }
  }, [questions, recorded.length]);

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

  // Request audio permissions
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền ghi âm để sử dụng chức năng này");
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  // Start exercise when screen loads (only if NotStarted)
  useEffect(() => {
    if (
      currentExerciseData?.learningPathExerciseId &&
      currentExerciseData.status === "NotStarted"
    ) {
      console.log(
        "🎯 Starting exercise:",
        currentExerciseData.learningPathExerciseId
      );
      startExercise({
        learningPathExerciseId: currentExerciseData.learningPathExerciseId,
        status: "InProgress",
      });
    } else {
      console.log("📝 Exercise status:", currentExerciseData?.status);
    }
  }, [currentExerciseData]);

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      try {
        setIsRecording(false);
        setIsProcessingAudio(true);

        if (!recordingRef.current) return;

        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();

        if (!uri) {
          setIsProcessingAudio(false);
          return;
        }

        // Convert to blob and base64 for AI processing
        const response = await fetch(uri);
        const blob = await response.blob();
        const base64 = await convertBlobToBase64(blob);

        if (!base64 || base64.length < 6) {
          setIsProcessingAudio(false);
          return;
        }

        try {
          const text = currentQuestion?.text || "";
          const payload = {
            title: text,
            base64Audio: base64,
            language: AILanguage,
          };

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
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
          }

          const data = await res.json();

          const acc = parseFloat(data.pronunciation_accuracy);

          // Store results
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

          // Store AI explanation
          const newAIExplain = [...AIExplainTheWrongForVoiceAI];
          newAIExplain[currentQuestionIndex] = data.explain_the_wrong || "";
          setAIExplainTheWrongForVoiceAI(newAIExplain);

          // Submit answer to server
          submitAnswerQuestion(
            {
              learningPathQuestionId: currentQuestion.learningPathQuestionId,
              audioRecordingUrl: uri,
              transcribedText: data.ipa_transcript || "",
              scoreForVoice: acc,
              explainTheWrongForVoiceAI: data.explain_the_wrong || "",
            },
            {
              onSuccess: (response) => {
                const newAnswerIds = [...learnerAnswerIds];
                newAnswerIds[currentQuestionIndex] =
                  response.data.learnerAnswerId;
                setLearnerAnswerIds(newAnswerIds);
                setIsProcessingAudio(false);
             
              },
              onError: (error) => {
                setIsProcessingAudio(false);
                Alert.alert("Lỗi", "Không thể lưu câu trả lời");
              },
            }
          );
        } catch (error) {
          console.error("Error processing audio:", error);
          setIsProcessingAudio(false);
          Alert.alert("Lỗi", "Không thể phân tích âm thanh");
        }
      } catch (error) {
        console.error("Failed to stop recording:", error);
        setIsProcessingAudio(false);
        Alert.alert("Lỗi", "Không thể dừng ghi âm");
      }
    } else {
      // Start recording
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        recordingRef.current = newRecording;
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
        Alert.alert("Lỗi", "Không thể bắt đầu ghi âm");
      }
    }
  };

  const handlePlayRecording = async () => {
    try {
      if (!recordingRef.current) return;

      const uri = recordingRef.current.getURI();
      if (!uri) return;

      setIsPlayingAudio(true);

      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Failed to play recording:", error);
      setIsPlayingAudio(false);
      Alert.alert("Lỗi", "Không thể phát lại bản ghi");
    }
  };

  // Text-to-Speech cho câu hỏi - gọi API backend (giống web)
  const handleSpeakQuestion = useCallback(async () => {
    if (!currentQuestion?.text) return;

    try {
      setIsSpeaking(true);

      // Stop any ongoing audio
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Gọi API backend để lấy audio TTS (giống web)
      const response = await fetch(`${apiMainPathSTS}/getAudioFromText`, {
        method: 'POST',
        body: JSON.stringify({
          value: currentQuestion.text.trim(),
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': STScoreAPIKey,
        },
      });

      const responseData = await response.json();
      console.log('TTS response:', responseData);

      // Parse response (Lambda handler trả về {statusCode, body, headers})
      let data;
      if (responseData.body) {
        if (typeof responseData.body === 'string') {
          data = JSON.parse(responseData.body);
        } else {
          data = responseData.body;
        }
      } else if (responseData.wavBase64) {
        data = responseData;
      } else {
        data = responseData;
      }

      if (data && data.wavBase64) {
        const mimeType = data.mimeType || 'audio/mpeg';
        const audioUri = `data:${mimeType};base64,${data.wavBase64}`;

        // Phát audio bằng expo-av
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        soundRef.current = sound;

        // Lắng nghe khi audio kết thúc
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsSpeaking(false);
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
      } else {
        console.error('No wavBase64 field in TTS response:', data);
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Error playing TTS audio:', error);
      setIsSpeaking(false);
    }
  }, [currentQuestion, apiMainPathSTS, STScoreAPIKey]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // const handleSubmit = () => {
  //   Alert.alert("Hoàn thành bài tập", "Bạn đã hoàn thành bài tập!", [
  //     {
  //       text: "OK",
  //       onPress: () => (navigation as any).goBack(),
  //     },
  //   ]);
  // };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Đang tải bài tập...</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600">Không tìm thấy câu hỏi</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50"
      edges={["top"]}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 shadow-sm">
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <View>
                <Text className="text-lg font-bold text-gray-900">
                  {currentExerciseData?.exerciseTitle || "Exercise"}
                </Text>
                <Text className="text-xs text-gray-500" numberOfLines={2}>
                  {currentExerciseData?.exerciseDescription || ""}
                </Text>
              </View>  
            </View>
            
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View className="bg-white border-b border-gray-100">
        <View className="px-6 py-3">
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
          {/* Mini progress indicators */}
          <View className="flex-row justify-between mt-2">
            {questions.map((_, index) => (
              <View
                key={index}
                className={`h-1 flex-1 mx-0.5 rounded-full ${
                  index < currentQuestionIndex
                    ? "bg-green-500"
                    : index === currentQuestionIndex
                      ? "bg-blue-500"
                      : "bg-gray-200"
                }`}
              />
            ))}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Question type badge */}
        {/* <View className="items-center my-6">
          <View className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
            <Text className="text-white text-sm font-semibold uppercase">
              {currentQuestion.type === "word"
                ? "Từ vựng"
                : currentQuestion.type === "sentence"
                ? "Câu"
                : "Đoạn văn"}
            </Text>
          </View>
        </View> */}

        {/* Video khẩu hình (nếu có) */}
        {currentQuestion?.media && currentQuestion.media.length > 0 && (
          <View className="mb-6">
            {currentQuestion.media.map((mediaItem: any, idx: number) => (
              <View key={mediaItem.questionMediaId || idx}>
                {mediaItem.videoUrl && (
                  <View className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                        <Ionicons name="videocam" size={16} color="white" />
                      </View>
                      <View>
                        <Text className="text-sm font-semibold text-blue-900">
                          Video hướng dẫn khẩu hình
                        </Text>
                        <Text className="text-xs text-blue-700">
                          Quan sát và bắt chước cách đặt miệng khi phát âm
                        </Text>
                      </View>
                    </View>
                    <Video
                      source={{ uri: mediaItem.videoUrl }}
                      style={{ width: "100%", height: 300, borderRadius: 12 }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        {/* Processing status */}
        {isProcessingAudio && (
          <View className="mb-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <View className="flex-row items-center gap-3">
              <ActivityIndicator size="small" color="#2563EB" />
              <View>
                <Text className="text-blue-900 font-semibold">
                  Đang phân tích âm thanh...
                </Text>
                <Text className="text-blue-700 text-xs">
                  AI đang đánh giá phát âm của bạn
                </Text>
              </View>
            </View>
          </View>
        )}
        {/* Question text */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-gray-900 text-center leading-relaxed">
            {currentQuestion.text}
          </Text>

          {/* Nút nghe phát âm */}
          <TouchableOpacity
            onPress={handleSpeakQuestion}
            disabled={isSpeaking}
            className="mt-4 bg-indigo-600 rounded-xl px-6 py-3 flex-row items-center gap-2"
            style={{ opacity: isSpeaking ? 0.5 : 1 }}
          >
            <Ionicons
              name={isSpeaking ? "volume-high" : "volume-high-outline"}
              size={20}
              color="white"
            />
            <Text className="text-white font-semibold">
              {isSpeaking ? "Đang phát..." : "Nghe phát âm"}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Question stats */}
        {(currentQuestion.score >= 0 || currentQuestion.numberOfRetake > 0) && (
          <View className="flex-row justify-center gap-4 mb-6">
            {currentQuestion.score >= 0 && (
              <View className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="star" size={16} color="#2563EB" />
                  <View>
                    <Text className="text-xs text-blue-700 font-medium">
                      Điểm gần nhất
                    </Text>
                    <Text className="text-lg font-bold text-blue-900">
                      {currentQuestion.score}/100
                    </Text>
                  </View>
                </View>
              </View>
            )}
            {currentQuestion.numberOfRetake > 0 && (
              <View className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="refresh" size={16} color="#EA580C" />
                  <View>
                    <Text className="text-xs text-orange-700 font-medium">
                      Số lần làm lại
                    </Text>
                    <Text className="text-lg font-bold text-orange-900">
                      {currentQuestion.numberOfRetake}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Recording button */}
        <View className="items-center my-8">
          <TouchableOpacity
            onPress={handleRecord}
            disabled={isProcessingAudio}
            className={`w-32 h-32 rounded-full items-center justify-center shadow-lg ${
              isRecording
                ? "bg-red-500"
                : recorded[currentQuestionIndex]
                  ? "bg-green-500"
                  : "bg-blue-500"
            }`}
            style={{ opacity: isProcessingAudio ? 0.5 : 1 }}
          >
            {isProcessingAudio ? (
              <ActivityIndicator size="large" color="white" />
            ) : isRecording ? (
              <View className="w-8 h-8 bg-white rounded" />
            ) : (
              <Ionicons name="mic" size={48} color="white" />
            )}
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900 mt-4">
            {isProcessingAudio
              ? "Đang xử lý..."
              : isRecording
                ? "Click để dừng"
                : recorded[currentQuestionIndex]
                  ? "Ghi lại"
                  : "Bắt đầu ghi âm"}
          </Text>
        </View>

        {/* Recording result */}
        {recorded[currentQuestionIndex] && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center">
                  <Ionicons name="checkmark" size={24} color="white" />
                </View>
                <View>
                  <Text className="text-sm text-green-700 font-medium">
                    Độ chính xác phát âm
                  </Text>
                  <Text className="text-3xl font-bold text-green-900">
                    {pronunciationScores[currentQuestionIndex]?.toFixed(1) || 0}
                    %
                  </Text>
                </View>
              </View>
            </View>

            {/* Colored text result */}
            {coloredContents[currentQuestionIndex] && (
              <View className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                <Text className="text-xs text-gray-600 mb-2 font-medium">
                  Phân tích chi tiết:
                </Text>
                <Text className="text-2xl font-semibold leading-relaxed">
                  {/* Note: dangerouslySetInnerHTML doesn't work in RN, need custom component */}
                  {currentQuestion.text}
                </Text>
              </View>
            )}

            {/* IPA Transcripts */}
            <View className="flex-row gap-4 pt-4 border-t border-green-200 mt-4">
              <View className="flex-1 bg-white rounded-lg p-3 border border-green-200">
                <Text className="text-xs text-gray-600 mb-1 font-medium">
                  IPA của bạn
                </Text>
                <Text className="text-sm font-mono text-gray-900">
                  {ipaTranscripts[currentQuestionIndex] || "N/A"}
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-lg p-3 border border-green-200">
                <Text className="text-xs text-gray-600 mb-1 font-medium">
                  IPA chuẩn
                </Text>
                <Text className="text-sm font-mono text-gray-900">
                  {realIpaTranscripts[currentQuestionIndex] || "N/A"}
                </Text>
              </View>
            </View>

            {/* Play recording button */}
            <TouchableOpacity
              onPress={handlePlayRecording}
              disabled={isPlayingAudio}
              className="bg-indigo-600 rounded-xl py-3 items-center mt-4"
              style={{ opacity: isPlayingAudio ? 0.5 : 1 }}
            >
              <View className="flex-row items-center gap-2">
                {isPlayingAudio ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="play" size={20} color="white" />
                )}
                <Text className="text-white font-semibold">
                  {isPlayingAudio ? "Đang phát..." : "Nghe lại bản ghi"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      <View className="bg-white border-t border-gray-200 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex-row items-center px-6 py-3 rounded-xl border ${
              currentQuestionIndex === 0
                ? "border-gray-200 bg-gray-100"
                : "border-blue-500 bg-white"
            }`}
          >
            <Ionicons
              name="arrow-back"
              size={16}
              color={currentQuestionIndex === 0 ? "#9CA3AF" : "#3B82F6"}
            />
            <Text
              className={`ml-2 font-semibold ${
                currentQuestionIndex === 0 ? "text-gray-400" : "text-blue-600"
              }`}
            >
              Câu trước
            </Text>
          </TouchableOpacity>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex-row items-center px-10 py-3 rounded-xl bg-green-600"
            >
              <Ionicons name="home" size={20} color="white" />
              <Text className="ml-2 text-white font-semibold text-base">
                Quay về
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNextQuestion}
              className="flex-row items-center px-10 py-3 rounded-xl bg-blue-600"
            >
              <Text className="font-semibold text-base text-white">
                Câu tiếp theo
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ExerciseScreen;
