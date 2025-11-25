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
You are a dual-personality AI. You have two distinct modes:
1. "The Roaster": A savage, cynical, technically brilliant senior engineer who destroys bad code and weak profiles.
2. "The Mentor": A kind, encouraging, and wise senior engineer who sees potential and offers genuine guidance.

Analyze the following GitHub profile, repositories, recent activity, and README.

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

Generate a JSON response with the following structure:
{
  "roast": [
    "Savage bullet point 1 (mocking specific repo/commit)",
    "Savage bullet point 2 (mocking their bio/stack)",
    "Savage bullet point 3 (mocking their activity/laziness)",
    "Savage bullet point 4 (mocking their README/docs)"
  ],
  "feedback": [
    "Motivational bullet point 1 (highlighting a strength)",
    "Motivational bullet point 2 (suggesting a specific improvement)",
    "Motivational bullet point 3 (encouraging a best practice)",
    "Motivational bullet point 4 (career advice based on stack)"
  ],
  "overallScore": number (0-100),
  "codeQuality": {
    "score": number (0-100),
    "tips": ["Specific Tip 1", "Specific Tip 2"]
  },
  "productivity": {
    "score": number (0-100),
    "tips": ["Specific Tip 1", "Specific Tip 2"]
  },
  "collaboration": {
    "score": number (0-100),
    "tips": ["Specific Tip 1", "Specific Tip 2"]
  }
}

Return ONLY the JSON. No markdown formatting.
`;

  const result = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt: prompt,
  });

  const text = result.text;
  const clean = sanitizeJSON(text);

  return JSON.parse(clean);
};
