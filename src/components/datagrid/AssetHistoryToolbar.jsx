import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

const FIELD_LABEL = {
  displayId: "이력 번호",
  assetHoldEmp: "현재 소유자",
  assetHistoryDesc: "변동 사유",
  assetHistoryDate: "변동 시간",
};

export default function AssetHistoryToolbar({
  globalSearch,
  onGlobalSearchChange,
  columnFilters,
  onClearOneFilter,
  onResetAll,
  assetId,
  onExport,
}) {
  const chips = Object.entries(columnFilters || {})
    .filter(([, v]) => String(v || "").trim().length > 0)
    .map(([k, v]) => ({ key: k, label: `${FIELD_LABEL[k] ?? k}: ${v}` }));

  return (
    <Box
      sx={{
        px: 1,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", flex: 1 }}>
        {chips.map((c) => (
          <Chip
            key={c.key}
            size="small"
            label={c.label}
            onDelete={() => onClearOneFilter?.(c.key)}
            sx={{ mb: 0.5 }}
          />
        ))}
      </Stack>

      {(chips.length > 0 || globalSearch) && (
        <Button size="small" color="inherit" onClick={onResetAll}>
          조건 초기화
        </Button>
      )}

      <TextField
        size="small"
        value={globalSearch}
        onChange={(e) => onGlobalSearchChange?.(e.target.value)}
        placeholder="+포함어, -제외어, 공백 단위 검색"
        sx={{
          width: 260,
          "& .MuiInputBase-root": {
            height: 32,
            fontSize: 14,
            paddingRight: "6px",
          },
          "& .MuiInputBase-input": { padding: "4px 6px" },
        }}
      />
      <Button
        size="small"
        variant="outlined"
        color="success"
        onClick={() => onExport({ assetId })}
      >
        {`엑셀(.xlsx) 내보내기`}
      </Button>
    </Box>
  );
}
