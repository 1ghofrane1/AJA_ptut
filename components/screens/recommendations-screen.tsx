import { useAuth } from "@/context/auth";
import { getDecisionForMe } from "@/services/api";
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Timing = "morning" | "evening" | "both" | "unspecified";

type Supplement = {
  id: string;
  name: string;
  dosage: string;
  timing: Timing;
  reason: string;
  molecules: string[];
  warnings?: string;
  taken: boolean;
};

type ObjectivePlan = {
  key: string;
  label: string;
  supplements: Supplement[];
};

type AnyRecord = Record<string, any>;

const OBJECTIVE_LABELS: Record<string, string> = {
  mood_depression_support: "Améliorer mon humeur",
  stress_anxiety_support: "Gérer le stress et l'anxiété",
  sleep_support: "Améliorer mon sommeil",
  weight_loss: "Perdre du poids",
  appetite_control: "Contrôler mon appétit",
  energy_fatigue: "Augmenter mon énergie",
  focus_cognition: "Améliorer ma concentration et mémoire",
  digestion_gut: "Améliorer ma digestion",
  immune_support: "Renforcer mon immunité",
  muscle_gain_strength: "Gagner en muscle et force",
  pain_inflammation: "Réduire douleurs et inflammations",
  migraine_headache: "Prévenir migraines et maux de tête",
  insomnia: "Insomnie",
  depression: "Dépression",
  stress: "Stress",
  fatigue: "Fatigue",
  anxiety: "Anxiété",
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

function normalizeObjectiveKey(value: string) {
  return value.trim().toLowerCase();
}

function prettifyObjectiveLabel(value: string) {
  const readable = value.replace(/_/g, " ").trim();
  if (!readable) return "Objectif";
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function objectiveLabel(goal: string) {
  return (
    OBJECTIVE_LABELS[goal] ??
    OBJECTIVE_LABELS[normalizeObjectiveKey(goal)] ??
    prettifyObjectiveLabel(goal)
  );
}

function inferTiming(value: unknown): Timing {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  const hasMorning = normalized.includes("morning") || normalized.includes("matin");
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

  const scoreValue =
    typeof raw.score === "number"
      ? raw.score
      : typeof raw.score === "string" && raw.score.trim()
        ? raw.score.trim()
        : null;

  const dosage =
    firstString(raw.posologie, raw.dosage, raw.dose, raw.quantity, raw.quantite) ??
    (scoreValue !== null ? `Score: ${scoreValue}` : "A définir");

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

  return {
    id,
    name,
    dosage,
    timing: inferTiming(raw.timing ?? raw.time ?? raw.moment),
    reason,
    molecules,
    warnings: warnings ?? undefined,
    taken: Boolean(raw.taken ?? raw.is_taken),
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
  return found.map((item) => asRecord(item)).filter((item): item is AnyRecord => Boolean(item));
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
    const explicitObjective = firstString(
      recommendation.objectif,
      recommendation.goal,
      recommendation.objective,
      recommendation.cible,
      recommendation.target_goal,
    );

    const objectiveKeys = dedupeKeepOrder(
      [
        ...toStringArray(recommendation.symptomes_couverts),
        ...toStringArray(recommendation.covered_symptoms),
        ...toStringArray(recommendation.objectifs),
        ...toStringArray(recommendation.goals),
        ...(explicitObjective ? [explicitObjective] : []),
      ].filter(Boolean),
    );

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
  const derivedInput = asRecord(root.derived_input) ?? asRecord(root.input) ?? {};
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

export function RecommendationsScreen() {
  const { token, user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [takenById, setTakenById] = useState<Record<string, boolean>>({});
  const [decisionData, setDecisionData] = useState<AnyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDecision = async () => {
      if (!token) {
        setDecisionData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getDecisionForMe();
        if (!isMounted) return;
        setDecisionData(data);
      } catch (e: any) {
        if (!isMounted) return;
        setDecisionData(null);
        setError(
          e?.response?.data?.detail ??
            "Impossible de charger votre plan de supplémentation.",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDecision();

    return () => {
      isMounted = false;
    };
  }, [token, user?.updated_at]);

  const objectives = useMemo(() => {
    const profileGoals = extractGoalsFromProfile(user?.profile);
    const decisionGoals = extractObjectivesFromDecisionResponse(decisionData);
    return dedupeKeepOrder([...profileGoals, ...decisionGoals]);
  }, [user?.profile, decisionData]);

  const objectivePlans = useMemo(() => {
    const grouped = extractGroupedRecommendations(decisionData);
    const groupedByNormalizedKey = new Map<string, AnyRecord[]>();

    for (const [key, recommendations] of Object.entries(grouped)) {
      groupedByNormalizedKey.set(normalizeObjectiveKey(key), recommendations);
    }

    const orderedObjectives = dedupeKeepOrder([
      ...objectives,
      ...Object.keys(grouped),
    ]);

    return orderedObjectives.map((objectiveKey) => {
      const recommendations =
        groupedByNormalizedKey.get(normalizeObjectiveKey(objectiveKey)) ?? [];

      const supplements = recommendations.map((recommendation, index) =>
        mapRawRecommendationToSupplement(recommendation, objectiveKey, index),
      );

      return {
        key: objectiveKey,
        label: objectiveLabel(objectiveKey),
        supplements,
      } satisfies ObjectivePlan;
    });
  }, [decisionData, objectives]);

  const allSupplements = useMemo(
    () => objectivePlans.flatMap((plan) => plan.supplements),
    [objectivePlans],
  );

  const takenCount = useMemo(
    () =>
      allSupplements.filter(
        (supplement) =>
          takenById[supplement.id] ?? supplement.taken ?? false,
      ).length,
    [allSupplements, takenById],
  );

  const toggleTaken = (id: string, currentState: boolean) => {
    setTakenById((prev) => ({
      ...prev,
      [id]: !currentState,
    }));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommandations</Text>
        <Text style={styles.headerSubtitle}>Plan personnalisé</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vos objectifs</Text>
          {objectives.length > 0 ? (
            <View style={styles.goalsContainer}>
              {objectives.map((goal) => (
                <View key={goal} style={styles.goalBadge}>
                  <Text style={styles.goalLabel}>{objectiveLabel(goal)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Aucun objectif trouvé dans votre profil pour le moment.
            </Text>
          )}
        </View>

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
              Plan de supplémentation par objectif
            </Text>

            {objectivePlans.length === 0 ? (
              <View style={styles.statusCard}>
                <Text style={styles.statusText}>
                  Aucune recommandation disponible pour le moment.
                </Text>
              </View>
            ) : (
              objectivePlans.map((plan) => (
                <View key={plan.key} style={styles.objectiveSection}>
                  <Text style={styles.objectiveTitle}>{plan.label}</Text>

                  {plan.supplements.length === 0 ? (
                    <View style={styles.emptyObjectiveCard}>
                      <Text style={styles.emptyObjectiveText}>
                        Aucun complément recommandé pour cet objectif.
                      </Text>
                    </View>
                  ) : (
                    plan.supplements.map((supplement) => {
                      const isExpanded = expandedId === supplement.id;
                      const isTaken =
                        takenById[supplement.id] ?? supplement.taken;

                      return (
                        <View key={supplement.id} style={styles.supplementCard}>
                          <View style={styles.supplementHeader}>
                            <View style={styles.supplementRow}>
                              <TouchableOpacity
                                onPress={() =>
                                  toggleTaken(supplement.id, isTaken)
                                }
                                style={[
                                  styles.checkbox,
                                  isTaken && styles.checkboxChecked,
                                ]}
                              >
                                {isTaken && <Check size={16} color="white" />}
                              </TouchableOpacity>

                              <View style={styles.supplementContent}>
                                <View style={styles.supplementTopRow}>
                                  <View style={styles.supplementInfo}>
                                    <Text style={styles.supplementName}>
                                      {supplement.name}
                                    </Text>
                                    <Text style={styles.supplementDosage}>
                                      {supplement.dosage}
                                    </Text>
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
                                      Moment non précisé
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
                                  Pourquoi ce complément ?
                                </Text>
                                <Text style={styles.sectionText}>
                                  {supplement.reason}
                                </Text>
                              </View>

                              {supplement.molecules.length > 0 && (
                                <View style={styles.section}>
                                  <Text style={styles.sectionLabel}>
                                    Molécules actives
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

                              <TouchableOpacity style={styles.learnMoreButton}>
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

        {!loading && !error && allSupplements.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {`${takenCount} sur ${allSupplements.length} compléments pris aujourd'hui`}
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
    paddingBottom: 96,
  },
  header: {
    backgroundColor: "#14272d",
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    marginBottom: 12,
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
  },
  goalLabel: {
    fontSize: 14,
    color: "#14272d",
  },
  supplementsSection: {
    gap: 12,
  },
  sectionTitle: {
    color: "#14272d",
    fontSize: 16,
    paddingHorizontal: 4,
  },
  objectiveSection: {
    gap: 8,
  },
  objectiveTitle: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 4,
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
  supplementName: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "600",
  },
  supplementDosage: {
    fontSize: 14,
    color: "#7ea69d",
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
});
