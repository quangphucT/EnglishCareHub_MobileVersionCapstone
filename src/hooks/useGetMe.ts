// hooks/useGetMe.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getMeService } from '../api/user.service';
export interface UserResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "LEARNER" | "REVIEWER" | "ADMIN" | "MANAGER"; 
  avatarUrl: string;
  status: "Active" | "Pending" | "Banned";
  coinBalance: number;
  learnerProfile: LearnerProfile | null;
  reviewerProfile: ReviewerProfile | null;

}
export interface ReviewerProfile {
  reviewerProfileId: string;
  userId: string;
  experience: string;
  rating: number;
  status: "Pending" | "Approved" | "Rejected"; 
  levels: string;
  walletId: string;
  balance: number;
  createdAt: string; 
  updatedAt: string | null;
  isDeleted: boolean;
}
export interface LearnerProfile {
  learnerProfileId: string;
  pronunciationScore: number;
  userId: string;
  experience: string;
  rating: number;
  status: "Pending" | "Approved" | "Rejected"; 
  level: string;
  walletId: string;
  balance: number;
  createdAt: string; // nếu muốn Date → thì convert sau
  updatedAt: string | null;
  isDeleted: boolean;
}
export const useGetMeQuery = () => {
  return useQuery<UserResponse, Error>({
    queryKey: ["getMe"],
    queryFn: getMeService,
    staleTime: 1000 * 60 * 5, 
  });
};
