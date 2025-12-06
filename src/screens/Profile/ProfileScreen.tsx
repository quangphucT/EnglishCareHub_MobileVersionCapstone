import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogout } from '../../hooks/useAuth';
import { useAuthRefresh } from '../../navigation/AppNavigator';
import { useGetMeQuery } from '../../hooks/useGetMe';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const logoutMutation = useLogout();
  const { refreshAuth } = useAuthRefresh();
  const { data: getMe, isLoading } = useGetMeQuery();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await refreshAuth();
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Card with User Info */}
        <View className="bg-white px-4 pt-6 pb-8 mb-3">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Hồ sơ của tôi
          </Text>
          
          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full items-center justify-center shadow-lg">
              <Text className="text-white text-2xl font-bold">
                {isLoading ? '...' : (getMe?.fullName?.charAt(0).toUpperCase() || 'U')}
              </Text>
            </View>
            
            {/* User Info */}
            <View className="flex-1 ml-4">
              {isLoading ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <>
                  <Text className="text-lg font-bold text-gray-900">
                    {getMe?.fullName || 'Người dùng'}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    {getMe?.email || ''}
                  </Text>
                  {getMe?.learnerProfile?.level && (
                    <View className="flex-row items-center mt-2">
                      <View className="bg-purple-100 rounded-lg px-3 py-1">
                        <Text className="text-purple-700 font-semibold text-xs">
                          {getMe.learnerProfile.level}
                        </Text>
                      </View>
                      <View className="bg-green-100 rounded-lg px-3 py-1 ml-2">
                        <Text className="text-green-700 font-semibold text-xs">
                          {getMe.coinBalance || 0} Coins
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

       
        </View>

        {/* Learning Section */}
        <View className="px-4 mb-3">
          <Text className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            Học tập
          </Text>
          <View className="bg-white rounded-xl overflow-hidden shadow-sm">
            <TouchableOpacity 
              onPress={() => navigation.navigate('AudioReview' as never)}
              className="flex-row items-center p-4 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                <Ionicons name="mic" size={20} color="#7C3AED" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">Đánh giá Audio</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Xem đánh giá phát âm</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('MyRecordings' as never)}
              className="flex-row items-center p-4"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="recording" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">Thu âm của tôi</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Quản lý bản ghi âm</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View className="px-4 mb-3">
          <Text className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            Tài khoản
          </Text>
          <View className="bg-white rounded-xl overflow-hidden shadow-sm">
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="person" size={20} color="#6B7280" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">Thông tin cá nhân</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Chỉnh sửa hồ sơ</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="notifications" size={20} color="#6B7280" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">Thông báo</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Cài đặt thông báo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="settings" size={20} color="#6B7280" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">Cài đặt</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Tùy chỉnh ứng dụng</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-4 mt-2">
          <TouchableOpacity 
            onPress={handleLogout}
            disabled={logoutMutation.isPending}
            className="bg-white border border-red-200 rounded-xl py-4 shadow-sm"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center">
              {logoutMutation.isPending ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  <Text className="text-red-500 font-semibold text-base ml-2">
                    Đăng xuất
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center mt-8 mb-4">
          <Text className="text-xs text-gray-400">
            EnglishCareHub v1.0.1
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
