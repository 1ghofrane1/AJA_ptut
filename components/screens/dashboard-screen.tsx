import { HeaderLogoutButton } from "@/components/header-logout-button";
import { useAuth } from "@/context/auth";
import {
  getDashboardRandomQuestions,
  getProgress,
  type HomeQuestionResponse,
  type ProgressResponse,
  type UserResponse,
} from "@/services/api";
import { ArrowRight, Check, ClipboardList, Sparkles, Target } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

interface DashboardScreenProps {
  userName?: string;
  onAddGoal?: () => void;
  onOpenTracking?: () => void;
}

type QuestionCache = {
  token: string | null;
  questions: HomeQuestionResponse[];
};

let questionSessionCache: QuestionCache | null = null;

function getDisplayName(user: ReturnType<typeof useAuth>["user"], fallback?: string) {
  const profile = (user?.profile ?? {}) as UserResponse["profile"];
  const profileRecord =
    typeof profile === "object" && profile !== null ? (profile as Record<string, unknown>) : null;
  const personal =
    profileRecord && "personal" in profileRecord
      ? (profileRecord.personal as Record<string, unknown> | null | undefined)
      : null;
  const personalRecord =
    typeof personal === "object" && personal !== null ? personal : null;

  const rawName =
    personalRecord?.name ||
    personalRecord?.first_name ||
    profileRecord?.first_name ||
    fallback ||
    user?.email?.split("@")[0] ||
    "vous";

  return String(rawName).trim().split(" ")[0] || "vous";
}

