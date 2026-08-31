"use client";

import { Radar } from "lucide-react";
import { useSnapshot } from "@/components/live-provider";
import { useNow, sendCommand } from "@/lib/use-live";
import { type Job } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ATS_LABEL: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
};

export default function ScanPage() {
  const snap = useSnapshot();
  const now = useNow(30_000);

  const jobs: Job[] = snap.jobs ?? [];
  const companies = snap.boards ?? [];
  const enabled = companies.filter((c) => c.enabled);

  const rolesByCompany = new Map<string, number>();
  for (const j of jobs) {
    rolesByCompany.set(j.company, (rolesByCompany.get(j.company) ?? 0) + 1);
  }

  const newThisCycle = jobs.filter((j) => {
    const discovered = (j as Job & { discoveredAt?: number }).discoveredAt;
    return discovered ? now - discovered < 60 * 60 * 1000 : false;
  }).length;

  const latestDiscovered = jobs.reduce((max, job) => {
    const ts = (job as Job & { discoveredAt?: number }).discoveredAt ?? 0;
    return ts > max ? ts : max;
  }, 0);

  const latest = [...jobs]
    .sort((a, b) => ((b as Job & { discoveredAt?: number }).discoveredAt ?? 0) - ((a as Job & { discoveredAt?: number }).discoveredAt ?? 0))
    .slice(0, 18);

  const lastSweepAt = latestDiscovered > 0 ? latestDiscovered : now;

  async function scanNow() {
    try {
      await sendCommand("scan_now");
      toast.success("Sweeping the boards now");
    } catch {
      toast.error("Couldn't start a scan");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader
        title="Job Scan"
        subtitle="Claude sweeps public ATS boards directly. No scraping, no ban risk, zero token cost."
        action={
          <Button onClick={scanNow}>
            <Radar className="size-4" /> Scan now
          </Button>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Boards swept" value={enabled.length} />
        <StatCard label="Roles found" value={jobs.length} />
        <StatCard label="New this cycle" value={newThisCycle} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-display mb-4">Sources</h2>
          <ul className="space-y-3 cozy-scroll max-h-[520px] overflow-y-auto">
            {enabled.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ background: "var(--sage)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ATS_LABEL[c.ats] ?? c.ats}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  {rolesByCompany.get(c.name) ?? 0} roles
                </span>
              </li>
            ))}
            {enabled.length === 0 && (
              <li className="text-sm text-muted-foreground">No sources enabled yet.</li>
            )}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display">Latest finds</h2>
            <span className="text-xs text-muted-foreground">
              last sweep {timeAgo(lastSweepAt)}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {latest.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
            {latest.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing found yet — run a scan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-3xl font-display">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}






