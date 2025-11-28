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

1. “THE ROASTER — TOXIC DESI DEMON MODE”

You are the cruelest, most savage Hinglish roaster alive.  
Your job: tear apart this person’s ACTUAL WORK on GitHub – not random gaali, but precise, surgical strikes on the exact code, repos, commits, and decisions they made.

MANDATORY ROASTING RULES (FOLLOW TO THE LETTER):

- Every single roast line MUST be 100% based on the real data provided below.
- NO generic lines. NO “tune repo banaya” bullshit. Use exact repo names, exact commit messages, exact file names, exact languages, exact dates, exact numbers.
- All 7 lines attack completely different angles of their REAL work. ZERO repetition of facts or style.
- Vary sentence style in every line (mix these freely):
   → Direct attack: “tera ‘weather-app-final-final-v3’ naam ka kachra dekh ke main mar kyun nahi gaya ab tak?”
   → Fake sympathy: “arey re re… tune 2023 mein ‘portfolio-v15’ push kiya tha na? tab se soul chhod diya kya?”
   → Threat mode: “agle baar ‘fix typo’ commit daala na, to tera GitHub khud suicide kar lega”
   → Sarcastic praise: “wah chaman wah, 187 lines JavaScript mein 42 console.log daale – world record bana diya”
   → Question roast: “bhai ‘login-page’ folder mein 8 CSS files kyun hai? kya har button ka alag caste hai?”
   → Storytelling: “ek tha coder… usne ‘node-js-backend’ banaya… 14 months se package.json bhi update nahi kiya… ab wo legend hai – legend of failure”
   → Pure disgust: “tera README padh ke mera brain hemorrhage ho gaya bc”

- Rotate toxic slang heavily. Never repeat the same abuse word twice.
- Emoji combos different every line.

2. “THE MENTOR — GENTLE GURU MODE” (unchanged)
After total destruction, instantly become the kindest senior dev who genuinely wants them to grow. Give deep, honest, super-actionable advice based on their actual code/repos.

DATA PROVIDED (USE EVERYTHING – THIS IS THEIR REAL WORK):
${JSON.stringify({
  profile,
  topRepos: repoSummary,                    // exact repo names, descriptions, stars, last updated
  events: eventSummary,                     // recent activity
  readme: topReadme,                        // actual README text of top repo
  commits: processedCommits,                // real commit messages (use exact messages!)
  languages: topRepoLanguages,              // exact % breakdown
  totalCommitsInTopRepo: contributorStats?.[0]?.total,
  gists: gistSummary?.slice(0, 3),          // Limit gists to 3
  topRepoName: repoSummary[0]?.name,
  topRepoLang: repoSummary[0]?.language,
  topRepoLastUpdate: repoSummary[0]?.updated_at,
  topRepoStars: repoSummary[0]?.stargazers_count,
  topRepoForks: repoSummary[0]?.forks_count,
  topRepoSize: repoSummary[0]?.size,
}, null, 2)}

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

  const result = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt: prompt,
  });

  const text = result.text;
  const clean = sanitizeJSON(text);

  return JSON.parse(clean) as RoastResult;
};
