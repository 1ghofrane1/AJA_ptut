export type PasswordPolicyCheck = {
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_POLICY: PasswordPolicyCheck[] = [
  {
    label: "Au moins 8 caracteres",
    test: (password) => password.length >= 8,
  },
  {
    label: "Une lettre majuscule",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Une lettre minuscule",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "Un chiffre",
    test: (password) => /\d/.test(password),
  },
];

export function evaluatePasswordPolicy(password: string) {
  return PASSWORD_POLICY.map((rule) => ({
    label: rule.label,
    passed: rule.test(password),
  }));
}

export function isPasswordCompliant(password: string) {
  return PASSWORD_POLICY.every((rule) => rule.test(password));
}
