import {
  getSignupErrorAlert,
  getSignupValidationIssue,
  normalizeSignupEmail,
  validateSignupEmail,
} from "@/components/screens/signup-validation";
import { useAuth } from "@/context/auth";
import { evaluatePasswordPolicy, isPasswordCompliant } from "@/components/screens/password-policy";
import { checkSignupEmailAvailability } from "@/services/api";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SignupScreenProps {
  onNavigate: (screen: string) => void;
}

type Field = "email" | "password";
type EmailAvailabilityState = "idle" | "checking" | "available" | "taken";

export function SignupScreen({ onNavigate }: SignupScreenProps) {
  const { signupWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<Field | null>(null);
  const [emailAvailability, setEmailAvailability] =
    useState<EmailAvailabilityState>("idle");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const emailCheckRequestId = useRef(0);
  const passwordHintOpacity = useRef(new Animated.Value(1)).current;
  const passwordHintShift = useRef(new Animated.Value(0)).current;

  const emailValidation = validateSignupEmail(formData.email);
  const normalizedEmail = normalizeSignupEmail(formData.email);
  const passwordChecks = evaluatePasswordPolicy(formData.password);
  const passedRules = passwordChecks.filter((rule) => rule.passed).length;
  const pendingPasswordRule = passwordChecks.find((rule) => !rule.passed);

  const passwordOk = isPasswordCompliant(formData.password);
  const emailOk = emailValidation.valid && emailAvailability !== "taken";
  const canSubmit = emailOk && passwordOk && emailAvailability !== "checking";

  const strength = useMemo(() => {
    if (passedRules <= 1) {
      return { label: "Faible", color: "#d45d5d" };
    }

    if (passedRules <= 3) {
      return { label: "Moyen", color: "#d9a86c" };
    }

    return { label: "Fort", color: "#7ea69d" };
  }, [passedRules]);

  const emailFeedback = useMemo(() => {
    if (!normalizedEmail) return null;

    if (!emailValidation.valid) {
      if (emailValidation.suggestion) {
        return {
          tone: "error" as const,
          message: `Adresse a verifier : ${emailValidation.suggestion}`,
        };
      }

      return {
        tone: "error" as const,
        message: "Adresse email invalide",
      };
    }

    if (emailAvailability === "checking") {
      return {
        tone: "neutral" as const,
        message: "Verification de l'adresse...",
      };
    }

    if (emailAvailability === "taken") {
      return {
        tone: "error" as const,
        message: "Cette adresse est deja utilisee.",
      };
    }

    if (emailAvailability === "available") {
      return {
        tone: "success" as const,
        message: "Adresse disponible.",
      };
    }

    return null;
  }, [emailAvailability, emailValidation, normalizedEmail]);

  const passwordHint = useMemo(() => {
    if (!formData.password.length) {
      return {
        key: "empty",
        message: "Commencez par 8 caracteres minimum",
        complete: false,
        color: "#6b8b83",
      };
    }

    if (pendingPasswordRule) {
      return {
        key: pendingPasswordRule.label,
        message: `Etape suivante : ${pendingPasswordRule.label}`,
        complete: false,
        color: passedRules > 0 ? "#d9a86c" : "#6b8b83",
      };
    }

    return {
      key: "complete",
      message: "Mot de passe conforme",
      complete: true,
      color: "#7ea69d",
    };
  }, [formData.password.length, passedRules, pendingPasswordRule]);

  useEffect(() => {
    if (!normalizedEmail || !emailValidation.valid) {
      setEmailAvailability("idle");
      emailCheckRequestId.current += 1;
      return;
    }

    const requestId = emailCheckRequestId.current + 1;
    emailCheckRequestId.current = requestId;
    setEmailAvailability("checking");

    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          const availability = await checkSignupEmailAvailability(normalizedEmail);
          if (emailCheckRequestId.current !== requestId) return;
          setEmailAvailability(availability.available ? "available" : "taken");
        } catch {
          if (emailCheckRequestId.current !== requestId) return;
          setEmailAvailability("idle");
        }
      })();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [emailValidation.valid, normalizedEmail]);

  useEffect(() => {
    passwordHintOpacity.setValue(0);
    passwordHintShift.setValue(8);

    Animated.parallel([
      Animated.timing(passwordHintOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(passwordHintShift, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [passwordHint.key, passwordHintOpacity, passwordHintShift]);

  const handleSignup = async () => {
    const validationIssue = getSignupValidationIssue(
      formData.email,
      formData.password,
    );

    if (validationIssue) {
      Alert.alert(validationIssue.title, validationIssue.message);
      return;
    }

    if (emailAvailability === "checking") {
      Alert.alert(
        "Verification en cours",
        "Patientez un instant pendant la verification de votre adresse email.",
      );
      return;
    }

    try {
      setLoading(true);

      const availability = await checkSignupEmailAvailability(normalizedEmail);
      if (!availability.available) {
        setEmailAvailability(
          availability.reason === "already_exists" ? "taken" : "idle",
        );
        const signupError = getSignupErrorAlert({
          response: {
            status: availability.reason === "already_exists" ? 409 : 400,
            data: {
              detail:
                availability.reason === "already_exists"
                  ? "User already exists"
                  : "Invalid email address",
              reason: availability.reason,
              suggestion: availability.suggestion,
            },
          },
        });
        Alert.alert(signupError.title, signupError.message);
        return;
      }

      await signupWithEmail(normalizedEmail, formData.password);
      onNavigate("onboarding");
    } catch (error) {
      const signupError = getSignupErrorAlert(error);
      if (signupError.title === "Email deja utilise") {
        setEmailAvailability("taken");
      }
      Alert.alert(signupError.title, signupError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.bgLayer}>
          <LinearGradient
            colors={["#fff8ea", "#f7efe0", "#f2f9f4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.blobOne} />
          <View style={styles.blobTwo} />
          <View style={styles.blobThree} />
        </View>

        <View style={styles.mainWrapper}>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => onNavigate("welcome")}
              style={styles.backButton}
              activeOpacity={0.85}
            >
              <ArrowLeft size={22} color="#14272d" />
            </TouchableOpacity>

            <View style={styles.logoChip}>
              <Image
                source={require("@/assets/images/logo aja 1.png")}
                style={styles.logo}
              />
            </View>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.title}>Créer votre compte</Text>
            <Text style={styles.subtitle}>
              Une interface simple, un plan clair, des recommandations adaptees a vous.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputShell,
                  focusedField === "email" && styles.inputShellFocused,
                ]}
              >
                <View style={styles.iconPill}>
                  <Mail size={18} color="#7ea69d" />
                </View>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="votre@email.com"
                  placeholderTextColor="rgba(126,166,157,0.58)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  style={styles.inputText}
                />
              </View>

              {emailFeedback ? (
                <View style={styles.fieldFeedback}>
                  {emailFeedback.tone === "neutral" ? (
                    <ActivityIndicator size="small" color="#7ea69d" />
                  ) : (
                    <View
                      style={[
                        styles.fieldFeedbackDot,
                        emailFeedback.tone === "success"
                          ? styles.fieldFeedbackDotSuccess
                          : styles.fieldFeedbackDotError,
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.fieldFeedbackText,
                      emailFeedback.tone === "success"
                        ? styles.fieldFeedbackTextSuccess
                        : emailFeedback.tone === "neutral"
                        ? styles.fieldFeedbackTextNeutral
                        : styles.fieldFeedbackTextError,
                    ]}
                  >
                    {emailFeedback.message}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View
                style={[
                  styles.inputShell,
                  focusedField === "password" && styles.inputShellFocused,
                ]}
              >
                <View style={styles.iconPill}>
                  <Lock size={18} color="#7ea69d" />
                </View>
                <TextInput
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="********"
                  placeholderTextColor="rgba(126,166,157,0.58)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    void handleSignup();
                  }}
                  style={styles.inputText}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  activeOpacity={0.82}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#7ea69d" />
                  ) : (
                    <Eye size={18} color="#7ea69d" />
                  )}
                </TouchableOpacity>
              </View>

              {(formData.password.length > 0 || focusedField === "password") && (
                <View style={styles.passwordInsightCard}>
                  <View style={styles.passwordMeterRow}>
                    <View style={styles.passwordStrengthBars}>
                      {[0, 1, 2, 3].map((index) => (
                        <View
                          key={index}
                          style={[
                            styles.passwordStrengthSegment,
                            index < passedRules
                              ? { backgroundColor: strength.color }
                              : styles.passwordStrengthSegmentMuted,
                          ]}
                        />
                      ))}
                    </View>
                    <View
                      style={[
                        styles.passwordStrengthChip,
                        { backgroundColor: `${strength.color}18` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.passwordStrengthChipText,
                          { color: strength.color },
                        ]}
                      >
                        {strength.label}
                      </Text>
                    </View>
                  </View>

                  <Animated.View
                    style={[
                      styles.passwordHintPill,
                      passwordHint.complete
                        ? styles.passwordHintPillSuccess
                        : styles.passwordHintPillNeutral,
                      {
                        opacity: passwordHintOpacity,
                        transform: [{ translateY: passwordHintShift }],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.passwordHintIcon,
                        passwordHint.complete
                          ? styles.passwordHintIconSuccess
                          : styles.passwordHintIconNeutral,
                      ]}
                    >
                      {passwordHint.complete ? (
                        <CheckCircle2 size={12} color="#ffffff" />
                      ) : (
                        <Shield size={12} color={passwordHint.color} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.passwordHintText,
                        { color: passwordHint.color },
                      ]}
                    >
                      {passwordHint.message}
                    </Text>
                  </Animated.View>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => void handleSignup()}
              disabled={loading}
              activeOpacity={0.9}
              style={[
                styles.signupButtonWrap,
                loading && styles.signupButtonWrapDisabled,
              ]}
            >
              <LinearGradient
                colors={canSubmit ? ["#1e3a3f", "#2f675c"] : ["#95aca6", "#95aca6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupButtonGradient}
              >
                {loading ? (
                  <View style={styles.signupButtonContent}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.signupButtonText}>Inscription...</Text>
                  </View>
                ) : (
                  <Text style={styles.signupButtonText}>S&apos;inscrire</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.privacyCard}>
              <Shield size={18} color="#7ea69d" style={{ marginTop: 2 }} />
              <Text style={styles.privacyText}>
                Vos donnees restent privees et servent uniquement a personnaliser vos recommandations.
              </Text>
            </View>

            <Text style={styles.termsText}>
              En creant un compte, vous acceptez nos{" "}
              <Text style={styles.termsLink}>Conditions d utilisation</Text> et
              notre{" "}
              <Text style={styles.termsLink}>Politique de confidentialite</Text>
            </Text>
          </View>
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>
              Deja un compte ?{" "}
              <Text onPress={() => onNavigate("login")} style={styles.loginLink}>
                Se connecter
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef6e2",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  blobOne: {
    position: "absolute",
    right: -64,
    top: -64,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: "rgba(179,211,210,0.35)",
  },
  blobTwo: {
    position: "absolute",
    left: -48,
    top: 240,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: "rgba(223,196,133,0.28)",
  },
  blobThree: {
    position: "absolute",
    right: 24,
    bottom: 64,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(231,237,231,0.82)",
  },
  mainWrapper: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.1)",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoChip: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.1)",
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 30,
    height: 30,
  },
  heroCopy: {
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    color: "#14272d",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "#7ea69d",
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14272d",
  },
  inputShell: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.12)",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 54,
  },
  inputShellFocused: {
    borderColor: "#14272d",
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#e7ede7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: "#14272d",
    paddingVertical: 12,
  },
  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#e7ede7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  fieldFeedback: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 18,
  },
  fieldFeedbackDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  fieldFeedbackDotError: {
    backgroundColor: "#d45d5d",
  },
  fieldFeedbackDotSuccess: {
    backgroundColor: "#7ea69d",
  },
  fieldFeedbackText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  fieldFeedbackTextError: {
    color: "#d45d5d",
  },
  fieldFeedbackTextSuccess: {
    color: "#5e8f7a",
  },
  fieldFeedbackTextNeutral: {
    color: "#6b8b83",
  },
  passwordInsightCard: {
    marginTop: 10,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(247,250,248,0.92)",
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.06)",
    gap: 10,
  },
  passwordMeterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  passwordStrengthBars: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  passwordStrengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  passwordStrengthSegmentMuted: {
    backgroundColor: "rgba(20,39,45,0.1)",
  },
  passwordStrengthChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  passwordStrengthChipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  passwordHintPill: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passwordHintPillSuccess: {
    backgroundColor: "rgba(126,166,157,0.12)",
  },
  passwordHintPillNeutral: {
    backgroundColor: "rgba(217,168,108,0.12)",
  },
  passwordHintIcon: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordHintIconSuccess: {
    backgroundColor: "#7ea69d",
  },
  passwordHintIconNeutral: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  passwordHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  signupButtonWrap: {
    marginTop: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  signupButtonWrapDisabled: {
    opacity: 0.62,
  },
  signupButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  signupButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  privacyCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(126,166,157,0.2)",
    backgroundColor: "rgba(231,237,231,0.7)",
    padding: 12,
    flexDirection: "row",
  },
  privacyText: {
    marginLeft: 8,
    flex: 1,
    color: "#14272d",
    fontSize: 13,
    lineHeight: 20,
  },
  termsText: {
    marginTop: 12,
    textAlign: "center",
    color: "#7ea69d",
    fontSize: 12,
    lineHeight: 19,
  },
  termsLink: {
    color: "#14272d",
    fontWeight: "600",
  },
  loginSection: {
    marginTop: 26,
    alignItems: "center",
  },
  loginText: {
    color: "#7ea69d",
    fontSize: 15,
  },
  loginLink: {
    color: "#14272d",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});


