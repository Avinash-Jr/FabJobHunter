export type JobStatus = "new" | "scored" | "cv_ready" | "needs_you" | "applied" | "responded" | "interview" | "offer" | "rejected" | "discarded" | "skip";
export type Grade = "A" | "B" | "C" | "D" | "E" | "F";
export type ParkReason = "captcha" | "email_verification" | "account_wall" | "workday" | "legal_question" | "ghost" | "low_fit" | "unknown_form";
export type Ats = "greenhouse" | "lever" | "ashby" | "workable" | "workday" | "other";

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
  status: JobStatus;
  score?: number;
  matchPercent?: number;
  grade?: Grade;
  archetype?: string;
  salary?: number;
  currency?: string;
  parked?: boolean;
  parkReason?: ParkReason;
  reasons?: string[];
  gaps?: string[];
  legitimacy?: string;
  hasCv?: boolean;
  cvReady?: boolean;
}

export interface Profile {
  firstName?: string;
  [key: string]: any;
}

export interface Prefs {
  scanIntervalMin: number;
  [key: string]: any;
}

export interface Activity {
  id: string;
  timestamp: number;
  phase: "scan" | "score" | "cv" | "apply" | "park" | "interview" | "system";
  level: "info" | "success" | "warn" | "highlight";
  message: string;
}

export interface Board {
  id: string;
  name: string;
  ats: Ats;
  enabled: boolean;
  rolesFound: number;
  token?: string;
}

export interface JobStats {
  total: number;
  byStatus: Record<string, number>;
  parked: number;
  companies: number;
}

export interface Snapshot {
  jobs: Job[];
  activity: Activity[];
  boards: Board[];
  profile: Profile;
  prefs: Prefs;
  autonomy: boolean;
  jobStats?: JobStats;
}
