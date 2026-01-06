import dayjs from "dayjs";

// export function isFirstHistoryRow(assetHistoryId) {
//   const s = String(assetHistoryId || "");
//   return /_H0*1$/i.test(s); // ..._H001
// }

// export function isTransferRow(row) {
//   const cur = String(row?.assetHoldEmp || "").trim();
//   const prev = String(row?.assetHoldEmpHis || "").trim();
//   return prev.length > 0 && cur.length > 0 && cur !== prev;
// }

// export function isDisposedRow(row) {
//   const status = String(row?.assetStatus || "").toUpperCase();
//   if (status === "N") return true;

//   const desc = String(row?.assetHistoryDesc || "");
//   if (desc.includes("폐기")) return true;

//   const type = String(row?.eventType || "").toUpperCase();
//   return type === "DISPOSE";
// }

export function isFirstHistoryRow(row) {
  return Number(row?.isFirst) === 1;
}

export function isTransferHistoryRow(row) {
  return Number(row?.isTransfer) === 1;
}

export function isDisposeHistoryRow(row) {
  return Number(row?.isDispose) === 1;
}

export function formatHistoryDate(v) {
  if (!v) return "";
  console.log("시간?: ", v);
  const time = dayjs(v).format("YYYY-MM-DD HH:mm:ss");
  console.log(time);
  return time;
}

// "+토큰" 포함, "-토큰" 제외, 나머지 토큰은 포함(AND)
export function buildSearchPredicate(input) {
  const raw = String(input || "").trim();
  if (!raw) return () => true;

  const tokens = raw.split(/\s+/).filter(Boolean);
  const includes = [];
  const excludes = [];

  for (const t of tokens) {
    if (t.startsWith("+") && t.length > 1) includes.push(t.slice(1));
    else if (t.startsWith("-") && t.length > 1) excludes.push(t.slice(1));
    else includes.push(t);
  }

  return (row) => {
    const blob = [
      row.displayId,
      row.assetHoldEmp,
      row.assetHoldEmpHis,
      row.assetHistoryDesc,
      formatHistoryDate(row.assetHistoryDate),
    ]
      .map((x) => String(x || ""))
      .join(" ")
      .toLowerCase();

    for (const ex of excludes) {
      if (blob.includes(String(ex).toLowerCase())) return false;
    }
    for (const inc of includes) {
      if (!blob.includes(String(inc).toLowerCase())) return false;
    }
    return true;
  };
}

export function applyColumnFilters(rows, columnFilters) {
  const filters = columnFilters || {};
  const active = Object.entries(filters).filter(([, v]) =>
    String(v || "").trim()
  );
  if (active.length === 0) return rows;

  return rows.filter((r) => {
    for (const [field, value] of active) {
      const q = String(value || "")
        .trim()
        .toLowerCase();
      const cell =
        field === "assetHistoryDate"
          ? formatHistoryDate(r.assetHistoryDate)
          : String(r[field] || "");
      if (!cell.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
