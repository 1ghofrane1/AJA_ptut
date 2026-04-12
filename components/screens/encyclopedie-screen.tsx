import { HeaderLogoutButton } from "@/components/header-logout-button";
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
import { getEncyclopedieSupplement, listEncyclopedieSupplements } from "@/services/api";
import type {
  EncyclopedieSupplementDetailResponse,
  EncyclopedieSupplementSummaryResponse,
} from "@/services/api";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SupplementSummary = EncyclopedieSupplementSummaryResponse;
type SupplementDetail = EncyclopedieSupplementDetailResponse;

const DEFAULT_SUPPLEMENT_IMAGE = require("@/assets/images/logo aja 1.png");

const SUPPLEMENT_IMAGE_SOURCES: Record<string, number> = {
  "5-htp": require("@/assets/images/complements/5-htp.png"),
  "alpha-gpc": require("@/assets/images/complements/alpha-gpc.png"),
  "alpha-lactalbumin": require("@/assets/images/complements/alpha-lactalbumine.png"),
  ashwagandha: require("@/assets/images/complements/ashwaganda.png"),
  "binaural-beats": require("@/assets/images/complements/binaural beats.png"),
  caffeine: require("@/assets/images/complements/caf\u00e9ine.png"),
  cannabis: require("@/assets/images/complements/cannabis.png"),
  "cognitive-behavioral-therapy": require("@/assets/images/complements/cognitive-behavioral-therapy.png"),
  "exogenous-ketones": require("@/assets/images/complements/exogenous-ketones.png"),
  "fish-oil": require("@/assets/images/complements/fish-oil.png"),
  "ginkgo-biloba": require("@/assets/images/complements/Biloba.png"),
  glycine: require("@/assets/images/complements/Glycine.png"),
  kava: require("@/assets/images/complements/kava.png"),
  "l-tyrosine": require("@/assets/images/complements/l-tyrosine.png"),
  lavender: require("@/assets/images/complements/lavande.png"),
  "lemon-balm": require("@/assets/images/complements/melisse-officinale.png"),
  "light-therapy": require("@/assets/images/complements/luminoth\u00e9rapie.png"),
  magnesium: require("@/assets/images/complements/magn\u00e9sium.png"),
  melatonin: require("@/assets/images/complements/m\u00e9latonine.png"),
  "panax-ginseng-korean-ginseng": require("@/assets/images/complements/ginseng panax.png"),
  passionflower: require("@/assets/images/complements/passiflore.png"),
  pqq: require("@/assets/images/complements/pqq.png"),
  probiotics: require("@/assets/images/complements/probiotic.png"),
  "progressive-muscle-relaxation": require("@/assets/images/complements/relaxation musculaire.png"),
  quercetin: require("@/assets/images/complements/Querc\u00e9tine.png"),
  saffron: require("@/assets/images/complements/safran.png"),
  "sleep-hygiene-training": require("@/assets/images/complements/hyg\u00e9ne sant\u00e9.png"),
  theanine: require("@/assets/images/complements/th\u00e9anine.png"),
  valerian: require("@/assets/images/complements/val\u00e9riane.png"),
  "vitamin-b6": require("@/assets/images/complements/vitamine B6.png"),
  "vitamin-d": require("@/assets/images/complements/vitamine D.png"),
  yohimbine: require("@/assets/images/complements/yohimbine.png"),
};

