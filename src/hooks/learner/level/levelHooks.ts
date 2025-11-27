import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { updateLevelForLearnerService } from "../../../api/level.service";

export interface UpLevelResponse {
    message: string;
}
export const upLevelForLearner = () => {
    const queryClient = useQueryClient();
    
    return useMutation<UpLevelResponse, Error, void>({
        mutationFn: updateLevelForLearnerService,
        onSuccess: (data) => {
            Alert.alert("Thành công", data.message || "Nâng cấp level thành công!");
            // Invalidate queries để refetch data mới
            queryClient.invalidateQueries({ queryKey: ["getMe"] }); // User profile
            queryClient.invalidateQueries({ queryKey: ["levelsAndlearnerCourseIds"] }); // Levels data
            queryClient.invalidateQueries({ queryKey: ["getCoursesBasedOnLevelLearner"] }); // Courses by level
        },
        onError: (error) => {
            Alert.alert("Lỗi", error.message || "Nâng cấp level thất bại");
        }
    });
};