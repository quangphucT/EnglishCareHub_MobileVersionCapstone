import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startExerciseService, submitAnswerQuestionService } from "../../../api/exercise.service";

export interface StartExerciseRequest {
  learningPathExerciseId: string;
  status: string;
}

export interface StartExerciseResponse {
  isSucess: boolean;
  data: any;
  businessCode: string;
  message: string;
}

export interface SubmitAnswerQuestionRequest {
  learningPathQuestionId: string;
  audioRecordingUrl: string;
  transcribedText: string;
  scoreForVoice: number;
  explainTheWrongForVoiceAI: string;
}

export interface SubmitAnswerQuestionResponse {
  isSucess: boolean;
  data: {
    learnerAnswerId: string;
    [key: string]: any;
  };
  businessCode: string;
  message: string;
}

// Start exercise
export const useStartExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<StartExerciseResponse, Error, StartExerciseRequest>({
    mutationFn: (data) => startExerciseService(data),
    onSuccess: () => {
      // Invalidate learning path queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["learningPathCourseFull"] });
    },
    onError: (error) => {
      console.error("❌ Start exercise error:", error);
    },
  });
};

// Submit answer question
export const useSubmitAnswerQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation<SubmitAnswerQuestionResponse, Error, SubmitAnswerQuestionRequest>({
    mutationFn: (data) => submitAnswerQuestionService(data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["learningPathCourseFull"] });
    },
    onError: (error) => {
      console.error("❌ Submit answer error:", error);
    },
  });
};
