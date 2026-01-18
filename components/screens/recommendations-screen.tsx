import {
    AlertTriangle,
    Check,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Moon,
    Sun
} from "lucide-react-native";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface Supplement {
  id: string;
  name: string;
  dosage: string;
  timing: "morning" | "evening" | "both";
  reason: string;
  molecules: string[];
  warnings?: string;
  taken: boolean;
}

export function RecommendationsScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([
    {
      id: "1",
      name: "Magnésium Bisglycinate",
      dosage: "300mg",
      timing: "evening",
      reason: "Favorise la relaxation et améliore la qualité du sommeil",
      molecules: ["Magnésium", "Glycine"],
      warnings: "Prendre 30 min avant le coucher",
      taken: true,
    },
    {
      id: "2",
      name: "Vitamine D3",
      dosage: "2000 UI",
      timing: "morning",
      reason: "Renforce le système immunitaire et l'absorption du calcium",
      molecules: ["Cholécalciférol"],
      taken: false,
    },
    {
      id: "3",
      name: "Oméga-3 EPA/DHA",
      dosage: "1000mg",
      timing: "morning",
      reason: "Soutient la santé cardiovasculaire et cognitive",
      molecules: ["EPA", "DHA"],
      warnings: "À prendre pendant un repas",
      taken: true,
    },
  ]);

  const goals = [
    { label: "Sommeil", confidence: 3 },
    { label: "Immunité", confidence: 2 },
    { label: "Énergie", confidence: 3 },
  ];

  const toggleTaken = (id: string) => {
    setSupplements(
      supplements.map((supp) =>
        supp.id === id ? { ...supp, taken: !supp.taken } : supp
      )
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommandations</Text>
        <Text style={styles.headerSubtitle}>Plan personnalisé</Text>
      </View>

      {/* Content */}
      <View style={styles.mainContent}>
        {/* Objectives Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vos objectifs</Text>
          <View style={styles.goalsContainer}>
            {goals.map((goal, index) => (
              <View key={index} style={styles.goalBadge}>
                <Text style={styles.goalLabel}>{goal.label}</Text>
                <View style={styles.confidenceDots}>
                  {[...Array(3)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < goal.confidence ? styles.dotActive : styles.dotInactive
                      ]}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Supplement Plan */}
        <View style={styles.supplementsSection}>
          <Text style={styles.sectionTitle}>Plan de supplémentation</Text>
          {supplements.map((supplement) => {
            const isExpanded = expandedId === supplement.id;
            return (
              <View key={supplement.id} style={styles.supplementCard}>
                {/* Collapsed state */}
                <View style={styles.supplementHeader}>
                  <View style={styles.supplementRow}>
                    {/* Tick button */}
                    <TouchableOpacity
                      onPress={() => toggleTaken(supplement.id)}
                      style={[
                        styles.checkbox,
                        supplement.taken && styles.checkboxChecked
                      ]}
                    >
                      {supplement.taken && <Check size={16} color="white" />}
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={styles.supplementContent}>
                      <View style={styles.supplementTopRow}>
                        <View style={styles.supplementInfo}>
                          <Text style={styles.supplementName}>{supplement.name}</Text>
                          <Text style={styles.supplementDosage}>{supplement.dosage}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setExpandedId(isExpanded ? null : supplement.id)}
                          style={styles.expandButton}
                        >
                          {isExpanded ? (
                            <ChevronUp size={20} color="#7ea69d" />
                          ) : (
                            <ChevronDown size={20} color="#7ea69d" />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Timing icons */}
                      <View style={styles.timingContainer}>
                        {(supplement.timing === "morning" || supplement.timing === "both") && (
                          <View style={styles.timingBadge}>
                            <Sun size={16} color="#dfc485" />
                            <Text style={styles.timingTextMorning}>Matin</Text>
                          </View>
                        )}
                        {(supplement.timing === "evening" || supplement.timing === "both") && (
                          <View style={styles.timingBadge}>
                            <Moon size={16} color="#7ea69d" />
                            <Text style={styles.timingTextEvening}>Soir</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Expanded state */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Why this supplement */}
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>Pourquoi ce complément ?</Text>
                      <Text style={styles.sectionText}>{supplement.reason}</Text>
                    </View>

                    {/* Molecules */}
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>Molécules actives</Text>
                      <View style={styles.moleculesContainer}>
                        {supplement.molecules.map((molecule, index) => (
                          <View key={index} style={styles.moleculeTag}>
                            <Text style={styles.moleculeText}>{molecule}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Safety warnings */}
                    {supplement.warnings && (
                      <View style={styles.warningCard}>
                        <AlertTriangle size={16} color="#bea262" style={styles.warningIcon} />
                        <Text style={styles.warningText}>{supplement.warnings}</Text>
                      </View>
                    )}

                    {/* Link to Encyclopedia */}
                    <TouchableOpacity style={styles.learnMoreButton}>
                      <Text style={styles.learnMoreText}>En savoir plus</Text>
                      <ExternalLink size={16} color="#7ea69d" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {supplements.filter((s) => s.taken).length} sur {supplements.length} compléments pris aujourd'hui
          </Text>
        </View>
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
  headerTitle: {
    color: 'white',
    fontSize: 24,
  },
  headerSubtitle: {
    color: '#b3d3d2',
    fontSize: 14,
    marginTop: 4,
  },
  mainContent: {
    paddingHorizontal: 24,
    marginTop: -16,
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
  cardTitle: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalBadge: {
    backgroundColor: '#e7ede7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: '#14272d',
  },
  confidenceDots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#7ea69d',
  },
  dotInactive: {
    backgroundColor: 'rgba(126, 166, 157, 0.2)',
  },
  supplementsSection: {
    gap: 12,
  },
  sectionTitle: {
    color: '#14272d',
    fontSize: 16,
    paddingHorizontal: 4,
  },
  supplementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.05)',
    overflow: 'hidden',
  },
  supplementHeader: {
    padding: 16,
  },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(126, 166, 157, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#7ea69d',
    borderColor: '#7ea69d',
  },
  supplementContent: {
    flex: 1,
  },
  supplementTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  supplementInfo: {
    flex: 1,
  },
  supplementName: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
  },
  supplementDosage: {
    fontSize: 14,
    color: '#7ea69d',
  },
  expandButton: {
    padding: 4,
  },
  timingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingTextMorning: {
    fontSize: 12,
    color: '#dfc485',
  },
  timingTextEvening: {
    fontSize: 12,
    color: '#7ea69d',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 39, 45, 0.05)',
    paddingTop: 16,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#14272d',
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 14,
    color: '#7ea69d',
  },
  moleculesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  moleculeTag: {
    backgroundColor: '#e7ede7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  moleculeText: {
    color: '#14272d',
    fontSize: 12,
  },
  warningCard: {
    backgroundColor: 'rgba(223, 196, 133, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#14272d',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  learnMoreText: {
    fontSize: 14,
    color: '#7ea69d',
  },
  summaryCard: {
    backgroundColor: '#e7ede7',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#14272d',
    textAlign: 'center',
  },
});