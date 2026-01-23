import { useAuthStore } from "../components/hooks/useAuthStore";

export function usePerm() {
  const isLogin = useAuthStore((s) => s.isLogin);
  const auth = useAuthStore((s) => s.user.auth);

  const has = (perm) => isLogin && (auth ?? []).includes(perm);

  // ex) TB_AUTH: 'AUTH_FA' -> (some logic...) -> auth: ['PERM_ASSET_WRITE']
  // resource: emp -> PERM_HR_WRITE / asset -> PERM_ASSET_WRITE
  const hasFor = (resource, action) => {
    const table = {
      asset: { write: "PERM_ASSET_WRITE" },
      emp: { write: "PERM_HR_WRITE" },
    };
    return has(table[resource]?.[action]);
  };

  return { has, hasFor };
}
