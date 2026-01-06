import AssetDataTable from "../components/AssetDataTable";
import { Box, Typography } from "@mui/material";
import React from "react";

const AssetList = () => {
  return <AssetDataTable assetStatus="HOLD" title="현재 자산 목록" />;
};

export default AssetList;
