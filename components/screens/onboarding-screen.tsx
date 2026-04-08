import {
  Activity,
  AlertCircle,
  Apple,
  ArrowLeft,
  ArrowRight,
  Baby,
  Brain,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Flame,
  Footprints,
  Heart,
  Mars,
  Moon,
  Pill,
  Shield,
  Smile,
  Target,
  User,
  Venus,
  Weight,
  XCircle,
  Zap,
} from "lucide-react-native";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/context/auth";
import {
  getGoalOptions,
  type GoalOptionResponse,
  updateMyProfile,
} from "@/services/api";

interface OnboardingScreenProps {
  onNavigate: (screen: string) => void;
  mode?: "full" | "goals";
}

type CardIcon = ComponentType<{ size?: number; color?: string }>;

type Option = {
  value: string;
  label: string;
  description?: string;
  icon?: CardIcon;
  accent?: string;
  intensity?: number;
};

type FormDataState = {
  firstname: string;
  lastname: string;
  sex: string;
  pregnancy: boolean | null;
  breastfeeding: boolean | null;
  birthdate: string;
  ageRange: string;
  height: string;
  weight: string;
  activityLevel: string;
  goals: string[];
  conditions: string[];
  diseases: string[];
  allergies: string[];
};

type ValidationResult =
  | { valid: true }
  | { valid: false; title: string; message: string };

