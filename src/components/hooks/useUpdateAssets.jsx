// src/pages/hooks/useUpdateAssets.js
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import { DatePicker } from "@mui/x-date-pickers";

import { fetchEmpList } from "../../api/empAPIS";
import { updateAssetBulk } from "../../api/assetAPIS";

// 수정 가능/불가 필드
const UPDATE_EDITABLE_FIELDS = new Set([
  "assetManufacturer",
  "assetManufacturedAt",
  "assetModelName",
  "assetSn",
  "empName",
  "assetLoc",
  "assetIssuanceDate",
  "assetDesc",
  "empPos",
  "teamName",
]);

const ALWAYS_READONLY_FIELDS = new Set([
  "assetId",
  "assetType",
  "empPos",
  "teamName",
]);

// 서버로 보낼 LocalDateTime 형태(일단 00:00:00 고정)
const toLocalDateTimeString = (v) => {
  if (!v) return null;
  if (dayjs.isDayjs(v)) return v.format("YYYY-MM-DDT00:00:00");

  const d = dayjs(v);
  if (d.isValid()) return d.format("YYYY-MM-DDT00:00:00");

  return String(v);
};

export function useUpdateAssets({ allRows, setAllRows, assetStatus, apiRef }) {
  const [updateMode, setUpdateMode] = useState(false);

  // 직원 목록
  const [empList, setEmpList] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);

  // 변경 추적
  const [editedCellsMap, setEditedCellsMap] = useState({}); // { [id]: string[] }
  const [draftRows, setDraftRows] = useState({}); // { [id]: row }

  // dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // disposed 화면이면 무조건 끄기
  useEffect(() => {
    if (assetStatus === "N" && updateMode) setUpdateMode(false);
  }, [assetStatus, updateMode]);

  // 수정모드 켜질 때 직원목록 로딩
  useEffect(() => {
    if (!updateMode) return;
    if (empList.length > 0) return;

    const load = async () => {
      setEmpLoading(true);
      try {
        const res = await fetchEmpList();
        const body = res.data?.data ?? res.data;
        setEmpList(Array.isArray(body) ? body : []);
      } catch (e) {
        console.error(e);
        setEmpList([]);
      } finally {
        setEmpLoading(false);
      }
    };
    load();
  }, [updateMode, empList.length]);

  const empNameToEmp = useMemo(() => {
    const m = new Map();
    empList.forEach((e) => m.set(String(e.empName), e));
    return m;
  }, [empList]);

  const editedCount = useMemo(() => Object.keys(draftRows).length, [draftRows]);

  const toggleUpdateMode = () => {
    // disposed면 막기
    if (assetStatus === "N") return;

    setUpdateMode((prev) => {
      const next = !prev;
      if (!next) {
        setEditedCellsMap({});
        setDraftRows({});
      }
      return next;
    });
  };

  const onClickUpdateSave = () => {
    if (!updateMode) return;
    if (!editedCount) {
      setErrorMsg("수정된 항목이 없습니다.");
      setErrorOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const isCellEditable = (params) => {
    if (!updateMode) return false;
    const field = params.field;
    if (ALWAYS_READONLY_FIELDS.has(field)) return false;
    return UPDATE_EDITABLE_FIELDS.has(field);
  };

  const markEdited = (id, fields) => {
    setEditedCellsMap((prev) => {
      const current = prev[id] || [];
      const merged = Array.from(new Set([...current, ...fields]));
      return { ...prev, [id]: merged };
    });
  };

  // DataGrid row update
  const processRowUpdate = (newRow, oldRow) => {
    if (!updateMode) return oldRow;

    const id = String(newRow.assetId ?? newRow.id ?? newRow.asset_id);

    const changed = [];
    for (const f of UPDATE_EDITABLE_FIELDS) {
      if (String(newRow?.[f] ?? "") !== String(oldRow?.[f] ?? "")) {
        changed.push(f);
      }
    }

    if (changed.length) {
      markEdited(id, changed);
      setDraftRows((prev) => ({ ...prev, [id]: newRow }));
    }

    return newRow;
  };

  const onProcessRowUpdateError = (error) => {
    console.error("update row error:", error);
    setErrorMsg("수정 편집 처리 중 오류가 발생했습니다.");
    setErrorOpen(true);
  };

  // columns patch: renderEditCell + cellClassName 주입
  const patchColumns = (cols) => {
    if (!updateMode) return cols;

    return cols.map((col) => {
      const f = col.field;

      // 수정 가능 여부: '수정 가능 필드'에 존재하는지 + '수정 불가 필드'에 존재하지 않는지.
      const editable =
        UPDATE_EDITABLE_FIELDS.has(f) && !ALWAYS_READONLY_FIELDS.has(f);

      const cellClassName = (params) => {
        const id = String(params.id);

        if (ALWAYS_READONLY_FIELDS.has(f)) return "cell-disabled";
        if (editedCellsMap[id]?.includes(f)) return "cell-updated";
        return "";
      };

      // empName: 드롭다운 + 직위/소속 자동완성
      if (f === "empName") {
        return {
          ...col,
          editable, // ✅ 반드시 박아주기
          cellClassName,
          renderEditCell: (params) => (
            <TextField
              select
              fullWidth
              size="small"
              value={params.value ?? ""}
              disabled={empLoading}
              onChange={(e) => {
                const nextName = e.target.value;
                const emp = empNameToEmp.get(String(nextName));

                // 1) empName은 edit cell value로
                params.api.setEditCellValue({
                  id: params.id,
                  field: "empName",
                  value: nextName,
                });

                // 2) empPos/teamName은 row 자체를 업데이트 (즉시 반영)
                if (emp) {
                  apiRef.current.updateRows([
                    {
                      id: params.id,
                      empPos: emp.empPos ?? "",
                      teamName: emp.teamName ?? "",
                    },
                  ]);

                  // 변경 추적도 같이 해두면 버튼이 바로 반응
                  // (훅에 markEdited export 해두었다는 가정)
                  // markEdited(String(params.id), ["empName", "empPos", "teamName"]);
                }
              }}
            >
              <MenuItem value="">선택</MenuItem>
              {empList.map((e) => (
                <MenuItem key={String(e.empId)} value={String(e.empName)}>
                  {e.empName}
                </MenuItem>
              ))}
            </TextField>
          ),
        };
      }

      // 날짜: DatePicker
      if (f === "assetManufacturedAt" || f === "assetIssuanceDate") {
        return {
          ...col,
          editable, // ✅ 반드시 박아주기
          cellClassName,
          renderEditCell: (params) => {
            const v = params.value ? dayjs(params.value) : null;
            return (
              <DatePicker
                value={v && v.isValid() ? v : null}
                onChange={(nv) => {
                  params.api.setEditCellValue({
                    id: params.id,
                    field: params.field,
                    value: nv,
                  });
                }}
                format="YYYY-MM-DD"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: {
                      "& .MuiInputBase-root": { height: 36 },
                      "& .MuiOutlinedInput-input": { padding: "8px 10px" },
                    },
                  },
                }}
              />
            );
          },
        };
      }

      // 나머지 컬럼들
      return {
        ...col,
        editable, // ✅ 여기서 전체 필드 editable 제어
        cellClassName,
      };
    });
  };

  // 수정 요청
  const requestUpdate = async () => {
    try {
      const payload = Object.entries(draftRows).map(([id, row]) => {
        const emp = empNameToEmp.get(String(row.empName));

        return {
          assetId: String(id),

          assetManufacturer: row.assetManufacturer ?? "",
          assetModelName: row.assetModelName ?? "",
          assetSn: row.assetSn ?? "",
          assetLoc: row.assetLoc ?? "",
          assetDesc: row.assetDesc ?? "",

          empId: emp?.empId ? String(emp.empId) : null,

          assetManufacturedAt: toLocalDateTimeString(row.assetManufacturedAt),
          assetIssuanceDate: toLocalDateTimeString(row.assetIssuanceDate),
        };
      });

      await updateAssetBulk(payload);

      // 성공 반영: allRows merge
      setAllRows((prev) =>
        prev.map((r) => {
          const rid = String(r.assetId ?? r.id ?? r.asset_id);
          const draft = draftRows[rid];
          if (!draft) return r;

          const emp = empNameToEmp.get(String(draft.empName));
          return {
            ...r,
            ...draft,
            ...(emp
              ? {
                  empPos: emp.empPos ?? r.empPos,
                  teamName: emp.teamName ?? r.teamName,
                }
              : {}),
          };
        })
      );

      setConfirmOpen(false);
      setUpdateMode(false);
      setEditedCellsMap({});
      setDraftRows({});
    } catch (e) {
      console.error(e);
      setConfirmOpen(false);
      setErrorMsg("자산 정보 수정 요청 중 오류가 발생했습니다.");
      setErrorOpen(true);
    }
  };

  return {
    // mode
    updateMode,
    toggleUpdateMode,

    // toolbar actions
    onClickUpdateSave,
    editedCount,

    // grid handlers
    isCellEditable,
    processRowUpdate,
    onProcessRowUpdateError,
    patchColumns,

    // dialogs
    confirmOpen,
    setConfirmOpen,
    requestUpdate,

    errorOpen,
    setErrorOpen,
    errorMsg,

    // for columns render
    empList,
    empLoading,
    editedCellsMap,

    markEdited,
  };
}
