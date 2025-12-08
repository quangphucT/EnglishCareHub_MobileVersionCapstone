import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import {
  useLearnerRecords,
  useLearnerRecordUpdate,
} from '../../hooks/learner/learnerRecord/learnerRecordHook';
import type { Record } from '../../api/learnerRecord.service';

const LearnerRecordQuestion = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const folderId = (route.params as any)?.folderId || '';
  const recordId = (route.params as any)?.recordId || '';
  const content = (route.params as any)?.content || '';

  // Queries
  const { data: recordsDataResponse } = useLearnerRecords(folderId);

  // Parse recordsData từ response
  const recordsList = useMemo<Record[]>(() => {
    if (!recordsDataResponse) return [];
    if (Array.isArray(recordsDataResponse.data)) {
      return recordsDataResponse.data as Record[];
    }
    if (recordsDataResponse.data && typeof recordsDataResponse.data === 'object' && 'recordId' in recordsDataResponse.data) {
      return [recordsDataResponse.data as Record];
    }
    return [];
  }, [recordsDataResponse]);

  // State để quản lý câu hỏi hiện tại
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Tìm index của record hiện tại nếu có recordId từ route
  useEffect(() => {
    if (recordId && recordsList.length > 0) {
      const index = recordsList.findIndex((r: Record) => r.recordId === recordId);
      if (index !== -1) {
        setCurrentQuestionIndex(index);
      }
    }
  }, [recordId, recordsList]);

  // Lấy record hiện tại
  const currentRecord = recordsList[currentQuestionIndex] || null;
  const currentRecordId = currentRecord?.recordId || recordId || '';
  const currentContent = currentRecord?.content || content || '';

  const [language, setLanguage] = useState<'en-gb' | 'en'>('en-gb');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [uiBlocked, setUiBlocked] = useState<boolean>(false);
  const [mainTitle, setMainTitle] = useState<string>('An English Speaking Platform with AI');
  const [pronunciationAccuracy, setPronunciationAccuracy] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [originalScriptHtml, setOriginalScriptHtml] = useState<string>('');
  const [ipaScript, setIpaScript] = useState<string>('');
  const [recordedIpaScript, setRecordedIpaScript] = useState<string>('');
  const [translatedScript, setTranslatedScript] = useState<string>('');
  const [currentSoundRecorded, setCurrentSoundRecorded] = useState<boolean>(false);
  const [serverIsInitialized, setServerIsInitialized] = useState<boolean>(false);
  const [serverWorking, setServerWorking] = useState<boolean>(true);
  const [shouldFetchNext, setShouldFetchNext] = useState<boolean>(false);
  const [openAiFeedbackModal, setOpenAiFeedbackModal] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState<boolean>(false);

  // Word-level analysis data
  const [realTranscriptsIpa, setRealTranscriptsIpa] = useState<string[]>([]);
  const [matchedTranscriptsIpa, setMatchedTranscriptsIpa] = useState<string[]>([]);
  const [wordCategories, setWordCategories] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string[]>([]);
  const [endTime, setEndTime] = useState<string[]>([]);

  // Audio refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const sampleSoundRef = useRef<Audio.Sound | null>(null);
  const recordedSoundRef = useRef<Audio.Sound | null>(null);
  const recordedAudioUriRef = useRef<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Hook for updating record
  const { mutateAsync: updateRecord, isPending: isUpdatingRecord } = useLearnerRecordUpdate();

  // API config
  const AILanguage = language;
  const STScoreAPIKey = '';
  const apiMainPathSample = 'https://ai.aespwithai.com';
  const apiMainPathSTS = 'https://ai.aespwithai.com';

  const languageLabel = useMemo(() => (language === 'en-gb' ? 'English-UK' : 'English-USA'), [language]);

  // Setup audio mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (sampleSoundRef.current) {
        sampleSoundRef.current.unloadAsync();
      }
      if (recordedSoundRef.current) {
        recordedSoundRef.current.unloadAsync();
      }
    };
  }, []);

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

  // Convert audio URI to base64
  const convertAudioToBase64 = useCallback(async (uri: string): Promise<string> => {
    try {
      // First, try using FileSystem (more reliable for local files)
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64' as any,
        });
        if (base64 && base64.length > 0) {
          return base64;
        }
      } catch (fsError) {
        console.log('FileSystem method failed, trying fetch method:', fsError);
      }

      // Fallback: Use fetch to get blob and convert
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Convert blob to base64
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix if present
          const base64 = base64String.includes(',') 
            ? base64String.split(',')[1] 
            : base64String;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting audio to base64:', error);
      throw new Error('Failed to convert audio to base64. Please try again.');
    }
  }, []);

  // Play sample audio using Text-to-Speech
  const playAudio = useCallback(async () => {
    if (!currentContent && !originalScriptHtml) return;

    try {
      setUiBlocked(true);
      setIsPlayingSample(true);
      setMainTitle('Đang phát âm thanh mẫu...');

      // Get plain text from HTML
      let text = (originalScriptHtml && typeof originalScriptHtml === 'string' 
        ? originalScriptHtml.replace(/<[^>]*>?/gm, '') 
        : '') || currentContent;
      text = text.trim();

      if (!text) {
        setUiBlocked(false);
        setIsPlayingSample(false);
        return;
      }

      // Use expo-speech for TTS
      await Speech.speak(text, {
        language: language === 'en-gb' ? 'en-GB' : 'en-US',
        pitch: 1.0,
        rate: 0.7,
        onDone: () => {
          setUiBlocked(false);
          setIsPlayingSample(false);
          setMainTitle('An English Speaking Platform with AI');
        },
        onStopped: () => {
          setUiBlocked(false);
          setIsPlayingSample(false);
          setMainTitle('An English Speaking Platform with AI');
        },
        onError: () => {
          setUiBlocked(false);
          setIsPlayingSample(false);
          setMainTitle('Lỗi phát âm thanh');
        },
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setUiBlocked(false);
      setIsPlayingSample(false);
      setMainTitle('Lỗi phát âm thanh');
    }
  }, [currentContent, originalScriptHtml, language]);

  // Play recorded audio
  const playRecording = useCallback(async (start?: number | null, end?: number | null) => {
    if (!recordedAudioUriRef.current) {
      Alert.alert('Không có audio', 'Chưa có bản ghi âm nào');
      return;
    }

    try {
      setUiBlocked(true);
      setIsPlayingRecorded(true);
      setMainTitle('Đang phát bản ghi...');

      // Stop current playback if any
      if (recordedSoundRef.current) {
        await recordedSoundRef.current.unloadAsync();
        recordedSoundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedAudioUriRef.current },
        { shouldPlay: true }
      );
      recordedSoundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setUiBlocked(false);
            setIsPlayingRecorded(false);
            setMainTitle('An English Speaking Platform with AI');
            sound.unloadAsync();
            recordedSoundRef.current = null;
          }
        }
      });

      if (start != null && end != null) {
        await sound.setPositionAsync(start * 1000);
        const duration = (end - start) * 1000;
        setTimeout(async () => {
          await sound.pauseAsync();
          await sound.setPositionAsync(0);
          setUiBlocked(false);
          setIsPlayingRecorded(false);
          setMainTitle('An English Speaking Platform with AI');
        }, Math.max(0, Math.round(duration)));
      }
    } catch (error) {
      console.error('Error playing recording:', error);
      setUiBlocked(false);
      setIsPlayingRecorded(false);
      setMainTitle('Lỗi phát bản ghi');
      Alert.alert('Lỗi', 'Không thể phát bản ghi');
    }
  }, []);

  // Handle recording
  const updateRecordingState = useCallback(async () => {
    if (recording) {
      // Stop recording
      try {
        setRecording(false);
        setMainTitle('Đang xử lý audio...');
        setUiBlocked(true);

        if (!recordingRef.current) {
          setUiBlocked(false);
          return;
        }

        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();

        if (!uri) {
          setMainTitle('Lỗi: Không tìm thấy file ghi âm');
          setUiBlocked(false);
          return;
        }

        recordedAudioUriRef.current = uri;

        // Convert to base64 for API
        let base64: string;
        try {
          base64 = await convertAudioToBase64(uri);
        } catch (convertError: any) {
          console.error('Error converting audio to base64:', convertError);
          setMainTitle('Lỗi: Không thể chuyển đổi audio');
          Alert.alert('Lỗi', convertError?.message || 'Không thể chuyển đổi audio sang base64. Vui lòng thử lại.');
          setUiBlocked(false);
          return;
        }

        if (!base64 || base64.length < 6) {
          setMainTitle('Lỗi: File audio không hợp lệ');
          setUiBlocked(false);
          return;
        }

        // Get text content
        let text = (originalScriptHtml && typeof originalScriptHtml === 'string' 
          ? originalScriptHtml.replace(/<[^>]*>?/gm, '') 
          : '') || currentContent;
        text = text.trim().replace(/\s\s+/g, ' ');

        if (!text) {
          setMainTitle('Lỗi: Không có nội dung để phân tích');
          setUiBlocked(false);
          return;
        }

        // Call AI API
        try {
          const payload = {
            title: text,
            base64Audio: base64,
            language: AILanguage,
          };

          const res = await fetch(apiMainPathSTS + '/GetAccuracyFromRecordedAudio', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': STScoreAPIKey,
            },
          });

          if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
          }

          const data = await res.json();

          const pronunciationAccuracyValue = data?.pronunciation_accuracy || '0';
          const acc = parseFloat(pronunciationAccuracyValue);

          setRecordedIpaScript(`/ ${data?.ipa_transcript || ''} /`);
          setPronunciationAccuracy(`${pronunciationAccuracyValue}%`);
          const feedbackValue = data?.AIFeedback || data?.aiFeedback || data?.feedback || '';
          setAiFeedback(feedbackValue);

          // Update record with results
          if (currentRecordId) {
            setTimeout(async () => {
              try {
                // Upload audio file (using FormData)
                const formData = new FormData();
                formData.append('file', {
                  uri: uri,
                  type: 'audio/m4a',
                  name: `record-${Date.now()}.m4a`,
                } as any);

                // For now, we'll use the URI directly or upload to your backend
                // You may need to create an upload endpoint
                const audioUrl = uri; // Temporary - should upload to server

                await updateRecord({
                  recordId: currentRecordId,
                  reviewData: {
                    audioRecordingURL: audioUrl,
                    score: Math.round(acc),
                    aiFeedback: feedbackValue,
                    transcribedText: data?.ipa_transcript || '',
                  },
                });

                setMainTitle('Đã lưu kết quả!');
              } catch (error) {
                console.error('Error updating record:', error);
              }
            }, 100);
          }

          // Store word-level data
          const realTranscriptsIpaData = data?.real_transcripts_ipa?.split(' ') || [];
          const matchedTranscriptsIpaData = data?.matched_transcripts_ipa?.split(' ') || [];
          const wordCategoriesData = data?.pair_accuracy_category?.split(' ') || [];
          const startTimeData = data?.start_time?.split(' ') || [];
          const endTimeData = data?.end_time?.split(' ') || [];

          setRealTranscriptsIpa(realTranscriptsIpaData);
          setMatchedTranscriptsIpa(matchedTranscriptsIpaData);
          setWordCategories(wordCategoriesData);
          setStartTime(startTimeData);
          setEndTime(endTimeData);

          // Color code words
          const isLetterCorrectAll: string[] = String(data?.is_letter_correct_all_words || '').split(' ');
          const words = text.split(' ');
          let coloredWords = '';

          for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
            const word = words[wordIdx];
            const lettersMask = isLetterCorrectAll[wordIdx] || '';
            let wordTemp = '';

            for (let letterIdx = 0; letterIdx < word.length; letterIdx++) {
              const ok = lettersMask[letterIdx] === '1';
              const color = ok ? '#10B981' : '#EF4444';
              wordTemp += `<span style="color: ${color}">${word[letterIdx]}</span>`;
            }
            coloredWords += ` ${wordTemp}`;
          }

          setOriginalScriptHtml(coloredWords.trim());
          setCurrentSoundRecorded(true);
          setMainTitle('An English Speaking Platform with AI');
        } catch (error) {
          console.error('Error processing audio:', error);
          setMainTitle('Lỗi: Không thể phân tích audio');
          Alert.alert('Lỗi', 'Không thể phân tích audio. Vui lòng thử lại.');
        } finally {
          setUiBlocked(false);
        }   
      } catch (error) {
        console.error('Error stopping recording:', error);
        setMainTitle('Lỗi: Không thể dừng ghi âm');
        setUiBlocked(false);
      }
    } else {
      // Start recording
      try {
        setMainTitle('Đang ghi âm...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        recordingRef.current = newRecording;
        setRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
        setMainTitle('Lỗi: Không thể bắt đầu ghi âm');
        Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm. Vui lòng kiểm tra quyền truy cập microphone.');
      }
    }
  }, [recording, currentContent, originalScriptHtml, AILanguage, apiMainPathSTS, STScoreAPIKey, currentRecordId, updateRecord, convertAudioToBase64]);

  // Initialize server
  const initializeServer = useCallback(async () => {
    let valid = false;
    setMainTitle('Đang khởi tạo server...');
    let tries = 0;
    const maxTries = 4;

    while (!valid) {
      if (tries > maxTries) {
        setServerWorking(false);
        break;
      }
      try {
        if (apiMainPathSTS && STScoreAPIKey) {
          await fetch(apiMainPathSTS + '/GetAccuracyFromRecordedAudio', {
            method: 'POST',
            body: JSON.stringify({
              title: '',
              base64Audio: '',
              language: AILanguage,
            }),
            headers: { 'X-Api-Key': STScoreAPIKey },
          });
        }
        valid = true;
        setServerIsInitialized(true);
      } catch {
        tries += 1;
      }
    }
  }, [AILanguage, STScoreAPIKey, apiMainPathSTS]);

  // Get next sample
  const getNextSample = useCallback(async () => {
    setUiBlocked(true);
    if (!serverIsInitialized) {
      await initializeServer();
    }
    if (!serverWorking) {
      setMainTitle('Lỗi Server');
      setRecordedIpaScript('');
      setIpaScript('Error');
      setUiBlocked(false);
      return;
    }

    setMainTitle('Đang tải mẫu...');

    try {
      const res = await fetch(apiMainPathSample + '/getSample', {
        method: 'POST',
        body: JSON.stringify({
          category: 1,
          language: AILanguage,
          question: currentContent || content,
        }),
        headers: { 'X-Api-Key': STScoreAPIKey },
      });

      const data = await res.json();

      setOriginalScriptHtml(data.real_transcript || '');
      setIpaScript(`/ ${data.ipa_transcript || ''} /`);
      setRecordedIpaScript('');
      setPronunciationAccuracy('');
      setTranslatedScript(data.transcript_translation || '');
      setCurrentSoundRecorded(false);
      setMainTitle('An English Speaking Platform with AI');
    } catch (error) {
      console.error('Error fetching sample:', error);
      setMainTitle('Lỗi Server');
      setRecordedIpaScript('');
      setIpaScript('Error');
    } finally {
      setUiBlocked(false);
    }
  }, [AILanguage, STScoreAPIKey, apiMainPathSample, serverIsInitialized, serverWorking, initializeServer, currentContent, content]);

  // Handle Next Question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < recordsList.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextRecord = recordsList[nextIndex];
      if (nextRecord) {
        // Reset states
        setRecordedIpaScript('');
        setPronunciationAccuracy('');
        setAiFeedback('');
        setCurrentSoundRecorded(false);
        setOriginalScriptHtml('');
        setIpaScript('');
        setTranslatedScript('');
        recordedAudioUriRef.current = null;

        // Fetch new sample
        setTimeout(() => {
          getNextSample();
        }, 100);
      }
    }
  }, [currentQuestionIndex, recordsList, getNextSample]);

  // Handle Previous Question
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      const prevRecord = recordsList[prevIndex];
      if (prevRecord) {
        // Reset states
        setRecordedIpaScript('');
        setPronunciationAccuracy('');
        setAiFeedback('');
        setCurrentSoundRecorded(false);
        setOriginalScriptHtml('');
        setIpaScript('');
        setTranslatedScript('');
        recordedAudioUriRef.current = null;

        // Fetch new sample
        setTimeout(() => {
          getNextSample();
        }, 100);
      }
    }
  }, [currentQuestionIndex, recordsList, getNextSample]);

  // Handle go back
  const handleGoBack = useCallback(() => {
    // Stop any ongoing speech
    Speech.stop();
    navigation.goBack();
  }, [navigation]);

  // Change language
  const changeLanguage = useCallback((lang: 'en-gb' | 'en') => {
    setLanguage(lang);
    setDropdownOpen(false);
    setShouldFetchNext(true);
  }, []);

  // Fetch initial sample
  useEffect(() => {
    if (shouldFetchNext) {
      setShouldFetchNext(false);
      getNextSample();
    }
  }, [shouldFetchNext, getNextSample]);

  useEffect(() => {
    if (currentContent || content) {
      getNextSample();
    }
  }, [currentContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format AI feedback HTML (simple version)
  const formatAiFeedback = (feedback: string): string => {
    // Simple formatting - replace newlines with breaks
    return feedback.replace(/\n/g, '<br/>');
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white/90 border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity
                onPress={handleGoBack}
                disabled={uiBlocked || isUpdatingRecord}
                className="mr-3"
              >
                {isUpdatingRecord ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Ionicons name="arrow-back" size={24} color="#1F2937" />
                )}
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
                {mainTitle}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Language Selector */}
              <View className="relative">
                <TouchableOpacity
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                  disabled={uiBlocked}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg"
                >
                  <Text className="text-sm font-medium text-gray-700">
                    {languageLabel} ▼
                  </Text>
                </TouchableOpacity>
                {dropdownOpen && (
                  <View className="absolute top-full mt-2 w-40 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
                    <TouchableOpacity
                      onPress={() => changeLanguage('en-gb')}
                      disabled={uiBlocked}
                      className="px-4 py-2.5 border-b border-gray-100"
                    >
                      <Text className="text-sm font-medium text-gray-700">English-UK</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => changeLanguage('en')}
                      disabled={uiBlocked}
                      className="px-4 py-2.5"
                    >
                      <Text className="text-sm font-medium text-gray-700">English-USA</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Question Counter */}
              {recordsList.length > 0 && (
                <View className="px-3 py-2 bg-blue-100 rounded-lg">
                  <Text className="text-xs font-semibold text-blue-700">
                    {currentQuestionIndex + 1}/{recordsList.length}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-4 py-6">
            {/* Main Card */}
            <View
              className="bg-white rounded-3xl p-6 mb-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {/* Control Buttons Row */}
              <View className="flex-row items-center justify-between mb-6">
                <TouchableOpacity
                  onPress={playAudio}
                  disabled={uiBlocked || !originalScriptHtml}
                  className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center"
                  style={{ opacity: uiBlocked || !originalScriptHtml ? 0.5 : 1 }}
                >
                  {isPlayingSample ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="play" size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => playRecording()}
                  disabled={uiBlocked || !currentSoundRecorded}
                  className="w-14 h-14 rounded-full bg-indigo-500 items-center justify-center"
                  style={{ opacity: uiBlocked || !currentSoundRecorded ? 0.5 : 1 }}
                >
                  {isPlayingRecorded ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="volume-high" size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                {/* Score Display */}
                <View className="bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200">
                  <Text className="text-xs text-gray-600 mb-1 font-medium text-center">Điểm số</Text>
                  <Text className="text-2xl font-bold text-emerald-600 text-center">
                    {pronunciationAccuracy || '-'}
                  </Text>
                </View>

                {/* AI Feedback Button */}
                {aiFeedback && aiFeedback.trim() && (
                  <TouchableOpacity
                    onPress={() => setOpenAiFeedbackModal(true)}
                    className="w-14 h-14 rounded-full bg-purple-500 items-center justify-center"
                  >
                    <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Text Content */}
              <ScrollView className="max-h-64 mb-4" showsVerticalScrollIndicator={true}>
                <View className="mb-4">
                  <Text className="text-2xl font-semibold text-blue-600 mb-2">
                    {(originalScriptHtml && typeof originalScriptHtml === 'string' 
                      ? originalScriptHtml.replace(/<[^>]*>?/gm, '') 
                      : '') || currentContent}
                  </Text>
                  {originalScriptHtml && typeof originalScriptHtml === 'string' && originalScriptHtml.includes('<span') && (
                    <Text className="text-lg text-gray-700">
                      {/* Render colored text - simplified for mobile */}
                      {originalScriptHtml.replace(/<[^>]*>?/gm, '')}
                    </Text>
                  )}
                </View>

                {ipaScript && (
                  <Text className="text-lg text-gray-500 mb-2">{ipaScript}</Text>
                )}

                {recordedIpaScript && (
                  <Text className="text-lg text-blue-600 mb-2">{recordedIpaScript}</Text>
                )}

                {translatedScript && (
                  <Text className="text-base text-gray-500">{translatedScript}</Text>
                )}
              </ScrollView>

              {/* Navigation Buttons */}
              {recordsList.length > 1 && (
                <View className="flex-row items-center justify-between mt-4">
                  <TouchableOpacity
                    onPress={handlePreviousQuestion}
                    disabled={uiBlocked || currentQuestionIndex === 0}
                    className="w-12 h-12 rounded-full bg-gray-600 items-center justify-center"
                    style={{ opacity: uiBlocked || currentQuestionIndex === 0 ? 0.5 : 1 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleNextQuestion}
                    disabled={uiBlocked || currentQuestionIndex >= recordsList.length - 1}
                    className="w-12 h-12 rounded-full bg-gray-600 items-center justify-center"
                    style={{ opacity: uiBlocked || currentQuestionIndex >= recordsList.length - 1 ? 0.5 : 1 }}
                  >
                    <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Recording Button */}
            <View className="items-center mt-6">
              <TouchableOpacity
                onPress={updateRecordingState}
                disabled={uiBlocked && !recording}
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
                  opacity: uiBlocked && !recording ? 0.5 : 1,
                }}
              >
                <Animated.View style={{ opacity: pulseAnim }}>
                  <Ionicons name="mic" size={40} color="#FFFFFF" />
                </Animated.View>
              </TouchableOpacity>
              <Text className="text-sm text-gray-600 mt-3 text-center">
                {recording ? 'Đang ghi âm... Nhấn để dừng' : 'Nhấn để bắt đầu ghi âm'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* AI Feedback Modal */}
      <Modal
        visible={openAiFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOpenAiFeedbackModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="px-4 pt-4 pb-2 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-purple-500 items-center justify-center mr-3">
                    <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-gray-900">AI Feedback</Text>
                    <Text className="text-sm text-gray-500">Phân tích phát âm chi tiết</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setOpenAiFeedbackModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
              {aiFeedback ? (
                <Text className="text-base text-gray-800 leading-6 mb-4">
                  {aiFeedback}
                </Text>
              ) : (
                <Text className="text-sm text-gray-500 text-center py-8">
                  Chưa có phản hồi AI
                </Text>
              )}
            </ScrollView>

            <View className="px-4 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setOpenAiFeedbackModal(false)}
                className="py-3 bg-blue-600 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LearnerRecordQuestion;

