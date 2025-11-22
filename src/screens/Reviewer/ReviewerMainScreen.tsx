import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const reviewerFeatures = [
  {
    id: 'pending-reviews',
    title: 'Pending Reviews',
    description: 'Review learner submissions',
    icon: 'document-text-outline',
    count: 12,
    color: '#F59E0B',
  },
  {
    id: 'completed-reviews',
    title: 'Completed Reviews',
    description: 'Your review history',
    icon: 'checkmark-circle-outline',
    count: 45,
    color: '#10B981',
  },
  {
    id: 'feedback-templates',
    title: 'Feedback Templates',
    description: 'Manage your feedback templates',
    icon: 'copy-outline',
    count: 8,
    color: '#6366F1',
  },
  {
    id: 'statistics',
    title: 'Review Statistics',
    description: 'View your review analytics',
    icon: 'bar-chart-outline',
    count: null,
    color: '#8B5CF6',
  },
];

export default function ReviewerMainScreen() {
  const navigation = useNavigation();

  const handleFeaturePress = (featureId: string) => {
    // Navigate to specific reviewer feature
    console.log(`Navigate to ${featureId}`);
  };

  const handleLogout = () => {
    // Implement logout logic
    (navigation as any).navigate('Login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-white">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-800">
              Reviewer Dashboard
            </Text>
            <Text className="text-gray-600 mt-1">
              Welcome back, Reviewer!
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="p-2 rounded-full bg-gray-100"
          >
            <Ionicons name="log-out-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View className="px-6 py-4">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Today's Overview
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">12</Text>
                <Text className="text-gray-600 text-sm">Pending</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">8</Text>
                <Text className="text-gray-600 text-sm">Completed</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-600">4.8</Text>
                <Text className="text-gray-600 text-sm">Avg Rating</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Feature Grid */}
        <View className="px-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </Text>
          <View className="grid grid-cols-2 gap-4">
            {reviewerFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                onPress={() => handleFeaturePress(feature.id)}
                className="bg-white rounded-2xl p-6 shadow-sm mb-4"
                style={{ width: (width - 48) / 2 }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={24}
                    color={feature.color}
                  />
                </View>
                <Text className="text-base font-semibold text-gray-800 mb-1">
                  {feature.title}
                </Text>
                <Text className="text-gray-600 text-sm mb-2">
                  {feature.description}
                </Text>
                {feature.count && (
                  <View className="flex-row items-center">
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: feature.color }}
                      >
                        {feature.count}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Recent Activity
          </Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="space-y-3">
              {[1, 2, 3].map((item) => (
                <View key={item} className="flex-row items-center py-2">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name="document-text" size={20} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">
                      Reviewed writing assignment #{item}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      2 hours ago
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}