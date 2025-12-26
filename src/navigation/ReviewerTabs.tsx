import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReviewerMainScreen from '../screens/Reviewer/ReviewerMainScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ReviewerReviewScreen from '../screens/Reviewer/ReviewerReview';
import ReviewerWalletScreen from '../screens/Reviewer/ReviewerWallet';
import CompletedReviewsScreen from '../screens/Reviewer/CompletedReviewsScreen';
import { startTokenRefresher, stopTokenRefresher } from '../api/httpClient';

// Type for root stack navigation
type RootStackParamList = {
  Login: undefined;
  ReviewerTabs: undefined;
};

// Placeholder screens - you can create separate ones for reviewer
const PendingReviewsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
    <Ionicons name="document-text-outline" size={64} color="#F59E0B" />
    <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#1F2937' }}>
      Pending Reviews
    </Text>
    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
      List of student speaking exercises that need review
    </Text>
  </View>
);

// const CompletedReviewsScreen = () => (
//   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
//     <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
//     <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#1F2937' }}>
//       Completed Reviews
//     </Text>
//     <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
//       History of reviewed exercises
//     </Text>
//   </View>
// );

const StatisticsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
    <Ionicons name="bar-chart-outline" size={64} color="#8B5CF6" />
    <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#1F2937' }}>
      Statistics
    </Text>
    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
      View your review statistics
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Start token refresher when reviewer enters the app
    // Check every 45 seconds if reviewer is banned
    startTokenRefresher(() => {
      // Callback when reviewer is banned
      Alert.alert(
        'Tài khoản bị khóa',
        'Tài khoản reviewer của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Login screen and reset navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ],
        { cancelable: false }
      );
    });

    // Cleanup: stop token refresher when component unmounts
    return () => {
      stopTokenRefresher();
    };
  }, [navigation]);

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
          tabBarLabel: 'Home',
        }}
      /> */}
      <Tab.Screen 
        name="PendingReviews" 
        component={ReviewerReviewScreen}
        options={{
          tabBarLabel: 'Pending Reviews',
        }}
      />
      <Tab.Screen 
        name="CompletedReviewsScreen" 
        component={CompletedReviewsScreen}
        options={{
          tabBarLabel: 'Completed Reviews',
        }}
      />
      <Tab.Screen 
        name="ReviewerWallet" 
        component={ReviewerWalletScreen}
        options={{
          tabBarLabel: 'Coin Wallet',
        }}
      />
      <Tab.Screen 
        name="ReviewerProfile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default ReviewerTabs;
