"use client";

import { useMemo } from "react";
import { useSnapshot } from "@/components/live-provider";
import { GradeChip } from "@/components/grade-chip";
import { Mascot } from "@/components/scene/mascot";
import { timeAgo } from "@/lib/format";
import {
  Radar,
  Send,
  CalendarCheck,
  Sparkles,
  FileText,
  TriangleAlert,
  Settings as Cog,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { sendCommand } from "@/lib/use-live";
import { type Activity } from "@/lib/types";

const APPLIED_SET = new Set(["applied", "responded", "interview", "offer"]);
const INTERVIEW_SET = new Set(["interview", "offer"]);

export default function DashboardPage() {
  const snapshot = useSnapshot();
  const jobs = snapshot.jobs;
  const activity = snapshot.activity;
  const jobsLoading = (snapshot.jobStats?.total ?? 0) > 0 && jobs.length === 0;

  const firstName = snapshot.profile?.firstName || snapshot.profile?.fullName?.split(" ")[0] || "there";

  const [hour, setHour] = require("react").useState(12); require("react").useEffect(() => setHour(new Date().getHours()), []);
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const metrics = useMemo(() => {
    const activeCompanies = snapshot.jobStats?.companies ?? new Set(jobs.map((j) => j.company)).size;
    const applied = jobs.filter((j) => APPLIED_SET.has(j.status));
    const interviews = jobs.filter((j) => INTERVIEW_SET.has(j.status));
    const parked = jobs.filter((j) => j.parked);
    const scored = jobs.filter((j) => j.score !== undefined);
    const scannedToday = snapshot.jobStats?.total ?? jobs.length;
    const avgFit = scored.length > 0
      ? scored.reduce((acc, j) => acc + (j.score || 0), 0) / scored.length
      : 0;
    const todayGrade = avgFit >= 90 ? "A" : avgFit >= 80 ? "B" : avgFit >= 70 ? "C" : avgFit >= 60 ? "D" : "F";
    const topMatches = [...scored].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
    const topCompanies = [...new Set(topMatches.map((j) => j.company))].slice(0, 4);

    return {
      activeCompanies,
      applied,
      interviews,
      parked,
      scored,
      scannedToday,
      todayGrade,
      topMatches,
      topCompanies,
    };
  }, [jobs, snapshot.jobStats]);

  const {
    activeCompanies,
    applied,
    interviews,
    parked,
    scored,
    scannedToday,
    todayGrade,
    topMatches,
    topCompanies,
  } = metrics;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {jobsLoading && (
        <div className="glass rounded-2xl px-4 py-2 text-sm text-muted-foreground text-center">
          Loading your hunt data
        </div>
      )}
      {/* Hero */}
      <div className="glass rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="z-10 w-full">
          <p className="text-sm text-muted-foreground font-medium mb-1">{greeting}</p>
          <h1 className="text-4xl md:text-5xl font-display font-medium mb-4 text-balance">
            Welcome back, {firstName}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Claude is hunting across {activeCompanies} companies for you. {applied.length} applications sent
            {parked.length > 0 && (
              <span className="text-[color:var(--rose)] font-medium">
                , {parked.length} waiting for your tap
              </span>
            )}
            .
          </p>
        </div>
        
        <div className="mt-8 md:mt-0 flex items-center gap-6 z-10 shrink-0">
          <div className="flex flex-col items-center">
            <GradeChip grade={todayGrade as any} size="lg" />
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-2">Today's fit</span>
          </div>
          <div className="w-24 h-24">
            <Mascot mood={parked.length === 0 ? "happy" : "idle"} />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Radar className="size-5" style={{ color: "var(--sky)" }} />}
          title="Jobs scanned today"
          value={scannedToday}
          hint={`${snapshot.boards?.length || 0} boards swept`}
          accent="var(--sky)"
        />
        <StatCard 
          icon={<Send className="size-5" style={{ color: "var(--grade-b)" }} />}
          title="Applications sent"
          value={applied.length}
          hint={parked.length > 0 ? `${parked.length} need your tap` : "All caught up"}
          accent="var(--grade-b)"
        />
        <StatCard 
          icon={<CalendarCheck className="size-5" style={{ color: "var(--grade-a)" }} />}
          title="Interviews"
          value={interviews.length}
          hint="Keep it up"
          accent="var(--grade-a)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-[1.5rem] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Radar className="size-5 text-muted-foreground" />
              <h2 className="text-xl font-display font-medium">Active Hunt</h2>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Queue progress</span>
                <span className="font-medium">{scored.length} / {jobs.length} scored</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-1000" 
                  style={{ width: `${Math.round((scored.length / Math.max(1, jobs.length)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topCompanies.map((c, i) => {
                const j = topMatches.find(x => x.company === c);
                if (!j) return null;
                return (
                  <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <GradeChip grade={j.grade as any || "C"} />
                      <span className="font-medium truncate">{c}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                         <div className="h-full bg-grade-a" style={{ width: `${j.matchPercent}%` }} />
                      </div>
                      {j.matchPercent}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-[1.5rem] p-0 overflow-hidden flex flex-col h-[400px]">
             <div className="p-6 pb-4 border-b border-border/30">
               <h2 className="text-xl font-display font-medium">Live activity</h2>
             </div>
             <div className="p-6 pt-2 overflow-y-auto cozy-scroll flex-1">
               <ActivityFeed activities={activity} />
             </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {parked.length > 0 && (
            <div className="glass-strong rounded-[1.5rem] p-6 border-rose/30 bg-rose/5">
              <div className="flex items-center gap-2 mb-4 text-rose">
                <TriangleAlert className="size-5" />
                <h2 className="text-lg font-display font-medium">Needs you</h2>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto cozy-scroll pr-2">
                {parked.slice(0, 30).map((j) => (
                  <div key={j.id} className="bg-background/80 rounded-xl p-3 border border-border/50">
                    <p className="font-medium text-sm truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground truncate mb-2">{j.company}</p>
                    <div className="flex items-center gap-2">
                      <button 
                        className="flex-1 bg-rose/10 hover:bg-rose/20 text-rose text-xs font-medium py-1.5 rounded-lg transition"
                        onClick={() => sendCommand("submit", { jobId: j.id })}
                      >
                        Mark applied
                      </button>
                      <Link 
                        href={j.url || "#"} target="_blank"
                        className="px-2 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-[1.5rem] p-6">
            <h2 className="text-lg font-display font-medium mb-4">Top matches</h2>
            <div className="space-y-4">
              {topMatches.map((j) => (
                <Link 
                  href={j.url || "#"} 
                  target="_blank" 
                  key={j.id} 
                  className="flex items-start gap-3 group hover:bg-secondary/30 p-2 -mx-2 rounded-xl transition"
                >
                  <GradeChip grade={j.grade as any || "C"} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition">{j.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{j.company}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-secondary px-1.5 py-0.5 rounded-md">
                    {j.matchPercent}%
                  </span>
                </Link>
              ))}
              {topMatches.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No scored matches yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, hint, accent }: any) {
  return (
    <div className="glass rounded-[1.5rem] p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-card shadow-sm" style={{ color: accent }}>
          {icon}
        </div>
        <span className="font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="text-4xl font-display font-medium my-1">
         {/* NumberTicker simulation for static display */}
         {value}
      </div>
      <p className="text-sm text-muted-foreground mt-auto">{hint}</p>
    </div>
  );
}

function ActivityFeed({ activities }: { activities: Activity[] }) {
  const getIcon = (phase: string) => {
    switch (phase) {
      case "scan": return <Radar className="size-4" />;
      case "score": return <Sparkles className="size-4" />;
      case "cv": return <FileText className="size-4" />;
      case "apply": return <Send className="size-4" />;
      case "park": return <TriangleAlert className="size-4" />;
      case "interview": return <CalendarCheck className="size-4" />;
      default: return <Cog className="size-4" />;
    }
  };

  const getColor = (level: string) => {
    switch (level) {
      case "info": return "var(--sky)";
      case "success": return "var(--sage)";
      case "warn": return "var(--rose)";
      case "highlight": return "var(--grade-a)";
      default: return "var(--muted-foreground)";
    }
  };

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No activity yet. Stand by.</p>;
  }

  // Ensure newest first
  const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

  return (
    <div className="space-y-1 relative">
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border/40 -z-10" />
      {sorted.map((act) => (
        <div key={act.id} className="flex items-start gap-4 p-2 rounded-xl">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm z-10"
            style={{ backgroundColor: "var(--card)", color: getColor(act.level) }}
          >
            {getIcon(act.phase)}
          </div>
          <div className="pt-1 flex-1 min-w-0">
            <p className="text-sm text-foreground/90">{act.message}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(act.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}






















