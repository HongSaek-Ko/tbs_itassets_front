// src/pages/hooks/useEmpRows.js
import { useEffect, useMemo, useState } from "react";
import { fetchEmpList, exportEmpListExcel } from "../../api/empAPIS";

/**
 * useEmpRows
 * - 직원 목록 로딩
 * - 전역검색(+/-/공백 AND)
 * - 컬럼필터(AND)
 * - 서버 엑셀 export
 */
export function useEmpRows({ columnFilters, globalSearch, filterableFields }) {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const reloadRows = async () => {
    setLoading(true);
    try {
      // ✅ 프로젝트마다 응답 형태가 달라서 방어적으로 처리
      const res = await fetchEmpList({ page: 0, size: 1000 }).catch(() =>
        fetchEmpList()
      );

      const body = res.data?.data ?? res.data;

      // content 기반 페이지 형태 or 배열 형태 둘 다 처리
      const rows = Array.isArray(body?.content)
        ? body.content
        : Array.isArray(body)
        ? body
        : [];

      setAllRows(rows);
    } catch (e) {
      console.error("직원 목록 조회 실패:", e);
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 전역검색(+/-/공백 AND)
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
        .filter((v) => v != null && String(v).trim() !== "")
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

  // 컬럼 필터(AND)
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
    const params = { ...(columnFilters || {}), globalSearch };
    const res = await exportEmpListExcel(params);

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
