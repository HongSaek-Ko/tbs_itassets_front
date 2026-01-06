import React from "react";
import { Box } from "@mui/material";

export const FIELD_HEIGHT = 55;

// ✅ placeholder / value 세로 중앙 정렬 + DatePicker도 동일하게 적용 가능
export const fieldSx = {
  "& .MuiInputBase-root": {
    height: FIELD_HEIGHT,
  },
  "& .MuiInputBase-input": {
    height: FIELD_HEIGHT,
    boxSizing: "border-box",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
  },
  "& input": {
    padding: 0,
    lineHeight: `${FIELD_HEIGHT}px`,
  },
};

// ✅ 에러 강조(테두리 굵게 + 살짝 흔들림)
export const errorFieldSx = {
  ...fieldSx,
  "& .MuiOutlinedInput-notchedOutline": { borderWidth: 2 },
  animation: "shake 0.15s linear 0s 2",
  "@keyframes shake": {
    "0%": { transform: "translateX(0px)" },
    "50%": { transform: "translateX(-2px)" },
    "100%": { transform: "translateX(2px)" },
  },
};

// ✅ 한 줄 고정 Row
export function RowGrid({ cols, children, sx }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: 2,
        alignItems: "stretch",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
