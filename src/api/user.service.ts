
import { UserResponse } from '../hooks/useGetMe';
import httpClient from "./httpClient";
export const getMeService = async (): Promise<UserResponse> => {
  const response = await httpClient.get<UserResponse>('Auth/me');
  return response.data;
};
