import { Globe } from "lucide-react-native";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface WelcomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* Subtle abstract background shapes */}
      <View style={styles.backgroundShapes}>
        <View style={styles.shape1} />
        <View style={styles.shape2} />
        <View style={styles.shape3} />
      </View>

      {/* Language selector */}
      <View style={styles.languageSelector}>
        <TouchableOpacity style={styles.languageButton}>
          <Globe size={16} color="#14272d" />
          <Text style={styles.languageText}>FR</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo aja.png')} 
            style={styles.logo}
          />
        </View>

        {/* Slogan */}
        <View style={styles.sloganContainer}>
          <Text style={styles.title}>
            Votre santé, votre solution personnalisée
          </Text>
          <Text style={styles.description}>
            Découvrez des recommandations de compléments alimentaires adaptées à votre profil et vos objectifs de santé.
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            onPress={() => onNavigate("login")}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onNavigate("signup")}
            style={styles.signupButton}
          >
            <Text style={styles.signupButtonText}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer text */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Application développée dans un cadre scientifique
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef6e2',
    padding: 24,
    position: 'relative',
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    top: 80,
    right: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(179, 211, 210, 0.2)',
  },
  shape2: {
    position: 'absolute',
    bottom: 160,
    left: 40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(223, 196, 133, 0.1)',
  },
  shape3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -160,
    marginLeft: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(231, 237, 231, 0.3)',
  },
  languageSelector: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.1)',
  },
  languageText: {
    fontSize: 14,
    color: '#14272d',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    zIndex: 10,
    maxWidth: 384,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 128,
    height: 128,
  },
  sloganContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    color: '#14272d',
    textAlign: 'center',
    fontWeight: '700',
  },
  description: {
    fontSize: 16,
    color: '#7ea69d',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaContainer: {
    width: '100%',
    gap: 12,
    marginTop: 32,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#14272d',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    width: '100%',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.2)',
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    zIndex: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#7ea69d',
    textAlign: 'center',
  },
});