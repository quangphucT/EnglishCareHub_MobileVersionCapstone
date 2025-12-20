import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReviewFeePackages, useBuyReview, useBuyReviewRecord } from '../hooks/learner/reviewFee/useReviewFee';
import type { ReviewFeePackage } from '../api/reviewFee.service';

interface BuyReviewModalProps {
  visible: boolean;
  onClose: () => void;
  learnerAnswerId?: string;
  recordId?: string;
}

const BuyReviewModal = ({ 
  visible, 
  onClose, 
  learnerAnswerId, 
  recordId 
}: BuyReviewModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState<ReviewFeePackage | null>(null);
  
  // Auto-detect action type based on available props
  const defaultActionType = recordId ? 'buyRecord' : 'buy';
  const [actionType, setActionType] = useState<'buy' | 'buyRecord'>(defaultActionType);

  // Get review fee packages
  const { data: packagesData, isLoading: isLoadingPackages } = useReviewFeePackages();
  
  // Debug: Log API response
  React.useEffect(() => {
    if (packagesData) {
      console.log(' Review Packages API Response:', JSON.stringify(packagesData, null, 2));
    }
  }, [packagesData]);
  
  // Extract packages from response
  const reviewPackages: ReviewFeePackage[] = packagesData?.data?.items?.filter(
    (pkg) => pkg.currentPricePolicy // Only show packages with active price policy
  ) || [];

  // Debug: Log filtered packages
  React.useEffect(() => {
    console.log(' Filtered Review Packages:', reviewPackages.length, reviewPackages);
  }, [reviewPackages]);

  // Check if current action type is valid
  const canBuy = actionType === 'buy' ? !!learnerAnswerId : !!recordId;

  // Buy review mutations
  const { mutate: buyReview, isPending: isBuyingReview } = useBuyReview();
  const { mutate: buyReviewRecord, isPending: isBuyingRecord } = useBuyReviewRecord();

  const handleBuy = () => {
    if (!selectedPackage) {
      Alert.alert('Lỗi', 'Vui lòng chọn gói đánh giá');
      return;
    }

    if (actionType === 'buy' && !learnerAnswerId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin câu trả lời');
      return;
    }

    if (actionType === 'buyRecord' && !recordId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin record');
      return;
    }

    if (actionType === 'buy') {
      buyReview(
        {
          learnerAnswerId: learnerAnswerId!,
          reviewFeeId: selectedPackage.reviewFeeId,
        },
        {
          onSuccess: () => {
            onClose();
            setSelectedPackage(null);
          },
        }
      );
    } else {
      buyReviewRecord(
        {
          recordId: recordId!,
          reviewFeeId: selectedPackage.reviewFeeId,
        },
        {
          onSuccess: () => {
            onClose();
            setSelectedPackage(null);
          },
        }
      );
    }
  };

  const isProcessing = isBuyingReview || isBuyingRecord;

  const formatCoin = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View 
          className="bg-white rounded-t-3xl"
          style={{ maxHeight: '90%', minHeight: '50%' }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-3 border-b border-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-bold text-gray-900">
                Mua đánh giá phát âm
              </Text>
              <TouchableOpacity onPress={onClose} disabled={isProcessing}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-600">
              Chọn gói đánh giá phù hợp để nhận phản hồi chi tiết về phát âm của bạn
            </Text>
          </View>

          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            bounces={true}
          >
            {/* Action Type Selection */}
            <View className="flex-row mb-4 bg-gray-100 rounded-xl p-1" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setActionType('buy');
                  setSelectedPackage(null);
                }}
                disabled={isProcessing || !learnerAnswerId}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: actionType === 'buy' ? '#7C3AED' : 'transparent',
                  opacity: !learnerAnswerId ? 0.5 : 1,
                }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons 
                    name="star" 
                    size={18} 
                    color={actionType === 'buy' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text 
                    style={{ 
                      marginLeft: 6,
                      fontSize: 14,
                      fontWeight: '600',
                      color: actionType === 'buy' ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    Mua đánh giá mới
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActionType('buyRecord');
                  setSelectedPackage(null);
                }}
                disabled={isProcessing || !recordId}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: actionType === 'buyRecord' ? '#7C3AED' : 'transparent',
                  opacity: !recordId ? 0.5 : 1,
                }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons 
                    name="checkmark-circle" 
                    size={18} 
                    color={actionType === 'buyRecord' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text 
                    style={{ 
                      marginLeft: 6,
                      fontSize: 14,
                      fontWeight: '600',
                      color: actionType === 'buyRecord' ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    Mua đánh giá record
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Warning message if current action type is not available */}
            {!canBuy && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <View className="flex-row items-start" style={{ gap: 12 }}>
                  <Ionicons name="warning" size={20} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text className="text-sm font-semibold text-yellow-800 mb-1">
                      Lưu ý:
                    </Text>
                    <Text className="text-sm text-yellow-700">
                      {actionType === 'buy'
                        ? 'Bạn cần có thông tin câu trả lời để mua đánh giá mới.'
                        : 'Bạn cần có thông tin record để mua đánh giá record.'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Loading State */}
            {isLoadingPackages ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text className="text-gray-600 mt-3">Đang tải danh sách gói...</Text>
              </View>
            ) : reviewPackages.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-3 text-center">
                  Hiện tại không có gói đánh giá nào khả dụng.
                </Text>
                <Text className="text-xs text-gray-400 mt-2">
                  Debug: Total items: {packagesData?.data?.items?.length || 0}
                </Text>
              </View>
            ) : (
              <>
                {/* Debug text */}
                <Text className="text-sm text-gray-600 mb-2">
                   Có {reviewPackages.length} gói đánh giá khả dụng
                </Text>
                
                {/* Package List */}
                <View style={{ gap: 12 }}>
                  {reviewPackages.map((pkg) => {
                    const pricePerReview = pkg.currentPricePolicy?.pricePerReviewFee || 0;
                    const totalPrice = pricePerReview * pkg.numberOfReview;
                    const isSelected = selectedPackage?.reviewFeeId === pkg.reviewFeeId;

                    return (
                      <TouchableOpacity
                        key={pkg.reviewFeeId}
                        onPress={() => setSelectedPackage(pkg)}
                        disabled={isProcessing}
                        style={{
                          borderWidth: 2,
                          borderColor: isSelected ? '#7C3AED' : '#E5E7EB',
                          borderRadius: 16,
                          padding: 16,
                          backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                        }}
                      >
                        <View className="flex-row items-center justify-between mb-3">
                          <View>
                            <Text className="text-lg font-bold text-gray-900">
                              {pkg.numberOfReview} đánh giá
                            </Text>
                            <Text className="text-sm text-gray-600 mt-1">
                              {formatCoin(pricePerReview)} Coin / đánh giá
                            </Text>
                          </View>
                          {isSelected && (
                            <View className="bg-purple-600 px-3 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">
                                Đã chọn
                              </Text>
                            </View>
                          )}
                        </View>

                        <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                          <View className="flex-row items-center">
                            <Ionicons name="wallet" size={16} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              Tổng giá:
                            </Text>
                          </View>
                          <Text className="text-xl font-bold text-green-600">
                            {formatCoin(totalPrice)} Coin
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Info Section */}
                <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                  <View className="flex-row items-start" style={{ gap: 12 }}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <View style={{ flex: 1 }}>
                      <Text className="text-sm font-semibold text-blue-800 mb-2">
                        Lưu ý:
                      </Text>
                      <View style={{ gap: 6 }}>
                        <Text className="text-sm text-blue-700">
                          • {actionType === 'buy'
                            ? 'Đánh giá mới sẽ được thực hiện bởi reviewer chuyên nghiệp'
                            : 'Đánh giá record sẽ được thực hiện trên bản ghi âm hiện tại'}
                        </Text>
                        <Text className="text-sm text-blue-700">
                          • Thanh toán sẽ được trừ từ số coin trong tài khoản của bạn
                        </Text>
                        <Text className="text-sm text-blue-700">
                          • Kết quả đánh giá sẽ được gửi đến bạn sau khi hoàn tất
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          {!isLoadingPackages && reviewPackages.length > 0 && (
            <View 
              className="px-4 py-4 bg-white border-t border-gray-200 flex-row" 
              style={{ 
                gap: 12,
                paddingBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 8,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                <Text className="text-base font-semibold text-gray-700">
                  Hủy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBuy}
                disabled={!selectedPackage || isProcessing || !canBuy}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: (!selectedPackage || isProcessing || !canBuy) ? '#E5E7EB' : '#7C3AED',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-base font-semibold text-white ml-2">
                      Đang xử lý...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons 
                      name={actionType === 'buy' ? 'star' : 'checkmark-circle'} 
                      size={18} 
                      color={(!selectedPackage || !canBuy) ? '#9CA3AF' : '#FFFFFF'} 
                    />
                    <Text 
                      style={{
                        marginLeft: 8,
                        fontSize: 16,
                        fontWeight: '600',
                        color: (!selectedPackage || !canBuy) ? '#9CA3AF' : '#FFFFFF',
                      }}
                    >
                      {actionType === 'buy' ? 'Mua đánh giá' : 'Mua đánh giá record'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default BuyReviewModal;
