import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLearnerStore } from '../../store/learnerStore';
import { useGetMeQuery } from '../../hooks/useGetMe';

import { useStartExercise } from '../../hooks/learner/exercise/exerciseHooks';
import { useLearningPathCourseFull } from '../../hooks/learner/learningPath/learningPathHooks';

const { width } = Dimensions.get('window');

const LearningPathScreen = () => {
  const navigation = useNavigation();

  const getAllLearnerData = useLearnerStore((state) => state.currentCourse);
  const learnerData = getAllLearnerData;

  const { data: userData } = useGetMeQuery();
  const userLevel = userData?.learnerProfile?.level || "A1";

  const { data: apiResponse, isLoading, refetch } = useLearningPathCourseFull(
    {
      learningPathCourseId: learnerData?.learningPathCourseId || "",
      courseId: learnerData?.courseId || ""
    },
    Boolean(learnerData)
  );

  // Refetch khi màn hình được focus (bao gồm cả khi back về)
  useFocusEffect(
    useCallback(() => {
      if (learnerData) {
        refetch();
      }
    }, [learnerData])
  );

  const { mutate: startExercise } = useStartExercise();
  const [loadingExerciseId, setLoadingExerciseId] = useState<string | null>(null);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 border-green-200";
      case "in_progress":
      case "inprogress":
        return "bg-blue-100 border-blue-200";
      case "locked":
        return "bg-gray-100 border-gray-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  // const getStatusTextColor = (status: string) => {
  //   switch (status.toLowerCase()) {
  //     case "completed":
  //       return "text-green-600";
  //     case "in_progress":
  //     case "inprogress":
  //       return "text-blue-600";
  //     case "locked":
  //       return "text-gray-400";
  //     default:
  //       return "text-gray-600";
  //   }
  // };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Hoàn thành";
      case "in_progress":
      case "inprogress":
        return "Đang học";
      case "locked":
        return "Đã khóa";
      default:
        return status;
    }
  };

  const handleNavigateToCourses = () => {
    // Navigate to Courses tab
    navigation.navigate('Courses' as never);
  };

  const handleButtonClick = (
    exerciseStatus: string,
    learningPathExerciseId: string,
    exerciseId: string,
    chapterId: string
  ) => {
    if (exerciseStatus === "NotStarted") {
      setLoadingExerciseId(learningPathExerciseId);

      startExercise(
        { learningPathExerciseId, status: "InProgress" },
        {
          onSuccess: () => {
            setLoadingExerciseId(null);
            (navigation as any).navigate('Exercise', { exerciseId, chapterId, refetchLearningPath: refetch });
          },
          onError: (error: any) => {
            setLoadingExerciseId(null);
            Alert.alert("Lỗi", error?.message || "Có lỗi xảy ra khi bắt đầu bài tập.");
          }
        }
      );
    } else {
      (navigation as any).navigate('Exercise', { exerciseId, chapterId, refetchLearningPath: refetch });
    }
  };

  if (!learnerData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
        >
          <Text className="text-white text-2xl font-bold">Lộ trình học tập</Text>
        </LinearGradient>
        
        <View className="flex-1 px-4 -mt-4">
          <View className="bg-white rounded-3xl p-6 shadow-lg">
            <View className="items-center mb-4">
              <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="book-outline" size={40} color="#7C3AED" />
              </View>
              <Text className="text-xl font-bold text-gray-900 text-center mb-2">
                Chưa tham gia khóa học
              </Text>
              <Text className="text-gray-500 text-center leading-6">
                Bạn hiện tại chưa tham gia khóa học nào của Level {userLevel}.
                Hãy qua tab <Text className="font-bold text-purple-600">Khóa học</Text> để bắt đầu!
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleNavigateToCourses}
              style={{
                backgroundColor: '#7C3AED',
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white font-bold text-base">Khám phá khóa học</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text className="mt-4 text-gray-600 font-medium">Đang tải lộ trình...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const learningPathData = apiResponse?.data;

  if (!learningPathData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 px-4 pt-6 items-center justify-center">
          <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
            <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
            <Text className="text-center text-gray-500 mt-4">
              Không tìm thấy dữ liệu lộ trình học tập
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { course, chapters, progress, status, numberOfChapter } = learningPathData;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Header với Gradient */}
      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white/80 text-sm">Khóa học</Text>
            <Text className="text-white text-lg font-bold" numberOfLines={1}>{course.title}</Text>
          </View>
          {/* <View className="bg-white/20 px-3 py-1.5 rounded-full">
            <Text className="text-white font-semibold text-sm">{course.level}</Text>
          </View> */}
        </View>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 -mt-16"
      >
        {/* Progress Card */}
        <View className="mx-4 mb-4">
          <View className="bg-white rounded-3xl p-5 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-purple-100 rounded-2xl items-center justify-center">
                  <Ionicons name="trophy" size={28} color="#7C3AED" />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-500 text-sm">Tiến độ hoàn thành</Text>
                  <Text className="text-3xl font-bold text-gray-900">{Math.round(progress)}%</Text>
                </View>
              </View>
              <View 
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: status.toLowerCase() === 'completed' ? '#DCFCE7' 
                    : status.toLowerCase() === 'inprogress' || status.toLowerCase() === 'in_progress' ? '#DBEAFE' 
                    : '#F3F4F6',
                }}
              >
                <Text 
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: status.toLowerCase() === 'completed' ? '#16A34A' 
                      : status.toLowerCase() === 'inprogress' || status.toLowerCase() === 'in_progress' ? '#2563EB' 
                      : '#6B7280',
                  }}
                >
                  {getStatusText(status)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="bg-gray-100 h-3 rounded-full overflow-hidden">
              <LinearGradient
                colors={['#A855F7', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ 
                  height: '100%', 
                  width: `${progress}%`,
                  borderRadius: 999,
                }}
              />
            </View>

            {/* Stats Row */}
            <View className="flex-row mt-4 pt-4 border-t border-gray-100">
              <View className="flex-1 items-center">
                <View className="flex-row items-center">
                  <Ionicons name="book-outline" size={16} color="#7C3AED" />
                  <Text className="text-gray-900 font-bold ml-1">{numberOfChapter}</Text>
                </View>
                <Text className="text-gray-500 text-xs mt-1">Chương</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center">
                <View className="flex-row items-center">
                  <Ionicons name="document-text-outline" size={16} color="#7C3AED" />
                  <Text className="text-gray-900 font-bold ml-1">
                    {chapters?.reduce((sum, ch) => sum + (ch.exercises?.length || 0), 0) || 0}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs mt-1">Bài tập</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center">
                <View className="flex-row items-center">
                  <Ionicons name="flag-outline" size={16} color="#7C3AED" />
                  <Text className="text-gray-900 font-bold ml-1">{course.level}</Text>
                </View>
                <Text className="text-gray-500 text-xs mt-1">Cấp độ</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View className="mx-4 mb-3 flex-row items-center">
          <View className="w-1 h-5 bg-purple-500 rounded-full mr-2" />
          <Text className="text-lg font-bold text-gray-900">Danh sách chương</Text>
        </View>

        {/* Chapters List */}
        <View className="px-4">
          {chapters && chapters.length > 0 ? (
            <View>
              {chapters.map((chapter, chapterIndex) => {
                const isLocked = chapter.status.toLowerCase() === "locked";
                const isChapterCompleted = chapter.status.toLowerCase() === "completed";
                const isExpanded = expandedChapterId === chapter.learningPathChapterId;

                return (
                  <View
                    key={chapter.learningPathChapterId}
                    className="mb-3"
                  >
                    {/* Chapter Card */}
                    <TouchableOpacity
                      onPress={() => {
                        if (!isLocked) {
                          setExpandedChapterId(isExpanded ? null : chapter.learningPathChapterId);
                        }
                      }}
                      activeOpacity={isLocked ? 1 : 0.7}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 20,
                        padding: 16,
                        opacity: isLocked ? 0.6 : 1,
                        borderLeftWidth: 4,
                        borderLeftColor: isChapterCompleted ? '#10B981' 
                          : chapter.status.toLowerCase() === 'inprogress' ? '#7C3AED' 
                          : '#E5E7EB',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      <View className="flex-row items-start">
                        {/* Chapter Number Circle */}
                        <View 
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isChapterCompleted ? '#DCFCE7' 
                              : chapter.status.toLowerCase() === 'inprogress' ? '#EDE9FE' 
                              : '#F3F4F6',
                          }}
                        >
                          {isLocked ? (
                            <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                          ) : isChapterCompleted ? (
                            <Ionicons name="checkmark" size={24} color="#10B981" />
                          ) : (
                            <Text 
                              style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: chapter.status.toLowerCase() === 'inprogress' ? '#7C3AED' : '#6B7280',
                              }}
                            >
                              {chapter.orderIndex}
                            </Text>
                          )}
                        </View>

                        {/* Chapter Info */}
                        <View className="flex-1 ml-3">
                          <Text className="text-purple-600 text-xs font-medium mb-1">
                            Chương {chapter.orderIndex}
                          </Text>
                          <Text className="text-gray-900 text-base font-semibold mb-1" numberOfLines={2}>
                            {chapter.chapterTitle}
                          </Text>
                          <Text className="text-gray-500 text-sm" numberOfLines={1}>
                            {chapter.exercises?.length || 0} bài tập
                          </Text>
                        </View>

                        {/* Progress & Arrow */}
                        <View className="items-end">
                          <Text className="text-purple-600 font-bold text-base">
                            {Math.round(chapter.progress)}%
                          </Text>
                          {!isLocked && (
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={20}
                              color="#9CA3AF"
                              style={{ marginTop: 4 }}
                            />
                          )}
                        </View>
                      </View>

                      {/* Chapter Progress Bar */}
                      <View className="mt-3 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <View
                          style={{
                            height: '100%',
                            width: `${chapter.progress}%`,
                            backgroundColor: isChapterCompleted ? '#10B981' : '#7C3AED',
                            borderRadius: 999,
                          }}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Exercises List (Expanded) */}
                    {isExpanded && chapter.exercises && chapter.exercises.length > 0 && (
                      <View className="mt-2 ml-6 pl-4 border-l-2 border-purple-200">
                        {chapter.exercises.map((exercise, exerciseIndex) => {
                          const isExerciseLocked = exercise.status.toLowerCase() === "locked";
                          const isExerciseCompleted = exercise.status.toLowerCase() === "completed";

                          return (
                            <View
                              key={exercise.learningPathExerciseId}
                              style={{
                                backgroundColor: isExerciseLocked ? '#F9FAFB' : '#FFFFFF',
                                borderRadius: 16,
                                padding: 14,
                                marginBottom: 10,
                                opacity: isExerciseLocked ? 0.6 : 1,
                                borderWidth: 1,
                                borderColor: isExerciseCompleted ? '#BBF7D0' : '#E5E7EB',
                              }}
                            >
                              <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-row items-center flex-1">
                                  <View 
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: 14,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: isExerciseCompleted ? '#DCFCE7' 
                                        : exercise.status.toLowerCase() === 'inprogress' ? '#FEF3C7' 
                                        : '#F3F4F6',
                                    }}
                                  >
                                    {isExerciseLocked ? (
                                      <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                                    ) : isExerciseCompleted ? (
                                      <Ionicons name="checkmark" size={14} color="#10B981" />
                                    ) : (
                                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                                        {exercise.orderIndex}
                                      </Text>
                                    )}
                                  </View>
                                  <View className="flex-1 ml-2">
                                    <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
                                      {exercise.exerciseTitle}
                                    </Text>
                                    <Text className="text-gray-500 text-xs">
                                      {exercise.numberOfQuestion} câu hỏi
                                    </Text>
                                  </View>
                                </View>

                                {exercise.scoreAchieved > 0 && (
                                  <View className="bg-green-100 px-2 py-1 rounded-lg">
                                    <Text className="text-green-600 font-bold text-xs">
                                      {exercise.scoreAchieved} điểm
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {!isExerciseLocked && (
                                <TouchableOpacity
                                  onPress={() =>
                                    handleButtonClick(
                                      exercise.status,
                                      exercise.learningPathExerciseId,
                                      exercise.exerciseId,
                                      chapter.learningPathChapterId
                                    )
                                  }
                                  disabled={loadingExerciseId === exercise.learningPathExerciseId}
                                  style={{
                                    backgroundColor: exercise.status === "NotStarted" ? '#7C3AED'
                                      : exercise.status === "InProgress" ? '#F59E0B'
                                      : '#10B981',
                                    borderRadius: 12,
                                    paddingVertical: 10,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {loadingExerciseId === exercise.learningPathExerciseId ? (
                                    <ActivityIndicator size="small" color="white" />
                                  ) : (
                                    <>
                                      <Ionicons
                                        name={exercise.status === "NotStarted" ? "play" 
                                          : exercise.status === "InProgress" ? "play-forward" 
                                          : "eye"}
                                        size={16}
                                        color="white"
                                      />
                                      <Text className="text-white font-semibold text-sm ml-2">
                                        {exercise.status === "NotStarted" ? "Bắt đầu"
                                          : exercise.status === "InProgress" ? "Tiếp tục"
                                          : "Xem lại"}
                                      </Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
              <Text className="text-center text-gray-500 mt-4">
                Chưa có chương nào trong khóa học này
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

};

export default LearningPathScreen;
