// regist/hooks/useRegistColumns.js
import React, { useMemo } from "react";
import { Box, CircularProgress, MenuItem, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";

export function useEmpRegColumns({ control, onEmpIdChanged }) {
  return useMemo(() => {
    const no = { sortable: false, filterable: false, disableColumnMenu: true };
    const empPos = ["이사", "상무", "책임", "선임", "사원", "인턴"];
    const teamName = ["개발팀", "경영실", "재무팀", "영업팀"];

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
        field: "empId",
        headerName: "사번",
        width: 130,
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
                  size="small"
                  value={field.value || ""}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || " "}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={() => {
                    // prev는 params.row.empId(렌더 시점 값), next는 field.value(최신)
                    onEmpIdChanged?.({
                      rowIndex: idx,
                      prevEmpId: params?.row?.empId,
                      nextEmpId: field.value,
                    });
                  }}
                  sx={{ width: "100%" }}
                />
              )}
            />
          );
        },
      },
      {
        field: "empName",
        headerName: "성명",
        width: 180,
        ...no,
        renderCell: textCell("empName"),
      },
      {
        field: "empPos",
        headerName: "직위",
        width: 130,
        ...no,
        renderCell: (params) => {
          const idx = params?.row?.__idx;
          if (idx == null) return null;

          return (
            <>
              {empPos.length > 0 && (
                <Controller
                  name={`rows.${idx}.empPos`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={field.value ?? ""}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || " "}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {empPos.map((e, i) => (
                        <MenuItem key={i} value={String(e)}>
                          {e}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}
            </>
          );
        },
      },
      {
        field: "teamName",
        headerName: "소속",
        width: 130,
        ...no,
        renderCell: (params) => {
          const idx = params?.row?.__idx;
          if (idx == null) return null;

          return (
            <>
              {teamName.length > 0 && (
                <Controller
                  name={`rows.${idx}.teamName`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={field.value ?? ""}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || " "}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {teamName.map((e, i) => (
                        <MenuItem key={i} value={String(e)}>
                          {e}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}
            </>
          );
        },
      },
      {
        field: "empRegDt",
        headerName: "입사일자",
        width: 190,
        ...no,
        renderCell: (params) => {
          const idx = params?.row?.__idx;
          if (idx == null) return null;

          return (
            <Controller
              name={`rows.${idx}.empRegDt`}
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
    ];
  }, [control, onEmpIdChanged]);
}
