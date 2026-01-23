// src/pages/EmpDataTable.jsx
import React, { useEffect, useMemo, useState } from "react";

import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";

import { DataGridText } from "../assets/DataGridText";

import CustomToolbar from "../components/datagrid/CustomToolbar";
import CustomColumnMenu from "../components/datagrid/CustomColumnMenu";
import ColumnFilterDialog from "../components/datagrid/ColumnFilterDialog";

import { useEmpRows } from "./hooks/useEmpRows";
import { useUpdateEmps } from "./hooks/useUpdateEmp";
import { useResignEmps } from "./hooks/useResignEmp";
import RegistEmpEntry from "./dialogs/RegistEmpEntry";
import RegistEmpDialog from "./dialogs/RegistEmpDialog";
import { IconButton } from "@mui/material";

import { useAuthStore } from "./hooks/useAuthStore";
import { EmpAuthCell } from "./dialogs/EmpAuthCell";

const paginationModelInit = { page: 0, pageSize: 50 };

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

// 퇴사자 식별 함수
const RESIGN_STATUSES = new Set(["resign", "retirement", "퇴직", "퇴사"]);

const isResigned = (status) =>
  RESIGN_STATUSES.has(String(status ?? "").toLowerCase());

// 직원 필터 가능 필드(사번 제외)
const FILTERABLE_FIELDS = ["empName", "empPos", "teamName", "empStatus"];

const emptyFilters = {
  empName: "",
  empPos: "",
  teamName: "",
  empStatus: "",
};

// 컬럼 메뉴에서의 필터 가능/정렬 가능 제한
const MENU_FILTERABLE_FIELDS = ["empName", "empPos", "teamName", "empStatus"];
const MENU_SORTABLE_FIELDS = ["empId", "empPos"];

// 직위 정렬(사용자 정의)
const EMP_POS_RANK = {
  대표이사: 1,
  이사: 2,
  상무: 3,
  책임: 4,
  선임: 5,
  사원: 6,
};
const empPosComparator = (v1, v2) => {
  const a = EMP_POS_RANK[String(v1 ?? "").trim()] ?? 999;
  const b = EMP_POS_RANK[String(v2 ?? "").trim()] ?? 999;
  return a - b;
};

