import { postSignup } from "../api/authAPIS";
import { ErrorDialog } from "../components/dialogs/ErrorDialog";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";

const schema = yup.object({
  userId: yup
    .string()
    .min(4, "아이디는 4자 이상이어야 합니다.")
    .max(50)
    .required(),
  username: yup.string().min(1).max(50).required("이름을 입력하세요."),
  userPw: yup
    .string()
    .min(8, "비밀번호는 8자리 이상이어야 합니다.")
    .max(100)
    .required(),
  userPwChk: yup
    .string()
    .oneOf([yup.ref("userPw")], "비밀번호가 일치하지 않습니다.")
    .required(),
});

const Signup = () => {
  const navigate = useNavigate();
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await postSignup({
        userId: data.userId,
        username: data.username,
        userPw: data.userPw,
      });
      navigate("/", { replace: true });
    } catch (e) {
      setErrorMsg(e?.response?.data?.message ?? "회원가입에 실패하셨습니다.");
      setErrorOpen(true);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper sx={{ p: 3, width: 420 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          회원가입
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", gap: 2, flexDirection: "column" }}
        >
          <TextField
            label="아이디"
            {...register("userId")}
            error={!!errors.userId}
            helperText={errors.userId?.message}
          />
          <TextField
            label="이름"
            {...register("username")}
            error={!!errors.username}
            helperText={errors.username?.message}
          />
          <TextField
            label="비밀번호"
            type="password"
            {...register("userPw")}
            error={!!errors.userPw}
            helperText={errors.userPw?.message}
          />
          <TextField
            label="비밀번호 확인"
            type="password"
            {...register("userPwChk")}
            error={!!errors.userPwChk}
            helperText={errors.userPwChk?.message}
          />

          <Button variant="contained" type="submit" disabled={isSubmitting}>
            가입
          </Button>
          <Button variant="outlined" onClick={() => navigate("/")}>
            취소
          </Button>
        </Box>
      </Paper>

      <ErrorDialog
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        msg={errorMsg}
      />
    </Box>
  );
};

export default Signup;
