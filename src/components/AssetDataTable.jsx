import React, { useEffect, useMemo, useState } from "react";

import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";

import { DataGrid, useGridApiRef } from "@mui/x-data-grid";

import { getColumns } from "../assets/Columns";
import { DataGridText } from "../assets/DataGridText";

import CustomToolbar from "../components/datagrid/CustomToolbar";
import CustomColumnMenu from "../components/datagrid/CustomColumnMenu";
import ColumnFilterDialog from "../components/datagrid/ColumnFilterDialog";

// 분리된 훅들
import { useAssetRows } from "./hooks/useAssetRows";
import { useDisposeAssets } from "./hooks/useDisposeAssets";

// 신규 등록 폼
import RegistFormDialog from "../components/dialogs/RegistFormDialog";

// ✅ 정보 수정
import { useUpdateAssets } from "./hooks/useUpdateAssets";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import RegistEntryDialog from "./dialogs/RegistEntryDialog";
import AssetHistoryPopover from "./dialogs/AssetHistoryPopver";
import AssetHistoryDialog from "./dialogs/AssetHistoryDialog";

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

// 필터 가능한 필드들(프론트/백 스펙 동일)
const FILTERABLE_FIELDS = [
  "assetType",
  "empName",
  "empPos",
  "teamName",
  "assetLoc",
  "assetDesc",
];

const emptyFilters = {
  assetType: "",
  empName: "",
  empPos: "",
  teamName: "",
  assetLoc: "",
  assetDesc: "",
};

/**
 * 공용 테이블 컴포넌트
 * - assetStatus: "Y"(또는 undefined)=현재자산 / "N"=폐기자산
 * - disposed 화면에서는 신규등록/폐기/수정 숨김
 */
