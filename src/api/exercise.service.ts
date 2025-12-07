import httpClient from "./httpClient";
import { 
  StartExerciseRequest,
  StartExerciseResponse,
  SubmitAnswerQuestionRequest,
  SubmitAnswerQuestionResponse
} from "../hooks/learner/exercise/exerciseHooks";

// Start exercise
export const startExerciseService = async (
  data: StartExerciseRequest
): Promise<StartExerciseResponse> => {
  try {
    
    const response = await httpClient.put<StartExerciseResponse>(
      `LearningPathExercise/${data.learningPathExerciseId}/status?status=${data.status}`
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể bắt đầu bài tập";
    throw new Error(message);
  }
};

// Submit answer question
export const submitAnswerQuestionService = async (
  data: SubmitAnswerQuestionRequest
): Promise<SubmitAnswerQuestionResponse> => {
  try {
    // Tách learningPathQuestionId ra khỏi body vì nó đã nằm trong URL path
    const { learningPathQuestionId, ...bodyData } = data;
    
    const response = await httpClient.post<SubmitAnswerQuestionResponse>(
      `LearnerAnswer/${learningPathQuestionId}/submit`,
      bodyData  // Chỉ gửi các field cần thiết, không có learningPathQuestionId
    );
    return response.data;
  } catch (error: any) {
 
    
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể nộp câu trả lời";
    throw new Error(message);
  }
};
