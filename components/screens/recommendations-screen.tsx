import { HeaderLogoutButton } from "@/components/header-logout-button";
import { useAuth } from "@/context/auth";
import {
  useCurrentRecommendationSnapshotQuery,
  useProgressQuery,
  useSaveRecommendationIntakesMutation,
} from "@/hooks/use-health-data";
import {
  formatParisDateTime,
  formatParisTime,
  formatParisYmd,
  getCurrentParisTimestamp,
} from "@/utils/paris-time";
import {
  buildBulkIntakePayload,
  buildTakenByGroupId,
  buildTakenBySupplementId,
} from "@/utils/progress-sync";
import {
  type ProgressResponse,
  type RecommendationIntakeResponse,
} from "@/services/api";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Moon,
  Sun,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Timing = "morning" | "evening" | "both" | "unspecified";
type RecommendationGradeSource = "explicit" | "inferred" | "none";

type Supplement = {
  id: string;
  name: string;
  dosage: string;
  timing: Timing;
  reason: string;
  molecules: string[];
  warnings?: string;
  taken: boolean;
  coveredSymptoms: string[];
  score: number;
  scoreSymptoms: number;
  grade: string;
  gradeScore: number;
  gradeSource: RecommendationGradeSource;
  categoryType: string;
};

type ObjectivePlan = {
  key: string;
  label: string;
  supplements: Supplement[];
};

type SupplementHistoryEntry = {
  id: string;
  supplementId: string;
  supplementName: string;
  objectiveKey: string;
  objectiveLabel: string;
  taken: boolean;
  timestamp: string;
};

type AnyRecord = Record<string, any>;

type RecommendationsScreenProps = {
  onOpenSupplementInEncyclopedie?: (target: {
    id: string;
    name: string;
  }) => void;
};

const OBJECTIVE_LABELS: Record<string, string> = {
  mood_depression_support: "Ameliorer mon humeur",
  stress_anxiety_support: "Gerer le stress et l'anxiete",
  sleep_support: "Ameliorer mon sommeil",
  weight_loss: "Perdre du poids",
  appetite_control: "Controler mon appetit",
  energy_fatigue: "Augmenter mon energie",
  focus_cognition: "Ameliorer ma concentration et memoire",
  digestion_gut: "Ameliorer ma digestion",
  immune_support: "Renforcer mon immunite",
  muscle_gain_strength: "Gagner en muscle et force",
  pain_inflammation: "Reduire douleurs et inflammations",
  migraine_headache: "Prevenir migraines et maux de tete",
  insomnia: "Insomnie",
  depression: "Depression",
  stress: "Stress",
  fatigue: "Fatigue",
  anxiety: "Anxiete",
  migraine: "Migraine",
};

