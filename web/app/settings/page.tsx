"use client";

import { useState, useEffect } from "react";
import { useSnapshot } from "@/components/live-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GradeChip } from "@/components/grade-chip";

const INTERVALS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "2h", value: 120 }
];

export default function SettingsPage() {
  const snap = useSnapshot();
  const profile = snap.profile ?? {};
  const prefs = snap.prefs ?? {};
  
  const [cvText, setCvText] = useState("Loading...");
  const [profileData, setProfileData] = useState(profile);
  
  useEffect(() => {
    setProfileData(snap.profile ?? {});
  }, [snap.profile]);
  
  useEffect(() => {
    fetch("/api/cv?id=base")
      .then(res => res.text())
      .then(text => setCvText(text || ""))
      .catch(() => setCvText(""));
  }, []);
  
  const updatePref = async (key: string, value: any) => {
    try {
      await fetch("/api/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value })
      });
    } catch {
      toast.error("Failed to update preference");
    }
  };
  
  const saveProfile = async () => {
    try {
      const payload = { ...profileData, isDemo: false, onboarded: true };
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    }
  };
  
  const saveCv = async () => {
    try {
      await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "base", markdown: cvText })
      });
      toast.success("Base CV saved");
    } catch {
      toast.error("Failed to save Base CV");
    }
  };
  
  const setDemoMode = async (demo: boolean) => {
    try {
      await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: demo ? "demo" : "real" })
      });
      toast.success(demo ? "Loaded demo dataset" : "Cleared to real profile");
    } catch {
      toast.error("Failed to switch dataset");
    }
  };
  
  const autoScore = prefs.minAutoScore ?? 4;
  const gradeLabel = autoScore === 5 ? "A" : autoScore === 4 ? "B" : autoScore === 3 ? "C" : autoScore === 2 ? "D" : "F";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <PageHeader
        title="Settings"
        subtitle="The control room. How autonomous Claude is, and the truthful answers it fills from, never guesses."
      />
      
      <div className="space-y-6 mt-6">
        {/* Autonomy Section */}
        <section className="glass rounded-3xl p-6">
          <h2 className="text-xl font-display mb-6">Autonomy</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Let Claude hunt on its own</Label>
                <p className="text-sm text-muted-foreground">Wake up on a schedule to discover and score new roles.</p>
              </div>
              <Switch checked={Boolean(prefs.autoHunt)} onCheckedChange={(v) => updatePref("autoHunt", v)} />
            </div>
            
            <div className="flex items-center justify-between opacity-50 pointer-events-none">
              <div>
                <Label className="text-base text-rose-500">Auto-submit the clean ones</Label>
                <p className="text-sm text-rose-500/80">Coming soon.</p>
              </div>
              <Switch disabled checked={false} />
            </div>
            
            <div className="flex items-center justify-between border border-rose-500/20 bg-rose-500/5 p-4 rounded-xl">
              <div>
                <Label className="text-base text-rose-500">Really send applications (live)</Label>
                <p className="text-sm text-rose-500/80">When off, this is a dry run that never actually submits.</p>
              </div>
              <Switch checked={Boolean(prefs.liveSubmit)} onCheckedChange={(v) => updatePref("liveSubmit", v)} />
            </div>
            
            <div className="pt-4 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Only auto-submit at or above</Label>
                  <GradeChip grade={gradeLabel} />
                </div>
                <Slider 
                  min={3} max={5} step={1} 
                  value={[autoScore]} 
                  onValueChange={(value) => {
                    const v = Array.isArray(value) ? value[0] : value;
                    if (typeof v === "number") updatePref("minAutoScore", v);
                  }} 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Daily application cap</Label>
                  <span className="text-sm font-medium">{prefs.dailyCap ?? 10}</span>
                </div>
                <Slider 
                  min={1} max={30} step={1} 
                  value={[prefs.dailyCap ?? 10]} 
                  onValueChange={(value) => {
                    const v = Array.isArray(value) ? value[0] : value;
                    if (typeof v === "number") updatePref("dailyCap", v);
                  }} 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Per-company cap</Label>
                  <span className="text-sm font-medium">{prefs.companyCap ?? 2}</span>
                </div>
                <Slider 
                  min={1} max={5} step={1} 
                  value={[prefs.companyCap ?? 2]} 
                  onValueChange={(value) => {
                    const v = Array.isArray(value) ? value[0] : value;
                    if (typeof v === "number") updatePref("companyCap", v);
                  }} 
                />
              </div>
              
              <div className="space-y-3">
                <Label>Scan every</Label>
                <div className="grid grid-cols-4 gap-2">
                  {INTERVALS.map((t) => (
                    <Button 
                      key={t.value} 
                      type="button"
                      variant={(prefs.scanInterval ?? 60) === t.value ? "default" : "outline"}
                      onClick={() => updatePref("scanInterval", t.value)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Profile Section */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display">Your profile</h2>
            <Button onClick={saveProfile}>Save</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Full name</Label>
              <Input value={profileData.fullName || ""} onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={profileData.email || ""} onChange={e => setProfileData({...profileData, email: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input value={profileData.location || ""} onChange={e => setProfileData({...profileData, location: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Headline</Label>
              <Input value={profileData.headline || ""} onChange={e => setProfileData({...profileData, headline: e.target.value})} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Target roles (comma separated)</Label>
              <Input value={profileData.targetRoles?.join(", ") || ""} onChange={e => setProfileData({...profileData, targetRoles: e.target.value.split(",").map((s: string) => s.trim())})} />
            </div>
            <div className="grid gap-2">
              <Label>Salary floor</Label>
              <Input type="number" value={profileData.salaryFloor || ""} onChange={e => setProfileData({...profileData, salaryFloor: parseInt(e.target.value) || undefined})} />
            </div>
            <div className="grid gap-2">
              <Label>Target max</Label>
              <Input type="number" value={profileData.targetMax || ""} onChange={e => setProfileData({...profileData, targetMax: parseInt(e.target.value) || undefined})} />
            </div>
          </div>
        </section>
        
        {/* Truthful answers Section */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display">Truthful answers</h2>
            <Button onClick={saveProfile} variant="secondary">Save</Button>
          </div>
          
          <div className="rounded-2xl p-4 text-sm mb-6" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
            Claude fills these into forms verbatim and never invents them. If a form asks something not covered here, it parks that job for you.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Work authorized</Label>
              <Select value={profileData.workAuthorized === true ? "yes" : profileData.workAuthorized === false ? "no" : ""} onValueChange={v => setProfileData({...profileData, workAuthorized: v === "yes"})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Needs sponsorship</Label>
              <Select value={profileData.requiresSponsorship === true ? "yes" : profileData.requiresSponsorship === false ? "no" : ""} onValueChange={v => setProfileData({...profileData, requiresSponsorship: v === "yes"})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notice period days</Label>
              <Input type="number" value={profileData.noticeDays || ""} onChange={e => setProfileData({...profileData, noticeDays: parseInt(e.target.value) || undefined})} />
            </div>
            <div className="grid gap-2">
              <Label>Relocation</Label>
              <Input value={profileData.relocation || ""} onChange={e => setProfileData({...profileData, relocation: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Salary expectation</Label>
              <Input value={profileData.salaryExpectation || ""} onChange={e => setProfileData({...profileData, salaryExpectation: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Start date</Label>
              <Input value={profileData.startDate || ""} onChange={e => setProfileData({...profileData, startDate: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>How did you hear</Label>
              <Input value={profileData.howDidYouHear || ""} onChange={e => setProfileData({...profileData, howDidYouHear: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Criminal disclosure</Label>
              <Input value={profileData.criminalDisclosure || ""} onChange={e => setProfileData({...profileData, criminalDisclosure: e.target.value})} />
            </div>
          </div>
          
          <h3 className="text-lg font-display mt-6 mb-4">EEO Setup</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["gender", "race", "veteran", "disability"].map(key => (
              <div key={key} className="grid gap-2">
                <Label className="capitalize">{key}</Label>
                <Input placeholder="Decline to self-identify" value={profileData[key] || "Decline to self-identify"} onChange={e => setProfileData({...profileData, [key]: e.target.value})} />
              </div>
            ))}
          </div>
        </section>
        
        {/* Base CV Section */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display">Base CV</h2>
            <Button onClick={saveCv}>Save Base CV</Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Note that it tailors a copy per role and never edits your original.
          </p>
          
          <Textarea 
            className="min-h-[400px] font-mono text-sm leading-relaxed cozy-scroll bg-background/50 focus:bg-background"
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
          />
        </section>
        
        {/* Dataset Section */}
        <section className="glass rounded-3xl p-6 border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base text-rose-500">Real hunt vs Demo</Label>
              <p className="text-sm text-rose-500/80">Switch to demo to load dummy data for filming.</p>
            </div>
            <Switch checked={profileData.isDemo === true} onCheckedChange={setDemoMode} />
          </div>
        </section>
      </div>
    </div>
  );
}
