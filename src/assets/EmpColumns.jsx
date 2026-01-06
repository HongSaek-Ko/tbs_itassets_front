import { Typography } from "@mui/material";
import React from "react";

const HeaderWithFilterIcon = ({ title, active }) => {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>

      {/* 필터가 걸린 컬럼이면 아이콘 표시 */}
      {active && (
        <FilterAltIcon
          fontSize="small"
          sx={{
            color: active ? "primary.main" : "transparent",
            opacity: active ? 0.9 : 1,
          }}
        />
      )}
    </Box>
  );
};

const EmpColumns = () => [
  { field: "empId", headerName: "사번", width: 90 },
  {
    field: "empName",
    headerName: "성명",
    width: 100,
    sortable: false,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="성명"
        active={!!columnFilters?.assetType?.trim()}
      />
    ),
  },

  { field: "empPos", headerName: "직위", width: 110 },
  {
    field: "empPos",
    headerName: "직위",
    width: 140,
    sortable: false,
    renderHeader: () => <HeaderWithFilterIcon title="직위" active={false} />,
  },

  {
    field: "teanName",
    headerName: "소속",
    width: 90,
    sortable: true,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="소속"
        active={!!columnFilters?.empPos?.trim()}
      />
    ),
  },
  {
    field: "empStatus",
    headerName: "재직상태",
    width: 160,
    sortable: true,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="재직 상태"
        active={!!columnFilters?.assetLoc?.trim()}
      />
    ),
  },
];

export default EmpColumns;
