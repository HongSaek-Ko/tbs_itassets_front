import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  downloadEmpTemplateXlsx,
  excelRowToRegistInitial,
  readExcelToObjects,
} from "../hooks/empExcel";

export default function RegistEmpEntry({
  open,
  onClose,
  onPickDirect, // () => void
  onExcelPrefill, // (initialValues) => void
  serverEmpIds,
}) {
  const serverSet = useMemo(() => {
    if (!serverEmpIds) return new Set();
    return serverEmpIds instanceof Set
      ? serverEmpIds
      : new Set(serverEmpIds.map((v) => String(v).trim()).filter(Boolean));
  }, [serverEmpIds]);

  const fileRef = useRef(null);

  const [bottomMsg, setBottomMsg] = useState("");

  const handleClickUpload = () => {
    setBottomMsg("");
    fileRef.current?.click?.();
  };

  const handleFileChange = async (e) => {
    setBottomMsg("");
    const f = e.target.files?.[0];
    if (!f) return;

    // 다음 업로드를 위해 input value 비우기
    e.target.value = "";

    try {
      const buf = await f.arrayBuffer();
      const objects = readExcelToObjects(buf);

      if (!objects.length) {
        setBottomMsg("엑셀에 데이터 행이 없습니다.");
        return;
      }

      const seen = new Set();
      let cleared = 0;

      const initialRows = objects.map((row) => {
        const r = excelRowToRegistInitial(row);
        const id = String(r.empId ?? "").trim();

        if (!id) return r;

        // 1) DB에 이미 있는 사번 → 비우기
        if (serverSet.has(id)) {
          cleared++;
          return { ...r, empId: "" };
        }

        // 2) 엑셀 내부 중복 → 비우기
        if (seen.has(id)) {
          cleared++;
          return { ...r, empId: "" };
        }

        seen.add(id);
        return r;
      });

      if (cleared > 0) {
        setBottomMsg(`중복 사번 ${cleared}건이 제거되었습니다.`);
      }

      onExcelPrefill?.(initialRows);
    } catch (err) {
      console.error(err);
      setBottomMsg("엑셀 파일을 읽는 중 오류가 발생했습니다.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          width: 560,
          maxWidth: "92vw",
          m: "auto",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pr: 6, position: "relative" }}>
        <Typography fontWeight={800}>신규 자산 등록</Typography>

        {/* 양식 다운로드 */}
        <Button
          size="small"
          variant="outlined"
          onClick={downloadEmpTemplateXlsx}
          sx={{ position: "absolute", right: 52, top: 12 }}
        >
          양식 다운로드
        </Button>

        {/* 닫기 버튼 */}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 10, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 3 }}>
        <Box sx={{ display: "flex", gap: 1.2 }}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            onClick={onPickDirect}
          >
            직접 작성하기
          </Button>

          <Button
            fullWidth
            size="large"
            variant="outlined"
            onClick={handleClickUpload}
          >
            엑셀로 업로드 하기
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography variant="body2" color="text.secondary">
            엑셀(.xlsx) 파일 업로드 시, 양식에 맞춰 작성해주세요.
          </Typography>
        </Box>

        {/* {bottomMsg ? (
          <Box sx={{ mt: 1.2, display: "flex", justifyContent: "center" }}>
            <Typography variant="body2" color="error">
              {bottomMsg}
            </Typography>
          </Box>
        ) : (
          <></>
        )} */}
      </DialogContent>
    </Dialog>
  );
}
