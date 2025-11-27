import httpClient from "./httpClient";
import { UpLevelResponse } from "../hooks/learner/level/levelHooks";

// Update level for learner (upgrade to next level)
export const updateLevelForLearnerService = async (): Promise<UpLevelResponse> => {
  try {
    
    const response = await httpClient.post<UpLevelResponse>(
      "LearnerAnswer/upgrade-level"
    );
        
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Nâng cấp level thất bại";
    throw new Error(message);
  }
};
