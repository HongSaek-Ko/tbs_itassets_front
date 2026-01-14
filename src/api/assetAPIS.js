// src/api/assetAPIS.js
import { axiosInstance } from "./axios";

// 자산 목록 조회
// GET /api/assets
export const fetchAssetList = (params = {}) => {
  // params: { assetType, empName, empPos, page, size } 등
  return axiosInstance.get("/assets", { params });
};

// 자산 목록 엑셀 Export
// GET /api/assets/export
export const exportAssetListExcel = (params) => {
  return axiosInstance.get("/assets/export", {
    // return axiosInstance.get("/excel", {
    params,
    responseType: "arraybuffer",
  });
};

// 자산 폐기(삭졔)
// patch /api/assets/dispose
export const fetchDisposeAssets = (payload) => {
  return axiosInstance.patch("/assets/dispose", payload);
};

// 다음 품번 조회 (assetType=모니터/노트북)
// 자산 등록 시 품번 자동 등록하기 위함
export const fetchNextAssetId = (assetType) => {
  return axiosInstance.get("/assets/nextId", { params: { assetType } });
};

// 시리얼 번호 조회
export const fetchAssetSnList = () => {
  return axiosInstance.get("/assets/sn");
};

// 자산 등록
export const createAsset = (payload) => {
  console.log(payload);
  return axiosInstance.post("/assets", payload);
};

// 자산 수정
export const updateAssetBulk = (payload) => {
  console.log("수정 요청 목록: ", payload);
  return axiosInstance.patch("/assets/bulkUpdate", payload);
};

// 자산 변동 이력
export const fetchAssetHistory = (assetId) => {
  // console.log("요청 ID?", assetId);
  return axiosInstance.get(`/assets/history/${assetId}`);
};

// 이력 내보내기
export const exportAssetHistory = (assetId) => {
  return axiosInstance.get(`/assets/history/export/${assetId}`, {
    // return axiosInstance.get("/excel", {
    assetId,
    responseType: "arraybuffer",
  });
};

// 이력 내보내기
export const exportTotalHistory = (params) => {
  return axiosInstance.get(`/assets/history/export`, {
    // return axiosInstance.get("/excel", {
    params,
    responseType: "arraybuffer",
  });
};
