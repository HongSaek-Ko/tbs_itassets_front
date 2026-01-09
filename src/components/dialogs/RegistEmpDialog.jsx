// regist/RegistFormDialog.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Divider, Typography } from "@mui/material";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";

import { fetchEmpIds, createEmp } from "../../api/empAPIS";

import RegistFormToolbar from "../regist/RegistFormToolbar";
import RegistFormGrid from "../regist/RegistFormGrid";
import { useEmpRegColumns } from "../hooks/regist/useEmpRegColumns";

import {
  hasText,
  makeEmptyRow,
  makeRowId,
  REQUIRED_LABEL,
} from "../../utils/regist/registEmpRow";
import {
  emptySelectionModel,
  normalizeSelectionModel,
  selectionToArray,
} from "../../utils/regist/selectionModel";

import dayjs from "dayjs";

export default function RegistFormDialog({ onClose, initialRows }) {
  // 선택모델(Set)로만 관리
  const [rowSelectionModel, setRowSelectionModel] = useState(() =>
    emptySelectionModel()
  );
  const [selectedUiIds, setSelectedUiIds] = useState([]);

  const [bottomMsg, setBottomMsg] = useState("");

  const {
    control,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: { rows: [makeEmptyRow()] },
    mode: "onSubmit",
  });

  /* 사번 목록 상태값 + 불러오기 */
  const [serverEmpIds, setServerEmpIds] = useState(() => new Set());
  const serverEmpIdsRef = useRef(serverEmpIds);
  useEffect(() => {
    serverEmpIdsRef.current = serverEmpIds;
  }, [serverEmpIds]);

  // 폼 내부 사번 set
  const formEmpIdsRef = useRef(new Set());

  // 서버 사번 목록 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchEmpIds();
        const body = res?.data?.data ?? res?.data ?? [];
        const arr = Array.isArray(body) ? body : [];
        setServerEmpIds(
          new Set(arr.map((v) => String(v).trim()).filter(Boolean))
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const normId = (v) => String(v ?? "").trim();

  // 전체 rows 기준으로 formEmpIds 다시 계산 (드리프트 방지용)
  const rebuildFormEmpIds = useCallback(() => {
    const rows = getValues("rows") || [];
    const s = new Set();
    rows.forEach((r) => {
      const id = normId(r?.empId);
      if (id) s.add(id);
    });
    formEmpIdsRef.current = s;
  }, [getValues]);

  // 특정 행의 empId가 바뀔 때 호출
  const onEmpIdChanged = useCallback(
    ({ rowIndex, prevEmpId, nextEmpId }) => {
      const prev = normId(prevEmpId);
      const next = normId(nextEmpId);

      // 이전 값 제거
      if (prev) formEmpIdsRef.current.delete(prev);

      // 빈 값이면 에러만 지우고 종료
      if (!next) {
        clearErrors?.(`rows.${rowIndex}.empId`);
        return true;
      }

      // 1) 서버 중복
      if (serverEmpIdsRef.current.has(next)) {
        setError(`rows.${rowIndex}.empId`, {
          type: "manual",
          message: "이미 등록된 사번입니다.",
        });
        return false;
      }

      // 2) 폼 내부 중복
      if (formEmpIdsRef.current.has(next)) {
        setError(`rows.${rowIndex}.empId`, {
          type: "manual",
          message: "같은 폼에 동일 사번이 있습니다.",
        });
        return false;
      }

      // 통과 → 등록
      formEmpIdsRef.current.add(next);
      clearErrors?.(`rows.${rowIndex}.empId`);
      return true;
    },
    [setError, clearErrors]
  );

  // DataGrid id는 useFieldArray가 보장하는 keyName만 사용
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "rows",
    keyName: "uiId",
  });

  const watchedRows = useWatch({ control, name: "rows" }) || [];

  // DataGrid rows: fields(고유키) + watchedRows(값) 결합
  const gridRows = useMemo(() => {
    return fields.map((f, idx) => {
      const v = watchedRows[idx] || {};
      const rowId = v.rowId ?? f.rowId ?? makeRowId();

      return {
        ...f,
        ...v,
        rowId: String(rowId),
        uiId: String(f.uiId),
        __idx: idx,
      };
    });
  }, [fields, watchedRows]);

  const clearSelection = useCallback(() => {
    setRowSelectionModel(emptySelectionModel());
    setSelectedUiIds([]);
  }, []);

  // initialRows 주입: 딱 1번만
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!initialRows) return;
    if (didInitRef.current) return;
    didInitRef.current = true;

    const safe =
      Array.isArray(initialRows) && initialRows.length
        ? initialRows
        : [makeEmptyRow()];

    const normalized = safe.map((r) => {
      const base = makeEmptyRow();
      return {
        ...base,
        ...r,
        rowId: hasText(r?.rowId) ? String(r.rowId) : base.rowId,
        empRegDt: r?.empRegDt ?? null,
        _errors: r?._errors ?? {},
        empPos: r?.empPos ?? "",
        teamName: r?.teamName ?? "",
      };
    });

    replace(normalized);
    // replace 직후 목록 재구축
    queueMicrotask(() => rebuildFormEmpIds());

    clearSelection();
    setBottomMsg("");
  }, [initialRows, replace, clearSelection]);

  // 행 추가 (deps에 append 반드시 포함)
  const addRow = useCallback(() => {
    clearSelection();
    append(makeEmptyRow());
    setBottomMsg("");
  }, [append, clearSelection]);

  // 행 삭제: "gridRows를 기준으로 uiId -> __idx"로 변환해서 remove
  const removeSelected = useCallback(() => {
    if (!selectedUiIds.length) {
      setBottomMsg("제거할 행을 선택하세요.");
      return;
    }

    const rows = getValues("rows") || [];

    // uiId -> index(__idx)
    const idxs = selectedUiIds
      .map(
        (uiId) => gridRows.find((r) => String(r.uiId) === String(uiId))?.__idx
      )
      .filter((i) => Number.isInteger(i))
      .sort((a, b) => b - a);

    // 삭제될 행의 사번을 set에서 제거
    idxs.forEach((i) => {
      const empId = normId(rows?.[i]?.empId);
      if (empId) formEmpIdsRef.current.delete(empId);
    });

    // 실제 삭제: 배열로 한 번에 제거
    remove(idxs);

    setBottomMsg("");
    clearSelection();
  }, [selectedUiIds, getValues, gridRows, remove, clearSelection]);

  const validateRows = useCallback(
    (rows) => {
      const local = new Set();

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] || {};

        const errs = r._errors || {};
        if (Object.keys(errs).length) {
          setBottomMsg(`${i + 1}행: 엑셀 형식 오류가 있습니다.`);
          return false;
        }

        for (const [k, label] of Object.entries(REQUIRED_LABEL)) {
          const v = r[k];
          const ok = k === "empRegDt" ? v != null : hasText(v);

          if (!ok) {
            setError(`rows.${i}.${k}`, {
              type: "manual",
              message: `${label} 필수`,
            });
            setBottomMsg(`${i + 1}행: ${label}를 입력하세요.`);
            return false;
          }
        }
        const empId = normId(r.empId);
        if (empId) {
          if (serverEmpIdsRef.current.has(empId)) {
            setError(`rows.${i}.empId`, {
              type: "manual",
              message: "이미 등록된 사번입니다.",
            });
            setBottomMsg(`${i + 1}행: 사번이 이미 존재합니다.`);
            return false;
          }
          if (local.has(empId)) {
            setError(`rows.${i}.empId`, {
              type: "manual",
              message: "같은 폼에 중복 사번이 있습니다.",
            });
            setBottomMsg(`${i + 1}행: 사번이 중복됩니다.`);
            return false;
          }
          local.add(empId);
        }
      }
      return true;
    },
    [setError]
  );

  const onSubmit = useCallback(
    async (values) => {
      setBottomMsg("");

      const rows = (values?.rows || []).map((r) => ({ ...r }));
      if (!rows.length) {
        setBottomMsg("등록할 행이 없습니다.");
        return;
      }

      if (!validateRows(rows)) return;

      const payloads = rows.map((r) => ({
        empId: String(r.empId),
        empName: String(r.empName),
        empPos: String(r.empPos),
        teamName: String(r.teamName),
        empRegDt: dayjs(r.empRegDt).format("YYYY-MM-DD"),
      }));

      try {
        await createEmp(payloads);
        onClose?.();
        window.location.reload();
      } catch (e) {
        console.error(e);
        setBottomMsg("직원 등록에 실패했습니다.");
      }
    },
    [onClose, validateRows]
  );

  const columns = useEmpRegColumns({
    control,
    onEmpIdChanged,
  });

  const handleSelectionChange = useCallback((model) => {
    const normalized = normalizeSelectionModel(model);
    setRowSelectionModel(normalized);
    setSelectedUiIds(selectionToArray(normalized));
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%" }}>
        <RegistFormToolbar
          onAddRow={addRow}
          onRemoveSelected={removeSelected}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />

        <RegistFormGrid
          rows={gridRows}
          columns={columns}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={handleSelectionChange}
        />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography
            variant="body2"
            color={bottomMsg ? "error" : "text.secondary"}
          >
            {bottomMsg || "행을 추가하여 여러 건을 한 번에 등록할 수 있습니다."}
          </Typography>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
