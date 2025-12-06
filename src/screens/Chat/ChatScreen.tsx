import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGetMeQuery } from '../../hooks/useGetMe';
import {
  useGetAIPackages,
  useChargeCoinForConversation,
} from '../../hooks/learner/aiConversation/aiConversationHooks';
import { AIConversationCharge } from '../../types/aiConversation.d';
import { useQueryClient } from '@tanstack/react-query';
import {
  LiveKitRoom,
  useVoiceAssistant,
  useLocalParticipant,
  useTracks,
  AudioSession,
  registerGlobals,
  useRoomContext,
} from '@livekit/react-native';
import { Track, RoomEvent } from 'livekit-client';

// Register LiveKit globals - wrapped in try-catch to prevent crashes
let livekitInitialized = false;
try {
  registerGlobals();
  livekitInitialized = true;
} catch (error) {
  console.warn('Failed to register LiveKit globals:', error);
}

// Types
interface TranscriptionMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Request microphone permission
const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Quyền truy cập microphone',
          message: 'Ứng dụng cần quyền truy cập microphone để trò chuyện với AI.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Từ chối',
          buttonPositive: 'Đồng ý',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // iOS handles permissions differently through Info.plist
};

// Voice Visualizer Component
const VoiceVisualizer: React.FC<{ isActive: boolean; color: string }> = ({
  isActive,
  color,
}) => {
  const animations = useRef(
    Array(5)
      .fill(0)
      .map(() => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isActive) {
      const animateBar = (anim: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      animations.forEach((anim, index) => {
        animateBar(anim, index * 100);
      });
    } else {
      animations.forEach((anim) => {
        anim.setValue(0.3);
      });
    }
  }, [isActive, animations]);

  return (
    <View className="flex-row items-end justify-center h-16 gap-1">
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={{
            width: 6,
            backgroundColor: color,
            borderRadius: 3,
            transform: [{ scaleY: anim }],
            height: 40,
          }}
        />
      ))}
    </View>
  );
};

