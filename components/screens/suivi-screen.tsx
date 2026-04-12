import { HeaderLogoutButton } from "@/components/header-logout-button";
import { useAuth } from "@/context/auth";
import { useProgressQuery } from "@/hooks/use-health-data";
import {
  getProgress,
  type ProgressResponse,
} from "@/services/api";
import { formatParisYmd } from "@/utils/paris-time";
import { getUserFirstName } from "@/utils/user-display";
import * as Haptics from "expo-haptics";
import {
  BarChart as GiftedBarChart,
  PieChart as GiftedPieChart,
} from "react-native-gifted-charts";
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  Target,
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

function formatWeekdayShort(ymd: string) {
  const dt = parseYmd(ymd);
  return dt
    .toLocaleDateString("fr-FR", {
      weekday: "short",
    })
    .replace(".", "")
    .slice(0, 3);
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

type TimingBucket = {
  key: "morning" | "midday" | "evening" | "flex";
  label: string;
  total: number;
  taken: number;
  accent: string;
  soft: string;
};

function timingBucketKey(value?: string | null): TimingBucket["key"] {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return "flex";
  if (v.includes("morning") || v.includes("matin")) return "morning";
  if (v.includes("afternoon") || v.includes("midi")) return "midday";
  if (v.includes("evening") || v.includes("soir") || v.includes("night") || v.includes("nuit")) {
    return "evening";
  }
  return "flex";
}

function ratioPercent(taken: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((taken / total) * 100);
}

function progressDescriptor(progress: number) {
  if (progress >= 100) {
    return {
      tone: "strong" as const,
      title: "Journee complete",
      hint: "Toutes les prises prevues ont ete validees sur cette journee.",
    };
  }

  if (progress >= 75) {
    return {
      tone: "strong" as const,
      title: "Rythme solide",
      hint: "La majorite du plan du jour est deja validee.",
    };
  }

  if (progress >= 50) {
    return {
      tone: "mid" as const,
      title: "Progression partielle",
      hint: "Une partie du plan du jour reste encore a finaliser.",
    };
  }

  if (progress > 0) {
    return {
      tone: "soft" as const,
      title: "Demarrage en cours",
      hint: "Quelques prises sont valides, mais la routine reste a consolider.",
    };
  }

  return {
    tone: "empty" as const,
    title: "Aucune progression",
    hint: "Aucune prise n a ete enregistree pour cette journee.",
  };
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

type SuiviScreenProps = {
  onOpenRecommendations?: () => void;
};

export function SuiviScreen({ onOpenRecommendations }: SuiviScreenProps) {
  const { user } = useAuth();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isCompactTrendChart = windowWidth < 390;
  const trendChartWidth = Math.max(216, Math.min(windowWidth - (isCompactTrendChart ? 138 : 124), 420));
  const trendBarWidth = isCompactTrendChart ? 10 : windowWidth >= 420 ? 14 : 12;
  const trendBarSpacing = Math.max(
    4,
    Math.min(
      10,
      Math.floor((trendChartWidth - 34 - trendBarWidth * 10) / 11),
    ),
  );
  const trendBarInitialSpacing = Math.max(6, trendBarSpacing);
  const trendBarEndSpacing = Math.max(10, trendBarSpacing + 2);
  const weeklyChartWidth = Math.max(280, Math.min(windowWidth - 92, 1080));
  const weeklyBarWidth = windowWidth >= 1200 ? 34 : windowWidth >= 900 ? 30 : windowWidth >= 640 ? 26 : 22;
  const weeklyTopLabelWidth = Math.max(40, weeklyBarWidth + 18);
  const weeklyTopLabelOffset = Math.round((weeklyBarWidth - weeklyTopLabelWidth) / 2);
  const weeklyBarSpacing = Math.max(
    10,
    Math.min(
      28,
      Math.floor((weeklyChartWidth - 52 - weeklyBarWidth * 7) / 8),
    ),
  );
  const weeklyBarInitialSpacing = Math.max(12, weeklyBarSpacing);
  const weeklyBarEndSpacing = Math.max(4, Math.round(weeklyBarSpacing / 2));

  const anchorYmd = useMemo(() => formatParisYmd(new Date()), []);
  const [segment, setSegment] = useState<Segment>("today");
  const [selectedYmd, setSelectedYmd] = useState(anchorYmd);
  const metricsQuery = useProgressQuery(anchorYmd);
  const selectedDayQuery = useProgressQuery(selectedYmd, {
    enabled: selectedYmd !== anchorYmd,
  });

  const [segmentTrackWidth, setSegmentTrackWidth] = useState(0);
  const segmentAnim = useRef(new Animated.Value(0)).current;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetYmd, setSheetYmd] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetData, setSheetData] = useState<ProgressResponse | null>(null);
  const [selectedTrendIndex, setSelectedTrendIndex] = useState(-1);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const displayName = getUserFirstName(user);

  const metrics = metricsQuery.data ?? null;
  const dayData =
    (selectedYmd === anchorYmd ? metricsQuery.data : selectedDayQuery.data) ?? null;
  const metricsLoading = metricsQuery.isLoading;
  const dayLoading =
    selectedYmd === anchorYmd ? metricsQuery.isLoading : selectedDayQuery.isLoading;
  const error =
    metricsQuery.error?.message ??
    selectedDayQuery.error?.message ??
    null;

  const takenEventsForDay = useMemo(
    () => (dayData?.daily_intakes ?? []).filter((item) => item.taken).slice(-4).reverse(),
    [dayData?.daily_intakes],
  );

  const weeklyCompletedCount = useMemo(() => {
    const exactWeekly = metrics?.weekly_completion_data ?? [];
    if (exactWeekly.length > 0) {
      return exactWeekly.filter((item) => clampInt(item.percent, 0, 100) >= 100).length;
    }

    return (metrics?.weekly_data ?? []).filter((item) => item.completed).length;
  }, [metrics?.weekly_completion_data, metrics?.weekly_data]);

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
      const offset = values.length - 1 - idx;
      if (offset === 0) return "Auj";
      if (idx === 0 || offset % 3 === 0) return `J-${offset}`;
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

  const todayTakenCount = dayData?.supplements_taken ?? 0;
  const todayTotalCount = dayData?.supplements_total ?? 0;
  const todayRemainingCount = Math.max(todayTotalCount - todayTakenCount, 0);
  const latestTakenEvent = takenEventsForDay[0] ?? null;
  const trendLatestValue = trendStats.values[trendStats.values.length - 1] ?? 0;
  const trendFullDays = useMemo(
    () => trendStats.values.filter((value) => value >= 100).length,
    [trendStats.values],
  );
  const trendBestValue = useMemo(
    () => (trendStats.values.length > 0 ? Math.max(...trendStats.values) : 0),
    [trendStats.values],
  );
  const trendDirectionLabel = useMemo(() => {
    if (trendStats.delta >= 10) return "en progression";
    if (trendStats.delta <= -10) return "plus irregulier";
    return "plutot stable";
  }, [trendStats.delta]);

  const timingBuckets = useMemo(() => {
    const buckets: TimingBucket[] = [
      {
        key: "morning",
        label: "Matin",
        total: 0,
        taken: 0,
        accent: "#2f675c",
        soft: "rgba(126, 166, 157, 0.15)",
      },
      {
        key: "midday",
        label: "Midi",
        total: 0,
        taken: 0,
        accent: "#bea262",
        soft: "rgba(223, 196, 133, 0.18)",
      },
      {
        key: "evening",
        label: "Soir",
        total: 0,
        taken: 0,
        accent: "#6b7a94",
        soft: "rgba(107, 122, 148, 0.15)",
      },
      {
        key: "flex",
        label: "Libre",
        total: 0,
        taken: 0,
        accent: "#7ea69d",
        soft: "rgba(179, 211, 210, 0.18)",
      },
    ];

    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    for (const group of dayData?.expected_supplements ?? []) {
      const key = timingBucketKey(group.timing);
      const bucket = byKey.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (Boolean(group.taken)) bucket.taken += 1;
    }

    return buckets.filter((bucket) => bucket.total > 0);
  }, [dayData?.expected_supplements]);

  const bestTimingBucket = useMemo(() => {
    const candidates = timingBuckets.filter((bucket) => bucket.total > 0);
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => {
      const ratioDiff = ratioPercent(b.taken, b.total) - ratioPercent(a.taken, a.total);
      if (ratioDiff !== 0) return ratioDiff;
      return b.total - a.total;
    })[0];
  }, [timingBuckets]);

  const monthlyCompletionPercent = useMemo(() => {
    const values = metrics?.monthly_data ?? [];
    if (values.length === 0) return 0;
    const intensitySum = values.reduce((sum, cell) => sum + clampInt(cell.intensity, 0, 3), 0);
    return Math.round((intensitySum / (values.length * 3)) * 100);
  }, [metrics?.monthly_data]);

  const strongMonthDays = useMemo(
    () => (metrics?.monthly_data ?? []).filter((cell) => clampInt(cell.intensity, 0, 3) === 3).length,
    [metrics?.monthly_data],
  );

  const weeklyCompletionSeries = useMemo(() => {
    const exactWeekly = metrics?.weekly_completion_data ?? [];
    if (exactWeekly.length > 0) {
      return exactWeekly.map((item) => ({
        label: formatWeekdayShort(item.ymd),
        ymd: item.ymd,
        percent: clampInt(item.percent, 0, 100),
      }));
    }

    const monthlyTail = (metrics?.monthly_data ?? []).slice(-7);
    if (monthlyTail.length > 0) {
      return monthlyTail.map((cell, index, array) => {
        const offsetFromToday = array.length - 1 - index;
        const ymd = addDaysYmd(anchorYmd, -offsetFromToday);
        const percent = Math.round((clampInt(cell.intensity, 0, 3) / 3) * 100);
        return {
          label: formatWeekdayShort(ymd),
          ymd,
          percent,
        };
      });
    }

    return (metrics?.weekly_data ?? []).map((item, index, array) => {
      const offsetFromToday = array.length - 1 - index;
      const ymd = addDaysYmd(anchorYmd, -offsetFromToday);
      return {
        label: formatWeekdayShort(ymd),
        ymd,
        percent: item.completed ? 100 : 0,
      };
    });
  }, [anchorYmd, metrics?.monthly_data, metrics?.weekly_completion_data, metrics?.weekly_data]);

  const weeklyAveragePercent = useMemo(() => {
    if (weeklyCompletionSeries.length === 0) return 0;
    const total = weeklyCompletionSeries.reduce((sum, item) => sum + item.percent, 0);
    return Math.round(total / weeklyCompletionSeries.length);
  }, [weeklyCompletionSeries]);

  const weeklyConsistencyBreakdown = useMemo(() => {
    const fullDays = weeklyCompletionSeries.filter((item) => item.percent >= 100).length;
    const partialDays = weeklyCompletionSeries.filter(
      (item) => item.percent > 0 && item.percent < 100,
    ).length;
    const missedDays = weeklyCompletionSeries.filter((item) => item.percent <= 0).length;

    return {
      fullDays,
      partialDays,
      missedDays,
    };
  }, [weeklyCompletionSeries]);

  const bestWeekMoment = useMemo(() => {
    if (weeklyCompletionSeries.length === 0) return null;
    return [...weeklyCompletionSeries].sort((a, b) => b.percent - a.percent)[0];
  }, [weeklyCompletionSeries]);

  const weakestWeekMoment = useMemo(() => {
    if (weeklyCompletionSeries.length === 0) return null;
    return [...weeklyCompletionSeries].sort((a, b) => a.percent - b.percent)[0];
  }, [weeklyCompletionSeries]);

  const remainingGroups = useMemo(
    () => (dayData?.expected_supplements ?? []).filter((group) => !group.taken),
    [dayData?.expected_supplements],
  );

  const focusBucketRemainingGroups = useMemo(() => {
    if (!bestTimingBucket) return [];
    return remainingGroups.filter(
      (group) => timingBucketKey(group.timing) === bestTimingBucket.key,
    );
  }, [bestTimingBucket, remainingGroups]);

  const pendingObjectiveSummary = useMemo(() => {
    const counts = new Map<string, number>();

    for (const group of remainingGroups) {
      for (const item of group.items ?? []) {
        const label = (item.objective_label ?? item.objective_key ?? "").trim();
        if (!label) continue;
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, count]) => ({ label, count }));
  }, [remainingGroups]);

  const weeklyBarData = useMemo(
    () =>
      weeklyCompletionSeries.map((item) => ({
        value: item.percent,
        label: item.label,
        frontColor:
          item.percent >= 80
            ? "#2f675c"
            : item.percent >= 50
              ? "#7ea69d"
              : "#dfc485",
        topLabelComponent:
          item.percent > 0
            ? () => <Text style={styles.giftedBarTopLabel}>{`${item.percent}%`}</Text>
            : undefined,
        topLabelContainerStyle:
          item.percent > 0
            ? {
                width: weeklyTopLabelWidth,
                left: weeklyTopLabelOffset,
              }
            : undefined,
      })),
    [weeklyCompletionSeries, weeklyTopLabelOffset, weeklyTopLabelWidth],
  );

  const trendPoints = useMemo(
    () =>
      trendStats.values.map((value, index) => {
        const offset = trendStats.values.length - 1 - index;
        return {
          index,
          value,
          ymd: addDaysYmd(anchorYmd, -offset),
          label: trendStats.labels[index] ?? "",
        };
      }),
    [anchorYmd, trendStats.labels, trendStats.values],
  );

  useEffect(() => {
    if (trendPoints.length === 0) {
      setSelectedTrendIndex(-1);
      return;
    }

    setSelectedTrendIndex((prev) => {
      if (prev >= 0 && prev < trendPoints.length) return prev;
      return trendPoints.length - 1;
    });
  }, [trendPoints.length]);

  const selectedTrendPoint = useMemo(() => {
    if (selectedTrendIndex < 0 || selectedTrendIndex >= trendPoints.length) {
      return null;
    }

    const point = trendPoints[selectedTrendIndex];
    const previousPoint = selectedTrendIndex > 0 ? trendPoints[selectedTrendIndex - 1] : null;

    return {
      ...point,
      previousValue: previousPoint?.value ?? null,
      deltaFromPrevious: previousPoint ? point.value - previousPoint.value : null,
      remainingToGoal: Math.max(100 - point.value, 0),
      ...progressDescriptor(point.value),
    };
  }, [selectedTrendIndex, trendPoints]);

  const trendBarData = useMemo(
    () =>
      trendPoints.map((point, index) => {
        const offset = trendPoints.length - 1 - index;
        const baseLabel = offset === 0 ? (isCompactTrendChart ? "" : "Auj") : point.label;
        const visibleLabel =
          baseLabel ||
          (index === selectedTrendIndex && offset > 0 && !isCompactTrendChart ? `J-${offset}` : "");

        return {
          value: point.value,
          label: visibleLabel,
          barWidth: index === selectedTrendIndex ? trendBarWidth + 2 : trendBarWidth,
          labelTextStyle:
            index === selectedTrendIndex
              ? styles.trendBarLabelActive
              : styles.trendBarLabel,
          frontColor:
            point.value >= 80
              ? "#2f675c"
              : point.value >= 50
                ? "#7ea69d"
              : point.value > 0
                  ? "#dfc485"
                  : "rgba(179, 211, 210, 0.72)",
        };
      }),
    [isCompactTrendChart, selectedTrendIndex, trendBarWidth, trendPoints],
  );

  const weeklyConsistencyDonutData = useMemo(
    () =>
      [
        {
          key: "full",
          label: "Jours complets",
          value: weeklyConsistencyBreakdown.fullDays,
          color: "#2f675c",
        },
        {
          key: "partial",
          label: "Jours partiels",
          value: weeklyConsistencyBreakdown.partialDays,
          color: "#7ea69d",
        },
        {
          key: "missed",
          label: "Jours a relancer",
          value: weeklyConsistencyBreakdown.missedDays,
          color: "#dfc485",
        },
      ].filter((item) => item.value > 0),
    [weeklyConsistencyBreakdown.fullDays, weeklyConsistencyBreakdown.missedDays, weeklyConsistencyBreakdown.partialDays],
  );

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

                  <View style={styles.summaryHeroCard}>
                    <View style={styles.summaryHeroTopRow}>
                      <View style={{ flex: 1, gap: 8 }}>
                        <View style={styles.summaryHeroBadge}>
                          <Text style={styles.summaryHeroBadgeText}>
                            {dayData?.today_progress === 100
                              ? "Journee bouclee"
                              : todayRemainingCount > 0
                                ? `${todayRemainingCount} prise${todayRemainingCount > 1 ? "s" : ""} a finaliser`
                                : "Plan presque termine"}
                          </Text>
                        </View>
                        <Text style={styles.summaryHeroTitle}>
                          {todayTakenCount}/{todayTotalCount} complements valides aujourd hui
                        </Text>
                        <Text style={styles.summaryHeroText}>
                          {bestTimingBucket
                            ? `Le creneau le plus avance est ${bestTimingBucket.label.toLowerCase()} avec ${ratioPercent(bestTimingBucket.taken, bestTimingBucket.total)}% completes.`
                            : "Commencez vos prises du jour pour alimenter votre suivi en temps reel."}
                        </Text>
                      </View>
                      <ProgressRing progress={dayData?.today_progress ?? 0} size={86} strokeWidth={9} />
                    </View>

                    <View style={styles.summaryInsightGrid}>
                      <View style={styles.summaryInsightCard}>
                        <Target size={16} color="#2f675c" />
                        <Text style={styles.summaryInsightValue}>{dayData?.today_progress ?? 0}%</Text>
                        <Text style={styles.summaryInsightLabel}>Progression</Text>
                      </View>
                      <View style={styles.summaryInsightCard}>
                        <Check size={16} color="#2f675c" />
                        <Text style={styles.summaryInsightValue}>{todayTakenCount}</Text>
                        <Text style={styles.summaryInsightLabel}>Pris</Text>
                      </View>
                      <View style={styles.summaryInsightCard}>
                        <ClipboardList size={16} color="#2f675c" />
                        <Text style={styles.summaryInsightValue}>{todayRemainingCount}</Text>
                        <Text style={styles.summaryInsightLabel}>Restants</Text>
                      </View>
                      <View style={styles.summaryInsightCard}>
                        <Flame size={16} color="#2f675c" />
                        <Text style={styles.summaryInsightValue}>
                          {latestTakenEvent ? latestTakenEvent.time : "--"}
                        </Text>
                        <Text style={styles.summaryInsightLabel}>Derniere prise</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Moments de la journee</Text>
                      <Text style={styles.weekSummaryValue}>
                        {bestTimingBucket ? bestTimingBucket.label : "A venir"}
                      </Text>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      Visualisez ou vos prises sont deja couvertes et ou il reste le plus a faire.
                    </Text>
                    {timingBuckets.length === 0 ? (
                      <Text style={styles.emptyText}>Aucun creneau planifie pour ce jour.</Text>
                    ) : (
                      <View style={styles.timingGrid}>
                        {timingBuckets.map((bucket) => {
                          const percent = ratioPercent(bucket.taken, bucket.total);
                          return (
                            <View
                              key={bucket.key}
                              style={[styles.timingCard, { backgroundColor: bucket.soft }]}
                            >
                              <View style={styles.timingCardHeader}>
                                <Text style={styles.timingLabel}>{bucket.label}</Text>
                                <Text style={[styles.timingValue, { color: bucket.accent }]}>
                                  {percent}%
                                </Text>
                              </View>
                              <View style={styles.timingTrack}>
                                <View
                                  style={[
                                    styles.timingFill,
                                    { width: `${percent}%`, backgroundColor: bucket.accent },
                                  ]}
                                />
                              </View>
                              <Text style={styles.timingMeta}>
                                {bucket.taken}/{bucket.total} complement
                                {bucket.total > 1 ? "s" : ""}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Rythme de la semaine</Text>
                      <Text style={styles.weekSummaryValue}>{weeklyAveragePercent}%</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      Chaque barre montre votre completion exacte sur les 7 derniers jours.
                    </Text>
                    {weeklyCompletionSeries.length > 0 ? (
                      <View style={styles.rhythmChartShell}>
                        <View style={styles.rhythmChartPanel}>
                          <GiftedBarChart
                            data={weeklyBarData}
                            width={weeklyChartWidth}
                            barWidth={weeklyBarWidth}
                            spacing={weeklyBarSpacing}
                            initialSpacing={weeklyBarInitialSpacing}
                            endSpacing={weeklyBarEndSpacing}
                            overflowTop={34}
                            roundedTop
                            roundedBottom
                            hideRules={false}
                            rulesColor="rgba(20, 39, 45, 0.08)"
                            yAxisColor="rgba(20, 39, 45, 0.1)"
                            xAxisColor="rgba(20, 39, 45, 0.12)"
                            yAxisTextStyle={styles.giftedAxisText}
                            xAxisLabelTextStyle={styles.giftedAxisText}
                            noOfSections={4}
                            maxValue={100}
                            stepValue={25}
                            isAnimated
                            animationDuration={650}
                            disableScroll
                            height={190}
                            yAxisLabelWidth={32}
                          />
                        </View>
                        <View style={styles.rhythmInsightsRow}>
                          <View style={styles.rhythmInsightCard}>
                            <Text style={styles.rhythmInsightValue}>{bestWeekMoment?.percent ?? 0}%</Text>
                            <Text style={styles.rhythmInsightLabel}>
                              Jour fort{bestWeekMoment ? ` - ${bestWeekMoment.label}` : ""}
                            </Text>
                          </View>
                          <View style={styles.rhythmInsightCard}>
                            <Text style={styles.rhythmInsightValue}>{weakestWeekMoment?.percent ?? 0}%</Text>
                            <Text style={styles.rhythmInsightLabel}>
                              Point bas{weakestWeekMoment ? ` - ${weakestWeekMoment.label}` : ""}
                            </Text>
                          </View>
                          <View style={styles.rhythmInsightCard}>
                            <Text style={styles.rhythmInsightValue}>
                              {weeklyCompletedCount}/{weeklyCompletionSeries.length}
                            </Text>
                            <Text style={styles.rhythmInsightLabel}>Jours complets</Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>Pas encore assez de donnees.</Text>
                    )}
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Pilotage du jour</Text>
                      <Text style={styles.weekSummaryValue}>{todayRemainingCount} restant{todayRemainingCount > 1 ? "s" : ""}</Text>
                    </View>

                    <Text style={styles.cardSubtitle}>
                      Ce bloc vous dit quoi finir maintenant, et quel impact cela aura sur votre journee.
                    </Text>
                    <View style={styles.focusList}>
                      <View style={styles.focusItem}>
                        <Text style={styles.focusLabel}>Creneau prioritaire</Text>
                        <Text style={styles.focusValue}>
                          {bestTimingBucket
                            ? `${bestTimingBucket.label}: ${bestTimingBucket.total - bestTimingBucket.taken} prise${bestTimingBucket.total - bestTimingBucket.taken > 1 ? "s" : ""} restante${bestTimingBucket.total - bestTimingBucket.taken > 1 ? "s" : ""}`
                            : "Aucun creneau prioritaire"}
                        </Text>
                        {focusBucketRemainingGroups.length > 0 ? (
                          <Text style={styles.focusMeta}>
                            {focusBucketRemainingGroups
                              .slice(0, 2)
                              .map((group) => group.name)
                              .join(" - ")}
                            {focusBucketRemainingGroups.length > 2
                              ? ` +${focusBucketRemainingGroups.length - 2}`
                              : ""}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.focusItem}>
                        <Text style={styles.focusLabel}>Objectifs encore impactes</Text>
                        <Text style={styles.focusValue}>
                          {pendingObjectiveSummary.length > 0
                            ? pendingObjectiveSummary
                                .map((item) => `${item.label} (${item.count})`)
                                .join(" - ")
                            : "Toutes les prises du jour sont enregistrees"}
                        </Text>
                      </View>
                      <View style={styles.focusItem}>
                        <Text style={styles.focusLabel}>Dernier signal du jour</Text>
                        <Text style={styles.focusValue}>
                          {latestTakenEvent
                            ? `${latestTakenEvent.time} - ${latestTakenEvent.name}`
                            : "Aucune prise validee pour le moment"}
                        </Text>
                        <Text style={styles.focusMeta}>
                          {todayRemainingCount === 0
                            ? "Journee complete"
                            : `${todayTakenCount}/${todayTotalCount} deja valides`}
                        </Text>
                      </View>
                    </View>
                    {onOpenRecommendations ? (
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        onPress={onOpenRecommendations}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.secondaryActionText}>Ouvrir Recommandations</Text>
                      </TouchableOpacity>
                    ) : null}
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

                </>
              )}

              {segment === "trends" && (
                <>
                  <View
                    className="rounded-[24px] border border-white/10 bg-white/10 p-4"
                    style={styles.summaryHeroCard}
                  >
                    <View style={styles.summaryHeroTopRow}>
                      <View style={{ flex: 1, gap: 8 }}>
                        <View
                          className="self-start rounded-full border border-white/10 bg-white/10 px-3 py-1"
                          style={styles.summaryHeroBadge}
                        >
                          <Text style={styles.summaryHeroBadgeText}>10 derniers jours</Text>
                        </View>
                        <Text style={styles.summaryHeroTitle}>
                          {trendFullDays} jour{trendFullDays > 1 ? "s" : ""} complet
                          {trendFullDays > 1 ? "s" : ""} sur 10
                        </Text>
                        <Text style={styles.summaryHeroText}>
                          Votre suivi recent est {trendDirectionLabel}. Moyenne {trendStats.avg10}%,
                          dernier jour a {trendLatestValue}% et meilleur niveau a {trendBestValue}%.
                        </Text>
                      </View>
                      <View
                        className="items-center justify-center rounded-[18px] border border-white/10 bg-white/10 px-3 py-4"
                        style={styles.trendHeroValue}
                      >
                        <Text style={styles.trendHeroValueNumber}>{trendLatestValue}%</Text>
                        <Text style={styles.trendHeroValueLabel}>Dernier jour</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.metricGrid}>
                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <Flame size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Serie active</Text>
                      <Text style={styles.metricValue}>{trendStats.streak}j</Text>
                      <Text style={styles.metricHint}>jours consecutifs a 100%</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <Check size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Jours complets</Text>
                      <Text style={styles.metricValue}>{trendFullDays}/10</Text>
                      <Text style={styles.metricHint}>journees totalement validees</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <Activity size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Constance</Text>
                      <Text style={styles.metricValue}>{trendStats.consistency}%</Text>
                      <Text style={styles.metricHint}>
                        {trendStats.weeklyDone}/{trendStats.weeklyTotal} jours complets
                      </Text>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Evolution (10 jours)</Text>
                      {selectedTrendPoint ? (
                        <View className="rounded-full border border-black/10 bg-[#f3f7f3] px-3 py-1">
                          <Text className="text-xs font-extrabold text-[#14272d]">
                            {selectedTrendPoint.value}%
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.cardSubtitle}>
                      Chaque barre represente une journee. Touchez une barre pour voir son detail.
                    </Text>

                    {trendStats.values.length > 1 ? (
                      <View
                        className="mt-4 rounded-[20px] border border-black/5 bg-white px-3 pt-3 pb-4"
                        style={styles.trendBarsShell}
                      >
                        <View className="flex-row flex-wrap gap-3 px-0.5" style={styles.trendBarsLegendRow}>
                          <View style={styles.trendLegendItem}>
                            <View style={[styles.trendLegendSwatch, { backgroundColor: "#2f675c" }]} />
                            <Text style={styles.trendLegendText}>80 a 100%</Text>
                          </View>
                          <View style={styles.trendLegendItem}>
                            <View style={[styles.trendLegendSwatch, { backgroundColor: "#7ea69d" }]} />
                            <Text style={styles.trendLegendText}>50 a 79%</Text>
                          </View>
                          <View style={styles.trendLegendItem}>
                            <View style={[styles.trendLegendSwatch, { backgroundColor: "#dfc485" }]} />
                            <Text style={styles.trendLegendText}>1 a 49%</Text>
                          </View>
                        </View>

                        <View style={styles.rhythmChartPanel}>
                          <GiftedBarChart
                            data={trendBarData}
                            width={trendChartWidth}
                            height={188}
                            barWidth={trendBarWidth}
                            spacing={trendBarSpacing}
                            initialSpacing={trendBarInitialSpacing}
                            endSpacing={trendBarEndSpacing}
                            overflowTop={12}
                            minHeight={6}
                            roundedTop
                            roundedBottom
                            adjustToWidth
                            hideRules={false}
                            rulesColor="rgba(20, 39, 45, 0.08)"
                            yAxisColor="rgba(20, 39, 45, 0.10)"
                            xAxisColor="rgba(20, 39, 45, 0.12)"
                            yAxisTextStyle={styles.giftedAxisText}
                            xAxisLabelTextStyle={styles.giftedAxisText}
                            noOfSections={4}
                            maxValue={100}
                            stepValue={25}
                            yAxisLabelWidth={30}
                            xAxisLabelsVerticalShift={2}
                            isAnimated
                            animationDuration={650}
                            disableScroll
                            onPress={(_: unknown, index: number) => setSelectedTrendIndex(index)}
                          />
                        </View>
                        <Text style={styles.trendChartHint}>
                          Lecture rapide: plus la barre est haute, plus la journee est complete.
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>Pas encore assez de donnees.</Text>
                    )}

                    {selectedTrendPoint ? (
                      <View style={styles.trendFocusCard}>
                        <View style={styles.trendFocusHeader}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={styles.trendFocusEyebrow}>Jour selectionne</Text>
                            <Text style={styles.trendFocusTitle}>
                              {formatDateLabel(selectedTrendPoint.ymd)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.trendFocusBadge,
                              selectedTrendPoint.tone === "strong"
                                ? styles.trendFocusBadgeStrong
                                : selectedTrendPoint.tone === "mid"
                                  ? styles.trendFocusBadgeMid
                                  : selectedTrendPoint.tone === "soft"
                                    ? styles.trendFocusBadgeSoft
                                    : styles.trendFocusBadgeEmpty,
                            ]}
                          >
                            <Text style={styles.trendFocusBadgeText}>
                              {selectedTrendPoint.value}%
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.trendFocusText}>{selectedTrendPoint.title}</Text>
                        <Text style={styles.trendFocusMeta}>{selectedTrendPoint.hint}</Text>
                        <View style={styles.trendFocusStatsRow}>
                          <View style={styles.trendFocusStat}>
                            <Text
                              style={[
                                styles.trendFocusStatValue,
                                selectedTrendPoint.previousValue != null &&
                                selectedTrendPoint.value < selectedTrendPoint.previousValue
                                  ? styles.trendFocusStatDown
                                  : styles.trendFocusStatUp,
                              ]}
                            >
                              {selectedTrendPoint.previousValue == null
                                ? "--"
                                : `${selectedTrendPoint.previousValue}%`}
                            </Text>
                            <Text style={styles.trendFocusStatLabel}>veille</Text>
                          </View>
                          <View style={styles.trendFocusStat}>
                            <Text style={styles.trendFocusStatValue}>
                              {selectedTrendPoint.remainingToGoal === 0
                                ? "Atteint"
                                : `${selectedTrendPoint.remainingToGoal}%`}
                            </Text>
                            <Text style={styles.trendFocusStatLabel}>
                              {selectedTrendPoint.remainingToGoal === 0
                                ? "objectif 100%"
                                : "restant jusqu a 100%"}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.trendFocusButton}
                          onPress={() => openDaySheet(selectedTrendPoint.ymd)}
                          activeOpacity={0.9}
                        >
                          <Text style={styles.trendFocusButtonText}>Voir le detail du jour</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Constance hebdomadaire</Text>
                      <Text style={styles.weekSummaryValue}>{trendStats.consistency}%</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      Repartition des 7 derniers jours entre jours complets, partiels et jours a relancer.
                    </Text>
                    {weeklyCompletionSeries.length > 0 ? (
                      <View style={styles.consistencyDonutShell}>
                        <View style={styles.consistencyDonutChart}>
                          <GiftedPieChart
                            data={weeklyConsistencyDonutData}
                            donut
                            radius={78}
                            innerRadius={54}
                            innerCircleColor="#ffffff"
                            strokeColor="#ffffff"
                            strokeWidth={3}
                            isAnimated
                            animationDuration={700}
                            centerLabelComponent={() => (
                              <View style={styles.consistencyDonutCenter}>
                                <Text style={styles.consistencyDonutCenterValue}>
                                  {weeklyCompletedCount}/{weeklyCompletionSeries.length}
                                </Text>
                                <Text style={styles.consistencyDonutCenterLabel}>jours solides</Text>
                              </View>
                            )}
                          />
                        </View>
                        <View style={styles.consistencyLegendList}>
                          {weeklyConsistencyDonutData.map((item) => (
                            <View key={item.key} style={styles.consistencyLegendItem}>
                              <View
                                style={[
                                  styles.consistencyLegendSwatch,
                                  { backgroundColor: item.color },
                                ]}
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.consistencyLegendLabel}>{item.label}</Text>
                                <Text style={styles.consistencyLegendHint}>
                                  {item.key === "full"
                                    ? "Routine bien tenue"
                                    : item.key === "partial"
                                      ? "Progression inegale"
                                      : "Journee a relancer"}
                                </Text>
                              </View>
                              <Text style={styles.consistencyLegendValue}>{item.value}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>Pas encore assez de donnees.</Text>
                    )}
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Cap du mois</Text>
                      <Text style={styles.weekSummaryValue}>{monthlyCompletionPercent}%</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      Calcul base sur l intensite de vos 30 derniers jours.
                    </Text>
                    <View style={styles.monthProgressTrack}>
                      <View
                        style={[
                          styles.monthProgressFill,
                          { width: `${monthlyCompletionPercent}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.weekHighlightsRow}>
                      <View style={styles.weekHighlightCard}>
                        <Text style={styles.weekHighlightValue}>{strongMonthDays}</Text>
                        <Text style={styles.weekHighlightLabel}>Jours a 100%</Text>
                      </View>
                      <View style={styles.weekHighlightCard}>
                        <Text style={styles.weekHighlightValue}>{trendStats.streak}j</Text>
                        <Text style={styles.weekHighlightLabel}>Serie active</Text>
                      </View>
                    </View>
                  </View>

                </>
              )}

              {segment === "history" && (
                <>
                  <View style={styles.metricGrid}>
                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <Target size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Mois en cours</Text>
                      <Text style={styles.metricValue}>{monthlyCompletionPercent}%</Text>
                      <Text style={styles.metricHint}>synthese ponderee sur 30 jours</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <Check size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Jours a 100%</Text>
                      <Text style={styles.metricValue}>{strongMonthDays}</Text>
                      <Text style={styles.metricHint}>journees totalement validees</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <View style={styles.metricIcon}>
                        <Flame size={18} color="#2f675c" />
                      </View>
                      <Text style={styles.metricLabel}>Serie active</Text>
                      <Text style={styles.metricValue}>{trendStats.streak}j</Text>
                      <Text style={styles.metricHint}>jours consecutifs a 100% jusqu a aujourd hui</Text>
                    </View>
                  </View>

                  

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Historique (30 jours)</Text>
                    <Text style={styles.cardSubtitle}>
                      {formatDateLabel(addDaysYmd(anchorYmd, -29))} {"->"} {formatDateLabel(anchorYmd)}
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
                </>
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
          <ScrollView
            style={styles.sheetBody}
            contentContainerStyle={styles.sheetBodyContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
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
                      {sheetData.supplements_taken}/{sheetData.supplements_total} complements
                    </Text>
                  </View>
                </View>

                <View style={[styles.card, { marginTop: 14 }]}>
                  <Text style={styles.cardTitle}>Plan</Text>
                  {(sheetData.expected_supplements ?? []).length === 0 ? (
                    <Text style={styles.emptyText}>Aucun complement planifie.</Text>
                  ) : (
                    <View style={styles.checklist}>
                      {(sheetData.expected_supplements ?? []).map((group) => {
                        const tLabel = timingLabel(group.timing);
                        const objectives = dedupeStrings(
                          (group.items ?? [])
                            .map((item) => item.objective_label ?? item.objective_key ?? "")
                            .filter(Boolean),
                        );
                        const objectiveText =
                          objectives.length > 0
                            ? `${objectives.slice(0, 2).join(" / ")}${objectives.length > 2 ? ` +${objectives.length - 2}` : ""}`
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
                                  {group.dosage ? ` - ${group.dosage}` : ""}
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
                    {(sheetData.daily_intakes ?? []).map((event, idx) => (
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
          </ScrollView>
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
  summaryHeroCard: {
    backgroundColor: "#1c3c42",
    borderRadius: 22,
    padding: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  summaryHeroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  summaryHeroBadge: {
    alignSelf: "flex-start",
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(223, 196, 133, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHeroBadgeText: {
    color: "#fef6e2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  summaryHeroTitle: {
    color: "white",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  summaryHeroText: {
    color: "rgba(231, 237, 231, 0.9)",
    fontSize: 13,
    lineHeight: 20,
  },
  summaryInsightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryInsightCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(179, 211, 210, 0.18)",
  },
  summaryInsightValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryInsightLabel: {
    color: "#b3d3d2",
    fontSize: 11,
    fontWeight: "700",
  },
  trendHeroValue: {
    minWidth: 92,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(179, 211, 210, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  trendHeroValueNumber: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  trendHeroValueLabel: {
    color: "#b3d3d2",
    fontSize: 11,
    fontWeight: "700",
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
  timingGrid: {
    gap: 10,
  },
  timingCard: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  timingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  timingLabel: {
    color: "#14272d",
    fontSize: 13,
    fontWeight: "800",
  },
  timingValue: {
    fontSize: 14,
    fontWeight: "900",
  },
  timingTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    overflow: "hidden",
  },
  timingFill: {
    height: "100%",
    borderRadius: 999,
  },
  timingMeta: {
    color: "rgba(20, 39, 45, 0.7)",
    fontSize: 12,
    fontWeight: "700",
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
  chart: {
    marginTop: 12,
    borderRadius: 16,
  },
  trendBarsShell: {
    marginTop: 16,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    overflow: "hidden",
  },
  trendBarsLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 2,
  },
  trendLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trendLegendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  trendLegendText: {
    color: "#7ea69d",
    fontSize: 11,
    fontWeight: "700",
  },
  giftedBarShell: {
    marginTop: 16,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.74)",
    overflow: "hidden",
  },
  rhythmChartShell: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    overflow: "hidden",
  },
  rhythmChartPanel: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  giftedAxisText: {
    color: "#7ea69d",
    fontSize: 10,
    fontWeight: "700",
  },
  giftedBarTopLabel: {
    color: "#14272d",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  trendBarLabel: {
    color: "#7ea69d",
    fontSize: 10,
    fontWeight: "700",
  },
  trendBarLabelActive: {
    color: "#14272d",
    fontSize: 10,
    fontWeight: "900",
  },
  trendChartHint: {
    color: "#7ea69d",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  trendFocusCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    backgroundColor: "rgba(231, 237, 231, 0.66)",
    gap: 10,
  },
  trendFocusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trendFocusEyebrow: {
    color: "#7ea69d",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  trendFocusTitle: {
    color: "#14272d",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  trendFocusBadge: {
    minWidth: 64,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  trendFocusBadgeStrong: {
    backgroundColor: "rgba(126, 166, 157, 0.18)",
    borderColor: "rgba(47, 103, 92, 0.28)",
  },
  trendFocusBadgeMid: {
    backgroundColor: "rgba(223, 196, 133, 0.22)",
    borderColor: "rgba(190, 162, 98, 0.36)",
  },
  trendFocusBadgeSoft: {
    backgroundColor: "rgba(179, 211, 210, 0.25)",
    borderColor: "rgba(126, 166, 157, 0.26)",
  },
  trendFocusBadgeEmpty: {
    backgroundColor: "rgba(255, 255, 255, 0.74)",
    borderColor: "rgba(179, 211, 210, 0.65)",
  },
  trendFocusBadgeText: {
    color: "#14272d",
    fontSize: 13,
    fontWeight: "900",
  },
  trendFocusText: {
    color: "#14272d",
    fontSize: 14,
    fontWeight: "800",
  },
  trendFocusMeta: {
    color: "rgba(20, 39, 45, 0.72)",
    fontSize: 12,
    lineHeight: 18,
  },
  trendFocusStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  trendFocusStat: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    gap: 4,
  },
  trendFocusStatValue: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "900",
  },
  trendFocusStatUp: {
    color: "#2f675c",
  },
  trendFocusStatDown: {
    color: "#8b6b2f",
  },
  trendFocusStatLabel: {
    color: "#7ea69d",
    fontSize: 11,
    fontWeight: "700",
  },
  trendFocusButton: {
    height: 42,
    borderRadius: 14,
    backgroundColor: "#14272d",
    alignItems: "center",
    justifyContent: "center",
  },
  trendFocusButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  rhythmInsightsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(20, 39, 45, 0.06)",
    backgroundColor: "rgba(231, 237, 231, 0.42)",
  },
  rhythmInsightCard: {
    flex: 1,
    minWidth: 88,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(126, 166, 157, 0.14)",
    gap: 4,
  },
  rhythmInsightValue: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "900",
  },
  rhythmInsightLabel: {
    color: "#6b8b83",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  consistencyDonutShell: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    gap: 16,
  },
  consistencyDonutChart: {
    alignItems: "center",
    justifyContent: "center",
  },
  consistencyDonutCenter: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  consistencyDonutCenterValue: {
    color: "#14272d",
    fontSize: 20,
    fontWeight: "900",
  },
  consistencyDonutCenterLabel: {
    color: "#7ea69d",
    fontSize: 11,
    fontWeight: "700",
  },
  consistencyLegendList: {
    gap: 10,
  },
  consistencyLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(126, 166, 157, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  consistencyLegendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  consistencyLegendLabel: {
    color: "#14272d",
    fontSize: 13,
    fontWeight: "800",
  },
  consistencyLegendHint: {
    color: "#7ea69d",
    fontSize: 11,
    marginTop: 2,
  },
  consistencyLegendValue: {
    color: "#14272d",
    fontSize: 18,
    fontWeight: "900",
  },
  weekColumnsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  weekColumn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  weekColumnTrack: {
    width: "100%",
    maxWidth: 28,
    height: 104,
    borderRadius: 999,
    backgroundColor: "rgba(126, 166, 157, 0.12)",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  weekColumnFill: {
    width: "100%",
    minHeight: 2,
    borderRadius: 999,
  },
  weekColumnFillDone: {
    backgroundColor: "#2f675c",
  },
  weekColumnFillPending: {
    backgroundColor: "rgba(223, 196, 133, 0.24)",
  },
  weekColumnLabel: {
    color: "#7ea69d",
    fontSize: 12,
    fontWeight: "800",
  },
  weekColumnValue: {
    color: "#14272d",
    fontSize: 11,
    fontWeight: "700",
  },
  weekHighlightsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  weekHighlightCard: {
    flex: 1,
    minWidth: 110,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(231, 237, 231, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(126, 166, 157, 0.16)",
    gap: 4,
  },
  weekHighlightValue: {
    color: "#14272d",
    fontSize: 18,
    fontWeight: "900",
  },
  weekHighlightLabel: {
    color: "#7ea69d",
    fontSize: 11,
    fontWeight: "700",
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
  focusList: {
    gap: 10,
  },
  focusItem: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(231, 237, 231, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    gap: 4,
  },
  focusLabel: {
    color: "#7ea69d",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  focusValue: {
    color: "#14272d",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  focusMeta: {
    color: "#7ea69d",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  secondaryActionButton: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "#14272d",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
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
  kpiExplainList: {
    marginTop: 4,
    gap: 12,
  },
  kpiExplainItem: {
    gap: 4,
  },
  kpiExplainLabel: {
    color: "#14272d",
    fontSize: 13,
    fontWeight: "800",
  },
  kpiExplainText: {
    color: "rgba(20, 39, 45, 0.72)",
    fontSize: 12,
    lineHeight: 18,
  },
  monthProgressTrack: {
    marginTop: 8,
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(179, 211, 210, 0.28)",
    overflow: "hidden",
  },
  monthProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2f675c",
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
    flexGrow: 0,
  },
  sheetBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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


