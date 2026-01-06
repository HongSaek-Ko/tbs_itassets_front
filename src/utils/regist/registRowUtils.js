// rowId는 "폼 데이터 내부"에서만 쓰는 식별자
export const makeRowId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `rid_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const makeEmptyRow = () => ({
  rowId: makeRowId(),
  assetType: "",
  assetId: "",
  assetManufacturer: "",
  assetManufacturedAt: null,
  assetModelName: "",
  assetSn: "",
  empId: "",
  empPos: "",
  teamName: "",
  assetLoc: "",
  assetIssuanceDate: null,
  assetDesc: "",
  _errors: {},
});

export const REQUIRED_LABEL = {
  assetType: "종류",
  assetManufacturer: "제조사",
  assetManufacturedAt: "제조년월",
  assetModelName: "모델명",
  assetSn: "S/N",
  empId: "사번",
  assetLoc: "설치장소",
  assetIssuanceDate: "지급일",
  assetDesc: "비고",
};

export function hasText(v) {
  return String(v ?? "").trim().length > 0;
}

// key 정규화
const norm = (v) =>
  String(v ?? "")
    .trim()
    .toUpperCase();

// "E006" -> ["E006", "6"]
// "6"    -> ["6"]
export function empKeyVariants(v) {
  const s = norm(v);
  if (!s) return [];
  const keys = [s];

  const m = s.match(/^[A-Z]+0*(\d+)$/);
  if (m?.[1]) keys.push(String(parseInt(m[1], 10)));

  return Array.from(new Set(keys));
}

export function parseId(idStr) {
  const s = String(idStr ?? "").trim();
  const prefix = s.slice(0, 1);
  const num = parseInt(s.slice(1), 10);
  return { prefix, num: Number.isFinite(num) ? num : null };
}

export function formatId(prefix, num, width = 3) {
  return `${prefix}${String(num).padStart(width, "0")}`;
}
