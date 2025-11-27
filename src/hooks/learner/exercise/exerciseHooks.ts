import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
// import { startExerciseService } from "../../../api/exercise.service";

export interface StartExerciseRequest {
  learningPathExerciseId: string;
}

export interface StartExerciseResponse {
  isSucess: boolean;
  data: any;
  businessCode: string;
  message: string;
}

// Start exercise
// export const useStartExercise = () => {
//   const queryClient = useQueryClient();

//   return useMutation<StartExerciseResponse, Error, StartExerciseRequest>({
//     mutationFn: (data) => startExerciseService(data),
//     onSuccess: () => {
//       // Invalidate learning path queries to refresh data
//       queryClient.invalidateQueries({ queryKey: ["learningPathCourseFull"] });
//     },
//     onError: (error) => {
//       console.error("❌ Start exercise error:", error);
//     },
//   });
// };
