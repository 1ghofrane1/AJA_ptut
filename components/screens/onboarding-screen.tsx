import {
    Apple,
    ArrowLeft,
    ArrowRight,
    Brain,
    Calendar,
    Heart,
    Moon,
    Scale,
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
    View
} from "react-native";

interface OnboardingScreenProps {
  onNavigate: (screen: string) => void;
}

export function OnboardingScreen({ onNavigate }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    sex: "",
    isPregnant: false,
    isBreastfeeding: false,
    pregnancyRelated: "",
    ageRange: "",
    height: "",
    weight: "",
    goals: [] as string[],
    conditions: [] as string[],
  });

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    // Step 2 logic: skip if not "Femme" or handle conditional
    if (step === 1) {
      if (formData.sex === "Homme") {
        setStep(3); // Skip step 2
        return;
      }
    }
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Navigate to dashboard
      onNavigate("dashboard");
    }
  };

  const handleBack = () => {
    if (step === 3 && formData.sex === "Homme") {
      setStep(1); // Go back to step 1 if skipped step 2
      return;
    }
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleSelection = (field: "goals" | "conditions", value: string) => {
    const current = formData[field];
    
    // Special handling for "Aucune de ces conditions"
    if (field === "conditions" && value === "Aucune de ces conditions") {
      if (current.includes(value)) {
        setFormData({ ...formData, [field]: [] });
      } else {
        setFormData({ ...formData, [field]: [value] });
      }
      return;
    }
    
    // If selecting other conditions, remove "Aucune"
    if (field === "conditions" && current.includes("Aucune de ces conditions")) {
      setFormData({ ...formData, [field]: [value] });
      return;
    }
    
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter((item) => item !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Header with back button and step indicator */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, step === 1 && styles.invisible]}
        >
          <ArrowLeft size={24} color="#14272d" />
        </TouchableOpacity>
        <Text style={styles.stepText}>Étape {step} / {totalSteps}</Text>
        <View style={styles.spacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* STEP 1: SEX */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <User size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Sexe</Text>
              <Text style={styles.subtitle}>Pour des recommandations adaptées</Text>
            </View>
            <View style={styles.optionsContainer}>
              {["Femme", "Homme", "Préfère ne pas répondre"].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setFormData({ ...formData, sex: option })}
                  style={[
                    styles.optionButton,
                    formData.sex === option && styles.optionButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.optionText,
                    formData.sex === option && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 2: CONDITIONAL MEDICAL QUESTIONS */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Heart size={32} color="#7ea69d" />
              </View>
            </View>

            {/* If Femme: Show two switches */}
            {formData.sex === "Femme" && (
              <>
                <View style={styles.switchesContainer}>
                  {/* Pregnancy */}
                  <View style={styles.switchCard}>
                    <Text style={styles.switchLabel}>Êtes-vous enceinte ?</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setFormData({ ...formData, isPregnant: !formData.isPregnant })
                      }
                      style={[
                        styles.switch,
                        formData.isPregnant && styles.switchActive
                      ]}
                    >
                      <View style={[
                        styles.switchThumb,
                        formData.isPregnant && styles.switchThumbActive
                      ]} />
                    </TouchableOpacity>
                  </View>

                  {/* Breastfeeding */}
                  <View style={styles.switchCard}>
                    <Text style={styles.switchLabel}>Allaitez-vous actuellement ?</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setFormData({
                          ...formData,
                          isBreastfeeding: !formData.isBreastfeeding,
                        })
                      }
                      style={[
                        styles.switch,
                        formData.isBreastfeeding && styles.switchActive
                      ]}
                    >
                      <View style={[
                        styles.switchThumb,
                        formData.isBreastfeeding && styles.switchThumbActive
                      ]} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.helpText}>
                  Ces informations servent uniquement à garantir votre sécurité
                </Text>
              </>
            )}

            {/* If "Préfère ne pas répondre": Show question */}
            {formData.sex === "Préfère ne pas répondre" && (
              <>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>
                    Êtes-vous concerné(e) par une grossesse ou un allaitement ?
                  </Text>
                </View>
                <View style={styles.optionsContainer}>
                  {["Oui", "Non"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() =>
                        setFormData({ ...formData, pregnancyRelated: option })
                      }
                      style={[
                        styles.optionButton,
                        formData.pregnancyRelated === option && styles.optionButtonSelected
                      ]}
                    >
                      <Text style={[
                        styles.optionText,
                        formData.pregnancyRelated === option && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.helpText}>
                  Ces informations servent uniquement à garantir votre sécurité
                </Text>
              </>
            )}
          </View>
        )}

        {/* STEP 3: AGE RANGE */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Calendar size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Quelle est votre tranche d'âge ?</Text>
            </View>
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
                  onPress={() => setFormData({ ...formData, ageRange: range })}
                  style={[
                    styles.optionButton,
                    formData.ageRange === range && styles.optionButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.optionText,
                    formData.ageRange === range && styles.optionTextSelected
                  ]}>
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 4: HEIGHT & WEIGHT */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Scale size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Vos informations physiques</Text>
            </View>
            <View style={styles.inputsContainer}>
              {/* Height */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Taille (cm)</Text>
                <TextInput
                  value={formData.height}
                  onChangeText={(text) => setFormData({ ...formData, height: text })}
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
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                  placeholder="70"
                  placeholderTextColor="rgba(126, 166, 157, 0.5)"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 5: HEALTH GOALS */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Target size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Quels sont vos objectifs santé ?</Text>
              <Text style={styles.subtitle}>(Choix multiples possibles)</Text>
            </View>
            <View style={styles.optionsContainer}>
              {[
                { label: "Humeur & bien-être émotionnel", icon: Smile },
                { label: "Sommeil", icon: Moon },
                { label: "Contrôle du poids / appétit", icon: Weight },
                { label: "Énergie & fatigue", icon: Zap },
                { label: "Concentration & mémoire", icon: Brain },
                { label: "Santé générale", icon: Apple },
              ].map((goal) => {
                const Icon = goal.icon;
                return (
                  <TouchableOpacity
                    key={goal.label}
                    onPress={() => toggleSelection("goals", goal.label)}
                    style={[
                      styles.optionButtonWithIcon,
                      formData.goals.includes(goal.label) && styles.optionButtonSelected
                    ]}
                  >
                    <Icon size={20} color="#7ea69d" />
                    <Text style={[
                      styles.optionText,
                      formData.goals.includes(goal.label) && styles.optionTextSelected
                    ]}>
                      {goal.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 6: HEALTH CONDITIONS */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Shield size={32} color="#7ea69d" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Avez-vous actuellement l'une de ces conditions de santé ?
              </Text>
              <Text style={styles.subtitle}>
                (Sélection facultative — vous pouvez en choisir plusieurs)
              </Text>
            </View>

            {/* Conditions grouped by category */}
            <View style={styles.conditionsContainer}>
              {/* Métabolisme & endocrinien */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>🩸 Métabolisme & endocrinien</Text>
                {[
                  "Diabète",
                  "Troubles de la thyroïde",
                  "Déséquilibres hormonaux connus",
                ].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    onPress={() => toggleSelection("conditions", condition)}
                    style={[
                      styles.conditionButton,
                      formData.conditions.includes(condition) && styles.conditionButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.conditionText,
                      formData.conditions.includes(condition) && styles.conditionTextSelected
                    ]}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cardiovasculaire */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>❤️ Cardiovasculaire</Text>
                {["Hypertension", "Problèmes cardiaques"].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    onPress={() => toggleSelection("conditions", condition)}
                    style={[
                      styles.conditionButton,
                      formData.conditions.includes(condition) && styles.conditionButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.conditionText,
                      formData.conditions.includes(condition) && styles.conditionTextSelected
                    ]}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Mental & neurologique */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>🧠 Mental & neurologique</Text>
                {[
                  "Stress chronique",
                  "Anxiété",
                  "Troubles du sommeil diagnostiqués",
                ].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    onPress={() => toggleSelection("conditions", condition)}
                    style={[
                      styles.conditionButton,
                      formData.conditions.includes(condition) && styles.conditionButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.conditionText,
                      formData.conditions.includes(condition) && styles.conditionTextSelected
                    ]}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Digestif */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>🦠 Digestif</Text>
                {["Troubles digestifs", "Syndrome de l'intestin irritable"].map(
                  (condition) => (
                    <TouchableOpacity
                      key={condition}
                      onPress={() => toggleSelection("conditions", condition)}
                      style={[
                        styles.conditionButton,
                        formData.conditions.includes(condition) && styles.conditionButtonSelected
                      ]}
                    >
                      <Text style={[
                        styles.conditionText,
                        formData.conditions.includes(condition) && styles.conditionTextSelected
                      ]}>
                        {condition}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Autres */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>🛡️ Autres</Text>
                {["Anémie / carence en fer", "Maladie chronique"].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    onPress={() => toggleSelection("conditions", condition)}
                    style={[
                      styles.conditionButton,
                      formData.conditions.includes(condition) && styles.conditionButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.conditionText,
                      formData.conditions.includes(condition) && styles.conditionTextSelected
                    ]}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Aucune */}
              <TouchableOpacity
                onPress={() => toggleSelection("conditions", "Aucune de ces conditions")}
                style={[
                  styles.optionButton,
                  formData.conditions.includes("Aucune de ces conditions") && styles.optionButtonSelected
                ]}
              >
                <Text style={[
                  styles.optionText,
                  formData.conditions.includes("Aucune de ces conditions") && styles.optionTextSelected
                ]}>
                  Aucune de ces conditions
                </Text>
              </TouchableOpacity>
            </View>

            {/* Helper text */}
            <View style={styles.helperCard}>
              <Text style={styles.helperText}>
                Ces informations permettent d'adapter les recommandations et d'éviter les
                interactions ou contre-indications.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButton}
        >
          <Text style={styles.nextButtonText}>
            {step === totalSteps ? "Valider & accéder à mon espace" : "Continuer"}
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
    backgroundColor: '#fef6e2',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7ea69d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#7ea69d',
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
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e7ede7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#14272d',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7ea69d',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(20, 39, 45, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#e7ede7',
    borderColor: '#7ea69d',
  },
  optionText: {
    color: '#14272d',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#14272d',
  },
  optionButtonWithIcon: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(20, 39, 45, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchesContainer: {
    gap: 24,
  },
  switchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: '#14272d',
    fontSize: 16,
    flex: 1,
  },
  switch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(179, 211, 210, 0.4)',
    justifyContent: 'center',
    padding: 4,
  },
  switchActive: {
    backgroundColor: '#7ea69d',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  switchThumbActive: {
    transform: [{ translateX: 24 }],
  },
  helpText: {
    fontSize: 12,
    color: '#7ea69d',
    textAlign: 'center',
  },
  inputsContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#14272d',
    fontSize: 14,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    color: '#14272d',
    fontSize: 16,
  },
  conditionsContainer: {
    gap: 16,
  },
  categorySection: {
    gap: 8,
  },
  categoryTitle: {
    fontSize: 12,
    color: '#7ea69d',
    paddingHorizontal: 8,
  },
  conditionButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(20, 39, 45, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  conditionButtonSelected: {
    backgroundColor: '#e7ede7',
    borderColor: '#7ea69d',
  },
  conditionText: {
    color: '#14272d',
    fontSize: 14,
    textAlign: 'left',
  },
  conditionTextSelected: {
    color: '#14272d',
  },
  helperCard: {
    backgroundColor: '#e7ede7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#14272d',
    textAlign: 'center',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 39, 45, 0.1)',
    padding: 24,
  },
  nextButton: {
    backgroundColor: '#14272d',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});