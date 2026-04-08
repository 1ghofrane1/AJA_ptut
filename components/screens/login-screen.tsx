import { useAuth } from "@/context/auth";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface LoginScreenProps {
  onNavigate: (screen: string) => void;
}

type Field = "email" | "password";

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const { loginWithEmail } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<Field | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canHighlight = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    try {
      setLoading(true);
      await loginWithEmail(email.trim(), password);
      onNavigate("dashboard");
    } catch (e: any) {
      Alert.alert(
        "Connexion impossible",
        e?.response?.data?.detail ?? "Erreur de connexion",
      );
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
            <Text style={styles.title}>Bon retour</Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour retrouver votre espace et vos recommandations personnalisees.
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
                  value={email}
                  onChangeText={setEmail}
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
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="********"
                  placeholderTextColor="rgba(126,166,157,0.58)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    void handleLogin();
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
            </View>

            <View style={styles.forgotPasswordRow}>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={styles.forgotPasswordText}>
                  Mot de passe oublie ?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => void handleLogin()}
              disabled={loading}
              activeOpacity={0.9}
              style={[
                styles.loginButtonWrap,
                loading && styles.loginButtonWrapDisabled,
              ]}
            >
              <LinearGradient
                colors={canHighlight ? ["#1e3a3f", "#2f675c"] : ["#95aca6", "#95aca6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <View style={styles.loginButtonContent}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.loginButtonText}>Connexion...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} activeOpacity={0.88}>
              <View style={styles.googleIconWrap}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signupSection}>
            <Text style={styles.signupText}>
              Pas encore de compte ?{" "}
              <Text
                onPress={() => onNavigate("signup")}
                style={styles.signupLink}
              >
                S&apos;inscrire
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
  forgotPasswordRow: {
    alignItems: "flex-end",
    marginTop: 2,
    marginBottom: 4,
  },
  forgotPasswordText: {
    color: "#7ea69d",
    fontSize: 13,
    fontWeight: "600",
  },
  loginButtonWrap: {
    marginTop: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  loginButtonWrapDisabled: {
    opacity: 0.62,
  },
  loginButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  loginButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(20,39,45,0.1)",
  },
  dividerText: {
    color: "#7ea69d",
    fontSize: 13,
    fontWeight: "600",
  },
  googleButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.12)",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(20,39,45,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: {
    color: "#4285F4",
    fontSize: 15,
    fontWeight: "700",
  },
  googleButtonText: {
    color: "#14272d",
    fontSize: 15,
    fontWeight: "600",
  },
  signupSection: {
    alignItems: "center",
    marginTop: 26,
    paddingBottom: 32,
  },
  signupText: {
    color: "#7ea69d",
    fontSize: 15,
  },
  signupLink: {
    color: "#14272d",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
