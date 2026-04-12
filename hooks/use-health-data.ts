import {
  getCurrentRecommendationSnapshot,
  getDashboardRandomQuestions,
  getProgress,
  saveRecommendationIntakes,
  type CurrentRecommendationSnapshotResponse,
  type HomeQuestionResponse,
  type ProgressResponse,
  type RecommendationIntakeItemInput,
  type RecommendationIntakesBulkResponse,
} from "@/services/api";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  "queryKey" | "queryFn"
>;

export const healthQueryKeys = {
  progress: (date?: string) => ["health", "progress", date ?? "today"] as const,
  progressRoot: () => ["health", "progress"] as const,
  currentRecommendation: () => ["health", "current-recommendation"] as const,
  dashboardQuestions: (token: string | null, limit: number) =>
    ["health", "dashboard-random-questions", token ?? "guest", limit] as const,
};

export function useProgressQuery(
  date?: string,
  options?: QueryOptions<ProgressResponse>,
) {
  return useQuery<ProgressResponse, Error>({
    queryKey: healthQueryKeys.progress(date),
    queryFn: () => getProgress(date ? { date } : undefined),
    ...options,
  });
}

export function useCurrentRecommendationSnapshotQuery(
  options?: QueryOptions<CurrentRecommendationSnapshotResponse>,
) {
  return useQuery<CurrentRecommendationSnapshotResponse, Error>({
    queryKey: healthQueryKeys.currentRecommendation(),
    queryFn: getCurrentRecommendationSnapshot,
    ...options,
  });
}

export function useDashboardRandomQuestionsQuery(
  token: string | null,
  limit = 4,
  options?: QueryOptions<HomeQuestionResponse[]>,
) {
  return useQuery<HomeQuestionResponse[], Error>({
    queryKey: healthQueryKeys.dashboardQuestions(token, limit),
    queryFn: () => getDashboardRandomQuestions(limit),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    ...options,
  });
}

export function useSaveRecommendationIntakesMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    RecommendationIntakesBulkResponse,
    Error,
    { recommendationId: string; intakes: RecommendationIntakeItemInput[] }
  >({
    mutationFn: ({ recommendationId, intakes }) =>
      saveRecommendationIntakes(recommendationId, intakes),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.currentRecommendation() }),
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.progressRoot() }),
      ]);
    },
  });
}
