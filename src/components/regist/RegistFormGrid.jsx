// regist/components/RegistFormGrid.jsx
import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

export default function RegistFormGrid({
  rows,
  columns,
  rowSelectionModel,
  onRowSelectionModelChange,
}) {
  return (
    <Box sx={{ height: 560, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.uiId} // DataGrid row id는 uiId(=fieldArray keyName)만
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={onRowSelectionModelChange}
        keepNonExistentRowsSelected={false}
        hideFooter
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgba(0,0,0,0.02)",
          },
          "& .MuiDataGrid-cell": { alignItems: "center", py: 0.5 },
          "& .MuiDataGrid-row": { maxHeight: "none !important" },
        }}
      />
    </Box>
  );
}
