import { Plus, Shield, Sun, Target, TrendingUp } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { getDashboard, type DashboardResponse } from "@/services/api";

interface DashboardScreenProps {
  userName?: string;
}

export function DashboardScreen({ userName }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Keep showing UI with fallback data
    } finally {
      setLoading(false);
    }
  };

  // Use data from backend, or fallback to defaults
  const displayName = dashboardData?.user_name || userName || "User";
  const todayProgress = dashboardData?.today_progress || 0;
  const supplementsTaken = dashboardData?.supplements_taken || 0;
  const supplementsTotal = dashboardData?.supplements_total || 3;
  const weeklyData = dashboardData?.weekly_data || [];
  const adherenceData = dashboardData?.adherence_data || [];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7ea69d" />
      </View>
    );
  }

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - todayProgress / 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Daily Health Snapshot Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            {/* Visual indicator bar */}
            <View style={styles.indicatorBar} />
            
            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Aperçu du jour</Text>
              
              {/* Today's plan */}
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Sun size={20} color="#7ea69d" />
                </View>
                <View>
                  <Text style={styles.infoText}>{supplementsTotal} compléments</Text>
                  <Text style={styles.infoSubtext}>À prendre aujourd'hui</Text>
                </View>
              </View>

              {/* Safety status */}
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Shield size={20} color="#7ea69d" />
                </View>
                <View>
                  <Text style={styles.infoText}>Plan sécuritaire</Text>
                  <Text style={styles.infoSubtext}>Aucune interaction détectée</Text>
                </View>
              </View>

              {/* Expected benefit */}
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Target size={20} color="#7ea69d" />
                </View>
                <View>
                  <Text style={styles.infoText}>Amélioration du sommeil</Text>
                  <Text style={styles.infoSubtext}>Objectif principal</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Progression du jour</Text>
              <Text style={styles.progressSubtext}>{supplementsTaken} sur {supplementsTotal} compléments pris</Text>
            </View>
            <View style={styles.circularProgress}>
              {/* Circular progress */}
              <Svg width={64} height={64} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#b3d3d2"
                  strokeWidth="6"
                  fill="none"
                />
                <Circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#7ea69d"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.progressPercentage}>
                <Text style={styles.progressText}>{todayProgress}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Mini Calendar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cette semaine</Text>
          <View style={styles.weeklyContainer}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={styles.dayLabel}>{day.day}</Text>
                <View
                  style={[
                    styles.dayDot,
                    day.completed
                      ? styles.dayDotCompleted
                      : index < 4
                      ? styles.dayDotPartial
                      : styles.dayDotIncomplete
                  ]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Adherence Insight */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceHeader}>
            <TrendingUp size={20} color="#14272d" />
            <Text style={styles.adherenceTitle}>Régularité</Text>
          </View>
          <View style={styles.adherenceBar}>
            {adherenceData.map((completed, index) => (
              <View
                key={index}
                style={[
                  styles.adherenceSegment,
                  completed ? styles.adherenceCompleted : styles.adherenceIncomplete
                ]}
              />
            ))}
          </View>
          <Text style={styles.adherenceText}>Régularité en amélioration</Text>
        </View>

        {/* System Insight */}
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            💡 Votre profil montre une amélioration de 15% en qualité de sommeil ce mois-ci
          </Text>
        </View>

        {/* Add Goal Smart Entry */}
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#7ea69d" />
          <Text style={styles.addButtonText}>Ajouter un objectif santé</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef6e2',
  },
  contentContainer: {
    paddingBottom: 96,
  },
  header: {
    backgroundColor: '#14272d',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: '#b3d3d2',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dfc485',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#14272d',
    fontSize: 16,
  },
  mainContent: {
    paddingHorizontal: 24,
    marginTop: -24,
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.05)',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  indicatorBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#7ea69d',
  },
  cardContent: {
    flex: 1,
    gap: 16,
  },
  cardTitle: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e7ede7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#14272d',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#7ea69d',
  },
  progressCard: {
    backgroundColor: '#e7ede7',
    borderRadius: 16,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#7ea69d',
    marginTop: 4,
  },
  circularProgress: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  progressPercentage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#14272d',
  },
  weeklyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#7ea69d',
  },
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dayDotCompleted: {
    backgroundColor: '#7ea69d',
  },
  dayDotPartial: {
    backgroundColor: 'rgba(223, 196, 133, 0.5)',
  },
  dayDotIncomplete: {
    backgroundColor: 'rgba(179, 211, 210, 0.3)',
  },
  adherenceCard: {
    backgroundColor: '#b3d3d2',
    borderRadius: 16,
    padding: 20,
  },
  adherenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  adherenceTitle: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
  },
  adherenceBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  adherenceSegment: {
    flex: 1,
    height: 32,
    borderRadius: 4,
  },
  adherenceCompleted: {
    backgroundColor: '#7ea69d',
  },
  adherenceIncomplete: {
    backgroundColor: 'rgba(126, 166, 157, 0.2)',
  },
  adherenceText: {
    fontSize: 14,
    color: '#14272d',
  },
  insightCard: {
    backgroundColor: 'rgba(223, 196, 133, 0.2)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(223, 196, 133, 0.3)',
  },
  insightText: {
    fontSize: 14,
    color: '#14272d',
  },
  addButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#7ea69d',
    fontSize: 16,
  },
});