export const BUSINESS_TIME_ZONE = "Europe/Madrid";

const businessDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function businessToday(now: Date = new Date()): string {
  const parts = businessDayFormatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isFutureBusinessDate(isoDate: string, now: Date = new Date()): boolean {
  return isoDate.slice(0, 10) > businessToday(now);
}
