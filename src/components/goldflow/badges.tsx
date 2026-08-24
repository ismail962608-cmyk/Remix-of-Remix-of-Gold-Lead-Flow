import { cn } from "@/lib/utils";
import type { Stage, Temperature } from "@/lib/goldflow/types";
import type { SlaState } from "@/lib/goldflow/store";

export function Pill({
  children,
  className,
  tone = "muted",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "muted" | "hot" | "warm" | "cold" | "success" | "danger" | "warning" | "gold" | "info";
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    hot: "bg-hot/12 text-hot",
    warm: "bg-warm/15 text-warm",
    cold: "bg-cold/12 text-cold",
    success: "bg-success/12 text-success",
    danger: "bg-destructive/12 text-destructive",
    warning: "bg-warning/15 text-warning",
    gold: "bg-gold/18 text-gold-foreground",
    info: "bg-primary/8 text-primary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TempBadge({ t }: { t: Temperature }) {
  return (
    <Pill tone={t === "Hot" ? "hot" : t === "Warm" ? "warm" : "cold"}>
      {t === "Hot" ? "🔥 " : ""}
      {t.toUpperCase()}
    </Pill>
  );
}

export function StageBadge({ s }: { s: Stage }) {
  const tone =
    s === "Converted" ? "success" : s === "Lost" ? "danger" : s === "New" ? "gold" : "info";
  return <Pill tone={tone as never}>{s}</Pill>;
}

export function SlaBadge({ s }: { s: SlaState }) {
  const tone =
    s === "Breached" ? "danger" : s === "At Risk" ? "warning" : s === "Met" ? "success" : s === "Closed" ? "muted" : "success";
  return <Pill tone={tone as never}>{s}</Pill>;
}

export function RiskBadge({ r }: { r: "High" | "Medium" | "Low" | "None" }) {
  const tone = r === "High" ? "danger" : r === "Medium" ? "warning" : r === "Low" ? "success" : "muted";
  return <Pill tone={tone as never}>{r}</Pill>;
}

export function ScoreChip({ score }: { score: number }) {
  const tone = score >= 75 ? "hot" : score >= 50 ? "warm" : "cold";
  return (
    <Pill tone={tone as never} className="num">
      {score}
    </Pill>
  );
}

export function SourceBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground",
        className,
      )}
    >
      VOICE INTELLIGENCE
    </span>
  );
}
