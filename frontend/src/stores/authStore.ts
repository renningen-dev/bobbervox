import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "firebase/auth";

// Serializable user data for storage
export interface SerializableUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: SerializableUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null, token: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  getToken: () => string | null;
}

// Extract serializable user data from Firebase User
function serializeUser(user: User): SerializableUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user, token) =>
        set({
          user: user ? serializeUser(user) : null,
          token,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      clearAuth: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      getToken: () => get().token,
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // Persist serialized user data and token
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
