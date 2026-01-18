import {
    Bone,
    Brain,
    ChevronRight,
    Eye,
    Heart,
    Pill,
    Search,
    Shield
} from "lucide-react-native";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface Supplement {
  id: string;
  name: string;
  category: string;
  description: string;
  molecules: string[];
  benefits?: string[];
  dosage?: string;
  sources?: string[];
}

interface AccordionItemProps {
  icon: React.ComponentType<any>;
  title: string;
  children: React.ReactNode;
}

function AccordionItem({ icon: Icon, title, children }: AccordionItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.accordionItem}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.accordionTrigger}
      >
        <View style={styles.accordionHeader}>
          <Icon size={20} color="#7ea69d" />
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <ChevronRight 
          size={20} 
          color="#7ea69d" 
          style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionContent}>
          {children}
        </View>
      )}
    </View>
  );
}

export function EncyclopedieScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);

  const categories = [
    { icon: Brain, label: "Cognition", color: "#7ea69d" },
    { icon: Heart, label: "Cardiovasculaire", color: "#b3d3d2" },
    { icon: Shield, label: "Immunité", color: "#dfc485" },
    { icon: Eye, label: "Vision", color: "#b7cfcf" },
    { icon: Bone, label: "Os & Articulations", color: "#7ea69d" },
    { icon: Pill, label: "Tous", color: "#14272d" },
  ];

  const supplements: Supplement[] = [
    {
      id: "1",
      name: "Magnésium Bisglycinate",
      category: "Relaxation",
      description: "Forme hautement biodisponible de magnésium",
      molecules: ["Magnésium", "Glycine"],
      benefits: [
        "Améliore la qualité du sommeil",
        "Réduit le stress et l'anxiété",
        "Favorise la relaxation musculaire",
      ],
      dosage: "300-400mg par jour, le soir",
      sources: ["Études cliniques", "EFSA", "ANSES"],
    },
    {
      id: "2",
      name: "Vitamine D3",
      category: "Immunité",
      description: "Vitamine liposoluble essentielle",
      molecules: ["Cholécalciférol"],
      benefits: [
        "Renforce le système immunitaire",
        "Améliore l'absorption du calcium",
        "Soutient la santé osseuse",
      ],
      dosage: "1000-2000 UI par jour",
      sources: ["OMS", "ANSES", "Recherche médicale"],
    },
    {
      id: "3",
      name: "Oméga-3 EPA/DHA",
      category: "Cardiovasculaire",
      description: "Acides gras essentiels",
      molecules: ["EPA", "DHA"],
      benefits: [
        "Soutient la santé cardiovasculaire",
        "Améliore les fonctions cognitives",
        "Propriétés anti-inflammatoires",
      ],
      dosage: "1000-2000mg par jour",
      sources: ["American Heart Association", "EFSA"],
    },
    {
      id: "4",
      name: "Vitamine C",
      category: "Immunité",
      description: "Antioxydant puissant hydrosoluble",
      molecules: ["Acide ascorbique"],
      benefits: [
        "Renforce le système immunitaire",
        "Protection antioxydante",
        "Synthèse du collagène",
      ],
      dosage: "500-1000mg par jour",
      sources: ["ANSES", "NIH", "EFSA"],
    },
  ];

  const filteredSupplements = supplements.filter(
    (supp) =>
      supp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedSupplement) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSelectedSupplement(null)}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedSupplement.name}</Text>
          <Text style={styles.headerSubtitle}>{selectedSupplement.category}</Text>
        </View>

        {/* Content */}
        <View style={styles.mainContent}>
          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.descriptionText}>{selectedSupplement.description}</Text>
          </View>

          {/* Molecules */}
          <View style={styles.moleculesCard}>
            <Text style={styles.sectionTitle}>Molécules actives</Text>
            <View style={styles.moleculesContainer}>
              {selectedSupplement.molecules.map((molecule, index) => (
                <View key={index} style={styles.moleculeTag}>
                  <Text style={styles.moleculeText}>{molecule}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Accordion sections */}
          <View style={styles.accordionCard}>
            {/* Benefits */}
            {selectedSupplement.benefits && (
              <AccordionItem icon={Shield} title="Bienfaits">
                <View style={styles.benefitsList}>
                  {selectedSupplement.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </AccordionItem>
            )}

            {/* Dosage */}
            {selectedSupplement.dosage && (
              <AccordionItem icon={Pill} title="Posologie">
                <Text style={styles.dosageText}>{selectedSupplement.dosage}</Text>
              </AccordionItem>
            )}

            {/* Sources */}
            {selectedSupplement.sources && (
              <AccordionItem icon={Brain} title="Sources scientifiques">
                <View style={styles.sourcesList}>
                  {selectedSupplement.sources.map((source, index) => (
                    <Text key={index} style={styles.sourceText}>{source}</Text>
                  ))}
                </View>
              </AccordionItem>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Encyclopédie</Text>
        <Text style={styles.headerSubtitle}>Base de connaissances</Text>
      </View>

      {/* Content */}
      <View style={styles.mainContent}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search 
            size={20} 
            color="#7ea69d" 
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Magnésium, Vitamine D..."
            placeholderTextColor="rgba(126, 166, 157, 0.5)"
            style={styles.searchInput}
          />
        </View>

        {/* Entry Point Cards */}
        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
              >
                <View 
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${category.color}20` }
                  ]}
                >
                  <Icon size={24} color={category.color} />
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Supplement List */}
        <View style={styles.supplementsSection}>
          <Text style={styles.sectionHeaderText}>
            {searchQuery ? "Résultats" : "Compléments populaires"}
          </Text>
          {filteredSupplements.map((supplement) => (
            <TouchableOpacity
              key={supplement.id}
              onPress={() => setSelectedSupplement(supplement)}
              style={styles.supplementCard}
            >
              <View style={styles.supplementIcon}>
                <Pill size={24} color="#7ea69d" />
              </View>
              <View style={styles.supplementInfo}>
                <Text style={styles.supplementName}>{supplement.name}</Text>
                <Text style={styles.supplementDescription} numberOfLines={1}>
                  {supplement.description}
                </Text>
                <View style={styles.tagsContainer}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{supplement.category}</Text>
                  </View>
                  {supplement.molecules.slice(0, 2).map((molecule, index) => (
                    <View key={index} style={styles.moleculeSmallTag}>
                      <Text style={styles.moleculeSmallText}>{molecule}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <ChevronRight size={20} color="#7ea69d" />
            </TouchableOpacity>
          ))}
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
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#b3d3d2',
    fontSize: 14,
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
  descriptionText: {
    color: '#14272d',
    fontSize: 14,
  },
  moleculesCard: {
    backgroundColor: '#e7ede7',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  moleculesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moleculeTag: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  moleculeText: {
    color: '#14272d',
    fontSize: 14,
  },
  accordionCard: {
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
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20, 39, 45, 0.05)',
  },
  accordionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    color: '#14272d',
    fontSize: 14,
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    color: '#7ea69d',
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#14272d',
  },
  dosageText: {
    fontSize: 14,
    color: '#14272d',
  },
  sourcesList: {
    gap: 8,
  },
  sourceText: {
    fontSize: 14,
    color: '#7ea69d',
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 16,
    color: '#14272d',
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.05)',
    alignItems: 'center',
    gap: 8,
    width: '30%',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#14272d',
  },
  supplementsSection: {
    gap: 12,
  },
  sectionHeaderText: {
    color: '#14272d',
    fontSize: 16,
    paddingHorizontal: 4,
  },
  supplementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  supplementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e7ede7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplementInfo: {
    flex: 1,
  },
  supplementName: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
  },
  supplementDescription: {
    fontSize: 14,
    color: '#7ea69d',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  categoryTag: {
    backgroundColor: '#e7ede7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryTagText: {
    color: '#7ea69d',
    fontSize: 12,
  },
  moleculeSmallTag: {
    backgroundColor: 'rgba(179, 211, 210, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  moleculeSmallText: {
    color: '#14272d',
    fontSize: 12,
  },
});