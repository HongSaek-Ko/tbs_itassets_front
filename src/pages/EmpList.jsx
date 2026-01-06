import EmpDataTable from "../components/EmpDataTable";
import { Box, Typography } from "@mui/material";
import React from "react";

const EmpList = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        직원 목록
      </Typography>
      <EmpDataTable />
    </Box>
  );
};

export default EmpList;
