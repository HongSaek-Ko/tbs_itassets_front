import * as React from "react";
import { formatHistoryDate } from "./assetHistoryUtils";

export function getAssetHistoryColumns() {
  const no = { sortable: true, filterable: false, disableColumnMenu: false };

  return [
    {
      field: "displayId",
      headerName: "이력 번호",
      minWidth: 100,
      flex: 0.5,
      ...no,
    },
    {
      field: "assetHoldEmp",
      headerName: "현재 소유자",
      minWidth: 180,
      flex: 0.5,
      ...no,
    },
    {
      field: "assetHistoryDesc",
      headerName: "변동(이관) 사유",
      minWidth: 240,
      flex: 1,
      ...no,
    },
    {
      field: "assetHistoryDate",
      headerName: "변동(이관) 시간",
      width: 240,
      flex: 1,
      ...no,
      // valueGetter: (_value, row) => row?.assetHistoryDateTs ?? 0,
      sortComparator: (v1, v2) => (v1 ?? 0) - (v2 ?? 0),

      renderCell: (params) =>
        formatHistoryDate(params?.row?.assetHistoryDate) ?? "",
    },
  ];
}
