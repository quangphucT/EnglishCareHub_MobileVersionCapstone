import { useMutation, useQuery } from "@tanstack/react-query";
import placementTestService from "../../../api/placementTest.service";

export interface GetPlacementTestResponse {
  isSucess: boolean;
  data: {
    assessmentId: string;
    createdAt: string; 
    numberOfQuestion: number;
    sections: Section[];
  };
  businessCode: string;
  message: string;
}

export interface Section {
  type: "paragraph" | "word" | "sentence"; // hoặc string nếu muốn mở rộng
  questions: Question[];
}

export interface Question {
  questionAssessmentId: string;
  content: string;
}

export const useGetPlacementTest = () => {
  return useQuery({
    queryKey: ['placementTest'],
    queryFn: async () => {
      const response = await placementTestService.getPlacementTest();
      return response;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
};

export const useSubmitPlacementTest = () => {
  return useMutation({
    mutationFn: async (data: { 
      assessmentId: string; 
      numberOfQuestion: number;
      tests: {
        type: string;
        assessmentDetails: {
          questionAssessmentId: string;
          score: number;
          aI_Feedback: string;
        }[];
      }[];
    }) => {
      return await placementTestService.submitPlacementTest(data);
    },
  });
};