export default function EmpDataTable({ title = "직원 목록" }) {
  const myAuth = useAuthStore((s) => s.user?.auth ?? []);
  const isAdmin =
    myAuth.includes("AUTH_ADMIN") || // AUTH로 오면 이걸로
    myAuth.includes("PERM_ADMIN"); // 혹시 따로 있으면
  console.log("myAuth=", myAuth, "isAdmin=", isAdmin);

  const apiRef = useGridApiRef();

  const [paginationModel, setPaginationModel] = useState(paginationModelInit);
  const [columnFilters, setColumnFilters] = useState(emptyFilters);
  const [globalSearch, setGlobalSearch] = useState("");

  const [filterDialog, setFilterDialog] = useState({
    open: false,
    field: "",
    title: "",
  });

  const [registEntryOpen, setRegistEntryOpen] = useState(false);
  const [registInitial, setRegistInitial] = useState(false);
  const [registFormOpen, setRegistFormOpen] = useState(false);

  // 목록 로딩/검색/필터/엑셀
  const rowsState = useEmpRows({
    columnFilters,
    globalSearch,
    filterableFields: FILTERABLE_FIELDS,
  });

  const { loading, filteredRows, reloadRows, handleExport } = rowsState;

  // 등록폼 열기
  const handleEmpRegForm = () => {
    setRegistInitial(null); // 빈 폼으로 설정(초기화)
    setRegistEntryOpen(true); // 직접 작성/업로드 선택창
  };

  // 선택창 닫기
  const closeEntry = () => setRegistEntryOpen(false);

  // 직접 작성하기
  const openDirectForm = () => {
    setRegistInitial(null);
    setRegistEntryOpen(false);
    setRegistFormOpen(true);
  };

  // 엑셀 양식 적용 (자동 기입)
  const openExcelPrefilledForm = (initialValues) => {
    setRegistInitial(initialValues); // 폼 데이터를 엑셀에 작성된 데이터로 대입
    setRegistEntryOpen(false); // 선택창 닫기
    setRegistFormOpen(true); // 등록폼(작성폼) 열기
  };

  // 등록폼 닫기
  const handleCloseRegist = () => {
    setRegistFormOpen(false);
    setRegistInitial(null);
  };

  // 수정
  const update = useUpdateEmps({
    allRows: rowsState.allRows,
    setAllRows: rowsState.setAllRows,
  });

  // 퇴사
  const resign = useResignEmps({
    allRows: rowsState.allRows,
    setAllRows: rowsState.setAllRows,
  });

  // 동시 켜짐 방지(자산에서처럼 안전빵으로 막기)
  useEffect(() => {
    if (update.updateMode && resign.resignMode) {
      // 둘 다 켜졌다면, 마지막으로 켠 쪽이 무엇인지 추적하기 번거로우니
      resign.toggleResignMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update.updateMode, resign.resignMode]);

  // 필터 다이얼로그
  const openColumnFilterDialog = (field, title2) =>
    setFilterDialog({ open: true, field, title: title2 });

  const closeColumnFilterDialog = () =>
    setFilterDialog({ open: false, field: "", title: "" });

  const applyColumnFilter = (field, value) => {
    setColumnFilters((prev) => ({ ...prev, [field]: value ?? "" }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const resetAllFilters = () => {
    setColumnFilters(emptyFilters);
    setGlobalSearch("");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // columns: base + (수정모드 patch)
  const columns = useMemo(() => {
    const base = [
      { field: "empId", headerName: "사번", width: 120 },
      { field: "empName", headerName: "성명", width: 140 },
      {
        field: "empPos",
        headerName: "직위",
        width: 140,
        sortComparator: empPosComparator,
      },
      { field: "teamName", headerName: "소속", width: 180 },
      { field: "empStatus", headerName: "재직 상태", width: 140 },

      ...(isAdmin
        ? [
            {
              field: "auth",
              headerName: "권한",
              minWidth: 280,
              sortable: false,
              filterable: false,
              renderCell: (params) => (
                <EmpAuthCell
                  row={params.row}
                  updateMode={update.updateMode}
                  isAdmin={isAdmin}
                  setAllRows={rowsState.setAllRows}
                />
              ),
            },
          ]
        : []),
    ];

    return update.patchColumns(base);
  }, [
    isAdmin,
    rowsState.setAllRows,
    update.updateMode,
    update.editedCellsMap,
    update.teamNames,
    update.empPos,
    update.patchColumns,
  ]);

  // 편집 핸들러
  const processRowUpdate = (newRow, oldRow) => {
    if (update.updateMode) return update.processRowUpdate(newRow, oldRow);
    return oldRow;
  };

  const onProcessRowUpdateError = (error) => {
    if (update.updateMode) return update.onProcessRowUpdateError(error);
  };

  const isCellEditable = (params) => {
    if (update.updateMode) return update.isCellEditable(params);
    return false;
  };

  const resignModeOn = resign.resignMode;
  const updateModeOn = update.updateMode;
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
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataGrid
          apiRef={apiRef}
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => String(row.empId ?? row.id)}
          // 퇴사자 식별용 class 추가
          getRowClassName={(params) =>
            isResigned(params.row.empStatus) ? "row-resigned" : ""
          }
          loading={loading}
          disableRowSelectionOnClick
          // 퇴사 모드에서만 체크박스
          checkboxSelection={resignModeOn}
          rowSelectionModel={resign.rowSelectionModel}
          onRowSelectionModelChange={(model) => {
            if (!resign.resignMode) return;
            resign.onRowSelectionChange(model);
          }}
          // pagination
          initialState={{
            pagination: { paginationModel: paginationModelInit },
          }}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableColumnFilter
          filterMode="client"
          // row edit
          isCellEditable={isCellEditable}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={onProcessRowUpdateError}
          onCellEditStop={(params) => {
            if (
              params.reason === "enterKeyDown" ||
              params.reason === "cellFocusOut"
            ) {
              params.api.stopCellEditMode({
                id: params.id,
                field: params.field,
              });
            }
          }}
          onCellEditCommit={(params) => {
            const { id, field } = params;
            update.markEdited?.(String(id), [field]);
          }}
          // slots
          showToolbar
          slots={{
            toolbar: CustomToolbar,
            noRowsOverlay: NoRowsOverlay,
            columnMenu: CustomColumnMenu,
          }}
          slotProps={{
            toolbar: {
              titleText: title,
              globalSearch,
              onGlobalSearchChange: setGlobalSearch,
              onExport: handleExport,
              columnFilters,
              handleEmpRegForm,
              onClearOneFilter: (field) => applyColumnFilter(field, ""),
              onResetAll: resetAllFilters,

              // 직원은 신규등록 보류 -> 버튼 숨김을 위해 assetStatus를 "N"처럼 줘서 신규등록/폐기 숨김
              // (CustomToolbar가 assetStatus !== "N"일 때만 신규/폐기 버튼을 보여주니)
              assetStatus: "Y",

              // 수정
              updateMode: updateModeOn,
              editedUpdateCount: update.editedCount,
              onToggleUpdateMode: () => {
                // 퇴사모드 켜져있으면 먼저 끄기
                if (resign.resignMode) resign.toggleResignMode();
                update.toggleUpdateMode();
              },
              onSaveUpdates: update.onClickUpdateSave,

              // "폐기 버튼" 자리를 직원에선 "퇴사 처리"로 재활용
              disposeMode: resignModeOn,
              tgDisposeMode: () => {
                // 수정모드 켜져있으면 먼저 끄기
                if (update.updateMode) update.toggleUpdateMode();
                resign.toggleResignMode();
              },
              selectionModel: resign.selectionModel,
              onDispose: resign.onClickResignFinal,
            },
            columnMenu: {
              openColumnFilterDialog,
              // 직원 규칙 적용
              filterableFields: MENU_FILTERABLE_FIELDS,
              sortableFields: MENU_SORTABLE_FIELDS,
            },
          }}
          localeText={DataGridText}
          sx={{
            border: 0,
            // 퇴사자 행 강조
            "& .row-resigned": {
              backgroundColor: "#fdecef",
              color: "#6e6161ff",
            },

            // hover 시에도 색 유지
            "& .row-resigned:hover": {
              backgroundColor: "#f9dce2",
            },

            // 선택(checkbox) 시에도 덮어씌워지지 않게
            "& .row-resigned.Mui-selected": {
              backgroundColor: "#f9dce2 !important",
            },
            "& .MuiDataGrid-menuIcon": { marginLeft: "10px !important" },
            "& .MuiDataGrid-menuIconButton": {
              padding: "2px !important",
              marginLeft: "6px !important",
            },
            // 수정 모드 스타일(자산과 동일)
            "& .cell-disabled": {
              backgroundColor: "rgba(0,0,0,0.04)",
              color: "rgba(0,0,0,0.55)",
            },
            "& .cell-updated": {
              backgroundColor: "rgba(76, 107, 207, 0.15)",
            },
          }}
        />
      </Box>

      {/* "이 열에서 필터하기" Dialog */}
      <ColumnFilterDialog
        open={filterDialog.open}
        title={filterDialog.title}
        value={
          filterDialog.field ? (columnFilters[filterDialog.field] ?? "") : ""
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

      {/* 신규 직원 등록: '엑셀 업로드' | '직접 작성' 선택창(Dialog) */}
      <RegistEmpEntry
        open={registEntryOpen}
        onClose={closeEntry}
        onPickDirect={openDirectForm}
        onExcelPrefill={openExcelPrefilledForm}
      />

      {/* 신규 직원 등록 폼 (Dialog) */}
      <Dialog
        open={registFormOpen}
        onClose={() => {}}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            width: 1400,
            maxWidth: "92vw",
            m: "auto",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pr: 6, position: "relative" }}>
          <Typography fontWeight={800}>신규 직원 등록</Typography>
          <IconButton
            onClick={handleCloseRegist}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 3 }}>
          <RegistEmpDialog
            initialRows={registInitial} // 폼 초기값. 엑셀 업로드 시 해당 데이터로 대입 용도
            onClose={() => {
              handleCloseRegist();
              reloadRows(); // 등록 성공 후 목록 갱신
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 퇴사처리 확인 Dialog */}
      <Dialog
        open={resign.confirmOpen}
        onClose={() => resign.setConfirmOpen(false)}
      >
        <DialogTitle>퇴사 처리하시겠어요?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            선택된 직원 {resign.selectionModel.length}건을 퇴사 처리합니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => resign.setConfirmOpen(false)}
          >
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={resign.requestResign}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 퇴사처리 오류 Dialog */}
      <Dialog
        open={resign.errorOpen}
        onClose={() => resign.setErrorOpen(false)}
      >
        <DialogTitle>안내</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {resign.errorMsg}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => resign.setErrorOpen(false)}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수정 확인 Dialog */}
      <Dialog
        open={update.confirmOpen}
        onClose={() => update.setConfirmOpen(false)}
      >
        <DialogTitle>수정하시겠어요?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            총 {update.editedCount}건의 직원 정보가 수정됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => update.setConfirmOpen(false)}
          >
            취소
          </Button>
          <Button variant="contained" onClick={update.requestUpdate}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수정 오류 Dialog */}
      <Dialog
        open={update.errorOpen}
        onClose={() => update.setErrorOpen(false)}
      >
        <DialogTitle>안내</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {update.errorMsg}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => update.setErrorOpen(false)}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
