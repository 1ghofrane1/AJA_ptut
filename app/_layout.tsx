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
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react-native";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Screen =
  | "welcome"
  | "login"
  | "signup"
  | "onboarding"
  | "dashboard"
  | "goals";

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
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
function RootApp() {
  const { token, user, loading, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [activeTab, setActiveTab] = useState<Tab>("accueil");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const performLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();
      setActiveTab("accueil");
      setCurrentScreen("welcome");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => void performLogout();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-aja-cream" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7ea69d" />
      </View>
    );
  }

  // Auth screens (no bottom navigation)
  if (
    currentScreen === "welcome" ||
    currentScreen === "login" ||
    currentScreen === "signup" ||
    currentScreen === "onboarding" ||
    currentScreen === "goals"
  ) {
    return (
      <View className="flex-1 bg-aja-cream" style={styles.container}>
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
      </View>
    );
  }

  // Main app screens (with bottom navigation)
  return (
    <View className="flex-1 bg-aja-cream" style={styles.containerWithNav}>
      <View className="flex-1" style={styles.content}>
        {activeTab === "accueil" && (
          <DashboardScreen onAddGoal={() => setCurrentScreen("goals")} />
        )}
        {activeTab === "recommandations" && <RecommendationsScreen />}
        {activeTab === "suivi" && <SuiviScreen />}
        {activeTab === "encyclopedie" && <EncyclopedieScreen />}
      </View>

      <TouchableOpacity
        className="absolute right-5 top-14 z-[80] h-9 flex-row items-center justify-center rounded-full border border-black/10 bg-white/95 px-3"
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoggingOut}
        activeOpacity={0.85}
      >
        {isLoggingOut ? (
          <ActivityIndicator size="small" color="#14272d" />
        ) : (
          <>
            <LogOut size={16} color="#14272d" />
            <Text style={styles.logoutText}>Deconnexion</Text>
          </>
        )}
      </TouchableOpacity>

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
  logoutButton: {
    position: "absolute",
    top: 56,
    right: 20,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    zIndex: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  logoutText: {
    color: "#14272d",
    fontSize: 12,
    fontWeight: "600",
  },
});
