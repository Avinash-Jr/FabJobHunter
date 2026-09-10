# FabJobHunter

Automated job-hunting engine and dashboard. Scans public ATS boards (Greenhouse, Lever, Ashby, Workable), scores each role against your profile, generates tailored CVs for top matches, and tracks the full application pipeline — all from one local install.

## Architecture

```
FabJobHunter/
├── engine/              # Node.js backend (ESM, no framework)
│   ├── scan.mjs         # Pulls open roles from company career pages
│   ├── score.mjs        # Scores + grades each role against your profile
│   ├── tailor.mjs       # Generates role-specific CVs from your base CV
│   ├── apply.mjs        # Application runner (dry-run by default)
│   ├── cycle.mjs        # Orchestrator: scan → score → tailor → apply
│   ├── commands.mjs     # Processes queued commands from the dashboard
│   ├── mark.mjs         # CLI helper to manually update a job's status
│   ├── seed.mjs         # Seeds demo data by fetching live boards
│   ├── lib.mjs          # Shared utilities, paths, JSON read/write
│   └── providers/       # ATS adapters
│       ├── greenhouse.mjs
│       ├── lever.mjs
│       ├── ashby.mjs      (placeholder)
│       └── workable.mjs   (placeholder)
├── web/                 # Next.js 16 dashboard (React 19, Tailwind 4)
│   ├── app/             # App Router pages
│   │   ├── page.tsx           # Home dashboard
│   │   ├── scan/page.tsx      # Scan results view
│   │   ├── applications/page.tsx
│   │   ├── resumes/page.tsx
│   │   ├── companies/page.tsx
│   │   ├── settings/page.tsx
│   │   └── api/               # Route handlers
│   │       ├── snapshot/route.ts
│   │       ├── run-cycle/route.ts
│   │       ├── command/route.ts
│   │       ├── state/route.ts
│   │       ├── stream/route.ts
│   │       ├── profile/route.ts
│   │       ├── prefs/route.ts
│   │       ├── companies/route.ts
│   │       └── cv/route.ts
│   ├── components/      # UI components
│   └── lib/             # Client utilities, types, hooks
├── data/                # Runtime data (mostly gitignored)
│   ├── config/          # profile.json, prefs.json
│   ├── companies.json   # Company list with ATS tokens
│   ├── jobs.json        # All discovered + scored jobs
│   ├── cv/              # base.md + per-job tailored CVs
│   ├── log/             # activity.jsonl
│   └── queue/           # commands.jsonl
├── package.json         # Engine dependencies (marked, playwright)
├── setup.ps1            # One-time setup script
└── README.md
```

## Prerequisites

