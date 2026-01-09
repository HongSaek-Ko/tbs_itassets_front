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
import { fetchAssetSnList } from "../../api/assetAPIS";

export default function RegistEntryDialog({
  open,
  onClose,
  onPickDirect, // () => void
  onExcelPrefill, // (initialValues) => void
  getCurrentRows, //
}) {
  const fileRef = useRef(null);

  const [empList, setEmpList] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);

  const [snSet, setSnSet] = useState(() => new Set()); // ✅ DB에 이미 존재하는 SN Set
  const [snLoading, setSnLoading] = useState(false);

  const [bottomMsg, setBottomMsg] = useState("");

  // open될 때 직원목록 로딩(사번 유효성 체크용)
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setEmpLoading(true);
      setSnLoading(true);
      try {
        // ✅ 병렬 로드
        const [empRes, snRes] = await Promise.allSettled([
          fetchEmpList(),
          fetchAssetSnList(),
        ]);

        // 직원
        if (empRes.status === "fulfilled") {
          const body = empRes.value.data?.data ?? empRes.value.data;
          setEmpList(Array.isArray(body) ? body : []);
        } else {
          console.error(empRes.reason);
          setEmpList([]);
        }

        // 시리얼 목록
        if (snRes.status === "fulfilled") {
          const body = snRes.value.data?.data ?? snRes.value.data; // 자네 응답 구조대로
          const arr = Array.isArray(body) ? body : [];
          const next = new Set(
            arr
              .map((v) =>
                String(v ?? "")
                  .trim()
                  .toUpperCase()
              )
              .filter(Boolean)
          );
          setSnSet(next);
        } else {
          console.error(snRes.reason);
          setSnSet(new Set());
        }
      } finally {
        setEmpLoading(false);
        setSnLoading(false);
      }
    };

    load();
  }, [open]);

  const empIdSet = useMemo(() => {
    const s = new Set();
    empList.forEach((e) => s.add(String(e.empId)));
    return s;
  }, [empList]);

  // 시리얼 번호 정규화
  const normalizeSerial = (v) =>
    String(v ?? "")
      .trim()
      .toUpperCase();

  const pickSnFromExcelRow = (row) => {
    const v =
      row?.["S/N"] ??
      row?.["시리얼번호"] ??
      row?.["SN"] ??
      row?.["Serial"] ??
      row?.["serial"] ??
      "";
    return normalizeSerial(v);
  };

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

      // 폼 내 이미 입력된 SN Set
      const currentRows =
        typeof getCurrentRows === "function" ? getCurrentRows() : [];
      const usedSnInFormSet = new Set(
        (Array.isArray(currentRows) ? currentRows : [])
          .map((r) => normalizeSerial(r?.assetSn))
          .filter(Boolean)
      );

      // 엑셀 내부 중복 체크용 Set
      const usedSnInExcelSet = new Set();

      // 변환
      const initialRows = objects.map((row) => {
        const converted = excelRowToRegistInitial(row, empIdSet);

        // SN 중복 체크
        const snNorm = normalizeSerial(converted?.assetSn);
        if (!snNorm) return converted;

        const isDup =
          snSet.has(snNorm) || // DB 중복
          usedSnInFormSet.has(snNorm) || // 폼 내 중복
          usedSnInExcelSet.has(snNorm); // 엑셀 내부 중복

        if (isDup) {
          return {
            ...converted,
            assetSn: "", // 중복 시리얼 번호 비우기
            _errors: { ...(converted._errors || {}), assetSn: "S/N 중복" },
          };
        }

        usedSnInExcelSet.add(snNorm);
        return converted;
      });

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
            disabled={empLoading || snLoading}
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
