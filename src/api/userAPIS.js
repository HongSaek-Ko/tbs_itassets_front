import { axiosInstance } from "./axios";

export const getMe = () => axiosInstance.get("/user/my");
export const putMe = (body) => {
  body;
  return axiosInstance.put("/user/my", body);
};

// 권한 부여
export const grantUserAuth = ({ userId, authCode }) => {
  return axiosInstance.post("/user/auth", { userId, authCode });
};

// 권한 회수
export const revokeUserAuth = ({ userId, authCode }) => {
  return axiosInstance.delete("/user/auth", { data: { userId, authCode } });
};
