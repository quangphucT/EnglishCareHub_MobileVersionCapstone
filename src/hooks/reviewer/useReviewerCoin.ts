import { Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    reviewerCoinHistoryWithdrawService,
    reviewerCoinWithdrawService,
    type ReviewerCoinHistoryWithdrawResponse,
    type ReviewerCoinWithdrawResponse,
} from "../../api/reviewerCoin.service";

export const useReviewerCoinWithdraw = () => {
    const queryClient = useQueryClient();
    return useMutation<ReviewerCoinWithdrawResponse, Error, { coin: number; bankName: string; accountNumber: string }>({
        mutationFn: reviewerCoinWithdrawService,
        onSuccess: () => {
            Alert.alert("Thành công", "Rút coin thành công");
            // Invalidate và refetch wallet data
            queryClient.invalidateQueries({ queryKey: ["reviewReviewWallet"] });
        },
        onError: (error) => {
            Alert.alert("Lỗi", error.message || "Rút coin thất bại");
        },
    });
}

export const useReviewerCoinHistoryWithdraw = () => {
    return useQuery<ReviewerCoinHistoryWithdrawResponse, Error>({
        queryKey: ["reviewerCoinHistoryWithdraw"],
        queryFn: reviewerCoinHistoryWithdrawService,
    });
}