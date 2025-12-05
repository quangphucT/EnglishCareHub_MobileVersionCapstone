import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetMeQuery } from '../../hooks/useGetMe';
import { 
  useEnrollCourseNotFree, 
  useEnrollFirstCourse, 
  useGetCoursesBasedOnLevelLearner, 
  useGetLevelAndLearnerCourseIdAfterEnrolling 
} from '../../hooks/learner/course/courseHooks';
import { upLevelForLearner } from '../../hooks/learner/level/levelHooks';
import { useLearnerStore } from '../../store/learnerStore';

const { width } = Dimensions.get('window');

const CoursesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
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
  const { data: coursesBasedOnLevel, isLoading, refetch: refetchCourses } = useGetCoursesBasedOnLevelLearner(viewingLevel);
  const { data: levelAndLearnerCourseIdData, refetch: refetchLevelData } = useGetLevelAndLearnerCourseIdAfterEnrolling();
  const { mutate: enrollFirstCourse, isPending: isEnrollingFirst } = useEnrollFirstCourse();
  const { mutate: upLevel, isPending: isUpLevelLoading } = upLevelForLearner();
  const { mutate: enrollingPaidCourse, isPending: isEnrollingPaid } = useEnrollCourseNotFree();
  
  const setAllLearnerData = useLearnerStore((state) => state.setAllLearnerData);
  const learnerCourseIdOnZustand = useLearnerStore((state) => state.currentCourse?.learnerCourseId);

  // Update viewing level when user level changes
  useEffect(() => {
    setViewingLevel(userLevel);
  }, [userLevel]);

  // Refetch data khi màn hình được focus (khi quay lại từ LearningPath)
  useFocusEffect(
    useCallback(() => {
      refetchCourses();
      refetchLevelData();
    }, [viewingLevel])
  );

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
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text className="mt-4 text-gray-600 font-medium">Đang tải khóa học...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#EEF2FF', '#E0E7FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
             
              <Text className="text-gray-800 text-xl font-bold">{userData?.fullName || 'Học viên'}</Text>
            </View>
            <View className="bg-blue-500 px-4 py-2 rounded-full flex-row items-center">
              <Ionicons name="star" size={16} color="#FFFFFF" />
              <Text className="text-white font-bold ml-1">Level {userLevel}</Text>
            </View>
          </View>

          {/* Level Progress Card - New Design */}
          <View className="bg-white rounded-2xl p-4 mt-2" style={{ marginHorizontal: -4 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center py-2">
                {levels.map((level, index) => {
                  const levelData = levelsData.find((l) => l.Level === level);
                  const isViewingLevel = level === viewingLevel;
                  const isUserCurrentLevel = level === userLevel;
                  const isUnlocked = canAccessLevel(level);
                  const isLocked = !isUnlocked;
                  const isCompleted = levelData && levelData.TotalCourses > 0 && 
                                     levelData.TotalCourses === levelData.CompletedCourses;

                  return (
                    <View key={level} className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => handleLevelClick(level)}
                        disabled={isLocked}
                        className="items-center"
                        style={{ marginHorizontal: 6 }}
                      >
                        {/* Outer circle with gradient border effect */}
                        <View
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 36,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isLocked ? '#F3F4F6' : '#FFFFFF',
                            borderWidth: 4,
                            borderColor: isLocked ? '#E5E7EB' 
                              : isUserCurrentLevel ? '#3B82F6'
                              : isCompleted ? '#3B82F6'
                              : '#E5E7EB',
                            shadowColor: isUserCurrentLevel ? '#3B82F6' : '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isUserCurrentLevel ? 0.3 : 0.1,
                            shadowRadius: 4,
                            elevation: isUserCurrentLevel ? 6 : 2,
                          }}
                        >
                          {/* Inner gradient circle for current/active levels */}
                          {(isUserCurrentLevel || isCompleted) && !isLocked ? (
                            <LinearGradient
                              colors={['#60A5FA', '#3B82F6']}
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 20,
                                  fontWeight: 'bold',
                                  color: '#FFFFFF',
                                }}
                              >
                                {level}
                              </Text>
                            </LinearGradient>
                          ) : (
                            <Text
                              style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: isLocked ? '#9CA3AF' : '#6B7280',
                              }}
                            >
                              {level}
                            </Text>
                          )}

                          {/* Checkmark badge for completed levels */}
                          {isCompleted && (
                            <View
                              style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: '#10B981',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: '#FFFFFF',
                              }}
                            >
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            </View>
                          )}
                        </View>

                        {/* Level label */}
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            marginTop: 8,
                            color: isUserCurrentLevel ? '#3B82F6' : '#6B7280',
                          }}
                        >
                          {isUserCurrentLevel ? 'Level của bạn' : `Level ${level}`}
                        </Text>
                      </TouchableOpacity>

                      {/* Arrow connector */}
                      {index < levels.length - 1 && (
                        <Text
                          style={{
                            fontSize: 24,
                            color: isUnlocked && canAccessLevel(levels[index + 1]) 
                              ? '#3B82F6' 
                              : '#D1D5DB',
                            marginHorizontal: 4,
                          }}
                        >
                          →
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </LinearGradient>

        {/* Content Section */}
        <View className="px-4 -mt-4">
          {/* Section Header */}
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                  <Ionicons name="school" size={20} color="#7C3AED" />
                </View>
                <View className="ml-3">
                  <Text className="text-lg font-bold text-gray-900">Level {viewingLevel}</Text>
                  <Text className="text-gray-500 text-sm">{courses.length} khóa học</Text>
                </View>
              </View>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-700 text-xs font-semibold">Khóa đầu miễn phí</Text>
              </View>
            </View>
          </View>

          {/* Courses List */}
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
                className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: isCompleted ? '#10B981' : isInProgress ? '#3B82F6' : isFirstCourse ? '#10B981' : '#F59E0B',
                }}
              >
                {/* Course Header */}
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center mb-1">
                        {isEnrolled && (
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: isCompleted ? '#10B981' : '#3B82F6',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 8,
                            }}
                          >
                            <Ionicons 
                              name={isCompleted ? "checkmark" : "play"} 
                              size={12} 
                              color="#FFFFFF" 
                            />
                          </View>
                        )}
                        <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={2}>
                          {course.title}
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-sm" numberOfLines={2}>
                        {course.description}
                      </Text>
                    </View>

                    {/* Price Badge */}
                    {course.isFree || isFirstCourse ? (
                      <View className="bg-green-500 rounded-xl px-3 py-1.5">
                        <Text className="text-white text-xs font-bold">FREE</Text>
                      </View>
                    ) : (
                      <View className="bg-amber-500 rounded-xl px-3 py-1.5 flex-row items-center">
                        <Ionicons name="logo-bitcoin" size={14} color="white" />
                        <Text className="text-white text-xs font-bold ml-1">{course.price}</Text>
                      </View>
                    )}
                  </View>

                  {/* Course Stats */}
                  <View className="flex-row items-center mt-3 mb-4">
                    <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5 mr-2">
                      <Ionicons name="layers-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-600 ml-1 font-medium">
                        {course.numberOfChapter} Chương
                      </Text>
                    </View>
                    <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5 mr-2">
                      <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-600 ml-1 font-medium">
                        {totalExercises} Bài tập
                      </Text>
                    </View>
                    {isEnrolled && (
                      <View 
                        className={`rounded-full px-3 py-1.5 ${
                          isCompleted ? 'bg-green-100' : 'bg-blue-100'
                        }`}
                      >
                        <Text 
                          className={`text-xs font-semibold ${
                            isCompleted ? 'text-green-700' : 'text-blue-700'
                          }`}
                        >
                          {isCompleted ? '✓ Hoàn thành' : '● Đang học'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Button */}
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
                      style={{
                        backgroundColor: isCompleted ? '#10B981' : '#3B82F6',
                        borderRadius: 12,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={isCompleted ? "refresh" : "play-circle"} size={20} color="white" />
                      <Text className="text-white font-bold ml-2">
                        {isCompleted ? "Ôn tập lại" : "Tiếp tục học"}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
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
                      style={{
                        backgroundColor: isFirstCourse ? '#10B981' : '#F59E0B',
                        borderRadius: 12,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {enrollingCourseId === course.courseId ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons
                            name={isFirstCourse ? "rocket" : "lock-open"}
                            size={18}
                            color="white"
                          />
                          <Text className="text-white font-bold ml-2">
                            {isFirstCourse
                              ? "Bắt đầu học miễn phí"
                              : `Mở khóa • ${course.price} Coin`}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Empty State */}
          {courses.length === 0 && (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Ionicons name="school-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 text-center mt-4">
                Chưa có khóa học nào ở level này
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CoursesScreen;
