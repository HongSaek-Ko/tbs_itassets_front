// rowId는 "폼 데이터 내부"에서만 쓰는 식별자
export const makeRowId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `rid_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const makeEmptyRow = () => ({
  rowId: makeRowId(),
  empId: "",
  empPos: "",
  teamName: "",
  empRegDt: null,
  _errors: {},
});

export const REQUIRED_LABEL = {
  empId: "사번",
  empName: "성명",
  empPos: "직위",
  teamName: "소속",
  empRegDt: null,
};

export function hasText(v) {
  return String(v ?? "").trim().length > 0;
}
