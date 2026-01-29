import {
  Activity,
  AlertCircle,
  Apple,
  ArrowLeft,
  ArrowRight,
  Baby,
  Brain,
  Heart,
  Moon,
  Pill,
  Shield,
  Smile,
  Target,
  User,
  Weight,
  Zap
} from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface OnboardingScreenProps {
  onNavigate: (screen: string) => void;
}

type Option = { value: string; label: string };

const ACTIVITY_LEVELS: Option[] = [
  { value: "sedentary", label: "Peu ou pas d'activité" },
  { value: "light", label: "Légère (1–2 séances/semaine)" },
  { value: "moderate", label: "Modérée (3–5 séances/semaine)" },
  { value: "active", label: "Active (6–7 séances/semaine)" },
  {
    value: "very_active",
    label: "Très active (sport intense / travail physique)",
  },
];

const GOALS: Option[] = [
  { value: "mood_depression_support", label: "Améliorer mon humeur" },
  { value: "stress_anxiety_support", label: "Gérer le stress et l'anxiété" },
  { value: "sleep_support", label: "Améliorer mon sommeil" },
  { value: "weight_loss", label: "Perdre du poids" },
  { value: "appetite_control", label: "Contrôler mon appétit" },
  { value: "energy_fatigue", label: "Augmenter mon énergie" },
  { value: "focus_cognition", label: "Améliorer ma concentration et mémoire" },
  { value: "digestion_gut", label: "Améliorer ma digestion" },
  { value: "immune_support", label: "Renforcer mon immunité" },
  { value: "muscle_gain_strength", label: "Gagner en muscle et force" },
  { value: "pain_inflammation", label: "Réduire douleurs et inflammations" },
  { value: "migraine_headache", label: "Prévenir migraines et maux de tête" },
];

// Organized by category for better UX
const MEDICATION_CONDITIONS: Option[] = [
  {
    value: "taking_serotonergic_meds",
    label: "Antidépresseurs (ISRS, IRSN, etc.)",
  },
  {
    value: "taking_anticoagulants",
    label: "Anticoagulants (fluidifiants sanguins)",
  },
  { value: "taking_antidiabetic_meds", label: "Médicaments pour le diabète" },
  { value: "taking_antihypertensives", label: "Médicaments pour la tension" },
];

const HEALTH_CONDITIONS: Option[] = [
  { value: "gi_disorder", label: "Troubles digestifs chroniques" },
  { value: "liver_disease", label: "Problème hépatique (foie)" },
  { value: "kidney_disease", label: "Problème rénal (reins)" },
  { value: "thyroid_disorder", label: "Trouble de la thyroïde" },
  { value: "seizure_disorder", label: "Historique d'épilepsie" },
  { value: "autoimmune_condition", label: "Maladie auto-immune" },
  { value: "allergy_prone", label: "Terrain allergique" },
];

const DISEASES: Option[] = [
  { value: "depression", label: "Dépression" },
  { value: "anxiety_disorder", label: "Trouble anxieux" },
  { value: "panic_disorder", label: "Trouble panique" },
  { value: "obesity", label: "Obésité" },
  { value: "type2_diabetes", label: "Diabète type 2" },
  { value: "migraine", label: "Migraine" },
  { value: "fibromyalgia", label: "Fibromyalgie" },
  { value: "parkinsons_disease", label: "Maladie de Parkinson" },
  { value: "insomnia", label: "Insomnie" },
  { value: "ibs", label: "Syndrome intestin irritable (IBS)" },
  { value: "hypertension", label: "Hypertension" },
  { value: "high_cholesterol", label: "Cholestérol élevé" },
];

const ALLERGIES: Option[] = [
  { value: "none", label: "Aucune allergie" },
  { value: "peanuts", label: "Arachides" },
  { value: "tree_nuts", label: "Fruits à coque (noix, amandes, etc.)" },
  { value: "soy", label: "Soja" },
  { value: "gluten", label: "Gluten" },
  { value: "lactose", label: "Lactose" },
  { value: "shellfish", label: "Fruits de mer / crustacés" },
  { value: "fish", label: "Poisson" },
  { value: "egg", label: "Œufs" },
  { value: "sesame", label: "Sésame" },
  { value: "pollen", label: "Pollen" },
  { value: "medication", label: "Allergie à certains médicaments" },
  { value: "other", label: "Autre allergie" },
];

