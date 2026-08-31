export function timeAgo(ts: number | string | Date) {
  const d = new Date(ts);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

export function clockTime(ts: number | string | Date) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const GRADE_COLOR: Record<string, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
  D: "var(--grade-d)",
  E: "var(--grade-e)",
  F: "var(--grade-f)",
};

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  scored: "Scored",
  cv_ready: "CV Ready",
  needs_you: "Needs You",
  applied: "Applied",
  responded: "Responded",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  discarded: "Discarded",
  skip: "Skipped",
};

export const PARK_REASON_LABEL: Record<string, string> = {
  captcha: "CAPTCHA wall",
  workday: "Workday maze",
  account_wall: "Account required",
  legal_question: "Needs a legal answer",
  email_verification: "Email code wall",
  ghost: "Possible ghost job",
  unknown_form: "Unusual form"
};

export function money(n: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export const KANBAN_COLUMNS = [
  { id: "new", label: "New", match: ["new"], color: "var(--sky)" },
  { id: "scored", label: "Scored", match: ["scored"], color: "var(--accent)" },
  { id: "cv_ready", label: "CV Ready", match: ["cv_ready"], color: "var(--sage)" },
  { id: "needs_you", label: "Needs You", match: ["needs_you"], color: "var(--rose)" },
  { id: "applied", label: "Applied", match: ["applied", "responded"], color: "var(--primary)" },
  { id: "interview", label: "Interview", match: ["interview", "offer"], color: "var(--grade-a)" },
];
