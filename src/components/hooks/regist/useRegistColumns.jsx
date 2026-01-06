// regist/hooks/useRegistColumns.js
import React, { useMemo } from "react";
import { Box, CircularProgress, MenuItem, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";

export function useRegistColumns({
  control,
  empLoading,
  empList,
  assetIdLoadingRows,
  handleEmpChange,
  handleAssetTypeChange,
}) {
  return useMemo(() => {
    const no = { sortable: false, filterable: false, disableColumnMenu: true };

    const textCell = (name) => (params) => {
      const idx = params?.row?.__idx;
      if (idx == null) return null;

      return (
        <Controller
          name={`rows.${idx}.${name}`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              size="small"
              value={field.value || ""}
              error={!!fieldState.error}
              helperText={fieldState.error?.message || " "}
              onChange={(e) => field.onChange(e.target.value)}
              sx={{ width: "100%" }}
            />
          )}
        />
      );
    };

    return [
      {
        field: "assetId",
        headerName: "품번(자동)",
        width: 130,
        ...no,
        renderCell: (params) => {
          const uiId = params?.row?.uiId;
          const loading = !!assetIdLoadingRows[uiId];
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              <span>{params.value || ""}</span>
              {loading ? <CircularProgress size={14} /> : null}
            </Box>
          );
        },
      },
      {
        field: "assetType",
        headerName: "종류",
        width: 130,
        ...no,
        renderCell: (params) => {
          const idx = params?.row?.__idx;
          const uiId = params?.row?.uiId;
          if (idx == null) return null;

          return (
            <Controller
              name={`rows.${idx}.assetType`}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  size="small"
                  value={field.value || ""}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || " "}
                  onChange={(e) =>
                    handleAssetTypeChange(uiId, idx, e.target.value)
                  }
                  sx={{ width: "100%" }}
                >
                  <MenuItem value="">선택</MenuItem>
                  <MenuItem value="모니터">모니터</MenuItem>
                  <MenuItem value="노트북">노트북</MenuItem>
                </TextField>
              )}
            />
          );
        },
      },
      {
        field: "assetManufacturer",
        headerName: "제조사",
        width: 160,
        ...no,
        renderCell: textCell("assetManufacturer"),
      },
      {
        field: "assetManufacturedAt",
        headerName: "제조년월",
        width: 170,
        ...no,
        renderCell: (params) => {
          const idx = params?.row?.__idx;
          if (idx == null) return null;

          return (
            <Controller
              name={`rows.${idx}.assetManufacturedAt`}
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(v) => field.onChange(v ? v.toDate() : null)}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: "small",
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message || " ",
                      sx: { width: "100%" },
                    },
                  }}
                />
              )}
            />
          );
        },
      },
      {
        field: "assetModelName",
        headerName: "모델명",
        width: 200,
        ...no,
        renderCell: textCell("assetModelName"),
      },
      {
        field: "assetSn",
        headerName: "S/N",
        width: 180,
        ...no,
        renderCell: textCell("assetSn"),
      },
      {
        field: "empId",
        headerName: "성명",
        width: 180,
        ...no,
        renderCell: (params) => {
          const idx = params?.row?.__idx;
          if (idx == null) return null;

          return (
            <Controller
              name={`rows.${idx}.empId`}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  size="small"
                  value={field.value || ""}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || " "}
                  disabled={empLoading}
                  onChange={(e) => handleEmpChange(idx, e.target.value)}
                  sx={{ width: "100%" }}
                >
                  <MenuItem value="">선택</MenuItem>
                  {empList.map((e) => (
                    <MenuItem key={String(e.empId)} value={String(e.empId)}>
                      {e.empName}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          );
        },
      },
      {
        field: "empPos",
        headerName: "직위",
        width: 130,
        ...no,
        renderCell: textCell("empPos"),
      },
      {
        field: "teamName",
        headerName: "소속",
        width: 160,
        ...no,
        renderCell: textCell("teamName"),
      },
      {
        field: "assetLoc",
        headerName: "설치장소",
        minWidth: 240,
        flex: 2,
        ...no,
        renderCell: textCell("assetLoc"),
      },
      {
        field: "assetIssuanceDate",
        headerName: "지급일",
        width: 170,
        ...no,
        renderCell: (params) => {
          const idx = params?.row?.__idx;
          if (idx == null) return null;

          return (
            <Controller
              name={`rows.${idx}.assetIssuanceDate`}
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(v) => field.onChange(v ? v.toDate() : null)}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: "small",
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message || " ",
                      sx: { width: "100%" },
                    },
                  }}
                />
              )}
            />
          );
        },
      },
      {
        field: "assetDesc",
        headerName: "비고",
        minWidth: 320,
        flex: 3,
        ...no,
        renderCell: textCell("assetDesc"),
      },
    ];
  }, [
    control,
    empLoading,
    empList,
    assetIdLoadingRows,
    handleEmpChange,
    handleAssetTypeChange,
  ]);
}
