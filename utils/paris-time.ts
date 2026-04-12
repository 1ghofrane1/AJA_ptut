export const APP_TIME_ZONE = "Europe/Paris";

function getSafeDate(value?: string | Date) {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function getParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const byType = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: byType.get("year") ?? "1970",
    month: byType.get("month") ?? "01",
    day: byType.get("day") ?? "01",
    hour: byType.get("hour") ?? "00",
    minute: byType.get("minute") ?? "00",
    second: byType.get("second") ?? "00",
  };
}

function getParisOffset(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    timeZoneName: "shortOffset",
  });

  const rawOffset =
    formatter
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")
      ?.value.replace("GMT", "") ?? "+00";

  const normalized = rawOffset.includes(":")
    ? rawOffset
    : `${rawOffset}:00`;

  return normalized.startsWith("+") || normalized.startsWith("-")
    ? normalized
    : `+${normalized}`;
}

export function formatParisYmd(date = new Date()) {
  const parts = getParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getCurrentParisTimestamp() {
  const now = new Date();
  const parts = getParts(now);
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}${getParisOffset(now)}`;
}

export function formatParisTime(value: string | Date) {
  const date = getSafeDate(value);
  if (!date) return typeof value === "string" ? value : "";

  return date.toLocaleTimeString("fr-FR", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatParisDateTime(value: string | Date) {
  const date = getSafeDate(value);
  if (!date) return typeof value === "string" ? value : "";

  return date.toLocaleString("fr-FR", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
