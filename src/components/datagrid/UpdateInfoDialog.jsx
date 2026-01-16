import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { putMe } from "../../api/userAPIS";
import { useAuthStore } from "../hooks/useAuthStore";
import { useState } from "react";
import { ErrorDialog } from "../../components/dialogs/ErrorDialog";

const schema = yup.object({
  userName: yup.string().required("이름을 입력하세요."),
  newPassword: yup
    .string()
    .nullable()
    .transform((v) => (v?.trim() ? v : null))
    .min(8, "비밀번호는 8자리 이상으로 설정하여야 합니다.")
    .max(100)
    .notRequired(),
});

export function UpdateInfoDialog({ open, onClose }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { userName: user.name, newPassword: "" },
  });

  const onSubmit = async (data) => {
    try {
      const res = await putMe({
        userName: data.userName,
        newPassword: data.newPassword ?? null,
      });

      setUser({
        name: res.data.name,
        auth: res.data.auth,
        userId: res.data.userId,
      });

      onClose();
      reset({ userName: res.data.name, newPassword: "" });
    } catch (e) {
      setErrorMsg(e?.response?.data?.message ?? "수정에 실패했습니다.");
      setErrorOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>내 정보 수정</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            이름 또는 비밀번호를 변경할 수 있습니다.
          </Typography>

          <TextField
            fullWidth
            label="이름"
            sx={{ mb: 2 }}
            {...register("userName")}
            error={!!errors.userName}
            helperText={errors.userName?.message}
          />
          <TextField
            fullWidth
            label="새 비밀번호 (선택)"
            type="password"
            {...register("newPassword")}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <ErrorDialog
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        msg={errorMsg}
      />
    </>
  );
}
