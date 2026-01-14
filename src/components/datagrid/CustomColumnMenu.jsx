// src/components/datagrid/CustomColumnMenu.jsx
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import FilterAltIcon from "@mui/icons-material/FilterAlt";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import { useGridApiContext } from "@mui/x-data-grid";

// 🔍 필터 허용 컬럼
const DEFAULT_FILTERABLE_FIELDS = [
  "assetType", // 종류
  "empName", // 성명
  "empPos", // 직위
  "teamName", // 소속
  "assetLoc", // 설치장소
  "assetDesc", // 비고
];

// 🔽 정렬 허용 컬럼
const DEFAULT_SORTABLE_FIELDS = [
  "empName", // 성명
  "empPos", // 직위
  "teamName", // 소속
  "assetLoc", // 설치장소
  "assetIssuanceDate", // 지급일
];

export default function CustomColumnMenu(props) {
  const {
    hideMenu,
    colDef,
    openColumnFilterDialog,
    filterableFields = DEFAULT_FILTERABLE_FIELDS,
    sortableFields = DEFAULT_SORTABLE_FIELDS,
  } = props;

  const apiRef = useGridApiContext();

  const isFilterable = filterableFields.includes(colDef.field);
  const isSortable = sortableFields.includes(colDef.field);

  const handleFilter = () => {
    // 내장 필터 패널을 열지 말고, 우리가 만든 Dialog를 연다
    openColumnFilterDialog?.(colDef.field, colDef.headerName || colDef.field);
    hideMenu();
  };

  const handleSortAsc = () => {
    apiRef.current.setSortModel([{ field: colDef.field, sort: "asc" }]);
    hideMenu();
  };

  const handleSortDesc = () => {
    apiRef.current.setSortModel([{ field: colDef.field, sort: "desc" }]);
    hideMenu();
  };

  const handleUnsort = () => {
    apiRef.current.setSortModel([]);
    hideMenu();
  };

  const handleHideColumn = () => {
    apiRef.current.setColumnVisibility(colDef.field, false);
    hideMenu();
  };

  const handleManageColumns = () => {
    apiRef.current.showPreferences?.("columns");
    hideMenu();
  };

  return (
    <MenuList dense>
      <Typography
        variant="caption"
        sx={{ px: 2, py: 1, color: "text.secondary" }}
      >
        {colDef.headerName || colDef.field}
      </Typography>

      {/* 필터가 필요한 컬럼에만 노출 */}
      {isFilterable && (
        <>
          <MenuItem onClick={handleFilter}>
            <ListItemIcon>
              <FilterAltIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>이 열에서 필터하기</ListItemText>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
        </>
      )}

      {/* 정렬이 필요한 컬럼에만 노출 */}
      {isSortable && (
        <>
          <MenuItem onClick={handleSortAsc}>
            <ListItemIcon>
              <ArrowUpwardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>오름차순 정렬</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleSortDesc}>
            <ListItemIcon>
              <ArrowDownwardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>내림차순 정렬</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleUnsort}>
            <ListItemText inset>정렬 해제</ListItemText>
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />
        </>
      )}

      {/* 나머지는 공통 – 모든 컬럼에 항상 노출 */}
      <MenuItem onClick={handleHideColumn}>
        <ListItemIcon>
          <VisibilityOffIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>이 열 숨기기</ListItemText>
      </MenuItem>

      <MenuItem onClick={handleManageColumns}>
        <ListItemIcon>
          <ViewColumnIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>열 관리</ListItemText>
      </MenuItem>
    </MenuList>
  );
}
