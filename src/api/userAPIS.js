import { axiosInstance } from "./axios";

export const getMe = () => axiosInstance.get("/user/my");
export const putMe = (body) => axiosInstance.put("/user/my", body);
