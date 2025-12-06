import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MyRecordingsScreen = () => {
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
            Thu âm của tôi
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Empty State */}
          <View className="items-center justify-center py-20">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="recording-outline" size={48} color="#3B82F6" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Chưa có bản ghi âm nào
            </Text>
            <Text className="text-gray-500 text-center px-8">
              Các bản ghi âm từ bài tập và trò chuyện AI sẽ được lưu tại đây
            </Text>
          </View>

          {/* Info Card */}
          <View className="bg-blue-50 rounded-2xl p-4 mb-6">
            <View className="flex-row">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-900 font-semibold mb-1">
                  Ghi âm tự động
                </Text>
                <Text className="text-blue-700 text-sm">
                  Hệ thống sẽ tự động lưu các bản ghi âm khi bạn thực hiện bài tập phát âm hoặc trò chuyện với AI
                </Text>
              </View>
            </View>
          </View>

          {/* Coming Soon Features */}
          <View className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Tính năng sắp có
            </Text>
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                <Text className="ml-3 text-gray-700 flex-1">
                  Nghe lại bản ghi âm
                </Text>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                <Text className="ml-3 text-gray-700 flex-1">
                  Chia sẻ bản ghi âm với giáo viên
                </Text>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                <Text className="ml-3 text-gray-700 flex-1">
                  Xuất file âm thanh
                </Text>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                <Text className="ml-3 text-gray-700 flex-1">
                  Quản lý và xóa bản ghi
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default MyRecordingsScreen;
