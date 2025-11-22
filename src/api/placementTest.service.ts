import httpClient from "./httpClient";
import { GetPlacementTestResponse } from "../hooks/learner/placementTest/placementTestHooks";

export interface SubmitPlacementTestRequest {
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
}

export interface SubmitPlacementTestResponse {
  isSuccess: boolean;
  message: string;
  data?: any;
}

export const placementTestService = {
  getPlacementTest: async (): Promise<GetPlacementTestResponse> => {
    try {
      const response = await httpClient.get<GetPlacementTestResponse>("AssessmentLearner/placement-test");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch placement test. Please try again."
      );
    }
  },

  /**
   * Submit placement test answers
   */
  submitPlacementTest: async (
    data: SubmitPlacementTestRequest
  ): Promise<SubmitPlacementTestResponse> => {
    try {
      const response = await httpClient.post<SubmitPlacementTestResponse>(
        "Learner/placement-test/submit",
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to submit placement test. Please try again."
      );
    }
  },
};

export default placementTestService;
