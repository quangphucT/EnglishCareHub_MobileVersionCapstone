import React from 'react';
import { View, Text } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000' }) => {
  const iconMap: { [key: string]: string } = {
    'google': 'G',
    'eye': '👁️',
    'eye-off': '🙈',
    'arrow-right': '→',
    'wave': '👋'
  };

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.8, color }}>{iconMap[name] || '?'}</Text>
    </View>
  );
};

export default Icon;