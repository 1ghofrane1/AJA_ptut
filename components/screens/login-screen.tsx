import { useAuth } from "@/context/auth";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
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

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const { loginWithEmail } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => onNavigate("welcome")}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#14272d" />
          </TouchableOpacity>
          <Image
            source={require("@/assets/images/logo aja 1.png")}
            style={styles.logo}
          />
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          <View style={styles.formContainer}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Bon retour</Text>
              <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
            </View>

            {/* Email input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#7ea69d" style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor="rgba(126, 166, 157, 0.5)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Password input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#7ea69d" style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(126, 166, 157, 0.5)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, styles.inputWithRightIcon]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#7ea69d" />
                  ) : (
                    <Eye size={20} color="#7ea69d" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <View style={styles.forgotPassword}>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google login */}
            <TouchableOpacity style={styles.googleButton}>
              <View style={styles.googleIcon}>
                <View style={styles.googleIconBlue} />
                <View style={styles.googleIconGreen} />
                <View style={styles.googleIconYellow} />
                <View style={styles.googleIconRed} />
              </View>
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>
              Pas encore de compte ?{" "}
              <Text
                onPress={() => onNavigate("signup")}
                style={styles.signupLink}
              >
                S'inscrire
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 24,
  },
  backButton: {
    padding: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    maxWidth: 448,
    width: "100%",
    alignSelf: "center",
  },
  formContainer: {
    gap: 24,
  },
  titleSection: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    color: "#14272d",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    color: "#7ea69d",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: "#14272d",
    fontSize: 14,
  },
  inputWrapper: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 48,
    paddingRight: 16,
    color: "#14272d",
    fontSize: 14,
  },
  inputWithRightIcon: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  forgotPassword: {
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    color: "#7ea69d",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#14272d",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(20, 39, 45, 0.1)",
  },
  dividerText: {
    color: "#7ea69d",
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(20, 39, 45, 0.2)",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
    position: "relative",
  },
  googleIconBlue: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#4285F4",
  },
  googleIconGreen: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#34A853",
  },
  googleIconYellow: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#FBBC05",
  },
  googleIconRed: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#EA4335",
  },
  googleButtonText: {
    color: "#14272d",
    fontSize: 16,
  },
  signupSection: {
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 32,
  },
  signupText: {
    color: "#7ea69d",
    fontSize: 14,
  },
  signupLink: {
    color: "#14272d",
    textDecorationLine: "underline",
  },
});
