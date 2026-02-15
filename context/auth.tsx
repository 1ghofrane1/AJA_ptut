// context/auth.tsx
import {
  clearToken,
  getMe,
  login,
  saveToken,
  signup,
  TOKEN_KEY,
  UserResponse,
} from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthState = {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<UserResponse>;
  signupWithEmail: (email: string, password: string) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<UserResponse | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem(TOKEN_KEY);
      if (t) {
        setToken(t);
        try {
          const me = await getMe(true);
          setUser(me);
        } catch {
          await clearToken();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const refreshMe = async () => {
    if (!token) return null;
    const me = await getMe(true);
    setUser(me);
    return me;
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await login(email, password);
    await saveToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const signupWithEmail = async (email: string, password: string) => {
    const res = await signup(email, password);
    await saveToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      loginWithEmail,
      signupWithEmail,
      logout,
      refreshMe,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
