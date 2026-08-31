"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSnapshot } from "@/components/live-provider";
import { type Job } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { GradeChip } from "@/components/grade-chip";
import { Button } from "@/components/ui/button";

export default function ResumesPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-4 py-8 text-muted-foreground">Loading resumes...</div>}>
      <ResumesContent />
    </Suspense>
  );
}

function ResumesContent() {
  const searchParams = useSearchParams();
  const initId = searchParams.get("job") ?? "base";
  
  const [selectedId, setSelectedId] = useState<string>(initId);
  const [markdown, setMarkdown] = useState<string>("Loading...");
  
  const snap = useSnapshot();
  const jobs: Job[] = snap.jobs ?? [];
  const cvJobs = jobs.filter(j => j.hasCv || j.cvReady);
  
  useEffect(() => {
    let active = true;
    fetch(`/api/cv?id=${selectedId}`)
      .then(r => r.text())
      .then(text => {
        if (active) setMarkdown(text || "No CV found.");
      })
      .catch(() => {
        if (active) setMarkdown("Error loading CV.");
      });
    return () => { active = false; };
  }, [selectedId]);
  
  const activeJob = cvJobs.find(j => j.id === selectedId);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader
        title="Resumes"
        subtitle="Your base CV, plus a version Claude tailored to each strong match, ATS-tuned and never fabricated."
      />
      
      <div className="flex flex-col md:flex-row gap-6 mt-6 min-h-[70vh]">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <Button 
            variant={selectedId === "base" ? "default" : "outline"} 
            className="justify-start shadow-none"
            onClick={() => setSelectedId("base")}
          >
            <FileText className="size-4 mr-2" /> Base CV
          </Button>
          
          {cvJobs.length > 0 && <div className="text-xs font-medium text-muted-foreground mt-4 mb-2 uppercase tracking-wider px-2">Tailored versions</div>}
          
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[50vh] cozy-scroll pr-1">
            {cvJobs.map(j => (
              <Button 
                key={j.id} 
                variant={selectedId === j.id ? "default" : "outline"}
                className={`justify-start shadow-none h-auto py-2 px-3 ${selectedId === j.id ? "" : "hover:bg-secondary/50"}`}
                onClick={() => setSelectedId(j.id)}
              >
                <div className="flex items-center gap-3 w-full text-left">
                  <div className="shrink-0">
                    <GradeChip grade={j.grade ?? "C"} />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="font-medium text-sm truncate">{j.company}</p>
                    <p className="text-xs opacity-80 truncate">{j.title}</p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 glass rounded-3xl p-0 overflow-hidden flex flex-col min-h-0 bg-background/50">
          <div className="border-b border-border/5 px-6 py-4 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              {activeJob ? (
                <GradeChip grade={activeJob.grade ?? "C"} size="lg" />
              ) : (
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
              )}
              
              <div>
                <h3 className="font-display">
                  {activeJob ? "Tailored for " + activeJob.company : "Base CV"}
                </h3>
                {activeJob && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{activeJob.title}</span>
                    <span>·</span>
                    <span>{Math.round(activeJob.score || activeJob.matchPercent || 0)}% match</span>
                  </p>
                )}
              </div>
            </div>
            
            {activeJob && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm">
                ATS-tuned
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none dark:prose-invert prose-headings:font-display cozy-scroll bg-background/30 rounded-b-3xl">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}












