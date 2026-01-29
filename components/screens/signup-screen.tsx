import { ArrowLeft, Lock, Mail, Shield } from "lucide-react-native";
import { useState } from "react";
import {
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

export function SignupScreen({ onNavigate }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSignup = () => {
    // Navigate to onboarding
    onNavigate("onboarding");
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
              <Text style={styles.title}>Créer votre compte</Text>
              <Text style={styles.subtitle}>
                Commencez votre parcours santé personnalisé
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#7ea69d" style={styles.inputIcon} />
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    placeholder="votre@email.com"
                    placeholderTextColor="rgba(126, 166, 157, 0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#7ea69d" style={styles.inputIcon} />
                  <TextInput
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    placeholder="••••••••"
                    placeholderTextColor="rgba(126, 166, 157, 0.5)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
                <Text style={styles.helpText}>Minimum 8 caractères</Text>
              </View>
            </View>

            {/* Privacy reassurance */}
            <View style={styles.privacyCard}>
              <Shield size={20} color="#7ea69d" style={styles.shieldIcon} />
              <Text style={styles.privacyText}>
                Vos données sont sécurisées et utilisées uniquement pour
                personnaliser vos recommandations de santé.
              </Text>
            </View>

            {/* Sign up button */}
            <TouchableOpacity
              onPress={handleSignup}
              style={styles.signupButton}
            >
              <Text style={styles.signupButtonText}>S'inscrire</Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              En créant un compte, vous acceptez nos{" "}
              <Text style={styles.termsLink}>Conditions d'utilisation</Text> et
              notre{" "}
              <Text style={styles.termsLink}>Politique de confidentialité</Text>
            </Text>
          </View>

          {/* Login link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>
              Déjà un compte ?{" "}
              <Text
                onPress={() => onNavigate("login")}
                style={styles.loginLink}
              >
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
    paddingTop: 16,
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
  form: {
    gap: 16,
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
  helpText: {
    fontSize: 12,
    color: "#7ea69d",
  },
  privacyCard: {
    backgroundColor: "#e7ede7",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  shieldIcon: {
    marginTop: 2,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: "#14272d",
  },
  signupButton: {
    backgroundColor: "#14272d",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  signupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    color: "#7ea69d",
  },
  termsLink: {
    color: "#14272d",
    textDecorationLine: "underline",
  },
  loginSection: {
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 32,
  },
  loginText: {
    color: "#7ea69d",
    fontSize: 14,
  },
  loginLink: {
    color: "#14272d",
    textDecorationLine: "underline",
  },
});
