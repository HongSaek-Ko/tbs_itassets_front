import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useAuthStore } from "../hooks/useAuthStore";

export function LogoutDialog({ open, onClose }) {
  const logout = useAuthStore((s) => s.logout);

  const onConfirm = async () => {
    await logout();
    onClose();
    window.location.replace("/");
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>안내</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mt: 1 }}>
          로그아웃 하시겠어요?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={onConfirm}>
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
}
