import { BottomNavigation } from "@/components/bottom-navigation";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { EncyclopedieScreen } from "@/components/screens/encyclopedie-screen";
import { LoginScreen } from "@/components/screens/login-screen";
import { OnboardingScreen } from "@/components/screens/onboarding-screen";
import { RecommendationsScreen } from "@/components/screens/recommendations-screen";
import { SignupScreen } from "@/components/screens/signup-screen";
import { SuiviScreen } from "@/components/screens/suivi-screen";
import { WelcomeScreen } from "@/components/screens/welcome-screen";
import { AuthProvider, useAuth } from "@/context/auth";
import { type UserResponse } from "@/services/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

type Screen =
  | "welcome"
  | "login"
  | "signup"
  | "onboarding"
  | "dashboard"
  | "goals"
  | "profile";

type Tab = "accueil" | "recommandations" | "suivi" | "encyclopedie";

function needsOnboarding(user: UserResponse | null) {
  if (!user) return false;
  const profile = user?.profile ?? {};
  const goals = Array.isArray(profile.goals)
    ? profile.goals.filter((item: unknown) => typeof item === "string" && item.trim())
    : [];
  const activityLevel =
    typeof profile.activity_level === "string"
      ? profile.activity_level.trim()
      : "";
  return goals.length === 0 || !activityLevel;
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootApp />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
function RootApp() {
  const { token, user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [activeTab, setActiveTab] = useState<Tab>("accueil");

  useEffect(() => {
    if (loading) return;

    if (token) {
      setCurrentScreen((prev) => {
        if (needsOnboarding(user)) {
          return "onboarding";
        }
        if (prev === "welcome" || prev === "login" || prev === "signup") {
          return "dashboard";
        }
        return prev;
      });
      return;
    }

    setCurrentScreen("welcome");
    setActiveTab("accueil");
  }, [loading, token, user]);

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-aja-cream"
        style={styles.loadingContainer}
        edges={["top", "bottom"]}
      >
        <ActivityIndicator size="large" color="#7ea69d" />
      </SafeAreaView>
    );
  }

  // Auth screens (no bottom navigation)
  if (
    currentScreen === "welcome" ||
    currentScreen === "login" ||
    currentScreen === "signup" ||
    currentScreen === "onboarding" ||
    currentScreen === "goals" ||
    currentScreen === "profile"
  ) {
    return (
      <SafeAreaView className="flex-1 bg-aja-cream" style={styles.container} edges={["top", "bottom"]}>
        {currentScreen === "welcome" && (
          <WelcomeScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === "login" && (
          <LoginScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === "signup" && (
          <SignupScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === "onboarding" && (
          <OnboardingScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === "goals" && (
          <OnboardingScreen onNavigate={handleNavigate} mode="goals" />
        )}
        {currentScreen === "profile" && (
          <OnboardingScreen onNavigate={handleNavigate} mode="profile" />
        )}
      </SafeAreaView>
    );
  }

  // Main app screens (with bottom navigation)
  return (
    <View className="flex-1 bg-aja-cream" style={styles.containerWithNav}>
      <View className="flex-1" style={styles.content}>
        {activeTab === "accueil" && (
          <DashboardScreen
            onEditProfile={() => setCurrentScreen("profile")}
            onOpenTracking={() => setActiveTab("suivi")}
          />
        )}
        {activeTab === "recommandations" && <RecommendationsScreen />}
        {activeTab === "suivi" && (
          <SuiviScreen onOpenRecommendations={() => setActiveTab("recommandations")} />
        )}
        {activeTab === "encyclopedie" && <EncyclopedieScreen />}
      </View>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef6e2",
  },
  containerWithNav: {
    flex: 1,
    backgroundColor: "#fef6e2",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fef6e2",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
});
