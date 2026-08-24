import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useGoldFlow, isOverdue } from "@/lib/goldflow/store";
import { STAGES, type Stage } from "@/lib/goldflow/types";
import { relative } from "@/lib/goldflow/format";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Pill, ScoreChip, TempBadge } from "@/components/goldflow/badges";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Lead Pipeline — GoldFlow" },
      { name: "description", content: "Kanban pipeline from New to Converted with drag-and-drop stage changes that update the lead timeline." },
      { property: "og:title", content: "Lead Pipeline — GoldFlow" },
      { property: "og:description", content: "Move gold loan leads across stages and keep every next action visible." },
    ],
  }),
  component: Pipeline,
});

function Pipeline() {
  const { visibleLeads, changeStage, now, userById } = useGoldFlow();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  const active = visibleLeads.filter((l) => l.status === "Active" || l.stage === "Converted");

  return (
    <div>
      <PageHeader title="Lead Pipeline" subtitle="Drag a card to change its stage — every move is written to the lead timeline" />
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = active.filter((l) => l.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={() => {
                if (dragId) {
                  changeStage(dragId, stage);
                  toast.success(`Moved to ${stage}`);
                }
                setDragId(null);
                setOver(null);
              }}
              className={cn(
                "w-64 shrink-0 rounded-lg border bg-muted/40 p-2",
                over === stage ? "border-gold bg-accent/40" : "border-border",
              )}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-bold tracking-wide uppercase">{stage}</span>
                <span className="num text-[11px] text-muted-foreground">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.slice(0, 30).map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    className="cursor-grab rounded-md border border-border bg-card p-2 shadow-card active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <Link to="/leads/$leadId" params={{ leadId: l.id }} className="text-xs font-semibold hover:underline">
                        {l.customer}
                      </Link>
                      <ScoreChip score={l.score} />
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <TempBadge t={l.temperature} />
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {l.branch} · {userById(l.executiveId)?.name ?? "Unassigned"}
                    </div>
                    <div className="mt-1 truncate text-[11px]">{l.nextAction ?? <Pill tone="danger">No next action</Pill>}</div>
                    {l.nextActionDueAt && (
                      <div className={cn("text-[10px]", isOverdue(l, now) ? "font-semibold text-destructive" : "text-muted-foreground")}>
                        Due {relative(l.nextActionDueAt, now)}
                      </div>
                    )}
                  </div>
                ))}
                {!cards.length && <div className="px-1 py-6 text-center text-[11px] text-muted-foreground">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
