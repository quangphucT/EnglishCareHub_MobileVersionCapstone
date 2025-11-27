import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const WalletScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Ví Coin
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/80 text-sm mb-1">
                  Số dư hiện tại
                </Text>
                <Text className="text-white text-3xl font-bold">
                  0 Coins
                </Text>
              </View>
              <Ionicons name="wallet" size={48} color="white" />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Quản lý và nạp Coin
            </Text>
            <TouchableOpacity className="bg-blue-600 rounded-xl py-3 items-center">
              <Text className="text-white font-semibold">Nạp Coin</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default WalletScreen;
