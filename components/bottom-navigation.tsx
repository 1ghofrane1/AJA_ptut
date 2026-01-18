import { BookOpen, FileText, Home, TrendingUp } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "recommandations", label: "Recommandations", icon: FileText },
    { id: "suivi", label: "Suivi", icon: TrendingUp },
    { id: "encyclopedie", label: "Encyclopédie", icon: BookOpen },
  ];

  return (
    <View style={styles.nav}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 39, 45, 0.1)',
    zIndex: 50,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 12,
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