function normalizeGoalAlias(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function normalizeStoredGoals(values: string[], options: GoalOptionResponse[]) {
  const byAlias = new Map<string, string>();
  for (const option of options) {
    byAlias.set(normalizeGoalAlias(option.id), option.id);
    byAlias.set(normalizeGoalAlias(option.label), option.id);
  }

  const normalized = values
    .map((value) => byAlias.get(normalizeGoalAlias(value)) ?? value.trim())
    .filter(Boolean);

  return dedupeStrings(normalized);
}

const GOAL_FALLBACK_OPTIONS: Option[] = [
  { value: "mood_depression_support", label: "AmÃƒÆ’Ã‚Â©liorer mon humeur" },
  { value: "stress_anxiety_support", label: "GÃƒÆ’Ã‚Â©rer le stress et l'anxiÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â©" },
  { value: "sleep_support", label: "AmÃƒÆ’Ã‚Â©liorer mon sommeil" },
  { value: "weight_loss", label: "Perdre du poids" },
  { value: "appetite_control", label: "ContrÃƒÆ’Ã‚Â´ler mon appÃƒÆ’Ã‚Â©tit" },
  { value: "energy_fatigue", label: "Augmenter mon ÃƒÆ’Ã‚Â©nergie" },
  { value: "focus_cognition", label: "AmÃƒÆ’Ã‚Â©liorer ma concentration et mÃƒÆ’Ã‚Â©moire" },
  { value: "digestion_gut", label: "AmÃƒÆ’Ã‚Â©liorer ma digestion" },
  { value: "immune_support", label: "Renforcer mon immunitÃƒÆ’Ã‚Â©" },
  { value: "muscle_gain_strength", label: "Gagner en muscle et force" },
  { value: "pain_inflammation", label: "RÃƒÆ’Ã‚Â©duire douleurs et inflammations" },
  { value: "migraine_headache", label: "PrÃƒÆ’Ã‚Â©venir migraines et maux de tÃƒÆ’Ã‚Âªte" },
];

// Organized by category for better UX
const MEDICATION_CONDITIONS: Option[] = [
  {
    value: "taking_serotonergic_meds",
    label: "AntidÃƒÆ’Ã‚Â©presseurs (ISRS, IRSN, etc.)",
  },
  {
    value: "taking_anticoagulants",
    label: "Anticoagulants (fluidifiants sanguins)",
  },
  { value: "taking_antidiabetic_meds", label: "MÃƒÆ’Ã‚Â©dicaments pour le diabÃƒÆ’Ã‚Â¨te" },
  { value: "taking_antihypertensives", label: "MÃƒÆ’Ã‚Â©dicaments pour la tension" },
];

const HEALTH_CONDITIONS: Option[] = [
  { value: "gi_disorder", label: "Troubles digestifs chroniques" },
  { value: "liver_disease", label: "ProblÃƒÆ’Ã‚Â¨me hÃƒÆ’Ã‚Â©patique (foie)" },
  { value: "kidney_disease", label: "ProblÃƒÆ’Ã‚Â¨me rÃƒÆ’Ã‚Â©nal (reins)" },
  { value: "thyroid_disorder", label: "Trouble de la thyroÃƒÆ’Ã‚Â¯de" },
  { value: "seizure_disorder", label: "Historique d'ÃƒÆ’Ã‚Â©pilepsie" },
  { value: "autoimmune_condition", label: "Maladie auto-immune" },
  { value: "allergy_prone", label: "Terrain allergique" },
];

const DISEASES: Option[] = [
  { value: "depression", label: "DÃƒÆ’Ã‚Â©pression" },
  { value: "anxiety_disorder", label: "Trouble anxieux" },
  { value: "panic_disorder", label: "Trouble panique" },
  { value: "obesity", label: "ObÃƒÆ’Ã‚Â©sitÃƒÆ’Ã‚Â©" },
  { value: "type2_diabetes", label: "DiabÃƒÆ’Ã‚Â¨te type 2" },
  { value: "migraine", label: "Migraine" },
  { value: "fibromyalgia", label: "Fibromyalgie" },
  { value: "parkinsons_disease", label: "Maladie de Parkinson" },
  { value: "insomnia", label: "Insomnie" },
  { value: "ibs", label: "Syndrome intestin irritable (IBS)" },
  { value: "hypertension", label: "Hypertension" },
  { value: "high_cholesterol", label: "CholestÃƒÆ’Ã‚Â©rol ÃƒÆ’Ã‚Â©levÃƒÆ’Ã‚Â©" },
];

const ALLERGIES: Option[] = [
  { value: "none", label: "Aucune allergie" },
  { value: "peanuts", label: "Arachides" },
  { value: "tree_nuts", label: "Fruits ÃƒÆ’Ã‚Â  coque (noix, amandes, etc.)" },
  { value: "soy", label: "Soja" },
  { value: "gluten", label: "Gluten" },
  { value: "lactose", label: "Lactose" },
  { value: "shellfish", label: "Fruits de mer / crustacÃƒÆ’Ã‚Â©s" },
  { value: "fish", label: "Poisson" },
  { value: "egg", label: "Ãƒâ€¦Ã¢â‚¬â„¢ufs" },
  { value: "sesame", label: "SÃƒÆ’Ã‚Â©same" },
  { value: "pollen", label: "Pollen" },
  { value: "medication", label: "Allergie ÃƒÆ’Ã‚Â  certains mÃƒÆ’Ã‚Â©dicaments" },
  { value: "other", label: "Autre allergie" },
];

const MODERN_SEX_OPTIONS: Option[] = [
  {
    value: "Femme",
    label: "Femme",
    description: "Profil feminin",
    icon: Venus,
    accent: "#7ea69d",
  },
  {
    value: "Homme",
    label: "Homme",
    description: "Profil masculin",
    icon: Mars,
    accent: "#d9a86c",
  },
];

const AGE_RANGE_UNDER_18 = "Moins de 18 ans";
const AGE_RANGE_18_TO_30 = "18 - 30 ans";
const AGE_RANGE_31_TO_45 = "31 - 45 ans";
const AGE_RANGE_46_TO_60 = "46 - 60 ans";
const AGE_RANGE_OVER_60 = "Plus de 60 ans";
const BIRTH_MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aou",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MIN_BIRTH_YEAR = 1920;

const MODERN_ACTIVITY_LEVELS: Option[] = [
  {
    value: "sedentary",
    label: "Peu ou pas d'activite",
    description: "Routine calme et assise",
    icon: Moon,
    accent: "#8d6f4f",
    intensity: 1,
  },
  {
    value: "light",
    label: "Legere",
    description: "Marche et mouvement regulier",
    icon: Footprints,
    accent: "#7ea69d",
    intensity: 2,
  },
  {
    value: "moderate",
    label: "Moderee",
    description: "3 a 5 seances par semaine",
    icon: Activity,
    accent: "#5e8f7a",
    intensity: 3,
  },
  {
    value: "active",
    label: "Active",
    description: "Rythme soutenu et frequent",
    icon: Flame,
    accent: "#c27f4d",
    intensity: 4,
  },
  {
    value: "very_active",
    label: "Tres active",
    description: "Intensite elevee ou travail physique",
    icon: Zap,
    accent: "#d38f2f",
    intensity: 5,
  },
];

function getGoalMeta(value: string) {
  switch (value) {
    case "sleep_support":
      return { icon: Moon, description: "Retrouver un sommeil plus serein", accent: "#7ea69d" };
    case "energy_fatigue":
      return { icon: Zap, description: "Retrouver plus de tonus", accent: "#c27f4d" };
    case "focus_cognition":
      return { icon: Brain, description: "Soutenir memoire et concentration", accent: "#7ea69d" };
    case "weight_loss":
      return { icon: Weight, description: "Mieux accompagner la gestion du poids", accent: "#d9a86c" };
    case "appetite_control":
      return { icon: Apple, description: "Mieux regulariser les envies", accent: "#d9a86c" };
    case "mood_depression_support":
      return { icon: Smile, description: "Soutenir l'equilibre emotionnel", accent: "#7ea69d" };
    case "stress_anxiety_support":
      return { icon: Shield, description: "Retrouver plus de serenite", accent: "#7ea69d" };
    case "digestion_gut":
      return { icon: Heart, description: "Favoriser le confort digestif", accent: "#7ea69d" };
    case "immune_support":
      return { icon: Shield, description: "Renforcer les defenses naturelles", accent: "#7ea69d" };
    case "muscle_gain_strength":
      return { icon: Activity, description: "Accompagner force et recuperation", accent: "#5e8f7a" };
    case "pain_inflammation":
      return { icon: AlertCircle, description: "Apporter plus de confort au quotidien", accent: "#c27f4d" };
    case "migraine_headache":
      return { icon: Target, description: "Mieux anticiper les pics", accent: "#7ea69d" };
    default:
      return { icon: Target, description: "Un objectif adapte a votre quotidien", accent: "#7ea69d" };
  }
}

function getActivityMeta(value: string) {
  return MODERN_ACTIVITY_LEVELS.find((item) => item.value === value) ?? MODERN_ACTIVITY_LEVELS[0];
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function parseBirthdateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > getDaysInMonth(year, month)) return null;

  return { year, month, day };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildBirthdateValue(year: number, month: number, day: number) {
  const safeDay = Math.min(day, getDaysInMonth(year, month));
  return `${year}-${padDatePart(month)}-${padDatePart(safeDay)}`;
}

function getAgeFromBirthdate(value: string) {
  const parts = parseBirthdateParts(value);
  if (!parts) return null;

  const today = new Date();
  let age = today.getFullYear() - parts.year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > parts.month ||
    (today.getMonth() + 1 === parts.month && today.getDate() >= parts.day);

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  if (age < 0) return null;
  return age;
}

function deriveAgeRangeFromBirthdate(value: string) {
  const age = getAgeFromBirthdate(value);
  if (age === null) return null;
  if (age < 18) return AGE_RANGE_UNDER_18;
  if (age <= 30) return AGE_RANGE_18_TO_30;
  if (age <= 45) return AGE_RANGE_31_TO_45;
  if (age <= 60) return AGE_RANGE_46_TO_60;
  return AGE_RANGE_OVER_60;
}

function formatBirthdateDisplay(value: string) {
  const parts = parseBirthdateParts(value);
  if (!parts) return "JJ/MM/AAAA";
  return `${padDatePart(parts.day)}/${padDatePart(parts.month)}/${parts.year}`;
}

function getHeroCopy(step: number, isGoalsOnly: boolean, sex: string) {
  if (isGoalsOnly) {
    return {
      eyebrow: "Objectifs",
      title: "Mise a jour en douceur",
      subtitle:
        "Ajustez vos priorites pour garder des recommandations alignees avec votre quotidien.",
    };
  }

  switch (step) {
    case 1:
      return {
        eyebrow: "Bienvenue",
        title: "Construisons votre profil",
        subtitle: "Quelques reperes pour adapter l'experience sans vous surcharger.",
      };
    case 2:
      return {
        eyebrow: "Securite",
        title: "Un contexte plus precis",
        subtitle: "Ces informations aident a eviter certaines recommandations inadaptÃƒÆ’Ã‚Â©es.",
      };
    case 3:
      return {
        eyebrow: "Rythme de vie",
        title: "Votre niveau d'activite",
        subtitle: "On ajuste ensuite les conseils selon votre dynamique quotidienne.",
      };
    case 4:
      return {
        eyebrow: "Objectifs",
        title: "Ce que vous voulez ameliorer",
        subtitle: "Choisissez un ou plusieurs objectifs pour personnaliser le parcours.",
      };
    case 5:
      return {
        eyebrow: "Precautions",
        title: "Points de vigilance",
        subtitle: "Optionnel, mais utile pour garder des recommandations plus surees.",
      };
    default:
      return {
        eyebrow: "Votre suivi",
        title: sex === "Femme" ? "Derniers ajustements" : "Derniers ajustements",
        subtitle: "Encore une etape avant de profiter de votre espace personnalise.",
      };
  }
}

function validateOnboardingStep({
  isGoalsOnly,
  step,
  formData,
}: {
  isGoalsOnly: boolean;
  step: number;
  formData: FormDataState;
}): ValidationResult {
  const hasText = (value: string) => value.trim().length > 0;
  const hasPositiveNumber = (value: string) => {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    return normalized.length > 0 && Number.isFinite(parsed) && parsed > 0;
  };

  if (isGoalsOnly) {
    if (formData.goals.length === 0) {
      return {
        valid: false,
        title: "Objectif requis",
        message: "Choisissez au moins un objectif avant de continuer.",
      };
    }
    return { valid: true };
  }

  switch (step) {
    case 1:
      if (!hasText(formData.firstname)) {
        return { valid: false, title: "PrÃƒÆ’Ã‚Â©nom requis", message: "Veuillez renseigner votre prÃƒÆ’Ã‚Â©nom." };
      }
      if (!hasText(formData.lastname)) {
        return { valid: false, title: "Nom requis", message: "Veuillez renseigner votre nom." };
      }
      if (!hasText(formData.sex)) {
        return { valid: false, title: "Sexe requis", message: "Veuillez choisir une option pour continuer." };
      }
      if (!hasText(formData.birthdate)) {
        return {
          valid: false,
          title: "Date de naissance requise",
          message: "Veuillez selectionner votre date de naissance.",
        };
      }
      if (!deriveAgeRangeFromBirthdate(formData.birthdate)) {
        return {
          valid: false,
          title: "Date invalide",
          message: "Veuillez choisir une date de naissance valide.",
        };
      }
      if (!hasPositiveNumber(formData.height)) {
        return { valid: false, title: "Taille requise", message: "Veuillez saisir une taille valide en centimetres." };
      }
      if (!hasPositiveNumber(formData.weight)) {
        return { valid: false, title: "Poids requis", message: "Veuillez saisir un poids valide en kilogrammes." };
      }
      return { valid: true };
    case 2:
      if (formData.pregnancy === null) {
        return { valid: false, title: "Reponse requise", message: "Veuillez indiquer si vous ÃƒÆ’Ã‚Âªtes enceinte." };
      }
      if (formData.breastfeeding === null) {
        return { valid: false, title: "Reponse requise", message: "Veuillez indiquer si vous allaitez." };
      }
      return { valid: true };
    case 3:
      if (!hasText(formData.activityLevel)) {
        return { valid: false, title: "Activite requise", message: "Veuillez choisir votre niveau d'activite physique." };
      }
      return { valid: true };
    case 4:
      if (formData.goals.length === 0) {
        return { valid: false, title: "Objectif requis", message: "Choisissez au moins un objectif avant de continuer." };
      }
      return { valid: true };
    default:
      return { valid: true };
  }
}

type SectionFrameProps = {
  icon: CardIcon;
  title: string;
  subtitle: string;
  badge?: string;
  countLabel?: string;
  children: ReactNode;
};

function SectionFrame({
  icon: Icon,
  title,
  subtitle,
  badge,
  countLabel,
  children,
}: SectionFrameProps) {
  return (
    <View style={styles.sectionFrame}>
      <View style={styles.sectionTop}>
        <View style={styles.sectionIconWrap}>
          <Icon size={20} color="#14272d" />
        </View>
        <View style={styles.sectionCopy}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionPills}>
              {badge ? (
                <View
                  style={[
                    styles.pill,
                    badge === "Requis" ? styles.pillRequired : styles.pillNeutral,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      badge === "Requis"
                        ? styles.pillTextRequired
                        : styles.pillTextNeutral,
                    ]}
                  >
                    {badge}
                  </Text>
                </View>
              ) : null}
              {countLabel ? (
                <View style={styles.pillNeutral}>
                  <Text style={styles.pillTextNeutral}>{countLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

type GenderSymbolCardProps = {
  icon: CardIcon;
  label: string;
  selected: boolean;
  onPress: () => void;
  accent?: string;
};

function GenderSymbolCard({
  icon: Icon,
  label,
  selected,
  onPress,
  accent = "#7ea69d",
}: GenderSymbolCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.genderSymbolCard,
        selected && styles.genderSymbolCardSelected,
        { borderColor: selected ? accent : "rgba(20, 39, 45, 0.08)" },
      ]}
    >
      {selected ? (
        <LinearGradient
          colors={["rgba(126,166,157,0.16)", "rgba(255,255,255,0.96)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          styles.genderSymbolIconWrap,
          { borderColor: `${accent}45` },
          selected && { backgroundColor: `${accent}18` },
        ]}
      >
        <Icon size={34} color={accent} />
      </View>
      <Text
        style={[
          styles.genderSymbolLabel,
          selected && styles.genderSymbolLabelSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type BirthdateWheelPickerProps = {
  value: string;
  onChange: (nextValue: string) => void;
};

function BirthdateWheelPicker({ value, onChange }: BirthdateWheelPickerProps) {
  const today = new Date();
  const parsed = parseBirthdateParts(value);
  const selectedYear = parsed?.year ?? today.getFullYear() - 25;
  const selectedMonth = parsed?.month ?? 1;
  const selectedDay = parsed?.day ?? 1;
  const years = Array.from(
    { length: today.getFullYear() - MIN_BIRTH_YEAR + 1 },
    (_, index) => today.getFullYear() - index,
  );
  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, index) => index + 1,
  );

  const updatePart = (
    nextYear: number = selectedYear,
    nextMonth: number = selectedMonth,
    nextDay: number = selectedDay,
  ) => {
    onChange(buildBirthdateValue(nextYear, nextMonth, nextDay));
  };

  return (
    <View style={styles.birthdatePickerShell}>
      <View style={styles.birthdatePickerHeader}>
        <Text style={styles.birthdatePickerTitle}>Selectionnez votre date</Text>
        <Text style={styles.birthdatePickerHint}>Jour, mois et annee</Text>
      </View>

      <View style={styles.birthdateWheelRow}>
        <View style={styles.birthdateWheelColumn}>
          <Text style={styles.birthdateWheelLabel}>Mois</Text>
          <ScrollView
            nestedScrollEnabled
            style={styles.birthdateWheelScroll}
            showsVerticalScrollIndicator={false}
          >
            {BIRTH_MONTHS.map((monthLabel, index) => {
              const monthValue = index + 1;
              const selected = monthValue === selectedMonth;
              return (
                <TouchableOpacity
                  key={monthLabel}
                  onPress={() => updatePart(selectedYear, monthValue, selectedDay)}
                  style={[
                    styles.birthdateWheelItem,
                    selected && styles.birthdateWheelItemSelected,
                  ]}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[
                      styles.birthdateWheelText,
                      selected && styles.birthdateWheelTextSelected,
                    ]}
                  >
                    {monthLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.birthdateWheelColumnNarrow}>
          <Text style={styles.birthdateWheelLabel}>Jour</Text>
          <ScrollView
            nestedScrollEnabled
            style={styles.birthdateWheelScroll}
            showsVerticalScrollIndicator={false}
          >
            {days.map((dayValue) => {
              const selected = dayValue === selectedDay;
              return (
                <TouchableOpacity
                  key={dayValue}
                  onPress={() => updatePart(selectedYear, selectedMonth, dayValue)}
                  style={[
                    styles.birthdateWheelItem,
                    selected && styles.birthdateWheelItemSelected,
                  ]}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[
                      styles.birthdateWheelText,
                      selected && styles.birthdateWheelTextSelected,
                    ]}
                  >
                    {dayValue}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.birthdateWheelColumn}>
          <Text style={styles.birthdateWheelLabel}>Annee</Text>
          <ScrollView
            nestedScrollEnabled
            style={styles.birthdateWheelScroll}
            showsVerticalScrollIndicator={false}
          >
            {years.map((yearValue) => {
              const selected = yearValue === selectedYear;
              return (
                <TouchableOpacity
                  key={yearValue}
                  onPress={() => updatePart(yearValue, selectedMonth, selectedDay)}
                  style={[
                    styles.birthdateWheelItem,
                    selected && styles.birthdateWheelItemSelected,
                  ]}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[
                      styles.birthdateWheelText,
                      selected && styles.birthdateWheelTextSelected,
                    ]}
                  >
                    {yearValue}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

type ChoiceCardProps = {
  icon: CardIcon;
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  accent?: string;
  compact?: boolean;
  trailing?: ReactNode;
};

function ChoiceCard({
  icon: Icon,
  title,
  description,
  selected,
  onPress,
  accent = "#7ea69d",
  compact = false,
  trailing,
}: ChoiceCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.choiceCard,
        compact && styles.choiceCardCompact,
        selected && styles.choiceCardSelected,
        { borderColor: selected ? accent : "rgba(20, 39, 45, 0.08)" },
      ]}
    >
      {selected ? (
        <LinearGradient
          colors={["rgba(126,166,157,0.18)", "rgba(255,255,255,0.95)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[styles.choiceIcon, selected && { backgroundColor: `${accent}20` }]}>
        <Icon size={18} color={accent} />
      </View>
      <View style={styles.choiceCopyWrap}>
        <Text style={[styles.choiceTitle, compact && styles.choiceTitleCompact]}>
          {title}
        </Text>
        {description ? (
          <Text
            style={[
              styles.choiceDescription,
              compact && styles.choiceDescriptionCompact,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <View style={styles.choiceTrailing}>
        {trailing ??
          (selected ? (
            <View style={[styles.choiceCheck, { borderColor: accent }]}>
              <CheckCircle2 size={14} color={accent} />
            </View>
          ) : null)}
      </View>
    </TouchableOpacity>
  );
}

type ChipCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent?: string;
  icon?: CardIcon;
};

function ChipCard({
  label,
  selected,
  onPress,
  accent = "#7ea69d",
  icon: Icon,
}: ChipCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.chipCard,
        selected && styles.chipCardSelected,
        { borderColor: selected ? accent : "rgba(20, 39, 45, 0.08)" },
      ]}
    >
      {selected ? (
        <LinearGradient
          colors={["rgba(126,166,157,0.18)", "rgba(255,255,255,0.95)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {Icon ? <Icon size={14} color={accent} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type FormFieldProps = {
  label: string;
  required?: boolean;
  icon: CardIcon;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: TextInputProps["keyboardType"];
  unit?: string;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoCapitalize?: TextInputProps["autoCapitalize"];
};

function FormField({
  label,
  required,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  unit,
  focused,
  onFocus,
  onBlur,
  autoCapitalize = "sentences",
}: FormFieldProps) {
  return (
    <View style={styles.fieldCard}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {required ? (
          <View style={styles.requiredTag}>
            <Text style={styles.requiredTagText}>Requis</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.fieldShell, focused && styles.fieldShellFocused]}>
        <View style={styles.fieldIconWrap}>
          <Icon size={18} color="#7ea69d" />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="rgba(126,166,157,0.58)"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={styles.fieldInput}
        />
        {unit ? (
          <View style={styles.unitTag}>
            <Text style={styles.unitTagText}>{unit}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

type ActivityScaleProps = {
  intensity: number;
};

function ActivityScale({ intensity }: ActivityScaleProps) {
  return (
    <View style={styles.activityScale}>
      {[1, 2, 3, 4, 5].map((bar) => (
        <View
          key={bar}
          style={[styles.activityBar, bar <= intensity && styles.activityBarActive]}
        />
      ))}
    </View>
  );
}

export function OnboardingScreen({
  onNavigate,
  mode = "full",
}: OnboardingScreenProps) {
  const { refreshMe, user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const isGoalsOnly = mode === "goals";
  const initialGoals = useMemo(
    () =>
      Array.isArray(user?.profile?.goals)
        ? user.profile.goals.filter(
            (goal: unknown) => typeof goal === "string" && goal.trim(),
          )
        : [],
    [user?.profile?.goals],
  );
  const [goalOptions, setGoalOptions] = useState<Option[]>(
    GOAL_FALLBACK_OPTIONS,
  );
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [birthdatePickerOpen, setBirthdatePickerOpen] = useState(false);

  const [step, setStep] = useState(isGoalsOnly ? 4 : 1);
  const [formData, setFormData] = useState<FormDataState>({
    firstname: "",
    lastname: "",
    sex: "",
    pregnancy: null,
    breastfeeding: null,
    birthdate: "",
    ageRange: "",
    height: "",
    weight: "",
    activityLevel: "",
    goals: initialGoals as string[],
    conditions: [] as string[],
    diseases: [] as string[],
    allergies: ["none"] as string[],
  });

  useEffect(() => {
    let isMounted = true;

    const loadGoalOptions = async () => {
      try {
        const options = await getGoalOptions();
        if (!isMounted || options.length === 0) return;

        const normalized = normalizeStoredGoals(initialGoals, options);
        const mappedOptions = options.map((option) => ({
          value: option.id,
          label: option.label,
        }));

        setGoalOptions(mappedOptions);
        setFormData((prev) => ({
          ...prev,
          goals: normalized.length > 0 ? normalized : prev.goals,
        }));
      } catch {
        // Keep fallback goals if backend metadata is unavailable.
      }
    };

    void loadGoalOptions();
    return () => {
      isMounted = false;
    };
  }, [initialGoals]);

  // Dynamic total steps: 5 for men, 6 for women (adds pregnancy/breastfeeding step)
  function getDisplayStep() {
    if (isGoalsOnly) return 1;
    if (formData.sex === "Homme" && step >= 3) {
      return step - 1; // Adjust display for skipped step
    }
    return step;
  }

  const totalSteps = isGoalsOnly ? 4 : formData.sex === "Femme" ? 6 : 5;
  const displayStep = getDisplayStep();
  const progress = isGoalsOnly ? 100 : (displayStep / totalSteps) * 100;
  const hero = useMemo(
    () => getHeroCopy(step, isGoalsOnly, formData.sex),
    [formData.sex, isGoalsOnly, step],
  );
  const derivedAgeRange = useMemo(
    () => deriveAgeRangeFromBirthdate(formData.birthdate),
    [formData.birthdate],
  );
  const derivedAge = useMemo(
    () => getAgeFromBirthdate(formData.birthdate),
    [formData.birthdate],
  );

  const setBirthdateValue = (nextBirthdate: string) => {
    const nextAgeRange = deriveAgeRangeFromBirthdate(nextBirthdate) ?? "";
    setFormData((prev) => ({
      ...prev,
      birthdate: nextBirthdate,
      ageRange: nextAgeRange,
    }));
  };

  const sexToApi = (sex: string) => {
    if (sex === "Femme") return "female";
    if (sex === "Homme") return "male";
    return "other";
  };

  const ageRangeToApi = (range: string) => {
    switch (range) {
      case AGE_RANGE_UNDER_18:
        return "-18";
      case AGE_RANGE_18_TO_30:
        return "18-30";
      case AGE_RANGE_31_TO_45:
        return "31-45";
      case AGE_RANGE_46_TO_60:
        return "46-60";
      case AGE_RANGE_OVER_60:
        return "+60";
      default:
        return null;
    }
  };

  const handleSubmitProfile = async () => {
    const medicationValues = new Set(MEDICATION_CONDITIONS.map((x) => x.value));
    const healthConditionValues = new Set(
      HEALTH_CONDITIONS.map((x) => x.value),
    );

    const medications = formData.conditions.filter((x) =>
      medicationValues.has(x),
    );
    const conditions = formData.conditions.filter((x) =>
      healthConditionValues.has(x),
    );

    const payload = {
      personal: {
        age_range:
          ageRangeToApi(derivedAgeRange ?? formData.ageRange) ?? undefined,
        name: `${formData.firstname} ${formData.lastname}`.trim() || undefined,
        sex: sexToApi(formData.sex),
        height_cm: formData.height ? Number(formData.height) : undefined,
        weight_kg: formData.weight ? Number(formData.weight) : undefined,
      },
      activity_level: formData.activityLevel || undefined,
      goals: formData.goals.length ? formData.goals : undefined,
      medical: {
        is_pregnant:
          formData.sex === "Femme" ? Boolean(formData.pregnancy) : undefined,
        is_breastfeeding:
          formData.sex === "Femme"
            ? Boolean(formData.breastfeeding)
            : undefined,
        conditions: conditions.length ? conditions : undefined,
        diseases: formData.diseases.length ? formData.diseases : undefined,
        medications: medications.length ? medications : undefined,
        allergies: formData.allergies.includes("none")
          ? ["none"]
          : formData.allergies,
      },
    };

    try {
      setSaving(true);
      await updateMyProfile(payload);
      await refreshMe();
      onNavigate("dashboard");
    } catch (e: any) {
      Alert.alert(
        "Erreur",
        e?.response?.data?.detail ?? "Impossible d'enregistrer le profil",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitGoalsOnly = async () => {
    const mergedGoals = normalizeStoredGoals(
      dedupeStrings([...initialGoals, ...formData.goals]),
      goalOptions.map((option) => ({ id: option.value, label: option.label })),
    );

    if (mergedGoals.length === 0) {
      Alert.alert(
        "Objectif requis",
        "Choisissez au moins un objectif avant d'enregistrer.",
      );
      return;
    }

    try {
      setSaving(true);
      await updateMyProfile({ goals: mergedGoals });
      await refreshMe();
      onNavigate("dashboard");
    } catch (e: any) {
      Alert.alert(
        "Erreur",
        e?.response?.data?.detail ??
          "Impossible d'enregistrer les objectifs.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    const validation = validateOnboardingStep({
      isGoalsOnly,
      step,
      formData,
    });

    if (!validation.valid) {
      Alert.alert(validation.title, validation.message);
      return;
    }

    if (isGoalsOnly) {
      void handleSubmitGoalsOnly();
      return;
    }

    // Skip step 2 (pregnancy/breastfeeding) if user is male
    if (step === 1 && formData.sex === "Homme") {
      setStep(3); // Jump to activity level
    } else if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // LAST STEP => call API
      handleSubmitProfile();
    }
  };

  const handleBack = () => {
    if (isGoalsOnly) {
      onNavigate("dashboard");
      return;
    }

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

  return (
    <View className="flex-1 bg-aja-cream" style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={handleBack}
          style={[
            styles.backButton,
            !isGoalsOnly && step === 1 && styles.backButtonHidden,
          ]}
          disabled={saving || (!isGoalsOnly && step === 1)}
          activeOpacity={0.85}
        >
          <ArrowLeft size={22} color="#14272d" />
        </TouchableOpacity>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {isGoalsOnly ? "Objectifs" : `Etape ${displayStep} / ${totalSteps}`}
          </Text>
        </View>

        <View style={styles.brandChip}>
          <Image
            source={require("@/assets/images/logo aja 1.png")}
            style={styles.brandLogo}
          />
        </View>
      </View>

      <View style={[styles.compactHeaderCard, isWide && styles.compactHeaderCardWide]}>
        <View style={styles.compactHeaderCopy}>
          <Text style={styles.compactHeaderEyebrow}>{hero.eyebrow}</Text>
          <Text style={styles.compactHeaderTitle}>{hero.title}</Text>
          <Text style={styles.compactHeaderSubtitle}>{hero.subtitle}</Text>
        </View>

        <View style={styles.compactHeaderMeter}>
          <Text style={styles.compactHeaderMeterLabel}>
            {isGoalsOnly ? "1 ecran" : `${displayStep}/${totalSteps}`}
          </Text>
          <Text style={styles.compactHeaderMeterValue}>{Math.round(progress)}%</Text>
        </View>
      </View>

      <View style={styles.progressTrackCompact}>
        <View style={[styles.progressFillCompact, { width: `${progress}%` }]} />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
                {/* STEP 1: PROFILE INFORMATION */}
        {step === 1 && (
          <SectionFrame
            icon={User}
            title="Vos informations"
            subtitle="Quelques repÃƒÂ¨res pour personnaliser vos recommandations."
            badge="Requis"
          >
            <FormField
              label="PrÃƒÂ©nom"
              required
              icon={User}
              value={formData.firstname}
              onChangeText={(text) =>
                setFormData({ ...formData, firstname: text })
              }
              placeholder="Votre prÃƒÂ©nom"
              focused={focusedField === "firstname"}
              onFocus={() => setFocusedField("firstname")}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
            />

            <FormField
              label="Nom"
              required
              icon={User}
              value={formData.lastname}
              onChangeText={(text) =>
                setFormData({ ...formData, lastname: text })
              }
              placeholder="Votre nom"
              focused={focusedField === "lastname"}
              onFocus={() => setFocusedField("lastname")}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
            />

            <View style={styles.choiceBlock}>
              <View style={styles.choiceBlockHeader}>
                <Text style={styles.choiceBlockTitle}>Sexe</Text>
                <Text style={styles.choiceBlockHint}>Requis</Text>
              </View>
              <View style={styles.genderSymbolRow}>
                {MODERN_SEX_OPTIONS.map((option) => {
                  const Icon = option.icon ?? Venus;
                  return (
                    <View key={option.value} style={styles.genderSymbolItem}>
                      <GenderSymbolCard
                        icon={Icon}
                        label={option.label}
                        selected={formData.sex === option.value}
                        onPress={() =>
                          setFormData({ ...formData, sex: option.value })
                        }
                        accent={option.accent}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.choiceBlock}>
              <View style={styles.choiceBlockHeader}>
                <Text style={styles.choiceBlockTitle}>Date de naissance</Text>
                <Text style={styles.choiceBlockHint}>Requis</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBirthdatePickerOpen((prev) => !prev)}
                activeOpacity={0.9}
                style={[
                  styles.birthdateTrigger,
                  birthdatePickerOpen && styles.birthdateTriggerActive,
                ]}
              >
                <View style={styles.fieldIconWrap}>
                  <CalendarDays size={18} color="#7ea69d" />
                </View>
                <View style={styles.birthdateTriggerCopy}>
                  <Text style={styles.birthdateTriggerValue}>
                    {formatBirthdateDisplay(formData.birthdate)}
                  </Text>
                  <Text style={styles.birthdateTriggerHint}>
                    {derivedAgeRange && derivedAge !== null
                      ? `${derivedAge} ans | ${derivedAgeRange}`
                      : "Touchez pour choisir votre date de naissance"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.birthdateChevron,
                    birthdatePickerOpen && styles.birthdateChevronOpen,
                  ]}
                >
                  <ChevronDown size={18} color="#7ea69d" />
                </View>
              </TouchableOpacity>

              {birthdatePickerOpen ? (
                <BirthdateWheelPicker
                  value={formData.birthdate}
                  onChange={setBirthdateValue}
                />
              ) : null}
            </View>

            <View style={[styles.metricRow, isWide && styles.metricRowWide]}>
              <View style={[styles.metricItem, isWide && styles.metricItemWide]}>
                <FormField
                  label="Taille"
                  required
                  icon={Activity}
                  value={formData.height}
                  onChangeText={(text) =>
                    setFormData({ ...formData, height: text })
                  }
                  placeholder="170"
                  keyboardType="numeric"
                  unit="cm"
                  focused={focusedField === "height"}
                  onFocus={() => setFocusedField("height")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={[styles.metricItem, isWide && styles.metricItemWide]}>
                <FormField
                  label="Poids"
                  required
                  icon={Weight}
                  value={formData.weight}
                  onChangeText={(text) =>
                    setFormData({ ...formData, weight: text })
                  }
                  placeholder="70"
                  keyboardType="numeric"
                  unit="kg"
                  focused={focusedField === "weight"}
                  onFocus={() => setFocusedField("weight")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </SectionFrame>
        )}

                {/* STEP 2: PREGNANCY & BREASTFEEDING (Women only) */}
        {step === 2 && formData.sex === "Femme" && (
          <SectionFrame
            icon={Baby}
            title="Situation actuelle"
            subtitle="RÃƒÂ©pondez pour garder des recommandations sÃƒÂ»res."
            badge="Requis"
          >
            <View style={styles.questionStack}>
              <View style={styles.questionCard}>
                <View style={styles.choiceBlockHeader}>
                  <Text style={styles.choiceBlockTitle}>ÃƒÅ tes-vous enceinte ?</Text>
                  <Text style={styles.choiceBlockHint}>Requis</Text>
                </View>
                <View style={[styles.choiceGrid, isWide && styles.choiceGridTwo]}>
                  <View
                    style={[styles.choiceGridItem, isWide && styles.choiceGridItemTwo]}
                  >
                    <ChoiceCard
                      icon={CheckCircle2}
                      title="Oui"
                      description="Je suis enceinte"
                      selected={formData.pregnancy === true}
                      onPress={() => setFormData({ ...formData, pregnancy: true })}
                      accent="#7ea69d"
                      compact
                    />
                  </View>
                  <View
                    style={[styles.choiceGridItem, isWide && styles.choiceGridItemTwo]}
                  >
                    <ChoiceCard
                      icon={XCircle}
                      title="Non"
                      description="Pas concernÃƒÂ©e"
                      selected={formData.pregnancy === false}
                      onPress={() => setFormData({ ...formData, pregnancy: false })}
                      accent="#d9a86c"
                      compact
                    />
                  </View>
                </View>
              </View>

              <View style={styles.questionCard}>
                <View style={styles.choiceBlockHeader}>
                  <Text style={styles.choiceBlockTitle}>Allaitez-vous ?</Text>
                  <Text style={styles.choiceBlockHint}>Requis</Text>
                </View>
                <View style={[styles.choiceGrid, isWide && styles.choiceGridTwo]}>
                  <View
                    style={[styles.choiceGridItem, isWide && styles.choiceGridItemTwo]}
                  >
                    <ChoiceCard
                      icon={CheckCircle2}
                      title="Oui"
                      description="Je donne actuellement le sein"
                      selected={formData.breastfeeding === true}
                      onPress={() => setFormData({ ...formData, breastfeeding: true })}
                      accent="#7ea69d"
                      compact
                    />
                  </View>
                  <View
                    style={[styles.choiceGridItem, isWide && styles.choiceGridItemTwo]}
                  >
                    <ChoiceCard
                      icon={XCircle}
                      title="Non"
                      description="Pas concernÃƒÂ©e"
                      selected={formData.breastfeeding === false}
                      onPress={() => setFormData({ ...formData, breastfeeding: false })}
                      accent="#d9a86c"
                      compact
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.helperCard}>
              <Text style={styles.helperText}>
                Ces informations sont importantes pour ÃƒÂ©viter certains complÃƒÂ©ments contre-indiquÃƒÂ©s.
              </Text>
            </View>
          </SectionFrame>
        )}

                {/* STEP 3 (or 2 for men): ACTIVITY LEVEL */}
        {step === 3 && (
          <SectionFrame
            icon={Activity}
            title="Niveau d'activitÃƒÂ© physique"
            subtitle="Pour ajuster les recommandations selon votre rythme."
            badge="Requis"
          >
            <View style={[styles.choiceGrid, isWide && styles.choiceGridTwo]}>
              {MODERN_ACTIVITY_LEVELS.map((activity) => {
                const meta = getActivityMeta(activity.value);
                const Icon = activity.icon ?? meta.icon ?? Activity;
                return (
                  <View
                    key={activity.value}
                    style={[styles.choiceGridItem, isWide && styles.choiceGridItemTwo]}
                  >
                    <ChoiceCard
                      icon={Icon}
                      title={activity.label}
                      description={activity.description}
                      selected={formData.activityLevel === activity.value}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          activityLevel: activity.value,
                        })
                      }
                      accent={activity.accent ?? meta.accent}
                      trailing={<ActivityScale intensity={meta.intensity ?? 1} />}
                    />
                  </View>
                );
              })}
            </View>
          </SectionFrame>
        )}

                {/* STEP 4 (or 3 for men): GOALS */}
        {step === 4 && (
          <SectionFrame
            icon={Target}
            title="Quels sont vos objectifs ?"
            subtitle="Choisissez un ou plusieurs objectifs pour personnaliser votre parcours."
            badge="Requis"
            countLabel={`${formData.goals.length} sÃƒÂ©lectionnÃƒÂ©${formData.goals.length > 1 ? "s" : ""}`}
          >
            <View style={[styles.choiceGrid, isWide && styles.choiceGridTwo]}>
              {goalOptions.map((goal) => {
                const meta = getGoalMeta(goal.value);
                const Icon = goal.icon ?? meta.icon ?? Target;
                return (
                  <View
                    key={goal.value}
                    style={[styles.choiceGridItem, isWide && styles.choiceGridItemTwo]}
                  >
                    <ChoiceCard
                      icon={Icon}
                      title={goal.label}
                      description={goal.description ?? meta.description}
                      selected={formData.goals.includes(goal.value)}
                      onPress={() => toggleMultiSelection("goals", goal.value)}
                      accent={goal.accent ?? meta.accent}
                    />
                  </View>
                );
              })}
            </View>
          </SectionFrame>
        )}

                {/* STEP 5 (or 4 for men): CONDITIONS - REORGANIZED */}
        {step === 5 && (
          <SectionFrame
            icon={Shield}
            title="PrÃƒÂ©cautions mÃƒÂ©dicales"
            subtitle="Facultatif, mais utile pour ÃƒÂ©viter certaines interactions."
            badge="Optionnel"
            countLabel={`${formData.conditions.length} sÃƒÂ©lectionnÃƒÂ©${formData.conditions.length > 1 ? "s" : ""}`}
          >
            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <Pill size={18} color="#7ea69d" />
                  <Text style={styles.groupTitle}>MÃƒÂ©dicaments</Text>
                </View>
              </View>
              <View style={styles.chipWrap}>
                {MEDICATION_CONDITIONS.map((o) => (
                  <ChipCard
                    key={o.value}
                    label={o.label}
                    selected={formData.conditions.includes(o.value)}
                    onPress={() => toggleMultiSelection("conditions", o.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <Heart size={18} color="#7ea69d" />
                  <Text style={styles.groupTitle}>Conditions de santÃƒÂ©</Text>
                </View>
              </View>
              <View style={styles.chipWrap}>
                {HEALTH_CONDITIONS.map((o) => (
                  <ChipCard
                    key={o.value}
                    label={o.label}
                    selected={formData.conditions.includes(o.value)}
                    onPress={() => toggleMultiSelection("conditions", o.value)}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setFormData({ ...formData, conditions: [] })}
              style={[
                styles.noneButton,
                formData.conditions.length === 0 && styles.noneButtonSelected,
              ]}
              disabled={saving}
              activeOpacity={0.88}
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
                Ces informations aident ÃƒÂ  personnaliser vos recommandations en toute sÃƒÂ©curitÃƒÂ©.
              </Text>
            </View>
          </SectionFrame>
        )}

                {/* STEP 6 (or 5 for men): DISEASES */}
        {step === 6 && (
          <SectionFrame
            icon={Heart}
            title="Pathologies diagnostiquÃƒÂ©es"
            subtitle="Facultatif - vous pouvez laisser vide si besoin."
            badge="Optionnel"
            countLabel={`${formData.diseases.length} sÃƒÂ©lectionnÃƒÂ©e${formData.diseases.length > 1 ? "s" : ""}`}
          >
            <View style={styles.chipWrap}>
              {DISEASES.map((o) => (
                <ChipCard
                  key={o.value}
                  label={o.label}
                  selected={formData.diseases.includes(o.value)}
                  onPress={() => toggleMultiSelection("diseases", o.value)}
                />
              ))}
            </View>

            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <AlertCircle size={18} color="#7ea69d" />
                  <Text style={styles.groupTitle}>Allergies alimentaires</Text>
                </View>
                <Text style={styles.groupCount}>
                  {formData.allergies.includes("none")
                    ? "Aucune"
                    : `${formData.allergies.length} sÃƒÂ©lectionnÃƒÂ©e${formData.allergies.length > 1 ? "s" : ""}`}
                </Text>
              </View>
              <View style={styles.chipWrap}>
                {ALLERGIES.map((o) => (
                  <ChipCard
                    key={o.value}
                    label={o.label}
                    selected={formData.allergies.includes(o.value)}
                    onPress={() =>
                      toggleMultiSelection("allergies", o.value, "none")
                    }
                  />
                ))}
              </View>
            </View>
          </SectionFrame>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomShell}>
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.ctaButton, saving && styles.ctaButtonDisabled]}
              disabled={saving}
              activeOpacity={0.9}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.ctaText}>
                    {isGoalsOnly
                      ? "Enregistrer mes objectifs"
                      : step === totalSteps
                      ? "Valider & accÃƒÂ©der ÃƒÂ  mon espace"
                      : "Continuer"}
                  </Text>
                  {!isGoalsOnly && <ArrowRight size={20} color="white" />}
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.bottomHint}>
            Les champs marquÃƒÂ©s comme requis doivent etre remplis pour continuer.
          </Text>
        </View>
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
  root: {
    flex: 1,
    backgroundColor: "#fef6e2",
  },
  orbOne: {
    position: "absolute",
    right: -80,
    top: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(179, 211, 210, 0.28)",
  },
  orbTwo: {
    position: "absolute",
    left: -50,
    top: 280,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(223, 196, 133, 0.24)",
  },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  backButtonHidden: {
    opacity: 0,
  },
  stepBadge: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7ea69d",
    letterSpacing: 0.4,
  },
  brandChip: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.08)",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  brandLogo: {
    width: 30,
    height: 30,
  },
  compactHeaderCard: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  compactHeaderCardWide: {
    paddingHorizontal: 22,
  },
  compactHeaderCopy: {
    flex: 1,
    gap: 6,
  },
  compactHeaderEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#7ea69d",
    textTransform: "uppercase",
  },
  compactHeaderTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: "#14272d",
  },
  compactHeaderSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6b8b83",
  },
  compactHeaderMeter: {
    minWidth: 88,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#eef3ef",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  compactHeaderMeterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b8b83",
  },
  compactHeaderMeterValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f3f43",
  },
  progressTrackCompact: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(20,39,45,0.08)",
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFillCompact: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#7ea69d",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 20,
    marginBottom: 16,
    minHeight: 180,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  heroCardWide: {
    minHeight: 200,
  },
  heroContent: {
    flex: 1,
    gap: 10,
    paddingRight: 12,
  },
  heroEyebrow: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroEyebrowText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.86)",
  },
  heroBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  heroVisual: {
    width: 128,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  heroOrb: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroLogo: {
    width: 60,
    height: 60,
  },
  heroMiniCard: {
    width: 128,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  heroMiniLabel: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 11,
    fontWeight: "600",
  },
  heroMiniValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  progressCard: {
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#14272d",
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#7ea69d",
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(20,39,45,0.08)",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#7ea69d",
  },
  stageRow: {
    gap: 10,
    paddingRight: 4,
  },
  stageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#f4f7f5",
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.06)",
  },
  stageChipActive: {
    backgroundColor: "#1f3f43",
    borderColor: "#1f3f43",
  },
  stageChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#58786f",
  },
  stageChipTextActive: {
    color: "#ffffff",
  },
  contentStack: {
    gap: 16,
  },
  sectionFrame: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    padding: 18,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  sectionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#eef3ef",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCopy: {
    flex: 1,
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillRequired: {
    backgroundColor: "rgba(217,168,108,0.12)",
    borderColor: "rgba(217,168,108,0.24)",
  },
  pillNeutral: {
    backgroundColor: "rgba(126,166,157,0.12)",
    borderColor: "rgba(126,166,157,0.18)",
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  pillTextRequired: {
    color: "#9d6c3e",
  },
  pillTextNeutral: {
    color: "#58786f",
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6b8b83",
  },
  sectionBody: {
    gap: 16,
  },
  choiceBlock: {
    gap: 10,
  },
  choiceBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  choiceBlockTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14272d",
  },
  choiceBlockHint: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#7ea69d",
  },
  choiceGrid: {
    gap: 12,
  },
  genderSymbolRow: {
    flexDirection: "row",
    gap: 14,
  },
  genderSymbolItem: {
    flex: 1,
  },
  genderSymbolCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: 180,
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  genderSymbolCardSelected: {
    shadowOpacity: 0.09,
    elevation: 5,
  },
  genderSymbolIconWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    backgroundColor: "#f4f8f6",
    alignItems: "center",
    justifyContent: "center",
  },
  genderSymbolLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14272d",
  },
  genderSymbolLabelSelected: {
    color: "#1f3f43",
  },
  choiceGridTwo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  choiceGridItem: {
    width: "100%",
  },
  choiceGridItemTwo: {
    width: "48%",
  },
  choiceCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.94)",
    padding: 16,
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  choiceCardCompact: {
    minHeight: 84,
    paddingVertical: 14,
  },
  choiceCardSelected: {
    shadowOpacity: 0.09,
    elevation: 4,
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#eef3ef",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceCopyWrap: {
    flex: 1,
    gap: 4,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14272d",
  },
  choiceTitleCompact: {
    fontSize: 15,
  },
  choiceDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b8b83",
  },
  choiceDescriptionCompact: {
    fontSize: 11,
  },
  choiceTrailing: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  choiceCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricRow: {
    gap: 12,
  },
  metricRowWide: {
    flexDirection: "row",
  },
  metricItem: {
    flex: 1,
  },
  metricItemWide: {
    flexBasis: "48%",
    maxWidth: "48%",
  },
  fieldCard: {
    gap: 8,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#14272d",
  },
  requiredTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(217,168,108,0.14)",
  },
  requiredTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#9d6c3e",
  },
  fieldShell: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.08)",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
  },
  fieldShellFocused: {
    borderColor: "#7ea69d",
    backgroundColor: "rgba(247,250,248,0.96)",
  },
  birthdateTrigger: {
    minHeight: 72,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.08)",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  birthdateTriggerActive: {
    borderColor: "#7ea69d",
    backgroundColor: "rgba(247,250,248,0.98)",
  },
  birthdateTriggerCopy: {
    flex: 1,
    gap: 4,
  },
  birthdateTriggerValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#14272d",
  },
  birthdateTriggerHint: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b8b83",
  },
  birthdateChevron: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#eef3ef",
    alignItems: "center",
    justifyContent: "center",
  },
  birthdateChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  fieldIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#eef3ef",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: "#14272d",
    paddingVertical: 12,
  },
  unitTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#eef3ef",
  },
  unitTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#58786f",
  },
  birthdatePickerShell: {
    gap: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(126,166,157,0.2)",
    backgroundColor: "rgba(244,248,246,0.98)",
    padding: 16,
  },
  birthdatePickerHeader: {
    gap: 4,
  },
  birthdatePickerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14272d",
  },
  birthdatePickerHint: {
    fontSize: 12,
    color: "#6b8b83",
  },
  birthdateWheelRow: {
    flexDirection: "row",
    gap: 10,
  },
  birthdateWheelColumn: {
    flex: 1,
    gap: 8,
  },
  birthdateWheelColumnNarrow: {
    width: 84,
    gap: 8,
  },
  birthdateWheelLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#7ea69d",
    textTransform: "uppercase",
    textAlign: "center",
  },
  birthdateWheelScroll: {
    maxHeight: 220,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    paddingVertical: 6,
  },
  birthdateWheelItem: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginHorizontal: 8,
    marginVertical: 3,
  },
  birthdateWheelItemSelected: {
    backgroundColor: "#eef3ef",
  },
  birthdateWheelText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#7f8e88",
  },
  birthdateWheelTextSelected: {
    fontSize: 22,
    fontWeight: "800",
    color: "#14272d",
  },
  questionStack: {
    gap: 12,
  },
  questionCard: {
    gap: 10,
    padding: 2,
  },
  activityScale: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  activityBar: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(20,39,45,0.14)",
  },
  activityBarActive: {
    backgroundColor: "#7ea69d",
  },
  groupCard: {
    gap: 10,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(247,250,248,0.96)",
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.06)",
  },
  groupHeader: {
    gap: 8,
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14272d",
  },
  groupCount: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7ea69d",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chipCard: {
    position: "relative",
    overflow: "hidden",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
    minHeight: 40,
  },
  chipCardSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#14272d",
  },
  chipTextSelected: {
    color: "#14272d",
    fontWeight: "700",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  bottomShell: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaWrap: {
    borderRadius: 20,
    overflow: "hidden",
  },
  ctaButton: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaButtonDisabled: {
    opacity: 0.72,
  },
  ctaText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  bottomHint: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    color: "#6b8b83",
  },
});









