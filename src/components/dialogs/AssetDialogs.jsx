// src/components/asset/ui/AssetDialogs.jsx
import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
} from "@mui/material";
import ColumnFilterDialog from "../datagrid/ColumnFilterDialog";

export default function AssetDialogs({
  // column filter dialog
  filterDialog,
  columnFilters,
  closeColumnFilterDialog,
  applyColumnFilter,

  // dispose dialogs
  confirmOpen,
  setConfirmOpen,
  selectionCount,
  onConfirmDispose,

  errorOpen,
  setErrorOpen,
  errorMsg,
}) {
  return (
    <>
      <ColumnFilterDialog
        open={filterDialog.open}
        title={filterDialog.title}
        field={filterDialog.field}
        value={
          filterDialog.field ? columnFilters[filterDialog.field] ?? "" : ""
        }
        onClose={closeColumnFilterDialog}
        onApply={(value) => {
          applyColumnFilter(filterDialog.field, value);
          closeColumnFilterDialog();
        }}
        onClear={() => {
          applyColumnFilter(filterDialog.field, "");
          closeColumnFilterDialog();
        }}
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>자산 폐기 확인</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            선택된 자산 {selectionCount}건을 폐기 처리합니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmOpen(false)}>
            취소
          </Button>
          <Button variant="contained" color="error" onClick={onConfirmDispose}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorOpen} onClose={() => setErrorOpen(false)}>
        <DialogTitle>안내</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {errorMsg}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setErrorOpen(false)}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
