import {
  BookOpen,
  FileText,
  Home,
  TrendingUp,
} from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const tabs = [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "recommandations", label: "Recommandations", icon: FileText },
    { id: "suivi", label: "Suivi", icon: TrendingUp },
    { id: "encyclopedie", label: "Encyclopédie", icon: BookOpen },
  ];

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View className="flex-row items-center justify-around px-2 py-3" style={styles.container}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              className="items-center px-4 py-2"
              style={styles.button}
            >
              <Icon 
                size={24} 
                color={isActive ? "#14272d" : "#7ea69d"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text style={[
                styles.label,
                { color: isActive ? "#14272d" : "#7ea69d" }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 39, 45, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  button: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
  },
});
