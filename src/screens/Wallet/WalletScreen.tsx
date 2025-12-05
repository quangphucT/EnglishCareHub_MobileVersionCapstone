import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { useGetMeQuery } from '../../hooks/useGetMe';
import { CoinPackage, useBuyingCoinServicePackages, useCancelBuyingCoinServicePackages, useGetCoinServicePackage, useGetOrderCodeStatusQuery } from '../../hooks/learner/coin/coinHooks';
import { getOrderCodeStatusService } from '../../api/coin.service';

const WalletScreen = () => {
  const qrRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const { data: userData, refetch: refetchUser } = useGetMeQuery();

  // get coin service packages
  const { data: coinPackagesData, isLoading: isLoadingPackages } = useGetCoinServicePackage();


  const { mutate: buyCoin, isPending: isBuying } = useBuyingCoinServicePackages();
  const { mutate: cancelOrder } = useCancelBuyingCoinServicePackages();

  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const { refetch: refetchOrderStatus } = useGetOrderCodeStatusQuery(orderCode || "");
  const coinPackages: CoinPackage[] = coinPackagesData?.data || [];

  // Polling for order status
  useEffect(() => {
    if (!orderCode || !showQrModal || !isPolling) return;

    let isCancelled = false;

    const pollStatus = async () => {
      if (isCancelled) return;
      
      try {
        console.log('🔄 Polling order status for:', orderCode);
        const res = await getOrderCodeStatusService(orderCode);
        
        if (isCancelled) return;
        
        console.log('📦 Order status response:', res);
        const status = res?.status;

        if (status === 'Paid') {
          setIsPolling(false);
          setShowQrModal(false);
          setQrCodeImage(null);
          setOrderCode(null);
          Alert.alert('Thành công', 'Thanh toán thành công! Coin đã được cộng vào tài khoản.');
          refetchUser();
        } else if (status === 'Cancelled') {
          setIsPolling(false);
          setShowQrModal(false);
          setQrCodeImage(null);
          setOrderCode(null);
          Alert.alert('Đã hủy', 'Giao dịch đã bị hủy.');
        }
      } catch (error: any) {
        if (isCancelled) return;
        console.error('Polling error:', error?.response?.status);
      }
    };

    // Delay đầu tiên 2 giây để BE có thời gian xử lý
    const timeoutId = setTimeout(pollStatus, 2000);
    const intervalId = setInterval(pollStatus, 3000);
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [orderCode, showQrModal, isPolling]);

  const clearPaymentState = () => {
    setIsPolling(false);
    setShowQrModal(false);
    setQrCodeImage(null);
    setOrderCode(null);
  };

  const handleBuyCoin = (servicePackageId: string) => {
    setLoadingPackageId(servicePackageId);

    buyCoin(
      { servicePackageId },
      {
        onSuccess: (data) => {
          setQrCodeImage(data?.qrBase64);
          setOrderCode(data?.orderCode);
          setShowPackagesModal(false);
          setShowQrModal(true);
          setIsPolling(true);
        },
        onError: (error: any) => {
          Alert.alert('Lỗi', error?.message || 'Không thể tạo đơn hàng');
        },
        onSettled: () => {
          setLoadingPackageId(null);
        },
      }
    );
  };

  const handleCancelOrder = () => {
    if (orderCode) {
      cancelOrder({ orderCode },{
        onSuccess: () => {
          Alert.alert('Đã hủy', 'Giao dịch đã được hủy.');
        },
        onError: (error: any) => {
          Alert.alert('Lỗi', error?.message || 'Không thể hủy đơn hàng');
        }
      });
    }
    clearPaymentState();
  };

  const handleSaveQrCode = async () => {
    if (!qrRef.current) return;

    try {
      setIsSavingQr(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh để lưu QR code');
        return;
      }

      // Capture the QR view
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Thành công', 'Đã lưu QR code vào thư viện ảnh. Mở app ngân hàng và quét mã để thanh toán.');
    } catch (error) {
      console.error('Save QR error:', error);
      Alert.alert('Lỗi', 'Không thể lưu QR code');
    } finally {
      setIsSavingQr(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          💰 Ví Coin
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Balance Card */}
          <View className="bg-yellow-500 rounded-2xl p-6 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-yellow-100 text-sm mb-1">
                  Số dư hiện tại
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-3xl font-bold">
                    {userData?.coinBalance || 0}
                  </Text>
                  <Text className="text-white text-lg ml-2">Coins</Text>
                </View>
              </View>
              <View className="w-14 h-14 bg-yellow-400 rounded-full items-center justify-center">
                <Ionicons name="wallet" size={28} color="white" />
              </View>
            </View>
          </View>

          {/* Buy Coin Button */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Nạp Coin
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              Mua coin để mở khoá các khoá học Premium
            </Text>
            <TouchableOpacity
              onPress={() => setShowPackagesModal(true)}
              className="bg-blue-600 rounded-xl py-3 items-center flex-row justify-center"
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Chọn gói Coin</Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={24} color="#2563EB" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-blue-900 mb-1">
                  Hướng dẫn nạp Coin
                </Text>
                <Text className="text-xs text-blue-700 leading-5">
                  1. Chọn gói Coin phù hợp{'\n'}
                  2. Lưu mã QR vào thư viện ảnh{'\n'}
                  3. Mở app ngân hàng, chọn quét mã QR{'\n'}
                  4. Quét mã QR đã lưu và xác nhận thanh toán{'\n'}
                  5. Coin sẽ được cộng tự động sau khi thanh toán
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Coin Packages Modal */}
      <Modal
        visible={showPackagesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPackagesModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <View>
                <Text className="text-xl font-bold text-gray-900">Chọn gói Coin</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPackagesModal(false)}>
                <Ionicons name="close-circle" size={32} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Packages List */}
            <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
              {isLoadingPackages ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text className="text-gray-500 mt-4">Đang tải gói coin...</Text>
                </View>
              ) : (
                <View className="gap-4 pb-6">
                  {coinPackages.map((pkg) => {
                    const hasBonus = pkg.bonusPercent > 0;
                    const isLoading = loadingPackageId === pkg.servicePackageId;

                    return (
                      <TouchableOpacity
                        key={pkg.servicePackageId}
                        onPress={() => handleBuyCoin(pkg.servicePackageId)}
                        disabled={isLoading || isBuying}
                        activeOpacity={0.7}
                        className="rounded-2xl overflow-hidden border border-gray-200"
                        style={{
                          backgroundColor: 'white',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 8,
                          elevation: 3,
                        }}
                      >
                        <View className="p-4">
                          {/* Header Row */}
                          <View className="flex-row items-start justify-between mb-3">
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-gray-900">{pkg.name}</Text>
                              <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                                {pkg.description}
                              </Text>
                            </View>
                            
                          </View>

                          {/* Coin Display */}
                          <View className="bg-yellow-50 rounded-xl p-3 mb-3">
                            <View className="flex-row items-center justify-center">
                              <View className="w-10 h-10 bg-yellow-400 rounded-full items-center justify-center mr-3">
                                <Ionicons name="logo-bitcoin" size={22} color="white" />
                              </View>
                              <Text className="text-3xl font-black text-yellow-600">
                                {pkg.numberOfCoin.toLocaleString()}
                              </Text>
                              <Text className="text-base text-yellow-700 font-medium ml-2">Coin</Text>
                            </View>
                          </View>

                          {/* Price & Button Row */}
                          <View className="flex-row items-center justify-between">
                            <View>
                              <Text className="text-xs text-gray-500">Giá</Text>
                              <Text className="text-xl font-bold text-gray-900">
                                {pkg.price.toLocaleString()}
                                <Text className="text-sm font-normal text-gray-500"> đ</Text>
                              </Text>
                            </View>

                            <View 
                              className={`px-6 py-2.5 rounded-full ${
                                isLoading ? 'bg-gray-300' : 'bg-blue-600'
                              }`}
                            >
                              {isLoading ? (
                                <ActivityIndicator size="small" color="white" />
                              ) : (
                                <Text className="text-white font-semibold">Mua ngay</Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQrModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancelOrder}
      >
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <View className="bg-blue-600 px-6 py-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                  <Ionicons name="qr-code" size={24} color="white" />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">Quét mã để thanh toán</Text>
                  <Text className="text-blue-100 text-xs">Mở app ngân hàng và quét mã QR</Text>
                </View>
              </View>
            </View>

            {/* QR Code */}
            <View className="p-6 items-center">
              <View
                ref={qrRef}
                collapsable={false}
                className="bg-white p-4 rounded-2xl border-2 border-gray-200"
              >
                {qrCodeImage ? (
                  <Image
                    source={{ uri: qrCodeImage }}
                    style={{ width: 220, height: 220 }}
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-[220px] h-[220px] items-center justify-center">
                    <ActivityIndicator size="large" color="#2563EB" />
                  </View>
                )}
              </View>

              {/* Polling Status */}
              {isPolling && (
                <View className="flex-row items-center gap-2 mt-4">
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text className="text-sm text-blue-600">Đang chờ thanh toán...</Text>
                </View>
              )}
            </View>

            {/* Instructions */}
            <View className="px-6 pb-4">
              <View className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                <View className="flex-row items-start gap-2">
                  <Ionicons name="bulb" size={18} color="#CA8A04" />
                  <Text className="text-xs text-yellow-800 flex-1">
                    Bấm "Lưu QR" để lưu mã vào thư viện ảnh, sau đó mở app ngân hàng và quét mã từ ảnh đã lưu.
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3 px-6 pb-6">
              <TouchableOpacity
                onPress={handleCancelOrder}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center"
              >
                <Text className="text-gray-700 font-semibold">Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveQrCode}
                disabled={isSavingQr || !qrCodeImage}
                className="flex-1 py-3 rounded-xl bg-blue-600 items-center flex-row justify-center"
                style={{ opacity: isSavingQr || !qrCodeImage ? 0.5 : 1 }}
              >
                {isSavingQr ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="download" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">Lưu QR</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WalletScreen;
