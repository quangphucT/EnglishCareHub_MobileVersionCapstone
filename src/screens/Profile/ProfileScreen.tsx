import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
      <View 
        className="flex-1 p-4 bg-white"
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom,
        }}
      >
        <Text className="text-2xl font-bold text-green-600">
          Profile Screen
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default ProfileScreen