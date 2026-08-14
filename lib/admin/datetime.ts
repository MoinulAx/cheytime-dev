/**
 * Timezone plumbing for the event date field.
 *
 * `datetime-local` inputs have no timezone: they hand back the wall-clock time
 * the admin typed. The public site renders event times in New York, so the
 * admin has to enter them in New York too, otherwise a show booked from a
 * laptop in another timezone silently lands hours off.
 */

export const SITE_TIME_ZONE = "America/New_York";

/** Milliseconds that `timeZone` is ahead of UTC at the given instant. */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUTC - at.getTime();
}

/** ISO instant → `YYYY-MM-DDTHH:mm` as read on a clock in {@link SITE_TIME_ZONE}. */
export function toInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  // en-CA gives 24-hour time, but midnight can come back as "24".
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** `YYYY-MM-DDTHH:mm` typed in {@link SITE_TIME_ZONE} → ISO instant. */
export function fromInputValue(value: string): string | null {
  if (!value) return null;
  const naive = new Date(`${value}:00Z`);
  if (Number.isNaN(naive.getTime())) return null;
  // Treat the typed time as UTC, then slide it back by the zone's offset.
  const offset = zoneOffsetMs(naive, SITE_TIME_ZONE);
  return new Date(naive.getTime() - offset).toISOString();
}
