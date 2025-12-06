import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AudioReviewScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-gray-900 ml-4">
            Đánh giá Audio
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Empty State */}
          <View className="items-center justify-center py-20">
            <View className="w-24 h-24 bg-purple-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="mic-outline" size={48} color="#7C3AED" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Chưa có đánh giá nào
            </Text>
            <Text className="text-gray-500 text-center px-8">
              Các bài đánh giá phát âm của bạn sẽ hiển thị tại đây
            </Text>
          </View>

          {/* Coming Soon Features */}
          <View className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Tính năng sắp ra mắt
            </Text>
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                <Text className="ml-3 text-gray-700 flex-1">
                  Đánh giá phát âm chi tiết từng từ
                </Text>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                <Text className="ml-3 text-gray-700 flex-1">
                  Lịch sử tiến độ cải thiện phát âm
                </Text>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                <Text className="ml-3 text-gray-700 flex-1">
                  Luyện tập lại các từ khó
                </Text>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                <Text className="ml-3 text-gray-700 flex-1">
                  So sánh với người bản ngữ
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AudioReviewScreen;
