import httpClient from "./httpClient";
import {
  GetCourseBasedOnLevelLearner,
  LearnerLevelsResponse,
  EnrollFirstCourseResponse,
  EnrollCourseNotFreeRequest,
  EnrollingCourseNotFreeResponse,
} from "../hooks/learner/course/courseHooks";

// Get courses based on learner's level
export const getCoursesBasedOnLevelLearnerService = async (
  level: string
): Promise<GetCourseBasedOnLevelLearner> => {
  try {
    const response = await httpClient.get<GetCourseBasedOnLevelLearner>(
      `CourseLearner/level/full?level=${level}`
    );

    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể tải danh sách khoá học";
    throw new Error(message);
  }
};

// get level and learnerCourseId after enrolling
export const getLevelsAndLearnerCourseIdsAfterEnrollingService =
  async (): Promise<LearnerLevelsResponse> => {
    try {
      const response = await httpClient.get<LearnerLevelsResponse>(
        "CourseLearner/myLevels"
      );

      return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách khoá học";
      throw new Error(message);
    }
  };

// enroll first course
export const enrollingFirstCourseService = async (
  courseId: string
): Promise<EnrollFirstCourseResponse> => {
  try {
    const response = await httpClient.post<EnrollFirstCourseResponse>(
      `CourseLearner/${courseId}/enroll`
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Tham gia khóa học thất bại";
    throw new Error(message);
  }
};

// enroll paid course (not free)
export const enrollCourseNotFreeService = async (
  data: EnrollCourseNotFreeRequest
): Promise<EnrollingCourseNotFreeResponse> => {
  try {
    const response = await httpClient.post<EnrollingCourseNotFreeResponse>(
      "LearningPathCourse",
      data
    );

    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Tham gia khóa học thất bại";
    throw new Error(message);
  }
};