function asRecord(value: unknown): AnyRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as AnyRecord;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupeKeepOrder(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = normalizeObjectiveKey(value);
    if (!normalized) return false;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeTextToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeObjectiveKey(value: string) {
  const token = normalizeTextToken(value);
  if (!token) return "";

  if (
    token.includes("sleep support") ||
    token.includes("sleep health") ||
    token.includes("sommeil") ||
    token.includes("insomni") ||
    token.includes("sleep")
  ) {
    return "sleep_support";
  }
  if (
    token.includes("stress") ||
    token.includes("anxiete") ||
    token.includes("anxiety")
  ) {
    return "stress_anxiety_support";
  }
  if (
    token.includes("mood") ||
    token.includes("humeur") ||
    token.includes("depression")
  ) {
    return "mood_depression_support";
  }
  if (
    token.includes("weight") ||
    token.includes("poids") ||
    token.includes("obesite") ||
    token.includes("surpoids")
  ) {
    return "weight_loss";
  }
  if (token.includes("appetit") || token.includes("appetite")) {
    return "appetite_control";
  }
  if (
    token.includes("energie") ||
    token.includes("energy") ||
    token.includes("fatigue")
  ) {
    return "energy_fatigue";
  }
  if (
    token.includes("focus") ||
    token.includes("cognition") ||
    token.includes("concentration") ||
    token.includes("memoire")
  ) {
    return "focus_cognition";
  }
  if (
    token.includes("digestion") ||
    token.includes("digestive") ||
    token.includes("intestin")
  ) {
    return "digestion_gut";
  }
  if (token.includes("immun")) {
    return "immune_support";
  }
  if (token.includes("muscle") || token.includes("force")) {
    return "muscle_gain_strength";
  }
  if (
    token.includes("douleur") ||
    token.includes("inflammation") ||
    token.includes("arthrose") ||
    token.includes("arthrite")
  ) {
    return "pain_inflammation";
  }
  if (token.includes("migraine") || token.includes("cephale")) {
    return "migraine_headache";
  }

  return token.replace(/\s+/g, "_");
}
function prettifyObjectiveLabel(value: string) {
  const readable = value.replace(/_/g, " ").trim();
  if (!readable) return "Objectif";
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function objectiveLabel(goal: string) {
  const normalizedKey = normalizeObjectiveKey(goal);
  return (
    OBJECTIVE_LABELS[normalizedKey] ??
    prettifyObjectiveLabel(normalizedKey || goal)
  );
}

function inferTiming(value: unknown): Timing {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  const hasMorning =
    normalized.includes("morning") || normalized.includes("matin");
  const hasEvening =
    normalized.includes("evening") ||
    normalized.includes("night") ||
    normalized.includes("soir") ||
    normalized.includes("nuit");

  if (hasMorning && hasEvening) return "both";
  if (hasMorning) return "morning";
  if (hasEvening) return "evening";
  return "unspecified";
}

function toInt(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return fallback;
}

function normalizeRecommendationGrade(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toUpperCase();
  return ["A", "B", "C", "D"].includes(normalized) ? normalized : "";
}

function gradeToScore(grade: string) {
  switch (normalizeRecommendationGrade(grade)) {
    case "A":
      return 4;
    case "B":
      return 3;
    case "C":
      return 2;
    case "D":
      return 1;
    default:
      return 0;
  }
}

function normalizeRecommendationGradeSource(
  value: unknown,
): RecommendationGradeSource {
  if (value === "explicit" || value === "inferred" || value === "none") {
    return value;
  }
  return "none";
}

function formatGradeSource(source: RecommendationGradeSource) {
  switch (source) {
    case "explicit":
      return "Grade explicite";
    case "inferred":
      return "Grade estime";
    default:
      return "Grade indisponible";
  }
}

function formatCoverageLabel(scoreSymptoms: number) {
  return `${scoreSymptoms} symptome${scoreSymptoms > 1 ? "s" : ""} couvert${scoreSymptoms > 1 ? "s" : ""}`;
}

function extractRecommendationObjectiveKeys(recommendation: AnyRecord) {
  const explicitObjective = firstString(
    recommendation.objectif,
    recommendation.goal,
    recommendation.objective,
    recommendation.cible,
    recommendation.target_goal,
  );

  return dedupeKeepOrder(
    [
      ...toStringArray(recommendation.symptomes_couverts),
      ...toStringArray(recommendation.covered_symptoms),
      ...toStringArray(recommendation.objectifs),
      ...toStringArray(recommendation.goals),
      ...(explicitObjective ? [explicitObjective] : []),
    ].filter(Boolean),
  );
}

function mapRawRecommendationToSupplement(
  raw: AnyRecord,
  objectiveKey: string,
  index: number,
): Supplement {
  const coveredSymptoms = dedupeKeepOrder(
    toStringArray(raw.symptomes_couverts ?? raw.covered_symptoms),
  );

  const name =
    firstString(
      raw.produit,
      raw.nom,
      raw.name,
      raw.supplement,
      raw.intervention,
      raw.title,
      raw.titre,
      raw.label,
    ) ?? `Recommandation ${index + 1}`;

  const dosage =
    firstString(
      raw.posologie,
      raw.dosage,
      raw.dose,
      raw.quantity,
      raw.quantite,
    ) ?? "A definir";

  const reason =
    firstString(
      raw.justification,
      raw.reason,
      raw.rationale,
      raw.why,
      raw.description,
    ) ??
    (coveredSymptoms.length > 0
      ? `Couvre: ${coveredSymptoms.join(", ")}`
      : "Recommandation issue de votre profil.");

  const molecules = toStringArray(
    raw.molecules ?? raw.actifs ?? raw.active_compounds ?? raw.ingredients,
  );

  const warnings = firstString(
    raw.warning,
    raw.warnings,
    raw.precaution,
    raw.precautions,
    raw.alert,
  );

  const rawId = firstString(raw.id, raw._id, raw.code) ?? String(index);
  const id = `${normalizeObjectiveKey(objectiveKey)}::${rawId}`;
  const grade = normalizeRecommendationGrade(raw.grade);
  const scoreSymptoms = toInt(
    raw.score_symptomes ?? raw.score,
    coveredSymptoms.length,
  );
  const gradeScore = toInt(raw.grade_score, gradeToScore(grade));
  const gradeSource = normalizeRecommendationGradeSource(raw.grade_source);
  const categoryType =
    firstString(raw.category_type, raw.categoryType, raw.type) ??
    "recommendation";

  return {
    id,
    name,
    dosage,
    timing: inferTiming(raw.timing ?? raw.time ?? raw.moment),
    reason,
    molecules,
    warnings: warnings ?? undefined,
    taken: Boolean(raw.taken ?? raw.is_taken),
    coveredSymptoms,
    score: toInt(raw.score, scoreSymptoms),
    scoreSymptoms,
    grade,
    gradeScore,
    gradeSource,
    categoryType,
  };
}

function normalizeObjectivePlanMap(input: AnyRecord) {
  const output: Record<string, AnyRecord[]> = {};

  for (const [goalKey, rawValue] of Object.entries(input)) {
    let items: unknown[] = [];

    if (Array.isArray(rawValue)) {
      items = rawValue;
    } else {
      const valueRecord = asRecord(rawValue);
      if (valueRecord) {
        const nestedCandidates = [
          valueRecord.recommendations,
          valueRecord.supplements,
          valueRecord.interventions,
          valueRecord.plan,
          valueRecord.items,
          valueRecord.results,
        ];
        const firstArray = nestedCandidates.find((candidate) =>
          Array.isArray(candidate),
        );
        if (Array.isArray(firstArray)) items = firstArray;
      }
    }

    output[goalKey] = items
      .map((item) => asRecord(item))
      .filter((item): item is AnyRecord => Boolean(item));
  }

  return output;
}

function extractFlatRecommendations(root: AnyRecord) {
  const decision = asRecord(root.decision) ?? {};
  const candidates = [
    root.recommendations,
    root.supplements,
    root.interventions,
    decision.recommendations,
    decision.supplements,
    decision.interventions,
  ];
  const found = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(found)) return [];
  return found
    .map((item) => asRecord(item))
    .filter((item): item is AnyRecord => Boolean(item));
}

function extractGroupedRecommendations(data: unknown) {
  const root = asRecord(data);
  if (!root) return {} as Record<string, AnyRecord[]>;

  const decision = asRecord(root.decision) ?? {};
  const groupedCandidates = [
    root.plan_par_objectif,
    root.plan_by_goal,
    root.recommendations_by_goal,
    root.par_objectif,
    decision.plan_par_objectif,
    decision.plan_by_goal,
    decision.recommendations_by_goal,
    decision.par_objectif,
  ];

  for (const candidate of groupedCandidates) {
    const candidateRecord = asRecord(candidate);
    if (!candidateRecord) continue;
    const normalized = normalizeObjectivePlanMap(candidateRecord);
    if (Object.keys(normalized).length > 0) return normalized;
  }

  const fallbackObjectives = extractObjectivesFromDecisionResponse(root);
  const groupedFromFlat: Record<string, AnyRecord[]> = {};

  for (const recommendation of extractFlatRecommendations(root)) {
    const objectiveKeys = extractRecommendationObjectiveKeys(recommendation);

    const targets =
      objectiveKeys.length > 0
        ? objectiveKeys
        : fallbackObjectives.length === 1
          ? fallbackObjectives
          : ["autres"];

    for (const target of targets) {
      if (!groupedFromFlat[target]) groupedFromFlat[target] = [];
      groupedFromFlat[target].push(recommendation);
    }
  }

  return groupedFromFlat;
}

function extractGoalsFromProfile(profile: unknown) {
  const profileRecord = asRecord(profile) ?? {};
  return toStringArray(profileRecord.goals);
}

function extractObjectivesFromDecisionResponse(data: unknown) {
  const root = asRecord(data);
  if (!root) return [];

  const decision = asRecord(root.decision) ?? {};
  const derivedInput =
    asRecord(root.derived_input) ?? asRecord(root.input) ?? {};
  const decisionInput = asRecord(decision.input) ?? {};

  return dedupeKeepOrder([
    ...toStringArray(root.goals),
    ...toStringArray(decision.goals),
    ...toStringArray(derivedInput.goals),
    ...toStringArray(derivedInput.objectifs),
    ...toStringArray(derivedInput.objectives),
    ...toStringArray(derivedInput.symptomes),
    ...toStringArray(derivedInput.symptoms),
    ...toStringArray(decisionInput.symptomes),
    ...toStringArray(decisionInput.symptoms),
    ...toStringArray(decisionInput.symptomes_utilises),
    ...toStringArray(decisionInput.symptoms_used),
  ]);
}

function extractSavedRecommendationId(data: unknown): string | null {
  const root = asRecord(data);
  if (!root) return null;

  const id = firstString(
    root.saved_recommendation_id,
    root.recommendation_id,
    root.recommendationId,
    root.id,
  );
  return id ?? null;
}

function extractBestRecommendation(data: unknown) {
  const root = asRecord(data);
  if (!root) return null;

  const decision = asRecord(root.decision) ?? {};
  const rawBest =
    asRecord(decision.best_decision) ?? asRecord(root.best_decision);
  if (!rawBest) return null;

  const objectiveKeys = extractRecommendationObjectiveKeys(rawBest).map((value) =>
    normalizeObjectiveKey(value),
  );
  const objectiveKey =
    objectiveKeys.find(Boolean) ??
    normalizeObjectiveKey(
      firstString(rawBest.goal, rawBest.objectif, rawBest.objective) ?? "autres",
    ) ??
    "autres";

  const complementTakenTimes = Array.isArray(rawBest.complement_taken_times)
    ? rawBest.complement_taken_times
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .slice(0, 5)
    : [];

  return {
    supplement: mapRawRecommendationToSupplement(rawBest, objectiveKey, 0),
    objectiveKeys: objectiveKeys.filter(Boolean),
    complementTakenTimes,
  };
}

function extractBestRecommendationForGoal(
  data: unknown,
  objectiveKey: string,
) {
  const root = asRecord(data);
  if (!root) return null;

  const decision = asRecord(root.decision) ?? {};
  const bestByGoal =
    asRecord(decision.best_decision_by_goal) ??
    asRecord(root.best_decision_by_goal);
  if (!bestByGoal) return null;

  for (const [goalKey, rawItem] of Object.entries(bestByGoal)) {
    if (normalizeObjectiveKey(goalKey) !== objectiveKey) continue;

    const bestItem = asRecord(rawItem);
    if (!bestItem) return null;

    const complementTakenTimes = Array.isArray(bestItem.complement_taken_times)
      ? bestItem.complement_taken_times
          .filter(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0,
          )
          .slice(0, 5)
      : [];

    return {
      supplement: mapRawRecommendationToSupplement(bestItem, objectiveKey, 0),
      objectiveKeys: [objectiveKey],
      complementTakenTimes,
    };
  }

  return null;
}

function formatHistoryDateTime(isoTimestamp: string) {
  return formatParisDateTime(isoTimestamp);
}

function mapIntakeToHistoryEntry(
  intake: RecommendationIntakeResponse,
  fallbackIndex = 0,
): SupplementHistoryEntry {
  const objectiveKeyRaw = intake.objective_key?.trim() || "autres";
  const objectiveKey = normalizeObjectiveKey(objectiveKeyRaw);
  const objectiveLabelText =
    intake.objective_label?.trim() || objectiveLabel(objectiveKeyRaw);
  const supplementId =
    intake.supplement_id?.trim() || `${objectiveKey}::${intake.supplement_name}`;
  const timestamp = intake.taken_at || intake.created_at;

  return {
    id: intake.id || `${supplementId}-${timestamp}-${fallbackIndex}`,
    supplementId,
    supplementName: intake.supplement_name,
    objectiveKey,
    objectiveLabel: objectiveLabelText,
    taken: Boolean(intake.taken),
    timestamp,
  };
}

function formatHistoryTime(isoTimestamp: string) {
  return formatParisTime(isoTimestamp);
}

function extractApiErrorMessage(error: any) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return null;
        const path = Array.isArray(item.loc) ? item.loc.join(".") : null;
        const message =
          typeof item.msg === "string" && item.msg.trim() ? item.msg.trim() : null;
        if (path && message) return `${path}: ${message}`;
        return message ?? path;
      })
      .filter((item): item is string => Boolean(item))
      .join("\n");
  }
  return null;
}