export function OnboardingScreen({ onNavigate }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    sex: "",
    pregnancy: false,
    breastfeeding: false,
    ageRange: "",
    height: "",
    weight: "",
    activityLevel: "",
    goals: [] as string[],
    conditions: [] as string[],
    diseases: [] as string[],
    allergies: ["none"] as string[],
  });

  // Dynamic total steps: 5 for men, 6 for women (adds pregnancy/breastfeeding step)
  const totalSteps = formData.sex === "Femme" ? 6 : 5;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    // Skip step 2 (pregnancy/breastfeeding) if user is male
    if (step === 1 && formData.sex === "Homme") {
      setStep(3); // Jump to activity level
    } else if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onNavigate("dashboard");
    }
  };

  const handleBack = () => {
    // Handle back navigation considering the conditional step 2
    if (step === 3 && formData.sex === "Homme") {
      setStep(1); // Jump back to sex selection
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleMultiSelection = (
    field: "goals" | "conditions" | "diseases" | "allergies",
    value: string,
    exclusiveValue?: string,
  ) => {
    const current = formData[field];

    if (exclusiveValue && value === exclusiveValue) {
      if (current.includes(value)) {
        setFormData({ ...formData, [field]: [] });
      } else {
        setFormData({ ...formData, [field]: [value] });
      }
      return;
    }

    if (exclusiveValue && current.includes(exclusiveValue)) {
      setFormData({ ...formData, [field]: [value] });
      return;
    }

    if (current.includes(value)) {
      setFormData({
        ...formData,
        [field]: current.filter((item) => item !== value),
      });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  // Helper to get actual step number for display
  const getDisplayStep = () => {
    if (formData.sex === "Homme" && step >= 3) {
      return step - 1; // Adjust display for skipped step
    }
    return step;
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, step === 1 && styles.invisible]}
        >
          <ArrowLeft size={24} color="#14272d" />
        </TouchableOpacity>
        <Text style={styles.stepText}>
          Étape {getDisplayStep()} / {totalSteps}
        </Text>
        <View style={styles.spacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* STEP 1: PROFILE INFORMATION */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <User size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Vos informations</Text>
              <Text style={styles.subtitle}>
                Pour des recommandations personnalisées
              </Text>
            </View>

            <View style={styles.inputsContainer}>
              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput
                  value={formData.firstname}
                  onChangeText={(text) =>
                    setFormData({ ...formData, firstname: text })
                  }
                  placeholder="Votre prénom"
                  placeholderTextColor="rgba(126, 166, 157, 0.5)"
                  style={styles.input}
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  value={formData.lastname}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lastname: text })
                  }
                  placeholder="Votre nom"
                  placeholderTextColor="rgba(126, 166, 157, 0.5)"
                  style={styles.input}
                />
              </View>

              {/* Sex */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sexe</Text>
                <View style={styles.yesNoContainer}>
                  {["Femme", "Homme"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setFormData({ ...formData, sex: option })}
                      style={[
                        styles.yesNoButton,
                        formData.sex === option && styles.yesNoButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.yesNoText,
                          formData.sex === option && styles.yesNoTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Age Range - Dropdown style */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tranche d'âge</Text>
                <View style={styles.optionsContainer}>
                  {[
                    "Moins de 18 ans",
                    "18 – 30 ans",
                    "31 – 45 ans",
                    "46 – 60 ans",
                    "Plus de 60 ans",
                  ].map((range) => (
                    <TouchableOpacity
                      key={range}
                      onPress={() =>
                        setFormData({ ...formData, ageRange: range })
                      }
                      style={[
                        styles.dropdownOption,
                        formData.ageRange === range &&
                          styles.dropdownOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          formData.ageRange === range &&
                            styles.dropdownTextSelected,
                        ]}
                      >
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Height */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Taille (cm)</Text>
                <TextInput
                  value={formData.height}
                  onChangeText={(text) =>
                    setFormData({ ...formData, height: text })
                  }
                  placeholder="170"
                  placeholderTextColor="rgba(126, 166, 157, 0.5)"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              {/* Weight */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Poids (kg)</Text>
                <TextInput
                  value={formData.weight}
                  onChangeText={(text) =>
                    setFormData({ ...formData, weight: text })
                  }
                  placeholder="70"
                  placeholderTextColor="rgba(126, 166, 157, 0.5)"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: PREGNANCY & BREASTFEEDING (Women only) */}
        {step === 2 && formData.sex === "Femme" && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Baby size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Situation actuelle</Text>
              <Text style={styles.subtitle}>
                Pour des recommandations sécuritaires
              </Text>
            </View>

            {/* Pregnancy Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>Êtes-vous enceinte ?</Text>
              <View style={styles.yesNoContainer}>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, pregnancy: true })}
                  style={[
                    styles.yesNoButton,
                    formData.pregnancy === true && styles.yesNoButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      formData.pregnancy === true && styles.yesNoTextSelected,
                    ]}
                  >
                    Oui
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, pregnancy: false })}
                  style={[
                    styles.yesNoButton,
                    formData.pregnancy === false && styles.yesNoButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      formData.pregnancy === false && styles.yesNoTextSelected,
                    ]}
                  >
                    Non
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Breastfeeding Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>Allaitez-vous ?</Text>
              <View style={styles.yesNoContainer}>
                <TouchableOpacity
                  onPress={() =>
                    setFormData({ ...formData, breastfeeding: true })
                  }
                  style={[
                    styles.yesNoButton,
                    formData.breastfeeding === true &&
                      styles.yesNoButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      formData.breastfeeding === true &&
                        styles.yesNoTextSelected,
                    ]}
                  >
                    Oui
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setFormData({ ...formData, breastfeeding: false })
                  }
                  style={[
                    styles.yesNoButton,
                    formData.breastfeeding === false &&
                      styles.yesNoButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      formData.breastfeeding === false &&
                        styles.yesNoTextSelected,
                    ]}
                  >
                    Non
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.helperCard}>
              <Text style={styles.helperText}>
                Ces informations sont importantes pour éviter certains
                compléments contre-indiqués.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 3 (or 2 for men): ACTIVITY LEVEL */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Activity size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Niveau d'activité physique</Text>
              <Text style={styles.subtitle}>
                Pour ajuster les recommandations
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              {ACTIVITY_LEVELS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() =>
                    setFormData({ ...formData, activityLevel: o.value })
                  }
                  style={[
                    styles.optionButton,
                    formData.activityLevel === o.value &&
                      styles.optionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.activityLevel === o.value &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 4 (or 3 for men): GOALS */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Target size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Quels sont vos objectifs ?</Text>
              <Text style={styles.subtitle}>Choix multiples possibles</Text>
            </View>

            <View style={styles.optionsContainer}>
              {GOALS.map((goal) => {
                const Icon =
                  goal.value === "sleep_support"
                    ? Moon
                    : goal.value === "energy_fatigue"
                      ? Zap
                      : goal.value === "focus_cognition"
                        ? Brain
                        : goal.value === "weight_loss" ||
                            goal.value === "appetite_control"
                          ? Weight
                          : goal.value === "mood_depression_support" ||
                              goal.value === "stress_anxiety_support"
                            ? Smile
                            : goal.value === "pain_inflammation"
                              ? AlertCircle
                              : goal.value === "immune_support"
                                ? Shield
                                : Apple;

                return (
                  <TouchableOpacity
                    key={goal.value}
                    onPress={() => toggleMultiSelection("goals", goal.value)}
                    style={[
                      styles.optionButtonWithIcon,
                      formData.goals.includes(goal.value) &&
                        styles.optionButtonSelected,
                    ]}
                  >
                    <Icon size={20} color="#7ea69d" />
                    <Text
                      style={[
                        styles.optionText,
                        formData.goals.includes(goal.value) &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {goal.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 5 (or 4 for men): CONDITIONS - REORGANIZED */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Shield size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Précautions médicales</Text>
              <Text style={styles.subtitle}>
                Facultatif — pour éviter les interactions
              </Text>
            </View>

            {/* Medications Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Pill size={18} color="#7ea69d" />
                <Text style={styles.sectionTitle}>Médicaments</Text>
              </View>
              <View style={styles.conditionsContainer}>
                {MEDICATION_CONDITIONS.map((o) => (
                  <TouchableOpacity
                    key={o.value}
                    onPress={() => toggleMultiSelection("conditions", o.value)}
                    style={[
                      styles.conditionButton,
                      formData.conditions.includes(o.value) &&
                        styles.conditionButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.conditionText,
                        formData.conditions.includes(o.value) &&
                          styles.conditionTextSelected,
                      ]}
                    >
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Health Conditions Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Heart size={18} color="#7ea69d" />
                <Text style={styles.sectionTitle}>Conditions de santé</Text>
              </View>
              <View style={styles.conditionsContainer}>
                {HEALTH_CONDITIONS.map((o) => (
                  <TouchableOpacity
                    key={o.value}
                    onPress={() => toggleMultiSelection("conditions", o.value)}
                    style={[
                      styles.conditionButton,
                      formData.conditions.includes(o.value) &&
                        styles.conditionButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.conditionText,
                        formData.conditions.includes(o.value) &&
                          styles.conditionTextSelected,
                      ]}
                    >
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* None option */}
            <TouchableOpacity
              onPress={() => setFormData({ ...formData, conditions: [] })}
              style={[
                styles.noneButton,
                formData.conditions.length === 0 && styles.noneButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.noneButtonText,
                  formData.conditions.length === 0 &&
                    styles.noneButtonTextSelected,
                ]}
              >
                Aucune de ces conditions
              </Text>
            </TouchableOpacity>

            <View style={styles.helperCard}>
              <Text style={styles.helperText}>
                Ces informations aident à personnaliser vos recommandations en
                toute sécurité.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 6 (or 5 for men): DISEASES */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Heart size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Pathologies diagnostiquées</Text>
              <Text style={styles.subtitle}>
                Facultatif — choix multiples possibles
              </Text>
            </View>

            <View style={styles.conditionsContainer}>
              {DISEASES.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => toggleMultiSelection("diseases", o.value)}
                  style={[
                    styles.conditionButton,
                    formData.diseases.includes(o.value) &&
                      styles.conditionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.conditionText,
                      formData.diseases.includes(o.value) &&
                        styles.conditionTextSelected,
                    ]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Allergies section here */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <AlertCircle size={18} color="#7ea69d" />
                <Text style={styles.sectionTitle}>Allergies alimentaires</Text>
              </View>
              <View style={styles.conditionsContainer}>
                {ALLERGIES.map((o) => (
                  <TouchableOpacity
                    key={o.value}
                    onPress={() =>
                      toggleMultiSelection("allergies", o.value, "none")
                    }
                    style={[
                      styles.conditionButton,
                      formData.allergies.includes(o.value) &&
                        styles.conditionButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.conditionText,
                        formData.allergies.includes(o.value) &&
                          styles.conditionTextSelected,
                      ]}
                    >
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {step === totalSteps
              ? "Valider & accéder à mon espace"
              : "Continuer"}
          </Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef6e2",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#7ea69d",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  invisible: {
    opacity: 0,
  },
  stepText: {
    fontSize: 14,
    color: "#7ea69d",
  },
  spacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  stepContainer: {
    gap: 32,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e7ede7",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    gap: 12,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    color: "#14272d",
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#7ea69d",
    textAlign: "center",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "rgba(20, 39, 45, 0.1)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#e7ede7",
    borderColor: "#7ea69d",
  },
  optionText: {
    color: "#14272d",
    fontSize: 16,
  },
  optionTextSelected: {
    color: "#14272d",
  },
  optionButtonWithIcon: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "rgba(20, 39, 45, 0.1)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputsContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: "#14272d",
    fontSize: 14,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.1)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    color: "#14272d",
    fontSize: 16,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#14272d",
  },
  conditionsContainer: {
    gap: 12,
  },
  conditionButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "rgba(20, 39, 45, 0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  conditionButtonSelected: {
    backgroundColor: "#e7ede7",
    borderColor: "#7ea69d",
  },
  conditionText: {
    color: "#14272d",
    fontSize: 14,
    textAlign: "left",
  },
  conditionTextSelected: {
    color: "#14272d",
  },
  noneButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "rgba(20, 39, 45, 0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  noneButtonSelected: {
    backgroundColor: "#e7ede7",
    borderColor: "#7ea69d",
  },
  noneButtonText: {
    color: "#7ea69d",
    fontSize: 15,
    fontWeight: "500",
  },
  noneButtonTextSelected: {
    color: "#14272d",
  },
  questionContainer: {
    gap: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#14272d",
    textAlign: "center",
  },
  yesNoContainer: {
    flexDirection: "row",
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "rgba(20, 39, 45, 0.1)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  yesNoButtonSelected: {
    backgroundColor: "#e7ede7",
    borderColor: "#7ea69d",
  },
  yesNoText: {
    color: "#14272d",
    fontSize: 16,
    fontWeight: "500",
  },
  yesNoTextSelected: {
    color: "#14272d",
    fontWeight: "600",
  },
  dropdownOption: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.1)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownOptionSelected: {
    backgroundColor: "#e7ede7",
    borderColor: "#7ea69d",
    borderWidth: 2,
  },
  dropdownText: {
    color: "#14272d",
    fontSize: 15,
  },
  dropdownTextSelected: {
    color: "#14272d",
    fontWeight: "500",
  },
  helperCard: {
    backgroundColor: "#e7ede7",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: "#14272d",
    textAlign: "center",
  },
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "rgba(20, 39, 45, 0.1)",
    padding: 24,
  },
  nextButton: {
    backgroundColor: "#14272d",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
