import { useEffect, useState } from "react";
import {
  exportAssetHistory,
  exportTotalHistory,
  fetchAssetHistory,
} from "../../api/assetAPIS";
import dayjs from "dayjs";

const pick = (obj, keys, fallback = "") => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
};
/**
 * 서버 응답 예시(권장):
 * [
 *  {
 *    assetHistoryId: "B009_H001",
 *    assetId: "B009",
 *    assetHoldEmp: "홍길동 (E001)",
 *    assetHoldEmpHis: null,
 *    assetHistoryDesc: "신규 등록",
 *    assetHistoryDate: "2025-12-31T10:11:12",
 *    assetStatus: "HOLD" | "N",
 *    eventType: "CREATE" | "TRANSFER" | "UPDATE" | "DISPOSE"
 *  }
 * ]
 */
export function useAssetHistoryRows(assetId, open) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 엑셀 export(서버 기준)
  const handleExport = async (str) => {
    // const params = { ...(columnFilters || {}), globalSearch, assetStatus };
    console.log("이건가?", str);
    const text = str ? str.assetId : "TOTAL";
    console.log(text);
    const res = await exportAssetHistory(text);
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${text == "TOTAL" ? "전체" : text}_변동이력_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // 전체 export
  const totalExport = async (columnFilters, globalSearch) => {
    const params = { ...(columnFilters || {}), globalSearch };
    console.log(params);
    const res = await exportTotalHistory(params);
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `이력_목록_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // if (!open || !assetId) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const res = await fetchAssetHistory(assetId ? assetId : "TOTAL");
        const body = res?.data?.data ?? res?.data ?? [];
        const arr = Array.isArray(body) ? body : [];

        if (!alive) return;

        setRows(
          arr.map((r) => {
            const assetHistoryId = String(
              pick(
                r,
                [
                  "assetHistoryId",
                  "asset_history_id",
                  "assetHistorySeq",
                  "asset_history_seq",
                ],
                ""
              )
            );

            return {
              // DataGrid row id로 쓸 값
              assetHistoryId,

              assetId: String(pick(r, ["assetId", "asset_id"], assetId)),
              displayId: String(pick(r, ["displayId", "display_id"], "")),
              assetHoldEmp: pick(r, ["assetHoldEmp", "asset_hold_emp"], ""),
              assetHoldEmpHis: pick(
                r,
                ["assetHoldEmpHis", "asset_hold_emp_his"],
                ""
              ),
              assetHistoryDesc: pick(
                r,
                ["assetHistoryDesc", "asset_history_desc"],
                ""
              ),
              assetHistoryDate: pick(
                r,
                ["assetHistoryDate", "asset_history_date"],
                null
              ),
              isFirst: pick(r, ["isFirst", "is_first"]),
              isTransfer: pick(r, ["isTransfer", "is_transfer"]),
              isDispose: pick(r, ["isDispose", "is_dispose"]),
            };
          })
        );
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setRows([]);
        setErrorMsg("변동 이력 조회에 실패했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [assetId, open]);

  return { rows, loading, errorMsg, handleExport, totalExport };
}
