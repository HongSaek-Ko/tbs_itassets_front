import FilterAltIcon from "@mui/icons-material/FilterAlt";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

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
// 날짜 -> YYYY-MM-DD 변환
function getFormattedDate(date) {
  const convert = new Date(date);
  const year = convert.getFullYear(); // 년도 가져오기 (yyyy)
  // getMonth()는 0부터 시작하므로 +1, 두 자리로 만들기 위해 '0' 추가
  const month = (1 + convert.getMonth()).toString().padStart(2, "0");
  // getDate()는 일(day)을 가져오고, 두 자리로 만들기 위해 '0' 추가
  const day = convert.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`; // yyyy-MM-dd 형식으로 반환
}

export const getColumns = (columnFilters) => [
  { field: "assetId", headerName: "품번", width: 90 },
  {
    field: "assetType",
    headerName: "종류",
    width: 100,
    sortable: false,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="종류"
        active={!!columnFilters?.assetType?.trim()}
      />
    ),
  },

  { field: "assetManufacturer", headerName: "제조사", width: 110 },
  {
    field: "assetManufacturedAt",
    headerName: "제조년월",
    width: 140,
    sortable: false,
    valueFormatter: (params) => {
      return params.value
        ? String(params.value).slice(0, 10)
        : getFormattedDate(params);
    },
    renderHeader: () => (
      <HeaderWithFilterIcon title="제조년월" active={false} />
    ),
  },
  { field: "assetModelName", headerName: "모델명", width: 150 },
  { field: "assetSn", headerName: "S/N", width: 150 },

  {
    field: "empName",
    headerName: "성명",
    width: 100,
    sortable: true,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="성명"
        active={!!columnFilters?.empName?.trim()}
      />
    ),
  },

  {
    field: "empPos",
    headerName: "직위",
    width: 90,
    sortable: true,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="직위"
        active={!!columnFilters?.empPos?.trim()}
      />
    ),
  },

  {
    field: "teamName",
    headerName: "소속",
    width: 120,
    sortable: true,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="소속"
        active={!!columnFilters?.teamName?.trim()}
      />
    ),
  },

  {
    field: "assetLoc",
    headerName: "설치장소",
    width: 160,
    sortable: true,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="설치장소"
        active={!!columnFilters?.assetLoc?.trim()}
      />
    ),
  },

  {
    field: "assetIssuanceDate",
    headerName: "지급일",
    width: 140,
    sortable: true,
    valueFormatter: (params) => {
      // 날짜 포맷 필요하면 여기서
      return params.value
        ? String(params.value).slice(0, 10)
        : getFormattedDate(params);
    },
    renderHeader: () => <HeaderWithFilterIcon title="지급일" active={false} />,
  },

  {
    field: "assetDesc",
    headerName: "비고",
    width: 400,
    sortable: false,
    renderHeader: () => (
      <HeaderWithFilterIcon
        title="비고"
        active={!!columnFilters?.assetDesc?.trim()}
      />
    ),
  },
];
