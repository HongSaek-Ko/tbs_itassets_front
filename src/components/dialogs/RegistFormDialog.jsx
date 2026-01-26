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

import { fetchAssetSnList, createAsset } from "../../api/assetAPIS";

import RegistFormToolbar from "../regist/RegistFormToolbar";
import RegistFormGrid from "../regist/RegistFormGrid";

import { useEmployees } from "../hooks/regist/useEmployees";
import { useAssetIdAllocator } from "../hooks/regist/useAssetIdAllocator";
import { useHydrateAfterExcel } from "../hooks/regist/useHydrateAfterExcel";
import { useRegistColumns } from "../hooks/regist/useRegistColumns";

import {
  hasText,
  makeEmptyRow,
  makeRowId,
  REQUIRED_LABEL,
} from "../../utils/regist/registRowUtils";
import {
  emptySelectionModel,
  normalizeSelectionModel,
  selectionToArray,
} from "../../utils/regist/selectionModel";

import dayjs from "dayjs";

export default function RegistFormDialog({ onClose, initialRows }) {
  const { empList, empLoading, empMap } = useEmployees();
  const { allocate, release } = useAssetIdAllocator();

  // 선택모델(Set)로만 관리
  const [rowSelectionModel, setRowSelectionModel] = useState(() =>
    emptySelectionModel(),
  );
  const [selectedUiIds, setSelectedUiIds] = useState([]);

  const [bottomMsg, setBottomMsg] = useState("");
  const [assetIdLoadingRows, setAssetIdLoadingRows] = useState({}); // uiId -> bool

  const existingSnSetRef = useRef(new Set()); // DB 상 시리얼
  const normalizeSerial = (v) =>
    String(v ?? "")
      .trim()
      .toUpperCase(); // 정규화

  // 시리얼 번호 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAssetSnList();

        const list = res.data?.data ?? res.data ?? []; // ApiResponse라서 data.data일 수도 있으니 둘 다 커버
        const arr = Array.isArray(list) ? list : [];

        ("시리얼 번호:", arr);

        existingSnSetRef.current = new Set(
          arr.map(normalizeSerial).filter(Boolean),
        );
      } catch (e) {
        console.error(e);
        existingSnSetRef.current = new Set();
      }
    })();
  }, []);

  const rowSnMapRef = useRef(new Map()); // rowId -> normalizedSerial

  // 폼 내 중복체크
  const isDuplicateInForm = (next, currentRowId) => {
    for (const [rid, sn] of rowSnMapRef.current.entries()) {
      if (rid === currentRowId) continue;
      if (sn === next) return true;
    }
    return false;
  };

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: { rows: [makeEmptyRow()] },
    mode: "onSubmit",
  });

  // 시리얼번호 변경 감지
  const handleSerialChange = useCallback(
    (rowId, idx, raw) => {
      const rid = String(rowId);
      const next = normalizeSerial(raw);

      // 이전 값 제거
      rowSnMapRef.current.delete(rid);

      // 폼 값 업데이트
      setValue(`rows.${idx}.assetSn`, raw, { shouldDirty: true });

      // 빈 값이면 OK
      if (!next) {
        clearErrors(`rows.${idx}.assetSn`);
        return;
      }

      // DB 중복
      if (existingSnSetRef.current.has(next)) {
        setError(`rows.${idx}.assetSn`, {
          type: "manual",
          message: "이미 등록된 시리얼입니다.",
        });
        return;
      }

      // 현재 폼 내 중복
      if (isDuplicateInForm(next, rid)) {
        setError(`rows.${idx}.assetSn`, {
          type: "manual",
          message: "현재 입력 목록 내 중복 시리얼입니다.",
        });
        return;
      }

      // 통과
      rowSnMapRef.current.set(rid, next);
      clearErrors(`rows.${idx}.assetSn`);
    },
    [setValue, setError, clearErrors],
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
        assetManufacturedAt: r?.assetManufacturedAt ?? null,
        assetIssuanceDate: r?.assetIssuanceDate ?? null,
        _errors: r?._errors ?? {},
        empPos: r?.empPos ?? "",
        teamName: r?.teamName ?? "",
      };
    });

    replace(normalized);
    clearSelection();
    setBottomMsg("");
  }, [initialRows, replace, clearSelection]);

  // 엑셀 업로드 후 자동 채움
  const fieldKeys = useMemo(() => fields.map((f) => String(f.uiId)), [fields]);
  useHydrateAfterExcel({
    enabled: didInitRef.current,
    empList,
    empMap,
    fieldKeys,
    getValues,
    setValue,
    allocate,
    setAssetIdLoadingRows,
  });

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

    // uiId -> index(__idx) (fields 직접 참조보다 안전)
    const idxs = selectedUiIds
      .map(
        (uiId) => gridRows.find((r) => String(r.uiId) === String(uiId))?.__idx,
      )
      .filter((i) => Number.isInteger(i))
      .sort((a, b) => b - a);

    // 예약 품번 반납
    idxs.forEach((i) => {
      const r = rows[i];
      if (hasText(r?.assetType) && hasText(r?.assetId)) {
        release(r.assetType, r.assetId);
      }
    });

    // 시리얼 번호 삭제
    idxs.forEach((i) => {
      const r = rows[i];
      if (r?.rowId) rowSnMapRef.current.delete(String(r.rowId));
    });

    // 실제 삭제: 배열로 한 번에 제거
    remove(idxs);

    setBottomMsg("");
    clearSelection();
  }, [selectedUiIds, getValues, gridRows, release, remove, clearSelection]);

  // 직원 선택 변경
  const handleEmpChange = useCallback(
    (idx, newEmpId) => {
      setBottomMsg("");
      clearErrors(`rows.${idx}.empId`);

      const empIdStr = String(newEmpId || "");
      const emp = empMap.get(empIdStr);

      setValue(`rows.${idx}.empId`, empIdStr, { shouldDirty: true });
      setValue(`rows.${idx}.empPos`, emp?.empPos ?? "", { shouldDirty: true });
      setValue(`rows.${idx}.teamName`, emp?.teamName ?? "", {
        shouldDirty: true,
      });
    },
    [empMap, setValue, clearErrors],
  );

  // 종류 변경: 품번 자동 생성
  const handleAssetTypeChange = useCallback(
    async (uiId, idx, newType) => {
      setBottomMsg("");
      clearErrors(`rows.${idx}.assetType`);

      const prevType = getValues(`rows.${idx}.assetType`);
      const prevId = getValues(`rows.${idx}.assetId`);

      if (
        hasText(prevType) &&
        hasText(prevId) &&
        String(prevType) !== String(newType)
      ) {
        release(prevType, prevId);
        setValue(`rows.${idx}.assetId`, "", { shouldDirty: true });
      }

      setValue(`rows.${idx}.assetType`, newType, { shouldDirty: true });

      if (!hasText(newType)) {
        setValue(`rows.${idx}.assetId`, "", { shouldDirty: true });
        return;
      }

      const currentId = getValues(`rows.${idx}.assetId`);
      if (hasText(currentId)) return;

      setAssetIdLoadingRows((p) => ({ ...p, [uiId]: true }));
      try {
        const nextId = await allocate(newType);
        setValue(`rows.${idx}.assetId`, String(nextId || ""), {
          shouldDirty: true,
        });
      } catch (e) {
        console.error(e);
        setBottomMsg("품번 생성 중 오류가 발생했습니다.");
        setValue(`rows.${idx}.assetId`, "", { shouldDirty: true });
      } finally {
        setAssetIdLoadingRows((p) => ({ ...p, [uiId]: false }));
      }
    },
    [allocate, release, clearErrors, getValues, setValue],
  );

  const validateRows = useCallback(
    (rows) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] || {};

        const errs = r._errors || {};
        if (Object.keys(errs).length) {
          setBottomMsg(`${i + 1}행: 엑셀 형식 오류가 있습니다.`);
          return false;
        }

        for (const [k, label] of Object.entries(REQUIRED_LABEL)) {
          const v = r[k];
          const ok =
            k === "assetManufacturedAt" || k === "assetIssuanceDate"
              ? v != null
              : hasText(v);

          if (!ok) {
            setError(`rows.${i}.${k}`, {
              type: "manual",
              message: `${label} 필수`,
            });
            setBottomMsg(`${i + 1}행: ${label}를 입력하세요.`);
            return false;
          }
        }
      }
      return true;
    },
    [setError],
  );

  const ensureAssetIds = useCallback(
    async (rows) => {
      for (let i = 0; i < rows.length; i++) {
        const type = rows[i]?.assetType;
        const id = rows[i]?.assetId;

        if (hasText(id)) continue;

        if (!hasText(type)) {
          setError(`rows.${i}.assetType`, {
            type: "manual",
            message: "종류를 선택하세요.",
          });
          setBottomMsg(`${i + 1}행: 종류를 선택하세요.`);
          return false;
        }

        try {
          const newId = await allocate(type);
          if (!hasText(newId)) {
            setError(`rows.${i}.assetType`, {
              type: "manual",
              message: "품번 생성 실패",
            });
            setBottomMsg(`${i + 1}행: 품번 생성에 실패했습니다.`);
            return false;
          }
          rows[i].assetId = String(newId);
          setValue(`rows.${i}.assetId`, String(newId), { shouldDirty: true });
        } catch (e) {
          console.error(e);
          setError(`rows.${i}.assetType`, {
            type: "manual",
            message: "품번 생성 오류",
          });
          setBottomMsg(`${i + 1}행: 품번 생성 중 오류가 발생했습니다.`);
          return false;
        }
      }
      return true;
    },
    [allocate, setError, setValue],
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

      const ok = await ensureAssetIds(rows);
      if (!ok) return;

      const payloads = rows.map((r) => ({
        assetId: String(r.assetId),
        assetType: String(r.assetType).trim(),
        assetManufacturer: String(r.assetManufacturer).trim(),
        assetManufacturedAt: dayjs(r.assetManufacturedAt).format("YYYY-MM-DD"),
        assetModelName: String(r.assetModelName).trim(),
        assetSn: String(r.assetSn).trim(),
        empId: String(r.empId),
        assetLoc: String(r.assetLoc).trim(),
        assetIssuanceDate: dayjs(r.assetIssuanceDate).format("YYYY-MM-DD"),
        assetDesc: String(r.assetDesc).trim(),
      }));

      const res = await createAsset(payloads);
      if (res.data.success == true) {
        onClose?.();
        window.location.reload();
      } else {
        res;
        setBottomMsg("자산 등록에 실패했습니다. 입력한 데이터를 확인해주세요.");
      }
    },
    [ensureAssetIds, onClose, validateRows],
  );

  const columns = useRegistColumns({
    control,
    empLoading,
    empList,
    assetIdLoadingRows,
    handleEmpChange,
    handleAssetTypeChange,
    handleSerialChange,
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
