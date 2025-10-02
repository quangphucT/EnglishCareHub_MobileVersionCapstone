import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
      <View 
        className="flex-1 p-4"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom,
        }}
      >
        <Text className="text-2xl font-bold text-center">
          Home Screen
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default HomeScreen
