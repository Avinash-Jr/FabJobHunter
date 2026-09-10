"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Radar, 
  Layers, 
  FileText, 
  Building2, 
  Settings as CogIcon,
  Play,
  Sun,
  Moon
} from "lucide-react";
import { useSnapshot } from "@/components/live-provider";
import { Mascot } from "./scene/mascot";
import { toast } from "sonner";
import { Switch } from "./ui/switch";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const snapshot = useSnapshot();
  const [isDusk, setIsDusk] = React.useState(false);

  React.useEffect(() => {
    const dusk = localStorage.getItem("dusk-mode") === "true";
    setIsDusk(dusk);
    if (dusk) document.documentElement.classList.add("dusk");
  }, []);

  const toggleDusk = () => {
    const next = !isDusk;
    setIsDusk(next);
    localStorage.setItem("dusk-mode", String(next));
    if (next) {
      document.documentElement.classList.add("dusk");
    } else {
      document.documentElement.classList.remove("dusk");
    }
  };

  const runHunt = async () => {
    try {
      const res = await fetch("/api/run-cycle", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.reason === "busy" ? "A hunt is already running" : "Failed to start hunt");
      }
      toast.success("Hunt cycle started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start hunt");
    }
  };

  // Run cycle occasionally if autonomy on
  React.useEffect(() => {
    if (!snapshot.autonomy) return;
    const interval = (snapshot.prefs?.scanIntervalMin || 30) * 60 * 1000;
    const id = setInterval(() => {
      fetch("/api/run-cycle", { method: "POST" }).catch(console.error);
    }, interval);
    return () => clearInterval(id);
  }, [snapshot.autonomy, snapshot.prefs?.scanIntervalMin]);

  const stats = snapshot.jobStats;
  const statusCount = (status: string) => stats?.byStatus?.[status] ?? snapshot.jobs.filter((j) => j.status === status).length;

  const navLinks = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Job Scan", href: "/scan", icon: Radar, badge: statusCount("new") },
    { name: "Applications", href: "/applications", icon: Layers, badge: statusCount("needs_you"), badgeTone: "rose" },
    { name: "Resumes", href: "/resumes", icon: FileText },
    { name: "Companies", href: "/companies", icon: Building2, badge: snapshot.boards?.filter(b => b.enabled).length || 0 },
    { name: "Settings", href: "/settings", icon: CogIcon },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar - desktop only */}
      <div className="hidden md:flex flex-col w-64 glass-strong m-4 rounded-[26px] overflow-hidden shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 bg-secondary/50 rounded-2xl p-3 mb-6">
            <div className="w-12 h-12 shrink-0">
              <Mascot />
            </div>
             <div>
               <h2 className="font-display font-medium text-sm leading-tight text-foreground/90">@FabJobHunter</h2>
               <p className="text-xs text-muted-foreground">Job Hunter Bot</p>
             </div>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4" />
                    {link.name}
                  </div>
                  {link.badge && link.badge > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-4 border-t border-border/30 m-4 rounded-xl bg-background/30 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full" />
             <span className="text-sm font-medium text-foreground/80">
               {snapshot.autonomy ? "Agent active" : "Agent paused"}
             </span>
          </div>
          {snapshot.autonomy && (
             <p className="text-xs text-muted-foreground ml-4">
               Scanning, next scan in {snapshot.prefs?.scanIntervalMin || 30}m
             </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top bar sticky */}
        <div className="absolute top-4 left-4 right-4 md:left-2 md:right-8 z-30 flex justify-end pointer-events-none">
           <div className="glass rounded-full px-4 py-2 flex items-center gap-4 pointer-events-auto shadow-[var(--shadow-card)]">
             
             <div className="flex items-center gap-2 border-r border-border/50 pr-4">
               <span className="text-sm font-medium text-muted-foreground">Autonomy</span>
               <Switch 
                 checked={snapshot.autonomy || false}
                 onCheckedChange={(v) => { /* Update toggles via prefs later, setting locally doesn't mock backend well unless we optimistic update */ toast.info("Toggle autonomy in Settings"); }}
                 className="scale-90"
               />
             </div>

             <button 
               onClick={runHunt}
               className="flex items-center gap-1.5 text-sm font-medium bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-105 active:scale-95 transition px-3 py-1.5 rounded-full"
             >
               <Play className="size-3.5 fill-current" />
               Run hunt
             </button>

             <button 
               onClick={toggleDusk}
               className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-full hover:bg-secondary"
             >
               {isDusk ? <Moon className="size-4" /> : <Sun className="size-4" />}
             </button>
           </div>
        </div>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto cozy-scroll p-4 md:p-8 pt-24 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-border z-40 pb-safe">
        <div className="flex justify-around p-2">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center p-2 rounded-xl transition-colors"
              >
                <div className="relative">
                  <Icon className="size-5 mb-1" />
                  {link.badge && link.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 w-3 h-3 rounded-full bg-[var(--rose)] border-2 border-background" />
                  ) : null}
                </div>
                <span className="text-[10px] font-medium">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}








