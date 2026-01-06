import * as XLSX from "xlsx";
import dayjs from "dayjs";

/**
 * readExcelToObjects(arrayBuffer) => [{...}, ...]
 * - 첫 시트 기준
 * - 헤더 row를 key로 사용
 */
export function readExcelToObjects(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) return [];

  const ws = wb.Sheets[sheetName];

  // defval: "" 로 빈셀도 키 유지
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return Array.isArray(rows) ? rows : [];
}

/**
 * normalizeExcelDate(value)
 * - XLSX는 날짜가 serial number로 들어오거나, string으로 들어오거나, Date로 들어올 수 있음
 * - 성공하면 dayjs객체 반환, 실패하면 null
 */
export function normalizeExcelDate(value) {
  if (value == null || String(value).trim() === "") return null;

  // Date 객체
  if (value instanceof Date && !isNaN(value.getTime())) {
    const d = dayjs(value);
    return d.isValid() ? d : null;
  }

  // XLSX date serial number
  if (typeof value === "number") {
    // Excel serial -> JS Date
    // XLSX.SSF.parse_date_code를 쓸 수도 있지만 여기선 단순 변환
    // Excel 기준 1899-12-30
    const jsDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    const d = dayjs(jsDate);
    return d.isValid() ? d : null;
  }

  // 문자열
  const s = String(value).trim();

  // 흔한 포맷들 순차 시도
  const candidates = [
    "YYYY-MM-DD",
    "YYYY/MM/DD",
    "YYYY.MM.DD",
    "YYYY-MM",
    "YYYY/MM",
    "YYYY.MM",
    "YYYYMMDD",
  ];

  for (const f of candidates) {
    const d = dayjs(s, f, true);
    if (d.isValid()) {
      // YYYY-MM만 들어온 경우, 일자는 01로 맞춰도 됨(원하면 오늘로)
      if (f === "YYYY-MM" || f === "YYYY/MM" || f === "YYYY.MM") {
        return d.date(1);
      }
      return d;
    }
  }

  // 마지막: 느슨 파싱
  const loose = dayjs(s);
  if (loose.isValid()) return loose;

  return null;
}

/**
 * excelRowToRegistInitial(excelRow, empIdSet)
 * - 엑셀에서 자산 등록 Grid로 쓸 초기 row 변환
 * - 날짜 파싱 실패 시 _errors에 메시지 넣음 (셀 에러 표시용)
 *
 * ※ 여기서 "품번(assetId)"은 엑셀 값이 있으면 그대로,
 *   없으면 비워두고, 나중에 종류 선택/submit 시 자동 생성되게 둠.
 */
export function excelRowToRegistInitial(excelRow, empIdSet) {
  const r = excelRow || {};
  const _errors = {};

  // 헤더명은 자네 템플릿에 맞춰 매핑해야 한다네.
  // (여기서는 이전 자산 헤더 기반으로 가정)
  const get = (k) => (r[k] == null ? "" : String(r[k]).trim());

  const assetId = get("품번");
  const assetType = get("종류");
  const assetManufacturer = get("제조사");
  const manufacturedRaw = r["제조년월"];
  const assetModelName = get("모델명");
  const assetSn = get("시리얼번호") || get("S/N") || get("SN");
  const empId = get("사번");
  const assetLoc = get("설치장소");
  const issuanceRaw = r["지급일"];
  const assetDesc = get("비고");

  // 날짜 파싱
  const manufactured = normalizeExcelDate(manufacturedRaw);
  if (manufacturedRaw && !manufactured) {
    _errors.assetManufacturedAt = "날짜 형식이 올바르지 않습니다.";
  }

  const issuance = normalizeExcelDate(issuanceRaw);
  if (issuanceRaw && !issuance) {
    _errors.assetIssuanceDate = "날짜 형식이 올바르지 않습니다.";
  }

  // 그래도 엑셀에 "사번(empId)" 컬럼이 있다면 우선 그걸 쓰게 해도 됨.
  // 여기서는 "성명" 칸에 사번이 들어왔을 가능성도 있어서 empIdSet에 있으면 empId로 인정.
  // const empId = empIdSet?.has(empNameOrId) ? empNameOrId : "";

  // empPos/teamName은 직원 선택으로 자동 표시하므로 굳이 초기값 안 넣어도 됨
  // 다만 엑셀에 들어왔으면 참고용으로 _prefill에 담아둘 수도 있음.
  return {
    assetType,
    assetId, // 비어도 OK: submit/종류변경 때 자동 생성
    assetManufacturer,
    assetManufacturedAt: manufactured ? manufactured.toDate() : null,
    assetModelName,
    assetSn,
    empId,
    assetLoc,
    assetIssuanceDate: issuance ? issuance.toDate() : null,
    assetDesc,

    // ✅ 엑셀 파싱 에러를 셀 에러로 표시하기 위한 메타
    _errors,
  };
}

/**
 * 양식 다운로드용 xlsx 생성(헤더 + 예시 1행)
 * 브라우저에서 바로 다운로드
 */
export function downloadAssetTemplateXlsx() {
  const headers = [
    "종류",
    "제조사",
    "제조년월",
    "모델명",
    "S/N",
    "사번",
    "설치장소",
    "지급일",
    "비고",
  ];

  const example = [
    "노트북",
    "LG",
    "2024-01-30",
    "LG 그램",
    "SN1234",
    "E999",
    "본사_3F",
    "2024-02-01",
    "예시 비고",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "assets");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "자산_등록_양식.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
