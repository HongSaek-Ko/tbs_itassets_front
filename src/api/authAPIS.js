import { axiosInstance } from "./axios";

export const postSignup = (body) => axiosInstance.post("/auth/signup", body);
export const postLogin = (body) => axiosInstance.post("/auth/login", body);
export const postLogout = () => axiosInstance.post("/auth/logout");
