import { Check, ClipboardList, Flame, Target } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getDashboard,
  getProgress,
  type DashboardResponse,
  type ProgressResponse,
} from "@/services/api";

interface DashboardScreenProps {
  userName?: string;
  onAddGoal?: () => void;
}

export function DashboardScreen({ userName, onAddGoal }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboard, progress] = await Promise.all([
          getDashboard(),
          getProgress(),
        ]);
        if (!mounted) return;
        setDashboardData(dashboard);
        setProgressData(progress);
      } catch (e) {
        console.error("Failed to load accueil:", e);
        if (!mounted) return;
        setError("Impossible de charger l accueil pour le moment.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = dashboardData?.user_name || userName || "User";
  const progress = dashboardData?.today_progress ?? 0;
  const taken = dashboardData?.supplements_taken ?? 0;
  const total = dashboardData?.supplements_total ?? 0;
  const weeklyData = dashboardData?.weekly_data ?? [];
  const adherenceData = dashboardData?.adherence_data ?? [];
  const expectedSupplements = progressData?.expected_supplements ?? [];
  const takenTodayEvents = useMemo(
    () => (progressData?.daily_intakes ?? []).filter((item) => item.taken).slice(-4).reverse(),
    [progressData?.daily_intakes],
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-aja-cream" style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#7ea69d" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-aja-cream" style={[styles.container, styles.centered]}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-aja-cream" style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour,</Text>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.headerSubtitle}>Votre resume du jour</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Target size={16} color="#b3d3d2" />
            <Text style={styles.overviewValue}>{progress}%</Text>
            <Text style={styles.overviewLabel}>Progression</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Check size={16} color="#b3d3d2" />
            <Text style={styles.overviewValue}>{taken}</Text>
            <Text style={styles.overviewLabel}>Pris</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <ClipboardList size={16} color="#b3d3d2" />
            <Text style={styles.overviewValue}>{total}</Text>
            <Text style={styles.overviewLabel}>Prevus</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan du jour</Text>
          <Text style={styles.cardSubtitle}>
            {taken}/{total} complement{total > 1 ? "s" : ""} valide{total > 1 ? "s" : ""}
          </Text>

          {expectedSupplements.length === 0 ? (
            <Text style={styles.emptyText}>Aucun complement planifie pour aujourd hui.</Text>
          ) : (
            <View style={styles.list}>
              {expectedSupplements.slice(0, 5).map((supplement) => (
                <View
                  key={supplement.id}
                  style={[styles.planItem, supplement.taken && styles.planItemDone]}
                >
                  <View style={[styles.planDot, supplement.taken && styles.planDotDone]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{supplement.name}</Text>
                    {!!supplement.dosage && (
                      <Text style={styles.planMeta}>{supplement.dosage}</Text>
                    )}
                  </View>
                  <Text style={styles.planStatus}>
                    {supplement.taken ? "Pris" : "En attente"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cette semaine</Text>
          <Text style={styles.cardSubtitle}>Regularite sur les 7 derniers jours</Text>

          <View style={styles.weekRow}>
            {weeklyData.map((day, index) => (
              <View key={`${day.day}-${index}`} style={styles.weekItem}>
                <View
                  style={[styles.weekDot, day.completed ? styles.weekDotDone : styles.weekDotPending]}
                />
                <Text style={styles.weekLabel}>{day.day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.adherenceBar}>
            {adherenceData.map((isDone, index) => (
              <View
                key={`adherence-${index}`}
                style={[
                  styles.adherenceSegment,
                  isDone ? styles.adherenceSegmentDone : styles.adherenceSegmentPending,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Dernieres prises</Text>
            <Flame size={16} color="#7ea69d" />
          </View>

          {takenTodayEvents.length === 0 ? (
            <Text style={styles.emptyText}>Aucune prise enregistree aujourd hui.</Text>
          ) : (
            <View style={styles.list}>
              {takenTodayEvents.map((item, index) => (
                <View key={`${item.time}-${item.name}-${index}`} style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                  <Text numberOfLines={1} style={styles.timelineLabel}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.addButton} onPress={onAddGoal} activeOpacity={0.9}>
          <Text style={styles.addButtonText}>Mettre a jour mes objectifs</Text>
        </TouchableOpacity>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#14272d",
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    color: "#b3d3d2",
    fontSize: 14,
  },
  userName: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  headerSubtitle: {
    color: "#b3d3d2",
    fontSize: 13,
    marginTop: 6,
  },
  mainContent: {
    paddingHorizontal: 24,
    marginTop: -16,
    gap: 16,
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
    gap: 3,
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
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#7ea69d",
    fontSize: 12,
    marginTop: -6,
  },
  emptyText: {
    color: "#7ea69d",
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  planItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.08)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(231, 237, 231, 0.25)",
  },
  planItemDone: {
    backgroundColor: "rgba(179, 211, 210, 0.2)",
    borderColor: "rgba(126, 166, 157, 0.35)",
  },
  planDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#dfc485",
  },
  planDotDone: {
    backgroundColor: "#2f675c",
  },
  planName: {
    color: "#14272d",
    fontSize: 14,
    fontWeight: "600",
  },
  planMeta: {
    color: "#7ea69d",
    fontSize: 12,
    marginTop: 2,
  },
  planStatus: {
    color: "#7ea69d",
    fontSize: 12,
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekItem: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  weekDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  weekDotDone: {
    backgroundColor: "#2f675c",
  },
  weekDotPending: {
    backgroundColor: "rgba(179, 211, 210, 0.45)",
  },
  weekLabel: {
    color: "#7ea69d",
    fontSize: 12,
    fontWeight: "700",
  },
  adherenceBar: {
    marginTop: 2,
    flexDirection: "row",
    gap: 4,
  },
  adherenceSegment: {
    flex: 1,
    height: 8,
    borderRadius: 999,
  },
  adherenceSegmentDone: {
    backgroundColor: "#7ea69d",
  },
  adherenceSegmentPending: {
    backgroundColor: "rgba(126, 166, 157, 0.2)",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  timelineTime: {
    color: "#7ea69d",
    width: 46,
    fontSize: 12,
    fontWeight: "700",
  },
  timelineLabel: {
    flex: 1,
    color: "#14272d",
    fontSize: 13,
    fontWeight: "600",
  },
  addButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#2f675c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.08)",
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  errorCard: {
    marginHorizontal: 24,
    backgroundColor: "rgba(223, 196, 133, 0.18)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(190, 162, 98, 0.35)",
  },
  errorText: {
    color: "#14272d",
    fontSize: 13,
  },
});
