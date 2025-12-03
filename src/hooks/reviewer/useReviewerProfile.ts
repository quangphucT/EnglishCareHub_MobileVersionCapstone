import { useMutation, useQuery } from "@tanstack/react-query";
import {
  reviewerProfileGetService,
  reviewerProfilePutService,
  ReviewerProfileResponse,
} from "../../api/reviewerProfile.service";

interface ReviewerProfileUpdatePayload {
  userId: string;
  experience: string;
  fullname: string;
  phoneNumber: string;
}

export const useReviewerProfilePut = () => {
  return useMutation<
    ReviewerProfileResponse,
    Error,
    ReviewerProfileUpdatePayload
  >({
    mutationFn: ({ userId, experience, fullname, phoneNumber }) =>
      reviewerProfilePutService(userId, { experience, fullname, phoneNumber }),
  });
};

export const useReviewerProfileGet = (userId: string) => {
  return useQuery<ReviewerProfileResponse, Error>({
    queryKey: ["reviewerProfile", userId],
    queryFn: () => reviewerProfileGetService(userId),
  });
};