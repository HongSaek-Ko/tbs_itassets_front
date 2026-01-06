// regist/components/RegistFormToolbar.jsx
import React from "react";
import { Box, Button } from "@mui/material";

export default function RegistFormToolbar({
  onAddRow,
  onRemoveSelected,
  onSubmit,
  isSubmitting,
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
      <Button type="button" variant="outlined" onClick={onAddRow}>
        행 추가
      </Button>

      <Button
        type="button"
        color="error"
        variant="outlined"
        onClick={onRemoveSelected}
      >
        선택 행 제거
      </Button>

      <Box sx={{ flex: 1 }} />

      <Button
        type="button"
        variant="contained"
        disabled={isSubmitting}
        onClick={onSubmit}
        sx={{ minWidth: 140, height: 40 }}
      >
        일괄 등록
      </Button>
    </Box>
  );
}
