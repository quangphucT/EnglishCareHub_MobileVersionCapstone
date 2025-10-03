import axios from "axios";

const httpClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  // Add token from storage if available
  // const token = store.getState().auth.token;
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

export default httpClient;