// Voice Assistant Content Component
const VoiceAssistantContent: React.FC<{
  timeRemaining: number;
  onDisconnect: (messages: TranscriptionMessage[]) => void;
  onMessagesUpdate: (messages: TranscriptionMessage[]) => void;
  selectedPackage: AIConversationCharge | null;
}> = ({ timeRemaining, onDisconnect, onMessagesUpdate, selectedPackage }) => {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const messagesRef = useRef<TranscriptionMessage[]>([]);
  const processedTranscriptionsRef = useRef<Set<string>>(new Set());

  // Keep messagesRef in sync and notify parent
  useEffect(() => {
    messagesRef.current = messages;
    onMessagesUpdate(messages);
  }, [messages, onMessagesUpdate]);

  // Listen to agent transcriptions (AI speaking)
  useEffect(() => {
    if (agentTranscriptions && agentTranscriptions.length > 0) {
      const lastTranscription = agentTranscriptions[agentTranscriptions.length - 1];
      if (lastTranscription && lastTranscription.text) {
        const transcriptKey = `agent-${lastTranscription.text}`;
        
        // Check if already processed
        if (!processedTranscriptionsRef.current.has(transcriptKey)) {
          processedTranscriptionsRef.current.add(transcriptKey);
          
          const newMsg: TranscriptionMessage = {
            id: `agent-${Date.now()}`,
            text: lastTranscription.text,
            isUser: false,
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, newMsg]);
        }
      }
    }
  }, [agentTranscriptions]);

  // Listen to room transcriptions for user speech
  useEffect(() => {
    if (!room) return;

    const handleTranscriptionReceived = (
      transcriptions: any[],
      participant: any
    ) => {
      // Only process transcriptions from local participant (user)
      if (participant?.identity === localParticipant?.identity) {
        transcriptions.forEach((transcription) => {
          // Only add final transcriptions
          if (transcription.final && transcription.text) {
            const transcriptKey = `user-${transcription.text}`;
            
            if (!processedTranscriptionsRef.current.has(transcriptKey)) {
              processedTranscriptionsRef.current.add(transcriptKey);
              
              const newMsg: TranscriptionMessage = {
                id: `user-${Date.now()}-${Math.random()}`,
                text: transcription.text,
                isUser: true,
                timestamp: new Date(),
              };
              
              setMessages((prev) => [...prev, newMsg]);
            }
          }
        });
      }
    };

    // Subscribe to transcription events
    room.on(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);

    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);
    };
  }, [room, localParticipant]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateText = () => {
    switch (state) {
      case 'connecting':
        return 'Đang kết nối...';
      case 'initializing':
        return 'Đang khởi tạo...';
      case 'listening':
        return 'Đang lắng nghe...';
      case 'thinking':
        return 'Đang suy nghĩ...';
      case 'speaking':
        return 'AI đang nói...';
      default:
        return 'Sẵn sàng';
    }
  };

  const isAISpeaking = state === 'speaking';
  const isListening = state === 'listening';

  const handleEndConversation = useCallback(() => {
    onDisconnect(messagesRef.current);
  }, [onDisconnect]);

  return (
    <View className="flex-1">
      {/* Header with timer */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-purple-600">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">
            {formatTime(timeRemaining)}
          </Text>
        </View>
        <Text className="text-white font-medium">{selectedPackage?.allowedMinutes} phút</Text>
        <TouchableOpacity
          onPress={handleEndConversation}
          className="bg-red-500 px-4 py-2 rounded-full"
        >
          <Text className="text-white font-semibold">Kết thúc</Text>
        </TouchableOpacity>
      </View>

      {/* AI Status */}
      <View className="items-center py-6 bg-purple-50">
        <View className="w-24 h-24 rounded-full bg-purple-600 items-center justify-center mb-4">
          {isAISpeaking ? (
            <VoiceVisualizer isActive={true} color="white" />
          ) : (
            <Ionicons name="person" size={48} color="white" />
          )}
        </View>
        <Text className="text-lg font-semibold text-gray-900">AI Tutor</Text>
        <Text className="text-purple-600 mt-1">{getStateText()}</Text>
      </View>

      {/* Transcription Messages */}
      <View className="flex-1 px-4 py-2">
        <Text className="text-gray-500 text-sm mb-2 font-medium">
          Lịch sử hội thoại
        </Text>
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-400 mt-2">
                Bắt đầu nói để trò chuyện với AI
              </Text>
            </View>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                className={`mb-3 ${msg.isUser ? 'items-end' : 'items-start'}`}
              >
                <View
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.isUser ? 'bg-purple-600' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={msg.isUser ? 'text-white' : 'text-gray-900'}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Microphone Status */}
      <View className="items-center pb-6">
        <View
          className={`w-20 h-20 rounded-full items-center justify-center ${
            isListening ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-off'}
            size={32}
            color="white"
          />
        </View>
        <Text className="text-gray-600 mt-2">
          {isListening ? 'Đang ghi âm...' : 'Chờ AI phản hồi'}
        </Text>
      </View>
    </View>
  );
};

// Key for storing messages in AsyncStorage
const CONVERSATION_MESSAGES_KEY = 'ai_conversation_messages';

// Main ChatScreen Component
const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { data: userData } = useGetMeQuery();
  const { data: packagesData, isLoading: isLoadingPackages, error: packagesError } = useGetAIPackages();
  const chargeCoinMutation = useChargeCoinForConversation();

  const [selectedPackage, setSelectedPackage] = useState<AIConversationCharge | null>(null);
  const [isPackageModalVisible, setIsPackageModalVisible] = useState(false);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string>('');
  const [livekitUrl, setLivekitUrl] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [userName, setUserName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationMessagesRef = useRef<TranscriptionMessage[]>([]);

  const coinBalance = userData?.coinBalance ?? 0;
  const packages = packagesData ?? [];

  // Handle disconnect - defined early so timer can use it
  const handleDisconnect = useCallback(async (messages: TranscriptionMessage[] = []) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsConversationActive(false);
    setLivekitToken('');
    setLivekitUrl('');
    setSelectedPackage(null);
    setTimeRemaining(0);
    
    // Refresh user data
    queryClient.invalidateQueries({ queryKey: ['getMe'] });

    // Save messages to AsyncStorage and navigate to Feedback
    if (messages.length > 0) {
      try {
        await AsyncStorage.setItem(CONVERSATION_MESSAGES_KEY, JSON.stringify(messages));
        navigation.navigate('Feedback');
      } catch (error) {
        console.error('Failed to save messages:', error);
        Alert.alert('Kết thúc', 'Cuộc hội thoại đã kết thúc');
      }
    } else {
      Alert.alert('Kết thúc', 'Cuộc hội thoại đã kết thúc');
    }
  }, [queryClient, navigation]);

  // Timer countdown
  useEffect(() => {
    if (isConversationActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - disconnect with current messages
            handleDisconnect(conversationMessagesRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConversationActive, timeRemaining, handleDisconnect]);

  // Initialize audio session for LiveKit
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await AudioSession.configureAudio({
          android: {
            preferredOutputList: ['speaker'],
            audioTypeOptions: {
              manageAudioFocus: true,
              audioMode: 'normal',
              audioFocusMode: 'gain',
              audioStreamType: 'music',
              audioAttributesUsageType: 'media',
              audioAttributesContentType: 'speech',
            },
          },
          ios: {
            defaultOutput: 'speaker',
          },
        });
        await AudioSession.startAudioSession();
      } catch (error) {
        console.warn('Failed to setup audio session:', error);
      }
    };

    if (livekitInitialized) {
      setupAudio();
    }

    return () => {
      try {
        AudioSession.stopAudioSession();
      } catch (error) {
        console.warn('Failed to stop audio session:', error);
      }
    };
  }, []);

  const handleSelectPackage = (pkg: AIConversationCharge) => {
    if (coinBalance < pkg.amountCoin) {
      Alert.alert(
        'Không đủ coin',
        `Bạn cần ${pkg.amountCoin} coin để sử dụng gói này. Vui lòng nạp thêm coin.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedPackage(pkg);
  };

  // Get LiveKit token from endpoint
  const getToken = useCallback(async (name: string): Promise<{ token: string; url: string } | null> => {
    try {
      const tokenUrl = process.env.EXPO_PUBLIC_LIVEKIT_TOKEN_URL;
      if (!tokenUrl) {
        throw new Error('LiveKit token URL not configured');
      }

      const response = await fetch(`${tokenUrl}?name=${encodeURIComponent(name)}`);
      const bodyText = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status} ${bodyText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Failed to get token: unexpected response format');
      }
      const data = JSON.parse(bodyText);
      console.log('🎫 LiveKit token received:', data);
      
      return {
        token: data.token,
        url: data.url || process.env.EXPO_PUBLIC_LIVEKIT_URL,
      };
    } catch (error: any) {
      console.error('Failed to get token:', error);
      Alert.alert('Lỗi', 'Không thể kết nối. Vui lòng thử lại!');
      return null;
    }
  }, []);

  const handleStartConversation = async () => {
    if (!selectedPackage) {
      Alert.alert('Lỗi', 'Vui lòng chọn gói thời gian');
      return;
    }

    if (!userName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên của bạn');
      return;
    }

    if (coinBalance < selectedPackage.amountCoin) {
      Alert.alert('Lỗi', 'Số dư không đủ! Vui lòng nạp thêm coin');
      return;
    }

    // Check if LiveKit is initialized
    if (!livekitInitialized) {
      Alert.alert(
        'Lỗi khởi tạo',
        'Không thể khởi tạo tính năng trò chuyện. Vui lòng khởi động lại ứng dụng.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Request microphone permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert(
        'Không có quyền',
        'Vui lòng cấp quyền truy cập microphone để sử dụng tính năng này.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsConnecting(true);
    
    try {
      // Step 1: Get LiveKit token first
      const tokenData = await getToken(userName);
      
      if (!tokenData) {
        // getToken đã hiển thị Alert
        setIsConnecting(false);
        return;
      }

      // Step 2: Charge coin only if getToken succeeds
      await chargeCoinMutation.mutateAsync({
        aiConversationChargeId: selectedPackage.aiConversationChargeId,
      });

      // Step 3: Start conversation
      setLivekitToken(tokenData.token);
      setLivekitUrl(tokenData.url);
      setTimeRemaining(selectedPackage.allowedMinutes * 60);
      setIsPackageModalVisible(false);
      setIsConversationActive(true);

      // Refresh user data to update coin balance
      queryClient.invalidateQueries({ queryKey: ['getMe'] });
      
      Alert.alert('Thành công', 'Bắt đầu trò chuyện với AI!');
    } catch (error: any) {
      // Reset state if charge fails
      setLivekitToken('');
      setLivekitUrl('');
      setIsConversationActive(false);
      Alert.alert('Lỗi', error.message || 'Không thể khấu trừ coin. Vui lòng thử lại!');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRoomDisconnected = useCallback(() => {
    // Room disconnected unexpectedly - show alert
    handleDisconnect([]);
  }, [handleDisconnect]);

  // Callback to update messages from VoiceAssistantContent
  const handleMessagesUpdate = useCallback((messages: TranscriptionMessage[]) => {
    conversationMessagesRef.current = messages;
  }, []);

  // Render Conversation Screen
  if (isConversationActive && livekitToken && livekitUrl) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <LiveKitRoom
          serverUrl={livekitUrl}
          token={livekitToken}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={handleRoomDisconnected}
        >
          <VoiceAssistantContent
            timeRemaining={timeRemaining}
            onDisconnect={handleDisconnect}
            onMessagesUpdate={handleMessagesUpdate}
            selectedPackage={selectedPackage}
          />
        </LiveKitRoom>
      </SafeAreaView>
    );
  }

  // Render Main Screen
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Trò chuyện với AI
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Hero Section */}
          <View className="bg-purple-100 rounded-2xl p-6 items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-purple-600 items-center justify-center mb-4">
              <Ionicons name="chatbubbles" size={40} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              AI English Tutor
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Luyện tập giao tiếp tiếng Anh với AI tutor thông minh. Cải thiện
              phát âm và ngữ pháp qua hội thoại tự nhiên.
            </Text>
          </View>

          {/* Coin Balance */}
          <View className="flex-row items-center justify-between bg-yellow-50 rounded-xl p-4 mb-6">
            <View className="flex-row items-center">
              <Ionicons name="wallet" size={24} color="#F59E0B" />
              <Text className="text-gray-700 ml-2">Số dư của bạn:</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="logo-bitcoin" size={20} color="#F59E0B" />
              <Text className="text-lg font-bold text-yellow-600 ml-1">
                {coinBalance.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Features */}
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Tính năng nổi bật
          </Text>
          <View className="mb-6">
            {[
              {
                icon: 'mic',
                title: 'Nhận diện giọng nói',
                desc: 'AI hiểu và phản hồi theo giọng nói của bạn',
              },
              {
                icon: 'chatbubble-ellipses',
                title: 'Hội thoại tự nhiên',
                desc: 'Trò chuyện như với người thật',
              },
              {
                icon: 'school',
                title: 'Sửa lỗi phát âm',
                desc: 'Nhận phản hồi và cải thiện phát âm',
              },
              {
                icon: 'time',
                title: 'Linh hoạt thời gian',
                desc: 'Chọn gói thời gian phù hợp với bạn',
              },
            ].map((feature, index) => (
              <View
                key={index}
                className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-2"
              >
                <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
                  <Ionicons
                    name={feature.icon as any}
                    size={20}
                    color="#7C3AED"
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-gray-900">
                    {feature.title}
                  </Text>
                  <Text className="text-gray-500 text-sm">{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Start Button */}
          <TouchableOpacity
            className="bg-purple-600 rounded-xl py-4 items-center"
            onPress={() => setIsPackageModalVisible(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name="play" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Bắt đầu hội thoại
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Package Selection Modal */}
      <Modal
        visible={isPackageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPackageModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Chọn gói thời gian
              </Text>
              <TouchableOpacity
                onPress={() => setIsPackageModalVisible(false)}
              >
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* User Name Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">
                Tên của bạn
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Nhập tên của bạn"
                value={userName}
                onChangeText={setUserName}
              />
            </View>

            {/* Package List */}
            {isLoadingPackages ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#7C3AED" />
              </View>
            ) : packagesError ? (
              <View className="items-center py-8">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-500 mt-2 text-center">
                  Lỗi: {packagesError.message}
                </Text>
              </View>
            ) : packages.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-400 mt-2">
                  Không có gói nào khả dụng
                </Text>
              </View>
            ) : (
              <ScrollView className="max-h-64 mb-4">
                {packages.map((pkg) => {
                  const isSelected =
                    selectedPackage?.aiConversationChargeId === pkg.aiConversationChargeId;
                  const canAfford = coinBalance >= pkg.amountCoin;

                  return (
                    <TouchableOpacity
                      key={pkg.aiConversationChargeId}
                      className={`border-2 rounded-xl p-4 mb-3 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50'
                          : canAfford
                          ? 'border-gray-200'
                          : 'border-gray-200 opacity-50'
                      }`}
                      onPress={() => handleSelectPackage(pkg)}
                      disabled={!canAfford}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="font-bold text-gray-900 text-lg">
                            Gói {pkg.allowedMinutes} phút
                          </Text>
                          <Text className="text-gray-500 mt-1">
                            {pkg.allowedMinutes} phút trò chuyện
                          </Text>
                        </View>
                        <View className="items-end">
                          <View className="flex-row items-center">
                            <Ionicons
                              name="logo-bitcoin"
                              size={18}
                              color="#F59E0B"
                            />
                            <Text className="font-bold text-yellow-600 text-lg ml-1">
                              {pkg.amountCoin}
                            </Text>
                          </View>
                          {!canAfford && (
                            <Text className="text-red-500 text-xs mt-1">
                              Không đủ coin
                            </Text>
                          )}
                        </View>
                      </View>
                      {isSelected && (
                        <View className="absolute top-2 right-2">
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#7C3AED"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${
                selectedPackage && userName.trim()
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
              onPress={handleStartConversation}
              disabled={
                !selectedPackage ||
                !userName.trim() ||
                chargeCoinMutation.isPending ||
                isConnecting
              }
            >
              {chargeCoinMutation.isPending || isConnecting ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="chatbubbles" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Bắt đầu ({selectedPackage?.amountCoin ?? 0} coin)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatScreen;
