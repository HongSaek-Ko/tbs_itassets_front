// src/components/datagrid/HeaderWithFilter.jsx
import { Box, IconButton, Typography } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import {
  useGridApiContext,
  useGridSelector,
  gridFilterModelSelector,
} from "@mui/x-data-grid";

export default function HeaderWithFilter({ title, columnField }) {
  const apiRef = useGridApiContext();
  const filterModel = useGridSelector(apiRef, gridFilterModelSelector);

  // 이 컬럼에 필터가 적용되어 있는지 여부
  const isFiltered =
    filterModel?.items?.some(
      (item) =>
        item.field === columnField &&
        item.value != null &&
        String(item.value).trim() !== ""
    ) ?? false;

  const handleClick = () => {
    // 필터 패널 열기 (가능한 버전에서만)
    apiRef.current.showFilterPanel?.();

    // 현재 컬럼 기준으로 필터 조건 한 줄 세팅 (값은 비워두고 사용자 입력 대기)
    apiRef.current.setFilterModel({
      ...filterModel,
      items: [
        // 같은 컬럼에 기존 조건 있으면 제거
        ...(filterModel?.items || []).filter(
          (item) => item.field !== columnField
        ),
        {
          field: columnField,
          operator: "contains",
          value: "",
        },
      ],
    });
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="body2">{title}</Typography>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          p: 0.25,
          // 필터가 적용되어 있으면 보라색, 아니면 회색
          color: isFiltered ? "#654DC4" : "action.disabled",
        }}
      >
        <FilterAltIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
