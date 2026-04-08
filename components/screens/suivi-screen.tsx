import { HeaderLogoutButton } from "@/components/header-logout-button";
import { useAuth } from "@/context/auth";
import {
  getProgress,
  saveRecommendationIntakes,
  type ProgressResponse,
  type RecommendationIntakeItemInput,
} from "@/services/api";
import * as Haptics from "expo-haptics";
import { LineChart } from "react-native-chart-kit";
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  Target,
  TrendingUp,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

type Segment = "today" | "trends" | "history";

function pad2(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

function ymdLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDaysYmd(ymd: string, deltaDays: number) {
  const dt = parseYmd(ymd);
  dt.setDate(dt.getDate() + deltaDays);
  return ymdLocal(dt);
}

function formatDateLabel(ymd: string) {
  const dt = parseYmd(ymd);
  return dt.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timingLabel(value?: string | null) {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return null;
  if (v.includes("morning") || v.includes("matin")) return "Matin";
  if (v.includes("afternoon") || v.includes("midi")) return "Midi";
  if (v.includes("evening") || v.includes("soir")) return "Soir";
  if (v.includes("both")) return "Matin & Soir";
  return value;
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const v = value.trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function intensityColor(intensity: number) {
  const i = clampInt(intensity, 0, 3);
  if (i === 0) return "rgba(179, 211, 210, 0.25)";
  if (i === 1) return "rgba(223, 196, 133, 0.65)";
  if (i === 2) return "rgba(126, 166, 157, 0.85)";
  return "#2f675c";
}

function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 8,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = clampInt(Math.round(progress), 0, 100);
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(179, 211, 210, 0.55)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#dfc485"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={styles.ringPct}>{pct}%</Text>
      </View>
    </View>
  );
}

export function SuiviScreen() {
  const { user } = useAuth();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const anchorYmd = useMemo(() => ymdLocal(new Date()), []);
  const [segment, setSegment] = useState<Segment>("today");
  const [selectedYmd, setSelectedYmd] = useState(anchorYmd);

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<ProgressResponse | null>(null);
  const [dayData, setDayData] = useState<ProgressResponse | null>(null);

  const [takenByGroupId, setTakenByGroupId] = useState<Record<string, boolean>>({});
  const [submittedTakenByGroupId, setSubmittedTakenByGroupId] = useState<Record<string, boolean>>(
    {},
  );
  const [pendingTakenAtByGroupId, setPendingTakenAtByGroupId] = useState<Record<string, string>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);

  const [segmentTrackWidth, setSegmentTrackWidth] = useState(0);
  const segmentAnim = useRef(new Animated.Value(0)).current;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetYmd, setSheetYmd] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetData, setSheetData] = useState<ProgressResponse | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const displayName =
    typeof user?.profile?.first_name === "string" && user.profile.first_name.trim()
      ? user.profile.first_name.trim()
      : user?.email?.split("@")[0] ?? "vous";

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      setMetricsLoading(true);
      try {
        const data = await getProgress({ date: anchorYmd });
        if (!mounted) return;
        setMetrics(data);
        if (selectedYmd === anchorYmd) {
          setDayData(data);
        }
      } catch (e) {
        console.error("Failed to load progress:", e);
        if (mounted) setError("Impossible de charger le suivi pour le moment.");
      } finally {
        if (mounted) setMetricsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [anchorYmd, selectedYmd]);

  useEffect(() => {
    let mounted = true;

    async function loadDay() {
      setError(null);
      setDayLoading(true);
      try {
        if (selectedYmd === anchorYmd && metrics) {
          setDayData(metrics);
          return;
        }
        const data = await getProgress({ date: selectedYmd });
        if (!mounted) return;
        setDayData(data);
      } catch (e) {
        console.error("Failed to load day progress:", e);
        if (mounted) setError("Impossible de charger cette date.");
      } finally {
        if (mounted) setDayLoading(false);
      }
    }

    loadDay();
    return () => {
      mounted = false;
    };
  }, [anchorYmd, metrics, selectedYmd]);

  useEffect(() => {
    const groups = dayData?.expected_supplements ?? [];
    const nextTaken: Record<string, boolean> = {};
    for (const group of groups) {
      nextTaken[group.id] = Boolean(group.taken);
    }
    setTakenByGroupId(nextTaken);
    setSubmittedTakenByGroupId(nextTaken);
    setPendingTakenAtByGroupId({});
    setDayLoading(false);
  }, [dayData?.expected_supplements, dayData?.selected_date]);

  const pendingChanges = useMemo(() => {
    const ids = Object.keys(takenByGroupId);
    const changes = ids.filter((id) => (takenByGroupId[id] ?? false) !== (submittedTakenByGroupId[id] ?? false));
    return changes;
  }, [submittedTakenByGroupId, takenByGroupId]);

  const takenEventsForDay = useMemo(
    () => (dayData?.daily_intakes ?? []).filter((item) => item.taken).slice(-4).reverse(),
    [dayData?.daily_intakes],
  );

  const weeklyCompletedCount = useMemo(
    () => (metrics?.weekly_data ?? []).filter((item) => item.completed).length,
    [metrics?.weekly_data],
  );

  const adherencePercent = useMemo(() => {
    const values = metrics?.adherence_data ?? [];
    if (values.length === 0) return 0;
    const completed = values.filter(Boolean).length;
    return Math.round((completed / values.length) * 100);
  }, [metrics?.adherence_data]);

  const trendStats = useMemo(() => {
    const evolution = metrics?.evolution_data ?? [];
    const values = evolution.map((p) => p.value);
    const avg10 =
      values.length > 0
        ? Math.round(values.reduce((acc, v) => acc + v, 0) / values.length)
        : 0;
    const first = values.slice(0, 3);
    const last = values.slice(-3);
    const avgFirst =
      first.length > 0
        ? first.reduce((acc, v) => acc + v, 0) / first.length
        : 0;
    const avgLast =
      last.length > 0 ? last.reduce((acc, v) => acc + v, 0) / last.length : 0;
    const delta = Math.round(avgLast - avgFirst);

    const weekly = metrics?.weekly_data ?? [];
    const weeklyDone = weekly.filter((d) => d.completed).length;
    const consistency = weekly.length > 0 ? Math.round((weeklyDone / weekly.length) * 100) : 0;

    const cells = metrics?.monthly_data ?? [];
    let streak = 0;
    for (let i = cells.length - 1; i >= 0; i -= 1) {
      if (cells[i].intensity === 3) streak += 1;
      else break;
    }

    const labels = values.map((_, idx) => {
      if (idx === 0) return "J-9";
      if (idx === values.length - 1) return "Auj";
      return "";
    });

    return {
      values,
      labels,
      avg10,
      delta,
      weeklyDone,
      weeklyTotal: weekly.length,
      consistency,
      streak,
    };
  }, [metrics]);

  useEffect(() => {
    const idx = segment === "today" ? 0 : segment === "trends" ? 1 : 2;
    Animated.spring(segmentAnim, {
      toValue: idx,
      useNativeDriver: true,
      friction: 10,
      tension: 120,
    }).start();
  }, [segment, segmentAnim]);

  const segmentItemWidth = segmentTrackWidth > 0 ? segmentTrackWidth / 3 : 0;
  const indicatorTranslateX = segmentAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, segmentItemWidth, segmentItemWidth * 2],
  });

  const toggleGroupTaken = (groupId: string) => {
    Haptics.selectionAsync().catch(() => {});
    const next = !(takenByGroupId[groupId] ?? false);
    const takenAt =
      selectedYmd === anchorYmd ? new Date().toISOString() : `${selectedYmd}T12:00:00.000Z`;
    setTakenByGroupId((prev) => ({ ...prev, [groupId]: next }));
    setPendingTakenAtByGroupId((prev) => ({ ...prev, [groupId]: takenAt }));
  };

  const savePending = async () => {
    if (isSaving) return;
    if (!dayData?.recommendation_id) return;
    if (pendingChanges.length === 0) return;

    const byId = new Map((dayData.expected_supplements ?? []).map((g) => [g.id, g]));
    const payload: RecommendationIntakeItemInput[] = [];
    for (const groupId of pendingChanges) {
      const group = byId.get(groupId);
      if (!group) continue;
      const taken = Boolean(takenByGroupId[groupId]);
      const takenAt =
        pendingTakenAtByGroupId[groupId] ??
        (selectedYmd === anchorYmd ? new Date().toISOString() : `${selectedYmd}T12:00:00.000Z`);

      for (const item of group.items ?? []) {
        payload.push({
          supplement_id: item.supplement_id,
          supplement_name: item.supplement_name ?? group.name,
          objective_key: item.objective_key ?? undefined,
          objective_label: item.objective_label ?? undefined,
          taken,
          taken_at: takenAt,
        });
      }
    }

    if (payload.length === 0) return;

    setIsSaving(true);
    try {
      await saveRecommendationIntakes(dayData.recommendation_id, payload);
      setSubmittedTakenByGroupId(takenByGroupId);
      setPendingTakenAtByGroupId({});
      // Refresh metrics + day
      const [nextMetrics, nextDay] = await Promise.all([
        getProgress({ date: anchorYmd }),
        getProgress({ date: selectedYmd }),
      ]);
      setMetrics(nextMetrics);
      setDayData(nextDay);
    } catch (e) {
      console.error("Failed to save intakes:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const openDaySheet = async (ymd: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSheetOpen(true);
    setSheetYmd(ymd);
    setSheetLoading(true);
    setSheetData(null);

    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    try {
      const data = await getProgress({ date: ymd });
      setSheetData(data);
    } catch (e) {
      console.error("Failed to load sheet:", e);
    } finally {
      setSheetLoading(false);
    }
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setSheetOpen(false);
      setSheetYmd(null);
      setSheetData(null);
    });
  };

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [windowHeight, 0],
  });

  const canGoNext = selectedYmd !== anchorYmd;

  const headerSubtitle =
    segment === "today"
      ? "Votre jour en un coup d'oeil"
      : segment === "trends"
        ? "Tendances et progression"
        : "30 derniers jours";

  return (
    <View className="flex-1 bg-aja-cream" style={styles.container}>
      <ScrollView className="flex-1 bg-aja-cream" style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View className="rounded-b-3xl bg-aja-ink px-6 pt-6 pb-5" style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Suivi</Text>
              <Text style={styles.headerSubtitle}>
                {displayName}, {headerSubtitle}
              </Text>
            </View>
            <HeaderLogoutButton />
          </View>

          <View
            style={styles.segmentTrack}
            onLayout={(e) => setSegmentTrackWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                styles.segmentIndicator,
                {
                  width: segmentItemWidth,
                  transform: [{ translateX: indicatorTranslateX }],
                },
              ]}
            />
            <TouchableOpacity
              style={styles.segmentItem}
              onPress={() => setSegment("today")}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, segment === "today" && styles.segmentTextActive]}>
                {"Aujourd'hui"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.segmentItem}
              onPress={() => setSegment("trends")}
              activeOpacity={0.9}
            >
              <Text
                style={[styles.segmentText, segment === "trends" && styles.segmentTextActive]}
              >
                Tendances
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.segmentItem}
              onPress={() => setSegment("history")}
              activeOpacity={0.9}
            >
              <Text
                style={[styles.segmentText, segment === "history" && styles.segmentTextActive]}
              >
                Historique
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          {(metricsLoading || dayLoading) && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#7ea69d" />
              <Text style={styles.loadingText}>Chargement du suivi...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!metricsLoading && !dayLoading && !error && (
            <>
              {segment === "today" && (
                <>
                  <View style={styles.dateNavRow}>
                    <TouchableOpacity
                      style={styles.dateNavButton}
                      onPress={() => setSelectedYmd((prev) => addDaysYmd(prev, -1))}
                      activeOpacity={0.85}
                    >
                      <ChevronLeft size={18} color="#14272d" />
                    </TouchableOpacity>
                    <View style={styles.dateNavCenter}>
                      <Text style={styles.dateNavTitle}>{formatDateLabel(selectedYmd)}</Text>
                      <Text style={styles.dateNavHint}>
                        {selectedYmd === anchorYmd ? "Aujourd'hui" : "Jour selectionne"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.dateNavButton, !canGoNext && styles.dateNavButtonDisabled]}
                      onPress={() => canGoNext && setSelectedYmd((prev) => addDaysYmd(prev, 1))}
                      disabled={!canGoNext}
                      activeOpacity={0.85}
                    >
                      <ChevronRight size={18} color="#14272d" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.progressCard}>
                    <View style={styles.progressCardRow}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.cardTitle}>Progression</Text>
                        <Text style={styles.cardSubtitle}>
                          {(dayData?.supplements_taken ?? 0)}/{dayData?.supplements_total ?? 0} complements valides
                        </Text>
                      </View>
                      <ProgressRing progress={dayData?.today_progress ?? 0} />
                    </View>
                    <View style={styles.progressStatsRow}>
                      <View style={styles.progressStatItem}>
                        <Target size={15} color="#2f675c" />
                        <Text style={styles.progressStatValue}>{dayData?.today_progress ?? 0}%</Text>
                        <Text style={styles.progressStatLabel}>Progression</Text>
                      </View>
                      <View style={styles.progressStatDivider} />
                      <View style={styles.progressStatItem}>
                        <Check size={15} color="#2f675c" />
                        <Text style={styles.progressStatValue}>{dayData?.supplements_taken ?? 0}</Text>
                        <Text style={styles.progressStatLabel}>Pris</Text>
                      </View>
                      <View style={styles.progressStatDivider} />
                      <View style={styles.progressStatItem}>
                        <ClipboardList size={15} color="#2f675c" />
                        <Text style={styles.progressStatValue}>{dayData?.supplements_total ?? 0}</Text>
                        <Text style={styles.progressStatLabel}>Prevus</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Cette semaine</Text>
                      <Text style={styles.weekSummaryValue}>
                        {weeklyCompletedCount}/{metrics?.weekly_data?.length ?? 0}
                      </Text>
                    </View>
                    <Text style={styles.cardSubtitle}>Regularite sur les 7 derniers jours.</Text>
                    <View style={styles.weekRow}>
                      {(metrics?.weekly_data ?? []).map((d, idx) => (
                        <View key={`${d.day}-${idx}`} style={styles.weekItem}>
                          <View
                            style={[
                              styles.weekDot,
                              d.completed ? styles.weekDotDone : styles.weekDotPending,
                            ]}
                          />
                          <Text style={styles.weekLabel}>{d.day}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.adherenceRow}>
                      <View style={styles.adherenceBar}>
                        {(metrics?.adherence_data ?? []).map((isDone, index) => (
                          <View
                            key={`adherence-${index}`}
                            style={[
                              styles.adherenceSegment,
                              isDone
                                ? styles.adherenceSegmentDone
                                : styles.adherenceSegmentPending,
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.adherenceValue}>{adherencePercent}%</Text>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Plan du jour</Text>
                    <Text style={styles.cardSubtitle}>
                      {Math.max(
                        0,
                        (dayData?.supplements_total ?? 0) - (dayData?.supplements_taken ?? 0),
                      )}{" "}
                      complement
                      {Math.max(
                        0,
                        (dayData?.supplements_total ?? 0) - (dayData?.supplements_taken ?? 0),
                      ) > 1
                        ? "s"
                        : ""}{" "}
                      restant
                      {Math.max(
                        0,
                        (dayData?.supplements_total ?? 0) - (dayData?.supplements_taken ?? 0),
                      ) > 1
                        ? "s"
                        : ""}
                    </Text>
                    {(dayData?.expected_supplements ?? []).length === 0 ? (
                      <Text style={styles.emptyText}>Aucune prise planifiee.</Text>
                    ) : (
                      <View style={styles.checklist}>
                        {(dayData?.expected_supplements ?? []).map((group) => {
                          const taken = takenByGroupId[group.id] ?? false;
                          const hasChange =
                            taken !== (submittedTakenByGroupId[group.id] ?? false);
                          const tLabel = timingLabel(group.timing);
                          const objectives = dedupeStrings(
                            (group.items ?? [])
                              .map((item) => item.objective_label ?? item.objective_key ?? "")
                              .filter(Boolean),
                          );
                          const objectiveText =
                            objectives.length > 0
                              ? `${objectives.slice(0, 2).join(" - ")}${objectives.length > 2 ? ` +${objectives.length - 2}` : ""}`
                              : null;
                          return (
                            <Pressable
                              key={group.id}
                              onPress={() => toggleGroupTaken(group.id)}
                              style={[
                                styles.checkItem,
                                taken && styles.checkItemTaken,
                                hasChange && styles.checkItemPending,
                              ]}
                            >
                              <View style={[styles.checkBox, taken && styles.checkBoxChecked]}>
                                {taken && <Check size={14} color="#14272d" />}
                              </View>
                              <View style={{ flex: 1, gap: 2 }}>
                                <Text style={styles.checkTitle}>{group.name}</Text>
                                {(tLabel || group.dosage) && (
                                  <Text style={styles.checkMeta}>
                                    {tLabel ? tLabel : "Libre"}
                                    {group.dosage ? ` - ${group.dosage}` : ""}
                                  </Text>
                                )}
                                {!!objectiveText && (
                                  <Text style={styles.checkReason} numberOfLines={1}>
                                    {objectiveText}
                                  </Text>
                                )}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Dernieres prises</Text>
                      <Flame size={16} color="#7ea69d" />
                    </View>
                    <Text style={styles.cardSubtitle}>Les prises validees pour cette journee.</Text>
                    <View style={{ gap: 10 }}>
                      {takenEventsForDay.map((event, idx) => (
                        <View key={`${event.time}-${idx}`} style={styles.timelineRow}>
                          <View
                            style={[
                              styles.timelineDot,
                              event.taken
                                ? styles.timelineDotTaken
                                : styles.timelineDotPending,
                            ]}
                          />
                          <Text style={styles.timelineTime}>{event.time}</Text>
                          <Text style={styles.timelineLabel} numberOfLines={1}>
                            {event.name}
                          </Text>
                        </View>
                      ))}
                      {takenEventsForDay.length === 0 && (
                        <Text style={styles.emptyText}>Aucune prise enregistree.</Text>
                      )}
                    </View>
                  </View>

                  {pendingChanges.length > 0 && (
                    <View style={styles.saveCard}>
                      <Text style={styles.saveTitle}>
                        {pendingChanges.length} changement{pendingChanges.length > 1 ? "s" : ""} a
                        enregistrer
                      </Text>
                      <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        onPress={savePending}
                        disabled={isSaving}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.saveButtonText}>
                          {isSaving ? "Enregistrement..." : "Enregistrer"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {segment === "trends" && (
                <>
                  <View style={styles.metricGrid}>
                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <Flame size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Serie parfaite</Text>
                      <Text style={styles.metricValue}>{trendStats.streak}j</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <TrendingUp size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Moyenne 10j</Text>
                      <Text style={styles.metricValue}>{trendStats.avg10}%</Text>
                      <Text
                        style={[
                          styles.metricHint,
                          trendStats.delta >= 0 ? styles.metricHintUp : styles.metricHintDown,
                        ]}
                      >
                        {trendStats.delta >= 0 ? `+${trendStats.delta}` : `${trendStats.delta}`} pts
                      </Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <Activity size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Constance</Text>
                      <Text style={styles.metricValue}>{trendStats.consistency}%</Text>
                      <Text style={styles.metricHint}>
                        {trendStats.weeklyDone}/{trendStats.weeklyTotal} jours
                      </Text>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Evolution (10 jours)</Text>
                      <View
                        style={[
                          styles.deltaPill,
                          trendStats.delta >= 0 ? styles.deltaPillUp : styles.deltaPillDown,
                        ]}
                      >
                        <Text style={styles.deltaPillText}>
                          {trendStats.delta >= 0 ? `+${trendStats.delta}` : `${trendStats.delta}`} pts
                        </Text>
                      </View>
                    </View>

                    {trendStats.values.length > 1 ? (
                      <LineChart
                        data={{
                          labels: trendStats.labels,
                          datasets: [{ data: trendStats.values }],
                        }}
                        width={Math.max(260, Math.min(windowWidth - 84, 520))}
                        height={180}
                        withInnerLines={false}
                        withOuterLines={false}
                        withShadow={false}
                        withDots
                        fromZero
                        withHorizontalLabels={false}
                        withVerticalLabels
                        bezier
                        chartConfig={{
                          backgroundColor: "white",
                          backgroundGradientFrom: "white",
                          backgroundGradientTo: "white",
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(47, 103, 92, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(126, 166, 157, ${opacity})`,
                          propsForDots: {
                            r: "4",
                            strokeWidth: "2",
                            stroke: "#fef6e2",
                          },
                          propsForBackgroundLines: {
                            strokeDasharray: "",
                            stroke: "rgba(20, 39, 45, 0.06)",
                          },
                        }}
                        style={styles.chart}
                      />
                    ) : (
                      <Text style={styles.emptyText}>Pas encore assez de donnees.</Text>
                    )}
                  </View>

                </>
              )}

              {segment === "history" && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Historique (30 jours)</Text>
                  <Text style={styles.cardSubtitle}>
                    {formatDateLabel(addDaysYmd(anchorYmd, -29))} Ã¢â€ â€™ {formatDateLabel(anchorYmd)}
                  </Text>
                  <View style={styles.heatmapGrid}>
                    {(metrics?.monthly_data ?? []).map((cell) => {
                      const ymd = addDaysYmd(anchorYmd, -(30 - cell.day));
                      const isToday = cell.day === 30;
                      return (
                        <Pressable
                          key={`${cell.day}`}
                          onPress={() => openDaySheet(ymd)}
                          style={[
                            styles.heatmapCell,
                            { backgroundColor: intensityColor(cell.intensity) },
                            isToday && styles.heatmapCellToday,
                          ]}
                        />
                      );
                    })}
                  </View>
                  <View style={styles.legendRow}>
                    <Text style={styles.legendLabel}>0%</Text>
                    <View style={styles.legendSwatches}>
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={`legend-${i}`}
                          style={[styles.legendSwatch, { backgroundColor: intensityColor(i) }]}
                        />
                      ))}
                    </View>
                    <Text style={styles.legendLabel}>100%</Text>
                  </View>
                  <Text style={styles.legendHint}>Touchez une case pour ouvrir le detail du jour.</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={sheetOpen} transparent animationType="none" onRequestClose={closeSheet}>
        <Pressable style={styles.sheetOverlay} onPress={closeSheet} />
        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Detail</Text>
              <Text style={styles.sheetSubtitle}>{sheetYmd ? formatDateLabel(sheetYmd) : ""}</Text>
            </View>
            <TouchableOpacity onPress={closeSheet} style={styles.sheetClose} activeOpacity={0.85}>
              <X size={18} color="#14272d" />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            {sheetLoading && (
              <View style={{ paddingVertical: 24, alignItems: "center", gap: 10 }}>
                <ActivityIndicator size="large" color="#7ea69d" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            )}
            {!sheetLoading && sheetData && (
              <>
                <View style={styles.sheetProgressRow}>
                  <ProgressRing progress={sheetData.today_progress} size={64} strokeWidth={8} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.cardTitle}>Progression</Text>
                    <Text style={styles.cardSubtitle}>
                      {sheetData.supplements_taken}/{sheetData.supplements_total} complÃƒÂ©ments
                    </Text>
                  </View>
                </View>

                <View style={[styles.card, { marginTop: 14 }]}>
                  <Text style={styles.cardTitle}>Plan</Text>
                  {(sheetData.expected_supplements ?? []).length === 0 ? (
                    <Text style={styles.emptyText}>Aucun complement planifie.</Text>
                  ) : (
                    <View style={styles.checklist}>
                      {(sheetData.expected_supplements ?? []).slice(0, 8).map((group) => {
                        const tLabel = timingLabel(group.timing);
                        const objectives = dedupeStrings(
                          (group.items ?? [])
                            .map((item) => item.objective_label ?? item.objective_key ?? "")
                            .filter(Boolean),
                        );
                        const objectiveText =
                          objectives.length > 0
                            ? `${objectives.slice(0, 2).join(" Ã¢â‚¬Â¢ ")}${objectives.length > 2 ? ` +${objectives.length - 2}` : ""}`
                            : null;
                        return (
                          <View
                            key={group.id}
                            style={[styles.checkItem, group.taken && styles.checkItemTaken]}
                          >
                            <View style={[styles.checkBox, group.taken && styles.checkBoxChecked]}>
                              {group.taken && <Check size={14} color="#14272d" />}
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text style={styles.checkTitle}>{group.name}</Text>
                              {(tLabel || group.dosage) && (
                                <Text style={styles.checkMeta}>
                                  {tLabel ? tLabel : "Libre"}
                                  {group.dosage ? ` Ã¢â‚¬Â¢ ${group.dosage}` : ""}
                                </Text>
                              )}
                              {!!objectiveText && (
                                <Text style={styles.checkReason} numberOfLines={1}>
                                  {objectiveText}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                <View style={[styles.card, { marginTop: 14 }]}>
                  <Text style={styles.cardTitle}>Journal</Text>
                  <Text style={styles.cardSubtitle}>Prises enregistrees.</Text>
                  <View style={{ marginTop: 10, gap: 10 }}>
                    {(sheetData.daily_intakes ?? []).slice(0, 10).map((event, idx) => (
                      <View key={`${event.time}-${idx}`} style={styles.timelineRow}>
                        <View
                          style={[
                            styles.timelineDot,
                            event.taken ? styles.timelineDotTaken : styles.timelineDotPending,
                          ]}
                        />
                        <Text style={styles.timelineTime}>{event.time}</Text>
                        <Text style={styles.timelineLabel} numberOfLines={1}>
                          {event.name}
                        </Text>
                      </View>
                    ))}
                    {(sheetData.daily_intakes ?? []).length === 0 && (
                      <Text style={styles.emptyText}>Aucune prise enregistree.</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.sheetActionButton}
                  onPress={() => {
                    const ymd = sheetYmd;
                    if (!ymd) return;
                    setSegment("today");
                    setSelectedYmd(ymd);
                    closeSheet();
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.sheetActionText}>Modifier ce jour</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </Modal>
    </View>
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
    paddingTop: 24,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#b3d3d2",
    fontSize: 13,
    marginTop: 4,
  },
  segmentTrack: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    padding: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(179, 211, 210, 0.18)",
  },
  segmentIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  segmentItem: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 12,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#14272d",
  },
  mainContent: {
    paddingHorizontal: 24,
    marginTop: 14,
    gap: 16,
  },
  loadingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.08)",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#7ea69d",
    fontSize: 13,
  },
  errorCard: {
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
  dateNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateNavButtonDisabled: {
    opacity: 0.4,
  },
  dateNavCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  dateNavTitle: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  dateNavHint: {
    color: "#7ea69d",
    fontSize: 12,
  },
  progressCard: {
    backgroundColor: "#e7ede7",
    borderRadius: 16,
    padding: 18,
  },
  progressCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  progressStatsRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(20, 39, 45, 0.08)",
    flexDirection: "row",
    alignItems: "center",
  },
  progressStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  progressStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(20, 39, 45, 0.09)",
  },
  progressStatValue: {
    color: "#14272d",
    fontSize: 18,
    fontWeight: "800",
  },
  progressStatLabel: {
    color: "#7ea69d",
    fontSize: 11,
    fontWeight: "700",
  },
  ringLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: {
    color: "#14272d",
    fontSize: 14,
    fontWeight: "800",
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
  cardTitle: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#7ea69d",
    fontSize: 12,
    marginTop: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
    gap: 6,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(179, 211, 210, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  metricLabel: {
    color: "#7ea69d",
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    color: "#14272d",
    fontSize: 20,
    fontWeight: "900",
  },
  metricHint: {
    color: "#7ea69d",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  metricHintUp: {
    color: "#2f675c",
  },
  metricHintDown: {
    color: "#8b6b2f",
  },
  deltaPill: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  deltaPillUp: {
    backgroundColor: "rgba(126, 166, 157, 0.18)",
    borderColor: "rgba(126, 166, 157, 0.5)",
  },
  deltaPillDown: {
    backgroundColor: "rgba(223, 196, 133, 0.2)",
    borderColor: "rgba(190, 162, 98, 0.5)",
  },
  deltaPillText: {
    color: "#14272d",
    fontSize: 12,
    fontWeight: "800",
  },
  chart: {
    marginTop: 12,
    borderRadius: 16,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  weekSummaryValue: {
    color: "#2f675c",
    fontSize: 14,
    fontWeight: "800",
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
  adherenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  adherenceBar: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
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
  adherenceValue: {
    color: "#14272d",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyText: {
    color: "#7ea69d",
    fontSize: 13,
  },
  checklist: {
    gap: 10,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.08)",
    backgroundColor: "rgba(231, 237, 231, 0.25)",
  },
  checkItemTaken: {
    backgroundColor: "rgba(179, 211, 210, 0.22)",
    borderColor: "rgba(126, 166, 157, 0.35)",
  },
  checkItemPending: {
    borderColor: "rgba(223, 196, 133, 0.65)",
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  checkBoxChecked: {
    backgroundColor: "#dfc485",
    borderColor: "rgba(20, 39, 45, 0.12)",
  },
  checkTitle: {
    color: "#14272d",
    fontSize: 14,
    fontWeight: "700",
  },
  checkMeta: {
    color: "#7ea69d",
    fontSize: 12,
  },
  checkReason: {
    color: "rgba(20, 39, 45, 0.72)",
    fontSize: 12,
  },
  saveCard: {
    backgroundColor: "rgba(223, 196, 133, 0.18)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(190, 162, 98, 0.35)",
    gap: 10,
  },
  saveTitle: {
    color: "#14272d",
    fontSize: 13,
    fontWeight: "700",
  },
  saveButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2f675c",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heatmapCell: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  heatmapCellToday: {
    borderWidth: 2,
    borderColor: "rgba(20, 39, 45, 0.55)",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  legendLabel: {
    color: "#7ea69d",
    fontSize: 12,
    fontWeight: "700",
  },
  legendSwatches: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 6,
  },
  legendHint: {
    color: "#7ea69d",
    fontSize: 12,
    marginTop: 8,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 39, 45, 0.35)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fef6e2",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: "82%",
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20, 39, 45, 0.08)",
  },
  sheetTitle: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "800",
  },
  sheetSubtitle: {
    color: "#7ea69d",
    fontSize: 12,
    marginTop: 4,
    textTransform: "capitalize",
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetActionButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#14272d",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  sheetProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineDotTaken: {
    backgroundColor: "#2f675c",
  },
  timelineDotPending: {
    backgroundColor: "#dfc485",
  },
  timelineTime: {
    color: "#7ea69d",
    width: 54,
    fontSize: 12,
    fontWeight: "700",
  },
  timelineLabel: {
    flex: 1,
    color: "#14272d",
    fontSize: 13,
    fontWeight: "600",
  },
});
