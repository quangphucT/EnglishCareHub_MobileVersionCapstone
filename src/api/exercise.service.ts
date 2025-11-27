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
    
    const response = await httpClient.post<StartExerciseResponse>(
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
    const response = await httpClient.post<SubmitAnswerQuestionResponse>(
      `LearnerAnswer/${data.learningPathQuestionId}/submit`,
      data
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
