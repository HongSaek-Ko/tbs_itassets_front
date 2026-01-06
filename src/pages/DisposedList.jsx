import AssetDataTable from "../components/AssetDataTable";
import { Box, Typography } from "@mui/material";
import React from "react";

const DisposedList = () => {
  return (
    // <Box sx={{ p: 3 }}>
    //   <Typography variant="h5" gutterBottom>
    //     폐기 자산 목록
    //   </Typography>
    <AssetDataTable assetStatus="N" title="폐기 자산 목록" />
    // </Box>
  );
};

export default DisposedList;
