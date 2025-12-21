import { useMutation, useQuery } from "@tanstack/react-query";
import { UploadAvatarResponse, uploadAvatarService } from "../../../api/avatar.service";
import { EditLearnerProfileResponse, editLearnerProfileService, getMyProgressAnalyticsService, ProgressAnalyticsResponse } from "../../../api/profile.service";
import { EditLearnerProfileRequest } from "../../../api/profile.service";

export const useUploadAvatar = () => {
  return useMutation<UploadAvatarResponse, Error, File>({
    mutationFn: (file) => uploadAvatarService(file),
  });
};

export const useEditLearnerProfile = () => {
  return useMutation<EditLearnerProfileResponse, Error, EditLearnerProfileRequest>(
    {
      mutationFn: (payload) => editLearnerProfileService(payload),
    }
  );
};

export const useGetMyProgressAnalytics = () => {
  return useQuery<ProgressAnalyticsResponse, Error>({
    queryKey: ["myProgressAnalytics"],
    queryFn: () => getMyProgressAnalyticsService(),
  });
};
