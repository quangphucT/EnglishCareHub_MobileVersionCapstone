import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLogout } from '../../hooks/useAuth';
import { useAuthRefresh } from '../../navigation/AppNavigator';
import { useGetMeQuery } from '../../hooks/useGetMe';

const ProfileScreen = () => {
  const logoutMutation = useLogout();
  const { refreshAuth } = useAuthRefresh();
  const { data: getMe, isLoading } = useGetMeQuery();

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await refreshAuth();
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Hồ sơ
        </Text>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* User Info Card */}
          <View className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6">
            <View className="items-center">
              <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-3">
                <Ionicons name="person" size={40} color="#7C3AED" />
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text className="text-white text-xl font-bold">
                    {getMe?.fullName || 'Người dùng'}
                  </Text>
                  <Text className="text-white/80 text-sm mt-1">
                    {getMe?.email || ''}
                  </Text>
                  {getMe?.learnerProfile?.level && (
                    <View className="bg-yellow-400 rounded-full px-4 py-1 mt-3">
                      <Text className="text-gray-900 font-semibold">
                        Level: {getMe.learnerProfile.level}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Profile Options */}
          <View className="bg-white rounded-2xl border border-gray-200 mb-6">
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={24} color="#6B7280" />
                <Text className="ml-3 text-gray-900 font-medium">
                  Thông tin cá nhân
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={24} color="#6B7280" />
                <Text className="ml-3 text-gray-900 font-medium">
                  Thông báo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons name="settings-outline" size={24} color="#6B7280" />
                <Text className="ml-3 text-gray-900 font-medium">
                  Cài đặt
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={handleLogout}
            disabled={logoutMutation.isPending}
            className="bg-red-500 rounded-xl py-4 mb-8"
          >
            <View className="flex-row items-center justify-center">
              {logoutMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Đăng xuất
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
