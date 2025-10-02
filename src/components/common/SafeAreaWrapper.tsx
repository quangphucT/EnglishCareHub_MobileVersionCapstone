import React from 'react';
import { SafeAreaView, SafeAreaViewProps, Edge } from 'react-native-safe-area-context';
import { useSafeArea } from '../../hooks/useSafeArea';

interface SafeAreaWrapperProps extends SafeAreaViewProps {
  children: React.ReactNode;
  edges?: Edge[];
  backgroundColor?: string;
  useCustomPadding?: boolean;
  extraPadding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  edges = ['top', 'left', 'right'],
  backgroundColor = 'transparent',
  useCustomPadding = false,
  extraPadding,
  style,
  ...props
}) => {
  const { insets } = useSafeArea();

  const customPaddingStyle = useCustomPadding
    ? {
        paddingTop: (insets.top || 0) + (extraPadding?.top || 0),
        paddingBottom: (insets.bottom || 0) + (extraPadding?.bottom || 0),
        paddingLeft: (insets.left || 0) + (extraPadding?.left || 0),
        paddingRight: (insets.right || 0) + (extraPadding?.right || 0),
      }
    : {};

  return (
    <SafeAreaView
      edges={edges}
      style={[
        { flex: 1, backgroundColor },
        customPaddingStyle,
        style
      ]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
};

export default SafeAreaWrapper;