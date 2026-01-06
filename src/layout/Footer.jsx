import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        py: 1,
        px: 2,
        textAlign: "center",
        fontSize: 12,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © IT자산 관리 시스템
      </Typography>
    </Box>
  );
};

export default Footer;