- **Node.js** 18+ (LTS recommended) — [nodejs.org](https://nodejs.org)
- **npm** (ships with Node.js)
- **PowerShell** (for the setup script; Windows comes with it)

## Setup

Open PowerShell in the project root and run the one-time setup:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

This does four things in order:

1. Checks that Node.js and npm are installed
2. Verifies all pinned package versions exist on npm
3. Installs engine dependencies (`marked`, `playwright`) and downloads Playwright browsers (~500 MB–1 GB)
4. Installs dashboard dependencies in `web/`

It stops at the first problem and never deletes anything.

## Commands

All commands run from the **project root** unless noted otherwise.

### Seed demo data

Populates `data/` with a profile, preferences, a company list (100+ companies across Greenhouse and Lever), and fetches live job listings to create a demo dataset.

```powershell
npm run seed
```

This creates `data/config/profile.json`, `data/config/prefs.json`, `data/companies.json`, `data/jobs.json`, and a base CV at `data/cv/base.md`.

### Run a full hunt cycle (scan + score + tailor)

The main command. Scans all enabled company boards, scores new jobs, tailors CVs for top matches, and logs everything.

```powershell
npm run cycle
```

This runs `node engine/cycle.mjs --force`, which:

1. Processes any queued commands from the dashboard
2. Scans every enabled company's ATS board for open roles
3. Filters by your target roles (ignoring internships)
4. Scores each new job against your profile (grade A–F, match percentage)
5. Auto-tailors CVs for A and B grade jobs (if autonomy mode is on)
6. Optionally kicks off the apply runner

Output is JSON: `{ boards, added, scored }`

### Run individual steps

**Scan only** — fetch new jobs from all enabled boards:

```powershell
node engine/scan.mjs
```

**Score only** — grade all unscored jobs:

```powershell
node engine/score.mjs
```

**Tailor CVs** — generate tailored CVs for top-scoring jobs:

```powershell
# Tailor top 8 A-grade jobs
node engine/tailor.mjs --top=8

# Tailor specific jobs by ID
node engine/tailor.mjs <jobId1> <jobId2>
```

**Apply** — run the application step (dry-run by default):

```powershell
npm run apply

# Live mode (actually submits)
node engine/apply.mjs --live
```

### Manually update a job's status

```powershell
# Mark a job as CV-ready
node engine/mark.mjs cv <jobId>

# Mark a job as applied
node engine/mark.mjs applied <jobId>

# Park a job (needs manual intervention)
node engine/mark.mjs park <jobId> <reason> "<note>"
```

Park reasons: `captcha`, `email_verification`, `account_wall`, `workday`, `legal_question`, `ghost`, `low_fit`, `unknown_form`

### Start the dashboard

```powershell
cd web
npm run dev
```

Then open **http://localhost:4319** in your browser.

The dashboard shows:

- **Home** — overview stats, top matches, live activity feed
- **Scan** — browse all discovered jobs with grades and match scores
- **Applications** — track applied, interview, and offer stages
- **Resumes** — view tailored CVs
- **Companies** — manage your company watchlist
- **Settings** — configure profile, preferences, and autonomy mode

### Build the dashboard for production

```powershell
cd web
npm run build
npm run start
```

The production server also runs on port 4319.

## How the pipeline works

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   SCAN   │───▶│  SCORE   │───▶│  TAILOR  │───▶│  APPLY   │
│          │    │          │    │          │    │          │
│ Fetches  │    │ Grades   │    │ Builds   │    │ Submits  │
│ jobs from│    │ A–F with │    │ per-role │    │ or parks │
│ ATS APIs │    │ match %  │    │ CVs from │    │ for your │
│          │    │          │    │ base.md  │    │ review   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

1. **Scan** pulls open roles from each company's public ATS board (Greenhouse, Lever). Filters by your target roles and excludes internships.
2. **Score** evaluates each job against your profile — title match, seniority, location, salary. Assigns a numeric score (1.3–5.0), letter grade (A–F), and match percentage.
3. **Tailor** takes your `data/cv/base.md` and generates a role-specific CV for each top match, injecting a summary and "Why Company" section.
4. **Apply** handles submission. Dry-run by default; live mode requires explicit opt-in via preferences.

Jobs that hit blockers (CAPTCHAs, account walls, etc.) are "parked" for manual handling and flagged in the dashboard.

## ATS providers

| Provider   | Status      | API endpoint                                              |
|------------|-------------|-----------------------------------------------------------|
| Greenhouse | Working     | `boards-api.greenhouse.io/v1/boards/{token}/jobs`         |
| Lever      | Working     | `api.lever.co/v0/postings/{token}?mode=json`              |
| Ashby      | Placeholder | `api.ashbyhq.com/posting-api/job-board/{token}`           |
| Workable   | Placeholder | `apply.workable.com/api/v1/widget/accounts/{token}`       |

All APIs are public, no keys required.

## Configuration

### Profile (`data/config/profile.json`)

```json
{
  "fullName": "Your Name",
  "email": "you@example.com",
  "location": "Remote / Worldwide",
  "headline": "Software Engineer",
  "targetRoles": ["Backend Engineer", "Full Stack Developer", "Software Engineer"],
  "salaryFloor": 150000,
  "workAuthorized": true,
  "requiresSponsorship": false
}
```

### Preferences (`data/config/prefs.json`)

```json
{
  "autonomy": true,
  "autoHunt": true,
  "autoSubmit": true,
  "liveApply": false,
  "autoSubmitMinScore": 4,
  "dailyCap": 10,
  "scanInterval": 30
}
```

Key settings:

- **autonomy** — enables the full automated pipeline (scan → score → tailor → apply)
- **liveApply** — when false, apply runs in dry-run mode; set to true to actually submit
- **autoSubmitMinScore** — minimum score threshold for auto-submission
- **dailyCap** — max applications per day
- **scanInterval** — minutes between scans

### Companies (`data/companies.json`)

Array of companies to monitor:

```json
[
  { "name": "Anthropic", "token": "anthropic", "ats": "greenhouse", "enabled": true },
  { "name": "Spotify",   "token": "spotify",   "ats": "lever",      "enabled": true }
]
```

The `token` is the company's slug on their ATS platform. Disable a company by setting `enabled: false`.

## Data directory

| Path                        | What it holds                                |
|-----------------------------|----------------------------------------------|
| `data/config/profile.json`  | Your profile and target roles                |
| `data/config/prefs.json`    | Automation preferences                       |
| `data/companies.json`       | Company watchlist with ATS tokens            |
| `data/jobs.json`            | All jobs (discovered, scored, applied, etc.) |
| `data/cv/base.md`           | Your base CV in markdown                     |
| `data/cv/<jobId>.md`        | Tailored CVs per job                         |
| `data/log/activity.jsonl`   | Activity log (newline-delimited JSON)        |
| `data/queue/commands.jsonl` | Commands queued from the dashboard           |
| `data/runs.json`            | History of recent cycle runs (last 50)       |

## Tech stack

**Engine:** Node.js (ESM), Playwright (for browser automation), Marked (markdown rendering)

**Dashboard:** Next.js 16, React 19, Tailwind CSS 4, Motion (animations), shadcn/ui components, Lucide icons, Sonner (toasts)

## Quick start

```powershell
# 1. Setup (one-time)
powershell -ExecutionPolicy Bypass -File .\setup.ps1

# 2. Seed demo data
npm run seed

# 3. Run a full hunt cycle
npm run cycle

# 4. Start the dashboard
cd web
npm run dev
# Open http://localhost:4319
```
