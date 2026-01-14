import { totalHistoryColumns } from "../utils/assetTotalHistoryColumns";
import { Box, DialogContent, Paper, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import CustomColumnMenu from "./datagrid/CustomColumnMenu";
import AssetHistoryToolbar from "./datagrid/AssetHistoryToolbar";
import {
  applyColumnFilters,
  buildSearchPredicate,
} from "../utils/assetHistoryUtils";
import ColumnFilterDialog from "./datagrid/ColumnFilterDialog";
import { useAssetHistoryRows } from "./hooks/useAssetHistoryRows";

const paginationModelInit = { page: 0, pageSize: 50 };
// 표시할 데이터(목록) 없는 경우 대체 표시
function NoRowsOverlay() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        표시할 데이터가 없습니다.
      </Typography>
    </Box>
  );
}

const emptyFilters = {
  assetId: "",
  assetHoldEmp: "",
  assetHistoryDesc: "",
  assetHistoryDate: "",
};

const FILTERABLE_FIELDS = ["assetId", "assetHoldEmp"];

const SORTABLE_FIELDS = ["assetId", "assetHistoryDate", "assetHoldEmp"];

export default function HistoryDataTable({}) {
  const [columnFilters, setColumnFilters] = useState(emptyFilters);
  const [globalSearch, setGlobalSearch] = useState("");

  const {
    rows: serverRows,
    loading,
    errorMsg,
    handleExport,
    totalExport,
  } = useAssetHistoryRows(null, false);

  const [paginationModel, setPaginationModel] = useState(paginationModelInit);
  const [filterDialog, setFilterDialog] = useState({
    open: false,
    field: "",
    title: "",
  });
  const columns = useMemo(() => totalHistoryColumns(), []);
  const isTotal = true;

  useEffect(() => {
    setColumnFilters(emptyFilters);
    setGlobalSearch("");
    setFilterDialog({ open: false, field: "", title: "" });
  }, []);

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

  const filteredRows = useMemo(() => {
    const pred = buildSearchPredicate(globalSearch);
    const bySearch = (serverRows || []).filter(pred);
    return applyColumnFilters(bySearch, columnFilters);
  }, [serverRows, globalSearch, columnFilters]);

  return (
    <Paper
      sx={{
        height: "100%",
        width: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" fontWeight={400}>
        전체 자산 변동 이력
      </Typography>
      {errorMsg ? (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {errorMsg}
        </Typography>
      ) : null}
      {/* DataGrid */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.assetHistoryId}
          loading={loading}
          showToolbar // 이거 없으면 안됨
          slots={{
            noColumnsOverlay: NoRowsOverlay,
            columnMenu: CustomColumnMenu,
            toolbar: AssetHistoryToolbar,
          }}
          slotProps={{
            toolbar: {
              globalSearch,
              onExport: handleExport,
              totalExport: totalExport,
              onGlobalSearchChange: setGlobalSearch,
              columnFilters,
              onClearOneFilter: (field) => applyColumnFilter(field, ""),
              onResetAll: resetAllFilters,
              isTotal,
            },
            columnMenu: {
              openColumnFilterDialog,
              columnFilters,
              setColumnFilters,
              sortableFields: SORTABLE_FIELDS,
              filterableFields: FILTERABLE_FIELDS,
            },
          }}
          // pagination
          initialState={{
            pagination: { paginationModel: paginationModelInit },
          }}
          paginationModel={paginationModel}
          pageSizeOptions={[10, 20, 50]}
          sx={{
            border: 0,
            "& .MuiDataGrid-menuIcon": { marginLeft: "10px !important" },
            "& .MuiDataGrid-menuIconButton": {
              padding: "2px !important",
              marginLeft: "6px !important",
            },
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
    </Paper>
  );
}
