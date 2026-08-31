"use client";

import { useSnapshot } from "@/components/live-provider";
import { type Job } from "@/lib/types";
import { KANBAN_COLUMNS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { JobCard } from "@/components/job-card";

export default function ApplicationsPage() {
  const snap = useSnapshot();
  const jobs: Job[] = snap.jobs ?? [];

  return (
    <div className="mx-auto w-full max-w-full px-4 py-8">
      <PageHeader
        title="Applications"
        subtitle="Every role the hunt found, moving from discovery to interview."
      />

      <div className="flex gap-4 overflow-x-auto cozy-scroll pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colJobs = jobs
            .filter((j) => col.match.includes(j.status ?? ""))
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

          return (
            <div key={col.id} className="w-[280px] shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: col.color }}
                />
                <h2 className="font-display text-sm">{col.label}</h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {colJobs.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto cozy-scroll pr-1">
                {colJobs.slice(0, 40).map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
                {colJobs.length === 0 && (
                  <div className="glass rounded-2xl p-4 text-sm text-muted-foreground text-center">
                    nothing here yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}





