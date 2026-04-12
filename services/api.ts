import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";

function parseHostCandidate(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const withoutScheme = raw.replace(/^[a-z]+:\/\//i, "");
  const withoutPath = withoutScheme.split("/")[0] ?? "";
  const host = withoutPath.split(":")[0]?.trim() ?? "";
  if (!host) return null;

  return host;
}

function isReachableDevHost(host: string) {
  if (!host) return false;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) return true;
  if (host.includes(".")) return true;
  return false;
}

function resolveExpoDevHost() {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    const host = parseHostCandidate(candidate);
    if (!host) continue;
    if (host === "localhost" || host === "127.0.0.1") continue;
    if (!isReachableDevHost(host)) continue;
    return host;
  }

  return null;
}

function resolveApiBaseUrl() {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitUrl) return explicitUrl;

  if (Platform.OS !== "web") {
    const expoHost = resolveExpoDevHost();
    if (expoHost) {
      return `http://${expoHost}:8000`;
    }
  }

  return "http://127.0.0.1:8000";
}

export const API_BASE_URL = resolveApiBaseUrl();
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
  profile: UserProfile;
  created_at: string;
  updated_at: string;
};

export type ApiObject = Record<string, unknown>;

export type UserPersonalProfile = ApiObject & {
  first_name?: string;
  last_name?: string;
  name?: string;
  birth_date?: string;
  age_range?: string;
  gender?: string;
  sex?: string;
  height_cm?: number;
  weight_kg?: number;
};

export type UserMedicalProfile = ApiObject & {
  is_pregnant?: boolean;
  is_breastfeeding?: boolean;
  conditions?: string[];
  diseases?: string[];
  medications?: string[];
  allergies?: string[];
};

export type UserProfile = {
  first_name?: string;
  last_name?: string;
  name?: string;
  birth_date?: string;
  age_range?: string;
  gender?: string;
  activity_level?: string;
  goals?: string[];
  allergies?: string[];
  medical_conditions?: string[];
  dietary_preferences?: string[];
  pregnant?: boolean;
  breastfeeding?: boolean;
  personal?: UserPersonalProfile;
  medical?: UserMedicalProfile;
  [key: string]: unknown;
};

export type UserProfileUpdatePayload = Partial<UserProfile> & ApiObject;

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: UserResponse;
};

export type EmailAvailabilityResponse = {
  available: boolean;
  normalized_email: string;
  reason?: string | null;
  suggestion?: string | null;
};

export type DecideMeResponse = {
  derived_input?: ApiObject;
  input?: ApiObject;
  decision?: ApiObject;
  [key: string]: unknown;
};

export type GoalOptionResponse = {
  id: string;
  label: string;
};

export type RecommendationResponse = {
  id: string;
  user_id: string;
  source: string;
  input: ApiObject;
  decision: ApiObject;
  created_at: string;
};

export type CurrentRecommendationSnapshotResponse = {
  user_id: string;
  source?: string | null;
  input: ApiObject;
  derived_input: ApiObject;
  decision: ApiObject;
  saved_recommendation_id?: string | null;
  saved_at?: string | null;
  intakes: RecommendationIntakeResponse[];
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
  decision: ApiObject;
};

export async function signup(email: string, password: string) {
  const { data } = await api.post<TokenResponse>("/auth/signup", {
    email,
    password,
  });
  return data;
}

export async function checkSignupEmailAvailability(email: string) {
  const { data } = await api.get<EmailAvailabilityResponse>("/auth/check-email", {
    params: { email },
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

export async function updateMyProfile(payload: UserProfileUpdatePayload) {
  const { data } = await api.put<UserResponse>("/users/me/profile", payload);
  return data;
}

export async function getDecisionForMe() {
  const { data } = await api.get<DecideMeResponse>("/decide/me");
  return data;
}

export async function getGoalOptions() {
  const { data } = await api.get<GoalOptionResponse[]>("/meta/goals");
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

export async function getCurrentRecommendationSnapshot() {
  const { data } = await api.get<CurrentRecommendationSnapshotResponse>(
    "/users/me/current-recommendation",
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
  selected_date?: string;
  today_progress: number;
  supplements_taken?: number;
  supplements_total?: number;
  weekly_data: { day: string; completed: boolean }[];
  weekly_completion_data?: { day: string; ymd: string; percent: number }[];
  adherence_data: boolean[];
  evolution_data: { day: number; value: number }[];
  monthly_data: { day: number; intensity: number }[];
  daily_intakes: { time: string; name: string; taken: boolean }[];
  recommendation_id?: string | null;
  expected_supplements?: {
    id: string;
    name: string;
    taken: boolean;
    timing?: string | null;
    dosage?: string | null;
    items: {
      supplement_id: string;
      supplement_name: string;
      objective_key?: string | null;
      objective_label?: string | null;
      timing?: string | null;
      dosage?: string | null;
    }[];
  }[];
};

export async function getProgress(params?: { date?: string }) {
  const { data } = await api.get<ProgressResponse>("/tracking/progress", {
    params,
  });
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

export type HomeQuestionResponse = {
  id: string;
  supplement_id: string;
  supplement_name: string;
  category: string;
  question: string;
  answer: string;
};

export async function getDashboardRandomQuestions(limit = 4) {
  const { data } = await api.get<HomeQuestionResponse[]>("/dashboard/random-questions", {
    params: { limit },
  });
  return data;
}

// ============================================
// ENCYCLOPEDIE
// ============================================

export type EncyclopedieSupplementSummaryResponse = {
  id: string;
  name: string;
  category: string;
  description: string;
  molecules: string[];
};

export type EncyclopedieSupplementDetailResponse =
  EncyclopedieSupplementSummaryResponse & {
    benefits: string[];
    dosage?: string | null;
    sources: string[];
  };

export async function listEncyclopedieSupplements(params?: {
  q?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get<EncyclopedieSupplementSummaryResponse[]>(
    "/encyclopedie/supplements",
    { params },
  );
  return data;
}

export async function getEncyclopedieSupplement(supplementId: string) {
  const { data } = await api.get<EncyclopedieSupplementDetailResponse>(
    `/encyclopedie/supplements/${supplementId}`,
  );
  return data;
}
