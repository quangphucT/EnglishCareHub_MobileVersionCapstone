import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ValidationSummaryProps {
  errors: string[];
  title?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  errors, 
  title = "Vui lòng kiểm tra lại:" 
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-2">
        <Ionicons name="alert-circle" size={20} color="#EF4444" />
        <Text className="text-red-600 font-semibold ml-2 text-base">
          {title}
        </Text>
      </View>
      {errors.map((error, index) => (
        <View key={index} className="flex-row items-start ml-6 mb-1">
          <Text className="text-red-500 mr-2">•</Text>
          <Text className="text-red-600 text-sm flex-1">{error}</Text>
        </View>
      ))}
    </View>
  );
};

interface SuccessMessageProps {
  message: string;
  visible: boolean;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  visible 
}) => {
  if (!visible) return null;

  return (
    <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
      <View className="flex-row items-center">
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text className="text-green-600 font-semibold ml-2 text-base">
          {message}
        </Text>
      </View>
    </View>
  );
};