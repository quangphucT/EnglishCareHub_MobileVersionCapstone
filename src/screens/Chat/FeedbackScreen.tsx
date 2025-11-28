import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

// Types - matching TranscriptionMessage from ChatScreen
interface TranscriptionMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date | string;
}

interface FeedbackSection {
  title: string;
  description: string;
  items: string[];
}

const AI_FEEDBACK_URL = process.env.EXPO_PUBLIC_AI_FEEDBACK_URL;
const CONVERSATION_MESSAGES_KEY = 'ai_conversation_messages';

const FeedbackScreen = () => {
  const navigation = useNavigation<any>();
  
  const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
  const [feedbackSections, setFeedbackSections] = useState<FeedbackSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMessagesAndFetchFeedback = async () => {
      try {
        const data = await AsyncStorage.getItem(CONVERSATION_MESSAGES_KEY);
        if (data) {
          const parsedMessages: TranscriptionMessage[] = JSON.parse(data);
          setMessages(parsedMessages);

          // If we have messages, fetch feedback
          if (parsedMessages.length > 0) {
            await fetchFeedbackFromAPI(parsedMessages);
          }
        }
      } catch (err) {
        console.error('Error loading messages from storage:', err);
        setError('Không thể tải lịch sử hội thoại');
      }
    };

    loadMessagesAndFetchFeedback();
  }, []);

  const fetchFeedbackFromAPI = async (msgs: TranscriptionMessage[]) => {
    setLoading(true);
    setError(null);
    setFeedbackSections([]);

    try {
      // Combine messages into text format
      const conversationText = msgs
        .map((msg) => {
          const speaker = msg.isUser ? 'You' : 'Agent';
          return `${speaker}: ${msg.text}`;
        })
        .join('\n');

      // Call the API
      const response = await fetch(`${AI_FEEDBACK_URL}/aiFeedback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: conversationText,
        }),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setFeedbackSections(parseFeedback(data.feedback || ''));
    } catch (err) {
    
      setError((err as Error).message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      fetchFeedbackFromAPI(messages);
    }
  };

  const handleGoBack = () => {
    // Clear messages from storage
    AsyncStorage.removeItem(CONVERSATION_MESSAGES_KEY);
    // Navigate back to MainTabs (Chat tab)
    navigation.navigate('Home');
  };

  // Parse feedback text into sections
  const parseFeedback = (text: string): FeedbackSection[] => {
    if (!text) return [];

    const sections: FeedbackSection[] = [];
    let currentSection: FeedbackSection | null = null;

    const pushCurrentSection = () => {
      if (currentSection) {
        sections.push({
          title: currentSection.title,
          description: currentSection.description.trim(),
          items: currentSection.items,
        });
      }
    };

    text.split('\n').forEach((rawLine: string) => {
      const line = rawLine.trim();
      if (!line) return;

      const sectionMatch = line.match(/^\*\*(.+?)\*\*:?(.+)?$/);

      if (sectionMatch) {
        pushCurrentSection();
        currentSection = {
          title: sectionMatch[1],
          description: sectionMatch[2]?.trim() ?? '',
          items: [],
        };
        return;
      }

      if (!currentSection) {
        currentSection = { title: '', description: '', items: [] };
      }

      const listMatch = line.match(/^\d+\.\s*(.+)$/);
      if (listMatch) {
        currentSection.items.push(listMatch[1]);
        return;
      }

      if (currentSection.items.length > 0) {
        currentSection.items[currentSection.items.length - 1] += ` ${line}`;
      } else if (currentSection.description) {
        currentSection.description += ` ${line}`;
      } else {
        currentSection.description = line;
      }
    });

    pushCurrentSection();

    return sections.filter(
      (section) =>
        section.title || section.description || section.items.length > 0
    );
  };

  // Flatten sections for display
  const getDisplaySections = () => {
    const displaySections: { number: number; text: string }[] = [];
    let counter = 1;

    feedbackSections.forEach((section) => {
      if (section.items.length > 0) {
        section.items.forEach((item) => {
          displaySections.push({
            number: counter++,
            text: item,
          });
        });
      } else if (section.description) {
        displaySections.push({
          number: counter++,
          text: section.description,
        });
      }
    });

    return displaySections;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={handleGoBack}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
          <Text className="text-gray-600 ml-2">Quay lại</Text>
        </TouchableOpacity>
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm ml-1">
            {dayjs().format('MMM D, YYYY h:mm A')}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View className="items-center py-6 px-4">
          <View className="w-12 h-12 bg-purple-600 rounded-xl items-center justify-center mb-3">
            <Ionicons name="chatbubbles" size={24} color="white" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">
            Phản hồi về cuộc trò chuyện
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Phân tích và đánh giá từ AI về cuộc hội thoại của bạn
          </Text>
        </View>

        <View className="px-4">
          {/* Loading State */}
          {loading && (
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text className="text-xl font-bold text-gray-900 mt-4">
                Đang phân tích...
              </Text>
              <Text className="text-gray-500 mt-2 text-center">
                AI đang xem xét cuộc trò chuyện của bạn
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View className="bg-red-50 rounded-2xl p-6 items-center border border-red-200">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="alert-circle" size={32} color="#DC2626" />
              </View>
              <Text className="text-xl font-bold text-red-900 mb-2">
                Có lỗi xảy ra
              </Text>
              <Text className="text-red-600 text-center mb-4">{error}</Text>
              <TouchableOpacity
                onPress={handleRetry}
                className="bg-red-600 px-6 py-3 rounded-xl flex-row items-center"
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* No Messages State */}
          {!loading && !error && messages.length === 0 && (
            <View className="bg-amber-50 rounded-2xl p-8 items-center border border-amber-200">
              <View className="w-16 h-16 bg-amber-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={32} color="#D97706" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                Chưa có cuộc trò chuyện
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                Vui lòng bắt đầu một cuộc trò chuyện trước khi xem phản hồi
              </Text>
              <TouchableOpacity
                onPress={handleGoBack}
                className="bg-purple-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  Bắt đầu trò chuyện
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Feedback Content */}
          {!loading && !error && feedbackSections.length > 0 && (
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {getDisplaySections().map((item, index) => (
                <View key={index}>
                  <View className="flex-row items-start py-4">
                    <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center mr-3 mt-1">
                      <Text className="text-white font-bold">{item.number}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 leading-6">
                        {item.text}
                      </Text>
                    </View>
                  </View>
                  {index < getDisplaySections().length - 1 && (
                    <View className="border-b border-gray-100" />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Conversation Summary */}
          {!loading && messages.length > 0 && (
            <View className="mt-6 bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <Text className="text-purple-900 font-semibold mb-3">
                Tóm tắt cuộc hội thoại
              </Text>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-purple-600">
                    {messages.filter((m) => m.isUser).length}
                  </Text>
                  <Text className="text-purple-700 text-sm">Tin nhắn của bạn</Text>
                </View>
                <View className="w-px bg-purple-200" />
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-purple-600">
                    {messages.filter((m) => !m.isUser).length}
                  </Text>
                  <Text className="text-purple-700 text-sm">Phản hồi AI</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleGoBack}
          className="bg-purple-600 py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">
            Quay về trang chính
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FeedbackScreen;
