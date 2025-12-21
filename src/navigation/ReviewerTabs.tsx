import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReviewerMainScreen from '../screens/Reviewer/ReviewerMainScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ReviewerReviewScreen from '../screens/Reviewer/ReviewerReview';
import ReviewerWalletScreen from '../screens/Reviewer/ReviewerWallet';
import CompletedReviewsScreen from '../screens/Reviewer/CompletedReviewsScreen';

// Placeholder screens - bạn có thể tạo riêng cho reviewer
const PendingReviewsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
    <Ionicons name="document-text-outline" size={64} color="#F59E0B" />
    <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#1F2937' }}>
      Bài chờ đánh giá
    </Text>
    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
      Danh sách bài nói của học viên cần đánh giá
    </Text>
  </View>
);

// const CompletedReviewsScreen = () => (
//   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
//     <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
//     <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#1F2937' }}>
//       Đã đánh giá
//     </Text>
//     <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
//       Lịch sử các bài đã đánh giá
//     </Text>
//   </View>
// );

const StatisticsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
    <Ionicons name="bar-chart-outline" size={64} color="#8B5CF6" />
    <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#1F2937' }}>
      Thống kê
    </Text>
    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
      Xem thống kê đánh giá của bạn
    </Text>
  </View>
);

export type ReviewerTabsParamList = {
  Dashboard: undefined;
  PendingReviews: undefined;
  CompletedReviewsScreen: undefined;
  ReviewerWallet: undefined;
  ReviewerProfile: undefined;
};

const Tab = createBottomTabNavigator<ReviewerTabsParamList>();

const ReviewerTabs = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
      <Tab.Navigator
        screenOptions={({ route }: { route: { name: keyof ReviewerTabsParamList } }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#059669', // Emerald color for reviewer
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: '#FFFFFF',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'PendingReviews') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'CompletedReviewsScreen') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'ReviewerWallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'ReviewerProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* <Tab.Screen 
        name="Dashboard" 
        component={ReviewerMainScreen}
        options={{
          tabBarLabel: 'Trang chủ',
        }}
      /> */}
      <Tab.Screen 
        name="PendingReviews" 
        component={ReviewerReviewScreen}
        options={{
          tabBarLabel: 'Chờ đánh giá',
        }}
      />
      <Tab.Screen 
        name="CompletedReviewsScreen" 
        component={CompletedReviewsScreen}
        options={{
          tabBarLabel: 'Đã đánh giá',
        }}
      />
      <Tab.Screen 
        name="ReviewerWallet" 
        component={ReviewerWalletScreen}
        options={{
          tabBarLabel: 'Ví Coin',
        }}
      />
      <Tab.Screen 
        name="ReviewerProfile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Hồ sơ',
        }}
      />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default ReviewerTabs;
