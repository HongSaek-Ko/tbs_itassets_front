import { axiosInstance } from "./axios";

export const testCall = async () => {
  const { data } = await axiosInstance.get("/test");
  return data;
};
