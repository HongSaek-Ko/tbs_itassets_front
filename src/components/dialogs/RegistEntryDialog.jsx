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

import { fetchEmpList } from "../../api/empAPIS";
import {
  downloadAssetTemplateXlsx,
  excelRowToRegistInitial,
  readExcelToObjects,
} from "../hooks/assetExcel";

export default function RegistEntryDialog({
  open,
  onClose,
  onPickDirect, // () => void
  onExcelPrefill, // (initialValues) => void
}) {
  const fileRef = useRef(null);

  const [empList, setEmpList] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);

  const [bottomMsg, setBottomMsg] = useState("");

  // open될 때 직원목록 로딩(사번 유효성 체크용)
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setEmpLoading(true);
      try {
        const res = await fetchEmpList();
        const body = res.data?.data ?? res.data;
        setEmpList(Array.isArray(body) ? body : []);
      } catch (e) {
        console.error(e);
        setEmpList([]);
      } finally {
        setEmpLoading(false);
      }
    };
    load();
  }, [open]);

  const empIdSet = useMemo(() => {
    const s = new Set();
    empList.forEach((e) => s.add(String(e.empId)));
    return s;
  }, [empList]);

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

      // // 첫 데이터 행만 폼에 자동 기입
      // const firstRow = objects[0];
      // const initialValues = excelRowToRegistInitial(firstRow, empIdSet);
      // 다중 등록(기입)
      const initialRows = objects.map((row) =>
        excelRowToRegistInitial(row, empIdSet)
      );

      // 사번이 DB에 없거나, 날짜 파싱 실패 등은 기입되지 않음
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

        {/* 우측 상단: 양식 다운로드 */}
        <Button
          size="small"
          variant="outlined"
          onClick={downloadAssetTemplateXlsx}
          sx={{ position: "absolute", right: 52, top: 12 }}
        >
          양식 다운로드
        </Button>

        {/* 우측 상단 X */}
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
            disabled={empLoading}
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

        {bottomMsg ? (
          <Box sx={{ mt: 1.2, display: "flex", justifyContent: "center" }}>
            <Typography variant="body2" color="error">
              {bottomMsg}
            </Typography>
          </Box>
        ) : (
          <></>
        )}
      </DialogContent>
    </Dialog>
  );
}
