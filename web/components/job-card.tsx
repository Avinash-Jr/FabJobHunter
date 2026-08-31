"use client";

import Link from "next/link";
import { ExternalLink, Check, TriangleAlert } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GradeChip } from "@/components/grade-chip";
import { sendCommand } from "@/lib/use-live";
import { type Job } from "@/lib/types";
import { STATUS_LABEL, PARK_REASON_LABEL, money } from "@/lib/format";
import { toast } from "sonner";
import { memo } from "react";

function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "rose" }) {
  const style =
    tone === "rose"
      ? { background: "color-mix(in srgb, var(--rose) 18%, transparent)", color: "var(--rose)" }
      : { background: "var(--secondary)", color: "var(--secondary-foreground)" };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={style}>
      {children}
    </span>
  );
}

export const JobCard = memo(function JobCard({ job }: { job: Job }) {
  const location = (job.location as string) || "Remote";
  const match = job.matchPercent ?? (typeof job.score === "number" ? Math.round(job.score) : null);

  return (
    <Sheet>
      <SheetTrigger>
        <div className="glass rounded-2xl p-4 w-full text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex items-start gap-3">
            <GradeChip grade={job.grade ?? "C"} />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{job.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {job.company} - {location}
              </p>
              {match != null && (
                <p className="text-xs text-muted-foreground mt-1">{match}% match</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {job.archetype != null && <Pill>{String(job.archetype)}</Pill>}
                {job.parked && job.parkReason && (
                  <Pill tone="rose">
                    {PARK_REASON_LABEL[job.parkReason] ?? job.parkReason}
                  </Pill>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetTrigger>
      <JobDetail job={job} location={location} match={match} />
    </Sheet>
  );
}, (prev, next) => 
  prev.job.id === next.job.id && 
  prev.job.status === next.job.status && 
  prev.job.score === next.job.score && 
  prev.job.parked === next.job.parked
);

function JobDetail({
  job,
  location,
  match,
}: {
  job: Job;
  location: string;
  match: number | null;
}) {
  const reasons = (job.reasons as string[] | undefined) ?? [];
  const gaps = (job.gaps as string[] | undefined) ?? [];
  const legit = (job.legitimacy as string | undefined) ?? "Looks like a real, active posting.";
  const hasCv = Boolean(job.hasCv ?? job.cvReady);

  async function mark(type: "submit" | "discard") {
    try {
      await sendCommand(type, { jobId: job.id });
      toast.success(type === "submit" ? "Marked applied" : "Removed from the hunt");
    } catch {
      toast.error("That didn't go through");
    }
  }

  return (
    <SheetContent className="w-full sm:max-w-md overflow-y-auto cozy-scroll">
      <SheetHeader>
        <div className="flex items-center gap-3">
          <GradeChip grade={job.grade ?? "C"} size="lg" />
          <SheetTitle className="font-display text-balance">{job.title}</SheetTitle>
        </div>
      </SheetHeader>

      <div className="px-4 pb-8 space-y-6">
        <div className="flex flex-wrap gap-1.5">
          {match != null && <Pill>{match}% match</Pill>}
          {job.archetype != null && <Pill>{String(job.archetype)}</Pill>}
          {typeof job.salary === "number" && (
            <Pill>{money(job.salary, job.currency ?? "USD")}</Pill>
          )}
          <Pill>{STATUS_LABEL[job.status] ?? job.status}</Pill>
        </div>

        <div
          className="rounded-2xl p-3 text-sm"
          style={{
            background: "color-mix(in srgb, var(--grade-a) 12%, transparent)",
            color: "var(--sage-ink)",
          }}
        >
          {legit}
        </div>

        {reasons.length > 0 && (
          <section>
            <h3 className="text-sm font-display mb-2">Why this fits</h3>
            <ul className="space-y-1.5">
              {reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="size-4 mt-0.5 shrink-0" style={{ color: "var(--sage-ink)" }} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {gaps.length > 0 && (
          <section>
            <h3 className="text-sm font-display mb-2">Watch-outs</h3>
            <ul className="space-y-1.5">
              {gaps.map((g, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <TriangleAlert className="size-4 mt-0.5 shrink-0" style={{ color: "var(--rose)" }} />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.parked && job.parkReason && (
          <div
            className="rounded-2xl p-3 text-sm"
            style={{ background: "color-mix(in srgb, var(--rose) 14%, transparent)", color: "var(--rose)" }}
          >
            Parked: {PARK_REASON_LABEL[job.parkReason] ?? job.parkReason}. This one needs your tap.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {job.url && (
            <Link
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Open posting <ExternalLink className="size-4" />
            </Link>
          )}
          {hasCv && (
            <Link
              href={"/resumes?job=${job.id}"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View tailored CV
            </Link>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={() => mark("submit")}>
            Mark applied
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => mark("discard")}>
            Not for me
          </Button>
        </div>
      </div>
    </SheetContent>
  );
}
