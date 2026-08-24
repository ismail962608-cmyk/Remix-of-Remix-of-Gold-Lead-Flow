const MIN = 60_000;

export function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function inrShort(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function relative(ts: number | null, now: number) {
  if (ts == null) return "—";
  const diff = ts - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / MIN);
  let text: string;
  if (mins < 1) text = "just now";
  else if (mins < 60) text = `${mins}m`;
  else if (mins < 60 * 24) text = `${Math.round(mins / 60)}h`;
  else text = `${Math.round(mins / (60 * 24))}d`;
  if (mins < 1) return text;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

export function ageBucket(createdAt: number, now: number) {
  const h = (now - createdAt) / (60 * MIN);
  if (h < 1) return "< 1 hour";
  if (h < 4) return "1–4 hours";
  if (h < 24) return "4–24 hours";
  if (h < 72) return "1–3 days";
  if (h < 168) return "3–7 days";
  return "7+ days";
}

export const AGE_BUCKETS = ["< 1 hour", "1–4 hours", "4–24 hours", "1–3 days", "3–7 days", "7+ days"];

export function toLocalInput(ts: number) {
  const d = new Date(ts - new Date().getTimezoneOffset() * MIN);
  return d.toISOString().slice(0, 16);
}
