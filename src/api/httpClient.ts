import axios from "axios";
import { store } from "../store";

const httpClient = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default httpClient;
