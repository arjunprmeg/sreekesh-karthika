import { weddingConfig } from "./config"

const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/[,;]/g, "\\$&")

export function buildCalendar(type: "wedding" | "reception", now = new Date()) {
  const event = weddingConfig[type]
  const title = `${type === "wedding" ? "Wedding" : "Wedding Reception"} of ${weddingConfig.couple.english}`
  // Configured +05:30 event times are serialized as UTC for calendar compatibility.
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${weddingConfig.couple.english}//Wedding Invitation//EN`, "CALSCALE:GREGORIAN",
    // Preserve existing event IDs so name corrections do not duplicate saved events.
    "BEGIN:VEVENT", `UID:${type}-sreekesh-karthika-2027`, `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(new Date(event.start))}`, `DTEND:${formatDate(new Date(event.end))}`,
    `SUMMARY:${escapeText(title)}`, `LOCATION:${escapeText(event.venue)}`,
    `DESCRIPTION:${escapeText(`With love, we invite you to celebrate with us. Directions: ${event.maps}`)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n")
}
