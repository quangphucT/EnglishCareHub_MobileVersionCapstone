import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLearnerStore } from '../../store/learnerStore';
import { useGetMeQuery } from '../../hooks/useGetMe';

import { useStartExercise } from '../../hooks/learner/exercise/exerciseHooks';
import { useLearningPathCourseFull } from '../../hooks/learner/learningPath/learningPathHooks';

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

  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600";
      case "in_progress":
      case "inprogress":
        return "text-blue-600";
      case "locked":
        return "text-gray-400";
      default:
        return "text-gray-600";
    }
  };

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
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 px-4 pt-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Lộ trình học tập
          </Text>
          <View className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-300">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-orange-200 rounded-full items-center justify-center mb-3">
                <Ionicons name="lock-closed" size={32} color="#EA580C" />
              </View>
              <Text className="text-lg font-bold text-gray-900 text-center mb-2">
                Chưa tham gia khóa học
              </Text>
              <Text className="text-gray-700 text-center mb-4">
                Bạn hiện tại chưa tham gia khóa học nào của Level {userLevel}.
                Hãy qua tab <Text className="font-bold text-orange-600">Khóa học</Text> để tham gia khóa học đầu tiên (miễn phí).
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleNavigateToCourses}
              className="bg-orange-600 rounded-full py-3 items-center"
            >
              <View className="flex-row items-center">
                <Ionicons name="arrow-forward" size={16} color="white" />
                <Text className="text-white font-bold ml-2">Đi đến Khóa học</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="mt-4 text-gray-600">Đang tải lộ trình học tập...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const learningPathData = apiResponse?.data;

  if (!learningPathData) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 px-4 pt-6">
          <Text className="text-center text-gray-600">
            Không tìm thấy dữ liệu lộ trình học tập
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { course, chapters, progress, status, numberOfChapter } = learningPathData;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-6 pb-4">
        {/* Header với nút quay về */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">
            Lộ trình học tập
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Course Header */}
          <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border-2 border-blue-200">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="book" size={20} color="#2563EB" />
                  <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
                    {course.title}
                  </Text>
                </View>
                <Text className="text-gray-700 text-sm mb-3" numberOfLines={3}>
                  {course.description}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <View className="flex-row items-center bg-white rounded-full px-2 py-1">
                    <Ionicons name="flag" size={12} color="#2563EB" />
                    <Text className="text-xs font-medium ml-1">Level: {course.level}</Text>
                  </View>
                  <View className="flex-row items-center bg-white rounded-full px-2 py-1">
                    <Ionicons name="book-outline" size={12} color="#2563EB" />
                    <Text className="text-xs font-medium ml-1">{numberOfChapter} Chương</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                    <Text className={`text-xs font-medium ${getStatusTextColor(status)}`}>
                      {getStatusText(status)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="items-center">
                <Ionicons name="trophy" size={32} color="#EAB308" />
                <Text className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</Text>
                <Text className="text-xs text-gray-600">Tiến độ</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="bg-gray-200 h-3 rounded-full overflow-hidden">
              <View 
                className="bg-blue-600 h-full rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>

          {/* Chapters List */}
          <View className="mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="list" size={20} color="#2563EB" />
              <Text className="text-lg font-bold text-gray-900">Danh sách chương</Text>
            </View>

            {chapters && chapters.length > 0 ? (
              <View className="gap-3">
                {chapters.map((chapter) => (
                  <View
                    key={chapter.learningPathChapterId}
                    className={`bg-white rounded-2xl p-4 border-2 ${
                      chapter.status.toLowerCase() === "locked"
                        ? "opacity-60 border-gray-200"
                        : "border-gray-200"
                    }`}
                  >
                    <View className="flex-row gap-3">
                      {/* Chapter Number */}
                      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                        <Text className="text-lg font-bold text-blue-600">
                          {chapter.orderIndex}
                        </Text>
                      </View>

                      <View className="flex-1">
                        {/* Chapter Header */}
                        <TouchableOpacity
                          onPress={() => {
                            if (chapter.status.toLowerCase() !== "locked") {
                              setExpandedChapterId(
                                expandedChapterId === chapter.learningPathChapterId
                                  ? null
                                  : chapter.learningPathChapterId
                              );
                            }
                          }}
                          className="mb-3"
                        >
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 mr-2">
                              <Text className="text-xs text-gray-500 mb-1">
                                Chương {chapter.orderIndex}
                              </Text>
                              <Text className="text-base font-semibold text-blue-600 mb-1">
                                {chapter.chapterTitle}
                              </Text>
                              <Text className="text-sm text-gray-600" numberOfLines={2}>
                                {chapter.chapterDescription}
                              </Text>
                            </View>

                            <View className="items-end">
                              <Text className="text-sm font-medium text-gray-900">
                                {Math.round(chapter.progress)}%
                              </Text>
                              <Ionicons
                                name={expandedChapterId === chapter.learningPathChapterId ? "chevron-down" : "chevron-forward"}
                                size={20}
                                color="#9CA3AF"
                              />
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Progress Bar */}
                        <View className="bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
                          <View
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${chapter.progress}%` }}
                          />
                        </View>

                        <Text className="text-xs text-gray-600 mb-3">
                          {chapter.exercises?.length || 0} Bài tập
                        </Text>

                        {/* Exercises */}
                        {expandedChapterId === chapter.learningPathChapterId &&
                          chapter.exercises &&
                          chapter.exercises.length > 0 && (
                            <View className="gap-2 pl-2 border-l-2 border-gray-200">
                              {chapter.exercises.map((exercise) => (
                                <View
                                  key={exercise.learningPathExerciseId}
                                  className={`rounded-xl p-3 border ${
                                    exercise.status.toLowerCase() === "locked"
                                      ? "bg-gray-50 border-gray-200 opacity-60"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  <View className="flex-row items-center justify-between mb-1">
                                    <Text className="text-xs font-medium text-gray-500">
                                      Bài tập {exercise.orderIndex}
                                    </Text>
                                    {exercise.scoreAchieved > 0 && (
                                      <View className="bg-green-50 px-2 py-1 rounded">
                                        <Text className="text-green-600 font-semibold text-xs">
                                          Điểm: {exercise.scoreAchieved}
                                        </Text>
                                      </View>
                                    )}
                                  </View>

                                  <Text className="text-base font-semibold text-gray-900 mb-1">
                                    {exercise.exerciseTitle}
                                  </Text>

                                  <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                                    {exercise.exerciseDescription}
                                  </Text>

                                  <Text className="text-xs text-gray-500 mb-3">
                                    {exercise.numberOfQuestion} câu hỏi
                                  </Text>

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
                                    className={`rounded-lg py-2 items-center ${
                                      exercise.status === "NotStarted"
                                        ? "bg-blue-600"
                                        : exercise.status === "InProgress"
                                        ? "bg-yellow-500"
                                        : "bg-gray-700"
                                    }`}
                                  >
                                    {loadingExerciseId === exercise.learningPathExerciseId ? (
                                      <ActivityIndicator size="small" color="white" />
                                    ) : (
                                      <Text className="text-white font-medium text-sm">
                                        {exercise.status === "NotStarted"
                                          ? "Bắt đầu luyện tập"
                                          : exercise.status === "InProgress"
                                          ? "Tiếp tục học"
                                          : "Xem lại"}
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-white rounded-2xl p-6 border border-gray-200">
                <Text className="text-center text-gray-600">
                  Chưa có chương nào trong khóa học này
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );

};

export default LearningPathScreen;
