import { postLogin } from "../api/authAPIS";
import { ErrorDialog } from "../components/dialogs/ErrorDialog";
import { useAuthStore } from "../components/hooks/useAuthStore";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";

const schema = yup.object({
  userId: yup.string().required("아이디를 입력하세요."),
  userPw: yup.string().required("비밀번호를 입력하세요."),
});

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

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
      const res = await postLogin(data);
      res.data.data;
      login(res.data.data);
      navigate("/", { replace: true });
    } catch (e) {
      setErrorMsg(e?.data ?? "로그인 실패.");
      setErrorOpen(true);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper sx={{ p: 3, width: 360 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          로그인
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
            label="비밀번호"
            type="password"
            {...register("userPw")}
            error={!!errors.userPw}
            helperText={errors.userPw?.message}
          />
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            로그인
          </Button>

          {/* <Button variant="outlined" onClick={() => navigate("/signup")}>
            회원가입
          </Button> */}
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

export default Login;
