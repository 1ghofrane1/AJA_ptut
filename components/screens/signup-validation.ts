import { isPasswordCompliant } from "@/components/screens/password-policy";

export type SignupAlert = {
  title: string;
  message: string;
};

export type SignupEmailValidation = {
  valid: boolean;
  normalized: string;
  suggestion?: string;
};

const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const COMMON_EMAIL_DOMAIN_FIXES: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.fr": "gmail.com",
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gnail.com": "gmail.com",
  "googlemail.fr": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "icloud.fr": "icloud.com",
  "icloud,com": "icloud.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.fr": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahho.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
};

function getResponseDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return { status: undefined, detail: "", message: "", reason: "", suggestion: "" };
  }

  const response = "response" in error ? (error as any).response : undefined;
  const status =
    typeof response?.status === "number" ? response.status : undefined;
  const detail =
    typeof response?.data?.detail === "string" ? response.data.detail : "";
  const reason =
    typeof response?.data?.reason === "string" ? response.data.reason : "";
  const suggestion =
    typeof response?.data?.suggestion === "string"
      ? response.data.suggestion
      : "";
  const message =
    typeof (error as any).message === "string" ? (error as any).message : "";

  return { status, detail, message, reason, suggestion };
}

export function normalizeSignupEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateSignupEmail(email: string): SignupEmailValidation {
  const normalized = normalizeSignupEmail(email);

  if (!normalized) {
    return { valid: false, normalized };
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, normalized };
  }

  const [localPart, domain] = normalized.split("@");

  if (
    !localPart ||
    !domain ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    domain.startsWith(".") ||
    domain.endsWith(".") ||
    domain.includes("..")
  ) {
    return { valid: false, normalized };
  }

  const suggestedDomain = COMMON_EMAIL_DOMAIN_FIXES[domain];
  if (suggestedDomain) {
    return {
      valid: false,
      normalized,
      suggestion: `${localPart}@${suggestedDomain}`,
    };
  }

  return { valid: true, normalized };
}

export function isSignupEmailValid(email: string) {
  return validateSignupEmail(email).valid;
}

export function getSignupValidationIssue(
  email: string,
  password: string,
): SignupAlert | null {
  const emailValidation = validateSignupEmail(email);

  if (!emailValidation.normalized) {
    return {
      title: "Email requis",
      message: "Veuillez saisir votre adresse email.",
    };
  }

  if (!emailValidation.valid) {
    if (emailValidation.suggestion) {
      return {
        title: "Email a verifier",
        message: `Cette adresse semble incorrecte. Essayez plutot ${emailValidation.suggestion}.`,
      };
    }

    return {
      title: "Email invalide",
      message: "Veuillez saisir une adresse email valide.",
    };
  }

  if (!password.trim()) {
    return {
      title: "Mot de passe requis",
      message: "Veuillez saisir un mot de passe.",
    };
  }

  if (!isPasswordCompliant(password)) {
    return {
      title: "Mot de passe non conforme",
      message:
        "Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule et un chiffre.",
    };
  }

  return null;
}

export function getSignupErrorAlert(error: unknown): SignupAlert {
  const { status, detail, message, reason, suggestion } = getResponseDetails(error);
  const normalized = `${detail} ${message} ${reason}`.toLowerCase();

  if (
    status === 409 ||
    normalized.includes("already exists") ||
    normalized.includes("user already exists")
  ) {
    return {
      title: "Email deja utilise",
      message: "Cette adresse email est deja associee a un compte.",
    };
  }

  if (reason === "typo_domain" && suggestion) {
    return {
      title: "Email a verifier",
      message: `Cette adresse semble incorrecte. Essayez plutot ${suggestion}.`,
    };
  }

  if (
    reason === "invalid_email" ||
    normalized.includes("invalid email") ||
    normalized.includes("email invalide")
  ) {
    return {
      title: "Email invalide",
      message: "Veuillez saisir une adresse email valide.",
    };
  }

  if (
    normalized.includes("required") ||
    normalized.includes("missing") ||
    normalized.includes("champs")
  ) {
    return {
      title: "Champs manquants",
      message: "Veuillez remplir tous les champs requis.",
    };
  }

  if (
    normalized.includes("network error") ||
    normalized.includes("failed to fetch")
  ) {
    return {
      title: "Reseau indisponible",
      message: "Verifiez votre connexion puis reessayez.",
    };
  }

  return {
    title: "Inscription impossible",
    message: detail || message || "Erreur d'inscription",
  };
}
