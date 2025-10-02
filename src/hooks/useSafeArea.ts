import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useSafeArea = () => {
  const insets = useSafeAreaInsets();

  return {
    // Raw insets
    insets,
    
    // Common padding styles
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    
    // Safe area styles for different use cases
    screenPadding: {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    
    headerPadding: {
      paddingTop: insets.top + 10,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    
    contentPadding: {
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    
    // Check if device has safe area
    hasTopInset: insets.top > 0,
    hasBottomInset: insets.bottom > 0,
    hasLeftInset: insets.left > 0,
    hasRightInset: insets.right > 0,
  };
};

export default useSafeArea;