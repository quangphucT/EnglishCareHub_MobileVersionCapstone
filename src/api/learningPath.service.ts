import httpClient from "./httpClient";
// import { 
//   LearningPathCourseFullRequest,
//   LearningPathCourseFullResponse 
// } from "../hooks/learner/learningPath/learningPathHooks";

// Get full learning path course details
// export const getLearningPathCourseFullService = async (
//   params: LearningPathCourseFullRequest
// ): Promise<LearningPathCourseFullResponse> => {
//   try {
//     console.log("🚀 [API] Calling GET /LearningPathCourse/full");
//     console.log("📦 [API] Params:", params);
    
//     const response = await httpClient.get<LearningPathCourseFullResponse>(
//       `LearningPathCourse/${params.learningPathCourseId}/${params.courseId}/full`
//     );
    
//     console.log("✅ [API] Learning path data:", JSON.stringify(response.data, null, 2));
    
//     return response.data;
//   } catch (error: any) {
//     console.error("❌ [API] Error:", error?.response?.data);
//     const message =
//       error?.response?.data?.message ||
//       error.message ||
//       "Không thể tải lộ trình học tập";
//     throw new Error(message);
//   }
// };
