// src/components/empAuth/useEmpAuthActions.js
import { useState } from "react";
import { grantUserAuth, revokeUserAuth } from "../../api/userAPIS";

export const AUTH_LABEL = {
  AUTH_FA: "자산관리",
  AUTH_HR: "인사관리",
  AUTH_ADMIN: "관리자",
};

export const ALL_AUTH_CODES = ["AUTH_FA", "AUTH_HR", "AUTH_ADMIN"];

export function getRowAuthCodes(row) {
  // 자네 실제 row 키에 맞춰 필요하면 여기만 고치면 되네
  const a = row?.auth ?? row?.authCodes ?? row?.userAuth ?? [];
  console.log(row);
  return Array.isArray(a) ? a : [];
}

/**
 * @param {Object} args
 * @param {(updater: Function) => void} args.setAllRows  // rowsState.setAllRows
 */
export function useEmpAuthActions({ setAllRows }) {
  const [authMenu, setAuthMenu] = useState({ anchorEl: null, row: null });
  const [authConfirm, setAuthConfirm] = useState({
    open: false,
    mode: null, // "grant" | "revoke"
    row: null,
    authCode: "",
  });
  const [authError, setAuthError] = useState({ open: false, msg: "" });

  const openAddAuthMenu = (anchorEl, row) => setAuthMenu({ anchorEl, row });
  const closeAddAuthMenu = () => setAuthMenu({ anchorEl: null, row: null });

  const askGrant = (row, authCode) =>
    setAuthConfirm({ open: true, mode: "grant", row, authCode });

  const askRevoke = (row, authCode) =>
    setAuthConfirm({ open: true, mode: "revoke", row, authCode });

  const closeAuthConfirm = () =>
    setAuthConfirm({ open: false, mode: null, row: null, authCode: "" });

  const closeAuthError = () => setAuthError({ open: false, msg: "" });

  const applyAuthToRow = (userId, nextAuth) => {
    setAllRows((prev) =>
      prev.map((r) => {
        const id = String(r.empId ?? r.id);
        return id === String(userId) ? { ...r, auth: nextAuth } : r;
      }),
    );
  };

  const onConfirmAuth = async () => {
    const { mode, row, authCode } = authConfirm;
    if (!row || !authCode) return;

    const userId = String(row.empId ?? row.id);
    const current = getRowAuthCodes(row);

    try {
      if (mode === "grant") {
        if (!current.includes(authCode)) {
          console.log("reqs: ", userId, authCode);
          await grantUserAuth({ userId, authCode });
          applyAuthToRow(userId, [...current, authCode]);
        }
      }

      if (mode === "revoke") {
        if (current.includes(authCode)) {
          await revokeUserAuth({ userId, authCode });
          applyAuthToRow(
            userId,
            current.filter((c) => c !== authCode),
          );
        }
      }

      closeAuthConfirm();
    } catch (e) {
      console.error(e);
      closeAuthConfirm();
      setAuthError({
        open: true,
        msg: e?.response?.data?.message ?? "권한 처리 중 오류가 발생했습니다.",
      });
    }
  };

  return {
    authMenu,
    authConfirm,
    authError,

    openAddAuthMenu,
    closeAddAuthMenu,

    askGrant,
    askRevoke,
    closeAuthConfirm,

    onConfirmAuth,

    closeAuthError,
  };
}
