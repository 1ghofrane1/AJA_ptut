import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Use environment variable if available, fallback to localhost
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";
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

export type RecommendationResponse = {
  id: string;
  user_id: string;
  source: string;
  input: Record<string, any>;
  decision: Record<string, any>;
  created_at: string;
};

export type RecommendationIntakeResponse = {
  id: string;
  user_id: string;
  recommendation_id: string;
  supplement_id?: string | null;
  supplement_name: string;
  objective_key?: string | null;
  objective_label?: string | null;
  taken: boolean;
  taken_at: string;
  created_at: string;
};

export type RecommendationIntakeItemInput = {
  supplement_id?: string;
  supplement_name: string;
  objective_key?: string;
  objective_label?: string;
  taken: boolean;
  taken_at?: string;
};

export type RecommendationIntakesBulkResponse = {
  recommendation_id: string;
  saved_count: number;
  intakes: RecommendationIntakeResponse[];
  decision: Record<string, any>;
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

export async function getMyRecommendations(limit = 20) {
  const { data } = await api.get<RecommendationResponse[]>("/users/me/recommendations", {
    params: { limit },
  });
  return data;
}

export async function getMyRecommendation(recommendationId: string) {
  const { data } = await api.get<RecommendationResponse>(
    `/users/me/recommendations/${recommendationId}`,
  );
  return data;
}

export async function addBestDecisionComplementTime(
  recommendationId: string,
  takenAt?: string | Date,
) {
  const payload =
    takenAt === undefined
      ? {}
      : {
          taken_at:
            typeof takenAt === "string" ? takenAt : takenAt.toISOString(),
        };

  const { data } = await api.post<RecommendationResponse>(
    `/users/me/recommendations/${recommendationId}/best-decision/complement-times`,
    payload,
  );
  return data;
}

export async function getRecommendationIntakes(
  recommendationId: string,
  limit = 200,
) {
  const { data } = await api.get<RecommendationIntakeResponse[]>(
    `/users/me/recommendations/${recommendationId}/intakes`,
    { params: { limit } },
  );
  return data;
}

export async function saveRecommendationIntakes(
  recommendationId: string,
  intakes: RecommendationIntakeItemInput[],
) {
  const payload = {
    intakes: intakes.map((item) => ({
      ...item,
      taken_at: item.taken_at,
    })),
  };

  const { data } = await api.post<RecommendationIntakesBulkResponse>(
    `/users/me/recommendations/${recommendationId}/intakes/bulk`,
    payload,
  );
  return data;
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ============================================
// PROGRESS TRACKING
// ============================================

export type ProgressResponse = {
  today_progress: number;
  weekly_data: { day: string; completed: boolean }[];
  adherence_data: boolean[];
  evolution_data: { day: number; value: number }[];
  monthly_data: { day: number; intensity: number }[];
  daily_intakes: { time: string; name: string; taken: boolean }[];
};

export async function getProgress() {
  const { data } = await api.get<ProgressResponse>("/tracking/progress");
  return data;
}

// ============================================
// DASHBOARD
// ============================================

export type DashboardResponse = {
  user_name: string;
  today_progress: number;
  supplements_taken: number;
  supplements_total: number;
  weekly_data: { day: string; completed: boolean }[];
  adherence_data: boolean[];
};

export async function getDashboard() {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data;
}
