import React, { useState } from "react";
// import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
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

const Header = ({ toggleSidebar }) => {
  const [clicked, setClicked] = useState(null);
  const open = Boolean(clicked);
  const handleMenuClick = (e) => {
    setClicked(e.currentTarget);
  };
  const handleMenuClose = () => {
    setClicked(null);
  };
  const handleLogin = () => {
    // 로그인 모달 노출
    console.log("로그인 모달");
    handleMenuClose();
  };
  const handleSignup = () => {
    // 회원가입 모달 노출
    console.log("회원가입 모달");
    handleMenuClose();
  };
  return (
    <AppBar
      position="fixed"
      color="white"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        {/* 사이드바 토글 버튼 */}
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
        {/* 중앙: 로고 영역 */}
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
          {/* 로고 이미지 */}
          <img
            src="/tbs_logo.png"
            alt="더비소프트 로고"
            style={{ height: 32 }}
          />
        </Box>
        {/* 오른쪽 영역 */}
        {/* <Box sx={{ flexGrow: 1 }}></Box> */}
        {/* 로그인 / 회원가입 드롭다운 */}
        {/* <Button
          color="inherit"
          startIcon={<AccountCircle />}
          endIcon={<KeyboardArrowDownIcon />}
          onClick={handleMenuClick}
        >
          로그인 / 회원가입
        </Button> */}
        {/* <Menu
          anchorEl={clicked}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          keepMounted
        >
          <MenuItem onClick={handleLogin}>로그인</MenuItem>
          <MenuItem onClick={handleSignup}>회원가입</MenuItem>
        </Menu> */}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
