import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorMessageProps {
  error: string;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  type = 'error' 
}) => {
  if (!error) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'error':
        return { icon: 'alert-circle-outline', color: '#EF4444' }; // red-500
      case 'warning':
        return { icon: 'warning-outline', color: '#F59E0B' }; // amber-500
      case 'info':
        return { icon: 'information-circle-outline', color: '#3B82F6' }; // blue-500
      default:
        return { icon: 'alert-circle-outline', color: '#EF4444' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <View className="flex-row items-center mt-2 ml-2">
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={color}
        style={{ marginRight: 6 }}
      />
      <Text 
        className="text-sm flex-1"
        style={{ color }}
      >
        {error}
      </Text>
    </View>
  );
};

interface HintMessageProps {
  message: string;
}

export const HintMessage: React.FC<HintMessageProps> = ({ message }) => {
  return (
    <View className="flex-row items-center mt-2 ml-2">
      <Ionicons 
        name="information-circle-outline" 
        size={16} 
        color="#9CA3AF"
        style={{ marginRight: 6 }}
      />
      <Text className="text-gray-400 text-xs flex-1">
        {message}
      </Text>
    </View>
  );
};