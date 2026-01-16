import axios from "axios";
import { useAuthStore } from "../components/hooks/useAuthStore";

export const axiosInstance = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api",
  baseURL: "/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 403 || err?.response?.status === 401) {
      // 토큰 만료/미인증: 스토어 초기화 후 로그인으로 이동
      const { withdraw } = useAuthStore.getState();
      withdraw();
      window.location.replace("/login");
    }
    return Promise.reject(err);
  }
);
