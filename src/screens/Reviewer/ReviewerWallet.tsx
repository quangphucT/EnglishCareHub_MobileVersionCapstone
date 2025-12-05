import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import {
  useReviewReviewWallet,
  useReviewReviewStatistics,
} from "../../hooks/reviewer/useReviewerReview";
import { useReviewerCoinWithdraw } from "../../hooks/reviewer/useReviewerCoin";

type TransactionStatus = "Withdraw" | "Reject" | "Pending";

type TransactionRow = {
  id: string;
  amount: number;
  coin: number;
  createdAt: string;
  bankName: string;
  accountNumber: string;
  description?: string;
  status: TransactionStatus;
};

const PAGE_SIZE = 10;

const statusConfig: Record<
  TransactionStatus,
  { bg: string; text: string; label: string }
> = {
  Withdraw: {
    bg: "bg-green-50 border border-green-200",
    text: "text-green-600",
    label: "Đã duyệt",
  },
  Reject: {
    bg: "bg-red-50 border border-red-200",
    text: "text-red-600",
    label: "Từ chối",
  },
  Pending: {
    bg: "bg-amber-50 border border-amber-200",
    text: "text-amber-600",
    label: "Đang xử lý",
  },
};

const ReviewerWalletScreen: React.FC = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [coinInput, setCoinInput] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const { data: walletData, isLoading, error, refetch } =
    useReviewReviewWallet(pageNumber, PAGE_SIZE);
  const { data: statsData } = useReviewReviewStatistics();
  const withdrawMutation = useReviewerCoinWithdraw();

  const totals = useMemo(() => {
    if (!walletData?.isSucess || !walletData.data) {
      return {
        totalEarnedMoney: 0,
        totalEarnedCoin: 0,
        currentBalanceMoney: 0,
        currentBalanceCoin: 0,
      };
    }

    return {
      totalEarnedMoney: walletData.data.totalEarnedMoney ?? 0,
      totalEarnedCoin: walletData.data.totalEarnedCoin ?? 0,
      currentBalanceMoney: walletData.data.currentBalanceMoney ?? 0,
      currentBalanceCoin: walletData.data.currentBalanceCoin ?? 0,
    };
  }, [walletData]);

  const transactions = useMemo<TransactionRow[]>(() => {
    const items = walletData?.data?.transactions?.items ?? [];
    return items.map(item => ({
      id: item.transactionId || item.orderCode,
      amount: item.money ?? 0,
      coin: item.coin ?? 0,
      createdAt: item.createdAt,
      bankName: item.bankName ?? "",
      accountNumber: item.accountNumber ?? "",
      description: item.description,
      status: item.status,
    }));
  }, [walletData]);

  const pagination = useMemo(() => {
    const tx = walletData?.data?.transactions;
    const totalItems = tx?.totalItems ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    return {
      totalItems,
      totalPages,
    };
  }, [walletData]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setCoinInput("");
    setBankName("");
    setAccountNumber("");
  }, []);

  const handleSubmitWithdraw = useCallback(async () => {
    if (withdrawMutation.isPending) {
      return;
    }

    const coinValue = Number(coinInput);
    if (!coinInput || Number.isNaN(coinValue) || coinValue <= 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập số coin hợp lệ.");
      return;
    }

    if (!bankName.trim() || !accountNumber.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ ngân hàng và số tài khoản.");
      return;
    }

    try {
      await withdrawMutation.mutateAsync({
        coin: coinValue,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
      });
      closeModal();
      refetch();
    } catch (mutationError) {
      // mutation hook already shows alert
      console.error("Withdraw error:", mutationError);
    }
  }, [
    accountNumber,
    bankName,
    closeModal,
    coinInput,
    refetch,
    withdrawMutation,
  ]);

  const renderTransaction = (tx: TransactionRow) => {
    const config = statusConfig[tx.status];
    return (
      <View
        key={tx.id}
        className="p-4 rounded-2xl bg-white mb-3 border border-slate-100 shadow-sm"
      >
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-lg font-semibold text-slate-900">
              {tx.amount.toLocaleString("vi-VN")} VND
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              {tx.coin.toLocaleString("vi-VN")} coin
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${config.bg}`}
          >
            <Text className={`text-xs font-semibold ${config.text}`}>
              {config.label}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-1">
          <Ionicons name="business" size={16} color="#475569" />
          <Text className="text-sm text-slate-600 ml-2">
            {tx.bankName || "Chưa cung cấp"}
          </Text>
        </View>
        <View className="flex-row items-center mb-1">
          <Ionicons name="card" size={16} color="#475569" />
          <Text className="text-sm text-slate-600 ml-2">
            {tx.accountNumber || "Chưa cung cấp"}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time" size={14} color="#94a3b8" />
          <Text className="text-xs text-slate-500 ml-2">
            {dayjs(tx.createdAt).format("DD/MM/YYYY HH:mm")}
          </Text>
        </View>

        {tx.description && tx.status === "Reject" ? (
          <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <Text className="text-xs text-red-700 font-semibold">
              Lý do: {tx.description}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="flex-1 px-4"
      >
        <View className="mt-4 space-y-4">
          <View className="bg-white rounded-3xl p-5 border border-purple-100 shadow-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-medium text-slate-600">
                Tổng thu nhập
              </Text>
              <Ionicons name="trending-up" size={22} color="#7c3aed" />
            </View>
            <Text className="text-3xl font-bold text-slate-900">
              {totals.totalEarnedMoney.toLocaleString("vi-VN")} VND
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              {totals.totalEarnedCoin.toLocaleString("vi-VN")} coin
            </Text>
          </View>

          <View className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-medium text-slate-600">
                Số dư hiện tại
              </Text>
              <Ionicons name="wallet" size={22} color="#059669" />
            </View>
            <Text className="text-3xl font-bold text-slate-900">
              {totals.currentBalanceMoney.toLocaleString("vi-VN")} VND
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              {totals.currentBalanceCoin.toLocaleString("vi-VN")} coin
            </Text>
            {statsData?.data?.coinBalance ? (
              <Text className="text-xs text-emerald-600 mt-2">
                + {statsData.data.coinBalance.toLocaleString("vi-VN")} coin trong tuần này
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mt-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-md">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-xl font-semibold text-slate-900">
                Lịch sử rút coin
              </Text>
              <Text className="text-xs text-slate-500 mt-1">
                Theo dõi trạng thái yêu cầu rút coin của bạn
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              className="px-4 py-2 rounded-full bg-slate-100   hover:bg-slate-200 transition-colors duration-200 active:bg-slate-200"
              activeOpacity={0.9}
            >
              <Text className="text-black text-sm font-semibold ">
                Rút coin
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="mt-3 text-sm text-slate-500">
                Đang tải lịch sử...
              </Text>
            </View>
          ) : error ? (
            <View className="py-10 items-center">
              <Ionicons name="alert-circle" size={36} color="#ef4444" />
              <Text className="mt-3 text-sm text-red-500 text-center">
                Không thể tải dữ liệu: {error.message}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="mt-4 px-4 py-2 rounded-full border border-slate-200"
              >
                <Text className="text-sm font-semibold text-slate-700">
                  Thử lại
                </Text>
              </TouchableOpacity>
            </View>
          ) : transactions.length === 0 ? (
            <View className="py-10 items-center">
              <Ionicons name="document-text" size={40} color="#94a3b8" />
              <Text className="mt-3 text-sm text-slate-500">
                Chưa có giao dịch nào
              </Text>
            </View>
          ) : (
            <>
              {transactions.map(renderTransaction)}
              <View className="flex-row items-center justify-between mt-4">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setPageNumber(prev => Math.max(1, prev - 1))
                  }
                  disabled={pageNumber === 1}
                  className={`px-4 py-2 rounded-full border ${
                    pageNumber === 1
                      ? "border-slate-100 bg-slate-100"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      pageNumber === 1 ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Trước
                  </Text>
                </TouchableOpacity>

                <Text className="text-xs text-slate-500">
                  Trang {pageNumber}/{pagination.totalPages}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setPageNumber(prev =>
                      Math.min(pagination.totalPages, prev + 1)
                    )
                  }
                  disabled={pageNumber >= pagination.totalPages}
                  className={`px-4 py-2 rounded-full border ${
                    pageNumber >= pagination.totalPages
                      ? "border-slate-100 bg-slate-100"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      pageNumber >= pagination.totalPages
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Tiếp
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <View className="flex-1 bg-black/40 justify-center px-4">
            <View className="bg-white rounded-3xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-lg font-semibold text-slate-900">
                    Yêu cầu rút coin
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    1 coin = 1.000 VND
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeModal}
                  className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-1">
                    Số coin muốn rút
                  </Text>
                  <TextInput
                    value={coinInput}
                    onChangeText={setCoinInput}
                    keyboardType="numeric"
                    placeholder="Ví dụ: 100"
                    className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-1">
                    Tên ngân hàng
                  </Text>
                  <TextInput
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Ví dụ: Vietcombank"
                    className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-1">
                    Số tài khoản
                  </Text>
                  <TextInput
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                    placeholder="Nhập số tài khoản"
                    className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSubmitWithdraw}
                disabled={withdrawMutation.isPending}
                className={`mt-6 rounded-2xl py-3 items-center ${
                  withdrawMutation.isPending
                    ? "bg-slate-200"
                    : "bg-gradient-to-r from-blue-600 to-purple-600"
                }`}
              >
                {withdrawMutation.isPending ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text className="text-black font-semibold text-base border border-slate-200 rounded-2xl px-4 py-2 hover:bg-slate-200 transition-colors duration-200 active:bg-slate-200">
                    Xác nhận rút coin
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default ReviewerWalletScreen;
