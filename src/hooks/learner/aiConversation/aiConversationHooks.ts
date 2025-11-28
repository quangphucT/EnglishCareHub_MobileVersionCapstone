import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getAIPackagesService,
  chargeCoinForConversationService,
  startConversationService,
} from "../../../api/aiConversation.service";
import {
 
    ChartCoinForConversationPayload,
    ChartCoinForConversationResponse,
  GetAIConversationChargesResponse,
  StartConversationResponse,
} from "../../../types/aiConversation.d";

// Re-export types for convenience
export type {  StartConversationResponse };

// Hooks
export const useGetAIPackages = () => {
  return useQuery<GetAIConversationChargesResponse, Error>({
    queryKey: ["AIPackages"],
    queryFn: getAIPackagesService,
    staleTime: 1000 * 60 * 5,
  });
};

export const useChargeCoinForConversation = () => {
  return useMutation<ChartCoinForConversationResponse, Error, ChartCoinForConversationPayload>({
    mutationFn: chargeCoinForConversationService,
  });
};

export const useStartConversation = () => {
  return useMutation<StartConversationResponse, Error, string>({
    mutationFn: startConversationService,
  });
};
