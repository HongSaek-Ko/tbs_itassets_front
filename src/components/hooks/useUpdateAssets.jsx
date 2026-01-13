// src/pages/hooks/useUpdateAssets.js
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import { DatePicker } from "@mui/x-date-pickers";

import { fetchEmpList } from "../../api/empAPIS";
import { fetchAssetSnList, updateAssetBulk } from "../../api/assetAPIS";

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

const hasText = (v) => String(v ?? "").trim().length > 0;

// 시리얼 정규화
const normalizeSerial = (v) =>
  String(v ?? "")
    .trim()
    .toUpperCase();

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

  // 시리얼 번호 목록(서버)
  const [snList, setSnList] = useState([]);
  const [snLoading, setSnLoading] = useState(false);

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

  // 수정모드 켜질 때 시리얼 번호 로딩
  useEffect(() => {
    if (!updateMode) return;
    if (snList.length > 0) return;
    const load = async () => {
      setSnLoading(true); // 로딩 완료
      try {
        const res = await fetchAssetSnList();
        const body = res.data?.data ?? res.data; // ApiResponse 대응
        setSnList(body);
      } catch (e) {
        console.error(e);
        setSnList([]);
      } finally {
        setSnLoading(false);
      }
    };
    load();
  }, [updateMode, snList.length]);

  const empNameToEmp = useMemo(() => {
    const m = new Map();
    empList.forEach((e) => m.set(String(e.empName), e));
    return m;
  }, [empList]);

  const editedCount = useMemo(() => Object.keys(draftRows).length, [draftRows]);

  // 시리얼 번호 Set (서버)
  const serverSnSet = useMemo(() => {
    const s = new Set();
    snList.forEach((e) => {
      const ns = normalizeSerial(e);
      if (ns) s.add(ns);
    });
    return s;
  }, [snList]);

  // 원본 기준 assetId -> assetSn
  const ogSnById = useMemo(() => {
    const m = new Map();
    allRows.forEach((e) => {
      const id = String(e.assetId ?? e.asset_id ?? "");
      if (!id) return;
      m.set(id, normalizeSerial(e.assetSn));
    });
    return m;
  }, [allRows]);

  const toggleUpdateMode = () => {
    // disposed면 막기
    if (assetStatus === "N") return;

    setUpdateMode((prev) => {
      const next = !prev;
      if (!next) {
        setEditedCellsMap({});
        setDraftRows({});
        setConfirmOpen(false);
      }
      return next;
    });
  };

  // 저장 전 유효성검사 (빈칸, SN(중복), 성명)
  const validateBeforeSave = useCallback(() => {
    const entries = Object.entries(draftRows);

    // 수정사항 없으면 막음
    if (!entries.length) {
      setErrorMsg("수정된 항목이 없습니다.");
      setErrorOpen(true);
      return false;
    }

    // 시리얼번호 로딩 전 막음
    if (snLoading) {
      setErrorMsg("잠시 후 다시 시도하세요.");
      setErrorOpen(true);
      return false;
    }

    // 빈칸 막음
    const REQUIRED_LABEL = {
      assetManufacturer: "제조사",
      assetModelName: "모델명",
      assetSn: "시리얼번호",
      empName: "소유자",
      assetLoc: "설치 장소",
      assetManufacturedAt: "제조년월",
      assetIssuanceDate: "지급일",
      assetDesc: "비고",
    };

    for (const [id, row] of entries) {
      const r = row ?? {};

      // empName 억지로 임의로 입력했으면 막음
      if (hasText(r.empName) && !empNameToEmp.has(String(r.empName))) {
        setErrorMsg(`자산(${id}) 소유자가 직원 목록에 없습니다.`);
        setErrorOpen(true);
        return false;
      }

      for (const [k, label] of Object.entries(REQUIRED_LABEL)) {
        const v = r[k];

        const ok =
          k === "assetManufacturedAt" || k === "assetIssuanceDate"
            ? v != null && dayjs(v).isValid()
            : hasText(v);

        if (!ok) {
          setErrorMsg(`자산(${id}) ${label}를 입력하세요.`);
          setErrorOpen(true);
          return false;
        }
      }
    }

    // 2) 수정 대상끼리(폼 내부) 시리얼 중복 체크
    const seen = new Map(); // sn -> firstAssetId
    for (const [id, row] of entries) {
      const sn = normalizeSerial(row?.assetSn);
      if (!sn) continue;

      if (seen.has(sn)) {
        const firstId = seen.get(sn);
        setErrorMsg(`시리얼번호 중복: ${sn} (자산 ${firstId}, ${id})`);
        setErrorOpen(true);
        return false;
      }
      seen.set(sn, id);
    }

    // 3) DB(서버 목록)와 시리얼 중복 체크
    for (const [id, row] of entries) {
      const nextSn = normalizeSerial(row?.assetSn);
      if (!nextSn) continue;

      const originalSn = ogSnById.get(String(id)) || "";
      // 자기 자신이 원래 갖고 있던 SN을 그대로 유지하는 건 (즉, 변경 없으면) 허용
      if (nextSn === originalSn) continue;

      // 서버 SN에 존재하면 막음
      if (serverSnSet.has(nextSn)) {
        setErrorMsg(`이미 사용중인 시리얼번호입니다: ${nextSn} (자산 ${id})`);
        setErrorOpen(true);
        return false;
      }
    }

    return true;
  }, [draftRows, snLoading, empNameToEmp, ogSnById, serverSnSet]);

  // 수정처리
  const onClickUpdateSave = () => {
    if (!updateMode) return;

    // 검증 통과해야 처리 확인
    if (!validateBeforeSave()) return;

    // if (!editedCount) {
    //   setErrorMsg("수정된 항목이 없습니다.");
    //   setErrorOpen(true);
    //   return;
    // }
    setConfirmOpen(true);
  };

  // 셀 수정 가능 상태
  const isCellEditable = (params) => {
    if (!updateMode) return false;
    const field = params.field;
    if (ALWAYS_READONLY_FIELDS.has(field)) return false;
    return UPDATE_EDITABLE_FIELDS.has(field);
  };

  // 수정 시 강조표시
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

  // 수정 처리 중 오류 발생 시 안내
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
          editable, // 반드시 박아주기
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
          editable, // 반드시 박아주기
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
        editable, // 여기서 전체 필드 editable 제어
        cellClassName,
      };
    });
  };

  // 수정 요청
  const requestUpdate = async () => {
    // confirm 이후 데이터 추가 변경 시 재검증 추가
    if (!validateBeforeSave()) {
      setConfirmOpen(false);
      return;
    }
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
