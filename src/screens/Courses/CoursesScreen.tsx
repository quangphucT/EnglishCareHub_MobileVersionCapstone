import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGetMeQuery } from '../../hooks/useGetMe';
import { 
  useEnrollCourseNotFree, 
  useEnrollFirstCourse, 
  useGetCoursesBasedOnLevelLearner, 
  useGetLevelAndLearnerCourseIdAfterEnrolling 
} from '../../hooks/learner/course/courseHooks';
import { upLevelForLearner } from '../../hooks/learner/level/levelHooks';
import { useLearnerStore } from '../../store/learnerStore';

const CoursesScreen = () => {
  const navigation = useNavigation();
  
  // Get user data
  const { data: userData } = useGetMeQuery();
  console.log("userData:", userData)
  const userLevel = userData?.learnerProfile?.level || "A1";
   console.log("User Level:", userLevel)
  // State for viewing level
  const [viewingLevel, setViewingLevel] = useState<string>(userLevel);
  
  // State for tracking which course is being enrolled
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  
  // Hooks
  const { data: coursesBasedOnLevel, isLoading } = useGetCoursesBasedOnLevelLearner(viewingLevel);
  const { data: levelAndLearnerCourseIdData } = useGetLevelAndLearnerCourseIdAfterEnrolling();
  const { mutate: enrollFirstCourse, isPending: isEnrollingFirst } = useEnrollFirstCourse();
  const { mutate: upLevel, isPending: isUpLevelLoading } = upLevelForLearner();
  const { mutate: enrollingPaidCourse, isPending: isEnrollingPaid } = useEnrollCourseNotFree();
  
  const setAllLearnerData = useLearnerStore((state) => state.setAllLearnerData);
  const learnerCourseIdOnZustand = useLearnerStore((state) => state.currentCourse?.learnerCourseId);

  // Update viewing level when user level changes
  useEffect(() => {
    setViewingLevel(userLevel);
  }, [userLevel]);

  const courses = coursesBasedOnLevel?.data || [];
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const levelsData = levelAndLearnerCourseIdData?.data?.levels || [];
  const currentViewingLevelData = levelsData.find((item) => item.Level === viewingLevel);
  const enrolledCoursesInLevel = currentViewingLevelData?.Courses || [];

  // Check if user can access a level
  const canAccessLevel = (targetLevel: string): boolean => {
    const targetIndex = levels.indexOf(targetLevel);
    if (targetIndex === 0) return true;
    
    for (let i = 0; i < targetIndex; i++) {
      const levelData = levelsData.find((l) => l.Level === levels[i]);
      if (!levelData || levelData.TotalCourses !== levelData.CompletedCourses || levelData.TotalCourses === 0) {
        return false;
      }
    }
    return true;
  };

  // Check if current user level is completed
  const isCurrentLevelCompleted = (): boolean => {
    const currentLevelData = levelsData.find((l) => l.Level === userLevel);
    if (!currentLevelData) return false;
    return currentLevelData.TotalCourses > 0 && 
           currentLevelData.TotalCourses === currentLevelData.CompletedCourses;
  };

  // Handle level click
  const handleLevelClick = (level: string) => {
    const levelIndex = levels.indexOf(level);
    const userLevelIndex = levels.indexOf(userLevel);
    
    if (levelIndex <= userLevelIndex) {
      setViewingLevel(level);
      return;
    }
    
    if (levelIndex === userLevelIndex + 1 && isCurrentLevelCompleted()) {
      upLevel(undefined, {
        onSuccess: () => {
          setViewingLevel(level);
        }
      });
      return;
    }
    if (!canAccessLevel(level)) {
      Alert.alert(
        "Level bị khóa",
        `Hoàn thành tất cả khóa học ở Level ${userLevel} để mở khóa Level ${level}`
      );
    }
  };

  // Handle select course (already enrolled)
  const handleSelectCourse = (
    courseId: string,
    learningPathCourseId: string,
    learnerCourseId: string,
    status: string
  ) => {
    setAllLearnerData({
      learnerCourseId,
      learningPathCourseId,
      courseId,
      status: status as "InProgress" | "Completed",
    });
    // Navigate to LearningPath screen
    navigation.navigate('LearningPath' as never);
  };

  // Handle enroll free course
  const handleEnrollCourseFree = (courseId: string) => {
    setEnrollingCourseId(courseId);
    enrollFirstCourse(courseId, {
      onSuccess: () => {
        setEnrollingCourseId(null);
        // Navigate to LearningPath screen
        navigation.navigate('LearningPath' as never);
      },
      onError: () => {
        setEnrollingCourseId(null);
      }
    });
  };

  // Handle enroll paid course
  const handleEnrollCourseNotFree = (courseId: string) => {
    if (!learnerCourseIdOnZustand) {
      Alert.alert("Lỗi", "Vui lòng tham gia khóa học đầu tiên trước");
      return;
    }

    setEnrollingCourseId(courseId);
    enrollingPaidCourse(
      {
        learnerCourseId: learnerCourseIdOnZustand,
        courseId: courseId,
      },
      {
        onSuccess: (data) => {
          setEnrollingCourseId(null);
          setAllLearnerData({
            learnerCourseId: data.data.learningPathCourseId,
            courseId: data.data.courseId,
            learningPathCourseId: data.data.learningPathCourseId,
            status: data.data.status,
          });
          // Navigate to LearningPath screen
          navigation.navigate('LearningPath' as never);
        },
        onError: () => {
          setEnrollingCourseId(null);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="mt-4 text-gray-600">Đang tải khóa học...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Khóa học
        </Text>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Level Progress Map */}
          <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border-2 border-blue-200">
            <View className="flex-row items-center justify-center mb-3">
              <Ionicons name="trending-up" size={20} color="#2563EB" />
              <Text className="text-base font-bold text-gray-900 ml-2">
                Cấp độ hiện tại
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center gap-2">
                {levels.map((level, index) => {
                  const levelData = levelsData.find((l) => l.Level === level);
                  const isViewingLevel = level === viewingLevel;
                  const isUserCurrentLevel = level === userLevel;
                  const hasCoursesInLevel = levelData && levelData.Courses && levelData.Courses.length > 0;
                  const isUnlocked = canAccessLevel(level);
                  const isLocked = !isUnlocked;

                  return (
                    <View key={level} className="flex-row items-center p-2">
                      <TouchableOpacity
                        onPress={() => handleLevelClick(level)}
                        disabled={isLocked}
                        className="items-center"
                      >
                        <View
                          className={`w-16 h-16 rounded-full items-center justify-center ${
                            isLocked
                              ? "bg-gray-300"
                              : isViewingLevel
                              ? "bg-blue-600"
                              : isUserCurrentLevel
                              ? "bg-green-600"
                              : hasCoursesInLevel
                              ? "bg-blue-500"
                              : "bg-white border-2 border-gray-300"
                          }`}
                        >
                          <Text
                            className={`text-lg font-bold ${
                              isLocked || (!isViewingLevel && !isUserCurrentLevel && !hasCoursesInLevel)
                                ? "text-gray-500"
                                : "text-white"
                            }`}
                          >
                            {level}
                          </Text>
                          {isUserCurrentLevel && !isLocked && (
                            <View className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full items-center justify-center">
                              <Ionicons name="checkmark" size={12} color="white" />
                            </View>
                          )}
                          {isLocked && (
                            <View className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full items-center justify-center">
                              <Ionicons name="lock-closed" size={10} color="white" />
                            </View>
                          )}
                        </View>
                        <Text
                          className={`text-xs font-semibold mt-1 ${
                            isLocked
                              ? "text-gray-400"
                              : isViewingLevel
                              ? "text-blue-600"
                              : isUserCurrentLevel
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          {isUserCurrentLevel ? "Hiện tại" : level}
                        </Text>
                      </TouchableOpacity>

                      {index < levels.length - 1 && (
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color={isUnlocked ? "#60A5FA" : "#D1D5DB"}
                          style={{ marginHorizontal: 8 }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Header */}
          <View className="mb-4">
            <Text className="text-xl font-bold text-gray-900 text-center">
              Khám phá khóa học Level {viewingLevel}
            </Text>
            <Text className="text-gray-500 text-center mt-1">
              {courses.length} khóa học chuyên sâu - Khóa đầu miễn phí
            </Text>
          </View>

          {/* Courses List */}
          <View className="gap-4">
            {courses.map((course, index) => {
              const isFirstCourse = index === 0;
              const totalExercises = course.chapters?.reduce((sum, ch) => sum + ch.numberOfExercise, 0) || 0;
              
              const enrolledCourse = enrolledCoursesInLevel.find((item) => item.courseId === course.courseId);
              const isEnrolled = !!enrolledCourse;
              const status = enrolledCourse?.status || "";
              const isCompleted = status === "Completed";
              const isInProgress = status === "InProgress";

              return (
                <View
                  key={course.courseId}
                  className="bg-white rounded-2xl p-4 border-2 border-gray-200"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Text className="text-base font-bold text-gray-900 flex-1">
                          {course.title}
                        </Text>
                        {isEnrolled && (
                          <View
                            className={`px-2 py-1 rounded-full ${
                              isCompleted
                                ? "bg-green-100"
                                : isInProgress
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                isCompleted
                                  ? "text-green-700"
                                  : isInProgress
                                  ? "text-blue-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {isCompleted ? "✓ Hoàn thành" : isInProgress ? "Đang học" : "Chưa bắt đầu"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {course.isFree || isFirstCourse ? (
                      <View className="bg-blue-500 rounded-full px-3 py-1">
                        <Text className="text-white text-xs font-bold " numberOfLines={1}>Miễn phí</Text>
                      </View>
                    ) : (
                      <View className="bg-orange-500 rounded-full px-3 py-1 flex-row items-center">
                        <Ionicons name="wallet" size={12} color="white" />
                        <Text className="text-white text-xs font-bold ml-1">{course.price}</Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
                    {course.description}
                  </Text>

                  <View className="flex-row items-center gap-4 mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="book-outline" size={16} color="#6B7280" />
                      <Text className="text-xs text-gray-500 ml-1">
                        {course.numberOfChapter} Chương
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                      <Text className="text-xs text-gray-500 ml-1">
                        {totalExercises} Bài tập
                      </Text>
                    </View>
                  </View>

                  {isEnrolled ? (
                    <TouchableOpacity
                      onPress={() =>
                        handleSelectCourse(
                          course.courseId,
                          enrolledCourse.learningPathCourseId,
                          enrolledCourse.learnerCourseId,
                          enrolledCourse.status
                        )
                      }
                      className={`rounded-full py-3 items-center ${
                        isCompleted ? "bg-green-600" : "bg-blue-600"
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="book-outline" size={16} color="white" />
                        <Text className="text-white font-bold ml-2">
                          {isCompleted ? "Xem lại khóa học" : "Tiếp tục học"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        if (isFirstCourse) {
                          handleEnrollCourseFree(course.courseId);
                        } else {
                          handleEnrollCourseNotFree(course.courseId);
                        }
                      }}
                      disabled={enrollingCourseId === course.courseId}
                      className={`rounded-full py-3 items-center ${
                        isFirstCourse ? "bg-green-600" : "bg-orange-600"
                      }`}
                    >
                      {enrollingCourseId === course.courseId ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <View className="flex-row items-center">
                          <Ionicons
                            name={isFirstCourse ? "book-outline" : "wallet"}
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-bold ml-2">
                            {isFirstCourse
                              ? "Tham gia miễn phí"
                              : `Mở khóa - ${course.price} Coin`}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CoursesScreen;
