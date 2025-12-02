import httpClient from "./httpClient";

// Types
interface QuestionMedia {
  questionMediaId: string;
  accent: string;
  audioUrl: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  source: string | null;
}

interface Question {
  learningPathQuestionId: string;
  questionId: string;
  status: string;
  score: number;
  numberOfRetake: number;
  text: string;
  type: string;
  orderIndex: number;
  media: QuestionMedia[];
}

interface Exercise {
  learningPathExerciseId: string;
  exerciseId: string;
  orderIndex: number;
  status: string;
  exerciseTitle: string;
  exerciseDescription: string;
  progress: number;
  scoreAchieved: number;
  numberOfQuestion: number;
  questions: Question[];   
}

interface Chapter {
  learningPathChapterId: string;
  chapterId: string;
  orderIndex: number;
  status: string;
  progress: number;
  numberOfModule: number;
  chapterTitle: string;
  chapterDescription: string;
  exercises: Exercise[];
}

interface Course {
  courseId: string;
  title: string;
  description: string;
  level: string;
  price: number;
}

interface LearningPathCourseData {
  learningPathCourseId: string;
  learnerCourseId: string;
  courseId: string;
  status: string;
  progress: number;
  numberOfChapter: number;
  orderIndex: number;
  course: Course;
  chapters: Chapter[];
}

export interface LearningPathCourseFullRequest {
  learningPathCourseId: string;
  courseId: string;
}

export interface LearningPathCourseFullResponse {
  isSucess: boolean;
  data: LearningPathCourseData;
  businessCode: string;
  message: string;
}

// Get full learning path course details
export const getLearningPathCourseFullService = async (
  params: LearningPathCourseFullRequest
): Promise<LearningPathCourseFullResponse> => {
  try {
    console.log('📚 [LearningPath] Fetching full course:', params);
    
    // Build query params
    const queryParams = new URLSearchParams();
    if (params.learningPathCourseId) {
      queryParams.append('learningPathCourseId', params.learningPathCourseId);
    }
    if (params.courseId) {
      queryParams.append('courseId', params.courseId);
    }
    
    const response = await httpClient.get<LearningPathCourseFullResponse>(
      `LearningPathCourse/full?${queryParams.toString()}`
    );
    
    console.log('✅ [LearningPath] Course loaded:', {
      courseId: response.data.data?.courseId,
      chapters: response.data.data?.numberOfChapter,
      progress: response.data.data?.progress
    });
        
    return response.data;
  } catch (error: any) {
    console.error('❌ [LearningPath] Failed to load course:', error);
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể tải lộ trình học tập";
    throw new Error(message);
  }
};
