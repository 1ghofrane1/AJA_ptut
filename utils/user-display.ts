import type { UserResponse } from "@/services/api";

function firstWord(value: string) {
  return value.trim().split(/\s+/, 1)[0] ?? "";
}

export function getUserFirstName(user: UserResponse | null | undefined) {
  const profile =
    typeof user?.profile === "object" && user.profile !== null
      ? (user.profile as Record<string, unknown>)
      : null;
  const personal =
    profile && typeof profile.personal === "object" && profile.personal !== null
      ? (profile.personal as Record<string, unknown>)
      : null;

  const candidates = [
    personal?.first_name,
    profile?.first_name,
    personal?.name,
    profile?.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const value = firstWord(candidate);
    if (value) return value;
  }

  return "vous";
}
