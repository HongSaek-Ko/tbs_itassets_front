import React, { useState } from "react";
import { testCall } from "../api/testAPIS";
import { Box, Typography } from "@mui/material";
import AssetDataTable from "../components/AssetDataTable";

const Home = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        안내 페이지
      </Typography>
      {/* <AssetDataTable /> */}
      <h1>아 안내에요~</h1>
    </Box>
  );
};

export default Home;
