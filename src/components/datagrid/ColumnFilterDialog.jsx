import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/**
 * ColumnFilterDialog
 *
 * props
 * - open: boolean
 * - title: string              // 컬럼 헤더명
 * - value: string              // 현재 필터 값
 * - onClose: () => void
 * - onApply: (value: string) => void
 * - onClear: () => void
 */
export default function ColumnFilterDialog({
  open,
  title,
  value,
  onClose,
  onApply,
  onClear,
}) {
  const [localValue, setLocalValue] = React.useState(value ?? "");

  // 모달 열릴 때마다 최신 데이터로 초기화
  React.useEffect(() => {
    if (open) {
      setLocalValue(value ?? "");
    }
  }, [value, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>필터 설정</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary"></Typography>

          <TextField
            autoFocus
            fullWidth
            size="small"
            label={`"${title}" 검색`}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder="검색 조건을 입력하세요."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>취소</Button>
        <Button color="inherit" onClick={onClear}>
          필터 해제
        </Button>
        <Button variant="contained" onClick={() => onApply?.(localValue)}>
          적용
        </Button>
      </DialogActions>
    </Dialog>
  );
}