export default function AssetDataTable({ assetStatus, title }) {
  const apiRef = useGridApiRef();
  // 변동 내역 관련 상태값
  const [hisPopover, setHisPopover] = useState({
    open: false,
    anchorEl: null,
    assetId: "",
  });
  const [hisDialogOpen, setHisDialogOpen] = useState(false);
  const [hisAssetId, setHisAssetId] = useState("");

  // 화면 상태
  const [paginationModel, setPaginationModel] = useState(paginationModelInit);
  const [columnFilters, setColumnFilters] = useState(emptyFilters);
  const [globalSearch, setGlobalSearch] = useState("");

  const [filterDialog, setFilterDialog] = useState({
    open: false,
    field: "",
    title: "",
  });

  // 신규 자산 등록 관련
  // 엑셀/폼 '선택' dialog
  const [registEntryOpen, setRegistEntryOpen] = useState(false);

  // 등록 폼 dialog
  const [registFormOpen, setRegistFormOpen] = useState(false);

  // 엑셀 업로드-기입 할 초기값
  const [registInitial, setRegistInitial] = useState(false);

  const handleRegistForm = () => {
    setRegistInitial(null); // 빈 폼으로 설정
    setRegistEntryOpen(true); // 선택창
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

  // 데이터 로딩/필터링/검색
  const rowsState = useAssetRows({
    assetStatus,
    columnFilters,
    globalSearch,
    filterableFields: FILTERABLE_FIELDS,
  });

  const {
    loading,
    allRows,
    filteredRows,
    reloadRows,
    handleExport, // 서버 export (columnFilters + globalSearch + assetStatus)
  } = rowsState;

  // 수정 기능
  const update = useUpdateAssets({
    allRows,
    setAllRows: rowsState.setAllRows,
    assetStatus, // disposed면 자동으로 막아두려고
    apiRef,
  });

  // 폐기 기능
  const dispose = useDisposeAssets({
    allRows,
    setAllRows: rowsState.setAllRows,
  });

  // '선택' 시 비고 셀로 자동 이동 + 편집 열기 (폐기 UX 유지)
  useEffect(() => {
    if (!dispose.disposeMode) return;
    if (!dispose.lastSelectedId) return;

    const id = String(dispose.lastSelectedId);

    // 선택된 행만 편집 가능
    if (!dispose.selectionModel.includes(id)) return;

    const rowIndex = filteredRows.findIndex(
      (r) => String(r.assetId ?? r.id ?? r.asset_id) === id
    );
    if (rowIndex < 0) return;

    const field = "assetDesc";

    requestAnimationFrame(() => {
      try {
        apiRef.current.scrollToIndexes({ rowIndex, colIndex: 0 });
        apiRef.current.setCellFocus(id, field);
        apiRef.current.startCellEditMode({ id, field });
      } catch (e) {
        console.warn("auto edit skipped:", e);
      }
    });
  }, [
    dispose.disposeMode,
    dispose.lastSelectedId,
    dispose.selectionModel,
    filteredRows,
    apiRef,
  ]);

  // 컬럼 필터 Dialog 핸들러
  const openColumnFilterDialog = (field, title) =>
    setFilterDialog({ open: true, field, title });

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

  // columns: 원본 + (폐기 비고 editable 제한) + (수정모드용 patch)
  const columns = useMemo(() => {
    const base = getColumns(columnFilters);

    // 1) 폐기: 비고는 선택된 행만 editable
    const disposedPatched = base.map((col) => {
      if (col.field !== "assetDesc") return col;
      return {
        ...col,
        editable: (params) => {
          const id = String(params.id);
          return dispose.disposeMode && dispose.selectionModel.includes(id);
        },
      };
    });

    // 2) 수정: 드롭다운/데이트피커/readonly/강조 등 주입
    return update.patchColumns(disposedPatched);
  }, [
    columnFilters,
    dispose.disposeMode,
    dispose.selectionModel,
    update.updateMode,
    update.empList,
    update.empLoading,
    update.editedCellsMap,
  ]);

  // DataGrid 편집 핸들러 분기
  const processRowUpdate = (newRow, oldRow) => {
    if (update.updateMode) return update.processRowUpdate(newRow, oldRow);
    return dispose.processRowUpdate(newRow, oldRow);
  };

  const onProcessRowUpdateError = (error) => {
    if (update.updateMode) return update.onProcessRowUpdateError(error);
    return dispose.onProcessRowUpdateError(error);
  };

  // 수정/폐기 동시 켜짐 방지
  const disposeModeOn = assetStatus !== "N" && dispose.disposeMode;
  const updateModeOn = assetStatus !== "N" && update.updateMode;

  // isCellEditable도 update/dispose 모드에 따라 분기
  const isCellEditable = (params) => {
    if (updateModeOn) return update.isCellEditable(params);
    if (disposeModeOn) return params.field === "assetDesc";
    return false;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          {title}
        </Typography>
        {/* DataGrid */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataGrid
            apiRef={apiRef}
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => String(row.assetId ?? row.id ?? row.asset_id)}
            loading={loading}
            // ===== 폐기 모드 체크박스 =====
            checkboxSelection={assetStatus !== "N" && disposeModeOn}
            disableRowSelectionOnClick
            rowSelectionModel={dispose.rowSelectionModel}
            onRowSelectionModelChange={(model) => {
              if (assetStatus === "N") return;
              if (!dispose.disposeMode) return;
              dispose.onRowSelectionChange(model);
            }}
            // ===== pagination =====
            initialState={{
              pagination: { paginationModel: paginationModelInit },
            }}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableColumnFilter
            filterMode="client"
            // ===== row edit =====
            isCellEditable={isCellEditable}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={onProcessRowUpdateError}
            onCellEditStop={(params, event) => {
              // Enter, focus out 시 강제 commit
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
              const { id, field, value } = params;

              update.markEdited?.(String(id), [field]);
            }}
            // ===== slots =====
            showToolbar
            slots={{
              toolbar: CustomToolbar,
              noRowsOverlay: NoRowsOverlay,
              columnMenu: CustomColumnMenu,
            }}
            slotProps={{
              toolbar: {
                globalSearch,
                onGlobalSearchChange: setGlobalSearch,
                onExport: handleExport,
                columnFilters,
                onClearOneFilter: (field) => applyColumnFilter(field, ""),
                onResetAll: resetAllFilters,

                // ✅ 신규 자산 등록
                handleRegistForm,
                assetStatus,

                // ✅ 폐기(원본 기능 + 버튼 토글은 CustomToolbar에서 처리)
                disposeMode: assetStatus !== "N" && dispose.disposeMode,
                tgDisposeMode:
                  assetStatus !== "N" ? dispose.toggleDisposeMode : undefined,
                selectionModel: dispose.selectionModel,
                onDispose: dispose.onClickDisposeFinal,

                // ✅ 수정(추가)
                updateMode: assetStatus !== "N" && update.updateMode,
                editedUpdateCount: update.editedCount,
                onToggleUpdateMode: update.toggleUpdateMode,
                onSaveUpdates: update.onClickUpdateSave,
              },
              columnMenu: {
                openColumnFilterDialog,
                columnFilters,
                setColumnFilters,
              },
            }}
            localeText={DataGridText}
            sx={{
              border: 0,
              "& .MuiDataGrid-menuIcon": { marginLeft: "10px !important" },
              "& .MuiDataGrid-menuIconButton": {
                padding: "2px !important",
                marginLeft: "6px !important",
              },

              // 수정 모드 스타일
              "& .cell-disabled": {
                backgroundColor: "rgba(0,0,0,0.04)",
                color: "rgba(0,0,0,0.55)",
              },
              "& .cell-updated": {
                backgroundColor: "rgba(76, 107, 207, 0.15)",
              },
            }}
            onCellClick={(params, event) => {
              if (dispose.disposeMode || update.updateMode) return; // 수정/삭제 모드에서는 이력 조회 팝업 안뜸
              const assetId = String(
                params?.row?.assetId ??
                  params?.row?.asset_id ??
                  params?.id ??
                  ""
              );
              if (!assetId) return;

              setHisPopover({
                open: true,
                anchorEl: event.currentTarget,
                assetId,
              });
            }}
          />
        </Box>

        {/* "이 열에서 필터하기" Dialog */}
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

        {/* 폐기 확인/오류 Dialog */}
        {assetStatus !== "N" && (
          <>
            <Dialog
              open={dispose.confirmOpen}
              onClose={() => dispose.setConfirmOpen(false)}
            >
              <DialogTitle>폐기하시겠어요?</DialogTitle>
              <DialogContent>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  선택된 자산 {dispose.selectionModel.length}건을 폐기
                  처리합니다.
                </Typography>
              </DialogContent>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  p: 2,
                }}
              >
                <Typography
                  component="button"
                  style={{
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => dispose.setConfirmOpen(false)}
                >
                  취소
                </Typography>
                <Typography
                  component="button"
                  style={{
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={dispose.requestDispose}
                >
                  확인
                </Typography>
              </Box>
            </Dialog>

            <Dialog
              open={dispose.errorOpen}
              onClose={() => dispose.setErrorOpen(false)}
            >
              <DialogTitle>안내</DialogTitle>
              <DialogContent>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {dispose.errorMsg}
                </Typography>
              </DialogContent>
              <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
                <Typography
                  component="button"
                  style={{
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => dispose.setErrorOpen(false)}
                >
                  확인
                </Typography>
              </Box>
            </Dialog>
          </>
        )}

        {/* 수정 확인/오류 Dialog */}
        {assetStatus !== "N" && (
          <>
            <Dialog
              open={update.confirmOpen}
              onClose={() => update.setConfirmOpen(false)}
            >
              <DialogTitle>수정하시겠어요?</DialogTitle>
              <DialogContent>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  총 {update.editedCount}건의 자산 정보가 수정됩니다.
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
          </>
        )}

        {/* 신규 자산 등록: '엑셀 업로드' | '직접 작성' 선택창(Dialog) */}
        {assetStatus !== "N" && (
          <RegistEntryDialog
            open={registEntryOpen}
            onClose={closeEntry}
            onPickDirect={openDirectForm}
            onExcelPrefill={openExcelPrefilledForm}
          />
        )}

        {/* 신규 자산 등록 폼 (Dialog) */}
        {assetStatus !== "N" && (
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
              <Typography fontWeight={800}>신규 자산 등록</Typography>
              <IconButton
                onClick={handleCloseRegist}
                sx={{ position: "absolute", right: 12, top: 12 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 3 }}>
              <RegistFormDialog
                initialRows={registInitial} // 폼 초기값. 엑셀 업로드 시 해당 데이터로 대입 용도
                onClose={() => {
                  handleCloseRegist();
                  reloadRows(); // 등록 성공 후 목록 갱신
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* 변동 이력 조회 (Pop) */}
        <AssetHistoryPopover
          open={hisPopover.open}
          anchorEl={hisPopover.anchorEl}
          assetId={hisPopover.assetId}
          onClose={() =>
            setHisPopover({ open: false, anchorEl: null, assetId: "" })
          }
          onOpenHistory={(assetId) => {
            setHisAssetId(assetId);
            setHisDialogOpen(true);
            setHisPopover({ open: false, anchorEl: null, assetId: "" });
          }}
        />

        <AssetHistoryDialog
          open={hisDialogOpen}
          assetId={hisAssetId}
          onClose={() => setHisDialogOpen(false)}
        />
      </Paper>
    </LocalizationProvider>
  );
}
