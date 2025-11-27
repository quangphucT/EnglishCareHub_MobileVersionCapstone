import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { 
  getCoursesBasedOnLevelLearnerService, 
  getLevelsAndLearnerCourseIdsAfterEnrollingService,
  enrollingFirstCourseService, 
  enrollCourseNotFreeService
} from "../../../api/course.service";
import { useLearnerStore } from "../../../store/learnerStore";
export interface GetCourseBasedOnLevelLearner {
  isSucess: boolean;
  data: CourseItem[];
  businessCode: string;
  message: string;
}
export interface CourseItem {
  courseId: string;
  title: string;
  numberOfChapter: number;
  orderIndex: number;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  description: string;
  price: number;
  duration: number;
  status: string;
  isFree: boolean;
  chapters: ChapterItem[];
}
export interface ChapterItem {
  chapterId: string;
  title: string;
  description: string;
  createdAt: string; // ISO date string
  numberOfExercise: number;
  exercises: ExerciseItem[];
}
export interface ExerciseItem {
  exerciseId: string;
  title: string;
  description: string;
  orderIndex: number;
  numberOfQuestion: number;
  isFree: boolean;
  questions: QuestionItem[];
}

export interface QuestionItem {
  questionId: string;
  text: string;
  type: string;
  orderIndex: number;
  phonemeJson: string;
}
// get courses based on level
export const useGetCoursesBasedOnLevelLearner = (level: string) => {
  return useQuery<GetCourseBasedOnLevelLearner, Error>({
    queryKey: ["getCoursesBasedOnLevelLearner", level],
    queryFn: () => getCoursesBasedOnLevelLearnerService(level),
    enabled: !!level,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
    retry: 2,
  });
};








export interface LearnerLevelsResponse {
  isSucess: boolean;
  data: {
    levels: LearnerLevel[];
  };
  businessCode: string;
  message: string;
}
export interface LearnerLevel {
  Level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"; // Chữ hoa L để khớp với API
  TotalCourses: number;
  CompletedCourses: number;
  Courses: LearnerCourse[]; // Chữ hoa C để khớp với API
}

export interface LearnerCourse {
  learnerCourseId: string;
  learningPathCourseId: string;
  courseId: string;
  status: "NotStarted" | "InProgress" | "Completed";
}
// get level and learner courseIdAfter enrolling
export const useGetLevelAndLearnerCourseIdAfterEnrolling = () => {
  return useQuery<LearnerLevelsResponse, Error>({
    queryKey: ["levelsAndlearnerCourseIds"], 
    queryFn: () => getLevelsAndLearnerCourseIdsAfterEnrollingService(),
  
  });
};








export interface EnrollFirstCourseResponse {
  isSucess: boolean;
  data: {
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"; 
    learningPathCourseId: string;
    learnerCourseId: string;
    courseId: string;
    status: "InProgress" | "Completed" ; 
  };
  businessCode: "INSERT_SUCESSFULLY" | string;
  message: string;
}

// enroll first course 
export const useEnrollFirstCourse = () => {
  const queryClient = useQueryClient();
  const setAllLearnerData = useLearnerStore((state) => state.setAllLearnerData);
  
  return useMutation<EnrollFirstCourseResponse, Error, string>({
    mutationFn: (courseId) => enrollingFirstCourseService(courseId),
    onSuccess: (data) => {
      // Lưu learner course data vào store
      setAllLearnerData({
        learnerCourseId: data.data.learnerCourseId,
        courseId: data.data.courseId,
        learningPathCourseId: data.data.learningPathCourseId,
        status: data.data.status,
      });
      
      // Invalidate queries để refresh data
      queryClient.invalidateQueries({ queryKey: ["levelsAndlearnerCourseIds"] });
      queryClient.invalidateQueries({ queryKey: ["getCoursesBasedOnLevelLearner"] });
      queryClient.invalidateQueries({ queryKey: ["getMe"] });
    },
    onError: (error) => {
      Alert.alert(
        "Lỗi",
        error.message || "Tham gia khóa học thất bại",
        [{ text: "OK" }]
      );
    },
  });
};


// enroll paid course 
export interface EnrollingCourseNotFreeResponse {
  isSucess: boolean;
  data: LearnerLevelDetail;
  businessCode: string;
  message: string;
}

export interface LearnerLevelDetail {
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  learningPathCourseId: string;
  courseId: string;
  status:  "InProgress" | "Completed"; 
}

export interface EnrollCourseNotFreeRequest{
    learnerCourseId: string;
    courseId: string;
}

export const useEnrollCourseNotFree = () => {
  const queryClient = useQueryClient();
  const setAllLearnerData = useLearnerStore((state) => state.setAllLearnerData);

  return useMutation<EnrollingCourseNotFreeResponse, Error, EnrollCourseNotFreeRequest>({
    mutationKey: ["enrollCourseNotFree"],
    mutationFn: (data) => enrollCourseNotFreeService(data),
    onSuccess: (data, variables) => {
      console.log("✅ Enroll paid course success:", data);
      
      // Lưu learner course data vào store
      setAllLearnerData({
        learnerCourseId: variables.learnerCourseId,
        courseId: data.data.courseId,
        learningPathCourseId: data.data.learningPathCourseId,
        status: data.data.status,
      });
      
      // Invalidate queries để refresh data
      queryClient.invalidateQueries({ queryKey: ["levelsAndlearnerCourseIds"] });
      queryClient.invalidateQueries({ queryKey: ["getCoursesBasedOnLevelLearner"] });
      queryClient.invalidateQueries({ queryKey: ["getMe"] });
      
      // Show success message
      Alert.alert(
        "Thành công", 
        "Bạn đã tham gia khóa học thành công!",
        [{ text: "OK" }]
      );
    },
    onError: (error) => {
      console.error("❌ Enroll paid course error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Tham gia khóa học thất bại. Vui lòng kiểm tra số dư Coin.",
        [{ text: "OK" }]
      );
    },
  });
};


