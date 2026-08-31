"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useSnapshot } from "@/components/live-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ATS_LABEL: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
};

export default function CompaniesPage() {
  const snap = useSnapshot();
  const companies = snap.boards ?? [];
  const enabledCount = companies.filter((c) => c.enabled).length;
  const jobs = snap.jobs ?? [];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ats, setAts] = useState("");
  const [token, setToken] = useState("");

  const rolesByCompany = new Map<string, number>();
  for (const j of jobs) {
    rolesByCompany.set(j.company, (rolesByCompany.get(j.company) ?? 0) + 1);
  }

  async function toggleCompany(company: any, newEnabled: boolean) {
    try {
      await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggle: { name: company.name, token: company.token, enabled: newEnabled } })
      });
      toast.success(newEnabled ? `Enabled ${company.name}` : `Paused ${company.name}`);
    } catch {
      toast.error("Failed to update company");
    }
  }

  async function addCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !ats || !token) return;
    
    try {
      await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: { name, ats, token, enabled: true } })
      });
      toast.success("Added company");
      setOpen(false);
      setName("");
      setAts("");
      setToken("");
    } catch {
      toast.error("Failed to add company");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader
        title="Companies"
        subtitle={`Claude checks these boards every cycle. ${enabledCount} of ${companies.length} active.`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="size-4 mr-2" /> Add company</Button>} />
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={addCompany}>
                <DialogHeader>
                  <DialogTitle>Add company</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ats">ATS</Label>
                    <Select value={ats} onValueChange={(v) => setAts(v ?? "")}>
                      <SelectTrigger id="ats">
                        <SelectValue placeholder="Select ATS" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="greenhouse">Greenhouse</SelectItem>
                        <SelectItem value="lever">Lever</SelectItem>
                        <SelectItem value="ashby">Ashby</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="token">Board Token</Label>
                    <Input id="token" value={token} onChange={e => setToken(e.target.value)} placeholder="e.g. acmecorp" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" type="button">Cancel</Button>} />
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {companies.map((c, i) => {
          let tint = "var(--border)";
          if (c.ats === "greenhouse") tint = "var(--sage)";
          else if (c.ats === "lever") tint = "var(--sky)";
          else if (c.ats === "ashby") tint = "var(--rose)";
          
          return (
            <div key={i} className="glass rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div 
                  className="size-12 rounded-xl flex items-center justify-center font-display text-lg text-white"
                  style={{ backgroundColor: tint }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <Switch
                  checked={c.enabled}
                  onCheckedChange={(v) => toggleCompany(c, v)}
                />
              </div>
              
              <div>
                <h3 className="font-medium text-lg truncate">{c.name}</h3>
                <p className="text-sm text-muted-foreground">{ATS_LABEL[c.ats] ?? c.ats}</p>
              </div>
              
              <div className="pt-2 border-t border-border/10 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{rolesByCompany.get(c.name) ?? 0} roles found</span>
                {c.ats === "greenhouse" && <a href={`https://boards.greenhouse.io/${c.token}`} target="_blank" className="text-primary hover:underline" rel="noreferrer">Careers</a>}
                {c.ats === "lever" && <a href={`https://jobs.lever.co/${c.token}`} target="_blank" className="text-primary hover:underline" rel="noreferrer">Careers</a>}
                {c.ats === "ashby" && <a href={`https://jobs.ashbyhq.com/${c.token}`} target="_blank" className="text-primary hover:underline" rel="noreferrer">Careers</a>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}














