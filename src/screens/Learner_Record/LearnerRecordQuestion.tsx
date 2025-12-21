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
import {
  useLearnerRecords,
  useLearnerRecordUpdate,
} from '../../hooks/learner/learnerRecord/learnerRecordHook';
import type { Record } from '../../api/learnerRecord.service';
import { uploadAudioToCloudinary } from '../../api/uploadAudio.service';
import BuyReviewModal from '../../components/BuyReviewModal';

const LearnerRecordQuestion = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const folderId = (route.params as any)?.folderId || '';
  const recordId = (route.params as any)?.recordId || '';
  const content = (route.params as any)?.content || '';

  // Queries
  const { data: recordsDataResponse, isLoading: isLoadingRecords, isError: isErrorRecords, error: recordsError } = useLearnerRecords(folderId);

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
  const [initialIndexSet, setInitialIndexSet] = useState<boolean>(false);

  // Tìm index của record hiện tại nếu có recordId từ route (chỉ chạy 1 lần khi mount)
  useEffect(() => {
    if (recordId && recordsList.length > 0 && !initialIndexSet) {
      const index = recordsList.findIndex((r: Record) => r.recordId === recordId);
      if (index !== -1) {
        setCurrentQuestionIndex(index);
      }
      setInitialIndexSet(true);
    }
  }, [recordId, recordsList, initialIndexSet]);

  // Lấy record hiện tại
  const currentRecord = recordsList[currentQuestionIndex] || null;
  const currentRecordContentId = currentRecord?.recordContentId ;
  const currentRecordId = currentRecord?.recordId; // ID để mua review
  const currentContent = currentRecord?.content || content || '';

  // Debug: Log current record info
  useEffect(() => {
    console.log('🔍 Current Record Info:', {
      currentRecord,
      currentRecordContentId,
      currentRecordId,
      currentQuestionIndex,
    });
  }, [currentRecord, currentRecordContentId, currentRecordId, currentQuestionIndex]);

  const [language, setLanguage] = useState<'en-gb' | 'en'>('en');
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
  const [isBuyReviewModalOpen, setIsBuyReviewModalOpen] = useState(false);
  const [initialSampleFetched, setInitialSampleFetched] = useState<boolean>(false);

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

  // Parse HTML và render text với màu sắc
  const renderColoredText = (html: string) => {
    if (!html || !html.includes('<span')) {
      return null;
    }

    // Parse HTML to extract colored letters
    const regex = /<span style="color: (#[0-9A-Fa-f]+)">([^<]+)<\/span>/g;
    const parts: { text: string; color: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(html)) !== null) {
      // Add text before match if any (giữ nguyên khoảng trắng)
      if (match.index > lastIndex) {
        const textBefore = html.substring(lastIndex, match.index);
        const cleanText = textBefore.replace(/<[^>]*>/g, '');
        if (cleanText) {
          parts.push({ text: cleanText, color: '#000000' });
        }
      }
      
      parts.push({ text: match[2], color: match[1] });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text (giữ nguyên khoảng trắng)
    if (lastIndex < html.length) {
      const textAfter = html.substring(lastIndex);
      const cleanText = textAfter.replace(/<[^>]*>/g, '');
      if (cleanText) {
        parts.push({ text: cleanText, color: '#000000' });
      }
    }

    return (
      <Text className="text-2xl font-bold leading-relaxed">
        {parts.map((part, index) => (
          <Text key={index} style={{ color: part.color }}>
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

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

  // Convert blob to base64 (giữ nguyên data URL prefix như web version)
  const convertBlobToBase64 = useCallback(
    async (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
          const base64String = reader.result as string;
          // Giữ nguyên full data URL với prefix (giống web version)
          // Web gửi: "data:audio/ogg;;base64,GkXfo59..."
          resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
      });
    },
    []
  );

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

        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (stopError) {
          console.warn('Error stopping recording:', stopError);
          // Continue even if stop fails
        }
        
        const uri = recordingRef.current?.getURI();

        if (!uri) {
          setMainTitle('Lỗi: Không tìm thấy file ghi âm');
          setUiBlocked(false);
          return;
        }

        recordedAudioUriRef.current = uri;

        // Convert to blob and base64 for AI processing
        let base64: string;
        try {
          const response = await fetch(uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
          }
          const blob = await response.blob();
          base64 = await convertBlobToBase64(blob);
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
           console.log("Ress:", res)
          if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
          }

          const data = await res.json();

          console.log('🎯 AI Response Data:', data);

          const pronunciationAccuracyValue = data?.pronunciation_accuracy || '0';
          const acc = parseFloat(pronunciationAccuracyValue);

          setRecordedIpaScript(`/ ${data?.ipa_transcript || ''} /`);
          setPronunciationAccuracy(`${pronunciationAccuracyValue}%`);
          const feedbackValue = data?.AIFeedback || data?.aiFeedback || data?.feedback || data?.ai_feedback || '';
          console.log('💬 AI Feedback Value:', feedbackValue);
          setAiFeedback(feedbackValue);

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
            
            // Thêm từ vào chuỗi, giữ khoảng trắng giữa các từ
            if (wordIdx > 0) {
              coloredWords += ' ';
            }
            coloredWords += wordTemp;
          }

          setOriginalScriptHtml(coloredWords);
          setCurrentSoundRecorded(true);
          setMainTitle('An English Speaking Platform with AI');

          // Update record with results
          if (currentRecordContentId) {
            try {
              // Upload audio to Cloudinary before submitting
              console.log('Uploading audio to Cloudinary...');
              const cloudinaryUrl = await uploadAudioToCloudinary({
                uri: uri,
                name: `record-${Date.now()}.mp3`,
                type: 'audio/mpeg',
              });

              if (!cloudinaryUrl) {
                console.error('Failed to upload audio to Cloudinary');
                setMainTitle('Lỗi: Không thể tải lên audio');
                Alert.alert('Lỗi', 'Không thể tải lên audio. Vui lòng thử lại.');
                setUiBlocked(false);
                return;
              }

              console.log('Audio uploaded to Cloudinary:', cloudinaryUrl);

              await updateRecord({
                recordId: currentRecordContentId,
                reviewData: {
                  audioRecordingURL: cloudinaryUrl,
                  score: Math.round(acc),
                  aiFeedback: feedbackValue,
                  transcribedText: data?.ipa_transcript || '',
                },
              });

              setMainTitle('Đã lưu kết quả!');
            } catch (error) {
              console.error('Error updating record:', error);
              setMainTitle('Lỗi: Không thể lưu kết quả');
              Alert.alert('Lỗi', 'Không thể lưu kết quả. Vui lòng thử lại.');
            }
          }
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
  }, [recording, currentContent, originalScriptHtml, AILanguage, apiMainPathSTS, STScoreAPIKey, currentRecordContentId, updateRecord, convertBlobToBase64]);

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

  // Fetch sample for specific content
  const fetchSampleForContent = useCallback(async (contentText: string) => {
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
          question: contentText,
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
  }, [AILanguage, STScoreAPIKey, apiMainPathSample, serverIsInitialized, serverWorking, initializeServer]);

  // Handle Next Question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < recordsList.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextRecord = recordsList[nextIndex];
      if (nextRecord) {
        // Reset states immediately
        setRecordedIpaScript('');
        setPronunciationAccuracy('');
        setAiFeedback('');
        setCurrentSoundRecorded(false);
        setOriginalScriptHtml('');
        setIpaScript('');
        setTranslatedScript('');
        recordedAudioUriRef.current = null;
        
        // Reset word-level IPA data
        setRealTranscriptsIpa([]);
        setMatchedTranscriptsIpa([]);
        setWordCategories([]);
        setStartTime([]);
        setEndTime([]);

        // Fetch new sample with the new content
        const newContent = nextRecord.content || content;
        fetchSampleForContent(newContent);
      }
    }
  }, [currentQuestionIndex, recordsList, content]);

  // Handle Previous Question
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      const prevRecord = recordsList[prevIndex];
      if (prevRecord) {
        // Reset states immediately
        setRecordedIpaScript('');
        setPronunciationAccuracy('');
        setAiFeedback('');
        setCurrentSoundRecorded(false);
        setOriginalScriptHtml('');
        setIpaScript('');
        setTranslatedScript('');
        recordedAudioUriRef.current = null;
        
        // Reset word-level IPA data
        setRealTranscriptsIpa([]);
        setMatchedTranscriptsIpa([]);
        setWordCategories([]);
        setStartTime([]);
        setEndTime([]);

        // Fetch new sample with the new content
        const newContent = prevRecord.content || content;
        fetchSampleForContent(newContent);
      }
    }
  }, [currentQuestionIndex, recordsList, content]);

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
    // Chỉ fetch sample khi có content và không đang loading records (chỉ chạy 1 lần đầu)
    if ((currentContent || content) && !isLoadingRecords && recordsList.length > 0 && !initialSampleFetched) {
      getNextSample();
      setInitialSampleFetched(true);
    }
  }, [currentContent, isLoadingRecords, recordsList.length, initialSampleFetched]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format AI feedback HTML (simple version)
  const formatAiFeedback = (feedback: string): string => {
    // Simple formatting - replace newlines with breaks
    return feedback.replace(/\n/g, '<br/>');
  };

  // Kiểm tra lỗi và hiển thị thông báo
  useEffect(() => {
    if (isErrorRecords && recordsError) {
      const errorMessage = (recordsError as any)?.message || 'Không tìm thấy nội dung record hoặc không có quyền.';
      Alert.alert('Lỗi', errorMessage);
    }
  }, [isErrorRecords, recordsError]);

  // Kiểm tra nếu không có records hoặc content
  if (isLoadingRecords) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isErrorRecords || recordsList.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-red-500 font-semibold text-lg mt-4 text-center">
            {isErrorRecords ? 'Không tìm thấy nội dung record hoặc không có quyền' : 'Chưa có record nào'}
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            {isErrorRecords 
              ? 'Vui lòng kiểm tra lại quyền truy cập hoặc thử lại sau.'
              : 'Vui lòng tạo record mới để bắt đầu luyện tập.'}
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

  // Kiểm tra nếu không có content
  if (!currentContent && !content) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-500 font-semibold text-lg mt-4 text-center">
            Không có nội dung để luyện tập
          </Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">
            Vui lòng chọn record khác hoặc tạo record mới.
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
                  <Text className="text-xs text-gray-600 mb-1 font-medium text-center" numberOfLines={1}>Điểm số</Text>
                  <Text className="text-2xl font-bold text-emerald-600 text-center">
                    {pronunciationAccuracy || '-'}
                  </Text>
                </View>

                {/* Buy Review Button - Only show if recordId exists */}
                {currentRecordId && (
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🛒 Opening Buy Review Modal with recordId:', currentRecordId);
                      setIsBuyReviewModalOpen(true);
                    }}
                    className="w-14 h-14 rounded-full bg-orange-500 items-center justify-center"
                  >
                    <Ionicons name="cart" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}

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
                <View>
                  {/* Display text with colored letters */}
                  <View className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
                    {originalScriptHtml && typeof originalScriptHtml === 'string' && originalScriptHtml.includes('<span') ? (
                      <View className="items-center">
                        {renderColoredText(originalScriptHtml)}
                      </View>
                    ) : (
                      <Text className="text-2xl font-bold text-blue-900 leading-relaxed text-center">
                        {currentContent}
                      </Text>
                    )}
                  </View>

                  {/* IPA Transcriptions */}
                  {ipaScript && (
                    <View className="mb-2">
                      <Text className="text-xs text-gray-500 mb-1">Phiên âm chuẩn:</Text>
                      <Text className="text-lg text-gray-700 font-medium">{ipaScript}</Text>
                    </View>
                  )}

                  {recordedIpaScript && recordedIpaScript !== '/ /' && (
                    <View className="mb-2">
                      <Text className="text-xs text-blue-500 mb-1">Phát âm của bạn:</Text>
                      <Text className="text-lg text-blue-600 font-medium">{recordedIpaScript}</Text>
                    </View>
                  )}

                  {translatedScript && (
                    <Text key="translatedScript" className="text-base text-gray-500 text-center mt-2">{translatedScript}</Text>
                  )}
                </View>
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

      {/* Buy Review Modal */}
      <BuyReviewModal
        visible={isBuyReviewModalOpen}
        onClose={() => setIsBuyReviewModalOpen(false)}
        recordId={currentRecordId}
      />

      {/* AI Feedback Modal */}
      <Modal
        visible={openAiFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOpenAiFeedbackModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ minHeight: '70%', maxHeight: '95%' }}>
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

            {/* <View className="px-4 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setOpenAiFeedbackModal(false)}
                className="py-3 bg-blue-600 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Đóng</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LearnerRecordQuestion;

