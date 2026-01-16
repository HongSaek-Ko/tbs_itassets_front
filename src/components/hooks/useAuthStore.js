import { create } from "zustand";
import { persist } from "zustand/middleware";
import { postLogout } from "../../api/authAPIS";

const initialState = {
  accessToken: null,
  isLogin: false,
  user: {
    userId: "",
    name: "",
    auth: [], // ["PERM_ASSET_WRITE", ...]
  },
};

export const useAuthStore = create(
  persist(
    (set) => ({
      ...initialState,
      login: ({ accessToken, user }) =>
        set({
          accessToken,
          isLogin: true,
          user: {
            userId: user.userId,
            name: user.name,
            auth: user.auth ?? [],
          },
        }),
      setUser: (user) =>
        set((s) => ({
          user: { ...s.user, ...user },
        })),
      logout: async () => {
        try {
          await postLogout();
        } catch (e) {
          // ignore
        } finally {
          set({ ...initialState });
        }
      },
      withdraw: () => set({ ...initialState }),
    }),
    {
      name: "authStore",
      partialize: (s) => ({
        accessToken: s.accessToken,
        isLogin: s.isLogin,
        user: s.user,
      }),
    }
  )
);
