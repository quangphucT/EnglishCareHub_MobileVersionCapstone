import { useQuery } from "@tanstack/react-query";
import { 
  getLearningPathCourseFullService, 
  LearningPathCourseFullRequest,
  LearningPathCourseFullResponse 
} from "../../../api/learningPath.service";

export interface LearningPathCourseParams {
  learningPathCourseId?: string;
  courseId?: string;
}

export const useLearningPathCourseFull = (
  params: LearningPathCourseParams, 
  enabled: boolean = true
) => {
  const isParamsValid = Boolean(
    params.learningPathCourseId && params.courseId
  );

  return useQuery<LearningPathCourseFullResponse, Error>({
    queryKey: ["learningPathCourseFull", params],
    queryFn: () => getLearningPathCourseFullService(params as LearningPathCourseFullRequest),
    enabled: enabled && isParamsValid,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
};