export function RecommendationsScreen({
  onOpenSupplementInEncyclopedie,
}: RecommendationsScreenProps) {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedObjectiveKey, setSelectedObjectiveKey] = useState<
    string | null
  >(null);
  const [takenById, setTakenById] = useState<Record<string, boolean>>({});
  const [takenByGroupId, setTakenByGroupId] = useState<Record<string, boolean>>({});
  const [pendingTakenAtById, setPendingTakenAtById] = useState<
    Record<string, string>
  >({});
  const [pendingTakenAtByGroupId, setPendingTakenAtByGroupId] = useState<
    Record<string, string>
  >({});
  const [supplementHistory, setSupplementHistory] = useState<
    SupplementHistoryEntry[]
  >([]);
  const [decisionData, setDecisionData] = useState<AnyRecord | null>(null);
  const [todayProgress, setTodayProgress] = useState<ProgressResponse | null>(null);
  const currentRecommendationQuery = useCurrentRecommendationSnapshotQuery({
    enabled: Boolean(token),
  });
  const todayProgressQuery = useProgressQuery(undefined, {
    enabled: Boolean(token),
  });
  const saveIntakesMutation = useSaveRecommendationIntakesMutation();

  const loading =
    Boolean(token) &&
    (currentRecommendationQuery.isLoading || todayProgressQuery.isLoading);
  const error =
    currentRecommendationQuery.error?.message ??
    todayProgressQuery.error?.message ??
    null;
  const isSubmittingTake = saveIntakesMutation.isPending;

  const applyLoadedState = (
    data: AnyRecord,
    progress: ProgressResponse,
  ) => {
    const savedIntakes = Array.isArray(data.intakes) ? data.intakes : [];
    const todayTakenByGroupId = buildTakenByGroupId(progress.expected_supplements);
    const todayTakenById = buildTakenBySupplementId(progress.expected_supplements);

    const historyFromDb = savedIntakes
      .map((intake, index) => mapIntakeToHistoryEntry(intake, index))
      .slice(0, 100);

    setDecisionData(data);
    setTodayProgress(progress);
    setTakenByGroupId(todayTakenByGroupId);
    setTakenById(todayTakenById);
    setPendingTakenAtById({});
    setPendingTakenAtByGroupId({});
    setSupplementHistory(historyFromDb);
  };

  useEffect(() => {
    if (token) return;
    setDecisionData(null);
    setTodayProgress(null);
    setTakenByGroupId({});
    setTakenById({});
    setPendingTakenAtById({});
    setPendingTakenAtByGroupId({});
    setSupplementHistory([]);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (!currentRecommendationQuery.data || !todayProgressQuery.data) return;
    applyLoadedState(currentRecommendationQuery.data, todayProgressQuery.data);
  }, [token, currentRecommendationQuery.data, todayProgressQuery.data]);

  const objectives = useMemo(() => {
    const profileGoals = extractGoalsFromProfile(user?.profile);
    const decisionGoals = extractObjectivesFromDecisionResponse(decisionData);
    return dedupeKeepOrder([...profileGoals, ...decisionGoals]);
  }, [user?.profile, decisionData]);

  const objectivePlans = useMemo(() => {
    const grouped = extractGroupedRecommendations(decisionData);
    const groupedByNormalizedKey = new Map<string, AnyRecord[]>();

    for (const [key, recommendations] of Object.entries(grouped)) {
      const normalizedKey = normalizeObjectiveKey(key);
      if (!normalizedKey) continue;
      if (!Array.isArray(recommendations) || recommendations.length === 0) continue;

      const existing = groupedByNormalizedKey.get(normalizedKey) ?? [];
      groupedByNormalizedKey.set(normalizedKey, [...existing, ...recommendations]);
    }

    const orderedObjectives = dedupeKeepOrder([...objectives, ...Object.keys(grouped)])
      .map((objectiveKey) => normalizeObjectiveKey(objectiveKey))
      .filter(Boolean);

    const orderedKeys = dedupeKeepOrder([
      ...orderedObjectives,
      ...Array.from(groupedByNormalizedKey.keys()),
    ]);

    return orderedKeys.map((objectiveKey) => {
      const recommendations = groupedByNormalizedKey.get(objectiveKey) ?? [];
      const seenSupplementIds = new Set<string>();
      const seenSupplementNames = new Set<string>();
      const supplements: Supplement[] = [];

      for (let index = 0; index < recommendations.length; index += 1) {
        const supplement = mapRawRecommendationToSupplement(
          recommendations[index],
          objectiveKey,
          index,
        );
        const normalizedName = normalizeTextToken(supplement.name);

        if (seenSupplementIds.has(supplement.id)) continue;
        if (normalizedName && seenSupplementNames.has(normalizedName)) continue;

        seenSupplementIds.add(supplement.id);
        if (normalizedName) seenSupplementNames.add(normalizedName);
        supplements.push(supplement);
      }

      return {
        key: objectiveKey,
        label: objectiveLabel(objectiveKey),
        supplements,
      } satisfies ObjectivePlan;
    }).filter((plan) => plan.supplements.length > 0);
  }, [decisionData, objectives]);

  const bestRecommendation = useMemo(() => {
    if (selectedObjectiveKey) {
      const bestForGoal = extractBestRecommendationForGoal(
        decisionData,
        selectedObjectiveKey,
      );
      if (bestForGoal) return bestForGoal;

      const selectedPlan = objectivePlans.find(
        (plan) => normalizeObjectiveKey(plan.key) === selectedObjectiveKey,
      );
      if (selectedPlan?.supplements.length) {
        return {
          supplement: selectedPlan.supplements[0],
          objectiveKeys: [selectedObjectiveKey],
          complementTakenTimes: [],
        };
      }
      return null;
    }

    const globalBest = extractBestRecommendation(decisionData);
    if (globalBest) return globalBest;

    const firstPlan = objectivePlans.find((plan) => plan.supplements.length > 0);
    if (!firstPlan) return null;

    return {
      supplement: firstPlan.supplements[0],
      objectiveKeys: [normalizeObjectiveKey(firstPlan.key)],
      complementTakenTimes: [],
    };
  }, [decisionData, objectivePlans, selectedObjectiveKey]);

  useEffect(() => {
    if (!selectedObjectiveKey) return;

    const stillExists = objectivePlans.some(
      (plan) => normalizeObjectiveKey(plan.key) === selectedObjectiveKey,
    );

    if (!stillExists) {
      setSelectedObjectiveKey(null);
    }
  }, [objectivePlans, selectedObjectiveKey]);

  const visibleObjectivePlans = useMemo(() => {
    if (!selectedObjectiveKey) return objectivePlans;

    return objectivePlans.filter(
      (plan) => normalizeObjectiveKey(plan.key) === selectedObjectiveKey,
    );
  }, [objectivePlans, selectedObjectiveKey]);

  const visiblePlanGroups = useMemo(() => {
    const groups = todayProgress?.expected_supplements ?? [];
    if (!selectedObjectiveKey) return groups;

    return groups.filter((group) =>
      (group.items ?? []).some(
        (item) => normalizeObjectiveKey(item.objective_key ?? "") === selectedObjectiveKey,
      ),
    );
  }, [selectedObjectiveKey, todayProgress?.expected_supplements]);

  const takenSupplements = useMemo(
    () => visiblePlanGroups.filter((supplement) => supplement.taken),
    [visiblePlanGroups],
  );

  const notTakenSupplements = useMemo(
    () => visiblePlanGroups.filter((supplement) => !supplement.taken),
    [visiblePlanGroups],
  );

  const visibleHistory = useMemo(() => {
    if (!selectedObjectiveKey) return supplementHistory;

    return supplementHistory.filter(
      (entry) => entry.objectiveKey === selectedObjectiveKey,
    );
  }, [supplementHistory, selectedObjectiveKey]);

  const recentHistory = useMemo(
    () => visibleHistory.slice(0, 8),
    [visibleHistory],
  );
  const takenByNameKey = useMemo(() => {
    const next: Record<string, boolean> = {};
    for (const group of todayProgress?.expected_supplements ?? []) {
      const key = normalizeTextToken(group.name);
      if (!key) continue;
      next[key] = Boolean(group.taken);
    }
    return next;
  }, [todayProgress?.expected_supplements]);
  const latestTakenAtBySupplementId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of supplementHistory) {
      if (!entry.taken) continue;
      if (map[entry.supplementId]) continue;
      map[entry.supplementId] = entry.timestamp;
    }
    return map;
  }, [supplementHistory]);
  const latestTakenAtByNameKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of supplementHistory) {
      if (!entry.taken) continue;
      const key = normalizeTextToken(entry.supplementName);
      if (!key || map[key]) continue;
      map[key] = entry.timestamp;
    }
    return map;
  }, [supplementHistory]);
  const linkedSupplementIdsById = useMemo(() => {
    const idsByName = new Map<string, string[]>();

    for (const plan of objectivePlans) {
      for (const supplement of plan.supplements) {
        const nameKey = normalizeTextToken(supplement.name);
        if (!nameKey) continue;
        const existing = idsByName.get(nameKey) ?? [];
        existing.push(supplement.id);
        idsByName.set(nameKey, existing);
      }
    }

    const linkedById: Record<string, string[]> = {};
    for (const ids of idsByName.values()) {
      const uniqueIds = Array.from(new Set(ids));
      for (const id of uniqueIds) {
        linkedById[id] = uniqueIds;
      }
    }
    return linkedById;
  }, [objectivePlans]);

  const takenCount = takenSupplements.length;
  const totalSupplements = visiblePlanGroups.length;
  const pendingCount = Math.max(totalSupplements - takenCount, 0);
  const takenPreview = takenSupplements.slice(0, 6);
  const notTakenPreview = notTakenSupplements.slice(0, 6);
  const remainingTaken = Math.max(takenSupplements.length - takenPreview.length, 0);
  const remainingNotTaken = Math.max(
    notTakenSupplements.length - notTakenPreview.length,
    0,
  );

  const pendingTakeSubmission = useMemo(() => {
    const groups = todayProgress?.expected_supplements ?? [];
    const changedGroupIds: string[] = [];
    const nextTakenByGroupId: Record<string, boolean> = {};
    const nextTakenAtByGroupId: Record<string, string> = {};

    for (const group of groups) {
      const currentTaken = Boolean(group.taken);
      const itemStates = (group.items ?? [])
        .map((item) => takenById[item.supplement_id])
        .filter((value): value is boolean => typeof value === "boolean");
      const localGroupTaken = takenByGroupId[group.id];
      const nextTaken =
        typeof localGroupTaken === "boolean"
          ? localGroupTaken
          : itemStates.length > 0
          ? itemStates.some(Boolean)
          : currentTaken;

      nextTakenByGroupId[group.id] = nextTaken;

      const takenAt =
        pendingTakenAtByGroupId[group.id] ??
        (group.items ?? [])
          .map((item) => pendingTakenAtById[item.supplement_id])
          .find((value): value is string => typeof value === "string" && value.length > 0);
      if (takenAt) {
        nextTakenAtByGroupId[group.id] = takenAt;
      }

      if (nextTaken !== currentTaken) {
        changedGroupIds.push(group.id);
      }
    }

    const anchorYmd = todayProgress?.selected_date ?? formatParisYmd(new Date());
    const payload = buildBulkIntakePayload({
      groups,
      changedGroupIds,
      takenByGroupId: nextTakenByGroupId,
      takenAtByGroupId: nextTakenAtByGroupId,
      selectedYmd: anchorYmd,
      anchorYmd,
    });

    return {
      changedGroupIds,
      payload,
    };
  }, [
    todayProgress?.expected_supplements,
    todayProgress?.selected_date,
    takenByGroupId,
    takenById,
    pendingTakenAtById,
    pendingTakenAtByGroupId,
  ]);
  const pendingTakeChangesCount = pendingTakeSubmission.changedGroupIds.length;
  const savedRecommendationId = useMemo(
    () => extractSavedRecommendationId(decisionData),
    [decisionData],
  );
  const canSubmitTake =
    pendingTakeSubmission.payload.length > 0 &&
    !isSubmittingTake &&
    Boolean(savedRecommendationId);

  const toggleTaken = (supplement: Supplement, currentState: boolean) => {
    const nextState = !currentState;
    const toggledAt = getCurrentParisTimestamp();
    const linkedIds = linkedSupplementIdsById[supplement.id] ?? [supplement.id];
    const groupId = normalizeTextToken(supplement.name);

    setTakenById((prev) => ({
      ...prev,
      ...Object.fromEntries(linkedIds.map((id) => [id, nextState])),
    }));
    if (groupId) {
      setTakenByGroupId((prev) => ({
        ...prev,
        [groupId]: nextState,
      }));
    }
    setPendingTakenAtById((prev) => ({
      ...prev,
      ...Object.fromEntries(linkedIds.map((id) => [id, toggledAt])),
    }));
    if (groupId) {
      setPendingTakenAtByGroupId((prev) => ({
        ...prev,
        [groupId]: toggledAt,
      }));
    }
  };

  const submitTakenSupplements = async () => {
    if (pendingTakeSubmission.payload.length === 0 || isSubmittingTake) return;

    const recommendationId = savedRecommendationId;
    if (!recommendationId) {
      Alert.alert(
        "Enregistrement indisponible",
        "Aucune recommandation sauvegardee n'a ete trouvee pour cette session.",
      );
      return;
    }

    try {
      await saveIntakesMutation.mutateAsync({
        recommendationId,
        intakes: pendingTakeSubmission.payload,
      });
      await Promise.all([
        currentRecommendationQuery.refetch(),
        todayProgressQuery.refetch(),
      ]);

      Alert.alert(
        "Prises enregistrees",
        `${pendingTakeChangesCount} modification${pendingTakeChangesCount > 1 ? "s" : ""} enregistree${pendingTakeChangesCount > 1 ? "s" : ""}.`,
      );
    } catch (e: any) {
      Alert.alert(
        "Erreur",
        extractApiErrorMessage(e) ??
          "Impossible d'enregistrer les prises pour le moment.",
      );
    }
  };

  const selectedObjectiveLabel = selectedObjectiveKey
    ? objectiveLabel(selectedObjectiveKey)
    : null;

  return (
    <ScrollView
      className="flex-1 bg-aja-cream"
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 24 }]}
    >
      <View
        className="rounded-b-3xl bg-aja-ink px-6 py-6"
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Recommandations</Text>
            <Text style={styles.headerSubtitle}>Plan personnalise</Text>
          </View>
          <HeaderLogoutButton />
        </View>
      </View>

      <View className="-mt-4 gap-4 px-6" style={styles.mainContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vos objectifs</Text>
          <Text style={styles.cardSubtitle}>
            Touchez un objectif pour filtrer son plan de supplementation.
          </Text>
          {objectivePlans.length > 0 ? (
            <View style={styles.goalsContainer}>
              <TouchableOpacity
                onPress={() => setSelectedObjectiveKey(null)}
                style={[
                  styles.goalBadge,
                  selectedObjectiveKey === null && styles.goalBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.goalLabel,
                    selectedObjectiveKey === null && styles.goalLabelActive,
                  ]}
                >
                  Tous
                </Text>
              </TouchableOpacity>
              {objectivePlans.map((plan) => (
                <TouchableOpacity
                  key={plan.key}
                  onPress={() => {
                    const normalizedGoal = normalizeObjectiveKey(plan.key);
                    setSelectedObjectiveKey((prev) =>
                      prev === normalizedGoal ? null : normalizedGoal,
                    );
                  }}
                  style={[
                    styles.goalBadge,
                    selectedObjectiveKey === normalizeObjectiveKey(plan.key) &&
                      styles.goalBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.goalLabel,
                      selectedObjectiveKey === normalizeObjectiveKey(plan.key) &&
                        styles.goalLabelActive,
                    ]}
                  >
                    {plan.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Aucun objectif avec recommandations pour le moment.
            </Text>
          )}
          {selectedObjectiveLabel && (
            <Text style={styles.filterInfo}>
              Filtre actif: {selectedObjectiveLabel}
            </Text>
          )}
        </View>

        {!loading && !error && (
          <View style={styles.overviewCard}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {visibleObjectivePlans.length}
              </Text>
              <Text style={styles.overviewLabel}>Objectifs</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{takenCount}</Text>
              <Text style={styles.overviewLabel}>Pris</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{pendingCount}</Text>
              <Text style={styles.overviewLabel}>A prendre</Text>
            </View>
          </View>
        )}

        {!loading && !error && bestRecommendation && (
          <View style={styles.bestCard}>
            <Text style={styles.bestTitle}>
              {selectedObjectiveLabel
                ? "Meilleure recommandation pour cet objectif"
                : "Meilleure recommandation"}
            </Text>
            <Text style={styles.bestProduct}>{bestRecommendation.supplement.name}</Text>
            <View style={styles.bestMetaRow}>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>
                  {formatCoverageLabel(bestRecommendation.supplement.scoreSymptoms)}
                </Text>
              </View>
              {bestRecommendation.supplement.grade ? (
                <View style={styles.bestBadge}>
                  <Text style={styles.bestBadgeText}>
                    Grade {bestRecommendation.supplement.grade}
                  </Text>
                </View>
              ) : null}
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>
                  {formatGradeSource(bestRecommendation.supplement.gradeSource)}
                </Text>
              </View>
            </View>

            {bestRecommendation.supplement.coveredSymptoms.length > 0 && (
              <View style={styles.bestMetaRow}>
                {bestRecommendation.supplement.coveredSymptoms.map((symptom) => (
                  <View
                    key={`best-${bestRecommendation.supplement.id}-${symptom}`}
                    style={styles.bestSymptomBadge}
                  >
                    <Text style={styles.bestSymptomText}>{symptom}</Text>
                  </View>
                ))}
              </View>
            )}

            {bestRecommendation.complementTakenTimes.length > 0 && (
              <View style={styles.bestTimesSection}>
                <Text style={styles.bestTimesTitle}>Dernieres prises enregistrees</Text>
                {bestRecommendation.complementTakenTimes.map((timestamp) => (
                  <Text
                    key={`${bestRecommendation.supplement.id}-${timestamp}`}
                    style={styles.bestTimesItem}
                  >
                    {formatHistoryDateTime(timestamp)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.statusCard}>
            <ActivityIndicator color="#7ea69d" />
            <Text style={styles.statusText}>Chargement du plan...</Text>
          </View>
        ) : error ? (
          <View style={styles.statusCard}>
            <AlertTriangle size={18} color="#bea262" />
            <Text style={styles.statusText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.supplementsSection}>
            <Text style={styles.sectionTitle}>
              Plan de supplementation par objectif
            </Text>
            <Text style={styles.sectionSubtitle}>
              Les complements sont classes par grade, puis par couverture des symptomes. Cochez les complements pris puis validez avec le bouton Enregistrer.
            </Text>

            {visibleObjectivePlans.length === 0 ? (
              <View style={styles.statusCard}>
                <Text style={styles.statusText}>
                  Aucune recommandation disponible pour le moment.
                </Text>
              </View>
            ) : (
              visibleObjectivePlans.map((plan) => (
                <View key={plan.key} style={styles.objectiveSection}>
                  <View style={styles.objectiveHeader}>
                    <Text style={styles.objectiveTitle}>{plan.label}</Text>
                    <View style={styles.objectiveCountBadge}>
                      <Text style={styles.objectiveCountText}>
                        {plan.supplements.length}
                      </Text>
                    </View>
                  </View>

                  {plan.supplements.length === 0 ? (
                    <View style={styles.emptyObjectiveCard}>
                      <Text style={styles.emptyObjectiveText}>
                        Aucun complement recommande pour cet objectif.
                      </Text>
                    </View>
                  ) : (
                    plan.supplements.map((supplement) => {
                      const isExpanded = expandedId === supplement.id;
                      const nameKey = normalizeTextToken(supplement.name);
                      const isTaken =
                        takenById[supplement.id] ??
                        (nameKey ? takenByGroupId[nameKey] : undefined) ??
                        (nameKey ? takenByNameKey[nameKey] : undefined) ??
                        supplement.taken;
                      const latestTakenAt =
                        latestTakenAtBySupplementId[supplement.id] ??
                        (nameKey ? latestTakenAtByNameKey[nameKey] : undefined);

                      return (
                        <View key={supplement.id} style={styles.supplementCard}>
                          <View style={styles.supplementHeader}>
                            <View style={styles.supplementRow}>
                              <TouchableOpacity
                                onPress={() =>
                                  void toggleTaken(
                                    supplement,
                                    Boolean(isTaken),
                                  )
                                }
                                style={[
                                  styles.checkbox,
                                  Boolean(isTaken) && styles.checkboxChecked,
                                ]}
                              >
                                {Boolean(isTaken) && <Check size={16} color="white" />}
                              </TouchableOpacity>

                              <View style={styles.supplementContent}>
                                <View style={styles.supplementTopRow}>
                                  <View style={styles.supplementInfo}>
                                    <View style={styles.supplementTitleRow}>
                                      <Text style={styles.supplementName}>
                                        {supplement.name}
                                      </Text>
                                      <View
                                        style={[
                                          styles.supplementStatusPill,
                                          Boolean(isTaken)
                                            ? styles.supplementStatusPillTaken
                                            : styles.supplementStatusPillPending,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.supplementStatusText,
                                            Boolean(isTaken)
                                              ? styles.supplementStatusTextTaken
                                              : styles.supplementStatusTextPending,
                                          ]}
                                        >
                                          {Boolean(isTaken) ? "Pris" : "A prendre"}
                                        </Text>
                                      </View>
                                    </View>
                                    <View style={styles.supplementMetaRow}>
                                      <View style={styles.supplementDosageBadge}>
                                        <Text style={styles.supplementDosage}>
                                          {supplement.dosage}
                                        </Text>
                                      </View>
                                      <View style={styles.supplementRankingBadge}>
                                        <Text style={styles.supplementRankingText}>
                                          {formatCoverageLabel(supplement.scoreSymptoms)}
                                        </Text>
                                      </View>
                                      {supplement.grade ? (
                                        <View style={styles.supplementRankingBadge}>
                                          <Text style={styles.supplementRankingText}>
                                            Grade {supplement.grade}
                                          </Text>
                                        </View>
                                      ) : null}
                                    </View>
                                    {latestTakenAt && (
                                      <Text style={styles.supplementTakenTime}>
                                        Derniere prise: {formatHistoryDateTime(latestTakenAt)}
                                      </Text>
                                    )}
                                  </View>
                                  <TouchableOpacity
                                    onPress={() =>
                                      setExpandedId(
                                        isExpanded ? null : supplement.id,
                                      )
                                    }
                                    style={styles.expandButton}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp size={20} color="#7ea69d" />
                                    ) : (
                                      <ChevronDown size={20} color="#7ea69d" />
                                    )}
                                  </TouchableOpacity>
                                </View>

                                <View style={styles.timingContainer}>
                                  {(supplement.timing === "morning" ||
                                    supplement.timing === "both") && (
                                    <View style={styles.timingBadge}>
                                      <Sun size={16} color="#dfc485" />
                                      <Text style={styles.timingTextMorning}>
                                        Matin
                                      </Text>
                                    </View>
                                  )}
                                  {(supplement.timing === "evening" ||
                                    supplement.timing === "both") && (
                                    <View style={styles.timingBadge}>
                                      <Moon size={16} color="#7ea69d" />
                                      <Text style={styles.timingTextEvening}>
                                        Soir
                                      </Text>
                                    </View>
                                  )}
                                  {supplement.timing === "unspecified" && (
                                    <Text style={styles.timingTextNeutral}>
                                      Moment non precise
                                    </Text>
                                  )}
                                </View>
                              </View>
                            </View>
                          </View>

                          {isExpanded && (
                            <View style={styles.expandedContent}>
                              <View style={styles.section}>
                                <Text style={styles.sectionLabel}>
                                  Pourquoi ce complement ?
                                </Text>
                                <Text style={styles.sectionText}>
                                  {supplement.reason}
                                </Text>
                              </View>

                              <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Classement</Text>
                                <View style={styles.rankingDetailsContainer}>
                                  <View style={styles.rankingDetailBadge}>
                                    <Text style={styles.rankingDetailText}>
                                      {formatCoverageLabel(supplement.scoreSymptoms)}
                                    </Text>
                                  </View>
                                  {supplement.grade ? (
                                    <View style={styles.rankingDetailBadge}>
                                      <Text style={styles.rankingDetailText}>
                                        Grade {supplement.grade}
                                      </Text>
                                    </View>
                                  ) : null}
                                  <View style={styles.rankingDetailBadge}>
                                    <Text style={styles.rankingDetailText}>
                                      {formatGradeSource(supplement.gradeSource)}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {supplement.molecules.length > 0 && (
                                <View style={styles.section}>
                                  <Text style={styles.sectionLabel}>
                                    Molecules actives
                                  </Text>
                                  <View style={styles.moleculesContainer}>
                                    {supplement.molecules.map((molecule) => (
                                      <View
                                        key={`${supplement.id}-${molecule}`}
                                        style={styles.moleculeTag}
                                      >
                                        <Text style={styles.moleculeText}>
                                          {molecule}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              )}

                              {supplement.warnings && (
                                <View style={styles.warningCard}>
                                  <AlertTriangle
                                    size={16}
                                    color="#bea262"
                                    style={styles.warningIcon}
                                  />
                                  <Text style={styles.warningText}>
                                    {supplement.warnings}
                                  </Text>
                                </View>
                              )}

                              <TouchableOpacity
                                style={styles.learnMoreButton}
                                onPress={() =>
                                  onOpenSupplementInEncyclopedie?.({
                                    id: supplement.id,
                                    name: supplement.name,
                                  })
                                }
                                activeOpacity={0.88}
                              >
                                <Text style={styles.learnMoreText}>
                                  En savoir plus
                                </Text>
                                <ExternalLink size={16} color="#7ea69d" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {!loading && !error && totalSupplements > 0 && (
          <View style={styles.submitCard}>
            <View style={styles.submitHeaderRow}>
              <View style={styles.submitHeaderText}>
                <Text style={styles.submitTitle}>Valider mes prises</Text>
                <Text style={styles.submitHint}>
                  {!savedRecommendationId
                    ? "Rechargez l'ecran pour activer la sauvegarde."
                    : pendingTakeChangesCount > 0
                    ? `${pendingTakeChangesCount} modification${pendingTakeChangesCount > 1 ? "s" : ""} en attente`
                    : "Aucune modification en attente"}
                </Text>
              </View>
              <View style={styles.submitCountBadge}>
                <Text style={styles.submitCountText}>{pendingTakeChangesCount}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmitTake && styles.submitButtonDisabled,
              ]}
              onPress={() => void submitTakenSupplements()}
              disabled={!canSubmitTake}
              activeOpacity={0.9}
            >
              {isSubmittingTake ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Check size={16} color="white" />
              )}
              <Text style={styles.submitButtonText}>
                {isSubmittingTake ? "Enregistrement..." : "Enregistrer mes prises"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && totalSupplements > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Historique des prises</Text>

            <View style={styles.historyGroup}>
              <Text style={styles.historyGroupTitle}>
                Pris ({takenSupplements.length})
              </Text>
              {takenPreview.length > 0 ? (
                <>
                  {takenPreview.map((supplement) => (
                    <View
                      key={`taken-${supplement.id}`}
                      style={styles.historyItemRow}
                    >
                      <View style={[styles.historyDot, styles.historyDotTaken]} />
                      <Text style={styles.historyItem}>{supplement.name}</Text>
                    </View>
                  ))}
                  {remainingTaken > 0 && (
                    <Text style={styles.historyMore}>+{remainingTaken} autres</Text>
                  )}
                </>
              ) : (
                <Text style={styles.historyEmpty}>
                  Aucun complement marque comme pris.
                </Text>
              )}
            </View>

            <View style={styles.historyGroup}>
              <Text style={styles.historyGroupTitle}>
                Non pris ({notTakenSupplements.length})
              </Text>
              {notTakenPreview.length > 0 ? (
                <>
                  {notTakenPreview.map((supplement) => (
                    <View
                      key={`not-taken-${supplement.id}`}
                      style={styles.historyItemRow}
                    >
                      <View style={[styles.historyDot, styles.historyDotPending]} />
                      <Text style={styles.historyItem}>{supplement.name}</Text>
                    </View>
                  ))}
                  {remainingNotTaken > 0 && (
                    <Text style={styles.historyMore}>
                      +{remainingNotTaken} autres
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.historyEmpty}>
                  Tous les complements affiches sont pris.
                </Text>
              )}
            </View>

            {recentHistory.length > 0 && (
              <View style={styles.historyGroup}>
                <Text style={styles.historyGroupTitle}>Dernieres actions</Text>
                {recentHistory.map((entry) => (
                  <View key={entry.id} style={styles.historyActionRow}>
                    <View
                      style={[
                        styles.historyActionBadge,
                        entry.taken
                          ? styles.historyActionBadgeTaken
                          : styles.historyActionBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyActionText,
                          entry.taken
                            ? styles.historyActionTextTaken
                            : styles.historyActionTextPending,
                        ]}
                      >
                        {entry.taken ? "Pris" : "Non pris"}
                      </Text>
                    </View>
                    <Text style={styles.historyItemMeta}>
                      {entry.supplementName} - {entry.objectiveLabel} - {formatHistoryTime(entry.timestamp)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {!loading && !error && totalSupplements > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {`${takenCount} sur ${totalSupplements} complements pris ${
                selectedObjectiveKey ? "dans cet objectif" : "aujourd'hui"
              }`}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef6e2",
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: "#14272d",
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
  },
  headerSubtitle: {
    color: "#b3d3d2",
    fontSize: 14,
    marginTop: 4,
  },
  mainContent: {
    paddingHorizontal: 24,
    marginTop: -16,
    gap: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.05)",
  },
  cardTitle: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#7ea69d",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  goalsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalBadge: {
    backgroundColor: "#e7ede7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.08)",
  },
  goalBadgeActive: {
    backgroundColor: "#14272d",
  },
  goalLabel: {
    fontSize: 14,
    color: "#14272d",
  },
  goalLabelActive: {
    color: "white",
  },
  filterInfo: {
    marginTop: 10,
    color: "#7ea69d",
    fontSize: 12,
  },
  overviewCard: {
    backgroundColor: "#14272d",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  overviewItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  overviewValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  overviewLabel: {
    color: "#b3d3d2",
    fontSize: 12,
  },
  overviewDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(179, 211, 210, 0.35)",
  },
  bestCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(126, 166, 157, 0.24)",
    gap: 10,
  },
  bestTitle: {
    color: "#2f675c",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  bestProduct: {
    color: "#14272d",
    fontSize: 20,
    fontWeight: "700",
  },
  bestMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  bestBadge: {
    backgroundColor: "#e7ede7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(126, 166, 157, 0.4)",
  },
  bestBadgeText: {
    color: "#2f675c",
    fontSize: 12,
    fontWeight: "700",
  },
  bestSymptomBadge: {
    backgroundColor: "rgba(20, 39, 45, 0.06)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bestSymptomText: {
    color: "#14272d",
    fontSize: 12,
    fontWeight: "600",
  },
  bestTimesSection: {
    marginTop: 2,
    gap: 4,
  },
  bestTimesTitle: {
    color: "#2f675c",
    fontSize: 12,
    fontWeight: "700",
  },
  bestTimesItem: {
    color: "#14272d",
    fontSize: 12,
  },
  safetyCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(190, 162, 98, 0.35)",
    gap: 12,
  },
  safetyTitle: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "700",
  },
  safetySection: {
    gap: 6,
  },
  safetySectionTitle: {
    color: "#8b6b2f",
    fontSize: 13,
    fontWeight: "700",
  },
  safetyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  safetyText: {
    color: "#14272d",
    fontSize: 13,
    flex: 1,
  },
  safetyHint: {
    color: "#7ea69d",
    fontSize: 12,
  },
  safetyListText: {
    color: "#14272d",
    fontSize: 13,
  },
  supplementsSection: {
    gap: 12,
  },
  sectionTitle: {
    color: "#14272d",
    fontSize: 16,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    color: "#7ea69d",
    fontSize: 12,
    paddingHorizontal: 4,
    marginTop: -6,
    marginBottom: 4,
  },
  objectiveSection: {
    gap: 8,
  },
  objectiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  objectiveTitle: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "600",
  },
  objectiveCountBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e7ede7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.1)",
  },
  objectiveCountText: {
    color: "#14272d",
    fontSize: 12,
    fontWeight: "700",
  },
  supplementCard: {
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.05)",
    overflow: "hidden",
  },
  supplementHeader: {
    padding: 16,
  },
  supplementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(126, 166, 157, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#7ea69d",
    borderColor: "#7ea69d",
  },
  supplementContent: {
    flex: 1,
  },
  supplementTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  supplementInfo: {
    flex: 1,
  },
  supplementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  supplementName: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  supplementStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  supplementStatusPillTaken: {
    backgroundColor: "rgba(126, 166, 157, 0.18)",
    borderColor: "rgba(126, 166, 157, 0.4)",
  },
  supplementStatusPillPending: {
    backgroundColor: "rgba(223, 196, 133, 0.2)",
    borderColor: "rgba(190, 162, 98, 0.4)",
  },
  supplementStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  supplementStatusTextTaken: {
    color: "#2f675c",
  },
  supplementStatusTextPending: {
    color: "#8b6b2f",
  },
  supplementMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  supplementTakenTime: {
    marginTop: 6,
    color: "#2f675c",
    fontSize: 12,
    fontWeight: "600",
  },
  supplementDosageBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(20, 39, 45, 0.06)",
  },
  supplementDosage: {
    fontSize: 12,
    color: "#7ea69d",
    fontWeight: "600",
  },
  supplementRankingBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#eef3ef",
    borderWidth: 1,
    borderColor: "rgba(126, 166, 157, 0.28)",
  },
  supplementRankingText: {
    fontSize: 12,
    color: "#2f675c",
    fontWeight: "700",
  },
  expandButton: {
    padding: 4,
  },
  timingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timingTextMorning: {
    fontSize: 12,
    color: "#dfc485",
  },
  timingTextEvening: {
    fontSize: 12,
    color: "#7ea69d",
  },
  timingTextNeutral: {
    fontSize: 12,
    color: "#7ea69d",
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(20, 39, 45, 0.05)",
    paddingTop: 16,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#14272d",
    fontWeight: "600",
  },
  sectionText: {
    fontSize: 14,
    color: "#7ea69d",
  },
  rankingDetailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  rankingDetailBadge: {
    backgroundColor: "#eef3ef",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(126, 166, 157, 0.28)",
  },
  rankingDetailText: {
    fontSize: 12,
    color: "#2f675c",
    fontWeight: "700",
  },
  moleculesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  moleculeTag: {
    backgroundColor: "#e7ede7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  moleculeText: {
    color: "#14272d",
    fontSize: 12,
  },
  warningCard: {
    backgroundColor: "rgba(223, 196, 133, 0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 8,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#14272d",
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  learnMoreText: {
    fontSize: 14,
    color: "#7ea69d",
  },
  submitCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  submitHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  submitHeaderText: {
    flex: 1,
    gap: 2,
  },
  submitTitle: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "700",
  },
  submitHint: {
    color: "#7ea69d",
    fontSize: 12,
  },
  submitCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#14272d",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  submitCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  submitButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#2f675c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ab7b0",
  },
  submitButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#e7ede7",
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#14272d",
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusText: {
    color: "#14272d",
    fontSize: 14,
    flex: 1,
  },
  emptyText: {
    color: "#7ea69d",
    fontSize: 14,
  },
  emptyObjectiveCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.05)",
  },
  emptyObjectiveText: {
    color: "#7ea69d",
    fontSize: 13,
  },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.05)",
    gap: 14,
  },
  historyTitle: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "600",
  },
  historyGroup: {
    gap: 6,
  },
  historyGroupTitle: {
    color: "#14272d",
    fontSize: 14,
    fontWeight: "600",
  },
  historyItem: {
    color: "#14272d",
    fontSize: 13,
    flex: 1,
  },
  historyItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyDotTaken: {
    backgroundColor: "#7ea69d",
  },
  historyDotPending: {
    backgroundColor: "#dfc485",
  },
  historyMore: {
    color: "#7ea69d",
    fontSize: 12,
    marginTop: 2,
  },
  historyItemMeta: {
    color: "#7ea69d",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  historyActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyActionBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  historyActionBadgeTaken: {
    backgroundColor: "rgba(126, 166, 157, 0.18)",
    borderColor: "rgba(126, 166, 157, 0.45)",
  },
  historyActionBadgePending: {
    backgroundColor: "rgba(223, 196, 133, 0.2)",
    borderColor: "rgba(190, 162, 98, 0.45)",
  },
  historyActionText: {
    fontSize: 11,
    fontWeight: "700",
  },
  historyActionTextTaken: {
    color: "#2f675c",
  },
  historyActionTextPending: {
    color: "#8b6b2f",
  },
  historyEmpty: {
    color: "#7ea69d",
    fontSize: 13,
  },
});


