import { BottomNavigation } from "@/components/bottom-navigation";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { EncyclopedieScreen } from "@/components/screens/encyclopedie-screen";
import { LoginScreen } from "@/components/screens/login-screen";
import { OnboardingScreen } from "@/components/screens/onboarding-screen";
import { RecommendationsScreen } from "@/components/screens/recommendations-screen";
import { SignupScreen } from "@/components/screens/signup-screen";
import { SuiviScreen } from "@/components/screens/suivi-screen";
import { WelcomeScreen } from "@/components/screens/welcome-screen";
import { AuthProvider } from "@/context/auth";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type Screen = "welcome" | "login" | "signup" | "onboarding" | "dashboard";

type Tab = "accueil" | "recommandations" | "suivi" | "encyclopedie";

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
function RootApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [activeTab, setActiveTab] = useState<Tab>("accueil");

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
  };

  // Auth screens (no bottom navigation)
  if (
    currentScreen === "welcome" ||
    currentScreen === "login" ||
    currentScreen === "signup" ||
    currentScreen === "onboarding"
  ) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  // Main app screens (with bottom navigation)
  return (
    <View style={styles.containerWithNav}>
      <View style={styles.content}>
        {activeTab === "accueil" && <DashboardScreen />}
        {activeTab === "recommandations" && <RecommendationsScreen />}
        {activeTab === "suivi" && <SuiviScreen />}
        {activeTab === "encyclopedie" && <EncyclopedieScreen />}
      </View>

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
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
  content: {
    flex: 1,
  },
});
