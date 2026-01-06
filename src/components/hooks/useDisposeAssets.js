import { useState } from "react";
import { fetchDisposeAssets } from "../../api/assetAPIS";

export function useDisposeAssets({ allRows, setAllRows }) {
  const [disposeMode, setDisposeMode] = useState(false);

  // DataGrid rowSelectionModel(오브젝트 형태) — size 에러 방지
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: "include",
    ids: new Set(),
  });

  // toolbar 표시/유효성/전송용 배열
  const [selectionModel, setSelectionModel] = useState([]);

  // 비고 편집값(선택 행만 편집되더라도, 전송은 여기 값 우선)
  const [editedDesc, setEditedDesc] = useState({}); // { [assetId]: "비고" }

  // “마지막 선택 행” → 자동 이동/편집 UX에 필요
  const [lastSelectedId, setLastSelectedId] = useState(null);

  // dialogs
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleDisposeMode = () => {
    setDisposeMode((prev) => {
      const next = !prev;
      if (!next) {
        setRowSelectionModel({ type: "include", ids: new Set() });
        setSelectionModel([]);
        setEditedDesc({});
        setLastSelectedId(null);
      }
      return next;
    });
  };

  const onRowSelectionChange = (model) => {
    setRowSelectionModel(model);

    const ids = Array.from(model?.ids ?? []).map((x) => String(x));
    setSelectionModel(ids);

    // 마지막 선택(혹은 마지막 남은 선택) 행 기록 → 자동 비고 편집 UX
    setLastSelectedId(ids.length ? ids[ids.length - 1] : null);
  };

  const getDescFor = (assetId) => {
    const id = String(assetId);
    if (editedDesc[id] != null) return editedDesc[id];

    const row = allRows.find(
      (r) => String(r.assetId ?? r.id ?? r.asset_id) === id
    );
    return row?.assetDesc ?? "";
  };

  const validateDispose = () => {
    if (!disposeMode) return { ok: false, msg: "폐기 모드가 아닙니다." };
    if (!selectionModel.length)
      return { ok: false, msg: "폐기할 자산을 선택하세요." };

    for (const id of selectionModel) {
      const desc = String(getDescFor(id)).trim();
      if (!desc) return { ok: false, msg: "비고란을 입력하세요." };
      if (!desc.includes("폐기"))
        return { ok: false, msg: "비고란에 '폐기' 문구를 포함해 입력하세요." };
    }
    return { ok: true };
  };

  const onClickDisposeFinal = () => {
    const v = validateDispose();
    if (!v.ok) {
      setErrorMsg(v.msg);
      setErrorOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const requestDispose = async () => {
    try {
      const payload = selectionModel.map((id) => ({
        assetId: String(id),
        assetDesc: String(getDescFor(id)).trim(),
      }));

      await fetchDisposeAssets(payload);

      // ✅ 성공 반영: assetStatus='N', assetDesc 갱신
      setAllRows((prev) =>
        prev.map((r) => {
          const rid = String(r.assetId ?? r.id ?? r.asset_id);
          if (!selectionModel.includes(rid)) return r;
          return {
            ...r,
            assetStatus: "N",
            assetDesc: String(getDescFor(rid)).trim(),
          };
        })
      );

      // 종료/초기화
      setConfirmOpen(false);
      setDisposeMode(false);
      setRowSelectionModel({ type: "include", ids: new Set() });
      setSelectionModel([]);
      setEditedDesc({});
      setLastSelectedId(null);
      window.location.reload(); // 새로고침
    } catch (e) {
      console.error("자산 폐기 실패:", e);
      setConfirmOpen(false);
      setErrorMsg("자산 폐기 요청 중 오류가 발생했습니다.");
      setErrorOpen(true);
    }
  };

  // ✅ 비고 편집 반영(선택된 행만 editable이지만, 방어적으로 한번 더)
  const processRowUpdate = (newRow, oldRow) => {
    if (!disposeMode) return oldRow;

    const id = String(newRow.assetId ?? newRow.id ?? newRow.asset_id);

    // 선택된 행만 반영
    if (!selectionModel.includes(id)) return oldRow;

    if (newRow.assetDesc !== oldRow.assetDesc) {
      setEditedDesc((prev) => ({
        ...prev,
        [id]: newRow.assetDesc ?? "",
      }));
    }
    return newRow;
  };

  const onProcessRowUpdateError = (error) => {
    console.error("row update error:", error);
    setErrorMsg("비고 편집 처리 중 오류가 발생했습니다.");
    setErrorOpen(true);
  };

  return {
    disposeMode,
    toggleDisposeMode,

    rowSelectionModel,
    setRowSelectionModel,
    selectionModel,
    lastSelectedId,

    editedDesc,
    setEditedDesc,

    confirmOpen,
    setConfirmOpen,
    errorOpen,
    setErrorOpen,
    errorMsg,
    setErrorMsg,

    onRowSelectionChange,
    processRowUpdate,
    onProcessRowUpdateError,

    onClickDisposeFinal,
    requestDispose,
  };
}
