import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
// updated imports: bring in fetch helpers and types used below
import type {
  GitHubProfile,
  GitHubRepo,
  GitHubEvent,
  GitHubCommit,
  GitHubContributorStats,
  GitHubLanguages,
  GitHubGist
} from "./github";
import { fetchUserTopReposDetailed, fetchUserGists, fetchRepoDetails } from "./github";

const groq = createGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

function sanitizeJSON(str: string) {
  return str
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export interface RoastResult {
  roast: string[];
  feedback: string[];
  overallScore: number;
  codeQuality: {
    score: number;
    tips: string[];
  };
  productivity: {
    score: number;
    tips: string[];
  };
  collaboration: {
    score: number;
    tips: string[];
  };
}

export const analyzeProfileWithGroq = async (
  profile: GitHubProfile,
  repos: GitHubRepo[],
  events: GitHubEvent[],
  readme: string | null
): Promise<RoastResult> => {

  // --- NEW: ensure the variables referenced in the prompt exist and are populated ---
  // Aggressively truncate README to 1000 chars
  let topReadme: string | null = readme ? readme.slice(0, 1000) : null;
  let topRepoCommits: (GitHubCommit | string)[] | null = null;
  let topRepoLanguages: GitHubLanguages | null = null;
  let contributorStats: GitHubContributorStats[] | null = null;
  let gistSummary: GitHubGist[] | null = null;

  const username = profile?.login;
  if (!username) {
    throw new Error("Invalid profile: Username is missing.");
  }

  if (username) {
    try {
      // Fetch only the single most top repo detailed data
      const top = await fetchUserTopReposDetailed(username, 1).catch(() => []);
      if (top && top.length > 0) {
        // If we didn't get a readme from the caller (most starred), use the one from the most recent repo
        if (!topReadme && top[0].readme) {
          topReadme = top[0].readme.slice(0, 1000);
        }
        topRepoCommits = top[0].commits ?? [];
        topRepoLanguages = top[0].languages ?? {};
        contributorStats = top[0].contributorStats ?? null;
      }
    } catch (e) {
      // swallow errors and leave defaults
      topReadme = topReadme ?? null;
      topRepoCommits = topRepoCommits ?? [];
      topRepoLanguages = topRepoLanguages ?? {};
      contributorStats = contributorStats ?? null;
    }

    try {
      gistSummary = await fetchUserGists(username).catch(() => []);
    } catch (e) {
      gistSummary = gistSummary ?? [];
    }
  }
  // --- END NEW BLOCK ---

  // --- Existing fallback: ensure prompt fields exist on the top repos (only fetch when missing) ---
  if (username && Array.isArray(repos)) {
    // Limit to checking top 3 repos to save time/tokens
    const limit = Math.min(3, repos.length);
    for (let i = 0; i < limit; i++) {
      const r = repos[i];
      const missing = r == null
        || typeof r.updated_at === "undefined"
        || typeof r.stargazers_count === "undefined"
        || typeof r.forks_count === "undefined"
        || typeof r.size === "undefined";
      if (missing) {
        try {
          const details = await fetchRepoDetails(username, r?.name);
          if (details) {
            repos[i] = { ...r, ...details };
          }
        } catch (e) {
          // swallow - leave existing values as-is
        }
      }
    }
  }
  // --- end existing fallback ---

  // Limit repo summary to top 3
  const repoSummary = repos.slice(0, 3).map(r => ({
    name: r.name,
    description: r.description ? r.description.slice(0, 50) : null, // Aggressively truncate description
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    updated_at: r.updated_at,
    size: r.size
  }));

  // Limit event summary to top 3, truncate commits heavily
  const eventSummary = events.slice(0, 3).map(e => ({
    type: e.type,
    repo: e.repo.name,
    created_at: e.created_at,
    commits: e.payload.commits?.map(c => c.message.slice(0, 50)).slice(0, 1) // Only 1 commit per event, max 50 chars
  }));

  // Process commits: take top 5, truncate message to 50 chars
  const processedCommits = topRepoCommits?.slice(0, 5).map(c => {
    if (typeof c === 'string') return c.slice(0, 50);
    return {
      ...c,
      commit: {
        ...c.commit,
        message: c.commit.message.slice(0, 50)
      }
    };
  });

  const prompt = `
You are a dual-personality AI with two extreme modes. NO MERCY. NO FILTER. NO CHILL.

1. “THE ROASTER — TOXIC DEMON MODE”

You are the most ruthless, sharp-tongued roaster imaginable.
Your job is to tear apart this person’s ACTUAL GitHub work — not random insults, but precise, surgical criticism targeting the exact code, repositories, commits, and decisions they made.

MANDATORY ROASTING RULES (FOLLOW EXACTLY):

Every roast line MUST be 100% grounded in the real data provided below.

NO generic lines. NO vague criticism. Use exact repository names, commit messages, file names, languages, dates, and numbers.

All 7 lines must attack completely different aspects of their real work. No repetition of facts or style.

Vary sentence style in every line (freely mix these styles):
→ Direct attack: “Seeing a repository named ‘weather-app-final-final-v3’ makes me question every life choice that led here.”
→ Fake sympathy: “Oh wow… you pushed ‘portfolio-v15’ back in 2023 and then just vanished — was that a planned retirement?”
→ Threat-style warning: “If you commit ‘fix typo’ one more time without context, your GitHub history might file a restraining order.”
→ Sarcastic praise: “Impressive — 187 lines of JavaScript containing 42 console.logs. Truly groundbreaking debugging philosophy.”
→ Question roast: “Why does the ‘login-page’ folder have 8 separate CSS files? Is every button following its own religion?”
→ Storytelling: “Once upon a time, a developer built ‘node-js-backend’… then didn’t update package.json for 14 months… and thus a legend of neglect was born.”
→ Pure disgust: “Reading this README felt like a stress test for my remaining brain cells.”

Rotate harsh language creatively. Do not reuse the same insult twice.

Use different emoji combinations in every line.

2. “THE MENTOR — GENTLE GURU MODE” (unchanged)
After total destruction, instantly become the kindest senior dev who genuinely wants them to grow. Give deep, honest, super-actionable advice based on their actual code/repos.

DATA PROVIDED (USE EVERYTHING – THIS IS THEIR REAL WORK):
${JSON.stringify({
  profile,
  topRepos: repoSummary,
  events: eventSummary,
  readme: topReadme,
  commits: processedCommits,
  languages: topRepoLanguages,
  totalCommitsInTopRepo: contributorStats?.[0]?.total,
  gists: gistSummary?.slice(0, 3),
  topRepoName: repoSummary[0]?.name,
  topRepoLang: repoSummary[0]?.language,
  topRepoLastUpdate: repoSummary[0]?.updated_at,
  topRepoStars: repoSummary[0]?.stargazers_count,
  topRepoForks: repoSummary[0]?.forks_count,
  topRepoSize: repoSummary[0]?.size,
})}
GIVE SCORE FROM 1-100 FOR EACH CATEGORY BASED ON THEIR ACTUAL WORK
OUTPUT ONLY THIS EXACT JSON (NO EXTRA TEXT, NO MARKDOWN):
{
  "roast": [
    "Line 1: Surgical strike on their actual top repo/code",
    "Line 2: Different angle, exact commit message roast",
    "Line 3: Different angle, exact date/abandonment roast",
    "Line 4: Different angle, exact README/language roast",
    "Line 5: Different angle, exact activity/graph roast",
    "Line 6: Different angle, exact stars/forks/gists roast",
    "Line 7: Final different angle, pure venom on their real work"
  ],
  "feedback": [
    "Genuine encouraging point 1 based on their actual work",
    "Genuine encouraging point 2",
    "Genuine encouraging point 3",
    "Genuine encouraging point 4",
    "Genuine encouraging point 5",
    "Genuine encouraging point 6",
    "Genuine encouraging point 7"
  ],
  "overallScore": number,
  "codeQuality": { "score": number, "tips": ["Real tip 1", "Real tip 2"] },
  "productivity": { "score": number, "tips": ["Real tip 1", "Real tip 2"] },
  "collaboration": { "score": number, "tips": ["Real tip 1", "Real tip 2"] }
}
`;

 try {
  const result = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt,
  });

  const clean = sanitizeJSON(result.text);
  return JSON.parse(clean) as RoastResult;

} catch (err: any) {
  const msg = err?.message || "";

  // Groq rate-limit / TPM error
  if (
    msg.includes("Rate limit reached") ||
    msg.includes("tokens per minute") ||
    msg.includes("TPM")
  ) {
    throw new Error(
      "⏳ Too many requests right now. Please wait a few seconds and try again."
    );
  }

  // Fallback
  throw new Error("⚠️ Something went wrong. Please try again later.");
}


  // const text = result.text;
  // const clean = sanitizeJSON(text);

  // return JSON.parse(clean) as RoastResult;
};
