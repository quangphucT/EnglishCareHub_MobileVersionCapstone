import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Trò chuyện với AI
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="bg-purple-50 rounded-2xl p-6 items-center mb-4">
            <Ionicons name="chatbubbles" size={64} color="#7C3AED" />
            <Text className="text-lg font-semibold text-gray-900 mt-4">
              Giao tiếp và luyện tập
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Trò chuyện với AI để cải thiện kỹ năng tiếng Anh
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;
