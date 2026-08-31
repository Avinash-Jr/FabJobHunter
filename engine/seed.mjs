import fs from "fs/promises";
import path from "path";

const GREENHOUSE_TOKENS = [
  "anthropic",
  "vercel",
  "airtable",
  "temporal",
  "arizeai",
  "gleanwork",
  "speechmatics",
  "planetscale",
  "hightouch",
  "runwayml",
  "wayve",
  "stabilityai",
  "gitlab",
  "docker",
  "gong",
  "canva",
  "figma",
  "notion",
  "databricks",
  "snowflake",
  "dbtlabs",
  "astronomer",
  "cohere",
  "essentialai",
  "togetherai",
  "characterai",
  "midjourney",
  "scaleai",
  "snorkel",
  "weaviate",
  "pinecone",
  "milvus",
  "qdrant",
  "redis",
  "mongodb",
  "elastic",
  "stripe",
  "plaid",
  "brex",
  "ramp",
  "gusto",
  "rippling",
  "deel",
  "github",
  "hashicorp",
  "grafana",
  "sentry",
  "datadog",
  "confluent",
  "cockroachlabs",
  "palantir",
  "discord",
  "roblox",
  "airbnb",
  "pinterest",
  "reddit",
  "okta",
  "twilio",
  "zscaler",
  "cloudflare",
  "asana",
  "smartsheet",
  "tripadvisor",
  "epicgames",
  "nintendo",
  "squarespace",
  "cisco",
  "bain",
  "sony",
];

const LEVER_TOKENS = [
  "mistral",
  "spotify",
  "netflix",
  "yelp",
  "shopify",
  "coursera",
  "udemy",
  "atlassian",
  "salesforce",
  "box",
  "dropbox",
  "eventbrite",
  "lyft",
  "uber",
  "doordash",
  "instacart",
  "zillow",
  "redfin",
  "compass",
  "openai",
  "nielsen",
  "autodesk",
  "roku",
  "quora",
  "peloton",
  "grab",
  "revolut",
  "kpmg",
  "bcg",
];

const KEEP_REGEX =
  /sde|software development engineer|backend|back-end|back end|fullstack|full-stack|full stack|software engineer/i;
const DROP_REGEX = /intern|junior|android|ios|embedded/i;

async function fetchGreenhouse(token) {
  try {
    const res = await fetch(
      "https://boards-api.greenhouse.io/v1/boards/" + token + "/jobs",
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j) => ({
      id: "gh_" + token + "_" + j.id,
      title: j.title,
      company: token.charAt(0).toUpperCase() + token.slice(1),
      url: j.absolute_url,
      location: j.location?.name || "Remote",
      discoveredAt: j.first_published
        ? new Date(j.first_published).getTime()
        : Date.now(),
      ats: "greenhouse",
    }));
  } catch (e) {
    console.error("Failed to fetch Greenhouse", token, e.message);
    return [];
  }
}

