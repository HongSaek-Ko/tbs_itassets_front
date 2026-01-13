import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DataGrid } from "@mui/x-data-grid";
import ColumnFilterDialog from "../datagrid/ColumnFilterDialog";
import CustomColumnMenu from "../datagrid/CustomColumnMenu";
import { DataGridText } from "../../assets/DataGridText";

import AssetHistoryToolbar from "../datagrid/AssetHistoryToolbar";
import { getAssetHistoryColumns } from "../../utils/assetHistoryColumns";
import {
  applyColumnFilters,
  buildSearchPredicate,
  isDisposeHistoryRow,
  isFirstHistoryRow,
  isTransferHistoryRow,
} from "../../utils/assetHistoryUtils";

import { useAssetHistoryRows } from "../hooks/useAssetHistoryRows";

const emptyFilters = {
  assetHoldEmp: "",
  assetHoldEmpHis: "",
  assetHistoryDesc: "",
  assetHistoryDate: "",
};

const FILTERABLE_FIELDS = [
  "assetHoldEmp",
  "assetHoldEmpHis",
  "assetHistoryDesc",
  "assetHistoryDate",
];
const SORTABLE_FIELDS = ["assetHistoryDate", "assetHoldEmp", "assetHoldEmpHis"];

export default function AssetHistoryDialog({ open, assetId, onClose }) {
  const [columnFilters, setColumnFilters] = React.useState(emptyFilters);
  const [globalSearch, setGlobalSearch] = React.useState("");

  const {
    rows: serverRows,
    loading,
    errorMsg,
    handleExport,
  } = useAssetHistoryRows(assetId, open);

  const [filterDialog, setFilterDialog] = React.useState({
    open: false,
    field: "",
    title: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setColumnFilters(emptyFilters);
    setGlobalSearch("");
    setFilterDialog({ open: false, field: "", title: "" });
  }, [open, assetId]);

  const openColumnFilterDialog = (field, title) =>
    setFilterDialog({ open: true, field, title });

  const closeColumnFilterDialog = () =>
    setFilterDialog({ open: false, field: "", title: "" });

  const applyColumnFilter = (field, value) => {
    if (!field) return;
    setColumnFilters((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const resetAllFilters = () => {
    setColumnFilters(emptyFilters);
    setGlobalSearch("");
  };

  const filteredRows = React.useMemo(() => {
    const pred = buildSearchPredicate(globalSearch);
    const bySearch = (serverRows || []).filter(pred);
    return applyColumnFilters(bySearch, columnFilters);
  }, [serverRows, globalSearch, columnFilters]);

  const columns = React.useMemo(() => getAssetHistoryColumns(), []);

  return (
    <Dialog open={!!open} onClose={() => {}} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pr: 6,
          pb: 1,
        }}
      >
        <Typography sx={{ fontSize: 20, fontWeight: 500 }}>
          자산 {assetId} 변동(이관) 이력
        </Typography>

        <Box sx={{ flex: 1 }} />

        <IconButton
          aria-label="close"
          onClick={() => onClose?.()}
          sx={{ position: "absolute", right: 12, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {errorMsg ? (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {errorMsg}
          </Typography>
        ) : null}

        <Box sx={{ height: 520, width: "100%" }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.assetHistoryId}
            loading={loading}
            disableRowSelectionOnClick
            checkboxSelection={false}
            hideFooter
            disableColumnFilter
            filterMode="client"
            showToolbar
            slots={{
              toolbar: AssetHistoryToolbar,
              columnMenu: CustomColumnMenu,
            }}
            slotProps={{
              toolbar: {
                assetId: assetId,
                globalSearch,
                onExport: handleExport,
                onGlobalSearchChange: setGlobalSearch,
                columnFilters,
                onClearOneFilter: (field) => applyColumnFilter(field, ""),
                onResetAll: resetAllFilters,
              },
              columnMenu: {
                openColumnFilterDialog,
                columnFilters,
                setColumnFilters,
                filterableFields: FILTERABLE_FIELDS,
                sortableFields: SORTABLE_FIELDS,
              },
            }}
            localeText={DataGridText}
            getRowClassName={(params) => {
              const r = params.row;
              if (isDisposeHistoryRow(r)) return "row-dispose";
              if (isTransferHistoryRow(r)) return "row-transfer";
              if (isFirstHistoryRow(r)) return "row-first";
              return "";
            }}
            sx={{
              border: 0,
              "& .MuiDataGrid-menuIcon": { marginLeft: "10px !important" },
              "& .MuiDataGrid-menuIconButton": {
                padding: "2px !important",
                marginLeft: "6px !important",
              },

              "& .row-first": { backgroundColor: "#e9f7ef" }, // 옅은 초록
              "& .row-transfer": { backgroundColor: "#fff6d6" }, // 옅은 노랑
              "& .row-dispose": { backgroundColor: "#fdecef" }, // 옅은 분홍
            }}
          />
        </Box>

        <ColumnFilterDialog
          open={filterDialog.open}
          title={filterDialog.title}
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
      </DialogContent>
    </Dialog>
  );
}
