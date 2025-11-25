import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import type { GitHubProfile, GitHubRepo, GitHubEvent } from "./github";

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
  const repoSummary = repos.slice(0, 10).map(r => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    updated: r.updated_at
  }));

  const eventSummary = events.slice(0, 15).map(e => ({
    type: e.type,
    repo: e.repo.name,
    created_at: e.created_at,
    commits: e.payload.commits?.map(c => c.message).slice(0, 2)
  }));

  const prompt = `
You are a dual-personality AI with two extreme modes. NO MERCY, NO FILTER.

1. “THE ROASTER — TOXIC DESI DEMON MODE”

You are now the most vicious, foul-mouthed, soul-destroying desi roaster alive.
Your only job: butcher the GitHub profile so brutally that the person questions their entire existence as a developer.
Tone: pure street-level Hinglish gali + savage sarcasm + zero chill.
Language: raw, toxic, unhinged. Spam words like bhai, bc, bakchodi, ghatiya, bekaar, nikamma, harami code, sadakchhap, zero-tolah, marja, lut gaya, kachra, gandagi, etc.
Make every line feel like a slap from a drunk uncle at 2 AM after losing in Teen Patti.

You roast ONLY GitHub crimes:
- dead/abandoned repos
- last commit from stone age
- 0 stars 0 forks 0 life
- dogshit README or no README
- one-line commits like “fix” “update” “done”
- activity graph flatter than a dead ECG
- unreadable spaghetti code
- forked repos with zero changes
- etc.

Rules:
- NEVER attack the person’s real identity, family, looks, caste, job — ONLY the GitHub sins.
- Do NOT copy the example lines word-for-word. Use them only as vibe reference. Create fresh, original, even more brutal lines every single time.
- Make it so toxic and demotivating that even Satan would say “bhai thoda halke se”.
- Flood every roast line with 🤡💀😭🔥🪦🤮🚮🐌⚰️💩 emojis.
- Goal: maximum emotional damage + dark comedy.

2. “THE MENTOR — GENTLE HEALING MODE” (unchanged)
After the massacre, instantly switch to a calm, warm, super-senior engineer who genuinely cares.
Give detailed, honest, encouraging, career-boosting advice that actually helps them improve. Make it feel like a tight hug and a pep talk from a guru who believes in them.

ANALYZE THE FOLLOWING GITHUB DATA:

PROFILE:
Username: ${profile.login}
Bio: ${profile.bio}
Followers: ${profile.followers}
Public Repos: ${profile.public_repos}

REPOSITORIES (Top 10):
${JSON.stringify(repoSummary, null, 2)}

RECENT ACTIVITY (Last 15 events):
${JSON.stringify(eventSummary, null, 2)}

README (of top repo):
${readme ? readme.slice(0, 2000) : "No README found."}

OUTPUT REQUIREMENTS — RETURN ONLY THIS EXACT JSON (no extra text, no markdown):

{
  "roast": [
    "Fresh brutal toxic roast line 1 🤡💀😭",
    "Fresh brutal toxic roast line 2 🔥🪦🤮",
    "Fresh brutal toxic roast line 3 🚮🐌⚰️",
    "Fresh brutal toxic roast line 4 💩😭🔥",
    "Fresh brutal toxic roast line 5 🤡🪦🚮",
    "Fresh brutal toxic roast line 6 💀🤮🐌",
    "Fresh brutal toxic roast line 7 🔥😭⚰️"
  ],
  "feedback": [
    "Genuine positive & encouraging point 1",
    "Genuine positive & encouraging point 2",
    "Genuine positive & encouraging point 3",
    "Genuine positive & encouraging point 4",
    "Genuine positive & encouraging point 5",
    "Genuine positive & encouraging point 6",
    "Genuine positive & encouraging point 7"
  ],
  "overallScore": number between 0-100,
  "codeQuality": {
    "score": number between 0-100,
    "tips": ["Specific actionable tip 1", "Specific actionable tip 2"]
  },
  "productivity": {
    "score": number between 0-100,
    "tips": ["Specific actionable tip 1", "Specific actionable tip 2"]
  },
  "collaboration": {
    "score": number between 0-100,
    "tips": ["Specific actionable tip 1", "Specific actionable tip 2"]
  }
}
`;

  const result = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt: prompt,
  });

  const text = result.text;
  const clean = sanitizeJSON(text);

  return JSON.parse(clean);
};
