// src/pages/hooks/useResignEmps.js
import { useState } from "react";
import { updateEmpStatusBulk } from "../../api/empAPIS";

export function useResignEmps({ allRows, setAllRows }) {
  const [resignMode, setResignMode] = useState(false);

  // DataGrid rowSelectionModel(오브젝트 형태) — 자산쪽과 동일 패턴
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: "include",
    ids: new Set(),
  });

  // toolbar 표시/유효성/전송용 배열
  const [selectionModel, setSelectionModel] = useState([]);

  // dialogs
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleResignMode = () => {
    setResignMode((prev) => {
      const next = !prev;
      if (!next) {
        setRowSelectionModel({ type: "include", ids: new Set() });
        setSelectionModel([]);
      }
      return next;
    });
  };

  const onRowSelectionChange = (model) => {
    setRowSelectionModel(model);
    const ids = Array.from(model?.ids ?? []).map((x) => String(x));
    setSelectionModel(ids);
  };

  const validateResign = () => {
    if (!resignMode) return { ok: false, msg: "퇴사 처리 모드가 아닙니다." };
    if (!selectionModel.length)
      return { ok: false, msg: "퇴사 처리할 직원을 선택하세요." };
    return { ok: true };
  };

  const onClickResignFinal = () => {
    const v = validateResign();
    if (!v.ok) {
      setErrorMsg(v.msg);
      setErrorOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const requestResign = async () => {
    try {
      const payload = selectionModel.map((id) => ({
        empId: String(id),
        empStatus: "퇴사",
      }));

      await updateEmpStatusBulk(payload);

      setAllRows((prev) =>
        prev.map((r) => {
          const rid = String(r.empId ?? r.id);
          if (!selectionModel.includes(rid)) return r;
          return { ...r, empStatus: "퇴사" };
        })
      );

      setConfirmOpen(false);
      setResignMode(false);
      setRowSelectionModel({ type: "include", ids: new Set() });
      setSelectionModel([]);
    } catch (e) {
      console.error("퇴사 처리 실패:", e);
      setConfirmOpen(false);
      setErrorMsg("퇴사 처리 요청 중 오류가 발생했습니다.");
      setErrorOpen(true);
    }
  };

  return {
    resignMode,
    toggleResignMode,

    rowSelectionModel,
    selectionModel,

    confirmOpen,
    setConfirmOpen,
    errorOpen,
    setErrorOpen,
    errorMsg,
    setErrorMsg,

    onRowSelectionChange,
    onClickResignFinal,
    requestResign,
  };
}
