// src/pages/hooks/useUpdateEmps.js
import { useEffect, useMemo, useState } from "react";
import {
  fetchEmpPosList,
  fetchTeamNameList,
  updateEmpBulk,
} from "../../api/empAPIS";
import { MenuItem, TextField } from "@mui/material";

const UPDATE_EDITABLE_FIELDS = new Set([
  "empName",
  "empPos",
  "teamName",
  "empStatus",
]);

const ALWAYS_READONLY_FIELDS = new Set(["empId"]);

export function useUpdateEmps({ allRows, setAllRows, apiref }) {
  // const empPos = ["대표이사", "이사", "상무", "팀장", "책임", "선임", "사원"];
  const [empPos, setEmpPos] = useState([]);
  const [teamNames, setTeamNames] = useState([]);
  const [updateMode, setUpdateMode] = useState(false);

  const [editedCellsMap, setEditedCellsMap] = useState({}); // { [id]: string[] }
  const [draftRows, setDraftRows] = useState({}); // { [id]: row }

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const editedCount = useMemo(() => Object.keys(draftRows).length, [draftRows]);

  useEffect(() => {
    if (!updateMode) return;
    if (teamNames.length > 0 && empPos.length > 0) return;

    const load = async () => {
      try {
        const teamRes = await fetchTeamNameList();
        const posRes = await fetchEmpPosList();

        const teams = teamRes.data?.data ?? teamRes.data ?? [];
        const poses = posRes.data?.data ?? posRes.data ?? [];

        setTeamNames(Array.isArray(teams) ? teams : []);
        setEmpPos(Array.isArray(poses) ? poses : []);
      } catch (e) {
        console.error(e);
        setTeamNames([]);
        setEmpPos([]);
      }
    };

    load();
  }, [updateMode, teamNames.length, empPos.length]);

  const toggleUpdateMode = () => {
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
    const f = params.field;
    if (ALWAYS_READONLY_FIELDS.has(f)) return false;
    return UPDATE_EDITABLE_FIELDS.has(f);
  };

  const markEdited = (id, fields) => {
    setEditedCellsMap((prev) => {
      const current = prev[id] || [];
      const merged = Array.from(new Set([...current, ...fields]));
      return { ...prev, [id]: merged };
    });
  };

  const processRowUpdate = (newRow, oldRow) => {
    if (!updateMode) return oldRow;

    const id = String(newRow.empId ?? newRow.id);

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

  const patchColumns = (cols) => {
    if (!updateMode) return cols;

    return cols.map((col) => {
      const f = col.field;
      const editable =
        UPDATE_EDITABLE_FIELDS.has(f) && !ALWAYS_READONLY_FIELDS.has(f);

      const cellClassName = (params) => {
        const id = String(params.id);
        if (ALWAYS_READONLY_FIELDS.has(f)) return "cell-disabled";
        if (editedCellsMap[id]?.includes(f)) return "cell-updated";
        return "";
      };

      if (f === "teamName") {
        return {
          ...col,
          editable,
          cellClassName,
          renderEditCell: (params) => (
            <>
              {teamNames.length > 0 && (
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={params.value ?? ""}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    params.api.setEditCellValue({
                      id: params.id,
                      field: "teamName",
                      value: nextName,
                    });
                  }}
                >
                  <MenuItem value="">선택</MenuItem>
                  {teamNames.map((e, i) => (
                    <MenuItem key={i} value={String(e)}>
                      {e}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </>
          ),
        };
      }
      if (f === "empPos") {
        return {
          ...col,
          editable,
          cellClassName,
          renderEditCell: (params) => (
            <>
              {empPos.length > 0 && (
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={params.value ?? ""}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    params.api.setEditCellValue({
                      id: params.id,
                      field: "empPos",
                      value: nextName,
                    });
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
            </>
          ),
        };
      }
      return {
        ...col,
        editable,
        cellClassName,
      };
    });
  };

  const requestUpdate = async () => {
    try {
      const payload = Object.entries(draftRows).map(([id, row]) => ({
        empId: String(id),
        empName: row.empName ?? "",
        empPos: row.empPos ?? "",
        teamName: row.teamName ?? "",
        empStatus: row.empStatus ?? "",
      }));

      await updateEmpBulk(payload);

      // 성공 반영
      setAllRows((prev) =>
        prev.map((r) => {
          const rid = String(r.empId ?? r.id);
          const draft = draftRows[rid];
          return draft ? { ...r, ...draft } : r;
        }),
      );

      setConfirmOpen(false);
      setUpdateMode(false);
      setEditedCellsMap({});
      setDraftRows({});
    } catch (e) {
      console.error(e);
      setConfirmOpen(false);
      setErrorMsg("직원 정보 수정 요청 중 오류가 발생했습니다.");
      setErrorOpen(true);
    }
  };

  return {
    updateMode,
    toggleUpdateMode,
    onClickUpdateSave,
    editedCount,

    isCellEditable,
    processRowUpdate,
    onProcessRowUpdateError,
    patchColumns,

    confirmOpen,
    setConfirmOpen,
    requestUpdate,

    errorOpen,
    setErrorOpen,
    errorMsg,

    teamNames,
    empPos,

    editedCellsMap,
    markEdited,
  };
}