async function fetchLever(token) {
  try {
    const res = await fetch(
      "https://api.lever.co/v0/postings/" + token + "?mode=json",
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((j) => ({
      id: "lv_" + token + "_" + j.id,
      title: j.text,
      company: token.charAt(0).toUpperCase() + token.slice(1),
      url: j.hostedUrl,
      location: j.categories?.location || "Remote",
      discoveredAt: j.createdAt || Date.now(),
      ats: "lever",
    }));
  } catch (e) {
    console.error("Failed to fetch Lever", token, e.message);
    return [];
  }
}

async function run() {
  console.log("Seeding demo database...");
  const dataDir = path.join(process.cwd(), "data");
  const configDir = path.join(dataDir, "config");
  const cvDir = path.join(dataDir, "cv");
  const logDir = path.join(dataDir, "log");

  await fs.mkdir(configDir, { recursive: true });
  await fs.mkdir(cvDir, { recursive: true });
  await fs.mkdir(logDir, { recursive: true });

  // Base Profile
  const profile = {
    fullName: "Your Name",
    email: "you@example.com",
    location: "Remote / Worldwide",
    headline: "Software Engineer",
    targetRoles: [
      "AI Full Stack Engineer",
      "Backend Engineer",
      "Software Engineer",
    ],
    salaryFloor: 150000,
    targetMax: 300000,
    workAuthorized: true,
    requiresSponsorship: false,
    isDemo: true,
    onboarded: true,
  };
  await fs.writeFile(
    path.join(configDir, "profile.json"),
    JSON.stringify(profile, null, 2),
  );

  // Prefs
  const prefs = {
    autonomy: true,
    autoHunt: true,
    autoSubmit: true,
    liveApply: false,
    liveSubmit: false,
    autoSubmitMinScore: 4,
    minAutoScore: 4,
    dailyCap: 10,
    perCap: 2,
    companyCap: 2,
    scanIntervalMin: 30,
    scanInterval: 30,
  };
  await fs.writeFile(
    path.join(configDir, "prefs.json"),
    JSON.stringify(prefs, null, 2),
  );

  // Companies
  const companies = [
    ...GREENHOUSE_TOKENS.map((token) => ({
      name: token.charAt(0).toUpperCase() + token.slice(1),
      token,
      ats: "greenhouse",
      enabled: true,
    })),
    ...LEVER_TOKENS.map((token) => ({
      name: token.charAt(0).toUpperCase() + token.slice(1),
      token,
      ats: "lever",
      enabled: true,
    })),
  ];
  await fs.writeFile(
    path.join(dataDir, "companies.json"),
    JSON.stringify(companies, null, 2),
  );

  // Jobs
  let allJobs = [];
  for (const token of GREENHOUSE_TOKENS) {
    allJobs.push(...(await fetchGreenhouse(token)));
  }
  for (const token of LEVER_TOKENS) {
    allJobs.push(...(await fetchLever(token)));
  }

  // Filter
  allJobs = allJobs.filter(
    (j) => KEEP_REGEX.test(j.title) && !DROP_REGEX.test(j.title),
  );

  // Score and distribute statuses
  const jobs = allJobs.map((j, i) => {
    const r = (i * 13) % 100;

    let status = "scored";
    let score = 3 + ((i * 7) % 3);
    let grade = score === 5 ? "A" : score === 4 ? "B" : "C";
    let matchPercent = 60 + ((i * 11) % 40);
    let parked = false;
    let parkReason = null;
    let hasCv = false;

    // Spread across pipeline
    if (r < 5) {
      status = "interview";
      score = 5;
      grade = "A";
      matchPercent = 95;
    } else if (r < 15) {
      status = "applied";
      score = 4 + (i % 2);
      grade = score === 5 ? "A" : "B";
    } else if (r < 25) {
      status = "scored";
      parked = true;
      parkReason = "Requires clearance";
    } else if (r < 35) {
      status = "cv_ready";
      hasCv = true;
    }

    return {
      ...j,
      status,
      score,
      grade,
      matchPercent,
      parked,
      parkReason,
      hasCv,
      reasons: [
        "Strong AI background",
        "Matches preferred location",
        "Modern tech stack",
      ],
      gaps: ["No direct management experience mentioned"],
      legitimacy: "Looks like a real, active posting.",
    };
  });

  await fs.writeFile(
    path.join(dataDir, "jobs.json"),
    JSON.stringify(jobs, null, 2),
  );

  // Write CV
  const baseCv =
    "## Summary\nExperienced AI Engineer with a focus on autonomous agents and platform architecture.\n\n## Experience\n- **Senior Software Engineer**, Tech Corp (2020 - Present)\n  Built ML pipelines and agentic tooling.\n";
  await fs.writeFile(path.join(cvDir, "base.md"), baseCv);

  // Empty states
  await fs.writeFile(path.join(dataDir, "runs.json"), JSON.stringify([]));
  await fs.writeFile(path.join(logDir, "activity.jsonl"), "");
  await fs.writeFile(path.join(dataDir, "activity.json"), JSON.stringify([]));
  await fs.writeFile(path.join(dataDir, ".cycle-lock"), "");

  console.log(
    "Seeded " +
      jobs.length +
      " demo jobs across " +
      companies.length +
      " companies.",
  );
}

run().catch(console.error);
