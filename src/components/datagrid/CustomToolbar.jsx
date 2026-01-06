import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";

const FIELD_LABEL = {
  assetType: "종류",
  empName: "성명",
  empPos: "직위",
  teamName: "소속",
  assetLoc: "설치장소",
  assetDesc: "비고",
};

export default function CustomToolbar({
  globalSearch,
  onGlobalSearchChange,
  onExport,
  columnFilters,
  onClearOneFilter,
  onResetAll,

  // 폐기
  onDispose,
  tgDisposeMode,
  selectionModel,
  disposeMode,

  // 현재/폐기 분기
  assetStatus,

  // 신규 등록
  handleRegistForm,

  // 수정
  updateMode,
  editedUpdateCount,
  onToggleUpdateMode,
  onSaveUpdates,
}) {
  const location = useLocation();
  const isEmp = location.pathname.includes("emp");
  const text = isEmp ? "직원" : "자산";
  const deleteText = isEmp ? "퇴사 처리" : "폐기할 자산";

  const chips = Object.entries(columnFilters || {})
    .filter(([, v]) => String(v || "").trim().length > 0)
    .map(([k, v]) => ({ key: k, label: `${FIELD_LABEL[k] ?? k}: ${v}` }));

  const hasSelection =
    Array.isArray(selectionModel) && selectionModel.length > 0;

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
      {/* 신규 등록, 정보 수정 */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", gap: 1 }}>
        {assetStatus !== "N" && (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            onClick={handleRegistForm}
          >
            신규 {text} 등록
          </Button>
        )}
        <Button
          size="small"
          color="primary"
          variant={
            updateMode && editedUpdateCount > 0 ? "contained" : "outlined"
          }
          onClick={() => {
            if (updateMode && editedUpdateCount > 0) onSaveUpdates?.();
            else onToggleUpdateMode?.();
          }}
        >
          {updateMode && editedUpdateCount > 0 ? "수정 정보 저장" : "정보 수정"}
        </Button>
        {/* 폐기 버튼: “한 자리에서” 토글 */}
        {assetStatus !== "N" && (
          <Button
            size="small"
            color="error"
            variant={disposeMode && hasSelection ? "contained" : "outlined"}
            onClick={() => {
              if (disposeMode && hasSelection) onDispose?.();
              else tgDisposeMode?.(); // 선택 없거나 모드 아니면: 모드 토글
            }}
          >
            {disposeMode && hasSelection ? "선택 확인" : `${deleteText} 선택`}
          </Button>
        )}
      </Box>

      {/* 필터 칩 */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
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

      {/* 검색 */}
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
          "& .MuiInputBase-input": {
            padding: "4px 6px",
          },
        }}
      />

      <Button
        size="small"
        variant="outlined"
        color="success"
        onClick={() => onExport({ text }.text)}
      >
        {`엑셀(.xlsx) 내보내기`}
      </Button>
    </Box>
  );
}
