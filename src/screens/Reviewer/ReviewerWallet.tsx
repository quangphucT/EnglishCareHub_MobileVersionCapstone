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
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import {
  useReviewReviewWallet,
  useReviewReviewStatistics,
} from "../../hooks/reviewer/useReviewerReview";
import { useReviewerCoinWithdraw } from "../../hooks/reviewer/useReviewerCoin";

type TransactionStatus = "Withdraw" | "Reject" | "Rejected" | "Pending" | "Approved" | "Success" | "Completed";

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
  string,
  { bg: string; text: string; label: string }
> = {
  Withdraw: {
    bg: "bg-green-50 border border-green-200",
    text: "text-green-600",
    label: "Approved",
  },
  Approved: {
    bg: "bg-green-50 border border-green-200",
    text: "text-green-600",
    label: "Approved",
  },
  Success: {
    bg: "bg-green-50 border border-green-200",
    text: "text-green-600",
    label: "Success",
  },
  Completed: {
    bg: "bg-green-50 border border-green-200",
    text: "text-green-600",
    label: "Completed",
  },
  Reject: {
    bg: "bg-red-50 border border-red-200",
    text: "text-red-600",
    label: "Rejected",
  },
  Rejected: {
    bg: "bg-red-50 border border-red-200",
    text: "text-red-600",
    label: "Rejected",
  },
  Pending: {
    bg: "bg-amber-50 border border-amber-200",
    text: "text-amber-600",
    label: "Pending",
  },
};

const defaultStatusConfig = {
  bg: "bg-slate-50 border border-slate-200",
  text: "text-slate-600",
  label: "Unknown",
};

const ReviewerWalletScreen: React.FC = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [coinInput, setCoinInput] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const { data: walletData, isLoading, error, refetch } =
    useReviewReviewWallet(pageNumber, PAGE_SIZE);
  const { data: statsData, refetch: refetchStats } = useReviewReviewStatistics();
  const withdrawMutation = useReviewerCoinWithdraw();

  // Refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchStats();
    }, [refetch, refetchStats])
  );

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
      Alert.alert("Missing Information", "Please enter a valid coin amount.");
      return;
    }

    if (!bankName.trim() || !accountNumber.trim()) {
      Alert.alert("Missing Information", "Please enter bank name and account number.");
      return;
    }

  
      await withdrawMutation.mutateAsync({
        coin: coinValue,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
      });
      closeModal();
      refetch();
  
  }, [
    accountNumber,
    bankName,
    closeModal,
    coinInput,
    refetch,
    withdrawMutation,
  ]);

  const renderTransaction = (tx: TransactionRow) => {
    const config = statusConfig[tx.status] || defaultStatusConfig;
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
            {tx.bankName || "Not provided"}
          </Text>
        </View>
        <View className="flex-row items-center mb-1">
          <Ionicons name="card" size={16} color="#475569" />
          <Text className="text-sm text-slate-600 ml-2">
            {tx.accountNumber || "Not provided"}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time" size={14} color="#94a3b8" />
          <Text className="text-xs text-slate-500 ml-2">
            {dayjs(tx.createdAt).format("DD/MM/YYYY HH:mm")}
          </Text>
        </View>

        {tx.description ? (
          <View className={`mt-3 p-3 rounded-xl ${
            tx.status === "Reject" || tx.status === "Rejected"
              ? "bg-red-50 border border-red-200"
              : "bg-slate-50 border border-slate-200"
          }`}>
            <Text className={`text-xs font-medium ${
              tx.status === "Reject" || tx.status === "Rejected"
                ? "text-red-700"
                : "text-slate-600"
            }`}>
              {tx.status === "Reject" || tx.status === "Rejected" ? "Reason: " : "Note: "}
              {tx.description}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-3 bg-slate-50 border-b border-slate-200">
        <View className="flex-row items-center mb-2"> 
          <Text className="text-2xl font-black text-slate-900">
            My Wallet
          </Text>
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 bg-white rounded-3xl p-4 border border-purple-100 shadow-md">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-medium text-slate-600">
                Total Earnings
              </Text>
              <Ionicons name="trending-up" size={18} color="#7c3aed" />
            </View>
            <Text className="text-xl font-bold text-slate-900">
              {totals.totalEarnedMoney.toLocaleString("vi-VN")} VND
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              {totals.totalEarnedCoin.toLocaleString("vi-VN")} coin
            </Text>
          </View>

          <View className="flex-1 bg-white rounded-3xl p-4 border border-emerald-100 shadow-md">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-medium text-slate-600">
                Current Balance
              </Text>
              <Ionicons name="wallet" size={18} color="#059669" />
            </View>
            <Text className="text-xl font-bold text-slate-900">
              {totals.currentBalanceMoney.toLocaleString("vi-VN")} VND
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              {totals.currentBalanceCoin.toLocaleString("vi-VN")} coin
            </Text>
            
          </View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="flex-1 px-4"
      >
        <View className="mt-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-md">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-xl font-semibold text-slate-900">
                Withdrawal History
              </Text>
              <Text className="text-xs text-slate-500 mt-1">
                Track your coin withdrawal requests
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              className="px-4 py-2 rounded-full bg-slate-100   hover:bg-slate-200 transition-colors duration-200 active:bg-slate-200"
              activeOpacity={0.9}
            >
              <Text className="text-black text-sm font-semibold ">
                Withdraw
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="mt-3 text-sm text-slate-500">
                Loading history...
              </Text>
            </View>
          ) : error ? (
            <View className="py-10 items-center">
              <Ionicons name="alert-circle" size={36} color="#ef4444" />
              <Text className="mt-3 text-sm text-red-500 text-center">
                Failed to load data: {error.message}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="mt-4 px-4 py-2 rounded-full border border-slate-200"
              >
                <Text className="text-sm font-semibold text-slate-700">
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : transactions.length === 0 ? (
            <View className="py-10 items-center">
              <Ionicons name="document-text" size={40} color="#94a3b8" />
              <Text className="mt-3 text-sm text-slate-500">
                No transactions yet
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
                    Previous
                  </Text>
                </TouchableOpacity>

                <Text className="text-xs text-slate-500">
                  Page {pageNumber}/{pagination.totalPages}
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
                    Next
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
        <View className="flex-1 bg-black/40">
          <TouchableOpacity 
            activeOpacity={1}
            onPress={closeModal}
            style={{ flex: 1 }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 24 }}>
              {/* Drag Handle */}
              <View className="items-center mb-4">
                <View style={{ width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 }} />
              </View>
              
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-lg font-semibold text-slate-900">
                    Withdraw Coins
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    1 coin = 1,000 VND
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeModal}
                  className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 16 }}>
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-1">
                    Coin Amount
                  </Text>
                  <TextInput
                    value={coinInput}
                    onChangeText={setCoinInput}
                    keyboardType="numeric"
                    placeholder="Example: 100"
                    className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-1">
                    Bank Name
                  </Text>
                  <TextInput
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Example: Vietcombank"
                    className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-1">
                    Account Number
                  </Text>
                  <TextInput
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                    placeholder="Enter account number"
                    className="border border-slate-200 rounded-2xl px-4 py-3 text-base"
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSubmitWithdraw}
                disabled={withdrawMutation.isPending}
                className="mt-6 rounded-2xl py-4 items-center bg-blue-600"
              >
                {withdrawMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Confirm Withdrawal
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReviewerWalletScreen;
