import { useEffect, useMemo, useState } from "react";
import { fetchAssetList, exportAssetListExcel } from "../../api/assetAPIS";

export function useAssetRows({
  assetStatus,
  columnFilters,
  globalSearch,
  filterableFields,
}) {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("");

  const reloadRows = async () => {
    setLoading(true);
    try {
      const res = await fetchAssetList({
        page: 0,
        size: 1000,
        assetStatus, // 현재/폐기 분기(백으로 전달)
      });

      const body = res.data?.data ?? res.data;
      const rows = Array.isArray(body?.content)
        ? body.content
        : Array.isArray(body)
          ? body
          : [];
      setAllRows(rows);
    } catch (e) {
      console.error("자산 목록 조회 실패:", e);
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetStatus]);

  // 글로벌 검색(토큰 AND/+/-)
  const searchedRows = useMemo(() => {
    const raw = String(globalSearch || "")
      .trim()
      .toLowerCase();
    if (!raw) return allRows;

    const tokens = raw.split(/\s+/).filter(Boolean);

    const mustInclude = [];
    const mustExclude = [];
    const include = [];

    tokens.forEach((t) => {
      if (t.startsWith("+") && t.length > 1) mustInclude.push(t.slice(1));
      else if (t.startsWith("-") && t.length > 1) mustExclude.push(t.slice(1));
      else include.push(t);
    });

    const fields = filterableFields;

    const rowText = (row) =>
      fields
        .map((f) => row?.[f])
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return allRows.filter((row) => {
      const text = rowText(row);

      if (mustExclude.some((t) => text.includes(t))) return false;
      if (!mustInclude.every((t) => text.includes(t))) return false;
      if (!include.every((t) => text.includes(t))) return false;

      return true;
    });
  }, [allRows, globalSearch, filterableFields]);

  // 컬럼 필터(AND) - 원본과 동일
  const filteredRows = useMemo(() => {
    return searchedRows.filter((row) => {
      return filterableFields.every((field) => {
        const q = String(columnFilters?.[field] || "")
          .trim()
          .toLowerCase();
        if (!q) return true;

        const v = row?.[field];
        if (v == null) return false;
        return String(v).toLowerCase().includes(q);
      });
    });
  }, [searchedRows, columnFilters, filterableFields]);

  // 엑셀 export(서버 기준)
  const handleExport = async (str) => {
    const params = { ...(columnFilters || {}), globalSearch, assetStatus };
    params;
    const res = await exportAssetListExcel(params);
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${str}_목록_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return {
    loading,
    allRows,
    setAllRows,
    filteredRows,
    reloadRows,
    handleExport,
  };
}
