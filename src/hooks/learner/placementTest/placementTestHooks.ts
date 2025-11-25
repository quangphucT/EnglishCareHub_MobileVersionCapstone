import { useMutation, useQuery } from "@tanstack/react-query";
import  { placementTestService, submitTestAssessmentService } from "../../../api/placementTest.service";
import { Alert } from "react-native";

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
    staleTime: 1000 * 60 * 5, 
    retry: 2,
  });
};


export interface SubmitTestAssessmentRequest {
  learnerProfileId: string;
  numberOfQuestion: number;
  tests: TestItem[];
}

export interface TestItem {
  type: string;
  assessmentDetails: AssessmentDetail[];
}

export interface AssessmentDetail {
  questionAssessmentId: string;
  score: number;
  aI_Feedback: string;
}
export interface SubmitTestAssessmentResponse {
  isSucess: boolean;
  data: {
    assessmentId: string;
    learnerProfileId: string;
    averageScore: number;
    assignedLevel: string;
  };
  businessCode: string;
  message: string;
}

export const useSubmitTestAssessment = () => {
  return useMutation<SubmitTestAssessmentResponse, Error, SubmitTestAssessmentRequest>({
    mutationFn: submitTestAssessmentService,
    onError: (error) => {
      Alert.alert("Error", error.message || "Submit test assessment failed");
    }
  });
};