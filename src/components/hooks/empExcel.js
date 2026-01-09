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

  // 날짜 포맷들 순차 시도
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
export function excelRowToRegistInitial(excelRow) {
  const r = excelRow || {};
  const _errors = {};

  const get = (k) => (r[k] == null ? "" : String(r[k]).trim());

  const empId = get("사번");
  const empName = get("성명");
  const empPos = get("직위");
  const teamName = get("소속");
  const empRegDtRaw = r["입사일자"];

  // 날짜 파싱
  const employeed = normalizeExcelDate(empRegDtRaw);
  if (empRegDtRaw && !employeed) {
    _errors.empRegDt = "날짜 형식이 올바르지 않습니다.";
  }

  return {
    empId,
    empName,
    empPos,
    teamName,
    empRegDt: employeed ? employeed.toDate() : null,

    // 엑셀 파싱 에러를 셀 에러로 표시하기 위한 메타
    _errors,
  };
}

/**
 * 양식 다운로드용 xlsx 생성(헤더 + 예시 1행)
 * 브라우저에서 바로 다운로드
 */
export function downloadEmpTemplateXlsx() {
  const headers = ["사번", "성명", "직위", "소속", "입사일자"];

  const example = ["E999", "홍길동", "사원", "개발팀", "2026-01-01"];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "emp");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "직원_등록_양식.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
