import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LearnerCourseData {
  learnerCourseId: string;
  courseId: string;
  learningPathCourseId: string;
  status: "InProgress" | "Completed" | "NotStarted";
}

interface LearnerState {
  // State
  currentCourse: LearnerCourseData | null;
  
  // Actions
  setAllLearnerData: (data: LearnerCourseData) => void;
  clearLearnerData: () => void;
  
  // Async actions
  saveLearnerDataToStorage: (data: LearnerCourseData) => Promise<void>;
  loadLearnerDataFromStorage: () => Promise<void>;
}

const LEARNER_COURSE_KEY = '@learner_course_data';

export const useLearnerStore = create<LearnerState>((set, get) => ({
  currentCourse: null,

  setAllLearnerData: (data: LearnerCourseData) => {
    console.log('📝 Setting learner data:', data);
    set({ currentCourse: data });
    // Tự động lưu vào AsyncStorage
    get().saveLearnerDataToStorage(data);
  },

  clearLearnerData: () => {
    console.log('🗑️ Clearing learner data');
    set({ currentCourse: null });
    AsyncStorage.removeItem(LEARNER_COURSE_KEY);
  },

  saveLearnerDataToStorage: async (data: LearnerCourseData) => {
    try {
      await AsyncStorage.setItem(LEARNER_COURSE_KEY, JSON.stringify(data));
      console.log('✅ Learner data saved to storage');
    } catch (error) {
      console.error('❌ Failed to save learner data:', error);
    }
  },

  loadLearnerDataFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(LEARNER_COURSE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({ currentCourse: parsed });
        console.log('✅ Learner data loaded from storage:', parsed);
      }
    } catch (error) {
      console.error('❌ Failed to load learner data:', error);
    }
  },
}));
