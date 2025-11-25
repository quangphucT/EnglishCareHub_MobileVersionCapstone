import httpClient from "./httpClient";
import { GetPlacementTestResponse, SubmitTestAssessmentRequest, SubmitTestAssessmentResponse } from "../hooks/learner/placementTest/placementTestHooks";



// get placement test
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
};


  // submit placement test
 export const submitTestAssessmentService = async (
  body: SubmitTestAssessmentRequest
): Promise<SubmitTestAssessmentResponse> => {
  try {
    const response = await httpClient.post<SubmitTestAssessmentResponse>(
      "AssessmentLearner/placement-test/submit",
      body
    );
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || "Gửi đánh giá thất bại";
    throw new Error(message);
  }
};


