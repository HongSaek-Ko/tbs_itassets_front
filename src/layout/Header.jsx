import React, { useState, useMemo } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { UpdateInfoDialog } from "../components/datagrid/UpdateInfoDialog";
import { LogoutDialog } from "../components/dialogs/LogoutDialog";
import { useAuthStore } from "../components/hooks/useAuthStore";

const Header = ({ toggleSidebar }) => {
  const user = useAuthStore((s) => s.user);
  const isLogin = useAuthStore((s) => s.isLogin);

  const [clicked, setClicked] = useState(null);
  const open = Boolean(clicked);

  const handleMenuClick = (e) => setClicked(e.currentTarget);
  const handleMenuClose = () => setClicked(null);

  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const display = useMemo(() => {
    if (!isLogin) return "미접속";
    return `${user?.name ?? ""} (${user?.userId ?? ""})`;
  }, [isLogin, user?.name, user?.userId]);

  return (
    <>
      <AppBar
        position="fixed"
        color="white"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div">
            IT 자산 관리
          </Typography>

          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <img
              src="/tbs_logo.png"
              alt="더비소프트 로고"
              style={{ height: 32 }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            color="inherit"
            startIcon={<AccountCircle />}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleMenuClick}
          >
            {display}
          </Button>

          <Menu
            anchorEl={clicked}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            keepMounted
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setEditOpen(true);
              }}
              disabled={!isLogin}
            >
              내 정보 수정
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleMenuClose();
                setLogoutOpen(true);
              }}
              disabled={!isLogin}
            >
              로그아웃
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <UpdateInfoDialog open={editOpen} onClose={() => setEditOpen(false)} />
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
};

export default Header;
