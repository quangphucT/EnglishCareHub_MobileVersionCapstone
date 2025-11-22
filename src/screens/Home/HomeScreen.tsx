import React from 'react'
import { Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLogout } from '../../hooks/useAuth'
import { useAuthRefresh } from '../../navigation/AppNavigator'

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const logoutMutation = useLogout();
  const { refreshAuth } = useAuthRefresh();

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await refreshAuth();
      },
    });
  };

  return (
    <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
      <View 
        className="flex-1 p-4"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom,
        }}
      >
        <TouchableOpacity 
          onPress={handleLogout}
          disabled={logoutMutation.isPending}
          className="bg-red-500 rounded-xl py-3 px-6 mb-4"
        >
          <View className="flex-row items-center justify-center">
            {logoutMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Đăng xuất
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-center">
          Home Screen
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default HomeScreen
