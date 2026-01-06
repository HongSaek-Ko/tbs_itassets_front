import { axiosInstance } from "./axios";

// 팀 목록
export const fetchTeamNameList = (params = {}) => {
  return axiosInstance.get("/team", { params });
};

// 직원 목록 불러오기
export const fetchEmpList = (params = {}) => {
  return axiosInstance.get("/emp", { params });
};

// 직원 엑셀 export
export function exportEmpListExcel(params) {
  console.log("params: ", params);
  // 예시: GET /api/employees/export (responseType: 'blob')
  return axiosInstance.get("/emp/export", {
    params,
    responseType: "arraybuffer",
  });
}

// 직원 수정(벌크)
export function updateEmpBulk(payload) {
  console.log("요청 객체: ", payload);
  // 예시: PATCH /api/employees/bulk
  return axiosInstance.patch("/emp/bulkUpdate", payload);
}

// 직원 상태 변경(벌크) - 퇴사 처리
export function updateEmpStatusBulk(payload) {
  // 예시: PATCH /api/employees/status/bulk
  return axiosInstance.patch("/emp/resign", payload);
}

// 전체 직위 조회 (수정, 등록 등 용도)
export const fetchEmpPosList = (params = {}) => {
  return axiosInstance.get("/emp/empPos", { params });
};