export function DashboardScreen({
  userName,
  onAddGoal,
  onOpenTracking,
}: DashboardScreenProps) {
  const { user, token } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const carouselRef = useRef<ScrollView | null>(null);
  const activeIndexRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<HomeQuestionResponse[]>([]);
  const [trackingPreview, setTrackingPreview] = useState<ProgressResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slideWidth = Math.max(280, Math.min(windowWidth - 48, 560));
  const slideGap = 12;
  const slideInterval = slideWidth + slideGap;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setQuestionsError(null);
      setPreviewError(null);

      if (
        questionSessionCache &&
        questionSessionCache.token === token &&
        questionSessionCache.questions.length > 0
      ) {
        setQuestions(questionSessionCache.questions);
      }

      const [questionsResult, previewResult] = await Promise.allSettled([
        questionSessionCache &&
        questionSessionCache.token === token &&
        questionSessionCache.questions.length > 0
          ? Promise.resolve(questionSessionCache.questions)
          : getDashboardRandomQuestions(4),
        getProgress(),
      ]);

      if (!mounted) return;

      if (questionsResult.status === "fulfilled") {
        setQuestions(questionsResult.value);
        questionSessionCache = {
          token,
          questions: questionsResult.value,
        };
      } else {
        console.error("Failed to load home questions:", questionsResult.reason);
        setQuestionsError("Impossible de charger les questions du moment.");
      }

      if (previewResult.status === "fulfilled") {
        setTrackingPreview(previewResult.value);
      } else {
        console.error("Failed to load tracking preview:", previewResult.reason);
        setPreviewError("Impossible de charger l apercu du suivi.");
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (questions.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % questions.length;
      carouselRef.current?.scrollTo({
        x: nextIndex * slideInterval,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(timer);
  }, [questions.length, slideInterval]);

  const displayName = useMemo(() => getDisplayName(user, userName), [user, userName]);
  const previewRemaining = Math.max(
    0,
    (trackingPreview?.supplements_total ?? 0) - (trackingPreview?.supplements_taken ?? 0),
  );
  const previewPlan = useMemo(
    () => (trackingPreview?.expected_supplements ?? []).slice(0, 3),
    [trackingPreview?.expected_supplements],
  );

  const handleCarouselEnd = (offsetX: number) => {
    if (slideInterval <= 0) return;
    const next = Math.max(0, Math.min(questions.length - 1, Math.round(offsetX / slideInterval)));
    setActiveIndex(next);
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-aja-cream"
        style={[styles.container, styles.centered]}
      >
        <ActivityIndicator size="large" color="#7ea69d" />
      </View>
    );
  }

  if (questionsError && !trackingPreview) {
    return (
      <View
        className="flex-1 items-center justify-center bg-aja-cream"
        style={[styles.container, styles.centered]}
      >
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{questionsError}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-aja-cream"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color="#14272d" />
            <Text style={styles.heroBadgeText}>Accueil</Text>
          </View>
          <HeaderLogoutButton />
        </View>
        <Text style={styles.heroTitle}>Bonjour, {displayName}</Text>
        <Text style={styles.heroSubtitle}>
          Une page courte et utile pour decouvrir, puis replonger dans votre suivi.
        </Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Questions du moment</Text>
        </View>

        {questions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune carte disponible</Text>
            <Text style={styles.emptyText}>
              Les questions apparaitront ici des que la base encyclopedique aura des fiches pretes.
            </Text>
          </View>
        ) : (
          <View style={styles.carouselBlock}>
            <ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={slideInterval}
              snapToAlignment="start"
              disableIntervalMomentum
              contentContainerStyle={styles.carouselContent}
              onMomentumScrollEnd={(event) =>
                handleCarouselEnd(event.nativeEvent.contentOffset.x)
              }
            >
              {questions.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.questionCard,
                    { width: slideWidth },
                    index < questions.length - 1 && { marginRight: slideGap },
                  ]}
                >
                  <View style={styles.questionMetaRow}>
                    <Text style={styles.questionCategory}>{item.category}</Text>
                    <Text style={styles.questionSupplement}>{item.supplement_name}</Text>
                  </View>
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.paginationRow}>
              {questions.map((item, index) => (
                <View
                  key={`dot-${item.id}`}
                  style={[
                    styles.paginationDot,
                    index === activeIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Apercu du suivi</Text>
        </View>

        {previewError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Apercu indisponible</Text>
            <Text style={styles.emptyText}>{previewError}</Text>
          </View>
        ) : trackingPreview ? (
          <View style={styles.previewCard}>
            <View style={styles.previewTopRow}>
              <View>
                <Text style={styles.previewBadge}>Aujourd hui</Text>
                <Text style={styles.previewTitle}>Votre suivi en bref</Text>
              </View>
              <View style={styles.previewProgressPill}>
                <Text style={styles.previewProgressText}>{trackingPreview.today_progress}%</Text>
              </View>
            </View>

            <View style={styles.previewStatsRow}>
              <View style={styles.previewStatItem}>
                <Target size={15} color="#2f675c" />
                <Text style={styles.previewStatValue}>{trackingPreview.today_progress}%</Text>
                <Text style={styles.previewStatLabel}>Progression</Text>
              </View>
              <View style={styles.previewDivider} />
              <View style={styles.previewStatItem}>
                <Check size={15} color="#2f675c" />
                <Text style={styles.previewStatValue}>{trackingPreview.supplements_taken ?? 0}</Text>
                <Text style={styles.previewStatLabel}>Pris</Text>
              </View>
              <View style={styles.previewDivider} />
              <View style={styles.previewStatItem}>
                <ClipboardList size={15} color="#2f675c" />
                <Text style={styles.previewStatValue}>{trackingPreview.supplements_total ?? 0}</Text>
                <Text style={styles.previewStatLabel}>Prevus</Text>
              </View>
            </View>

            <View style={styles.previewInnerCard}>
              <Text style={styles.previewInnerTitle}>
                {previewRemaining} complement{previewRemaining > 1 ? "s" : ""} restant
                {previewRemaining > 1 ? "s" : ""}
              </Text>
              {previewPlan.length === 0 ? (
                <Text style={styles.previewEmptyText}>Aucun complement planifie pour aujourd hui.</Text>
              ) : (
                <View style={styles.previewList}>
                  {previewPlan.map((item) => (
                    <View key={item.id} style={styles.previewListRow}>
                      <View
                        style={[
                          styles.previewListDot,
                          item.taken && styles.previewListDotDone,
                        ]}
                      />
                      <Text style={styles.previewListText} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.trackingButton}
              onPress={onOpenTracking}
              activeOpacity={0.9}
            >
              <Text style={styles.trackingButtonText}>Ouvrir le suivi complet</Text>
              <ArrowRight size={18} color="white" />
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={styles.goalsButton} onPress={onAddGoal} activeOpacity={0.9}>
          <View>
            <Text style={styles.goalsButtonLabel}>Objectifs</Text>
            <Text style={styles.goalsButtonTitle}>Mettre a jour mon profil et mes objectifs</Text>
          </View>
          <ArrowRight size={18} color="#14272d" />
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingBottom: 104,
  },
  hero: {
    backgroundColor: "#14272d",
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#dfc485",
  },
  heroBadgeText: {
    color: "#14272d",
    fontSize: 12,
    fontWeight: "800",
  },
  heroTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#b3d3d2",
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 420,
  },
  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 22,
    gap: 18,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: "#14272d",
    fontSize: 20,
    fontWeight: "800",
  },
  sectionHint: {
    color: "#7ea69d",
    fontSize: 13,
  },
  carouselBlock: {
    gap: 12,
  },
  carouselContent: {
    paddingRight: 24,
  },
  questionCard: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  questionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  questionCategory: {
    color: "#2f675c",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  questionSupplement: {
    color: "#7ea69d",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  questionText: {
    color: "#14272d",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
  },
  answerText: {
    color: "rgba(20, 39, 45, 0.78)",
    fontSize: 14,
    lineHeight: 22,
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(126, 166, 157, 0.25)",
  },
  paginationDotActive: {
    width: 22,
    backgroundColor: "#2f675c",
  },
  previewCard: {
    backgroundColor: "#14272d",
    borderRadius: 24,
    padding: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  previewTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  previewBadge: {
    color: "#dfc485",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  previewTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  previewProgressPill: {
    minWidth: 72,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewProgressText: {
    color: "#dfc485",
    fontSize: 16,
    fontWeight: "800",
  },
  previewStatsRow: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  previewStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  previewDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(179, 211, 210, 0.18)",
  },
  previewStatValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  previewStatLabel: {
    color: "#b3d3d2",
    fontSize: 11,
    fontWeight: "700",
  },
  previewInnerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  previewInnerTitle: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "800",
  },
  previewList: {
    gap: 10,
  },
  previewListRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewListDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#dfc485",
  },
  previewListDotDone: {
    backgroundColor: "#2f675c",
  },
  previewListText: {
    flex: 1,
    color: "#14272d",
    fontSize: 14,
    fontWeight: "600",
  },
  previewEmptyText: {
    color: "#7ea69d",
    fontSize: 14,
    lineHeight: 22,
  },
  trackingButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2f675c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  trackingButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  goalsButton: {
    marginTop: 6,
    backgroundColor: "rgba(223, 196, 133, 0.28)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(190, 162, 98, 0.34)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  goalsButtonLabel: {
    color: "#7ea69d",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  goalsButtonTitle: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.06)",
    gap: 8,
  },
  emptyTitle: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: "#7ea69d",
    fontSize: 14,
    lineHeight: 22,
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
