// src/components/empAuth/EmpAuthCell.jsx
import * as React from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import {
  AUTH_LABEL,
  ALL_AUTH_CODES,
  getRowAuthCodes,
  useEmpAuthActions,
} from "../hooks/useEmpAuthActions";

/**
 * props:
 * - row: DataGrid row
 * - updateMode: boolean
 * - isAdmin: boolean
 * - setAllRows: rowsState.setAllRows
 */
export function EmpAuthCell({ row, updateMode, isAdmin, setAllRows }) {
  const actions = useEmpAuthActions({ setAllRows });

  const codes = getRowAuthCodes(row);
  const canEditAuth = Boolean(isAdmin && updateMode);

  const available = ALL_AUTH_CODES.filter((c) => !codes.includes(c));

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          flexWrap: "wrap",
          py: 0,
        }}
      >
        {codes.map((code) => (
          <Chip
            key={code}
            size="small"
            label={AUTH_LABEL[code] ?? code}
            onDelete={
              canEditAuth ? () => actions.askRevoke(row, code) : undefined
            }
          />
        ))}

        {canEditAuth && (
          <Chip
            size="small"
            variant="outlined"
            label="권한 추가..."
            clickable
            onClick={(e) => actions.openAddAuthMenu(e.currentTarget, row)}
            disabled={available.length === 0}
          />
        )}
      </Stack>

      {/* 권한 추가 메뉴 */}
      <Menu
        anchorEl={actions.authMenu.anchorEl}
        open={Boolean(actions.authMenu.anchorEl)}
        onClose={actions.closeAddAuthMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {(() => {
          const menuRow = actions.authMenu.row;
          if (!menuRow) return null;

          const exist = getRowAuthCodes(menuRow);
          const canAdd = ALL_AUTH_CODES.filter((c) => !exist.includes(c));

          if (canAdd.length === 0) {
            return <MenuItem disabled>추가할 권한이 없습니다</MenuItem>;
          }

          return canAdd.map((code) => (
            <MenuItem
              key={code}
              onClick={() => {
                actions.closeAddAuthMenu();
                actions.askGrant(menuRow, code);
              }}
            >
              {AUTH_LABEL[code] ?? code}
            </MenuItem>
          ));
        })()}
      </Menu>

      {/* 부여/회수 확인 */}
      <Dialog
        open={actions.authConfirm.open}
        onClose={actions.closeAuthConfirm}
      >
        <DialogTitle>확인</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {actions.authConfirm.mode === "grant" && actions.authConfirm.row
              ? `${actions.authConfirm.row.empName}에게 ${
                  AUTH_LABEL[actions.authConfirm.authCode] ??
                  actions.authConfirm.authCode
                } 권한을 부여하시겠습니까?`
              : null}

            {actions.authConfirm.mode === "revoke" && actions.authConfirm.row
              ? `${actions.authConfirm.row.empName}(으)로부터 ${
                  AUTH_LABEL[actions.authConfirm.authCode] ??
                  actions.authConfirm.authCode
                } 권한을 회수하시겠습니까?`
              : null}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={actions.closeAuthConfirm}>
            취소
          </Button>
          <Button variant="contained" onClick={actions.onConfirmAuth}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 오류 안내 */}
      <Dialog open={actions.authError.open} onClose={actions.closeAuthError}>
        <DialogTitle>안내</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {actions.authError.msg}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={actions.closeAuthError}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