function getSupplementImageSource(supplementId: string) {
  return SUPPLEMENT_IMAGE_SOURCES[supplementId] ?? DEFAULT_SUPPLEMENT_IMAGE;
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
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [supplements, setSupplements] = useState<SupplementSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedSupplement, setSelectedSupplement] =
    useState<SupplementDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const categories = [
    { icon: Brain, label: "Cognition", color: "#7ea69d" },
    { icon: Heart, label: "Cardiovasculaire", color: "#b3d3d2" },
    { icon: Shield, label: "Immunité", color: "#dfc485" },
    { icon: Eye, label: "Vision", color: "#b7cfcf" },
    { icon: Bone, label: "Os & Articulations", color: "#7ea69d" },
    { icon: Pill, label: "Tous", color: "#14272d" },
  ];
  const categoryParam = useMemo(() => {
    if (!selectedCategory) return undefined;
    const normalized = selectedCategory.trim().toLowerCase();
    if (!normalized || normalized === "tous") return undefined;
    return selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);

    const handle = setTimeout(async () => {
      try {
        const data = await listEncyclopedieSupplements({
          q: searchQuery.trim() ? searchQuery.trim() : undefined,
          category: categoryParam,
          limit: 80,
        });
        if (cancelled) return;
        setSupplements(data);
      } catch {
        if (cancelled) return;
        setListError(
          "Impossible de charger l'encyclopedie. Verifiez la connexion backend.",
        );
        setSupplements([]);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchQuery, categoryParam, refreshKey]);

  async function openSupplement(supplement: SupplementSummary) {
    setSelectedLoading(true);
    setListError(null);
    try {
      const detail = await getEncyclopedieSupplement(supplement.id);
      setSelectedSupplement(detail);
    } catch {
      setListError("Impossible de charger les details du complement.");
    } finally {
      setSelectedLoading(false);
    }
  }

  const filteredSupplements = supplements;

  if (selectedSupplement) {
    return (
      <ScrollView className="flex-1 bg-aja-cream" style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View
          className="rounded-b-3xl bg-aja-ink px-6 py-6"
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => setSelectedSupplement(null)}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
            <HeaderLogoutButton />
          </View>
          <Text style={styles.headerTitle}>{selectedSupplement.name}</Text>
          <Text style={styles.headerSubtitle}>{selectedSupplement.category}</Text>
        </View>

        {/* Content */}
        <View style={styles.mainContent}>
          {/* Description */}
          <View style={styles.detailSummaryCard}>
            <View style={styles.detailImageShell}>
              <Image
                source={getSupplementImageSource(selectedSupplement.id)}
                style={styles.detailImage}
                resizeMode="cover"
              />
            </View>
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
            {selectedSupplement.benefits && selectedSupplement.benefits.length > 0 && (
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
            {selectedSupplement.sources && selectedSupplement.sources.length > 0 && (
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
    <ScrollView className="flex-1 bg-aja-cream" style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View
        className="rounded-b-3xl bg-aja-ink px-6 py-6"
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Encyclopédie</Text>
            <Text style={styles.headerSubtitle}>Base de connaissances</Text>
          </View>
          <HeaderLogoutButton />
        </View>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          style={styles.categoriesScroll}
        >
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isActive =
              (selectedCategory || "Tous").toLowerCase() === category.label.toLowerCase();
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryCard,
                  isActive && styles.categoryCardActive,
                ]}
                onPress={() => setSelectedCategory(category.label)}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: isActive ? "rgba(255,255,255,0.18)" : `${category.color}18` },
                    isActive && styles.categoryIconActive,
                  ]}
                >
                  <Icon
                    size={18}
                    color={isActive ? "#ffffff" : category.color}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    isActive && styles.categoryLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Supplement List */}
        <View style={styles.supplementsSection}>
          <Text style={styles.sectionHeaderText}>
            {searchQuery ? "Résultats" : "Compléments populaires"}
          </Text>

          {listLoading && (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#7ea69d" />
                <Text style={styles.descriptionText}>Chargement...</Text>
              </View>
            </View>
          )}

          {!listLoading && listError && (
            <View style={styles.card}>
              <Text style={styles.descriptionText}>{listError}</Text>
              <TouchableOpacity
                onPress={() => setRefreshKey((v) => v + 1)}
                style={[styles.backButton, { marginTop: 12 }]}
              >
                <Text style={[styles.backText, { color: "#7ea69d" }]}>
                  Réessayer
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!listLoading && !listError && filteredSupplements.length === 0 && (
            <View style={styles.card}>
              <Text style={styles.descriptionText}>Aucun résultat.</Text>
            </View>
          )}
          <View style={styles.supplementsGrid}>
            {filteredSupplements.map((supplement) => (
              <TouchableOpacity
                key={supplement.id}
                onPress={() => openSupplement(supplement)}
                style={styles.supplementCard}
                disabled={selectedLoading}
                activeOpacity={0.9}
              >
                <View style={styles.supplementImageShell}>
                  <Image
                    source={getSupplementImageSource(supplement.id)}
                    style={styles.supplementImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.supplementInfo}>
                  <View style={styles.supplementHeaderRow}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{supplement.category}</Text>
                    </View>
                    <View style={styles.supplementChevronWrap}>
                      <ChevronRight size={18} color="#7ea69d" />
                    </View>
                  </View>
                  <Text style={styles.supplementName} numberOfLines={2}>
                    {supplement.name}
                  </Text>
                  <Text style={styles.supplementDescription} numberOfLines={3}>
                    {supplement.description}
                  </Text>
                  <View style={styles.tagsContainer}>
                    {supplement.molecules.slice(0, 2).map((molecule, index) => (
                      <View key={index} style={styles.moleculeSmallTag}>
                        <Text style={styles.moleculeSmallText}>{molecule}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    paddingVertical: 4,
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
  detailSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 18,
    gap: 16,
    shadowColor: '#17363a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.05)',
  },
  detailImageShell: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#edf3f0',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  descriptionText: {
    color: '#14272d',
    fontSize: 14,
    lineHeight: 22,
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
  categoriesScroll: {
    marginHorizontal: -4,
  },
  categoriesRow: {
    paddingHorizontal: 4,
    gap: 10,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#17363a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.06)',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
  },
  categoryCardActive: {
    backgroundColor: '#17363a',
    borderColor: '#17363a',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#14272d',
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: '#ffffff',
  },
  supplementsSection: {
    gap: 12,
  },
  supplementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderText: {
    color: '#14272d',
    fontSize: 16,
    paddingHorizontal: 4,
  },
  supplementCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '48%',
    padding: 12,
    shadowColor: '#17363a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.05)',
    gap: 10,
  },
  supplementImageShell: {
    width: '100%',
    height: 128,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#edf3f0',
    borderWidth: 1,
    borderColor: 'rgba(126, 166, 157, 0.18)',
  },
  supplementImage: {
    width: '100%',
    height: '100%',
  },
  supplementInfo: {
    minHeight: 146,
    justifyContent: 'space-between',
    gap: 8,
  },
  supplementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  supplementName: {
    color: '#14272d',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  supplementDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#58786f',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef4f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryTagText: {
    color: '#406b61',
    fontSize: 11,
    fontWeight: '700',
  },
  moleculeSmallTag: {
    backgroundColor: 'rgba(179, 211, 210, 0.26)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  moleculeSmallText: {
    color: '#14272d',
    fontSize: 11,
  },
  supplementChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#f4f8f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
