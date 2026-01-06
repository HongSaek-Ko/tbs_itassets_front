import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LinkIcon from "@mui/icons-material/Link";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DisabledByDefaultIcon from "@mui/icons-material/DisabledByDefault";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { People } from "@mui/icons-material";

export const Navigation = [
  {
    kind: "header",
    title: "",
  },
  // segment == URL; title == 표시되는 글자
  // {
  //   segment: "",
  //   title: "Dashboard",
  //   icon: <DashboardIcon />,
  // },
  // {
  //   segment: "external",
  //   title: "External Link",
  //   icon: <LinkIcon />,
  // },
  // {
  //   segment: "selected",
  //   title: "Selected Item",
  //   icon: <CheckBoxIcon />,
  // },
  // {
  //   segment: "disabled",
  //   title: "Disabled Item",
  //   icon: <DisabledByDefaultIcon />,
  // },
  // {
  //   segment: "hidden",
  //   title: "Hidden Item",
  //   icon: <VisibilityOffIcon />,
  // },
  {
    segment: "expanded",
    title: "IT 자산 정보",
    icon: <FolderIcon />,
    children: [
      {
        segment: "assetList",
        title: "현재 자산",
        icon: <DescriptionIcon />,
      },
      {
        segment: "assetList/disposed",
        title: "폐기 자산",
        icon: <DescriptionIcon />,
      },
    ],
  },
  {
    segment: "emp",
    title: "직원 목록",
    icon: <People />,
  },
  // {
  //   segment: "expanded",
  //   title: "직원 정보",
  //   icon: <FolderIcon />,
  //   children: [

  //     {
  //       segment: "emp/history",
  //       title: "자산 지급 이력",
  //       icon: <DescriptionIcon />,
  //     },
  //   ],
  // },
  // {
  //   segment: "custom",
  //   title: "기타",
  //   icon: <AutoAwesomeIcon />,
  // },
];
