// src/components/layout/Sidebar.jsx
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
// import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { Navigation } from "../assets/Navigation";
import { useState } from "react";

const drawerWidth = 260;

function Sidebar({ sidebarOpen }) {
  const location = useLocation();
  const [openFolder, setOpenFolder] = useState(true);

  // 클릭 기반 강조(최소 변경)
  const [activeSegment, setActiveSegment] = useState(null);

  const currentSegment = useMemo(() => {
    const path = location.pathname.split("/")[1] || "dashboard";
    return path;
  }, [location.pathname]);

  useEffect(() => {
    setActiveSegment(currentSegment);
  }, [currentSegment]);

  const handleFolderToggle = () => {
    setOpenFolder((prev) => !prev);
  };

  // 공통 클릭 핸들러
  const handleSelect = (segment) => () => {
    setActiveSegment(segment);
  };

  return (
    <Box
      component="aside"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        borderRight: "1px solid",
        borderColor: "divider",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <List>
        {Navigation.map((item) => {
          if (item.kind === "header") {
            return (
              <ListSubheader key={item.title} component="div">
                {item.title}
              </ListSubheader>
            );
          }

          if (item.segment === "hidden") return null;

          if (item.segment === "expanded" && item.children) {
            return (
              <Box key={item.segment}>
                <ListItemButton onClick={handleFolderToggle}>
                  {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                  <ListItemText primary={item.title} />
                  {openFolder ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={openFolder} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.segment}
                        component={Link}
                        to={`/${child.segment}`}
                        sx={{ pl: 4 }}
                        // 클릭한 메뉴 기준으로 selected
                        selected={activeSegment === child.segment}
                        onClick={handleSelect(child.segment)}
                      >
                        {child.icon && (
                          <ListItemIcon>{child.icon}</ListItemIcon>
                        )}
                        <ListItemText primary={child.title} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          const disabled = item.segment === "disabled";

          if (item.segment === "external") {
            return (
              <ListItemButton
                key={item.segment}
                component="a"
                href="https://mui.com/toolpad"
                target="_blank"
                rel="noreferrer"
              >
                {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                <ListItemText primary={item.title} />
              </ListItemButton>
            );
          }

          return (
            <ListItemButton
              key={item.segment}
              component={Link}
              to={`/${item.segment === "dashboard" ? "" : item.segment}`}
              disabled={disabled}
              // 클릭한 메뉴 기준으로 selected
              selected={
                activeSegment === item.segment || item.segment === "selected"
              }
              onClick={handleSelect(item.segment)}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText primary={item.title} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export default Sidebar;
