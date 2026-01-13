import React, { useState } from "react";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import "../../src/App.css";
import { Box } from "@mui/material";
import Sidebar from "../layout/Sidebar";
import Collapse from "@mui/material/Collapse";
import AssetList from "../pages/AssetList";
import DisposedList from "../pages/DisposedList";
import EmpList from "../pages/EmpList";
import History from "../pages/History";

const HEADER_HEIGHT = 64;

const AppRouter = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setSidebarOpen((e) => !e);
  };
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
        className="app"
      >
        {/* 헤더 */}
        <Header toggleSidebar={toggleSidebar} />

        {/* 사이드바 + 메인 콘텐츠 */}
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            pt: `${HEADER_HEIGHT}px`, // 헤더 높이만큼 위로 밀어줌
          }}
        >
          {/* 왼쪽 사이드바 */}
          {/* <Sidebar sidebarOpen={sidebarOpen} /> */}
          {/* 🔹 사이드바 - Collapse로 감싸서 좌우 애니메이션 */}
          <Collapse
            in={sidebarOpen}
            orientation="horizontal"
            collapsedSize={0}
            timeout={250} // 애니메이션 속도 (ms)
          >
            <Sidebar />
          </Collapse>

          {/* 메인 콘텐츠 영역 */}
          <Box
            component="main"
            className="content"
            sx={{
              flex: 1,
              overflow: "auto",
              bgcolor: "background.default",
            }}
          >
            <Routes>
              {/* "/" → 대시보드(Home). 헤더/사이드바 안쪽 내용물만 바뀜 */}
              <Route path="/" element={<AssetList />} />
              <Route path="/assetList" element={<AssetList />} />
              <Route path="/assetList/disposed" element={<DisposedList />} />
              <Route path="/assetHistory" element={<History />} />
              <Route path="/emp" element={<EmpList />} />
              {/* <Route path="/emp/history" element={<History />} /> */}
              {/* 그 외 라우트 추가하고 싶으면 여기 계속 추가하면 됨 */}
            </Routes>
          </Box>
        </Box>

        {/* 푸터 */}
        <Footer />
      </Box>
    </>
  );
};

export default AppRouter;
