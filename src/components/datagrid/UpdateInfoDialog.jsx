import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { putMe } from "../../api/userAPIS";
import { useAuthStore } from "../hooks/useAuthStore";
import { useEffect, useState } from "react";
import { ErrorDialog } from "../../components/dialogs/ErrorDialog";

const schema = yup.object({
  username: yup.string().required("이름을 입력하세요."),
  newPassword: yup
    .string()
    .nullable()
    .transform((v) => (v?.trim() ? v : null))
    .when("$user", {
      is: (v) => {
        ("v?", v);
        return v?.status === "NEW";
      },
      then: (s) => s.required("신규 사용자는 비밀번호 초기화가 필요합니다."),
      otherwise: (s) => s.notRequired(),
    })
    .min(8, "비밀번호는 8자리 이상으로 설정하여야 합니다.")
    .matches(
      /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,15}$/,
      "비밀번호는 8자리 이상, 영소문자, 숫자, 특수문자를 포함하여야 합니다.",
    )
    .max(100, "100자리 이하로 설정해주세요."),
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
    context: { user },
    defaultValues: { username: user.name, newPassword: "" },
  });

  // 폼에 username 렌더링 (최초 open 시 필요)
  useEffect(() => {
    if (open) reset({ username: user.name, newPassword: "" });
  }, [open, user.name, reset]);

  const onSubmit = async (data) => {
    try {
      ("req Data?", data);
      const res = await putMe({
        username: data.username,
        newPassword: data.newPassword ?? null,
      });

      ("res?", res);
      const body = res.data?.data ?? res.data;

      setUser({
        name: body.name,
        auth: body.auth,
        userId: body.userId,
      });

      onClose();

      reset({ username: body.name, newPassword: "" });
    } catch (e) {
      e;
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
            이름 및 비밀번호를 변경할 수 있습니다.
          </Typography>

          {/* 3칸 동일 너비 + 간격 2 */}
          <Box
            sx={{
              display: "flex",
              gap: 2, // 칸 간격 2
              width: "100%",
              mb: 2,
            }}
          >
            <TextField
              label="이름"
              sx={{ flex: 1, minWidth: 0 }} // 동일 너비 핵심
              {...register("username")}
              error={!!errors.username}
              helperText={errors.username?.message}
            />

            <TextField
              label="직위"
              disabled
              value={""} // 임시
              sx={{ flex: 1, minWidth: 0 }}
            />

            <TextField
              label="소속"
              disabled
              value={""} // 임시
              sx={{ flex: 1, minWidth: 0 }}
            />
          </Box>

          <TextField
            fullWidth
            label="새 비밀번호"
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
