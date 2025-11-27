import httpClient from "./httpClient";
import { 
  StartExerciseRequest,
  StartExerciseResponse 
} from "../hooks/learner/exercise/exerciseHooks";

// Start exercise
export const startExerciseService = async (
  data: StartExerciseRequest
): Promise<StartExerciseResponse> => {
  try {
    console.log("🚀 [API] Calling POST /LearningPathExercise/start");
    console.log("📦 [API] Request:", data);
    
    const response = await httpClient.post<StartExerciseResponse>(
      `LearningPathExercise/${data.learningPathExerciseId}/start`
    );
    
    console.log("✅ [API] Start exercise response:", JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error: any) {
    console.error("❌ [API] Error:", error?.response?.data);
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể bắt đầu bài tập";
    throw new Error(message);
  }
};
