import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000";
export const TOKEN_KEY = "aja_token";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ Safe interceptor (web + native)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

export type UserResponse = {
  id: string;
  email: string;
  role: string;
  profile: any;
  created_at: string;
  updated_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: UserResponse;
};

export type DecideMeResponse = {
  derived_input?: Record<string, any>;
  input?: Record<string, any>;
  decision?: Record<string, any>;
  [key: string]: any;
};

export async function signup(email: string, password: string) {
  const { data } = await api.post<TokenResponse>("/auth/signup", {
    email,
    password,
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<TokenResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function getMe(includePersonal = true) {
  const { data } = await api.get<UserResponse>("/users/me", {
    params: { include_personal: includePersonal },
  });
  return data;
}

export async function updateMyProfile(payload: any) {
  const { data } = await api.put<UserResponse>("/users/me/profile", payload);
  return data;
}

export async function getDecisionForMe() {
  const { data } = await api.get<DecideMeResponse>("/decide/me");
  return data;
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
